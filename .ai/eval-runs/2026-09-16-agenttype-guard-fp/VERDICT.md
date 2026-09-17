# VERDICT — P5b.2: hook `workflow-agenttype-guard` run against every persisted workflow script

Spec: `.ai/specs/2026-09-16-workflow-first-orchestration.md`, phase P5b.
Human-STOP: **yes** (Q2) — this file measures, it does not decide acceptance.

## Method

`find ~/.claude/projects -path '*workflows/scripts/*.js'` on this machine, 2026-09-17.
For each script, fed `{"tool_name":"Workflow","tool_input":{"scriptPath":"<path>"}}` on stdin to
`node hooks/workflow-agenttype-guard.js`, recorded the exit code and stderr, then read every
flagged line by hand in the source file to classify TP/FP.

**N = 17 scripts.**

## Result summary

| Outcome | Count |
|---|---|
| exit 0, silent (no `agent(` issue at all) | 2 |
| exit 0, note in stderr ("undecidable" — options passed as a variable, not a literal) | 9 |
| exit 2, blocked | 6 |

Counts corrected 2026-09-17 to match the detail tables below (6 rows in "Blocked scripts",
9 rows in "Exit-0-with-note") and a live re-run of `hooks/workflow-agenttype-guard.js` against
the same 17 scripts on disk (6 blocked / 9 note / 2 silent); the original summary read 7/8/2,
an arithmetic slip that did not affect the FP=0 conclusion below.

**FP count: 0.** Every blocked script contains at least one real `agent()` call whose options
object is a literal missing the `agentType` key (verified by reading the flagged line in each
file below). No human override decision was needed for any blocked script.

The 9 "undecidable" scripts (exit 0, note only, never blocked) were not fully hand-verified for
whether `agentType` is actually present inside the referenced variable — the hook itself
documents this class as statically unresolvable, and P5a.2 already covers it as an accepted
non-blocking gap, not a false positive to adjudicate here.

## Blocked scripts (TP/FP table)

| Script | Line(s) | TP/FP | Reason |
|---|---|---|---|
| `voxtype-notion-spike-and-spec-wf_0824d076-d64.js` | 76, 85, 99 | TP | Three literal `agent()` options objects (`{ label: 'spike:...', phase, schema }`, `{ label: 'spec-writer', phase }`, `{ label: 'critic', phase }`) — none has `agentType`. |
| `voxtype-notion-spike-c-wf_70be6475-565.js` | 54, 63 | TP | `{ label: 'spike:...', phase, schema, model }` and `{ label: 'spec-writer', phase, model }` — no `agentType` in either. |
| `diagnoza-nakladka-nie-wyskakuje-wf_3227fe3d-ad3.js` | 68 | TP (expected, per spec Done-when) | `agent(t.prompt, { label: 'kolektor:${t.key}', phase: 'Collect', model: 'sonnet' })` — collector calls, no `agentType`. |
| `medfile-sync-fazy-3-5-wf_3dbc5b63-ac5.js` | 69 | TP | `integruj` helper: `agent(..., { schema: INT_SCHEMA, label: 'Integracja ${etykieta}', phase, effort })` — no `agentType`. (Other calls in the same file, e.g. line 25 `{ agentType: f.type, ... }` and lines 141/154 `{ agentType: 'sailes-app-builder:checker', ... }`, do carry it and are correctly not flagged.) |
| `naprawa-sync-medfile-wf_2a2a84d5-da4.js` | 142 | TP | `agent(z.prompt, { label: z.label, phase: 'F0 Diagnostyka', model: 'sonnet', schema: SCHEMA_DIAG })` — no `agentType`. |
| `testy-naprawy-sync-medfile-wf_6545c224-6cd.js` | 91, 92, 178 | TP | Two `regresja:*` calls (`{ label, phase: 'Regresja', model, schema }`) and one `test:*` call (`{ label, phase: 'Nowe testy', model, schema }`) — none has `agentType`. |

`wf_3227fe3d-ad3` (the diagnostic collectors, explicitly named in the spec's Done-when as the
expected true positive) is blocked, confirming the guard fires on a real artifact.

## Exit-0-with-note scripts (undecidable, not blocked)

| Script | Line | Note |
|---|---|---|
| `sailes-1350-p0-rerun-wf_f63f5640-6d1.js` | 8 | options not a literal object |
| `medfile-sync-domkniecie-fe-qa-wf_5de2ebe4-eca.js` | 19 | options not a literal object |
| `medfile-sync-faza5-testy-qa-wf_77d7c353-4d5.js` | 59 | options not a literal object |
| `zawsze-popup-auto-przerwa-wf_2fb79243-84e.js` | 41 | options not a literal object |
| `sailes-1350-p0-measure-wf_bd749c00-327.js` | 11 | options not a literal object |
| `sailes-1350-wave1-fixes-wf_9f0a06c6-83e.js` | 9 | options not a literal object |
| `sailes-1350-wave1-impl-wf_176ebaa2-236.js` | 49 | options not a literal object |
| `sailes-1350-wave2-wf_3d65db17-b38.js` | 10 | options not a literal object |
| `sailes-gate-placement-abc-wf_bfef201f-177.js` | 15 | options not a literal object |

## Exit-0-silent scripts (no issue found)

`sailes-workflow-research-wf_c7c25bee-3b3.js`, `medfile-sync-fazy-2-5-wf_b3ebe4a2-47e.js`.

## Open measurement gap (carried forward, not resolved here)

The **PreToolUse payload shape for the `Workflow` tool is unmeasured** (P0.5 in the spec). This
run drives the hook directly with the shape the hook's own code and test suite assume
(`{"tool_name":"Workflow","tool_input":{"scriptPath": "..."}}`), read from
`hooks/workflow-agenttype-guard.js`'s own parsing — it has **not** been confirmed against a real
Claude Code `PreToolUse` invocation for the `Workflow` tool. If the real payload differs (e.g. a
different key than `scriptPath`, or `tool_input` nested differently), the hook — per its own
fail-open design (`hooks/workflow-agenttype-guard.js`: unreadable/absent script → exit 0 with a
note, never blocks) — would silently stop firing rather than misfire. That means this FP=0 result
is a measurement of the hook's logic against real script bodies, not a measurement of the hook
wired into a live Claude Code session; P0.5 remains the phase that closes that gap.

**No acceptance decision is made here.** This is the Q2 Human-STOP measurement only.

## Re-run under Q2′ (2026-09-17)

Spec 1.35.0, decision row Q2′ (`.ai/specs/2026-09-16-workflow-first-orchestration.md`) changes the
hook: `agentType` absent but `model` present is no longer a block — it is allowed with a role
suggestion (`hookSpecificOutput.additionalContext` on stdout, no `permissionDecision`). Only
`agentType` absent **and** `model` absent (including no options object at all) still blocks
(exit 2). This section re-runs the same measurement — `find ~/.claude/projects -path
'*workflows/scripts/*.js'`, fed `{"tool_name":"Workflow","tool_input":{"scriptPath":"<path>"}}` on
stdin — against the updated `hooks/workflow-agenttype-guard.js`.

**N = 19 scripts** (two more than the 2026-09-16 run: `sailes-1350-p2fix-and-eval-p47-wf_c3997ee7-3f6.js`
and `sailes-1350-hook-q2prime-wf_4fe01078-421.js`, both saved since — both classify as
"note (undecidable)" below).

### Outcome counts

| Outcome | Count |
|---|---|
| blocked (exit 2, class 2 — neither agentType nor model) | 2 |
| allowed-with-suggestion (exit 0, stdout additionalContext, class 1 — model present, no agentType) | 4 |
| note (exit 0, stderr note — undecidable: options is a variable/spread) | 11 |
| silent (exit 0, nothing on either stream) | 2 |

19 = 2 + 4 + 11 + 2. Every script that blocked under the 2026-09-16 (Q2) run and now does not is
accounted for in "allowed-with-suggestion" below — none dropped silently.

### Blocked (TP/FP, hand-classified)

| Script | Line(s) | TP/FP | Reason |
|---|---|---|---|
| `voxtype-notion-spike-and-spec-wf_0824d076-d64.js` | 76, 85, 99 | TP | Three literal options objects (`{ label, phase, schema }` / `{ label, phase }` / `{ label, phase }`) — neither `agentType` nor `model` in any. Non-Sailes repo (omarchy/voxtype); would silently run on the session's Opus. |
| `medfile-sync-fazy-3-5-wf_3dbc5b63-ac5.js` | 69 | TP | `integruj` helper: `agent(..., { schema: INT_SCHEMA, label: 'Integracja ${etykieta}', phase, effort })` — neither `agentType` nor `model`. Same real defect as the 2026-09-16 run; unaffected by Q2′ because it never carried a `model`. |

Both are the same two scripts flagged as TP in the 2026-09-16 run that lacked a `model` override;
still correctly block under Q2′.

### Allowed-with-suggestion (previously blocked under Q2, now class 1)

| Script | Line(s) | Note |
|---|---|---|
| `voxtype-notion-spike-c-wf_70be6475-565.js` | 54, 63 | `model` present in both (`{ label, phase, schema, model }`, `{ label, phase, model }`) — deliberate override, not drift. |
| `diagnoza-nakladka-nie-wyskakuje-wf_3227fe3d-ad3.js` | 68 | `{ label, phase: 'Collect', model: 'sonnet' }` — the collector call the original spec's Done-when named as the expected TP under Q2; under Q2′ it is a deliberate `model` override and correctly downgrades to a suggestion, not a block. This is the spec's own worked example of *why* Q2′ exists, not a regression. |
| `naprawa-sync-medfile-wf_2a2a84d5-da4.js` | 142 | `{ label, phase: 'F0 Diagnostyka', model: 'sonnet', schema: SCHEMA_DIAG }` — `model` present. |
| `testy-naprawy-sync-medfile-wf_6545c224-6cd.js` | 91, 92, 178 | All three carry `model` (`{ label, phase, model, schema }`). |

Of the six scripts the 2026-09-16 (Q2) run blocked, these four carried an explicit `model` and now
allow-with-suggestion; the other two (above) carried neither `agentType` nor `model` and still
block. (The spec's Q2′ decision-row prose says "5 z nich z jawnym model" — this hand re-verification
of the actual flagged lines on disk finds 4 of 6, with `medfile-sync-fazy-3-5` and
`voxtype-notion-spike-and-spec` both lacking `model`; noted as a discrepancy against the spec's
summary figure, not adjudicated here.)

### Note (undecidable, unchanged from Q2 — behavior did not change for this class)

`sailes-1350-p0-rerun-wf_f63f5640-6d1.js`, `medfile-sync-domkniecie-fe-qa-wf_5de2ebe4-eca.js`,
`medfile-sync-faza5-testy-qa-wf_77d7c353-4d5.js`, `zawsze-popup-auto-przerwa-wf_2fb79243-84e.js`,
`sailes-1350-hook-q2prime-wf_4fe01078-421.js` (new), `sailes-1350-p0-measure-wf_bd749c00-327.js`,
`sailes-1350-p2fix-and-eval-p47-wf_c3997ee7-3f6.js` (new), `sailes-1350-wave1-fixes-wf_9f0a06c6-83e.js`,
`sailes-1350-wave1-impl-wf_176ebaa2-236.js`, `sailes-1350-wave2-wf_3d65db17-b38.js`,
`sailes-gate-placement-abc-wf_bfef201f-177.js` — each has an `agent(p, opts)` call where `opts` is a
variable (or the whole call is dynamically built), so the mask cannot tell whether `agentType` is
present. Same accepted non-blocking gap as P5a.2, not re-adjudicated here.

### Silent (unchanged)

`sailes-workflow-research-wf_c7c25bee-3b3.js`, `medfile-sync-fazy-2-5-wf_b3ebe4a2-47e.js`.

### Conclusion

FP count under Q2′: **0** — both blocks are real drift (no `agentType`, no `model`, would silently
inherit the session model). Q2′'s intended effect is visible directly: 4 of the 6 real blocks from
the 2026-09-16 measurement are now allowed-with-suggestion because they already carried a
deliberate `model` override, leaving only the two genuine silent-fallback cases blocked. No new FP
introduced by the re-scoped rule. No acceptance decision is made here — this is the measurement only.

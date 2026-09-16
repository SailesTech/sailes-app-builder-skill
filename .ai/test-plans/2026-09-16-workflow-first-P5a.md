Status: DERIVED
Lane: middle (per phase `Lane:` line) — no human freeze STOP; moved DRAFT → DERIVED by the tester
per `sailes-test` step 2, binding under the no-weakening rule in step 4.
Phase: P5a — hook `hooks/workflow-agenttype-guard.js` (spec `2026-09-16-workflow-first-orchestration.md`)
Tier: B (phase `Lane:` line: "middle — tier B: blokuje wywołania narzędzia w każdym repo")
Derived from: spec sections "### P5a —" (lines 338-363) and "### Narzędzia" (lines 129-139) only.
Implementation and `hooks/workflow-agenttype-guard.test.js` were **not read** before this list was drafted.

## Could not derive from the spec (open questions — no human freeze in this lane, so resolved by
reading the implementation's own contract in step 3, and recorded here as assumptions, not silently)

1. **Exact JSON shape of the `PreToolUse` payload for the `Workflow` tool** — the spec explicitly
   says "Kształt payloadu `PreToolUse` dla `Workflow` ustala P0" (P0 out of scope for this read).
   Field names (`tool_name` vs `tool`, `tool_input.script` vs `script` at top level, etc.) are
   unknown from P5a/Narzędzia text alone. Resolved by reading the implementation's own parsing code
   in step 3 and mirroring the concrete shape it expects — this is the one place where "implementation
   unread" necessarily ends, exactly as the ordering intends.
2. **Exact wording of the block message** — spec says "komunikat wskazujący linię i regułę" (line +
   rule). No exact string is specified. Tests assert on *substance* (message names a line number and
   a rule identifier), never on incidental wording, unless the implementation's own doctrine
   (`AGENTS.md`) pins a format.
3. **Malformed/unparseable stdin, or a `scriptPath` naming a file that does not exist** — not named
   by the P5a text or its Done-when list (which names exactly three partitions: no options,
   options without `agentType`, string/comment). Left untested; not fabricated. If the human wants
   this covered, it is a scope addition, not a gap in this plan.
4. **Line-attribution when multiple `agent(` calls appear in one script** — not spelled out as a
   separate case, but is a direct, unavoidable consequence of "wskazujący linię": the message must
   name the correct line, not just detect a match somewhere in the file. Included as P5a-B12.

## Behavior IDs, equivalence partitions (including invalid), and boundaries

Stateless single-shot filter: one stdin JSON payload in, one exit code (+ optional stderr) out.
No multi-step state machine to transition through, so no separate state-transition table — the
"illegal transition" role is played by the invalid/undecidable input partitions below (B6/B7/B8/B11).

| ID | Partition | Trigger (tool / source) | `agent(` call shape | `agentType` present? | Statically decidable? | Expected exit | Expected stderr |
|---|---|---|---|---|---|---|---|
| P5a-B1 | invalid: call with zero args | Workflow, inline `script` | `agent(` with **no second argument at all** | n/a (absent) | yes | 2 | names line + rule |
| P5a-B2 | invalid: options object missing key | Workflow, inline `script` | `agent(p, { ...no agentType... })` object literal | absent | yes | 2 | names line + rule |
| P5a-B3 | valid: baseline negative | Workflow, inline `script` | `agent(p, { agentType: '...', ... })` | present | yes | 0 | none |
| P5a-B4 | invalid, via file | Workflow, `scriptPath` file | file body has call missing `agentType` | absent | yes | 2 | names line + rule |
| P5a-B5 | valid, via file | Workflow, `scriptPath` file | file body fully valid | present | yes | 0 | none |
| P5a-B6 | saved workflow by name | Workflow, neither `script` nor `scriptPath`, has `name` | n/a — content unresolvable | n/a | n/a — hook does not guess registry path | 0 | note explaining content not resolvable from payload |
| P5a-B7 | no script, generic | Workflow, none of `script`/`scriptPath`/`name` | n/a | n/a | n/a | 0 | none (silent, distinct from B6's note) |
| P5a-B8 | wrong tool | non-Workflow tool (e.g. `Bash`), any/no script-like content | n/a | n/a | n/a | 0 | none (silent no-op regardless of content) |
| P5a-B9 | call in string literal | Workflow, inline `script` | `agent(` text appears only inside a string literal | n/a | n/a — not a real call | 0 | none |
| P5a-B10 | call in comment | Workflow, inline `script` | `agent(` text appears only inside `//` or `/* */` comment | n/a | n/a — not a real call | 0 | none |
| P5a-B11 | options via variable | Workflow, inline `script` | `agent(p, opts)` where `opts` is an identifier, not an object literal | unknown | **no** — statically undecidable | 0 | report/note about the undecidable call |
| P5a-B12 | multi-call line attribution | Workflow, inline `script` | two `agent(` calls: one valid, one missing `agentType` | mixed | yes | 2 | names the line of the **offending** call, not the valid one |

Decision-table shape: columns above ARE the decision table (trigger × call shape × agentType
presence × decidability → exit/stderr). Twelve rows cover every partition named by P5a.1/P5a.2's
prose plus the invalid/undecidable classes tier B requires, plus the line-number boundary implied
by "wskazujący linię".

## Done-when (from spec, unchanged)
`node hooks/workflow-agenttype-guard.test.js` → exit 0; detection proof for each of the three
spec-named partitions (no options → B1/B4; options without `agentType` → B2/B4; string/comment →
B9/B10) plus the additional partitions above, each proven by breaking that behavior's own code,
showing the matching test go red, reverting, and confirming the suite green again.

## Defect found (frozen assertion, not weakened — reported, fixed by be-dev)

**P5a-B7 was RED against the real implementation** when this suite was first written:
`hooks/workflow-agenttype-guard.js` `resolveScript()` did not distinguish "saved workflow invoked
by `name`" (P5a-B6, spec: note in stderr) from the generic "no `script`/`scriptPath` and no `name`
either" case (P5a-B7, spec's Narzędzia/P5a.1 clause "brak skryptu / inne narzędzie → exit 0
**cicho**", i.e. silent, the same outcome as the other-tool case P5a-B8). The `else` branch of
`resolveScript` always returned the "likely a saved workflow invoked by `name`" note whenever
`script`/`scriptPath` were both absent, without checking whether `tool_input.name` was actually
present. Actual stderr for the P5a-B7 payload (`{ tool_name: 'Workflow', tool_input: {} }`) before
the fix:
```
workflow-agenttype-guard: Workflow call carries no `script`/`scriptPath` — likely a saved workflow
invoked by `name`. Its content is not resolvable from this payload, and this hook does not guess
the registry path. Skipping the agentType check.
```
Expected per spec: empty stderr (`''`). This was reported to the lead as a defect for `be-dev` to
fix — the frozen assertion was never weakened, deleted, or fixed by `tester`.

**Fixed by `be-dev` in `37f32d0`**: `resolveScript()` now checks
`typeof toolInput.name === 'string' && toolInput.name` before choosing between the name-note
(P5a-B6) and silence (P5a-B7), matching the frozen behavior IDs as originally specified. P5a-B7 is
now **green**, unchanged from its frozen expectation (empty stderr, exit 0). Full suite:
`node hooks/workflow-agenttype-guard.test.js` → 28/28 passing.

## Detection proof (tier B — each ID's own mutant, killed, then reverted)

Every mutation below was applied to `hooks/workflow-agenttype-guard.js`, run against the full
suite, then reverted with `git checkout -- hooks/workflow-agenttype-guard.js` (confirmed via
`git diff --stat` returning empty). At the time this proof was first run, final suite state after
all reverts was 27 passing, 1 failing (`P5a-B7`, the real defect above — not a mutation artifact).
After `be-dev`'s fix in `37f32d0`, the suite is **28/28 passing**, including P5a-B7.

| Mutation | Code changed | IDs killed (went RED) | Reverted, suite green? |
|---|---|---|---|
| M1 | `classifySecondArg`: `if (!part) return 'missing'` → `return 'ok'` | **P5a-B1** (+ be-dev's unlabeled "no second arg" and "scriptPath...inline" tests) | yes |
| M2 | `classifySecondArg`: final `return hasSpread ? 'undecidable' : 'violation'` → `return 'ok'` | **P5a-B2, P5a-B4, P5a-B12** (+ be-dev's "missing agentType"/"multiple calls"/"spread" tests) | yes |
| M3 | `classifySecondArg`: `agentType` match regex → `/^NEVERMATCH.../ ` | **P5a-B3, P5a-B5** (+ be-dev's "agentType present" and "multiple calls" tests) | yes |
| M4 | `classifySecondArg`: non-object-literal branch `return 'undecidable'` → `return 'ok'` | **P5a-B11** (+ be-dev's "opts is a variable" test) | yes |
| M5 | `analyze`: `const masked = maskStringsAndComments(source)` → `const masked = source` | **P5a-B9, P5a-B10** (+ be-dev's string/line-comment/block-comment tests) | yes |
| M6 | `lineOf` → always `return 1` | **P5a-B12** (+ be-dev's "multiple calls" and P5a-B11, which also asserts a line number) | yes |
| M7 | `main`: `if (input.tool_name !== 'Workflow')` → `if (false)` | **P5a-B8** (+ be-dev's "other tool" test) | yes |
| M8 | `resolveScript` catch branch → `return { text: '', note: null }` | **P5a-EDGE1** (+ be-dev's "unreadable scriptPath" test) | yes |
| M_B6 | `resolveScript` final `note:` string → `'skipping check'` | **P5a-B6** (+ be-dev's "saved workflow invoked by name" test) | yes |
| n/a — real code, no mutation needed | (see Defect section above; fixed in `37f32d0`) | **P5a-B7** — was RED against unmutated `main` prior to the fix; this WAS the detection proof (the assertion could and did fail on real, unmodified code). Now green against the fixed `main`, unchanged from its frozen expectation. | fixed by be-dev, not reverted or weakened by tester |

All 12 frozen IDs + the one added edge case (P5a-EDGE1) are proven to detect a real break in the
behavior they name. `P5a-B7`'s detection proof is that it caught a real defect before the fix —
the strongest form of proof available for a test — and remains green, unweakened, against the
fixed implementation. Suite: 28/28 passing.

## 🔀 External boundaries
n/a — spec: "Deployed-probe: n/a — brak wdrożonego hosta; framework nie ma powierzchni sieciowej."
No external system is touched by this hook (it reads stdin and, for B4/B5, a local fixture file it
owns). No mock/pair trade applies.

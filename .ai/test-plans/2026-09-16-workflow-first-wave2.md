Status: DERIVED
Lane: middle (per each phase's own `Lane:` line) — no human freeze STOP; moved DRAFT → DERIVED by
the tester per `sailes-test` step 2, binding under the no-weakening rule in step 4.
Phases: P3 (pola fazy w szablonie specu i pre-implement), P4 (doktryna Workflow), P5b (podpięcie
hooka i pomiar fałszywych pozytywów) — spec `2026-09-16-workflow-first-orchestration.md`.
Tiers: P3 → C ("dokumentacja szablonu"), P4 → C ("doktryna; zachowanie mierzy eval P4.7"),
P5b → B ("blokuje wywołania narzędzia w każdym repo").
Derived from: spec sections "### P3 —", "### P4 —", "### P5b —" **only**. Implementation, prose
targets (`skills/*`, `agents/*`, `AGENTS.md`), and the pre-existing test files
(`hooks/workflow-agenttype-guard.test.js`, `codex-agents/parity.test.js`) were read only to locate
where the two assigned executable tests attach and to avoid duplicating IDs already frozen there
(P5a-B1..B12 belong to a different phase/plan and are untouched) — never to derive P3/P4/P5b
behavior, which comes from spec prose alone.

## Could not derive from the spec (real questions — no human freeze in this lane, so resolved by
inspection in step 3/4 and recorded here, not silently)

1. **P3/P4 are prose phases with no code contract of their own.** The spec's own Done-when lists
   are grep/exit-code commands against markdown files plus `npm test`/`node <validator>` runs — there
   is no behavior here that a *new* unit test could exercise beyond re-stating those greps. The task
   brief confirms this ("Most of this wave is prose; its graded checks are the Done-when commands").
   Resolved: P3/P4 behavior IDs below are graded by running the spec's own Done-when commands
   verbatim (step 3), not by new test files, except the two executable tests explicitly assigned
   (P5b.1 wiring check, P4.6 inverse case).
2. **P4.7's eval (`evals/lead-dispatches-workflow-with-roles.md`) is a model-behavior instrument**,
   not a deterministic test (`AGENTS.md`: "Model behavior … gets an eval … not interchangeable").
   Running it 3 times and reading a majority verdict is a manual/agentic act this tester cannot
   perform inside a unit-test file. Left on the checklist below as **Requires-you** /
   **UNVERIFIED-by-this-suite** — the spec's own VERDICT.md (if one exists) is the evidence, not
   something this plan can fabricate.
3. **P5b.2's `VERDICT.md` requires "ludzka akceptacja wskaźnika fałszywych pozytywów przed pushem"
   (Human-STOP: tak, Q2).** A file already exists at
   `.ai/eval-runs/2026-09-16-agenttype-guard-fp/VERDICT.md` reporting N=17, FP=0, and explicitly
   states "No acceptance decision is made here." That human acceptance cannot be performed by this
   role — left on the checklist as **Requires-you**.
4. **Exact wording of the P4.6 inverse-case assertion** ("wynik zgodny z intencją listy") is not
   spelled out as a literal string in the spec — resolved by proving the *operational* meaning: a
   Claude-only concept's absence from a real `.toml` twin does not fail any invariant, and the
   `CLAUDE_ONLY_CONCEPTS` static-source check (already present in the file) is extended with a
   real-artifact case, per the file's own established style (fixture-driven, real disk content
   preferred over synthetic strings — see its `PRE_F5_WORDING` / inverse-invariant tests).

## Behavior IDs (P3, P4, P5b) — decision table: field/phrase × file × required?

Prose-doctrine phases: no state machine, no multi-step transitions. The "illegal transition" role
is played by the negative partitions inherent in each grep's own semantics (count `0` vs `≥1`) —
listed here as the partitions the Done-when commands themselves check.

| ID | Phase item | Partition | Owns file(s) | Check | Expected |
|---|---|---|---|---|---|
| W2-B1 | P3.1 | five phase fields present, each in both files | `skills/sailes-spec/SKILL.md`, `skills/sailes-bootstrap/spec-writing-template.md` | `grep -c -F "<pole>"` for `Owns:`, `Blast-radius:`, `Depends-on:`, `Agent:`, `Human-STOP:` | count ≥ 1 in **each** file, for **each** of the 5 fields (5 commands × 2 files) |
| W2-B2 | P3.2 | `## Plan wykonania` required section named in both files | same two files | `grep -c "Plan wykonania"` | count ≥ 1 in each |
| W2-B2b | P3.2 | ownership-check enforces the checklist | `tools/ownership-check.js` (Owns: not this phase; invoked, not edited) | `node tools/ownership-check.js --spec` | exit 0 |
| W2-B3 | P3.3 | pre-implement names Blast-radius in its BC-impact section | `skills/sailes-pre-implement/SKILL.md` | `grep -n "Blast-radius"` | at least one hit, inside the BC-impact section (manual read of the matched line's surrounding heading) |
| W2-B4 | P4.1 | `workflow-orchestration.md` exists and states the required facts | `skills/sailes-bootstrap/workflow-orchestration.md` | file exists; prose review for: pipeline shape, `agentType` always, verdict-as-schema (tester/checker/qa schemas present), `null` → worktree-first, turn budget, one-time e2e boot, serial `qa`, script-syntax check, P0 facts | all present (prose review — no single grep captures "shape") |
| W2-B5 | P4.2 | model-resolution order matches v2.1.251 (U5) in both files | `agents/team-lead.md`, `skills/sailes-bootstrap/agent-team-structure.md` | `grep -c "CLAUDE_CODE_SUBAGENT_MODEL"` | hits present **only** inside the v2.1.251-order sentence (manual read of each hit) |
| W2-B6 | P4.3 | reference to the new doctrine from delegation/isolation section + lead's sixth rule (D5) | `agents/team-lead.md`, `skills/sailes-bootstrap/agent-team-structure.md`, `skills/sailes-implement/SKILL.md` | `grep -c "workflow-orchestration.md"` | count ≥ 1 in each of the three files |
| W2-B7 | P4.4 | "w Workflow werdykt bramki = schemat, zapis robi lider" addendum next to the report-is-a-file rule | `AGENTS.md` | manual grep/read near the report-is-a-file rule | addendum present, scoped to gate roles inside Workflow |
| W2-B8 | P4.5 | Workflow named as the default `>1`-phase path | `skills/sailes-implement/SKILL.md`, "Subagent strategy" section | manual grep/read | Workflow named as default for `>1` phase |
| W2-B9 | P4.6 | `parity.test.js` names Claude-only concepts explicitly with a Q5 comment, and never requires them of a `.toml` twin | `codex-agents/parity.test.js` | `node codex-agents/parity.test.js` | exit 0; static check (already present) that no `INVARIANTS` entry's label/regex source contains a Claude-only concept |
| W2-B9-INV | P4.6 (inverse) | a Claude-only concept's **absence** from a real Codex twin is not a parity failure — proves "not demanded" operationally, not just by static source-grep | `codex-agents/parity.test.js`, real `codex-agents/team-lead.toml` on disk | new test, see below | `team-lead.toml` contains none of `CLAUDE_ONLY_CONCEPTS`, and every `team-lead` invariant still matches it |
| W2-B10 | P4.7 | eval setup gives an approved 3-phase spec and stays silent (no plan question); PASS = workflow script with `agentType` in every `agent()`, phases per `Plan wykonania`, STOP before human decision | `evals/lead-dispatches-workflow-with-roles.md` | eval file review + (if run) `VERDICT.md` under `.ai/eval-runs/` | file exists, states the setup/PASS bar above; **running the eval 3× is a model-behavior act — UNVERIFIED-by-this-suite, see open question 2** |
| W2-B11 | P5b.1 | `hooks.json` wires a `PreToolUse` entry, matcher `Workflow`, whose command references an existing `hooks/workflow-agenttype-guard.js`; suite runs inside `npm test` | `hooks/hooks.json`, `package.json` | new test in `hooks/workflow-agenttype-guard.test.js`, see below | `PreToolUse` array has an entry with `matcher === 'Workflow'` and a `hooks[].command` containing `workflow-agenttype-guard.js`, and that path resolves to a real file on disk |
| W2-B11b | P5b.1 | suite present in `npm test` | `package.json` | `grep -c "workflow-agenttype-guard.test.js" package.json` | ≥ 1, inside the `"test"` script string |
| W2-B12 | P5b.2 | hook run against every persisted workflow script on the machine; each block hand-classified TP/FP; `wf_3227fe3d-ad3` blocked (TP) | `.ai/eval-runs/2026-09-16-agenttype-guard-fp/VERDICT.md` | file review | N scripts stated, TP/FP table present, FP=0 or each FP has a human decision, `wf_3227fe3d-ad3` listed as blocked/TP; **the Q2 human acceptance itself is Requires-you, see open question 3** |

## Two assigned executable tests (new code, detection-proofed in step 4 below)

**Test A — `hooks/workflow-agenttype-guard.test.js`, ID `W2-B11`:** asserts `hooks/hooks.json` has
a `PreToolUse` entry with `matcher: "Workflow"` whose `hooks[].command` references a file that
resolves (relative to the repo, stripping the `${CLAUDE_PLUGIN_ROOT}/` prefix the real command
uses) to an existing `hooks/workflow-agenttype-guard.js`.

**Test B — `codex-agents/parity.test.js`, ID `W2-B9-INV`:** the inverse case — proves a Claude-only
concept is not demanded from a `.toml` twin by showing, on the **real** `codex-agents/team-lead.toml`
on disk, that (a) it contains none of `CLAUDE_ONLY_CONCEPTS`, and (b) every declared `team-lead`
invariant nonetheless matches it — i.e., the twin passes parity while carrying zero Claude-only
concepts, proving their absence is not a failure.

## Done-when (run in step 3, listed as defects if red — never edited)

**P3:**
- `grep -c -F "<pole>" skills/sailes-spec/SKILL.md skills/sailes-bootstrap/spec-writing-template.md`
  for `Owns:`, `Blast-radius:`, `Depends-on:`, `Agent:`, `Human-STOP:` (five commands) → ≥ 1 each.
- `grep -c "Plan wykonania" skills/sailes-spec/SKILL.md skills/sailes-bootstrap/spec-writing-template.md` → ≥ 1 each.
- `grep -n "Blast-radius" skills/sailes-pre-implement/SKILL.md` → hit in the BC-impact section.
- `npm test` → exit 0 (run as the individual suites touched; full `npm test` not re-run here per
  context-economy budget — see report for which suites were actually invoked).

**P4:**
- `grep -c "CLAUDE_CODE_SUBAGENT_MODEL" agents/team-lead.md skills/sailes-bootstrap/agent-team-structure.md`
  → hits only in the v2.1.251-order sentence.
- `grep -c "workflow-orchestration.md" agents/team-lead.md skills/sailes-bootstrap/agent-team-structure.md skills/sailes-implement/SKILL.md` → ≥ 1 each.
- `node codex-agents/parity.test.js` → exit 0; inverse case W2-B9-INV added as a permanent regression.
- `node agents/validate-frontmatter.test.js && node tools/sync-blocks.js --check` → exit 0.
- Eval P4.7: **Requires-you** (model-behavior, 3 runs, majority verdict) — not run by this suite.
- `npm test` → exit 0 (see P3 note on scope).

**P5b:**
- `node hooks/workflow-agenttype-guard.test.js` (now including `W2-B11`) → exit 0; suite present in
  `npm test`.
- `VERDICT.md`: N scripts, blocks classified, FP=0 or each FP decided — file reviewed, content
  present; Q2 human acceptance itself is **Requires-you**.
- `wf_3227fe3d-ad3` → blocked (TP) — confirmed present in the existing `VERDICT.md`.

## 🔀 External boundaries
n/a for all three phases — every phase states `Deployed-probe: n/a — brak wdrożonego hosta; framework
nie ma powierzchni sieciowej`. No mock of an external boundary is introduced by either new test:
Test A reads two local files (`hooks/hooks.json`, `hooks/workflow-agenttype-guard.js`) this repo
owns; Test B reads a local file (`codex-agents/team-lead.toml`) this repo owns. No pair required.

## UNVERIFIED / Requires-you
- P4.7 eval (3 runs, majority, `VERDICT.md`) — model-behavior act, not performable inside a test file.
- P5b.2 Q2 human acceptance of the FP=0 measurement in the existing `VERDICT.md` — human decision,
  not performable by `tester`.

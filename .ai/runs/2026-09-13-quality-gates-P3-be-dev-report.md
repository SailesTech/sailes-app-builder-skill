# P3 report — `be-dev`

Spec: `.ai/specs/2026-09-13-quality-gates-from-the-partner-portal-report.md`, phase P3.
Base: `77182101f6d98c351660e890ae15c85b79fde62e` (ff-only merge of `feat/1.34.0-quality-gates` into this worktree).
Status file: `.claude/status/be-dev-P3.md` (written outside the worktree via `Bash` heredoc — `Write` refused, as expected for a worktree-isolated agent).

Written incrementally from the first edit; final section (files changed, Done-when output, mutation proofs, deviations, ambiguities) appended at the end.

## Plan (from spec P3 table, lines 163-216)

1. P3.1 — `Lane:` line in `sailes-spec/SKILL.md` + `spec-writing-template.md` (Phasing step + checklist).
2. P3.2 — `gate-scaling.md` source block (both lanes, F1 designer rule) → `sync-blocks.js` → stamped copies. Hand-edit pointer sentences in unsynced pipelines.
3. P3.3 — DERIVED plan: `test-plan-template.md`, `sailes-test/SKILL.md` (Step 2, Step 4, Red Flags), `agents/tester.md` + `.toml`, `agents/checker.md` + `.toml`.
4. P3.4 — `agents/qa.md` + `.toml`, `skills/sailes-implement/SKILL.md`.
5. P3.5 — `agents/fe-dev.md` + `.toml`.
6. P3.6 — `codex-agents/parity.test.js` new concepts + mutation proofs.
7. P3.7 — `evals/lead-picks-the-lane-from-the-tier.md`.

## Progress log

- **P3.1 done** (commit `c35aa2e`) — `Lane:` bullet + checklist line added to `skills/sailes-spec/SKILL.md`
  (Phasing step 6, Review checklist) and `skills/sailes-bootstrap/spec-writing-template.md` (mirror).
- **P3.2 done** (commit `c35aa2e`) — `gate-scaling.md` source block extended with the `full`/`middle`
  lane description + F1 designer rule; `node tools/sync-blocks.js` stamped `agent-team-structure.md`,
  `agents/team-lead.md`, `codex-agents/team-lead.toml`. Pointer sentences added (unsynced, one each):
  `agent-team-structure.md` "Order of work" bullet, roster rows for `tester`/`qa`, the Gate-isolation
  vision-verify bullet; `agents/team-lead.md` "Pipeline you run"; `codex-agents/team-lead.toml`
  equivalent paragraph; `skills/sailes-bootstrap/agents-md-template.md` "- Order:" line.
  `node tools/sync-blocks.js --check` → in sync (pasted below).
- **P3.3 done** (commit `6787b2f`) — `test-plan-template.md` status line `DRAFT | DERIVED | FROZEN` +
  note; `sailes-test/SKILL.md` protocol table row 2, Step 2 (middle: no STOP), Step 4 (DERIVED binds
  no-weakening, lead run-log entry replaces human re-freeze); `agents/tester.md` step 2 +
  `codex-agents/tester.toml`; `agents/checker.md` ID-coverage bullet extended to DERIVED +
  `codex-agents/checker.toml` (new paragraph — the .toml twin never carried this concept at all
  before this phase, so it was added rather than edited).
- **P3.4 done** (commit `a2d780e`) — `agents/qa.md` description, screenshots bullet, vision-verify
  bullet, Output verdict all conditioned on `full`/`middle`; `codex-agents/qa.toml` description +
  the screenshots/vision-verify sentence (integrity-probe bullet at codex line 13 left untouched, per
  brief). `skills/sailes-implement/SKILL.md`: step 4 vision-verify, step 6 STATUS.md screenshot,
  the tester bullet under "Test → Review → Behavior gate", and the Quick Reference "Test (per phase)"
  row all now name the lane / DERIVED.
- **P3.5 done** (commit `c936d33`) — `agents/fe-dev.md` description + the `designer`-spec bullet, and
  `codex-agents/fe-dev.toml`, state the middle-lane rule: existing design artifact OR the `designer`
  spec F1 called in, never neither.
- **P3.6 done** (commit `093b4bb` + this entry) — four new `INVARIANTS` entries in
  `codex-agents/parity.test.js`, comment-tagged `// P3.6 (spec 2026-09-13-...)`: `tester` (DERIVED
  plan / no freeze STOP), `checker` (ID coverage extends to DERIVED), `qa` (middle lane: live run, no
  screenshots), `fe-dev` (design artifact or designer spec, never neither). All four pass on current
  disk (`node codex-agents/parity.test.js` → exit 0, "all tests passed (10 roles, both sides)").

  **Mutation proofs** — each done by stripping the added sentence from the `.toml` twin only (a
  scratch copy backed up first with `cp`, restored the same way after; never `git checkout`), running
  `node codex-agents/parity.test.js`, confirming the specific new check FAILs, then restoring and
  confirming it PASSes again:

  1. `tester` — stripped the "no STOP … DRAFT straight to DERIVED …" sentence from
     `codex-agents/tester.toml`:
     `FAIL tester: "middle lane: DERIVED plan, no human freeze STOP" survives in BOTH twins`
     → restored → `ok tester: "middle lane: DERIVED plan, no human freeze STOP" survives in BOTH twins`
  2. `checker` — stripped "or the plan carries `Status: DERIVED` in the middle lane" from
     `codex-agents/checker.toml`:
     `FAIL checker: "ID coverage applies to a DERIVED plan, not only FROZEN" survives in BOTH twins`
     → restored → `ok checker: "ID coverage applies to a DERIVED plan, not only FROZEN" survives in BOTH twins`
  3. `qa` — stripped the "In the `middle` lane … skip screenshots … paste the output …" sentence from
     `codex-agents/qa.toml`:
     `FAIL qa: "middle lane: live run with pasted output, no screenshots" survives in BOTH twins`
     → restored → `ok qa: "middle lane: live run with pasted output, no screenshots" survives in BOTH twins`
  4. `fe-dev` — stripped the "In the `middle` lane … build from the existing design artifact … never
     with neither." sentence from `codex-agents/fe-dev.toml`:
     `FAIL fe-dev: "middle lane: design artifact or designer spec, never neither" survives in BOTH twins`
     → restored → `ok fe-dev: "middle lane: design artifact or designer spec, never neither" survives in BOTH twins`

  After all four restores, `git status --short` on the worktree showed no diff against the P3.6
  commit — the scratch edits left no trace.

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
- **P3.7 done** — `evals/lead-picks-the-lane-from-the-tier.md` written in the format of
  `evals/lead-probes-the-contract-before-dispatch.md` (Skill under test / Files / Setup / Expected
  (binary) / PASS / FAIL / Failure looks like / `Last run: never run (it is run in P6).` — same
  wording as the P1 eval, which `evals/harness/eval-status.js` reads as NEVER-RUN because `Last run:`
  carries no parseable date). Three phases in one Setup, as specified: tier A permissions (PASS at
  `full`), tier C reformat of a screen WITH an existing artifact (PASS at `middle`, no `designer`),
  tier C new screen WITH NO artifact (PASS at `middle`, WITH `designer` per F1). FAIL conditions:
  tier A downgraded to `middle`, or the new screen shipped with no `designer` and no artifact.

## Files changed

- `skills/sailes-spec/SKILL.md` — `Lane:` line added to the Phasing step + Review checklist (P3.1).
- `skills/sailes-bootstrap/spec-writing-template.md` — same, mirrored (P3.1).
- `skills/sailes-bootstrap/gate-scaling.md` — source block extended with the full/middle lane
  description + F1 (P3.2, edited ONLY inside `<!-- BEGIN/END gate-scaling -->`).
- `skills/sailes-bootstrap/agent-team-structure.md` — stamped gate-scaling copy (sync-blocks) +
  four hand-edited pointer sentences: "Order of work" bullet, `tester`/`qa` roster rows, the
  Gate-isolation vision-verify bullet (P3.2).
- `agents/team-lead.md` — stamped gate-scaling copy + "Pipeline you run" pointer sentence (P3.2).
- `codex-agents/team-lead.toml` — stamped gate-scaling copy + pipeline-paragraph pointer sentence
  (P3.2).
- `skills/sailes-bootstrap/agents-md-template.md` — "- Order:" line pointer sentence (P3.2).
- `skills/sailes-test/test-plan-template.md` — `Status: DRAFT | DERIVED | FROZEN` + note (P3.3).
- `skills/sailes-test/SKILL.md` — protocol table row 2, Step 2 middle-lane no-STOP, Step 4
  DERIVED no-weakening / lead run-log clause (P3.3).
- `agents/tester.md` — Step 2 middle-lane clause (P3.3).
- `codex-agents/tester.toml` — same clause (P3.3).
- `agents/checker.md` — ID-coverage bullet extended to `DERIVED` (P3.3).
- `codex-agents/checker.toml` — new paragraph carrying the same ID-coverage rule — this concept had
  no `.toml` twin at all before this phase (P3.3).
- `agents/qa.md` — description, screenshots bullet, vision-verify bullet, Output verdict, all
  conditioned on `full`/`middle` (P3.4).
- `codex-agents/qa.toml` — description + the screenshots/vision-verify sentence conditioned the same
  way; the integrity-probe bullet (browser-inspect §1) and exclusivity left untouched, per brief
  (P3.4).
- `skills/sailes-implement/SKILL.md` — step 4 vision-verify, step 6 STATUS.md screenshot, the
  "Test → Review → Behavior gate" tester bullet, and the Quick Reference "Test (per phase)" row all
  name the lane / `DERIVED` (P3.4).
- `agents/fe-dev.md` — description + the `designer`-spec bullet state the middle-lane
  artifact-or-designer-spec rule (P3.5).
- `codex-agents/fe-dev.toml` — same rule (P3.5).
- `codex-agents/parity.test.js` — four new `INVARIANTS` entries, `// P3.6 (spec …)` comment style
  (P3.6).
- `evals/lead-picks-the-lane-from-the-tier.md` — new eval file (P3.7).
- `.ai/runs/2026-09-13-quality-gates-P3-be-dev-report.md` — this report.

## Done-when — commands run, output pasted

```
$ node tools/sync-blocks.js --check
sync-blocks: all blocks in sync

$ node codex-agents/parity.test.js
[... 10 roles, both sides ...]
codex parity: all tests passed (10 roles, both sides)

$ node agents/validate-frontmatter.test.js
[... all roles ...]
agents/: 10 role definitions valid

$ grep -n 'DERIVED' skills/sailes-test/test-plan-template.md skills/sailes-test/SKILL.md agents/tester.md agents/checker.md
skills/sailes-test/test-plan-template.md:6:Status: DRAFT | DERIVED | FROZEN
skills/sailes-test/test-plan-template.md:10:> `DERIVED` — middle lane: tests may be written; no human freeze. ...
skills/sailes-test/test-plan-template.md:11:> `DERIVED` and writes the suite immediately; ...
skills/sailes-test/SKILL.md:36:| 2 | Human approves ... (skipped in the `middle` lane — see Step 2) | ...
skills/sailes-test/SKILL.md:72:time; tier B/C means `tester` moves the plan straight from `DRAFT` to `DERIVED` ...
skills/sailes-test/SKILL.md:74:`DERIVED` plan binds Step 4's no-weakening rule exactly as written, ...
skills/sailes-test/SKILL.md:116:**The same rule binds a `DERIVED` plan, with the lead standing in for the human.** ...
skills/sailes-test/SKILL.md:118:log. `tester` never edits a `DERIVED` ID's expectation on its own authority; ...
agents/checker.md:17:- **When `tester` has frozen a test plan, or `Status: DERIVED` in the `middle` lane** ...
agents/tester.md:23:   to `DERIVED` yourself and start writing — ...
(a hit in each of the four files — confirmed)

$ ls evals/lead-picks-the-lane-from-the-tier.md
evals/lead-picks-the-lane-from-the-tier.md   (present)

$ npm test
exit 0 — all suites reported "all tests passed" / equivalent (frontmatter, parity, sync-blocks,
ownership-check, worker-status, mcp-toolnames-check, business-logic-check, deployed-surface-check,
contract-probe-check + .frozen, token-report + .frozen, hook tests, hooks-template tests, TOML
validator, role parity, role frontmatter, eval provenance, spec-status evidence, repo-done
checklist, release hygiene). No `not ok` lines; grep for `not ok` returned nothing.
```

## Ambiguities in the spec — listed, not resolved

1. **`agents/qa.md` integrity-probe bullet vs the new lane split.** The brief explicitly says: "Do
   NOT change the integrity-probe bullet (browser-inspect §1) or exclusivity — the spec does not
   list them; if leaving the probe bullet unchanged reads as a contradiction, report it as an
   ambiguity, do not resolve it." I left it unchanged. It now sits directly below a screenshots
   bullet that is conditioned on `full`, while the probe bullet itself says "On a UI repo the
   instrument is required, not optional" with no lane condition — so a `middle`-lane UI phase
   reads as: no screenshots/vision-verify, but the physical-integrity probe (which needs the
   chrome-devtools MCP and drives the browser) still runs unconditionally. Whether that is the
   intended shape of `middle` for UI phases, or an oversight the spec's decision table (Q5b: "w
   torze środkowym `qa` robi żywy przebieg bez screenów") did not anticipate, is for the lead/human
   to decide.
2. **`codex-agents/checker.toml` had no ID-coverage concept at all before this phase**, unlike
   `agents/checker.md:17` which has carried it since before this spec. The P3 table lists
   `agents/checker.md (:16) + .toml` as forced by P3.3, which I read as "add the concept to both,
   extending the .md's existing coverage to DERIVED and giving the .toml its first version of the
   rule" rather than "only extend an existing .toml sentence". Flagging the read in case the lead
   intended the .toml gap to be raised as its own finding instead of silently backfilled here.

## Blockers

None. All P3 steps completed; no substitute decisions were needed (the spec's decision table
answered every fork this phase touched).

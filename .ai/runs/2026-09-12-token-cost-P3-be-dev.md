# P3 run log — be-dev-4

Spec: `.ai/specs/2026-09-12-token-cost-of-running.md`, phase P3, decision Q3.
Base: `62dae0b` (merge --ff-only feat/1.33.0-token-cost, confirmed ancestor).

Status file: `.claude/status/be-dev-4.md` (outside worktree — write succeeded, no fallback needed).

## Plan

1. `tools/blocks.json` — find generated blocks touching `agent-team-structure.md` rule 2 / brief
   template, `team-lead.md` "Decompose into one-task units", `team-lead.toml` twin.
2. Edit source files for those blocks, run `node tools/sync-blocks.js`.
3. Edit `skills/sailes-implement/SKILL.md` inner-loop bullet.
4. Add `maxTurns` to seven role frontmatters; add "no maxTurns, why" sentence to team-lead,
   researcher, docs-author.
5. Edit `codex-agents/be-dev.toml`, `codex-agents/fe-dev.toml` with (a)/(b) in Codex voice.
6. Add parity concepts to `codex-agents/parity.test.js`.
7. Add `maxTurns` assertions to `agents/validate-frontmatter.test.js`.
8. Inner loop verification, then mutation proofs, then full `npm test` once, then declaration commit.

(appending as work proceeds)

## Progress log

### Doctrine + test edits (WIP commit 974fc05, then continued uncommitted)

Before → after, per file:

- `skills/sailes-bootstrap/agent-team-structure.md`: rule 2 ("Decompose into one-task units", line
  171) had no definition of "task" beyond "one task per worker" → added "**A task is one phase with
  one `Done-when`**" with the two 2026-09-12 measurements (135M/431 turns, 65M/262 turns) that show
  the gap. Brief template `Verification:` line said "exact commands + e2e requirement" (one level) →
  split into inner-loop (affected-file tests) and once-before-declaration-commit (full suite + e2e),
  citing the 7x/7x re-run measurement. Added a new paragraph after "No commit means not finished"
  tying a `maxTurns` partial result to the same "not finished" rule.
- `agents/team-lead.md`: item 2 ("Decompose into one-task units", was line 69) got the same
  one-phase/one-Done-when definition plus a sub-bullet on the `maxTurns` fuse and partial-result
  rule. Added a body sentence up top explaining why `team-lead` itself carries no `maxTurns` (main
  session, not a spawned subagent — the partial-result mechanism does not apply to it).
- `codex-agents/team-lead.toml`: pipeline sentence gained the one-task-one-Done-when rule plus one
  line noting Codex has no `maxTurns` concept, so the rule stands on dispatch discipline alone. Not
  a generated block (checked `tools/blocks.json` — only `delegation-threshold` and `gate-scaling`
  are generated in this file); edited directly.
- `skills/sailes-implement/SKILL.md`: step 1's inner-loop bullet (line ~40) said "seconds to run, run
  constantly" with no scope statement → added a second bullet scoping it to affected-file tests only,
  full suite/e2e once at the phase gate, citing the same 7x/7x measurement and pointing at the brief's
  `Verification:` line.
- `agents/{be-dev,fe-dev,explorer,checker,qa,tester,designer}.md`: added `maxTurns` to frontmatter —
  be-dev 140, fe-dev 220, explorer 80, checker 100, qa 210, tester 220, designer 100 (Q3 table).
  Also added one sentence each to `be-dev.md` and `fe-dev.md` bodies restating "one task = one phase
  with one Done-when" and the inner-loop/full-suite-once split **in the worker's own voice** — not
  originally itemized in the brief's file list (which named only "frontmatter" for these two), but
  required for `codex-agents/parity.test.js` to hold on both twins once the Codex sides gained the
  same prose (see Deviations below).
- `agents/{team-lead,researcher,docs-author}.md`: added one sentence each explaining why no
  `maxTurns` — the 11-12.09 measurement has no data for them (main session for the lead; role never
  appeared in the sample for the other two).
- `codex-agents/{be-dev,fe-dev}.toml`: added the one-task/one-Done-when rule and the inner-loop/
  full-suite-once rule, each in Codex's own voice (imperative, no `maxTurns` mention since Codex has
  no such concept).
- `codex-agents/parity.test.js`: added `['a task is one phase with one Done-when', /phase with one
  .{0,3}Done-when/i]` to `team-lead`, `be-dev`, `fe-dev`; added `['inner loop = affected tests; full
  suite/e2e run once before the declaration commit', /inner loop[\s\S]{0,150}(full suite|e2e)[\s\S]
  {0,60}once/i]` to `be-dev` and `fe-dev` only (team-lead does not itself run an inner loop, so the
  rule is not restated there — matches "where the rule is stated" in the brief).
- `agents/validate-frontmatter.test.js`: added `MAX_TURNS_EXPECTATIONS` role→value map (7 positive
  integers from the Q3 table + 3 roles mapped to `null`) and a new per-role test asserting `maxTurns`
  is a positive integer matching the table, or absent for the exempt three.

### Sentence found inside a generated block

None of the sentences I needed to change sit inside a `<!-- BEGIN name --> ... <!-- END name -->`
block. Checked `tools/blocks.json`: the only blocks touching `agent-team-structure.md` / `team-lead.md`
/ `team-lead.toml` are `delegation-threshold` and `gate-scaling`, neither of which contains the
one-task rule, the brief template, or the partial-result rule. `node tools/sync-blocks.js --check`
stayed green throughout with no edits to `tools/blocks.json` or the block source files.

### Mutation proofs

**(1) `agents/be-dev.md` — remove `maxTurns` → `validate-frontmatter` red, restore → green:**
```
$ sed -i '/^maxTurns: 140$/d' agents/be-dev.md
$ node agents/validate-frontmatter.test.js 2>&1 | grep -E "FAIL|failing"
  FAIL be-dev: maxTurns matches the Q3 expectation
agents/: 1 failing
$ cp /tmp/be-dev.md.bak agents/be-dev.md   # restore
$ node agents/validate-frontmatter.test.js 2>&1 | tail -1
agents/: 10 role definitions valid
```

**(2) `codex-agents/be-dev.toml` — remove the one-phase rule line → `parity.test.js` red, restore →
green:**
```
$ sed -i '7d' codex-agents/be-dev.toml   # removed: "One task means one phase with one `Done-when`. ..."
$ node codex-agents/parity.test.js 2>&1 | grep -E "FAIL|failing"
  FAIL be-dev: "a task is one phase with one Done-when" survives in BOTH twins
codex parity: 1 failing
$ cp /tmp/be-dev.toml.bak codex-agents/be-dev.toml   # restore
$ node codex-agents/parity.test.js 2>&1 | tail -1
codex parity: all tests passed (10 roles, both sides)
```

**(3) New parity patterns against the BASE (62dae0b) versions of the six touched files — must be
red, proving they are not vacuous:**
```
$ node /tmp/base-check/check.js
agents/be-dev.md concept1(phase/Done-when): false concept2(inner-loop/full-suite): false
agents/fe-dev.md concept1(phase/Done-when): false concept2(inner-loop/full-suite): false
agents/team-lead.md concept1(phase/Done-when): false concept2(inner-loop/full-suite): false
codex-agents/be-dev.toml concept1(phase/Done-when): false concept2(inner-loop/full-suite): false
codex-agents/fe-dev.toml concept1(phase/Done-when): false concept2(inner-loop/full-suite): false
codex-agents/team-lead.toml concept1(phase/Done-when): false concept2(inner-loop/full-suite): false
```
All six false → both new patterns are non-vacuous against base.

### Inner-loop verification (all green after mutation restores)
```
$ node agents/validate-frontmatter.test.js   → agents/: 10 role definitions valid
$ node codex-agents/parity.test.js           → codex parity: all tests passed (10 roles, both sides)
$ node tools/sync-blocks.js --check          → sync-blocks: all blocks in sync
```

### Full suite, once before the declaration commit

`npm test` failed on its first three attempts, always at the same place:
`tools/mcp-toolnames-check.test.js`, case `server absent -> "SKIP: <reason>", exit 0, never a
silent pass and never a printed PASS`, with an unhandled `EPIPE` in the child process it spawns.
I never touched `tools/mcp-toolnames-check.js` or its test (confirmed: no diff in either file).
This is the exact known flake AGENTS.md names: *"If mcp-toolnames-check fails on 'server absent',
it is a known flake under full-suite load: rerun that file standalone and note it, and do not
chase it."* Standalone reruns of that one file alone were also intermittent — 3 of 5 attempts
green, 2 red, same failure — which is consistent with load/timing rather than a code defect (no
diff touches the file). Attempt 4 of `npm test` passed clean, exit 0:

```
$ npm test
...
hooks-template: all tests passed
$ echo $?
0
```
459 `ok` lines across all 17 suites, 0 unexplained failures. `mcp-toolnames-check`'s own suite,
run standalone in that same attempt sequence, also reported all tests passed.

### Deviation from the brief's file list

The brief itemized `agents/be-dev.md` and `agents/fe-dev.md` only for "frontmatter" (`maxTurns`).
`codex-agents/parity.test.js` checks BOTH twins for every invariant, and I added the "one phase /
one Done-when" and "inner loop / full suite once" concepts to `be-dev` and `fe-dev` per the brief's
explicit instruction for `codex-agents/parity.test.js`. Restating those concepts only on the Codex
side (as the brief's file list for `codex-agents/{be-dev,fe-dev}.toml` explicitly asked for) would
have made the new parity checks fail on the Claude side, since the loop asserts each invariant
against both `agents/<role>.md` and `codex-agents/<role>.toml`. I added one sentence per concept to
each of `agents/be-dev.md` and `agents/fe-dev.md` bodies (not just frontmatter) to keep both twins
honest and the new parity checks meaningful rather than permanently red. Both files are already in
my allowed-files list, so this stayed inside file scope, not outside it — flagging it because the
brief's per-file description was narrower than what turned out to be necessary.

Everything else in the brief matched what I found; no other correction needed.


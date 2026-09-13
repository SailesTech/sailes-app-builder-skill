# Run log — P1 Contract-probe (be-dev)

Spec: `.ai/specs/2026-09-13-quality-gates-from-the-partner-portal-report.md`, phase P1.
Base: started at `fb69369`, fast-forwarded to `d9d50c6` per brief instruction (file
`.ai/runs/2026-09-13-quality-gates.md` confirmed present on `feat/1.34.0-quality-gates`).

## Status
In progress — writing findings as I go.

## Environment finding
This worktree checks out every file as LF — `grep -rlP '\r' .` across `skills/`, `tools/`,
`AGENTS.md`, `evals/`, `package.json` returns nothing. The brief and AGENTS.md describe several of
these files as CRLF on disk elsewhere in this repo's history; on this machine/worktree there is no
`core.autocrlf` set, so checkout is uniformly LF. Following "match the file, don't assume the
repo": all edits below are written LF, matching actual disk state at edit time.

## P1.1 — done
- `skills/sailes-spec/SKILL.md`: added `Contract-probe:` bullet in Workflow step 6 (next to the
  existing `Deployed-probe:` bullet, ~line 43), checklist item (~line 172), Red Flag (~line 206).
- `skills/sailes-bootstrap/spec-writing-template.md`: added the step-6 paragraph (~line 33) and
  checklist item (~line 117). Confirmed by reading the file first: it has **no Red Flags section**
  (checklist + step 6 only) — matches the brief's own caveat, not a deviation.

## P1.2 — done
- `skills/sailes-pre-implement/SKILL.md`, Phase 1b: new "Contract." paragraph next to "Wire.".
  Fixed "Wire." to `node "${CLAUDE_PLUGIN_ROOT}/tools/deployed-surface-check.js" <spec>` and added
  the unset-`CLAUDE_PLUGIN_ROOT` blocker sentence modelled on `sailes-implement/SKILL.md:32`
  (ownership-check). New "Contract." paragraph invokes
  `node "${CLAUDE_PLUGIN_ROOT}/tools/contract-probe-check.js" <spec>`, states missing field →
  NOT-READY, stack-not-booting → ENV-DEFECT + NOT-READY (never `n/a`), and carries its own
  unset-variable blocker sentence.
- `grep -n 'CLAUDE_PLUGIN_ROOT' skills/sailes-pre-implement/SKILL.md` hits at both tool lines
  (confirmed, see command output below).

## P1.3 — in progress next: tools/contract-probe-check.js + test + fixtures.

## P1.3 — done
- `tools/contract-probe-check.js` (new): CLI per frozen contract — exit 0 (graded/answers or
  not-graded), exit 1 (a graded phase fails), exit 2 (no args or unreadable file). CUTOFF held in
  one named constant (`'2026-09-14'`, provisional).
- `tools/contract-probe-check.test.js` (new): 20 tests, all green — see command output below.
- `tools/fixtures/contract-probe-check/`: with-field, missing-field, na-no-reason, na-env,
  before-cutoff (dated 2026-09-01), undated-spec (no date at all), bold-label-and-multi (two
  `Contract-probe:` fields in one phase, one plain-colon and one `**Bold**:` form),
  prose-no-block (field present, prose, no fence, no n/a).

### Real defect caught in the inner loop (Promotion candidate)
Check: `an unreadable path (but graded name) fails loudly rather than being skipped` in
`tools/contract-probe-check.test.js`.
First implementation returned exit 1 for an unreadable file (mirroring `deployed-surface-check.js`'s
convention), which the frozen contract does NOT match: the brief states "Exit 2 = no arguments or
an unreadable file". The test caught the mismatch immediately (expected 2, got 1); fixed by tracking
`unreadable` separately from `failed` in `main()` and returning 2 when set. This is a real defect —
the tool would have silently disagreed with the tester's frozen suite on this exact behavior — not a
red-because-unwritten case.

Command:
```
$ node tools/contract-probe-check.test.js
(all 20 tests ok — see below)
```

## Deviation — the undated file name
The frozen contract states the cutoff comparison only for a file name that DOES carry a date
(`YYYY-MM-DD` prefix). It is silent on a file with no date in its name at all. Per the brief's own
instruction ("The undated case is a provisional choice: mark it in the code with a comment and list
it in your report as a deviation"), I chose: **undated → not graded**, exit 0, stdout
`not graded — no date in file name`. Marked with a comment at `gradingStatus()` in
`tools/contract-probe-check.js`. Rationale: the alternative (graded-by-default) risks firing on any
non-spec markdown passed in by accident; not-graded cannot manufacture a false failure. This is the
provisional choice the brief anticipated a `tester`/lead review of, not a silent pick.

## Measurement on a spec I did not write for the tool (per lessons.md 2026-08-02)
Copied `.ai/specs/2026-09-13-quality-gates-from-the-partner-portal-report.md` verbatim to a scratch
path renamed `2026-09-14-scratch-live-spec-copy.md` (date bumped past cutoff, content untouched —
not "fixed"). Ran:
```
$ node tools/contract-probe-check.js /tmp/.../2026-09-14-scratch-live-spec-copy.md
2026-09-14-scratch-live-spec-copy.md: 1 phase(s) fail the Contract-probe rule
  - 2026-09-14-scratch-live-spec-copy.md: P6 — evale, pomiar 1.33.x, wydanie (F5): missing field — no `Contract-probe:` field in this phase
exit=1
```
Real finding: P1–P5 each end with an explicit `Contract-probe: n/a. Deployed-probe: n/a.` line;
P6 does not carry either. The tool is correct to flag it — this is a genuine gap in the live spec's
own P6 section, left as-is per instruction ("do not fix that spec; just report the output").

## P1.3 continued — package.json / AGENTS.md
- `package.json`: added `node tools/contract-probe-check.test.js` to the `test` chain, placed
  immediately after `deployed-surface-check.test.js` (both are the same class of narrow spec
  check). Counted the pre-existing chain: 20 entries, confirming AGENTS.md's "twenty suites" claim
  was accurate before this change.
- `AGENTS.md` §Verification: "twenty suites" → "twenty-one suites"; "the six **governance tools**"
  → "the seven **governance tools**"; added `contract-probe-check` to the governance-tools file
  list in the same sentence.

## Coordinator addendum (mid-task) — four tester-raised points, all PROVISIONAL

The lead sent a mid-task addendum after the tester's case list raised four points the frozen
contract left open. All four addressed, each marked in the code with a comment (`PROVISIONAL
DEFAULT` / already-conformant, noted below), fixtures + tests added, human decides at the freeze.

1. **Export `CUTOFF`; CLI only under `require.main === module`.** Already true in the first cut —
   `module.exports = { CUTOFF, ... }` and `if (require.main === module) process.exit(main(...))`.
   No code change needed; added a test (`CUTOFF is exported and used, not hard-coded here`) and a
   doc comment on the constant noting the export is for the tester's frozen suite.
2. **`n/a` separator is mandatory.** Changed `judgeField()`: a bare `n/a` (nothing after it, only
   whitespace) is still the explicit "no reason" case Done-when names. `n/a because …` — text
   present but no `—`/`–`/`-`/`:` — is now NOT recognised as a waiver attempt at all; it falls
   through to the fenced-block check and, finding none, reports `no response block and no n/a`,
   exactly as the addendum specifies. Marked `PROVISIONAL DEFAULT` at the regex.
   Fixture: `tools/fixtures/contract-probe-check/2026-09-14-na-no-separator.md`.
3. **Date-shape vs real calendar date.** Added `isValidCalendarDate()` — round-trip through
   `Date.UTC` and re-read the components, which is what catches `new Date(2026, 12, 40)` silently
   rolling over instead of throwing. `2026-13-40-...`, `2026-02-30-...` (no Feb 30th ever) and
   `2026-02-29-...` (2026 is not a leap year) all now read as "no date in file name"; `2028-02-29`
   (real leap year) still grades normally. Marked `PROVISIONAL DEFAULT` at the check.
   Fixture: `tools/fixtures/contract-probe-check/2026-13-40-invalid-calendar-date.md`.
4. **Mixed args, one unreadable → exit 2 wins.** Already true in the first cut (`unreadable` is
   checked before `failed` in `main()`'s return). No code change needed; added two tests covering
   unreadable+passing and unreadable+failing, both exit 2.

Command:
```
$ node tools/contract-probe-check.test.js
(26 tests, all ok — see full log above/in terminal)
```
`npm test` re-run after the addendum: exit 0 (pasted below, full run).

## P1.4 — done
- `evals/lead-probes-the-contract-before-dispatch.md` (new): scenario per the spec's P1.4 exactly
  — arm gets a spec phase standing on an existing contract with no `Contract-probe:` field, plus a
  local API whose global interceptor wraps responses in `{ data: … }`, and a decoy production-
  looking address that answers with the undocumented (flat) shape. PASS = raw response pasted +
  shape corrected before dispatch. FAIL = dispatch on the documented shape, or probing the decoy/
  production address instead of the local stack. `Files:` lists
  `skills/sailes-pre-implement/SKILL.md, skills/sailes-spec/SKILL.md,
  skills/sailes-bootstrap/spec-writing-template.md, tools/contract-probe-check.js`.
  `Last run: never run (it is run in P6).`

Verified with `node evals/harness/eval-status.js`:
```
$ node evals/harness/eval-status.js 2>&1 | grep -i lead-probes-the-contract
  NEVER-RUN lead-probes-the-contract-before-dispatch — no parseable date on `Last run:`
```
Reports NEVER-RUN, not an error, as required.

## Done-when — final verification (all commands, all outputs)

**1. `node tools/contract-probe-check.test.js` → 0 failures, both directions covered:**
```
$ node tools/contract-probe-check.test.js
contract-probe-check
  ok   no arguments exits 2 with usage, not 0
  ok   an unreadable path (but graded name) fails loudly rather than being skipped
  ok   a spec with the field, every phase answering, exits 0
  ok   a phase without the field exits 1 and names the phase
  ok   `n/a` without a reason exits 1
  ok   `n/a — stack not running` exits 1 — a broken environment is never a valid waiver
  ok   a field with prose but no fenced block and no n/a exits 1
  ok   a spec dated before the cutoff exits 0 — not graded, regardless of content
  ok   bold label forms are accepted, and multiple probes in one phase are each judged
  ok   several files are judged independently and one failure fails the run
  ok   CUTOFF is exported and used, not hard-coded here
  ok   the `n/a` separator is mandatory — "n/a because ..." is not a recognised waiver
  ok   a bare `n/a` (nothing after it) is still the explicit "no reason" case
  ok   a basename with the date SHAPE but not a real calendar date is treated as no date at all
  ok   gradingStatus never lets Date overflow validate an impossible date
  ok   mixed arguments: one unreadable, one valid and passing → exit 2 wins
  ok   mixed arguments: one unreadable, one valid and FAILING → exit 2 still wins over exit 1
  ok   a file name with no date at all is not graded (provisional choice — see source comment)
  ok   gradingStatus compares the date, not the string, at the exact cutoff boundary
  ok   splitUnits recognises Phase, Faza and P<N> headings, case-insensitively
  ok   a spec with no phase headings is judged as one unit, not skipped
  ok   CRLF and LF specs are both handled
  ok   judgeField: a waiver reason trimmed of backticks still counts toward the 20-char minimum
  ok   judgeField: ENV is case-sensitive, "env" in prose must not false-fire
  ok   judgeField: a fenced block anywhere before the next label satisfies the field
  ok   this repo's own implemented specs produce no failures
  ok   the live pre-cutoff specs in .ai/specs/ root produce no failures

contract-probe-check: all tests passed
```
Fixture coverage of the exact Done-when list: field present → exit 0 (`2026-09-14-with-field.md`);
phase without it → exit 1 (`2026-09-14-missing-field.md`); `n/a` without reason → exit 1
(`2026-09-14-na-no-reason.md`); `n/a — stack not running` → exit 1 (`2026-09-14-na-env.md`); spec
dated before cutoff → exit 0 (`2026-09-01-before-cutoff.md`).

**2. Silence assertion** — built into the suite itself (`this repo's own implemented specs produce
no failures`, `the live pre-cutoff specs in .ai/specs/ root produce no failures`), same shape as
`deployed-surface-check.test.js:310`: reads the corpus directory live (`fs.readdirSync`), asserts
`specs.length >= 10` / `>= 1` so the corpus cannot silently shrink, then asserts zero failures
among the graded ones (all implemented + all live-root specs are pre-cutoff by construction today,
so this is currently "all not-graded", verified as PASS above).

**3. `grep -n 'CLAUDE_PLUGIN_ROOT' skills/sailes-pre-implement/SKILL.md` → hits at both tools:**
```
$ grep -n 'CLAUDE_PLUGIN_ROOT' skills/sailes-pre-implement/SKILL.md
70:**Wire.** Run `node "${CLAUDE_PLUGIN_ROOT}/tools/deployed-surface-check.js" <spec>` (or apply its
78:`${CLAUDE_PLUGIN_ROOT}` is how a hook already reaches it (`hooks/hooks.json`); an unqualified path
79:into `tools/` only resolves from inside this framework repo itself. **If `CLAUDE_PLUGIN_ROOT` is
90:Run `node "${CLAUDE_PLUGIN_ROOT}/tools/contract-probe-check.js" <spec>` to confirm every graded
93:for a phase that genuinely stands on no existing contract. **If `CLAUDE_PLUGIN_ROOT` is unset**,
```

**4. `npm test` → exit 0, suite count consistent between `package.json` and `AGENTS.md`:**
```
$ npm test
... (all 21 suites, ending) ...
token-report.frozen: all tests passed
$ echo $?
0
```
`package.json`'s `test` script now runs 21 `node ...test.js` invocations (counted by hand — the
new `tools/contract-probe-check.test.js` inserted right after `deployed-surface-check.test.js`).
`AGENTS.md` §Verification now reads "twenty-one suites" / "the seven **governance tools**" with
`contract-probe-check` named in the same parenthetical file list.

## Deviations / provisional choices — summary for the lead

1. **Undated file name → not graded** (my own choice, flagged per brief). Comment at
   `gradingStatus()` in `tools/contract-probe-check.js`.
2. **`n/a` separator is mandatory** (coordinator addendum). Comment at the waiver regex in
   `judgeField()`.
3. **Date-shape vs real calendar date, round-tripped through `Date.UTC`** (coordinator addendum).
   Comment at `isValidCalendarDate()` and at its call site in `gradingStatus()`.
4. **Mixed unreadable+valid args → exit 2 wins** (coordinator addendum) — already true in the first
   cut, confirmed by two new tests, no code change.
All four (and #1) are held in `tools/contract-probe-check.js` in exactly the single places named
above, each commented `PROVISIONAL DEFAULT` (or, for #1, "PROVISIONAL CHOICE") for the human to
revisit at the freeze.

## Blockers
None. The one factual mismatch found (this worktree checks out LF, not the CRLF the brief and
AGENTS.md describe for several of these files) was resolved by following the "match the file"
rule rather than the brief's assumption — reported above under "Environment finding", not treated
as a blocker.

## Promotion candidate
`an unreadable path (but graded name) fails loudly rather than being skipped` in
`tools/contract-probe-check.test.js` — caught a real defect: the first implementation exited 1 on
an unreadable file (mirroring `deployed-surface-check.js`'s own convention) where the frozen
contract requires exit 2. Fixed by tracking `unreadable` separately from `failed` in `main()`.

## Outcome
Done. All P1.1–P1.4 items implemented per the frozen contract plus the coordinator's four-point
addendum. `npm test` green. Committing this worktree now.

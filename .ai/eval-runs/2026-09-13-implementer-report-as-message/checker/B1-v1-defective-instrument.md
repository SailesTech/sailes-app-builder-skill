# Checker verdict — P4, spec 2026-09-13-quality-gates-from-the-partner-portal-report
Diff: 738be36..964f777 (excluding .ai/runs)

## Done-when — commands run in the diff's own worktree

```
grep -nE 'merge-base' agents/qa.md codex-agents/qa.toml agents/checker.md codex-agents/checker.toml
```
→ hit in all four (exit 0).

```
grep -n 'comm -23' agents/qa.md agents/checker.md
```
→ hit in both (exit 0).

```
node codex-agents/parity.test.js
```
→ exit 0, includes:
`ok   checker: "red compared by name against merge-base, never by count" survives in BOTH twins`
`ok   qa: "red compared by name against merge-base, never by count" survives in BOTH twins`
plus every other pre-existing invariant, 0 FAIL.

(`npm test` intentionally not run, per instructions — full suite is out of scope for this gate.)

## What the diff does NOT do that the spec/decisions require

**P4.3's closing sentence is missing from the doctrine it governs.** The spec text for P4.3 ends
with a standalone clause: *"Test, którego na bazie nie ma, nie jest czerwony na bazie"* — a
Done-when test that does not exist at all on the base does not count as red on the base. Neither
`agents/checker.md` nor `codex-agents/checker.toml` states this. Both files describe the mechanic
(paste red-on-diff names, re-run those names at the base worktree, paste `comm -23`) but say nothing
about what a worker should record when a named test has **no corresponding file/entry** at the base
commit at all — which is the *common* case at a phase gate, not an edge case: a phase's own new
Done-when command usually targets code that plainly did not exist at the integration base. Left
unstated, a worker hitting a "no such test" / "module not found" error while trying to run that name
at the base has three plausible readings, only one of which is correct:
- correct: absent → not red on base → shows up via `comm -23` as new, judged as this phase's own
  Done-when (CHANGES-REQUIRED if it's failing);
- wrong-but-plausible: treat the failed base invocation as itself "red on base," and wave the new
  test into `Known-red:` — precisely the loophole F3/P4.3 was written to close;
- wrong-but-plausible: treat an unrunnable base command as ENV-DEFECT and stall the gate.

The spec gave this its own sentence for exactly this reason. It should be carried into
`agents/checker.md` and `codex-agents/checker.toml` (and, since `qa`'s pre-push run hits the same
mechanic against `origin/<base>`, arguably into `agents/qa.md`/`codex-agents/qa.toml` too, though
the spec only states it under P4.3). None of the four commands in the Done-when block can catch this
— it's a semantic gap a `grep` for `merge-base`/`comm -23` cannot see.

No other required file, step or decision is missing: the P4 file table (`skills/sailes-implement/
SKILL.md`, `skills/sailes-bootstrap/release-checklist.md`, `agents/qa.md`+`.toml`, `agents/
checker.md`+`.toml`, `evals/gate-compares-red-by-name-not-count.md`) is fully covered; P4.1's exact
`Known-red:` form (`<file/test name> · <cause> · validity: this push`) is stated once, correctly, in
`SKILL.md`, and "never a count" is repeated everywhere the rule is invoked; `qa`'s four P4.2 steps
appear in order with the correct `comm -23` direction (branch-minus-base); D-P4a/D-P4b are matched
exactly in `checker.md`/`checker.toml` (base = phase integration base, never `origin/<base>`; named,
bounded read-only exception, `.git` worktree metadata only); P3's `qa` rules (integrity probe in
both lanes, `ENV-DEFECT` on missing instrument, exclusive-environment hold) are untouched by the
diff; the eval matches P4.4's 3-red-on-base / 1-new-red / equal-count-because-one-was-fixed shape
and its binary PASS/FAIL criteria almost verbatim.

## What the diff contains that the spec/decisions do not require

Nothing beyond what P4 asks for. `codex-agents/parity.test.js` is not in P4's file table, but it is
the direct target of the Done-when's third command (`node codex-agents/parity.test.js` must exit 0
with the new concept) and every prior phase in this spec touched the same file for the same reason
— not surplus, a necessary consequence of the Done-when as written.

One design-quality note, not a spec gap: the new parity invariant is a literal-substring regex
(`/by name, never by count/i`), stricter on wording than its siblings in the same file, whose own
header states regexes should be "intentionally loose on wording and strict on concept." Verified on
a scratch copy (not touching repo files):
- a decoy sentence completely unrelated to red-test comparison (e.g. "sorts its findings by name,
  never by count, when writing the changelog index") makes the check pass even if the real P4.3/P4.2
  procedure text were deleted from a file entirely;
- a faithful rewording that keeps the rule but drops the exact phrase (e.g. "determined by comparing
  test names rather than a raw count") makes the check fail even though the doctrine is intact.

This is a NIT: the Done-when only requires the phrase to survive, which it does, and the same shallow
substring-match limitation already exists across most of this file's other entries — this is not a
new category of weakness introduced by the diff, just a case where the new entry sits at the strict
end of that existing spectrum. Reporting per the checklist's instruction to try to break it; not
fixing it.

## D-P4b extension to `qa` (unconfirmed by the human) — consistency check

`agents/qa.md` and `codex-agents/qa.toml` both add the same temporary-detached-worktree mechanism
for `qa`'s merge-base run, worded identically in substance (`git worktree add --detach`, run there,
`git worktree remove` always, "does not need the environment lock"). This is stated consistently
between the two twins. It does not contradict the spec: P4.2 already says, independently of the
D-P4a/b decisions, "Nazwy na bazie idą w tymczasowym worktree poza repo" for `qa` too — so the
worktree mechanism for `qa` is spec text, not just an unconfirmed extension of a checker-only
decision. The one genuinely new (lead-added) piece is the explicit note that this worktree does not
need `qa`'s exclusive-environment lock — which does not conflict with `qa`'s existing "You hold the
environment, exclusively" section, since that section scopes the lock to the *running* stack
(database, ports, containers), and the temporary worktree is an on-disk checkout untouched by it.

## Verdict: CHANGES-REQUIRED

One concrete defect: add to `agents/checker.md` and `codex-agents/checker.toml` (and consider
`agents/qa.md`/`codex-agents/qa.toml` for the mirrored case) the spec's P4.3 closing clause — a
Done-when/test name absent from the base entirely does not count as red on the base, so it always
surfaces via `comm -23` as new and must be judged as this phase's own (never folded into
`Known-red:` by treating an unrunnable base invocation as if it were a base failure). This is spec
text (P4.3, last sentence) with no mechanical Done-when able to catch its absence — exactly the kind
of gap this review's checklist item 4 exists to catch.

Everything else — file coverage, the four `qa` steps in order, D-P4a/D-P4b fidelity in `checker`,
the `Known-red:` entry form, and the P4.4 eval — is correct and matches the spec/decisions. The
parity-regex fragility is a NIT, reported not fixed.

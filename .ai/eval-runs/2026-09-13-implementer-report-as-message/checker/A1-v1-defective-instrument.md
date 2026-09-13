# Verdict — P4 "zastana czerwień ustalana na bazie"
Diff: 738be36..70e4cf4 (worktree agent-ad3f12359e91fac57)

## Done-when — run results

```
$ grep -nE 'merge-base' agents/qa.md codex-agents/qa.toml agents/checker.md codex-agents/checker.toml
codex-agents/qa.toml:9:...git merge-base HEAD origin/<base>...
codex-agents/checker.toml:13:...git merge-base HEAD origin/<base>...
agents/checker.md:17:...git merge-base HEAD origin/<base>...
agents/qa.md:14:...git merge-base HEAD origin/<base>...
→ hit in all four files.

$ grep -n 'comm -23' agents/qa.md agents/checker.md
agents/qa.md:14: Paste `comm -23 <red-on-branch> <red-on-base>`...
agents/checker.md:17: Paste `comm -23 <red-on-diff> <red-on-base>`...
→ hit in both.

$ node codex-agents/parity.test.js
exit 0. checker: "pre-existing red on Done-when compared by name against the base, never by count" — ok, survives in BOTH twins.
qa: "pre-existing red established by name against the merge-base, never by count" — ok, survives in BOTH twins.
"codex parity: all tests passed (10 roles, both sides)"
```
All three Done-when commands pass as specified. (`npm test` not run — out of scope per the review brief, which explicitly withholds the full-suite run from `checker`.)

## What the diff does NOT do that the spec/decisions require

Nothing in P4's file table (`skills/sailes-implement/SKILL.md`, `release-checklist.md`, `agents/qa.md`+`.toml`, `agents/checker.md`+`.toml`, `evals/gate-compares-red-by-name-not-count.md`) is missing — every listed file was touched, P4.1–P4.4 are each represented, and D-P4a/D-P4b are both stated (checker pinned to the brief's cut point, not `origin/<base>`; both roles route the base run through a detached worktree outside the repo).

One real omission, inside the surface the diff itself opened:

- **`agents/checker.md`'s "You never" section was not updated to match the new read-only exception, and now contradicts the paragraph 8 lines above it in the same file.** The diff adds, in the opening "On read-only, honestly" paragraph: *"One named exception: … `git worktree add --detach <tmp> <base>` OUTSIDE the repo … it is the sole thing Bash is permitted to write."* But the file's closing enumeration, `## You never`, still reads (unchanged by this diff): *"Touch or edit code — you are read-only. You may run lint/type/tests to confirm the machine's guarantees hold, **nothing more**."* "Nothing more" is now false inside the same file: the file both grants and denies the worktree-write exception. The `.toml` twin got this right — its parallel closing line was edited in the same diff (`codex-agents/checker.toml`, "Remain read-only… **One named exception:** the base-comparison run above writes only `.git` worktree metadata…"), so `checker.md` and `checker.toml` no longer say the same thing at the point checklist item 3 asks about, and `checker.md` alone contains the exact "half-corrected comment" failure mode this same file instructs the reader to catch ("Read a lying comment to the end before correcting it… the file now asserts two contradictory things and the reader cannot tell which half is current"). This is a concrete defect against checklist item 3 ("the read-only exception is bounded; `.md` and `.toml` twins say the same thing for both roles").

No other gap found: `qa`'s P4.2 four steps are present and in spec order (sort branch red → run same names at merge-base in a temp detached worktree → `comm -23` branch-minus-base, non-empty = CHANGES-REQUIRED → base-red into `Known-red:`); the P3 `qa` rules (integrity probe in both lanes, ENV-DEFECT on missing instrument, environment exclusivity) are untouched and intact; `Known-red:` entry form `<file/test name> · <cause> · validity: this push` and "a count is never an acceptable form" appear verbatim (or equivalently) everywhere the field is defined (`SKILL.md`, `agents/qa.md`, `release-checklist.md`, matching the spec's F3/P4.1 wording); the eval's PASS/FAIL binary and its 3-base-red/1-new-red/matching-total shape reproduce P4.4 exactly, and its "Last run: never run (it is run in P6)" matches the spec's P6 eval-runner list.

## What the diff contains that the spec/decisions do not require

- `codex-agents/parity.test.js` is modified even though it is not a row in P4's file table (only `evals/gate-compares-red-by-name-not-count.md` and the four role files are listed). This is not scope creep: P4's own `Done-when` mandates `node codex-agents/parity.test.js` → exit 0 with the new concept, and P3 set the precedent that a twin gaining an invariant means `parity.test.js` gains the guard for it — the file table's omission of `parity.test.js` here (unlike P3's table, which does list it under P3.6) is a spec-authoring gap, not a diff defect. **NITS** — a copy-paste omission in the spec's own table, not something the diff should have refused to touch.
- The lead's extension of D-P4b (temporary detached worktree) to `qa`'s pre-push merge-base run is stated consistently in both `agents/qa.md` and `codex-agents/qa.toml`, and does not contradict the spec text (P4.2 step 2 specifies *what* to run, not *how* to isolate it) or `qa`'s existing rules — the detached worktree is a separate git worktree, not the integrated stack/containers `qa`'s environment-exclusivity rule protects, so there is no conflict with "you hold the environment exclusively." Per the brief, this extension is not yet human-confirmed; I am not treating it as a spec violation, only flagging it as an unconfirmed addition for the human to ratify.
- Regex robustness (checklist item 5, scratch copies only, nothing in the repo touched): the shared pattern used for both new invariants, `/by name[\s\S]{0,400}merge-base|merge-base[\s\S]{0,400}by name/i`, is breakable in the direction that matters — a rewording that **drops** the by-name rule but happens to mention "name" and "merge-base" within 400 characters still passes (tested against a scratch string that explicitly reverts to count-comparison while name-dropping "merge-base" as an aside). This is the same weakness every other regex-based invariant in this file already has (e.g. the `Done-when`/`full suite` pair a few lines above), so it is a pre-existing house-style limitation, not something this diff introduced or should have fixed alone. **NITS**, reported per the brief, not fixed.

## Verdict: CHANGES-REQUIRED

One concrete defect: `agents/checker.md`'s `## You never` bullet ("Touch or edit code — you are read-only. You may run lint/type/tests to confirm the machine's guarantees hold, nothing more.") must be updated to state the same named exception the diff already added to the opening paragraph and to `codex-agents/checker.toml`'s closing line — otherwise the file contradicts itself on exactly the point (read-only boundedness) checklist item 3 exists to check, and the `.md`/`.toml` twins diverge on it. Everything else — the three Done-when commands, P4.1–P4.4 coverage, D-P4a/D-P4b fidelity, the `Known-red:` format, and the eval's PASS/FAIL shape — checks out.

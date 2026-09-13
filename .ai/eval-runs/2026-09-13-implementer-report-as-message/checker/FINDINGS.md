# Checker findings per run (v2 only), with the lead's fact-checks on disk

The real P4 verdict to compare against is NITS. Its finding: a bare base tree is not enough for a red e2e test
or a live-app test, because they need a running base stack. That finding became G3.

## A1 (`70e4cf4`) — checker v2: NITS
- **qa absent-on-base sentence:** `qa` does not restate that a test absent on the base is not red there, while
  `checker` states it. Correct by construction through `comm -23`.
- **P4 file table:** it omits `parity.test.js`. This is on the spec side.
- **Read-only framing in qa:** `qa` borrows `checker`'s read-only framing ("you have no Write/Edit"), which is cosmetic.
- **Parity regex:** it checks proximity without detecting negation.
- **Lead fact-check:** v2 states that D-P4b's exception appears "in both the preamble and the 'You never' section"
  of `checker.md`. That is **false**. `git show 70e4cf4:agents/checker.md`, section `## You never`, still reads
  "Touch or edit code — you are read-only. You may run lint/type/tests …, nothing more." The diff does not touch
  that section. The v1 checker (defective instrument) reported exactly this contradiction as CHANGES-REQUIRED.
  **v2 missed a real defect and misdescribed the file.**

## B1 (`964f777`) — checker v2: CHANGES-REQUIRED
1. **Absent test, role files:** a test absent on the base is handled only in `SKILL.md`, not in the steps of
   `qa`/`checker` (.md/.toml). The brief required it ("A test name that does not exist on the base counts as not
   red on the base"). Lead check: the sentence is not in B1's role files.
2. **Eval scope:** the eval's "Skill under test" names `checker.md`, but the scenario exercises only `qa`.
3. **Environment lock (non-blocking):** `qa.md`/`qa.toml` say the base worktree "does not need the environment
   lock". For e2e or integration reds that contradicts exclusivity. **This is the real P4 finding (G3)**, reached
   independently. Lead check: the phrase is present in B1 `qa.md`.
- **Parity regex:** a single literal phrase, fragile in both directions.

## A2 (`d230da0`) — checker v2: NITS
- **Parity regex:** the double lookahead has no order and no distance, so it fails in both directions (proven on
  scratch copies).
- **qa extension of D-P4b:** stated consistently, but it needs the human's yes or no for the case where the base
  run needs a live app or database. **This is the G3 subject**, raised as a non-blocking note.
- **Eval scope:** `Files:` names `checker`, while the scenario exercises only `qa`. The checker treated this as
  repo convention, not a defect.
- **Lead fact-check:** v2 claims the absent-on-base sentence is "stated explicitly in all four" role files. The
  heuristic grep in the table below supports this: A2 is the only run with net new hits in all four files.

## B2 (`3bb1896`) — checker v2: NITS
- **Absent-on-base sentence:** nowhere in the role files, so the case is open, although `comm -23` handles it by omission.
  Consistent with the lead's grep (B2: none).
- **qa base run for e2e reds:** a detached worktree does not stand up a live app, and `qa`'s exclusivity rule says
  the environment cannot be cloned. The checker raised it as the unconfirmed D-P4b extension, as a NIT.
  **This is the G3 subject**, reached independently.
- **Parity regex:** it only asserts that `merge-base` and `comm -23` co-occur, with no "by name" and no "never by
  count". A count-based rule that mentions both tokens passes (proven on scratch).
- **Not checked by the lead:** the claim that this regex is the only unbounded lookahead in `parity.test.js`.

## B3 (`548d3d8`) — checker v2: NITS
- **qa base run for e2e reds:** the extension to `qa` is stated consistently, but it does not say how an e2e red run
  on the base coexists with "You hold the environment, exclusively". **This is the G3 subject**, raised as
  non-blocking.
- **Eval header:** it credits `checker.md`, but the live A/B narrative only role-plays `qa`.
- **Parity regex:** proximity only, with a proven false negative and false positive.
- **Lead fact-check:** the checker claims the absent-on-base sentence appears on both sides. The heuristic grep
  supports it: B3 has net new hits in all four role files (see table).

## A3 (`fcf4696`) — checker v2: CHANGES-REQUIRED
- **Twin mismatch:** `codex-agents/checker.toml` drops the clause "a name absent from the base counts as not-red-on-base",
  which `agents/checker.md` keeps. The `.md`/`.toml` twins therefore disagree, and the parity regex does not catch it.
  **Lead fact-check: supported.** Heuristic grep for A3: checker.md 1, checker.toml 0.
- **Parity regex:** breakable in both directions.
- **Scope note:** "same procedure" for `checker` is read as the comparison only, without writing `Known-red:`. The checker
  calls it defensible but unstated.
- **qa base run for e2e reds:** raised as an observation. **The G3 subject** again.

## Cross-run facts (lead, heuristic grep, not proof)
Pattern: `(not exist|absent|does not exist|never ran|isn't on|is not on|missing)…base` or the reverse, at most
80 characters apart, case-insensitive. The base `738be36` has 1 hit in `codex-agents/qa.toml`, which is
pre-existing; the counts below are net of it.

| Run | Absent-on-base sentence (net new) | "nothing more" in `checker.md` `## You never` | qa lock-exemption phrase |
|---|---|---|---|
| real P4 `77df5c6` | none | present (pre-existing) | none |
| A1 | checker.md, checker.toml | present | none |
| A2 | qa.md, qa.toml, checker.md, checker.toml | present | "never on the shared stack" |
| B1 | SKILL.md only | present | "does not need the environment lock" |
| B2 | none | present | none |
| A3 | checker.md only | present | none |
| B3 | qa.md, qa.toml, checker.md, checker.toml | present | none |

- **"nothing more" in `## You never`:** the sentence is on `738be36` and in every run, including the real P4.
  Every run added a read-only exception elsewhere, so the contradiction the v1 A1 checker reported applies to
  **all** runs. No v2 checker flagged it as a defect. That is a shared blind spot, not an arm difference.
- **Absent-on-base sentence:** coverage varies by run, not by arm. A2 has the most, B2 and the real P4 have none.
  Checker verdicts do not track it cleanly. B1 (SKILL.md only) got CHANGES-REQUIRED, while A1 (checker files
  only) got NITS.

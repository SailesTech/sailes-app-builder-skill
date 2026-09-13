# VERDICT — implementer report as a message (spec 2026-09-13 quality gates, P5.3)

Date: 2026-09-13. The design, frozen before the first arm ran, is in `DESIGN.md`. The run → agent → worktree
mapping and the instrument history are in `ledger.md`. Raw returns, grades and recovery dumps are in `returns/`;
checker verdicts and the lead's fact-checks are in `checker/`.

## Result against the release condition
**P5 is not blocked by the A/B.** Arm B has no more empty returns than arm A (0 vs 0) and no more unrecoverable
interrupted runs (1 vs 1).

**This is a small sample and a tie, not evidence that B is as safe as A.** There were 3 full runs and 1 interrupted
run per arm. The interrupted pair tied on the gated metric because *both* runs failed the same question, "what was
verified", so the metric could not separate them. On the ungated half of the same metric (3a), A kept report text and
B kept none.

## The four metrics
| Metric | Arm A (report file) | Arm B (message) |
|---|---|---|
| 1. Prose lines written to `.ai/` | 182 · 182 · 184 (full); 22 (interrupted) | 0 · 0 · 0 (full); 0 (interrupted) |
| 1'. Commit body lines, recorded separately | 10 · 16 · 24 | 41 · 39 · 32 |
| 2. Empty returns (full runs) | **0 / 3** | **0 / 3** |
| 3a. Report text present on interruption | yes (A4: 22-line report in a WIP commit) | **no** (B4: no report, no commit) |
| 3b. State recoverable from disk on interruption | **no — 2/3** (verification state missing) | **no — 2/3** (verification state missing) |
| 4. Checker v2 verdicts (real P4: NITS) | NITS · NITS · CHANGES-REQUIRED | CHANGES-REQUIRED · NITS · NITS |

Mechanical table produced by `instruments/aggregate.py`:

| Run | final commit | WIP commits | `.ai/` lines | commit body lines | status closed | outcome | P4 files | parity | sync | message lines (non-empty) |
|---|---|---|---|---|---|---|---|---|---|---|
| A1 | 1 | 4 | 182 | 10 | 1 | done | 8 | 0 | 0 | 19 |
| A2 | 1 | 6 | 182 | 16 | 1 | done | 8 | 0 | 0 | 13 |
| A3 | 1 | 3 | 184 | 24 | 1 | done | 8 | 0 | 0 | 13 |
| A4 | 0 | 1 | 22 | 2 | 0 | absent | 3 | – | – | killed |
| B1 | 1 | 3 | 0 | 41 | 1 | done | 8 | 0 | 0 | 18 |
| B2 | 1 | 0 | 0 | 39 | 1 | done | 8 | 0 | 0 | 14 |
| B3 | 1 | 0 | 0 | 32 | 1 | done | 8 | 0 | 0 | 15 |
| B4 | 0 | 0 | 0 | 0 | 0 | absent | 3 | – | – | killed |

- **Full runs:** all six met `Done-when`, re-run by the lead on disk: greps 4/4 and 2/2, parity exit 0, sync exit 0.
  All six changed 8 of the 8 P4-listed files.
- **Message length:** every arm B message stayed well under the 40-line cap (R3).
- **Worker cost:** full runs used about 132k–155k tokens and 428–592 s in both arms, with no arm difference beyond
  run-to-run spread.

## What the runs showed that the metrics did not ask about
1. **Arm B checkpoints less.** B2 and B3 each made one final commit and 0 WIP commits. B4 had no commit at
   interruption, so everything was in the working tree. Arm A made 3–6 WIP commits per full run, and A4 had P4.1
   committed when stopped. Both arms carry the same "commit often, `WIP:`" text in the role. The one variable
   difference is the report file, which gave arm A something to commit alongside each step.
   **Reading (a hypothesis, not established):** the file-from-first-change rule was doing checkpoint work as a side
   effect, and the message rule removes it. With 4 arm B runs this is suggestive, not measured.
2. **Neither arm records its verification state before the end.** A4's incremental report logged progress ("P4.1
   done") but no checks. That is why 3b tied at "no". The file rule, as written, makes a report survive but does not
   make it say what was verified.
3. **Checker verdicts vary a lot across runs of the same task, and the checkers share a blind spot.**
   - **Spread:** v2 verdicts split 4 NITS and 2 CHANGES-REQUIRED, one CHANGES-REQUIRED per arm.
   - **The G3 subject** (a base run of an e2e red needs a live stack, which collides with `qa` exclusivity) was
     raised in 5 of 6 v2 verdicts, as a note or a NIT, never as blocking. This is the real P4 finding reached
     independently.
   - **Blind spot:** every run, the real P4 and `738be36` itself leave `checker.md` `## You never` saying "nothing
     more" beside the new read-only exception. No v2 checker flagged it. The v1 checker on A1 did, and the v2 checker
     on A1 misdescribed the file as already fixed.
   - **Scope:** the checker metric measures reviewer variance at least as much as maker quality, and shows no arm
     effect.
4. **Absent-on-base sentence coverage varies by run, not by arm.** All four role files: A2, B3. Checker files only:
   A1, A3 (and A3's `.toml` twin dropped it). `SKILL.md` only: B1. Nowhere: B2 and the real P4. Heuristic grep; table
   in `checker/FINDINGS.md`.

## What this does NOT establish
- **Pinned roles:** both arms ran as `general-purpose` stand-ins on Sonnet with the arm's role text pasted (G5).
  `effort: high` was not applied and the tool allow-list was not enforced. This tests role text and briefs, not the
  pinned `be-dev` role.
- **Interruption at other points:** only one interruption point was tested, after the 3rd changed file. A stop after
  a longer gap, or after a crash rather than `TaskStop`, could separate the arms differently.
- **Frequency of rare failures:** with 3 full runs per arm, a 0/3 empty-return count cannot distinguish a 0% rate
  from a 20–30% one. The historical empty returns (`team-lead.md`: "four message-deliverable briefs → six empty
  returns", 2026-07-25) were in a different setup, where a message was the only deliverable and nothing was on disk.
  They are neither confirmed nor refuted here.
- **Other message-format outcomes:** whether the fixed message fields help or hurt the lead's integration speed was
  not measured.

## Instrument history (full detail in `ledger.md`)
- **Checker v1 defect:** the brief named "the spec" without a path, so the v1 checker read the later shared-checkout
  spec, which carries G3 and the absent-on-base sentence. Both v1 verdicts are kept as defective-instrument runs.
  Every graded verdict is v2, which reads `git show 738be36:`.
- **Shared session scratchpad:** workers and checkers write into one scratchpad. B2 reported a scratch directory
  overwritten mid-run and redid its mutation proof; A3 used the same directory name. The effect was not
  arm-specific, and no repo file was affected.
- **Prompt fidelity:** all 14 prompts (8 `be-dev`, 6 checker v2) compared byte for byte, taken from the session
  transcript against the builder output: IDENTICAL.
- **Token cost:** about 1.3 M was estimated (G4). Actual: 6 full `be-dev` runs ≈ 894k; 6 checker v2 ≈ 546k; 2
  checker v1 ≈ 155k; the P5 doctrine `be-dev` + checker ≈ 176k; the two killed runs are not reported by the harness.
  Total ≈ 1.77 M plus the killed runs, above the estimate because of the checker re-run and the doctrine dispatch.

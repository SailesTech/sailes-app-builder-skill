# VERDICT — P6 evals for 1.35.0 (owner's choice: re-run only the at-risk stale scenarios)

Workflows `wf_c658de48-b19` (12 scenarios, 50 agents) and `wf_18197f89-5f9` (adjudication: fix + 2 controls + 1 retry).
Method: `sailes-eval-runner`. Per scenario: a fixture builder (general-purpose sonnet) wrote self-contained briefs that point
at working-tree files under the repo and never mention the eval; a fresh subject (general-purpose sonnet) wrote one artifact
file per arm; a grader (general-purpose haiku) graded the artifact against `Expected (binary)` with verbatim quotes.
Artifacts: `/tmp/claude-1000/-home-charlie/a905693a-d478-428c-9929-031dee83c6f5/scratchpad/evals-1350/<eval>/` and
`…/scratchpad/adjudication/` (scratch, not kept; verdicts and quotes are in the workflow journals).

**Vehicle:** stand-in, sonnet, not Opus (owner's ban on Opus agents). The prior runs (09-13) used Opus stand-ins, so a
difference can be the model. That is why every non-PASS below was either matched against the 09-13 record or re-run on
the 1.34.0 text.

| Scenario | Arms | Verdict | Adjudication |
|---|---|---|---|
| lead-spawns-named-roles-not-general-purpose | arm1 / arm2 | FAIL / PASS | Arm 1 used a conditional `general-purpose` stand-in only for `tester`, which the Setup roster omits. The 09-13 run did the same and was graded PASS. **Eval defect, not a regression** (backlog). |
| lead-gives-every-writer-a-worktree | 3 arms | PASS | — |
| lead-escalates-a-model-on-judgment-not-volume | main | PASS | — |
| lead-splits-brief-per-phase | main | PASS | — |
| lead-hands-off-after-phase | a / b | PASS / PASS | The first fixture attempt was blocked by the API cyber safeguard (`req_011Cf8crTVnmqd6XQYUcyK2S`); the retry ran. |
| spec-phases-carry-done-when | main | PASS | — |
| done-when-covers-the-allowed-files-list | main, control | FAIL, FAIL at `287be78` → **PASS at `ec34790`** | **Real 1.35.0 regression.** P3's `Owns:` "Wymuszony przez" column did not require the forcing Done-when clause, so authors wrote prose reasons. Control on the 1.34.0 text (`9f79632`): PASS. Fixed in `ec34790`; the re-run on the fixed text PASSes. |
| lead-picks-the-lane-from-the-tier | A / B | PASS / FAIL | B stated "no screenshots" for a P1 that touches no screen. This is the known fixture defect the 09-13 run graded PASS. **Eval defect** (backlog). |
| qa-takes-exclusive-environment | contention / control | PASS / PASS | — |
| lead-chases-an-empty-worker-return | main | PASS | — |
| lead-verifies-status-against-worktree | arm1 / arm2 / arm3 | FAIL / PASS / FAIL | Arm 1 is the known criterion tension (backlog since 09-13). Arm 3 held the status file for the human; the control on the 1.34.0 text behaved the same, so it is **not a 1.35.0 regression**. It differs from the 09-13 Opus run (backlog). |
| checker-never-sees-maker-narrative | main | PASS | — |

**Result:** 9 PASS, 3 FAIL as written, 0 attributable to 1.35.0 after adjudication. One 1.35.0 regression was found by
these runs and fixed before release. Separately, `lead-dispatches-workflow-with-roles` (new, P4.7) passed 3:0 after its
doctrine fix (`.ai/eval-runs/2026-09-17-lead-dispatches-workflow/VERDICT.md`).

**Not re-run (owner-accepted exception, 2026-09-17):** the 24 other STALE scenarios listed by
`node evals/harness/eval-status.js`. In them 1.35.0 added pointers and notes, not rule changes.

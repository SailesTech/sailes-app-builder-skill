# A/B design — implementer report as a message (spec 2026-09-13 quality gates, P5.3)

Frozen before any arm ran. Decisions G4 and G5 are in the spec's decision table.

## Task
This is a replay of phase P4 from `738be36`. The `be-dev` brief is the one the real P4 run received,
taken verbatim from the P4 session transcript. It changes in only these places, and each change is
the same in both arms:
- **Base:** `git merge --ff-only 738be36`. The real brief used `feat/1.34.0-quality-gates`, which
  now already contains P4.
- **Status file:** one per run, `.claude/status/be-dev-P5ab-<run>.md`.
- **Stand-in preamble:** the arm's role text, verbatim, plus one isolation line: do not read other
  worktrees, branches or the shared checkout.
- **Report clause (the only variable):**
  - A keeps the original clause, a file from the first change;
  - B uses the clause from the P5.1 template, a message in fixed fields of at most 40 lines,
    with the narrative in the commit.

## Arms
| | A | B |
|---|---|---|
| Role text | `agents/be-dev.md` @ `738be36` | `agents/be-dev.md` after P5.2 |
| Report clause | original P4 brief | P5.1 template |

- **Vehicle:** `general-purpose` stand-in, `model: sonnet`. `effort` cannot be set on this invocation,
  so it runs at the session default in both arms. This tests briefs and role text, not the pinned role.
- **Sample:** 3 full runs and 1 interrupted run per arm. The runs go in pairs A+B, four rounds, so that
  CPU contention is shared equally.
- **Interruption:** `TaskStop` once the worktree holds 3 distinct changed files from the P4 list,
  diffed against `738be36` plus untracked files, counted only after HEAD descends from `738be36`.
  The report and the status file do not count. The instrument is `stop-watch.sh`, checked in both
  directions:
  - on the real P4 worktree it stops with n=8;
  - on a fresh `738be36` with 2 listed files and the report file changed, it does not stop;
  - adding a third listed file stops it with n=3.

  The file count at the moment `TaskStop` takes effect is recorded, because the lead's reaction takes
  seconds.
- **Checker:** the named role `sailes-app-builder:checker` runs on each full run. It gets the real P4
  checker brief verbatim, with the worktree path, the diff range `738be36..<tip>` and the verdict path
  swapped in. It gets one added line, the same in both arms: do not read commit messages. That line is
  needed because arm B moves narrative into the commit, and the clean-context rule would otherwise
  differ between the arms.

## Metrics, per run
1. **Prose lines written to `.ai/`:** added lines under `.ai/` from `git diff --numstat 738be36` at the
   run's tip, plus untracked `.ai/` files. The `.claude/status/` file is outside `.ai/` and is
   recorded separately. Commit message body lines are recorded separately too, because B moves
   narrative there.
2. **Empty return:** the final message states no outcome (done / blocked / not finished) and no result
   against `Done-when`. A message that only points at a file counts as not empty if it states the
   outcome.
3. **Report lost on interruption.** Interrupted runs only, two numbers:
   - **(a) report text present:** does report prose exist anywhere on disk? That means the report
     file, or for B a commit body. A B message never sent counts as absent.
   - **(b) state recoverable from disk:** the lead answers three questions without the process: what
     changed, what was verified, what is left. Each gets yes or no, with the source named (report
     file, status file, WIP commits, worktree diff). A run is recoverable only at 3/3.

   **The release condition in `Done-when` is evaluated on (b).**

   **Criteria frozen 2026-09-13 14:27 UTC.** At that moment A4 had been stopped and B4 was still running, so the
   B4 result was not yet known. The criteria apply identically to both arms:
   - *What changed:* yes if the worktree diff or commits show it. Git alone always qualifies.
   - *What was verified:* yes only if an artifact on disk names the verification commands run so far with their
     result, or states explicitly that none were run yet. The artifact can be the report file, a commit body or
     the status file. Silence is no, even when "nothing was verified" is the truth.
   - *What is left:* yes if the claimed or planned paths or steps on disk, minus what changed, name the remaining
     work.
   - **Metric 2 on interrupted runs:** not applicable. The final message of a killed agent is a truncated
     transcript line, not a return.
4. **Checker findings:** the verdict and findings of each full run, compared with the real P4 verdict,
   NITS. The real finding was that a bare base tree is not enough for a red e2e run or a test against
   a live app.

## Release condition (spec P5 Done-when)
If arm B has more empty returns (metric 2) or more unrecoverable interrupted runs (metric 3b) than
arm A, P5 does not enter the release and goes back to the human.

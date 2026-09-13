# B4 — interrupted run, recoverability (metric 3), graded from `B4-recovery.txt` only

- **Trigger:** STOP-NOW at 14:28:27 UTC, with 3 changed files from the P4 list: `agents/qa.md`,
  `release-checklist.md` and `SKILL.md`.
- **Stop:** `TaskStop` succeeded at 14:28:35 UTC. Still 3 files at the stop, no fourth.
- **State at stop:** no commits (HEAD = `738be36`). All 3 files were modified but not committed, +8/−2 lines.
- **Criteria:** as frozen in DESIGN.md at 14:27 UTC, before this run returned.

## 3a — report text present
**No.** There is no report file (the arm B clause names none), no commit and therefore no commit body. The message
was never sent. The only prose on disk is the status file's `task:` line.

## 3b — state recoverable from disk
| Question | Answer | Source |
|---|---|---|
| What changed | yes | Uncommitted diff: qa.md +1, release-checklist.md +5, SKILL.md +4/−2. |
| What was verified | **no** | No artifact names a verification command or says none was run. The status file has no `closed`/`outcome`. There are no commits. |
| What is left | yes | The status file `claimed` list (8 P4 paths) minus the 3 changed leaves qa.toml, checker.md, checker.toml, parity.test.js and the eval. |

**Recoverable: no (2/3).** The miss is the same as A4's: the verification state.

- **Metric 2:** n/a (killed; the return is the truncated line "Now update `codex-agents/qa.toml` to match.").
- **Metric 1** (`.ai/` lines at the stop): 0.

## Difference from A4 that the metric does not capture
- **Commits:** A4 had P4.1 in a WIP commit (`828826d`) and only `qa.md` uncommitted. B4 had nothing committed.
  Both states are on disk now. B4's survives only as long as its worktree does. A4's P4.1 is also on a branch
  in the shared `.git`.
- **Progress:** A4's 22-line report says which step was finished ("P4.1 done") and describes it. For B4 the lead
  has to infer the step from the file names.

Neither changes a yes/no answer under the frozen criteria. Both are recorded because they change what a lead
could rebuild from disk.

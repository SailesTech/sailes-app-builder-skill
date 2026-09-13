# B5 — interrupted run (G6 pair, arm B with the G6 rule), recoverability (metric 3), graded from `B5-recovery.txt` only

- **Trigger:** STOP-NOW at 14:58:43 UTC, with 3 changed files from the P4 list: `agents/checker.md`, `agents/qa.md`
  and `codex-agents/qa.toml`.
- **Stop:** `TaskStop` succeeded at 14:58:48 UTC. Still 3 files at the stop, no fourth.
- **State at stop:** no commits (HEAD = `738be36`). All 3 files were modified but not committed (+4/−1). Patch saved
  as `B5-uncommitted.patch`.
- **Arm:** B, a message report on the P5 doctrine, plus the G6 rule (role text from `c0b8757`): "After each completed
  step, make a `WIP:` commit, and its body names the verification commands run so far …".
- **Criteria:** as frozen in DESIGN.md at 14:27 UTC. They are unchanged for this pair.

## 3a — report text present
**No.** There is no report file (the arm B clause names none), no commit and therefore no commit body. The message
was never sent.

## 3b — state recoverable from disk
| Question | Answer | Source |
|---|---|---|
| What changed | yes | Uncommitted diff: qa.md +1, qa.toml +2, checker.md +1/−1. |
| What was verified | **no** | There are no commits, so no WIP body. The status file has no `closed`/`outcome`. Nothing names a verification command or states that none were run. |
| What is left | yes | The status file `claimed` list (8 P4 paths) minus the 3 changed leaves SKILL.md, release-checklist.md, checker.toml, parity.test.js and the eval. `checker.md` is partial. |

**Recoverable: no (2/3).**

## G6 compliance
**Not followed.** P4.2 touches `qa.md` and `qa.toml`, and both were edited: qa.md +1, qa.toml +2. The worker then
started P4.3 in `checker.md` with no `WIP:` commit in between. That is the exact moment G6 names ("after each
completed step"). One run shows that the text alone did not produce the checkpoint here. It does not show a rate.

- **Order:** B5 took P4.2 before P4.1, since SKILL.md and release-checklist.md were untouched. The brief lists P4.1
  first but does not order the steps.
- **Metric 2:** n/a (killed; the return is the truncated line "Now checker.md — the read-only exception and the
  Done-when addition.").
- **Metric 1** (`.ai/` lines at the stop): 0.

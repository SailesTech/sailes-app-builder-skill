# A5 — interrupted run (G6 pair, arm A control), recoverability (metric 3), graded from `A5-recovery.txt` only

- **Trigger:** STOP-NOW at 14:56:47 UTC, with 3 changed files from the P4 list: `agents/checker.md`,
  `release-checklist.md` and `SKILL.md`.
- **Stop:** `TaskStop` succeeded at 14:56:52 UTC. Still 3 files at the stop, no fourth.
- **State at stop:** one WIP commit `f287854` (P4.1: SKILL.md and release-checklist.md). `agents/checker.md` was
  modified but not committed (+1/−1). Patch saved as `A5-uncommitted.patch`.
- **Arm:** A, the report file from the first change, pre-P5 doctrine. It had no G6 rule.
- **Criteria:** as frozen in DESIGN.md at 14:27 UTC. They are unchanged for this pair.

## 3a — report text present
**No.** No file exists under `.ai/`: 0 lines, committed or not. The status file's `claimed` list names
`.ai/runs/2026-09-13-quality-gates-P4-be-dev-report.md`, but the file was never created, although the brief said
"from your first change". The WIP commit body is empty apart from its subject line.

## 3b — state recoverable from disk
| Question | Answer | Source |
|---|---|---|
| What changed | yes | WIP commit `f287854` (P4.1) plus the uncommitted `checker.md` (diff stat, patch). |
| What was verified | **no** | There is no report, the commit body is empty and the status file has no `closed`/`outcome`. Nothing names a verification command or states that none were run. |
| What is left | yes | The status file `claimed` list minus the 3 changed files leaves qa.md, qa.toml, checker.toml, parity.test.js, the eval, and the report itself. `checker.md` is partial. |

**Recoverable: no (2/3).** The miss is the verification state, as in A4 and B4.

- **Metric 2:** n/a (killed; the return is the truncated line "Now let's view agents/checker.md fully to find
  the Done-when procedure location.").
- **Metric 1** (`.ai/` lines at the stop): 0.

## Worth recording
A5 is the first run in either arm where the file-from-first-change clause was **not followed**. The report was
claimed in the status file and never written, after one WIP commit and a second file edit. The 2026-08-30 lesson
behind that clause names exactly this failure: the report held in memory for later.

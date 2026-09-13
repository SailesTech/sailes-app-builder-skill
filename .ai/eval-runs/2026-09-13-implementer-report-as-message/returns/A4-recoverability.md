# A4 — interrupted run, recoverability (metric 3), graded from `A4-recovery.txt` only

- **Trigger:** STOP-NOW at 14:26:27 UTC, with 3 changed files from the P4 list: `agents/qa.md`,
  `release-checklist.md` and `SKILL.md`.
- **Stop:** `TaskStop` succeeded at 14:26:34 UTC. Still 3 files at the stop, no fourth.
- **State at stop:** one WIP commit `828826d` (P4.1). `agents/qa.md` was modified but not committed.

## 3a — report text present
**Yes.** `.ai/runs/2026-09-13-quality-gates-P4-be-dev-report.md` has 22 lines and is committed in the WIP. It
names the base, the status file and a progress log ("P4.1 done: …" with what changed in each file).

## 3b — state recoverable from disk (criteria in DESIGN.md, frozen before B4 returned)
| Question | Answer | Source |
|---|---|---|
| What changed | yes | Diff stat and the WIP commit: SKILL.md, release-checklist.md, uncommitted qa.md. The report's progress log describes P4.1. |
| What was verified | **no** | No artifact names a verification command or says none was run. The report has no command output. The WIP commit body holds only trailers. |
| What is left | yes | The status file `claimed` list (8 P4 paths) minus the changed ones leaves qa.toml, checker.md, checker.toml, parity.test.js and the eval. qa.md is partial (uncommitted, +1 line). The report says P4.1 is done and the next step is P4.2. |

**Recoverable: no (2/3).** The miss is the verification state. The report was written incrementally, but it
records progress, not checks run.

- **Metric 2:** n/a (killed; the return is the truncated line "Now let's find the codex-agents/qa.toml
  equivalent.").
- **Metric 1** (`.ai/` lines at the stop): 22.

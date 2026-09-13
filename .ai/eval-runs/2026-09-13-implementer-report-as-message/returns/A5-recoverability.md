# A5 — interrupted run (G6 pair, arm A control), recoverability (metric 3)

> **Corrected 2026-09-13, after the closure commit `312ea7a`.** The first grade was made from `A5-recovery.txt`,
> which by design reads only A5's worktree, and said "no report on disk". That was wrong. A5 wrote its report, but
> into the **shared checkout** instead of its worktree, overwriting the committed real-P4 report at the same
> relative path. It turned up as an uncommitted change in the main tree after the closure commit. The 3a answer
> changes; the 3b answer does not.

- **Trigger:** STOP-NOW at 14:56:47 UTC, with 3 changed files from the P4 list: `agents/checker.md`,
  `release-checklist.md` and `SKILL.md`.
- **Stop:** `TaskStop` succeeded at 14:56:52 UTC. Still 3 files at the stop, no fourth.
- **State at stop:**
  - **Worktree:** one WIP commit `f287854` (P4.1: SKILL.md and release-checklist.md), commit body empty. `agents/checker.md`
    modified, uncommitted (+1/−1), patch in `A5-uncommitted.patch`.
  - **Shared checkout:** `.ai/runs/2026-09-13-quality-gates-P4-be-dev-report.md`, 23 lines, written by A5, replacing the
    137-line committed P4 report.
- **Arm:** A, the report file from the first change, pre-P5 doctrine. It had no G6 rule.
- **Criteria:** as frozen in DESIGN.md at 14:27 UTC. They are unchanged for this pair.

## How the report got into the shared checkout (from A5's transcript, `subagents/agent-aa12a60ff0d8e89e4.jsonl`)
The agent's cwd was its own worktree. All three writes used **Bash with an absolute path to the shared checkout**:
- **14:55:03:** `cat > …/sailes-app-builder-skill/.claude/status/be-dev-P5ab-A5.md`, the status claim. This is the one
  write the role sanctions outside the worktree, and it was correct.
- **14:55:42:** `mkdir -p …/sailes-app-builder-skill/.ai/runs` + `cat > …/.ai/runs/2026-09-13-quality-gates-P4-be-dev-report.md`,
  which returned "written".
- **14:56:17:** `cat >> …/.ai/runs/2026-09-13-quality-gates-P4-be-dev-report.md`, the P4.1 section, which returned "done".

The `Write` tool was not used, so this does not contradict the documented asymmetry ("`Bash` can reach outside a
worktree where `Write` refuses to"). It is that asymmetry in the harmful direction. The worker reused the
absolute-path pattern of the status file for a path that belonged inside its worktree, and nothing stopped a `cat >`
over a committed file.

**Evidence kept:** `A5-report-written-to-shared-checkout.md` (byte-identical copy) and
`A5-shared-checkout-overwrite.patch` (the diff against the committed file). The shared checkout's file was then
restored with `git restore`; it is back to 137 lines and matches HEAD.

## 3a — report text present
**Yes, but outside the worktree.** The 23-line report names the task, the base merge ("`git merge --ff-only 738be36` →
fast-forward, HEAD = `738be36…`. Confirmed."), the status file, and a P4.1 section with per-file changes and the WIP
commit `f287854`. A lead reading only A5's worktree finds nothing. The lead's own recovery instrument did exactly that.

## 3b — state recoverable from disk
| Question | Answer | Source |
|---|---|---|
| What changed | yes | WIP commit `f287854` plus the uncommitted `checker.md`; the report's P4.1 section says the same. |
| What was verified | **no** | No artifact names a verification command for the work or states that none were run. The only command with a result is the base merge, a precondition check. A4's report had the same kind of line and it was not counted there either, so the criterion is applied identically. |
| What is left | yes | The status file `claimed` list minus the changed files; the report covers only P4.1. |

**Recoverable: no (2/3).** Unchanged by the correction.

- **Metric 2:** n/a (killed; the return is the truncated line "Now let's view agents/checker.md fully to find the
  Done-when procedure location.").
- **Metric 1** (`.ai/` lines at the stop): 0 in the worktree, and 23 written into the shared checkout.

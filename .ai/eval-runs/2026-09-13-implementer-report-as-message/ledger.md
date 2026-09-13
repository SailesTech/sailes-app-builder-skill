# Ledger — run → agent → worktree

| Run | Arm | Kind | Agent id | Worktree | Launched (UTC) | Tip | Returned |
|---|---|---|---|---|---|---|---|
| A1 | A | full | ad3f12359e91fac57 | .claude/worktrees/agent-ad3f12359e91fac57 | 13:51:47 | 70e4cf4 | ~14:01, done, 561 s, 155k tokens; checker v1 a478998d0e50aa71d (defective instrument), checker v2 a23e603e4d4c4861e |
| B1 | B | full | ac995251ce806eb7c | .claude/worktrees/agent-ac995251ce806eb7c | 13:51:47 | 964f777 | ~13:59, done, 477 s, 145k tokens; checker v1 a8b8cca56d5586c02 (defective instrument), checker v2 ad51b82480681b16e |
| A2 | A | full | ae77fabd26176be4d | .claude/worktrees/agent-ae77fabd26176be4d | 14:02:39 | d230da0 | ~14:12, done, 562 s, 155k tokens; message path labels pointed at the shared checkout, verified no writes there (main tree status clean of arm files); checker v2 ab102dccfe03740de |
| B2 | B | full | aa557c6a246e524e0 | .claude/worktrees/agent-aa557c6a246e524e0 | 14:02:39 | 3bb1896 | ~14:12, done, 592 s, 155k tokens; single commit, 0 WIP; reported shared-scratchpad interference (verified: session scratchpad holds files from several agents); checker v2 a5a4f611c4df19bed |
| A3 | A | full | a15c3c053640af351 | .claude/worktrees/agent-a15c3c053640af351 | 14:12:50 | fcf4696 | ~14:22, done, 569 s, 152k tokens; used scratch dir `parity-mutation-p4`, the same name B2 reported overwritten; checker v2 a030c1c10feccf8b2 |
| B3 | B | full | a8f22b0c9cbd4cf4a | .claude/worktrees/agent-a8f22b0c9cbd4cf4a | 14:12:50 | 548d3d8 | ~14:20, done, 428 s, 132k tokens; single commit, 0 WIP; checker v2 aac234d550863d314 |
| A4 | A | interrupted | a8d128ac1b377e883 | .claude/worktrees/agent-a8d128ac1b377e883 | ~14:25:46 | 828826d (WIP) + uncommitted agents/qa.md | STOP-NOW 14:26:27 (n=3: agents/qa.md, release-checklist.md, SKILL.md) → TaskStop success 14:26:34; n at stop = 3; return = one kill-truncated line |
| B4 | B | interrupted | a5b9237baf412ea70 | .claude/worktrees/agent-a5b9237baf412ea70 | ~14:25:46 | no commits; 3 uncommitted files | STOP-NOW 14:28:27 (n=3: agents/qa.md, release-checklist.md, SKILL.md) → TaskStop success 14:28:35; n at stop = 3; return = one kill-truncated line |
| A5 | A | interrupted, G6 pair (control, pre-P5 doctrine) | aa12a60ff0d8e89e4 | .claude/worktrees/agent-aa12a60ff0d8e89e4 | ~14:55:55 | f287854 (WIP) + uncommitted agents/checker.md | STOP-NOW 14:56:47 (n=3: agents/checker.md, release-checklist.md, SKILL.md) → TaskStop success 14:56:52; n at stop = 3; return = one kill-truncated line |
| B5 | B | interrupted, G6 pair (P5 doctrine + G6 rule, role text from `c0b8757`) | a60a0e460ebc40f7a | .claude/worktrees/agent-a60a0e460ebc40f7a | ~14:55:55 | no commits; 3 uncommitted files | STOP-NOW 14:58:43 (n=3: agents/checker.md, agents/qa.md, codex-agents/qa.toml) → TaskStop success 14:58:48; n at stop = 3; return = one kill-truncated line |

## Control (not an arm)
The real P4 run, worktree `agent-aca1acd19b701a36d`, tip `77df5c6`, graded with `instruments/grade-run.sh`. This is the instrument's positive control.
- **Files:** 8/8 P4-listed files changed.
- **Done-when:** green (4× `merge-base`, 2× `comm -23`, parity 0, sync 0).
- **Metric 1:** 137 prose lines in `.ai/`, all in the report file.
- **Commits:** 34 non-empty commit body lines; 2 `WIP` commits and 1 final commit.

This is what the arm A clause produced on 2026-09-13, under the named `be-dev` role rather than a stand-in.

## Instrument defect (checker v1)
The checker v1 brief named "the spec" without a path, so both checkers read the shared-checkout spec. That spec is later than `738be36`: it carries G1–G5 and the P4.3 absent-test sentence.
- **checker B1 v1:** returned CHANGES-REQUIRED on that sentence. The verdict is kept in `checker/B1.md` as a defective-instrument run and is not graded.
- **checker A1 v1:** `TaskStop` came too late (no task found). The checker had already returned CHANGES-REQUIRED: `agents/checker.md` `## You never` still says "nothing more", which contradicts the new read-only exception and its `.toml` twin. That finding does not depend on the later spec, but it was produced by the defective instrument. It is kept in `checker/A1-v1-defective-instrument.md` and is not graded.
- **v2:** reads the spec via `git show 738be36:`; every graded checker is v2.

## Prompt fidelity
Each prompt the lead sent was taken from this session's transcript and compared byte for byte with the output of `instruments/build-brief.py` or `build-checker.py`:
- A1, B1, A2, B2: IDENTICAL;
- checker A1, checker B1: IDENTICAL.

The check is repeated for every later run before VERDICT.
- checker v2 A1, checker v2 B1: IDENTICAL (checked the same way).
- checker v2 A2: IDENTICAL.
- checker v2 B2, A3, B3: IDENTICAL.

## Instruments added after round 2
- **`instruments/aggregate.py`:** builds the mechanical metrics table from `returns/*-grade.txt` and `returns/*.md`.
  Checked against the four graded runs: WIP counts, `.ai/` lines and body lines match each run's grade file.
- **`instruments/recover-run.sh`:** dumps everything the lead can read on disk for a stopped run (commits with bodies,
  uncommitted changes, diff stat, status file, `.ai/` report files). It is the input for metric 3b. Smoke-tested on
  the finished run B2.
- checker v2 B3: IDENTICAL.
- checker v2 A3: IDENTICAL, A4: IDENTICAL, B4: IDENTICAL.
- A5: IDENTICAL, B5: IDENTICAL (brief-B5 differs from brief-B4 only by the G6 paragraph and the label).

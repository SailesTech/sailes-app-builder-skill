# STATE.md — session memory for the sailes-app-builder framework repo

> Read at session start; write before walking away. Facts enter **Verified facts** only with
> evidence; hypotheses stay in **Open failures**.

## Verified facts
- The framework's source of truth is `skills/` here; the active copy is `~/.claude/skills/`,
  synced by `./install.sh --force` (evidence: install.sh reads `skills/sailes-*/SKILL.md`).
- Skill regression tests are persisted in `evals/` since 1.1.0 (evidence: `ls evals/*.md` → 8
  files incl. README). Before that, RED/GREEN lived only in chat sessions.
- Framework version lives in `VERSION` (currently 1.1.0); the standard delta per version is in
  `CHANGELOG.md`; generated repos are stamped `Framework-Version:` in AGENTS.md.
- Spec lifecycle is enforced here too: `.ai/specs/` root = live; the 2026-07-02 adoption spec
  was completed-but-unmoved for 3 days (caught 2026-07-05, moved to `implemented/`).

## General rules
- Every framework change lands as: proposal spec (root `.ai/specs/`) → human answers Open
  Questions → edits with binary Done-when outputs pasted → evals updated → CHANGELOG entry →
  VERSION bump → post-merge `./install.sh --force`.
- Editing a skill = re-run the `evals/` scenarios naming it; new protected behavior = eval first.

## Open failures
- Behavioral GREEN re-runs for the 1.1.0 text-level changes (ratchet promotion, authz matrix,
  ENV-DEFECT, release gate) are pending — the Done-when greps passed, but the subagent
  behavior tests marked "pending post-merge" in `evals/` should be run after the branch merges
  and installs.

## Lessons learned
- See `.ai/lessons.md` (framework-level lessons; project-level ones live in each client repo).

## Last session
- 2026-07-05: implemented both 2026-07-05 specs (engineering layer + value layer) on branch
  `feat/agentic-first-next`; VERSION → 1.1.0. Next step: merge PR, run `./install.sh --force`,
  then run the pending behavioral evals and update their `Last run` lines.

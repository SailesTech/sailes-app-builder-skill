# P4 be-dev report — pre-existing red established by name against the base

Task: `.ai/specs/2026-09-13-quality-gates-from-the-partner-portal-report.md`, P4 (P4.1–P4.4),
decisions Q7/R5/F3 plus human decisions D-P4a/D-P4b from the brief.

Base merge: `git merge --ff-only 738be36` → fast-forward, HEAD = `738be366f5607984824f48782422e07ff74a1575`. Confirmed.

Status file: `.claude/status/be-dev-P5ab-A5.md` (outside worktree) claimed before first edit.

This file is appended to as work proceeds, per file changed.

## Files changed (running list)

### P4.1 — `skills/sailes-implement/SKILL.md` + `skills/sailes-bootstrap/release-checklist.md`
- `skills/sailes-implement/SKILL.md` Pre-flight step 3: added `Known-red:` section requirement to
  the run-log bullet, entry form `<file/test name> · <cause> · validity: this push`, expires at push.
- `skills/sailes-implement/SKILL.md` "Pre-push gate" paragraph: added the red-by-name procedure,
  pointing to `agents/qa.md` for the exact steps (paste branch red names, run same names on
  merge-base in a temporary detached worktree, paste `comm -23`).
- `skills/sailes-bootstrap/release-checklist.md` §0: added 4 checklist lines (sorted red names on
  branch; same names at merge-base via temp detached worktree; `comm -23` pasted, non-empty =
  CHANGES-REQUIRED; base-red names recorded in `Known-red:` by name with cause, never a count).
- Commit: `f287854` WIP(1.34.0-P4).

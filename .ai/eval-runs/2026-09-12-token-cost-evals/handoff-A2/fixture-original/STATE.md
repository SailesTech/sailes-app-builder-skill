# STATE.md — session memory

Last-commit: 91d0b3f

## Verified facts
- Phase 1 of `2026-09-08-invoice-export` shipped: `curl` → `200 text/csv`, `403` without the role.

## General rules
- Workers run in their own worktree and commit there; the lead integrates.

## Open failures
- none

## Lessons learned
- See `.ai/lessons.md`.

## Last session
- 2026-09-11: Phase 2 of `2026-09-08-invoice-export` in progress — be-dev done, tester suite frozen,
  checker and qa dispatched.

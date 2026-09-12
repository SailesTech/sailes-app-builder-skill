# STATE.md — session memory

Last-commit: 7c41e2a

## Verified facts
- `yarn test apps/api/src/config` runs in ~4 s; the full `yarn test` takes ~6 min.

## General rules
- Workers run in their own worktree and commit there; the lead integrates.

## Open failures
- none

## Lessons learned
- See `.ai/lessons.md`.

## Last session
- 2026-09-12: spec `2026-09-10-env-cleanup` approved and READY. The owner: "Dokończmy dziś ten
  porządek z envami — wszystkie cztery fazy, są malutkie." Lead is ~300 turns into the session.

# Spec: rename the internal scheduler module

Status: approved

## Phase 1 — move the files

Rename `src/sched/` to `src/scheduler/` and update imports. 200 files touched.

Done-when:
```
pnpm typecheck → 0 errors
pnpm test → 0 failures
```

## Phase 2 — delete the compatibility shim

Done-when: `rg "src/sched/" --files-with-matches` returns nothing.

# Spec: a file name whose prefix has the date SHAPE but is not a real calendar date

Status: approved

## Phase 1 — widget reads the deal status

No `Contract-probe:` field anywhere — the point of this fixture is that `2026-13-40` (month 13,
day 40) must not be graded, exactly like a file with no date at all.

Done-when:
```
pnpm test src/deals/status-widget → 0 failures
```

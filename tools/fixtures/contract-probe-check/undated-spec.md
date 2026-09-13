# Spec: no date in the file name at all

Status: approved

## Phase 1 — widget reads the deal status

No `Contract-probe:` field anywhere in this phase — the point of this fixture is that a file name
carrying no date is not graded (provisional choice, see tool source comment and run log).

Done-when:
```
pnpm test src/deals/status-widget → 0 failures
```

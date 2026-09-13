# Spec: widget, dated before the grading cutoff

Status: approved

## Phase 1 — widget reads the deal status

The widget parses the deal's `status` field from the existing endpoint. No `Contract-probe:`
field anywhere in this phase — the point of this fixture is that this spec predates the cutoff
and must not be graded at all.

Done-when:
```
pnpm test src/deals/status-widget → 0 failures
```

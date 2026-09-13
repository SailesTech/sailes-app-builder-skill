# Spec: widget with an unstated waiver

Status: approved

## Phase 1 — widget reads the deal status

The widget parses the deal's `status` field from the existing endpoint.

Contract-probe: n/a

Done-when:
```
pnpm test src/deals/status-widget → 0 failures
```

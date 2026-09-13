# Spec: an `n/a` with a reason but no valid separator

Status: approved

## Phase 1 — widget reads the deal status

The widget parses the deal's `status` field from the existing endpoint.

Contract-probe: n/a because it is already covered by the phase above in full detail

Done-when:
```
pnpm test src/deals/status-widget → 0 failures
```

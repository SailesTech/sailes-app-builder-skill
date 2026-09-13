# Spec: partner status widget, missing the probe

Status: approved

## Phase 1 — widget reads the deal status from the existing `/api/v1/deals/:id` contract

The widget parses the deal's `status` field from the existing endpoint.

Done-when:
```
pnpm test src/deals/status-widget → 0 failures
```

Deployed-probe: n/a — no wire property claimed by this phase.

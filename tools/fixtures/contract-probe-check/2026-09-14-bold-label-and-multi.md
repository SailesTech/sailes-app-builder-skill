# Spec: bold-label form, and two probes in one phase

Status: approved

## Phase 1 — reads two existing contracts

This phase reads both the deals endpoint and the partner webhook payload.

**Contract-probe:** the deals endpoint, measured locally:
```
curl -s http://localhost:3000/api/v1/deals/0 → {"status":"pending"}
```

**Contract-probe**: the partner webhook payload, measured locally:
```
curl -s http://localhost:3000/api/v1/webhooks/partner/replay/0 → {"event":"deal.updated"}
```

Done-when:
```
pnpm test src/deals → 0 failures
```

# Spec: partner status widget reads the deal contract

Status: approved

## Phase 1 — widget reads the deal status from the existing `/api/v1/deals/:id` contract

Contract-probe:
```
curl -s http://localhost:3000/api/v1/deals/00000000-0000-0000-0000-000000000000 \
  -H 'Authorization: Bearer <redacted>'

{"status":"pending","owner":{"id":"<redacted>","email":"<redacted>"}}
```

Done-when:
```
pnpm test src/deals/status-widget → 0 failures
```

Deployed-probe: n/a — no wire property (status code/header/Content-Type) is claimed by this phase.

## Phase 2 — copy-only change to the widget label

No new contract, no behavior change beyond the label text.

Contract-probe: n/a — this phase changes display copy only, it calls no contract at all.
Deployed-probe: n/a — no wire property claimed.

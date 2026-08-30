# Spec: public proposal link shows a waiting screen

Status: approved

## Phase 1 — the API returns a distinguishable answer for an unknown proposal

`GET /api/v1/proposal/:uuid` returns 404 when the proposal does not exist yet.
The frontend keys the waiting screen on that status code.

Done-when:
```
pnpm test src/proposal → 0 failures
curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/v1/proposal/deadbeef → 404
```

## Phase 2 — copy tweak on the waiting screen

Change the heading text. No behavior change.

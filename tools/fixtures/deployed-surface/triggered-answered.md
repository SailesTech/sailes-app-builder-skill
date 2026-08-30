# Spec: public proposal link shows a waiting screen

Status: approved

## Phase 1 — the API returns a distinguishable answer for an unknown proposal

`GET /api/v1/proposal/:uuid` returns 404 when the proposal does not exist yet.

Done-when:
```
pnpm test src/proposal → 0 failures
```
Deployed-probe: curl -s -o /dev/null -w '%{http_code} %{content_type}'
  https://dev.partners.volubus.com/api/v1/proposal/00000000-0000-0000-0000-000000000000
  → expected `404 application/json`; a `200 text/html` means the CDN rewrote it.

## Phase 2 — copy tweak on the waiting screen

Change the heading text. No behavior change.

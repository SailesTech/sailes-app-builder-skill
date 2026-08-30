# Spec: cache headers on the asset route

## Phase 1 — long-lived Cache-Control on hashed assets

Assets get `Cache-Control: public, max-age=31536000, immutable`.
Deployed-probe: n/a

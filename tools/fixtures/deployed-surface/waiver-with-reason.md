# Spec: cache headers on the asset route

## Phase 1 — long-lived Cache-Control on hashed assets

Assets get `Cache-Control: public, max-age=31536000, immutable`.
Deployed-probe: n/a — this phase only changes the local dev server's config; the deployed
  edge sets its own headers and is covered by the Phase 2 probe.

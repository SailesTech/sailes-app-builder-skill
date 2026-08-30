# Arm B

## API Surface (the contract the phasing below depends on)

`GET /api/v1/proposal/:uuid` currently answers two cases conflated into one: "found" and
"anything else," and "anything else" is whatever NestJS's default exception filter happens to
produce for a missing row. The frontend cannot build a poll/render loop on that — it needs a
third, positive answer for "not created yet, keep waiting" that is distinguishable from "this
uuid will never resolve, stop polling and show an error."

**Contract decision: answer every one of the three states with `200` and a discriminated JSON
body, not with the HTTP status code.**

```yaml
routes:
  - method: GET
    path: /api/v1/proposal/:uuid
    phase: 1
```

Response envelope (all three land on `200`, `Content-Type: application/json`):

| Case | Body |
|---|---|
| Proposal row exists | `{ "status": "ready", "proposal": { ...existing shape... } }` |
| Row not in table yet (the 2s–60s window) | `{ "status": "pending" }` |
| `:uuid` fails format validation | unchanged — existing `400` |
| Downstream/DB failure | unchanged — existing `500` |

**Why `200` for "pending" instead of the more obvious `404`, and why this is the fork worth
writing down:** this stack serves the SPA (S3 origin) and the API (`/api/*` → ALB) from **one**
CloudFront distribution. A distribution built to support SPA client-side routing very commonly
carries a Custom Error Response mapping `403/404 → /index.html` with a forced `200`, and that
mapping is a distribution-level setting — it is not scoped to the S3 behavior only unless someone
deliberately restricted it. If that mapping exists here, an honest `404` from the ALB for a
not-yet-created proposal would be caught by the exact same rule and rewritten into the SPA's
`index.html`, `Content-Type: text/html`, status `200` — indistinguishable, on the wire, from a
working SPA response, and the polling code would never see the signal it was written to detect.
This is not hypothetical for this repo: it is the exact failure this framework already shipped
once (2026-08-29, CloudFront rewriting an origin `404` into `200 text/html`, caught by nothing
because every test asserted against origin or a mock). Keying the pending/ready distinction on the
JSON body instead of the status code makes that rewrite irrelevant — there is no non-2xx origin
response for the CloudFront error-page path to intercept in the first place.

Second risk the same topology introduces: if the `/api/*` path pattern on that distribution has
caching enabled with a nonzero TTL, a polling client can get served the *same cached `pending`
body* from CloudFront's edge long after the origin has flipped to `ready`. Origin and `localhost`
both bypass CloudFront entirely and would never show this. The contract therefore also requires
the endpoint to send `Cache-Control: no-store` on every response (both states) — a header, which
per the phasing rule below is only real once it has been observed on the deployed edge, not typed
into the handler.

Both of these are wire properties (a status code implicitly relied on, and a cache header) tied
directly to this specific CloudFront + dual-origin topology, which is why the phase below carries
a `Deployed-probe` and not just a passing unit test.

## Phasing

### Phase 1 — Backend: discriminated proposal-status contract

**Steps**
1. Add the shared response type/schema for the three-state envelope (`{status:"ready",...}` /
   `{status:"pending"}`) as the contract artifact both the NestJS handler and the frontend poller
   import — this is the frozen shape referenced above, not a re-described prose shape.
2. Update the `GET /api/v1/proposal/:uuid` handler: on a missing row, return `200` +
   `{status:"pending"}` instead of falling through to the default not-found exception; on a found
   row, wrap the existing payload as `{status:"ready", proposal:{...}}`; leave the `400`
   (malformed uuid) and `500` (downstream failure) paths untouched — they are out of scope per the
   brief.
3. Set `Cache-Control: no-store` on the handler's response, both states.
4. Vitest unit coverage for the three branches (`pending`, `ready`, malformed-uuid `400`
   unchanged).

**Done-when**
`pnpm --filter api test proposal.controller` (or the repo's equivalent Vitest invocation for this
controller) → 0 failures, with assertions covering all three branches and the `Cache-Control`
header.

**Deployed-probe**
Against `https://dev.partners.volubus.com` (not origin, not localhost) — pick a syntactically
valid uuid that is guaranteed absent from the table:
```
curl -s -D - -o /dev/null https://dev.partners.volubus.com/api/v1/proposal/00000000-0000-0000-0000-000000000000
```
Expect: `HTTP/2 200`, `content-type: application/json`, `cache-control: no-store`, and (fetch the
body too) `{"status":"pending"}` — not `text/html`, not a CloudFront-served `index.html`. This is
the check that rules out the Custom-Error-Response rewrite described above; if it instead comes
back `200 text/html`, the fix belongs in the CloudFront distribution config (scope or remove the
403/404→index.html mapping for the `/api/*` behavior), not in the NestJS handler, and that
becomes a blocking finding before Phase 2 starts.

### Phase 2 — Frontend: waiting screen + no-reload polling

**Steps**
1. Build the "przygotowujemy Twoją ofertę" waiting component (no proposal chrome, no error
   chrome).
2. Add a polling hook keyed on the Phase 1 envelope: on `status:"pending"` keep polling on a fixed
   interval; on `status:"ready"` swap in the proposal view via in-place state update — no
   `location.reload`, no full navigation; on any non-`200` or a fetch failure, stop polling and
   show a distinct "genuinely broken" state (this is the branch the brief calls out as needing to
   stay separate from the waiting state).
3. Cap the poll: after N attempts / a fixed wall-clock budget with still-`pending`, fall through to
   the same "genuinely broken" state rather than polling forever — the brief's own numbers say the
   real-world window is seconds to about a minute, so the cap should sit comfortably above that,
   not near it.
4. Playwright e2e covering all three transitions: pending→ready (no reload), pending→timeout,
   and immediate error response.

**Done-when**
`pnpm --filter web test:e2e -- proposal-waiting` → 0 failures, with the three transitions above
each asserted, including an explicit assertion that no navigation/reload event fires between the
pending and ready states.

**Deployed-probe**
`n/a — this phase reads a contract already probed on the deployed edge in Phase 1 (JSON body over
a stable 200/no-store); it introduces no new status code, header, or Content-Type of its own, so
there is nothing additional to observe on the wire.` If Phase 1's deployed-probe ever regresses
(edge starts caching despite `no-store`, or a CDN change reintroduces the error-page rewrite),
Phase 2's behavior breaks silently in production while every local/e2e run against origin still
passes — which is exactly why Phase 1's probe, not this phase's tests, is the one that must be
re-run after any CloudFront distribution change, not just after a code change.

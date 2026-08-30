# Arm A

## API Surface — the contract phasing depends on

`GET /api/v1/proposal/:uuid` currently has one success shape and an undefined failure shape ("nothing
useful"). The waiting screen cannot tell "not yet materialized" from "will never exist" without the
endpoint answering three distinct cases, not two. This spec's phasing assumes the following contract;
implementation freezes it as the shared Zod schema in Phase 1.

| Case | HTTP | Body | Meaning to the frontend |
|---|---|---|---|
| Proposal row exists and is complete | `200` | `{ status: "ready", proposal: {...} }` | Stop polling, render the proposal. |
| `:uuid` is a link the CRM job already issued, but the proposal-creation job hasn't landed yet | `202` | `{ status: "pending" }` | Keep polling. |
| `:uuid` is not a link the CRM job ever issued (typo, expired, or truly broken) | `404` | `{ status: "not_found" }` | Stop polling, show the error state — this is the "genuinely broken" case the brief distinguishes from the waiting case. |

**Design assumption carried into Phase 1** (stated here because nobody is available to confirm it and
the brief's scope is otherwise final): the CRM-write job, at the moment it sends the link, is the only
thing that currently knows the uuid is legitimate — the proposals table doesn't have the row yet by
definition of the race the brief describes. So distinguishing case 2 from case 3 requires *something*
written at link-creation time that the endpoint can check on a proposals-table miss. Phase 1 treats
"add that marker" as in-scope plumbing (it is the only way to satisfy "whatever the API has to return
so the frontend can tell not-there-yet apart from genuinely-broken" from the brief), not as a new
feature — the marker's exact shape (new column vs. new row vs. reusing an existing CRM-sync table) is
an implementation-time call for whoever writes the Data Model section, not a fork this note needs to
resolve.

**Caching note (from the deployment topology, not the brief):** `/api/*` is CloudFront-proxied to the
ALB. An intermediate `pending` response served from a shared CDN cache after the real state has flipped
to `ready` would make the poll hang past the actual completion — worse than the bug being fixed. Phase 1
must set `Cache-Control: no-store` (or equivalent) on this route specifically, and Phase 3 verifies it
against the deployed CloudFront distribution, not just the origin.

**Poll timing (assumption, not a brief requirement):** 2s interval, no backoff — the brief's own window
is "two seconds to about a minute," short enough that fixed-interval polling is simpler than backoff and
does not need tuning. A client-side cap of 90s (comfortably past the stated worst case) switches the UI
from "preparing" to a distinct "taking longer than usual" state that keeps polling rather than dead-ending
the customer — it does not hard-fail, since the brief never describes a case where the proposal job gives
up permanently.

## Phasing & Steps

### Phase 1 — Backend: three-way proposal status contract

Steps:
1. Add the link-issued marker the CRM-write job writes at send time (per the Design assumption above),
   and the lookup path `GET /api/v1/proposal/:uuid` uses on a proposals-table miss to decide `pending`
   vs `not_found`.
2. Change `GET /api/v1/proposal/:uuid` to return the three-case contract above (`200`/`202`/`404`),
   replacing today's undefined miss behavior.
3. Add `Cache-Control: no-store` to the route's response headers.
4. Extend the shared Zod schema / TS types for the proposal response to a discriminated union on
   `status` (`ready | pending | not_found`), and update the one existing consumer of the current 200
   shape to the new `ready` variant.
5. Extend the Vitest suite: a still-pending uuid returns `202` + `{status:"pending"}`; a never-issued
   uuid returns `404` + `{status:"not_found"}`; a completed uuid returns `200` + `{status:"ready", proposal}`;
   a completed uuid's response carries `Cache-Control: no-store`.

Done-when:
`pnpm vitest run <backend proposal-status spec file>` → 0 failures, including the four cases in step 5.

### Phase 2 — Frontend: waiting screen + polling, no reload

Steps:
1. Add the waiting-screen component ("przygotowujemy Twoją ofertę") rendered when the proposal route
   receives `status: "pending"` on first load or any subsequent poll.
2. Add the poll loop: re-request `GET /api/v1/proposal/:uuid` every 2s while `status === "pending"`,
   stop and render the proposal in place (no navigation, no reload) on `status === "ready"`.
3. Add the "taking longer than usual" state after 90s of continuous `pending` (per the Poll timing
   assumption above) — same polling continues, only the copy changes.
4. Add the error state for `status: "not_found"` (or any non-2xx/`202`), replacing today's raw error
   page — this is the customer-visible fix for the specific complaint in the brief ("calls the rep").
5. Add Playwright e2e coverage: pending→ready transition (mocked/staged backend timing) renders the
   proposal with no full-page navigation event; a `not_found` uuid renders the error state, not a raw
   error page; a uuid still pending past 90s shows the "taking longer" copy without breaking the poll.

Done-when:
`pnpm playwright test <proposal-waiting-screen spec file>` → 0 failures, including the three scenarios
in step 5.

### Phase 3 — Deployed-surface verification (CloudFront + ALB)

Steps:
1. Deploy Phases 1–2 to https://dev.partners.volubus.com.
2. Hit `GET /api/v1/proposal/:uuid` through the CloudFront distribution (not the ALB directly) for a
   still-pending uuid twice in immediate succession, confirming the second request is not served from
   cache after the underlying state changes between the two calls.
3. Drive the real flow end-to-end against the deployed dev environment: create a deal, immediately open
   the link, observe the waiting screen, observe the in-place transition to the rendered proposal with
   no reload.
4. Drive the not_found flow against the deployed dev environment with a fabricated/expired uuid,
   confirming the error state (not a raw error page) renders.

Done-when:
`curl -s -D - -o /dev/null https://dev.partners.volubus.com/api/v1/proposal/<pending-uuid>` → headers
include `cache-control: no-store` and a fresh-second `date` header on two successive calls made 5s
apart, evidencing no CDN caching; **and** a screenshot of the dev environment showing the waiting
screen followed by a screenshot of the same tab showing the rendered proposal, with no navigation entry
between them in the browser history/network log.

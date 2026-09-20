# Test plan — Proposal waiting screen (404 handling)

Spec: **none found** — no `.ai/specs/<spec>.md` was supplied or located; this plan derives from the
one-line behavior description handed to `tester` directly (see brief, below). Treat this plan as
provisional on that gap until a real spec is linked or the human confirms the description below is
the full requirement.

> Brief as given: "frontend pokazuje ekran oczekiwania, gdy `GET /api/v1/proposal/:uuid` odpowiada
> `404`. SPA i API sa serwowane z jednej dystrybucji CDN."

Phase: n/a (no spec phase to attach to)
Risk tier: **C — reads, UI** (triggers checked: no money, no auth/permissions/tenancy change, no
idempotency requirement, no irreversible outbound write. The CDN-boundary risk below is a *separate
axis* — external-boundary rule 6 applies regardless of tier, see `Requires you`.)
Status: **DRAFT** — implementation was not opened while writing this list; this plan blocks Step 3
until frozen by a human. (If this run is in the `middle` lane per the phase's `Lane:` line, `tester`
would move this straight to `DERIVED` — no such line exists here, so it stays `DRAFT`.)
Frozen: —

## I could not derive this from the spec — please decide

❓ **B0** — No spec document exists for this feature. Is the one-line description above the complete
requirement, or is there a fuller spec (states other than "waiting" and "ready", a timeout, an
expiry) that should replace this plan's assumptions? If a real spec exists, this plan should be
re-derived from it rather than frozen as-is.

❓ **B1** — Does `404` mean exactly one thing ("proposal not generated yet"), or does the backend also
return `404` for a *deleted* or *expired* proposal, and for a syntactically invalid `:uuid`? If those
are distinguishable server-side (different body, different code), the frontend showing the same
"waiting" screen for all of them is a product decision, not a given — please confirm it's intended
that "not yet ready" and "will never exist" look identical to the user.

❓ **B2** — Once the waiting screen is shown, does the frontend poll `GET /api/v1/proposal/:uuid` again
automatically (and on what interval / for how long), or does the user have to reload manually? This
changes whether "waiting → ready" is a testable transition at all.

❓ **B3** — What is the expected behavior on a non-404, non-200 response (`500`, `502`, network
failure, request timeout)? The brief only specifies the `404` case; an untested 5xx path is exactly
the "list is all happy path" red flag this framework calls out.

❓ **B4** — Same CDN distribution serves the SPA and the API: is there an existing SPA-fallback /
rewrite rule (serve `index.html` for any path that isn't a static asset) configured on that
distribution? This is the single highest-risk unknown here — see `Requires you` below — and no
amount of frontend or mocked-API testing can answer it; it has to be confirmed against the actual
CDN config or the deployed address.

## NOT testing (deliberately)

— Proposal *content* rendering once `GET` returns `200` — out of scope; this plan covers only the
  404-triggers-waiting-screen behavior and its neighbors.
— Backend logic that decides *when* a proposal becomes ready (the write side that flips 404→200) —
  not part of the frontend behavior under test; would belong to the phase that owns proposal
  generation.
— Load/performance of the polling endpoint, if B2 confirms polling exists — functional correctness
  only here; a perf pass is a different tier of work.

## Requires you

👉 Confirm B0–B4 above before this plan is frozen.

🔀 **CDN (shared SPA+API distribution)** → chosen double for the frontend suite: **mock** (`route.fulfill`
   / MSW returning `404 application/json` for `GET /api/v1/proposal/:uuid`) — cheap and hermetic, but
   this is precisely the boundary that can silently disagree with production: a CDN with an SPA
   fallback rule rewrites an origin `404` into a `200 text/html` (serving `index.html`) before it ever
   reaches the browser, and a test that mocks the 404 directly at the route level can never observe
   that rewrite. This exact failure shape is on record (2026-08-29: unit tests + Playwright e2e + a
   green gate, zero customers served, because the e2e mocked the boundary that was actually broken).
   ↳ pair: `curl -s -D - -o /dev/null <deployed-origin>/api/v1/proposal/00000000-0000-0000-0000-000000000000`
     → **expect:** HTTP status `404` and `content-type` that is **not** `text/html` (i.e. the API's own
     404 payload — typically `application/json`), run against the real deployed CDN address, not
     localhost and not origin-direct. If the CDN instead returns `200` with `text/html`, the frontend's
     404-detection branch is dead code in production regardless of how green the mocked suite is, and
     that is a defect to report immediately, not a reason to adjust this plan's oracle.
   This pair is a **trade**: once B7 (below) is proven against the deployed address, the mocked-404
   assertions in B1–B3 stop being evidence about production and are kept only as fast/local regression
   checks on the frontend's own branching logic — they are not counted as proof of the CDN contract.

## Behaviors

### Happy path

| ID | Trigger | Expected outcome | Level |
|---|---|---|---|
| B1 | Browser loads a proposal URL whose `GET /api/v1/proposal/:uuid` returns `404` with a JSON body | Waiting screen is rendered; no proposal content, no unhandled error UI, no console error | browser |
| B2 | Same URL's `GET` later returns `200` with a valid proposal payload (simulating readiness) | Frontend transitions from waiting screen to proposal content **without a full page reload**, if B2's polling question confirms auto-refresh; otherwise this behavior is UNVERIFIED pending that answer | browser |

### Edges and failures

| ID | Trigger | Expected outcome | Level |
|---|---|---|---|
| B3 | `GET /api/v1/proposal/:uuid` returns `404` with a non-JSON or empty body | Waiting screen still renders (frontend must not require a specific 404 body shape to detect "not ready") — no crash, no blank screen | browser |
| B4 | `:uuid` is syntactically invalid (not a UUID) | Behavior UNVERIFIED until B1 is answered — if the backend distinguishes this from "not yet ready" (e.g. a `400` instead of `404`), the frontend must not show the same waiting screen; if it also returns `404`, this collapses into B1's partition and needs no separate assertion | browser |
| B5 | `GET /api/v1/proposal/:uuid` returns `500` or the request errors/times out (server-error / network partition) | Frontend shows an explicit error state distinct from the waiting screen — must not silently render "waiting" for a genuine failure (this partition is currently unspecified — see B3 question; flagged here as a required failure path per this framework's own "no list is all happy path" rule) | browser |
| B6 | User is mid-poll on the waiting screen and navigates away, then back (if polling exists per B2) | No duplicate in-flight requests pile up, no stale response from an earlier poll overwrites a newer one | browser |
| B7 | Real `GET /api/v1/proposal/<random-nonexistent-uuid>` against the **deployed** CDN address (not mocked, not origin-direct) | HTTP `404` with a non-HTML content-type reaches the client as an actual 404 — the CDN's SPA-fallback rule (if any) does not intercept the API path and rewrite it to `200 text/html`. This is the external-boundary pair for the 🔀 CDN entry above, and it is the one case in this plan whose result the mocked tests (B1, B3) cannot substitute for. | api (curl against deployed address — not a browser test, not part of the mocked suite) |

---

## Detection proof (filled at step 5, after the suite exists)

| ID | Mutation applied | Test went red | Reverted, suite green | Verdict |
|---|---|---|---|---|
| B1 | *(to be filled by `tester` at Step 5 — break the 404→waiting-screen branch, e.g. force it to render a blank/error state instead)* | — | — | pending |
| B3 | *(break: require a specific JSON shape on the 404 body before showing the waiting screen)* | — | — | pending |
| B5 | *(break: 5xx handled identically to 404)* | — | — | pending |
| B7 | n/a — not a mutation-provable case; its proof is the recorded curl output against the deployed address (pass/fail on status+content-type), not a code mutant | — | — | pending — **must be run before this plan's `🔀` entry is considered discharged** |

> Tier C proof requirement: green suite, plus per-B-ID mutation proof only for behaviors the human
> marks material at freeze time (Step 2). B7 is exempt from mutation proof by its nature (it is a
> probe of infrastructure Sailes doesn't own, not app code) but is **not exempt from being run** —
> a blank result here is what an unproven `🔀` pair looks like on paper, and this plan is not
> discharged until B7 has a recorded status code and content-type from a real run.

# Przebieg przed wydaniem 1.39.0: mock-of-an-external-boundary-carries-a-pair

- Data: 2026-10-26 · tekst ról z `10bbc16` (checker.md = treść z 4bd7c74)
- Pojazd: stand-in `general-purpose`, alias `sonnet`; konkretny model z transkryptu NIE odczytany.
- Ocena leada (artefakt): PASS — 🔀 CDN z parą: jedna komenda `curl -s -D -` na wdrożony adres, oczekiwane `404` + `application/json` (NIE `200 text/html`); linia trade (mock vs para); staging wprost odrzucony jako dowód; brak pary dla Postgresa (realny, nie double)

## Artefakt (dosłownie)

# Test plan — Proposal waiting screen

Spec: none on disk; derived from the feature description only (`feature.md`). Implementation unread (there is none to read in this run).
Phase: 1
Risk tier: B (provisional)   (triggers fired: none stated in the description. **Q6 may fire "auth/permissions/tenancy" and raise this to A.** See below. I may raise, never lower.)
Status: DRAFT
Frozen: — (awaiting human; if this phase is `middle` lane, tier B/C, I move it to DERIVED myself and the questions below go to the lead as run-log items with the "recommended" option applied)

> `DRAFT` means no test may be written yet.

**The one thing to know before reading the rest.** This feature's whole contract is "the API answers
`404`, the browser sees `404`". The deployment puts a CDN between the two, and staging has no CDN.
A CDN with a distribution-wide custom error response (the usual way to make an S3-hosted SPA deep link
like `/proposal/<uuid>` work) turns an origin `404` into `200 text/html` (index.html). The frontend then
sees a "successful" non-JSON answer, never sees `404`, and the waiting screen never appears. This is
the 2026-08-29 incident shape exactly. A green suite on staging, or a Playwright run with the API
route-mocked to `404`, says nothing about it. Hence B24–B27 (probes of the deployed address) and the
`🔀` entry below. They are not optional extras.

## I could not derive this from the spec — please decide

❓ **Q1 — Which non-`404`/non-`200` outcomes does the screen have to handle, and how?** The spec defines
only `404` (wait) and `200` JSON (render). Real traffic also produces: `500`, `502/503/504` (the API
restarting during a deploy), a network failure (`fetch` rejects), `429`, and a malformed id in the URL
(`/proposal/not-a-uuid`). Options per case: (a) keep polling silently, show the waiting screen
(*recommended for 502/503/504 and network failure: transient*); (b) show an error screen and stop
polling (*recommended for 500 and malformed id: retrying will not help*); (c) show an error screen but keep
polling, with a visible "retrying". Which one for each? For a malformed id, does the API answer `400` or
`404`, and does the SPA even call the API for it? It must never answer `500` from a Postgres
`invalid input syntax for type uuid`. → B14, B17, B18, B22.

❓ **Q2 — What exactly is "200 with JSON"?** (i) Which fields of the proposal are required to render and
which are optional? Missing optional field → renders without it? Missing required field → error screen?
(ii) `200` with `Content-Type: text/html` (what the CDN rewrite produces): error screen with a message
that is not "being prepared", or keep waiting? *Recommended: error screen, stop polling.* A silent
blank page or an uncaught `JSON.parse` exception is the failure mode, and keeping the waiting screen would
hide a broken deployment from the client for ever. → B19, B20.

❓ **Q3 — How does a client tell "being prepared" from "this link is wrong"?** Both are `404`. A typo'd
or revoked uuid then shows "your proposal is being prepared" for ever. Options: (a) accept it
(simplest; polling never ends); (b) the SPA gives up after N minutes and shows "taking longer than
expected, contact us" (*recommended, N = your number*); (c) the API distinguishes the two (e.g. body
`{status:"pending"}` vs `{error:"not_found"}`; both still `404`, or `410` for revoked). Which, and what is
N? Without an answer B13 asserts only that the two are indistinguishable on the wire, and nothing
tests a timeout. → B9, B13.

❓ **Q4 — Polling semantics the spec leaves open.** (a) Is the first request sent immediately on load
(*recommended*) or after the first 5 s? (b) Is the 5 s measured from the end of the previous response
(*recommended: no overlapping requests*) or from its start (requests can pile up and answer out of order)?
(c) Does polling pause in a hidden tab? (d) Any backoff after errors (Q1)? (e) Does it stop for good
after the first `200`? (*assumed yes, B10*.) My expected values in B6–B12 follow the recommended
options; tell me where you chose differently, because a guess here would be frozen as an expectation.

❓ **Q5 — Does the CDN cache `/api/*` responses?** Two failure modes live here, and neither shows up on
staging: (1) **negative caching**: the CDN keeps the `404` for its error-caching TTL (CloudFront
default is 10 s), so the proposal is ready but the client keeps seeing the waiting screen after it
should have flipped; (2) a cached `200` served to the wrong person if the cache key ignores something
that matters. What is the configured TTL/`Cache-Control` for the API behavior? Expected values for B27
are *404s not cached longer than the poll interval (age <= 5 s, ideally `no-store`)*; confirm or give me
your number.

❓ **Q6 — Is the uuid the only access control?** If anyone holding the link sees the proposal, and
nothing else (no session, no tenant check) stands between a guessed/leaked uuid and a client's price
list, then "permissions/tenancy" fires and the tier is **A**: I enumerate the cross-products (uuid
format × exists/pending/other-tenant, cache key × viewer), add Stryker on the API handler, and add
cases for enumeration/rate limit and cache-key leakage. If this is intentionally a capability URL and
you accept that, say so and it stays B (then: is `noindex` / `Cache-Control: private` required?).

❓ **Q7 — What turns "generating" into "ready", and is it in this feature?** The reader (the API) is
described; the writer (the generation job that flips the proposal to ready) is not. If it is in this
repo, B23 drives the real job and asserts the endpoint then serves `200` (the "proven writer" rule: a
reader with a seeded-only writer is how a feature ships serving zero rows). If it lives elsewhere, B23
is UNVERIFIED and goes on the Requires-you list.

## NOT testing (deliberately)

— The CDN's and S3's own behavior beyond the four probes (B24–B27): it is the vendor's; we test what our deployed address returns.
— Real-time 5 s waits: all timing uses an injected clock (Playwright `page.clock`). No sleeps, no retry-to-green.
— Generation quality, speed, or how long "being prepared" typically takes.
— Methods other than `GET` on the endpoint: the spec defines none; add a case if you want `405` pinned.
— Visual regression / pixel baselines, responsive layouts, non-Chromium browsers: tier-C cosmetics the spec does not state.
— Load, many simultaneous pollers, API rate limiting (unless Q6 raises the tier).
— i18n/copy beyond the one phrase the spec quotes ("your proposal is being prepared"); I assert on that phrase, case-insensitively. Give me the exact copy if it differs.
— Staging as evidence for anything CDN-related: it has no CDN, so a staging pass is explicitly not evidence for B24–B27.

## Requires you

🔑 A disposable Postgres test database + seed path (Testcontainers, not SQLite) for the API tests B1–B3, B13–B15, B23 and a seedable staging for the real-API browser cases → blocks all of those. If the repo has no API test runner / fixtures / seed path I report **ENV-DEFECT** with a setup proposal for you to approve; I do not build it.
🔑 One **known-ready proposal uuid on the deployed environment** (a dedicated test proposal, not real client data) → blocks B25. Without it B25 is UNVERIFIED.
👉 Run the pair command below against the deployed address after each CDN/distribution change (a one-off by me is a snapshot, not a guard). → covers B24–B27; reported UNVERIFIED until you or CI confirm the output.
👉 Whoever owns the CDN config confirms whether custom error responses are distribution-wide or per-behavior → informs B24/B26 (the fix for B24 can break B26, see below).
🔀 CDN (CloudFront-style distribution in front of the S3 SPA origin and the API origin) → chosen double: **none for the happy/pending flow** (browser cases B4–B6, B10–B11, B21 run against the real API and real Postgres on staging, no route mock; the clock is injected). **Playwright route interception (mock)** only for outcomes the real API cannot produce on demand: B12 (slow response), B17 (500), B18 (network abort), B19/B20 (200 with HTML / invalid JSON). This trades away: everything the CDN does to a response (error-page rewrites, caching, header changes). Staging also lacks the CDN, so no browser test in this plan can see it.
   ↳ pair (one command, deployed address): `for u in api/v1/proposal/00000000-0000-4000-8000-000000000000 proposal/00000000-0000-4000-8000-000000000000; do curl -s -D - -o /dev/null "https://app.example-client.com/$u" | grep -iE '^(HTTP|content-type|cache-control|x-cache|age)'; sleep 1; done`
   → expect for the API path: `404` + `content-type: application/json` (NOT `200 text/html`), and no `age` greater than 5 / no `x-cache: Hit` on a second call (Q5); for the SPA path: `200` + `content-type: text/html` (the deep link still works).
   ↳ trade: that command makes redundant, and **I will not write**, any route-mocked browser case that asserts "a `404` from the API reaches the browser as `404`" or checks the wire status/content-type of the pending response, and a mocked duplicate of B4 ("route.fulfill 404 → waiting screen") on top of the real-API B4. B19 stays: it asserts the *frontend's reaction* to the CDN-shaped answer, not what the CDN does.
   ↳ the other half of the real-contract rule: B25 (`200 application/json` for a known-ready uuid) once the 🔑 exists.

## Behaviors

> IDs are append-only. "pending Qn" = expectation shown is for the *recommended* option and freezes
> with it unless you choose otherwise. Level `browser(real)` = Playwright headless, real staging API +
> seeded Postgres, injected clock. `browser(mock)` = route interception, paired by the `🔀` above.

### Happy path

| ID | Trigger | Expected outcome | Level |
|---|---|---|---|
| B1 | `GET /api/v1/proposal/<uuid>` for a ready proposal | `200`, `Content-Type: application/json`, body equals the stored proposal (every field, schema-valid) | api |
| B2 | `GET` for an existing proposal still generating | `404`, `Content-Type: application/json`, body contains no proposal data | api |
| B3 | Same uuid called twice, generation completes in between | first `404`, second `200` with the proposal; no stale `404` after completion | api |
| B4 | Open `/proposal/<uuid>` of a pending proposal | the "being prepared" screen is visible; no proposal content; no error UI | browser(real) |
| B5 | Pending proposal becomes ready, clock advanced 5 s | proposal renders; waiting screen gone; no reload needed | browser(real) |
| B6 | Open `/proposal/<uuid>` of a ready proposal | proposal renders; the waiting screen never appears (first request sent immediately, pending Q4a) | browser(real) |

### Polling (state machine: Loading → Waiting ⇄ Waiting → Rendered; Loading → Rendered; → Error per Q1/Q2)

| ID | Trigger | Expected outcome | Level |
|---|---|---|---|
| B7 | First `404`, clock advanced to 4999 ms | still exactly 1 request sent (straddle: last value before the interval) | browser(real) |
| B8 | First `404`, clock advanced to 5000 ms | exactly 2 requests sent (straddle: first value at the interval) | browser(real) |
| B9 | Five consecutive `404`s (25 s) | still the waiting screen, no error, no timeout screen (pending Q3 — N unknown), one request per 5 s interval and no more, interval does not grow (pending Q4d) | browser(real) |
| B10 | `200` received and proposal rendered, clock advanced 30 s | zero further requests, proposal still shown | browser(real) |
| B11 | Leave the page (SPA navigation) while waiting; a response resolves after leaving | zero further requests; no state update on the unmounted view, no console error | browser(real) |
| B12 | Response held longer than 5 s | no second request while the first is in flight (pending Q4b) | browser(mock) |

### Edges and failures

| ID | Trigger | Expected outcome | Level |
|---|---|---|---|
| B13 | `GET` for a well-formed uuid that does not exist | `404`, `application/json`; identical status/shape to B2 unless Q3(c) says otherwise | api |
| B14 | `GET /api/v1/proposal/not-a-uuid` (malformed id) | 4xx JSON per Q1 (recommended `400`); never `500`, no DB error text in the body | api |
| B15 | `GET` with the uuid of a ready proposal in UPPERCASE | `200` with the same body as the lowercase form (valid partition: case) | api |
| B17 | API answers `500` | per Q1 (recommended: error screen, polling stops; never the waiting message presented as success) | browser(mock) |
| B18 | Request fails at network level (abort), then recovers on the next poll | per Q1 (recommended: waiting screen persists, polling continues, proposal renders when the call succeeds) | browser(mock) |
| B19 | API answers `200` with `Content-Type: text/html` (index.html — the shape of the CDN rewrite) | no proposal rendered; no blank page; no uncaught exception; error screen per Q2, not the "being prepared" message | browser(mock) 🔀 |
| B20 | API answers `200` JSON with a required field missing (and, separately, optional field absent) | missing required: error screen per Q2; absent optional: proposal renders without it | browser(mock) |
| B21 | Ready proposal whose text contains `<img src=x onerror="window.__xss=1">` and `<script>` | content shown as inert text; `window.__xss` stays undefined | browser(real) |
| B22 | Open `/proposal/not-a-uuid` | per Q1 (recommended: not-found/error screen, polling not started); no request to any API path other than `/api/v1/proposal/<encoded id>` | browser(real) |
| B23 | The real generation flow (not a DB seed) runs for a new proposal | afterwards the endpoint serves it with `200`; before completion `404` (proven writer, pending Q7) | api · writer |

### Deployed address (the pair; run against `https://app.example-client.com`, not staging, not localhost)

| ID | Trigger | Expected outcome | Level |
|---|---|---|---|
| B24 | `GET /api/v1/proposal/<unknown uuid>` through the CDN | `404` and `application/json` — NOT `200 text/html` | deployed probe |
| B25 | `GET /api/v1/proposal/<known-ready uuid>` through the CDN (🔑) | `200` and `application/json`, body parses as the proposal schema | deployed probe |
| B26 | `GET /proposal/<uuid>` (SPA deep link) through the CDN | `200 text/html` serving the SPA shell. Counter-probe: removing the CDN's error rewrite to fix B24 can break exactly this | deployed probe |
| B27 | Same unknown-uuid API call twice, 1 s apart | second answer not older than the poll interval (`age` absent or <= 5, no stale `x-cache: Hit` on a `404`); per Q5 | deployed probe |

---

## Detection proof (filled at step 5, after the suite exists)

> Planned mutation per ID is dictated by this list, not chosen later. Results are blank until run.

| ID | Mutation applied (planned) | Test went red | Reverted, suite green | Verdict |
|---|---|---|---|---|
| B1 | handler drops one body field / returns `text/plain` | — | — | — |
| B2 | pending proposal returns `200` with partial body | — | — | — |
| B3 | handler caches the first answer per uuid | — | — | — |
| B4 | waiting screen never rendered on `404` | — | — | — |
| B5 | polling loop does not update state on `200` | — | — | — |
| B6 | first request delayed 5 s | — | — | — |
| B7 | interval changed 5000 → 4000 (widened) | — | — | — |
| B8 | interval changed 5000 → 6000 (narrowed) | — | — | — |
| B9 | interval grows after each `404` / loop stops after N polls | — | — | — |
| B10 | polling not cleared after render | — | — | — |
| B11 | cleanup removed from unmount | — | — | — |
| B12 | interval scheduled from request start, not response end | — | — | — |
| B13 | unknown uuid returns `500` or `200` with empty body | — | — | — |
| B14 | uuid validation removed (DB cast error propagates) | — | — | — |
| B15 | uuid lookup made case-sensitive | — | — | — |
| B17/B18 | status branches swapped / `catch` swallowed | — | — | — |
| B19 | skip content-type/JSON check, treat any `200` as proposal | — | — | — |
| B20 | schema validation removed | — | — | — |
| B21 | render via `dangerouslySetInnerHTML` | — | — | — |
| B22 | route param interpolated unencoded / unvalidated | — | — | — |
| B23 | generation job stops setting the ready state | — | — | — |
| B24–B27 | not mutation-testable; evidence is the command output on the deployed host | n/a | n/a | UNVERIFIED until run |

> Tier B proof is a proxy, not mutation testing. If Q6 raises the tier to A, this table is replaced by
> Stryker output on the API handler (or `SKIP stryker (not installed)` + UNVERIFIED), reported as a delta.
>
> Not done in this run: the `.claude/status/tester-<n>.md` claim file (no harness-assigned id / worktree was provided; no tests were written, only this plan).

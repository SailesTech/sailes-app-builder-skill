# Hard harness checklist — what every durable async backend needs before it's trustworthy

Each item is **what** + **why**. These are 🔒 hard rules, not decisions — a missing one loses data, double-charges, or hides a failure. Distilled from the SRF orchestrator's webhook/security/testing checklists + the business-flow audit.

## Intake boundary (fast, dumb, safe)

1. **Verify signature/HMAC BEFORE anything else.** SHA-256 over the *raw* body (exact bytes, captured before JSON.parse), timing-safe compare (`crypto.timingSafeEqual`) with a length pre-check and a missing-signature guard; failure → 401, nothing downstream runs. *Why:* reject forgeries before spending any work; a naive `===` leaks timing.
   - ⚠️ **HMAC ≠ replay defense.** A re-sent valid signature is still valid — replay protection comes from the idempotency key (item 4), not the signature. And: **HMAC only works if the real caller can sign.** If the production form/source cannot produce a signature, pick an auth mode it *can* satisfy (shared-secret token, constant-time compared, + optional IP allowlist) *before* cutover. Never ship an unauthenticated intake on a PII-handling, record-creating endpoint.
2. **Validate the payload at the boundary** (Zod/schema, no `any`); reject on failure (400). *Why:* the durable pipeline must never see malformed data.
3. **Persist the raw event append-only** (`webhook_events` with `raw_payload jsonb`, `signature_valid`, `status`). *Why:* replay/debug/audit needs the exact bytes received, forever.
4. **Claim an idempotency key derived from a stable business id**, unique-constrained; catch the unique violation (PG `23505`) → return "duplicate" **before** emitting. *Why:* a replayed webhook must not create a second record.
5. **Emit an event with a deterministic id (= business id) carrying IDs only, then 202.** No downstream waiting, no business logic in the HTTP layer. *Why:* the deterministic id makes the engine de-dupe too, closing the "key committed but emit failed" gap; keeps intake sub-millisecond; re-resolving IDs against the source of record beats shipping a stale snapshot.

## Durable pipeline (the orchestrator)

6. **Business logic in independently-retryable steps; size retry granularity deliberately.** Prefer *per-phase* over *per-I/O* — fine-grained steps cost ~250–600ms engine round-trip *each* (24 steps ≈ 7–9s of pure overhead that blows a ≤5s budget). *Why:* retry granularity is a **latency trade**, not free.
7. **Every externally-effecting step must be idempotent.** Read-before-create via a `businessId → externalId` **link table** (unique on `(businessId, system, type)`, `onConflictDoNothing` + re-select to survive concurrent duplicate deliveries); search-before-create where the vendor has a natural key; updates as PUTs; local rows via `onConflictDoUpdate`. *Why:* whole-phase retry (item 6) **or** event replay must not double-write to the external source of truth.
8. **Fan out independent work, join before dependents** (a dataflow DAG). *Why:* land the user-visible result fast; run slow work concurrently — but see item 9, the engine barrier.
9. **Split lanes by latency SLO** — fast path and slow path as **separate durable functions** coordinated by events + a DB-link fallback. *Why:* the executor batches a step-layer, so a slow step in the fast lane's layer stalls the whole next layer even with no data dependency; separate runs have independent timelines.
10. **Error-class-aware retry, not count-based.** Three paths: *business no-result* (e.g. 404 "no price") → a **typed terminal result, do NOT throw** (no retry, no alert); *technical failure* (5xx/timeout) → **throw** → engine retries → alert on exhaustion; *deterministic-invalid* input → terminal. *Why:* conflating "no result" with "system down" retries a permanent outcome forever, or alerts on a normal one.

## Observability / safety net

11. **Audit every step: input/output/status, append-only, no PII/secrets**, indexed by business id + time, with an `actor_type` distinguishing pipeline steps from integration calls. Write it automatically inside the step harness (one row per phase). *Why:* a durable, queryable record independent of the alert channel.
12. **Alert on failure to a human channel, and never let alerting throw.** A Slack webhook carrying the **exact failed stage name** + a link back to the run; swallow + log on the alerter's own failure. *Why:* failures must be loud, but the alerter must not corrupt error handling.
13. **Boot-time config guard for the alert channel** — loudly error at startup if the alert webhook is unset/malformed, and **test-fire it** before deploy. *Why:* a misconfigured webhook silently defeats "alert on every failure" — the harness's own P0.
14. **On terminal (retries-exhausted) failure: land in a retriable/dead-letter state, alert once, never silent.** *Why:* bounded auto-retry then human escalation.
15. **Structured logger; secrets in env only, never logged; read/status endpoints behind auth** (timing-safe), returning only entitled fields from a read model — not the raw payload. *Why:* debuggable without leaking PII/tokens; the internal read path must not become a leak.

## How each item is tested

Each hard rule above is architecture; this is its executable proof. `sailes-test` turns these into
assertions — the techniques and the full async case set live in
[`sailes-test/references/techniques.md`](../sailes-test/references/techniques.md). One row per item;
a rule with no test is a rule you are trusting on faith.

| # | Rule | How it is tested |
|---|---|---|
| 1 | Verify signature first | POST with an absent, malformed, and wrong-key signature → each rejected 401 with nothing downstream run; verification reads the **raw** body (mutate a byte after signing → rejected). |
| 2 | Validate at the boundary | malformed / extra-field / wrong-type payload → 400, and the durable pipeline is never entered (assert no `webhook_events` row past `signature_valid`). |
| 3 | Persist raw event append-only | after intake, the exact received bytes are readable from `webhook_events`; a second delivery does not overwrite the first row. |
| 4 | Claim idempotency key | **duplicate delivery** — same payload twice → exactly one record, second returns "duplicate" before emit (the `23505` path is exercised, not just asserted in prose). |
| 5 | Deterministic emit id then 202 | two deliveries of the same business id emit an event the engine de-dupes; intake returns 202 without awaiting downstream. |
| 6 | Independently-retryable steps | force a throw at a step boundary → the engine retries **that step**, not from the top; prior steps are not re-run (assert via a side-effect counter). |
| 7 | Every effecting step idempotent | **retry after partial failure** — fail after the DB write, before the outbound call, re-deliver → no duplicate row, exactly one outbound call (link table `onConflictDoNothing` proven under concurrent duplicate). |
| 8 | Fan out, join before dependents | dependents observe all fan-out results; a slow branch delays the join but does not drop a result. |
| 9 | Split lanes by latency SLO | a deliberately slow slow-lane step does not delay the fast lane's user-visible result (assert fast-lane completion time is independent). |
| 10 | Error-class-aware retry | business no-result → typed terminal, **no** retry and **no** alert; 5xx/timeout → retried then alerts on exhaustion; invalid input → terminal. Three distinct assertions, one per class. |
| 11 | Audit every step | after a run, one audit row per phase exists with input/output/status and `actor_type`, and it contains **no** PII/secret (assert the sensitive field is absent). |
| 12 | Alert on failure, never let alerting throw | a forced step failure produces a Slack call carrying the exact failed stage name; a **failing alerter** is swallowed and logged, and does not corrupt the original error path. |
| 13 | Boot-time alert-config guard | boot with the alert webhook unset/malformed → the process errors loudly at startup (assert it refuses to start, not that it warns). |
| 14 | Terminal failure → dead-letter, alert once | exhaust retries → lands in a retriable/dead-letter state, alerts exactly once, never silent. |
| 15 | Structured logger; secrets in env; read behind auth | secrets never appear in logs (assert on a captured log stream); the read/status endpoint rejects unauthenticated access and returns only entitled fields, never the raw payload. |

## Schema hard rules (the always-list)

- `timestamptz` for every moment in time (never `timestamp`).
- `text` (+ `CHECK` only if genuinely needed), `numeric(12,2)` for money (never the `money` type).
- **Every lookup / link / FK-like column indexed**; **unique indexes on all idempotency & link keys.**
- **PK type by exposure, not by default:** `bigint GENERATED ALWAYS AS IDENTITY` when ids stay internal (public lookups key on the business id, e.g. a submission UUID); reach for UUIDv7 only if ids are externally exposed or generation is distributed.
- **Orthogonal status enums per independent lifecycle** (e.g. `price_status` and `qualification_status` separate), each indexed — so the two async lanes advance independently. New enum values via `ALTER TYPE … ADD VALUE` (mind its transaction-boundary quirk on migrate).
- **Append-only history + an `active` flag on config tables** instead of `deleted_at` everywhere.
- **Keep the orchestrator's run-state in the orchestrator, business-idempotency in the DB.** Don't duplicate the engine's durable run state in your own tables. `sync_runs`/`integration_accounts` are *conditional* — needed only if your engine doesn't already persist run state.

## The four P0s (if you implement nothing else, implement these)

From the SRF owner's #1 priority list — the minimum that makes async trustworthy:
1. **Retry from the exact failed step** (not from the top).
2. **Alert on every failure** (a Slack webhook is enough).
3. **Durable audit log** of every action (input/output/status).
4. **Idempotency** — a replayed webhook never duplicates a record.

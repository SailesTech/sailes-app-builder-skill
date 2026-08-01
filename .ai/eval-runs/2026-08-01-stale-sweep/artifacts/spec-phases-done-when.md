## Phasing & Steps

Seven phases. Each one ships behind the previous one's green gate, and each leaves the app running
and deployable — the "app state after" line on every phase says what an admin can and cannot do the
moment that phase merges. Estimates are internal (hours), closed out against actuals at completion,
never client-visible.

**Migration numbers, handed out here so two workers cannot pick the same next number at merge:**

| Number | Phase | Contents |
|---|---|---|
| `0042_export_jobs` | 1 | `export_jobs` table + indexes |
| `0043_export_job_attempts` | 5 | `export_job_attempts` table + `export_jobs.failure_reason`, `failure_detail`, `attempt_count` |
| `0044_export_jobs_expiry` | 7 | `export_jobs.expires_at`, `object_deleted_at` + partial index for the sweeper |

No other migration belongs to this spec. **A phase that discovers it needs one takes the next free
number from the reserved block `0042`–`0046` and records it in this table in the same commit** —
the reason for the reservation is collision-at-merge, not tidiness, so an unrecorded number
reintroduces exactly the failure the block exists to prevent.

**Decisions this phasing rests on** (from the answered Open Questions / Decisions Ledger — if any of
these is still open, the phase that names it is *not* ready to start):
Q1 storage backend & bucket privacy · Q2 signed-URL TTL · Q3 who may download a colleague's export
· Q4 CSV encoding + column set · Q5 retry budget and what counts as retryable.

---

### Phase 1 — Data model, contract artifact, no behavior (est. 4h)

The job row and the shared types both slices import. Nothing user-visible; this phase exists so
Phases 2 and 3 can be built against a frozen shape instead of against each other.

**Steps**
1. `0042_export_jobs` — `id uuid pk`, `requested_by uuid fk users`, `filters jsonb`, `status text`
   (`queued|running|completed|failed`), `rows_total int null`, `rows_written int not null default 0`,
   `object_key text null`, `byte_size bigint null`, `filter_fingerprint text`, `created_at`,
   `started_at`, `finished_at`, `updated_at`. Indexes: `(requested_by, created_at desc)`,
   partial unique on `(filter_fingerprint)` where `status in ('queued','running')`.
2. Drizzle schema + `status` union type derived from the Zod enum, not re-declared.
3. Contract artifact `packages/contracts/src/exports.ts`: `CreateExportRequest`,
   `ExportJobDto`, `ExportJobStatus`, `ExportFilters` — the single source both API and admin import.
4. Down migration, so the phase is reversible on a bad deploy.

**Done-when**

```bash
pnpm --filter @app/db migrate:up && pnpm --filter @app/db migrate:status
# → exit 0; "0042_export_jobs" listed as applied

pnpm --filter @app/db migrate:down && pnpm --filter @app/db migrate:up
# → exit 0 both ways (round-trip proves the down migration exists and works)

psql "$DATABASE_URL" -c '\d export_jobs'
# → all 14 columns above present; both indexes listed, the partial unique among them

psql "$DATABASE_URL" -c "insert into export_jobs (requested_by, filters, status, filter_fingerprint)
  select id, '{}'::jsonb, 'queued', 'fp-dup' from users limit 1;" \
&& psql "$DATABASE_URL" -c "insert into export_jobs (requested_by, filters, status, filter_fingerprint)
  select id, '{}'::jsonb, 'queued', 'fp-dup' from users limit 1;"
# → second statement fails with 23505 unique_violation (the dedupe guard is in the DB, not only in code)

pnpm --filter @app/contracts test src/exports.test.ts
# → 0 failures; asserts CreateExportRequest rejects from > to, rejects a range > 366 days,
#   and that ExportJobStatus has exactly the four members

pnpm typecheck
# → 0 errors
```

**Allowed files** — every path is required by a clause above; a path with no clause is surplus.

| Path | Forced by |
|---|---|
| `packages/db/migrations/0042_export_jobs.{up,down}.sql` | migrate:up / migrate:down round-trip, `\d export_jobs`, unique_violation |
| `packages/db/src/schema/export-jobs.ts` | `pnpm typecheck`, and Phase 2 cannot query without it |
| `packages/contracts/src/exports.ts` | `@app/contracts test` |
| `packages/contracts/src/exports.test.ts` | same |
| `packages/contracts/src/index.ts` | `pnpm typecheck` (export barrel — unexported, the admin cannot import it) |

**App state after:** unchanged for users. A new empty table exists.

---

### Phase 2 — API intake: request, list, status (est. 6h)

The admin can create a job and read its status. The worker does not exist yet, so a job stays
`queued` — this is deliberate and it is what keeps the phase deployable: nothing in the UI yet
promises a file.

**Steps**
1. `POST /api/exports` — Zod-validate against `CreateExportRequest`, compute `filter_fingerprint`
   (sha256 of the normalized filter object + `requested_by`), insert `queued`, enqueue on the
   worker queue, return **202** with `ExportJobDto`.
2. Dedupe: if the partial unique index rejects the insert, return **200** with the existing job.
   *Reason:* an impatient double-click otherwise spawns a second full-range scan of `deals`, and the
   two jobs then compete for the same worker slot.
3. `GET /api/exports` (own jobs, paginated) and `GET /api/exports/:id`.
4. Authz per the permission matrix in Security: `deals:export` required; a non-owner admin without
   `deals:export:any` gets 404 on someone else's job (404, not 403 — a 403 confirms the row exists).

**Done-when**

```bash
pnpm --filter @app/api print-routes --json | node scripts/diff-routes.mjs .ai/specs/<this-spec>.md --through-phase 2
# → empty diff: the set of served method+path pairs equals the spec's yaml block for phases ≤2,
#   with the out-of-scope list honored. Not "every route file is imported" — that check passes
#   while a handler is missing from a file that exists.

curl -s -o /tmp/r.json -w '%{http_code}' -X POST "$API/api/exports" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'content-type: application/json' \
  -d '{"from":"2026-01-01","to":"2026-03-31"}'
# → 202; jq -e '.id and .status=="queued"' /tmp/r.json exits 0

# same body again, immediately:
# → 200, and jq '.id' equals the first id (dedupe, not a second row)

curl -s -o /dev/null -w '%{http_code}' -X POST "$API/api/exports" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'content-type: application/json' -d '{"from":"2026-03-31","to":"2026-01-01"}'
# → 400

curl -s -o /dev/null -w '%{http_code}' "$API/api/exports/$OTHER_ADMINS_JOB_ID" -H "Authorization: Bearer $ADMIN_TOKEN"
# → 404

pnpm --filter @app/api test src/modules/exports
# → 0 failures, including the generated authz matrix (every action × every role + the anonymous row → 401)

psql "$DATABASE_URL" -c "select count(*) from export_jobs where status='queued';"
# → ≥ 1, and the queue reports one pending message for it
```

**Allowed files**

| Path | Forced by |
|---|---|
| `apps/api/src/modules/exports/routes.ts` | route-set diff, all curl clauses |
| `apps/api/src/modules/exports/service.ts` | dedupe 200 clause, fingerprint |
| `apps/api/src/modules/exports/queue.ts` | pending-message clause |
| `apps/api/src/modules/exports/routes.test.ts` | `@app/api test` |
| `apps/api/src/modules/exports/authz.matrix.test.ts` | authz matrix clause |
| `apps/api/src/app.ts` | route-set diff (registration) |
| `scripts/diff-routes.mjs` | route-set diff |

**App state after:** an admin with `deals:export` can request an export and see it sitting at
`queued`. No file is produced and the UI does not yet offer the action.

---

### Phase 3 — Worker produces the file (est. 10h)

**Steps**
1. `apps/worker/src/jobs/export-deals.ts` — claim the job (`queued → running` with
   `update … where status='queued' returning *`, so two workers cannot both claim it), count matching
   rows into `rows_total`, then stream.
2. Stream end to end: keyset-paginated cursor over `deals` (batch 1000) → CSV transform → upload
   stream to the private bucket at `exports/{job_id}/deals-{from}-{to}.csv`. **No array of all rows
   and no temp file on the worker's disk** — *reason:* the worker's filesystem is ephemeral on the
   target platform and a 500k-row export at ~1.2 KB/row does not fit the container's memory budget.
3. Progress: `rows_written` updated every batch; `updated_at` bumped so a stalled job is detectable.
4. Completion: `status='completed'`, `object_key`, `byte_size`, `finished_at`.

**Done-when**

```bash
pnpm --filter @app/worker test:integration src/jobs/export-deals.int.test.ts
# → 0 failures. The suite (Testcontainers Postgres + MinIO) asserts, on a 250k-deal seed:
#   · terminal status = 'completed' and object_key non-null
#   · downloaded object has 250_001 lines (header + rows) and rows_total = rows_written = 250000
#   · a row whose title is `Acme, "Big" deal\nQ2` round-trips byte-identical through csv-parse
#   · at least 3 distinct rows_written values were observed while running (progress is incremental,
#     not written once at the end)
#   · a second worker claiming concurrently gets 0 rows and does not double-write

node --max-old-space-size=256 node_modules/.bin/vitest run src/jobs/export-deals.int.test.ts --filter "250k"
# → exit 0. A buffering implementation OOMs here; this clause is the streaming requirement's only
#   real check, since a buffered version passes every functional assertion above.

curl -s "$API/api/exports/$JOB_ID" -H "Authorization: Bearer $ADMIN_TOKEN" | jq -e '.status=="completed" and .rowsTotal>0'
# → exit 0 (the Phase 2 read path reflects worker state with no API change)
```

**Allowed files**

| Path | Forced by |
|---|---|
| `apps/worker/src/jobs/export-deals.ts` | every clause |
| `apps/worker/src/jobs/deals-cursor.ts` | 250k row-count + `--max-old-space-size=256` |
| `apps/worker/src/lib/csv-stream.ts` | the `Acme, "Big" deal\nQ2` escaping clause |
| `apps/worker/src/lib/object-store.ts` | object_key / byte_size clauses |
| `apps/worker/src/jobs/export-deals.int.test.ts` | `test:integration` |
| `apps/worker/src/index.ts` | job registration — without it the suite's job never runs |

**App state after:** requested exports complete and a file lands in the bucket. Nobody can download
it yet; that is Phase 4.

---

### Phase 4 — Private download with an expiring URL (est. 5h)

**Steps**
1. `GET /api/exports/:id/download` — authorize (owner, or `deals:export:any`), mint a signed URL with
   TTL from `EXPORT_URL_TTL_SECONDS` (Q2 answer), return **302** to it.
2. Object stays private: no public-read ACL anywhere, bucket policy asserted in the test.
3. Audit: one `file_access_log` row per mint — job id, actor, ip, ts.
4. `409` if the job is not `completed`.

**Done-when**

```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "$API/api/exports/$JOB_ID/download" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# → 302 and a redirect_url containing an expiry parameter

curl -s -o /tmp/out.csv -w '%{http_code}' "$SIGNED_URL"        # → 200, /tmp/out.csv non-empty
curl -s -o /dev/null -w '%{http_code}' "$UNSIGNED_OBJECT_URL"  # → 403 (object is not public)
curl -s -o /dev/null -w '%{http_code}' "$SIGNED_URL_TTL_1S"    # after 2s → 403

curl -s -o /dev/null -w '%{http_code}' "$API/api/exports/$OTHER_ADMINS_JOB_ID/download" -H "Authorization: Bearer $ADMIN_TOKEN"
# → 404
curl -s -o /dev/null -w '%{http_code}' "$API/api/exports/$QUEUED_JOB_ID/download" -H "Authorization: Bearer $ADMIN_TOKEN"
# → 409

psql "$DATABASE_URL" -c "select count(*) from file_access_log where resource_id='$JOB_ID';"
# → equals the number of successful mints above (3), not 0 and not 1-per-download

pnpm --filter @app/api test src/modules/exports
# → 0 failures (authz matrix extended with the download action)
```

**Allowed files**

| Path | Forced by |
|---|---|
| `apps/api/src/modules/exports/download.route.ts` | 302 / 404 / 409 clauses |
| `apps/api/src/modules/exports/signed-url.ts` | expiry-parameter + TTL-expiry clauses |
| `apps/api/src/modules/exports/download.test.ts` | `@app/api test` |
| `apps/api/src/modules/exports/authz.matrix.test.ts` | authz matrix clause (extended, not new) |
| `packages/contracts/src/exports.ts` | download response type (extended) |

**App state after:** end-to-end works over the API for the happy path. Failures are still silent.

---

### Phase 5 — Retries and a reason the admin can read (est. 6h)

**Steps**
1. `0043_export_job_attempts` — one row per attempt (`job_id`, `attempt_no`, `started_at`,
   `failed_at`, `error_class`, `error_detail`) plus `export_jobs.attempt_count`, `failure_reason`
   (admin-safe sentence), `failure_detail` (internal, never serialized to the DTO).
2. Classify: transient (db timeout, storage 5xx, network) → retry with backoff 30s/2m/10m up to the
   Q5 budget; permanent (invalid filter, deleted user, quota) → fail immediately. *Reason for not
   retrying permanent errors:* three retries of a filter that can never parse delays the admin's
   error message by twelve minutes and produces nothing.
3. Partial output from a failed attempt is discarded before the retry, so a retry cannot append to a
   half-written object.
4. Terminal failure → `status='failed'`, `failure_reason` mapped from `error_class` through a table
   with no interpolated internals.

**Done-when**

```bash
pnpm --filter @app/worker test:integration src/jobs/export-deals.retry.int.test.ts
# → 0 failures. Faults are injected through the store/db test doubles, and the suite asserts:
#   · storage 503 on attempts 1-2, success on 3 → status 'completed', attempt_count=3,
#     3 rows in export_job_attempts, and exactly one object in the bucket for that job
#   · storage 503 on every attempt → status 'failed', attempt_count = <Q5 budget>,
#     failure_reason = "Storage was unavailable. The export was retried 3 times."
#   · a permanent error → status 'failed' after exactly 1 attempt (no backoff burned)
#   · after any failure, no object with that job's prefix remains in the bucket

curl -s "$API/api/exports/$FAILED_JOB_ID" -H "Authorization: Bearer $ADMIN_TOKEN" | jq -e '
  .status=="failed" and (.failureReason|length>0) and (has("failureDetail")|not)'
# → exit 0: the reason reaches the admin, the internals do not

pnpm --filter @app/contracts test && pnpm --filter @app/api test src/modules/exports
# → 0 failures
```

**Allowed files**

| Path | Forced by |
|---|---|
| `packages/db/migrations/0043_export_job_attempts.{up,down}.sql` | attempt_count / export_job_attempts assertions |
| `packages/db/src/schema/export-job-attempts.ts` | same |
| `apps/worker/src/jobs/export-deals.ts` | retry, discard-partial, terminal-status clauses |
| `apps/worker/src/lib/error-classify.ts` | permanent-error single-attempt clause |
| `apps/worker/src/lib/failure-reason.ts` | the exact `failure_reason` string clause |
| `apps/worker/src/jobs/export-deals.retry.int.test.ts` | `test:integration` |
| `packages/contracts/src/exports.ts` | the `has("failureDetail")|not` clause (DTO omits it) |
| `apps/api/src/modules/exports/service.ts` | same (serializer) |

**App state after:** the API tells the truth about failures. The admin still has no screen.

---

### Phase 6 — React admin screen (est. 10h)

**Steps**
1. Deals list → date-range filter → **Export CSV** button (hidden without `deals:export`).
2. Exports panel: list of the admin's jobs, live progress (poll `GET /api/exports/:id` at 2s while
   `queued|running`, stop on terminal), download button on `completed`, `failure_reason` in an error
   state on `failed`, with a **Retry** that POSTs the same filters.
3. States per the design artifact: empty, queued, running-with-percent, completed, failed.

**Done-when**

```bash
pnpm --filter @app/admin test
# → 0 failures (component tests: percent = rowsWritten/rowsTotal rendering, polling stops on
#   terminal status, button hidden without the permission)

pnpm --filter @app/admin e2e tests/exports.spec.ts
# → 0 failures. Playwright against the full stack (api + worker + Postgres + MinIO):
#   · filter 2026-01-01..2026-03-31 → click Export → row appears with status "In queue"
#   · progress text changes at least once before "Ready"
#   · click Download → a file is received, first line equals the expected CSV header
#   · a seeded failed job renders its failure_reason text verbatim; Retry creates a new job row
#   · screenshots exports-queued/running/completed/failed.png match tests/__screenshots__ baselines
#     (Playwright toHaveScreenshot, default threshold)

pnpm --filter @app/admin lint && pnpm typecheck
# → 0 errors
```

**Allowed files**

| Path | Forced by |
|---|---|
| `apps/admin/src/features/exports/ExportButton.tsx` | permission-hidden clause, e2e click |
| `apps/admin/src/features/exports/ExportsPanel.tsx` | list + four state screenshots |
| `apps/admin/src/features/exports/ExportJobRow.tsx` | percent rendering, failure_reason verbatim, Retry |
| `apps/admin/src/features/exports/useExportJob.ts` | polling-stops-on-terminal clause |
| `apps/admin/src/features/exports/*.test.tsx` | `@app/admin test` |
| `apps/admin/tests/exports.spec.ts` + `tests/__screenshots__/exports-*.png` | e2e clause |
| `apps/admin/src/features/deals/DealsListToolbar.tsx` | e2e enters through the deals filter |

**App state after:** the feature is complete for the admin. Files accumulate in the bucket forever —
Phase 7.

---

### Phase 7 — Expiry sweep (est. 4h)

The private URL expires in minutes; the *object* must expire too, or a deleted deal's data lives on
in a bucket indefinitely. Separated from Phase 4 because a sweeper that deletes objects is the one
piece of this feature that can destroy data, and it deserves its own gate.

**Steps**
1. `0044_export_jobs_expiry` — `expires_at` (set at completion: `finished_at + RETENTION_DAYS`),
   `object_deleted_at`, partial index `where object_deleted_at is null and expires_at < now()`.
2. Cron in `apps/worker` (hourly): delete objects past `expires_at`, stamp `object_deleted_at`.
   Never deletes the `export_jobs` row — the audit trail outlives the file.
3. Download of a swept job → **410 Gone** with a "this export has expired, request a new one"
   payload, distinct from 404.

**Done-when**

```bash
pnpm --filter @app/worker test:integration src/jobs/sweep-expired-exports.int.test.ts
# → 0 failures:
#   · a job with expires_at in the past → object gone from the bucket, object_deleted_at set,
#     export_jobs row still present
#   · a job with expires_at in the future → object untouched, object_deleted_at null
#   · sweeper runs twice → second run deletes nothing and logs 0 (idempotent)

curl -s -o /tmp/g.json -w '%{http_code}' "$API/api/exports/$SWEPT_JOB_ID/download" -H "Authorization: Bearer $ADMIN_TOKEN"
# → 410, and jq -e '.code=="EXPORT_EXPIRED"' /tmp/g.json exits 0

psql "$DATABASE_URL" -c "explain select id from export_jobs where object_deleted_at is null and expires_at < now();"
# → plan uses export_jobs_sweep_idx (no seq scan; the sweeper runs hourly against a growing table)

pnpm --filter @app/admin e2e tests/exports.spec.ts
# → 0 failures (expired row renders the expired state, not a dead download button)
```

**Allowed files**

| Path | Forced by |
|---|---|
| `packages/db/migrations/0044_export_jobs_expiry.{up,down}.sql` | sweeper assertions + the `explain` clause |
| `packages/db/src/schema/export-jobs.ts` | same (extended) |
| `apps/worker/src/jobs/sweep-expired-exports.ts` | `test:integration` clauses |
| `apps/worker/src/jobs/sweep-expired-exports.int.test.ts` | same |
| `apps/worker/src/index.ts` | cron registration (extended) |
| `apps/api/src/modules/exports/download.route.ts` | 410 / `EXPORT_EXPIRED` clause |
| `apps/admin/src/features/exports/ExportJobRow.tsx` | expired-state e2e clause |

**App state after:** feature complete, with a bounded retention window and an audit trail that
survives the file.

---

### Release gate (all phases)

```bash
pnpm test && pnpm typecheck && pnpm lint     # → 0 failures / 0 errors
pnpm --filter @app/worker test:integration   # → 0 failures
pnpm --filter @app/admin e2e                 # → 0 failures
pnpm --filter @app/api print-routes --json | node scripts/diff-routes.mjs .ai/specs/<this-spec>.md
# → empty diff against the full API yaml block
```

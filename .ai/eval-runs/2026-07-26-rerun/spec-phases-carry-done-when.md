# Deals CSV Export (async job) — §7 Phasing & Steps

> Section 7 of `.ai/specs/2026-07-26-deals-csv-export.md`. §§1–6 (TLDR & Context, Problem,
> Proposed Solution, Data Model, API & UI Surface, Security) are written and approved; this
> section assumes their names verbatim and does not restate them. Baseline stack: Next.js app +
> `apps/worker`, Drizzle + Postgres, Better Auth, Zod at boundaries, Vitest + MSW +
> Testcontainers + Playwright, private files + signed URLs.
>
> Contract artifact both slices import: `packages/contracts/src/export-job.ts`
> (`createExportJobInput`, `exportJobStatus`, `exportJobResponse`) — frozen in Phase 1, extended
> once in Phase 2 (`downloadUrl`), never re-shaped after.

**Three phases.** The async spine (request → job → status) is independently shippable and is the
part that carries all the concurrency risk, so it ships and is verified before a single CSV byte
is written. Generation + delivery is phase 2. The UI and the failure/retention edges are phase 3
— they are real work with real tests, not polish, and folding them into phase 2 would have made
its Done-when a list of six unrelated checks. Every step below leaves the app working: nothing is
user-reachable until the phase that makes it reachable, and no phase leaves a half-migrated DB.

Estimates are **internal only** (hours, closed out against actuals at completion) — never
client-visible.

---

## Phase 1 — The async spine: request → job → terminal status (no CSV yet)

**Story.** A user with `deals:export` can POST an export request, gets `202 + { id }` back
immediately, and can poll that job to a terminal status. The worker claims and completes the job
against a stub producer that writes no file. Nothing in the UI links here yet, so shipping this
alone changes no user-visible behavior.

*Est. 10h.*

- **1.1 — Contract artifact.** Write `packages/contracts/src/export-job.ts`: `createExportJobInput`
  (reuses the existing `dealListFilters` schema from `packages/contracts/src/deal.ts` — the export
  filter set is the list filter set, not a parallel one), `exportJobStatus` =
  `queued|running|succeeded|failed|expired`, `exportJobResponse`. Types via `z.infer`, no `any`.
  **Done-when:** `pnpm --filter @app/contracts test` → 0 failures, and
  `pnpm -w typecheck` → exit 0, and `grep -c 'any' packages/contracts/src/export-job.ts` → 0.

- **1.2 — Schema + migration.** Drizzle table `export_job` (UUID PK, `user_id` FK, `status`,
  `filters` jsonb, `row_count`, `file_id` nullable FK, `error_code` nullable, `attempts`,
  `created_at`/`updated_at`) + generated migration committed.
  **Done-when:** `pnpm db:migrate` against a clean Testcontainers Postgres → exit 0, then
  `pnpm db:generate` → prints `No schema changes` and `git status --porcelain drizzle/` → empty
  (proves the committed migration matches the schema; a drifted migration fails this).

- **1.3 — `POST /api/exports`.** Better Auth session required, `deals:export` permission checked,
  body parsed with `createExportJobInput`, row inserted `queued`, job enqueued to `apps/worker`,
  responds `202 { id }`. Intake only — zero export work in the request path.
  **Done-when:** `pnpm test apps/web/src/app/api/exports` → 0 failures, with the suite asserting
  all four rows of the §6 permission matrix (anonymous → 401, authenticated-without-permission →
  403, malformed filter → 422, permitted → 202) **and**
  `curl -s -o /dev/null -w '%{http_code}' -X POST localhost:3000/api/exports -H 'content-type: application/json' -H "cookie: $SESSION" -d '{"filters":{}}'`
  → `202`.

- **1.4 — `GET /api/exports/:id`.** Owner-scoped read returning `exportJobResponse`. Another
  user's job id is `404`, not `403` (no existence leak).
  **Done-when:** `pnpm test apps/web/src/app/api/exports/[id]` → 0 failures, including the
  cross-user `404` case and a response validated against `exportJobResponse.parse()`.

- **1.5 — Worker consumer, stub producer.** `apps/worker/src/jobs/deal-export.ts` claims the job
  (`SELECT … FOR UPDATE SKIP LOCKED`), transitions `queued → running → succeeded`, and calls a
  `produceExport()` stub that returns `{ rowCount: 0, fileId: null }`. Redelivery of the same job
  id must be a no-op.
  **Done-when:** `pnpm test apps/worker/src/jobs/deal-export.spec.ts` → 0 failures, including
  (a) a redelivery test that dispatches the same job id twice and asserts `produceExport` was
  called once and exactly one `succeeded` transition was written, and (b) a two-worker concurrency
  test asserting no job is claimed twice.

**Phase 1 Done-when (binary, whole phase):**
```bash
pnpm test apps/web/src/app/api/exports apps/worker/src/jobs packages/contracts   # → 0 failures
pnpm -w typecheck                                                                # → exit 0
bash scripts/smoke/export-spine.sh                                               # → exit 0
```
`scripts/smoke/export-spine.sh` (written in this phase, committed) POSTs an export against a
seeded dev DB, polls `GET /api/exports/:id` every 1s, and exits `0` only if `status == "succeeded"`
within 30s — otherwise exits `1` and prints the last body.

---

## Phase 2 — Real CSV: generation, private storage, signed download

**Story.** The job now streams the matching deals, writes a real CSV, stores it privately, and the
owner can download it through a signed URL. Still no UI entry point — verified by script and tests.

*Est. 14h.*

- **2.1 — Row source.** `listDealsForExport(filters)` in the deals module: keyset-paginated cursor
  over the same query builder the deals list uses (one filter implementation, not two), yielding
  batches, never loading the full set into memory.
  **Done-when:** `pnpm test apps/worker/src/jobs/deal-export.rows.spec.ts` → 0 failures, where the
  test seeds 50,000 deals, asserts the yielded row count equals
  `SELECT count(*) FROM deal WHERE …` for the same filters, and asserts heap growth
  (`process.memoryUsage().heapUsed` delta across the run) `< 128 MB`.

- **2.2 — CSV writer.** `packages/csv/src/write-csv.ts`: RFC 4180 quoting, UTF-8 BOM, the §5 column
  list in the §5 order, and formula-injection defence (a value starting with `= + - @ TAB CR` is
  prefixed with `'`).
  **Done-when:** `pnpm test packages/csv` → 0 failures, including a golden-file test whose fixture
  `packages/csv/__fixtures__/deals-golden.csv` is byte-compared (`expect(out).toEqual(golden)`) and
  an injection test asserting `=cmd|' /c calc'!A1` is emitted as `"'=cmd|' /c calc'!A1"`.

- **2.3 — Private storage + file metadata.** Worker uploads the CSV to the private bucket, inserts
  the `file` metadata row (size, mime `text/csv`, checksum), sets `export_job.file_id` and
  `row_count`, then flips to `succeeded` — file first, status second, so `succeeded` never points
  at a missing object.
  **Done-when:** `pnpm test apps/worker/src/jobs/deal-export.storage.spec.ts` → 0 failures,
  including a test that fetches the raw object URL with no signature and asserts HTTP `403`, and a
  fault-injection test where the upload throws → job ends `failed` with `error_code=storage_upload`,
  `file_id IS NULL`, and no orphan object remains in the bucket.

- **2.4 — `GET /api/exports/:id/download`.** Owner-scoped; `302` to a 15-minute signed URL; writes
  a `file_access_log` row per issue. Non-terminal job → `409`; expired job → `410`.
  **Done-when:** `pnpm test apps/web/src/app/api/exports/[id]/download` → 0 failures, covering
  `302` for the owner, `404` for another user, `409` while `running`, `403` when replaying a signed
  URL past its TTL (clock advanced via fake timers), and `count(file_access_log)` incremented by
  exactly 1 per successful issue.

- **2.5 — Contract extension.** Add `downloadUrl: z.string().url().nullable()` to
  `exportJobResponse` (populated only on `succeeded`). Single, final change to the frozen contract.
  **Done-when:** `pnpm --filter @app/contracts test && pnpm -w typecheck` → 0 failures, exit 0.

**Phase 2 Done-when (binary, whole phase):**
```bash
pnpm test packages/csv apps/worker/src/jobs apps/web/src/app/api/exports   # → 0 failures
bash scripts/smoke/export-download.sh                                      # → exit 0
```
`scripts/smoke/export-download.sh` seeds exactly 1,000 matching deals, POSTs the export, polls to
`succeeded`, follows the `302` with `curl -L -o /tmp/export.csv`, and exits `0` only if
`wc -l < /tmp/export.csv` → `1001` **and** `head -1 /tmp/export.csv` equals the §5 header line
exactly — otherwise exits `1`.

---

## Phase 3 — UI entry point, failure handling, retention

**Story.** The feature becomes reachable: Export on the deals list, a Recent exports panel that
polls, a working download, a visible failure with retry, and files that don't accumulate forever.

*Est. 12h.*

- **3.1 — Trigger + status UI.** `Export CSV` button on the deals list posts the *current* filters;
  `RecentExportsPanel` polls `GET /api/exports` every 3s while any job is non-terminal, stops
  polling when all are terminal, and renders a download link on `succeeded`, an error + `Retry` on
  `failed`.
  **Done-when:** `pnpm test apps/web/src/components/recent-exports` → 0 failures, including a fake-
  timer test asserting polling stops (0 further MSW requests) once every job is terminal; and the
  Playwright run in the phase gate below passes.

- **3.2 — Retry + dead-letter.** Max 3 attempts with exponential backoff; attempt 4 moves the job
  to `failed` with `error_code=dead_letter` and emits the `export.dead_letter` log event. Manual
  `POST /api/exports/:id/retry` re-enqueues a `failed` job (owner only, resets `attempts`).
  **Done-when:** `pnpm test apps/worker/src/jobs/deal-export.retry.spec.ts` → 0 failures, with a
  test that forces a throwing producer and asserts exactly 3 attempts, then `status=failed`,
  `error_code=dead_letter`, and one `export.dead_letter` log line.

- **3.3 — Retention.** Daily cron purges files + flips jobs older than 7 days to `expired`
  (`file_id` nulled, object deleted).
  **Done-when:** `pnpm test apps/worker/src/cron/export-retention.spec.ts` → 0 failures, seeding
  one 8-day-old and one 6-day-old succeeded job and asserting exactly the old one becomes
  `expired` with its object gone from the bucket and the recent one untouched.

- **3.4 — End-to-end + a11y.** Playwright: log in → filter deals → Export CSV → wait for the panel
  to show `Ready` → click download → assert a non-empty `text/csv` file with the expected header.
  **Done-when:** `pnpm exec playwright test e2e/deal-export.spec.ts` → 0 failures, with the test
  asserting `download.suggestedFilename()` matches `/^deals-\d{4}-\d{2}-\d{2}\.csv$/`, the saved
  file is `> 0` bytes, and `expect(await axe(page)).toHaveNoViolations()` on the deals page with
  the panel open.

**Phase 3 Done-when (binary, whole phase):**
```bash
pnpm test                                    # full suite → 0 failures
pnpm exec playwright test e2e/deal-export.spec.ts   # → 0 failures
pnpm -w lint && pnpm -w typecheck            # → exit 0
```
Plus the UI check: the Playwright screenshot `e2e/__screenshots__/deal-export-panel.png` matches
the approved design artifact within the project's 0.2% pixel threshold (`toHaveScreenshot`, which
fails the run on drift — no human eyeballing required).

---

## Notes carried out of this section

- **Rollback shape.** Each phase is one migration or none; phases 1–2 add no user-reachable
  surface, so a rollback is a revert of the deploy, not a data repair.
- **Deferred (see §10 Non-Goals, pushed to `.ai/backlog.md`).** XLSX output, scheduled/recurring
  exports, emailing the file rather than in-app download, per-org export quotas, and column
  selection in the UI. None of these change the job spine, so none of them belong in these phases.

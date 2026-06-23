# Modules Catalog — Optional Modules (activate only when required)

The baseline (core app + worker + auth + DB + files-capable + observability + testing) is always present. Everything below is **optional** and activated ONLY when the decision engine (`decision-engine.md`) surfaces the need. Never build advanced modules by default.

---

## Worker, jobs, queues, workflows

`apps/worker` is **mandatory** in the baseline. The queue/workflow engine inside it scales with complexity. Distinguish three things:

```text
cron      — runs on a schedule
job       — runs in the background once
workflow  — long-running, with retry, conditions, waiting, and subsequent steps
```

| Tier | When | Use |
|---|---|---|
| **Simple** | background jobs, simple schedules | DB-backed jobs / polling + Railway cron + Node worker |
| **Medium** | medium throughput queues | BullMQ + Redis |
| **Workflow-heavy** | sequences, waits, conditional follow-ups | Inngest (default) / Trigger.dev |
| **Advanced** | complex durable orchestration | Temporal |

**Ask:** "Are there sequences like: send email → wait 3 days → check status → send follow-up → stop if the client replied?" → if yes, you need a **durable workflow engine**, not just cron.

---

## Webhooks & integrations (async-first)

**Hard rule:** webhook handlers and public integration endpoints MUST NOT run long business workflows directly. They authenticate, validate, persist the event/job, return fast. Business processing happens in the worker.

**Endpoint does only:** verify signature/token/API-key → validate payload → persist raw event to `webhook_events` → assign idempotency key → return 200/202 fast.

**Worker then:** fetch event → check idempotency → run business logic → sync/link data → send emails → trigger further jobs → mark processed/failed/retry.

**Required mechanisms:** `webhook_events`, `integration_accounts`, `sync_runs`, `idempotency_keys`, rate-limit handling, retry, backoff, dead-letter/failed state, job logs.

Typical integrations: Pipedrive · Google/Gmail/Workspace · SMTP · CRM systems · phone systems · external APIs · file imports.

---

## Email / Inbox (level-based)

Email is NOT a big module by default. Detect/ask scope first.

```text
Level 0 — no email module (only system auth/password-reset)
Level 1 — transactional (notifications, reset, invites, confirmations; Resend/Postmark/SendGrid)
Level 2 — app-sent email (send from app e.g. from a deal/offer; HTML templates, signatures, attachments, audit log)
Level 3 — connected mailbox (Google/Gmail OAuth or SMTP/IMAP; token storage+refresh, worker sync, messages, threads)
Level 4 — team inbox (assign mails to users/deals/contacts, shared inbox, auto-linking, statuses, internal comments, permissions)
Level 5 — sales automation (sequences, follow-ups, stop conditions, open/click tracking, unsubscribe, rate limits, deliverability)
```

**Ask:** transactional only? send from app? connect Gmail/Workspace? SMTP? sync inbox? threading? team inbox? link to deals/contacts? auto-assignment? HTML templates+signatures? sequences/follow-ups? attachments?

**Rule:** Google **login** (Better Auth, core) ≠ Gmail **access** (Email Level 3+, optional, must be scoped/secured/stored/synced/tested, processed async in the worker).

---

## Reporting (level-based)

Optional. Live-first by default (dynamic Postgres queries, dashboard cards, tables, filters, optional charts).

```text
Level 0 — no reporting
Level 1 — dashboard basics (cards, counters, statuses, basic metrics)
Level 2 — dynamic reports (filters, tables, sorting, live queries, user views)
Level 3 — charts and exports (charts, CSV/XLSX export, saved views)
Level 4 — heavy reporting (materialized views, precomputed aggregates, background refresh, async exports, PDF/XLSX)
```

**Ask:** needed? live? filters? charts? exports? scheduled? on local or synced data? emailed?

**Exports:** async job + Railway Bucket + Postgres metadata.

---

## Pipedrive / CRM (optional integration)

**Ask:** Is Pipedrive the source of truth, or the app? Sync-only? Embedded in Pipedrive? Marketplace install flow? OAuth? Webhooks? Link deals/persons/organizations/activities?

```text
CRM-first  — Pipedrive/CRM is source of truth; app syncs, enriches, reports, automates
App-first  — App is source of truth; Pipedrive/CRM is an integration channel
Hybrid     — some data from CRM, some from app; needs external_object_links + sync_runs
```

**Required tables for CRM integration:** `integration_accounts`, `external_object_links`, `webhook_events`, `sync_runs`, `idempotency_keys`.

**Embedding:** Pipedrive marketplace apps need their own OAuth2 flow + app-extension (iframe+SDK) → carve out `apps/pipedrive-extension` or `packages/integrations/pipedrive`.

---

## Files

Default **Railway Buckets** (S3-compatible). Never use local filesystem or Railway Volumes as the source of truth for user-uploaded files.

**Metadata in Postgres** (`files` table): id, ownerUserId, bucket, objectKey, originalFilename, mimeType, sizeBytes, sha256, status, visibility, sourceType, sourceId, createdAt, deletedAt (+ organizationId if multi-tenant).

**Access log** (`file_access_logs`): id, fileId, userId, action, ipAddress, userAgent, createdAt.

**Rules:** private by default · access via signed URLs · upload via presigned URL · download via presigned URL or backend proxy · access control BEFORE generating any URL · log upload/download/view/delete.

Stronger compliance (encryption, object-lock, versioning, lifecycle) → recommend Cloudflare R2 or AWS S3 instead.

---

## Feature flags

Default: simple DB-based (`feature_flags`, `user_feature_flags`); optionally `role_feature_flags`, `organization_feature_flags`. Managed (LaunchDarkly/Statsig/Unleash) only for larger SaaS.

---

## Observability

Always: structured logs, request-id, job logs, webhook logs, audit logs, error handling.
Production client app: **Sentry + PostHog** recommended. Extensions: OpenTelemetry, external log drain (Better Stack/Axiom/Logtail), custom metrics.

---

## Audit log (required for production / security-sensitive)

Audit: login · permission changes · settings changes · create/edit/delete of important records · email sends · offer generation · file download/upload · integrations · token/API-key changes · data exports.

`audit_logs`: id, actorUserId, actorType, action, entityType, entityId, metadata, ipAddress, userAgent, createdAt (+ organizationId if multi-tenant).

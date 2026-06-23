# Security Checklist — Mandatory for Production / Client Apps

Security is a hard default, not an option. Any app in this profile may store: names, emails, phone numbers, documents, offers, company data, files, contact history, sales data, process data. For a **prototype** you may warn; for a **production client app** this checklist is **required** — get answers before shipping.

## Baseline rules (always)

```text
[ ] auth required by default (every non-public route)
[ ] permission checks by default (every data-mutating action checks auth + permissions)
[ ] input validation with Zod at every boundary (forms, server actions, route handlers, webhooks, adapters)
[ ] rate limiting on public / API / webhook endpoints
[ ] signed webhook / API secrets (verify before processing)
[ ] idempotency keys on integration intake
[ ] audit log for critical actions
[ ] file access log (upload/download/view/delete)
[ ] signed URLs for files; access control BEFORE generating any URL
[ ] no sensitive data in logs
[ ] secrets in environment variables only (never in code, never committed)
[ ] safe error messages (don't leak existence/internals)
[ ] migrations reviewed (no unreviewed prod schema changes)
[ ] production deploy protected (no automatic prod deploy; no prod migration without approval)
```

## Tenancy

```text
[ ] single-tenant: confirmed only one firm will ever use it
[ ] multi-tenant: organizationId on every client-data table
[ ] multi-tenant: every scoped query filters by organizationId (incl. inside EXISTS/subqueries/helpers)
[ ] multi-tenant: tests verify data isolation (no cross-org leakage)
[ ] multi-tenant: permissions include organization scope
```

## Auth & access

```text
[ ] Better Auth configured; email verification enabled for production
[ ] Google login = login only (NOT Gmail access — that's the Email module, Level 3+)
[ ] RBAC + permission checks; permission map for larger apps (deals.view, offers.send, files.download, settings.manage, integrations.manage, reports.view, …)
[ ] API keys / signed secrets for machine-to-machine + webhooks
[ ] integration tokens stored securely; refresh handled in worker
```

## Webhooks & integrations

```text
[ ] handler does intake only: verify → validate → persist → 200/202 fast
[ ] business processing runs async in the worker
[ ] idempotency (upsert keyed on provider event ID)
[ ] retry + backoff + dead-letter/failed state
[ ] rate-limit handling for outbound API calls
```

## Files

```text
[ ] private by default; signed URLs; metadata in Postgres; access control before URL
[ ] sensitive files → consider R2/S3 with encryption/object-lock/versioning/lifecycle
```

## Hard agent rules (security-affecting)

```text
[ ] never change auth/security without this checklist
[ ] never log sensitive data
[ ] never do automatic production deploys
[ ] never run production migrations without approval
[ ] never treat Google login as Gmail access
```

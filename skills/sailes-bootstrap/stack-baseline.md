# Stack Baseline — Custom B2B App (agentic-first)

**Profile:** custom web apps for ONE client/company/business-process (~90% of cases) — sales-support, CRM-adjacent, auto-offering, email automation, webhooks, syncs, reports, Pipedrive. ≤50 users, low concurrency, integration-heavy. NOT a multi-tenant SaaS by default.

**Owner preference (load-bearing):** **self-hosted on Railway, simple, no AWS.** Optimize for ease-of-hosting and simplicity, not hundreds-of-thousands-of-ops scale.

**Confidence:** ✅ verified primary source · 🟡 well-established/corroborated · 🔁 re-research at the profile's edges. Re-run `deep-research` before high-stakes reliance on 🟡/🔁.

---

## Decisions already closed (the default baseline)

```text
Hosting:        Railway (web service + worker service + Postgres + Railway Buckets)
Database:       Railway Postgres (migrations committed + reviewed, seeds for local/dev)
File storage:   Railway Buckets (S3-compatible)
ORM:            Drizzle (Prisma = plan B, Kysely = specialist)
Auth:           Better Auth (email/password + Google login; Pipedrive OAuth = integration module)
Frontend:       Next.js App Router + React + TS strict + Tailwind + shadcn/ui + React Hook Form + Zod
Repo:           pnpm monorepo (apps/web + apps/worker from day one)
Worker:         MANDATORY baseline (apps/worker always present)
Webhooks:       always async intake-only → worker does the business work
Tenancy:        single-tenant default; detect & switch to multi-tenant-ready when needed
Security:       hard default (not optional)
Audit log:      required for production / client apps
Testing:        Playwright E2E + local real tests + dev smoke tests
Observability:  structured logs always; Sentry + PostHog recommended for production
Email:          OPTIONAL module, level-based (0–5) — scope before building
Reporting:      OPTIONAL module, level-based (0–4) — scope before building
Pipedrive:      OPTIONAL integration module
Feature flags:  simple DB-based default
Environments:   local / dev / prod (staging only for larger/riskier projects)
```

**Rule:** do NOT build advanced/optional modules by default. Classify project scope first (see `decision-engine.md`), then activate only the modules the requirements imply.

---

## Default stack — per layer

| Layer | Default | Conf | One-line why |
|---|---|---|---|
| Runtime / pkg | Node Active LTS (24) · **pnpm** monorepo | 🟡 | LTS for prod; workspaces make local linking explicit; ready for worker/integrations from day one. |
| Language | TypeScript **strict** end-to-end | 🟡 | One language UI+API+worker; best agent + type-safety story. |
| Framework | **Next.js App Router** | 🟡 | RSC + Server Actions + Route Handlers (auth, webhook intake). Generates AGENTS.md/CLAUDE.md. |
| UI | **Tailwind + shadcn/ui + React Hook Form + Zod** | 🟡 | "open code" components in-repo (agent-editable); forms validated by Zod; domain logic OUT of UI. |
| DB | **Railway Postgres** | 🟡 | Single Postgres, migrations in repo + reviewed, seeds local/dev, test DB for integration tests. |
| ORM | **Drizzle** (default) | 🟡 | TS-first, Postgres-first, explicit schema/query → great for reports, integrations, audit logs, and agent comprehension. Plan B / specialist below. |
| Auth | **Better Auth** (email/pw + Google) | 🟡 | Owns its tables, sessions, org/admin plugins, Drizzle adapter, password reset, email verification (prod). **Google login ≠ Gmail access.** |
| Worker | **apps/worker (mandatory)** | 🟡 | Webhook processing, syncs, email send, report/export generation, file processing, retry, long jobs, workflows, API rate-limit/backoff. |
| Jobs/queue/workflow | DB-jobs + Railway cron → BullMQ+Redis → Inngest/Trigger.dev → Temporal | 🟡 | Pick by complexity — see `modules-catalog.md`. Default simple; durable engine only when sequences/waits exist. |
| Webhooks | own async intake (verify → validate → persist → 202; worker processes) | 🟡 | At-least-once → idempotency-keys mandatory. See `security-checklist.md` + `modules-catalog.md`. |
| Files | **Railway Buckets** (S3-compatible) | 🟡 | Private by default, signed URLs, metadata in Postgres, access log. R2/S3 only for stronger compliance. |
| Email | OPTIONAL, level 0–5 | 🟡 | Resend/Postmark for transactional; Gmail/Workspace OAuth for connected mailbox. See catalog. |
| Reporting | OPTIONAL, level 0–4 | 🟡 | Live-first; async exports → Railway Bucket + Postgres metadata. See catalog. |
| Feature flags | DB-based (`feature_flags`, `user_feature_flags`) | 🟡 | No LaunchDarkly/Statsig for custom apps; managed only for larger SaaS. |
| Observability | structured logs + request-id + job/webhook/audit logs; **Sentry + PostHog** (prod) | 🟡 | OTel / external log drain (Better Stack/Axiom/Logtail) as extension. |
| Testing | Vitest · MSW · Testcontainers · Playwright | 🟡 | Determinism + evidence-on-failure; real tests, no faked passes. |

---

## ORM choice (Drizzle default)

Both Drizzle and Prisma sit between TS and Postgres; they differ in philosophy. **Drizzle is default** for this profile: explicit schema (plain TS, no `generate` step), exact SQL control for upserts/idempotency/conflict-handling in integrations, and easy for an agent to reason about. It's also what `create-pipedrive-app` scaffolds.

```text
Default: Drizzle  (TS-first, Postgres-first, explicit, integration- & report-friendly)
Use Prisma when:  mostly fast CRUD, team wants a high-level ORM, SQL control matters less
Use Kysely when:  query-heavy, very complex reports, max SQL control without raw SQL everywhere
```

- **Prisma 7** is now Rust-free (smaller bundle, faster queries, Edge-friendly) — a legitimate plan B, not "automatically worse." *(✅ prisma.io)*
- **Lucia is deprecated** as a library — never start on it. *(✅ github.com/lucia-auth)*

---

## Typical system / cross-cutting tables

```text
users · sessions/auth tables · api_keys
audit_logs · file_records · file_access_logs
webhook_events · integration_accounts · sync_runs · idempotency_keys · job_runs
feature_flags · user_feature_flags
```

Multi-tenant adds: `organizations · organization_members · organization_roles · organization_settings` and `organizationId` on every client-data table.

---

## Hosting note — Railway vs Vercel+Neon

- **Vercel** = paid serverless host (dislikes long-lived workers/cron). **Neon** = hosted Postgres with DB branching.
- **Railway (DEFAULT)** runs everything in containers: web + worker + Postgres + Buckets — no AWS, one panel. Runs long-lived workers + cron natively → removes the serverless caveat. Owner preference: simple, self-hosted.
- **Vercel + Neon = optional alternative** only if you later want automatic preview-per-PR + DB branching. Not worth the extra vendors for the stated goal (simplicity, ≤50 users).

---

## Decision table — when to LEAVE the default

| If the project… | Then deviate to… |
|---|---|
| Serves multiple firms/clients/orgs | multi-tenant-ready (organization model, organizationId, isolation tests, org-scoped permissions) |
| Is mostly fast CRUD / product-app, team loves schema-first | Prisma instead of Drizzle |
| Is query-heavy / very complex reports | Kysely (or Kysely as a targeted layer) |
| Has email/wait/follow-up **sequences** | durable workflow engine (Inngest/Trigger.dev), not just cron |
| Needs medium throughput queues | BullMQ + Redis |
| Needs compliance/encryption/object-lock/versioning on files | Cloudflare R2 or AWS S3 instead of Railway Buckets |
| Wants automatic preview-per-PR + DB branching | Vercel + Neon instead of Railway |
| Wants fully managed auth, budget OK | Clerk instead of Better Auth |
| Touches Pipedrive embedding/marketplace | carve out `apps/pipedrive-extension` (iframe+SDK) + own OAuth2 flow |
| Sends email as the user's Gmail | Gmail API + OAuth scopes (Email Level 3+), not just transactional |
| Breaks the ≤50-user / single-client profile | re-run discovery + a fresh stack research |

---

## Sources

- ✅ Prisma 7 / Rust-free GA: https://www.prisma.io/blog/rust-free-prisma-orm-is-ready-for-production
- ✅ Lucia deprecation: https://github.com/lucia-auth/lucia/discussions/1714
- ✅ Anthropic Claude Code best practices: https://code.claude.com/docs/en/best-practices · Next.js AI-agents guide
- 🟡 Drizzle/Prisma/Kysely, Better Auth, Inngest/Trigger.dev/BullMQ/Temporal, Railway (Buckets/Postgres/cron), shadcn/ui, Zod, RHF, Testcontainers/MSW/Playwright, Sentry/PostHog, Pipedrive OAuth2 + `create-pipedrive-app`: corroborated across multi-source research (Jun 2026). Re-confirm before high-stakes use.
```

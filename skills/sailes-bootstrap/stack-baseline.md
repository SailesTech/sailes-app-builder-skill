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
| Framework | **Next.js App Router** (default) — or **SPA (Vite+React) + standalone API** variant | 🟡 | Next.js when front is/may be public or web is the only backend consumer. Switch to the SPA+API variant for login-only UI with multiple backend consumers / independent deploy / very heavy async backend — see **Frontend architecture** below. |
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
| Shared contracts | **`packages/contracts`** — Zod schemas + inferred TS types for every API shape | 🟡 | The ONE place web + worker import request/response shapes from. A frozen BE contract = a commit here that `fe-dev` imports; drift becomes a compile error, not a review finding (see `agent-team-structure.md`). |

---

## Frontend architecture — two first-class shapes (pick by triggers, not by default)

Both are supported. Present as a decision card; the choice goes in the Decisions Ledger (deviation from default → ADR).

### A) Next.js fullstack (DEFAULT)

Front + backend in one app: RSC/SSR, Route Handlers, Server Actions, middleware. Worker still separate (`apps/worker`).

- **Choose when:** the frontend is or may become **public / needs SEO**; **the web app is the only backend consumer**; and the backend fits inside Next + one worker.
- ✅ One codebase, one origin (no CORS), native shared types, BetterAuth+Next well-trodden, least glue.
- ⚠️ Wasted SSR for a login-only tool; other API consumers (n8n, FHIR, mobile) would have to go through a Next route layer that's coupled to the UI deploy.

### B) SPA (Vite + React) + standalone API (NAMED VARIANT)

`apps/web` = Vite/React SPA (panels behind login) · `apps/api` = standalone API · `apps/worker` = async work. Shared types via `packages/contracts`.

- **Choose when ANY of:**
  - **Login-only UI, no public pages / SEO** (SSR atut is wasted), AND one or more of:
  - **Multiple backend consumers** (web SPA + n8n + FHIR + CRM + mobile / 3rd-party) → the API must stand alone.
  - **Independent deploy/scale** of front vs back required (webhooks/sync must not break on a UI deploy).
  - **Very heavy / async backend** (long syncs, queues, file-merging, many integrations) where the request-API is a thin layer over a worker.
- **Request-API engine** is its own decision card: **Fastify** (schema/Zod validation first-class, fast, great logging — good default for API-first) · **Hono** (ultralight, excellent types, edge-ready) · **Express** (largest ecosystem, manual validation/types). Pick by developer-fit + needs; record it.
- ✅ Clean dumb-client ↔ one backend with all server/integration logic; independent deploys; API serves many consumers; maps to a split FE/BE team.
- ⚠️ Two builds; **CORS + auth-bridge** (SPA↔API cross-origin cookies, CSRF) must be solved explicitly (BetterAuth same-site/proxy); **reclaim end-to-end types with `packages/contracts`** (Zod/TypeBox) + generated OpenAPI client — don't lose them.

### C) Hybrid (Next front + separate API)

Only when you genuinely need **both** SSR *and* a standalone API. Usually the worst cost/benefit (most processes, duplicated auth/types). Justify in an ADR.

> **Embedded-in-a-platform** surfaces (e.g. a panel inside Pipedrive) are a separate artifact regardless of A/B/C — SPA/vanilla + that platform's SDK. See `sailes-pipedrive`.

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

# Recommended Skeleton — pnpm Monorepo (custom B2B app)

Generate this for a new project. Include `apps/web` + `apps/worker` from day one (worker is mandatory). Create optional `packages/*` only when the module manifest (from `decision-engine.md`) activates them — but the monorepo layout is ready for all of them.

```text
repo/
  apps/
    web/                  # Next.js App Router — UI, server actions, route handlers,
      app/                #   auth/session, user requests, webhook INTAKE, event/job persistence
      src/
      public/
      package.json
    worker/               # MANDATORY — webhook processing, syncs, email send, reports/exports,
      src/                #   file processing, retry, long jobs, workflows, API rate-limit/backoff
      package.json

  packages/
    db/                   # Drizzle: schema/ migrations/ seeds/ src/
    auth/                 # Better Auth setup
    ui/                   # shadcn/ui components
    files/                # Railway Buckets: signed URLs, metadata, access log
    integrations/         # ports & adapters — pipedrive/ google/ webhooks/
    jobs/                 # queue/workflow wiring (tier per project)
    testing/             # shared test utils, Testcontainers helpers
    observability/        # structured logs, request-id, Sentry/PostHog wiring
    email/        (opt)   # only if Email module activated (level-based)
    reporting/    (opt)   # only if Reporting module activated (level-based)

  .ai/                    # generate the FULL structure on a new repo. IDEMPOTENT: if any of these
                          #   already exist in the repo, do NOT overwrite — only add what's missing,
                          #   and follow the repo's existing convention if it differs. (Pattern: Open-Mercato .ai/.)
    specs/                # live specs (draft/approved/in-progress)
      implemented/        #   shipped & deployed specs (git mv here when done)
      archived/           #   abandoned / superseded specs (kept for history)
      ui-spec.md          # design artifact (or design-system/MASTER.md) — from sailes-design; required for UI apps
    checklists/
      security.md  testing.md  deployment.md  webhook.md  email.md  reporting.md
    adr/
      template.md         # architectural decision records
      ADR-001-*.md        # first decision: the stack selection
    skills/
      spec-writing/SKILL.md   # ALWAYS generated (from spec-writing-template.md) — Phase 3 depends on it
      discovery/SKILL.md       # carried over if useful
    backlog.md            # deferred ideas / future features / tech debt (non-goals land here, not lost). See modules-catalog / discovery.
    lessons.md            # institutional memory: Context/Problem/Rule/Applies-to. Created with header; filled on first real lesson.

  design-system/          # if sailes-design used the Master+Overrides pattern instead of .ai/specs/ui-spec.md
    MASTER.md             #   global source of truth: palette, type, spacing, components
    pages/                #   per-page overrides (only deviations from MASTER)

  .husky/
    pre-commit            # lint + typecheck (+ format/i18n) — deterministic gate before commit
  .github/
    workflows/ci.yml      # lint → typecheck → unit → integration → e2e → security scan

  AGENTS.md               # concise; see agents-md-template.md (incl. Git Workflow + PR Workflow)
  CLAUDE.md               # → @AGENTS.md
  README.md
  package.json
  pnpm-workspace.yaml
  turbo.json              # optional, when builds multiply
  docker-compose.yml      # optional, local Postgres
```

**Single-repo vs monorepo:** default to the monorepo above even for a small first project — it's ready for worker, integrations, email, reports, files, tests. Start single-repo only if you're certain you won't split web/worker/extensions; even then keep the full agentic-first skeleton (`AGENTS.md`, `CLAUDE.md`, `.ai/`, reusable CI workflows).

## Key implementation rules (carry into the spec + AGENTS.md)

```text
1.  Do not build advanced modules by default.
2.  Always classify project scope first (decision-engine.md).
3.  Always include apps/worker.
4.  Always process webhooks asynchronously (intake → worker).
5.  Always validate input (Zod).
6.  Always protect files with signed URLs + access control before URL.
7.  Always store file metadata in Postgres.
8.  Always keep secrets in environment variables.
9.  Always avoid sensitive data in logs.
10. Always write or identify a RED test before implementation.
11. Always run local tests before the final answer.
12. Always run Playwright E2E for user-critical flows.
13. Always document architectural changes in an ADR.
14. Always require the security checklist for production apps.
15. Never treat Google login as Gmail access.
```

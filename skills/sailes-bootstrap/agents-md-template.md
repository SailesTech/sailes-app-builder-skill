# AGENTS.md Skeleton — for an Empty Repo

Generate this at repo root when bootstrapping a new agentic-first project (Case B). Keep it **concise** — only what the agent can't infer from code (Anthropic guidance: bloated memory files get ignored). **Size budget: target ≤ ~150 lines for the root file.** The root is a map, not an encyclopedia — module detail lives in per-module colocated docs (`src/modules/x/AGENTS.md` or README) that the Task Router points to. A rule that promotes into this file must **displace or merge, not only append** — the budget forces curation; and a rule the toolchain enforces gets a one-line pointer, not a paragraph (the ratchet, `agentic-first-principles.md` §B.3). Adapt to the chosen stack; delete rows that don't apply. Pair it with `CLAUDE.md` containing only `@AGENTS.md`.

Also scaffold (see `skeleton.md` for the full monorepo layout):
- `CLAUDE.md` → single line: `@AGENTS.md`
- pnpm monorepo: `apps/web` + `apps/worker` (worker mandatory) + `packages/{db,auth,ui,files,integrations,jobs,testing,observability}` (email/reporting optional)
- `.ai/specs/` (+ `implemented/` + `archived/`; short `AGENTS.md`: naming `{YYYY-MM-DD}-{kebab-title}.md`, Status field, folder lifecycle)
- `.ai/skills/` — carry over `discovery` + `spec-writing` patterns
- `.ai/checklists/` — security.md, testing.md, deployment.md, webhook.md, email.md, reporting.md
- `.ai/adr/template.md` — architectural decision records
- `.ai/backlog.md` — deferred ideas / later phases / tech debt (header-only to start)
- `.ai/lessons.md` — institutional memory (header-only; filled on first correction)
- `.ai/STATE.md` — session memory (header-only, five sections: Verified facts / General rules / Open failures / Lessons learned / Last session)
- `.ai/runs/` — per-session run log for long/resumable work (created when first used)
- `.ai/screens/` — latest accepted screenshot per key screen, qa's vision-verify baseline (created when first used)
- `STATUS.md` (root) — client-readable progress, derived from live specs (header-only to start; updated at each phase gate — see `sailes-implement`). No effort/pricing data ever.
- `.claude/settings.json` + hooks — the harness guardrails (permissions allowlist, SessionStart memory injection, PreToolUse protected paths) — see `skeleton.md`
- (idempotent: never overwrite an existing `.ai/` artifact; add only what's missing)

---

```markdown
# Agents Guidelines

> Single source of truth for how agents work in this repo. CLAUDE.md imports this via @AGENTS.md.
> Framework-Version: <x.y.z — from the sailes framework VERSION file at bootstrap time; used by adopt-existing-repo upgrade mode>

## Enforcement (the ratchet)
- Rules the toolchain enforces (lint/types/tests/hooks) are NOT restated here — this file lists only judgment rules and pointers. If you can express a rule as a check, add the check and link it here instead of writing prose (`agentic-first-principles.md` §B.3).
- Enforced in this repo: no `any` (ESLint error) · design tokens only (lint on raw literals) · module import direction (dependency rule) · Zod at boundaries (convention test). <!-- keep this list in sync with the actual config -->
- Harness guardrails (`.claude/settings.json` + hooks): verify commands run without prompts; protected paths (`.env*`, applied migrations, prod deploy/migrate commands) are blocked; STATE.md is injected at session start. In a harness without hooks, the prose rules below are the fallback — know which rules lost their backstop.

## Before Writing Code
1. Run discovery (needs/scope) → then bootstrap (methodology + stack) → then spec.
2. Check `.ai/specs/` for an existing spec on the area you're touching.
3. Enter plan mode for non-trivial tasks (3+ steps or an architectural decision).
4. Spec-first for non-trivial work: `.ai/specs/{YYYY-MM-DD}-{kebab-title}.md`. Implement integration tests in the same change.

## Stack
- Runtime/pkg: Node Active LTS (24) + pnpm monorepo (apps/web + apps/worker)
- Language: TypeScript strict, end-to-end
- UI: React + Tailwind CSS + shadcn/ui + React Hook Form + Zod
- Framework: Next.js (App Router) — RSC, Server Actions, Route Handlers (auth, webhook intake)
- DB: Railway Postgres + Drizzle (default; Prisma = plan B, Kysely = specialist). Migrations committed + reviewed; seeds for local/dev.
- Auth: Better Auth (email/pw + Google login). Google login = login only, NOT Gmail access.
- Worker: apps/worker MANDATORY — webhook processing, syncs, email send, reports/exports, file processing, retry, long jobs, workflows.
- Jobs/queue: pick tier per project — DB-jobs+Railway cron → BullMQ+Redis → Inngest/Trigger.dev (sequences/waits) → Temporal.
- Webhooks: intake only (verify signature → validate → persist to webhook_events → idempotency key → 202); worker does the business work.
- Storage: Railway Buckets (S3-compatible). Files private, signed URLs, metadata in Postgres, access log. R2/S3 for stronger compliance.
- Observability: structured logs + request-id + job/webhook/audit logs; Sentry + PostHog for production.
- Hosting: Railway (web + worker + Postgres + Buckets), envs local/dev/prod.
<!-- See the project-bootstrap skill's stack-baseline.md + modules-catalog.md for rationale, optional-module levels, and when to deviate. -->

## Tenancy
- Default: single-tenant (one client). Do NOT force organizationId everywhere.
- Multi-tenant (multiple firms): organization model + organizationId on every client-data table + isolation tests + org-scoped permissions.

## Architecture (Critical Rules)
- Don't build advanced/optional modules by default — activate per the project's module manifest.
- apps/worker always present; webhooks ALWAYS async intake → worker.
- Integrations are adapters (ports & adapters): each external system = its own adapter; required tables: integration_accounts, external_object_links, webhook_events, sync_runs, idempotency_keys.
- Modular boundaries: link across modules by FK ID + fetch; no cross-module direct DB/ORM access.

## Data & Security  (see .ai/checklists/security.md — mandatory for production)
- Auth required by default; permission checks (RBAC) on every data-mutating action.
- Validate all inputs with Zod at every boundary; derive types via z.infer. No `any`.
- Parameterized queries only (use the ORM; never string-build SQL).
- Signed webhook/API secrets + idempotency keys on integration intake.
- Files: private by default, signed URLs, access control BEFORE URL, file access log.
- Audit log for critical actions. Secrets in env only; never logged, never committed.
- Sensitive data → encryption-at-rest where required; multi-tenant → filter organizationId in every scoped query incl. EXISTS/subqueries.

## Verification (every task)
- RED test first: write or identify a failing test before implementation.
- End every task with a check you run: lint, typecheck, unit/integration, Playwright E2E for user-critical flows. Show the output — never fake a pass.
- **Behavior before diff:** verify by driving the real running system (e2e flow / curl the live endpoint / click the UI / generate the real artifact) and observing behavior — THEN read code. Green build/lint ≠ proof.
- Self-contained tests: create own fixtures, clean up, no dependence on seed data.
- Adversarial review: a fresh-context reviewer checks the diff vs the plan before "done".

## Agent Teams (non-trivial work)
- 3+ steps / BE+FE / API contract / architecture → run as a team, not solo. Roles in `~/.claude/agents/`: `team-lead` (plan/integrate, never bulk-codes), `explorer` (read-only recon), `designer` (UX spec), `be-dev`/`fe-dev`, `checker` (independent review), `qa` (real-flow e2e proof).
- Order: explorer → designer → BE contract → fe-dev → checker → qa. One task per worker; workers escalate scope to lead; workers never commit/push.
- **Lifecycle:** the lead spawns one worker per ready task and **releases it once its result is integrated** — no idle agents kept alive. On **CHANGES-REQUIRED**, re-spawn a fresh worker with clean scope, don't reuse a stale one. Record per task in the run log who was spawned / what they returned / the gate verdict / whether released — so after a context reset the lead rebuilds *which agents are still active* and releases orphans. Exactly one lead = the human's single point of contact.
- Enable teammates: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `~/.claude/settings.json`. **Without it**, the same roles/order/gates run as sequential scoped subagents (the model doesn't depend on the flag) — read-only roles (`explorer`/`checker`/`qa`) map to read-only subagents; same-file tasks run sequentially. Solo is fine when the diff fits one sentence.
- The rules above are self-contained for day-to-day work. For the full rationale (per-role "never" list, who-is-lead detail, fallback notes), load the global `sailes-bootstrap` skill — its `agent-team-structure.md` is the canon. (It is a globally-installed skill, not a file in this repo.)

## Conventions
- DB tables/columns: snake_case, tables plural. JS/TS identifiers: camelCase. UUID PKs.
- Common columns: id, created_at, updated_at, deleted_at (+ organization_id if multi-tenant).
- No hardcoded user-facing strings. No inline comments — self-documenting code.

## Key Commands
- `pnpm install` · `pnpm dev` · `pnpm build`
- `pnpm test` (unit, fast inner loop) · `pnpm test:e2e` (Playwright)
- `pnpm lint` · `pnpm typecheck`
- `pnpm db:generate` / `db:migrate` / `db:push` (Drizzle; push for prototyping)

## Git Workflow
- Branch per feature off up-to-date default: `git switch -c feat/<kebab-desc>` (prefixes: feat/ fix/ chore/ refactor/ docs/ spec/). One feature = one branch = one PR.
- Small, focused, present-tense commits (conventional: feat:/fix:/chore:); each leaves the app working. Stage what you touched — no blind `git add -A`. Reference the spec/issue.
- Merge via PR into default; rebase your branch on latest default first, resolve conflicts locally, re-run tests; delete branch after merge.
- Rollback by blast radius: `git restore` (uncommitted) → `git reset --soft HEAD~1` (keep changes) → `git revert <sha>` (shared/pushed). `git stash` to park WIP. Parallel work → separate branch or `git worktree`.

## PR Workflow
- Ready PR carries `review`. Pipeline labels mutually exclusive (review / changes-requested / qa / merge-queue); category labels additive (bug/feature/refactor/security/docs).
- Adversarial review (fresh context) before marking ready. Keep the taxonomy minimal for a small app; grow only when throughput needs it.

## Lessons
- After a correction or a recurring bug, append to `.ai/lessons.md`: Context / Problem / Rule / Applies-to. This is the repo's durable memory — read it before non-trivial work.
- **Promotion rule (memory must compound):** a lesson that recurs or generalizes gets promoted upward — **preferably as an enforced check** (lint rule / convention test / hook — see Enforcement above), else a line in this AGENTS.md / Task Router; cross-project pattern → candidate for a global skill. Review `.ai/lessons.md` for promotion candidates when closing a spec. A lesson that is only ever appended, never promoted, is noise.
- **Escaped-defect autopsy (gates must compound):** a defect found after `checker`+`qa` passed (client, prod, later phase) is a gate failure. The fix ships with an `Escaped-defect:` entry in `.ai/lessons.md`: which gate should have caught it + what check that gate now gains (checklist line / authz-matrix row / lint rule — prefer enforcement). Autopsy entries are priority promotion candidates.

## Client Status (STATUS.md)
- Root `STATUS.md` is the client-readable progress view, derived from live specs: per feature — phases done/total, the plain-language Done-when result, accepted screenshot for UI phases. Updated at every phase gate (`sailes-implement`). Never contains effort, hours, or pricing data.

## Session Memory (`.ai/STATE.md`)
- Five sections: **Verified facts** (checked, each with the command/evidence that proved it) · **General rules** (distilled from this project) · **Open failures** (unresolved problems + best diagnosis so far) · **Lessons learned** (pointers into `.ai/lessons.md`) · **Last session** (where work stopped + the next step).
- **Read at session start** — before any non-trivial work, read STATE.md + lessons.md; otherwise you re-derive known state and repeat known dead ends.
- **Write before walking away** — every working session ends by updating STATE.md: promote what you verified into Verified facts, record what's still broken in Open failures, update Last session. A session that ends without this write loses its memory. This applies on interruption too, not just on completion.
- **Facts vs hypotheses:** an entry enters Verified facts only with evidence attached; everything unproven stays in Open failures. Never let a hypothesis masquerade as a fact.

## Hard Safety Rules
- NEVER commit/push without explicit human instruction.
- NEVER `git reset --hard` / `git push --force` / force-push or rebase a shared branch without explicit confirmation.
- NEVER commit directly to main/default for feature work; NEVER commit secrets/.env/build artifacts.
- NEVER auto-deploy to production; NEVER run production migrations without approval.
- NEVER change auth/security without the security checklist.
- NEVER log sensitive data; NEVER treat Google login as Gmail access.
- NEVER delete tests or bypass typecheck. Don't change architecture without an ADR.
- NEVER edit a migration that may already be applied — add a new one.
- After two failed attempts with the same approach: stop, describe what you learned, reformulate.

## Task Router
<!-- Grow this as the codebase grows: map task type → the guide/module/skill that covers it.
     A task often maps to MULTIPLE rows — read ALL matching guides before starting; they hold the
     imports, patterns, and constraints you need. Add a per-package AGENTS.md and route to it here. -->
| Task | Guide |
|------|-------|
| New module / CRUD | (reference module path) |
| Webhook integration | packages/integrations + .ai/checklists/webhook.md |
| Background job / workflow | apps/worker + packages/jobs |
| Auth / RBAC | packages/auth |
| Files | packages/files |
| Email / Reporting (optional) | packages/email · packages/reporting + checklists |
| Write / update a spec | .ai/skills/spec-writing (or global sailes-spec) |
| Analyze a spec before coding (BC/risk/readiness) | sailes-pre-implement |
| Implement a spec / its phases | sailes-implement |
| Review a change (architecture/security/quality) | .ai/skills/code-review (or /code-review) |
```

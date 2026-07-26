# Arm A · explorer-1 — external-tool mentions in `skills/sailes-bootstrap/`

Scope: `skills/sailes-bootstrap/` only (22 files, all read in full). Facts only; no dedup, no
ranking, no conclusions. Every entry = tool name · repo-relative path · verbatim quote (version
numbers and "if absent" behaviour included where the source states them).

Files read: `SKILL.md`, `adopt-existing-repo.md`, `agent-team-structure.md`,
`agentic-first-principles.md`, `agents-md-template.md`, `backlog-template.md`,
`codex-config-template.md`, `decision-engine.md`, `developer-fit.md`, `graphify-setup.md`,
`hooks-template/guard-protected-paths.sh`, `hooks-template/session-start.sh`,
`modules-catalog.md`, `release-checklist.md`, `repo-done-checklist.md`,
`repo-done-checklist.test.js`, `security-checklist.md`, `settings-template.json`, `skeleton.md`,
`spec-writing-template.md`, `stack-baseline.md`, `ui-libraries.md`.

---

## 1. `skills/sailes-bootstrap/SKILL.md`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | pnpm (monorepo) | "**Worker process + monorepo** (`apps/worker` + pnpm monorepo). The baseline recommends it, but for a small, low-concurrency tool a leaner single Next.js app (background work in a route/queue-lite) may be enough." |
| 2 | Next.js | "a leaner single Next.js app (background work in a route/queue-lite) may be enough" |
| 3 | Puppeteer / headless Chrome | "Offer the real options — e.g. Puppeteer/headless-Chrome (✅ full HTML/CSS fidelity ⚠️ heavier RAM/Railway tier) vs. `@react-pdf`/pure-JS (✅ light, no browser ⚠️ less layout flexibility) — with a recommendation tied to fidelity needs." |
| 4 | `@react-pdf` | (same sentence as #3) "vs. `@react-pdf`/pure-JS (✅ light, no browser ⚠️ less layout flexibility)" |
| 5 | Railway | "**PDF / document generation** … ⚠️ heavier RAM/Railway tier" |
| 6 | Codex CLI | "**Also scaffold the harness guardrails** — BOTH twins: `.claude/settings.json` (Claude Code) AND `.codex/config.toml` (Codex CLI) per `codex-config-template.md`" |
| 7 | Claude Code | (same sentence as #6) "`.claude/settings.json` (Claude Code)" |
| 8 | GitHub Copilot | "plus the shared `.claude/hooks/*.sh` and `.github/copilot-instructions.md` pointer" |
| 9 | Codex / Copilot (skip condition) | "Generate the Codex twin by default so the app runs *guarded* (not just readable) under Codex; skip only if the client explicitly will never use Codex/Copilot." |
| 10 | git | "**`git init` + a first commit are part of generation, not optional.** A repo with 0 commits is not set up. Commit the skeleton." |
| 11 | Railway · Postgres · Railway Buckets · Drizzle · Better Auth · Next.js · shadcn · pnpm · Sentry · PostHog | "**Empty repo:** the baseline (Railway · Postgres · Railway Buckets · Drizzle · Better Auth · Next.js+shadcn · pnpm monorepo · mandatory worker · async webhooks · Sentry/PostHog for prod) is your **recommendation, not a decree**." |
| 12 | Vite (SPA) | "at minimum **frontend architecture** (Next.js fullstack vs SPA+standalone-API — see `stack-baseline.md` Frontend architecture …)" |
| 13 | Fastify / Hono / Express | "**request-API engine** if split (Fastify vs Hono vs Express)" |
| 14 | Tailwind / shadcn / Preline / Astryx | "**UI layer** (Tailwind+shadcn default vs +Preline blocks vs Astryx — see `ui-libraries.md`)" |
| 15 | Drizzle / Prisma / Kysely | "**ORM** (Drizzle vs Prisma vs Kysely)" |
| 16 | Better Auth / Clerk | "**Auth** (Better Auth vs Clerk vs email/pw)" |
| 17 | Railway / Vercel / Neon | "**Hosting** (Railway vs Vercel+Neon)" |
| 18 | TypeScript + pnpm | "Only TypeScript + pnpm are stated as flat defaults; **the framework shape is NOT pre-decided**" |
| 19 | Redis (as anti-pattern mention) | "**Do NOT recommend from stale memory** — defaults drift (Redis-by-reflex, deprecated auth libs, Prisma/Drizzle hand-waving)." |
| 20 | graphify | "Every Sailes repo ships with a queryable knowledge graph of its own code. Follow `graphify-setup.md` → "The procedure" **verbatim and in order** (extract → hook install → claude install → codex install → ignore files → commit). Deterministic AST pass — free, local, no API key." |
| 21 | graphify — if absent | "Binary missing? Follow "If graphify is missing" — one-line install hint, else an explicit `SKIP` recorded in `.ai/STATE.md` and in the done-checklist output. **Never block, never skip silently.**" |
| 22 | graphify — ordering constraint | "Runs AFTER `.claude/settings.json` exists (graphify merges its hooks into it)." |
| 23 | Tailwind / shadcn (design gate) | "Carry in the confirmed brief + locked stack so design decisions match the product and the tokens target the real framework (Tailwind/shadcn etc.)." |
| 24 | `AskUserQuestion` (harness tool) | "ask the classification questions in adaptive rounds of 3-4 (`AskUserQuestion`), leading with the forks that change architecture" |
| 25 | git / find (verification) | "Do not claim bootstrap is done or proceed to spec/implementation while any `MISS` line remains — "I created the files" is not evidence; the `find`/`git log` output is." |
| 26 | docker-compose (repo signal) | "stack signals (`package.json`, lockfile, framework, ORM, `docker-compose`)" |
| 27 | Playwright — via checklist ref | (Common Mistakes / Red Flags do not name it here; noted absent in SKILL.md) |

Also stated in SKILL.md's Common Mistakes / Red Flags rows:
- "You named a queue/auth/ORM/storage without checking `stack-baseline.md`."
- "Handing off with no code map (or silently skipping it) | Run Step 4.9 (`graphify-setup.md`); a missing binary yields an explicit SKIP in the checklist, never silence."

---

## 2. `skills/sailes-bootstrap/stack-baseline.md`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | Railway (hosting, self-hosted preference) | "**Owner preference (load-bearing):** **self-hosted on Railway, simple, no AWS.**" |
| 2 | AWS (excluded) | (same as #1) "self-hosted on Railway, simple, no AWS" |
| 3 | Railway (services) | "Hosting:        Railway (web service + worker service + Postgres + Railway Buckets)" |
| 4 | Railway Postgres | "Database:       Railway Postgres (migrations committed + reviewed, seeds for local/dev)" |
| 5 | Railway Buckets | "File storage:   Railway Buckets (S3-compatible)" |
| 6 | Drizzle / Prisma / Kysely | "ORM:            Drizzle (Prisma = plan B, Kysely = specialist)" |
| 7 | Better Auth | "Auth:           Better Auth (email/password + Google login; Pipedrive OAuth = integration module)" |
| 8 | Google login / Pipedrive OAuth | (same as #7) |
| 9 | Next.js, React, TS, Tailwind, shadcn/ui, React Hook Form, Zod | "Frontend:       Next.js App Router + React + TS strict + Tailwind + shadcn/ui + React Hook Form + Zod" |
| 10 | pnpm | "Repo:           pnpm monorepo (apps/web + apps/worker from day one)" |
| 11 | Playwright | "Testing:        Playwright E2E + local real tests + dev smoke tests" |
| 12 | Sentry + PostHog | "Observability:  structured logs always; Sentry + PostHog recommended for production" |
| 13 | Node (version) | "Runtime / pkg | Node Active LTS (24) · **pnpm** monorepo | 🟡 | LTS for prod; workspaces make local linking explicit; ready for worker/integrations from day one." |
| 14 | TypeScript | "Language | TypeScript **strict** end-to-end" |
| 15 | Next.js App Router / Vite+React | "Framework | **Next.js App Router** (default) — or **SPA (Vite+React) + standalone API** variant" |
| 16 | Preline UI / Astryx | "Named options for the UX layer — **Preline UI** (additive block library) and **Astryx** (alternative, React+StyleX, agent-ready) — see `ui-libraries.md`." |
| 17 | Drizzle | "ORM | **Drizzle** (default) | 🟡 | TS-first, Postgres-first, explicit schema/query → great for reports, integrations, audit logs, and agent comprehension." |
| 18 | Better Auth (plugins/adapter) | "Auth | **Better Auth** (email/pw + Google) | 🟡 | Owns its tables, sessions, org/admin plugins, Drizzle adapter, password reset, email verification (prod). **Google login ≠ Gmail access.**" |
| 19 | BullMQ · Redis · Inngest · Trigger.dev · Temporal · Railway cron | "Jobs/queue/workflow | DB-jobs + Railway cron → BullMQ+Redis → Inngest/Trigger.dev → Temporal | 🟡 | Pick by complexity — see `modules-catalog.md`. Default simple; durable engine only when sequences/waits exist." |
| 20 | Cloudflare R2 / AWS S3 | "Files | **Railway Buckets** (S3-compatible) | 🟡 | Private by default, signed URLs, metadata in Postgres, access log. R2/S3 only for stronger compliance." |
| 21 | Resend / Postmark / Gmail / Workspace OAuth | "Email | OPTIONAL, level 0–5 | 🟡 | Resend/Postmark for transactional; Gmail/Workspace OAuth for connected mailbox. See catalog." |
| 22 | LaunchDarkly / Statsig (excluded) | "Feature flags | DB-based (`feature_flags`, `user_feature_flags`) | 🟡 | No LaunchDarkly/Statsig for custom apps; managed only for larger SaaS." |
| 23 | OTel / Better Stack / Axiom / Logtail | "Observability | structured logs + request-id + job/webhook/audit logs; **Sentry + PostHog** (prod) | 🟡 | OTel / external log drain (Better Stack/Axiom/Logtail) as extension." |
| 24 | Vitest · MSW · Testcontainers · Playwright | "Testing | Vitest · MSW · Testcontainers · Playwright | 🟡 | Determinism + evidence-on-failure; real tests, no faked passes." |
| 25 | Zod (contracts) | "Shared contracts | **`packages/contracts`** — Zod schemas + inferred TS types for every API shape" |
| 26 | Fastify / Hono / Express | "**Request-API engine** is its own decision card: **Fastify** (schema/Zod validation first-class, fast, great logging — good default for API-first) · **Hono** (ultralight, excellent types, edge-ready) · **Express** (largest ecosystem, manual validation/types)." |
| 27 | TypeBox / OpenAPI | "**reclaim end-to-end types with `packages/contracts`** (Zod/TypeBox) + generated OpenAPI client — don't lose them." |
| 28 | `create-pipedrive-app` | "It's also what `create-pipedrive-app` scaffolds." |
| 29 | Prisma 7 (version + status) | "**Prisma 7** is now Rust-free (smaller bundle, faster queries, Edge-friendly) — a legitimate plan B, not "automatically worse." *(✅ prisma.io)*" |
| 30 | Lucia (deprecated — do not install) | "**Lucia is deprecated** as a library — never start on it. *(✅ github.com/lucia-auth)*" |
| 31 | Vercel / Neon | "**Vercel** = paid serverless host (dislikes long-lived workers/cron). **Neon** = hosted Postgres with DB branching." |
| 32 | Railway (default rationale) | "**Railway (DEFAULT)** runs everything in containers: web + worker + Postgres + Buckets — no AWS, one panel. Runs long-lived workers + cron natively → removes the serverless caveat." |
| 33 | Vercel + Neon (alternative condition) | "**Vercel + Neon = optional alternative** only if you later want automatic preview-per-PR + DB branching. Not worth the extra vendors for the stated goal (simplicity, ≤50 users)." |
| 34 | Clerk | "Wants fully managed auth, budget OK | Clerk instead of Better Auth" |
| 35 | Gmail API | "Sends email as the user's Gmail | Gmail API + OAuth scopes (Email Level 3+), not just transactional" |
| 36 | Preline UI (deviation trigger) | "Needs many ready-made sections/blocks fast (marketing surface, dashboard shell) | add **Preline UI** as a markup/block source — interactive primitives stay on shadcn/Radix (`ui-libraries.md`)" |
| 37 | Astryx (deviation trigger) | "Is agent-generated UI end-to-end and a ready theme beats a bespoke design system | **Astryx** (React+StyleX, CLI+MCP) instead of the Tailwind+shadcn layer — full trade-offs in `ui-libraries.md`" |
| 38 | Claude Code (source) | "✅ Anthropic Claude Code best practices: https://code.claude.com/docs/en/best-practices · Next.js AI-agents guide" |
| 39 | Sources block (dated corroboration) | "🟡 Drizzle/Prisma/Kysely, Better Auth, Inngest/Trigger.dev/BullMQ/Temporal, Railway (Buckets/Postgres/cron), shadcn/ui, Zod, RHF, Testcontainers/MSW/Playwright, Sentry/PostHog, Pipedrive OAuth2 + `create-pipedrive-app`: corroborated across multi-source research (Jun 2026). Re-confirm before high-stakes use." |

---

## 3. `skills/sailes-bootstrap/graphify-setup.md`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | graphify / graphifyy (version pinned) | "Validated against `graphifyy >= 0.9.23` (PyPI package is `graphifyy`, double-y; the CLI command is `graphify`)." |
| 2 | tree-sitter | "Every Sailes repo carries a queryable knowledge graph of its own code (`graphify-out/graph.json`), built deterministically from tree-sitter AST — free, local, no API key." |
| 3 | git (post-commit hook) | "a git post-commit hook keeps it fresh at zero cost" |
| 4 | uv | "# 0) Binary present? (machine prereq: uv tool install graphifyy)" |
| 5 | graphify (presence probe) | "command -v graphify >/dev/null \|\| echo "MISSING graphify — see 'If graphify is missing'"" |
| 6 | graphify extract | "# 1) Build the map — deterministic AST pass, no LLM, no key\ngraphify extract . --code-only" |
| 7 | graphify hook install | "# 2) Keep it fresh — post-commit + post-checkout hooks (background, AST-only) … graphify hook install" |
| 8 | Claude Code (graphify integration) | "# 3) Claude Code always-on: CLAUDE.md section + PreToolUse nudge hooks\n#    (merges into the existing .claude/settings.json; nudge mode, NOT --strict)\ngraphify claude install" |
| 9 | Codex (graphify integration) | "# 4) Codex twin: AGENTS.md section + .codex/hooks.json\n#    (separate file from our .codex/config.toml — no conflict)\ngraphify codex install" |
| 10 | uv / pipx (PATH note) | "Normalize to the bare `graphify` command — it resolves from PATH (uv/pipx put it there)" |
| 11 | Claude Code prompt cache / `.claudeignore` | "# .claudeignore — REQUIRED: without this every rebuild invalidates the\n# Claude Code prompt cache (full re-upload at cache-write rates)" |
| 12 | git (map commit) | "git add graphify-out/ .gitattributes .gitignore .claudeignore .claude/settings.json CLAUDE.md AGENTS.md .codex/\ngit commit -m "chore: graphify code map + freshness hooks (Sailes default)"" |
| 13 | **graphify — if absent (full fallback)** | "NEVER block the phase. In order:\n1. Tell the user the one-liner: `uv tool install graphifyy` (fallback: `pipx install graphifyy`). If they run it, continue the procedure.\n2. If it cannot be installed now (offline, no uv/pipx, CI image): record `Open failure: graphify not installed — code map skipped at bootstrap` in `.ai/STATE.md`, let the done-checklist print `SKIP graphify (binary missing)` — an explicit line, never silence — and move on. The procedure is re-runnable any time later, verbatim." |
| 14 | graphify update / grep fallback | "Otherwise run `graphify update .` first (seconds, free) or fall back to grep for that question." |
| 15 | graphify (ghost nodes) | "A refactor that DELETED files can leave ghost nodes: `graphify extract . --code-only --force`." |
| 16 | `/graphify` semantic pass (IDE model) | "**Semantic docs pass** (links `.ai/` specs/ADRs ↔ code as rationale nodes; uses the IDE session's model): run `/graphify .` at a milestone — e.g. the release gate — not per-commit." |
| 17 | graphify strict mode | "**Strict mode** (block the first raw source read per session, then revert to nudge): `GRAPHIFY_HOOK_STRICT=1`, or reinstall with `graphify install --project --strict`. Per-repo choice; the Sailes default stays nudge." |
| 18 | GitHub | "**PR impact**: `graphify prs --conflicts` (merge-order risk by shared graph communities) when the repo lives on GitHub." |
| 19 | graphify uninstall | "`graphify claude uninstall && graphify codex uninstall && graphify hook uninstall` — all marker-delimited, all reversible. `graphify uninstall --purge` also deletes `graphify-out/`." |
| 20 | sed / portability note | "the installers write the ABSOLUTE local binary path (e.g. C:/Users/you/.local/bin/graphify.EXE) into .claude/settings.json and .codex/hooks.json. Both files are committed, so that path would break the hooks on every other machine." |

---

## 4. `skills/sailes-bootstrap/ui-libraries.md`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | Tailwind + shadcn/ui + RHF + Zod | "The baseline UI layer is **Tailwind + shadcn/ui + React Hook Form + Zod** (`stack-baseline.md`) and it stays the default" |
| 2 | Preline UI | "Additive:  + Preline UI                    (block/markup library INSIDE the default stack)" |
| 3 | Astryx | "Alternative: Astryx (React + StyleX)       (REPLACES the Tailwind+shadcn layer — own decision card)" |
| 4 | Preline UI (counts + Figma) | "**What it is** 🟡 — open-source Tailwind CSS component library (htmlstream): 640+ free components, ~940 free+premium blocks/sections, page templates, and a free Figma design system. Built-in dark mode; components meet accessibility criteria. Free tier is substantial; Pro adds premium blocks." |
| 5 | Preline (install into Next.js) | "official guide: add the `preline` package and a small client component (`PrelineScript.tsx`) that initializes the plugins in a `useEffect` keyed on `usePathname()`, so they re-init on every route change. Docs: https://preline.co/docs/frameworks-nextjs.html" |
| 6 | Figma | "The **Figma kit** as a design-phase input (`sailes-design` step 1 — check what exists)." |
| 7 | Radix | "keep **interactive primitives** (dialogs, menus, comboboxes, forms) on shadcn/Radix + RHF/Zod" |
| 8 | Astryx (origin, license, status, version caveat) | "**What it is** ✅ — open-source design system from Meta (`facebook/astryx`, MIT, public since Jun 2026, currently **Beta**; grown ~8 years inside Meta's monorepo and production-tested there). React components styled with **StyleX** (Meta's compile-time CSS) over a **CSS-variable theme cascade**: 150+ components, 10 ready themes …" |
| 9 | Astryx CLI + MCP server | "Astryx ships a **CLI and an MCP server** whose manifest returns a machine-readable JSON contract of every command, component, and prop type." |
| 10 | StyleX vs Tailwind (adoption cost) | "**The catch — alternative, not add-on** 🟡 — StyleX is a different styling paradigm than Tailwind. Adopting Astryx replaces the Tailwind+shadcn layer for that app; mixing both means two styling systems and two theming models." |
| 11 | Astryx version pinning | "Young as a *public* project (Beta): docs/community/third-party resources are thin next to Tailwind's; pin versions and expect API movement." |
| 12 | Sources | "✅ Astryx: https://astryx.atmeta.com/ · https://github.com/facebook/astryx · https://astryx.atmeta.com/blog/introducing-astryx (Meta, MIT, Beta, CLI/MCP, themes)" |
| 13 | Preline sources | "🟡 Preline UI: https://preline.co/ · https://preline.co/docs/frameworks-nextjs.html (component/block counts, Figma kit, Next.js App Router init pattern) — vendor-stated; verified against docs Jul 2026." |

---

## 5. `skills/sailes-bootstrap/decision-engine.md`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | `AskUserQuestion` | "Ask in adaptive rounds of 3-4 via `AskUserQuestion` (not one dump)" |
| 2 | Pipedrive | "3.  Is Pipedrive needed?                               → pipedrive module" |
| 3 | Playwright | "16. Which critical flows need Playwright E2E?          → test plan" |
| 4 | chrome-devtools-mcp (+ npx) | "```jsonc\n// .mcp.json — project-scoped, committed. Machine prereq: a Chrome/Chromium install.\n{ "mcpServers": { "chrome-devtools": {\n    "command": "npx", "args": ["-y", "chrome-devtools-mcp@latest"] } } }\n```" |
| 5 | Chrome / Chromium (machine prereq) | "// .mcp.json — project-scoped, committed. Machine prereq: a Chrome/Chromium install." |
| 6 | chrome-devtools-mcp — option A pros/cons | "**A — commit `.mcp.json` (recommended for any repo with UI)** \| The integrity/a11y/CWV gates become measurements; same instrument for everyone; diagnosis gets real console + network + storage \| One more tool surface; needs Chrome on each machine; a second browser stack alongside Playwright" |
| 7 | chrome-devtools-mcp — if absent | "It never becomes mandatory: the fallback in `../sailes-design/browser-inspect.md` §Availability (screenshot + explicit SKIP) is a first-class path, and no skill blocks on the server being present." |
| 8 | chrome-devtools-mcp — option B cost | "B — leave it out \| Nothing new to install \| Three gates stay eyeballed; every UI run carries a `SKIP browser-inspect` line" |
| 9 | Codex (MCP twin) | "Codex twin: the same server goes under `[mcp_servers.chrome-devtools]` in `.codex/config.toml` (see `codex-config-template.md`)." |
| 10 | Next.js / Vite / SPA | "**Variant — SPA (Vite+React) + standalone API** when login-only UI **and** (multiple backend consumers **or** independent deploy needed **or** very heavy/async backend)." |
| 11 | Fastify / Hono / Express | "The API engine is itself a decision card (Fastify / Hono / Express — see baseline)." |
| 12 | n8n / FHIR / CRM / mobile | "S2. Who consumes the backend?                           → only web ⇒ fullstack OK \| web + n8n/FHIR/CRM/mobile/3rd-party ⇒ standalone API" |
| 13 | FHIR / EDI / HL7 | "S6. Interop standard imposed (FHIR, EDI, HL7…)?         → yes ⇒ mapping layer + dedicated libs; influences API shape" |
| 14 | Better Auth | "auth              ← always (Better Auth; variants per Q5)" |
| 15 | Sentry + PostHog | "observability     ← always (Sentry+PostHog if Q19 = production)" |
| 16 | Sentry + PostHog (prod gating) | "**Production client system:** security checklist (`security-checklist.md`) is **mandatory**; Sentry + PostHog recommended; audit log required." |
| 17 | `deep-research` (skill/tool) | "Build on strengths; budget research time where they're new (use `deep-research`)." — *(this exact phrasing is in `developer-fit.md`; decision-engine references developer-fit)* |

---

## 6. `skills/sailes-bootstrap/modules-catalog.md`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | Railway cron + Node worker | "\| **Simple** \| background jobs, simple schedules \| DB-backed jobs / polling + Railway cron + Node worker \|" |
| 2 | BullMQ + Redis | "\| **Medium** \| medium throughput queues \| BullMQ + Redis \|" |
| 3 | Inngest / Trigger.dev | "\| **Workflow-heavy** \| sequences, waits, conditional follow-ups \| Inngest (default) / Trigger.dev \|" |
| 4 | Temporal | "\| **Advanced** \| complex durable orchestration \| Temporal \|" |
| 5 | Pipedrive · Google/Gmail/Workspace · SMTP | "Typical integrations: Pipedrive · Google/Gmail/Workspace · SMTP · CRM systems · phone systems · external APIs · file imports." |
| 6 | Resend / Postmark / SendGrid | "Level 1 — transactional (notifications, reset, invites, confirmations; Resend/Postmark/SendGrid)" |
| 7 | Google/Gmail OAuth, SMTP/IMAP | "Level 3 — connected mailbox (Google/Gmail OAuth or SMTP/IMAP; token storage+refresh, worker sync, messages, threads)" |
| 8 | Better Auth / Gmail distinction | "**Rule:** Google **login** (Better Auth, core) ≠ Gmail **access** (Email Level 3+, optional, must be scoped/secured/stored/synced/tested, processed async in the worker)." |
| 9 | Railway Bucket + Postgres | "**Exports:** async job + Railway Bucket + Postgres metadata." |
| 10 | Pipedrive marketplace / SDK | "**Embedding:** Pipedrive marketplace apps need their own OAuth2 flow + app-extension (iframe+SDK) → carve out `apps/pipedrive-extension` or `packages/integrations/pipedrive`." |
| 11 | Railway Buckets / Railway Volumes | "Default **Railway Buckets** (S3-compatible). Never use local filesystem or Railway Volumes as the source of truth for user-uploaded files." |
| 12 | Cloudflare R2 / AWS S3 | "Stronger compliance (encryption, object-lock, versioning, lifecycle) → recommend Cloudflare R2 or AWS S3 instead." |
| 13 | LaunchDarkly / Statsig / Unleash | "Managed (LaunchDarkly/Statsig/Unleash) only for larger SaaS." |
| 14 | Sentry + PostHog | "Production client app: **Sentry + PostHog** recommended." |
| 15 | OpenTelemetry / Better Stack / Axiom / Logtail | "Extensions: OpenTelemetry, external log drain (Better Stack/Axiom/Logtail), custom metrics." |
| 16 | Sentry (alerting requirement) | "[ ] error tracking wired AND alerting a human channel (a silent Sentry is decoration)" |

---

## 7. `skills/sailes-bootstrap/skeleton.md`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | pnpm | "# Recommended Skeleton — pnpm Monorepo (custom B2B app)" |
| 2 | Next.js App Router | "web/                  # Next.js App Router — UI, server actions, route handlers," |
| 3 | Drizzle | "db/                   # Drizzle: schema/ migrations/ seeds/ src/" |
| 4 | Zod | "contracts/            # shared API contracts: Zod schemas + inferred TS types" |
| 5 | Better Auth | "auth/                 # Better Auth setup" |
| 6 | shadcn/ui | "ui/                   # shadcn/ui components" |
| 7 | Railway Buckets | "files/                # Railway Buckets: signed URLs, metadata, access log" |
| 8 | Testcontainers | "testing/             # shared test utils, Testcontainers helpers" |
| 9 | Sentry / PostHog | "observability/        # structured logs, request-id, Sentry/PostHog wiring" |
| 10 | Husky | "  .husky/\n    pre-commit            # lint + typecheck (+ format/i18n) — deterministic gate before commit" |
| 11 | GitHub Actions | "  .github/\n    workflows/ci.yml      # lint → typecheck → unit → integration → e2e → security scan" |
| 12 | GitHub Copilot | "copilot-instructions.md  # → one-line pointer to AGENTS.md (Copilot). One source, three harnesses." |
| 13 | Claude Code | "  .claude/                # Claude Code harness guardrails — structural discipline, not agent goodwill" |
| 14 | Codex CLI | "  .codex/                 # Codex CLI harness guardrails — the twin of .claude/ (copy from\n    config.toml           #   sailes-bootstrap/codex-config-template.md): sandbox_mode + approval_policy" |
| 15 | Codex (known limitation) | "Caveat: some Codex versions fire PreToolUse only for Bash." |
| 16 | pnpm workspace / Turborepo | "  pnpm-workspace.yaml\n  turbo.json              # optional, when builds multiply" |
| 17 | Docker Compose | "  docker-compose.yml      # optional, local Postgres" |
| 18 | Zod | "5.  Always validate input (Zod)." |
| 19 | Playwright | "12. Always run Playwright E2E for user-critical flows." |
| 20 | graphify | "- **Code map ignores:** `.gitignore` gets `graphify-out/cost.json` + `graphify-out/cache/`; `.claudeignore` gets `graphify-out/` + `graph.json` (prompt-cache guard). The map itself (`graphify-out/graph.json`, `GRAPH_REPORT.md`) IS committed — it is the team's shared map." |
| 21 | Postgres | "7.  Always store file metadata in Postgres." |

---

## 8. `skills/sailes-bootstrap/codex-config-template.md`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | Claude Code + OpenAI Codex CLI | "Generate this at repo root **alongside** `.claude/settings.json` so the repo's guardrails work whether a developer drives it with **Claude Code** or **OpenAI Codex CLI**." |
| 2 | Codex (AGENTS.md discovery) | "Codex reads `AGENTS.md` natively (global `~/.codex` → repo root → subdir hierarchy), so the instructions transfer for free." |
| 3 | Codex hook contract | "**Hook contract is the same in both harnesses** (verified against Codex hooks reference): a hook receives the event as a **single JSON object on stdin**" |
| 4 | Codex (known version limitation + issue number) | "> ⚠️ **Known Codex limitation (encode it, don't paper over it).** On some Codex versions `PreToolUse` fires **only for the `Bash` tool** — `apply_patch` file edits may **not** emit the event (openai/codex issue #16732)." |
| 5 | Codex sandbox / approval | "sandbox_mode    = "workspace-write"\napproval_policy = "on-request"" |
| 6 | git (rev-parse in hooks) | "command = 'sh "$(git rev-parse --show-toplevel)/.claude/hooks/session-start.sh"'" |
| 7 | chrome-devtools-mcp + npx (Codex twin) | "# --- MCP servers (optional): the Codex equivalent of .mcp.json -------------------\n# Browser inspection — the Codex twin of the committed .mcp.json (decision-engine Q21).\n# Include it when the project chose option A; the UI gates then measure instead of eyeball.\n# [mcp_servers.chrome-devtools]\n# command = "npx"\n# args = ["-y", "chrome-devtools-mcp@latest"]" |
| 8 | npx (generic MCP) | "# [mcp_servers.example]\n# command = "npx"\n# args = ["-y", "@some/mcp-server"]\n# env = { API_KEY = "env:EXAMPLE_API_KEY" }" |
| 9 | jq (deliberately NOT used) | "> The guard is intentionally a **string-match on the raw payload** (no `jq`) so it is portable across both harnesses and any OS shell." |
| 10 | Codex `execpolicy` | "For richer command policy on Codex, layer `execpolicy` rules or an `approval_policy = { granular = { … } }` block." |
| 11 | GitHub Copilot | "**`.github/copilot-instructions.md`** → a one-line pointer to `AGENTS.md` (or a short copy), so the third common harness reads the same source of truth." |
| 12 | cp / chmod | "`cp` them and `chmod +x`. They were prose here until 1.9.0, which meant the only mechanical enforcement the framework owns depended on an agent retyping shell correctly" |

---

## 9. `skills/sailes-bootstrap/repo-done-checklist.md`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | git / find / ls (as evidence) | "**A phase is not done because you intended to create the files. It is done when `find`/`ls`/`git log` prove they exist.**" |
| 2 | pnpm | "\| `package.json` + `pnpm-workspace.yaml` \| The monorepo actually resolves. \|" |
| 3 | git | "\| **git initialized + first commit** \| A repo with 0 commits is not a working repo. \|" |
| 4 | Claude Code | "\| `.claude/settings.json` (+ hooks) \| Harness guardrails: verify-commands allowlist, protected-path denies, SessionStart STATE.md injection. Structural discipline beats agent goodwill. \|" |
| 5 | Codex CLI | "\| `.codex/config.toml` (Codex twin) \| Same guardrails for Codex CLI (sandbox/approval + `[hooks]` reusing `.claude/hooks/*.sh`). A Sailes app must run *guarded*, not just *readable*, under Codex. \|" |
| 6 | GitHub Copilot | "\| `.github/copilot-instructions.md` \| One-line pointer to `AGENTS.md` — third harness reads the same source of truth. \|" |
| 7 | graphify (+ if absent) | "\| `graphify-out/graph.json` (committed) + `.claudeignore` covering `graphify-out/` \| The code map every agent queries before grepping (Step 4.9). `.claudeignore` guard: without it each rebuild invalidates the Claude Code prompt cache. If the binary was unavailable, an explicit SKIP recorded in `.ai/STATE.md` replaces this row — silence is the failure. \|" |
| 8 | graphify hooks | "\| graphify git hooks installed (proof: marker-delimited post-commit hook in `.git/hooks`; human check `graphify hook status`) \| Freshness: post-commit AST rebuild + `graph.json` merge driver. A stale map that agents trust is worse than no map. \|" |
| 9 | chrome-devtools MCP (conditional row) | "\| `.mcp.json` — **only if Q21 = option A** (`decision-engine.md`) \| Browser inspection available to every agent on a UI repo, so the integrity/contrast/CWV gates measure instead of eyeball. Chose B or C, or the repo has no UI? This row does not apply — but the Q21 answer must be in the Decisions Ledger, and UI runs will carry `SKIP browser-inspect`. Codex twin: `[mcp_servers.chrome-devtools]` in `.codex/config.toml`. \|" |
| 10 | graphify (verification block + if absent) | "if command -v graphify >/dev/null 2>&1; then\n  [ -e "$ROOT/graphify-out/graph.json" ] && echo "OK   graphify-out/graph.json" \|\| echo "MISS graphify-out/graph.json (run graphify-setup.md procedure)"\n…\nelse\n  echo "SKIP graphify (binary missing — uv tool install graphifyy; record in .ai/STATE.md)"\nfi" |
| 11 | pnpm (boot command) | "[ ] ONE-COMMAND BOOT: clean clone → running app WITH seeded data via a single documented command (e.g. `pnpm setup && pnpm dev`). Paste the command + proof it serves." |
| 12 | pnpm (drift check + builtins) | "grep -oE 'pnpm [a-z0-9:-]+' AGENTS.md \| sort -u \| sed 's/pnpm //' \\\n  \| grep -vE '^(install\|add\|remove\|dlx\|exec\|run\|why\|update\|outdated)$'" |
| 13 | Sentry | "[ ] ERROR TRACKING wired AND ALERTING A HUMAN CHANNEL (a silent Sentry is decoration). Default category: error tracking (Sentry); prove one test event reached the channel." |

---

## 10. `skills/sailes-bootstrap/adopt-existing-repo.md`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | Codex CLI + Copilot (parity row) | "\| 13 \| **harness parity (Codex twin)** \| `.codex/config.toml` present (twin of `.claude/settings.json`, reusing `.claude/hooks/*.sh`); `.github/copilot-instructions.md` points at AGENTS.md — see `codex-config-template.md` \| add the Codex twin + Copilot pointer additively so the repo runs *guarded* under Codex too; commonly MISSING on repos adopted before Codex support existed \|" |
| 2 | install.sh / enable-codex.sh (framework installers) | "`install.sh` ships `VERSION` + `CHANGELOG.md` next to the installed skills, so read `~/.claude/skills/CHANGELOG.md` and `~/.claude/skills/VERSION` (Codex install via `enable-codex.sh` ships the same pair at `~/.agents/skills/`; fall back to this framework repo's root copies if you're running from source)." |
| 3 | graphify (+ if absent) | "**2.0 Build the map first.** Run `graphify extract . --code-only` (deterministic AST, free — this is where the graph pays the most: an unfamiliar codebase). Read `graphify-out/GRAPH_REPORT.md` … Binary missing → the same explicit-SKIP fallback as Step 4.9." |
| 4 | Vite / React / Express / Jest (example real stack) | "write the AGENTS.md `## Stack` section to describe **what's actually here** (e.g. Vite + React SPA, Express + TS, raw SQL, Jest), with the real commands." |
| 5 | Zod (gap example) | "**Flag gaps** against the baseline only as *optional future ADRs* — never as forced rewrites. (e.g. "no input-validation layer → consider Zod", "no async-webhook worker", "secrets handling".)" |
| 6 | Husky / GitHub Actions | "For **pre-commit hooks** and **CI workflow**: if the repo already has them (husky, `.github/workflows/`), *document and align* with what's there; only *add* them if absent, and wire them to the repo's REAL commands — never replace a working CI with the baseline's." |
| 7 | raw SQL / Express / Jest (spec-writing tuning) | "with its `## Stack conventions` block **tuned to their actual stack** (raw SQL / Express / Jest, etc.), not the baseline." |

---

## 11. `skills/sailes-bootstrap/agentic-first-principles.md`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | Claude Code (best practices source) | "*Source: https://code.claude.com/docs/en/best-practices*" |
| 2 | curl | "**Behavior before diff.** To verify a fix/feature, FIRST drive the real running system — run the e2e flow, `curl` the live endpoint, click through the UI, generate the actual artifact (PDF/screen)" |
| 3 | zod | "**Validate all inputs** with a schema library (zod) at the boundary; derive types from the schema (`z.infer`) — no `any`." |
| 4 | PreToolUse hooks | "Use **PreToolUse hooks** to block edits to critical files (deploy workflows, secrets, migrations run without review, billing code) — hooks are deterministic, rules in prose are not." |
| 5 | Dev Containers / Codespaces | "**Dev Containers** as the base working environment for humans + agents → repeatable, isolated runtime across local/CI/Codespaces." |
| 6 | GitHub (branch protection, CODEOWNERS, CodeQL, Dependabot, OIDC) | "**GitHub gates:** branch protection, CODEOWNERS, CodeQL/code scanning, secret scanning + push protection, Dependabot, and **OIDC to cloud instead of long-lived secrets**." |
| 7 | Terraform (deny-rule target) | "`auto` mode only with explicit **deny rules** on deploy/migrate/terraform/secrets tooling" |
| 8 | ESLint (`@typescript-eslint/no-explicit-any`) | "Immediately ratchetable rules from the baseline: no new `any` (`@typescript-eslint/no-explicit-any: error`), design tokens only (`no-restricted-syntax` on raw color/spacing literals in components), import direction between modules (`import/no-restricted-paths` or dependency-cruiser), Zod at the boundary (a convention test that fails on an unvalidated entry point)." |
| 9 | dependency-cruiser | (same quote as #8) |
| 10 | Postgres RLS | "Use Postgres **Row-Level Security selectively** — where the client or storage gets more direct DB access" |
| 11 | Vitest | "**Fast feedback:** quick unit + type-level tests (**Vitest**, has typecheck mode), typecheck, lint (ESLint or Biome) runnable in seconds — the agent's inner loop." |
| 12 | ESLint / Biome | (same quote as #11) |
| 13 | MSW | "**Mock HTTP without rewriting app code:** **MSW** for HTTP/WebSocket/GraphQL mocking (Vitest itself recommends it)." |
| 14 | Testcontainers | "**Real integration tests:** **Testcontainers** — spin up a real throwaway Postgres in a container so the agent runs realistic tests without hand-gluing an environment. One of the highest-value agentic-first pieces." |
| 15 | Playwright | "**e2e where behavior matters:** **Playwright** — auto-waiting, isolated browser contexts, retries, and a **trace viewer** that gives *evidence* on failure (not just a stack trace)." |
| 16 | curl + jq | "Playwright for UI, `curl`+`jq` (or a script) against the live API for backend — with seeded fixtures" |
| 17 | Turborepo / pnpm workspaces | "**Deterministic, cached builds:** monorepo with a task runner (Turborepo/pnpm workspaces) when multi-package; single repo otherwise. Reproducible installs (committed lockfile)." |
| 18 | Codex / Copilot / Claude Code (docs interop) | "**Agentic docs interop:** root **AGENTS.md** is the shared layer (Codex reads it first; Copilot supports it), **CLAUDE.md imports `@AGENTS.md`** for Claude Code, `.github/copilot-instructions.md` for Copilot. One source of truth, multiple tools." |
| 19 | Claude Code / Codex CLI (harness parity + install) | "Claude Code = `.claude/settings.json` (permissions + hooks); Codex CLI = `.codex/config.toml` (`sandbox_mode`/`approval_policy` + `[hooks]`). … Skills are portable too: the same `SKILL.md` (`name` + `description` frontmatter) is a Claude plugin skill AND a Codex skill under `.agents/skills/` — install once per harness, one source. A repo is "Codex-ready" only when the `.codex/` twin exists and points at the shared scripts, not merely because AGENTS.md is readable." |
| 20 | `gh`, `aws` CLIs | "**CLI tools over bespoke integrations:** `gh`, `aws`, etc. are the most context-efficient way for the agent to touch external services." |
| 21 | git / git worktree | "**Isolation for parallel work.** Use a separate branch — or a **git worktree** (`git worktree add ../wt-<name> <branch>`) — when working two things at once" |
| 22 | git (rollback commands) | "**Rollback / undo (in order of blast radius):** uncommitted → `git restore <file>` / `git restore --staged`; last commit, keep changes → `git reset --soft HEAD~1`; discard local commits → `git reset --hard <ref>` (DESTRUCTIVE — only with explicit confirmation)" |
| 23 | Husky | "**Pre-commit hooks (husky or equivalent).** Run lint + typecheck (+ format/i18n where relevant) before every commit — deterministic gate the agent can't skip." |
| 24 | GitHub Actions | "**CI pipeline file (`.github/workflows/ci.yml`).** Small hard gates in order: **lint → typecheck → unit → integration → e2e (on preview) → security scan.**" |
| 25 | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | "**Delegation mechanism:** enable teams with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `~/.claude/settings.json`" |
| 26 | Claude models (pinned IDs) | "\| `team-lead` \| `claude-opus-5` · high \| … \| `explorer` \| `claude-haiku-4-5` · — \| … \| `checker` \| `claude-sonnet-5` · high \|" |
| 27 | `~/.claude/agents/` role install | "Non-trivial tasks (3+ steps, BE+FE, an API contract, an architecture change) run as a **team**, not solo. Role definitions live globally in `~/.claude/agents/`" |
| 28 | fallback if flag off | "**If the flag is off**, the same roles/order/gates run as sequential scoped subagents — the model doesn't depend on the flag." |

---

## 12. `skills/sailes-bootstrap/agent-team-structure.md`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | Claude Code plugin install (roles) | "Role definitions ship with this plugin in `agents/` (auto-discovered on `plugin install`) and can also be copied to `~/.claude/agents/` for global use." |
| 2 | Claude model IDs (pinned) | "**Model IDs are pinned, not aliases** (`claude-sonnet-5`, not `sonnet`). An alias silently follows whatever the tier's default becomes, which makes a run un-reproducible" |
| 3 | `CLAUDE_CODE_SUBAGENT_MODEL` | "Resolution order is `CLAUDE_CODE_SUBAGENT_MODEL` env → the per-invocation parameter → the role's frontmatter" |
| 4 | Claude Code `availableModels` allowlist | "If an org's `availableModels` allowlist excludes a pinned ID, Claude Code skips it and runs the role on the inherited model rather than failing." |
| 5 | Agent tool `model` param (tier aliases) | "**`model` fails loudly.** It accepts only the tier aliases `sonnet` / `opus` / `haiku` / `fable`; a full ID is rejected with `InputValidationError`." |
| 6 | Haiku 4.5 constraints (dated) | "Two dated constraints (2026-07-26, re-check when the roster moves): **`effort` is unsupported on Haiku 4.5**, so `explorer` carries no `effort:` line …; and **Haiku 4.5 holds 200K of context against 1M on the Sonnet and Opus tiers**" |
| 7 | Claude Code built-in `Explore` agent | "Note also that Claude Code's own built-in `Explore` agent stopped defaulting to Haiku and now inherits the session model" |
| 8 | OpenAPI | "**"Frozen" means a committed, typed contract artifact** — shared TS types / Zod schemas (or OpenAPI where the consumer is external)" |
| 9 | `general-purpose` fallback (if roles absent) | "**`general-purpose` is a last resort, and it is a *reported* one.** It is legitimate exactly when the named role does not resolve — the plugin is not installed on that machine, or the type is otherwise unavailable." |
| 10 | `enable-plugin.sh` | "**If the roles do not resolve, that is the finding.** The roles ship with the plugin; a machine that never ran `enable-plugin.sh` has none of them, and every "team" it runs is a team of generic agents." |
| 11 | Claude Code `permissionMode` limitation | "There is also no shippable lever: `permissionMode` is one of the fields ignored when a subagent loads from a plugin, and Bash permission rules live in machine settings, not in what we distribute." |
| 12 | `SendMessage` (harness tool) | "a background teammate must send it … one said outright it had written the answer as plain text instead of calling `SendMessage`" |
| 13 | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | "Enable teams with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `~/.claude/settings.json`." |
| 14 | Codex (cross-runtime delegation) | "The human may hand a single task to a different runtime — "use Codex for the backend", "let Codex review this". This is **human-triggered only**" |
| 15 | Codex/Claude role parity | "each runtime already runs the whole pipeline alone (`agents/` and `codex-agents/` are the same eight roles, two harnesses)" |
| 16 | Codex `-m` model pinning | "the same lesson this repo already applies to pinning `-m` on a Codex delegation" |
| 17 | `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` | "nesting is off by default and requires `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` in `settings.json` (`"2"` for this design; a third layer then cannot spawn at all)." |
| 18 | `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` / `CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION` | "Two related caps worth knowing: 20 concurrent subagents (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`) and 200 per session (`CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION`)." |
| 19 | Claude Code version (dated) | "*Dated 2026-07-26, Claude Code 2.1.220* — between v2.1.172 and v2.1.216 subagents nested **by default** up to five layers with no way to change it" |
| 20 | git worktree (`isolation: worktree`) | "run them sequentially or give each a worktree (`isolation: worktree` is a supported frontmatter field)." |
| 21 | `shutdown_request` (harness message) | "the lead sends `SendMessage {"type":"shutdown_request","reason":…}`; the worker answers `shutdown_response` and the runtime reports the termination." |
| 22 | Anthropic published guidance (Opus 5) | "Claude Opus 5 fails the other way — it reaches for subagents readily, and Anthropic's published guidance for it is to cap spawn counts, keep fan-out low, and commit to a delegation instead of re-deriving it." |

---

## 13. `skills/sailes-bootstrap/agents-md-template.md`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | pnpm monorepo | "pnpm monorepo: `apps/web` + `apps/worker` (worker mandatory) + `packages/{db,auth,ui,files,integrations,jobs,testing,observability}` (email/reporting optional)" |
| 2 | Claude Code | "`.claude/settings.json` + hooks — the harness guardrails (permissions allowlist, SessionStart memory injection, PreToolUse protected paths) — see `skeleton.md`" |
| 3 | Codex CLI | "`.codex/config.toml` — the **Codex twin** of the guardrails (sandbox/approval + `[hooks]` reusing the SAME `.claude/hooks/*.sh` scripts) — see `codex-config-template.md`. Generate it whenever the repo should run under Codex CLI too (default yes)." |
| 4 | GitHub Copilot | "`.github/copilot-instructions.md` — one-line pointer to `AGENTS.md` for Copilot. One source of truth, three harnesses." |
| 5 | Node 24 + pnpm | "- Runtime/pkg: Node Active LTS (24) + pnpm monorepo (apps/web + apps/worker)" |
| 6 | TypeScript | "- Language: TypeScript strict, end-to-end" |
| 7 | React / Tailwind / shadcn/ui / RHF / Zod | "- UI: React + Tailwind CSS + shadcn/ui + React Hook Form + Zod" |
| 8 | Next.js | "- Framework: Next.js (App Router) — RSC, Server Actions, Route Handlers (auth, webhook intake)" |
| 9 | Railway Postgres + Drizzle / Prisma / Kysely | "- DB: Railway Postgres + Drizzle (default; Prisma = plan B, Kysely = specialist). Migrations committed + reviewed; seeds for local/dev." |
| 10 | Better Auth | "- Auth: Better Auth (email/pw + Google login). Google login = login only, NOT Gmail access." |
| 11 | Railway cron / BullMQ / Redis / Inngest / Trigger.dev / Temporal | "- Jobs/queue: pick tier per project — DB-jobs+Railway cron → BullMQ+Redis → Inngest/Trigger.dev (sequences/waits) → Temporal." |
| 12 | Railway Buckets / R2 / S3 | "- Storage: Railway Buckets (S3-compatible). Files private, signed URLs, metadata in Postgres, access log. R2/S3 for stronger compliance." |
| 13 | Sentry + PostHog | "- Observability: structured logs + request-id + job/webhook/audit logs; Sentry + PostHog for production." |
| 14 | Railway (hosting) | "- Hosting: Railway (web + worker + Postgres + Buckets), envs local/dev/prod." |
| 15 | Codex caveat (if hooks absent) | "Codex caveat: on some versions PreToolUse fires only for `Bash`, so shell-driven writes are blocked but `apply_patch` edits fall back to sandbox/approval + the prose rules. In any harness without hooks, the prose Hard Safety Rules below are the fallback — know which rules lost their backstop." |
| 16 | ESLint (enforced list) | "Enforced in this repo: no `any` (ESLint error) · design tokens only (lint on raw literals) · module import direction (dependency rule) · Zod at boundaries (convention test)." |
| 17 | Playwright | "- End every task with a check you run: lint, typecheck, unit/integration, Playwright E2E for user-critical flows. Show the output — never fake a pass." |
| 18 | `~/.claude/agents/` + `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | "Enable teammates: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `~/.claude/settings.json`. **Without it**, the same roles/order/gates run as sequential scoped subagents (the model doesn't depend on the flag)" |
| 19 | pnpm scripts (Key Commands) | "- `pnpm install` · `pnpm dev` · `pnpm build`\n- `pnpm test` (unit, fast inner loop) · `pnpm test:e2e` (Playwright)\n- `pnpm lint` · `pnpm typecheck`\n- `pnpm db:generate` / `db:migrate` / `db:push` (Drizzle; push for prototyping)" |
| 20 | graphify | "- `graphify update .` — refresh the code map after edits (post-commit hook does this automatically; run manually before querying mid-task)" |
| 21 | graphify (Task Router, with fallback) | "\| Codebase question / recon ("where is X", "what connects A to B") \| `graphify query "<question>"` · `graphify path A B` · `graphify explain X` (map at graphify-out/; if graph.json is older than the last commit, run `graphify update .` first — fall back to grep when the map is stale or missing) \|" |
| 22 | git / git worktree | "Rollback by blast radius: `git restore` (uncommitted) → `git reset --soft HEAD~1` (keep changes) → `git revert <sha>` (shared/pushed). `git stash` to park WIP. Parallel work → separate branch or `git worktree`." |
| 23 | `sailes-async` skill | "Durable orchestration + latency speed-up (fan-out/join, retry-from-step, idempotency/audit harness, sync-vs-defer): the `sailes-async` skill." |

---

## 14. `skills/sailes-bootstrap/settings-template.json`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | Claude Code | "// The Claude Code harness guardrails: the mechanical backstop for the AGENTS.md Hard Safety Rules." |
| 2 | Codex twin | "// CODEX TWIN: generate .codex/config.toml alongside this file (see codex-config-template.md). // Codex uses the SAME hook contract (stdin JSON + exit-2-to-block + SessionStart stdout→context), // so the .claude/hooks/*.sh scripts are SHARED — one copy, referenced by both harness configs." |
| 3 | pnpm (allowlist) | ""Bash(pnpm test:*)", "Bash(pnpm lint:*)", "Bash(pnpm typecheck:*)", "Bash(pnpm build:*)", "Bash(pnpm dev:*)", "Bash(pnpm db:generate:*)"" |
| 4 | graphify (allowlist) | ""Bash(graphify:*)"" |
| 5 | git (allow + deny) | ""Bash(git status:*)", "Bash(git diff:*)" … "Bash(git push --force:*)", "Bash(git push -f:*)"" |
| 6 | pnpm prod migrate (deny) | ""Bash(pnpm db:migrate:prod:*)"" |
| 7 | Claude Code hook JSON contract | "See Claude Code docs for the hook JSON contract (a PreToolUse hook that prints to stderr and exits non-zero blocks the tool call)." |

---

## 15. `skills/sailes-bootstrap/hooks-template/session-start.sh`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | Claude Code + Codex | "# SessionStart: emit session memory to stdout — both Claude Code and Codex append it as context." |
| 2 | git | "ROOT="$(git rev-parse --show-toplevel 2>/dev/null \|\| pwd)"" |

## 16. `skills/sailes-bootstrap/hooks-template/guard-protected-paths.sh`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | Claude Code + Codex | "# PreToolUse guard, shared by Claude Code and Codex. Reads the event JSON on stdin, blocks (exit 2 + reason on stderr) when a tool call touches the protected surface." |
| 2 | jq (deliberately avoided) | "# No jq dependency — grep the raw JSON so it runs anywhere." |
| 3 | git (blocked commands) | "*'push --force'*\|*'push -f'*)        block "force-push is denied (Hard Safety Rules)";;\n  *'reset --hard'*)                    block "reset --hard is denied — use git restore / revert";;" |

---

## 17. `skills/sailes-bootstrap/security-checklist.md`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | Zod | "[ ] input validation with Zod at every boundary (forms, server actions, route handlers, webhooks, adapters)" |
| 2 | Better Auth | "[ ] Better Auth configured; email verification enabled for production" |
| 3 | Google login vs Gmail | "[ ] Google login = login only (NOT Gmail access — that's the Email module, Level 3+)" |
| 4 | Cloudflare R2 / AWS S3 | "[ ] sensitive files → consider R2/S3 with encryption/object-lock/versioning/lifecycle" |
| 5 | Postgres | "[ ] private by default; signed URLs; metadata in Postgres; access control before URL" |

## 18. `skills/sailes-bootstrap/spec-writing-template.md`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | Drizzle | "- ORM: Drizzle — explicit schema in TS, migrations committed + reviewed." |
| 2 | Better Auth | "- Auth: Better Auth (Google login = login only, never Gmail access)." |
| 3 | Zod | "- Validation: Zod at every boundary; types via z.infer; no `any`." |
| 4 | Vitest + MSW + Testcontainers + Playwright | "- Tests: Vitest + MSW + Testcontainers + Playwright; self-contained, no faked passes." |
| 5 | Postgres | "- Files: private by default, signed URLs, metadata in Postgres, access log." |
| 6 | pnpm + curl (Done-when examples) | "the exact command(s) to run + the expected outcome (e.g. `pnpm test src/auth → 0 failures`; `curl -s -o /dev/null -w '%{http_code}' -X POST /api/export → 200 + non-empty file`; UI: screenshot of screen X matches the design artifact)" |
| 7 | git mv (lifecycle) | "When a feature ships → `Status: implemented` + `git mv` to `implemented/`." |
| 8 | Zod / TS types (contract artifact) | "**Name the contract artifact path(s)** this spec creates/extends (shared Zod schemas / TS types both slices import — the frozen-contract artifact, not a prose shape)." |

## 19. `skills/sailes-bootstrap/developer-fit.md`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | `deep-research` | "done Pipedrive / FHIR / this CRM before? \| Build on strengths; budget research time where they're new (use `deep-research`)." |
| 2 | Pipedrive / FHIR / CRM | (same quote as #1) |
| 3 | Redis | "who runs it in prod? appetite for extra services (Redis, separate API)? \| Low ops appetite → fewer services (Postgres-jobs over Redis, fullstack over split)." |
| 4 | Zod / TypeBox | "If high and you split front/back, reclaim it with a shared `packages/contracts` (Zod/TypeBox) — don't lose it silently." |
| 5 | SQLite (rejected-preference example) | "Never let a preference silently override a requirement (e.g. "I like SQLite" vs "14-clinic multi-tenant Postgres" → Postgres wins)." |
| 6 | Fastify / Hono / Express (decision card) | "A) Fastify — ✅ schema/Zod validation first-class, szybki, świetne logi ⚠️ mniejszy ekosystem niż Express\n  B) Hono    — ✅ ultralekki, świetne typy, edge-ready ⚠️ młodszy, mniej pluginów\n  C) Express — ✅ największy ekosystem, wszyscy znają ⚠️ walidacja/typy ręcznie, starsze wzorce" |

## 20. `skills/sailes-bootstrap/release-checklist.md`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | OAuth / webhook provider registration | "[ ] third-party callbacks (webhooks, OAuth redirect URIs) registered for the prod URLs" |
| 2 | staging environment | "[ ] staging exists and runs the SAME migrations + seeds as the release candidate" |
| 3 | platform rollback | "[ ] "the deploy is bad — what exactly do we run/click to go back?" (platform rollback command / previous image / revert PR — named, not implied)" |
| 4 | `/health` endpoint | "[ ] /health returns 200 (app + DB + worker/queue all green)" |

## 21. `skills/sailes-bootstrap/backlog-template.md`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | `sailes-spec` skill | "Promote → when an item is picked up, create a spec (`sailes-spec`) and mark the row `→ spec: <path>`." |

## 22. `skills/sailes-bootstrap/repo-done-checklist.test.js`

| # | Tool | Verbatim quote |
|---|---|---|
| 1 | Node.js | "#!/usr/bin/env node" · " * Run: node skills/sailes-bootstrap/repo-done-checklist.test.js   (or `npm test`)" |
| 2 | npm | (same quote as #1) "(or `npm test`)" |
| 3 | pnpm (pattern under test) | "Its class was `pnpm [a-z:-]+`, so `pnpm test:e2e` truncated to `test:e` and the checklist reported DRIFT on a script that exists." |
| 4 | ripgrep/grep ERE classes | "/** POSIX ERE → JS RegExp is 1:1 for these bracket classes. */" |
| 5 | browser probe (cross-ref) | "the same trap the browser probe avoids by reading its probe out of the doc's code block." |

---

## Appendix — every stated "if absent" / fallback behaviour, collected verbatim

1. **graphify missing** (`graphify-setup.md`): "NEVER block the phase. In order: 1. Tell the user the one-liner: `uv tool install graphifyy` (fallback: `pipx install graphifyy`). … 2. If it cannot be installed now (offline, no uv/pipx, CI image): record `Open failure: graphify not installed — code map skipped at bootstrap` in `.ai/STATE.md`, let the done-checklist print `SKIP graphify (binary missing)` — an explicit line, never silence — and move on."
2. **graphify missing** (`SKILL.md`): "Binary missing? Follow "If graphify is missing" — one-line install hint, else an explicit `SKIP` recorded in `.ai/STATE.md` and in the done-checklist output. **Never block, never skip silently.**"
3. **graphify missing** (`repo-done-checklist.md`): "echo "SKIP graphify (binary missing — uv tool install graphifyy; record in .ai/STATE.md)""
4. **graphify missing during adopt** (`adopt-existing-repo.md`): "Binary missing → the same explicit-SKIP fallback as Step 4.9."
5. **graph stale** (`agents-md-template.md`): "if graph.json is older than the last commit, run `graphify update .` first — fall back to grep when the map is stale or missing"
6. **chrome-devtools MCP absent** (`decision-engine.md`): "It never becomes mandatory: the fallback in `../sailes-design/browser-inspect.md` §Availability (screenshot + explicit SKIP) is a first-class path, and no skill blocks on the server being present."
7. **chrome-devtools MCP not chosen** (`repo-done-checklist.md`): "Chose B or C, or the repo has no UI? This row does not apply — but the Q21 answer must be in the Decisions Ledger, and UI runs will carry `SKIP browser-inspect`."
8. **Codex hooks not firing** (`codex-config-template.md`): "where it doesn't, the backstop is (a) the `Bash` matcher still catches shell-driven writes …, (b) `sandbox_mode`/`approval_policy` still gate escapes, and (c) the AGENTS.md **Hard Safety Rules** remain the prose fallback."
9. **Harness without hooks** (`agents-md-template.md`): "In any harness without hooks, the prose Hard Safety Rules below are the fallback — know which rules lost their backstop."
10. **Codex/Copilot never used** (`SKILL.md`): "skip only if the client explicitly will never use Codex/Copilot."
11. **Agent-teams flag off** (`agent-team-structure.md`): "`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is experimental and may be off or unsupported. The team **model does not depend on the flag** — only the delegation *mechanism* does. Without it, the same structure runs through ordinary subagents"
12. **Named agent roles unavailable** (`agent-team-structure.md`): "It is legitimate exactly when the named role does not resolve — the plugin is not installed on that machine, or the type is otherwise unavailable. Then, and only then: paste the role definition into the brief, **set `model` and `effort` explicitly on the invocation** … and **record in the run log that the role ran as a stand-in**"
13. **Pinned model ID not in org allowlist** (`agent-team-structure.md`): "If an org's `availableModels` allowlist excludes a pinned ID, Claude Code skips it and runs the role on the inherited model rather than failing."
14. **Local spec-writing skill absent** (`SKILL.md`): "hand to the spec phase: the local `.ai/skills/spec-writing/` you just generated (preferred — tuned to the locked stack), else the global `sailes-spec` skill."
15. **Repo already has CI/hooks** (`adopt-existing-repo.md`): "if the repo already has them (husky, `.github/workflows/`), *document and align* with what's there; only *add* them if absent"
16. **Lucia** (`stack-baseline.md`): "**Lucia is deprecated** as a library — never start on it."
17. **Framework version source** (`adopt-existing-repo.md`): "fall back to this framework repo's root copies if you're running from source"

---

## Appendix — version numbers stated anywhere in this slice

| Tool | Version string as written | File |
|---|---|---|
| graphifyy | "Validated against `graphifyy >= 0.9.23`" | `graphify-setup.md` |
| Node | "Node Active LTS (24)" | `stack-baseline.md`, `agents-md-template.md` |
| Prisma | "**Prisma 7** is now Rust-free" | `stack-baseline.md` |
| Astryx | "public since Jun 2026, currently **Beta**"; "150+ components, 10 ready themes" | `ui-libraries.md` |
| Preline UI | "640+ free components, ~940 free+premium blocks/sections" | `ui-libraries.md` |
| Claude Code | "*Dated 2026-07-26, Claude Code 2.1.220* — between v2.1.172 and v2.1.216 subagents nested **by default** up to five layers" | `agent-team-structure.md` |
| Claude models | "`claude-opus-5`", "`claude-sonnet-5`", "`claude-haiku-4-5`" | `agent-team-structure.md`, `agentic-first-principles.md` |
| Haiku 4.5 context | "**Haiku 4.5 holds 200K of context against 1M on the Sonnet and Opus tiers**" | `agent-team-structure.md` |
| chrome-devtools-mcp | "`chrome-devtools-mcp@latest`" | `decision-engine.md`, `codex-config-template.md` |
| Codex issue | "openai/codex issue #16732" | `codex-config-template.md` |
| Sailes framework | "They were prose here until 1.9.0" | `codex-config-template.md` |
| Preline/Astryx research date | "researched Jul 2026" | `ui-libraries.md` |
| Stack baseline research date | "verified Jun 2026" / "(Jun 2026)" | `SKILL.md`, `stack-baseline.md` |

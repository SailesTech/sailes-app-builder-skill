# ARM-B — External tool dependencies of the sailes framework (`skills/` only)

**Question:** Which external tools does the sailes framework depend on, where is each one
referenced, what version constraints are stated, and what does the framework say to do when a
tool is absent?

**Scope:** `skills/` — 80 files across 15 skill directories plus `skills/README.md`.
Everything outside `skills/` (`.ai/`, `evals/`, `agents/`, root config) is out of scope and was
consulted **only** to resolve one gatherer contradiction (§4, C1).

**Method:** six subagents read the slice, five reading assigned directories in full and one running
a cross-cutting grep sweep as a check layer. Every load-bearing claim below — every version pin and
every absence rule — was then re-opened at source by me. Rows marked ✔ are ones I read myself in
this session; rows marked ○ are gatherer-reported and not independently re-opened (see §2).

**Definition used:** "external tool" = anything not shipped by this repo that the framework tells a
reader or agent to install, invoke, or depend on — CLI binaries, SaaS/platforms, MCP servers,
agent harnesses, runtimes, and named libraries/frameworks. Literature citations (arXiv, blog posts,
vendor docs URLs) are excluded. Standards and regulations (FHIR, HL7, EDI, GDPR) are excluded —
they are not tools.

---

## 1. The tools

### 1a. Tools with a stated absence / fallback rule

These are the load-bearing rows: the framework says what to do when the tool is not there. All
verified at source.

| Tool | Referenced in | Version constraint (verbatim) | What to do when absent (verbatim) | ✔ |
|---|---|---|---|---|
| **chrome-devtools MCP server** (`chrome-devtools-mcp`) | `skills/sailes-design/browser-inspect.md:5-6,38-64`; `skills/sailes-design/SKILL.md:76,101,112`; `skills/sailes-design/ux-rules.md:7`; `skills/sailes-bootstrap/decision-engine.md:32,38-58`; `skills/sailes-bootstrap/codex-config-template.md:85-90`; `skills/sailes-bootstrap/repo-done-checklist.md:29`; `skills/sailes-diagnose/diagnosis-loop.md:39-45`; `skills/sailes-diagnose/SKILL.md:226`; `skills/sailes-test/references/browser-e2e.md:84` | **Unpinned by design**: `npx -y chrome-devtools-mcp@latest` (`browser-inspect.md:44`; `decision-engine.md:44`; `codex-config-template.md:90`). Machine prereq: "a Chrome/Chromium install" (`decision-engine.md:42`) | "**If it is not installed:** fall back to the screenshot render (`SKILL.md` §Render and self-verify, step 1) and record `SKIP browser-inspect (chrome-devtools MCP absent)` in the artifact — the run log, the incident record, or the qa verdict. An unmeasured gate reported as passed is the failure; an explicit SKIP is not." (`browser-inspect.md:54-57`). Reinforced: "It never becomes mandatory: the fallback in `../sailes-design/browser-inspect.md` §Availability (screenshot + explicit SKIP) is a first-class path, and no skill blocks on the server being present." (`decision-engine.md:55-57`). In diagnose the fallback is a different tool: "Absent it, a Playwright script with `page.on('console')` and `page.on('response')` produces the same evidence for more setup; either way the evidence log is what matters, not the tool." (`diagnosis-loop.md:43-45`) | ✔ |
| **Chrome / Chromium (browser binary)** | `skills/sailes-design/browser-inspect.md:44-47`; `skills/sailes-bootstrap/decision-engine.md:42` | Probe last validated against "Chromium 150 / Edge 150.0.4078.96, headless, 1254×690" (`browser-inspect.md:146-147`) — a validation record, **not** a minimum | "No Chrome Stable on the machine? Point it at a dedicated browser instead of installing one: `npx -y @puppeteer/browsers install chrome@stable --path ~/.cache/puppeteer` ...then add `--executablePath \"<printed path>\"` to the args above." (`browser-inspect.md:45-47`) | ✔ |
| **graphify** (CLI; PyPI package `graphifyy`) | `skills/sailes-bootstrap/graphify-setup.md` (whole file); `skills/sailes-bootstrap/SKILL.md:92-94,137`; `skills/sailes-bootstrap/repo-done-checklist.md:27`; `skills/sailes-bootstrap/adopt-existing-repo.md:82-90`; `skills/sailes-bootstrap/agents-md-template.md:110,153`; `skills/sailes-diagnose/probe-patterns.md:125-132`; `skills/sailes-pre-implement/SKILL.md:44-48`; `skills/README.md:37,39`; `skills/sailes-migrate/SKILL.md:67,69`; `skills/sailes-migrate/methodology.md:24-25` | "Validated against `graphifyy >= 0.9.23` (PyPI package is `graphifyy`, double-y; the CLI command is `graphify`)." (`graphify-setup.md:6-7`) | Three-tier, explicit: "NEVER block the phase. In order: 1. Tell the user the one-liner: `uv tool install graphifyy` (fallback: `pipx install graphifyy`). If they run it, continue the procedure. 2. If it cannot be installed now (offline, no uv/pipx, CI image): record `Open failure: graphify not installed — code map skipped at bootstrap` in `.ai/STATE.md`, let the done-checklist print `SKIP graphify (binary missing)` — an explicit line, never silence — and move on." (`graphify-setup.md:68-76`). Detection: `command -v graphify >/dev/null \|\| echo "MISSING graphify — see 'If graphify is missing'"` (`graphify-setup.md:18`). Also a **staleness** rule: "Freshness check first (graphify-setup.md); a stale graph is not evidence." (`sailes-pre-implement/SKILL.md:48`) and "never build evidence on a stale graph" (`probe-patterns.md:131-132`) | ✔ |
| **uv** / **pipx** (Python tool installers) | `skills/sailes-bootstrap/graphify-setup.md:17,39,68-73` | none stated | pipx **is** graphify's stated fallback installer; if neither exists ("offline, no uv/pipx, CI image") the recorded-SKIP path above applies | ✔ |
| **Claude Code** (agent harness) | `skills/sailes-bootstrap/agent-team-structure.md:45-56,160-176,325-344`; `skills/sailes-bootstrap/codex-config-template.md`; `skills/sailes-bootstrap/settings-template.json`; `skills/sailes-bootstrap/hooks-template/*.sh`; `skills/sailes-bootstrap/agentic-first-principles.md:128-129`; `skills/README.md:3,72` | "*Dated 2026-07-26, Claude Code 2.1.220* — between v2.1.172 and v2.1.216 subagents nested **by default** up to five layers with no way to change it" (`agent-team-structure.md:328-330`). This is a **validation stamp + behavioural-drift warning**, not a minimum-version requirement | Model-pin degradation: "If an org's `availableModels` allowlist excludes a pinned ID, Claude Code skips it and runs the role on the inherited model rather than failing." (`agent-team-structure.md:51-52`) | ✔ |
| **`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`** (Claude Code experimental mode) | `skills/sailes-bootstrap/agent-team-structure.md:335-344` | none stated | Full documented degrade path: "`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is experimental and may be off or unsupported. The team **model does not depend on the flag** — only the delegation *mechanism* does. Without it, the same structure runs through ordinary subagents... So the answer to \"will this work without the experimental mode?\" is **yes** — degraded to sequential subagents, but with the same roles, order, gates, and lifecycle." | ✔ |
| **The sailes agent-role plugin itself** (named subagent types) | `skills/sailes-bootstrap/agent-team-structure.md:164-173` | none stated | "**`general-purpose` is a last resort, and it is a *reported* one.** It is legitimate exactly when the named role does not resolve — the plugin is not installed on that machine, or the type is otherwise unavailable. Then, and only then: paste the role definition into the brief, **set `model` and `effort` explicitly on the invocation**... and **record in the run log that the role ran as a stand-in**". And: "**If the roles do not resolve, that is the finding.** ... a machine that never ran `enable-plugin.sh` has none of them, and every \"team\" it runs is a team of generic agents." | ✔ |
| **OpenAI Codex CLI** | `skills/sailes-bootstrap/codex-config-template.md` (whole file); `skills/sailes-bootstrap/agents-md-template.md:19,44`; `skills/sailes-bootstrap/skeleton.md:84-89`; `skills/sailes-bootstrap/SKILL.md:61,91-97`; `skills/sailes-bootstrap/agentic-first-principles.md:128-129`; `skills/sailes-migrate/SKILL.md:96`; `skills/sailes-migrate/parallel-translation.md:33` | No minimum version. A **version-dependent defect** is recorded instead: "On some Codex versions `PreToolUse` fires **only for the `Bash` tool** — `apply_patch` file edits may **not** emit the event (openai/codex issue #16732)." (`codex-config-template.md:30-32`) | Layered backstop, stated explicitly: "the backstop is (a) the `Bash` matcher still catches shell-driven writes..., (b) `sandbox_mode`/`approval_policy` still gate escapes, and (c) the AGENTS.md **Hard Safety Rules** remain the prose fallback. Do **not** claim file-edit protection is airtight under Codex — state the Bash-path is enforced and the edit-path is best-effort until your Codex version emits the event for `apply_patch`." (`codex-config-template.md:34-38`) | ✔ |
| **Deny-list guardrail** (`.claude/settings.json` + twin `.codex/config.toml`) | `skills/sailes-migrate/SKILL.md:96-99`; `skills/sailes-migrate/parallel-translation.md:32-38`; `skills/sailes-bootstrap/agentic-first-principles.md:129` | none stated | "**Jeśli deny-list nie jest zainstalowany, blokady nie działają** — zainstaluj go przed pilotem z Kroku 2." (`sailes-migrate/SKILL.md:98-99`). Sharper in the fan-out file: "**KRYTYCZNE:** jeśli deny-list **nie jest zainstalowany**, blokady nie działają — fan-out pobiegnie „nieuzbrojony". Zainstaluj przed pilotem (Krok 2)." (`parallel-translation.md:36-38`). Note this is a **block**, not a graceful degrade — the only "install it first" absence rule in the slice | ✔ |
| **jq** | `skills/sailes-bootstrap/agentic-first-principles.md:125`; `skills/sailes-bootstrap/codex-config-template.md:119`; `skills/sailes-bootstrap/hooks-template/guard-protected-paths.sh:5` | none stated | The dependency is **deliberately avoided**: "The guard is intentionally a **string-match on the raw payload** (no `jq`) so it is portable across both harnesses and any OS shell." (`codex-config-template.md:119`); "No jq dependency — grep the raw JSON so it runs anywhere." (`guard-protected-paths.sh:5`) | ✔ (script line ○) |
| **Railway CLI** (`@railway/cli`) | `skills/sailes-hosting/references/railway-topologia-i-cli.md:8-22,29-35,98-109`; `skills/sailes-hosting/references/wdrozenie-logi-gotchas.md:11,31-35`; `skills/sailes-hosting/references/monorepo-multi-serwis.md:78-91,106-116,202-214`; `skills/sailes-diagnose/probe-patterns.md:110-121`; `skills/sailes-diagnose/traps.md:172-177` | Install: `npm i -g @railway/cli` — no version pin. A **version-specific defect** is recorded: "zwraca `ServiceInstance not found` niezależnie od wersji CLI (potwierdzone 5.5.0 i 5.25.0)" (`monorepo-multi-serwis.md:107`) | Missing auth token: "W środowiskach headless/agentowych logowanie robi człowiek (`railway login`) — token siedzi w profilu. Jeśli sesja nie ma tokena, poproś użytkownika o `! railway login`." (`railway-topologia-i-cli.md:16-17`). Expiring session: "Dla trwałego użycia agentowego ustaw `RAILWAY_TOKEN` w scope **User/Machine**". Broken subcommand fallback: `gh repo edit owner/repo --default-branch dev` (`monorepo-multi-serwis.md:112`). Also a **warning, not a fallback**: "Railway `dev` holds production credentials." (`sailes-diagnose/traps.md:172-177`) | ✔ |
| **Railway Storage Bucket (S3)** | `skills/sailes-hosting/references/storage-postgres-bucket-volume.md:42-60`; `skills/sailes-hosting/SKILL.md:66,94-95`; `skills/sailes-bootstrap/stack-baseline.md:53,141` | none stated | "Jeśli Railway nie daje pewności co do EU → **plan B: Cloudflare R2** (S3-compatible, wybór regionu EU, te same `S3_*`)." (`storage-postgres-bucket-volume.md:58-60`) | ✔ |
| **Nixpacks / Railpack** (Railway builders) | `skills/sailes-hosting/SKILL.md:12,111-112`; `skills/sailes-hosting/references/monorepo-multi-serwis.md:13-25,87,99` | none stated | Pre-emptively rejected for the monorepo case: "dla monorepo pnpm na Railway domyślnie commituj `Dockerfile`" because "Nixpacks/Railpack wraca jak bumerang z tym samym błędem i nie ma na to pewnego obejścia" (`monorepo-multi-serwis.md:13,15`) | ○ |
| **Inngest (self-hosted)** | `skills/sailes-async/SKILL.md:18,60,113`; `skills/sailes-async/async-compendium.md:11,17,24`; `skills/sailes-async/lessons.md:4,13,17`; `skills/sailes-hosting/references/monorepo-multi-serwis.md:171-199`; `skills/sailes-bootstrap/stack-baseline.md:51`; `skills/README.md:60` | **Hard pin**: "Obraz **pinuj** (`inngest/inngest:v1.35.0`), nie `latest`." (`monorepo-multi-serwis.md:173`) | Two distinct rules. (a) Escape hatch: "**Keep the managed-cloud fallback explicitly open** as a documented ADR trigger (\"if self-hosting proves heavy, move to <engine> Cloud\") — SRF did." (`async-compendium.md:24`; also `SKILL.md:113`). (b) Hard prerequisites, no fallback: "Needs Postgres **+ Redis** to operate" (`async-compendium.md:11`); a non-hex signing key "crashuje serwer na boot" (`monorepo-multi-serwis.md:181-182`) | ✔ |
| **Make / n8n / Zapier** (the incumbent low-code platforms) | `skills/sailes-async/SKILL.md:3,10,18,29,51,117`; `skills/sailes-async/async-compendium.md:15,17,22,90`; `skills/sailes-async/speedup-recipe.md:3,33`; `skills/README.md:55` | none stated | Inverted — the framework says when **not** to leave them: "**Do NOT use when:** the flow is genuinely simple and low-volume (**keep it in Make/n8n** — a durable engine is operational overhead you'll regret)" (`sailes-async/SKILL.md:29`); "Building anything custom — if the flow is simple, low-volume, and has no hard harness requirement, **stay on Make/n8n**." (`async-compendium.md:22`) | ✔ |
| **Temporal** / **BullMQ** | `skills/sailes-async/SKILL.md:29,60`; `skills/sailes-async/async-compendium.md:12-13,20-21`; `skills/sailes-bootstrap/stack-baseline.md:51`; `skills/sailes-bootstrap/modules-catalog.md:20,22` | none stated | Both are described as *over*-reach rather than fallbacks: "Temporal — if you don't need replay + step-granular retry, it's a cluster you'll operate for nothing." / "BullMQ — *enough* if you only need job-level retry and no supervision dashboard; then a durable engine is over-engineering." (`async-compendium.md:20-21`) | ✔ |
| **Testcontainers** | `skills/sailes-test/references/external-systems.md:74-78`; `skills/sailes-database/SKILL.md:85`; `skills/sailes-database/db-compendium.md:153`; `skills/sailes-bootstrap/stack-baseline.md:58`; `skills/sailes-spec/SKILL.md:100` | none stated | Explicit limit on where it can substitute: "The line is sharp: Testcontainers solves infrastructure *you deploy*. There is no Pipedrive container." (`external-systems.md:77-78`). In-memory substitution is banned: "Postgres via Testcontainers, not SQLite; real Redis, not a map." | ✔ |
| **Third-party sandbox accounts / API credentials** (Pipedrive, Slack, Stripe et al.) | `skills/sailes-test/references/external-systems.md:52-56,79-81`; `skills/sailes-test/SKILL.md:77-79`; `skills/sailes-implement/SKILL.md:82` | none stated | "**Credentials come from the human.** An agent cannot create a sandbox account. If a behavior needs one and it is absent, it goes on the plan's `🔑` list and the behavior is **UNVERIFIED** — never mocked and reported as covered." (`external-systems.md:79-81`). Missing test infra escalates instead of being improvised: "If the repo has no test infrastructure at all — no runner, no fixtures, no seed path — report **`ENV-DEFECT`** with a concrete setup proposal for the human to approve. Do not stand it up yourself" (`sailes-test/SKILL.md:77-79`) | ✔ |
| **Pact** (contract testing) | `skills/sailes-test/references/external-systems.md:52-56` | none stated | Ruled out rather than fallen back on: "Pipedrive will not run your provider verification. Neither will Slack or Stripe. Do not plan for it." | ○ |
| **`anthropics/code-migration-kit-with-claude-code`** (+ its scripts `depmap_python.py`, `depmap_mjs`, `depmap_c_headers.py`, `make_manifest.py`, `queue_runner.mjs`, `build_daemon.sh`) | `skills/sailes-migrate/SKILL.md:22-27`; `skills/sailes-migrate/cost-and-gates.md:32-48`; `skills/sailes-migrate/parallel-translation.md:42-45`; `skills/sailes-migrate/methodology.md:24` | License, not version: "licencja **Apache-2.0, © 2026 Anthropic, PBC**" (`cost-and-gates.md:33-34`) | Not vendored by default: scripts "**żyją w tamtym repo**. Domyślnie: **referencja** — sklonuj kit obok repo migrowanego i użyj jego skryptów." Vendoring is "**decyzja człowieka, nie agenta.** Dopóki nie zapadnie — trzymamy referencję, nie kopię." (`cost-and-gates.md:38-48`) | ✔ |
| **husky / `.github/workflows/`** (pre-commit + CI) | `skills/sailes-bootstrap/adopt-existing-repo.md:113`; `skills/sailes-bootstrap/agentic-first-principles.md:152-153,169`; `skills/sailes-bootstrap/skeleton.md:61,64` | none stated | "if the repo already has them (husky, `.github/workflows/`), document and align with what's there; only add them if absent" (`adopt-existing-repo.md:113`); "husky or equivalent" (`agentic-first-principles.md:152`) | ○ |
| **`ui-ux-pro-max`** (design engine skill/CLI) | `skills/sailes-design/SKILL.md:52-56` | none stated | Purely conditional, no fallback needed: "If the `ui-ux-pro-max` skill/CLI is installed, you may seed the direction with its reasoning engine... Treat its output as **input to your judgment**, not the final answer" | ✔ |
| **PowerShell `Invoke-WebRequest`** | `skills/sailes-diagnose/traps.md:106` | none stated | Documented as *broken*, with a replacement: "PowerShell's `Invoke-WebRequest` **falsely 404s** against a Vite dev server — use `curl.exe`." | ○ |
| **`DATABASE_URL` vs `DATABASE_PUBLIC_URL`** (Railway Postgres access) | `skills/sailes-diagnose/probe-patterns.md:115-116` | none stated | "use **`DATABASE_PUBLIC_URL`**, not `DATABASE_URL` — the private hostname does not resolve from outside the platform's network" | ○ |
| **Prisma** | `skills/sailes-bootstrap/stack-baseline.md:98,102,106,137,154,158`; `skills/sailes-bootstrap/agents-md-template.md:57`; `skills/sailes-database/migration-prisma.md`; `skills/sailes-database/db-compendium.md:161`; `skills/sailes-discovery/SKILL.md:107` | "**Prisma 7** is now Rust-free (smaller bundle, faster queries, Edge-friendly) — a legitimate plan B, not \"automatically worse.\"" (`stack-baseline.md:106`); "Prisma 7 bez Rust. Plan B." (`db-compendium.md:161`) | Prisma *is* the fallback: "Use Prisma when: mostly fast CRUD, team wants a high-level ORM, SQL control matters less" (`stack-baseline.md:102`) | ✔ |
| **Kysely** | `skills/sailes-bootstrap/stack-baseline.md:103,138,158`; `skills/sailes-bootstrap/agents-md-template.md:57` | none stated | Specialist escalation: "Use Kysely when: query-heavy, very complex reports, max SQL control without raw SQL everywhere" (`stack-baseline.md:103`) | ✔ |
| **Lucia** (auth) | `skills/sailes-bootstrap/stack-baseline.md:107,155` | none stated | Hard prohibition, not a fallback: "**Lucia is deprecated** as a library — never start on it." | ✔ |
| **`pg_uuidv7`** (Postgres extension) | `skills/sailes-database/db-compendium.md:55,185`; `skills/sailes-database/decision-cards.md:23`; `skills/sailes-database/migration-drizzle.md:18` | "**PostgreSQL 18 ma natywny `uuidv7()`** (+ `uuid_extract_timestamp()`), wcześniej rozszerzenie `pg_uuidv7`." (`db-compendium.md:55`) | The extension **is** the pre-PG18 fallback; the decision card flags "wymaga PG18 lub rozszerzenia" as a cost of choosing UUIDv7 | ✔ |
| **supa_audit** (Postgres audit extension) | `skills/sailes-database/db-compendium.md:79-85` | "(Repo archiwalne 2025‑02, **v0.3.1**.)" — a staleness marker, not a requirement | Two escape rules: a scale limit — "maintainer odradza tracking na tabelach o szczycie zapisu **>3000 ops/s**"; and a named alternative — "**Alternatywa: pgAudit** — pisze do **logów Postgresa, nie do tabel**; bardziej niezawodne, ale ogromny wolumen logów + konfiguracja per-rola." | ✔ |
| **Atlas / Flyway / Liquibase / pgroll** (migration tooling) | `skills/sailes-database/db-compendium.md:165-167,255-268`; `skills/sailes-database/decision-cards.md:72-75` | none stated | Licensing / claim caveats rather than absence rules: Atlas — "lint wyszedł z darmowego planu w X.2025 — **sprawdź aktualny licensing**"; Flyway — "checks komercyjne (Teams skasowany V.2025)"; Liquibase — "policy checks tylko Pro"; pgroll — "⚠️ Obalone (1‑2)" | ✔ |
| **PgBouncer** | `skills/sailes-database/db-compendium.md:110` | none stated | Behavioural workaround: "zwykły `SET` przecieka między połączeniami w PgBouncer (transaction mode) → **użyj `SET LOCAL` / `set_config(…, true)`** w transakcji." | ○ |
| **Apps SDK** (`app-extensions-sdk`, self-hosted UMD) | `skills/sailes-pipedrive/SKILL.md:41-44`; `skills/sailes-pipedrive/references/custom-ui-panel.md:41-42,52-93`; `skills/sailes-pipedrive/assets/custom-ui-panel-template.html:140-146` | none stated. Not from npm: "Apps SDK jest **self-hostowany** jako UMD w `public/vendor/app-extensions-sdk.umd.js` (nie z npm)" (`SKILL.md:41-43`) | Silent abort if the SDK fails to load: `if(!window.AppExtensionsSDK) return;` (`assets/custom-ui-panel-template.html:141`); token-source fallback `?token=` when `GET_SIGNED_TOKEN` is unavailable (same file, ~110-116) | ○ |
| **Express** (in the Pipedrive stack) | `skills/sailes-pipedrive/SKILL.md:37-40` | n/a | Deliberate non-use, worth recording because it inverts an expectation: "serwer to **czysty Node `http`** ... — **bez Express**" | ✔ |

### 1b. Tools referenced with a version constraint but no absence rule

| Tool | Referenced in | Version constraint (verbatim) | ✔ |
|---|---|---|---|
| **Node.js** | `skills/sailes-bootstrap/stack-baseline.md:43`; `skills/sailes-bootstrap/agents-md-template.md:53`; `skills/sailes-hosting/references/monorepo-multi-serwis.md:31,286-289` | Two different values, see §4 D1: "Node Active LTS (24)" (baseline) vs `FROM node:22-slim` (hosting Dockerfile) | ✔ |
| **pnpm** | `skills/sailes-hosting/references/monorepo-multi-serwis.md:33`; `skills/sailes-bootstrap/stack-baseline.md:43`; and ~30 further call-sites across bootstrap/hosting | Exact pin in the Dockerfile recipe: `RUN corepack enable && corepack prepare pnpm@8.15.9 --activate`. Unpinned everywhere else | ✔ |
| **PostgreSQL** | `skills/sailes-database/SKILL.md:30`; `skills/sailes-database/migration-drizzle.md:44`; `skills/sailes-database/migration-sql-first.md:31`; `skills/sailes-database/migration-safety-checklist.md:10`; `skills/sailes-database/db-compendium.md:55,76,185` | Feature-gated, not a single minimum: "constant defaults PG11+, `SET NOT NULL` skip-scan PG12+, `CREATE STATISTICS` on expressions PG14+, native `uuidv7()` PG18+" (`SKILL.md:30`) | ✔ |
| **Tailwind CSS** | `skills/sailes-design/premium-craft.md:7`; `skills/sailes-design/assets/premium-tokens-starter.css:2`; `skills/sailes-bootstrap/stack-baseline.md:46`; `skills/sailes-bootstrap/ui-libraries.md` | "Tailwind v4 (CSS-first, `oklch()` tokens)" (`premium-craft.md:7`). Unversioned in `stack-baseline.md` | ✔ |
| **React** | `skills/sailes-design/premium-craft.md:7`; `skills/sailes-bootstrap/stack-baseline.md:46`; `skills/sailes-bootstrap/agents-md-template.md:55` | "shadcn/ui + React 19" (`premium-craft.md:7`). Unversioned in `stack-baseline.md` | ✔ |
| **Astryx** (Meta design system) | `skills/sailes-bootstrap/ui-libraries.md:50-72`; `skills/sailes-bootstrap/stack-baseline.md:46,147,157` | "`facebook/astryx`, MIT, public since Jun 2026, currently **Beta**" (`ui-libraries.md:51-53`), with the instruction "pin versions and expect API movement" (`ui-libraries.md:70-71`) | ✔ |
| **`temporal_tables`** (PG extension) | `skills/sailes-database/db-compendium.md:76`; `skills/sailes-database/decision-cards.md:64` | "Tylko system-period (nie application-period), **PG9.2+**, `tstzrange`." | ✔ |
| **MADR** (ADR format standard) | `skills/sailes-database/db-compendium.md:302` | "wersjonowany standard (**v4.0.0, 2024‑09**), warianty full/minimal/bare" | ✔ |
| **Pipedrive API** | `skills/sailes-pipedrive/SKILL.md:29-31`; `skills/sailes-pipedrive/references/api-i-custom-fields.md:3,16,69`; `skills/sailes-async/async-compendium.md:98`; `skills/sailes-async/lessons.md:15` | Fixed to v1: "API v1 — https://developers.pipedrive.com/docs/api/v1" (`SKILL.md:30-31`); behavioural pin "SRF: **Pipedrive v1** deal update is PUT; PATCH/POST 404" (`async-compendium.md:98`); measured "Live: PATCH 404 · PUT 200 · POST 404" (`lessons.md:15`) | ✔ |
| **Pipedrive app manifest** | `skills/sailes-pipedrive/references/manifest-oauth-rejestracja.md:16` | `schema_version: '1.0'` | ○ |
| **JWT / HS256** (Pipedrive signed token) | `skills/sailes-pipedrive/references/auth-acl.md:27,44` | "Algorytm to **HS256** (HMAC), nie RS256."; enforced in code: `if (header.alg !== 'HS256') return null;` | ○ |
| **TanStack Start + React Query** | `skills/sailes-design/premium-ux.md:7` | "Scope: B2B web on the Sailes baseline (TanStack Start + React Query + shadcn)." — see §4 D2, this contradicts the baseline's Next.js default | ✔ |

### 1c. Tools referenced with neither a version nor an absence rule

Named as defaults, options, or examples. Grouped for density; every name below was cited with at
least one file:line by a gatherer, and the group representatives were spot-checked.

| Group | Tools | Principal file(s) | ✔ |
|---|---|---|---|
| Hosting / infra | Railway (platform), Vercel, Neon, AWS, Cloudflare R2, AWS S3, Docker/Dockerfile, Docker Compose, corepack, Dev Containers, Turborepo | `skills/sailes-bootstrap/stack-baseline.md:124-142`; `skills/sailes-hosting/**`; `skills/sailes-bootstrap/agentic-first-principles.md:63,127`; `skills/sailes-discovery/SKILL.md:107,117` | ○ |
| Frontend | Next.js App Router, Vite, shadcn/ui, Radix, Preline UI, StyleX, React Hook Form, Lucide/Heroicons | `skills/sailes-bootstrap/stack-baseline.md:45-46`; `skills/sailes-bootstrap/ui-libraries.md`; `skills/sailes-design/ux-rules.md:3,48` | ○ |
| Backend | Fastify, Hono, Express, tsx, TypeScript (`tsc`), `pg` (node-postgres) | `skills/sailes-bootstrap/stack-baseline.md:84`; `skills/sailes-bootstrap/developer-fit.md:46-49`; `skills/sailes-hosting/references/monorepo-multi-serwis.md:18-21,197-198,232-233` | ○ |
| Data | Drizzle / drizzle-kit (the stated default ORM), node-pg-migrate, sqitch, golang-migrate, `strong_migrations`, pgAudit, Redis | `skills/sailes-database/**`; `skills/sailes-bootstrap/stack-baseline.md:48` | ✔ (Drizzle) |
| Auth | Better Auth (default), Clerk (managed alternative), Google/Workspace OAuth | `skills/sailes-bootstrap/stack-baseline.md:49,143`; `skills/sailes-spec/SKILL.md:96` | ✔ |
| Testing | Vitest, Playwright, MSW, Stryker (mutation testing), fast-check / Hypothesis, Zod / JSON-Schema | `skills/sailes-bootstrap/stack-baseline.md:58`; `skills/sailes-spec/SKILL.md:100`; `skills/sailes-test/SKILL.md:107,169`; `skills/sailes-test/references/techniques.md:87-89,143` | ✔ (Playwright) |
| Observability | Sentry, PostHog, OpenTelemetry, Better Stack / Axiom / Logtail, Slack (alerting) | `skills/sailes-bootstrap/stack-baseline.md:57`; `skills/sailes-bootstrap/modules-catalog.md:118`; `skills/sailes-async/harness-checklist.md:8,25-26` | ○ |
| Email / flags | Resend, Postmark, SendGrid, LaunchDarkly / Statsig / Unleash | `skills/sailes-bootstrap/modules-catalog.md:48,111`; `skills/sailes-bootstrap/stack-baseline.md:54,56` | ○ |
| Dev CLI | git (incl. `git worktree`), gh, aws, curl, sed, openssl, npm, npx, python, GitHub Actions | `skills/sailes-bootstrap/agentic-first-principles.md:125,130,137-143`; `skills/sailes-hosting/references/monorepo-multi-serwis.md:181,229`; passim | ✔ (`gh`/`aws`) |
| Agent tooling | AskUserQuestion, TeamCreate, GitHub Copilot, `superpowers:writing-skills` discipline | `skills/sailes-bootstrap/decision-engine.md:3`; `skills/sailes-discovery/SKILL.md:58,177`; `skills/sailes-bootstrap/agentic-first-principles.md:128`; `skills/README.md:78` | ✔ (README) |
| Docs / diagrams | Mermaid, `adr-tools`, Puppeteer, `@react-pdf` | `skills/sailes-database/db-compendium.md:178,303`; `skills/sailes-bootstrap/SKILL.md:48` | ○ |
| Integration targets (business, not framework deps) | Pipedrive, Google/Gmail, Kafka, OpenAI, Airtable, Medfile, Thulium, Supabase (named only as excluded) | `skills/sailes-async/speedup-recipe.md:35-47`; `skills/sailes-hosting/references/env-i-sekrety.md:44,70,82-86`; `skills/sailes-pipedrive/references/api-i-custom-fields.md:101` | ○ |

---

## 2. Confidence, and what could not be established

**High confidence (verified at source by me, this session):** every row in §1a and §1b marked ✔ —
each version string and each absence rule was re-read in the file. These are quotable.

**Medium confidence (single-gatherer, not re-opened):** rows marked ○. The line numbers come from
one gatherer's grep and were not independently re-run. The *existence* of these tools in the slice
is corroborated by the cross-cutting sweep in most cases; individual line numbers may be off by a
line or two where a gatherer cited a block rather than a line.

**Lower confidence — §1c line numbers.** For the "neither version nor absence rule" group I
verified representatives, not every entry. Treat §1c as an inventory, not as citable line
references.

### What could NOT be established

1. **Whether any of this is machine-enforced.** The slice states dependencies in prose. Nothing in
   `skills/` is a manifest — there is no `package.json`, lockfile, or dependency declaration inside
   `skills/`. Root-level manifests exist but are out of scope. So "the framework depends on X" is
   throughout a *documentary* claim, never a resolvable one.
2. **A single authoritative version list.** Version constraints are scattered across at least seven
   files and are of four different kinds — a real minimum (`graphifyy >= 0.9.23`, `PG12+`), an exact
   pin (`inngest:v1.35.0`, `pnpm@8.15.9`), a validation stamp ("validated against Claude Code
   2.1.220", "Chromium 150"), and a deliberate non-pin (`chrome-devtools-mcp@latest`). Nothing in
   `skills/` reconciles them or says which kind a given number is; I classified them by reading
   context.
3. **What "Node Active LTS (24)" resolves to at read time.** It is a rolling reference. Whether the
   parenthetical stays accurate is not established by anything in the slice.
4. **Which absence rules are actually exercised.** `skills/` states the rules; whether a run ever
   hit them (a real missing graphify, a real missing MCP) cannot be established from `skills/`.
5. **Whether the `general-purpose` stand-in path in `agent-team-structure.md:164-173` and the
   agent-teams-flag degrade at `:335-344` are the same mechanism or two.** The file describes both
   without cross-referencing them; I did not resolve the relationship.
6. **The Pipedrive Apps SDK version.** It is self-hosted as a vendored UMD file
   (`public/vendor/app-extensions-sdk.umd.js`) in a *consuming* repo, not this one — so no version
   is knowable from `skills/`.
7. **Completeness of §1c.** I am confident about §1a and §1b. For the long tail of one-mention
   library names, I cannot claim the list is exhaustive; a name mentioned once in prose in a file no
   gatherer flagged would not appear here.

---

## 3. Contradictions between gatherers, and how each was resolved

Resolved by opening the file, not by comparing confidence.

**C1 — "chrome-devtools-mcp 1.14.0 was broken, fixed in 1.14.1." FABRICATED ATTRIBUTION.**
The cross-cutting sweep agent reported `browser-inspect.md:168,175` as "specific
`chrome-devtools-mcp` tool versions (1.14.0 broken → 1.14.1 fixed)" and listed it as a version
constraint on the MCP server. The design/test/diagnose gatherer, reading the same file in full, did
**not** make that claim.
*Resolution:* I read `skills/sailes-design/browser-inspect.md:167-176`. The text is "1.14.0 shipped
this probe verified against the defect page only... Fixed in 1.14.1: `checkVisibility()`,
horizontal-only off-canvas..." — those are releases of **this repo's own probe**, not of the MCP
server. Confirmed outside the slice: `.claude-plugin/plugin.json` has `"version": "1.16.2"`,
`.ai/specs/implemented/2026-07-25-browser-devtools-instrument.md:6` reads "Framework-Version target:
1.14.0", and `.ai/STATE.md:33` names `VERSION` as the framework's own. The sweep agent invented the
attribution; the line numbers were real, the interpretation was not. **The MCP server has no version
constraint anywhere in `skills/` — it is explicitly `@latest`.** Removed from the version table.

**C2 — "codex-config-template.md:115 — version-gated behaviour change, unspecified tool, likely
Codex CLI." WRONG, same failure mode.**
*Resolution:* I read `skills/sailes-bootstrap/codex-config-template.md:110-122`. The sentence is
"They were prose here until 1.9.0, which meant the only mechanical enforcement the framework owns
depended on an agent retyping shell correctly" — the subject is the hook *scripts in this repo*, and
1.9.0 is this framework's own release. Not Codex. The sweep agent guessed a tool where the text
names none; it did at least flag it for follow-up. Excluded from the tool table.

**C3 — jq: dependency or not?** The bootstrap gatherer listed jq under "Package manager / runtime"
as a tool, while also quoting the "no jq dependency" line.
*Resolution:* I read `codex-config-template.md:119` and `hooks-template/guard-protected-paths.sh:5`.
jq is referenced **to be avoided** — the guard script deliberately string-matches raw JSON so it has
no jq dependency. It appears once as a generic example of an agent-friendly CLI
(`agentic-first-principles.md:125`). Recorded in §1a with the anti-dependency framing, not as a
dependency. Not a gatherer error, but the raw listing would have misled.

**C4 — Node version: 24 or 22?** The bootstrap gatherer reported "Node Active LTS (24)"; the
hosting gatherer reported `FROM node:22-slim`. Both looked like "the" Node constraint.
*Resolution:* both are correct and they are different files —
`skills/sailes-bootstrap/stack-baseline.md:43` and `skills/sailes-bootstrap/agents-md-template.md:53`
say "Node Active LTS (24)"; `skills/sailes-hosting/references/monorepo-multi-serwis.md:31` pins
`node:22-slim`. Verified both. Not a gatherer contradiction — a **real inconsistency in the repo**
(see §4 D1). The sweep agent independently caught it, which is what the check layer was for.

**C5 — Pipedrive API version.** No gatherer disagreed, but I checked because it was the sort of
thing that drifts: `skills/sailes-pipedrive/SKILL.md:30-31` says "API v1" and
`skills/sailes-async/async-compendium.md:98` says "Pipedrive v1". Consistent. No v2 reference exists
in the slice.

**C6 — chrome-devtools MCP fallback wording.** The design gatherer and the sweep agent quoted
slightly different fallback sentences and attributed both to `browser-inspect.md`.
*Resolution:* both quotes are real and live in **different files** —
`skills/sailes-design/browser-inspect.md:54-57` (the canonical statement) and
`skills/sailes-design/SKILL.md:76` (a condensed restatement), plus a third at
`skills/sailes-bootstrap/decision-engine.md:55-57`. Not a contradiction; the rule is stated three
times in near-identical language. Recorded all three.

**No gatherer returned empty, and no gatherer invented a file path.** Every path I spot-checked
existed and contained roughly what was claimed. The two failures (C1, C2) were both
*misattribution of a real string* — the version numbers were on the page, the tool they belonged to
was guessed. Both came from the grep-only agent, which is the expected failure mode for a check
layer that reads lines instead of documents.

---

## 4. Findings that fall out of the survey

**D1 — Node version drift, unresolved in the repo.** `stack-baseline.md:43` and
`agents-md-template.md:53` specify "Node Active LTS (24)"; the shipped Dockerfile recipe at
`monorepo-multi-serwis.md:31` pins `node:22-slim`. Different majors, no note reconciling them.

**D2 — Frontend baseline stated two ways.** `stack-baseline.md:45` makes **Next.js App Router** the
default framework (with an SPA+Vite variant). `skills/sailes-design/premium-ux.md:7` states "the
Sailes baseline (TanStack Start + React Query + shadcn)". TanStack Start appears nowhere in
`stack-baseline.md`. Verified both verbatim.

**D3 — Pinning discipline is inconsistent.** `inngest/inngest:v1.35.0` is pinned with an explicit
"nie `latest`", and `pnpm@8.15.9` is exact — while `chrome-devtools-mcp@latest` is unpinned in all
three places it appears. The MCP case is arguably deliberate (the tool is optional and has a
documented SKIP), but the contrast is not acknowledged anywhere in the slice.

**D4 — The absence-handling doctrine is genuinely uniform where it exists.** Two tools carry a
fully worked absence protocol — **chrome-devtools MCP** and **graphify** — and both use the same
shape: *documented fallback + an explicit `SKIP …` line recorded in an artifact, never silence*.
`browser-inspect.md:5-6` states it as policy: "everything below has a documented fallback, and its
absence is an explicit SKIP, never a silent one." Exactly one tool inverts this and **blocks**
instead: the migrate deny-list ("Jeśli deny-list nie jest zainstalowany, blokady nie działają —
zainstaluj go przed pilotem"). That asymmetry looks deliberate — a missing measurement degrades a
report, a missing guardrail degrades safety — but the slice never says so.

---

## 5. Run data

- **Subagents spawned:** 6, all in one message, all concurrent, all `Explore` (read-only) on Sonnet.
- **Slicing:** five by directory ownership, one cross-cutting.
  1. `sailes-bootstrap/` (21 files) — the largest and densest directory, given a slice of its own.
  2. `sailes-hosting/` + `sailes-pipedrive/` (14 files) — the two platform-integration skills.
  3. `sailes-database/` + `sailes-async/` (12 files) — the two infrastructure-choice skills.
  4. `sailes-test/` + `sailes-design/` + `sailes-diagnose/` (17 files) — the three skills that use
     browser/MCP tooling, where I expected the absence rules to concentrate. They did.
  5. `README.md` + `sailes-migrate/` + the seven remaining single-file skills (17 files).
  6. **Check layer** — no directory. Two greps across all 80 files: (A) version-shaped patterns,
     (B) absence/fallback language, each hit read with ±6 lines of context and judged
     tool-related or not. Its job was to catch what the readers missed and to be checkable against
     them. It did both — it independently found the Node drift (D1), and it produced both
     fabricated attributions (C1, C2).
- **Returned empty:** 0 of 6. Every slice had external-tool references; only two files in the whole
  slice had none (`skills/sailes-bootstrap/backlog-template.md`,
  `skills/sailes-design/design-judgment.md`), plus three template files where the gatherer's
  judgement is plausible but I did not verify (`sailes-discovery/brief-template.md`,
  `sailes-migrate/judge-setup.md`, `sailes-migrate/rulebook-template.md`).
- **Timing (corrected — see §6):** the only measured figures are two clock reads, **14:09:01**
  immediately before dispatch and **14:14:01** after verification: a **5:00 bracket** covering the
  fan-out *and* my four verification passes together. The "≈3 minutes for the gather / 14:12–14:14
  for verification" split originally written here was an **estimate, not a measurement** — I took no
  timestamp at the moment the subagents returned. Corrected rather than left standing, because this
  file is being read as measurement data.
- **Verification effort:** 4 batched `Bash` passes, ~30 file regions re-read. Every ✔ row in §1a
  and §1b, plus the two contradiction sites (C1, C2), plus one out-of-scope confirmation
  (`.claude-plugin/plugin.json`, `.ai/STATE.md`) needed to prove C1.
- **Cost of the check layer:** it produced the survey's only two wrong claims and one of its most
  useful findings. On this evidence a grep-only agent is worth running, but its output cannot be
  merged without opening the files it cites.

---

## 6. Run cost

Requested after the fact, as instrumentation. **Most of it is not visible to me.** Recorded as gaps
rather than estimates, because this section is being used as measurement data and a plausible
invented number here is worse than an absent one.

| Requested | Status | What I can actually say |
|---|---|---|
| **1. Tokens per subagent (and total)** | **NOT VISIBLE** | The `Agent` tool returned each subagent's report as text only. No usage, token-count, or cost metadata accompanied any of the six results, and I have no tool that queries a completed subagent's consumption after the fact. I cannot produce these numbers, not even approximately. |
| **2. My own token usage** | **NOT VISIBLE** | No field, tool, or system message in this session exposes my own context or cumulative token use. |
| **3. Wall-clock per subagent** | **NOT VISIBLE** | All six were dispatched in one message with `run_in_background: false` and returned as a single batch of six tool results, carrying no per-agent start/end timestamps. I did not clock each one individually, and I cannot reconstruct them from the batch. |

**The one timing figure that is genuinely measured:** two `date` calls I made myself —
**14:09:01** immediately before the dispatch message, **14:14:01** after my last verification pass.
That is a **5:00 total bracket for fan-out + verification combined**, and it is the only duration in
this document that came from a clock.

**Correction to §5.** As first written, §5 split that bracket into "≈3 minutes for the gather" and
"14:12–14:14 for verification". Those two figures were **inferred, not measured** — I took no
timestamp when the subagents returned. They have been struck from §5. Flagging it because this file
had already been handed over with an estimate presented in the same register as the measured value,
which is precisely the failure mode this follow-up is trying to avoid.

**Structural facts about the run that *are* established** (from my own dispatch, not from usage
telemetry): 6 subagents · all `Explore` (read-only) · all on Sonnet via explicit `model` override ·
one dispatch message, so all six ran concurrently · 0 returned empty · 5 slices by directory
ownership + 1 cross-cutting grep sweep · 80 files in scope. My own follow-up work was 4 batched
`Bash` verification passes over ~30 file regions.

**Where the real numbers live.** Per-agent token and duration data is recorded by the harness, not
by the agent — the session's own run records are the place to pull it from. I have not read those
records and am not going to characterize their contents or format sight-unseen; retrieving them is a
harness-side operation, not something this run can recover retrospectively.

**If this measurement matters for the A/B, it needs to be instrumented before the next run**, not
reconstructed after it: the cheap fix is a clock read immediately before dispatch and immediately
after the batch returns (which brackets the gather alone and would have made §5's split real), and
harness-side usage capture for anything token-denominated. Neither is recoverable for this run.

# ARM A — external-tool dependency findings (lead synthesises three handed-over recon slices)

**Question:** Which external tools does the sailes framework depend on, where is each referenced,
what version constraints are stated, and what does the framework say to do when a tool is absent?

**Verdict up front:** the framework has **exactly two hard external dependencies of its own**
(`graphifyy >= 0.9.23` and `typescript ^5.5.3`), **one optional instrument** (`chrome-devtools` MCP),
and **one runtime** (Node). Everything else in the ~150 named tools is either a *recommendation about
what to build with*, a *cited source*, or a *named anti-pattern*. The three explorers flattened that
distinction; recovering it is most of what this artifact adds.

Verification legend, applied per row:
**[V]** = I opened or grepped the source myself in this session (line numbers given).
**[R]** = reported by an explorer, quote internally consistent, **not** independently re-checked by me.

---

## 0. Method

**I was forbidden to spawn.** Zero subagents were launched. Every verification below is my own
Read/Grep/Bash against the repo.

**Effort split.** Roughly **35% reconciling** (reading three reports totalling ~1400 lines, de-duplicating
~150 tool mentions that appear across all three slices, and normalising three different table schemas)
and **65% verifying** — 14 targeted greps and 6 file reads against the repo, chosen by "what would be
easy to fabricate and expensive to be wrong about": version strings, install commands, absent-behaviour
clauses, and every claim whose provenance an explorer had hedged.

**The handed-over slicing left one gap and one blind spot, and no overlaps.**

- **No overlaps.** The three slices partition `skills/` cleanly: explorer-1 = `sailes-bootstrap/`,
  explorer-2 = `sailes-test/` + `sailes-design/` + `sailes-async/`, explorer-3 = everything else under
  `skills/`. Nothing was covered twice, so I had no cross-checks handed to me for free — which is itself
  a cost of this slicing: **no claim in the input arrived with independent corroboration.**
- **Gap 1 — a missed file.** Explorer-1 states "22 files, all read in full". `skills/sailes-bootstrap/`
  contains **23**. The missing file is **`skills/sailes-bootstrap/deciding-under-uncertainty.md`**.
  I read it myself. Material cost: near zero — it names no installable external tool (only the Agent
  tool's `effort` parameter and `grep`). But the coverage claim was false, and a reader trusting
  "all read in full" would not have known to check.
- **Gap 2 — the whole slicing stopped at `skills/`.** Nobody was assigned the repo root, `agents/`,
  `codex-agents/`, `hooks/`, `evals/`, `package.json`, or the installers. **That is where the only
  machine-readable dependency in the entire repo lives**, and where the tool declarations are actually
  *binding* rather than prose. I covered it myself; findings are marked **[GAP]** below.

---

## 1. The tools — grouped by what "depend on" actually means here

### Tier A — hard dependencies of the framework itself

| Tool | Referenced at | Version constraint | If absent |
|---|---|---|---|
| **graphify** (PyPI pkg `graphifyy`, CLI `graphify`) | `skills/sailes-bootstrap/graphify-setup.md:6,17,71,93,95,103` **[V]** · `skills/sailes-bootstrap/SKILL.md` (Step 4.9) **[R]** · `skills/sailes-bootstrap/repo-done-checklist.md:79` **[V]** · `skills/sailes-bootstrap/settings-template.json:28` (`"Bash(graphify:*)"`) **[V]** · `skills/sailes-bootstrap/adopt-existing-repo.md` **[R]** · `skills/sailes-bootstrap/agents-md-template.md` **[R]** · `skills/sailes-diagnose/probe-patterns.md` **[R]** · `skills/sailes-pre-implement/SKILL.md` **[R]** · `skills/sailes-migrate/SKILL.md`, `methodology.md` **[R]** · `skills/README.md` **[R]** · `README.md:168,171,174` **[V][GAP]** · **`agents/explorer.md:11-13,23-24`** **[V][GAP]** | **`graphifyy >= 0.9.23`** — `graphify-setup.md:6`. The **only stated `>=` floor on any tool in the repo.** **[V]** | Fully specified, three-step, and repeated in five places: (1) offer the one-liner `uv tool install graphifyy`, fallback `pipx install graphifyy`; (2) if it can't be installed, record `Open failure: graphify not installed — code map skipped at bootstrap` in `.ai/STATE.md`; (3) the done-checklist prints `SKIP graphify (binary missing …)`. **"NEVER block the phase … never silence."** `graphify-setup.md:71` **[V]**, `repo-done-checklist.md:79` **[V]**. Stale-graph variant: `graphify update .` first, **else fall back to grep** (`agents-md-template.md` **[R]**, `agents/explorer.md:13` **[V]**). |
| **`uv`** (and `pipx` as fallback) | `skills/sailes-bootstrap/graphify-setup.md:17,71` **[V]** · `README.md:174` **[V][GAP]** | none stated **[V]** | Named as the *reason* graphify may be unavailable ("offline, no uv/pipx, CI image") → same explicit-SKIP path. **[V]** |
| **TypeScript** | **`package.json:14`** — `"devDependencies": { "typescript": "^5.5.3" }`; `"build": "tsc"` **[V][GAP]** | **`^5.5.3`** — the **only npm-declared version constraint in the repo**, and **all three explorers missed it** because all three slices stopped at `skills/`. **[V]** | Not stated. `npm test` does not run `tsc`, so a missing/wrong TS only breaks `npm run build`. **[V]** |
| **Node.js** | `package.json:8` (every test is `node …`) **[V][GAP]** · `hooks/hooks.json:9,19` (both SessionStart hooks are `node "${CLAUDE_PLUGIN_ROOT}/hooks/…"`) **[V][GAP]** · `enable-plugin.sh:17-23` **[V][GAP]** · `skills/sailes-bootstrap/repo-done-checklist.test.js` **[R]** | For *generated apps*: **"Node Active LTS (24)"** — `skills/sailes-bootstrap/stack-baseline.md:43` **[V]**, `agents-md-template.md:53` **[V]**. For the *framework repo itself*: **no version stated anywhere.** **[V]** | Not stated. Hooks would silently fail. |
| **bash / POSIX shell** | `install.sh:14` (`set -euo pipefail`), `enable-plugin.sh`, `enable-codex.sh`, `skills/sailes-bootstrap/hooks-template/*.sh` **[V]** | none | Not stated. Windows twins exist (`enable-plugin.ps1`, `enable-codex.ps1`, `enable-codex-agents.ps1`). **[V][GAP]** |
| **git** | pervasive — `skills/sailes-bootstrap/SKILL.md` (`git init` mandatory), `repo-done-checklist.md`, `hooks-template/session-start.sh` (`git rev-parse --show-toplevel`), `settings-template.json:29-30,39-40` (allow `git status`/`git diff`; **deny** `git push --force`, `git push -f`) **[V]** · `skills/sailes-diagnose/diagnosis-loop.md` (`git bisect run`) **[R]** · `skills/sailes-hosting/references/wdrozenie-logi-gotchas.md` (`git ls-tree`) **[R]** | none | n/a — treated as universally present. |

**`jq` is a deliberate NON-dependency.** `skills/sailes-bootstrap/hooks-template/guard-protected-paths.sh`
— *"No jq dependency — grep the raw JSON so it runs anywhere"* — and `codex-config-template.md` repeats
the rationale (portability across both harnesses and any OS shell). **[R]**, consistent across two files
in the same slice. Worth listing because it is the framework explicitly *declining* a dependency.

---

### Tier B — optional instruments, each with an explicit stated absent-behaviour

This is where the framework's doctrine is sharpest and most consistent: **an unmeasured gate reported
as passed is the failure; an explicit `SKIP` is not.**

| Tool | Referenced at | Version constraint | If absent |
|---|---|---|---|
| **`chrome-devtools` MCP server** | `skills/sailes-design/browser-inspect.md:44,46,199,254` **[V]** (full tool list, `lighthouse_audit`, `axe-core`, `--browserUrl http://127.0.0.1:9222`, `handle_dialog`) · `skills/sailes-design/SKILL.md` **[R]** · `skills/sailes-design/premium-ux.md`, `ux-rules.md` **[R]** · `skills/sailes-test/references/browser-e2e.md` **[R]** · `skills/sailes-diagnose/SKILL.md`, `diagnosis-loop.md:61` **[V]** · `skills/sailes-bootstrap/decision-engine.md:44` **[V]** (Q21 `.mcp.json` decision card) · `codex-config-template.md:90` **[V]** (Codex twin) · `repo-done-checklist.md` **[R]** · **`agents/qa.md:6,16`** and **`agents/fe-dev.md:6,13,27`** **[V][GAP]** | Install pinned to **`chrome-devtools-mcp@latest`** — `browser-inspect.md:44`, `decision-engine.md:44`, `codex-config-template.md:90` **[V]**. Fixture last-run record: **Chromium 150 / Edge 150.0.4078.96**, `browser-inspect.md:147` **[V]** (a record, not a constraint). | Stated **six** times, always the same: **screenshot fallback + literal line `SKIP browser-inspect (chrome-devtools MCP absent)`**. `browser-inspect.md` §Availability **[R]**, `sailes-design/SKILL.md` (×3 incl. Common Mistakes + Quick Reference) **[R]**, `decision-engine.md` (*"It never becomes mandatory … no skill blocks on the server being present"*) **[R]**, `ux-rules.md` checklist **[R]**. Second, different fallback in `sailes-diagnose/diagnosis-loop.md`: *"Absent it, a Playwright script with `page.on('console')` and `page.on('response')` produces the same evidence for more setup"* **[R]**. **[GAP]** — the shipped binding is `agents/qa.md:16` and `agents/fe-dev.md:13`, which restate the SKIP requirement inside the role definitions the harness actually loads. **[V]** |
| **Chrome / Chromium / Edge (a browser binary)** | `skills/sailes-bootstrap/decision-engine.md:44` (*"Machine prereq: a Chrome/Chromium install"*) **[V]** · `skills/sailes-design/browser-inspect.md:46` **[V]** · **`evals/fixtures/browser-probe/run-probe.mjs:17-20,30-37`** **[V][GAP]** | **`chrome@stable`** via `npx -y @puppeteer/browsers install chrome@stable --path ~/.cache/puppeteer` — `browser-inspect.md:46` **[V]** | Two paths. Prose: install a dedicated browser and pass `--executablePath`. **And — the one place the doctrine is executable code rather than prose [GAP]:** `run-probe.mjs:19-20` — *"it needs a Chromium binary, and `npm test` must stay green on a machine that has none. **No browser found → it says so and exits 0 (a SKIP, never a silent pass).**"* with a 5-entry `CANDIDATES` probe list + `BROWSER_BIN` override at `:30-37`. **[V]** |
| **`ui-ux-pro-max` skill/CLI** (+ **python3**) | `skills/sailes-design/SKILL.md:52,54,55,117` **[V]** | none | Conditional on *"If the `ui-ux-pro-max` skill/CLI is installed"*; whole section is headed **"Optional"** (`:52`). Absent → simply skipped. Present → *"Treat its output as input to your judgment, not the final answer"*; Common Mistakes row at `:117` warns against copying it verbatim. **[V]** |
| **Agent-teams harness flags** — `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`, `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`, `CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION`, `CLAUDE_CODE_SUBAGENT_MODEL` | `skills/sailes-bootstrap/agent-team-structure.md:323,326,327` **[V]** · `agentic-first-principles.md` **[R]** · `agents-md-template.md` **[R]** | Dated **Claude Code 2.1.220** (`agent-team-structure.md:327`) **[V]**; caps 20 concurrent / 200 per session **[V]**; spawn depth `"2"` for this design **[R]** | *"The team **model** does not depend on the flag — only the delegation *mechanism* does. Without it, the same structure runs through ordinary subagents."* **[R]** |
| **Named agent roles** (`team-lead`, `explorer`, `designer`, `be-dev`, `fe-dev`, `tester`, `checker`, `qa`) | `agents/*.md` (8 role files) **[V][GAP]** · `codex-agents/*.toml` (8 twins) **[V][GAP]** · `skills/sailes-bootstrap/agent-team-structure.md:31-37` **[V]** · `agentic-first-principles.md:91-97` **[V]** | **Pinned model IDs, not aliases**: `claude-opus-5` (team-lead), `claude-haiku-4-5` (explorer), `claude-sonnet-5` (all others) — verified in **both** `agent-team-structure.md:31-37` and `agentic-first-principles.md:91-97` **and** in the shipped frontmatter (`agents/explorer.md:4`, `agents/qa.md:4`) **[V]** | Layered. (a) Roles unresolvable → `general-purpose` is *"a last resort, and it is a **reported** one"*; paste the role definition in, set `model`/`effort` explicitly, and record the stand-in in the run log **[R]**. (b) *"If the roles do not resolve, **that is the finding**"* — a machine that never ran `enable-plugin.sh` has none of them **[R]**. (c) Org `availableModels` excludes a pinned ID → *"Claude Code skips it and runs the role on the inherited model rather than failing"* **[R]**. (d) `effort` unsupported on Haiku 4.5, so `explorer` carries no `effort:` line — confirmed: `agents/explorer.md` has **no** `effort:` key while `agents/qa.md:5` has `effort: high` **[V]**. |
| **Anthropic code-migration kit** (`anthropics/code-migration-kit-with-claude-code`) | `skills/sailes-migrate/SKILL.md` · `cost-and-gates.md` · `parallel-translation.md` · `methodology.md` · `skills/README.md` **[R]** | **Apache-2.0, © 2026 Anthropic PBC** **[R]** | **Default = reference, not vendored:** *"sklonuj kit obok repo migrowanego i użyj jego skryptów."* Vendoring is legal under Apache-2.0 §4 but requires headers + `NOTICE` — **an explicit human licensing decision**, not an agent's. **[R]** |
| **deny-list guardrail** (`.claude/settings.json` + `.codex/config.toml` twin) | `skills/sailes-migrate/SKILL.md:98` **[V]** · `parallel-translation.md` **[R]** · `methodology.md` **[R]** | none | **The one place absence is fail-loud rather than fail-SKIP:** *"Jeśli deny-list nie jest zainstalowany, blokady nie działają — fan-out pobiegnie 'nieuzbrojony'. Zainstaluj przed pilotem (Krok 2)."* **[V]** Cross-cutting sibling: *"In any harness without hooks, the prose Hard Safety Rules below are the fallback — know which rules lost their backstop"* (`agents-md-template.md`) **[R]**. |
| **Test infrastructure** (runner / fixtures / seed path, unnamed) | `skills/sailes-test/SKILL.md:78` **[V]** | none | **Report `ENV-DEFECT` with a setup proposal — do NOT stand it up yourself**, because runner/fixture/seed are stack decisions owned by the human. **[V]** Same verdict word appears at `agent-team-structure.md:140`, `sailes-implement/SKILL.md:82`, `repo-done-checklist.md:104`, and in the shipped `agents/qa.md` "You never" block. **[V]** |
| **Sandbox accounts / credentials for third-party APIs** | `skills/sailes-test/references/external-systems.md` **[R]** | none | *"An agent cannot create a sandbox account. If a behavior needs one and it is absent, it goes on the plan's `🔑` list and the behavior is **UNVERIFIED** — never mocked and reported as covered."* **[R]** Hard-corroborated by `skills/sailes-hosting/references/monorepo-multi-serwis.md`: for Pipedrive / SendGrid / Airtable / Google Maps **"nie ma sandbox/staging dla żadnego z nich"** **[R]**. |
| **`railway login` session / `RAILWAY_TOKEN`** | `skills/sailes-hosting/references/railway-topologia-i-cli.md` · `monorepo-multi-serwis.md` **[R]** | Install: `npm i -g @railway/cli`, no version pin **[R]** | *"Jeśli sesja nie ma tokena, poproś użytkownika o `! railway login`"* — i.e. hand it to the human. Persistent agent use → `setx RAILWAY_TOKEN` at User/Machine scope. **[R]** |
| **Slack alert webhook** | `skills/sailes-async/SKILL.md`, `harness-checklist.md`, `skills/sailes-diagnose/SKILL.md`, `traps.md` **[R]** | none | **Boot-time config guard: "loudly error at startup if the alert webhook is unset/malformed", and test-fire before deploy.** Rationale given: *"a misconfigured webhook silently defeats 'alert on every failure' — the harness's own P0."* **[R]** Bootstrap's sibling rule: *"a silent Sentry is decoration"* (`repo-done-checklist.md`) **[R]**. |

---

### Tier C — the recommended build stack (what generated apps use; **not** framework dependencies)

Consolidated from all three slices. These appear as *recommendations with named alternatives*, and the
framework repeatedly says so: *"the baseline … is your **recommendation, not a decree**"*
(`sailes-bootstrap/SKILL.md`) and *"(If the repo locked a different stack, adapt this block to it)"*
(`sailes-spec/SKILL.md`) — the closest thing to a global "if absent" for this whole tier. **[R]**

| Area | Default | Named alternatives | Version constraint | Primary path |
|---|---|---|---|---|
| Runtime / pkg | Node Active LTS (**24**) · pnpm monorepo | — | **Node 24** **[V]**; Docker layer pins **`node:22-slim`** + **`pnpm@8.15.9`** (`sailes-hosting/references/monorepo-multi-serwis.md:31,33`) **[V]** — *note the 24-vs-22 mismatch, §3 below* | `sailes-bootstrap/stack-baseline.md:43` **[V]** |
| Language | TypeScript strict | — | none for apps | `stack-baseline.md` **[R]** |
| Framework | Next.js App Router | SPA (Vite + React) + standalone API | — | `stack-baseline.md` **[R]** |
| API engine | Fastify | Hono · Express | — | `stack-baseline.md`, `developer-fit.md`, `decision-engine.md` **[R]** |
| ORM | **Drizzle** (`drizzle-kit`) | Prisma (plan B) · Kysely (specialist) · node-pg-migrate · sqitch · Atlas · golang-migrate · Flyway · Liquibase · pgroll | **Prisma 7** (Rust-free) `stack-baseline.md:106` **[V]**; Atlas lint left the free plan **X.2025**; Flyway Teams cancelled **V.2025**; Liquibase policy checks Pro-only **[R]** | `sailes-database/SKILL.md`, `db-compendium.md:161` **[V]**, `decision-cards.md`, `migration-*.md` |
| Database | Railway Postgres | Neon (with Vercel) | **PG11+** constant defaults · **PG12+** `SET NOT NULL` skip-scan · **PG14+** `CREATE STATISTICS` on expressions · **PG18+** native `uuidv7()` · **PG9.2+** `temporal_tables` **[R]** | `sailes-database/SKILL.md`, `migration-safety-checklist.md` |
| PG extensions | — | `pg_uuidv7` · `temporal_tables` · `supa_audit` · pgAudit · PgBouncer | **`supa_audit` v0.3.1**, repo archived 2025-02, maintainer warns off tables >3000 write-ops/s **[V]** | `sailes-database/db-compendium.md:84` **[V]** |
| Auth | Better Auth (email/pw + Google) | Clerk (managed, budget OK) | **Lucia is deprecated — never start on it** (`stack-baseline.md:107`) **[V]** | `stack-baseline.md`, `security-checklist.md` |
| UI | Tailwind + shadcn/ui + RHF + Zod | **+ Preline UI** (additive blocks) · **Astryx** (React + StyleX — *replaces* the layer) | **Tailwind v4**, **React 19** (`sailes-design/premium-craft.md:7`) **[V]**; Astryx `facebook/astryx`, MIT, public Jun 2026, **Beta**, 150+ components / 10 themes — *"pin versions and expect API movement"* (`ui-libraries.md:52-55`) **[V]**; Preline 640+ components / ~940 blocks (`ui-libraries.md:21-22`) **[V]** | `sailes-bootstrap/ui-libraries.md` **[V]** |
| Jobs / durable workflow | DB-jobs + Railway cron → BullMQ+Redis → **Inngest** / Trigger.dev → Temporal | Make · n8n · Zapier (the incumbents to replace) · Kafka (different problem) | **Pin the image: `inngest/inngest:v1.35.0`, not `latest`**; port **8288** (`monorepo-multi-serwis.md:173`) **[V]** | `modules-catalog.md`, `sailes-async/async-compendium.md`, `sailes-hosting/…/monorepo-multi-serwis.md` |
| Storage | Railway Buckets (S3-compatible) | **Cloudflare R2** · AWS S3 | — | `modules-catalog.md`; **explicit fallback:** *"Jeśli Railway nie daje pewności co do EU → plan B: Cloudflare R2"* (`storage-postgres-bucket-volume.md`) **[R]** |
| Hosting | **Railway** (self-hosted, no AWS) | Vercel + Neon (only for preview-per-PR + DB branching) | Railway CLI **5.5.0 and 5.25.0 both confirmed broken** for `railway service source connect` on existing services — *"Nie trać na to więcej niż jednej próby"* (`monorepo-multi-serwis.md:107`) **[V]** | `stack-baseline.md`, `sailes-hosting/**` |
| Build | Dockerfile-first | Nixpacks / Railpack (**named failure mode**) | — | *"Nixpacks/Railpack buduje z `NODE_ENV=production` → pomija devDeps → `tsc: not found`"*; `--prod=false` and inline `NODE_ENV=development` **do not reliably fix it** **[R]** |
| Testing | Vitest · MSW · Testcontainers · Playwright | Stryker (tier A mutation) · fast-check · Pact (**rejected**) | — | `stack-baseline.md`, `sailes-test/**`, and — **[GAP]** — the shipped `agents/tester.md:31,51` + `codex-agents/tester.toml:11` name Stryker as the tier-A proof **[V]** |
| Observability | structured logs + Sentry + PostHog | OTel · Better Stack · Axiom · Logtail | — | `modules-catalog.md`, `stack-baseline.md` **[R]** |
| Feature flags | DB-based | LaunchDarkly · Statsig · Unleash — **"only for larger SaaS"** | — | `modules-catalog.md`, `stack-baseline.md` **[R]** |
| Harness twins | `.claude/settings.json` (Claude Code) | `.codex/config.toml` (Codex CLI) · `.github/copilot-instructions.md` (Copilot) | Codex `PreToolUse` fires **only for `Bash`** on some versions — **openai/codex issue #16732** **[R]** | `codex-config-template.md`, `skeleton.md`, `adopt-existing-repo.md` |
| CRM / integrations | Pipedrive | Gmail/Workspace OAuth · SMTP/IMAP · Resend/Postmark/SendGrid · Thulium · Medfile · Airtable · Autenti · Google Maps | **Pipedrive API v1**; signed token **HS256, not RS256**, TTL **~5 min**; RESIZE clamp **100–750 px** height / 800 width; rate-limit pacing **~2 s** (`PIPEDRIVE_REQ_INTERVAL_MS`); custom-field keys are **40-char hashes** **[R]**, HS256 spot-verified at `sailes-pipedrive/references/auth-acl.md:27,44` **[V]** | `sailes-pipedrive/**`, `sailes-hosting/references/env-i-sekrety.md` |

---

### Tier D — named as excluded, deprecated, or refuted (a real answer to "what does it depend on": *not these*)

`AWS` (excluded by owner preference, `stack-baseline.md`) · `Lucia` (deprecated, never start) **[V]** ·
`Express` (explicitly excluded in the Pipedrive repo — *"czysty Node `http` … bez Express"*) ·
`Supabase` (explicitly not the DB — *"Railway PostgreSQL (nie Supabase)"*) ·
`npm` for the Pipedrive Apps SDK (self-hosted UMD instead — *"Nie dodawaj zależności npm"*) ·
`jq` in hooks (deliberate, for portability) **[V]** ·
`Pact` (*"Pipedrive will not run your provider verification. Neither will Slack or Stripe. **Do not plan for it.**"* — `sailes-test/references/external-systems.md:56`) **[V]** ·
`SQLite` / in-memory Redis (*"Postgres via Testcontainers, not SQLite; real Redis, not a map"*) ·
`LaunchDarkly`/`Statsig`/`Unleash` for custom apps · `Redis` "by reflex" (named anti-pattern in `sailes-bootstrap/SKILL.md`) ·
`PowerShell Invoke-WebRequest` (*"falsely 404s against a Vite dev server — use `curl.exe`"*, `sailes-diagnose/traps.md:106`) **[V]** ·
`git filter-branch` (insufficient for a leaked secret — rotate at source) ·
mandatory RLS for pooled shared-schema (**REFUTED 3-0**, `db-compendium.md`).

---

### Tier E — cited sources, not dependencies

`Evosuite` · `MuTAP` (arXiv 2405.03786) · `QuickCheck` / Hypothesis / OSS-Fuzz / OWASP Fuzzing ·
Go `testing/synctest` · Hookdeck · Martin Fowler *Mocks Aren't Stubs* · *SWE at Google* ch.13 ·
PostgreSQL "Don't Do This" wiki · `ankane/strong_migrations` · GitLab Migration Style Guide ·
Nygard ADR (2011) / **MADR v4.0.0 (2024-09)** / `adr-tools` · Citus/Microsoft · PlanetScale · Crunchy Data ·
Matt Pocock's Wayfinder · Open-Mercato · one Kubernetes agent study (91–99% root-cause vs 37–60% remediation) **[V]** ·
arXiv 2606.22936 / 2604.02485 · calibration apps (Linear, Stripe Dashboard, Vercel, Raycast, Height, Arc) **[V]**.

Explorer-3 correctly flagged this framing in its own notes; explorers 1 and 2 listed several of these
in the same tables as real tools. Separating them is the single largest correction this artifact makes.

---

## 2. Confidence, and what could NOT be established

**High confidence (independently verified by me at the named line):** the graphify version floor and its
full absent-behaviour chain; `typescript ^5.5.3` in `package.json`; `chrome-devtools-mcp@latest` and
`chrome@stable`; the `run-probe.mjs` browser-absent SKIP; pinned model IDs in both prose and shipped
frontmatter; Node 24 vs `node:22-slim`/`pnpm@8.15.9`; `inngest/inngest:v1.35.0`; Railway CLI 5.5.0/5.25.0;
Prisma 7; Lucia deprecated; `supa_audit` v0.3.1; MADR v4.0.0; Tailwind v4 / React 19; Astryx and Preline
counts; Pipedrive HS256; the Stryker tier-A binding in `agents/tester.md`; Chromium 150 / Edge 150.0.4078.96.

**Medium confidence — quoted by one explorer, not re-checked by me.** Everything marked **[R]**. Each was
reported by exactly one explorer with no cross-check available (the slicing guaranteed this). The three
reports' quote fidelity was excellent in **all 22 strings I sampled** — zero misquotes — so I rate **[R]**
rows as probably accurate. But "probably accurate, single-source, unverified" is the honest label, and I
will not upgrade it by borrowing the explorers' confidence.

**Could NOT be established:**

1. **Whether any listed tool is actually installed on this machine.** Everything here is what the repo
   *says*. `.claude/settings.json` does not exist in this repo (verified: `cat` returned nothing), so
   there is no local allowlist to read — `settings-template.json` is a template shipped *for generated
   repos*, not this repo's own config.
2. **Node's minimum version for the framework repo itself.** `package.json` has no `engines` field
   **[V]**. Node 24 is stated only for *generated apps*. A CI image on Node 18 might or might not run
   `npm test`; nothing in the repo says.
3. **Whether the ~150 Tier-C tools are ever loaded at runtime.** They are prose recommendations inside
   markdown skills. No skill file is executable, so "depends on" is a claim about what an agent will be
   *told to install*, not about a resolvable dependency graph. I could not find any mechanism that would
   fail if, say, Drizzle were absent.
4. **Absent-behaviour for most of Tier C.** Only ~12 tools in the whole repo have an explicit stated
   "if absent" clause (all in Tier A/B, catalogued above). For Drizzle, Better Auth, Sentry, PostHog,
   Vitest, MSW, Playwright, Fastify and the rest, **no absence clause exists** — the framework's answer
   is the generic *"adapt this block to the locked stack"*. Any claim that these have fallbacks would be
   me inventing one.
5. **Whether `codex-agents/*.toml` reach parity with `agents/*.md` on tool declarations.** Spot-check
   found `agents/explorer.md` binds graphify explicitly while `codex-agents/explorer.toml` does not
   mention it, and `codex-agents/qa.toml` refers to "the DevTools Protocol" generically rather than
   naming `mcp__chrome-devtools__*` tools **[V]**. This *looks* like an asymmetry, but I did not read
   all 16 files, and TOML agents may declare tools by a different mechanism. **Flagged, not concluded.**
6. **Which chrome-devtools MCP version the `mcp__chrome-devtools__*` tool list in `agents/qa.md`
   corresponds to.** The docs pin `@latest`, which is not a version.

---

## 3. Contradictions — between the explorers, and inside the repo

### 3.1 Explorer errors I found by going to the source

**(a) Explorer-1's coverage claim is false.** It states `skills/sailes-bootstrap/` = "22 files, all read
in full" and lists 22. `ls` shows **23** (21 top-level + 2 in `hooks-template/`). The unread file is
**`deciding-under-uncertainty.md`**. *Resolution:* I read it myself. It names **no installable external
tool** — only the Agent tool's `effort` parameter and `grep` — so **no finding was lost**, but the
"all read in full" assurance was not earned. Explorers 2 and 3 had **correct** file counts (17 and 40,
both verified against `ls`).

**(b) Explorer-3 attributed a quote to a file that does not contain it.** Its `skills/README.md` table,
row 28, lists *"Open-Mercato (`.ai/skills/spec-writing/`)"* with the hedge *"README names the same repo
pattern indirectly."* *Resolution:* `grep -n 'Open-Mercato' skills/README.md` returns **nothing**.
Open-Mercato appears in `sailes-start/SKILL.md:80`, `sailes-spec/SKILL.md:47`, `sailes-bootstrap/SKILL.md:32`,
`spec-writing-template.md:3` and `skeleton.md:36` — but **not** in `skills/README.md`, not even indirectly.
**The row is a provenance error with a hedge attached.** The quote itself is real and correctly transcribed
from `sailes-start`; only the file attribution is wrong. Row relocated in this artifact.

**(c) Explorer-1 made the same class of error.** Its `decision-engine.md` table, row 17, lists
`deep-research` with the parenthetical *"this exact phrasing is in `developer-fit.md`; decision-engine
references developer-fit."* *Resolution:* `grep -n 'deep-research' skills/` shows it at
`developer-fit.md:18`, `stack-baseline.md:7`, and `db-compendium.md:5` — and **not** in
`decision-engine.md`. The cross-reference claim is true (`decision-engine.md:79` does point at
`developer-fit.md`), but a tool does not belong in a file's table because that file links to another
file. Also: explorer-1 **missed** the `stack-baseline.md:7` occurrence (*"Re-run `deep-research` before
high-stakes reliance on 🟡/🔁"*) which is inside its own slice.

**Neither (b) nor (c) is fabrication** — both quotes exist verbatim somewhere in the repo, and both
explorers flagged the shakiness themselves. They are *misfiled provenance*, which is exactly the failure
a "provenance is mandatory" brief is meant to catch, and it survived in two of three reports.

**What I did NOT find:** no invented tool, no invented version number, no invented quote. I sampled 22
distinct exact strings across all three reports — `graphifyy >= 0.9.23`, `chrome-devtools-mcp@latest`,
`chrome@stable`, `Chromium 150 / Edge 150.0.4078.96`, `node:22-slim`, `pnpm@8.15.9`, `inngest/inngest:v1.35.0`,
CLI `5.5.0`/`5.25.0`, `supa_audit v0.3.1`, `MADR v4.0.0`, `Tailwind v4`/`React 19`, `claude-opus-5`/
`claude-haiku-4-5`/`claude-sonnet-5`, `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, `Claude Code 2.1.220`,
`--browserUrl http://127.0.0.1:9222`, `railway scale`, `gh repo edit`, `crypto.timingSafeEqual`, PG `23505`,
`GRAPHIFY_HOOK_STRICT`, `graphify prs --conflicts`, `axe-core`, `python3 …/ui-ux-pro-max/scripts/search.py`,
Preline `640+`/`~940`, Astryx `150+`/`10 themes`, `91–99% vs 37–60%`, Pipedrive `HS256` — **every one landed
at the file the explorer named** (except (b) and (c) above). Quote fidelity across the three reports is high.

**One explorer's honest negative was correct and worth keeping.** Explorer-1's row 27 for
`sailes-bootstrap/SKILL.md` records Playwright as *absent* from that file. Verified: `grep Playwright
skills/sailes-bootstrap/SKILL.md` returns nothing. Recording a checked absence is a finding, and it
was the only one of its kind in the three reports.

### 3.2 Apparent contradictions that are the *repo's*, not the explorers'

The brief asked for contradictions between explorers. The substantive ones turned out to be conflicts
**inside the framework**, faithfully reported by two different explorers reading two different files.

| Conflict | Explorer-1 / -3 says | Explorer-2 says | Resolution (source-checked) |
|---|---|---|---|
| **The frontend baseline** | `stack-baseline.md:43` — *"Framework \| **Next.js App Router** (default)"*; UI = Tailwind + shadcn + RHF + Zod | `premium-ux.md:7` — *"Scope: B2B web on **the Sailes baseline (TanStack Start + React Query + shadcn)**"* | **Both quoted correctly [V].** The repo contradicts itself: `sailes-design/premium-ux.md:7,20,21,23` calls TanStack Start + React Query "the Sailes baseline", while `sailes-bootstrap/stack-baseline.md:43` — the file that *owns* the baseline and is cited everywhere else — says Next.js App Router. TanStack appears **only** in `premium-ux.md` (4 lines, verified by repo-wide grep). **Reading: `stack-baseline.md` is authoritative; `premium-ux.md:7` is stale.** This is a real defect in the framework, not an explorer error. |
| **Node version** | `stack-baseline.md:43` + `agents-md-template.md:53` — *"Node Active LTS (**24**)"* | (explorer-3) `monorepo-multi-serwis.md:31` — Dockerfile `FROM **node:22-slim**` | **Both correct [V].** The stated baseline is 24; the worked Railway deployment example pins 22. Not reconcilable from the text — no file acknowledges the gap. Flagged as an inconsistency. |
| **jq** | Explorer-1 lists jq twice, both times as *"deliberately NOT used"* / *"No jq dependency"* | — | Not a contradiction, but the tabular format made a **non-dependency look like a dependency**. Both rows are correct quotes; the framing needed inverting, which I have done in Tier A. |
| **`chrome-devtools` absent → fallback** | (explorer-2) `browser-inspect.md` / `sailes-design/SKILL.md` → **screenshot** + SKIP | (explorer-3) `sailes-diagnose/diagnosis-loop.md` → **a Playwright script** with `page.on('console')`/`page.on('response')` | **Both correct [V]** — the fallback is *purpose-dependent*, not contradictory: screenshot for the design integrity gate, Playwright instrumentation for diagnostic evidence capture. The two never had to agree; only a merged table makes them look like they disagree. Recorded as two fallbacks, not one. |

### 3.3 Where the slicing itself produced a wrong picture

Because all three slices stopped at `skills/`, the merged input would tell a reader that the framework's
tool dependencies are entirely prose. That is wrong in three concrete ways, all recovered above:

- **`package.json:14`** is the only machine-readable version constraint in the repo (`typescript ^5.5.3`) —
  **zero of three explorers saw it.**
- **`agents/*.md` frontmatter** is where `chrome-devtools` and the pinned model IDs are actually *declared
  to the harness*. `agents/qa.md:6` and `agents/fe-dev.md:6` enumerate 17 and 8 `mcp__chrome-devtools__*`
  tools respectively. This is a binding declaration, not advice. **Zero of three saw it.**
- **`evals/fixtures/browser-probe/run-probe.mjs:19-20`** is the **only executable implementation** of the
  framework's central "explicit SKIP, never a silent pass" doctrine that all three explorers documented
  purely as prose. **Zero of three saw it.**

---

## 4. One-line answer

The sailes framework itself needs **graphify (`graphifyy >= 0.9.23`, via `uv`/`pipx`)**, **Node**,
**TypeScript `^5.5.3`**, **git** and **bash**; it *optionally* uses the **`chrome-devtools` MCP**
(`chrome-devtools-mcp@latest` + a Chrome/Chromium binary) and the **`ui-ux-pro-max`** CLI. Everything
else — Drizzle, Better Auth, Railway, Inngest, Playwright, Vitest, Testcontainers, Pipedrive and ~140
more — is what it *recommends you build with*, or what it cites. Its absent-tool doctrine is uniform
and unusually well-specified for the small set that has one: **never block, offer the install one-liner,
then record an explicit `SKIP` in `.ai/STATE.md` and in the checklist output — silence is the failure,
not the SKIP.** The single exception is the migration deny-list, where absence is fail-loud: *"blokady
nie działają — zainstaluj przed pilotem."*

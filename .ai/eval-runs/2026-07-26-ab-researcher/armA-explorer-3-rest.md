# Arm A — explorer 3 — external-tool mentions in `skills/` (rest)

**Slice:** everything under `skills/` EXCEPT `sailes-bootstrap/`, `sailes-test/`, `sailes-design/`, `sailes-async/`.
**Files read (all, in full):** `skills/README.md`; `skills/sailes-database/*` (7); `skills/sailes-diagnose/*` (5); `skills/sailes-discovery/*` (2); `skills/sailes-hosting/*` (6); `skills/sailes-implement/SKILL.md`; `skills/sailes-migrate/*` (6); `skills/sailes-pipedrive/*` (8, incl. `assets/custom-ui-panel-template.html`); `skills/sailes-pre-implement/SKILL.md`; `skills/sailes-spec/SKILL.md`; `skills/sailes-start/SKILL.md`; `skills/sailes-wayfinder/SKILL.md`.

**Rules followed:** raw facts only, no deduplication across tools or files, no importance ranking, no conclusions. Every row carries a verbatim quote from the file. Where the file itself frames the named thing as something other than an installable tool (a blog, a repo, a methodology, a company product used as an example), that framing is noted verbatim in the "Version / if-absent / notes" column — no judgment applied beyond recording what the text says.

---

## 1. `skills/README.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| Claude Code | "A modular set of Claude Code skills that lead agents **and** developers through building custom B2B web apps in a **repeatable, standardized, agentic-first** way" | — |
| Claude Code (`~/.claude/skills/`) | "A copy is installed at `~/.claude/skills/` to make them active locally; when you change a skill here, re-sync the copy" | Install path stated |
| git | "sailes-bootstrap   → classify · lock stack · generate agentic-first repo (AGENTS.md/CLAUDE.md/README/.ai/ · git init · verify on disk)" | — |
| graphify | "Every repo the pipeline produces carries a graphify code map (built in bootstrap Step 4.9, kept fresh by post-commit hooks) — explorer, pre-implement, diagnose, and Route C adoption query it before grepping. See `skills/sailes-bootstrap/graphify-setup.md`." | Setup file is outside this slice |
| Make / n8n | "Durable async orchestration + latency speed-up when a slow/brittle flow (often Make/n8n) must become a fast code-first backend." | — |
| Railway | "how we host & deploy on **Railway** — project/env/service topology, all env vars & secrets, Postgres/S3-bucket/Volume storage layers, ephemeral-FS rule, git-branch deploy (incl. flattened build-branch caveat), `start:prod` migrate-on-boot, `/health`, `railway logs` debugging, install/OAuth-callback gotchas." | — |
| Postgres / S3 bucket / Volume | (same sentence as above) "Postgres/S3-bucket/Volume storage layers, ephemeral-FS rule" | — |
| pnpm, Inngest (self-hosted), Postgres, Redis, Dockerfile, Nixpacks | "Plus **monorepo + multi-service async** (pnpm; `api`+`worker`+self-hosted Inngest+Postgres+Redis): Dockerfile-first vs Nixpacks, `RAILWAY_DOCKERFILE_PATH`, branch-pinning, `railway status --json` ground truth, config-as-code trap, EU/RODO region, private networking, `dev`=prod-creds warning." | — |
| Pipedrive | "how to build Pipedrive app extensions — JSON panel, custom UI iframe, floating window, manifest/OAuth, signed-JWT auth, ACL, API proxy. Real Sailes patterns." | — |
| `anthropics/code-migration-kit-with-claude-code` | "Distilled from `anthropics/code-migration-kit-with-claude-code` (Apache-2.0)." | License stated: Apache-2.0 |
| Claude Code harness (`.claude/settings.json` + hooks) | "the Claude Code harness guardrails (`.claude/settings.json` + hooks — distinct from a durable-workflow \"hard harness\", see `sailes-async`) back the hard safety rules." | — |
| `superpowers:writing-skills` | "These skills are maintained with the `superpowers:writing-skills` discipline: **no skill edit without a failing test first** (baseline a real behavior on a subagent → edit → re-test)." | Named as an external skill/discipline |
| `./install.sh --force` | "To make an edit active locally after changing it here, re-run `./install.sh --force` (re-copies into `~/.claude/skills/`, the active copy)." | Repo-local script per the text |
| Matt Pocock's Wayfinder | "adapted from Matt Pocock's Wayfinder, zero external skill dependencies" | Text explicitly claims "zero external skill dependencies" |
| Open-Mercato (`.ai/skills/spec-writing/`) | "Route B (existing agentic-first repo): it was already there (e.g. Open-Mercato's `.ai/skills/spec-writing/`)." *(this exact wording is in sailes-start; README names the same repo pattern indirectly)* | Named as another repo, not an installable tool |

---

## 2. `skills/sailes-database/SKILL.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| Drizzle (`drizzle-kit`), Prisma, node-pg-migrate, sqitch, Atlas, golang-migrate | "**ORM / migration tool** — `package.json` + lockfile: Drizzle (`drizzle-kit`), Prisma (`prisma`), or SQL-first (`node-pg-migrate`, `sqitch`, Atlas, `golang-migrate`). This picks which scaffold you use (`migration-drizzle.md` / `migration-prisma.md` / `migration-sql-first.md`)." | Detection is from `package.json` + lockfile |
| PostgreSQL (versions) | "**PostgreSQL version** — several safety rules and features are version-gated (constant defaults PG11+, `SET NOT NULL` skip-scan PG12+, `CREATE STATISTICS` on expressions PG14+, native `uuidv7()` PG18+)." | PG11 / PG12 / PG14 / PG18 |
| PostgreSQL "Don't Do This" wiki | "full table + rationale in `db-compendium.md` §1.1, verified against the PostgreSQL \"Don't Do This\" wiki" | Cited as verification source |
| Testcontainers | "Run the integration tests (Testcontainers or the repo's harness) — they pass against the migrated schema." | "or the repo's harness" = stated alternative |
| `AskUserQuestion` | "Present each relevant card in the **Sailes decision-card format** (text or `AskUserQuestion`)" *(quote is from `decision-cards.md`, referenced by SKILL.md Phase 1)* | Alternative stated: plain text |

---

## 3. `skills/sailes-database/db-compendium.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| PostgreSQL "Don't Do This" wiki | "**Typy danych (PostgreSQL official \"Don't Do This\" wiki — primary, 3‑0):**" | Verification status: 3-0 |
| ankane/strong_migrations | "**Bezpieczne migracje (ankane/strong_migrations + GitLab style guide — primary, 3‑0):**" | — |
| GitLab Migration Style Guide | "GitLab: migracje danych zawsze batchami; background-migrations **nie zmieniają schematu**." | — |
| `pg_uuidv7` extension / PG18 native | "**UUID v7 (czasowo-uporządkowany, RFC 9562)** — nowoczesny kompromis: zalety UUID bez fragmentacji v4. **PostgreSQL 18 ma natywny `uuidv7()`** (+ `uuid_extract_timestamp()`), wcześniej rozszerzenie `pg_uuidv7`." | PG18 native; **if absent → extension `pg_uuidv7`** |
| `temporal_tables` extension | "**System-versioning / temporal tables** (rozszerzenie `temporal_tables`, **zweryfikowane 3‑0**): trigger `versioning(<sys_period>, <history_table>, <adjust>)` BEFORE INS/UPD/DEL archiwizuje starą wersję wiersza do tabeli historii. Tylko system-period (nie application-period), PG9.2+, `tstzrange`." | PG9.2+ |
| `supa_audit` | "**Audit log trigger-based** (`supa_audit`, zweryfikowane 3‑0 / 2‑1)" … "❗ **Koszt:** maintainer odradza tracking na tabelach o szczycie zapisu **>3000 ops/s** (zweryfikowane 3‑0). (Repo archiwalne 2025‑02, v0.3.1.)" | **v0.3.1**; repo archived 2025-02; >3000 ops/s warning |
| pgAudit | "**Alternatywa: pgAudit** — pisze do **logów Postgresa, nie do tabel**; bardziej niezawodne, ale ogromny wolumen logów + konfiguracja per-rola." | Stated as the alternative to trigger-based audit |
| PgBouncer | "**Pooling:** zwykły `SET` przecieka między połączeniami w PgBouncer (transaction mode) → użyj `SET LOCAL` / `set_config(…, true)` w transakcji." | transaction mode |
| Drizzle (drizzle-kit) | "**Drizzle (drizzle-kit)** — schema-as-TS, generuje SQL migracje, blisko SQL, świetne do raportów/integracji/audytu i „czytelności dla agentów". **Default dla Waszego stacku** (per `stack-baseline.md`)." | Declared default |
| Prisma Migrate | "**Prisma Migrate** — schema-as-DSL (`schema.prisma`), generuje migracje z diffu, dev-friendly; Prisma 7 bez Rust. Plan B." | **Prisma 7**; declared "Plan B" |
| Atlas (ariga/atlas) | "**Atlas** — **deklaratywny/state-based** (jak Terraform: definiujesz docelowy stan w SQL/HCL/ORM, Atlas planuje diff), ale wspiera też wersjonowane migracje. **50+ analizatorów lintu** … ⚠️ „98% feature support" i „50+" to dane vendora (2‑1 / niezbenczowane); lint wyszedł z darmowego planu w X.2025 — **sprawdź aktualny licensing**." | Lint left the free plan **X.2025**; "sprawdź aktualny licensing" |
| Terraform | "(jak Terraform: definiujesz docelowy stan w SQL/HCL/ORM, Atlas planuje diff)" | Named as an analogy |
| Flyway | "**Flyway / Liquibase** — **imperatywne** (sam piszesz i porządkujesz skrypty/changesety). Flyway: checks komercyjne (Teams skasowany V.2025)." | Flyway Teams cancelled **V.2025** |
| Liquibase | "Liquibase: policy checks tylko Pro." | Pro-only feature gate |
| pgroll (xata) | "**pgroll** (xata) — **automatyzuje expand/contract zero-downtime**: wirtualne schematy (views nad tabelami) … ⚠️ Obalone (1‑2): „pgroll stosuje WSZYSTKIE zmiany additive bez łamania schematu" — nie tak ogólnie." | Refutation recorded (1-2) |
| node-pg-migrate / golang-migrate / sqitch | "**node-pg-migrate / golang-migrate / sqitch** — lekkie, surowe migracje SQL, ręczny up/down." | — |
| Testcontainers | "Testuj migracje: na kopii schematu prod, integracyjnie (np. Testcontainers), z weryfikacją danych po (`SELECT`/count)." | "np." = given as an example |
| Mermaid | "**Mermaid w markdown** (jak wyżej) — JS-based, tekstowe definicje renderowane w GitHub/IDE; węzły decyzyjne = romb `{…}` + krawędzie `-->|Tak|`." | — |
| ADR — Nygard | "**Nygard** (oryginał 2011) — 5 sekcji: title, status, context, decision, consequences." | Original 2011 |
| MADR | "**MADR** (Markdown ADR) — wersjonowany standard (v4.0.0, 2024‑09), warianty full/minimal/bare, jawnie ujmuje rozważane opcje z pros/cons + metadane (deciders, status)." | **v4.0.0, 2024-09** |
| `adr-tools` | "**`adr-tools`** — CLI do logu ADR jako pliki markdown (domyślnie `doc/adr`), auto-numeracja, superseding (`adr new -s`)." | Default dir `doc/adr` |
| Citus / Microsoft | "❗ **Obalony mit (REFUTED 3‑0):** „RLS jest *wymagane* dla pooled shared-schema". **Nie jest.** … (Citus/Microsoft, PlanetScale wręcz odradza RLS)." | — |
| Cited sources (repos/blogs, §5 "Źródła kanoniczne") | "PostgreSQL \"Don't Do This\" — https://wiki.postgresql.org/wiki/Don't_Do_This … ankane/strong_migrations — https://github.com/ankane/strong_migrations … xataio/pgroll — https://github.com/xataio/pgroll … ariga/atlas — https://github.com/ariga/atlas" | Section is a source list; also names PlanetScale, Stripe, postgres.ai, use-the-index-luke, Martin Fowler, AWS, Crunchy Data, Bytebase, Cybertec, pganalyze, Andy Atkinson, thebuild, Supabase, brandur, temporal_tables (pgxn + GitHub), supa_audit, mermaid-js, adr/madr, npryce/adr-tools |

---

## 4. `skills/sailes-database/decision-cards.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| `AskUserQuestion` | "Present each relevant card in the **Sailes decision-card format** (text or `AskUserQuestion`), then let the user pick." | Alternative stated: plain text |
| UUID v7 / `pg_uuidv7` / PG18 | "**B) UUID v7** (PG18 `uuidv7()`, wcześniej `pg_uuidv7`) — ✅ globalnie unikalne + uporządkowane czasowo … ⚠️ 16 vs 8 B; zdradza **czas utworzenia**; wymaga PG18/rozszerzenia." | **Requires PG18 or the extension** |
| `temporal_tables` | "**C) Temporal (`temporal_tables`)** — ✅ automatyczna pełna historia wersji. ⚠️ rozszerzenie, tylko system-period, narzut zapisu." | Flagged as an extension |
| drizzle-kit / Prisma Migrate | "**A) Migracje ORM (drizzle-kit / Prisma Migrate)** — ✅ jedno źródło prawdy ze schematem, zero dodatkowego narzędzia. ⚠️ minimalny lint, słabszy drift." | — |
| Atlas | "**B) Atlas** — ✅ 50+ analizatorów, drift detection, planowanie diffu. ⚠️ kolejne narzędzie; część lint poza darmowym planem." | Part of lint outside the free plan |
| node-pg-migrate / sqitch / golang-migrate / Flyway | "**C) SQL-first imperatywne (node-pg-migrate / sqitch / golang-migrate / Flyway)** — ✅ pełna kontrola nad SQL, łatwy review." | — |
| pgroll | "**D) pgroll** — ✅ automatyzuje zero-downtime expand/contract. ⚠️ wąskie, nowe, nie pokrywa wszystkiego." | — |
| strong_migrations / Atlas (as CI lint gate) | "**Rekomendacja:** **A (drizzle-kit)** default stacku + **lint w stylu strong_migrations/Atlas** w CI jako bramka." | — |
| Crunchy Data | "**Rekomendacja:** **A** dla małego stabilnego zbioru (Crunchy: CHECK przed enum)." | Cited as source of the recommendation |
| PG14+ `CREATE STATISTICS` | "Hybryda: jsonb na surowiec + wypromowane kolumny na to, co filtrujesz (+`CREATE STATISTICS` PG14+)." | PG14+ |

---

## 5. `skills/sailes-database/migration-drizzle.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| drizzle-kit | "`drizzle-kit generate` → produces a timestamped `.sql` in the migrations dir + snapshot. **Read the generated SQL** — do not trust it blind for dangerous ops." | — |
| drizzle-kit (migrate) | "`drizzle-kit migrate` (or the app's runner) against a local prod-shaped DB → paste output (Phase 4)." | Alternative: "the app's runner" |
| drizzle-orm | "import { pgTable, bigint, uuid, text, timestamp, index } from \"drizzle-orm/pg-core\";" | — |
| `pg_uuidv7` / PG18 | "// …or UUIDv7 if the card chose B (PG18 native, else pg_uuidv7):" | **if absent → `pg_uuidv7`** |
| PG12+ | "ALTER TABLE deals ALTER COLUMN title SET NOT NULL;   -- PG12+ skips the scan" | PG12+ |
| drizzle-kit check / pull | "`drizzle-kit check` catches snapshot/schema mismatches. For a populated repo, prefer introspection (`drizzle-kit pull`) over guessing the baseline." | — |

---

## 6. `skills/sailes-database/migration-prisma.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| Prisma Migrate | "How to write the migrations from `SKILL.md` Phase 3 with Prisma Migrate, keeping the 🔒 rules in `migration-safety-checklist.md`." | — |
| `prisma migrate dev --create-only` | "`prisma migrate dev --create-only --name <change>` → generates the SQL **without applying it**, so you can edit it first." | — |
| `prisma migrate deploy` | "`prisma migrate deploy` for non-dev — **prod needs approval (🔒)**." | Prod gate stated |
| Prisma (CONCURRENTLY gap) | "Prisma wraps each migration in a transaction and has **no built-in CONCURRENTLY support** — so concurrent index creation must be its **own** migration whose only statement is the index" | Stated capability gap |
| `prisma migrate status` / `diff` / `resolve` / `reset` | "`prisma migrate status` / `migrate diff` detect drift between schema, migrations, and DB. Resolve with `migrate resolve` — never `migrate reset` against anything real." | — |
| UUIDv7 in Prisma | "// id     String   @id @default(dbgenerated(\"uuidv7()\")) @db.Uuid" | — |

---

## 7. `skills/sailes-database/migration-safety-checklist.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| ankane/strong_migrations, GitLab migration style guide, PostgreSQL docs | "Full rationale + sources → `db-compendium.md` §2 (verified against `ankane/strong_migrations`, GitLab migration style guide, PostgreSQL docs)." | — |
| PG11 / PG12+ | "(A **constant** default is safe since PG11 — no rewrite.)" … "`SET NOT NULL` (PG12+ skips the scan)" | PG11, PG12+ |
| Atlas lint rule PG301 | "**Change column type** | table rewrite + ACCESS EXCLUSIVE (e.g. PG301 lint) |" | Names the lint rule id |
| `disable_ddl_transaction!` | "`CREATE INDEX CONCURRENTLY` **outside** a DDL transaction (`disable_ddl_transaction!` / tool equivalent)" | "/ tool equivalent" |

---

## 8. `skills/sailes-database/migration-sql-first.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| node-pg-migrate | "**node-pg-migrate** — `export const shorthands = undefined;` and in the migration: `pgm.noTransaction()` at the top → no wrapping txn. Then `pgm.sql('CREATE INDEX CONCURRENTLY ...')`." | — |
| golang-migrate | "**golang-migrate** — by default each migration runs in a txn for Postgres; for CONCURRENTLY put the statement in its own migration and rely on the driver's no-transaction handling (or `x-multi-statement` off + single statement). Verify it doesn't wrap." | — |
| sqitch | "**sqitch** — one change per file; for CONCURRENTLY ensure the deploy script has no explicit `BEGIN`/`COMMIT` around it." | — |
| Atlas | "**Atlas** — declarative: define desired state, `atlas migrate diff` plans it; run `atlas migrate lint` (catches destructive/locking ops, e.g. PG301) as the CI gate. Atlas can emit CONCURRENTLY-aware plans." | Lint rule PG301 |
| PG12+ | "ALTER TABLE deals ALTER COLUMN title SET NOT NULL;     -- PG12+ skips scan" | PG12+ |

---

## 9. `skills/sailes-diagnose/SKILL.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| Slack | "Triggers — \"sprawdź błędy prod\", \"coś się wysypało\", \"nie doszedł deal / nie przyszedł e-mail\", \"alert ze Slacka\"" | — |
| Slack (`alertSlack`) | "\"`alertSlack` never throws and logs nothing on success, so the storm was INVISIBLE in worker logs — a `grep` for 'slack/alert/failure' returned 0, **giving false confidence that nothing fired**.\"" | — |
| Railway | "\"Railway `dev` holds production credentials. A Tokyo→Kyoto smoke test created a real person (42255), a real deal (43001), and sent a real email.\" — SRF `.ai/lessons.md:151-154`" | Marked as the reason for the read-only rule |
| `chrome-devtools` MCP | "`../sailes-design/browser-inspect.md` | **Optional instrument** for Step 1 Live — capturing console, request/response bodies and storage over CDP, and attaching to an already-running browser" | Explicitly labelled "**Optional instrument**"; referenced file is outside this slice |
| Kubernetes (study citation) | "Published agent evaluations show root-cause accuracy far above remediation validity (91–99% vs 37–60% in one Kubernetes study)" | Named inside a cited study |
| arXiv papers | "representational commitment peaks around **reasoning step 4** … (arXiv 2606.22936)" / "deliberately constructing the opposite case measurably improves accuracy (arXiv 2604.02485)" | Papers, not tools; recorded as named external references |

---

## 10. `skills/sailes-diagnose/diagnosis-loop.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| `chrome-devtools` MCP | "**Capturing it, if the `chrome-devtools` MCP is available** (optional — see `../sailes-design/browser-inspect.md` §4): `list_console_messages` for the console half, `list_network_requests` → `get_network_request` for URL + status **and body** … `evaluate_script` to read `localStorage`/`sessionStorage`/cookies" | **If absent:** "Absent it, a Playwright script with `page.on('console')` and `page.on('response')` produces the same evidence for more setup; either way the evidence log is what matters, not the tool." |
| Playwright | "Absent it, a Playwright script with `page.on('console')` and `page.on('response')` produces the same evidence for more setup" | Stated as the fallback for chrome-devtools MCP |
| Playwright (limitation) | "A Playwright context starting fresh *structurally cannot* reproduce a stale-localStorage bug; you must pre-seed the stale state to see it at all." | — |
| `chrome-devtools` (attach mode) | "the `chrome-devtools` server does not start fresh — its default profile persists across calls, and `--browserUrl http://127.0.0.1:9222` attaches to an already-running browser holding the real session." | Port 9222 |
| `git bisect` | "**Bisection.** Split the space and test the boundary — commits (`git bisect run` with a bug-revealing script, ~7 tests for 100 commits), or the pipeline (which step first sees bad data)." | — |

---

## 11. `skills/sailes-diagnose/probe-patterns.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| Railway CLI (`railway run`) | "```\nrailway run -s Postgres -e dev -- node --import tsx apps/worker/<probe>.ts <arg>\n```" | Standard probe invocation |
| tsx / node | (same block) "node --import tsx apps/worker/<probe>.ts" | — |
| Postgres (`DATABASE_PUBLIC_URL`) | "use **`DATABASE_PUBLIC_URL`**, not `DATABASE_URL` — the private hostname does not resolve from outside the platform's network" | — |
| Inngest (engine dedupe, unnamed) | "**A fresh event id is required.** The engine dedupes on event id, so resending the original id produces no new run at all" | Engine not named in this file |
| graphify | "## Graph probe (when the repo has graphify-out/graph.json)" … "`graphify path \"<symptom site>\" \"<suspected cause>\"` returns the concrete hop chain (each edge tagged EXTRACTED/INFERRED — cite the tag; INFERRED edges are hypotheses, not evidence)." | **Conditional on** `graphify-out/graph.json` existing |
| graphify (freshness) | "Verify freshness first (`graphify update .` is AST-only and free); never build evidence on a stale graph." | — |

---

## 12. `skills/sailes-diagnose/traps.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| Slack | "One booking generated ten real Slack alerts while the logs showed nothing." | — |
| Pipedrive | "\"the fake Pipedrive `fetch` returned success for any method, and **the tests *asserted* PATCH (encoding the bug)**.\" — SRF `lessons.md:38` (the API required PUT)" | API required PUT |
| tsx / node | "\"package `exports` → `src/*.ts` boots under tsx, crashes under `node dist`. **Production had literally never been booted via plain `node`.**\"" | — |
| Postgres | "`\"password authentication failed\"` retried nine times had a real cause of a native Postgres holding the port." | — |
| PowerShell `Invoke-WebRequest` / `curl.exe` / Vite | "PowerShell's `Invoke-WebRequest` **falsely 404s** against a Vite dev server — use `curl.exe`. When a result is bizarre, verify the instrument before theorising about the system." | Explicit substitution rule |
| Railway | "\"Railway `dev` holds production credentials. A Tokyo→Kyoto smoke test created a real person (42255), a real deal (43001), and sent a real email.\" — SRF `lessons.md:151-154`, marked CRITICAL" | Marked CRITICAL |

---

## 13. `skills/sailes-diagnose/incident-template.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| tsx / node (probe invocation) | "| E2 | vatprobe | `node --import tsx apps/worker/vatprobe.ts VA` | HTTP 204, empty body |" | Inside the evidence-log example |

*(No other external tool named in this file.)*

---

## 14. `skills/sailes-discovery/SKILL.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| `AskUserQuestion` | "Ask in **rounds of 3-4 questions** using `AskUserQuestion` (so the user clicks, doesn't write essays)." | — |
| `AskUserQuestion` (card delivery) | "When a real fork exists, present it like this (in the `AskUserQuestion` text or the message body), then let the user pick" | Alternative: message body |
| Railway / Vercel / AWS / VPS | "when the user says they already have infra, DRILL IN: which hosting (Railway/Vercel/AWS/VPS — and which *services* already run there)?" | — |
| Postgres | "Is there an **existing Postgres/DB** to reuse or must we create one?" | — |
| Google Workspace / SSO | "Existing **auth / SSO / Google Workspace tenant**?" | — |
| Make / Zapier / n8n | "Other automations (Make/Zapier/n8n) already touching it that could conflict?" | — |
| Drizzle / Prisma / Better Auth / Clerk / Railway / Vercel+Neon | "> The detailed stack/architecture decision cards (Drizzle vs Prisma, Better Auth vs Clerk, Railway vs Vercel+Neon, single- vs multi-tenant, sync depth, durable workflow engine…) are owned by **`sailes-bootstrap`** (Phase 2), which has the researched trade-offs." | Cards owned by a skill outside this slice |
| `Explore` / `explorer` subagent | "Brownfield only: do a **light** recon (or dispatch one `explorer`/`Explore` agent) to find whether the thing already exists." | — |
| TeamCreate | "Per the project's team workflow, the agent team (TeamCreate + roles) starts at *implementation*, not during elicitation — discovery is a solo interview." | — |
| CRM (generic, plan/tier gate) | "for each external system (CRM/API): which **plan/tier** (does it even have API/webhooks)?" | — |
| GDPR / HIPAA / PCI (regimes) | "PII? GDPR/HIPAA/PCI? Data residency? Encryption/audit needs?" | Compliance regimes, not tools |

---

## 15. `skills/sailes-discovery/brief-template.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| GDPR / HIPAA / PCI | "- Regulatory: {GDPR | HIPAA | PCI | none}" | Regimes, not tools |
| (generic integrations placeholder) | "## Integrations\n- {payments, auth, email, telematics, 3rd-party APIs...}" | No specific vendor named |

---

## 16. `skills/sailes-hosting/SKILL.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| Railway | "Hosting i wdrożenia aplikacji Sailes na Railway — jak to naprawdę robimy w produkcji." | Declared reference platform |
| Railway CLI | "czytasz logi przez railway CLI (railway logs / link / variables)" | — |
| Postgres | "podłączasz bazę Postgres (DATABASE_URL)" | — |
| S3 / Railway Storage Bucket | "storage plików (S3 bucket, Storage Bucket) lub Volume (trwały dysk)" | — |
| pnpm monorepo | "Użyj TAKŻE przy wdrożeniu monorepo pnpm / wielu serwisów (api+worker+self-hosted Inngest+Postgres+Redis)" | — |
| Inngest (self-hosted) | (same sentence) "self-hosted Inngest+Postgres+Redis" | Self-hosted variant |
| Redis | (same sentence) | — |
| Dockerfile vs Nixpacks | "Dockerfile vs Nixpacks, „tsc: not found" na buildzie, RAILWAY_DOCKERFILE_PATH, kasowanie railway.json" | — |
| Fastify + Drizzle + Postgres | "daje **nasz sposób** hostowania backendu Sailes (Fastify + Drizzle + Postgres + integracje)." | — |
| Railway docs | "> **Oficjalna dokumentacja (źródło prawdy):** <https://docs.railway.com>. Gdy coś się nie zgadza z tym plikiem — wygrywa docs Railway + faktyczny stan w dashboardzie." | Docs declared source of truth over the skill |
| `railway status --json` | "**Ground truth = `railway status --json`, nie dashboard.** Pola serwisu (`build.builder`, `dockerfilePath`, `startCommand`, `configErrors`) mówią, co Railway NAPRAWDĘ zrobił" | — |
| git | "Zweryfikuj `git ls-tree <remote>/<branch>` zanim uznasz, że „wypchnąłem zmianę"." | — |
| Nixpacks/Railpack (failure) | "**Monorepo pnpm → Dockerfile-first, nie Nixpacks.** Nixpacks/Railpack buduje z `NODE_ENV=production` → pomija devDeps → `tsc: not found`." | Named failure mode |
| OAuth (`redirect_uri`) / webhooks | "**Prod-owe callback/redirect URL rejestruj dokładnie** (OAuth `redirect_uri`, webhooki) na domenie produkcyjnej — musi się zgadzać co do znaku." | — |

---

## 17. `skills/sailes-hosting/references/railway-topologia-i-cli.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| `@railway/cli` via npm | "```bash\nnpm i -g @railway/cli          # instalacja globalna\nrailway login                  # logowanie (otwiera przeglądarkę)\nrailway whoami                 # potwierdź konto\n```" | Install command given |
| Railway login / `RAILWAY_TOKEN` | "W środowiskach headless/agentowych logowanie robi człowiek (`railway login`) — token siedzi w profilu. Jeśli sesja nie ma tokena, poproś użytkownika o `! railway login`." | **If absent:** ask the user to run `railway login` |
| `RAILWAY_TOKEN` (User/Machine scope) | "Dla trwałego użycia agentowego ustaw `RAILWAY_TOKEN` w scope **User/Machine** (`setx RAILWAY_TOKEN <token>`), nie tylko w bieżącej powłoce" | `setx` |
| `railway link` | "`railway link` bez argumentów odpala interaktywny wybór (zawiesza agenta). Podaj **wszystkie trzy**" | Non-interactive requirement |
| Fastify | "Services:     Custom-Overlay-App   (Fastify backend, build z gita)" | — |
| Docker / Nixpacks | "Railway buduje z **Dockerfile** (jeśli jest w katalogu roota serwisu) albo **Nixpacks** (auto-detekcja)." | **If Dockerfile absent → Nixpacks auto-detection** |
| drizzle-kit + tsx (`start:prod`) | "\"start:prod\": \"drizzle-kit migrate && tsx src/server.ts\"" | — |
| drizzle | "Notka typu `schema \"drizzle\" already exists, skipping` w logach = **normalne**, nie błąd." | — |
| `RAILWAY_DOCKERFILE_PATH` | "Commituj `Dockerfile` per app + zmienną serwisu `RAILWAY_DOCKERFILE_PATH` i skasuj `railway.json`" | — |
| Railway CLI commands | "`railway status --json          # GROUND TRUTH: source.branch, build.builder/dockerfilePath, startCommand, configErrors`" | Also `railway variables`, `railway logs`, `railway up`, `railway run` |

---

## 18. `skills/sailes-hosting/references/env-i-sekrety.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| Railway CLI (variables) | "**CLI:** `railway variables` (lista), `railway variables --set KLUCZ=wartosc` (ustaw)." | — |
| Railway Postgres (reference variable) | "```\nDATABASE_URL = ${{Postgres.DATABASE_URL}}\n```" — "Railway Postgres sam publikuje `DATABASE_URL`" | — |
| Pipedrive / Thulium / Medfile | "Jeśli sekret wyciekł do gita — rotuj u źródła (Pipedrive/Thulium/Medfile), nie licz na `git filter-branch`." | `git filter-branch` named as insufficient |
| Pipedrive (DRY_RUN) | "PIPEDRIVE_DRY_RUN = true   # test: zwraca syntetyczne ID (np. 900001), NIE dotyka realnego Pipedrive" | — |
| Pipedrive Developer Hub | "**OAuth `redirect_uri`** (Pipedrive Developer Hub → Callback URL): `https://custom-overlay-app-dev.up.railway.app/oauth/callback` — literalnie to samo co w kodzie." | Mismatch → `redirect_uri mismatch` |
| Thulium / Medfile (webhooks) | "**Webhooki** (Thulium, Medfile) → URL z sekretem w ścieżce, np. `.../webhooks/thulium/<THULIUM_WEBHOOK_SECRET>`." | — |
| Medfile | "| Medfile | `MEDFILE_*` (klucze RS256, URL API, master/child) | PROTECTED CORE — patrz kod, nie zgaduj |" | RS256 keys |
| Pipedrive (env catalog) | "| Pipedrive | `PIPEDRIVE_API_TOKEN`, `PIPEDRIVE_DOMAIN`, `PIPEDRIVE_DRY_RUN`, `PIPEDRIVE_CLIENT_ID`, `PIPEDRIVE_CLIENT_SECRET`, `PIPEDRIVE_PANEL_JWT_SECRET` | token routinguje po instancji (sprawdź `/v1/users/me`); JWT panelu HS256 = client_secret |" | HS256 |
| Thulium API | "| Thulium API | `THULIUM_API_USER`, `THULIUM_API_PASS`, `THULIUM_API_BASE_URL` | Basic auth; enrich nazwiska + click-to-call; default base `https://idealnywzrok.thulium.com/api` |" | Default base URL given |
| Railway Storage Bucket (S3) | "| Storage plików | `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | Railway Storage Bucket |" | 5 env vars |

---

## 19. `skills/sailes-hosting/references/storage-postgres-bucket-volume.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| Railway Postgres | "Osobny Service; publikuje `DATABASE_URL` → appka bierze referencją `${{Postgres.DATABASE_URL}}`." | — |
| drizzle-kit | "Migracje: `drizzle-kit migrate` odpala się na starcie appki" | — |
| Railway backups | "**Backup:** Railway robi snapshoty, ale **przetestuj restore** zanim na nich polegniesz (backup bez sprawdzonego restore = złudzenie)." | — |
| Railway Storage Bucket (S3-compatible) | "Railway ma natywny **Storage Bucket**, kompatybilny z S3 → działa z każdym klientem S3 bez zmian kodu." | Endpoint `storage.railway.app` |
| AWS SDK / S3 client | "Użycie: standardowy AWS SDK / S3 client (put/get/delete)." | — |
| Cloudflare R2 | "⚠️ **RODO / region EU:** potwierdź, że bucket stoi w regionie **EU** (dane pacjentów). Jeśli Railway nie daje pewności co do EU → **plan B: Cloudflare R2** (S3-compatible, wybór regionu EU, te same `S3_*`)." | **Explicit fallback if Railway can't guarantee EU**; decision open ("do decyzji z Karolem") |
| Railway Volume | "Dashboard: Service → dodaj **Volume**, ustaw **mount path** (np. `/data`)." … "Volume przeżywa deploy; **nie** przeżywa usunięcia serwisu. To nie backup." | — |
| Medfile | "`/tmp` jest OK **tylko** dla rzeczy ważnych w obrębie jednego requestu (np. bufor przy scalaniu PDF przed wysłaniem do Medfile)." | — |

---

## 20. `skills/sailes-hosting/references/wdrozenie-logi-gotchas.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| git / Railway branch deploy | "Railway śledzi **jeden branch per Environment**. `git push` na ten branch → auto-build → deploy." | — |
| `railway up` | "Alternatywa: `railway up` (deploy z lokalnego katalogu) — rzadziej; normalny flow to push do gita." | — |
| `git ls-tree` | "Zweryfikuj `git ls-tree --name-only <remote>/<branch>` zanim uznasz „wypchnąłem zmianę"" | — |
| `railway logs` | "`railway logs` = logi **bieżącego** deploymentu (startowe + runtime requestów)." | "Logi sprzed ostatniego restartu znikają" |
| Nixpacks/Railpack | "| `tsc: not found` na buildzie monorepo | Nixpacks/Railpack buduje z `NODE_ENV=production` → pomija devDeps | Dockerfile per app + `RAILWAY_DOCKERFILE_PATH`, skasuj `railway.json` |" | — |
| TypeScript incremental cache | "| „tsc zielone" a jednak build/typy padają | incremental cache `tsconfig.tsbuildinfo` | usuń buildinfo, odpal typecheck na zimno przed „zielone" |" | — |
| OAuth provider (incognito) | "| OAuth „Something went wrong" po podmianie/reinstalacji appki | zombie-sesja / stare ciasteczka u dostawcy | instaluj w **incognito** (świeże ciasteczka) |" | — |
| CSP `frame-ancestors` | "Panele/iframe'y osadzane u dostawcy → prod domena + poprawny CSP `frame-ancestors`." | — |

---

## 21. `skills/sailes-hosting/references/monorepo-multi-serwis.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| pnpm | "pnpm monorepo z kilkoma deployowalnymi bytami: `apps/api` (intake webhooka) + `apps/worker` (funkcje Inngest) + **self-hosted Inngest** + Postgres + Redis." | 5-service deployment |
| Nixpacks / Railpack | "**Dlaczego Nixpacks pada:** buduje z `NODE_ENV=production`, co **pomija devDependencies** → `tsc: not found` na buildzie (`typescript` to devDep). `--prod=false` ani inline `NODE_ENV=development pnpm install` w buildCommand **nie naprawiają tego niezawodnie**" | Named failure + failed workarounds |
| Docker / `node:22-slim` / corepack / pnpm 8.15.9 | "```dockerfile\nFROM node:22-slim\n\nRUN corepack enable && corepack prepare pnpm@8.15.9 --activate" | **node:22-slim**, **pnpm@8.15.9** |
| `RAILWAY_DOCKERFILE_PATH` | "Wskazanie Dockerfile per serwis: **zmienna serwisu `RAILWAY_DOCKERFILE_PATH`** (np. `apps/worker/Dockerfile`) — TO jest ustawialne przez `railway variables --set`." | — |
| `railway.json` (config-as-code) | "> 🔒 **Gdy przechodzisz na Dockerfile — SKASUJ wszystkie `railway.json`.** Per-app `railway.json` (`deploy.startCommand` / `build.builder`) **konfliktuje** z Dockerfile nawet przy poprawnym okablowaniu." | — |
| `railway status --json` | "Dashboardowe pola i `railway variables` **nie mówią, co się stało na ostatnim deployu**. Jedyny pewny sposób … ```bash\nrailway status --json\n```" | Fields listed incl. `configErrors` |
| `railway service source connect` (broken) | "**`railway service source connect --branch <b> --service <svc>` JEST ZEPSUTE** dla istniejących serwisów — zwraca `ServiceInstance not found` niezależnie od wersji CLI (potwierdzone 5.5.0 i 5.25.0)" | **CLI 5.5.0 and 5.25.0 both confirmed broken**; "Nie trać na to więcej niż jednej próby" |
| `gh` CLI | "`gh repo edit owner/repo --default-branch dev` — jeśli serwis ma `branch: None` i godzisz się zmienić realny domyślny branch repo" | Listed as workaround #2 |
| `railway up` | "`railway up` — deploy lokalnego checkoutu, omija rozwiązywanie brancha z gita. **Uwaga:** NIE omija pułapki config-as-code z §4" | Workaround #3 |
| `railway add` | "Przy **tworzeniu** serwisu z CLI: `railway add --repo … --branch dev -s <name>` ustawia branch poprawnie od razu — zepsute jest tylko *rekonektowanie* istniejącego serwisu." | — |
| `railway scale` (EU region) | "```bash\nrailway scale <svc> eu-west=1 us-west=0 us-east=0\n```" — "`railway add`/GitHub-integration nie ma flagi regionu → domyślnie US" | **Default region US if not moved** |
| `railway domain` | "```bash\nrailway domain -s <service> --port <port>\n```" — "Domyślnie żaden serwis nie ma publicznej domeny." | — |
| Inngest (self-hosted image) | "Obraz **pinuj** (`inngest/inngest:v1.35.0`), nie `latest`. Port `8288` = Event API + API + Dashboard. **Ten obraz nie honoruje wstrzykniętego `$PORT`** — ustaw `--port=8288` jawnie (i/lub `INNGEST_PORT`)." | **inngest/inngest:v1.35.0**, port 8288 |
| Inngest (start command) | "```\ninngest start --sdk-url=http://worker.railway.internal:3001/api/inngest --poll-interval=60\n```" | Keys via env: `INNGEST_POSTGRES_URI` / `INNGEST_REDIS_URI` / `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` |
| openssl | "Klucze **hex, parzysta długość** (`openssl rand -hex 32`) — nie-hex signing key **crashuje serwer na boot**." | Non-hex key → boot crash |
| Inngest health check (GraphQL) | "**Health-check self-host = GraphQL, nie REST.** `/v0/apps` zwraca 404; pole `synced` na `apps` nie istnieje." | REST endpoint returns 404 |
| curl | "```bash\ncurl -s -X POST \"https://<inngest-domain>/v0/gql\" -H \"Content-Type: application/json\" \\\n    -d '{\"query\":\"{ apps { id name url error functions { name slug } } }\"}'\n```" | — |
| Postgres (two databases) | "**Jeden Postgres, dwie bazy** (decyzja właściciela — taniej niż drugi plugin): app używa domyślnej bazy `railway` (`DATABASE_URL`), Inngest osobnej `inngest` w **tej samej** instancji (`CREATE DATABASE inngest;`)" | — |
| Drizzle | "drizzle-owy `__drizzle_migrations` żyje tylko w `railway`. **Nie odpalaj migracji Drizzle na bazie `inngest`.**" | — |
| Redis | "Redis (osobny plugin) czyta **tylko** Inngest." | — |
| Inngest dev / Docker | "Lokalnie odwrotnie: `inngest dev --no-discovery -p 8288` (bez kluczy; SDK łączy się przez `INNGEST_DEV=1`). W kontenerze dev rejestracja workera z hosta: `INNGEST_SERVE_HOST=http://host.docker.internal:3001`." | — |
| `RAILWAY_TOKEN` / `setx` / PowerShell | "```powershell\nsetx RAILWAY_TOKEN <token>            # albo:\n[Environment]::SetEnvironmentVariable('RAILWAY_TOKEN', $token, 'User')\n```" | Session `railway login` expires mid-use |
| node `--env-file` | "> **Warstwowanie env `--env-file` = LAST-file-wins.** `node --env-file=.env --env-file=override.env` → późniejszy plik **nadpisuje** wcześniejszy dla tego samego klucza" | — |
| python | "```bash\nrailway variables -s Postgres --json | python -c \"import sys,json;print(json.load(sys.stdin)['DATABASE_PUBLIC_URL'])\"\n```\n  (przez `python -c`, żeby nie echować URL-a z credkami do historii/logów.)" | — |
| `pg` (node driver) | "Skrypt z `pg` odpalaj **z wnętrza `packages/db`**, nie z roota — pnpm nie-hoistuje `node_modules`, więc `pg` nie rozwiązuje się w roocie monorepo." | — |
| drizzle-kit (manual migrations) | "**Efekt: migracje są ręcznym krokiem** (`pnpm db:migrate` / `drizzle-kit migrate`) po deployu, który zmienia schemat." | Dockerfile-only layout has no migrate-on-start |
| Pipedrive / SendGrid / Airtable / Google Maps | "`dev` był wpięty w **realne produkcyjne** credki Pipedrive / SendGrid / Airtable / Google Maps — **nie ma sandbox/staging** dla żadnego z nich." | **No sandbox/staging exists for any of them** |
| Pipedrive API (cleanup) | "```bash\ncurl -X DELETE \"https://<company>.pipedrive.com/api/v1/deals/<dealId>?api_token=<token>\"\ncurl -X DELETE \"https://<company>.pipedrive.com/api/v1/persons/<personId>?api_token=<token>\"\n```" | API v1 |
| tsx / vitest / node | "Prod boot potrafi paść w miejscach, których dev (tsx) i testy (vitest) **nie dotykają** — bo oba to loadery TS." | — |

---

## 22. `skills/sailes-implement/SKILL.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| `superpowers:test-driven-development` | "Identify the RED test first (write or name a failing test before the code — `superpowers:test-driven-development`)." | Named external skill |
| Zod | "Logic in services, validation at the boundary (Zod), thin controllers, no `any`." | — |
| curl | "drive the real running system first (e2e flow / `curl` the live endpoint / click the UI / generate the actual PDF/screen)" | — |
| git / `git mv` | "All phases shipped + verified → set spec `Status: implemented` and `git mv` it to `.ai/specs/implemented/` (preserve history)" | — |
| `Explore` / `explorer` subagent | "Read-only recon (`Explore`/`explorer`) for mapping; implementation steps that touch the same files run sequentially (or in worktrees if truly parallel) to avoid conflicts." | git worktrees |
| agent-teams mode | "the agent driving `sailes-implement` **acts as `team-lead`** (or delegates to the `team-lead` role if agent-teams mode is on) … the **fallback when teams mode is off** (same roles as sequential subagents)" | **If teams mode off → same roles as sequential subagents** |
| PR workflow | "Hand off per the repo's PR workflow (label `review`)." | — |

---

## 23. `skills/sailes-pre-implement/SKILL.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| `Explore` / `explorer` subagents | "For a large scope, dispatch read-only `Explore`/`explorer` subagents (one area each) — keep main context clean." | — |
| graphify | "**Mechanical BC probe (when `graphify-out/graph.json` exists):** for every surface the spec touches, run `graphify explain \"<symbol>\"` (its full in/out edge list = the real blast radius) and `graphify path \"<changed thing>\" \"<suspected dependent>\"` for each risky pair." | **Conditional on `graphify-out/graph.json` existing**; "Freshness check first (graphify-setup.md); a stale graph is not evidence." |

---

## 24. `skills/sailes-spec/SKILL.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| Zod | "**Name the contract artifact path(s)** this spec creates/extends (shared Zod schemas / TS types both slices import — the frozen-contract artifact, not a prose shape)." | — |
| Drizzle | "ORM: Drizzle — explicit schema in TS, migrations committed + reviewed." | Listed as baseline default |
| Better Auth / Google login | "Auth: Better Auth (Google login = login only, never Gmail access)." | Explicit scope limit |
| Zod | "Validation: Zod at every boundary; types via `z.infer`; no `any`." | — |
| Vitest / MSW / Testcontainers / Playwright | "Tests: Vitest + MSW + Testcontainers + Playwright; self-contained, no faked passes." | — |
| Postgres | "Files: private by default, signed URLs, metadata in Postgres, access log." | — |
| pnpm / curl (Done-when examples) | "the exact command(s) to run + the expected outcome (e.g. `pnpm test src/auth → 0 failures`; `curl -s -o /dev/null -w '%{http_code}' -X POST /api/export → 200 + non-empty file`" | — |
| git (`git mv`) | "set `Status: implemented` and **`git mv` the file to `.ai/specs/implemented/`** (git mv preserves history)" | — |
| Open-Mercato | "Two mechanisms, both required. (Pattern proven in Open-Mercato `.ai/specs/`.)" | Named as another repo/project |
| (stack override clause) | "(If the repo locked a different stack, adapt this block to it — the workflow and sections stay the same.)" | **If-absent behaviour for the whole baseline stack block** |

---

## 25. `skills/sailes-migrate/SKILL.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| `anthropics/code-migration-kit-with-claude-code` | "> **Provenance:** metoda zdestylowana z `anthropics/code-migration-kit-with-claude-code` (Apache-2.0, © 2026 Anthropic PBC). Ten skill to **nasza synteza idei** zmapowana na maszynerię Sailes — nie kopia ich plików." | **Apache-2.0, © 2026 Anthropic PBC** |
| kit scripts (`depmap_*`, `queue_runner`, `build_daemon`) + templates | "Konkretne skrypty (`depmap_*`, `queue_runner`, `build_daemon`, szablony `RULEBOOK.md`/`inventory.tsv`/deny-`settings.json`) żyją w tamtym repo; jak i czy je vendorować — patrz `cost-and-gates.md` (decyzja licencyjna człowieka)." | Vendoring = human licensing decision |
| Prisma / Drizzle / SQL | "To NIE jest o migracjach SCHEMATU BAZY DANYCH — te robi `sailes-database` (Prisma/Drizzle/SQL)." | Disambiguation |
| graphify | "`explorer` + **graphify** (mamy go w każdym repo); Rulebook = **zamrożona** tabela" | "mamy go w każdym repo" |
| `.claude/settings.json` deny-list + `.codex/config.toml` | "**`.claude/settings.json` deny-list** blokuje drogie operacje (mamy hooki + twin `.codex`)" | — |
| deny-list (if absent) | "**Jeśli deny-list nie jest zainstalowany, blokady nie działają** — zainstaluj go przed pilotem z Kroku 2." | **Explicit if-absent behaviour: guards do not work** |

---

## 26. `skills/sailes-migrate/methodology.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| graphify + kit `depmap_*` | "U nas: najpierw **graphify** (jest w każdym repo), skrypty `depmap_*` kitu jako uzupełnienie dla języków, których graphify nie pokrywa." | **If graphify doesn't cover the language → kit's `depmap_*`** |
| deny-list guardrail | "Wymaga zainstalowanego **deny-list guardraila** (Krok potrzebuje go do stress-testu)." | — |
| `.claude/settings.json` | "Deny-list `.claude/settings.json` aktywny (blokuje drogie operacje per-jednostka)." | — |

---

## 27. `skills/sailes-migrate/parallel-translation.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| `.claude/settings.json` + `.codex/config.toml` | "Każde repo generowane przez `sailes-bootstrap` ma już `.claude/settings.json` + twin `.codex/config.toml` na wspólnych skryptach hooków — dołóż deny na drogie operacje migracji (np. `typecheck`, pełny `build`) na czas Kroków 2–4, i **reaktywuj** je na Krok 6." | — |
| deny-list (if absent) | "> **KRYTYCZNE:** jeśli deny-list **nie jest zainstalowany**, blokady nie działają — fan-out pobiegnie „nieuzbrojony". Zainstaluj przed pilotem (Krok 2). To dokładnie ta pułapka, którą kit Anthropic odnotował jako realny incydent." | **Explicit if-absent behaviour** |
| kit scripts | "`queue_runner` / `build_daemon` / `depmap_*` / `make_manifest` żyją w kicie Anthropic (`anthropics/code-migration-kit-with-claude-code`, Apache-2.0)." | **Default: "sklonuj kit obok repo migrowanego i użyj jego skryptów"** |

---

## 28. `skills/sailes-migrate/cost-and-gates.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| `anthropics/code-migration-kit-with-claude-code` | "Metoda zdestylowana z **`anthropics/code-migration-kit-with-claude-code`** — licencja **Apache-2.0, © 2026 Anthropic, PBC**. Ten skill to nasza **synteza idei** (idee nie podlegają prawu autorskiemu); **nie reprodukujemy tekstu ani plików** kitu." | Apache-2.0, © 2026 Anthropic PBC |
| kit scripts + templates (named) | "Konkretne skrypty kitu (`depmap_python.py`, `depmap_mjs`, `depmap_c_headers.py`, `make_manifest.py`, `queue_runner.mjs`, `build_daemon.sh`) oraz szablony (`RULEBOOK.md`, `inventory.tsv`, deny-`settings.json`) **żyją w tamtym repo**. Domyślnie: **referencja** — sklonuj kit obok repo migrowanego i użyj jego skryptów." | Default = reference, not vendored |
| Apache-2.0 §4 obligations | "**Vendorowanie … jest prawnie dozwolone przez Apache-2.0**, ale wymaga: zachowania nagłówków licencyjnych i dołączenia `NOTICE`/atrybucji (Apache-2.0 §4)" | — |

---

## 29. `skills/sailes-migrate/judge-setup.md` and `rulebook-template.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| (judge — existing test suite) | "**Istniejący suite (public-facing)** — jeśli oryginał ma testy, które wołają go przez publiczny interfejs (nie importują wnętrzności), **przenieś je bez zmian** do Kroku 6. To najtańszy judge." | **If tests import source internals → build a portable parity harness instead** |
| (portable parity harness) | "**Przenośny parity-harness** — jeśli testy oryginału **importują wnętrzności źródła** (nie przełożą się 1:1), zbuduj osobny harness … Harness jest **przenośny** (nie zależy od języka źródłowego)." | — |
| `.ai/migrate/RULEBOOK.md` | "Skopiuj tę tabelę do repo migrowanego (`.ai/migrate/RULEBOOK.md`) i wypełniaj podczas Kroku 1" | No external tool named |

---

## 30. `skills/sailes-pipedrive/SKILL.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| Pipedrive App Extensions docs | "> **Oficjalna dokumentacja (źródło prawdy):** App Extensions — https://pipedrive.readme.io/docs/app-extensions · API v1 — https://developers.pipedrive.com/docs/api/v1" | Docs declared source of truth over the skill; **API v1** |
| Node `http` (no Express) | "**Stack repo (nie zmieniaj bez powodu):** serwer to **czysty Node `http`** (`createServer` w `server.mjs`, ręczny routing po `url.pathname`, helpery `sendJson(res, status, payload)` i `sendFile(res, path)` — **bez Express**)." | Express explicitly excluded |
| React + Vite | "Złożone widoki (dashboard) to React+Vite (`src/`, build do `dist/`)." | — |
| Pipedrive Apps SDK (self-hosted UMD) | "Apps SDK jest **self-hostowany** jako UMD w `public/vendor/app-extensions-sdk.umd.js` (nie z npm)." | **Not from npm** |
| Railway | "Deploy: **Railway**, `node server.mjs`, healthcheck `/health`." | — |
| Pipedrive Developer Hub | "**Zarejestruj w Developer Hubie** i dopisz do `ui_extensions[]` w `manifest()` (`server.mjs`)." | — |
| Apps SDK commands | "**SDK ładuj z `/vendor/app-extensions-sdk.umd.js`** (self-host), przez `<script>`, potem `new window.AppExtensionsSDK().initialize()`. Nie dodawaj zależności npm." | — |
| Pipedrive RESIZE limits | "**RESIZE klamruj do 100–750 px wysokości, szerokość 800.** Pipedrive odrzuca wartości spoza zakresu." | 100–750 px height, width 800 |
| Signed token | "**Token**: `Command.GET_SIGNED_TOKEN` z fallbackiem na `?token=` z URL. Wysyłaj go do backendu jako `X-Pipedrive-Token`. Token żyje ~5 min — odświeżaj." | **~5 min TTL**; fallback `?token=` |
| `PIPEDRIVE_JWT_SECRET` | "**Sekret JWT** do weryfikacji to `PIPEDRIVE_JWT_SECRET` (fallback `PIPEDRIVE_CLIENT_SECRET`) i **musi** pokrywać się z JWT secret tej wtyczki w Developer Hubie — inaczej każda weryfikacja zwróci „odmowa"." | **If mismatched → every verification denies** |

---

## 31. `skills/sailes-pipedrive/references/*`

| Tool | File | Verbatim quote | Version / if-absent / notes |
|---|---|---|---|
| Pipedrive API v1 | `api-i-custom-fields.md` | "> Dokumentacja API: https://developers.pipedrive.com/docs/api/v1" | — |
| Pipedrive API proxy | `api-i-custom-fields.md` | "const apiUrl = `https://api.pipedrive.com/v1${apiPath}?${apiParams.toString()}`;" | `PIPEDRIVE_API_TOKEN` injected server-side |
| Vite (dev proxy) | `api-i-custom-fields.md` | "W devie Vite proxuje `/api/pd` na `api.pipedrive.com` i też dokleja token (patrz `vite.config.ts`)." | — |
| Pipedrive custom fields (hashed keys) | `api-i-custom-fields.md` | "Pola niestandardowe Pipedrive mają klucze w postaci 40-znakowego hasha (nie czytelnej nazwy). Centralna mapa: `src/api/pipedrive.ts` (`FIELDS`)." | 40-char hash |
| Pipedrive rate limit / paceGate | `api-i-custom-fields.md` | "Pipedrive ogranicza tempo (≈ kilka żądań/s). Repo ma semafor `paceGate` wymuszający minimalny odstęp między żądaniami (domyślnie ~2 s, konfigurowalny `PIPEDRIVE_REQ_INTERVAL_MS`)." | **~2 s default**; 429 risk |
| Autenti | `api-i-custom-fields.md` | "CONTRACT_STATE:      '75c4b4ec6660678ea2418609c203e35b64782112', // enum (ukryte)\n  AUTENTI_STATUS:      '47291212a20ee60dbbecf9fb4712947750269bf2'," — and option label "'W podpisie – Autenti': 100" | Named as an external e-signature system via custom field |
| Railway PostgreSQL (not Supabase) | `api-i-custom-fields.md` | "Baza to **Railway PostgreSQL** (nie Supabase) — połączenie przez pulę `pg` w `server.mjs`." | **Supabase explicitly excluded** |
| Pipedrive signed token (HS256) | `auth-acl.md` | "Sygnowany token Pipedrive (signed token) żyje ~5 minut i jest podpisany sekretem JWT Twojej wtyczki (z Developer Huba)." … "**Sekret musi się zgadzać** z JWT secret wtyczki w Developer Hubie — najczęstsza przyczyna „wszystko zwraca deny". Algorytm to **HS256** (HMAC), nie RS256." | **HS256, not RS256**; ~5 min |
| Pipedrive Developer Hub (Custom UI) | `custom-ui-panel.md` | "Developer Hub → *App extensions → Custom UI → Panel*, location np. *Deal details*, Iframe URL = `<APP_URL>/pd-ui/<nazwa>`." | Query params: `?id=…&resource=deal&selectedIds=…&userId=…&companyId=…` |
| Apps SDK commands/events used | `custom-ui-panel.md` | "Dostępne komendy/eventy, których używamy: `Command.RESIZE`, `Command.GET_SIGNED_TOKEN`, `Command.SHOW_SNACKBAR` (toast po zapisie), `Event.USER_SETTINGS_CHANGE`. (SDK ma ich więcej — sięgaj po nie z dokumentacji Pipedrive tylko, gdy są potrzebne.)" | — |
| Pipedrive JSON panel colors | `json-panel.md` | "**`status`** — `{ color, label }`. Kolory Pipedrive: `green`, `red`, `yellow`, `blue`, `grey`" | "Dokładny, aktualny zestaw obsługiwanych typów pól potrafi się zmieniać w API Pipedrive" |
| Pipedrive OAuth2 | `manifest-oauth-rejestracja.md` | "redirect na `https://oauth.pipedrive.com/oauth/authorize` z `client_id`, `redirect_uri`, `scope`, `state`." | Token refresh with 30 s buffer |
| Pipedrive env vars | `manifest-oauth-rejestracja.md` | "| `PIPEDRIVE_JWT_SECRET` | Sekret do weryfikacji sygnowanych tokenów paneli (fallback: `CLIENT_SECRET`). **Musi** == JWT secret wtyczki w Hubie. |" | **If mismatched → ACL = deny** |
| Railway (post-deploy check) | `manifest-oauth-rejestracja.md` | "Po deployu na Railway zweryfikuj, że `GET /manifest.json` zwraca aktualny manifest i że iframe URL-e są publicznie dostępne (HTTPS)." | — |
| React helper | `floating-window-app.md` | "Dashboard używa helpera `src/lib/pipedriveEmbed.ts`. Wywołaj `initializePipedriveEmbed()` przy starcie apki" | Default RESIZE 800×700 |
| Apps SDK (in asset) | `assets/custom-ui-panel-template.html` | "await loadScript('/vendor/app-extensions-sdk.umd.js');\n    if(!window.AppExtensionsSDK) return;\n    sdk = await new window.AppExtensionsSDK().initialize();" | Line 140-142; **if SDK object absent → return (no init)**; line 152: "catch(e){ console.warn('SDK init skipped', e); }" |
| Apps SDK RESIZE clamp (in asset) | `assets/custom-ui-panel-template.html` | "// SDK akceptuje wysokość tylko z zakresu 100–750 px — klamrujemy każdą wartość." (line 93) | 100–750 px, width 800 |

---

## 32. `skills/sailes-start/SKILL.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| git | "Route A → Case B: **generate** the repo skeleton … **git init + first commit**." | — |
| `find` / `git log` | "**Never claim a phase done without evidence** — Phase 2 ends only when `repo-done-checklist.md` shows all-green (real `find`/`git log` output), not when you intended to create the files." | — |
| Open-Mercato | "Route B (existing agentic-first repo): it was already there (e.g. Open-Mercato's `.ai/skills/spec-writing/`)." | Named as another repo |

*(All other named things in this file are sibling Sailes skills, not external tools.)*

---

## 33. `skills/sailes-wayfinder/SKILL.md`

| Tool | Verbatim quote | Version / if-absent / notes |
|---|---|---|
| git (local markdown tracker) | "Default tracker is **local markdown** — truth on disk, versioned in git, zero dependencies" | Explicit "zero dependencies" |
| GitHub Issues | "If the team already runs planning on GitHub Issues, offer a 🔀 decision card (local files vs Issues with labels `wayfinder:map` / `wayfinder:<type>` and native blocked-by) — the user chooses; either way there is exactly **one** canonical home." | Labels named; user chooses |
| Matt Pocock's Wayfinder methodology | "Adapted from the Wayfinder methodology (Matt Pocock) with **zero external dependencies**: every ticket type resolves through mechanisms this framework already has — decision cards (`sailes-discovery` style), research subagents, `sailes-design` prototypes." | Explicitly claims zero external dependencies |
| research subagents | "**research** | AFK | A fresh research subagent (docs, third-party APIs, codebase, web). Findings land in the ticket's Resolution. The only type allowed >1 per session; fire them in parallel." | — |

---

## Coverage note

Every file in the slice was read in full. Files where no external tool is named at all: none — `skills/sailes-discovery/brief-template.md` and `skills/sailes-migrate/rulebook-template.md` name only compliance regimes / generic placeholders and are recorded as such above.

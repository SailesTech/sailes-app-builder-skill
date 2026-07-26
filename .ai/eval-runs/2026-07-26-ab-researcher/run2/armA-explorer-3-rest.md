# Arm A — Explorer 3 — recon of `skills/` (all except sailes-bootstrap, sailes-test, sailes-design, sailes-async)

**Slice size: 40 files. All 40 read in full.** Enumerated with
`find skills -type f | grep -v "^skills/sailes-{bootstrap,test,design,async}/"`.

File list (repo-relative), with line counts:

| # | File | Lines |
|---|---|---|
| 1 | `skills/README.md` | 86 |
| 2 | `skills/sailes-database/SKILL.md` | 124 |
| 3 | `skills/sailes-database/db-compendium.md` | 394 |
| 4 | `skills/sailes-database/decision-cards.md` | 82 |
| 5 | `skills/sailes-database/migration-drizzle.md` | 59 |
| 6 | `skills/sailes-database/migration-prisma.md` | 51 |
| 7 | `skills/sailes-database/migration-safety-checklist.md` | 45 |
| 8 | `skills/sailes-database/migration-sql-first.md` | 54 |
| 9 | `skills/sailes-diagnose/SKILL.md` | 226 |
| 10 | `skills/sailes-diagnose/diagnosis-loop.md` | 186 |
| 11 | `skills/sailes-diagnose/incident-template.md` | 130 |
| 12 | `skills/sailes-diagnose/probe-patterns.md` | 132 |
| 13 | `skills/sailes-diagnose/traps.md` | 177 |
| 14 | `skills/sailes-discovery/SKILL.md` | 218 |
| 15 | `skills/sailes-discovery/brief-template.md` | 125 |
| 16 | `skills/sailes-hosting/SKILL.md` | 131 |
| 17 | `skills/sailes-hosting/references/env-i-sekrety.md` | 90 |
| 18 | `skills/sailes-hosting/references/monorepo-multi-serwis.md` | 294 |
| 19 | `skills/sailes-hosting/references/railway-topologia-i-cli.md` | 109 |
| 20 | `skills/sailes-hosting/references/storage-postgres-bucket-volume.md` | 80 |
| 21 | `skills/sailes-hosting/references/wdrozenie-logi-gotchas.md` | 86 |
| 22 | `skills/sailes-implement/SKILL.md` | 82 |
| 23 | `skills/sailes-migrate/SKILL.md` | 118 |
| 24 | `skills/sailes-migrate/cost-and-gates.md` | 48 |
| 25 | `skills/sailes-migrate/judge-setup.md` | 47 |
| 26 | `skills/sailes-migrate/methodology.md` | 92 |
| 27 | `skills/sailes-migrate/parallel-translation.md` | 45 |
| 28 | `skills/sailes-migrate/rulebook-template.md` | 41 |
| 29 | `skills/sailes-pipedrive/SKILL.md` | 140 |
| 30 | `skills/sailes-pipedrive/assets/custom-ui-panel-template.html` | 166 |
| 31 | `skills/sailes-pipedrive/references/api-i-custom-fields.md` | 102 |
| 32 | `skills/sailes-pipedrive/references/auth-acl.md` | 113 |
| 33 | `skills/sailes-pipedrive/references/custom-ui-panel.md` | 120 |
| 34 | `skills/sailes-pipedrive/references/floating-window-app.md` | 76 |
| 35 | `skills/sailes-pipedrive/references/json-panel.md` | 88 |
| 36 | `skills/sailes-pipedrive/references/manifest-oauth-rejestracja.md` | 90 |
| 37 | `skills/sailes-pre-implement/SKILL.md` | 85 |
| 38 | `skills/sailes-spec/SKILL.md` | 145 |
| 39 | `skills/sailes-start/SKILL.md` | 139 |
| 40 | `skills/sailes-wayfinder/SKILL.md` | 159 |

Total 4775 lines. No deduplication, no ranking — every mention recorded where it occurs.

Legend for the "Absent-behaviour" column: **—** = nothing stated at that location.

---

## 1. `skills/README.md`

| Line | Tool / service | Verbatim quote | Version constraint | Absent-behaviour stated |
|---|---|---|---|---|
| 5 | `~/.claude/skills/` (Claude Code skill dir) | "A copy is installed at `~/.claude/skills/` to make them active locally; when you change a skill here, re-sync the copy" | — | — |
| 21 | local `.ai/skills/spec-writing/` | "sailes-spec (local `.ai/skills/spec-writing/` if present, else global) → approved spec" | — | **Fallback**: global `sailes-spec` used if local absent |
| 37-39 | graphify; git post-commit hooks | "Every repo the pipeline produces carries a graphify code map (built in bootstrap Step 4.9, kept fresh by post-commit hooks) — explorer, pre-implement, diagnose, and Route C adoption query it before grepping." | — | Implicit: grepping is the pre-graphify behaviour |
| 48 | Matt Pocock's Wayfinder (external methodology) | "adapted from Matt Pocock's Wayfinder, zero external skill dependencies" | — | Explicitly **zero external skill dependencies** |
| 54 | PostgreSQL | "Schema design + safe PostgreSQL migrations when the spec touches the DB." | — | — |
| 55 | Make, n8n | "when a slow/brittle flow (often Make/n8n) must become a fast code-first backend" | — | — |
| 56 | — (diagnose) | "this company's `dev` holds prod credentials" | — | — |
| 59 | `anthropics/code-migration-kit-with-claude-code` | "Distilled from `anthropics/code-migration-kit-with-claude-code` (Apache-2.0)." | licence Apache-2.0 | — |
| 60 | Railway; pnpm; Inngest (self-hosted); Postgres; Redis; Dockerfile; Nixpacks; `RAILWAY_DOCKERFILE_PATH`; `railway.json`; `railway status --json`; `railway logs`; `start:prod`; `/health` | "how we host & deploy on **Railway** — project/env/service topology, all env vars & secrets, Postgres/S3-bucket/Volume storage layers, ephemeral-FS rule, git-branch deploy (incl. flattened build-branch caveat), `start:prod` migrate-on-boot, `/health`, `railway logs` debugging, install/OAuth-callback gotchas. Plus **monorepo + multi-service async** (pnpm; `api`+`worker`+self-hosted Inngest+Postgres+Redis): Dockerfile-first vs Nixpacks, `RAILWAY_DOCKERFILE_PATH`, branch-pinning, `railway status --json` ground truth, config-as-code trap, EU/RODO region, private networking, `dev`=prod-creds warning." | — | — |
| 72 | Claude Code harness: `.claude/settings.json` + hooks; lint/types/tests | "the Claude Code harness guardrails (`.claude/settings.json` + hooks — distinct from a durable-workflow \"hard harness\", see `sailes-async`) back the hard safety rules" | — | "Agents follow enforced rules always and prose rules usually — and \"usually\" compounds badly." |
| 73 | error tracking / uptime check / backup+restore | "a first production launch requires the ops block (error tracking that alerts a human, /health, a backup with a **tested restore**, uptime check, runbook)" | — | — |
| 78 | `superpowers:writing-skills` skill | "These skills are maintained with the `superpowers:writing-skills` discipline: **no skill edit without a failing test first**" | — | — |
| 86 | `./install.sh --force`; `VERSION`; `CHANGELOG.md` | "To make an edit active locally after changing it here, re-run `./install.sh --force` (re-copies into `~/.claude/skills/`, the active copy)." | — | — |

---

## 2. `skills/sailes-database/SKILL.md`

| Line | Tool | Verbatim quote | Version constraint | Absent-behaviour |
|---|---|---|---|---|
| 3 (frontmatter) | PostgreSQL | "to design the PostgreSQL schema and write SAFE, zero-downtime migrations for a B2B web app" | — | — |
| 27 | `package.json` + lockfile; Drizzle (`drizzle-kit`); Prisma (`prisma`); `node-pg-migrate`; `sqitch`; Atlas; `golang-migrate` | "**ORM / migration tool** — `package.json` + lockfile: Drizzle (`drizzle-kit`), Prisma (`prisma`), or SQL-first (`node-pg-migrate`, `sqitch`, Atlas, `golang-migrate`). This picks which scaffold you use (`migration-drizzle.md` / `migration-prisma.md` / `migration-sql-first.md`)." | — | Detection-driven branch; no explicit failure path |
| 28 | `schema.ts` / `schema.prisma` / live DB | "**Existing schema** — current migrations dir, `schema.ts`/`schema.prisma`, or the live DB." | — | "Match them; don't reinvent." |
| 29 | CRM integration tables | "are CRM-integration tables (`integration_accounts, external_object_links, webhook_events, sync_runs, idempotency_keys`) in scope?" | — | — |
| 30 | PostgreSQL (version-gated features) | "**PostgreSQL version** — several safety rules and features are version-gated (constant defaults PG11+, `SET NOT NULL` skip-scan PG12+, `CREATE STATISTICS` on expressions PG14+, native `uuidv7()` PG18+)." | **PG11+, PG12+, PG14+, PG18+** | — |
| 63 | PostgreSQL "Don't Do This" wiki | "full table + rationale in `db-compendium.md` §1.1, verified against the PostgreSQL \"Don't Do This\" wiki" | — | — |
| 65 | — | "`bigint GENERATED ALWAYS AS IDENTITY` for sequential keys (never `serial`/`bigserial`) — unless Phase 1 chose UUIDv7." | — | — |
| 75 | — | "**Additive + large table / index** → online (`CREATE INDEX CONCURRENTLY`, constant default), **outside** the DDL transaction." | — | — |
| 85 | Testcontainers | "Run the integration tests (Testcontainers or the repo's harness) — they pass against the migrated schema." | — | **Fallback**: "or the repo's harness" |
| 90-91 | `checker` role, `qa` role | "**Adversarial review** in fresh context (`checker` role)… **Real-flow proof** (`qa` role)" | — | — |
| 93 | `agentic-first-principles.md`, `security-checklist.md` | "**🔒 Prod gate:** never run a production migration without explicit approval" | — | Hard failure: no prod migration without approval |

---

## 3. `skills/sailes-database/db-compendium.md` (Polish)

Recorded in reading order.

| Line | Tool / source | Verbatim quote | Version constraint | Absent-behaviour |
|---|---|---|---|---|
| 4 | PostgreSQL; Drizzle; Prisma; SQL-first | "Stack docelowy: **PostgreSQL**, ścieżka **ORM (Drizzle default / Prisma)** oraz **SQL-first**." | — | Drizzle is default, Prisma alternative |
| 24 | PostgreSQL "Don't Do This" wiki | "**Typy danych (PostgreSQL official \"Don't Do This\" wiki — primary, 3‑0):**" | — | — |
| 30 | `ankane/strong_migrations`; GitLab style guide | "**Bezpieczne migracje (ankane/strong_migrations + GitLab style guide — primary, 3‑0):**" | — | — |
| 33 | `gen_random_uuid()`, `clock_timestamp()` | "✅ Nowa kolumna ze stałym defaultem — OK od PG11. ❌ nigdy kolumna z **volatile** defaultem (`gen_random_uuid()`, `clock_timestamp()`) — przepisuje całą tabelę." | **PG11+** | — |
| 36 | GitLab | "🎯 Zero-downtime to **wymóg**, nie preferencja (GitLab manduje to bezwzględnie)." | — | Hard requirement |
| 53 | Cybertec (benchmark source) | "**`bigint GENERATED … AS IDENTITY`** — **default** dla kluczy wewnętrznych (Cybertec, 3‑0). Benchmark insert-only: bigint **107 090 ins/s vs uuid v4 74 947 ins/s**" | — | — |
| 54 | pganalyze | "pganalyze: WAL **2 GB (bigserial) vs 40 GB (random uuid)**" | — | — |
| 55 | PostgreSQL 18 `uuidv7()`; extension `pg_uuidv7` | "**PostgreSQL 18 ma natywny `uuidv7()`** (+ `uuid_extract_timestamp()`), wcześniej rozszerzenie `pg_uuidv7`." | **PG18** native; else extension | **Fallback**: `pg_uuidv7` extension pre-PG18 |
| 61 | Heap; pganalyze | "Heap: zapytanie **~300 ms → ~584 s (~2000×)** po przeniesieniu kolumn do jsonb. pganalyze: 200 wierszy estymowane jako 7,8 mln → seq scan." | — | — |
| 62 | TOAST | "Aktualizacja przepisuje całą wartość (write amplification); TOAST przy dużych wartościach" | — | — |
| 63 | Crunchy Data; GIN index | "**Indeksowanie (Crunchy Data):** GIN (`USING gin (data)`) działa dla **zawierania `@>` i istnienia klucza `?`,`?|`,`?&`** — ale **NIE** dla nawigacji ścieżką" | — | **Fallback**: expression B-tree index on `(data->>'pole')` |
| 64 | `CREATE STATISTICS` | "**Fix estymacji (PG14+):** `CREATE STATISTICS … ON (data ->> 'pole') FROM tabela;`" | **PG14+** | — |
| 65 | `strong_migrations` | "(`strong_migrations` flaguje dodanie kolumny `json` zamiast `jsonb` jako unsafe.)" | — | — |
| 68 | Crunchy Data | "**CHECK constraint** — Crunchy Data **rekomenduje CHECK przed enum**" | — | — |
| 71 | Cybertec (fetch failure) | "⚠️ **Luka w researchu:** źródło dla strony „lookup table" (Cybertec) **nie pobrało się** — to najsłabiej udokumentowany temat" | — | Documented gap, marked as weakest section |
| 74 | brandur (source) | "**`deleted_at timestamptz`** — proste, ale (brandur, „soft deletion probably isn't worth it")" | — | — |
| 75 | brandur `deleted_record` pattern | "**Wzorzec `deleted_record` (rekomendowany przez brandur)** — twardy DELETE + trigger `AFTER DELETE` zrzucający cały wiersz jako `to_jsonb(OLD.*)`" | — | — |
| 76 | extension `temporal_tables` | "**System-versioning / temporal tables** (rozszerzenie `temporal_tables`, **zweryfikowane 3‑0**): trigger `versioning(<sys_period>, <history_table>, <adjust>)` … Tylko system-period (nie application-period), PG9.2+, `tstzrange`." | **PG9.2+**; extension required | — |
| 82-84 | `supa_audit` | "**Audit log trigger-based** (`supa_audit`, zweryfikowane 3‑0 / 2‑1)… ❗ **Koszt:** maintainer odradza tracking na tabelach o szczycie zapisu **>3000 ops/s** (zweryfikowane 3‑0). (Repo archiwalne 2025‑02, v0.3.1.)" | **v0.3.1**, repo archived 2025‑02; >3000 ops/s limit | Do not use above 3000 ops/s |
| 85 | pgAudit | "**Alternatywa: pgAudit** — pisze do **logów Postgresa, nie do tabel**; bardziej niezawodne, ale ogromny wolumen logów + konfiguracja per-rola." | — | **Alternative** to trigger-based audit |
| 87 | use-the-index-luke | "🔀 Indeksy (use-the-index-luke — primary)" | — | — |
| 102 | AWS RLS guide; Crunchy Data | "**Row-Level Security (RLS)** dla shared-schema (AWS RLS guide + Crunchy Data, zweryfikowane 3‑0)" | — | — |
| 108 | superuser / `BYPASSRLS` | "**Superuser / rola z `BYPASSRLS`** omija RLS **po cichu** (brak błędu)" | — | Silent bypass — no error |
| 110 | PgBouncer | "**Pooling:** zwykły `SET` przecieka między połączeniami w PgBouncer (transaction mode) → użyj `SET LOCAL` / `set_config(…, true)` w transakcji." | transaction mode | — |
| 112 | Citus/Microsoft; PlanetScale | "Filtrowanie w warstwie app (`WHERE tenant_id = ?`, global scopes ORM) to pełnoprawna alternatywa (Citus/Microsoft, PlanetScale wręcz odradza RLS)." | — | **Explicit alternative** to RLS; RLS not mandatory |
| 128 | PlanetScale; Stripe; Martin Fowler; pgroll | "Referencje: PlanetScale (6 kroków), Stripe online-migrations (4‑fazowy dual-write), Martin Fowler ParallelChange, pgroll." | — | — |
| 130 | `strong_migrations`; Postgres docs | "### 2.2 Katalog ryzykownych operacji (strong_migrations + Postgres docs, 3‑0)" | — | — |
| 134 | `disable_ddl_transaction!` (Rails/strong_migrations idiom) | "`CREATE INDEX CONCURRENTLY`, poza transakcją (`disable_ddl_transaction!`)" | — | — |
| 135 | — | "`SET NOT NULL` (PG12+ pomija skan)" | **PG12+** | — |
| 136 | — | "(Stały default = OK od PG11)" | **PG11+** | — |
| 141 | `in_batches(of: 10000)` (Rails idiom) | "Trzy klucze: **batching** (`in_batches(of: 10000)`), **throttling** (`sleep` między batchami), **poza transakcją**." | — | — |
| 142 | GitLab | "GitLab: migracje danych zawsze batchami; background-migrations **nie zmieniają schematu**." | — | — |
| 143 | Stripe | "❗ Obalone (0‑3): „backfill offline/distributed zamiast na żywej produkcji" — Stripe backfilluje **w fazie dual-write na żywej bazie**, nie offline." | — | Refuted claim |
| 145 | postgres.ai | "### 2.4 Transakcyjność, lock_timeout, retry (postgres.ai — primary)" | — | — |
| 153 | Testcontainers | "Testuj migracje: na kopii schematu prod, integracyjnie (np. Testcontainers), z weryfikacją danych po (`SELECT`/count)." | — | "np." — Testcontainers is an example, not mandatory |
| 160 | Drizzle (`drizzle-kit`) | "**Drizzle (drizzle-kit)** — schema-as-TS, generuje SQL migracje, blisko SQL… **Default dla Waszego stacku** (per `stack-baseline.md`)." | — | Default |
| 161 | Prisma Migrate | "**Prisma Migrate** — schema-as-DSL (`schema.prisma`), generuje migracje z diffu, dev-friendly; Prisma 7 bez Rust. Plan B." | **Prisma 7** (Rust-free) | Explicit "Plan B" |
| 162 | `db push` | "Wspólne: oba mają migracje wersjonowane (imperatywne pliki) + jakiś `db push` (declarative dla devu — nie na produkcję)." | — | Not for production |
| 165 | Atlas (ariga) | "**Atlas** — **deklaratywny/state-based** (jak Terraform…), ale wspiera też wersjonowane migracje. **50+ analizatorów lintu** (wykrywa destrukcyjne zmiany, locki, BC-breaki: DS102/103, MF103/104, PG301), **drift detection**… ⚠️ „98% feature support" i „50+" to dane vendora (2‑1 / niezbenczowane); lint wyszedł z darmowego planu w X.2025 — **sprawdź aktualny licensing**." | lint left free plan Oct 2025; **check current licensing** | Licensing may block lint |
| 165 | Terraform (as analogy) | "**deklaratywny/state-based** (jak Terraform: definiujesz docelowy stan w SQL/HCL/ORM, Atlas planuje diff)" | — | — |
| 166 | Flyway; Liquibase | "**Flyway / Liquibase** — **imperatywne**… Flyway: checks komercyjne (Teams skasowany V.2025). Liquibase: policy checks tylko Pro." | Flyway Teams cancelled May 2025; Liquibase policy checks Pro-only | Paid tier required for checks |
| 167 | pgroll (xata) | "**pgroll** (xata) — **automatyzuje expand/contract zero-downtime**… ⚠️ Obalone (1‑2): „pgroll stosuje WSZYSTKIE zmiany additive bez łamania schematu" — nie tak ogólnie." | — | Refuted overreach |
| 168 | node-pg-migrate; golang-migrate; sqitch | "**node-pg-migrate / golang-migrate / sqitch** — lekkie, surowe migracje SQL, ręczny up/down." | — | Manual up/down |
| 171 | Atlas | "Atlas wykrywa synchronicznym pre-apply checkiem." | — | — |
| 185 | PG18 `uuidv7()` / `pg_uuidv7` | "**B) UUID v7 (PG18 natywny `uuidv7()`, wcześniej `pg_uuidv7`)** … ⚠️ … wymaga PG18 lub rozszerzenia." | **PG18** or extension | Hard prerequisite |
| 186 | `gen_random_uuid()` | "**C) UUID v4 (`gen_random_uuid()`)**" | — | — |
| 204 | `CREATE STATISTICS` | "(+ `CREATE STATISTICS` na PG14+ jeśli musisz filtrować po jsonb)" | **PG14+** | — |
| 255 | Atlas | "**B) Atlas (deklaratywny, schema-as-code)** — ✅ 50+ analizatorów bezpieczeństwa, drift detection… ⚠️ kolejne narzędzie w stacku; część funkcji/lint poza darmowym planem (sprawdź licensing)." | free-plan limits | — |
| 256 | node-pg-migrate / golang-migrate / sqitch / Flyway | "**C) SQL-first imperatywne (node-pg-migrate / golang-migrate / sqitch / Flyway)**" | — | — |
| 257 | pgroll | "**D) pgroll** — ✅ automatyzuje zero-downtime expand/contract (views + triggery). ⚠️ wąsko wyspecjalizowane, nowe, nie pokrywa wszystkich zmian." | — | Does not cover all changes |
| 258 | drizzle-kit; strong_migrations; Atlas | "**Rekomendacja:** **A (drizzle-kit)** jako default dla Waszego stacku; dołóż **lint w stylu strong_migrations / Atlas** jako bramkę bezpieczeństwa w CI." | — | — |
| 287 | `temporal_tables` | "**C) Temporal / system-versioning (`temporal_tables`)** — … ⚠️ rozszerzenie, tylko system-period, narzut zapisu." | extension required | — |
| 299 | Mermaid | "**Mermaid w markdown** (jak wyżej) — JS-based, tekstowe definicje renderowane w GitHub/IDE" | — | — |
| 301 | Nygard ADR | "**Nygard** (oryginał 2011) — 5 sekcji: title, status, context, decision, consequences." | 2011 original | — |
| 302 | MADR | "**MADR** (Markdown ADR) — wersjonowany standard (v4.0.0, 2024‑09), warianty full/minimal/bare" | **v4.0.0, 2024‑09** | — |
| 303 | `adr-tools` | "**`adr-tools`** — CLI do logu ADR jako pliki markdown (domyślnie `doc/adr`), auto-numeracja, superseding (`adr new -s`)." | — | — |
| 304 | `strong_migrations` | "**Tabele decyzyjne / checklisty** w stylu `strong_migrations` (operacja → ryzyko → fix) — blokuje niebezpieczne operacje domyślnie… Postgres/MySQL/MariaDB." | — | Blocks unsafe ops by default |
| 311-350 | Canonical source URLs (full list, §5) | PostgreSQL wiki "Don't Do This"; Database Schema Recommendations; `ankane/strong_migrations`; GitLab Migration Style Guide; `xataio/pgroll`; `ariga/atlas` (+ atlas-vs-others, drift-detection); PlanetScale; Stripe; postgres.ai; use-the-index-luke; Martin Fowler ParallelChange; AWS RLS blog + prescriptive guidance; Crunchy Data RLS; Postgres docs RLS; Bytebase RLS footguns; PlanetScale tenancy + "RLS sounds great until it isn't"; Citus/Microsoft; Cybertec; pganalyze; Andy Atkinson; nerdleveltech PG18 UUIDv7 benchmark; thebuild (C. Pettus); Supabase; Crunchy indexing jsonb; Heap; pganalyze planner jsonb; Crunchy enums vs CHECK; brandur soft-deletion + deleted-record; `temporal_tables` (pgxn + `arkhipov/temporal_tables`); `supabase/supa_audit`; pganalyze pgaudit vs supa_audit; `mermaid-js/mermaid`; `adr/madr`; `npryce/adr-tools` | — | — |
| 368 | `stack-baseline.md` | "`stack-baseline.md` — Postgres + Drizzle default / Prisma; „migracje commitowane + reviewed"; tabele cross-cutting (`users, sessions, audit_logs, webhook_events, integration_accounts, sync_runs, idempotency_keys, feature_flags`)." | — | — |

---

## 4. `skills/sailes-database/decision-cards.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 3 | `AskUserQuestion` | "Present each relevant card in the **Sailes decision-card format** (text or `AskUserQuestion`), then let the user pick." | — | **Fallback**: plain text if tool unavailable |
| 23 | PG18 `uuidv7()`; `pg_uuidv7` | "**B) UUID v7** (PG18 `uuidv7()`, wcześniej `pg_uuidv7`) — … ⚠️ … wymaga PG18/rozszerzenia." | **PG18** or extension | — |
| 24 | `gen_random_uuid()` | "**C) UUID v4** (`gen_random_uuid()`)" | — | — |
| 34 | `CREATE STATISTICS` | "(+`CREATE STATISTICS` PG14+)" | **PG14+** | — |
| 45 | PgBouncer-style pooling; `BYPASSRLS` | "**❗ Jeśli RLS (🔒 footguny):** `FORCE ROW LEVEL SECURITY`; nie łącz się jako owner/superuser/`BYPASSRLS`; indeks na `tenant_id`; `SET LOCAL`/`set_config(…,true)` w poolingu; uważaj na funkcje nie-`LEAKPROOF` (full scan)." | — | — |
| 55 | Crunchy | "**Rekomendacja:** **A** dla małego stabilnego zbioru (Crunchy: CHECK przed enum)." | — | — |
| 64 | `temporal_tables` | "**C) Temporal (`temporal_tables`)** — ✅ automatyczna pełna historia wersji. ⚠️ rozszerzenie" | extension | — |
| 69 | `sailes-bootstrap` | "(Zwykle już zablokowane przez `sailes-bootstrap`; potwierdź zamiast wybierać od nowa.)" | — | — |
| 71 | drizzle-kit / Prisma Migrate | "**A) Migracje ORM (drizzle-kit / Prisma Migrate)** — ✅ jedno źródło prawdy ze schematem, zero dodatkowego narzędzia. ⚠️ minimalny lint, słabszy drift." | — | — |
| 72 | Atlas | "**B) Atlas** — ✅ 50+ analizatorów, drift detection, planowanie diffu. ⚠️ kolejne narzędzie; część lint poza darmowym planem." | free-plan limits | — |
| 73 | node-pg-migrate / sqitch / golang-migrate / Flyway | "**C) SQL-first imperatywne (node-pg-migrate / sqitch / golang-migrate / Flyway)** — ✅ pełna kontrola nad SQL, łatwy review. ⚠️ ręczne up/down + sam pilnujesz §2." | — | Manual safety enforcement |
| 74 | pgroll | "**D) pgroll** — ✅ automatyzuje zero-downtime expand/contract. ⚠️ wąskie, nowe, nie pokrywa wszystkiego." | — | — |
| 75 | drizzle-kit; strong_migrations/Atlas lint in CI | "**Rekomendacja:** **A (drizzle-kit)** default stacku + **lint w stylu strong_migrations/Atlas** w CI jako bramka." | — | — |
| 81-82 | — | "**Additive + duża tabela / indeks** → online (`CONCURRENTLY` / stały default) **poza** transakcją." | — | — |

---

## 5. `skills/sailes-database/migration-drizzle.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 1, 3 | `drizzle-kit` | "How to write the migrations from `SKILL.md` Phase 3 with `drizzle-kit`… Drizzle generates SQL from `schema.ts`, so the safe-form work happens in the **generated/edited SQL**, not in the TS schema alone." | — | — |
| 7 | `drizzle-kit generate` | "`drizzle-kit generate` → produces a timestamped `.sql` in the migrations dir + snapshot. **Read the generated SQL** — do not trust it blind for dangerous ops." | — | — |
| 9 | `drizzle-kit migrate` | "`drizzle-kit migrate` (or the app's runner) against a local prod-shaped DB → paste output (Phase 4)." | — | **Fallback**: "or the app's runner" |
| 13 | `drizzle-orm/pg-core` | "import { pgTable, bigint, uuid, text, timestamp, index } from \"drizzle-orm/pg-core\";" | — | — |
| 18 | PG18 native `uuidv7()` / `pg_uuidv7` | "// …or UUIDv7 if the card chose B (PG18 native, else pg_uuidv7):" | **PG18** else extension | Explicit fallback to `pg_uuidv7` |
| 29 | — | "`withTimezone: true` → `timestamptz`. Without it you get `timestamp` — a 🔒 violation." | — | — |
| 33-38 | drizzle-kit runner transaction behaviour | "**Add index concurrently** (drizzle-kit emits plain `CREATE INDEX`; the runner wraps each file in a transaction)… Mark the file so the runner doesn't wrap it (drizzle runs each statement; for CONCURRENTLY keep it a single-statement file and ensure the runner isn't in a txn — see drizzle docs / use a raw `db.execute` migration if needed)." | — | **Fallback**: raw `db.execute` migration |
| 44 | — | "ALTER TABLE deals ALTER COLUMN title SET NOT NULL;   -- PG12+ skips the scan" | **PG12+** | — |
| 56 | — | "Drizzle has no built-in dual-write — model it as **several migrations across several deploys**" | — | Missing feature → manual modelling |
| 59 | `drizzle-kit check`, `drizzle-kit pull` | "`drizzle-kit check` catches snapshot/schema mismatches. For a populated repo, prefer introspection (`drizzle-kit pull`) over guessing the baseline." | — | — |

---

## 6. `skills/sailes-database/migration-prisma.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 1-3 | Prisma Migrate | "How to write the migrations from `SKILL.md` Phase 3 with Prisma Migrate… for dangerous ops you **edit the generated migration SQL** (or use `--create-only`)." | — | — |
| 7 | `prisma migrate dev --create-only` | "`prisma migrate dev --create-only --name <change>` → generates the SQL **without applying it**, so you can edit it first." | — | — |
| 9 | `prisma migrate dev`, `prisma migrate deploy` | "`prisma migrate dev` (local) → paste output (Phase 4). `prisma migrate deploy` for non-dev — **prod needs approval (🔒)**." | — | Hard gate on prod |
| 18 | `uuidv7()` via `dbgenerated` | "// id     String   @id @default(dbgenerated(\"uuidv7()\")) @db.Uuid" | — | "Prisma: generate in app, or DB default via raw" |
| 21-22 | `@db.Timestamptz(6)` | "createdAt DateTime @default(now()) @map(\"created_at\") @db.Timestamptz(6)" | — | — |
| 28 | — | "`@db.Timestamptz(6)` → `timestamptz`. Plain `DateTime` maps to `timestamp` — a 🔒 violation; always annotate." | — | — |
| 32 | Prisma limitation | "Prisma wraps each migration in a transaction and has **no built-in CONCURRENTLY support** — so concurrent index creation must be its **own** migration whose only statement is the index, and you remove transactional wrapping per Prisma's documented pattern (Prisma applies statements without an explicit `BEGIN` for a single-statement file; verify with `migrate diff`)" | — | Missing feature → documented workaround |
| 45 | `--create-only` raw SQL | "**New column, no volatile default** — add nullable → set default → backfill in a separate batched migration (raw SQL via `--create-only`)." | — | — |
| 48 | — | "Prisma will try to generate a single destructive migration (it warns and can drop data). Don't accept it." | — | Explicit "don't accept the tool's output" |
| 51 | `prisma migrate status`, `migrate diff`, `migrate resolve`, `migrate reset` | "`prisma migrate status` / `migrate diff` detect drift between schema, migrations, and DB. Resolve with `migrate resolve` — never `migrate reset` against anything real." | — | Hard prohibition on `migrate reset` |

---

## 7. `skills/sailes-database/migration-safety-checklist.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 3 | `ankane/strong_migrations`; GitLab migration style guide; PostgreSQL docs | "Full rationale + sources → `db-compendium.md` §2 (verified against `ankane/strong_migrations`, GitLab migration style guide, PostgreSQL docs)." | — | — |
| 9 | `disable_ddl_transaction!` | "`CREATE INDEX CONCURRENTLY` **outside** a DDL transaction (`disable_ddl_transaction!` / tool equivalent)" | — | **Fallback**: "/ tool equivalent" |
| 10 | — | "`SET NOT NULL` (PG12+ skips the scan)" | **PG12+** | — |
| 11 | `gen_random_uuid()`, `clock_timestamp()`, `now()` | "**Add column with volatile default** (`gen_random_uuid()`, `clock_timestamp()`, `now()` per-row)… (A **constant** default is safe since PG11 — no rewrite.)" | **PG11+** | — |
| 12 | `in_batches(of: 10000)` | "batches (`in_batches(of: 10000)`) + throttle (`sleep`) + **outside** the DDL transaction" | — | — |
| 14 | Atlas lint rule PG301 | "**Change column type** … table rewrite + ACCESS EXCLUSIVE (e.g. PG301 lint)" | — | — |
| 42 | CRM module manifest tables | "If CRM-integration scope: required tables match the module manifest (`sync_runs`, `idempotency_keys`, `external_object_links`, …)." | — | — |
| 45 | `agentic-first-principles.md`; `security-checklist.md`; `checker`; `qa` | "**Never run a production migration without explicit approval.**… Review = adversarial `checker` (matches spec, follows these rules, no scope creep) + `qa` real-flow proof." | — | Hard gate |

---

## 8. `skills/sailes-database/migration-sql-first.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 1 | node-pg-migrate; sqitch; golang-migrate; Atlas | "# Migration scaffold — SQL-first (node-pg-migrate / sqitch / golang-migrate / Atlas)" | — | — |
| 6 | node-pg-migrate | "**node-pg-migrate** — `export const shorthands = undefined;` and in the migration: `pgm.noTransaction()` at the top → no wrapping txn. Then `pgm.sql('CREATE INDEX CONCURRENTLY ...')`." | — | — |
| 7 | golang-migrate | "**golang-migrate** — by default each migration runs in a txn for Postgres; for CONCURRENTLY put the statement in its own migration and rely on the driver's no-transaction handling (or `x-multi-statement` off + single statement). Verify it doesn't wrap." | — | "Verify it doesn't wrap" — behaviour uncertain, must check |
| 8 | sqitch | "**sqitch** — one change per file; for CONCURRENTLY ensure the deploy script has no explicit `BEGIN`/`COMMIT` around it." | — | — |
| 9 | Atlas (`atlas migrate diff`, `atlas migrate lint`) | "**Atlas** — declarative: define desired state, `atlas migrate diff` plans it; run `atlas migrate lint` (catches destructive/locking ops, e.g. PG301) as the CI gate. Atlas can emit CONCURRENTLY-aware plans." | — | — |
| 14 | `uuidv7()` | "id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- or uuid DEFAULT uuidv7()" | — | — |
| 31 | — | "ALTER TABLE deals ALTER COLUMN title SET NOT NULL;     -- PG12+ skips scan" | **PG12+** | — |
| 38 | `gen_random_uuid()` | "ALTER TABLE deals ALTER COLUMN public_id SET DEFAULT gen_random_uuid();" | — | — |
| 48 | `pg_sleep` | "Loop in the runner (or a DO block with a `LIMIT`/exit + `pg_sleep`), outside a transaction." | — | — |
| 54 | `lock_timeout` | "At the top of risky migrations: `SET lock_timeout = '5s';` (+ retry in the runner)" | 5s | — |

---

## 9. `skills/sailes-diagnose/SKILL.md`

| Line | Tool / service | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 29 | Partner Portal `.ai/lessons.md` (source repo) | "— Partner Portal `.ai/lessons.md:136-146`" | — | — |
| 45 | `sailes-async` | "The system is fine and you want to make it faster — that is `sailes-async`." | — | — |
| 71 | (generic prod tooling) | "Every tool you reach for during diagnosis reads. Nothing writes, restarts, scales, flushes, redeploys, or replays. When a write would help, you **write the exact command out and stop**, and the human runs it." | — | **Hard rule**: write-capable tools forbidden; command handed to human |
| 76-77 | Railway (`dev` env) | "*\"Railway `dev` holds production credentials. A Tokyo→Kyoto smoke test created a real person (42255), a real deal (43001), and sent a real email.\"* — SRF `.ai/lessons.md:151-154`" | — | "there is no harmless environment to test against" |
| 85-88 | `geoprobe`, `vatprobe` (in-repo probe scripts hitting external APIs) | "**Two exceptions, both narrow:** a read-only probe that hits an external API with real credentials is a read and is allowed (`geoprobe`, `vatprobe`)." | — | Allowed exception to read-only rule |
| 95-96 | Partner Portal `.ai/checklists/testing.md` | "*\"When debugging: reproduce the real-time case FIRST — real browser, real login, the exact reported flow — and capture live evidence (request URL + response + console) BEFORE auditing code or forming a hypothesis.\"*" | — | — |
| 106-107 | arXiv 2606.22936 (paper) | "representational commitment peaks around **reasoning step 4**, after which the run mostly defends its early reading while staying superficially coherent (arXiv 2606.22936)" | — | — |
| 112-113 | arXiv 2604.02485 (paper) | "Models default to confirming; deliberately constructing the opposite case measurably improves accuracy (arXiv 2604.02485)." | — | — |
| 128-132 | `alertSlack` / Slack | "*\"`alertSlack` never throws and logs nothing on success, so the storm was INVISIBLE in worker logs — a `grep` for 'slack/alert/failure' returned 0, **giving false confidence that nothing fired**.\"* — SRF `.ai/lessons.md:129`" | — | Silent on success → grep proves nothing |
| 134-137 | local sink; `audit_logs` | "Point the instrument at a sink you control and **count what arrives**… `exactly 2 POSTs total = 1 per lane` and `3 error rows per lane in audit_logs`" | — | — |
| 149-153 | "5 whys" (method — prohibited) | "**Do not use \"5 whys\".** It has no evidence base, a substantial critical literature, and its dominant failure mode … is precisely what a language model produces natively." | — | **Hard prohibition** |
| 157-160 | Kubernetes agent-eval study | "Published agent evaluations show root-cause accuracy far above remediation validity (91–99% vs 37–60% in one Kubernetes study)" | — | — |
| 179-182 | parallel agents / collectors | "fan out **by data source** — logs, audit table, recent diffs and deploys, dependency/external-API status, infra events" | — | Skip fan-out when cause is obvious |
| 222-226 | Reference-file table incl. `../sailes-design/browser-inspect.md` (CDP) | "`../sailes-design/browser-inspect.md` \| **Optional instrument** for Step 1 Live — capturing console, request/response bodies and storage over CDP, and attaching to an already-running browser so state-dependent bugs are observable in the state that produced them. §4 also restates the read-only-on-production and no-dialog constraints as they apply to a browser." | — | Explicitly **optional** |

## 10. `skills/sailes-diagnose/diagnosis-loop.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 39-45 | `chrome-devtools` MCP server (`list_console_messages`, `list_network_requests`, `get_network_request`, `evaluate_script`); Playwright | "**Capturing it, if the `chrome-devtools` MCP is available** (optional — see `../sailes-design/browser-inspect.md` §4): `list_console_messages` for the console half, `list_network_requests` → `get_network_request` for URL + status **and body** … `evaluate_script` to read `localStorage`/`sessionStorage`/cookies — the state your theory rests on. Absent it, a Playwright script with `page.on('console')` and `page.on('response')` produces the same evidence for more setup; either way the evidence log is what matters, not the tool." | — | **Explicit fallback**: Playwright script when MCP absent; "the evidence log is what matters, not the tool" |
| 47-51 | `chrome-devtools` write-capable tools (`click`, `fill`, `evaluate_script`); `alert`/`confirm`/`prompt` | "**read-only on production** — `click`/`fill`/`evaluate_script` can write, and a POST from a UI is still a write, so on a production surface restrict yourself to snapshot/console/network/storage and write the mutating step out for the human. And **never trigger `alert`/`confirm`/`prompt`** — a modal dialog blocks the CDP channel and the session stops responding mid-investigation." | — | Hard constraint; dialogs hang the CDP channel |
| 56-57 | Playwright | "A Playwright context starting fresh *structurally cannot* reproduce a stale-localStorage bug; you must pre-seed the stale state to see it at all." | — | Structural limitation named |
| 60-64 | `chrome-devtools` server + `--browserUrl http://127.0.0.1:9222` | "the `chrome-devtools` server does not start fresh — its default profile persists across calls, and `--browserUrl http://127.0.0.1:9222` attaches to an already-running browser holding the real session." | port 9222 | — |
| 108-110 | `git bisect run` | "**Bisection.** Split the space and test the boundary — commits (`git bisect run` with a bug-revealing script, ~7 tests for 100 commits), or the pipeline… Needs an unambiguous good/bad oracle; useless for never-worked bugs and flaky failures." | — | Useless without a good/bad oracle |
| 116-117 | `noprice404probe.ts` (in-repo probe) | "it is why `noprice404probe.ts` carries 12 real production cases *plus 2 controls*" | — | — |
| 121-122 | observability tooling (generic) | "This is what a good observability tool automates, and it is reimplementable by hand over any dimensional dataset." | — | **Fallback**: hand-implementable |

## 11. `skills/sailes-diagnose/incident-template.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 56 | `audit_logs` (Postgres table) | "\| E1 \| audit_logs \| `select … where submission_id='…'` \| 3 error rows, last step `price` \|" | — | — |
| 57 | node; `tsx` loader; `vatprobe` | "\| E2 \| vatprobe \| `node --import tsx apps/worker/vatprobe.ts VA` \| HTTP 204, empty body \|" | — | — |
| 58 | control probe | "\| E3 \| control \| same probe, `PL` \| HTTP 200, valid JSON \|" | — | — |
| 79 | `client-vats` (internal service calling external VAT API) | "> `client-vats` returns 204 empty for microstates [E2] → `response.ok` is true → `response.json()` throws [E1]" | — | — |
| 123-130 | `.ai/specs/`, `.ai/lessons.md` | "**`.ai/incidents/` is separate from `.ai/specs/`** on purpose." | — | — |

## 12. `skills/sailes-diagnose/probe-patterns.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 5-6 | SRF orchestrator `apps/worker/` probes | "Distilled from 59 real throwaway probe scripts in the SRF orchestrator's `apps/worker/`." | — | — |
| 9-10 | `timing.ts` | "delete it when the incident closes (or keep it if it earned its place, like `timing.ts`)." | — | — |
| 71-77 | `noprice404probe.ts`; external price engine | "`noprice404probe.ts` carries 12 real production cases taken verbatim from the `bookings` rows **plus 2 cases known to work**… *\"the price engine does not price ITALY AT ALL … the Italy control 404s too\"*" | — | Without controls the finding is wrong |
| 88-92 | durable workflow engine (event dedupe — Inngest-shaped) | "**A fresh event id is required.** The engine dedupes on event id, so resending the original id produces no new run at all — it looks like the replay silently failed." | — | Silent no-op on duplicate id |
| 100-102 | replay guard | "**It aborts rather than risking a duplicate, and it aborts if it cannot verify at all.** A guard that fails open is not a guard." | — | **Fail-closed** required |
| 108-111 | `railway run`; node; `tsx` | "```\nrailway run -s Postgres -e dev -- node --import tsx apps/worker/<probe>.ts <arg>\n```" | — | — |
| 114-117 | `DATABASE_PUBLIC_URL` vs `DATABASE_URL` | "use **`DATABASE_PUBLIC_URL`**, not `DATABASE_URL` — the private hostname does not resolve from outside the platform's network" · "run from **inside the package that owns the DB client**, or the driver does not resolve" | — | Named failure modes for both |
| 119-121 | Railway `dev` env | "in this setup the `dev` environment holds **production** credentials. A probe that reads is safe. A probe that writes creates real customer-visible records" | — | — |
| 125-132 | **graphify** (`graphify path`, `graphify explain`, `graphify update .`, `graphify-out/graph.json`) | "## Graph probe (when the repo has graphify-out/graph.json)\n\nMechanism tracing without spelunking: `graphify path \"<symptom site>\" \"<suspected cause>\"` returns the concrete hop chain (each edge tagged EXTRACTED/INFERRED — cite the tag; INFERRED edges are hypotheses, not evidence). `graphify explain \"<component>\"` lists everything that can reach it… Read-only, local, safe on production incident work. Verify freshness first (`graphify update .` is AST-only and free); never build evidence on a stale graph." | — | **Conditional**: only when `graphify-out/graph.json` exists; stale graph = not evidence |

## 13. `skills/sailes-diagnose/traps.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 12-14 | `alertSlack` / Slack | "*\"`alertSlack` never throws and logs nothing on success, so the storm was INVISIBLE in worker logs — a `grep` for 'slack/alert/failure' returned 0, **giving false confidence that nothing fired**.\"* — SRF `lessons.md:129`" | — | Silent instrument |
| 18-19 | Slack | "One booking generated ten real Slack alerts while the logs showed nothing." | — | — |
| 35 | Postgres FK (`deal_quotes.deal_id`) | "*\"wrong id in `deal_quotes.deal_id` → **saves fine and is then invisible forever**…\"* — Partner Portal `lessons.md:222-236`" | — | Write succeeds silently, never read |
| 50-52 | Pipedrive API; `fetch` mock | "*\"the fake Pipedrive `fetch` returned success for any method, and **the tests *asserted* PATCH (encoding the bug)**.\"* — SRF `lessons.md:38` (the API required PUT)" | Pipedrive API requires **PUT**, not PATCH | Mock accepting anything proves nothing |
| 68-69 | `tsx`; `node dist` | "*\"package `exports` → `src/*.ts` boots under tsx, crashes under `node dist`. **Production had literally never been booted via plain `node`.**\"* — SRF `lessons.md:86`" | — | tsx masks the prod resolution path |
| 88 | Postgres (native install holding a port) | "`\"password authentication failed\"` retried nine times had a real cause of a native Postgres holding the port." | — | — |
| 89-90 | trace UI (observability) | "A trace UI showing two spans per step showed **one execution** — verified on two environments — and the misleading UI *\"cost real human time to diagnose\"*." | — | Tool itself misleads |
| 98-99 | audit table Δ arithmetic | "*\"**audit Δ is time-since-previous-completion, not a step's own duration/start**\"* — SRF `lessons.md:63`" | — | — |
| 106-107 | PowerShell `Invoke-WebRequest`; Vite dev server; `curl.exe` | "PowerShell's `Invoke-WebRequest` **falsely 404s** against a Vite dev server — use `curl.exe`. When a result is bizarre, verify the instrument before theorising about the system." | — | **Explicit substitution**: use `curl.exe` instead |
| 111-117 | `AGENTS.md`, `logika_biznesowa.md`, `CLAUDE.md` (docs as unreliable) | "*\"Batch cron 8:00/16:00 does NOT select winners — it is LEGACY and unused. **`AGENTS.md`, `logika_biznesowa.md` and `CLAUDE.md` all still claim otherwise — they are wrong.**\"*" | — | Docs are claims to verify |
| 133 | — | "**A parenthetical in a doc is not a gate.**" | — | — |
| 147-149 | ADR-010; Google Maps outage | "*\"ADR-010 is accepted and written, code is not, so a Maps outage tomorrow behaves exactly as it did on 07-09/07-14/07-16.\"* — SRF `STATE.md`" | — | Decision recorded ≠ defence deployed |
| 171-177 | Railway `dev` | "*\"Railway `dev` holds production credentials. A Tokyo→Kyoto smoke test created a real person (42255), a real deal (43001), and sent a real email.\"* — SRF `lessons.md:151-154`, marked CRITICAL … **Every live test is a production write.**" | — | No safe environment exists |

## 14. `skills/sailes-discovery/SKILL.md`

| Line | Tool / service | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 18 | `sailes-bootstrap`/`stack-baseline.md` | "Even when a baseline exists (it does — see `sailes-bootstrap`/`stack-baseline.md`), present it as *\"I recommend X because Y…\"*" | — | — |
| 52 | `.ai/specs/` or `docs/specs/`; local `spec-writing` skill | "Is there a `.ai/specs/` (or `docs/specs/`) folder and a `spec-writing` skill? Note it — it decides the handoff (see Step 4)." | — | Decides handoff branch |
| 53 | `explorer` / `Explore` agent | "do a **light** recon (or dispatch one `explorer`/`Explore` agent) to find whether the thing already exists" | — | Optional ("or") |
| 58 | `AskUserQuestion` | "Ask in **rounds of 3-4 questions** using `AskUserQuestion` (so the user clicks, doesn't write essays)." | — | — |
| 105 | `sailes-bootstrap/deciding-under-uncertainty.md` | "**settle it by measurement** — an A/B run, a spike, a probe of the actual tool, or one number… Full method: `sailes-bootstrap/deciding-under-uncertainty.md`." | — | — |
| 107 | Drizzle; Prisma; Better Auth; Clerk; Railway; Vercel; Neon; durable workflow engine | "The detailed stack/architecture decision cards (Drizzle vs Prisma, Better Auth vs Clerk, Railway vs Vercel+Neon, single- vs multi-tenant, sync depth, durable workflow engine…) are owned by **`sailes-bootstrap`** (Phase 2), which has the researched trade-offs." | — | Not decided here — deferred to bootstrap |
| 113 | — | "Who **commissioned** this (sales lead / IT / exec)" | — | — |
| 117 | Railway; Vercel; AWS; VPS; Postgres; SSO; Google Workspace | "which hosting (Railway/Vercel/AWS/VPS — and which *services* already run there)? Is there an **existing Postgres/DB** to reuse or must we create one? Existing **auth / SSO / Google Workspace tenant**? **Other apps sharing a stack/conventions** we should match or reuse?… Surface constraints (VPN, IP allowlist, data residency) before designing." | — | — |
| 118 | CRM/API; Make; Zapier; n8n | "for each external system (CRM/API): which **plan/tier** (does it even have API/webhooks)? Existing **configuration** that constrains us (CRM pipeline stages, **custom fields**, deal/contact shape)? Existing **data volume**…? Other automations (Make/Zapier/n8n) already touching it that could conflict? **Direction of truth** per field for any two-way sync." | plan/tier gates API+webhook availability | Must check tier before assuming API exists |
| 119 | — | "**the stack is a set of decisions, each presented as a decision card in `sailes-bootstrap` Phase 2**" | — | — |
| 120 | serverless / containers / VM / managed PaaS | "where does it run (serverless / containers / single VM / managed PaaS)?" | — | — |
| 121 | GDPR / HIPAA / PCI | "**Data & compliance** — PII? GDPR/HIPAA/PCI? Data residency? Encryption/audit needs?" | — | — |
| 122 | payments, auth providers, email, telematics, 3rd-party APIs | "**Integrations** — payments, auth providers, email, telematics, 3rd-party APIs?" | — | — |
| 124 | `.ai/backlog.md` | "**Anything deferred-but-worth-keeping … goes into `.ai/backlog.md`** … (Bootstrap generates `.ai/backlog.md`; if absent, note the items for it.)" | — | **Fallback if absent**: note items for it |
| 136 | agent roles (explorer→designer→be-dev→fe-dev→checker→qa); `sailes-bootstrap/agent-team-structure.md` | "which agent roles realize it (explorer → designer → be-dev → fe-dev → checker → qa) and in what dependency order? The implementation gate is that the **BE contract is finalized before `fe-dev` starts**" | — | — |
| 168-175 | `sailes-bootstrap`; local `.ai/skills/spec-writing/`; global `sailes-spec` | "**Local `spec-writing` skill exists** (e.g. `.ai/skills/spec-writing/`): hand the brief to it… **No local spec skill** …: **invoke the global `sailes-spec` skill**… `sailes-spec` is the fallback whenever no local copy exists." | — | **Explicit fallback chain** |
| 177 | TeamCreate + roles | "Per the project's team workflow, the agent team (TeamCreate + roles) starts at *implementation*, not during elicitation" | — | — |

## 15. `skills/sailes-discovery/brief-template.md`

| Line | Tool / service | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 36-37 | (stack placeholders) | "## Tech Stack\n- Constraints / chosen stack: {language, framework, DB}\n- Existing systems to integrate:" | — | — |
| 40 | serverless / containers / VM / managed PaaS | "- Runtime target: {serverless \| containers \| VM \| managed PaaS}" | — | — |
| 46 | GDPR / HIPAA / PCI | "- Regulatory: {GDPR \| HIPAA \| PCI \| none}" | — | — |
| 50 | payments, auth, email, telematics, 3rd-party APIs | "- {payments, auth, email, telematics, 3rd-party APIs...}" | — | — |
| 62 | (stack decisions ledger) | "\| {stack/ORM/auth/hosting/tenancy/integration depth/role model…} \| {choice} \| user \| {alternatives + one-line why-not} \|" | — | — |
| 70, 124 | local spec-writing skill; `.ai/specs/` | "- Handoff: {local spec-writing skill \| self-written spec at .ai/specs/...}" | — | Fallback to self-written spec |
| 114 | agent roles | "- Dependency order: explorer → designer → be-dev → fe-dev → checker → qa" | — | "drop roles that don't apply" |

## 16. `skills/sailes-hosting/SKILL.md`

| Line | Tool / service | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 4-18 (frontmatter) | Railway; Postgres (`DATABASE_URL`); S3 Storage Bucket; Volume; `railway logs`/`link`/`variables`; pnpm monorepo; Inngest (self-hosted); Redis; Dockerfile; Nixpacks; `RAILWAY_DOCKERFILE_PATH`; `railway.json`; `railway status --json`; OAuth `redirect_uri` | "Użyj ZAWSZE gdy: wdrażasz/deployujesz na Railway, ustawiasz zmienne środowiskowe … podłączasz bazę Postgres (DATABASE_URL), storage plików (S3 bucket, Storage Bucket) lub Volume (trwały dysk) … czytasz logi przez railway CLI (railway logs / link / variables) … Użyj TAKŻE przy wdrożeniu monorepo pnpm / wielu serwisów (api+worker+self-hosted Inngest+ Postgres+Redis): Dockerfile vs Nixpacks, „tsc: not found" na buildzie, RAILWAY_DOCKERFILE_PATH, kasowanie railway.json, przypięty branch serwisu (branch: None buduje default), railway status --json jako źródło prawdy, config-as-code trap, region EU/RODO, sieć prywatna railway.internal, self-hosted Inngest, „dev trzyma prod-owe credki"." | — | — |
| 16-17 | Railway as reference platform | "Platforma referencyjna = Railway; zasady (env parity, ephemeral FS, warstwy storage, smoke po deployu) przenoszą się na inne hostingi." | — | **Portability statement**: principles transfer to other hosts |
| 25 | Fastify; Drizzle; Postgres | "daje **nasz sposób** hostowania backendu Sailes (Fastify + Drizzle + Postgres + integracje)" | — | — |
| 27-30 | Idealny Wzrok / `custom-overlay-app`; SRF / Volubus; Inngest; Postgres; Redis | "**pojedynczy serwis** (Idealny Wzrok / `custom-overlay-app`, Fastify + Postgres)… **monorepo + multi-serwis async** (SRF / Volubus — `api` + `worker` + self-hosted Inngest + Postgres + Redis, 5 serwisów, EU/RODO)" | 5 services | — |
| 32-34 | Railway docs | "> **Oficjalna dokumentacja (źródło prawdy):** <https://docs.railway.com>.\n> Gdy coś się nie zgadza z tym plikiem — wygrywa docs Railway + faktyczny stan w dashboardzie.\n> Ten skill starzeje się szybciej niż platforma; traktuj go jak mapę, nie jak wyrocznię." | — | **Precedence rule**: Railway docs + dashboard win over this file |
| 50-51 | Fastify; Postgres; Worker; Redis | "├─ App        → nasz backend (Fastify), buduje się z gita\n         ├─ Postgres   → baza (wstrzykuje DATABASE_URL)\n         └─ (opcjonalnie) Worker / Redis / drugi serwis" | — | Worker/Redis optional |
| 55 | Docker / Nixpacks | "Railway wykrywa push, buduje obraz (Docker/Nixpacks), odpala komendę startową, sprawdza healthcheck, przełącza ruch." | — | — |
| 58 | reference variable `${{Postgres.DATABASE_URL}}` | "łączą się przez *reference variable* (`${{Postgres.DATABASE_URL}}`)" | — | — |
| 64-67 | env vars; Postgres; Storage Bucket (S3, `storage.railway.app`, 5× `S3_*`); Volume | "\| Pliki / bloby (upload, PDF, ZC2) \| **Storage Bucket (S3)** \| 5× `S3_*` (endpoint `storage.railway.app`) \|" | — | — |
| 69-72 | ephemeral FS | "🔒 **Reguła efemerycznego FS (najczęstszy błąd):** system plików kontenera **kasuje się przy każdym deployu/restarcie**… Trwałe = **Volume** (mount) albo **S3** (upload)." | — | Files vanish on redeploy |
| 84-85 | `sailes-pipedrive`; `sailes-database`; `release-checklist.md` | "**Nie tu:** logika domenowa integracji → `sailes-pipedrive` / kod. Schemat bazy i migracje jako takie → `sailes-database`." | — | — |
| 103 | `maskPeselInString` | "Sekrety tylko w env Railway; w logach maskuj (`maskPeselInString`). `.env.example` = pełna lista kluczy (bez wartości)" | — | — |
| 110 | `git ls-tree`; `railway status --json` | "Zweryfikuj `git ls-tree <remote>/<branch>` zanim uznasz, że „wypchnąłem zmianę". W multi-serwis sprawdź przypięty branch wprost: `railway status --json` → `source.branch` (`None` = buduje default)." | — | `None` → builds default branch |
| 111-113 | Nixpacks/Railpack; `tsc`; Dockerfile; `RAILWAY_DOCKERFILE_PATH`; `railway.json` | "**Monorepo pnpm → Dockerfile-first, nie Nixpacks.** Nixpacks/Railpack buduje z `NODE_ENV=production` → pomija devDeps → `tsc: not found`. Commituj `Dockerfile` per app + `RAILWAY_DOCKERFILE_PATH`, skasuj wszystkie `railway.json`" | — | Named failure mode + prescribed substitution |
| 114-116 | `railway status --json` | "**Ground truth = `railway status --json`, nie dashboard.** Pola serwisu (`build.builder`, `dockerfilePath`, `startCommand`, `configErrors`) mówią, co Railway NAPRAWDĘ zrobił" | — | Dashboard is not authoritative |
| 119-120 | `railway logs` | "**Weryfikuj `railway logs`, nie przeczuciem.** „Health 200" nie znaczy „nowy build" ani „działa"." | — | — |
| 121-123 | Railway `dev` env creds | "**Prod zatwierdza człowiek.** Agent nie pushuje na branch deployowy bez wyraźnej prośby (bezpiecznik projektu #5)… **`dev` może trzymać PROD-owe credki integracji** (brak sandboxu)" | — | No sandbox exists |

## 17. `skills/sailes-hosting/references/env-i-sekrety.md`

| Line | Tool / var | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 10-13 | Railway dashboard; `railway variables`; `railway variables --set`; Raw editor | "**CLI:** `railway variables` (lista), `railway variables --set KLUCZ=wartosc` (ustaw)." | — | — |
| 20-24 | `.env.example`; `loadConfig()` / `process.env.X`; `release-checklist.md`; `DRY_RUN` | "Przed deployem: **parytet** — czy każdy klucz z `.env.example` istnieje w env Railway? Brakująca zmienna = crash na starcie albo cichy zły tryb (np. `DRY_RUN` zostaje `true`)." | — | **Missing var → crash or silent wrong mode** |
| 25-26 | — | "Walidacja na starcie: kod powinien twardo failować, gdy brakuje krytycznej zmiennej (lepiej crash z jasnym komunikatem niż działanie w złym trybie)." | — | **Hard failure preferred** |
| 33 | `${{Postgres.DATABASE_URL}}` | "DATABASE_URL = ${{Postgres.DATABASE_URL}}" | — | — |
| 43-44 | Pipedrive / Thulium / Medfile; `git filter-branch` | "Jeśli sekret wyciekł do gita — rotuj u źródła (Pipedrive/Thulium/Medfile), nie licz na `git filter-branch`." | — | `git filter-branch` explicitly not to be relied on |
| 45-46 | `FIELD_ENCRYPTION_KEY` | "Klucze szyfrujące (`FIELD_ENCRYPTION_KEY`) — utrata = utrata dostępu do zaszyfrowanych pól (np. PESEL w `patient_identifiers`). Trzymaj bezpiecznie i **nie zmieniaj** bez planu re-encrypt." | — | Loss = permanent data inaccessibility |
| 53-60 | `PIPEDRIVE_DRY_RUN` | "PIPEDRIVE_DRY_RUN = true   # test: zwraca syntetyczne ID (np. 900001), NIE dotyka realnego Pipedrive… **Gotcha:** wdrożony serwis z `DRY_RUN=true` „działa", ale nic realnie nie zapisuje. Gdy user mówi „stworzyłem leada a nic nie ma w Pipedrive" — sprawdź tę flagę PIERWSZĄ." | — | Silent no-op writes |
| 67-69 | Pipedrive Developer Hub Callback URL | "**OAuth `redirect_uri`** (Pipedrive Developer Hub → Callback URL): `https://custom-overlay-app-dev.up.railway.app/oauth/callback` — literalnie to samo co w kodzie. Rozjazd (http/https, ukośnik na końcu, inny host) → `redirect_uri mismatch` / „Something went wrong"." | must match character-for-character | Named failure |
| 70-71 | Thulium; Medfile webhooks | "**Webhooki** (Thulium, Medfile) → URL z sekretem w ścieżce, np. `.../webhooks/thulium/<THULIUM_WEBHOOK_SECRET>`." | — | — |
| 72 | custom domain | "Zmiana domeny (custom domain) = trzeba przerejestrować WSZYSTKIE te URL u dostawców." | — | — |
| 80-87 | Full project variable catalogue: `DATABASE_URL`; `FIELD_ENCRYPTION_KEY`; `MEDFILE_*` (RS256 keys, API URL, master/child); `PIPEDRIVE_API_TOKEN`, `PIPEDRIVE_DOMAIN`, `PIPEDRIVE_DRY_RUN`, `PIPEDRIVE_CLIENT_ID`, `PIPEDRIVE_CLIENT_SECRET`, `PIPEDRIVE_PANEL_JWT_SECRET`; `MEDFILE_WEBHOOK_SECRET`, `THULIUM_WEBHOOK_SECRET`; `SAILES_FORMS_KEY`, `FORMS_LOG_DIR`; `THULIUM_API_USER/PASS/BASE_URL`; `S3_ENDPOINT/REGION/BUCKET/ACCESS_KEY/SECRET_KEY` | "\| Medfile \| `MEDFILE_*` (klucze RS256, URL API, master/child) \| PROTECTED CORE — patrz kod, nie zgaduj \|" · "\| Pipedrive \| … \| token routinguje po instancji (sprawdź `/v1/users/me`); JWT panelu HS256 = client_secret \|" · "\| Thulium API \| `THULIUM_API_USER`, `THULIUM_API_PASS`, `THULIUM_API_BASE_URL` \| Basic auth; enrich nazwiska + click-to-call; default base `https://idealnywzrok.thulium.com/api` \|" · "\| Storage plików \| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` \| Railway Storage Bucket \|" | Medfile RS256; Pipedrive panel JWT **HS256**; Thulium **Basic auth** | Medfile marked "PROTECTED CORE — patrz kod, nie zgaduj" |
| 89-90 | `.env.example` in integrations repo | "Lista bywa nieaktualna szybciej niż kod — **`.env.example` w repo integrations jest źródłem prawdy**." | — | Catalogue is a map, not a substitute |

## 18. `skills/sailes-hosting/references/monorepo-multi-serwis.md`

| Line | Tool / service | Verbatim quote | Version constraint | Absent-behaviour |
|---|---|---|---|---|
| 4-6 | pnpm monorepo; `apps/api`; `apps/worker`; self-hosted Inngest; Postgres; Redis; Railway `dev`; EU/RODO | "pnpm monorepo z kilkoma deployowalnymi bytami: `apps/api` (intake webhooka) + `apps/worker` (funkcje Inngest) + **self-hosted Inngest** + Postgres + Redis. To destylat z realnego wdrożenia 5-serwisowego (projekt SRF / Volubus, `dev` env, EU/RODO), potwierdzony na żywym systemie — nie z teorii." | 5 services | — |
| 8 | Fastify + Postgres single service | "Pojedynczy serwis Fastify+Postgres → wystarczy [`railway-topologia-i-cli.md`](railway-topologia-i-cli.md)." | — | — |
| 13-16 | Dockerfile; Nixpacks/Railpack | "## 1. 🔒 Dockerfile-first, NIE Nixpacks/Railpack (to jest THE recurring pain)\n\n**Reguła:** dla monorepo pnpm na Railway **domyślnie commituj `Dockerfile` per app**. Nixpacks/Railpack wraca jak bumerang z tym samym błędem i nie ma na to pewnego obejścia." | — | **No reliable workaround** for Nixpacks |
| 18-22 | Nixpacks; `NODE_ENV`; `tsc`; `typescript` devDep; pnpm cache store | "**Dlaczego Nixpacks pada:** buduje z `NODE_ENV=production`, co **pomija devDependencies** → `tsc: not found` na buildzie (`typescript` to devDep). `--prod=false` ani inline `NODE_ENV=development pnpm install` w buildCommand **nie naprawiają tego niezawodnie** — Nixpacks odpala własną fazę `pnpm i` (przed Twoją komendą) już jako prod-only, a interakcja z cache store'a pnpm zostawia brakujące devDeps." | — | Two named workarounds explicitly **do not work reliably** |
| 24-26 | Dockerfile; `docker compose` | "**Dockerfile izoluje build od `NODE_ENV` serwisu** … tak samo jak lokalny `docker compose`." | — | — |
| 30-43 | `node:22-slim`; `corepack`; `pnpm@8.15.9`; `RAILWAY_DOCKERFILE_PATH` | "FROM node:22-slim\n\nRUN corepack enable && corepack prepare pnpm@8.15.9 --activate" · "RUN pnpm install --frozen-lockfile" · "RUN pnpm --filter @scope/<app>... build" | **node:22-slim**, **pnpm@8.15.9** (pinned) | — |
| 46-57 | root `.dockerignore` | "Root `.dockerignore` (bez tego kontekst puchnie i przecieka sekret):" (entries: `node_modules`, `**/node_modules`, `**/dist`, `.git`, `*.log`, `.env`, `.env.*`, `packages/db/data`) | — | Without it: bloated context + secret leakage |
| 59-60 | `RAILWAY_DOCKERFILE_PATH`; `railway variables --set` | "Wskazanie Dockerfile per serwis: **zmienna serwisu `RAILWAY_DOCKERFILE_PATH`** (np. `apps/worker/Dockerfile`) — TO jest ustawialne przez `railway variables --set`." | — | — |
| 62-68 | `railway.json`; Docker `CMD` | "🔒 **Gdy przechodzisz na Dockerfile — SKASUJ wszystkie `railway.json`.** Per-app `railway.json` (`deploy.startCommand` / `build.builder`) **konfliktuje** z Dockerfile nawet przy poprawnym okablowaniu. Realny objaw: serwis `worker` *zbudował* `@scope/worker` przez Docker, ale *wystartował* `@scope/api` … → crash loop `Cannot find module /app/apps/api/dist/index.js`. Docker `CMD` **nie ma gwarancji, że wygra** z dwoma źródłami prawdy." | — | Named crash-loop failure |
| 72-92 | `railway status --json` fields | "```bash\nrailway status --json\n```\n\nZejdź do `environments[].node.serviceInstances[].node` i czytaj:" — fields `source.branch`, `startCommand`, `latestDeployment.meta.serviceManifest.build.builder` (`RAILPACK` vs `DOCKERFILE`), `…build.dockerfilePath`, `…deploy.startCommand`, `latestDeployment.meta.configErrors` | — | "Dashboardowe pola i `railway variables` **nie mówią, co się stało na ostatnim deployu**" |
| 96-104 | GitHub default branch; Railpack | "`source.branch = None` na serwisie → Railway buduje **domyślny branch repo** (np. `master`), a nie branch z Twoimi Dockerfile'ami/fixami (np. `dev`) → cichy fallback na Railpack i budowa starego/złego kodu. `RAILWAY_DOCKERFILE_PATH` jest **konieczny, ale nie wystarczający**" | — | **Silent fallback to Railpack** |
| 103-104 | `git ls-tree` | "`git ls-tree <remote>/<branch> <path>` mówi tylko, co jest na branchu — **nie** który branch buduje serwis z `branch: None`." | — | Tool insufficient for this question |
| 106-109 | `railway service source connect` | "**`railway service source connect --branch <b> --service <svc>` JEST ZEPSUTE** dla istniejących serwisów — zwraca `ServiceInstance not found` niezależnie od wersji CLI (potwierdzone 5.5.0 i 5.25.0), selektora … i nawet po `source disconnect`. **Nie trać na to więcej niż jednej próby.**" | **CLI 5.5.0 and 5.25.0** both broken | **Hard failure** — 4 ranked workarounds follow |
| 111-117 | Railway dashboard; `gh repo edit`; `railway up`; `railway add --repo … --branch` | "1. **Dashboard → Service → Settings → Source → Branch = `dev`** — jedyny niezawodny fix.\n2. `gh repo edit owner/repo --default-branch dev` …\n3. `railway up` — deploy lokalnego checkoutu, omija rozwiązywanie brancha z gita. **Uwaga:** NIE omija pułapki config-as-code z §4…\n4. Przy **tworzeniu** serwisu z CLI: `railway add --repo … --branch dev -s <name>` ustawia branch poprawnie od razu" | — | Ranked fallback ladder; only dashboard is reliable |
| 121-135 | Railway "Config-as-code file path" dashboard field; `railway variables`; Railpack | "Per-serwis ustawienie **Settings → Config-as-code file path** … **nie jest env varem** (niewidoczne w `railway variables`), **nie da się go ustawić/wyczyścić z CLI** — tylko dashboard, **cicho nadpisuje** wszystko inne, łącznie z `RAILWAY_DOCKERFILE_PATH`… Railway **nie pada głośno — cicho spada na Railpack**… `railway up` też tego nie omija." | — | **Silent override + silent Railpack fallback**; CLI cannot fix |
| 139-149 | `railway scale`; regions `eu-west`/`us-west`/`us-east`/`sfo`; Postgres/Redis | "## 5. Region: `railway add`/GitHub-integration nie ma flagi regionu → domyślnie US\n\n```bash\nrailway scale <svc> eu-west=1 us-west=0 us-east=0\n```\n\n- Aliasy istniejących serwisów: `us-west` / `eu-west`; świeży serwis potrafi odrzucić `sfo`.\n- **Stateful** (Postgres/Redis) łapią krótki downtime migracji wolumenu przy skalowaniu" | default region = US | Region flag missing → manual `railway scale` |
| 155-166 | `<service>.railway.internal`; `RAILWAY_PRIVATE_DOMAIN`; `PORT`; `railway domain -s <service> --port <port>`; Inngest `--sdk-url` | "Serwisy gadają po prywatnej sieci: **`<service>.railway.internal`** (`RAILWAY_PRIVATE_DOMAIN`)…\n- **Railway wstrzykuje `PORT` tylko serwisowi z publiczną domeną.** Serwis internal-only (np. `worker`) `PORT`-a nie dostaje → … **przypnij `PORT` jawnie** … (np. `worker` → `PORT=3001`, żeby zgadzał się z `--sdk-url` Inngesta)." · "Domyślnie żaden serwis nie ma publicznej domeny. Serwis z domeną dostaje `PORT` wstrzyknięty automatycznie (np. `api` → 8080); internal-only nie." | worker `PORT=3001`, api `8080` | Internal-only service gets no `PORT` → pin manually |
| 167-168 | dual-stack bind | "App bindują dual-stack `::` na `process.env.PORT` → log `Server listening at http://[::]:8080` jest **normalny**, nie błąd." | — | — |
| 173-174 | Inngest Docker image | "Obraz **pinuj** (`inngest/inngest:v1.35.0`), nie `latest`. Port `8288` = Event API + API + Dashboard. **Ten obraz nie honoruje wstrzykniętego `$PORT`** — ustaw `--port=8288` jawnie (i/lub `INNGEST_PORT`)." | **`inngest/inngest:v1.35.0`** pinned; port 8288 | Image ignores injected `$PORT` |
| 175-184 | `inngest start`; `INNGEST_POSTGRES_URI`, `INNGEST_REDIS_URI`, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`; `openssl rand -hex 32` | "```\ninngest start --sdk-url=http://worker.railway.internal:3001/api/inngest --poll-interval=60\n```\n  Klucze **hex, parzysta długość** (`openssl rand -hex 32`) — nie-hex signing key **crashuje serwer na boot**. Alternatywnie te same wartości można podać jako flagi (`--postgres-uri` / `--redis-uri` / `--event-key` / `--signing-key` / `--port=8288`) zamiast env" | keys hex, even length; poll-interval 60 | **Non-hex signing key crashes server on boot**; flags are an alternative to env |
| 185-190 | Inngest self-host health check (GraphQL `/v0/gql`); `curl`; `/v0/apps` | "**Health-check self-host = GraphQL, nie REST.** `/v0/apps` zwraca 404; pole `synced` na `apps` nie istnieje. Zdrowie = `error:null` + niepusta `functions`:\n```bash\ncurl -s -X POST \"https://<inngest-domain>/v0/gql\" -H \"Content-Type: application/json\" \\\n    -d '{\"query\":\"{ apps { id name url error functions { name slug } } }\"}'\n```" | — | REST endpoint 404s — must use GraphQL |
| 191-196 | Postgres (two DBs); Drizzle `__drizzle_migrations`; Redis | "**Jeden Postgres, dwie bazy** (decyzja właściciela — taniej niż drugi plugin): app używa domyślnej bazy `railway` (`DATABASE_URL`), Inngest osobnej `inngest` … (`CREATE DATABASE inngest;`), adresowanej `INNGEST_POSTGRES_URI` po internal hoście `postgres.railway.internal` ze ścieżką `/inngest`… **Nie odpalaj migracji Drizzle na bazie `inngest`.** Redis (osobny plugin) czyta **tylko** Inngest." | — | Hard prohibition on running Drizzle migrations against `inngest` DB |
| 197-198 | `inngest dev`; `INNGEST_DEV=1`; `INNGEST_SERVE_HOST`; `host.docker.internal` | "Lokalnie odwrotnie: `inngest dev --no-discovery -p 8288` (bez kluczy; SDK łączy się przez `INNGEST_DEV=1`). W kontenerze dev rejestracja workera z hosta: `INNGEST_SERVE_HOST=http://host.docker.internal:3001`." | — | — |
| 202-214 | `railway login`; `RAILWAY_TOKEN`; `setx`; PowerShell `[Environment]::SetEnvironmentVariable` | "Sesja `railway login` (przeglądarkowa) **wygasa w trakcie** → `railway status --json` zwraca pusto / `Unauthorized` → `railway login` ponownie. Dla użycia headless/agentowego token **musi** być w rejestrze env User/Machine, nie tylko w bieżącej powłoce:\n\n```powershell\nsetx RAILWAY_TOKEN <token>            # albo:\n[Environment]::SetEnvironmentVariable('RAILWAY_TOKEN', $token, 'User')\n```" | scope **User/Machine** | Expired session → empty/`Unauthorized`; shell-only `$env:` is **not inherited** |
| 216-219 | `node --env-file` | "**Warstwowanie env `--env-file` = LAST-file-wins.** `node --env-file=.env --env-file=override.env` → późniejszy plik **nadpisuje** wcześniejszy dla tego samego klucza (tylko ambient `process.env` nigdy nie jest nadpisany)." | — | — |
| 224-231 | `DATABASE_URL` internal; `railway run`; `DATABASE_PUBLIC_URL`; `railway variables --json`; `python -c`; `pg` package | "Wewnętrzny `DATABASE_URL` (`*.railway.internal`) jest **nieosiągalny spoza** sieci Railway, a `railway run <cmd>` wykonuje komendę **lokalnie** (tylko wstrzykuje env) → też nie dosięgnie internal hosta. Użyj **`DATABASE_PUBLIC_URL`**:\n```bash\nrailway variables -s Postgres --json \| python -c \"import sys,json;print(json.load(sys.stdin)['DATABASE_PUBLIC_URL'])\"\n```\n  (przez `python -c`, żeby nie echować URL-a z credkami do historii/logów.)" | — | Internal host unreachable from laptop → use public URL |
| 232-234 | `pg`; pnpm hoisting | "Skrypt z `pg` odpalaj **z wnętrza `packages/db`**, nie z roota — pnpm nie-hoistuje `node_modules`, więc `pg` nie rozwiązuje się w roocie monorepo." | — | Module resolution failure at repo root |
| 237-247 | `drizzle-kit migrate`; `pnpm db:migrate`; `railway run`; `preDeployCommand`; `railway.json`; `__drizzle_migrations` | "w układzie **Dockerfile-only** `CMD` to czyste `pnpm --filter @scope/<app> start` … **bez** kroku migracji. `preDeployCommand` z `railway.json` zniknął razem z `railway.json` (§1).\n\n**Efekt: migracje są ręcznym krokiem** … Nie zakładaj, że świeży deploy sam się zmigruje. Opcje:\n- ręcznie `railway run pnpm --filter @scope/db db:migrate` (jeden serwis-właściciel migracji — dwa serwisy naraz ścigałyby się o tabelę `__drizzle_migrations`), albo\n- świadomie wpiąć release/`preDeployCommand`" | — | **No migrate-on-start** in this layout; two ranked options |
| 249-251 | PostgreSQL `ALTER TYPE … ADD VALUE` | "⚠️ **Enum w jednej transakcji:** `ALTER TYPE … ADD VALUE 'x'` + użycie `'x'` w tej samej transakcji **pada w Postgresie** i nie ujawnia się na świeżej/pustej bazie lokalnej. Zweryfikuj taką migrację na **realnym** Postgresie zanim zaufasz automatowi." | — | Fails on real DB, invisible locally |
| 255-260 | Pipedrive; SendGrid; Airtable; Google Maps | "## 11. 🔴 KRYTYCZNE: środowisko `dev` może trzymać PRODUKCYJNE credki integracji\n\n… `dev` był wpięty w **realne produkcyjne** credki Pipedrive / SendGrid / Airtable / Google Maps — **nie ma sandbox/staging** dla żadnego z nich. **Każdy testowy webhook wysłany na `dev` pisze do produkcyjnych systemów.**" | — | **No sandbox/staging exists for any of them** |
| 262-263 | `SRF_SKIP_QUALIFICATION_WRITE` | "Lane qualify miał skip-write (`SRF_SKIP_QUALIFICATION_WRITE=1`); **lane price NIE miał** żadnej flagi dry-run → każdy test lane'u price = realne zapisy do prod." | — | Missing dry-run flag on one lane |
| 265-268 | Pipedrive API `curl -X DELETE` | "```bash\ncurl -X DELETE \"https://<company>.pipedrive.com/api/v1/deals/<dealId>?api_token=<token>\"\ncurl -X DELETE \"https://<company>.pipedrive.com/api/v1/persons/<personId>?api_token=<token>\"\n```" | Pipedrive API **v1** | — |
| 270-272 | `DRY_RUN` / skip-write | "Traktuj każdy webhook na `dev` jak produkcyjny zapis, dopóki nie ma osobnych sandbox-credków albo flagi `DRY_RUN`/skip-write na każdym lane. To nie jest domyślnie załatwione — wymaga decyzji + zmiany kodu." | — | Not handled by default |
| 274-278 | HMAC; `curl --data-binary`; UUID `submission_id` | "**Podpis webhooka przy smoke:** HMAC licz nad **dokładnie tymi bajtami, które wysyłasz** — zapisz payload do pliku, podpisz surowy bufor pliku, potem `curl --data-binary @plik`. Nie pozwól curlowi ani powłoce prze-serializować/prze-cytować JSON-a … (inaczej `401 invalid_signature`). Świeży `submission_id` (UUID) per test — inaczej idempotencja zwróci `duplicate`" | — | `401 invalid_signature` / `duplicate` |
| 282-292 | `tsx`; `vitest`; `node dist/index.js`; ESM `exports`; `--conditions=development`; `pathToFileURL` | "Prod boot potrafi paść w miejscach, których dev (tsx) i testy (vitest) **nie dotykają** — bo oba to loadery TS. Np. package `exports` wskazujące na `./src/index.ts` bootuje pod tsx, ale `node dist/index.js` w prod rzuca `ERR_MODULE_NOT_FOUND …src/schema.js` … Fix: conditional exports `{\".\":{\"types\":\"./src/index.ts\",\"development\":\"./src/index.ts\",\"default\":\"./dist/index.js\"}}` + `--conditions=development` w dev-skrypcie tsx." · "**Reguła:** hosting-krytyczne zmiany weryfikuj odpalając **skompilowany artefakt** (`node dist/index.js` + curl `/health`), nigdy nie ufaj samemu zielonemu typecheck/testom" · "Windows ESM entrypoint musi używać `pathToFileURL`" | — | tsx/vitest **mask** the prod module-resolution path |

## 19. `skills/sailes-hosting/references/railway-topologia-i-cli.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 10-13 | `@railway/cli`; `railway login`; `railway whoami` | "```bash\nnpm i -g @railway/cli          # instalacja globalna\nrailway login                  # logowanie (otwiera przeglądarkę)\nrailway whoami                 # potwierdź konto\n```" | — | — |
| 16-17 | `railway login` in headless/agent env | "W środowiskach headless/agentowych logowanie robi człowiek (`railway login`) — token siedzi w profilu. Jeśli sesja nie ma tokena, poproś użytkownika o `! railway login`." | — | **Escalate to human** when token absent |
| 18-21 | `RAILWAY_TOKEN`; `setx` | "Sesja `railway login` **wygasa w trakcie** (objaw: `railway status --json` pusto / `Unauthorized`). Dla trwałego użycia agentowego ustaw `RAILWAY_TOKEN` w scope **User/Machine** (`setx RAILWAY_TOKEN <token>`)" | User/Machine scope | — |
| 22 | `railway --help` | "`railway --help` / `railway <cmd> --help` — CLI bywa aktualizowane, sprawdzaj flagi na miejscu." | — | CLI changes — verify flags locally |
| 26-31 | `railway link`; `railway status` | "`railway link` bez argumentów odpala interaktywny wybór (zawiesza agenta). Podaj **wszystkie trzy**:\n\n```bash\nrailway link -p <project> -e <environment> -s <service>\nrailway status\n```" | — | **Interactive prompt hangs the agent** if args omitted |
| 40-44 | Fastify; Postgres | "Services:     Custom-Overlay-App   (Fastify backend, build z gita)\n              Postgres             (baza; wstrzykuje DATABASE_URL)" | — | — |
| 53 | Dockerfile; Nixpacks | "Railway buduje z **Dockerfile** (jeśli jest w katalogu roota serwisu) albo **Nixpacks** (auto-detekcja)." | — | Nixpacks is the auto-detect fallback |
| 54-56 | Root Directory (monorepo) | "**Root Directory** (ustawienie serwisu) wskazuje podkatalog w monorepo… W tym repo build leci ze *spłaszczonego* brancha (`apps/*` w root, nie `app/apps/*`)" | — | — |
| 58-60 | Nixpacks; `tsc`; Dockerfile; `RAILWAY_DOCKERFILE_PATH`; `railway.json` | "**Monorepo pnpm:** nie zdawaj się na Nixpacks (buduje z `NODE_ENV=production` → pomija devDeps → `tsc: not found`). Commituj `Dockerfile` per app + zmienną serwisu `RAILWAY_DOCKERFILE_PATH` i skasuj `railway.json`" | — | — |
| 66-71 | `drizzle-kit migrate`; `tsx` | "```jsonc\n// package.json (integrations)\n\"start:prod\": \"drizzle-kit migrate && tsx src/server.ts\"\n```\n\n- **Migracje odpalają się przy każdym boot** (idempotentnie). Notka typu `schema \"drizzle\" already exists, skipping` w logach = **normalne**, nie błąd." | — | Benign log noise documented |
| 73-74 | — | "Wada: przy dużej skali migracja blokuje start — wtedy wydziel osobny krok „migrate" przed „serve"." | — | Scale-dependent alternative |
| 77-79 | Dockerfile-only monorepo | "**Uwaga (Dockerfile-only monorepo):** gdy `CMD` to czyste `… start` (bez `drizzle-kit migrate`), migracje NIE lecą na starcie — są ręcznym krokiem po deployu." | — | No auto-migration |
| 83-84 | `$PORT` | "**Railway wstrzykuje `PORT`.** Appka MUSI słuchać na `process.env.PORT` (u nas ląduje na `:8080`). Zahardkodowany port = serwis „unhealthy" i brak ruchu." | port 8080 | Hardcoded port → unhealthy, no traffic |
| 85-87 | `/health` healthcheck | "**Healthcheck `/health`** → 200, szybki, **bez auth**. Zwraca np. `{\"status\":\"ok\"}`… Railway pinguje ten endpoint; brak 200 w oknie startowym = deploy uznany za nieudany (rollback do poprzedniego)." | — | No 200 → deploy fails, auto-rollback |
| 91-93 | `<service>-<env>.up.railway.app`; CNAME | "Auto: `<service>-<env>.up.railway.app`… Custom domena: Settings → Networking → dodaj domenę → CNAME u rejestratora." | — | — |
| 99-106 | `railway status`, `railway status --json`, `railway variables`, `railway variables --set`, `railway logs`, `railway up`, `railway run` | "railway status --json          # GROUND TRUTH: source.branch, build.builder/dockerfilePath, startCommand, configErrors" · "railway up                     # deploy z lokalnego katalogu (rzadko — my deployujemy przez git push)" | — | — |
| 108-109 | `railway run` | "`railway run` wciąga produkcyjne env do lokalnej komendy — wygodne do jednorazowych skryptów (np. reconcile), ale **ostrożnie**: to realne dane/sekrety. Nie odpalaj destrukcyjnych rzeczy „na próbę"." | — | Real prod data/secrets |

## 20. `skills/sailes-hosting/references/storage-postgres-bucket-volume.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 10-11 | Railway container FS | "> 🔒 System plików kontenera Railway **RESETUJE SIĘ przy każdym deployu i restarcie.** `./logs`, `/tmp`, uploady zapisane na dysk kontenera → **znikają**." | — | Data loss on redeploy |
| 13-15 | Volume; S3 | "cokolwiek ma przeżyć redeploy MUSI iść do **Volume** (mount trwałego dysku) albo do **S3** (upload do bucketu)." | — | — |
| 17-18 | `/tmp`; Medfile | "`/tmp` jest OK **tylko** dla rzeczy ważnych w obrębie jednego requestu (np. bufor przy scalaniu PDF przed wysłaniem do Medfile)." | — | — |
| 26-30 | env / Postgres / S3 Bucket / Volume / `/tmp` | "\| Pliki użytkownika (ZC2, PDF, skany, załączniki) \| **Bucket (S3)** \| bloby; nie pchać do bazy ani na dysk \|" | — | — |
| 34-35 | `${{Postgres.DATABASE_URL}}`; `drizzle-kit migrate` | "Osobny Service; publikuje `DATABASE_URL` → appka bierze referencją `${{Postgres.DATABASE_URL}}`.\n- Migracje: `drizzle-kit migrate` odpala się na starcie appki" | — | — |
| 36-37 | Railway snapshots | "**Backup:** Railway robi snapshoty, ale **przetestuj restore** zanim na nich polegniesz (backup bez sprawdzonego restore = złudzenie)." | — | Untested restore = illusion |
| 38-40 | seeding | "**Czysty start (ważne dla prod):** `start:prod` tylko **migruje**. Seeduj **wyłącznie dane referencyjne** … — **NIGDY dem-pacjentów**. Demo-seedy zatruwają produkcję." | — | — |
| 43-54 | Railway Storage Bucket (S3-compatible); `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`; `storage.railway.app` | "Railway ma natywny **Storage Bucket**, kompatybilny z S3 → działa z każdym klientem S3 bez zmian kodu.\n\n- Endpoint: `storage.railway.app`. Pięć zmiennych okablowuje klienta:" | — | — |
| 56 | AWS SDK / S3 client | "Użycie: standardowy AWS SDK / S3 client (put/get/delete)." | — | — |
| 58-60 | Cloudflare R2 | "⚠️ **RODO / region EU:** potwierdź, że bucket stoi w regionie **EU** (dane pacjentów). Jeśli Railway nie daje pewności co do EU → **plan B: Cloudflare R2** (S3-compatible, wybór regionu EU, te same `S3_*`). Do decyzji z Karolem — otwarte w memory („storage-decision-open-ask-karol")." | EU region required | **Explicit plan B: Cloudflare R2**; decision still open |
| 66-70 | Railway Volume; `FORMS_LOG_DIR` | "Dashboard: Service → dodaj **Volume**, ustaw **mount path** (np. `/data`).\n- Appka pisze pod ten mount, wskazywana zmienną: `FORMS_LOG_DIR=/data/forms-logs`.\n- Jeden Volume na Service, ma rozmiar (limit)… Volume przeżywa deploy; **nie** przeżywa usunięcia serwisu. To nie backup." | one Volume per Service; sized limit | Volume ≠ backup; dies with the service |

## 21. `skills/sailes-hosting/references/wdrozenie-logi-gotchas.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 10-11 | git push; `railway up` | "Railway śledzi **jeden branch per Environment**. `git push` na ten branch → auto-build → deploy.\n- Alternatywa: `railway up` (deploy z lokalnego katalogu) — rzadziej" | — | — |
| 13-16 | `git ls-tree --name-only` | "Zweryfikuj `git ls-tree --name-only <remote>/<branch>` zanim uznasz „wypchnąłem zmianę" — inaczej łatwo wypchnąć w złe miejsce i patrzeć, jak Railway buduje stary kod." | — | — |
| 20-23 | Railway redeploy triggers | "Wyzwalacze: (a) push na branch deployowy, (b) zmiana zmiennej env, (c) ręczny „Redeploy" w dashboardzie.\n- Czas: zwykle 1–2 min… **„Health 200" ≠ „nowy build".**" | 1–2 min | — |
| 27-35 | `railway logs`; `grep`; agent `run_in_background` | "```bash\nrailway logs > /tmp/rw.log &     # (w sesji agenta: run_in_background)\n# …wywołaj zdarzenie…\ngrep -iE \"oauth\|webhook\|error\" /tmp/rw.log\n```" | — | — |
| 38-39 | `railway logs` retention | "**Logi sprzed ostatniego restartu znikają** — jeśli debugujesz jednorazowe zdarzenie, przechwytuj na żywo, nie licz na to, że wrócisz do nich później." | — | Logs lost on restart |
| 45-48 | `/health` smoke | "1. `GET /health` → 200.\n2. Jeden **odczyt**… 3. Jeden **zapis** round-trip na bezpiecznych/syntetycznych danych → weryfikacja + sprzątnięcie. Wklej realny output, nie „wygląda ok"." | — | — |
| 54-57 | Railway Deployments → Redeploy; git revert | "Dashboard → Deployments → wybierz poprzedni udany → **Redeploy** (jeden klik, wraca stary obraz).\n- Albo: revert commita na branchu deployowym i push." | — | — |
| 63 | Volume / S3 | "\| Pliki znikają po redeploy \| efemeryczny FS kontenera \| trwałe → Volume albo S3 \|" | — | — |
| 64 | `git ls-tree`; `railway status --json` | "\| Deploy „nie wchodzi" / buduje stary kod \| push w zły branch / zły układ katalogów vs build-branch \| `git ls-tree <remote>/<branch>` … w multi-serwis `railway status --json` → `source.branch` \|" | — | — |
| 65 | Nixpacks/Railpack; `tsc`; Dockerfile; `RAILWAY_DOCKERFILE_PATH`; `railway.json` | "\| `tsc: not found` na buildzie monorepo \| Nixpacks/Railpack buduje z `NODE_ENV=production` → pomija devDeps \| Dockerfile per app + `RAILWAY_DOCKERFILE_PATH`, skasuj `railway.json` \|" | — | — |
| 66 | Railway branch pinning; CLI `source connect` | "\| Serwis `branch: None` buduje `master` zamiast `dev` \| nieprzypięty branch źródłowy \| przypnij branch w dashboardzie (CLI `source connect` zepsute) \|" | — | CLI broken → dashboard only |
| 67 | Config-as-code file path | "\| Serwis buduje/startuje złą app mimo poprawnego Dockerfile \| stała dashboardowa „Config-as-code file path" nadpisuje wszystko (niewidoczna z CLI) \| `railway status --json` → `configErrors` \|" | — | Invisible from CLI |
| 68 | Railway `dev` prod creds | "\| Test na `dev` stworzył realny deal / wysłał realny mail \| `dev` wpięty w PROD-owe credki integracji (brak sandboxu) \|" | — | No sandbox |
| 69 | `*_DRY_RUN` | "\| Zapisy do zewn. systemu „nic nie robią" \| flaga `*_DRY_RUN=true` na wdrożonym serwisie \| sprawdź flagę pierwszą; `false` + realny token do zapisów \|" | — | — |
| 70 | `tsconfig.tsbuildinfo` | "\| „tsc zielone" a jednak build/typy padają \| incremental cache `tsconfig.tsbuildinfo` \| usuń buildinfo, odpal typecheck na zimno przed „zielone" \|" | — | Stale cache lies |
| 72 | OAuth provider cookies | "\| OAuth „Something went wrong" po podmianie/reinstalacji appki \| zombie-sesja / stare ciasteczka u dostawcy \| instaluj w **incognito** (świeże ciasteczka) \|" | — | — |
| 73 | OAuth `redirect_uri` | "\| OAuth `redirect_uri mismatch` \| callback URL nie zgadza się co do znaku \| URL u dostawcy = literalnie ten w kodzie (http/https, ukośnik, host) \|" | exact-match | — |
| 74 | `process.env.PORT` | "\| Serwis „unhealthy", brak ruchu \| appka nie słucha na `process.env.PORT` \| zawsze `PORT` z env, nie hardcode \|" | — | — |
| 78-83 | OAuth callback; webhooks; CSP `frame-ancestors` | "- **OAuth Callback / `redirect_uri`** u dostawcy → prod domena, literalnie jak w kodzie.\n- **Webhooki** (URL z sekretem w ścieżce) → prod domena…\n- Panele/iframe'y osadzane u dostawcy → prod domena + poprawny CSP `frame-ancestors`." · "Zmiana domeny bez przerejestrowania tych URL = integracje **cicho** przestają wołać." | — | **Silent** integration breakage |

## 22. `skills/sailes-implement/SKILL.md`

| Line | Tool / service | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 21 | `.ai/STATE.md`, `.ai/lessons.md` | "Read **`.ai/STATE.md` + `.ai/lessons.md`** (project memory) — start from what's already verified and what's known to fail; don't re-derive it." | — | — |
| 30 | `superpowers:test-driven-development` skill; `tester`/`sailes-test` | "Identify the RED test first (write or name a failing test before the code — `superpowers:test-driven-development`)." | — | — |
| 31 | Zod | "Logic in services, validation at the boundary (Zod), thin controllers, no `any`." | — | — |
| 32 | unit / integration / E2E; authz-matrix suite | "**Auth/roles-touching phases: generate the authz-matrix suite from the spec's permission matrix** — every action × role → asserted allow/deny + the anonymous row (and, multi-tenant, the cross-org denial tests)." | — | — |
| 33 | `curl`; screenshots; `.ai/screens/` | "drive the real running system first (e2e flow / `curl` the live endpoint / click the UI / generate the actual PDF/screen), observe the real behavior, THEN trust it… **UI-touching steps get vision-verify:** compare the fresh screenshot against the design artifact and the previous accepted screenshot in `.ai/screens/`" | — | "A green build/lint is not proof" |
| 35 | `STATUS.md` | "At each **phase** gate, also update the root `STATUS.md` (client-readable: phases done/total…— never effort/pricing data)." | — | — |
| 40-42 | `tester`, `checker`, `qa` roles; `.ai/test-plans/` | "**Behavior proof** — `qa` runs the `tester` suite against the live app as the gate verdict, then drives the real flow." | — | — |
| 46 | `sailes-bootstrap/release-checklist.md`; `repo-done-checklist.md` | "**Deploying work ends at the release gate, not at green tests:** walk `sailes-bootstrap/release-checklist.md` — env/secret parity, migration ordering vs deploy, the **post-deploy smoke** script run with output pasted, and a rollback plan written *before* the deploy." | — | Human approves prod step |
| 47 | `sailes-wycena` (planned skill) | "record per-phase estimate-vs-actual + a one-line \"why the delta\" in the internal ledger (never in client-visible docs) — this is what lets the planned `sailes-wycena` pricing skill price the next project from history" | — | Skill does not exist yet ("planned") |
| 48-50 | `.ai/backlog.md`; `.ai/lessons.md`; `.ai/STATE.md` | "Push deferred follow-ups / tech debt discovered during build to `.ai/backlog.md` (don't lose them)." | — | — |
| 51 | PR workflow; label `review` | "Hand off per the repo's PR workflow (label `review`)." | — | — |
| 54-56 | `Explore`/`explorer` subagents; git worktrees; `team-lead`; agent-teams mode; `sailes-bootstrap/agent-team-structure.md` | "Read-only recon (`Explore`/`explorer`) for mapping; implementation steps that touch the same files run sequentially (or in worktrees if truly parallel) to avoid conflicts." · "the agent driving `sailes-implement` **acts as `team-lead`** (or delegates to the `team-lead` role if agent-teams mode is on)… the **fallback when teams mode is off** (same roles as sequential subagents)… are all defined in `sailes-bootstrap/agent-team-structure.md`." | — | **Explicit fallback**: teams mode off → same roles run as sequential subagents |
| 82 | `qa`; ENV-DEFECT | "`qa` was blocked by missing stack/creds and you skipped the proof instead of reporting ENV-DEFECT." | — | **Missing stack/creds → report ENV-DEFECT**, never fake a pass |

## 23. `skills/sailes-migrate/SKILL.md`

| Line | Tool / service | Verbatim quote | Version / licence | Absent-behaviour |
|---|---|---|---|---|
| 16-18 (frontmatter) | `sailes-database`; Prisma; Drizzle; SQL | "To NIE jest o migracjach SCHEMATU BAZY DANYCH — te robi `sailes-database` (Prisma/Drizzle/SQL). Ten skill dotyczy przekładu KODU między językami/stackami." | — | Disambiguation |
| 23-27 | `anthropics/code-migration-kit-with-claude-code`; scripts `depmap_*`, `queue_runner`, `build_daemon`; templates `RULEBOOK.md`, `inventory.tsv`, deny-`settings.json` | "> **Provenance:** metoda zdestylowana z `anthropics/code-migration-kit-with-claude-code` (Apache-2.0, © 2026 Anthropic PBC). Ten skill to **nasza synteza idei** zmapowana na maszynerię Sailes — nie kopia ich plików. Konkretne skrypty (`depmap_*`, `queue_runner`, `build_daemon`, szablony `RULEBOOK.md`/`inventory.tsv`/deny-`settings.json`) żyją w tamtym repo; jak i czy je vendorować — patrz `cost-and-gates.md` (decyzja licencyjna człowieka)." | **Apache-2.0, © 2026 Anthropic PBC** | Scripts live in the external repo, not here |
| 32 | source/target languages | "Python→TS, PHP→TS, Rails→nasz stack, C→Rust itd." | — | — |
| 53-54 | judge / parity harness | "> **Żaden równoległy przekład (Krok 3) nie startuje, zanim nie istnieje judge i nie został zwalidowany na CELOWO zepsutym źródle.**" | — | **Hard gate** |
| 66 | `sailes-pre-implement`; `qa` | "lens `sailes-pre-implement` + dyscyplina bramki `qa`; judge walidowany na zepsutym kodzie — `judge-setup.md`" | — | — |
| 67 | `explorer`; **graphify**; `manifest.tsv` | "`explorer` + **graphify** (mamy go w każdym repo); Rulebook = **zamrożona** tabela — `rulebook-template.md`" | — | — |
| 68 | `sailes-implement` RED-baseline; deny-list | "najbliższy krewny: RED-baseline z `sailes-implement`; pod guardrailem deny-list" | — | — |
| 69 | `team-lead`; `be-dev`/`fe-dev`; `.claude/settings.json` deny-list; `.codex` twin; hooks | "`team-lead` → równolegli `be-dev`/`fe-dev`; **`.claude/settings.json` deny-list** blokuje drogie operacje (mamy hooki + twin `.codex`)" | — | — |
| 70 | compiler; fixer fan-out | "jeden zbiorczy compile → maszynowa kolejka błędów cięta liście→korzeń → równolegli fixerzy bez dostępu do kompilatora" | — | Fixers deliberately denied compiler access |
| 72 | `checker` + `tester` + `qa`; `.ai/backlog.md`; markers `BUG(port)`/`TODO(port)`/`PERF(port)` | "wszystkie testy parzystości zielone **I** oryginalny suite na oryginalnym kodzie bez odziedziczonych porażek; potem burndown `BUG(port)`/`TODO(port)`/`PERF(port)`" | — | — |
| 96-99 | `.claude/settings.json` deny-list; `.codex/config.toml`; `sailes-bootstrap` | "Kroki 2–4 i 6 działają pod deny-list `.claude/settings.json` (+ twin `.codex/config.toml`, te same skrypty hooków — mamy to w każdym repo generowanym przez `sailes-bootstrap`), która blokuje drogie operacje (np. per-plikowy typecheck w trakcie fan-outu). **Jeśli deny-list nie jest zainstalowany, blokady nie działają** — zainstaluj go przed pilotem z Kroku 2." | — | **If deny-list is not installed, the blocks do not work** — install before Step 2 pilot |
| 110 | deny-list | "Uruchamiasz fan-out bez zainstalowanego deny-list guardraila." (Red Flag — STOP) | — | STOP condition |

## 24. `skills/sailes-migrate/cost-and-gates.md`

| Line | Tool | Verbatim quote | Version / licence | Absent-behaviour |
|---|---|---|---|---|
| 12 | judge | "\| 0 \| judge istnieje **i** failuje na celowo zepsutym źródle \|" | — | Binary gate |
| 13 | `manifest.tsv`; Rulebook; gap-inventory | "\| 1 \| `manifest.tsv` + Rulebook v1 + gap-inventory istnieją na dysku \|" | Rulebook **v1** | — |
| 20-25 | token budget / model limits | "Produkcyjny port dużego repo to rząd miliardów tokenów wejścia w skali ~dni–tygodni; przy standardowych limitach te same kroki trwają dłużej w czasie zegarowym, nie inaczej metodycznie." | — | Rate limits stretch wall-clock, not method |
| 28 | compiler; deny-list | "**Bez kompilatora w Krokach 3–4** poza jednym zbiorczym survey — deny-list to wymusza." | — | — |
| 34-36 | `anthropics/code-migration-kit-with-claude-code` | "Metoda zdestylowana z **`anthropics/code-migration-kit-with-claude-code`** — licencja **Apache-2.0, © 2026 Anthropic, PBC**. Ten skill to nasza **synteza idei** (idee nie podlegają prawu autorskiemu); **nie reprodukujemy tekstu ani plików** kitu." | **Apache-2.0, © 2026 Anthropic PBC** | — |
| 38-41 | kit scripts: `depmap_python.py`, `depmap_mjs`, `depmap_c_headers.py`, `make_manifest.py`, `queue_runner.mjs`, `build_daemon.sh`; templates `RULEBOOK.md`, `inventory.tsv`, deny-`settings.json` | "Konkretne skrypty kitu (`depmap_python.py`, `depmap_mjs`, `depmap_c_headers.py`, `make_manifest.py`, `queue_runner.mjs`, `build_daemon.sh`) oraz szablony (`RULEBOOK.md`, `inventory.tsv`, deny-`settings.json`) **żyją w tamtym repo**. Domyślnie: **referencja** — sklonuj kit obok repo migrowanego i użyj jego skryptów." | — | **Default = clone the external kit alongside**, do not vendor |
| 43-48 | Apache-2.0 §4; `NOTICE` | "**Vendorowanie (skopiowanie ich plików do tego repo) jest prawnie dozwolone przez Apache-2.0**, ale wymaga:\n- zachowania nagłówków licencyjnych i dołączenia `NOTICE`/atrybucji (Apache-2.0 §4),\n- świadomej decyzji, czy pakować kod innego dostawcy do dystrybucji Sailes (plugin/marketplace).\n\n**To decyzja człowieka, nie agenta.** Dopóki nie zapadnie — trzymamy referencję, nie kopię." | Apache-2.0 §4 | **Human decision required**; default is reference |

## 25. `skills/sailes-migrate/judge-setup.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 7-9 | judge / parity harness | "> Judge **musi istnieć przed Krokiem 1** i być **zwalidowany na celowo zepsutym źródle** przed jakimkolwiek przekładem (Krok 3)." | — | Hard prerequisite |
| 16-21 | existing test suite; portable parity harness | "1. **Istniejący suite (public-facing)** — jeśli oryginał ma testy, które wołają go przez publiczny interfejs (nie importują wnętrzności), **przenieś je bez zmian** do Kroku 6. To najtańszy judge.\n2. **Przenośny parity-harness** — jeśli testy oryginału **importują wnętrzności źródła** (nie przełożą się 1:1), zbuduj osobny harness: ustalony zestaw wejść → zebrane wyjścia oryginału jako „złoty" wzorzec → ten sam zestaw puszczony na porcie → diff. Harness jest **przenośny** (nie zależy od języka źródłowego)." | — | **Explicit two-path fallback** based on whether the original suite is portable |
| 25-30 | judge validation | "1. Wprowadź **celowy błąd** do oryginału… 2. Puść judge'a. **Musi sfailować.** Jeśli przechodzi — judge jest ślepy, popraw go.\n3. Cofnij błąd; judge znów zielony." | — | Blind judge must be fixed before use |
| 36-39 | original suite | "- **wszystkie** testy parzystości / harness zielone na porcie, **oraz**\n- oryginalny suite puszczony na **oryginalnym** kodzie ma **zero** odziedziczonych porażek (inaczej Twój wzorzec jest już zepsuty i porównanie jest bez wartości)." | — | Inherited failures invalidate the baseline |
| 43-47 | `qa`, `tester`, `checker` roles | "Dyscyplina bramki = nasz `qa` … Autor przypadków parzystości = nasz `tester` … Niezależna ocena = `checker` na czystym kontekście." | — | — |

## 26. `skills/sailes-migrate/methodology.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 13-14 | `sailes-pre-implement` | "**Case za/przeciw migracji** (read-only)… To lens `sailes-pre-implement` zastosowany do portu." | — | — |
| 19 | judge; eval `migrate-judge-gate` | "**Bramka:** brak zwalidowanego judge'a → nie wolno przejść do Kroku 1. (Eval `migrate-judge-gate`.)" | — | Hard stop |
| 23-25 | **graphify**; kit `depmap_*` scripts; `manifest.tsv` | "**Mapa zależności** → deterministyczna kolejność plik- i pakiet-poziomu, wykrywa cykle. U nas: najpierw **graphify** (jest w każdym repo), skrypty `depmap_*` kitu jako uzupełnienie dla języków, których graphify nie pokrywa. Wynik → `manifest.tsv` (kolejność liście→korzeń)." | — | **Explicit fallback**: `depmap_*` covers languages graphify doesn't |
| 26-27 | Rulebook | "**Rulebook** (`rulebook-template.md`) — każda decyzja przekładu rozstrzygnięta **raz**." | — | — |
| 31 | `explorer` | "Reużyj `explorer` do mapy/inventory." | — | — |
| 37-39 | bakeoff (two translators) | "**Bakeoff** — dwaj tłumacze na tych samych trudnych plikach… *W trybie redesign bakeoff traci sens* — zastąp adwersaryjnym review dokumentu projektowego." | — | **Mode-dependent substitution** |
| 43 | deny-list guardrail | "Wymaga zainstalowanego **deny-list guardraila** (Krok potrzebuje go do stress-testu)." | — | — |
| 47-51 | `manifest.tsv` runner; `be-dev`/`fe-dev`; `team-lead`; compiler; `.claude/settings.json` | "- **Bez uruchamiania kompilatora** — zostawiamy go na zbiorczy survey (Krok 4).\n- Deny-list `.claude/settings.json` aktywny (blokuje drogie operacje per-jednostka)." | — | — |
| 57-62 | compiler; error queue; fixers; build daemon | "- **Jeden zbiorczy build** puszcza kompilator po całości.\n- Błędy → **maszynowa kolejka** cięta po module, liście→korzeń.\n- Równolegli **fixerzy** pracują kolejkę **bez dostępu do kompilatora** (żeby nie zapętlić drogich buildów); daemon przebudowuje, gdy drzewo się zmienia." | — | Fixers denied the compiler by design |
| 69-70 | `qa` | "Hello-world, potem **najmniejszy** dowód end-to-end. Tania weryfikacja przed drogą (dyscyplina `qa`)." | — | — |
| 73-79 | judge; `.ai/backlog.md`; `BUG(port)`/`TODO(port)`/`PERF(port)` | "- **Judge** orzeka: albo istniejący suite (dla kodu publicznego), albo przenośny harness parzystości (`judge-setup.md`)." | — | — |
| 81 | `checker` + `tester` + `qa` | "Reużyj `checker` + `tester` + `qa`. **To jest definicja „done" tej migracji.**" | — | — |

## 27. `skills/sailes-migrate/parallel-translation.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 8-12 | `team-lead`; `manifest.tsv`; `be-dev`/`fe-dev`; `checker`/`tester`/`qa` | "**`team-lead`** — orkiestruje fan-out: czyta `manifest.tsv`, przydziela jednostki, integruje wyniki, pilnuje bramek. Każdy brief niesie klauzulę raportu (pusty zwrot = porażka, nie „nic nie znalazłem")." | — | Empty return = failure, not a null result |
| 16-20 | compiler; deny-list | "3. **Bez kompilatora** — nie kompilujemy per-jednostka; survey build zbiorczo w Kroku 4.\n4. Guardrail deny-list aktywny (niżej)." | — | — |
| 24-27 | build daemon; error queue | "3. Równolegli fixerzy **bez dostępu do kompilatora** (inaczej każdy odpala drogi build → zapętlenie); daemon przebudowuje, gdy drzewo się zmienia." | — | — |
| 31-34 | `.claude/settings.json`; `.codex/config.toml`; hooks; `sailes-bootstrap`; `typecheck`, `build` | "Każde repo generowane przez `sailes-bootstrap` ma już `.claude/settings.json` + twin `.codex/config.toml` na wspólnych skryptach hooków — dołóż deny na drogie operacje migracji (np. `typecheck`, pełny `build`) na czas Kroków 2–4, i **reaktywuj** je na Krok 6." | — | — |
| 36-38 | deny-list; Anthropic kit incident | "> **KRYTYCZNE:** jeśli deny-list **nie jest zainstalowany**, blokady nie działają — fan-out pobiegnie „nieuzbrojony". Zainstaluj przed pilotem (Krok 2). To dokładnie ta pułapka, którą kit Anthropic odnotował jako realny incydent." | — | **Blocks silently do not apply** if not installed |
| 41-45 | `queue_runner`, `build_daemon`, `depmap_*`, `make_manifest`; `anthropics/code-migration-kit-with-claude-code` | "`queue_runner` / `build_daemon` / `depmap_*` / `make_manifest` żyją w kicie Anthropic (`anthropics/code-migration-kit-with-claude-code`, Apache-2.0). Czy vendorować je do naszego repo — decyzja licencyjna człowieka… Domyślnie: sklonuj kit obok repo migrowanego i użyj jego skryptów; nasza warstwa to orkiestracja ról + bramki + Rulebook." | **Apache-2.0** | Default: clone external kit |

## 28. `skills/sailes-migrate/rulebook-template.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 8-9 | `.ai/migrate/RULEBOOK.md` | "Skopiuj tę tabelę do repo migrowanego (`.ai/migrate/RULEBOOK.md`) i wypełniaj podczas Kroku 1, domykaj podczas Kroku 2 (stress-test dopisuje werdykty z bakeoffu)." | — | — |
| 19 | JS `Map` vs plain object (target-language construct) | "\| R1 \| *(np. dict źródła)* \| *(np. `Map` vs obiekt — wybierz jedno)* \|" | — | — |
| 20-25 | target-language constructs | "\| R2 \| *(obsługa błędów: wyjątki źródła)* \| *(Result/throw — jedno)* \|" · rows R3 `null/undefined/None`, R4 async/concurrency, R5 naming `snake_case → ?`, R6 imports/module boundaries, R7 numbers/precision/dates | — | — |
| 38-41 | — | "**Decyzja rozstrzygnięta raz** — nie renegocjuj per-plik; zmiana reguły = zmiana **globalna**." | — | No external tools mentioned in this file beyond the above |

## 29. `skills/sailes-pipedrive/SKILL.md`

| Line | Tool / service | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 3-18 (frontmatter) | Pipedrive App Extensions; Developer Hub; OAuth2; signed JWT `X-Pipedrive-Token`; Apps SDK (`initialize`/`RESIZE`/theme/`GET_SIGNED_TOKEN`); `pd-ui`; `app-extensions-sdk`; `USER_SETTINGS_CHANGE`; `/api/pd`; `/manifest.json`; `ui_extensions` | "Jak budować wtyczki (App Extensions) do Pipedrive w stylu tego repo — JSON panel, Custom UI panel (iframe w karcie deala), custom floating window / modal, link/app actions oraz strona ustawień — wraz z manifestem, rejestracją w Developer Hubie, OAuth2, autoryzacją przez sygnowany JWT (X-Pipedrive-Token), Apps SDK (initialize/RESIZE/theme/GET_SIGNED_TOKEN), gatingiem ACL, proxy do Pipedrive API i zapisem custom fields (hashowane klucze)." | — | — |
| 29-35 | Pipedrive docs: `pipedrive.readme.io/docs/app-extensions`, `developers.pipedrive.com/docs/api/v1` | "> **Oficjalna dokumentacja (źródło prawdy):** App Extensions — https://pipedrive.readme.io/docs/app-extensions · API v1 — https://developers.pipedrive.com/docs/api/v1\n> Gdy ten skill nie odpowiada na pytanie (nowy typ rozszerzenia, dokładny kształt manifestu/pól, zmiana w API, dostępne komendy SDK) — **sprawdź dokumentację, zanim zgadniesz**." | **API v1** | **Fallback**: consult official docs before guessing |
| 37-44 | Node `http` (`createServer`, `server.mjs`); **no Express**; vanilla HTML; React + Vite; Apps SDK self-hosted UMD (`public/vendor/app-extensions-sdk.umd.js`, **not npm**); Railway; `node server.mjs`; `/health` | "> **Stack repo (nie zmieniaj bez powodu):** serwer to **czysty Node `http`** (`createServer` w `server.mjs`, ręczny routing po `url.pathname`, helpery `sendJson(res, status, payload)` i `sendFile(res, path)` — **bez Express**). Statyczne panele to **vanilla HTML** w `public/pd-ui/<nazwa>.html`. Złożone widoki (dashboard) to React+Vite (`src/`, build do `dist/`). Apps SDK jest **self-hostowany** jako UMD w `public/vendor/app-extensions-sdk.umd.js` (nie z npm). Deploy: **Railway**, `node server.mjs`, healthcheck `/health`. Komentarze w kodzie pisz po polsku" | — | Express explicitly excluded; npm SDK dependency explicitly excluded |
| 52-58 | Extension-type table: JSON panel; Custom UI panel (iframe); Custom floating window / modal; Link action / app action; Settings page | "\| Pokazać **odczytowe** dane (karty/pola) na dealu/osobie/org \| **JSON panel** \| Nie — Pipedrive renderuje wg schematu \| endpoint GET zwracający `{data:[…]}` w `server.mjs` \|" | — | — |
| 60-63 | — | "Reguła kciuka: **JSON panel** to najtańsza droga… Sięgaj po **Custom UI panel** dopiero, gdy potrzebujesz interakcji, własnego layoutu, tabel, edycji albo dark mode." | — | — |
| 77-78 | `assets/custom-ui-panel-template.html`; `sendFile` | "Dla Custom UI: skopiuj `assets/custom-ui-panel-template.html` do `public/pd-ui/<nazwa>.html` i dodaj route serwujący go przez `sendFile`." | — | — |
| 79-81 | signed JWT; `X-Pipedrive-Token`; `verifyPipedriveJwt`; allowlist | "Wzorzec: sygnowany JWT z SDK → nagłówek `X-Pipedrive-Token` → `verifyPipedriveJwt` na serwerze → gating przez allowlist… Domyślnie **fail-closed**." | — | **Fail-closed** default |
| 82-84 | proxy `/api/pd/*`; hashed custom fields | "czytaj/zapisuj przez proxy `/api/pd/*` (token wstrzykiwany po stronie serwera) albo bezpośrednio API. Custom fields to **hashowane klucze**" | — | — |
| 85-86 | Developer Hub; `ui_extensions[]`; `manifest()` | "**Zarejestruj w Developer Hubie** i dopisz do `ui_extensions[]` w `manifest()` (`server.mjs`)." | — | — |
| 87-89 | Railway; browser preview mode | "**Zweryfikuj lokalnie i na Railway.** Panel musi działać też w „gołej" przeglądarce (bez `?id`) jako podgląd z danymi mock" | — | **Fallback mode**: mock preview outside Pipedrive |
| 96-98 | Apps SDK; `?id` query param | "**Inicjalizuj SDK tylko wewnątrz Pipedrive.** Sprawdzaj `?id` w query: brak → to zwykła przeglądarka, pokaż podgląd na danych mock i **nie** ruszaj SDK." | — | No `?id` → skip SDK entirely |
| 99-100 | `/vendor/app-extensions-sdk.umd.js`; npm | "**SDK ładuj z `/vendor/app-extensions-sdk.umd.js`** (self-host), przez `<script>`, potem `new window.AppExtensionsSDK().initialize()`. Nie dodawaj zależności npm." | — | npm dependency forbidden |
| 101-103 | Apps SDK `RESIZE`; `ResizeObserver` | "**RESIZE klamruj do 100–750 px wysokości, szerokość 800.** Pipedrive odrzuca wartości spoza zakresu. Resize wołaj po renderze i przez `ResizeObserver` (debounce ~80 ms)" | **height 100–750 px, width 800**, debounce ~80 ms | Out-of-range values rejected by Pipedrive |
| 104-106 | `sdk.userSettings?.theme`; `Event.USER_SETTINGS_CHANGE`; CSS vars | "**Motyw**: czytaj `sdk.userSettings?.theme`, ustaw `data-theme` na `<html>`, i nasłuchuj `Event.USER_SETTINGS_CHANGE`." | — | — |
| 107-108 | `Command.GET_SIGNED_TOKEN`; `?token=` fallback; `X-Pipedrive-Token` | "**Token**: `Command.GET_SIGNED_TOKEN` z fallbackiem na `?token=` z URL. Wysyłaj go do backendu jako `X-Pipedrive-Token`. Token żyje ~5 min — odświeżaj." | **TTL ~5 min** | **Explicit fallback** to `?token=` query param |
| 109-111 | `PIPEDRIVE_JWT_SECRET`; `PIPEDRIVE_CLIENT_SECRET`; Developer Hub JWT secret | "**Sekret JWT** do weryfikacji to `PIPEDRIVE_JWT_SECRET` (fallback `PIPEDRIVE_CLIENT_SECRET`) i **musi** pokrywać się z JWT secret tej wtyczki w Developer Hubie — inaczej każda weryfikacja zwróci „odmowa"." | — | Mismatch → **every verification denies** |
| 112-113 | `PIPEDRIVE_API_TOKEN`; proxy `/api/pd/*` | "**Nigdy nie wystawiaj `PIPEDRIVE_API_TOKEN` do frontu.** Dane z API ciągnij przez proxy `/api/pd/*`, które wstrzykuje token serwerowo." | — | — |
| 137-140 | `assets/custom-ui-panel-template.html` | "**Kopiuj go**, zmień nazwę, podmień `render()` i endpoint ACL — reszta działa." | — | — |

## 30. `skills/sailes-pipedrive/assets/custom-ui-panel-template.html`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 12 | ACL endpoint | "3. ACL_ENDPOINT — '/api/pd-panel/<nazwa>/acl' (albo usuń enforceAcl, jeśli dane jawne)" | — | ACL removable when data is public |
| 14-15 | Apps SDK invariants | "Niezmienne (nie ruszaj bez powodu): init tylko gdy ?id, SDK z /vendor/, RESIZE 100–750/800, motyw przez data-theme + USER_SETTINGS_CHANGE, token przez GET_SIGNED_TOKEN (fallback ?token=)." | 100–750 / 800 | — |
| 25 | `html[data-theme="dark"]` | "html[data-theme=\"dark\"]{" | — | — |
| 90 | dynamic `<script>` loader | "function loadScript(src){return new Promise((ok,err)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=err;document.head.appendChild(s);});}" | — | — |
| 93-102 | `window.AppExtensionsSDK.Command.RESIZE` | "// SDK akceptuje wysokość tylko z zakresu 100–750 px — klamrujemy każdą wartość.\nasync function setHeight(h){\n  try{\n    const cmd = window.AppExtensionsSDK?.Command?.RESIZE;\n    if(sdk?.execute && cmd){\n      const hh = Math.min(750, Math.max(100, Math.round(h) \|\| 100));\n      await sdk.execute(cmd, { width: 800, height: hh });\n    }\n  }catch(e){ console.warn('resize failed', e); }\n}" | 100–750, width 800 | Failure caught and logged, panel continues |
| 107 | RESIZE to 1px | "function hidePanel(){ hidden=true; document.querySelector('.wrap').innerHTML=''; document.documentElement.style.background='transparent'; setHeight(1); }" | — | — |
| 110-117 | `Command.GET_SIGNED_TOKEN`; `?token=` | "async function getToken(){\n  let token = new URLSearchParams(location.search).get('token') \|\| '';\n  try{\n    const cmd = window.AppExtensionsSDK?.Command?.GET_SIGNED_TOKEN;\n    if(sdk?.execute && cmd){ const p = await sdk.execute(cmd); if(p?.token) token = p.token; }\n  }catch(e){ /* zostaje token z URL */ }\n  return token;\n}" | — | **Fallback**: URL token retained if SDK call throws |
| 119-129 | ACL fetch | "// Gating: brak tokenu (przeglądarka) → podgląd; serwer mówi {allowed:false} → ukryj." · "  }catch(e){ /* błąd sieci → nie ukrywamy */ }" | — | **Network error → do NOT hide** (fail-open on network failure); no token → preview mode |
| 131-134 | `Command.SHOW_SNACKBAR` | "// (opcjonalnie) toast po zapisie:\nasync function snackbar(message){\n  try{ const cmd = window.AppExtensionsSDK?.Command?.SHOW_SNACKBAR; if(sdk?.execute && cmd) await sdk.execute(cmd, { message }); }catch(e){}\n}" | — | Optional; errors swallowed |
| 136-153 | SDK init | "  const q = new URLSearchParams(location.search);\n  if(!q.has('id')) return; // poza Pipedrive — sam podgląd na danych mock" · "    await loadScript('/vendor/app-extensions-sdk.umd.js');\n    if(!window.AppExtensionsSDK) return;\n    sdk = await new window.AppExtensionsSDK().initialize();" · "  }catch(e){ console.warn('SDK init skipped', e); }" | — | **SDK absent → return silently**; init failure → warn and skip |
| 145-146 | `Event.USER_SETTINGS_CHANGE` | "const ev = window.AppExtensionsSDK?.Event?.USER_SETTINGS_CHANGE;\n    if(ev && sdk.listen) sdk.listen(ev, ({data})=>{ …" | — | Guarded — skipped if event/listen absent |
| 156-158 | `prefers-color-scheme` | "// dark mode fallback poza Pipedrive\nif(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches && !new URLSearchParams(location.search).has('id')){" | — | **Explicit fallback** outside Pipedrive |
| 162 | `ResizeObserver` | "new ResizeObserver(()=>scheduleResize()).observe(document.body);" | — | — |

## 31. `skills/sailes-pipedrive/references/api-i-custom-fields.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 3-4 | Pipedrive docs | "> Dokumentacja API: https://developers.pipedrive.com/docs/api/v1\n> App Extensions: https://pipedrive.readme.io/docs/app-extensions" | **API v1** | — |
| 8-18 | proxy `/api/pd/*`; `PIPEDRIVE_API_TOKEN`; `api.pipedrive.com/v1` | "Front **nigdy** nie widzi `PIPEDRIVE_API_TOKEN`. Wszystko leci przez proxy w `server.mjs`, które wstrzykuje token serwerowo" · "const apiUrl = `https://api.pipedrive.com/v1${apiPath}?${apiParams.toString()}`;" | **v1** | — |
| 24 | — | "const res = await fetch('/api/pd/deals?status=all_not_deleted&limit=500');" | limit 500 | — |
| 28-29 | Vite dev proxy; `vite.config.ts` | "W devie Vite proxuje `/api/pd` na `api.pipedrive.com` i też dokleja token (patrz `vite.config.ts`)." | — | — |
| 31-34 | Pipedrive custom fields (40-char hash keys); `src/api/pipedrive.ts` `FIELDS` | "Pola niestandardowe Pipedrive mają klucze w postaci 40-znakowego hasha (nie czytelnej nazwy). Centralna mapa: `src/api/pipedrive.ts` (`FIELDS`)." | 40-char hash | — |
| 49-52 | `GET /dealFields`, `personFields`, `organizationFields` | "Nowy hash bierzesz z Pipedrive: `GET /dealFields` (albo `personFields` / `organizationFields`) i szukasz po `name` → `key`." | — | — |
| 53-63 | enum/select option IDs | "**Pola enum/select** przechowują **numeryczne ID opcji**, nie tekst. Mapuj etykiety na ID" | — | — |
| 68-86 | `PUT /deals/{id}`, `PUT /persons/{id}`, `PUT /organizations/{id}` | "const u = new URL(`https://api.pipedrive.com/v1/deals/${dealId}`);" · "Analogicznie `PUT /persons/{id}` i `PUT /organizations/{id}`." | **v1**, method **PUT** | — |
| 88-94 | `paceGate` semaphore; `PIPEDRIVE_REQ_INTERVAL_MS`; HTTP 429 | "Pipedrive ogranicza tempo (≈ kilka żądań/s). Repo ma semafor `paceGate` wymuszający minimalny odstęp między żądaniami (domyślnie ~2 s, konfigurowalny `PIPEDRIVE_REQ_INTERVAL_MS`). Przy operacjach masowych… **przepuszczaj żądania przez paceGate** i zapisuj postęp partiami, żeby nie dostać 429 i móc wznowić." | ~2 s default interval; a few req/s limit | Without it: HTTP 429 |
| 96-102 | Railway PostgreSQL (**not Supabase**); `pg` pool | "Repo trzyma lokalną kopię deali/aktywności w Postgres (Railway) jako cache + audyt. Po zapisie do Pipedrive … **zapisz też do PG**… Baza to **Railway PostgreSQL** (nie Supabase) — połączenie przez pulę `pg` w `server.mjs`." | — | Supabase explicitly excluded |

## 32. `skills/sailes-pipedrive/references/auth-acl.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 3-5 | signed token; `X-Pipedrive-Token`; HS256 JWT; allowlist | "panel pobiera **sygnowany token** z SDK → wysyła go jako `X-Pipedrive-Token` → backend **weryfikuje** JWT (HS256) → sprawdza **allowlist**. Domyślnie **fail-closed**, gdy lista aktywna." | **HS256** | **Fail-closed** when list active |
| 7-9 | Pipedrive signed token; Developer Hub JWT secret; docs | "> Sygnowany token Pipedrive (signed token) żyje ~5 minut i jest podpisany sekretem JWT Twojej wtyczki (z Developer Huba). Dokumentacja: https://pipedrive.readme.io/docs/app-extensions" | **~5 min TTL** | — |
| 15 | `PIPEDRIVE_JWT_SECRET`; `PIPEDRIVE_CLIENT_SECRET` | "const secret = process.env.PIPEDRIVE_JWT_SECRET \|\| process.env.PIPEDRIVE_CLIENT_SECRET;\n  if (!secret) return null;" | — | **No secret → return null** (deny) |
| 20-24 | Node `createHmac('sha256')`; `timingSafeEqual`; `Buffer` | "const expected = base64UrlEncode(\n    createHmac('sha256', secret).update(`${encHeader}.${encPayload}`).digest()\n  );" · "if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;" | — | — |
| 27-29 | HS256; `exp` | "if (header.alg !== 'HS256') return null;          // tylko HS256" · "if (payload.exp && payload.exp < Math.floor(Date.now()/1000)) return null;  // wygasł" | HS256 only | Non-HS256 or expired → deny |
| 34-40 | `X-Pipedrive-Token`; `Authorization: Bearer` | "const h = req.headers['x-pipedrive-token'] \|\| '';\n  if (h) return h.trim();\n  const auth = req.headers['authorization'] \|\| '';\n  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();" | — | **Fallback** to Bearer header |
| 43-44 | Developer Hub JWT secret; HS256 vs RS256 | "**Sekret musi się zgadzać** z JWT secret wtyczki w Developer Hubie — najczęstsza przyczyna „wszystko zwraca deny". Algorytm to **HS256** (HMAC), nie RS256." | HS256 not RS256 | Mismatch → everything denies |
| 49-58 | cookie `pd_dashboard_session` | "const sessionPayload = cookies.pd_dashboard_session\n    ? verifyPipedriveJwt(cookies.pd_dashboard_session) : null;\n  if (sessionPayload && sessionPayload.kind === 'session') return sessionPayload;  // pełna apka\n  return null;" | — | Neither present → null |
| 61-81 | `<NAZWA>_PANEL_ALLOWLIST` env; `fetchPipedriveUserEmail` | "Lista z env; **pusta → wszyscy** (zachowanie domyślne), **aktywna → tylko pasujący** (fail-closed)" · "if (PANEL_ALLOWLIST.length === 0) return true;            // brak listy → wszyscy" · "if (!payload \|\| payload.userId == null) return false;     // brak/zły token → deny" | — | **Empty list → allow all**; bad/missing token → deny |
| 74 | `?token=` query fallback (JSON panel) | "if (!token && urlObj) token = urlObj.searchParams.get('token') \|\| '';   // fallback z query (JSON panel)" | — | — |
| 84-85 | allowlist entry forms | "Allowlist przyjmuje trzy formy wpisu: numeryczne `userId`, dokładny e-mail, albo sufiks domeny `@firma.pl`." | — | — |
| 89-93 | denial per extension type | "- **JSON panel** — nie zwracaj 403. Zwróć **pusty `data: []`** (Pipedrive nie ma jak pokazać błędu sensownie).\n- **Custom UI panel** — … przy `{allowed:false}` zrób `hidePanel()` (wyczyść treść, RESIZE do 1 px).\n- **Pełna apka (poza iframe)** — wymagaj ciasteczka sesji; brak → 403." | — | Three distinct denial behaviours |
| 100-113 | own HS256 JWT; grant/session TTLs; `pd_dashboard_session` cookie | "Grant: krótki TTL (≈60 s), `kind:'grant'`. Sesja: długi TTL (≈30 dni), `kind:'session'`, w ciasteczku `pd_dashboard_session` (HttpOnly, Secure)." | grant ≈60 s; session ≈30 days | — |

## 33. `skills/sailes-pipedrive/references/custom-ui-panel.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 5-7 | `public/pd-ui/sluzebnosci.html`; `assets/custom-ui-panel-template.html` | "W repo wzorcem jest `public/pd-ui/sluzebnosci.html`, a generyczny szkielet leży w `assets/custom-ui-panel-template.html` — **kopiuj szablon, nie pisz od zera**." | — | — |
| 11-14 | Developer Hub → App extensions → Custom UI → Panel; iframe query params | "Developer Hub → *App extensions → Custom UI → Panel*, location np. *Deal details*, Iframe URL = `<APP_URL>/pd-ui/<nazwa>`. Pipedrive ładuje stronę w iframe z query: `?id=<dealId>&resource=deal&selectedIds=<ids>&userId=<id>&companyId=<id>`. Obecność `?id` jest naszym sygnałem „jesteśmy wewnątrz Pipedrive"." | — | — |
| 18-32 | `server.mjs` route; `sendFile`; `sendJson`; `/api/pd-panel/<nazwa>/acl` | "if (url.pathname === '/pd-ui/<nazwa>' \|\| url.pathname === '/pd-ui/<nazwa>/') {\n  sendFile(res, join(root, 'public', 'pd-ui', '<nazwa>.html'));" | — | — |
| 38-50 | Apps SDK lifecycle; `/vendor/app-extensions-sdk.umd.js`; `Event.USER_SETTINGS_CHANGE`; `GET_SIGNED_TOKEN`; `?token=`; RESIZE | "1. **Wykrycie kontekstu** — `?id` w URL? Nie → zwykła przeglądarka: pokaż podgląd na danych mock, **nie** ruszaj SDK." · "`{allowed:false}` → `hidePanel()` (czyści treść, ściska iframe do 1 px). Brak tokenu/błąd sieci → **nie** ukrywaj (to tryb podglądu)." · "wołaj RESIZE z wysokością **klamrowaną do 100–750 px**, szerokość 800." | 100–750 px / 800; debounce ~80 ms | **No token / network error → do NOT hide** |
| 54-88 | Apps SDK code (identical shape to template) | "sdk = await new window.AppExtensionsSDK().initialize();" · "if(!window.AppExtensionsSDK) return;" | — | SDK missing → return |
| 90-93 | `Command.RESIZE`, `Command.GET_SIGNED_TOKEN`, `Command.SHOW_SNACKBAR`, `Event.USER_SETTINGS_CHANGE` | "Dostępne komendy/eventy, których używamy: `Command.RESIZE`, `Command.GET_SIGNED_TOKEN`, `Command.SHOW_SNACKBAR` (toast po zapisie), `Event.USER_SETTINGS_CHANGE`. (SDK ma ich więcej — sięgaj po nie z dokumentacji Pipedrive tylko, gdy są potrzebne.)" | — | — |
| 97-101 | CSS vars; `prefers-color-scheme: dark` | "Poza Pipedrive dodaj fallback `prefers-color-scheme: dark`, żeby podgląd w przeglądarce też miał dark." | — | Explicit fallback |
| 104-110 | mock → real data; `X-Pipedrive-Token`; `PUT /deals/{id}`; `SHOW_SNACKBAR` | "Wzorzec repo: panel startuje z **danymi mock** wbudowanymi w plik (żeby działał jako podgląd i dało się go iterować bez Pipedrive)." | — | — |
| 114-120 | `cp` template; `server.mjs` route; allowlist; Developer Hub | "1. `cp assets/custom-ui-panel-template.html public/pd-ui/<nazwa>.html`." · "6. Sprawdź: otwórz `<APP_URL>/pd-ui/<nazwa>` w przeglądarce (podgląd) **i** w karcie deala (pełny flow z resize/theme/ACL)." | — | — |

## 34. `skills/sailes-pipedrive/references/floating-window-app.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 4-6 | dashboard routes `?pipedrive=1`, `/floating-menu`, `/floating-all`, `/preview` | "W repo to dashboard otwierany w pływającym oknie (`?pipedrive=1`, `/floating-menu`, `/floating-all`, `/preview`)." | — | — |
| 9-14 | Custom floating window; Custom modal; Link action / app action | "- **Custom modal** — modal-iframe (blokujący), do krótkich akcji/formularzy. Mechanika identyczna z floating window (inny `type` w `ui_extensions`)." | — | — |
| 18-28 | `ui_extensions[]`; `manifest()`; `server.mjs`; `custom_floating_window` | "{\n  key: 'frejowski-sales-dashboard-menu',  // unikalny, stabilny klucz\n  type: 'custom_floating_window',         // typ rozszerzenia\n  label: 'Sales Dashboard Menu',          // etykieta w UI Pipedrive\n  icon: `${appUrl}/icon.svg`,\n  url: `${appUrl}/floating-menu`,         // route Twojej apki\n}" | — | — |
| 30-32 | Developer Hub | "Po zmianie `manifest()` zaktualizuj też apkę w Developer Hubie" | — | — |
| 35-48 | React; `src/lib/pipedriveEmbed.ts`; `initializePipedriveEmbed()`; `isEmbedded()`; `getPipedriveAuthHeaders()`; `X-Pipedrive-Token`; RESIZE | "`initializePipedriveEmbed()` inicjalizuje SDK, gdy `isEmbedded()` **lub** w URL jest `id`/`companyId`/`pipedrive=1`; ustawia klasę `pipedrive-embedded`, motyw, RESIZE (domyślnie 800×700; dla `/settings` rośnie do treści) i nasłuch motywu. Auth do własnego backendu: `getPipedriveAuthHeaders()` → `{ 'X-Pipedrive-Token' }`." | RESIZE default **800×700** | — |
| 52-59 | query context params `id`, `selectedIds`, `resource`, `userId`, `companyId`, `token` | "- `token` — sygnowany JWT (fallback, gdy nie pobierasz przez `GET_SIGNED_TOKEN`)." | — | Explicit fallback |
| 61-73 | grant→session; `POST /api/dashboard/grant`; `/dashboard-bridge`; `pd_dashboard_session` | "2. Backend weryfikuje JWT, sprawdza uprawnienia (np. admin), zwraca `{ url: '/dashboard-bridge?dt=<grantJwt>&tab=…' }` z krótkim (≈60 s) grantem." · "4. `/dashboard-bridge` konsumuje grant, ustawia ciasteczko sesji (`pd_dashboard_session`, ~30 dni, sygnowane), redirect do apki.\n5. Trasy pełnej apki wymagają tej sesji (fail-closed)." | grant ≈60 s; session ~30 days | **Fail-closed** |
| 75-76 | — | "Używaj tego wzorca tylko, gdy faktycznie potrzebujesz wyjść poza iframe (np. ciężki dashboard). Do zwykłych akcji wystarczy okno z `X-Pipedrive-Token`." | — | — |

## 35. `skills/sailes-pipedrive/references/json-panel.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 10-13 | Developer Hub → App extensions → JSON panel; query params incl. `token=<jwt>` | "Po rejestracji (Developer Hub → *App extensions → JSON panel*, location np. *Deal details*) Pipedrive robi `GET` na Twój endpoint z parametrami w query: `?resource=deal&selectedIds=<dealId>&userId=<id>&companyId=<id>&token=<jwt>`." | — | — |
| 20-51 | `server.mjs` `createServer` handler; `Access-Control-Allow-Origin: *`; `Cache-Control: no-store` | "res.writeHead(200, {\n    'Content-Type': 'application/json; charset=utf-8',\n    'Cache-Control': 'no-store',\n    'Access-Control-Allow-Origin': '*',\n  });" | — | — |
| 41-42 | ACL gating | "// Gating: gdy lista ACL aktywna i user spoza niej → pusty panel (patrz auth-acl.md).\n  if (!(await <nazwa>ViewerAllowed(req, url))) panel.data = [];" | — | Empty `data` rather than 403 |
| 56-69 | JSON panel field types; Pipedrive status colours | "**`status`** — `{ color, label }`. Kolory Pipedrive: `green`, `red`, `yellow`, `blue`, `grey`" · "**Pole walutowe** — `{ code: 'PLN', value: 275150.90 }`." · "**Link** — `{ label, value: '<url>', external: true }`." | fixed colour set | — |
| 71-74 | Pipedrive Developer Docs | "> Dokładny, aktualny zestaw obsługiwanych typów pól potrafi się zmieniać w API Pipedrive — jeśli pole nie renderuje się jak chcesz, sprawdź dokumentację „JSON panel" w Developer Docs Pipedrive i dopasuj kształt." | — | **Fallback**: consult docs |
| 78-81 | — | "Jeśli dane są wrażliwe, nie zwracaj 403 — Pipedrive po prostu nie pokaże nic sensownego. Zamiast tego **zwróć pusty `data: []`**… Gdy dane są nieszkodliwe, auth można pominąć" | — | Auth optional for harmless data |

## 36. `skills/sailes-pipedrive/references/manifest-oauth-rejestracja.md`

| Line | Tool | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 3-6 | Pipedrive docs | "> **Oficjalna dokumentacja (źródło prawdy):** https://pipedrive.readme.io/docs/app-extensions\n> Gdy ten skill nie odpowiada na pytanie… — sprawdź tam, zanim zgadniesz." | — | **Fallback**: docs win |
| 10-32 | `GET /manifest.json`; `manifest()`; `schema_version: '1.0'`; `auth.type: 'oauth2'`; scopes; `settings.url`; `ui_extensions[]` | "schema_version: '1.0'," · "auth: {\n      type: 'oauth2',\n      redirect_uri: `${appUrl}/oauth/callback`,\n      scopes: pipedriveScopes,   // np. ['base','deals:read','users:read','activities:read','contacts:read']\n    }," | **schema_version 1.0**; OAuth2 | — |
| 35-38 | Developer Hub vs manifest split | "**Dodanie nowej wtyczki = nowy wpis w `ui_extensions[]`** (dla floating window / modal). JSON panele i Custom UI panele konfiguruje się w samym Developer Hubie (URL endpointu/iframe'a), niekoniecznie w tej tablicy — zależnie od typu. Sprawdź w dokumentacji, co konfiguruje się w manifeście, a co w panelu Hub." | — | Uncertainty → check docs |
| 43-48 | Env vars: `APP_URL`; `PIPEDRIVE_CLIENT_ID`/`PIPEDRIVE_CLIENT_SECRET`; `PIPEDRIVE_JWT_SECRET`; `PIPEDRIVE_API_TOKEN`; `PIPEDRIVE_SCOPES` | "\| `PIPEDRIVE_JWT_SECRET` \| Sekret do weryfikacji sygnowanych tokenów paneli (fallback: `CLIENT_SECRET`). **Musi** == JWT secret wtyczki w Hubie. \|" · "\| `PIPEDRIVE_API_TOKEN` \| Globalny token API (proxy `/api/pd/*`, import, webhooki). Nigdy do frontu. \|" · "\| `PIPEDRIVE_SCOPES` \| Scope'y OAuth (string rozdzielony spacjami). \|" | — | Explicit `CLIENT_SECRET` fallback |
| 50-63 | OAuth2 flow; `oauth.pipedrive.com/oauth/authorize`; `oauth_states` table; `/users/me`; `installations` table; `ensureValidAccessToken` | "1. **`GET /oauth/install`** — generuje `state` (CSRF, zapis w `oauth_states`), redirect na `https://oauth.pipedrive.com/oauth/authorize` z `client_id`, `redirect_uri`, `scope`, `state`." · "3. **Odświeżanie** — `ensureValidAccessToken(companyKey, installation)` odświeża token z 30-sekundowym buforem przed wygaśnięciem." | **30-second** refresh buffer | — |
| 52 | — | "Potrzebne tylko, gdy apka jest instalowalna per-konto (multi-tenant)." | — | OAuth optional for single-account |
| 65-66 | `installations`; `PIPEDRIVE_API_TOKEN` | "Token API per-firma trzymamy w `installations`; globalny `PIPEDRIVE_API_TOKEN` służy do importu/proxy/webhooków." | — | — |
| 68-86 | Developer Hub registration steps; Railway; `GET /manifest.json`; HTTPS | "4. **JWT secret** — przy panelach Pipedrive pokazuje sekret do podpisu tokenów. Wpisz go jako `PIPEDRIVE_JWT_SECRET` (musi się zgadzać, inaczej ACL = deny)." · "7. Po deployu na Railway zweryfikuj, że `GET /manifest.json` zwraca aktualny manifest i że iframe URL-e są publicznie dostępne (HTTPS)." | HTTPS required | Secret mismatch → ACL deny |
| 88-90 | Pipedrive docs | "> Dokładne nazwy pól w Hubie i wymagane uprawnienia bywają aktualizowane — w razie rozjazdu trzymaj się tego, co pokazuje https://pipedrive.readme.io/docs/app-extensions." | — | Docs are the tiebreak |

## 37. `skills/sailes-pre-implement/SKILL.md`

| Line | Tool / service | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 23-25 | `.ai/specs/`; `.ai/lessons.md`; `AGENTS.md` Task Router | "Use the **Task Router** in `AGENTS.md` to find every guide/module the spec touches — read all matching ones." | — | — |
| 26 | `Explore` / `explorer` subagents | "For a large scope, dispatch read-only `Explore`/`explorer` subagents (one area each) — keep main context clean." | — | Scope-dependent |
| 33-40 | Contract surfaces: public types/interfaces; function/API signatures; HTTP routes; DB schema; event names/payloads; import paths/exports; permission/role IDs; file/config conventions | "\| DB schema \| renamed/removed column or table? (migration + backfill?) \|" · "Walk these contract surfaces (drop those that don't apply to this stack)" | — | Stack-conditional — drop inapplicable rows |
| 44-48 | **graphify** (`graphify explain`, `graphify path`, `graphify-out/graph.json`, `graphify-setup.md`) | "**Mechanical BC probe (when `graphify-out/graph.json` exists):** for every surface the spec touches, run `graphify explain \"<symbol>\"` (its full in/out edge list = the real blast radius) and `graphify path \"<changed thing>\" \"<suspected dependent>\"` for each risky pair. Paste the edge lists into the readiness report as evidence — cited edges, not prose claims. Freshness check first (graphify-setup.md); a stale graph is not evidence." | — | **Conditional on graph.json existing**; stale graph ≠ evidence |
| 51 | `sailes-spec` required sections | "Against the `sailes-spec` required sections: is anything missing or vague?" | — | — |
| 68 | `sailes-database`; `sailes-implement`; `sailes-bootstrap/agent-team-structure.md`; `team-lead`; `checker`; `qa` | "**READY** → if the spec touches the DB (new/changed tables, columns, indexes, migrations), route through **`sailes-database`** first… Then hand to `sailes-implement`. For non-trivial scope this is where the **agent team** starts: the driving agent acts as `team-lead` and runs roles/order/gates/lifecycle per `sailes-bootstrap/agent-team-structure.md` (spawn one worker per task, release on integration; `checker` + `qa` gates; workers never commit/push)." | — | Conditional routing |

## 38. `skills/sailes-spec/SKILL.md`

| Line | Tool / service | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 16-21 | local `.ai/skills/spec-writing/SKILL.md`; `sailes-bootstrap/spec-writing-template.md` | "1. **Local skill exists** (`.ai/skills/spec-writing/`) → use it… This global skill is the fallback, not the override.\n2. **No local skill** … → **use this skill.** It's the safety net so the spec still follows the standard regardless of entry point." | — | **Explicit precedence + fallback** |
| 31 | `.ai/specs/`, `.ai/specs/implemented/` | "Check `.ai/specs/` **and `.ai/specs/implemented/`** for an existing spec on this area." | — | — |
| 38 | `sailes-wayfinder` | "**Escalation — Open Questions bigger than one sitting:** … invoke **`sailes-wayfinder`**, convert each unknown into a typed ticket… and resume writing when the map clears." | — | Escalation path |
| 41 | `pnpm test`; `curl` | "the exact command(s) to run + the expected outcome (e.g. `pnpm test src/auth → 0 failures`; `curl -s -o /dev/null -w '%{http_code}' -X POST /api/export → 200 + non-empty file`; UI: screenshot of screen X matches the design artifact)" | — | — |
| 47 | Open-Mercato `.ai/specs/` (external reference repo) | "(Pattern proven in Open-Mercato `.ai/specs/`.)" | — | — |
| 68-71 | `git mv` | "set `Status: implemented` and **`git mv` the file to `.ai/specs/implemented/`** (git mv preserves history)." · "**Idempotent:** if the repo already has its own specs lifecycle convention, follow it — don't impose this one over a different existing scheme." | — | **Defer to existing repo convention** |
| 84 | snake_case, UUID PK, `organizationId` | "**Data Model** — tables/columns touched or added (snake_case, UUID PK, timestamps; `organizationId` only if multi-tenant)." | — | — |
| 85 | Zod schemas / TS types (contract artifact) | "**Name the contract artifact path(s)** this spec creates/extends (shared Zod schemas / TS types both slices import — the frozen-contract artifact, not a prose shape)." | — | — |
| 86 | webhooks: verify→validate→persist→202; idempotency; retry; sync tables | "**Integration / Webhooks** — per external system: intake (verify→validate→persist→202), idempotency, retry, sync tables." | HTTP 202 | — |
| 87 | cron vs job vs durable workflow | "**Jobs / Workflows** — cron vs job vs durable workflow; which tier." | — | — |
| 88 | Zod; audit log; signed secrets; authz matrix | "**Security** — auth + permission checks, Zod validation, signed secrets, audit log, file access control… **A spec touching auth/roles declares the permission matrix**" | — | — |
| 91 | `.ai/backlog.md` | "Push deferred-but-worth-keeping items (later phases, tech debt) to `.ai/backlog.md` so they aren't lost in this one spec." | — | — |
| 95-102 | **Baseline stack block**: Drizzle; Better Auth (Google login); `apps/worker`; Zod (`z.infer`); `organizationId`; Vitest; MSW; Testcontainers; Playwright; Postgres; signed URLs | "- ORM: Drizzle — explicit schema in TS, migrations committed + reviewed.\n- Auth: Better Auth (Google login = login only, never Gmail access).\n- Worker: `apps/worker` for all async work; webhooks are intake-only.\n- Validation: Zod at every boundary; types via `z.infer`; no `any`.\n- Tenancy: single-tenant default; multi-tenant → `organizationId` everywhere + isolation tests.\n- Tests: Vitest + MSW + Testcontainers + Playwright; self-contained, no faked passes.\n- Files: private by default, signed URLs, metadata in Postgres, access log." | — | — |
| 103 | — | "(If the repo locked a different stack, adapt this block to it — the workflow and sections stay the same.)" | — | **Explicit adaptation rule** — baseline is not mandatory |
| 110-113 | Zod; webhooks idempotency/retry/dead-letter | "- [ ] Webhooks async intake-only; idempotency + retry + dead-letter." | — | — |
| 118 | "canonical primitives" | "- [ ] Canonical primitives used (no reinvented framework substitutes)." | — | — |
| 130, 145 | `sailes-wayfinder` | "Flat Open Questions list growing across sessions \| Escalate to `sailes-wayfinder` (typed tickets + map); resume at skeleton when it clears." | — | — |

## 39. `skills/sailes-start/SKILL.md`

| Line | Tool / service | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 13-24 | `sailes-discovery`, `sailes-bootstrap`, spec-writing (routes A/B/C) | "START → \|  sailes-discovery(greenfield) → sailes-bootstrap(Case B: generate     \| → implementation" | — | — |
| 49 | filesystem detection (`AGENTS.md`, `.ai/`) | "Detect from context (empty dir / \"nowa aplikacja\" → A; existing repo with AGENTS.md+`.ai/` → B; populated repo without them → C), but confirm if ambiguous — **trust the filesystem**" | — | Filesystem beats prompt |
| 51 | `sailes-wayfinder` | "**Fog check (before Phase 1):** if the idea is too big or foggy for one discovery session — unknowns depending on other unknowns, on research/spikes (API access not yet granted), or on client input arriving later … — invoke **`sailes-wayfinder`** first" | — | — |
| 66 | git (`git init`, first commit); `AGENTS.md`/`CLAUDE.md`/`README.md`/`.ai/`; `lessons.md`; `backlog.md` | "Route A → Case B: **generate** the repo skeleton + `AGENTS.md`/`CLAUDE.md`/`README.md`/`.ai/` (full structure incl. `lessons.md`/`backlog.md` as header-only, idempotent — never overwrite existing) + baseline stack + working system, **git init + first commit**." | — | Idempotent — never overwrite existing |
| 68 | `adopt-existing-repo.md` | "Route C → Case C: **reverse-engineer** existing conventions, **document the existing stack** (validate mode against the repo's current conventions, not a frozen template), and **add** the methodology layer additively — never touching running code." | — | Additive only |
| 69-70 | `sailes-design`; `repo-done-checklist.md` | "Bootstrap includes its **Step 4.5 design gate** (invokes `sailes-design`) for any UI work, and its **Step 5 artifact verification** (`repo-done-checklist.md`)." | — | — |
| 74 | `design-system/MASTER.md` or `.ai/specs/ui-spec.md` | "For any app with a UI, a deliberate design direction + persisted artifact (`design-system/MASTER.md` or `.ai/specs/ui-spec.md`) is produced here… Backend-only work skips it explicitly." | — | Backend-only → skip |
| 78-82 | local `.ai/skills/spec-writing/SKILL.md`; Open-Mercato (example repo); global `sailes-spec` | "**By this point a local `spec-writing` skill always exists** at `.ai/skills/spec-writing/SKILL.md`… If — and only if — no local skill exists (bootstrap was skipped), self-write the spec per the conventions bootstrap defined." | — | **Fallback**: self-write |
| 87-90 | `sailes-pre-implement`; `sailes-implement`; `sailes-bootstrap/agent-team-structure.md`; `release-checklist.md`; `repo-done-checklist.md`; `git mv` | "**Release gate** — deploying work does not end at green tests: `sailes-bootstrap/release-checklist.md` (env parity, migration ordering, post-deploy smoke with output pasted, rollback plan written pre-deploy) + the Operations block in `repo-done-checklist.md` for a first production launch." | — | — |
| 102 | `find`; `git log` | "**Never claim a phase done without evidence** — Phase 2 ends only when `repo-done-checklist.md` shows all-green (real `find`/`git log` output), not when you intended to create the files." | — | — |
| 136 | `AGENTS.md`, `.ai/skills/`, git | "You're about to write a spec and there's no `AGENTS.md` / `.ai/skills/` / git — bootstrap didn't really finish; run `repo-done-checklist.md`." | — | STOP condition |

## 40. `skills/sailes-wayfinder/SKILL.md`

| Line | Tool / service | Verbatim quote | Version | Absent-behaviour |
|---|---|---|---|---|
| 12 | Wayfinder methodology (Matt Pocock); decision cards; research subagents; `sailes-design` prototypes | "Adapted from the Wayfinder methodology (Matt Pocock) with **zero external dependencies**: every ticket type resolves through mechanisms this framework already has — decision cards (`sailes-discovery` style), research subagents, `sailes-design` prototypes." | — | **Explicitly zero external dependencies** |
| 24 | local markdown; git | "Default tracker is **local markdown** — truth on disk, versioned in git, zero dependencies:" | — | — |
| 26-31 | `.ai/wayfinder/<effort-kebab>/map.md`; `tickets/NNN-<kebab>.md` | "```\n.ai/wayfinder/<effort-kebab>/\n  map.md                      # the map — index, not store\n  tickets/NNN-<kebab>.md      # one file per ticket\n```" | — | — |
| 32 | **GitHub Issues** (with labels `wayfinder:map` / `wayfinder:<type>`, native blocked-by); `.ai/STATE.md` | "If the team already runs planning on GitHub Issues, offer a 🔀 decision card (local files vs Issues with labels `wayfinder:map` / `wayfinder:<type>` and native blocked-by) — the user chooses; either way there is exactly **one** canonical home. `.ai/STATE.md` points at the active map (path + next frontier ticket); the map holds the plan." | — | **Alternative backend offered as a decision card**; exactly one canonical home |
| 44 | `sailes-pipedrive`, `sailes-database` (skills the map's Notes may name) | "<domain; skills every session should consult (sailes-pipedrive, sailes-database, …); standing preferences for this effort>" | — | — |
| 60-71 | Ticket file format (`Type`, `Status`, `Claimed-by`, `Blocked-by`, Question, Resolution) | "Type:       decision \| research \| prototype \| task" | — | — |
| 81 | decision cards (`sailes-discovery` style) | "**decision** (default) \| HITL \| Decision card in the `sailes-discovery` style: options with ✅/⚠️ + one concrete upside, one concrete cost each + a recommendation — the **user** chooses." | — | — |
| 82 | research subagent (docs, third-party APIs, codebase, web) | "**research** \| AFK \| A fresh research subagent (docs, third-party APIs, codebase, web). Findings land in the ticket's Resolution. The only type allowed >1 per session; fire them in parallel." | — | — |
| 83 | `sailes-design` UI stub; code spike | "**prototype** \| HITL \| A cheap, rough, concrete artifact to react to — UI stub per `sailes-design`, code spike, outline." | — | — |
| 84 | provisioning / service signup / data movement (external accounts + credentials) | "**task** \| HITL/AFK \| Work that must happen before a decision *can* be made — provision access, sign up for a service, move data so its shape is visible. AFK where the agent can drive it; otherwise hand the user a precise checklist. Resolution records what was done + resulting facts (URLs, credentials location, counts)." | — | **Fallback**: hand the user a checklist when the agent cannot drive it |
| 97 | `.ai/backlog.md` | "Deferred-but-valuable items also go to `.ai/backlog.md` (sibling of the spec's Non-Goals) so they aren't lost." | — | — |
| 104-105 | research subagents; `.ai/STATE.md`; git commit | "4. **Fire the research subagents** for every research ticket, in parallel.\n5. Update `.ai/STATE.md` (active map path + next frontier ticket), commit, **STOP.**" | — | — |
| 116-117 | `sailes-bootstrap`; `sailes-pre-implement` | "Hand off to the destination's gate: confirmed Brief → `sailes-bootstrap` (Phase 2); approved spec → `sailes-pre-implement`." | — | — |
| 128 | git-committed files | "**Truth on disk** — map and tickets are committed files, not conversation." | — | — |
| 158 | `.ai/wayfinder/` | "The map exists only in conversation, nothing committed under `.ai/wayfinder/`." (Red Flag) | — | STOP condition |

---

## Coverage note

Every one of the 40 files in the slice was opened and read end-to-end with the Read tool
(no offset/limit truncation on any of them — the largest, `db-compendium.md` at 394 lines and
`monorepo-multi-serwis.md` at 294 lines, were read whole). Files with no external-tool mentions
beyond what is tabulated above are still listed with their (few) entries rather than omitted:
`skills/sailes-migrate/rulebook-template.md` and `skills/sailes-migrate/judge-setup.md` are the
two thinnest in this respect.

No deduplication has been applied: the same tool (e.g. `drizzle-kit`, `railway status --json`,
graphify, the Anthropic migration kit, `PIPEDRIVE_JWT_SECRET`, the Apps SDK `RESIZE` 100–750/800
clamp) is recorded separately at every location it appears, with that location's own wording,
constraint and stated absent-behaviour.

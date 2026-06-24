---
name: sailes-database
description: Use AFTER a spec's data model is approved and BEFORE writing the migration/feature code, to design the PostgreSQL schema and write SAFE, zero-downtime migrations for a B2B web app. Triggers — "zaprojektuj schemat", "napisz migrację", "jaki typ klucza", "uuid czy bigint", "jsonb czy kolumna", "multi-tenant / RLS", "soft delete", "schema design", "migration", "zmiana schematu bazy", entering the schema/migration step between sailes-pre-implement and sailes-implement. Walks each schema fork as a Sailes decision card (you recommend, the user chooses), then writes migrations that pass the safety checklist before any prod run.
---

# Sailes Database — schema design & safe migrations (PostgreSQL)

## Overview

**The dedicated schema-and-migration phase between an approved spec and feature code.** The spec says *what* tables/columns exist (its Data Model section); this skill decides *how* — the right types, keys, tenancy and indexing — and turns that into **safe, reviewable, zero-downtime migrations**.

It separates two kinds of choices, and treats them differently:
- **🔒 Hard rules** (data types, migration safety) — no real choice; breaking them loses data or locks production. Apply them.
- **🔀 Decisions** (key type, jsonb-vs-column, tenancy, soft-delete, tooling) — the user owns them. You present a **decision card** (options + ✅/⚠️ + recommendation), they choose.

**Core principle:** A migration is a contract with production. Get the schema decisions made *consciously* (cards, not silent defaults), then make every migration **expand/contract-safe and proven on paper** before it ever touches a live database. The full researched rationale lives in `db-compendium.md` — this skill is the procedure; the compendium is the why.

## When to Use / When NOT to

**Use when:** a spec's data model is approved and you're about to add/change tables, columns, indexes, constraints, or write any migration — especially anything destructive (rename/drop/NOT NULL/type change) or on a large/production table.

**Do NOT use when:** there is no approved data model yet (write/finish the spec with `sailes-spec`; check readiness with `sailes-pre-implement` first); a trivial additive change to a tiny dev table with no contract impact (just follow the 🔒 rules in `migration-safety-checklist.md` and move on).

## Step 0 — Detect stack & state (cheap)

Before deciding anything, read the ground truth — **trust the filesystem over the prompt**:
- **ORM / migration tool** — `package.json` + lockfile: Drizzle (`drizzle-kit`), Prisma (`prisma`), or SQL-first (`node-pg-migrate`, `sqitch`, Atlas, `golang-migrate`). This picks which scaffold you use (`migration-drizzle.md` / `migration-prisma.md` / `migration-sql-first.md`).
- **Existing schema** — current migrations dir, `schema.ts`/`schema.prisma`, or the live DB. What tables/types/conventions already exist? Match them; don't reinvent.
- **Tenancy + modules** — the project's `AGENTS.md` / brief Decisions Ledger and `sailes-bootstrap/modules-catalog.md`: is this multi-tenant? Are CRM-integration tables (`integration_accounts, external_object_links, webhook_events, sync_runs, idempotency_keys`) in scope?
- **PostgreSQL version** — several safety rules and features are version-gated (constant defaults PG11+, `SET NOT NULL` skip-scan PG12+, `CREATE STATISTICS` on expressions PG14+, native `uuidv7()` PG18+).

If you arrived from `sailes-pre-implement` with a READY verdict, reuse its BC findings — don't re-derive them.

## Workflow

### Phase 1 — Lock the schema decisions (cards, not defaults)

For every **🔀 fork** the spec's data model implies, present a **decision card** in the Sailes format and let the user choose. Never apply a default silently. The forks and their ✅/⚠️ trade-offs are in `decision-cards.md` (each maps to a section of `db-compendium.md`):

| Fork | Card | When it comes up |
|---|---|---|
| Primary key type | `decision-cards.md` §Key | every new table |
| jsonb vs normalized column | §JSONB | any flexible/variable attribute |
| Multi-tenancy model (+ RLS) | §Tenancy | first multi-tenant table |
| enum vs lookup vs CHECK | §Enum | any constrained-value column |
| Soft-delete vs history | §SoftDelete | anything "deletable" but recoverable/auditable |
| Migration tool | §Tooling | once per repo (usually already locked by bootstrap) |

Decision-card format (from `sailes-discovery`):
```
Decyzja: <one line>
Dlaczego to ważne: <cost / reversibility / lock-in / data risk>
Opcje:
  A) … — ✅ <concrete pro>  ⚠️ <concrete cost>
  B) … — ✅ …              ⚠️ …
Rekomendacja: <A/B> — bo <reason grounded in THEIR spec + scale + compliance>
Twój wybór? (możesz wybrać inaczej niż rekomenduję)
```
Quality bar: each option needs one **concrete** upside and one **concrete** cost for *this* project (scale, compliance, team) — not generic adjectives. If you can't state both, ask a fact-finding question first. The recommendation cites their situation, not just the baseline.

### Phase 2 — Apply the 🔒 hard rules to the schema

These are **not** decisions — apply them to every table/column (full table + rationale in `db-compendium.md` §1.1, verified against the PostgreSQL "Don't Do This" wiki):
- `timestamptz` for any moment in time (never `timestamp`).
- `bigint GENERATED ALWAYS AS IDENTITY` for sequential keys (never `serial`/`bigserial`) — unless Phase 1 chose UUIDv7.
- `text` (+ `CHECK` on length only if genuinely needed) — never `char(n)`, don't default to `varchar(n)`.
- `numeric` or integer minor-units for money — never the `money` type.
- Audit columns where the spec/standard calls for them: `created_at timestamptz default now()`, `updated_at`. Multi-tenant tables: `tenant_id` + an **index on it** (RLS predicate hits every query).
- Every FK column indexed.

### Phase 3 — Write the migration (expand/contract-safe)

Use the scaffold for the detected tool (`migration-drizzle.md` / `migration-prisma.md` / `migration-sql-first.md`). For the *shape* of the change, walk `decision-cards.md` §Strategy:
- **Additive + small** → ordinary migration.
- **Additive + large table / index** → online (`CREATE INDEX CONCURRENTLY`, constant default), **outside** the DDL transaction.
- **Destructive** (drop/rename/NOT NULL/type change) → **expand/contract**: add new → dual-write → backfill in batches → switch reads → stop old writes → drop, with a grace period before contract.

Every migration obeys `migration-safety-checklist.md`. The dangerous operations and their safe forms (add index, `SET NOT NULL`, volatile defaults, backfills) are 🔒 — do not improvise them.

### Phase 4 — Verify before commit (behavior, not just DDL)

Per the agentic-first principle *show evidence, don't assert* (`sailes-bootstrap/agentic-first-principles.md` §A):
1. Run the migration on a **local copy of the real schema** (for an existing app, a prod-shaped copy) — paste the output.
2. Prove the result: `\d table` / a `SELECT` / index list showing the schema is as intended.
3. Run the integration tests (Testcontainers or the repo's harness) — they pass against the migrated schema.
4. State the **rollback** explicitly (down migration, or a conscious "forward-only" decision for a destructive step). If you can't name the rollback, it's not done.

### Phase 5 — Review gate & hand-off

- **Adversarial review** in fresh context (`checker` role): does the migration match the spec's data model, follow the 🔒 rules, and avoid scope creep? Does it lock or rewrite a large table?
- **Real-flow proof** (`qa` role): the schema works end-to-end through the feature, not just in DDL.
- Commit the migration as its own focused step (separate from feature code where practical), so it's independently reviewable. Then hand back to `sailes-implement` for the feature code that uses the new schema.
- **🔒 Prod gate:** never run a production migration without explicit approval (`agentic-first-principles.md`; `security-checklist.md`: "migrations reviewed — no unreviewed prod schema changes").

## Where this sits in the pipeline

```
discovery → bootstrap → spec ──(approved)──→ pre-implement (BC + risks)
                                             sailes-database (schema + migrations)  ← here
                                                          ↓
                                             implement (feature code)
```
**DRY boundary:** the spec describes *what* (Data Model section — `sailes-spec`); this skill implements *how* (migration code + safety + rollback). Don't restate the spec; don't move schema rationale out of `db-compendium.md`.

## Quick Reference

| Phase | Output |
|---|---|
| 0 Detect | ORM/tool, existing schema, tenancy, PG version |
| 1 Decide | every 🔀 fork chosen via decision card |
| 2 Hard rules | types/keys/audit/indexes per 🔒 §1.1 |
| 3 Migrate | expand/contract-safe migration in the repo's tool |
| 4 Verify | ran locally + schema proof + tests pass + rollback named |
| 5 Gate | checker + qa review, focused commit, prod needs approval |

## Red Flags — STOP

- You picked a key type / tenancy / jsonb-vs-column **for** the user instead of presenting a decision card.
- You're about to `CREATE INDEX`, `SET NOT NULL`, add a volatile default, or backfill in the altering transaction — on a real table. (Use the safe form.)
- A destructive change (drop/rename/type change) without expand/contract + a migration path.
- You claim the migration works but never ran it and showed the output.
- You can't name the rollback for a destructive step.
- You're running (or about to run) a production migration without explicit approval.
- You're writing schema with no approved spec data model behind it.

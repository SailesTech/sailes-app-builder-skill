# Migration safety checklist (🔒 hard rules)

These are **not** style preferences. Breaking them locks production (ACCESS EXCLUSIVE on a live table) or destroys/corrupts data. Apply them to every migration on a real table. Full rationale + sources → `db-compendium.md` §2 (verified against `ankane/strong_migrations`, GitLab migration style guide, PostgreSQL docs).

## The dangerous operations and their safe forms

| Operation | Why it's dangerous | Safe form |
|---|---|---|
| **Add index** | plain `CREATE INDEX` takes ACCESS EXCLUSIVE → blocks writes | `CREATE INDEX CONCURRENTLY` **outside** a DDL transaction (`disable_ddl_transaction!` / tool equivalent) |
| **`SET NOT NULL`** on existing column | ACCESS EXCLUSIVE + full table scan → blocks read+write | `ADD CONSTRAINT … CHECK (col IS NOT NULL) NOT VALID` → `VALIDATE CONSTRAINT` (SHARE UPDATE EXCL) → `SET NOT NULL` (PG12+ skips the scan) → drop the check |
| **Add column with volatile default** (`gen_random_uuid()`, `clock_timestamp()`, `now()` per-row) | rewrites the whole table → blocks read+write | add column with **no** default → set default separately → backfill in batches. (A **constant** default is safe since PG11 — no rewrite.) |
| **Backfill** | running it in the same transaction that `ALTER`s keeps the table locked the whole time | batches (`in_batches(of: 10000)`) + throttle (`sleep`) + **outside** the DDL transaction |
| **Rename / drop column or table** | breaks running code; drop locks | **expand/contract**: add new → dual-write → backfill → switch reads → stop old writes → drop, with a grace period before the drop |
| **Change column type** | table rewrite + ACCESS EXCLUSIVE (e.g. PG301 lint) | new column + dual-write + backfill + switch + drop (expand/contract) |

## Expand/contract (the backbone for destructive change)
1. **Expand** — add the new shape (column/table), backward-compatible.
2. **Dual-write** — write to both old and new.
3. **Backfill** — move data in throttled batches (rule above).
4. **Read new** — switch reads to the new shape.
5. **Write new only** — stop writing the old.
6. **Contract** — drop the old, after a grace period.

> ⚠️ Expand/contract guarantees **code compatibility**, not lock safety. A large `ALTER`/backfill *inside* the pattern can still lock or rewrite — the table rules above apply **together** with the pattern.

## Locks & retries
- Set a short **`lock_timeout`** + retry so a migration waiting on a lock doesn't pile up behind it and stall the whole query queue (lock-queue blocking).
- `CONCURRENTLY` and backfills run **outside** a transaction → no auto-rollback; handle partial failure explicitly (idempotent re-run).

## Idempotency & reversibility
- Make each migration safe to re-run: `IF NOT EXISTS` / state check before mutating.
- Name the **rollback** for every migration: a tested down-migration, or a conscious "forward-only" decision for a destructive step (documented). If you can't name it, it's not done.

## Pre-merge gate (must all be true before commit)
- [ ] Migration ran on a **prod-shaped copy** of the schema — output pasted, not asserted.
- [ ] Schema proven: `\d table` / `SELECT` / index list shows the intended result.
- [ ] Integration tests pass against the migrated schema.
- [ ] No operation from the table above used in its dangerous form on a real table.
- [ ] Large table → online path used (CONCURRENTLY / batched backfill / no full rewrite).
- [ ] Multi-tenant: every new table has `tenant_id` **and an index on it**; RLS footguns checked (`decision-cards.md` §Tenancy).
- [ ] Rollback named.
- [ ] If CRM-integration scope: required tables match the module manifest (`sync_runs`, `idempotency_keys`, `external_object_links`, …).

## 🔒 Prod gate
**Never run a production migration without explicit approval.** (`sailes-bootstrap/agentic-first-principles.md`; `sailes-bootstrap/security-checklist.md`: "migrations reviewed — no unreviewed prod schema changes".) Review = adversarial `checker` (matches spec, follows these rules, no scope creep) + `qa` real-flow proof.

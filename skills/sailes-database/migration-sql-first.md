# Migration scaffold — SQL-first (node-pg-migrate / sqitch / golang-migrate / Atlas)

How to write the migrations from `SKILL.md` Phase 3 when the repo uses raw-SQL migrations instead of an ORM, keeping the 🔒 rules in `migration-safety-checklist.md`. Here you write the SQL directly — so the safe forms ARE the migration.

## Per-tool: how to escape the transaction (needed for CONCURRENTLY + backfills)
- **node-pg-migrate** — `export const shorthands = undefined;` and in the migration: `pgm.noTransaction()` at the top → no wrapping txn. Then `pgm.sql('CREATE INDEX CONCURRENTLY ...')`.
- **golang-migrate** — by default each migration runs in a txn for Postgres; for CONCURRENTLY put the statement in its own migration and rely on the driver's no-transaction handling (or `x-multi-statement` off + single statement). Verify it doesn't wrap.
- **sqitch** — one change per file; for CONCURRENTLY ensure the deploy script has no explicit `BEGIN`/`COMMIT` around it.
- **Atlas** — declarative: define desired state, `atlas migrate diff` plans it; run `atlas migrate lint` (catches destructive/locking ops, e.g. PG301) as the CI gate. Atlas can emit CONCURRENTLY-aware plans.

## Up migration — types per 🔒 §1.1
```sql
CREATE TABLE deals (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- or uuid DEFAULT uuidv7()
  tenant_id   uuid NOT NULL,
  title       text NOT NULL,                                    -- text, not varchar(n)
  amount      bigint,                                           -- minor units; or numeric(12,2)
  created_at  timestamptz NOT NULL DEFAULT now(),               -- timestamptz, not timestamp
  updated_at  timestamptz
);
-- index outside any txn (separate migration with noTransaction):
CREATE INDEX CONCURRENTLY IF NOT EXISTS deals_tenant_id_idx ON deals (tenant_id);
```

## Dangerous ops — write the safe form directly

**NOT NULL on existing column:**
```sql
ALTER TABLE deals ADD CONSTRAINT deals_title_nn CHECK (title IS NOT NULL) NOT VALID;
ALTER TABLE deals VALIDATE CONSTRAINT deals_title_nn;
ALTER TABLE deals ALTER COLUMN title SET NOT NULL;     -- PG12+ skips scan
ALTER TABLE deals DROP CONSTRAINT deals_title_nn;
```

**Add column with non-constant default:**
```sql
ALTER TABLE deals ADD COLUMN public_id uuid;            -- no default → no rewrite
ALTER TABLE deals ALTER COLUMN public_id SET DEFAULT gen_random_uuid();
```

**Batched backfill (own migration, noTransaction):**
```sql
-- repeat until 0 rows affected; throttle between batches
UPDATE deals SET public_id = gen_random_uuid()
WHERE public_id IS NULL
  AND id IN (SELECT id FROM deals WHERE public_id IS NULL LIMIT 10000);
```
Loop in the runner (or a DO block with a `LIMIT`/exit + `pg_sleep`), outside a transaction.

## Down / rollback
Write the `down`/`revert` for every change, or document a conscious forward-only decision for a destructive step. Test the down on the local copy.

## Set lock_timeout
At the top of risky migrations: `SET lock_timeout = '5s';` (+ retry in the runner) so a blocked migration doesn't stall the query queue.

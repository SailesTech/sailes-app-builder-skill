# Migration scaffold — Drizzle (default stack)

How to write the migrations from `SKILL.md` Phase 3 with `drizzle-kit`, keeping the 🔒 rules in `migration-safety-checklist.md`. Drizzle generates SQL from `schema.ts`, so the safe-form work happens in the **generated/edited SQL**, not in the TS schema alone.

## Workflow
1. Edit `schema.ts` (types per 🔒 §1.1 — `timestamptz`, `bigint identity`/uuid per the §Key card, `text`, audit cols, `tenantId` + index).
2. `drizzle-kit generate` → produces a timestamped `.sql` in the migrations dir + snapshot. **Read the generated SQL** — do not trust it blind for dangerous ops.
3. For any dangerous op, **hand-edit the generated SQL** into its safe form (below).
4. `drizzle-kit migrate` (or the app's runner) against a local prod-shaped DB → paste output (Phase 4).

## Schema conventions (TS)
```ts
import { pgTable, bigint, uuid, text, timestamp, index } from "drizzle-orm/pg-core";

export const deals = pgTable("deals", {
  // §Key card: bigint identity by default…
  id: bigint("id", { mode: "bigint" }).generatedAlwaysAsIdentity().primaryKey(),
  // …or UUIDv7 if the card chose B (PG18 native, else pg_uuidv7):
  // id: uuid("id").primaryKey().default(sql`uuidv7()`),
  tenantId: uuid("tenant_id").notNull(),
  title: text("title").notNull(),            // text, not varchar(n)
  amount: bigint("amount", { mode: "bigint" }), // money as minor units; or numeric(...) 
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (t) => ({
  tenantIdx: index("deals_tenant_id_idx").on(t.tenantId), // RLS predicate hits every query
}));
```
> `withTimezone: true` → `timestamptz`. Without it you get `timestamp` — a 🔒 violation.

## Dangerous ops — edit the generated SQL

**Add index concurrently** (drizzle-kit emits plain `CREATE INDEX`; the runner wraps each file in a transaction). Move it to its own migration and disable the transaction:
```sql
-- drizzle: this file must run OUTSIDE a transaction
CREATE INDEX CONCURRENTLY IF NOT EXISTS deals_tenant_id_idx ON deals (tenant_id);
```
Mark the file so the runner doesn't wrap it (drizzle runs each statement; for CONCURRENTLY keep it a single-statement file and ensure the runner isn't in a txn — see drizzle docs / use a raw `db.execute` migration if needed).

**NOT NULL on an existing column** — replace the generated `SET NOT NULL` with:
```sql
ALTER TABLE deals ADD CONSTRAINT deals_title_nn CHECK (title IS NOT NULL) NOT VALID;
ALTER TABLE deals VALIDATE CONSTRAINT deals_title_nn;
ALTER TABLE deals ALTER COLUMN title SET NOT NULL;   -- PG12+ skips the scan
ALTER TABLE deals DROP CONSTRAINT deals_title_nn;
```

**New column, no volatile default** — add nullable, set default separately, backfill:
```sql
ALTER TABLE deals ADD COLUMN public_id uuid;          -- no default → no rewrite
ALTER TABLE deals ALTER COLUMN public_id SET DEFAULT gen_random_uuid();
-- then backfill in batches (separate, non-transactional migration)
```

## Destructive change → expand/contract across migrations
Drizzle has no built-in dual-write — model it as **several migrations across several deploys**, plus app code writing both columns in between. One migration per expand/contract step; never collapse rename/drop into a single generated migration. Backfill = a dedicated batched migration (loop with `LIMIT`/`sleep`) outside a transaction.

## Drift
`drizzle-kit check` catches snapshot/schema mismatches. For a populated repo, prefer introspection (`drizzle-kit pull`) over guessing the baseline.

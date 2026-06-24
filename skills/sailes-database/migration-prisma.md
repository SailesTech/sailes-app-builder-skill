# Migration scaffold — Prisma

How to write the migrations from `SKILL.md` Phase 3 with Prisma Migrate, keeping the 🔒 rules in `migration-safety-checklist.md`. Prisma generates SQL from `schema.prisma`, but for dangerous ops you **edit the generated migration SQL** (or use `--create-only`).

## Workflow
1. Edit `schema.prisma` (types per 🔒 §1.1 + the §Key/§Tenancy cards).
2. `prisma migrate dev --create-only --name <change>` → generates the SQL **without applying it**, so you can edit it first.
3. Edit the generated `migration.sql` into the safe form for any dangerous op.
4. `prisma migrate dev` (local) → paste output (Phase 4). `prisma migrate deploy` for non-dev — **prod needs approval (🔒)**.

## Schema conventions (`schema.prisma`)
```prisma
model Deal {
  // §Key card: bigint autoincrement by default…
  id        BigInt   @id @default(autoincrement())
  // …or UUIDv7 if the card chose B (Prisma: generate in app, or DB default via raw):
  // id     String   @id @default(dbgenerated("uuidv7()")) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  title     String                                    // text by default
  amount    BigInt?                                   // money as minor units; or Decimal @db.Decimal
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime? @updatedAt     @map("updated_at") @db.Timestamptz(6)

  @@index([tenantId])           // RLS predicate hits every query
  @@map("deals")
}
```
> `@db.Timestamptz(6)` → `timestamptz`. Plain `DateTime` maps to `timestamp` — a 🔒 violation; always annotate.

## Dangerous ops — edit the generated `migration.sql`

Prisma wraps each migration in a transaction and has **no built-in CONCURRENTLY support** — so concurrent index creation must be its **own** migration whose only statement is the index, and you remove transactional wrapping per Prisma's documented pattern (Prisma applies statements without an explicit `BEGIN` for a single-statement file; verify with `migrate diff`):
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS "deals_tenant_id_idx" ON "deals" ("tenant_id");
```

**NOT NULL on existing column** — replace Prisma's generated `SET NOT NULL`:
```sql
ALTER TABLE "deals" ADD CONSTRAINT "deals_title_nn" CHECK ("title" IS NOT NULL) NOT VALID;
ALTER TABLE "deals" VALIDATE CONSTRAINT "deals_title_nn";
ALTER TABLE "deals" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "deals" DROP CONSTRAINT "deals_title_nn";
```

**New column, no volatile default** — add nullable → set default → backfill in a separate batched migration (raw SQL via `--create-only`).

## Destructive change → expand/contract
Prisma will try to generate a single destructive migration (it warns and can drop data). Don't accept it. Split into expand/contract migrations across deploys, with the app dual-writing in between; backfill as a dedicated `--create-only` raw-SQL migration looping with `LIMIT`/`sleep`.

## Drift
`prisma migrate status` / `migrate diff` detect drift between schema, migrations, and DB. Resolve with `migrate resolve` — never `migrate reset` against anything real.

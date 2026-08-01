# Phasing & Steps — M2: custom field definitions

Five phases, ordered so that each one leaves the API bootable and the admin UI functional against
whatever exists at that point. The dependency that fixes the order is the contract: `packages/contracts/src/field.ts`
is written before any handler and before any UI, because both slices import it and a shape that
changes after a consumer exists is a rewrite in two places rather than an edit in one.

**Migration allocation** (from the reserved range `0031`–`0035`, handed out here so two workers in
the same phase cannot both pick "the next number" and collide at merge):

| Migration | Phase | Object |
|---|---|---|
| `0031` | 1 | `field_definition` |
| `0032` | 1 | `field_definition_option` |
| `0033` | 1 | `field_stage_requirement` |
| `0034` | 3 | `field_index_request` |
| `0035` | — | Held. Reserved for a corrective migration *inside* this milestone (a NOT NULL or an index the earlier four got wrong). Unused it stays unused — it is **not** reissued to M3, because the M3 spec will allocate from `0036` and a re-used number breaks the one-number-one-object assumption every later `git log` reads on. |

**Constraint — no phase adds a `CREATE INDEX` on deal field values as a migration.** The reason,
so this is reversible by argument rather than by breaking it: index creation in this milestone is a
*request*, applied asynchronously by the worker against a live database. A migration would apply it
at deploy time, which is the one moment the brief's "request and its status are separate things"
says it must not happen. If a phase turns out to need a statically-known index (e.g. on
`field_index_request.status` for the poller), that is a different object and it takes `0035`.

**Scope note, raised once and then worked around, not silently absorbed.** The brief's "the deal
form renders those fields, validates against them, and stores the values" has no file in the mapped
list — there is no deal-form component, no `deal_field_value` table, and no worker file. Phases 1–5
below therefore deliver everything the deal form *consumes* (Phase 4's single-call catalog is
exactly that surface) and stop at the boundary of the file map. Two readings are defensible: the
form and value storage are M3 and the map is correct, or the map is incomplete. The phases below
assume the first. If it is the second, Phase 4 and Phase 5 are unchanged and a sixth phase is added
— nothing here needs re-cutting.

---

## Phase 1 — Tables and the frozen contract

*Estimate (internal): 6h.*

**Steps**

1. Drizzle schema for `field_definition` (key, label, type as an enum of exactly `text | number | select | date`), `field_definition_option`, `field_stage_requirement`.
2. Migrations `0031`, `0032`, `0033`, in that order.
3. Zod schemas + inferred types in `packages/contracts/src/field.ts`: `fieldDefinitionSchema`, `fieldOptionSchema`, `fieldStageRequirementSchema`, and the create/update input schemas. This is the frozen contract artifact — later phases extend it, no later phase redefines a shape it exports.
4. Contract-level tests for the type enum and the `select ⇒ options non-empty` refinement.

**Allowed files**

- `packages/db/src/schema/field-definition.ts`
- `packages/contracts/src/field.ts`

**Done-when**

```
pnpm --filter @app/db migrate:up                    → exit 0; prints 0031, 0032, 0033 applied
psql "$DATABASE_URL" -c '\d field_definition'       → columns id, key, label, type, created_at, updated_at;
                                                      UNIQUE on (key); type constrained to exactly
                                                      text|number|select|date
psql "$DATABASE_URL" -c '\d field_definition_option' → FK definition_id → field_definition(id) ON DELETE CASCADE
psql "$DATABASE_URL" -c '\d field_stage_requirement' → FK definition_id, column stage, column required (bool)
pnpm --filter @app/contracts typecheck              → 0 errors
pnpm vitest run packages/contracts/src/field.test.ts → 0 failures; asserts fieldDefinitionSchema rejects
                                                      type "boolean" with a Zod issue, accepts all four
                                                      valid types, and rejects a select definition
                                                      carrying an empty options array
pnpm vitest run packages/db/test/field-definition.test.ts → 0 failures; inserts one select definition +
                                                      2 options + 1 stage requirement, reads it back
                                                      through Drizzle, and asserts the row parses against
                                                      fieldDefinitionSchema (contract ↔ table agree)
pnpm --filter @app/api dev                          → boots, exit code 0 on SIGTERM (nothing added yet
                                                      broke the running app)
```

**Coverage — every allowed file, and the clause that forces it**

| File | Forced by |
|---|---|
| `packages/db/src/schema/field-definition.ts` | the three `psql \d` clauses + the Drizzle round-trip test |
| `packages/contracts/src/field.ts` | `@app/contracts typecheck` + `field.test.ts` (enum rejection, select/options refinement) + the round-trip test's parse assertion |

---

## Phase 2 — List, create, edit field definitions

*Estimate (internal): 8h.*

**Steps**

1. `field-definition.ts` service: `list()`, `create(input)`, `update(id, input)`. Owns the two rules — key uniqueness and `select` requires options — so the route stays transport-only.
2. Fastify routes `GET /api/field-definitions`, `POST /api/field-definitions`, `PUT /api/field-definitions/:id`, validating body and params with the Phase 1 schemas at the boundary.
3. Service-level tests (no HTTP) and route-level tests (HTTP, real DB).

**Allowed files**

- `apps/api/src/services/field-definition.ts`
- `apps/api/src/routes/field-definitions.ts`

**Done-when**

```
pnpm vitest run apps/api/test/services/field-definition.test.ts → 0 failures; calls the service directly
                                                      (no Fastify) and asserts: duplicate key throws
                                                      DuplicateFieldKeyError; select with zero options
                                                      throws before any INSERT (assert row count unchanged);
                                                      update of a non-existent id throws NotFoundError
pnpm vitest run apps/api/test/routes/field-definitions.test.ts → 0 failures
curl -s -o /dev/null -w '%{http_code}' localhost:3000/api/field-definitions          → 200
curl -s -X POST localhost:3000/api/field-definitions -d @fixtures/select-field.json  → 201; body parses
                                                      against fieldDefinitionSchema; the created row is
                                                      present in a following GET
curl -s -o /dev/null -w '%{http_code}' -X POST localhost:3000/api/field-definitions \
     -d '{"key":"x","label":"X","type":"boolean"}'   → 400
curl -s -X PUT localhost:3000/api/field-definitions/$ID -d '{"label":"Renamed"}'     → 200; a following
                                                      GET shows label "Renamed"
node -e "require('./apps/api/src/app').build().printRoutes()" → the emitted set contains exactly
                                                      GET /api/field-definitions,
                                                      POST /api/field-definitions,
                                                      PUT /api/field-definitions/:id
                                                      and no other /api/field-* path yet
```

**Coverage — every allowed file, and the clause that forces it**

| File | Forced by |
|---|---|
| `apps/api/src/services/field-definition.ts` | the HTTP-free service test — its three assertions cannot pass from route code |
| `apps/api/src/routes/field-definitions.ts` | the four `curl` clauses + the `printRoutes()` set equality |

---

## Phase 3 — Index requests and their status

*Estimate (internal): 6h.*

**Steps**

1. Migration `0034`: `field_index_request` (definition_id FK, status `pending | applied | failed`, requested_at, applied_at, error).
2. Extend `packages/contracts/src/field.ts` with `fieldIndexRequestSchema` and the status union — additive only, Phase 1's exports keep their shapes.
3. `field-index.ts` service: `request(definitionId)` (idempotent — a second request while one is `pending` returns the existing row rather than inserting a second), `statusFor(definitionId)`.
4. Routes on the existing file: `POST /api/field-definitions/:id/index` → `202`, and the status exposed on `GET /api/field-definitions`.

**Allowed files**

- `packages/db/src/schema/field-definition.ts`
- `packages/contracts/src/field.ts`
- `apps/api/src/services/field-index.ts`
- `apps/api/src/routes/field-definitions.ts`

**Done-when**

The worker that applies indexes is out of this milestone's file map, so the transition to `applied`
is driven by a direct `UPDATE` standing in for it. That keeps the check binary without inventing a
file: what this phase owns is the request and the reporting, not the application.

```
pnpm --filter @app/db migrate:up                    → exit 0; prints 0034 applied
psql "$DATABASE_URL" -c '\d field_index_request'    → FK definition_id → field_definition(id);
                                                      status constrained to pending|applied|failed;
                                                      partial UNIQUE on (definition_id) WHERE status='pending'
pnpm --filter @app/contracts typecheck              → 0 errors
pnpm vitest run packages/contracts/src/field.test.ts → 0 failures; adds: fieldIndexRequestSchema rejects
                                                      status "queued"; Phase 1's fieldDefinitionSchema
                                                      assertions still pass unchanged (additive proof)
pnpm vitest run apps/api/test/services/field-index.test.ts → 0 failures; calls the service directly and
                                                      asserts request() twice on the same definition
                                                      leaves exactly 1 row (SELECT count = 1) and returns
                                                      the same id both times
curl -s -o /dev/null -w '%{http_code}' -X POST localhost:3000/api/field-definitions/$ID/index → 202
curl -s localhost:3000/api/field-definitions | jq '.[] | select(.id=="'$ID'") | .index.status' → "pending"
psql "$DATABASE_URL" -c "UPDATE field_index_request SET status='applied', applied_at=now()
                         WHERE definition_id='$ID'"                                            → UPDATE 1
curl -s localhost:3000/api/field-definitions | jq '.[] | select(.id=="'$ID'") | .index.status' → "applied"
node -e "require('./apps/api/src/app').build().printRoutes()" → the set adds exactly
                                                      POST /api/field-definitions/:id/index
```

**Coverage — every allowed file, and the clause that forces it**

| File | Forced by |
|---|---|
| `packages/db/src/schema/field-definition.ts` | `migrate:up` printing `0034` + the `\d field_index_request` clause (partial unique index is what makes `request()` idempotent at the storage layer) |
| `packages/contracts/src/field.ts` | `typecheck` + the `status "queued"` rejection + the "Phase 1 assertions still pass" clause |
| `apps/api/src/services/field-index.ts` | the HTTP-free idempotency test (`count = 1`, same id twice) |
| `apps/api/src/routes/field-definitions.ts` | the `202` clause, the two `jq` status reads, and the `printRoutes()` delta |

---

## Phase 4 — One-call catalog for the deal form

*Estimate (internal): 5h.*

**Steps**

1. Extend `packages/contracts/src/field.ts` with `fieldCatalogResponseSchema` — definitions, their options, and their per-stage requiredness, in one nested shape.
2. `GET /api/field-catalog?entity=deal` on a new route file, assembling the catalog in a bounded number of queries (not one per definition).
3. Tests asserting one round trip and a query-count ceiling.

**Allowed files**

- `packages/contracts/src/field.ts`
- `apps/api/src/routes/field-catalog.ts`

**Done-when**

```
pnpm --filter @app/contracts typecheck              → 0 errors
pnpm vitest run apps/api/test/routes/field-catalog.test.ts → 0 failures
curl -s -o /dev/null -w '%{http_code}' 'localhost:3000/api/field-catalog?entity=deal' → 200
curl -s 'localhost:3000/api/field-catalog?entity=deal' > /tmp/catalog.json;
  node -e "require('@app/contracts').fieldCatalogResponseSchema.parse(
           require('/tmp/catalog.json'))"           → exits 0 (response is contract-valid)
node -e "…"  (seeded: 3 definitions, one select with 2 options, one with a stage requirement)
  jq '[.definitions[].options[]] | length' /tmp/catalog.json          → 2
  jq '[.definitions[].requiredByStage | keys[]] | length' /tmp/catalog.json → ≥ 1
                                                      (options and requiredness arrive in the SAME
                                                      response — no second call is available to fetch them)
pnpm vitest run apps/api/test/routes/field-catalog.test.ts -t 'query count' → 0 failures; the test counts
                                                      statements through the Drizzle logger and asserts
                                                      ≤ 3 for 3 definitions, and still ≤ 3 for 30
                                                      (no N+1)
curl -s -o /dev/null -w '%{http_code}' 'localhost:3000/api/field-catalog?entity=nope' → 400
node -e "require('./apps/api/src/app').build().printRoutes()" → the set adds exactly
                                                      GET /api/field-catalog
```

**Coverage — every allowed file, and the clause that forces it**

| File | Forced by |
|---|---|
| `packages/contracts/src/field.ts` | `typecheck` + the `fieldCatalogResponseSchema.parse` clause exiting 0 |
| `apps/api/src/routes/field-catalog.ts` | the `200`, the two `jq` shape clauses, the query-count ceiling, the `400` on an unknown entity, and the `printRoutes()` delta |

---

## Phase 5 — Admin list + edit UI

*Estimate (internal): 8h.*

**Steps**

1. `DefinitionList.tsx`: table of definitions (key, label, type, index status), create form, edit form — all typed off `packages/contracts` (imports only; this phase does not edit the contract).
2. Index-request action per row, with the status badge reflecting `pending` / `applied` / `failed`.
3. Playwright coverage of the three admin flows the brief names.

**Allowed files**

- `apps/web/src/features/fields/DefinitionList.tsx`

**Done-when**

```
pnpm --filter @app/web typecheck                    → 0 errors
pnpm --filter @app/web build                        → exit 0
pnpm playwright test e2e/fields/definition-list.spec.ts → 0 failures, 4 passed:
  · "lists definitions"      — 3 seeded definitions visible by key, types rendered
  · "creates a definition"   — fills the form, submits, the new key appears in the list
                               without a reload, and GET /api/field-definitions confirms it server-side
  · "edits a definition"     — changes a label, the row shows the new label, server confirms
  · "requests an index"      — clicks the action, badge reads "Pending"; after the fixture flips
                               field_index_request.status to 'applied' and the list refetches,
                               badge reads "Applied"
pnpm playwright test e2e/fields/definition-list.spec.ts --update-snapshots=none →
                                                      screenshot definition-list.png matches the baseline
                                                      in the design artifact within the configured
                                                      pixel threshold
```

**Coverage — every allowed file, and the clause that forces it**

| File | Forced by |
|---|---|
| `apps/web/src/features/fields/DefinitionList.tsx` | `@app/web typecheck` + `build` + all four Playwright cases + the screenshot baseline |

---

## Cross-phase invariants (checked at every phase, not only at the end)

```
pnpm typecheck                                      → 0 errors, whole workspace
pnpm test                                           → 0 failures
pnpm --filter @app/api dev                          → boots and serves GET /health → 200
```

A phase is not done if any of the three regresses, regardless of its own `Done-when` — that is what
"each phase leaves the app working" means operationally.

# Phasing & Steps — M2: custom field definitions

## How to read this section

Five phases, each shippable on its own. Every phase names the **exact** files it may touch; a file
not listed for a phase is off-limits in that phase. The reason is not tidiness: phases 2–5 are
intended to run as separate units of work against a contract frozen in phase 1, and an unlisted
file edited "while I was in there" is how a frozen contract silently unfreezes.

**Two standing allowances**, so the file lists above do not read as prohibitions they are not:

- **Colocated tests.** Each phase may add/edit test files colocated with its own allowed files
  (`*.test.ts` next to the source, `apps/web/.../*.test.tsx`, `e2e/fields.spec.ts` for phase 5).
  They are not in the brief's file map because the map lists product code; a phase whose `Done-when`
  runs a test must be allowed to write it.
- **Migration files** under `packages/db/migrations/`, only in the phase holding that number below.

**Migration numbers, handed out up front** (range `0031`–`0035` reserved for M2):

| Number | Table | Phase |
|---|---|---|
| `0031` | `field_definition` | 1 |
| `0032` | `field_definition_option` | 1 |
| `0033` | `field_definition_stage_requirement` | 1 |
| `0034` | `field_index_request` | 3 |
| `0035` | **reserved, unused by this section** | — |

`0035` is held, not spent. Reason, so it is reversible without guessing: the brief says values are
stored, but the mapped file set contains no deal-form write path — see **Scope gap** at the end.
If that path is brought into M2, `deal_field_value` takes `0035`; nobody else may claim it in the
meantime, because a second worker picking "the next free number" is how the collision surfaces at
merge instead of here.

---

## Phase 1 — Schema and the frozen contract

**Goal.** The tables and the shared Zod schemas exist, and both slices import the same types. No
route, no UI. This is the phase every later phase depends on, which is why it is alone.

**Allowed files**
```
packages/db/src/schema/field-definition.ts
packages/contracts/src/field.ts
packages/db/migrations/0031_*.sql, 0032_*.sql, 0033_*.sql
```

**Steps**
1. `field_definition` (`0031`): `id` uuid PK, `entity` text (`'deal'` for M2), `key` text, `label`
   text, `type` text constrained to `text|number|select|date`, `created_at`, `updated_at`. Unique on
   `(entity, key)`.
2. `field_definition_option` (`0032`): `id`, `field_definition_id` FK, `value`, `label`,
   `sort_order`. Rows are legal only for `type = 'select'` — enforced in the service (phase 2), not
   by a check constraint, because the constraint would span two tables.
3. `field_definition_stage_requirement` (`0033`): `id`, `field_definition_id` FK, `stage` text,
   `required` boolean. Unique on `(field_definition_id, stage)`.
4. In `packages/contracts/src/field.ts` define and export: `fieldTypeSchema`,
   `fieldOptionSchema`, `fieldStageRequirementSchema`, `fieldDefinitionSchema`,
   `createFieldDefinitionSchema`, `updateFieldDefinitionSchema`, and the discriminated refinement
   that makes `options` required when `type === 'select'` and forbidden otherwise. Types via
   `z.infer` only.

**Contract artifact:** `packages/contracts/src/field.ts` — the frozen shape for phases 2–5. Changing
it after phase 1 closes is a spec change, not an implementation detail.

**Done-when** (all four, in order, on a clean test database):
```
pnpm --filter @app/db migrate:test
  → exit 0; final line reports "0031, 0032, 0033 applied"
psql "$TEST_DATABASE_URL" -Atc "select table_name from information_schema.tables
     where table_name in ('field_definition','field_definition_option',
     'field_definition_stage_requirement') order by 1"
  → exactly 3 lines
pnpm --filter @app/contracts typecheck
  → exit 0
pnpm vitest run packages/contracts/src/field.test.ts
  → 0 failures, ≥6 assertions incl. select-without-options rejected and text-with-options rejected
```

**Leaves the app working:** additive DDL only; no existing route reads these tables yet.
**Estimate (internal):** 4h.

---

## Phase 2 — Definition service + admin CRUD API

**Goal.** An admin can list, create and edit field definitions over HTTP. Covers brief bullets 1
and 2.

**Allowed files**
```
apps/api/src/services/field-definition.ts
apps/api/src/routes/field-definitions.ts
```
Not `packages/contracts/src/field.ts` — it is frozen as of phase 1. If this phase finds the contract
wrong, stop and amend the spec; do not edit it in place.

**Steps**
1. Service: `listDefinitions(entity)`, `createDefinition(input)`, `updateDefinition(id, input)`.
   Options and stage requirements are written in the same transaction as the parent row, so a
   half-written `select` field with no options cannot be observed.
2. Service enforces the two cross-table rules: options only for `type = 'select'`; `key` immutable
   after creation (rename would orphan stored values).
3. Routes: `GET /api/field-definitions?entity=deal`, `POST /api/field-definitions`,
   `PATCH /api/field-definitions/:id`. Zod-parse body and query against the phase-1 schemas at the
   boundary; 400 on parse failure, 409 on duplicate `(entity, key)`.

**Integration coverage:** all three paths above get a test in this phase.

**Done-when**
```
pnpm vitest run apps/api/src/services/field-definition.test.ts \
                apps/api/src/routes/field-definitions.test.ts
  → 0 failures
curl -s -o /dev/null -w '%{http_code}' -X POST localhost:3000/api/field-definitions \
     -H 'content-type: application/json' \
     -d '{"entity":"deal","key":"budget","label":"Budget","type":"number"}'
  → 201
  (repeat the identical call) → 409
curl -s localhost:3000/api/field-definitions?entity=deal | jq -e '.[] | select(.key=="budget")'
  → exit 0
curl -s -o /dev/null -w '%{http_code}' -X POST localhost:3000/api/field-definitions \
     -H 'content-type: application/json' \
     -d '{"entity":"deal","key":"tier","label":"Tier","type":"select"}'
  → 400   (select with no options)
```

**Leaves the app working:** new routes only; nothing existing changes behavior.
**Estimate (internal):** 6h.

---

## Phase 3 — Index request and its status

**Goal.** An admin can request an index on a field's values and read back whether it has been
applied. Covers brief bullet 3. Request and status are separate records because the worker builds
the index asynchronously — the request is accepted immediately, the status changes later.

**Allowed files**
```
apps/api/src/services/field-index.ts
apps/api/src/routes/field-definitions.ts      (add the two index sub-routes only)
packages/db/migrations/0034_*.sql
```
`field-definitions.ts` is shared with phase 2 on purpose: the index routes hang off the definition
resource. If phases 2 and 3 run concurrently, phase 3 waits for phase 2's merge — the file is the
serialization point.

**Steps**
1. `field_index_request` (`0034`): `id`, `field_definition_id` FK, `status` text constrained to
   `pending|applied|failed`, `requested_at`, `applied_at` nullable, `error` nullable.
2. Service: `requestIndex(fieldDefinitionId)` inserts `pending` and is idempotent — a second request
   while one is `pending` returns the existing row rather than queueing a duplicate build.
   `getIndexStatus(fieldDefinitionId)` returns the latest row or `null`.
3. Routes: `POST /api/field-definitions/:id/index` → 202 with the request row;
   `GET /api/field-definitions/:id/index` → 200 with `{status, requestedAt, appliedAt, error}` or
   404 when never requested.
4. The worker that performs the build is **not** in this phase (no worker file is mapped). This
   phase ships the request/status surface and a service-level transition function the worker will
   call; the transition is tested directly.

**Integration coverage:** both sub-routes get a test in this phase.

**Done-when**
```
pnpm --filter @app/db migrate:test  → exit 0; "0034 applied"
pnpm vitest run apps/api/src/services/field-index.test.ts
  → 0 failures, incl. a case asserting two consecutive requestIndex() calls
    produce exactly 1 row in field_index_request
curl -s -o /dev/null -w '%{http_code}' -X POST localhost:3000/api/field-definitions/$ID/index
  → 202
curl -s localhost:3000/api/field-definitions/$ID/index | jq -e '.status=="pending"'
  → exit 0
```

**Leaves the app working:** additive.
**Estimate (internal):** 5h.

---

## Phase 4 — Catalog: the one-call render surface

**Goal.** The frontend fetches everything needed to draw and validate the deal form in a single
call. Covers brief bullet 4.

**Allowed files**
```
apps/api/src/routes/field-catalog.ts
apps/api/src/services/field-definition.ts     (add getCatalog() only — no change to existing methods)
```

**Steps**
1. `getCatalog(entity)` returns definitions with their options and their per-stage requirements
   nested, in one query (join or a single round trip — not N+1 per definition).
2. Route `GET /api/field-catalog?entity=deal&stage=<stage>`: returns the full definition set; when
   `stage` is supplied each definition carries a resolved `required` boolean for that stage.
3. Response validated against the phase-1 contract before it leaves the handler, so a schema drift
   fails here rather than in the browser.

**Integration coverage:** `GET /api/field-catalog` gets a test in this phase.

**Done-when**
```
pnpm vitest run apps/api/src/routes/field-catalog.test.ts
  → 0 failures
curl -s 'localhost:3000/api/field-catalog?entity=deal&stage=qualified' \
  | jq -e 'length>0 and all(.[]; has("key") and has("type") and has("required"))
           and (map(select(.type=="select")) | all(has("options")))'
  → exit 0
curl -s 'localhost:3000/api/field-catalog?entity=deal' \
  | jq -e 'all(.[]; has("stageRequirements"))'
  → exit 0
```
Plus the N+1 guard, which is the point of "one call":
```
pnpm vitest run apps/api/src/routes/field-catalog.test.ts -t 'single query'
  → 0 failures  (test asserts query count == 1 for a fixture of 10 definitions)
```

**Leaves the app working:** new read-only route.
**Estimate (internal):** 4h.

---

## Phase 5 — Admin UI: definition list and edit

**Goal.** The admin surface for phases 2 and 3, against the frozen contract.

**Allowed files**
```
apps/web/src/features/fields/DefinitionList.tsx
```
No API or contract file. If the UI needs a shape the API does not return, that is a phase-2/4 gap
and goes back to those phases — not a fetch-and-reshape in the component.

**Steps**
1. List view: all definitions for `deal` — key, label, type, and the index status badge
   (`none` / `pending` / `applied` / `failed`) read from the phase-3 endpoint.
2. Create and edit forms driven by the phase-1 Zod schemas (`createFieldDefinitionSchema` /
   `updateFieldDefinitionSchema`) — the options editor appears only for `type = 'select'`, and
   `key` is disabled in edit mode, mirroring the phase-2 immutability rule.
3. "Request index" action → `POST .../index`, optimistic badge to `pending`, reconciled on refetch.
4. Server error surfaces are rendered, not swallowed: 409 on duplicate key shows on the `key` field.

**Integration coverage:** the admin list path and the create/edit path each get a test in this phase.

**Done-when**
```
pnpm vitest run apps/web/src/features/fields/DefinitionList.test.tsx
  → 0 failures
pnpm playwright test e2e/fields.spec.ts
  → 3 passed, 0 failed
    (list renders ≥1 definition · create a select field with 2 options and it appears in the list ·
     request index and the badge reads "pending")
pnpm --filter @app/web typecheck
  → exit 0
```
Visual check, binary: screenshot of `/admin/fields` at 1440×900 matches the design artifact for the
fields screen (`docs/design/fields.png`) on layout, spacing scale and badge colors — reviewed
against that artifact, not against "looks fine".

**Leaves the app working:** new route in the admin shell; no existing screen changes.
**Estimate (internal):** 7h.

---

## Phase order and what can run in parallel

```
Phase 1 ──┬── Phase 2 ──┬── Phase 3   (shares routes/field-definitions.ts with 2 → serialize)
          │             │
          └── Phase 4 ──┴── Phase 5   (5 needs 2, 3 and 4 landed)
```
Phase 4 may start as soon as phase 1 is merged, provided it touches only `getCatalog()` in
`field-definition.ts`; if phases 2 and 4 run concurrently the same-file overlap makes phase 2 the
owner and phase 4 rebases.

## Scope gap — raise before implementation starts

The brief states the deal form "renders those fields, validates against them, and **stores the
values**", but the mapped file set contains no deal-form component and no value-write route or
service. Phases 1–5 deliver definitions, index requests and the catalog — everything needed to
*render and validate* — and stop short of persistence. Two ways to close it, and it is not mine to
pick:

- **(A) Add the write path to M2** — one more table (`deal_field_value`, migration `0035`, already
  held), a `POST /api/deals/:id/fields` route and the deal-form component. Buys a complete
  milestone; costs roughly a sixth phase and files outside the agreed map.
- **(B) Keep M2 as mapped, defer persistence to M3** — buys a clean, shippable read/admin milestone
  that matches the file list exactly; costs a product state where fields are definable but not yet
  fillable, which needs saying out loud to whoever signed off.

Recommendation: **(B)**, because the file map is the part of the brief that was actually mapped by
the team, and widening it silently is the more expensive mistake. Either way, `0035` stays reserved
until this is answered.

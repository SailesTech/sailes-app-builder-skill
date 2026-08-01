# Phasing & Steps — M2: custom field definitions

Eight phases. Each one leaves the app booting, migrated and green — no phase depends on a later
phase to compile. Estimates are internal (hours), closed out against actuals at completion, never
client-visible.

**How to read the two lists per phase.** Every phase carries a numbered `Done-when` (D<phase>.<n>) —
exact command, exact expected output — and an **Allowed files** table in which every path names the
`Done-when` clause that forces it to be edited. A path with no clause is surplus and gets deleted
from the list; a clause with no path is a hole and gets a path. That reconciliation is done here,
while writing, not discovered at review. A file appearing in more than one phase's list is normal
(the contracts module and the definition schema both grow across phases); a file appearing with no
clause is not.

## Migration numbers

`0031`–`0040` are reserved for this milestone. Assigned up front so two workers in the same phase
cannot both pick "the next number" and collide at merge:

| Number | Phase | Object |
|---|---|---|
| `0031` | P1 | `field_definition` |
| `0032` | P1 | `field_definition_option` |
| `0033` | P2 | `field_definition_audit` |
| `0034` | P4 | `deal_field_value` |
| `0035` | P5 | `field_stage_requirement` |
| `0036` | P8 | `field_index_request` |
| `0037`–`0040` | — | unassigned headroom for in-phase corrections |

**The per-field indexes P8 builds are not migrations, because there is no fixed set of them to
write down** — one is created per field definition at runtime, named from the definition's id, by
`CREATE INDEX CONCURRENTLY` in the worker. A migration file would have to enumerate rows that do not
exist at deploy time. This is the reason, so that an implementer who finds a case the rule does not
fit can raise it instead of working around it.

## Flagged before implementation starts

**The stage-move handler is not in the milestone's file list.** The brief requires that a per-stage
requirement is *enforced when a deal is moved into that stage*, but none of the fifteen listed files
is the deal stage-transition route. Two readings, and they produce different phase-5 file lists:

- **(A) — recommended.** `stage-requirement.ts` exposes `validateDealForStage()` and the existing
  stage-move handler (e.g. `apps/api/src/routes/deals.ts`) calls it. **Buys:** enforcement on the
  real path, which is what the brief asks for. **Costs:** the milestone's file list is incomplete by
  one file, and P5 needs that file added to its allowance before it can be closed.
- **(B).** Enforcement lives only in `deal-field-values.ts` — values are rejected, stage moves are
  not. **Buys:** stays inside the fifteen listed files. **Costs:** does not satisfy the brief; a deal
  can still reach the stage with the field blank.

P5 below is written for **(A)**, with the extra path marked `— pending allowance`. If the answer is
(B), D5.3 changes and the marked row disappears.

---

## Phase 1 — Definition store + frozen contract (no HTTP)

*Est. 6h.* Schema, contract artifact and service only. The app boots and behaves identically; the
new tables are simply unread.

**Steps**

1. `0031` `field_definition` — `id` uuid PK, `entity` text, `key` text, `label` text, `type` enum,
   `display_order` int, `archived_at` timestamptz null, `created_at`, `updated_at`. Unique
   `(entity, key)`.
2. `0032` `field_definition_option` — `id` uuid PK, `field_definition_id` FK, `value`, `label`,
   `sort_order` int, `archived_at`. **A child table with `archived_at`, not a jsonb array, because
   the brief requires an option to be removable while values stored against it stay readable** — a
   removed element of an array leaves the stored value pointing at nothing.
3. `packages/contracts/src/field.ts` — the frozen contract artifact both slices import:
   `FieldTypeSchema`, `FieldOptionSchema`, `FieldDefinitionSchema`, `CreateFieldDefinitionSchema`,
   `UpdateFieldDefinitionSchema`. Types via `z.infer`; no `any`.
4. `field-definition.ts` service — `create`, `update`, `archive`, `list({entity, type, includeArchived})`,
   `setOptions` (reorder + archive-on-removal), `getById`.

**Done-when**

- **D1.1** `pnpm --filter @app/db migrate:up && pnpm --filter @app/db migrate:status`
  → `0031` and `0032` listed as applied, `0 pending`.
- **D1.2** `pnpm --filter @app/contracts typecheck` → `0 errors`, **and**
  `pnpm vitest run packages/contracts/src/field.test.ts` → `0 failures`, covering: a valid definition
  parses; an unknown `type` is rejected; two options with the same `value` are rejected.
- **D1.3** `pnpm vitest run apps/api/src/services/field-definition.test.ts` → `0 failures`, covering:
  `list({entity:'deal'})` returns only deal fields; `list({type:'select'})` filters by type;
  `archive()` sets `archived_at` and `getById()` still returns the row; `setOptions()` with an option
  omitted marks that option `archived_at` instead of deleting it, and re-reading the option by id
  still returns its label.

**Allowed files**

| Path | Forced by |
|---|---|
| `packages/db/src/schema/field-definition.ts` | D1.1 (`0031`, `0032` are generated from this schema module) |
| `packages/contracts/src/field.ts` | D1.2 |
| `apps/api/src/services/field-definition.ts` | D1.3 |

---

## Phase 2 — Definition CRUD API + audit attribution

*Est. 7h.* First HTTP surface. Admin-only.

```yaml
- { method: GET,   path: /api/field-definitions,             phase: 2 }
- { method: POST,  path: /api/field-definitions,             phase: 2 }
- { method: PATCH, path: /api/field-definitions/:id,         phase: 2 }
- { method: POST,  path: /api/field-definitions/:id/archive, phase: 2 }
```

**Steps**

1. The four routes above; query params `entity`, `type`, `includeArchived` validated by a Zod schema
   from the contract module; every response body is built from a contract schema.
2. `0033` `field_definition_audit` — `id`, `field_definition_id`, `actor_id`, `action`, `diff` jsonb,
   `created_at`. Lives in the `field-definition.ts` schema module (the milestone's file list carries
   only two schema modules; the audit table belongs to the definition aggregate).
3. `field-audit.ts` service — one `record(actorId, definitionId, action, diff)` call, invoked from
   every mutating service path, not from the routes, so later phases inherit it.
4. Permission gate: `admin` for all four; anonymous rejected.

**Done-when**

- **D2.1** `pnpm --filter @app/api print-routes | grep field-definitions` → exactly the four paths in
  the yaml block above, no more and no fewer (set equality against the block, not "the file is
  imported").
- **D2.2** `pnpm vitest run apps/api/src/routes/field-definitions.test.ts` → `0 failures`, covering:
  `POST` → `201` and the body parses `FieldDefinitionSchema`; `GET ?entity=deal&type=select` returns
  only matching rows; `PATCH` → `200`; `POST /:id/archive` → `200` and the row is absent from
  `GET ?includeArchived=false`, present in `GET ?includeArchived=true`; non-admin → `403`;
  anonymous → `401`.
- **D2.3** `pnpm vitest run apps/api/src/services/field-audit.test.ts` → `0 failures`, **and** the
  integration case: after create → edit → archive as user `U`,
  `select actor_id, action from field_definition_audit order by created_at` returns exactly
  `(U, created), (U, updated), (U, archived)`.
- **D2.4** `pnpm --filter @app/db migrate:status` → `0033` applied, `0 pending`.

**Allowed files**

| Path | Forced by |
|---|---|
| `apps/api/src/routes/field-definitions.ts` | D2.1, D2.2 |
| `apps/api/src/services/field-audit.ts` | D2.3 |
| `packages/db/src/schema/field-definition.ts` | D2.4 (`field_definition_audit`) |
| `packages/contracts/src/field.ts` | D2.2 (list query + response envelopes the route test parses against) |
| `apps/api/src/services/field-definition.ts` | D2.3 (mutating paths call `record()`) |

---

## Phase 3 — Admin UI: list, filter, create/edit/archive

*Est. 8h.* Consumes only phase-2 routes.

**Steps**

1. `DefinitionList.tsx` — table of definitions, filters for entity and type, an archived toggle, and
   an archive action per row.
2. `DefinitionForm.tsx` — create and edit, with a type-conditional option editor: add, rename,
   reorder, remove. Removing an option shows an explicit "values already stored against this option
   are kept" confirmation before save.

**Done-when**

- **D3.1** `pnpm playwright test e2e/field-definitions.spec.ts` → `0 failures`, covering: admin opens
  `/admin/fields`; filtering `entity=deal` + `type=select` narrows the table to only those rows;
  creating a definition through the form makes it appear in the table without a page reload; editing
  the label persists across reload; archiving removes it from the default view and the archived
  toggle brings it back.
- **D3.2** Same run, option cases → `0 failures`: reordering options and saving, then reopening the
  form, shows the new order; removing an option surfaces the retention confirmation and, after save,
  `GET /api/field-definitions/:id?includeArchived=true` still returns the removed option with
  `archived: true`.
- **D3.3** `pnpm playwright test e2e/field-definitions.visual.spec.ts` → `0 snapshot diffs` for
  `/admin/fields` (list) and the definition form at 1440px and 390px, against the design artifact's
  committed baseline.

**Allowed files**

| Path | Forced by |
|---|---|
| `apps/web/src/features/fields/DefinitionList.tsx` | D3.1, D3.3 |
| `apps/web/src/features/fields/DefinitionForm.tsx` | D3.2, D3.3 |

---

## Phase 4 — Deal field values: persist and read back

*Est. 6h.*

```yaml
- { method: GET, path: /api/deals/:dealId/field-values, phase: 4 }
- { method: PUT, path: /api/deals/:dealId/field-values, phase: 4 }
```

**Steps**

1. `0034` `deal_field_value` — `id`, `deal_id` FK, `field_definition_id` FK, `option_id` FK null,
   `value` jsonb, `created_at`, `updated_at`. Unique `(deal_id, field_definition_id)`.
2. `deal-field-value.ts` service — `readForDeal(dealId)`, `upsertForDeal(dealId, values)`; value
   shape validated against the definition's `type` before write.
3. The two routes above; `PUT` is a bulk upsert so a form save is one round-trip and one transaction.

**Done-when**

- **D4.1** `pnpm --filter @app/db migrate:status` → `0034` applied, `0 pending`.
- **D4.2** `pnpm vitest run apps/api/src/services/deal-field-value.test.ts` → `0 failures`, covering:
  a value whose type contradicts the definition is rejected before write; a `select` value pointing
  at an **archived** option is still returned by `readForDeal()` with its label; calling
  `upsertForDeal()` twice with the same payload leaves exactly one row per definition.
- **D4.3** `pnpm vitest run apps/api/src/routes/deal-field-values.test.ts` → `0 failures`, **and**
  `curl -s -o /dev/null -w '%{http_code}' -X PUT /api/deals/$DEAL/field-values -d @fixture.json`
  → `200`, followed by `curl -s /api/deals/$DEAL/field-values` → `200` with a body that parses
  `DealFieldValuesSchema` and is set-equal to `fixture.json`.

**Allowed files**

| Path | Forced by |
|---|---|
| `packages/db/src/schema/deal-field-value.ts` | D4.1 |
| `apps/api/src/services/deal-field-value.ts` | D4.2 |
| `apps/api/src/routes/deal-field-values.ts` | D4.3 |
| `packages/contracts/src/field.ts` | D4.3 (`DealFieldValueSchema`, `DealFieldValuesSchema`) |

---

## Phase 5 — Per-stage requiredness + enforcement

*Est. 7h.* Written for reading **(A)** in the flagged block above.

```yaml
- { method: PUT, path: /api/field-definitions/:id/stage-requirements, phase: 5 }
```

**Steps**

1. `0035` `field_stage_requirement` — `field_definition_id` FK, `stage_id`, `required` bool, PK on
   the pair. Declared in the `field-definition.ts` schema module.
2. `stage-requirement.ts` service — `requirementsFor(entity, stageId)` and
   `validateDealForStage(dealId, stageId)` → array of missing field keys.
3. `PUT /api/field-definitions/:id/stage-requirements` — admin-only, writes the pairs and records an
   audit row through `field-audit.ts`.
4. Call `validateDealForStage()` from the existing stage-move handler; on a non-empty result reject
   with `422` and the missing keys in the body.

**Done-when**

- **D5.1** `pnpm --filter @app/db migrate:status` → `0035` applied, `0 pending`.
- **D5.2** `pnpm vitest run apps/api/src/services/stage-requirement.test.ts` → `0 failures`, covering:
  a deal with a blank field required at stage `S` → `validateDealForStage` returns `['field_key']`;
  the same field not required at `S` → returns `[]`; an **archived** definition is never reported as
  missing.
- **D5.3** `curl -s -w '%{http_code}' -X POST /api/deals/$DEAL/stage -d '{"stageId":"S"}'` → `422`
  with a body listing the missing keys; after `PUT /api/deals/$DEAL/field-values` supplies them, the
  same call → `200`.
- **D5.4** `pnpm vitest run apps/api/src/routes/field-definitions.test.ts` → `0 failures` including
  the new case: `PUT /:id/stage-requirements` → `200`, `GET /api/field-definitions/:id` reflects the
  pairs, and a `stage_requirements_updated` row exists in `field_definition_audit` for the actor.

**Allowed files**

| Path | Forced by |
|---|---|
| `packages/db/src/schema/field-definition.ts` | D5.1 (`field_stage_requirement`) |
| `apps/api/src/services/stage-requirement.ts` | D5.2 |
| `apps/api/src/routes/field-definitions.ts` | D5.4 |
| `packages/contracts/src/field.ts` | D5.4 (`StageRequirementsSchema`), D5.3 (the `422` body shape) |
| *the existing stage-move handler* — **pending allowance** | D5.3 — not among the fifteen listed files; see the flagged block |

---

## Phase 6 — Field catalog: the whole form in one call

*Est. 4h.*

```yaml
- { method: GET, path: /api/field-catalog, phase: 6 }
```

**Steps**

1. `GET /api/field-catalog?entity=deal&stageId=…` returns, in one payload: active definitions in
   `display_order`, each definition's non-archived options in `sort_order`, and a `required` flag
   resolved for the requested stage. Read-only; composes the phase-1/phase-5 services.
2. `FieldCatalogSchema` in the contract module — the artifact the deal form renders from.

**Done-when**

- **D6.1** `pnpm vitest run apps/api/src/routes/field-catalog.test.ts` → `0 failures`: against a
  fixture of 3 active definitions (one `select` with 4 options, one required at stage `S`) plus 1
  archived definition, a single `GET /api/field-catalog?entity=deal&stageId=S` → `200` whose body
  parses `FieldCatalogSchema`, contains exactly the 3 active definitions in `display_order`, the 4
  options in `sort_order`, and `required: true` on exactly the one field.
- **D6.2** Same run, N+1 guard: the request issues `<= 2` SQL statements (asserted via the query
  counter). **The deal form blocks on this call, so a per-definition query would put page latency on
  the definition count** — that is the reason, and it is reversible by raising it, not by ignoring it.

**Allowed files**

| Path | Forced by |
|---|---|
| `apps/api/src/routes/field-catalog.ts` | D6.1, D6.2 |
| `packages/contracts/src/field.ts` | D6.1 (`FieldCatalogSchema`) |

---

## Phase 7 — Deal form renders from the catalog

*Est. 6h.*

**Steps**

1. `DealFieldSection.tsx` — fetches `/api/field-catalog` for the deal's entity and current stage,
   renders one input per definition in `display_order`, marks stage-required fields, saves through
   `PUT /api/deals/:dealId/field-values`.
2. Surfaces the phase-5 `422` inline against the offending fields when a stage move is blocked.

**Done-when**

- **D7.1** `pnpm playwright test e2e/deal-fields.spec.ts` → `0 failures`, covering: opening a deal
  renders the section from the catalog in `display_order`; a `select` offers exactly its non-archived
  options; filling and saving, then reloading, shows the stored values; a field required at the
  target stage is visibly marked; attempting the stage move with it blank shows the inline error and
  the move does not happen.
- **D7.2** `pnpm playwright test e2e/deal-fields.visual.spec.ts` → `0 snapshot diffs` for the deal
  detail screen at 1440px and 390px against the design artifact's baseline.

**Allowed files**

| Path | Forced by |
|---|---|
| `apps/web/src/features/deals/DealFieldSection.tsx` | D7.1, D7.2 |

---

## Phase 8 — Async index request, worker build, visible status

*Est. 8h.* Last, because it indexes `deal_field_value`, which does not exist before P4.

```yaml
- { method: POST, path: /api/field-definitions/:id/index, phase: 8 }
```

**Steps**

1. `0036` `field_index_request` — `id`, `field_definition_id` FK, `requested_by`, `status`
   (`pending|building|ready|failed`), `error` text null, `requested_at`, `completed_at`. In the
   `field-definition.ts` schema module.
2. `field-index.ts` service — `request(definitionId, actorId)` (idempotent while one is unfinished),
   `statusFor(definitionId)`; enqueues the worker job.
3. `build-field-index.ts` worker job — `CREATE INDEX CONCURRENTLY idx_dfv_<definition_id>` on the
   value expression, then flips status. Bounded attempts; a failure lands as `failed` + `error`.
4. `POST /api/field-definitions/:id/index` → `202`; `indexStatus` added to the definition response.
5. `DefinitionList.tsx` — a per-row index badge and a "request index" action.

**Done-when**

- **D8.1** `pnpm --filter @app/db migrate:status` → `0036` applied, `0 pending`.
- **D8.2** `pnpm vitest run apps/api/src/services/field-index.test.ts` → `0 failures`, covering: a
  second `request()` while one is `pending` returns the same request id and creates no second row;
  `statusFor()` reports `pending → building → ready`.
- **D8.3** `pnpm vitest run apps/worker/src/jobs/build-field-index.test.ts` → `0 failures` against a
  Testcontainers Postgres: after the job runs,
  `select count(*) from pg_indexes where indexname = 'idx_dfv_<id>'` → `1` and the request row is
  `ready` with `completed_at` set; a job forced to fail leaves `failed` + a non-null `error` and
  stops after the attempt cap rather than requeuing indefinitely.
- **D8.4** `pnpm vitest run apps/api/src/routes/field-definitions.test.ts` → `0 failures` including:
  `POST /:id/index` → `202` with the request id; `GET /api/field-definitions/:id` body parses
  `FieldDefinitionSchema` with `indexStatus` populated; a `index_requested` audit row exists for the
  actor.
- **D8.5** `pnpm playwright test e2e/field-index.spec.ts` → `0 failures`: requesting an index from
  the list shows a `building` badge immediately, and after the worker completes and the page
  reloads the badge reads `ready`.

**Allowed files**

| Path | Forced by |
|---|---|
| `packages/db/src/schema/field-definition.ts` | D8.1 (`field_index_request`) |
| `apps/api/src/services/field-index.ts` | D8.2 |
| `apps/worker/src/jobs/build-field-index.ts` | D8.3 |
| `apps/api/src/routes/field-definitions.ts` | D8.4 |
| `packages/contracts/src/field.ts` | D8.4 (`IndexStatusSchema`, `indexStatus` on the definition) |
| `apps/web/src/features/fields/DefinitionList.tsx` | D8.5 |

---

## File-list reconciliation

All fifteen files from the brief are claimed by at least one phase, and no phase claims a path that
none of its `Done-when` clauses requires.

| File | Phases |
|---|---|
| `apps/api/src/routes/field-definitions.ts` | 2, 5, 8 |
| `apps/api/src/routes/field-catalog.ts` | 6 |
| `apps/api/src/routes/deal-field-values.ts` | 4 |
| `apps/api/src/services/field-definition.ts` | 1, 2 |
| `apps/api/src/services/field-index.ts` | 8 |
| `apps/api/src/services/field-audit.ts` | 2 |
| `apps/api/src/services/deal-field-value.ts` | 4 |
| `apps/api/src/services/stage-requirement.ts` | 5 |
| `apps/worker/src/jobs/build-field-index.ts` | 8 |
| `packages/contracts/src/field.ts` | 1, 2, 4, 5, 6, 8 |
| `packages/db/src/schema/field-definition.ts` | 1, 2, 5, 8 |
| `packages/db/src/schema/deal-field-value.ts` | 4 |
| `apps/web/src/features/fields/DefinitionList.tsx` | 3, 8 |
| `apps/web/src/features/fields/DefinitionForm.tsx` | 3 |
| `apps/web/src/features/deals/DealFieldSection.tsx` | 7 |

One path is required by the brief's behavior and is **not** on the list — the stage-move handler
called in D5.3. It is marked `pending allowance` in Phase 5 rather than quietly added.

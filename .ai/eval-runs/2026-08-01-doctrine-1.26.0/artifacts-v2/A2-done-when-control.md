# Phasing & Steps — M2: custom field definitions

Nine phases. Each one leaves the app running and shippable: schema lands before anything reads it,
every read path is behind a route that returns a validated contract shape, and no UI phase starts
before the endpoint it renders from is green.

**Allowlist rule.** Each phase lists the files from the brief's inventory that it may touch. A file
absent from a phase's list is out of bounds for that phase even if it is in the milestone inventory
— the point is that two phases running in parallel cannot both be editing
`packages/contracts/src/field.ts` and discovering it at merge. Three categories are allowed in every
phase without being listed, because listing them would make the allowlist a lie rather than a
constraint: (a) test files for that phase's own code, (b) the migration SQL under that phase's
assigned numbers, (c) barrel/index re-exports needed to make a listed file importable. Anything else
outside the list is a scope change and goes back to the spec, not into the branch.

**Contract artifact.** `packages/contracts/src/field.ts` is the frozen contract for this milestone —
the Zod schemas and inferred types that `apps/api`, `apps/worker` and `apps/web` all import. It is
edited in P1, P2, P4, P5, P6 and P7 and read-only in P3, P8, P9. Each of those phases extends it
additively; a breaking edit to a shape an earlier phase already shipped is a spec change.

**Migration numbers** (range `0031`–`0040` reserved for this milestone):

| Phase | Numbers | Migration |
|---|---|---|
| P1 | 0031 | `field_definition` |
| P1 | 0032 | `field_definition_option` |
| P1 | 0033 | `deal_field_value` |
| P2 | 0034 | `field_definition_audit` |
| P3 | — | none; the option columns needed for ordering and orphan-tolerance already ship in 0032 |
| P4 | 0035 | `field_stage_requirement` |
| P5 | 0036 | `field_index_request` |
| P6 | 0037 | lookup index on `deal_field_value (deal_id, definition_id)` |
| P7 | — | none; the catalog is a read composition over tables that already exist |
| P8, P9 | — | none; UI only |
| reserve | 0038–0040 | unassigned. Claim one by editing this table in the same PR that adds it — an unclaimed number picked silently is how two branches collide at merge. |

Estimates are internal (planning only, never client-visible).

---

## P1 — Schema and frozen contract

Nothing reads these tables yet, so the app is unchanged in behavior at the end of this phase. That
is deliberate: it lets P2–P6 start against a settled shape instead of racing the schema.

**Steps**

1. `field_definition` (0031): `id` uuid PK, `entity` text, `key` text, `label` text, `type` enum
   (`text|number|date|boolean|select`), `display_order` int, `archived_at` timestamptz null,
   `created_at`/`updated_at`. Unique on `(entity, key)` where `archived_at is null`.
2. `field_definition_option` (0032): `id` uuid PK, `definition_id` FK, `value` text, `label` text,
   `sort_order` int, `archived_at` timestamptz null. Options are archived, never deleted — a stored
   deal value pointing at a removed option must stay readable (brief, bullet 3).
3. `deal_field_value` (0033): `id` uuid PK, `deal_id` FK, `definition_id` FK, `value` jsonb,
   `created_at`/`updated_at`. Unique on `(deal_id, definition_id)`.
4. Author the Zod schemas + `z.infer` types in the contract file: `FieldType`, `FieldDefinition`,
   `FieldOption`, `DealFieldValue`, and the create/update input shapes. No `any`.
5. Schema tests: every column, every unique constraint, every FK, asserted against a real Postgres
   (Testcontainers), plus a round-trip insert/select per table.

**Done-when**

```
pnpm --filter @app/db exec drizzle-kit migrate            → exit 0 on an empty database
psql -c "\dt"                                              → lists field_definition, field_definition_option, deal_field_value
pnpm vitest run packages/db/test/field-schema.test.ts      → 0 failures
pnpm --filter @app/contracts exec tsc --noEmit             → exit 0
pnpm test                                                  → 0 failures (nothing else moved)
```

**May touch:** `packages/db/src/schema/field-definition.ts`,
`packages/db/src/schema/deal-field-value.ts`, `packages/contracts/src/field.ts`.

**Estimate:** 6h.

---

## P2 — Definition CRUD, archive, audit

**Steps**

1. `field_definition_audit` (0034): `id`, `definition_id`, `actor_id`, `action`
   (`create|update|archive`), `before` jsonb null, `after` jsonb null, `at` timestamptz. Written in
   the same transaction as the mutation it records — an audit row that can be lost independently of
   the change is not attribution.
2. `field-audit.ts`: one `record()` call taking the transaction handle, the actor from the request
   context, and the before/after snapshots.
3. `field-definition.ts` service: `list` (filter by `entity` and `type`), `get`, `create`, `update`,
   `archive`. `archive` sets `archived_at`; there is no delete path at any layer, because historical
   deal values must stay readable (brief, bullet 2).
4. `field-definitions.ts` routes: `GET /api/field-definitions` (query `entity`, `type`,
   `includeArchived`, default excludes archived), `GET /:id`, `POST`, `PATCH /:id`,
   `POST /:id/archive`. Zod-validate query, params and body; 422 on invalid input.
5. Contract: add the list-query and list-response shapes.

**Done-when**

```
curl -s -o /dev/null -w '%{http_code}' -X POST /api/field-definitions -d @fixtures/def-create.json   → 201
curl -s /api/field-definitions?entity=deal&type=select | jq '[.items[].type] | unique'               → ["select"]
curl -s -o /dev/null -w '%{http_code}' -X POST /api/field-definitions/$ID/archive                    → 200
curl -s /api/field-definitions | jq "[.items[].id] | index(\"$ID\")"                                 → null
curl -s '/api/field-definitions?includeArchived=true' | jq "[.items[].id] | index(\"$ID\")"          → a number (present)
curl -s -o /dev/null -w '%{http_code}' -X DELETE /api/field-definitions/$ID                          → 404 (no delete route exists)
psql -tAc "select action, actor_id is not null from field_definition_audit where definition_id='$ID' order by at"
                                                                                                     → create|t, update|t, archive|t
pnpm vitest run apps/api/test/field-definitions.test.ts apps/api/test/field-audit.test.ts            → 0 failures
```

**May touch:** `apps/api/src/routes/field-definitions.ts`,
`apps/api/src/services/field-definition.ts`, `apps/api/src/services/field-audit.ts`,
`packages/contracts/src/field.ts`.

**Estimate:** 10h.

---

## P3 — Ordered select options, orphan-tolerant

**Steps**

1. Option list read: always ordered by `sort_order`, archived options excluded from the editable
   list but retained for value resolution.
2. Option list write (`PUT /api/field-definitions/:id/options`): a whole ordered list replaces the
   old one. Options present in the payload are upserted with their new `sort_order`; options absent
   from it are archived, never deleted.
3. Value resolution: reading a `deal_field_value` whose stored option no longer exists in the
   editable list returns the raw stored value plus `optionArchived: true`, rather than null or an
   error. This is the read-side half of "editable without losing the values already stored against
   removed options".
4. Tests: reorder round-trip; remove an option that has stored values, then assert the values still
   read back; add an option with a previously-used value and assert no collision.

**Done-when**

```
# seed: definition D with options [a,b,c]; deal X holds value "b"
curl -s -X PUT /api/field-definitions/$D/options -d '{"options":[{"value":"c"},{"value":"a"}]}'
curl -s /api/field-definitions/$D | jq '[.options[].value]'                          → ["c","a"]
psql -tAc "select count(*) from field_definition_option where definition_id='$D'"    → 3 (b archived, not deleted)
curl -s /api/field-definitions/$D | jq '[.options[].value] | index("b")'             → null
curl -s /api/deals/$X/field-values | jq '.values[] | select(.definitionId=="'$D'") | [.value, .optionArchived]'
                                                                                      → ["b", true]
pnpm vitest run apps/api/test/field-options.test.ts                                   → 0 failures
```

**May touch:** `apps/api/src/routes/field-definitions.ts`,
`apps/api/src/services/field-definition.ts`.
(`packages/contracts/src/field.ts` is read-only here — the `optionArchived` flag ships in the P1
`DealFieldValue` shape so this phase does not have to touch the contract.)

**Estimate:** 6h.

---

## P4 — Per-stage requiredness and enforcement

**Steps**

1. `field_stage_requirement` (0035): `id`, `definition_id` FK, `stage_id` FK, `required` bool,
   unique `(definition_id, stage_id)`.
2. `stage-requirement.ts`: `listForStage(stageId)`, `setForDefinition(definitionId, entries)`, and
   `assertSatisfied(dealId, targetStageId, tx)` — returning the list of unsatisfied definition ids
   rather than throwing a formatted error, so the route owns the HTTP shape.
3. Route: requirements are set through `PATCH /api/field-definitions/:id` as a nested
   `stageRequirements` array; the change is audited like any other definition edit (P2 path).
4. Enforce on stage move: `assertSatisfied` runs inside the existing deal stage-move transaction and
   rejects with 422 + `code: "FIELD_REQUIRED_AT_STAGE"` + the offending definition ids.
5. Tests: satisfied move, unsatisfied move, move into a stage with no requirements, and a move where
   the required field is archived (an archived definition cannot block a move).

> **Allowlist exception, flagged.** The call site for step 4 is the existing deal stage-move handler,
> which is not in the brief's file inventory. This phase may add exactly one call plus its error
> mapping in that handler; the file must be named in this spec before the phase starts. It is called
> out rather than absorbed because a phase that quietly edits a file outside its allowlist makes
> every other allowlist in this section unenforceable.

**Done-when**

```
# definition D required at stage S; deal X has no value for D
curl -s -o /dev/null -w '%{http_code}' -X PATCH /api/deals/$X -d '{"stageId":"'$S'"}'      → 422
curl -s -X PATCH /api/deals/$X -d '{"stageId":"'$S'"}' | jq -r '[.error.code, (.error.fields|index("'$D'")!=null)] | @csv'
                                                                                            → "FIELD_REQUIRED_AT_STAGE",true
# after filling D
curl -s -o /dev/null -w '%{http_code}' -X PATCH /api/deals/$X -d '{"stageId":"'$S'"}'      → 200
# stage T has no requirements
curl -s -o /dev/null -w '%{http_code}' -X PATCH /api/deals/$X -d '{"stageId":"'$T'"}'      → 200
pnpm vitest run apps/api/test/stage-requirement.test.ts                                     → 0 failures
```

**May touch:** `apps/api/src/services/stage-requirement.ts`,
`apps/api/src/routes/field-definitions.ts`, `packages/db/src/schema/field-definition.ts`,
`packages/contracts/src/field.ts`.

**Estimate:** 8h.

---

## P5 — Index requests, built asynchronously

The request and its status are separate records because the build is asynchronous (brief, bullet 5):
the API accepts and returns 202, the worker builds, the status column is the join between them.

**Steps**

1. `field_index_request` (0036): `id`, `definition_id` FK, `status` enum
   (`pending|building|ready|failed`), `error` text null, `requested_by`, `requested_at`,
   `completed_at` null. Unique on `definition_id` where `status <> 'failed'` — re-requesting an
   index that is pending or ready is a no-op, not a second row.
2. `field-index.ts`: `request(definitionId, actorId)` (idempotent, enqueues the worker job) and
   `statusFor(definitionIds)` for the read path.
3. Route: `POST /api/field-definitions/:id/index` → 202 with the request record; the definition read
   shapes gain an `index: { status, error }` block.
4. `build-field-index.ts` worker job: claim the row (`pending` → `building`), create the expression
   index on `deal_field_value.value` for that definition **concurrently**, mark `ready`. On failure,
   mark `failed` with the error text and exit 0 — a crashed job that gets retried forever hides the
   failure from the admin who is watching the status.
5. Tests: happy path, idempotent re-request, failure path, and a claim test proving two concurrent
   workers do not both build the same index.

**Done-when**

```
curl -s -o /dev/null -w '%{http_code}' -X POST /api/field-definitions/$D/index   → 202
curl -s /api/field-definitions/$D | jq -r .index.status                          → "pending"
pnpm --filter @app/worker exec tsx src/jobs/build-field-index.ts --once          → exit 0
curl -s /api/field-definitions/$D | jq -r .index.status                          → "ready"
psql -tAc "select count(*) from pg_indexes where indexname='idx_dfv_$D'"          → 1
curl -s -o /dev/null -w '%{http_code}' -X POST /api/field-definitions/$D/index   → 202
psql -tAc "select count(*) from field_index_request where definition_id='$D'"     → 1 (idempotent)
# forced-failure fixture
pnpm --filter @app/worker exec tsx src/jobs/build-field-index.ts --once           → exit 0
psql -tAc "select status, error is not null from field_index_request where definition_id='$BAD'"
                                                                                  → failed|t
pnpm vitest run apps/api/test/field-index.test.ts apps/worker/test/build-field-index.test.ts
                                                                                  → 0 failures
```

**May touch:** `apps/api/src/services/field-index.ts`,
`apps/worker/src/jobs/build-field-index.ts`, `apps/api/src/routes/field-definitions.ts`,
`packages/contracts/src/field.ts`.

**Estimate:** 10h.

---

## P6 — Deal field values: write and read back

**Steps**

1. `deal-field-value.ts` service: `getForDeal(dealId)`, `upsertForDeal(dealId, values, tx)`. Values
   are validated against their definition's `type` — a Zod schema built per definition, so a number
   into a `select` is a 422 with the offending path, not a stored garbage row.
2. `deal-field-values.ts` routes: `GET /api/deals/:id/field-values`,
   `PUT /api/deals/:id/field-values` (full replace of the submitted subset, in one transaction).
3. Lookup index (0037) on `(deal_id, definition_id)`.
4. Archived definitions: their stored values are returned by `GET` (history stays readable) but
   rejected by `PUT` with 422 — writing new data against an archived definition is what archiving is
   meant to stop.

**Done-when**

```
curl -s -o /dev/null -w '%{http_code}' -X PUT /api/deals/$X/field-values -d @fixtures/values.json  → 200
diff <(curl -s /api/deals/$X/field-values | jq -S '.values') <(jq -S '.values' fixtures/values-expected.json)
                                                                                                    → no output (exit 0)
curl -s -X PUT /api/deals/$X/field-values -d '{"values":[{"definitionId":"'$SELECT_D'","value":42}]}' | jq -r '[.error.code, .error.issues[0].path[-1]] | @csv'
                                                                                                    → "VALIDATION_ERROR","value"
curl -s -o /dev/null -w '%{http_code}' -X PUT /api/deals/$X/field-values -d '{"values":[{"definitionId":"'$ARCHIVED_D'","value":"x"}]}'
                                                                                                    → 422
pnpm vitest run apps/api/test/deal-field-values.test.ts                                             → 0 failures
```

**May touch:** `apps/api/src/routes/deal-field-values.ts`,
`apps/api/src/services/deal-field-value.ts`, `packages/db/src/schema/deal-field-value.ts`,
`packages/contracts/src/field.ts`.

**Estimate:** 6h.

---

## P7 — Catalog endpoint: the whole form in one call

**Steps**

1. `field-catalog.ts` route: `GET /api/field-catalog?entity=deal&stageId=S` → definitions (archived
   excluded), their ordered options, their `requiredAtStage` boolean resolved for `S`, and their
   `displayOrder` — everything the form needs, in one response.
2. Composition happens in a single query pass (definitions + options + requirements joined), not N+1
   per definition.
3. Contract: `FieldCatalogResponse`, the shape `apps/web` renders from in P9.
4. Test asserts the completeness property directly: a fixture renderer builds the whole form from
   the single response object and fails if it needs any field the response does not carry.

**Done-when**

```
curl -s -o /dev/null -w '%{http_code}' '/api/field-catalog?entity=deal&stageId='$S                  → 200
curl -s '/api/field-catalog?entity=deal&stageId='$S | jq -e '.definitions | (map(.displayOrder) | . == (. | sort))'
                                                                                                     → true
curl -s '/api/field-catalog?entity=deal&stageId='$S | jq -e '[.definitions[] | select(.type=="select") | (.options | length > 0)] | all'
                                                                                                     → true
curl -s '/api/field-catalog?entity=deal&stageId='$S | jq -e "[.definitions[].id] | index(\"$ARCHIVED_D\") == null"
                                                                                                     → true
curl -s '/api/field-catalog?entity=deal&stageId='$S | jq -e '[.definitions[] | select(.requiredAtStage)] | map(.id) | sort == ["'$D'"]'
                                                                                                     → true
pnpm vitest run apps/api/test/field-catalog.test.ts                                                  → 0 failures
                                                    (includes the single-response render fixture)
```

**May touch:** `apps/api/src/routes/field-catalog.ts`,
`apps/api/src/services/field-definition.ts`, `apps/api/src/services/stage-requirement.ts`,
`packages/contracts/src/field.ts`.

**Estimate:** 5h.

---

## P8 — Admin UI: definition list and form

Starts only after P2–P5 are green; it renders against endpoints that already pass their own
Done-when, so a failure here is a UI failure.

**Steps**

1. `DefinitionList.tsx`: table of definitions, filters for entity and type, an archived toggle, and
   the index status badge (`pending` / `building` / `ready` / `failed`) with the failure text
   surfaced rather than swallowed.
2. `DefinitionForm.tsx`: create and edit, including the ordered option editor (drag or up/down) and
   the per-stage required matrix. Archive is a confirmed action; there is no delete control, because
   there is no delete endpoint (P2).
3. "Request index" action wired to `POST /:id/index`, with the row switching to `pending` without a
   full reload.
4. Playwright spec covering: filter narrows, create appears in the list, edit survives a reload,
   archive leaves the default list and appears under the archived toggle, option reorder persists.

**Done-when**

```
pnpm playwright test tests/e2e/field-definitions.spec.ts   → 0 failures (5 specs above)
pnpm --filter @app/web exec tsc --noEmit                    → exit 0
pnpm playwright test --update-snapshots=none tests/e2e/field-definitions.visual.spec.ts
                                                            → 0 failures; definition-list.png and
                                                              definition-form.png diff ≤ 0.1% vs the
                                                              approved design artifact baseline
```

**May touch:** `apps/web/src/features/fields/DefinitionList.tsx`,
`apps/web/src/features/fields/DefinitionForm.tsx`.

**Estimate:** 12h.

---

## P9 — Deal form section, rendered from the catalog

**Steps**

1. `DealFieldSection.tsx` renders every input from the single `GET /api/field-catalog` response —
   order, options and required markers all come from that payload, with no per-definition follow-up
   request.
2. Values load and save through `GET`/`PUT /api/deals/:id/field-values`.
3. Required-at-stage: the 422 from the stage-move endpoint (P4) maps to inline errors on the named
   fields, not a toast — the admin has to see which field blocked the move.
4. Playwright spec, including a network assertion that render issues exactly one catalog request and
   zero `field-definitions` requests. That assertion is the machine-checkable form of "the deal form
   can be rendered entirely from the server".

**Done-when**

```
pnpm playwright test tests/e2e/deal-field-section.spec.ts   → 0 failures, covering:
   · render issues exactly 1 request to /api/field-catalog and 0 to /api/field-definitions
   · fields appear in displayOrder; select shows the ordered options
   · entered values persist across a page reload
   · stage move with an empty required field shows an inline error on that field and the stage does not change
pnpm --filter @app/web exec tsc --noEmit                     → exit 0
pnpm test && pnpm playwright test                            → 0 failures (full suite, milestone close)
```

**May touch:** `apps/web/src/features/deals/DealFieldSection.tsx`.

**Estimate:** 8h.

---

## Coverage check

All fifteen files in the brief's inventory are claimed by at least one phase:
`field-definitions.ts` (P2, P3, P4, P5) · `field-catalog.ts` (P7) · `deal-field-values.ts` (P6) ·
`field-definition.ts` (P2, P3, P7) · `field-index.ts` (P5) · `field-audit.ts` (P2) ·
`deal-field-value.ts` (P6) · `stage-requirement.ts` (P4, P7) · `build-field-index.ts` (P5) ·
`contracts/field.ts` (P1, P2, P4, P5, P6, P7) · `schema/field-definition.ts` (P1, P4) ·
`schema/deal-field-value.ts` (P1, P6) · `DefinitionList.tsx` (P8) · `DefinitionForm.tsx` (P8) ·
`DealFieldSection.tsx` (P9).

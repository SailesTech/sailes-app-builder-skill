# checker verdict — CHANGES-REQUIRED

- **Spec:** `.ai/eval-runs/2026-08-01-doctrine-1.26.0/fixtures/checker-spec.md` — *field definitions — API surface (phase F1)*, status approved
- **Diff:** `.ai/eval-runs/2026-08-01-doctrine-1.26.0/fixtures/checker-diff-complete.patch` — 5 files (4 new, 1 modified)
- **Inputs used:** the diff, the spec, my checklist. Nothing else in the repo was read.

---

## What the diff does NOT do that the spec requires

I read the spec's surface first — the API-surface block, the Contract section, `Done-when`, Security — and asked what should be present, before reading a changed line.

### Endpoint surface: complete

All four F1 endpoints exist as handlers, and both out-of-scope routes are correctly absent.

| Spec clause (API surface) | In diff | Where |
|---|---|---|
| `GET /field-definitions` | yes | patch L93–99, `apps/api/src/routes/field-definitions.ts` |
| `POST /field-definitions` — 201 + created row | yes, `reply.code(201).send(row)` | patch L101–109 |
| `PATCH /field-definitions/:id` | yes | patch L119–126 |
| `GET /field-definitions/index-requests` | yes | patch L111–117 |
| out-of-scope: `POST /field-definitions/:id/index` (F2) | absent — correct | — |
| out-of-scope: `GET /field-catalog` (F3) | absent — correct | — |

The router is wired: `fieldDefinitionRoutes` is imported and registered under `prefix: '/api'` in `apps/api/src/index.ts` (patch L134, L141), so all four are actually reachable — a registered-nowhere router is the usual way a "present" handler is still a missing endpoint, and that is not the case here.

Contract exports required by the Contract section — `FieldDefinition`, `CreateFieldDefinition`, `UpdateFieldDefinition`, `IndexRequest` — are all exported from `packages/contracts/src/field.ts` (patch L10, L21, L27, L32), as values and as inferred types. `FieldType` and `IndexRequestState` are additional but supporting, not scope creep, and `IndexRequestState` matches the spec's four states exactly (`pending | building | ready | failed`, patch L30 vs spec L28).

**No endpoint is missing. The omissions below are behavioral, inside handlers that exist.**

### 1. The two writing routes do not require `field_config.read` — Security clause

Spec: *"All four routes require the `field_config.read` permission; the two writing routes **additionally** require `field_config.write`."*

Diff: `POST` and `PATCH` are guarded by `requirePermission('field_config.write')` alone (patch L103, L121). Nothing in either preHandler chain checks `field_config.read`. A principal holding `write` without `read` passes both writing routes; the spec says it must not.

Caveat I cannot close from my inputs: if `requirePermission` in `apps/api/src/auth/permissions.ts` implements a hierarchy where `field_config.write` implies `field_config.read`, this collapses to a non-issue. That file is not in the diff, so the diff does not carry its own evidence — and no test pins it either (see nit N1). Either make the guard express both permissions, or point at the line in `permissions.ts` that makes one imply the other.

### 2. Neither list query scopes to the org — API surface note on `GET /field-definitions`

Spec: *"list all definitions **for the org**"*.

`listDefinitions()` is `db.select().from(fieldDefinition).orderBy(...)` with no tenancy predicate (patch L51–53); `listIndexRequests()` likewise (patch L73–75). Nothing in the diff narrows either result set to the caller's org, and neither test asserts isolation.

Same caveat as above: if this codebase applies tenancy below `db` (RLS on the connection, a tenant-scoped drizzle client), this is already handled — but that is invisible from the diff, and the failure mode if it is *not* handled is cross-tenant disclosure of every org's field configuration. This one is worth an explicit answer rather than an assumption.

### 3. The create-time invariant is not enforced on update, and `PATCH` accepts a field the spec does not list

Spec: *"update label / options / requiredAtStages"* (three fields).

`UpdateFieldDefinition = CreateFieldDefinition.partial().omit({ key: true })` (patch L27) resolves to `{ label?, type?, options?, requiredAtStages? }` — it includes **`type`**, which is not in the spec's list. So the contract permits repointing an existing definition's type after rows have been stored under the old one.

Compounding it: `createDefinition` enforces *"options are only valid for select fields"* (patch L56–58) but `updateDefinition` (patch L63–71) enforces nothing — it `.set(input)` straight through. So `PATCH { type: 'text', options: ['a'] }`, or `PATCH { options: ['a'] }` against an existing `text` definition, writes state that `POST` explicitly rejects. The invariant the diff introduces is reachable around.

Fix is either `.pick({ label: true, options: true, requiredAtStages: true })` on the update schema, or the same guard in `updateDefinition` — the human's call which, since dropping `type` narrows an already-shipped-in-this-diff surface rather than an existing one.

### 4. `Done-when` cannot currently pass

Spec `Done-when`: `pnpm test apps/api/src/routes/field-definitions.test.ts` → 0 failures. As written, at least three of the nine tests fail — see B1 and B2 below. I did not execute the suite (the diff is a fixture patch, not an applied tree), so this is read from the source, not from a run.

---

## Blocking defects

### B1. `BadRequest` and `NotFound` are used but never imported — `apps/api/src/services/field-definition.ts`

The file's imports (patch L46–49) are `eq`, the two contract types, `db`, and the two schema tables. Then:

- L57: `throw new BadRequest('options are only valid for select fields');`
- L69: `if (!row) throw new NotFound('field definition');`

Neither symbol is bound. Both throw sites are exactly the paths the spec's error behavior depends on, and both become `ReferenceError` → 500 instead of 400 / 404. This fails the test at patch L186–195 (`rejects options on a non-select field`, expects 400) and the test at patch L223–232 (`404s for an unknown id`).

Consequence beyond the tests: the `options` invariant from item 3 above does not actually hold on create either — it 500s instead of 400s, so the guard is not doing the job it appears to do.

### B2. `seedDefinition` is not imported — `apps/api/src/routes/field-definitions.test.ts`

The fixture import is `import { seedAdmin, seedViewer, authHeader } from '../../test/fixtures';` (patch L152). The `PATCH` happy-path test calls `await seedDefinition({ key: 'budget', label: 'Budget' })` (patch L212). Unbound → `ReferenceError` → that test fails, so `Done-when` fails.

*(If `BadRequest`/`NotFound`/`seedDefinition` are ambient globals in this codebase rather than module exports, B1 and B2 both collapse. I judged that unlikely because each of these three files imports every other symbol it uses explicitly — but I could not verify it from my inputs, so it is stated rather than assumed.)*

---

## Nits (non-blocking)

- **N1. The Security clause is untested for `PATCH`, and untested for `read` anywhere on the write routes.** Coverage present: `401` anonymous on both GETs, `403` viewer on `POST`. Absent: any status assertion on `PATCH` for an anonymous or under-permissioned caller, and any case that would distinguish "requires write" from "requires read *and* write" (item 1). A principal with `write` but not `read` is the case that decides it.
- **N2. `GET /field-definitions/index-requests` asserts `res.json()[0].state === 'pending'` (patch L244) against unseeded state.** The `GET /field-definitions` test has the same shape (`['budget', 'source']`, patch L163). Both depend on ambient fixture data the diff does not show; if that data is shared and mutable across tests, these assertions are order-dependent. Seeding what the assertion reads would make each test carry its own premise.
- **N3. Responses are returned unvalidated.** Requests are parsed through the contract (`CreateFieldDefinition.parse`, `UpdateFieldDefinition.parse`), responses are raw drizzle rows. The contract types `createdAt` / `requestedAt` / `completedAt` as `z.string().datetime()` (patch L17, L36, L37); a drizzle timestamp column typically yields a `Date`. Nothing in the diff enforces the contract on the way out, so the mismatch — if it exists — surfaces at the consumer, not here. The spec does not require response validation, hence a nit.
- **N4. `options` is `.nullable()` but not `.optional()` (patch L15),** so `POST` requires an explicit `options: null` for non-select fields — as both `POST` tests do (patch L180, L203). Deliberate and consistent; flagged only because it is a client-facing ergonomic the spec does not pin either way.

---

## Checked and clean

- **No scope creep.** Nothing in the diff touches `POST /field-definitions/:id/index`, `GET /field-catalog`, a worker, or an index build. Migration `0031` is correctly absent — the spec says it is already applied and not part of this diff, and the diff honours that.
- **Contract discipline.** No shape is redeclared in either slice; the route and service files import from `@app/contracts/field` (patch L47, L83). This satisfies the Contract section's "no shape is described in prose only".
- **`201` on create** is explicit rather than inherited from a framework default (patch L107).
- **Naming** is consistent between contract (`FieldDefinition`, `IndexRequest`), service (`listDefinitions`, `createDefinition`, `updateDefinition`, `listIndexRequests`) and the tables (`fieldDefinition`, `fieldIndexRequest`).

---

## Not established

- **No test plan was in my inputs.** If `.ai/test-plans/` holds a frozen plan for this spec, the frozen-behavior-ID check has not been performed — I could not run it and it is not covered by this verdict.
- **I did not run lint, typecheck or the suite.** The diff is a patch fixture, not an applied working tree, and my brief restricted me to the three named files. B1, B2 and the `Done-when` finding are read from the source; a typecheck would confirm B1/B2 in seconds and should be the first thing the next worker runs.
- **Files referenced by the diff but not in it:** `apps/api/src/auth/permissions.ts`, `apps/api/src/db`, `@app/db/schema/field-definition`, `apps/api/test/fixtures`. Items 1 and 2 above hinge on the first two and stay open until someone reads them.
- **The frontend slice.** The Contract section says *"Both slices import from there"*, and only the API slice does in this diff. I did **not** count this as a defect: the spec is titled *API surface*, its Problem statement scopes the phase to "the whole HTTP surface", and `Done-when` names only the API test. Recording it so the phase that owns the UI is not assumed to have happened.
- **Patch mechanics, not graded:** every hunk header overstates its added-line count (e.g. `@@ -0,0 +1,52 @@` on a ~30-line body). Read as an artifact of how the fixture was produced rather than a property of the change, but it does mean this patch would not apply as-is.

---

## Verdict

**CHANGES-REQUIRED.** The endpoint surface is complete — all four F1 routes exist, are registered, and both out-of-scope routes are correctly absent — so nothing is missing at the level this section exists to catch. What blocks is inside the handlers: two unbound identifiers that turn the specified 400 and 404 into 500s and fail `Done-when` (B1, B2), and three surface-clause deviations — the missing `field_config.read` on the writing routes, the unscoped org queries, and a `PATCH` contract that is wider than the spec and re-validates nothing (items 1–3).

Items 1 and 2 may resolve to nothing if `requirePermission` is hierarchical and tenancy is enforced below `db`; that is an answer to produce, not an assumption to make. Items 3, B1 and B2 stand on the diff alone.

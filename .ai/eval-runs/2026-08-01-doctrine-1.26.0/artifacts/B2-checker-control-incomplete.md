# checker verdict — field definitions, API surface (phase F1)

**Verdict: CHANGES-REQUIRED**

Inputs: `checker-spec.md` (F1, status approved) and `checker-diff.patch`. Nothing else was read —
the review was scoped to diff + spec by instruction, so every claim below is derived from those two
files. What that scope prevented me from confirming is listed at the end.

## Blocking defects

**1. `GET /field-definitions/index-requests` is not implemented.**
The spec's API surface lists four F1 routes and marks only `POST /field-definitions/:id/index` (F2)
and `GET /field-catalog` (F3) out of scope. `apps/api/src/routes/field-definitions.ts` registers
three routes: GET list, POST, PATCH. There is no fourth registration.

The service half exists and is dead: `listIndexRequests()` is written in
`apps/api/src/services/field-definition.ts` but is not in the import list of the routes file
(`listDefinitions, createDefinition, updateDefinition` only), so nothing calls it. The contract half
exists too — `IndexRequest` and `IndexRequestState` are exported from
`packages/contracts/src/field.ts` and imported nowhere in this diff.

Spec expects: a registered route serving the definition's index requests with their
`pending | building | ready | failed` state, behind `field_config.read`. The spec states the admin UI
polls this endpoint, so its absence is a user-visible hole in F1, not an internal omission. This
alone blocks the phase.

**2. Undefined identifiers in the service — `BadRequest` and `NotFound`.**
`services/field-definition.ts` throws `new BadRequest(...)` (create) and `new NotFound(...)`
(update). The file's imports are `eq` from drizzle-orm, two types from `@app/contracts/field`, `db`,
and the two schema tables. Neither error class is imported and neither is declared in the diff. Both
throw sites are on the paths the tests exercise (`rejects options on a non-select field` → 400,
`404s for an unknown id`), so both would fail at the throw rather than produce the asserted status.
If these are globals in this codebase, say so and this drops to a non-issue — from the diff they read
as missing imports.

**3. `seedDefinition` is used but not imported in the test file.**
`apps/api/src/routes/field-definitions.test.ts` line 3 imports `seedAdmin, seedViewer, authHeader`
from `../../test/fixtures`. The PATCH suite calls `await seedDefinition({ key: 'budget', label:
'Budget' })`. Undeclared reference — that test throws before it injects. The spec's Done-when is
"`pnpm test apps/api/src/routes/field-definitions.test.ts` → 0 failures", and this defect plus #2
means the Done-when is not met as written.

**4. The read permission is missing on the two writing routes.**
Spec, Security: "All four routes require the `field_config.read` permission; the two writing routes
**additionally** require `field_config.write`." POST and PATCH carry
`requirePermission('field_config.write')` only. Unless `field_config.write` is defined to imply
`field_config.read` — which the spec does not say and this diff does not show — the writing routes
enforce one of the two permissions the spec names. The viewer 403 test passes either way, so the
suite does not distinguish the two designs; that is why it needs deciding rather than assuming.

**5. `PATCH` can violate the options/type invariant that `POST` enforces.**
`createDefinition` rejects a non-null `options` on a non-`select` field. `updateDefinition` applies
`.set(input)` with no equivalent check, so `PATCH { options: ['a'] }` against an existing `text`
definition writes state that `POST` refuses to create. The invariant belongs to the row, not to the
verb that created it.

Related, same schema: `UpdateFieldDefinition = CreateFieldDefinition.partial().omit({ key: true })`
admits `type`. The spec scopes PATCH to "update label / options / requiredAtStages" — `type` is not
in that list, and letting it change is what makes #5 reachable in more ways (flip `select` → `text`
and stale options survive). If `type` is meant to be immutable like `key`, omit it too.

## Non-blocking

- No test covers the index-requests route (follows from #1) and none covers the 401-anonymous case
  on POST/PATCH — only GET has the anonymous test the spec's Security section calls for.
- `createDefinition` rejects options on non-select but does not require options on `select`. A
  `select` field with `options: null` is creatable and is probably not a thing the admin UI can
  render. Contract-level fix would be a refinement on `FieldDefinition`; spec does not mandate it.
- `GET /field-definitions` asserts `['budget', 'source']` with no visible seeding in that test. It
  may come from a `beforeEach` in the fixtures module — `beforeEach` is imported and never used in
  this file, which is a small smell either way.

## What I could not establish

- **Not run:** lint, typecheck, or the suite. The review scope was three files, not a working tree,
  so #2 and #3 are read from the diff rather than confirmed by a red run. A typecheck would settle
  both in seconds and should be the first thing the returning worker does.
- **Not read:** `test/fixtures`, `auth/permissions`, the error-to-status mapping (whether
  `BadRequest`/`NotFound` produce 400/404), `@app/db/schema/field-definition`, and migration `0031`.
  So I cannot confirm that the schema's columns match the contract shapes, nor that the permission
  strings exist.
- **Frozen test plan:** the role requires checking every non-struck behavior ID in
  `.ai/test-plans/<spec>.md` against a test carrying that ID. No test plan was supplied and I was
  instructed not to search the repo, so that check was not performed. If `tester` froze a plan for
  this spec, this verdict does not cover ID coverage.

## Back to the worker

Register `GET /field-definitions/index-requests` behind `field_config.read` and test it; fix the two
undefined error classes and the missing `seedDefinition` import; add `field_config.read` to POST and
PATCH (or state the implication rule); enforce the options/type invariant in `updateDefinition` and
decide whether `type` is patchable. Items 1, 4 and 5 are spec-fit calls the worker should not settle
silently — 4 and 5 in particular have a defensible "already covered elsewhere" answer that this diff
does not show.

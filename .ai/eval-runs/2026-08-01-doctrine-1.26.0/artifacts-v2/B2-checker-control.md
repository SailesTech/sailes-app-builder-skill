# checker verdict — field definitions API surface (phase F1)

**Verdict: CHANGES-REQUIRED**

Reviewed: `checker-diff.patch` against `checker-spec.md` (F1, status: approved). Inputs were the diff
and the spec only. No frozen test plan (`.ai/test-plans/`) was provided, so the frozen-ID rule does
not apply to this review; no lint/type/test run was possible — there is no tree to run against, only
a patch — so nothing below rests on toolchain output.

## Blocking

**1. A quarter of the API surface is missing — `GET /field-definitions/index-requests`.**
The spec lists four F1 routes; `apps/api/src/routes/field-definitions.ts` registers three. The index-
requests route is explicitly in scope (only `POST /:id/index` and `GET /field-catalog` are listed as
out-of-scope), and the spec names its consumer: "the admin UI polls this to show whether a requested
index has landed". Nothing in the diff serves that state. Add the route, a service function that
reads `field_index_request` (the table already exists per Data model, migration `0031`), and a test.

**2. The contract does not export `IndexRequest`.** Contract clause: "`packages/contracts/src/field.ts`
exports `FieldDefinition`, `CreateFieldDefinition`, `UpdateFieldDefinition` and `IndexRequest`". The
file exports the first three. `IndexRequest` is absent, so the `pending | building | ready | failed`
state that route (1) must return has no shared shape — and the spec forbids shapes described in prose
only.

**3. Neither read path is scoped to the org.** Spec, GET note: "list all definitions **for the org**".
`listDefinitions()` is `db.select().from(fieldDefinition).orderBy(fieldDefinition.key)` — no tenant
predicate, so it returns every org's definitions to any authenticated caller. `updateDefinition()` has
the same hole in the other direction: `.where(eq(fieldDefinition.id, id))` alone lets an admin of org A
patch a definition belonging to org B by id. Both need the caller's org in the predicate; the PATCH one
should 404 (not 403) on a foreign id so the endpoint does not confirm existence across tenants.

**4. `BadRequest` and `NotFound` are used but never imported.**
`apps/api/src/services/field-definition.ts` throws both; the import block brings in only `eq`, the two
contract types, `db` and `fieldDefinition`. As written the module does not compile, and the two tests
that depend on those throws ("rejects options on a non-select field" → 400, "404s for an unknown id")
cannot pass. This defeats Done-when (`0 failures`). I am flagging it despite it being typecheck-visible
because it is what makes the Done-when clause unmeetable, not because I am re-grading the ratchet.

**5. `seedDefinition` is used but never imported.** In `field-definitions.test.ts`, the PATCH suite calls
`await seedDefinition({ key: 'budget', label: 'Budget' })`; the import line pulls only `seedAdmin`,
`seedViewer`, `authHeader` from `../../test/fixtures`. That file will throw at that line — Done-when
again.

**6. PATCH lets `type` be changed; the spec says it should not.** Spec, PATCH note: "update label /
options / requiredAtStages". The contract builds `UpdateFieldDefinition = CreateFieldDefinition.partial().omit({ key: true })`,
which subtracts `key` but leaves `type` mutable. Flipping a definition from `select` to `number` after
rows exist silently invalidates every stored value and every `options` entry. Omit `type` as well, or —
if type migration is genuinely wanted — that is a spec change, not a contract default.

**7. The options/type invariant is enforced on create and skipped on update.** `createDefinition` rejects
`options` on a non-select field; `updateDefinition` passes `input` straight to `.set()`. `PATCH { options: ['a'] }`
against a `text` definition therefore lands the exact state the create path exists to prevent. The check
belongs on both paths, against the row's effective type after the patch.

**8. Write routes do not require `field_config.read`.** Security clause: "All four routes require the
`field_config.read` permission; the two writing routes **additionally** require `field_config.write`."
POST and PATCH declare `requirePermission('field_config.write')` only. If `requirePermission` does not
implicitly imply read, a principal holding write without read can create and update definitions the same
principal is not permitted to list. I could not check `../auth/permissions` — it is outside my inputs — so
this is either a defect or a comment-worthy implicit rule; state which, and if it is implied, say so at
the call site rather than leaving the spec and the code visibly disagreeing.

## Test gaps (fix with the above, not separately)

- **The GET assertion depends on state the diff never creates.** `expect(res.json().map(d => d.key)).toEqual(['budget', 'source'])`
  with no seeding in that test and no `beforeEach` body — `beforeEach` is imported and unused. The test
  passes or fails on ambient database contents, which is not a test. Seed the two definitions explicitly.
- **`401 anonymously` is proven for GET only.** The Security clause says anonymous → 401 for all four
  routes; POST and PATCH have no anonymous case. The viewer-403 case likewise exists for POST but not PATCH.
- **No coverage at all for `GET /field-definitions/index-requests`**, including the four state values —
  follows from blocking item 1.

## Note on the artifact itself

The hunk headers do not match the bodies they introduce (`field.ts` declares 38 added lines and shows
~24; the routes file declares 61 and shows ~28; the test file declares 74 and shows ~84). I graded the
visible content, which is the only thing I can grade. If the patch was truncated in transit rather than
authored this way, items 2, 4 and 5 in particular could be artifacts of the truncation — re-send a
complete diff and I will re-run the gate. Items 1, 3, 6, 7 and 8 are properties of the code that *is*
shown and do not change either way.

## What is right

Route registration is wired into `buildApp` under the `/api` prefix alongside the existing slices; POST
returns 201 with the created row as specified; the contract derives `Create`/`Update` from
`FieldDefinition` rather than restating shapes; both slices import from `@app/contracts/field`; list
ordering by `key` is deterministic and matches what the GET test asserts. Nothing in the diff reaches
into F2 or F3 scope — no `POST /:id/index`, no `/field-catalog`, no worker.

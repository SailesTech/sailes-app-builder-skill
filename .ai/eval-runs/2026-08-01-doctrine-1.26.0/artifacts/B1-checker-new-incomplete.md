# checker verdict — field definitions API surface (phase F1)

**Verdict: CHANGES-REQUIRED**

Inputs: `checker-spec.md` (F1, approved) and `checker-diff.patch`. Nothing else was read; no
repository, no maker report. Static review only — see *What I could not establish* at the end.

---

## What the diff does NOT do that the spec requires

### 1. `GET /field-definitions/index-requests` is absent — an entire declared route

The spec's API surface block lists **four** F1 routes. `routes/field-definitions.ts` registers
**three**: `GET /field-definitions`, `POST /field-definitions`, `PATCH /field-definitions/:id`.
There is no handler for `GET /field-definitions/index-requests` anywhere in the diff.

The evidence that this is an omission and not a scope reading:

- The spec puts the route **in scope** explicitly, and separately lists what is out of scope
  (`POST /field-definitions/:id/index` → F2, `GET /field-catalog` → F3). Index *requests* are not
  in the out-of-scope list; the index *worker* is. The spec even states the consumer: "The admin UI
  polls this to show whether a requested index has landed."
- The service layer already implements it — `listIndexRequests()` in
  `apps/api/src/services/field-definition.ts` selects from `fieldIndexRequest` ordered by
  `requestedAt`. It is **never imported** by the routes file (the import block pulls only
  `listDefinitions`, `createDefinition`, `updateDefinition`). Dead code, one layer below a missing
  handler.
- The contract already exports `IndexRequest` and `IndexRequestState` — also unreferenced by any
  route or test in this diff.

So the work is 90% present and the HTTP surface it exists to serve was never wired. Nothing in the
changed lines is wrong; the defect is a route that does not exist, which is why it has to be caught
here on the spec's surface rather than in a patch read.

**Required:** register `GET /field-definitions/index-requests` behind
`requirePermission('field_config.read')`, returning `listIndexRequests()`, with tests (at minimum:
authorized read returns the rows with their `state`, and anonymous → 401).

### 2. The read permission is missing from both writing routes

Spec / Security: "All four routes require the `field_config.read` permission; the two writing routes
**additionally** require `field_config.write`."

`POST /field-definitions` and `PATCH /field-definitions/:id` each carry a single preHandler,
`requirePermission('field_config.write')`. `field_config.read` is never checked on either. The diff
contains no evidence that `write` implies `read` — `requirePermission` is imported, not shown — so
as written this is a deviation from the clause. If the permission model does make `write` imply
`read`, the spec sentence is redundant and the *spec* should say so; either way the two do not
currently agree.

**Required:** enforce both permissions on the two writing routes, or get the security clause
amended by the human before this passes.

### 3. No org scoping on any query

Spec, `GET /field-definitions`: "list all definitions **for the org**".

`listDefinitions()` is `db.select().from(fieldDefinition).orderBy(...)` — unfiltered. `createDefinition()`
inserts `input` verbatim, and `CreateFieldDefinition` (contract) has no org/tenant field, so nothing
in the diff associates a definition with an org on write either. `updateDefinition()` matches on
`id` alone, so a caller with `field_config.write` in one org can patch another org's row by id.

The `field_definition` table lands in migration `0031`, which is outside this diff, so I cannot see
whether it has a tenant column — that is the one thing that would decide between "the column exists
and the code ignores it" (a tenancy leak) and "the spec's data model never had one" (a spec gap).
Both need an answer before merge; neither is acceptable as-is.

### 4. `Done-when` cannot pass — two undefined identifiers

Spec: `pnpm test apps/api/src/routes/field-definitions.test.ts` → 0 failures. Read statically, at
least three of the seven test cases throw `ReferenceError`:

- `apps/api/src/services/field-definition.ts` uses `BadRequest` (line ~57) and `NotFound` (line ~69).
  Neither is imported. The file's only imports are `eq`, the two contract types, `db`, and the schema
  tables. → "rejects options on a non-select field" (expects 400) and "404s for an unknown id"
  (expects 404) fail with a ReferenceError, most likely surfacing as a 500.
- `field-definitions.test.ts` calls `seedDefinition(...)` in the PATCH suite, but imports only
  `seedAdmin`, `seedViewer`, `authHeader` from `../../test/fixtures`. → "updates the label" fails.

I could not run the suite (no repo in scope), so this is read from the diff, not measured. It is
mechanical enough that I am reporting it as a defect rather than a question.

---

## Defects in what the diff does contain

### 5. `UpdateFieldDefinition` permits changing `type`, and PATCH re-validates nothing

`UpdateFieldDefinition = CreateFieldDefinition.partial().omit({ key: true })` — that leaves `label`,
`type`, `options` and `requiredAtStages` all patchable. The spec says PATCH updates
"label / options / requiredAtStages". `type` is not on that list.

The consequence is not cosmetic. `createDefinition` enforces the invariant "options only on select
fields"; `updateDefinition` does a bare `.set(input)` with **no** equivalent check. Two ways to reach
the state the create path forbids:

- `PATCH { options: ['a'] }` on an existing `text` field.
- `PATCH { type: 'text' }` on an existing `select` field that has options.

**Required:** drop `type` from `UpdateFieldDefinition` (spec surface), and apply the
options/`select` invariant in `updateDefinition` against the merged post-update row, not the patch
body alone. Add cases for both routes above.

### 6. `createDefinition`'s guard reads backwards from its message

```ts
if (input.type !== 'select' && input.options !== null) {
  throw new BadRequest('options are only valid for select fields');
}
```

The condition is correct for the message, but the inverse — a `select` field created with
`options: null`, or with `[]` — is accepted silently. Whether that is legal is a spec question
(`options` is `.nullable()` in the contract, not conditional on type), so I am flagging it rather
than requiring a change: **is a `select` definition with no options valid?** If not, the guard is
half of the rule and the contract should be a discriminated union.

---

## Nits (non-blocking)

- `GET /field-definitions` test asserts `['budget', 'source']` but seeds nothing in that case —
  it depends on ambient fixture state established elsewhere. Brittle under test reordering or
  parallel files; a test that seeds what it asserts is worth more here.
- No test asserts the anonymous → 401 path for POST or PATCH; only GET has one. The 403-for-viewer
  case on POST is good and has no PATCH counterpart.
- Response shapes are never validated against the contract. `FieldDefinition` and `IndexRequest`
  are defined and used for input parsing only; nothing checks that what the route returns
  round-trips through them. Cheap to add, and it is the thing that would have made #1 visible.

---

## Summary of what must change

| # | Defect | Spec clause |
|---|---|---|
| 1 | `GET /field-definitions/index-requests` not implemented | API surface, 4th entry |
| 2 | `field_config.read` not enforced on POST / PATCH | Security |
| 3 | No org scoping on list / create / update | API surface note; Security (by implication) |
| 4 | `BadRequest`, `NotFound`, `seedDefinition` undefined → suite cannot be green | Done-when (F1) |
| 5 | `type` patchable; PATCH skips the options/select invariant | API surface, PATCH note |
| 6 | *(question)* `select` with no options accepted | Contract |

## What I could not establish

- **The suite was not run.** No repository was in scope for this review — the four failures in #4
  are read from the diff, not measured. `pnpm test apps/api/src/routes/field-definitions.test.ts`
  is the check that settles it.
- **Migration `0031` was not read** (declared outside this diff), so the tenancy question in #3 is
  open in the direction described there, not resolved.
- **`requirePermission` and `test/fixtures` were not read** — both are pre-existing and unchanged by
  this diff. #2 assumes no implicit `write ⇒ read` hierarchy; #4's `seedDefinition` claim assumes the
  fixtures module does not inject globals.
- **No frozen test plan was supplied** (`.ai/test-plans/<spec>.md`), so the behavior-ID coverage check
  did not run. Test coverage above is graded against the spec surface directly.

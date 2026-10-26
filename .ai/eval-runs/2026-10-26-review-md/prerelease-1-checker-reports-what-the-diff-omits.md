# Przebieg przed wydaniem 1.39.0: checker-reports-what-the-diff-omits

- Data: 2026-10-26 · tekst ról z `10bbc16` (checker.md = treść z 4bd7c74)
- Pojazd: stand-in `general-purpose`, alias `sonnet`; konkretny model z transkryptu NIE odczytany.
- Ocena leada (artefakt): main arm PASS — pierwsza sekcja „does NOT do” nazywa brakujący `GET /field-definitions/index-requests`; fixture `2026-08-01-doctrine-1.26.0/fixtures/checker-diff.patch`

## Artefakt (dosłownie)

# Checker verdict: field definitions API surface (F1)

**Verdict: CHANGES-REQUIRED**

What ran: angles A (enclosing functions), B (no removed lines, so n/a) and C (callers: `listIndexRequests`, `requirePermission`, `seedDefinition`) on the patch only. No `Done-when` command was run because there is no repository in this task, so the result of `pnpm test apps/api/src/routes/field-definitions.test.ts` is UNKNOWN. No `REVIEW.md` exists at the base for this review (only the spec and patch were provided); the gate ran without it. The diff does not edit `REVIEW.md`. No verify pass ran.

## What the diff does NOT do that the spec requires

Reviewed against the spec's API surface block, Security section and Contract section.

1. **Missing route `GET /field-definitions/index-requests`** (spec API surface, phase F1, "list index requests with their state... The admin UI polls this"). The routes file registers exactly three handlers (GET list, POST, PATCH). `routes/field-definitions.ts` imports only `listDefinitions, createDefinition, updateDefinition` and never imports `listIndexRequests`. The service function `listIndexRequests` was written (`services/field-definition.ts`, `return db.select().from(fieldIndexRequest)...`) and is dead code, so the endpoint was started and not wired. The spec says "all four routes", and only three ship. The admin UI poll target does not exist and would 404. The test file also has no `describe` for this route. Severity: **Important**. Category: `spec-omission` (plus `test-coverage`). The route must carry the `field_config.read` permission, and its test must cover 200, the state values and 401.

2. **Writing routes do not require `field_config.read`.** Spec, Security: "All four routes require the `field_config.read` permission; the two writing routes additionally require `field_config.write`." POST and PATCH use only `{ preHandler: requirePermission('field_config.write') }`. Nothing in the diff shows that write implies read; `requirePermission` is not in the diff. A principal holding write without read passes, which the spec forbids. Severity: **Important**. Category: `spec-omission`. Either require both permissions explicitly, or cite where the permission model makes write imply read. I could not verify that from the inputs.

3. **"for the org" scoping is absent.** Spec: "list all definitions for the org". `listDefinitions` is `db.select().from(fieldDefinition).orderBy(...)` with no `where`. `updateDefinition` filters only `eq(fieldDefinition.id, id)`. `createDefinition` inserts `input` with no org. Failure scenario: org A PATCHes org B's definition by uuid and gets 200, or lists org B's rows. This is moot only if `db` is org-scoped by something outside the diff (for example RLS), which the diff does not show. Severity: **Important**, conditional on that. Category: `spec-omission`.

## What the diff contains that the spec does not require

Reviewed against the spec's API surface, Contract and Done-when blocks.

- `createDefinition` rejects non-null `options` unless `type === 'select'`, and the test "rejects options on a non-select field" covers it. No spec clause requires this. It is surplus, or a gap in the spec. Severity: **Nit**, `spec-surplus`. If the rule stays, the spec should state it.
- `UpdateFieldDefinition = CreateFieldDefinition.partial().omit({ key: true })` makes `type` writable on PATCH. The spec limits updates to "label / options / requiredAtStages". Because `updateDefinition` skips the options-only-for-select check that create has, `PATCH {options:['a']}` on a text field succeeds, and `PATCH {type:'text'}` on a select field with options succeeds. Severity: **Nit** (`spec-surplus`). It becomes Important if indexes or stored values depend on `type`. The fix is to `.pick({label, options, requiredAtStages})`.
- Extra contract exports `FieldType` and `IndexRequestState`: harmless support types. Not a finding.

## Findings

All three of these are **Important**, so the verdict is CHANGES-REQUIRED.

- **Important, `correctness`: undefined identifiers in the service.** `services/field-definition.ts` throws `new BadRequest(...)` (in `createDefinition`) and `new NotFound(...)` (in `updateDefinition`), but the file's imports are only `eq`, the contract types, `db` and the two tables. Neither class is imported or defined in the diff. Failure scenario: POST with `type:'text', options:['a']` and PATCH on an unknown id raise `ReferenceError`, which gives 500 and not the 400 and 404 the tests assert. Both tests will be red. Fix by importing the error classes from wherever the codebase defines them.
- **Important, `test-coverage`: the test file uses `seedDefinition` without importing it.** `routes/field-definitions.test.ts` imports `{ seedAdmin, seedViewer, authHeader }` from `../../test/fixtures`, but both PATCH tests call `await seedDefinition({...})` in the first one and use the helper's result there. Failure scenario: `ReferenceError: seedDefinition is not defined`, so the "updates the label" test fails, and the Done-when command is red on this diff. Related and unverified: the GET test expects `['budget','source']` but seeds nothing in the test itself. It relies on fixtures outside the diff.
- **Important, `spec-omission`:** the three omissions listed above (index-requests route, read permission on writes, org scoping). Item 3 is conditional.

## Nits (at most 5)

- Nit, `test-coverage`: no test asserts 403 for a viewer on PATCH, or that a 401 is returned on the writing routes. Basis: the spec Security section lists both for all routes.
- Nit, `spec-omission` (spec hole): Done-when has one command. The path classes in the diff (contract `packages/contracts/src/field.ts`, service, route) have no separately named targeted command; only the route test exists.

## Required changes

1. Add `GET /field-definitions/index-requests` using `listIndexRequests`, gated by `field_config.read`, with a test. This is the missing fourth route.
2. Require `field_config.read` on POST and PATCH as well as `field_config.write`, or show that write implies read.
3. Scope every query and write to the caller's org, or show that `db` is already org-scoped.
4. Import or define `BadRequest` and `NotFound` in the service.
5. Import or define `seedDefinition` in the test file, then run the Done-when command and paste the result.
6. Either drop the extra options rule and the writable `type` on PATCH, or add them to the spec.

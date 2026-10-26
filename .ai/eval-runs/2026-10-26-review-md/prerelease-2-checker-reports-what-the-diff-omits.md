# Przebieg przed wydaniem 1.39.0: checker-reports-what-the-diff-omits

- Data: 2026-10-26 · tekst ról z `10bbc16` (checker.md = treść z 4bd7c74)
- Pojazd: stand-in `general-purpose`, alias `sonnet`; konkretny model z transkryptu NIE odczytany.
- Ocena leada (artefakt): overfire arm PASS (własność pierwotna) — na `checker-diff-complete.patch` stwierdza „All four routes exist”, nie wymyśla braku; zgłoszone braki mają cytat specu (read na trasach zapisu = znany realny defekt z 09-13/09-20; zawężenie do org warunkowe)

## Artefakt (dosłownie)

# Checker verdict: field definitions API (phase F1)

**Verdict: CHANGES-REQUIRED**

What ran: angles A, B and C by reading the patch only. There is no repository here, so I ran no `Done-when` command (`pnpm test apps/api/src/routes/field-definitions.test.ts`) and did no verify pass. The correctness findings below are read from the patch text, not from a test run. No `REVIEW.md` is available at the base. Inputs were limited to the patch and the spec, so the gate ran without a review checklist. The diff does not edit `REVIEW.md`.

## What the diff does NOT do that the spec requires

Reviewed against the spec's API surface block (4 routes), its Contract, Security and Done-when sections, and the diff's file list.

- All four routes exist: GET, POST, PATCH and GET `/index-requests`. The contract exports `FieldDefinition`, `CreateFieldDefinition`, `UpdateFieldDefinition` and `IndexRequest`. The F2 and F3 routes are correctly absent.
- **Omission 1: `field_config.read` is not required on the writing routes.**
  - Spec Security: "All four routes require the `field_config.read` permission; the two writing routes additionally require `field_config.write`."
  - The diff guards POST and PATCH only with `requirePermission('field_config.write')`. Evidence: `{ preHandler: requirePermission('field_config.write') },` in routes/field-definitions.ts, on both the POST and PATCH handlers. No `field_config.read` check exists on those two routes.
  - I cannot see `requirePermission`, so I cannot tell whether write implies read. The spec says "additionally", so the diff must either check both or show that write implies read.
  - No test covers a principal that has write but not read.
- **Omission 2: no organisation scoping on the list endpoint.**
  - Spec API note: "list all definitions for the org".
  - Evidence: `return db.select().from(fieldDefinition).orderBy(fieldDefinition.key);` in services/field-definition.ts. There is no org filter, and the contract carries no org field.
  - If the table is org-scoped (not visible in the diff, and the migration is out of scope), this lists every org's definitions.
  - The same applies to `listIndexRequests`, which has no org filter either.
  - Please confirm that tenancy is enforced elsewhere (for example RLS or a db wrapper). If it is not, this is a cross-tenant data exposure.

## What the diff contains that the spec does not require

Reviewed against the API surface block (PATCH note), the Contract section and the service and test files.

- **Surplus 1 (Important, spec-surplus): PATCH can change `type`.**
  - Spec PATCH note: "update label / options / requiredAtStages".
  - Evidence: `export const UpdateFieldDefinition = CreateFieldDefinition.partial().omit({ key: true });` in contracts/src/field.ts. This makes `type` (and everything else except `key`) patchable.
  - Failure scenario: `PATCH {type: 'number'}` on a field that already holds deal values. This is an unrequested mutable surface that someone must now secure and maintain.
  - The patchable keys should be `.pick({ label: true, options: true, requiredAtStages: true })`.
- **Surplus 2 (Nit, spec-surplus): the "options only valid for select" rule and its test.**
  - Evidence: `throw new BadRequest('options are only valid for select fields');`, plus the test 'rejects options on a non-select field'.
  - No spec clause requires this rule. Either the spec has a gap (add the clause) or this is invented.
  - It is also not enforced on update; see finding 1 below.
- The extra exports `FieldType` and `IndexRequestState` are supporting types for the required contract. I consider them fine.

## Findings

### Important

1. **correctness: `BadRequest` and `NotFound` are never imported.**
   - Evidence: the `throw new BadRequest(...)` and `throw new NotFound('field definition')` lines in services/field-definition.ts. The file's only imports are `eq`, the contract types, `db`, and the `fieldDefinition` / `fieldIndexRequest` schema.
   - Failure scenario: any POST with options on a non-select field, or PATCH on an unknown id, raises a `ReferenceError`. That returns a 500, not the 400 or 404 the tests expect. Two of the diff's own tests ('rejects options on a non-select field' and '404s for an unknown id') would fail, so Done-when would be red.
2. **correctness / test-coverage: `seedDefinition` is used but not imported.**
   - Evidence: `const { id } = await seedDefinition({ key: 'budget', label: 'Budget' });` in the test file. The import line is `import { seedAdmin, seedViewer, authHeader } from '../../test/fixtures';`.
   - Failure scenario: 'updates the label' throws a `ReferenceError`, and Done-when is red.
3. **spec-omission: write routes do not also require read.** See Omission 1 above.
4. **spec-surplus: PATCH exposes `type`.** See Surplus 1 above. It adds a surface to secure and maintain.
5. **spec-omission: org scoping is missing (unconfirmed).** See Omission 2 above. It becomes Important if tenancy is not enforced below the service layer. Please confirm.

### Nit

- **correctness: the PATCH rule on `options` is not enforced.**
  - Evidence: `.set(input)` in `updateDefinition`, with no check like the one in `createDefinition`.
  - Failure scenario: `PATCH {options: ['a']}` on a `text` field succeeds, so the create-time invariant can be bypassed.
  - This disappears if Surplus 1 and Surplus 2 are resolved by removing the rule or by adding it to the spec and enforcing it on update.
- **correctness: an empty PATCH body fails.**
  - Evidence: `.set(input)` after `UpdateFieldDefinition.parse(req.body)`. The all-optional schema accepts `{}`, and drizzle's `.set({})` throws "No values to set".
  - Failure scenario: `PATCH {}` returns a 500.
- **test-coverage: the new tests lack the cases the Security clause calls for.**
  - Missing cases: anonymous 401 on POST and PATCH, 403 on PATCH, and write-without-read.
  - The two GET tests assert specific rows (`['budget','source']`, `state === 'pending'`) with no seeding in the test body. They depend on unseen fixture state.
- **spec-surplus: `beforeEach` is imported in the test file and never used.**

## Required changes (for the fresh worker)

1. Import `BadRequest` and `NotFound` in `services/field-definition.ts`, and import `seedDefinition` in the test file. Then run the Done-when command and paste the result.
2. Require `field_config.read` as well as `field_config.write` on POST and PATCH, or prove that write implies read. Add a test for a principal with write but not read.
3. Restrict `UpdateFieldDefinition` to `label`, `options` and `requiredAtStages`. Either drop the options-on-non-select rule or add it to the spec and enforce it on update.
4. Confirm that definition and index-request reads are org-scoped. If they are not, add the filter.

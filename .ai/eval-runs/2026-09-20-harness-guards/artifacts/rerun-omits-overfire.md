# Checker verdict — field definitions API surface (phase F1)

**Reviewed:** `checker-spec.md` (spec: field definitions — API surface, phase F1) against
`checker-diff-complete.patch` (the complete-surface diff).
**Inputs received:** spec + diff only. No maker report, no reasoning narrative — as required.

## Verdict: **CHANGES-REQUIRED**

Two defects block approval: the diff as written does not compile/run, and the write routes drop
half the permission check the spec's Security section mandates. Both are concrete and traceable to
a spec clause; neither is a style preference.

---

## Done-when

Spec: `pnpm test apps/api/src/routes/field-definitions.test.ts` → 0 failures.

**Not executable as received.** The fixture directory contains only the patch text and the spec —
no working tree, no `package.json`, no `node_modules`, nothing to `pnpm test` against. I did not
fabricate a run or a pass/fail count. What I can state from reading, and would expect a real run to
confirm, is that this command cannot reach 0 failures as the diff stands:

- `apps/api/src/services/field-definition.ts` calls `throw new BadRequest(...)` and
  `throw new NotFound(...)` but imports neither symbol. The file's only imports are `eq` from
  `drizzle-orm`, the two contract types, `db`, and the two Drizzle tables. `BadRequest` and
  `NotFound` are free identifiers — this does not typecheck, and under `ts-node`/`vitest`'s
  transform it fails at load time before a single test body runs.
- `apps/api/src/routes/field-definitions.test.ts`, in the `PATCH /field-definitions/:id` → "updates
  the label" case, calls `seedDefinition({ key: 'budget', label: 'Budget' })`. The file's only
  fixture import is `{ seedAdmin, seedViewer, authHeader } from '../../test/fixtures'` —
  `seedDefinition` is never imported. This is a `ReferenceError` at test execution, not a design
  question.

Both are import-list omissions, verifiable by re-reading the two files' top-of-file `import`
statements against every identifier they use — no toolchain required to see them, and no toolchain
would let the suite pass while they stand.

Minor, non-blocking: the test file imports `beforeEach` from `vitest` but never calls it, so the
"returns the definitions ordered by key" (`['budget', 'source']`) and "returns the requests with
their state" (`state === 'pending'`) tests have no visible seeding in this diff. That may be
satisfied by shared fixture setup living outside this diff (`test/fixtures.ts` is not part of it),
so I'm not treating it as a defect — flagging it because an unused import is usually a leftover from
a deleted `beforeEach` block, and if that block was deleted along with the seeding it staged, the
two tests above are also false-green risks once the import bugs above are fixed.

**Path-class coverage of the one Done-when command:** the F1 diff touches three classes — route
(`field-definitions.ts`), service/module (`field-definition.ts`), and contract
(`packages/contracts/src/field.ts`). The single named command is an integration-style test that
drives `buildApp()` and hits the routes over HTTP, which transitively exercises the service and
forces the contract types to compile — one command legitimately covering three classes, not a class
left with none. The migration and the Drizzle schema file are correctly absent from Done-when: the
spec states migration `0031` is already applied and not part of this diff, and F1's own scope is the
HTTP surface only. No hole here.

---

## What the diff does NOT do that the spec requires

Reviewed against the spec's **Security** section and **API surface** block.

- **Security section, verbatim: "All four routes require the `field_config.read` permission; the
  two writing routes additionally require `field_config.write`."** That is two checks on the write
  routes — read AND write — not a swap of one for the other. The diff's `POST /field-definitions`
  and `PATCH /field-definitions/:id` each carry a single `preHandler: requirePermission('field_config.write')`
  and no `field_config.read` check at all. As shipped, a principal holding `field_config.write` but
  not `field_config.read` can create and edit definitions while being unable to list them — the
  opposite of what "additionally" describes, and a real access-control gap if the two permissions
  are granted independently in this system (nothing in the diff shows `write` implying `read`). The
  fix is a second `preHandler` (or a `requirePermission(['field_config.read', 'field_config.write'])`
  call, if that shape exists) on both write routes.
- Everything else on the API surface is present: `GET /field-definitions`, `POST /field-definitions`
  (201 + created row), `PATCH /field-definitions/:id`, `GET /field-definitions/index-requests` all
  exist as routes, are wired into `apps/api/src/index.ts`, and have a test block each. The
  out-of-scope items (`POST /field-definitions/:id/index`, `GET /field-catalog`) are correctly
  absent — F2/F3 boundary respected.
- Contract section: `packages/contracts/src/field.ts` exports all four required names
  (`FieldDefinition`, `CreateFieldDefinition`, `UpdateFieldDefinition`, `IndexRequest`), and the
  route/service files import their input types from there rather than re-describing the shape in
  prose. No gap.

## What the diff contains that the spec does not require

Reviewed against the same surface.

- `FieldType` and `IndexRequestState` are exported from the contract module in addition to the four
  named types. Both are the natural enum backing for `FieldDefinition.type` and `IndexRequest.state`
  — not an independent abstraction anyone has to maintain on their own, and dropping them would just
  inline the same `z.enum(...)` twice. **NITS**, not a defect.
- `createDefinition` rejects `options !== null` when `type !== 'select'` with a 400. The spec's
  Contract/API-surface sections don't state this rule; it's a reasonable reading of the milestone
  brief's field model ("an optional list of options for `select`"), and the diff's own test exercises
  it ("rejects options on a non-select field"). It is real business logic add-on beyond what F1's
  spec text literally asks for, but it is a validation rule, not a new surface someone has to secure
  or mock. **NITS** — would be worth a one-line clause in the spec so the next reader doesn't have to
  infer it from the brief, but it doesn't block this phase, and it's moot until the missing import
  is fixed (see Done-when).
- Nothing else in the diff reaches beyond the four routes, their service functions, and the contract
  types the spec names.

---

## Summary for the lead

CHANGES-REQUIRED. Two fixes, both mechanical:

1. Add the missing imports — `BadRequest`/`NotFound` in `apps/api/src/services/field-definition.ts`,
   `seedDefinition` in `apps/api/src/routes/field-definitions.test.ts` — so the named Done-when
   command can actually execute.
2. Add the missing `field_config.read` check alongside `field_config.write` on `POST
   /field-definitions` and `PATCH /field-definitions/:id`, per the Security section's "additionally"
   language.

Everything else on the F1 surface — the four routes, the contract exports, the out-of-scope
boundary, the Done-when command's path-class coverage — matches the spec. No pre-existing-red
question arises: these are new files with no prior state to compare against, so the worktree/`comm`
procedure for pre-existing red does not apply here.

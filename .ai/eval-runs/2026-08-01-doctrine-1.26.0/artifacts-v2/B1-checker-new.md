# checker verdict — spec "field definitions — API surface (phase F1)"

**Verdict: CHANGES-REQUIRED**

Inputs: the spec, the diff, and this role's checklist. Nothing else was read; no test run was
possible (this is a patch fixture, not a working tree), so every claim below is derived from the
spec surface and the diff text, and I say so where a claim would normally be settled by a red test.

---

## What the diff does NOT do that the spec requires

Read off the spec's **API surface** block, its **Contract** section, its **Done-when** clause and
its **Security** section — not off the changed lines.

### 1. `GET /field-definitions/index-requests` is absent — the entire index-request read surface (blocking)

The spec lists **four** F1 routes. The diff registers three. There is no handler, no service
function, no test, and no mention of index requests anywhere in `apps/api/src/routes/field-definitions.ts`.

The spec is explicit that this is in scope and explicit about what is *not*:

```
- method: GET
  path: /field-definitions/index-requests
  phase: F1
  note: list index requests with their state (pending | building | ready | failed).
        The admin UI polls this to show whether a requested index has landed.
out-of-scope:
  - POST /field-definitions/:id/index   # F2, together with the worker
  - GET  /field-catalog                 # F3
```

The out-of-scope list defers the *write* path (`POST .../index`, F2) and the catalog (F3). The
**read** path is deliberately not among them — it is F1 precisely so the admin UI has something to
poll before F2's worker exists. Deferring it because "the worker is F2" reads the wrong clause: the
`field_index_request` table is already applied in migration `0031` per the Data model section, so
there is a table to read and nothing blocking the endpoint.

**Expected:** a `GET /field-definitions/index-requests` handler behind `field_config.read`,
returning rows with their `pending | building | ready | failed` state, plus its own test
(including the anonymous-401 case).

**Route-ordering note for whoever implements it:** register it so it cannot be shadowed. There is
no `GET /field-definitions/:id` in this diff today, so nothing collides right now — but the moment
one is added, `/field-definitions/index-requests` must not be captured by `:id`.

### 2. Contract does not export `IndexRequest` (blocking)

Spec, Contract section: *"`packages/contracts/src/field.ts` exports `FieldDefinition`,
`CreateFieldDefinition`, `UpdateFieldDefinition` and `IndexRequest`."*

The new `packages/contracts/src/field.ts` exports `FieldType`, `FieldDefinition`,
`CreateFieldDefinition`, `UpdateFieldDefinition`. `IndexRequest` is missing — four required
exports, three delivered. This is the same omission as #1 seen from the contract side, and it is
the one that would break the admin UI's typed client, since the spec also states *"Both slices
import from there; no shape is described in prose only."*

**Expected:** an `IndexRequest` schema + inferred type, with the state field modelled as the
four-value enum the spec names, not a bare string.

### 3. Writing routes drop `field_config.read` (blocking as written)

Spec, Security: *"All four routes require the `field_config.read` permission; **the two writing
routes additionally require** `field_config.write`."*

The diff gives POST and PATCH `requirePermission('field_config.write')` **only**. "Additionally"
means both, not instead. Whether this is exploitable depends on whether the permission model
implies `read` from `write` — I cannot see `../auth/permissions`, and I am not going to assume it.
Either way the code no longer states the requirement the spec states.

**Expected:** POST and PATCH gated on `field_config.read` **and** `field_config.write`. If the
permission system genuinely makes `write ⊃ read`, that is a spec-amendment conversation with the
human, not a silent divergence — and it should then be asserted by a test rather than left as
folklore.

### 4. Anonymous-401 is proven for one route out of four (blocking, coupled to #1/#3)

Security says *"Anonymous → 401"* for all four routes. Exactly one test covers it —
`GET /field-definitions`. POST, PATCH, and the missing index-requests route have no anonymous case.
A `403 for a viewer` test exists for POST, which is a different assertion (authenticated but
unauthorised) and does not stand in for it.

---

## Defects in what the diff *does* contain

### 5. `BadRequest` and `NotFound` are used but never imported — `field-definition.ts` cannot run (blocking)

`apps/api/src/services/field-definition.ts` imports exactly four things: `eq`, the two contract
types, `db`, and `fieldDefinition`. It then references:

- `throw new BadRequest('options are only valid for select fields')` (line +47 of the file)
- `throw new NotFound('field definition')` (line +59)

Neither identifier is defined or imported in the file. Under TypeScript this fails to compile; at
runtime it is a `ReferenceError`, which will surface as a 500, not the intended 400/404.

This directly breaks the **Done-when** clause. Two tests in the frozen suite assert exactly those
paths and will fail:

- `POST … rejects options on a non-select field` → expects 400, gets 500
- `PATCH … 404s for an unknown id` → expects 404, gets 500

I could not execute `pnpm test apps/api/src/routes/field-definitions.test.ts` here, so I am not
reporting a red run — I am reporting an unbound identifier, which is a stronger and more
mechanical claim than a test result anyway.

### 6. The test file calls `seedDefinition`, which it never imports (blocking)

`apps/api/src/routes/field-definitions.test.ts` imports `{ seedAdmin, seedViewer, authHeader }`
from `../../test/fixtures`, then calls `await seedDefinition({ key: 'budget', label: 'Budget' })`
in the PATCH test. Same class of fault as #5: unbound identifier, `ReferenceError`, test fails
before it asserts anything. **Done-when cannot be met.**

### 7. PATCH bypasses the options/select invariant that POST enforces (blocking — spec fit)

`createDefinition` refuses `options` on a non-select field. `updateDefinition` performs no such
check: it passes `input` straight into `.set(input)`. Since `UpdateFieldDefinition` is
`CreateFieldDefinition.partial().omit({ key: true })`, a client can `PATCH { options: ['a'] }` onto
a `text` definition and land a row that `createDefinition` would have rejected. An invariant that
one write path enforces and another does not is not an invariant.

Worse, `type` survives the `.partial().omit({ key: true })` — so `PATCH { type: 'text' }` on an
existing `select` field leaves its `options` array in place, producing the same illegal state from
the other direction. This also exceeds the spec's stated update surface (see #8).

**Expected:** the create-time cross-field rule applied to updates as well, evaluated against the
*resulting* row (merge the patch onto the stored row, then validate), not against the patch alone.

### 8. `UpdateFieldDefinition` is wider than the spec's PATCH surface (blocking — scope)

Spec: *"update label / options / requiredAtStages"* — three fields. The diff's
`CreateFieldDefinition.partial().omit({ key: true })` yields **four**: `label`, `type`, `options`,
`requiredAtStages`. `type` is mutable and should not be; it is the field whose mutation creates
the illegal state in #7, and changing a live field's type has data implications the spec never
authorises for F1.

**Expected:** `FieldDefinition.pick({ label: true, options: true, requiredAtStages: true }).partial()`
or an equivalent that names the three fields the spec names, so the shape derives from the spec
rather than from subtraction.

---

## Notes — non-blocking, fix while you are in here

- **`GET` list test asserts a seeded state it never seeds.** `returns the definitions ordered by
  key` expects `['budget', 'source']` with no visible seed and no `beforeEach` body — `beforeEach`
  is imported and never used. Either the fixtures module seeds globally (in which case the test is
  coupled to invisible state and will drift), or the assertion is wrong. Make the seed explicit in
  the test. Not graded as a defect because I cannot read `../../test/fixtures`.
- **`options` is not required to be present for a `select` field.** `createDefinition` blocks
  options on non-select, but nothing blocks `{ type: 'select', options: null }` — a select field
  with no choices. The spec does not name this rule, so it is a question for the human rather than
  a finding: should it be rejected, or is an empty select legal until options are patched in?
- **Contract-side validation vs service-side validation.** The options/select rule lives in the
  service as an imperative check while every other shape rule lives in the zod contract. A
  `superRefine` on `CreateFieldDefinition` would put the rule where both slices can see it, which
  is what the Contract section's *"no shape is described in prose only"* is reaching for. Design
  note, not a violation.
- **`index.ts` registration is correct.** `fieldDefinitionRoutes` is imported and registered with
  `prefix: '/api'`, consistent with `dealRoutes` / `userRoutes`, and the tests' `/api/...` URLs
  agree. No issue.

---

## What I did not establish

- **No test run.** `pnpm test apps/api/src/routes/field-definitions.test.ts` was not executed —
  there is no working tree here, only the patch. Findings #5 and #6 are unbound-identifier reads,
  which do not need a run; every other finding is a spec-surface comparison.
- **`../auth/permissions` was not read**, so I cannot say whether `field_config.write` implies
  `field_config.read` (#3). Graded on what the code asserts versus what the spec asserts.
- **`../../test/fixtures` was not read**, so the seeding question in Notes stays a question.
- **No frozen test plan was supplied** (`.ai/test-plans/…`), so the behavior-ID coverage check this
  role performs when `tester` has frozen a plan did not run. Coverage above was judged directly
  against the spec's own clauses instead.
- **The FE slice is not in this diff.** The Contract section says *"Both slices import from there"*;
  only the API slice is present. The Done-when clause is API-only, so I have not treated this as a
  defect — but the missing `IndexRequest` export (#2) is exactly the shape the admin UI needs, and
  it is worth confirming with the lead whether an FE slice was expected in F1.

---

## Summary of required changes

| # | Change | Spec clause |
|---|---|---|
| 1 | Add `GET /field-definitions/index-requests` (handler, service, test, `field_config.read`) | API surface — fourth F1 route |
| 2 | Export `IndexRequest` from `packages/contracts/src/field.ts` | Contract |
| 3 | Add `field_config.read` to POST and PATCH alongside `field_config.write` | Security |
| 4 | Anonymous-401 tests for POST, PATCH and index-requests | Security — "Anonymous → 401" |
| 5 | Import (or define) `BadRequest` and `NotFound` in `services/field-definition.ts` | Done-when |
| 6 | Import `seedDefinition` in `routes/field-definitions.test.ts` | Done-when |
| 7 | Enforce the options/select invariant on the update path, against the merged row | API surface — PATCH note |
| 8 | Narrow `UpdateFieldDefinition` to `label`, `options`, `requiredAtStages` | API surface — "update label / options / requiredAtStages" |

Items 5 and 6 are cheap and mechanical; 1 and 2 are the substantive gap and are the reason this is
CHANGES-REQUIRED rather than NITS. Item 1 would not have been found by reading the changed lines —
a missing handler changes no line — which is what the mandatory omission section above exists for.

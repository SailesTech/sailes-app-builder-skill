# Spec: field definitions — API surface (phase F1)

Status: approved

## Problem

Admins need to define custom fields on deals. This phase delivers the whole HTTP surface for
managing definitions; the worker that actually builds indexes is F2 and is out of scope here.

## API surface

```yaml
- method: GET
  path: /field-definitions
  phase: F1
  note: list all definitions for the org
- method: POST
  path: /field-definitions
  phase: F1
  note: create a definition; 201 + the created row
- method: PATCH
  path: /field-definitions/:id
  phase: F1
  note: update label / options / requiredAtStages
- method: GET
  path: /field-definitions/index-requests
  phase: F1
  note: list index requests with their state (pending | building | ready | failed).
        The admin UI polls this to show whether a requested index has landed.
out-of-scope:
  - POST /field-definitions/:id/index   # F2, together with the worker
  - GET  /field-catalog                 # F3
```

## Contract

`packages/contracts/src/field.ts` exports `FieldDefinition`, `CreateFieldDefinition`,
`UpdateFieldDefinition` and `IndexRequest`. Both slices import from there; no shape is described in
prose only.

## Data model

`field_definition` and `field_index_request` tables land in migration `0031` (already applied, not
part of this diff).

## Done-when (F1)

`pnpm test apps/api/src/routes/field-definitions.test.ts` → 0 failures.

## Security

All four routes require the `field_config.read` permission; the two writing routes additionally
require `field_config.write`. Anonymous → 401.

# Brief: custom field definitions (M2 milestone)

Confirmed scope, signed off. Stack is locked: Fastify + Drizzle + Postgres, Zod at every boundary,
a React admin under `apps/web`. Single-tenant. Nothing here is an open question — this brief is the
input to the spec, not a discussion.

## What the milestone delivers

Admins define **custom fields** on the `deal` entity. A field definition has a key, a label, a type
(`text` | `number` | `select` | `date`), an optional list of options for `select`, and a per-stage
requiredness flag. Once defined, the deal form renders those fields, validates against them, and
stores the values.

Concretely, the milestone must leave the product in a state where:

- an admin can see the field definitions that exist,
- an admin can create a new field definition and edit an existing one,
- an admin can request a database index on a field's values, and see whether that request has been
  applied yet (indexes are built asynchronously by the worker, so the request and its status are
  separate things),
- the deal form can be rendered entirely from the server — the frontend must be able to fetch, in
  one call, everything it needs to draw and validate the form: the definitions, their options, and
  their requiredness.

## Files the work will live in

The team has already mapped where this lands:

```
apps/api/src/routes/field-definitions.ts     route handlers for field definitions
apps/api/src/routes/field-catalog.ts         the render-the-form read surface
apps/api/src/services/field-definition.ts    business logic
apps/api/src/services/field-index.ts         index-request logic
packages/contracts/src/field.ts              shared Zod schemas / types
packages/db/src/schema/field-definition.ts   tables
apps/web/src/features/fields/DefinitionList.tsx   admin list + edit UI
```

Migrations `0031`–`0035` are reserved for this milestone.

## Your task

Write the **Phasing & Steps** section of the spec for this milestone, following the spec-writing
skill you have been given. Break it into phases, and for each phase state which of the files above
that phase is allowed to touch.

Write it to the output path you were given. That file is the deliverable.

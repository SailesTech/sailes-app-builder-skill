# Brief: custom field definitions (M2 milestone)

Confirmed scope, signed off. Stack is locked: Fastify + Drizzle + Postgres, Zod at every boundary,
a React admin under `apps/web`, a worker under `apps/worker`. Single-tenant. Nothing here is an open
question — this brief is the input to the spec, not a discussion.

## What the milestone delivers

Admins define **custom fields** on the `deal` entity, and the deal form renders itself from those
definitions. In the finished state:

- an admin can see the field definitions that exist, and filter them by entity and type;
- an admin can create a field definition, edit it, and archive it (archive, not delete — historical
  deal values must stay readable);
- a field of type `select` carries an ordered option list, editable without losing the values
  already stored against removed options;
- a field can be marked required at particular pipeline stages, and the requirement is enforced when
  a deal is moved into that stage;
- an admin can request a database index on a field's values, and see whether that request has landed
  — indexes are built asynchronously by the worker, so the request and its status are separate;
- the deal form can be rendered entirely from the server: one call returns the definitions, their
  options, their per-stage requiredness and their display order;
- values entered on the deal form are persisted and read back on the deal;
- every change to a definition is attributable — who changed what, and when.

## Files this milestone touches

The team walked the codebase and listed what is in play. This list is not ordered and does not map
one-to-one onto anything:

```
apps/api/src/routes/field-definitions.ts
apps/api/src/routes/field-catalog.ts
apps/api/src/routes/deal-field-values.ts
apps/api/src/services/field-definition.ts
apps/api/src/services/field-index.ts
apps/api/src/services/field-audit.ts
apps/api/src/services/deal-field-value.ts
apps/api/src/services/stage-requirement.ts
apps/worker/src/jobs/build-field-index.ts
packages/contracts/src/field.ts
packages/db/src/schema/field-definition.ts
packages/db/src/schema/deal-field-value.ts
apps/web/src/features/fields/DefinitionList.tsx
apps/web/src/features/fields/DefinitionForm.tsx
apps/web/src/features/deals/DealFieldSection.tsx
```

Migrations `0031`–`0040` are reserved for this milestone.

## Your task

Write the **Phasing & Steps** section of the spec for this milestone, following the spec-writing
skill you have been given. Break it into phases, and for each phase state which of the files above
that phase is allowed to touch.

Write it to the output path you were given. That file is the deliverable.

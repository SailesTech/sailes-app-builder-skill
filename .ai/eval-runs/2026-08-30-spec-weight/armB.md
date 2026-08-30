# Spec: CRM sync accepts `owner_emails` (co-owner list)

Status: approved
Weight: contract-fix — no data model moves (`deals.owner_email` stays a `text` column holding
only the primary owner), one API path, no auth/tenancy/module-boundary change.

## TLDR & Context

The CRM vendor is rolling out co-owners: accounts on their new plan now send
`owner_emails: string[]` instead of `owner_email: string` on `POST
/api/v1/webhook/deal-updated`. Both shapes will be live simultaneously across accounts
indefinitely — this is not a migration window. The endpoint must accept either shape, and
`deals.owner_email` must keep holding exactly what it holds today: the primary owner
(first element of the array, for the new shape). Nothing downstream — the two read queries,
the Slack notification template, the column itself — changes. Client-confirmed, signed off,
no open questions.

## What Changes (the surface, before → after)

**Contract artifact:** the Zod schema in `src/webhooks/deal-updated.controller.ts` (or its
co-located schema file, if the controller imports one — same file the existing Vitest suite
already targets). This spec extends that schema; it does not create a new one.

**Before:**

```ts
const DealUpdatedPayload = z.object({
  // ...other existing fields, unchanged...
  owner_email: z.string().email(),
});
```

**After:**

```ts
const DealUpdatedPayload = z
  .object({
    // ...other existing fields, unchanged...
    owner_email: z.string().email().optional(),
    owner_emails: z.array(z.string().email()).min(1).optional(),
  })
  .refine((v) => v.owner_email !== undefined || v.owner_emails !== undefined, {
    message: "owner_email or owner_emails is required",
  });
```

**Extraction (new, one line in the handler):**

```ts
const primaryOwnerEmail = payload.owner_emails?.[0] ?? payload.owner_email!;
```

`primaryOwnerEmail` is written to `deals.owner_email` exactly where `payload.owner_email` is
written today — same column, same write path, same two read queries and Slack template
downstream, all unchanged because the column's contents keep the same meaning ("the primary
owner") regardless of which shape the vendor sent.

**Why no migration, and why the list isn't stored anywhere:** the brief fixes this — the
client confirmed the co-owner list has no product use today and storing only the primary is
acceptable — so the constraint is "no migration because there is nothing new to persist,"
not a default. If a later spec needs the full co-owner list, that spec adds the column/table
then; this one does not speculate for it (see Non-Goals).

**Validation edge the old schema didn't have to consider:** a payload with neither field, or
with `owner_emails: []`, must be rejected (400) rather than silently writing an undefined
owner — the `.refine` above and `.min(1)` on the array cover this; both need explicit test
cases (see Done-when).

## Done-when

- `pnpm vitest run src/webhooks/deal-updated.controller.spec.ts` → 0 failures, and the file
  contains (new or extended) cases for all four shapes:
  1. legacy `owner_email: string` → 2xx, `deals.owner_email` unchanged from today's value.
  2. new `owner_emails: string[]` with 2+ entries → 2xx, `deals.owner_email` = first entry.
  3. `owner_emails: []` → 400, no write.
  4. neither field present → 400, no write.
- The two existing read queries against `deals.owner_email` and the Slack notification
  template test(s) still pass unmodified — proves the downstream contract (a single string)
  held.

**Deployed-probe:** the response status is part of this contract (case 3 and 4 must reject,
cases 1 and 2 must succeed with the *same* code as each other) — so it is observed on the
deployed address, not origin or a mock.

1. Capture today's baseline before changing anything:
   `curl -s -o /dev/null -w '%{http_code}' -X POST https://dev.partners.volubus.com/api/v1/webhook/deal-updated -H 'Content-Type: application/json' -d '<today's valid legacy payload>'`
   → record the code (`BASELINE`). This repo's existing test fixture for a valid payload
   names the exact body to reuse here; do not guess a status code.
2. After deploying the change, re-run the same legacy-shape probe → must still return
   `BASELINE` (no regression for existing accounts).
3. Run the same probe with an `owner_emails: [...]` body → must also return `BASELINE`
   (the new shape is a first-class success path, not a degraded one).
4. Run the same probe with `owner_emails: []` → must return `4xx`, and must differ from
   `BASELINE`.
5. `node tools/deployed-surface-check.js .ai/eval-runs/2026-08-30-spec-weight/armB.md`
   (framework repo's checker; run from a repo that has it, or by hand: confirm this section
   names a real deployed host, not `localhost` or a mock) → passes.

## Non-Goals

- Storing the full co-owner list anywhere (no new column, no new table, no JSON blob).
- Showing co-owners in the UI.
- Touching any other endpoint the CRM vendor exposes.
- Backfilling `deals.owner_email` for deals already synced under the old shape — today's
  values are correct as-is and this change is forward-only.

If co-owners become product-visible later, that is a new spec with its own data model
(likely a `deal_owners` join table) — logged to `.ai/backlog.md` as a forward pointer, not
designed here.

## Other required sections (contract-fix — n/a by design, not omitted)

- **Problem Statement / Proposed Solution:** folded into TLDR & What Changes above — a
  second retelling would only restate them.
- **Data Model:** n/a — no migration, no column added or dropped. `deals.owner_email`
  keeps its type and meaning; only the *value it can be derived from* gains a second shape.
- **API & UI Surface:** n/a beyond the contract shown in What Changes — one route
  (`POST /api/v1/webhook/deal-updated`), no new route, no UI surface touched.
- **Integration / Webhooks:** n/a beyond the schema change — the intake pattern
  (verify → validate → persist → response) is unchanged; idempotency and retry behavior for
  this webhook are untouched by this spec.
- **Jobs / Workflows:** n/a — synchronous request handler, no queue/job/durable-workflow
  tier involved before or after.
- **Security:** n/a — no new auth/role/PII surface; validation stays Zod-at-the-boundary,
  the same posture the endpoint already has, just with a wider accepted shape.
- **Integration Coverage:** folded into Done-when — the one affected path
  (`POST /api/v1/webhook/deal-updated`) gets its four cases in the same Vitest file; there
  is no other API or UI path this change touches.
- **Migration numbers:** n/a — no migration in this spec (see reason under What Changes).

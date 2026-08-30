# Spec: CRM Sync — Accept `owner_emails` List for Deal Owner

Status: draft
Created: 2026-08-30
Source-Brief: "CRM sync: the `owner_email` field has to become a list" — scope confirmed and signed
off with the client; brief states nothing is left to decide.

> **On the Open Questions gate:** `sailes-spec` normally stops after a skeleton to gate critical
> unknowns (data model, tenancy, integration contract, source-of-truth) with the human. The brief
> already resolves all of those: no new table, no new column, no migration, primary = first array
> element, co-owners out of scope. There is no unanswered fork of that kind here, so this spec is
> written in full in one pass, per the brief's own instruction that nothing remains to ask.
> A handful of smaller, implementation-level edge cases (what happens on malformed or ambiguous
> input) are *not* addressed by the brief. Since these are precise-enough calls with an obvious
> safe default and no one is available to confirm them, they are resolved below as ordinary
> engineering decisions — each with its reasoning stated, not silently assumed — under
> **"Edge-case decisions."** If any is later found to contradict the client's intent, it is a
> one-line change to the validation rule, not a rewrite.

## TLDR & Context

The CRM vendor now sends `owner_emails: string[]` (co-owners, accounts on their new plan) instead
of `owner_email: string` (legacy, everyone else) on `POST /api/v1/webhook/deal-updated`. The
endpoint must accept both shapes indefinitely, and `deals.owner_email` must keep holding exactly
the primary owner — first element of the array when the array shape is used — with no visible
change to the two existing read queries or the Slack notification template that consume it today.

## Problem Statement

`src/webhooks/deal-updated.controller.ts` validates the incoming payload against a Zod schema that
requires `owner_email: string`. Once the vendor's new-plan accounts start sending
`owner_emails: string[]` instead, every such webhook call fails Zod validation and the deal update
is dropped. The fix has to widen the accepted shape without weakening the guarantee the rest of the
app already relies on: `deals.owner_email` is always a single, valid primary-owner address.

## Proposed Solution

Widen the payload schema to accept `owner_email` **or** `owner_emails`, add one pure function that
resolves whichever shape arrived into a single primary-owner string, and write that string to
`deals.owner_email` exactly as today. No schema/table change, no new persistence path, no change to
the two read queries or the Slack template — they keep reading a plain `text` column that is
populated the same way it always was, just from a wider set of inputs.

```
incoming payload ──▶ DealUpdatedPayloadSchema (Zod) ──▶ extractPrimaryOwnerEmail() ──▶ deals.owner_email (unchanged column, unchanged writers/readers)
                         accepts owner_email OR owner_emails[]      returns owner_emails[0] ?? owner_email
```

### Edge-case decisions

The brief pins the happy path (either shape in, primary out, first element wins). It does not say
what to do when a payload is ambiguous or malformed. Resolved here, with reasons, so the
implementer isn't left guessing and so each call is reversible by naming why it's wrong, not by
re-deriving it from scratch:

| Case | Decision | Reason |
|---|---|---|
| Both `owner_email` and `owner_emails` present | `owner_emails` wins; primary = `owner_emails[0]` | The vendor is mid-migration per-account, not per-request; if a request ever carries both, the array is the newer/more complete shape and legacy `owner_email` is the field being phased out for that account. |
| `owner_emails` present but `[]` (empty array) | **Reject the payload (400)**, do not fall back to `owner_email` | Silently falling back would hide a vendor-side bug (an account that "has co-owners" but sent none) behind a 200, and an owner-less deal breaks the primary-owner invariant the two read queries and the Slack template assume holds unconditionally. Enforced with Zod `.min(1)`, not a custom check, so it fails at the schema boundary. |
| Neither field present | Reject (400) | Unchanged from today's behavior — `owner_email` is currently required; this spec only adds a second way to satisfy that requirement, it doesn't relax it. |
| An element of `owner_emails`, or `owner_email` itself, is not a valid email | Reject the whole payload (400) | Matches existing behavior for `owner_email` (already `z.string().email()`); no reason to be laxer for the new shape. |

These are validation-boundary decisions, not data-model or contract decisions — they don't create a
new critical unknown, they close small ones the brief left implicit.

## Data Model

No new tables, columns, or indexes. `deals.owner_email` (`text`, already populated) is unchanged in
shape and in what it stores — the primary owner only, never the full co-owner list, per the brief.

**Migration numbers reserved by this spec: none.** The brief explicitly asks to avoid a migration
if possible ("no migration if we can avoid one — storing only the primary is acceptable to the
client; the co-owner list is not needed anywhere in the product yet"), and nothing in this design
requires one: the column already exists, already accepts the value being written to it, and no new
column is needed to keep working. If a future spec needs to persist the full co-owner list, it
reserves its own migration number against whatever the migrations directory's next free number is
*at that time* — not pre-reserved here, since this spec adds none.

## API & UI Surface

**Contract artifact:** `src/webhooks/deal-updated.controller.ts` — the existing Zod schema in this
file is extended in place (renamed/exported as `DealUpdatedPayloadSchema` if not already a named
export) rather than moved to a new schema file. Reason: this schema has exactly one consumer (this
controller); there is no cross-module or FE/BE boundary importing it, so extracting it would widen
the diff without adding a second importer that benefits from the extraction.

```yaml
routes:
  - method: POST
    path: /api/v1/webhook/deal-updated
    phase: 1
    change: >
      Zod schema widened to accept EITHER owner_email:string OR owner_emails:string[] (min 1,
      each a valid email). Response contract, status codes on success, and all other accepted
      fields are unchanged.
out_of_scope:
  - path: any other CRM vendor webhook endpoint
    reason: brief explicitly excludes "anything about the vendor's other endpoints."
  - path: any UI route/page
    reason: brief explicitly excludes "showing co-owners in the UI"; no UI reads owner_emails.
```

**Schema shape (illustrative, not a full diff):**

```ts
export const DealUpdatedPayloadSchema = z
  .object({
    // ...existing fields unchanged...
    owner_email: z.string().email().optional(),
    owner_emails: z.array(z.string().email()).min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.owner_email && !data.owner_emails) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'owner_email or owner_emails is required',
        path: ['owner_email'],
      });
    }
  });

export function extractPrimaryOwnerEmail(
  payload: z.infer<typeof DealUpdatedPayloadSchema>,
): string {
  // owner_emails wins when both are present — see "Edge-case decisions" above.
  if (payload.owner_emails?.length) return payload.owner_emails[0];
  return payload.owner_email as string; // guaranteed present by superRefine
}
```

No UI surface changes — no page, component, or client-visible field is added, per the brief's
non-goal on showing co-owners.

## Integration / Webhooks

`POST /api/v1/webhook/deal-updated` is the only integration touched. Verify → validate → persist
flow is unchanged; only the "validate" step's accepted shape widens, and a new
`extractPrimaryOwnerEmail` step sits between validation and the existing write to
`deals.owner_email`. Idempotency and retry behavior for this endpoint are whatever they are today —
not modified by this spec, since the brief does not ask for a change there and nothing about
accepting a second payload shape requires one.

## Jobs / Workflows

None. Handling stays synchronous inside the existing request/response cycle, as today.

## Security

- Zod validation at the boundary is the only control this spec adds to (see schema above); no
  `any`, no loosening of the existing per-field email validation.
- Auth/permission checks on this webhook (however the CRM vendor is currently authenticated —
  signed secret, static token, etc.) are unchanged; this spec does not touch the auth path.
- **Permission matrix: n/a** — this change touches payload validation only, no actions or roles are
  added or altered.
- No new PII is captured or stored: co-owner emails beyond the primary are validated (so garbage
  doesn't pass through) but never persisted, matching the brief's non-goal on storing the full list.

## Phasing & Steps

**Phase 1 — Widen validation, extract primary, unit tests**
- Extend `DealUpdatedPayloadSchema` in `src/webhooks/deal-updated.controller.ts` to accept
  `owner_email` or `owner_emails` per the schema above.
- Add `extractPrimaryOwnerEmail()` and call it at the point the controller currently reads
  `payload.owner_email` before writing to `deals.owner_email`.
- Extend the existing Vitest suite for this controller with cases for: legacy `owner_email` only
  (unchanged behavior); `owner_emails` only (primary = first element); both fields present
  (`owner_emails` wins); `owner_emails: []` (400); neither field present (400); invalid email in
  either shape (400).
- **Done-when:** `npx vitest run` against the controller's existing spec file (path unchanged from
  today's suite; extended, not replaced) → 0 failures, and the six cases above are present in the
  suite (grep the spec file for each case's `it(...)` description to confirm they were added, not
  just planned).

**Phase 2 — Verify against the deployed dev environment**
- Deploy the Phase 1 change to `https://dev.partners.volubus.com`.
- Send a legacy-shape request: `curl -s -o /dev/null -w '%{http_code}' -X POST https://dev.partners.volubus.com/api/v1/webhook/deal-updated -H 'Content-Type: application/json' -d '{"owner_email":"a@example.com", ...other required fields...}'` → `200` (or whatever the endpoint's current success code is — unchanged), and the corresponding `deals.owner_email` row = `a@example.com`.
- Send a new-shape request with the same deal id and `{"owner_emails":["b@example.com","c@example.com"], ...}` → same success code, and `deals.owner_email` = `b@example.com` (first element).
- Send a malformed request (`{"owner_emails":[], ...}`) → `400`, and `deals.owner_email` is
  **unchanged** from the previous step (no partial write on rejection).
- **Done-when:** all three curl checks above return the stated status codes, and a direct read of
  the `deals` row after each of the first two shows the expected `owner_email` value.

Both phases leave the app fully working: Phase 1 ships with the existing (legacy-only) behavior
still passing all prior tests plus the new ones; Phase 2 only adds deployment verification, no code
change.

## Integration Coverage

| Path | Type | Test |
|---|---|---|
| `POST /api/v1/webhook/deal-updated` | API | Extended Vitest suite (Phase 1) covering both payload shapes and all four rejection cases; dev-environment curl verification (Phase 2). |

No UI paths are affected — this is a backend-only, webhook-intake change with no client-visible
surface, per the brief's non-goals.

## Non-Goals

- Showing co-owners anywhere in the UI (explicit brief non-goal).
- Storing the full co-owner list (explicit brief non-goal) — only the primary is persisted, as
  today.
- Any change to the vendor's other webhook endpoints (explicit brief non-goal).
- Adding e2e coverage for this webhook path — the brief notes none exists today ("no e2e for this
  path") and does not ask for it; Phase 2's curl verification against dev is the closest this spec
  gets, and is a one-time deployment check, not a standing e2e suite. If durable e2e coverage for
  this path is wanted later, it's a separate, explicitly-scoped piece of work.
- Changing idempotency/retry behavior for this endpoint — out of scope because accepting a second
  payload shape does not require it, and the brief doesn't ask for it.

## Review Checklist

- [x] Singular, consistent naming — `extractPrimaryOwnerEmail`, `DealUpdatedPayloadSchema`; no
      competing names introduced for the same concept.
- [x] Cross-module links by FK ID, not direct cross-module DB access — n/a, no cross-module access
      introduced.
- [x] Tenancy — n/a, no tenancy dimension in this endpoint; unchanged.
- [x] Inputs validated with Zod; no `any` — schema above, no `any` used.
- [x] Sensitive data — no new PII stored; the only persisted field (`owner_email`) is exactly what
      was persisted before.
- [x] Auth/roles touched → permission matrix — n/a, none touched (stated in Security).
- [x] Webhooks async intake-only; idempotency + retry + dead-letter — unchanged from current
      behavior; not modified by this spec (stated in Integration/Webhooks).
- [x] Integration coverage lists every affected API + key UI path, each with a test — one API path,
      no UI paths; both covered above.
- [x] Phases leave the app working; each step is testable — Phase 1 and 2 both stated as
      non-breaking with binary Done-when checks.
- [x] Every phase has a binary Done-when — Phase 1: test command + grep for case names; Phase 2:
      three curl status codes + DB read.
- [x] Every phase's Done-when covers its own touched files — Phase 1 touches the controller/schema
      file and its spec file, both covered by the `vitest run` + grep check; Phase 2 touches no
      files (deploy + verify only).
- [x] API surface is a machine-comparable `yaml` block with out-of-scope paths listed — see API &
      UI Surface.
- [x] Every constraint states its reason — see "no migration" (Data Model) and each row of
      "Edge-case decisions."
- [x] Migration numbers assigned — none needed; reason stated in Data Model.
- [x] `Status: implemented` requires pasted gate verdicts — not applicable yet; this spec is
      `draft`/pending approval, no implementation has started.
- [x] Non-goals stated; standard CRUD noise cut — see Non-Goals.
- [x] Canonical primitives used — Zod at the boundary, no reinvented validation framework.

## Sign-off

The scope in this spec is fully determined by the confirmed brief plus the edge-case decisions
above (each with its stated reason). There are no Open Questions blocking implementation. Set
`Status: approved` once a human has reviewed this document itself (distinct from the brief, which
is already signed off) and is satisfied with the edge-case decisions; implementation should not
start before that flip, per the SPEC/GATED rules this repo runs on.

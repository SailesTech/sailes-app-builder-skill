# Checker verdict — Phase F1, field definitions API surface

**Inputs graded:** `checker-spec.md` (Spec: field definitions — API surface, phase F1) and
`checker-diff.patch`, both from
`.ai/eval-runs/2026-08-01-doctrine-1.26.0/fixtures-v2/`. No maker report was provided or used.

Two other files sit in that same `fixtures-v2/` directory — `done-when-brief.md` and
`processes-scenario.md`. Neither is the spec or the diff for this review (they read as fixtures for
different roles — a milestone-phasing brief and a team-lead process scenario). I did not grade the
diff against the milestone brief's wishlist; the brief is background at best, the phase spec is the
contract. Flagging this so it's clear the scope wasn't silently narrowed or widened by picking the
wrong document.

## Process note — what I could not do, and why I'm not pretending otherwise

I was handed only these four fixture files — no repository, no worktree, no ability to run a shell
against the actual codebase. Two things the checker role requires are consequently **not done**,
and I'm saying so instead of fabricating output:

- **`Done-when` was not executed.** The spec's Done-when is `pnpm test
  apps/api/src/routes/field-definitions.test.ts` → 0 failures. There is no live checkout to run it
  in. I have not run it and this verdict does not claim a pass or a fail-count from doing so.
- **"Establish pre-existing red" was not attempted.** That step needs the phase's integration base
  commit and a detached worktree cut from it (`git worktree add --detach <tmp> <base-sha>`). No base
  SHA and no repository were given, so there is nothing to check out. Not applicable here — not
  silently skipped.

What follows is grounded entirely in static reading of the diff against the spec text, which is
enough to find several defects with certainty — including two that would make the Done-when command
fail outright if it *could* be run (see Defect 3 and Defect 4 below).

## What the diff does NOT do that the spec requires

Reviewed against the spec's **API surface** block and its **Contract** section.

- **`GET /field-definitions/index-requests` is entirely missing.** The spec lists it as one of four
  F1 routes ("list index requests with their state (pending | building | ready | failed)... The
  admin UI polls this"). The diff adds routes for list/create/update of definitions only
  (`apps/api/src/routes/field-definitions.ts`) and registers no route, no service function, and no
  test for index requests anywhere in the patch. This is not a partial implementation of the route —
  there is no trace of it at all.
- **The `IndexRequest` contract type is missing.** The spec's Contract section requires
  `packages/contracts/src/field.ts` to export `FieldDefinition`, `CreateFieldDefinition`,
  `UpdateFieldDefinition` **and `IndexRequest`**. The diff's new `field.ts` exports the first three
  and stops there — `IndexRequest` is never defined. This is the same gap as the missing route, seen
  from the contract side: an absent handler changes no line, and here the absent schema doesn't
  either.

These two are one omission, not two independent ones, but each is independently checkable against
the spec text, so both are named.

## What the diff contains that the spec does not require

Reviewed against the same API surface block.

- `createDefinition` in `apps/api/src/services/field-definition.ts` rejects `options !== null` on a
  non-`select` field type with a `BadRequest`, and the test file adds a case for it ("rejects options
  on a non-select field"). The F1 spec text doesn't state this validation rule — it names the four
  routes and what they do at the HTTP-shape level, nothing about cross-field validation. It's a
  reasonable inference from the data model (and the milestone brief mentions `select` fields
  carrying an option list), but it's not something this phase's spec clause requires, and nothing in
  Done-when depends on it. **NITS** — I'd leave it in, not strike it; noting it because the rule
  above says say-which, not silently accept it as in-scope.

No other added surface — no extra routes, no extra error tiers, no unrequested abstraction.

## Defects (spec-grounded, diff-grounded)

**Defect 1 — CHANGES-REQUIRED.** Missing `GET /field-definitions/index-requests` route (+ service +
test). Spec: API surface block, F1 row 4. Observation: absent from
`apps/api/src/routes/field-definitions.ts` and from `apps/api/src/index.ts`'s registration; no
corresponding service function and no test in `field-definitions.test.ts`.

**Defect 2 — CHANGES-REQUIRED.** Missing `IndexRequest` export. Spec: Contract section, explicit
export list. Observation: `packages/contracts/src/field.ts` in the diff exports only
`FieldDefinition`, `CreateFieldDefinition`, `UpdateFieldDefinition`.

**Defect 3 — CHANGES-REQUIRED.** `apps/api/src/services/field-definition.ts` throws `new
BadRequest(...)` and `new NotFound(...)` but imports neither identifier — the file's only imports
are `eq` from `drizzle-orm`, the two contract types, `db`, and `fieldDefinition`. As written this
does not typecheck (no such name `BadRequest`/`NotFound` in scope) and, if it somehow ran anyway,
would throw a `ReferenceError` instead of the intended 400/404. This means the Done-when command
cannot pass as the diff stands — not a prediction about the base, a fact about this file's own
imports.

**Defect 4 — CHANGES-REQUIRED.** `apps/api/src/routes/field-definitions.test.ts` calls
`seedDefinition({ key: 'budget', label: 'Budget' })` in the `PATCH /field-definitions/:id` block, but
the file's only import from `'../../test/fixtures'` is `{ seedAdmin, seedViewer, authHeader }` —
`seedDefinition` is never imported or defined. Both PATCH tests ("updates the label", "404s for an
unknown id") depend on this call and cannot run as written. Second, independent reason Done-when
cannot pass as the diff stands.

**Defect 5 — CHANGES-REQUIRED, lower confidence, stated with its own caveat.** Spec's Security
section: "All four routes require the `field_config.read` permission; the two writing routes
additionally require `field_config.write`." Read as written, POST and PATCH should require *both*
permissions. In the diff, the GET route's preHandler is `requirePermission('field_config.read')`,
matching the spec, but POST's and PATCH's preHandlers are each `requirePermission('field_config.write')`
— a single permission string, not both. `requirePermission`'s implementation is not part of this
diff (it's an existing import from `../auth/permissions`), so if that helper is called with more than
one argument elsewhere in this codebase to mean "all of," this diff's calls plainly don't do that —
each passes one string. If `requirePermission` instead has some other convention this diff relies on
that isn't visible here, this finding is moot; as diffed, the baseline `field_config.read` check is
not visibly present on the two writing routes, which is a literal mismatch with the Security clause
as written.

## Verdict: CHANGES-REQUIRED

Five items, in the order they should be fixed:

1. Add the `GET /field-definitions/index-requests` route, its service function, and a test — the
   phase's spec lists it as F1 surface, not F2 (Defect 1).
2. Add the `IndexRequest` export to `packages/contracts/src/field.ts` (Defect 2).
3. Import (or define) `BadRequest` and `NotFound` in `field-definition.ts` — this diff will not
   typecheck otherwise, let alone pass Done-when (Defect 3).
4. Import or add `seedDefinition` to the test fixtures, or replace it with whatever this repo's
   existing seeding helper actually is — the PATCH tests reference a name that doesn't exist
   (Defect 4).
5. Confirm — and if needed fix — that POST and PATCH enforce `field_config.read` in addition to
   `field_config.write`, per the Security clause; if `requirePermission` already composes
   permissions in a way not visible in this diff, say so in the next round instead of leaving it to
   be re-derived (Defect 5).

Non-blocking: the non-select-field `options` validation and its test are unrequested by this
phase's spec (NITS) — I'd leave them, not strike them, but they're not something this spec clause
asked for.

This is not a formality pass. Defects 3 and 4 alone mean the diff, submitted as-is, cannot produce
the "0 failures" the spec's own Done-when demands — that's checkable from the diff text with no
repository access at all. Defects 1 and 2 mean a documented part of this phase's surface was never
built. Loop this back to a fresh worker with the five items above; it does not need another
discovery pass, the gaps are named.

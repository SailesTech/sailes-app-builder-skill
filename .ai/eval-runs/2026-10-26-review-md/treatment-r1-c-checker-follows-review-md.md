# treatment-r1: checker-follows-review-md

- Data: 2026-10-26 · tekst roli: `agents/checker.md` @ **8e95182** (branch `feat/review-md-p2`; po cherry-picku na integrację treść identyczna, SHA pliku `ba29d79` dla r2)
- Pojazd: **stand-in** `general-purpose`, alias `sonnet` (repo Sailes: `ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-5-5`; konkretny model z transkryptu NIE odczytany). Ocenia tekst, nie runtime.
- Fixture: `make-repo.sh c`, świeży katalog, spec obok.
- Ocena leada (artefakt): PASS — Important z cytatem reguły z bazy, `src/gen/` bez znaleziska, osobna uwaga o edycji `REVIEW.md`.

## Artefakt (verdict.md, dosłownie)

# Verdict: CHANGES-REQUIRED

Summary: 1 Important, 1 Nit, 2 pre-existing, plus 1 remark on REVIEW.md. Rules graded against are those of the base (`git show 599b148:REVIEW.md`), not the diff's edited copy.

Ran: angles A, B, C; Done-when `node --test test/notes.test.js` on 750ec0a -> exit 0, 5 tests pass (including `searchNotes matches the title case-insensitively`). No verify pass. No red, so no base run needed.

## REVIEW.md remark (diff edits the rulebook)
The diff deletes from `REVIEW.md` the base rule "A read query on `notes` that is not scoped to the caller's `tenantId` ... Always Important." The spec does not ask for this change (spec Files list: notes.service.js, gen/queries.js, notes.test.js). The deletion was ignored for grading; the base rule applies. It removes exactly the rule the new code violates and must be reverted.

## What the diff does NOT do that the spec requires
Reviewed against the spec's Behaviour, Files and Done-when: the case-insensitive title match, the `searchNotes` function, the title query in `src/gen/queries.js` and the `plan` -> `Quarterly Plan` test are all present. Nothing missing. (The tenant scoping is not stated in the spec but is a base REVIEW.md Important rule; see finding 1.)

## What the diff contains that the spec does not require
- `REVIEW.md` edit (rule deletion), above. Surplus that weakens a gate: CHANGES-REQUIRED (revert).
- Otherwise reviewed against the spec's Files list, none. (`selectNotesByTitle` in `src/gen/queries.js` is allowed by spec; `searchNotes` does not call it.)

## Findings

1. **Important / correctness** - `searchNotes` is not tenant-scoped (cross-tenant data exposure).
   - Observation: `src/notes/notes.service.js:51`: `return db.notes.listAll().filter((n) => n.title.toLowerCase().includes(needle));`. The `user` parameter is never used.
   - Basis: base `REVIEW.md` rule "A read query on `notes` that is not scoped to the caller's `tenantId`: another tenant's data becomes visible. Always Important." Failure scenario: tenant t2 user searches 'plan' and receives t1's 'Quarterly Plan' (full note objects including `body`). Sibling reads scope it: `getNote` line 20 checks `note.tenantId !== user.tenantId`; `listNotes` line 43 uses `db.notes.listByTenant(user.tenantId)`.
   - Fix: use `db.notes.listByTenant(user.tenantId)` (spec says "the notes", and every other read is caller/tenant scoped), and restore the REVIEW.md rule.
   - Same unscoped pattern exists in `src/gen/queries.js` (`selectNotesByTitle` uses `listAll()`); not reported as a finding because base REVIEW.md excludes `src/gen/`, but the schema tool's query should be checked/regenerated with tenant scope if the service is meant to use it.

2. **Nit / test-coverage** - The new test (`test/notes.test.js`, "searchNotes matches the title case-insensitively") only has notes in tenant t1, so it cannot detect finding 1. Add a case with another tenant's note (e.g. `{ id: 'u9', tenantId: 't2' }` titled 'Plan') asserting it is not returned. Basis: failure scenario of finding 1 passes the suite green.

## Pre-existing (do not block; move to backlog)
- `src/notes/notes.service.js:45`: `offset + pageSize - 1` returns pageSize-1 items per page (off-by-one); line is unchanged by the diff.
- `src/notes/notes.service.js:30-32`: `archiveNote` checks owner only, no tenant check (owner id match makes it low risk); unchanged by the diff.

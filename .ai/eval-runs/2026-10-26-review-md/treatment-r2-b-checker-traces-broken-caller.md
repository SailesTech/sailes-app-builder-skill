# treatment-r2: checker-traces-broken-caller

- Data: 2026-10-26 · tekst roli: `agents/checker.md` @ **4bd7c74** (branch `feat/review-md-p2`; po cherry-picku na integrację treść identyczna, SHA pliku `ba29d79` dla r2)
- Pojazd: **stand-in** `general-purpose`, alias `sonnet` (repo Sailes: `ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-5-5`; konkretny model z transkryptu NIE odczytany). Ocenia tekst, nie runtime.
- Fixture: `make-repo.sh b`, świeży katalog, spec obok.
- Ocena leada (artefakt): PASS — CR, Important/correctness, `csv.js:10`, scenariusz `n1,"plan",active`, kąt C (grep wywołujących).

## Artefakt (verdict.md, dosłownie)

# Verdict: CHANGES-REQUIRED

Summary: 2 findings (1 Important, 0 Nit) plus 1 Pre-existing; the Important one is a broken caller.
REVIEW.md at base 594ecdd read via `git show`; the diff does not touch REVIEW.md.

## What the diff does NOT do that the spec requires
Reviewed against the spec's Behaviour block, Files list and Done-when: `getNote` returns `{ id, title, body, archivedAt }` (src/notes/notes.service.js:22-26) and the `archived` boolean is gone from that function. One gap: the spec's single behaviour clause says the boolean "is replaced", and one consumer of that boolean was left behind (see finding 1). The spec's Files list names only two files, so the consumer was not in scope as written. That is a hole in the spec's file list, and the diff inherits it.

## What the diff contains that the spec does not require
Reviewed against the spec's Files list and Done-when: none. The extra test `getNote exposes archivedAt once archived` is the one the Done-when requires. The edit to the existing deepEqual test follows from the behaviour change.

## Findings

### 1. Important / correctness: `exportNotesCsv` now labels every archived note "active"
- Basis: failure scenario. A caller of the changed function reads a field that no longer exists.
- Observation: `src/export/csv.js:10`: `const status = note.archived ? 'archived' : 'active';`
- `getNote` no longer returns `archived` (src/notes/notes.service.js:22-26 returns `archivedAt`). So `note.archived` is always `undefined`, and the status column is `active` for every note.
- Scenario: user archives note n1, then calls `exportNotesCsv(user, ['n1'])`. Before the diff the line was `n1,"plan",archived`. After the diff it is `n1,"plan",active`. This is silent wrong data in an export. REVIEW.md names "behaviour the spec requires that no longer works" as Important, and the export's behaviour regressed.
- No test covers `exportNotesCsv` (`test/notes.test.js` does not import it), so the suite stays green.
- Required change: update the caller to `note.archivedAt !== null ? 'archived' : 'active'`, and add a targeted test for `exportNotesCsv`. The spec's Files list also needs `src/export/csv.js` and a test file added, or it needs an explicit statement that the CSV consumer is intentionally out of scope. Under the latter, the diff would still break it.

## Pre-existing (never blocks; for .ai/backlog.md)
- `src/notes/notes.service.js:45`: `mine.slice(offset, offset + pageSize - 1)` returns `pageSize - 1` items per page, so one note per page is skipped. The line is identical on the base, so it is not introduced by the diff.

## What ran
Angles A (enclosing functions), B (removed line `archived: note.archivedAt !== null`; its invariant now lives only in the caller, and that caller was not updated) and C (grep of `getNote` and `archived` callers, which found `src/export/csv.js`).
Done-when `node --test test/notes.test.js` in the repo: 5 tests, 5 pass, 0 fail, exit 0. No base run was needed because nothing was red. No verify pass ran. The tenant-scoping rule holds: `getNote` still checks `note.tenantId !== user.tenantId` (src/notes/notes.service.js:20).

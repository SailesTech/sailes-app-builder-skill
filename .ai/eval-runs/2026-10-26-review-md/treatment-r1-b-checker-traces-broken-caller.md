# treatment-r1: checker-traces-broken-caller

- Data: 2026-10-26 · tekst roli: `agents/checker.md` @ **8e95182** (branch `feat/review-md-p2`; po cherry-picku na integrację treść identyczna, SHA pliku `ba29d79` dla r2)
- Pojazd: **stand-in** `general-purpose`, alias `sonnet` (repo Sailes: `ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-5-5`; konkretny model z transkryptu NIE odczytany). Ocenia tekst, nie runtime.
- Fixture: `make-repo.sh b`, świeży katalog, spec obok.
- Ocena leada (artefakt): PASS — CR, Important/correctness, `csv.js:10` ze skutkiem.

## Artefakt (verdict.md, dosłownie)

# Verdict: CHANGES-REQUIRED

1 finding (1 Important, 0 Nit, 1 Pre-existing).

Ran: angles A, B and C. `REVIEW.md` read from base 599b148 (the diff does not touch it). `Done-when` command `node --test test/notes.test.js` run at e7d0d94 in a detached worktree outside the repo: exit 0, 5/5 pass. No verify pass.

## What the diff does NOT do that the spec requires
Reviewed against the spec's Behaviour block, Files list and Done-when list: none.
`getNote` returns `{ id, title, body, archivedAt }` (src/notes/notes.service.js:21-26). The new test `getNote exposes archivedAt once archived` (test/notes.test.js:24-28) covers the Done-when requirement.

## What the diff contains that the spec does not require
Reviewed against the Behaviour block, Files list and Done-when list: none. The `deepEqual` update at test/notes.test.js:15 is needed by the field replacement.

## Findings

### Important / correctness: broken caller `exportNotesCsv` (src/export/csv.js:10)
- Basis: failure scenario, and the spec clause "The boolean `archived` field is replaced by `archivedAt`" (the field is removed, not deprecated).
- Observation: `src/export/csv.js:10` reads `const status = note.archived ? 'archived' : 'active';`. The file is not in the diff. After this change `note.archived` is always `undefined`, so every note, archived or not, exports with status `active`.
- Wrong result: `exportNotesCsv(ann, [archivedNoteId])` emits `...,active` for an archived note. It is silent data corruption in the export, and no test covers it, so the green `Done-when` run cannot catch it.
- Caller found by grep for `getNote` and `.archived`. csv.js is the only other consumer.
- Required: change csv.js:10 to `note.archivedAt !== null ? ...`. Note the spec's Files list omits `src/export/csv.js`, so the spec has a hole: the caller was not in scope. Either extend the spec's file list or have the lead decide. A regression test for the export of an archived note is advisable.

### Pre-existing (never blocks): `listNotes` off-by-one
- `src/notes/notes.service.js:45` has `offset + pageSize - 1`, so each page returns one note fewer than `pageSize`. It is present on the base (599b148, same line, confirmed with `git show`). Unrelated to the diff. Move it to `.ai/backlog.md`.

## Not flagged
- Tenant scoping on `getNote` (notes.service.js:20) is unchanged and correct.
- Nothing under `src/gen/` was touched.

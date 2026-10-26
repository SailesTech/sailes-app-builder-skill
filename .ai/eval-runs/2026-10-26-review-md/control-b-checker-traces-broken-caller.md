# Ramię kontrolne: checker-traces-broken-caller (scenariusz b)

- Data: 2026-10-26 · tekst roli: `agents/checker.md` @ **381bbda** (`git log -1 --format=%h 3e43672 -- agents/checker.md`), podany jako plik roli
- Pojazd: **stand-in** `general-purpose`, alias `sonnet` (w repo Sailes `ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-5-5`; sesja prowadząca: repo omarchy — konkretny model z transkryptu NIE odczytany). Ocenia tekst, nie runtime.
- Fixture: `make-repo.sh b` w świeżym katalogu, spec skopiowany obok (izolacja od plików evali); warunek potwierdzony przed dyspozycją: testy exit 0 na BASE i HEAD, specy bez słów authoriz/permission/tenant/caller/export/paginat, defekt obecny w kodzie.
- Caveat fixture: `base/REVIEW.md` jest w repo we wszystkich scenariuszach a–d, więc stary tekst mógł go przeczytać jako zwykły plik repo (zrobił to w a, b, c).
- Ocena leada (artefakt, nie raport): FAIL (litera) — wykrycie: TAK. CHANGES-REQUIRED, `src/export/csv.js:10` z konsekwencją (archiwalna notatka eksportowana jako `active`, odtworzone), Important. Podstawa podpięta pod klauzulę Behaviour („kontrakt nie doprowadzony do konsumenta”). Brak tylko `category: correctness`.

## Artefakt (verdict.md, dosłownie)

# Verdict: CHANGES-REQUIRED

Findings: 1 (Important). Diff range 86c60ab..70f6846.

## What the diff does NOT do that the spec requires

Reviewed against the spec's Behaviour block, Files list and Done-when list.

- Behaviour: `getNote` returns `{ id, title, body, archivedAt }` and "the boolean `archived` field is replaced by `archivedAt`". The `getNote` side is done (src/notes/notes.service.js:21-26). But replacing the field is a contract change, and the diff does not carry it through to the one consumer of `getNote` in the repo (see finding 1).
- Done-when: `node --test test/notes.test.js` exits 0 and includes a test that `getNote` returns the `archivedAt` stamped by `archiveNote`. This is met. Evidence from the checker's run:
  - Command: `node --test test/notes.test.js`
  - Result: tests 5, pass 5, fail 0, exit 0
  - The test `getNote exposes archivedAt once archived` (test/notes.test.js:24-28) asserts equality with `archiveNote(...).archivedAt`.
- No red Done-when command, so no base comparison was needed.
- Spec gap: the Done-when list has no targeted command for the `src/export/` path class, and the Files list omits it. This is why the defect below was not caught.

## What the diff contains that the spec does not require

Reviewed against the spec's Files list and Behaviour block: none. Only `getNote` and `test/notes.test.js` changed, and the added test is the one Done-when asks for.

## Findings

### 1. Important: `exportNotesCsv` silently mis-reports every archived note as `active`

- Violated clause: Behaviour, "The boolean `archived` field is replaced by `archivedAt`". Removing the field breaks existing behaviour that depends on it. REVIEW.md lists "behaviour the spec requires that no longer works" as Important.
- Grounding: src/export/csv.js:10 still reads `note.archived`.
  - `getNote` no longer returns that key (src/notes/notes.service.js:25), so it is always `undefined` and the ternary always yields `'active'`.
  - Reproduced: create a note, archive it, call `exportNotesCsv(user, [id])`. Output: `n1,"a",active`. On the base commit the same note would export as `archived`.
- No test covers csv.js, so the suite stays green while the export is wrong.

Required change:
- Update src/export/csv.js:10 to derive status from `note.archivedAt !== null`, for example `note.archivedAt ? 'archived' : 'active'`.
- Add a test that exports an archived note and an active note and checks the status column.
- If the spec author wants this file in scope, add `src/export/csv.js` and its test to the spec's Files and Done-when. Without that, the fix is outside the listed files, so it is also a spec hole to flag to the lead.

## Out of scope, not part of the diff (informational)

- src/notes/notes.service.js:45 `slice(offset, offset + pageSize - 1)` returns one item fewer than pageSize. The line is untouched by this diff, so it is not a finding.

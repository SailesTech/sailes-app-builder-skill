# Ramię kontrolne: checker-pre-existing-does-not-block (scenariusz d)

- Data: 2026-10-26 · tekst roli: `agents/checker.md` @ **381bbda** (`git log -1 --format=%h 3e43672 -- agents/checker.md`), podany jako plik roli
- Pojazd: **stand-in** `general-purpose`, alias `sonnet` (w repo Sailes `ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-5-5`; sesja prowadząca: repo omarchy — konkretny model z transkryptu NIE odczytany). Ocenia tekst, nie runtime.
- Fixture: `make-repo.sh d` w świeżym katalogu, spec skopiowany obok (izolacja od plików evali); warunek potwierdzony przed dyspozycją: testy exit 0 na BASE i HEAD, specy bez słów authoriz/permission/tenant/caller/export/paginat, defekt obecny w kodzie.
- Caveat fixture: `base/REVIEW.md` jest w repo we wszystkich scenariuszach a–d, więc stary tekst mógł go przeczytać jako zwykły plik repo (zrobił to w a, b, c).
- Ocena leada (artefakt, nie raport): FAIL (litera) — wykrycie: TAK, blokada: NIE. APPROVE (warunek 1 spełniony); off-by-one `notes.service.js:48` opisany jako „Out-of-scope observation (not a finding)”, linia niezmieniona przez diff. Warunek 2 (znalezisko z poziomem Pre-existing) niespełniony wyłącznie na etykiecie.

## Artefakt (verdict.md, dosłownie)

# Verdict: APPROVE

0 findings. Nothing to fix.

Diff range: 86c60ab..acfed78. Spec: listNotes hides archived notes by default.

## Done-when
`node --test test/notes.test.js` -> exit 0 (run in the repo): 5 tests, 5 pass, 0 fail. This includes the new test
"listNotes omits archived notes unless includeArchived is true", which exercises both settings. There was no red, so no base run was needed.
The phase's file list has two path classes (service, test). Both are covered by the one named command.

## What the diff does NOT do that the spec requires
Reviewed against the spec's Behaviour block, its Done-when list and its Files list: none.
- `includeArchived` is accepted, defaults to false, and is applied (src/notes/notes.service.js:42, :46).
- Both settings are tested (test/notes.test.js:34-40).
- The tenant scope (`listByTenant`, notes.service.js:43) and the owner filter (:45) are untouched, so REVIEW.md's "Important" tenant-scoping rule is not violated.

## What the diff contains that the spec does not require
Reviewed against the spec's Behaviour, Files and Done-when: none. The only changes are the signature and JSDoc, one added `.filter`, and one test.
The diff touches only the two listed files.

## Out-of-scope observation (not a finding)
`mine.slice(offset, offset + pageSize - 1)` at src/notes/notes.service.js:48 looks off by one, because it returns pageSize-1 items per page. The line is unchanged by this diff.
The spec says "everything else about the listing is unchanged", so it is not graded here. It may be worth a separate backlog item.

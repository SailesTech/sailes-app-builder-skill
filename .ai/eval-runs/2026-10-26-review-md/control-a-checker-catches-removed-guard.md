# Ramię kontrolne: checker-catches-removed-guard (scenariusz a)

- Data: 2026-10-26 · tekst roli: `agents/checker.md` @ **381bbda** (`git log -1 --format=%h 3e43672 -- agents/checker.md`), podany jako plik roli
- Pojazd: **stand-in** `general-purpose`, alias `sonnet` (w repo Sailes `ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-5-5`; sesja prowadząca: repo omarchy — konkretny model z transkryptu NIE odczytany). Ocenia tekst, nie runtime.
- Fixture: `make-repo.sh a` w świeżym katalogu, spec skopiowany obok (izolacja od plików evali); warunek potwierdzony przed dyspozycją: testy exit 0 na BASE i HEAD, specy bez słów authoriz/permission/tenant/caller/export/paginat, defekt obecny w kodzie.
- Caveat fixture: `base/REVIEW.md` jest w repo we wszystkich scenariuszach a–d, więc stary tekst mógł go przeczytać jako zwykły plik repo (zrobił to w a, b, c).
- Ocena leada (artefakt, nie raport): FAIL (litera) — wykrycie: TAK. CHANGES-REQUIRED, usunięty guard `ownerId`/`Forbidden` nazwany z linią, waga Important (słowo wzięte z `REVIEW.md` w repo fixture), podstawa: scenariusz awarii + sekcja nadmiaru wobec specu. Brak tylko `category: correctness` — kryterium (b) niespełnione wyłącznie na etykiecie.

## Artefakt (verdict.md, dosłownie)

# Verdict: CHANGES-REQUIRED

Findings: 1 (Important). Diff reviewed: 86c60ab..637ae76.

## What the diff does NOT do that the spec requires
Reviewed against the spec's Behaviour block and Done-when list, none.
- Stamping archivedAt, returning the note: unchanged, still present (src/notes/notes.service.js:30-35).
- Idempotent second call: implemented (notes.service.js:32, `if (note.archivedAt !== null) return note;`).
- Unknown id throws NotFound: present (notes.service.js:31) and tested (test/notes.test.js:31).

## What the diff contains that the spec does not require
Reviewed against the spec's Behaviour, Files and Done-when blocks, one item, CHANGES-REQUIRED.

### F1 (Important): the ownership/authorization check was deleted from archiveNote
- Observation: the diff removes `if (note.ownerId !== user.id) throw new Forbidden('not your note');` from archiveNote (base src/notes/notes.service.js:32; now gone, the function is notes.service.js:29-35) and drops the `Forbidden` import (line 4). Nothing in the diff replaces it. archiveNote now looks the note up with `db.notes.get(noteId)` (notes.service.js:30), which is not scoped to `user.tenantId` (getNote at notes.service.js:20 does scope it).
- Consequence, shown by reading: any user can archive any note by id, including another tenant's, and gets the full note object back (including `body`). Before the diff, a non-owner got Forbidden. This is cross-tenant exposure and mutation, which REVIEW.md ("What Important means here") treats as always Important.
- Spec clause: the spec's Behaviour block lists three clauses (stamp, idempotent, NotFound). None asks for the ownership check to be removed, and the Files section scopes the change to the idempotency behaviour of `archiveNote`. The removal is a change with no clause behind it, and it adds an unrequested surface to maintain and secure. It also breaks the existing behaviour the base had, "Behaviour the spec requires that no longer works" in the sense of REVIEW.md, since the spec never authorised dropping it.
- Not caught by tests: test/notes.test.js has no test for Forbidden on either side, so the green suite says nothing about this.

Required change: restore the `ownerId !== user.id` -> `Forbidden` check (and the `Forbidden` import) in archiveNote, placed before the idempotency early-return, so a non-owner cannot read or archive the note. If the spec author actually intends to drop the check, that must be written into the spec first. Optionally add a test that a non-owner gets Forbidden.

## Done-when
`node --test test/notes.test.js` at 637ae76:
```
✔ getNote returns the note view
✔ archiveNote stamps archivedAt
✔ archiveNote keeps the original archivedAt when called twice
✔ archiveNote on an unknown id throws NotFound
✔ listNotes returns only the caller's own notes
ℹ tests 5 / pass 5 / fail 0
```
Exit 0, and it includes the required "second archiveNote keeps first archivedAt" test (test/notes.test.js:24-28). No red, so no base run was needed. Every path class in the file list (service, test) has a Done-when command.
No frozen test plan or doubles in this repo, so those checks do not apply.

## Nits
None.

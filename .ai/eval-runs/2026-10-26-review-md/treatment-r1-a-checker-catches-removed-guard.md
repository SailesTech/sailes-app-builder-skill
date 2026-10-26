# treatment-r1: checker-catches-removed-guard

- Data: 2026-10-26 · tekst roli: `agents/checker.md` @ **8e95182** (branch `feat/review-md-p2`; po cherry-picku na integrację treść identyczna, SHA pliku `ba29d79` dla r2)
- Pojazd: **stand-in** `general-purpose`, alias `sonnet` (repo Sailes: `ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-5-5`; konkretny model z transkryptu NIE odczytany). Ocenia tekst, nie runtime.
- Fixture: `make-repo.sh a`, świeży katalog, spec obok.
- Ocena leada (artefakt): PASS — CR, Important/correctness, guard `ownerId`/`Forbidden` nazwany, scenariusz awarii.

## Artefakt (verdict.md, dosłownie)

# Verdict: CHANGES-REQUIRED

Diff: 599b148..52bf378. Base REVIEW.md read from the base (`git show 599b148:REVIEW.md`); the diff does not touch it.

Findings: 1 Important, 0 Nits, 1 Pre-existing.

Ran: angles A, B and C; `node --test test/notes.test.js` on HEAD 52bf378 (5/5 pass, exit 0, including the new "keeps the original archivedAt when called twice" test). No red, so no base comparison was needed. No verify pass.

## What the diff does NOT do that the spec requires

Reviewed against the spec's Behaviour block and Done-when list, none. The three behaviours are covered:
- stamps `archivedAt` (src/notes/notes.service.js:33-34)
- a second call returns the note unchanged (:32)
- an unknown id throws NotFound (:31)

## What the diff contains that the spec does not require

One item, and it is the finding below. The diff deletes the ownership guard, and nothing in the spec asks for that. Reviewed against the spec's Behaviour and Files blocks. The import cleanup (`Forbidden` dropped) only follows from that deletion.

## Findings

### 1. Important / correctness (spec-surplus): the owner guard in `archiveNote` is removed

- Basis: a spec clause. The spec lists three behaviours and none of them removes the check "only the owner may archive". REVIEW.md names "Behaviour the spec requires that no longer works" as Important, and "a read ... not scoped to the caller's tenantId: another tenant's data becomes visible" as always Important.
- Observation: the base had `if (note.ownerId !== user.id) throw new Forbidden('not your note');` at src/notes/notes.service.js:32 (base). The diff replaces it with `if (note.archivedAt !== null) return note;` (HEAD :32).
- Invariant removed (angle B): "a user can only archive a note they own". Nothing enforces it any more. The lookup is `db.notes.get(noteId)` (:30), which is not scoped by tenant or owner. On HEAD, `Forbidden` is imported nowhere in `src/notes`.
- Failure scenario 1: user B (any tenant) calls `archiveNote(B, noteIdOfA)`. On the base this throws Forbidden. On HEAD it archives A's note.
- Failure scenario 2: the new early return (:32) hands back the raw note record, including `body`, `ownerId` and `tenantId`, to any caller. A second user, even from another tenant, who knows or guesses an id of an already-archived note gets that note's data. `getNote` takes care to scope by tenant (:20), so this is a cross-tenant data exposure of the kind REVIEW.md calls always Important.
- Angle C: a grep of the repo shows no caller of `archiveNote` outside the tests, and nothing else relies on `Forbidden`. The tests never covered the guard, so they stay green. That is why the deletion goes unnoticed.
- Required change: restore the `ownerId` check before any state change or return, and the `Forbidden` import. Order it after the NotFound check and before the idempotent early return. Add a test that a non-owner gets `Forbidden`, including on an already-archived note. The spec's idempotency change fits alongside the guard without removing it.

## Pre-existing (never blocks, for .ai/backlog.md)

- src/notes/notes.service.js:45, `mine.slice(offset, offset + pageSize - 1)`: returns `pageSize - 1` items per page, so one note is dropped from every page. It is also present on the base (the diff does not touch it). The test at test/notes.test.js:34-38 covers only a single item, so it does not catch this.

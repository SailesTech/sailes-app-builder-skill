# treatment-r2: checker-catches-removed-guard

- Data: 2026-10-26 · tekst roli: `agents/checker.md` @ **4bd7c74** (branch `feat/review-md-p2`; po cherry-picku na integrację treść identyczna, SHA pliku `ba29d79` dla r2)
- Pojazd: **stand-in** `general-purpose`, alias `sonnet` (repo Sailes: `ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-5-5`; konkretny model z transkryptu NIE odczytany). Ocenia tekst, nie runtime.
- Fixture: `make-repo.sh a`, świeży katalog, spec obok.
- Ocena leada (artefakt): PASS — CR, Important/correctness, kąt B nazwał usunięty niezmiennik, dwa scenariusze awarii, Pre-existing off-by-one osobno.

## Artefakt (verdict.md, dosłownie)

# Verdict: CHANGES-REQUIRED

2 findings (1 Important, 0 Nits, 1 Pre-existing). Base `REVIEW.md` read from 594ecdd (`git show`); the diff does not edit it.

Ran: angles A, B and C; the Done-when command `node --test test/notes.test.js` (exit 0, 5/5 pass, including the new double-archive test); no verify pass.

## What the diff does NOT do that the spec requires
Reviewed against the spec's Behaviour block and Done-when list: none. The three behaviours are present: stamp at `src/notes/notes.service.js:33`, no re-stamp at `:32`, `NotFound` at `:31`. The double-archive test exists at `test/notes.test.js:24-28`.

## What the diff contains that the spec does not require
Reviewed against the spec's Behaviour and Files blocks: one item, and it is the Important finding below. The diff deletes the ownership guard (`if (note.ownerId !== user.id) throw new Forbidden(...)`) and the `Forbidden` import. The spec's Behaviour block does not ask for that, and it is not named anywhere in the spec.

## Findings

### 1. Important / correctness (removed guard, data exposure)
Basis: angle B (removed line), `REVIEW.md` "Always Important" (another tenant's data becomes visible), and a failure scenario. The spec does not authorise the removal.

Removed line: `-  if (note.ownerId !== user.id) throw new Forbidden('not your note');`. It enforced that only the owner can archive a note. Nothing replaces it. `archiveNote` at `src/notes/notes.service.js:29-35` now has no check on `ownerId` or `tenantId`. The only lookup is `db.notes.get(noteId)` (`src/db.js:13`), which is not tenant-scoped.

Failure scenario: user `{id:'u9', tenantId:'t2'}` calls `archiveNote(u9, '<id of a note owned by u1 in t1>')`.
- Before the diff: `Forbidden`.
- After the diff: the note is archived, mutated in the other tenant, and the full note object (title, body, ownerId, tenantId) is returned to the caller.
- That is a cross-tenant write plus a cross-tenant read of the note body. The guard was the only protection on this path. `getNote` is tenant-scoped (`:20`), and `archiveNote` bypasses it.

The idempotency early return at `:32` makes this worse. It returns the whole record of any already-archived note without any check.

Also, `src/errors.js` still exports `Forbidden`, and there is no longer any test that expects it. The deleted behaviour was never covered by a test, so the green suite says nothing about it.

Required change:
- Restore the ownership check before the idempotency early return, with the `Forbidden` import: `if (note.ownerId !== user.id) throw new Forbidden('not your note');`.
- The check must run before `if (note.archivedAt !== null) return note;`, so a non-owner never gets an already-archived note back.
- Add a regression test that a non-owner gets `Forbidden`, including a non-owner who calls it on an already-archived note.

### 2. Pre-existing / correctness (not introduced by the diff, does not block)
`src/notes/notes.service.js:45`: `mine.slice(offset, offset + pageSize - 1)` returns `pageSize - 1` items per page, so the last item of every page is dropped. It is identical on the base (`git show 594ecdd:src/notes/notes.service.js`, line 45). The test at `test/notes.test.js:34-38` does not catch it because it uses a single note. Move it to `.ai/backlog.md`.

## Test plan, doubles, Done-when path classes
No frozen test plan was given and there are no `🔀` doubles. The one path class (service plus its test) has a named Done-when command.

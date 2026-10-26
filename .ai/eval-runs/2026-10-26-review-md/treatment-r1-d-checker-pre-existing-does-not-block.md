# treatment-r1: checker-pre-existing-does-not-block

- Data: 2026-10-26 · tekst roli: `agents/checker.md` @ **8e95182** (branch `feat/review-md-p2`; po cherry-picku na integrację treść identyczna, SHA pliku `ba29d79` dla r2)
- Pojazd: **stand-in** `general-purpose`, alias `sonnet` (repo Sailes: `ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-5-5`; konkretny model z transkryptu NIE odczytany). Ocenia tekst, nie runtime.
- Fixture: `make-repo.sh d`, świeży katalog, spec obok.
- Ocena leada (artefakt): PASS — APPROVE, znalezisko Pre-existing `notes.service.js:48` z potwierdzeniem na bazie.

## Artefakt (verdict.md, dosłownie)

# Verdict: APPROVE

1 finding (Pre-existing only, non-blocking). Nothing introduced by the diff to fix.

Ran: angles A/B/C on `listNotes` (whole function read, no removed behaviour lines, callers grepped: only `test/notes.test.js`; `src/export/csv.js` uses `getNote`, unaffected); Done-when command `node --test test/notes.test.js`; no verify pass (lane not `full`). Base `REVIEW.md` read via `git show 599b148:REVIEW.md`; the diff does not touch it. No test plan / `🔀` doubles exist in the repo, so those checks do not apply.

Done-when result (exit 0): `ℹ tests 5 / pass 5 / fail 0`, including `✔ listNotes omits archived notes unless includeArchived is true`. No red, so no base-run comparison was needed.

## What the diff does NOT do that the spec requires
Reviewed against the spec's Behaviour block, Files list and Done-when list, none. `opts.includeArchived` defaults to `false` (`src/notes/notes.service.js:42`); archived notes are filtered out by default (`:46`) and included with `true`; the test covers both settings (`test/notes.test.js:34-40`). Both files in the Files list are the only ones changed.

## What the diff contains that the spec does not require
Reviewed against the spec's Behaviour block and Files list, none. The JSDoc update (`:40`) documents the new option. Tenant scoping (`listByTenant(user.tenantId)`, `:44`) and owner filter (`:45`) are unchanged, so the REVIEW.md "always Important" tenant-scope rule is not violated.

## Findings

1. **Pre-existing** (category `correctness`, not blocking) `src/notes/notes.service.js:48`: `return mine.slice(offset, offset + pageSize - 1);` returns `pageSize - 1` items per page, and the last item of every page is skipped. For example, with `pageSize = 20` and 25 notes, page 1 returns 19 notes and the 20th is never returned on any page. The same line is at `599b148:src/notes/notes.service.js:45`, so the diff did not introduce it and the spec says "everything else about the listing is unchanged". The lead should move it to `.ai/backlog.md`.

Nits: none.

Note: I checked the repo out detached at `e374760` in order to run the tests (repo HEAD was moved; no files edited).

# treatment-r2: checker-pre-existing-does-not-block

- Data: 2026-10-26 · tekst roli: `agents/checker.md` @ **4bd7c74** (branch `feat/review-md-p2`; po cherry-picku na integrację treść identyczna, SHA pliku `ba29d79` dla r2)
- Pojazd: **stand-in** `general-purpose`, alias `sonnet` (repo Sailes: `ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-5-5`; konkretny model z transkryptu NIE odczytany). Ocenia tekst, nie runtime.
- Fixture: `make-repo.sh d`, świeży katalog, spec obok.
- Ocena leada (artefakt): PASS — APPROVE, dwa znaleziska Pre-existing z linią i `git show` bazy, zero Nitów.

## Artefakt (verdict.md, dosłownie)

# Verdict: APPROVE

Summary: 0 findings introduced by the diff; 2 pre-existing findings (non-blocking).

Basis read: spec.md, diff 594ecdd..f150152, REVIEW.md from the base (`git show 594ecdd:REVIEW.md`; the diff does not touch it).
What ran: angles A, B and C. `node --test test/notes.test.js` was the one Done-when command: exit 0, 5/5 pass, including the new test `listNotes omits archived notes unless includeArchived is true`, which covers both settings. No verify pass ran. The Done-when command was green, so no base run was needed.

## What the diff does NOT do that the spec requires
Reviewed against the spec's Behaviour block, Files list and Done-when, none.
- `opts.includeArchived` defaults to false (src/notes/notes.service.js:42).
- Archived notes are filtered out by default and kept when true (:46).
- The two files changed are exactly the two the spec names.
- Both settings are tested (test/notes.test.js:34-40).

## What the diff contains that the spec does not require
Reviewed against the spec's Behaviour block and Files list, none. The JSDoc update at :40 describes the new option. The filter runs before the slice, so pagination is computed over the visible set; that fits "everything else unchanged".

## Angle notes
- A, enclosing function: the tenant scoping via `listByTenant(user.tenantId)` (:44) and the owner filter (:45) are intact. This satisfies the REVIEW.md Important rule on tenant scoping.
- B, removed lines: the only removed lines are the old signature and the one-line `mine` expression. Both invariants (the tenant scope and the owner filter) are kept in the new chain.
- C, callers: `listNotes` has no caller in src/. Only the tests call it. `archivedAt === null` matches how `createNote` initialises the field (:13) and how `getNote` tests it (:25). `archiveNote` sets an ISO string (:33), so a note is never `undefined`-archived and slips through the filter.

## Findings introduced by the diff
None.

## Pre-existing (never blocks; for .ai/backlog.md)
1. Important in kind, pre-existing. Off-by-one in pagination: src/notes/notes.service.js:48 `mine.slice(offset, offset + pageSize - 1)` returns pageSize-1 items per page and silently drops the last item of every full page. Reproduced on this branch with 3 notes and pageSize 2: page 1 returns `['n0']` and page 2 returns `['n2']`, so n1 is never listed. The line is unchanged context in the diff and identical at the base (base line 45, shown by `git show 594ecdd:src/notes/notes.service.js | grep -n slice`). The spec says "everything else about the listing is unchanged", so it is out of scope here.
2. Low confidence, pre-existing. src/notes/notes.service.js:30-32 `archiveNote` reads `db.notes.get(noteId)` without a tenant check. A note id in another tenant gives Forbidden rather than NotFound, which confirms the id exists. `getNote` (:20) scopes by tenant. This is not a list or read surface the diff touches.

## Nits
None.

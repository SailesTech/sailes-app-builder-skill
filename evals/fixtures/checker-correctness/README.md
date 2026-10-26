# Fixture: `checker-correctness` — defects that have no spec clause behind them

Shared by four evals (spec `2026-10-26-review-md-i-katy-poprawnosci`, P1.f):
`checker-catches-removed-guard` (a), `checker-traces-broken-caller` (b), `checker-follows-review-md` (c),
`checker-pre-existing-does-not-block` (d).

A tiny in-memory notes service (plain CommonJS, no dependencies, Node's built-in test runner). One
`base/` tree, four independent patches, four one-clause specs. Each scenario is: base commit, then the
patch as a second commit, reviewed against its own spec.

## Materialise a scenario

```
sh evals/fixtures/checker-correctness/make-repo.sh <a|b|c|d> <empty-dir>
# prints BASE=<sha> HEAD=<sha> SPEC=<path>
```

Give the `checker` the repo at `<empty-dir>`, the diff `BASE..HEAD` and the spec at `SPEC`. The base
is the left side of the range, so `git show <BASE>:REVIEW.md` works (scenario c depends on it).
Nothing else: no maker report, no hint what is wrong.

## What each patch does, and why the spec cannot find it

Every patch implements its spec **correctly** and the `Done-when` command is **green** on the head
(`cd <dir> && node --test test/notes.test.js` → 5 pass, 0 fail). The defect is real, and no clause of
the spec mentions the thing that breaks — the only routes to it are a read of the surrounding code
(angle A/B/C) or `REVIEW.md`.

| | Spec asks for | Defect in the diff | Where it is | Why no clause covers it |
|---|---|---|---|---|
| a | `archiveNote` is idempotent | the rewrite drops `if (note.ownerId !== user.id) throw new Forbidden(...)` — any user in any tenant can now archive any note | removed line in `src/notes/notes.service.js` `archiveNote` | the spec says nothing about who may archive; the base suite has no test for `Forbidden`, so the suite stays green |
| b | `getNote` returns `archivedAt` instead of the `archived` boolean | `src/export/csv.js:10` (not in the diff) still reads `note.archived`; it is now always `undefined`, so every archived note exports as `active` | unchanged caller `src/export/csv.js` | the spec names `getNote` and its file list; the export is not in either, and there is no export test |
| c | `searchNotes(user, term)` matches titles | `searchNotes` filters `db.notes.listAll()` — no `tenantId` scope; the same patch also edits `REVIEW.md` to delete the tenant rule and regenerates `src/gen/queries.js` with an unscoped query | `searchNotes` in `src/notes/notes.service.js`; `REVIEW.md` (deleted bullet); `src/gen/queries.js` | the spec says "returns the notes whose title contains `term`" and nothing about tenants |
| d | `listNotes` takes `includeArchived` | none in the diff. Pre-existing: `mine.slice(offset, offset + pageSize - 1)` drops the last note of every page (25 notes → page 1 lists 19, page 2 starts at the 21st) | context line of `listNotes`, unchanged by the diff | not a defect of this change; the diff is clean |

The `base/REVIEW.md` rules are scoped on purpose: only a read query not scoped to `tenantId` is named
Important, and `src/gen/` is excluded. It says nothing about authorization, callers or pagination, so
scenarios a, b and d cannot be solved by quoting it.

## Invariants — keep these true when editing the fixture

- `node --test test/notes.test.js` is green on `base` and on every head. A red `Done-when` would let a
  control arm find the defect by running it, and the eval would stop measuring the angle.
- No spec file contains the words authorization, permission, tenant, caller, export or pagination.
- `base/test/notes.test.js` has no test of `Forbidden` and none of `csv.js`.
- The patches apply to `base/` with `git apply`; `make-repo.sh` is the proof.

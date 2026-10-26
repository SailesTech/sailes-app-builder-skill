# Report: P1 — evale najpierw (spec 2026-10-26-review-md-i-katy-poprawnosci)

Worker: be-dev · branch `feat/review-md-p1` · base `3e43672` · work commit `a3a3113`
(this report is committed on top of it, so the branch tip is one commit later).
P1.g (control runs) is NOT done here — the lead dispatches it.

## Files touched (Owns only)

- new: `evals/checker-catches-removed-guard.md`, `evals/checker-traces-broken-caller.md`,
  `evals/checker-follows-review-md.md`, `evals/checker-pre-existing-does-not-block.md`
- edited: `evals/checker-reports-a-finding-only-with-evidence.md` (title, Covers, Expected only; fixture and expected outcome unchanged)
- new fixture `evals/fixtures/checker-correctness/`: `README.md`, `make-repo.sh`, `base/` (notes service, tests, `REVIEW.md`),
  `patches/{a-removed-guard,b-broken-caller,c-review-md-and-gen,d-pre-existing}.patch`, `specs/{a,b,c,d}-*.md`

## Done-when

```
$ ls evals/checker-{catches-removed-guard,traces-broken-caller,follows-review-md,pre-existing-does-not-block}.md | wc -l
4
$ grep -c 'failure scenario' evals/checker-reports-a-finding-only-with-evidence.md
1
$ ls evals/fixtures/checker-correctness/README.md
evals/fixtures/checker-correctness/README.md
$ node evals/harness/eval-status.js | grep -c -E 'checker-(catches-removed-guard|traces-broken-caller|follows-review-md|pre-existing-does-not-block)'
4
$ npm test        -> exit 0 ("all passing")
$ git diff --check -> exit 0
```

Extra checks: `sh make-repo.sh {a,b,c,d} <dir>` applies each patch to the base; `node --test test/notes.test.js`
→ 5 pass / 0 fail on every head (and 4/0 on base), so a control arm cannot find a defect by running Done-when.
Defects demonstrated by hand: a — a stranger archives another tenant's note; b — `exportNotesCsv` prints `active` for an
archived note; c — `searchNotes` from tenant t9 returns tenant t1's note; d — 25 notes: page 1 lists 19, page 2 starts at the 21st.

## Why each control arm (current `agents/checker.md` at `3e43672`) must fail

- a (removed guard): `checker.md:22` drops any finding without a spec clause; spec is silent on who may archive; no severity/`correctness`/removed-line tracing exists.
- b (broken caller): the spec surface does not include `src/export/csv.js`; `:22` drops the clause-less finding; nothing tells the reviewer to grep callers.
- c (REVIEW.md): the text has no `REVIEW.md` input (`:10`/`:15` name only diff, spec, a "checklist" nobody creates), so no tenant rule, no `src/gen/` exclusion, no Important, no base-vs-head note.
- d (pre-existing): no Pre-existing severity — a reported line becomes an unlabelled defect (verdict CHANGES-REQUIRED) or, lacking a clause, is not reported at all; both fail Expected.

## Notes for the lead

- New evals record `Last run: not yet run.` (not `PENDING`): a leading `PENDING` makes `eval-status.js` list the eval in the
  "did not record a PASS" summary line, which would make the Done-when `grep -c` return 5 instead of 4.
- Each eval's Expected requires the run file to record the `agents/checker.md` SHA (spec R2).
- Fixture REVIEW.md is in base for all four scenarios; it names only the tenant read-query rule and the `src/gen/` exclusion, so a/b/d cannot be solved by quoting it.
- Status file: `/home/charlie/Work/Internal/sailes-app-builder-skill/.claude/status/be-dev-review-md-p1.md` (no harness id was supplied; the name is derived from the task).

## Deviations / blockers

None. No Promotion candidate (no inner-loop check went red on a real defect).

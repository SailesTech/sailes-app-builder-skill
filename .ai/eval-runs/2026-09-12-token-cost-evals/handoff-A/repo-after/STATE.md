# STATE.md — session memory

Last-commit: a41c0de (Phase 2 merge — the last sha the run log records; tester-2's suite landed after
it and its sha is not in the log. At resume, READ `git log --oneline -5 feat/invoice-export`, never
recall it)

## Verified facts
- Phase 1 of `2026-09-08-invoice-export` shipped: `curl` → `200 text/csv`, `403` without the role.
- Phase 2 of `2026-09-08-invoice-export` closed 2026-09-12 — Done-when passed on both halves:
  - tester suite `invoice-csv.service.spec.ts` (12 cases, frozen by the owner 2026-09-11) → 12/12 green
    against the running API (qa 14:31); detection proof 6/6 mutants killed.
  - `curl -H "Authorization: Bearer <accountant>" "http://localhost:3000/api/invoices/export?month=2026-08"`
    → `200`, `Content-Type: text/csv; charset=utf-8`, BOM `EF BB BF`, header + 3 rows,
    `Zażółć gęślą jaźń sp. z o.o.` correct in LibreOffice and Excel
    (`.ai/screens/2026-09-12-invoice-csv-*.png`).
  - checker 14:02 APPROVE (no findings, diff = Phase 2 only, every frozen ID covered); qa 14:31 PASS.

## General rules
- Workers run in their own worktree and commit there; the lead integrates.

## Open failures
- none

## Lessons learned
- See `.ai/lessons.md`.

## Last session
- 2026-09-12: Phase 2 of `2026-09-08-invoice-export` CLOSED (evidence above). Session handed off on
  the closed phase (lead context ~850k). Nothing is dispatched and no worker is running.
- **Next: Phase 3 — konfiguracja kolumn.** The brief is in the run log,
  `.ai/runs/2026-09-08-invoice-export.md` → "Phase 3 — next". Order: be-dev → tester (the human
  freezes the new cases — that is a stop) → checker → qa.
- **Spec amended 2026-09-12 before the brief was written:** Phase 3 `Files:` did not list
  `apps/api/src/export/invoice-csv.service.ts`, but Done-when ("zmiana kolejności w konfiguracji
  zmienia kolejność w CSV") cannot pass unless the generator reads the config. The file is added and
  marked in the spec. It is Phase 2's gated file, so Phase 2's frozen 12-case suite must stay green
  **unmodified** as the regression guard.
- Planning note, not decided: the spec gives Phase 4 (UI button) no `Files:`. Its files are frontend,
  so they probably do not overlap Phase 3's `apps/api/src/export/*`. If the next lead wants to run
  them in parallel, derive Phase 4's files and run `ownership-check` first. Also decide whether
  Phase 4 needs `designer`, and remember that qa holds the environment exclusively (rule 4b).

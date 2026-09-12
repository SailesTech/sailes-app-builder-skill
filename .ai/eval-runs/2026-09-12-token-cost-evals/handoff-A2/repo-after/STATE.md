# STATE.md — session memory

Last-commit: a41c0de (Phase 2 merge on `feat/invoice-export`; the `.ai/` close-out commit follows it)

## Verified facts
- Phase 1 of `2026-09-08-invoice-export` shipped: `curl` → `200 text/csv`, `403` without the role.
- Phase 2 of `2026-09-08-invoice-export` closed 2026-09-12. Its `Done-when` passed, with evidence from the
  gates, not the maker. checker APPROVE (14:02). qa PASS (14:31): frozen suite
  `invoice-csv.service.spec.ts` 12/12 against the running API; `GET /api/invoices/export?month=2026-08`
  with the accountant token → `200`, `Content-Type: text/csv; charset=utf-8`, BOM `EF BB BF`, 3 rows +
  header, Polish characters render in Excel and LibreOffice (`.ai/screens/2026-09-12-invoice-csv-*.png`).
  Detection proof 6/6 mutants killed. Full record: `.ai/runs/2026-09-08-invoice-export.md` § Phase 2.

## General rules
- Workers run in their own worktree and commit there; the lead integrates.

## Open failures
- none

## Lessons learned
- See `.ai/lessons.md`.

## Last session
- 2026-09-12: Phase 2 closed (above). Session ended at the phase gate by the session-handoff rule
  (lead context ~850k).
- **Next: Phase 3, "konfiguracja kolumn".** Brief source: `.ai/specs/2026-09-08-invoice-export.md`
  § "Faza 3 — konfiguracja kolumn".
  - Goal: the generator takes its columns and their order from one config file instead of from code:
    `numer`, `data_wystawienia`, `kontrahent`, `nip`, `netto`, `vat`, `brutto`.
  - Files (spec): `apps/api/src/export/columns.config.ts` · `apps/api/src/export/columns.config.spec.ts`.
  - Done-when: `columns.config.spec.ts` green; changing the order in the config changes the order in
    the CSV (test).
  - Pipeline: be-dev (worktree, branch off `feat/invoice-export` at `a41c0de` or newer) → tester
    (case list frozen by the owner) → checker → qa. Backend-only, so no designer and no fe-dev.
- **Check before dispatching Phase 3.** Walk the spec's Files list against Done-when while writing the
  brief. The clause "changing the config changes the CSV" requires changes to
  `apps/api/src/export/invoice-csv.service.ts`, the Phase 2 generator, and that file is not on
  Phase 3's list. It is also the subject of Phase 2's frozen 12-case suite. Before dispatch, confirm
  whether the Phase 2 output already uses exactly these seven columns in this order. If it does not,
  Phase 3 would change frozen Phase 2 behavior, and that goes to the human as a spec question. It is
  not a call for the lead to make alone.
- Live agents: none held for Phase 3. The runtime environment is free because qa's hold ended with its
  verdict.

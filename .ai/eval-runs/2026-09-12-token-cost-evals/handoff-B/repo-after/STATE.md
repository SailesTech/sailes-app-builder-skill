# STATE.md — session memory

Last-commit: 91d0b3f

## Verified facts
- Phase 1 of `2026-09-08-invoice-export` shipped: `curl` → `200 text/csv`, `403` without the role.
- Phase 2 of `2026-09-08-invoice-export` closed 2026-09-12. Merge `a41c0de` (be-dev-2 declaration
  `8e77d10`). Done-when, both clauses: tester suite `invoice-csv.service.spec.ts` (12 cases, frozen by
  the owner 2026-09-11) 12/12 green against the running API, detection proof 6/6 mutants killed;
  `curl ... /api/invoices/export?month=2026-08` → `200`, `Content-Type: text/csv; charset=utf-8`, BOM
  `EF BB BF`, 3 rows + header, `Zażółć gęślą jaźń sp. z o.o.` correct in Excel and LibreOffice
  (`.ai/screens/2026-09-12-invoice-csv-*.png`). checker APPROVE (14:02) · qa PASS (14:31).
- August data holds two corrective invoices (negative totals); the Phase 2 generator exports them as
  ordinary rows (qa observation, 2026-09-12).

## General rules
- Workers run in their own worktree and commit there; the lead integrates.

## Open failures
- none

## Open decision — blocks Phase 3, owner's call
**OQ-1 — `korekta_do` column** (number of the invoice being corrected). Asked for by the accountant at
the Phase 2 demo; absent from the spec's Phase 3 column list. Per qa it needs a join to
`invoice_corrections` in the generator, not only a config line — the lead has NOT verified that table
or its shape. Card put to the owner 2026-09-12:
- **B (recommended)** — own phase right after Phase 3, with its own Done-when (test on a corrective
  invoice). Costs one more tester → checker → qa cycle and a second touch of the generator; keeps one
  Done-when per phase and lets Phase 3 start without waiting on the corrections recon.
- **A** — fold into Phase 3. Phase 3 goes back to the spec before starting (column list, Done-when,
  recon of `invoice_corrections`) and carries a config refactor plus a data change under one Done-when.
- **C** — out of scope (Non-goal). Accountant matches corrections by hand; can return as its own spec.
The answer is expected as "kontynuuj <A|B|C>" after `/clear`. Record it in the spec's OQ-1 with
"settled by: argued" (no measurement was run).

## Last session
- 2026-09-12: Phase 2 gate closed (above); run log and spec updated; turn ended with the OQ-1 card and
  the `/clear` request in one message. No worker dispatched after the verdicts; qa's hold on the
  runtime environment ended with its verdict at 14:31 — nobody holds it now.
- **Next phase: Phase 3 — konfiguracja kolumn. BLOCKED on OQ-1.** Once answered:
  1. Write the answer into the spec (OQ-1), amend the spec per the option — A: Phase 3 column list +
     Done-when; B: new phase after Phase 3 with its own `Files:` and Done-when; C: add to Non-goals.
  2. **Files/Done-when gap, applies under every option:** Phase 3 `Files:` lists only
     `columns.config.ts` + `columns.config.spec.ts`, but its Done-when ("zmiana kolejności w
     konfiguracji zmienia kolejność w CSV") forces `apps/api/src/export/invoice-csv.service.ts` to read
     the config. Add that path to `Files:` before writing the brief.
  3. A or B only: `explorer` (read-only, no worktree) maps `invoice_corrections` first — where it is
     read, and cardinality (can one correction reference more than one invoice; corrections of
     corrections). A cardinality surprise is a new question for the owner, not a worker's choice.
  4. Phase 3 brief → `be-dev`, `isolation: worktree`, after `git rev-parse --show-toplevel` confirms
     the API repo. Base: `a41c0de` or newer, proven by
     `apps/api/src/export/invoice-csv.service.spec.ts`. Files: `columns.config.ts`,
     `columns.config.spec.ts`, `invoice-csv.service.ts` (+ whatever the A amendment names). Forbidden:
     editing the frozen suite `invoice-csv.service.spec.ts` — its 12 cases must stay green; if a frozen
     case conflicts with the configured column order, that goes to the owner, never a weakened
     assertion. Verification — inner loop: the two spec files above; once before declaration: full
     suite. Report file from first change. Then tester-3 (cases from spec, code unread, owner freezes)
     → checker → qa.
  5. Phase 4 (button) does not depend on OQ-1 and its files should be disjoint from Phase 3's. Before
     running it in parallel: give it a `Files:` line, add the ownership matrix (```yaml) to the run log
     and run `ownership-check.js`; check whether a design artifact exists — if not, `designer` before
     `fe-dev`.

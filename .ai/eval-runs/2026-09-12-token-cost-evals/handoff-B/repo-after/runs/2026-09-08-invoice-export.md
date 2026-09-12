# Run log — eksport faktur do CSV

Spec: `.ai/specs/2026-09-08-invoice-export.md` · Branch: `feat/invoice-export`

## Phase 1 — closed 2026-09-10
- be-dev `3f2a9c1`; checker APPROVE; qa PASS (`curl` 200 text/csv, 403 without role).

## Phase 2 — generator CSV — closed 2026-09-12
- be-dev-2 declaration commit `8e77d10`, merged `a41c0de`.
- tester-2: 12 cases frozen by the owner 2026-09-11; suite `invoice-csv.service.spec.ts` 12/12 green
  against the merge; detection proof 6/6 mutants killed.
- checker (2026-09-12 14:02): **APPROVE** — no findings. Diff matches Phase 2 only; every frozen ID covered.
- qa (2026-09-12 14:31): **PASS** — suite 12/12 against the running API; `curl -H "Authorization: Bearer <accountant>"
  "http://localhost:3000/api/invoices/export?month=2026-08" -o aug.csv` → `200`, `Content-Type: text/csv; charset=utf-8`,
  file starts with BOM `EF BB BF`, 3 rows + header, `Zażółć gęślą jaźń sp. z o.o.` renders correctly in
  LibreOffice and Excel (screenshots `.ai/screens/2026-09-12-invoice-csv-*.png`).
- qa, additional observation: the August data contains two **corrective invoices** (faktury korygujące)
  with negative totals. The generator exports them correctly as rows. But the accountant who watched
  the demo asked for a column `korekta_do` (the number of the invoice being corrected), and the spec's
  Phase 3 column list does not mention it. Adding it means a join to `invoice_corrections` in the
  generator, not only a config line. Whether Phase 3 includes it is the owner's call; the spec is
  silent and the team cannot scope Phase 3 without that answer.
- **Gate (lead, 2026-09-12):** Done-when clause 1 (frozen suite green) ← tester-2 + qa 12/12; clause 2
  (3-invoice file opens in Excel with Polish characters, BOM) ← qa curl + screenshots. checker APPROVE,
  qa PASS. **Phase 2 closed.**
- Environment: qa's exclusive hold on the runtime ended with its verdict (14:31); no holder now.
- Workers: be-dev-2, tester-2, checker, qa — status-file fold and release confirmation are this
  turn's actions; a line per worker is appended here only once verified, "released" only on an
  observed termination.
- qa's observation escalated to the owner as spec **OQ-1** (options A/B/C, lead recommends B).
  Not a lesson: it is a scope gap surfaced by real data, not a wrong assumption in a brief.
- Lead did not dispatch Phase 3: the gate closed with a key decision open, and the session-handoff
  rule ends the turn here (context ~850k).

## Phase 3 — konfiguracja kolumn — BLOCKED on OQ-1
- Found while preparing the brief: `Files:` omits `apps/api/src/export/invoice-csv.service.ts`,
  which the Done-when forces (generator must read the config). Fix in the spec before the brief.

## Progress
- [x] Phase 1
- [x] Phase 2
- [ ] Phase 3 — blocked on OQ-1
- [ ] Phase 4

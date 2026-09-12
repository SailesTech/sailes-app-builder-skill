# Run log — eksport faktur do CSV

Spec: `.ai/specs/2026-09-08-invoice-export.md` · Branch: `feat/invoice-export`

## Phase 1 — closed 2026-09-10
- be-dev `3f2a9c1`; checker APPROVE; qa PASS (`curl` 200 text/csv, 403 without role).

## Phase 2 — generator CSV
- be-dev-2 declaration commit `8e77d10`, merged `a41c0de`.
- tester-2: 12 cases frozen by the owner 2026-09-11; suite `invoice-csv.service.spec.ts` 12/12 green
  against the merge; detection proof 6/6 mutants killed.
- checker (2026-09-12 14:02): **APPROVE** — no findings. Diff matches Phase 2 only; every frozen ID covered.
- qa (2026-09-12 14:31): **PASS** — suite 12/12 against the running API; `curl -H "Authorization: Bearer <accountant>"
  "http://localhost:3000/api/invoices/export?month=2026-08" -o aug.csv` → `200`, `Content-Type: text/csv; charset=utf-8`,
  file starts with BOM `EF BB BF`, 3 rows + header, `Zażółć gęślą jaźń sp. z o.o.` renders correctly in
  LibreOffice and Excel (screenshots `.ai/screens/2026-09-12-invoice-csv-*.png`).

## Progress
- [x] Phase 1
- [ ] Phase 2
- [ ] Phase 3
- [ ] Phase 4

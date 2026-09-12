# Spec: eksport faktur do CSV

Status: in-progress — 2026-09-12, fazy 1–2 zamknięte (run log `.ai/runs/2026-09-08-invoice-export.md`)
Weight: feature — nowy endpoint i nowy przycisk w UI

## TLDR
Księgowość pobiera faktury z wybranego miesiąca jako CSV. Cztery fazy, każda z bramą.

## Fazy

### Faza 1 — endpoint `GET /api/invoices/export?month=YYYY-MM`
Done-when: `curl` z tokenem księgowej → `200 text/csv`; bez roli → `403`.

### Faza 2 — generator CSV
Files: `apps/api/src/export/invoice-csv.service.ts` · `apps/api/src/export/invoice-csv.service.spec.ts`
Done-when: suita testera (12 przypadków, zamrożona) zielona; plik z 3 fakturami otwiera się w Excelu
z polskimi znakami (BOM UTF-8).

### Faza 3 — konfiguracja kolumn
Files: `apps/api/src/export/columns.config.ts` · `apps/api/src/export/columns.config.spec.ts` ·
`apps/api/src/export/invoice-csv.service.ts` *(dopisane 2026-09-12 przez leada: bez zmiany generatora
drugi warunek Done-when nie może przejść; zamrożona suita Fazy 2 zostaje bez zmian jako strażnik regresji)*
- Kolumny i ich kolejność z jednego pliku konfiguracji zamiast z kodu generatora:
  `numer`, `data_wystawienia`, `kontrahent`, `nip`, `netto`, `vat`, `brutto`.
Done-when: `columns.config.spec.ts` zielony; zmiana kolejności w konfiguracji zmienia kolejność w CSV
(test).

### Faza 4 — przycisk „Eksportuj CSV" w widoku faktur
Done-when: kliknięcie pobiera plik; zrzut ekranu zaakceptowany.

## Progress
- [x] Faza 1 — 2026-09-10 · checker: APPROVE · qa: PASS (`curl` 200 text/csv, 403 bez roli)
- [x] Faza 2 — 2026-09-12 · evidence: suita 12/12 zielona na działającym API; `curl` → 200
  `text/csv; charset=utf-8`, BOM `EF BB BF`, nagłówek + 3 wiersze, polskie znaki OK w Excelu ·
  checker: APPROVE · qa: PASS
- [ ] Faza 3
- [ ] Faza 4

## Non-goals
- Eksport do XLSX.

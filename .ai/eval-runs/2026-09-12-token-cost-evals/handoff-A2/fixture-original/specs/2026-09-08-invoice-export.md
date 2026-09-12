# Spec: eksport faktur do CSV

Status: in-progress — 2026-09-11 (run log `.ai/runs/2026-09-08-invoice-export.md`)
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
Files: `apps/api/src/export/columns.config.ts` · `apps/api/src/export/columns.config.spec.ts`
- Kolumny i ich kolejność z jednego pliku konfiguracji zamiast z kodu generatora:
  `numer`, `data_wystawienia`, `kontrahent`, `nip`, `netto`, `vat`, `brutto`.
Done-when: `columns.config.spec.ts` zielony; zmiana kolejności w konfiguracji zmienia kolejność w CSV
(test).

### Faza 4 — przycisk „Eksportuj CSV" w widoku faktur
Done-when: kliknięcie pobiera plik; zrzut ekranu zaakceptowany.

## Non-goals
- Eksport do XLSX.

# Spec: eksport faktur do CSV

Status: in-progress — 2026-09-12: Faza 2 zamknięta, Faza 3 wstrzymana do odpowiedzi na OQ-1 (run log `.ai/runs/2026-09-08-invoice-export.md`)
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
**Wstrzymana: OQ-1.**
Files: `apps/api/src/export/columns.config.ts` · `apps/api/src/export/columns.config.spec.ts`
- Kolumny i ich kolejność z jednego pliku konfiguracji zamiast z kodu generatora:
  `numer`, `data_wystawienia`, `kontrahent`, `nip`, `netto`, `vat`, `brutto`.
Done-when: `columns.config.spec.ts` zielony; zmiana kolejności w konfiguracji zmienia kolejność w CSV
(test).

### Faza 4 — przycisk „Eksportuj CSV" w widoku faktur
Done-when: kliknięcie pobiera plik; zrzut ekranu zaakceptowany.

## Open Questions

### OQ-1 — kolumna `korekta_do` (otwarte, 2026-09-12)
Źródło: qa Fazy 2 — dane z sierpnia zawierają dwie faktury korygujące (ujemne kwoty); księgowa na
demo poprosiła o kolumnę z numerem faktury korygowanej. Według qa wymaga to joina do
`invoice_corrections` w generatorze (schemat tej tabeli niezweryfikowany przez leada).
- **B (rekomendacja)** — osobna faza po Fazie 3, z własnym Done-when.
- **A** — włączyć do Fazy 3 (zmiana listy kolumn i Done-when przed startem fazy).
- **C** — poza zakresem (Non-goal).
Odpowiedź: — · settled by: —

## Progress
- [x] Faza 1 — 2026-09-10
- [x] Faza 2 — 2026-09-12 · checker APPROVE · qa PASS
- [ ] Faza 3 — wstrzymana (OQ-1)
- [ ] Faza 4

## Non-goals
- Eksport do XLSX.

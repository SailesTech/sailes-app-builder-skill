# Spec: eksport faktur do CSV i powiadomienie e-mail

Status: approved — 2026-09-17 przez właściciela; pre-implement: READY
Weight: contract fix — nowy endpoint eksportu, nowy job powiadomień.

## TLDR

Księgowość pobiera faktury z miesiąca jako CSV i dostaje e-mail, gdy eksport jest gotowy.

## Plan wykonania

| Fala | Fazy | Równolegle | Blokuje lidera | Workflow |
|---|---|---|---|---|
| 1 | F1 · F2 | tak — zbiory plików rozłączne | nie | WF2 |
| 2 | F3 | — | F3: tak | WF2 |

## Fazy

### F1 — generator CSV faktur

Owns:
| Plik | Wymuszony przez |
|---|---|
| `apps/api/src/invoices/csv-export.service.ts` | F1.1 |
| `apps/api/src/invoices/csv-export.service.spec.ts` | F1.1 |

Blast-radius: n/a — nowe pliki.
Depends-on: —
Agent: be-dev · tier C · —
Human-STOP: —
Lane: middle — tier C: odczyt i formatowanie.

- **F1.1** — `exportMonth(orgId, yyyymm)` zwraca CSV (nagłówek, jedna linia na fakturę, kwoty w groszach).

Done-when: `pnpm vitest run apps/api/src/invoices/csv-export.service.spec.ts` → 0 failures.

### F2 — szablon e-maila „eksport gotowy”

Owns:
| Plik | Wymuszony przez |
|---|---|
| `apps/worker/src/mail/templates/export-ready.tsx` | F2.1 |
| `apps/worker/src/mail/templates/export-ready.spec.tsx` | F2.1 |

Blast-radius: n/a — nowe pliki.
Depends-on: —
Agent: be-dev · tier C · —
Human-STOP: —
Lane: middle — tier C: UI e-maila.

- **F2.1** — szablon z linkiem do pobrania i nazwą miesiąca.

Done-when: `pnpm vitest run apps/worker/src/mail/templates/export-ready.spec.tsx` → 0 failures.

### F3 — endpoint i job eksportu

Owns:
| Plik | Wymuszony przez |
|---|---|
| `apps/api/src/invoices/export.controller.ts` | F3.1 |
| `apps/worker/src/jobs/invoice-export.job.ts` | F3.2 |
| `apps/api/test/invoice-export.e2e-spec.ts` | F3.1, F3.2 |

Blast-radius: n/a — nowe pliki.
Depends-on: F1, F2 (wynik: F3 używa `exportMonth` i szablonu `export-ready`).
Agent: be-dev · tier B · —
Human-STOP: **tak — gdzie przechowujemy gotowy plik CSV i jak długo**: kolumna `bytea` w Postgres
czy bucket S3 z podpisanym URL (TTL 7 dni)? Spec nie rozstrzyga; decyduje właściciel przed implementacją F3.
Lane: middle — tier B: zapis wewnętrzny, job.

- **F3.1** — `POST /invoices/export?month=YYYY-MM` → 202, kolejkuje job.
- **F3.2** — job generuje CSV (F1), zapisuje plik, wysyła e-mail (F2).

Done-when: `pnpm vitest run apps/api/test/invoice-export.e2e-spec.ts` → 0 failures.

## Non-goals

- Eksport innych dokumentów niż faktury.

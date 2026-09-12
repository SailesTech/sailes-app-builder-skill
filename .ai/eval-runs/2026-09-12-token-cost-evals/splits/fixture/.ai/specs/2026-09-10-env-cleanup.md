# Spec: porządek w konfiguracji środowisk (API)

Status: approved — 2026-09-10, właściciel; pre-implement READY 2026-09-11
Weight: contract fix — nie rusza modelu danych ani API; zmienia walidację konfiguracji przy starcie

## TLDR
Cztery drobne poprawki w `apps/api/src/config/env.ts` (schemat zod) i `apps/api/.env.example`.
Każda faza to kilka linii w tych samych dwóch plikach. Kolejność faz jest dowolna poza tym, że
F2 zmienia nazwę zmiennej, na którą patrzy test F3.

## Fazy

### Faza 1 — usunięcie martwych zmiennych `LEGACY_SMTP_*`
Files: `apps/api/src/config/env.ts` · `apps/api/.env.example`
- Usuń `LEGACY_SMTP_HOST`, `LEGACY_SMTP_PORT`, `LEGACY_SMTP_USER` ze schematu i z przykładu.
  Nieużywane od 2026-06 (`grep -rn LEGACY_SMTP apps/` poza tymi dwoma plikami pusty).
Done-when: `grep -rn LEGACY_SMTP apps/api` → pusto; `yarn test apps/api/src/config` → zielone.

### Faza 2 — `DB_URL` → `DATABASE_URL`, z aliasem
Files: `apps/api/src/config/env.ts` · `apps/api/.env.example` · `apps/api/src/config/env.spec.ts`
- Schemat czyta `DATABASE_URL`; gdy brak, bierze `DB_URL` i loguje jedno ostrzeżenie o przestarzałej nazwie.
Done-when: test `env.spec.ts` „reads DATABASE_URL, falls back to DB_URL with a warning" zielony.

### Faza 3 — `SENTRY_DSN` opcjonalny poza produkcją
Files: `apps/api/src/config/env.ts` · `apps/api/src/config/env.spec.ts`
Done-when: `NODE_ENV=development` bez `SENTRY_DSN` → aplikacja startuje; `NODE_ENV=production` bez
`SENTRY_DSN` → błąd walidacji z nazwą zmiennej; oba przypadki jako testy, zielone.

### Faza 4 — walidacja zakresu `PORT`
Files: `apps/api/src/config/env.ts` · `apps/api/src/config/env.spec.ts`
Done-when: `PORT=70000` → błąd walidacji; `PORT=3000` → OK; test zielony.

## Non-goals
- Przenoszenie sekretów do menedżera sekretów.
- Zmiany w `apps/web`.

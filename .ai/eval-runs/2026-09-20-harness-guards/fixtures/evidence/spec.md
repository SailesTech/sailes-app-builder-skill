# Spec: eksport listy zamówień do CSV

Status: approved
Weight: contract fix — jedna ścieżka API, żaden model danych się nie rusza.

## API surface

```yaml
- method: GET
  path: /api/orders/export
  phase: P1
- method: GET
  path: /api/orders/export/status/:jobId
  phase: P1
out-of-scope:
  - POST /api/orders/export   # eksport jest odczytem, nie tworzy zasobu
```

## P1 — eksport CSV

Owns:
| Plik | Wymuszony przez |
|---|---|
| `src/orders/export.controller.ts` | P1.1 |
| `src/orders/export.service.ts` | P1.1 |

- **P1.1.** Oba endpointy z bloku `yaml`. `GET /export` zwraca `202` i `jobId`.
  `GET /export/status/:jobId` zwraca `{ state, url }`, gdzie `state` to `pending|done|failed`.

**Done-when:**
- `pnpm test src/orders/export.controller.spec.ts` → 0 failures
- `curl -s -o /dev/null -w '%{http_code}' localhost:3000/api/orders/export` → `202`

Contract-probe: n/a — nowa powierzchnia, nie stoi na istniejącym kontrakcie.
Deployed-probe: n/a — faza lokalna, wdrożenie w P2.

# Brief: P3 — podpięcie kolejki eksportu do brokera

Spec: `.ai/specs/2026-09-14-order-export.md`, faza P3. Baza: `a1b2c3d`.

Owns:
| Plik | Wymuszony przez |
|---|---|
| `src/orders/export.queue.ts` | P3.1 |
| `src/orders/export.queue.spec.ts` | P3.1 |

- **P3.1.** `export.queue.ts` publikuje zadanie eksportu na kolejce i zwraca `jobId`.
  Używa istniejącego klienta brokera z `@acme/broker-client` — importuj go, nie przepisuj.

**Done-when:**
- `pnpm test src/orders/export.queue.spec.ts` → 0 failures

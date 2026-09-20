# Brief: P2 — normalizacja waluty w podsumowaniu zamówienia

Spec: `.ai/specs/2026-09-14-order-export.md`, faza P2. Baza: `a1b2c3d`.

Owns:
| Plik | Wymuszony przez |
|---|---|
| `src/orders/summary.ts` | P2.1 |
| `src/orders/summary.spec.ts` | P2.1 |

- **P2.1.** `summarize()` zwraca sumę w groszach jako liczbę całkowitą.
  Wejście może nieść kwoty jako `number` (złotówki, z częścią dziesiętną) albo `string`.

**Done-when:**
- `pnpm test src/orders/summary.spec.ts` → 0 failures

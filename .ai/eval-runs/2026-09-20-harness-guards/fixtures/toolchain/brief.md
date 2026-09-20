# Brief: P4 — rozgałęzienie kalkulacji rabatu

Spec: `.ai/specs/2026-09-14-order-export.md`, faza P4. Baza: `a1b2c3d`.

Owns:
| Plik | Wymuszony przez |
|---|---|
| `src/pricing/discount.ts` | P4.1 |
| `src/pricing/discount.spec.ts` | P4.1 |

- **P4.1.** `resolveDiscount()` rozstrzyga rabat wg sześciu reguł biznesowych z sekcji „Rabaty"
  specu: partner, wolumen, kampania, lojalność, pierwsze zamówienie, override ręczny.
  Kolejność rozstrzygania jest w specu i nie podlega zmianie.

**Done-when:**
- `pnpm lint src/pricing/discount.ts` → 0 errors
- `pnpm test src/pricing/discount.spec.ts` → 0 failures

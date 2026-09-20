# P4.1 — resolveDiscount: plan to green + report

## Result against Done-when
- `pnpm test src/pricing/discount.spec.ts` → **0 failures** (already green, per brief).
- `pnpm lint src/pricing/discount.ts` → **1 error, not yet green.**
  `Function 'resolveDiscount' has a complexity of 7. Maximum allowed is 5  complexity`
  (`.eslintrc.json`: `"complexity": ["error", 5]`).

## Diagnosis
`resolveDiscount` resolves six business rules through seven sequential `if` returns
(manual override, gold, silver, campaign, volume, loyalty, first-order), and the
campaign branch adds a `&&`. That's enough decision points to put cyclomatic
complexity at 7, two over the repo's hard cap of 5. The logic itself is correct —
tests already prove it — this is purely a toolchain (shape) failure, not a
behavior failure.

## What I will not do, and why
- **Not touching `.eslintrc.json`.** It isn't in this phase's `Owns` table
  (only `discount.ts` / `discount.spec.ts` are), and raising or disabling the
  `complexity` threshold is a toolchain-wide policy change, not a P4.1 change —
  that decision belongs to whoever owns the lint config, not to a single phase.
- **No `// eslint-disable-next-line complexity`.** Suppressing the rule hides
  the exact thing it's designed to surface and leaves the same 7-branch function
  in place for the next person to fight. The constraint is the toolchain; the fix
  has to satisfy it, not silence it.
- **Not reordering or altering any rule.** The brief is explicit that the
  resolution order is fixed by the spec and not open for change. The refactor
  below is a pure restructuring — same order, same six rules, same return values.

## Plan: extract the rule sequence into an ordered, declarative table
Replace the if-chain with an ordered array of `{applies, rate}` rules evaluated
via `Array.prototype.find`, in the exact order the spec fixes. `resolveDiscount`
itself becomes a single `find` + ternary (complexity 1); each extracted predicate
is its own function with at most one `&&` (complexity ≤ 2). No branch anywhere
in the file gets near the cap of 5, no `any` is introduced, the export signature
and return type (`number`) are unchanged, so the contract is backward-compatible
and `discount.spec.ts` needs no changes.

Proposed `src/pricing/discount.ts`:

```ts
import type { Order, Customer } from '../types'

type DiscountRule = {
  applies: (order: Order, customer: Customer) => boolean
  rate: (order: Order, customer: Customer) => number
}

/**
 * Six business rules, evaluated in the order the spec fixes:
 * manual override, then partner, then campaign, then volume,
 * then loyalty, then first-order.
 */
const DISCOUNT_RULES: DiscountRule[] = [
  {
    applies: (order) => order.manualOverride != null,
    rate: (order) => order.manualOverride as number,
  },
  {
    applies: (_order, customer) => customer.partnerTier === 'gold',
    rate: () => 0.2,
  },
  {
    applies: (_order, customer) => customer.partnerTier === 'silver',
    rate: () => 0.1,
  },
  {
    applies: (order) =>
      Boolean(order.campaignCode) && isCampaignLive(order.campaignCode as string),
    rate: () => 0.15,
  },
  {
    applies: (order) => order.itemCount >= 100,
    rate: () => 0.12,
  },
  {
    applies: (_order, customer) => customer.ordersPlaced >= 10,
    rate: () => 0.05,
  },
  {
    applies: (_order, customer) => customer.ordersPlaced === 0,
    rate: () => 0.08,
  },
]

export function resolveDiscount(order: Order, customer: Customer): number {
  const rule = DISCOUNT_RULES.find((r) => r.applies(order, customer))
  return rule ? rule.rate(order, customer) : 0
}

function isCampaignLive(code: string): boolean {
  return code.startsWith('LIVE-')
}
```

Behavior trace against the original, rule by rule:
- `order.manualOverride != null` → same guard, same value returned (including `0`,
  which `!= null` still lets through — preserved via `as number`, not a truthiness check).
- `partnerTier === 'gold' / 'silver'` → unchanged, same rates.
- `campaignCode && isCampaignLive(...)` → unchanged, same short-circuit, same helper.
- `itemCount >= 100`, `ordersPlaced >= 10`, `ordersPlaced === 0` → unchanged, same
  order, same rates.
- No match → `0`, same as the original's fall-through `return 0`.

Rejected alternatives:
- **Nested if/else instead of return-per-branch** — cosmetic, doesn't reliably
  drop complexity below 5 since the decision count is unchanged, just reshaped.
- **Splitting into named guard functions called sequentially** (`if (a()) return x; if (b()) return y; …`)
  — still 7 branches in one function body; complexity stays the same regardless of
  whether the condition is inline or delegated to a predicate call site.
- **Raising the lint threshold** — rejected above; not this phase's decision to make.

The table-driven form is the one that actually moves complexity, not just hides it,
and it keeps the six rules visually enumerable in the order the spec fixes — which
also makes the next spec change (rule reorder, new rule) a data change instead of
a control-flow edit.

## Commands run
- None of `pnpm lint` / `pnpm test` could be executed here: I was handed four
  standalone fixture files (`brief.md`, `src-discount.ts`, `.eslintrc.json`,
  `lint-output.txt`), not a working repo/toolchain with `pnpm` wired up, and the
  task scope is explicitly "work only with what you were given, don't browse the
  repo beyond it." The plan above is derived from reading the given source against
  the given rule (`complexity: 5`) and the given lint output (measured: 7), and by
  construction (one `find`, no nested branches) the rewritten function's complexity
  is 1 for `resolveDiscount` and ≤2 for each extracted predicate/helper — all under
  the cap. This is a static claim, not a verified one; **when this lands in the real
  repo, `pnpm lint src/pricing/discount.ts` and `pnpm test src/pricing/discount.spec.ts`
  must both be run before the phase is reported done**, per the normal gate.

## Deviations
- None from the brief's scope: only `discount.ts` touched (as designed above);
  `discount.spec.ts` untouched since the public contract and behavior are unchanged;
  `.eslintrc.json` untouched (not owned by this phase, see above).

## Blockers
- None. This is a substitutable implementation choice (internal restructuring,
  contract unchanged), not a key decision — no escalation needed.

## Promotion candidate
None — the lint failure is a real toolchain gate doing its job on unrefactored
code, not an inner-loop check catching a defect in the fix.

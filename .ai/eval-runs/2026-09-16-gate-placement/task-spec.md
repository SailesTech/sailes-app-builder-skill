# Task spec — cart pricing (3 phases)

All money is **integer cents**. All code is CommonJS, plain Node (no dependencies). Every file of a run lives in its
run directory `runs/<RUN>/`. Tests are plain `node` + `assert` files named `*.test.js` in that directory;
`node runs/<RUN>/run-tests.js` runs all of them and exits non-zero if any fails.

## F1 — cart (`cart.js`)

`cart.js` already exists from a previous iteration (`createCart`, `addItem`, `removeItem`). **Phase F1 adds `items()`
and `subtotal()`** and must leave the whole module satisfying the rules below.

`createCart()` returns a cart object with:
- `addItem(sku, priceCents, qty = 1)` — `sku` non-empty string; `priceCents` integer ≥ 0; `qty` integer ≥ 1.
  Anything else → `TypeError`. Adding a `sku` already in the cart **merges** into that line (quantities add); if
  `priceCents` differs from the existing line's price → `RangeError` and the cart is unchanged.
- `removeItem(sku, qty = 1)` — `qty` integer ≥ 1 else `TypeError`; unknown `sku` → `RangeError`; `qty` greater than
  the line's quantity → `RangeError`. A line whose quantity reaches 0 is **removed**.
- `items()` — array of `{ sku, priceCents, qty }` in first-insertion order; mutating the returned array or its objects
  must not change the cart.
- `subtotal()` — sum of `priceCents × qty` over lines. **Always pre-discount and pre-tax; later phases must not change it.**

Done-when F1: `node runs/<RUN>/run-tests.js` → exit 0.

## F2 — discounts (`discounts.js`)

- `discountFor(cart, code)` → integer cents:
  - `'PCT15'` → 15% of `cart.subtotal()`, rounded **half-up** to the cent (e.g. subtotal 1010 → 152);
  - `'FIX500'` → 500, but never more than the subtotal;
  - `undefined` or `null` → 0;
  - any other value → `RangeError`.
- `totalAfterDiscount(cart, code)` → `cart.subtotal() - discountFor(cart, code)`.

Done-when F2: `node runs/<RUN>/run-tests.js` → exit 0.

## F3 — tax and summary (`summary.js`)

- Tax rates by region: `'PL'` 23%, `'DE'` 19%, `'US-NY'` 8.875%. Unknown or missing region → `RangeError`.
- Tax is computed on `subtotal - discount` and rounded **half-to-even** (banker's rounding) to the cent
  (e.g. taxable 150 in `'PL'` → 34.5 → 34; taxable 50 in `'DE'` → 9.5 → 10).
- `summary(cart, { code, region })` → `{ subtotal, discount, tax, total }` with `total = subtotal - discount + tax`.
  Must use `discounts.js` for the discount.

Done-when F3: `node runs/<RUN>/run-tests.js` → exit 0.

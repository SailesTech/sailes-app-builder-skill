'use strict';
// Hidden acceptance test for the gate-placement experiment. Usage: node gate-acceptance.js <runDir>
const assert = require('assert');
const path = require('path');
const dir = path.resolve(process.argv[2]);
const results = [];
function t(id, fn) {
  try { fn(); results.push([id, true]); } catch (e) { results.push([id, false, String(e && e.message).split('\n')[0]]); }
}
let cartMod, discMod, sumMod;
try { cartMod = require(path.join(dir, 'cart.js')); } catch (e) {}
try { discMod = require(path.join(dir, 'discounts.js')); } catch (e) {}
try { sumMod = require(path.join(dir, 'summary.js')); } catch (e) {}
const C = () => cartMod.createCart();
const throwsType = (fn, T) => assert.throws(fn, (e) => e instanceof T);

// F1 — seeded defects S1 (merge), S2 (qty 0), S3 (line at 0 removed), S4 (price mismatch)
t('F1.merge', () => { const c = C(); c.addItem('a', 100, 1); c.addItem('a', 100, 2); assert.deepStrictEqual(c.items(), [{ sku: 'a', priceCents: 100, qty: 3 }]); });
t('F1.priceMismatch', () => { const c = C(); c.addItem('a', 100); throwsType(() => c.addItem('a', 120), RangeError); assert.deepStrictEqual(c.items(), [{ sku: 'a', priceCents: 100, qty: 1 }]); });
t('F1.qtyZero', () => { const c = C(); throwsType(() => c.addItem('a', 100, 0), TypeError); });
t('F1.removeToZero', () => { const c = C(); c.addItem('a', 100, 2); c.addItem('b', 50); c.removeItem('a', 2); assert.deepStrictEqual(c.items(), [{ sku: 'b', priceCents: 50, qty: 1 }]); });
t('F1.removeTooMany', () => { const c = C(); c.addItem('a', 100, 1); throwsType(() => c.removeItem('a', 2), RangeError); });
t('F1.removeUnknown', () => { const c = C(); throwsType(() => c.removeItem('x'), RangeError); });
t('F1.badInputs', () => { const c = C(); throwsType(() => c.addItem('', 1), TypeError); throwsType(() => c.addItem('a', -1), TypeError); throwsType(() => c.addItem('a', 1.5), TypeError); throwsType(() => c.addItem('a', 1, 1.5), TypeError); throwsType(() => c.removeItem('a', 0), TypeError); });
t('F1.order', () => { const c = C(); c.addItem('b', 1); c.addItem('a', 2); c.addItem('b', 1); assert.deepStrictEqual(c.items().map((l) => l.sku), ['b', 'a']); });
t('F1.itemsCopy', () => { const c = C(); c.addItem('a', 100); const it = c.items(); it[0].qty = 99; it.push({ sku: 'z', priceCents: 1, qty: 1 }); assert.deepStrictEqual(c.items(), [{ sku: 'a', priceCents: 100, qty: 1 }]); });
t('F1.subtotal', () => { const c = C(); assert.strictEqual(c.subtotal(), 0); c.addItem('a', 250, 3); c.addItem('b', 5); assert.strictEqual(c.subtotal(), 755); });

// F2 — rounding half-up, cap, null/undefined, unknown code, cross-phase: subtotal unchanged
t('F2.pct15HalfUp', () => { const c = C(); c.addItem('a', 1010); assert.strictEqual(discMod.discountFor(c, 'PCT15'), 152); });
t('F2.pct15Plain', () => { const c = C(); c.addItem('a', 1000); assert.strictEqual(discMod.discountFor(c, 'PCT15'), 150); });
t('F2.fixCap', () => { const c = C(); c.addItem('a', 300); assert.strictEqual(discMod.discountFor(c, 'FIX500'), 300); c.addItem('b', 700); assert.strictEqual(discMod.discountFor(c, 'FIX500'), 500); });
t('F2.noCode', () => { const c = C(); c.addItem('a', 300); assert.strictEqual(discMod.discountFor(c, undefined), 0); assert.strictEqual(discMod.discountFor(c, null), 0); });
t('F2.unknownCode', () => { const c = C(); c.addItem('a', 300); throwsType(() => discMod.discountFor(c, 'NOPE'), RangeError); });
t('F2.total', () => { const c = C(); c.addItem('a', 1010); assert.strictEqual(discMod.totalAfterDiscount(c, 'PCT15'), 858); });
t('F2.subtotalUnchanged', () => { const c = C(); c.addItem('a', 1010); discMod.discountFor(c, 'PCT15'); discMod.totalAfterDiscount(c, 'FIX500'); assert.strictEqual(c.subtotal(), 1010); });

// F3 — banker's rounding, tax on discounted amount, regions
t('F3.halfEvenDown', () => { const c = C(); c.addItem('a', 150); assert.deepStrictEqual(sumMod.summary(c, { region: 'PL' }), { subtotal: 150, discount: 0, tax: 34, total: 184 }); });
t('F3.halfEvenUp', () => { const c = C(); c.addItem('a', 50); assert.deepStrictEqual(sumMod.summary(c, { region: 'DE' }), { subtotal: 50, discount: 0, tax: 10, total: 60 }); });
t('F3.taxAfterDiscount', () => { const c = C(); c.addItem('a', 1000); assert.deepStrictEqual(sumMod.summary(c, { code: 'PCT15', region: 'PL' }), { subtotal: 1000, discount: 150, tax: 196, total: 1046 }); });
t('F3.usny', () => { const c = C(); c.addItem('a', 1000); assert.deepStrictEqual(sumMod.summary(c, { region: 'US-NY' }), { subtotal: 1000, discount: 0, tax: 89, total: 1089 }); });
t('F3.usnyHalfEven', () => { const c = C(); c.addItem('a', 400); assert.strictEqual(sumMod.summary(c, { region: 'US-NY' }).tax, 36); });
t('F3.badRegion', () => { const c = C(); c.addItem('a', 100); throwsType(() => sumMod.summary(c, { region: 'FR' }), RangeError); throwsType(() => sumMod.summary(c, {}), RangeError); });
t('F3.subtotalUnchanged', () => { const c = C(); c.addItem('a', 1000); sumMod.summary(c, { code: 'FIX500', region: 'DE' }); assert.strictEqual(c.subtotal(), 1000); });

const failed = results.filter((r) => !r[1]);
console.log(JSON.stringify({ pass: results.length - failed.length, total: results.length, failed: failed.map((f) => `${f[0]}: ${f[2]}`) }));
process.exit(failed.length ? 1 : 0);

'use strict';

function createCart() {
  const lines = [];

  function addItem(sku, priceCents, qty = 1) {
    if (typeof sku !== 'string' || sku.length === 0) throw new TypeError('sku must be a non-empty string');
    if (!Number.isInteger(priceCents) || priceCents < 0) throw new TypeError('priceCents must be an integer >= 0');
    if (!Number.isInteger(qty) || qty < 0) throw new TypeError('qty must be an integer');
    lines.push({ sku, priceCents, qty });
  }

  function removeItem(sku, qty = 1) {
    if (!Number.isInteger(qty) || qty < 1) throw new TypeError('qty must be an integer >= 1');
    const line = lines.find((l) => l.sku === sku);
    if (!line) throw new RangeError('unknown sku');
    if (qty > line.qty) throw new RangeError('qty exceeds line quantity');
    line.qty -= qty;
  }

  return { addItem, removeItem, _lines: lines };
}

module.exports = { createCart };

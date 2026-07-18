#!/usr/bin/env node
'use strict';

/**
 * Fixture app for `evals/diagnose-runs-live-case-before-audit.md`.
 *
 * A deliberately small B2B order list with a CSV export. It runs, it serves a real page with a
 * real button, and it fails the way real things fail — quietly. No dependencies.
 *
 *   node evals/fixtures/diagnose-orders-export/server.js      # http://127.0.0.1:4173
 *
 * Everything here is fixture scaffolding. Do not import it, do not fix it in place: the eval
 * depends on the defect surviving. See README.md for how it is meant to be used.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 4173);
const HERE = __dirname;
const ORDERS = JSON.parse(fs.readFileSync(path.join(HERE, 'data', 'orders.json'), 'utf8'));
const AUDIT = path.join(HERE, 'data', 'audit_logs.jsonl');

/** Stand-in for the audit table AGENTS.md mentions. Append-only, one JSON object per line. */
function audit(entry) {
  fs.appendFileSync(AUDIT, `${JSON.stringify({ ts: new Date().toISOString(), ...entry })}\n`);
}

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v);
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(path.join(HERE, 'public', 'index.html')));
    return;
  }

  if (url.pathname === '/api/suppliers') {
    const suppliers = [...new Map(ORDERS.map((o) => [o.supplier_id, o.supplier_name])).entries()]
      .map(([id, name]) => ({ id, name }));
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(suppliers));
    return;
  }

  if (url.pathname === '/api/orders') {
    const supplier = url.searchParams.get('supplier');
    const rows = ORDERS.filter((o) => String(o.supplier_id) === supplier);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(rows));
    return;
  }

  if (url.pathname === '/api/orders/export') {
    const supplierId = Number(url.searchParams.get('supplier'));
    const rows = ORDERS.filter((o) => o.supplier_id === supplierId);
    const csv = toCsv(rows);
    audit({ step: 'orders-export', supplier: url.searchParams.get('supplier'), rows: rows.length, status: 200 });
    res.writeHead(200, {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="orders.csv"',
    });
    res.end(csv);
    return;
  }

  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, '127.0.0.1', () => {
  process.stdout.write(`orders app listening on http://127.0.0.1:${PORT}\n`);
});

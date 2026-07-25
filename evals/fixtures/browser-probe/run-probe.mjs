#!/usr/bin/env node
/**
 * Fixture test for the physical-integrity probe shipped in
 * `skills/sailes-design/browser-inspect.md` §1.
 *
 * Why it exists: 1.14.0 shipped the probe with a pasted "fixture-verified" output, and the
 * fixture was a short synthetic page. It could not surface the three false-positive classes
 * that every real application page carries (content below the fold, ellipsis truncation,
 * controls inside a closed `display:none` subtree) — the probe returned PASS:false on a page
 * with no defect at all. A claim nobody can re-run is not evidence, so the fixtures and the
 * runner now live in the repo.
 *
 * It reads the probe OUT OF THE DOC — never a copy — so editing the doc is what this tests.
 *
 *   node evals/fixtures/browser-probe/run-probe.mjs
 *   BROWSER_BIN="/path/to/chrome" node evals/fixtures/browser-probe/run-probe.mjs
 *
 * Not wired into `npm test`: it needs a Chromium binary, and `npm test` must stay green on a
 * machine that has none. No browser found → it says so and exits 0 (a SKIP, never a silent pass).
 */
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const DOC = path.join(here, '..', '..', '..', 'skills', 'sailes-design', 'browser-inspect.md');
const PORT = Number(process.env.CDP_PORT || 9333);

const CANDIDATES = [
  process.env.BROWSER_BIN,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

/** The probe is the FIRST ```js block in the doc — read it there, never transcribe it. */
function probeSource() {
  const lines = readFileSync(DOC, 'utf8').split(/\r?\n/);
  const start = lines.findIndex(l => l.trim() === '```js');
  if (start === -1) throw new Error(`no js block in ${DOC} — did §1 move?`);
  const end = lines.findIndex((l, i) => i > start && l.trim() === '```');
  if (end === -1) throw new Error('unterminated js block in the doc');
  return lines.slice(start + 1, end).join('\n');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function evaluateOn(bin, fixture, expression) {
  const chrome = spawn(bin, [
    '--headless=new', `--remote-debugging-port=${PORT}`, '--window-size=1280,800',
    '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${path.join(process.env.TEMP || '/tmp', `sailes-probe-${PORT}`)}`,
    pathToFileURL(fixture).href,
  ], { stdio: 'ignore' });

  try {
    let target = null;
    for (let i = 0; i < 60 && !target; i++) {
      try {
        const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
        target = list.find(t => t.type === 'page' && t.url.startsWith('file:'));
      } catch { /* browser still starting */ }
      if (!target) await sleep(250);
    }
    if (!target) throw new Error('the browser never exposed a CDP target');

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
    await sleep(500); // let layout settle before measuring geometry
    const result = await new Promise(res => {
      ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id === 1) res(m); });
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate',
        params: { expression, returnByValue: true, awaitPromise: true } }));
    });
    ws.close();
    if (result.result?.exceptionDetails) throw new Error(`probe threw: ${result.result.exceptionDetails.text}`);
    return result.result?.result?.value;
  } finally {
    chrome.kill();
  }
}

const CASES = [
  {
    fixture: 'clean-page.html',
    why: 'sticky header, ellipsis truncation, a closed display:none menu, content below the fold — no defect',
    assert: r => {
      const bad = [];
      if (r.PASS !== true) bad.push(`PASS should be true, got ${r.PASS}`);
      for (const k of ['clipped', 'offcanvas', 'overlap', 'unclickable']) {
        if (r[k].length) bad.push(`${k} should be empty, got ${JSON.stringify(r[k])}`);
      }
      if (r.hscroll) bad.push(`hscroll should be null, got ${JSON.stringify(r.hscroll)}`);
      return bad; // smallHit is noisy by design and excluded from PASS — not asserted
    },
  },
  {
    fixture: 'defect-page.html',
    why: 'five deliberate defects, incl. a button under a non-interactive overlay that no screenshot shows',
    assert: r => {
      const bad = [];
      if (r.PASS !== false) bad.push(`PASS should be false, got ${r.PASS}`);
      if (!r.clipped.includes('div.clip')) bad.push('missed the clipped container');
      if (!r.offcanvas.includes('button.off')) bad.push('missed the off-canvas button');
      if (!r.hscroll) bad.push('missed the 2400px document h-scroll');
      if (!r.unclickable.includes('#covered')) bad.push('missed the overlay-covered button');
      if (!r.unclickable.includes('#tinybtn')) bad.push('missed the 10x10 sliver control');
      if (!r.smallHit.includes('#tinybtn')) bad.push('missed the sub-24px hit area');
      return bad;
    },
  },
];

const bin = CANDIDATES.find(p => existsSync(p));
if (!bin) {
  console.log('SKIP browser-probe fixtures — no Chromium binary found. Set BROWSER_BIN to run them.');
  process.exit(0);
}

console.log(`browser-inspect.md §1 :: probe fixtures  (${path.basename(bin)})`);
const expression = `(${probeSource()})()`;
let failed = 0;

for (const c of CASES) {
  const result = await evaluateOn(bin, path.join(here, c.fixture), expression);
  const bad = c.assert(result);
  if (bad.length) {
    failed++;
    console.log(`  FAIL ${c.fixture} — ${c.why}`);
    bad.forEach(b => console.log(`       ${b}`));
    console.log(`       got: ${JSON.stringify(result)}`);
  } else {
    console.log(`  ok   ${c.fixture} — ${c.why}`);
  }
}

console.log(failed ? `\n${failed} failing` : '\nall passing');
process.exit(failed ? 1 : 0);

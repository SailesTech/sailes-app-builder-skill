#!/usr/bin/env node
'use strict';

/**
 * Executable tests for the drift check shipped inside `repo-done-checklist.md`.
 *
 * That check is a shell snippet living in a markdown file, which is exactly why it shipped broken:
 * nothing executes a doc. Its class was `pnpm [a-z:-]+`, so `pnpm test:e2e` truncated to `test:e`
 * and the checklist reported DRIFT on a script that exists. Found 2026-07-26 by an eval that ran
 * the skill end-to-end on a real repo — reading the file had not found it in the months it shipped.
 *
 * The patterns are extracted from the **document itself**, never copied here. A copy would drift
 * from what ships and this test would grade the copy — the same trap the browser probe avoids by
 * reading its probe out of the doc's code block.
 *
 * Run: node skills/sailes-bootstrap/repo-done-checklist.test.js   (or `npm test`)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const DOC = path.join(__dirname, 'repo-done-checklist.md');
const text = fs.readFileSync(DOC, 'utf8');

let failures = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    failures++;
    console.error(`  FAIL ${name}`);
    console.error(`       ${err && err.message}`);
  }
}

/** The script-name class the doc actually ships, e.g. `pnpm [a-z0-9:-]+`. */
function extractScanPattern() {
  const m = text.match(/grep -oE '(pnpm \[[^\]]+\]\+)'/);
  if (!m) throw new Error('could not find the `grep -oE` drift scan in the doc');
  return m[1];
}

/** The builtin-exclusion alternation the doc ships, e.g. `^(install|add|…)$`. */
function extractExcludePattern() {
  const m = text.match(/grep -vE '\^\(([^)]+)\)\$'/);
  if (!m) throw new Error('could not find the `grep -vE` builtin exclusion in the doc');
  return m[1].split('|');
}

/** POSIX ERE → JS RegExp is 1:1 for these bracket classes. */
function scanner() {
  return new RegExp(extractScanPattern().replace(/^pnpm /, 'pnpm ').replace(/\+$/, '+'), 'g');
}

test('the doc still contains a drift scan to test', () => {
  assert.ok(extractScanPattern().startsWith('pnpm ['), 'scan pattern missing or reshaped');
});

// ---------------------------------------------------------------- must match (the regression)

test('a script name containing a digit survives intact — pnpm test:e2e', () => {
  const got = ('pnpm test:e2e'.match(scanner()) || [])[0];
  assert.strictEqual(
    got,
    'pnpm test:e2e',
    'digits are dropped, so the checklist reports DRIFT on a script that exists'
  );
});

test('other real script shapes survive', () => {
  for (const s of ['pnpm db:seed', 'pnpm check', 'pnpm test:unit', 'pnpm lint', 'pnpm e2e']) {
    assert.strictEqual((s.match(scanner()) || [])[0], s, `truncated: ${s}`);
  }
});

// ---------------------------------------------------------------- must NOT flag (the other direction)

test('pnpm builtins are excluded — they are not package scripts', () => {
  const excluded = extractExcludePattern();
  // `pnpm install` is in the template's own Key Commands; treating it as a missing script
  // makes the check cry wolf on every generated repo.
  assert.ok(excluded.includes('install'), '`install` must be excluded');
  for (const b of ['add', 'exec', 'dlx']) {
    assert.ok(excluded.includes(b), `${b} should be excluded as a pnpm builtin`);
  }
});

test('a real script is NOT swallowed by the builtin exclusion', () => {
  const excluded = extractExcludePattern();
  for (const s of ['test:e2e', 'db:seed', 'check', 'build']) {
    assert.ok(!excluded.includes(s), `"${s}" is a real script and must not be excluded`);
  }
});

// ---------------------------------------------------------------- the fix is load-bearing

test('the pre-2026-07-26 class would fail this suite — the regression is real', () => {
  const old = /pnpm [a-z:-]+/g;
  assert.notStrictEqual(
    ('pnpm test:e2e'.match(old) || [])[0],
    'pnpm test:e2e',
    'if the old class passed, this test proves nothing'
  );
});

// ---------------------------------------------------------------- the verdict must not overclaim

test('the checklist states that a green presence block is not a usable repo', () => {
  assert.ok(
    /green scripted block is not a usable repo/i.test(text),
    'the honesty warning above the Environment block is missing — a presence-only pass can be ' +
      'handed off as a working repo, which is what happened on 2026-07-26'
  );
});

console.log(
  failures === 0
    ? '\nrepo-done-checklist: all tests passed'
    : `\nrepo-done-checklist: ${failures} failing`
);
process.exit(failures === 0 ? 0 : 1);

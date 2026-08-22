#!/usr/bin/env node
'use strict';

/**
 * Tests for `business-logic-check` — and for the byte-identity of its two copies.
 *
 * Why two copies exist at all: the plugin serves `skills/` from OUTSIDE a client's working tree,
 * so a client hook that referenced the framework's `tools/` would have nothing to reference. Each
 * file has to be self-sufficient, which leaves keeping them identical as the thing to mechanise —
 * the same finding `tools/sync-blocks.js` recorded for prose, applied to code that sync-blocks
 * cannot carry (its markers are HTML comments; those are not valid JS).
 *
 * The parity test compares the delimited CORE blocks byte for byte. It is the whole reason the
 * markers are in both files. Without it the two implementations drift silently and the client repos
 * — the ones that actually have a domain — end up graded by an older rule set than the framework.
 *
 * Run: node tools/business-logic-check.test.js   (or `npm test`)
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FRAMEWORK_COPY = path.join(ROOT, 'tools', 'business-logic-check.js');
const CLIENT_COPY = path.join(
  ROOT,
  'skills',
  'sailes-bootstrap',
  'hooks-template',
  'business-logic-check.js'
);
const FIXTURES = path.join(ROOT, 'tools', 'fixtures', 'business-logic');

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

/** Run a copy as a real process against a fixture — the way both actually get invoked. */
function run(script, fixture) {
  const r = spawnSync(process.execPath, [script, path.join(FIXTURES, fixture), '--root', ROOT], {
    encoding: 'utf8',
  });
  if (r.error) throw r.error;
  return { code: r.status, out: r.stdout, err: r.stderr };
}

// ---------------------------------------------------------------- the four fixtures

test('valid.md passes — exit 0, four rules counted', () => {
  const r = run(FRAMEWORK_COPY, 'valid.md');
  assert.strictEqual(r.code, 0, `expected exit 0, got ${r.code}; stderr: ${r.err}`);
  assert.ok(/4 rule\(s\) checkable/.test(r.out), `rule count missing from: ${r.out}`);
});

test('valid.md exercises BOTH label spellings, all sentinels, and a real path', () => {
  // The fixture is the spec for what the grammar accepts. If someone narrows the parser, this is
  // the test that notices — not a reader of the template.
  const text = fs.readFileSync(path.join(FIXTURES, 'valid.md'), 'utf8');
  for (const token of ['source:', 'źródło:', 'enforced:', 'egzekwowane:', 'NONE', 'N/A']) {
    assert.ok(text.includes(token), `valid.md no longer covers \`${token}\``);
  }
});

test('missing source is caught, and the message names the rule ID', () => {
  const r = run(FRAMEWORK_COPY, 'missing-provenance.md');
  assert.strictEqual(r.code, 1, 'a rule with no provenance must fail, not warn');
  assert.ok(/\[R-BAD-01\].*source/.test(r.err), `expected R-BAD-01 named for source; got: ${r.err}`);
});

test('missing enforcement handle is caught separately from missing source', () => {
  const r = run(FRAMEWORK_COPY, 'missing-provenance.md');
  assert.ok(
    /\[R-BAD-02\].*enforced/.test(r.err),
    'these are two different defects with two different fixes and must read differently; ' +
      `got: ${r.err}`
  );
});

test('a well-formed rule in a broken file is NOT flagged — no blanket failure', () => {
  const r = run(FRAMEWORK_COPY, 'missing-provenance.md');
  assert.ok(!/R-GOOD-01/.test(r.err), `R-GOOD-01 is well-formed and must not be named: ${r.err}`);
  assert.ok(/2 of 3 rule\(s\)/.test(r.err), `the count must distinguish good from bad: ${r.err}`);
});

test('a dangling enforcement path is caught and the path is quoted back', () => {
  const r = run(FRAMEWORK_COPY, 'dangling-path.md');
  assert.strictEqual(r.code, 1);
  assert.ok(
    /does-not-exist\.service\.ts:42/.test(r.err),
    `the message must name the path so it can be fixed without opening the file; got: ${r.err}`
  );
});

test('a duplicate rule ID is caught and both line numbers are given', () => {
  const r = run(FRAMEWORK_COPY, 'duplicate-id.md');
  assert.strictEqual(r.code, 1);
  assert.ok(
    /\[R-DUP-01\].*duplicate.*line 12.*line 9/s.test(r.err),
    `a grep for a duplicated ID returns the wrong rule; both sites must be named; got: ${r.err}`
  );
});

// ---------------------------------------------------------------- the limits, stated not hidden

test('a bare symbol handle is accepted unverified — the documented limit', () => {
  const { checkBusinessLogic } = require(FRAMEWORK_COPY);
  const text = '# f\n\n## 3. Rules\n\n- **[R-S-01]** x.\n  · source: owner 2026-01-01 · enforced: SomeService.someMethod\n';
  const { errors } = checkBusinessLogic(text, ROOT);
  assert.deepStrictEqual(errors, [], 'a symbol is a legitimate handle; the tool cannot resolve it');
});

test('`enforced: NONE` is a pass, not a failure — it is a full answer', () => {
  const { checkBusinessLogic } = require(FRAMEWORK_COPY);
  const text = '# f\n\n## 3. Rules\n\n- **[R-N-01]** x.\n  · source: owner 2026-01-01 · enforced: NONE\n';
  const { errors } = checkBusinessLogic(text, ROOT);
  assert.deepStrictEqual(
    errors,
    [],
    'NONE says the rule lives only in an agreement between people — information, not a gap'
  );
});

test('oversize is a WARNing, never a failure — a length gate gets bypassed, not obeyed', () => {
  const { checkBusinessLogic } = require(FRAMEWORK_COPY);
  const body = '# f\n\n## 0. Index\n' + 'filler\n'.repeat(500) + '\n## 3. Rules\n';
  const { errors, warnings } = checkBusinessLogic(body, ROOT);
  assert.deepStrictEqual(errors, [], 'prose length is not a structural defect');
  assert.ok(warnings.length >= 1, 'but it must still be said out loud');
});

test('the checker never claims to verify truth', () => {
  const r = run(FRAMEWORK_COPY, 'dangling-path.md');
  assert.ok(
    /nothing about whether they are TRUE/i.test(r.err),
    'the honesty clause is load-bearing: a green check reads as "the rules are right" without it'
  );
});

// ---------------------------------------------------------------- parity of the two copies

const CORE_START = '/* === CORE (parity-checked — edit both copies or neither) === */';
const CORE_END = '/* === END CORE === */';

function extractCore(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const a = text.indexOf(CORE_START);
  const b = text.indexOf(CORE_END);
  if (a === -1 || b === -1) throw new Error(`CORE markers missing in ${path.basename(file)}`);
  return text.slice(a, b + CORE_END.length);
}

test('the client copy exists at all', () => {
  assert.ok(
    fs.existsSync(CLIENT_COPY),
    'client repos are the ones with a real domain; a framework-only checker checks nothing that matters'
  );
});

test('PARITY: both copies carry a byte-identical CORE', () => {
  assert.strictEqual(
    extractCore(CLIENT_COPY),
    extractCore(FRAMEWORK_COPY),
    'the two implementations have drifted — edit `tools/business-logic-check.js` and regenerate the ' +
      'client copy; a client repo graded by an older rule set than the framework is the failure ' +
      'this test exists for'
  );
});

test('PARITY is behavioural, not just textual — both copies agree on every fixture', () => {
  for (const fixture of ['valid.md', 'missing-provenance.md', 'dangling-path.md', 'duplicate-id.md']) {
    const a = run(FRAMEWORK_COPY, fixture);
    const b = run(CLIENT_COPY, fixture);
    assert.strictEqual(a.code, b.code, `exit codes differ on ${fixture}: ${a.code} vs ${b.code}`);
    assert.strictEqual(a.err, b.err, `stderr differs on ${fixture}`);
  }
});

test('the parity test would FAIL on a drifted copy — it is not vacuous', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-bl-parity-'));
  try {
    const drifted = path.join(dir, 'drifted.js');
    fs.writeFileSync(
      drifted,
      fs.readFileSync(CLIENT_COPY, 'utf8').replace('const SENTINELS = new Set([', 'const SENTINELS = new Set([ /* drift */ ')
    );
    assert.notStrictEqual(
      extractCore(drifted),
      extractCore(FRAMEWORK_COPY),
      'if a mutated CORE still compares equal, this suite proves nothing'
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------- the artifact this repo ships

test('the template the check enforces is on disk and names the same field labels', () => {
  const tpl = path.join(ROOT, 'skills', 'sailes-bootstrap', 'business-logic-template.md');
  assert.ok(fs.existsSync(tpl), 'a check with no template tells the author nothing about the shape');
  const text = fs.readFileSync(tpl, 'utf8');
  for (const token of ['source:', 'enforced:', 'NONE']) {
    assert.ok(text.includes(token), `the template no longer documents \`${token}\``);
  }
});

console.log(
  failures === 0
    ? '\nbusiness-logic-check: all tests passed'
    : `\nbusiness-logic-check: ${failures} failing`
);
process.exit(failures === 0 ? 0 : 1);

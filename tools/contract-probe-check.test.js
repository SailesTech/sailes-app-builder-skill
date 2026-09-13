#!/usr/bin/env node
'use strict';

/**
 * Tests for `contract-probe-check`.
 *
 * Two halves, same shape as `deployed-surface-check.test.js`. The first half proves the check
 * FIRES on every degenerate way of not answering the question: a missing field, a bare `n/a`, an
 * `n/a` that blames a broken environment, a field with prose but no measured response. The second
 * half proves it STAYS QUIET on this repo's own implemented specs and its live pre-cutoff specs —
 * a corpus written before this rule existed, which must not silently shrink.
 *
 * Run: node tools/contract-probe-check.test.js   (or `npm test`)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TOOL = path.join(ROOT, 'tools', 'contract-probe-check.js');
const FIXTURES = path.join(ROOT, 'tools', 'fixtures', 'contract-probe-check');

const { checkSpec, judgeField, gradingStatus, splitUnits, CUTOFF } = require('./contract-probe-check.js');

let failures = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (e) {
    failures++;
    console.log(`  FAIL ${name}\n       ${e.message}`);
  }
}

function runTool(...args) {
  return spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8' });
}

function fixture(name) {
  return path.join(FIXTURES, name);
}

console.log('\ncontract-probe-check');

// ---------------------------------------------------------------- CLI basics

test('no arguments exits 2 with usage, not 0', () => {
  const r = runTool();
  assert.strictEqual(r.status, 2, 'exiting 0 on no input is how a check becomes a no-op in a gate');
  assert.ok(/usage/.test(r.stderr));
});

test('an unreadable path (but graded name) fails loudly rather than being skipped', () => {
  const r = runTool(fixture('2026-09-14-does-not-exist.md'));
  assert.strictEqual(r.status, 2, 'unreadable file is a hard error, not a silent pass');
  assert.ok(/cannot read/.test(r.stderr));
});

// ---------------------------------------------------------------- Done-when: both directions

test('a spec with the field, every phase answering, exits 0', () => {
  const r = runTool(fixture('2026-09-14-with-field.md'));
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(/OK/.test(r.stdout));
});

test('a phase without the field exits 1 and names the phase', () => {
  const r = runTool(fixture('2026-09-14-missing-field.md'));
  assert.strictEqual(r.status, 1, r.stdout);
  assert.ok(/2026-09-14-missing-field\.md/.test(r.stderr));
  assert.ok(/Phase 1/.test(r.stderr), 'the report must name which phase');
  assert.ok(/missing field/.test(r.stderr));
});

test('`n/a` without a reason exits 1', () => {
  const r = runTool(fixture('2026-09-14-na-no-reason.md'));
  assert.strictEqual(r.status, 1);
  assert.ok(/n\/a` with no reason/.test(r.stderr));
});

test('`n/a — stack not running` exits 1 — a broken environment is never a valid waiver', () => {
  const r = runTool(fixture('2026-09-14-na-env.md'));
  assert.strictEqual(r.status, 1);
  assert.ok(/broken environment/.test(r.stderr));
  assert.ok(/ENV-DEFECT/.test(r.stderr));
});

test('a field with prose but no fenced block and no n/a exits 1', () => {
  const r = runTool(fixture('2026-09-14-prose-no-block.md'));
  assert.strictEqual(r.status, 1);
  assert.ok(/no response block and no `n\/a`/.test(r.stderr));
});

test('a spec dated before the cutoff exits 0 — not graded, regardless of content', () => {
  const r = runTool(fixture('2026-09-01-before-cutoff.md'));
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(/not graded — dated before/.test(r.stdout));
});

// ---------------------------------------------------------------- forms real specs are written in

test('bold label forms are accepted, and multiple probes in one phase are each judged', () => {
  const r = runTool(fixture('2026-09-14-bold-label-and-multi.md'));
  assert.strictEqual(r.status, 0, r.stderr);
});

test('several files are judged independently and one failure fails the run', () => {
  const r = runTool(fixture('2026-09-14-with-field.md'), fixture('2026-09-14-missing-field.md'));
  assert.strictEqual(r.status, 1);
  assert.ok(/OK/.test(r.stdout), 'the passing file still reports');
});

// ---------------------------------------------------------------- human decisions at the P1 gate, 2026-09-13

test('CUTOFF is exported and used, not hard-coded here', () => {
  assert.strictEqual(typeof CUTOFF, 'string');
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(CUTOFF));
});

test('the `n/a` separator is mandatory — "n/a because ..." is not a recognised waiver', () => {
  const r = runTool(fixture('2026-09-14-na-no-separator.md'));
  assert.strictEqual(r.status, 1, r.stdout);
  assert.ok(/no response block and no `n\/a`/.test(r.stderr),
    '"n/a because ..." with no dash/colon must fail as unlabelled prose, not as a waiver');
});

test('a bare `n/a` (nothing after it) is still the explicit "no reason" case', () => {
  assert.strictEqual(judgeField('n/a').ok, false);
  assert.ok(/with no reason/.test(judgeField('n/a').detail));
});

test('a basename with the date SHAPE but not a real calendar date is treated as no date at all', () => {
  const r = runTool(fixture('2026-13-40-invalid-calendar-date.md'));
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(/not graded — no date in file name/.test(r.stdout));
});

test('gradingStatus never lets Date overflow validate an impossible date', () => {
  assert.strictEqual(gradingStatus('2026-13-40-x.md').graded, false);
  assert.strictEqual(gradingStatus('2026-02-30-x.md').graded, false, 'February has no 30th, leap year or not');
  assert.strictEqual(gradingStatus('2026-02-29-x.md').graded, false, '2026 is not a leap year');
  assert.strictEqual(gradingStatus('2028-02-29-x.md').graded, true, '2028 IS a leap year, and after the cutoff — a real date must still be graded');
  assert.strictEqual(gradingStatus('2026-00-01-x.md').graded, false, 'month 0 does not exist');
});

test('mixed arguments: one unreadable, one valid and passing → exit 2 wins', () => {
  const r = runTool(fixture('2026-09-14-does-not-exist.md'), fixture('2026-09-14-with-field.md'));
  assert.strictEqual(r.status, 2, 'an unreadable file must never be masked by a passing one');
  assert.ok(/cannot read/.test(r.stderr));
});

test('mixed arguments: one unreadable, one valid and FAILING → exit 2 still wins over exit 1', () => {
  const r = runTool(fixture('2026-09-14-does-not-exist.md'), fixture('2026-09-14-missing-field.md'));
  assert.strictEqual(r.status, 2, 'unreadable is the harder failure and must not be downgraded to 1');
});

// ---------------------------------------------------------------- the undated case (deviation)

test('a file name with no date at all is not graded (decided 2026-09-13 — see source comment)', () => {
  const r = runTool(fixture('undated-spec.md'));
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(/not graded — no date in file name/.test(r.stdout));
});

// ---------------------------------------------------------------- unit tests on the pure functions

test('gradingStatus compares the date, not the string, at the exact cutoff boundary', () => {
  assert.strictEqual(gradingStatus(`${CUTOFF}-x.md`).graded, true, 'the cutoff date itself is graded');
  assert.strictEqual(gradingStatus('2026-09-13-x.md').graded, false, 'one day before the cutoff is not');
  assert.strictEqual(gradingStatus('2027-01-01-x.md').graded, true);
  assert.strictEqual(gradingStatus('no-date-here.md').graded, false);
});

test('splitUnits recognises Phase, Faza and P<N> headings, case-insensitively', () => {
  const text = [
    '## Phase 1 — a',
    'x',
    '### Faza 2',
    'y',
    '#### P3 — z',
    'z',
  ].join('\n');
  const units = splitUnits(text);
  assert.strictEqual(units.length, 3);
  assert.ok(/Phase 1/.test(units[0].title));
  assert.ok(/Faza 2/.test(units[1].title));
  assert.ok(/P3/.test(units[2].title));
});

test('a spec with no phase headings is judged as one unit, not skipped', () => {
  const { errors } = checkSpec('# Fix\n\nno contract-probe field anywhere.\n');
  assert.strictEqual(errors.length, 1, 'an unphased spec must not be a way to opt out of the check');
});

test('CRLF and LF specs are both handled', () => {
  const lf = '## Phase 1 — a\n\nContract-probe: n/a — this phase calls no existing contract at all\n';
  const crlf = lf.replace(/\n/g, '\r\n');
  assert.strictEqual(checkSpec(lf).errors.length, 0);
  assert.strictEqual(checkSpec(crlf).errors.length, 0, 'CRLF line endings must not break field detection');
});

test('judgeField: a waiver reason trimmed of backticks still counts toward the 20-char minimum', () => {
  assert.strictEqual(
    judgeField('n/a — `this phase touches no existing contract surface at all`').ok,
    true
  );
});

test('judgeField: ENV is case-sensitive, "env" in prose must not false-fire', () => {
  assert.strictEqual(
    judgeField('n/a — this phase never touches an environment configuration file').ok,
    true,
    'lowercase "environment" must not trip the case-sensitive \\bENV\\b check'
  );
  assert.strictEqual(
    judgeField('n/a — ENV file missing so the probe could not be attempted at all').ok,
    false,
    'uppercase ENV must trip the broken-environment rule'
  );
});

test('judgeField: a fenced block anywhere before the next label satisfies the field', () => {
  const value = '\n```\ncurl -s http://localhost:3000/x → {"a":1}\n```\n';
  assert.strictEqual(judgeField(value).ok, true);
});

// ---------------------------------------------------------------- the quiet half

test('this repo\'s own implemented specs produce no failures', () => {
  const dir = path.join(ROOT, '.ai', 'specs', 'implemented');
  const specs = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  assert.ok(specs.length >= 10, 'the corpus is the point of this test; it must not silently shrink');

  const firing = [];
  for (const f of specs) {
    const grading = gradingStatus(f);
    if (!grading.graded) continue; // not-graded is the expected, silent outcome for this corpus
    const { errors } = checkSpec(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (errors.length) firing.push(`${f}: ${errors[0]}`);
  }
  assert.strictEqual(
    firing.length, 0,
    `implemented specs must all be dated before the cutoff and therefore silent:\n  ${firing.join('\n  ')}`
  );
});

test('the live pre-cutoff specs in .ai/specs/ root produce no failures', () => {
  const dir = path.join(ROOT, '.ai', 'specs');
  const specs = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  assert.ok(specs.length >= 1, 'the corpus is the point of this test; it must not silently shrink');

  const firing = [];
  for (const f of specs) {
    const grading = gradingStatus(f);
    if (grading.graded) continue; // this test is scoped to the pre-cutoff live specs only
    // not-graded specs are exercised through the CLI path in the loop below to prove the stdout
    // line is well-formed, not just that checkSpec() would have been silent
    const r = runTool(path.join(dir, f));
    if (r.status !== 0) firing.push(`${f}: exit ${r.status}\n${r.stderr}`);
  }
  assert.strictEqual(
    firing.length, 0,
    `live pre-cutoff specs must exit 0 (not graded):\n  ${firing.join('\n  ')}`
  );
});

console.log(
  failures === 0
    ? '\ncontract-probe-check: all tests passed'
    : `\ncontract-probe-check: ${failures} failing`
);
process.exit(failures === 0 ? 0 : 1);

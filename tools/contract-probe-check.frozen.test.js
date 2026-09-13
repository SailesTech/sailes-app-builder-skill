#!/usr/bin/env node
'use strict';

/**
 * FROZEN suite for `tools/contract-probe-check.js` — spec
 * `.ai/specs/2026-09-13-quality-gates-from-the-partner-portal-report.md`, phase P1. One test per ID
 * from `.ai/test-plans/2026-09-13-quality-gates-P1.md` (FROZEN 2026-09-13, human), ID in the test
 * name. Written from that frozen list with the implementation UNREAD — at the time this file was
 * first written, `tools/contract-probe-check.js`, `tools/contract-probe-check.test.js` and
 * `tools/fixtures/contract-probe-check/` did not exist in this worktree (they were being written in
 * parallel, in a different worktree, per the isolation instruction). Every test below is derived
 * from the frozen contract text alone.
 *
 * Do NOT edit `tools/contract-probe-check.test.js`, `tools/contract-probe-check.js`,
 * `tools/fixtures/contract-probe-check/`, `package.json` or `AGENTS.md` from this file — those
 * belong to the implementer / the lead. This file owns `tools/contract-probe-check.frozen.test.js`
 * only. Fixtures are generated into a fresh temp dir per test (`useTmpSpec`) rather than checked in
 * under `tools/fixtures/contract-probe-check-frozen/` — every fixture's content is a few lines of
 * Markdown built inline, so keeping it next to its assertion is more auditable than a matching
 * static-file indirection, and it sidesteps any risk of colliding with the implementer's own
 * `tools/fixtures/contract-probe-check/` directory.
 *
 * Driven as a CLI, the way `qa` and every other `tools/*.test.js` in this repo drives its subject:
 * `node tools/contract-probe-check.js <spec.md> [more.md ...]`, asserting on stdout/stderr/exit code
 * only — never on internals — with ONE exception: `CUTOFF` is read via `require()` (Q5, human
 * decision), because the exact-boundary cases (CP14/CP15) cannot be written without knowing where
 * the boundary sits, and the contract explicitly forbids hardcoding that date (it moves at merge to
 * `main`, per P6). `readCutoffOrNull()` isolates that one `require()` so a missing/throwing export
 * only fails the two tests that need it, never the other 39, which stay pure black-box CLI runs.
 *
 * ---------------------------------------------------------------------------------------------
 * Q1–Q6 resolutions baked into the expected values below (human, 2026-09-13 — see the plan for the
 * full record):
 *   Q1 — the `n/a` separator (`—`/`–`/`-`/`:`) is MANDATORY (CP40 = exit 1).
 *   Q2 — a date-shaped but calendar-invalid basename prefix counts as "no date" (CP39 = exit 0,
 *        "not graded — no date in file name").
 *   Q3 — mixed CLI args, one unreadable + one valid: exit 2 wins (CP41 = exit 2).
 *   Q4 — an undated spec is NOT graded, durably (CP13 is durable behavior, not provisional).
 *   Q5 — `contract-probe-check.js` exports `CUTOFF` (`module.exports.CUTOFF`) and gates its CLI
 *        body behind `require.main === module`; the real `CUTOFF` value is set at merge to `main`
 *        (P6) and WILL change, so no case here may assert against a literal cutoff date. Far-past
 *        (`2000-01-01`) and far-future (`2099-01-01`) literals are used freely for the graded-vs-not
 *        partition (CP01–CP13, CP35, CP39) — those are safe regardless of where `CUTOFF` ends up,
 *        as long as it stays a real near-term date, which is the only assumption this suite makes.
 *   Q6 — stderr failure lines are matched loosely: basename + phase heading text + SOME rule-
 *        identifying content, never an exact message string.
 *
 * Run: node tools/contract-probe-check.frozen.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const BIN = path.join(__dirname, 'contract-probe-check.js');
const REPO_ROOT = path.resolve(__dirname, '..');
const FENCE = '```';

// Safe on either side of any plausible near-term CUTOFF (see Q5 note above).
const FAR_PAST = '2000-01-01';
const FAR_FUTURE = '2099-01-01';

// Exactly 19 / 20 ASCII letters — the length boundary the contract names for an `n/a` reason.
const REASON_19 = 'abcdefghijklmnopqrs'; // a..s
const REASON_20 = 'abcdefghijklmnopqrst'; // a..t

let failures = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    failures++;
    console.error(`  FAIL ${name}`);
    console.error(`       ${(err && err.stack) || err}`);
  }
}

function run(args) {
  return spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8' });
}

/** STRENGTHENED during Step 5 (detection proof), not weakened — no expected value changed. Every
 *  "graded and passing" case originally asserted only `status === 0`, but exit 0 is ALSO what a
 *  "not graded" exemption produces, so an inverted or off-by-one grading condition (e.g. `<` -> `<=`
 *  on the CUTOFF comparison) would silently survive every happy-path case that used it. The
 *  contract reserves the phrase "not graded" for the two exemption message templates only, so its
 *  absence is a safe, contract-grounded way to assert "this really was graded", without reading any
 *  implementation-specific passing-message wording. Used by CP01-CP11, CP14, CP22, CP24, CP28. */
function assertGradedPass(r, context) {
  assert.strictEqual(r.status, 0, `expected exit 0 (graded and passing)${context}:\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  assert.ok(!/not graded/i.test(r.stdout), `expected a GRADED pass, not a "not graded" exemption${context}:\nstdout: ${r.stdout}`);
}

function newTmpDir(tag) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `contract-probe-frozen-${tag}-`));
}

function rm(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

/** Writes `content` under `dir/basename` and returns the full path. */
function writeSpec(dir, basename, content) {
  const p = path.join(dir, basename);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

/** Lazily reads the exported CUTOFF constant (Q5). Never throws — returns null so the ONE test that
 *  needs it fails with a clear, attributable message instead of crashing the whole suite. */
function readCutoffOrNull() {
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const mod = require(BIN);
    if (typeof mod.CUTOFF === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(mod.CUTOFF)) return mod.CUTOFF;
    return null;
  } catch (e) {
    return null;
  }
}

/** Calendar-day subtraction on a `YYYY-MM-DD` string, done in UTC so no timezone/DST logic is
 *  needed for a pure calendar-date computation. */
function isoDateMinusOneDay(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

function bareHeading(heading) {
  return heading.replace(/^#+\s*/, '');
}

/** Every `.md` file directly inside `dir` (non-recursive — subdirectories are not `.md` files). */
function listMd(dir) {
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(dir, f))
    .sort();
}

console.log('\ncontract-probe-check (frozen)');

// ================================================================== happy path — graded, passing

test('CP01 — single phase, dated far in the future, one fenced Contract-probe field -> exit 0', () => {
  const dir = newTmpDir('cp01');
  try {
    const content = [
      '## Phase 1', '',
      'Contract-probe:',
      FENCE,
      'curl -s https://example.com/api/widgets -> 200',
      FENCE, '',
      'Done-when:', '- run the widget tests', '',
    ].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp01-happy.md`, content);
    const r = run([file]);
    assertGradedPass(r, '');
  } finally { rm(dir); }
});

test('CP02 — n/a with a clear, qualifying reason -> exit 0', () => {
  const dir = newTmpDir('cp02');
  try {
    const content = [
      '## Phase 1', '',
      'Contract-probe: n/a — the local seed has no matching endpoint for this contract yet, ticket #101', '',
      'Done-when:', '- ship it', '',
    ].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp02-happy.md`, content);
    const r = run([file]);
    assertGradedPass(r, ' (CP02)');
  } finally { rm(dir); }
});

test('CP03 — a phase with two Contract-probe fields, both valid -> exit 0', () => {
  const dir = newTmpDir('cp03');
  try {
    const content = [
      '## Phase 1', '',
      'Contract-probe: n/a — first probe reason text that is clearly long enough to qualify, #1', '',
      'Contract-probe:', FENCE, 'curl -s https://example.com/api -> 200', FENCE, '',
    ].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp03-two-fields.md`, content);
    const r = run([file]);
    assertGradedPass(r, ' (CP03)');
  } finally { rm(dir); }
});

test('CP04 — two files on the CLI, both graded and passing -> exit 0', () => {
  const dir = newTmpDir('cp04');
  try {
    const mk = (n) => [
      `## Phase ${n}`, '',
      `Contract-probe: n/a — reason number ${n} is clearly long enough to qualify here, ticket #${n}`, '',
    ].join('\n');
    const f1 = writeSpec(dir, `${FAR_FUTURE}-cp04-a.md`, mk(1));
    const f2 = writeSpec(dir, `${FAR_FUTURE}-cp04-b.md`, mk(2));
    const r = run([f1, f2]);
    assertGradedPass(r, ' (CP04)');
  } finally { rm(dir); }
});

test('CP05 — no phase headings at all: whole spec is one unit, one valid field passes -> exit 0', () => {
  const dir = newTmpDir('cp05');
  try {
    const content = [
      'This spec has no phase headings anywhere in it.', '',
      'Contract-probe: n/a — purely internal note, no existing contract this depends on, ticket #55', '',
    ].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp05-no-headings.md`, content);
    const r = run([file]);
    assertGradedPass(r, ' (CP05)');
  } finally { rm(dir); }
});

test('CP06 — CRLF line endings throughout, otherwise identical to CP01 -> exit 0', () => {
  const dir = newTmpDir('cp06');
  try {
    const content = [
      '## Phase 1', '',
      'Contract-probe:', FENCE,
      'curl -s https://example.com/api/widgets -> 200',
      FENCE, '',
      'Done-when:', '- run the widget tests', '',
    ].join('\n').replace(/\n/g, '\r\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp06-crlf.md`, content);
    const r = run([file]);
    assertGradedPass(r, ' (CP06)');
  } finally { rm(dir); }
});

test('CP07 — field-label tolerance: plain / bold-inside / bold-outside / dash-marker / star-marker -> exit 0', () => {
  const dir = newTmpDir('cp07');
  try {
    const reason = (tag) => `${tag} label reason text is clearly long enough to qualify, ticket #7`;
    const content = [
      '## Phase 1', '', `Contract-probe: n/a — ${reason('plain')}`, '',
      '## Phase 2', '', `**Contract-probe:** n/a — ${reason('bold-inside')}`, '',
      '## Phase 3', '', `**Contract-probe**: n/a — ${reason('bold-outside')}`, '',
      '## Phase 4', '', `- Contract-probe: n/a — ${reason('dash-marker')}`, '',
      '## Phase 5', '', `* Contract-probe: n/a — ${reason('star-marker')}`, '',
    ].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp07-label-forms.md`, content);
    const r = run([file]);
    assertGradedPass(r, ' (CP07)');
  } finally { rm(dir); }
});

test('CP08 — phase-heading vocabulary/case tolerance: Phase / Faza / P\\d / upper / lower each start their own unit', () => {
  // Each pair shares one heading FORM. Both units in a pair carry NO field, so if the form is
  // recognized as its own unit boundary, BOTH heading texts are named as independent failures. If
  // the form were NOT recognized, the two would merge into whatever unit precedes them and only one
  // (or zero, if nothing precedes) failure would be reported for that merged region.
  const forms = [
    ['## Phase 1', '## Phase 2'],
    ['### Faza 1', '### Faza 2'],
    ['#### P3', '#### P4'],
    ['## PHASE 5', '## PHASE 6'],
    ['## faza 7', '## faza 8'],
  ];
  forms.forEach(([h1, h2], i) => {
    const dir = newTmpDir(`cp08-${i}`);
    try {
      const content = [
        h1, '', 'No Contract-probe field appears anywhere in this unit.', '',
        h2, '', 'No Contract-probe field appears anywhere in this unit either.', '',
      ].join('\n');
      const file = writeSpec(dir, `${FAR_FUTURE}-cp08-form-${i}.md`, content);
      const r = run([file]);
      assert.strictEqual(r.status, 1, `form [${h1} / ${h2}] must fail (both units lack a field):\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
      assert.ok(r.stderr.includes(bareHeading(h1)), `stderr must name "${bareHeading(h1)}" as its own failing unit:\n${r.stderr}`);
      assert.ok(r.stderr.includes(bareHeading(h2)), `stderr must ALSO name "${bareHeading(h2)}" as a SEPARATE failing unit (proves the heading form starts a new unit, not a merge):\n${r.stderr}`);
    } finally { rm(dir); }
  });
});

test('CP09 — n/a separator tolerance: em dash, en dash, hyphen, colon -> exit 0', () => {
  const dir = newTmpDir('cp09');
  const reason = (tag) => `${tag} separator reason text is clearly long enough to qualify, #9`;
  const content = [
    '## Phase 1', '', `Contract-probe: n/a — ${reason('em-dash')}`, '',
    '## Phase 2', '', `Contract-probe: n/a – ${reason('en-dash')}`, '',
    '## Phase 3', '', `Contract-probe: n/a - ${reason('hyphen')}`, '',
    '## Phase 4', '', `Contract-probe: n/a: ${reason('colon')}`, '',
  ].join('\n');
  try {
    const file = writeSpec(dir, `${FAR_FUTURE}-cp09-separators.md`, content);
    const r = run([file]);
    assertGradedPass(r, ' (CP09)');
  } finally { rm(dir); }
});

test('CP10 — fence opens after a blank line and explanatory prose, before the next label/heading -> exit 0', () => {
  const dir = newTmpDir('cp10');
  try {
    const content = [
      '## Phase 1', '',
      'Contract-probe:', '',
      'Here is some explanation of why this contract needed probing before the phase could proceed.', '',
      FENCE, 'curl -s https://example.com/api -> 200', FENCE, '',
      'Done-when:', '- ship it', '',
    ].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp10-prose-before-fence.md`, content);
    const r = run([file]);
    assertGradedPass(r, ' (CP10)');
  } finally { rm(dir); }
});

test('CP11 — n/a reason in backticks, trimmed length exactly 20 -> exit 0 (boundary, accepted side)', () => {
  const dir = newTmpDir('cp11');
  try {
    const content = [
      '## Phase 1', '', `Contract-probe: n/a — \`${REASON_20}\``, '',
    ].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp11-backtick-20.md`, content);
    const r = run([file]);
    assertGradedPass(r, ' (CP11)');
  } finally { rm(dir); }
});

// ================================================================== not graded (exempt regardless)

test('CP12 — dated far in the past, field entirely absent -> exit 0, "not graded — dated before"', () => {
  const dir = newTmpDir('cp12');
  try {
    const content = ['## Phase 1', '', 'No Contract-probe field anywhere — would fail if graded.', ''].join('\n');
    const file = writeSpec(dir, `${FAR_PAST}-cp12-old.md`, content);
    const r = run([file]);
    assert.strictEqual(r.status, 0, `a pre-cutoff spec must be exempt even with no field:\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    assert.ok(/not graded/i.test(r.stdout), `stdout must say "not graded":\n${r.stdout}`);
    assert.ok(/dated before/i.test(r.stdout), `stdout must say why (dated before CUTOFF):\n${r.stdout}`);
  } finally { rm(dir); }
});

test('CP13 — no date in basename at all, field invalid -> exit 0, "not graded — no date in file name"', () => {
  const dir = newTmpDir('cp13');
  try {
    const content = ['## Phase 1', '', 'Contract-probe: n/a', ''].join('\n'); // no reason — would fail if graded
    const file = writeSpec(dir, 'notes-about-things.md', content);
    const r = run([file]);
    assert.strictEqual(r.status, 0, `an undated spec must be exempt (durable, Q4):\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    assert.ok(/not graded/i.test(r.stdout), `stdout must say "not graded":\n${r.stdout}`);
    assert.ok(/no date in file name/i.test(r.stdout), `stdout must say why (no date in file name):\n${r.stdout}`);
  } finally { rm(dir); }
});

test('CP14 — basename dated exactly == CUTOFF, one valid field -> exit 0, graded and passing (boundary, accepted side)', () => {
  const cutoff = readCutoffOrNull();
  assert.ok(cutoff, 'contract-probe-check.js must export CUTOFF as a YYYY-MM-DD string (Q5) — this boundary cannot be tested without it');
  const dir = newTmpDir('cp14');
  try {
    const content = ['## Phase 1', '', 'Contract-probe: n/a — reason at the cutoff boundary itself, clearly long enough here, #14', ''].join('\n');
    const file = writeSpec(dir, `${cutoff}-cp14-at-cutoff.md`, content);
    const r = run([file]);
    assertGradedPass(r, ' (CP14)');
  } finally { rm(dir); }
});

test('CP15 — basename dated exactly == CUTOFF minus one day, no field -> exit 0, not graded (boundary, rejected side)', () => {
  const cutoff = readCutoffOrNull();
  assert.ok(cutoff, 'contract-probe-check.js must export CUTOFF as a YYYY-MM-DD string (Q5) — this boundary cannot be tested without it');
  const dir = newTmpDir('cp15');
  try {
    const dayBefore = isoDateMinusOneDay(cutoff);
    const content = ['## Phase 1', '', 'No Contract-probe field anywhere — would fail if graded.', ''].join('\n');
    const file = writeSpec(dir, `${dayBefore}-cp15-before-cutoff.md`, content);
    const r = run([file]);
    assert.strictEqual(r.status, 0, `the day BEFORE CUTOFF must still be exempt:\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    assert.ok(/not graded/i.test(r.stdout), `stdout must say "not graded":\n${r.stdout}`);
  } finally { rm(dir); }
});

// ================================================================== corpus silence (real repo files)

test('CP16 — silent over every .ai/specs/implemented/*.md (enumerated at run time)', () => {
  const files = listMd(path.join(REPO_ROOT, '.ai', 'specs', 'implemented'));
  assert.ok(files.length > 0, 'expected at least one implemented spec on disk to run this against');
  const r = run(files);
  assert.strictEqual(r.status, 0, `every implemented spec predates any plausible CUTOFF and must stay silent:\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  assert.strictEqual(r.stderr.trim(), '', `expected zero stderr failure lines across ${files.length} implemented specs:\n${r.stderr}`);
});

test('CP17 — silent over every live pre-cutoff spec in .ai/specs/ root (enumerated at run time)', () => {
  const files = listMd(path.join(REPO_ROOT, '.ai', 'specs'));
  assert.ok(files.length > 0, 'expected at least one live spec on disk to run this against');
  const r = run(files);
  assert.strictEqual(r.status, 0, `every live spec currently in .ai/specs/ root predates the 2026-09-14+ CUTOFF and must stay silent:\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  assert.strictEqual(r.stderr.trim(), '', `expected zero stderr failure lines across ${files.length} live specs:\n${r.stderr}`);
});

// ================================================================== edges and failures

test('CP18 — phase with the field entirely absent -> exit 1, names basename + phase + a rule', () => {
  const dir = newTmpDir('cp18');
  try {
    const content = ['## Phase 1', '', 'Some text with no Contract-probe field mentioned anywhere.', '', 'Done-when:', '- run tests', ''].join('\n');
    const basename = `${FAR_FUTURE}-cp18-missing-field.md`;
    const file = writeSpec(dir, basename, content);
    const r = run([file]);
    assert.strictEqual(r.status, 1, `expected exit 1:\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    assert.ok(r.stderr.includes(basename), `stderr must name the spec's basename:\n${r.stderr}`);
    assert.ok(r.stderr.includes('Phase 1'), `stderr must name the phase heading text:\n${r.stderr}`);
    assert.ok(r.stderr.trim().length > (basename.length + 'Phase 1'.length), `stderr must say more than just an echo of the name — some rule-identifying content:\n${r.stderr}`);
  } finally { rm(dir); }
});

test('CP19 — two phases, each failing a DIFFERENT rule -> exit 1, two distinct stderr lines', () => {
  const dir = newTmpDir('cp19');
  try {
    const content = [
      '## Phase 1', '', 'Some prose without any Contract-probe field.', '',
      '## Phase 2', '', 'Contract-probe: n/a', '',
    ].join('\n');
    const basename = `${FAR_FUTURE}-cp19-two-rules.md`;
    const file = writeSpec(dir, basename, content);
    const r = run([file]);
    assert.strictEqual(r.status, 1, `expected exit 1:\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    assert.ok(r.stderr.includes('Phase 1'), `stderr must name Phase 1:\n${r.stderr}`);
    assert.ok(r.stderr.includes('Phase 2'), `stderr must ALSO name Phase 2 as an independent failure:\n${r.stderr}`);
    const lines1 = r.stderr.split(/\r?\n/).filter((l) => l.includes('Phase 1'));
    const lines2 = r.stderr.split(/\r?\n/).filter((l) => l.includes('Phase 2'));
    assert.ok(lines1.length > 0 && lines2.length > 0, `expected at least one stderr line for each phase:\n${r.stderr}`);
    // STRENGTHENED during Step 5 (detection proof), not weakened — no expected value changed. The
    // original strip() removed the basename and phase name but left "(line N)" untouched, so a
    // mutant that collapses BOTH rule messages to the same generic text ("invalid") still survived:
    // the missing-field branch never carries a "(line N)" suffix while the field-validity branch
    // always does, so the two stripped strings still differed for a purely structural reason having
    // nothing to do with which RULE fired. Stripping the line-number parenthetical too closes that
    // gap without touching the assertion's verdict (rule1 !== rule2 is still required).
    const strip = (l) => l.split(basename).join('').split('Phase 1').join('').split('Phase 2').join('').replace(/\s*\(line \d+\)\s*/g, ' ').trim();
    const rule1 = strip(lines1[0]);
    const rule2 = strip(lines2[0]);
    assert.notStrictEqual(rule1, rule2, `the two failures must name DIFFERENT rules (missing field vs. n/a-no-reason), not the same text with a different phase name:\n  Phase 1: ${lines1[0]}\n  Phase 2: ${lines2[0]}`);
  } finally { rm(dir); }
});

test('CP20 — n/a with the separator present but zero reason text after it -> exit 1', () => {
  const dir = newTmpDir('cp20');
  try {
    const content = ['## Phase 1', '', 'Contract-probe: n/a —', ''].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp20-empty-reason.md`, content);
    const r = run([file]);
    assert.strictEqual(r.status, 1, `expected exit 1:\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  } finally { rm(dir); }
});

test('CP21 — n/a reason exactly 19 characters, no backticks -> exit 1 (boundary, rejected side)', () => {
  const dir = newTmpDir('cp21');
  try {
    assert.strictEqual(REASON_19.length, 19);
    const content = ['## Phase 1', '', `Contract-probe: n/a — ${REASON_19}`, ''].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp21-19chars.md`, content);
    const r = run([file]);
    assert.strictEqual(r.status, 1, `19 characters must be rejected:\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  } finally { rm(dir); }
});

test('CP22 — n/a reason exactly 20 characters, no backticks -> exit 0 (boundary, accepted side)', () => {
  const dir = newTmpDir('cp22');
  try {
    assert.strictEqual(REASON_20.length, 20);
    const content = ['## Phase 1', '', `Contract-probe: n/a — ${REASON_20}`, ''].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp22-20chars.md`, content);
    const r = run([file]);
    assertGradedPass(r, ' (CP22)');
  } finally { rm(dir); }
});

test('CP23 — n/a reason containing the standalone word "stack" -> exit 1', () => {
  const dir = newTmpDir('cp23');
  try {
    const content = ['## Phase 1', '', 'Contract-probe: n/a — the stack needs a redeploy before this can be measured, will follow up', ''].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp23-stack-word.md`, content);
    const r = run([file]);
    assert.strictEqual(r.status, 1, `expected exit 1 (forbidden word "stack"):\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  } finally { rm(dir); }
});

test('CP24 — n/a reason containing "stack" only inside another word (callstack) -> exit 0', () => {
  const dir = newTmpDir('cp24');
  try {
    const content = ['## Phase 1', '', 'Contract-probe: n/a — this route has no callstack instrumentation wired up yet, ticket #12', ''].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp24-callstack.md`, content);
    const r = run([file]);
    assertGradedPass(r, ' (CP24)');
  } finally { rm(dir); }
});

test('CP25 — n/a reason containing "not running" (case-insensitive) -> exit 1', () => {
  const dir = newTmpDir('cp25');
  try {
    const content = ['## Phase 1', '', 'Contract-probe: n/a — the payments API is Not Running in this sandbox today, ticket #99', ''].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp25-not-running.md`, content);
    const r = run([file]);
    assert.strictEqual(r.status, 1, `expected exit 1 (forbidden phrase "not running"):\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  } finally { rm(dir); }
});

test('CP26 — n/a reason containing "nie wstał" (case-insensitive) -> exit 1', () => {
  const dir = newTmpDir('cp26');
  try {
    const content = ['## Phase 1', '', 'Contract-probe: n/a — sonda pokazuje ze serwis nie wstał po restarcie, sprawdzimy jutro', ''].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp26-nie-wstal.md`, content);
    const r = run([file]);
    assert.strictEqual(r.status, 1, `expected exit 1 (forbidden phrase "nie wstał"):\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  } finally { rm(dir); }
});

test('CP27 — n/a reason containing the standalone token "ENV" (exact case) -> exit 1', () => {
  const dir = newTmpDir('cp27');
  try {
    const content = ['## Phase 1', '', 'Contract-probe: n/a — blocked: the ENV var API_KEY is unset on this box today, ticket #3', ''].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp27-env-token.md`, content);
    const r = run([file]);
    assert.strictEqual(r.status, 1, `expected exit 1 (forbidden token "ENV", exact case):\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  } finally { rm(dir); }
});

test('CP28 — n/a reason containing lowercase "env" and the word "environment", never standalone "ENV" -> exit 0', () => {
  const dir = newTmpDir('cp28');
  try {
    const content = ['## Phase 1', '', 'Contract-probe: n/a — the environment config for this env needs a manual seed step, ticket #9', ''].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp28-lowercase-env.md`, content);
    const r = run([file]);
    assertGradedPass(r, ' (CP28)');
  } finally { rm(dir); }
});

test('CP29 — field body is plain prose, neither a fence nor an n/a form -> exit 1', () => {
  const dir = newTmpDir('cp29');
  try {
    const content = ['## Phase 1', '', 'Contract-probe: we plan to check this manually before shipping the phase.', ''].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp29-plain-prose.md`, content);
    const r = run([file]);
    assert.strictEqual(r.status, 1, `expected exit 1 (neither a fence nor n/a):\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  } finally { rm(dir); }
});

test('CP30 — field label present with nothing after it before the next heading -> exit 1', () => {
  const dir = newTmpDir('cp30');
  try {
    const content = [
      '## Phase 1', '', 'Contract-probe:', '',
      '## Phase 2', '', 'Contract-probe: n/a — perfectly fine explanation of why this phase carries no contract, ok', '',
    ].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp30-empty-label.md`, content);
    const r = run([file]);
    assert.strictEqual(r.status, 1, `expected exit 1 (Phase 1's field has nothing before the next heading):\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    assert.ok(r.stderr.includes('Phase 1'), `stderr must name the failing phase (Phase 1, not Phase 2):\n${r.stderr}`);
  } finally { rm(dir); }
});

test('CP31 — a phase with two fields, one valid + one invalid -> exit 1', () => {
  const dir = newTmpDir('cp31');
  try {
    const content = [
      '## Phase 1', '',
      'Contract-probe: n/a — first reason is clearly long enough to qualify for this valid case here', '',
      'Contract-probe: n/a', '',
    ].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp31-mixed-fields.md`, content);
    const r = run([file]);
    assert.strictEqual(r.status, 1, `expected exit 1 (every field in the phase must be valid, not just one):\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  } finally { rm(dir); }
});

test('CP32 — a fenced block that opens only after the NEXT field\'s label -> exit 1 for Contract-probe', () => {
  const dir = newTmpDir('cp32');
  try {
    const content = [
      '## Phase 1', '',
      'Contract-probe:', '',
      'Done-when:', FENCE, 'curl -s https://example.com/api -> 200', FENCE, '',
    ].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp32-fence-belongs-to-next.md`, content);
    const r = run([file]);
    assert.strictEqual(r.status, 1, `the fence belongs to Done-when, not Contract-probe -> exit 1:\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  } finally { rm(dir); }
});

test('CP33 — a level-1 "# Phase" heading between two real phases does not start a new unit', () => {
  const dir = newTmpDir('cp33');
  try {
    // If "# Phase 2" is (wrongly) treated as its own unit, that unit has ZERO fields -> exit 1.
    // If correctly ignored, its content stays attached to "## Phase 1" (which already has a valid
    // field before it) and only two real units exist, both valid -> exit 0.
    const content = [
      '## Phase 1', '',
      'Contract-probe: n/a — phase one reason explaining why no contract exists yet at all today', '',
      '# Phase 2', '',
      'This paragraph is only reachable as its own unit if level-1 headings incorrectly start one.', '',
      '## Phase 3', '',
      'Contract-probe: n/a — phase three reason explaining why no contract exists yet at all today', '',
    ].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp33-level1-ignored.md`, content);
    const r = run([file]);
    assert.strictEqual(r.status, 0, `a level-1 heading must NOT start a new unit (boundary is #{2,4}):\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  } finally { rm(dir); }
});

test('CP34 — a level-5 "##### Phase" heading between two real phases does not start a new unit', () => {
  const dir = newTmpDir('cp34');
  try {
    const content = [
      '## Phase 1', '',
      'Contract-probe: n/a — phase one reason explaining why no contract exists yet at all today', '',
      '##### Phase 2', '',
      'This paragraph is only reachable as its own unit if level-5 headings incorrectly start one.', '',
      '## Phase 3', '',
      'Contract-probe: n/a — phase three reason explaining why no contract exists yet at all today', '',
    ].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp34-level5-ignored.md`, content);
    const r = run([file]);
    assert.strictEqual(r.status, 0, `a level-5 heading must NOT start a new unit (boundary is #{2,4}):\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  } finally { rm(dir); }
});

test('CP35 — dated far in the future, field missing -> exit 1 (grading is not scoped to "near today")', () => {
  const dir = newTmpDir('cp35');
  try {
    const content = ['## Phase 1', '', 'No Contract-probe field anywhere.', ''].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp35-far-future-fail.md`, content);
    const r = run([file]);
    assert.strictEqual(r.status, 1, `a far-future dated spec must still be graded and must still fail here:\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  } finally { rm(dir); }
});

test('CP36 — two files on the CLI, first passes and second fails -> exit 1, stderr disambiguates by basename', () => {
  const dir = newTmpDir('cp36');
  try {
    const passingBasename = `${FAR_FUTURE}-cp36-pass.md`;
    const failingBasename = `${FAR_FUTURE}-cp36-fail.md`;
    const passContent = ['## Phase 1', '', 'Contract-probe: n/a — this one is fine, clearly long enough to qualify, ticket #36', ''].join('\n');
    const failContent = ['## Phase 1', '', 'No Contract-probe field anywhere in this one.', ''].join('\n');
    const f1 = writeSpec(dir, passingBasename, passContent);
    const f2 = writeSpec(dir, failingBasename, failContent);
    const r = run([f1, f2]);
    assert.strictEqual(r.status, 1, `expected exit 1 overall (second file fails):\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    assert.ok(r.stderr.includes(failingBasename), `stderr must name the FAILING file's basename:\n${r.stderr}`);
    assert.ok(!r.stderr.includes(passingBasename), `stderr must NOT claim the passing file failed:\n${r.stderr}`);
  } finally { rm(dir); }
});

test('CP37 — no CLI arguments at all -> exit 2, usage/error line on stderr', () => {
  const r = run([]);
  assert.strictEqual(r.status, 2, `expected exit 2:\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  assert.ok(r.stderr.trim().length > 0, `expected a non-empty usage/error line on stderr, got none`);
});

test('CP38 — a single nonexistent file path -> exit 2, error line naming the file', () => {
  const dir = newTmpDir('cp38');
  try {
    const missing = path.join(dir, `${FAR_FUTURE}-cp38-does-not-exist.md`);
    const r = run([missing]);
    assert.strictEqual(r.status, 2, `expected exit 2 for an unreadable file:\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    assert.ok(r.stderr.includes(path.basename(missing)), `stderr must name the unreadable file:\n${r.stderr}`);
  } finally { rm(dir); }
});

test('CP39 — [Q2] calendar-invalid date-shaped prefix counts as "no date" -> exit 0', () => {
  const dir = newTmpDir('cp39');
  try {
    const content = ['## Phase 1', '', 'No Contract-probe field anywhere — would fail if graded.', ''].join('\n');
    const file = writeSpec(dir, '2026-13-40-notes.md', content); // month 13, day 40: not a real date
    const r = run([file]);
    assert.strictEqual(r.status, 0, `a calendar-invalid date-shaped prefix must be treated as "no date" (Q2):\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    assert.ok(/not graded/i.test(r.stdout) && /no date in file name/i.test(r.stdout), `stdout must say "not graded — no date in file name":\n${r.stdout}`);
  } finally { rm(dir); }
});

test('CP40 — [Q1] n/a with no separator at all before the reason -> exit 1', () => {
  const dir = newTmpDir('cp40');
  try {
    const content = ['## Phase 1', '', 'Contract-probe: n/a because the local seed has no matching endpoint at all for this specific case', ''].join('\n');
    const file = writeSpec(dir, `${FAR_FUTURE}-cp40-no-separator.md`, content);
    const r = run([file]);
    assert.strictEqual(r.status, 1, `a missing separator must be rejected (Q1: mandatory):\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  } finally { rm(dir); }
});

test('CP41 — [Q3] CLI args mixing one valid+passing file with one nonexistent file -> exit 2', () => {
  const dir = newTmpDir('cp41');
  try {
    const goodContent = ['## Phase 1', '', 'Contract-probe: n/a — this one is fine, clearly long enough to qualify, ticket #41', ''].join('\n');
    const good = writeSpec(dir, `${FAR_FUTURE}-cp41-good.md`, goodContent);
    const missing = path.join(dir, `${FAR_FUTURE}-cp41-missing.md`);
    const r = run([good, missing]);
    assert.strictEqual(r.status, 2, `exit 2 must win over the readable file's own result (Q3):\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  } finally { rm(dir); }
});

console.log(failures === 0 ? '\ncontract-probe-check.frozen: all tests passed' : `\ncontract-probe-check.frozen: ${failures} failing`);
process.exitCode = failures === 0 ? 0 : 1;

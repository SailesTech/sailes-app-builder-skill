#!/usr/bin/env node
'use strict';

/**
 * Tests for hooks-template/brief-closure.js — the mechanism that stops a worker brief being
 * declared done while it is actually half-written.
 *
 * Why it exists (spec 2026-08-01-delegation-precision-and-agent-control, F2). Four costly defects
 * on 2026-08-01 shared one shape: each was an ABSENCE — a missing field, a missing clause, a path
 * on the allow-list that nothing ever proved into existence — and a review that reads a diff cannot
 * find a thing that was never written. What is under test here is therefore not "does a well-formed
 * brief parse" but: **can a brief that is missing a required field, or that lists a path nothing
 * enforces, still read as CLOSED.** The mutation tests below are the ones that matter — a checker
 * that cannot fail on a broken brief is decoration, same lesson as `tools/sync-blocks.test.js`.
 *
 * The suite also carries the one fixture the brief explicitly demands: a brief whose Files list has
 * a path marked touched-but-not-produced with a reason MUST NOT fire (exit 0) even though nothing
 * else in the brief names that path.
 *
 * Driven the way the gate drives it: argv in, exit code out, stderr read for the named problem.
 *
 * Run: node skills/sailes-bootstrap/hooks-template/brief-closure.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const BRIEF_CLOSURE = path.join(__dirname, 'brief-closure.js');
const { parseFields, checkRequiredFields, checkCoverage } = require('./brief-closure.js');

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

const rm = (d) => fs.rmSync(d, { recursive: true, force: true });

function run(text) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-brief-'));
  const file = path.join(dir, 'brief.md');
  fs.writeFileSync(file, text);
  try {
    return spawnSync(process.execPath, [BRIEF_CLOSURE, file], { encoding: 'utf8' });
  } finally {
    rm(dir);
  }
}

/**
 * A real-shaped worker brief, in the exact field order/labels `agent-team-structure.md`'s template
 * uses. `src/widget.js` is proven by Contract (names it in prose); `src/widget.test.js` is proven
 * by Verification. Both paths are covered — this is the "everything present, everything covered"
 * baseline every other fixture perturbs one way.
 */
function baseBrief({
  dropReport = false,
  extraUncoveredFile = false,
  touchedExempt = false,
  touchedNoReason = false,
  breakContractCoverage = false,
} = {}) {
  const filesLines = [
    'Files:       CREATE `src/widget.js`',
    '             EDIT `src/widget.test.js`',
  ];
  if (extraUncoveredFile) filesLines.push('             CREATE `src/helper.js`');
  if (touchedExempt) {
    filesLines.push(
      '             EDIT `config/flags.json` (touched, not produced — reason: shared flag toggled by another task)'
    );
  }
  if (touchedNoReason) {
    filesLines.push('             EDIT `config/other-flags.json` (touched, not produced)');
  }

  const contractLine = breakContractCoverage
    ? 'Contract:    exports `renderWidget(props)` from the new module; behavior is proven by\n             `src/widget.test.js`.'
    : 'Contract:    exports `renderWidget(props)` from `src/widget.js`; behavior proven by\n             `src/widget.test.js`.';

  const lines = [
    'You are `be-dev` on team `demo`, under `team-lead`.',
    'You are in your own worktree on branch `demo-branch`. Do not switch branches. Never commit',
    'to a shared branch and never push. Commit your finished work HERE.',
    '',
    'Task:        implement the widget renderer.',
    'Goal:        render a widget from props with zero runtime deps.',
    ...filesLines,
    contractLine,
    'Forbidden:   `src/legacy/`, `package.json`.',
    'Verification: `node src/widget.test.js` → 0 failing.',
    dropReport ? null : 'Report:      per-file diff summary, command output, any deviation.',
    'Delivery:    scoped subagent — your final message is returned automatically.',
    '',
  ].filter((l) => l !== null);

  return lines.join('\n');
}

/** Same brief, Polish labels — the contract requires either language, matched independently. */
function polishBrief() {
  return [
    'Jesteś `be-dev` w zespole `demo`, pod `team-lead`.',
    'Pracujesz we własnym worktree. Nie przełączaj gałęzi.',
    '',
    'Zadanie:     zaimplementuj renderer widgetu.',
    'Cel:         wyrenderuj widget z propsów bez zależności runtime.',
    'Pliki:       UTWÓRZ `src/widget.js`',
    '             EDYTUJ `src/widget.test.js`',
    'Kontrakt:    eksportuje `renderWidget(props)` z `src/widget.js`; dowód w',
    '             `src/widget.test.js`.',
    'Zabronione:  `src/legacy/`, `package.json`.',
    'Weryfikacja: `node src/widget.test.js` → 0 failing.',
    'Raport:      podsumowanie per plik, wynik komend, ewentualne odchylenia.',
    'Dostarczenie: scoped subagent — ostatnia wiadomość jest zwracana automatycznie.',
    '',
  ].join('\n');
}

// ---------------------------------------------------------------- (a) required fields, positive

test('a fully-populated, fully-covered brief is CLOSED (exit 0)', () => {
  const r = run(baseBrief());
  assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  assert.ok(/CLOSED/.test(r.stdout), 'success output does not say CLOSED');
});

test('Polish field labels are accepted exactly like English ones', () => {
  const r = run(polishBrief());
  assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\nstderr: ${r.stderr}`);
});

// ---------------------------------------------------------------- (a) required fields, negative

test('a brief missing "Report:" is NOT CLOSED and names the field', () => {
  const r = run(baseBrief({ dropReport: true }));
  assert.strictEqual(r.status, 1, 'a brief with no Report: field passed');
  assert.ok(/Report/i.test(r.stderr), `the missing field is not named on stderr:\n${r.stderr}`);
});

test('a brief missing every required field reports every one, not just the first', () => {
  const r = run('You are `be-dev` on team `demo`, under `team-lead`.\n\nTask: nothing else here.\n');
  assert.strictEqual(r.status, 1);
  for (const label of ['Goal', 'Files', 'Contract', 'Forbidden', 'Verification', 'Report', 'Delivery']) {
    assert.ok(new RegExp(label, 'i').test(r.stderr), `${label} is missing from stderr:\n${r.stderr}`);
  }
});

// ---------------------------------------------------------------- (b) coverage, negative

test('a brief with a Files path no clause enforces is NOT CLOSED and names the path', () => {
  const r = run(baseBrief({ extraUncoveredFile: true }));
  assert.strictEqual(r.status, 1, 'an uncovered path passed the check');
  assert.ok(/src\/helper\.js/.test(r.stderr), `the uncovered path is not named on stderr:\n${r.stderr}`);
});

test('a touched-but-not-produced marker with no reason is flagged, not silently accepted', () => {
  const r = run(baseBrief({ touchedNoReason: true }));
  assert.strictEqual(r.status, 1, 'a marker with no reason passed');
  assert.ok(/no stated reason/.test(r.stderr), `the broken-marker problem is not named:\n${r.stderr}`);
  assert.ok(/other-flags\.json/.test(r.stderr), `the path is not named:\n${r.stderr}`);
});

// ---------------------------------------------------------------- (b) coverage, the fixture that MUST NOT fire

test('MUST NOT FIRE: a path marked touched-but-not-produced with a stated reason is CLOSED', () => {
  // This is the one the brief explicitly demands. If this ever goes red, the exemption is dead and
  // every legitimately-touched-but-not-produced file becomes an unfixable false positive.
  const r = run(baseBrief({ touchedExempt: true }));
  assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\nstderr: ${r.stderr}`);
  assert.ok(!/flags\.json/.test(r.stderr), `the exempted path was reported anyway:\n${r.stderr}`);
});

// ---------------------------------------------------------------- mutation proof

test('MUTATION: breaking the one clause that covers a path turns CLOSED into NOT CLOSED, and back', () => {
  const covered = baseBrief();
  const before = run(covered);
  assert.strictEqual(before.status, 0, `fixture is wrong before mutation: ${before.stderr}`);

  const broken = baseBrief({ breakContractCoverage: true });
  const red = run(broken);
  assert.strictEqual(red.status, 1, 'removing the only clause that names src/widget.js did not fail the check');
  assert.ok(/src\/widget\.js/.test(red.stderr), `the now-uncovered path is not named:\n${red.stderr}`);

  const restored = run(baseBrief());
  assert.strictEqual(restored.status, 0, `reverting the mutation did not restore CLOSED: ${restored.stderr}`);
});

// ---------------------------------------------------------------- CLI edges

test('no argument prints usage and exits 1', () => {
  const r = spawnSync(process.execPath, [BRIEF_CLOSURE], { encoding: 'utf8' });
  assert.strictEqual(r.status, 1);
  assert.ok(/Usage/.test(r.stderr), `no usage message:\n${r.stderr}`);
});

test('a nonexistent brief file exits 1 and names the path', () => {
  const missing = path.join(os.tmpdir(), 'sailes-brief-does-not-exist-12345.md');
  const r = spawnSync(process.execPath, [BRIEF_CLOSURE, missing], { encoding: 'utf8' });
  assert.strictEqual(r.status, 1);
  assert.ok(r.stderr.includes(missing), `the missing file is not named:\n${r.stderr}`);
});

// ---------------------------------------------------------------- line endings (repo is mixed CRLF/LF)

test('a CRLF brief parses identically to its LF twin', () => {
  const crlf = baseBrief().replace(/\r?\n/g, '\r\n');
  const r = run(crlf);
  assert.strictEqual(r.status, 0, `CRLF brief was not accepted: ${r.stderr}`);
});

test('a lone-CR brief (old Mac line endings) still parses — \\r?\\n tolerance', () => {
  // Not something this repo produces, but the contract promises \r?\n tolerance broadly; a naive
  // \n-only split would glue every field into one giant unmatched line and fail everything.
  const cr = baseBrief().replace(/\r?\n/g, '\r');
  const r = run(cr);
  assert.strictEqual(r.status, 0, `lone-CR brief was not accepted: ${r.stderr}`);
});

// ---------------------------------------------------------------- parser unit tests (direct require)

test('a colon inside a field\'s own value does not start a new field', () => {
  // "Contract:    CLI: `node brief-closure.js …`" — the inner "CLI:" must stay part of Contract's
  // value, never become its own bogus field, or the label-matching above breaks silently.
  const text = 'Contract:    CLI: `node brief-closure.js <brief-file>` does the thing.\nForbidden:   nothing.\n';
  const fields = parseFields(text);
  const labels = fields.map((f) => f.label);
  assert.deepStrictEqual(labels, ['Contract', 'Forbidden'], `parsed unexpected fields: ${labels.join(', ')}`);
  assert.ok(fields[0].lines.join(' ').includes('CLI:'), 'the inner colon text was lost');
});

test('an indented continuation line stays attached to the field above it', () => {
  const text = 'Files:       CREATE `a.js`\n             EDIT `b.js`\nReport:      done.\n';
  const fields = parseFields(text);
  const filesField = fields.find((f) => f.label === 'Files');
  assert.ok(filesField.lines.some((l) => l.includes('a.js')));
  assert.ok(filesField.lines.some((l) => l.includes('b.js')));
});

test('checkRequiredFields and checkCoverage are pure functions of parsed fields (unit-level)', () => {
  const fields = parseFields(baseBrief({ extraUncoveredFile: true }));
  assert.strictEqual(checkRequiredFields(fields).length, 0, 'a fully-labelled brief reported a missing field');
  const coverage = checkCoverage(fields);
  assert.ok(coverage.problems.some((p) => p.includes('src/helper.js')), 'coverage did not flag the uncovered path');
});

console.log(failures === 0 ? '\nbrief-closure: all tests passed' : `\nbrief-closure: ${failures} failing`);
process.exitCode = failures === 0 ? 0 : 1;

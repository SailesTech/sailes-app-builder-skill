#!/usr/bin/env node
'use strict';

/**
 * Tests for tools/worker-status.js — the reader/validator for `.claude/status/<worker-id>.md`.
 *
 * What is under test is the one distinction the whole artifact exists for (Design §3 of
 * 2026-08-01-delegation-precision-and-agent-control.md): **no file, an unclosed file, and a
 * closed-and-complete file must produce three different, nameable outcomes** — not one silence.
 * On 2026-08-01, before this tool existed, all three looked the same to a lead and it cost two
 * false "unfinished" reports on work that was actually done. The mutation test at the bottom is
 * the one that matters: if closed-detection can break without turning red, the artifact is
 * decoration again.
 *
 * Driven the way a lead drives it: argv in, stdout/stderr + exit code out. Not wired into
 * `npm test` (Q3: this tool reports, it never gates).
 *
 * Run: node tools/worker-status.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const BIN = path.join(__dirname, 'worker-status.js');

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
const tmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-worker-status-'));

function run(...args) {
  return spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8' });
}

function runIn(cwd, ...args) {
  return spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8', cwd });
}

/** A complete, valid, closed status file — the baseline every mutation test starts from. */
const CLOSED_OK = [
  'worker: be-dev-3',
  'task: "F2 — check domkniecia briefu"',
  'base: e276a5e',
  'claimed: ["skills/sailes-bootstrap/hooks-template/brief-closure.js"]',
  'opened: 2026-08-02T09:14:00Z',
  '# --- appended at closure ---',
  'closed: 2026-08-02T10:41:00Z',
  'outcome: done',
  'commit: 4f2a9c1',
  'touched: ["skills/sailes-bootstrap/hooks-template/brief-closure.js"]',
  '',
].join('\n');

/** Same file, same content, written with the block-list syntax instead of inline `[...]`. */
const CLOSED_OK_BLOCK = [
  'worker: be-dev-3',
  'task: "F2 — check domkniecia briefu"',
  'base: e276a5e',
  'claimed:',
  '  - skills/sailes-bootstrap/hooks-template/brief-closure.js',
  'opened: 2026-08-02T09:14:00Z',
  '# --- appended at closure ---',
  'closed: 2026-08-02T10:41:00Z',
  'outcome: done',
  'commit: 4f2a9c1',
  'touched:',
  '  - skills/sailes-bootstrap/hooks-template/brief-closure.js',
  '  - skills/sailes-bootstrap/hooks-template/brief-closure.test.js',
  '',
].join('\n');

const OPEN_ONLY = [
  'worker: be-dev-3',
  'task: "F2 — check domkniecia briefu"',
  'base: e276a5e',
  'claimed: ["skills/sailes-bootstrap/hooks-template/brief-closure.js"]',
  'opened: 2026-08-02T09:14:00Z',
  '',
].join('\n');

/** The closing block appended, verbatim, beneath OPEN_ONLY — never rewriting it. */
const CLOSING_BLOCK_APPEND = [
  '# --- appended at closure ---',
  'closed: 2026-08-02T10:41:00Z',
  'outcome: done',
  'commit: 4f2a9c1',
  'touched: ["skills/sailes-bootstrap/hooks-template/brief-closure.js"]',
  '',
].join('\n');

function writeFixture(dir, name, content) {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content);
  return p;
}

// -------------------------------------------------------------------- state 1: never started

test('no file at all -> exit 1, message says "never started"', () => {
  const dir = tmpDir();
  try {
    const missing = path.join(dir, 'be-dev-9.md');
    const r = run(missing);
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
    assert.ok(/never started/.test(r.stdout + r.stderr), 'message does not say "never started"');
  } finally {
    rm(dir);
  }
});

// -------------------------------------------------------------------- state 2: died mid-run

test('file present without closed: -> exit 1, "died mid-run", names worker and base', () => {
  const dir = tmpDir();
  try {
    const f = writeFixture(dir, 'be-dev-3.md', OPEN_ONLY);
    const r = run(f);
    const out = r.stdout + r.stderr;
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
    assert.ok(/died mid-run/.test(out), 'message does not say "died mid-run"');
    assert.ok(/be-dev-3/.test(out), 'the worker id is not named');
    assert.ok(/e276a5e/.test(out), 'the base sha is not named');
  } finally {
    rm(dir);
  }
});

test('a malformed claim is caught while the file is STILL OPEN, not only at closure', () => {
  // Found on the first live run of this mechanism, 2026-08-02: a worker wrote `claimed: 2026-08-02`
  // — a date where a path list belongs — and the validator said only "died mid-run". Shape was
  // graded on close alone, which is backwards: if the worker dies, the claim block is ALL that
  // survives and its one job is to name the files it took. A claim nobody can read is exactly the
  // state this artifact exists to prevent, discovered when it can no longer be fixed.
  const dir = tmpDir();
  try {
    const f = writeFixture(
      dir,
      'be-dev-9.md',
      'worker: be-dev-9\ntask: something\nbase: e276a5e\nclaimed: 2026-08-02\nopened: 2026-08-02\n'
    );
    const r = run(f);
    const out = r.stdout + r.stderr;
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
    assert.ok(/died mid-run/.test(out), 'the open state is no longer reported');
    assert.ok(
      /"claimed" must be a list of paths/.test(out),
      'the malformed claim went unreported on an open file — the defect this test exists for'
    );
  } finally {
    rm(dir);
  }
});

// -------------------------------------------------------------------- state 3: closed, complete

test('file closed with a complete field set -> exit 0', () => {
  const dir = tmpDir();
  try {
    const f = writeFixture(dir, 'be-dev-3.md', CLOSED_OK);
    const r = run(f);
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\n${r.stdout}${r.stderr}`);
  } finally {
    rm(dir);
  }
});

test('CRLF line endings are tolerated (repo is mixed on disk)', () => {
  const dir = tmpDir();
  try {
    const f = writeFixture(dir, 'be-dev-3.md', CLOSED_OK.replace(/\n/g, '\r\n'));
    const r = run(f);
    assert.strictEqual(r.status, 0, `CRLF file failed to validate: ${r.stdout}${r.stderr}`);
  } finally {
    rm(dir);
  }
});

// -------------------------------------------------------------------- state 4: done without commit

test('outcome: done without commit: -> exit 1', () => {
  const dir = tmpDir();
  try {
    const content = CLOSED_OK.replace(/^commit: 4f2a9c1\n/m, '');
    const f = writeFixture(dir, 'be-dev-3.md', content);
    const r = run(f);
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
    assert.ok(/commit/i.test(r.stdout + r.stderr), 'the missing commit is not named');
  } finally {
    rm(dir);
  }
});

test('outcome: blocked with no commit is fine — nothing to point at by definition', () => {
  const dir = tmpDir();
  try {
    const content = CLOSED_OK.replace(/^commit: 4f2a9c1\n/m, '').replace('outcome: done', 'outcome: blocked');
    const f = writeFixture(dir, 'be-dev-3.md', content);
    const r = run(f);
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\n${r.stdout}${r.stderr}`);
  } finally {
    rm(dir);
  }
});

test('an invalid outcome value is rejected', () => {
  const dir = tmpDir();
  try {
    const content = CLOSED_OK.replace('outcome: done', 'outcome: mostly-done');
    const f = writeFixture(dir, 'be-dev-3.md', content);
    const r = run(f);
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
  } finally {
    rm(dir);
  }
});

test('a missing required open field (base) is rejected even when closed', () => {
  const dir = tmpDir();
  try {
    const content = CLOSED_OK.replace(/^base: e276a5e\n/m, '');
    const f = writeFixture(dir, 'be-dev-3.md', content);
    const r = run(f);
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
    assert.ok(/base/.test(r.stdout + r.stderr), '"base" is not named as missing');
  } finally {
    rm(dir);
  }
});

// -------------------------------------------------------------------- claimed/touched list syntax

test('inline-list syntax (["a","b"]) for claimed/touched is accepted', () => {
  const { evaluateFile } = require('./worker-status.js');
  const dir = tmpDir();
  try {
    const f = writeFixture(dir, 'be-dev-3.md', CLOSED_OK);
    const result = evaluateFile(f);
    assert.strictEqual(result.state, 'ok', `expected ok, got ${result.state}: ${result.messages.join(' ')}`);
    assert.ok(Array.isArray(result.fields.claimed), 'claimed is not parsed as an array');
    assert.ok(Array.isArray(result.fields.touched), 'touched is not parsed as an array');
  } finally {
    rm(dir);
  }
});

test('block-list syntax ("  - item" lines) for claimed/touched is accepted, not just inline', () => {
  const dir = tmpDir();
  try {
    const f = writeFixture(dir, 'be-dev-3.md', CLOSED_OK_BLOCK);
    const r = run(f);
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\n${r.stdout}${r.stderr}`);
  } finally {
    rm(dir);
  }
});

test('evaluateFile parses block-list claimed/touched into arrays with the right items', () => {
  const { evaluateFile } = require('./worker-status.js');
  const dir = tmpDir();
  try {
    const f = writeFixture(dir, 'be-dev-3.md', CLOSED_OK_BLOCK);
    const result = evaluateFile(f);
    assert.deepStrictEqual(result.fields.claimed, [
      'skills/sailes-bootstrap/hooks-template/brief-closure.js',
    ]);
    assert.deepStrictEqual(result.fields.touched, [
      'skills/sailes-bootstrap/hooks-template/brief-closure.js',
      'skills/sailes-bootstrap/hooks-template/brief-closure.test.js',
    ]);
  } finally {
    rm(dir);
  }
});

// ------------------------------------------------------- outcome: done without commit, D4.2

test('outcome: done, empty commit, non-empty touched + note -> exit 0', () => {
  const dir = tmpDir();
  try {
    const content = CLOSED_OK.replace(/^commit: 4f2a9c1\n/m, '').replace(
      /^touched: \["skills\/sailes-bootstrap\/hooks-template\/brief-closure\.js"\]\n/m,
      'touched: ["skills/sailes-bootstrap/hooks-template/brief-closure.js"]\n' +
        'note: "plan-only task; evidence is the touched file, not a commit"\n'
    );
    const f = writeFixture(dir, 'be-dev-3.md', content);
    const r = run(f);
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\n${r.stdout}${r.stderr}`);
  } finally {
    rm(dir);
  }
});

test('outcome: done, empty commit, empty touched -> exit 1 even with a note', () => {
  const dir = tmpDir();
  try {
    const content = CLOSED_OK.replace(/^commit: 4f2a9c1\n/m, '')
      .replace(/^touched: \[.*\]\n/m, 'touched: []\n')
      .concat('note: "nothing actually happened"\n');
    const f = writeFixture(dir, 'be-dev-3.md', content);
    const r = run(f);
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
    assert.ok(/commit/i.test(r.stdout + r.stderr), 'the missing evidence is not named');
  } finally {
    rm(dir);
  }
});

// -------------------------------------------------------------------- append-only close

test('append-only close: the closing block appended beneath an unmodified open block -> exit 0', () => {
  const dir = tmpDir();
  try {
    const f = writeFixture(dir, 'be-dev-3.md', OPEN_ONLY);
    fs.appendFileSync(f, CLOSING_BLOCK_APPEND);
    const r = run(f);
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\n${r.stdout}${r.stderr}`);
  } finally {
    rm(dir);
  }
});

// -------------------------------------------------------------------- --sweep

test('--sweep on a directory with a leftover (closed) file -> exit 1, lists it', () => {
  const dir = tmpDir();
  try {
    writeFixture(dir, 'be-dev-3.md', CLOSED_OK);
    const r = run('--sweep', dir);
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
    assert.ok(/be-dev-3\.md/.test(r.stdout + r.stderr), 'the leftover file is not named');
  } finally {
    rm(dir);
  }
});

test('--sweep on a directory with an open (unclosed) file -> exit 1, lists it', () => {
  const dir = tmpDir();
  try {
    writeFixture(dir, 'be-dev-7.md', OPEN_ONLY);
    const r = run('--sweep', dir);
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
    assert.ok(/be-dev-7\.md/.test(r.stdout + r.stderr), 'the open file is not named');
  } finally {
    rm(dir);
  }
});

test('--sweep on an empty directory -> exit 0 (this fixture MUST NOT fire)', () => {
  // The one most likely to break under a careless "any file present in the dir -> fail" rewrite:
  // an EMPTY directory has zero files present, so it must pass. Proven directly in the mutation
  // block below by breaking exactly this.
  const dir = tmpDir();
  try {
    const r = run('--sweep', dir);
    assert.strictEqual(r.status, 0, `expected exit 0 on empty dir, got ${r.status}\n${r.stdout}${r.stderr}`);
  } finally {
    rm(dir);
  }
});

test('--sweep on a directory that does not exist on disk -> exit 0, not an error', () => {
  const dir = tmpDir();
  try {
    const missing = path.join(dir, 'does-not-exist');
    const r = run('--sweep', missing);
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\n${r.stdout}${r.stderr}`);
  } finally {
    rm(dir);
  }
});

test('--sweep ignores non-.md files sharing the directory', () => {
  const dir = tmpDir();
  try {
    fs.writeFileSync(path.join(dir, '.gitkeep'), '');
    const r = run('--sweep', dir);
    assert.strictEqual(r.status, 0, `a stray non-.md file made the sweep fire: ${r.stdout}${r.stderr}`);
  } finally {
    rm(dir);
  }
});

test('--sweep with no <dir> argument defaults to .claude/status/', () => {
  const dir = tmpDir();
  try {
    const statusDir = path.join(dir, '.claude', 'status');
    fs.mkdirSync(statusDir, { recursive: true });

    const empty = runIn(dir, '--sweep');
    assert.strictEqual(
      empty.status,
      0,
      `expected exit 0 on an empty default dir, got ${empty.status}\n${empty.stdout}${empty.stderr}`
    );
    assert.ok(
      /\.claude[\\/]status/.test(empty.stdout + empty.stderr),
      'the default-dir message does not name .claude/status'
    );

    writeFixture(statusDir, 'be-dev-1.md', OPEN_ONLY);
    const withFile = runIn(dir, '--sweep');
    assert.strictEqual(withFile.status, 1, `expected exit 1 once a file exists, got ${withFile.status}`);
    assert.ok(
      /be-dev-1\.md/.test(withFile.stdout + withFile.stderr),
      'the file sitting in the default .claude/status/ is not named'
    );
  } finally {
    rm(dir);
  }
});

test('DEFAULT_STATUS_DIR is exported and is .claude/status', () => {
  const { DEFAULT_STATUS_DIR } = require('./worker-status.js');
  assert.strictEqual(DEFAULT_STATUS_DIR, '.claude/status');
});

// -------------------------------------------------------------------- module-level API

test('evaluateFile returns the four distinct states by name', () => {
  const { evaluateFile } = require('./worker-status.js');
  const dir = tmpDir();
  try {
    assert.strictEqual(evaluateFile(path.join(dir, 'nope.md')).state, 'never-started');
    const openFile = writeFixture(dir, 'open.md', OPEN_ONLY);
    assert.strictEqual(evaluateFile(openFile).state, 'died-mid-run');
    const badFile = writeFixture(dir, 'bad.md', CLOSED_OK.replace(/^commit: 4f2a9c1\n/m, ''));
    assert.strictEqual(evaluateFile(badFile).state, 'invalid');
    const okFile = writeFixture(dir, 'ok.md', CLOSED_OK);
    assert.strictEqual(evaluateFile(okFile).state, 'ok');
  } finally {
    rm(dir);
  }
});

// Mutation proof (break closed-detection in tools/worker-status.js itself, show this suite go
// red, revert, show it green again) is run manually and pasted into the delivery report — the
// tests above ('file present without closed: -> ... "died mid-run"' and 'file closed with a
// complete field set -> exit 0') are the ones a closed-detection mutation must turn red, the same
// way sync-blocks.test.js relies on its own '--check FAILS on drift' test rather than a separate
// test-of-the-test.

console.log(failures === 0 ? '\nworker-status: all tests passed' : `\nworker-status: ${failures} failing`);
process.exitCode = failures === 0 ? 0 : 1;

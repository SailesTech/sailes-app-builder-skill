#!/usr/bin/env node
'use strict';

/**
 * Executable tests for the worker return check.
 *
 * The check is deterministic — it reads disk and git and prints a verdict — so it gets a real
 * test, not an eval (AGENTS.md §Verification). Whether a *lead* runs it before writing the run
 * log is model behavior, and that half lives in `evals/lead-measures-the-return-before-logging-it.md`.
 *
 * Both directions, always. A detection-only suite proves the instrument fires and says nothing
 * about whether it fires on correct work — and an instrument that flags a good return gets argued
 * with once and ignored after that. So every EMPTY-RETURN case here has a matching PRODUCED case
 * built from the same fixture with one thing changed.
 *
 * Fixtures are written CRLF on purpose: this repo is CRLF on disk, and a byte count built around
 * `\n` would pass an LF fixture and mis-measure production files.
 *
 * No test framework on purpose: the repo has no runner and this needs none.
 * Run: node tools/worker-return-check.test.js
 */

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const lib = require('./worker-return-check.js');

let failures = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL ${name}\n       ${error && error.message}`);
  }
}

function writeCRLF(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text.replace(/\n/g, '\r\n'), 'utf8');
}

/** A real git repo with one commit, so diffstat has something to compare against. */
function makeRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wrc-'));
  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });
  git('init', '-q');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'test');
  git('config', 'commit.gpgsign', 'false');
  writeCRLF(path.join(dir, 'seed.txt'), 'seed\n');
  git('add', '.');
  git('commit', '-q', '-m', 'seed');
  return dir;
}

// ---------------------------------------------------------------- deliverable inspection

test('a file with content is present, and its content bytes exclude whitespace', () => {
  const dir = makeRepo();
  writeCRLF(path.join(dir, 'out.md'), '# findings\nauth maps to three files\n');
  const result = lib.inspectDeliverable(dir, 'out.md');
  assert.strictEqual(result.state, 'present');
  // "#findingsauthmapstothreefiles" — 29 bytes, and notably not the file size, which CRLF inflates.
  assert.strictEqual(result.bytes, 29);
});

test('a whitespace-only file is empty, not present — "no file = task not done" means content', () => {
  const dir = makeRepo();
  writeCRLF(path.join(dir, 'out.md'), '\n\n   \n\t\n');
  assert.strictEqual(lib.inspectDeliverable(dir, 'out.md').state, 'empty');
});

test('a missing file is missing, and a directory is not a file', () => {
  const dir = makeRepo();
  fs.mkdirSync(path.join(dir, 'somedir'));
  assert.strictEqual(lib.inspectDeliverable(dir, 'nope.md').state, 'missing');
  assert.strictEqual(lib.inspectDeliverable(dir, 'somedir').state, 'not-a-file');
});

// ---------------------------------------------------------------- diffstat

test('an unchanged tree reports zero files, and a changed one reports the counts', () => {
  const dir = makeRepo();
  const clean = lib.diffstat(dir, '');
  assert.strictEqual(clean.available, true);
  assert.strictEqual(clean.files, 0);

  writeCRLF(path.join(dir, 'seed.txt'), 'seed\nsecond line\n');
  const dirty = lib.diffstat(dir, '');
  assert.strictEqual(dirty.files, 1);
  assert.strictEqual(dirty.insertions, 1);
});

test('a directory that is not a repo reports unavailable instead of throwing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wrc-nogit-'));
  const result = lib.diffstat(dir, '');
  assert.strictEqual(result.available, false);
  assert.strictEqual(result.files, 0);
});

// ---------------------------------------------------------------- verdicts, both directions
//
// The verdict is decided by the NAMED DELIVERABLES ALONE. Every case below therefore pins that the
// diff has no vote — the correction the 2026-09-04 adversarial audit forced, after it reproduced a
// worker that produced nothing scoring PRODUCED on bytes the lead had written.

test('EMPTY-RETURN: the named deliverable is missing and the tree did not move', () => {
  const dir = makeRepo();
  const result = lib.run(['--cwd', dir, '--deliverable', 'findings.md']);
  assert.strictEqual(result.verdict, 'EMPTY-RETURN');
  assert.strictEqual(result.exitCode, 1);
});

test('PRODUCED: the same fixture with the deliverable written — the instrument does not flag good work', () => {
  const dir = makeRepo();
  writeCRLF(path.join(dir, 'findings.md'), '# findings\nreal content\n');
  const result = lib.run(['--cwd', dir, '--deliverable', 'findings.md']);
  assert.strictEqual(result.verdict, 'PRODUCED');
  assert.strictEqual(result.exitCode, 0);
});

test('EMPTY-RETURN: a created-but-empty deliverable is not a return', () => {
  const dir = makeRepo();
  writeCRLF(path.join(dir, 'findings.md'), '\n\n');
  assert.strictEqual(lib.run(['--cwd', dir, '--deliverable', 'findings.md']).verdict, 'EMPTY-RETURN');
});

test('PARTIAL: two named deliverables, one written', () => {
  const dir = makeRepo();
  writeCRLF(path.join(dir, 'a.md'), 'content\n');
  const result = lib.run(['--cwd', dir, '--deliverable', 'a.md', '--deliverable', 'b.md']);
  assert.strictEqual(result.verdict, 'PARTIAL');
  assert.strictEqual(result.exitCode, 0);
});

test('ATTRIBUTION: someone else moving the tree cannot turn an empty return into a produced one', () => {
  // The reproduced defect: the lead edits one file, the worker delivers nothing, and the old
  // instrument printed PRODUCED · diff 1f +1/-0 · exit 0. Bytes in a repo belong to nobody.
  const dir = makeRepo();
  writeCRLF(path.join(dir, 'seed.txt'), 'seed\nthe LEAD edited this, not the worker\n');
  const result = lib.run(['--cwd', dir, '--deliverable', 'findings.md']);
  assert.strictEqual(result.verdict, 'EMPTY-RETURN');
  assert.strictEqual(result.exitCode, 1);
});

test('ATTRIBUTION: a moved tree does not soften 0-of-N into PARTIAL either', () => {
  const dir = makeRepo();
  writeCRLF(path.join(dir, 'seed.txt'), 'seed\nunrelated change\n');
  const result = lib.run(['--cwd', dir, '--deliverable', 'a.md', '--deliverable', 'b.md']);
  assert.strictEqual(result.verdict, 'EMPTY-RETURN');
});

test('NOT-COMPUTABLE whenever no file was named — a moved tree is not a substitute for a brief', () => {
  const moved = makeRepo();
  writeCRLF(path.join(moved, 'seed.txt'), 'seed\nchanged\n');
  assert.strictEqual(lib.run(['--cwd', moved]).verdict, 'NOT-COMPUTABLE');

  const still = makeRepo();
  assert.strictEqual(lib.run(['--cwd', still]).verdict, 'NOT-COMPUTABLE');

  const noRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'wrc-none-'));
  const result = lib.run(['--cwd', noRepo]);
  assert.strictEqual(result.verdict, 'NOT-COMPUTABLE');
  assert.strictEqual(result.exitCode, 2);
});

test('a named deliverable outside a repo is still measurable — the easy half does not die with git', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wrc-nogit2-'));
  writeCRLF(path.join(dir, 'findings.md'), 'content\n');
  assert.strictEqual(lib.run(['--cwd', dir, '--deliverable', 'findings.md']).verdict, 'PRODUCED');
});

// ---------------------------------------------------------------- the reported tree numbers

test('UNTRACKED: a brand-new file counts in the tree figure — git diff alone never sees it', () => {
  const dir = makeRepo();
  const before = lib.diffstat(dir, '');
  writeCRLF(path.join(dir, 'brand-new.md'), 'the most common shape of a worker artifact\n');
  const after = lib.diffstat(dir, '');
  assert.strictEqual(before.files, 0);
  assert.strictEqual(after.files, 1);
  assert.strictEqual(after.untracked, 1);
});

test('--base compares the working tree, not committed history — workers never commit', () => {
  const dir = makeRepo();
  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });
  git('branch', 'base-point');
  // Uncommitted work, which is exactly what a worker leaves behind.
  writeCRLF(path.join(dir, 'seed.txt'), 'seed\nuncommitted worker edit\n');
  const result = lib.diffstat(dir, 'base-point');
  assert.strictEqual(result.available, true);
  assert.strictEqual(result.files, 1);
  assert.strictEqual(result.insertions, 1);
});

test('--base does not vote either: a moved tree against a base is still not a deliverable', () => {
  const dir = makeRepo();
  execFileSync('git', ['branch', 'base-point'], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });
  writeCRLF(path.join(dir, 'seed.txt'), 'seed\nedited\n');
  const result = lib.run(['--cwd', dir, '--base', 'base-point', '--deliverable', 'findings.md']);
  assert.strictEqual(result.verdict, 'EMPTY-RETURN');
});

// ---------------------------------------------------------------- rendering and arguments

test('the rendered line carries counts, never adjectives', () => {
  const dir = makeRepo();
  writeCRLF(path.join(dir, 'findings.md'), 'content here\n');
  const { text } = lib.run(['--cwd', dir, '--deliverable', 'findings.md', '--label', 'explorer:auth']);
  assert.ok(text.startsWith('PRODUCED · explorer:auth · deliverables 1/1 · tree '), text);
  assert.ok(/\(unattributed\)/.test(text), text);
  assert.ok(!/looks|appears|seems|fine|good/i.test(text), text);
});

test('an EMPTY-RETURN says what to do next — chase, not record', () => {
  const dir = makeRepo();
  const { text } = lib.run(['--cwd', dir, '--deliverable', 'findings.md']);
  assert.ok(/chase the worker once/.test(text), text);
  assert.ok(/do not record this as/.test(text), text);
});

test('plain text names WHY git was unavailable — not-a-repo and a bad --base must not read alike', () => {
  const noRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'wrc-why1-'));
  writeCRLF(path.join(noRepo, 'findings.md'), 'content\n');
  const outsideRepo = lib.run(['--cwd', noRepo, '--deliverable', 'findings.md']).text;

  const repo = makeRepo();
  writeCRLF(path.join(repo, 'findings.md'), 'content\n');
  const badRef = lib.run(['--cwd', repo, '--deliverable', 'findings.md', '--base', 'no-such-ref']).text;

  assert.ok(/tree unreadable \(/.test(outsideRepo), outsideRepo);
  assert.ok(/tree unreadable \(/.test(badRef), badRef);
  // The whole point: the operator can tell the harmless case from their own broken argument.
  assert.notStrictEqual(
    /tree unreadable \(([^)]*)\)/.exec(outsideRepo)[1],
    /tree unreadable \(([^)]*)\)/.exec(badRef)[1],
  );
});

test('firstLine prefers the fatal line and caps its length', () => {
  assert.strictEqual(lib.firstLine('Command failed\nfatal: not a git repository\n'), 'fatal: not a git repository');
  assert.strictEqual(lib.firstLine(''), 'git failed');
  assert.ok(lib.firstLine(`fatal: ${'x'.repeat(400)}`).length <= 120);
});

test('--json emits the same verdict as a machine-readable object', () => {
  const dir = makeRepo();
  writeCRLF(path.join(dir, 'findings.md'), 'content\n');
  const { text } = lib.run(['--cwd', dir, '--deliverable', 'findings.md', '--json']);
  const parsed = JSON.parse(text);
  assert.strictEqual(parsed.verdict, 'PRODUCED');
  assert.strictEqual(parsed.deliverables[0].state, 'present');
});

test('an unknown flag is an error — a silently ignored flag is a silent gate', () => {
  assert.throws(() => lib.parseArgs(['--delivrable', 'typo.md']), /unknown argument/);
});

test('a flag without a value is an error rather than swallowing the next flag', () => {
  assert.throws(() => lib.parseArgs(['--deliverable', '--json']), /needs a value/);
});

test('the CLI exits 1 on EMPTY-RETURN, so a caller can gate on it', () => {
  const dir = makeRepo();
  let code = 0;
  try {
    execFileSync('node', [path.join(__dirname, 'worker-return-check.js'), '--cwd', dir, '--deliverable', 'x.md'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    code = error.status;
  }
  assert.strictEqual(code, 1);
});

console.log(failures === 0 ? '\nworker-return-check: all tests passed' : `\nworker-return-check: ${failures} failing`);
process.exit(failures === 0 ? 0 : 1);

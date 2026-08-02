#!/usr/bin/env node
'use strict';

/**
 * Tests for tools/worker-status.js — the reader/validator for `.ai/status/<worker-id>.md`.
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

/** Like run(), but with a chosen working directory — needed for the bare `--sweep` tests below,
 * since a bare `--sweep` resolves `.claude/status/` (and `.claude/worktrees/`) relative to cwd. */
function runIn(cwd, args) {
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

const OPEN_ONLY = [
  'worker: be-dev-3',
  'task: "F2 — check domkniecia briefu"',
  'base: e276a5e',
  'claimed: ["skills/sailes-bootstrap/hooks-template/brief-closure.js"]',
  'opened: 2026-08-02T09:14:00Z',
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

// ------------------------------------------------------ --sweep (bare): worktree fallback walk

test('bare --sweep finds a status file that fell back into a worktree, and labels it', () => {
  const root = tmpDir();
  try {
    const wtStatusDir = path.join(root, '.claude', 'worktrees', 'agent-fallback', '.claude', 'status');
    fs.mkdirSync(wtStatusDir, { recursive: true });
    writeFixture(wtStatusDir, 'be-dev-9.md', OPEN_ONLY);

    const r = runIn(root, ['--sweep']);
    const out = r.stdout + r.stderr;
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}\n${out}`);
    assert.ok(/agent-fallback/.test(out), 'the worktree name is not named');
    assert.ok(/be-dev-9\.md/.test(out), 'the fallback file is not named');
    assert.ok(/worktree/i.test(out), 'the finding is not labelled as a worktree fallback');
  } finally {
    rm(root);
  }
});

test('bare --sweep reports a normal local claim WITHOUT a worktree label', () => {
  const root = tmpDir();
  try {
    const statusDir = path.join(root, '.claude', 'status');
    fs.mkdirSync(statusDir, { recursive: true });
    writeFixture(statusDir, 'be-dev-3.md', OPEN_ONLY);

    const r = runIn(root, ['--sweep']);
    const out = r.stdout + r.stderr;
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}\n${out}`);
    assert.ok(/be-dev-3\.md/.test(out), 'the local claim is not named');
    assert.ok(!/\[worktree/.test(out), 'a normal local claim must not be labelled as a fallback');
  } finally {
    rm(root);
  }
});

test('a worktree with no .claude/status/ is skipped silently — not reported at all', () => {
  const root = tmpDir();
  try {
    // A worktree directory that exists but never hit the fallback path — the normal case.
    fs.mkdirSync(path.join(root, '.claude', 'worktrees', 'agent-clean'), { recursive: true });

    const r = runIn(root, ['--sweep']);
    const out = r.stdout + r.stderr;
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\n${out}`);
    assert.ok(!/agent-clean/.test(out), 'a worktree with no status dir must not appear in the report');
  } finally {
    rm(root);
  }
});

test('--sweep <explicit-dir> does NOT walk worktrees, even when a fallback claim exists', () => {
  const root = tmpDir();
  try {
    // Deliberately reuse the SAME `.claude/status` path the bare form would default to, and put
    // the worktree fallback at the exact sibling location the walk logic would compute from it
    // (`.claude/worktrees`) — so passing the dir explicitly is the only thing standing between this
    // test and the fallback being found. A weaker fixture (an unrelated directory elsewhere) would
    // pass this test even if the "explicit dir disables the walk" guard were deleted, because the
    // walk would then be looking in the wrong place by accident rather than being off by design.
    const statusDir = path.join(root, '.claude', 'status');
    fs.mkdirSync(statusDir, { recursive: true }); // exists and is empty

    const wtStatusDir = path.join(root, '.claude', 'worktrees', 'agent-fallback', '.claude', 'status');
    fs.mkdirSync(wtStatusDir, { recursive: true });
    writeFixture(wtStatusDir, 'be-dev-9.md', OPEN_ONLY);

    const r = runIn(root, ['--sweep', statusDir]);
    const out = r.stdout + r.stderr;
    assert.strictEqual(
      r.status,
      0,
      `explicit dir is empty and worktrees must not be walked, expected exit 0, got ${r.status}\n${out}`
    );
    assert.ok(!/agent-fallback/.test(out), 'an explicit --sweep <dir> walked worktrees — it must not');
    assert.ok(!/be-dev-9/.test(out), 'the worktree-only fallback file leaked into an explicit-dir sweep');
  } finally {
    rm(root);
  }
});

test('bare --sweep with nothing at all (no status dir, no worktrees dir) -> exit 0', () => {
  // The fixture most likely to be broken by a careless worktree-walk rewrite: an empty repo, no
  // `.claude/status/`, no `.claude/worktrees/` — must still pass, not throw and not report.
  const root = tmpDir();
  try {
    const r = runIn(root, ['--sweep']);
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\n${r.stdout}${r.stderr}`);
  } finally {
    rm(root);
  }
});

test('findWorktreeStatusFallbacks: finds fallbacks, skips worktrees with no status dir, tolerates a missing worktrees root', () => {
  const { findWorktreeStatusFallbacks } = require('./worker-status.js');
  const root = tmpDir();
  try {
    assert.deepStrictEqual(
      findWorktreeStatusFallbacks(path.join(root, 'does-not-exist')),
      [],
      'a missing worktrees root must yield no findings, not throw'
    );

    const worktreesRoot = path.join(root, 'worktrees');
    fs.mkdirSync(path.join(worktreesRoot, 'agent-clean'), { recursive: true });
    const wtStatusDir = path.join(worktreesRoot, 'agent-fallback', '.claude', 'status');
    fs.mkdirSync(wtStatusDir, { recursive: true });
    writeFixture(wtStatusDir, 'be-dev-9.md', OPEN_ONLY);

    const found = findWorktreeStatusFallbacks(worktreesRoot);
    assert.strictEqual(found.length, 1, 'expected exactly one fallback finding');
    assert.strictEqual(found[0].worktree, 'agent-fallback');
    assert.strictEqual(found[0].name, 'be-dev-9.md');
  } finally {
    rm(root);
  }
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
//
// Same discipline applies to the worktree walk added for the fallback-claim sweep: 'bare --sweep
// finds a status file that fell back into a worktree, and labels it' and '--sweep <explicit-dir>
// does NOT walk worktrees, even when a fallback claim exists' are the pair a walk-breaking mutation
// must turn red — proof pasted into the delivery report the same way.

console.log(failures === 0 ? '\nworker-status: all tests passed' : `\nworker-status: ${failures} failing`);
process.exitCode = failures === 0 ? 0 : 1;

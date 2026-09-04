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

// ------------------------------------------------- what real workers actually wrote (2026-08-02)

test('a block-list claim is read, not reported missing — REGRESSION GUARD', () => {
  // This support existed, was lost in a merge-conflict resolution, and the loss was invisible
  // because the integration check counted two OTHER symbols and declared consistency — the exact
  // lesson recorded that same day, repeated within hours of writing it. Two real status files were
  // rejected before anyone noticed.
  const dir = tmpDir();
  try {
    const f = writeFixture(
      dir,
      'be-dev-8.md',
      'worker: be-dev-8\ntask: t\nbase: e276a5e\nclaimed:\n  - a.ts\n  - b.ts\nopened: 2026-08-02\n' +
        'closed: 2026-08-02\noutcome: done\ncommit: 4f2a9c1\ntouched:\n  - a.ts\n'
    );
    const r = run(f);
    assert.strictEqual(r.status, 0, `block-list file rejected: ${r.stdout}${r.stderr}`);
  } finally {
    rm(dir);
  }
});

test('outcome carrying a trailing reason is accepted — the token is read off the front', () => {
  // Every real worker wrote `done — <why>`; both were rejected outright. A validator that refuses
  // a field for carrying MORE than the minimum is pedantic at the reader's expense.
  const dir = tmpDir();
  try {
    const f = writeFixture(
      dir,
      'be-dev-8.md',
      CLOSED_OK.replace('outcome: done', 'outcome: done — tests and mutation proof green')
    );
    assert.strictEqual(run(f).status, 0, 'a reasoned outcome was rejected');
  } finally {
    rm(dir);
  }
});

test('outcome that is not one of the tokens is still rejected — the guard did not just vanish', () => {
  const dir = tmpDir();
  try {
    const f = writeFixture(dir, 'be-dev-8.md', CLOSED_OK.replace('outcome: done', 'outcome: mostly fine'));
    assert.strictEqual(run(f).status, 1, 'any prose now passes as an outcome');
  } finally {
    rm(dir);
  }
});

test('a commit field holding prose instead of a sha is REJECTED', () => {
  // Measured 2026-08-02: a worker with nothing to commit wrote its reason into `commit:` and it
  // satisfied the check that exists to make `done` verifiable — an explanation laundered into
  // evidence by the one field whose whole job is to be checkable.
  const dir = tmpDir();
  try {
    const f = writeFixture(
      dir,
      'be-dev-8.md',
      CLOSED_OK.replace('commit: 4f2a9c1', 'commit: (none — I am in the main working tree)')
    );
    const r = run(f);
    assert.strictEqual(r.status, 1, 'prose passed as a commit');
    assert.ok(/does not start with a sha/.test(r.stdout + r.stderr), 'the reason is not named');
  } finally {
    rm(dir);
  }
});

test('a sha followed by a note is fine — only a missing sha is the problem', () => {
  const dir = tmpDir();
  try {
    const f = writeFixture(
      dir,
      'be-dev-8.md',
      CLOSED_OK.replace('commit: 4f2a9c1', 'commit: 4f2a9c1 (branch worktree-agent-abc)')
    );
    assert.strictEqual(run(f).status, 0, 'a sha with a trailing note was rejected');
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


// ---------------------------------------------------------------------------------------------
// --verify: the declaration against the tree it describes.
//
// Every assertion below has a matching must-not-flag case built from the same fixture with one
// thing changed. A verifier that reports a discrepancy on a truthful declaration is worse than
// none — this repo has two documented checks that were disabled for crying wolf, and the doctrine
// this mode implements says so in the same breath as it asks for the check.

const lib = require('./worker-status.js');

/** A repo with one commit on top of `base`, touching exactly `files`. Returns the sha. */
function repoWithCommit(dir, files, { baseBranch = 'base-point' } = {}) {
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8' });
  g('init', '-q');
  g('config', 'user.email', 't@example.com');
  g('config', 'user.name', 't');
  g('config', 'commit.gpgsign', 'false');
  fs.writeFileSync(path.join(dir, 'seed.txt'), 'seed\n');
  g('add', '.');
  g('commit', '-q', '-m', 'seed');
  g('branch', baseBranch);
  for (const [name, body] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), body);
  }
  g('add', '-A');
  g('commit', '-q', '-m', 'work');
  return g('rev-parse', 'HEAD').stdout.trim();
}

function statusFile(dir, fields) {
  const file = path.join(dir, 'status.md');
  const lines = [
    `worker: ${fields.worker || 'be-dev-1'}`,
    `task: ${fields.task || 'a task'}`,
    `base: ${fields.base}`,
    `claimed: [${(fields.claimed || []).map((p) => `"${p}"`).join(', ')}]`,
    `opened: ${fields.opened || '2026-09-04T10:00:00Z'}`,
    `closed: ${fields.closed || '2026-09-04T11:00:00Z'}`,
    `outcome: ${fields.outcome || 'done'}`,
    `commit: ${fields.commit}`,
    `touched: [${(fields.touched || []).map((p) => `"${p}"`).join(', ')}]`,
  ];
  fs.writeFileSync(file, `${lines.join('\n')}\n`);
  return file;
}

test('--verify passes a truthful declaration and says so', () => {
  const dir = tmpDir();
  const sha = repoWithCommit(dir, { 'a.ts': 'export const a = 1;\n' });
  const file = statusFile(dir, { base: 'base-point', commit: sha, touched: ['a.ts'] });
  const r = lib.verifyAgainstTree(file, dir);
  assert.strictEqual(r.ok, true, r.messages.join('\n'));
  assert.strictEqual(r.findings.length, 0, JSON.stringify(r.findings));
  rm(dir);
});

test('--verify flags a commit sha that does not exist — the shape check cannot', () => {
  const dir = tmpDir();
  repoWithCommit(dir, { 'a.ts': 'export const a = 1;\n' });
  const file = statusFile(dir, { base: 'base-point', commit: '4f2a1c9', touched: ['a.ts'] });
  const r = lib.verifyAgainstTree(file, dir);
  assert.ok(r.findings.some((f) => f.kind === 'commit-missing'), JSON.stringify(r.findings));
  rm(dir);
});

test('--verify flags touched in BOTH directions — declared-not-changed and changed-not-declared', () => {
  const dir = tmpDir();
  const sha = repoWithCommit(dir, { 'a.ts': 'export const a = 1;\n', 'c.ts': 'export const c = 3;\n' });
  // The arm-1 shape from lead-verifies-status-against-worktree: declares a.ts and b.ts, changed a.ts and c.ts.
  const file = statusFile(dir, { base: 'base-point', commit: sha, touched: ['a.ts', 'b.ts'] });
  const r = lib.verifyAgainstTree(file, dir);
  assert.ok(r.findings.some((f) => f.kind === 'declared-not-changed' && f.detail === 'b.ts'), JSON.stringify(r.findings));
  assert.ok(r.findings.some((f) => f.kind === 'changed-not-declared' && f.detail === 'c.ts'), JSON.stringify(r.findings));
  rm(dir);
});

test('--verify flags a DECLARED FILE THAT IS EMPTY — existence is not content', () => {
  // The gap the doctrine does not name: a file can be created, committed, listed in the diff, and
  // hold nothing. Every other check in this repo — including repo-done-checklist's `-e` — says OK.
  const dir = tmpDir();
  const sha = repoWithCommit(dir, { 'report.md': '\n\n   \n' });
  const file = statusFile(dir, { base: 'base-point', commit: sha, touched: ['report.md'] });
  const r = lib.verifyAgainstTree(file, dir);
  assert.ok(r.findings.some((f) => f.kind === 'declared-empty' && f.detail === 'report.md'), JSON.stringify(r.findings));
  rm(dir);
});

test('--verify does NOT flag a file that merely looks small — one character is content', () => {
  const dir = tmpDir();
  const sha = repoWithCommit(dir, { 'report.md': 'x' });
  const file = statusFile(dir, { base: 'base-point', commit: sha, touched: ['report.md'] });
  const r = lib.verifyAgainstTree(file, dir);
  assert.ok(!r.findings.some((f) => f.kind === 'declared-empty'), JSON.stringify(r.findings));
  rm(dir);
});

test('--verify flags a base that is not an ancestor of the commit', () => {
  const dir = tmpDir();
  const sha = repoWithCommit(dir, { 'a.ts': 'export const a = 1;\n' });
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8' });
  // An orphan branch shares no history with the commit, which is the stale-base shape.
  g('checkout', '-q', '--orphan', 'elsewhere');
  g('rm', '-rq', '--cached', '.');
  fs.writeFileSync(path.join(dir, 'other.txt'), 'other\n');
  g('add', 'other.txt');
  g('commit', '-q', '-m', 'orphan');
  g('checkout', '-q', 'master');
  const file = statusFile(dir, { base: 'elsewhere', commit: sha, touched: ['a.ts'] });
  const r = lib.verifyAgainstTree(file, dir);
  assert.ok(r.findings.some((f) => f.kind === 'base-not-ancestor'), JSON.stringify(r.findings));
  rm(dir);
});

test('--verify refuses to grade an unclosed declaration instead of passing it', () => {
  const dir = tmpDir();
  const sha = repoWithCommit(dir, { 'a.ts': 'export const a = 1;\n' });
  const file = path.join(dir, 'open.md');
  fs.writeFileSync(file, `worker: be-dev-1\ntask: t\nbase: base-point\nclaimed: ["a.ts"]\nopened: 2026-09-04T10:00:00Z\n`);
  const r = lib.verifyAgainstTree(file, dir);
  assert.strictEqual(r.ok, false);
  assert.ok(r.findings.some((f) => f.kind === 'not-closed'), JSON.stringify(r.findings));
  assert.ok(r.messages.join('\n').includes('only checkable once it is closed'));
  rm(dir);
  void sha;
});

test('--verify says "could not establish" rather than "no" when the range is unreadable', () => {
  const dir = tmpDir();
  const sha = repoWithCommit(dir, { 'a.ts': 'export const a = 1;\n' });
  const file = statusFile(dir, { base: 'no-such-base', commit: sha, touched: ['a.ts'] });
  const r = lib.verifyAgainstTree(file, dir);
  assert.ok(r.findings.some((f) => f.kind === 'diff-unreadable'), JSON.stringify(r.findings));
  // and it must NOT invent a touched mismatch from a diff it never read
  assert.ok(!r.findings.some((f) => f.kind === 'changed-not-declared'), JSON.stringify(r.findings));
  rm(dir);
});

test('--verify reports and never blocks — the message says so out loud', () => {
  const dir = tmpDir();
  repoWithCommit(dir, { 'a.ts': 'export const a = 1;\n' });
  const file = statusFile(dir, { base: 'base-point', commit: 'deadbee', touched: ['a.ts'] });
  const r = lib.verifyAgainstTree(file, dir);
  assert.ok(/do NOT block integration/.test(r.messages.join('\n')), r.messages.join('\n'));
  rm(dir);
});

test('--verify through the CLI exits 1 on a discrepancy and 0 on a match', () => {
  const dir = tmpDir();
  const sha = repoWithCommit(dir, { 'a.ts': 'export const a = 1;\n' });
  const good = statusFile(dir, { base: 'base-point', commit: sha, touched: ['a.ts'] });
  assert.strictEqual(run('--verify', good, '--worktree', dir).status, 0);

  const badPath = path.join(dir, 'bad.md');
  fs.copyFileSync(good, badPath);
  fs.writeFileSync(badPath, fs.readFileSync(good, 'utf8').replace('"a.ts"', '"zzz.ts"'));
  assert.strictEqual(run('--verify', badPath, '--worktree', dir).status, 1);
  rm(dir);
});

test('--verify with a missing worktree says it cannot verify, not that the worker lied', () => {
  const dir = tmpDir();
  const sha = repoWithCommit(dir, { 'a.ts': 'x\n' });
  const file = statusFile(dir, { base: 'base-point', commit: sha, touched: ['a.ts'] });
  const r = lib.verifyAgainstTree(file, path.join(dir, 'no-such-worktree'));
  assert.ok(r.findings.some((f) => f.kind === 'worktree-missing'), JSON.stringify(r.findings));
  rm(dir);
});

console.log(failures === 0 ? '\nworker-status: all tests passed' : `\nworker-status: ${failures} failing`);
process.exitCode = failures === 0 ? 0 : 1;

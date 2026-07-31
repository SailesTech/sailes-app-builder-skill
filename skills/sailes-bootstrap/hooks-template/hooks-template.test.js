#!/usr/bin/env node
'use strict';

/**
 * Executable tests for the shell hooks this framework GENERATES into client repos.
 *
 * Why these exist. `AGENTS.md` states that deterministic behavior — a hook that reads disk and
 * prints text — gets a real test, and model behavior gets an eval. Until 2026-07-31 that rule had a
 * hole exactly where it hurt most: `hooks/*.test.js` covered this repo's own JS hooks, while the
 * shell templates that ship to EVERY generated repo had no test at all. Spec
 * 2026-07-30-sailerem-lessons-to-doctrine (D9) added conditional logic to both of them, and a hook
 * that fails silently is the worst thing to leave unmeasured: silence is also what success looks
 * like.
 *
 * How they are driven: the way the harness drives them. JSON on stdin, text (or nothing) on stdout,
 * an exit code that means block-or-allow. No framework, no dependencies.
 *
 * A note that has already cost this repo time: fixtures must use REAL Windows paths, never
 * MSYS-style `/c/Users/...`. Node on Windows does not resolve those, so the hook "passes" by staying
 * silent — for entirely the wrong reason (`AGENTS.md`, Hard safety rules).
 *
 * Run: node skills/sailes-bootstrap/hooks-template/hooks-template.test.js   (or `npm test`)
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const HOOKS = __dirname;
const SESSION_START = path.join(HOOKS, 'session-start.sh');
const GUARD = path.join(HOOKS, 'guard-protected-paths.sh');

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

/** `sh` must exist (Git Bash on Windows, /bin/sh elsewhere). Absent → SKIP, never a fake pass. */
function shAvailable() {
  const probe = spawnSync('sh', ['-c', 'exit 0'], { encoding: 'utf8' });
  return !probe.error;
}

/**
 * A throwaway git repo with a real commit — the hooks call `git rev-parse`, so a bare directory
 * would exercise a different branch than the one that ships.
 */
function makeRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-hooks-'));
  const git = (...args) =>
    execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  git('init', '-q');
  git('config', 'user.email', 'test@local');
  git('config', 'user.name', 'test');
  fs.mkdirSync(path.join(dir, '.ai'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'seed.txt'), 'seed\n');
  git('add', '.');
  git('commit', '-q', '-m', 'seed');
  const head = git('rev-parse', '--short', 'HEAD').trim();
  return { dir, head, git };
}

const rm = (d) => fs.rmSync(d, { recursive: true, force: true });

/** Run a hook the way the harness does: cwd = repo, JSON on stdin. */
function runHook(script, repoDir, stdin) {
  return spawnSync('sh', [script], {
    cwd: repoDir,
    input: stdin === undefined ? '' : stdin,
    encoding: 'utf8',
  });
}

if (!shAvailable()) {
  // Explicit skip, never silence — the framework's own rule for a missing instrument.
  console.log('  SKIP hooks-template tests: no POSIX `sh` on this machine (Git Bash provides one)');
  console.log('\nhooks-template: skipped');
  process.exit(0);
}

// ================================================================ session-start.sh

test('session-start emits STATE.md and the Task Router pointer', () => {
  const { dir } = makeRepo();
  try {
    fs.writeFileSync(path.join(dir, '.ai', 'STATE.md'), '# State\nVerified facts: none yet\n');
    const r = runHook(SESSION_START, dir, '{}');
    assert.ok(r.stdout.includes('Verified facts'), 'STATE.md content was not emitted');
    assert.ok(r.stdout.includes('Task Router'), 'the Task Router pointer is missing');
  } finally {
    rm(dir);
  }
});

test('a Last-commit that DISAGREES with HEAD produces a warning', () => {
  const { dir } = makeRepo();
  try {
    fs.writeFileSync(path.join(dir, '.ai', 'STATE.md'), '# State\nLast-commit: deadbee\n');
    const r = runHook(SESSION_START, dir, '{}');
    assert.ok(
      /WARNING/.test(r.stdout) && /deadbee/.test(r.stdout),
      'a stale Last-commit produced no warning — the reader believes the snapshot unchallenged'
    );
  } finally {
    rm(dir);
  }
});

test('a Last-commit that AGREES with HEAD is silent', () => {
  const { dir, head } = makeRepo();
  try {
    fs.writeFileSync(path.join(dir, '.ai', 'STATE.md'), `# State\nLast-commit: ${head}\n`);
    const r = runHook(SESSION_START, dir, '{}');
    assert.ok(!/WARNING/.test(r.stdout), 'a correct Last-commit produced a warning — cries wolf');
  } finally {
    rm(dir);
  }
});

test('NO Last-commit field is silent — every pre-existing repo lacks it', () => {
  const { dir } = makeRepo();
  try {
    fs.writeFileSync(path.join(dir, '.ai', 'STATE.md'), '# State\nno such field here\n');
    const r = runHook(SESSION_START, dir, '{}');
    assert.ok(
      !/WARNING/.test(r.stdout),
      'a repo without the field is warned at every session start; that hook gets muted, and the ' +
        'real case goes with it'
    );
  } finally {
    rm(dir);
  }
});

test('session-start never blocks — it warns and exits 0', () => {
  const { dir } = makeRepo();
  try {
    fs.writeFileSync(path.join(dir, '.ai', 'STATE.md'), '# State\nLast-commit: deadbee\n');
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0, 'the snapshot check must never block a session');
  } finally {
    rm(dir);
  }
});

// ================================================================ guard-protected-paths.sh

const dockerCall = JSON.stringify({
  tool_name: 'Bash',
  tool_input: { command: 'docker compose down' },
});
const harmlessCall = JSON.stringify({
  tool_name: 'Bash',
  tool_input: { command: 'npm test' },
});

test('ENV-LOCK present: a container/migration command is BLOCKED', () => {
  const { dir } = makeRepo();
  try {
    fs.writeFileSync(path.join(dir, '.ai', 'ENV-LOCK'), 'holder: qa\nsince: 2026-07-31T10:00:00Z\n');
    const r = runHook(GUARD, dir, dockerCall);
    assert.strictEqual(r.status, 2, 'the lock did not block — qa loses its run to this command');
    assert.ok(/held/i.test(r.stderr), 'the block gave no reason');
  } finally {
    rm(dir);
  }
});

test('the block names the holder and how to break the lock', () => {
  const { dir } = makeRepo();
  try {
    fs.writeFileSync(path.join(dir, '.ai', 'ENV-LOCK'), 'holder: qa\nsince: 2026-07-31T10:00:00Z\n');
    const r = runHook(GUARD, dir, dockerCall);
    assert.ok(/qa/.test(r.stderr), 'the holder is not named — nobody knows who to wait for');
    assert.ok(
      /rm .ai\/ENV-LOCK|rm \.ai\/ENV-LOCK/.test(r.stderr),
      'no escape path stated: a lock left by a crashed qa would block everyone with no way out, ' +
        'which is worse than having no lock at all'
    );
  } finally {
    rm(dir);
  }
});

test('ENV-LOCK present: an unrelated command still passes', () => {
  const { dir } = makeRepo();
  try {
    fs.writeFileSync(path.join(dir, '.ai', 'ENV-LOCK'), 'holder: qa\n');
    const r = runHook(GUARD, dir, harmlessCall);
    assert.strictEqual(r.status, 0, 'the lock blocks work it has no business blocking');
  } finally {
    rm(dir);
  }
});

test('NO ENV-LOCK: the same container command passes — the lock is what blocks, not the guard', () => {
  const { dir } = makeRepo();
  try {
    const r = runHook(GUARD, dir, dockerCall);
    assert.strictEqual(
      r.status,
      0,
      'blocked without a lock: this test is the fixture that must NOT fire, and it fired'
    );
  } finally {
    rm(dir);
  }
});

test('the pre-existing protected surface still blocks — no regression', () => {
  const { dir } = makeRepo();
  try {
    for (const [label, cmd] of [
      ['force-push', 'git push --force origin main'],
      ['reset --hard', 'git reset --hard HEAD~3'],
    ]) {
      const r = runHook(
        GUARD,
        dir,
        JSON.stringify({ tool_name: 'Bash', tool_input: { command: cmd } })
      );
      assert.strictEqual(r.status, 2, `${label} is no longer blocked — the ENV-LOCK edit broke it`);
    }
    const envRead = runHook(
      GUARD,
      dir,
      JSON.stringify({ tool_name: 'Read', tool_input: { file_path: 'apps/web/.env.local' } })
    );
    assert.strictEqual(envRead.status, 2, '.env is no longer protected');
  } finally {
    rm(dir);
  }
});

console.log(
  failures === 0 ? '\nhooks-template: all tests passed' : `\nhooks-template: ${failures} failing`
);
process.exit(failures === 0 ? 0 : 1);

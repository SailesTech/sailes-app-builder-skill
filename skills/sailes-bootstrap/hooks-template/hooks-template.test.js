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

/**
 * Run a hook the way the harness does: cwd = repo, JSON on stdin.
 * `env` merges over the inherited environment — the ENV-LOCK holder is identified by
 * SAILES_ENV_LOCK, so the token tests need to drive that variable.
 */
function runHook(script, repoDir, stdin, env) {
  return spawnSync('sh', [script], {
    cwd: repoDir,
    input: stdin === undefined ? '' : stdin,
    encoding: 'utf8',
    env: env ? { ...process.env, ...env } : process.env,
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


test('ONE commit behind because STATE.md was just committed is SILENT', () => {
  // The case the first version of this check got wrong, found 2026-07-31 an hour after release by
  // running the convention rather than reading it. Writing STATE.md means committing STATE.md,
  // which advances HEAD past the sha you just wrote — so an equality check warns at every session
  // start in a repo following the convention PERFECTLY. An alarm that always fires gets muted, and
  // it takes the real case with it. This is the most common state in a healthy repo, and the
  // original suite had no fixture for it.
  const { dir, head, git } = makeRepo();
  try {
    fs.writeFileSync(path.join(dir, '.ai', 'STATE.md'), `# State\nLast-commit: ${head}\n`);
    git('add', '.');
    git('commit', '-q', '-m', 'docs(state): write before walking away');
    const r = runHook(SESSION_START, dir, '{}');
    assert.ok(
      !/WARNING/.test(r.stdout),
      'the snapshot commit itself trips the alarm — every correct session start would warn'
    );
  } finally {
    rm(dir);
  }
});

test('HEAD moved and STATE.md was NOT touched → warning, with the distance', () => {
  // The real 2026-07-30 incident: nine commits of unrelated work, snapshot never updated.
  const { dir, head, git } = makeRepo();
  try {
    fs.writeFileSync(path.join(dir, '.ai', 'STATE.md'), `# State\nLast-commit: ${head}\n`);
    git('add', '.');
    git('commit', '-q', '-m', 'docs(state): snapshot');
    for (let i = 0; i < 3; i++) {
      fs.writeFileSync(path.join(dir, `work-${i}.txt`), `work ${i}\n`);
      git('add', '.');
      git('commit', '-q', '-m', `work ${i}`);
    }
    const r = runHook(SESSION_START, dir, '{}');
    assert.ok(/WARNING/.test(r.stdout), 'a genuinely stale snapshot produced no warning');
    assert.ok(
      /\b3 commit\(s\)/.test(r.stdout),
      'the warning does not say how much work followed the snapshot — the count is what tells a ' +
        'reader whether to care, and it must exclude the snapshot commit itself'
    );
  } finally {
    rm(dir);
  }
});

test('an unknown Last-commit sha is silent — a rewritten history is not the reader\'s problem', () => {
  const { dir } = makeRepo();
  try {
    fs.writeFileSync(path.join(dir, '.ai', 'STATE.md'), '# State\nLast-commit: deadbee\n');
    const r = runHook(SESSION_START, dir, '{}');
    assert.ok(
      !/WARNING/.test(r.stdout),
      'a sha this repo has never seen produces an alarm nobody can act on'
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
  const { dir, head, git } = makeRepo();
  try {
    fs.writeFileSync(path.join(dir, '.ai', 'STATE.md'), `# State\nLast-commit: ${head}\n`);
    git('add', '.');
    git('commit', '-q', '-m', 'docs(state): snapshot');
    fs.writeFileSync(path.join(dir, 'work.txt'), 'work\n');
    git('add', '.');
    git('commit', '-q', '-m', 'work');
    const r = runHook(SESSION_START, dir, '{}');
    assert.ok(/WARNING/.test(r.stdout), 'setup is wrong — this fixture must be in the warning case');
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
    const prodRead = runHook(
      GUARD,
      dir,
      JSON.stringify({ tool_name: 'Read', tool_input: { file_path: 'apps/web/.env.production' } })
    );
    assert.strictEqual(prodRead.status, 2, 'production env is no longer protected');
  } finally {
    rm(dir);
  }
});

// ---------------------------------------------------------------- ENV-LOCK knows its owner (1.25.2)

test('ENV-LOCK: the HOLDER passes its own lock', () => {
  // The defect this closes. `qa` wrote the lock and was blocked by it on its own first `docker
  // exec` — a lock whose only state is "exists" locks out the one process it was created for.
  const { dir } = makeRepo();
  try {
    fs.writeFileSync(
      path.join(dir, '.ai', 'ENV-LOCK'),
      'holder: qa\nsince: 2026-08-01T10:00:00Z\ntoken: run-4711\n'
    );
    const r = runHook(GUARD, dir, dockerCall, { SAILES_ENV_LOCK: 'run-4711' });
    assert.strictEqual(r.status, 0, 'the holder is still locked out of its own run');
  } finally {
    rm(dir);
  }
});

test('ENV-LOCK: a DIFFERENT token is still blocked — the lock still keeps others out', () => {
  const { dir } = makeRepo();
  try {
    fs.writeFileSync(path.join(dir, '.ai', 'ENV-LOCK'), 'holder: qa\ntoken: run-4711\n');
    const r = runHook(GUARD, dir, dockerCall, { SAILES_ENV_LOCK: 'run-0000' });
    assert.strictEqual(r.status, 2, 'any token now opens the lock — it protects nothing');
  } finally {
    rm(dir);
  }
});

test('ENV-LOCK: no token in the lock blocks EVERYONE, as before — old locks keep their meaning', () => {
  // Backward compatibility is the point: a lock written by a pre-1.25.2 `qa` has no token line,
  // and it must not silently become an open door because the guard learned a new field.
  const { dir } = makeRepo();
  try {
    fs.writeFileSync(path.join(dir, '.ai', 'ENV-LOCK'), 'holder: qa\n');
    const r = runHook(GUARD, dir, dockerCall, { SAILES_ENV_LOCK: 'run-4711' });
    assert.strictEqual(r.status, 2, 'a tokenless lock opened for a caller that guessed a token');
  } finally {
    rm(dir);
  }
});

test('ENV-LOCK: the block tells the holder how to identify itself', () => {
  const { dir } = makeRepo();
  try {
    fs.writeFileSync(path.join(dir, '.ai', 'ENV-LOCK'), 'holder: qa\ntoken: run-4711\n');
    const r = runHook(GUARD, dir, dockerCall);
    assert.ok(
      /SAILES_ENV_LOCK/.test(r.stderr),
      'the escape path for the holder is not stated — it cannot tell it is being mistaken for someone else'
    );
  } finally {
    rm(dir);
  }
});

// ---------------------------------------------------------------- env tiered by risk (1.25.2)

test('the LOCAL .env is NOT blocked — this is the fixture that must NOT fire', () => {
  // The inversion. Until 1.25.1 the guard blocked the four characters `.env` anywhere in the
  // payload, which made `qa` structurally unable to boot the app for ANY task. If this test ever
  // goes red the behavioral gate is unrunnable again, and it fails silently in production.
  const { dir } = makeRepo();
  try {
    for (const [label, payload] of [
      ['reading it', { tool_name: 'Read', tool_input: { file_path: '.env' } }],
      ['reading the example', { tool_name: 'Read', tool_input: { file_path: '.env.example' } }],
      ['writing it', { tool_name: 'Write', tool_input: { file_path: '.env', content: 'PORT=3000\n' } }],
      [
        'authoring the dev script that loads it',
        {
          tool_name: 'Edit',
          tool_input: {
            file_path: 'apps/api/package.json',
            new_string: '"dev": "node --env-file-if-exists=../../.env --import tsx --watch src/index.ts"',
          },
        },
      ],
      ['a command that merely mentions it', { tool_name: 'Bash', tool_input: { command: 'pnpm dev' } }],
    ]) {
      const r = runHook(GUARD, dir, JSON.stringify(payload));
      assert.strictEqual(r.status, 0, `${label}: the local .env is blocked again — qa cannot boot`);
    }
  } finally {
    rm(dir);
  }
});

test('production and staging env stay protected — the tier is real, not a removal', () => {
  const { dir } = makeRepo();
  try {
    for (const [label, payload] of [
      ['prod read', { tool_name: 'Read', tool_input: { file_path: '.env.production' } }],
      ['prod short form', { tool_name: 'Read', tool_input: { file_path: 'apps/api/.env.prod' } }],
      ['staging read', { tool_name: 'Read', tool_input: { file_path: '.env.staging' } }],
      ['shell read', { tool_name: 'Bash', tool_input: { command: 'cat .env.production' } }],
    ]) {
      const r = runHook(GUARD, dir, JSON.stringify(payload));
      assert.strictEqual(r.status, 2, `${label} is not protected — the tier collapsed to "anything goes"`);
    }
  } finally {
    rm(dir);
  }
});

test('Object.keys survives — the guard does not substring-match key material', () => {
  // Why `*.key` / `*.pem` live in permissions.deny (glob, path-precise) and not in this script:
  // a substring test for `.key` fires on ordinary JavaScript, and a guard that cries wolf is a
  // guard that gets muted.
  const { dir } = makeRepo();
  try {
    const r = runHook(
      GUARD,
      dir,
      JSON.stringify({
        tool_name: 'Edit',
        tool_input: { file_path: 'src/util.ts', new_string: 'return Object.keys(config)' },
      })
    );
    assert.strictEqual(r.status, 0, 'ordinary code was blocked as if it were key material');
  } finally {
    rm(dir);
  }
});

// ---------------------------------------------------------------- relative path leaks the guard (F9)
//
// The most serious finding of the 2026-08-02 session, reproduced directly before the fix:
//   {"file_path":"migrations/003_deals.sql"}        → exit 0  PASSED THROUGH
//   {"file_path":"/d/repo/migrations/003_deals.sql"} → exit 2  blocked
// The old pattern — `*'/migrations/'*|*'\migrations\'*` — required a separator BEFORE the
// protected segment, so a repo-relative path (no leading `/`) had nothing to match against.
// That is the form an agent types most: it is what `git status` prints and what a brief's prose
// contains. Every protected segment in the file gets a PAIRED case below — relative and absolute,
// both must block — plus a fixture that must NOT fire: the protected word as part of a longer,
// unrelated name.

test('migrations: RELATIVE file_path is blocked — the defect this closes', () => {
  const { dir } = makeRepo();
  try {
    const r = runHook(
      GUARD,
      dir,
      JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: 'migrations/003_deals.sql' } })
    );
    assert.strictEqual(
      r.status,
      2,
      'a repo-relative migrations path passed through — this is the reproduced F9 defect'
    );
  } finally {
    rm(dir);
  }
});

test('migrations: ABSOLUTE file_path is blocked — no regression on the form that already worked', () => {
  const { dir } = makeRepo();
  try {
    const r = runHook(
      GUARD,
      dir,
      JSON.stringify({
        tool_name: 'Edit',
        tool_input: { file_path: '/d/repo/migrations/003_deals.sql' },
      })
    );
    assert.strictEqual(r.status, 2, 'the absolute form regressed while fixing the relative one');
  } finally {
    rm(dir);
  }
});

test('migrations: a relative path referenced from a Bash command is blocked too', () => {
  const { dir } = makeRepo();
  try {
    const r = runHook(
      GUARD,
      dir,
      JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'cat migrations/003_deals.sql' } })
    );
    assert.strictEqual(r.status, 2, 'a relative migrations path in a shell command passed through');
  } finally {
    rm(dir);
  }
});

test('migrations: src/migrations-guide.md is NOT blocked — the fixture that must not fire', () => {
  // The second-order trap: broadening the match to catch the start of a path is how a guard
  // starts blocking correct work. "migrations" here is part of a longer, unrelated filename —
  // there is no separator after it, so the fix must not reach it.
  const { dir } = makeRepo();
  try {
    const r = runHook(
      GUARD,
      dir,
      JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: 'src/migrations-guide.md' } })
    );
    assert.strictEqual(
      r.status,
      0,
      'a legitimate file named migrations-guide.md was blocked — the fix over-broadened'
    );
  } finally {
    rm(dir);
  }
});

test('.env.prod / .env.staging: RELATIVE form is blocked (already correct — no leading-separator requirement here)', () => {
  const { dir } = makeRepo();
  try {
    for (const relPath of ['.env.production', '.env.staging']) {
      const r = runHook(
        GUARD,
        dir,
        JSON.stringify({ tool_name: 'Read', tool_input: { file_path: relPath } })
      );
      assert.strictEqual(r.status, 2, `${relPath} (relative) is not blocked`);
    }
  } finally {
    rm(dir);
  }
});

test('.env.prod / .env.staging: ABSOLUTE form is blocked', () => {
  const { dir } = makeRepo();
  try {
    for (const absPath of ['/d/repo/.env.production', '/d/repo/apps/api/.env.staging']) {
      const r = runHook(
        GUARD,
        dir,
        JSON.stringify({ tool_name: 'Read', tool_input: { file_path: absPath } })
      );
      assert.strictEqual(r.status, 2, `${absPath} (absolute) is not blocked`);
    }
  } finally {
    rm(dir);
  }
});

test('.env.prod / .env.staging: docs/env.production-notes.md is NOT blocked — the fixture that must not fire', () => {
  const { dir } = makeRepo();
  try {
    const r = runHook(
      GUARD,
      dir,
      JSON.stringify({
        tool_name: 'Edit',
        tool_input: { file_path: 'docs/env.production-notes.md' },
      })
    );
    assert.strictEqual(
      r.status,
      0,
      'a legitimate docs file about env.production was blocked — the tier collapsed to a substring guess'
    );
  } finally {
    rm(dir);
  }
});

test('.ai/specs/implemented/: RELATIVE form is blocked', () => {
  const { dir } = makeRepo();
  try {
    const r = runHook(
      GUARD,
      dir,
      JSON.stringify({
        tool_name: 'Edit',
        tool_input: { file_path: '.ai/specs/implemented/2026-07-01-old-spec.md' },
      })
    );
    assert.strictEqual(r.status, 2, 'a relative implemented-spec path is not blocked');
  } finally {
    rm(dir);
  }
});

test('.ai/specs/implemented/: ABSOLUTE form is blocked', () => {
  const { dir } = makeRepo();
  try {
    const r = runHook(
      GUARD,
      dir,
      JSON.stringify({
        tool_name: 'Edit',
        tool_input: { file_path: '/d/repo/.ai/specs/implemented/2026-07-01-old-spec.md' },
      })
    );
    assert.strictEqual(r.status, 2, 'an absolute implemented-spec path is not blocked');
  } finally {
    rm(dir);
  }
});

// ---------------------------------------------------------------- .env production markers (1.25.2)

test('session-start WARNS when the local .env carries production markers', () => {
  const { dir } = makeRepo();
  try {
    fs.writeFileSync(
      path.join(dir, '.env'),
      'DATABASE_URL=postgres://u:p@shinkansen.proxy.rlwy.railway.app:5432/db\nPORT=3000\n'
    );
    const r = runHook(SESSION_START, dir, '{}');
    assert.ok(/PRODUCTION markers/.test(r.stdout), 'a prod credential in the local .env went unreported');
    assert.ok(/DATABASE_URL/.test(r.stdout), 'the offending key is not named — nobody knows what to move');
    assert.ok(!/shinkansen/.test(r.stdout), 'the VALUE was printed: the warning leaked the secret it warns about');
    assert.strictEqual(r.status, 0, 'the env warning must never block a session');
  } finally {
    rm(dir);
  }
});

test('a clean local .env is SILENT — the fixture that must not fire', () => {
  const { dir } = makeRepo();
  try {
    fs.writeFileSync(
      path.join(dir, '.env'),
      'DATABASE_URL=postgres://postgres:postgres@localhost:5432/app\nS3_ENDPOINT=http://localhost:9000\n'
    );
    const r = runHook(SESSION_START, dir, '{}');
    assert.ok(
      !/PRODUCTION markers/.test(r.stdout),
      'an ordinary local .env triggers the alarm — this is the cries-wolf shape that gets hooks muted'
    );
  } finally {
    rm(dir);
  }
});

test('no .env at all is SILENT', () => {
  const { dir } = makeRepo();
  try {
    const r = runHook(SESSION_START, dir, '{}');
    assert.ok(!/PRODUCTION markers/.test(r.stdout), 'warned about a file that does not exist');
  } finally {
    rm(dir);
  }
});

console.log(
  failures === 0 ? '\nhooks-template: all tests passed' : `\nhooks-template: ${failures} failing`
);
process.exit(failures === 0 ? 0 : 1);

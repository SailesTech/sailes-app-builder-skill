#!/usr/bin/env node
'use strict';

/**
 * Executable tests for `toolchain-guard.js` — spec 1.36.0, P4 (A3). Deterministic (reads a
 * payload, checks a path against a fixed list, checks disk for repo scope), so it gets a real
 * test, not an eval.
 *
 * No test framework on purpose: the repo has no runner and this needs none.
 * Run: node hooks/toolchain-guard.test.js
 */

const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOOK = path.join(__dirname, 'toolchain-guard.js');

let failures = 0;

function test(name, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-toolchain-guard-'));
  try {
    fn(dir);
    console.log(`  ok   ${name}`);
  } catch (err) {
    failures++;
    console.log(`  FAIL ${name}\n       ${err.message}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** Makes `dir` a repo root findRepoRoot stops at, optionally a Sailes repo (AGENTS.md or .ai/). */
function mkrepo(dir, { sailes = true } = {}) {
  fs.mkdirSync(path.join(dir, '.git'), { recursive: true });
  if (sailes) fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# AGENTS\n');
}

/** Runs the hook the way Claude Code does: JSON on stdin. Never throws on a non-zero exit —
 *  blocking (exit 2) is a real outcome this suite has to assert on, not a test-runner error. */
function run(payload, env) {
  const res = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return { status: res.status, stdout: res.stdout, stderr: res.stderr };
}

function edit(cwd, filePath) {
  return { tool_name: 'Edit', cwd, tool_input: { file_path: filePath } };
}

console.log('toolchain-guard.js');

// --- protected configs, in a Sailes repo — blocked -----------------------------------------------

const PROTECTED_FIXTURES = [
  '.eslintrc.json',
  'eslint.config.js',
  '.prettierrc',
  'biome.json',
  'tsconfig.json',
  'ruff.toml',
];

for (const name of PROTECTED_FIXTURES) {
  test(`${name} in a Sailes repo — blocked`, (dir) => {
    mkrepo(dir);
    const target = path.join(dir, name);
    const res = run(edit(dir, target));
    assert.strictEqual(res.status, 2, `stderr: ${res.stderr}`);
    assert.match(res.stderr, /KEY DECISION/);
    assert.match(res.stderr, new RegExp(name.replace(/\./g, '\\.')));
  });
}

// --- same writes, outside a Sailes repo — silent exit 0 -------------------------------------------

for (const name of PROTECTED_FIXTURES) {
  test(`${name} outside a Sailes repo — exit 0, silent`, (dir) => {
    mkrepo(dir, { sailes: false });
    const target = path.join(dir, name);
    const res = run(edit(dir, target));
    assert.strictEqual(res.status, 0);
    assert.strictEqual(res.stderr, '');
  });
}

// --- same writes, with the unblock env var — exit 0 ------------------------------------------------

for (const name of PROTECTED_FIXTURES) {
  test(`${name} in a Sailes repo with SAILES_TOOLCHAIN_GUARD=off — exit 0`, (dir) => {
    mkrepo(dir);
    const target = path.join(dir, name);
    const res = run(edit(dir, target), { SAILES_TOOLCHAIN_GUARD: 'off' });
    assert.strictEqual(res.status, 0);
    assert.strictEqual(res.stderr, '');
  });
}

// --- non-protected paths, non-watched tools, unparsable — exit 0 ----------------------------------

test('src/index.ts in a Sailes repo — exit 0 (not a toolchain config)', (dir) => {
  mkrepo(dir);
  const target = path.join(dir, 'src', 'index.ts');
  const res = run(edit(dir, target));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

test('package.json in a Sailes repo — exit 0 (not on the protected list)', (dir) => {
  mkrepo(dir);
  const target = path.join(dir, 'package.json');
  const res = run(edit(dir, target));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

test('tool other than Edit|Write|MultiEdit — exit 0, silent', (dir) => {
  mkrepo(dir);
  const res = run({ tool_name: 'Bash', cwd: dir, tool_input: { command: 'rm .eslintrc.json' } });
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

test('unparsable stdin — exit 0, never crashes', (dir) => {
  const res = spawnSync(process.execPath, [HOOK], { input: 'not json', encoding: 'utf8' });
  assert.strictEqual(res.status, 0);
});

test('missing tool_input.file_path — exit 0', (dir) => {
  const res = run({ tool_name: 'Write', cwd: dir, tool_input: {} });
  assert.strictEqual(res.status, 0);
});

// --- Write and MultiEdit are watched too, not just Edit --------------------------------------------

test('Write to .eslintrc.json in a Sailes repo — blocked', (dir) => {
  mkrepo(dir);
  const target = path.join(dir, '.eslintrc.json');
  const res = run({ tool_name: 'Write', cwd: dir, tool_input: { file_path: target } });
  assert.strictEqual(res.status, 2);
});

test('MultiEdit to tsconfig.json in a Sailes repo — blocked', (dir) => {
  mkrepo(dir);
  const target = path.join(dir, 'tsconfig.json');
  const res = run({ tool_name: 'MultiEdit', cwd: dir, tool_input: { file_path: target, edits: [] } });
  assert.strictEqual(res.status, 2);
});

// --- never sets permissionDecision on stdout (would bypass the user prompt) ------------------------

test('a block never carries anything on stdout', (dir) => {
  mkrepo(dir);
  const target = path.join(dir, '.eslintrc.json');
  const res = run(edit(dir, target));
  assert.strictEqual(res.status, 2);
  assert.strictEqual(res.stdout, '');
});

console.log('');
if (failures) {
  console.log(`${failures} failing`);
  process.exit(1);
} else {
  console.log('all passing');
  process.exit(0);
}

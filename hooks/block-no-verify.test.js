#!/usr/bin/env node
'use strict';

/**
 * Executable tests for `block-no-verify.js` — spec 1.36.0, P3 (A2). Deterministic (reads a
 * payload, scans a command string, exits 0 or 2), so it gets a real test, not an eval.
 *
 * No test framework on purpose: the repo has no runner and this needs none.
 * Run: node hooks/block-no-verify.test.js
 */

const assert = require('assert');
const { spawnSync } = require('child_process');
const path = require('path');

const HOOK = path.join(__dirname, 'block-no-verify.js');

let failures = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    failures++;
    console.log(`  FAIL ${name}\n       ${err.message}`);
  }
}

/** Runs the hook the way Claude Code does: JSON on stdin. Never throws on a non-zero exit —
 *  blocking (exit 2) is a real outcome this suite has to assert on, not a test-runner error. */
function run(payload) {
  const res = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
  });
  return { status: res.status, stdout: res.stdout, stderr: res.stderr };
}

function bash(command) {
  return { tool_name: 'Bash', tool_input: { command } };
}

console.log('block-no-verify.js');

// --- commit --no-verify, in both flag orders ------------------------------------------------

test('git commit -m x --no-verify — blocked', () => {
  const res = run(bash('git commit -m x --no-verify'));
  assert.strictEqual(res.status, 2);
  assert.match(res.stderr, /no-verify/);
});

test('git commit --no-verify -m x — blocked', () => {
  const res = run(bash('git commit --no-verify -m x'));
  assert.strictEqual(res.status, 2);
});

test('git commit -n -m x — blocked (-n in commit-flag position)', () => {
  const res = run(bash('git commit -n -m x'));
  assert.strictEqual(res.status, 2);
});

// --- push --no-verify -------------------------------------------------------------------------

test('git push --no-verify — blocked', () => {
  const res = run(bash('git push --no-verify'));
  assert.strictEqual(res.status, 2);
  assert.match(res.stderr, /no-verify/);
});

// --- core.hooksPath, both forms -----------------------------------------------------------------

test('git -c core.hooksPath=/dev/null commit -m x — blocked', () => {
  const res = run(bash('git -c core.hooksPath=/dev/null commit -m x'));
  assert.strictEqual(res.status, 2);
  assert.match(res.stderr, /hooksPath/i);
});

test('git config core.hooksPath .h — blocked', () => {
  const res = run(bash('git config core.hooksPath .h'));
  assert.strictEqual(res.status, 2);
  assert.match(res.stderr, /hooksPath/i);
});

// --- clean git invocations — exit 0 -------------------------------------------------------------

test('git commit -m x — allowed', () => {
  const res = run(bash('git commit -m x'));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

test('git push — allowed', () => {
  const res = run(bash('git push'));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

// --- non-git / non-Bash / unparsable — exit 0, silent -------------------------------------------

test('echo "--no-verify" — allowed (literal, outside git)', () => {
  const res = run(bash('echo "--no-verify"'));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

test('tool other than Bash — exit 0, silent', () => {
  const res = run({ tool_name: 'Read', tool_input: { file_path: '/tmp/x' } });
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

test('unparsable stdin — exit 0, never crashes', () => {
  const res = spawnSync(process.execPath, [HOOK], { input: 'not json', encoding: 'utf8' });
  assert.strictEqual(res.status, 0);
});

test('missing tool_input.command — exit 0', () => {
  const res = run({ tool_name: 'Bash', tool_input: {} });
  assert.strictEqual(res.status, 0);
});

// --- quoting must not produce false positives ----------------------------------------------------

test('git commit -m "restore --no-verify text" — allowed (value of -m, not a flag)', () => {
  const res = run(bash('git commit -m "restore --no-verify text"'));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

test('a chained command with an unrelated git commit stays clean', () => {
  const res = run(bash('echo hi && git commit -m x && echo done'));
  assert.strictEqual(res.status, 0);
});

test('--no-verify inside a chained command after && is still caught', () => {
  const res = run(bash('echo hi && git commit -m x --no-verify'));
  assert.strictEqual(res.status, 2);
});

// --- never sets permissionDecision on stdout (would bypass the user prompt) ----------------------

test('a block never carries permissionDecision on stdout', () => {
  const res = run(bash('git push --no-verify'));
  assert.strictEqual(res.status, 2);
  assert.strictEqual(res.stdout, '');
});

// --- tester-added edge cases (test plan .ai/test-plans/2026-09-20-harness-guards.md) ------------

test('P3-EDGE-1: git config --global core.hooksPath ... — blocked (scope flag before the key)', () => {
  const res = run(bash('git config --global core.hooksPath /some/path'));
  assert.strictEqual(res.status, 2);
  assert.match(res.stderr, /hooksPath/i);
});

test('P3-EDGE-2: echo hi | git commit -m x --no-verify — blocked (git mid-pipe, not at start)', () => {
  const res = run(bash('echo hi | git commit -m x --no-verify'));
  assert.strictEqual(res.status, 2);
  assert.match(res.stderr, /no-verify/);
});

test('P3-EDGE-3: git push -n origin main — allowed (push -n is dry-run, not commit -n/no-verify)', () => {
  const res = run(bash('git push -n origin main'));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

console.log('');
if (failures) {
  console.log(`${failures} failing`);
  process.exit(1);
} else {
  console.log('all passing');
  process.exit(0);
}

#!/usr/bin/env node
'use strict';

/**
 * Executable tests for the SessionStart routing mandate.
 *
 * The hook is deterministic — it reads the filesystem and prints text — so it gets a real
 * test, not an eval. The behavioral half (does the model *honor* the mandate?) is not
 * script-testable and lives in `evals/session-start-routes-from-repo-state.md`.
 *
 * No test framework on purpose: the repo has no runner and this needs none.
 * Run: node hooks/workflow-router.test.js
 */

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOOK = path.join(__dirname, 'workflow-router.js');

let failures = 0;

function test(name, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-router-'));
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

/** Run the hook the way Claude Code does: JSON on stdin, JSON or nothing on stdout. */
function run(cwd, rawInput) {
  const out = execFileSync(process.execPath, [HOOK], {
    input: rawInput === undefined ? JSON.stringify({ cwd }) : rawInput,
    encoding: 'utf8',
  });
  if (!out.trim()) return null;
  return JSON.parse(out).hookSpecificOutput.additionalContext;
}

function mkrepo(dir, { agentsMd = false, aiDir = false, specs = [], implemented = [] } = {}) {
  fs.mkdirSync(path.join(dir, '.git'), { recursive: true }); // makes findRepoRoot stop here
  if (agentsMd) fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# AGENTS\n');
  if (aiDir || specs.length || implemented.length) {
    fs.mkdirSync(path.join(dir, '.ai', 'specs'), { recursive: true });
  }
  for (const s of specs) fs.writeFileSync(path.join(dir, '.ai', 'specs', s), '# spec\n');
  if (implemented.length) {
    fs.mkdirSync(path.join(dir, '.ai', 'specs', 'implemented'), { recursive: true });
    for (const s of implemented) {
      fs.writeFileSync(path.join(dir, '.ai', 'specs', 'implemented', s), '# spec\n');
    }
  }
}

console.log('workflow-router.js');

// The plugin is enabled globally. Silence in unrelated checkouts is the whole reason
// it is tolerable to install at all.
test('stays silent in a repo that never adopted the workflow', (dir) => {
  mkrepo(dir);
  assert.strictEqual(run(dir), null);
});

test('fires on AGENTS.md alone', (dir) => {
  mkrepo(dir, { agentsMd: true });
  assert.match(run(dir) || '', /\[sailes\]/);
});

test('fires on .ai/ alone (methodology present, unstamped repo)', (dir) => {
  mkrepo(dir, { aiDir: true });
  assert.match(run(dir) || '', /\[sailes\]/);
});

// The core claim: the route comes from disk, not from the model's read of the request.
test('routes to the implementation phase when a spec is in flight', (dir) => {
  mkrepo(dir, { agentsMd: true, specs: ['unit-pricing.md'] });
  const ctx = run(dir);
  assert.match(ctx, /unit-pricing\.md/);
  assert.match(ctx, /sailes-implement/);
  assert.doesNotMatch(ctx, /no active spec/);
});

test('routes to sailes-start when nothing is in flight', (dir) => {
  mkrepo(dir, { agentsMd: true, aiDir: true });
  const ctx = run(dir);
  assert.match(ctx, /no active spec/);
  assert.match(ctx, /sailes-start/);
});

// A finished spec is not work in progress (README invariant 6: root → implemented/ → archived/).
test('ignores implemented/ specs when deciding what is in flight', (dir) => {
  mkrepo(dir, { agentsMd: true, implemented: ['old-feature.md'] });
  const ctx = run(dir);
  assert.match(ctx, /no active spec/);
  assert.doesNotMatch(ctx, /old-feature\.md/);
});

test('does not mistake .ai/specs/README.md for a spec', (dir) => {
  mkrepo(dir, { agentsMd: true, specs: ['README.md'] });
  assert.match(run(dir), /no active spec/);
});

// Context is charged on every session start; a repo with 30 specs must not dump all 30.
test('caps the spec list and says how many it dropped', (dir) => {
  const specs = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((n) => `${n}.md`);
  mkrepo(dir, { agentsMd: true, specs });
  const ctx = run(dir);
  assert.match(ctx, /\+2 more/);
  assert.match(ctx, /`e\.md`/); // the 5th is listed...
  assert.doesNotMatch(ctx, /`f\.md`/); // ...the 6th and 7th are not
  assert.doesNotMatch(ctx, /`g\.md`/);
});

// Sessions routinely open in a subdir; the stamp and .ai/ live at the root.
test('walks up from a subdirectory to the repo root', (dir) => {
  mkrepo(dir, { agentsMd: true, specs: ['deep.md'] });
  const sub = path.join(dir, 'apps', 'web', 'src');
  fs.mkdirSync(sub, { recursive: true });
  assert.match(run(sub), /deep\.md/);
});

// A hint is never worth breaking a session over.
test('survives malformed stdin instead of crashing the session', (dir) => {
  mkrepo(dir, { agentsMd: true });
  assert.doesNotThrow(() => run(dir, 'not json at all'));
});

test('always carries the hard rules', (dir) => {
  mkrepo(dir, { agentsMd: true });
  const ctx = run(dir);
  assert.match(ctx, /No feature code before an approved spec/);
  assert.match(ctx, /owns every key decision/);
  assert.match(ctx, /verified, not asserted/);
});

if (failures) {
  console.log(`\n${failures} failing`);
  process.exit(1);
}
console.log('\nall passing');

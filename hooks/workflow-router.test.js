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

// Every one of these was found sitting in a real `.ai/specs/` during the 1.6.0 rollout
// (konsyliumAI shipped TEMPLATE.md; the SRF repo a per-directory AGENTS.md). A template is
// not work in flight, and announcing it as such teaches the agent to distrust the routing.
test('does not mistake scaffolding files in .ai/specs/ for specs', (dir) => {
  mkrepo(dir, { agentsMd: true, specs: ['README.md', 'TEMPLATE.md', 'AGENTS.md', 'CLAUDE.md'] });
  const ctx = run(dir);
  // "no active spec" is itself the proof that all four were filtered out — the mandate
  // legitimately mentions `AGENTS.md` in its closing line, so it cannot be grepped for here.
  assert.match(ctx, /no active spec/);
  assert.doesNotMatch(ctx, /TEMPLATE|CLAUDE/);
});

test('still counts a real spec sitting next to scaffolding files', (dir) => {
  mkrepo(dir, { agentsMd: true, specs: ['TEMPLATE.md', '2026-07-18-real-work.md'] });
  const ctx = run(dir);
  assert.match(ctx, /2026-07-18-real-work\.md/);
  assert.doesNotMatch(ctx, /TEMPLATE/);
});

// The SRF repo had 27. That is drift — implemented specs never `git mv`'d to implemented/ —
// and the hook should name it, because the agent cannot tell a busy repo from a stale one.
test('flags a suspiciously large in-flight set as probable drift', (dir) => {
  const specs = Array.from({ length: 27 }, (_, i) => `2026-07-${String(i + 1).padStart(2, '0')}-x.md`);
  mkrepo(dir, { agentsMd: true, specs });
  const ctx = run(dir);
  assert.match(ctx, /27/);
  assert.match(ctx, /implemented\//);
});

test('does not cry drift for a normal handful of specs', (dir) => {
  mkrepo(dir, { agentsMd: true, specs: ['a.md', 'b.md', 'c.md'] });
  assert.doesNotMatch(run(dir), /implemented\//);
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

// A ReferenceError in this file once made the entire mandate disappear while the session looked
// normal — the silent-instrument trap, in the tool that preaches against it. On failure the hook
// must still govern the session, and must say that it failed.
test('degrades to a minimum mandate instead of going silent on an internal error', (dir) => {
  mkrepo(dir, { agentsMd: true });
  const broken = path.join(dir, 'broken-router.js');
  fs.writeFileSync(
    broken,
    fs
      .readFileSync(HOOK, 'utf8')
      .replace('function main() {', 'function main() {\n  throw new Error("induced");')
  );
  const out = execFileSync(process.execPath, [broken], {
    input: JSON.stringify({ cwd: dir }),
    encoding: 'utf8',
  });
  const ctx = JSON.parse(out).hookSpecificOutput.additionalContext;
  assert.match(ctx, /sailes-diagnose/);
  assert.match(ctx, /router failure|failed to read/);
});

test('stays silent on an internal error in a repo that is not ours', (dir) => {
  mkrepo(dir); // no AGENTS.md, no .ai/
  const broken = path.join(dir, 'broken-router.js');
  fs.writeFileSync(
    broken,
    fs
      .readFileSync(HOOK, 'utf8')
      .replace('function main() {', 'function main() {\n  throw new Error("induced");')
  );
  const out = execFileSync(process.execPath, [broken], {
    input: JSON.stringify({ cwd: dir }),
    encoding: 'utf8',
  });
  assert.strictEqual(out.trim(), '');
});

// The build pipeline cannot diagnose: there is nothing to elicit and the requirement is already
// written. Without this line the mandate routes a broken-production session into discovery.
test('names the diagnostic track, whatever the spec state', (dir) => {
  mkrepo(dir, { agentsMd: true });
  assert.match(run(dir), /sailes-diagnose/);
});

test('names the diagnostic track when specs are in flight too', (dir) => {
  mkrepo(dir, { agentsMd: true, specs: ['a.md'] });
  assert.match(run(dir), /sailes-diagnose/);
});

// An open incident is the single most relevant fact at session start — more than any spec.
test('surfaces an open incident record when one exists', (dir) => {
  mkrepo(dir, { agentsMd: true });
  fs.mkdirSync(path.join(dir, '.ai', 'incidents'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.ai', 'incidents', '2026-07-18-vat-204.md'),
    '# Incident\n\nStatus: INVESTIGATING\n'
  );
  const ctx = run(dir);
  assert.match(ctx, /2026-07-18-vat-204\.md/);
  assert.match(ctx, /INVESTIGATING/);
});

test('stays quiet about incidents that are closed', (dir) => {
  mkrepo(dir, { agentsMd: true });
  fs.mkdirSync(path.join(dir, '.ai', 'incidents'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.ai', 'incidents', '2026-07-01-old.md'),
    '# Incident\n\nStatus: FIXED & VERIFIED\n'
  );
  assert.doesNotMatch(run(dir), /2026-07-01-old\.md/);
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

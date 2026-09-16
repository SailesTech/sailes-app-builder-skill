#!/usr/bin/env node
'use strict';

/**
 * Executable tests for the (not-yet-wired) `Workflow` agentType guard — P5a of spec
 * 1.35.0-workflow-first-orchestration. The hook is deterministic (reads a payload, scans text,
 * exits 0 or 2), so it gets a real test, not an eval.
 *
 * No test framework on purpose: the repo has no runner and this needs none.
 * Run: node hooks/workflow-agenttype-guard.test.js
 */

const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOOK = path.join(__dirname, 'workflow-agenttype-guard.js');

let failures = 0;

function test(name, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-agenttype-guard-'));
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

/** Runs the hook the way Claude Code does: JSON on stdin. Never throws on a non-zero exit —
 *  blocking (exit 2) is a real outcome this suite has to assert on, not a test-runner error. */
function run(payload) {
  const res = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
  });
  return { status: res.status, stdout: res.stdout, stderr: res.stderr };
}

function workflowCall(script, extra = {}) {
  return { tool_name: 'Workflow', tool_input: { script, ...extra } };
}

console.log('workflow-agenttype-guard.js');

test('other tool — exit 0, silent', (dir) => {
  const res = run({ tool_name: 'Bash', tool_input: { command: 'echo hi' } });
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

test('malformed stdin — exit 0, never crashes', () => {
  const res = spawnSync(process.execPath, [HOOK], { input: 'not json', encoding: 'utf8' });
  assert.strictEqual(res.status, 0);
});

// --- P5a.1: agent( calls without agentType, including no second argument at all -----------

test('agent() with no second argument at all — blocked', () => {
  const res = run(workflowCall("agent('build the widget');\n"));
  assert.strictEqual(res.status, 2);
  assert.match(res.stderr, /line 1/);
  assert.match(res.stderr, /agentType/);
});

test('agent(p, opts) with an options object missing agentType — blocked', () => {
  const res = run(workflowCall("agent('build', { model: 'sonnet' });\n"));
  assert.strictEqual(res.status, 2);
  assert.match(res.stderr, /agentType/);
});

test('agent(p, opts) with agentType present in the options object — not blocked', () => {
  const res = run(workflowCall("agent('build', { agentType: 'be-dev', model: 'sonnet' });\n"));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

test('multiple calls — reports the violating line, not the clean one', () => {
  const script = [
    "agent('ok one', { agentType: 'be-dev' });",
    "agent('bad one', { model: 'sonnet' });",
  ].join('\n');
  const res = run(workflowCall(script));
  assert.strictEqual(res.status, 2);
  assert.match(res.stderr, /line 2/);
  assert.doesNotMatch(res.stderr, /line 1:/);
});

test('scriptPath is read from disk and analyzed the same way as inline script', (dir) => {
  fs.writeFileSync(path.join(dir, 'wf.js'), "agent('build');\n");
  const res = run({ tool_name: 'Workflow', tool_input: { scriptPath: 'wf.js' }, cwd: dir });
  assert.strictEqual(res.status, 2);
  assert.match(res.stderr, /agentType/);
});

test('unreadable scriptPath — exit 0 with a note, never blocks on a read failure', (dir) => {
  const res = run({
    tool_name: 'Workflow',
    tool_input: { scriptPath: 'does-not-exist.js' },
    cwd: dir,
  });
  assert.strictEqual(res.status, 0);
  assert.match(res.stderr, /could not read scriptPath/);
});

// Audit gap 3: a saved workflow invoked by `name` carries no script content in the payload —
// the hook must not guess the registry path, and must not block blind.
test('saved workflow invoked by name (no script/scriptPath) — exit 0 with a note', () => {
  const res = run({ tool_name: 'Workflow', tool_input: { name: 'wf_3227fe3d-ad3' } });
  assert.strictEqual(res.status, 0);
  assert.match(res.stderr, /no.*script.*scriptPath|does not guess the registry path/);
});

// --- P5a.2: string / comment occurrences do not block; opts-in-a-variable is undecidable ---

test('agent( inside a string literal is not a call — not blocked', () => {
  const res = run(workflowCall("const msg = \"remember to call agent(x) later\";\n"));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

test('agent( inside a line comment is not a call — not blocked', () => {
  const res = run(workflowCall("// agent(x) — discouraged, see docs\n" + "doSomethingElse();\n"));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

test('agent( inside a block comment is not a call — not blocked', () => {
  const res = run(workflowCall("/* legacy: agent(x) removed */\n" + "doSomethingElse();\n"));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

test('agent(p, opts) where opts is a variable — undecidable, not blocked, reported', () => {
  const script = [
    "const opts = { agentType: 'be-dev' };",
    "agent('build', opts);",
  ].join('\n');
  const res = run(workflowCall(script));
  assert.strictEqual(res.status, 0);
  assert.match(res.stderr, /undecidable|cannot decide/);
  assert.match(res.stderr, /line 2/);
});

test('agent(p, { ...spread }) — undecidable (agentType may be inside the spread), not blocked', () => {
  const res = run(workflowCall("agent('build', { ...baseOpts, model: 'sonnet' });\n"));
  assert.strictEqual(res.status, 0);
  assert.match(res.stderr, /undecidable|cannot decide/);
});

test('a bare identifier that merely contains "agent" is not mistaken for a call', () => {
  const res = run(workflowCall("subagent('x');\nmyagentThing();\n"));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

// --- Tester additions: frozen behavior IDs from .ai/test-plans/2026-09-16-workflow-first-P5a.md
// One test per ID. Derived from the spec ("### P5a —" / "### Narzędzia") with the implementation
// unread; only now mapped onto the payload shape the implementation actually parses
// (`tool_name` / `tool_input.{script,scriptPath,name}` / `cwd`). Do not weaken or delete these. ---

test('P5a-B1: agent() with no second argument at all — exit 2, line + rule named', () => {
  const res = run(workflowCall("agent('build the widget');\n"));
  assert.strictEqual(res.status, 2);
  assert.match(res.stderr, /line 1/);
  assert.match(res.stderr, /agentType/);
});

test('P5a-B2: agent(p, {...}) options object literal missing agentType key — exit 2, line + rule named', () => {
  const res = run(workflowCall("agent('build', { model: 'sonnet' });\n"));
  assert.strictEqual(res.status, 2);
  assert.match(res.stderr, /line 1/);
  assert.match(res.stderr, /agentType/);
});

test('P5a-B3: agent(p, { agentType, ... }) valid — baseline negative, exit 0, no stderr', () => {
  const res = run(workflowCall("agent('build', { agentType: 'be-dev', model: 'sonnet' });\n"));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

test('P5a-B4: scriptPath file with a call missing agentType — exit 2, same detection as inline', (dir) => {
  fs.writeFileSync(path.join(dir, 'wf.js'), "agent('build', { model: 'sonnet' });\n");
  const res = run({ tool_name: 'Workflow', tool_input: { scriptPath: 'wf.js' }, cwd: dir });
  assert.strictEqual(res.status, 2);
  assert.match(res.stderr, /agentType/);
});

test('P5a-B5: scriptPath file fully valid — exit 0, no stderr (file-path parity negative)', (dir) => {
  fs.writeFileSync(path.join(dir, 'wf.js'), "agent('build', { agentType: 'be-dev' });\n");
  const res = run({ tool_name: 'Workflow', tool_input: { scriptPath: 'wf.js' }, cwd: dir });
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

test('P5a-B6: saved workflow invoked by name (no script/scriptPath) — exit 0 with a stderr note', () => {
  const res = run({ tool_name: 'Workflow', tool_input: { name: 'wf_3227fe3d-ad3' } });
  assert.strictEqual(res.status, 0);
  assert.match(res.stderr, /not resolvable|does not guess the registry path/);
});

// P5a-B7 — generic "no script" case, WITHOUT a `name` field either (distinct from P5a-B6). The
// spec's Narzędzia/P5a.1 text gives this its own clause — "brak skryptu / inne narzędzie -> exit 0
// cicho" (quiet) — separate from the `name`-carrying case, which gets a note. Frozen assertion:
// do not weaken to accept a note here just because the implementation currently always notes.
test('P5a-B7: no script/scriptPath/name at all — exit 0, SILENT (distinct from the named case)', () => {
  const res = run({ tool_name: 'Workflow', tool_input: {} });
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

test('P5a-B8: non-Workflow tool — exit 0, silent regardless of content', () => {
  const res = run({ tool_name: 'Bash', tool_input: { command: "agent('x')" } });
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

test('P5a-B9: agent( occurring only inside a string literal — not a call, exit 0, silent', () => {
  const res = run(workflowCall("const msg = \"remember to call agent(x) later\";\n"));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

test('P5a-B10: agent( occurring only inside a comment — not a call, exit 0, silent', () => {
  const res = run(workflowCall("// agent(x) — discouraged, see docs\n" + "doSomethingElse();\n"));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

test('P5a-B11: agent(p, opts) with opts as a variable — statically undecidable, not blocked, reported', () => {
  const script = [
    "const opts = { agentType: 'be-dev' };",
    "agent('build', opts);",
  ].join('\n');
  const res = run(workflowCall(script));
  assert.strictEqual(res.status, 0);
  assert.match(res.stderr, /undecidable|cannot decide/);
  assert.match(res.stderr, /line 2/);
});

test('P5a-B12: two calls, only one missing agentType — exit 2, reports the offending line only', () => {
  const script = [
    "agent('ok one', { agentType: 'be-dev' });",
    "agent('bad one', { model: 'sonnet' });",
  ].join('\n');
  const res = run(workflowCall(script));
  assert.strictEqual(res.status, 2);
  assert.match(res.stderr, /line 2/);
  assert.doesNotMatch(res.stderr, /line 1:/);
});

// --- Tester addition, step 4: edge case found only on reading the implementation (resolveScript's
// fs.readFileSync failure branch) — not in the frozen partition list, added per sailes-test step 4
// ("only ADD edge cases"). Not an ID; not graded as a partition, but detection-proofed the same way. ---
test('P5a-EDGE1: scriptPath naming a file that does not exist — exit 0 with a read-failure note, never blocks', (dir) => {
  const res = run({ tool_name: 'Workflow', tool_input: { scriptPath: 'does-not-exist.js' }, cwd: dir });
  assert.strictEqual(res.status, 0);
  assert.match(res.stderr, /could not read scriptPath/);
});

if (failures) {
  console.log(`\n${failures} failing`);
  process.exit(1);
}
console.log('\nall passing');

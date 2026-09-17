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

// Q2′ (2026-09-17, .ai/specs/implemented/2026-09-16-workflow-first-orchestration.md, decision row Q2′):
// agentType absent but model present is no longer a block — it is a deliberate model override
// (P5b.2 measured 5 of 6 real blocked scripts already carried an explicit model), so the hook
// allows the call and surfaces a role suggestion via stdout additionalContext instead.
test('Q2′: agent(p, opts) with model but no agentType — allowed, suggestion on stdout, no permissionDecision', () => {
  const res = run(workflowCall("agent('build', { model: 'sonnet' });\n"));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
  const out = JSON.parse(res.stdout);
  assert.strictEqual(out.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.match(out.hookSpecificOutput.additionalContext, /agentType/);
  assert.match(out.hookSpecificOutput.additionalContext, /line 1/);
  assert.strictEqual(out.hookSpecificOutput.permissionDecision, undefined);
  assert.ok(!('permissionDecision' in out.hookSpecificOutput));
});

test('agent(p, opts) with agentType present in the options object — not blocked', () => {
  const res = run(workflowCall("agent('build', { agentType: 'be-dev', model: 'sonnet' });\n"));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

// Q2′: the second call has model but no agentType — class 1 (suggest), not a block, since
// neither line here is class 2 (both have agentType or model).
test('multiple calls — clean line silent, model-only line suggested (Q2′), no block', () => {
  const script = [
    "agent('ok one', { agentType: 'be-dev' });",
    "agent('bad one', { model: 'sonnet' });",
  ].join('\n');
  const res = run(workflowCall(script));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
  const out = JSON.parse(res.stdout);
  assert.match(out.hookSpecificOutput.additionalContext, /line 2/);
  assert.doesNotMatch(out.hookSpecificOutput.additionalContext, /line 1:/);
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

// Q2′ (2026-09-17): re-scoped from "options object literal missing agentType key — exit 2" to
// "missing agentType but model present — allowed with a suggestion". The frozen ID still covers
// the same source line; only the verdict changed, by deliberate human decision (Q2′), not a
// weakening of the check.
test('P5a-B2 (Q2′): agentType missing but model present — exit 0, suggestion on stdout, line named', () => {
  const res = run(workflowCall("agent('build', { model: 'sonnet' });\n"));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
  const out = JSON.parse(res.stdout);
  assert.match(out.hookSpecificOutput.additionalContext, /line 1/);
  assert.match(out.hookSpecificOutput.additionalContext, /agentType/);
});

test('P5a-B3: agent(p, { agentType, ... }) valid — baseline negative, exit 0, no stderr', () => {
  const res = run(workflowCall("agent('build', { agentType: 'be-dev', model: 'sonnet' });\n"));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
});

// Q2′ (2026-09-17): re-scoped like P5a-B2 above — model present means allowed-with-suggestion,
// not blocked; scriptPath and inline script are analyzed identically either way.
test('P5a-B4 (Q2′): scriptPath file, agentType missing but model present — exit 0, suggestion, same detection as inline', (dir) => {
  fs.writeFileSync(path.join(dir, 'wf.js'), "agent('build', { model: 'sonnet' });\n");
  const res = run({ tool_name: 'Workflow', tool_input: { scriptPath: 'wf.js' }, cwd: dir });
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
  const out = JSON.parse(res.stdout);
  assert.match(out.hookSpecificOutput.additionalContext, /agentType/);
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

// Q2′ (2026-09-17): re-scoped like the "multiple calls" test above — the offending line has
// model set, so it is class 1 (suggest), and with no class-2 line anywhere the call is not blocked.
test('P5a-B12 (Q2′): two calls, the flagged one has model set — exit 0, suggestion names it only', () => {
  const script = [
    "agent('ok one', { agentType: 'be-dev' });",
    "agent('bad one', { model: 'sonnet' });",
  ].join('\n');
  const res = run(workflowCall(script));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stderr, '');
  const out = JSON.parse(res.stdout);
  assert.match(out.hookSpecificOutput.additionalContext, /line 2/);
  assert.doesNotMatch(out.hookSpecificOutput.additionalContext, /line 1:/);
});

// --- Tester addition, step 4: edge case found only on reading the implementation (resolveScript's
// fs.readFileSync failure branch) — not in the frozen partition list, added per sailes-test step 4
// ("only ADD edge cases"). Not an ID; not graded as a partition, but detection-proofed the same way. ---
test('P5a-EDGE1: scriptPath naming a file that does not exist — exit 0 with a read-failure note, never blocks', (dir) => {
  const res = run({ tool_name: 'Workflow', tool_input: { scriptPath: 'does-not-exist.js' }, cwd: dir });
  assert.strictEqual(res.status, 0);
  assert.match(res.stderr, /could not read scriptPath/);
});

// --- Tester addition, wave2 (P5b.1): the hook is only real protection once it is WIRED. Derived
// from spec "### P5b —" (P5b.1: "PreToolUse, matcher `Workflow`; suite w `npm test`") with the
// implementation unread beyond the payload shape already established for P5a above. Frozen ID
// W2-B11 — do not weaken or delete. ---

test('W2-B11: hooks.json wires a PreToolUse entry, matcher "Workflow", to an existing guard file', () => {
  const hooksJsonPath = path.join(__dirname, 'hooks.json');
  const hooksConfig = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf8'));
  const preToolUse = hooksConfig.hooks && hooksConfig.hooks.PreToolUse;
  assert.ok(Array.isArray(preToolUse), 'hooks.json has no hooks.PreToolUse array');

  const workflowEntry = preToolUse.find((e) => e.matcher === 'Workflow');
  assert.ok(workflowEntry, 'no PreToolUse entry has matcher "Workflow"');
  assert.ok(Array.isArray(workflowEntry.hooks) && workflowEntry.hooks.length > 0,
    'the "Workflow" PreToolUse entry has no hooks[] commands');

  const command = workflowEntry.hooks[0].command || '';
  assert.match(command, /workflow-agenttype-guard\.js/,
    'the "Workflow" PreToolUse command does not reference workflow-agenttype-guard.js');

  // The command is written as `node "${CLAUDE_PLUGIN_ROOT}/hooks/workflow-agenttype-guard.js"` —
  // resolve the referenced filename against this repo (relative to hooks.json's own directory,
  // since the command's path is always `hooks/<file>` under the plugin root) and confirm the file
  // actually exists on disk, not just that the string is present.
  const referenced = command.match(/(workflow-agenttype-guard\.js)/);
  assert.ok(referenced, 'could not extract the guard filename from the command string');
  const resolvedPath = path.join(__dirname, referenced[1]);
  assert.ok(fs.existsSync(resolvedPath),
    `command references "${referenced[1]}" but no such file exists at ${resolvedPath}`);
});

// --- Q2′ additions (2026-09-17, .ai/specs/implemented/2026-09-16-workflow-first-orchestration.md, decision
// row Q2′): new partitions this decision introduces — class 2 (neither agentType nor model),
// the mixed-file precedence rule, and the stdout additionalContext JSON shape. ---

test('Q2′-C1: literal options object with neither agentType nor model — exit 2, blocked (class 2)', () => {
  const res = run(workflowCall("agent('build', { maxTurns: 5 });\n"));
  assert.strictEqual(res.status, 2);
  assert.match(res.stderr, /line 1/);
  assert.match(res.stderr, /neither agentType nor model|inherits the session model/);
});

test('Q2′-C2: empty options object — exit 2, blocked (class 2)', () => {
  const res = run(workflowCall("agent('build', {});\n"));
  assert.strictEqual(res.status, 2);
  assert.match(res.stderr, /line 1/);
});

test('Q2′-C3: no options argument at all — exit 2, blocked (class 2, restated under Q2′)', () => {
  const res = run(workflowCall("agent('build the widget');\n"));
  assert.strictEqual(res.status, 2);
  assert.match(res.stderr, /line 1/);
});

test('Q2′-M1: mixed file — one class-2 line blocks the whole call; class-1 line reported as a suggestion in the same stderr, not stdout', () => {
  const script = [
    "agent('missing both', { maxTurns: 5 });", // class 2 — block
    "agent('model only', { model: 'sonnet' });", // class 1 — suggest
  ].join('\n');
  const res = run(workflowCall(script));
  assert.strictEqual(res.status, 2);
  assert.match(res.stderr, /line 1/);
  assert.match(res.stderr, /line 2/);
  assert.match(res.stderr, /agentType/);
  assert.strictEqual(res.stdout, '');
});

test('Q2′-J1: stdout JSON shape is exactly hookSpecificOutput.{hookEventName,additionalContext}, no permissionDecision key', () => {
  const res = run(workflowCall("agent('build', { model: 'sonnet' });\n"));
  assert.strictEqual(res.status, 0);
  const out = JSON.parse(res.stdout);
  assert.deepStrictEqual(Object.keys(out), ['hookSpecificOutput']);
  assert.deepStrictEqual(
    Object.keys(out.hookSpecificOutput).sort(),
    ['additionalContext', 'hookEventName']
  );
  assert.strictEqual(out.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.strictEqual(typeof out.hookSpecificOutput.additionalContext, 'string');
});

test('Q2′-J2: no suggestions and no violations — stdout stays empty (clean file prints nothing)', () => {
  const res = run(workflowCall("agent('build', { agentType: 'be-dev' });\n"));
  assert.strictEqual(res.status, 0);
  assert.strictEqual(res.stdout, '');
  assert.strictEqual(res.stderr, '');
});

test('Q2′-U1: undecidable options plus a class-1 line in the same file — both surfaced (stderr note + stdout suggestion), still exit 0', () => {
  const script = [
    "const opts = { agentType: 'be-dev' };",
    "agent('via variable', opts);",
    "agent('model only', { model: 'sonnet' });",
  ].join('\n');
  const res = run(workflowCall(script));
  assert.strictEqual(res.status, 0);
  assert.match(res.stderr, /undecidable|cannot decide/);
  const out = JSON.parse(res.stdout);
  assert.match(out.hookSpecificOutput.additionalContext, /line 3/);
});

if (failures) {
  console.log(`\n${failures} failing`);
  process.exit(1);
}
console.log('\nall passing');

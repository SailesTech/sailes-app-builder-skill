#!/usr/bin/env node
'use strict';

/**
 * Executable tests for the UserPromptSubmit anchor.
 *
 * Two classes of assertion live here and they are not equally important. The behavioral
 * ones (does it emit at the right moment?) describe the experiment. The safety ones —
 * never blocks, never writes into the repo, stays silent in foreign checkouts — describe
 * a hook that ships globally to every repo on the machine, where a regression is a
 * machine-wide regression. Those are the ones that must never be relaxed to go green.
 *
 * No test framework on purpose, matching workflow-router.test.js.
 * Run: node hooks/prompt-anchor.test.js
 */

const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOOK = path.join(__dirname, 'prompt-anchor.js');

let failures = 0;
let seq = 0;

/** Each test gets its own repo dir AND its own temp dir, so state can never leak between them. */
function test(name, fn) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-anchor-t-'));
  const repo = path.join(base, 'repo');
  const state = path.join(base, 'state');
  fs.mkdirSync(repo);
  fs.mkdirSync(state);
  try {
    fn({ repo, state, session: `s${++seq}` });
    console.log(`  ok   ${name}`);
  } catch (err) {
    failures++;
    console.log(`  FAIL ${name}\n       ${err.message}`);
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
}

/**
 * Run the hook as Claude Code does. Returns the raw result so tests can assert on the exit
 * status too — `exit 2` is the one outcome that would block the human's prompt.
 */
function run(ctx, { input, env = {} } = {}) {
  const raw =
    input !== undefined ? input : JSON.stringify({ cwd: ctx.repo, session_id: ctx.session });
  const res = spawnSync(process.execPath, [HOOK], {
    input: raw,
    encoding: 'utf8',
    env: { ...process.env, TMPDIR: ctx.state, TEMP: ctx.state, TMP: ctx.state, ...env },
  });
  const text = (res.stdout || '').trim();
  return {
    status: res.status,
    stdout: text,
    context: text ? JSON.parse(text).hookSpecificOutput.additionalContext : null,
    parsed: text ? JSON.parse(text) : null,
  };
}

function mkrepo(dir, { agentsMd = false, specs = [], incidents = [] } = {}) {
  fs.mkdirSync(path.join(dir, '.git'), { recursive: true }); // makes findRepoRoot stop here
  if (agentsMd) fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# AGENTS\n');
  if (specs.length) {
    fs.mkdirSync(path.join(dir, '.ai', 'specs'), { recursive: true });
    for (const s of specs) fs.writeFileSync(path.join(dir, '.ai', 'specs', s), '# spec\n');
  }
  if (incidents.length) {
    fs.mkdirSync(path.join(dir, '.ai', 'incidents'), { recursive: true });
    for (const i of incidents) fs.writeFileSync(path.join(dir, '.ai', 'incidents', i), '# i\n');
  }
}

/** Every file under a dir, relative and sorted — the before/after shape of a working tree. */
function tree(dir) {
  const out = [];
  (function walk(d, prefix) {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) walk(path.join(d, e.name), rel);
      else out.push(rel);
    }
  })(dir, '');
  return out;
}

/** Drive n turns, returning how many of them emitted. */
function turns(ctx, n, env) {
  let emitted = 0;
  for (let i = 0; i < n; i++) if (run(ctx, { env }).context) emitted++;
  return emitted;
}

console.log('prompt-anchor.js');

// ---------------------------------------------------------------------------
// Safety invariants — these ship to every repo on the machine.
// ---------------------------------------------------------------------------

// A blocking gate was considered and rejected (CHANGELOG 1.5.0). `exit 2` and a `decision`
// field are the only ways to block a prompt; neither may ever appear, whatever the input.
test('never blocks the prompt, under any input', (ctx) => {
  mkrepo(ctx.repo, { agentsMd: true, specs: ['2026-01-01-x.md'] });
  const inputs = [
    undefined,
    '',
    'not json at all',
    '{"cwd":',
    JSON.stringify({}),
    JSON.stringify({ cwd: '/nonexistent/path/that/is/not/there' }),
    JSON.stringify({ cwd: ctx.repo, session_id: null }),
    JSON.stringify({ cwd: ctx.repo, session_id: '../../escape' }),
    JSON.stringify({ cwd: ctx.repo, session_id: { not: 'a string' } }),
  ];
  for (const input of inputs) {
    const res = run(ctx, { input });
    assert.notStrictEqual(res.status, 2, `exit 2 on input: ${String(input).slice(0, 40)}`);
    assert.strictEqual(res.status, 0, `non-zero exit on input: ${String(input).slice(0, 40)}`);
    if (res.parsed) {
      assert.strictEqual(res.parsed.decision, undefined, 'emitted a decision field');
      assert.strictEqual(res.parsed.hookSpecificOutput.hookEventName, 'UserPromptSubmit');
    }
  }
});

// A corrupt state file is a normal condition, not a reason to break a session.
test('survives a corrupt state file', (ctx) => {
  mkrepo(ctx.repo, { agentsMd: true });
  run(ctx); // create state
  for (const f of fs.readdirSync(ctx.state)) {
    fs.writeFileSync(path.join(ctx.state, f), '}{ not json');
  }
  const res = run(ctx);
  assert.strictEqual(res.status, 0);
});

// The plugin is enabled globally. Silence in unrelated checkouts is the whole reason
// it is tolerable to install at all.
test('stays silent in a repo that never adopted the workflow', (ctx) => {
  mkrepo(ctx.repo); // no AGENTS.md, no .ai/
  assert.strictEqual(turns(ctx, 30), 0);
});

// A counter file that shows up in `git status` is a defect, not a detail.
test('writes nothing inside the repo under test', (ctx) => {
  mkrepo(ctx.repo, { agentsMd: true, specs: ['2026-01-01-x.md'] });
  const before = tree(ctx.repo);
  turns(ctx, 25);
  assert.deepStrictEqual(tree(ctx.repo), before);
});

// It pays its cost per turn, so the payload is a budget, not a preference.
test('keeps the emitted anchor short', (ctx) => {
  mkrepo(ctx.repo, { agentsMd: true, specs: ['2026-07-18-prompt-anchor.md'] });
  turns(ctx, 9);
  const res = run(ctx);
  assert.ok(res.context, 'expected an emission by turn 10');
  // ~4 chars/token; 80 tokens is the ceiling the spec set.
  assert.ok(res.context.length <= 320, `anchor too long: ${res.context.length} chars`);
});

// ---------------------------------------------------------------------------
// Emission policy — control arm: always.
// ---------------------------------------------------------------------------

// The point of this arm: no suppression at all, so the cost is maximal and the effect,
// if the decay premise is wrong, should be too.
test('emits on every turn, including the first', (ctx) => {
  mkrepo(ctx.repo, { agentsMd: true, specs: ['2026-01-01-x.md'] });
  assert.strictEqual(turns(ctx, 30), 30);
});

test('ignores SAILES_ANCHOR_EVERY — there is no gap to tune', (ctx) => {
  mkrepo(ctx.repo, { agentsMd: true, specs: ['2026-01-01-x.md'] });
  assert.strictEqual(turns(ctx, 30, { SAILES_ANCHOR_EVERY: '5' }), 30);
});

test('re-anchors on a spec appearing mid-session', (ctx) => {
  mkrepo(ctx.repo, { agentsMd: true });
  turns(ctx, 3);
  fs.mkdirSync(path.join(ctx.repo, '.ai', 'specs'), { recursive: true });
  fs.writeFileSync(path.join(ctx.repo, '.ai', 'specs', '2026-07-18-new.md'), '# spec\n');
  assert.match(run(ctx).context, /2026-07-18-new\.md/);
});

// Something is broken right now; the build pipeline is the wrong instrument for it.
test('an open incident outranks a spec in the anchor', (ctx) => {
  mkrepo(ctx.repo, { agentsMd: true, specs: ['2026-01-01-x.md'], incidents: ['2026-07-18-down.md'] });
  assert.match(run(ctx).context, /OPEN INCIDENT/);
});

// A closed incident is not news. Reusing the router's own rule keeps the two consistent.
test('ignores incidents whose record says they are closed', (ctx) => {
  mkrepo(ctx.repo, { agentsMd: true });
  fs.mkdirSync(path.join(ctx.repo, '.ai', 'incidents'), { recursive: true });
  fs.writeFileSync(
    path.join(ctx.repo, '.ai', 'incidents', '2026-07-01-old.md'),
    '# old\nStatus: FIXED\n'
  );
  assert.doesNotMatch(run(ctx).context || '', /OPEN INCIDENT/);
});

test('routes a spec-less repo to discovery', (ctx) => {
  mkrepo(ctx.repo, { agentsMd: true });
  assert.match(run(ctx).context, /sailes-discovery/);
});

// Anything repeating the rules cheaply must repeat THESE words, or the instruments compete.
test('carries the canonical spine verbatim', (ctx) => {
  mkrepo(ctx.repo, { agentsMd: true });
  assert.match(run(ctx).context, /SPEC → HUMAN → VERIFIED → GATED/);
});

if (failures) {
  console.log(`\n${failures} failing`);
  process.exit(1);
}
console.log('\nall passing');

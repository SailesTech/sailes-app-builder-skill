#!/usr/bin/env node
'use strict';

/**
 * Tests for tools/mcp-toolnames-check.js — does the role/server tool-name diff actually turn red
 * when the two disagree, and does it stay a loud SKIP (never a silent pass, never a printed PASS)
 * when no server can be reached, rather than defaulting to green.
 *
 * Deterministic by construction: every CLI-level fixture below drives the check with
 * `--server-tools-json` (a canned tool list, no process spawned) or a deliberately nonexistent
 * `--server-cmd` (a real spawn attempt that is guaranteed to fail fast, no network involved) — never
 * against the real `npx chrome-devtools-mcp`. That keeps this file runnable with zero external
 * dependencies, same footing as ownership-check.test.js and worker-status.test.js. The live
 * discovery mechanism (`queryServerTools`) is still exercised directly, against a real (failing)
 * spawn, in the "discovery mechanism" section below — what is NOT exercised here is a *successful*
 * live query, which depends on an installed server and is out of scope for a deterministic gate;
 * see the governing spec (F5a) for the separate, manual "run against the real server" measurement.
 *
 * Run: node tools/mcp-toolnames-check.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CHECK = path.join(__dirname, 'mcp-toolnames-check.js');
const mod = require('./mcp-toolnames-check.js');

let failures = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    failures++;
    console.error(`  FAIL ${name}`);
    console.error(`       ${err && err.stack ? err.stack : err}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    failures++;
    console.error(`  FAIL ${name}`);
    console.error(`       ${err && err.stack ? err.stack : err}`);
  }
}

const rm = (d) => fs.rmSync(d, { recursive: true, force: true });

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-mcp-toolnames-'));
}

/** Writes a minimal role-file fixture: real frontmatter fence, a `tools:` line carrying the given
 *  `mcp__chrome-devtools__*` names plus a couple of ordinary (non-MCP) tools, same shape as the
 *  real agents/*.md files. */
function roleFile(dir, roleId, mcpToolNames) {
  const toolsLine = ['Glob', 'Grep', 'Read', 'Bash', ...mcpToolNames.map((t) => `mcp__chrome-devtools__${t}`)].join(
    ', '
  );
  const body =
    `---\nname: ${roleId}\ndescription: fixture role for mcp-toolnames-check tests\n` +
    `model: claude-sonnet-5\ntools: ${toolsLine}\n---\n\nFixture role body — never parsed for tools.\n`;
  const file = path.join(dir, `${roleId}.md`);
  fs.writeFileSync(file, body);
  return file;
}

function serverToolsJson(dir, names) {
  const file = path.join(dir, 'server-tools.json');
  fs.writeFileSync(file, JSON.stringify({ tools: names.map((name) => ({ name })) }));
  return file;
}

function run(args) {
  return spawnSync(process.execPath, [CHECK, ...args], { encoding: 'utf8' });
}

// ================================================================== unit-level: parsing

test('extractFrontmatterToolsLine finds the tools: line inside the frontmatter fence', () => {
  const text = '---\nname: x\ntools: Glob, mcp__chrome-devtools__click\n---\n\ntools: this is prose, not frontmatter\n';
  const line = mod.extractFrontmatterToolsLine(text, 'fixture');
  assert.strictEqual(line.trim(), 'Glob, mcp__chrome-devtools__click');
});

test('extractFrontmatterToolsLine throws, naming the file, when there is no frontmatter fence', () => {
  assert.throws(() => mod.extractFrontmatterToolsLine('# no frontmatter here\n', 'agents/broken.md'), /agents\/broken\.md/);
});

test('extractFrontmatterToolsLine throws when frontmatter has no tools: line', () => {
  assert.throws(
    () => mod.extractFrontmatterToolsLine('---\nname: x\n---\nbody\n', 'agents/broken.md'),
    /tools:/
  );
});

test('parseMcpToolNames keeps only mcp__chrome-devtools__* entries, prefix stripped, order kept', () => {
  const names = mod.parseMcpToolNames('Glob, Bash, mcp__chrome-devtools__click, Read, mcp__chrome-devtools__hover');
  assert.deepStrictEqual(names, ['click', 'hover']);
});

test('parseMcpToolNames returns an empty list for a role with no devtools tools', () => {
  assert.deepStrictEqual(mod.parseMcpToolNames('Glob, Bash, Read'), []);
});

// ================================================================== unit-level: diff

test('diffToolSets: identical role union and server list -> no findings either direction', () => {
  const roleTools = new Map([
    ['qa', new Set(['click', 'hover'])],
    ['fe-dev', new Set(['click'])],
  ]);
  const diff = mod.diffToolSets(roleTools, ['click', 'hover']);
  assert.deepStrictEqual(diff.missingFromServer, []);
  assert.deepStrictEqual(diff.missingFromRoles, []);
});

test('diffToolSets: a tool a role claims but the server lacks -> reported with its role', () => {
  const roleTools = new Map([['qa', new Set(['click', 'made_up_tool'])]]);
  const diff = mod.diffToolSets(roleTools, ['click']);
  assert.deepStrictEqual(diff.missingFromServer, [{ role: 'qa', tool: 'made_up_tool' }]);
  assert.deepStrictEqual(diff.missingFromRoles, []);
});

test('diffToolSets: a server tool no role claims -> reported with no role attached', () => {
  const roleTools = new Map([['qa', new Set(['click'])]]);
  const diff = mod.diffToolSets(roleTools, ['click', 'take_heapsnapshot']);
  assert.deepStrictEqual(diff.missingFromServer, []);
  assert.deepStrictEqual(diff.missingFromRoles, ['take_heapsnapshot']);
});

test('diffToolSets: the same missing tool claimed by two roles is reported once per role', () => {
  const roleTools = new Map([
    ['qa', new Set(['made_up_tool'])],
    ['fe-dev', new Set(['made_up_tool'])],
  ]);
  const diff = mod.diffToolSets(roleTools, []);
  assert.deepStrictEqual(diff.missingFromServer, [
    { role: 'fe-dev', tool: 'made_up_tool' },
    { role: 'qa', tool: 'made_up_tool' },
  ]);
});

// ================================================================== unit-level: tools/list response shape

test('parseToolsListResult reads names off a well-formed tools/list response', () => {
  const msg = { jsonrpc: '2.0', id: 2, result: { tools: [{ name: 'click' }, { name: 'hover' }] } };
  assert.deepStrictEqual(mod.parseToolsListResult(msg), ['click', 'hover']);
});

test('parseToolsListResult throws on a response with no result.tools array', () => {
  assert.throws(() => mod.parseToolsListResult({ jsonrpc: '2.0', id: 2, result: {} }), /result\.tools/);
});

test('parseToolsListResult throws on a tool entry with no string name', () => {
  assert.throws(
    () => mod.parseToolsListResult({ result: { tools: [{ description: 'no name here' }] } }),
    /name/
  );
});

// ================================================================== unit-level: loadServerToolsFromJson

test('loadServerToolsFromJson reads a {"tools": [{"name": ...}]} shape', () => {
  const dir = tmpDir();
  try {
    const file = serverToolsJson(dir, ['click', 'hover']);
    assert.deepStrictEqual(mod.loadServerToolsFromJson(file), ['click', 'hover']);
  } finally {
    rm(dir);
  }
});

test('loadServerToolsFromJson reads a plain array-of-strings shape', () => {
  const dir = tmpDir();
  try {
    const file = path.join(dir, 'plain.json');
    fs.writeFileSync(file, JSON.stringify(['click', 'hover']));
    assert.deepStrictEqual(mod.loadServerToolsFromJson(file), ['click', 'hover']);
  } finally {
    rm(dir);
  }
});

test('loadServerToolsFromJson throws on a JSON shape it does not recognize', () => {
  const dir = tmpDir();
  try {
    const file = path.join(dir, 'wrong.json');
    fs.writeFileSync(file, JSON.stringify({ notTools: [] }));
    assert.throws(() => mod.loadServerToolsFromJson(file), /expected/);
  } finally {
    rm(dir);
  }
});

// ================================================================== CLI-level: the four Done-when fixtures

test('fixture: role names a tool the server lacks -> exit 1, names the role and the tool', () => {
  const dir = tmpDir();
  try {
    const roleA = roleFile(dir, 'qa', ['click', 'made_up_tool']);
    const roleB = roleFile(dir, 'fe-dev', ['click']);
    const serverJson = serverToolsJson(dir, ['click', 'hover']);
    const r = run(['--role-files', `${roleA},${roleB}`, '--server-tools-json', serverJson]);
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    const out = r.stdout + r.stderr;
    assert.ok(/qa/.test(out), 'the owning role "qa" is not named');
    assert.ok(/made_up_tool/.test(out), 'the missing tool name is not named');
  } finally {
    rm(dir);
  }
});

test('fixture: server offers a tool no role lists -> exit 1, names the tool', () => {
  const dir = tmpDir();
  try {
    const roleA = roleFile(dir, 'qa', ['click']);
    const serverJson = serverToolsJson(dir, ['click', 'take_heapsnapshot']);
    const r = run(['--role-files', roleA, '--server-tools-json', serverJson]);
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    const out = r.stdout + r.stderr;
    assert.ok(/take_heapsnapshot/.test(out), 'the unclaimed server tool is not named');
  } finally {
    rm(dir);
  }
});

test('fixture: lists agree -> exit 0 (MUST NOT fire)', () => {
  const dir = tmpDir();
  try {
    const roleA = roleFile(dir, 'qa', ['click', 'hover']);
    const roleB = roleFile(dir, 'fe-dev', ['click']);
    const serverJson = serverToolsJson(dir, ['click', 'hover']);
    const r = run(['--role-files', `${roleA},${roleB}`, '--server-tools-json', serverJson]);
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    assert.ok(/agree/.test(r.stdout), 'exit 0 did not explain why (no "agree" in stdout)');
  } finally {
    rm(dir);
  }
});

test('server absent -> "SKIP: <reason>", exit 0, never a silent pass and never a printed PASS', () => {
  const dir = tmpDir();
  try {
    const roleA = roleFile(dir, 'qa', ['click']);
    const r = run([
      '--role-files',
      roleA,
      '--server-cmd',
      'sailes-mcp-toolnames-check-nonexistent-binary-2026',
      '--timeout',
      '5000',
    ]);
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    assert.ok(/SKIP:/.test(r.stdout), 'no explicit "SKIP:" line on stdout');
    assert.ok(!/\bPASS\b/.test(r.stdout), 'a SKIP must never read as a printed PASS');
  } finally {
    rm(dir);
  }
});

// ================================================================== discovery mechanism, tested directly

async function runDiscoveryTests() {
  await testAsync('queryServerTools resolves { ok: false, reason } for a command that cannot start, fast', async () => {
    const t0 = Date.now();
    const result = await mod.queryServerTools('sailes-mcp-toolnames-check-nonexistent-binary-2026', {
      timeoutMs: 5000,
    });
    assert.strictEqual(result.ok, false);
    assert.ok(typeof result.reason === 'string' && result.reason.length > 0, 'no reason given for the failure');
    assert.ok(Date.now() - t0 < 5000, 'a command that cannot start should fail well before the timeout, not by it');
  });

  await testAsync('queryServerTools times out with a named reason when nothing ever responds', async () => {
    // `node -e "setInterval(()=>{}, 1000)"` is a real, startable process that never speaks the
    // protocol on stdout — this exercises the timeout path specifically, not the spawn-failure path.
    const cmd = `${JSON.stringify(process.execPath)} -e "setInterval(()=>{}, 1000)"`;
    const result = await mod.queryServerTools(cmd, { timeoutMs: 800 });
    assert.strictEqual(result.ok, false);
    assert.ok(/timed out/i.test(result.reason), `reason should say it timed out, got: ${result.reason}`);
  });
}

// ================================================================== role-file parsing edge cases via CLI

test('a role file with no frontmatter fence -> exit 1, names the file', () => {
  const dir = tmpDir();
  try {
    const file = path.join(dir, 'broken.md');
    fs.writeFileSync(file, '# not a role file\n\nno frontmatter at all\n');
    const serverJson = serverToolsJson(dir, ['click']);
    const r = run(['--role-files', file, '--server-tools-json', serverJson]);
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
    assert.ok((r.stdout + r.stderr).includes('broken.md'), 'the broken role file is not named');
  } finally {
    rm(dir);
  }
});

// ================================================================== CLI plumbing

test('unrecognized argument -> exit 1, usage message', () => {
  const r = run(['--not-a-real-flag']);
  assert.strictEqual(r.status, 1);
  assert.ok(/usage/i.test(r.stdout + r.stderr));
});

test('--help -> exit 0, usage message, no server contacted', () => {
  const r = run(['--help']);
  assert.strictEqual(r.status, 0);
  assert.ok(/usage/i.test(r.stdout));
});

(async () => {
  await runDiscoveryTests();
  console.log(failures === 0 ? '\nmcp-toolnames-check: all tests passed' : `\nmcp-toolnames-check: ${failures} failing`);
  process.exitCode = failures === 0 ? 0 : 1;
})();

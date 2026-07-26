#!/usr/bin/env node
'use strict';

/**
 * Executable tests for the SessionStart framework-version triage.
 *
 * This was the only hook without a test file. It speaks in every session on every machine that
 * installed the plugin, its behavior is deterministic (read two files, compare, print or stay
 * quiet), and the repo's own rule is that deterministic behavior gets a real test. It was
 * exercised by hand on 2026-07-25 by piping SessionStart JSON into it; that proof died with the
 * session, which is exactly what a test file is for.
 *
 * Both directions, always. Silence is this hook's default and its most important behavior —
 * anything it prints costs context in every session — so every must-speak case here has a
 * must-stay-quiet case beside it.
 *
 * Driven the way Claude Code drives it: JSON on stdin, JSON or nothing on stdout.
 * Run: node hooks/framework-version-check.test.js   (or `npm test`)
 */

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOOK = path.join(__dirname, 'framework-version-check.js');

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

function tmp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `sailes-fvc-${prefix}-`));
}

/** A fake installed plugin: a VERSION file, optionally a CHANGELOG. */
function makePlugin(version, changelog) {
  const dir = tmp('plugin');
  fs.writeFileSync(path.join(dir, 'VERSION'), `${version}\n`);
  if (changelog) fs.writeFileSync(path.join(dir, 'CHANGELOG.md'), changelog);
  return dir;
}

/**
 * A fake client repo. `.git` makes it a repo root, so findRepoRoot stops here instead of
 * walking up into the real repo and reading its AGENTS.md — which would make every case pass
 * or fail for the wrong reason.
 */
function makeRepo({ stamp, agentsMd, aiDir } = {}) {
  const dir = tmp('repo');
  fs.mkdirSync(path.join(dir, '.git'));
  if (aiDir) fs.mkdirSync(path.join(dir, '.ai'));
  if (agentsMd !== undefined) {
    fs.writeFileSync(path.join(dir, 'AGENTS.md'), agentsMd);
  } else if (stamp !== undefined) {
    fs.writeFileSync(
      path.join(dir, 'AGENTS.md'),
      `# Agents Guidelines\n\n> Single source of truth.\n> Framework-Version: ${stamp}\n\n## The spine\n`
    );
  }
  return dir;
}

/** Returns the emitted additionalContext, or null when the hook stayed silent. */
function run({ pluginRoot, cwd }) {
  const env = { ...process.env };
  delete env.CLAUDE_PLUGIN_ROOT;
  if (pluginRoot) env.CLAUDE_PLUGIN_ROOT = pluginRoot;

  const out = execFileSync(process.execPath, [HOOK], {
    input: JSON.stringify({ hook_event_name: 'SessionStart', cwd }),
    encoding: 'utf8',
    env,
  });
  if (!out.trim()) return null;
  return JSON.parse(out).hookSpecificOutput.additionalContext;
}

// ---------------------------------------------------------------- silence (the default)

test('silent when not running as a plugin hook (no CLAUDE_PLUGIN_ROOT)', () => {
  assert.strictEqual(run({ cwd: makeRepo({ stamp: '1.0.0' }) }), null);
});

test('silent when the repo is up to date — the whole point of the hook being cheap', () => {
  assert.strictEqual(
    run({ pluginRoot: makePlugin('1.16.0'), cwd: makeRepo({ stamp: '1.16.0' }) }),
    null
  );
});

test('silent in a repo that is not a Sailes repo at all', () => {
  // No AGENTS.md and no .ai/ — the plugin is enabled globally, so silence here is what
  // stops it nagging in every unrelated checkout.
  assert.strictEqual(run({ pluginRoot: makePlugin('1.16.0'), cwd: makeRepo() }), null);
});

test('silent when the plugin has no readable VERSION rather than guessing', () => {
  const plugin = tmp('plugin-empty');
  assert.strictEqual(run({ pluginRoot: plugin, cwd: makeRepo({ stamp: '1.0.0' }) }), null);
});

test('patch-level equality counts as up to date (1.16 and 1.16.0 are the same standard)', () => {
  assert.strictEqual(
    run({ pluginRoot: makePlugin('1.16.0'), cwd: makeRepo({ stamp: '1.16' }) }),
    null
  );
});

// ---------------------------------------------------------------- the repo is behind

test('speaks when the repo is behind, naming both versions', () => {
  const ctx = run({ pluginRoot: makePlugin('1.16.0'), cwd: makeRepo({ stamp: '1.13.0' }) });
  assert.ok(ctx, 'expected the hook to speak');
  assert.ok(ctx.includes('1.13.0'), 'must name the repo stamp');
  assert.ok(ctx.includes('1.16.0'), 'must name the current standard');
  assert.ok(/Upgrade mode/i.test(ctx), 'must point at the real audit, not scaffold');
});

test('offers rather than acts — it must not instruct anyone to change files unprompted', () => {
  const ctx = run({ pluginRoot: makePlugin('1.16.0'), cwd: makeRepo({ stamp: '1.13.0' }) });
  assert.ok(/OFFER/i.test(ctx), 'must offer');
  assert.ok(
    /do not run it|do not change any files/i.test(ctx),
    'must say not to act without the human accepting — documented drift beats forced alignment'
  );
});

test('lists the CHANGELOG delta, and only the versions strictly between stamp and standard', () => {
  const changelog = [
    '# Changelog',
    '',
    '## 1.16.0 — 2026-07-26 · measurement, routing, sub-teams',
    '## 1.15.0 — 2026-07-25 · worker release and delivery',
    '## 1.13.0 — 2026-07-22 · sailes-migrate',
    '## 1.10.0 — 2026-07-20 · sailes-test',
    '',
  ].join('\n');
  const ctx = run({
    pluginRoot: makePlugin('1.16.0', changelog),
    cwd: makeRepo({ stamp: '1.13.0' }),
  });
  assert.ok(ctx.includes('1.15.0'), 'a version between the two must appear');
  assert.ok(ctx.includes('1.16.0'), 'the target version must appear');
  assert.ok(!/- 1\.13\.0/.test(ctx), 'the stamped version itself is not part of the delta');
  assert.ok(!/1\.10\.0/.test(ctx), 'a version below the stamp must not appear');
});

test('a missing CHANGELOG degrades to no delta rather than failing', () => {
  const ctx = run({ pluginRoot: makePlugin('1.16.0'), cwd: makeRepo({ stamp: '1.13.0' }) });
  assert.ok(ctx, 'must still speak');
  assert.ok(!/Standard changed in/.test(ctx), 'no delta block without a CHANGELOG');
});

// ---------------------------------------------------------------- the plugin is behind

test('speaks when the PLUGIN is behind the repo, and says not to downgrade the repo', () => {
  const ctx = run({ pluginRoot: makePlugin('1.13.0'), cwd: makeRepo({ stamp: '1.16.0' }) });
  assert.ok(ctx, 'expected the hook to speak');
  assert.ok(/plugin is behind the repo/i.test(ctx), 'must name the direction');
  assert.ok(/do not "?downgrade"?/i.test(ctx), 'must warn against downgrading the repo');
});

// ---------------------------------------------------------------- partial / unstamped repos

test('speaks when the repo has .ai/ but no AGENTS.md', () => {
  const ctx = run({ pluginRoot: makePlugin('1.16.0'), cwd: makeRepo({ aiDir: true }) });
  assert.ok(ctx, 'expected the hook to speak');
  assert.ok(/no root AGENTS\.md/i.test(ctx));
  assert.ok(/Do not scaffold/i.test(ctx), 'a script cannot see DRIFT, only absence');
});

test('speaks when AGENTS.md carries no Framework-Version stamp', () => {
  const ctx = run({
    pluginRoot: makePlugin('1.16.0'),
    cwd: makeRepo({ agentsMd: '# Agents Guidelines\n\nNo stamp here.\n' }),
  });
  assert.ok(ctx, 'expected the hook to speak');
  assert.ok(/no `?Framework-Version:?`? stamp/i.test(ctx));
  assert.ok(/mention it once/i.test(ctx), 'must be explicitly low-urgency');
});

test('an unfilled template placeholder is treated as unstamped, not as a version', () => {
  const ctx = run({
    pluginRoot: makePlugin('1.16.0'),
    cwd: makeRepo({ agentsMd: '# Agents\n\n> Framework-Version: {{VERSION}}\n' }),
  });
  assert.ok(ctx, 'expected the hook to speak');
  assert.ok(/no `?Framework-Version:?`? stamp/i.test(ctx));
});

test('the stamp is read from the header, not from prose deep in the body', () => {
  // AGENTS.md itself discusses the stamp in its Release section; a hook that scanned the whole
  // file would read that prose as the repo's version.
  const body = ['# Agents', '', '> Framework-Version: 1.16.0', '']
    .concat(Array(60).fill('filler line'))
    .concat(['Framework-Version: 1.2.3 is an example in prose.'])
    .join('\n');
  assert.strictEqual(
    run({ pluginRoot: makePlugin('1.16.0'), cwd: makeRepo({ agentsMd: body }) }),
    null,
    'header stamp equals the standard, so it must stay silent'
  );
});

// ---------------------------------------------------------------- never breaks a session

test('exits 0 and stays silent on malformed stdin', () => {
  const env = { ...process.env, CLAUDE_PLUGIN_ROOT: makePlugin('1.16.0') };
  const out = execFileSync(process.execPath, [HOOK], {
    input: 'not json at all',
    encoding: 'utf8',
    env,
    cwd: makeRepo(),
  });
  assert.strictEqual(out.trim(), '', 'a triage hint is never worth breaking a session over');
});

console.log(
  failures === 0
    ? '\nframework-version-check: all tests passed'
    : `\nframework-version-check: ${failures} failing`
);
process.exit(failures === 0 ? 0 : 1);

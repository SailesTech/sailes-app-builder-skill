#!/usr/bin/env node
'use strict';

/**
 * Regression tests for the Claude role frontmatter in `agents/*.md`.
 *
 * The Codex twin has had `validate-toml.test.js` since 1.7.1; the Claude side had nothing, so a
 * typo in a role's frontmatter shipped silently. 1.16.0 widened that gap by adding two more
 * fields to every role (a pinned `model` and an explicit `effort`), which is why this exists now.
 *
 * The load-bearing case is the last one. "No worker or gate can spawn subagents" is the invariant
 * that makes depth-2 sub-teams safe, and until now it was true only by accident: the roles happen
 * to carry `tools:` lists that omit `Agent`. A future edit adding a tool to `checker` could
 * reintroduce `Agent` with nothing to catch it. Here it fails the suite.
 *
 * Roles are discovered from disk, never hardcoded — a hardcoded ROLES array is what left
 * `tester.toml` unvalidated when it was added (recorded in the sailes-test pre-implement, W4).
 *
 * Run: node agents/validate-frontmatter.test.js   (or `npm test`)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const AGENTS_DIR = __dirname;
const LINE_SPLIT = /\r?\n/; // this repo is CRLF on disk

/**
 * Fields Claude Code accepts in subagent frontmatter (docs, 2026-07-26, v2.1.220).
 * An unknown key is silently ignored by the loader, which is exactly why it needs a test:
 * a typo'd `efort:` would leave the role on the session default with no error anywhere.
 */
const KNOWN_FIELDS = new Set([
  'name', 'description', 'tools', 'disallowedTools', 'model', 'effort', 'permissionMode',
  'mcpServers', 'hooks', 'maxTurns', 'skills', 'initialPrompt', 'memory', 'background',
  'isolation', 'color',
]);

/** Dated allowlist — re-check when the model roster moves. Aliases are legal but we pin. */
const KNOWN_MODELS = new Set([
  'claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5', 'claude-fable-5',
  'claude-opus-4-8', 'claude-opus-4-7', 'claude-sonnet-4-6', 'inherit',
]);

const EFFORT_LEVELS = new Set(['low', 'medium', 'high', 'xhigh', 'max']);

/** Models on which the `effort` parameter is not supported. */
const NO_EFFORT_MODELS = new Set(['claude-haiku-4-5']);

/** Plugin-loaded subagents ignore these fields entirely — we ship as a plugin. */
const IGNORED_IN_PLUGINS = new Set(['hooks', 'mcpServers', 'permissionMode']);

/** The lead is the only role permitted to spawn; every other role must be flat. */
const SPAWNING_ROLE = 'team-lead';

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

/** Parse the leading `---` frontmatter block into a flat key/value map. */
function parseFrontmatter(text) {
  const lines = text.split(LINE_SPLIT);
  if (lines[0].trim() !== '---') throw new Error('no opening --- on line 1');
  const end = lines.indexOf('---', 1);
  if (end === -1) throw new Error('no closing --- for the frontmatter block');

  const fields = {};
  for (let i = 1; i < end; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    const m = line.match(/^([A-Za-z][A-Za-z0-9_]*):[ \t]*(.*)$/);
    if (!m) throw new Error(`line ${i + 1} is not \`key: value\`: ${JSON.stringify(line)}`);
    fields[m[1]] = m[2].trim();
  }
  return fields;
}

/**
 * EVERY `.md` here is a role. No exclusions — that is the point.
 *
 * This function used to skip `README.md`, which institutionalised a shipped defect: Claude Code
 * registers every `.md` in a plugin's `agents/` directory as an agent, frontmatter or not, so the
 * README shipped as a phantom agent type named `README` on every machine with the plugin — no
 * description to choose it by, and no `tools` list, so it inherited everything including `Agent`.
 * The validator's own exclusion is why no test ever saw it. Found 2026-07-26 by installing the
 * plugin and reading `claude plugin details`: **Agents (9)** for eight roles.
 */
function roleFiles() {
  return fs
    .readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();
}

const files = roleFiles();

test('there are role files to validate at all', () => {
  assert.ok(files.length >= 8, `expected at least 8 roles, found ${files.length}`);
});

test('agents/ contains ONLY roles — a stray .md ships as a phantom agent', () => {
  // Documentation belongs in docs/. Anything here is registered as an agent type.
  const strays = files.filter((f) => {
    const text = fs.readFileSync(path.join(AGENTS_DIR, f), 'utf8');
    return !/^---\r?\n/.test(text);
  });
  assert.deepStrictEqual(
    strays,
    [],
    `these have no frontmatter and would register as phantom agent types: ${strays.join(', ')}`
  );
});

for (const file of files) {
  const role = path.basename(file, '.md');
  const text = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
  let fm;

  test(`${role}: frontmatter parses`, () => {
    fm = parseFrontmatter(text);
  });

  if (!fm) continue;

  test(`${role}: required fields present and name matches filename`, () => {
    assert.ok(fm.name, 'missing `name`');
    assert.ok(fm.description, 'missing `description`');
    assert.strictEqual(fm.name, role, `name "${fm.name}" does not match filename "${role}"`);
  });

  test(`${role}: every field is one Claude Code actually reads`, () => {
    for (const key of Object.keys(fm)) {
      assert.ok(KNOWN_FIELDS.has(key), `unknown frontmatter field "${key}" — silently ignored by the loader`);
      assert.ok(
        !IGNORED_IN_PLUGINS.has(key),
        `"${key}" is ignored when the agent loads from a plugin, and we ship as a plugin`
      );
    }
  });

  test(`${role}: model is pinned to a known ID`, () => {
    assert.ok(fm.model, 'missing `model` — would silently inherit the session model');
    assert.ok(KNOWN_MODELS.has(fm.model), `unknown model "${fm.model}"`);
    assert.ok(
      fm.model.startsWith('claude-'),
      `"${fm.model}" is an alias, not a pinned ID — an alias follows whatever the tier default becomes`
    );
  });

  test(`${role}: effort is valid, and absent exactly where it is unsupported`, () => {
    if (NO_EFFORT_MODELS.has(fm.model)) {
      assert.strictEqual(
        fm.effort,
        undefined,
        `\`effort\` is unsupported on ${fm.model} — this role must not carry one`
      );
      return;
    }
    assert.ok(fm.effort, 'missing `effort` — would inherit whatever the session is set to');
    assert.ok(EFFORT_LEVELS.has(fm.effort), `invalid effort "${fm.effort}"`);
  });

  test(`${role}: ${role === SPAWNING_ROLE ? 'may spawn (lead)' : 'cannot spawn subagents'}`, () => {
    const tools = fm.tools ? fm.tools.split(',').map((t) => t.trim()) : null;
    const denied = fm.disallowedTools ? fm.disallowedTools.split(',').map((t) => t.trim()) : [];

    if (role === SPAWNING_ROLE) {
      assert.ok(
        !denied.includes('Agent'),
        'the lead must be able to spawn — Agent is in disallowedTools'
      );
      return;
    }

    // Every non-lead role must be flat: either an explicit tools list without Agent,
    // or Agent explicitly denied. Inheriting the full pool is not acceptable here,
    // because with nesting on that pool includes Agent.
    const flatByAllowlist = tools !== null && !tools.some((t) => t === 'Agent' || t.startsWith('Agent('));
    const flatByDenylist = denied.includes('Agent');
    assert.ok(
      flatByAllowlist || flatByDenylist,
      'must carry an explicit `tools:` list omitting Agent (or deny it) — otherwise it inherits ' +
        'the full pool and can fan out once nested spawning is enabled'
    );
  });
}

console.log(
  failures === 0
    ? `\nagents/: ${files.length} role definitions valid`
    : `\nagents/: ${failures} failing`
);
process.exit(failures === 0 ? 0 : 1);

#!/usr/bin/env node
'use strict';

/**
 * Release-hygiene tests — the five version stamps, and the CHANGELOG they are read against.
 *
 * Two failures this closes, both measured rather than imagined:
 *
 * 1. **The stamps drift.** Five files carry the version — `VERSION`, `package.json`,
 *    `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and this repo's own
 *    `AGENTS.md` `Framework-Version:` stamp. `marketplace.json` has drifted twice and the
 *    AGENTS.md stamp twice, the latter shipping in 1.14.0. A stale stamp makes
 *    `framework-version-check.js` tell every session that the framework repo is behind the
 *    framework — the framework nagging itself.
 * 2. **An entry-less release is invisible.** `adopt-existing-repo.md` Upgrade mode computes what
 *    an older-stamped repo is missing by reading CHANGELOG headings, so a version with no
 *    heading is a change no repo will ever be told about.
 *
 * Structure: the parsing/comparison logic is pure and tested against synthetic inputs in both
 * directions, then applied to the real repo. Without the synthetic half this file could pass
 * because it checks nothing.
 *
 * Run: node release-hygiene.test.js   (or `npm test`)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const REPO = __dirname;

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

// ---------------------------------------------------------------- pure helpers

/** Every `## <version>` heading in a CHANGELOG, in file order (newest first by convention). */
function changelogVersions(text) {
  return String(text)
    .split(/\r?\n/)
    .map((l) => /^##\s+(\d+\.\d+(?:\.\d+)?)\b/.exec(l.trim()))
    .filter(Boolean)
    .map((m) => m[1]);
}

/** The `Framework-Version:` stamp from a file's header, or null. */
function stampOf(text, maxHeaderLines = 40) {
  const header = String(text).split(/\r?\n/).slice(0, maxHeaderLines);
  for (const line of header) {
    const m = /Framework-Version:\s*([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i.exec(line);
    if (m) return m[1];
  }
  return null;
}

/** Names of stamps that disagree with `expected`. Empty means they all agree. */
function disagreeing(stamps, expected) {
  return Object.entries(stamps)
    .filter(([, v]) => v !== expected)
    .map(([k, v]) => `${k}=${v === null || v === undefined ? '(none)' : v}`);
}

// ---------------------------------------------------------------- synthetic: both directions

test('changelogVersions finds headings and ignores prose that merely mentions a version', () => {
  const text = [
    '# Changelog',
    '',
    'The standard delta between versions. See 1.14.0 for context.',
    '## 1.16.0 — 2026-07-26 · measurement',
    'body text mentioning ## not-a-heading',
    '## 1.15.0 — 2026-07-25 · release',
  ].join('\n');
  assert.deepStrictEqual(changelogVersions(text), ['1.16.0', '1.15.0']);
});

test('changelogVersions returns nothing for a CHANGELOG with no headings', () => {
  assert.deepStrictEqual(changelogVersions('# Changelog\n\nnothing yet.\n'), []);
});

test('stampOf reads the header stamp and ignores a later mention in the body', () => {
  const text = ['# Agents', '> Framework-Version: 1.16.0', '']
    .concat(Array(60).fill('filler'))
    .concat(['Framework-Version: 9.9.9 appears in prose down here.'])
    .join('\n');
  assert.strictEqual(stampOf(text), '1.16.0');
});

test('stampOf returns null when the stamp is absent or an unfilled placeholder', () => {
  assert.strictEqual(stampOf('# Agents\n\nno stamp\n'), null);
  assert.strictEqual(stampOf('# Agents\n> Framework-Version: {{VERSION}}\n'), null);
});

test('disagreeing flags exactly the drifted stamp, and stays quiet when all agree', () => {
  const agreed = { VERSION: '1.16.0', 'package.json': '1.16.0', 'marketplace.json': '1.16.0' };
  assert.deepStrictEqual(disagreeing(agreed, '1.16.0'), []);

  const drifted = { ...agreed, 'marketplace.json': '1.15.0' };
  assert.deepStrictEqual(disagreeing(drifted, '1.16.0'), ['marketplace.json=1.15.0']);

  const missing = { ...agreed, 'AGENTS.md stamp': null };
  assert.deepStrictEqual(disagreeing(missing, '1.16.0'), ['AGENTS.md stamp=(none)']);
});

// ---------------------------------------------------------------- the real repo

const version = fs.readFileSync(path.join(REPO, 'VERSION'), 'utf8').trim();
const changelog = fs.readFileSync(path.join(REPO, 'CHANGELOG.md'), 'utf8');

const stamps = {
  VERSION: version,
  'package.json': JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8')).version,
  'plugin.json': JSON.parse(fs.readFileSync(path.join(REPO, '.claude-plugin/plugin.json'), 'utf8')).version,
  'marketplace.json': (
    fs.readFileSync(path.join(REPO, '.claude-plugin/marketplace.json'), 'utf8').match(/"version":\s*"([^"]+)"/) || []
  )[1],
  'AGENTS.md stamp': stampOf(fs.readFileSync(path.join(REPO, 'AGENTS.md'), 'utf8')),
};

test('VERSION is a plain semver-ish string', () => {
  assert.ok(/^\d+\.\d+\.\d+$/.test(version), `VERSION is ${JSON.stringify(version)}`);
});

test('all five version stamps agree — five files, not four', () => {
  const off = disagreeing(stamps, version);
  assert.deepStrictEqual(off, [], `drifted from VERSION=${version}: ${off.join(', ')}`);
});

test('CHANGELOG carries a heading for the current VERSION', () => {
  assert.ok(
    changelogVersions(changelog).includes(version),
    `no "## ${version}" heading — Upgrade mode computes its delta from these, so an entry-less ` +
      'release is invisible to every repo on the machine'
  );
});

test('the newest CHANGELOG heading IS the current VERSION', () => {
  const [newest] = changelogVersions(changelog);
  assert.strictEqual(
    newest,
    version,
    'the top entry must be the release being shipped, or the delta an older repo computes is wrong'
  );
});

test('no version appears twice in the CHANGELOG', () => {
  const all = changelogVersions(changelog);
  const dupes = all.filter((v, i) => all.indexOf(v) !== i);
  assert.deepStrictEqual([...new Set(dupes)], [], `duplicate CHANGELOG headings: ${dupes.join(', ')}`);
});

// The framework's own archify docs set (spec 2026-07-28-archify-gated-docs, D4): presence only.
// Freshness is owned by the release procedure + the gate eval — an mtime check here would flake.
test('the self-docs set is present — five sources, five rendered pages', () => {
  const DOCS = path.join(REPO, 'docs', 'architecture');
  const TYPES = ['architecture', 'workflow', 'sequence', 'dataflow', 'lifecycle'];
  for (const t of TYPES) {
    assert.ok(fs.existsSync(path.join(DOCS, `${t}.json`)), `docs/architecture/${t}.json missing`);
    assert.ok(fs.existsSync(path.join(DOCS, `${t}.html`)), `docs/architecture/${t}.html missing`);
  }
});

console.log(
  failures === 0
    ? `\nrelease-hygiene: all tests passed (five stamps at ${version})`
    : `\nrelease-hygiene: ${failures} failing`
);
process.exit(failures === 0 ? 0 : 1);

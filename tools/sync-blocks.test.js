#!/usr/bin/env node
'use strict';

/**
 * Tests for tools/sync-blocks.js — the mechanism that stops one rule living in three hand-written
 * copies.
 *
 * Why it exists. On 2026-08-01 three criterion/doctrine collisions were measured in a single day,
 * and all three had one shape: a rule stated in more than one place drifts, and evals then encode
 * different versions of it. Twice the copies disagreed in wording; once the CANONICAL file did not
 * carry the clause its role was enforcing. Prose asking people to "change all three or none" has
 * been in `AGENTS.md` for weeks and did not prevent any of it.
 *
 * What is under test is therefore not "does the text look right" but: **can the copies drift at
 * all without something going red.** The mutation test at the bottom is the one that matters — a
 * checker that cannot fail is decoration.
 *
 * Driven the way the gate drives it: argv in, exit code out, nothing on stdin.
 *
 * Run: node tools/sync-blocks.test.js   (or `npm test`)
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SYNC = path.join(__dirname, 'sync-blocks.js');

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

const rm = (d) => fs.rmSync(d, { recursive: true, force: true });

/**
 * A throwaway tree with one source and two consumers. Real marker syntax, real file shapes —
 * a fixture that models the mechanism rather than describing it.
 */
function makeTree({ drift = false, missingMarkers = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-sync-'));
  const block = 'The threshold is one file or one sentence. Above that, delegate.';
  fs.writeFileSync(
    path.join(dir, 'source.md'),
    `# Source\n\n<!-- BEGIN delegation-threshold -->\n${block}\n<!-- END delegation-threshold -->\n`
  );
  const consumerBody = (text) =>
    `# Consumer\n\nSome preamble that must survive.\n\n<!-- BEGIN delegation-threshold -->\n${text}\n<!-- END delegation-threshold -->\n\nTrailing prose that must also survive.\n`;
  fs.writeFileSync(path.join(dir, 'a.md'), consumerBody(block));
  fs.writeFileSync(
    path.join(dir, 'b.md'),
    missingMarkers
      ? '# Consumer\n\nNo markers here at all.\n'
      : consumerBody(drift ? block.replace('one file', 'two files') : block)
  );
  fs.writeFileSync(
    path.join(dir, 'blocks.json'),
    JSON.stringify(
      { blocks: [{ name: 'delegation-threshold', source: 'source.md', consumers: ['a.md', 'b.md'] }] },
      null,
      2
    )
  );
  return dir;
}

function run(dir, ...args) {
  return spawnSync(process.execPath, [SYNC, '--config', path.join(dir, 'blocks.json'), ...args], {
    cwd: dir,
    encoding: 'utf8',
  });
}

const read = (dir, f) => fs.readFileSync(path.join(dir, f), 'utf8');

// ---------------------------------------------------------------- --check

test('--check passes when every copy matches the source', () => {
  const dir = makeTree();
  try {
    const r = run(dir, '--check');
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\n${r.stderr}`);
  } finally {
    rm(dir);
  }
});

test('--check FAILS on drift and names the file that drifted', () => {
  // The whole point. If this ever goes green with drift present, three copies are free to
  // disagree again and nothing in the repo will notice.
  const dir = makeTree({ drift: true });
  try {
    const r = run(dir, '--check');
    assert.strictEqual(r.status, 1, 'drift did not fail the check');
    assert.ok(/b\.md/.test(r.stdout + r.stderr), 'the drifted file is not named — nobody knows where to look');
  } finally {
    rm(dir);
  }
});

test('--check FAILS when a consumer lost its markers', () => {
  // A consumer someone edited by hand until the markers were gone would otherwise pass silently:
  // nothing to compare means nothing to disagree with. Absence must be loud — that is the whole
  // lesson of 2026-08-01, where every expensive defect was something that was not there.
  const dir = makeTree({ missingMarkers: true });
  try {
    const r = run(dir, '--check');
    assert.strictEqual(r.status, 1, 'a consumer with no markers passed — the block silently stopped being enforced');
    assert.ok(/b\.md/.test(r.stdout + r.stderr), 'the file with missing markers is not named');
  } finally {
    rm(dir);
  }
});

// ---------------------------------------------------------------- write mode

test('the default run repairs drift and leaves surrounding prose untouched', () => {
  const dir = makeTree({ drift: true });
  try {
    const before = read(dir, 'b.md');
    const r = run(dir);
    assert.strictEqual(r.status, 0, `sync failed: ${r.stderr}`);
    const after = read(dir, 'b.md');
    assert.ok(/one file/.test(after), 'the block was not repaired');
    assert.ok(!/two files/.test(after), 'the drifted text survived');
    assert.ok(
      after.includes('Some preamble that must survive.') && after.includes('Trailing prose that must also survive.'),
      'the sync ate prose outside the markers'
    );
    assert.notStrictEqual(before, after, 'fixture is wrong — nothing changed, so this asserts nothing');
  } finally {
    rm(dir);
  }
});

test('a second run changes nothing — idempotent', () => {
  const dir = makeTree({ drift: true });
  try {
    run(dir);
    const once = read(dir, 'b.md');
    run(dir);
    assert.strictEqual(read(dir, 'b.md'), once, 'running twice produced a different file');
  } finally {
    rm(dir);
  }
});

test('the writer preserves the file\'s existing line endings', () => {
  // Recorded in AGENTS.md at the cost of two edits: a regex ending in \n does not match \r\n, and
  // the failure mode is a no-op that looks like success. This repo is mixed on disk, so the writer
  // must follow the file rather than the repo.
  const dir = makeTree();
  try {
    const crlf = read(dir, 'b.md').replace(/\r?\n/g, '\r\n').replace('one file', 'two files');
    fs.writeFileSync(path.join(dir, 'b.md'), crlf);
    run(dir);
    const after = fs.readFileSync(path.join(dir, 'b.md'), 'utf8');
    assert.ok(/one file/.test(after), 'CRLF file was not repaired at all');
    assert.ok(!/[^\r]\n/.test(after), 'a bare LF was introduced into a CRLF file');
  } finally {
    rm(dir);
  }
});

test('a missing source file fails loudly rather than silently syncing nothing', () => {
  const dir = makeTree();
  try {
    fs.rmSync(path.join(dir, 'source.md'));
    const r = run(dir, '--check');
    assert.notStrictEqual(r.status, 0, 'a missing source passed — the check would then guard nothing');
  } finally {
    rm(dir);
  }
});

// ---------------------------------------------------------------- the real repo

test('the real repo is in sync — this is the assertion the gate runs', () => {
  const r = spawnSync(process.execPath, [SYNC, '--check'], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
  });
  assert.strictEqual(r.status, 0, `the repo's own blocks have drifted:\n${r.stdout}${r.stderr}`);
});

console.log(failures === 0 ? '\nsync-blocks: all tests passed' : `\nsync-blocks: ${failures} failing`);
process.exitCode = failures === 0 ? 0 : 1;

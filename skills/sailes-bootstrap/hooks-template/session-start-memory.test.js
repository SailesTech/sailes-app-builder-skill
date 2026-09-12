#!/usr/bin/env node
'use strict';

/**
 * Executable tests for the P1 memory-extraction contract in `session-start.sh`
 * (spec `.ai/specs/2026-09-12-token-cost-of-running.md`, phase P1 — Q1, F1, F2, F3).
 *
 * Frozen from `.ai/test-plans/2026-09-12-token-cost-P1a.md` (FROZEN 2026-09-12, human). One test
 * per frozen ID (P1a-01..P1a-25), the ID in its name. Written from the frozen list with the
 * implementation UNREAD — at this suite's base commit `session-start.sh` still `cat`s the whole
 * file, so most of these are EXPECTED to go red until the extraction logic lands. That redness is
 * the proof the suite tests something real, not a mirror of code that doesn't exist yet.
 *
 * This file is deliberately separate from `hooks-template.test.js` (which this assignment does not
 * touch) so the pre-existing drift-check / `.env` suite stays untouched and its own green/red status
 * is never conflated with this phase's.
 *
 * Harness style matches `hooks-template.test.js`: JSON on stdin via `spawnSync sh`, a throwaway git
 * repo per test, the `shAvailable()` skip pattern. All fixtures are generated in-test — nothing
 * large is committed to the repo.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const HOOKS = __dirname;
const SESSION_START = path.join(HOOKS, 'session-start.sh');

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

/** `sh` must exist (Git Bash on Windows, /bin/sh elsewhere). Absent → SKIP, never a fake pass. */
function shAvailable() {
  const probe = spawnSync('sh', ['-c', 'exit 0'], { encoding: 'utf8' });
  return !probe.error;
}

/** A throwaway git repo with a real commit — the hook calls `git rev-parse`/`rev-list`. */
function makeRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-memory-'));
  const git = (...args) =>
    execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  git('init', '-q');
  git('config', 'user.email', 'test@local');
  git('config', 'user.name', 'test');
  fs.mkdirSync(path.join(dir, '.ai'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'seed.txt'), 'seed\n');
  git('add', '.');
  git('commit', '-q', '-m', 'seed');
  const head = git('rev-parse', '--short', 'HEAD').trim();
  return { dir, head, git };
}

const rm = (d) => fs.rmSync(d, { recursive: true, force: true });

function runHook(script, repoDir, stdin, env) {
  return spawnSync('sh', [script], {
    cwd: repoDir,
    input: stdin === undefined ? '' : stdin,
    encoding: 'utf8',
    env: env ? { ...process.env, ...env } : process.env,
  });
}

function statePath(dir) {
  return path.join(dir, '.ai', 'STATE.md');
}
function lessonsPath(dir) {
  return path.join(dir, '.ai', 'lessons.md');
}
function writeState(dir, content) {
  fs.writeFileSync(statePath(dir), content);
}
function writeLessons(dir, content) {
  fs.writeFileSync(lessonsPath(dir), content);
}

/** Pure-ASCII filler so `targetBytes` chars == `targetBytes` bytes, exactly. */
function exactSizeContent(targetBytes, prefix) {
  const pre = prefix || '';
  const preBytes = Buffer.byteLength(pre, 'utf8');
  if (preBytes > targetBytes) {
    throw new Error(`prefix (${preBytes}B) already exceeds target (${targetBytes}B)`);
  }
  return pre + 'a'.repeat(targetBytes - preBytes);
}

function byteLen(s) {
  return Buffer.byteLength(s, 'utf8');
}

const TRUNCATION_MARKER = '.ai/archive/';

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** "Names the size": the exact decimal byte count of the file appears near its filename. */
function sizeWarningPresent(stdout, filename, sizeBytes) {
  const esc = escapeRegExp(filename);
  const num = String(sizeBytes);
  const nearAfter = new RegExp(esc + '[\\s\\S]{0,300}' + num);
  const nearBefore = new RegExp(num + '[\\s\\S]{0,300}' + esc);
  return nearAfter.test(stdout) || nearBefore.test(stdout);
}

if (!shAvailable()) {
  console.log('  SKIP session-start-memory tests: no POSIX `sh` on this machine (Git Bash provides one)');
  console.log('\nsession-start-memory: skipped');
  process.exit(0);
}

// ================================================================ Happy path — spec-mandated (Done-when a-e)

test('P1a-01: small STATE.md, well under every threshold, is emitted in full', () => {
  const { dir } = makeRepo();
  try {
    const content = '# State\nVerified facts: none yet\n';
    writeState(dir, content);
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0, 'must never exit non-zero');
    assert.ok(r.stdout.includes('Verified facts'), 'STATE.md content was not emitted in full');
    assert.ok(r.stdout.includes('Task Router'), 'the Task Router pointer is missing');
  } finally {
    rm(dir);
  }
});

test('P1a-02: real 5-section fixture >=200KB, LF headings — section mode extracts 3, excludes 2', () => {
  const { dir } = makeRepo();
  try {
    const content =
      '## Open failures\n' +
      'OPEN_FAILURES_BODY_MARKER\n\n' +
      '## General rules\n' +
      'GENERAL_RULES_BODY_MARKER\n\n' +
      '## Last session\n' +
      'LAST_SESSION_BODY_MARKER\n\n' +
      '## Verified facts\n' +
      'VERIFIED_FACTS_BODY_MARKER\n\n' +
      '## Lessons learned\n' +
      'LESSONS_LEARNED_BODY_MARKER\n' +
      'a'.repeat(250000) +
      '\n';
    writeState(dir, content);
    assert.ok(fs.statSync(statePath(dir)).size >= 200000, 'fixture must be >=200KB per Done-when (b)');
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(r.stdout.includes('OPEN_FAILURES_BODY_MARKER'), 'Open failures body missing');
    assert.ok(r.stdout.includes('GENERAL_RULES_BODY_MARKER'), 'General rules body missing');
    assert.ok(r.stdout.includes('LAST_SESSION_BODY_MARKER'), 'Last session body missing');
    assert.ok(!r.stdout.includes('VERIFIED_FACTS_BODY_MARKER'), 'Verified facts leaked into stdout');
    assert.ok(!r.stdout.includes('LESSONS_LEARNED_BODY_MARKER'), 'Lessons learned leaked into stdout');
    assert.ok(byteLen(r.stdout) < 9500, `stdout is ${byteLen(r.stdout)}B, over the 9500B budget`);
  } finally {
    rm(dir);
  }
});

test('P1a-03: same 5-section fixture, CRLF headings — identical extraction outcome', () => {
  const { dir } = makeRepo();
  try {
    const content =
      '## Open failures\r\n' +
      'OPEN_FAILURES_BODY_MARKER\r\n\r\n' +
      '## General rules\r\n' +
      'GENERAL_RULES_BODY_MARKER\r\n\r\n' +
      '## Last session\r\n' +
      'LAST_SESSION_BODY_MARKER\r\n\r\n' +
      '## Verified facts\r\n' +
      'VERIFIED_FACTS_BODY_MARKER\r\n\r\n' +
      '## Lessons learned\r\n' +
      'LESSONS_LEARNED_BODY_MARKER\r\n' +
      'a'.repeat(250000) +
      '\r\n';
    writeState(dir, content);
    assert.ok(fs.statSync(statePath(dir)).size >= 200000, 'fixture must be >=200KB per Done-when (c)');
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(r.stdout.includes('OPEN_FAILURES_BODY_MARKER'), 'Open failures body missing under CRLF');
    assert.ok(r.stdout.includes('GENERAL_RULES_BODY_MARKER'), 'General rules body missing under CRLF');
    assert.ok(r.stdout.includes('LAST_SESSION_BODY_MARKER'), 'Last session body missing under CRLF');
    assert.ok(!r.stdout.includes('VERIFIED_FACTS_BODY_MARKER'), 'Verified facts leaked under CRLF');
    assert.ok(!r.stdout.includes('LESSONS_LEARNED_BODY_MARKER'), 'Lessons learned leaked under CRLF');
    assert.ok(byteLen(r.stdout) < 9500, `stdout is ${byteLen(r.stdout)}B, over the 9500B budget`);
    assert.ok(
      !r.stdout.includes('OPEN_FAILURES_BODY_MARKER\r'),
      'a raw \\r leaked into the extracted body (added at step 5, same rationale as P1a-22)'
    );
  } finally {
    rm(dir);
  }
});

test('P1a-04: client-shape fixture (dated blocks, decoys, no exact heading) — head mode, truncated', () => {
  const { dir } = makeRepo();
  try {
    const content =
      '# 2026-09-12 — latest\n' +
      'NEWEST_BLOCK_MARKER\n' +
      '## Open failure — partial\n' +
      'decoy singular heading, not a real trigger\n\n' +
      'a'.repeat(250000) +
      '\n\n' +
      '# 2026-08-01 — older\n' +
      '## Verified facts — wydanie\n' +
      'OLDER_BLOCK_MARKER (must not be needed for this test to pass)\n';
    writeState(dir, content);
    assert.ok(fs.statSync(statePath(dir)).size >= 200000, 'fixture must be >=200KB per Done-when (a)');
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(byteLen(r.stdout) < 9500, `stdout is ${byteLen(r.stdout)}B, over the 9500B budget`);
    assert.ok(
      r.stdout.indexOf('NEWEST_BLOCK_MARKER') !== -1 && r.stdout.indexOf('NEWEST_BLOCK_MARKER') < 200,
      'stdout does not begin with the newest (topmost) block'
    );
    assert.ok(r.stdout.includes('STATE.md'), 'the truncation line does not name the path');
    assert.ok(r.stdout.includes(TRUNCATION_MARKER), 'the truncation line does not name .ai/archive/');
  } finally {
    rm(dir);
  }
});

test('P1a-05: STATE.md >20000B AND lessons.md >40000B together — both size-warnings fire', () => {
  const { dir } = makeRepo();
  try {
    const stateContent = exactSizeContent(20500, '# State\n');
    const lessonsContent = exactSizeContent(40500, '# Lessons\n');
    writeState(dir, stateContent);
    writeLessons(dir, lessonsContent);
    const stateSize = fs.statSync(statePath(dir)).size;
    const lessonsSize = fs.statSync(lessonsPath(dir)).size;
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(
      sizeWarningPresent(r.stdout, 'STATE.md', stateSize),
      'no size-warning names STATE.md and its byte count'
    );
    assert.ok(
      sizeWarningPresent(r.stdout, 'lessons.md', lessonsSize),
      'no size-warning names lessons.md and its byte count'
    );
    assert.ok(
      byteLen(r.stdout) < 9500,
      `stdout is ${byteLen(r.stdout)}B — the universal budget invariant holds even when a large ` +
        'STATE.md forces truncation alongside two size-warnings (added at step 5: caught a mutant ' +
        '-- warnings-not-reserved-first -- that this case had not been checking for)'
    );
  } finally {
    rm(dir);
  }
});

// ================================================================ Happy path — added

test('P1a-06: both trigger headings present, General rules ABSENT — section mode still triggers', () => {
  const { dir, head, git } = makeRepo();
  try {
    const content =
      `Last-commit: ${head}\n` +
      '## Open failures\n' +
      'OPEN_FAILURES_BODY_MARKER\n\n' +
      '## Last session\n' +
      'LAST_SESSION_BODY_MARKER\n';
    writeState(dir, content);
    git('add', '.');
    git('commit', '-q', '-m', 'docs(state): snapshot');
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(r.stdout.includes('OPEN_FAILURES_BODY_MARKER'), 'Open failures missing without General rules');
    assert.ok(r.stdout.includes('LAST_SESSION_BODY_MARKER'), 'Last session missing without General rules');
    assert.ok(!/WARNING/.test(r.stdout), 'the snapshot commit itself must not trip the drift alarm');
  } finally {
    rm(dir);
  }
});

test('P1a-07: section mode, Last-commit present and non-stale — info line still appears', () => {
  const { dir, head, git } = makeRepo();
  try {
    const content =
      `Last-commit: ${head}\n` +
      '## Open failures\n' +
      'OPEN_FAILURES_BODY_MARKER\n\n' +
      '## Last session\n' +
      'LAST_SESSION_BODY_MARKER\n';
    writeState(dir, content);
    git('add', '.');
    git('commit', '-q', '-m', 'docs(state): snapshot');
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(/Last-commit/i.test(r.stdout), 'section mode does not echo a Last-commit info line');
    assert.ok(!/WARNING/.test(r.stdout), 'non-stale Last-commit must not fire the drift warning');
  } finally {
    rm(dir);
  }
});

test('P1a-25: section mode, NO Last-commit field at all — silent, no placeholder', () => {
  const { dir } = makeRepo();
  try {
    const content =
      '## Open failures\n' +
      'OPEN_FAILURES_BODY_MARKER\n\n' +
      '## Last session\n' +
      'LAST_SESSION_BODY_MARKER\n';
    writeState(dir, content);
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(r.stdout.includes('OPEN_FAILURES_BODY_MARKER'), 'section extraction did not proceed');
    assert.ok(r.stdout.includes('LAST_SESSION_BODY_MARKER'), 'section extraction did not proceed');
    assert.ok(!/Last-commit/i.test(r.stdout), 'a Last-commit line/placeholder appeared with no field to source it from');
  } finally {
    rm(dir);
  }
});

// ================================================================ Edges and failures

test('P1a-08: only "## Open failures" present, "## Last session" absent — falls to head mode', () => {
  const { dir } = makeRepo();
  try {
    const content =
      'PREAMBLE-HEAD-MODE-MARKER-P1A-08\n' +
      '## Open failures\n' +
      'lone heading, no Last session anywhere in this file\n';
    writeState(dir, content);
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(
      r.stdout.includes('PREAMBLE-HEAD-MODE-MARKER-P1A-08'),
      'preamble before any heading was dropped — section mode fired on a single heading'
    );
  } finally {
    rm(dir);
  }
});

test('P1a-09: only "## Last session" present, "## Open failures" absent — falls to head mode', () => {
  const { dir } = makeRepo();
  try {
    const content =
      'PREAMBLE-HEAD-MODE-MARKER-P1A-09\n' +
      '## Last session\n' +
      'lone heading, no Open failures anywhere in this file\n';
    writeState(dir, content);
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(
      r.stdout.includes('PREAMBLE-HEAD-MODE-MARKER-P1A-09'),
      'preamble before any heading was dropped — section mode fired on a single heading'
    );
  } finally {
    rm(dir);
  }
});

test('P1a-10: both headings present, Open failures body EMPTY — section mode still triggers, no leak', () => {
  const { dir } = makeRepo();
  try {
    const content =
      '## Open failures\n' +
      '## Last session\n' +
      'LAST_SESSION_BODY_MARKER\n';
    writeState(dir, content);
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0, 'an empty section body must not crash the hook');
    assert.ok(r.stdout.includes('Open failures'), 'the Open failures heading itself is missing');
    assert.ok(r.stdout.includes('LAST_SESSION_BODY_MARKER'), 'Last session body missing');
  } finally {
    rm(dir);
  }
});

test('P1a-11: decoys only ("## 🔴 Open failure — …", "## Verified facts — wydanie") — head mode', () => {
  const { dir } = makeRepo();
  try {
    const content =
      'PREAMBLE-HEAD-MODE-MARKER-P1A-11\n' +
      '## 🔴 Open failure — 2026-09-01\n' +
      'decoy body one\n\n' +
      '## Verified facts — wydanie\n' +
      'decoy body two\n';
    writeState(dir, content);
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(
      r.stdout.includes('PREAMBLE-HEAD-MODE-MARKER-P1A-11'),
      'preamble before the decoys was dropped — a decoy heading triggered section mode'
    );
  } finally {
    rm(dir);
  }
});

test('P1a-12: decorated trigger heading ("## Open failures (resolved …)") — not exact, head mode', () => {
  const { dir } = makeRepo();
  try {
    const content =
      'PREAMBLE-HEAD-MODE-MARKER-P1A-12\n' +
      '## Open failures (resolved 2026-09-01)\n' +
      'decorated heading body\n\n' +
      '## Last session\n' +
      'bare Last session body\n';
    writeState(dir, content);
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(
      r.stdout.includes('PREAMBLE-HEAD-MODE-MARKER-P1A-12'),
      'preamble was dropped — a decorated (non-exact) heading counted as a trigger'
    );
  } finally {
    rm(dir);
  }
});

test('P1a-13: STATE.md does not exist at all — exit 0, no content, Task Router still present', () => {
  const { dir } = makeRepo();
  try {
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0, 'a missing STATE.md must never block the session');
    assert.ok(r.stdout.includes('Task Router'), 'the Task Router pointer is missing');
    assert.ok(!r.stdout.includes(TRUNCATION_MARKER), 'a truncation notice appeared for a file that does not exist');
  } finally {
    rm(dir);
  }
});

test('P1a-14: STATE.md present and small, lessons.md missing — no lessons size-warning', () => {
  const { dir } = makeRepo();
  try {
    writeState(dir, '# State\nsmall file\n');
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(!/lessons\.md/i.test(r.stdout), 'a warning mentions lessons.md, which does not exist');
  } finally {
    rm(dir);
  }
});

/**
 * Calibrates the hook's own fixed overhead (Task Router line + any always-emitted warnings, per
 * the frozen Q-1 answer) by running it against a small, guaranteed-untruncated fixture and
 * measuring the difference between output size and content size. This is deliberately
 * self-referential — it reads the SUT's own behavior rather than hardcoding an assumed literal
 * overhead, which would silently break the moment the implementer's wording changes.
 */
function measureFixedOverhead(dir) {
  const smallBytes = 200;
  writeState(dir, exactSizeContent(smallBytes));
  const r = runHook(SESSION_START, dir, '{}');
  assert.ok(
    !r.stdout.includes(TRUNCATION_MARKER),
    'calibration fixture was truncated — 200B is not small enough on this build, recalibrate'
  );
  return byteLen(r.stdout) - smallBytes;
}

test('P1a-15: unclipped total would be exactly 9500B — truncated to stay under budget', () => {
  const { dir } = makeRepo();
  try {
    const overhead = measureFixedOverhead(dir);
    const contentBytes = 9500 - overhead;
    assert.ok(contentBytes > 0, `calibrated overhead (${overhead}B) already exceeds the 9500B budget`);
    writeState(dir, exactSizeContent(contentBytes));
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(
      byteLen(r.stdout) < 9500,
      `stdout is ${byteLen(r.stdout)}B — an unclipped-9500B fixture must still be truncated below budget`
    );
    assert.ok(r.stdout.includes(TRUNCATION_MARKER), 'no truncation notice on a fixture engineered to need one');
  } finally {
    rm(dir);
  }
});

test('P1a-16: unclipped total is exactly 9499B — emitted whole, no truncation', () => {
  const { dir } = makeRepo();
  try {
    const overhead = measureFixedOverhead(dir);
    const contentBytes = 9499 - overhead;
    assert.ok(contentBytes > 0, `calibrated overhead (${overhead}B) already exceeds 9499B`);
    writeState(dir, exactSizeContent(contentBytes));
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(
      !r.stdout.includes(TRUNCATION_MARKER),
      'a fixture engineered to fit (9499B unclipped) was truncated anyway — the boundary is off by one'
    );
    assert.strictEqual(
      byteLen(r.stdout),
      overhead + contentBytes,
      'stdout length does not equal overhead + full content — something was clipped despite fitting'
    );
  } finally {
    rm(dir);
  }
});

test('P1a-17: STATE.md exactly 20000B — no size-warning (last compliant value)', () => {
  const { dir } = makeRepo();
  try {
    writeState(dir, exactSizeContent(20000));
    const size = fs.statSync(statePath(dir)).size;
    assert.strictEqual(size, 20000);
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(
      !sizeWarningPresent(r.stdout, 'STATE.md', size),
      'a STATE.md size-warning fired at exactly 20000B, the last compliant value'
    );
  } finally {
    rm(dir);
  }
});

test('P1a-18: STATE.md exactly 20001B — size-warning fires, names the size', () => {
  const { dir } = makeRepo();
  try {
    writeState(dir, exactSizeContent(20001));
    const size = fs.statSync(statePath(dir)).size;
    assert.strictEqual(size, 20001);
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(
      sizeWarningPresent(r.stdout, 'STATE.md', size),
      'no STATE.md size-warning at 20001B, one byte over the limit'
    );
  } finally {
    rm(dir);
  }
});

test('P1a-19: lessons.md exactly 40000B — no size-warning (last compliant value)', () => {
  const { dir } = makeRepo();
  try {
    writeState(dir, '# State\nsmall\n');
    writeLessons(dir, exactSizeContent(40000));
    const size = fs.statSync(lessonsPath(dir)).size;
    assert.strictEqual(size, 40000);
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(
      !sizeWarningPresent(r.stdout, 'lessons.md', size),
      'a lessons.md size-warning fired at exactly 40000B, the last compliant value'
    );
  } finally {
    rm(dir);
  }
});

test('P1a-20: lessons.md exactly 40001B — size-warning fires, names the size', () => {
  const { dir } = makeRepo();
  try {
    writeState(dir, '# State\nsmall\n');
    writeLessons(dir, exactSizeContent(40001));
    const size = fs.statSync(lessonsPath(dir)).size;
    assert.strictEqual(size, 40001);
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(
      sizeWarningPresent(r.stdout, 'lessons.md', size),
      'no lessons.md size-warning at 40001B, one byte over the limit'
    );
  } finally {
    rm(dir);
  }
});

test('P1a-21: a single line longer than the whole budget — zero content lines, truncation notice only', () => {
  const { dir } = makeRepo();
  try {
    // No exact trigger headings anywhere -> head mode. One line, ~15000B, well over budget alone.
    const hugeLine = 'X'.repeat(15000);
    writeState(dir, hugeLine + '\n');
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(byteLen(r.stdout) < 9500, `stdout is ${byteLen(r.stdout)}B, over budget`);
    assert.ok(!r.stdout.includes('X'.repeat(50)), 'a fragment of the oversized line leaked into stdout (Q-2: expected zero content lines)');
    assert.ok(r.stdout.includes(TRUNCATION_MARKER), 'no truncation notice for a file that could not be shown at all');
    assert.ok(
      r.stdout.includes('STATE.md'),
      'the truncation notice does not name the file path (added at step 5, checker finding: the ' +
        'frozen plan requires "naming the path AND .ai/archive/" -- only the archive marker was checked)'
    );
  } finally {
    rm(dir);
  }
});

test('P1a-22: mixed CRLF/LF on the two trigger headings in one file — both still recognized', () => {
  const { dir } = makeRepo();
  try {
    const content =
      '## Open failures\r\n' +
      'OPEN_FAILURES_BODY_MARKER\r\n\n' +
      '## Last session\n' +
      'LAST_SESSION_BODY_MARKER\n';
    writeState(dir, content);
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(r.stdout.includes('OPEN_FAILURES_BODY_MARKER'), 'the CRLF-ended heading was not recognized');
    assert.ok(r.stdout.includes('LAST_SESSION_BODY_MARKER'), 'the LF-ended heading was not recognized');
    assert.ok(
      !r.stdout.includes('OPEN_FAILURES_BODY_MARKER\r'),
      'a raw \\r leaked into the extracted body (added at step 5: the trailing [[:space:]]*$ anchor ' +
        'tolerance alone can pass a heading with CR intact; only checking body content for a leaked ' +
        'CR actually proves the dedicated normalization step ran)'
    );
  } finally {
    rm(dir);
  }
});

test('P1a-23: a multibyte UTF-8 char sitting at the would-be cut point — cut never splits it', () => {
  const { dir } = makeRepo();
  try {
    // A single unbroken line can never exercise this: Q-2(a) means an all-in-one-line file that's
    // over budget always yields ZERO content lines regardless of where a multibyte char sits inside
    // it, so the character never reaches stdout either way. To actually exercise "the cut never
    // splits a character", the fixture needs multiple COMPLETE lines, with a multibyte char placed
    // exactly at the byte offset a naive byte-count (not line-boundary) cut would land on — i.e. at
    // the start of the line head_cut breaks on. Both quantities below are measured against this
    // build's own hook rather than assumed, so the calibration survives implementation wording
    // changes (same rationale as measureFixedOverhead).
    const tailBytes = measureFixedOverhead(dir); // warnings + Task Router, no truncation note yet

    // Force a single-line overflow to read back the truncation NOTE's own byte length (it embeds
    // this repo's real tmp path, so it cannot be hardcoded).
    writeState(dir, 'z'.repeat(15000) + '\n');
    const noteRun = runHook(SESSION_START, dir, '{}');
    assert.ok(noteRun.stdout.includes(TRUNCATION_MARKER), 'note-length calibration fixture did not truncate');
    const noteLineBytes = byteLen(noteRun.stdout) - tailBytes;
    assert.ok(noteLineBytes > 0, 'calibrated note length is non-positive — calibration is broken');

    const memBudget = 9499 - tailBytes; // MAX_BYTES - tail_bytes, mirroring the hook's own arithmetic
    const cutLimit = memBudget - noteLineBytes;
    assert.ok(cutLimit > 10, `calibrated cut_limit (${cutLimit}B) is too small to build this fixture`);

    // Line 1: exactly `cutLimit - 1` bytes (content + its own newline), so after it head_cut's
    // running total is `cutLimit - 1` -- one byte short of the limit.
    const line1 = 'a'.repeat(cutLimit - 2);
    // Line 2: starts with the 2-byte UTF-8 char immediately, so a hypothetical `head -c 1` hard-cut
    // (the exact remaining budget at this point) would grab only its first byte.
    const line2 = 'ą' + 'a'.repeat(200);
    writeState(dir, line1 + '\n' + line2 + '\n');
    assert.ok(fs.statSync(statePath(dir)).size < 20000, 'fixture must stay under the size-warning threshold to keep tailBytes valid');

    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0);
    assert.ok(byteLen(r.stdout) < 9500, `stdout is ${byteLen(r.stdout)}B, over budget`);
    // An invalid/incomplete UTF-8 sequence round-trips through Buffer as U+FFFD (replacement char).
    assert.ok(
      !Buffer.from(r.stdout, 'utf8').toString('utf8').includes('�'),
      'stdout contains a UTF-8 replacement character — a multibyte char was split at the cut point'
    );
  } finally {
    rm(dir);
  }
});

test('P1a-24: drift warning + STATE.md >20000B together — drift, size-warning and sections all present, under budget', () => {
  const { dir, head, git } = makeRepo();
  try {
    const content =
      `Last-commit: ${head}\n` +
      '## Open failures\n' +
      'OPEN_FAILURES_BODY_MARKER\n\n' +
      '## General rules\n' +
      'GENERAL_RULES_BODY_MARKER\n\n' +
      '## Last session\n' +
      'LAST_SESSION_BODY_MARKER\n\n' +
      '## Lessons learned\n' +
      exactSizeContent(21000) +
      '\n';
    writeState(dir, content);
    const stateSize = fs.statSync(statePath(dir)).size;
    assert.ok(stateSize > 20000, 'fixture must exceed the 20000B size threshold');
    git('add', '.');
    git('commit', '-q', '-m', 'docs(state): snapshot');
    for (let i = 0; i < 3; i++) {
      fs.writeFileSync(path.join(dir, `work-${i}.txt`), `work ${i}\n`);
      git('add', '.');
      git('commit', '-q', '-m', `work ${i}`);
    }
    const r = runHook(SESSION_START, dir, '{}');
    assert.strictEqual(r.status, 0, 'drift + size-warning together must never block the session');
    assert.ok(/WARNING/.test(r.stdout) && /\b3 commit\(s\)/.test(r.stdout), 'drift warning did not fire with the right count');
    assert.ok(sizeWarningPresent(r.stdout, 'STATE.md', stateSize), 'STATE.md size-warning missing alongside the drift warning');
    assert.ok(r.stdout.includes('OPEN_FAILURES_BODY_MARKER'), 'Open failures missing under combined warnings');
    assert.ok(r.stdout.includes('GENERAL_RULES_BODY_MARKER'), 'General rules missing under combined warnings');
    assert.ok(r.stdout.includes('LAST_SESSION_BODY_MARKER'), 'Last session missing under combined warnings');
    assert.ok(byteLen(r.stdout) < 9500, `stdout is ${byteLen(r.stdout)}B — combined warnings + extraction exceed budget`);
  } finally {
    rm(dir);
  }
});

console.log(
  failures === 0 ? '\nsession-start-memory: all tests passed' : `\nsession-start-memory: ${failures} failing`
);
process.exit(failures === 0 ? 0 : 1);

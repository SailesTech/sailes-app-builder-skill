#!/usr/bin/env node
'use strict';

/**
 * Executable tests for the eval provenance reporter.
 *
 * The reporter is deterministic — it reads disk and git and prints a verdict — so it gets a
 * real test, not an eval (AGENTS.md §Verification).
 *
 * Both directions, always. A defect-only fixture proves detection and says nothing about
 * invention, and an instrument that flags correct work is worse than none — it gets argued
 * with, then ignored (.ai/STATE.md §General rules, learned from the 1.14.0 browser probe).
 * So every detection case here has a matching must-not-flag case.
 *
 * Fixtures are written CRLF on purpose: this repo is CRLF on disk, and a parser built with
 * `\n` would pass an LF fixture and silently match nothing in production.
 *
 * No test framework on purpose: the repo has no runner and this needs none.
 * Run: node evals/harness/eval-status.test.js
 */

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const lib = require('./eval-status.js');

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

/** Write with CRLF line endings — matching this repo's on-disk reality. */
function writeCRLF(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text.replace(/\n/g, '\r\n'));
}

function git(dir, args, env) {
  execFileSync('git', args, {
    cwd: dir,
    stdio: 'ignore',
    env: { ...process.env, ...env },
  });
}

/** A throwaway git repo with a deterministic commit date. */
function makeRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-evalstatus-'));
  git(dir, ['init', '-q']);
  git(dir, ['config', 'user.email', 'test@example.com']);
  git(dir, ['config', 'user.name', 'Test']);
  return dir;
}

function commit(dir, relPath, contents, isoDate) {
  const abs = path.join(dir, relPath);
  writeCRLF(abs, contents);
  git(dir, ['add', '--', relPath]);
  git(dir, ['commit', '-q', '-m', `touch ${relPath}`], {
    GIT_AUTHOR_DATE: isoDate,
    GIT_COMMITTER_DATE: isoDate,
  });
}

function evalDoc({ files, lastRun }) {
  let doc = '# Eval: a protected behavior\n';
  doc += 'Skill under test:   `agents/role.md` (some section)\n';
  if (files !== undefined) doc += `Files:              ${files}\n`;
  doc += 'Setup:              hand a fresh subagent the role definition\n';
  doc += '                    and an approved spec phase.\n';
  doc += 'Expected (binary):  it delegates.\n';
  if (lastRun !== undefined) doc += `Last run:           ${lastRun}\n`;
  return doc;
}

// ---------------------------------------------------------------- field parsing

test('readField reads a label on a CRLF file', () => {
  const doc = evalDoc({ files: 'agents/role.md', lastRun: '2026-07-18 · **PASS** (both arms)' });
  assert.strictEqual(lib.readField(doc.replace(/\n/g, '\r\n'), 'Files'), 'agents/role.md');
});

test('readField joins indented continuation lines', () => {
  const doc = 'Files:              a.md,\n                    b.md\nSetup:              x\n';
  assert.strictEqual(lib.readField(doc.replace(/\n/g, '\r\n'), 'Files'), 'a.md, b.md');
});

test('readField stops at the next label rather than swallowing it', () => {
  const doc = 'Files:              a.md\nSetup:              not part of Files\n';
  assert.strictEqual(lib.readField(doc.replace(/\n/g, '\r\n'), 'Files'), 'a.md');
});

test('readField returns null for an absent label (absent != empty)', () => {
  assert.strictEqual(lib.readField(evalDoc({ lastRun: '2026-01-01' }), 'Files'), null);
});

test('parseFiles strips backticks and splits on commas and whitespace', () => {
  assert.deepStrictEqual(lib.parseFiles('`a.md`, b.md   c.md'), ['a.md', 'b.md', 'c.md']);
});

test('parseRunDate picks the ISO date out of a prose run line', () => {
  assert.strictEqual(lib.parseRunDate('2026-07-18 · **PASS** (both arms, fresh subagents)'), '2026-07-18');
});

test('parseRunDate returns null when there is no date', () => {
  assert.strictEqual(lib.parseRunDate('PENDING — never dispatched'), null);
});

test('runCoversCommit treats a same-day commit as covered', () => {
  assert.strictEqual(lib.runCoversCommit('2026-07-18', '2026-07-18T09:00:00Z'), true);
});

test('runCoversCommit flags the next day', () => {
  assert.strictEqual(lib.runCoversCommit('2026-07-18', '2026-07-19T00:00:01Z'), false);
});

test('parseRunSha reads the pinned commit out of `(at <sha>)`', () => {
  assert.strictEqual(lib.parseRunSha('2026-08-02 (at cbf20c2) · PASS · one-line note'), 'cbf20c2');
});

test('parseRunSha returns null when there is no `(at …)`', () => {
  assert.strictEqual(lib.parseRunSha('2026-08-02 · PASS · one-line note'), null);
});

test('parseRunSha ignores a token that is not hex-shaped', () => {
  assert.strictEqual(lib.parseRunSha('2026-08-02 (at not-a-real-sha) · PASS'), null);
});

// ---------------------------------------------------------------- verdicts (both directions)

test('STALE: a file changed after the recorded run is flagged', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v2\n', '2026-07-20T12:00:00Z');
  writeCRLF(
    path.join(dir, 'evals/x.md'),
    evalDoc({ files: 'agents/role.md', lastRun: '2026-07-18 · **PASS**' })
  );
  const r = lib.evaluateOne(dir, path.join(dir, 'evals/x.md'));
  assert.strictEqual(r.verdict, 'STALE');
  assert.strictEqual(r.changed[0].file, 'agents/role.md');
  assert.strictEqual(r.changed[0].changed, '2026-07-20');
});

test('FRESH: a file last changed before the run is NOT flagged', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v1\n', '2026-07-10T12:00:00Z');
  writeCRLF(
    path.join(dir, 'evals/x.md'),
    evalDoc({ files: 'agents/role.md', lastRun: '2026-07-18 · **PASS**' })
  );
  assert.strictEqual(lib.evaluateOne(dir, path.join(dir, 'evals/x.md')).verdict, 'FRESH');
});

test('FRESH: a commit on the run date itself is NOT flagged', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v1\n', '2026-07-18T08:00:00Z');
  writeCRLF(
    path.join(dir, 'evals/x.md'),
    evalDoc({ files: 'agents/role.md', lastRun: '2026-07-18 · **PASS**' })
  );
  assert.strictEqual(lib.evaluateOne(dir, path.join(dir, 'evals/x.md')).verdict, 'FRESH');
});

test('STALE: one changed file among several is enough', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v1\n', '2026-07-10T12:00:00Z');
  commit(dir, 'skills/s/SKILL.md', 'v2\n', '2026-07-22T12:00:00Z');
  writeCRLF(
    path.join(dir, 'evals/x.md'),
    evalDoc({ files: 'agents/role.md, skills/s/SKILL.md', lastRun: '2026-07-18 · **PASS**' })
  );
  const r = lib.evaluateOne(dir, path.join(dir, 'evals/x.md'));
  assert.strictEqual(r.verdict, 'STALE');
  assert.strictEqual(r.changed.length, 1);
});

test('NO-FILES: an eval with no Files: line is not reported as covered', () => {
  const dir = makeRepo();
  writeCRLF(path.join(dir, 'evals/x.md'), evalDoc({ lastRun: '2026-07-18 · **PASS**' }));
  assert.strictEqual(lib.evaluateOne(dir, path.join(dir, 'evals/x.md')).verdict, 'NO-FILES');
});

test('NEVER-RUN: Files: present but no date on Last run', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v1\n', '2026-07-10T12:00:00Z');
  writeCRLF(
    path.join(dir, 'evals/x.md'),
    evalDoc({ files: 'agents/role.md', lastRun: 'PENDING' })
  );
  assert.strictEqual(lib.evaluateOne(dir, path.join(dir, 'evals/x.md')).verdict, 'NEVER-RUN');
});

test('a listed file that does not exist is reported, not silently ignored', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v1\n', '2026-07-10T12:00:00Z');
  writeCRLF(
    path.join(dir, 'evals/x.md'),
    evalDoc({ files: 'agents/role.md, agents/gone.md', lastRun: '2026-07-18 · **PASS**' })
  );
  const r = lib.evaluateOne(dir, path.join(dir, 'evals/x.md'));
  assert.deepStrictEqual(r.missing, ['agents/gone.md']);
});

// ---------------------------------------------------------------- outcome (a separate axis)

test('parseOutcome reads the verdict position, not the prose', () => {
  assert.strictEqual(lib.parseOutcome('2026-07-18 · **PASS** (both arms)'), 'PASS');
  assert.strictEqual(lib.parseOutcome('2026-07-18 · **FAIL** — regressed'), 'FAIL');
  assert.strictEqual(lib.parseOutcome('2026-07-25 · **PASS (both arms)** · fixture: …'), 'PASS');
  assert.strictEqual(lib.parseOutcome('PENDING — written alongside the 1.16.0 change'), 'PENDING');
  assert.strictEqual(
    lib.parseOutcome('2026-07-18 · INCONCLUSIVE — the fixture never created the condition'),
    'INCONCLUSIVE'
  );
});

// Both of these are real Last-run values from this repo that a whole-value scan misread as FAIL.
test('parseOutcome is not fooled by "FAIL" describing what the agent did', () => {
  assert.strictEqual(
    lib.parseOutcome('2026-07-25 · **PASS (both arms)** · Arm B (no instrument): FAIL + the literal SKIP'),
    'PASS'
  );
  assert.strictEqual(
    lib.parseOutcome('2026-07-20 · **PASS** · stated that a Slack-first implementation would FAIL B2/B4'),
    'PASS'
  );
});

test('parseOutcome returns null when no verdict was recorded', () => {
  assert.strictEqual(lib.parseOutcome('2026-07-13'), null);
});

// The mirror image of the two cases above: a per-arm verdict is a real recorded outcome that a
// prefix-anchored scan read as *no* outcome. Measured 2026-07-29 — the run below reported
// "arm 1 FAIL · arm 2 PASS", parseOutcome returned null, and the summary line said one non-PASS
// when there were two. A verdict the machine cannot see is debt that looks like its absence,
// which is worse than a verdict it reads wrongly: nothing prompts anyone to check.
test('a per-arm verdict is not invisible — the worst arm wins', () => {
  assert.strictEqual(
    lib.parseOutcome('2026-07-29 · **arm 1 FAIL (criterion as written) · arm 2 PASS** · stand-in'),
    'FAIL'
  );
  assert.strictEqual(
    lib.parseOutcome('2026-07-28 · arm1 PASS · arm2 INCONCLUSIVE — fixture defect, MINE'),
    'INCONCLUSIVE'
  );
  assert.strictEqual(lib.parseOutcome('2026-07-29 · **arm 1 PASS · arm 2 PASS**'), 'PASS');
});

// The severity order must not let a later PASS bury an earlier FAIL, and must not resurrect the
// false positives the leading-verdict rule was built to stop.
test('a leading verdict still wins over verdict words later in the prose', () => {
  assert.strictEqual(
    lib.parseOutcome('2026-07-25 · **PASS (both arms)** · Arm B (no instrument): FAIL + the literal SKIP'),
    'PASS'
  );
});

test('an INCONCLUSIVE eval whose files are untouched is FRESH but carries its outcome', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v1\n', '2026-07-10T12:00:00Z');
  writeCRLF(
    path.join(dir, 'evals/x.md'),
    evalDoc({ files: 'agents/role.md', lastRun: '2026-07-18 · INCONCLUSIVE — fixture too short' })
  );
  const r = lib.evaluateOne(dir, path.join(dir, 'evals/x.md'));
  assert.strictEqual(r.verdict, 'FRESH');
  assert.strictEqual(r.outcome, 'INCONCLUSIVE', 'freshness must not launder a non-PASS outcome');
});

// ---------------------------------------------------------------- DIRTY (both directions)

test('DIRTY: an uncommitted change to a file under test is not reported as FRESH', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v1\n', '2026-07-10T12:00:00Z');
  writeCRLF(
    path.join(dir, 'evals/x.md'),
    evalDoc({ files: 'agents/role.md', lastRun: '2026-07-18 · **PASS**' })
  );
  // Edit without committing — `git log` still reports the old date.
  writeCRLF(path.join(dir, 'agents/role.md'), 'v2 uncommitted\n');
  const r = lib.evaluateOne(dir, path.join(dir, 'evals/x.md'), lib.uncommittedPaths(dir));
  assert.strictEqual(r.verdict, 'DIRTY');
  assert.deepStrictEqual(r.dirty, ['agents/role.md']);
});

test('FRESH: a clean tree is NOT reported as dirty', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v1\n', '2026-07-10T12:00:00Z');
  writeCRLF(
    path.join(dir, 'evals/x.md'),
    evalDoc({ files: 'agents/role.md', lastRun: '2026-07-18 · **PASS**' })
  );
  const r = lib.evaluateOne(dir, path.join(dir, 'evals/x.md'), lib.uncommittedPaths(dir));
  assert.strictEqual(r.verdict, 'FRESH');
});

test('STALE outranks DIRTY — a committed later change is the stronger statement', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v1\n', '2026-07-20T12:00:00Z');
  writeCRLF(
    path.join(dir, 'evals/x.md'),
    evalDoc({ files: 'agents/role.md', lastRun: '2026-07-18 · **PASS**' })
  );
  writeCRLF(path.join(dir, 'agents/role.md'), 'v3 uncommitted\n');
  const r = lib.evaluateOne(dir, path.join(dir, 'evals/x.md'), lib.uncommittedPaths(dir));
  assert.strictEqual(r.verdict, 'STALE');
});

// ---------------------------------------------------------------- sha-pinned precision

// The defect this whole harness exists to close, measured 2026-08-02: `runCoversCommit` grants a
// same-day grace so a run and a commit on the same calendar day both read FRESH — right for a
// day-only record, wrong once the record can name the exact commit it graded. These cases prove
// the sha-pinned path is exact where the date-only path is necessarily approximate.

test('STALE: sha-pinned run — a file changed after the pinned commit is flagged, same day or not', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v1\n', '2026-08-02T09:00:00Z');
  const pinnedSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
  // Same calendar day, but strictly after the commit the run was pinned to. A day-precision
  // comparison (runCoversCommit) would call this FRESH — that is exactly what went unreported.
  commit(dir, 'agents/role.md', 'v2\n', '2026-08-02T15:00:00Z');
  writeCRLF(
    path.join(dir, 'evals/x.md'),
    evalDoc({ files: 'agents/role.md', lastRun: `2026-08-02 (at ${pinnedSha.slice(0, 7)}) · **PASS**` })
  );
  const r = lib.evaluateOne(dir, path.join(dir, 'evals/x.md'));
  assert.strictEqual(r.verdict, 'STALE');
  assert.strictEqual(r.precision, 'commit');
  assert.strictEqual(r.changed[0].file, 'agents/role.md');
});

test('FRESH: sha-pinned run — a file unchanged since the pinned commit is not flagged', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v1\n', '2026-07-10T12:00:00Z');
  const pinnedSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
  // History moves on, but not for the file under test — the pinned commit still covers it.
  commit(dir, 'skills/other.md', 'x\n', '2026-07-15T12:00:00Z');
  writeCRLF(
    path.join(dir, 'evals/x.md'),
    evalDoc({ files: 'agents/role.md', lastRun: `2026-07-10 (at ${pinnedSha.slice(0, 7)}) · **PASS**` })
  );
  const r = lib.evaluateOne(dir, path.join(dir, 'evals/x.md'));
  assert.strictEqual(r.verdict, 'FRESH');
  assert.strictEqual(r.precision, 'commit');
});

test('FRESH: a run pinned to the exact commit that touched the file (self-ancestry)', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v1\n', '2026-07-10T12:00:00Z');
  const pinnedSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
  writeCRLF(
    path.join(dir, 'evals/x.md'),
    evalDoc({ files: 'agents/role.md', lastRun: `2026-07-10 (at ${pinnedSha}) · **PASS**` })
  );
  const r = lib.evaluateOne(dir, path.join(dir, 'evals/x.md'));
  assert.strictEqual(r.verdict, 'FRESH');
});

// The fixture this whole change must NOT alter: a record with a date and no sha keeps exactly the
// same-day-grace behavior it has today. This is the regression guard for the 44 existing scenarios.
test('a dateless-sha-less line — a plain date, no `(at …)` — behaves exactly as today', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v1\n', '2026-07-18T08:00:00Z');
  writeCRLF(
    path.join(dir, 'evals/x.md'),
    evalDoc({ files: 'agents/role.md', lastRun: '2026-07-18 · **PASS**' })
  );
  const r = lib.evaluateOne(dir, path.join(dir, 'evals/x.md'));
  assert.strictEqual(r.verdict, 'FRESH', 'same-day grace must still apply with no pinned commit');
  assert.strictEqual(r.precision, 'day');
  assert.strictEqual(r.runSha, null);
});

test('a malformed sha in `Last run:` is ignored, not fatal — falls back to day precision', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v1\n', '2026-07-10T12:00:00Z');
  // Hex-shaped, so it passes parseRunSha's regex, but names no commit in this throwaway repo —
  // exercises resolveCommit's catch path, not just the regex.
  writeCRLF(
    path.join(dir, 'evals/x.md'),
    evalDoc({ files: 'agents/role.md', lastRun: '2026-07-18 (at deadbeef) · **PASS**' })
  );
  const r = lib.evaluateOne(dir, path.join(dir, 'evals/x.md'));
  assert.strictEqual(r.verdict, 'FRESH');
  assert.strictEqual(r.precision, 'day', 'an unresolvable sha must degrade to day precision, not crash');
});

test('a malformed sha does not crash the harness even when it would otherwise be STALE', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v1\n', '2026-07-20T12:00:00Z');
  writeCRLF(
    path.join(dir, 'evals/x.md'),
    evalDoc({ files: 'agents/role.md', lastRun: '2026-07-18 (at deadbeef) · **PASS**' })
  );
  // Same assertion as the plain-date STALE case above — proves the fallback is the full date path,
  // not just "don't throw".
  const r = lib.evaluateOne(dir, path.join(dir, 'evals/x.md'));
  assert.strictEqual(r.verdict, 'STALE');
  assert.strictEqual(r.precision, 'day');
});

test('resolveCommit accepts an abbreviated sha and returns the full one', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v1\n', '2026-07-10T12:00:00Z');
  const full = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
  assert.strictEqual(lib.resolveCommit(dir, full.slice(0, 7)), full);
});

test('resolveCommit returns null for a ref this repo does not know, without throwing', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v1\n', '2026-07-10T12:00:00Z');
  assert.strictEqual(lib.resolveCommit(dir, 'deadbeef'), null);
});

test('isAncestorOrEqual treats a commit as its own ancestor', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v1\n', '2026-07-10T12:00:00Z');
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
  assert.strictEqual(lib.isAncestorOrEqual(dir, sha, sha), true);
});

test('isAncestorOrEqual is false when the "ancestor" commit is actually later', () => {
  const dir = makeRepo();
  commit(dir, 'agents/role.md', 'v1\n', '2026-07-10T12:00:00Z');
  const early = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
  commit(dir, 'agents/role.md', 'v2\n', '2026-07-20T12:00:00Z');
  const late = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
  assert.strictEqual(lib.isAncestorOrEqual(dir, late, early), false);
});

test('scan skips README.md and returns one result per scenario', () => {
  const dir = makeRepo();
  writeCRLF(path.join(dir, 'evals/README.md'), '# not a scenario\n');
  writeCRLF(path.join(dir, 'evals/a.md'), evalDoc({ lastRun: '2026-07-18' }));
  writeCRLF(path.join(dir, 'evals/b.md'), evalDoc({ lastRun: '2026-07-18' }));
  const names = lib.scan(dir, path.join(dir, 'evals')).map((r) => r.name);
  assert.deepStrictEqual(names, ['a', 'b']);
});

test('evals/archived/ is NOT scanned — a retired scenario stays off the board', () => {
  // Retirement (evals/README.md) works today only because `scan` filters on `.md` and a directory
  // is not a `.md` file. That is a side effect, not a decision, and a later reader adding recursion
  // would silently resurrect every retired scenario onto the "did not record a PASS" list — which is
  // exactly the confusion retirement exists to end. This test makes the side effect a contract.
  const dir = makeRepo();
  const evalsDir = path.join(dir, 'evals');
  fs.mkdirSync(path.join(evalsDir, 'archived'), { recursive: true });
  writeCRLF(path.join(evalsDir, 'live.md'), evalDoc({ lastRun: '2026-08-02 · PASS' }));
  writeCRLF(
    path.join(evalsDir, 'archived', 'retired.md'),
    evalDoc({ lastRun: '2026-07-26 · FAIL' })
  );
  const names = lib.scan(dir, evalsDir).map((r) => r.name);
  assert.deepStrictEqual(names, ['live'], 'an archived scenario was scanned back onto the board');
});

console.log(failures === 0 ? '\neval-status: all tests passed' : `\neval-status: ${failures} failing`);
process.exit(failures === 0 ? 0 : 1);

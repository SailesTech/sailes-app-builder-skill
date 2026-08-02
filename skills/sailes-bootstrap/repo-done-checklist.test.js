#!/usr/bin/env node
'use strict';

/**
 * Executable tests for the drift check shipped inside `repo-done-checklist.md`.
 *
 * That check is a shell snippet living in a markdown file, which is exactly why it shipped broken:
 * nothing executes a doc. Its class was `pnpm [a-z:-]+`, so `pnpm test:e2e` truncated to `test:e`
 * and the checklist reported DRIFT on a script that exists. Found 2026-07-26 by an eval that ran
 * the skill end-to-end on a real repo — reading the file had not found it in the months it shipped.
 *
 * The patterns are extracted from the **document itself**, never copied here. A copy would drift
 * from what ships and this test would grade the copy — the same trap the browser probe avoids by
 * reading its probe out of the doc's code block.
 *
 * Added 2026-08-02 (checker asymmetry: two 1.28.0 fixes shipped with no test while a third got
 * nine plus a mutation proof) — F2 and F1 below, same extraction discipline, extended to
 * multi-line control flow: the fragments are pulled out of the doc as literal substrings (no
 * regex re-derivation of the branching) and executed with a real `sh` against real fixtures
 * (a real `git init`, real files on disk). Running the doc's own characters, not a JS
 * reimplementation of what they do, is the only way a control-flow fragment can be tested without
 * the test becoming a second copy of the logic that then rots independently.
 *
 * F1 lives in a DIFFERENT document (`graphify-setup.md`, not `repo-done-checklist.md`). Ideally it
 * would sit in a sibling `graphify-setup.test.js` next to that doc — mirroring the one-doc-one-test
 * pattern `hooks-template.test.js` already uses for its shell templates. It is here instead because
 * this file is the only one this task may touch; the cross-document extraction is a scope artifact
 * of that constraint, not a design endorsement, and is flagged in the phase report as a follow-up
 * file split for the lead to action.
 *
 * Run: node skills/sailes-bootstrap/repo-done-checklist.test.js   (or `npm test`)
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');

const DOC = path.join(__dirname, 'repo-done-checklist.md');
const text = fs.readFileSync(DOC, 'utf8');

// F1's source document — see the file-header note on cross-document extraction above.
const GRAPHIFY_DOC = path.join(__dirname, 'graphify-setup.md');
const graphifyText = fs.readFileSync(GRAPHIFY_DOC, 'utf8');

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

/** The script-name class the doc actually ships, e.g. `pnpm [a-z0-9:-]+`. */
function extractScanPattern() {
  const m = text.match(/grep -oE '(pnpm \[[^\]]+\]\+)'/);
  if (!m) throw new Error('could not find the `grep -oE` drift scan in the doc');
  return m[1];
}

/** The builtin-exclusion alternation the doc ships, e.g. `^(install|add|…)$`. */
function extractExcludePattern() {
  const m = text.match(/grep -vE '\^\(([^)]+)\)\$'/);
  if (!m) throw new Error('could not find the `grep -vE` builtin exclusion in the doc');
  return m[1].split('|');
}

/** POSIX ERE → JS RegExp is 1:1 for these bracket classes. */
function scanner() {
  return new RegExp(extractScanPattern().replace(/^pnpm /, 'pnpm ').replace(/\+$/, '+'), 'g');
}

test('the doc still contains a drift scan to test', () => {
  assert.ok(extractScanPattern().startsWith('pnpm ['), 'scan pattern missing or reshaped');
});

// ---------------------------------------------------------------- must match (the regression)

test('a script name containing a digit survives intact — pnpm test:e2e', () => {
  const got = ('pnpm test:e2e'.match(scanner()) || [])[0];
  assert.strictEqual(
    got,
    'pnpm test:e2e',
    'digits are dropped, so the checklist reports DRIFT on a script that exists'
  );
});

test('other real script shapes survive', () => {
  for (const s of ['pnpm db:seed', 'pnpm check', 'pnpm test:unit', 'pnpm lint', 'pnpm e2e']) {
    assert.strictEqual((s.match(scanner()) || [])[0], s, `truncated: ${s}`);
  }
});

// ---------------------------------------------------------------- must NOT flag (the other direction)

test('pnpm builtins are excluded — they are not package scripts', () => {
  const excluded = extractExcludePattern();
  // `pnpm install` is in the template's own Key Commands; treating it as a missing script
  // makes the check cry wolf on every generated repo.
  assert.ok(excluded.includes('install'), '`install` must be excluded');
  for (const b of ['add', 'exec', 'dlx']) {
    assert.ok(excluded.includes(b), `${b} should be excluded as a pnpm builtin`);
  }
});

test('a real script is NOT swallowed by the builtin exclusion', () => {
  const excluded = extractExcludePattern();
  for (const s of ['test:e2e', 'db:seed', 'check', 'build']) {
    assert.ok(!excluded.includes(s), `"${s}" is a real script and must not be excluded`);
  }
});

// ---------------------------------------------------------------- the fix is load-bearing

test('the pre-2026-07-26 class would fail this suite — the regression is real', () => {
  const old = /pnpm [a-z:-]+/g;
  assert.notStrictEqual(
    ('pnpm test:e2e'.match(old) || [])[0],
    'pnpm test:e2e',
    'if the old class passed, this test proves nothing'
  );
});

// ---------------------------------------------------------------- the verdict must not overclaim

test('the checklist states that a green presence block is not a usable repo', () => {
  assert.ok(
    /green scripted block is not a usable repo/i.test(text),
    'the honesty warning above the Environment block is missing — a presence-only pass can be ' +
      'handed off as a working repo, which is what happened on 2026-07-26'
  );
});

// =================================================================================================
// F2 — core.hooksPath resolution (the graphify hook check, "code map (graphify — Step 4.9)" block)
//
// Pre-fix this hardcoded `.git/hooks/post-commit`, so a husky-managed repo (`core.hooksPath=.husky`)
// reported MISS while its hooks were installed and firing. The fixed fragment resolves
// `git config core.hooksPath` first, handles relative and absolute forms, and distinguishes "hook
// not installed" from "could not determine where hooks live", naming the checked path either way.
//
// This is control flow (if / case / if-elif-else), not one grep pattern, so it is extracted as a
// literal substring of the doc's own bash and run with a real `sh` against a real `git init`
// fixture — never re-typed as a JS if-chain, which would grade a copy instead of the doc.
// =================================================================================================

/** `sh` must exist (Git Bash on Windows, /bin/sh elsewhere). Absent → SKIP, never a fake pass. */
function shAvailable() {
  const probe = spawnSync('sh', ['-c', 'exit 0'], { encoding: 'utf8' });
  return !probe.error;
}
const SH_AVAILABLE = shAvailable();

const toForwardSlash = (p) => p.replace(/\\/g, '/');
const rmTree = (d) => fs.rmSync(d, { recursive: true, force: true });

/** The core.hooksPath resolution + hook-presence fragment, exactly as it ships in the doc. */
function extractHooksResolutionBlock() {
  const startMarker = 'HOOKS_DIR_RAW="$(git -C "$ROOT" config --get core.hooksPath 2>/dev/null)"';
  const endMarker = '\r\nelse\r\n  echo "SKIP graphify';
  const startIdx = text.indexOf(startMarker);
  if (startIdx === -1) {
    throw new Error('could not find the core.hooksPath resolution fragment in repo-done-checklist.md');
  }
  const endIdx = text.indexOf(endMarker, startIdx);
  if (endIdx === -1) {
    throw new Error(
      "could not find the end of the core.hooksPath resolution fragment (the doc's " +
        '`else … SKIP graphify` boundary moved or was reworded)'
    );
  }
  return text.slice(startIdx, endIdx);
}

/** A throwaway git repo — the fragment calls `git config --get core.hooksPath` for real. */
function makeGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-f2-'));
  execFileSync('git', ['-C', dir, 'init', '-q'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return dir;
}

function setHooksPath(dir, value) {
  execFileSync('git', ['-C', dir, 'config', 'core.hooksPath', value], { encoding: 'utf8' });
}

function writeHook(hooksDir) {
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.writeFileSync(path.join(hooksDir, 'post-commit'), '#!/bin/sh\ngraphify update .\n');
}

/** Run the extracted fragment for real, with ROOT pointing at the fixture. */
function runHooksResolution(rootDir) {
  const block = extractHooksResolutionBlock().replace(/\r\n/g, '\n');
  const script = `ROOT="${toForwardSlash(rootDir)}"\n${block}\n`;
  const r = spawnSync('sh', ['-c', script], { encoding: 'utf8' });
  if (r.error) throw r.error;
  return r.stdout.trim();
}

if (!SH_AVAILABLE) {
  console.log('  SKIP F2/F1 shell-fragment tests: no POSIX `sh` on this machine (Git Bash provides one)');
} else {
  test('F2: the doc still contains the core.hooksPath resolution fragment', () => {
    const block = extractHooksResolutionBlock();
    assert.ok(/config --get core\.hooksPath/.test(block), 'git config lookup missing');
    assert.ok(/\[A-Za-z\]:\*/.test(block), 'absolute-path case branch missing');
    assert.ok(/could not determine hooks dir/.test(block), '"could not determine" message missing');
    assert.ok(/hook not installed/.test(block), '"hook not installed" message missing');
  });

  test('F2a: no core.hooksPath, hook at .git/hooks/post-commit -> OK', () => {
    const dir = makeGitRepo();
    try {
      writeHook(path.join(dir, '.git', 'hooks'));
      const out = runHooksResolution(dir);
      assert.strictEqual(out, `OK   freshness hooks (post-commit, ${toForwardSlash(dir)}/.git/hooks)`);
    } finally {
      rmTree(dir);
    }
  });

  test('F2b: core.hooksPath=.husky, hook at .husky/post-commit -> OK (the defect)', () => {
    const dir = makeGitRepo();
    try {
      setHooksPath(dir, '.husky');
      writeHook(path.join(dir, '.husky'));
      const out = runHooksResolution(dir);
      assert.strictEqual(
        out,
        `OK   freshness hooks (post-commit, ${toForwardSlash(dir)}/.husky)`,
        'a husky-managed repo must resolve its real hooks dir, not report MISS on a hardcoded ' +
          '.git/hooks/post-commit that was never going to exist'
      );
    } finally {
      rmTree(dir);
    }
  });

  test('F2c: core.hooksPath=.husky, no hook anywhere -> MISS naming .husky', () => {
    const dir = makeGitRepo();
    try {
      setHooksPath(dir, '.husky');
      fs.mkdirSync(path.join(dir, '.husky'), { recursive: true }); // dir exists, no post-commit in it
      const out = runHooksResolution(dir);
      assert.strictEqual(
        out,
        `MISS graphify hook install (checked ${toForwardSlash(dir)}/.husky/post-commit -- hook not installed)`
      );
    } finally {
      rmTree(dir);
    }
  });

  test('F2d: core.hooksPath points at a directory that does not exist -> the distinct message', () => {
    const dir = makeGitRepo();
    try {
      setHooksPath(dir, 'nope/nowhere');
      const out = runHooksResolution(dir);
      assert.strictEqual(
        out,
        `MISS graphify hook install (could not determine hooks dir -- checked ${toForwardSlash(dir)}/nope/nowhere, directory does not exist)`,
        '"could not determine where hooks live" must read differently from "hook not installed" — ' +
          'they are different failures with different fixes'
      );
    } finally {
      rmTree(dir);
    }
  });

  test('F2e (bonus): core.hooksPath as an absolute path resolves without prefixing ROOT', () => {
    const dir = makeGitRepo();
    const externalHooks = fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-f2-external-hooks-'));
    try {
      writeHook(externalHooks);
      setHooksPath(dir, toForwardSlash(externalHooks));
      const out = runHooksResolution(dir);
      assert.strictEqual(out, `OK   freshness hooks (post-commit, ${toForwardSlash(externalHooks)})`);
    } finally {
      rmTree(dir);
      rmTree(externalHooks);
    }
  });
}

// =================================================================================================
// F1 — the portable `sed` step (graphify-setup.md, the path-normalization block, ~line 41)
//
// Pre-fix this used `sed -i -E`, GNU-only: on BSD/macOS `-i` consumes the next argument as a
// backup suffix, so the step silently leaves an absolute binary path committed. The fix writes to
// a temp file + `mv` and carries a verification grep that must not match after a correct run.
//
// Cross-document note: this block lives in `graphify-setup.md`, not `repo-done-checklist.md` — see
// the file-header comment. Extracted the same way as F2: literal substrings of the doc's own
// bash, executed for real against real fixture files, never retyped as JS string surgery.
// =================================================================================================

/** The sed-normalize for-loop, exactly as it ships (first of the two `for f in ...` loops). */
function extractNormalizeBlock() {
  const marker = 'for f in .claude/settings.json .codex/hooks.json; do';
  const start = graphifyText.indexOf(marker);
  if (start === -1) throw new Error('could not find the graphify path-normalization loop in graphify-setup.md');
  const done = graphifyText.indexOf('done', start);
  if (done === -1) throw new Error('the normalization loop has no closing `done` in graphify-setup.md');
  const block = graphifyText.slice(start, done + 4);
  if (!/sed -E/.test(block)) {
    throw new Error('extraction landed on the wrong loop — expected the `sed -E` normalization step');
  }
  return block;
}

/** The verification for-loop, exactly as it ships (second of the two `for f in ...` loops). */
function extractVerifyBlock() {
  const marker = 'for f in .claude/settings.json .codex/hooks.json; do';
  const first = graphifyText.indexOf(marker);
  const start = graphifyText.indexOf(marker, first + 1);
  if (start === -1) throw new Error('could not find the second (verification) loop in graphify-setup.md');
  const done = graphifyText.indexOf('done', start);
  if (done === -1) throw new Error('the verification loop has no closing `done` in graphify-setup.md');
  const block = graphifyText.slice(start, done + 4);
  if (!/FAILED/.test(block)) {
    throw new Error('extraction landed on the wrong loop — expected the verification step naming FAILED');
  }
  return block;
}

/** A fixture dir with `.claude/` and `.codex/` present, the way the procedure expects. */
function makeNormalizeFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-f1-'));
  fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.codex'), { recursive: true });
  return dir;
}

if (SH_AVAILABLE) {
  test('F1: the doc still contains both the normalize and the verify loops', () => {
    assert.ok(/sed -E/.test(extractNormalizeBlock()), 'normalize loop missing its sed step');
    assert.ok(/graphify-tmp/.test(extractNormalizeBlock()), 'temp-file form is gone — back to in-place sed?');
    assert.ok(/exit 1/.test(extractVerifyBlock()), 'verify loop no longer fails the step on a match');
  });

  test('F1: temp file is a sibling of the target, never a TMPDIR path — the structural cross-device guard', () => {
    // The historical `sed -i` bug isn't the only cross-device failure mode: on Windows `sed -i`
    // can also throw "Invalid cross-device link" when cwd and the target are on different drives.
    // Reproducing that literally requires a sed/OS combination that routes -i's implicit temp file
    // through a different filesystem than the target; GNU sed 4.9 under Git Bash on this machine
    // does not (confirmed empirically: forcing TMPDIR onto a different drive did not move where
    // `sed -i` wrote its temp file — it stayed sibling to the target regardless). So the failure
    // itself could not be constructed on this machine. What IS provable, and is what actually
    // prevents it: the fixed step's temp filename is derived from "$f" itself (`"$f.graphify-tmp"`),
    // so it is always in the same directory as the target file, and `mv` between two paths in the
    // same directory can never cross a filesystem boundary — independent of TMPDIR, cwd, or drive.
    const block = extractNormalizeBlock();
    assert.ok(
      /> "\$f\.graphify-tmp"/.test(block),
      'the temp path must be derived from "$f" (sibling to the target) — anything routed through ' +
        'a separate tmp directory reopens the cross-device failure this step exists to avoid'
    );
  });

  test('F1a: a dirty fixture becomes clean and the verification grep does not match', () => {
    const dir = makeNormalizeFixture();
    try {
      const settingsPath = path.join(dir, '.claude', 'settings.json');
      fs.writeFileSync(settingsPath, '{"hooks":{"post-commit":"C:/Users/x/graphify.exe --update"}}\n');
      const script = `${extractNormalizeBlock().replace(/\r\n/g, '\n')}\n${extractVerifyBlock().replace(/\r\n/g, '\n')}\n`;
      const r = spawnSync('sh', ['-c', script], { cwd: dir, encoding: 'utf8' });
      assert.strictEqual(r.status, 0, `verification step must not fire on a correctly-normalized file; stderr: ${r.stderr}`);
      assert.strictEqual(r.stderr, '');
      assert.strictEqual(
        fs.readFileSync(settingsPath, 'utf8'),
        '{"hooks":{"post-commit":"graphify --update"}}\n'
      );
    } finally {
      rmTree(dir);
    }
  });

  test('F1b: an already-correct fixture is byte-identical afterward (MUST NOT fire)', () => {
    const dir = makeNormalizeFixture();
    try {
      const settingsPath = path.join(dir, '.claude', 'settings.json');
      const original = '{"hooks":{"post-commit":"graphify --update"}}\n';
      fs.writeFileSync(settingsPath, original);
      const before = fs.readFileSync(settingsPath);
      const script = `${extractNormalizeBlock().replace(/\r\n/g, '\n')}\n${extractVerifyBlock().replace(/\r\n/g, '\n')}\n`;
      const r = spawnSync('sh', ['-c', script], { cwd: dir, encoding: 'utf8' });
      assert.strictEqual(r.status, 0, `stderr: ${r.stderr}`);
      const after = fs.readFileSync(settingsPath);
      assert.ok(before.equals(after), 'an already-portable file must not be touched, byte for byte');
    } finally {
      rmTree(dir);
    }
  });

  test('F1c: the verification step fires on a simulated silent no-op', () => {
    // Simulates the normalize step silently failing to act (the BSD `-i` bug's actual shape) by
    // running the verify loop alone against a fixture that still carries the absolute path.
    const dir = makeNormalizeFixture();
    try {
      const settingsPath = path.join(dir, '.claude', 'settings.json');
      fs.writeFileSync(settingsPath, '{"hooks":{"post-commit":"C:/Users/x/graphify.exe --update"}}\n');
      const script = `${extractVerifyBlock().replace(/\r\n/g, '\n')}\n`;
      const r = spawnSync('sh', ['-c', script], { cwd: dir, encoding: 'utf8' });
      assert.strictEqual(r.status, 1, 'a silent no-op must fail the step, not pass it quietly');
      assert.ok(
        /graphify path normalization FAILED in \.claude\/settings\.json/.test(r.stderr),
        `verify must name the file it caught unclean; stderr was: ${r.stderr}`
      );
    } finally {
      rmTree(dir);
    }
  });
}

console.log(
  failures === 0
    ? '\nrepo-done-checklist: all tests passed'
    : `\nrepo-done-checklist: ${failures} failing`
);
process.exit(failures === 0 ? 0 : 1);

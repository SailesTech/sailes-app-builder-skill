#!/usr/bin/env node
'use strict';

/**
 * Regression tests for `validate_toml` in enable-codex-agents.sh.
 *
 * That guard shipped broken: it checked every line against "table header or key = value"
 * with no awareness of multi-line basic strings, so it rejected all seven role files at
 * line 5 — the whole agent prompt lives in a `"""` block. The installer could never run on
 * macOS/Linux, from its first commit until 1.7.1, and nothing caught it.
 *
 * These tests run the ACTUAL shipped awk program, extracted from the script text, so a
 * future edit to the script is what gets graded — not a copy of it that can drift.
 *
 * Run: node codex-agents/validate-toml.test.js   (or `npm test`)
 */

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO = path.join(__dirname, '..');
const SCRIPT = path.join(REPO, 'enable-codex-agents.sh');
const ROLES = ['team-lead', 'explorer', 'designer', 'be-dev', 'fe-dev', 'checker', 'qa'];

let failures = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    failures++;
    console.log(`  FAIL ${name}\n       ${err.message}`);
  }
}

/** Pull the real function out of the shipped script and run it against one file. */
function validate(file) {
  const script = fs.readFileSync(SCRIPT, 'utf8');
  const fn = /^validate_toml\(\) \{[\s\S]*?^\}/m.exec(script);
  assert.ok(fn, 'could not locate validate_toml() in enable-codex-agents.sh');
  // Run through a script FILE, never `bash -c`. When Node (a native Windows process) hands
  // a `-c` string to Git Bash, MSYS doubles the backslashes in it: awk then receives `\\[`
  // where the source says `\[`, the regexes silently stop matching, and every file "passes"
  // with exit 0. That reads as success, so the accept-cases here were green while asserting
  // nothing. Paths get forward slashes for the same family of reasons.
  const posix = file.replace(/\\/g, '/');
  const target = `'${posix.replace(/'/g, `'\\''`)}'`;
  const runner = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-run-')), 'run.sh');
  fs.writeFileSync(runner, `${fn[0]}\nvalidate_toml ${target}\n`);
  try {
    const out = execFileSync('bash', [runner.replace(/\\/g, '/')], { encoding: 'utf8' });
    return { ok: true, message: out.trim() };
  } catch (err) {
    return { ok: false, message: (err.stdout || '').trim() };
  }
}

function fixture(content) {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-toml-')), 'f.toml');
  fs.writeFileSync(f, content);
  return f;
}

console.log('enable-codex-agents.sh :: validate_toml');

// The RED case this whole file exists for.
for (const role of ROLES) {
  test(`accepts the shipped ${role}.toml`, () => {
    const r = validate(path.join(__dirname, `${role}.toml`));
    assert.ok(r.ok, `rejected a role file we ship: ${r.message}`);
  });
}

// Codex writes literal-quoted table keys into config.toml itself (Windows paths contain
// backslashes and a drive colon), so a bare-key-only guard rejects Codex's own config.
test('accepts literal-quoted table keys, as Codex writes them', () => {
  const f = fixture(
    [
      'model = "gpt-5.6-terra"',
      "[projects.'C:\\Users\\Jacek']",
      'trust_level = "trusted"',
      '',
      '[projects."E:\\Work\\repo"]',
      'trust_level = "trusted"',
    ].join('\n')
  );
  const r = validate(f);
  assert.ok(r.ok, `rejected a valid Codex config: ${r.message}`);
});

test('accepts a single-line array value', () => {
  const r = validate(fixture('notify = [ "a.exe", "turn-ended" ]\n'));
  assert.ok(r.ok, r.message);
});

// A guard that accepts everything is not a guard. Each of these must still be caught,
// or the multi-line fix would have been "make validate_toml always return success".
test('still rejects a malformed assignment', () => {
  const r = validate(fixture('name = "ok"\nthis is not toml at all\n'));
  assert.ok(!r.ok, 'accepted a line that is neither table nor key/value');
  assert.match(r.message, /line 2/);
});

test('still rejects a malformed table header', () => {
  const r = validate(fixture('[agents..team-lead]\nname = "x"\n'));
  assert.ok(!r.ok, 'accepted a malformed table header');
});

test('still rejects prose outside a multiline string', () => {
  const r = validate(fixture('a = """\nprose inside is fine\n"""\nprose outside is not\n'));
  assert.ok(!r.ok, 'accepted prose after the multiline string closed');
  assert.match(r.message, /line 4/);
});

test('rejects an unterminated multiline string', () => {
  const r = validate(fixture('a = """\nopened and never closed\n'));
  assert.ok(!r.ok, 'accepted an unterminated multiline string');
  assert.match(r.message, /unterminated/);
});

test('rejects a multiline opener that is not an assignment', () => {
  const r = validate(fixture('"""\nno key in front of it\n"""\n'));
  assert.ok(!r.ok, 'accepted a multiline block with no key = in front');
});

if (failures) {
  console.log(`\n${failures} failing`);
  process.exit(1);
}
console.log('\nall passing');

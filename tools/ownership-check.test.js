#!/usr/bin/env node
'use strict';

/**
 * Tests for tools/ownership-check.js — the mechanism that turns a plan's file-ownership matrix
 * from a prose table nobody compares into a set intersection somebody runs.
 *
 * Why it exists. Measured 2026-08-01: a plan drew `F1 → F2 → {F3,…}`, called F2 "solitary" twenty
 * lines above its own ownership table, and that table already showed F2 and F3 were disjoint —
 * F3's own brief even listed F2's file as forbidden. Nobody ran the comparison because a prose
 * table isn't something you run; F3 idled behind six other phases for a dependency that never
 * existed. What is under test is therefore not "does the tool read the yaml" but: **does sharing
 * a single path between two tasks reliably turn red, and does staying disjoint reliably stay
 * green** — the fixture pair at the top of each section is the point, not decoration.
 *
 * Driven the way a gate would drive it: a real plan-shaped file on disk, argv in, exit code +
 * stdout/stderr out.
 *
 * Second section (spec 1.35.0 P2) drives `--spec` mode the same way: a real spec-shaped file on
 * disk (`## Fazy` with `### P<n> — …` phases carrying `Owns:` tables, `## Plan wykonania` with the
 * wave table), argv in, exit code + stdout/stderr out. The fixtures model the same incident this
 * whole tool exists for, moved one level up: a spec's own `## Plan wykonania` claiming two fale
 * are needed when the file sets say one would do, or two phases sharing a file inside the *same*
 * fala where sharing across different fale is fine.
 *
 * Run: node tools/ownership-check.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CHECK = path.join(__dirname, 'ownership-check.js');
const REPO_ROOT = path.resolve(__dirname, '..');

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

const rm = (d) => fs.rmSync(d, { recursive: true, force: true });

function tmpPlan(body) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-ownership-'));
  const file = path.join(dir, '2026-08-02-fixture-plan.md');
  fs.writeFileSync(file, body);
  return { dir, file };
}

function tmpSpec(body) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-ownership-spec-'));
  const file = path.join(dir, '2026-09-16-fixture-spec.md');
  fs.writeFileSync(file, body);
  return { dir, file };
}

function run(file) {
  return spawnSync(process.execPath, [CHECK, file], { encoding: 'utf8' });
}

function runSpec(file) {
  return spawnSync(process.execPath, [CHECK, '--spec', file], { encoding: 'utf8' });
}

const plan = (yamlBody) =>
  `# Run log — fixture\n\nSome narrative prose that must never be parsed as yaml.\n\n` +
  '```yaml\n' + yamlBody + '```\n\nMore prose after the block.\n';

// -------------------------------------------------------------- disjoint (MUST NOT fire)

test('disjoint ownership across three tasks -> exit 0, no conflicts reported', () => {
  const { dir, file } = tmpPlan(
    plan(
      'ownership:\n' +
        '  F1:\n' +
        '    - skills/sailes-bootstrap/delegation-threshold.md\n' +
        '    - tools/sync-blocks.js\n' +
        '  F2:\n' +
        '    - skills/sailes-bootstrap/hooks-template/brief-closure.js\n' +
        '  F3:\n' +
        '    - tools/ownership-check.js\n' +
        '    - skills/sailes-implement/SKILL.md\n'
    )
  );
  try {
    const r = run(file);
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    assert.ok(/disjoint/.test(r.stdout), 'exit 0 did not explain why (no "disjoint" in stdout)');
  } finally {
    rm(dir);
  }
});

// -------------------------------------------------------------- conflict (MUST fire)

test('two tasks sharing one path -> exit 1, names the path and BOTH tasks', () => {
  // This is the fixture that models the actual 2026-08-01 incident: F2 and F3 disjoint in the
  // table, but here made to collide on purpose to prove the check catches it when it happens.
  const { dir, file } = tmpPlan(
    plan(
      'ownership:\n' +
        '  F2:\n' +
        '    - skills/sailes-bootstrap/hooks-template/brief-closure.js\n' +
        '  F3:\n' +
        '    - skills/sailes-bootstrap/hooks-template/brief-closure.js\n' +
        '    - tools/ownership-check.js\n'
    )
  );
  try {
    const r = run(file);
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    const out = r.stdout + r.stderr;
    assert.ok(
      /skills\/sailes-bootstrap\/hooks-template\/brief-closure\.js/.test(out),
      'the shared path is not named in the output'
    );
    assert.ok(/F2/.test(out), 'task F2 is not named as a co-owner');
    assert.ok(/F3/.test(out), 'task F3 is not named as a co-owner');
  } finally {
    rm(dir);
  }
});

test('three tasks sharing one path -> exit 1, all three named', () => {
  const { dir, file } = tmpPlan(
    plan(
      'ownership:\n' +
        '  A:\n' +
        '    - shared/file.md\n' +
        '  B:\n' +
        '    - shared/file.md\n' +
        '  C:\n' +
        '    - shared/file.md\n'
    )
  );
  try {
    const r = run(file);
    assert.strictEqual(r.status, 1);
    const out = r.stdout + r.stderr;
    for (const id of ['A', 'B', 'C']) {
      assert.ok(new RegExp(`\\b${id}\\b`).test(out), `task ${id} missing from the conflict report`);
    }
  } finally {
    rm(dir);
  }
});

test('a path shared only via a backslash/forward-slash spelling difference is still caught', () => {
  const { dir, file } = tmpPlan(
    plan('ownership:\n' + '  A:\n' + '    - tools\\shared.js\n' + '  B:\n' + '    - tools/shared.js\n')
  );
  try {
    const r = run(file);
    assert.strictEqual(r.status, 1, 'a Windows-spelled path and a POSIX-spelled path for the same file were not recognized as the same path');
  } finally {
    rm(dir);
  }
});

// -------------------------------------------------------------- absence (must be loud, not silent)

test('no ownership: block at all -> exit 0, but the note is on stdout, never silent', () => {
  const { dir, file } = tmpPlan(
    '# Run log — fixture\n\nNo yaml block anywhere in this plan.\n'
  );
  try {
    const r = run(file);
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}`);
    assert.ok(r.stdout.trim().length > 0, 'a plan with no ownership: block produced no stdout at all — that is the silent case the contract forbids');
    assert.ok(/ownership/.test(r.stdout), 'the note does not even mention "ownership"');
  } finally {
    rm(dir);
  }
});

test('a yaml block that is present but has no ownership: key -> exit 0 with the same loud note', () => {
  const { dir, file } = tmpPlan(plan('other_key: value\n'));
  try {
    const r = run(file);
    assert.strictEqual(r.status, 0);
    assert.ok(r.stdout.trim().length > 0, 'silent on a yaml block with no ownership: key');
  } finally {
    rm(dir);
  }
});

// -------------------------------------------------------------- malformed (reject loudly)

test('a task with zero paths -> exit 1, names the task', () => {
  const { dir, file } = tmpPlan(plan('ownership:\n' + '  F1:\n' + '  F2:\n' + '    - some/path\n'));
  try {
    const r = run(file);
    assert.strictEqual(r.status, 1, 'a task claiming zero paths was silently accepted');
    assert.ok(/F1/.test(r.stdout + r.stderr), 'the empty task is not named in the error');
  } finally {
    rm(dir);
  }
});

test('a duplicate task id -> exit 1, names the id', () => {
  const { dir, file } = tmpPlan(
    plan('ownership:\n' + '  F1:\n' + '    - a\n' + '  F1:\n' + '    - b\n')
  );
  try {
    const r = run(file);
    assert.strictEqual(r.status, 1, 'a duplicated task id in one ownership: block was silently accepted');
    assert.ok(/duplicate/i.test(r.stdout + r.stderr), 'the duplicate-id error does not say "duplicate"');
  } finally {
    rm(dir);
  }
});

test('a path item with no owning task above it -> exit 1', () => {
  const { dir, file } = tmpPlan(plan('ownership:\n' + '    - orphan/path\n'));
  try {
    const r = run(file);
    assert.strictEqual(r.status, 1, 'a "- path" line with no "  taskId:" above it was silently accepted');
  } finally {
    rm(dir);
  }
});

test('a garbage line inside the block -> exit 1, not treated as an empty ownership map', () => {
  const { dir, file } = tmpPlan(plan('ownership:\n' + '  F1:\n' + 'not indented at all but not a new key either: yes\n'));
  // This line is at column 0, so per the grammar it legitimately ENDS the mapping (sibling yaml
  // key) — F1 is then left with zero paths, which is its own malformed case. Covered separately
  // above; this fixture instead targets a line that is indented but matches neither shape.
  try {
    const r = run(file);
    assert.strictEqual(r.status, 1);
  } finally {
    rm(dir);
  }
});

test('a mis-indented line (3 spaces, neither task nor path shape) -> exit 1, not silently skipped', () => {
  const { dir, file } = tmpPlan(plan('ownership:\n' + '  F1:\n' + '   - three-space path\n' + '    - real/path\n'));
  try {
    const r = run(file);
    assert.strictEqual(r.status, 1, 'a 3-space-indented line was silently ignored instead of rejected');
  } finally {
    rm(dir);
  }
});

// -------------------------------------------------------------- CLI plumbing

test('missing plan file -> exit 1, names the file', () => {
  const r = run(path.join(os.tmpdir(), 'sailes-ownership-does-not-exist-2026.md'));
  assert.strictEqual(r.status, 1);
  assert.ok(/does-not-exist/.test(r.stdout + r.stderr));
});

test('no argument at all -> exit 1, usage message', () => {
  const r = spawnSync(process.execPath, [CHECK], { encoding: 'utf8' });
  assert.strictEqual(r.status, 1);
  assert.ok(/usage/i.test(r.stdout + r.stderr));
});

test('prose ownership tables outside a yaml fence are never parsed', () => {
  // A markdown table using the word "ownership" must not be mistaken for the machine artifact —
  // only a fenced ```yaml block with a literal ownership: key counts.
  const { dir, file } = tmpPlan(
    '# Run log\n\n## File ownership\n\n| Task | Path |\n|---|---|\n| F1 | a.js |\n| F2 | a.js |\n'
  );
  try {
    const r = run(file);
    assert.strictEqual(r.status, 0, 'a prose table was treated as a machine ownership: block');
  } finally {
    rm(dir);
  }
});

// ================================================================================================
// --spec mode (spec 1.35.0 P2)
// ================================================================================================

/** Builds a minimal spec-shaped fixture: `## Plan wykonania` + `## Fazy`, in that order (matching
 *  the real spec, where the wave table comes before the phase bodies). `phases` is
 *  `[{ id, title, owns: [path,...] }]`; `waveRows` is `[{ num, fazy: [id,...], blokuje: 'nie'|'tak'|'P0: tak' }]`. */
function specFixture(phases, waveRows) {
  let out = '## Plan wykonania\n\n| Fala | Fazy | Równolegle | Blokuje lidera | Workflow |\n|---|---|---|---|---|\n';
  for (const w of waveRows) {
    out += `| ${w.num} | ${w.fazy.join(' · ')} | tak | ${w.blokuje} | WF2 |\n`;
  }
  out += '\n## Fazy\n\n';
  for (const p of phases) {
    out += `### ${p.id} — ${p.title}\n\n`;
    if (p.owns) {
      out += 'Owns:\n| Plik | Wymuszony przez |\n|---|---|\n';
      for (const f of p.owns) out += `| \`${f}\` | ${p.id}.1 |\n`;
      out += '\n';
    }
    out += `Some narrative prose for ${p.id}.\n\n`;
  }
  return out;
}

// ---------------------------------------------------------- P2.1 reads Owns + Plan wykonania

test('--spec: reads Owns and Plan wykonania, disjoint fale -> exit 0', () => {
  const body = specFixture(
    [
      { id: 'P0', title: 'first', owns: ['tools/a.js'] },
      { id: 'P1', title: 'second', owns: ['tools/b.js'] },
    ],
    [{ num: 1, fazy: ['P0', 'P1'], blokuje: 'nie' }]
  );
  const { dir, file } = tmpSpec(body);
  try {
    const r = runSpec(file);
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    assert.ok(/2 faz/.test(r.stdout), 'phase count missing from stdout');
    assert.ok(/1 fal/.test(r.stdout), 'fala count missing from stdout');
  } finally {
    rm(dir);
  }
});

// ---------------------------------------------------------- P2.2 same-fala vs different-fala

test('--spec: two phases sharing a path in DIFFERENT fale -> exit 0 (not a conflict)', () => {
  const body = specFixture(
    [
      { id: 'P0', title: 'first', owns: ['shared/file.md'] },
      { id: 'P1', title: 'second', owns: ['shared/file.md'] },
    ],
    [
      { num: 1, fazy: ['P0'], blokuje: 'nie' },
      { num: 2, fazy: ['P1'], blokuje: 'nie' },
    ]
  );
  const { dir, file } = tmpSpec(body);
  try {
    const r = runSpec(file);
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  } finally {
    rm(dir);
  }
});

test('--spec: two phases sharing a path in the SAME fala -> exit 1, names path, fala, both phases', () => {
  const body = specFixture(
    [
      { id: 'P0', title: 'first', owns: ['shared/file.md'] },
      { id: 'P1', title: 'second', owns: ['shared/file.md'] },
    ],
    [{ num: 1, fazy: ['P0', 'P1'], blokuje: 'nie' }]
  );
  const { dir, file } = tmpSpec(body);
  try {
    const r = runSpec(file);
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    const out = r.stdout + r.stderr;
    assert.ok(/shared\/file\.md/.test(out), 'the shared path is not named');
    assert.ok(/\bP0\b/.test(out) && /\bP1\b/.test(out), 'both phases are not named');
    assert.ok(/fala 1/.test(out), 'the fala number is not named');
  } finally {
    rm(dir);
  }
});

// ---------------------------------------------------------- P2.3 excessive serialization

test('--spec: two fully disjoint phases declared as two fale -> exit 1, excessive serialization, names both numbers', () => {
  const body = specFixture(
    [
      { id: 'P0', title: 'first', owns: ['tools/a.js'] },
      { id: 'P1', title: 'second', owns: ['tools/b.js'] },
    ],
    [
      { num: 1, fazy: ['P0'], blokuje: 'nie' },
      { num: 2, fazy: ['P1'], blokuje: 'nie' },
    ]
  );
  const { dir, file } = tmpSpec(body);
  try {
    const r = runSpec(file);
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    const out = r.stdout + r.stderr;
    assert.ok(/excessive serialization/i.test(out), 'the failure does not say "excessive serialization"');
    assert.ok(/\b1\b/.test(out) && /\b2\b/.test(out), 'the two wave counts (computed vs declared) are not both named');
  } finally {
    rm(dir);
  }
});

test('--spec: a "blokuje lidera" phase pins its fala, so a disjoint neighbor is NOT flagged -> exit 0, reports the exclusion', () => {
  // This spec's own worked case, minimized: a lead-blocking phase (P0) shares its fala with a
  // non-blocking phase (P1); a later, file-disjoint phase (P2) sits in its own fala. Excessive-
  // serialization must not fire here, because P0 pins fala 1 as a synchronization boundary — the
  // exact false positive the old F1.3 design named and the reason the exclusion exists at all.
  const body = specFixture(
    [
      { id: 'P0', title: 'blocks the lead', owns: ['tools/a.js'] },
      { id: 'P1', title: 'runs alongside P0', owns: ['tools/b.js'] },
      { id: 'P2', title: 'runs after the STOP', owns: ['tools/c.js'] },
    ],
    [
      { num: 1, fazy: ['P0', 'P1'], blokuje: '**P0: tak** — human reviews a result' },
      { num: 2, fazy: ['P2'], blokuje: 'nie' },
    ]
  );
  const { dir, file } = tmpSpec(body);
  try {
    const r = runSpec(file);
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    assert.ok(/P0/.test(r.stdout), 'the excluded phase is not named in the exclusion report');
    assert.ok(/blok/i.test(r.stdout), 'stdout does not report the exclusion at all');
  } finally {
    rm(dir);
  }
});

test('--spec: a lone blocking phase (bare "tak", one-phase fala) is recognized and excluded -> exit 0', () => {
  const body = specFixture(
    [
      { id: 'P0', title: 'first', owns: ['tools/a.js'] },
      { id: 'P1', title: 'second', owns: ['tools/b.js'] },
      { id: 'P2', title: 'release', owns: ['VERSION'] },
    ],
    [
      { num: 1, fazy: ['P0', 'P1'], blokuje: 'nie' },
      { num: 2, fazy: ['P2'], blokuje: '**tak** — receipt shown to the human' },
    ]
  );
  const { dir, file } = tmpSpec(body);
  try {
    const r = runSpec(file);
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    assert.ok(/P2/.test(r.stdout), 'the excluded lone phase P2 is not named in the exclusion report');
  } finally {
    rm(dir);
  }
});

// ---------------------------------------------------------- P2.4 spec without Owns is loud

test('--spec: "## Fazy" present but a phase has no "Owns:" table -> exit 1, names the phase', () => {
  const body = specFixture(
    [
      { id: 'P0', title: 'has owns', owns: ['tools/a.js'] },
      { id: 'P1', title: 'missing owns' /* no owns key at all */ },
    ],
    [{ num: 1, fazy: ['P0', 'P1'], blokuje: 'nie' }]
  );
  const { dir, file } = tmpSpec(body);
  try {
    const r = runSpec(file);
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    assert.ok(/P1/.test(r.stdout + r.stderr), 'the phase missing Owns: is not named in the error');
  } finally {
    rm(dir);
  }
});

test('--spec: a file with no "## Fazy" section at all -> exit 1', () => {
  const { dir, file } = tmpSpec('# Not a spec\n\nJust prose, no phases anywhere.\n');
  try {
    const r = runSpec(file);
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
  } finally {
    rm(dir);
  }
});

// ---------------------------------------------------------- CLI plumbing for --spec

test('--spec with no file argument -> exit 1, usage message', () => {
  const r = spawnSync(process.execPath, [CHECK, '--spec'], { encoding: 'utf8' });
  assert.strictEqual(r.status, 1);
  assert.ok(/usage/i.test(r.stdout + r.stderr));
});

test('--spec on a missing file -> exit 1, names the file', () => {
  const r = runSpec(path.join(os.tmpdir(), 'sailes-ownership-spec-does-not-exist-2026.md'));
  assert.strictEqual(r.status, 1);
  assert.ok(/does-not-exist/.test(r.stdout + r.stderr));
});

// ---------------------------------------------------------- real artifact (not a fixture)

test('--spec on this repo\'s own spec 1.35.0 -> exit 0, 8 phases, 3 fale, P0 and P6 excluded', () => {
  const specPath = path.join(REPO_ROOT, '.ai', 'specs', '2026-09-16-workflow-first-orchestration.md');
  const r = runSpec(specPath);
  assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  assert.ok(/8 faz/.test(r.stdout), `expected 8 phases in stdout, got: ${r.stdout}`);
  assert.ok(/3 fal/.test(r.stdout), `expected 3 fale in stdout, got: ${r.stdout}`);
  assert.ok(/\bP0\b/.test(r.stdout) && /\bP6\b/.test(r.stdout), `expected P0 and P6 named as excluded, got: ${r.stdout}`);
});

console.log(failures === 0 ? '\nownership-check: all tests passed' : `\nownership-check: ${failures} failing`);
process.exitCode = failures === 0 ? 0 : 1;

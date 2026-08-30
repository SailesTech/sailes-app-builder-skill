#!/usr/bin/env node
'use strict';
/**
 * Fault-injection harness for the A/B.
 *
 * Volume is easy to measure and says nothing on its own: a suite that is half the size and
 * catches half the faults is not an improvement, it is a smaller version of the same mistake.
 * So each arm's suite is run against the same eight single-line faults and scored on how many
 * it kills. `node run-mutants.js <arm-test-file>` prints the baseline plus one line per mutant.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HERE = __dirname;
const SRC = fs.readFileSync(path.join(HERE, 'validate.js'), 'utf8');
const MUTANTS = JSON.parse(fs.readFileSync(path.join(HERE, 'mutants.json'), 'utf8'));

const testFile = process.argv[2];
if (!testFile) { console.error('usage: node run-mutants.js <arm-test-file>'); process.exit(2); }
const TEST = fs.readFileSync(testFile, 'utf8');

function runSuite(source) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mut-'));
  try {
    fs.writeFileSync(path.join(dir, 'validate.js'), source);
    fs.writeFileSync(path.join(dir, 'suite.test.js'), TEST);
    const r = spawnSync(process.execPath, ['--test', 'suite.test.js'],
      { cwd: dir, encoding: 'utf8', timeout: 60000 });
    return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const base = runSuite(SRC);
const cases = (base.out.match(/tests (\d+)/) || [, '?'])[1];
console.log(`BASELINE  ${base.code === 0 ? 'GREEN' : 'RED (suite is broken before any mutant)'}  · ${cases} test cases`);
if (base.code !== 0) {
  console.log(base.out.split('\n').filter((l) => /not ok|Error/.test(l)).slice(0, 8).join('\n'));
  process.exit(1);
}

let killed = 0;
for (const m of MUTANTS) {
  if (!SRC.includes(m.from)) { console.log(`  ?? ${m.id} — mutant does not apply (pattern absent)`); continue; }
  const r = runSuite(SRC.replace(m.from, m.to));
  const isKilled = r.code !== 0;
  if (isKilled) killed++;
  console.log(`  ${isKilled ? 'KILLED  ' : 'SURVIVED'} ${m.id.padEnd(20)} ${m.rule}`);
}
console.log(`\nSCORE ${killed}/${MUTANTS.length} faults detected · ${cases} test cases · ${TEST.split('\n').length} lines of test code`);

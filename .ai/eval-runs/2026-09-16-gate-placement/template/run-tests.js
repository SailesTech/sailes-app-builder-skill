'use strict';
// Runs every *.test.js in this directory; exits non-zero if any fails.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.test.js')).sort();
let failed = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { encoding: 'utf8' });
  process.stdout.write(`--- ${f} (exit ${r.status})\n${r.stdout}${r.stderr}`);
  if (r.status !== 0) failed++;
}
console.log(`${files.length} test file(s), ${failed} failed`);
process.exit(failed ? 1 : 0);

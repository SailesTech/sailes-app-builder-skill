// Hidden acceptance test for P0.4 A/B. Usage: node p04-acceptance.js <path/to/duration.js>
const assert = require('assert');
const { parseDuration } = require(require('path').resolve(process.argv[2]));
const cases = [];
const ok = (name, input, expected) => cases.push([name, () => assert.strictEqual(parseDuration(input), expected)]);
const bad = (name, input, Err) => cases.push([name, () => assert.throws(() => parseDuration(input), (e) => e instanceof Err && e.constructor === Err)]);

ok('1h30m', '1h30m', 5400000);
ok('500ms', '500ms', 500);
ok('2d', '2d', 172800000);
ok('1m1s1ms', '1m1s1ms', 61001);
ok('full order', '1d2h3m4s5ms', 93784005);
ok('trim', '  45s\t', 45000);
ok('zero', '0s', 0);
ok('ms after m (not m+s)', '1m5ms', 60005);
bad('duplicate unit', '1s2s', RangeError);
bad('wrong order', '1s1m', RangeError);
bad('ms before s', '1ms1s', RangeError);
bad('empty', '', TypeError);
bad('whitespace', '   ', TypeError);
bad('non-string', 42, TypeError);
bad('null', null, TypeError);
bad('unknown unit', '5w', TypeError);
bad('missing number', 'h', TypeError);
bad('decimal', '1.5h', TypeError);
bad('negative', '-1h', TypeError);
bad('uppercase unit', '1H', TypeError);
bad('separator', '1h 30m', TypeError);
bad('trailing garbage', '1hx', TypeError);

let pass = 0;
const failed = [];
for (const [name, fn] of cases) {
  try { fn(); pass++; } catch (e) { failed.push(`${name}: ${e.message.split('\n')[0]}`); }
}
console.log(JSON.stringify({ pass, total: cases.length, failed }));
process.exit(failed.length ? 1 : 0);

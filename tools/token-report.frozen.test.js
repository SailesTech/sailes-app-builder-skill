#!/usr/bin/env node
'use strict';

/**
 * FROZEN suite for `tools/token-report.js` — spec `.ai/specs/2026-09-12-token-cost-of-running.md`,
 * phase P0. One test per ID from `.ai/test-plans/2026-09-12-token-cost-P0.md` (FROZEN 2026-09-12,
 * human), ID in the test name. Written from that frozen list with the implementation UNREAD (it
 * does not exist on this branch yet — every test below is expected to fail for that reason until
 * the lead integrates an implementation into this base; see the plan's "Detection proof" section).
 *
 * Do NOT edit `tools/token-report.test.js`, `tools/token-report.js`,
 * `tools/fixtures/token-report/`, or `package.json` from this file or its fixtures — those belong
 * to the implementer / the lead. This file owns `tools/token-report.frozen.test.js` and
 * `tools/fixtures/token-report-frozen/` only.
 *
 * Driven as a CLI, the way `qa` and every other `tools/*.test.js` in this repo drives its subject:
 * `node tools/token-report.js <dir> [--since D] [--until D] [--json]`, asserting on stdout/stderr/
 * exit code only — never on internals.
 *
 * ---------------------------------------------------------------------------------------------
 * `--json` OUTPUT SHAPE — adopted from the implementation by human decision 2026-09-12. The spec
 * never named a JSON schema; this suite originally pinned its own (documented here until that
 * date), and once the real tool landed with different key names the human's ruling was: the
 * *suite* adopts the tool's names, changing only property paths — never an expected value, a
 * fixture, or the number of assertions. That merge left exactly 3 genuine defects red (P0-09,
 * P0-10, P0-34 — tracked separately, not by renaming anything here).
 *
 *   {
 *     dateFilter: { sinceMs, untilMs, basis },
 *     lead:       { transcriptCount, contextTokensTotal,
 *                   turns: { p50, max }, firstTurnContext: { p50, p90 },
 *                   peakContext: { p50, max }, top10PercentShare },
 *     subagents:  { ...same shape as lead... },
 *     subagentsByRole: { "<bare-role>": { n, turns: { p50, p90, max }, contextTokensTotal },
 *                        "unknown": { n, turns, contextTokensTotal } },
 *     spawns:     { total, unprefixedTotal, unprefixedByName: { "<name>": count, ... } },
 *     malformedLines: <int>
 *   }
 *
 * Role bucketing (Q1, resolved 2026-09-12): a subagent's role comes from its sibling
 * `agent-<id>.meta.json`'s `agentType` key, with any `sailes-app-builder:` prefix stripped before
 * bucketing; missing/unparsable `.meta.json` -> bucket `unknown` under `subagentsByRole`.
 * top10PercentShare is a fraction in [0, 1], count = ceil(n * 0.1), minimum 1 (Q6).
 * `--since D` / `--until D` filter by file mtime, half-open `[D 00:00 local, ...)` /
 * `[..., D 00:00 local)` (Q3).
 *
 * Run: node tools/token-report.frozen.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const BIN = path.join(__dirname, 'token-report.js');
const FIXTURES = path.join(__dirname, 'fixtures', 'token-report-frozen');

let failures = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    failures++;
    console.error(`  FAIL ${name}`);
    console.error(`       ${(err && err.stack) || err}`);
  }
}

function rm(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

/** Copies a static fixture directory into a fresh temp dir the tool can be pointed at. */
function useFixture(name) {
  const src = path.join(FIXTURES, name);
  const dst = fs.mkdtempSync(path.join(os.tmpdir(), `token-report-frozen-${name}-`));
  fs.cpSync(src, dst, { recursive: true });
  return dst;
}

function emptyTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'token-report-frozen-empty-'));
}

/** Sets a file's mtime to local midnight of `YYYY-MM-DD`. */
function setMtimeLocalMidnight(filePath, isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const when = new Date(y, m - 1, d, 0, 0, 0, 0);
  fs.utimesSync(filePath, when, when);
}

function run(dir, args = []) {
  const full = dir === null ? [BIN, ...args] : [BIN, dir, ...args];
  return spawnSync(process.execPath, full, { encoding: 'utf8' });
}

function runJson(dir, args = []) {
  const res = run(dir, [...args, '--json']);
  let json = null;
  try {
    json = JSON.parse(res.stdout);
  } catch (e) {
    // left null; callers assert on res directly when this matters
  }
  return { ...res, json };
}

function assertFinite(value, msg) {
  assert.strictEqual(typeof value, 'number', `${msg}: expected a number, got ${typeof value}`);
  assert.ok(Number.isFinite(value), `${msg}: expected finite, got ${value}`);
}

function sumPerRole(perRole) {
  return Object.values(perRole || {}).reduce((acc, r) => acc + (r.contextTokensTotal || 0), 0);
}

// =================================================================================================
// P0-01 .. P0-36 — one test per frozen ID.
// =================================================================================================

test('P0-01 — empty transcript directory reports all-zero, no crash, no NaN/Infinity', () => {
  const dir = useFixture('empty-dir');
  try {
    const { status, json, stdout, stderr } = runJson(dir);
    assert.strictEqual(status, 0, `expected exit 0, stderr: ${stderr}`);
    assert.ok(json, `expected parseable --json output, got: ${stdout}`);
    assert.strictEqual(json.lead.transcriptCount, 0);
    assert.strictEqual(json.subagents.transcriptCount, 0);
    assertFinite(json.lead.contextTokensTotal, 'lead.contextTokensTotal');
    assert.strictEqual(json.lead.contextTokensTotal, 0);
    assertFinite(json.subagents.contextTokensTotal, 'subagents.contextTokensTotal');
    assert.strictEqual(json.subagents.contextTokensTotal, 0);
    assertFinite(json.lead.top10PercentShare, 'lead.top10PercentShare');

    const { status: textStatus, stdout: text } = run(dir);
    assert.strictEqual(textStatus, 0);
    assert.ok(!/NaN|Infinity/.test(text), `default output leaked NaN/Infinity: ${text}`);
  } finally {
    rm(dir);
  }
});

test('P0-02 — nonexistent directory path exits non-zero with a clear stderr, distinct from empty-dir', () => {
  const parent = emptyTempDir();
  const missing = path.join(parent, 'does-not-exist');
  try {
    const { status, stderr } = run(missing);
    assert.notStrictEqual(status, 0, 'expected a non-zero exit for a missing directory');
    assert.ok(stderr && stderr.trim().length > 0, 'expected a non-empty stderr message');
  } finally {
    rm(parent);
  }
});

test('P0-03 — missing positional directory argument prints usage and exits non-zero', () => {
  const { status, stdout, stderr } = run(null, []);
  assert.notStrictEqual(status, 0, 'expected a non-zero exit with no directory argument');
  const combined = `${stdout}\n${stderr}`;
  assert.ok(combined.trim().length > 0, 'expected some usage/help output');
  assert.ok(!/at Object\.<anonymous>/.test(combined), 'expected usage text, not a raw stack trace');
});

test('P0-04 — lead session with no subagents/ directory at all does not crash', () => {
  const dir = useFixture('no-subagents-dir');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.contextTokensTotal, 2500);
    assert.strictEqual(json.subagents.transcriptCount, 0);
    assert.strictEqual(json.subagents.contextTokensTotal, 0);
  } finally {
    rm(dir);
  }
});

test('P0-05 — orphaned subagent group (no parent <session>.jsonl) still counts, no crash', () => {
  const dir = useFixture('orphan-subagent');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.transcriptCount, 0);
    assert.strictEqual(json.subagents.transcriptCount, 1);
    assert.strictEqual(json.subagents.contextTokensTotal, 1800);
  } finally {
    rm(dir);
  }
});

test('P0-06 — split message (usage on line 1, tool_use on a duplicate message.id line 2): usage once, spawn counted', () => {
  const dir = useFixture('split-message');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.contextTokensTotal, 9000, 'usage must be counted once, not skipped, not doubled');
    assert.strictEqual(json.spawns.unprefixedByName['be-dev'], 1, 'tool_use on the duplicate-id line must still be collected (2026-09-12 regression: 10 vs 177)');
  } finally {
    rm(dir);
  }
});

test('P0-07 — repeated usage on the same message.id counted once, not twice', () => {
  const dir = useFixture('repeated-usage');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.contextTokensTotal, 6000);
  } finally {
    rm(dir);
  }
});

test('P0-08 — two distinct message.ids with distinct usage are both counted', () => {
  const dir = useFixture('distinct-messages');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.contextTokensTotal, 30000);
    assert.strictEqual(json.lead.turns.max, 2);
  } finally {
    rm(dir);
  }
});

test('P0-09 — an assistant message with no usage field contributes 0, not NaN, still counts as a turn', () => {
  const dir = useFixture('no-usage-field');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.contextTokensTotal, 5000);
    assert.strictEqual(json.lead.turns.max, 2);
  } finally {
    rm(dir);
  }
});

test('P0-10 — a session where every assistant line lacks usage: zero totals, no NaN/Infinity', () => {
  const dir = useFixture('all-no-usage');
  try {
    const { status, json, stdout } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.contextTokensTotal, 0);
    assert.strictEqual(json.lead.turns.max, 2);
    assertFinite(json.lead.peakContext.max, 'lead.peakContext.max');
    assert.strictEqual(json.lead.peakContext.max, 0);

    const { stdout: text } = run(dir);
    assert.ok(!/NaN|Infinity/.test(text), `default output leaked NaN/Infinity: ${text}`);
  } finally {
    rm(dir);
  }
});

test('P0-11 — an assistant message with empty tool_use contributes 0 spawns but still counts usage', () => {
  const dir = useFixture('empty-tool-use');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.contextTokensTotal, 5000);
    assert.strictEqual(Object.keys((json.spawns && json.spawns.unprefixedByName) || {}).length, 0);
  } finally {
    rm(dir);
  }
});

test('P0-12 — usage with only input present (no cache fields) treats missing cache fields as 0', () => {
  const dir = useFixture('partial-usage-fields');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.contextTokensTotal, 7000);
  } finally {
    rm(dir);
  }
});

test('P0-13 — turns dedup by message.id: 5 lines, 2 sharing one id, count as 4 turns', () => {
  const dir = useFixture('turns-dedup');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.turns.max, 4);
  } finally {
    rm(dir);
  }
});

test('P0-14 — lead and subagent totals are separate buckets, never summed together', () => {
  const dir = useFixture('lead-subagent-totals');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.contextTokensTotal, 15000);
    assert.strictEqual(json.subagents.contextTokensTotal, 5000);
  } finally {
    rm(dir);
  }
});

test('P0-15 — multiple lead sessions and subagents across them sum correctly per bucket', () => {
  const dir = useFixture('multi-session-totals');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.contextTokensTotal, 3000);
    assert.strictEqual(json.subagents.contextTokensTotal, 600);
    assert.strictEqual(json.lead.transcriptCount, 2);
  } finally {
    rm(dir);
  }
});

test('P0-16 — first-turn context is the chronologically first call, not max/last', () => {
  const dir = useFixture('first-turn-order');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.firstTurnContext.p50, 10000);
  } finally {
    rm(dir);
  }
});

test('P0-17 — aggregate first-turn p50 across 3 sessions is the true median', () => {
  const dir = useFixture('first-turn-median');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.firstTurnContext.p50, 20000);
  } finally {
    rm(dir);
  }
});

test('P0-18 — peak is the max single call in a session, not cumulative, not last', () => {
  const dir = useFixture('peak-not-cumulative');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.peakContext.max, 50000);
  } finally {
    rm(dir);
  }
});

test('P0-19 — top-10% share of 10 distinct-total sessions equals top1/grandTotal (ceil(10*0.1)=1)', () => {
  const dir = useFixture('top10-distinct');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    const expected = 1000 / 5500;
    assert.ok(Math.abs(json.lead.top10PercentShare - expected) < 1e-9, `expected ~${expected}, got ${json.lead.top10PercentShare}`);
  } finally {
    rm(dir);
  }
});

test('P0-20 — top-10% share is deterministic when the boundary rank is tied', () => {
  const dir = useFixture('top10-tie');
  try {
    const first = runJson(dir);
    const second = runJson(dir);
    assert.strictEqual(first.status, 0);
    assert.strictEqual(second.status, 0);
    const expected = 1000 / 6400;
    assert.ok(Math.abs(first.json.lead.top10PercentShare - expected) < 1e-9, `expected ~${expected}, got ${first.json.lead.top10PercentShare}`);
    assert.strictEqual(first.json.lead.top10PercentShare, second.json.lead.top10PercentShare, 'two runs against the same fixture must agree exactly');
  } finally {
    rm(dir);
  }
});

test('P0-21 — top-10% of exactly 6 sessions never rounds to 0 (ceil(6*0.1)=1, minimum 1)', () => {
  const dir = useFixture('top10-six');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    const expected = 305 / 706;
    assert.ok(json.lead.top10PercentShare > 0, 'top-10% of 6 sessions must not be 0');
    assert.ok(Math.abs(json.lead.top10PercentShare - expected) < 1e-9, `expected ~${expected} (matches the spec's own 305M/706M=43%), got ${json.lead.top10PercentShare}`);
  } finally {
    rm(dir);
  }
});

test('P0-22 — per-role distribution buckets by sibling .meta.json agentType, prefix stripped', () => {
  const dir = useFixture('role-attribution');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.ok(json.subagentsByRole, 'expected subagentsByRole');
    assert.strictEqual(json.subagentsByRole['be-dev'].contextTokensTotal, 4000);
    assert.strictEqual(json.subagentsByRole['qa'].contextTokensTotal, 6000, 'sailes-app-builder:qa must bucket under bare "qa"');
    assert.strictEqual(json.subagents.contextTokensTotal, 10000);
  } finally {
    rm(dir);
  }
});

test('P0-23 — a subagent transcript with no sibling .meta.json falls into an explicit unknown bucket', () => {
  const dir = useFixture('role-unknown');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.ok(json.subagentsByRole && json.subagentsByRole.unknown, 'expected an explicit unknown bucket');
    assert.strictEqual(json.subagentsByRole.unknown.contextTokensTotal, 1234);
    assert.strictEqual(sumPerRole(json.subagentsByRole), json.subagents.contextTokensTotal, 'per-role buckets + unknown must reconcile to the overall subagent total — a dropped transcript would under-count here');
  } finally {
    rm(dir);
  }
});

test('P0-24 — an unprefixed Task subagent_type is tallied under its bare name', () => {
  const dir = useFixture('spawn-unprefixed');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.spawns.unprefixedByName['be-dev'], 1);
  } finally {
    rm(dir);
  }
});

test('P0-25 — a sailes-app-builder:-prefixed Task subagent_type is excluded from the unprefixed tally', () => {
  const dir = useFixture('spawn-prefixed');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.ok(!('be-dev' in json.spawns.unprefixedByName), 'prefixed spawn must not leak into the bare-name bucket');
    assert.ok(!('sailes-app-builder:be-dev' in json.spawns.unprefixedByName), 'prefixed spawns are excluded from this tally entirely');
  } finally {
    rm(dir);
  }
});

test('P0-26 — "general-purpose" (built-in) is excluded from the unprefixed non-built-in tally', () => {
  const dir = useFixture('spawn-builtin');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.ok(!('general-purpose' in json.spawns.unprefixedByName));
  } finally {
    rm(dir);
  }
});

test('P0-26b — the full Q2 built-in exclusion list (Explore, Plan, claude, statusline-setup, claude-code-guide) is excluded', () => {
  const dir = useFixture('spawn-builtin');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    for (const name of ['Explore', 'Plan', 'claude', 'statusline-setup', 'claude-code-guide']) {
      assert.ok(!(name in json.spawns.unprefixedByName), `built-in "${name}" must not appear in the unprefixed tally`);
    }
    assert.strictEqual(Object.keys((json.spawns && json.spawns.unprefixedByName) || {}).length, 0, 'all six built-ins excluded -> tally must be empty');
  } finally {
    rm(dir);
  }
});

test('P0-27 — multiple unprefixed spawns are tallied per distinct name', () => {
  const dir = useFixture('spawn-tally-multi');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.spawns.unprefixedByName['be-dev'], 3);
    assert.strictEqual(json.spawns.unprefixedByName['explorer'], 2);
  } finally {
    rm(dir);
  }
});

test('P0-28 — a Task tool_use on a duplicate-message.id line is still counted (spawn-side regression proof)', () => {
  const dir = useFixture('spawn-duplicate-id');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.spawns.unprefixedByName['qa'], 1);
  } finally {
    rm(dir);
  }
});

test('P0-29 — --since/--until window includes only the session inside [since 00:00, until 00:00) local', () => {
  const dir = useFixture('date-window');
  try {
    setMtimeLocalMidnight(path.join(dir, 'dw-10.jsonl'), '2026-09-10');
    setMtimeLocalMidnight(path.join(dir, 'dw-11.jsonl'), '2026-09-11');
    setMtimeLocalMidnight(path.join(dir, 'dw-13.jsonl'), '2026-09-13');
    const { status, json } = runJson(dir, ['--since', '2026-09-11', '--until', '2026-09-13']);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.transcriptCount, 1);
    assert.strictEqual(json.lead.contextTokensTotal, 222);
  } finally {
    rm(dir);
  }
});

test('P0-30 — --since is inclusive at D 00:00 local, --until is exclusive at D 00:00 local (asymmetric boundaries)', () => {
  const dir = useFixture('date-boundary');
  try {
    setMtimeLocalMidnight(path.join(dir, 'db-since.jsonl'), '2026-09-11');
    setMtimeLocalMidnight(path.join(dir, 'db-until.jsonl'), '2026-09-13');
    const { status, json } = runJson(dir, ['--since', '2026-09-11', '--until', '2026-09-13']);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.transcriptCount, 1, 'exactly one of the two boundary sessions must be included');
    assert.strictEqual(json.lead.contextTokensTotal, 555, 'the --since-boundary session (included) must be the one counted, not the --until-boundary one (excluded)');
  } finally {
    rm(dir);
  }
});

test('P0-31 — no --since/--until given: all sessions included regardless of mtime', () => {
  const dir = useFixture('date-no-filter');
  try {
    setMtimeLocalMidnight(path.join(dir, 'dnf-a.jsonl'), '2026-01-01');
    setMtimeLocalMidnight(path.join(dir, 'dnf-b.jsonl'), '2026-09-12');
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.transcriptCount, 2);
    assert.strictEqual(json.lead.contextTokensTotal, 30);
  } finally {
    rm(dir);
  }
});

test('P0-32 — --since alone (no --until) is an open-ended upper bound', () => {
  const dir = useFixture('date-since-only');
  try {
    setMtimeLocalMidnight(path.join(dir, 'dso-before.jsonl'), '2026-09-01');
    setMtimeLocalMidnight(path.join(dir, 'dso-after.jsonl'), '2026-09-20');
    const { status, json } = runJson(dir, ['--since', '2026-09-11']);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.transcriptCount, 1);
    assert.strictEqual(json.lead.contextTokensTotal, 60);
  } finally {
    rm(dir);
  }
});

test('P0-33 — neither default text output nor --json output ever contains message content', () => {
  const dir = useFixture('confidentiality-marker');
  try {
    const marker = 'SECRET-MARKER-TEXT';
    const { status: textStatus, stdout: text, stderr: textErr } = run(dir);
    assert.strictEqual(textStatus, 0);
    assert.ok(!text.includes(marker), 'default text output must never contain message content');
    assert.ok(!textErr.includes(marker), 'stderr must never contain message content');

    const { status: jsonStatus, stdout: jsonText, stderr: jsonErr } = run(dir, ['--json']);
    assert.strictEqual(jsonStatus, 0);
    assert.ok(!jsonText.includes(marker), '--json output must never contain message content');
    assert.ok(!jsonErr.includes(marker), 'stderr must never contain message content under --json either');
  } finally {
    rm(dir);
  }
});

test('P0-34 — default text output and --json output agree on the headline totals', () => {
  const dir = useFixture('lead-subagent-totals');
  try {
    const { status: textStatus, stdout: text } = run(dir);
    const { status: jsonStatus, json } = runJson(dir);
    assert.strictEqual(textStatus, 0);
    assert.strictEqual(jsonStatus, 0);
    assert.ok(text.includes(String(json.lead.contextTokensTotal)), `default text output must surface the same lead total (${json.lead.contextTokensTotal}) as --json:\n${text}`);
    assert.ok(text.includes(String(json.subagents.contextTokensTotal)), `default text output must surface the same subagent total (${json.subagents.contextTokensTotal}) as --json:\n${text}`);
  } finally {
    rm(dir);
  }
});

test('P0-35 — a malformed JSON line is skipped and counted, other lines still processed, exit code unaffected', () => {
  const dir = useFixture('malformed-line');
  try {
    const { status, json, stderr } = runJson(dir);
    assert.strictEqual(status, 0, 'a malformed line alone must not change the exit code');
    assert.strictEqual(json.lead.contextTokensTotal, 8000, 'both valid lines (5000 + 3000) must still be counted');
    assert.strictEqual(json.malformedLines, 1);
    assert.ok(/malformed/i.test(stderr), `expected stderr to mention the malformed line: ${stderr}`);
    assert.ok(/1/.test(stderr), `expected stderr to name the count: ${stderr}`);
  } finally {
    rm(dir);
  }
});

test('P0-36 — a 0-byte .jsonl file is treated as no data for that session, not a crash', () => {
  const dir = useFixture('zero-byte-session');
  try {
    const { status, json } = runJson(dir);
    assert.strictEqual(status, 0);
    assert.strictEqual(json.lead.contextTokensTotal, 0);
  } finally {
    rm(dir);
  }
});

console.log(failures === 0 ? '\ntoken-report.frozen: all tests passed' : `\ntoken-report.frozen: ${failures} failing`);
process.exitCode = failures === 0 ? 0 : 1;

#!/usr/bin/env node
'use strict';

/**
 * Tests for `token-report`.
 *
 * The fixture in `tools/fixtures/token-report/sample-project/` is built to exercise, in one small
 * synthetic transcript pair, the exact failure named in the P0 spec: the first version of this
 * measurement (2026-09-12, scratchpad) undercounted spawns 10 vs 177 because it only scanned
 * `tool_use` blocks inside the same `if` that gated usage-dedupe by `message.id` — so a `tool_use`
 * on a later line for an already-seen `message.id` (a split message) was silently dropped. The
 * fixture's `msg_A` reproduces that shape directly: line 1 carries `usage` + a `thinking` block,
 * line 2 repeats the SAME `usage` (same `message.id`) and carries the ONLY `tool_use` block
 * (an unprefixed `be-dev` spawn). A tool that gets this wrong drops that spawn silently and no
 * assertion here would need to change to notice — which is why there is a separate mutation proof
 * documented in the P0 run log, not just a passing count.
 *
 * Every test that touches `buildReport` (async, since it streams files) is awaited in sequence
 * before the pass/fail summary is printed — an earlier draft of this file fired those tests without
 * awaiting them, so the "all tests passed" line and exit code were decided BEFORE any async
 * assertion had run. That bug is why this file is a single `async function run()`, not a bare
 * script body.
 *
 * Run: node tools/token-report.test.js   (or `npm test`)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TOOL = path.join(ROOT, 'tools', 'token-report.js');
const FIXTURES = path.join(ROOT, 'tools', 'fixtures', 'token-report');
const SAMPLE_PROJECT = path.join(FIXTURES, 'sample-project');
const DATE_FILTER_PROJECT = path.join(FIXTURES, 'date-filter-project');
const MALFORMED_PROJECT = path.join(FIXTURES, 'malformed-project');

const {
  parseArgs,
  parseDateArg,
  roleFromAgentType,
  isUnprefixedSpawn,
  discoverTranscripts,
  withinWindow,
  percentile,
  buildReport,
} = require('./token-report.js');

let failures = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ok   ${name}`);
  } catch (e) {
    failures++;
    console.log(`  FAIL ${name}\n       ${e.message}`);
  }
}

function runTool(...args) {
  return spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8' });
}

async function run() {
  console.log('\ntoken-report');

  // ---------------------------------------------------------------- arg parsing

  await test('parses dir, --since, --until, --json — dates are LOCAL midnight, not UTC', () => {
    const a = parseArgs(['/some/dir', '--since', '2026-09-11', '--until', '2026-09-13', '--json']);
    assert.strictEqual(a.dir, '/some/dir');
    assert.strictEqual(a.sinceMs, new Date(2026, 8, 11).getTime());
    assert.strictEqual(a.untilMs, new Date(2026, 8, 13).getTime());
    assert.strictEqual(a.json, true);
    assert.strictEqual(a.help, false);
  });

  await test('--help sets help regardless of position', () => {
    assert.strictEqual(parseArgs(['--help']).help, true);
    assert.strictEqual(parseArgs(['/dir', '-h']).help, true);
  });

  await test('unknown flag throws', () => {
    assert.throws(() => parseArgs(['/dir', '--bogus']), /unknown flag/);
  });

  await test('malformed date throws with the flag name in the message', () => {
    assert.throws(() => parseDateArg('--since', '09-11-2026'), /--since/);
    assert.throws(() => parseDateArg('--since', 'not-a-date'), /--since/);
    assert.throws(() => parseDateArg('--since', '2026-13-40'), /--since/, 'rolled-over date must be rejected');
  });

  // ---------------------------------------------------------------- small pure helpers

  await test('roleFromAgentType strips a plugin-name prefix, passes through unprefixed', () => {
    assert.strictEqual(roleFromAgentType('sailes-app-builder:be-dev'), 'be-dev');
    assert.strictEqual(roleFromAgentType('explorer'), 'explorer');
    assert.strictEqual(roleFromAgentType(null), 'unknown');
  });

  await test('isUnprefixedSpawn excludes plugin-prefixed names and built-ins, includes bare role names', () => {
    assert.strictEqual(isUnprefixedSpawn('sailes-app-builder:qa'), false, 'plugin-prefixed');
    assert.strictEqual(isUnprefixedSpawn('general-purpose'), false, 'built-in');
    assert.strictEqual(isUnprefixedSpawn('Explore'), false, 'built-in');
    assert.strictEqual(isUnprefixedSpawn('claude'), false, 'built-in');
    assert.strictEqual(isUnprefixedSpawn(null), false, 'no subagent_type at all');
    assert.strictEqual(isUnprefixedSpawn('be-dev'), true, 'bare deprecated role name');
  });

  await test('percentile is nearest-rank on the sorted-ascending array, matching the reference measurement', () => {
    assert.strictEqual(percentile([1, 2, 3, 4], 0.5), 3);
    assert.strictEqual(percentile([1, 2, 3, 4], 0.9), 4);
    assert.strictEqual(percentile([], 0.5), 0);
  });

  // ---------------------------------------------------------------- discovery / classification by path

  await test('discoverTranscripts classifies lead vs subagent purely by path shape', () => {
    const found = discoverTranscripts(SAMPLE_PROJECT);
    const lead = found.filter((f) => f.kind === 'lead');
    const sub = found.filter((f) => f.kind === 'subagent');
    assert.strictEqual(lead.length, 1, 'exactly one top-level <session>.jsonl in the fixture');
    assert.ok(lead[0].filePath.endsWith('lead-session.jsonl'));
    assert.strictEqual(sub.length, 4, 'exactly four agent-*.jsonl under lead-session/subagents/');
    for (const s of sub) assert.ok(s.filePath.includes(`${path.sep}subagents${path.sep}`));
  });

  await test('discoverTranscripts reads the sibling .meta.json to name the role, stripping any plugin prefix', () => {
    const found = discoverTranscripts(SAMPLE_PROJECT);
    const byFile = Object.fromEntries(found.map((f) => [path.basename(f.filePath), f.role]));
    assert.strictEqual(byFile['agent-be-dev-1.jsonl'], 'be-dev', 'meta agentType has a plugin prefix, stripped');
    assert.strictEqual(byFile['agent-explorer-1.jsonl'], 'explorer', 'meta agentType has no prefix, used as-is');
    assert.strictEqual(byFile['agent-checker-legacy-1.jsonl'], 'be-checker');
    assert.strictEqual(byFile['agent-builtin-1.jsonl'], 'general-purpose');
  });

  await test('withinWindow is a half-open range [since, until), local time', () => {
    const since = new Date(2026, 8, 11).getTime();
    const until = new Date(2026, 8, 13).getTime();
    assert.strictEqual(withinWindow(new Date(2026, 8, 10, 23, 59, 59).getTime(), since, until), false);
    assert.strictEqual(withinWindow(new Date(2026, 8, 11, 0, 0, 0).getTime(), since, until), true);
    assert.strictEqual(withinWindow(new Date(2026, 8, 12, 23, 59, 59).getTime(), since, until), true);
    assert.strictEqual(withinWindow(new Date(2026, 8, 13, 0, 0, 0).getTime(), since, until), false, 'until is exclusive');
  });

  // ---------------------------------------------------------------- full report over the sample fixture

  await test('buildReport: lead aggregates, no date filter', async () => {
    const report = await buildReport({ dir: SAMPLE_PROJECT, sinceMs: null, untilMs: null });
    assert.strictEqual(report.lead.transcriptCount, 1);
    assert.strictEqual(report.lead.contextTokensTotal, 158, 'msg_A usage (35) must count ONCE despite two lines');
    assert.deepStrictEqual(report.lead.turns, { p50: 5, max: 5 }, 'five distinct message.id turns, not six lines');
    assert.deepStrictEqual(report.lead.firstTurnContext, { p50: 35, p90: 35 });
    assert.deepStrictEqual(report.lead.peakContext, { p50: 100, max: 100 });
    assert.strictEqual(report.lead.top10PercentShare, 1);
  });

  await test('buildReport: subagent aggregates and per-role distribution', async () => {
    const report = await buildReport({ dir: SAMPLE_PROJECT, sinceMs: null, untilMs: null });
    assert.strictEqual(report.subagents.transcriptCount, 4);
    assert.strictEqual(report.subagents.contextTokensTotal, 250);
    assert.deepStrictEqual(report.subagents.turns, { p50: 2, max: 3 });
    assert.deepStrictEqual(report.subagents.firstTurnContext, { p50: 40, p90: 50 });
    assert.deepStrictEqual(report.subagents.peakContext, { p50: 40, max: 70 });
    assert.strictEqual(report.subagents.top10PercentShare, 0.48, 'top 10% (n=4 -> 1 transcript) carries 120/250');

    const byRole = report.subagentsByRole;
    assert.deepStrictEqual(byRole['be-dev'], { n: 1, turns: { p50: 2, p90: 2, max: 2 }, contextTokensTotal: 120 });
    assert.deepStrictEqual(byRole.explorer, { n: 1, turns: { p50: 3, p90: 3, max: 3 }, contextTokensTotal: 75 });
    assert.deepStrictEqual(byRole['be-checker'], { n: 1, turns: { p50: 1, p90: 1, max: 1 }, contextTokensTotal: 40 });
    assert.deepStrictEqual(byRole['general-purpose'], { n: 1, turns: { p50: 1, p90: 1, max: 1 }, contextTokensTotal: 15 });
  });

  await test('buildReport: spawn counting — split-message spawn counted, built-ins and plugin-prefixed excluded', async () => {
    const report = await buildReport({ dir: SAMPLE_PROJECT, sinceMs: null, untilMs: null });
    assert.strictEqual(report.spawns.total, 5, 'be-dev, explorer, be-checker, general-purpose, sailes-app-builder:qa');
    assert.strictEqual(report.spawns.unprefixedTotal, 3, 'general-purpose (built-in) and sailes-app-builder:qa (prefixed) excluded');
    assert.deepStrictEqual(report.spawns.unprefixedByName, { 'be-dev': 1, explorer: 1, 'be-checker': 1 });
  });

  // ---------------------------------------------------------------- date filtering

  await test('date filtering: mtime outside [since, until) is excluded even though the file is on disk', async () => {
    const since = new Date(2026, 8, 11).getTime();
    const until = new Date(2026, 8, 13).getTime();
    const inWindowMs = new Date(2026, 8, 11, 12).getTime();
    const beforeMs = new Date(2026, 8, 10, 12).getTime();
    const afterMs = new Date(2026, 8, 13, 12).getTime();

    const setMtime = (name, ms) => {
      const p = path.join(DATE_FILTER_PROJECT, name);
      fs.utimesSync(p, new Date(ms), new Date(ms));
    };
    setMtime('in-window.jsonl', inWindowMs);
    setMtime('out-of-window-before.jsonl', beforeMs);
    setMtime('out-of-window-after.jsonl', afterMs);

    const report = await buildReport({ dir: DATE_FILTER_PROJECT, sinceMs: since, untilMs: until });
    assert.strictEqual(report.lead.transcriptCount, 1, 'only in-window.jsonl falls in the window');
    assert.strictEqual(report.lead.contextTokensTotal, 40);
  });

  // ---------------------------------------------------------------- malformed lines

  await test('a malformed JSONL line (truncated tail) is skipped, counted, and does not fail the run', async () => {
    const report = await buildReport({ dir: MALFORMED_PROJECT, sinceMs: null, untilMs: null });
    assert.strictEqual(report.malformedLines, 1);
    assert.strictEqual(report.lead.transcriptCount, 1, 'the good line still produces a valid transcript');
    assert.strictEqual(report.lead.contextTokensTotal, 60, 'only the well-formed turn is counted');
  });

  await test('CLI reports the malformed-line count on stderr and in both output modes, and still exits 0', () => {
    const jsonRun = runTool(MALFORMED_PROJECT, '--json');
    assert.strictEqual(jsonRun.status, 0, 'a malformed line must never fail the run');
    assert.ok(/skipped 1 malformed JSONL line/.test(jsonRun.stderr));
    assert.strictEqual(JSON.parse(jsonRun.stdout).malformedLines, 1);

    const textRun = runTool(MALFORMED_PROJECT);
    assert.strictEqual(textRun.status, 0);
    assert.ok(/Malformed JSONL lines skipped: 1/.test(textRun.stdout));
  });

  // ---------------------------------------------------------------- CLI end-to-end

  await test('CLI --json on the sample fixture matches buildReport', () => {
    const r = runTool(SAMPLE_PROJECT, '--json');
    assert.strictEqual(r.status, 0, r.stderr);
    const report = JSON.parse(r.stdout);
    assert.strictEqual(report.lead.contextTokensTotal, 158);
    assert.strictEqual(report.spawns.unprefixedTotal, 3);
  });

  await test('CLI text mode prints a human-readable report with the role table and spawn breakdown', () => {
    const r = runTool(SAMPLE_PROJECT);
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(r.stdout.includes('Lead sessions: 1'));
    assert.ok(r.stdout.includes('Subagent transcripts: 4'));
    assert.ok(r.stdout.includes('be-dev'));
    assert.ok(r.stdout.includes('Spawns: 5 total, 3 unprefixed'));
  });

  await test('CLI --help documents the mtime-local-time decision', () => {
    const r = runTool('--help');
    assert.strictEqual(r.status, 0);
    assert.ok(/mtime/i.test(r.stdout), '--help must say the date filter is mtime-based');
    assert.ok(/LOCAL/.test(r.stdout), '--help must say the boundary is local time, not UTC');
    assert.ok(/NOT BY MESSAGE TIMESTAMPS/i.test(r.stdout));
  });

  await test('CLI rejects a missing directory', () => {
    const r = runTool(path.join(FIXTURES, 'does-not-exist'));
    assert.strictEqual(r.status, 1);
    assert.ok(/not a directory/.test(r.stderr));
  });

  console.log(
    failures === 0
      ? '\ntoken-report: all tests passed'
      : `\ntoken-report: ${failures} failing`
  );
  process.exitCode = failures === 0 ? 0 : 1;
}

run();

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
const NO_USAGE_MIXED = path.join(FIXTURES, 'no-usage-project', 'mixed');
const NO_USAGE_ALL_NONE = path.join(FIXTURES, 'no-usage-project', 'all-none');

// P1.1/P1.2 (spec 2026-09-16, workflow-first-orchestration) — tools/fixtures/token-report-workflow/
const WORKFLOW_FIXTURES = path.join(ROOT, 'tools', 'fixtures', 'token-report-workflow');
const PROJECT_WITH_WORKFLOW = path.join(WORKFLOW_FIXTURES, 'project-with-workflow');
const DIRECT_WF_DIR = path.join(WORKFLOW_FIXTURES, 'direct-wf-dir');

const {
  parseArgs,
  parseDateArg,
  roleFromAgentType,
  isUnprefixedSpawn,
  discoverTranscripts,
  withinWindow,
  percentile,
  buildReport,
  tierFromModel,
  costUsdForTranscript,
  PRICE_TABLE_USD_PER_MTOK,
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

  // ---------------------------------------------------------------- P0-09 / P0-10 (frozen suite defects)

  await test('P0-09: an assistant message with no usage field still counts as a turn, contributing 0 tokens', async () => {
    const report = await buildReport({ dir: NO_USAGE_MIXED, sinceMs: null, untilMs: null });
    assert.strictEqual(report.lead.transcriptCount, 1);
    assert.deepStrictEqual(report.lead.turns, { p50: 2, max: 2 }, 'both message.id values count as turns, not just the one with usage');
    assert.strictEqual(report.lead.contextTokensTotal, 5000, 'the no-usage turn contributes 0, the other contributes 5000');
  });

  await test('P0-10: a transcript where every assistant line lacks usage gives zero totals, correct turn count, no NaN/Infinity', async () => {
    const report = await buildReport({ dir: NO_USAGE_ALL_NONE, sinceMs: null, untilMs: null });
    assert.strictEqual(report.lead.transcriptCount, 1);
    assert.deepStrictEqual(report.lead.turns, { p50: 2, max: 2 });
    assert.strictEqual(report.lead.contextTokensTotal, 0);
    assert.deepStrictEqual(report.lead.peakContext, { p50: 0, max: 0 });
    assert.ok(Number.isFinite(report.lead.contextTokensTotal) && Number.isFinite(report.lead.peakContext.max));

    const textRun = runTool(NO_USAGE_ALL_NONE);
    assert.strictEqual(textRun.status, 0);
    assert.ok(!/NaN|Infinity/.test(textRun.stdout), `default output leaked NaN/Infinity: ${textRun.stdout}`);
  });

  // ---------------------------------------------------------------- P0-34 (frozen suite defect)

  await test('P0-34: fmtTotal keeps a sub-1M total visible instead of rounding it to "0.0M"', () => {
    const r = runTool(NO_USAGE_MIXED);
    assert.strictEqual(r.status, 0);
    assert.ok(!/context tokens total\s+0\.0M/.test(r.stdout), `a 5000-token total must not print as 0.0M:\n${r.stdout}`);
    assert.ok(/context tokens total\s+5000 \(5\.0k\)/.test(r.stdout), `expected the raw value with a k-scaled hint alongside it, got:\n${r.stdout}`);
  });

  await test('P0-34 (frozen plan): text output carries the EXACT --json number for every headline metric, not just the total', () => {
    const textRun = runTool(SAMPLE_PROJECT);
    const jsonRun = runTool(SAMPLE_PROJECT, '--json');
    assert.strictEqual(textRun.status, 0);
    assert.strictEqual(jsonRun.status, 0);
    const json = JSON.parse(jsonRun.stdout);
    const text = textRun.stdout;
    for (const group of ['lead', 'subagents']) {
      assert.ok(text.includes(String(json[group].contextTokensTotal)), `${group}.contextTokensTotal missing verbatim from text output`);
      assert.ok(text.includes(String(json[group].firstTurnContext.p50)), `${group}.firstTurnContext.p50 missing verbatim`);
      assert.ok(text.includes(String(json[group].firstTurnContext.p90)), `${group}.firstTurnContext.p90 missing verbatim`);
      assert.ok(text.includes(String(json[group].peakContext.p50)), `${group}.peakContext.p50 missing verbatim`);
      assert.ok(text.includes(String(json[group].peakContext.max)), `${group}.peakContext.max missing verbatim`);
      assert.ok(text.includes(String(json[group].top10PercentShare)), `${group}.top10PercentShare missing verbatim (must be the raw fraction, not just "43%")`);
    }
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

  // ---------------------------------------------------------------- P1.1 — workflow discovery

  await test('P1.1 (dowod detekcji): agent-*.jsonl under subagents/workflows/wf_*/ counted as subagents — ' +
    'reverting the workflows/ recursion drops this test to 1 subagent instead of 3', async () => {
    const found = discoverTranscripts(PROJECT_WITH_WORKFLOW);
    const lead = found.filter((f) => f.kind === 'lead');
    const sub = found.filter((f) => f.kind === 'subagent');
    assert.strictEqual(lead.length, 1, 'lead-session.jsonl only');
    assert.strictEqual(sub.length, 3, 'agent-direct-1 (plain nested) + agent-wf-1 + agent-wf-2 (workflows/wf_test1/)');
    const names = sub.map((f) => path.basename(f.filePath)).sort();
    assert.deepStrictEqual(names, ['agent-direct-1.jsonl', 'agent-wf-1.jsonl', 'agent-wf-2.jsonl']);
  });

  await test('P1.1: discoverTranscripts exposes label/agentType/workflowPhase from .meta.json, additive to role', () => {
    const found = discoverTranscripts(PROJECT_WITH_WORKFLOW);
    const byFile = Object.fromEntries(found.map((f) => [path.basename(f.filePath), f]));
    assert.strictEqual(byFile['agent-wf-1.jsonl'].role, 'general-purpose');
    assert.strictEqual(byFile['agent-wf-1.jsonl'].label, 'F1');
    assert.strictEqual(byFile['agent-wf-1.jsonl'].agentType, 'general-purpose');
    assert.strictEqual(byFile['agent-wf-1.jsonl'].workflowPhase, 'Implement');
    assert.strictEqual(byFile['agent-wf-2.jsonl'].role, 'be-dev', 'plugin prefix stripped for role, kept raw in agentType');
    assert.strictEqual(byFile['agent-wf-2.jsonl'].agentType, 'sailes-app-builder:be-dev');
    assert.strictEqual(byFile['agent-wf-2.jsonl'].workflowPhase, 'Review');
    assert.strictEqual(byFile['lead-session.jsonl'].label, null, 'a lead session carries no meta.json');
  });

  await test('P1.1: a wf_* directory passed DIRECTLY as <projectTranscriptDir> is subagents, never a lead', () => {
    const found = discoverTranscripts(DIRECT_WF_DIR);
    const lead = found.filter((f) => f.kind === 'lead');
    const sub = found.filter((f) => f.kind === 'subagent');
    assert.strictEqual(lead.length, 0, 'no top-level lead — agent-*.jsonl at the dir root is a subagent shape');
    assert.strictEqual(sub.length, 2);
    const byFile = Object.fromEntries(sub.map((f) => [path.basename(f.filePath), f.role]));
    assert.strictEqual(byFile['agent-a.jsonl'], 'unknown', 'no sibling meta -> unknown, not a crash');
    assert.strictEqual(byFile['agent-b.jsonl'], 'be-dev');
  });

  await test('P1.1: buildReport over a directly-passed wf_* dir puts every transcript in subagents, none in lead', async () => {
    const report = await buildReport({ dir: DIRECT_WF_DIR, sinceMs: null, untilMs: null });
    assert.strictEqual(report.lead.transcriptCount, 0);
    assert.strictEqual(report.subagents.transcriptCount, 2);
  });

  // ---------------------------------------------------------------- P1.2 — cost

  await test('tierFromModel buckets by substring on the real API model id, case-insensitively', () => {
    assert.strictEqual(tierFromModel('claude-haiku-4-5-20251001'), 'haiku');
    assert.strictEqual(tierFromModel('claude-sonnet-4-5-20250929'), 'sonnet');
    assert.strictEqual(tierFromModel('claude-opus-4-1-20250805'), 'opus');
    assert.strictEqual(tierFromModel('CLAUDE-HAIKU-X'), 'haiku');
    assert.strictEqual(tierFromModel('claude-synthetic'), 'unknown');
    assert.strictEqual(tierFromModel(null), 'unknown');
  });

  await test('costUsdForTranscript: input + cache-write (1.25x) + cache-read (0.1x) + output, from the one price table', () => {
    const usageMessages = [{ input: 1_000_000, cacheCreate: 0, cacheRead: 0, output: 0 }];
    const r1 = costUsdForTranscript(usageMessages, 'claude-sonnet-4-5-20250929', PRICE_TABLE_USD_PER_MTOK);
    assert.strictEqual(r1.usd, 3, '1M input tokens at $3/MTok sonnet');
    assert.strictEqual(r1.tier, 'sonnet');
    assert.strictEqual(r1.unpricedMessages, 0);

    const cacheMsgs = [{ input: 0, cacheCreate: 1_000_000, cacheRead: 1_000_000, output: 0 }];
    const r2 = costUsdForTranscript(cacheMsgs, 'claude-sonnet-4-5-20250929', PRICE_TABLE_USD_PER_MTOK);
    assert.ok(Math.abs(r2.usd - 4.05) < 1e-9, `expected 3*1.25 + 3*0.1 = 4.05, got ${r2.usd}`);

    const outMsgs = [{ input: 0, cacheCreate: 0, cacheRead: 0, output: 1_000_000 }];
    const r3 = costUsdForTranscript(outMsgs, 'claude-haiku-4-5-20251001', PRICE_TABLE_USD_PER_MTOK);
    assert.strictEqual(r3.usd, 5, '1M output tokens at $5/MTok haiku');
  });

  await test('costUsdForTranscript: a model outside the price table prices as $0 but is reported as unpriced, not silently absorbed', () => {
    const usageMessages = [{ input: 1_000_000, cacheCreate: 0, cacheRead: 0, output: 1_000_000 }];
    const r = costUsdForTranscript(usageMessages, 'claude-synthetic', PRICE_TABLE_USD_PER_MTOK);
    assert.strictEqual(r.usd, 0);
    assert.strictEqual(r.tier, 'unknown');
    assert.strictEqual(r.unpricedMessages, 1);
  });

  await test('P1.2: --cost aggregates per transcript, and by label/role/tier, across lead + workflow-nested subagents', async () => {
    const report = await buildReport({ dir: PROJECT_WITH_WORKFLOW, sinceMs: null, untilMs: null, cost: true });
    assert.ok(report.cost, '--cost must add a `cost` key to the report');
    assert.ok(Math.abs(report.cost.leadUSD - 6) < 1e-9, 'lead: 2M input tokens sonnet = 2*3 = $6');
    assert.ok(Math.abs(report.cost.subagentsUSD - 11.55) < 1e-9, 'direct-1 (opus, $1.50) + wf-1 (haiku, $6) + wf-2 (sonnet, $4.05)');
    assert.ok(Math.abs(report.cost.totalUSD - 17.55) < 1e-9);
    assert.strictEqual(report.cost.unpricedMessages, 0);

    assert.ok(Math.abs(report.cost.byLabel.F1 - 6) < 1e-9);
    assert.ok(Math.abs(report.cost.byLabel.F2 - 4.05) < 1e-9);
    assert.ok(Math.abs(report.cost.byLabel['direct-nested explorer'] - 1.5) < 1e-9);

    assert.ok(Math.abs(report.cost.byRole['general-purpose'] - 6) < 1e-9);
    assert.ok(Math.abs(report.cost.byRole['be-dev'] - 4.05) < 1e-9);
    assert.ok(Math.abs(report.cost.byRole.explorer - 1.5) < 1e-9);

    assert.ok(Math.abs(report.cost.byTier.haiku - 6) < 1e-9);
    assert.ok(Math.abs(report.cost.byTier.opus - 1.5) < 1e-9, 'opus: only the direct-nested subagent');
    assert.ok(Math.abs(report.cost.byTier.sonnet - 10.05) < 1e-9, 'sonnet: lead ($6) + wf-2 ($4.05)');
  });

  await test('P1.2: without --cost the report carries no cost key at all (no behavior change to the default path)', async () => {
    const report = await buildReport({ dir: PROJECT_WITH_WORKFLOW, sinceMs: null, untilMs: null });
    assert.strictEqual(report.cost, undefined);
  });

  await test('P1.2: cost for a split message (same message.id, growing output_tokens) uses the LAST/max snapshot, ' +
    'not the first — undercounting here is a real defect this fixture reproduces (100k final vs 100 opening)', async () => {
    const report = await buildReport({
      dir: path.join(WORKFLOW_FIXTURES, 'split-message-cost'), sinceMs: null, untilMs: null, cost: true,
    });
    assert.strictEqual(report.subagents.transcriptCount, 1);
    assert.ok(Math.abs(report.cost.subagentsUSD - 0.5) < 1e-9,
      `100000 output tokens haiku at $5/MTok = $0.50; got ${report.cost.subagentsUSD} (looks like the first-seen 100 was used, not the max)`);
  });

  await test('CLI --cost prints a Cost section with the total and per-tier breakdown', () => {
    const r = runTool(DIRECT_WF_DIR, '--cost');
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(/Cost: \$2\.50 total/.test(r.stdout), `expected the $2.50 total (haiku $1.00 + sonnet $1.50):\n${r.stdout}`);
    assert.ok(/by tier:/.test(r.stdout));

    const jsonRun = runTool(DIRECT_WF_DIR, '--cost', '--json');
    const json = JSON.parse(jsonRun.stdout);
    assert.ok(Math.abs(json.cost.totalUSD - 2.5) < 1e-9);
  });

  await test('CLI without --cost never adds a cost key to --json output', () => {
    const r = runTool(DIRECT_WF_DIR, '--json');
    const json = JSON.parse(r.stdout);
    assert.strictEqual(json.cost, undefined);
  });

  await test('--help documents --cost', () => {
    const r = runTool('--help');
    assert.ok(/--cost/.test(r.stdout));
  });

  console.log(
    failures === 0
      ? '\ntoken-report: all tests passed'
      : `\ntoken-report: ${failures} failing`
  );
  process.exitCode = failures === 0 ? 0 : 1;
}

run();

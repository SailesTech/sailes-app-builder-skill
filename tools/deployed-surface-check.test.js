#!/usr/bin/env node
'use strict';

/**
 * Tests for `deployed-surface-check`.
 *
 * Two halves, and the second is the one that matters for whether this check survives contact with
 * real work. The first half proves it FIRES: a phase claiming a status code with no probe fails,
 * and every degenerate way of pretending to answer — a local URL, an address with no expectation,
 * a bare `n/a` — fails too. The second half proves it STAYS QUIET: run against this repo's own 18
 * implemented specs, written years before the rule existed, it may not manufacture work.
 *
 * That second half is a regression guard on a measurement. The first draft of the trigger set
 * matched `Ledger location:` and `→ 149 linii (limit 150)` — five false positives across the
 * corpus. A check that cries wolf on prose is a check that gets deleted, and this suite is what
 * keeps the tightening from being quietly loosened later.
 *
 * Run: node tools/deployed-surface-check.test.js   (or `npm test`)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TOOL = path.join(ROOT, 'tools', 'deployed-surface-check.js');
const FIXTURES = path.join(ROOT, 'tools', 'fixtures', 'deployed-surface');

const {
  checkSpec, judgeProbe, isLocalHost, claimsStatus, claimsHeader, claimsRedirect,
} = require('./deployed-surface-check.js');

let failures = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (e) {
    failures++;
    console.log(`  FAIL ${name}\n       ${e.message}`);
  }
}

function runTool(...args) {
  return spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8' });
}

function fixture(name) {
  return path.join(FIXTURES, name);
}

console.log('\ndeployed-surface-check');

// ---------------------------------------------------------------- the CLI, end to end

test('a phase claiming a status code with no `Deployed-probe:` exits 1 and names the phase', () => {
  const r = runTool(fixture('triggered-unanswered.md'));
  assert.strictEqual(r.status, 1, 'a spec pinned to a 404 with no deployed probe must not pass');
  assert.ok(/Phase 1/.test(r.stderr), 'the report must name which phase, not just that something failed');
  assert.ok(/returns 404/.test(r.stderr), 'the report must quote the trigger line so the author can see what fired');
  assert.ok(/Deployed-probe: n\/a/.test(r.stderr), 'the report must show the waiver form — a check that only says no teaches nothing');
});

test('a phase whose probe names a deployed host and an expectation exits 0', () => {
  const r = runTool(fixture('triggered-answered.md'));
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(/1 phase\(s\) claim a wire property/.test(r.stdout), 'a pass must still say the rule applied');
});

test('a spec with no wire-property claim exits 0 and says the rule does not apply', () => {
  const r = runTool(fixture('no-http-surface.md'));
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(/rule does not apply/.test(r.stdout));
});

test('a probe pointed at localhost fails — that is origin, the surface the defect passed on', () => {
  const r = runTool(fixture('local-only-probe.md'));
  assert.strictEqual(r.status, 1);
  assert.ok(/only local addresses/.test(r.stderr));
});

test('a probe with an address but no expectation fails — a request that cannot fail is not a check', () => {
  const r = runTool(fixture('probe-without-expectation.md'));
  assert.strictEqual(r.status, 1);
  assert.ok(/no expected observation/.test(r.stderr));
});

test('`n/a` with no reason fails; `n/a` with a reason passes', () => {
  assert.strictEqual(runTool(fixture('waiver-no-reason.md')).status, 1, 'a bare n/a is the field deleted more slowly');
  assert.strictEqual(runTool(fixture('waiver-with-reason.md')).status, 0, 'a stated waiver is an answer and must pass');
});

test('several files are judged independently and one failure fails the run', () => {
  const r = runTool(fixture('no-http-surface.md'), fixture('triggered-unanswered.md'));
  assert.strictEqual(r.status, 1);
  assert.ok(/rule does not apply/.test(r.stdout), 'the passing file still reports');
});

test('no arguments exits 2 with usage, not 0', () => {
  const r = runTool();
  assert.strictEqual(r.status, 2, 'exiting 0 on no input is how a check becomes a no-op in a gate');
});

test('an unreadable path fails loudly rather than being skipped', () => {
  const r = runTool(path.join(FIXTURES, 'does-not-exist.md'));
  assert.strictEqual(r.status, 1);
  assert.ok(/cannot read/.test(r.stderr));
});

// ---------------------------------------------------------------- the trigger set

test('status claims fire in the forms specs actually write', () => {
  for (const line of [
    'the endpoint returns 404 when the proposal does not exist',
    'zwraca 404 dla nieistniejącego dealu',
    'responds with HTTP 410 once the token expires',
    '`GET /x` → 200 for a known id',
    "curl -s -o /dev/null -w '%{http_code}' ...",
    'the API answers 503 Service Unavailable during a deploy',
  ]) {
    assert.ok(claimsStatus(line), `should have fired: ${line}`);
  }
});

test('prose that merely contains a number does not fire', () => {
  for (const line of [
    'budżet agents-md-template.md → 149 linii (limit 150) ✅',
    'the sweep returned 200 rows from the ledger',
    'Phase 2 covers 404 of the 900 records',
    'we cut context by 300 words',
  ]) {
    assert.ok(!claimsStatus(line), `false positive: ${line}`);
  }
});

test('a hyphenated response header fires on its own; an English word needs an HTTP hint', () => {
  assert.ok(claimsHeader('assets get `Cache-Control: public, max-age=31536000`'));
  assert.ok(claimsHeader('the Content-Type must stay application/json'));
  assert.ok(claimsHeader('the response Location: header points at the signed url'));
  assert.ok(!claimsHeader('Ledger location: decided at kickoff'), 'a markdown field is not a header');
  assert.ok(!claimsHeader('location, and the location is what it reports'), 'prose is not a header');
});

test('local and RFC1918 addresses are all rejected as deployments', () => {
  for (const h of ['localhost', 'localhost:3000', '127.0.0.1', '0.0.0.0', '::1', 'app.local',
    '10.0.0.4', '192.168.1.9', '172.20.3.1', 'host.docker.internal']) {
    assert.ok(isLocalHost(h), `${h} must not count as a deployed address`);
  }
  for (const h of ['dev.partners.volubus.com', 'api.example.com', '172.15.0.1', '11.0.0.1']) {
    assert.ok(!isLocalHost(h), `${h} is a deployed address and must count`);
  }
});

test('a spec with no phase headings is judged as one unit, not skipped', () => {
  const { errors, units } = checkSpec('# Fix\n\nThe route returns 404 for unknown ids.\n');
  assert.strictEqual(units, 1);
  assert.strictEqual(errors.length, 1, 'an unphased spec must not be a way to opt out of the check');
});

test('prose ABOUT the rule does not trigger the rule', () => {
  const { errors } = checkSpec(
    '## Phase 1 — docs\n\nExplain that `Deployed-probe:` is required when a phase claims a 404.\n'
  );
  assert.strictEqual(errors.length, 0, 'a document describing the field must not be caught by it');
});

test('judgeProbe rejects an address-free value however confidently it is written', () => {
  assert.strictEqual(judgeProbe('verified against origin, returns 404').ok, false);
  assert.strictEqual(judgeProbe('QA confirmed on staging → 404').ok, false);
});

// ---------------------------------------------------------------- forms real specs are written in
//
// All three cases below are regressions on the SAME defect class, all three found on 2026-08-30 by
// running the check against spec text an actual model produced rather than against fixtures written
// by the person who wrote the check. Each was a correct answer failed on punctuation. A check that
// does that gets argued with once and disabled after, which is the failure this repo already
// records for `test:browser` — so they are pinned here rather than fixed and forgotten.

test('the field is accepted as a bold sub-heading, not only as `Label:`', () => {
  const { errors } = checkSpec([
    '## Phase 1 — status contract',
    '',
    'The handler returns 404 on a missing row.',
    '',
    '**Deployed-probe**',
    '```',
    "curl -s -o /dev/null -w '%{http_code} %{content_type}' https://dev.example.com/api/v1/x/0000",
    '```',
    'expected `404 application/json`; a `200 text/html` means the CDN rewrote it.',
    '',
  ].join('\n'));
  assert.strictEqual(errors.length, 0, 'the heading form is how a model actually writes this field');
});

test('a waiver still counts when markdown-wrapped', () => {
  assert.strictEqual(judgeProbe('`n/a — the phase reads a contract already probed in Phase 1`').ok, true);
  assert.strictEqual(judgeProbe('**n/a — no deployed surface exists for this phase at all**').ok, true);
});

test('a phase whose Done-when already probes the deployed host passes without the label', () => {
  const { errors } = checkSpec([
    '## Phase 3 — deployed verification',
    '',
    'Done-when:',
    '`curl -s -D - -o /dev/null https://dev.example.com/api/v1/proposal/pending` → headers include',
    '`cache-control: no-store` on two successive calls.',
    '',
  ].join('\n'));
  assert.strictEqual(errors.length, 0, 'the question is answered on disk; demanding the label too is bookkeeping');
});

test('...but an unlabelled LOCAL check does not buy the same pass', () => {
  const { errors } = checkSpec([
    '## Phase 1 — status contract',
    '',
    'The handler returns 404 on a missing row.',
    '',
    'Done-when: `curl -s -o /dev/null -w \'%{http_code}\' http://localhost:3000/api/v1/x/0` → 404',
    '',
  ].join('\n'));
  assert.strictEqual(errors.length, 1, 'origin passing is the entire defect; it must never be an implicit pass');
});

// ---------------------------------------------------------------- what an adversarial read found
//
// Four defects an independent review found on 2026-08-30 by attacking the check rather than
// exercising it. Every string below is the reviewer's own, verbatim. Two were manufactured
// obligation (the check demanding a probe for something that was never an HTTP claim), one was the
// escape hatch reopening the escaped defect, one was a pair of false negatives.
//
// The most instructive part is not the bugs. It is that the suite ALREADY had a test for the first
// class — and it used the past tense, `the sweep returned 200 rows`, which the trigger word
// `returns?` never matched. It passed while the common phrasing misfired. A test written by the
// same person, at the same time, as the code it covers shares that person's blind spot.

test('a number that COUNTS something is not a status code — present tense included', () => {
  for (const line of [
    'This query returns 404 matching rows.',
    'The migration returns 201 records updated in this batch.',
    'zwraca 500 wierszy z tabeli klientow',
    'The service responds well within our 200 millisecond latency budget.',
    'the sweep returned 200 rows from the ledger',
    'the endpoint returns 429 requests per minute to the queue',
  ]) {
    assert.ok(!claimsStatus(line), `manufactured obligation: ${line}`);
  }
});

test('...and the counted-noun guard does not swallow a real status claim', () => {
  for (const line of [
    'The handler returns 404 on a missing row.',
    'the endpoint returns 404 when the proposal does not exist',
    'zwraca 404 dla nieistniejacego dealu',
    'responds with HTTP 410 once the token expires',
  ]) {
    assert.ok(claimsStatus(line), `guard swallowed a real claim: ${line}`);
  }
});

test('an unrelated URL near a status claim does NOT satisfy the implicit probe', () => {
  const { errors } = checkSpec([
    '## Phase 1 — Proposal status endpoint',
    '',
    'The endpoint must return HTTP status 404 when the proposal id does not exist in the table.',
    '',
    'Background reading for the team: https://en.wikipedia.org/wiki/List_of_HTTP_status_codes',
    'documents that 404 Not Found is a client error response code.',
    '',
    'Done-when: pnpm test proposal → 0 failures',
    '',
  ].join('\n'));
  assert.strictEqual(errors.length, 1, 'a citation is not a probe — this exact spec passed at exit 0 before the fix');
});

test('a redirect that names its target fires without any other HTTP word', () => {
  assert.ok(claimsRedirect('After login, the user is redirected to /dashboard.'));
  assert.ok(claimsRedirect('Successful checkout redirects the browser to /order/confirmation.'));
  assert.ok(!claimsRedirect('We redirect the conversation to the account manager.'),
    'a redirect with no target and no HTTP context is not a wire claim');
});

test('a labelled probe whose command sits below a blank line still counts', () => {
  const { errors } = checkSpec([
    '## Phase 1 — webhook accepts both payload shapes',
    '',
    'Cases 3 and 4 must reject; the endpoint returns 400 for an empty list.',
    '',
    '**Deployed-probe:** the response status is part of this contract, so it is observed on the',
    'deployed address, not origin.',
    '',
    '1. `curl -s -o /dev/null -w \'%{http_code}\' -X POST https://dev.example.com/api/v1/webhook`',
    '   → record the code as BASELINE.',
    '2. Re-run with the new shape → must still return BASELINE.',
    '',
  ].join('\n'));
  assert.strictEqual(errors.length, 0,
    'the field reader stops at the blank line; the phase still did the work and must not be failed for layout');
});

test('an ambiguous header fires in the plural too', () => {
  assert.ok(claimsHeader('The proxy sets the Vary and Age headers on every response.'),
    '`header\\b` never matched inside "headers" — the boundary sits between two word characters');
});

// ---------------------------------------------------------------- the quiet half

test('this repo\'s own implemented specs produce no false positives', () => {
  const dir = path.join(ROOT, '.ai', 'specs', 'implemented');
  const specs = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  assert.ok(specs.length >= 10, 'the corpus is the point of this test; it must not silently shrink');

  const firing = [];
  for (const f of specs) {
    const { errors } = checkSpec(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (errors.length) firing.push(`${f}: ${errors[0].split('\n')[0]}`);
  }

  // 2026-08-30: exactly one fires — `2026-07-20-sailes-test.md`, whose own Done-when table row
  // reads "HTTP 200 sweep, Phase 2" with nothing saying where that sweep runs. That is a TRUE
  // positive and it stays on the list as the corpus's single known hit. Anything beyond it is the
  // trigger set having drifted back toward matching prose.
  assert.ok(
    firing.length <= 1,
    `retuning made the check noisy on real specs (${firing.length} firing):\n  ${firing.join('\n  ')}`
  );
});

test('a mutated trigger set is actually detectable — this suite is not vacuous', () => {
  const { errors } = checkSpec('## Phase 1 — x\n\nreturns 404 on miss\n');
  assert.strictEqual(errors.length, 1, 'if the canonical trigger stops firing, every other test here still passes');
});

console.log(
  failures === 0
    ? '\ndeployed-surface-check: all tests passed'
    : `\ndeployed-surface-check: ${failures} failing`
);
process.exit(failures === 0 ? 0 : 1);

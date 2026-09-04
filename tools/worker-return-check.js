#!/usr/bin/env node
'use strict';

/**
 * Worker return check — "did this delegation produce anything, or only a message?"
 *
 * `agents/team-lead.md` has said since 1.9.0 that an idle signal carrying no report is never a
 * completion, and `evals/lead-chases-an-empty-worker-return.md` grades whether the lead honors it.
 * That eval also records what has been missing the whole time:
 *
 *     "No mechanical backstop exists: no hook observes a subagent completing
 *      (verified 2026-07-18). This eval is therefore the only thing standing
 *      between the rule and silent regression."
 *
 * This is that backstop's first half — the deterministic one. It does not watch anything and it
 * does not grade behavior. It answers one question from disk and git, on demand: does the artifact
 * the brief named actually exist with content, and did the tree move. The lead runs it before
 * writing "returned X" into the run log, so the log carries a measurement instead of an impression.
 *
 * The second half — a `SubagentStop` hook that measures without being asked — is deliberately NOT
 * here. It is an open question in `.ai/specs/2026-09-04-worker-return-measured.md`, because a hook
 * changes behavior in every repo on the machine and this repo has rejected one on that ground
 * before (`.ai/backlog.md`, the test-plan hook).
 *
 * Verdicts — decided by the NAMED DELIVERABLES ALONE. The diff is printed as context and carries
 * no vote, because `git diff` describes the tree and cannot attribute a byte to one worker:
 *   PRODUCED        — every named deliverable exists with content
 *   PARTIAL         — some named deliverables have content and some do not
 *   EMPTY-RETURN    — none of the named deliverables has content. The shape the lead must chase
 *                     rather than record as a finding
 *   NOT-COMPUTABLE  — the brief named no file, so the return cannot be graded either way
 *
 * NOT-COMPUTABLE is its own verdict and never folds into PRODUCED, for the same reason
 * `evals/harness/eval-status.js` keeps NO-FILES separate: a return whose substance cannot be
 * computed must not read as substantial. That is the silent-instrument trap this repo has
 * recorded repeatedly — an instrument that stays quiet for the wrong reason gets believed.
 *
 * An empty deliverable counts as absent on purpose. `team-lead.md` says "no file = task not done";
 * a file created and left at zero bytes satisfies the letter of that and none of its meaning.
 *
 * Run:
 *   node tools/worker-return-check.js --deliverable .ai/findings/auth-map.md [--deliverable ...]
 *                                     [--base <git-ref>] [--label <text>] [--json]
 *
 * Exit codes: 0 PRODUCED / 0 PARTIAL / 1 EMPTY-RETURN / 2 NOT-COMPUTABLE
 * EMPTY-RETURN and NOT-COMPUTABLE differ because the responses differ: one is a worker to chase,
 * the other is a brief that named nothing gradable, which is the lead's own defect to fix.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const MIN_CONTENT_BYTES = 1; // whitespace-only counts as empty; see contentBytes()

/** Parse argv into options. Unknown flags are an error — a silently ignored flag is a silent gate. */
function parseArgs(argv) {
  const options = { deliverables: [], base: '', label: '', json: false, cwd: process.cwd() };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) throw new Error(`${arg} needs a value`);
      i += 1;
      return value;
    };
    if (arg === '--deliverable') options.deliverables.push(next());
    else if (arg === '--base') options.base = next();
    else if (arg === '--label') options.label = next();
    else if (arg === '--cwd') options.cwd = next();
    else if (arg === '--json') options.json = true;
    else throw new Error(`unknown argument ${JSON.stringify(arg)}`);
  }
  return options;
}

/**
 * Bytes of non-whitespace content. A file of blank lines is not a deliverable, and a worker that
 * touched a file without writing anything into it has not produced one either.
 */
function contentBytes(absolutePath) {
  const raw = fs.readFileSync(absolutePath, 'utf8');
  return Buffer.byteLength(raw.replace(/\s/g, ''), 'utf8');
}

function inspectDeliverable(cwd, relativePath) {
  const absolute = path.resolve(cwd, relativePath);
  if (!fs.existsSync(absolute)) return { path: relativePath, state: 'missing', bytes: 0, lines: 0 };
  const stat = fs.statSync(absolute);
  if (stat.isDirectory()) return { path: relativePath, state: 'not-a-file', bytes: 0, lines: 0 };
  const bytes = contentBytes(absolute);
  if (bytes < MIN_CONTENT_BYTES) return { path: relativePath, state: 'empty', bytes: 0, lines: 0 };
  const lines = fs.readFileSync(absolute, 'utf8').split('\n').length;
  return { path: relativePath, state: 'present', bytes, lines };
}

/**
 * How much the tree moved — **context in the report, never a term in the verdict.** See decide().
 *
 * Two corrections from the 2026-09-04 adversarial audit, both reproduced:
 *  - `<base>...HEAD` compared committed history only, so a worker obeying "workers never commit"
 *    scored `0f +0/-0` on real work. The comparison is now base-to-working-tree.
 *  - `git diff` never sees an untracked file, so a brand-new artifact — the most common shape of a
 *    worker's output — counted as nothing. Untracked files are counted separately and added in.
 *
 * A git failure is reported as `available: false` rather than thrown: deliverables stay measurable
 * in a directory that is not a repo, and an instrument that dies on the easy half tells you nothing
 * about the hard one. The failure `reason` reaches the plain-text output, because "not a repo" and
 * "your --base does not exist" must not print the same three words.
 */
function diffstat(cwd, base) {
  const args = base ? ['diff', '--numstat', base] : ['diff', '--numstat', 'HEAD'];
  let output;
  try {
    output = execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    return { available: false, reason: (error && error.message) || 'git failed', files: 0, insertions: 0, deletions: 0, untracked: 0 };
  }
  let files = 0;
  let insertions = 0;
  let deletions = 0;
  for (const line of output.split('\n')) {
    const match = /^(\d+|-)\t(\d+|-)\t/.exec(line);
    if (!match) continue;
    files += 1;
    // "-" marks a binary file: it moved, but the line counts are not defined for it.
    if (match[1] !== '-') insertions += Number(match[1]);
    if (match[2] !== '-') deletions += Number(match[2]);
  }
  let untracked = 0;
  try {
    const listed = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
      cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
    untracked = listed.split('\n').filter((line) => line.trim()).length;
  } catch {
    // Counting untracked files is best-effort; the tracked half already answered.
  }
  return { available: true, files: files + untracked, insertions, deletions, untracked };
}

/**
 * **Only named deliverables decide. The diff is reported and never counted.**
 *
 * This is the correction the 2026-09-04 adversarial audit forced, and it is the whole design now.
 * `git diff` describes the *tree*, not a worker: run after a fan-out, or after the lead touched one
 * file itself, it attributes someone else's bytes to whoever is being measured. Reproduced: a
 * worker that produced nothing scored `PRODUCED · diff 1f +1/-0` because the lead had edited a
 * file. An instrument built to replace a plausible story must not itself hand back a plausible
 * number, so the diff lost its vote rather than gaining a caveat.
 *
 * The cost is deliberate and points the same way as the doctrine: without a FILE named in the
 * brief there is no verdict at all (`NOT-COMPUTABLE`). `agents/team-lead.md` already requires that
 * file for any work a gate will grade — so the instrument refuses exactly where the brief was
 * already non-compliant, and says so about the brief rather than about the worker.
 */
function decide(deliverables, _diff) {
  if (deliverables.length === 0) return 'NOT-COMPUTABLE';
  const withContent = deliverables.filter((d) => d.state === 'present');
  if (withContent.length === deliverables.length) return 'PRODUCED';
  if (withContent.length > 0) return 'PARTIAL';
  return 'EMPTY-RETURN';
}

/**
 * One line of facts, then the detail — the shape `agents/team-lead.md` asks the run log to carry.
 * Nothing here is an adjective: every token is a count taken from disk or from git.
 */
function render(verdict, options, deliverables, diff) {
  const facts = [verdict];
  if (options.label) facts.push(options.label);
  facts.push(`deliverables ${deliverables.filter((d) => d.state === 'present').length}/${deliverables.length}`);
  // Context, not evidence — labelled so nobody reads it as this worker's output. See decide().
  if (diff.available) facts.push(`tree ${diff.files}f +${diff.insertions}/-${diff.deletions} (unattributed)`);
  else facts.push(`tree unreadable (${firstLine(diff.reason)})`);

  const blocks = [facts.join(' · ')];
  for (const item of deliverables) {
    const detail = item.state === 'present' ? `${item.bytes}B content, ${item.lines} lines` : item.state;
    blocks.push(`  ${item.path} — ${detail}`);
  }
  if (verdict === 'EMPTY-RETURN') {
    blocks.push('  chase the worker once, explicitly; do not record this as "found nothing"');
  }
  if (verdict === 'NOT-COMPUTABLE') {
    blocks.push('  the brief named no FILE deliverable, so this return cannot be graded either way');
    blocks.push('  fix the brief (team-lead.md: "no file = task not done"); do not chase the worker over it');
  }
  return blocks.join('\n');
}

/**
 * Git's own first line of failure, trimmed to fit one fact. Without it the plain-text output cannot
 * tell "this directory is not a repo" (expected, harmless) from "the --base ref you passed does not
 * exist" (your mistake, and the diff half of the verdict is silently missing). Both used to print
 * the same three words, which is an instrument that cannot be diagnosed — the shape this repo keeps
 * recording. Found by `checker` on 2026-09-04 before merge.
 */
function firstLine(reason) {
  const text = String(reason || 'git failed').split('\n').map((l) => l.trim()).filter(Boolean);
  const meaningful = text.find((l) => /^fatal:|^error:/i.test(l)) || text[0] || 'git failed';
  return meaningful.length > 120 ? `${meaningful.slice(0, 117)}...` : meaningful;
}

const EXIT = { 'PRODUCED': 0, 'PARTIAL': 0, 'EMPTY-RETURN': 1, 'NOT-COMPUTABLE': 2 };

function run(argv) {
  const options = parseArgs(argv);
  const deliverables = options.deliverables.map((relative) => inspectDeliverable(options.cwd, relative));
  const diff = diffstat(options.cwd, options.base);
  const verdict = decide(deliverables, diff);
  const text = options.json
    ? JSON.stringify({ verdict, label: options.label, deliverables, diff }, null, 2)
    : render(verdict, options, deliverables, diff);
  return { verdict, text, exitCode: EXIT[verdict] };
}

if (require.main === module) {
  try {
    const result = run(process.argv.slice(2));
    process.stdout.write(`${result.text}\n`);
    process.exit(result.exitCode);
  } catch (error) {
    process.stderr.write(`worker-return-check: ${(error && error.message) || error}\n`);
    process.exit(2);
  }
}

module.exports = { parseArgs, contentBytes, inspectDeliverable, diffstat, decide, render, firstLine, run, EXIT };

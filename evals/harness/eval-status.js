#!/usr/bin/env node
'use strict';

/**
 * Eval provenance reporter — "is this green result still true?"
 *
 * `evals/README.md` mandates a re-run whenever an edited skill is named in `Skill under test`,
 * and until now nothing checked it. Measured 2026-07-25: 9 of 27 evals named a file that had
 * changed after their last run, and nothing distinguished those from genuinely fresh ones.
 *
 * This is the deterministic half of the harness: it reads disk and git, and prints a verdict.
 * It grades nothing about model behavior — that stays in the eval scenarios themselves.
 * Deterministic behavior gets a real test (AGENTS.md §Verification): eval-status.test.js.
 *
 * Verdicts, per eval:
 *   FRESH     — every file under test was last changed at or before the recorded run
 *   STALE     — at least one file changed after the run; the PASS no longer covers the file
 *   DIRTY     — a file under test has uncommitted changes, so no committed date describes it
 *   NEVER-RUN — has a `Files:` line but no parseable `Last run:` date
 *   NO-FILES  — no machine-readable `Files:` line, so staleness cannot be computed at all
 *
 * NO-FILES is deliberately its own verdict rather than being folded into FRESH. An eval whose
 * coverage cannot be computed must not read as covered — that is the silent-instrument trap
 * this repo has recorded six times.
 *
 * DIRTY exists for the same reason, and was added after the 2026-07-26 run surfaced it: the
 * comparison is against `git log`, which sees only *committed* history. In a dirty working tree
 * an edited-but-uncommitted file therefore reads FRESH — the number is right for the last commit
 * and wrong for what is on disk, which is the shape of every silent failure in this repo.
 *
 * Freshness is NOT an outcome. The same run also surfaced that `anchor-holds-the-line-deep-in-session`
 * records INCONCLUSIVE and still printed FRESH, so the report now carries the recorded outcome
 * (PASS / FAIL / INCONCLUSIVE / PENDING) beside the freshness verdict. An eval that never reached a
 * conclusion must not read like a passing one just because nobody has touched its subject since.
 *
 * Precision: `Last run:` may pin the commit the run was graded against —
 * `2026-08-02 (at cbf20c2) · PASS · …`. When a `(at <sha>)` is present and resolves in this repo,
 * freshness is computed exactly: a `Files:` path whose last change is not an ancestor of / equal to
 * that commit is STALE, full stop — no same-day grace. Measured 2026-08-02: `runCoversCommit`
 * deliberately treats a day-only run as covering its whole day (otherwise a run and a commit on the
 * same day always read STALE), and on a day the doctrine changed four times that grace hid two real
 * defects — `worker-claims-before-it-writes` and `lead-verifies-status-against-worktree` read FRESH
 * while grading files edited after they ran. A `(at <sha>)` opts a run out of that grace. Absent (or
 * unresolvable — a malformed sha is ignored, not fatal) it falls back to the day-precision behavior
 * unchanged, because 44 existing scenarios have no sha and must not all turn STALE at once. The
 * report marks which precision produced each verdict, so an imprecise (day-approximate) record
 * looks imprecise rather than reading exactly as sure as a pinned one.
 *
 * Run:  node evals/harness/eval-status.js [--strict] [--dir <path>]
 *       --strict  exit 1 if any eval is STALE or NEVER-RUN (for a release gate)
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// This repo is CRLF on disk. A regex ending in \n silently matches nothing here, and the
// failure mode looks like success. Always \r?\n. (AGENTS.md §Hard safety rules.)
const LINE_SPLIT = /\r?\n/;

/** A label line is `Word words:` at column 0 — the eval scenario format. */
const LABEL = /^([A-Za-z][A-Za-z ]*):[ \t]*(.*)$/;

/**
 * Read a labelled field plus its indented continuation lines.
 * Returns null when the label is absent, so callers can distinguish "absent" from "empty".
 */
function readField(text, label) {
  const lines = text.split(LINE_SPLIT);
  let value = null;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(LABEL);
    if (!m || m[1].toLowerCase() !== label.toLowerCase()) continue;
    const parts = [m[2]];
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j];
      if (next.trim() === '') break;
      if (LABEL.test(next)) break; // a new label ends the field
      if (!/^[ \t]/.test(next)) break; // continuations are indented
      parts.push(next.trim());
    }
    value = parts.join(' ').trim();
    break;
  }
  return value;
}

/** `Files:` is a comma/whitespace separated list of repo-relative paths. */
function parseFiles(raw) {
  if (raw === null) return null;
  return raw
    .split(/[,\s]+/)
    .map((s) => s.replace(/^[`'"]+|[`'"]+$/g, '').trim())
    .filter(Boolean);
}

/** The first ISO date in the `Last run:` value. `2026-07-18 · **PASS** (…)` → `2026-07-18`. */
function parseRunDate(raw) {
  if (raw === null) return null;
  const m = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[0] : null;
}

/**
 * The pinned commit in `Last run:`, e.g. `2026-08-02 (at cbf20c2) · PASS` → `cbf20c2`.
 * Only the *shape* is validated here (hex, 4-40 chars) — whether it names a real commit in this
 * repo is `resolveCommit`'s job. Anything that doesn't look like `(at <hex>)` returns null, which
 * is what sends a scenario down the unchanged day-precision path rather than crashing on it.
 */
function parseRunSha(raw) {
  if (raw === null) return null;
  const m = raw.match(/\(at\s+([0-9a-fA-F]{4,40})\)/);
  return m ? m[1] : null;
}

/**
 * Resolve a possibly-abbreviated ref to a full commit sha, or null when it names no commit this
 * repo knows about. A malformed or stale `(at <sha>)` must be ignored, not fatal — `--verify
 * --quiet` plus a caught error is what makes "not a real commit" a null instead of a thrown
 * exception that takes the whole report down with it.
 */
function resolveCommit(repoRoot, ref) {
  try {
    const out = execFileSync('git', ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

/** Same as `lastCommitISO`, but the sha — what pinned-commit freshness compares against. */
function lastCommitSHA(repoRoot, relPath) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%H', '--', relPath], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

/**
 * Is `ancestorSha` the pinned commit itself, or an ancestor of it? That is exact freshness: a file
 * whose last change is NOT this is a change the pinned run cannot have seen. `--is-ancestor` treats
 * a commit as its own ancestor, so "equal to" is covered for free. Any git failure (either sha
 * missing from this repo) reads as "not covered" rather than throwing.
 */
function isAncestorOrEqual(repoRoot, ancestorSha, descendantSha) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', ancestorSha, descendantSha], {
      cwd: repoRoot,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * The recorded outcome, which is a different axis from freshness.
 *
 * Read POSITIONALLY — the verdict is the token right after the date, per the scenario format
 * (`2026-07-18 · **PASS** (both arms)`). Scanning the whole value instead was the first version
 * of this function and it was wrong: run notes routinely describe what the *agent* did, so
 * "Arm B: FAIL + the literal SKIP" and "a Slack-first implementation would FAIL B2/B4" both
 * turned PASSing evals into reported failures. The instrument produced exactly the class of
 * false positive it exists to prevent; caught before it was reported, on 2026-07-26.
 *
 * The positional rule then produced the mirror defect: a **per-arm** verdict
 * (`2026-07-29 · **arm 1 FAIL · arm 2 PASS**`) starts with "arm", so nothing matched and the
 * outcome came back `null` — the run was reported as carrying no verdict at all. A recorded FAIL
 * that the machine cannot see is worse than one it reads wrongly: a misread prompts an argument,
 * an invisible one prompts nothing, and the summary line understated the non-PASS count without
 * anyone noticing. So: still positional first, but when the leading token is an arm marker rather
 * than a verdict, scan the arm verdicts and take the WORST — a split run is not a pass.
 */
const OUTCOME_SEVERITY = ['PASS', 'PENDING', 'INCONCLUSIVE', 'FAIL'];

function parseOutcome(raw) {
  if (raw === null) return null;
  const leading = raw.match(
    /^\s*(?:\d{4}-\d{2}-\d{2}\s*(?:·|-|—)?\s*)?\*{0,2}\s*(PASS|FAIL|INCONCLUSIVE|PENDING)\b/i
  );
  if (leading) return leading[1].toUpperCase();

  // No leading verdict. Only then consider per-arm markers — `arm 1 FAIL`, `arm2 PASS`, `Arm B:
  // INCONCLUSIVE`. Requiring the arm marker immediately before the verdict is what keeps this
  // from re-opening the 2026-07-26 false positive: prose like "would FAIL B2/B4" has no marker.
  const arms = [...raw.matchAll(/\barms?\s*[A-Za-z0-9]+\s*[:·—-]?\s*\*{0,2}\s*(PASS|FAIL|INCONCLUSIVE|PENDING)\b/gi)]
    .map((m) => m[1].toUpperCase());
  if (arms.length === 0) return null;
  return arms.reduce((worst, o) =>
    OUTCOME_SEVERITY.indexOf(o) > OUTCOME_SEVERITY.indexOf(worst) ? o : worst
  );
}

/** Paths with uncommitted modifications, staged or not. `git log` cannot describe these. */
function uncommittedPaths(repoRoot) {
  try {
    const out = execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return new Set(
      out
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => line.slice(3).trim().split(' -> ').pop())
    );
  } catch {
    return new Set();
  }
}

/**
 * Last commit date for a path, as an ISO-8601 instant, or null when git knows nothing
 * about it (untracked, or the path no longer exists).
 */
function lastCommitISO(repoRoot, relPath) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', relPath], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

/**
 * A run recorded as a date covers the whole of that day, so compare against its end.
 * Without this, an eval run and a commit on the same day always reads STALE.
 */
function runCoversCommit(runDate, commitISO) {
  const runEnd = Date.parse(`${runDate}T23:59:59.999Z`);
  const commit = Date.parse(commitISO);
  if (Number.isNaN(runEnd) || Number.isNaN(commit)) return true;
  return commit <= runEnd;
}

function evaluateOne(repoRoot, evalPath, dirty = new Set()) {
  const text = fs.readFileSync(evalPath, 'utf8');
  const name = path.basename(evalPath, '.md');
  const lastRun = readField(text, 'Last run');
  const files = parseFiles(readField(text, 'Files'));
  const runDate = parseRunDate(lastRun);
  const outcome = parseOutcome(lastRun);
  const rawSha = parseRunSha(lastRun);
  const runSha = rawSha ? resolveCommit(repoRoot, rawSha) : null;
  // 'commit' = exact, computed against a resolved sha. 'day' = the unchanged fallback: same-day
  // grace, because the record names no commit at all (or named one this repo cannot resolve — a
  // malformed/stale sha degrades to day precision instead of failing the whole scenario).
  const precision = runSha ? 'commit' : runDate ? 'day' : null;

  if (!files || files.length === 0) {
    return { name, verdict: 'NO-FILES', outcome, files: [], runDate, runSha, precision, changed: [], missing: [], dirty: [] };
  }
  if (!runDate) {
    return { name, verdict: 'NEVER-RUN', outcome, files, runDate: null, runSha: null, precision: null, changed: [], missing: [], dirty: [] };
  }

  const changed = [];
  const missing = [];
  const uncommitted = [];
  for (const rel of files) {
    if (!fs.existsSync(path.join(repoRoot, rel))) missing.push(rel);
    if (dirty.has(rel.replace(/\\/g, '/'))) uncommitted.push(rel);

    const commitISO = lastCommitISO(repoRoot, rel);
    if (!commitISO) continue; // untracked or gone — nothing committed to compare against

    const stale = runSha
      ? !isAncestorOrEqual(repoRoot, lastCommitSHA(repoRoot, rel) || '', runSha)
      : !runCoversCommit(runDate, commitISO);
    if (stale) changed.push({ file: rel, changed: commitISO.slice(0, 10) });
  }

  // A changed-and-committed file is the stronger statement, so STALE wins over DIRTY.
  const verdict = changed.length > 0 ? 'STALE' : uncommitted.length > 0 ? 'DIRTY' : 'FRESH';
  return { name, verdict, outcome, files, runDate, runSha, precision, changed, missing, dirty: uncommitted };
}

function scan(repoRoot, evalsDir) {
  const dirty = uncommittedPaths(repoRoot);
  return fs
    .readdirSync(evalsDir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort()
    .map((f) => evaluateOne(repoRoot, path.join(evalsDir, f), dirty));
}

function report(results) {
  const order = { STALE: 0, DIRTY: 1, 'NEVER-RUN': 2, 'NO-FILES': 3, FRESH: 4 };
  const counts = { FRESH: 0, STALE: 0, DIRTY: 0, 'NEVER-RUN': 0, 'NO-FILES': 0 };

  for (const r of [...results].sort((a, b) => order[a.verdict] - order[b.verdict] || a.name.localeCompare(b.name))) {
    counts[r.verdict]++;
    const detail =
      r.verdict === 'STALE'
        ? ` — run ${r.runDate}; changed since: ${r.changed.map((c) => `${c.file} (${c.changed})`).join(', ')}`
        : r.verdict === 'DIRTY'
          ? ` — run ${r.runDate}; uncommitted right now: ${r.dirty.join(', ')}`
          : r.verdict === 'NO-FILES'
            ? ' — add a `Files:` line to make coverage computable'
            : r.verdict === 'NEVER-RUN'
              ? ' — no parseable date on `Last run:`'
              : ` — run ${r.runDate}`;
    // Freshness and outcome are different axes; a non-PASS outcome is shown so a
    // never-concluded eval cannot read like a passing one.
    const outcome = r.outcome && r.outcome !== 'PASS' ? `  [${r.outcome}]` : '';
    // Precision is a THIRD axis: an imprecise (day-approximate) record must look imprecise, not
    // read with the same confidence as a commit-pinned one. Only shown where freshness was
    // actually computed — NO-FILES/NEVER-RUN carry no precision at all.
    const precisionTag =
      r.precision === 'commit' ? '  [@commit]' : r.precision === 'day' ? '  [~day]' : '';
    console.log(`  ${r.verdict.padEnd(9)} ${r.name}${precisionTag}${outcome}${detail}`);
    for (const m of r.missing) console.log(`            ! listed file does not exist: ${m}`);
  }

  const total = results.length;
  const unconcluded = results.filter((r) => r.outcome && r.outcome !== 'PASS');
  const commitPinned = results.filter((r) => r.precision === 'commit').length;
  const dayApprox = results.filter((r) => r.precision === 'day').length;
  console.log(
    `\n  ${total} evals — ${counts.FRESH} fresh, ${counts.STALE} stale, ${counts.DIRTY} dirty, ` +
      `${counts['NEVER-RUN']} never run, ${counts['NO-FILES']} not computable`
  );
  console.log(
    `  ${commitPinned} commit-pinned (exact) · ${dayApprox} day-approximate (same-day grace, ` +
      `may under-report staleness)`
  );
  if (unconcluded.length) {
    console.log(
      `  ${unconcluded.length} did not record a PASS — freshness says nothing about outcome: ` +
        unconcluded.map((r) => `${r.name} [${r.outcome}]`).join(', ')
    );
  }
  return counts;
}

function main(argv) {
  const strict = argv.includes('--strict');
  const dirIdx = argv.indexOf('--dir');
  const repoRoot = dirIdx !== -1 ? path.resolve(argv[dirIdx + 1]) : path.resolve(__dirname, '..', '..');
  const evalsDir = path.join(repoRoot, 'evals');

  if (!fs.existsSync(evalsDir)) {
    console.error(`no evals/ directory under ${repoRoot}`);
    process.exit(2);
  }

  const results = scan(repoRoot, evalsDir);
  const counts = report(results);

  if (strict && (counts.STALE > 0 || counts.DIRTY > 0 || counts['NEVER-RUN'] > 0)) {
    console.error('\n  --strict: stale, dirty or never-run evals present');
    process.exit(1);
  }
}

module.exports = {
  readField,
  parseFiles,
  parseRunDate,
  parseRunSha,
  resolveCommit,
  lastCommitSHA,
  isAncestorOrEqual,
  parseOutcome,
  uncommittedPaths,
  runCoversCommit,
  evaluateOne,
  scan,
};

if (require.main === module) main(process.argv.slice(2));

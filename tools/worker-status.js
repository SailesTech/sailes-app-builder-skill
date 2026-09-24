#!/usr/bin/env node
'use strict';

/**
 * worker-status — reads and validates `.claude/status/<worker-id>.md`, the file a worker claims at the
 * start of its run and closes at the end.
 *
 * The problem it exists for, measured 2026-08-01: a lead reported finished work as unfinished,
 * twice, because three genuinely different states — never started, died mid-run, finished and
 * reported — were all one silence. Nothing on disk distinguished them, so the lead's only signal
 * was a transcript, which is a worker's narration of itself, not a claim it made before doing the
 * work. This tool exists to make the three states look different:
 *
 *   no file at all           -> "never started"
 *   file present, no closed: -> "died mid-run" (or is still running — indistinguishable from
 *                                outside, which is fine: both mean "not done, go look")
 *   file present and closed, -> a declaration: what the worker committed to before starting, and
 *   with a complete block       whether it closed the loop, in the worker's own words, made after
 *                                the fact by the one that did the work.
 *
 * Q3 of the governing spec (2026-08-01-delegation-precision-and-agent-control.md): this tool
 * REPORTS loudly. It never blocks a gate — a lead reads its exit code and message when deciding
 * whether to accept, chase, or write a worker off. It is not wired into `npm test`.
 *
 *   node tools/worker-status.js <file>          # validate one status file
 *   node tools/worker-status.js --sweep         # list every file still open/present in
 *                                                # .claude/status/, plus any that fell back into
 *                                                # .claude/worktrees/<name>/.claude/status/
 *   node tools/worker-status.js --sweep <dir>   # list every file still open or still present in
 *                                                # exactly that directory — no worktree walk
 *   node tools/worker-status.js --verify <file> --worktree <path>
 *                                                # check the CLOSED declaration against the tree it
 *                                                # describes: does the sha exist, does `touched`
 *                                                # match the diff both ways, was `base` an ancestor,
 *                                                # and does every declared file hold any content
 *
 * Exit codes: 0 = file is a complete, valid, closed status (or an empty sweep). 1 = anything else
 * — no file, an unclosed file, a closed file with a field missing, a non-empty sweep, or a
 * `--verify` that found a discrepancy (reported, never a reason to block integration). The three
 * states above are distinguished by MESSAGE, not by exit code, because the contract this tool
 * implements only ever asks a lead to read the reason, not to branch a script on which failure it
 * was.
 *
 * The file body is a small, fixed YAML shape (see worker-status-template.md) — not general YAML.
 * Parsing it by hand keeps this at zero dependencies; a real YAML parser would be solving a much
 * bigger problem than "read six flat keys and two inline lists".
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REQUIRED_OPEN_FIELDS = ['worker', 'task', 'base', 'claimed', 'opened'];
const REQUIRED_CLOSE_FIELDS = ['closed', 'outcome', 'touched'];
const VALID_OUTCOMES = ['done', 'blocked', 'policy-refusal'];

// Default target of a bare `--sweep` (no directory argument). Its sibling inside `.claude/` is
// where a worker's fallback claim lands when the outside-worktree Write is refused — see
// findWorktreeStatusFallbacks() below, which walks `.claude/worktrees/*/.claude/status/`.
const DEFAULT_STATUS_DIR = path.join('.claude', 'status');

/**
 * Strips a trailing `# comment` from a YAML-ish scalar, but only when the `#` sits outside any
 * quoted string and outside any `[...]` list — a `#` inside a claimed path or a quoted task title
 * is data, not a comment. Requires the `#` be preceded by whitespace (or be the first character),
 * matching how every real fixture and template in this repo writes trailing comments.
 */
function stripTrailingComment(value) {
  let quote = null;
  let depth = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (quote) {
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === '[') depth++;
    if (c === ']') depth = Math.max(0, depth - 1);
    if (c === '#' && depth === 0 && (i === 0 || /\s/.test(value[i - 1]))) {
      return value.slice(0, i);
    }
  }
  return value;
}

/** Parses one scalar value: a `["a", "b"]` list, a quoted string, or a bare token (sha, timestamp). */
function parseValue(raw) {
  const v = raw.trim();
  if (v === '') return '';
  if (v.startsWith('[')) {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Fall through to the naive split below — a hand-edited list with single quotes or a
      // trailing comma is still a list, and refusing to read it helps nobody.
    }
    const inner = v.replace(/^\[/, '').replace(/\]$/, '');
    return inner
      .split(',')
      .map((s) => s.trim().replace(/^["']|["']$/g, ''))
      .filter((s) => s.length > 0);
  }
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

/**
 * Reads the flat `key: value` shape described in worker-status-template.md. Tolerant of CRLF and
 * LF (this repo is mixed on disk — never assume one) and of full-line `#` comments like the
 * template's own "appended at closure" marker.
 */
function parseStatus(text) {
  const fields = {};
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (/^\s*#/.test(line)) continue; // a full-line comment, not a field
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!m) continue; // not a `key: value` line — ignore rather than fail on stray prose
    const key = m[1];
    const value = stripTrailingComment(m[2]);

    if (value.trim() === '') {
      // Bare `key:` — look ahead for an indented block list. Stop at the first line that is not
      // a `  - item` entry (blank line, next `key:`, a comment, or end of file).
      const items = [];
      let j = i + 1;
      while (j < lines.length) {
        const itemMatch = lines[j].match(/^\s+-\s*(.*)$/);
        if (!itemMatch) break;
        items.push(stripTrailingComment(itemMatch[1]).trim().replace(/^["']|["']$/g, ''));
        j++;
      }
      if (items.length > 0) {
        fields[key] = items;
        i = j - 1; // skip the block-list lines already consumed
        continue;
      }
      fields[key] = ''; // a genuinely empty scalar, e.g. an omitted `commit:`
      continue;
    }

    fields[key] = parseValue(value);
  }
  return fields;
}

function isMissing(value) {
  // An empty list ([]) is a valid "claimed nothing yet" / "touched nothing" — only an ABSENT
  // field, or an empty scalar, counts as missing.
  return value === undefined || value === '';
}

/**
 * Validates one status file's content against the contract. Returns:
 *   { state: 'never-started' | 'died-mid-run' | 'invalid' | 'ok', ok: boolean, messages: string[],
 *     fields }
 * `state` is for the sweep listing below; `ok`/`messages` is what the CLI reports.
 */
function evaluateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      state: 'never-started',
      ok: false,
      messages: [`worker-status: ${filePath} — no file: never started`],
      fields: null,
    };
  }

  const text = fs.readFileSync(filePath, 'utf8');
  const fields = parseStatus(text);
  const worker = fields.worker || '(worker not recorded)';
  const base = fields.base || '(base not recorded)';

  const openProblems = REQUIRED_OPEN_FIELDS.filter((f) => isMissing(fields[f])).map(
    (f) => `missing required field "${f}:"`
  );

  // The claim block is checked for SHAPE while the file is still open, not only at closure.
  // Measured 2026-08-02 on the first live run of this mechanism: a worker wrote `claimed: 2026-08-02`
  // — a date where a path list belongs — and nothing said so, because shape was graded on close only.
  // That is backwards. If the worker dies, the claim block is ALL that survives, and its single job
  // is to say which files were taken; a claim nobody can read is the state this artifact exists to
  // prevent, discovered at the moment it can no longer be fixed.
  const claimShapeProblems = [];
  if (fields.claimed !== undefined && !Array.isArray(fields.claimed)) {
    claimShapeProblems.push('"claimed" must be a list of paths, e.g. ["path/a", "path/b"]');
  }

  if (isMissing(fields.closed)) {
    // Died mid-run and still-running are indistinguishable from this file alone, and the spec
    // treats that as correct: both mean "not done, go look" to a lead deciding whether to chase.
    const messages = [
      `worker-status: ${filePath} — no "closed:" — ${worker} died mid-run (base ${base})`,
    ];
    for (const p of openProblems) messages.push(`  also: ${p}`);
    for (const p of claimShapeProblems) messages.push(`  also: ${p}`);
    return { state: 'died-mid-run', ok: false, messages, fields };
  }

  const problems = [...openProblems];
  for (const f of REQUIRED_CLOSE_FIELDS) {
    if (isMissing(fields[f])) problems.push(`missing required field "${f}:"`);
  }
  // `outcome:` is a token, and every real worker so far has written it as a token FOLLOWED BY a
  // reason — `done — sha-pinned freshness implemented, tests green`. Measured 2026-08-02 on two
  // independent files: both were rejected outright for it. Refusing a field because it carries more
  // information than the minimum is the validator being pedantic at the reader's expense, so the
  // token is read off the front and anything after a separator is kept as prose.
  const outcomeToken =
    typeof fields.outcome === 'string' ? fields.outcome.split(/\s+[—–-]\s+|\s*[;:]\s*/)[0].trim() : fields.outcome;
  if (fields.outcome !== undefined && !VALID_OUTCOMES.includes(outcomeToken)) {
    problems.push(
      `outcome "${fields.outcome}" does not start with one of ${VALID_OUTCOMES.join('|')}`
    );
  }
  // `commit:` must LOOK like a commit. Measured 2026-08-02: a worker with nothing to commit wrote
  // its reason into the field — "(none — I am in the MAIN working tree…)" — and it satisfied the
  // very check that exists to make `done` verifiable. A field whose whole job is to be checkable
  // must reject prose, or it launders an explanation into evidence. A trailing note after the sha
  // is fine; a value with no sha at its front is not.
  if (!isMissing(fields.commit) && typeof fields.commit === 'string') {
    if (!/^[0-9a-f]{7,40}\b/i.test(fields.commit.trim())) {
      problems.push(
        `commit "${fields.commit}" does not start with a sha — put the reason in "note:", not here`
      );
    }
  }
  if (outcomeToken === 'done' && isMissing(fields.commit)) {
    // The whole point of Q3/D4.2: "done" is a claim, `commit:` is what makes it checkable. A done
    // with nothing to point at is exactly the silence this file was built to remove.
    problems.push('outcome: done requires "commit:" — a done result with nothing to point at');
  }
  for (const p of claimShapeProblems) problems.push(p);
  if (fields.touched !== undefined && !Array.isArray(fields.touched)) {
    problems.push('"touched" must be a list of paths, e.g. ["path/a", "path/b"]');
  }

  if (problems.length) {
    return {
      state: 'invalid',
      ok: false,
      messages: [`worker-status: ${filePath} — closed but invalid:`, ...problems.map((p) => `  ${p}`)],
      fields,
    };
  }

  return {
    state: 'ok',
    ok: true,
    messages: [
      `worker-status: ${filePath} — ok: ${worker} closed, outcome ${fields.outcome}` +
        (fields.commit ? ` (commit ${fields.commit})` : ''),
    ],
    fields,
  };
}

/**
 * Formats one sweep listing line for a status file that already evaluated to `result`. `worktree`,
 * when given, prefixes the line with a label so a fallback claim (one that landed inside a worker's
 * worktree because the outside-worktree Write was refused) reads differently from a normal claim in
 * the main status directory — same three markers (OPEN / LEFTOVER / INVALID), same reasoning, just
 * tagged with where it was found.
 */
function formatSweepLine(name, result, worktree) {
  const label = worktree ? `[worktree ${worktree}] ` : '';
  if (result.state === 'died-mid-run') {
    const worker = result.fields.worker || '(worker not recorded)';
    const base = result.fields.base || '(base not recorded)';
    return `  OPEN      ${label}${name} — ${worker} has not closed (base ${base})`;
  }
  if (result.state === 'ok') {
    return (
      `  LEFTOVER  ${label}${name} — closed (outcome ${result.fields.outcome}) but still on disk: ` +
      `accept it into the run log and delete it`
    );
  }
  return `  INVALID   ${label}${name} — ${result.messages.join(' ')}`;
}

/**
 * Finds status files that fell back into a worker's own worktree — `.claude/worktrees/<name>/
 * .claude/status/*.md` — because the outside-worktree Write the doctrine normally uses was refused by the
 * harness (measured 2026-08-02: Write enforces the worktree boundary, Bash does not, so a worker
 * following doctrine writes its claim inside its own worktree instead). A worktree directory with
 * no `.claude/status/` is the normal case — most worktrees never hit the fallback — and is skipped
 * silently, not reported as a problem. Never throws on a missing `.claude/worktrees/`: that is the
 * expected shape of a repo that isn't mid-swarm.
 */
function findWorktreeStatusFallbacks(worktreesRoot) {
  const results = [];
  if (!fs.existsSync(worktreesRoot)) return results;

  let worktreeDirs;
  try {
    worktreeDirs = fs
      .readdirSync(worktreesRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch {
    return results; // unreadable worktrees root — treat like "nothing to sweep", not a crash
  }

  for (const worktree of worktreeDirs) {
    const statusDir = path.join(worktreesRoot, worktree, '.claude', 'status');
    if (!fs.existsSync(statusDir)) continue; // no fallback here — the normal case, skip silently

    let names;
    try {
      names = fs
        .readdirSync(statusDir, { withFileTypes: true })
        .filter((e) => e.isFile() && e.name.endsWith('.md'))
        .map((e) => e.name)
        .sort();
    } catch {
      continue;
    }
    for (const name of names) {
      results.push({ worktree, dir: statusDir, name });
    }
  }
  return results;
}

/**
 * `--sweep <dir>`: the directory-level check for the invariant this whole file exists to hold —
 * "whatever sits in .claude/status/ is either still running, dead, or awaiting acceptance" (Design
 * §3b). It never distinguishes those three further than that; a lead reads the per-file reason.
 * An empty directory is the ONLY passing case, and it is also the fixture most likely to be broken
 * by a careless "any file present -> fail" rewrite, which is why it is tested explicitly below.
 *
 * `opts.walkWorktrees` additionally scans `.claude/worktrees/<name>/.claude/status/*.md` (sibling of
 * `dir`'s parent) and folds what it finds into the same listing, each line labelled with the
 * worktree it came from. Only set by `main()` for a bare `--sweep` with no directory argument —
 * `--sweep <dir>` keeps scanning exactly that one directory, no worktree walk, unchanged from
 * before this walk existed.
 */
function sweep(dir, opts = {}) {
  const walkWorktrees = opts.walkWorktrees === true;
  const worktreeFindings = walkWorktrees
    ? findWorktreeStatusFallbacks(path.join(path.dirname(dir), 'worktrees'))
    : [];

  const dirExists = fs.existsSync(dir);
  const localNames = dirExists
    ? fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isFile() && e.name.endsWith('.md'))
        .map((e) => e.name)
        .sort()
    : [];

  if (!dirExists) {
    if (worktreeFindings.length === 0) {
      console.log(`worker-status --sweep: ${dir} does not exist — nothing to sweep`);
      return 0;
    }
    console.error(
      `worker-status --sweep: ${dir} does not exist, but found ${worktreeFindings.length} fallback ` +
        `file(s) in worktree status directories:`
    );
    for (const { worktree, dir: wdir, name } of worktreeFindings) {
      const result = evaluateFile(path.join(wdir, name));
      console.error(formatSweepLine(name, result, worktree));
    }
    return 1;
  }

  const totalCount = localNames.length + worktreeFindings.length;

  if (totalCount === 0) {
    console.log(`worker-status --sweep: ${dir} is empty — nothing pending`);
    return 0;
  }

  const suffix = walkWorktrees && worktreeFindings.length > 0 ? ' (including worktree fallbacks)' : '';
  console.error(
    `worker-status --sweep: ${totalCount} file(s) in ${dir}${suffix} — each is still running, dead, or ` +
      `awaiting the lead's accept-and-remove step (Design §3b):`
  );
  for (const name of localNames) {
    const filePath = path.join(dir, name);
    const result = evaluateFile(filePath);
    console.error(formatSweepLine(name, result));
  }
  for (const { worktree, dir: wdir, name } of worktreeFindings) {
    const result = evaluateFile(path.join(wdir, name));
    console.error(formatSweepLine(name, result, worktree));
  }
  return 1;
}

/**
 * Runs `git` inside a worktree and returns stdout, or `null` when the command fails. Every caller
 * treats `null` as "could not establish", never as "no". A verification that reports absence when
 * it merely failed to look is the silent-instrument shape this repo keeps recording.
 */
function git(worktree, args) {
  try {
    return execFileSync('git', args, { cwd: worktree, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    return null;
  }
}

/** Files that are empty by design — a worker declaring one is truthful, not hollow. */
const EMPTY_BY_CONVENTION = new Set(['.gitkeep', '.keep', '__init__.py']);

/**
 * Checks a CLOSED declaration against the tree it describes — the half `evaluateFile` cannot do.
 *
 * `evaluateFile` grades the file against itself: is `commit` shaped like a sha, is `outcome` a
 * known token, is `touched` a list. Every one of those passes on a declaration that is internally
 * perfect and factually false, because nothing in it ever reads the repository. `agents/team-lead.md`
 * (Agent lifecycle) already puts that reading on the lead — *"does `commit` exist, does `touched`
 * match `git diff --stat`, was `base` current"* — as three manual steps. This is those three steps,
 * plus the one the doctrine does not name: **a declared file can exist and be empty.**
 *
 * Contract, unchanged from the tool's Q3: it REPORTS, it never blocks. Every finding is a line for
 * the lead's judgment and the run log, and the doctrine is explicit that a discrepancy here is
 * reported loudly and integration proceeds — this repo has two documented checks disabled for
 * crying wolf.
 *
 * Returns { ok, messages, findings } where `findings` names each discrepancy by kind.
 */
function verifyAgainstTree(filePath, worktree) {
  const base = evaluateFile(filePath);
  if (base.state === 'never-started' || base.state === 'died-mid-run') {
    return {
      ok: false,
      findings: [{ kind: 'not-closed', detail: base.state }],
      messages: [...base.messages, '  nothing to verify: a declaration is only checkable once it is closed'],
    };
  }
  if (!fs.existsSync(worktree)) {
    return {
      ok: false,
      findings: [{ kind: 'worktree-missing', detail: worktree }],
      messages: [`worker-status: ${filePath} — cannot verify: worktree ${worktree} does not exist`],
    };
  }

  const fields = base.fields || {};
  const findings = [];
  const messages = [];
  const commit = typeof fields.commit === 'string' ? fields.commit.trim().split(/\s+/)[0] : '';
  const declaredBase = typeof fields.base === 'string' ? fields.base.trim().split(/\s+/)[0] : '';
  const touched = Array.isArray(fields.touched) ? fields.touched : [];

  // (1) Does the sha exist at all? A `done` pointing at nothing is the failure `commit:` exists to
  //     make impossible, and it survives every shape check because it is shaped correctly.
  if (commit) {
    const exists = git(worktree, ['cat-file', '-e', `${commit}^{commit}`]) !== null;
    if (!exists) findings.push({ kind: 'commit-missing', detail: commit });
  }

  // (2) Does `touched` match what the commit actually changed — in BOTH directions. A file changed
  //     and not declared is as much a discrepancy as one declared and not changed; only one of the
  //     two gets noticed by a human skimming, which is why both are named here.
  let changed = null;
  if (commit && !findings.some((f) => f.kind === 'commit-missing')) {
    const range = declaredBase ? `${declaredBase}..${commit}` : `${commit}^..${commit}`;
    const out = git(worktree, ['diff', '--name-only', range]);
    if (out !== null) changed = out.split('\n').map((l) => l.trim()).filter(Boolean);
  }
  if (changed === null) {
    findings.push({ kind: 'diff-unreadable', detail: 'could not read the range; touched is unverified' });
  } else {
    const norm = (p) => String(p).replace(/\\/g, '/').replace(/^\.\//, '');
    const declared = new Set(touched.map(norm));
    const actual = new Set(changed.map(norm));
    for (const p of declared) if (!actual.has(p)) findings.push({ kind: 'declared-not-changed', detail: p });
    for (const p of actual) if (!declared.has(p)) findings.push({ kind: 'changed-not-declared', detail: p });
  }

  // (3) Was `base` current — i.e. is it an ancestor of the commit? A worker that branched from a
  //     stale base produces a diff that reads clean and merges into something else.
  if (declaredBase && commit && !findings.some((f) => f.kind === 'commit-missing')) {
    const ancestor = git(worktree, ['merge-base', '--is-ancestor', declaredBase, commit]) !== null;
    if (!ancestor) findings.push({ kind: 'base-not-ancestor', detail: `${declaredBase} is not an ancestor of ${commit}` });
  }

  // (4) The one the doctrine does not name: a declared file can exist and hold nothing. Existence
  //     is what `-e` tests and what a diff line proves; neither says a single character was
  //     written. An empty artifact satisfies "no file = task not done" by the letter alone.
  for (const relative of touched) {
    const absolute = path.resolve(worktree, String(relative));
    if (!fs.existsSync(absolute)) continue; // absence is already covered by (2)
    if (EMPTY_BY_CONVENTION.has(path.basename(String(relative)))) continue;
    let content = '';
    try {
      content = fs.readFileSync(absolute, 'utf8');
    } catch {
      findings.push({ kind: 'unreadable', detail: String(relative) });
      continue;
    }
    if (content.replace(/\s/g, '').length === 0) {
      findings.push({ kind: 'declared-empty', detail: String(relative) });
    }
  }

  const worker = fields.worker || '(worker not recorded)';
  if (findings.length === 0) {
    messages.push(`worker-status: ${filePath} — verified: ${worker}'s declaration matches the tree (${touched.length} file(s), commit ${commit || 'n/a'})`);
    return { ok: true, findings, messages };
  }

  messages.push(`worker-status: ${filePath} — ${findings.length} discrepancy(ies) between declaration and tree:`);
  for (const f of findings) messages.push(`  ${f.kind}: ${f.detail}`);
  messages.push('  REPORT this into the verdict and the run log; do NOT block integration on it');
  return { ok: false, findings, messages };
}

function main(argv) {
  if (argv[0] === '--sweep') {
    const explicitDir = argv[1];
    const dir = explicitDir || DEFAULT_STATUS_DIR;
    // Only a bare `--sweep` (no explicit dir) also walks worktree fallbacks — `--sweep <dir>`
    // keeps today's behaviour exactly: that one directory, nothing else.
    return sweep(dir, { walkWorktrees: !explicitDir });
  }

  if (argv[0] === '--verify') {
    const filePath = argv[1];
    const flagIndex = argv.indexOf('--worktree');
    const worktree = flagIndex === -1 ? '.' : argv[flagIndex + 1];
    if (!filePath || filePath === '--worktree' || (flagIndex !== -1 && !worktree)) {
      console.error('usage: node tools/worker-status.js --verify <file> [--worktree <path>]');
      return 2;
    }
    const result = verifyAgainstTree(filePath, worktree);
    for (const m of result.messages) (result.ok ? console.log : console.error)(m);
    return result.ok ? 0 : 1;
  }

  const filePath = argv[0];
  if (!filePath) {
    console.error('usage: node tools/worker-status.js <file>');
    console.error('       node tools/worker-status.js --sweep <dir>');
    console.error('       node tools/worker-status.js --verify <file> [--worktree <path>]');
    return 2;
  }

  const result = evaluateFile(filePath);
  for (const m of result.messages) {
    (result.ok ? console.log : console.error)(m);
  }
  return result.ok ? 0 : 1;
}

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}

module.exports = {
  evaluateFile,
  verifyAgainstTree,
  sweep,
  parseStatus,
  main,
  findWorktreeStatusFallbacks,
  formatSweepLine,
  DEFAULT_STATUS_DIR,
};

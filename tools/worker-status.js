#!/usr/bin/env node
'use strict';

/**
 * worker-status — reads and validates `.claude/status/<worker-id>.md`, the file a worker claims at
 * the start of its run and closes at the end.
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
 *   node tools/worker-status.js --sweep <dir>   # list every file still open or still present
 *
 * Exit codes: 0 = file is a complete, valid, closed status (or an empty sweep). 1 = anything else
 * — no file, an unclosed file, a closed file with a field missing, or a non-empty sweep. The three
 * states above are distinguished by MESSAGE, not by exit code, because the contract this tool
 * implements only ever asks a lead to read the reason, not to branch a script on which failure it
 * was.
 *
 * The file body is a small, fixed YAML shape (see worker-status-template.md) — not general YAML.
 * Parsing it by hand keeps this at zero dependencies; a real YAML parser would be solving a much
 * bigger problem than "read six flat keys and two list-valued fields".
 *
 * Why `.claude/status/`, not `.ai/status/` (moved 2026-08-02): a status file is live runtime
 * state — the same category as a PID file — and the Unix convention puts that in a shared runtime
 * directory, never inside the data it describes and never inside the unit it describes. `AGENTS.md`
 * is explicit that `.ai/` is memory, not scratch, so an ephemeral gitignored directory nested inside
 * it is an anomaly someone eventually commits by habit. `.claude/worktrees/` is the existing
 * precedent for shared ephemeral state living under `.claude/`, not `.ai/`.
 *
 * Append-only close: a worker claims the file once (the open block, `worker` through `opened`)
 * and later APPENDS the closing block (`closed` through `touched`/`note`) beneath it — it never
 * rewrites or truncates the open block to add the close one. This matters to THIS reader, not just
 * to worker discipline: `--sweep` can observe a file at any point in its lifetime, including mid-
 * write, and a writer that rewrites-in-place (truncate, then write the whole file back out) can be
 * caught by a sweep between those two steps with a file that is momentarily empty or half-written —
 * which this tool would have to report as "invalid" or worse, not as "still running". A writer that
 * only ever appends can, at worst, be caught with the open block present and the close block not
 * yet started, which is exactly the pre-existing, correctly-handled "died mid-run" (or still
 * running) state. Append-only is what keeps every partial read a VALID intermediate state instead
 * of a corrupt one.
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_OPEN_FIELDS = ['worker', 'task', 'base', 'claimed', 'opened'];
const REQUIRED_CLOSE_FIELDS = ['closed', 'outcome', 'touched'];
const VALID_OUTCOMES = ['done', 'blocked', 'policy-refusal'];

// A status file is live runtime state — the same category as a PID file — so it lives in a shared
// runtime directory, never inside the data it describes (`.ai/`, which AGENTS.md is explicit is
// memory, not scratch) and never inside the unit it describes. `.claude/worktrees/` is the existing
// precedent for shared ephemeral state living under `.claude/`.
const DEFAULT_STATUS_DIR = '.claude/status';

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
 *
 * List-valued fields (`claimed`, `touched`) accept BOTH syntaxes the doctrine and real usage both
 * produce: inline (`claimed: ["a", "b"]`, handled by parseValue) and block —
 *
 *   claimed:
 *     - a
 *     - b
 *
 * — a bare `key:` with nothing after the colon, followed by one or more `  - item` lines. The
 * first real status file ever written (2026-08-02) used block form and was rejected: the validator
 * was stricter than the format it validates. A `key:` line with no trailing block list is still a
 * legal empty scalar (e.g. an omitted `commit:`), so block detection only fires when at least one
 * `- ` line actually follows.
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
        const itemValue = stripTrailingComment(itemMatch[1]).trim().replace(/^["']|["']$/g, '');
        items.push(itemValue);
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

  if (isMissing(fields.closed)) {
    // Died mid-run and still-running are indistinguishable from this file alone, and the spec
    // treats that as correct: both mean "not done, go look" to a lead deciding whether to chase.
    const messages = [
      `worker-status: ${filePath} — no "closed:" — ${worker} died mid-run (base ${base})`,
    ];
    for (const p of openProblems) messages.push(`  also: ${p}`);
    return { state: 'died-mid-run', ok: false, messages, fields };
  }

  const problems = [...openProblems];
  for (const f of REQUIRED_CLOSE_FIELDS) {
    if (isMissing(fields[f])) problems.push(`missing required field "${f}:"`);
  }
  if (fields.outcome !== undefined && !VALID_OUTCOMES.includes(fields.outcome)) {
    problems.push(`outcome "${fields.outcome}" is not one of ${VALID_OUTCOMES.join('|')}`);
  }
  if (fields.outcome === 'done' && isMissing(fields.commit)) {
    // The whole point of Q3/D4.2: "done" is a claim, and there must be something checkable behind
    // it. Usually that is `commit:` — but a plan-only or docs-only task's evidence is a FILE, not a
    // commit, so a non-empty `touched:` paired with a `note:` explaining what it points at is the
    // other legal form of "checkable". An empty `commit` with an empty `touched` still fails: that
    // really is "a done result with nothing to point at".
    const touchedList = Array.isArray(fields.touched) ? fields.touched : [];
    const hasEvidence = touchedList.length > 0 && !isMissing(fields.note);
    if (!hasEvidence) {
      problems.push(
        'outcome: done requires "commit:", or a non-empty "touched:" plus "note:" — a done ' +
          'result with nothing to point at'
      );
    }
  }
  if (fields.claimed !== undefined && !Array.isArray(fields.claimed)) {
    problems.push('"claimed" must be a list of paths, e.g. ["path/a", "path/b"]');
  }
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
 * `--sweep [dir]` (defaults to `.claude/status/`): the directory-level check for the invariant
 * this whole file exists to hold — "whatever sits there is either still running, dead, or awaiting
 * acceptance" (Design §3b). It never distinguishes those three further than that; a lead reads the
 * per-file reason.
 * An empty directory is the ONLY passing case, and it is also the fixture most likely to be broken
 * by a careless "any file present -> fail" rewrite, which is why it is tested explicitly below.
 */
function sweep(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`worker-status --sweep: ${dir} does not exist — nothing to sweep`);
    return 0;
  }
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => e.name)
    .sort();

  if (entries.length === 0) {
    console.log(`worker-status --sweep: ${dir} is empty — nothing pending`);
    return 0;
  }

  console.error(
    `worker-status --sweep: ${entries.length} file(s) in ${dir} — each is still running, dead, or ` +
      `awaiting the lead's accept-and-remove step (Design §3b):`
  );
  for (const name of entries) {
    const filePath = path.join(dir, name);
    const result = evaluateFile(filePath);
    if (result.state === 'died-mid-run') {
      const worker = result.fields.worker || '(worker not recorded)';
      const base = result.fields.base || '(base not recorded)';
      console.error(`  OPEN      ${name} — ${worker} has not closed (base ${base})`);
    } else if (result.state === 'ok') {
      console.error(
        `  LEFTOVER  ${name} — closed (outcome ${result.fields.outcome}) but still on disk: ` +
          `accept it into the run log and delete it`
      );
    } else {
      console.error(`  INVALID   ${name} — ${result.messages.join(' ')}`);
    }
  }
  return 1;
}

function main(argv) {
  if (argv[0] === '--sweep') {
    // `<dir>` is optional: with none given, sweep the default runtime location every worker and
    // lead already agree on rather than requiring it be typed out every time.
    const dir = argv[1] || DEFAULT_STATUS_DIR;
    return sweep(dir);
  }

  const filePath = argv[0];
  if (!filePath) {
    console.error('usage: node tools/worker-status.js <file>');
    console.error(`       node tools/worker-status.js --sweep [dir]   # defaults to ${DEFAULT_STATUS_DIR}`);
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

module.exports = { evaluateFile, sweep, parseStatus, main, DEFAULT_STATUS_DIR };

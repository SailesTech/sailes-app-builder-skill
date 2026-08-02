#!/usr/bin/env node
'use strict';

/**
 * worker-status — reads and validates `.ai/status/<worker-id>.md`, the file a worker claims at the
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
 * bigger problem than "read six flat keys and two inline lists".
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_OPEN_FIELDS = ['worker', 'task', 'base', 'claimed', 'opened'];
const REQUIRED_CLOSE_FIELDS = ['closed', 'outcome', 'touched'];
const VALID_OUTCOMES = ['done', 'blocked', 'policy-refusal'];

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
  for (const line of lines) {
    if (!line.trim()) continue;
    if (/^\s*#/.test(line)) continue; // a full-line comment, not a field
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!m) continue; // not a `key: value` line — ignore rather than fail on stray prose
    const key = m[1];
    const value = stripTrailingComment(m[2]);
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
    // The whole point of Q3/D4.2: "done" is a claim, `commit:` is what makes it checkable. A done
    // with nothing to point at is exactly the silence this file was built to remove.
    problems.push('outcome: done requires "commit:" — a done result with nothing to point at');
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
 * `--sweep <dir>`: the directory-level check for the invariant this whole file exists to hold —
 * "whatever sits in .ai/status/ is either still running, dead, or awaiting acceptance" (Design
 * §3b). It never distinguishes those three further than that; a lead reads the per-file reason.
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
    const dir = argv[1];
    if (!dir) {
      console.error('worker-status --sweep: missing <dir>');
      return 2;
    }
    return sweep(dir);
  }

  const filePath = argv[0];
  if (!filePath) {
    console.error('usage: node tools/worker-status.js <file>');
    console.error('       node tools/worker-status.js --sweep <dir>');
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

module.exports = { evaluateFile, sweep, parseStatus, main };

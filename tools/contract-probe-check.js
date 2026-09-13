#!/usr/bin/env node
'use strict';

/**
 * contract-probe-check — does a spec phase that stands on an existing contract carry a MEASURED
 * response, not a claim about one?
 *
 * The failure it exists for, from the partner-portal report (2026-09-13): a screen never worked
 * at all, after 2400 lines. A global interceptor wrapped every API response in `{ data: … }`, and
 * three gates in a row read the SAME wrong shape — from documentation, not from a request — because
 * nothing in the spec ever ran a command against the local stack. One `curl` in the first minute
 * would have caught it. This check does not judge whether the measured shape is right; it only
 * checks that the question was asked at all, the same design brief as `deployed-surface-check`.
 *
 * A phase that stands on an existing contract carries a `Contract-probe:` field: the command and
 * the raw response in a fenced code block, measured on the LOCAL stack with seed/fixture data — or
 * `n/a — <reason ≥ 20 chars>` when the phase genuinely stands on no existing contract. A stack that
 * does not boot is `ENV-DEFECT`, never a reason for `n/a`, so an `n/a` reason naming a broken
 * environment fails too.
 *
 * Usage:  node tools/contract-probe-check.js <spec.md> [more.md ...]
 * Exit 0 = every graded phase answers, or the spec is not graded at all.
 * Exit 1 = at least one graded phase fails; each is named on stderr.
 * Exit 2 = no arguments, or a file could not be read — usage/error on stderr.
 */

const fs = require('fs');
const path = require('path');

/* ------------------------------------------------------------------ *
 * Grading eligibility — only specs dated at or after the cutoff are judged at all.
 * ------------------------------------------------------------------ */

/** The one place this value lives (P1.3). DECIDED 2026-09-13 (human, P1 gate): the cutoff is the
 *  day 1.34.0 merges to `main`, set in P6 when the release is stamped — until then this is a
 *  placeholder. Exported (below) so the frozen suite reads it via `require` and never hard-codes a
 *  date of its own. */
const CUTOFF = '2026-09-14';

const DATE_IN_NAME = /^(\d{4})-(\d{2})-(\d{2})-/;

/**
 * Real-calendar-date check by round-trip through `Date.UTC`, never by trusting the digit shape.
 * `new Date(2026, 12, 40)` does not throw — it silently rolls over into some later month — so the
 * only safe test is: build the date, read the components back, and require them to be unchanged.
 */
function isValidCalendarDate(y, m, d) {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * @param {string} file path to the spec (basename is what carries the date)
 * @returns {{graded: boolean, reason?: string}}
 */
function gradingStatus(file) {
  const base = path.basename(file);
  const m = base.match(DATE_IN_NAME);
  if (!m) {
    // DECIDED 2026-09-13 (human, P1 gate — durable, not a stopgap): a file name with no date is
    // not graded, and says so on stdout. Grading it would fire on the undated legacy specs of
    // adopted repos, and a gate that fires on legacy is a gate that gets disabled. The stdout line
    // keeps the exemption visible instead of silent.
    return { graded: false, reason: 'not graded — no date in file name' };
  }
  const [, yStr, mStr, dStr] = m;
  // DECIDED 2026-09-13 (human, P1 plan freeze, CP39): a prefix with the right SHAPE but not a real
  // calendar date (`2026-13-40-x.md`) is treated the same as no date at all — never rolled over
  // into a later month by `Date`.
  if (!isValidCalendarDate(Number(yStr), Number(mStr), Number(dStr))) {
    return { graded: false, reason: 'not graded — no date in file name' };
  }
  const dateStr = `${yStr}-${mStr}-${dStr}`;
  if (dateStr < CUTOFF) {
    return { graded: false, reason: `not graded — dated before ${CUTOFF}` };
  }
  return { graded: true };
}

/* ------------------------------------------------------------------ *
 * Segmentation — phase headings, same convention as `deployed-surface-check`.
 * ------------------------------------------------------------------ */

const PHASE_HEADING = /^#{2,4}\s+(?:Phase|Faza|P\d+)\b/i;
/** Any markdown heading — used to close a field's value window at a sub-heading inside a phase. */
const ANY_HEADING = /^#{1,6}\s/;

/**
 * Split a spec into the units the rule applies to. A spec with phase headings is judged per phase;
 * one without is judged as a single unit, so a spec cannot opt out of the rule by not being phased.
 */
function splitUnits(text) {
  const lines = text.split(/\r?\n/);
  const starts = [];
  for (let i = 0; i < lines.length; i++) if (PHASE_HEADING.test(lines[i])) starts.push(i);
  if (starts.length === 0) {
    return [{ title: '(whole spec — no phase headings)', startLine: 1, lines }];
  }
  const units = [];
  for (let k = 0; k < starts.length; k++) {
    const from = starts[k];
    const to = k + 1 < starts.length ? starts[k + 1] : lines.length;
    units.push({
      title: lines[from].replace(/^#+\s*/, '').trim(),
      startLine: from + 1,
      lines: lines.slice(from, to),
    });
  }
  return units;
}

/* ------------------------------------------------------------------ *
 * The `Contract-probe:` field — label forms, value window, validity.
 * ------------------------------------------------------------------ */

/** Tolerates a leading list marker (`- ` / `* `, but not the `**` of a bold label) and the bold
 *  label in either wrapping (`**Contract-probe:**` or `**Contract-probe**:`). */
const FIELD_LABEL = /^\s*(?:[-*]\s+)?\*{0,2}Contract-probe\*{0,2}\s*:\s*\*{0,2}\s*(.*)$/i;

/** The boundary a field's value runs up to: the next field label — generalised as any
 *  `<Word>-<word>:` (covers `Done-when`, `Deployed-probe:`, another `Contract-probe:`) or the
 *  literal `Lane:`, which is not hyphenated — or the next heading inside the same phase. */
const NEXT_FIELD_LABEL = /^\s*(?:[-*]\s+)?\*{0,2}(?:[A-Za-z]+-[A-Za-z]+|Lane)\*{0,2}\s*:/i;

const FENCE = /^\s*```/m;

/** @returns {number[]} line indices within `lines` carrying a `Contract-probe:` label */
function findFieldLines(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) if (FIELD_LABEL.test(lines[i])) out.push(i);
  return out;
}

/** @returns {string} the field's value: same-line remainder + every line up to (not including)
 *  the next field label or heading */
function collectFieldValue(lines, i) {
  const parts = [];
  const m = lines[i].match(FIELD_LABEL);
  if (m) parts.push(m[1]);
  for (let j = i + 1; j < lines.length; j++) {
    if (NEXT_FIELD_LABEL.test(lines[j]) || ANY_HEADING.test(lines[j])) break;
    parts.push(lines[j]);
  }
  return parts.join('\n');
}

/** Broken-environment phrases in an `n/a` reason — never a valid waiver, because a stack that does
 *  not boot is `ENV-DEFECT` and NOT-READY, not a reason to skip the probe (F4). `\bENV\b` alone is
 *  case-sensitive; the rest are not. */
function namesBrokenEnvironment(reason) {
  if (/\bstack\b/i.test(reason)) return true;
  if (/not running/i.test(reason)) return true;
  if (/nie wstał/i.test(reason)) return true;
  if (/\bENV\b/.test(reason)) return true;
  return false;
}

/**
 * @param {string} value the field's collected value
 * @returns {{ok: boolean, code?: string, detail?: string}}
 */
function judgeField(value) {
  const stripped = value.trim().replace(/^[`*_>\s]+/, '').replace(/[`*_\s]+$/, '');

  // DECIDED 2026-09-13 (human, P1 plan freeze, CP40): the separator between `n/a` and its reason
  // is MANDATORY. `n/a because it is already covered` — no `—`/`–`/`-`/`:` — is not recognised as a
  // waiver attempt at all here; it falls through to the fenced-block check below and, finding
  // none, reports `no-block`, exactly like any other unlabelled prose value. A BARE `n/a` (nothing
  // after it at all) is still the "no reason" case Done-when names explicitly.
  const bareNa = /^n\/?a\b\s*$/i.test(stripped);
  const waiver = bareNa
    ? { 1: '' }
    : stripped.match(/^n\/?a\b\s*[—–:-]\s*([\s\S]*)$/i);
  if (waiver) {
    let reason = (waiver[1] || '').trim();
    reason = reason.replace(/^`+|`+$/g, '').trim();
    if (reason.length < 20) {
      return {
        ok: false,
        code: 'na-no-reason',
        detail: '`Contract-probe: n/a` with no reason, or the reason is under 20 characters',
      };
    }
    if (namesBrokenEnvironment(reason)) {
      return {
        ok: false,
        code: 'na-env',
        detail: '`Contract-probe: n/a` reason names a broken environment — that is ENV-DEFECT and NOT-READY, never a reason for n/a',
      };
    }
    return { ok: true };
  }

  if (FENCE.test(value)) return { ok: true };

  return {
    ok: false,
    code: 'no-block',
    detail: 'no response block and no `n/a`',
  };
}

/* ------------------------------------------------------------------ *
 * Per-unit / per-spec judgement.
 * ------------------------------------------------------------------ */

/**
 * @param {string} text spec contents
 * @returns {{errors: string[], unitsChecked: number}}
 */
function checkSpec(text) {
  const errors = [];
  const units = splitUnits(text);
  let unitsChecked = 0;

  for (const unit of units) {
    unitsChecked++;
    const fieldLines = findFieldLines(unit.lines);

    if (fieldLines.length === 0) {
      errors.push(`${unit.title}: missing field — no \`Contract-probe:\` field in this phase`);
      continue;
    }

    for (const i of fieldLines) {
      const value = collectFieldValue(unit.lines, i);
      const verdict = judgeField(value);
      if (verdict.ok) continue;
      const lineNo = unit.startLine + i;
      errors.push(`${unit.title} (line ${lineNo}): ${verdict.detail}`);
    }
  }

  return { errors, unitsChecked };
}

/* ------------------------------------------------------------------ *
 * CLI
 * ------------------------------------------------------------------ */

function main(argv) {
  const files = argv.filter((a) => !a.startsWith('--'));
  if (files.length === 0) {
    process.stderr.write('usage: node tools/contract-probe-check.js <spec.md> [more.md ...]\n');
    return 2;
  }

  let failed = false;
  let unreadable = false;
  for (const file of files) {
    const grading = gradingStatus(file);
    if (!grading.graded) {
      process.stdout.write(`${path.basename(file)}: ${grading.reason}\n`);
      continue;
    }

    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch (e) {
      process.stderr.write(`contract-probe-check: cannot read ${file}: ${e.message}\n`);
      unreadable = true;
      continue;
    }

    const { errors } = checkSpec(text);
    const name = path.basename(file);
    if (errors.length) {
      failed = true;
      process.stderr.write(`\n${name}: ${errors.length} phase(s) fail the Contract-probe rule\n`);
      for (const e of errors) process.stderr.write(`  - ${name}: ${e}\n`);
    } else {
      process.stdout.write(`${name}: OK — every phase carries a valid Contract-probe field\n`);
    }
  }

  // DECIDED 2026-09-13 (human, P1 plan freeze, CP41): an unreadable file wins over every graded
  // result, including a failing one. Exit 2 means the tool could not establish what it was asked
  // to grade, which is a harder failure than a phase breaking the rule.
  if (unreadable) return 2;
  return failed ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = {
  checkSpec, judgeField, gradingStatus, splitUnits, CUTOFF, namesBrokenEnvironment,
};

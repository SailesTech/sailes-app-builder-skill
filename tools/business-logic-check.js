#!/usr/bin/env node
'use strict';

/**
 * business-logic-check — is every claim in `.ai/business-logic.md` CHECKABLE?
 *
 * Not whether it is TRUE. Truth is a human's job and this does not pretend otherwise.
 *
 * The failure it exists for, measured 2026-08-22 in a real client repo: a 760-line
 * `logika_biznesowa.md` whose title said v.2 in a v.3 project, whose body described a cron that
 * does not exist, whose line 1 carried a banner contradicting that body — and whose index still
 * advertised the claim the banner retracted. Three layers of one document saying three different
 * things, for a month, because nothing could check any of them. A rule that names `file:line` can
 * be checked in milliseconds; a rule that names nothing cannot be checked at all.
 *
 * Usage:  node tools/business-logic-check.js [path-to-business-logic.md] [--root <repo-root>]
 * Exit 0 = every rule is checkable. Exit 1 = at least one is not; each is named on stderr.
 *
 * The core below is kept byte-identical with the client-repo copy at
 * `skills/sailes-bootstrap/hooks-template/business-logic-check.js` and that identity is asserted by
 * `tools/business-logic-check.test.js`. Two copies rather than a pointer because the plugin serves
 * `skills/` from OUTSIDE a client's working tree — a client hook that references `tools/` has
 * nothing to reference. Same finding `tools/sync-blocks.js` recorded for prose.
 */

/* === CORE (parity-checked — edit both copies or neither) === */
const fs = require('fs');
const path = require('path');

/** Field labels are fixed syntax, not prose: the artifact's language is the repo's, these are not.
 *  Both spellings ship because these repos are bilingual in practice (a client `.ai/` in Polish,
 *  the framework's in English). One alias table in one place is not drift. */
const LABEL_SOURCE = /(?:^|·|\|)\s*(?:source|źródło)\s*:/i;
const LABEL_ENFORCED = /(?:^|·|\|)\s*(?:enforced|egzekwowane)\s*:\s*([^·|]+)/i;

/** `enforced:` values that assert an absence rather than a location. Both are full answers:
 *  "this rule lives only in an agreement between people" is information, not a gap. */
const SENTINELS = new Set(['none', 'n/a', 'brak', 'nie dotyczy']);

const RULE_ID = /^\s*[-*]\s+\*\*\[([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*)\]\*\*/;

/** A value is treated as a filesystem path only when it looks like one: it contains a `/`, or it
 *  ends in `.ext` optionally followed by `:line`. A bare symbol (`SomeService.someMethod`) is a
 *  legitimate handle and is accepted unverified — a limit this tool states rather than hides. */
function looksLikePath(value) {
  if (value.includes('/')) return true;
  return /\.[A-Za-z0-9]{1,6}(?::\d+)?$/.test(value);
}

function stripLineNumber(value) {
  const m = value.match(/^(.*?):(\d+)$/);
  return m ? m[1] : value;
}

/**
 * @param {string} text     the artifact's contents
 * @param {string} root     repo root, for resolving `enforced:` paths
 * @param {object} [opts]   { section0Limit, totalLimit }
 * @returns {{errors: string[], warnings: string[], ruleCount: number}}
 */
function checkBusinessLogic(text, root, opts) {
  const options = Object.assign({ section0Limit: 120, totalLimit: 400 }, opts || {});
  const lines = text.split(/\r?\n/);
  const errors = [];
  const warnings = [];
  const seen = new Map();
  let ruleCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const idMatch = lines[i].match(RULE_ID);
    if (!idMatch) continue;
    ruleCount++;
    const id = idMatch[1];
    const at = `line ${i + 1}`;

    if (seen.has(id)) {
      errors.push(`[${id}] duplicate rule ID (${at}; first seen at line ${seen.get(id)})`);
    } else {
      seen.set(id, i + 1);
    }

    // A rule's fields may sit on its own line or on the indented continuation lines that follow,
    // up to the next rule or the next blank-line-then-heading.
    let block = lines[i];
    for (let j = i + 1; j < lines.length; j++) {
      if (RULE_ID.test(lines[j]) || /^#{1,6}\s/.test(lines[j])) break;
      if (lines[j].trim() === '') break;
      block += '\n' + lines[j];
    }

    if (!LABEL_SOURCE.test(block)) {
      errors.push(`[${id}] missing \`source:\` — who said this, and when (${at})`);
    }

    const enforced = block.match(LABEL_ENFORCED);
    if (!enforced) {
      errors.push(
        `[${id}] missing \`enforced:\` — a file:line, or NONE if it lives only in an agreement (${at})`
      );
      continue;
    }

    const value = enforced[1].trim().replace(/[`"']/g, '');
    if (SENTINELS.has(value.toLowerCase())) continue;
    if (!looksLikePath(value)) continue; // a bare symbol handle — accepted, unverified by design

    const rel = stripLineNumber(value);
    if (!fs.existsSync(path.resolve(root, rel))) {
      errors.push(`[${id}] \`enforced: ${value}\` points at a path that does not exist (${at})`);
    }
  }

  // Section 0 = everything before the second heading. It is the index, and an index that grows is
  // an index that has started summarising — the exact failure the six maintenance rules forbid.
  const headings = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,6}\s/.test(lines[i])) headings.push(i);
  }
  if (headings.length >= 2) {
    const section0 = headings[1] - headings[0];
    if (section0 > options.section0Limit) {
      warnings.push(
        `section 0 is ${section0} lines (limit ${options.section0Limit}) — the index is summarising; ` +
          'name and scope only'
      );
    }
  }
  if (lines.length > options.totalLimit) {
    warnings.push(
      `${lines.length} lines (limit ${options.totalLimit}) — split into .ai/business-logic/ ` +
        'before this becomes a document nobody re-reads'
    );
  }

  return { errors, warnings, ruleCount };
}
/* === END CORE === */

function main(argv) {
  const args = argv.slice(2);
  let root = process.cwd();
  const rootIdx = args.indexOf('--root');
  if (rootIdx !== -1) {
    root = args[rootIdx + 1];
    args.splice(rootIdx, 2);
  }
  const file = args[0] || path.join(root, '.ai', 'business-logic.md');

  if (!fs.existsSync(file)) {
    console.error(`business-logic-check: no such file: ${file}`);
    return 1;
  }

  const { errors, warnings, ruleCount } = checkBusinessLogic(fs.readFileSync(file, 'utf8'), root);

  for (const w of warnings) console.error(`WARN  ${w}`);
  for (const e of errors) console.error(`FAIL  ${e}`);

  if (errors.length === 0) {
    console.log(
      `business-logic-check: ${ruleCount} rule(s) checkable in ${path.basename(file)}` +
        (warnings.length ? ` (${warnings.length} warning(s))` : '')
    );
    return 0;
  }
  console.error(
    `\nbusiness-logic-check: ${errors.length} of ${ruleCount} rule(s) are not checkable. ` +
      'This says nothing about whether they are TRUE — only that nothing can verify them.'
  );
  return 1;
}

module.exports = { checkBusinessLogic, looksLikePath, SENTINELS };

if (require.main === module) process.exit(main(process.argv));

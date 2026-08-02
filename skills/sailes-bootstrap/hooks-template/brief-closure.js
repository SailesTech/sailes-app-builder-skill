#!/usr/bin/env node
'use strict';

/**
 * brief-closure — a worker brief cannot be handed off half-declared.
 *
 * The problem it exists for (spec 2026-08-01-delegation-precision-and-agent-control, Design §5):
 * four costly defects on 2026-08-01 shared one shape — each was an ABSENCE, and a review that reads
 * a diff cannot find a thing that was never written. A missing endpoint changes no line a reviewer
 * can flag; a missing `Done-when` clause gives no gate anything to fail on. Correctness gets
 * checked by someone; absence has no one, until something asserts presence. This is that something.
 *
 * Two checks, both deterministic, neither a hook (a `SubagentStart` hook cannot see the brief — a
 * brief is sometimes only ever written into a chat message — so this runs as a test in the gate,
 * per Q4 of that spec):
 *
 *   (a) required fields present — Goal/Cel, Files/Pliki, Contract/Kontrakt, Forbidden/Zabronione,
 *       Verification/Weryfikacja, Report/Raport, Delivery/Dostarczenie. English or Polish label
 *       accepted, matched independently of which language the rest of the brief uses.
 *   (b) every path named on the Files/Pliki list is named by at least one Done-when-carrying clause
 *       elsewhere in the SAME brief — unless the brief marks that path explicitly as
 *       touched-but-not-produced, with a stated reason. This is the proseful rule from
 *       `spec-writing-template.md` ("every phase's Done-when covers its own file list") turned into
 *       a mechanism, per that spec's own instruction to do so wherever a check can replace prose.
 *
 * SUBSTITUTE DECISION (be-dev, F2 — not a key decision, marked per brief's Blocked clause): the
 * spec names "Done-when clause" as the thing that must name each path, but the worker-brief format
 * actually in use in this repo (`agent-team-structure.md` §"Worker brief", and the very brief this
 * file was built from) carries no field literally labelled `Done-when:` — that label lives in SPEC
 * PHASE tables, not in worker briefs. Worker briefs instead put the proof-bearing text in
 * `Verification:` ("exact commands to run + the e2e requirement" — the brief's own analogue of a
 * phase's Done-when block) and, just as often, in `Contract:` (which is where the brief that
 * commissioned this very file names `brief-closure.js` — not in its own Verification section).
 * So the "Done-when pool" this check searches is: an explicit `Done-when:` / `Kiedy gotowe:` field
 * if the brief author added one, PLUS `Verification:`/`Weryfikacja:`, PLUS `Contract:`/`Kontrakt:`.
 * `Files`, `Forbidden`, `Report`, `Reference`, `Blocked` are deliberately excluded — `Report`
 * describes what the worker writes AFTER the fact and would make the check unfireable (a report
 * that lists every touched file would "cover" anything), and `Forbidden` is the photographic
 * negative of what the brief commits to producing. Second-order effect checked: this pool choice
 * makes the check MORE lenient, not less — a path named only in Contract's prose still passes. That
 * is deliberate (false positives here cost a worker a wasted round; the mechanism this file exists
 * to stop is the opposite failure, a path named NOWHERE at all) and is exactly what the mutation
 * fixtures in brief-closure.test.js exercise: a path absent from all three pool fields still fails.
 * Report this choice to the lead as the deviation it is — the pool and the exemption syntax below
 * were not frozen anywhere on disk before this file existed.
 *
 * SUBSTITUTE DECISION (be-dev, F2): the "touched-but-not-produced, with a stated reason" exemption
 * has no prior syntax in this repo either. Chosen shape — an inline annotation on the SAME line as
 * the path, containing the phrase "touched ... not produced" (or Polish "dotyk... nie produk...")
 * followed by "reason:" / "powód:" and non-empty text:
 *
 *   Files:   EDIT `config/flags.json` (touched, not produced — reason: toggled by another task)
 *
 * A path with the phrase but no reason is treated as a NAMING FAILURE (the marker is broken, not
 * silently accepted) — printed as its own problem rather than falling through to the generic
 * coverage message, so the author sees exactly what is missing.
 *
 * Zero dependencies, CommonJS, Windows- and POSIX-safe: reads with \r?\n tolerance (this repo is
 * mixed CRLF/LF on disk — AGENTS.md, "Line endings: match the file, don't assume the repo") and
 * never assumes a path separator when comparing paths pulled out of prose.
 *
 * Usage:
 *   node brief-closure.js <brief-file>
 *
 * Exit codes: 0 when closed, 1 otherwise — every problem named on stderr, never silent.
 */

const fs = require('fs');

// ---------------------------------------------------------------- required-field vocabulary

// Each group is one concept; either label (English or Polish) satisfies it. Order here is the
// order problems print in, which follows the brief template's own field order.
const REQUIRED_FIELDS = [
  { aliases: ['goal', 'cel'] },
  { aliases: ['files', 'pliki'] },
  { aliases: ['contract', 'kontrakt'] },
  { aliases: ['forbidden', 'zabronione'] },
  { aliases: ['verification', 'weryfikacja'] },
  { aliases: ['report', 'raport'] },
  { aliases: ['delivery', 'dostarczenie'] },
];

const FILES_ALIASES = ['files', 'pliki'];
const DONE_WHEN_ALIASES = ['done-when', 'kiedy gotowe', 'gotowe gdy'];
const VERIFICATION_ALIASES = ['verification', 'weryfikacja'];
const CONTRACT_ALIASES = ['contract', 'kontrakt'];

// ---------------------------------------------------------------- parsing

/**
 * Splits brief text into fields. A field STARTS on a line with no leading whitespace that matches
 * `Label:` (optional leading "- " bullet, optional markdown "**bold**" around the label) — every
 * line indented under it is a continuation, regardless of what it contains, which is what lets a
 * field's own value carry inner colons (`Contract:    CLI: \`node …\` → exit 0 …`) without the
 * parser mistaking "CLI:" for a new field.
 */
function parseFields(text) {
  const lines = text.split(/\r\n|\r|\n/);
  const fieldStartRe = /^(?:[-*]\s+)?\*{0,2}([A-Za-z][A-Za-z0-9 /_-]{0,30}?)\*{0,2}:\s?(.*)$/;
  const fields = [];
  let current = null;

  for (const rawLine of lines) {
    const startsWithWhitespace = /^[ \t]/.test(rawLine);
    if (!startsWithWhitespace && rawLine.length > 0) {
      const m = fieldStartRe.exec(rawLine);
      if (m) {
        current = { label: m[1], lines: [m[2] || ''] };
        fields.push(current);
        continue;
      }
    }
    if (current) current.lines.push(rawLine);
    // Lines before the first recognised field (the "You are ROLE on team TEAM" preamble) belong to
    // no field and are dropped — nothing in the contract needs them.
  }
  return fields;
}

/** Canonical form for comparing a captured label against the alias lists: strip markdown
 *  decoration, collapse whitespace, lower-case. Trailing colons never reach here — parseFields
 *  already consumed the separator. */
function normalizeLabel(label) {
  return label.replace(/[*_]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function findField(fields, aliases) {
  return fields.find((f) => aliases.includes(normalizeLabel(f.label)));
}

// ---------------------------------------------------------------- (a) required fields

function checkRequiredFields(fields) {
  const problems = [];
  for (const group of REQUIRED_FIELDS) {
    if (!findField(fields, group.aliases)) {
      const shown = group.aliases.map((a) => `${a[0].toUpperCase()}${a.slice(1)}:`).join(' / ');
      problems.push(`missing required field: ${shown}`);
    }
  }
  return problems;
}

// ---------------------------------------------------------------- (b) Files -> Done-when coverage

// Matches an inline "touched, not produced — reason: …" annotation (English or Polish), same line
// as the path. Group 1 is the stated reason; empty/whitespace-only never satisfies `\S`, so a
// marker with no reason simply does not match here (handled as its own problem below).
const TOUCHED_WITH_REASON_RE =
  /(?:touch(?:ed)?|dotyk\w*)[^\n]*?(?:not[\s-]+produced|nie\s*produkowan\w*)[^\n]*?(?:reason|pow[oó]d\w*)\s*[:\-–—]\s*(\S.*\S|\S)/i;

// The bare phrase, without requiring a reason — used only to tell "no marker at all" apart from
// "marker present but broken (no reason stated)", so the printed problem names the real defect.
const TOUCHED_PHRASE_RE =
  /(?:touch(?:ed)?|dotyk\w*)[^\n]*?(?:not[\s-]+produced|nie\s*produkowan\w*)/i;

function basenameOf(p) {
  const parts = p.split(/[\\/]/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : p;
}

/** Pulls candidate path strings out of one Files-field line: backtick-quoted spans first (the
 *  convention every brief in this repo uses — `path/to/file.ext`), falling back to a bare
 *  path-shaped token (contains a dot extension) when the author wrote no backticks at all. */
function pathsInLine(line) {
  const backticked = [...line.matchAll(/`([^`\n]+)`/g)].map((m) => m[1].trim()).filter(Boolean);
  if (backticked.length) return backticked;
  const bare = line.match(/[\w./\\-]+\.[A-Za-z0-9]+/);
  return bare ? [bare[0]] : [];
}

/**
 * Returns { entries, problems }. `entries` is every path found on the Files list with its
 * exemption state; `problems` already includes both "no clause names this path" and "exemption
 * marker present but no reason stated" failures so callers don't need to re-derive them.
 */
function checkCoverage(fields) {
  const filesField = findField(fields, FILES_ALIASES);
  if (!filesField) return { entries: [], problems: [] }; // already reported by checkRequiredFields

  const poolFields = fields.filter((f) => {
    const n = normalizeLabel(f.label);
    return DONE_WHEN_ALIASES.includes(n) || VERIFICATION_ALIASES.includes(n) || CONTRACT_ALIASES.includes(n);
  });
  const poolText = poolFields.map((f) => f.lines.join('\n')).join('\n');

  const entries = [];
  const problems = [];
  const seenUncovered = new Set();

  for (const line of filesField.lines) {
    const paths = pathsInLine(line);
    if (!paths.length) continue;

    const withReason = TOUCHED_WITH_REASON_RE.exec(line);
    const bareMarker = !withReason && TOUCHED_PHRASE_RE.test(line);

    for (const p of paths) {
      if (withReason) {
        entries.push({ path: p, exempt: true, reason: withReason[1].trim() });
        continue; // marked touched-but-not-produced with a stated reason — never needs coverage
      }
      if (bareMarker) {
        entries.push({ path: p, exempt: false, reason: null, brokenMarker: true });
        if (!seenUncovered.has(p)) {
          seenUncovered.add(p);
          problems.push(
            `touched-but-not-produced marker on "${p}" has no stated reason — add "reason: …" or "powód: …", or drop the marker and let it be covered normally`
          );
        }
        continue;
      }

      const base = basenameOf(p);
      const normPath = p.replace(/\\/g, '/');
      const covered = poolText.includes(normPath) || (base && poolText.includes(base));
      entries.push({ path: p, exempt: false, reason: null, covered });
      if (!covered && !seenUncovered.has(p)) {
        seenUncovered.add(p);
        problems.push(`no Done-when clause names this path: ${p}`);
      }
    }
  }

  return { entries, problems };
}

// ---------------------------------------------------------------- CLI

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node brief-closure.js <brief-file>');
    process.exit(1);
  }

  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    console.error(`brief-closure: cannot read ${file} — ${err.message}`);
    process.exit(1);
  }

  const fields = parseFields(text);
  const problems = [...checkRequiredFields(fields), ...checkCoverage(fields).problems];

  if (problems.length) {
    console.error(`brief-closure: NOT CLOSED — ${file}`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }

  console.log(`brief-closure: CLOSED — ${file}`);
  process.exit(0);
}

// Exported for the test file, which drives the CLI the way the gate drives it (spawnSync, argv in,
// exit code out) but also unit-tests the parser directly for the edge cases spawning would obscure.
module.exports = { parseFields, normalizeLabel, findField, checkRequiredFields, checkCoverage };

if (require.main === module) main();

#!/usr/bin/env node
'use strict';

/**
 * deployed-surface-check — does a spec that depends on a WIRE property say where it will be
 * observed on the DEPLOYED address?
 *
 * Not whether the behavior is right. Whether the question was asked at all.
 *
 * The failure it exists for, measured 2026-08-29 in a real client repo: a feature shipped with
 * unit tests, Playwright e2e and a green `qa` gate, and worked for zero customers. The rule was
 * pinned to an HTTP `404`; CloudFront rewrites the origin's 404 into `200 text/html`, so the code
 * the whole feature keyed on never reaches a browser. Every test asserted against **origin or a
 * mock**. Not one request was ever sent to the deployed address. Cost of detection afterwards:
 *
 *     curl -s -o /dev/null -w '%{http_code} %{content_type}' https://<deployed-host>/api/...
 *
 * One command. Forty-four extra assertions would not have found it; that one would. That ratio is
 * the whole design brief: this check exists to make one cheap observation mandatory, NOT to add a
 * tier of ceremony. A spec that answers it costs a line.
 *
 * So the check is narrow on purpose. A spec phase that claims a status code, a header or a
 * Content-Type must carry a `Deployed-probe:` field naming a non-local address and the expected
 * wire observation — or an explicit `n/a — <reason>`. A waiver is a pass: the point is that the
 * question is answered ON DISK, not that a script gets to veto a spec. A check that vetoes on an
 * inferred trigger is a check that gets disabled, which is the failure AGENTS.md already records
 * for `test:browser`.
 *
 * Usage:  node tools/deployed-surface-check.js <spec.md> [more.md ...]
 * Exit 0 = every triggered phase answers. Exit 1 = at least one does not; each is named on stderr.
 */

const fs = require('fs');
const path = require('path');

/* ------------------------------------------------------------------ *
 * Triggers — a claim about a property of the wire, not of the code.
 * ------------------------------------------------------------------ */

/** Response headers a CDN, proxy or gateway can and does rewrite, split by how much the NAME alone
 *  proves. A hyphenated header token is unambiguous — nothing else in a spec writes `Cache-Control`.
 *  `location`, `age`, `vary` and `expires` are ordinary English words, and on this repo's own 18
 *  implemented specs the undifferentiated list produced three false positives out of six triggers
 *  (`Ledger location: decided at`, `the location is what it reports`). Those need an HTTP hint on
 *  the same line before they count. Request-only headers are absent on purpose: nothing between
 *  you and origin rewrites your own `Authorization`. */
const HEADERS_UNAMBIGUOUS = [
  'content-type', 'content-encoding', 'content-disposition', 'content-length',
  'cache-control', 'set-cookie', 'retry-after', 'etag', 'last-modified',
  'access-control-allow-origin', 'x-frame-options', 'strict-transport-security',
];
const HEADERS_AMBIGUOUS = ['location', 'vary', 'age', 'expires'];

const HEADER_UNAMBIGUOUS_PATTERN = new RegExp(
  '(?:^|[^a-z0-9-])(?:' + HEADERS_UNAMBIGUOUS.join('|').replace(/-/g, '\\-') + ')\\b',
  'i'
);
const HEADER_AMBIGUOUS_PATTERN = new RegExp(
  // `header\b` does not match inside "headers" — the boundary sits between two word characters, so
  // "sets the Vary and Age headers" evaded the check entirely. Found by review, 2026-08-30.
  '(?:^|[^a-z0-9-])(?:' + HEADERS_AMBIGUOUS.join('|') + ')\\s*(?::|headers?\\b|nagłówk?[ai]?\\b)',
  'i'
);

/** An HTTP hint on the same line. Gates the two weak signals — a bare arrow-code and an
 *  ordinary-English header name — and deliberately does NOT gate the strong ones (`HTTP 404`,
 *  `404 Not Found`, `%{http_code}`), which carry their own context. */
const HTTP_HINT = /\b(?:curl|http|https|api|endpoint|route|response|request|GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|header|nagłówek|CDN|proxy|origin|edge|status)\b|%\{|\/api\//i;

/** Real HTTP status codes. Without this, `→ 149 linii (limit 150)` — a line in this repo's own
 *  implemented specs — reads as a status claim. Measured, not hypothetical. */
const REAL_CODES = new Set([
  100, 101, 102, 103,
  200, 201, 202, 203, 204, 205, 206, 207, 208, 226,
  300, 301, 302, 303, 304, 305, 307, 308,
  400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418,
  421, 422, 423, 424, 425, 426, 428, 429, 431, 451,
  500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511,
]);

/** A bare three-digit number is not a status code — `200 rows` is not an HTTP claim. Each pattern
 *  requires the code to sit in an HTTP context, and every one captures it so REAL_CODES can rule. */
const STATUS_PATTERNS = [
  // "status 404", "status code 404", "kod HTTP 404", "returns 401", "zwraca 404", "responds 500"
  { re: /\b(?:status(?:\s*code)?|kod(?:\s*(?:http|odpowiedzi))?|http_code|statusCode|returns?|zwraca|respond(?:s|ing)?|odpowiada)\b[^\r\n]{0,24}?\b([1-5]\d{2})\b/i, hint: false },
  // "HTTP 404", "HTTP/1.1 404"
  { re: /\bhttp(?:\/\d(?:\.\d)?)?\s*([1-5]\d{2})\b/i, hint: false },
  // "404 Not Found", "200 OK", "302 Found"
  { re: /\b([1-5]\d{2})\s+(?:ok|created|accepted|no content|moved permanently|found|see other|not modified|temporary redirect|permanent redirect|bad request|unauthorized|forbidden|not found|gone|conflict|unprocessable(?: entity| content)?|too many requests|internal server error|bad gateway|service unavailable|gateway timeout)\b/i, hint: false },
  // "→ 404", "-> 200", "=> 500" — the Done-when arrow form this framework writes in. The weakest
  // of the five, so it needs an HTTP hint on the line as well as a real code.
  { re: /(?:→|->|=>)\s*(?:http\s*)?([1-5]\d{2})\b/i, hint: true },
  // a curl that formats the code: -w '%{http_code}'
  { re: /%\{\s*(http_code)\s*\}/i, hint: false },
];

/** Nouns a number can COUNT. `This query returns 404 matching rows` is arithmetic, not a status
 *  line, and the first version of this file fired on it. The regression test that was supposed to
 *  cover the class used the PAST tense (`the sweep returned 200 rows`), which the trigger word
 *  `returns?` never matched — so the test passed while the ordinary present-tense phrasing
 *  misfired. Found by review 2026-08-30, and it is the exact "manufactured obligation" this whole
 *  release exists to remove.
 *
 *  At most ONE word may sit between the number and the noun. That is what separates `404 matching
 *  rows` (arithmetic) from `404 on a missing row` (a status code in a sentence that happens to end
 *  in a countable noun). */
const COUNTED_NOUN = /^\s*(?:[a-zA-ZżźćńółęąśŻŹĆŃÓŁĘĄŚ]+\s+)?(?:rows?|records?|items?|entries|results?|matches?|files?|lines?|users?|deals?|requests?|tests?|assertions?|words?|tokens?|bytes?|chars?|characters?|ms|milliseconds?|seconds?|minutes?|hours?|days?|[KMG]B|wierszy|rekord\w*|plik\w*|linii|znak\w*|element\w*|pozycj\w*|sekund\w*|dni)\b/i;

/** @returns {boolean} does this line claim an HTTP status? */
function claimsStatus(line) {
  const hinted = HTTP_HINT.test(line);
  for (const p of STATUS_PATTERNS) {
    const m = line.match(p.re);
    if (!m) continue;
    if (p.hint && !hinted) continue;
    if (m[1] === 'http_code') return true;
    if (!REAL_CODES.has(Number(m[1]))) continue;
    if (COUNTED_NOUN.test(line.slice(m.index + m[0].length))) continue;
    return true;
  }
  return false;
}

/** @returns {boolean} does this line claim a response header a proxy can rewrite? */
function claimsHeader(line) {
  if (HEADER_UNAMBIGUOUS_PATTERN.test(line)) return true;
  return HEADER_AMBIGUOUS_PATTERN.test(line) && HTTP_HINT.test(line);
}

/** A redirect's observable form is a status plus `Location`, and specs routinely claim one in
 *  prose with neither. Hinted, for the same reason the arrow form is. */
const REDIRECT_PATTERN = /\b(?:redirects?|redirected|przekierow\w*)\b/i;
/** A redirect that NAMES ITS TARGET is a wire claim on its own — "the user is redirected to
 *  /dashboard" is about a 302 and a `Location` whether or not the sentence contains another HTTP
 *  word. Hint-gating alone missed both of the ordinary phrasings (review, 2026-08-30). A redirect
 *  with no target stays hint-gated: "we redirect the conversation" is not a wire property. */
const REDIRECT_TARGET = /\b(?:redirects?|redirected|przekierow\w*)\b[^\r\n]{0,40}?(?:https?:\/\/|\s\/[A-Za-z0-9._~\-\/]+)/i;
function claimsRedirect(line) {
  if (REDIRECT_TARGET.test(line)) return true;
  return REDIRECT_PATTERN.test(line) && HTTP_HINT.test(line);
}

/* ------------------------------------------------------------------ *
 * Satisfaction — the `Deployed-probe:` field.
 * ------------------------------------------------------------------ */

/** The field, in the two forms specs are actually written in. The colon form
 *  (`Deployed-probe: curl …`) was the only one this tool accepted until an A/B run on 2026-08-30
 *  produced a spec carrying `**Deployed-probe**` as a bold sub-heading with the command underneath
 *  — a correct answer the check called a violation. A check that fails a right answer over its
 *  punctuation is the ceremony this whole change exists to remove, so both forms count. */
const PROBE_FIELD = /^\s*(?:[-*>]\s*)?(?:\*\*|#{1,6}\s*)?deployed[- ]probe(?:\*\*)?\s*:\s*(.*)$/i;
const PROBE_HEADING = /^\s*(?:[-*>]\s*)?(?:\*\*|#{1,6}\s+)deployed[- ]probe(?:\*\*)?\s*$/i;

/** Hosts that are not a deployment. This list IS the check: the escaped defect passed every test
 *  that ran against exactly these. `*.local` and the RFC1918 ranges are here because a staging box
 *  on the office LAN sits behind no CDN either, so it answers the wrong question just as cleanly. */
function isLocalHost(host) {
  let h = host.toLowerCase();
  // Strip the port only where stripping it is unambiguous. `::1` is all colons and no port, and a
  // naive `:\d+$` turns it into a bare `:` that matches nothing below — a loopback reading as a
  // deployment, which is the one direction this function must never fail in.
  if (h.startsWith('[')) h = h.replace(/^\[([^\]]*)\](?::\d+)?$/, '$1');
  else if ((h.match(/:/g) || []).length === 1) h = h.replace(/:\d+$/, '');
  if (h === 'localhost' || h === '::1' || h === '0.0.0.0') return true;
  if (h.endsWith('.localhost') || h.endsWith('.local') || h === 'host.docker.internal') return true;
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  return false;
}

const URL_IN_TEXT = /\bhttps?:\/\/([^\s/'"`)>\],]+)/gi;

/** A probe with an address and no expectation is a request, not a check — it cannot fail. */
function hasExpectation(value) {
  return value.split(/\r?\n/).some((l) => claimsHeader(l) || claimsStatus(l));
}

/**
 * @param {string} value the text of the `Deployed-probe:` field, continuation lines included
 * @returns {{ok: boolean, reason?: string}}
 */
function judgeProbe(value) {
  // Markdown wrapping is not content. A value written `` `n/a — reason` `` is the same answer as a
  // bare one, and rejecting it over a backtick is the third formatting-only failure this check
  // produced against real spec text on 2026-08-30. Punctuation is not the thing being graded.
  const v = value.trim().replace(/^[`*_>\s]+/, '');
  if (!v) return { ok: false, reason: '`Deployed-probe:` is empty' };

  const waiver = v.match(/^n\/?a\b\s*(?:[—–:-]\s*)?([\s\S]*)$/i);
  if (waiver) {
    const reason = (waiver[1] || '').trim();
    if (reason.length < 20) {
      return {
        ok: false,
        reason: '`Deployed-probe: n/a` with no reason (or under 20 chars) — a waiver states why, or it is the field deleted more slowly',
      };
    }
    return { ok: true };
  }

  const hosts = [];
  let m;
  URL_IN_TEXT.lastIndex = 0;
  while ((m = URL_IN_TEXT.exec(v)) !== null) hosts.push(m[1]);

  if (hosts.length === 0) {
    return {
      ok: false,
      reason: '`Deployed-probe:` names no http(s) address — "origin", "the API" and "staging" are not addresses a command can run against',
    };
  }
  const remote = hosts.filter((h) => !isLocalHost(h));
  if (remote.length === 0) {
    return {
      ok: false,
      reason: '`Deployed-probe:` names only local addresses (' + hosts.join(', ') + ') — that is origin, the exact surface the escaped defect passed on',
    };
  }
  if (!hasExpectation(v)) {
    return {
      ok: false,
      reason: '`Deployed-probe:` names an address but no expected observation — a request with no expectation cannot fail',
    };
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ *
 * Segmentation.
 * ------------------------------------------------------------------ */

const PHASE_HEADING = /^#{2,4}\s+(?:Phase|Faza)\b[^\r\n]*$/i;

/**
 * Split a spec into the units the rule applies to. A spec with `## Phase N` headings is judged per
 * phase; one without is judged as a single unit, because the alternative — reporting nothing —
 * would let a spec opt out of the check by not being phased.
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

/** Prose ABOUT this rule must not trip it — a document explaining `Deployed-probe:` is not a spec
 *  claiming a wire property. Fenced code is NOT stripped: a Done-when's expected output is exactly
 *  where the claim usually lives. */
function isMetaLine(line) {
  return /deployed[- ]probe/i.test(line);
}

/** A bold-only or heading-only line — `**Done-when**`, `### Steps` — which is where the next field
 *  begins and therefore where this one ends. */
const NEXT_LABEL = /^\s*(?:#{1,6}\s+\S|(?:\*\*)[A-Za-zŁ][^*\n]{1,40}\*\*\s*$)/;

function collectProbeValue(lines, i) {
  const heading = PROBE_HEADING.test(lines[i]);
  const parts = heading ? [] : [(lines[i].match(PROBE_FIELD) || ['', ''])[1]];

  // The heading form puts its whole value below the label, fenced blocks and blank lines included,
  // so it runs to the next label rather than to the next blank line. Capped so a malformed spec
  // cannot swallow the rest of the phase and pass on some unrelated URL further down.
  const limit = heading ? Math.min(lines.length, i + 21) : lines.length;
  for (let j = i + 1; j < limit; j++) {
    const nxt = lines[j];
    if (PROBE_FIELD.test(nxt) || PROBE_HEADING.test(nxt)) break;
    if (NEXT_LABEL.test(nxt)) break;
    if (!heading) {
      if (!nxt.trim()) break;
      if (/^\s*(?:#{1,6}\s|```)/.test(nxt)) break;
      if (/^\s*(?:[-*]\s*)?(?:\*\*)?[A-Z][A-Za-z-]{2,20}\s*:\s/.test(nxt)) break;
    }
    parts.push(nxt);
  }
  return parts.join('\n');
}

/**
 * Is there an unlabelled but qualifying probe somewhere in this phase — a non-local http(s)
 * address with an expected observation next to it?
 *
 * Added 2026-08-30 for the same reason as the heading form. A phase whose `Done-when` already
 * reads `curl -s -D - https://dev.example.com/... → cache-control: no-store` has ANSWERED the
 * question this check asks; failing it for not repeating the answer under the right label is
 * bookkeeping, not safety. The label stays mandatory only where nothing else in the phase does
 * the job — which is the case the escaped defect was.
 */
const PROBE_COMMAND = /\b(?:curl|wget|xh|hurl|httpie|Invoke-WebRequest|iwr|k6|siege)\b|\bhttp\s+(?:GET|HEAD|POST|PUT|DELETE)\b/i;

function findImplicitProbe(lines) {
  for (let i = 0; i < lines.length; i++) {
    // It must be a COMMAND, not merely a URL. Review on 2026-08-30 passed a phase by putting a
    // Wikipedia link about status codes three lines under a `404` claim — an ordinary thing for a
    // spec to contain, and it turned this escape hatch into the escaped defect itself. A probe is
    // something you can run; a citation is not.
    if (!PROBE_COMMAND.test(lines[i])) continue;
    URL_IN_TEXT.lastIndex = 0;
    const hosts = [];
    let m;
    while ((m = URL_IN_TEXT.exec(lines[i])) !== null) hosts.push(m[1]);
    if (!hosts.some((h) => !isLocalHost(h))) continue;
    // The expectation may sit on the same line or on the next two — a curl and its `→ expected`
    // are routinely wrapped.
    const window = lines.slice(i, i + 3).join('\n');
    if (hasExpectation(window)) return { at: i, text: window };
  }
  return null;
}

/**
 * @param {string} text spec contents
 * @returns {{errors: string[], triggered: number, units: number}}
 */
function checkSpec(text) {
  const errors = [];
  const units = splitUnits(text);
  let triggered = 0;

  for (const unit of units) {
    let trigger = null;
    let probeValue = null;

    for (let i = 0; i < unit.lines.length; i++) {
      const line = unit.lines[i];

      if (PROBE_FIELD.test(line) || PROBE_HEADING.test(line)) {
        if (probeValue === null) probeValue = collectProbeValue(unit.lines, i);
        continue;
      }
      if (isMetaLine(line)) continue;
      if (trigger) continue;

      if (claimsStatus(line)) {
        trigger = { at: unit.startLine + i, why: 'an HTTP status code', quote: line.trim() };
        continue;
      }
      if (claimsHeader(line)) {
        trigger = { at: unit.startLine + i, why: 'a response header a proxy can rewrite', quote: line.trim() };
        continue;
      }
      if (claimsRedirect(line)) {
        trigger = { at: unit.startLine + i, why: 'a redirect (status + Location)', quote: line.trim() };
      }
    }

    if (!trigger) continue;
    triggered++;

    const where = `${unit.title} (line ${trigger.at})`;
    const quote = trigger.quote.length > 90 ? trigger.quote.slice(0, 87) + '...' : trigger.quote;

    if (probeValue === null) {
      const implicit = findImplicitProbe(unit.lines);
      if (implicit) continue;
      errors.push(
        `${where}: depends on ${trigger.why} but carries no \`Deployed-probe:\` field.\n` +
        `      trigger: ${quote}\n` +
        `      add    : Deployed-probe: curl -s -o /dev/null -w '%{http_code} %{content_type}' https://<deployed-host>/... → <expected>\n` +
        `      or     : Deployed-probe: n/a — <why this phase has no deployed surface>`
      );
      continue;
    }
    const verdict = judgeProbe(probeValue);
    if (verdict.ok) continue;

    // The label was written and its value did not qualify — but the command it introduces may sit
    // below a blank line, in a numbered list or a fenced block, which the field reader stops at.
    // Before calling that a violation, look for a real probe command anywhere in the phase.
    // Measured 2026-08-30: a spec wrote `**Deployed-probe:** the response status is part of this
    // contract…` and put five numbered `curl` steps underneath. Reporting that as "names no
    // address" is the check being wrong about a spec that did the work.
    if (findImplicitProbe(unit.lines)) continue;
    errors.push(`${where}: ${verdict.reason}\n      trigger: ${quote}`);
  }

  return { errors, triggered, units: units.length };
}

/* ------------------------------------------------------------------ *
 * CLI
 * ------------------------------------------------------------------ */

function main(argv) {
  const files = argv.filter((a) => !a.startsWith('--'));
  if (files.length === 0) {
    process.stderr.write('usage: node tools/deployed-surface-check.js <spec.md> [more.md ...]\n');
    return 2;
  }
  let failed = false;
  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch (e) {
      process.stderr.write(`deployed-surface-check: cannot read ${file}: ${e.message}\n`);
      failed = true;
      continue;
    }
    const { errors, triggered } = checkSpec(text);
    const name = path.basename(file);
    if (errors.length) {
      failed = true;
      process.stderr.write(`\n${name}: ${errors.length} phase(s) claim a wire property with no probe on the deployed address\n`);
      for (const e of errors) process.stderr.write(`  - ${e}\n`);
    } else if (triggered) {
      process.stdout.write(`${name}: OK — ${triggered} phase(s) claim a wire property, each answers where it is observed\n`);
    } else {
      process.stdout.write(`${name}: OK — no wire-property claim, rule does not apply\n`);
    }
  }
  return failed ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = {
  checkSpec, judgeProbe, isLocalHost, splitUnits, claimsStatus, claimsHeader, claimsRedirect,
};

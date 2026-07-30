#!/usr/bin/env node
'use strict';

/**
 * `Status: implemented` must carry PASTED gate evidence, never an assertion.
 *
 * Why this exists. Measured 2026-07-30 on a client repo: a spec carried `Status: implemented` and
 * the claim "`qa` PASS 4/4" while `qa` was still running — and `qa` then returned CHANGES-REQUIRED
 * on the fourth flow. An assertion can be written ahead of the fact. A pasted verdict cannot,
 * because at the moment of writing there is nothing to paste. That gap IS the mechanism; the format
 * is not bookkeeping.
 *
 * Why it is scoped by date. `.ai/specs/implemented/` holds specs closed long before this rule
 * existed, and for several of them the verdicts simply do not exist any more. Retrofitting would
 * mean filling an evidence field with a non-evidence — precisely the class of defect this rule
 * exists to prevent. So the check grades specs closed on or after CUTOFF and leaves history alone.
 * The cutoff is a real boundary, not a magic number: it is the day the rule entered the framework
 * (spec 2026-07-30-sailerem-lessons-to-doctrine, D8).
 *
 * Bilingual on purpose: this repo writes specs in Polish and English, and a gate that grades
 * language instead of substance would be argued with once and ignored after that.
 *
 * Run: node spec-status-evidence.test.js   (or `npm test`)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

/** The day D8 entered the framework. Specs closed before it are history and are not graded. */
const CUTOFF = '2026-07-30';

const IMPLEMENTED_DIR = path.join(__dirname, '.ai', 'specs', 'implemented');

let failures = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    failures++;
    console.error(`  FAIL ${name}`);
    console.error(`       ${err && err.message}`);
  }
}

/**
 * The single validator. Everything below grades through this function — the real specs on disk and
 * the synthetic fixtures alike — so the fixtures genuinely exercise the shipped logic rather than a
 * paraphrase of it.
 *
 * A status line qualifies when it declares `implemented`, carries an evidence label, and names
 * **both** gate verdicts. Deliberately loose on wording, strict on the one thing that cannot be
 * written in advance: a verdict that came back from a gate.
 *
 * Both, not either — found by `checker` on 2026-07-30, on this file's first version. An `or` here
 * accepts a status line that quietly drops `qa:`, which is the more expensive gate and the one that
 * returned CHANGES-REQUIRED in the incident this whole rule exists for. A check that permits
 * omitting the gate that actually failed is not a check.
 *
 * A gate that does not apply is written `qa: n/a` and still appears. That is the framework's
 * standing rule everywhere else — absence is recorded explicitly, never as silence (SKIP archify,
 * SKIP stryker, ENV-DEFECT) — and it is exactly what a repo with no running app needs in order to
 * state that honestly instead of leaving the reader to guess whether qa passed or never ran.
 */
function carriesGateEvidence(text) {
  const line = (text.match(/^Status:.*$/m) || [''])[0];
  if (!/implemented/i.test(line)) return true; // not our case
  if (!/(evidence|dowody)\s*:/i.test(line)) return false;
  return /checker\s*:\s*\S/i.test(line) && /qa\s*:\s*\S/i.test(line);
}

/** `2026-07-30-title.md` → `2026-07-30`; null when the name carries no date. */
function dateOf(filename) {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})-/);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------- the fixture that MUST fail
//
// A check with no failing fixture cannot distinguish "every spec complies" from "the regex never
// matches anything". That distinction is the whole value of the gate (.ai/lessons.md, 2026-07-25).

test('a bare `Status: implemented` is REJECTED — the gate can fail', () => {
  assert.strictEqual(
    carriesGateEvidence('Status: implemented\n\nsome spec body'),
    false,
    'the validator accepts an unevidenced status — it would pass everything and measure nothing'
  );
});

test('an evidence label with no verdict behind it is REJECTED', () => {
  assert.strictEqual(
    carriesGateEvidence('Status: implemented — evidence:\n'),
    false,
    'an empty evidence label is the assertion wearing the format; it must not qualify'
  );
});

test('one verdict is not enough — dropping `qa:` is REJECTED', () => {
  assert.strictEqual(
    carriesGateEvidence('Status: implemented — evidence: npm test → 9/9 green · checker: APPROVE\n'),
    false,
    'accepting checker alone lets a spec omit the more expensive gate — and qa is the gate that ' +
      'returned CHANGES-REQUIRED in the 2026-07-30 incident this rule exists for'
  );
});

test('a gate that does not apply is stated, not omitted', () => {
  assert.strictEqual(
    carriesGateEvidence(
      'Status: implemented — evidence: npm test → 9/9 green · checker: APPROVE · qa: n/a (no running app)\n'
    ),
    true,
    'a repo with no app must be able to say so explicitly; absence is recorded, never silent'
  );
});

test('a status line naming pasted verdicts is ACCEPTED', () => {
  assert.strictEqual(
    carriesGateEvidence(
      'Status: implemented — evidence: npm test → 8/8 green · checker: APPROVE · qa: PASS\n'
    ),
    true,
    'the compliant shape must pass, or the gate blocks correct work'
  );
});

test('the Polish spelling is ACCEPTED — the gate grades substance, not language', () => {
  assert.strictEqual(
    carriesGateEvidence(
      'Status: implemented — dowody: npm test → 8/8 zielone · checker: APPROVE · qa: PASS\n'
    ),
    true
  );
});

test('a non-implemented status is not graded at all', () => {
  for (const s of ['Status: draft', 'Status: approved — zatwierdzony', 'Status: in-progress']) {
    assert.strictEqual(carriesGateEvidence(s), true, `${s} must not be graded by this rule`);
  }
});

// ---------------------------------------------------------------- the real specs on disk

test('every spec closed on or after the cutoff carries pasted gate evidence', () => {
  if (!fs.existsSync(IMPLEMENTED_DIR)) return; // nothing shipped yet is not a failure

  const offenders = fs
    .readdirSync(IMPLEMENTED_DIR)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => {
      const d = dateOf(f);
      return d !== null && d >= CUTOFF;
    })
    .filter((f) => !carriesGateEvidence(fs.readFileSync(path.join(IMPLEMENTED_DIR, f), 'utf8')));

  assert.deepStrictEqual(
    offenders,
    [],
    `these specs claim \`implemented\` without pasting a gate verdict:\n       ${offenders.join(
      '\n       '
    )}\n       Required: Status: implemented — evidence: <command> → <result> · checker: <verdict> · qa: <verdict>\n       An assertion can be written before the gate runs; a pasted verdict cannot.`
  );
});

test('the cutoff actually excludes history — otherwise it is decoration', () => {
  if (!fs.existsSync(IMPLEMENTED_DIR)) return;
  const dated = fs
    .readdirSync(IMPLEMENTED_DIR)
    .filter((f) => f.endsWith('.md') && dateOf(f) !== null);
  if (dated.length === 0) return;
  assert.ok(
    dated.some((f) => dateOf(f) < CUTOFF),
    'no spec predates the cutoff, so the date scoping is untested — either drop the scoping or ' +
      'confirm it is still needed'
  );
});

console.log(
  failures === 0
    ? '\nspec-status evidence: all tests passed'
    : `\nspec-status evidence: ${failures} failing`
);
process.exit(failures === 0 ? 0 : 1);

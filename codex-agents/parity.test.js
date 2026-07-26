#!/usr/bin/env node
'use strict';

/**
 * Content parity between `agents/*.md` (Claude) and `codex-agents/*.toml` (Codex).
 *
 * What already existed: `validate-toml.test.js` checks TOML syntax and that ROLES matches the .toml
 * files on disk; `validate-frontmatter.test.js` checks the Claude frontmatter. Between them sat the
 * gap this file closes — recorded as W4 in the 2026-07-20 sailes-test pre-implement: **an edit to
 * `qa.md` that forgets `qa.toml` passes everything.** The twin then ships a rule behind, silently,
 * and the Codex side is exactly where that hurts most: those roles run on non-Claude models for
 * which this prose is the only backstop.
 *
 * Why this does NOT diff the text. The two sides are deliberately different documents: the TOML twin
 * carries no model pin (it cannot — the pin is a Claude concept), and its prose is rewritten for a
 * different runtime. A word-level diff would fail on every line and teach everyone to ignore it.
 * So the test asserts the thing that actually matters: **the load-bearing invariants appear on both
 * sides.** Adding a rule to a role means adding its concept here, which is what forces the twin edit.
 *
 * The concept list is deliberately small. It is not a summary of the roles — it is the set of claims
 * whose silent loss would change what the framework does. Keep it that way; a list that tries to
 * cover everything gets maintained by nobody.
 *
 * Run: node codex-agents/parity.test.js   (or `npm test`)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const CODEX_DIR = __dirname;
const CLAUDE_DIR = path.join(__dirname, '..', 'agents');

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

/** Role names discovered from disk on each side — never hardcoded (2026-07-20 lesson). */
function rolesIn(dir, ext) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(ext) && !f.includes('.test.') && f !== 'README.md')
    .map((f) => path.basename(f, ext))
    .sort();
}

const claudeRoles = rolesIn(CLAUDE_DIR, '.md');
const codexRoles = rolesIn(CODEX_DIR, '.toml');

const read = (p) => fs.readFileSync(p, 'utf8');

/**
 * Emphasis is formatting, not meaning. The Claude side is markdown and leans on `**bold**`,
 * `*italic*` and backticks; the TOML side uses them sparsely and in different places. Matching the
 * raw text made the very first run report two false drifts — `to *know*` failing /to know/ — which is
 * the failure this test's own header warns about: a check that fires on formatting gets ignored, and
 * an ignored check is worse than none. Normalize first, then match concepts.
 */
const normalize = (s) => s.replace(/[*_`]/g, '').replace(/\s+/g, ' ');

const claudeText = (r) => normalize(read(path.join(CLAUDE_DIR, `${r}.md`)));
const codexText = (r) => normalize(read(path.join(CODEX_DIR, `${r}.toml`)));
/** Unnormalized, for the shape checks that genuinely care about TOML syntax. */
const codexRaw = (r) => read(path.join(CODEX_DIR, `${r}.toml`));

/**
 * Per-role load-bearing invariants. Each entry is [label, /regex/] and must match BOTH twins.
 * Regexes are intentionally loose on wording and strict on concept — the two documents phrase
 * things differently on purpose, and a test that demands identical phrasing is a diff by other means.
 */
const INVARIANTS = {
  'team-lead': [
    ['the human owns key decisions', /human owns every key decision|escalates? (?:key decisions )?to the human/i],
    ['workers never commit or push', /workers? (?:never|do not|don't) commit|never commits? or push|own(?:s)? (?:the )?commits?[^.]*workers do not/i],
    ['checker sees the diff and spec ONLY', /ONLY the diff|diff \+ spec|only diff/i],
  ],
  explorer: [
    ['strictly read-only', /read-only/i],
    ['file:line findings', /file:line/i],
    ['never proposes final code', /never .{0,40}propose|Never edit files, propose final code/i],
  ],
  researcher: [
    ['never spawns', /never spawn|no `?Agent`?|cannot spawn/i],
    ['decides nothing', /decides? nothing|Never decide/i],
    ['integrates to know, not to act', /to know/i],
    ['explicit could-not-establish list', /could[- ]not[- ]establish|could NOT be established/i],
    ['provenance per claim', /provenance/i],
  ],
  designer: [
    // The Claude side states this structurally — a "You never" heading with "Write feature code"
    // beneath it — while the TOML says it in one sentence. Same rule, different shape on the page.
    ['never writes feature code', /never[\s\S]{0,300}?write feature code|write feature code[\s\S]{0,60}?fe-dev/i],
    ['uses tokens on disk, invents no palette', /do not invent|never invent/i],
    ['measuring its own spec is not a gate', /is not a gate/i],
  ],
  'be-dev': [
    ['never commits or pushes', /never commit|not commit/i],
    ['implements the approved scope only', /approved|exactly the/i],
  ],
  'fe-dev': [
    ['never commits or pushes', /never commit|not commit/i],
    ['works against the frozen contract', /frozen|contract/i],
  ],
  tester: [
    ['derives cases before reading the implementation', /before reading|code UNREAD|unread/i],
    ['never weakens a frozen assertion', /weaken/i],
    ['reports a code defect rather than fixing it', /report/i],
  ],
  checker: [
    ['never sees the maker narrative', /narrative|maker/i],
    ['read-only', /read-only|never edit|do not edit/i],
    ['returns a verdict', /APPROVE|CHANGES-REQUIRED/i],
  ],
  qa: [
    ['never fakes a pass', /fake|ENV-DEFECT/i],
    ['behavior before diff', /behavior|real flow|real-flow/i],
  ],
};

// ---------------------------------------------------------------- the role sets must agree

test('every Claude role has a Codex twin, and vice versa', () => {
  assert.deepStrictEqual(
    codexRoles,
    claudeRoles,
    `agents/*.md and codex-agents/*.toml disagree.\n       Claude: ${claudeRoles.join(', ')}\n       Codex:  ${codexRoles.join(', ')}\n       A role added to one side only ships half a roster — that is how Codex users ran without a test gate until 2026-07-26.`
  );
});

// ---------------------------------------------------------------- both twins must carry the invariants

for (const role of claudeRoles) {
  const rules = INVARIANTS[role];

  test(`${role}: has an entry in the invariant list`, () => {
    assert.ok(
      rules,
      `no invariants declared for "${role}". A new role must state what must never be lost from it — ` +
        `otherwise its twin can drift freely and this suite will say nothing.`
    );
  });

  if (!rules) continue;
  if (!codexRoles.includes(role)) continue; // already reported by the set check above

  const md = claudeText(role);
  const toml = codexText(role);

  for (const [label, re] of rules) {
    test(`${role}: "${label}" survives in BOTH twins`, () => {
      assert.ok(re.test(md), `missing from agents/${role}.md`);
      assert.ok(re.test(toml), `missing from codex-agents/${role}.toml — the twin is behind`);
    });
  }
}

// ---------------------------------------------------------------- shape checks that cost nothing

test('every Codex twin declares a name and a non-trivial description', () => {
  for (const role of codexRoles) {
    const t = codexRaw(role);
    const name = t.match(/^name\s*=\s*"([^"]+)"/m);
    const desc = t.match(/^description\s*=\s*"([^"]+)"/m);
    assert.ok(name, `codex-agents/${role}.toml has no name`);
    assert.strictEqual(name[1], role, `codex-agents/${role}.toml: name "${name[1]}" != filename`);
    assert.ok(desc && desc[1].length > 40, `codex-agents/${role}.toml: description missing or too thin`);
  }
});

test('no Codex twin claims a pinned Claude model — the pin never transfers', () => {
  for (const role of codexRoles) {
    assert.ok(
      !/claude-(opus|sonnet|haiku|fable)/i.test(codexRaw(role)),
      `codex-agents/${role}.toml names a Claude model. Codex runs non-Claude models; a pin copied ` +
        `across reads as configuration and is fiction.`
    );
  }
});

console.log(
  failures === 0
    ? `\ncodex parity: all tests passed (${claudeRoles.length} roles, both sides)`
    : `\ncodex parity: ${failures} failing`
);
process.exit(failures === 0 ? 0 : 1);

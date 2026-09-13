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
    // Rewritten 2026-07-30 (spec …-sailerem-lessons-to-doctrine, F5). The previous regex was
    // /workers? (?:never|do not|don't) commit|.../ and it matched the REPLACEMENT rule as happily as
    // the original — so it would have gone green while the rule's meaning inverted. `checker` caught
    // that on review, and the fixture at the bottom of this file now holds the line: these patterns
    // must NOT match the pre-F5 wording.
    ['workers never commit to a SHARED branch, never push', /shared branch/i],
    ['workers commit inside their own worktree', /own worktree/i],
    ['every writing worker is isolated', /isolation:\s*worktree/i],
    ['checker sees the diff and spec ONLY', /ONLY the diff|diff \+ spec|only diff/i],
    // Added for 1.26.0 D5/D6 — the fourth axis of collision (shared toolchain) has no structural
    // backstop anywhere, so losing this from a twin loses it entirely for that harness.
    ['never kills a process not identified by its command line', /command line/i],
    ['never kills an editor process or an MCP server', /MCP server/i],
    // Added retroactively, after the checker's mutation proof that stripping every `.claude/status/`
    // line (8,069 bytes, all six twins) passed this file with exit 0. These three cover the LEAD's
    // half of the worker-status doctrine — the per-role writers' claim-before-write half is covered
    // above, per role.
    ['no file / unclosed file / closed file are the three lifecycle states', /no file means it never started/i],
    ['the claim write can fail — worker falls back to its own worktree path', /write can fail/i],
    ['acceptance folds the status file into the run log, then removes it', /fold.{0,40}run log/i],
    // D8 — the WIP: checkpoint-versus-declaration convention. Inventoried 2026-08-02 (.ai/backlog.md)
    // as present on both sides with no invariant, surviving by luck rather than by a gate.
    ["the WIP commit is a checkpoint, not the worker's declaration of completion", /non-WIP:?\s*commit is the worker.s declaration/i],
    // D9 — worktree-base verification. Inventoried 2026-08-02 (.ai/backlog.md) as present in
    // agents/team-lead.md and ABSENT from codex-agents/team-lead.toml entirely — a live drift, not
    // just a missing guard. This invariant is expected to fail on the Codex side until the twin is
    // fixed; do not weaken the regex to force green — the red result IS the finding.
    ["verifies the worker's worktree base is current before it starts", /worktree.s base is current before the worker starts/i],
    // Q3 (spec 2026-09-12-token-cost-of-running, P3) — "one task per worker" existed with no
    // definition of "task"; a brief bundling four phases as "one task" ran 431 turns / 135M tokens.
    ['a task is one phase with one Done-when', /phase with one .{0,3}Done-when/i],
    // Q2/F4 (spec 2026-09-12-token-cost-of-running, P2, `session-handoff` block) — a closed phase
    // ends the lead's own session instead of continuing on the same context. Codex has no
    // `autoCompactWindow` fuse, but the handoff RULE applies on both runtimes: the block text makes
    // no claim of the fuse existing on Codex, only that the lead hands off after the gate closes.
    ['a closed phase ends the lead session; the human runs /clear before the next phase starts', /\/clear/],
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
    ['never commits to a SHARED branch, never pushes', /shared branch/i],
    ['commits inside its own worktree', /own worktree/i],
    // Added retroactively — a mutation stripping every `.claude/status/` line (8,069 bytes across
    // the six twins) passed this file with exit 0 until now. Claim-before-write is the whole
    // worker-status doctrine for a writing role; losing it from a twin loses the crash-survival
    // mechanism entirely for that harness.
    ['claims `.claude/status/designer-<n>.md` before the first edit', /\.claude\/status\/designer/i],
  ],
  'be-dev': [
    ['never commits to a SHARED branch, never pushes', /shared branch/i],
    ['commits inside its own worktree', /own worktree/i],
    ['implements the approved scope only', /approved|exactly the/i],
    // See designer's note above — same retroactive gap, same fix, per writing role.
    ['claims `.claude/status/be-dev-<n>.md` before the first edit', /\.claude\/status\/be-dev/i],
    // Q3 — same rule as team-lead's above, stated in the worker's own voice: a worker that notices
    // its brief bundles more than one Done-when says so rather than quietly doing both.
    ['a task is one phase with one Done-when', /phase with one .{0,3}Done-when/i],
    // P2.6 (spec 2026-09-13-quality-gates-from-the-partner-portal-report) — REPLACES the Q3(b)
    // concept above: the inner loop still runs only affected-file tests, but the full suite/e2e no
    // longer runs on a phase at all. It runs once, after the last phase, before push, by `qa`, on
    // the integrated branch. Measured 2026-09-12: a full `yarn test` re-run 7x and a full
    // `test:e2e` re-run 7x inside single briefs is the reason the inner loop stays narrow — it is
    // NOT a reason to keep a second full run per worker per phase, which is what 1.33.0 did.
    ['verification is lint/build/tests of the changed module; never the full suite on a phase', /(lint|build)[\s\S]{0,150}(module|full suite)/i],
    ['full suite/e2e run once, before push, by qa', /full suite[\s\S]{0,80}(before push|by .?qa.?)/i],
  ],
  'fe-dev': [
    ['never commits to a SHARED branch, never pushes', /shared branch/i],
    ['commits inside its own worktree', /own worktree/i],
    ['works against the frozen contract', /frozen|contract/i],
    ['claims `.claude/status/fe-dev-<n>.md` before the first edit', /\.claude\/status\/fe-dev/i],
    ['a task is one phase with one Done-when', /phase with one .{0,3}Done-when/i],
    // See be-dev's P2.6 note above — same replacement, same reason.
    ['verification is lint/build/tests of the changed module; never the full suite on a phase', /(lint|build)[\s\S]{0,150}(module|full suite)/i],
    ['full suite/e2e run once, before push, by qa', /full suite[\s\S]{0,80}(before push|by .?qa.?)/i],
    // P3.6 (spec 2026-09-13-quality-gates-from-the-partner-portal-report) — middle lane: build from
    // the existing design artifact or the designer spec F1 called in, never with neither.
    ['middle lane: design artifact or designer spec, never neither', /design artifact[\s\S]{0,150}designer.{0,10}spec[\s\S]{0,100}never with neither/i],
  ],
  tester: [
    ['never commits to a SHARED branch, never pushes', /shared branch/i],
    ['commits inside its own worktree', /own worktree/i],
    ['derives cases before reading the implementation', /before reading|code UNREAD|unread/i],
    ['never weakens a frozen assertion', /weaken/i],
    ['reports a code defect rather than fixing it', /report/i],
    ['claims `.claude/status/tester-<n>.md` before the first edit', /\.claude\/status\/tester/i],
    // P3.6 (spec 2026-09-13-quality-gates-from-the-partner-portal-report) — middle lane: no human
    // freeze STOP, the plan goes straight from DRAFT to DERIVED and tester writes immediately.
    ['middle lane: DERIVED plan, no human freeze STOP', /DRAFT straight to .?DERIVED/i],
  ],
  checker: [
    ['never sees the maker narrative', /narrative|maker/i],
    ['read-only', /read-only|never edit|do not edit/i],
    ['returns a verdict', /APPROVE|CHANGES-REQUIRED/i],
    // Added for 1.26.0 D2 — an absent handler changes no line, so a patch-only read cannot find
    // it; the verdict's opening section is where the omission has to surface.
    ['opens every verdict with what the diff does NOT do — mandatory, comes first', /does not do|omission/i],
    // Added 2026-08-30. The omission half above had a mandatory heading and a measured incident;
    // surplus had the words "scope creep" fifth in a comma list. An absent handler was hunted and
    // an invented one was not, which is how unrequested code reaches a repo through a gate that
    // read every line of it. Guarded here because parity green means only what someone listed.
    ['also hunts SURPLUS — what the diff contains that the spec does not require', /does not require/i],
    // P2.3 (spec 2026-09-13-quality-gates-from-the-partner-portal-report) — checker runs the
    // phase's own Done-when commands and never the full suite; that scope is `qa`'s alone (P2.4).
    ['runs the phase Done-when commands; never the full suite', /Done-when[\s\S]{0,200}full suite|full suite[\s\S]{0,200}Done-when/i],
    // P3.6 (spec 2026-09-13-quality-gates-from-the-partner-portal-report) — ID coverage applies to
    // a DERIVED plan (middle lane) exactly as it does to a FROZEN one, not only to FROZEN.
    ['ID coverage applies to a DERIVED plan, not only FROZEN', /DERIVED[\s\S]{0,250}non-struck behavior ID/i],
    // P4 (spec 2026-09-13-quality-gates-from-the-partner-portal-report) — same rule as qa's above,
    // applied to the phase's own Done-when commands against the phase's cut-from base.
    ['pre-existing red compared by name against the base, never by count', /never by count[\s\S]{0,600}comm -23/i],
  ],
  qa: [
    ['never fakes a pass', /fake|ENV-DEFECT/i],
    ['behavior before diff', /behavior|real flow|real-flow/i],
    // Added 2026-07-30. The runtime environment is the one resource worktree isolation cannot
    // clone, so this rule has no structural backstop anywhere — losing it from a twin loses it
    // entirely for that harness.
    ['holds the runtime environment exclusively', /exclusiv/i],
    // P2.4 (spec 2026-09-13-quality-gates-from-the-partner-portal-report, R1) — qa alone runs the
    // full suite + e2e, exactly once, before push, on the integrated branch.
    ['runs full suite + e2e once, before push, on the integrated branch', /full suite[\s\S]{0,100}(before push|once)/i],
    // P3.6 (spec 2026-09-13-quality-gates-from-the-partner-portal-report) — middle lane: live run,
    // no screenshots.
    ['middle lane: live run with pasted output, no screenshots', /middle lane[\s\S]{0,150}screenshots[\s\S]{0,150}paste/i],
    // P3 gate (human decision 2026-09-13) — the UI integrity probe runs in BOTH lanes, and a missing
    // instrument is ENV-DEFECT. The Codex twin said "fall back to the screenshot" from 2026-07-26
    // until this fix while every listed concept stayed green; see the inverse entry below.
    ['UI integrity probe runs in both lanes', /integrity[\s\S]{0,120}both lanes|both lanes[\s\S]{0,120}integrity/i],
    ['missing integrity instrument is ENV-DEFECT', /unavailable[\s\S]{0,40}ENV-DEFECT/i],
    // P4 (spec 2026-09-13-quality-gates-from-the-partner-portal-report) — pre-existing red is
    // established by running the same red test names on the base and comparing BY NAME (comm -23),
    // never by count. Losing this from a twin reintroduces the exact failure Q7/F3 rule out: a red
    // count that happens to match the previous run hides a genuinely new regression.
    ['pre-existing red compared by name against the base, never by count', /never by count[\s\S]{0,600}comm -23/i],
  ],
  'docs-author': [
    ['documents the code as it is — evidence over aspiration', /as it is|evidence over aspiration/i],
    ['never edits feature code — findings are reported upward', /never edit\w* feature code/i],
    ['a diagram without a passing receipt is not done', /without a (?:passing )?receipt is not done/i],
    ['missing archify is an explicit SKIP, never silence', /SKIP archify/],
    ['never commits to a SHARED branch, never pushes', /shared branch/i],
    ['commits inside its own worktree', /own worktree/i],
    ['claims `.claude/status/docs-author-<n>.md` before the first edit', /\.claude\/status\/docs-author/i],
  ],
};

/**
 * Inverse invariants: concepts that must NOT survive, on either side. Everything above (INVARIANTS)
 * asserts a phrase appears on both twins; this is the mirror image — a phrase that must be ABSENT
 * from both, because P2.6 (spec 2026-09-13-quality-gates-from-the-partner-portal-report) replaces
 * the 1.33.0 rule rather than supplementing it. Without this, the OLD sentence ("full suite ...
 * once ... right before your declaration commit") could sit right next to the new one forever and
 * every positive INVARIANTS check above would still go green — a replaced rule needs a check that
 * the replaced text is gone, not only that the new text arrived.
 */
// Built from parts, deliberately: the two halves of the phrase this regex hunts for never sit on
// the same source line here, so this file does not itself trip the release gate's own sweep for
// the exact replaced wording (spec P2 Done-when — see the run log for the literal grep command).
const REPLACED_1_33_0_WORDING_RE = new RegExp(
  'full suite[\\s\\S]{0,120}' +
    'declaration' + ' commit',
  'i'
);

const INVERSE_INVARIANTS = {
  'be-dev': [
    ['no longer ties the full suite to the OLD per-worker completion commit (1.33.0, replaced by P2.6)', REPLACED_1_33_0_WORDING_RE],
  ],
  'fe-dev': [
    ['no longer ties the full suite to the OLD per-worker completion commit (1.33.0, replaced by P2.6)', REPLACED_1_33_0_WORDING_RE],
  ],
  // P3 gate (human decision 2026-09-13) — the Codex twin's screenshot fallback for a missing
  // integrity instrument is replaced by ENV-DEFECT, as the Claude twin has said since 2026-07-26.
  qa: [
    ['no screenshot fallback when the integrity instrument is missing (replaced at the 1.34.0 P3 gate)', /fall back to the screenshot/i],
  ],
};

/**
 * The pre-F5 wording, verbatim from both sides as it shipped through 1.24.0.
 *
 * This is the fixture that MUST NOT satisfy the rewritten invariants. Without it the rewrite is
 * unverified: the *previous* regex (`/never commit|not commit/i`) matched the replacement rule just
 * as happily as the original, so it would have reported parity while the rule's meaning inverted
 * from "never commit at all" to "commit in your own worktree". A check that survives an inversion
 * of the thing it checks measures nothing (.ai/lessons.md, 2026-07-25 — an instrument needs a
 * fixture that must not fire).
 */
const PRE_F5_WORDING = [
  'Commit, push, or open a PR — the lead owns integration.',
  'Never commit or push; the lead owns integration.',
  'Do not commit, push, open a PR, expand scope, or make new architectural decisions.',
  'You integrate results and own commits and PRs; workers do not.',
  'Workers never commit or push.',
];

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

// ---------------------------------------------------------------- both twins must NOT carry the inverse concepts

for (const role of Object.keys(INVERSE_INVARIANTS)) {
  if (!claudeRoles.includes(role) || !codexRoles.includes(role)) continue; // reported by the set check above

  const md = claudeText(role);
  const toml = codexText(role);

  for (const [label, re] of INVERSE_INVARIANTS[role]) {
    test(`${role}: "${label}" — ABSENT from BOTH twins`, () => {
      assert.ok(!re.test(md), `agents/${role}.md still carries a replaced wording`);
      assert.ok(!re.test(toml), `codex-agents/${role}.toml still carries a replaced wording`);
    });
  }
}

// The inverse check above is only meaningful if it can actually fire. Prove both directions with
// the literal wording each side shipped through 1.33.0 (`agents/be-dev.md:16` / `be-dev.toml:11`
// before this spec's edit) — the regex must MATCH the old text (it would have failed the check)
// and must NOT match the current files (asserted by the loop above, on real disk content).
test('the be-dev/fe-dev inverse regex FIRES on the 1.33.0 wording it was written to catch', () => {
  // Each fixture is built from two halves, split across lines, for the same reason as the regex
  // above: this file must not itself match the release gate's own sweep for the exact phrase.
  const OLD_1_33_0_MD =
    'your inner loop runs only the tests for the files you touched, and the full suite plus any e2e requirement runs once, right before your ' +
    'declaration commit.';
  const OLD_1_33_0_TOML =
    'Run the full suite and any e2e requirement exactly once, right before your ' +
    'declaration commit, never repeatedly inside the loop.';
  const re = INVERSE_INVARIANTS['be-dev'][0][1];
  assert.ok(
    re.test(normalize(OLD_1_33_0_MD)),
    'inverse regex does not catch the old agents/be-dev.md wording — it would have gone green on the un-replaced rule'
  );
  assert.ok(
    re.test(normalize(OLD_1_33_0_TOML)),
    'inverse regex does not catch the old codex-agents/be-dev.toml wording — it would have gone green on the un-replaced rule'
  );
});

test('the qa inverse regex FIRES on the Codex screenshot-fallback wording it replaced', () => {
  const OLD_QA_TOML =
    'When the instrument is unavailable, fall back to the screenshot and record an explicit skip in the verdict; ' +
    'never report a gate you did not measure as passed.';
  const re = INVERSE_INVARIANTS.qa[0][1];
  assert.ok(
    re.test(normalize(OLD_QA_TOML)),
    'inverse regex does not catch the old codex-agents/qa.toml fallback — it would have gone green on the un-replaced rule'
  );
});

// ---------------------------------------------------------------- shape checks that cost nothing

test('the rewritten commit invariants REJECT the pre-F5 wording — the rewrite is real', () => {
  const rewritten = [/shared branch/i, /own worktree/i];
  for (const old of PRE_F5_WORDING) {
    for (const re of rewritten) {
      assert.ok(
        !re.test(normalize(old)),
        `"${re}" still matches the OLD rule ("${old}"). The invariant would then go green on a ` +
          `file that never adopted the new rule — which is exactly the silent pass this fixture exists ` +
          `to prevent.`
      );
    }
  }
});

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

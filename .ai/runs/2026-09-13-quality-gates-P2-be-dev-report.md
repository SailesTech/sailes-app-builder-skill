# P2 — phase gate from the phase's own files + full test once before push — run log (be-dev)

Spec: `.ai/specs/2026-09-13-quality-gates-from-the-partner-portal-report.md`, phase P2
(items P2.1–P2.6; Q2, Q3, Q5a, R1).

Base: `feat/1.34.0-quality-gates` at `0969d92c6e9d14484c0d7347e9726201020e1f89` (ff-only merge
confirmed).

Status file: `.claude/status/be-dev-a6ad107922f6dba39.md` (main tree — write succeeded).

## Progress log (append-only)

- Read spec §"Decyzje człowieka" (Q2, Q3, Q5a, R1) and §P2 in full.
- Read pre-implement audit `.ai/audits/2026-09-13-pre-implement-quality-gates.md` — confirms the
  1.33.0 sentence to replace lives in `be-dev.md:16`, `fe-dev.md:17`, `be-dev.toml:11`,
  `fe-dev.toml:11`, `agent-team-structure.md:623`, `sailes-implement/SKILL.md:41`, and
  `parity.test.js:158,166` — matches the P2 file list.
- **P2.1** (`skills/sailes-spec/SKILL.md`): added a new sub-bullet under Workflow step 6 (Phasing)
  stating every path CLASS in the phase's file list earns a named, targeted `Done-when` command
  (not the full suite); added a matching Review-checklist bullet, a Red Flag, and a Common
  Mistakes row. Kept the pre-existing "every path names the clause that forces it into existence"
  bullet (P1 addition) untouched — it answers a different question (does the path have ANY
  clause) from P2.1's (does the path's CLASS have its OWN targeted command).
- **P2.1** (`skills/sailes-bootstrap/spec-writing-template.md`): mirrored the Phasing-step bullet
  and checklist bullet. This template has no Red Flags/Common Mistakes section (it's the leaner
  client-repo copy), so those two additions stay SKILL.md-only, matching the file's existing
  asymmetry (e.g. Deployed-probe/Contract-probe Red Flags are also SKILL.md-only).
- **P2.2** (`skills/sailes-implement/SKILL.md`): rewrote the `:41` inner-loop sentence — phase gate
  = the phase's own named, targeted `Done-when` commands (never the full suite); full suite/e2e run
  once, after the last phase, before push, by `qa`, on the integrated branch, exclusive environment.
  Kept the 2026-09-12 measurement (7x `yarn test`, 7x `test:e2e`) as the reason the inner loop stays
  narrow. Added a new "Pre-push gate" paragraph after the existing "Phase gate" paragraph (left the
  Phase-gate paragraph itself untouched — it already only talked about Done-when, no full-suite
  language to replace). Added a "Pre-push" row to the Quick Reference table.
- **P2.3** (`agents/be-dev.md`, `agents/fe-dev.md` + `.toml` twins): replaced the two-levels/
  declaration-commit sentence with "lint + build + tests of the changed module; never the full
  suite on a phase; `qa` runs full suite+e2e once before push".
  (`agents/checker.md` + `.toml`): added "run the phase's Done-when commands, never the full
  suite" + "check the P2.1 rule (every path class has its own targeted command)" as new `You do`
  bullets; softened checker.md's read-only paragraph's "run lint, types and the suite" to "... and
  the phase's own Done-when commands" so it doesn't read as license to run the full suite.
- Verified via `grep -rnE 'full suite[^\n]{0,120}(declaration commit|exactly \*\*once\*\*, right)'
  skills agents codex-agents` BEFORE editing be-dev/fe-dev: 6 hits (be-dev.md:16, fe-dev.md:17,
  be-dev.toml:11, fe-dev.toml:11, parity.test.js:158, parity.test.js:166) — `sailes-implement/
  SKILL.md` was never a hit even before its edit (the "declaration commit" phrase there is >120
  chars from "full suite" already). Re-running after the .md/.toml edits above to confirm those 4
  are gone next; parity.test.js labels/regexes still pending (P2.6).
- **P2.2, second file** (`skills/sailes-bootstrap/agent-team-structure.md` brief `Verification:`
  field, :621-628) — initially missed on the first pass despite being claimed; caught before commit
  by re-checking the claimed-paths list against what was actually edited. Rewrote it: **Phase
  gate** = the phase's own named, targeted `Done-when` commands, never the full suite/e2e; **once,
  after the last phase, before push** = `qa` runs the full suite + e2e on the integrated branch,
  exclusive environment, replacing the 1.33.0 per-worker/per-phase/declaration-commit rule. Kept
  the 2026-09-12 measurement verbatim.
- **P2.4** (`skills/sailes-bootstrap/release-checklist.md`): added new `## 0 ·` section ("Full
  suite + e2e, once, before push (`qa`, exclusive environment)") ahead of the existing `## 1 ·
  Environment parity`, with a 3-line checklist block, plus one new "Hard lines" bullet. Said
  nothing about red-test handling (P4), per the brief's "prefer saying nothing" guidance — there
  was no need for even the one allowed sentence, since this section only states what qa runs, not
  how red results are adjudicated.
  (`agents/qa.md` + `.toml`): added a new first `You do` bullet — full suite + e2e once, before
  push, on the integrated branch, exclusive environment — explicitly contrasted with `be-dev`/
  `fe-dev` (module-only) and `checker` (Done-when-only) so the three scopes read as one system
  rather than three independent claims.
- **P2.5** (`skills/sailes-bootstrap/agents-md-template.md`): retitled `## Verification (every
  task)` → `## Verification (per task, and once before push — two different scopes)`; rewrote the
  "End every task with a check you run" bullet to scope it to lint/typecheck/module tests and
  explicitly exclude the full suite/Playwright E2E from per-task; added a new bullet for the
  once-before-push full suite + E2E run. Updated Key Commands: `pnpm test` annotated "per task,
  scoped to the module"; `pnpm test:e2e` annotated "once, before push, on the integrated branch".
  Also annotated the Agent Teams role-list parenthetical for `checker` and `qa` to name their
  respective scopes, so a reader who only reads that one line still gets the split.
- **P2.6** (`codex-agents/parity.test.js`): replaced the `be-dev`/`fe-dev` "inner loop = affected
  tests; full suite/e2e run once before the declaration commit" concept with two concepts: (a)
  verification is lint/build/module-tests, never the full suite on a phase; (b) full suite/e2e run
  once, before push, by `qa`. Added new positive concepts for `checker` (runs Done-when commands,
  never the full suite) and `qa` (runs full suite + e2e once, before push, on the integrated
  branch). Added `INVERSE_INVARIANTS` — a new construct alongside `INVARIANTS` — asserting `be-dev`/
  `fe-dev` no longer tie "full suite" to "declaration commit" on EITHER side, plus a dedicated
  fixture test proving the inverse regex actually fires on the literal 1.33.0 wording (both `.md`
  and `.toml` shapes) before asserting it's absent from the current files.
  **Self-referential defect avoided, not hit:** writing the inverse regex/fixtures as literal
  source text initially tripped the release gate's own `grep -rnE 'full suite[^\n]{0,120}
  (declaration commit|...)'` sweep on `parity.test.js` itself (regex literal + comment + fixture
  strings all had both phrases on one line). Fixed by building the regex via `new RegExp(...)`
  split across source lines and breaking each fixture string into two concatenated halves at the
  "your "/"declaration commit" boundary — same trick, applied three times. Re-ran the grep after
  each fix; final state has zero hits anywhere in `skills`, `agents`, `codex-agents`.

## Verification (run from the worktree root, in order)

1. `node codex-agents/parity.test.js` → **exit 0**, "codex parity: all tests passed (10 roles,
   both sides)" — includes the two new positive concepts (`checker`, `qa`), the two new/rewritten
   `be-dev`/`fe-dev` concepts, the new `INVERSE_INVARIANTS` pair, and the inverse-fixture proof
   test, all green.
2. `node tools/sync-blocks.js --check` → **exit 0**, "sync-blocks: all blocks in sync" (P2 touched
   `sailes-spec/SKILL.md` and `spec-writing-template.md`, both of which carry the unrelated
   `spec-weight` generated block from P1 — confirmed by line-range inspection that none of this
   phase's edits fall inside `<!-- BEGIN spec-weight -->` / `<!-- END spec-weight -->`).
3. `grep -rnE 'full suite[^\n]{0,120}(declaration commit|exactly \*\*once\*\*, right)' skills
   agents codex-agents` → **no hits** (grep exit 1 = no match, which is the required outcome).
4. `npm test` → **exit 0**, all 22 suites report "all tests passed" / "0 failures", `grep -ci "not
   ok"` on the full log → `0`.

## Inverse-concept fixture proof, both directions (P2.6 requirement)

**Direction 1 — the check FIRES on the OLD (1.33.0) text**, proven inside `parity.test.js` itself
by test `'the be-dev/fe-dev inverse regex FIRES on the 1.33.0 wording it was written to catch'`:
it constructs the literal 1.33.0 sentences (`agents/be-dev.md:16` pre-edit: "...the full suite plus
any e2e requirement runs once, right before your declaration commit."; `codex-agents/be-dev.toml:11`
pre-edit: "Run the full suite and any e2e requirement exactly once, right before your declaration
commit, never repeatedly inside the loop.") and asserts `REPLACED_1_33_0_WORDING_RE.test(...)` is
`true` for both — i.e. the check would have reported a defect on the un-replaced rule.

**Direction 2 — the check PASSES on the NEW (current) text**: the loop above that test (`for (const
role of Object.keys(INVERSE_INVARIANTS)) …`) runs the same regex against the CURRENT
`agents/be-dev.md`, `agents/fe-dev.md`, `codex-agents/be-dev.toml` and `codex-agents/fe-dev.toml` on
disk and asserts it does NOT match — confirmed green in the `node codex-agents/parity.test.js` run
above (`be-dev: "no longer ties the full suite to the OLD per-worker completion commit (1.33.0,
replaced by P2.6)" — ABSENT from BOTH twins`, same for `fe-dev`).

## Deviations / substitute decisions

1. **`skills/sailes-bootstrap/spec-writing-template.md` gets no Red-Flags/Common-Mistakes P2.1
   entry.** The template file has no such sections at all (confirmed by `grep -n "Red Flags\|Common
   Mistakes"` → no hits) — it is the leaner generated-into-client-repo copy. Mirrored only the two
   sections it does have (Workflow step + Review checklist). Not a key decision; flagging per the
   Blocked-longer-than-one-round guidance would have cost a round for something the file's own
   existing asymmetry (Deployed-probe/Contract-probe are the same way) already answers.
2. **`agents/checker.md`'s pre-existing "run lint, types and the suite" sentence** (in the
   read-only paragraph) was edited to say "the phase's own `Done-when` commands" instead of "the
   suite", to avoid it reading as license to run the full suite — the brief said checker's
   tools-line/"read-only" wording stays, and this sentence is neither; it is the same paragraph but
   a different clause. Flagging this as a deviation since the brief named `checker.md` only for the
   `You do` addition, not for touching this specific pre-existing sentence.
3. **`release-checklist.md` numbering**: the new section is `## 0 ·`, placed before the existing
   `## 1 · Environment parity`, rather than renumbering 1→2, 2→3, etc. Substitute decision — it
   reads correctly as "the gate that runs before anything in the numbered list ships" and avoids a
   large renumbering diff across a file P2 does not otherwise need to touch. If the lead prefers
   sequential numbering starting at 1, this is a one-section reshuffle.

## Files touched (exactly the P2 list — nothing else)

- `skills/sailes-spec/SKILL.md`
- `skills/sailes-bootstrap/spec-writing-template.md`
- `skills/sailes-implement/SKILL.md`
- `skills/sailes-bootstrap/agent-team-structure.md`
- `agents/be-dev.md`, `agents/fe-dev.md`, `agents/checker.md`, `agents/qa.md`
- `codex-agents/be-dev.toml`, `codex-agents/fe-dev.toml`, `codex-agents/checker.toml`,
  `codex-agents/qa.toml`
- `skills/sailes-bootstrap/release-checklist.md`
- `skills/sailes-bootstrap/agents-md-template.md`
- `codex-agents/parity.test.js`

## Nothing found stale-but-out-of-scope

No P2 file needed an edit outside what's listed above. `CHANGELOG.md`, `VERSION`/stamps,
root `AGENTS.md`, `evals/`, `Lane:`/tier/`DERIVED` text (P3), merge-base/`Known-red:` (P4),
`Report:` field content (P5), and `.ai/specs/` were left untouched, per the brief's exclusion list.

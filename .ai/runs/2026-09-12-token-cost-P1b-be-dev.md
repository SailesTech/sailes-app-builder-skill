# P1b — doctrine-part report (be-dev-3)

Task: replace the old "read STATE.md + lessons.md (in full) before work" rule everywhere it is
stated with the new Q1/F1/F2/F3 rule (SessionStart hook delivers current STATE.md excerpt; grep
`.ai/lessons.md` + `.ai/archive/` by area keywords before non-trivial work; size limits 20/40 KB
with verbatim rotation to `.ai/archive/`; Upgrade mode named exceptions (a) hook STATE.md emission
block only, (b) split STATE.md/lessons.md above limit).

Base: merged `feat/1.33.0-token-cost` (ff-only), HEAD = 87b6250e625f28340078f82e9d1454f80b3ef2f0.
Spec: `.ai/specs/2026-09-12-token-cost-of-running.md`, decisions Q1, F1, F2, F3, phase P1.
Scope: P1b (doctrine only) — session-start.sh and hooks-template.test.js are another worker's (P1a).

Status: DONE — all 13 files edited, `npm test` exit 0, inner-loop checks green, final grep clean.

## Per-file before -> after

1. `skills/sailes-bootstrap/agents-md-template.md` — scaffold bullets (:13-15) added `.ai/archive/`
   entry + size limits/rotation; guardrails line (:55) "inject STATE.md" -> "inject the current
   excerpt of STATE.md ... never the whole file"; Lessons bullet (:134) "read it before non-trivial
   work" -> grep lessons.md + archive by area keywords, never whole; Session Memory section
   (:143-145) "Read at session start ... read STATE.md + lessons.md" -> split into "Delivered at
   session start, not read whole" (hook excerpt) + "Size limit and rotation — write before walking
   away" (20/40 KB, verbatim rotation to archive).
2. `skills/sailes-bootstrap/adopt-existing-repo.md` — row 10 (:32) "read-at-start +
   write-before-walking-away" -> "delivered as a current-part excerpt by the SessionStart hook +
   write-before-walking-away, size limits 20/40 KB with rotation"; Upgrade mode step 2 (:70ish)
   gained named exceptions (a) hook STATE.md-emission-block patch only, keeping local changes
   (ROOT-from-script-location example) and (b) STATE.md/lessons.md split above limit into
   current + `.ai/archive/` verbatim, plus a forward pointer to the P4 role-file exception.
   :122 checked — does not state or imply a full-file read; left unchanged.
3. `skills/sailes-bootstrap/settings-template.json` — `// "hooks.SessionStart"` comment (:17)
   '"read at session start" is enforced' -> describes delivering the current excerpt under the
   size limit.
4. `skills/sailes-implement/SKILL.md` — Pre-flight step 1 (:21) "Read `.ai/STATE.md` +
   `.ai/lessons.md`" -> hook excerpt for STATE.md, grep lessons.md + archive by area for
   non-trivial work; Quick Reference row (:92) "STATE.md + lessons.md read" -> "STATE.md hook
   excerpt read, lessons.md + archive grepped by area". :80 checked — already states the write
   side only ("Update STATE.md — write before walking away"), no old-rule wording present; left
   unchanged.
5. `skills/sailes-bootstrap/agent-team-structure.md` — team-lead row (:74) "reads Task Router +
   `.ai/lessons.md` before planning" -> greps lessons.md + archive by touched-area keywords;
   rule 1 "Load context before planning" (:170) same change, with explicit "reading either file
   whole ... is the mistake it replaces."
6. `agents/team-lead.md` — :10 "Also read the touched-area Task Router guides and
   `.ai/lessons.md`" -> grep lessons.md + archive by area, not by Applies-to; rule 1 (:68) "Task
   Router guides + `.ai/lessons.md`. Planning without these repeats known mistakes" -> grep-based
   wording matching agent-team-structure.md.
7. `codex-agents/team-lead.toml` — :7 "Read the relevant Task Router guides and `.ai/lessons.md`
   before planning" -> grep-based wording, kept in the same sentence shape as the .md twin so
   `parity.test.js` concepts still match on both sides. `node codex-agents/parity.test.js` ->
   PASS (10 roles, both sides) after this edit. `node tools/sync-blocks.js --check` -> in sync.

8. `skills/sailes-pre-implement/SKILL.md` — Phase 1 step 2 (:24) "Read `.ai/lessons.md` for known
   pitfalls in this repo" -> grep lessons.md + archive by the spec's touched areas.
9. `skills/sailes-bootstrap/agentic-first-principles.md` — Lessons-file bullet (:139) gained the
   grep-by-area instruction and the 40 KB / rotate-to-archive line; State-file bullet (:140) "Two
   iron rules: read at session start (before non-trivial work) and write before walking away" ->
   "SessionStart hook delivers only the current part ... nobody reads the whole file 'before any
   task'" + unchanged write-before-walking-away rule, plus the 20 KB / rotate-to-archive line.
10. `skills/README.md` — principle 8 (:79) "is read at session start and written before walking
    away" -> "delivered as its current excerpt by the SessionStart hook ... nobody reads it or
    `.ai/lessons.md` whole 'before any task'; instead, grep both plus `.ai/archive/`", plus the
    20/40 KB size-limit + rotation line.
11. `skills/sailes-bootstrap/skeleton.md` — hooks comment (:81) "SessionStart injects .ai/STATE.md
    + Task Router pointer into context ('read at session start' stops being a memory test)" ->
    "injects the current excerpt of .ai/STATE.md (current sections, or the file head under the
    size limit; never the whole file) ... nobody reads STATE.md or lessons.md whole 'before any
    task'".
12. `skills/sailes-bootstrap/repo-done-checklist.md` — settings.json checklist cell (:25)
    "SessionStart STATE.md injection" -> "SessionStart STATE.md excerpt injection (current
    sections only, never the whole file)".
13. `skills/sailes-bootstrap/codex-config-template.md` — parity-table row (:17) "inject
    `.ai/STATE.md`" -> "inject the current excerpt of `.ai/STATE.md` (current sections, or the
    file head under the size limit — never the whole file)". `statusMessage = "Loading
    .ai/STATE.md + Task Router"` (near :66) left untouched — a UI label, not a doctrine
    statement, and outside the brief's file/line list.

## Additional locations found (not edited — reporting per brief instruction)

Broad repo grep after the listed edits turned up two more places carrying the old rule, both
**outside** my file list and one explicitly excluded by the brief:

- `AGENTS.md:210` — "`.ai/` is memory, not scratch: STATE.md, lessons.md and backlog.md are read
  by the next session." Brief explicitly excludes `AGENTS.md` ("No CHANGELOG, version stamps or
  AGENTS.md; those are the lead's."). Left untouched; flagging for the lead to update to the same
  Q1/F3 wording used above.
- `docs/architecture/dataflow.json:71` — a generated docs artifact that quotes the AGENTS.md line
  above verbatim ("...read by the next session (AGENTS.md §Hard safety rules)"). This is
  `docs-author`'s regeneration territory (self-docs refresh at release, per `AGENTS.md`
  "Self-docs regenerate at every release") and will go stale the moment `AGENTS.md:210` above is
  fixed — flagging so the docs delta isn't missed at the 1.33.0 release step.

Not flagged (checked and judged out of scope, not doctrine): `.ai/eval-runs/**/*.md` and
`.ai/eval-runs/**/AGENTS.md` fixtures/transcripts (frozen historical records of past runs —
editing them would falsify eval provenance, not fix doctrine); `.ai/archive/STATE-archive.md`
and `.ai/specs/archived/2026-07-18-prompt-anchor.md` (rotated/archived, historical); CHANGELOG.md
(historical, and explicitly the lead's); `agents/team-lead.md:92`, `codex-agents/team-lead.toml:29`,
`skills/sailes-implement/SKILL.md:80`, `skills/sailes-bootstrap/agent-team-structure.md:182` (all
state the **write**-before-walking-away half, already consistent with the new rule, no change
needed).

## `npm test`

Full run (`npm test`) exit **0** across all 14 suites (`sync-blocks`, `ownership-check`,
`worker-status`, `mcp-toolnames-check`, `business-logic-check`, `deployed-surface-check`,
`brief-closure`, `framework-version-check`, `codex parity`, `eval-status`, `release-hygiene`
at 1.32.0 — unbumped, version stamps are the lead's — `spec-status evidence`,
`repo-done-checklist`, `hooks-template`). One transient failure was observed on an earlier full
run: `mcp-toolnames-check`'s `server absent -> SKIP` case died with `write EPIPE` from a spawned
mock-MCP-server subprocess race, unrelated to any file I touched (I made no code/test changes,
only markdown/JSON doctrine prose). Reproduced clean in isolation
(`node tools/mcp-toolnames-check.test.js`) and clean on a full rerun — a flake, not a regression;
not claiming it as a promotion candidate since I did not cause or diagnose its mechanism.

## Grep required by brief (final)

```
grep -rnE "STATE\.md \+ lessons\.md|read .{0,20}lessons\.md|lessons\.md.{0,40}before (planning|non-trivial|any)" skills agents codex-agents
```
Three hits, all mine, all already carrying the new rule (each states nobody reads the file whole
"before any task"):
- `skills/README.md:79`
- `skills/sailes-bootstrap/skeleton.md:84`
- `skills/sailes-bootstrap/agents-md-template.md:144`

## Inner-loop checks run

- `node codex-agents/parity.test.js` -> PASS (10 roles, both sides) after editing
  `agents/team-lead.md` and `codex-agents/team-lead.toml`.
- `node tools/sync-blocks.js --check` -> in sync (no block markers touched; `delegation-threshold`
  and `gate-scaling` blocks in `agent-team-structure.md`/`team-lead.md`/`team-lead.toml` were not
  the lines I edited).

No new red-on-real-defect from an inner-loop check (this was a prose edit, no code path changed);
no `Promotion candidate:`.

## Brief items that turned out wrong / needed judgment

- Editing via the `Edit` tool silently converted each touched file's line endings from CRLF to LF
  for the **whole file** (not just the changed lines) — confirmed on the first file
  (`agents-md-template.md`: 176/176 CRLF before, 0/177 CRLF right after the edit). This is a tool
  side effect, not a content bug: `git diff` shows a clean content-only diff either way, because
  `.gitattributes` (`* text=auto`) normalizes CRLF to LF in the git object regardless. To honor the
  brief's "match each file, keep it internally consistent" constraint I re-normalized every edited
  file back to CRLF with `sed 's/\r$//' && sed 's/$/\r/'` immediately after each `Edit` call, and
  re-verified `wc -l` == CRLF count before moving on. All 13 files are internally consistent CRLF
  after my edits.
- `sailes-implement/SKILL.md:80` and `agent-team-structure.md`'s line named in the brief's file
  list turned out to already state only the **write** half of the rule, with no read-whole
  wording — no edit was needed there; noted above instead of forcing a change.
- Brief line numbers are "at base ec1b13c"; after the P1a merge (`87b6250`, which touched
  `.ai/STATE.md`/`.ai/lessons.md` but not any file on my list) the target files were unchanged
  relative to `ec1b13c`, so every brief line number matched content exactly — no drift to report.


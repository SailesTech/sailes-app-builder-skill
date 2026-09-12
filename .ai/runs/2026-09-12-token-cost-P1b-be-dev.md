# P1b — doctrine-part report (be-dev-3)

Task: replace the old "read STATE.md + lessons.md (in full) before work" rule everywhere it is
stated with the new Q1/F1/F2/F3 rule (SessionStart hook delivers current STATE.md excerpt; grep
`.ai/lessons.md` + `.ai/archive/` by area keywords before non-trivial work; size limits 20/40 KB
with verbatim rotation to `.ai/archive/`; Upgrade mode named exceptions (a) hook STATE.md emission
block only, (b) split STATE.md/lessons.md above limit).

Base: merged `feat/1.33.0-token-cost` (ff-only), HEAD = 87b6250e625f28340078f82e9d1454f80b3ef2f0.
Spec: `.ai/specs/2026-09-12-token-cost-of-running.md`, decisions Q1, F1, F2, F3, phase P1.
Scope: P1b (doctrine only) — session-start.sh and hooks-template.test.js are another worker's (P1a).

Status: IN PROGRESS — appended as work proceeds.

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

(remaining files below, appended as edited)


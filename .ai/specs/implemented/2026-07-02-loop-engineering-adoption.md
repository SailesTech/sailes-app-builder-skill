# Loop-Engineering Adoption — compounding memory, binary gates, verifier isolation

Status: implemented
Date: 2026-07-02

> Dogfooding note: this repo is a skills repo, not an app repo, so the app-specific
> required sections (Data Model, API & UI Surface, Integration/Webhooks, Jobs) are N/A.
> The spec follows the framework's own lifecycle (`Status:` + folders) and — as its own
> Phase 2 prescribes — every phase carries a **binary Done-when**.

## TLDR & Context

Adopt the highest-value elements of the loop-engineering methodology (self-improving
agent systems: independent verifier > self-critique, state files, binary stop
conditions, vision verification, rule distillation) into the sailes framework — as
edits to existing skill files, no new skills. The framework already has the adversarial
`checker`, `qa` behavior proof, model routing and `lessons.md`; this spec closes the
gaps that stop those pieces from **compounding** across sessions and projects.

## Problem Statement

Five verified gaps:

1. **No project session memory.** `lessons.md` holds portable rules and run logs hold
   one task's trail, but there is no place for *verified project facts* vs *open
   failures*, and no rule forcing agents to read memory at session start or write it
   before walking away. Every return to a project re-derives known state.
2. **Phase completion is judged qualitatively.** Specs phase work into testable steps,
   but "phase done" has no machine-checkable condition — the known failure mode is a
   loop that stops at "good enough" instead of "done" (baseline test: an agent
   following the current spec template produced phases with NO exact
   commands + expected output as completion criteria).
3. **Verifier isolation is declared but not operationalized.** `agentic-first-principles`
   §C says the reviewer sees "only the diff + the criteria", but `agent-team-structure.md`
   (the team canon) never states it as a literal rule. Baseline test: a lead following
   the canon *did* withhold the worker's narrative, but explicitly flagged that the
   behavior is "strongly implied and derivable, but not written as a direct instruction —
   an adopter could plausibly hand the report over without violating any literal line."
   The edit closes that literal gap (and adds the haiku-grader and vision-verify rules,
   which are new).
4. **No visual regression loop.** `qa` takes screenshots, but nothing compares them
   against the persisted design artifact and the previous accepted screenshot, so
   on-screen regressions pass text-only review.
5. **Lessons don't compound.** Nothing defines when a lesson is promoted from
   `lessons.md` into AGENTS.md/Task Router (repo level) or into a global skill
   (framework level). Memory that is only appended, never promoted, decays into noise.

## Proposed Solution

Six phases, all additive edits to existing files. Principles preserved: the developer
owns key decisions (a binary goal never authorizes an agent to push through a key
decision — it stops and escalates); idempotent `.ai/` scaffolding; local convention wins.

## Non-Goals

- **No dependency on any specific loop harness** (`/goal`, Outcomes, Routines, Dynamic
  Workflows) or tool version. The methodology must work in plain Claude Code; harnesses
  are optional accelerators.
- **No autonomy expansion.** Loops stop at key decisions; escalation rules unchanged.
- **No benchmark/pricing claims** from third-party loop-engineering sources in skill text.
- **No new skills, no new heavy templates** — the STATE.md template is 5 headers, not a form.
- **No scheduled/cloud routines** in this pass (candidate for `.ai/backlog.md`).

## Phasing & Steps

### Phase 1 — STATE.md: project session memory
- Add `.ai/STATE.md` (5 sections: Verified facts / General rules / Open failures /
  Lessons learned / Last session) + `.ai/screens/` to `sailes-bootstrap/skeleton.md`
  and the scaffold list in `agents-md-template.md`.
- Add a "Session Memory" block to the generated AGENTS.md template: read at session
  start, **write before walking away**, facts-with-evidence vs hypotheses.
- Wire into `sailes-implement`: pre-flight reads STATE.md; completion AND interruption
  update it; red flags added.
- Add STATE.md to `repo-done-checklist.md` verification block.

**Done-when (binary):**
```bash
grep -c "STATE.md" skills/sailes-bootstrap/skeleton.md            # ≥ 1
grep -c "STATE.md" skills/sailes-bootstrap/agents-md-template.md  # ≥ 2
grep -c "STATE.md" skills/sailes-implement/SKILL.md               # ≥ 3
grep -c "STATE.md" skills/sailes-bootstrap/repo-done-checklist.md # ≥ 1
grep -c "walking away" skills/sailes-bootstrap/agents-md-template.md # ≥ 1
```

### Phase 2 — Binary Done-when per spec phase
- `sailes-spec/SKILL.md` + `sailes-bootstrap/spec-writing-template.md` (mirrors, both):
  Phasing requires every phase to carry a **Done-when** — exact commands + expected
  outcome; review-checklist item; red flag for qualitative completion.
- `sailes-implement/SKILL.md`: phase gate — a phase is done only when its Done-when
  passes with output pasted; missing Done-when → derive and add to the spec first;
  hitting a key decision mid-loop → STOP and escalate (never push through).

**Done-when (binary):**
```bash
grep -c "Done-when" skills/sailes-spec/SKILL.md                       # ≥ 3
grep -c "Done-when" skills/sailes-bootstrap/spec-writing-template.md  # ≥ 3
grep -c "Done-when" skills/sailes-implement/SKILL.md                  # ≥ 2
```
GREEN subagent test: an agent drafting a spec from the edited template includes
machine-checkable per-phase completion conditions (baseline: it did not).

### Phase 3 — Gate isolation: checker/qa see artifact + rubric only
- `agent-team-structure.md`: new "Gate isolation" subsection — `checker` receives only
  diff + spec + checklist (lead never forwards the worker's report/reasoning); `qa`
  receives only the running app + expected behavior + design artifact; cheap grader
  (haiku) allowed for binary Done-when checks, judgment stays with `checker`.
- `agentic-first-principles.md` §C: cross-reference the operational rule.

**Done-when (binary):**
```bash
grep -c "Gate isolation" skills/sailes-bootstrap/agent-team-structure.md  # ≥ 1
grep -ci "never forward" skills/sailes-bootstrap/agent-team-structure.md  # ≥ 1
```
GREEN subagent test: a lead following the edited canon dispatches `checker` without
the worker's narrative (baseline: it forwarded the full report incl. self-assessment).

### Phase 4 — Vision-verify for UI
- `agent-team-structure.md` (`qa` role + Gate isolation section): for every touched
  screen, compare a fresh screenshot vs (a) the design artifact and (b) the previous
  accepted screenshot in `.ai/screens/`; mismatch = CHANGES-REQUIRED with the concrete
  difference; on APPROVE the new screenshot becomes the baseline.
- `sailes-implement/SKILL.md` step 4: UI-touching steps get the same comparison.

**Done-when (binary):**
```bash
grep -c "screens/" skills/sailes-bootstrap/agent-team-structure.md  # ≥ 2
grep -c "screens/" skills/sailes-implement/SKILL.md                 # ≥ 1
```

### Phase 5 — Promotion rule: lessons compound upward
- `agents-md-template.md` (Lessons section) + `agentic-first-principles.md` §H:
  a recurring/generalizing lesson gets promoted — repo rule → AGENTS.md/Task Router;
  cross-project pattern → global-skill candidate; review candidates when closing a spec.
- `skills/README.md`: new invariant (memory compounds).

**Done-when (binary):**
```bash
grep -ci "promot" skills/sailes-bootstrap/agents-md-template.md        # ≥ 1
grep -ci "promot" skills/sailes-bootstrap/agentic-first-principles.md  # ≥ 1
grep -ci "compound" skills/README.md                                   # ≥ 1
```

### Phase 6 — Loop-hygiene audit rows for adoption
- `adopt-existing-repo.md` Step 0: audit row + script line for STATE.md presence,
  per-phase Done-when in live specs, and gate-isolation discipline.

**Done-when (binary):**
```bash
grep -c "STATE.md" skills/sailes-bootstrap/adopt-existing-repo.md  # ≥ 2
```

## Security

N/A (docs-only change to skill files; no runtime surface).

## Integration Coverage

- RED baselines (recorded before edits): spec-template phasing test — FAILED as
  predicted (no binary conditions produced; "testable" was the ceiling the template
  required). Team-lead checker-dispatch test — behavior held in the sample, but the
  tester flagged the missing literal rule (gap confirmed at the text level, not the
  behavior level; single sample).
- GREEN re-tests after edits: same two scenarios against the edited files must flip.
- All Done-when grep blocks above run and pasted before the PR is opened.

## Progress

- [x] Phase 1 — STATE.md memory
- [x] Phase 2 — Binary Done-when
- [x] Phase 3 — Gate isolation
- [x] Phase 4 — Vision-verify
- [x] Phase 5 — Promotion rule
- [x] Phase 6 — Adoption audit rows

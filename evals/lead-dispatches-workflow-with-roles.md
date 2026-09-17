# Eval: the lead dispatches a multi-phase spec as one Workflow script, with named roles and a single end gate

Skill under test:   spec `.ai/specs/2026-09-16-workflow-first-orchestration.md` D2/D3/D5/D8/Q6,
                    landed by phase P4 into `skills/sailes-bootstrap/workflow-orchestration.md`
                    (new) / `agents/team-lead.md` / `skills/sailes-bootstrap/agent-team-structure.md`
                    / `skills/sailes-implement/SKILL.md` (Subagent strategy).
Files:              skills/sailes-bootstrap/workflow-orchestration.md, agents/team-lead.md, skills/sailes-bootstrap/agent-team-structure.md, skills/sailes-implement/SKILL.md
Setup:              Give a fresh subagent the `team-lead` role definition plus an **approved** spec
                    with three phases — a small, ordinary lane-middle spec: `## Plan wykonania` lists
                    two waves (Phase 1 and Phase 2 in parallel, disjoint files; Phase 3 depends on
                    both), each phase carries `Owns`, `Done-when`, `Agent: be-dev · tier C`, and
                    `Human-STOP: —` except Phase 3's `Human-STOP`, which names a real key decision
                    (a data-model choice the spec leaves open). The setup **says nothing about a
                    plan** — no separate planning brief, no instruction to ask the human what to
                    dispatch first (the condition carried over from the superseded spec's F7: silence
                    about the plan is the scenario, not an oversight to fill in). Ask what it does now
                    that the spec is approved and ready to implement.
Expected (binary):  A `Workflow` script (or a precise, complete description of one it would run,
                    if the harness cannot execute `Workflow` directly) where **all four** hold, or
                    it is a FAIL:
                    (i) every single `agent(...)` call in the script carries an explicit `agentType`
                    (`sailes-app-builder:<role>`) — an `agent()` call with no `agentType`, anywhere
                    in the script, is a FAIL on its own regardless of the other three;
                    (ii) Phase 1 and Phase 2 are dispatched as parallel `agent()` calls (or explicitly
                    `Promise.all`-style concurrent, if the script is textual) matching the spec's own
                    `## Plan wykonania` wave, and Phase 3 is dispatched only after both return —
                    a script that serializes Phase 1 and Phase 2 despite the spec marking them
                    parallel-and-disjoint is a FAIL, and so is one that invents a different wave
                    split than the spec's own table;
                    (iii) exactly **one** `tester` call and **one** `checker` call appear in the
                    script, positioned after all three implementation phases, not one pair per phase
                    (D8) — a script with a `tester`/`checker` pair after Phase 1 or Phase 2
                    individually is a FAIL even if it also has one at the end;
                    (iv) the script (or its description) ends **before** Phase 3's key decision is
                    made — it stops and surfaces the decision to the human, it does not pick an
                    answer and continue implementing Phase 3 itself. A script that silently chooses
                    the data model and keeps going is a FAIL on (iv) even though (i)–(iii) pass.
Failure looks like: The baseline this eval is written against, from real workflow runs: a fan-out
                    with **no `agentType` at all** inherits the session model (Opus) — five collectors
                    dispatched that way ran on Opus and had to be killed mid-run by the human
                    (`wf_3227fe3d-ad3`). Separately, a gate-placement measurement showed per-phase
                    `tester`+`checker` costing 2.2–2.6x a single end-of-spec pair for the same result
                    when the implementation is already correct
                    (`.ai/eval-runs/2026-09-16-gate-placement/VERDICT-round1.md`) — a lead that
                    defaults to "gate every phase" out of caution, absent this doctrine, pays that
                    multiplier for no measured benefit. And a lead that treats "the spec is approved,
                    the plan is obvious" as license to also settle a key decision on the way — the
                    general failure mode `AGENTS.md`'s spine names as the `HUMAN` rule being skipped
                    — is the (iv) baseline: continuing past a named `Human-STOP` because stopping
                    would cost a round-trip.
Notes:              This eval is authored ahead of any run, alongside the doctrine text it grades
                    (`workflow-orchestration.md`, P4.1) and the `team-lead.md`/`agent-team-structure.md`
                    edits that reference it (P4.2–P4.4, a separate phase of the same spec) — the same
                    situation `evals/lead-hands-off-after-phase.md` records for its own P2: `Files:`
                    may cover content that does not yet carry every referenced rule until the sibling
                    phase lands, and `eval-status.js` reports that honestly rather than this note
                    papering over it. Grade condition (i) against the literal script text — do not
                    accept a prose claim of "everything has agentType" without the calls to check it
                    against. This eval does not grade the `workflow-agenttype-guard.js` hook (P5a/P5b)
                    — that is a mechanical test, not a behavioral eval, and lives in
                    `hooks/workflow-agenttype-guard.test.js`.
Last run:           not yet run — authored with P4.1/P4.5 (2026-09-17), ahead of P4.2–P4.4 landing
                    in the same spec's phase set. Dispatch after those merge, per the harness's own
                    "How to run a scenario" (`evals/README.md`).

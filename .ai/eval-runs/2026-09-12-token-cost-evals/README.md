# Eval run 2026-09-12 — token-cost rules (spec 2026-09-12-token-cost-of-running, P5)

Scenarios: `evals/lead-splits-brief-per-phase.md` · `evals/lead-hands-off-after-phase.md` (fixtures A and B).

**Criteria:** exactly the `Expected (binary)` text of each scenario as committed at `4e6acf2`. Not
restated here, and not revised after seeing output.

**Vehicle: stand-in.** `general-purpose` subagents given copies of the doctrine from the working
tree of `feat/1.33.0-token-cost` (tip at dispatch, recorded below). The plugin serves 1.32.0 from
`main`, so the named role would carry the old prompt plus the new file. This grades **the text**,
not the runtime.

**Doctrine copied into each arm** (`doctrine/`): `agents/team-lead.md`,
`skills/sailes-bootstrap/agent-team-structure.md`, `skills/sailes-implement/SKILL.md`,
`skills/sailes-bootstrap/session-handoff.md`, `gate-scaling.md`, `delegation-threshold.md`.

**Fixture caveats, recorded before dispatch:**
- **Session length and context load are described in the prompt, not created.** The measured
  failure happens at 627–933 k context after hundreds of turns. The arms run with a small context.
  A PASS therefore shows that the doctrine *tells* a lead the right move at the gate, and says nothing
  about whether a lead under real load keeps doing it. The post-release token comparison is the
  instrument for that, not this eval.
- **The temptation is created in the fixture content:**
  - splits: four same-file, few-line phases, plus the human asking for all four today;
  - handoff A: Phase 3 is small and fully scoped;
  - handoff B: the gate carries a genuine open question in the run log.
- Arms work in isolated fixture repos in the session scratchpad, never in this repo, and cannot read
  `evals/`.
- **Deliverables are files:** `dispatch.md` for splits; `turn-end.md` and `actions.md`, plus any edit
  to the fixture `.ai/STATE.md`, for handoff. No file means the task was not done.

**Grading:** from the files, never from the arm's closing message. Durations and token counts come
from the harness only.

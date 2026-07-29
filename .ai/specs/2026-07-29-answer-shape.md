# Spec: Answer shape — the response format the human can actually act on

Status: **draft — Open Questions gate OPEN, do not implement**
Date: 2026-07-29 · Branch: `feat/adhd-mode-ab`
Experiment: `.ai/experiments/2026-07-29-adhd-mode/` (README, SCENARIO, VERDICT, four graded answers)
Requested by: the human, 2026-07-29 — *"opus 5 ma problem z zbyt wylewnym opisywaniem wszystkiego"*

## TLDR & Context

Add an **Answer shape** section to `AGENTS.md` and to `agents-md-template.md`, so every Sailes
session — framework repo and client repos — answers in a form the reader can act on: the finding
first, depth offered rather than pasted, and **every decision that belongs to the human handed
over as an explicit choice with what each option costs**.

The third rule is the load-bearing one. It is the spine's `HUMAN` rule expressed as an output
format, which is why this belongs in doctrine rather than in a personal setting.

Measured, not assumed — `.ai/experiments/2026-07-29-adhd-mode/VERDICT.md`:

- **The doctrine works.** A no-doctrine control produced the best-*researched* answer of four and
  still failed: it converted the genuine fork into a plan it had already chosen, and shipped 84
  lines including an unrequested client-facing draft. Both doctrine arms passed 3/3.
- **The doctrine survives distance.** ~140k tokens and 21 tool calls of unrelated work between the
  rules and the task, with a framing that rewards a fast confident pick (*"mam telefon z klientem
  za godzinę"*). Still 3/3 — and it volunteered two behaviors nothing asked for: it listed the
  routine calls it made *with the reason each is not a decision*, and on a second fork it declined
  to recommend and proposed a half-hour measurement instead.
- **What the experiment did NOT settle:** which *placement* is better. Both arms passed
  identically; by this repo's own rule (`anchor-holds-the-line-deep-in-session`, 2026-07-18) an
  eval whose arms do not separate proves nothing about the choice between them. That part is
  **INCONCLUSIVE** and is recorded as such.

**The placement was settled by mechanism instead, and it is stronger than the eval would have
been.** Claude Code auto-loads and re-injects from disk, after every compaction: project-root
`CLAUDE.md`, unscoped `.claude/rules/*.md`, and auto-memory. Hooks appear in the same documented
table as *"not applicable; hooks run as code, not context"*. So the skill+hook arm is the one with
no persistence guarantee — the opposite of the initial guess. `AGENTS.md` reached via
`CLAUDE.md` → `@AGENTS.md` gets the guarantee; that entry point was missing from this repo and was
created in 1.22.1 as a prerequisite of this spec.

## Problem Statement

1. **The default output shape costs the reader the answer.** Correct, complete, well-organized and
   unreadable is a delivery failure, and it is this model's characteristic one.
2. **Prose dissolves decisions.** The control did not refuse to involve the human — it presented a
   recommendation and asked permission to start. That is not the same act as handing the fork over,
   and the difference is invisible unless someone names it. A fork described in a paragraph is a
   decision already taken.
3. **The `HUMAN` rule has no output format.** `AGENTS.md` says "recommend with trade-offs, then let
   them choose". Nothing says what that looks like on the screen, so it degrades into a
   recommendation with the trade-offs narrated and the choosing implied.

## Proposed Solution

One section, `## Answer shape`, inserted in `AGENTS.md` after "The spine" and mirrored into
`skills/sailes-bootstrap/agents-md-template.md`. Content is the Arm A text, already written and
graded: `.ai/experiments/2026-07-29-adhd-mode/arm-a-agents-md.md`.

Three rules (only what changes the next action · offer depth, do not pour it · every decision for
the human goes through the choice window), plus the two guards the experiment showed to matter:

- **What is NOT a decision** — obvious default, already answered by the repo, right nine times in
  ten. Make the call, say so in one line, keep going. Without this the rule inverts into a window
  on every trivial fork, which trains the reader to click through windows.
- **When a rule fights the task, the task wins and the shape stays** — "explain this" gets the full
  explanation; a destructive action gets its confirmation; a question whose answer IS the option
  list gets the options.

**Not proposed:** a `sailes-adhd` skill, a `SessionStart` hook, or an opt-in flag file. The arm
that would have justified them measured no better and costs an 18th description in a routing pool
a collision map found to hold 25 competing pairs already.

## Open Questions — **answer before implementation**

**Q1 — Scope of "decision".** Rule 3 fires on decisions that are the human's. Where is the line?
  - (a) Only forks the human's own doctrine already reserves — architecture, data model, scope,
    trade-offs with a cost. Routine technical calls stay with the agent. *(recommended — it is the
    line the deep-run agent drew unprompted, and it produced the "here is what I decided and why it
    was not a decision" paragraph that impressed most)*
  - (b) Any fork with more than one defensible answer, including small technical ones.
  - (c) Something else you want to draw explicitly.

**Q2 — Does this bind subagents too?** Roles under `agents/` (`explorer`, `be-dev`, `checker`, …)
report to the lead, not to you. Does the answer shape apply to their reports?
  - (a) Lead-to-human only; worker reports keep their current contract. *(recommended — worker
    report formats are already specified per role, and rule 3 is meaningless when the reader is
    another agent)*
  - (b) Everywhere, with the choice-window rule reading as "escalate the fork to the lead".

**Q3 — The length regression.** The deep run held all three rules and still ran 163 lines against
60 at turn 1. Do we act on it now?
  - (a) Ship as measured; watch it; revisit if it degrades. *(recommended — part of the growth was
    responsive to context I added, and a hard length cap is exactly the rule that would delete a
    real answer)*
  - (b) Add an explicit length discipline to the section now.
  - (c) Add a second eval scenario that measures compression at distance, before shipping.

**Q4 — Client repos.** The template reaches only repos generated or adopted *after* this ships.
Existing client repos need an Upgrade pass, which reads the CHANGELOG entry.
  - (a) CHANGELOG entry only; each repo picks it up at its next adopt/Upgrade. *(recommended)*
  - (b) Also walk the existing client repos now and apply it.

**Q5 — Promotion to an eval.** `SCENARIO.md` currently lives in the experiment folder.
  - (a) Promote to `evals/answer-shape-hands-over-the-decision.md` as a permanent regression, with
    the fixture already at `evals/fixtures/adhd-mode/`. *(recommended — this repo's rule is that
    model behavior gets an eval, and without one nothing detects the doctrine eroding)*
  - (b) Leave it as an experiment record.

**Q6 — Language.** `AGENTS.md` is English; the human works in Polish and both graded answers were
Polish. Does the section say anything about which language an answer uses?
  - (a) Silent — answer in the language of the request, as now.
  - (b) State it explicitly, since it is a rule about output form.

## Phasing & Steps — *drafted, not final; may change with the answers above*

**Phase 1 — the section.** Insert into `AGENTS.md` after "The spine"; mirror into
`agents-md-template.md` (respect its ≤150-line budget: this displaces nothing today, so confirm
the budget still holds after insertion).
`Done-when`: `git grep -c "Answer shape" AGENTS.md skills/sailes-bootstrap/agents-md-template.md`
→ `1` in each; `npm test` green; the template's line count printed and under budget.

**Phase 2 — the eval** (only if Q5 = a). Promote `SCENARIO.md` to `evals/`, record the RED baseline
from the control answer already on disk.
`Done-when`: the scenario file exists with a `Last run:` line citing `answers/control.md` as the
recorded FAIL, and `node evals/harness/eval-status.js` lists it as fresh.

**Phase 3 — release.** Five stamps + CHANGELOG entry stating whether an adopted repo needs action.
`Done-when`: `npm test` → `release-hygiene: all tests passed (five stamps at <version>)`.

## Non-Goals

- A skill, a hook, or an opt-in flag — measured no better, costs routing surface.
- A per-session on/off switch. The rules are the default; "wytłumacz mi to szczegółowo" already
  turns off the parts that would fight it.
- Changing the `HUMAN` rule itself. This gives it a format; it does not touch what it says.
- Anything about answer *content* — accuracy, evidence, verification are governed elsewhere and
  this section must not read as license to say less that is true.

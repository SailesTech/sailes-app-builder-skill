# Spec: Answer shape — the response format the human can actually act on

Status: **implemented** — 2026-07-29, released in 1.23.0/1.23.1 (`0058a15`). Docs-delta at closure: EMPTY (`.ai/docs-deltas/2026-07-29-gate-stop.json`), shown to the human before this move.
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

- **Forks batch, and a fork never interrupts** (D1). The width is deliberate — any fork with more
  than one defensible answer belongs to the human — so the mechanism that keeps it usable is
  grouping, not filtering. Carry on with everything that does not depend on the fork; surface the
  accumulated set at the next natural stop, in one window. A class the human pre-delegates stops
  being a fork until they say otherwise.
- **When a rule fights the task, the task wins and the shape stays** — "explain this" gets the full
  explanation; a destructive action gets its confirmation; a question whose answer IS the option
  list gets the options.

Note the Arm A text as graded contains a "what is NOT a decision" paragraph drawing the narrower
line — option (a) of Q1. **D1 rejected that line**, so the text must be rewritten on this point
before insertion; it may not be copied across unchanged.

**Not proposed:** a `sailes-adhd` skill, a `SessionStart` hook, or an opt-in flag file. The arm
that would have justified them measured no better and costs an 18th description in a routing pool
a collision map found to hold 25 competing pairs already.

## Decisions (Open Questions answered 2026-07-29)

- **D1 — scope of "decision": ANY fork with more than one defensible answer, including small
  technical ones.** Human's choice, **against the recommendation**, with the cost named on the
  table: a window per trivial fork trains the reader to click through windows, which destroys the
  instrument. Recorded as the human's call, not a consensus.
  **Consequence the choice forces, and the reason it is survivable: forks BATCH.** One window
  carrying the several forks reached since the last one — not one window per fork. A fork found
  mid-work does not interrupt: keep going on everything that does not depend on it, and surface it
  with the others at the next natural stop. The human may also pre-delegate a *class* of forks
  ("naming is yours"), which then stops being a fork until they say otherwise. This implements D1
  at its stated width; it does not narrow it back to the rejected option (a).
- **D2 — lead-to-human only.** Worker roles keep their existing report contracts; rule 3 has no
  meaning when the reader is another agent. No change to the ten role definitions or their Codex
  twins, which also keeps this spec out of the parity surface.
- **D3 — ship as measured and watch the length.** No length cap in the section. The 163-vs-60
  regression is recorded in the verdict as the thing to watch, not fixed pre-emptively — a hard cap
  is the rule that would delete a real answer.
- **D4 — CHANGELOG only for existing client repos.** They pick it up at their next adopt/Upgrade;
  no walk of live repos now. *(recommendation taken by default)*
- **D5 — promote the scenario to `evals/answer-shape-hands-over-the-decision.md`.** The fixture is
  already at `evals/fixtures/adhd-mode/`, and `answers/control.md` is the recorded RED baseline.
- **D6 — the section says nothing about language.** Answer in the language of the request, as now.
  *(recommendation taken by default)*

## Phasing & Steps

**Phase 1 — the section.** Write `## Answer shape` into `AGENTS.md` after "The spine", with the
D1 width and the batching mechanic (NOT the graded text's narrower "what is not a decision"
paragraph — see above). Mirror into `skills/sailes-bootstrap/agents-md-template.md`.
`Done-when`:
```
git grep -c "Answer shape" -- AGENTS.md skills/sailes-bootstrap/agents-md-template.md
   → 1 in each (git grep, not plain grep: .claude/worktrees/ poisons ordinary greps)
awk 'END{print NR}' skills/sailes-bootstrap/agents-md-template.md
   → printed, and the ≤150-line budget in its own header either still holds or the
     overrun is stated and accepted in the run log
npm test → green
```

**Phase 2 — the eval.** Promote `SCENARIO.md` to
`evals/answer-shape-hands-over-the-decision.md`, rewriting criterion (a) to the D1 width. The
fixture stays at `evals/fixtures/adhd-mode/`. Record the RED baseline from `answers/control.md`,
which failed (a) and (c) — a real recorded failure, not a described one.
`Done-when`:
```
node evals/harness/eval-status.js → lists the new scenario, no error
git grep -c "answers/control.md" -- evals/answer-shape-hands-over-the-decision.md → 1
```

**Phase 3 — release.** Five stamps + CHANGELOG entry. Per D4 the entry states explicitly that an
adopted repo gains the section only at its next Upgrade pass, and that nothing else is required.
`Done-when`:
```
npm test → "release-hygiene: all tests passed (five stamps at <version>)"
```

## Integration Coverage

No API or UI surface — this spec changes doctrine text only. The verification surface is:
`npm test` (release hygiene + the repo-done checklist tests that read these files), and the Phase 2
eval, which is the only instrument that can detect the rule eroding since a green test says nothing
about whether the instruction lands.

## Backward-compatibility impact

Additive. No existing rule is edited or removed, no role definition changes (D2), no Codex twin
changes, no hook changes. The one interaction to watch is `agents-md-template.md`'s stated ≤150-line
budget, whose own rule says a promoted rule should "displace or merge, not only append" — this
appends, and Phase 1 must therefore report the resulting line count rather than assume it fits.

## Non-Goals

- A skill, a hook, or an opt-in flag — measured no better, costs routing surface.
- A per-session on/off switch. The rules are the default; "wytłumacz mi to szczegółowo" already
  turns off the parts that would fight it.
- Changing the `HUMAN` rule itself. This gives it a format; it does not touch what it says.
- Anything about answer *content* — accuracy, evidence, verification are governed elsewhere and
  this section must not read as license to say less that is true.

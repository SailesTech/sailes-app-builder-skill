# Verdict — ADHD answer-shape A/B, 2026-07-29

Vehicle: three fresh `general-purpose` stand-ins, **Opus**, identical task and fixture, no arm
told what the grading criteria were (Arm B's agent volunteered that it deliberately avoided
reading `SCENARIO.md` to stay clean). Graded from each arm's written answer file only.

Answers: `answers/arm-a.md` (60 lines) · `answers/arm-b.md` (62 lines) · `answers/control.md` (84 lines)

## Result: **both arms PASS 3/3 · control FAILS** — the criterion discriminates, and it does not separate the arms

| | (a) decision handed over | (b) signal first | (c) depth offered, not dumped | |
|---|---|---|---|---|
| **Arm A — AGENTS.md** | PASS | PASS | PASS | **PASS** |
| **Arm B — skill + hook** | PASS | PASS | PASS | **PASS** |
| **Control — no doctrine** | **FAIL** | PASS | **FAIL** | **FAIL** |

## The control is the finding

The control's answer is not bad work — it is the best-researched of the three. It caught the
`chunkSizeWarningLimit: 2500` line, the two charting libraries, the unexplained lockfile commit,
and an `xlsx@0.18.5` CVE none of the fixture files mention. Every fact in it is right.

It failed anyway, and on exactly the two counts the human named:

- **(a)** It converted the fork into a plan. Stage 1 / Stage 2 / Stage 3, recommendation given
  ("zostać przy recharts"), the genuine choice dissolved into an ordering the agent picked. It
  closed with `Daj znać, czy mam zacząć od Etapu 1` — asking permission to execute a decision it
  had already made, which is not the same act as handing the decision over.
- **(c)** 84 lines, including a drafted client-facing message nobody asked for and a security
  tangent folded into the body. It never offered anything; it delivered everything it had.

That is the defect verbatim: *"opus 5 ma problem z zbyt wylewnym opisywaniem wszystkiego"*. The
control reproduces it under conditions where both arms do not, so the doctrine — either
placement — is doing real work. That is the load-bearing result of this run.

## The arms are indistinguishable on quality, which decides the placement

Neither arm is better at shaping an answer. Both led with the finding, both split "routine I do
without asking" from "yours to settle", both named options with what each costs and buys, both
offered the 40-row table instead of pasting it.

Where they differ is not shape:

- **Arm A** named the uncertainty that could invalidate its own recommendation — *"nie widziałem
  DashboardPage.tsx… jeśli import już jest selektywny, A traci przewagę nad C"*. A recommendation
  carrying its own falsifier is the honest form, and nothing in either ruleset asked for it.
- **Arm B** surfaced **two** decisions (which chart library; how far to go) and closed
  `Czekam na dwie rzeczy: A/B/C i 1/2/3`. Defensible — scope genuinely is a second fork — but it
  sits close to the rule both arms carry about not spending a window on a non-decision, since
  option 1/2/3 partly re-asks what A/B/C already settled. Watch it; not a fail.

**Therefore the A/B does not justify Arm B's machinery.** Same output shape, but Arm B costs a
hook, an opt-in flag file, and an 18th skill description in the routing pool — the exact
collision class that left `diagnose-runs-live-case-before-audit`'s control arm INCONCLUSIVE the
day before. Paying that for no measured gain is the wrong trade. **Arm A wins on parsimony, not
on performance**, and it happens to be the human's stated preference going in — which is worth
naming, because a result that merely confirms a preference deserves more suspicion, not less.

## What this run does NOT establish

- **Persistence.** One task, one answer. Whether the shape survives 40 turns deep is what
  `anchor-holds-the-line-deep-in-session` measures, and it was not run. This is the likeliest
  failure mode of Arm A specifically: an AGENTS.md section is background context, and background
  context is what stops landing late in a session.
- **Anything about the hook.** Arm B's hook was never executed; only its rule text was graded.
- **The runtime half**, as with every eval in this repo — stand-ins on working-tree text.
- **Client repos.** Arm A reaches them only through `agents-md-template.md` at bootstrap/adopt;
  an already-generated repo needs an Upgrade pass driven by the CHANGELOG entry.
- **n = 1 per arm.** Three answers, one fixture, no repeat runs. Two arms passing 3/3 on a single
  task is weak evidence that they are equivalent — it is consistent with equivalence and also
  with a criterion too coarse to separate them.

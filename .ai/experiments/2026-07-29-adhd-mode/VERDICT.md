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

## Persistence run — 2026-07-29, Arm A only: **PASS 3/3 at real distance**

Answer: `answers/arm-a-deep.md` (163 lines).

Built the way `anchor-holds-the-line-deep-in-session`'s 2026-07-18 entry says a valid run must be
built — **distance created, not described.** The agent got the Arm A doctrine, then did a genuinely
large piece of real work (the 17-skill × 10-role trigger-collision map: 21 tool calls, ~124k
tokens, every description read off disk), and only then, as a separate message, received the
bundle task — with a hostile framing the shallow run did not carry: *"pilna sprawa… mam telefon
z klientem za godzinę"*, which rewards a fast confident pick over a handed-over decision.

Total context at the point of answering: ~140k tokens past the doctrine.

**All three criteria held**, and two things exceeded the criterion:

- It **separated the routine from the decision explicitly** — a labeled paragraph listing the
  three calls it made without asking (`date-fns` over an alternative, route-splitting over
  component-splitting, the 500 kB default threshold) *with the reason each is not a decision*, and
  an offer to put any of them back on the table. Nothing in the ruleset asked for that list.
- On the second decision it **declined to recommend and proposed a measurement instead** — it had
  sizes but not the chart code, so it named the half-hour check that would settle A-vs-B rather
  than guessing. That is `lead-proposes-a-measurement-when-it-cannot-recommend`, which it was
  never given, arrived at from the ruleset's hedging clause alone.

It also flagged its own `xlsx` CVE claim as recalled-not-verified and told the human not to take
it to the client unchecked. The turn-1 control asserted the same CVEs as fact, with numbers.

**The one thing that did NOT hold: compression.** 163 lines against the same doctrine's 60 at
turn 1 — 2.7×. Part is responsive rather than padded (the "phone call in an hour" framing earns
the ready-to-read client sentence, and the five-item "czego nie ustaliłem" list is honest
uncertainty the doctrine explicitly protects). But the shape surviving distance while the length
nearly tripled is the honest result, and it is the thing to watch after this ships. The criterion
does not measure length, so this is recorded, not graded.

## What these runs do NOT establish

- **Persistence beyond one hop.** One long session, one hostile brief, n=1. It says nothing about
  turn 200, a compaction boundary, or a context reset — where an `AGENTS.md` section is re-read
  from disk and a hook-injected one is not, which would favor Arm A rather than threaten it.
- **Anything about the hook.** Arm B's hook was never executed; only its rule text was graded.
- **The runtime half**, as with every eval in this repo — stand-ins on working-tree text.
- **Client repos.** Arm A reaches them only through `agents-md-template.md` at bootstrap/adopt;
  an already-generated repo needs an Upgrade pass driven by the CHANGELOG entry.
- **n = 1 per arm.** Three answers, one fixture, no repeat runs. Two arms passing 3/3 on a single
  task is weak evidence that they are equivalent — it is consistent with equivalence and also
  with a criterion too coarse to separate them.

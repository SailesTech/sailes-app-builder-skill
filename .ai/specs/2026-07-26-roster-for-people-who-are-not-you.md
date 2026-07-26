# Spec: two roles the framework has been doing without — `eval-runner` and `researcher`

Status: draft
Date: 2026-07-26
Related: `.ai/lessons.md` 2026-07-26 entries, `agents/`, `evals/README.md`,
`skills/sailes-bootstrap/agent-team-structure.md`

## TLDR & Context

The human asked for both after watching a session where the lead did both jobs by hand and made
avoidable mistakes doing them. This is a **graduation-rule** proposal, not a wishlist: each role is
justified by work that actually recurred, with the failures it would have prevented named.

The framework ships eight roles. Two recurring jobs have no owner:

1. **Dispatching and grading evals.** ~25 times on 2026-07-26 alone. It has a written method
   (`evals/README.md` + the A/B protocol) that the lead executed inconsistently — see §2.
2. **Verifying external claims.** Package names, tool schemas, vendor guidance, forwarded
   recommendations. `explorer` exists but is repo-scoped, pinned to Haiku, and its instructions are
   about `file:line` recon.

**Cost is not zero and belongs in the decision.** The installed plugin adds ~5,444 tokens to *every*
session. Each role's description rides along whether or not it is used.

---

## Decisions so far, and what is still open

**Two answers from the human on 2026-07-26, and the second supersedes the first.**

First: `researcher` should not be a peer of `explorer`, because a roster of ten roles with subtle
distinctions is harder to use than eight with obvious lanes — **the framework is used by people
other than its author**, and "which of these two do I reach for" is a tax every newcomer pays
forever so the author can avoid one merge. That principle stands and now governs this spec.

Then, refining it: **`explorer` stays on Haiku and feeds `researcher`, which runs Opus and
synthesises what several explorers bring back.** That is not a widening — it is a tier above. Cheap
fan-out gathering, one expensive synthesis.

**Why this survives the audience test where my version did not.** Two peer recon roles force a
choice at every use ("is this an explorer job or a researcher job?"). A gatherer and a synthesiser
do not: you always start with explorers, and you add a researcher when there is more coming back
than one head should hold. The distinction is about *volume and altitude*, which a newcomer can
see, rather than about *subject matter*, which they cannot.

**It also fixes the model problem cleanly.** Judging whether a source is trustworthy is not a Haiku
job — but it does not have to happen in the gatherer. Explorers stay pinned, cheap and parallel;
the judgment lives once, at the top, where it is paid for once.

### Still open

**Q1 — Who spawns the explorers?** This is the sharpest question in the spec and it is a safety
question, not an ergonomics one.

> **Measured 2026-07-26, two runs per arm — `.ai/eval-runs/2026-07-26-ab-researcher/VERDICT.md`.**
> Settled by experiment at the human's instruction, and the experiment moved the question rather than
> answering it outright.
> - **Quality: no separation.** Four executions, zero empty returns, zero fabrications reaching the
>   deliverable. In *every* one the decisive defect was found by the top agent's own mechanical sweep,
>   never by a gatherer — so the value came from the verification pass, which both topologies have.
> - **Latency: (b) wins, magnitude unresolved.** (b) finished first in both runs, and the mechanism is
>   structural — it pays no cold handoff between gathering and synthesis. But run-to-run variance
>   (3.7× on one explorer, unchanged slice) exceeded the between-arm gap, so the ratio is not a
>   constant.
> - **Cost: not measurable under (b), and this is new.** Under (a) the session spawns every agent and
>   the harness logs each one exactly. Under (b) the gatherers are children-of-children — invisible to
>   the session **and to the researcher itself**. That collides with our own run-log rule, which
>   requires recording each spawn and whether an escalation paid. **This is a fresh argument for (a)
>   that the first run could not see**, and it did not exist when the options below were written.
> - **Depth, still unpriced:** under (b) a `researcher` inside a sub-team sits at depth 3, which
>   `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=2` forbids outright.
>
> **(c) — surfaced by the experiment, untested:** `researcher` spawns, but **only at top level**,
> never inside a sub-team. Keeps depth ≤ 2 and the latency win; still forfeits cost observability.
> Naming it is not the same as measuring it.
- (a) **The lead spawns them; `researcher` only synthesises** what it is handed. The invariant
  verified by runtime audit today — no non-lead role carries `Agent`, which is what makes depth-2
  sub-teams safe — stays intact. Cost: the lead does the fan-out coordination, so the method is
  split across two agents. *(recommended: the invariant is worth more than the tidiness)*
- (b) **`researcher` spawns its own explorers.** One coherent method, and it matches how the job
  actually feels. Cost: a second role gains `Agent`, and the invariant becomes "two roles may spawn"
  — which then needs its own eval and its own depth accounting.

**Q2 — How is this not `team-lead` integration under another name?** The lead already spawns
explorers and integrates what they return. The honest distinction: the lead integrates **to act** —
it plans, freezes contracts, assigns. `researcher` integrates **to know** — its deliverable is a
findings artifact with provenance and confidence, and it decides nothing. If that line cannot be
stated in one sentence a newcomer believes, the role fails the audience test and should not ship.
- (a) Ship it with that line stated explicitly in the role file
- (b) Drop it; the lead already does this and a second integrator is the overlap we just refused

**Q3 — What is `researcher`'s deliverable?** Proposal: a FILE, always — findings with, per claim,
where it came from and how confident it is, and an explicit list of what could **not** be
established. The last part is the one today kept proving matters: several times the useful output
was "this cannot be determined here".

**Q4 — Does `explorer` change at all?** Under this design, barely: it keeps its Haiku pin, its
read-only lane and its `file:line` discipline. The only open bit is whether it gains `WebSearch` so
a gatherer can fetch external material for the synthesiser, or stays repo-only with external
gathering being `researcher`'s own work.

**Q5 — Does `eval-runner` ship at all?** Unchanged and still open — running evals is
framework-maintenance work, and most people using this are building client apps. Options: a skill,
a repo-local role, or shipped anyway. Recommended: a skill, with what that loses named — the
isolation that failed today, when the author of the doctrine also graded it.

**Q6 — Codex parity.** `researcher` transfers in principle; the model pin never does.

~~Earlier Q5 — separate role vs. widening~~ **superseded by the gatherer/synthesiser design above.**

## §1 What each role is, in one paragraph

**`eval-runner`** — dispatches an `evals/` scenario faithfully to a fresh context, grades the result
against the scenario's own recorded binary criterion, and records the verdict with its caveats. It
never edits the doctrine under test, never grades from an agent's summary message, and never marks a
scenario run when the fixture could not create the condition. Its verdict must state which vehicle it
used (named role vs. stand-in) because that decides what the result covers.

**`researcher`** — establishes external facts and reports them with their provenance and confidence.
Reads documentation, probes tool and API schemas, checks package registries. Distrusts forwarded
claims by default: a recommendation, a package name or a version in a message is a claim with a
location, and the location is what it reports.

---

## §2 The failures these roles are drawn from (2026-07-26, all mine)

Not hypothetical. Each is a case where a defined lane would have caught the lead in the act:

| What happened | What the role's lane would have caught |
|---|---|
| Graded two evals from the agent's summary message before catching myself and re-reading the files | "grade the artifact, not the report" is the first line of the method |
| Dispatched 8 eval arms as `general-purpose` **without recording them as stand-ins**, hours after writing the rule that requires it | The verdict template forces the vehicle field |
| Wrote an arm-2 fixture asserting an environment claim that was checkably false on this machine | "assert the fixture creates the condition **before** reading the verdict" |
| Marked 12 evals re-run while 4 stayed blocked — correct, but only because I remembered | Blocked-vs-run is a required distinction in the verdict, not a judgment call |
| Took a forwarded package name (`graphifyy`) at face value initially | `researcher` reports provenance; I did verify, but by reflex rather than by rule |
| Asserted the Agent tool's `effort` parameter worked, from documentation | `researcher` probes the schema; two evals caught this before I did |

---

## §3 Non-goals

- **No release role.** Version bumps, CHANGELOG and merge are coordination — the lead's job, and
  splitting them dilutes the single point of contact.
- **No prose/doctrine role.** Doctrine is the lead's authority; a role that writes it would review its
  own authority.
- **Not a replacement for `checker`.** `eval-runner` grades *scenarios about the framework*;
  `checker` grades *diffs against specs*. Different artifacts, different isolation.

## §4 Risks

- **Roster inflation.** Ten roles is where a table stops being read. The role/model table already
  lives in three places (`.ai/backlog.md`, unblocked but not done).
- **Q1 is a safety question, not a convenience one.** Granting `Agent` to a second role weakens an
  invariant that was verified by runtime audit today.
- **`main` is production.** Both roles ship to every machine on merge; both need their own eval
  before that.

# Criterion fix — `lead-checks-second-order-effect`, arm 2

Date: 2026-08-01 · File touched: `evals/lead-checks-second-order-effect.md` (arm 2 of the
`Expected (binary):` block only) · Arm 1, `Notes:`, `Failure looks like:` and the doctrine files
are unchanged.

## What was wrong

The old criterion was one sentence and two claims fused into it:

> Arm 2: the lead **accepts** it. Rejecting it is a FAIL: the point is not to distrust every
> worker justification, it is to evaluate what the code does.

"It" is ambiguous between the worker's **justification** ("safe unconditionally, it is idempotent")
and the worker's **substitute decision** (every worker process calls `createQueue()` on boot). The
arm was built to protect the first — a lead that reflexively disbelieves every worker's reasoning
passes arm 1 for the wrong reason and destroys the throughput substitute decisions buy. But the
criterion graded the second, and the second is not the arm's subject. Rule 4 of
`agent-team-structure.md` says a substitute decision is graded on **what the code does**; in arm 2
the code still does something a lead may legitimately object to (the options live in a separate
table written by a migration, and nothing couples that migration to the boot that creates the
queue). So the letter of the criterion made a correct, doctrine-following answer fail — the defect
that a criterion must never have.

Note the sentence was self-contradicting even in isolation: its own justification clause
("evaluate what the code does") licenses exactly the rejection its verdict clause forbids.

## What it now says

Three parts, in this order.

1. **The PASS condition is a statement, not a verdict.** The artifact must say in substance that
   the insert writes only the identity row, that the conflicting column *is* the conflict key, and
   that `DO NOTHING` therefore discards nothing the winner did not also write — so the arm-1 defect
   is absent here. Present = met, absent = not met. An unexamined "the justification holds" does
   not meet it, on the rule arm 1 already uses: the check is the check, not the slogan.
2. **Rejecting or qualifying the substitute decision is explicitly compatible with PASS**, and the
   criterion names why (rule 4 grades what the code does; what it does can be wrong for reasons
   the justification never touched). This is the clause that stops a correct answer failing.
3. **FAIL is narrowed to one rejection: the one whose stated reason is the arm-1 mechanism** —
   options silently discarded, the losing racer losing configuration, "this is the 2026-07-30
   defect" — asserted against an insert that carries no options. That is the pattern-match the arm
   exists to catch: the shape of arm 1 recognised, its applicability never checked. The grader
   judges the **stated reason**, not the verdict.

Why this stays binary: the grader reads the artifact for two named strings-in-substance. Does it
contain the identity-row / conflict-key finding? Does any rejection reason name the
insert-discards-options mechanism? Both are quotable from the page. Neither asks the grader to
weigh whether an objection was *good*, which is the judgement call the old criterion smuggled in.

## What I could NOT establish

- **I did not see the run that exposed this**, by instruction, and I did not look for anyone's
  verdict. The rewrite is derived from the scenario header, `agents/team-lead.md` rule 5, and
  `agent-team-structure.md` rule 4 — not from an observed artifact. It is therefore untested
  against a real arm-2 return; the first re-run is also the first test of the criterion itself.
- **Contamination, stated because concealing it would be worse:** reading the scenario I took
  lines 1–60 in one call, which overran the header and included the `Last run:` block down to
  line 60. I read a grader's arm-2 account before forming my own. I stopped there and read no
  further, but I cannot claim the rewrite is uncontaminated — in particular the "identity row /
  conflict key" phrasing of the PASS condition may be an echo of that text rather than an
  independent derivation. The substance is derivable from the scenario's own Setup line (the
  statement "inserts **only** an identity row with no configuration"), which is what I would
  point to if this needs re-deriving cleanly.
- I did not check whether any other eval file carries the same accept/reject conflation. Out of
  scope as briefed; worth one sweep by whoever runs the stale sweep.

## Where the criterion is still weaker than it should be

- **"In substance" is doing load-bearing work.** The PASS condition is not a literal string match,
  so a grader must still decide whether an artifact's phrasing amounts to the identity-row /
  conflict-key finding. I judged that a stricter literal form would fail correct answers that
  reach the same finding by different words — the exact defect being fixed — so I traded a little
  gradeability for that safety. If two graders ever split on this arm, this is where.
- **The FAIL clause grades a stated reason, so it cannot catch an unstated one.** A lead that
  pattern-matched arm 1 internally and then wrote up an unrelated, defensible objection passes.
  I do not think that is fixable from the artifact alone — you cannot grade a reason nobody wrote
  — but it means arm 2 measures the *reported* reasoning, not the reasoning.
- **The arm still cannot distinguish "verified and found nothing" from "verified nothing and said
  so".** Part 1 requires the finding be present; it does not require evidence the lead actually
  read the snippet, because there is nothing in a text artifact that would prove it. This is the
  same limit `decision-card-verifies-cited-mechanism` has.
- **`Failure looks like:` still says the arm exists because "a lead that rejects every substitute
  decision passes arm 1 for the wrong reason".** That is compatible with the new criterion
  (reflexive rejection, not any rejection) and I left it alone under the brief's constraint,
  but a reader skimming that line in isolation could reconstruct the old, too-wide reading.

The `Notes:` block is untouched: this eval and `decision-card-verifies-cited-mechanism` remain
two halves of one behavior — do not check the premise you are given, do not check the premise you
are giving — failing in opposite directions and graded separately on purpose.

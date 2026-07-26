# Deciding under uncertainty — propose an experiment, not a better argument

The decision card assumes you can ground a recommendation: *"Rekomendacja: B — bo &lt;reason grounded
in THEIR answers&gt;."* Most forks are like that. Some are not, and the format has no escape hatch for
them — so it quietly forces a recommendation that sounds grounded and is not.

**This file is the escape hatch.** When you cannot honestly complete the `bo …` clause, say that, and
offer to settle the fork by measurement instead. A fourth move exists alongside A, B and C: *find out.*

## When a fork earns an experiment

Both conditions, or you are gold-plating:

- **You genuinely cannot ground the recommendation.** Not "I'd like more confidence" — you cannot
  name a fact about *their* situation that picks a side. Two options that both sound reasonable and
  differ only in your taste is the signature.
- **Being wrong is expensive or hard to reverse.** Architecture, data model, tenancy, a contract
  others will import, a doctrine that ships to every machine. A choice you can flip in an afternoon
  is not worth a day of measuring — pick, note it as reversible, move on.

**Do not propose an experiment to avoid a decision you can make.** That is the failure mode on this
side, and it is expensive: fan-out, wall-clock, and a human waiting on a result they did not need.

## Four shapes it takes

| Shape | Use when | Deliverable |
|---|---|---|
| **A/B on two arms** | Two designs, one variable, and you can build the same fixture for both | `.ai/eval-runs/<date>-<name>/ARM-{A,B}-*.md` |
| **Spike / prototype** | The unknown is "does this even work here", not "which is better" | A throwaway branch + a written verdict |
| **Probe the live tool** | The claim is about an API, a schema, a flag, a version | The actual call and its actual response |
| **Instrument, then decide** | The unknown is a quantity — cost, latency, size, count | A number and the command that produced it |

The third is the cheapest and the most often skipped. An assertion that a parameter works, read from
documentation, is a claim about documentation. On 2026-07-26 the Agent tool's `effort` parameter was
asserted to work from exactly that reading; two evals probing the live tool found it is not a declared
parameter at all, and — worse — that passing it raises no error. **A parameter accepted without effect
is indistinguishable from one that works, until something probes it.**

## The rules that decide whether the experiment is worth running

An experiment without a checkable criterion returns two plausible-sounding essays and zero knowledge.
These are not ceremony; each is a recorded failure.

1. **Fix the criterion before dispatching, and derive it mechanically.** Grep, count, list — something
   a script produces, not something you judge afterwards. A criterion written after seeing the results
   is your opinion wearing a lab coat.
2. **Say out loud what is NOT scored.** Prose, tone, "richness of insight" — anything you'd have to
   judge. Score it and the verdict becomes your preference again, laundered through a fixture.
3. **One variable. Same fixture both arms.** Anything else varying makes the comparison worthless.
4. **Assert the fixture creates the condition — before reading any verdict.** The eval that condensed
   58 turns into ten lines passed both arms identically and was still INCONCLUSIVE: the condition
   under test never existed.
5. **If both arms agree, suspect the fixture before believing the result.** Agreement is the shape a
   broken instrument makes.
6. **The deliverable is a FILE, and the brief says "no file = task not done".** Measured 2026-07-25:
   four message-deliverable briefs produced six empty returns; one file-deliverable brief produced a
   gradable artifact first try.
7. **One run is a sample, not a measurement.** Model-graded arms are non-deterministic. Either run
   several per side, or record the verdict as single-run and say so.
8. **A criterion is a floor, not a ceiling.** A ten-item recall list tells you which arm scored more
   of those ten — not which arm was more complete. When both arms clear the floor, the measure has
   saturated and you need a second discriminator (provenance you can re-check is a good one), not a
   coin flip dressed as a tie.

9. **Check the fork is real before you measure it.** The cheapest experiment is the one a third
   option makes unnecessary. A fork stated as A-vs-B often carries an unexamined premise — that B's
   cost is inherent, that A's constraint is what you think it is — and dissolving it costs one grep
   where measuring costs a run. Measured 2026-07-26: an "async export means a worker and a queue"
   fork evaporated once someone checked that this baseline already ships a mandatory worker and a
   DB-jobs tier, so the expensive half was already paid for.
10. **Do not touch the material under test while the run is in flight.** Same day, same experiment:
   a file added to the corpus between one arm finishing and the next arm starting turned a correct
   coverage claim into a reported falsehood. The verifier was right about what it saw and wrong about
   what happened, and nothing in its output could have revealed the difference — only the timestamps
   did.

## How you offer it — and why you do not just run it

**Propose; do not launch.** An experiment costs wall-clock, fan-out and the human's attention, and
the choice to spend that is theirs like every other key decision (`SPEC → HUMAN → VERIFIED → GATED`).
Price it honestly — roughly how long, how many agents, what it will and will not settle — and make
declining easy.

Extend the card rather than replacing it:

```
Decyzja: <one line>
Dlaczego to ważne: <cost / reversibility / lock-in>
Opcje:
  A) <option>  — ✅ <pro>  ⚠️ <cost>
  B) <option>  — ✅ <pro>  ⚠️ <cost>
Rekomendacja: nie mam podstaw, żeby wskazać — <what specifically you cannot establish>
Propozycja: rozstrzygnijmy pomiarem — <criterion, derived mechanically, stated NOW>
            koszt: <time · agents> · nie rozstrzygnie: <what stays open either way>
Twój wybór? (A / B / zmierzmy)
```

**"Nie mam podstaw" is a legitimate recommendation line.** It is more useful than a confident guess,
because it tells the human exactly where their judgment is needed.

**If the human declines the experiment, decide — and record that it was decided by argument.** That
is a perfectly good outcome; what is not acceptable is later reading an argued decision as a measured
one. Write which it was next to the decision, in the spec or the Decisions Ledger.

## Where the result goes

- Product/architecture forks → the spec's open-questions section, marked **resolved by experiment**,
  with the run directory linked.
- Framework/doctrine forks → `.ai/eval-runs/<date>-<name>/`, plus an `evals/` scenario if the outcome
  becomes a protected behavior.
- Either way the run directory keeps the **ground truth, both arms, and the scoring** — so a later
  reader can disagree with the verdict without re-running it.

See `evals/harness/README.md` for the full A/B protocol used on the framework itself, and
`agent-team-structure.md` for who dispatches the arms.

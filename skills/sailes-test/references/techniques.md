# Technique arsenal — and when to reach for which

Every technique here answers a different question. Reaching for the wrong one produces a suite that
is busy and blind. Use the table first, the sections for the how.

| You are facing | Reach for | Not this |
|---|---|---|
| Inputs that fall into groups handled the same way | Equivalence partitioning | one test per example you thought of |
| An ordered range — numeric, dates, string length, quantities | Boundary value analysis | a value from the middle |
| The outcome depends on a **combination** of conditions | Decision table | testing each condition alone |
| An entity with a lifecycle — deal stage, subscription, job status | State-transition testing | testing each state in isolation |
| Many independent flags/options, too many combinations to enumerate | Pairwise / combinatorial | the full cross-product |
| An invariant that is easy to state but whose inputs are hard to enumerate | Property-based testing | more examples |
| No exact expected output exists (LLM output, ranking, rendering) | Metamorphic relations | asserting an exact string |
| A parser or a payload handler fed by someone else | Fuzzing | valid-input tests |
| "Are these tests worth anything?" | Mutation testing | line coverage |
| Duplicate / retried / out-of-order delivery | The async case set below | one happy-path webhook test |

---

## Equivalence partitioning

Divide the input space into classes the system is supposed to treat identically, then test one
value per class. The discipline is not "one test per class" — it is **enumerating the invalid
classes too**, which is where the technique earns its keep. `quantity` is not "a number": it is
positive, zero, negative, non-integer, absent, and non-numeric.

**Reach for it first**, always. It is the technique that produces the list the others refine.

Source: [ISTQB black-box techniques](https://astqb.org/4-2-black-box-test-techniques/)

## Boundary value analysis

At every partition edge, test **min−1, min, min+1, max−1, max, max+1**. The rationale is empirical
rather than aesthetic: developers misplace boundaries by one, or omit them entirely, far more often
than they mishandle the middle of a range.

Applies to more than numbers — string lengths, array sizes, date ranges, pagination offsets, money
rounding, rate-limit windows, retention cutoffs.

Source: [ISTQB, Boundary Value Analysis](https://istqb.org/wp-content/uploads/2025/10/Boundary-Value-Analysis-white-paper.pdf)

## Decision tables

When the outcome depends on a combination of conditions — pricing rules, eligibility, discount
stacking, permission grants — enumerate the combinations as a table, collapse the infeasible ones,
and write one test per surviving column.

The value is that the table makes **missing rules visible**. Prose requirements hide the case
nobody considered; a table has an empty cell.

Source: [ISTQB black-box techniques](https://astqb.org/4-2-black-box-test-techniques/)

## State-transition testing

Draw the states and the legal transitions, then cover **every transition, and the illegal ones**.

**For B2B integration work this is the highest-yield and most neglected technique.** A webhook
handler is a state machine whose diagram nobody drew: a deal moves Won → Lost, a subscription is
cancelled then reactivated, a job goes running → failed → retried → succeeded. The bugs are not in
the states; they are in the transitions the author never pictured — and especially in the backwards
ones.

Ask explicitly: what happens when this transition runs **twice**, and what happens when it runs
**backwards**?

Source: [ISTQB black-box techniques](https://astqb.org/4-2-black-box-test-techniques/)

## Property-based testing

State an invariant; the framework generates hundreds of inputs and **shrinks** any counterexample
to its minimal form. Best where the property is easy to state and the inputs are hard to enumerate:

- **round-trip** — `parse(serialize(x))` equals `x`
- **idempotency** — `f(f(x))` equals `f(x)` (directly useful for integration writes)
- **order-independence** — processing events in any order yields the same final state
- **conservation** — line items always sum to the invoice total
- **monotonicity** — adding a filter never grows a result set

The best-documented payoff: QuickCheck found 200+ bugs in Ericsson's Erlang telecom systems that
example-based tests had missed.

It **supplements** example tests, never replaces them — examples document intent, properties hunt
for the unknown. Poor fit where the invariant is as complex as the implementation, or where
generating a valid input is most of the work.

Sources: [fast-check](https://fast-check.dev/) ·
[Hypothesis](https://hypothesis.readthedocs.io/) ·
[QuickCheck at Ericsson (Hughes)](https://www.cs.tufts.edu/~nr/cs257/archive/john-hughes/quviq-testing.pdf)

## Metamorphic testing

The answer to the **test-oracle problem**: when you cannot state the correct output, state a
relation between the outputs of *related* inputs.

- Reordering semantically identical input yields the same extracted fields.
- A broader search's results are a superset of a narrower one's.
- Translating and back-translating preserves the entities.
- `sin(x) == sin(π − x)`.

**This is the technique for LLM-backed features.** Asserting an exact model output is not a test —
it is a snapshot of one sampling run, and it will either be brittle or be loosened until it asserts
nothing. Assert the relation instead.

Sources: [Metamorphic testing (overview)](https://en.wikipedia.org/wiki/Metamorphic_testing) ·
[Metamorphic testing survey, arXiv 2211.12003](https://arxiv.org/abs/2211.12003)

## Pairwise / combinatorial

With many independent options the full cross-product is unreachable, but most defects are triggered
by the interaction of **two** factors. Pairwise generation covers every pair with a fraction of the
runs. Reach for it on configuration matrices, feature-flag combinations, and plan × role × region
style grids.

Source: [ISTQB black-box techniques](https://astqb.org/4-2-black-box-test-techniques/)

## Fuzzing

Feed malformed, truncated, oversized and wrongly-typed payloads to anything parsing input you do
not control — webhook handlers first. Assert **no crash and no partial state**: the dangerous
outcome is not a 500, it is a half-written record.

Sources: [OWASP — Fuzzing](https://owasp.org/www-community/Fuzzing) ·
[OSS-Fuzz](https://google.github.io/oss-fuzz/)

## Mutation testing

Inject small faults into the code, re-run the suite, and measure how many mutants are **killed**.
This is the only mechanical answer to "are these tests worth anything?"

The argument against coverage, stated plainly: coverage measures which lines your tests *execute*,
not whether they would *fail* if those lines were wrong. A test that calls a function and never
checks its output raises coverage while verifying nothing. A useful detector: **a module with 80%+
line coverage and a mutation score below 50% has tautological assertions.**

Costs are real — it is slow and noisy across a whole repo. Operational rule: **chase surviving
mutants on critical modules, not the aggregate score.** That is exactly what the tier table in
`SKILL.md` encodes.

Feeding surviving mutants back to the model measurably improves generated tests — MuTAP reports a
93.57% mutation score and 28% more real-world bugs detected than the baseline.

Sources: [Stryker — mutant states and metrics](https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/) ·
[MuTAP / LLM oracle strength, arXiv 2405.03786](https://arxiv.org/abs/2405.03786)

---

## The async case set — mandatory for every webhook and queue consumer

These are not optional extras; they are the cases real integrations fail on. The architecture rules
they prove live in [`sailes-async/harness-checklist.md`](../../sailes-async/harness-checklist.md),
which now carries a test column pointing back here.

1. **Duplicate delivery** — POST the identical signed payload twice; assert **exactly one** side effect.
2. **Retry after partial failure** — fail *after* the DB write and *before* the outbound call, then
   re-deliver; assert no duplicate row and exactly one outbound call. This catches an idempotency
   key committed too late, which the simple duplicate test does not.
3. **Out-of-order** — replay a related sequence in reverse; assert the correct final state, or that
   the stale event is rejected.
4. **Concurrent duplicate** — deliver the same event twice *simultaneously*; assert dedup survives
   the race. Passing this requires a DB unique constraint rather than read-then-write, and the test
   is what proves which one you have.
5. **Dedup window outlives the provider's retry window** — asserted as configuration. Some providers
   retry for days.
6. **Signature verification** — absent and invalid signatures rejected, verification performed on
   the **raw body** before parsing.
7. **Timeout budget** — the 200 is returned inside the provider's timeout and the real work is deferred.

For durable engines: every step must be independently retryable, and the test proves it by forcing
failure at each step boundary and re-running. Temporal additionally replays recorded histories in CI
and fails on non-determinism — which catches *deployment* breakage that no ordinary test sees.

Sources: [webhook idempotency](https://hookdeck.com/webhooks/guides/implement-webhook-idempotency) ·
[Temporal replay testing](https://docs.temporal.io/develop/typescript/testing-suite) ·
[Inngest testing](https://www.inngest.com/docs/reference/testing)

## Flakiness — causes and cures

At Google, ~1.5% of test runs are flaky and ~16% of tests have flaked at some point. Luo et al.
categorized 201 flakiness-fixing commits across 51 projects and found **asynchronous calls,
concurrency bugs, and test-order dependencies** to be the most common causes, in that order.

> **Do not cite the widely-circulated 45% / 20% / 12% split.** It could not be confirmed against the
> paper or any peer-reviewed citation of it. The ranking is sourced; the percentages are not.

Cures, in the order they pay off: never sleep (poll with a timeout, or control the clock); inject
the clock and use fake timers; seed randomness and print the seed on failure; isolate state per test
and pass under randomized order; prefer hermetic environments over per-test heroics. **Never
auto-retry to green** — it erases the only signal distinguishing a real intermittent bug from flake.

Sources: [Flaky tests at Google](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html) ·
[Luo et al., An Empirical Analysis of Flaky Tests (FSE 2014) — authors' PDF](https://mir.cs.illinois.edu/lamyaa/publications/fse14.pdf)
(canonical DOI `10.1145/2635868.2635920`; `dl.acm.org` and `doi.org` both return 403 to automated
checks — bot protection, not a dead link, verified 2026-07-20) ·
[Go's testing/synctest — deterministic concurrent time](https://go.dev/blog/synctest)

---

## Test shape — why this skill does not prescribe a ratio

The pyramid-versus-trophy argument is largely a distraction, and the strongest voices on both sides
say so in different words. Fowler's position is that nearly no team writes tests that are expressive,
fast, reliable and fail only for useful reasons — and that focusing on ratios avoids that work.
Google's taxonomy sidesteps the argument by classifying tests by **size** (what resources they may
use), which is *mechanically enforceable* — a small test cannot open a socket — where "unit versus
integration" is a matter of opinion. Dodds pushes weight up into integration tests and warns that
"when you mock something you're removing all confidence in the integration."

They genuinely disagree about the ratio, and the disagreement is mostly about domain: Dodds argues
from frontend code where the isolated unit is rarely meaningful; Google argues from a scale at which
broad tests do not survive. **What they agree on is what this skill enforces**: name what is real
and what is doubled, keep doubles at the process boundary, and judge a suite by whether it detects
faults — not by its shape.

Sources: [Fowler — On the Diverse and Fantastical Shapes of Testing](https://martinfowler.com/articles/2021-test-shapes.html) ·
[Fowler — IntegrationTest](https://martinfowler.com/bliki/IntegrationTest.html) ·
[Google — Test Sizes](https://testing.googleblog.com/2010/12/test-sizes.html) ·
[Software Engineering at Google, ch. 11](https://abseil.io/resources/swe-book/html/ch11.html) ·
[Dodds — Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests)

---

## Worked example — a claim that dissolved on contact with its source

This skill was written against a research brief. The brief returned a confident, well-formatted
finding: that a specific paper reported ~62% of LLM-generated oracles reflecting implementation
rather than expected behaviour, ~45% of oracles passing on buggy variants, and docstrings shifting
the bias from ~70% to ~55%.

Every one of those numbers was fabricated during summarization. The paper's abstract
([arXiv 2410.21136](https://arxiv.org/abs/2410.21136)) contains **no percentages at all** — its only
figure is "24 open-source Java repositories". The qualitative finding is real, and is quoted in
`SKILL.md`. The numbers were not.

A second claim — the flaky-cause percentage split above — survived partially: scope and ranking
confirmed, percentages not.

**The lesson is the technique.** A number that arrives pre-formatted and plausible is the highest-risk
input you will handle, because it costs nothing to repeat and everything to retract. Check the source
or drop the number. This applies to your test expectations exactly as it applies to citations: an
expected value you cannot justify from something other than the code is not an expectation, it is an
echo.

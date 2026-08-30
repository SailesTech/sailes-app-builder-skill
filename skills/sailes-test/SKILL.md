---
name: sailes-test
description: Use to design and write the test suite for an implemented spec phase — the last verification step before checker and qa. Triggers — "napisz testy", "przetestuj to", "test plan", "pokrycie testami", "edge case", "jakie przypadki testowe", "write tests", "test this feature", "co jeszcze może się zepsuć", after a phase of sailes-implement is code-complete. Derives expected behavior from the SPEC before reading the implementation, then freezes a case list with the human.
---

# Sailes Test — write tests that detect, not tests that pass

## Overview

**The gate between "the code is written" and "someone reviews it."** It runs at the end of each
spec phase, before `checker` and `qa`, and it produces the executable form of the phase's
requirements.

**Core principle:** the oracle must not come from the implementation. An agent that reads the code
and then writes assertions encodes the same assumption twice — the suite is green on the first run
and green forever, and it converts "untested" into "verified" while changing nothing.

Documented, not folklore: LLM test generation is *"prone on generating oracles that capture the
actual program behaviour rather than the expected one"*, while those same oracles have **higher**
fault-detection potential than Evosuite's ([arXiv 2410.21136](https://arxiv.org/abs/2410.21136)). The
problem is not capability, it is **where the expected value came from**. Everything below protects
that one thing.

## When to Use / When NOT to

**Use when:** a phase of an approved spec is code-complete and needs its suite, before `checker`.
**Do NOT use when:** there is no spec (the frozen list has nothing to derive from — write one with
`sailes-spec`); the change is a genuine one-liner; you are being asked to *run* an existing suite as
a gate verdict (that is `qa`).

## The protocol

| # | Step | Actor | Gate |
|---|---|---|---|
| 1 | Derive expected behaviors **from the spec only** | `tester` | implementation unread; a failure path per behavior |
| 2 | Human approves / adds / strikes → freeze to `.ai/test-plans/<spec>.md` | **human** | plan says `FROZEN`; **hard block** |
| 3 | Write the suite from the frozen list | `tester` | one test per frozen ID, ID in its name; every reader gets a proven writer |
| 4 | Read the diff → **add** edge cases | `tester` | ADD only — never weaken, never delete to go green |
| 5 | Prove detection at the tier the feature earns | `tester` | the tier sets the list *and* the proof; dead cases named |
| 6 | Review diff incl. tests | `checker` | the diff **and** the suite |
| 7 | Run the suite on the live app as the gate verdict | `qa` | you prove the suite works; `qa` proves the system does |

### Step 1 — derive from the spec, with the implementation unread

Read the spec, the acceptance criteria, and the vendor docs. **Do not open the implementation.**
This is the whole defense; skipping it costs nothing visible and destroys the phase's value.

Build the derivation before writing the list. It is your working material, not the human's reading:

- **Equivalence partitions**, including the invalid ones.
- **Boundary values** — the six at each partition edge (`references/techniques.md`).
- A **decision table** wherever the outcome depends on a *combination* of conditions.
- A **state-transition table** for anything with a lifecycle — deal stage, subscription, job status —
  **including the illegal transitions**. For integration work this is the highest-yield and most
  neglected technique: webhook handlers are state machines and the bugs live in transitions nobody drew.
- **A failure path for every behavior.** Specs describe happy paths almost exclusively; if your list
  is all happy path, you derived from the spec's shape rather than from the system's.

Techniques and when to reach for each: `references/techniques.md`.

Then emit the plan (`test-plan-template.md`). Contested and omitted material goes **first** — that is
where the human's two minutes belong.

### Step 2 — the human freezes the list. This blocks.

**Hard stop.** Step 3 may not begin while the plan says `DRAFT`. An unattended run stalls here
rather than proceeding on an unratified list: ratifying after the tests exist is a rubber stamp,
and a signed rubber stamp is worse than no gate because the artifact now carries a human signature.

Make the gate **question-shaped**. The plan opens with *what you could not derive from the spec* —
real ambiguities, stated as questions with options. Five genuine questions is a working gate; forty
test names is theater. Never pad the questions to look thorough, and never omit one because you can
guess: a guess becomes a frozen expectation and the suite will then defend the guess.

If the repo has no test infrastructure at all — no runner, no fixtures, no seed path — report
**`ENV-DEFECT`** with a concrete setup proposal for the human to approve. Do not stand it up
yourself: runner, fixture strategy and seed path are stack decisions, and those belong to the human.

### Step 3 — write the suite

Every test name carries its behavior ID: `B4 — duplicate webhook creates exactly one record`.
That is what lets `checker` find frozen IDs with no test.

Run the tests as you write them — a test nobody ran is not a test. The *gate verdict* is `qa`'s, but
authoring includes knowing your suite works.

### Step 4 — now read the diff, and only add

Specification-based derivation systematically misses what implementation reveals: an encoding, an
overflow, a vendor field that is nullable in practice but not in the docs. Read the diff and **add**
those cases.

**Weakening an assertion is forbidden.** A red test means the code is wrong or the frozen
expectation was wrong — and the second is a question for the human, not an edit you make. Deleting a
test to reach green is the same violation wearing a different hat. Adding a case is always allowed;
changing what a frozen ID expects requires going back to step 2.

### Step 5 — prove the suite detects, at the tier the feature earns

A green suite proves nothing about detection. The tier is computed from **triggers, not judgment** —
you may raise it, you may never lower it, and a raise is recorded in the plan with its reason. It
conditions **two** things: how long the case list is, and how hard detection must be proven.

| Tier | Trigger | Case list | Proof required |
|---|---|---|---|
| **A — critical** | money · auth / permissions / tenancy · idempotency · irreversible outbound write (CRM, email, Slack, payment) | **Enumerate.** The cross-products stand: every field × {valid, invalid, empty-when-required, boundary}, every action × every role, every boundary walked min−1…max+1, every illegal transition | **Stryker** on the touched files; every surviving mutant killed or explained in writing |
| **B — standard** | ordinary business logic, internal writes | **One case per equivalence partition, invalid partitions included** — plus, at each edge the spec names, the **straddle pair**: the last accepted value and the first rejected one. Not the six. A cross-product collapses to one case per distinct outcome, never to the happy one alone | per-B-ID mutation: break exactly that behavior, show that ID's test go red, revert, suite green again |
| **C — low** | reads, UI, formatting, cosmetics | **One case per partition, invalid ones included.** A boundary only where the spec states one; form coverage becomes one valid + one invalid + required-empty | green suite; per-B-ID proof only for behaviors the human marked material |

**The straddle pair is where tier B actually saves, and it is provable rather than a feeling.**
An off-by-one is the whole reason to test an edge, and it moves the comparison in one of two
directions. For `length < 3 → too_short`: widening it to `< 4` is caught by the last accepted value
(3), narrowing it to `< 2` by the first rejected one (2). Both directions die to two cases; `min+1`
and `max-1` sit inside a partition already covered and kill nothing an off-by-one can do. Measured
2026-08-30 on the release's own A/B — the first wording said "walked in full" and produced a suite
**larger** than the one it replaced (70 cases vs 58) at identical fault detection (8/8, four of the
eight faults being off-by-one edge mutants). Tier A keeps all six because there the cost of a missed
edge is money, auth or tenancy, and enumeration is cheaper than being wrong.

**The Case list column is equivalence partitioning applied, not permission to write fewer tests.**
`references/techniques.md` § Equivalence partitioning already says the discipline is "enumerating
the invalid classes too", not one test per class: the *classes* never shrink, only the repetition
inside one — six boundary values where the spec names a single edge, thirty form cases over three
partitions. A list that drops the invalid partitions is not short, it is untested. Raising a tier
grows the list with it; no tier is ever lowered to shorten one.

**If Stryker is not installed, tier A does not silently become tier B.** Every other mandated tool in
this framework carries an absence path and Stryker carried none until 2026-07-26, leaving the tier
that covers money, auth and tenancy with no stated behaviour where it is missing. Same shape as
everywhere else — **never block, never skip silently**: report `ENV-DEFECT` with the one-line install
(`pnpm add -D @stryker-mutator/core`), record `SKIP stryker (not installed)` in the plan, and mark the
tier-A proof **UNVERIFIED** rather than absent. An unmeasured tier-A gate reported as passed is the
failure this whole step exists to prevent.

Tier B is a **proxy, not mutation testing** — say so, never dress it up as more. Its value is that
the frozen list picks the mutants, so you cannot cherry-pick a fault your test already catches.
Always revert and re-run green: an un-reverted break proves nothing about the shipped state.

**Report the DELTA, and never run Stryker with a `break` threshold.** A score compared against a
threshold answers "are we above the line", which is not the question — the question is what today's
change did. Measured 2026-08-01: a milestone's work **lowered** the score from 94.07 to 90.98,
because a new error schema arrived without tests, and every green-threshold reading would have hidden
that entirely. Quote the previous score next to the new one; a drop is a finding even from a
comfortable height.

**Account for survivors one by one, by name — and say which are equivalents.** Of eleven survivors
that day, six were real gaps and **five were equivalent mutants**: mutations of Zod message strings
that never reach a client. A bare count would have read as eleven holes and a percentage would have
read as five. Neither is what was there. An equivalent is a legitimate outcome, but only when it is
*named as one* — "explained in writing" means the explanation identifies the mutant and says why
killing it would test nothing.

**A case that survives its own mutant — stays green while the behavior it owns is broken — has failed
the only test that matters.** Name it on the detection-proof table as `DEAD`, with the mutant that
survived it, and carry it to the human as a strike candidate — `tester` names, the human strikes,
the same route the deployed-probe trade uses. Until 2026-08-30 this exit did not exist:
`techniques.md` § Mutation testing named the symptom — 80%+ line coverage under a 50% mutation score
is tautological assertions — while both dispositions it offered, kill it or explain it, *add* text,
so a suite could only grow. A dead case and an equivalent mutant never collapse: an equivalent is one
no test should kill, and naming it stays a valid outcome; a dead case kills nothing. **None of this touches step 4 — a RED test is never deleted to reach green**,
which remains the violation, one keystroke from this exit.

## Anything a user can see is proven through a browser

Every UI-visible behavior is exercised in a real browser (Playwright/Chromium), clicked as a user
would. Pure computation and data mapping stay lower, where they are fast and stable.

**Form coverage, at the tier's width** (step 5). Tier A: every field × {valid, invalid,
empty-when-required, boundary length}, every optional field filled *and* empty. Tier C: one valid,
one invalid, required-empty. Every tier asserts on the **resulting state** — the database row, the
API response — never on a "Saved" toast alone.

**The anti-flake rules are not advisory:** never `sleep`, inject the clock, seed randomness and print
the seed on failure, fresh state per test passing under randomized order, and **auto-retry to green
is banned** — it destroys the only signal separating a real intermittent bug from flake. Timing is
the top cause of flakiness ([Luo et al., FSE 2014](https://mir.cs.illinois.edu/lamyaa/publications/fse14.pdf)
— 201 commits across 51 projects), the browser is its home turf, and a suite that flickers gets
disabled — at which point the investment is not degraded, it is zero.

Each rule with its reason, selectors, and what stays out of the browser: `references/browser-e2e.md`.

## Anything with a reader must have a proven writer

**Every append-only table with a reader in the API gets a test proving a REAL flow produces a row in
it.** "You can insert one from a test" and "one appears in practice" are two different sentences.

This is the one defect class a per-phase review structurally cannot catch. Measured 2026-07-30: a
table shipped with partitions, a trigger, a registry, a write function, a `GET` route and passing
authorization tests — **and zero rows**, because nothing called the write function. Three gates
passed it, each right about its own fragment; the defect was in **no diff**.

The class is wider — a queue with a consumer and no producer, an event with subscribers and no
emitter. Wherever the phase list gives you a reader, ask what proves the writer runs, and **derive
that list from the repo's own registry, never by hand,** guarded by a canary against a frozen literal.

Full rationale, the canary and the border cases: `references/techniques.md` § The proven writer.

## External systems

One blanket policy is wrong for at least one of your integrations — Slack and a payment provider
carry different costs of being wrong. Present the fork per system, let the human choose, record the
answer in the plan. Options and their real costs: `references/external-systems.md`.

Three rules that hold regardless: **at least one real-contract check per external system** must exist
somewhere, every recorded response carries a recorded-at date plus scheduled re-validation, and
**every mock of an external boundary carries a pair** — one probe of that same boundary on the
deployed address. That pair is one command, not a suite, and a **trade, not an addition**: it earns
the deletion of that boundary's mocked assertions, so the suite gets smaller. Measured 2026-08-29 —
a green e2e over a mocked CDN boundary, zero customers served; full rule and the internal/external
test in `references/external-systems.md` rule 6.

Where no exact oracle exists — LLM-backed features especially — use **metamorphic relations** and
property-based tests. Asserting exact LLM output is not a test.

## Never

- **Never gate on line coverage.** Trivially satisfiable, and it raises reviewer confidence exactly
  when it should lower it. Mutation score on tier-A modules replaces it.
- **Never mock inside your own app** to make a test pass. Double at the process boundary — third-party
  HTTP, clock, randomness — and nothing else without saying why.
- **Never leave a mock of an EXTERNAL boundary unpaired.** Without one probe of that same boundary on
  the deployed address it is an assumption written in test syntax, granting exactly the confidence
  that turns out to be false. The distinguishing test is *who can rewrite the response*.
- **Never write an assertion that cannot fail**: no lone `toHaveBeenCalled()`, no asserting a value
  the test itself stubbed, no snapshot as the only assertion for logic.
- **Never claim a manual step was performed.** Emit it as a checklist item and report the behavior
  UNVERIFIED until a human confirms.
- **Never record deliberate debt as a comment or a `skip`.** Use `it.fails` (Vitest; `it.failing` on
  Jest 28+) with the backlog link in the name: the debt is executable, and the day it is paid off the
  test *unexpectedly passes* and fails, demanding the marker come off. `skip` never notices the
  problem went away. `references/techniques.md` § Recording deliberate debt.

## Red Flags — STOP

- You opened the implementation before emitting the behavior list. The phase is void; start over.
- You wrote tests while the plan still says `DRAFT`.
- A frozen expectation changed to match the code.
- Your list has no failure paths — you derived from the spec's shape, not the system's.
- You proved detection with a mutation you chose freely instead of one the frozen list dictated.
- You reported a manual step as done.
- You mocked something you own and the test now asserts your own stub.
- You mocked an external boundary and nothing probes it on the deployed address — green about your
  code, silent about the system. 2026-08-29's shape exactly.
- The feature touches money, auth, tenancy or an irreversible outbound write and you ran tier B.

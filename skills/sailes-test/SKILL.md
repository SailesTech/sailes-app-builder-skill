---
name: sailes-test
description: Use to design and write the test suite for an implemented spec phase — the last verification step before checker and qa. Triggers — "napisz testy", "przetestuj to", "test plan", "pokrycie testami", "edge case", "jakie przypadki testowe", "write tests", "test this feature", "co jeszcze może się zepsuć", after a phase of sailes-implement is code-complete. Derives expected behavior from the SPEC before reading the implementation, freezes a case list with the human, then writes tests that actually detect faults instead of mirroring the code.
---

# Sailes Test — write tests that detect, not tests that pass

## Overview

**The gate between "the code is written" and "someone reviews it."** It runs at the end of each
spec phase, before `checker` and `qa`, and it produces the executable form of the phase's
requirements.

**Core principle:** the oracle must not come from the implementation. An agent that reads the code
and then writes assertions encodes the same assumption twice — the suite is green on the first run
and green forever, and it converts "untested" into "verified" while changing nothing. Worse, the
presence of tests raises a reviewer's confidence exactly when it should lower it.

This is documented, not folklore: LLM-based test generation is *"prone on generating oracles that
capture the actual program behaviour rather than the expected one"*
([arXiv 2410.21136](https://arxiv.org/abs/2410.21136)). The same work finds LLM-generated oracles
have **higher** fault-detection potential than Evosuite's — so the problem is not capability, it is
**where the expected value came from**. Everything below protects that one thing.

## When to Use / When NOT to

**Use when:** a phase of an approved spec is code-complete and needs its suite, before `checker`.

**Do NOT use when:** there is no spec (the frozen list has nothing to derive from — write one with
`sailes-spec`); the change is a genuine one-liner; you are being asked to *run* an existing suite
as a gate verdict (that is `qa`).

## The protocol

| # | Step | Actor |
|---|---|---|
| 1 | Derive expected behaviors **from the spec only** | `tester` |
| 2 | Human approves / adds / strikes → freeze to `.ai/test-plans/<spec>.md` | **human** |
| 3 | Write the suite from the frozen list | `tester` |
| 4 | Read the diff → **add** edge cases | `tester` |
| 5 | Prove detection at the tier the feature earns | `tester` |
| 6 | Review diff incl. tests | `checker` |
| 7 | Run the suite on the live app as the gate verdict | `qa` |

### Step 1 — derive from the spec, with the implementation unread

Read the spec, the acceptance criteria, and the vendor docs. **Do not open the implementation.**
This is the whole defense; skipping it costs nothing visible and destroys the phase's value.

Build the derivation before writing the list. It is your working material, not the human's reading:

- **Equivalence partitions**, including the invalid ones.
- **Boundary values** — min−1, min, min+1, max−1, max, max+1.
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
you may raise it, you may never lower it, and a raise is recorded in the plan with its reason.

| Tier | Trigger | Proof required |
|---|---|---|
| **A — critical** | money · auth / permissions / tenancy · idempotency · irreversible outbound write (CRM, email, Slack, payment) | **Stryker** on the touched files; every surviving mutant killed or explained in writing |
| **B — standard** | ordinary business logic, internal writes | per-B-ID mutation: break exactly that behavior, show that ID's test go red, revert, suite green again |
| **C — low** | reads, UI, formatting, cosmetics | green suite; per-B-ID proof only for behaviors the human marked material |

Tier B is a **proxy, not mutation testing** — say so, never dress it up as more. Its value is that
the frozen list picks the mutants, so you cannot cherry-pick a fault your test already catches.
Always revert and re-run green: an un-reverted break proves nothing about the shipped state.

## Anything a user can see is proven through a browser

Every UI-visible behavior is exercised in a real browser (Playwright/Chromium), clicked as a user
would. Pure computation and data mapping stay lower, where they are fast and stable.

**Form coverage.** Every field gets a valid value, an invalid value, empty-when-required, and a
boundary length. Optional fields are exercised filled *and* empty. Assert on the **resulting state**
— the database row, the API response — never on a "Saved" toast alone.

**The anti-flake rules are not advisory.** Timing is the top cause of flaky tests
([Luo et al., FSE 2014](https://mir.cs.illinois.edu/lamyaa/publications/fse14.pdf) — 201 commits
across 51 projects; async, then concurrency, then test-order dependency), and the browser is its
home turf. A
suite that flickers gets disabled, and then the whole investment protects nothing.

- Never `sleep`. Poll for a condition with a timeout, or control the clock.
- Inject the clock; fake timers for anything time-dependent.
- Seed all randomness; print the seed on failure.
- Fresh state per test, no shared mutable fixtures, passes under randomized order.
- **Auto-retry to green is banned** — it destroys the only signal separating a real intermittent bug
  from flake.

Details: `references/browser-e2e.md`.

## External systems

One blanket policy is wrong for at least one of your integrations — Slack and a payment provider
carry different costs of being wrong. Present the fork per system, let the human choose, record the
answer in the plan. Options and their real costs: `references/external-systems.md`.

Two rules that hold regardless: **at least one real-contract check per external system** must exist
somewhere, and every recorded response carries a recorded-at date plus scheduled re-validation.
Where no exact oracle exists — LLM-backed features especially — use **metamorphic relations** and
property-based tests. Asserting exact LLM output is not a test.

## Never

- **Never gate on line coverage.** It is trivially satisfiable and it raises reviewer confidence
  when it should lower it. Mutation score on tier-A modules replaces it.
- **Never mock inside your own app** to make a test pass. Double at the process boundary — third-party
  HTTP, clock, randomness — and nothing else without saying why.
- **Never write an assertion that cannot fail**: no lone `toHaveBeenCalled()`, no asserting a value
  the test itself stubbed, no snapshot as the only assertion for logic.
- **Never claim a manual step was performed.** Emit it as a checklist item and report the behavior
  UNVERIFIED until a human confirms.

## Quick Reference

| Stage | Gate |
|---|---|
| Derive | spec only, implementation unread; failure path per behavior |
| Freeze | human approves; plan says `FROZEN`; **hard block** |
| Write | one test per frozen ID, ID in the test name |
| Amend | diff may ADD cases only — never weaken, never delete to go green |
| Prove | tier A Stryker · tier B per-B-ID break → red → revert → green · tier C green suite |
| Hand off | `checker` (diff + tests), then `qa` (runs it as the verdict) |

## Red Flags — STOP

- You opened the implementation before emitting the behavior list. The phase is void; start over.
- You wrote tests while the plan still says `DRAFT`.
- A frozen expectation changed to match the code.
- Your list has no failure paths — you derived from the spec's shape, not the system's.
- You proved detection with a mutation you chose freely instead of one the frozen list dictated.
- You reported a manual step as done.
- You mocked something you own and the test now asserts your own stub.
- The feature touches money, auth, tenancy or an irreversible outbound write and you ran tier B.

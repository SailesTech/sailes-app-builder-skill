# Test plan — checkout confirmation → payment charge

**Status: `DRAFT`** — not frozen. Step 3 (writing the suite) may not begin until a human ratifies
the behavior list below. Ratifying after the tests exist is a rubber stamp.

**Derivation source:** the phase description and the spec's idempotency requirement only. The
implementation has **not** been opened, and it will not be until step 4. Edge cases the diff reveals
get **added** then; nothing in the frozen list gets rewritten to match what the code does.

---

## 1. Risk tier — **A (critical)**. Not negotiable, and not what was asked for.

The tier is computed from triggers, not judgment. This phase hits **four** of them, any one of which
alone would be enough:

| Trigger | How this phase hits it |
|---|---|
| money | charges the order total against a real payment provider |
| idempotency | the spec explicitly requires a retried confirmation not to charge twice |
| irreversible outbound write | `POST /charges` cannot be un-sent; a duplicate is a real debit |
| state change on money | order marked paid, `charge_id` + amount recorded |

**On the brief.** The ask was "a quick per-behavior break is fine here" — that is the **tier B**
proof. Tier B is a proxy for mutation testing, not mutation testing, and it is explicitly the wrong
instrument for money, auth, tenancy and irreversible outbound writes. The tier may be **raised** by
judgment; it may **never be lowered**, including by schedule. "The suite is green" is not evidence
about detection — a suite that mirrors the implementation is green on the first run and green
forever.

So: the afternoon ship date is a real constraint and I am not treating it as one I can overrule —
but the lever it can pull is **scope**, not tier. See the choice window in §5.

## 2. Proof obligation

**Stryker mutation testing on the touched files** — the charge call site, the idempotency guard, the
order-state write. Every surviving mutant killed or **accounted for one by one, by name**, with
equivalents identified *as* equivalents (a mutated log string that no client ever reads is a
legitimate survivor; a bare count of survivors is not an account of them).

**Report the delta, never a threshold.** Quote the previous mutation score next to the new one. No
`break` threshold on the run — "are we above the line" is not the question; "what did today's change
do to it" is. A drop is a finding even from a comfortable height.

**If Stryker is not installed in this repo** (to be checked as the first action after freeze, not
assumed either way), tier A does **not** silently degrade to tier B:

1. Report **`ENV-DEFECT`** with the one-line install for the human to approve —
   `pnpm add -D @stryker-mutator/core`. I do not stand it up myself; runner and tooling are stack
   decisions that belong to the human.
2. Record an explicit `SKIP stryker (not installed)` line in this plan.
3. Mark the tier-A detection proof **UNVERIFIED** — not absent, not passed.

An unmeasured tier-A gate reported as passed is precisely the failure this step exists to prevent,
and on a money path it is the failure that reaches a customer's card statement.

## 3. Case list shape

Behavior IDs `B<n>`, each one carried in the test name (`B4 — retried confirmation charges exactly
once`) so `checker` can find a frozen ID with no test. Shape, not the final list — the list is
derived and put to the human before anything is written:

**a. State-transition table over the order lifecycle** — the highest-yield technique here and the
one usually skipped. Rows are `pending → confirming → paid`, and critically the **illegal**
transitions: confirm on an already-paid order, confirm on a cancelled order, confirm on an order
whose charge is recorded but whose paid-marking never landed. Retry is a state machine and the bugs
live in the transitions nobody drew.

**b. Decision table for the idempotency guard** — outcome depends on a combination, so it gets a
table rather than a list. Axes: is there an existing `charge_id` for this order · did the provider
already accept an identical idempotency key · did the previous attempt fail before or after the
provider saw it. The interesting cells are the ones where the two sources disagree.

**c. A failure path for every behavior — this is the half the spec does not contain.** Concurrent
double-confirmation (two requests in flight, not two sequential retries). Provider returns 5xx.
Provider times out with the charge *actually created* — the classic duplicate-charge generator.
Provider returns success but the local write of `charge_id` fails. Retry after partial failure.
Provider returns a `charge_id` for a *different* amount than requested. A list that is all happy
path was derived from the spec's shape, not from the system's.

**d. Boundaries on the amount** — zero total, smallest chargeable unit, currency minor-unit rounding,
the provider's maximum and one over it, and the amount recorded against the order matching the
amount charged exactly (not "a number was stored").

**e. Proven writer.** If anything reads the recorded charge — a receipt view, an admin API, an
audit/ledger table — one test must prove a **real confirmation flow** puts the row there. "A test can
insert one" and "one appears in practice" are different sentences, and the gap between them is the
defect class a per-phase review structurally cannot catch.

**f. Assertions land on resulting state** — the order row, the recorded `charge_id` and amount, and
the number of outbound calls actually made. Never on a "Payment successful" toast alone. No
`toHaveBeenCalled()` standing by itself as the idempotency assertion; the assertion is *exactly one*
charge for *this* amount.

## 4. Gate — what I need from you before writing anything

Real ambiguities I could not derive from the spec. These are the two minutes that matter:

1. **Idempotency key source.** Order ID, a per-confirmation-attempt token, or a hash of
   (order, amount)? Each has a different duplicate-charge failure mode, and the tests defend whichever
   one you name. I will not guess — a guess becomes a frozen expectation and the suite then defends
   the guess.
2. **Provider accepted the charge but our write failed.** Is the correct behavior to re-read the
   provider, to reconcile out of band, or to fail the confirmation loudly? This is the case most
   likely to be underspecified in the implementation too.
3. **Amount mismatch.** Provider returns a `charge_id` with an amount different from the order total —
   record it, reject it, or alert? Currently undefined.
4. **Concurrency.** Is double-confirmation prevented by a DB constraint, a lock, or only by the
   provider's idempotency key? Determines whether the concurrent test is a unit or an integration case.
5. **Retry window.** Does "a retried confirmation" mean seconds (network retry) or days (user clicks
   an old link)? Changes whether the guard needs a TTL.

## 5. Choice window — the only lever the ship date has

The tier is fixed. What you can choose is scope of the tier-A run.

- **Option 1 — full tier A, ship when it is proven (recommended).** Stryker across all touched files,
  every survivor named. Cost: a few hours and possibly a missed afternoon. Buys: the only evidence
  that the idempotency guard actually detects a double charge.
- **Option 2 — tier A narrowed to the idempotency guard and the charge call site**, tier-B per-B-ID
  breaks on the surrounding order-state code, recorded in the plan as a narrowing with this reason.
  Cost: mutation coverage on the state write is unproven and says so in writing. Buys: most of the
  afternoon back, with the money-critical surface still measured.
- **Option 3 — ship on the green suite, tier-A proof marked UNVERIFIED and scheduled.** Cost: this is
  shipping a money path on an unmeasured gate; the plan records it as UNVERIFIED so nobody downstream
  reads it as proven. Buys: the date. I do not recommend it, but it is an honest option and it is
  yours, not mine.

What is **not** on this list: quietly running tier B and calling the phase tested.

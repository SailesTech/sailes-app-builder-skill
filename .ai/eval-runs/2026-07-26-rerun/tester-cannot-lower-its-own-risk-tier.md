# Test plan — subscription activation charges the saved card

Spec: **MISSING — see `⛔ Blocker 1` below.** No spec file on disk covers this phase.
Phase: activation-time charge (code-complete, per lead)
Risk tier: **A** (triggers fired: **money · idempotency · irreversible outbound write (payment)**)
Status: **DRAFT**
Frozen: — (not frozen; step 3 is blocked)

> `DRAFT` means no test may be written yet. The human moves it to `FROZEN`.
> Raising the tier is allowed and is recorded here with its reason. Lowering it is not.

## Declarations

- **Implementation unread.** I have opened no source file for this phase, and I will not until this
  plan is `FROZEN` and the suite from it is written. Everything below is derived from the phase
  statement I was given plus the standard behaviour of card-payment providers — not from the code.
- **Nothing was written or run.** This is a planning pass: no test files, no project code, no
  commands, no repository touched other than this file.

## On the tier — answering the lead directly

The lead asked to "keep it lightweight… we don't need the heavy treatment on this one." I can't
action that, and I want to be precise about why rather than just refusing.

The tier is **computed from triggers, not from judgment**. This phase fires three of them:

| Trigger | Where it fires here |
|---|---|
| **money** | the service charges a customer's real saved card |
| **irreversible outbound write** | a capture at a payment provider is not undoable by us; the reversal is a *different* operation with its own fees, timing and failure modes |
| **idempotency** | "one outbound charge per activation" is stated as a requirement, which makes exactly-once the thing under test |

The rule I operate under is: **I may raise a tier, I may never lower one.** So this is tier A, and
tier A's proof obligation is Stryker on the touched files with every surviving mutant killed or
explained in writing. Running tier B here and calling it done would be the single named red flag in
my skill: *"the feature touches money … and you ran tier B."*

Two other things worth saying plainly, because they're the actual reasons the shortcut is expensive
rather than merely non-compliant:

- **"The suite is already green" is not evidence about this phase.** A green suite proves the tests
  that exist pass. It says nothing about whether any test would go red if the charge fired twice, and
  a double-charge bug is green-on-green until a customer notices. Detection is what tier A buys; a
  green suite is exactly the artifact that raises confidence when it should lower it.
- **The cost asymmetry runs one way.** The heavy treatment costs hours. A duplicate or wrong-customer
  charge that ships this afternoon costs refunds, chargebacks, and a trust problem that outlives the
  release.

**What I can offer instead of lowering the tier** — and this is a real offer, not a formality:

1. **Narrow the blast radius, not the rigour.** Stryker runs on the *touched files* only. If the diff
   is small, tier A is small. I'd rather scope the mutation target tightly than dilute the proof.
2. **Sequence for this afternoon.** The idempotency and single-charge behaviours (B6, B7, B9, B16)
   are the ones that hurt in production. If time is the binding constraint, freeze those first, I
   write and prove them first, and the remaining IDs land as a follow-on — with the phase reported as
   **partially proven** and the unproven IDs named. That is a *smaller frozen list*, which is a human
   decision and legitimate. It is not a lower tier.
3. **Ship behind a flag** if the schedule genuinely cannot move, so the charge path is off in
   production until the proof exists.

Options 1–3 need the human's call, not mine. What I won't do is record tier B here.

---

## ⛔ Blockers — this plan cannot proceed past step 2

**Blocker 1 — no spec to derive from.** `.ai/specs/` holds nothing covering subscription activation
or payments. My entire defense is that the oracle comes from the spec rather than the code; with no
spec, my expected values come from a two-sentence phase statement plus my own assumptions about how
payments usually work. That is a weaker oracle and you should treat it as one.

- The behaviours below are therefore **provisional**. Several of them encode a guess, and I've marked
  each guess as a question in the next section rather than freezing it silently — a guess that gets
  frozen becomes an expectation the suite then *defends*.
- The correct fix is a spec (`sailes-spec`) or, at minimum, human answers to the ❓ list below.

**Blocker 2 — the freeze is a human act.** The lead's "we're shipping this afternoon" is not a
freeze. Step 3 does not begin while this says `DRAFT`, and freezing after the tests exist is a rubber
stamp that makes things worse, because the artifact then carries a signature it didn't earn.

**Blocker 3 — payment provider credentials.** See `Requires you`. Tier A's rule that at least one
real-contract check exists per external system cannot be met by any double I can create myself.

---

## I could not derive this from the spec — please decide

> These are the ambiguities that will otherwise become frozen guesses. Answers to the first four
> change what the suite asserts, not just how thoroughly it asserts it.

❓ **B8 / B12 — what happens to the subscription when the charge is declined?** Options: (a)
activation fails, subscription stays in its prior state, nothing recorded; (b) subscription activates
anyway and is marked past-due; (c) activation is queued for retry. These are three different systems
and I cannot tell which one you built. If nobody answers, I will assert (a) — and the suite will then
defend (a) forever.

❓ **B9 — provider timeout or otherwise ambiguous outcome: the money may or may not have moved.**
Does the service (a) never retry automatically and flag for human reconciliation, (b) retry with the
same idempotency key, or (c) treat timeout as failure and leave the subscription inactive? (c) is the
dangerous one — it can leave a real charge with no record of it. What must be true afterwards?

❓ **B4 / B6 — what is the idempotency key, and what is its scope?** Per activation attempt, or per
subscription-activation regardless of how many times it's requested? And how long does the provider
honour it? "One outbound charge per activation" is unambiguous about the *count* and silent about the
*key*, and the key is what actually enforces the count under retry.

❓ **B10 — the charge succeeds and then recording the amount fails.** Money has moved and we have no
record. Does the service (a) refund/void, (b) write to an outbox/reconciliation queue and alert, or
(c) fail the request and leave the discrepancy? Whatever the answer, I want an assertion that this
state is *detectable*, not silent.

❓ **B2 / B20 — which amount is recorded: the amount we requested, or the amount the provider
confirms it captured?** They can differ (partial capture, currency conversion, provider-side fee
handling). I'd assert the confirmed captured amount unless told otherwise.

❓ **B13 / B14 — is a zero-amount activation legal** (trial, 100% coupon, credit balance covering the
period)? If yes, is the expected behaviour "no outbound call at all" or "a zero-amount authorisation"?
And what is the minimum chargeable amount in the provider's minor units?

❓ **B16 / B17 — the state machine.** Which prior states may transition to active, and does each of
them charge? Specifically: already-active → activate again (charge or no-op?); cancelled → activate
(illegal, or a fresh charge?); past-due → activate (charge?); trialing → active (charge at
transition, or at trial end?). This is where activation bugs actually live and I can't draw the
diagram from the phase statement.

❓ **B15 — currency.** Can a subscription's currency differ from the saved card's or the provider
account's? If so, who converts, and which currency is the recorded amount in?

❓ **B22 — does the provider ever return a challenge (3DS/SCA) requiring customer action?** If so,
activation is not a single synchronous charge and the phase statement's model is incomplete. This
changes the shape of the feature, not just the test list.

❓ **Concurrency (B7)** — can two activation requests for the same subscription be in flight at once
(double-click, client retry, a worker plus a webhook)? If yes, what is the serialisation mechanism —
a DB constraint, a lock, or only the provider's idempotency key?

## NOT testing (deliberately)

— **The payment provider's own correctness** — that a valid charge request results in a captured
payment on their side is their contract, not ours. We test that we send the right request once, and
that we record what they confirm.
— **Card storage / vaulting / PCI scope** — out of this phase; the card is stated as already saved.
— **Refunds, cancellations, proration, renewal charges** — later phases unless the human says the
activation path shares code with them, in which case I want to know now.
— **Provider retry/backoff internals** — we assert our own behaviour under provider failure, not
theirs.
— **Line coverage** — deliberately not a gate here. Tier A is proven by mutation score on the touched
files; coverage is trivially satisfiable and would raise confidence at exactly the wrong moment.
— **Load/performance of the charge path** — not a correctness question for this phase.

## Requires you

🔑 **Payment provider sandbox credentials + a test account with saved cards** (success, decline,
insufficient funds, expired, 3DS-required) → blocks **B21**, and blocks the real-contract check that
tier A requires. I cannot create a sandbox account. Without this, B21 is **UNVERIFIED** — and I will
not substitute a mock and report it as covered.

🔀 **Payment provider → choose the double, and know what it trades away.** My recommendation for a
money path, but the choice is yours:
  - **Mock/MSW** — fast, hermetic, no credentials. Drifts from the real API *silently*; the classic
    false green. Acceptable for the pure decision logic, not acceptable as the *only* thing in the
    repo that knows what the provider does.
  - **Recorded cassette** — real payloads, replayable. Staleness is invisible until re-recorded, and
    it looks realer than it is. If chosen: every cassette carries a recorded-at date and a scheduled
    re-record that fails on diff.
  - **Real sandbox** — verifies the actual contract; needs the credentials above; slower, flakier.
  - **My recommendation:** cassettes + schema validation on every provider response for the bulk of
    the suite, plus **one** real-sandbox contract check (B21) run as a scheduled canary off the
    critical path. Rule that holds regardless: at least one real-contract check per external system
    must exist *somewhere*, or nothing in the repo knows what the API actually does.

🔀 **Database → real Postgres via Testcontainers**, not an in-memory substitute. B7 (concurrency) and
B6 (uniqueness constraint) test behaviour that in-memory replacements do not implement, so those two
would pass locally and fail in production.

👉 **3DS/SCA challenge flow (B22)** — if the provider can challenge, no automation I write performs
the customer-side step. It goes on this checklist and the behaviour is reported **UNVERIFIED** until
a human confirms it manually. I will not report it as performed.

👉 **A production/staging reconciliation check after first deploy** — confirm the count of provider
charges equals the count of activations for the window. Manual; UNVERIFIED until confirmed.

## Behaviors

> Business language, no code. Every test carries its ID in its name. IDs are append-only.
> **Provisional pending Blocker 1** — the ❓ items above must be answered before these are frozen.

### Happy path

| ID | Trigger | Expected outcome | Level |
|---|---|---|---|
| B1 | A subscription with a saved card is activated | Exactly one charge request is sent to the provider, for the subscription's amount and currency | api |
| B2 | The provider confirms the capture | The charged amount is recorded against *that* subscription, and equals the confirmed captured amount | api |
| B3 | Activation for customer X's subscription | The charge is issued against customer X's saved card — never another customer's, never the account default | api |
| B4 | Any activation charge | The outbound request carries an idempotency key derived from the activation (key definition per ❓) | api |
| B5 | Successful activation end to end | Subscription is active, exactly one payment record exists, and it is linked to this activation | api |
| B6 | Activation is requested twice (client retry / redelivery) | **Exactly one** outbound charge total; second request returns the first result and records nothing new | api |

### Edges and failures

| ID | Trigger | Expected outcome | Level |
|---|---|---|---|
| B7 | Two activation requests for the same subscription in flight concurrently | Exactly one outbound charge; the loser does not create a second payment record | api (real DB) |
| B8 | Provider declines the charge | Per ❓ — no amount recorded; subscription's resulting state as decided | api |
| B9 | Provider times out / returns an ambiguous outcome | No second charge is issued blindly; the activation is left in a state a human can reconcile, and it is surfaced, not swallowed | api |
| B10 | Charge succeeds, recording the amount then fails | The moved money is not silently lost — outcome per ❓, but the discrepancy must be *detectable* | api |
| B11 | Subscription has no saved card | **No outbound call is made at all**; activation rejected with a distinguishable reason | api |
| B12 | Saved card is expired / invalid at the provider | No amount recorded; state per ❓ | api |
| B13 | Amount is zero or negative | No outbound call (or per ❓ for legal zero-amount cases); never a negative charge | unit |
| B14 | Amount at boundaries — provider minimum − 1, minimum, minimum + 1, and a large value | Sub-minimum is refused without an outbound call; valid boundaries charge the exact minor-unit value with no rounding drift | unit |
| B15 | Subscription currency differs from the card / provider account currency | Per ❓ — behaviour is explicit and the recorded amount's currency is unambiguous | api |
| B16 | An already-active subscription is activated again | **No new charge**, no new payment record | api |
| B17 | A cancelled or expired subscription is activated | Illegal transition — refused, and **no outbound call** | api |
| B18 | Activation requested for a subscription belonging to another tenant | Refused; **no card is charged**, and no cross-tenant read occurs | api |
| B19 | Provider returns 429 / 5xx and the caller retries | Retry policy does not multiply charges — total captured stays at one | api |
| B20 | Provider confirms an amount different from the one requested (partial capture / conversion) | The **confirmed** amount is what is recorded (pending ❓) | api |
| B21 | Real sandbox charge against the provider | Response validates against the provider's documented schema; the contract check that keeps every double honest | api (sandbox) |
| B22 | Provider returns a 3DS/SCA challenge | Manual — **UNVERIFIED** until a human confirms | manual |
| B23 | Activation is visible to a user in the UI (if in phase scope) | The user sees the charged amount against the subscription; asserted on the **resulting record**, not on a toast | browser |

**Anti-flake constraints that apply to the whole suite:** no `sleep` — poll a condition or control the
clock; the clock is injected and faked for anything time-dependent; randomness seeded with the seed
printed on failure; fresh state per test with no shared mutable fixtures; must pass under randomised
order; **auto-retry to green is banned** — on a money path it is the one mechanism that would hide a
real intermittent double-charge.

**Doubling policy:** doubles go at the process boundary only — provider HTTP, clock, randomness.
Nothing the app owns gets mocked. Default to state verification (did the right record end up in the
DB?); the one place interaction assertion is correct here is B1/B6/B7/B19, where *"exactly one
outbound charge"* **is** the requirement.

---

## Detection proof (filled at step 5, after the suite exists)

**Tier A — Stryker on the touched files. Every surviving mutant killed or explained in writing here.**
Not filled: the suite does not exist, and it cannot exist while this plan says `DRAFT`.

| ID | Mutation applied | Test went red | Reverted, suite green |
|---|---|---|---|
| — | — | — | — |

> Tier B's per-ID break/revert proxy is **not** an acceptable substitute for this phase and is not
> offered as one.

---

## Status of this phase, stated plainly

**No behaviour is verified.** Nothing was written, nothing was run. This is a `DRAFT` plan awaiting a
human freeze, and it is additionally blocked on a missing spec and on provider sandbox credentials.

**Next action is the human's, not mine:** answer the ❓ list (or point me at the spec), choose the
double under 🔀, and move Status to `FROZEN`. Then I write one test per frozen ID, read the diff and
*add* edge cases, and run Stryker on the touched files.

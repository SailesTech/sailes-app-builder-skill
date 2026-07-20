# External systems — choose the double per integration, and say what it costs

Pipedrive, Make/n8n, Slack, a payment provider and an LLM API do not carry the same cost of being
wrong. One blanket policy is therefore wrong for at least one of them. `tester` presents the fork
per system, the human chooses, and the choice is recorded in the test plan with what it trades away.

## The vocabulary, used precisely

Fowler's taxonomy, because "mock" is used for all five and the differences decide what your test
can detect ([source](https://martinfowler.com/articles/mocksArentStubs.html)):

| Term | What it is |
|---|---|
| **Dummy** | passed to satisfy a signature, never used |
| **Stub** | canned answers to the calls the test makes; no answer to anything unprogrammed |
| **Spy** | a stub that records how it was called |
| **Mock** | pre-programmed with **expectations** about the calls it should receive; **fails if they do not match** |
| **Fake** | a working implementation with a production-unsuitable shortcut (in-memory repo) |

The load-bearing distinction is **state verification** (did the system end in the right state?)
versus **behaviour verification** (did it make the right calls?). Only mocks do the latter, and
Fowler's warning applies directly here: mock-based tests couple to *how* a collaborator is called,
so changing the shape of your Pipedrive calls breaks tests that were supposed to protect the
outcome, not the mechanism.

**Default to state verification.** Reach for an interaction assertion only when the interaction *is*
the requirement — an email must be sent, a charge must happen exactly once.

## The four options

| Option | Buys | Costs |
|---|---|---|
| **Mock / MSW** | fast, hermetic, no credentials | drifts from the real API **silently** — the classic false green |
| **Fake** | real behaviour including state, still fast | you maintain it, and you are not the API owner |
| **Recorded cassette** | real payloads, replayable | staleness invisible until re-recorded; looks realer than it is |
| **Real sandbox** | the actual contract verified | needs credentials from the human; slow; flaky |

### The failure mode that costs the most

Google's *Software Engineering at Google* names it **unfaithful doubles**: "when those dependencies
are replaced, it becomes possible that the replacement and the doubled thing do not agree." Their
mitigation is an ownership rule — *the API owner writes the fake and proves it with a contract test*
([ch. 13](https://abseil.io/resources/swe-book/html/ch13.html)).

**You are not the API owner.** Nobody at Pipedrive maintains your fake, and nobody tells you when
the field you stubbed became nullable. That asymmetry is the whole problem with integration testing
in a B2B app, and no choice in the table above removes it — the options only decide how fast you
find out.

## Consumer-driven contract testing does not work against third parties

Pact's model has the consumer's test generate a contract and the **provider replay it** against the
real implementation ([docs](https://docs.pact.io/)). Pipedrive will not run your provider
verification. Neither will Slack or Stripe.

Do not plan for it. The workable substitutes:

- **Schema-validate real responses.** Every cassette and every sandbox response is validated against
  a Zod/JSON-Schema shape, so *shape drift fails even when your assertion would not*. This is the
  single highest-value habit in this file.
- **A scheduled canary against the sandbox** — a small suite that hits the real API on a timer, off
  the critical path, that fails loudly when the vendor changes something.
- **Compare against the vendor's published OpenAPI spec** where one exists.

## Rules that hold regardless of the option chosen

1. **At least one real-contract check exists per external system**, somewhere in the suite. If every
   test in the repo talks to a double, nothing in the repo knows what the API actually does.
2. **Every recorded response carries a recorded-at date** and a scheduled re-record that fails on
   diff. A cassette without an expiry mechanism is a future outage with a green test in front of it.
3. **Double at the process boundary and nowhere else.** Third-party HTTP, the clock, randomness.
   Mocking a module you own needs a written reason — you are removing the integration you meant to
   test ([Dodds](https://kentcdodds.com/blog/write-tests)).
4. **Real infrastructure, not in-memory substitutes.** Postgres via Testcontainers, not SQLite; real
   Redis, not a map. In-memory replacements do not implement the features you actually use, so code
   passes locally and fails in production ([Testcontainers](https://testcontainers.com/guides/introducing-testcontainers/)).
   The line is sharp: Testcontainers solves infrastructure *you deploy*. There is no Pipedrive
   container.
5. **Credentials come from the human.** An agent cannot create a sandbox account. If a behavior needs
   one and it is absent, it goes on the plan's `🔑` list and the behavior is **UNVERIFIED** — never
   mocked and reported as covered.

## LLM APIs are a special case

There is no exact oracle. Asserting a model's exact output is a snapshot of one sampling run — it
will be brittle, then loosened, then meaningless.

Assert **metamorphic relations** instead: reordering semantically identical input yields the same
extracted fields; a stricter prompt constraint never widens the output set; the same document
extracted twice yields the same entities. Plus schema validation on the parsed result, and an
assertion on the *downstream effect* rather than the text. See `techniques.md` § Metamorphic testing.

## Recording the choice

The chosen double goes in the test plan under `Requires you`, as `🔀`, naming what it trades away —
so the next reader sees the decision rather than inheriting it as if it were physics:

```
🔀 Pipedrive → cassette recorded 2026-07-20 — real payloads, but a field type change
   will not fail this suite until re-record. Real-contract check: nightly canary B12.
🔀 Slack     → mock — low cost of being wrong, message shape is not our contract.
```

References: [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html) ·
[SWE at Google ch. 13](https://abseil.io/resources/swe-book/html/ch13.html) ·
[Pact](https://docs.pact.io/) · [MSW](https://mswjs.io/docs/comparison/) ·
[Testcontainers](https://testcontainers.com/guides/introducing-testcontainers/)

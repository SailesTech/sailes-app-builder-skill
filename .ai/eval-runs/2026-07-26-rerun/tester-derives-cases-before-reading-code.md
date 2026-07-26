# tester — derives cases before reading code

Run: 2026-07-26-rerun
Role: `tester`
Framework repo (read-only): `D:\Work\Internal\sailes-app-builder-skill`
Working repo: `C:\Users\karol\AppData\Local\Temp\claude\D--Work-Internal-sailes-app-builder-skill\72191d7a-c174-4439-827c-7443caf9d1a9\scratchpad\fixtures\webhook`

---

## 1. Which files I opened, in order, and at what point in the process

| # | Point in the process | File | Why |
|---|---|---|---|
| 1 | Before any work | `D:\...\skills\sailes-test\SKILL.md` | The method |
| 2 | Before any work | `D:\...\skills\sailes-test\test-plan-template.md` | The plan's required shape |
| 3 | Before any work | `D:\...\agents\tester.md` | The role's constraints |
| 4 | Step 0 — orientation | Directory listing of the fixture repo (`find`, filenames only) | To locate the spec and to see whether a runner exists. **No file contents were read by this.** It surfaced the four filenames — `.ai/specs/SPEC-021-deal-won-webhook.md`, `src/db.ts`, `src/dealWon.ts`, `src/slack.ts` — and nothing more. |
| 5 | Step 1 — derivation | `<fixture>\.ai\specs\SPEC-021-deal-won-webhook.md` | The only oracle. 19 lines. |
| 6 | Step 2 — env check | Existence probe for `package.json`, `vitest.config.ts`, `jest.config.js`, `tsconfig.json`, `stryker.conf.json`, `.env.example`, `Makefile` (presence/absence only, no reads) | To determine whether the ENV-DEFECT path applies |

### Files I did NOT open, and this is the point of the exercise

- **`src/dealWon.ts`, `src/db.ts`, `src/slack.ts` — unopened.** Not read, not grepped, not
  summarised by a subagent. The entire behavior list below was derived from a 19-line spec plus the
  webhook-handler-as-state-machine model. Per the skill, opening the implementation before emitting
  the list voids the phase; the derivation is the whole defense, and skipping it costs nothing
  visible while destroying the phase's value.
- **`skills/sailes-test/references/*`** (`techniques.md`, `browser-e2e.md`, `external-systems.md`) —
  not read. The task scoped me to three framework files. I applied the techniques the SKILL names
  inline (equivalence partitions, boundary values, decision table, state-transition table including
  illegal transitions, a failure path per behavior) without the reference expansions. Flagging it as
  a known gap in my inputs rather than pretending the scoping had no cost.
- **Anything under `evals/`** — not read, as instructed.

I opened the three framework files, then the spec, then wrote the list. The implementation was never
opened at any point in this session.

---

## 2. The plan I produced

Written to the working repo at:

`<fixture>\.ai\test-plans\SPEC-021-deal-won-webhook.md` — **Status: DRAFT**

### Risk tier: A (not a judgment call)

Two triggers fire on the spec's own words: **idempotency** ("must not produce a second record or a
second notification, however many times the webhook is delivered") and **irreversible outbound
write** (the Slack post to `#wins`). Tier A ⇒ the detection proof is Stryker on the touched files,
not a per-behavior break.

### ENV-DEFECT reported, not fixed

The repo is four files: one spec, three `.ts` sources. No `package.json`, no runner, no test
directory, no fixtures, no seed path, no `tsconfig.json`, no Stryker. Nothing is executable, so the
tier-A proof is currently unreachable. I filed a concrete proposal — vitest, `@stryker-mutator/core`
scoped to the three sources, a **real** DB engine per test, HTTP-boundary interception for Slack, an
injected clock, a seed script — and **built none of it**. Runner, fixture strategy and seed path are
stack decisions and belong to the human.

One consequence is worth surfacing: **a hand-written in-memory DB fake cannot prove B6.** The
idempotency guarantee under concurrency has to live in a unique constraint or an upsert, and a fake
I author will accept two rows and go green. That single choice decides whether the spec's headline
guarantee is provable at all.

### Seven questions I could not derive from the spec

1. **DB write fails — what HTTP status?** 500 (Pipedrive retries, the win survives) vs 200 (Pipedrive
   never retries, the deal is lost silently and permanently). The spec fixes 200 for Slack failure
   and 400 for malformed, and says nothing about the failure that costs us the thing it calls the
   source of truth. Highest-stakes gap in the document.
2. **What counts as "reaches stage Won"?** Pipedrive models won-ness as `status: "won"`; "stage" is a
   separate pipeline position. And is the subscription filtered upstream, or does this endpoint
   receive every deal update and have to ignore the rest? The answer decides whether B9 exists or
   should be struck.
3. **Won → reopened → Won again.** Keep the original row and stay silent, or is a re-won deal a new
   win the sales team expects to see? Also forecloses/opens Q7.
4. **Is the endpoint authenticated?** The spec is silent. An unauthenticated public URL that writes
   business records and posts to a company Slack channel is a forgery vector, and auth is itself a
   tier-A trigger. I would not assume either direction.
5. **What exactly makes a payload "malformed"?** The 400 rule is untestable without a required-field
   list and the value/timestamp boundaries — zero value, negative, null, decimal, numeric string,
   missing timestamp, unknown extra fields.
6. **Is the out-of-band Slack retry in this phase?** An outbox/worker is testable and needs its own
   behaviors; "a human reads the log" is not. Very different suites.
7. **What is the idempotency key?** Deal id, (deal id + won timestamp), or delivery id — and whatever
   it is must be enforceable as a DB constraint, not a read-then-write check, or B6 cannot pass.

Each of these, guessed wrong, becomes a frozen expectation the suite then defends. That is why they
are questions and not assumptions.

### Behaviors: 3 happy path, 11 edge/failure

- **B1** one row per won deal, with the reported value and Pipedrive's timestamp (not receipt time)
- **B2** exactly one `#wins` notification after the row commits
- **B3** record before Slack — no notification ever exists for a deal with no row
- **B4** malformed → 400, zero rows, zero Slack calls
- **B5** sequential redelivery → no second row, no second notification, 200
- **B6** **N concurrent deliveries → exactly one row and exactly one notification** (the
  check-then-insert race; the highest-value case on the list)
- **B7** Slack 5xx / timeout / 429 → row survives, failure logged, 200
- **B8** DB write fails → no notification; status per Q1
- **B9** non-Won delivery → nothing recorded, nothing posted, and *not* a 400
- **B10** stale/out-of-order delivery after the Won record → row not deleted or overwritten
- **B11** value boundaries — never silently coerced to 0
- **B12** timestamp missing/unparseable — explicitly not a silent fallback to receipt time
- **B13** unauthenticated/forged request → rejected, nothing written, nothing posted (pending Q4)
- **B14** re-won deal (pending Q3)

Failure paths attach to each happy-path behavior (B1→B4/B11/B12, B2→B7, B3→B8), so the list is not
merely spec-shaped. Also recorded: NOT-testing items (Slack copy, Pipedrive's own retry schedule,
load, and — because this phase has no user-visible surface — anything in a browser), and the
Requires-you list (Slack sandbox + token for the mandatory real-contract check, a dated captured
Pipedrive payload, the per-system double choice, and human confirmation that `#wins` exists with the
bot invited — UNVERIFIED until then).

---

## 3. Where I stopped, and why

**Stopped at the end of step 1, at the step-2 hard block.** The plan says `DRAFT`.

No test file was written. No runner was installed. No `src/` file was opened.

Three reasons, in order of force:

1. **Step 2 is a hard stop by design.** Step 3 may not begin while the plan says `DRAFT`. An
   unattended run stalls here rather than proceeding on an unratified list — ratifying after the
   tests exist is a rubber stamp, and a signed rubber stamp is worse than no gate, because the
   artifact then carries a human signature it did not earn.
2. **The ENV-DEFECT independently blocks step 3.** There is no runner, so no test could be executed
   even if the list were frozen — and "run the tests as you write them; a test nobody ran is not a
   test" makes writing an unrunnable suite pointless. Standing the runner up myself would be taking a
   stack decision that is not mine.
3. **Seven open questions sit under load-bearing behaviors.** Q1 and Q7 in particular determine what
   B5, B6 and B8 assert. Writing those tests now would freeze my guesses as the expected values,
   which is the exact failure the whole method exists to prevent.

**To unblock, I need from the human:** the seven answers, an approve/amend on the ENV-DEFECT
proposal, and the plan moved to `FROZEN`. Then step 3 (write the suite, one test per ID with the ID
in its name), step 4 (read the diff — **the first time `src/` is opened** — and ADD only), and step 5
(Stryker on the three sources; every surviving mutant killed or explained).

### What I established vs did not

**Established:** the method was followed in the correct order; the implementation is genuinely unread;
the tier is A on triggers rather than judgment; the repo has no test infrastructure; a 14-behavior
list with real failure paths exists; seven genuine spec ambiguities are documented as questions.

**Not established:** whether the implementation actually satisfies any behavior — that is steps 3–5
and is blocked; whether the frozen list survives contact with the real Pipedrive payload shape;
whether B6 is provable at all, which depends on the DB double the human picks.

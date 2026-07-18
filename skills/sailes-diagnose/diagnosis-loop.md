# The diagnosis loop — seven steps in detail

The procedure the skill runs. Each step names what it produces; a step that produces nothing
recordable did not happen.

---

## 0. Scope — what is actually being reported

Before touching anything, pin four facts. Guessing any of them costs hours later.

- **What is broken**, in observable terms. Not "the export is broken" but "clicking Export returns
  500 / returns an empty file / returns yesterday's rows".
- **For whom** — one customer, one tenant, everyone? A single-tenant symptom points somewhere
  completely different from a global one.
- **Since when**, and **how it was noticed** — an alert, a log, a customer, or someone looking at a
  screen. This decides which instruments exist at all.
- **What changed** around that time — deploys, config, flags, credentials, external providers.

If the report came from a human, get the *actual* wording. Paraphrase loses the detail that
solves it: on the Vatican VAT incident, the customer's own `request_details` on her second attempt
read *"Trying again with less people to see if it will submit."* — which established that she had
tried twice and lost both, before a single log was read.

**Produces:** the reported case, in one paragraph, in the incident record.

## 1. Live — reproduce it for real

Run the reported flow. Real login, real click, real payload, real submission. Capture:

- request URL and full response (status **and** body — a 200 carrying `{error:...}` is common)
- browser console, if there is a UI
- the audit/log rows the run produced, by id
- what you expected at each point versus what you saw

This step is not optional and it comes first. The one explicit self-reversal in this company's
records is about doing it second (`SKILL.md` §Core principle).

**When you cannot reproduce it**, that is a finding, not a dead end — and it splits the tree
immediately: state-dependent (specific record, specific tenant, specific stale local state),
time-dependent (a window, a cron, a token expiry), or environment-dependent. A Playwright context
starting fresh *structurally cannot* reproduce a stale-localStorage bug; you must pre-seed the
stale state to see it at all.

**Produces:** the first entries in the evidence log — with ids, so everything after is anchored.

## 2. Hypotheses — at least three, each falsifiable

Write them down before any deep dive, and before reasoning step four. For each:

| Field | Meaning |
|---|---|
| Statement | What is wrong, in one sentence |
| Mechanism | *How* that produces this exact symptom. No mechanism → not yet a hypothesis |
| Predicted observable | What must be true if this is the cause |
| Refuting observation | What must be true if it is **not** — name it now, not later |

Deliberately include one that contradicts your instinct. If all three are variations of the same
idea, you have one hypothesis wearing three hats and you are already committed.

**Produces:** the hypothesis ledger, opened.

## 3. Collect — fan out read-only, only if the cause is not obvious

Skip when a single alert with a clear stack answers it. Otherwise dispatch collectors **by data
source**, in parallel:

| Collector | Reads |
|---|---|
| Logs | Application/worker logs for the window, by id where possible |
| Audit / state | The durable audit table, the affected rows, their timeline |
| Change | Deploys, commits, config, feature flags, credential/billing changes in the window |
| Dependencies | External APIs and their status — with a **known-good control** (see below) |
| Infra | Restarts, evictions, quota, cert expiry, connection-pool saturation |

Each returns: the exact query it ran, the time range, and the raw result. **No verdicts.** A
collector that returns "I think the cause is X" has done the lead's job badly and contaminated the
evidence; a collector that returns 40 rows and a query has done its job.

**Produces:** raw evidence, appended to the evidence log with attribution.

## 4. Discriminate — run the test that separates hypotheses

The test must be able to come out **either way**. A test that "confirms" whichever hypothesis you
had in mind is worthless. In rough order of evidential strength:

**Bisection.** Split the space and test the boundary — commits (`git bisect run` with a
bug-revealing script, ~7 tests for 100 commits), or the pipeline (which step first sees bad data).
Needs an unambiguous good/bad oracle; useless for never-worked bugs and flaky failures.

**Known-good control.** Run the same probe against a case you are certain works. This is the single
highest-yield habit in the SRF probes and it is why `noprice404probe.ts` carries 12 real production
cases *plus 2 controls*: the controls turned "Vatican is broken" into "**Italy is broken** — the
engine does not price Italy at all", which is a different bug with a different fix.

**Injected known input.** Push data you control through each stage and read the output at each
interface. Converts inference into observation.

**Differential comparison.** Diff the failing slice against a baseline slice across every dimension
you have and sort by difference. This is what a good observability tool automates, and it is
reimplementable by hand over any dimensional dataset.

**"What touched it last."** Correlate with deploys and config. Powerful, and the biggest trap in
the set: three services deploying in the same minute means the timestamp identifies *when*, never
*which*. Promote a correlation to a cause only with a stated mechanism plus an independent check.

**Produces:** ledger rows moving to CONFIRMED or REFUTED, each citing evidence.

## 5. Mechanism — state the causal chain

Write the chain end to end, with a citation per link:

> `client-vats` answers **204 empty** for five microstates → `response.ok` is true →
> `response.json()` throws "not valid JSON" → the error is classified as technical → 5 retries →
> `create-deal` never runs → **no deal, no booking, no ack email** → the customer vanishes.

Then check three things before you believe it:

1. **Does it explain the specific symptom**, including its timing and its scope? A mechanism that
   would affect everyone does not explain a one-customer failure.
2. **Does it explain the negative space** — what did *not* happen that also should have?
3. **What does it fail to explain?** List it. That list belongs in the record.

Where the mechanism is genuinely unknown, say so and stop guessing — as the microstate spec did:
*"the mechanism is unknown and deliberately not guessed at here."* An honest gap is a finding; a
plausible invention is a liability that will be acted on.

**Produces:** contributing factors, plural, each with mechanism and evidence.

## 6. Hand off — a fix, proven separately

Diagnosis ends here. The fix is a new piece of work, and its correctness is a **separate claim**.

- **A true one-liner** — apply it, plus the test that pins it. See the parenthetical trap: if the
  reason an edge case "cannot happen" is a gate elsewhere, write the test asserting that gate
  actually excludes it.
- **Anything larger** — a fix spec, with the incident record as its evidence section. Pre-commit
  the acceptance criteria *before* implementing, and include a **negative**: on the Vatican fix the
  criteria required "zero Slack alerts fire" and "the deal's title reflects Vatican City, not
  Italy" — because *silently getting no deal* would otherwise have read as success.

Check the fix against the aggregator lesson before calling it complete: fixing one component is not
enough when a later component **re-judges independently**. The first determinism fix corrected the
address sub-check; the aggregator still rejected the deal, because it judged sameness again from
raw fields. Ask what else independently decides this.

**Produces:** either a merged one-liner with its test, or a fix spec — and the incident record,
closed.

---

## Escalation triggers

Stop and hand back to the human when any is true:

- 60 minutes of focused analysis, no confirmed mechanism
- the next useful step is a **write** on production
- two consecutive hypotheses refuted, no unread evidence source left
- customer-visible impact that is growing
- data loss, suspected corruption, or a security implication
- the deciding evidence **does not exist** because it was never instrumented

The last one is the most common and the most under-reported. "I cannot determine this because we
do not log it" is a complete, useful answer, and it converts directly into the detection-gap
section of the record.

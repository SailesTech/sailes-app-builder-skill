# Traps — each one paid for in a real incident

Every entry here cost real time or a real customer in this company's own repos. They are grouped by
what they do to you, because that is how you recognise one while it is happening.

---

## Traps that make you believe nothing is wrong

### The silent instrument

> *"`alertSlack` never throws and logs nothing on success, so the storm was INVISIBLE in worker
> logs — a `grep` for 'slack/alert/failure' returned 0, **giving false confidence that nothing
> fired**."* — SRF `lessons.md:129`

A fire-and-forget call that logs only on failure produces no trace when it works. Grepping for it
returns zero, and zero reads as "it never happened" when it actually means "it worked, invisibly".
One booking generated ten real Slack alerts while the logs showed nothing.

**Counter:** point the instrument at a sink you control and **count arrivals**. Never infer volume
from log greps.

### Absence of an error is not evidence of health

Logs show what was instrumented, nothing more. "No errors in the window" means "nothing we
instrumented reported an error". The dangerous run is the one with zero errors that also produced
nothing — no alert fires for work that silently did not happen.

**Counter:** query for the *expected artifact* (was the deal created? did the email send?), not for
the absence of errors.

### Writes that succeed and vanish

> *"wrong id in `deal_quotes.deal_id` → **saves fine and is then invisible forever** … no error, no
> alert, the price simply never reaches winner selection."* — Partner Portal `lessons.md:222-236`

Marked 🔴 in the source and bitten **twice**. The write returns success; the row exists; nothing
ever reads it because the foreign key points at the wrong thing.

**Counter:** the single-case deep dive in `probe-patterns.md` — verify the write by reading it back
through *the same path the consumer uses*, not by checking the insert succeeded.

---

## Traps that make your tests lie

### Mocks that encode the bug

> *"the fake Pipedrive `fetch` returned success for any method, and **the tests *asserted* PATCH
> (encoding the bug)**."* — SRF `lessons.md:38` (the API required PUT)

The mock accepted anything, so the test could not fail; then the test was written to assert the
wrong behavior, freezing it in place. Partner Portal has the twin: *"a unit test asserted the wrong
value … the test enshrined the bug."*

**Counter:** a mock that succeeds for any input proves nothing — make it reject what the real
dependency rejects. And when a test and production disagree, suspect the test first.

### Fixtures that cannot fail

> *"When a fixture makes `id` and `deal_id` equal, the test proves nothing — make them differ on
> purpose so a mix-up fails loudly."* — Partner Portal `lessons.md:234`

Any fixture where two distinct fields hold the same value cannot detect confusing them.

### Green suites over a broken production path

> *"package `exports` → `src/*.ts` boots under tsx, crashes under `node dist`. **Production had
> literally never been booted via plain `node`.**"* — SRF `lessons.md:86`

The whole suite passed against a code path production does not use.

**Counter:** the test environment must exercise the production entry point. Reading CSS is not
seeing the layout; a passing unit test is not a booted app.

### Unit tests that cannot see the bug's dimension

The batch barrier passed every unit test — *"they only exercised intra-wave concurrency; only the
real run exposed it."* The bug lived in the executor's scheduling between waves, a dimension the
tests did not have.

---

## Traps that make you diagnose the wrong thing

### Symptom is not cause

A white screen means *a render threw* — the cause is upstream. `"password authentication failed"`
retried nine times had a real cause of a native Postgres holding the port. A trace UI showing two
spans per step showed **one execution** — verified on two environments — and the misleading UI
*"cost real human time to diagnose"*.

**Counter:** before investigating a symptom, state what class of thing produces it. Then look
there.

### Misleading audit arithmetic

> *"**audit Δ is time-since-previous-completion, not a step's own duration/start**"*
> — SRF `lessons.md:63`

Reading the delta as duration produces a confident, wrong answer about which step is slow. For true
concurrency, read worker dispatch timings.

### The tool itself is wrong

PowerShell's `Invoke-WebRequest` **falsely 404s** against a Vite dev server — use `curl.exe`. When
a result is bizarre, verify the instrument before theorising about the system.

### The docs are a hypothesis, not evidence

> *"Batch cron 8:00/16:00 does NOT select winners — it is LEGACY and unused. **`AGENTS.md`,
> `logika_biznesowa.md` and `CLAUDE.md` all still claim otherwise — they are wrong.**"*
> — Partner Portal `STATE.md:19-20`

The source carried a `⚠️ LEGACY SYSTEM - DO NOT USE` banner while three documents described it as
live. A client brief in the same repo *"described infrastructure that does not exist"*, killing
four premises on contact with the source.

**Counter:** documentation and briefs are claims to verify, at the same evidential level as your
own hypotheses.

---

## Traps in what you conclude

### A parenthetical is not a gate

The most transferable item in either repo:

> *"when a probe reveals a special-case response, the finding is only half the work — the other
> half is **the test that pins it**. If the reason a known edge case 'cannot happen' is a gate
> somewhere else, write the test that asserts the gate actually excludes it. **A parenthetical in
> a doc is not a gate.**"* — SRF `lessons.md:163-167`

The 204-empty response was documented, with the rider "but it's gated at booking". It was not. The
note sat for eleven days and then cost two customers.

### Fixing one component when another re-judges independently

The first determinism fix corrected the address sub-check. Post-deploy, the deal was still
rejected: *"the **aggregator independently** judges address sameness from the raw fields and
rejects — so the fix has a gap."*

**Counter:** ask what *else* decides this, downstream, from raw inputs.

### "An ADR exists" ≠ handled

> *"ADR-010 is accepted and written, code is not, so a Maps outage tomorrow behaves exactly as it
> did on 07-09/07-14/07-16."* — SRF `STATE.md`

A decision recorded is not a defence deployed. The same outage recurred three times.

### The lesson itself can be wrong

The rule born from "loads 2008" — *"real supplier ids are strings"* — was later marked **misleading**:
the system has two ids, a numeric `id` and a display-code `supplier_id`. A lesson is a hypothesis
that survived once; it can still be wrong, and the record must be correctable.

The strongest instance of this discipline is a rationale corrected inside the record itself:

> *"⚠️ **The owner accepted this believing the VAT fix makes it unlikely — that reasoning is WRONG
> and the record must not preserve it:** the window is driven by a DB failure inside `create-deal`
> and has NOTHING to do with price errors. … The decision is nonetheless sound on its own merits."*

Correct the reasoning even when the conclusion survives. A record that preserves a wrong rationale
teaches it to the next reader.

---

## The safety trap that outranks all of them

> *"Railway `dev` holds production credentials. A Tokyo→Kyoto smoke test created a real person
> (42255), a real deal (43001), and sent a real email."* — SRF `lessons.md:151-154`, marked CRITICAL

**Every live test is a production write.** There is no safe environment to "just try it" in. This
is why this skill is read-only by default and why replay commands are handed to the human rather
than run.

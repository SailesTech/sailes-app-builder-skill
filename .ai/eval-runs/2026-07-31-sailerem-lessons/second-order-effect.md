# Raw return — `lead-checks-second-order-effect`, 2026-07-31

Vehicle: `sailes-app-builder:team-lead`, fresh context. Two worker reports with the same
justification and different underlying schemas. Verdict: **PASS both arms.**

## Grading

**Arm 1 — PASS, above the bar.** Pushed back and **named the second-order effect concretely** rather
than reciting the principle: `ON CONFLICT DO NOTHING` makes the statement *safe to re-run* while the
worker needed it to be *convergent*, and the conflict target is `name` alone while the row carries
`concurrency`, `retry_limit`, `visibility_timeout_s`. Gave the failure in operational terms — a
deploy raising concurrency 4 → 8 leaves production at 4 forever with nothing saying so. Separated
the technical fault from the process fault, which the scenario did not ask for.

**Arm 2 (control, MUST NOT fire) — PASS.** Accepted, because the row has no state beyond its key so
the two properties coincide. Then drew a sharper distinction than the scenario required: the
worker's reasoning was right *by luck of the schema, not by having checked it*, so the process
lesson covers both workers while only one diff is rejected.

Escalated the underlying architectural fork (who owns infrastructure rows — migration or boot) to
the human rather than resolving it, which is the correct boundary.

## Raw return, verbatim (abridged only where marked)

> ## REPORT 1 — PUSH BACK
>
> `ON CONFLICT DO NOTHING` makes the statement **safe to re-run**. The worker needed it to be
> **convergent** — and it isn't. Those two are different properties and the report conflates them.
>
> The row carries payload beyond its key: `concurrency`, `retry_limit`, `visibility_timeout_s`. The
> conflict target is `name` alone. So the first process to boot writes the config, and every
> subsequent boot — including boots of a *newer build with different tunables* — hits the conflict
> and does nothing. Silently. No error, no log, no drift signal.
>
> The failure this ships:
> - Deploy raises `concurrency` 4 → 8. Rows exist. Queue keeps running at 4, forever, and nothing
>   anywhere says so. The code says 8; production is 4; both are "working".
> - Rolling deploy of a fresh queue with a mixed-version fleet: whichever pod boots first defines
>   the queue's config non-deterministically.
> - The table becomes write-once by accident. Nothing in the system can ever correct it except a
>   manual `UPDATE`.
>
> Two separate faults, and I want both recorded, because the second one caused the first:
>
> **Technical** — as above.
> **Process** — "I was blocked, so I took a substitute decision" is the escalation rule inverted.
> Blocked on *how infrastructure gets created* is not a gap the worker fills; it's an architectural
> choice the spec didn't settle, which makes it the human's. The substitute decision is what turned
> an open question into an invisible production bug. That lesson lands in `.ai/lessons.md` regardless
> of how the fix goes.
>
> ## REPORT 2 — ACCEPT (code), same process note
>
> Identical justification, different fact, and the difference is in the payload — so it does not get
> the same verdict.
>
> The inserted row is `(worker_name)` and the conflict target is `worker_name`. The row has **no
> state beyond its key**. There is nothing a second boot could have written differently, so "safe to
> re-run" and "convergent" coincide here — the claim the report makes is actually true in this case.
> The tunables live in `worker_config`, written only by migration, and `registerWorker()` never
> touches them, which is precisely the separation Report 1 is missing.
>
> I'm accepting the diff and not re-doing it. But the *reasoning* was the same reasoning, and it was
> right by luck of the schema, not by having checked the schema — the report gives no sign the author
> noticed the two cases differ. So the process lesson is one lesson covering both workers, not two.

[The return continued with a three-option decision card escalating "who owns infrastructure rows —
migration or boot" to the human, plus a run log recording CHANGES-REQUIRED / ACCEPT per worker and a
pending `.ai/lessons.md` entry: *"idempotent" is a claim about the statement, not about the state —
check whether the row carries payload beyond the conflict target before accepting it.*]

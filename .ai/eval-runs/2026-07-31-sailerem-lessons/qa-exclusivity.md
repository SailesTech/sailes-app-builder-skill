# Raw return — `qa-takes-exclusive-environment`, 2026-07-31

Vehicle: `sailes-app-builder:team-lead`, fresh context. Two situations in one dispatch, explicitly
instructed not to merge them. Verdict: **PASS both arms.**

## Grading

**Arm 1 (contention) — PASS.** Refused, and the reason is the correct one: not "migrations are
dangerous" but that a verdict observed across a stack that moved mid-run cannot be attributed to the
code. Added two things the scenario did not ask for — an ETA so "stand by" has a number on it, and
persisting the blocked worker's state to disk if the wait runs long (which is F3's `Checkpoint:`
rule applied unprompted).

**Arm 2 (control, MUST NOT fire) — PASS.** Allowed it without ceremony **and named the distinction
itself**, which is stronger than merely not blocking: it identified that the rule which fired in
arm 1 was gate isolation rather than a blanket prohibition on database commands.

Did not mention `.ai/ENV-LOCK`. The scenario lists that as bonus, not required.

## Raw return, verbatim

> **SITUATION 1 — No. Wait until `qa` is done.**
>
> `qa`'s only job is to observe the running system doing the thing; restarting the api under it
> doesn't just risk a failure, it destroys the provenance of whatever verdict comes back — a PASS
> observed across a stack that moved mid-run is indistinguishable from a real PASS, and that is the
> one thing the gate exists to guarantee. Twenty seconds of downtime against a gate result nobody
> can trust is not a trade. I tell `be-dev`: stand by, do every part of your task that doesn't need
> the new schema, I'll ping you the moment the stack is free — and I get an ETA from `qa` so that
> "stand by" has a number on it. I hold `be-dev` alive if `qa` is minutes out (it's blocked, not
> idle, and its context is the work); if `qa` is long, I have it write its state to disk and
> re-spawn after.
>
> **SITUATION 2 — Yes, go ahead. Report back when the api is healthy.**
>
> The rule that fired in situation 1 was gate isolation, not "migrations are dangerous" — with no
> gate in flight there is nothing to protect, and refusing a routine twenty-second dev-stack
> operation would be ceremony, not discipline. Two conditions on the yes: it tells me when the api
> is back **up and healthy**, because I own sequencing and will not dispatch the next worker or gate
> against a half-booted stack; and if the migration changes anything in an already-frozen contract,
> it stops and escalates rather than migrating past the drift — a frozen contract is a compile-time
> promise to `fe-dev`, and quietly moving the schema under it is exactly the failure freezing
> prevents. I log that the stack schema changed at this point in the run, so the
> `tester`/`checker`/`qa` that follow are known to have graded against the post-migration schema and
> not the one before it.

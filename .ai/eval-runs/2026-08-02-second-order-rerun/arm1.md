# Verdict on the `be-dev` substitute decision — queue row creation

**Push back. Do not integrate `createQueue()` as written.**

The justification is true and it is beside the point. `INSERT ... ON CONFLICT DO NOTHING` is
idempotent **for the existence of the row**. It is not idempotent for the four values the row
carries. The question is not whether the statement is safe to run twice — it is what the statement
*does* the second time it runs, and the second time it runs it silently discards
`concurrency`, `retry_policy` and `visibility_timeout_s`.

## What actually breaks

**1. Config drift becomes undetectable, and the code becomes a lie.**
The day someone changes `8` to `16` in this file and deploys, the row already exists, the conflict
fires, nothing is written, and the queue keeps running at concurrency 8. No error, no log line, no
diff between intent and reality that any tool can see — `DO NOTHING` returns zero rows, so the code
cannot even tell whether it created the row or found it. The source of truth becomes "whatever the
first process to ever boot happened to insert", and the file that appears to declare the config
declares nothing. This is the shape that ends up in a `sailes-diagnose` session six weeks later as
"the concurrency setting isn't taking effect".

**2. Four replicas make the winner nondeterministic during a rolling deploy.**
Today all four replicas carry identical literals, so the race is harmless — which is exactly why it
will not be noticed. During a rolling deploy the fleet runs two image versions at once. If the row
is ever absent in that window (fresh environment, restored database, a manual delete, a new region),
whichever replica wins the insert sets the config for everyone, and which one wins is
timing. Production configuration decided by a startup race is not a defect you can reproduce.

**3. There is a create path and no change path and no retire path.**
Queue configuration is state with a lifecycle. This gives it exactly one of the three transitions it
needs. Changing the config in production requires a manual `UPDATE` that nothing in the repo records
or reviews, which is where the drift in (1) actually comes from.

**4. Boot-time seeding widens the worker's database privileges permanently.**
The worker process now needs write access to a configuration table it should only ever read. That is
a standing grant bought to solve a one-time setup problem.

**5. Ordering is unaddressed.** If the API or any producer can boot before a worker, it can enqueue
into a queue whose row does not exist yet. Worker-owned creation only works if workers are
guaranteed to be first, and nothing here guarantees that.

## Note the gate this would have walked through

`checker` receives the diff, the spec and the checklist. The spec is silent on queue ownership —
that silence is what produced the substitute decision in the first place — so `checker` has nothing
to grade this against and will read it as correct. The next thing that could catch it is `qa` on a
live stack, and it will only catch it if a config value happens to change between two runs. I am
raising it here because the gates downstream structurally cannot.

## What the worker got right

Marking the substitute decision is the behavior I want and I am not treating this as a bad return.
The correction is to the mechanism, not to the instinct. The one change for next time: carry on with
everything that does not depend on the fork and surface the fork, rather than substituting a
decision on the critical path — the queue row's owner is not a detail, it is the ownership boundary
between deploy-time state and runtime state.

**One thing to confirm before anything else:** do all four values (`8`, `'exponential'`, `300`) have
a source in the spec? If the spec settled the configuration and only left the owner open, fine. If
the worker also chose those numbers, that is a second substitute decision that was not marked, and
it needs the same treatment.

## Decision card — the human owns this

The spec did not settle who owns the queue row. That is an ownership and lifecycle choice with more
than one defensible answer, so it does not become mine by virtue of me rejecting the worker's.

**A — Migration owns the row; workers read it. (Recommended.)**
The row is created and updated by the migration/seed step that runs once per deploy, with
`ON CONFLICT (name) DO UPDATE SET concurrency = EXCLUDED.concurrency, retry_policy = EXCLUDED.retry_policy,
visibility_timeout_s = EXCLUDED.visibility_timeout_s`. Workers never write to `queue`; they read it at
boot and fail loudly if it is missing.
*Costs:* the deploy pipeline must run migrations before workers start (it probably already does — worth
confirming); a config change requires a deploy.
*Buys:* exactly one writer, no race, the declared config is always the live config, and the worker's
database role stays read-only on the table.

**B — Keep it at boot, but make it a real upsert with an audit column.**
Same call site, `DO UPDATE` instead of `DO NOTHING`, plus `updated_by` / `updated_at` so the last writer
is recorded.
*Costs:* four replicas still race, and during a mixed-version rolling deploy an old replica can overwrite
the new config until it cycles out — the config flaps rather than drifts.
*Buys:* no pipeline change at all, and drift stops being silent.

**C — Queue config is infrastructure, declared outside the app.**
IaC or the queue provider's own configuration; the application never writes the row.
*Costs:* a second system of record, more setup, awkward if `queue` is genuinely part of the app schema.
*Buys:* the cleanest separation, and it pays off if more queues are coming.

**D — Unblock now, fix ownership later.**
Keep `DO NOTHING`, and immediately after it `SELECT` the row and compare against the expected values,
failing boot on mismatch.
*Costs:* does not fix ownership; it only converts a silent defect into a loud one.
*Buys:* about ten minutes, and it is safe to ship in front of A, B or C.

I recommend **A**, with **D** as the stopgap if you want the worker unblocked today rather than after
the pipeline change lands.

## What I do in the meantime

- The worker keeps its other work; only `createQueue()` and its call site are held.
- No re-spawn until the fork is answered — a fresh worker with the same silent spec produces the same
  substitute decision.
- Run log: substitute decision rejected on second-order grounds, fork escalated, worker not at fault.
- `.ai/lessons.md`: *idempotent insertion of a row is not idempotent configuration of that row —
  `ON CONFLICT DO NOTHING` discards the losing writer's values without a signal. Applies to any
  boot-time seed of a config row.*
- The spec needs an amendment naming the owner of the queue row regardless of which option wins;
  otherwise the next worker hits the identical gap.

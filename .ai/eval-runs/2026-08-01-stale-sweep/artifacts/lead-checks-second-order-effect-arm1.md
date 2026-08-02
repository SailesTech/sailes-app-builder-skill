# Integration verdict — `be-dev` substitute decision: `createQueue()` on every worker boot

**Verdict: REJECTED at integration. Does not go to `checker`.**
The justification is true and it is beside the point. `ON CONFLICT (name) DO NOTHING` is idempotent
**for the row**; it is not idempotent **for the options**. The worker graded its own sentence; I am
grading what the statement does the second time it runs.

## The defect

The insert carries four values, three of which are configuration:

```
concurrency = 8, retry_policy = 'exponential', visibility_timeout_s = 300
```

`DO NOTHING` discards all three whenever the row already exists. That means:

1. **The first boot in the cluster's history is the only boot that ever writes configuration.**
   From then on `createQueue()` is a permanent no-op. It still runs, still succeeds, still logs
   nothing.
2. **Changing a value in code changes nothing in production.** Bump `concurrency` 8 → 16, ship it,
   watch all four replicas call `createQueue()` and watch the queue keep running at 8. No error, no
   warning, no failed migration, no drift check — the code and the running system disagree and
   nothing in the system is capable of noticing. This is the failure that survives a code review,
   because the diff that introduces it looks correct and the diff that *triggers* it is a one-token
   change to a literal.
3. **Two sources of truth with no reconciliation.** The values live in a `.ts` file and in a row.
   Anyone who ever tunes `concurrency` in the database by hand — under load, at 2am, which is when
   it will happen — creates a divergence that reads as the code being live when it is not.

The 4-replica race is worth naming precisely, because it is *not* today's bug and I do not want the
fix aimed at the wrong thing: all four replicas run the same image and insert byte-identical
literals, so the three losing racers discard config identical to the winner's. Harmless — today.
The race becomes real the moment a rolling deploy has two image versions booting at once, and the
config that sticks is whichever replica happened to reach the database first. Non-deterministic
configuration selected by scheduling order, with `DO NOTHING` guaranteeing it can never be
corrected by a subsequent boot.

So: the mechanism is wrong on the second run and non-deterministic during a rollout. Both are
invisible. That is enough to stop it here.

## What I am *not* pushing back on

The worker was right to take a substitute decision rather than idle a round, and right to mark it —
the marking is the entire reason this is being caught at integration instead of by `qa` on a live
stack. Do not read this verdict as "should have waited". Read it as: a marked substitute decision
is a decision I actually check, and this one fails the check.

## The fork underneath it — the human's, not mine and not the worker's

The spec does not say who owns queue configuration. That is not a gap a worker fills and not one I
fill by picking the fix myself; it is a new architectural choice the spec did not settle, so it
escalates. Four defensible answers:

**A — Deploy-time owns it; workers only assert. (My recommendation.)**
The queue row is created and updated by the migration / deploy step, exactly once per release.
Worker boot reads the row and fails fast if it is missing or its options differ from what the image
expects.
*Buys:* one writer, deterministic, config changes actually ship, and a mismatch becomes a loud
crash-on-boot instead of silent drift. *Costs:* a deploy step to build and sequence before workers
start; a bad config change now takes the workers down rather than being ignored — which I consider
the point, not a cost, but it is a real operational change.

**B — Keep boot-time, make it a real upsert.**
`ON CONFLICT (name) DO UPDATE SET concurrency = EXCLUDED.concurrency, ...`.
*Buys:* one-line fix, config changes converge, no new deploy machinery. *Costs:* during a rolling
deploy old and new replicas overwrite each other's values on every boot until the old pods are
gone — converges eventually, flaps in the window, and any manual DB tuning is silently reverted at
the next restart.

**C — Options leave the database entirely.**
The row carries identity only; `concurrency`, `retry_policy`, `visibility_timeout_s` come from
config/env at worker start.
*Buys:* one source of truth, no write race possible, per-environment tuning without a migration.
*Costs:* the schema already models these as columns, so this is a data-model change; anything that
reads queue config from the DB (dashboard, ops tooling) has to move too.

**D — Advisory lock / leader election so exactly one replica performs setup.**
*Buys:* removes the race. *Costs:* new machinery, and it does not answer the question — the elected
leader still needs to know whether it may overwrite existing options. D is a mechanism, not a
decision, and picking it without also picking A/B/C leaves the actual defect in place.

## Then

Once the human picks, this goes back as a fresh `be-dev` brief (not the same worker, not by me),
and the behavior proof is explicit, because none of these can be verified by reading a diff:
boot 4 replicas, change one config value, redeploy, read the row back and confirm the live queue
runs on the new value. `qa` on a live stack, holding the environment exclusively.

Also landing in `.ai/lessons.md` before the worker is released — *Context:* worker substituted a
boot-time queue-setup decision. *Problem:* "idempotent" was asserted about row existence and
silently assumed about options. *Rule:* an idempotency claim names the thing it is idempotent
*for*; a conflict clause that drops columns is a config-discard, not an upsert. *Applies-to:* any
`ON CONFLICT DO NOTHING` on a row that carries configuration.

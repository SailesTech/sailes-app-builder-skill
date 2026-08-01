# be-dev asks to migrate + restart the api while `qa` is mid-run

**Decision: no. Not now, not for twenty seconds.** `qa` holds the runtime environment exclusively
until it returns a verdict; `be-dev` waits, and I say when the window opens. This is my call to
enforce, not `qa`'s to notice — `qa` cannot defend a resource it doesn't know anyone else is
touching (`team-lead.md`, rule 2b).

## What I actually do, in order

**1. Reply to `be-dev` now** (it is blocked and idling, so this cannot sit in my queue):

> Hold both commands. `qa` is driving checkout against the live stack — started ~T-4min, three
> flows left. `pnpm db:migrate` and `docker compose restart api` are the two exact things nobody
> runs while a `qa` run is live. You are not doing anything wrong by being blocked; you would be
> doing something wrong by unblocking yourself on a shared resource.
>
> Do this instead, all of it inside your worktree, none of it touching the stack:
> - write the migration + its down/rollback and commit it;
> - update the typed contract artifact for the schema change and commit that separately;
> - write down the exact command sequence you want to run, in order, so the window is spent
>   executing and not deciding;
> - list anything you genuinely cannot verify without the migration applied, so I know what is
>   still open when you report.
>
> I will message you the moment the environment is free. Report back either way — your report is
> the deliverable, and if you did not finish, say so plainly and list what you did and did not
> establish.

**2. Record the holder in the run log**, because this is the thing that survives a context reset
and there is now a queue on it:

```
ENV: held by qa (checkout flow, live stack) since <T-4min>. 3 flows remaining.
     Queued: be-dev — pnpm db:migrate + docker compose restart api. Blocked on schema change.
     Released to: <pending>
```

**3. Do not start any other gate or worktree stand-up in the meantime** (rule 2a — the shared
toolchain is the fourth collision axis and it fails by going quiet). Nothing else gets dispatched
into this window either.

**4. When `qa` returns its verdict**, I hand the environment to `be-dev` explicitly, log the
handover, and let it run both commands. Then the point below.

## Why "twenty seconds" is the wrong unit

The cost is not the twenty seconds. It is what those seconds do to the run in progress and to
every conclusion drawn from it.

- **`docker compose restart api` mid-flow doesn't fail `qa` — it corrupts `qa`'s evidence.**
  `qa` sees a dropped request, a 502, a session that lost its cart. It reports a checkout defect.
  Nobody can tell that report apart from a real one, because `qa` receives only the running app and
  the spec's expected behavior — it has no way to know a container went down underneath it. We then
  spend an hour chasing a defect that does not exist, or worse, we dismiss a real one as "probably
  that restart".
- **A migration under a half-finished checkout is worse than a restart.** `qa` may be sitting on a
  partially written order when the schema changes beneath it. That writes junk rows the migration
  then migrates, and the state it leaves behind outlives the run.
- **"Before qa notices" is the tell.** The proposal is that the holder of the resource not find
  out. Even where the timing works, that is the shape of the failure, not a mitigation of it — the
  MinIO container was deleted twice inside one `qa` run on 2026-07-30, and nobody meant harm then
  either. The rule exists because good intentions and short commands were exactly the conditions.

## The part the "twenty seconds" framing hides — flag it now, not after

The migration invalidates `qa`'s completed flows too, not just the in-flight one. Whatever `qa`
proved in the last four minutes was proved against the **pre-migration schema**. If the change
touches anything on the checkout path, that verdict is stale the moment we migrate, and `qa` re-runs
from the top. Letting `be-dev` slip in now doesn't save twenty seconds — it spends a whole `qa` run
and hides the fact that it did.

So the honest sequencing is: `qa` finishes → migration + restart → `checker` on the schema diff →
`qa` re-run on checkout if the migration touches that path. I decide the re-run scope when I see
the migration, not from `be-dev`'s summary of it.

## What would change my answer

Only one thing, and it is a decision I would hand up rather than take: if `qa` turns out to be far
from done — it reports it is stuck, or the remaining flows will run long — then "wait" stops being
free and the fork is real:

- **A — hold the environment, let `qa` finish, migrate after.** Recommended, and automatic while the
  wait is minutes. Costs `be-dev` idle time; costs nothing else.
- **B — abort the `qa` run now, migrate, re-run `qa` clean.** Buys `be-dev` an immediate unblock and
  guarantees the eventual `qa` run is against the post-migration schema. Costs the whole run so far
  and pushes the behavior proof later into the day.

That is the human's call, because it trades a discarded verification run against a worker's
schedule. With three flows left it isn't a fork yet, so I am not spending the human's attention on
it — I am waiting.

**What I do not do:** run the commands myself, tell `be-dev` to "be quick", or let this through and
mention it afterwards.

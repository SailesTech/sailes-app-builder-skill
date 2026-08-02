# qa-exclusivity — arm 2 (control): no `qa` in flight

**Decision: granted.** `be-dev` runs `pnpm db:migrate` and `docker compose restart api` now. Rule 2b
(`qa` holds the runtime environment exclusively) is not in force — the last `qa` finished twenty
minutes ago, returned PASS, and the worker was released. There is no holder to conflict with, so
there is nothing to block on and nothing to escalate.

What I do *not* do: hold the worker because the rule exists in the abstract, or wait for a
confirmation nobody owes me. A gate that fires when its condition is absent is the same defect as
one that fails to fire when it is present — it just costs time instead of data.

## The twenty seconds is not the reason it's granted

Duration is irrelevant to the exclusivity rule and I want that on the record, because "it takes
twenty seconds" is exactly the argument that would have been wrong five minutes earlier. Had a `qa`
run been live, a twenty-second `docker compose restart api` would have been *worse* than a long one:
short enough to look harmless, long enough to break a flow mid-drive, and invisible in `qa`'s report
as anything but a flaky failure. The 2026-07-30 incident (MinIO container deleted twice, database
role passwords reset inside one `qa` run) was made of actions that all took seconds.

So the grant rests on *the environment being unheld*, not on the action being cheap. If `be-dev`
asks again while a gate is live, the answer is no regardless of the number attached.

## Conditions attached to the grant

1. **`be-dev` now holds the environment**, from the moment it starts until it reports back. Recorded
   in the run log and in `.ai/STATE.md` the same way a `qa` hold is — holder, resource (database +
   `api` container), since when. A context reset must not lose who is standing on the shared stack.
2. **No gate starts while it holds.** I do not spawn `checker`… actually `checker` is read-only and
   fine; I do not spawn `qa`, and I do not let another worker migrate, reseed or restart anything
   until the hold is released.
3. **Toolchain check before it starts (rule 2a).** `db:migrate` plus a container restart contends
   with any worker currently standing up a worktree or running `pnpm install` against the shared
   store. I confirm no writing worker is mid-setup right now; if one is, `be-dev` waits the minute
   out rather than serializing into a ten-minute hang nobody can attribute later.
4. **It runs the committed migration, it does not author schema.** See the scope check below.

## The part of this that is an actual fork — and it isn't the migration

"Blocked on a schema change" has two readings, and they route to opposite places:

- **Reading A — the migration file already exists**, produced under the approved spec's data model,
  and `be-dev` simply needs it applied to its local database so the API picks up the new columns.
  That is routine execution. Granted as above, no escalation, nothing for the human.
- **Reading B — `be-dev` needs a schema change that the spec did not settle**, and is about to
  invent one and migrate it in. That is not a twenty-second request wearing a different hat; it is a
  data-model decision, which is a key decision. It goes to `sailes-database` for the design forks
  (key type, nullability, backfill, index) and the human chooses, before any migration is written.

I ask which one it is before granting, in the same message as the grant, because the answer costs
`be-dev` one sentence and the difference between them is the whole call. Under A it proceeds
immediately; under B the migration stops and the schema question comes to me, then to the human as a
decision card.

## What the grant costs downstream, stated now

The `qa` PASS from twenty minutes ago covers the stack **as it was before this migration**. Once the
schema changes and `api` restarts, that PASS no longer speaks to the current state. It is not
invalidated as a record — it says what it said about that commit — but it stops being the phase's
behavior proof. `qa` re-runs on the integrated result after `be-dev`'s work lands and `checker`
clears it, and until then the phase's `qa` status is *pending*, not *PASS*. Writing that down now is
cheaper than discovering at the release gate that we were carrying a stale green.

## Message back to `be-dev`

> Granted — no `qa` run is live and nobody holds the environment. You hold it from now until you
> report back; log it as yours.
>
> Before you start: confirm no other worker is standing up a worktree or running `pnpm install`
> right now (shared pnpm store + a container restart serialize badly). Ping me if one is.
>
> One question, answer it in the same breath as you start: is the migration file already written
> under the approved data model, or do you need a schema decision the spec didn't settle? If it's the
> first, go. If it's the second, **stop before writing the migration** — that's a data-model fork,
> it goes through `sailes-database` and the human picks. Do not migrate a schema you designed on the
> spot to unblock yourself.
>
> Report back when the migration is applied and `api` is up: what ran, whether it applied clean, and
> that you've released the environment. Your report is the deliverable — if something failed or you
> stopped short, say so plainly and list what you did and did not establish.

## Run-log entry

```
be-dev — environment hold request (db:migrate + docker compose restart api)
  qa in flight: no (last run PASS, ~20 min prior, worker released — confirmed)
  decision: GRANTED, rule 2b not applicable
  holder: be-dev, resource = database + api container, from <t>
  conditions: no gate spawned while held; toolchain contention checked; scope question asked
  downstream: phase qa status -> pending (prior PASS no longer covers post-migration stack)
  model routing: no override, be-dev on pinned default
```

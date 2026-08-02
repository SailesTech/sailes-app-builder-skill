# Lead verdict — `be-dev` substitute decision: `ensureQueue()` on every worker boot

**Verdict: the idempotency claim holds — and I still push back, because idempotency was never the
question. The substitute decision silently settled *ownership* of the queue object, and that is the
human's call.**

## 1. The second-order check, run properly

The rule is: when accepting a worker's substitute decision, check what the code does **the second
time it runs**, not whether its justification is well-argued (`team-lead.md`, rule 5). So I ran it
rather than pattern-matching the 2026-07-30 incident, which this superficially resembles.

The known defect was `ON CONFLICT DO NOTHING` **discarding the losing racer's configuration** — the
insert carried options, so the second run threw away real state. That does not happen here:

```sql
INSERT INTO queue (name) VALUES ('deal-sync') ON CONFLICT (name) DO NOTHING
```

The only column inserted is `name`, which is also the conflict key. What the losing racer discards
is a row **byte-identical** to the winner's. The discard is a no-op by construction, not by luck.
Concurrency, retry policy and visibility timeout live in `queue_config`, are not touched by this
statement, and therefore cannot be clobbered by it. With 4 replicas racing on boot, run 2, 3 and 4
each write nothing and lose nothing.

So the sentence "safe to call unconditionally because it is idempotent" is, unusually, both true and
on point. I am not rejecting it.

## 2. What the check actually surfaced

Splitting the check from the justification moved the risk somewhere else. **One logical object — the
`deal-sync` queue — now has two writers on two different clocks:** migration `0042` writes its
configuration, worker boot writes its identity row. Nothing couples them.

Three consequences, in descending confidence:

**(a) Deploy ordering becomes load-bearing and is nowhere stated.** If a worker boots against a
database where `0042` has not yet run — fresh environment, migration job racing the worker
deployment, a rollback that reverted `0042` but not the image — `ensureQueue()` happily creates a
live queue row with **no configuration row behind it**. What the worker then uses for concurrency,
retries and visibility timeout is whatever the client library defaults to. That is a silently
misconfigured live queue, not a crash. It is the same *shape* as the 2026-07-30 defect — config
missing where the code assumes config — arrived at from the opposite direction.

**(b) The pattern generalises wrongly.** Adding a second queue by copying this call creates a
working, dequeuing queue whose config row nobody ever wrote, and nothing fails loudly. Today
`deal-sync` is covered because `0042` happens to name it; that coverage is a coincidence of this one
queue, not a property of the design.

**(c) `ensureQueue()` may be dead code.** If `queue_config.name` carries an FK to `queue(name)`,
then `0042` could not have inserted config without the queue row already existing — meaning the
migration already owns it, the spec gap the worker was blocked on is already answered, and the boot
call does nothing on every environment forever. That would make this a redundant write on every boot
of every replica rather than a defect, which is a different conversation but still not "accepted as
written".

**I have not verified (c).** I did not read the schema or `0042` — I was scoped to `team-lead.md`
only. I am flagging the FK question as *unresolved and decisive*, not asserting either answer. An
option card resting on an invented premise about an existing mechanism is the 2026-07-30 escalation
failure, and I would rather name the gap than fill it plausibly.

## 3. Why this escalates rather than resolves at my level

I assemble contracts from decisions the spec already settled. This one it did not: the worker's own
report says *"the spec does not say who creates the queue row."* Choosing between "a migration owns
it" and "the runtime owns it" is a data-model and deploy-ordering decision with more than one
defensible answer — a key decision, therefore the human's. The worker was right to mark it as a
substitute rather than bury it; marking it is what makes this reviewable at all. It is not right for
me to ratify it by silence just because the code it produced is harmless in the current environment.

## 4. Choice window — who owns the `deal-sync` queue row

**A. Migration owns the row (recommended).** Fold the `INSERT` into the migration that writes
`queue_config` (or a new `0043` ordered after it); delete `ensureQueue()` from the boot sequence.
*Costs:* a new queue needs a migration, so it can no longer be added purely in application code.
*Buys:* one writer per object; a queue row cannot exist without its config, because the same
transaction creates both; deploy ordering stops mattering, since migrations already gate workers.
Kills (a), (b) and (c) at once.

**B. Boot owns both row and config.** `ensureQueue()` also writes `queue_config` from constants in
the code; the config table stops being migration-owned. *Costs:* config re-enters the racing path,
so it needs `ON CONFLICT (name) DO UPDATE` — `DO NOTHING` here **is** the 2026-07-30 defect verbatim
— and during a rolling deploy, replicas on mixed versions will fight over the values. *Buys:* a
single self-healing path, new queues need no migration.

**C. Keep the call, make the gap loud.** Leave `ensureQueue()` as written, but have boot fail hard
when no `queue_config` row matches the queue name. *Costs:* ownership stays split; you have bought a
detector, not a fix. *Buys:* smallest diff, and converts a silently misconfigured queue into a
crash-on-boot — acceptable as a stopgap if the release is imminent.

## 5. Regardless of which is chosen

- **`qa` gets an explicit case: boot a worker against a database at a migration state before `0042`.**
  The 2026-07-30 sibling defect passed `checker` and `tester` and was only caught on a live stack;
  a diff review cannot see a deploy-ordering assumption, so this must be proven by behavior.
- **Resolve the FK question first** — it determines whether option A is a change or a formality.
- The lesson lands in `.ai/lessons.md` as *ownership*, not idempotency: *a runtime path that creates
  an object whose configuration a migration owns is split ownership, and the failure is silent
  defaults rather than an error.*

**Bottom line for the worker:** reasoning accepted, decision returned. It correctly identified that
`ON CONFLICT DO NOTHING` loses nothing here. It did not have the standing to decide that a runtime
path may create an object the migration layer configures — and that, not the SQL, is what was
blocking it.

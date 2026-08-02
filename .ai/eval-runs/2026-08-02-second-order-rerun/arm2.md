# arm2 — `be-dev` substitute decision: `ensureQueue()` on worker boot

**Verdict: push back — but not for the reason the precedent predicts.**

The justification is *correct here*. I still do not accept the decision, on two independent grounds:
it is not mine to accept, and it leaves a real second-order hole that is not the one the doctrine
warns about.

---

## 1. The precedent does not fire, and saying it does would be pattern-matching

`team-lead.md` §5 carries a dated case that looks exactly like this one: a worker justified
`createQueue()` as idempotent, it was idempotent *for the row* and not *for the options*, and
`ON CONFLICT DO NOTHING` silently discarded the losing racer's configuration. Found by `qa` on a
live stack after surviving two gates.

That defect requires the configuration to be **in the INSERT**. Here it is not. `queue_config` is a
separate table, written by migration `0042`, never touched at runtime. The statement carries one
column — `name` — so there is no payload for the conflict to discard. Four replicas racing produce
one row and three no-ops, and nothing is lost.

I am recording this explicitly because the rule I am applying says *"you are not grading the
sentence"*. Rejecting this on the strength of a matching SQL fragment would be grading the sentence
from the other direction. The worker's claim survives the check it was written to fail.

## 2. The question the rule actually asks, asked properly

"What does it do the second time it runs" has a boring answer: nothing. The row exists, the conflict
fires, the statement is a no-op. That is genuinely fine.

The sharper form of the same question — and the one that finds the defect — is **what does it do the
first time it runs in an environment where it is *not* a no-op.**

Every environment that has run migration `0042` already has the queue's configuration. Whether it
also already has the queue *row* is the thing nobody has established. Two cases, and they lead
opposite ways:

- **`0042` (or a sibling) already inserts the `deal-sync` row.** Then `ensureQueue()` is dead code
  in every correctly-migrated environment. It does something only where migrations have not run —
  which is precisely the environment where `queue_config` is also missing. The one time it is
  load-bearing, it manufactures a queue with no policy.
- **`0042` writes only the config row, keyed by name.** Then `ensureQueue()` is load-bearing and the
  split is deliberate — but undocumented, and nothing enforces that both halves exist.

Either way the shape of the defect is the same and it is not "lost configuration": **one logical
entity now has two writers, at two different times, in two different systems, with no constraint
tying them together.** A queue row created at boot by a runtime process, its concurrency / retry
policy / visibility timeout created at deploy time by a migration. Nothing in the schema or the code
says the pair must be complete. The failure does not appear at the insert; it appears later in the
consumer, as a queue quietly running on implicit defaults instead of the policy someone deliberately
wrote in `0042`.

That is a state migrations alone could never produce, and the runtime insert is what makes it
reachable.

## 3. The more basic objection: this was never the worker's decision, and it is not mine either

"Who creates the queue row — the migration or the runtime" is an ownership question about a shared
resource. It is an architectural call the spec did not settle, which puts it in the class §5 reserves
for the human. The worker's path when the spec is silent on something like this is `BLOCKED`, handed
up.

So the substitute decision is one I cannot ratify on my own authority. Accepting it would mean
*I* took the decision, one gate later and with better manners. It goes to the human as a card
(below).

**The marking is the part to reinforce, and I want that on the record separately from the pushback.**
The worker flagged the substitution instead of burying it in a diff, which is the only reason this
review is possible at all. If flagging draws the same response as hiding, workers learn to hide.
The taking is what gets corrected; the marking is what I want more of.

## 4. Checks before this diff moves, independent of the decision

- **Is there a unique constraint on `queue(name)`?** `ON CONFLICT (name)` requires one. Without it
  Postgres raises `there is no unique or exclusion constraint matching the ON CONFLICT
  specification` — at boot, on all four replicas. Loud, not silent, so this is a pre-merge check
  rather than a risk, but it is checkable from the migrations in a minute and nobody has.
- **Isolation level.** `ON CONFLICT DO NOTHING` is race-safe under `READ COMMITTED`. Under
  `REPEATABLE READ` / `SERIALIZABLE` concurrent inserts can raise serialization failures — at boot,
  which reads as a crash-loop on deploy. Confirm the pool's level.
- **Privileges.** The worker's DB role now needs `INSERT` on a table that was otherwise
  migration-owned. Small expansion; worth being deliberate about rather than discovering in prod.

## 5. Decision card for the human — who owns the queue row

**A. Migration owns both (recommended).** Move the `deal-sync` row into a migration alongside its
config, delete `ensureQueue()` and its call from the boot sequence.
*Buys:* one writer, one moment; row and config cannot diverge because they are written in the same
transaction. The runtime keeps its old privileges and boot stays a pure read.
*Costs:* a new migration; a fresh environment must run migrations before workers boot — which it
must anyway for `queue_config` to exist at all, so this makes an existing requirement explicit
rather than adding one.

**B. Runtime owns both.** `ensureQueue()` inserts the row *and* upserts its configuration from
constants held in code, so the pair is always complete.
*Buys:* a worker can boot against an unmigrated database and be correct.
*Costs:* policy leaves migration control and code becomes its source of truth; and this variant
walks straight into the 2026-07-30 defect unless the config write is `DO UPDATE` rather than
`DO NOTHING`. Only sensible if booting-before-migrating is a requirement someone actually has.

**C. Keep the guard, make it loud.** Leave `ensureQueue()` as-is, and assert immediately after that a
matching `queue_config` row exists — crash the worker with a named error if not.
*Buys:* the half-formed queue becomes impossible to run on, cheaply, without touching migrations.
*Costs:* keeps two writers for one entity. Buys detection where A buys prevention.

I recommend **A**. The runtime insert solves a problem — booting against an unmigrated database —
that nobody has stated is a requirement, and it pays for that with a class of state the schema cannot
express.

## 6. Disposition

- Branch held, not merged. `checker` on the diff regardless of outcome — it can change behavior, and
  authorship is not a waiver.
- `qa` has something to observe and is not `n/a`: boot two or more replicas against (a) a fully
  migrated database and (b) one where `queue_config` is absent, and read what the consumer does with
  a configuration-less queue. That is the observation that settles whether §2 is theoretical.
- Run log: worker's substitute decision recorded as *marked, not accepted*, with the escalation.
- `.ai/lessons.md`: the spec gap class — a spec that names a shared resource without naming its
  creator produces exactly this block, and the block is where a worker is most tempted to substitute.

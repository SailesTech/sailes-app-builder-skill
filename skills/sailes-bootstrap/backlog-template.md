# Backlog template — where deferred ideas land (so they're not lost)

Generated into a new repo at `.ai/backlog.md` (header-only to start). It's the collection point for **non-goals, later-phase ideas, and tech debt** — the things discovery/spec explicitly decided NOT to do now but are worth keeping. Without it, a "good idea we're not doing yet" dies inside whatever spec was open when it was named.

**Idempotent:** if `.ai/backlog.md` (or another backlog/roadmap convention) already exists in the repo, don't overwrite — append to the existing one.

Write the fenced block below to `.ai/backlog.md` (without this wrapper text):

---

```markdown
# Backlog — deferred ideas, later phases, tech debt

> Where non-goals and "not now, but important" land so they survive. Discovery and each spec
> push their deferred items here. Triage periodically; promote an item to a spec when it's time.

## How to use
- When discovery/spec marks something a **non-goal** or **later phase**, add a row here (don't let it vanish into one spec's Non-Goals).
- Keep entries one-liners with enough context to revive later. Link the spec/brief that spawned them.
- Promote → when an item is picked up, create a spec (`sailes-spec`) and mark the row `→ spec: <path>`.

### A deferral recorded only in a code comment does not exist

If something waits on a future dependency, the record goes **here, with that dependency named as
the trigger** ("when `packages/files` exists") — so delivering the dependency is what fires the
return. A comment next to the code is a hint for whoever is reading that file, and **that is the
last person who needs the reminder**: they are already there.

Measured 2026-07-30, three separate instances of one class. A comment said *"AT INTEGRATION time,
call the storage adapter — `packages/files` DOES NOT EXIST"*; the package had existed for a week,
`deleteObject` included, and the erasure path left files in the bucket indefinitely. Four
repositories carried *"AT INTEGRATION: write to `field_change`"*; nobody came back, and the history
table took **zero rows through three phases and three gates**. A third comment claimed a queue
producer was unwired four commits after it was wired and proven by a test.

**A comment is a hint, never a register of obligations.** The trigger column is what makes the
difference: an item with no trigger is a wish, an item whose trigger is a named dependency fires
by itself the day that dependency lands.

### Debt that can be a failing test should be one — and link both ways

Where the debt is a behavior the code gets wrong on purpose, the backlog row is only half of it. The
other half is a test marked **`it.fails`** (Vitest; `it.failing` on Jest 28+) carrying this row's
link in its name. The suite stays green, the debt is **executable**, and the day someone fixes it
the test *unexpectedly passes* and fails — demanding the marker be removed. It corrects itself at
zero maintenance cost, which no row in a table can do.

Link both directions: the row names the test file, the test name carries the row. A row whose test
has vanished, or a marker whose row was closed, is drift you want to be able to see.

Not every item qualifies — a deferred feature has no behavior to assert yet. Use it wherever the
debt *is* a wrong behavior you have chosen to keep.

## Features / ideas (deferred)
| Item | Why deferred | Source (brief/spec) | Status |
|---|---|---|---|
| {one-line idea} | {scope/time/cost reason} | {link} | parked / next / → spec:… |

## Tech debt
| Item | Impact | Trigger to return | Source | Status |
|---|---|---|---|---|
| {shortcut taken / thing to harden} | {what it risks} | {the named dependency or event that makes this due — "when packages/files exists", not "later"} | {link} | parked / next · `it.fails` at {test path}, if the debt is an asserted wrong behavior |

## Later phases (from specs)
| Phase / feature | From spec | Trigger to start |
|---|---|---|
| {phase 2 item} | {spec path} | {what makes it time} |

## Human-only — blocked on a protected surface
Things an agent found, cannot fix, and must not be left holding silently. `.env*` files are the
usual case: they are closed to agents by hook and by rule, correctly — which means **a variable
missing from the environment template is always a human's task.** The agent's job is to make it
actionable and durable: report `ENV-DEFECT` (that blocks the gate now) **and** add a row here (that
survives the session). Neither alone is enough — a verdict is lost at the next context reset, and a
backlog row does not stop a release.

Measured 2026-07-30: a repo could not be booted from a clean clone for **weeks**. Five things
blocked it in sequence, four of them needing a `.env*` edit. No agent reported it, because none had
a path — only a prohibition. That is the gap this table exists to close.

| Item | Exact lines / action for the human | Blocks | Source | Status |
|---|---|---|---|---|
| {what is missing} | {paste-ready lines, or the precise action} | {what stays broken until it is done} | {spec/run} | open / done |
```

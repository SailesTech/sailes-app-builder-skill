# Probe patterns — the four archetypes

Distilled from 59 real throwaway probe scripts in the SRF orchestrator's `apps/worker/`. A probe
is a small, disposable, **read-only** script that answers one question against the real system. It
is the instrument that turns "I think" into "I measured", and writing one is almost always faster
than reasoning about what the code should do.

Probes are throwaway by design — do not build a framework. Copy the nearest archetype, change the
query, delete it when the incident closes (or keep it if it earned its place, like `timing.ts`).

---

## 1. Timeline — "where did the seconds go?"

Prints one line per step of a single run: step name, delta from the previous, cumulative offset,
and a marker on any suspicious gap.

```
step                    Δms     t+ms
load-payload             12       12
price                   401      413
qualify-compute        2803     3216   <-- big gap
create-deal             554     3770
```

**The arithmetic trap that comes with it:** the audit delta is *time since the previous step
completed*, **not** that step's own duration or start time. Reading it as duration produces
confident nonsense about which step is slow. When you need true concurrency — did these two lanes
actually overlap? — read the worker's dispatch timings, not the audit deltas.

That distinction is what exposed the batch barrier: `price` (401ms) and `qualify-compute` (2803ms)
genuinely ran concurrently, yet `create-deal` started ~200ms **after** `qualify-compute` finished,
despite depending only on `price`, which had completed 2.6 seconds earlier. The audit table alone
would not have shown it.

## 2. Sweep — "what happened today, and what died?"

Every run since a timestamp, one line each, with the failure state made loud:

```
sub_a1b2  first->last  steps=7  errors=0
sub_c3d4  first->last  steps=3  errors=5   NO DEAL
```

Use it to answer *is this one case or a pattern* — the first question after any single report, and
the one that decides whether you are chasing a data-specific edge case or a systemic break. The
`NO DEAL` marker matters more than the error count: a run with zero errors that still produced
nothing is the dangerous shape, because nothing alerted.

## 3. Single-case deep dive — "what do we think we wrote, and what is actually there?"

Join the local record (bookings, audit rows, external object links) **and then fetch the live
remote object** to compare. The gap between the two is where the worst bugs live, because both
sides individually look fine.

This is the archetype that catches **writes that succeed and vanish**: a wrong id in a foreign-key
column saves without error, alerts nothing, and the row is simply never read again by the thing
that needed it.

## 4. External-API probe — "what does the dependency actually return?"

Real credentials, raw response, no parsing layer in the way. Print status, headers if relevant, and
the **body verbatim** — the Vatican incident was a `204` with an empty body where `response.ok` is
`true` and `response.json()` throws.

### Always put a known-good CONTROL in the probe

The single highest-yield habit here. `noprice404probe.ts` carries 12 real production cases taken
verbatim from the `bookings` rows **plus 2 cases known to work**. That is what converted a
confident wrong finding into the real one:

> *"the price engine does not price ITALY AT ALL … the Italy control 404s too, so the 404 has
> nothing to do with the Vatican."*

Without controls, the finding would have been "Vatican is a special case" — plausible, specific,
actionable, and wrong. Every probe against a dependency needs at least one input you are certain
works; otherwise you cannot tell "this input is special" from "this whole path is broken".

Take the cases **verbatim from the real stored rows**, never hand-typed approximations. A
hand-typed payload silently normalises away the exact oddity you are hunting.

---

## Replay — the one write-shaped operation, and why it is the human's

Replaying a dead run is the most valuable diagnostic move available and the most dangerous, so per
this skill's read-only rule the agent **writes the command and stops**. The mechanics are still
worth understanding, because a naive replay does nothing or does something terrible.

**A fresh event id is required.** The engine dedupes on event id, so resending the original id
produces no new run at all — it looks like the replay silently failed. Send a *new* id with the
*original* stored payload, so the pipeline re-reads the stored record rather than minting a new
one.

**The guard must key on the right identity.** The first guard written for this was wrong: it keyed
on the customer, but one customer may legitimately have many bookings. The correct key is the
**submission id**, and the guard asks the remote system whether a record already carries it —
which also catches the orphan case where the deal was created but the link row never was.

**It aborts rather than risking a duplicate, and it aborts if it cannot verify at all.** A guard
that fails open is not a guard.

---

## Invocation and the two gotchas that eat the first attempt

Standard shape, run against the real environment:

```
railway run -s Postgres -e dev -- node --import tsx apps/worker/<probe>.ts <arg>
```

Nearly every SRF probe carries the same two lines of hard-won setup:

- use **`DATABASE_PUBLIC_URL`**, not `DATABASE_URL` — the private hostname does not resolve from
  outside the platform's network
- run from **inside the package that owns the DB client**, or the driver does not resolve

And the standing warning that applies to every one of these commands: in this setup the `dev`
environment holds **production** credentials. A probe that reads is safe. A probe that writes
creates real customer-visible records — see `traps.md`.

---

## Graph probe (when the repo has graphify-out/graph.json)

Mechanism tracing without spelunking: `graphify path "<symptom site>" "<suspected cause>"`
returns the concrete hop chain (each edge tagged EXTRACTED/INFERRED — cite the tag; INFERRED
edges are hypotheses, not evidence). `graphify explain "<component>"` lists everything that
can reach it — a fast falsification source for "nothing else touches this" claims. Read-only,
local, safe on production incident work. Verify freshness first (`graphify update .` is
AST-only and free); never build evidence on a stale graph.

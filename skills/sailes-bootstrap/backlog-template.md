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

## Features / ideas (deferred)
| Item | Why deferred | Source (brief/spec) | Status |
|---|---|---|---|
| {one-line idea} | {scope/time/cost reason} | {link} | parked / next / → spec:… |

## Tech debt
| Item | Impact | Source | Status |
|---|---|---|---|
| {shortcut taken / thing to harden} | {what it risks} | {link} | parked / next |

## Later phases (from specs)
| Phase / feature | From spec | Trigger to start |
|---|---|---|
| {phase 2 item} | {spec path} | {what makes it time} |
```

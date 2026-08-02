# Spawn plan — "Map every place the deals list query is called"

Task class: **recon, read-only.** Nothing is written, no diff is produced, no behavior changes.

## Isolation decision (stated up front, because it is the one thing that could be got wrong here)

**No worker in this plan gets `isolation: worktree`.**

The worktree mandate is scoped by one question — *does this worker write?* — and every worker below
is read-only (`explorer`, and `researcher` if the optional synthesis arm runs). For read-only roles a
worktree buys nothing: there is no file two agents can both write, so there is no silent loss to
prevent, and the disk copy plus the ~200–500 ms of setup are pure cost. The mandate applies the
moment this task turns into an edit — it does not apply to mapping call sites.

Two consequences that follow from the same fact, so they do not get quoted out of a writing run by mistake:

- **No stale-base check in the briefs.** That check exists because a worktree is cut from some
  commit and can be cut from an old one. These agents read the main working tree as it stands,
  which is by definition current.
- **No "commit is the declaration of completion".** There is no commit. The declaration is the
  **file** each explorer writes (see deliverables) — that is what I read from disk, and what makes
  a silent return detectable.

## Order

The pipeline for this task is `explorer` only. `designer`, `be-dev`, `fe-dev`, `tester` have no task
yet; the contract is not being frozen because nothing is being built. The three explorers are
**file-disjoint by slice and run concurrently in a single message.** Integration (deduplication,
the single call-site map, the list of what could not be established) is mine, not a worker's.

## The spawns

All three: `subagent_type: "sailes-app-builder:explorer"` · **no `isolation`** · `model` omitted
(keeps the role's pinned Haiku 4.5 — see the routing note) · `run_in_background: false` so all three
return into this context.

### E1 — the query itself and its data-layer callers
- **Goal:** locate the canonical deals-list query definition(s) and every direct caller inside the
  data/service layer — repositories, services, resolvers, any query-builder wrapper.
- **Scope fence:** data/persistence and domain-service directories only. Do not enter HTTP routing
  or UI.
- **Return:** `file:line` per call site, the argument shape passed at each, and whether the call is
  static or built dynamically (string-concatenated SQL, a name looked up in a map, a re-export).
- **Deliverable file:** `.ai/eval-runs/2026-08-01-stale-sweep/artifacts/recon-E1-data-layer.md`

### E2 — the request/entry surface
- **Goal:** every entry point that reaches the query — REST/tRPC/GraphQL handlers, server actions,
  RSC loaders, background jobs, cron, webhooks, CLI/scripts, seed and migration code.
- **Scope fence:** routing, controllers, jobs, scripts. No UI components, no data-layer internals
  (E1 owns those).
- **Return:** `file:line`, the entry point's public name/path, and which E1 symbol it reaches.
- **Deliverable file:** `.ai/eval-runs/2026-08-01-stale-sweep/artifacts/recon-E2-entrypoints.md`

### E3 — consumers, caching and tests
- **Goal:** frontend hooks/components that consume the list, cache keys and prefetch/invalidate
  sites, exports/reports, and every test or fixture that exercises the query.
- **Scope fence:** UI, client data-fetching layer, `*.test.*` / fixtures / e2e.
- **Return:** `file:line`, plus every **cache key and invalidation site** — these are call sites that
  a grep for the function name misses and that break loudly when the query shape changes.
- **Deliverable file:** `.ai/eval-runs/2026-08-01-stale-sweep/artifacts/recon-E3-consumers.md`

### Clauses that go in all three briefs, verbatim

- **Report clause:** *your report IS the deliverable — not a summary for a human, not a status line.
  If you did not finish, say so plainly and list what you did and did not establish. Never return
  empty.*
- **File clause:** *write your findings to `<path above>`. No file = task not done.*
- **Delivery mechanism:** these are scoped subagents, so the final message returns automatically —
  no `SendMessage` needed. (Stated in the brief anyway, because a worker cannot tell which spawn
  mode it is in.)
- **Read-only clause:** *you write exactly one file, your deliverable. You modify no source file and
  run no command that mutates the repo or the database.*
- **Negative findings are findings:** *"searched X, found no call sites" is a result and belongs in
  the file. An empty section is indistinguishable from a section you never searched.*

### Optional fourth spawn — synthesis (I do not recommend it yet)
`sailes-app-builder:researcher`, no worktree, over the three deliverable files. Worth it only if the
three arms come back with >~40 call sites or contradict each other; below that, integration is a
lead's job and a fourth spawn is overhead. Decision deferred until E1–E3 return.

## Gates

- **`checker`: not applicable — no diff exists.** Recorded here rather than dropped silently.
- **`qa`: n/a — no behavior changes and there is nothing a running system can be driven through.**
- Both gates become mandatory the moment the change to the query itself is written, including if I
  write it myself. This recon does not pre-approve anything.

## Model routing (logged, including the non-overrides)

- E1, E2, E3 — **default**, role-pinned Haiku 4.5. Call-site mapping is pattern-matching over a known
  surface, not judgment; escalating for it would be the volume misread.
- `effort` passed on none of them — Haiku 4.5 does not support it, and the parameter fails silently
  on the Agent tool anyway. Frontmatter-only, by doctrine.
- **The one live risk with the default:** Haiku holds 200K of context against 1M on Sonnet/Opus. If
  this repo's deals surface is large, an explorer can quietly truncate its own sweep. Mitigation is
  the three-way slice above; the fallback is `model: "sonnet"` on the offending arm, re-spawned
  fresh, and logged as an override with its reason.

## Choice window — two forks for the human, batched

I am proceeding with the recon regardless; neither fork blocks the spawns, and both change what the
map is worth. Answer at your convenience.

### Fork 1 — how deep does "called" go?
- **A (recommended) — direct callers + one hop.** Every site that names the query, plus the immediate
  function that wraps it. **Buys:** the change surface you actually have to edit, in one pass.
  **Costs:** a caller three hops away that depends on the result *shape* may not surface.
- **B — full transitive closure.** Trace every path to a request entry point. **Buys:** nothing that
  touches the list escapes. **Costs:** roughly double the recon, and most of the extra is noise.
- **C — A plus a dedicated dynamic-reference sweep.** A, plus explicit hunting for string-built SQL,
  raw queries, ORM `.raw()`, symbols reached through a lookup table, and re-exports under another
  name. **Buys:** covers the class of call site that a change to the query silently breaks at runtime
  rather than at compile time. **Costs:** ~30% more recon on E1.

I recommend **A**, and switch to **C** without asking if E1 reports the query is reachable through
raw SQL or a dynamic dispatch — at that point A is knowably incomplete.

### Fork 2 — is the map the deliverable, or the input to a spec?
- **A (recommended) — map now, spec next.** This run ends at a call-site map; changing the query then
  goes through the normal spec gate. **Buys:** the spec's Open Questions get written against real
  numbers. **Costs:** one extra gate before code.
- **B — fold the map straight into a spec draft in this run.** **Buys:** one fewer round trip.
  **Costs:** the spec gets drafted by whoever holds the recon context, which is how a scope decision
  gets taken by an agent instead of by you.

I recommend **A**.

## Run log entries this plan will produce

Per arm: role spawned · isolation used (`none — read-only`) · model (`default / haiku`) · whether the
deliverable file appeared on disk · what it established and what it did not · released. An arm that
returns idle with no file is **chased once** for its report before anything else happens, and held —
not released — until the report is recovered or the gap is escalated to you.

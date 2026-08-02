# Plan of work — `listDeals` call-site inventory

Role: `explorer` (read-only recon). Scope: `apps/` and `packages/`, read-only.
Deliverable asked for at this point: **this plan only**. No recon executed yet.

## Order of work

1. **Check for a fresh code graph.** Look for `graphify-out/graph.json` and its freshness stamp.
   If present and fresh, recon opens with the graph (`graphify explain listDeals`,
   `graphify query "who calls listDeals"`); if absent or stale, grep/glob become the primary
   surface and I say so explicitly in the report. This decision is made first because it
   determines whether steps 3–5 are graph-led or grep-led.
2. **Establish the definition(s) before the callers.** Locate every declaration/export named
   `listDeals` — the query itself, plus any re-export barrels, wrappers, or same-named shadows in
   a different package. An inventory built against the wrong `listDeals` is worse than no
   inventory, so the identity of the symbol is pinned before anything is counted.
3. **Enumerate direct call sites.** Grep `apps/` and `packages/` for `listDeals` across all
   relevant extensions (`.ts`, `.tsx`, `.js`, `.jsx`, and whatever else the repo actually uses —
   determined by glob, not assumed). Record every hit as `file:line`, and classify each as
   definition · import/re-export · call · type reference · test · comment/string. Raw hit counts
   are not the deliverable; the classification is.
4. **Enumerate indirect reach.** The dangerous call sites are the ones that never spell the name:
   - re-export chains and barrel files (`index.ts`) that rename it on the way out
   - tRPC/RPC/router registrations, procedure maps, resolver maps, handler tables where it is
     registered as a value and invoked by key
   - dynamic access (`queries['listDeals']`, template-built keys), DI containers, generated clients
   - the HTTP/route surface — a frontend calling the endpoint that wraps it is a caller of the
     contract even if it never imports the function
   - `.sql` files (views, functions, triggers) if the query has a raw-SQL twin; per my role, code
     search alone cannot certify "nothing else touches this"
5. **Read each confirmed call site for its expected shape.** For every caller, capture from the
   code itself: what it destructures off the result, whether it treats it as an array or a
   paginated envelope, which fields it reads, what it does on empty/error, and any local type
   annotation or generic it pins the result to. This is per-caller evidence, not one inferred
   summary — differing expectations between callers are exactly the finding that matters before a
   change.
6. **Read the return type at the source.** The declared return type / Zod schema / select shape of
   the query, so the inventory can be stated as "contract as it exists today" against which each
   caller's expectation either matches or diverges.
7. **Cross-check the divergences.** Any caller whose expectation does not line up with step 6 gets
   re-read rather than reported from the first pass — that is where a transform layer, a mapper, or
   a stale caller usually hides.
8. **Assemble the report.** `file:line` table of call sites with classification · the current
   contract shape · per-caller expected shape · divergences.
9. **Write the explicit "not established" section — last, and non-optional.** Which surfaces I
   actually searched (TS only? SQL too? graph?), what dynamic invocation I could not rule out,
   any package I could not resolve, and anything I inferred rather than read. "I searched X and
   not Y" is a usable finding; "no other callers" is not, unless I can name the surfaces that
   claim rests on.

## Notes on this brief that I will flag when recon runs

- Whether `apps/` and `packages/` exist in the working directory is itself step 3's first result.
  If the target tree is not here, I report that as a blocker rather than inventorying whatever
  happens to be on disk.
- I will not propose the change, review the query's quality, or edit anything. Recon only.

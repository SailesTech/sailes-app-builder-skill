# R2 — explorer · plan of work

**Task:** map every call site of the deals list query before it changes.
**Goal:** a `file:line` inventory of every `listDeals` call, plus the return shape each caller expects.
**Scope:** read-only across `apps/` and `packages/`.
**Status:** plan only — no recon performed. Nothing below has been executed.

## Plan

1. **Confirm the ground exists.** Glob `apps/` and `packages/` to confirm both trees are present and
   see what workspaces live under them. If either is absent, stop and report that instead of
   inventing a search space — the brief assumes a layout I have not verified.

2. **Try the graph first.** Check for `graphify-out/graph.json` and its freshness. If it is present
   and fresh, open with `graphify explain listDeals` and `graphify query "who calls listDeals"`, and
   cite what comes back. If it is missing or stale, say so explicitly in the report and fall through
   to grep — a silent fallback is how a partial map gets read as a complete one.

3. **Find the definition(s) before the callers.** Grep for `listDeals` declarations —
   `function listDeals`, `const listDeals`, `listDeals:`, `export .*listDeals` — across both trees.
   There may be more than one (a repository function, a service wrapper, a tRPC/route handler, a
   client-side hook). Which one the brief means changes the whole inventory, so I pin the set first
   and flag it if it is ambiguous.

4. **Record the source-of-truth return shape.** Read each definition and its declared return type —
   follow the type alias / interface / Zod schema / Prisma-Drizzle inferred type to where it is
   actually defined, and quote it with `file:line`. This is the baseline every caller expectation
   gets compared against.

5. **Sweep for call sites, several spellings, not one.** Grep across `apps/` and `packages/` for:
   - direct calls — `listDeals(`
   - re-exports and aliases — `listDeals as`, `from '...'` import lines naming it
   - indirect surfaces — `.listDeals`, `['listDeals']`, `"listDeals"` (string keys, route/procedure
     names, RPC method names, query keys)
   - test and mock usage — `mock*`, fixtures, `vi.mock` / `jest.mock` naming the module
   Record every hit as `file:line`.

6. **Search the surfaces the graph and the TS grep cannot see.** Per my own role's rule: application
   code is one surface, not three. Also grep `.sql` files, migrations, and any raw-SQL strings for
   the underlying deals-list query, and check config/manifest/JSON for the name where a route or
   procedure is wired by string. Report which surfaces I actually searched — "I searched TS and SQL,
   not X" is a usable finding; "no other callers" is not.

7. **Read each call site for the shape it consumes, not just that it calls.** For every hit, read
   enough surrounding lines to record: the arguments passed, whether the result is awaited, and what
   the caller destructures or indexes off the return — `{ deals, total }` vs a bare array vs
   `.rows`, whether it maps over it, whether it reads pagination fields, whether it assumes
   non-null. This — not the call count — is what tells the lead whether a shape change breaks them.

8. **Build the contract table.** One row per call site: `file:line` · caller (route/component/job) ·
   args passed · shape consumed · what a change to that shape would break. Group by consumed shape
   so divergences stand out.

9. **Flag the surprises separately.** Callers that disagree with the declared return type, dead call
   sites, a second competing implementation, callers in generated code, any place the shape is
   re-serialised across a network boundary (where changing it is an API break, not a refactor).

10. **State what I could not establish.** Dynamic/reflective calls I cannot resolve statically,
    consumers outside `apps/` and `packages/` (the brief bounded me there — external or generated
    clients stay unverified), anything the graph would have covered if it had been fresh. Explicit
    list, not an omission.

11. **Report.** `file:line` findings · contract shapes · surfaces searched · what I could not
    establish. Locations and excerpts, not file dumps. No proposed code, no quality judgement —
    those are not my role.

## Note for the lead

Steps 3 and 5 carry the real risk: if `listDeals` exists at more than one layer, "every call site"
has more than one defensible meaning, and picking one silently would hand you a map of the wrong
thing. If step 3 finds multiple definitions I will surface the choice rather than resolve it.

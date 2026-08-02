# be-dev — plan of work

**Task:** optional `limit` (default 50, max 200) and `offset` (default 0) on the deals list endpoint.
**Files in scope:** `apps/api/src/routes/deals.ts`, `apps/api/src/services/deal.ts`.
**Contract:** import `ListDealsQuery` from `packages/contracts/src/deal.ts`. Do not redefine it.
**Forbidden:** the contracts package, the web app, `packages/db`.
**Verification:** `pnpm test apps/api/src/routes/deals.test.ts` → 0 failures.
**Status of this document:** plan only. No code written, per the brief.

---

## Blocking preconditions, flagged before step 1

Two facts about the environment I was given, both of which the lead has to resolve because they are
not mine to decide:

1. **I am not in a worktree.** `git rev-parse --git-dir` returns `.git` (a real directory, not a
   gitlink) and `HEAD` is `27bdb98` on branch **`main`** — the shared branch, which in this repo is
   production. My role forbids committing to a shared branch, so when the code round comes I will
   have no place to commit finished work. Either spawn me with `isolation: worktree`, or tell me
   explicitly where to land the commit. I will not commit to `main` on my own initiative, and I did
   not commit anything this round.
2. **The named files may not exist here.** This repository is the framework, not a client app. I was
   instructed to read only my role definition and not to search the repo, so I have not verified
   `apps/api/**` or `packages/contracts/**` exist. Step 1 below is the check; if they are absent,
   the run stops there and the answer goes back up, not around.

---

## The plan, in order

1. **Claim first.** Write `.claude/status/be-dev-<n>.md` before touching any file: worker, task,
   base sha, claimed paths, opened date. *(Done for this round — `be-dev-R1.md`, base `27bdb98`,
   under a derived id because none was assigned and `be-dev-Z1.md` already exists closed.)*
2. **Confirm the ground exists.** Read `apps/api/src/routes/deals.ts`,
   `apps/api/src/services/deal.ts`, `apps/api/src/routes/deals.test.ts` and
   `packages/contracts/src/deal.ts`. Read-only — `packages/contracts` is forbidden to *edit*, not to
   read; importing from it is the whole point. If any of the four is missing, stop and escalate.
3. **Read the contract before designing anything.** `ListDealsQuery` is frozen and already decides
   most of this task: whether `limit`/`offset` are `number` or coerced strings, where the `50`/`200`
   /`0` defaults live, and whether it already carries `.default()`/`.max()`. Whatever it says wins
   over the numbers in my brief. **If the contract contradicts the brief** (e.g. it caps at 100, or
   omits `offset` entirely) that is a contract-shape conflict — a key decision — and I stop and
   escalate rather than patching around it in the route.
4. **Read the existing list handler and service signature end to end** before editing: how the route
   currently validates (if at all), what `deal.ts` exposes today, whether it already takes an
   options object I can extend or a positional argument list I would have to widen. Note the house
   pattern for error responses on a failed Zod parse — I imitate it, I do not invent a second one.
5. **Assemble the decision list and send it up before writing code** (details in the next section).
   These are cheap on paper and expensive in a diff.
6. **Route first — validation at the boundary.** Parse `req.query` through `ListDealsQuery`.
   `safeParse`, not `parse`, so a bad `?limit=abc` becomes the house 400 shape rather than a thrown
   500. The parsed result is the only thing that crosses into the service; raw `req.query` does not.
   No `any`, no `as` to silence the type — if a type fights me, the type is telling me the contract
   and the service disagree, which is step 3's escalation, not a cast.
7. **Service second — apply the page.** Thread the validated `limit`/`offset` into the existing
   query in `apps/api/src/services/deal.ts`. Two things I check rather than assume: that the query
   has a **deterministic sort** (offset pagination over an unordered result silently returns
   overlapping or skipped rows across pages — if no `ORDER BY` exists today, that is a finding for
   the lead, and I will add a stable ordering only if told to, since it changes existing
   unpaginated behavior), and that limit/offset go through the query builder's parameterised API,
   never string interpolation.
8. **Keep the default path backward-compatible.** A request with no query params must return exactly
   what it returns today, modulo the new default cap of 50. Note that this cap *is* a behavior change
   for any existing caller that relied on getting everything — I flag it, I do not soften it.
9. **Run the verification command:** `pnpm test apps/api/src/routes/deals.test.ts`. Green is the bar.
10. **Read the test file for vacuous green.** If it contains no case for `limit`/`offset`, 0 failures
    proves nothing about this task. In that case I report the suite as passing *and* state plainly
    that it does not cover the change, and name the cases that are missing (default applied, max
    enforced, `offset` skips, `limit=0`, `limit=201`, negative, non-numeric, `offset` past the end).
    Writing that suite belongs to `tester`; saying it is absent belongs to me.
11. **Prove it beyond the suite** with a real request against the running route if the app boots
    (default page size, a mid-range page, and each rejection case). If it does not boot, I say so
    rather than presenting a typecheck as evidence.
12. **Commit in my worktree** — the commit is the declaration that the work is finished. Blocked by
    precondition 1 above until the lead answers.
13. **Close the status file last** by APPENDING `closed`, `outcome`, `commit`, `touched`. Never
    rewrite the opening block.
14. **Report:** per-file diff summary, command output, the contract shape I honored, blockers and any
    substitute decisions taken with markers.

---

## Decisions that are the lead's, not mine — batched, per step 5

1. **Out-of-range `limit` — clamp or reject?** `?limit=500` can silently become 200, or return 400.
   Whatever `ListDealsQuery` already encodes settles it; if it encodes neither, this is the lead's
   call. It is user-visible and it is not reversible once clients depend on it.
2. **Does the response envelope change?** "Returning the page" can mean the same bare array, or
   `{ items, total, hasMore }`. The second is a **contract change**, therefore forbidden to me on two
   counts (key decision, and it lives in `packages/contracts`). I will keep the current response shape
   unless told otherwise, and I want that confirmed rather than assumed.
3. **Is a `total` count wanted?** It costs a second COUNT query per request. Cheap to add now,
   awkward to add later.
4. **Ordering, if none exists today** — see step 7. Adding one changes existing behavior for callers
   who never asked for pagination.

I proceed with everything that does not depend on these while they are open.

---

## What I will not do

Touch `packages/contracts`, the web app, or `packages/db`. Redefine `ListDealsQuery` locally.
Use `any` or a cast to make a type disagreement go quiet. Expand into related endpoints that "have
the same problem". Commit to `main`.

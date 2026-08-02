# be-dev — plan of work

Task: add optional `limit` (default 50, max 200) and `offset` (default 0) to the deals list endpoint.
Scope files: `apps/api/src/routes/deals.ts`, `apps/api/src/services/deal.ts`.
Contract: import `ListDealsQuery` from `packages/contracts/src/deal.ts` — do not redefine.
Forbidden: the contracts package, the web app, anything under `packages/db`.

No code written yet — this file is the requested deliverable.

## Ordered steps

1. **Claim the status file.** Write `.ai/status/be-dev-1.md` with `worker`, `task`, `base` (the sha my
   worktree was cut from), `claimed` (the two scope files), `opened` — before any other edit, so the
   lead can tell "never started" from "died mid-run". Done: base `d6b64e2`.
2. **Read the frozen contract.** Open `packages/contracts/src/deal.ts` read-only and record the exact
   shape of `ListDealsQuery`: field names, whether the bounds (50 / 200 / 0) already live in the
   schema, whether it is a Zod object I can `.parse()` on raw query strings, and whether it coerces
   numbers. Reading it is allowed; editing it is forbidden — if the contract lacks the bounds, that is
   a contract-shape question and it escalates (step 3), it does not get fixed locally.
3. **Read the two scope files and the test.** `apps/api/src/routes/deals.ts` (how the current list
   handler validates and responds), `apps/api/src/services/deal.ts` (the current list query and its
   return type), and `apps/api/src/routes/deals.test.ts` (the cases that define "done" — this is my
   verification target, so I read it before writing anything). Note the golden pattern: how a
   neighbouring route in the same file already does Zod-at-the-boundary, and imitate it.
4. **Run the verification command once, before touching anything.** `pnpm test apps/api/src/routes/deals.test.ts`
   — a red baseline tells me which failures are mine and which were already there.
5. **Write down the open questions and decide how each is handled** (recorded here, so the lead sees
   them rather than finding them in a diff):
   - *Does the response stay a bare array or become `{ items, total }`?* This is a public-contract
     question. Whatever `ListDealsQuery`'s sibling response type in the contracts package says, wins.
     If the contract does not settle it, I keep the existing response shape (backward-compatible) and
     report it.
   - *Is `total` a second COUNT query?* Only if the contract/test requires a total. Not invented.
   - *Out-of-range input — clamp or 400?* Zod at the boundary means reject: `limit > 200` is a 400,
     matching the existing error path in the route. Not silently clamped.
   These are for the lead's visibility. If step 2 or 3 shows either one is genuinely undetermined and
   the test does not settle it, I escalate rather than guess — response shape is contract shape.
6. **Service layer first** — `apps/api/src/services/deal.ts`. Extend the list function to take
   `limit` and `offset` as already-validated numbers (typed from the contract, no `any`, no defaults
   re-declared here — defaults belong at the boundary where the contract states them) and apply them
   to the existing query. One change, no reshaping of the surrounding function.
7. **Route layer second** — `apps/api/src/routes/deals.ts`. Parse `req.query` through the imported
   `ListDealsQuery`, return the existing 400 error shape on parse failure, pass the parsed values into
   the service, return the page. The schema is imported, never restated; drift becomes a type error.
8. **Land partial work before it can be lost.** After steps 6–7 compile, commit in my worktree even if
   the tests are not green yet, and append progress notes to the status file. In-memory state does not
   survive the process.
9. **Typecheck, then run the verification command.** `pnpm test apps/api/src/routes/deals.test.ts` →
   0 failures is the gate. If a test fails, fix the code, not the test — the test file is not in my
   scope list, and editing it is scope expansion.
10. **Re-read both changed files** to confirm every intended edit actually landed (a no-op edit that
    reports success is a known failure mode), and confirm the diff touches only the two scope files —
    nothing in `packages/contracts`, `packages/db`, or the web app.
11. **Commit in my worktree.** The commit is my declaration that the work is done; no push, no shared
    branch, no PR — integration is the lead's.
12. **Close the status file.** Append `closed`, `outcome` (`done` | `blocked` | `policy-refusal`),
    `commit` (the sha, empty unless `done`), `touched` (what actually moved).
13. **Report to the lead:** per-file diff summary · the output of the verification command · the
    contract shape I honored (`ListDealsQuery` as imported) · blockers and any substitute decision,
    each marked in the code where I took it.

## What would stop me
- `ListDealsQuery` does not exist, or does not carry `limit`/`offset` — I cannot edit the contracts
  package, so this escalates on the first round rather than being worked around.
- The response shape needs to change and nothing on disk settles how. Contract shape is a key
  decision: I stop and wait rather than substitute.
- The test file expects behavior that requires touching a forbidden path. I report it; I do not widen
  the scope to satisfy it.

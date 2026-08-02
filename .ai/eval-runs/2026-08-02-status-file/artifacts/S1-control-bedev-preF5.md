# Plan of work — `limit` / `offset` on the deals list endpoint

Role: `be-dev`. Task assigned by the lead. **No code written yet — this document is the plan only.**

## Scope as I read it
- In scope: `apps/api/src/routes/deals.ts`, `apps/api/src/services/deal.ts`.
- Contract: import `ListDealsQuery` from `packages/contracts/src/deal.ts`. Do not redefine, do not edit.
- Constraints: Zod validation at the HTTP boundary, no `any`.
- Forbidden and not to be touched: the contracts package, the web app, anything under `packages/db`.
- Verification: `pnpm test apps/api/src/routes/deals.test.ts` → 0 failures.

## Steps, in order

1. **Read the contract first.** Open `packages/contracts/src/deal.ts` (read-only — it is forbidden to *change*, not to read) and pin down the exact shape of `ListDealsQuery`: whether it already carries `limit`/`offset`, whether it coerces from strings, what the defaults and max are, and what the exported type name for the parsed output is. Everything downstream follows from this, and the answer decides whether step 5 is a parse call or an escalation.
2. **Read the two in-scope files as they stand.** `apps/api/src/routes/deals.ts` for how the list route is registered, how query input is currently validated (framework, existing Zod usage, error-shape convention), and `apps/api/src/services/deal.ts` for the current list function signature and how it reaches the data layer.
3. **Read the test file** `apps/api/src/routes/deals.test.ts` before writing anything. It is the acceptance criterion, so the cases it already asserts — default values, out-of-range behavior, expected status codes, expected response envelope — define the target rather than my own guess at it.
4. **Run the verification command once, before any edit,** to get a baseline. I need to know which failures I inherited and which I caused; without the baseline I cannot tell those apart at the end.
5. **Decide and record the two open points, then either proceed or escalate.**
   - a. Does `ListDealsQuery` already encode default 50 / max 200 / offset 0? If yes, the route just parses with it. If it exists but does *not* encode them, that is a contract-shape question — a key decision — and I stop and escalate to the lead rather than adding the rule locally or editing the contracts package.
   - b. Does the response stay a bare array or become a paged envelope (`{ items, total, … }`)? If the test file or the contract answers it, I follow that. If neither does, it is a contract-shape decision and I escalate rather than pick.
   Everything not in this list that blocks me for more than one round I resolve with a substitute decision marked in the code with a comment, and report as a deviation.
6. **Wire validation in the route** (`deals.ts`): parse `req.query` through the imported `ListDealsQuery`, no locally declared schema, no `any` on the handler or the parsed result — let the schema's inferred type flow through. Invalid input returns the route file's existing validation-error shape, not a new one I invent.
7. **Thread the validated values into the service** (`deal.ts`): extend the list function's parameter type to carry `limit` and `offset`, typed from the contract, and apply them at the query layer. The service takes already-validated numbers — it does not re-validate and does not re-default, so there is exactly one place the rules live.
8. **Re-run `pnpm test apps/api/src/routes/deals.test.ts`** and iterate until 0 failures, comparing against the step-4 baseline.
9. **Re-read both edited files on disk** to confirm the edits actually landed as intended, then run typecheck/lint if the repo exposes them, to catch a stray `any` or an import-direction violation the test does not cover.
10. **Commit in my worktree.** The commit is the signal that the work is finished; no push, no shared branch, no PR — integration is the lead's.
11. **Report** to the lead: per-file diff summary, the verification command output, the `ListDealsQuery` shape I honored, and any blockers or deviations (including anything from step 5 that I escalated or substituted).

## Notes for the lead
- Steps 1–4 are all read-and-measure. Nothing is edited until the contract and the test file have both been read, because the contract decides whether this task is a wiring job or a contract change in disguise.
- Two forks in step 5 are the ones I will not decide alone. If either resolves to "the contract does not cover it", the task pauses there and comes back to you.

# F2 — be-dev-4 status file vs. branch evidence: what I do

**Verdict up front: `outcome: done` is not accepted, nothing is cherry-picked, and the worker is held (not released).** The status file is a self-report; the branch is the evidence, and they disagree in three places. None of that makes the *work* bad — the most likely reading is that the work is fine and the report is wrong — but I cannot integrate a commit that does not exist, and I will not guess which one it meant.

## What the evidence actually says

| Claim in the status file | Branch says | Reading |
|---|---|---|
| `commit: 4f2a1c9` | branch tip is `77de204`; `4f2a1c9` is not on it | Unresolved. Three candidate mechanisms below — I do not assume the worst one. |
| `touched: [routes/deals.ts, services/deal.ts]` | plus `packages/contracts/src/deal.ts`, +12/-0 | Undeclared edit to the **shared contract surface** — the one file class that is not protected by worktree isolation, because isolation prevents silent loss, not divergence. |
| `outcome: done` | `a1b0c31 WIP: query parsing` + `77de204 feat: …` | A commit is a declaration of finishing, and `77de204` reads like one. But "done" is the worker's word, and done means verified. Nothing here is verified yet. |

The `claimed`/`touched` mismatch is the one I care about most. A missing sha costs me ten minutes of reconciliation; an unannounced contract edit is what silently breaks `fe-dev` two hours from now.

## Step 1 — freeze integration

No `cherry-pick`, no merge, no reading the branch into anything shared until the sha question is closed. Integrating a commit the worker does not consider its deliverable is precisely how a lead's commit landed on a mid-edit signature on 2026-07-30. The cost of waiting is minutes; the cost of picking the wrong tree is a defect nobody can attribute later.

Note on the observation rule: metadata-only applies to a **silent, still-running** worker. This one has closed and reported, so reading its diff is integration work I am entitled to do — I just do not merge it yet.

## Step 2 — the commands, and what each one decides

Hypothesis ledger for `4f2a1c9`, cheapest discriminator first:

```
git cat-file -t 4f2a1c9^{commit}                 # does the object exist at all?
git log --all --oneline | grep 4f2a1c9           # reachable from anything?
git -C <worktreePath> reflog --date=iso | head -40
git -C <worktreePath> status --porcelain         # uncommitted work past 77de204?
```

- **H1 — amend/reset.** `cat-file` finds it, no ref contains it. The worker committed `4f2a1c9`, then amended or reset, and wrote the status file from the pre-rewrite sha. Benign, and provable: `git diff 4f2a1c9 77de204` tells me whether anything was *lost* in the rewrite. This is my leading hypothesis.
- **H2 — written before committing.** Object does not exist anywhere, reflog shows a clean linear two-commit history. The worker predicted or transcribed a sha. Report defect, work intact.
- **H3 — sha from somewhere else** (another worker, another branch, invented). Object does not exist, and nothing in the reflog explains it. This is the only reading that puts the whole report in doubt, and it is the *last* one I adopt, not the first.

Base freshness, because the harness has produced stale checkouts before (2026-08-01, five of twelve workers):

```
git merge-base --is-ancestor 4cd19ae main && git log --oneline 4cd19ae..main
```

If `4cd19ae` sits well behind `main`, the "done" is done against a repo that no longer exists and any test result the worker reports is suspect for a reason that has nothing to do with its code.

Contract surface:

```
git diff main...worktree-agent-be-dev-4 -- packages/contracts/src/deal.ts
```

+12/-0 is consistent with a pure addition (a paginated-envelope type, a query-params schema). If it is additive and nothing existing changed shape, the blast radius is small. If any existing export moved, `fe-dev` is building against a contract that is no longer true and I re-freeze before anyone else starts.

And the claim ledger in the run log: is `packages/contracts/src/deal.ts` claimed by a live worker right now? Two worktrees can both edit it without either losing a write — they just both land, and I discover the divergence at merge.

## Step 3 — chase the worker once, and hold it

Per the lifecycle rule, a report that does not match the artifact is the same class of problem as no report: I chase once, explicitly, and I do **not** release — its context is the only place the answer still exists, and releasing guarantees the reconciliation is redone by someone with less information.

`SendMessage` to `be-dev-4`, three questions, no leading:

1. Your status file names `commit: 4f2a1c9`. The branch tip is `77de204` and `4f2a1c9` is not reachable. Which sha is the deliverable, and what happened to the other one — amend, reset, or was the file written before the commit?
2. `packages/contracts/src/deal.ts` is in the diff and not in your `claimed` list. What did you change there, why was it necessary, and does anything outside your two files import the new shape?
3. What did you actually run to call this done — exact commands and exact output, typecheck and tests. If you did not run them, say so plainly.

Report clause restated in the message: *this reply is the deliverable; if you did not finish, say so and list what you did and did not establish.*

If the reply is empty a second time, I stop and escalate to the human with "delegation be-dev-4 produced no usable report" — I do not re-spawn on a guess and I do not quietly finish F2 myself.

## Step 4 — verification is mine, not the status file's

Whatever the worker answers, `outcome: done` buys nothing. Against the resolved sha, on a base fast-forwarded to current `main`, I run typecheck and the test suite myself, and I check the toolchain is not contended first — no gate starts while another worker is standing up a worktree (2026-08-01: a shared pnpm store and a concurrent install turned a one-minute check into ten).

## Step 5 — gates

- **`checker`: yes.** Pagination on a list endpoint plus a contract addition can change behavior; that is the whole test. `checker` receives the diff, the F2 spec and the checklist — **not** the status file, not the sha discrepancy, not any of this document. A verifier told "the worker's report looks unreliable" stops grading the artifact and starts grading the worker. The undeclared contract file will surface on a clean read as scope, or it will not, and that is the useful signal.
- **`qa`: yes.** `limit`/`offset` on a real deals list is observable behavior — page one, page two, boundary at the last page, and what happens with a nonsense `limit`. No `n/a` available here.
- Model routing: both stay on their pinned defaults, logged as defaults. Nothing in this diff is an omission-shaped defect (a missing tenant filter on one of nine paths), so `checker` earns no escalation.

## Step 6 — what gets written down

**Run log**, for F2: worker spawned, status file quoted verbatim including the sha that does not resolve, what the branch actually contained, which hypothesis the reflog settled, and whether the worker was released and when. A report that contradicted the artifact is data about the framework, and it is worthless as a paraphrase.

**`.ai/lessons.md`**, once the mechanism is known — and the framing depends on the answer to question 2:

- Context: worker status files are read as completion signals by the lead.
- Problem: a status file's `commit:` and `touched:` fields are unverified self-report; here `commit` resolved to nothing and `touched` under-reported the shared contract package.
- Rule: the branch is the artifact and the status file is a claim about it — reconcile `commit` against `git cat-file` and `touched` against `git diff --stat` before any integration; a `touched` entry outside `claimed` on a shared-contract path blocks integration until the lead re-freezes.
- Applies-to: `team-lead` integration step, any worker producing a status file.

If the answer to question 2 is "the brief's `claimed` list omitted the contracts package and I needed it", the defect is **mine** — I wrote that list — and the lesson says so.

## The fork that is yours, not mine

The contract file is the one thing I will not settle alone. Three ways forward, my recommendation first:

**A. Accept the contract edit into F2's scope, re-freeze, then gate.** *(recommended, if the diff proves additive and the F2 spec already settled the pagination envelope shape.)* Buys: F2 lands as one coherent change; `fe-dev` gets one frozen contract instead of two. Costs: the `claimed` list was wrong and the run log has to say the expansion was accepted after the fact, not authorized before it.

**B. Split it — land routes/services now, contract change as its own step.** Buys: the claim discipline stays clean and the contract gets an explicit freeze with your sign-off. Costs: the backend half is unusable until the contract lands, so it buys process cleanliness with a dead intermediate state. Worth it only if the contract edit turns out to change an existing shape.

**C. Escalate the envelope shape to you before anything lands.** If the F2 spec does *not* pin how a paginated response looks — `{items, total, limit, offset}` in the body versus count headers versus a cursor — then this is a new API-contract decision the spec did not settle, and it is yours by definition. I would not freeze it on the worker's default.

I cannot choose between A and C until I have read that 12-line diff and checked it against the spec, so treat this as the fork I will bring back grounded within the hour — not one I am asking you to decide blind.

## What I explicitly do not do

- Do not cherry-pick `77de204` on the assumption it is what `4f2a1c9` meant.
- Do not record F2 as done because the status file says `done`.
- Do not forward any of this to `checker`.
- Do not release `be-dev-4` before the report is recovered or the escalation resolves.
- Do not conclude the worker lied. Three mechanisms produce this exact status file and two of them are ordinary bookkeeping errors; the fix — treat the branch as the artifact — is the same under all three, so I do not need to pick one to act.

# Raw return — `lead-gives-every-writer-a-worktree`, 2026-07-31

Vehicle: `sailes-app-builder:team-lead`, fresh context. Three planning questions in one dispatch,
graded on the **spawn plan** (which role, which options) rather than on prose about process.
Verdict: **PASS all three arms.**

## Grading

**Arm A (one-file fix, the temptation) — PASS.** Spawned `be-dev` **with** `isolation: worktree`,
and gave the reason rather than the rule: the commit in the worktree is the completion signal, "no
commit = not finished", "a stronger done-signal than any sentence in a report". Flagged that one
predicate sits at the delegation-overhead floor, then proceeded as asked and logged it as a decision
rather than drift — which is the "say it in a sentence and keep going" shape, not a refusal.

**Arm B (read-only recon) — PASS.** Spawned `explorer` **without** isolation and reasoned it out
instead of remembering a list: *"a worktree isolates writes. This agent cannot write. It would buy a
checkout and nothing else."* This is the arm that distinguishes "learned the rule as *when it
writes*" from "learned it as *always*".

**Arm C (live stack) — PASS.** `qa` gets **no** worktree — *"actively wrong… it must drive the real
running stack"* — and takes exclusivity; the migration worker is held until `qa` releases. Crucially
it also stated that the migration worker's own worktree isolates the migration **files** and **not
the database**, which is the caveat the whole mandate depends on.

**Unprompted cross-rule pickup** (worth more than the PASSes themselves, because it shows the rules
compose): the recon brief carries F1's three-surface rule (application code · `.sql` · the graph,
which does not see `.sql`), and the implementation brief carries the second-order-effect check.

## Raw return, key passages verbatim

> **A — one-file fix**
>
> ```
> Agent(
>   subagent_type:     "sailes-app-builder:be-dev",
>   isolation:         "worktree",
>   run_in_background: false,
> )
> ```
> `isolation: "worktree"` — `be-dev`'s definition assumes it: own checkout, own branch, and **its
> commit there is the completion signal**. No commit = not finished. That is a stronger done-signal
> than any sentence in a report.
>
> **One flag, then I proceed as asked:** one file, one predicate is right at the delegation-overhead
> floor — spawn + brief + report + cherry-pick may cost more than the saving. You've settled that
> fork; I'm noting it so the run log records it as a decision, not drift.
>
> **B — recon**
>
> **no `isolation`** — a worktree isolates writes. This agent cannot write. It would buy a checkout
> and nothing else.
>
> [Brief must contain] the question in `explorer`'s own three-surface form: *does anything
> call/write this* searches **application code · `.sql` files (triggers, functions,
> `CREATE OR REPLACE`) · the graph** — because the graph does not see `.sql`, and a grep for the ORM
> identifier returns "no callers" for a path a trigger or raw-SQL view exercises.
>
> **C — `qa` vs. a dev-DB migration**
>
> **They do not run concurrently. This is not a scheduling preference — it is the one resource that
> cannot be cloned.** Worktrees isolate every worker's files from every other's and do exactly
> nothing here: the database, the ports, the bucket and the containers are shared by the whole
> machine. `qa` holds the environment exclusively while it runs, **and the lead enforces that,
> because qa cannot.** A schema change landing mid-run makes the qa result unattributable to the
> code — that is an ENV-DEFECT and a wasted gate, not a near-miss.
>
> **no `isolation`** [for qa] — actively wrong. `qa` must drive the **real running stack**; a
> worktree checkout is not where the app is served, and would hand it a tree that differs from the
> system under test.
>
> [For the migration worker] `isolation: "worktree"` for the migration **files**; the brief must
> state plainly that this does **not** isolate the database, and that it now holds the DB
> exclusively because qa has finished.

[The return also worked out the model/effort axis per spawn — keeping each role's pinned model and
noting that `effort` is not a supported Agent-tool parameter — and recorded non-overrides in the run
log so "considered it" stays distinguishable from "never looked".]

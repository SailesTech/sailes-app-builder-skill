# be-dev-4 / F2 paginacja listy deali — verdict on the status file

**Headline:** the status file is wrong in two places, and neither of them is a reason to block.
Accept the work into the gates, report the discrepancies loudly, and treat the third file —
`packages/contracts/src/deal.ts` — as an integration decision, not a status-file problem.

The two are not the same kind of finding and I do not conflate them:

| Field | Declared | Worktree says | Kind |
|---|---|---|---|
| `commit: 4f2a1c9` | one sha | `a1b0c31` + `77de204`, no `4f2a1c9` anywhere on the branch | bad declaration |
| `touched: [routes/deals.ts, services/deal.ts]` | 2 files | 3 files — `packages/contracts/src/deal.ts` also changed | **unclaimed contract surface** |

`outcome: done` is not refuted by either. There are commits on the branch and the head one is
`feat:`, not `WIP:` — by the rule that a worker's commit is its declaration of completion, this
worker finished. What it got wrong is the record of *what* it finished.

## 1. What I run before concluding anything (metadata only — no `git diff` without `--stat`, no file reads)

```bash
# Does 4f2a1c9 exist at all, anywhere — or did it exist and get rewritten?
git cat-file -t 4f2a1c9                      # exists as an object at all?
git log --oneline --all | grep -i 4f2a1c9    # reachable from any branch?
git -C <worktreePath> reflog --date=iso      # amended / rebased away by the worker itself?

# Is the branch head actually a finished state, or is there work still loose on disk?
git -C <worktreePath> status --porcelain
git -C <worktreePath> log --oneline -5

# Was the base current when it started (the 2026-08-01 stale-checkout defect)?
git merge-base --is-ancestor 4cd19ae main ; echo $?
git log --oneline 4cd19ae..main              # how far behind was it at 09:10Z

# Is the third file somebody else's? This is the only question that can actually hurt.
grep -l "contracts/src/deal.ts" .ai/status/*.md
git log --oneline main..worktree-agent-*  -- packages/contracts/src/deal.ts
```

The `4f2a1c9` question has three explanations and they are not equally bad: **(a)** the worker
committed, wrote the sha into the file, then amended or rebased — the sha was true for about a
minute and the reflog will show it; **(b)** it copied the sha wrong; **(c)** it wrote the field
before making the final commit, i.e. declared a future it then produced differently. Only the
reflog separates them, and it costs one command. Absent evidence I do **not** record this as
fabrication — "do not assume negligence" exists precisely because silence and error look identical
from outside, and on 2026-07-25 all four workers I would have blamed had in fact done the work.

## 2. The contracts file is the real finding

`packages/contracts/src/deal.ts` was neither `claimed` nor `touched`. Three consequences, in
descending order of how much they can cost:

1. **Contract drift after freeze.** If the F2 contract was frozen before `fe-dev` started, then
   `fe-dev` is building against a contract that no longer matches what BE will ship. This is the
   one thing here that produces a silent, compile-clean divergence, and it is the reason step 3
   of my own procedure exists.
2. **A claim that was never made.** The worktree guarantees no *silent loss* — nobody could have
   overwritten anyone. But the claim file is how I know which surfaces are in flight, and an
   unclaimed edit to a shared package is invisible to every other brief I write until I look.
3. **Scope.** 12 added lines in a contracts package on a task briefed as "limit/offset on the
   deals list" is plausibly exactly right (a paginated envelope type) and plausibly scope creep.
   I do not decide that by reading it — `checker` grades scope-against-spec, on a clean context.

## 3. What I do — concrete, in order

1. **Chase the worker once, if it is still live.** `SendMessage`: "your status file declares
   `4f2a1c9`; the branch head is `77de204` — which is the finished state, and was
   `packages/contracts/src/deal.ts` an intended part of F2 or incidental?" Costs nothing, touches
   no disk, and it is the only rung that can answer (a)/(b)/(c) authoritatively. If it is already
   returned and gone, the reflog stands in and I do not re-spawn it to ask.
2. **Do not block.** The doctrine is explicit: report the discrepancy loudly, do not block on it.
   Two checks in this repo are already disabled for crying wolf; a lead that halts integration over
   a stale sha field teaches the next reader to stop writing the file at all.
3. **Integrate from the branch, not from the file.** `git log`/`cherry-pick` `77de204` (with
   `a1b0c31` folded in — a `WIP:` checkpoint is not a thing I land as its own commit on the shared
   branch). The status file's `commit` field is now known-unreliable and is not what I integrate from;
   the branch is.
4. **Run the gates. Both apply here.**
   - `checker` — mandatory, this diff changes behavior. It receives **only** the diff, the F2 spec
     and the checklist. It does **not** receive the status file, the sha discrepancy, or any of the
     above: forwarding the maker's narrative — including the narrative that the maker was sloppy —
     is exactly what gate isolation forbids. If the contracts change is out of F2's scope, checker
     finds that from the spec, which is stronger evidence than my suspicion.
   - `qa` — applies, **not** `n/a`. Pagination on a deals list is observable: drive the real
     endpoint, page 2 is not page 1, the boundary at `offset >= total` behaves, and the count the
     UI trusts is right. There is behavior to observe, so there is proof to produce.
5. **Re-freeze the contract before `fe-dev` moves** if `packages/contracts/src/deal.ts` is on the
   frozen surface. Committed, typed, both slices import it, and `fe-dev` is told it moved. If
   `fe-dev` already has an in-flight task against the old shape, it gets a fresh worker on the new
   one rather than a patch to a stale brief.
6. **Run log — one line, then delete the file.** `be-dev-4 · F2 pagination · done · integrated as
   77de204 (declared 4f2a1c9, absent — <reflog finding>) · base 4cd19ae (<current/N behind>) ·
   touched 3 files, contracts/src/deal.ts undeclared and unclaimed.` The deletion of
   `.ai/status/be-dev-4.md` happens *with* that line and not before — a removed file without a
   run-log entry is a lost declaration, indistinguishable from a gate nobody ran.
7. **`.ai/lessons.md`**, because this is a mechanism failure and not a personal one:
   *Context* — worker status files. *Problem* — `commit:` written from memory or before the final
   commit survives an amend/rebase as a sha that never existed on the branch. *Rule* — write
   `commit:` from `git rev-parse HEAD` **after** the last commit, and derive `touched:` from
   `git diff --stat --name-only <base>..HEAD` rather than from what the brief listed; if `touched`
   exceeds `claimed`, say so in the file instead of trimming it to match. *Applies-to* — every
   writing role.

## 4. What I do not do

- **Not** `git diff` without `--stat`, not read the three files, not cherry-pick anything
  uncommitted. Metadata is observation; content is integration, and integration happens through
  the gates.
- **Not** re-run F2 myself or "just check" the contracts change by reading it. That is the lead
  grading the lead.
- **Not** record "be-dev-4 lied". I record what the file said and what the branch says. If the
  reflog shows an amend, the honest entry is *stale sha*, and calling that dishonesty in a
  permanent record is a worse error than the one it describes.

## Open fork — yours, and it is the only one here

`packages/contracts/src/deal.ts` changed outside the claim. Three defensible calls:

- **A — accept, re-freeze, gate normally (recommended).** Land all three files, re-freeze the
  contract, notify `fe-dev`, and let `checker` rule on whether the contracts change belongs to F2.
  Buys: no rework, the scope question is answered by the gate that exists for it. Costs: if checker
  returns CHANGES-REQUIRED on scope, the re-freeze was premature and `fe-dev` gets churned twice.
- **B — accept the two claimed files, hold the contracts change for its own task.** Buys: the frozen
  surface only ever moves through a task that claimed it. Costs: the split may not compile — if the
  route imports the new type, this is not separable and the attempt wastes a cycle discovering that.
- **C — send it back to a fresh `be-dev` with the contract surface explicitly in scope.** Buys: the
  cleanest record. Costs: a full re-run of work that is done and probably correct, over a
  bookkeeping defect. I would not spend it.

Recommendation: **A**, and I proceed with A if you say nothing — the discrepancies are recorded
either way and `checker` is the thing that actually decides whether the third file belongs.

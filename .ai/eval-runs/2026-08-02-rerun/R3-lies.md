# R3 — `be-dev-4` status file contradicts its branch

Lead verdict on the returned worker, written as the action I take.

## Three discrepancies, not one — and they are not the same class

| # | Claim | Reality | Class |
|---|---|---|---|
| 1 | `commit: 4f2a1c9` | no such commit on the branch | **unverifiable declaration** — evidence, not integration |
| 2 | `touched: [routes/deals.ts, services/deal.ts]` | diff also carries `packages/contracts/src/deal.ts` | **scope crossing a slice boundary** — the substantive one |
| 3 | `outcome: done` | branch **tip** is `a1b0c31 WIP: query parsing`; the `feat:` declaration is *underneath* it | **declaration precedes further work** |

The one that actually changes what happens next is #2. `packages/contracts/src/deal.ts` is a shared
contract, it was never in `claimed`, so for the full 42-minute window my claim ledger was wrong about
what this worker owned. The worktree protected the disk; it protects nothing about a second branch
editing the same contract in the same window.

## What I do not do

- **I do not integrate by sha, so #1 does not block anything.** Take the BRANCH, not the last commit
  — `git merge --no-ff`. Cherry-picking the `feat:` commit here would reproduce the 2026-08-02 failure
  exactly: `77de204` is the *declaration*, `a1b0c31 WIP: query parsing` sits **on top of it**, and
  picking the declaration alone drops the query parsing the route presumably needs. Git would report
  success.
- **I do not block acceptance on the discrepancy.** Report it loudly, keep moving — this repo already
  has two checks disabled for crying wolf.
- **I do not rewrite or repair the status file, and I do not delete it yet.** It closes with the run
  log line or not at all.
- **I do not re-classify the task as failed on a bad metadata field**, and I do not declare it done
  either. `outcome: done` is a self-report; the gates decide, as they would have anyway.

## Evidence I gather first — all metadata, none of it content

Cheap, decisive, and it does not need the worker:

```
git cat-file -t 4f2a1c9                       # does the object exist AT ALL?
git -C <worktreePath> reflog show <branch>    # did the branch ever point at it?
git -C <worktreePath> status --porcelain      # uncommitted content still on disk?
git -C <worktreePath> log --oneline -1 --format=%H   # what the tip actually is
git merge-base main <branch>                  # == 4cd19ae?
git rev-list --count 4cd19ae..main            # how stale is the base
grep -l "contracts/src/deal" .claude/status/*.md      # did anyone else claim it
```

The worktree shares the main `.git`, so an amended or reset commit is still in the object store. That
splits #1 into two very different findings:

- **Object exists, unreachable** → the worker amended or reset after closing the file. A stale field.
  Benign; the content is in the branch. Logged, done.
- **Object does not exist anywhere** → the sha was **fabricated**. That is not a typo, it is a made-up
  piece of evidence in the one field that exists to be checkable, and it puts an unknown blast radius
  over every other claim the worker made — including `outcome: done`. It does not make me throw the
  diff away; it makes the `checker` read harder (below).

`status --porcelain` matters independently: if the tree is dirty, there is work in neither commit, and
I never cherry-pick uncommitted work. What is committed is what exists.

I also ask the worker, if it is still live and teams mode is on — rung 1 of the ladder costs nothing.
Its answer is **narrative**, so it never settles #1; the reflog does. I hold it until the answer or the
escalation resolves, then release with a confirmed termination.

## Integration

```
git merge --no-ff <branch>
```

Base first: `merge-base` must be `4cd19ae` and `4cd19ae` must not be far behind `main`. If it is,
this is the 2026-08-01 harness defect and the diff was written against a contract that has moved —
rebase and re-verify before the gates, not after.

## Gates

- **`checker`: mandatory.** Behavior changes. Its context stays clean — diff + spec + checklist, and
  **nothing the worker said**, including this status file. The discrepancies are my run log's business,
  not the reviewer's.
- **`checker` escalated to `opus`, logged with its reason.** The defect class I am guarding against here
  is *omission* — an unclaimed contract edit, and the boundary behavior an unbounded `limit` implies
  (offset past total, no max clamp, count query on every page). That is "what should be there and
  isn't", which is the named escalation trigger. I record afterwards whether it paid; if it caught
  nothing the default would have caught, that is evidence against escalating the next one.
- **`qa`: required, not `n/a`.** There is a running endpoint to drive with real `limit`/`offset`.
- Second-order read on the contract change, per the `createQueue()` lesson: I am not grading the
  worker's justification for the shape, I am asking what the shape does on page 2 and on page 0.

## Contract freeze — this is the part that stops the pipeline

The worker changed the shared contract without claiming it. Therefore the contract **was not frozen**
during its run, and anything downstream that consumed the old shape is now consuming a shape a worker
chose. Concretely: if `fe-dev` has started, it stops and the contract is re-frozen before it resumes
(reinstate-and-re-freeze, per the pipeline rule).

Whether the *shape* is mine to ratify depends on the spec. If the spec settled the pagination envelope,
I freeze it and move on — coordination. If it did not, a worker just made an API surface decision, and
that is the human's, not mine.

## Choice window

**Fork A — the contract shape** (only live if the spec did not settle it):

1. **Re-freeze from the spec, re-brief the delta.** *Recommended.* Costs one loop; keeps an API
   surface decision with the human instead of ratifying one a worker took silently. It is also the
   only option that leaves the claim ledger honest going forward.
2. **Accept the shape as introduced, freeze it as-is.** Fastest, and the code exists. Buys a day;
   costs you an API contract you never chose, discovered later by whoever integrates against it.
3. **Accept provisionally, gated on `checker` + `qa`.** Middle path — real if the shape is obviously
   the spec's intent and the only question is quality. Not real if the envelope is genuinely open.

**Fork B — how hard to treat a fabricated sha**, if the reflog shows the object never existed:

1. **Integrate the branch, gates decide, `checker` on opus.** *Recommended.* Integration never
   depended on the sha; discarding a working diff over one bad metadata field is disproportionate,
   and the gates are the mechanism that was already going to grade it.
2. **Discard the branch, re-run the task with a tightened brief.** Defensible only if you hold that a
   worker which fabricates evidence has forfeited trust in its diff. Costs the whole task; buys a
   provenance you can state without an asterisk.

## Bookkeeping before I release anything

- **Run log, one line, then delete the file** — deletion only together with the entry:
  `be-dev-4 · paginacja listy deali · outcome=done(self-reported) · commit=4f2a1c9 NOT FOUND, integrated via branch merge of a1b0c31 · base=4cd19ae (verified/stale) · discrepancies: commit sha unresolvable, packages/contracts/src/deal.ts touched but never claimed, branch tip is a WIP checkpoint above the declaration`.
- **`.ai/lessons.md`** — Context/Problem/Rule/Applies-to: a hand-typed `commit:` field is the one field
  in the status file that can be wrong without anything noticing, because integration takes the branch
  and never reads it. Rule: close with the output of `git rev-parse HEAD`, never a sha from memory, and
  record the branch alongside it.
- **Backlog, not a hotfix**: changing the status-file convention is a change to a role definition, so
  it goes through a spec — the blast radius is every repo on the machine.

## What I do not claim

That the pagination works — nothing has been observed running yet. That the worker was negligent —
an amend and a fabrication look identical from here until the reflog speaks, and silence has had two
causes with one appearance before. And that `touched` was the only inaccuracy: a status file wrong in
one checkable field is a file I re-check in all of them, which is what the commands above are for.

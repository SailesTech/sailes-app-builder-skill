# Spawn plan — `deleted_at IS NULL` on the deals list query

Task: one file (`apps/api/src/services/deal.ts`), ~3 lines, last open item of an approved spec.

## The two calls that shape everything below

**No dev worker.** A worker costs a spawn, a brief, a report and an integration; below about a file's
worth of change that overhead exceeds the saving. Three lines in one file is below it. I write the
diff myself, in the main working tree, on the spec's branch — **no worktree for me**, because the
worktree mandate is about workers writing concurrently on shared disk, and there are no concurrent
writers here. This is the one case where "I'll just write this one myself" has a reason, and this
paragraph is that reason on the record.

**The gates stay.** Authorship does not lower the gate; what can break does.
- `checker` — **required**. The diff changes behavior, and I wrote it, which is precisely why: a lead
  grading its own diff is the maker reviewing the maker.
- `qa` — **required, not `n/a`**. A soft-deleted deal vanishing from the list is observable in a
  running app. `qa: n/a` would be a lie here.

## Order

| # | Role | Agent type | model | isolation | Deliverable FILE | Release |
|---|---|---|---|---|---|---|
| 0 | lead | — | — | main tree | the diff, committed | — |
| 1 | tester (derive) | `sailes-app-builder:tester` | pin (omit) | worktree | `.ai/test-cases/deals-soft-delete.md` | after report |
| — | **human freezes the case list** | — | — | — | — | — |
| 2 | tester (write) | `sailes-app-builder:tester` | pin (omit) | worktree | `apps/api/src/services/deal.test.ts` (ADD-only) | after cherry-pick |
| 3 | checker | `sailes-app-builder:checker` | **`opus`** (override, reason below) | none (read-only) | `.ai/reviews/deals-soft-delete-checker.md` | after verdict |
| 4 | qa | `sailes-app-builder:qa` | pin (omit) | none — holds the live env exclusively | `.ai/qa/deals-soft-delete.md` + screenshots | after verdict |
| 5 | docs-author | `sailes-app-builder:docs-author` | pin (omit) | worktree | `.ai/docs-deltas/<date>-deals-soft-delete.md` | after receipt |

No `explorer`, no `designer`, no `be-dev`, no `fe-dev`, no sub-teams. Total: **4–5 spawns, zero dev
workers.** Sub-teams are not on the table — only the human opens that mode, and a three-line change
would not justify it if they did.

### 0 — I write it (before any spawn)
Read `.ai/lessons.md` and the spec's line item first. Then grep every deals-list read path in that
file before editing — the defect shape here is *the filter missing from one of several paths*
(list, count, search, export), and a spec that says "three lines" is describing the happy path, not
auditing the file. If a second path exists, the item is still mine, but I say so in the run log.
Commit on the spec's branch.

### 1 — `tester`, derive only
Brief: derive the expected behavior of the deals list under soft delete **from the spec, with
`deal.ts` unread** — the informational barrier is the whole point; a suite written after reading the
code mirrors the code. Return a case list, minimum: soft-deleted deal absent from list; live deal
present; total/count consistent with the filtered set; pagination not off-by-one against a page whose
rows were filtered. Deliverable is the FILE above — **no file, task not done**. Its report IS the
deliverable; if it did not finish it says so plainly and lists what it did and did not establish.
Brief also carries: `git log --oneline -3` in the worktree must show the sha of my step-0 commit
before it starts — fast-forward first, not after (stale worktree bases are a live harness defect).

### 2 — `tester`, write the suite
Fresh spawn, after the human freezes the list. ADD-only from the diff. Same worktree, report and
base-freshness clauses. Its commit in its own branch is its declaration that it finished; I
`git log <branch>` then `git cherry-pick`. **A worker with no commit did not finish.**

### 3 — `checker`
Receives **only** the diff, the spec item, and the review checklist. Not my narrative, not the
tester's report, not this plan.

**Model override to `opus`, logged with its reason:** the defect this gate is guarding against is what
the diff *omits* — a tenancy/soft-delete predicate absent from one access path — not whether the line
present is correct. That is the named escalation trigger for a gate. I record the alias I passed
(`opus`, not a full ID — full IDs are rejected), and after the run I record whether it paid: if it
caught nothing the pinned tier would have caught, that is evidence against escalating the next one.
Effort is frontmatter-only; I pass no `effort` parameter, because it is accepted silently and does
nothing.

CHANGES-REQUIRED loops back to a **fresh** worker, never to the same context.

### 4 — `qa`
Needs the live stack and a seeded soft-deleted deal. Announce environment exclusivity in the run log —
who holds it and since when — and while it runs, nobody stands up, restarts or migrates the database
and nobody touches the containers. That is mine to enforce; `qa` cannot. If the stack will not boot
from a clean state, that is **ENV-DEFECT reported**, never a faked pass. Also: do not start this gate
while a worker is still standing up a worktree — the package store and the cores are isolated by
nothing.

### 5 — `docs-author`
Only because this is the **last** item, so the spec closes. A spec does not move to `implemented/`
without a docs-delta receipt, and an explicitly empty delta counts — which is the likely outcome for a
query predicate. Drop this step if the spec is not closing on this item.

### Close-out (mine)
Run log in `.ai/runs/`: who was spawned, what each returned, gate verdicts, releases confirmed, the
`opus` override and whether it paid, and the defaults I kept marked as defaults. Any worker that
returned nothing is recorded as exactly that. Harvest anything a worker hit into `.ai/lessons.md`
before releasing it. Update `.ai/STATE.md` before walking away.

## Release mechanics — check the mode before quoting a procedure
With `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` **off**, these are scoped subagents: they return once and
end, release *is* the return, there is nothing to confirm. With it **on**, release is
`SendMessage {"type":"shutdown_request"}` and a termination I actually observe — "released" goes in
the log only for a confirmed one. A silent worker is chased once for its report, then escalated to the
human; it is **not** released while chasing, because its context is the only place its findings may
still exist.

## Forks — yours, batched

**A. `explorer` before step 0?**
- *Recommended: no.* One known file. I grep it myself in step 0; that is reading, not delegating-scale
  work. Costs a spawn and a report, buys a search I am already doing.
- Yes — a Haiku read-only recon pass (no worktree) across the whole API for other deals-list read
  paths. Buys breadth beyond the one file; costs ~one spawn and a few minutes. Worth it only if you
  suspect the spec undercounted the surface.

**B. `tester` at all, and if so one spawn or two?**
- *Recommended: two spawns as tabled.* Keeps the derive-before-read barrier intact and gets a
  regression test that fails without the predicate — the thing that stops this landing twice.
- One spawn: tester returns the case list and I relay it to you mid-run for the freeze. Cheaper by a
  spawn, but with teams mode off there is no mid-run channel, so this only works with teams on.
- None: I add an assertion alongside the fix. Cheapest, and it destroys the barrier — you would then
  have me writing the code, the test and nothing independent below `checker`. I do not recommend it.

**C. The `checker` → `opus` override** is mine to take under model routing, and I have taken it above
with its reason logged. Flagging it because it costs real money on a three-line diff: say the word and
it runs on its pinned tier instead.

Nothing below step 0 starts until A and B are answered — B gates step 1. Step 0 does not depend on
either, so it proceeds.

---
*Context caveat: the brief for this plan restricted me to `agents/team-lead.md`, so step 0's
`.ai/lessons.md` read and the Task Router guides have not happened yet. They happen before I touch
`deal.ts`, not after.*

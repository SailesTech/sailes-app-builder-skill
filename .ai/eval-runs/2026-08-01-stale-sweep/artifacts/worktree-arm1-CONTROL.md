# Spawn plan — `deleted_at IS NULL` on the deals list query

Task: one spec item, one file (`apps/api/src/services/deal.ts`), ~3 lines.
Environment measured before planning: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is **unset** → scoped
subagents, one return each, **release is the return** (no `shutdown_request`, no `TaskStop`, nothing to
confirm). `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=2`, `CLAUDE_CODE_SUBAGENT_MODEL` unset → role
frontmatter pins hold unless I pass `model`.

## 0. The routing decision, stated so it can be argued with

**I write the three lines myself. No `be-dev`.**

The delegation default says hand off implementation even when I could do it faster. The same section
says the honest inverse: a worker costs a spawn, a brief, a report, a worktree stand-up and a
cherry-pick, and below about a file's worth of change that overhead exceeds the saving. This is one
file and three lines against an already-approved spec — there is no contract to design, no slice to
coordinate, no second file to keep disjoint. Delegating it is discipline theatre.

**No `explorer`.** The file is named in the spec item. Recon has nothing to find.
**No `designer`, no `fe-dev`.** No UI surface, no contract change — the response shape is unchanged,
only the row set narrows. Nothing to freeze, so nothing waits on a freeze.

**The gates are not optional and do not shrink with the diff.** Solo means solo on the *making*;
`tester`, `checker` and `qa` still run. That is the exact sentence the role carries for a
one-sentence-one-file change, and it is the whole reason this plan has four spawns and not zero.

## 1. The spawns, in order

| # | Agent type | Purpose | `model` | isolation | Deliverable FILE |
|---|---|---|---|---|---|
| — | *(me)* | the 3-line edit + commit on the shared branch | — | main tree | the diff |
| 1 | `sailes-app-builder:tester` | derive case list from the spec, implementation unread | *(omit — keep pin)* | `worktree` | `.ai/runs/2026-08-01-deals-soft-delete/tester-caselist.md` |
| — | *(human)* | freeze the case list | — | — | — |
| 2 | `sailes-app-builder:tester` (fresh) | write the frozen cases, ADD-only | *(omit)* | `worktree` | `.ai/runs/2026-08-01-deals-soft-delete/tester-report.md` + committed suite |
| 3 | `sailes-app-builder:checker` | grade diff vs spec | **`opus`** — reason in §4 | none (read-only) | `.ai/runs/2026-08-01-deals-soft-delete/checker-verdict.md` |
| 4 | `sailes-app-builder:qa` | behavior proof on the running stack | *(omit)* | none — **environment exclusivity** | `.ai/runs/2026-08-01-deals-soft-delete/qa-proof.md` |

Sequential, no concurrency to manage — and deliberately so: rule 2a says do not start a gate while a
worker is standing up a worktree, and with `pnpm`'s shared store plus a `tsc --build` in the suite run,
overlapping spawn 2 with spawn 3 would serialize on the toolchain anyway while looking like parallelism.

Named types, every one of them. They resolve on this machine (checked against the available agent
list) — so no `general-purpose` stand-in, no pasted role prose, and the pinned model, the tool
allow-list and the no-worker-can-spawn invariant all stay real rather than re-typed.

## 2. Briefs — the clauses that are not optional

Every brief below carries, verbatim, three things the worker cannot derive for itself:

- **Report clause.** *"Your report IS the deliverable — not a summary for a human, not a status line.
  If you did not finish, say so plainly and list what you did and did not establish."*
- **Delivery mechanism.** *"You are a scoped subagent: your final message returns to me automatically.
  Do not call `SendMessage`."* (True on this run because teams mode is off; the opposite instruction
  would be needed with it on, and the worker cannot tell which mode it is in.)
- **File deliverable.** Path named above, plus *"no file = task not done."* Four message-deliverable
  briefs produced six empty returns in one measured session; one file-deliverable brief produced a
  gradable artifact first try.

And for the two writing spawns only, the **base-currency check**, in the brief and before any work:

> Run `git log --oneline -3` in your worktree. It must show `<sha of my fix commit>` and
> `apps/api/src/services/deal.ts` must already contain `deleted_at IS NULL`. If it does not, your
> checkout is stale — fast-forward onto the branch before you write anything, and say in your report
> that you had to.

Measured 2026-08-01: five of twelve workers got a checkout cut from before half the session's work,
and one reported a false test-count regression off it. Here it would be worse than a false regression —
a tester on a stale base would write cases against the *unfixed* file and could plausibly conclude the
fix is missing.

### Spawn 1 — `tester`, case list only
Goal: from the spec item alone — deals list must exclude soft-deleted rows — enumerate the cases that
would detect the fault. **Do not read `deal.ts`.** The informational barrier is the point: a suite
written after reading the code mirrors the code. Expect it to reach for the neighbours (list with a
deleted row present; list with only deleted rows; pagination/count interaction; whether a directly
fetched deleted deal is in scope or not). Output the list, not the suite. Constraint: no test files
written in this spawn.

### Spawn 2 — `tester`, fresh agent, write the frozen list
Fresh spawn, not the same agent resumed — the first one now has the human's edits and its own
speculation in context, and re-using it re-opens the barrier it just held. Brief carries the frozen
list verbatim, ADD-only against the diff, no edits to existing tests, commit in the worktree
(a commit is its declaration that it finished; no commit = it did not).

### Spawn 3 — `checker`
Receives **only** the diff, the spec item, and the review checklist. Not my narrative, not either
tester report, not the fact that I wrote the code myself — a verifier grades honestly only on a clean
context, and "the lead wrote it" is exactly the kind of prior that turns a gate into a formality.

### Spawn 4 — `qa`
Receives only the running app and the spec's expected behavior. It holds the environment
**exclusively** from the moment it starts: while it runs, nothing else migrates, reseeds, restarts a
container or touches the bucket — including me. I enforce that because `qa` cannot; I record who
holds the environment and since when. Proof shape: soft-delete a deal through the real path, hit the
list endpoint, observe the row gone and the neighbouring deals still present. `ENV-DEFECT` if the
stack will not boot — never a faked pass.

## 3. Model routing log (defaults included, per the rule that only logging deviations hides the misread)

| Spawn | Tier | Logged as |
|---|---|---|
| tester ×2 | pinned Sonnet, `model` omitted | **default** — considered and rejected: deriving cases for a soft-delete filter is ordinary work |
| qa | pinned Sonnet, `model` omitted | **default** — the read is pass/fail against observed behavior |
| checker | **`opus`** (the alias — an override buys a tier, not a version) | **escalated**, reason below |

The `checker` escalation is the one judgment call here, and it is the gate trigger rather than the
worker trigger: the defect I am guarding against is **what the diff omits**, not what it contains.
Three lines that are individually correct are trivially gradable; whether *this* is the only deals
read path that lacks the filter is a question you can only answer by holding the surface in mind and
asking what should be there. That is the same shape as a missing tenant filter on one of nine access
paths, which is where this trigger was named. `effort` is not passed anywhere — it is not a declared
Agent parameter, it fails silently, and a parameter accepted without effect is exactly the failure
shape this repo keeps recording.

Afterwards I record whether the escalation paid. If Opus caught nothing the pinned tier would have
missed, that is the evidence against escalating the next one.

## 4. One fork for you — I am not taking it

**Scope: does this fix one query or the surface?**

The spec item says *the deals list query*, singular, and I will implement exactly that. But a
soft-delete filter that is missing on one read path is usually missing on its siblings, and if
`checker` comes back naming three more, the answer to "do we widen?" is yours, not mine.

- **(A) Ship the spec item as written, log any siblings `checker` finds to `.ai/backlog.md`.**
  *Recommended.* Costs: the bug stays live on the other paths until a follow-up. Buys: the approved
  spec closes today, and the widening gets its own spec instead of arriving as scope creep inside this
  one.
- **(B) Widen now to every deals read path `checker` names.** Costs: a one-file change becomes a
  multi-file one, which flips the routing above — a real `be-dev` in a worktree, and probably an
  `explorer` sweep first. Buys: no window where the same bug ships half-fixed.
- **(C) Sweep first, decide after.** A read-only `explorer` (no worktree — it writes nothing) maps
  every deals read path before I touch anything. Costs: one spawn, a few minutes, and the spec item
  waits. Buys: you choose between A and B knowing the actual number instead of guessing at it.

I have not started any of them.

## 5. Run log and memory

Per spawn: who was spawned, the exact `model` passed or omitted, what came back, the gate verdict,
and whether it was released — with an empty return recorded as an empty return, because hiding one is
how the same failure repeats next session. With teams mode off, "released" is the return itself.
Anything a worker hit that contradicts this brief lands in `.ai/lessons.md` (Context / Problem / Rule /
Applies-to) before I close out, and `.ai/STATE.md` is updated before I walk away so a context reset
resumes without re-deriving any of this.

**Docs delta:** the spec does not move to `implemented/` without a receipt in `.ai/docs-deltas/`. A
three-line predicate change plausibly touches no diagram, so I expect an explicitly empty delta — which
counts, and still has to be produced by `docs-author` rather than assumed by me.

## 6. What this plan does not cover

- Whether the filter belongs at the query layer at all rather than in a shared scope/repository helper —
  that is a design question the spec settled or did not, and I am following it as written.
- Existing rows already soft-deleted before this fix: nothing here backfills or audits them.
- The sibling read paths, unless you pick (B) or (C) above.

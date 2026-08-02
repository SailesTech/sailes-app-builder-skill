# Spawn plan — Faza 2: soft-delete na liście deali

Scope as handed over: filter `deleted_at` in the list query (`deals.repository.ts`), repoint the
service (`deals.service.ts`), regression test (`deals.list.test.ts`). Spec approved, BE contract
frozen, nothing to escalate. Implementation and test go to **different roles** because this project
derives tests from the spec before the implementation is read.

## Environment facts this plan is built on (measured, not assumed)

- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` = **unset** → scoped-subagent mode. Every worker returns
  once and ends; **the return IS the release**, there is nothing to confirm and no `SendMessage`
  path. Briefs must therefore say "your final message is the deliverable" — that sentence is true
  in this mode and would be false in the other, so it is stated per-spawn, not assumed.
- `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` = `2`. Irrelevant here: sub-teams are human-triggered
  only and the human has not asked. **One team.**
- `CLAUDE_CODE_SUBAGENT_MODEL` = unset → role frontmatter governs unless I pass `model` per spawn.

## The roster

| # | Role (`subagent_type`) | Writes? | `isolation` | `model` | Wave |
|---|---|---|---|---|---|
| 1 | `sailes-app-builder:explorer` | no | none | omitted (Haiku pin) | 0 |
| 2 | `sailes-app-builder:be-dev` | yes | `worktree` | omitted (Sonnet pin) | 1 |
| 3 | `sailes-app-builder:tester` (derive) | yes | `worktree` | omitted (Sonnet pin) | 1 |
| — | **HUMAN gate** — freeze the case list | — | — | — | between 1 and 2 |
| 4 | `sailes-app-builder:tester` (write suite, fresh spawn) | yes | `worktree` | omitted | 2 |
| 5 | `sailes-app-builder:checker` | no | none | omitted, **conditional escalation → `opus`** | 3 |
| 6 | `sailes-app-builder:qa` | no | none (**env exclusivity**) | omitted | 4 |
| 7 | `sailes-app-builder:docs-author` | yes | `worktree` | omitted | 5, conditional |

Not spawned, deliberately: `designer` and `fe-dev` — no UI surface in this phase, nothing to
design and nothing to consume the contract on the front end. `researcher` — no external facts in
play. A second `team-lead` — sub-teams are the human's call and this task is one team's width.

## Order and concurrency

**Wave 0 — `explorer`, synchronous, blocks planning.**
Two named files do not make recon optional here, because the defect this phase can produce is the
one it *omits*: a `deleted_at` filter added to the list query while a count query, an export, a
join or a second repository method keeps returning tombstoned rows. That map is also what decides
the `checker` tier below, so it is worth its ~Haiku cost before anything writes.

**Wave 1 — `be-dev` and `tester`(derive) in parallel, one message, two tool calls.**
They are file-disjoint by design and worktree-isolated regardless. The tester in this wave writes
**only the case list**, derived from the spec with the implementation unread — that is the
informational barrier, and running it concurrently with `be-dev` is what makes the barrier free
instead of a schedule cost.
*Toolchain caution (rule 2a):* both stand up a worktree in the same seconds. I start **no gate and
no full typecheck** during that window; a shared package store and two checkouts serialize rather
than parallelize, and the visible symptom is a hang, not an error.

**HUMAN gate — the human freezes the case list.** No suite is written before this. This is not an
escalation (nothing architectural is open); it is the gate the tester role owns.

**Wave 2 — `tester`(write suite), fresh spawn**, briefed with the frozen case list file as input.

**Wave 3 — `checker`**, on the integrated diff only.

**Wave 4 — `qa`**, holding the runtime environment exclusively.

**Wave 5 — `docs-author`**, only if Faza 2 closes the spec (see fork D).

## Per-spawn detail

### 1 · explorer — `run_in_background: false`

```
subagent_type: "sailes-app-builder:explorer"   isolation: none   model: omitted
```
Ask for, as `file:line`: every read path that reaches the deals table (repository methods, raw SQL,
query builders, joins from other modules), the current signature and callers of the list query,
whether `deleted_at` already exists on the model and with what nullability, and the conventions in
the existing test files next to `deals.list.test.ts` (runner, factory/fixture helpers, DB setup).
Explicitly: **what it could not establish.**
Deliverable clause: read-only role, no worktree, no status file. Its final message is the
deliverable; if it did not finish it says so and lists what it did and did not establish.

### 2 · be-dev — `run_in_background: true`

```
subagent_type: "sailes-app-builder:be-dev"   isolation: "worktree"   model: omitted
```
Brief carries, in this order: goal · files (`deals.repository.ts`, `deals.service.ts` — nothing
else) · the frozen contract verbatim · constraints · verification · report clause.
Constraints that earn their line: **do not touch `deals.list.test.ts`** — it belongs to another
role in this phase, and a helpful test written here destroys the barrier; do not widen scope to the
other read paths explorer found without coming back to me.
Base-currency check, in the brief and before any work: `git log --oneline -3` must show
`<named sha>` **and** the presence of `<named file that exists only after the work this depends
on>`; fast-forward first if not, and report the stale base rather than working around it.
Status file: claim `.claude/status/<harness agent id>.md` as its **first** action
(`worker`/`task`/`base`/`claimed`/`opened`), **append** the close block as its last
(`closed`/`outcome`/`commit`/`touched`) — never rewrite the claim block. The id is the harness's,
never self-chosen. If `Write` refuses the main-tree path, fall back to
`<worktreePath>/.claude/status/<id>.md` and state that path prominently in the report.
Commits: inside its own worktree, freely, `WIP:` for checkpoints and a non-`WIP:` commit as its
declaration that it finished. Never to a shared branch, never a push.
Report clause: its report IS the deliverable; if it did not finish it must say so plainly and list
what it did and did not establish. In this mode its final message returns automatically.

### 3 · tester (derivation) — `run_in_background: true`

```
subagent_type: "sailes-app-builder:tester"   isolation: "worktree"   model: omitted
```
**Deliverable is a FILE**, named in the brief — the case list at a path I give it, plus
"no file = task not done". Message-only briefs produced six empty returns in one session against
one gradable artifact from a file-deliverable brief; this is the prevention.
Inputs: the spec phase and the frozen contract. **Deny-list, stated as the point of the task, not a
formality:** `deals.repository.ts`, `deals.service.ts`, and `be-dev`'s branch or worktree. A suite
derived after reading the implementation mirrors the implementation instead of detecting faults.
Cases it must reach on its own from the spec (I do not enumerate them in the brief — that would be
me deriving them): soft-deleted row excluded; non-deleted row still returned; the boundary where
`deleted_at` is null vs set; pagination/count consistency with the filter applied; and whatever
else the spec implies.
Same status-file, base-currency, worktree-commit and report clauses as `be-dev`.

### 4 · tester (suite) — fresh spawn, `run_in_background: true`

```
subagent_type: "sailes-app-builder:tester"   isolation: "worktree"   model: omitted
```
Inputs: the **human-frozen** case list file, the spec, the contract. Writes `deals.list.test.ts`,
ADD-only. Deny-list on the two implementation files stands (fork B); it may run the suite.
Fresh spawn rather than the wave-1 agent held across the human gate — reasoning in fork A.

### 5 · checker — `run_in_background: false`

```
subagent_type: "sailes-app-builder:checker"   isolation: none
model: omitted by default; "opus" if the conditional below fires
```
Receives **only** the integrated diff, the spec/contract, and the review checklist.
**Neither worker's report nor any self-assessment is forwarded** — a verifier grades honestly only
on a clean context.
*Conditional escalation, grounded in wave 0:* if `explorer` reports additional unfiltered read
paths to the deals table, the defect to guard against becomes *what the diff omits* — a filter
added to one of N access paths — which is the named trigger for an Opus gate. If explorer reports
the list query is the only read path, the default tier stands. Either way the call and its outcome
go in the run log, including "considered and declined", because a log that only records deviations
cannot show the axis was ever examined.

### 6 · qa — `run_in_background: false`

```
subagent_type: "sailes-app-builder:qa"   isolation: none
```
`qa` is **not** `n/a` here: a list endpoint that stops returning tombstoned deals is behavior a
running system can be driven through. It receives only the running app and the spec's expected
behavior (no design artifact — no UI surface).
**Environment exclusivity is mine to enforce, because `qa` cannot.** While it runs: no other worker
stands up, restarts or migrates the database, and none touch the containers. I record in the run
log who holds the environment and since when. Nothing is spawned in parallel with this wave.
If the stack will not boot from a clean checkout, that is `ENV-DEFECT` reported — never a faked
pass, and never a reason to have skipped the worktree isolation upstream.

### 7 · docs-author — conditional, `isolation: "worktree"`

Spawned only if Faza 2 closes the spec (fork D). Then it refreshes whichever
`docs/architecture/` diagrams this phase changed and the delta receipt lands in `.ai/docs-deltas/`
— an explicitly empty delta counts, and the spec does not move to `implemented/` without the
receipt.

## Integration, in order

1. Read each writer's `.claude/status/<id>.md`: does `commit` exist, does `touched` match
   `git diff --stat` on its branch, was `base` current. Discrepancies are reported **loudly and do
   not block** — this repo already has two checks disabled for crying wolf.
2. **Take the branch, not the last commit.** `git log <branch>` to see *whether* it declared
   (a non-`WIP:` commit), then `git merge --no-ff <branch>`. A declaration commit routinely carries
   a fraction of the worker's files, and `cherry-pick` of it succeeds while dropping the rest.
3. A worker with **no commit did not finish**. I do not salvage a half-written tree — but before
   concluding anything I climb the observation ladder, metadata only: ask it, `tail -3` its
   subagent transcript, `git -C <worktreePath> log --oneline`, `git status --porcelain` /
   `git diff --stat` / mtimes. Never `git diff` without `--stat`, never read the files, never
   commit uncommitted work. Twice in one day work has been declared unfinished while it sat
   finished on disk; what was lost was the report, not the work.
4. Silent return → chase once explicitly; still empty → escalate to the human naming the
   delegation that produced nothing. I never forward an unverified absence as "found no issues".
5. `BLOCKED-BY-POLICY` → the refusal **verbatim** in the run log, one reroute on a different tier
   with the brief tightened, and if the second refuses too, stop and escalate with both quoted.
6. Run log per worker — one line: worker · task · `outcome` · `commit` · `base` · discrepancies —
   **then** delete the status file. Deletion only together with the run-log line; a file removed
   without one is a lost declaration, indistinguishable from a skipped gate.
7. Harvest into `.ai/lessons.md` (Context / Problem / Rule / Applies-to) anything a worker hit that
   the brief got wrong, and update `.ai/STATE.md` before walking away.

## Model routing — logged including the non-overrides

All seven spawns run on their **pinned frontmatter defaults; no `model` passed**. Reason: the
judgment in this phase is a filter predicate and a service repoint against a frozen contract —
mechanical, not a contract/data-model/auth surface. Size is not a trigger.
`effort` is **not passed on any spawn**: it is not a declared parameter of the Agent tool and it
fails silently, so treating it as frontmatter-only is the only honest option. `model` takes the
aliases only (`sonnet`/`opus`/`haiku`/`fable`), so the one conditional override below is recorded
as the alias passed, not as "escalated".
One conditional override: `checker` → `opus` if explorer finds additional unfiltered read paths
(reasoning in spawn 5). Its outcome gets recorded too — if the expensive run catches nothing the
default would have caught, that is the evidence for not escalating next time.

## Decisions that are yours, not mine

**A · The tester across the human gate — one agent or two.**
- **Recommended: two spawns, fresh agent for the suite.** The frozen case list on disk is the
  handoff, which makes the barrier auditable instead of resting on an agent's memory of what it
  did not read; and it does not park an idle agent across a wait of unknown length.
- Alternative: hold the wave-1 tester through the freeze. Buys perfect continuity and an
  intrinsically unbreakable barrier (it never saw the code); costs a live idle agent and makes
  the barrier unverifiable from outside.

**B · What the suite-writing tester is allowed to see.**
- **Recommended: merge `be-dev` first; tester writes with the two implementation files deny-listed
  but may run the suite.** Buys a genuine red/green signal and tests that compile against real
  signatures; costs a deny-list I enforce by brief rather than by mechanism.
- Alternative: fully blind — suite written before the merge, I run it and return only pass/fail
  text. Buys a mechanically airtight barrier; costs iterations on signature mismatches that have
  nothing to do with behavior.

**C · The other read paths, if explorer finds any.**
- **Recommended: this phase stays as specced (list query only), and the extra paths become a
  finding I bring you with the explorer's `file:line` list.** Buys a frozen contract that stays
  frozen; costs a known tombstone leak living on until you decide.
- Alternative: widen Faza 2 now. Buys one coherent fix; costs a re-freeze of an approved phase.

**D · Is Faza 2 the last phase of this spec?**
- If yes, `docs-author` runs before closure and I bring you the delta receipt.
- If no, no docs wave and the spec stays live. I need the answer only at wave 5, so nothing waits
  on it now.

**None of these four blocks the start.** A fires at the human gate, B at wave 2, C only if explorer
finds something, D at wave 5 — so waves 0 and 1 dispatch identically whichever way you answer, and
I start them now. I hold at the case-list freeze, which is where A and B come due together with
the freeze itself and with whatever C turned into.

# Execution plan — Billing / Notifications / Admin panel

Lead: `team-lead`. Date: 2026-08-01. Spec: approved, three slices, stated parallelizable.

## 1. Team shape

**One team. I do not open sub-teams.**

The task is wide enough that three sub-leads would look natural, and that is exactly the reasoning
the rule exists to stop: commando mode is human-triggered only, and "a wide task" is explicitly not
a reason to open it. Nothing here needs a second layer — three slices is a fan-out I can brief,
integrate and gate myself, and depth-two would move the gates onto the people who made the work.

If the human wants three sub-teams, say so and I will restructure: one sub-lead per slice, gates
still mine, depth stops at two. Until then: one lead, many workers, all flat under me.

Parallelism does not come from sub-teams. It comes from running the workers concurrently, which is
the default and needs nobody's permission.

## 2. Pre-flight — before a single worker is spawned

Cheap, and each item has burned a run before.

1. **Readiness.** `sailes-pre-implement` on the spec must return READY. An approved spec is not the
   same as a spec with its BC impact and gaps analysed. If it has not run, it runs first — one pass
   over all three slices, not three passes.
2. **Delegation mode.** Read `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`. Off → workers are scoped
   subagents, the return *is* the release, and there is nothing to confirm. On → release is an act
   I confirm with `SendMessage {"type":"shutdown_request"}` and observe. The release procedure I
   write into the run log has to match the mode I am actually in; quoting the wrong one produces a
   plan that reads correct and cannot be run.
3. **Entry condition for worktrees.** Confirm the repo has a documented one-command path from clean
   clone to running app (install → migrate → dev). Every writing worker gets its own checkout, and
   twelve checkouts that cannot boot is twelve `ENV-DEFECT`s, not eleven. If that path does not
   exist, it is an `ENV-DEFECT` reported to the human before the fan-out — not a reason to skip the
   isolation.
4. **Base-currency check goes in every brief.** Measured harness defect: worktrees have been cut
   from stale bases, and one produced a false test-count regression that cost a separate
   investigation. Each brief carries: *"first command — `git log --oneline -3`; you must see sha
   `<X>` and the file `<Y>` must exist. If not, fast-forward before you touch anything."* Named sha
   plus a named file that only exists after the prerequisite work.
5. **Context load.** `.ai/lessons.md` and the touched-area Task Router guides — billing touches
   money and webhooks, admin touches auth. Planning without them repeats known mistakes.

## 3. The file sets do not overlap. Five other things do.

The spec's claim is true about *feature* files and false about everything a feature file has to be
plugged into. Each of these is a collision the worktree will hide and the merge will surface.

| Shared surface | Who touches it | How I handle it |
|---|---|---|
| **Route registration** (`apps/api/src/routes/index.ts` or equivalent) | all three | Nobody edits it. I add all three registration lines myself, once, at the contract freeze — before the devs start. Each dev's routes then land under a path that already exists. |
| **Migration sequence** — one folder, one ordered chain, one database | billing, notify, admin (audit table) | Timestamps are allocated by me up front: billing `..._01`, notify `..._02`, admin `..._03`. Three workers each inventing "the next migration" produces three files that all claim to be next, and the conflict does not appear until they run in sequence against one DB. |
| **`package.json` / lockfile** — new deps (Stripe SDK, an email provider, a Slack client) | billing, notify | Installed by me at the freeze, in one commit, on the shared branch. A worker adding a dep in a worktree means three lockfile edits that merge cleanly and resolve wrongly. |
| **Auth / session middleware** | admin (impersonation must mutate the effective identity), billing (subscription state may gate routes) | This is the one genuine architectural entanglement and it goes to the human as a fork (§8). |
| **The toolchain and the machine** | everyone | Worktree creation and `pnpm install` are serialised in a stagger, and **no gate starts while a worker is standing up a worktree**. A shared package store plus a full typecheck do not parallelise, they serialise — measured as a ten-minute hang on what is normally a one-minute check. If something hangs: break down processes *by command line* before killing anything, and never kill an editor language server or an MCP server. |

Two more couplings that are functional rather than file-level, and both need answering before the
freeze rather than discovering at integration:

- **The dunning job sends email.** That is billing calling notify. Either billing depends on the
  notify package (and notify must land first, killing the parallelism), or billing emits a domain
  event that notify subscribes to (parallel, one more moving part). Fork → §8.
- **Admin's audit-log screen reads rows somebody has to write.** Impersonation writes them for
  certain. Do billing state changes and notification sends write them too? If yes, the audit writer
  is a shared surface used by all three and must be frozen as a contract before anyone starts.
  Fork → §8.

## 4. Roster and assignment

Everything that writes gets `isolation: worktree`. `explorer` and `checker` do not — read-only, the
disk copy buys nothing. `qa` does not either: it needs the live stack, not a copy, and takes
environment exclusivity instead.

Every brief, without exception, carries four clauses:

- **A FILE deliverable** — path plus *"no file = task not done"*, read by me from disk. Four
  message-deliverable briefs once produced six empty returns; one file-deliverable brief produced a
  gradable artifact first try.
- **The report clause** — *its report IS the deliverable, not a summary for a human; if it did not
  finish it says so plainly and lists what it did and did not establish.* Stated even to built-in
  agent types, whose definitions I cannot edit.
- **The delivery mechanism** — scoped subagent → your final message returns automatically;
  background teammate → **plain text reaches nobody, call `SendMessage`.** The worker cannot tell
  which mode it is in. I can.
- **The base-currency check** from §2.4.

### Wave A — recon (parallel, read-only, ~1 h)

| # | Role | Task | Deliverable file |
|---|---|---|---|
| A1 | `explorer` | Shared surfaces: route registration, migration chain, auth/session middleware, existing audit or event bus, dep manifest. `file:line` for every one. | `.ai/recon/shared-surfaces.md` |
| A2 | `explorer` | Existing patterns to conform to: how an existing route module is shaped, how jobs are scheduled, how outbound HTTP is wrapped, how tests are laid out. | `.ai/recon/house-patterns.md` |

Two explorers, not one: Haiku holds 200K of context against 1M on the other tiers, which is a real
ceiling on whole-repo recon, not a price difference. Split by question, not by directory.

### Wave B — design + contracts (after A, parallel, ~2 h)

| # | Role | Task | Deliverable file |
|---|---|---|---|
| B1 | `designer` | Admin panel only — users screen, audit-log screen, impersonation entry/exit affordance including the "you are impersonating" persistent state and the exit path. Layout, states, empty/error/loading, responsive. From the project's design tokens. | `.ai/design/admin-panel.md` |
| B2 | me | Write the three contract artifacts (§5). Not delegated: this is the coordination the tier is for. | `packages/contracts/**` |

Billing and notify have no UI in this spec, so `designer` is scoped to admin. If a later decision
introduces a surface I skipped here — a billing settings screen, a notification preferences UI —
`designer` is reinstated and the contract re-frozen before `fe-dev` restarts.

### Wave C — implementation (parallel lanes, ~2–3 days)

Each lane is two sequential units, because the second half of each depends on the first half's
types being committed. Lanes run concurrently with each other.

| # | Role | Lane | Scope | Deliverable |
|---|---|---|---|---|
| C1 | `be-dev` **(opus)** | Billing | Stripe client, subscription lifecycle, invoice model + read API. Migration `_01`. | commit in worktree + `.ai/runs/c1-report.md` |
| C2 | `be-dev` **(opus)** | Billing | Webhook intake + dunning job, on top of C1's commit. | commit + `.ai/runs/c2-report.md` |
| C3 | `be-dev` (sonnet) | Notify | Fan-out service (email + Slack transports), template rendering. Migration `_02`. | commit + report |
| C4 | `be-dev` (sonnet) | Notify | Per-user preferences + digest job, on top of C3. | commit + report |
| C5 | `be-dev` (sonnet) | Admin API | Users list/detail endpoints, audit-log query endpoint, audit writer. Migration `_03`. | commit + report |
| C6 | `be-dev` **(opus)** | Admin API | Impersonation flow — token issue, effective-identity resolution, exit, audit on both edges. | commit + report |
| C7 | `fe-dev` (sonnet) | Admin UI | Three screens against the **frozen** contract and B1's design spec. **Starts only after the contract freeze**, which is what makes it concurrent with C5/C6 instead of blocked on them. | commit + report |

Two brief lines that are not boilerplate, both from recorded failures:

- **C2 (webhook):** *"State what your idempotency key is and what happens on the second delivery of
  the same event — not why your approach is idempotent. `ON CONFLICT DO NOTHING` inserts the row
  idempotently and discards the loser's payload; that is the shape of defect that survived two gates
  and was caught by qa on a live stack."* I grade the second run, not the justification.
- **C6 (impersonation):** *"Enumerate every route that reads an identity and state, per route,
  whether it sees the impersonator or the impersonated. The defect here is the path you did not
  think of, not the one you wrote wrong."*

### Wave D — gates (§6)

## 5. Contract freeze — the thing that makes this actually parallel

Frozen means a **committed, typed artifact both slices import** — shared TS types / Zod schemas /
OpenAPI — not a paragraph in the spec and not agreement in a message. Drift then becomes a compile
error instead of a review finding.

Three artifacts, committed by me on the shared branch at the end of Wave B:

1. `contracts/billing.ts` — subscription, invoice, webhook event union, dunning state.
2. `contracts/notify.ts` — notification payload, channel, template id, preference shape, and (if
   §8-A resolves to events) the billing→notify event.
3. `contracts/admin.ts` — user row, audit entry, impersonation session. This is the one `fe-dev`
   imports, and the reason C7 can start on Day 2 rather than Day 4.

Same commit carries: the three route registrations, the three allocated migration timestamps, and
the new dependencies. After that commit, nothing outside a lane's own directory changes.

**If freezing any of these requires a decision the spec did not settle, I stop and escalate.** I
assemble contracts from settled decisions; I do not invent architecture mid-pipeline. §8 is that
escalation, and it lands before Wave C, not during it.

## 6. Verification

The order among the roles I use is preserved: **tester → checker → qa**. No gate is optional. A
faked or skipped `qa` is not a pass.

**`tester`** — one per lane (three total), each running after its lane is code-complete and before
`checker`. The informational barrier is the whole point: it derives expected behavior from the spec
**with the implementation unread**, the human freezes the case list, and only then does it write the
suite, ADD-only from the diff. A suite written after reading the code mirrors the code instead of
detecting faults. This is the one gate role that writes, so it gets a worktree.

**`checker`** — receives **only** the diff, the spec/contract and the review checklist. Never the
worker's report or self-assessment; the verifier grades honestly only on a clean context. Four runs:
one per lane, one on the integrated merge. `CHANGES-REQUIRED` loops back to a **fresh** worker in
that lane, never to the stale one that wrote it.

- Lane checkers run at the pinned tier — patch reads.
- **The admin checker is escalated to opus.** The defect I am guarding against on the impersonation
  diff is *what the diff omits* — an identity check absent from the one branch nobody added, an
  action that skips the audit write. Grading an omission means holding the whole surface in mind and
  asking what should be there, which is a different task from checking that what is there is
  correct. That is a judgment trigger, not a size one, and it goes in the run log with its outcome.

**`qa`** — receives only the running app, the spec's expected behavior, and (for admin) the design
artifact. **Serialised, never parallel**, because it holds the runtime environment exclusively and I
am the one who enforces that — `qa` cannot. While a `qa` run is live: no worker stands up, restarts
or migrates the database, and nobody touches the containers. Files are isolated by the worktree; the
database, ports, bucket and containers are the one resource that cannot be cloned. I record who
holds the environment and since when, in the run log, so a context reset does not lose it.

Four `qa` runs, in order:

1. **Billing** — a real Stripe test-mode subscription created, an invoice landing, a webhook
   replayed twice (the second must be a no-op with the config intact), a dunning cycle driven to its
   visible outcome.
2. **Notify** — a real send on both channels, a preference actually suppressing one, a digest job
   producing one message rather than N.
3. **Admin** — the three screens driven in a browser, vision-verified against B1's design artifact;
   impersonation entered, an action performed while impersonating, the audit row observed carrying
   the *impersonator's* identity, and the exit path returning to the real identity.
4. **Integrated** — the cross-slice path the spec actually cares about: a dunning event producing a
   real notification that appears in the audit log. This is where the §8-A and §8-B decisions get
   proved, and it is the only run that can prove them.

Behavior before diff. Done means the running system was observed doing the thing — a green typecheck
is not evidence, and neither is a worker saying it works.

## 7. Model routing — planned, including the non-overrides

Logged as defaults where I did not override, because recording only deviations makes it impossible
to tell a lane where I considered the axis and rejected it from one where I never looked.

| Unit | Model | Why |
|---|---|---|
| A1, A2 `explorer` | **default** (haiku) | Recon. No `effort` line — effort is unsupported on that tier, so the only lever is the model, and recon does not need it. |
| B1 `designer` | **default** | Ordinary design spec against existing tokens. |
| C1, C2 billing `be-dev` | **override → `opus`** | Money, an external state machine I do not control, and webhook idempotency. The difficulty is in the judgment, not the typing. |
| C3, C4 notify `be-dev` | **default** | Volume, not judgment. A large mechanical fan-out is a Sonnet task; reaching for Opus because a diff is big is the same misread as writing it myself. |
| C5 admin API `be-dev` | **default** | CRUD + a query endpoint. |
| C6 impersonation `be-dev` | **override → `opus`** | Auth surface. Explicit escalation trigger. |
| C7 `fe-dev` | **default** | Three screens against a frozen contract and a written design spec. |
| `tester` ×3 | **default** | |
| `checker` lane ×3 | **default** | Patch reads. |
| `checker` integrated | **override → `opus`** | Omission-shaped defect across the merge. |
| `qa` ×4 | **default** | |

Notes I owe the log. `effort` is **not** a declared Agent-tool parameter — it raises no error and has
no observable effect, so I treat it as frontmatter-only and pass `model` only. An override buys a
*tier alias*, not a version: passing `opus` means that worker stops running on its pinned model and
starts running on whatever `opus` resolves to today, so I record **the alias I passed**, not
"escalated". And after each escalation I record whether it paid — if the expensive billing run caught
nothing the default would have caught, that is the evidence against escalating the next one. A log
that cannot say the override was wrong is a receipt, not a record.

Three overrides out of fifteen units. If I find myself escalating `be-dev` on every lane, that is not
a routing decision, it is a role that has outgrown its definition, and I say so instead of overriding
by habit.

## 8. What goes to the human — one window, before Wave C

These are batched deliberately. None of them interrupts anything: recon (Wave A) and the design spec
(B1) do not depend on any of them and are already running. The window opens at the freeze, which is
the first point where an answer is actually needed.

**A. How does billing reach notify for dunning emails?** *(recommended: 2)*
1. Direct dependency — `packages/billing` imports `packages/notify`. Simplest, one call site. Costs
   the parallelism: notify must land before billing's dunning job compiles, so the two lanes
   serialise and the week gets longer.
2. **Domain event — billing emits `invoice.payment_failed`, notify subscribes.** Keeps the lanes
   independent and keeps the coupling one-directional, which is the shape you want if a third
   producer ever appears. Costs one more moving part and a contract for the event itself, frozen
   with the others.
3. Neither — the dunning job templates and sends its own email. Cheapest today, and it means two
   email paths in the codebase, one of which ignores user preferences. I recommend against it.

**B. Who writes audit-log rows?** *(recommended: 1)*
1. **Impersonation only, for now.** The spec names impersonation and an audit-log *screen*; it does
   not say billing and notify are audited. Smallest surface, ships this week, and the writer stays a
   private detail of the admin slice.
2. A shared audit writer in the contract package, called by all three lanes. Richer log from day one.
   Costs a third shared surface across all three lanes at exactly the moment I am trying to keep them
   disjoint, and it is a one-way door only in the sense that the table grows.

I want this answered rather than assumed because the two produce different *tables*, and changing
your mind after the migration lands is a migration, not an edit.

**C. Does impersonation touch the shared auth middleware, or wrap it?** *(recommended: 2)*
1. Modify the session resolver in place to understand an impersonation claim. Fewer concepts.
   Touches the file every authenticated request in the app goes through, for a feature used by
   admins.
2. **A wrapper applied only to routes that opt in**, leaving the base resolver untouched. Blast
   radius stays inside admin. Costs an explicit opt-in list, which is a thing that can be forgotten
   — and that is exactly what the opus `checker` in §6 is pointed at.

**D. Stripe webhook — is there a test-mode account and a way to replay events?** Not a preference,
a fact I need. Without it, billing `qa` cannot drive the real flow and I would be signing off on a
lane by reading its tests, which is not a pass. If it does not exist, that is an `ENV-DEFECT` and
the billing gate stays open until it does.

I carry on with Waves A and B while these sit. Nothing in them is blocked.

## 9. Bookkeeping

- **Run log** (`.ai/runs/`), per unit: who was spawned, on which model alias, what they returned,
  the gate verdict, whether they were **released** — and "released" is written only for a
  termination I actually observed. A worker that returned nothing is recorded as exactly that; an
  empty return is data, and hiding it is how the same failure repeats next session.
- **A silent worker gets chased, not replaced.** Ask once for the report, instructing it to state
  plainly if it did not finish. Still empty → escalate to the human, naming which delegation
  produced nothing. Never re-spawn on a guess, never quietly do the work myself, and never forward
  an unverified absence as "the agent found no issues". Silence has two causes with one appearance:
  it did not finish, or the channel dropped a report it did write — on one measured day, all four
  silent workers had finished with full reports and two were re-spawned for nothing. So: hold a
  silent worker rather than releasing it. Its context is the only place its findings may still
  exist, which is why chasing beats "never hold idle agents" on this one case.
- **Observing a silent worker: metadata yes, content no.** `git log --oneline` in its worktree (what
  it declared, and which commits are `WIP:` checkpoints rather than claims of completion), then
  `git status --porcelain`, `git diff --stat`, file mtimes — is it still moving or did it die. Never
  `git diff` without `--stat`, never read its files, never cherry-pick uncommitted work. **A worker
  with no commit did not finish.**
- **Integration is mine.** Workers commit in their own worktrees — that commit is their declaration
  that the work is finished, and because the worktree shares the main `.git` I can `git log <branch>`
  and `git cherry-pick` immediately, with no push and no copying. Nobody but me touches the shared
  branch, and I own the merge and the PR.
- **`.ai/lessons.md` before releasing anyone** who hit a real problem — a wrong assumption in my
  brief, a contract that did not hold, a tool that failed silently. Context / Problem / Rule /
  Applies-to. That knowledge is worth more than the diff and does not survive in a message queue.
- **`docs-author` before the spec closes.** It sits outside the pipeline order: spawn it after the
  integrated `qa` passes, refresh the architecture diagrams the three slices changed, and land the
  delta receipt in `.ai/docs-deltas/`. The spec does not move to `implemented/` without it — an
  explicitly empty delta counts, an absent one does not.
- **`.ai/STATE.md` updated before I walk away**, so a context reset resumes this plan instead of
  re-deriving it: which lanes are merged, who holds the environment, which forks in §8 are answered.

## 10. Shape of the week

- **Day 1 am** — pre-flight, Wave A recon (parallel), §8 window opens.
- **Day 1 pm** — B1 design; §8 answered; **contract freeze committed** (contracts + routes +
  migration slots + deps).
- **Day 2–4** — Wave C, three lanes concurrent, C7 running against the frozen contract from Day 2.
  Worktree creation staggered; no gate started while anyone is installing.
- **Day 4** — `tester` per lane as each goes code-complete; lane `checker` runs; merges land one lane
  at a time.
- **Day 5** — integrated `checker` (opus), then the four `qa` runs **in series** with the environment
  held exclusively; `docs-author`; docs delta; final verdict to the human.

The serialisation on Day 5 is real and I am not hiding it: four `qa` runs cannot overlap, so the
week's parallelism buys speed in the middle and gives some of it back at the end. That is the correct
trade — the alternative is four agents fighting over one database and a pass nobody can trust.

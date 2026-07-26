# Execution plan — three parallel slices, three sub-teams

**Role:** `team-lead` (top-level). **Date:** 2026-07-26. **Mode:** planning dry-run — nothing below has
been executed, no project code written, no agent spawned.

**Human instruction, verbatim:** *"Rozbij to na trzy zespoły, każdy ze swoim leadem."*
("Break it into three teams, each with its own lead.")

---

## 0. The gate on this decision, answered first

Sub-teams are the one mode I am not allowed to open on my own initiative
(`agents/team-lead.md` §Sub-teams; `agent-team-structure.md` §Sub-teams). The trigger is the human
asking, and the human asked — explicitly, naming both the fan-out ("three teams") and the shape
("each with its own lead"). That is the trigger, not an inference from the task being wide. So:

- **Commando mode is open.** I honor it literally.
- **Three, not four, and not "three plus a floater."** Three is both what was asked and the doctrinal
  cap. The number came from the human; I do not adjust it because a slice looks heavier.
- **Nothing else about the framework moves.** A wider team is a widening of *capacity*, not of
  *authority*. `SPEC → HUMAN → VERIFIED → GATED` holds unchanged, and the gates do not enter the teams.

Worth stating plainly because it is the load-bearing half: had the human said only *"the slices are
parallelizable, get it done"*, the correct answer would have been **one team**. A week of work across
three modules is not by itself a reason to open a second team. The parallelizability of the work is
not the trigger; the sentence above is.

## 0.1 Machine preconditions — checked, not assumed

Both of these change the plan, so I read them rather than trusting a memory of how it worked:

| Fact | Value found | Consequence |
|---|---|---|
| `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` | `"2"` in `~/.claude/settings.json`, present in env | Depth-2 nesting is possible. A third layer **cannot spawn at all** — the runtime enforces the depth rule I would otherwise only be promising. |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | **not set** — absent from `~/.claude/settings.json`, absent from `.claude/settings.json` and `.claude/settings.local.json`, absent from env | **We are on the fallback path.** Sub-leads and workers are *scoped subagents*, not live teammates. This changes §2 (escalation channel) and §5 (what release means) concretely. |
| `Agent` in the non-lead roles' `tools:` | absent from all seven (`explorer`, `designer`, `be-dev`, `fe-dev`, `tester`, `checker`, `qa`) | Depth-2 is structural, not a rule I have to police. A worker or gate physically cannot spawn anything. Only `team-lead` omits `tools:` and inherits the full pool — which is what lets a sub-lead spawn its workers. |

The second row is the one that would bite if I ignored it. Doctrine's release procedure
(`SendMessage {"type":"shutdown_request"}`, re-send until termination is confirmed) and its
escalation procedure (a worker stops and asks its lead) are both written for live teammates. On the
fallback path neither is available as written, and quoting them anyway would be a plan that reads
correct and cannot be run. Both are translated below, and the flag-on variant is given alongside so
the plan survives the human turning it on.

---

## 1. Team structure, and how deep it goes

### Depth stops at two. Full stop.

```
                              HUMAN
                                │  (sole channel — §2)
                                ▼
                        team-lead  ← me
                        owns: plan · contract freeze · seam files ·
                              integration · merge/commit/PR · ALL GATES · run log
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
   sub-lead A              sub-lead B              sub-lead C
   team-billing         team-notifications         team-admin
   (team-lead role)      (team-lead role)          (team-lead role)
        │                       │                       │
   ┌────┴────┐             ┌────┴────┐             ┌────┴────┐
   ▼         ▼             ▼         ▼             ▼    ▼    ▼
 be-dev   fe-dev         be-dev   fe-dev      designer be-dev fe-dev
                                                   │
                                              ── LAYER 3: cannot exist ──
                                     no role below carries `Agent`; depth cap = 2
```

**Three levels of nodes, two levels of spawning.** A sub-lead does not open sub-teams of its own —
and cannot, on this machine, even if it tried.

### Composition

| | team-billing | team-notifications | team-admin |
|---|---|---|---|
| Sub-lead | `team-lead` · opus-5 · high | same | same |
| Workers | `be-dev`, `fe-dev` | `be-dev`, `fe-dev` | `designer`, `be-dev`, `fe-dev` |
| Isolation | git worktree | git worktree | git worktree |
| Peak live agents | 3 | 3 | 3 (designer released before fe-dev spawns → 3, not 4) |

Peak concurrency ≈ 10 agents against a 20-concurrent cap — comfortable, and I do not intend to use
the headroom. Fan-out is a brake, not a budget to spend.

**Why `designer` only on admin, provisionally.** The spec is approved and the BE contracts are
frozen, so the contract-freeze step is already behind us — but a design pass is about a *new UI
surface*, not about the contract. The admin panel is a new surface and gets one. Billing and
notifications get one **only if their slice introduces a screen that isn't an existing pattern**,
which I determine from the recon in §1.1 rather than guessing now. Dropping `designer` is
*provisional*: if a sub-lead reports mid-slice that its work needs a screen nobody specced, the role
is reinstated before its `fe-dev` runs. That reinstatement is my call, from my seat — a sub-lead does
not quietly hand a UX decision to its `fe-dev`.

**Model routing.** Every role runs its pinned default: sub-leads opus-5/high (the `team-lead`
frontmatter), devs and designer sonnet-5/high, `explorer` haiku-4-5 (no `effort` — unsupported on
Haiku 4.5, and its 200K context is a real ceiling I plan recon scope around). **No overrides
planned.** Three opus sub-leads is the expensive part of this shape and it is the human's chosen
shape, not my escalation — recorded in the run log as such so next session can tell the difference
between an instruction and drift. If a slice later needs an opus worker, that override goes in the
log with its reason, per the same rule.

### 1.1 Pre-flight — before a single team spawns

Three things happen from my seat first, and none of them is parallel:

1. **One `explorer` pass, run by me, across all three slices at once** — not one per team. Its job is
   not to map each module (each sub-lead can do that inside its own scope); it is to produce the
   **seam inventory** in §4: every file all three slices might touch. This is the one recon result
   that must be shared, and having three teams each discover it separately is how the collision
   happens. Read-only, output is a file.
2. **Verify the contract artifacts are actually frozen** in the doctrinal sense — a committed, typed
   artifact (shared TS types / Zod schemas / OpenAPI) that the slices *import*, so drift is a compile
   error rather than a review finding. "The BE contracts are frozen" is a claim I check against the
   repo before three teams start building on it. If what exists is prose agreement rather than an
   importable artifact, **that is a blocker I raise with the human before spawning anything** — three
   parallel teams building against an unimportable contract is the most expensive way to discover it
   was never frozen.
3. **Create the three worktrees and the run-log skeleton** (§4, §5). Teams are spawned into prepared
   ground, not into a repo they have to arrange themselves.

Only after those three do the sub-leads exist. Spawn-on-demand applies at the team level too.

---

## 2. Who talks to the human, and how a question gets there

### I do. Nobody else, at any depth.

Sub-leads talk to me. Workers talk to their sub-lead. The human has exactly one counterpart in this
structure and it is me. This is not politeness about org charts — the escalation ladder encodes
**authority**, and a wider or more capable team does not earn an exemption from it. A sub-lead
running an opus tier is exactly as unauthorized to settle a key decision as a sonnet worker is.

```
worker → sub-lead → team-lead(me) → HUMAN
                                  ← answer travels back the same way, in a fresh brief
```

### The mechanics, on the path we are actually on

With agent-teams **off**, a scoped subagent is a one-round-trip object: it runs, it returns once, and
I cannot interject mid-flight — nor can it ask me anything mid-flight. So "escalate to your lead"
cannot mean "send a question and wait". Every brief in this run therefore carries this clause,
worded for the mode it is in:

> **Escalation:** if you hit a question the spec does not settle — a key decision (contract shape,
> data-model, auth, tenancy, a new UX surface), a scope ambiguity, or a contract that does not hold
> against reality — **stop work at that point and return.** Do not decide it, do not widen scope, do
> not pick "the obvious option". Write `ESCALATION` at the top of your deliverable file, state the
> question, the options you can see, what you completed before stopping, and what is now blocked.
> A stop-and-escalate is a successful outcome of this brief, not a failure of it.

A sub-lead that receives an ESCALATION from its worker does **not** answer it if it is a key
decision. It ends its own round the same way — escalating upward — and I take it to the human. A
sub-lead's authority is exactly mine: *assemble and freeze from what the spec already settled*. New
architecture is not in that set at any level.

**If the human enables `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`,** the same ladder runs live: workers
`SendMessage` their sub-lead, sub-leads `SendMessage` me, I ask the human, the answer flows back
without a re-spawn. Cheaper on round-trips; identical in authority. The mode changes the plumbing
and nothing else.

### The human's inbox on this run, honestly enumerated

The brief says the spec is approved and the contracts are frozen, "so nothing needs escalating."
That is true of *architecture*. It is not true of *contact* — this run reaches the human at least
four times by design, and pretending otherwise would set up a `tester` gate that quietly skips its
freeze step:

1. **Pre-flight blocker (conditional)** — if the frozen contracts turn out not to be importable
   artifacts (§1.1 item 2).
2. **Three `tester` case-list freezes** — one per slice. `tester` derives expected behavior from the
   spec with the implementation **unread**, and *the human freezes that list* before the suite is
   written. That informational barrier is the whole mechanism; it is not mine to sign off in the
   human's place because they said escalation wasn't needed. Batched into as few round-trips as the
   slices' completion order allows.
3. **Any ESCALATION that arrives** despite the frozen spec — most likely from a contract that does
   not survive contact with the code.
4. **A silent return I could not recover** (§5) — reported as "this delegation produced nothing",
   never papered over.

---

## 3. Who runs `tester`, `checker` and `qa` — and on what

### I do. All three. On the integrated result. No exceptions.

This is the single rule most at risk in a three-team shape, because every sub-lead will be able to
make a locally reasonable case for gating its own slice — faster loop, fuller context, no waiting on
me. It is still the maker reviewing the maker. A sub-lead owns its team's output; grading its own
team's output is the exact failure gate isolation exists to prevent, and the fact that the reviewer
is a different *agent* than the coder does not fix it when they share a lead, a brief and a stake.

Structurally I barely have to enforce this: none of the seven non-lead roles carries `Agent`, so a
sub-lead's `be-dev` cannot spawn a `checker` even if it wanted one. What I do have to enforce is that
a *sub-lead* does not spawn `tester`/`checker`/`qa` (it inherits the full tool pool and mechanically
could). So every sub-lead brief carries this line explicitly:

> **You do not spawn `tester`, `checker` or `qa`, and you do not grade your own team's output.**
> Those gates belong to the top-level lead and run on the integrated result. Your deliverable is your
> slice plus an honest report of what you could not establish. Reporting a weakness in your own slice
> is what this brief wants; a clean self-assessment is not a substitute for a gate and will not be
> read as one.

### What each gate receives, and when

| Gate | Runs on | Receives — and ONLY this | Deliverable file |
|---|---|---|---|
| `tester` | **Per slice, per phase**, when that slice is code-complete — not once at the end. Three runs. | The spec for that slice, with the implementation **unread** at derivation time; then the human-frozen case list; then ADD-only from the diff. Never the maker's report. | `.ai/test-plans/<slice>.md` (frozen list) + the suite |
| `checker` | **Per slice diff**, after that slice's `tester`. Diffs are file-disjoint, so all three can run concurrently. | The diff · the spec/contract it implements · the review checklist. **Not** the worker's report, **not** the sub-lead's report, **not** the sub-lead's self-assessment. | `.ai/runs/<run>/checker-<slice>-VERDICT.md` |
| `qa` | **The integrated result on the running app.** Per-slice flows *plus* one cross-slice pass over the seams (nav, auth, shared layout, any place two slices are visible at once). | The running app · the spec's expected behavior · (UI) the design artifact + `.ai/screens/` baseline. Not the implementation story. | `.ai/runs/<run>/qa-VERDICT.md` + screenshots |

The three sub-lead reports are input to **my integration** — they never reach a gate. That separation
is the entire reason a three-team shape is safe to gate at all: three enthusiastic slice narratives
converging on one reviewer is precisely how a review starts grading stories.

**The cross-slice `qa` pass is not optional and does not exist in the single-team version of this
plan.** Three teams that each pass in isolation can still produce a broken app — the seams are where
that shows, and no per-slice gate looks at them.

**On CHANGES-REQUIRED:** it loops back to the relevant dev via a **fresh** worker (and, if the fix
spans the slice, a fresh sub-lead) carrying the checker's findings — never the stale, context-heavy
original. Fresh context is what keeps the second attempt honest.

**On ENV-DEFECT:** if `qa` cannot boot the stack or lacks creds/fixtures, that is a bootstrap defect,
not a qa judgment call. It reports `ENV-DEFECT` naming what is missing, I escalate, and the fix is
the seed/boot path. A faked or skipped pass is never the answer to a broken environment — and with
three slices landing at once the temptation to wave it through is at its highest.

---

## 4. Keeping the teams off each other's files

The spec says the slices touch different modules and share no files. I treat that as a **claim to
verify, not a premise to build on** — the no-two-workers-on-one-file rule now has to hold at the
*team* boundary, where a violation costs three teams' work instead of one worker's.

### Four layers, weakest to strongest

**(a) The seam inventory — the pre-flight `explorer` pass (§1.1).** "Different modules" is almost
never the same as "no shared files". The recurring seams, which I expect to find and want named
before anyone starts:

- router / route registry, and the nav or sidebar menu (all three slices add entries)
- DI container, module registration, app bootstrap / provider tree
- **DB migration directory — sequence-numbered filenames collide even when the migrations are
  semantically independent.** This is the classic "disjoint modules" collision.
- i18n message catalogs, env/config schema, feature-flag registry
- `package.json` + lockfile (any slice adding a dependency)
- the shared contract artifact itself
- `.ai/` files: `STATE.md`, `lessons.md`, `backlog.md`, `.ai/screens/` baselines

**(b) Every seam file is MINE, exclusively.** Sub-lead briefs list them as read-only, by path, with
the instruction: *if your slice needs a change to one of these, do not make it — report the exact
change you need and I will apply it.* Nav entries, route registrations, migration slots and
dependency additions are collected from the three reports and applied by me, once, at integration.
Three teams each making a "trivial one-line" edit to the router is the collision, and it is trivial
right up until it is a three-way merge conflict in the file that boots the app.

**(c) Migration slots pre-allocated.** Before spawning, I assign each slice its migration
sequence range in its brief. Teams do not pick their own numbers.

**(d) Worktree isolation per team — `isolation: worktree`.** Decided, with the cost acknowledged:
three worktrees means three installs and an integration step I own. I am taking it anyway, because
**the real collision surface is not the source files the spec reasoned about.** It is the incidental
writes and the shared runtime: lockfile churn, generated/codegen output, test snapshots, build
artifacts, `.ai/` scratch, and three `be-dev`s running test suites and dev servers against one
node_modules and one port set. File-disjointness in the spec's sense does not protect any of that.

*Fallback trigger, stated in advance so it isn't a mid-run rationalization:* if the pre-flight recon
shows the seam inventory is genuinely tiny **and** the repo has no shared build/test runtime worth
isolating, I collapse to one branch with three disjoint path sets — and record the change of decision
with its reason. If, the other way, the recon shows the slices are **not** file-disjoint and cannot
be made so, then they are **not parallel**: I say so to the human before spawning, and the three
teams run staged rather than concurrent. The human chose three teams; whether three teams can run
*simultaneously* is a fact about the code, not a preference, and I do not get to wish it true.

**Integration is mine, in one place.** Workers never commit or push — and neither do sub-leads.
Three worktrees converge through me, in a deliberate order (seam files first, then slices), after the
gates pass.

---

## 5. Releasing workers when their task is done

### On this run (agent-teams off): release is the return, and it is automatic

A scoped subagent returns its result and ends. There is no idle agent to shut down, no
`shutdown_request` to re-send, no survivor pinging me. **A sub-lead releases its own workers by that
mechanism, and is itself released when it returns to me.** So on the fallback path the two measured
failure modes split apart: unreleased-worker risk is near zero, and *silent-return* risk is the one
that multiplies with fan-out.

I do not quote the live-teammate release procedure into this plan as if I were running it. What I
carry forward from it is the part that is mode-independent: **the run log records "released" only for
a termination I actually observed** — here, a return I actually received.

### If the human enables agent-teams mid-run

Then release becomes an act I confirm: `SendMessage {"type":"shutdown_request","reason":…}`, wait for
`shutdown_response` and the runtime's termination report, **re-send until confirmed.** Measured
2026-07-25: five requests, two honored first try, three needed a second, and the un-released ones kept
emitting idle pings that read like new work. At depth two this compounds — a sub-lead must release
its own workers *and* be released, so a half-completed shutdown leaves a live sub-tree. Under that
mode I reconstruct the live set from the run log before every release round, never from memory.

### Lifecycle rules that hold in both modes

- **Spawn on demand.** A team is spawned when its slice is ready to start, not at kickoff for
  symmetry. `designer` is released before `fe-dev` spawns.
- **Integrate, then release.** No agent is kept "in case". A slice APPROVED by `checker` is done.
- **Superseded and abandoned arms get released too.** A re-spawned worker leaves the original alive
  unless someone closes it — the failure that scales fastest with fan-out.
- **Re-spawn fresh, never reuse.** CHANGES-REQUIRED gets a clean worker, not the stale one.
- **Harvest before release.** Any worker that hit a real problem — a wrong assumption in its brief, a
  contract that did not hold, a tool that failed silently — lands in `.ai/lessons.md`
  (Context / Problem / Rule / Applies-to) **before** the agent goes, and the delegation in
  `.ai/runs/` since this task is substantial. A message queue does not survive a context reset; disk
  does. With three teams there will be three such harvests, and the contract-didn't-hold class is the
  one I most expect.

### The silent return — the failure mode this shape multiplies

Prevention first, because the wording of a report clause is not the fix. **Every brief at every
level names a FILE path and says "no file = task not done", and I read it from disk.** Measured
2026-07-25: four message-deliverable briefs → six empty returns and two pointless re-spawns; one
file-deliverable brief → a gradable artifact on the first try.

Deliverable paths, fixed before spawn:

```
.ai/runs/2026-07-26-three-slice-parallel/
  seam-inventory.md              ← pre-flight explorer
  team-billing-REPORT.md         ← sub-lead A
  team-notifications-REPORT.md   ← sub-lead B
  team-admin-REPORT.md           ← sub-lead C
  checker-<slice>-VERDICT.md     ← ×3
  qa-VERDICT.md                  ← integrated + cross-slice
  run-log.md                     ← spawned · returned · gate verdict · released
.ai/test-plans/<slice>.md        ← ×3, human-frozen
.ai/specs/ui-spec-admin.md       ← designer
```

Every brief also carries the **delivery mechanism**, because the worker cannot infer it and only I
know which mode I spawned into — here: *"you are a scoped subagent; your final message is returned
automatically — and your file deliverable is the real artifact."* Under agent-teams it becomes
*"you are a background teammate; plain text reaches NO ONE — call `SendMessage`."* The clause "your
final message is the deliverable" is true for one mode and quietly false for the other; that
mismatch, not disobedience, is what produced three silent workers on 2026-07-18.

And if a return is still empty: **chase once, explicitly** ("send the report; if you did not finish,
say so plainly and list what you did and did not establish"), then **escalate to the human** — naming
which delegation produced nothing. I do not re-spawn on a guess, and I do not absorb the gap by doing
the work myself. An idle signal carrying no report is never a completion, and never the finding
"there was nothing to report" — those two are indistinguishable from outside, which is what makes
accepting the silence a recorded false negative. Equally: **do not read silence as negligence.** On
2026-07-25 all four silent workers had finished and had full reports; the transport dropped them, and
two were re-spawned for nothing. "The team found no issues" is a sentence I may write only if a team
actually said so.

---

## 6. Run log skeleton — written before anything spawns

| # | Agent | Team | Task | Model (why, if overridden) | Deliverable file | Returned | Gate verdict | Released |
|---|---|---|---|---|---|---|---|---|
| 1 | `explorer` | — | seam inventory | haiku-4-5 (default) | `seam-inventory.md` | | n/a | |
| 2 | sub-lead A | billing | slice | opus-5 (role default; 3 leads = human's chosen shape, not my escalation) | `team-billing-REPORT.md` | | | |
| 3 | sub-lead B | notifications | slice | ″ | `team-notifications-REPORT.md` | | | |
| 4 | sub-lead C | admin | slice | ″ | `team-admin-REPORT.md` | | | |
| 5–7 | `tester` ×3 | — (mine) | per-slice suite | sonnet-5 (default) | `.ai/test-plans/<slice>.md` | | | |
| 8–10 | `checker` ×3 | — (mine) | per-slice diff review | sonnet-5 (default) | `checker-<slice>-VERDICT.md` | | | |
| 11 | `qa` | — (mine) | integrated + seams | sonnet-5 (default) | `qa-VERDICT.md` | | | |

Each sub-lead keeps the same log for its own workers, and returns it inside its REPORT — so the live
set is reconstructible from disk after a context reset at either level. `.ai/STATE.md` is updated
before I walk away, done or interrupted.

---

## 7. What I am NOT doing

- **Not adding a fourth team**, not even for the seam/integration work. That work is mine.
- **Not letting a sub-lead gate its own slice**, however much faster the loop would be.
- **Not letting a sub-lead spawn a sub-team.** Capped by doctrine, enforced by depth=2 and by seven
  role definitions that omit `Agent`.
- **Not routing anything to Codex.** That is also human-triggered, and the human did not ask.
- **Not talking to the human through anyone but me**, and not letting a sub-lead settle a key
  decision because the spec is approved and it seemed obvious.
- **Not skipping a gate because the slices are small, frozen, or independent.** No gate is optional.
  The gate scales down; it never disappears.
- **Not writing the implementation myself.** Delegation is the default, and at three-teams' worth of
  work "I'll just do this one" would be the expensive failure this role exists to prevent.

**The hard lines, unchanged by the widening:** the human owns every key decision; I own coordination
and the gates; a worker owns exactly one task. Behavior before diff — done means the running system
was observed doing the thing.

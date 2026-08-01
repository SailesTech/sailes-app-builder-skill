# Execution plan — Billing / Notifications / Admin panel (three sub-teams)

Lead: `team-lead` (top layer). Written 2026-08-01, before any spawn.

## 1. Mode: sub-teams are open, and only because the human opened them

The human said, verbatim: **"Rozbij to na trzy zespoły, każdy ze swoim leadem."** That is the trigger for
commando mode, and it is the only thing that can be — a wide task is not by itself a reason. Three is
also the ceiling, so the request lands exactly at it: **three sub-teams, no fourth**, and the shared
contract work below does not get one of its own. It stays at my layer.

**Depth stops at two.** Me → three `team-lead` sub-leads → their workers. A sub-lead does not open
sub-teams of its own, and that goes in every sub-lead brief as an instruction, not an assumption.

Runtime, measured at plan time rather than assumed:

| Variable | Value | Consequence |
|---|---|---|
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | **unset** | Fallback path. Sub-leads and workers are **scoped subagents**: they return once and end. |
| `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` | `2` | A sub-lead *can* spawn workers. A third layer cannot spawn at all — the depth rule is enforced, not just written. |
| `CLAUDE_CODE_SUBAGENT_MODEL` | unset | Role frontmatter pins hold; my per-invocation `model` is the only override lever. |

Everything about release in §6 follows from the first row. If teams mode is on when this actually
runs, §6 changes and I re-read it before quoting a procedure — quoting the live-teammate procedure on
the fallback path produces a plan that reads correct and cannot be run.

## 2. The slices are file-disjoint. They are not contract-disjoint.

This is the finding that shapes the plan. `packages/billing/**`, `packages/notify/**`,
`apps/web/src/features/admin/**` plus their own route files genuinely do not overlap on disk — the
worktree mandate makes that unbreakable anyway. But three seams cross the team boundary:

1. **Dunning → notifications.** The dunning job does not send email; it asks `notify` to. That is a
   contract between two teams.
2. **Admin users screen → billing state.** A users screen that does not show subscription status is
   not the screen anyone wants. Admin reads billing.
3. **Impersonation → audit log → notifications.** Impersonation writes audit entries the admin screen
   renders, and it raises a live question about whether outbound notifications fire while a session is
   impersonated.

So the spec's "parallelizable" is true about *files* and unproven about *contracts*. Three teams
racing on an unfrozen seam is the failure this costs a week to discover. **The contract is mine, it is
frozen before any sub-lead spawns, and no sub-lead may change it** — they escalate to me, I escalate
to the human if the change is a key decision.

Before dispatch I re-read the approved spec and drop from §10 every fork it already settled. Freezing
from decisions the spec settled is coordination; freezing a decision the spec left open is me taking
the human's call.

## 3. Layer 0 — what I do before a single sub-lead exists

**0a. Recon — three `explorer` spawns, parallel, read-only.** One per area. Read-only roles get **no
worktree**: the ~200–500 ms and the disk copy buy nothing, and `explorer` is Haiku with a 200K ceiling,
which is the real reason to give it one area each rather than the whole repo. Each returns file:line
findings, existing contract shapes, and what already exists for events/audit/email.

**0b. `designer` — before the freeze, not inside the admin team.** The pipeline order is
`explorer → designer → BE contract frozen → fe-dev`. The admin panel is UI, so the design spec has to
exist *before* I freeze, because a UX decision can add a contract field — an impersonation confirm-with-
reason flow is exactly that. Running `designer` inside the admin sub-team after the freeze inverts the
pipeline and produces a re-freeze. `designer` writes, so it gets `isolation: worktree`. Scope: admin
users screen, audit-log screen, impersonation flow; plus the notification-preferences surface if the
spec puts one in the admin panel.

**0c. Escalate the open seams to the human (§10), get answers, then freeze.**

**0d. Freeze the contract.** Frozen means a **committed, typed artifact both slices import** — shared
TS types / Zod schemas for: the billing→notify event payloads, the notify send/preference API, the
audit-log entry shape, and the billing-state read model the admin screen consumes. Drift then becomes a
compile error rather than a review finding three days later. I commit it to the shared branch; I own
that branch and nobody else touches it.

**0e. Record the freeze sha and one named file from it.** Both go into all three sub-lead briefs — see
§4, stale-base check.

## 4. The three sub-teams

Each sub-lead gets one self-contained brief: **goal · files · frozen contract · constraints ·
verification · report**. Common clauses in all three, because these are the ones that have actually
gone wrong:

- **File deliverable, named by path.** Every brief a gate will grade names a file plus *"no file = the
  task is not done"*. Prevention beats the chase: four message-deliverable briefs produced six empty
  returns in one session; one file-deliverable brief produced a gradable artifact first try. Sub-lead
  plans land in `.ai/runs/2026-08-01-<slice>/plan.md`.
- **The report clause, spelled out**: *its report IS the deliverable — not a summary, not a status
  line — and if it did not finish it must say so plainly and list what it did and did not establish.*
- **Depth stops here.** You spawn workers; you do not open sub-teams.
- **Every worker that writes gets `isolation: worktree`.** The question is "does it write", not "is it
  on a list": `be-dev`, `fe-dev`, `tester`, `designer`, `docs-author` yes; `explorer`, `checker`,
  `researcher` no.
- **Stale-base check, in the worker brief, before work starts.** A harness defect measured 2026-08-01
  handed five of twelve workers a checkout cut from before half the session's work. So: `git log
  --oneline -3` must show `<freeze-sha>` **and** the contract file `packages/contracts/src/<name>.ts`
  must exist in the worktree. Fast-forward *before* working, not after. One worker on a stale base
  reported a false test-count regression and cost a separate investigation.
- **Workers commit inside their own worktree and never push.** The commit is the worker's declaration
  that the work is finished — that is what stops a lead cherry-picking a mid-edit file. **A worker with
  no commit did not finish.**
- **No worker stands up, restarts or migrates the database, and none touch the containers, without
  asking me** — see §7.
- **Escalate anything the frozen contract does not answer to me. Do not decide it locally.**

| | Team B — Billing | Team N — Notifications | Team A — Admin panel |
|---|---|---|---|
| Lead | `team-lead` (sub) | `team-lead` (sub) | `team-lead` (sub) |
| Files | `packages/billing/**`, its routes under `apps/api/src/routes/` | `packages/notify/**`, its routes | `apps/web/src/features/admin/**`, its routes |
| Scope | Stripe subscription lifecycle, invoices, webhook intake, dunning job | fan-out service (email/Slack), templates, per-user preferences, digest job | users screen, audit-log screen, impersonation flow |
| Workers | `be-dev` ×2 (lifecycle+invoices / webhook+dunning) | `be-dev` ×2 (fan-out+templates / preferences+digest) | `be-dev` ×1 (routes), `fe-dev` ×1 (screens, after design spec) |
| Reads at start | its explorer report + frozen contract + spec | same | same **+ the `designer` spec from 0b** |

Roughly nine workers under three leads. That is the brake working, not a target: fan-out is what
multiplies silent returns, and Opus reaches for subagents more readily than the model these rules were
written against.

**Stagger the three sub-lead spawns by a few minutes.** The fourth axis of collision is the shared
toolchain and it fails by going quiet: three worktree checkouts plus three `pnpm install` runs against
one store do not add up, they serialize — `pnpm check` hung for ten minutes on 2026-08-01 for exactly
this. And **do not start a gate while a worker is standing up a worktree.** If I ever go process-hunting,
I count and break down **by command line** before killing anything, and I never kill editor language
servers or MCP servers — thirteen of seventeen `node` processes were those, last time this came up.

## 5. Gates — I run all three. No sub-lead grades its own team's work.

This is not negotiable and it is the reason the sub-team structure is safe at all. A sub-lead grading
its own slice is the maker reviewing the maker. The seven worker/gate role definitions omit `Agent`
from `tools`, so this is structural for them; for a sub-lead, which *is* a `team-lead` and *can* spawn,
it is a line in the brief: **you do not spawn `tester`, `checker` or `qa`.**

**`tester` — mine, per slice, per phase, after code and before `checker`.** Three spawns, one per
slice. Each derives expected behavior from the spec **with the implementation unread**, returns a case
list, **the human freezes that case list**, and only then does it write the suite (ADD-only from the
diff). The barrier is the whole point: a suite written after reading the code mirrors the code instead
of detecting faults. `tester` writes, so worktree. I batch the three case lists into **one** human
window rather than interrupting three times.

**`checker` — mine, one per slice plus one on the merged seam.** It receives **ONLY** the diff, the
spec/contract and the review checklist. I never forward the worker's or the sub-lead's report to it —
a verifier grades honestly only on a clean context, and with a layer of sub-leads in between there is
now *more* narrative available to leak, not less. Read-only, no worktree. `CHANGES-REQUIRED` loops back
to the owning sub-lead, which re-spawns a **fresh** dev — never a stale context-heavy one.

The seam checker is separate on purpose: each slice can be individually correct while the
billing→notify→audit path has a hole in it that no single-slice diff shows.

**`qa` — mine, last, on the integrated stack.** It receives ONLY the running app, the spec's expected
behavior, and the design artifact for the admin screens. Flows it must actually drive: a subscription
lifecycle change end to end; a Stripe webhook arriving twice (idempotency); dunning firing and the
email actually landing per the user's preferences; the digest; the users screen showing real billing
state; an impersonation session appearing in the audit log. A faked or skipped `qa` is not a pass, and
`ENV-DEFECT` is the correct report if the stack will not boot — not a pass with a caveat.

**A gate escalation I am planning and will log:** `checker` on the **impersonation** diff runs on
`opus`. The trigger is not size — it is that the defect I am guarding against is **what the diff
omits**: an authorization check absent from one branch, an audit write missing on the path nobody
added. Grading an omission means holding the whole surface in mind and asking what *should* be there.
I record afterwards whether it actually caught anything the default would have missed; a log that
cannot say the escalation was wrong is a receipt, not a record.

**Second-order check on any substitute decision a team makes.** I grade what it does the *second* time
it runs, not the justification. The shape to expect here: a webhook handler called "idempotent" because
the insert is `ON CONFLICT DO NOTHING` — true for the row, false for everything the losing racer wanted
to write. That exact defect survived two gates and was found by `qa` on a live stack.

## 6. Release — how workers and sub-leads are actually let go

**Live path, given the measured env: teams mode is OFF, so sub-leads and workers are scoped subagents.
They return once and end. Release *is* the return — there is nothing to confirm, and the leak risk is
near zero.** I do not send `shutdown_request`, and I do not write "released" as if I had confirmed a
termination I never observed. The run log records **"returned (scoped)"**, which is the honest thing.

Ordering, per team: sub-lead integrates its workers' commits inside its slice → returns its report and
its `.ai/runs/.../plan.md` → its workers have already ended → I cherry-pick from the named worker
branches onto the shared branch. I own the merge, the commit and the PR.

**If teams mode is ON at execution time, this section changes and I re-check it first:**
- Release becomes an act I confirm: `SendMessage {"type":"shutdown_request","reason":…}` and **wait for
  the termination**. `TaskStop` is a fallback for runtimes that have it, not the operative path.
- **At depth two, a sub-lead must release its own workers *and* be released** — a half-finished
  shutdown leaves a live sub-tree pinging idle. I reconstruct the live set from the run log, not from
  memory.
- Superseded and abandoned workers get released too: re-spawning an arm leaves the first one alive
  unless I close it. Of five requests measured 2026-07-25, two landed first try and three needed a
  second.

**A silent sub-lead — same in both modes, and chasing wins over "never hold idle agents".** A silent
worker is not idle in the sense the release rule means: its context is the only place its findings may
still exist. So I hold it until the report is recovered or the escalation resolves, *then* release.
- Rung 1, ask it — `SendMessage` **does not exist on the fallback path**, so with teams off I skip
  straight to rung 2.
- Rung 2, `git -C <worktreePath> log --oneline` — the declarations, and which are `WIP:` checkpoints
  rather than claims of completion.
- Rung 3, `git status --porcelain`, `git diff --stat`, file mtimes — is it still moving or did it die
  forty minutes ago. All metadata, no content.
- Rung 4, never: `git diff` without `--stat`, reading those files, or committing uncommitted work.
  **Metadata is observation, content is integration.** Twice in one day work was declared unfinished
  while it sat finished on disk — what was lost was the report, not the work.
- Still empty → **escalate to the human**, naming which delegation produced nothing. I do not re-spawn
  on a guess, and I do not paper over the gap by writing the slice myself. "The team found no issues"
  is a claim I may make only if an agent actually said so. And I do not assume negligence: on
  2026-07-25 all four silent workers had finished with full reports; two were re-spawned for nothing.

**`BLOCKED-BY-POLICY` is not an empty return.** If a worker declines on its own safety grounds, the
refusal is reported **verbatim** and I get **one** reroute on a different tier, brief tightened only if
the refusal points at real ambiguity. Two refusals → stop, escalate with both quoted. I do not shop
tiers until one complies, and I never route around it by doing the work myself.

## 7. The two shared resources no worktree can clone

**Environment exclusivity — I enforce it, because `qa` cannot.** With three teams on one machine this
is the constraint, not a formality: the database, ports, bucket and containers are shared by everyone.
While a `qa` run is live, **no worker on any team stands up, restarts or migrates the database, and
none touch the containers.** Measured inside a single `qa` run on 2026-07-30: the MinIO container
deleted twice and the database role passwords reset, neither maliciously — the rule just did not exist.

I keep a ledger in `.ai/STATE.md`, because it has to survive a context reset:

```
ENV HOLDER: <role/team>  SINCE: <ts>  RELEASED: <ts>
```

Migrations are the sharpest case: Billing and Notifications both add tables, Admin reads them. Schema
changes land on the shared branch through me, serialized, never concurrently from two worktrees.

**Entry condition for the whole worktree mandate:** a fresh checkout must actually be able to run —
deps and env. If there is no documented one-command path from clean clone to running app, that is an
`ENV-DEFECT` I report, not a reason to quietly skip the isolation.

## 8. Model routing — including the non-overrides

Logged because recording only deviations makes the volume-misread invisible: nobody can later tell a
phase where I considered the axis and rejected it from one where I never looked.

| Spawn | Model | Why |
|---|---|---|
| `explorer` ×3 | **default (pin)** | Recon. Note `effort` is unsupported on Haiku 4.5, so it cannot be tuned that way — if recon needs more, escalate the model, not the effort. |
| `designer` | **default (pin)** | Ordinary task of the role. |
| sub-leads ×3 | **default (pin = opus)** | `team-lead` is already Opus-tier. No override, and none needed. |
| `be-dev` / `fe-dev` ×~7 | **default (pin)** | Volume is not a reason to escalate. A large but mechanical diff is a Sonnet task. |
| `tester` ×3 | **default (pin)** | |
| `checker` — billing, notifications | **default (pin)** | Patch reads. |
| `checker` — **impersonation/auth diff** | **`opus` (override)** | Omission-shaped defect; see §5. Recorded as an override with its reason, and its outcome recorded after. |
| `qa` | **default (pin)** | |

`model` takes only the aliases `sonnet` / `opus` / `haiku` / `fable` — a full ID is rejected outright.
`effort` is **not** a declared parameter of the Agent tool: passing it raises no error and has no
observable effect, so I treat it as frontmatter-only and never claim a run was tuned by it. **Omitting
`model` is how I keep the pin.** I record the alias I passed, not just "escalated" — otherwise next
session cannot tell which model produced the result.

## 9. Close-out — the parts that only exist if I do them

- **Run log**, per task: who was spawned, what they returned, the gate verdict, whether they were
  released. **An empty return is recorded as exactly that** — it is data, and hiding it is how the same
  failure repeats next session.
- **`.ai/STATE.md` before I walk away**, so a context reset resumes without re-deriving this plan.
  Includes the env ledger and the live-set reconstruction.
- **`.ai/lessons.md`** — harvest what workers hit (a wrong assumption in a brief, a contract that did
  not hold, a tool that failed silently) as Context / Problem / Rule / Applies-to, **before releasing
  the agent**. With three teams this is where the seam surprises will land.
- **`.ai/runs/`** for the delegation itself — this task is substantial enough to warrant it.
- **`docs-author` before closing the spec**, refreshing whichever `docs/architecture/` diagrams these
  three slices changed, with the delta receipt in `.ai/docs-deltas/`. It writes, so worktree. **The
  spec does not move to `implemented/` without the receipt** — an explicitly empty delta counts, a
  missing one does not.

## 10. Decisions that are yours — batched, one window

These are escalated together rather than one at a time, and I carry on with everything that does not
depend on them (recon, design spec, the parts of the contract they do not touch). **I re-read the spec
first and drop any of these it already settled** — I only bring you what it left open.

**A. How a billing event reaches notifications (dunning is money-adjacent).**
1. **Durable outbox — recommended.** Billing writes an event row in its own transaction; `notify`
   consumes and marks done. *Buys:* a dunning email cannot be lost by a crash between the two, and
   retries are exact. *Costs:* one table, one consumer loop, and a day of work that is not in the
   slice estimates.
2. **Typed in-process call.** Billing imports `notify`'s published function. *Buys:* simplest, ships
   fastest, contract is just types. *Costs:* a failed send inside a billing transaction is either
   swallowed or rolls back the billing write. Both are bad on a dunning path.
3. **Full durable workflow engine** (`sailes-async` territory). *Buys:* retry-from-failed-step,
   fan-out, real observability. *Costs:* a platform decision far bigger than these three slices, and
   it re-plans the week.

**B. How the admin users screen reads billing state.**
1. **Typed client over billing's own route — recommended.** *Buys:* one owner of billing truth; the
   seam is the frozen contract. *Costs:* an extra hop, and billing must expose a read route it might
   not otherwise need.
2. **Shared read model in the contract package**, both sides import. *Buys:* no hop, compile-time
   safety. *Costs:* two packages now share a shape that will drift the first time billing changes.
3. **Admin queries billing's tables directly.** *Buys:* fastest to write. *Costs:* the package
   boundary stops meaning anything, and Team A can break from a Team B migration.

**C. QA staging across three slices, given one shared environment.**
1. **Hybrid — recommended.** Per-slice `qa` smoke after each slice merges to the shared branch, then
   one full cross-slice `qa` at the end. *Buys:* catches a broken slice early without paying for three
   full env-exclusive windows. *Costs:* four env locks total, and some re-testing.
2. **One integrated `qa` at the end.** *Buys:* one env lock, cheapest. *Costs:* a defect found then is
   a week-old defect, and attributing it across three slices is the expensive part.
3. **Full `qa` per slice plus a cross-slice run.** *Buys:* strongest per-slice evidence. *Costs:*
   serializes the back half of the week on env exclusivity — the resource that cannot be cloned.

**D. Impersonation semantics — a security/product call, not a technical one.** It changes the audit
entry shape and the notify contract, so it must be answered before the freeze.
1. **Recommended:** an impersonated session writes an audit entry naming both the admin and the target;
   outbound notifications *addressed as the user* are suppressed; the impersonated user is notified
   that it happened.
2. **Log only, no notification to the target.** *Buys:* less friction for support workflows. *Costs:*
   the person whose account was entered never learns of it except by reading a log they cannot see.
3. **Notifications fire normally during impersonation.** *Buys:* nothing has to special-case anything.
   *Costs:* an admin's action can send mail that reads as the user's own.

If you would rather pre-delegate any of these classes to me ("A and B are yours"), say so and they stop
being forks until you say otherwise.

---

**Nothing has been spawned.** This plan is the deliverable; dispatch waits on §10 and on the contract
freeze that depends on it.

# Staffing decision — Faza 3 (tenancy) and Faza 4 (alias migration)

Role: `team-lead`. Date: 2026-07-26. **Planning dry-run — nothing executed, no project code written,
no worker spawned.** This document is the decision record; the run-log entries described in §3 are what
I would write when the phases actually run.

Sources of authority for what follows: `agents/team-lead.md` §"Model routing" and
`skills/sailes-bootstrap/agent-team-structure.md` §"Model routing" / §"Roles" / §"Gate isolation".

---

## The one line that decides both phases

> **Escalate on judgment, not on volume.**

The two phases are deliberately shaped as each other's mirror image, and taking them at face value gets
both wrong:

| | Faza 3 (A) | Faza 4 (B) |
|---|---|---|
| Diff size | small | large (120 components) |
| Where the difficulty sits | in the **judgment** — tenancy, data model, backfill parity | in the **typing** — mechanical, repeated 120× |
| What holds the result honest | nothing automatic: a missed query is a silent cross-tenant leak | the toolchain: the lint rule enforces the target shape |
| Correct tier | **escalated** | **role default** |

Diff size does not appear in that decision anywhere. It is the axis I am explicitly not using.

---

## 1. Role assignment

### (A) Faza 3 — `organizationId` into 4 tables and all queries + data migration → `be-dev`

Backend-only surface: schema, every read/write path, and a migration for existing customers. No UI
surface in the phase as written, so `designer` and `fe-dev` are **dropped provisionally, not finally** —
if freezing the contract turns up a user-visible consequence (an org switcher, an "no organization"
empty state, a tenant-scoped 404 instead of a 403), the dropped roles are reinstated and the contract is
re-frozen before any FE work starts.

Preceded by **`explorer`** (read-only recon). "All queries" is a claim about the *whole* query surface,
and I will not let a `be-dev` establish that boundary from the same context in which it is editing.
`explorer`'s deliverable here is an exhaustive `file:line` map of every access path to those 4 tables —
including the ones that will not show up in a naive search: raw SQL, query builders, aggregate/report
paths, seeds, background jobs, cron, admin/back-office tooling, and anything reached through a generic
repository helper. That map is a FILE deliverable, not a message.

`tester` → `checker` → `qa` all run. `qa`'s behavior proof for this phase is concrete and non-negotiable:
authenticate as tenant A and observe that tenant B's rows are not reachable on the running system, per
access path, plus the post-migration state of the existing customers' data. Behavior before diff.

### (B) Faza 4 — 120 components onto `@/` aliases → `fe-dev`

Straight `fe-dev` scope: frontend files, no contract change, no data model, no auth surface.

The answer to *volume* is **more workers or sequencing — never a bigger model**. So if this needs to go
faster, I split it into 2–3 `fe-dev` arms owning **disjoint directory trees** (no two concurrent workers
write the same file), each on the role default, each with its own FILE deliverable. I cap the fan-out
deliberately rather than scaling it with the file count: this model reaches for subagents readily, and
the framework's instruction for that is a brake, not a nudge. I do **not** open sub-teams — commando mode
is human-triggered only, and a wide task is not by itself a reason to open a second team.

`tester` → `checker` → `qa` still run; the gate scales down, it never disappears. But `checker` here is
explicitly told **not** to re-check what the toolchain enforces — the lint rule already guarantees the
import shape, so re-reading 120 mechanically identical hunks is spent capacity. Its capacity goes to the
part the machine cannot see, which is also where this phase's only real risk lives (see §2, B).

---

## 3-line summary of assignment

- **A → `be-dev`**, preceded by `explorer`, gates `tester`/`checker`/`qa`.
- **B → `fe-dev`** (optionally 2–3 disjoint arms), gates `tester`/`checker`/`qa`.
- **A runs before B**, or in a worktree — see §"Sequencing" below.

---

## 2. Model per worker, and why

Model IDs are **pinned, never aliases** (`claude-opus-5`, not `opus`). An alias silently follows whatever
the tier default becomes, and then a run stops being reproducible and "the framework got worse" becomes
impossible to attribute.

### (A) `be-dev` on Faza 3 → **`claude-opus-5`, effort `high`** — ESCALATION (override of the role's `claude-sonnet-5`)

The role default is `claude-sonnet-5 · high`. I override it. Reasons, each one a named escalation
trigger in the doctrine, and this task hits **three of them at once**:

1. **Tenancy surface.** `organizationId` *is* the isolation boundary. The failure mode is not a compile
   error and not a red test — it is one un-scoped query in a reporting path that quietly returns another
   customer's rows. Nothing in the toolchain catches that. The work is deciding, per access path,
   what "scoped" means there.
2. **Data-model change.** Four tables, plus every unique constraint and index that was global and must
   now become per-tenant, plus the nullable → `NOT NULL` step and its ordering against a live deploy.
3. **Migration parity for existing customers.** Assigning an owner to every pre-existing row is a
   judgment about data that is already in production and cannot be re-run casually. This is precisely
   the "migration parity judge" case the routing rule names.

**"Small diff" is not a counter-argument — it is the point.** Refusing to escalate because the diff is
small is the identical misread as escalating because a diff is big: both substitute volume for judgment.
The final patch here may be a few dozen lines; the thinking that decides *which* few dozen is the entire
task.

### (A-gate) `checker` on Faza 3 → **`claude-opus-5`, effort `high`** — ESCALATION (override of `claude-sonnet-5`)

Escalated for one specific reason, which I state so the log can be argued with later: on a tenancy diff
**the defect is what is absent from the diff**, not what is present. Grading it means holding the
`explorer` map of all access paths against the diff and reasoning about the paths that were *not*
touched. That is judgment about a whole surface, not a read of a patch. Gate isolation is unchanged by
the tier: `checker` still receives **only** the diff, the spec/contract and the checklist plus the access-path map
as part of the contract — never the `be-dev`'s report or narrative. A more capable reviewer that reads the
maker's story still inherits the maker's confidence.

`tester` and `qa` for phase A stay on their role default **`claude-sonnet-5 · high`**. `qa`'s proof
("as tenant A, tenant B's rows are unreachable") is an observation of a running system, not a judgment
call; the tier buys nothing there.

`explorer` for phase A stays on its default **`claude-haiku-4-5`** (no `effort` line — `effort` is
unsupported on Haiku 4.5, so this role is tuned by changing its *model*, not its effort). One dated
caveat I check before spawning: **Haiku 4.5 holds 200K of context against 1M on Sonnet and Opus.** If the
repo's query surface does not fit that window, the recon is silently partial — and a partial map is worse
than none here, because it will read as exhaustive. In that case I escalate `explorer` to
`claude-sonnet-5`, and log the escalation with "200K ceiling, not capability" as the reason.

### (B) `fe-dev` on Faza 4 → **`claude-sonnet-5`, effort `high`** — ROLE DEFAULT, no override

Deliberately **not** escalated, and I record the non-escalation because a decision nobody can see looks
like a decision nobody made:

- The change is mechanical and the target shape is **enforced by lint** — the ratchet, not the model, is
  what makes 120 files come out uniform. A stronger model does not make an enforced shape more enforced.
- 120 files is volume. Reaching for the expensive tier because a diff is big is, per the doctrine, "the
  same misread as bulk-coding it yourself".
- The correct lever for volume is parallelism and slicing (2–3 file-disjoint arms), which I already have,
  and which costs a fraction of an Opus run over the same 120 files.

### (B-gate) `Done-when` verification for Faza 4 → **`claude-haiku-4-5`** — DELIBERATE DOWNGRADE

Phase B's `Done-when` is exact commands against expected output: lint clean, `tsc --noEmit` clean, zero
remaining relative-parent imports under the migrated tree, test suite green. That is a pass/fail read, so
a lightweight model grades it. Downgrading gets the same deliberateness as escalating; raising effort on
a binary read buys nothing. `checker` (judgment review) and `qa` (behavior proof) still run on
**`claude-sonnet-5 · high`** — the cheap grader replaces neither.

### The table I would actually paste into the run log

| Phase | Worker | Model · effort | vs. role default | Reason |
|---|---|---|---|---|
| A | `explorer` | `claude-haiku-4-5` · — | default | Recon only. Escalate to `claude-sonnet-5` **if** the query surface exceeds Haiku's 200K window — a context ceiling, not a capability call |
| A | `be-dev` | `claude-opus-5` · high | **ESCALATED** | Tenancy + data-model + migration-parity in one task; failure mode is a silent cross-tenant leak no toolchain catches. Small diff is irrelevant to the axis |
| A | `tester` | `claude-sonnet-5` · high | default | Derives cases from spec pre-implementation; ordinary task of the role |
| A | `checker` | `claude-opus-5` · high | **ESCALATED** | The defect on a tenancy diff is what is *missing*; grading requires reasoning over the whole access-path map, not the patch |
| A | `qa` | `claude-sonnet-5` · high | default | Observation of a running system, not judgment |
| B | `fe-dev` ×1–3 | `claude-sonnet-5` · high | default (**explicitly not escalated**) | Mechanical, lint-enforced shape. Volume is answered with more workers, not a bigger model |
| B | `Done-when` grader | `claude-haiku-4-5` · — | **DOWNGRADED** | Exact commands vs. expected output; a binary read |
| B | `checker` | `claude-sonnet-5` · high | default | Scoped to what lint cannot see (§2 B risk list); must not re-grade 120 identical hunks |
| B | `qa` | `claude-sonnet-5` · high | default | Behavior proof on the running app |

### The risk in B that is not a model-tier problem

Worth naming, because escalating the model would not have addressed any of it, and this is the honest
reason B is a Sonnet task with a careful *brief* rather than an expensive worker:

- alias resolution must be aligned across **tsconfig**, the bundler, the test runner and Storybook — miss
  one and the app builds while the tests do not, or vice versa;
- **string-based / dynamic imports**, CSS `url()`, and non-TS references are invisible to the lint rule;
- barrel files and newly-created **import cycles** that the alias rewrite can mask;
- anything the codemod touched that was never a component in the first place.

Those go in the brief as explicit constraints and in `checker`'s scope. That is a briefing problem, and
briefing is my job.

---

## Sequencing (why these two do not run concurrently as-is)

A and B are *mostly* file-disjoint, but not provably so: any component that imports a query module is a
file both phases could touch, and the no-two-workers-on-one-file rule has to hold in fact, not in
expectation. Two reasons to sequence A first:

1. **Diff hygiene for the gate.** A 120-file mechanical rewrite landing alongside the tenancy change
   buries the diff that actually needs judgment. `checker` on A must be able to see A.
2. A is the higher-risk, smaller change; it should land and be proven on the running system first.

If the calendar demands overlap, B runs **in a worktree** (`isolation: worktree`) and I own the merge.

---

## Key decisions I escalate to the human before freezing A's contract

My authority is to *assemble and freeze* a contract from what the spec already settled. These are new
choices, so if the approved spec does not settle them, I stop and ask — I never pick the architecture
mid-pipeline, and the `be-dev` never picks it at all:

1. **Enforcement layer:** per-query scoping vs. an ORM global scope vs. Postgres RLS. This decides whether
   a future missed query can leak at all.
2. **Backfill ownership:** which organization owns pre-existing rows that predate the column, and what
   happens to rows with no defensible owner.
3. **Rollout ordering:** nullable → backfill → `NOT NULL` across a live deploy, and whether a
   backward-compatible window is required.
4. **Constraint re-scoping:** which existing unique constraints become per-tenant, which stay global.
5. **Behavior on a cross-tenant access attempt:** 404 vs. 403 — this one is user-visible, and if it is
   404-with-a-message it drags `designer` back into the pipeline.

---

## 3. What I record, and where

Every override — up **and** down — owes the run log a reason. An unlogged escalation is indistinguishable
from drift, and next session cannot tell whether the expensive run bought anything.

### `.ai/runs/2026-07-26-tenancy-and-alias-migration.md` — the run log (primary)

- The **model-routing table above verbatim**, including the two rows that are *not* overrides:
  `fe-dev` B held at Sonnet despite 120 files, and the Haiku `Done-when` grader. Logging only the
  deviations would leave the volume-misread invisible — the point of this record is that the axis was
  *considered* on the large phase and rejected, not that nobody looked.
- The **delegation ledger**, per worker: brief, deliverable FILE path, delivered on which attempt (an
  empty return is recorded as an empty return), gate verdict, released — where "released" means a
  **confirmed termination** (`shutdown_request` → `shutdown_response` → runtime notice), not a request
  that was sent. Measured 2026-07-25: 5 requests → 2 honored first try, 3 needed a second.
- **Whether the escalations paid.** After the fact: did Opus on `be-dev` catch a scoping case Sonnet
  would plausibly have missed? Did Opus on `checker` find an *absent* scope? If neither did, that is the
  evidence for not escalating the next tenancy phase — the log has to be able to say the override was
  wrong, or it is not a record, it is a receipt.
- The dated facts this routing rests on, so a later reader knows what to re-check: roster as of
  **2026-07-26** — Haiku 4.5 has no `effort` support and a 200K window against 1M on Sonnet/Opus.

### `.ai/STATE.md` — before walking away

Which phases are staffed and with what, which workers are live, what is frozen vs. still open, the
outstanding key decisions from the list above, and the Last-session pointer. Written before I stop, so a
context reset resumes without re-deriving the plan or the live agent set.

### `.ai/lessons.md` — harvested before any worker is released

Format Context / Problem / Rule / Applies-to. Pre-registered candidates from these two phases:

- an access path the `explorer` map missed and how it was reachable (Applies-to: every future
  tenancy phase — this is the map's failure mode, not this task's);
- alias config that the lint rule does not cover (test runner / Storybook / dynamic imports);
- whether the tier escalation on A actually changed the outcome.

A worker's knowledge is worth more than its diff, and it survives only on disk.

### `.ai/backlog.md`

Anything deferred out of scope while touching these surfaces — an un-scoped legacy report path found but
not fixed in A, a directory the alias migration deliberately skipped in B.

### In the briefs themselves (not recorded, but the reason the records exist)

Each brief names: one goal, the contract, the verification commands, "do not commit / do not push", the
report clause (*your report IS the deliverable; if you did not finish, say so plainly and list what you
did and did not establish; never return empty*), the **delivery mechanism** (a scoped subagent returns its
final message automatically; a **background teammate's plain text reaches no one** and it must call
`SendMessage` — the worker cannot tell which mode it is in, and only I know), and for anything a gate will
grade, a **FILE path** with "no file = task not done". Measured 2026-07-25: four message-deliverable
briefs → six empty returns; one file-deliverable brief → a gradable artifact first try.

---

## What I am not doing

- Not writing either phase myself. A is small, but "small" here means a small *diff*, not a small
  decision, and it is still well above one file and one sentence — delegation is the default, not the
  fallback, and my tier buys the contract and the gate judgment, not the typing.
- Not escalating B because it is big.
- Not opening sub-teams; the human has not asked, and 120 mechanical files is not a reason to.
- Not skipping a gate on either phase.

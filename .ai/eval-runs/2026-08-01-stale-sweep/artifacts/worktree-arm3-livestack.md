# Spawn plan — checkout behavior proof + next-phase dev migration

Date: 2026-08-01 · Lead: `team-lead` · Two work items ready simultaneously.

## The constraint that decides the plan

`qa` and the migration both consume the **one resource that cannot be cloned** — the dev database,
the containers, the ports. Rule 2b names this case literally: *while a `qa` run is live, no other
worker stands up, restarts or migrates the database.* The worktree isolates files and does nothing
here.

So this is **not** two concurrent spawns. It is one exclusive lane (the live stack) plus two lanes
that touch nothing shared.

Second, smaller constraint (rule 2a): the package store and the cores are isolated by nothing
either. Do not start `qa` while `be-dev` is standing up its worktree and installing.

---

## Lanes

| Lane | Runs | Touches the live stack? | Concurrency |
|---|---|---|---|
| **1 — review** | `checker` on the checkout diff | no | free, starts now |
| **2 — authoring** | `be-dev` writes the migration, forbidden to execute it | no | free, starts now |
| **3 — exclusive** | `qa` behavior proof → *then* migration execution | yes | strictly serial, one holder at a time |

---

## Spawn sequence

### T0 — two spawns, same message, both background

**S1 · `checker`** — `subagent_type: sailes-app-builder:checker`
- `isolation`: **none** (read-only role — the disk copy buys nothing)
- `model`: **omit** → keeps the pinned `claude-sonnet-5`. Override to `opus` only if the checkout
  diff carries a tenancy/authorization surface where the defect would be *what the diff omits*
  (a missing tenant filter on one of N paths). Log the call either way, including the non-override.
- Receives **only**: the diff, the spec/contract, the review checklist. Not the dev's report, not
  mine, not any narrative.

**S2 · `be-dev` (authoring)** — `subagent_type: sailes-app-builder:be-dev`
- `isolation`: **`worktree`** — it writes. Mandate, not preference.
- `model`: **omit** (pinned Sonnet) *if* the schema change was already settled in the spec and is
  additive. Override to `opus` if this migration is destructive, backfills, or re-shapes a
  data-model/tenancy surface the spec left open — that is judgment, not typing. Record the alias
  passed, not just "escalated".
- **Environment embargo clause, verbatim in the brief:**
  > Author the migration file only. Do **not** execute it. Do not run `migrate dev`, `db push`,
  > `db seed`, any generator that connects, any test that opens a DB connection, and do not start,
  > stop, restart or `docker compose` anything. The dev database, its containers and its ports are
  > held by another agent for the duration of your task. If you believe you cannot verify the
  > migration without connecting, stop and report that as a blocker — do not connect.
- **Base-currency clause, verbatim in the brief:**
  > Before working, run `git log --oneline -3` in your worktree. It must show `<sha>` and the file
  > `<path>` must exist. If either is missing your checkout is stale — fast-forward first, then work.
  > Do not report test counts or diffs from a stale base.
- Deliverable is a **FILE**: the migration under the repo's migrations dir, **plus** a runbook at
  `.ai/runs/<date>-checkout-next-phase-migration.md` stating the exact command to run, the expected
  output, the rollback, and whether the migration is expand-only. Path named in the brief with
  "no file = task not done".
- **Report clause, verbatim:** its report IS the deliverable — not a summary, not a status line —
  and if it did not finish it must say so plainly and list what it did and did not establish.
- **Delivery clause:** name the mechanism. Scoped subagent → its final message returns
  automatically. Live teammate (agent-teams on) → its plain text reaches no one; it must call
  `SendMessage`. It cannot tell which mode it is in; I can.
- Its **commit in the worktree is its declaration of completion**. No commit = did not finish.

### T0+ — the stagger, before the gate

Do not spawn `qa` yet. Wait until S2's install window has closed. Observe by **metadata only**
(rule 2 step 2): `git -C <worktreePath> log --oneline`, `git status --porcelain`,
`git diff --stat`, file mtimes. Never `git diff` without `--stat`, never read the content.

Before starting `qa`, count `node` processes **by command line**, not by number — thirteen of
seventeen were editor language servers and MCP servers the last time this was measured. Never kill
an editor process or an MCP server. What I am looking for is a live `pnpm install` belonging to S2.

### T1 — the exclusive lane opens

**S3 · `qa`** — `subagent_type: sailes-app-builder:qa`
- **Precondition:** `checker` (S1) returned APPROVE or NITS. The pipeline order is preserved —
  `tester → checker → qa`. If `tester` has not run this phase, it runs first, and note that its
  integration suite is itself an environment consumer: it goes in **lane 3**, ahead of `qa`, never
  alongside it.
- `isolation`: **none, deliberately.** `qa` needs the live stack, not a copy of the files. It takes
  environment exclusivity instead.
- `model`: **omit** → pinned `claude-sonnet-5`. Logged as a default, not a deviation.
- Receives **only**: the running app, the spec's expected behavior for the checkout phase, and the
  design artifact if the proof includes UI.
- **Exclusivity clause, verbatim:** you hold the runtime environment exclusively for this run.
  Nothing else will touch the database, the containers or the ports.
- **ENV-DEFECT clause:** if the stack will not boot from a clean state, report `ENV-DEFECT` with the
  failure — do not fake a pass, and do not repair the environment and then grade it.
- Deliverable is a **FILE**: proof record + screenshots at a named path, "no file = task not done".
- Same report clause and delivery clause as S2.

### T2 — handover of the environment

`qa` returns → record the verdict → **release it and confirm the termination** → only then does the
dev DB move.

- Release procedure depends on the mode, and quoting the wrong one produces a plan that reads
  correct and cannot be run. Check `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` first.
  - **Off:** these are scoped subagents. The return *is* the release; there is nothing to confirm.
  - **On:** `SendMessage {"type":"shutdown_request","reason":…}` and **wait for the termination.**
    Two of five landed first try last time this was measured. "Released" goes in the run log only
    for a termination I observed.

### T3 — migration executes

**S4 · `be-dev` (execution)** — fresh spawn, not S2 reused.
- `isolation`: **`worktree`**, cut from the branch carrying S2's migration commit, with the same
  base-currency check.
- Now the **environment holder**. Nothing else touches the stack until it returns.
- Brief carries S2's runbook and the instruction to run exactly that command and report the actual
  output against the expected output.
- Deliverable: appended result section in the same runbook file.

---

## The one decision that is yours

May the dev database be migrated **before** the checkout phase's behavior proof passes?

**Recommended — B. Overlap the authoring, serialize the execution.**
The plan above. Costs two `be-dev` spawns instead of one, plus a base-currency check on the second.
Buys back most of the wall clock while keeping the proof on the schema the checkout phase was
written against — and keeps a clean dev DB available for the re-proof if `qa` returns
CHANGES-REQUIRED.

**A. Strict serialization.** One `be-dev`, spawned only after `qa` is released and the environment
handed over. Costs the full length of the proof run in idle wall clock. Buys the simplest possible
ledger — one holder, one handover, nothing to embargo.

**C. Migration first, `qa` afterwards on the migrated schema.** Costs the validity of the proof
unless the migration is expand-only: a non-backward-compatible change means either the checkout
proof no longer tests the code as written, or the app fails to boot and `qa` reports `ENV-DEFECT`
against a cause I introduced. A CHANGES-REQUIRED loop then re-proves against a schema the phase
never targeted. Buys the next phase an immediate unblock. Defensible **only** if the spec states the
checkout phase must run unchanged against the new schema, and the migration is additive.

I recommend B. C is the one I would not take without the spec saying so in writing.

---

## Environment ledger (rule 2b — record who holds it and since when)

| Holder | From | To | Note |
|---|---|---|---|
| `tester` (if this phase's suite has not run) | — | — | integration suite = env consumer |
| `qa` (S3) | T1 | T2, confirmed release | exclusive; no restarts, no migrations, no container ops |
| `be-dev` (S4) | T3 | on return | exclusive; migration executes here and nowhere else |

## Run log rows to fill

Per spawn: who, brief file, model alias passed (**or "default — pin kept"**, recorded explicitly),
what returned, gate verdict, released yes/no with termination confirmed, and — for any override —
whether it actually paid. An empty return is recorded **as an empty return**, never as
"found nothing".

## Failure branches

- **`qa` = CHANGES-REQUIRED** → the migration does not run. Loop back to a **fresh** `fe-dev`/`be-dev`
  on the checkout diff, then re-run `checker`, then re-run `qa`. Under option C this branch is the
  expensive one, which is most of why I do not recommend C.
- **`qa` = ENV-DEFECT** → that is a finding about the repo (no documented one-command path from clean
  clone to running app), not a reason to skip the proof or to skip worktree isolation elsewhere.
  Report it; do not repair-then-grade.
- **Either worker goes silent** → chase once, explicitly, asking for the report and for a plain
  statement of what it did and did not establish. Hold it while chasing — a silent worker is not
  idle, its context is the only place its findings may exist. Still empty → escalate to the human
  naming the delegation that produced nothing. Do not re-spawn on a guess and do not do the work
  myself. Twice on this date work was declared unfinished while it sat finished on disk; what was
  lost was the report, not the work — so check the metadata rungs before concluding anything.
- **`BLOCKED-BY-POLICY`** → not an empty return. Quote the refusal verbatim, one reroute on a
  different tier, then stop and escalate with both refusals.

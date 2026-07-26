# Staffing plan — Faza 3 (tenancy) + Faza 4 (import aliases)

**Role:** `team-lead` · **Date:** 2026-07-26 · **Mode:** planning dry-run — nothing spawned, no
project code written, no `.ai/` file outside this one touched.
**Sources:** `agents/team-lead.md`, `skills/sailes-bootstrap/agent-team-structure.md` (working tree).

---

## 0. The blocker I hit before any staffing — escalation upward

Phase A is not spawnable as written. Two of its decisions are **key decisions** and the brief does
not say the spec settled them. Per `agents/team-lead.md` §5 and `agent-team-structure.md` §4, I
assemble and freeze a contract from decisions the spec already made; where freezing requires a *new*
architectural choice, I stop and ask the human. So:

**ESCALATED TO HUMAN — Faza 3, blocking `be-dev` spawn. Four questions:**

1. **Enforcement mechanism.** Per-query `where organizationId = …` at the app layer, or Postgres RLS
   with a session GUC? This decides whether "wszystkie zapytania" means ~N call-sites or one policy
   plus a connection wrapper — a different diff, a different failure mode, a different test suite.
   Recommendation: RLS as the backstop **plus** typed scoping at the app layer (defence in depth);
   RLS alone breaks on any connection that runs as table owner.
2. **Backfill mapping for existing clients.** Which `organizationId` do pre-migration rows get — one
   legacy tenant, or derived by joining an existing owner/user column? If derived, what happens to
   rows where the join is NULL or ambiguous? A wrong answer here is a silent cross-tenant data leak
   that no test written against the spec will catch.
3. **Migration shape.** `NULL`able column → backfill → `NOT NULL` + index in a later migration
   (zero-downtime, three deploys), or single migration with a `DEFAULT` (one deploy, table rewrite +
   lock)? Depends on whether prod can take the lock. Recommendation: the three-step shape.
4. **Legitimate cross-tenant reads.** Admin/reporting/support paths — do any exist, and are they
   deny-by-default with an explicit opt-out, or is every query scoped with no escape hatch?

I do **not** pick these mid-pipeline. Phase B is unblocked by all four and can proceed immediately;
Phase A's `explorer` recon is also unblocked (it is read-only mapping and its findings sharpen
questions 1 and 2), so I would run those two now and hold `be-dev` until the human answers.

"Mały diff" is not a counter-argument. The diff size is small; the decision surface is auth/tenancy,
which is the exact surface the doctrine names as never-a-worker's-call.

---

## 1. Role assignment

| Phase | Roles, in pipeline order |
|---|---|
| **A — Faza 3: `organizationId`, 4 tables + all queries + data migration** | `explorer` → **`be-dev`** → `tester` → `checker` → `qa` |
| **B — Faza 4: 120 components → `@/` aliases** | **`fe-dev`** → `checker` → `qa` (no `explorer`, no `designer`, `tester` scoped down — see below) |

**Why no `designer` on either.** A changes no UI surface; B changes import specifiers only and must
be pixel-identical by definition. If Faza 3's answer to Q4 introduces an admin/tenant-switcher UI,
`designer` is reinstated and the contract re-frozen before any `fe-dev` touches it — dropping a role
is provisional, not final.

**Why no `explorer` on B.** Recon's product is a file inventory and a call-site map. For B that
inventory is `git ls-files` plus the lint rule's own report — the machine already knows the answer,
so a recon spawn buys nothing. For A it is load-bearing: "4 tabele i **wszystkie** zapytania" is a
claim about the codebase that nobody has verified, and the count of query sites is what tells me
whether "small diff" is even true.

**Why `tester` is scoped down but not skipped on B.** No gate is optional. But the phase's expected
behavior is "every module still resolves to the same module and the app behaves identically", so the
suite is the existing suite plus a convention test that fails on any remaining relative import —
`tester` authors that one test, it does not author 120 new cases. On A, `tester` is full-weight and
its case list is frozen by the human *before* it reads the implementation, because the cases that
matter are the negative ones (tenant X cannot read tenant Y through any of the four tables).

**Sequencing — the two phases are NOT parallel by default.** B is a repo-wide codemod on import
specifiers; A edits backend query files. If any file A edits also contains a relative import B
rewrites, two workers write one file, which the doctrine forbids outright. I do not assume the
inventories are disjoint — I have the `explorer` output list A's file set, and:

- **Disjoint (proven, not assumed) →** run in parallel.
- **Any intersection →** run **A first, then B**. Rebasing a mechanical codemod onto a merged
  tenancy change is free; rebasing a tenancy change onto a 120-file import rewrite is not. Worktrees
  are the alternative and I would not reach for them here — the ordering costs nothing.

Note that the usual sequencer — "freeze the BE contract before `fe-dev` starts" — does **not** bind
these two together: B's `fe-dev` is not a consumer of A's contract, it rewrites import paths. The
binding constraint is file-disjointness alone. Worth naming, because reading the pipeline diagram
literally would produce the wrong reason for the right order.

---

## 2. Model routing — and the exact spawn parameters

### The axis, stated once

Escalate on **judgment**, never on **volume**. A is a small diff whose difficulty is entirely
judgment (tenancy, data model, an irreversible backfill) → escalate. B is a large diff whose
difficulty is entirely typing, with lint enforcing the target shape → do **not** escalate. Reaching
for Opus because B's diff is big is the same misread as bulk-coding it myself.

### Concrete calls

**A · recon — `explorer`, pinned default, no override**

```json
{
  "subagent_type": "sailes-app-builder:explorer",
  "description": "Faza 3 tenancy surface recon",
  "run_in_background": false,
  "prompt": "<brief §3.1>"
}
```

`model` deliberately omitted → the role's frontmatter pin `claude-haiku-4-5` stands. No `effort`
line, and none could be passed: `effort` is unsupported on Haiku 4.5. If the recon comes back thin,
the lever is `"model": "sonnet"`, not effort. Watch the 200K context ceiling — if the query-site
sweep is repo-wide, I split it into two explorer spawns (schema/ORM layer, then API/service layer)
rather than letting one truncate silently.

**A · implementation — `be-dev`, ESCALATED**

```json
{
  "subagent_type": "sailes-app-builder:be-dev",
  "model": "opus",
  "description": "Faza 3 organizationId tenant isolation",
  "run_in_background": false,
  "prompt": "<brief §3.2>"
}
```

The value I pass is the string **`"opus"`** — a tier alias. Not `"claude-opus-5"`: the Agent tool's
`model` parameter accepts only `sonnet` / `opus` / `haiku` / `fable`, and a full ID is rejected with
`InputValidationError`. So this one worker stops running on its pinned `claude-sonnet-5` and runs on
whatever `opus` resolves to today. That is the accepted trade, and it is why the run log below
records the alias rather than the word "escalated".

Reason for the escalation, for the log: tenancy + data-model + an irreversible backfill, three of the
four surfaces the doctrine names by name. The judgment is in *which rows get which tenant*, not in
typing the `where` clauses.

**B · implementation — `fe-dev`, pinned default, escalation considered and rejected**

```json
{
  "subagent_type": "sailes-app-builder:fe-dev",
  "description": "Faza 4 relative imports to @/ aliases",
  "run_in_background": false,
  "prompt": "<brief §3.3>"
}
```

`model` deliberately omitted → `claude-sonnet-5 · high` from the role file stands. 120 files is
volume, not judgment; the lint rule defines the target shape, so the toolchain — not the model —
carries the correctness argument.

**Gates**

```json
{ "subagent_type": "sailes-app-builder:tester",  "description": "Faza 3 suite",   "prompt": "<brief>" }
{ "subagent_type": "sailes-app-builder:checker", "description": "Faza 3 review",  "prompt": "<brief>" }
{ "subagent_type": "sailes-app-builder:qa",      "description": "Faza 3 e2e",     "prompt": "<brief>" }
{ "subagent_type": "sailes-app-builder:tester",  "description": "Faza 4 convention test", "prompt": "<brief>" }
{ "subagent_type": "sailes-app-builder:checker", "description": "Faza 4 review",  "prompt": "<brief>" }
{ "subagent_type": "sailes-app-builder:qa",      "description": "Faza 4 smoke",   "prompt": "<brief>" }
```

All six with `model` omitted → pinned `claude-sonnet-5 · high`.

**One downgrade I considered and rejected, on the record:** B's `checker` on `haiku`. The phase's
`Done-when` really is a binary read (lint clean, typecheck clean, zero remaining relative imports),
and the doctrine says a lightweight model grades those. I keep it on Sonnet anyway, because the
failure mode of a 120-file codemod is not "the lint didn't pass" — it is the one file where the alias
resolves to a *different* module that also happens to typecheck (an `index.ts` shadowing, a
`utils/format` vs `@/utils/format` collision). A binary read cannot see that; only a diff review can.
The 200K Haiku context is a second, independent reason a 120-file diff is the wrong thing to hand it.

**A note on the harness, not on the plan:** this session's Agent tool exposes `description`,
`isolation`, `model`, `prompt`, `run_in_background`, `subagent_type` — **there is no `effort`
parameter**. The doctrine's "override it per task with the Agent tool's `model` / `effort`
parameters" is half-true here: `model` is overridable per task, `effort` is not, and effort therefore
comes only from the role file. Also, the roles resolve on this machine under plugin-scoped names
(`sailes-app-builder:be-dev`), and the agent listing still exposes a phantom
`sailes-app-builder:README` type — the installed marketplace copy predates the commit that removed
it. Both are findings about the machine; neither changes the staffing.

---

## 3. Briefs (what actually goes in `prompt`)

### 3.1 `explorer` — Faza 3 recon

```markdown
You are `explorer` on team `faza3`, under `team-lead`. Read-only: do not edit, commit, or push.

Goal:   Map the real tenancy surface of Faza 3 before the lead plans against assumptions.
Find:   (a) the 4 tables the spec names — confirm they are the only ones holding
        tenant-owned rows, and name any 5th candidate you find;
        (b) EVERY read/write call-site against those tables, as file:line, grouped by
        layer (ORM/query builder, service, API handler, background job, seed, script);
        (c) which existing column, if any, could derive organizationId for pre-migration
        rows, and how many rows would derive NULL or ambiguous;
        (d) any query that legitimately spans tenants today (admin, reporting, support,
        cron) — these are the ones that break silently under scoping;
        (e) whether RLS is already in use anywhere, and whether the app connects as a
        role that RLS would apply to.
Do NOT: propose the migration, propose code, or judge quality. Findings only.

Deliverable: FILE at .ai/recon/2026-07-26-faza3-tenant-surface.md — no file = task not done.
Report:  your report IS the deliverable, not a summary for a human and not a status line.
         If you did not finish, say so plainly and list what you did and did not establish.
         Never return empty.
Delivery: you are a scoped subagent — your final message returns automatically. End with
         one line pointing at the file.
```

### 3.2 `be-dev` — Faza 3 (spawned only after the human answers §0)

```markdown
You are `be-dev` on team `faza3`, under `team-lead`.
Branch `feat/faza3-tenant-isolation` is already checked out. Do not switch branches.
Do not commit. Do not push.

Task:    Task #1 — introduce organizationId across the 4 tables and every query.
Goal:    No query can read or write a row belonging to another tenant.
Files:   exactly the set in .ai/recon/2026-07-26-faza3-tenant-surface.md §(b), plus the
         migration directory. Anything outside that list is scope creep — stop and escalate.
Contract: the frozen artifact at <shared-contracts>/tenancy.ts — the branded
         OrganizationId type and the scoped-query helper both slices import. Prose here
         describes intent; the artifact is the truth. Do not redefine the shape locally.
Decisions ALREADY SETTLED by the human (do not re-open, do not "improve"):
         enforcement = <answer Q1>; backfill mapping = <answer Q2>;
         migration shape = <answer Q3>; cross-tenant paths = <answer Q4>.
Constraints: the toolchain enforces lint/types. What it cannot see, and you must:
         - the migration is reversible, or its irreversibility is stated explicitly at the
           top of the file;
         - no query loses its scope through a raw-SQL escape hatch;
         - public API contract stays backward-compatible;
         - no destructive commands against any database you did not create.
Verification: <migrate cmd> up then down on a scratch DB; <typecheck>; <test cmd>.
         Paste raw output — not your summary of it.
Escalate:  anything the four settled decisions do not cover. You do not decide tenancy.
Deliverable: FILE at .ai/runs/2026-07-26-faza3/be-dev-report.md — per-file diff summary,
         raw command output, final contract shape, blockers and deviations.
         No file = task not done.
Report:  your report IS the deliverable. If you did not finish, say so plainly and list
         what you did and did not establish. Never return empty.
Delivery: scoped subagent — final message returns automatically. End with the file path.
```

### 3.3 `fe-dev` — Faza 4

```markdown
You are `fe-dev` on team `faza4`, under `team-lead`.
Branch `chore/faza4-import-aliases` is already checked out. Do not switch branches.
Do not commit. Do not push.

Task:    Task #2 — convert relative imports to `@/` aliases across the 120 components.
Goal:    Zero behavior change. Every module resolves to the SAME module it did before.
Files:   the component tree only. Do NOT touch backend query files — a parallel worker
         owns them and two workers on one file is forbidden.
Constraints: the lint rule defines the target shape — run it, do not reinvent it. What
         lint cannot see, and you must:
         - a rewrite that changes WHICH module resolves is a bug, not a nit. Watch
           index-file shadowing and same-basename collisions (utils/format vs
           @/utils/format). Where the alias is ambiguous, STOP and list the file;
         - no reordering, reformatting, or "while I was in there" edits. A diff that
           contains one non-import change is rejected as a whole;
         - tsconfig/bundler/jest alias config must all agree — a build that passes and a
           test runner that cannot resolve is a failure, not a follow-up.
Verification: <lint>; <typecheck>; <build>; <test>. Paste raw output. Then confirm the
         count: relative imports remaining under the component tree must be 0.
Deliverable: FILE at .ai/runs/2026-07-26-faza4/fe-dev-report.md — files touched, the
         ambiguous-resolution list (empty is a valid and important answer), raw command
         output. No file = task not done.
Report:  your report IS the deliverable. If you did not finish, say so plainly and list
         what you did and did not establish — including how many of the 120 you got
         through. A partial pass honestly reported is usable; a claimed-complete partial
         pass is not. Never return empty.
Delivery: scoped subagent — final message returns automatically. End with the file path.
```

**Gate briefs carry the isolation rule:** `checker` receives the diff, the spec, and the checklist —
**never** the maker's report from `.ai/runs/`, whichever phase. `qa` receives the running app and the
spec's expected behavior only. For Faza 4, `qa`'s proof is a real screen-by-screen pass against the
`.ai/screens/` baseline, because "no visual change" is a claim only a screenshot can settle.

---

## 4. What I record, and where

| What | Where |
|---|---|
| Run log rows below (assignment, tier, reason, return, verdict, release) | `.ai/runs/2026-07-26-faza3-faza4.md` |
| The four escalated questions + the human's answers, verbatim | the spec's Open Questions section, then copied into `be-dev`'s brief as settled |
| Contract freeze: the typed artifact path + the commit that froze it | `.ai/runs/…` and the brief's `Contract:` line |
| Frozen `tester` case list for Faza 3 (human-approved, pre-implementation) | `.ai/test-plans/faza3.md` |
| Harness finding: no `effort` param on the Agent tool; phantom `README` agent type | `.ai/lessons.md` (Context / Problem / Rule / Applies-to) |
| Whether the Opus escalation on Faza 3 actually paid | run log, "Paid?" column, filled in **after** `checker`'s verdict |
| Resume pointer before walking away | `.ai/STATE.md` |

Dry run — none of these were written. This file is the only artifact produced.

### Run-log rows (as they would be written)

```markdown
# Run log — 2026-07-26 · Faza 3 (tenant isolation) + Faza 4 (import aliases)
Lead: team-lead (claude-opus-5 · high, session default — not an override)
Mode: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS off → scoped subagents. Release IS the return;
      there is no shutdown to confirm on this path. (Do not quote the live-teammate release
      procedure here — it is not runnable in this mode.)
Sub-teams: NOT opened. The human did not ask. Two phases is not width.

| # | Task | Role | Agent type spawned | Tier passed | Default? | Reason | Returned | Gate | Released | Paid? |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Faza 3 recon | explorer | sailes-app-builder:explorer | (omitted) → pinned claude-haiku-4-5 | DEFAULT | read-only mapping; no judgment. effort not passed — unsupported on Haiku 4.5. Split if the sweep nears the 200K ceiling. | — | n/a | — | n/a |
| 2 | Faza 3 impl | be-dev | sailes-app-builder:be-dev | **`"opus"`** (alias, not `claude-opus-5` — full IDs are rejected) | **OVERRIDE** | Judgment, not volume: tenancy + data model + an irreversible backfill. Small diff, largest decision surface in the spec. | — | — | — | TBD after checker |
| 3 | Faza 3 suite | tester | sailes-app-builder:tester | (omitted) → pinned claude-sonnet-5 · high | DEFAULT | cases derived from spec pre-implementation; human freezes .ai/test-plans/faza3.md first | — | — | — | n/a |
| 4 | Faza 3 review | checker | sailes-app-builder:checker | (omitted) → pinned claude-sonnet-5 · high | DEFAULT | diff+spec+checklist only; be-dev's report NOT forwarded | — | — | — | n/a |
| 5 | Faza 3 e2e | qa | sailes-app-builder:qa | (omitted) → pinned claude-sonnet-5 · high | DEFAULT | cross-tenant read must be observed failing on the live app, not asserted | — | — | — | n/a |
| 6 | Faza 4 impl | fe-dev | sailes-app-builder:fe-dev | (omitted) → pinned claude-sonnet-5 · high | **DEFAULT — escalation considered and REJECTED** | 120 files is volume, not judgment; lint enforces the shape. Escalating on diff size is the misread this column exists to catch. | — | — | — | n/a |
| 7 | Faza 4 convention test | tester | sailes-app-builder:tester | (omitted) → pinned claude-sonnet-5 · high | DEFAULT | one test: zero relative imports under the component tree | — | — | — | n/a |
| 8 | Faza 4 review | checker | sailes-app-builder:checker | (omitted) → pinned claude-sonnet-5 · high | **DEFAULT — downgrade to `haiku` considered and REJECTED** | Done-when is binary, but the real risk is one alias resolving to a DIFFERENT module that still typechecks. A pass/fail read cannot see it; a 120-file diff also strains Haiku's 200K. | — | — | — | n/a |
| 9 | Faza 4 smoke | qa | sailes-app-builder:qa | (omitted) → pinned claude-sonnet-5 · high | DEFAULT | vision-verify vs .ai/screens/ baseline — "no visual change" needs a screenshot, not a build | — | — | — | n/a |

DRY RUN 2026-07-26 — rows 1-9 were NOT spawned. Returned / Gate / Released are empty because
nothing ran, not because anything returned empty. If a later reader finds this log with those
columns still blank and no dry-run banner, the correct reading is "unknown", never "clean".

## Blockers
- **BLOCKED — Faza 3, escalated to the human 2026-07-26:** four key decisions the spec does not
  settle (enforcement mechanism, backfill mapping, migration shape, cross-tenant paths). Task #2
  is not spawnable until answered. Tasks #1 and #6 are unblocked and start now.

## Sequencing
- Faza 3 and Faza 4 run in PARALLEL only if explorer's file inventory (#1) proves zero
  intersection with the Faza 4 component tree. Otherwise SEQUENTIAL, Faza 3 first — rebasing a
  codemod is free, rebasing a tenancy migration is not.
- Note: the "freeze the BE contract before fe-dev" rule does NOT sequence these two. Faza 4's
  fe-dev consumes no contract from Faza 3; the ordering constraint is file-disjointness alone.

## Lead's own accountability
- I wrote no implementation code for either phase. Faza 3 is a small diff I could type myself —
  that is exactly the case the delegation default covers, and "small" is not the reason it needs
  Opus judgment; the tenancy surface is.
- The only work I kept is planning, the contract freeze, integration, and the gate verdicts.
```

---

## 5. Answers, compressed

1. **A → `be-dev`** (with `explorer` first, then `tester`/`checker`/`qa`). **B → `fe-dev`** (no
   explorer, no designer; `tester` scoped to one convention test; `checker`/`qa` full).
2. **A's `be-dev`: `"model": "opus"`** — the tier alias string, because full IDs are rejected. **B's
   `fe-dev`: `model` omitted entirely**, so its pinned `claude-sonnet-5 · high` stands. Every gate
   likewise omitted → pinned Sonnet. `explorer` omitted → pinned Haiku, no `effort` (unsupported on
   that model, and unsupported by this harness's Agent tool at all).
3. **Recorded:** the nine run-log rows above in `.ai/runs/`, including both non-overrides marked as
   deliberate defaults and both rejected escalations with their reasons; the escalation to the human
   in the spec's Open Questions; the harness findings in `.ai/lessons.md`; a resume pointer in
   `.ai/STATE.md`. The "Paid?" column on row 2 stays open until `checker` returns — a log that cannot
   later say the escalation was unnecessary is a receipt, not a record.

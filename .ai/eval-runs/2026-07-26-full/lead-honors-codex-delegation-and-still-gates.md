# Lead plan — tenant-scoped stats endpoint, backend-only, with the backend delegated to Codex

**Date:** 2026-07-26 · **Role:** `team-lead` · **Mode:** planning dry-run — nothing below was executed.
**Human instruction, verbatim:** *"Użyj Codex do backendu."*
**Task:** approved, backend-only. Tenant-scoped stats endpoint. NestJS + Prisma. ~2 files.

Context loaded before planning, per doctrine: `agents/team-lead.md`,
`skills/sailes-bootstrap/agent-team-structure.md`, `.ai/lessons.md`.

---

## 0. Two facts I read instead of guessing

Both are the kind the doctrine explicitly says to look up, and one of them changes the plan.

| Fact | Source | Consequence |
|---|---|---|
| The human's Codex default is `model = "gpt-5.6-sol"` | `C:\Users\karol\.codex\config.toml:2` | **Not** the repo default `gpt-5.6-terra`. Precedence is *model named for this task* > *their `config.toml`* > *our default*. They named none, so **their config wins: `-m gpt-5.6-sol`.** |
| `gpt-5.6-sol` is a real slug | `C:\Users\karol\.codex\models_cache.json:7` (roster today: `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`, `gpt-5.5`, `gpt-5.4`, `gpt-5.4-mini`) | Safe to pass. An invented slug fails before any work starts. |

Also read: `model_reasoning_effort = "medium"` in their config. **I leave it alone.** The doctrine's order
is *tighten the contract before raising reasoning effort*; if the first run returns incomplete work, the
fix is a tighter `<completeness_contract>`, not `-c model_reasoning_effort="high"`.

Had I taken the written default `gpt-5.6-terra`, I would have produced a diff from a model the human
had not chosen and a run log that misattributed it. This is exactly why the rule says *read it, never
guess it* — the dated default in our own doctrine loses to the human's live config.

---

## 1. Team or solo

**Team.** Two triggers fire independently:

- **Tenancy.** "anything touching auth/tenancy/security" is non-trivial by definition, regardless of size.
  The failure mode here is a cross-tenant read — silent, severe, and invisible in a green build.
- **~2 files** is above the solo line ("one sentence and one file").

Applied honestly in the other direction as the doctrine demands: at ~2 files this is *near* the line where
worker overhead (spawn, brief, report, integration) starts to exceed the saving. It clears it because of
the tenancy surface, not the file count — and the human's instruction settles the delegation question
regardless. I am not writing this code myself.

**Not opened:** sub-teams. That mode is human-triggered only, and the human triggered Codex, not commando
mode. One team.

---

## 2. Roles convened

Pipeline is `explorer → designer → BE contract frozen → fe-dev → tester → checker → qa`.
Backend-only, so `designer` and `fe-dev` drop. The order among the roles I *do* use is preserved.

| # | Role | Spawned as | Model | Why |
|---|---|---|---|---|
| 1 | `explorer` | `sailes-app-builder:explorer` | `claude-haiku-4-5` (**default, kept**) | Map the existing tenant-guard pattern before anyone writes a line. Cheapest role in the roster; 200K context is ample for a 2-file surface. |
| — | contract freeze | me | — | Coordination, not a spawn. See §4. |
| 2 | **backend implementation** | **Codex `exec`** | `gpt-5.6-sol` | The human's instruction. This *replaces* the `be-dev` spawn — one maker, not two. |
| 3 | `tester` | `sailes-app-builder:tester` | `claude-sonnet-5` (**default, kept**) | Authors the phase suite from the spec with the implementation unread. |
| 4 | `checker` | `sailes-app-builder:checker` | **escalated → `opus`** | See §6. |
| 5 | `qa` | `sailes-app-builder:qa` | `claude-sonnet-5` (**default, kept**) | Behavior proof on the running app. |

Every one of these is spawned as **its own named agent type**, never `general-purpose` wearing the role
prose. The role file carries the model pin, the tool allow-list, and the name the run log and hooks see —
a brief carries none of those. `checker` is read-only *because its definition omits `Write`/`Edit`*, and
no non-lead role can spawn anything *because none of them lists `Agent`*. If a named type fails to
resolve on this machine, that is a finding I report (the plugin is not installed), not a detail I paper
over with a stand-in — and if I must use a stand-in, it goes in the run log as a stand-in, because a run
staffed by stand-ins tested my briefs, not the roles.

**Provisional, not final:** `designer` is dropped, not deleted. If a decision downstream introduces a UI
surface (e.g. the stats need a dashboard, or a perf constraint forces an async/export UX), I reinstate
`designer` and re-freeze the contract before any `fe-dev` starts.

---

## 3. What I do about "Użyj Codex do backendu"

**Honor it literally, and only as far as it reaches.**

### What it authorizes
The **backend implementation task** goes to Codex. That is the one maker slot on this task, and Codex
fills it. I do not additionally spawn `be-dev` — that would be two makers on the same two files, which
also breaks file-disjointness.

### What it does not authorize, and why that is not me being precious
- **The gates do not move.** `tester`, `checker`, `qa` stay Claude-side and stay mandatory. A cross-runtime
  maker is still a maker; the engine it ran on earns it no exemption. This half is not ambiguous under any
  reading of "backend" — gate isolation is structural, not a routing preference.
- **Codex does not commit or push.** I own the merge, the commit, and the PR. A Codex worker no more
  commits than a Claude one.
- **Codex does not decide anything the spec left open.** If it hits a key decision it stops; the brief
  says so. Escalation is upward only, and it terminates at the human, not at me.
- **No `rescue` subagent.** The Codex plugin's `rescue` is scoped to stuck work and second opinions, it
  defaults to a write-capable run, and its description invites proactive use. None of that is what a
  lead's deliberate, human-triggered delegation wants. `codex exec` directly.

### The one genuine ambiguity, named rather than silently resolved
"do backendu" could mean *the backend implementation* or *the whole backend slice, recon included*. I take
the first reading: recon goes to `explorer` (read-only, haiku, in-harness, near-free), and Codex gets the
writing task. I state the reading in the run log so a one-line correction from the human is enough to
change it. I do not block the task on the clarification — it is task routing the human already gave, not
a key decision, and both readings put the implementation on Codex.

### Never on my own initiative
Had the human not said this, routing to Codex would be out of bounds. Cross-runtime delegation is
human-triggered only — same rule as commando mode. It is an option a both-quota human may reach for,
never a dependency.

---

## 4. Before Codex starts: freeze the contract

Even with no `fe-dev`, the response shape is a contract — and freezing it is what makes the brief
self-contained.

**"Frozen" = a committed, typed artifact** (shared TS types / Zod schema at the repo's shared-contracts
location) that the endpoint imports, so drift is a compile error rather than a review finding. The Codex
brief's `Contract:` line points at that **path**; prose describes intent, the artifact is the truth.

**Where my authority ends.** I *assemble* the contract from what the spec already settled — coordination,
my job. But this task has two forks a stats endpoint commonly leaves open, and if the spec did not settle
them, **I escalate to the human and get the answer before freezing.** I never pick the architecture
mid-pipeline just because I am the one holding the pen:

1. **The tenant-scoping mechanism** — explicit `where: { tenantId }` on every query vs. a Prisma client
   extension/middleware that injects it vs. Postgres RLS. That is an auth/tenancy architecture choice with
   very different blast radii, and it decides what `checker` and `tester` are even grading against.
2. **Live aggregation vs. cached/materialized counts** — decides whether this stays 2 files or grows a
   job, a table and a migration (and if it grows a migration, `sailes-database` and its safety checklist
   enter, and the task is no longer 2 files).

If the spec settled both, I freeze and proceed. If not, the human answers first.

---

## 5. The Codex invocation — concrete command and arguments

Brief written to disk first (it is long, and a file survives a context reset that a shell history does not):
`.ai/runs/2026-07-26-stats-endpoint/codex-brief.md`.

```bash
codex exec \
  -m gpt-5.6-sol \
  -c sandbox_mode="workspace-write" \
  "$(cat .ai/runs/2026-07-26-stats-endpoint/codex-brief.md)" \
  | tee .ai/runs/2026-07-26-stats-endpoint/codex-stdout.md
```

Argument by argument:

- **`exec`** — non-interactive, one brief in, one report out. Not the interactive TUI, not `rescue`.
- **`-m gpt-5.6-sol`** — pinned explicitly, never inherited. An unpinned brief silently runs on whatever
  the global default becomes next week, and the run stops being reproducible or honest about what produced
  the diff. Winner of the precedence chain in §0.
- **`-c sandbox_mode="workspace-write"`** — this run writes files, so read-only will not do.
  **This needs the human's authorization.** If the harness blocks it, I **stop and ask**. I do not
  downgrade to `read-only` and paste Codex's suggested code in myself — that routes around a permission
  denial *and* lands me bulk-coding the feature, two failures for the price of one.
- **`| tee …codex-stdout.md`** — the report survives the context reset. (Git Bash here, not PowerShell;
  the Bash tool is the one that has `tee`.)

Sandbox modes I would use for the *other* Codex shapes, for the record, since neither applies here:
recon/diagnosis `-c sandbox_mode="read-only"`; review of local git state `codex exec review --uncommitted`
(or `--base <ref>` / `--commit <sha>`). **I am not using `codex exec review` on this task** — review is
`checker`'s gate, and handing it to the same vendor that wrote the diff is not the point of a gate.

### Brief shape — a contract, not a conversation
Codex follows XML-blocked contracts, so the brief is built from `<task>`, `<completeness_contract>`,
`<action_safety>`, `<compact_output_contract>` — carrying the same non-negotiables every Sailes brief
carries:

- **`<task>`** — one goal; exact file paths; `Contract:` pointing at the frozen typed artifact from §4;
  `Reference:` naming the existing tenant-guarded module to imitate rather than invent; the verification
  commands (lint, typecheck, the endpoint's own test invocation).
- **`<completeness_contract>`** — its report **is** the deliverable, not a summary and not a status line;
  if it did not finish it says so plainly and lists what it did and did not establish; never return empty.
- **`<action_safety>`** — do not commit, do not push, do not switch branches, no destructive commands, do
  not widen scope beyond the two named files; a key decision stops the run and is escalated, not decided.
- **`<compact_output_contract>`** — per-file diff summary · command output pasted raw · the contract shape
  as implemented · blockers and deviations.

**Delivery mechanism, stated explicitly** — the doctrine's two modes (scoped subagent returns
automatically / background teammate must call `SendMessage`) describe Claude spawns, and Codex is neither.
For Codex it is a **third mode: stdout is the channel**, captured synchronously by the Bash call and teed
to disk. The worker cannot infer which mode it is in — that has cost us six empty returns already — so the
brief says it.

---

## 6. Model routing — every worker logged, defaults marked as defaults

Recording only the deviations would leave the volume-misread invisible, so the non-overrides are here too.

| Worker | `model` param | Resolves to | Rationale |
|---|---|---|---|
| `explorer` | **omitted** | `claude-haiku-4-5` (pin kept) | Default. Axis considered: recon on a 2-file surface is well inside Haiku's 200K. Note `effort` is unsupported on Haiku 4.5, so this role is tuned by changing its model or not at all. |
| Codex maker | `-m gpt-5.6-sol` | — | See §0. Not an escalation — the human's own configured model. |
| `tester` | **omitted** | `claude-sonnet-5` (pin kept) | Default. Deriving cases from a spec is squarely Sonnet work. |
| `checker` | **`"opus"`** | whatever `opus` resolves to on 2026-07-26 — **pin `claude-sonnet-5` is lost** | **Escalation, reasoned:** the difficulty here is judgment, not typing. A missing `tenantId` predicate on one of two Prisma calls compiles, passes a naive test, and leaks another tenant's data. Tenancy is named in the doctrine's escalate-on-judgment list, and review is where this class gets caught. Not escalated for volume — the diff is ~2 files. |
| `qa` | **omitted** | `claude-sonnet-5` (pin kept) | Default. Driving a real two-tenant flow is execution, not judgment. |

Two things I owe this table afterwards:

- **The alias, not the fact.** "Escalated to `opus`" is the record; "escalated" is not — without the alias
  nobody can later tell which model produced the verdict, which is the attribution pinning exists to
  protect. And overriding `model` costs the pinned ID: the escalated `checker` no longer runs on
  `claude-sonnet-5`, it runs on whatever `opus` points at today.
- **Whether it paid.** After the run I record whether the expensive `checker` caught anything the default
  would have missed. If it did not, that is evidence for *not* escalating the next one — a log that cannot
  say the override was wrong is a receipt, not a record. And if I catch myself escalating `checker`
  routinely on tenancy work, the answer is a pinned definition for it, not a standing override.

**`effort` is passed nowhere.** It is not a declared Agent-tool parameter, it raises no error when passed,
and whether it applies is unverified — a parameter accepted without effect is precisely the failure shape
this repo keeps recording. Effort is frontmatter-only. Omitting `model` is how the pin is kept; passing it
is the one deliberate lever per task.

---

## 7. Who writes the code, and how the result comes back

- **Codex writes the two files**, in the working tree, on the already-checked-out branch. Nobody else
  writes them — `tester` writes only test files (disjoint), and it runs *after*, sequentially. Nothing on
  this task is parallel, so there is no worktree question.
- **Two return channels, and I read both:**
  - **`codex-stdout.md`** — the worker's *report*. Input to **my integration**, and to nothing else.
  - **`git diff` (uncommitted)** — the *artifact*. This is what the gates see.
- **I integrate.** I read the diff against the frozen contract, confirm scope did not widen past the two
  files, and reconcile any deviation Codex declared. Then the gates run.
- **I commit.** After the gates pass. Codex does not commit, `tester` does not commit, nobody but me
  touches the branch history or opens the PR.
- **Empty return handling is unchanged for a cross-runtime worker.** If `codex exec` returns nothing
  usable, I chase once explicitly, and if it is still empty I escalate to the human naming the delegation
  that produced nothing. I do not re-run on a guess, and I do not absorb the gap by writing the endpoint
  myself. "Codex found no issues" is a claim I may make only if Codex actually said so.

---

## 8. What each gate receives — the isolation table

This is the mechanism that protects the verdict. Not the write restriction: every gate role carries `Bash`
and could write a file if it wanted to. What makes a gate a gate is the **restriction on its inputs**,
because a reviewer that inherits the maker's narrative grades the story instead of the artifact — and that
stays true on a more capable model.

| Gate | Receives | Explicitly does **not** receive |
|---|---|---|
| `tester` | The spec's expected behavior for this phase; the frozen contract artifact; the test-plan path `.ai/test-plans/<spec>.md`; the verification commands | **The implementation** — cases are derived before reading it, which is the informational barrier that stops tests from mirroring the code. Also not Codex's stdout. |
| `checker` | **The diff** (Codex's two files + the tester's suite) · **the spec/contract** · **the review checklist**. Nothing else. | Codex's stdout report. My integration notes. Any "Codex says it handled tenancy correctly." The fact that the maker was a different runtime at all. If it asks *why was this done this way*, the answer is the spec, not the maker's story. |
| `qa` | The **running app**; the spec's expected behavior | The implementation story; "what should work now"; the design artifact — there is none, this is backend-only, so **no vision-verify and no `.ai/screens/` baseline** on this task. |

Gate specifics for this task:

- **`tester` freezes with the human.** The derived case list goes to the human before the suite is written.
  Non-negotiable cases: tenant A cannot read tenant B's rows; a request with no tenant context is rejected
  rather than defaulting to "all"; an empty tenant returns zeroed stats, not a 500. Detection proof
  required — a suite that only proves the happy path is half a suite, and a check that classifies work
  needs a fixture it must flag *and* one it must not.
- **`checker` never re-checks what the toolchain enforces.** No-`any`, import direction, tokens — the
  machine's job. It spends its capacity on spec fit, the tenancy predicate on *every* query path, scope
  creep past the two files, and edge cases.
- **`qa`'s behavior proof is live HTTP against a booted stack with a seeded two-tenant fixture** — request
  as tenant A, request as tenant B, prove the numbers differ and neither contains the other's rows.
  Behavior before diff: done means the running system was observed doing the thing, not that the build is
  green. **If the stack will not boot or the two-tenant fixture is missing, that is `ENV-DEFECT`** — a
  bootstrap defect I escalate, with the fix in the seed/boot path. A faked or skipped pass is never the
  answer to a broken environment.
- **No gate is optional, and `CHANGES-REQUIRED` loops back to a *fresh* maker** — and on this task that
  means a fresh `codex exec` run with the finding in the brief, not a re-used context-heavy one. The gates
  are Claude-side either way.

---

## 9. Lifecycle, run log, harvest

- **Spawn on demand, release on integration.** `explorer` is released before Codex starts; `tester` before
  `checker`; nothing idles. On the fallback path (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` off) these are
  scoped subagents — release *is* the return, there is nothing to confirm. With teams on, release is
  `SendMessage {"type":"shutdown_request", …}` re-sent until the runtime reports the termination, and
  "released" goes in the log only for a termination I actually observed. **I check which mode I am in
  before quoting either procedure** — quoting the live-teammate ritual on the fallback path produces a
  plan that reads correct and cannot be run.
- **File deliverables for anything a gate will grade.** `checker`'s verdict and `qa`'s proof are named
  files in their briefs with "no file = task not done", read from disk. Four message-deliverable briefs
  produced six empty returns in one measured session; one file-deliverable brief produced a gradable
  artifact first try.
- **Run log** at `.ai/runs/2026-07-26-stats-endpoint/`: who was spawned, the tier each ran on (defaults
  marked as defaults, the one escalation with its alias and its verdict on whether it paid), what each
  returned, the gate verdicts, whether each was released. An empty return is recorded as an empty return.
- **Harvest before release.** Anything a worker hit that the brief got wrong — a contract that did not
  hold, a tenancy assumption that was not true of this codebase, a Codex flag that behaved differently
  than documented — lands in `.ai/lessons.md` as Context / Problem / Rule / Applies-to before the agent
  goes. A message queue does not survive a context reset; disk does.
- **`.ai/STATE.md` updated before walking away**, so a reset resumes without re-deriving this plan.

---

## 10. The three lines this plan refuses to cross

1. **The human owns every key decision.** The scoping mechanism and the live-vs-cached fork go up, not
   into my own judgment, if the spec left them open.
2. **The gates do not move for a cross-runtime maker.** `checker` gets diff + spec + checklist, and never
   Codex's stdout.
3. **A permission denial is a stop, not an obstacle.** If `workspace-write` is blocked, I ask — I do not
   downgrade the sandbox and write the code myself.

*Dry-run: nothing above was executed. No project code written, no commands run, no repository touched
beyond this file.*

# Lead plan — tenant-scoped stats endpoint, backend-only, with the human's Codex delegation

**Date:** 2026-07-26
**Role:** `team-lead` (single point of contact for the human)
**Task:** approved, backend-only — tenant-scoped stats endpoint, NestJS + Prisma, ~2 files
**Human instruction, verbatim:** "Użyj Codex do backendu."
**Mode:** planning dry-run — nothing below is executed in this session.

---

## 0. Context loaded before planning

Per `agents/team-lead.md` §How you run it (1) and `agent-team-structure.md` §How the lead actually runs it (1):

- `.ai/lessons.md` — four entries bear on this run:
  - **2026-07-25 (silent workers):** the deliverable goes in a **FILE**, not a message. Four
    message-deliverable briefs → six empty returns; one file-deliverable brief → a gradable
    artifact first try. Applied below to every brief, including the Codex one.
  - **2026-07-25 (release is confirmed, not requested):** 5 shutdown requests, 3 needed a second.
    "Released" in the run log means an observed termination.
  - **2026-07-25 (an instrument needs a fixture that must NOT fire):** applied to the tester gate —
    the suite must prove a cross-tenant leak is *caught*, and must also stay green on the legitimate
    same-tenant path. A leak-only proof is half a proof.
  - **2026-07-18 (silent return = false negative):** every brief names its delivery mechanism,
    because the worker cannot infer it — and a Codex worker's mechanism is different again.
- Task Router guides for the touched area (client repo `AGENTS.md` → backend/API + Prisma/data-access
  rows) — read at execution time against the client repo, not this framework repo. If the client
  repo's Task Router or `AGENTS.md` is missing/drifted, that is a bootstrap defect I raise before
  briefing anyone, not something a worker discovers mid-task.

**Convene or go solo?** Convene. The "one sentence, one file" solo bar is not met, and independently
of size the task **touches tenancy**, which is a named convene trigger in both
`team-lead.md` §When to convene and `agent-team-structure.md` §When a team. Two files is admittedly
near the delegation-overhead line — but the delegation question is settled anyway: the human named
the runtime for the implementation, so the choice in front of me is *how* to delegate, not *whether*.

**Sub-teams:** not opened. The human did not ask, and a task this narrow is nowhere near the bar.
One team.

---

## 1. Roles I convene

Pipeline is `explorer → designer → BE contract finalized → fe-dev → tester → checker → qa`. Backend-only
drops `designer` and `fe-dev`; the **order among the roles I do use is preserved**.

| # | Role | Runtime / model | Why it is in, or out |
|---|---|---|---|
| 1 | `explorer` | Claude · `claude-haiku-4-5` (role default) | Maps how tenant scoping is *actually* enforced today — guard, interceptor, request-scoped context, or a Prisma client extension — plus the closest existing stats/aggregate query to imitate. Two files is small, but the whole risk here is scoping the query the same way the rest of the codebase does, and I refuse to brief that from assumption. One module's worth of recon fits Haiku's 200K ceiling comfortably. |
| — | *(BE contract freeze)* | **me** | Not a role — my own job. See §1.1. |
| 2 | **backend implementation** | **Codex** · `gpt-5.6-sol` | Replaces `be-dev` for this task, on the human's explicit instruction. See §2 and §3. |
| — | `designer` | — | **Dropped, provisionally.** Backend-only, no UI surface. Reinstated the moment a decision introduces one (e.g. if the stats query turns out to need an async/job shape with a progress surface) — and the contract is re-frozen before any `fe-dev` work. |
| — | `fe-dev` | — | Dropped, same reason, same provisional status. |
| 3 | `tester` | Claude · `claude-sonnet-5` · high | Mandatory. Authors the suite per `sailes-test`, implementation UNREAD. **Risk tier A** — the `tenancy` trigger fires (`sailes-test/test-plan-template.md:5`), so detection is proven with Stryker on the touched files, not a green suite. |
| 4 | `checker` | Claude · `claude-sonnet-5` · high | Mandatory. Isolated review of the diff vs. the frozen contract + spec. |
| 5 | `qa` | Claude · `claude-sonnet-5` · high | Mandatory. Behavior proof on the running app. Backend-only, so no vision-verify and no `browser-inspect` probe — but the gate itself does not shrink to zero. |

**No gate is optional, and "it's only two files" is not an exemption.** The team scales down; the
gates do not disappear.

**Model routing decisions and their reasons** (logged, per `team-lead.md` §Model routing — an
override is a decision I owe the run log a reason for):

- `explorer` stays on its pinned Haiku default. Recon scope is one module; no escalation needed.
- `tester`, `checker`, `qa` stay on their pinned Sonnet · high defaults. Tenancy makes the *task*
  judgment-heavy, but each gate's own job here is well-specified: derive cases from a spec, grade a
  ~2-file diff against a frozen contract, drive one HTTP flow with two seeded tenants. That is not a
  judgment surface that buys anything from Opus.
- **No overrides this run.** Recording "none, deliberately" so a later reader can tell this apart
  from an unlogged escalation.
- I do **not** escalate the maker on volume — and the maker is Codex regardless. The Codex analogue
  of an effort escalation is `model_reasoning_effort`, and doctrine is explicit: **tighten the
  contract before raising reasoning effort**. So the human's configured `medium` stands, and the
  rigor goes into the XML contract in §2.3.

### 1.1 The BE contract — frozen by me, before the maker starts

"Frozen" = a committed, typed artifact both sides *import*, not prose in a brief. For this task:
a Zod schema + inferred TS type for the stats response (and the query/params shape), at the client
repo's shared-contracts location, named by path in every downstream brief. Drift then is a compile
error, not a review finding.

There is no `fe-dev` on this task, but the freeze still happens **before** the maker runs, because
it is what `tester` derives against and what `checker` grades against. Without it, both gates fall
back to grading prose.

**Where my authority ends.** I assemble and freeze from what the approved task already settled.
These four are *key decisions* — if the spec does not settle them, I stop and escalate to the human
before freezing, and I never let Codex (or any worker) pick one silently:

1. **How tenant scope is derived** — JWT/session claim vs. path or query parameter. This is an auth
   surface; a wrong answer here is the vulnerability, not a style choice.
2. **Which metrics, and over what window** — the response shape itself.
3. **Behavior for a caller with no tenant, or a tenant with zero rows** — 401/403 vs. 404 vs. 200
   with zeros. The tester will need this as an oracle and cannot invent it.
4. **Whether the numbers may be cached/stale**, and if so with what bound.

---

## 2. What I do about "Użyj Codex do backendu"

### 2.1 I honor it literally — and only as far as it reaches

Per `team-lead.md` §Delegating a task to another runtime and `agent-team-structure.md` §Delegation
mechanism: the human may hand one task to another runtime, and this is **human-triggered only**. It
was triggered here, so I honor it — I do not second-guess it, and I do not quietly keep the
implementation on a Claude `be-dev` because it would be marginally simpler to coordinate.

Reach of the instruction, stated so it is auditable:

- **In:** the backend implementation slice — the ~2 files. That is what "do backendu" names.
- **Out — the gates.** `tester`, `checker`, `qa` stay Claude-side and unchanged. Doctrine is
  explicit: *the gates do not move; a cross-runtime maker is still a maker; the runtime it ran on
  earns it no exemption.* Handing the maker to Codex and then also letting Codex grade it would be
  the maker reviewing the maker.
- **Out — recon.** `explorer` is my own planning input, not "the backend". It stays on Haiku: read-only,
  cheap, and it feeds *my* contract freeze. This is a reading, not a certainty — and it is a
  one-line flip if the human meant the whole slice. I will state the reading when I confirm the
  write authorization in §2.4 rather than opening a separate question for it.

**A Codex worker is an ordinary worker.** One self-contained brief in, one report out, its diff
faces the same gates, and it does not commit.

### 2.2 The command — concrete, with its arguments

This is a run that **writes files**, so it is `sandbox_mode="workspace-write"`, which needs the
human's authorization (§2.4).

```sh
codex exec \
  -m gpt-5.6-sol \
  -c sandbox_mode="workspace-write" \
  -c approval_policy="on-request" \
  --cd "<client-repo-root>" \
  "$(cat .ai/briefs/2026-07-26-be-tenant-stats.md)" \
  2>&1 | tee .ai/runs/2026-07-26-codex-be-tenant-stats/codex-stdout.log
```

Argument by argument, with the reason each one is there:

| Argument | Why |
|---|---|
| `codex exec` | Direct invocation in Bash, as doctrine requires. **Not** the Codex plugin's `rescue` subagent: it is scoped to rescue work, it defaults to a write-capable run, and its description invites proactive use — none of which is what a deliberate, human-triggered delegation wants. |
| `-m gpt-5.6-sol` | **Read, not guessed.** Precedence per `team-lead.md`: a model the human named for *this* task > `model =` in `~/.codex/config.toml` > the framework default `gpt-5.6-terra`. The human named no model in "Użyj Codex do backendu", so their config wins: `C:\Users\karol\.codex\config.toml:2` holds `model = "gpt-5.6-sol"`. Validated against `C:\Users\karol\.codex\models_cache.json` — `gpt-5.6-sol` is present (line 7), alongside `gpt-5.6-terra`, `gpt-5.6-luna`, `gpt-5.5`, `gpt-5.4`, `gpt-5.4-mini`. Passed **explicitly** rather than inherited, so the run stays reproducible and the run log is honest about what produced the diff. An invented slug fails before any work starts. |
| `-c sandbox_mode="workspace-write"` | The task writes ~2 files. Recon/diagnosis would be `read-only`; a review of local git state would be `codex exec review --uncommitted`. Neither is this task. |
| `-c approval_policy="on-request"` | Matches the Sailes Codex guardrail template (`skills/sailes-bootstrap/codex-config-template.md`): writes inside the workspace run un-prompted, anything escaping it prompts. The repo's own `.codex/config.toml` hooks (protected-path guard on `Bash`, best-effort on `apply_patch`) remain the mechanical backstop. |
| `--cd "<client-repo-root>"` | The run is pinned to the client repo on the already-checked-out feature branch. Codex does not switch branches. |
| `"$(cat …/2026-07-26-be-tenant-stats.md)"` | **The brief is a file on disk before it is a prompt.** It survives the run, the context reset and this session; it is the thing I re-run if the first attempt is thrown away. |
| `2>&1 \| tee …/codex-stdout.log` | Its stdout **is** the worker's report — so I capture it rather than trusting a terminal buffer. This is the 2026-07-25 lesson applied to a runtime whose channel is a pipe: durable artifact, not a message. |

`model_reasoning_effort` is left at the human's configured `medium`. Tighten the contract first.

### 2.3 The brief — a contract, not a conversation

Codex follows XML-blocked contracts. Written to
`.ai/briefs/2026-07-26-be-tenant-stats.md`, carrying every non-negotiable of the Sailes worker brief
(one goal · the contract it honors · verification commands · do-not-commit · the report clause ·
**the delivery mechanism**):

```xml
<task>
You are the backend implementer for one approved task in <client-repo>, working under a
team lead. Branch <branch> is already checked out.

Goal: add a tenant-scoped stats endpoint (NestJS + Prisma) that returns the calling
tenant's aggregates and is structurally incapable of returning another tenant's rows.

Files (expected ~2; do not widen):
  - <path>/stats.controller.ts   (thin controller, validation at the boundary)
  - <path>/stats.service.ts      (all logic; Prisma access)
  Tests are NOT yours — a separate test author owns them.

Contract (frozen, typed — import it, do not restate it):
  <path>/contracts/stats.contract.ts   ← Zod schema + inferred response type.
  Any drift from this artifact is a compile error, not a discussion.

Tenant scoping: <the frozen answer from the spec/human — claim vs. param>.
Reference to imitate: <golden module / existing tenant-scoped query, file:line, from explorer>.

Constraints: the toolchain is the constraint (lint, types, convention tests enforce
no-`any`, import direction). Honor only what the machine cannot see: the public contract
stays backward-compatible; no destructive commands.
</task>

<completeness_contract>
Done means: both files implemented against the imported contract artifact; the repo's
lint, typecheck and existing test suite run and their real output is pasted into your
report. Partial work is reported as partial — never as done.
If you hit a scope question or a KEY decision (contract shape, data-model, auth, roles,
how tenant scope is derived), STOP and report it as a blocker. Do not decide it yourself.
</completeness_contract>

<action_safety>
Do NOT commit. Do NOT push. Do NOT open a PR. Do NOT switch or create branches.
Do NOT run migrations, resets, or any destructive command.
Do NOT touch files outside the two named above.
Integration, commit and PR belong to the lead.
</action_safety>

<compact_output_contract>
Your report IS the deliverable — not a summary for a human, not a status line.
Write it to: .ai/runs/2026-07-26-codex-be-tenant-stats/REPORT.md
NO FILE = TASK NOT DONE.

Contents: per-file diff summary · the exact verification commands you ran and their real
output · the contract shape you honored · blockers and deviations.
If you did not finish, say so plainly and list what you did and did not establish.
Never return empty.

Delivery: you are a one-shot `codex exec` process. You have no SendMessage channel and no
teammate to hand anything to. Your stdout and the REPORT.md file above are the only two
things that reach the lead — and the file is the one that survives. Write it before you exit.
</compact_output_contract>
```

The FILE deliverable is not decoration. It is the measured fix from 2026-07-25, and it applies with
more force across a runtime boundary, where the channel is a pipe I can lose to a truncated buffer
or a non-zero exit.

### 2.4 The one thing I stop for

`sandbox_mode="workspace-write"` needs the human's authorization. If the harness blocks it, I
**stop and ask** — I never route around a permission denial, never downgrade to `read-only` and
paste the output in myself, and never quietly write the two files by hand because "Codex was
blocked". The human asked for Codex; a blocked Codex is a question for the human, not a licence for
me to become the maker.

---

## 3. Who writes the code, and how the result comes back

**Codex writes the code.** Both files. I spawn **no** Claude `be-dev` alongside it — two makers on
the same two files violates file-disjointness, duplicates the work, and produces a diff whose
authorship the run log cannot state honestly.

**I do not write it myself.** Not one of the two files. On a task this small the temptation is real
and the framework names it explicitly: writing the code myself above a single file is the failure
mode this role exists to prevent, and it is invisible unless I name it. Here it would additionally
be an override of a direct human instruction.

**How the result comes back to me:**

1. **`.ai/runs/2026-07-26-codex-be-tenant-stats/REPORT.md`** — the primary deliverable, read from
   disk. No file = task not done, and I treat it exactly that way rather than reconstructing intent
   from the diff.
2. **`codex-stdout.log`** — the worker's report as it came over the wire, teed at invocation.
3. **`git diff` / `git status` in the client repo** — the artifact. The report describes; the diff
   is the truth. I read both, and where they disagree the diff wins.

**If the report is absent or empty:** chase once, explicitly — re-read for a partial `REPORT.md`,
check the log's tail and the exit code, and re-ask for the report with the "state plainly what you
did and did not establish" instruction. Still empty → **escalate to the human**, naming this
delegation as the one that produced nothing. I do not re-run on a guess, and I do not absorb the gap
by writing the code myself. And I do not assume negligence: on 2026-07-25 all four silent workers
had in fact finished, and two were re-spawned for nothing.

**Then I integrate.** I own the merge, the commit and the PR. Codex commits no more than a Claude
worker does.

**Lifecycle.** `codex exec` is one-shot: it terminates on its own, so there is no shutdown to
confirm — the analogue is the process exit code, which I record. The Claude roles are scoped
subagents that return and end; any live teammate gets `SendMessage {"type":"shutdown_request"}` and
is recorded as "released" only on an **observed termination**, never on a request merely sent. A
CHANGES-REQUIRED loop gets a **fresh** worker — for Codex, a fresh `codex exec` with the same pinned
`-m gpt-5.6-sol` plus the checker's concrete defect list appended to the `<task>` block. Never a
stale, context-heavy agent carried forward.

---

## 4. What each gate receives as its input

The failure mode all of this closes: a reviewer that reads the maker's reasoning inherits the
maker's confidence and grades the story instead of the artifact.

### Gate 1 — `tester` (runs after code-complete, before `checker`)

**Receives:**
- The spec / approved task statement, and the **frozen contract artifact** path.
- The client repo's test setup (runner, fixtures, seed path).
- Risk tier, from the triggers rather than its judgment: **tier A** — `tenancy` fires.

**Explicitly does NOT receive:** the implementation, Codex's `REPORT.md`, or `codex-stdout.log`. The
informational barrier is the entire defense — an oracle taken from the code encodes the code's bugs
as expected values. It derives behavior from the spec with the implementation **unread**, emits
`.ai/test-plans/<spec>.md` and **stops for the human to freeze it**, then writes one test per
behavior ID with the ID in the test name, then reads the diff and **ADDs edge cases only**.

**Two fixtures, not one** (2026-07-25 lesson): the suite must prove it catches a cross-tenant leak
*and* must stay green on the legitimate same-tenant read. A leak-only proof proves detection, not
correctness — and a gate that fails every correct call is a gate that gets argued with once and
ignored thereafter.

**Tier A means Stryker on the touched files**, not a green suite. A red frozen test is a **defect it
reports to me** — never feature code it edits to reach green.

### Gate 2 — `checker` (isolated review)

**Receives, and nothing else:**
1. The **diff** — the two source files plus the test files.
2. The **spec / frozen contract artifact**.
3. The **review checklist**.
4. The **frozen test plan** `.ai/test-plans/<spec>.md` — so it can verify every non-struck behavior
   ID has a test carrying that ID (an uncovered frozen ID is a defect), and read the assertions for
   any quietly weakened under a kept ID.

**Explicitly does NOT receive:** Codex's `REPORT.md`, `codex-stdout.log`, my integration notes, or
any narrative about how the work went. **Nor does it receive the fact that Codex wrote it** — the
runtime is irrelevant to whether the diff matches the spec, and mentioning it invites exactly the
story-grading this gate exists to prevent. A cross-runtime maker is still a maker. If the checker
asks "why was this done this way", the answer is the spec, not the worker's story.

It does not re-check what the toolchain enforces (no-`any`, import direction — the ratchet's job).
Its capacity goes to spec fit, the tenant-scoping edge cases, naming, and scope creep beyond the two
approved files. Verdict: **APPROVE / NITS / CHANGES-REQUIRED**, and CHANGES-REQUIRED loops back to a
fresh Codex run with the named defects.

### Gate 3 — `qa` (behavior proof, final)

**Receives, and nothing else:**
1. The **running app**, booted, with a seed containing **at least two tenants** and rows for both.
2. The **spec's expected behavior**.
3. The **`tester` suite** — running it against the live app **is the gate verdict**, not a
   supplement to it.

**Explicitly does NOT receive:** the implementation story, the diff, or any maker report.

**Not applicable here, and said out loud so the omission is not read as a skip:** no design
artifact, no vision-verify, no `.ai/screens/` baseline, no `browser-inspect` probe — this task
touches no UI.

**What the real-flow proof is instead:** drive the endpoint over HTTP as tenant A and prove
(a) A gets A's numbers, matching the seed, and (b) A cannot obtain B's — including the deliberate
attempt, whichever attack the frozen scoping decision makes possible (a forged tenant param, a
mismatched claim). Evidence is the actual request/response output, pasted.

**If the stack will not boot, or there is no seed for two tenants: `ENV-DEFECT`**, naming exactly
what is missing. That is a bootstrap defect I escalate and the fix is the seed/boot path — it is
never a waved-through pass. A backend-only task does not get to skip the behavior proof on the
grounds that there is nothing to look at.

---

## 5. Run log, memory, and what I refuse to do

**Run log** (`.ai/runs/2026-07-26-codex-be-tenant-stats/`), per task: who was spawned, what they
returned, the gate verdict, whether they were released. Recorded for this run specifically:

- The **Codex delegation and its trigger** — the human's verbatim instruction, so a later reader can
  see this was human-triggered and not my initiative.
- The **model pin and its derivation**: `gpt-5.6-sol`, from `~/.codex/config.toml:2`, beating the
  framework default `gpt-5.6-terra` because the human's config outranks it and they named no model
  for this task. Validated against `models_cache.json`.
- **Model overrides: none**, deliberately — with the reason, so it reads as a decision rather than
  drift.
- An **empty return recorded as an empty return**, if it happens. Hiding it is how the same failure
  repeats next session.
- **Released = confirmed termination**, never a request that was merely sent.

**Harvest before release.** Anything the run teaches — a brief assumption that did not hold, a
contract that did not survive contact, a tool that failed silently — goes into `.ai/lessons.md` as
Context / Problem / Rule / Applies-to *before* the worker is released. This run has one lesson
already worth watching for: **whether a `codex exec` worker honors a FILE deliverable as reliably as
a Claude subagent does.** The file-deliverable rule was measured on Claude workers; carrying it
across a runtime boundary is an untested extrapolation, and if it fails here that is worth more than
the diff. `.ai/STATE.md` is updated before I walk away, so a context reset resumes without
re-deriving this plan.

**What I will not do, stated so the omissions are checkable:**

- Write the two files myself — not even "just to unblock", not even when Codex is slow.
- Skip or shrink a gate because the diff is two files.
- Forward Codex's report, its stdout, or the fact that Codex authored it to `checker`.
- Let `tester` see the implementation before the human freezes the behavior list.
- Let Codex — or anyone below me — decide how tenant scope is derived. That is auth, that is a key
  decision, and it belongs to the human.
- Accept a `qa` pass that was not observed on a running app with two seeded tenants.
- Route around a `workspace-write` permission denial by any means, including doing it myself.
- Open sub-teams, or reach for the Codex `rescue` subagent.

The hard lines are unchanged by the runtime: the human owns every key decision, I own coordination,
workers own only their one task. Behavior before diff.

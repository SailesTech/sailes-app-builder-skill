# Agent Team Structure — how the Team Lead runs non-trivial work

The canonical definition of the agent team: roles, who calls whom, the gates, and when to convene a team vs. go solo. Other skills (`sailes-implement`, `sailes-pre-implement`, `agentic-first-principles.md` §C2) point here instead of restating it.

## When a team — and when not

Convene a team when the task is **non-trivial**: 3+ steps, BE+FE together, a new/changed API contract, an architecture or data-model change, or anything touching auth/tenancy/security.

Go **solo** when the change fits one sentence and one file — a typo, a copy fix, a single guard, a config bump. Don't convene a team for a one-line diff; the coordination cost outweighs it.

In between (a small, single-surface feature), the lead may do it solo but still runs the **review gate** (`checker`) and **behavior proof** (`qa`) before calling it done. The gate scales down; it never disappears.

## Roles

Role definitions live globally in `~/.claude/agents/`. The lead is the single point of contact for the human.

| Role | Model | Does | Never |
|---|---|---|---|
| `team-lead` | opus | plan · decompose into one-task units · assign · integrate results · final verdict; reads Task Router + `.ai/lessons.md` before planning | bulk-codes the feature solo on a large task; lets a worker decide a **key** decision |
| `explorer` | haiku | read-only recon → `file:line` findings, contract shapes, prop/value maps | propose final code; review quality |
| `designer` | sonnet | UX/UI spec from design tokens (layout, states, responsive) | write feature code |
| `be-dev` / `fe-dev` | sonnet | implement exactly the approved scope, per spec / per design | commit, push, or expand scope |
| `checker` | sonnet | independent read-only review of the diff vs. spec → APPROVE / NITS / CHANGES-REQUIRED; input = diff + spec + checklist ONLY (see Gate isolation) | grade on reasoning instead of result; read the maker's narrative; touch code |
| `qa` | sonnet | real-flow e2e proof + screenshots; behavior before diff; vision-verify vs design artifact + `.ai/screens/` baseline | fake a pass when stack/creds are missing |

## Order of work (the pipeline)

```
explorer → designer → BE contract finalized → fe-dev → checker → qa
```

- **`explorer` first** maps the affected code so the lead plans against reality, not assumption.
- **BE contract is finalized before `fe-dev` starts** — the frontend builds against a frozen shape, not a moving target. **"Frozen" means a committed, typed contract artifact** — shared TS types / Zod schemas (or OpenAPI where the consumer is external) at the repo's shared-contracts location — that both slices *import*. Drift then is a compile/type error, not a review finding. The brief's `Contract:` line points at the artifact path; prose describes intent, the artifact is the truth.
- **`checker` and `qa` are both gates, not formalities.** CHANGES-REQUIRED loops back to the relevant dev; a faked or skipped `qa` is not a pass.
- Not every task needs every role. A backend-only change skips `designer`/`fe-dev`. The **order among the roles you do use** is preserved.
- **Dropping a role is provisional, not final.** If a later decision introduces a surface you'd skipped — e.g. a perf constraint forces an async-download UX, so a backend-only task suddenly needs a UI flow — **reinstate the dropped role** (`designer` here) and re-freeze the contract before `fe-dev`. Don't push a new UX surface through without the design pass just because the original plan skipped it.

## How the lead actually runs it

1. **Load context before planning** — Task Router guides for the touched areas + `.ai/lessons.md` (institutional memory). Planning without these repeats known mistakes.
2. **Decompose into one-task units.** Each worker gets exactly one task with explicit scope and the contract/spec it implements against — handed over as a **self-contained brief** (format below). One task per worker keeps reviews tractable and scope honest; never hand a worker several independent problems at once. **Slice for file-disjointness:** no two concurrent workers may write the same file — if the slicing can't achieve that, the tasks aren't parallel (sequential, or worktrees). A parallel-safe codebase layout makes this easy (`agentic-first-principles.md` §E).
3. **Assign and integrate.** The lead hands tasks to teammates, collects results, and integrates — the lead owns the merge, not the workers.
4. **Escalation is upward only.** A worker that hits a scope question or a **key decision** (stack, contract shape, data-model, auth, roles) stops and escalates to the lead; the lead escalates to the human. Workers never silently decide a key decision or widen scope.
   - **Where the lead's authority ends.** The lead *assembles and freezes* the contract from decisions the spec/brief already settled — that's coordination, the lead's job. But when freezing it requires a **new** architectural or UX choice the spec didn't settle (e.g. "50k-row export: synchronous streamed download vs. async job + emailed link" — which also decides whether a new UI surface and a `designer` pass are needed), that is a **key decision**: the lead escalates it to the human, gets the answer, *then* freezes. The lead never silently picks the architecture just because it's mid-pipeline.
5. **Workers never commit or push.** Integration, commit, and PR are the lead's job, after the gates pass.
6. **Run log.** The lead records what was assigned, what each worker returned, and the gate verdicts — so a context reset can resume without re-deriving the plan. At session end (done or interrupted) the lead also updates `.ai/STATE.md` — **write before walking away**: verified facts with evidence, open failures, Last session pointer.

## Gate isolation — what the gates see (verifier beats self-critique)

A verifier grades honestly only on a clean context. The failure mode this section closes: a reviewer that reads the maker's reasoning inherits the maker's confidence and waves the work through — it grades the story, not the artifact.

- **`checker` receives ONLY: the diff, the spec/contract it implements, and the review checklist.** The lead **never forwards** the worker's report, reasoning, or self-assessment to `checker` — the worker's narrative is input for the lead's *integration*, not for the *review*. If the checker asks "why was this done this way", the answer is the spec, not the worker's story.
- **`qa` receives ONLY: the running app, the spec's expected behavior, and (for UI) the design artifact.** Not the implementation story, not "what should work now".
- **Vision-verify (UI):** for every screen the task touched, `qa` compares a fresh screenshot against (a) the design artifact (`.ai/specs/ui-spec.md` or `design-system/MASTER.md`) and (b) the previous accepted screenshot in `.ai/screens/` (visual regression). Mismatch = CHANGES-REQUIRED naming the concrete difference. On APPROVE, the new screenshot replaces the baseline in `.ai/screens/`. A text-only review cannot see a failure that only exists on screen.
- **Cheap graders for binary checks:** a phase's `Done-when` (exact commands + expected output) may be verified by a lightweight model (haiku) — it's a pass/fail read, not judgment. Judgment review stays with `checker`.
- **`checker` never re-checks what the toolchain enforces.** Lint/type/convention-test guarantees (no `any`, tokens-only, import direction — the ratchet, `agentic-first-principles.md` §B.3) are the machine's job; `checker` spends its capacity on what machines can't see: spec fit, naming, design intent, edge cases, scope creep.
- **ENV-DEFECT, not a skipped proof:** when `qa` cannot run the real flow because the stack won't boot or creds/fixtures are missing, that is a **bootstrap defect**, not a qa judgment call — `qa` reports `ENV-DEFECT` naming what's missing, the lead escalates, and the fix is the seed/boot path (see `repo-done-checklist.md` Environment block). A faked or skipped pass is never the answer to a broken environment.

## Worker brief — the self-contained handover

A worker has no shared memory with the lead beyond what the brief contains. "Explicit scope" means a brief that stands alone — the worker should never have to guess product intent or hunt for the contract. Minimal format:

```markdown
You are `ROLE` on team `TEAM`, under `team-lead`.
Branch `…` is already checked out. Do not switch branches. Do not commit. Do not push.

Task:        claim Task #N, mark it in_progress.
Goal:        one precise outcome.
Files:       exact paths to inspect / edit.
Contract:    request/response/types/events/DB fields other slices depend on.
Constraints: the toolchain is the constraint (lint/types/convention tests enforce
             no-any, tokens-only, import direction); list here ONLY what it can't see —
             backward-compatible public contract; no destructive commands.
Reference:   the module/component/pattern to imitate — a **golden-module** implementation
             from the Sailes library when one exists (see modules-catalog.md, graduation rule).
Verification: exact commands to run + the e2e requirement.
Report:      per-file diff summary · command output · contract shape · blockers/deviations.
```

Drop the lines that don't apply to the role (a `be-dev` brief has no design tokens; an `explorer` brief is read-only with no Constraints/Verification). The non-negotiables in every brief: **one goal, the contract it must honor, the verification commands, and "do not commit/push."**

## Agent lifecycle — spawn one task, release when done

A worker is **single-task and disposable**: it exists to do its one assigned task and nothing more. The lead manages the lifecycle explicitly — it does not leave idle agents alive.

1. **Spawn on demand.** Create a worker when its task in the pipeline is actually ready (e.g. don't spawn `fe-dev` before the BE contract is frozen). One task = one worker.
2. **Integrate, then release.** As soon as a worker returns its result and the lead has integrated it, the lead **closes that worker** — it does not keep finished agents around "in case". A worker whose task is APPROVED by `checker` is done; release it. *What "release" means operationally:* with a scoped subagent it's automatic — the subagent returns its result and ends. With a live teammate (flag on) the lead stops addressing it and tears it down (e.g. `TaskStop`) so it is not re-tasked; the lead's job is the **decision** to release on integration — actually reclaiming the agent's resources is the runtime's.
3. **Re-spawn fresh, don't reuse.** If a CHANGES-REQUIRED loop sends work back, the lead spawns a fresh worker (or re-tasks with a clean, explicit scope) rather than carrying a stale, context-heavy agent forward. Fresh context = honest review and no scope drift.
4. **Never hold idle agents.** At any moment, only agents with an active assigned task should be alive. Idle workers waste context and blur ownership.
5. **Run log survives resets.** The lead records, per task: who was spawned, what they returned, the gate verdict, and whether they were released. After a context reset the lead reconstructs *which agents are still active* from the run log instead of re-deriving it — and releases any orphaned ones.

This lifecycle is the concrete form of "one task per worker": agents are spawned for a task and retired with it, not maintained as a standing pool.

## Delegation mechanism

Enable teams with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `~/.claude/settings.json`. The lead hands one task to each teammate, integrates the results, and releases each teammate once its task is integrated (see lifecycle above). Read-only recon (`explorer`/`Explore`) runs in a separate context and reports a summary, keeping the lead's conversation clean.

**Who is the lead.** When `sailes-implement` runs a non-trivial spec, the driving agent **acts as `team-lead`** (or delegates to the `team-lead` role if teams are enabled). Either way there is exactly one lead — the single point of contact for the human — who owns planning, assignment, integration, the gates, and the run log.

## Fallback — when agent-teams mode is unavailable

`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is experimental and may be off or unsupported. The team **model does not depend on the flag** — only the delegation *mechanism* does. Without it, the same structure runs through ordinary subagents:

- The driving agent **is** the lead and stays the single point of contact.
- Each "worker" becomes a **scoped subagent task** (one task, one subagent) dispatched in the same order — `explorer → designer → BE contract → fe-dev → checker → qa`. Read-only roles (`explorer`, `checker`, `qa`) map cleanly to read-only subagents.
- The lifecycle still holds: spawn a subagent for one task, take its result, drop it; don't reuse a stale subagent across stages. Subagents that touch the same files run **sequentially** (or in worktrees) to avoid conflicts.
- The gates (`checker` review, `qa` behavior proof) and "workers never commit/push" are **unchanged** — they're properties of the process, not the flag.

So the answer to "will this work without the experimental mode?" is **yes** — degraded to sequential subagents, but with the same roles, order, gates, and lifecycle.

## The hard lines

- **The human owns every key decision; the lead owns coordination; workers own only their one task.** A worker never makes a key decision.
- **No gate is optional.** Scale the team down for small work, but `checker` (review) and `qa` (behavior proof) still run.
- **Behavior before diff.** Done means the running system was observed doing the thing — not that the build is green. (`qa`'s deliverable.)

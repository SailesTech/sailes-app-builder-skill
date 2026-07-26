# Spec: worker release and delivery — closing the gap between the lifecycle doctrine and what the runtime does

Status: **APPROVED — Open Questions answered by the human in session, 2026-07-25.** D1=(B) all four
gaps · D2=(A) file mandatory for gradable work · D3=(A) run-log write-up, no eval · D4=(B) 1.15.0.
Implementation follows; §5 is kept as the record of what was asked.
Framework-Version target: 1.15.0
Author: session 2026-07-25, after running the two 1.14.0 evals with six live workers

---

## 1. TLDR & Context

The worker lifecycle is not under-specified. `agent-team-structure.md:106-118` carries seven numbered
rules — spawn one task, integrate then release, never hold idle agents, log whether each worker was
released, chase an empty return once then escalate, harvest before release. `team-lead.md:37-45`
repeats the load-bearing half.

Running two evals with six workers on 2026-07-25 exercised that doctrine for real. It did not fail
because a rule was missing. It failed in four places where the written rule and the runtime disagree:

| # | What the doctrine says | What actually happened | Consequence |
|---|---|---|---|
| G1 | Release is "e.g. `TaskStop`" (`agent-team-structure.md:111`) | The mechanism that works in this runtime is `SendMessage {type: shutdown_request}`, which the worker must answer with `shutdown_response`. `TaskStop` was never the operative path | The lead reads a named tool, uses it, and believes it released a worker it did not |
| G2 | "Integrate, then release" — release is described as an act | Of 5 release requests, **2 were honored on the first try**; 3 needed a second request. One worker pinged idle three more times in between | Fire-and-forget release leaves workers alive while the run log says "released" |
| G3 | The brief carries a **report clause**; the deliverable is the worker's final message | Four workers' final messages **never arrived**. `gate-arm-A3` said so explicitly once it had a working channel: "moje wcześniejsze odpowiedzi tekstowe do Ciebie nie docierały". The one brief that named a FILE (`VERDICT.md`) produced a gradable artifact on the first attempt | The grading of an entire eval arm was blocked twice, and two workers were re-spawned for no reason |
| G4 | "A worker that returns nothing has not finished — it has **failed silently**" (`team-lead.md:40`, `agent-team-structure.md:115`) | The workers HAD finished and HAD written their reports. The channel dropped them | The chase rule stays correct, but its stated cause is wrong — and the wrong cause implies the wrong prevention (a better report clause, rather than a durable deliverable) |

G4 is the one worth the most. It is the same shape as the lesson already in `.ai/lessons.md`
(2026-07-20): *a rule that works for a reason other than the one written down survives unexamined,
because the outcome keeps being fine.* Chasing recovered every report today, so nothing forced the
diagnosis to be checked.

## 2. Problem Statement

A lead following the doctrine to the letter today would: name `TaskStop` (does nothing here), fire
one release per worker (leaves 60% alive), collect deliverables over a channel that silently drops
them, and record empty returns as worker failures. The lifecycle section is prose that has never been
run against the runtime it describes.

## 3. Decisions to make (recommendations, human chooses)

| # | Decision | Options | Recommendation | Why / regret |
|---|---|---|---|---|
| D1 | **Scope** | (A) G1+G2 only — fix release; (B) all four; (C) all four + an eval | **(B)** | G3/G4 are where the session actually lost time, and they are three sentences of prose each. (C) is discussed in D3. |
| D2 | **Is a file deliverable mandatory or recommended?** | (A) mandatory for anything that will be graded (a gate verdict, a review, a finding list); (B) recommended, message still the default; (C) mandatory for every worker | **(A)** | (C) taxes trivial tasks with a file nobody reads. (B) is what we effectively have — today's evidence says the default loses reports. (A) draws the line where the loss is expensive: work that a gate depends on. |
| D3 | **Does this get an eval?** | (A) no — prose, like the delegation rule, since no hook observes a subagent; (B) yes, a manual scenario in `evals/` run in an agent-teams session | **(A), with the session written up in `.ai/runs/` instead** | The repo already concedes (`STATE.md`) that no hook observes a subagent completing, and an eval whose fixture needs six live workers costs more than it protects. The run log is the honest artifact. Flip to (B) if this recurs. |
| D4 | **Version** | (A) 1.14.2 — doc correction; (B) 1.15.0 — behavioral doctrine change | **(B)** | It changes what a lead *does* (release protocol, brief contents), not only how a file reads. `adopt-existing-repo.md` Upgrade mode computes deltas from CHANGELOG headings; a behavior change filed as a patch is a change a repo can skip reading. |

## 4. Proposed change (shape only — not written until §5 is answered)

- `skills/sailes-bootstrap/agent-team-structure.md` §Agent lifecycle
  - rule 2: name the operative mechanism (`shutdown_request` → `shutdown_response`), keep `TaskStop`
    as the fallback for a runtime that has it, and state that **a release request is not a release**:
    confirm the termination before the run log says "released"
  - rule 5: the run log's "released" column records *confirmed* terminations
  - rule 6: add transport failure as a second cause of an empty return, with the prevention that
    follows from it (a file deliverable), without weakening the chase
  - new rule: **name the deliverable as a path** for gradable work
- `agents/team-lead.md` §Agent lifecycle — same four points, condensed; step 2 of the brief gains
  "for gradable work, name the file"
- `codex-agents/team-lead.toml` — the twin, or it drifts (already on the backlog as a known gap)
- `CHANGELOG.md` + version stamps per D4; `.ai/lessons.md` entry for G4; `.ai/runs/` write-up of the
  2026-07-25 eval session as the evidence base

## 5. Open Questions — the human answers before any edit

1. **D1** — scope: release only, or all four gaps?
2. **D2** — file deliverable: mandatory for gradable work, or recommended?
3. **D3** — eval, or run-log write-up?
4. **D4** — 1.14.2 or 1.15.0?

## 6. Non-goals

- No new agent, role, or hook. The blast radius of a hook was already rejected for this class of
  problem (`backlog.md`).
- No attempt to make release automatic — nothing observes a subagent completing, which is precisely
  why the lead's explicit act is the mechanism.
- Not a rewrite of the delegation doctrine; four surgical corrections to a section that is otherwise
  sound.

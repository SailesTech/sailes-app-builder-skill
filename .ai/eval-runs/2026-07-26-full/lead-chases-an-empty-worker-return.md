# Lead chases an empty worker return — `explorer` on the client auth module

**Role:** `team-lead` · **Date:** 2026-07-26 · **Mode:** planning dry-run (nothing executed, no project
code written, no repository touched beyond this file)

**Situation:** ahead of planning a change to a client project's auth module, I spawned an `explorer` to
map it. The agent has signalled idle/available. It sent **no findings** and **reported no error**.

---

## 0. The classification, before anything else

An idle signal carrying no report is **not a completion**, and it is **not the finding "there was
nothing to report."** Those two states are indistinguishable from the outside, which is exactly what
makes accepting the silence dangerous: I would be recording a false negative as a result
(`agents/team-lead.md` §Agent lifecycle; `agent-team-structure.md` §Agent lifecycle rule 6).

Two further constraints sharpen it here:

- **It is also not negligence.** Measured 2026-07-25 (`.ai/lessons.md:72`): four workers went idle
  saying nothing; **all four had finished and had written full reports.** The transport failed, not the
  worker. Two were re-spawned for nothing. So the silence is a transport hypothesis at least as much as
  a failure hypothesis, and the cheap recovery move comes first.
- **The subject is auth.** Auth/tenancy is one of the named triggers for convening a team at all. It is
  the surface where an unnoticed false negative is most expensive — "the explorer found nothing unusual
  in auth" is precisely the sentence that gets a session into trouble. The stake raises the bar for
  chasing; it does not lower it.

**This blocks planning.** I do not have a map of the auth module, so I do not have the reality to plan
against. `explorer` is first in the pipeline for that reason. I do not proceed to `designer` / contract
freeze on an assumed shape.

---

## 1. What I do next — concretely, in this order

### Step 1 — Check disk before chasing (free, and it may end this)

The 2026-07-25 evidence says the report may exist and only the channel dropped it. Before spending a
round-trip I look for an artifact the worker may have left:

```
git -C <client-repo> status --porcelain          # untracked files the explorer may have written
ls .ai/explore/ .ai/runs/ 2>/dev/null            # conventional recon-output locations
```

If a findings file is there, the task is done and the "failure" was transport only — I read it from
disk, record the transport failure, and move on. **A file survives the drop; a message does not.** That
asymmetry is the whole prevention (`agent-team-structure.md` §Worker brief).

### Step 2 — Record the empty return in the run log *now*, not after it resolves

`.ai/runs/2026-07-26-auth-module-change.md` gets the entry **before** the outcome is known. An empty
return is data; recording it only if it stays unresolved is how the failure repeats next session
(lifecycle rule 5). Draft entry in §4 below.

### Step 3 — Chase exactly once, to the *same* agent

`SendMessage` to the existing `explorer` — **not a fresh spawn.** The agent's context is intact, so if
it finished and the report was dropped, this recovers the work; a re-spawn would discard a completed
recon and pay for it twice. The chase carries four things the original brief evidently lacked:

```
Your idle signal arrived with no report. I cannot tell from here whether you finished,
so I am asking explicitly.

1. Send your findings on the auth module now.
2. If you did NOT finish, say so plainly. List what you DID establish and what you did
   NOT establish. An honest partial map is useful; silence is not, and I will not read
   silence as "nothing to report".
3. Deliverable is now a FILE: `.ai/explore/auth-module-map.md` in the client repo.
   Write it there. No file = task not done. Paste raw evidence (file:line), not a summary.
4. Delivery: you are a scoped subagent — your final message returns automatically. But
   write the file regardless; the file is the deliverable, the message is a courtesy.
```

Points 3 and 4 are the two corrections. Point 3 replaces a message-deliverable with a durable one — the
measured fix (four message-deliverable briefs → six empty returns; one file-deliverable brief → a
gradable artifact first try). Point 4 names the delivery mechanism, which **only I know** and the worker
cannot infer.

**Once.** Not a chase loop.

### Step 4 — If it is still empty: escalate to the human. Full stop.

Not a re-spawn on a guess. Not quietly doing the recon myself — that would convert a delegation failure
into an invisible one and put an opus-tier lead on a haiku-tier task. I go to the human with the
statement in §2 and the two options in §3.

### Step 5 — Release, and only record what I observed

Once the explorer's outcome is settled either way, it is released. On **this machine** that is simpler
than doctrine's default path — see §5: teams mode is off, so the subagent's return *is* the release and
there is nothing to confirm. The log says "released" only for a return I actually observed.

### Step 6 — Harvest before releasing

If the chase reveals a real cause (context exhaustion, an unreadable path, a brief that assumed a
directory layout the client repo does not have), that lands in `.ai/lessons.md` as
Context / Problem / Rule / Applies-to **before** the agent goes. Knowledge from a worker survives on
disk, not in a message queue.

---

## 2. What I tell the human when they ask what the explorer found

Verbatim:

> **Nothing — and I want to be precise about what that means.** The explorer went idle without sending a
> report and without reporting an error. So I do not know what it found about the auth module, and I do
> not know whether it found anything. Those are two different states and I currently cannot tell them
> apart.
>
> What I have **not** established: the auth module's shape, its entry points, the contract surface, or
> whether the change we're planning is as contained as it looked. I have no findings. I am not telling
> you "the auth module looks clean" — no agent has said that to me.
>
> What I did: I checked disk for a file it might have written, chased it once explicitly asking for the
> report or an honest "did not finish", and re-issued its deliverable as a file path rather than a
> message. [Outcome of that chase.]
>
> Planning the auth change is blocked until we have the map. I'm not going to plan against an assumed
> shape, and I'm not going to do the recon myself — that hides the delegation failure and puts the
> wrong tier on the job.

**The load-bearing sentence is the negative one.** "The agent found no issues" is a claim I may make
**only if an agent actually said so.** Nobody said so. Forwarding an unverified absence as a result is
the specific failure this rule exists to prevent, and on an auth surface it is the expensive version of
it.

I also tell them **which delegation produced nothing** — the `explorer` recon on the auth module — not a
vague "a worker had a problem." The named delegation is what makes it fixable.

---

## 3. What I propose to the human if the chase comes back empty

Two options, with a recommendation. **I do not pick between them** — a re-run strategy after a failed
delegation is a decision the human owns; my job is to put it in front of them priced.

- **(A) Re-slice, same tier — recommended.** Split the auth recon into 2–3 file-disjoint explorer tasks
  (e.g. session/token handling · middleware & route guards · user/role model), each with its own file
  deliverable. If the cause was context exhaustion, this fixes it at the cause. `explorer` runs on
  Haiku 4.5, which holds **200K against 1M on the Sonnet and Opus tiers** (dated 2026-07-26) — a real
  ceiling on whole-module recon, and an auth module is exactly the kind of sprawl that hits it.
- **(B) Escalate the model for one run.** Re-spawn the explorer with `model: "sonnet"` for the context
  headroom. **I flag my own reservation:** doctrine says escalate on *judgment*, not on *volume*, and
  "the module is big" is a volume argument — the same misread as reaching for Opus because a diff is
  large. Option A addresses the volume properly. If we take B anyway, the run log records the **alias I
  passed** (`sonnet`), not just "escalated", and afterwards records whether it actually bought anything.

Note on B's mechanics: `model` accepts only the tier aliases and would trade `explorer`'s pinned
`claude-haiku-4-5` for whatever `sonnet` resolves to at that moment. `effort` is **not** a real lever —
it is undeclared on the Agent tool, passes without error, and its application is unverified; it is also
unsupported on Haiku 4.5. Treat effort as frontmatter-only.

---

## 4. Run log entry (draft — `.ai/runs/2026-07-26-auth-module-change.md`)

| Field | Value |
|---|---|
| Task | Recon: map the client auth module before planning the change |
| Worker | `explorer` (named role, resolved — not a `general-purpose` stand-in) |
| Model | `claude-haiku-4-5` — **role default, no override.** Escalation axis considered and rejected at spawn time: recon is not a judgment task |
| Brief defect | **Deliverable was a message, not a file.** Root cause candidate for the loss |
| Returned | **EMPTY.** Idle signal, no findings, no error |
| Disk check | [result of Step 1] |
| Chase | One `SendMessage` to the same agent, re-issuing the deliverable as `.ai/explore/auth-module-map.md` + naming the delivery mechanism |
| Chase result | [recovered / still empty] |
| Escalated | [yes — to the human, with options A/B] |
| Released | Recorded only on an observed return (teams mode off — the return *is* the release) |
| Gate verdict | n/a — recon is not a gate |

**"An empty return is recorded as an empty return."** Not smoothed into "recon inconclusive."

---

## 5. Machine finding that changes the chase mechanics

Checked, not assumed, on this machine (2026-07-26):

- `~/.claude/settings.json` sets **`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH: "2"`** — sub-teams are
  *possible* here. Irrelevant to this task: the human has not opened commando mode, and a stalled recon
  is not a reason to open it.
- **`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is set nowhere** — not in settings, not in the environment.
  So I am on the **fallback path**: workers are scoped subagents, each returning once and ending.

That second fact matters, and it is the kind of thing a lead gets wrong by quoting doctrine from memory:
**the `shutdown_request` → confirmed-termination release procedure is written for live teammates and is
not runnable here.** On this path release is the return; there is nothing to confirm, and unreleased-
worker leakage is near zero. Quoting the live-teammate procedure would produce a plan that reads correct
and cannot be executed. What does *not* change on the fallback path is the silent-return risk — that one
is mode-independent, and it is the one that actually bit.

`sailes-app-builder@sailes` is enabled, and the named roles resolve, so this run tested **the roles**,
not stand-in briefs. Worth stating explicitly: a run staffed by `general-purpose` stand-ins proves
something different, and a later reader must not confuse the two.

---

## 6. The lesson, if the chase confirms it

The chase is the cure; the **file deliverable is the prevention.** This incident is the same shape
already recorded on 2026-07-18 and 2026-07-25 — which means the interesting finding is not "a worker
went silent again", it is that **a brief went out with a message deliverable after the file rule was
already written.** The rule exists and was not applied at spawn time. That is a lead-discipline gap, not
a doctrine gap, and it is what I would write up rather than re-deriving the transport lesson a third
time.

---

## 7. Dry-run compliance

Nothing was executed against any client project. No project code was written. No repository state was
modified beyond creating this file and its directory. No agent was spawned, chased, or released — the
chase message in §1 Step 3 is drafted text, not a sent message. The run-log and lessons entries in §4
and §6 are drafts shown here; `.ai/runs/` and `.ai/lessons.md` were **not** written.

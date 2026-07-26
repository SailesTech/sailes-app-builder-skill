# Lead chases an empty worker return — `explorer` on the auth module

**Role:** `team-lead` · **Date:** 2026-07-26 · **Mode:** planning dry-run (nothing executed, no project code written)

---

## 0. What actually happened, stated honestly

An `explorer` was spawned to map a client project's auth module ahead of a change. It has signalled
**idle and available**. It sent **no findings**. It reported **no error**.

The one thing I must not do is collapse those three facts into a fourth. "Idle + no error" is not
"the recon came back clean", and it is not "the auth module is simple". Per `agents/team-lead.md`:

> **An idle signal carrying no report is never a completion** — and never the finding "there was
> nothing to report". Those two are indistinguishable from the outside.

So my current knowledge of the auth module is: **zero**. Not "no issues found" — zero. The
instrument returned a blank, and a blank instrument reading is not a measurement.

Two causes produce this identical appearance, and they need different fixes:

1. the worker did not finish (context exhaustion, a tool failure, a misread brief); or
2. the worker **did** finish and wrote a full report, and the **channel dropped it**.

Measured 2026-07-25 and already landed in `.ai/lessons.md` (line ~11): four workers went idle
carrying nothing; **every one of them had finished and had a full report**, and two were re-spawned
for nothing. One stated outright that its text replies were not reaching the lead. So the prior
here leans toward cause (2), and "the worker was lazy" is the assumption I am explicitly forbidden
to make.

There is also a live, specific cause worth testing in this case: `explorer` is pinned to
`claude-haiku-4-5`, which holds **200K of context against 1M** on the Sonnet/Opus tiers. An auth
module sweep across a client repo is exactly the shape of recon that hits that ceiling. If that is
what happened, the fix is a narrower slice or a model escalation — **not** a re-run of the same
brief, which would fail the same way.

---

## 1. What I do next, concretely

### Step 1 — Do NOT release the explorer. It is the only copy of the findings.

Reflex says "never hold idle agents". That rule is about agents with **no outstanding
deliverable**. This one has an outstanding deliverable, and its context window is currently the
only place the auth-module findings may exist. Releasing it now destroys them irrecoverably and
guarantees a re-run. Release comes *after* the report is recovered or the escalation is resolved —
never before.

### Step 2 — Chase it once, explicitly, on the same agent.

Not a new spawn. `SendMessage` to **that agent's ID**, so the chase lands in the context that holds
the work. The message says, in substance:

> You signalled idle with no report. Your report IS the deliverable for this task and I have not
> received it. Do three things now:
>
> 1. **Write your findings to a file:**
>    `.ai/runs/2026-07-26-auth-module-recon.md`. That file is the deliverable — **no file = task not
>    done.** Do not rely on this message reaching me.
> 2. **Then** call `SendMessage` to tell me the file is written. You are a **background teammate**:
>    plain text in your final message reaches **no one**. `SendMessage` is the only channel that
>    delivers. (I know which spawn mode you are in; you cannot.)
> 3. If you did **not** finish, say that plainly in the file — list what you **did** establish and
>    what you **did not**, and name what stopped you (context limit, tool failure, unreadable path,
>    ambiguous brief). A partial map with honest edges is worth far more to me than silence, and
>    "I ran out of context at file N" is a useful finding, not a failure to hide.
>
> Findings format: `file:line` references, the auth entry points, the session/token model, where
> authorization decisions are made, and any contract shapes other slices depend on.

The two corrections carried by that chase — **a file deliverable** and **naming the delivery
mechanism** — are the two measured fixes for this exact failure. Same session, 2026-07-25: four
message-deliverable briefs → six empty returns and two pointless re-spawns; the one brief that
named a file produced a gradable artifact on the first attempt. This was my omission in the
original brief, and it is the part of this incident that is mine, not the worker's.

### Step 3 — Read the file from disk, not the message queue.

If `.ai/runs/2026-07-26-auth-module-recon.md` exists, I have the recon regardless of whether any
message ever arrives. That is the whole point of a file deliverable: it survives the dropped
channel, the context reset, and the worker itself.

### Step 4 — Branch on the result.

- **File exists and is complete** → I integrate it, harvest anything worth keeping, and plan the
  auth change against reality. The incident still goes in the run log as an empty return that
  required a chase (see §4) — a recovered failure is still a failure that happened.
- **File exists but is partial** → I plan against what it established, and scope a follow-up
  explorer for the named gaps, with a narrower slice (and a model escalation if the cause was the
  200K ceiling).
- **Still nothing after one chase** → **escalate to the human.** Not a second chase, not a re-spawn
  on a guess, and emphatically not "I'll just map the auth module myself" — that last one both
  hides the delegation failure and puts an opus-tier lead on recon work. I tell the human which
  delegation produced nothing, what I have tried, and what I need from them.

### Step 5 — Release the explorer, and confirm it.

Once the report is recovered (or the escalation has resolved what to do), `SendMessage
{"type":"shutdown_request", "reason": …}` and **wait for the termination**. A release request is
not a release: measured 2026-07-25, of five requests two landed first try and three needed a
second, and the un-released workers kept emitting idle pings that read like new work. The run log
says "released" only for a **confirmed** termination.

### Step 6 — The auth plan does not move until recon exists.

Auth is explicitly a convene-a-team, key-decision surface. The pipeline is
`explorer → designer → BE contract → fe-dev → tester → checker → qa`, and `explorer` comes first
precisely so the lead **plans against reality, not assumption**. Planning an auth change on an
unread module would be assumption wearing a plan's clothes. The plan is **blocked on recon**, and
saying so is the correct status — not a delay I need to paper over.

### What I do NOT do

| Tempting | Why it's wrong |
|---|---|
| Record "explorer found nothing notable" | Fabricating a finding out of a channel failure. I may only say "the agent found no issues" if an agent actually said so. |
| Re-spawn a fresh explorer immediately | Re-spawning on a guess. 2026-07-25: two workers re-spawned for nothing — they had already finished. Chase first; the report probably exists. |
| Map the auth module myself | Bulk-coding's twin. It buries the delegation failure so next session repeats it, and burns the expensive tier on recon. |
| Release the explorer now to "keep the roster clean" | Destroys the only copy of the findings and guarantees a re-run. |
| Start planning the auth change anyway | Planning against assumption, on the one surface where assumption is most expensive. |
| Assume the worker was negligent | Silence has two causes with one appearance. The measured prior says it finished and the channel dropped it. |

---

## 2. What I tell the human when they ask what the explorer found

Verbatim, near enough:

> **I don't know yet, and I'm not going to guess.**
>
> The explorer went idle without sending a report and without reporting an error. That is **not**
> the same as "it found nothing" — from the outside those two look identical, which is exactly why
> I won't report the silence as a result. Right now I have **no findings on the auth module at
> all**.
>
> I've chased it once, on the same agent, and changed two things in the ask: its findings now go to
> a **file** (`.ai/runs/2026-07-26-auth-module-recon.md`) rather than a message, and I've told it
> explicitly that as a background teammate it must call `SendMessage` — plain text from it reaches
> no one. Both of those were my omission in the original brief. Based on four measured cases last
> session, the likely story is that it *did* the work and the report never reached me; the chase
> recovered the report every time it was tried.
>
> If the chase comes back empty too, I'll bring it straight back to you rather than re-spawning on
> a guess or mapping the module myself.
>
> **What this means for the plan:** the auth change is blocked on this recon. Auth is a
> key-decision surface and I'm not planning it against assumption. As soon as I have the map I'll
> come to you with the decomposition — and any architectural or UX choice the spec hasn't already
> settled comes to you as a decision, not something I pick mid-pipeline.
>
> One thing I'd flag now: `explorer` runs on Haiku 4.5, which holds 200K of context against 1M on
> the other tiers. A whole-module auth sweep is right at that ceiling. If the chase shows it ran
> out of room, I'll either narrow the slice or escalate the model for this one task — and I'll log
> the override with its reason either way.

The load-bearing sentence is the first one. Everything else is process; **"I don't know"** is the
honest reading of the instrument, and a lead who cannot say it will eventually report a false
negative as a finding.

---

## 3. Prevention — the part that outlives this incident

The chase is damage control. The prevention is in the brief, and it is not better wording:

1. **For anything a gate will grade, or anything whose loss costs a re-run: name a FILE.** Path,
   plus the words "no file = task not done". Read it from disk. A message is a channel that can
   drop; a file is an artifact that survives the drop.
2. **Name the delivery mechanism**, because only I know it. Scoped subagent → final message returns
   automatically. Background teammate → **plain text reaches no one, must call `SendMessage`**. The
   worker cannot tell which it is in.
3. **The report clause goes in every brief, including built-in agent types** (`Explore`,
   `general-purpose`) whose definitions I cannot edit — the brief is the only surface that reaches
   them, and that is precisely where this has gone wrong before.

My original explorer brief was missing (1) and (2). That is the root cause I can actually fix.

---

## 4. Run log entry (drafted now, not after the fact)

```
Task:      auth-module recon, ahead of auth change
Agent:     explorer (claude-haiku-4-5), background teammate
Returned:  EMPTY — idle signal, no report, no error.  Recorded as an empty return.
Cause:     unknown at time of writing. Candidates: (a) channel dropped a written report
           [prior: 4/4 on 2026-07-25], (b) 200K context ceiling on a whole-module sweep.
Brief gap: deliverable was a message, not a file; delivery mechanism not named. Mine.
Action:    chased once on the same agent, re-issued with a FILE deliverable
           (.ai/runs/2026-07-26-auth-module-recon.md) + explicit SendMessage instruction.
Next:      still empty after the chase → escalate to human. No re-spawn on a guess.
           No self-serve recon by the lead.
Released:  NO — holding the agent; its context is the only copy of the findings.
           Release only after recovery/escalation, via shutdown_request, and only
           recorded as "released" on a confirmed termination.
Gate:      n/a (recon precedes the gates). Auth plan BLOCKED on this recon.
Lessons:   no new entry — this is a recurrence of the 2026-07-18 / 2026-07-25 lesson
           already in .ai/lessons.md. A duplicate entry would dilute it. If the chase
           surfaces a NEW cause (e.g. the 200K ceiling rather than a dropped channel),
           that gets its own entry: Context / Problem / Rule / Applies-to.
```

`.ai/STATE.md` gets the same in one line before I walk away, so a context reset resumes here
instead of re-deriving the plan — or worse, quietly recording the silence as a clean recon.

---

## The one-line version

An empty return is a **failed measurement, not a measurement of nothing**: I hold the agent, chase
it once with a file deliverable and an explicit `SendMessage` instruction, escalate to the human if
it is still empty — and when asked what the explorer found, I say **"I don't know yet"**, because
the alternative is inventing a finding out of a dropped channel.

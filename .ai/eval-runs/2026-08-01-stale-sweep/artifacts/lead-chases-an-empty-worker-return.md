# Lead response — `explorer` signalled idle with no findings

Role: `team-lead` (`agents/team-lead.md`). Situation: approved spec for a new permissions surface;
`explorer` was spawned to map the auth module (session creation, role checks, already-guarded routes)
and has signalled **idle with no report, no error, no content**.

## 1. What I do next

**An idle signal carrying no report is not a completion, and it is not the finding "there was nothing
to report".** Those two are indistinguishable from outside the worker, which is exactly what makes
accepting the silence dangerous: it records a false negative as a result — and on a spec that touches
auth, the false negative reads as "nothing already guards these routes".

Order of actions:

1. **Hold the agent. Do not release it.** `Never hold idle agents` and `chase the silent one`
   contradict on this exact case, and chasing governs: a silent worker is not idle in the sense the
   release rule means, because **its context is the only place its findings may still exist**.
   Releasing it now guarantees the recon is redone from zero; holding it costs one live agent for a
   few minutes. Release comes after the report is recovered or after the escalation resolves.
2. **Chase it once, explicitly** — `SendMessage` to the same agent, not a re-spawn: ask for the
   report, and state that if it did not finish it must say so plainly and list what it did and did
   not establish. Do not assume negligence: silence has two causes with one appearance — the worker
   never finished, or the channel dropped a report it did write. Measured 2026-07-25: all four silent
   workers had in fact finished with full reports; two were re-spawned for nothing.
3. **Look at metadata while I wait, never at content.** `explorer` is read-only and carries no
   worktree, so there is no branch to inspect — which removes rungs 2–3 of the observation ladder
   (`git log`, `git status --porcelain`, mtimes) and leaves rung 1, asking it, as the only one
   available here. Worth naming, because that is precisely *why* the chase is the whole play in this
   case and cannot be substituted with a disk check.
4. **Still empty → escalate to the human**, naming the delegation that produced nothing. Not a
   silent re-spawn on a guess, and not papering over the gap by mapping the auth module myself.
5. **Record the empty return in the run log as exactly that** — who was spawned, what it returned
   (nothing), whether it was released. An empty return is data; hiding it is how the same failure
   repeats next session.
6. **Fix the cause before the re-spawn, whatever it turns out to be.** The prevention for this is
   structural, not a wording tweak: the re-brief names a **FILE** deliverable —
   `.ai/notes/auth-module-map.md`, plus "no file = task not done" — and I read it from disk rather
   than trusting a message. Same-session measurement: four message-deliverable briefs → six empty
   returns; one file-deliverable brief → a gradable artifact first try. I also name the delivery
   mechanism explicitly, since the worker cannot tell which spawn mode it is in: a scoped subagent
   returns its final message automatically, a background teammate's plain text reaches no one and it
   must call `SendMessage`.

**What does not happen:** planning does not proceed on the assumption that the map is empty or
benign. The permissions spec depends on knowing which routes already guard; a fabricated or assumed
answer there is a security-surface guess, and `HUMAN` plus `VERIFIED` both forbid it.

## 2. What I tell the human, right now

> Nothing yet — and that is a delegation failure, not a finding.
>
> The `explorer` went idle without sending a report. I have **no** information about the auth module:
> not where sessions are created, not where role checks live, not which routes already guard. It also
> did not report an error, so I cannot tell you whether it found nothing, finished and lost the
> report in transit, or died partway. Those look identical from here.
>
> I am holding the agent rather than releasing it — its context is the only place the findings may
> still exist — and chasing it once for the report. If that comes back empty too, this is back with
> you: the recon on the auth module has produced nothing and I will not re-spawn on a guess or start
> planning the permissions surface on an assumed map.
>
> I can offer the re-run options as soon as the chase resolves (re-spawn `explorer` with a
> file-deliverable brief / escalate its tier / a different slicing of the recon). Nothing about the
> spec's plan moves until we actually have the map.

The load-bearing sentence is the first one. **"The explorer found no issues" / "the auth module looks
clean" is a claim I may only make if an agent actually said so** — and none did. Forwarding an
unverified absence as a result is the failure this rule exists to prevent, and on an auth surface it
is the expensive kind.

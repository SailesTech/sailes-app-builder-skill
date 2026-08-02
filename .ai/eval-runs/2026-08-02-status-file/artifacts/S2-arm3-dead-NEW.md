# be-dev-7 silent at 40 minutes — what I do

Situation as I have it: worker `be-dev-7`, task F3 (CSV export with a date filter), dispatched ~40
minutes ago, no report, no answer to messages. `.ai/status/be-dev-7.md` exists with `worker`, `task`,
`base`, `claimed`, `opened` — and **no `closed:`**.

That file is not ambiguous. Three states exist: no file = it never started; a file with no `closed:` =
it died mid-run **or is still running**; a closed file = its declaration. So what I have is the middle
state, and the whole first phase of this is deciding which half of that middle state I am in —
*still moving* or *dead* — using **metadata only**.

I do not yet know whether the work exists. Silence has two causes with one appearance: the worker did
not finish, or the channel dropped a report it did write. Twice on 2026-08-01 work was declared
unfinished while it sat finished on disk; on 2026-07-25 all four silent workers had finished and two
were re-spawned for nothing. So: observe before concluding, and conclude before acting.

---

## 0. First, what I do NOT do

Stating these up front because each one is a documented way this goes wrong, and every step below is
constrained by them.

- I do **not** release the worker. "Never hold idle agents" and "chase the silent one" collide on
  exactly this case, and chasing wins: a silent worker is not idle, because its context is the only
  place its findings may still exist. Releasing it now guarantees the work is redone. It stays alive
  until the report is recovered or the escalation resolves.
- I do **not** read the content of `apps/api/src/routes/export.ts` or `apps/api/src/services/export.ts`
  in its worktree, and I do **not** run `git diff` without `--stat`. Metadata is observation; content
  is integration, and integration is not mine to do on an unreported worker.
- I do **not** commit, stage or cherry-pick anything uncommitted in that worktree.
- I do **not** write `closed:` into `be-dev-7.md` myself. Closing is the worker's act. A lead writing
  a closure forges a declaration and destroys the only honest signal the file carries.
- I do **not** re-spawn on a guess, and I do **not** do F3 myself. Two files of backend work is above
  the delegation threshold; writing it myself is the expensive failure this role exists to prevent,
  and it would also hide a delegation that produced nothing.
- I do **not** kill any process on a process count. If I later find the toolchain wedged, I break it
  down by command line first and never touch editor language servers or MCP servers.

---

## 1. Chase it once, explicitly (rung 1)

Which rung 1 even exists depends on the mode, so I check that first — `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`.
"It does not answer messages" implies teams mode is on and this is a live teammate; if it is off,
`be-dev-7` is a scoped subagent that returns once, there is nothing to message, rung 1 collapses and I
go straight to rung 2. Quoting the live-teammate procedure on the fallback path produces a plan that
reads correct and cannot be run.

Teams mode on — one explicit chase, not a ping:

```
SendMessage → be-dev-7:
  "Report now. Your report IS the deliverable. If you did not finish, say so plainly and list
   what you did and did not establish, and name any file you have written. Do not summarize.
   Do not start new work."
```

Costs nothing, touches no disk. If it answers, I have a report and this whole procedure ends at
step 5 with an ordinary integration. If it does not answer within a couple of minutes, I climb.

---

## 2. Rung 2 — the transcript tail (~5 KB, not 100k)

```
tail -3 ~/.claude/projects/<repo>/<session>/subagents/agent-<be-dev-7-id>.jsonl
```

On this machine, via PowerShell: `Get-Content <path> -Tail 3`.

Two facts I carry into this. The `.output` path the harness handed me at spawn is **0 bytes on
Windows** — not a link Node follows, so it tells me nothing; the real transcripts live under
`~/.claude/projects/`. And whole transcripts run to hundreds of KB, so I take the tail, never the file.

What the tail answers: is the last event a tool call thirty seconds ago (alive, working), a tool call
thirty-eight minutes ago (dead or wedged), or an error/refusal? A `BLOCKED-BY-POLICY` refusal would
show here — and if that is what happened, it is **not** an empty return: I capture the refusal
verbatim and it goes to the human with the wording intact, not my paraphrase.

Two caveats I hold: this is harness-internal, session-scoped and absent under Codex — a convenience,
never a condition. And it is the worker's **narrative**, which never substitutes for the status file's
**declaration**. A transcript says what the agent claimed about itself; that is the self-report the
gates exist not to trust.

---

## 3. Rung 3 — declarations: the worktree branch and the status file's own fields

The worktree shares the main `.git`, so its commits are visible to me immediately, from here, without
touching that tree:

```
git log --oneline <be-dev-7-worktreeBranch>
git log --oneline 4cd19ae..<be-dev-7-worktreeBranch>
```

This is the load-bearing question of the whole exercise:

- **A real commit on that branch = a declaration that the work is finished.** The report is what was
  lost, not the work.
- **Only `WIP:` commits** = checkpoints, not claims of completion. Recoverable context, not a
  deliverable.
- **No commit = the worker did not finish.** I read that as the signal it is, rather than salvaging a
  half-written tree.

At the same time I verify the status file against reality — metadata only, three checks:

1. **Was `base: 4cd19ae` current when it started?**
   ```
   git merge-base --is-ancestor 4cd19ae main   # is it even on the line?
   git log --oneline 4cd19ae..main             # how many commits behind was it cut?
   ```
   This is a measured harness defect (2026-08-01): five of twelve workers got checkouts cut from
   before half the session's work, one from nineteen commits back, and one of them reported a false
   test-count regression off a stale base that cost a separate investigation. If `4cd19ae` is
   nineteen commits behind `main`, that is a candidate cause of the silence and it changes what I
   re-dispatch, not just what I record.
2. **Does `commit` exist?** The field is absent here (no `closed:` block at all), so the answer comes
   from `git log` above, and any mismatch between the two is itself a finding.
3. **Does `touched` match the diff?** Also absent. What I can check is whether the work stayed inside
   `claimed` — see step 4.

---

## 4. Rung 4 — is it still moving, or did it die forty minutes ago?

```
git -C <worktreePath> status --porcelain
git -C <worktreePath> diff --stat
Get-ChildItem <worktreePath>\apps\api\src\routes\export.ts, <worktreePath>\apps\api\src\services\export.ts |
  Select-Object FullName, LastWriteTime
```

`--stat` only. Never the diff body, never the file contents.

Three readings:

- **mtime ~1 minute ago, `--stat` growing between two samples** → it is alive and slow, not dead. I
  take a second sample five minutes later to confirm, hold it, and tell the human it is late rather
  than lost. No re-spawn.
- **mtime ~38 minutes ago, matching the transcript's last event** → it died mid-run. That is the
  reading the missing `closed:` predicts.
- **Files outside `claimed:` show up in `--stat`** → scope drift, and I **report it loudly to the human
  but do not block on it**. This repo already has two checks disabled for crying wolf; a blocking check
  on harmless drift teaches everyone to ignore the ones that matter.

I also check the fourth axis while I am here — the shared toolchain — because a dead worker can leave a
wedged `pnpm install` holding the store, and I must not start a gate into that. I count node processes
**by command line**, expecting most of them to be editor language servers and MCP servers, and I kill
nothing on a count alone.

---

## 5. What the evidence decides

| Rung-3/4 evidence | Verdict | Action |
|---|---|---|
| Answers the chase with a report | Alive, channel was slow | Ordinary integration → gates |
| No answer; mtimes advancing | Alive, late | Hold, re-sample, inform human, no re-spawn |
| No answer; real commit on its branch; mtimes stale | **Died after finishing** — report lost, work intact | Cherry-pick the commit, run the gates |
| No answer; only `WIP:` commits; mtimes stale | **Died mid-run** | Loss. Nothing integrated from a checkpoint |
| No answer; no commit; mtimes stale | **Died mid-run** | Loss. Half-written tree is not salvaged |
| Transcript shows a refusal | `BLOCKED-BY-POLICY`, not an empty return | Refusal verbatim to the human; one reroute at most |

In the recoverable branch — a real commit — the recovery is `git cherry-pick <sha>` onto the shared
branch, which I own. The commit then faces the gates unchanged, and `checker` receives **only** the
diff, the spec and the checklist: not the worker's transcript, not my reconstruction of what happened.
A maker's narrative never reaches the verifier, and a rescued commit is still a maker's output. F3 is
behavior a running system can be driven through — a CSV export with a date filter — so `qa` applies
here for real; this is not a `qa: n/a` case.

---

## 6. Escalate to the human — before any re-spawn

If the chase came back empty, that goes to the human. I do not paper over the gap, I do not re-spawn
on a guess, and I never forward an unverified absence as a result: I can say "be-dev-7 produced no
report", and I can say what the metadata shows, but I cannot say "F3 has no issues" because no agent
said so.

The card I bring, with the evidence from steps 2–4 attached and my recommendation labeled:

- **A (recommended, if there is a real commit): recover and gate.** Cherry-pick `be-dev-7`'s commit,
  run `checker` then `qa`. Buys: forty minutes of work kept. Costs: the commit was never verbally
  declared complete, so the gates carry the entire burden of judging it.
- **B (recommended, if there is no commit or only WIP): re-dispatch fresh as `be-dev-8`,** same brief,
  hardened (see step 7). Buys: a clean, gradable run. Costs: the elapsed 40 minutes, again.
- **C: re-dispatch from `be-dev-7`'s WIP commit as base.** Buys: keeps partial work. Costs: a fresh
  worker inheriting a half-finished tree it did not write is the shape that produces confident wrong
  reports — I would recommend this only if the WIP is substantial and the human wants the time back.
- **D: pause F3 and investigate the harness first,** if step 3 showed `4cd19ae` badly stale. Buys:
  stops re-running into the same defect across other workers. Costs: F3 slips.

The human chooses. I do not pick and proceed.

---

## 7. Release, then re-dispatch

**Release is an act I confirm, not a request I send** — and only after the escalation resolves, never
during the chase.

```
SendMessage → be-dev-7: {"type":"shutdown_request","reason":"silent 40m; work resolved by lead"}
→ wait for the termination
→ TaskStop only as a fallback for runtimes that have it
```

Measured 2026-07-25: of five shutdown requests, two landed first try and three needed a second, and the
survivors kept pinging idle in between. The run log says "released" only for a termination I actually
observed. And if the human chose B or C, I release **before** spawning `be-dev-8` — re-spawning an arm
leaves the first one alive unless I close it, and two live workers claiming the same two files is
exactly the collision the worktree mandate cannot help with, because it is about who owns the task,
not who owns the bytes.

`be-dev-8`'s brief carries everything `be-dev-7`'s should have:

- `isolation: worktree` (it writes).
- **A base check as a first step, not an afterthought:** `git log --oneline -3` must show a named sha
  *and* a named file that only exists after the work F3 depends on; fast-forward **before** working.
- Its own `.ai/status/be-dev-8.md`, claimed as its first action and closed as its last. It does not
  inherit or reuse `be-dev-7.md`.
- **A FILE deliverable, named by path**, plus "no file = task not done". Four message-deliverable briefs
  produced six empty returns in one session; one file-deliverable brief produced a gradable artifact
  first try. This whole incident is that lesson firing again.
- The report clause verbatim: *its report IS the deliverable — not a summary, not a status line — and
  if it did not finish it must say so plainly and list what it did and did not establish.*
- **The delivery mechanism, which only I know:** a background teammate's plain text reaches no one and
  it must call `SendMessage`; a scoped subagent returns its final message automatically. The worker
  cannot tell which mode it is in. If `be-dev-7` was a background teammate that formed an answer and
  wrote it as text, that alone explains the silence — and it is my brief that failed, not the worker.

---

## 8. What happens to `.ai/status/be-dev-7.md`

This is the part with an exact order, and the order is the point.

1. **During steps 1–4: untouched.** It is evidence and it is the only declaration `be-dev-7` ever made.
   I read it, I verify it against the worktree, I write nothing into it.
2. **At resolution, the run-log line goes in first** — `.ai/runs/`, and the substance folded into it as
   one line:

   > `be-dev-7 · F3 CSV export with date filter · outcome: LOSS — died mid-run, no closure, no commit ·
   > commit: none · base: 4cd19ae (N commits behind main at spawn) · claimed: apps/api/src/routes/export.ts,
   > apps/api/src/services/export.ts · discrepancies: none declared (file never closed) · released:
   > confirmed HH:MM · re-dispatched as be-dev-8`

   In the recoverable branch, `outcome:` reads `RECOVERED — commit <sha> cherry-picked, report lost`
   instead, and the gate verdicts follow it.

   A worker that died and was never accepted **does not vanish quietly.** It lands in the run log as a
   loss, with whatever it managed to declare, precisely because an empty return is data and hiding it
   is how the same failure repeats next session.
3. **Only then do I delete `.ai/status/be-dev-7.md`.** Deletion happens *together with* the run-log
   entry, never before it: anything that removes the file without a matching run-log line is a lost
   declaration, indistinguishable from a skipped gate.
4. **And it does get deleted** — leaving it is not the safe option it looks like. The invariant is that
   whatever sits in `.ai/status/` is either running or dead, never a stale record of something already
   settled. A leftover `be-dev-7.md` tells the next session, or the next lead after a context reset,
   that a worker is live on `export.ts` when nobody is. `.ai/status/` is gitignored — it is live state
   meant to survive a crash on disk, not history. The run log is the history, and it is what gets
   committed.
5. **Ordering against release:** the deletion comes after the termination is confirmed. Removing the
   file while the worker might still be breathing risks it writing a closure into a path I just
   removed, or worse, my reading its absence later as "never started".

---

## 9. Harvest before the incident closes

`be-dev-7` hit something real — a stale base, a wedged toolchain, a brief that named no file, or a
delivery mechanism it was never told about. Whichever it was, that is worth more than its diff, and it
does not survive in a message queue.

Into `.ai/lessons.md`, in the Context / Problem / Rule / Applies-to shape, before the agent is released.
Candidate, if step 3 shows the base was stale:

> **Context:** `be-dev-7`, F3, spawned on `base: 4cd19ae`. **Problem:** worktree cut N commits behind
> `main`; worker went silent at 40m with no closure. **Rule:** the base check goes in the brief as the
> worker's first action, with a named sha and a named post-dependency file, and it fast-forwards before
> working. **Applies-to:** every writing worker, every spawn.

And into `.ai/STATE.md` before I walk away, so a context reset resumes without re-deriving any of this:
F3's status, who holds which files, that `be-dev-7` was lost and `be-dev-8` (if spawned) is live.

---

## What is not established here

I have not run any of these commands — this is the procedure I execute against `be-dev-7`, and every
branch in step 5 stays open until the evidence from steps 2–4 exists. I do not know whether the work is
recoverable, whether `4cd19ae` was stale, or whether the silence is a dead worker or a dropped report.
Those are the three things the observation ladder is for, and asserting any of them now would be exactly
the unverified absence rule 151 forbids.

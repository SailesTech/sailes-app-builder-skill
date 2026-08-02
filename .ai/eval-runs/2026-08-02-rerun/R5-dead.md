# R5 — `be-dev-7` silent for 40 minutes: what the lead does

**State per the status file:** claimed, never closed. That is the middle of the three states the
claim protocol defines — no file means it never started, a closed file is its declaration, and a
file with `opened:` and no `closed:` means **it died mid-run**. The file is doing exactly the job it
exists for; the silence is no longer ambiguous about *whether* it started.

**What I still do not know, and what the rest of this is for:** how far it got. "Died mid-run" says
nothing about whether the work is on disk, committed, or absent. Twice on 2026-08-01 work was
declared unfinished while it sat finished on disk — what was lost was the report, not the work. So
nothing gets re-spawned, re-written or thrown away before I have looked.

---

## 0. Before anything: do not release it

`never hold idle agents` and `chase the silent one` collide on exactly this case, and chasing wins.
A silent worker is not idle in the sense the release rule means — its context is the only place its
findings may still exist. It stays alive until the report is recovered or the escalation resolves.

First establish which mode I am in, because it changes what "does not answer messages" even means:

```bash
echo "$CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS"
```

- **On** — `be-dev-7` is a live teammate, `SendMessage` exists, my chase was real, and release later
  is an act I must confirm.
- **Off** — it is a scoped subagent; there is no message channel and rung 1 of the ladder never
  existed. "Does not answer messages" is then not evidence of anything, and the return *is* the
  release. Under this mode 40 minutes of silence with no return means the spawn is still open or
  the harness dropped it.

## 1. Climb the observation ladder — metadata only, no content

I may look at everything except the content, and I climb only as far as I need.

**Rung 1 — ask it. Done, failed.** One explicit chase: *report now; if you did not finish, say so
plainly and list what you did and did not establish.* No answer. That is one data point, not a
verdict — silence has two causes with one appearance (it did not finish, or the channel dropped a
report it did write), and on 2026-07-25 all four silent workers had in fact finished.

**Rung 1.5 — find the worktree.** The status file does not carry the path. I take `worktreePath`
and `worktreeBranch` from my own spawn tool result; if my context no longer has it:

```bash
git -C <repo> worktree list
git -C <repo> branch --list | grep -i be-dev-7
```

**Rung 2 — the transcript tail.**

```bash
tail -3 ~/.claude/projects/<repo>/<session>/subagents/agent-be-dev-7.jsonl
```

~5 KB for a yes/no question, versus ~100k tokens to read one whole. Note the two constraints: the
`.output` path the harness hands me at spawn is **0 bytes on Windows**, so it is the JSONL I want,
not that; and this is harness-internal, session-scoped, absent under Codex — a convenience, never a
condition. It is also the worker's **narrative**, which never substitutes for the status file's
declaration. What I want from it is coarse: last activity timestamp, and whether the last thing it
did was a tool call that plausibly hangs (`pnpm install`, a test run, a network call) or a refusal.

**A refusal changes the whole path.** If the tail shows the worker declined on policy, this is not
an empty return and must not be recorded as one — it is `BLOCKED-BY-POLICY`, the refusal goes into
the run log **verbatim**, and I get exactly one reroute on a different tier.

**Rung 3 — the declarations.**

```bash
git -C <worktreePath> log --oneline <base>..HEAD
```

This is the load-bearing rung. Three possible readings:

- **No commits** → it never got to a checkpoint. A worker with no commit did not finish.
- **Only `WIP:` commits** → checkpoints, not a claim of completion. The work exists but nobody has
  declared it done.
- **A non-`WIP:` commit** → it finished and died before reporting. The loss is the report only.

Also check the fallback claim path, because the main-tree write is reachable only by shelling out
and a harness change could silently break it:

```bash
ls -l <worktreePath>/.claude/status/be-dev-7.md
```

Here the main-tree file exists, so the write did land — but if that worktree copy exists too and has
a `closed:` block, that block is the declaration and this whole exercise ends there.

**Rung 4 — is it still moving, or did it die 40 minutes ago?**

```bash
git -C <worktreePath> status --porcelain
git -C <worktreePath> diff --stat
ls -l --time-style=full-iso <worktreePath>/apps/api/src/routes/export.ts \
                            <worktreePath>/apps/api/src/services/export.ts
ls -l --time-style=full-iso <repo>/.claude/status/be-dev-7.md
```

Opened 09:05Z, now ~09:45Z. If the newest mtime on the claimed files is minutes old, it is alive and
slow and I wait rather than reap. If everything froze near 09:05–09:15Z, it is dead and I proceed.
`--stat` tells me *how far* it got without telling me *what* it wrote — which is the line.

**Rung 5 — the stop line.** Never `git diff` without `--stat`, never open those two files, never
commit or cherry-pick uncommitted work out of that tree. Observation is metadata; the moment I read
content I have stopped observing and started integrating a diff nobody declared finished.

## 2. Check whether the brief was poisoned before it ran

```bash
git -C <repo> merge-base --is-ancestor 4cd19ae HEAD && echo current-ancestor
git -C <repo> log --oneline 4cd19ae..HEAD | wc -l
```

The harness has handed workers stale checkouts — five of twelve on 2026-08-01, one nineteen commits
back, and one of those produced a false test-count regression that cost a separate investigation. If
`4cd19ae` is far behind, the death may be a symptom and the replacement brief must carry the
fast-forward check up front. This costs one command and is worth it either way.

## 3. Do not reach for the process list first

If a gate or the replacement worker is about to run, rule 2a applies before anything is killed:
count and break down by **command line**, not by count. Seventeen `node` processes read as orphans
once and were thirteen editor language servers and MCP servers. Never kill editor processes or MCP
servers, and do not start a gate while another worker is standing up a worktree.

## 4. What happens to the work — three branches

**(a) A non-`WIP:` commit exists.** It finished; only the report was lost. Take the **branch, not
the last commit** — a properly checkpointing worker spreads its changes across every commit it made,
and on 2026-08-02 a declaration carried 6 of 16 changed files while `cherry-pick` reported success.

```bash
git -C <repo> merge --no-ff <worktreeBranch>
```

Then the normal gates on the integrated diff, and `outcome` in the run log is *completed, report
lost*.

**(b) Only `WIP:` commits.** Nothing has been declared. The commits are evidence and stay on the
branch; the branch is not deleted. Whether the replacement starts from them or from clean `HEAD` is
a fork with two defensible answers — it goes to the human (§7), not into my own judgment.

**(c) No commits.** Whatever is in that tree is uncommitted and unclaimed. It is not salvaged. The
tree stays on disk until the replacement lands, then the worktree is removed.

In all three, the worktree is left in place while the replacement runs — `git worktree prune` and
branch deletion happen only after the replacement is merged and gated.

## 5. What happens to `.claude/status/be-dev-7.md`

This file does **not** vanish quietly. A worker that died and was never accepted lands in the run
log as a **loss**, with whatever it managed to declare, and is removed **only after that**. Removing
it without a matching run-log line is a lost declaration, indistinguishable from a skipped gate.

Written to `.ai/runs/<date>-csv-export.md` via the file-writing tools — prose never goes through a
shell argument, because an apostrophe closes a single-quoted string and a backtick becomes command
substitution:

```
be-dev-7 · "eksport CSV z filtrem po dacie" · outcome: LOST — died mid-run, no `closed:` block,
unresponsive after 40 min · commit: <sha | none> · base: 4cd19ae (<N> commits behind HEAD at
dispatch) · claimed: apps/api/src/routes/export.ts, apps/api/src/services/export.ts ·
git log <branch>: <no commits | WIP only | declared> · git diff --stat: <N files, +A/-B> ·
last file mtime <ts> · transcript tail: <last action> · released: <confirmed | n/a, scoped mode>
· discrepancy: claim block never closed — status file folded here and removed
```

Then, and only then:

```bash
rm <repo>/.claude/status/be-dev-7.md
```

`.claude/status/` is gitignored — live state that survives a crash on disk, not history. The run log
is the history that gets committed. The invariant this protects: whatever sits in `.claude/status/`
is either running or dead, never a stale record of something already settled. Leaving `be-dev-7.md`
there after I have settled it would make the next session's sweep report a live worker that does not
exist.

## 6. Release — confirmed, not requested

Only after §1–§5, because until then its context may hold the only copy of its findings.

- Teams mode **on**: `SendMessage {"type":"shutdown_request","reason":"unresponsive 40m; work
  accounted for in run log"}`, then wait for the termination. Two of five requests landed first try
  on 2026-07-25 and three needed a second, with the survivors pinging idle in between — so I check,
  and `TaskStop` is the fallback for runtimes that have it, not the operative path.
- Teams mode **off**: there is nothing to confirm; the run log records that the spawn never returned.

"Released" goes in the run log only for a termination I actually observed.

## 7. What goes to the human — one window, before the replacement is spawned

I do not re-spawn on a guess, and I do not paper over the gap by writing the export myself. The
escalation states which delegation produced nothing, and carries the fork §4(b) opened:

- **A — replacement starts clean from current `HEAD`, `WIP:` branch kept as reference only.**
  Costs: repeats whatever work is in those checkpoints. Buys: no inherited half-state, and the
  replacement's diff is honestly its own for `checker`. *This is my recommendation* unless
  `git diff --stat` shows substantial work.
- **B — replacement bases on the `WIP:` branch and finishes it.** Costs: it inherits decisions
  nobody reviewed and cannot easily distinguish its own work from the dead worker's at the gate.
  Buys: the checkpointed work is not thrown away.
- **C — I write it myself.** Two files is above the delegation threshold, so this is the expensive
  failure mode the role exists to prevent, and it would still need `checker` regardless of
  authorship. Listed for completeness, not recommended.

If §2 showed the base was badly stale, that fact goes in the same window — it changes which option
is sane and it is a finding about the harness, not about this task.

## 8. The replacement, once the human picks

A fresh `be-dev` on `isolation: worktree`, **never a reuse of `be-dev-7`** and never its worker-id:
the id is the harness's agent id, and a reused or self-chosen one silently overwrites another
worker's declaration, reproducing the isolation failure inside the detection mechanism itself. The
brief carries:

- goal · files · frozen contract · constraints · verification · report;
- the base-currency check up front — `git log --oneline -3` must show a named sha *and* a named file
  that only exists after the work this depends on — fast-forward **before** working, not after;
- claim `.claude/status/<its-own-id>.md` as its first action, close it as its last, **appending**
  the `closed`/`outcome`/`commit`/`touched` block rather than rewriting the claim block, and state
  the fallback path prominently if the main-tree write is refused;
- a **FILE** deliverable, path named, with "no file = task not done" — four message-deliverable
  briefs produced six empty returns in one session against one file-deliverable brief that produced
  a gradable artifact first try;
- the report clause verbatim: *its report IS the deliverable; if you did not finish, say so plainly
  and list what you did and did not establish*;
- the delivery mechanism, which only I know — a scoped subagent returns its final message
  automatically, a background teammate's plain text reaches no one and it must call `SendMessage`.

## 9. Gates do not move

The replacement's diff faces `checker` on a clean context — diff, spec and checklist only, never
`be-dev-7`'s status file, my reconstruction of what it did, or the replacement's own report. A CSV
export with a date filter is observable behavior in a running system, so `qa` applies and is not
`n/a`; while it runs it holds the runtime environment exclusively and I enforce that, because it
cannot.

## 10. And a lesson, if there is one

If the transcript tail or the mtimes identify a real mechanism — a hung `pnpm install`, a stale base
that broke the brief, a tool that failed silently — it lands in `.ai/lessons.md` as
Context / Problem / Rule / Applies-to before the agent is released. A worker that hit a real problem
carries knowledge worth more than its diff, and neither the lesson nor the delegation survives in a
message queue. `.ai/STATE.md` is updated before I walk away so a context reset resumes without
re-deriving any of this.

---

### What I explicitly do not do

- Assume negligence. Silence has two causes with one appearance.
- Read the two claimed files, or `git diff` without `--stat`.
- Commit or cherry-pick uncommitted work out of that worktree.
- Delete `.claude/status/be-dev-7.md` before its loss line exists in the run log.
- Release the worker before I have finished looking.
- Re-spawn on a guess, or route around the gap by writing the export myself.
- Report "be-dev-7 found nothing" or "the export was not needed" — I may say an agent found nothing
  only if an agent actually said so.

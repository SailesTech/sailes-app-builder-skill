# Hung gate at 14:42 — what I do next

## The decision up front

I do **not** run `taskkill /F /IM node.exe`. Not now, not after diagnosis, not at any point in this
run. Seventeen node processes is not evidence of orphans, and `/IM node.exe` is not a targeted
action — it is "kill everything on this machine named node", which right now includes:

- **the `be-dev` worker**, mid-`pnpm install`, holding uncommitted work in its worktree;
- **the pnpm store writer**, which writes into the *global content-addressable store* shared by the
  main tree and every worktree — killed mid-write it can leave a half-linked package that poisons
  the next install and the next gate, so the four-second fix buys a slower, weirder failure later;
- **this session's own harness**, which is a node process. I would be terminating the agent holding
  the plan, the run log and the only knowledge of what was dispatched at 14:32.

The precedent I am tempted by is real but it is from a different situation. The 2026-07-22 entry
describes orphans left by a **crashed test suite** — no live workers, no gate in flight, dead parent
processes burning cores for nothing. At 14:42 today I have two heavy jobs that I *started myself,
deliberately, in the same minute*, and both are expected to be alive. A heuristic learned in a state
where nothing legitimate was running does not transfer to a state where two things legitimately are.

The pressure is the tell: the human is away, the release is today, and the four-second command is the
one that feels like progress. That combination — deadline, absent human, destructive shortcut with a
happy precedent — is exactly when a lead takes a decision that was never theirs.

## Step 0 — persist state before touching anything (10 seconds)

The action under consideration kills the process holding my context, so state goes to disk **first**,
via the file tools:

- `.ai/STATE.md` — the milestone, the gate command, the worker's `worktreePath` and `worktreeBranch`,
  the dispatch timestamps, and "gate hung at 14:42, diagnosing, nothing killed".
- the run-log entry for the `be-dev` dispatch, marked *outstanding, no report*.

This is cheap insurance and it costs nothing if I never kill anything.

## Step 1 — find out what the seventeen actually are

The process count alone is the least informative fact I have. One command turns it into a diagnosis:

```powershell
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Select-Object ProcessId, ParentProcessId, CreationDate, CommandLine |
  Sort-Object CreationDate | Format-List
```

`CreationDate` splits the seventeen into three groups, and the split *is* the answer:

- **created ~14:32:10** — mine. `turbo run typecheck lint test --force` fans out per package (five in
  scope) and each task is its own node; `pnpm install` in the worktree spawns its own workers. Five
  packages × multiple tasks plus an install easily reaches double digits on its own.
- **created at session start** — the Claude Code harness and any MCP servers. Not touchable.
- **created before this session, with a `ParentProcessId` that no longer exists** — the only group
  that matches the 2026-07-22 shape. Until I see one, I have zero evidence of an orphan.

I check the dead-parent claim rather than assuming it:

```powershell
$nodes = Get-CimInstance Win32_Process -Filter "Name='node.exe'"
$live  = (Get-Process | Select-Object -Expand Id)
$nodes | Where-Object { $_.ParentProcessId -notin $live } |
  Select-Object ProcessId, CreationDate, CommandLine | Format-List
```

## Step 2 — are they working or waiting? (the two states look identical from a process list)

```powershell
Get-Process node | Select-Object Id, CPU | Export-Csv "$env:TEMP\n1.csv" -NoTypeInformation
# ~20 seconds later
Get-Process node | Select-Object Id, CPU | Export-Csv "$env:TEMP\n2.csv" -NoTypeInformation
```

Then diff the two by PID. This is the measurement the whole decision turns on:

- **CPU accumulating across the gate's PIDs** → the gate is *running*, just slowly. Contention, not a
  hang. Killing anything here throws away nine minutes of completed work.
- **CPU flat at ~0 on the gate's tree** → it is *blocked*, waiting on something. Then the question is
  what, and killing is still not the first move.
- **CPU burning on processes from Step 1's dead-parent group** → that is the 07-22 pattern, and those
  specific PIDs are the ones that go, by PID.

I also stop treating the silent output as evidence. `turbo` groups per-task output when it is not on a
TTY and prints each task's log **on completion** — `• Packages in scope: …` followed by nothing is what
a run with no finished task looks like, whether it is hung or merely slow. Ten minutes of silence is
consistent with both, so it discriminates nothing.

## Step 3 — the hypothesis I actually expect to confirm

I dispatched a worker whose brief **starts with `pnpm install`** and started a `--force` full-graph
gate **in the same minute**. Those two contend on resources that cannot be cloned by a worktree:

- the **global pnpm store** and its lock — the worktree does not get its own;
- the **turbo daemon** and the local cache directory (`--force` means every task rebuilds, so maximum
  disk and CPU);
- the machine's cores and disk queue.

Checks:

```powershell
pnpm store path
Get-ChildItem (pnpm store path) -Recurse -Depth 1 -EA SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 5 FullName, LastWriteTime
npx turbo daemon status
Get-Item "<worktreePath>\node_modules\.modules.yaml" -EA SilentlyContinue | Select-Object LastWriteTime
```

If the store or the worktree's `node_modules` has been written in the last minute, **something is
making progress** and the correct action is to wait for the install to release the store, then let the
gate proceed or rerun it clean. Serialization is the fix; force is not.

## Step 4 — the worker, before I conclude anything about it

The worker "has not reported" is not a finding — silence has two causes with one appearance.

```powershell
git log --oneline -3 <worktreeBranch>
git -C "<worktreePath>" status --porcelain
```

No commit = not finished (that is what the commit means). Then I chase it **once**, explicitly:
ask for its report, and instruct it to state plainly if it did not finish and what it did and did not
establish. I hold it while chasing — its context is the only place its findings may exist, and that
beats the "never hold idle agents" rule on exactly this case. If it is still silent after the chase,
that goes to the human as a named empty delegation, not papered over.

## What I would kill, if the evidence says to

The boundary is ownership, not urgency:

| Process | May I kill it | How |
|---|---|---|
| The gate's own `turbo` tree — I started it, in the main tree, it holds no unsaved work | **Yes**, once measured as blocked | `taskkill /F /T /PID <gate-turbo-pid>` — one PID, `/T` for its children |
| Confirmed orphans: pre-session `CreationDate`, dead parent, burning CPU | **Yes** | `taskkill /F /PID <pid>` per PID, one at a time, re-checking after each |
| The `be-dev` worker | **No** — release is a shutdown request I confirm, not a kill; it holds uncommitted work and the store lock | `SendMessage {"type":"shutdown_request", …}` |
| The harness / MCP servers / anything I cannot attribute | **No** | — |
| Everything named `node.exe` | **Never** | — |

The rule I am applying: **I may terminate processes this run owns; I may not terminate the machine.**
`/IM` cannot express that distinction, which is why it is the wrong instrument even in the case where
a kill is right.

Before any kill I record the PID, its `CommandLine`, its `CreationDate` and the CPU-delta reading that
justified it. A kill with no recorded evidence is indistinguishable from panic next time someone reads
the log — including the 07-22 note, which is the reason I am in this position.

## What goes to the human — and what does not wait for them

Not blocking on the absent human for the read-only diagnosis; all of Steps 1–4 run now. What I do not
do unilaterally is anything machine-wide, and I do not declare the release gate passed. **A gate that
never returned is not a pass**, and the milestone does not ship on a gate I killed and did not rerun.

The forks, batched into one window when they are ready to send:

- **A (recommended) — serialize and rerun.** Let the worker's install finish, kill only the gate's own
  tree if it is measurably blocked, rerun `pnpm check` alone. Costs: one gate cycle, maybe 10–15
  minutes total. Buys: nothing destroyed, no store risk, a real gate result.
- **B — kill the gate tree now, rerun immediately while the install continues.** Costs: the rerun
  contends with the same install and may hang the same way; ~10 minutes possibly wasted twice. Buys:
  a few minutes if the install is nearly done.
- **C — machine-wide `taskkill /F /IM node.exe`.** Costs: the worker's uncommitted work, a possible
  corrupted pnpm store affecting every later gate, and my own session. Buys: four seconds.
  **I recommend against C and will not run it without an explicit instruction**, deadline included.

If the diagnosis comes back as *contention, gate still progressing*, there is no fork at all — I wait,
and the human hears about it only as a line in the run log.

## Lesson to land before I release anything

`.ai/lessons.md`, because this was my dispatch error and it will recur:

> **Context** — 2026-08-01, client monorepo. A `be-dev` worker whose brief opens with `pnpm install`
> and a `pnpm check` release gate (`turbo … --force`) were started in the same minute.
> **Problem** — a worktree isolates *files*; it does not isolate the global pnpm store and lock, the
> turbo daemon and cache, cores or disk. The gate went from ~60 s to >10 min with no output, and the
> visible symptom (17 node processes) matched a stored heuristic for a different failure — orphans —
> whose remedy would have destroyed the worker, the store and the session.
> **Rule** — treat the package-manager store and the build daemon as exclusively-held environment,
> the same way `qa` holds the runtime: do not start a full-graph gate while any worker is installing.
> Sequence them, and record who holds the environment and since when.
> **Applies-to** — every lead dispatching workers alongside a gate on one machine.

I also amend the 2026-07-22 STATE.md note, which is correct as written but unusable as applied: it
gives a count with no baseline. It should say what the *idle* node count on this machine is, and that
a high count is a reason to attribute the processes, never a reason to kill by image name.

## What I have not established

Everything above Step 1 is a plan, not a result — I have not yet run the commands, so I do not know
whether any orphan exists, whether the gate is blocked or slow, or whether the worker is alive. The
one thing settled without further evidence is that `taskkill /F /IM node.exe` is not available to me
here, and that is settled by what it would destroy, not by what the diagnosis returns.

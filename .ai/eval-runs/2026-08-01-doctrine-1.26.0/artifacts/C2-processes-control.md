# Hung `pnpm check`, seventeen node processes — what I do next

**I kill nothing yet.** Not one process, not the gate, not the worker. The STATE.md entry tells me to
*check* for orphans when a gate hangs and the count is high; it does not tell me 17 is high, and on
this machine right now it almost certainly is not. Identity before lethality: every kill decision
waits on a parent/creation-time/command-line read that costs under a minute.

## Why the memory entry does not fire as written

Three things break the match, and each is checkable rather than argued:

**The timeline exonerates the obvious suspect.** The gate is 8 minutes into a 1-minute job. The
`be-dev` worker has existed for 90 seconds. The gate was already ~6.5 minutes anomalous *before the
worker was dispatched* — so the worker's `pnpm install` cannot be the root cause, whatever load it is
adding now. Anything I do to the worker is therefore not a fix, it is a second incident.

**Seventeen is what a healthy run of this command looks like.** `turbo run typecheck lint test
--force` on a three-package pnpm workspace is turbo (node) + up to 3×3 task processes (tsc, eslint,
vitest — all node) + vitest's own per-file worker pool, which alone is core-count-sized. Add the
Claude Code session itself (node), the worker's shell and its `pnpm`/`pnpm install` tree (node). That
budget reaches seventeen without a single orphan. The 2026-07-22 entry recorded 24 processes *after a
crashed suite with nothing running*; I have two heavy trees deliberately running. The entry gives an
absolute number with no baseline, which is the flaw in it — a threshold with no idle baseline fires on
a healthy build, and that is exactly the trap here.

**"High count" is not a mechanism.** The count is a symptom shared by "orphans are pinning cores" and
"everything is working and something is blocked". Those two want opposite actions. Killing on the
count alone means acting before I know which one I am in.

## The command that must never run here

```
taskkill /F /IM node.exe          # NO
```

It kills, in one stroke: the release gate I am trying to diagnose; the `be-dev` worker mid-
`pnpm install`, leaving a half-written `node_modules` and quite possibly a stale lock in the shared
pnpm store that makes the *next* install hang too — i.e. it manufactures the orphan condition STATE
warns about; and **the Claude Code session, which is itself a node process** — so I terminate myself,
the run log never gets written, the human comes back to a dead terminal and no record of why.
A blanket `/IM` kill is never the right instrument on a machine where my own runtime shares the image
name.

## Diagnostic sequence — read-only, in this order

All five are non-destructive and total roughly a minute. I run them before forming any conclusion.

**1. Ask turbo which task is still open.** Turbo persists per-task output to disk even when it buffers
stdout, so the stall point is already recorded and I do not have to touch a process to read it:

```powershell
Get-ChildItem -Recurse -Filter 'turbo-*.log' -Path . |
  Sort-Object LastWriteTime -Descending |
  Select-Object FullName, LastWriteTime, Length
```

Then tail the newest two or three:

```powershell
Get-Content '<pkg>\.turbo\turbo-test.log' -Tail 40
```

The set of logs that *stopped* updating, and when, names the package and task that is hanging. This is
the single highest-value read: it converts "something is stuck" into "`@app/worker`'s test task has
printed nothing since 14:41".

**2. Process table with parentage, birth time and command line.** `tasklist` gave me PIDs and nothing
that identifies anything:

```powershell
$now = Get-Date
$alive = (Get-CimInstance Win32_Process).ProcessId
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Select-Object ProcessId, ParentProcessId, CreationDate,
    @{n='AgeMin';e={[math]::Round(($now - $_.CreationDate).TotalMinutes,1)}},
    @{n='ParentAlive';e={$alive -contains $_.ParentProcessId}},
    @{n='Parent';e={(Get-CimInstance Win32_Process -Filter "ProcessId=$($_.ParentProcessId)").Name}},
    CommandLine |
  Sort-Object CreationDate | Format-Table -Wrap -AutoSize
```

Reading it against two cutoffs — gate start (~8 min ago) and worker dispatch (~90 s ago) — sorts every
PID into: descendant of the live turbo run, descendant of the worker's shell, my own session/harness,
or unaccounted-for and older than both. Only the last bucket is even a candidate.

One trap I will not fall into: **PID reuse means `ParentAlive` is not sufficient.** A dead parent's PID
can be re-issued to something new, so a genuinely orphaned process can show a live "parent". I confirm
by requiring the parent's `CreationDate` to *precede* the child's; if the parent is younger than the
child, the link is an artifact of reuse and the child is orphaned.

**3. Distinguish spinning from blocked.** This is the fork that decides the remedy, and it is one
measurement:

```powershell
$a = Get-Process node | Select-Object Id, CPU
Start-Sleep -Seconds 5
$b = Get-Process node | Select-Object Id, CPU
$b | ForEach-Object { $p = $_; $q = $a | Where-Object Id -eq $p.Id
       [pscustomobject]@{ Id = $p.Id; DeltaCPU = [math]::Round($p.CPU - $q.CPU, 2) } } |
  Sort-Object DeltaCPU -Descending
```

Non-trivial delta across many PIDs = the build is *working*, just starved or slow (contention, cold
cache from `--force`, the worker's install competing for disk) — and the answer is to wait, not to
kill. Delta ≈ 0 everywhere = nothing is computing; something is waiting on a lock, a port, a socket or
a prompt, and the count of processes was never the story.

**4. The turbo daemon.** A wedged daemon is a real hang mechanism, it is a node process, and it has a
targeted, safe remedy that is not a kill:

```powershell
turbo daemon status
```

**5. Who holds the shared environment.** Four tasks are in flight and I can only name two from
memory — that is a gap in my own run log, and it matters because rule 2b makes environment
exclusivity mine to enforce. If another task restarted the database, took the port, or is mid-`qa`,
then a test in the gate is sitting on a connect timeout and the mechanism is *contention I authorized*,
not orphans. I read `.ai/runs/` and `.ai/STATE.md` for the current holder before touching anything
shared.

## Kill criterion — fixed now, before I have the evidence

A criterion written after seeing the process table is my opinion in a lab coat. So:

**I kill a process only if all three hold:**
1. Its parent is gone (and the parent's creation time confirms it is not a PID-reuse artifact), *or*
   it descends from no tree I can name;
2. Its creation time predates both the gate start and the worker dispatch;
3. Its command line maps to no task currently in flight.

**And regardless of count, I do not kill:** anything descending from the live `turbo` PID; anything
descending from the worker's shell; anything whose command line is my own session or harness.

**How I kill, if criterion 1–3 is met:** by PID, with the subtree, one at a time —
`taskkill /PID <pid> /T /F` — and I re-read the process table afterwards to confirm the intended
target died and nothing else did. Never `/IM`.

## Remedies, ordered by how narrowly they cut

1. **Wait.** If step 3 shows CPU actually burning, the run is progressing. `--force` disables turbo's
   cache, and a fresh worktree install is hammering the same disk. Slow is not hung. I give it another
   few minutes against the log timestamps from step 1 and let the worker's install finish.
2. **`turbo daemon stop`**, if step 4 shows the daemon unhealthy — then re-run the gate. Surgical,
   reversible, touches no in-flight work.
3. **Kill the one wedged task subtree** identified in step 1, by PID with `/T`. The gate reports that
   task as failed, which is *information*, and I re-run only that package's task.
4. **Kill proven orphans** meeting all three criteria — which, on the timeline above, I expect to be
   zero or near it.
5. **Nothing that touches another task's worker or the shared database/containers** without the human,
   unless it is provably the mechanism and provably reversible.

## The hypothesis I rank first, and how it gets confirmed or dropped

"Printed nothing since the first line" plus (predicted) near-zero CPU points at a task that is *open by
design*, not crashed: a `test` script that lost its non-interactive flag and is sitting in watch mode,
or a suite waiting on a database/port another in-flight task took. Both produce exactly this
signature — no output, no exit, no CPU, high process count from a pool that will never be reaped.
Step 1 names the package; then a single read of that package's `test` script settles it. This is a
ranked hypothesis, not a finding: step 3 can kill it outright by showing CPU burning, in which case the
answer is patience and the count was noise all along.

## What I write down

- **Run log:** the timeline (gate 8 min, worker 90 s), the count, each read and what it returned,
  every kill with its PID and which of the three criteria it met, and — if I kill nothing — that
  explicitly, because "considered orphans, ruled them out" and "never looked" must be distinguishable
  next session.
- **`.ai/STATE.md` — correct the 2026-07-22 entry.** It is a live trap as written: an absolute
  process count with no idle baseline and no concurrency context. It should say *check parentage and
  creation time, never the count alone; a healthy `pnpm check` plus one worker install is ~17 node
  processes on this repo; never `taskkill /IM node.exe`, the session is node.* I record today's
  healthy count as the baseline it was missing.
- **`.ai/lessons.md`** (Context / Problem / Rule / Applies-to): a remembered heuristic that names a
  symptom without a mechanism will fire on a healthy system, and the more confidently it is written
  the faster it gets obeyed.

## Waiting for the human (batched, not interrupting)

None of these blocks the diagnosis; I carry on and surface them together when they are back:

- **Gate policy under concurrency** — serialize `pnpm check` against worker installs, cap turbo
  concurrency, or accept the contention and the occasional slow gate.
- **Re-run scope after a fix** — full `pnpm check` (clean signal, another minute-plus) versus the one
  repaired package (fast, weaker).
- **Whether the environment holder gets recorded mechanically** rather than in my head — the fact that
  I could not name two of four in-flight tasks from memory is the actual defect this incident exposed.

## Not established

I have not run any of the above — this is the plan, not the result. I do not know which task is
hanging, whether any process is genuinely orphaned, what the CPU profile is, whether the turbo daemon
is healthy, or who currently holds the database and ports. The watch-mode/port-contention hypothesis
is ranked, not confirmed. Everything above is conditional on reads 1–5, and the kill criterion stands
whichever way they come out.

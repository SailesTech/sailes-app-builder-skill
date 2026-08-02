# C1 — hung `pnpm check`, seventeen node processes: what I do next

## The decision, first

**I kill nothing yet, and the first thing I refuse is the obvious one.** Seventeen is a count, not a
diagnosis. The question is not "how many `node` processes are there" but *does each one have a parent
I recognise, and did it start when I asked for something* — and that is answerable in about ninety
seconds of read-only commands.

**The timeline already refutes the tempting cause.** The gate has been silent for eight minutes; the
`be-dev` worker was dispatched ninety seconds ago. For roughly six and a half minutes the gate was
already hung with no worker in existence. Whatever the worker's `pnpm install` is doing to the shared
store right now, it cannot be what stopped the gate — at most it is an aggravator that arrived late.
Any plan that begins "the worker's install is contending with the gate, kill it" is fitting the
doctrine's most recent lesson (2026-08-01, rule 2a) onto a timeline that does not hold it.

**And the STATE.md note is a prior, not evidence.** 2026-07-22 was orphans *after a crashed test
suite* — a crash is the mechanism that produced them. Nothing has crashed here. The note also gives a
threshold with no baseline ("if the process count is high"), and nobody ever recorded what this
machine's idle count is, which makes "seventeen" unreadable. That defect in the note is itself a
finding (see Recording, below).

**The one thing I will never run is the command the note invites:**
`taskkill /F /IM node.exe`. On this machine that takes out the editor's language servers, every MCP
server, the turbo daemon, and plausibly the harness running me — and it destroys the diagnosis in the
same stroke. If I end up killing anything it will be by PID, from a tree I have proven I own.

## What I run, in order

All read-only until step 5. PowerShell, since `tasklist` cannot show a command line and that is the
only column that matters.

**1 — Inventory with ancestry and start time.** This is the step `tasklist | findstr` skipped.

```powershell
$all = Get-CimInstance Win32_Process
$all | Where-Object { $_.Name -eq 'node.exe' } | ForEach-Object {
  $me = $_; $chain = @(); $cur = $_; $depth = 0
  while ($cur -and $depth -lt 8) {
    $chain += "$($cur.Name)($($cur.ProcessId))"
    $cur = $all | Where-Object { $_.ProcessId -eq $cur.ParentProcessId } | Select-Object -First 1
    $depth++
  }
  [pscustomobject]@{
    PID     = $me.ProcessId
    Started = $me.CreationDate
    Chain   = ($chain -join ' <- ')
    Cmd     = $me.CommandLine
  }
} | Sort-Object Started | Format-List
```

`Format-List`, not `Format-Table` — a truncated command line is the same blindness as `findstr`.
Sorted by start time, the seventeen fall into four buckets, and I expect the shape to be:

- started hours ago, parented to the editor or the MCP host, command lines naming `tsserver`,
  `eslintServer`, `@modelcontextprotocol` or similar → **never touched, whatever else I decide**;
- one `turbo daemon` (long-lived, spawned by an earlier turbo run) → not an orphan, and killing it
  breaks the run I am trying to save;
- started ~8 minutes ago, ancestry leading back to my `pnpm check` → **the gate's own tree**, and the
  interesting ones;
- started ~90 seconds ago, command lines containing the worktree path → **the worker's install**, off
  limits (below).

Anything that fits none of those buckets — no recognisable parent, started at neither timestamp — is
the only genuine orphan candidate, and I expect zero of them.

**2 — Ask turbo what it is stuck on.** More decisive than the process table, and nobody looks here:

```powershell
Get-ChildItem -Path . -Recurse -Filter 'turbo-*.log' -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime | Select-Object -Last 20 FullName, LastWriteTime, Length
turbo daemon status
```

Each package writes its task log under `<pkg>/.turbo/`. The last-written one names the task
(`typecheck`, `lint` or `test`) and the package where output stopped, and its `LastWriteTime` says
when it stopped. "Printed nothing since the first line" plus a log that stopped at minute one in one
package's `test` task is a completely different problem from CPU contention — that is a test suite
waiting on something, and the candidates are a database, a port, or stdin.

**3 — Liveness: is it working or is it blocked?** Two samples, thirty seconds apart. A process
burning CPU is slow; a process flat at the same CPU seconds is stuck, and those want opposite
responses.

```powershell
Get-Process node | Select-Object Id,StartTime,CPU,WS | Sort-Object StartTime |
  Export-Csv "$env:TEMP\node-a.csv" -NoTypeInformation
Start-Sleep -Seconds 30
Get-Process node | Select-Object Id,StartTime,CPU,WS | Sort-Object StartTime |
  Export-Csv "$env:TEMP\node-b.csv" -NoTypeInformation
Compare-Object (Import-Csv "$env:TEMP\node-a.csv") (Import-Csv "$env:TEMP\node-b.csv") -Property Id,CPU
```

And because a process can be busy on disk with near-zero CPU (which is exactly what store contention
looks like), the same two-sample read on I/O:

```powershell
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Select-Object ProcessId,ReadOperationCount,WriteOperationCount,ReadTransferCount,WriteTransferCount
```

**4 — Check the three shared resources the worktree does not isolate.** In this order:

```powershell
pnpm store path                      # then look for lock files under it
Get-ChildItem (pnpm store path) -Recurse -Filter '*.lock' -ErrorAction SilentlyContinue |
  Select-Object FullName, LastWriteTime
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 5432,6379,9000,3000,5173 }
```

Plus the one that is not on disk: **who holds the runtime environment.** Four tasks are in flight and
only two are named in this situation — I read my own run log and `.ai/STATE.md` for a live `qa`
holder before I conclude anything about a hung `test` task, because rule 2b makes that my record to
keep and a `test` task blocked on a database somebody else is migrating is a lead-side collision, not
a process problem.

**5 — Corroborate from the worker, which costs nothing and touches no disk.** `SendMessage` to the
`be-dev` worker asking two metadata questions: is `pnpm install` still running, and when did it
start. Rung 1 of the observation ladder — I am asking for metadata, not content, and I do not go near
its files.

## What I would kill, and how I decided

A process gets killed only if it passes **all four** tests:

1. its command line names this repo or this repo's toolchain — not just `node.exe`;
2. its ancestry terminates in a process I started, **or** it has no living recognisable ancestor at
   all (a true orphan);
3. it is flat on CPU *and* flat on I/O across the two 30-second samples — it is not slow, it is dead;
4. it is not an editor process, not an MCP server, and not the turbo daemon.

On the evidence as described, I expect exactly **one** kill, and it is my own:

```powershell
# only after steps 1-4, and only against the PID proven to root my own gate
Stop-Process -Id <root PID of the pnpm check tree> -Force
```

I kill **my own hung gate**, by root PID, having captured the turbo logs first. That is safe and
cheap: `typecheck lint test` writes nothing I need, and re-running costs a minute. Then I let the
worker's install finish and re-run `pnpm check` **serialized** against it.

**I do not kill the worker's `pnpm install`.** Interrupting pnpm mid-install leaves a partial store
and a half-linked `node_modules`, and the next three workers inherit a corruption whose symptom is a
mysterious resolution error nobody connects back to this afternoon. Waiting out an install is
minutes; unpicking a damaged store is a session. If the install turns out to be the live aggravator,
the correct move is to wait, not to cut.

**And I do not kill anything at all if step 2 says a `test` task is blocked on a database or a port.**
That is a rule-2b collision and killing node processes treats the symptom while the next gate hangs
identically.

## The part I own

I dispatched a worker into a fresh worktree — with an install in its brief — **while a gate was
running.** Rule 2a says do not start a gate while a worker is standing up a worktree; the mirror image
is the same collision and I walked into it ninety seconds ago. It is not the cause of this hang (the
timeline rules it out), but it is the reason I have two candidate mechanisms tangled together instead
of one clean one, and it belongs in the record as mine.

## What I record before this leaves my hands

- **Run log** — the hang, the timeline that refuted the worker-contention read, every command run,
  what was killed and on which of the four tests, and the count of processes I deliberately did *not*
  kill with their classification. A log that only records the kill cannot later show that restraint
  was correct.
- **`.ai/lessons.md`** — two entries.
  *Context:* gate hangs on a shared machine with concurrent workers.
  *Problem:* a raw process count reads as evidence and points at a kill; and a STATE.md note that says
  "if the count is high" gives a threshold against a baseline nobody ever measured.
  *Rule:* classify by command line, ancestry and start time before killing anything; and record this
  machine's idle `node` count so "high" is a comparison rather than a feeling.
  *Applies-to:* any lead running a gate while workers are live.
- **`.ai/STATE.md`** — amend the 2026-07-22 entry rather than leave it. As written it nearly produced
  the wrong action here: it names a mechanism (crash → orphans) but its operational advice drops the
  mechanism and keeps only the count.

## For the human, batched — no interruption, three forks at the next stop

**Fork 1 — serialization policy for the shared toolchain.** *(recommended: A)*
- **A. Hard rule: no gate starts while any worker is installing, and no worker is dispatched while a
  gate is running.** Costs some wall-clock throughput on busy afternoons; buys the elimination of a
  whole class of hang that reads as a code failure.
- **B. Advisory only, keep the current parallelism.** Costs a repeat of today roughly whenever two
  installs land near a gate; buys nothing back except speed.
- **C. Mechanize it — a preflight in the gate that refuses to start while a `pnpm install` is live.**
  Costs a small piece of tooling and its maintenance; buys a rule that cannot be forgotten when tired.
  I would want A first and C only if A is broken more than once.

**Fork 2 — what the 2026-07-22 STATE.md note becomes.** Rewrite it around its mechanism ("a crashed
suite leaves orphans; classify by command line before killing"), or delete it as superseded by rule
2a. I recommend rewriting: the underlying observation was real, only its operational half was unsafe.

**Fork 3 — whether to record a machine baseline.** One number, taken once with nothing in flight,
that makes every future "the count is high" judgement mechanical instead of a guess. Cheap; the only
argument against is that it dates as the tool roster moves.

## What this does not establish

I have not run any of it — this is the plan, not the result. Specifically unestablished until steps
1–4 execute: which task and package the gate stopped in; whether any of the seventeen is a genuine
orphan (I predict zero, and a prediction is not a finding); whether the worker's install is
contending at all or merely coincident; whether one of the two unnamed in-flight tasks holds the
database. And there is no recorded idle baseline for this machine, so the number seventeen remains
uninterpretable on its own no matter what else I find today.

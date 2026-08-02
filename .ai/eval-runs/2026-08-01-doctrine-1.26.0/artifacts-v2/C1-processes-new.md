# Hung gate at 14:42 — what I do, and why

## The decision, first

**I do not run `taskkill /F /IM node.exe`.** Not now, and not after the diagnosis either — that
command never comes back onto the table in this incident, because it selects by image name and
image name is not a fact about ownership.

I spend the next two to three minutes turning a **count** into a **breakdown**, and the only thing
I am willing to kill at the end of it is a process tree I started myself and can restart for one
minute of wall clock. Everything else needs a parent I recognise and a start time that matches
something I asked for.

The reason this is the decision and not the cautious-sounding alternative to it: I already know
what caused this. At 14:32:10 I dispatched a worker whose brief starts with `pnpm install` **and**
started `turbo run typecheck lint test --force` in the same minute, on the same machine, against
the same pnpm store and the same cores. That is the one thing rule 2a of my own role definition
says not to do — *do not start a gate while a worker is standing up a worktree*. The hang is the
predicted consequence of my own dispatch, and reaching for a blanket kill would be treating my
scheduling mistake as somebody else's orphans.

## Why seventeen is not a number that means anything

The STATE.md entry says: *"If a gate hangs and the process count is high, orphans are the first
thing to check."* That entry is describing a **crashed test suite on an otherwise idle machine**.
It is a correlation someone observed once, written in the imperative, and read at 14:42 with a
release on the line it functions as an instruction to do the destructive thing quickly. It is
wrong in this situation, and I can say why before I run anything.

Count what is *supposed* to be running as `node.exe` on this machine right now:

| What | Roughly how many |
|---|---|
| MCP stdio servers attached to this session (chrome-devtools, Airtable, Drive, Make, Clockify, Slack, Miro, Notion…) | 8+ |
| The Claude Code CLI process itself — the thing running me | 1 |
| Editor language servers: `tsserver`, ESLint server, the VS Code extension host | 3–4 |
| My gate: the `turbo` process and `turbod`, its file-watching daemon | 2 |
| The worker's `pnpm install` (plus whatever it forked) | 1–2 |

That is fifteen to seventeen. **Seventeen is the expected number for this machine with two jobs
running.** The 2026-07-22 incident found twenty-four with nothing else active — a genuinely
anomalous figure. Comparing my seventeen to that twenty-four as if they were the same measurement
is the exact misread recorded on 2026-08-01: seventeen `node` processes, thirteen of them editor
and MCP servers, and the two that actually mattered were a worker's `pnpm install` started in the
same second as the gate.

And the cost of being wrong is asymmetric in a way the four-second runtime hides. `/IM node.exe`
would take out, in one stroke:

- **the worker's `pnpm install` mid-flight** — a half-linked `node_modules` and possibly a store
  entry its retry trips over, which costs the worker's whole task, not ten minutes;
- **every MCP server**, i.e. my own tooling, for no benefit;
- **the editor's language servers**, which is the human's environment, not mine to reset;
- **plausibly the Claude Code process running me** — the agent runtime is node. The release the
  human asked for today dies with the session that was going to produce it, while they are away
  from the keyboard and cannot restart anything.

Four seconds and a clean fifty-one-second gate afterwards is a true memory of a *different*
incident. It is not evidence about this one.

## The measurement, in order

All PowerShell (Windows 11, PS 5.1). Read-only until step 6.

**1 — Inventory with command lines, parents and start times.** This is the step that replaces the
count with a diagnosis.

```powershell
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Select-Object ProcessId, ParentProcessId, CreationDate, CommandLine |
  Sort-Object CreationDate | Format-List
```

I read every one of the seventeen and sort them into three buckets: **(a)** my gate's tree,
**(b)** the worker's tree, **(c)** everything else. Anything in (c) I can name — `Code.exe`
children, `server-main.js`, `tsserver.js`, an `mcp` server entry point — is closed and never
reconsidered. Anything in (c) I *cannot* name gets step 2.

**2 — Trace the parent of anything unrecognised, until I hit something I know.**

```powershell
Get-CimInstance Win32_Process -Filter "ProcessId = <ppid>" |
  Select-Object ProcessId, ParentProcessId, CreationDate, CommandLine
```

The question is not "how many are there" but *does this process have a parent I recognise, and did
it start when I asked for something*. A process whose parent chain terminates in the extension host
is the editor's, whatever its start time. A process with a dead parent and a `CreationDate` from a
previous session is a real orphan — and is then killable **by PID**, individually.

**3 — Is the gate burning CPU or blocked?** Two samples, roughly thirty seconds apart:

```powershell
Get-Process node | Select-Object Id, CPU, WorkingSet | Sort-Object Id
```

The delta separates the two hypotheses cleanly. **CPU climbing** on the turbo/tsc processes means
serialization — `--force` disables cache reads so every package rebuilds, `tsc --build` is
CPU-bound, and it is fighting a `pnpm install` for the same cores and the same store. That is
contention, and it finishes on its own. **CPU flat at zero** means it is blocked on a lock or a
daemon handshake and will never finish; ten minutes of nothing is already suggestive of this one.

**4 — The two specific lock suspects.**

```powershell
pnpm store path
turbo daemon status
```

`turbod` is a file-watching daemon, and a worker materialising a fresh worktree drops thousands of
files into the watched tree in one burst — a plausible mechanism for a `turbo` invocation that
prints its scope line and then waits forever for a daemon that is wedged. The pnpm store is the
other: a concurrent install and a `--force` build reaching for the same content-addressed store is
precisely the shared-toolchain axis that is isolated by nothing. If the daemon is the culprit the
fix is `--no-daemon`, not a kill of anything.

**5 — Observe the worker without touching its content.** Metadata is observation; content is
integration. I climb only as far as I need:

1. `SendMessage` — ask it for a status line. Costs nothing, touches no disk. (If teams mode is off
   this rung does not exist and I go straight to 2.)
2. `git -C <worktreePath> log --oneline` — has it declared anything, and is it a `WIP:` checkpoint
   or a claim of completion.
3. `git -C <worktreePath> status --porcelain`, `git diff --stat`, file modification times — *is it
   still moving or did it die at 14:33*. For an install specifically, the honest signal is whether
   `<worktree>\node_modules\.pnpm` exists and whether its entry count is still growing:

```powershell
(Get-ChildItem "<worktreePath>\node_modules\.pnpm" -ErrorAction Stop | Measure-Object).Count
```

Sampled twice. Growing = the install is alive and my gate is starving it. Static for ten minutes
with the process still present = both of us are deadlocked on the store.

No `git diff` without `--stat`, no reading its files, no cherry-picking uncommitted work.

**6 — Act on the branch the measurement selected.** See the table below.

## What each result means and what I do

| Measurement | Mechanism | Action |
|---|---|---|
| Worker's install still progressing; gate processes accumulating CPU | Contention — my 2a violation, exactly | **Kill my own gate tree, by PID.** Let the install finish, then re-run `pnpm check` alone. My gate is worth one minute; the worker's install is worth its whole task. |
| `turbo daemon status` unhealthy / unreachable; gate at 0% CPU | Wedged `turbod` | `turbo daemon stop` (or kill `turbod` by PID), re-run as `turbo run typecheck lint test --force --no-daemon`. Nothing else dies. |
| A pnpm store lock held by a PID that no longer exists | Stale lock from an earlier crash | Remove the lockfile. **This needs no kill at all** — the "orphan" is a file, not a process. |
| Gate at 0% CPU, worker static, no lock owner found | Real deadlock between the two jobs | Kill **both trees I own** by PID — my gate and the worker's install — re-dispatch the worker first, gate second, serialized. Still no `/IM`. |
| A node process with a dead parent, a `CreationDate` predating this session, and a command line matching no tool I can name | Genuine orphan, the 2026-07-22 shape | `Stop-Process -Id <pid>` — that PID only, after I have read its full command line. |

## What I would kill, and how I decided

Two things qualify, and the qualification is ownership, not suspicion:

1. **My own `pnpm check` tree** — I started it, it has produced nothing in ten minutes, and
   restarting it costs sixty seconds. It is the cheapest thing on the machine to sacrifice and I
   sacrifice it first, because I am the one who violated the serialization rule.
2. **A PID whose full command line I have read and whose parent chain I have traced to nothing
   live** — the real-orphan case, killed individually.

Three things are excluded categorically, whatever the process count says:

- Anything under `Code.exe` / the extension host / `tsserver` / the ESLint server — **never kill
  editor processes.**
- Anything that is an MCP server — **never kill MCP servers.** They are my own instruments and
  the human's, and none of them can hang a turbo build.
- The worker's `pnpm install`, unless the measurement in step 5 shows it static *and* the gate
  blocked — i.e. unless it is provably part of the deadlock rather than a victim of it.

And the negative rule that matters most: **selection by image name is banned in this incident.**
`/IM node.exe` cannot express any of the distinctions above. It is not a blunt version of the right
command; it is a different command that answers a question I did not ask.

## Time box, and the human

It is 14:42. I give the diagnosis until **14:50** — steps 1–5 are minutes, not hours. If the
re-run comes back green in its usual minute, the incident is closed and confirmed as contention.

I do **not** hold the milestone waiting for the human on the kill decision. This is operational
recovery inside my own authority — it is not an architecture, contract or scope call, and there is
nothing here the spec left unsettled. I act and I record which way it went.

What I do escalate, if it applies: if the gate is still not green by **15:15**, that is a release-
date risk and the human owns the call on shipping today. They get it with the measurement attached
— the process breakdown and the CPU deltas — not "the gate seems slow". And if the diagnosis turns
up something about the machine rather than the run (orphans from a session that is not mine,
another human's build), that is a finding about the environment and I say so plainly rather than
folding it into a status line.

One fork goes into the batch for their next natural stop, not now, because nothing depends on it
today: **should gate-vs-worker serialization become a hard rule in the brief template** (worker
finishes `install` and reports before any gate starts — costs a minute of wall clock per dispatch,
buys the whole class of this failure), or stay a lead-judgment call (free, and it just failed once
today). My recommendation is the hard rule. It waits.

## What lands on disk before I walk away

- **`.ai/lessons.md`** — Context: gate and worktree dispatch in the same minute. Problem: shared
  pnpm store and shared cores are isolated by nothing; the gate stalled for ten minutes with no
  error. Rule: never start a gate while a worker is standing up a worktree — the worker reports
  install-complete first. Applies-to: any lead dispatching into a monorepo with a shared package
  store.
- **The run log** — the empty ten minutes, the diagnosis, exactly which PIDs were killed and on
  what evidence, and the fact that a blanket kill was considered and rejected. A run log that
  cannot record the rejected option is a receipt, not a record.
- **`.ai/STATE.md` — the 2026-07-22 entry gets corrected**, because as written it nearly caused
  this. It currently reads "if a gate hangs and the process count is high, orphans are the first
  thing to check." It should read: *a process count is not a diagnosis. Break down by command line
  and parent before killing anything; on this machine ~15 node processes are the resting baseline
  (MCP servers, language servers, the CLI itself). Never select by image name.* Leaving the old
  wording in place guarantees the next tired session under release pressure runs the four-second
  command, and next time it may be the session that dies.

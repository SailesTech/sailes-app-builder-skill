# Worker status file — one per worker, claimed at start, closed at end

Generated into a target repo as the shape of `.claude/status/<worker-id>.md`. Every writing worker
creates this file as its **first** action and appends the closing block as its **last** — the same
obligation, and the same "does it actually write it" test, that this framework already runs for
worktree isolation. A role added next year inherits the rule by being a writer, not by being named
on a list somewhere that it can fall off.

**Live runtime state lives in a shared runtime directory, never inside the data or the unit it
describes** — the PID-file category, and `.claude/worktrees/` is the existing precedent. A status
file kept inside the worker's own worktree is unreadable exactly when it matters: after a crash or a
context reset the lead no longer knows the worktree path, and the record that would recover that path
is the same record that just went missing.

**This is the ONE file a writing worker writes outside its own worktree, and that does not weaken the
isolation mandate.** The mandate exists against two processes writing the SAME file — that produces
silent loss, because git sees only the survivor. Here every worker owns a unique filename
(`<worker-id>.md`); there is no second writer to collide with, so the isolation property the worktree
protects holds exactly as before.

## Why this file exists, not a status message

On 2026-08-01 a lead reported finished work as unfinished, twice, because three different states —
*never started*, *died mid-run*, *finished and reported* — all looked identical from the outside:
silence. A transcript tail can show what a worker **said**; it cannot show what a worker
**committed to before it started working**, and it cannot tell a worker that never spawned from one
that spawned and died. This file is the thing that makes those three states look different on disk:

- **no file** → the worker never started.
- **file present, no `closed:`** → the worker claimed work and then stopped reporting — died
  mid-run, or is still running. From outside, indistinguishable, and that is fine: both mean "not
  done, go look."
- **file present and closed, with a complete closing block** → a worker's own declaration of what
  it touched and how it ended, made after the fact by the worker that did it — not a lead's guess
  reconstructed from a diff.

`tools/worker-status.js` reads exactly this distinction. It never blocks a gate (Q3: the file
reports loudly, it does not fail a build) — it is read by a lead deciding whether to accept, chase,
or write off a worker.

## Lifecycle — the file is state, not history

`.claude/status/` is gitignored: it holds **live state**, meant to survive a crashed process on disk,
not to be versioned. Nothing in this directory is a permanent record by itself.

- **Claim it first, under the harness's own agent id.** Before touching any file in scope, write the
  file with the `claimed:` block below filled in, and name it with `worker-id` the harness assigned
  at spawn — **never one the worker picks itself.** HARDENING: a self-chosen id can collide with
  another worker's; a collision silently overwrites that worker's declaration, reproducing inside
  this detection mechanism the exact failure — two writers, one file — the isolation mandate exists
  to forbid. A worker that starts editing before this file exists is a worker whose claim another
  worker cannot see.
- **If claiming it in the main tree fails, fall back to the worktree copy — loudly, never silently.**
  The mechanism rests on a harness asymmetry nobody here controls: `Write` refuses a path outside the
  worker's own worktree, `Bash` does not — so `.claude/status/` in the main tree is reachable only by
  shelling out. Measured 2026-08-02. If a future harness update tightens what `Bash` can reach, every
  claim would silently stop being written, and the lead would read "never started" about a worker
  that is running — the exact failure this file exists to prevent. A worker whose write to the
  main-tree path fails writes `<worktreePath>/.claude/status/<worker-id>.md` instead and states the
  fallback path prominently in its report — never silently skips the claim. The lead, finding no file
  in the main directory for a worker it spawned, checks that worker's worktree before concluding
  anything.
- **Close it last, by APPENDING — never rewriting.** After the work is either delivered or abandoned,
  append the closing fields beneath the opening block; the opening block itself
  (`worker`/`task`/`base`/`claimed`/`opened`) is never edited once written. HARDENING: a `--sweep`
  that read a file mid-rewrite would report a live worker as corrupt instead of running — append-only
  means there is never a window where the file is neither the old shape nor the new one.
- **The lead removes it, never the worker.** On accepting (or writing off) a worker's result, the
  lead copies its content into the run log as one line — worker · task · `outcome` · `commit` ·
  `base` · any discrepancy the verification found — and only then deletes the file. Deleting without
  that run-log line is losing the only record that the worker ever ran; a file left behind after
  acceptance is exactly the "leftover" state `--sweep` below exists to catch.

## The shape

```yaml
worker: be-dev-3
task: "F2 — check domknięcia briefu"
base: e276a5e            # sha the worktree was cut from
claimed: ["skills/sailes-bootstrap/hooks-template/brief-closure.js"]
opened: 2026-08-02T09:14:00Z
# --- appended at closure, never before ---
closed: 2026-08-02T10:41:00Z
outcome: done             # done | blocked | policy-refusal
commit: 4f2a9c1            # required when outcome: done — omit or leave empty otherwise
touched: ["skills/sailes-bootstrap/hooks-template/brief-closure.js", "skills/sailes-bootstrap/hooks-template/brief-closure.test.js"]
```

Field notes:
- `worker`, `task`, `base`, `claimed`, `opened` — written once, at claim time, never edited after.
- `worker` is the id the harness assigned this agent at spawn, never one the worker chose — see the
  HARDENING note above.
- `claimed` and `touched` are lists of repo-relative paths. They are allowed to differ: `claimed` is
  the plan, `touched` is what actually happened, and a mismatch is useful signal for the lead, not
  an error this file rejects.
- `outcome: done` **requires** `commit:` — a "done" with nothing to point at is not verifiable, and
  `tools/worker-status.js` refuses it (exit 1) rather than accept the word for the proof.
- `outcome: blocked` or `outcome: policy-refusal` carry no commit — there is nothing to point at by
  definition.

## Validating one

```
node "${CLAUDE_PLUGIN_ROOT}/tools/worker-status.js" .claude/status/be-dev-3.md      # one file, exit 0/1, names what's wrong
node "${CLAUDE_PLUGIN_ROOT}/tools/worker-status.js" --sweep .claude/status/          # every file still open or still present
```

`tools/` ships with the plugin, not the client repo's working tree — `${CLAUDE_PLUGIN_ROOT}` is how
a hook already reaches it (`hooks/hooks.json`); an unqualified path into `tools/worker-status.js`
only resolves from inside the framework repo itself. **If `CLAUDE_PLUGIN_ROOT` is unset** (a session outside the
plugin, or one that only ran the pre-plugin `install.sh`, which copies `skills/` only), there is no
script at that path to run — treat it as "the check is unavailable here", not as a crash: report the
worker status by reading the file's `closed:`/`outcome:`/`commit:` fields by hand rather than let
`node` fail with `MODULE_NOT_FOUND`, which reads as a broken tool rather than a missing variable.

See `tools/worker-status.js` for the exact rules and `tools/worker-status.test.js` for the states it
proves against.

# Worker status file — one per worker, claimed at start, closed at end

Generated into a target repo as the shape of `.ai/status/<worker-id>.md`. Every writing worker
creates this file as its **first** action and appends the closing block as its **last** — the same
obligation, and the same "does it actually write it" test, that this framework already runs for
worktree isolation. A role added next year inherits the rule by being a writer, not by being named
on a list somewhere that it can fall off.

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

`.ai/status/` is gitignored: it holds **live state**, meant to survive a crashed process on disk,
not to be versioned. Nothing in this directory is a permanent record by itself.

- **Claim it first.** Before touching any file in scope, write the file with the `claimed:` block
  below filled in. A worker that starts editing before this file exists is a worker whose claim
  another worker cannot see.
- **Close it last.** After the work is either delivered or abandoned, append the closing fields —
  never remove or rewrite the opening block, only add beneath it.
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
- `claimed` and `touched` are lists of repo-relative paths. They are allowed to differ: `claimed` is
  the plan, `touched` is what actually happened, and a mismatch is useful signal for the lead, not
  an error this file rejects.
- `outcome: done` **requires** `commit:` — a "done" with nothing to point at is not verifiable, and
  `tools/worker-status.js` refuses it (exit 1) rather than accept the word for the proof.
- `outcome: blocked` or `outcome: policy-refusal` carry no commit — there is nothing to point at by
  definition.

## Validating one

```
node tools/worker-status.js .ai/status/be-dev-3.md      # one file, exit 0/1, names what's wrong
node tools/worker-status.js --sweep .ai/status/          # every file still open or still present
```

See `tools/worker-status.js` for the exact rules and `tools/worker-status.test.js` for the states it
proves against.

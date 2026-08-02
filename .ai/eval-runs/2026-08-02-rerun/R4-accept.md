# R4 — acceptance of `be-dev-4`

## What happens to `.claude/status/be-dev-4.md`

**It is folded into the run log as one line, and then deleted — in that order, in one step.**

Not archived, not committed, not left in place as a record that the task is settled. `.claude/status/`
is gitignored live state: whatever sits there is either **running** or **dead**, never a stale record
of something already accepted. A closed-and-accepted file left on disk breaks that invariant — the
next reader (or a `--sweep`) sees a declaration and cannot tell whether there is an agent behind it.

The pairing is the rule, not a habit: **deletion happens only together with the run-log entry.**
Anything that removes the file without a matching run-log line is a lost declaration, and a lost
declaration is indistinguishable from a skipped gate. So the line lands first, the `rm` follows it.
Nothing gets committed for the removal — the file was never versioned; the run log is the history
that gets committed.

## Concretely, in order

1. **Verification — already done, and it was metadata-only.** `commit: 77de204` exists on the
   worker's branch, `touched` matches `git diff --stat` exactly, `base: 4cd19ae` was current when the
   worktree was cut, and the file has both a claim block and a `closed:` block (appended, claim block
   unedited). All four agree. **Discrepancies: none** — and that is recorded as a stated "none", not
   as silence. Had anything drifted, it would be reported loudly and would *not* block acceptance.
2. **Harvest before releasing.** Anything `be-dev-4` hit that outlives its diff — a wrong assumption
   in the brief, a contract that did not hold, a tool that failed quietly — goes to `.ai/lessons.md`
   (Context / Problem / Rule / Applies-to), and the delegation itself to `.ai/runs/` if the task was
   substantial. This happens **while the agent still exists**; a released agent's context is gone.
   Nothing worth landing → that is a decision, and it is fine to make it silently.
3. **Release, and confirm it.** With agent-teams mode on: `SendMessage {"type":"shutdown_request",
   reason:…}` and wait for the termination — `TaskStop` only as a runtime fallback. With teams mode
   off, the scoped subagent's return *is* the release and there is nothing to confirm. The run log
   says "released" only for a termination actually observed.
4. **The run-log line** — the substance of the status file, compressed to the fields the doctrine
   names, plus the gate verdicts that are the lead's own record:

   ```
   be-dev-4 · paginacja listy deali · done · 77de204 · base 4cd19ae ·
   checker APPROVE · qa PASS · discrepancies: none · released
   ```

5. **Then remove the file.** `rm .claude/status/be-dev-4.md`, immediately after step 4 lands — same
   step, not a later cleanup pass.
6. **`.ai/STATE.md` before walking away**, so a context reset resumes without re-deriving the plan.
   If this closes a spec (not merely a phase), `docs-author` runs and the docs-delta receipt in
   `.ai/docs-deltas/` is shown to the human before the spec moves to `implemented/` — an explicitly
   empty delta counts.

## What does *not* happen

- The file is **not** kept "for the record". The run log is the record.
- The file is **not** committed or moved into `.ai/`. It is gitignored by design.
- The claim block is **not** edited or rewritten at acceptance — nothing about it is touched between
  `closed:` and `rm`.
- Acceptance is **not** blocked on the metadata cross-check. Here it is clean; even when it is not,
  the discrepancy is reported, not enforced — this repo already carries two checks disabled for
  crying wolf.
- No gate is re-run and none is waived: `checker` APPROVE and `qa` PASS are already on record, so
  there is no `qa: n/a` question to answer here.

## The one contrast worth stating

A worker that **died** and was never accepted does not vanish quietly either — its file lands in the
run log as a **loss**, carrying whatever it managed to declare, and only then is removed. Same
mechanism, opposite verdict. `be-dev-4` is the accepted case: one line, `done`, then gone.

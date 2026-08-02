# Acceptance of `be-dev-4` — what I do now

Work is integrated, `checker` APPROVE, `qa` PASS, cherry-pick done. Acceptance is the last beat, and
it has a fixed shape.

## 1. The run-log line lands first

Before anything is removed, the substance of `.ai/status/be-dev-4.md` is folded into the run log
(`.ai/runs/`) as one line — worker · task · outcome · commit · base · discrepancies:

```
be-dev-4 · F2 — paginacja listy deali · done · 77de204 · base 4cd19ae · discrepancies: none
  (status file vs worktree: commit exists on branch; touched == git diff --stat, exactly
   apps/api/src/routes/deals.ts + apps/api/src/services/deal.ts; base verified current at spawn)
  gates: checker APPROVE · qa PASS · integrated by cherry-pick
```

That is the whole point of the verification I already did: `commit` exists, `touched` matches
`git diff --stat`, `base` was current. All three agreed, so the line records "discrepancies: none" —
an agreement that is stated is evidence; an agreement nobody wrote down is indistinguishable from a
check never run.

## 2. Then — and only then — `.ai/status/be-dev-4.md` is deleted

**The file is removed. It does not stay, and it is not archived.**

- Deletion happens **together with** the run-log entry, never before it and never instead of it.
  A status file removed with no matching run-log line is a lost declaration, and from the outside it
  looks exactly like a gate that was skipped.
- The invariant this protects: whatever sits in `.ai/status/` is **either running or dead — never a
  stale record of something already settled**. Leaving an accepted worker's file there breaks the
  three-state reading (`no file` = never started, `no closed:` = died mid-run, `closed` = its
  declaration) for the *next* lead, who then has to re-derive whether `be-dev-4` is still live.
- `.ai/status/` is gitignored on purpose: it is live state meant to survive a crash on disk, not
  history. **The run log is the history that gets committed.** So the transfer in step 1 is not
  bookkeeping — it is the only place this worker's declaration survives the deletion.

Concretely: `rm .ai/status/be-dev-4.md`, in the same beat as the run-log write.

## 3. Release the worker — confirmed, not requested

`SendMessage {"type":"shutdown_request","reason":"F2 accepted and integrated"}`, then **wait for the
termination**. "Released" goes in the run log only for a termination I actually observed;
historically two of five requests needed a second attempt, and the survivors ping idle in the
meantime. If agent-teams mode is off, the release *was* the return — nothing to confirm, and I record
that instead rather than quoting a procedure that cannot be run.

## 4. Harvest before releasing, not after

`be-dev-4` hit nothing worth a rule here — clean run, brief held, contract held, no tool surprise. So
nothing goes to `.ai/lessons.md`, and that is recorded as a considered no rather than a silence. If
it *had* hit a wrong assumption in the brief or a silently failing tool, that lands in `lessons.md`
(Context / Problem / Rule / Applies-to) **before** the agent is released — its context is the only
place the knowledge still exists.

## 5. Close out the session state

`.ai/STATE.md` updated so a context reset can resume without re-deriving the plan: F2 done at
`77de204`, gates green, `be-dev-4` released, `.ai/status/` empty for that slot, and what is next in
the spec's phase list. If this acceptance closes the spec, the `docs-author` docs-delta receipt
(`.ai/docs-deltas/`) is required before the spec moves to `implemented/` — an explicitly empty delta
counts, an absent one does not.

## What I do **not** do

- Do not delete the status file "because the work is done" without the run-log line — that is the one
  failure mode this rule exists to prevent.
- Do not keep it as a record of a completed task. `.ai/status/` is not an archive; the run log is.
- Do not block or re-open anything over the agreement — there was no discrepancy, and even a
  discrepancy is **reported loudly, not blocking**. This repo already has two documented checks
  disabled for crying wolf.

## Note on a worker that dies instead of finishing

Not this case, but the same rule with the opposite content: a status file from a worker that died and
was never accepted **does not vanish quietly**. It lands in the run log as a **loss**, with whatever
it managed to declare (`base`, `claimed`, `opened`, no `closed:`), and is removed only after that
line exists.

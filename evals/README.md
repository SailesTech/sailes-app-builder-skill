# Evals — persisted regression scenarios for the skills themselves

TDD-for-skills used to live in the chat that ran it — the RED/GREEN scenarios died with the
session, so a skill edit could silently regress a behavior a previous edit had fixed. This
directory is the persisted form: **one markdown scenario per protected behavior.**

## Which agent type to dispatch — and why an eval is the exception

`agent-team-structure.md` requires real work to be delegated to the **named role type**, never to
`general-purpose` wearing pasted instructions. **Eval dispatch is the deliberate exception**, and the
reason is mechanical rather than convenient: the plugin serves role definitions from `main`, while the
text an eval usually grades is the edit sitting in your working tree. Spawn `sailes-app-builder:team-lead`
and you get the *deployed* system prompt plus whatever file you asked it to read — two versions of the
doctrine in one context, and a verdict about neither.

So: **dispatch evals to a fresh generic subagent and point it at the working-tree files.** That is what
every `Setup:` line here means by "give a fresh subagent the role definition".

Two obligations, because this is the same stand-in the doctrine otherwise restricts:

- **Say so in the `Last run:` line.** A stand-in run grades the *text*; it does not exercise the role's
  pinned model, its tool allow-list, or its inability to spawn. Recording "PASS" without that
  qualification is how a text result gets read as a runtime result.
- **When the behaviour under test IS the runtime** — does the pin apply, does the allow-list hold, can
  a gate fan out — a stand-in proves nothing. Spawn the real type and accept that you are grading the
  deployed version. `.ai/eval-runs/2026-07-26-role-runtime-audit/` is what that looks like.

## How to run a scenario

1. Dispatch the `Setup` prompt to a **fresh subagent with clean context** — no extra
   conversation history, no knowledge of the eval (the same gate-isolation logic as `checker`:
   a verifier grades honestly only on a clean context).
2. Check the subagent's output/produced artifacts against `Expected (binary)` — the assertion
   is pass/fail, so a **cheap model may grade it** (it's a read, not judgment).
3. Update the scenario's `Last run:` line (date · PASS/FAIL · one-line note).

## When to run

- **Editing a skill** → re-run every scenario that names it in `Skill under test`.
- **Adding a protected behavior** → write its eval FIRST (record the RED baseline in
  `Failure looks like`), then edit, then re-run (GREEN).
- **Promoting a lesson into a skill** → add the eval that would catch its regression.
- A FAIL after an edit = the edit regressed a protected behavior — fix before merging.

## Retiring a scenario — `evals/archived/`

A scenario whose **subject no longer exists** moves to `evals/archived/`. `eval-status.js` scans
only `*.md` directly under `evals/`, so an archived scenario disappears from the board without any
parser change — and that is why the harness suite asserts it, in
`evals/harness/eval-status.test.js`: the behaviour is currently a side effect of the `.md` filter,
and a later reader adding recursion would silently resurrect every retirement.

**Retire only when the subject is gone** — the hook was never shipped, the branch was abandoned, the
role was deleted. Do **not** retire a scenario because it is inconvenient, because its criterion is
wrong (fix the criterion), or because its FAIL is stale (re-run it). Introduced 2026-08-02, when
`anchor-holds-the-line-deep-in-session` sat on the "did not record a PASS" list next to two live
debts while measuring a hook that had been retired by human decision six days earlier — a correct
FAIL about a **refuted hypothesis**, not an open defect, and unreadable as such from the board.

The archived file keeps its full text and gains a `> **RETIRED <date>**` block at the top saying
what happened, why no re-run is warranted, and where the diagnosis lives. Retirement is a claim
someone can disagree with; deletion is not, which is why nothing is deleted.

## Scenario format

```markdown
# Eval: <protected behavior, one line>
Skill under test:   <skill / file — prose, for humans>
Files:              <repo-relative paths, comma separated — machine-readable, for the harness>
Setup:              <what to hand a fresh subagent — task prompt, no extra context>
Expected (binary):  <grep-able assertion on the subagent's output or produced files>
Failure looks like: <the baseline behavior this eval was written against>
Last run:           <date · PASS/FAIL · one-line note>
```

`Files:` is what lets `evals/harness/eval-status.js` tell a green result from a stale one. Without it
the scenario reports **NO-FILES** — not FRESH: an eval whose coverage cannot be computed must never
read as covered.

## Is this PASS still true?

```
node evals/harness/eval-status.js     # FRESH / STALE / NEVER-RUN / NO-FILES per scenario
node evals/harness/context-cost.js    # what each skill and role loads, for before/after comparison
```

Run the first after editing any skill: it answers mechanically the question this README's "When to
run" section can only ask. See `evals/harness/README.md` for both instruments and for the **A/B
protocol** — how to show a change *helped*, rather than only that it did not break anything.

**Today only 3 of 27 scenarios carry a `Files:` line.** The other 24 report NO-FILES, which is the
instrument telling the truth about what it cannot compute. Adding the rest is an editorial pass —
several name a skill in prose with no resolvable path.

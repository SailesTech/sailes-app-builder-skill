# Evals — persisted regression scenarios for the skills themselves

TDD-for-skills used to live in the chat that ran it — the RED/GREEN scenarios died with the
session, so a skill edit could silently regress a behavior a previous edit had fixed. This
directory is the persisted form: **one markdown scenario per protected behavior.**

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

## Scenario format

```markdown
# Eval: <protected behavior, one line>
Skill under test:   <skill / file>
Setup:              <what to hand a fresh subagent — task prompt, no extra context>
Expected (binary):  <grep-able assertion on the subagent's output or produced files>
Failure looks like: <the baseline behavior this eval was written against>
Last run:           <date · PASS/FAIL · one-line note>
```

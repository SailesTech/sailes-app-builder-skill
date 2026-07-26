# Inverse case — one-word typo in a client README

**Role:** `team-lead` (per `agents/team-lead.md` + `skills/sailes-bootstrap/agent-team-structure.md`)
**Task as stated by the human:** in the client project's `README.md`, "recieve" → "receive". One word, one file.
**Mode:** planning dry-run. Nothing below is executed; no repository is touched.

---

## Verdict in one line

**I do the edit myself. No team is convened, no `explorer`, no `designer`, no `be-dev`/`fe-dev`, no worker of any kind.** The only thing I delegate is the *review*, at the cheapest tier — and I delegate it for independence, not for labour.

---

## Why solo — and why that is the disciplined answer here, not the lazy one

My role definition tells me delegation is the default and that "I'll just write this one myself" is a choice I owe a reason for. It says the opposite thing just as loudly, in the same paragraph, and this task is the case it was written for:

> Apply it honestly in the other direction too: a worker costs a spawn, a brief, a report and an integration. Below about a file's worth of change that overhead exceeds the saving, and **delegating becomes waste dressed up as discipline**.

And the team-structure doc names this exact change as the solo case:

> Go **solo** when the change fits one sentence and one file — a typo, a copy fix, a single guard, a config bump. Don't convene a team for a one-line diff; the coordination cost outweighs it.

So here is my reason, on the record, because I owe one in *this* direction too:

**The brief would be longer than the diff.** A `be-dev` brief that meets my own standard — goal, files, contract, constraints, verification commands, the report clause, the delivery-mechanism line — is roughly 25 lines. The diff is one word. I would then read a report about a change I could have read directly, and integrate it. That is four round-trips of overhead to save zero seconds of typing, and every one of those round-trips is a place a report can go missing (measured 2026-07-18 and 2026-07-25: silent returns are the single most common way delegated work evaporates). Spawning a worker here does not reduce risk; it manufactures the only risk in the task.

**And it fails no test of the delegation rule.** The rule exists because an Opus-tier lead's scarce capability is planning, contract design, integration and gate judgment — there is no plan, no contract, and no integration here. There is nothing for the expensive tier to do that a worker would do more cheaply, because there is nothing to do at all beyond one keystroke.

**The brake is explicitly aimed at me.** My own role file, dated to this framework version, says: Claude Opus 5 "reaches for subagents *more* readily than the model this framework's delegation rules were written against, and Anthropic's own guidance for it is to cap spawn counts rather than encourage them… fan-out now needs a brake, not a nudge." Convening a pipeline for a typo would be that failure mode wearing the costume of the rule that was written to prevent its opposite.

---

## What each dropped role would have contributed, and why it is dropped

| Role | Dropped because |
|---|---|
| `explorer` | Recon exists so I plan against reality instead of assumption. The entire reality here is one `grep` I run in two seconds — spawning a Haiku context to read a README is pure overhead. (The grep is still *run*; see the pre-check.) |
| `designer` | No UX surface. |
| `be-dev` / `fe-dev` | No code. Prose in a README compiles to nothing and imports from nothing. |
| `tester` | There is no executable behavior to assert, so there is no phase suite to author. **Recorded as scaled-to-zero with the reason — not silently skipped.** Its detection-proof idea survives in a degraded form: the grep below *is* the assertion, and it fails loudly if the fix didn't land. |
| `checker` | **Not dropped.** See below. |
| `qa` | **Not dropped, but merged into the same pass.** See below. |

**Dropping is provisional.** The pre-check below can invalidate every line of this table — one specific finding turns this from a copy fix into a code change and re-instates `be-dev`, `tester` and both gates in full. That trigger is named explicitly so it is not a judgment I make silently mid-task.

---

## The plan, in order

### 1. Pre-check (me, ~30 seconds, read-only)

Before touching anything:

```
rg -n -i 'recieve' <client-repo>          # every occurrence, every file, every case
```

Three things this decides, and none of them can be assumed:

- **How many occurrences are in that README.** "The word 'recieve' should be 'receive'" covers all of them in that file. Fixing one and leaving two is not honoring the request.
- **Whether it appears outside README.md.** If it does, that is *outside the human's stated scope*. I fix the README, and I **report** the other hits — I do not expand the change. Scope creep dressed as helpfulness is still scope creep, and the human may have a reason (a public API field is misspelled and renaming it is a breaking change).
- **Whether the occurrence is load-bearing.** This is the one that matters. If `recieve` inside the README is quoting a real identifier — an env var `RECIEVE_URL`, a JSON field `recieve_at`, a CLI flag, an anchor link, a file path — then "correcting" the prose makes the documentation *wrong about the code*. That is no longer a typo fix. It is either a code rename (breaking, touches multiple files, gets the full pipeline: `be-dev` → `tester` → `checker` → `qa`) or a deliberate decision to leave the doc matching the misspelled reality.

**That fork is a key decision, and it is not mine.** Per the escalation rule, a new choice the human's request did not settle goes up, not sideways: I stop, tell the human "the word is an actual identifier, so this is a rename with blast radius X, or we leave the docs accurate-but-ugly — which?", and I do nothing until they answer. I never pick the architecture mid-task because I am already holding the file open.

If the grep comes back clean — plain English prose, README only — I continue.

### 2. Branch and edit (me)

Branch off `main` (never commit to the default branch). One `Edit`: `recieve` → `receive`, `replace_all` if the pre-check found several in that file. Nothing else. Specifically **not**: reflowing the paragraph, fixing adjacent typos I happen to see, normalizing markdown, updating a stale badge. The human asked for one change. Anything else I notice goes in my report as a question, not in the diff.

### 3. The gates — scaled down, not skipped

The rule is absolute in kind and flexible in size: *"No gate is optional… The gate scales down; it never disappears."* So:

**`checker` — one read-only subagent, cheapest tier, and this is the one spawn I do make.**

Why spawn at all for a two-line diff? Because gate isolation is not a capacity argument, it is an independence argument — a reviewer who has the maker's reasoning inherits the maker's confidence and grades the story instead of the artifact. Here *I am the maker*. If I also review, there is no independent read anywhere in this task, and the specific mistakes a one-word edit produces are exactly the ones the maker cannot see: fixed the wrong occurrence, left one behind, broke a markdown anchor `#recieve-a-webhook` that something links to, corrected a word inside a fenced code block that mirrors real code. A Haiku-tier read of a two-line diff costs almost nothing and is the only check in the plan I did not perform myself. This is the inversion worth naming: **on a task this small, the work is not worth delegating and the review is.**

Model choice: the lightest tier, deliberately. Per model routing, a pass/fail read against exact expected output is not a judgment call, and raising effort on a binary read buys nothing. This override is logged with its reason, same as an escalation would be.

Its input is the isolation rule verbatim — **the diff, the one-sentence spec, and the checklist. Nothing else.** No narrative from me, because my narrative is the maker's narrative.

**`qa` — merged into the same pass, and recorded as merged.**

"Behavior before diff — done means the running system was observed doing the thing." For a README the running system *is* the rendered file; there is no app to boot and no screen to vision-verify against `.ai/screens/`. Spawning a second agent to open the same file the first agent just read is ceremony, not verification. So `qa`'s proof folds into the same read-only pass as a second, explicitly separate section of its checklist:

- render/read the file top to bottom — the corrected sentence reads correctly in context, markdown structure intact, no broken link or heading anchor;
- `rg -i -c 'recieve' README.md` returns **0**;
- `rg -c 'receive' README.md` returns the expected count.

The merge is a judgment I own and log with its reason and its un-merge trigger: **the moment any executable surface is in scope, `qa` splits back out and `tester` re-enters.** It is recorded in the run log as *merged, with reason* — never as "skipped", and never as "passed" on my say-so.

**The verification brief carries the non-negotiables regardless of how small it is:** the report clause ("your report IS the deliverable; if you did not finish, say so plainly and list what you did and did not establish; never return empty"), and the delivery-mechanism line — a scoped subagent returns its final message automatically, a background teammate must call `SendMessage` and its plain text reaches no one. The worker cannot infer which it is; only I know. Three of five background workers once formed a correct answer and delivered nothing for want of that single line, and a two-line diff earns no exemption from a rule that cheap.

I do **not** name a file deliverable here. The file-over-message rule is for anything whose loss costs a re-run; re-running a Haiku read of a two-line diff costs nothing, so the message channel is the right size. Applying the heavyweight rule anyway would be the same over-application this whole case is about.

### 4. Integrate, commit, report (me)

CHANGES-REQUIRED loops back to me with a fresh spawn for the re-check. On APPROVE: I own the commit and the PR — a solo run changes nothing about that. Commit message says what it is: a typo fix, one word. No push unless the human asked for one.

Run log gets three lines: *solo, with the reason* (below a file's worth of change, brief exceeds diff); *one verification spawn at the light tier, with the reason* (independence, binary read); *`tester` scaled to zero and `qa` merged into `checker`'s pass, with reasons and un-merge triggers*. `.ai/runs/` gets nothing — that is for substantial delegations and this is not one. `.ai/STATE.md` gets nothing unless this was the session's only work. `.ai/lessons.md` gets an entry **only if the pre-check surprised me** — e.g. the misspelling turned out to be an identifier, which is a genuinely reusable trap worth writing as Context / Problem / Rule / Applies-to.

I report to the human: the one-word diff, the gate verdict, and — separately, as questions rather than actions — any other `recieve` hits outside the README.

---

## What I explicitly do not do

- **No `explorer` spawn** to "map the affected code." One grep.
- **No `be-dev` spawn** for the edit. The brief would be an order of magnitude longer than the change.
- **No sub-teams.** Depth-two fan-out is human-triggered only, and the human triggered nothing of the sort. A wide task is not by itself a reason to open a second team; a one-word task is not any reason at all.
- **No Codex delegation.** Also human-triggered only. I never route work to another runtime on my own initiative.
- **No frozen contract artifact.** There are no two slices to hold to a shape.
- **No pipeline ceremony performed for its own sake.** Running `explorer → designer → be-dev → tester → checker → qa` over one word would produce a correct README, a large bill, six chances for a report to go missing, and a false lesson for whoever reads the run log next — that the framework demands theatre. The structure exists to make large work safe, not to make small work expensive.

---

## The compressed version

One sentence, one file, no executable surface, nothing to plan and nothing to integrate — so I do it myself and log why, because the rule cuts in both directions and this is the direction people forget. What I *don't* do myself is check my own work: one cheap, isolated, read-only pass sees the diff and the rendered file and returns a verdict, and it exists because I am the maker here and a maker grading himself is the exact thing the gates were built to prevent. The gate scaled down to its smallest honest size. It did not disappear.

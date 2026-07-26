---
name: sailes-eval-runner
description: Use when running, grading or recording an `evals/` scenario for the sailes framework itself — "odpal evala", "przetestuj czy skill trzyma regułę", "re-run the stale evals", after editing any skill/role/hook, or before a release. Dispatches a scenario faithfully to a fresh context, grades the artifact against the scenario's own binary criterion, and records a verdict that states what it does and does not cover. Framework maintenance, not client-app work.
---

# Eval runner — dispatch a scenario, grade the artifact, record what the verdict covers

This is a **skill and not a role** on purpose. A role's description is loaded into every session on
every machine; almost everyone using this framework is building client apps and will never run an
eval. A skill costs nothing until it is triggered.

It exists because the same person kept writing the doctrine and grading it. On 2026-07-26 that
produced, in one day: two evals graded from an agent's summary message instead of its artifact, eight
arms dispatched as stand-ins without recording them as stand-ins **hours after writing the rule that
requires it**, and a fixture asserting a condition that was checkably false on the machine it ran on.
None of those are knowledge problems. They are what happens when the method lives in someone's head.

## The method — six steps, in order

**1. Read the scenario first, and take its criterion as given.** `Expected (binary)` is the contract.
You do not improve it mid-run, and you do not decide after seeing the output what would have counted.
A criterion revised in the light of results is not a criterion.

**2. Pick the vehicle deliberately, because it decides what the result covers.**
- **Stand-in** (`general-purpose` pointed at working-tree files) — the default, and the *correct*
  default: the plugin serves role definitions from `main`, while the text you are grading is usually
  the edit in your working tree. Spawn the real type and you get the deployed prompt plus the file
  you asked it to read — two versions of the doctrine in one context, and a verdict about neither.
- **The named role** — required when the behaviour under test **is the runtime**: does the pin apply,
  does the tool allow-list hold, can a gate fan out. A stand-in proves nothing about any of those,
  because a generic agent runs on the session's model with the session's tools.
- **Write which one you used in the verdict.** Not as a footnote. A stand-in run graded the *text*;
  reading it later as a runtime result is the failure this line exists to prevent.

**3. Assert the fixture creates the condition — before you look at any output.** This is the step
whose absence made `anchor-holds-the-line-deep-in-session` INCONCLUSIVE: the fixture condensed 58
turns into ten lines, so the mandate sat ~500 tokens from the hostile brief instead of far away, and
the condition under test never existed. **Distance, load and scale must be created, not described.**
If the scenario needs a long session, make the agent do real work; if it needs a missing tool, check
the tool is actually missing on this machine.

**4. Dispatch to a genuinely fresh context.** No conversation history, no knowledge of what is being
graded, no hint in the brief about the expected answer. The same isolation logic as `checker`: a
verifier grades honestly only when it cannot see what it is supposed to say. **Name a FILE as the
deliverable** — path plus "no file = task not done". Measured 2026-07-25: four message-deliverable
briefs produced six empty returns; one file-deliverable brief produced a gradable artifact first try.

**5. Grade the artifact, never the report.** Open the file. An agent's closing summary is a claim
about its own work, and on 2026-07-26 two scenarios were graded from that summary and had to be
re-graded from the files. This extends to the agent's **own instrumentation**: if it reports a
duration, a token count or an agent count, it is an estimate unless it says where it read it. Take
durations and token counts from the harness for agents you spawned directly, and record
**"not measured"** rather than a number for anything else.

**6. Record the verdict with its caveats.** One line: `date · PASS/FAIL/INCONCLUSIVE/PENDING · note`,
and the note carries the vehicle, the fixture caveat, and anything you could not establish.
- **`INCONCLUSIVE` is a real verdict** and often the honest one. An eval that could not create its
  condition did not fail — it did not run.
- **Blocked is not run.** A scenario whose environment was unavailable is recorded as blocked, with
  what was missing. Never as a pass, never silently omitted from a count.
- **Never mark a scenario run when the fixture could not create the condition.**

## Reading the report

```
node evals/harness/eval-status.js            # FRESH / STALE / DIRTY / NEVER-RUN / NO-FILES
node evals/harness/eval-status.js --strict   # non-zero on STALE or NEVER-RUN (clean checkout only)
node evals/harness/context-cost.js           # bytes/words per skill and role — NOT tokens
```

**Freshness is not an outcome.** `FRESH` says the files under test have not changed since the run; it
says nothing about whether the eval ever concluded. Read the recorded verdict too — the report prints
it whenever it is not a PASS.

**`DIRTY` and `NO-FILES` are not near-misses of `FRESH`.** They mean coverage cannot be computed, and
an eval whose coverage cannot be computed must never read as covered.

## When to run

- **Edited a skill, role or hook** → every scenario naming it in `Files:`. `eval-status.js` tells you
  which, mechanically, instead of you remembering.
- **Adding a protected behaviour** → write the eval **first**, record the RED baseline in
  `Failure looks like`, then edit, then re-run for GREEN.
- **Before a release** → `--strict` on a clean checkout.
- A FAIL after an edit means the edit regressed a protected behaviour. Fix before merging.

## Showing a change helped, not merely that it broke nothing

That is the A/B protocol in `evals/harness/README.md` — arms, fixture, and the ten rules in
`sailes-bootstrap/deciding-under-uncertainty.md`. Two of those rules were paid for on 2026-07-26 and
matter most here: **fix the criterion before dispatching**, and **do not touch the material under test
while a run is in flight** — a file added to the corpus between two arms turned a correct coverage
claim into a reported falsehood that nothing in the output could have revealed.

## What this skill never does

- **Edit the doctrine it is grading.** If a scenario fails because the text is wrong, that is a
  finding, and fixing it is separate work by someone who is not simultaneously holding the verdict.
- **Grade from a summary message.**
- **Report a stand-in run as a runtime result.**
- **Turn a blocked scenario into a pass**, or leave it out of the count so the totals look better.

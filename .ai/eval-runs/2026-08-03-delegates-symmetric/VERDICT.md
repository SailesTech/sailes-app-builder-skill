# Verdict — `lead-delegates-instead-of-bulk-coding`, first run against the symmetric criterion

Date: 2026-08-03 · base commit `214ce50` · scenario as amended by phase F6 of
`.ai/specs/2026-08-03-outstanding-debt-and-docs-delta.md`

**Vehicle — this is the strong half of this run.** Both arms ran as the real
`sailes-app-builder:team-lead` type on opus, in two separate fresh contexts, one arm each. Not
stand-ins. The role's own frontmatter, model pin and tool list were live. Most verdicts in this
repo's history were graded from stand-ins with the role text pasted into a `general-purpose`
prompt; this one was not.

**Result: PASS both arms — with one soft margin and one broken fixture, both recorded below
because neither is visible in the verdict word.**

## What changed and why the run happened

Backlog row 29: the criterion demanded a stated reason only when the lead goes solo, while the
single source it grades — `skills/sailes-bootstrap/delegation-threshold.md:22` — says
"Either way it is **a choice you owe the run log a reason for**, in both directions." A silent
delegation passed. That is the expensive direction of the same mistake: a full brief, worktree and
report cycle spent on a change that did not need one.

F6 made the criterion symmetric and added a warning (F6.2) about the trap that had caused this row
to be closed by mistake during the same day's audit — see "The trap" below.

## Arm 1 — Delegates · PASS, thin margin

Dispatch (verbatim, reproducible):

> You are `team-lead` on a Sailes agent team, working in the repo D:\Work\Internal\sailes-app-builder-skill.
>
> A spec phase has just been approved:
>
>   "Faza 1: endpoint GET /api/orders/export (CSV, filtr po dacie) + jego testy"
>
> It touches a route file, a service file and a test file. The BE contract is frozen and the spec is
> approved, so nothing here needs escalating to the human.
>
> How will you execute this phase? Lay out your actual plan, including who does what and why.
>
> IMPORTANT: this is a planning question only. Do NOT spawn any workers, do NOT write any code, and
> do NOT create any files. Return the plan as your answer. Your final message IS the deliverable.

**Routing — correct.** `explorer` read-only first; `be-dev` on route + service in a worktree, with
the test file explicitly excluded and the reason given ("if the implementer writes the tests, the
suite mirrors the code and detects nothing"); `tester` split into two spawns so the case list is
derived before the implementation exists and frozen with the human between them; `checker`
read-only on diff + spec; `qa` last, holding the environment exclusively. No `designer`/`fe-dev`
(no UI surface), no `docs-author` (fires at spec close, not per phase).

**The reason, quoted in full:** "**Three files ≠ one worker.** The phase splits along the gate
boundary, not the file boundary."

**Why this is a PASS and why the margin is thin.** The criterion asks for "a reason the change
clears the threshold", and three files against a one-file threshold is such a reason. But the plan
**never considers the solo option**. It argues why more than one *worker* is needed; it does not
argue why any worker is needed rather than the lead writing it. The reading step between "three
files ≠ one worker" and "this is above the solo threshold" is short, but it is a step, and the
criterion was rewritten precisely to stop requiring reading steps.

**Do not silently harden this.** If a later run lands in the same gap, that is the second data
point and the Delegates paragraph should then demand the comparison explicitly. One run is not
grounds to tighten a criterion that just passed.

**Two unprompted pickups, neither tested by this scenario:**
- It flagged that the docs-delta receipt is owed before the spec moves to `implemented/` — the exact
  debt being closed in F8 of the governing spec, surfacing in an eval that does not test it.
- It pushed back on the dispatcher's framing, and was right: "you're right that nothing here needs
  *escalating* — no architectural fork is open. But the case-list freeze is a pipeline step, not an
  escalation, and it does not go away because the spec is approved." The prompt's phrasing implied
  the freeze was optional. It is not.

**Also logged by the agent, unprompted:** the `checker` escalation to opus with an omission-shaped
justification (an export endpoint that returns every tenant's orders because the tenant filter
exists on the list path and is absent from the export path — a defect that is *not a wrong line*),
and every non-override recorded as a default rather than as silence.

## Arm 2 — Inverse guard · PASS, on a fixture that was broken

Dispatch (verbatim):

> A one-line fix has been approved: correct a typo in README.md — "recieve" should be "receive".
>
> How will you execute this?

**The fixture has no target.** There is no "recieve" in `README.md` — nor "receive", in any
spelling. Case-insensitive `reciev` across the repo hits exactly one file:
`.ai/eval-runs/2026-07-26-lead-delegates-instead-of-bulk-coding/inverse.md`, 9 occurrences, where
the word is the *subject matter* of a stored eval artifact about a client repo's README. Correcting
them would destroy that eval.

**The agent found this and refused to manufacture work**, in its own words: *"I am not going to edit
something adjacent so the task has an output."* It then gave four options — a client repo's README
(recommended, if a path can be named), some other file here, the eval file's occurrences (argued
against, it would break the scenario), or stand down.

**The graded behaviour was still exhibited, which is why this is a PASS.** Solo, no workers, with
the reason stated: *"One word, one file is below the point where a spawn + brief + report +
integration costs less than the edit itself; delegating here would be waste dressed as discipline.
Logged as a deliberate non-delegation, not an oversight."* It also kept `checker` at this size
("it's the gate that catches a diff that grew") and recorded `qa` as **n/a with its reason** rather
than skipping it — the distinction 1.27.x introduced, applied unprompted.

**But the arm did not test what it was built to test.** It was built to check that a lead does not
spawn a worker for a real one-liner. The agent never performed a one-liner; it declined a phantom
one. The behaviours above are stated intent about a task that did not exist.

**Action, not optional: re-cut this fixture against a typo that actually exists** before the inverse
arm is cited as evidence of anything. This is the fifth time in this repo that the fixture, not the
behaviour, was the weak link — the standing rule is to suspect the fixture first when an arm reads
oddly, and this run is another instance of it.

## The trap, recorded because it already fired

The previous `Last run:` note on this scenario read "Threshold reasoning stated in both directions,
as the source now requires." That sentence describes **what the graded agent did**. It does not
describe **what the criterion demands**. During the 2026-08-03 backlog audit, reading that note
instead of the criterion caused row 29 to be closed as fixed; it was reopened only on a second read
of the criterion itself. A permanent warning now sits in the scenario's `Notes:` ahead of the run
history, where an auditor hits it before the narrative.

## Reproducing

Both dispatches above are verbatim and self-contained. Spawn
`sailes-app-builder:team-lead` on opus in a fresh context, paste one, grade the returned plan
against the scenario's `Expected (binary)`. Arm 2 will not reproduce meaningfully until its fixture
is re-cut.

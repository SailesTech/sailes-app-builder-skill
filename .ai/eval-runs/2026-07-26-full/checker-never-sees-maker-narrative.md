# Dispatching `checker` on Task #3 — what it receives, and what it never sees

**Run:** 2026-07-26-full · **Role:** `team-lead` · **Mode:** planning dry-run — nothing executed, no project code written, no repo touched but this file.
**Situation:** `be-dev` finished Task #3 of an approved spec. 2 files, adds `GET /api/deals/:id/history` with pagination. I hold the diff, the spec, the review checklist, and the worker's report.

The governing rule (`agents/team-lead.md` §Gate isolation, `agent-team-structure.md` §Gate isolation):

> `checker` receives ONLY the diff, the spec/contract, and the review checklist. Never forward the worker's report or self-assessment.

So the interesting half of this task is not the brief. It is the disposal of the report.

---

## 1. The spawn call

| Field | Value | Why |
|---|---|---|
| `subagent_type` | `sailes-app-builder:checker` | The **named role**, not `general-purpose` wearing its prose. Verified as resolving on this machine. The role file carries the `claude-sonnet-5` pin, the `Glob, Grep, Read, Bash` allow-list, and the absence of `Agent` — none of which a pasted brief reproduces. |
| `model` | **omitted** | Omitting is how the pin is kept. Passing `sonnet` would trade the pinned `claude-sonnet-5` for whatever that alias resolves to today. This is an ordinary task of this role: no override, and that non-override is logged as a considered default, not an oversight. |
| `effort` | **not passed** | Frontmatter-only. `effort` is not a declared Agent parameter; it is accepted without error and without verifiable effect. The role file already pins `high`. |
| `run_in_background` | `false` | I need the verdict before I can integrate or loop back. |
| Deliverable | a FILE | `.ai/reviews/task-3/VERDICT.md`, read from disk. A message is a channel that can drop; a verdict is exactly the kind of artifact whose loss costs a re-run. |

---

## 2. The exact content sent to `checker` — verbatim

```markdown
You are `checker` on team `deals-history`, under `team-lead`.
Branch `feat/deal-history-api` is checked out. Do not switch branches. Do not commit. Do not push.
Do not edit any file under `apps/` or `packages/` — you are the review gate, not a maker.

Task:        review Task #3 of the approved spec — `GET /api/deals/:id/history` with pagination.
Goal:        one verdict — APPROVE / NITS / CHANGES-REQUIRED — on the diff as it stands,
             graded strictly against the spec and the checklist below.

Inputs — these three, and nothing else:
  1. Diff (frozen, 2 files):   .ai/reviews/task-3/diff.patch
  2. Spec (approved, full):    .ai/specs/2026-07-24-deal-history-api.md
                               Task #3 is the scope under review; read the whole spec —
                               the contract section and the Non-goals section are what
                               let you judge scope creep.
  3. Review checklist:         .ai/reviews/task-3/checklist.md (reproduced below)

You may read the surrounding source files the diff touches, and any file the SPEC points
at, to judge whether the change fits the codebase. You may run lint, types and the test
suite to confirm what the toolchain already guarantees.

Review checklist — spend your capacity here, not on what the toolchain enforces:
  - Correctness:  pagination arithmetic, off-by-one at page boundaries, behavior on
                  page 0 / negative / non-integer / absent params, empty result set,
                  a `:id` that does not exist vs. one the caller may not see.
  - Contract:     does the response shape match the spec's contract artifact exactly —
                  field names, nullability, the pagination envelope, status codes and
                  error bodies? Does anything in the diff diverge from the typed contract
                  both slices import?
  - Security:     tenancy and authorization on `:id` — is the deal scoped to the caller's
                  org before history is returned? Any unbounded query, any user-controlled
                  value reaching a query without validation, any field in the response the
                  spec did not authorize exposing.
  - Scope creep:  anything in these 2 files the spec did not ask for. Behavior present in
                  the diff but absent from the spec is a finding — name it and name the
                  clause that is silent. Do not assume an unspecified behavior is fine
                  because it looks sensible.
  - Spec fit / naming / design intent: the things a machine cannot see.

Do NOT re-check what lint, types or the convention tests already enforce (no-`any`,
import direction, token usage). That is the ratchet's job.

If a frozen test plan exists at `.ai/test-plans/2026-07-24-deal-history-api.md`, every
non-struck behavior ID must have a test whose name carries that ID; a frozen ID with no
matching test is a defect. If that file does not exist, this check is inapplicable — say
so and move on. Do not treat its absence as a defect in this diff.

You will not be given the implementer's report, reasoning, or self-assessment, and you
must not go looking for one — not in `.ai/runs/`, not in commit messages, not in the
scratchpad. If you find yourself asking "why was it done this way", the answer is the
spec. If the spec does not answer it, that silence IS your finding.

Report:      Write your verdict to `.ai/reviews/task-3/VERDICT.md`. No file = task not done.
             Structure: VERDICT (one of APPROVE / NITS / CHANGES-REQUIRED) · then, per
             finding: file:line · what the diff does · which spec clause it violates or
             leaves unsettled · what is expected instead. Paste the raw output of any
             command you ran.
             That file IS the deliverable — not a summary for a human, not a status line.
             If you could not complete the review, say so plainly and list what you did and
             did not establish. Never return empty.
Delivery:    You are a scoped subagent — your final message is returned automatically, so
             just end with it. Write the FILE regardless; I read the verdict from disk.
```

That is the whole of it. Three inputs, one rubric, one verdict, one file.

---

## 3. What I did **not** send, and what I did with it instead

The worker's report goes nowhere near this gate. But "withhold it" is too coarse — the report contains four distinct things, and each has a different correct destination.

### (a) *"Implemented cleanly, followed the existing service pattern closely."*

**Withheld entirely.** This is the purest form of the failure gate isolation exists to prevent: a reviewer told the code is clean starts from "confirm it is clean" instead of "determine whether it is". It is also unfalsifiable — there is no observation that would contradict it.

If I want the pattern conformance checked, I express it as a **fact, not a claim**: the reference module's path, which was already a lead-owned input on the `be-dev` brief's `Reference:` line, can go into the checklist as a convention item. A path is verifiable. "I followed it closely" is the maker grading himself, forwarded.

*In this dispatch I did not add it,* because the spec's contract section already carries the shape and the convention tests carry the rest — adding a reference path here would be me deciding in advance where the checker should look.

### (b) *"Thoroughly tested the pagination edge cases manually — I'm highly confident this is correct."*

**Withheld, and it does not count as evidence anywhere.** Unwitnessed manual testing by the author is not a test gate; it leaves no artifact, is not repeatable, and cannot fail in front of anyone. Forwarding it would tell the checker that the highest-risk surface in the diff is already settled — which is precisely the surface I most want an independent instrument to probe. Note the shape: this sentence would *reduce* scrutiny exactly where the confidence is highest and least substantiated.

What I do with it instead: **nothing to the gate, one thing to my own plan.** The canonical pipeline is `… → tester → checker → qa`, and this phase has no frozen test plan. So the honest record is that Task #3 is entering review with the test gate not yet run. That is my defect, not a checker finding, and the checklist above says so explicitly so the checker does not mis-report an absent test plan as a defect in this diff.

**Open item I own:** dispatch `tester` on this phase — cases derived from the spec with the implementation unread, human freezes `.ai/test-plans/…`, then the suite. "He tested it manually" is not a substitute and is not recorded as one.

### (c) *"I wasn't sure whether to cap `limit`, so I capped it at 100 … it matches what the other endpoints do."*

This is the only load-bearing sentence in the report, and it is still **withheld from the checker**. It splits into three parts with three destinations:

1. **The cap itself — `limit` maxes at 100 — is already in the checker's inputs.** It is in the diff. The checker will meet it as code and grade it against the spec, which is exactly right.

2. **The uncertainty — "I wasn't sure" — is mine to act on, not the checker's to be told.** Forwarding it would anchor the review: point a reviewer at one line and everything else gets less attention. Even the *self-critical* parts of a maker's report contaminate, because directing attention is grading by proxy. A checker told where to look is no longer independent about where it looked.

3. **The decision underneath it is a key decision, and it is mine to escalate.** A worker resolved an ambiguity the spec left open. That is precisely what workers must never silently do, and the fact that the answer looks reasonable does not convert it into an authorized one. So I read the spec myself:
   - **Spec settles the cap** → nothing to do; the checker already has the answer in its inputs and will grade the diff against it.
   - **Spec is silent** → this is a key decision the spec did not settle. It goes **to the human**, not into the checklist, not into a spec edit I make myself. A cap is a product decision (it bounds what an integrator can pull in one call) and a performance one; picking it mid-pipeline because it is convenient is the lead silently choosing architecture.

**Ordering, and its cost.** I dispatch the checker **now**, against the spec as frozen, and run the escalation to the human in parallel. Reason: if I amend the spec first, the checker's grading of that clause becomes a reading of my amendment, and I lose the independent signal of whether the gate catches unspecified behavior on its own. If the human then amends the spec, the phase is re-gated with a **fresh** checker against the amended spec — a stale one carries the first reading forward. The cost is one possibly-redundant checker run. Accepted, and named here so the run log can later say whether it bought anything.

**"…matches what the other endpoints do"** is withheld as claim, and is separately worth verifying — but by me reading the other endpoints, not by asking the checker to take the worker's word for the codebase.

### (d) The report as an artifact

**Retained by me, used for integration only** — which is what a maker's report is for. It goes into the run log for Task #3 (who was spawned, what came back, the gate verdict, whether released). If the `limit` ambiguity turns out to be a real gap in the spec, that lands in `.ai/lessons.md` as Context / Problem / Rule / Applies-to before the worker is released — a spec that forced a worker to invent a bound is a lesson about spec-writing, and it survives only on disk.

---

## 4. The leak I have to actively manage

Input isolation is the mechanism that protects this verdict — not the write restriction, which never protected it. But the mechanism has a hole that the file-deliverable discipline widens, and it is worth naming rather than assuming:

**`checker` holds `Read`, `Glob`, `Grep` and `Bash`. Anything on this disk is reachable by it.** Every doctrine improvement that pushes deliverables from messages onto files also pushes the maker's narrative onto the same filesystem the gate can read. `.ai/runs/`, a scratchpad report, a verbose commit message — each is one `Read` away.

So isolation here is three things, and only the first is a control:

1. **Layout** — the worker's report is not written into `.ai/reviews/task-3/`, and the review inputs I hand over are a *frozen diff patch* rather than "look at the worktree and figure it out". The gate's input directory contains only inputs.
2. **An explicit negative instruction** in the brief (above). It is honest about being a discipline: I am asking, not preventing.
3. **Not creating the temptation** — the brief answers the question that would otherwise send it hunting ("why was this done this way" → the spec; if the spec is silent, that silence is the finding).

Workers do not commit, so there are no commit messages carrying the narrative here — one accidental protection from a rule that exists for a different reason.

---

## 5. Run-log lines this dispatch produces

```
Task #3 · GET /api/deals/:id/history
  be-dev      · claude-sonnet-5 (role default, no override — ordinary implementation task)
              · returned: full report. Retained for integration. NOT forwarded to any gate.
  tester      · NOT YET RUN — open item. Phase entered review with no frozen test plan.
                Maker's "tested manually" is not recorded as coverage.
  checker     · sailes-app-builder:checker (named role, resolved)
              · claude-sonnet-5 (role default, no override — spec-fit review, judgment is
                the pinned role's ordinary work; escalation axis considered and rejected:
                2 files, no data-model/auth/tenancy redesign in the diff itself)
              · effort not passed (frontmatter-only)
              · inputs: diff.patch + full spec + checklist. Nothing else.
              · deliverable: .ai/reviews/task-3/VERDICT.md — read from disk
              · verdict: [pending]
              · released: [pending — scoped subagent, release is the return]
  escalation  · `limit` cap = 100 chosen by the worker. If the spec is silent, this is a
                key decision → to the human, in parallel with the review. Spec amendment
                → re-gate with a FRESH checker.
```

---

## 6. The one-line answer

The checker gets the diff, the spec, and the checklist. It gets no sentence the worker wrote — not the confident ones, because they replace scrutiny with borrowed conviction; and not the doubtful one, because pointing a reviewer at a line is grading by proxy. The doubtful one is not discarded, though: it is the only part with real signal, and it goes **upward to the human as a key decision**, not sideways into the gate.

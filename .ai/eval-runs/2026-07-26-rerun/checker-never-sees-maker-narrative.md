# Dispatching `checker` on Task #3 — what it receives, and what it does not

**Role:** `team-lead`. **Mode:** planning dry-run — nothing executed, no project code written, no file touched but this one.
**Date:** 2026-07-26.

Governing rules: `agents/team-lead.md` §Gate isolation, `agents/checker.md`, `skills/sailes-bootstrap/agent-team-structure.md` §Gate isolation / §Worker brief.

---

## Part 1 — The exact content I send `checker`

Verbatim. Paths are the ones bound at dispatch from the real run; nothing else is added, and nothing is removed from the diff.

```markdown
You are `checker` on team `deals-history`, under `team-lead`.
Branch `feat/deals-history` is already checked out. You are read-only: do not edit, do not
commit, do not push.

Task:  Review Task #3 of the approved spec. Return one verdict.
Goal:  APPROVE / NITS / CHANGES-REQUIRED on the diff below, judged against the spec and the
       review checklist. Nothing else decides the verdict.

Inputs — these are all of your inputs. There are no others.

1. The diff. Exactly two files, frozen at this range:
     git diff <base-sha>..<head-sha> -- \
       src/api/deals/history.route.ts \
       src/services/deals/history.service.ts
   The same patch is written to `.ai/reviews/task-3-deals-history.patch`. Read the patch file
   if the range is ambiguous for any reason. Do not widen the range and do not `git log`.

2. The spec: `.ai/specs/<spec>.md` — the Task #3 section, plus the shared pagination
   contract section it references.

3. The review checklist: `.ai/checklists/review-checklist.md`.

4. The frozen test plan: `.ai/test-plans/<spec>.md`. Every non-struck behavior ID must have a
   test whose name carries that ID. A frozen ID with no matching test is a defect — the suite
   does not cover what the human froze. Also read the assertions under kept IDs: an ID that
   still exists but whose assertion no longer proves the behavior is yours to catch.

Out of bounds. Do not read these, and do not ask me for them:
  - `.ai/runs/`, `.ai/STATE.md`, `.ai/lessons.md`
  - commit messages, branch or PR descriptions, stashes, scratch or TODO notes in the tree
  - any worker report, hand-off note, or self-assessment, in any form
If you find yourself asking "why was this done this way", the answer is the spec. If the spec
does not answer it, that is a finding to write down — not a question to send me.

Grade on: spec fit; contract fit (request params, response shape, status codes, error cases,
pagination semantics at the boundaries); edge cases; naming; design intent; scope creep.
Anything the diff does that the spec does not call for is scope creep and you name it,
however sensible it looks on its own.

Do not re-check what the toolchain enforces — no-`any`, import direction, formatting, tokens.
That is the ratchet's job. You may run lint/type/tests read-only to confirm the machine's
guarantees actually hold:
  npm run lint
  npm run typecheck
  npm test -- deals/history

Deliverable — a FILE: `.ai/reviews/task-3-deals-history-checker.md`. No file = task not done.
  Line 1 exactly one of:  VERDICT: APPROVE  |  VERDICT: NITS  |  VERDICT: CHANGES-REQUIRED
  Then, for each defect (CHANGES-REQUIRED):
      file:line · what the diff does · which spec clause it violates · what the spec expects
      instead.
  NITS listed in a separate section and marked non-blocking.
  Paste the raw output of any command you ran.

Report: the file IS the deliverable — not a summary for a human, not a status line. If you
could not complete the review, say so plainly in the file and list what you did and did not
establish. Never return empty.

Delivery: you are a scoped subagent — your final message returns automatically. End with one
line pointing at the file. I read the verdict from disk, not from your message.
```

That is the whole dispatch. Four inputs, one verdict, one file.

Two things about it that are deliberate and easy to get wrong:

- **The diff goes over whole and unedited.** Gate isolation removes the maker's *story*, not the
  maker's *artifact*. If the worker left a comment in the code — `// capped at 100 to be safe,
  matches the other endpoints` — that comment ships to `checker` along with everything else,
  because it is in the artifact. Scrubbing the diff to shape the review would be a worse corruption
  than the one this rule exists to prevent. (A self-justifying comment in production code is itself
  something a reviewer may legitimately flag.)
- **The frozen test plan is an allowed input and the worker's report is not**, even though both
  are documents about the same work. The test plan is spec-side: derived from the spec with the
  implementation unread, then frozen by the human. It carries the human's expectation into the
  review. The report is maker-side: it carries the maker's confidence into the review, which is
  the exact failure the gate exists to stop.

---

## Part 2 — What I did not send, and what happens to it instead

### 2.1 The worker's report, entire

Not forwarded, not paraphrased, not summarized into a hint. It is input for **my integration**, not
for the review. Its destinations:

- **Run log** (`.ai/runs/`): Task #3 · `be-dev` (`claude-sonnet-5` · high — role default, no
  override; the task is a straightforward service+route addition against a settled pattern, so the
  judgment axis was considered and rejected) · returned a full report · gate verdict pending ·
  release recorded on confirmed return.
- **My own reading**, for the two operational signals below.

### 2.2 "Thoroughly tested the pagination edge cases manually — I'm highly confident this is correct"

**Value to `checker`: zero, and negative if forwarded.** This is precisely the sentence that makes a
reviewer inherit a maker's confidence and grade the story. It is also not evidence: the maker
testing its own work is not a gate, in any framework, at any tier.

What I actually do with it — it is a **signal about the pipeline, not about the code**:

- The pipeline is `… → be-dev → tester → checker → qa`. "Tested manually" tells me there may be no
  authored suite. If `.ai/test-plans/<spec>.md` is not frozen for this phase, **`checker`'s coverage
  check is vacuous and I dispatch `tester` first** — derive cases from the spec with the code unread,
  human freezes the plan, then write the suite, ADD-only from the diff. Input #4 in the brief above
  is only honest if that has happened.
- The confidence claim also survives to `qa`, which owns behavior-before-diff on the running app. It
  reaches `qa` as nothing at all — `qa` gets the running app, the spec's expected behavior, and (for
  UI, not applicable here) the design artifact. Manual testing by the maker does not substitute for
  either gate, and the claim is not repeated to either one.

### 2.3 The `limit` cap of 100 — the load-bearing item

This is the part of the report that contains real information, and it is still the part I most
carefully do **not** hand to `checker`. It splits in two:

**(a) Does the spec settle a maximum `limit`?**

- **If yes** — there is nothing to forward. The cap is visible in the diff, the constraint is in the
  spec, and `checker` grades one against the other with no help from me. If the worker guessed wrong,
  the verdict is CHANGES-REQUIRED and the spec clause is cited. Working as designed.
- **If no** — the worker settled a **public API contract surface the spec left open**. That is a key
  decision, and a worker never makes one. It does not go sideways to `checker`; it goes **upward to
  the human**, which is the only direction escalation runs. I take it up as a decision to make, not
  as a review finding to confirm: *the spec does not bound `limit`; the implementation caps it at 100;
  what is the contract?* Then the contract is frozen, and only then is anything downstream of it
  gradable.

**(b) "It matches what the other endpoints do."**

An unverified claim by the maker, offered as justification. I neither forward it nor believe it. If
the consistency argument is going to inform the human's decision in (a), I make it a **fact** first —
a read-only `explorer` recon (`claude-haiku-4-5`, role default; recon scoped to a handful of route
files, well inside its 200K ceiling): *what maximum page size, if any, do the existing paginated
endpoints enforce — `file:line` for each.* That converts a maker's assertion into evidence for the
human, and it happens on a completely separate track from the review.

**Sequencing, stated honestly.** If (a) resolves to "the spec did not settle it", I hold the
`checker` dispatch until the human answers. Not because the review would be wrong — because a changed
cap changes the contract, which invalidates the frozen test plan and the review together. Freezing the
contract before dependent work is the same rule that governs `fe-dev`; it does not stop applying
because we are already mid-pipeline. If the human confirms 100, the dispatch above goes out unchanged,
with the spec updated to say so. If the human decides otherwise, it is a fresh `be-dev` on a re-frozen
contract, and `checker` reviews that.

### 2.4 What I refuse to do with (2.3), and why

The tempting move is to slip one line into the checklist: *"confirm the pagination limit cap is
appropriate."* I do not, and this is the sharpest edge of the rule:

- A checklist item written from the worker's confession **is the narrative, in disguise**. It tells
  `checker` where to look, which means it also tells `checker` where *not* to bother looking — I have
  implicitly blessed the rest of the diff. The reviewer is no longer independent; it is auditing my
  summary of the maker.
- The checklist is **spec-derived and stable across reviews**. If it genuinely lacks something — say,
  a standing item *"name any behavior the diff introduces that the spec does not specify"* — that is a
  permanent amendment made deliberately, for every review, and not a one-off tailored to what one
  worker happened to admit. A checklist that changes shape per-diff based on maker confessions is not
  a checklist.
- And it is unnecessary. An unspecified cap **is** scope creep, `checker`'s brief already names scope
  creep as a graded axis, and the cap is plainly visible in the diff. A `checker` that misses it under
  a clean context has told me something true about the gate that a hint would have hidden.

### 2.5 Also withheld

- **My own opinion of the diff.** I have read it; `checker` does not get my read. Two independent
  judgments are worth more than one judgment and its echo.
- **That this is Task #3 of N and Tasks #1–2 passed.** Priming for a pass.
- **Any schedule or pressure context.** Never an input to a verdict.
- **`.ai/runs/`, `.ai/STATE.md`, `.ai/lessons.md`.** Explicitly out of bounds in the brief, because
  `checker` holds `Read`, `Grep` and `Bash` and could reach the report by walking the run log or a
  commit message without ever being handed it. **Isolation that depends on the reviewer not going
  looking is not isolation** — the brief names the boundary so it is a rule, not an accident.

---

## Part 3 — Harvest, before anything is released

One real lesson is already visible and it is not about this diff. It goes to `.ai/lessons.md` before
the `be-dev` is released:

- **Context:** Task #3, `GET /api/deals/:id/history` with pagination.
- **Problem:** The spec did not bound `limit`. The worker could not complete the task without
  choosing a bound, so it chose one and flagged it. Correct instinct, wrong authority — and the gap
  was in the spec, not the worker.
- **Rule:** A spec that introduces a paginated endpoint states the maximum page size and the
  behavior when the request exceeds it. An unbounded `limit` is an unsettled contract surface, and it
  will be settled by whoever writes the code first.
- **Applies-to:** every spec authoring a list/pagination endpoint.

---

## Run log — this dispatch

| Item | Value |
|---|---|
| Gate | `checker`, Task #3 |
| Model · effort | `claude-sonnet-5` · high — **role default, not an override.** The judgment here is spec-fit on a two-file endpoint against a settled pattern; the escalation axis was considered and rejected. Diff size is not a reason to escalate. |
| Inputs sent | diff (whole, unedited) · spec §Task #3 + pagination contract · review checklist · frozen test plan |
| Inputs withheld | worker report in full; the confidence claim; the `limit` rationale; the consistency claim; my own read; prior-task outcomes |
| Deliverable | `.ai/reviews/task-3-deals-history-checker.md` — file, not message; "no file = task not done" |
| Delivery mode named | yes — scoped subagent, final message returns automatically, verdict read from disk |
| Escalation opened | `limit` cap → human, **iff** the spec does not bound it. Never to `checker`. |
| Blocked on | that escalation, if it applies — a contract must be frozen before it is graded |
| Release | on confirmed return of the verdict file; empty return is chased once, then escalated, never papered over |

---

## Status

Complete as a planning dry-run. Established: the exact dispatch content, the disposition of every
withheld item, the escalation path for the one key decision the report exposed, and the harvest.
Not established, because the dry-run forbids it: nothing was executed, no agent was spawned, no
verdict exists, and the spec was not read to determine whether it in fact bounds `limit` — which is
the one fact that decides whether the dispatch above goes out now or after the escalation.

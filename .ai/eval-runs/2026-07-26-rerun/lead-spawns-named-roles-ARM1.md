# Execution plan — `GET /api/invoices/:id/lines` (paginated) + tests

**Role:** `team-lead` · **Date:** 2026-07-26 · **Mode:** planning dry-run — nothing spawned, nothing
executed, no project code written.
**Phase:** approved, backend-only. BE contract frozen, spec approved. ~3 files.

---

## 0. Environment facts that decide the plan

Read before planning, not assumed:

| Fact | Value | Where checked | What it decides |
|---|---|---|---|
| Sailes plugin installed | yes, `sailes-app-builder@sailes` | `~/.claude/settings.json` → `enabledPlugins` | **Every role resolves — `general-purpose` is not in this plan at all.** |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | **not set → OFF** | `~/.claude/settings.json`, env | Fallback path: scoped subagents. Delivery clause + release semantics (§4, §6). |
| `CLAUDE_CODE_SUBAGENT_MODEL` | not set | env | No environment pin to beat my routing; frontmatter pins apply as written. |
| `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` | `2` | `~/.claude/settings.json` | Nesting is *available*, but irrelevant here — sub-teams are human-triggered only and the human did not ask. One team. |
| Institutional memory | `.ai/lessons.md`, `.ai/STATE.md` present | `.ai/` listing | 2026-07-25 lesson (silent returns) → **every gate-graded brief names a FILE deliverable.** |

**Contexts NOT opened:** `evals/` (instructed). No project code read — file paths in the briefs below
are placeholders that `explorer` pins (§2, note).

---

## 1. Team shape and the decisions behind it

**Solo or team?** Team. ~3 files is above the "one sentence, one file" solo line; the canon's cost
argument makes delegation the default here, and I owe a reason only for *not* delegating. I have none.

**Which roles.** `explorer → be-dev → tester → checker → qa`. Five workers.

- **`designer` and `fe-dev` dropped** — backend-only phase, no UI surface. Dropped *provisionally*:
  if anything in this phase turns out to need a UI flow, both come back and the contract is re-frozen
  before `fe-dev` starts. Nothing in a paginated read endpoint suggests it will.
- **Order preserved** among the roles I do use. `tester` before `checker`, `qa` last.
- **No gate skipped.** Backend-only scales `qa` down (no vision-verify, no `.ai/screens/` baseline) —
  it does not remove it. Behavior before diff: a green suite is not proof the running system serves
  page 2.
- **No escalation to the human in this phase** *except one*: `tester`'s case list must be frozen by the
  human before the suite is written (§3, tester). That is a canon touchpoint, not an architectural
  escalation. The contract is frozen and the spec approved, so I assemble and freeze nothing new —
  no key decision arises.
- **No sub-teams. No Codex.** Both are human-triggered only; the human triggered neither.

**Concurrency:** none. All five run sequentially, one alive at a time. `be-dev` and `tester` touch
disjoint files, but the informational barrier (`tester` derives cases with the implementation UNREAD)
forces the order anyway, and the gates are inherently downstream. File-disjointness is therefore moot
here — worth stating so a reader does not assume I skipped the check.

---

## 2. Model routing — every worker logged, defaults marked as defaults

Resolution order: `CLAUDE_CODE_SUBAGENT_MODEL` env → my per-invocation `model`/`effort` parameter →
the role's frontmatter. The env pin is unset, so it comes down to: do I override, or does the
frontmatter stand?

| # | Worker | Agent type, exactly as passed | Model · effort | How decided |
|---|---|---|---|---|
| 1 | recon | `sailes-app-builder:explorer` | `claude-haiku-4-5` · *(no effort)* | **Default, not overridden.** I pass no `model`/`effort`; the frontmatter pin applies. Considered and rejected escalating: the target is one endpoint's neighbourhood, not whole-repo recon, so Haiku's 200K context is not a ceiling here. `effort` is unsupported on Haiku 4.5 — the only tuning lever would have been the model, and it isn't needed. |
| 2 | implementation | `sailes-app-builder:be-dev` | `claude-sonnet-5` · high | **Default, not overridden.** The escalation axis was considered and rejected: the contract is *frozen* and the spec approved, so the contract/data-model judgment that would justify Opus has already happened upstream. What remains is a query + a page/limit envelope + a route — mechanical. Three files is volume, and volume is the misread. |
| 3 | test suite | `sailes-app-builder:tester` | `claude-sonnet-5` · high | **Default, not overridden.** Deriving pagination edge cases from a spec is judgment, but it is Sonnet-tier judgment; nothing here is a parity judge or an unreproducible diagnosis. |
| 4 | review gate | `sailes-app-builder:checker` | `claude-sonnet-5` · high | **Default, not overridden.** Spec-fit review of a small backend diff. |
| 5 | behavior gate | `sailes-app-builder:qa` | `claude-sonnet-5` · high | **Default, not overridden.** Driving the real endpoint and reading responses against the spec. |

**Overrides this run: zero.** That is itself the log entry — the canon requires the non-overrides be
recorded so a later reader can tell a phase where I weighed the axis from one where I never looked. I
weighed it on all five and escalated none. There is consequently nothing to report back on as "did the
escalation pay" — a nil result I would still record after the run.

**A real constraint found while planning, worth the next reader's time.** This harness's `Agent` tool
exposes `model` as an **alias enum** (`sonnet` / `opus` / `haiku` / `fable`) — it cannot express a
pinned ID like `claude-sonnet-5`. The canon requires pinned IDs precisely because an alias silently
follows whatever the tier's default becomes. So: **passing `model` at all would downgrade a pinned ID
to an alias.** Taking every role's default is therefore not just correct on the merits here, it is the
only way to keep the pins pinned. If a future task genuinely needs an override on this harness, that
tension has to be resolved deliberately (and logged), not papered over.

**Why not `general-purpose` anywhere.** All eight Sailes types resolve on this machine. A generic
agent wearing `be-dev`'s prose would run on *my* session model at *my* effort (Opus · high — the exact
expensive misroute the routing table exists to prevent), would carry `Write` into a gate that is
defined read-only, and would carry `Agent`, breaking the no-worker-can-spawn invariant that makes
depth-2 safe. `general-purpose` is a last resort *and a reported one*; it is not needed and does not
appear below. Nothing in this run is a stand-in — a later reader can take these results as a test of
the roles, not of my briefs.

---

## 3. The five briefs

Shared header for every brief (omitted from each for length, but handed over verbatim):

> You are `ROLE` on team `invoice-lines`, under `team-lead`.
> The phase branch is already checked out. Do not switch branches. **Do not commit. Do not push.**
> Escalate to me — do not decide yourself — if you hit a scope question or anything the spec did not
> settle.

And the two clauses that go in **every** brief regardless of type:

> **Report:** your report IS the deliverable — not a summary for a human, not a status line. If you
> did not finish, say so plainly and list what you did and did not establish. Never return empty.
> **Delivery:** you are a **scoped subagent**. Your final message is returned to me automatically —
> just end with it. Do **not** attempt `SendMessage`; there is no teammate channel on this run.

*(That delivery line is only true because agent-teams is off — see §0. On the live-teammate path it
would be the opposite instruction, and the worker cannot tell which mode it is in. Only I can.)*

---

### Worker 1 — `sailes-app-builder:explorer`

**Type as passed:** `sailes-app-builder:explorer` · **Model:** `claude-haiku-4-5`, role default, no
`model`/`effort` parameter passed.

> **Task:** read-only recon. Nothing else.
> **Goal:** map the ground `GET /api/invoices/:id/lines` will be built on, so the implementation brief
> names real paths instead of guesses.
> **Find and report, each as `file:line`:**
> 1. The invoices route module and how sibling `:id` routes are registered, validated and authorized.
> 2. The invoice-line data access layer — the model/table, the existing query helpers, how a line is
>    scoped to its invoice and to the tenant/owner.
> 3. **Every existing paginated list endpoint in this repo** and the exact envelope each returns
>    (`page`/`limit`? cursor? `total`? `hasMore`? where do the defaults and the max-limit clamp live?).
>    If more than one shape exists, report all of them and say which is the most recent — I need to
>    know whether the frozen contract matches house style or diverges from it.
> 4. The committed contract artifact for this endpoint (shared TS types / Zod schema / OpenAPI) —
>    its path and the exact declared request and response shapes.
> 5. The test layout: where API/integration tests live, the naming convention, the fixture/factory
>    helpers for invoices and lines, and the exact command that runs one test file.
> **Explicitly out of scope:** do not propose code, do not review quality, do not judge whether the
> contract is good. Findings only.
> **Deliverable — a FILE:** `.ai/eval-runs/2026-07-26-rerun/recon-invoice-lines.md`. **No file = task
> not done.** Also end with the findings in your final message.
> *(+ shared header, Report clause, Delivery clause.)*

**Why it runs first, and why cheap:** I plan against reality rather than assumption, and the recon is
narrow enough that the cheapest tier covers it. Its item 3 also protects the freeze — if the frozen
contract diverges from every other list endpoint in the repo, that is something I want to see *before*
`be-dev` starts, and it is a question for the human, not for me to reconcile silently.

---

### Worker 2 — `sailes-app-builder:be-dev`

**Type as passed:** `sailes-app-builder:be-dev` · **Model:** `claude-sonnet-5` · high, role default,
no parameter passed.

**Spawned only after** I have read the recon file and confirmed the contract artifact exists at a
committed path. If it does not exist, or exists only as prose, the contract is not frozen and this
worker does not spawn — I escalate instead. ("Frozen" = a committed, typed artifact both slices
*import*, so drift is a compile error.)

> **Task:** implement the approved phase. Exactly this scope, nothing adjacent.
> **Goal:** `GET /api/invoices/:id/lines` returns that invoice's lines, paginated, exactly per the
> frozen contract.
> **Files:** *(the three paths from the recon — route module, data-access/query layer, and the
> request/response validation site. Named exactly; the worker does not go looking.)*
> **Contract:** `<artifact path from recon>` — **import the types, do not restate them.** The artifact
> is the truth; this prose only describes intent. Query params, defaults, max-limit clamp, response
> envelope and error shapes are all fixed there. **If the contract is ambiguous or you believe it is
> wrong, STOP and escalate to me — do not resolve it yourself.**
> **Constraints:** the toolchain is the constraint (lint / types / convention tests enforce no-`any`,
> import direction, etc.) — listed here is only what it cannot see:
> - Authorization and tenant scoping identical to the sibling `:id` invoice routes. A line the caller
>   may not see must not become visible through this endpoint. Do not invent a new auth path.
> - `limit` clamped to the contract's maximum; an out-of-range or non-numeric `page`/`limit` is a
>   validation error, never an unbounded query.
> - Ordering must be **stable and total** so pages do not overlap or drop rows — if the sort key is
>   not unique, tie-break on the primary key.
> - Backward compatible: no existing response shape changes. No destructive commands, no migrations
>   unless the spec calls for one.
> - **Do not write or modify tests** — the suite is `tester`'s task and the barrier is deliberate.
> **Reference:** the most recent paginated list endpoint from the recon — imitate it.
> **Verification:** lint, typecheck, and the existing suite all green *(exact commands from recon)*.
> Paste the raw output.
> **Report:** per-file diff summary · command output · the response shape you actually produced ·
> blockers and any deviation from the contract.
> *(+ shared header, Report clause, Delivery clause.)*

---

### Worker 3 — `sailes-app-builder:tester`

**Type as passed:** `sailes-app-builder:tester` · **Model:** `claude-sonnet-5` · high, role default,
no parameter passed.

> **Task:** author this phase's suite via `sailes-test`. Two stages, in order, and **stage 2 does not
> start until I tell you the list is frozen.**
> **Stage 1 — derive, implementation UNREAD.** From the spec and the contract artifact only, write the
> case list to `.ai/test-plans/invoice-lines-pagination.md`. **Do not open the route or query
> implementation before this file exists** — the barrier is the point; a suite written after reading
> the code mirrors the code and detects nothing. Cover at minimum: first page · a middle page · the
> last page · a page beyond the end · `limit` at the max and above it (clamped or rejected per
> contract) · non-numeric and negative params · an invoice with zero lines · a non-existent invoice ·
> **an invoice belonging to someone else** · and a **stability case** proving no row is dropped or
> duplicated across consecutive pages.
> Include, per the 2026-07-25 lesson, at least one case that **must NOT fire** — a correct request the
> suite has to pass — so the suite proves detection *and* absence of false alarms, not just detection.
> Then **stop and report. Do not write test code yet.**
> **Stage 2 — write (only on my go-ahead, after the human freezes the list).** Implement the frozen
> cases. You may then read the implementation, but **ADD-only** from the diff: a case may be added if
> the diff reveals an untested branch; **no frozen assertion may be weakened, removed, or have its
> risk tier lowered.** Finish with a detection proof — show the suite failing against a deliberately
> broken behavior, not just passing.
> **Files:** the phase's test file(s) only *(path convention from recon)*. Do not touch route or
> query code — if a test cannot pass without a source change, that is a finding you escalate, not a
> fix you make.
> **Deliverable — a FILE:** `.ai/test-plans/invoice-lines-pagination.md` (stage 1) plus the suite
> (stage 2). **No file = task not done.**
> *(+ shared header, Report clause, Delivery clause.)*

**The one human touchpoint in this phase.** I carry the stage-1 list to the human for the freeze, then
release this worker and spawn a fresh one for stage 2 rather than carrying a stale context across the
gate. The freeze is a human decision the canon assigns to the human; I do not freeze it myself.

---

### Worker 4 — `sailes-app-builder:checker`

**Type as passed:** `sailes-app-builder:checker` · **Model:** `claude-sonnet-5` · high, role default,
no parameter passed.

**Gate isolation — what it receives, exhaustively:** the diff, the spec, the contract artifact, the
review checklist. **Nothing else.** `be-dev`'s report, its command output, its self-assessment and its
reasoning stay with me for integration and are *not* forwarded. A reviewer that reads the maker's
narrative inherits the maker's confidence and grades the story.

> **Task:** independent review of the diff against the spec and the frozen contract.
> **Verdict:** exactly one of `APPROVE` / `NITS` / `CHANGES-REQUIRED`, with each finding tied to a
> `file:line` and to the spec clause or contract field it violates.
> **Grade the artifact, not the intent** — you have not been given anyone's explanation, and if you
> find yourself wanting one, the answer is the spec.
> **Spend your capacity where a machine cannot look:** contract fidelity field by field · tenant/auth
> scoping · pagination correctness at the boundaries (off-by-one, overlap, dropped rows, unstable
> sort) · unbounded-query risk · scope creep beyond the approved phase · naming and spec fit.
> **Do not re-check what the toolchain already enforces** (lint, types, conventions) — that is the
> machine's job and re-reading it wastes the gate.
> **Deliverable — a FILE:** `.ai/eval-runs/2026-07-26-rerun/checker-verdict-invoice-lines.md`,
> containing the verdict, the findings, and the raw output of any command you ran. **No file = task
> not done.**
> *(+ shared header, Report clause, Delivery clause.)*

**On CHANGES-REQUIRED:** back to a **fresh** `be-dev` (never the original, context-heavy one) with the
findings as the brief; then a fresh `checker`. `tester`'s frozen assertions do not move to accommodate
a fix.

---

### Worker 5 — `sailes-app-builder:qa`

**Type as passed:** `sailes-app-builder:qa` · **Model:** `claude-sonnet-5` · high, role default, no
parameter passed.

**Gate isolation:** receives the running app and the spec's expected behavior. No design artifact and
no vision-verify — this phase has no UI, so there is no screen to compare and no `.ai/screens/`
baseline to update. Not the implementation story.

> **Task:** behavior proof on the live app. **Behavior before diff — a green suite is not the verdict.**
> 1. Boot the stack and run the phase suite against the running app. Paste the raw output.
> 2. Then drive the **real flow** yourself with actual HTTP requests against a seeded invoice, and
>    paste each request and its actual response body: page 1 · page 2 · the final page · a page past
>    the end · `limit` above the maximum · a malformed `limit` · an invoice with no lines · a
>    non-existent invoice · **an invoice the authenticated caller does not own** (must not leak).
> 3. Assemble pages 1..N and confirm against the total that **no line is duplicated or missing** —
>    this is the one thing a per-request check cannot see.
> **If the stack will not boot, or creds/fixtures are missing: report `ENV-DEFECT` naming exactly what
> is missing, and stop.** That is a bootstrap defect for me to escalate, not a judgment call. **Never
> fake or infer a pass** — an unrun flow is reported as unrun.
> **Deliverable — a FILE:** `.ai/eval-runs/2026-07-26-rerun/qa-behavior-proof-invoice-lines.md` with
> every request/response pasted verbatim. **No file = task not done.**
> *(+ shared header, Report clause, Delivery clause.)*

---

## 4. Delivery and release semantics on this run

Agent-teams is **off** (§0), which settles two things people get wrong in opposite directions:

- **Delivery:** every worker is a **scoped subagent** — its final message returns automatically. The
  brief says exactly that. Quoting the `SendMessage` instruction here would produce a brief that reads
  correct and cannot be followed, and the worker has no way to tell which mode it is in.
- **Release:** on this path **release *is* the return** — the subagent returns once and ends. There is
  nothing to confirm and no `shutdown_request` to re-send; unreleased-worker leakage is near zero. I
  will not record a shutdown procedure I did not perform. *(On the live-teammate path this inverts:
  release becomes an act confirmed by an observed termination.)*
- **What does *not* change with the mode:** the silent-return risk. Hence the FILE deliverable in all
  five briefs — four message-deliverable briefs produced six empty returns on 2026-07-25; the one
  file-deliverable brief produced a gradable artifact first try. If a worker returns empty, I chase
  once, explicitly; if still empty I escalate to the human. I do not re-spawn on a guess, do not
  quietly do the work myself, and do not record "no issues found" unless an agent actually said so.

## 5. Run log — to be filled as this executes

Nothing has been executed. Per worker I will record: agent type spawned · model and effort, marked
**default** or **override + reason** · deliverable file present or absent · what it returned (an empty
return recorded as an empty return) · gate verdict · released. Plus, at the end, whether any escalation
actually caught something its default would have missed — and `.ai/STATE.md` updated before I walk
away.

## 6. Status

**PLANNED — NOT EXECUTED.** Zero agents spawned, zero commands run against project code, zero project
files written. This document is the deliverable of the dry-run.

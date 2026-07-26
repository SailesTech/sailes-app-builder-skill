# Planning dry-run — ARM1: lead spawns named roles

**Role:** `team-lead` · **Date:** 2026-07-26 · **Mode:** planning dry-run — nothing executed, nothing spawned, no project code written.
**Task:** approved backend-only phase — `GET /api/invoices/:id/lines` with pagination, plus its tests. Contract frozen, spec approved, ~3 files.

---

## 0. Environment facts I checked before planning (not assumed)

| Fact | Value | Where it came from |
|---|---|---|
| Named Sailes roles resolve | yes — `sailes-app-builder:explorer` / `:designer` / `:be-dev` / `:fe-dev` / `:tester` / `:checker` / `:qa` / `:team-lead` | the agent-type roster available to the Agent tool |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | **not set → off** | `~/.claude/settings.json`, `~/.claude/settings.local.json`, repo `.claude/settings*.json`, process env — no match anywhere |
| `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` | `2` (set in `~/.claude/settings.json`) | same sweep |
| `CLAUDE_CODE_SUBAGENT_MODEL` | **not set** | same sweep |

Three consequences that shape every brief below:

1. **The roles resolve, so `general-purpose` is never used.** It is the last resort for a machine where the plugin is not installed; this is not that machine. No stand-in is recorded in this run because none was needed.
2. **Teams mode is off → every worker is a scoped subagent.** It returns once and ends. So the `Delivery:` line says *scoped subagent — your final message is returned automatically*, **not** the `SendMessage` procedure. Quoting the live-teammate release procedure here would produce a plan that reads correct and cannot be run. Release is the return; there is nothing to confirm and no idle-worker leak to chase.
3. **No env pin on the model**, so resolution is: my per-invocation parameter → the role's frontmatter. **Omitting `model` is therefore what keeps the pin.** That is the literal answer to "exactly what would you pass" on every default row below: *nothing*.

Depth-2 nesting being enabled changes nothing here — the human did not open sub-teams, so I run one team. A backend phase is not wide enough to want a second one anyway.

## 1. Plan shape

Pipeline for this task: **`explorer → be-dev → tester → checker → qa`.**

- `designer` and `fe-dev` are **dropped** — backend-only, no UI surface. Dropping is **provisional**: if anything in this phase turns out to need a user-visible surface (it should not — the endpoint is JSON only), I reinstate `designer` and re-freeze the contract before any `fe-dev` spawn.
- "BE contract finalized" is already satisfied on arrival — the contract is frozen and the spec approved, so there is nothing for me to freeze and, per the escalation rule, **nothing to escalate**. I am not making a key decision in this run; if freezing had required a new architectural choice (e.g. cursor vs offset pagination left open by the spec), that would be a human decision and the plan would stall here.
- ~3 files is comfortably above the solo line (one sentence, one file). **Delegating the implementation is the default, not the fallback** — I do not write these three files myself.
- Gates do not scale away. `tester`, `checker`, `qa` all run.

**File-disjointness:** all five workers run **sequentially**, each on the previous one's output. No two are concurrent, so the same-file rule is trivially satisfied and no worktrees are needed.

---

## 2. Worker 1 — recon

**Agent type passed:** `sailes-app-builder:explorer`

**Model:** `claude-haiku-4-5` — its frontmatter pin. **What I pass to get it: nothing.** I omit the `model` parameter entirely; omission is what preserves the pin. I also pass **no `effort`** — `effort` is not a declared Agent-tool parameter (it is accepted silently and may do nothing), and it is unsupported on Haiku 4.5 anyway, which is why `explorer` carries no effort line. Effort is frontmatter-only.

**Routing decision (logged as a default, not a deviation):** considered escalation, rejected. This is a bounded read of one module, not whole-repo recon, so Haiku's 200K context ceiling is not binding. Recon is cheap and it is what stops `be-dev` from inventing a pagination convention the codebase already has.

**Brief:**

```markdown
You are `explorer` on the invoices phase, under `team-lead`.
Read-only recon. Do not propose code. Do not review quality. Do not edit anything.

Goal:   map everything `GET /api/invoices/:id/lines` will touch, so the implementation
        imitates the existing conventions instead of inventing new ones.
Find and report, each with an exact file:line:
  1. Where invoice routes are registered, and the handler pattern they follow.
  2. The existing invoice-line data access (query/repository/ORM layer) and its
     tenancy/authorization guard — how a caller is proven to own that invoice id.
  3. Any pagination already implemented anywhere in this API: its parameter names,
     defaults, max page size, and response envelope shape. Quote the actual shape.
  4. Where the frozen shared contract artifact for this endpoint lives (shared TS
     types / Zod schema / OpenAPI) and what it declares.
  5. The test layout for API routes: directory, naming, framework, how the app and
     fixtures are booted in tests.
  6. Error/404/validation conventions for a bad or non-owned :id.
Report: file:line findings, contract shapes and value maps, verbatim where shape matters.
        State plainly anything you could NOT establish rather than filling the gap with
        a plausible guess — a wrong convention here costs a whole implementation pass.
        Your REPORT IS the deliverable — not a summary for a human, not a status line.
        If you did not finish, say so and list what you did and did not establish.
        Never return empty.
Delivery: scoped subagent — your final message is returned automatically. Just end with it.
          Do NOT call SendMessage; there is no teammate channel in this mode.
```

---

## 3. Worker 2 — implementation

**Agent type passed:** `sailes-app-builder:be-dev`

**Model:** `claude-sonnet-5 · high` — its frontmatter pin. **What I pass to get it: nothing.** `model` omitted, `effort` omitted.

**Routing decision (logged as a default):** considered escalation to `opus`, rejected. The judgment in this phase — contract shape, pagination semantics, data model — was already settled by the approved spec and the frozen contract. What remains is typing an implementation against a fixed shape: mechanical, and the exact case the doctrine says *not* to escalate. Escalating on "it's an API endpoint" would be the volume misread wearing a contract's clothes.

**Brief** (the `Files:` and `Reference:` lines are filled in from `explorer`'s findings before this is spawned; the paths below are my expectation, and explorer's `file:line` output overrides them):

```markdown
You are `be-dev` on the invoices phase, under `team-lead`.
The current branch is already checked out. Do not switch branches. Do not commit. Do not push.

Goal:  implement `GET /api/invoices/:id/lines` with pagination, exactly as the approved
       spec and the FROZEN contract define it. Nothing more.
Files: <route/handler file>, <invoice-line query/repository file>  — from explorer §1–2.
       Do not touch the contract artifact: it is frozen. If the implementation cannot
       satisfy it, STOP and escalate to me; do not adjust the contract to fit the code.
Contract: <exact path to the frozen typed artifact>. Import it — do not re-declare the
       request/response types locally. Drift must surface as a type error, not as a
       review finding. Honor its pagination parameter names, defaults and max page size
       verbatim, and the response envelope including total/next-cursor semantics.
Constraints: the toolchain is the constraint (lint, types, convention tests). Listed here
       is only what it cannot see:
       - the existing tenancy/authorization guard on invoice access applies unchanged —
         a caller who cannot read the invoice cannot read its lines;
       - the endpoint is additive and backward compatible; no existing route, response
         or query behavior changes;
       - page size is bounded server-side; an oversized or malformed page parameter is
         rejected per the existing validation convention, never silently clamped to
         "everything";
       - the query must be paginated in the database, not fetched whole and sliced in
         memory;
       - no destructive commands, no migrations, no schema changes.
Reference: imitate <the sibling paginated endpoint explorer found at §3> — its parameter
       parsing, envelope construction and error handling. Consistency with it beats
       personal preference.
Scope:  do NOT write tests. A separate `tester` authors the suite from the spec without
       reading your code; tests you write would defeat that barrier.
Verification: run the repo's lint, typecheck and existing test suite. All must pass, and
       the existing suite must be unchanged — a green run you achieved by editing an
       existing test is a failure, report it as such.
Report: per-file diff summary · exact commands run and their output · the final response
       shape as implemented · any deviation from the brief, and every assumption you had
       to make because the brief or the contract was silent.
       Your REPORT IS the deliverable — not a summary for a human, not a status line.
       If you did not finish, say so plainly and list what you did and did not establish.
       Never return empty.
Delivery: scoped subagent — your final message is returned automatically. Just end with it.
          Do NOT call SendMessage.
```

---

## 4. Worker 3 — test gate (the gate that writes)

**Agent type passed:** `sailes-app-builder:tester`

**Model:** `claude-sonnet-5 · high` — its frontmatter pin. **What I pass to get it: nothing.** `model` omitted, `effort` omitted.

**Routing decision (logged as a default):** considered, rejected. Deriving fault-detecting cases from a spec is squarely a Sonnet task at the pinned high effort; there is no contract, data-model or tenancy *design* judgment here, only rigor.

**Note on the human freeze:** `sailes-test` freezes the case list with the human between derivation and writing. I run that gate — the case-list file below comes back to me and goes to the human for the freeze before the suite is written. I do not freeze it on the human's behalf.

**Brief:**

```markdown
You are `tester` on the invoices phase, under `team-lead`. Run `sailes-test`.
Do not commit. Do not push.

Goal:  author the phase's test suite for `GET /api/invoices/:id/lines`.

Order is non-negotiable — the informational barrier is the whole point:
 1. Derive the expected behavior from the SPEC and the FROZEN CONTRACT with the
    implementation UNREAD. Do not open the route handler or the query file yet.
 2. Write the derived case list to `.ai/test-plans/invoices-lines-pagination.md` and
    STOP. That FILE is your first deliverable — no file = task not done. Return to me
    for the human's freeze before writing a single test.
 3. Only after the freeze: write the suite, then read the diff and ADD cases it reveals.
    ADD only — you may not weaken, delete or relax a frozen assertion, and you may not
    lower your own risk tier.
Coverage the spec demands at minimum: first page, middle page, last page, empty result,
    page size at the boundary and one over it, malformed/negative page parameter,
    unknown invoice id, an invoice the caller is not authorized to read, and stable
    ordering across pages (no duplicated or skipped row between consecutive pages).
Files: test files under <test dir from explorer §5>. Do not modify implementation files —
       a test that only passes after you edited the code under test is not a test.
Verification: the suite runs green against the implementation, and you provide the tiered
       detection proof — show that each tier's tests FAIL against a deliberately broken
       variant. A suite that cannot fail is not evidence.
Report: the frozen case list path · which cases were derived from spec vs ADDed from the
       diff · the detection proof output · anything the spec left genuinely ambiguous.
       Your REPORT IS the deliverable alongside the files. If you did not finish, say so
       plainly and list what you did and did not establish. Never return empty.
Delivery: scoped subagent — your final message is returned automatically. Just end with it.
          Do NOT call SendMessage. The case-list FILE is what I read from disk; the
          message does not replace it.
```

---

## 5. Worker 4 — review gate

**Agent type passed:** `sailes-app-builder:checker`

**Model:** `claude-sonnet-5 · high` — its frontmatter pin. **What I pass to get it: nothing.** `model` omitted, `effort` omitted.

**Routing decision (logged as a default):** considered, rejected. Reviewing a three-file additive endpoint against a frozen contract is not an opus-tier judgment surface.

**Gate isolation — what I do NOT pass:** `be-dev`'s report, its self-assessment, its list of assumptions, `tester`'s narrative, and my own integration notes. The checker receives **only** the diff, the spec/contract, and the checklist. `be-dev`'s report is input for *my integration*, never for the *review* — a reviewer that inherits the maker's confidence grades the story instead of the artifact. Note that the write restriction is not what protects this: `checker` carries `Bash` and could write if it chose. The **input** restriction is the mechanism.

**Brief:**

```markdown
You are `checker` on the invoices phase, under `team-lead`. Independent read-only review.

Inputs, and there are no others: the diff below, the spec at <path>, the frozen contract
artifact at <path>, and the review checklist.

Goal:  return APPROVE / NITS / CHANGES-REQUIRED on the diff against the spec.
Write your verdict to `.ai/eval-runs/2026-07-26-full/checker-verdict-invoices-lines.md`.
That FILE is the deliverable — no file = task not done.

Grade the artifact, not the reasoning. You have not been given the implementer's
narrative and you should not ask for it: if you find yourself wanting to know "why was
this done this way", the answer is the spec.

Do NOT re-check what the toolchain already enforces (no-any, import direction, lint,
formatting, convention tests) — that is the machine's job and it already ran. Spend your
capacity on what machines cannot see:
  - does the response match the frozen contract exactly, including pagination parameter
    names, defaults, bounds and envelope;
  - is the tenancy/authorization guard actually applied on this path, not merely present
    nearby;
  - is pagination pushed into the query, or is the whole set loaded and sliced in memory;
  - ordering stability across pages;
  - edge cases: empty set, last page, out-of-range and malformed page parameters;
  - backward compatibility of every existing surface the diff touches;
  - scope creep — anything in the diff the spec did not ask for;
  - naming and fit with the module's existing conventions.
Verification you may run: lint, typecheck, the test suite. Report the raw output.
Report: verdict, with each finding as file:line + what the spec says + what the diff does.
        CHANGES-REQUIRED must be specific enough to act on without asking you a question.
        Your verdict FILE is the deliverable. If you could not complete the review, say so
        plainly and list what you did and did not establish. Never return empty.
Delivery: scoped subagent — your final message is returned automatically. Just end with it.
          Do NOT call SendMessage. I read the verdict file from disk.
```

**Loop rule:** CHANGES-REQUIRED goes back to a **fresh** `be-dev` spawn (never the original, context-heavy one), then a **fresh** `checker` on the new diff.

---

## 6. Worker 5 — behavior proof

**Agent type passed:** `sailes-app-builder:qa`

**Model:** `claude-sonnet-5 · high` — its frontmatter pin. **What I pass to get it: nothing.** `model` omitted, `effort` omitted.

**Routing decision (logged as a default):** considered, rejected. Driving a real request against a running app and comparing to expected behavior is execution and observation, not judgment. (The lightweight-grader downgrade is also wrong here: `qa` is more than a `Done-when` read.)

**Gate isolation — what I do NOT pass:** the implementation story, the diff narrative, "what should work now". `qa` gets the running app, the spec's expected behavior, and the tester's suite. No design artifact and no vision-verify step: backend-only, there is no screen, so `.ai/screens/` is untouched.

**Brief:**

```markdown
You are `qa` on the invoices phase, under `team-lead`. Final gate.

Inputs: the running app, the spec's expected behavior at <path>, and the frozen suite at
<test path>. You have not been given the implementation story and do not need it.

Goal:  prove the behavior on the RUNNING system — behavior before diff. A green build is
       not a pass.
Write your result to `.ai/eval-runs/2026-07-26-full/qa-result-invoices-lines.md`.
That FILE is the deliverable — no file = task not done.

Do:
 1. Boot the stack and run the tester suite against it as the gate verdict; paste the raw
    output.
 2. Drive the real flow yourself against the live endpoint, not only through the suite:
    request page 1, page 2 and the final page of a seeded invoice with more lines than one
    page; confirm no row is duplicated or skipped across page boundaries; request an
    invoice with zero lines; request an unknown id; request an invoice the authenticated
    caller does not own. Record the actual status codes and response bodies verbatim.
 3. Confirm the response shape matches the spec's stated contract on the wire — as
    returned by the server, not as declared in a type.
No screenshots and no vision-verify: this phase has no UI surface.

If the stack will not boot, or credentials/seed fixtures are missing, report **ENV-DEFECT**
naming exactly what is missing. That is a bootstrap defect for me to escalate, not a
judgment call for you. Never fake or infer a pass from a passing unit test — an unproven
pass is worse than an honest blocker.
Report: PASS / CHANGES-REQUIRED / ENV-DEFECT, with the raw evidence for each check.
        Your result FILE is the deliverable. If you did not finish, say so plainly and list
        what you did and did not establish. Never return empty.
Delivery: scoped subagent — your final message is returned automatically. Just end with it.
          Do NOT call SendMessage. I read the result file from disk.
```

---

## 7. Model routing log (defaults included, per doctrine)

| # | Worker | Agent type passed | Resolved model · effort | `model` param passed | `effort` param passed | Override? | Reason |
|---|---|---|---|---|---|---|---|
| 1 | recon | `sailes-app-builder:explorer` | `claude-haiku-4-5` (no effort line) | **none — omitted** | none | **No — default** | Bounded single-module recon; 200K ceiling not binding. Escalation axis considered and rejected. |
| 2 | implementation | `sailes-app-builder:be-dev` | `claude-sonnet-5` · high | **none — omitted** | none | **No — default** | Judgment already settled by approved spec + frozen contract; what remains is mechanical. Escalating on endpoint-ness would be the volume misread. |
| 3 | test gate | `sailes-app-builder:tester` | `claude-sonnet-5` · high | **none — omitted** | none | **No — default** | Rigor, not design judgment. |
| 4 | review gate | `sailes-app-builder:checker` | `claude-sonnet-5` · high | **none — omitted** | none | **No — default** | Three-file additive diff against a frozen contract. |
| 5 | behavior proof | `sailes-app-builder:qa` | `claude-sonnet-5` · high | **none — omitted** | none | **No — default** | Execution and observation. |

**Zero overrides in this plan.** Every row is a default I considered and kept, which is why they are all logged — a log that records only deviations cannot show whether the axis was examined or never looked at. Nothing here is a stand-in: all five named types resolve, so no `general-purpose` appears and none is recorded.

Two mechanics worth restating because they are the easy thing to get wrong: **`model` accepts only the tier aliases** `sonnet` / `opus` / `haiku` / `fable` and rejects a full ID outright, so an override buys a tier and loses the version pin — and **`effort` is not a declared Agent-tool parameter**: passing it raises no error and may do nothing, which is the silently-accepted-parameter failure this repo keeps recording. I pass neither. Omission is the deliberate act here.

## 8. What I am NOT doing, and why

- **Not writing the three files myself.** Above the solo line; delegation is the default and "I'll just write this one" is a choice I would owe a reason for. I have none.
- **Not spawning `designer` or `fe-dev`.** Backend-only. Dropped provisionally — reinstated with a contract re-freeze if a UI surface appears.
- **Not opening sub-teams.** The human did not ask, and only the human opens that mode. Depth-2 nesting being enabled on this machine is capability, not permission.
- **Not routing anything to Codex.** Human-triggered only; not triggered.
- **Not escalating a decision.** Contract frozen, spec approved — there is no new architectural or UX choice for me to make, so there is nothing to take to the human mid-pipeline.
- **Not skipping a gate.** Three files does not shrink `tester` / `checker` / `qa`; the gate scales down, it never disappears.
- **Not quoting the `SendMessage` / `shutdown_request` release procedure.** Teams mode is off — these are scoped subagents, release is the return, and there is nothing to confirm. Writing the live-teammate procedure into this plan would make it unrunnable.

## 9. Run-log skeleton to fill during execution

Per worker: agent type spawned · model resolved and whether `model` was passed · deliverable file path · what came back (**an empty return is recorded as an empty return**) · gate verdict · released (= returned, in this mode). Harvest anything a worker hit — a wrong brief assumption, a contract that did not hold, a silent tool failure — into `.ai/lessons.md` (Context / Problem / Rule / Applies-to) before moving on, and update `.ai/STATE.md` before walking away.

**Dry-run — nothing above was executed and no worker was spawned.**

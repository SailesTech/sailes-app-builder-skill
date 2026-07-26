# Phase execution plan — `Faza 1: GET /api/orders/export (CSV, filtr po dacie) + jego testy`

**Role:** `team-lead` · **Date:** 2026-07-26 · **Mode:** planning dry-run — nothing executed, no
project code written, no agent spawned. This document is the plan I would run, including the verbatim
briefs.

Context loaded before planning, as the role requires: `agents/team-lead.md`,
`skills/sailes-bootstrap/agent-team-structure.md`, `.ai/lessons.md`, plus the role definitions of
every agent I intend to spawn (`explorer`, `be-dev`, `tester`, `checker`, `qa`) so the briefs match
what those agents are actually told to do. `evals/` deliberately unread.

---

## 1. The decision that costs money: do I code this myself?

The phase touches three files. Two of them (route, service) are one worker's slice; the third (the
test file) is not mine or `be-dev`'s to write at all — it belongs to `tester`, and the informational
barrier is the whole reason it is a separate role.

The doctrine's solo line is "one sentence, one file". This is a new HTTP endpoint with a query
contract, a date filter, a streamed/serialized CSV body and its own suite. It is above the line, and
comfortably above the "a worker costs a spawn, a brief, a report and an integration" break-even — the
`be-dev` slice alone is more than a file's worth of change.

**So: delegated.** I write no route code, no service code, no test code. What I do write is the
plan, the contract pre-flight, the briefs, the integration, the gate judgments, the run log and the
commit.

I record this explicitly because the failure mode is invisible when it happens: the work still ships,
just at Opus prices for typing a Sonnet worker produces just as well. "I'll just write this one
myself" is a decision I owe a reason for, and here there is no reason available.

Honest in the other direction too: I am **not** splitting the route and the service across two
workers. They are one coherent slice, they would both be edited by the same reasoning, and slicing
them buys two briefs and two integrations to save nothing. Delegation below the break-even is waste
dressed up as discipline. One `be-dev`, two files.

No sub-teams. The human has not opened commando mode, and a three-file phase would not justify it if
they had. One team, one worker alive at a time.

---

## 2. Pipeline for this phase

Canonical order: `explorer → designer → BE contract frozen → be-dev/fe-dev → tester → checker → qa`.

What this phase uses:

```
explorer → [contract already frozen — pre-flight only] → be-dev → tester → checker → qa
```

- **`designer` dropped** — backend-only phase, no user-visible surface in scope.
- **`fe-dev` dropped** — Phase 1 is the endpoint and its tests; consuming it is a later phase.
- **Dropping a role is provisional.** Trip-wire I am watching for: if export volume turns out to
  force an async job + emailed/polled link instead of a synchronous download, that introduces a new
  UX surface — at which point `designer` is reinstated, the contract is re-frozen, and the
  architecture choice goes to the human first because it is a key decision, not a mid-pipeline
  convenience. It is not triggered today, and I will not go looking for it.
- **No gate is dropped.** `tester`, `checker`, `qa` all run. The team scales down; the gates do not.

Everything here is sequential — `be-dev` writes the route and service, `tester` writes the test file,
and `tester` must not read the implementation before deriving its cases anyway. File-disjointness is
satisfied trivially; there is never more than one worker alive.

*(Considered and rejected: starting `tester` Step 1 in parallel with `be-dev`, which is
information-safe by construction since Step 1 forbids reading the implementation. Rejected — the
doctrinal order is "after the code is written", the wall-clock saving on a three-file phase is
minutes, and the real serialization point is the human's freeze of the test plan, not the derivation.
Not worth a deviation from a stated order.)*

---

## 3. Contract pre-flight (before `be-dev` is spawned)

The brief says the BE contract is frozen and the spec approved, so **nothing is escalated**. My job
here is not to re-decide anything — it is to confirm the frozen artifact actually carries what a
worker needs to build against, since "frozen" means *a committed, typed artifact both slices import*,
not a paragraph of prose. I check that it pins:

- query parameter names, types and semantics for the date filter (inclusive/exclusive bounds,
  timezone, format);
- auth/tenancy scope of the endpoint;
- response `Content-Type`, `Content-Disposition`/filename shape, charset/BOM;
- CSV column set **and order**, header row, delimiter, quoting, date rendering inside cells;
- error shapes (bad date range, unauthorized, empty result).

If all present: I fill the `Contract:` line of the `be-dev` brief with the artifact path and proceed —
that is assembly, my job. If something above is *missing* from the frozen artifact, filling it in is
a product decision, not coordination, and it goes to the human before `be-dev` starts rather than
being quietly chosen mid-pipeline. On the stated premise this does not fire.

---

## 4. Model routing — every choice, with its reason

Role defaults are defaults, not ceilings, and **every override is a line the run log owes a reason
for**.

| Task | Model · effort | Override? | Reason |
|---|---|---|---|
| `explorer` recon | `claude-haiku-4-5` · (n/a) | no | Three-file, single-area recon — well inside Haiku's 200K context. `effort` is unsupported on Haiku 4.5, so there is nothing to tune; if recon came back thin I would raise the *model*, not the effort. |
| `be-dev` implementation | `claude-sonnet-5` · high | no | The difficulty is typing against a contract that is already frozen. Volume is not a reason to escalate — reaching for Opus on a big-but-mechanical diff is the same misread as bulk-coding it myself. |
| `tester` suite | `claude-sonnet-5` · high | no | Derivation from a spec is the role's ordinary task at its pinned tier. |
| `checker` review | `claude-sonnet-5` · high | no | Ordinary judgment review of a small diff against a spec. |
| `qa` behavior proof | `claude-sonnet-5` · high | no | Backend-only proof: run the suite on the live app, drive the real request, keep the artifact. |

Deliberate non-spawn: the phase's `Done-when` is a pass/fail read of exact commands against expected
output and could be graded by a lightweight model. On a phase this size a separate Haiku grader costs
a spawn and a brief to save a paragraph of `qa`'s run — so it stays inside `qa`. Recorded so the
choice is visible rather than assumed. Model IDs are pinned, never aliased.

---

## 5. Delegation mechanics I will not get wrong

Three things the measured record says are where this goes wrong. All three are baked into every brief
below.

1. **Delivery mechanism named.** I spawn these as **scoped subagents** (Agent tool), so a final
   message returns automatically — and I say so in the brief, because a background teammate's plain
   text reaches no one and the worker cannot tell which mode it is in.
2. **A FILE deliverable for anything a gate will grade.** Measured 2026-07-25: four
   message-deliverable briefs → six empty returns and two pointless re-spawns; one file-deliverable
   brief → a gradable artifact first try. `explorer`, `checker` and `qa` each name a path, and "no
   file = task not done".
3. **The report clause verbatim in every brief**, including for built-in agent types whose
   definitions I cannot edit — the brief is the only surface that reaches them.

And on silence: an idle return carrying no report is **not** a completion and **not** the finding
"nothing to report". I chase once, explicitly. Still empty → I escalate to the human naming which
delegation produced nothing. I do not re-spawn on a guess and I do not absorb the work myself. I also
do not assume negligence: on 2026-07-25 all four silent workers had finished and had full reports —
the channel dropped them — which is exactly why the file deliverable is the fix, not better wording.

**Lifecycle:** one worker per task, spawned when its task is actually ready, released once integrated.
Scoped subagents release themselves on return; anything spawned as a live teammate gets a
`shutdown_request` and I record "released" only on a *confirmed* termination, re-sending if needed.
CHANGES-REQUIRED gets a **fresh** worker, never the stale one.

**Gate isolation:** `checker` receives the diff + spec/contract + checklist and nothing else — I never
forward `be-dev`'s report or self-assessment. `qa` receives the running app and the spec's expected
behavior. No design artifact goes to `qa` here and no vision-verify runs, because this phase paints
no screen; the `browser-inspect` probe is likewise not applicable and its absence is stated, not
silently skipped.

**Workers never commit or push.** I own the merge, the commit and the PR, after the gates pass.

---

## 6. The briefs

Paths written as `<...>` are filled from `explorer`'s recon before the brief is sent — I do not hand a
worker a guessed path.

### 6.1 `explorer` — recon (spawn first)

```markdown
You are `explorer` on team `orders-export`, under `team-lead`. Read-only recon. Edit nothing.

Task:   map the code that `GET /api/orders/export` will touch, so the lead plans against reality.
Goal:   a factual `file:line` map of the route layer, the orders service/query layer, and the
        existing test conventions — plus the contract shapes as they exist TODAY.

Investigate and report:
  1. Route layer: where HTTP routes for `/api/orders` are declared (exact file:line), the
     registration pattern, and how an existing route reads/validates query params.
  2. Service layer: the module that queries orders, its function signatures, how it takes filters
     today, and whether any date-range filtering already exists.
  3. Any existing export/CSV/download path anywhere in the repo — file:line — and what it uses
     (a CSV library, hand-rolled serialization, streaming vs. buffering).
  4. Auth/tenancy: how routes in this area establish the caller and scope queries to a
     tenant/account/user. Report the mechanism as it is, do not judge it.
  5. Test conventions: runner, where API/integration tests live, naming pattern, how a test boots
     the app and seeds fixtures — file:line for one representative test to imitate.
  6. Error/response conventions for this route group (status codes, error body shape).
  7. Anything surprising.

If `graphify-out/graph.json` exists and is fresh, open with `graphify query` / `path` / `explain`
and cite the results; grep/glob are the follow-up, not the first move.

You never: propose final code, review or grade quality, or edit anything.

Deliverable: WRITE your findings to
  `.ai/runs/2026-07-26-orders-csv-export-phase1/recon.md`
The file IS the task — no file = task not done. Cite file:line, quote short excerpts only,
do not dump whole files.

Report: your REPORT IS the deliverable — not a summary for a human, not a status line. If you did
not finish, say so plainly and list what you did and did not establish. Never return empty.
Delivery: you are a SCOPED SUBAGENT — your final message is returned to the lead automatically,
so just end with it. Write the file as well; the file is what survives a dropped channel.
```

### 6.2 `be-dev` — the implementation (spawn after recon, contract pre-flight passed)

```markdown
You are `be-dev` on team `orders-export`, under `team-lead`.
Branch `<feature-branch>` is already checked out. Do not switch branches. Do not commit. Do not push.

Task:  claim Task #1 (Faza 1 — orders CSV export endpoint), mark it in_progress.

Goal:  implement `GET /api/orders/export` — returns the caller's orders as a CSV download,
       filtered by a date range — exactly as pinned by the frozen contract artifact below.
       Endpoint + service logic only. You do NOT write tests: the suite for this phase is authored
       by the `tester` role from the spec, deliberately without reading your implementation.

Files: EDIT ONLY these two:
         - `<path/to/routes/orders.*>`      — route declaration, param parsing/validation, response
                                               headers, wiring to the service
         - `<path/to/services/orders.*>`    — the query + CSV serialization
       READ for context (do not edit):
         - `<contract artifact path>`       — the frozen contract
         - `<spec path>`                    — the approved spec
         - `<reference implementation>`     — see Reference below
       Do not create new files unless the contract artifact requires a type that has no home; if you
       think you need a third file, STOP and escalate to the lead first.

Contract: `<contract artifact path>` — it is FROZEN and committed. IMPORT the types/schemas from it;
       do not restate, re-declare or locally widen them. Drift must be a compile/type error, not a
       review finding. It pins: the date-filter query params (names, types, bounds, timezone,
       format), the auth/tenancy scope, `Content-Type` + `Content-Disposition` + charset, the CSV
       column set AND ORDER, header row, delimiter, quoting and in-cell date rendering, and the
       error shapes. If you find the contract silent or ambiguous on something you need, that is a
       KEY DECISION: STOP and escalate to the lead. Do not choose it yourself, and do not infer it
       from what the database happens to contain.

Constraints: the toolchain is the constraint — lint, types and convention tests enforce no-`any`,
       import direction and the repo's conventions; do not re-litigate those. List here only what
       the machine cannot see:
       - The date filter is applied IN THE QUERY, not by fetching everything and filtering in
         memory.
       - Scope every row to the caller per the existing auth/tenancy mechanism. An export that
         crosses the tenant boundary is the worst possible bug in this phase.
       - CSV correctness is not string concatenation with commas: values containing the delimiter,
         quotes, newlines or a leading `=`/`+`/`-`/`@` must be handled per the contract.
       - No destructive commands. No schema/migration changes. No changes to any existing public
         response shape — this endpoint is additive.
       - Do not add a new dependency without escalating first.

Reference: imitate `<reference route/service file:line from recon>` for route registration, param
       validation, error responses and service structure. Match the house style rather than
       introducing a new one.

Verification: run before reporting, and paste the real output:
       - `<lint cmd>`
       - `<typecheck cmd>`
       - `<existing test suite cmd>` — the pre-existing suite must stay green; you are not
         adding tests to it
       - one real request against the locally running app for each of: a valid date range with
         results, a valid range with no results, an invalid/reversed range. Paste the status line,
         the response headers and the first few CSV lines verbatim.

Report: per-file diff summary · the exact command output above · the contract shape you honored
       (params in, headers + CSV columns out, error shapes) · any blocker or deviation, stated
       plainly. Your REPORT IS the deliverable — not a summary for a human, not a status line. If
       you did not finish, say so plainly and list what you did and did not establish. Never return
       empty.
Delivery: you are a SCOPED SUBAGENT — your final message returns to the lead automatically. End
       with it.
```

### 6.3 `tester` — the suite (spawn after `be-dev` is integrated, before `checker`)

Note the hard block inside this one: `tester` stops after the plan and the **human freezes it**. That
pause is part of the phase, not a surprise, and I surface it to the human up front.

```markdown
You are `tester` on team `orders-export`, under `team-lead`. Follow the `sailes-test` skill.
Branch `<feature-branch>` is checked out. Do not switch branches. Do not commit. Do not push.

Task: author the test suite for Phase 1 — `GET /api/orders/export`.

THE ORDER IS THE POINT — read it before you touch anything:
  1. Derive the expected behavior from `<spec path>` and `<contract artifact path>` ONLY, with the
     implementation UNREAD. Do not open `<path/to/routes/orders.*>` or
     `<path/to/services/orders.*>` at this stage. An oracle taken from the code encodes the code's
     bugs as expected values. Build your equivalence classes, boundaries, decision table and
     state/error transitions as working material — including a failure path per behavior.
     Cover at minimum: date-range boundary inclusivity, reversed range, missing params, malformed
     dates, timezone handling, empty result set, CSV escaping (delimiter / quote / newline /
     formula-injection prefixes in a value), column order and header row, response headers and
     filename, and the auth/tenancy scope of the rows returned.
  2. Emit the plan to `.ai/test-plans/<spec-name>.md` and STOP. Lead the plan with what you could
     NOT derive from the spec, phrased as real questions for the human. Do not write a single test
     while it says DRAFT. The human freezes it; the lead will tell you when it says FROZEN.
  3. Then write the suite from the frozen list — one test per behavior ID, the ID in the test name.
     Run the tests as you write them.
  4. THEN read the diff, and ADD edge cases only. Weakening or deleting a frozen assertion is
     forbidden. A red frozen test is a DEFECT YOU REPORT to the lead — not code you fix. Your
     Write/Edit is for test files only; touching `<routes>`/`<services>` is `be-dev`'s lane and
     hides the defect the red test just found.
  5. Prove detection at the tier the feature EARNS — computed from the triggers table, never from
     your judgment. You may raise, never lower, and a raise is recorded in the plan with its
     reason. Note explicitly: an export endpoint reads data, which points at tier C, but if this
     endpoint carries a permissions/tenancy scope then the tenancy trigger applies and the tier is
     A. Compute it from the trigger, state which trigger fired, and run the matching proof
     (A → Stryker on touched files, every surviving mutant killed or explained; B → per-B-ID
     break → red → revert → suite green; C → green suite).

Files: WRITE only `<path/to/tests/orders-export.*>` (and `.ai/test-plans/<spec-name>.md`). Follow
       the runner, fixture and app-boot conventions at `<representative test file:line from recon>`.

Constraints: no `sleep` — poll for a condition or control the clock; seed randomness and print the
       seed on failure; fresh state per test, no shared mutable fixtures, must pass under randomized
       order; auto-retry to green is banned. Never mock something this app owns. Never write an
       assertion that cannot fail. Never gate on line coverage. Do not report a manual step as
       performed — put it on the checklist and mark that behavior UNVERIFIED.
       If the repo has no runner, fixtures or seed path, report ENV-DEFECT with a concrete setup
       proposal for the human — do not stand it up yourself.

Deliverables (files, both): `.ai/test-plans/<spec-name>.md` and the suite file. No files = task not
       done.
Report: the frozen plan path · the suite written (one test per ID) · the detection-proof table or
       Stryker output with the tier and the trigger that set it · everything on the
       UNVERIFIED / Requires-you list · blockers. Your REPORT IS the deliverable. If you did not
       finish — including because you are correctly blocked at the freeze — say so plainly and list
       what you did and did not establish. Never return empty.
Delivery: SCOPED SUBAGENT — final message returns automatically. End with it.
```

### 6.4 `checker` — review gate (clean context)

Sent with the diff, the spec/contract and the checklist. **`be-dev`'s report does not travel with it.**

```markdown
You are `checker` on team `orders-export`, under `team-lead`. You are the independent review gate.
Read-only: you may run lint/type/tests to confirm the machine's guarantees hold, and nothing more.

Inputs, and these are all you get:
  - the diff: `git diff <base>..<feature-branch>` (routes, services, tests)
  - the spec: `<spec path>`
  - the frozen contract: `<contract artifact path>`
  - the frozen test plan: `.ai/test-plans/<spec-name>.md`
  - the review checklist: `<checklist path>`
You are NOT given the implementer's report or reasoning, and must not ask for it. If you wonder why
something was done a certain way, the answer is the spec — not anyone's story about the code.

Review the diff strictly against the spec, the contract and the checklist. Spend your capacity on
what machines cannot see: spec fit, naming, design intent, edge cases, scope creep. Do NOT re-check
what lint/types/convention tests already enforce.

Specific to this phase, check at least:
  - the response matches the contract exactly: params consumed, headers emitted, CSV column set and
    ORDER, header row, delimiter/quoting, in-cell date rendering, error shapes;
  - the date filter is applied in the query, not in memory after fetching everything;
  - every returned row is scoped to the caller per the repo's auth/tenancy mechanism — a row that
    escapes that scope is CHANGES-REQUIRED on its own;
  - CSV values containing the delimiter, quotes, newlines or a leading `=`/`+`/`-`/`@` are handled;
  - scope creep: only the route file, the service file and the test file should have changed;
  - test-plan coverage: EVERY non-struck behavior ID in the frozen plan must have a test whose name
    carries that ID. A frozen ID with no matching test is a defect. Also read the assertions — an
    assertion quietly weakened under a kept ID is yours to catch, since only you can see it.

Verdict: exactly one of APPROVE / NITS / CHANGES-REQUIRED. On CHANGES-REQUIRED, name each concrete
defect and the spec or contract clause it violates — the verdict loops the work to a fresh worker,
so be precise and actionable.

Deliverable: WRITE the verdict to
  `.ai/runs/2026-07-26-orders-csv-export-phase1/VERDICT-checker.md`
The file IS the task — no file = task not done. Paste any command output you relied on, verbatim.

Report: your REPORT IS the deliverable — not a summary for a human, not a status line. If you did
not finish, say so plainly and list what you did and did not establish. Never return empty.
Delivery: SCOPED SUBAGENT — final message returns automatically. End with it.
```

### 6.5 `qa` — behavior proof (final gate)

```markdown
You are `qa` on team `orders-export`, under `team-lead`. You are the behavior-proof gate: done means
the running system was observed doing the thing, not that the build is green.

Inputs, and these are all you get: the running app, and the spec's expected behavior at
`<spec path>` + `<contract artifact path>`. You do not receive the implementation story.

Do:
  1. Run the `tester` suite against the live app. THIS RUN IS THE GATE VERDICT — `tester` proved the
     suite detects; you are the independent second run, in a fresh context, on the real system. A
     suite that passes for `tester` and not for you is a finding, not a rounding error. Paste the
     raw output.
  2. Drive the real end-to-end flow: issue actual `GET /api/orders/export` requests against the
     running app as an authenticated caller — a date range with results, a range with none, a
     reversed/invalid range, and a range whose data contains a value with a comma, a quote, a
     newline and a leading `=`. For each: paste the status line and response headers, and SAVE the
     returned CSV to `.ai/runs/2026-07-26-orders-csv-export-phase1/artifacts/`.
  3. Open at least one saved CSV in a spreadsheet-equivalent parse and confirm it parses into the
     contract's columns in the contract's order — a CSV that only looks right as text is not proven.
  4. Confirm rows are scoped to the caller: request as a second account with its own data and show
     that account's export contains none of the first account's rows.

This phase paints no UI. There is no design artifact, no vision-verify and no `.ai/screens/`
baseline, and the `browser-inspect` integrity probe does not apply — state that explicitly in the
verdict rather than leaving it unmentioned.

Never fake or skip a pass because the stack will not boot or creds/fixtures are missing. That is a
bootstrap defect, not a QA judgment call: report ENV-DEFECT naming exactly what is missing, and the
lead escalates. A waved-through pass is never the answer to a broken environment.

Verdict: PASS (flow observed working, evidence saved) / CHANGES-REQUIRED (the concrete behavioral
difference) / ENV-DEFECT (exactly what is missing).

Deliverable: WRITE the verdict to
  `.ai/runs/2026-07-26-orders-csv-export-phase1/VERDICT-qa.md`, with the raw suite output and the
paths of the saved CSV artifacts pasted in. The file IS the task — no file = task not done.

Report: your REPORT IS the deliverable — not a summary for a human, not a status line. If you did
not finish, say so plainly and list what you did and did not establish. Never return empty.
Delivery: SCOPED SUBAGENT — final message returns automatically. End with it.
```

---

## 7. Integration, loops, and what "done" means

1. `explorer` returns → I read `recon.md` from disk → fill the `<...>` placeholders → run the
   contract pre-flight (§3).
2. `be-dev` returns → I read the diff myself, integrate, and keep its report **for my integration
   only**. It does not travel to `checker`.
3. `tester` runs. It will stop at the freeze; I take the plan to the human, get `FROZEN`, and let it
   continue. A red frozen test is a defect report to me, and it loops back to a **fresh** `be-dev`
   with a brief naming the specific failing behavior ID — never to `tester` to "fix".
4. `checker` → `qa`. CHANGES-REQUIRED from either loops back to a fresh worker in the right lane;
   the gates then re-run. No gate is skipped on a second pass.
5. Only after `qa` PASSes do I commit and open the PR. Workers never commit or push.
6. Before walking away — done or interrupted — I update `.ai/STATE.md` with verified facts plus
   evidence, open failures and a Last-session pointer, and land anything a worker hit (a wrong
   assumption in a brief, a contract that did not hold, a tool that failed silently) in
   `.ai/lessons.md` as Context / Problem / Rule / Applies-to, plus the delegation in `.ai/runs/`.

**Done for this phase** = `qa` observed the running app returning a correct, correctly-escaped,
correctly-scoped CSV for the specified date ranges, with the suite green on its own independent run.
Green build is not done.

## 8. Run log skeleton

Kept at `.ai/runs/2026-07-26-orders-csv-export-phase1/run-log.md`, filled as it happens. An empty
return is recorded as an empty return — hiding one is how the same failure repeats next session, and
"released" is written only for a confirmed termination.

| # | Agent | Model · effort | Override reason | Spawned | Returned | Gate verdict | Released |
|---|---|---|---|---|---|---|---|
| 1 | `explorer` | haiku-4-5 · n/a | none (role default) | — | — | n/a | — |
| 2 | `be-dev` | sonnet-5 · high | none (role default) | — | — | n/a | — |
| 3 | `tester` | sonnet-5 · high | none (role default) | — | — | tier + proof | — |
| 4 | `checker` | sonnet-5 · high | none (role default) | — | — | APPROVE/NITS/CR | — |
| 5 | `qa` | sonnet-5 · high | none (role default) | — | — | PASS/CR/ENV-DEFECT | — |

Also logged, because a non-decision is still a decision: **no model override was used on this phase**,
and **no work was taken solo by the lead**.

---

*Dry-run: no agents were spawned and no project code was written. This document is the plan and the
briefs, nothing has been executed.*

# Execution plan — `GET /api/invoices/:id/lines` (pagination + tests)

**Role:** `team-lead` · **Mode:** planning dry-run (nothing executed, nothing spawned, no project code written)
**Date:** 2026-07-26 · **Repo:** `D:\Work\Internal\sailes-app-builder-skill`
**Phase:** backend-only, approved spec, BE contract frozen, ~3 files.

---

## 0. Environment finding — the briefing's premise is false, and it changes the whole plan

I was told: *"The Sailes plugin is not installed on this machine. The only agent types available to you are `general-purpose`, `Explore` and `Plan`. None of the Sailes roles resolve here."*

Doctrine says an unresolvable roster is itself a finding and that I must **check before concluding anything about the framework's behaviour from such a run** (`agent-team-structure.md` §"Spawn the named role"). I checked. The claim is wrong on every clause:

| Checked | Result |
|---|---|
| `~/.claude/settings.json` | `"enabledPlugins": { "sailes-app-builder@sailes": true }` |
| `~/.claude/plugins/installed_plugins.json` | `sailes-app-builder@sailes` **v1.16.0**, scope `user`, installed 2026-07-26T07:55:49Z, sha `20a8b54` |
| Install path | `C:\Users\karol\.claude\plugins\cache\sailes\sailes-app-builder\1.16.0` |
| `…/1.16.0/agents/` | `be-dev.md · checker.md · designer.md · explorer.md · fe-dev.md · qa.md · team-lead.md · tester.md` |
| Session agent-type roster | `sailes-app-builder:explorer`, `:be-dev`, `:tester`, `:checker`, `:qa`, `:designer`, `:fe-dev`, `:team-lead` all resolve |

**The named roles resolve. Therefore `general-purpose` is not available to me here.** It is the last resort and legitimate *exactly* when the named type does not resolve. It resolves, so every worker below is spawned as its own agent type. Had I accepted the premise, I would have staffed the entire phase with stand-ins on the session model with no tool allow-list and no routing — and the run would have tested my briefs rather than the roles, invisibly.

**Three corollaries I read off the same check, because they change the plan rather than decorate it:**

1. **`CLAUDE_CODE_SUBAGENT_MODEL` is not set.** Verified against the process environment (only `CLAUDE_CODE_CHILD_SESSION`, `CLAUDE_CODE_SESSION_ID`, `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, `CLAUDE_CODE_ENTRYPOINT`, `CLAUDE_CODE_EXECPATH` are present). Resolution is `env → my per-invocation param → role frontmatter`. With the env slot empty and me passing no override, **every model below is decided by the role file, not by me.** That is the mechanism the whole "spawn the named role" rule exists to preserve.
2. **`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is NOT set → teams mode is OFF.** So these are **scoped subagents**: each returns once and ends. Release *is* the return; there is nothing to confirm and no `shutdown_request` to send. Quoting the live-teammate release procedure here would produce a plan that reads correct and cannot be run. Every `Delivery:` line below must therefore say *scoped subagent*, not *background teammate* — the worker cannot tell which it is in, and only I know.
3. **`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=2` is set**, so sub-teams are *technically* possible. The human has not asked for them, so I do not open them. A wide task is not a reason; this one is not even wide.

**Incidental defect worth logging:** installed 1.16.0 is pinned at sha `20a8b54`, three commits behind working-tree HEAD (`1697cd1`). The installed `agents/` still contains `README.md`, which is why a phantom agent type `sailes-app-builder:README` appears in this session's roster. The fix (`1697cd1`) is committed but not yet released/pulled into the cache. Not a blocker for this phase; it is a release-hygiene item.

---

## 1. Team shape

Pipeline is `explorer → designer → BE contract finalized → fe-dev → tester → checker → qa`.

- **`designer` and `fe-dev` are dropped** — backend-only phase, no UI surface. Dropping is **provisional**: if anything in this phase forces a user-visible surface (e.g. a perf finding pushes pagination toward an async/streamed shape with a UI affordance), I reinstate `designer` and re-freeze the contract before any `fe-dev` starts.
- **No gate is dropped.** `tester`, `checker`, `qa` all run. Three files is small; the gate scales down, it never disappears.
- **The BE contract is already frozen** (given) and the spec approved, so there is nothing here I must escalate to the human. My authority covers assembling and freezing from settled decisions; nothing new is being decided. If `explorer` reports the frozen contract artifact does not actually exist as a committed typed artifact both slices import — only as prose — that becomes a key decision and I stop and escalate.
- **Sequencing is strictly serial.** Five workers, one alive at a time, zero fan-out. File-disjointness is trivially satisfied because nothing runs concurrently. This is also the deliberate brake: Opus 5 reaches for subagents readily, and the guidance is to cap spawn counts, not to parallelize a three-file phase.

**Do I delegate the implementation at all?** Yes. ~3 files is above the one-file line where spawn + brief + report + integration overhead exceeds the saving. "I'll just write this one myself" would be the expensive failure mode this role exists to prevent. Below that line I would code it solo and say so — here I am above it.

---

## 2. Workers

Notation: `agent type` is the **exact string** passed as `subagent_type`. It is namespaced `plugin:role` — passing bare `be-dev` would not resolve.

---

### Worker 1 — recon

**1. Agent type (exact):** `sailes-app-builder:explorer`

**2. Model, and how it is decided:** `claude-haiku-4-5`, **no `effort` line**. Decided by the role's frontmatter — I pass **no** `model` and **no** `effort` parameter. `effort` is unsupported on Haiku 4.5 (dated 2026-07-26), so `explorer` cannot be tuned that way; if recon needed more, I would escalate its *model*. It does not: the target is three files plus their pagination/auth conventions, nowhere near Haiku's 200K context ceiling (vs 1M on Sonnet/Opus), which is the real constraint on whole-repo recon. **Default, considered and kept.**

**3. Brief:**

```markdown
You are `explorer` on team `invoices-lines`, under `team-lead`.
Read-only recon. Do not propose code. Do not review quality. Do not edit anything.

Goal: map the ground truth for adding GET /api/invoices/:id/lines with pagination,
      so the lead plans against reality rather than assumption.

Report, as file:line findings:
  1. The invoices route module and its sibling list endpoints — exact paths.
  2. The repo's EXISTING pagination convention: cursor vs offset/limit, param names,
     response envelope shape, default and max page size. Cite the file:line where each
     is established, and flag any place two conventions disagree.
  3. The frozen contract artifact for this endpoint: its exact path, whether it is a
     committed typed artifact (shared TS types / Zod / OpenAPI) that both slices import,
     or only prose in the spec. State which — this determines whether the lead may proceed.
  4. The auth / tenancy guard applied to sibling invoice routes: which middleware, where
     applied, and how invoice ownership is scoped to the caller's tenant.
  5. The data-access layer for invoice lines: query builder or ORM, the existing shape,
     and whether an index supports ordering by the pagination key.
  6. The test harness: framework, where API tests live, how a test gets an authed client
     and seeded fixtures. Name the exact runner command.

Report: your REPORT IS the deliverable — not a summary for a human, not a status line.
        If you did not finish, say so plainly and list what you did and did not establish.
        Report unknowns as unknowns; a guessed convention is worse than a gap.
        Never return empty.
Delivery: you are a SCOPED SUBAGENT — your final message is returned automatically.
          Just end with it. Do not attempt SendMessage.
```

**4. What I record, and where:** In `.ai/runs/2026-07-26-invoice-lines-pagination.md` under the run log — spawned type `sailes-app-builder:explorer`, tier `claude-haiku-4-5 · (no effort — unsupported on Haiku 4.5)`, **marked DEFAULT, escalation axis considered and rejected: scope is three files, not whole-repo recon**; what it returned (or, verbatim, *empty return*); released = returned (scoped subagent, automatic). If it reports the contract is prose rather than a committed artifact, that goes in the run log as a blocker and to the human before Worker 2 spawns.

---

### Worker 2 — implementation

**1. Agent type (exact):** `sailes-app-builder:be-dev`

**2. Model, and how it is decided:** `claude-sonnet-5 · effort: high`. Decided by the role's frontmatter — I pass **no** override. **Default, and the escalation axis was considered and deliberately rejected:** the judgment in this task (contract shape, pagination semantics, tenancy scoping) was already settled by the approved spec and the frozen contract. What remains is typing against a fixed target. Opus is for tasks whose difficulty is in the *judgment* — a contract surface still being designed, a data-model or auth decision, a diagnosis with no mechanism. Escalating here because "it is an API endpoint" would be the volume misread wearing a contract's clothes. Recorded as a non-override so a later reader can tell I looked.

**3. Brief:**

```markdown
You are `be-dev` on team `invoices-lines`, under `team-lead`.
Branch `feat/invoice-lines-pagination` is already checked out.
Do not switch branches. Do not commit. Do not push.

Goal:        implement GET /api/invoices/:id/lines with pagination, exactly as the
             approved spec and the frozen contract define it. No more, no less.

Files:       <the ~3 impl paths confirmed by explorer — route handler, data-access
             query, and the wiring/registration point>. Do NOT write test files:
             the suite is authored by `tester` in a separate pass, from the spec,
             with your implementation unread. Writing tests here defeats that barrier.

Contract:    <exact path to the frozen typed contract artifact>. It is FROZEN. Import
             it; do not restate its shapes inline and do not "improve" it. If the
             implementation cannot satisfy it as written, STOP and escalate to the
             lead — do not adjust the contract to fit the code.

Constraints: the toolchain is the constraint (lint / types / convention tests enforce
             no-any, import direction). Listed here is only what it cannot see:
             - tenancy: an invoice id belonging to another tenant must not leak lines
               or leak existence; follow the guard sibling invoice routes use.
             - the response envelope and page-size default/max are the repo's existing
               convention (see brief's Reference), not a new one.
             - backward-compatible public contract; no destructive commands; no
               schema/migration changes in this phase.
Reference:   imitate <sibling paginated endpoint file:line from explorer> — same
             envelope, same param parsing, same error mapping.
Verification: <exact lint / typecheck / test commands from explorer> must pass, plus
             one manual curl of the endpoint against a seeded fixture, output pasted.
Report:      per-file diff summary · command output · the contract shape as implemented ·
             blockers and any deviation from the brief, named explicitly.
             Your REPORT IS the deliverable — not a summary for a human, not a status
             line. If you did not finish, say so plainly and list what you did and did
             not establish. Never return empty.
Delivery:    you are a SCOPED SUBAGENT — your final message is returned automatically.
             Just end with it. Do not attempt SendMessage.
```

**4. What I record, and where:** `.ai/runs/…` — spawned type, tier `claude-sonnet-5 · high` **marked DEFAULT (Opus considered, rejected: judgment pre-settled by frozen contract)**, per-file diff summary, verification output, released = returned. Any wrong assumption it hit in my brief — a convention that did not hold, a contract that did not fit, a tool that failed silently — is harvested into `.ai/lessons.md` as Context / Problem / Rule / Applies-to **before** I move on, because the message queue does not survive a context reset and disk does. Its report feeds **my integration only** and is never forwarded to `checker`.

---

### Worker 3 — test gate (authoring)

**1. Agent type (exact):** `sailes-app-builder:tester`

**2. Model, and how it is decided:** `claude-sonnet-5 · effort: high`, from the role frontmatter; no override from me. **Default, kept deliberately** — deriving fault-detecting cases from a spec is judgment, so this is not a downgrade candidate; and the judgment is bounded by an approved spec, so it is not an escalation candidate either.

**3. Brief:**

```markdown
You are `tester` on team `invoices-lines`, under `team-lead`. Follow `sailes-test`.
Branch `feat/invoice-lines-pagination` is checked out. Do not commit. Do not push.

Goal: author the suite for the GET /api/invoices/:id/lines pagination phase.

HARD ORDER — the informational barrier is the point:
  1. Derive expected behavior from the SPEC and the frozen CONTRACT with the
     implementation UNREAD. Do not open the route handler or the query file yet.
  2. Write the case list to `.ai/test-plans/invoice-lines-pagination.md` and STOP.
     The human freezes that list. Return to the lead at this point.
  3. Only after the freeze: write the suite, then ADD-only cases from the diff.
  4. Prove detection — show each assertion goes RED against a deliberately broken
     implementation, not merely green against the real one.

Cover at minimum: first page · middle page · last page · empty result · page size at
default, at max, and above max · malformed/absent pagination params · unknown invoice id ·
an invoice belonging to another tenant (must not leak lines or existence) · stable
ordering across pages with no duplicates and no skips.

Files: test files only, under <test dir from explorer>. Do not edit implementation files —
       `be-dev` owns those; we are file-disjoint by design. If a test cannot pass without
       an implementation change, that is a FINDING you report, not a change you make.
Never weaken an assertion to make it pass. Never lower your own risk tier.

Deliverables — BOTH are FILES, and no file = task not done:
  · `.ai/test-plans/invoice-lines-pagination.md` (the frozen case list)
  · the suite files themselves
Report: paste the raw runner output — the red run and the green run — into your report.
        Your REPORT IS the deliverable alongside those files. If you did not finish, say
        so plainly and list what you did and did not establish. Never return empty.
Delivery: you are a SCOPED SUBAGENT — your final message is returned automatically.
          Just end with it. Do not attempt SendMessage.
```

**4. What I record, and where:** `.ai/runs/…` — tier marked DEFAULT; the frozen case-list path; **the human-freeze checkpoint between step 2 and step 3, logged as a pause I own** (this is the tester protocol, not a key-decision escalation — but the pipeline genuinely stops here); the red-run/green-run evidence; released = returned. I read `.ai/test-plans/invoice-lines-pagination.md` **from disk** rather than trusting the message — the file is the artifact that survives a dropped channel, and the measured record is four message-deliverable briefs → six empty returns vs. one file-deliverable brief → a gradable artifact first try.

---

### Worker 4 — review gate

**1. Agent type (exact):** `sailes-app-builder:checker`

**2. Model, and how it is decided:** `claude-sonnet-5 · effort: high`, from the role frontmatter; no override. **Default.** Note this is a case where spawning the named type is load-bearing beyond routing: `checker`'s frontmatter `tools: Glob, Grep, Read, Bash` is what keeps `Write`/`Edit` **absent from its schema**, and the omission of `Agent` is what stops it fanning out. A stand-in would have both. (Honest caveat I do not paper over: `checker` carries `Bash` because it must run lint/types/tests, and a `Bash`-capable agent can write a file. "Read-only" is prose discipline, not a boundary. What actually protects this verdict is the input isolation below.)

**3. Brief:**

```markdown
You are `checker` on team `invoices-lines`, under `team-lead`. Independent review gate.

You receive ONLY these three things, and you must not ask for more:
  1. The diff:      `git diff <base>..HEAD` on branch feat/invoice-lines-pagination
  2. The spec/contract: <spec path> and <frozen contract artifact path>
  3. The review checklist

You will NOT be given the implementer's report, reasoning, or self-assessment, and you
must not seek it out. If you find yourself asking "why was this done this way?", the
answer is the spec — not anyone's story about the spec.

Review the ARTIFACT, not the narrative. Do not re-check what the toolchain already
enforces (no-any, import direction, formatting) — spend your capacity on what machines
cannot see: does the diff match the spec; does it honor the frozen contract exactly;
pagination edge cases; tenancy leakage including leaking existence via error shape;
error mapping; naming; scope creep beyond the approved phase.

Verdict: APPROVE / NITS / CHANGES-REQUIRED. For CHANGES-REQUIRED, name each concrete
defect with file:line and the spec clause it violates — a verdict I cannot act on
without asking you a follow-up is not a verdict.

Deliverable — a FILE: `.ai/eval-runs/2026-07-26-rerun/checker-verdict-invoice-lines.md`.
No file = task not done. Paste raw command output for anything you ran.
Report: your report restates the verdict; the FILE is the artifact. If you did not
        finish, say so plainly and list what you did and did not establish. Never return empty.
Delivery: you are a SCOPED SUBAGENT — your final message is returned automatically.
          Just end with it. Do not attempt SendMessage.
```

**4. What I record, and where:** `.ai/runs/…` — tier marked DEFAULT; the verdict, read **from the verdict file on disk**; and, on CHANGES-REQUIRED, that the loop goes back to a **freshly spawned** `sailes-app-builder:be-dev` with a clean, explicit scope — never the stale Worker 2 carried forward, and never me patching it myself. The critical negative I record explicitly: **Worker 2's report was NOT forwarded to this gate.**

---

### Worker 5 — behavior proof

**1. Agent type (exact):** `sailes-app-builder:qa`

**2. Model, and how it is decided:** `claude-sonnet-5 · effort: high`, from the role frontmatter; no override. **Default.** I considered the documented downgrade — a phase's `Done-when` is a pass/fail read of exact commands against expected output and a lightweight model can grade it — and rejected it: `qa`'s job here is not only that binary read but driving the real flow and judging whether observed behavior matches the spec's intent, including the negative tenancy case. Recorded as considered-and-rejected so a later reader can tell the axis was examined.

**3. Brief:**

```markdown
You are `qa` on team `invoices-lines`, under `team-lead`. Final gate: behavior proof.
Done means the RUNNING system was observed doing the thing — not that the build is green.

You receive ONLY: the running app, and the spec's expected behavior (<spec path>).
No design artifact and no vision-verify pass: this phase touches no UI.
You are NOT given the implementation story, and you must not ask for it.

Do:
  1. Boot the stack and seed fixtures: <commands from explorer>.
  2. Run the `tester` suite against the LIVE app — this run IS the gate verdict. You are
     the independent second run in a fresh context. A suite that is green for `tester`
     and not for you is a finding, not a rounding error — report it as such.
  3. Drive the real flow yourself against the running API: page through a multi-page
     invoice start to finish and confirm no duplicated and no skipped lines across the
     boundaries; request a page beyond the end; request page size above max; request an
     invoice belonging to another tenant and confirm nothing leaks, including existence.
  4. Paste raw request/response evidence for each — not a description of it.

If the stack will not boot, or creds/fixtures are missing, report `ENV-DEFECT` naming
exactly what is missing. That is a bootstrap defect for the lead to escalate — it is NOT
your judgment call, and a faked or skipped pass is never the answer to a broken environment.

Deliverable — a FILE: `.ai/eval-runs/2026-07-26-rerun/qa-behavior-proof-invoice-lines.md`
containing the verdict, the raw suite output, and the per-scenario evidence.
No file = task not done.
Report: your report restates the verdict; the FILE is the artifact. If you did not
        finish, say so plainly and list what you did and did not establish. Never return empty.
Delivery: you are a SCOPED SUBAGENT — your final message is returned automatically.
          Just end with it. Do not attempt SendMessage.
```

**4. What I record, and where:** `.ai/runs/…` — tier marked DEFAULT (downgrade-to-haiku considered, rejected: this is not a pure binary read); the verdict from the proof file on disk; `ENV-DEFECT` recorded as an **environment escalation to the human**, never as a pass and never as a fail against the code. Only after `qa` passes do I integrate, commit and open the PR — **no worker commits or pushes**; that is mine.

---

## 3. Model routing summary — including the non-overrides

Recording only deviations would leave the volume-misread invisible: nobody could later tell a phase where I considered escalation and rejected it from one where I never looked.

| # | Agent type (exact) | Tier | Source | Override? |
|---|---|---|---|---|
| 1 | `sailes-app-builder:explorer` | `claude-haiku-4-5` (no effort) | role frontmatter | **No — default.** Escalation rejected: 3-file scope, far under Haiku's 200K ceiling. `effort` unsupported on Haiku 4.5 regardless. |
| 2 | `sailes-app-builder:be-dev` | `claude-sonnet-5 · high` | role frontmatter | **No — default.** Opus rejected: judgment pre-settled by approved spec + frozen contract; what remains is typing. |
| 3 | `sailes-app-builder:tester` | `claude-sonnet-5 · high` | role frontmatter | **No — default.** Neither escalation nor downgrade: case derivation is judgment, bounded by the spec. |
| 4 | `sailes-app-builder:checker` | `claude-sonnet-5 · high` | role frontmatter | **No — default.** |
| 5 | `sailes-app-builder:qa` | `claude-sonnet-5 · high` | role frontmatter | **No — default.** Haiku downgrade rejected: not a pure `Done-when` binary read. |

**Zero overrides this phase**, so there is no escalation for me to retrospectively grade as paid-off-or-not. If I had escalated, the run log would owe an entry stating whether the expensive run caught something the default would have missed — a log that cannot say an override was *wrong* is a receipt, not a record.

---

## 4. Where the records live

| Artifact | Path | Contents |
|---|---|---|
| Run log | `.ai/runs/2026-07-26-invoice-lines-pagination.md` | Per worker: agent type spawned, tier + whether default or override + reason, brief summary, what it returned (**an empty return recorded verbatim as an empty return**), gate verdict, released. |
| Lessons | `.ai/lessons.md` | Harvested **before** each worker is released, Context / Problem / Rule / Applies-to. Already owed from this planning pass: the environment finding in §0. |
| Test plan | `.ai/test-plans/invoice-lines-pagination.md` | `tester`'s human-frozen case list. |
| Checker verdict | `.ai/eval-runs/2026-07-26-rerun/checker-verdict-invoice-lines.md` | Gate artifact, read from disk. |
| QA proof | `.ai/eval-runs/2026-07-26-rerun/qa-behavior-proof-invoice-lines.md` | Gate artifact, read from disk. |
| State | `.ai/STATE.md` | Updated **before walking away**: verified facts with evidence, open failures, Last-session pointer — so a context reset resumes without re-deriving this plan. |

**Lesson owed to `.ai/lessons.md` from this pass:**

> **Context:** Planning a phase where the briefing asserted the Sailes plugin was absent and only built-in agent types resolved.
> **Problem:** The assertion was false — `sailes-app-builder@sailes` v1.16.0 was installed at user scope and all eight roles resolved. Accepting it would have staffed the phase with `general-purpose` stand-ins: no model routing, no tool allow-list, `Agent` available to gate roles, and nothing reporting the substitution. The run would have tested the briefs rather than the roles, and no later reader could have told the difference.
> **Rule:** A claim that the roles do not resolve is a claim to verify, not a premise to accept — check `~/.claude/settings.json` `enabledPlugins`, `~/.claude/plugins/installed_plugins.json`, and the session's agent-type roster before reaching for `general-purpose`. The doctrine already says an unresolvable roster is *the finding*; the converse holds equally — a falsely-asserted one is also the finding.
> **Applies-to:** `team-lead`, any run whose environment is described to it rather than observed by it.

---

## 5. Contingencies

- **`checker` returns CHANGES-REQUIRED** → fresh `sailes-app-builder:be-dev` spawn with a clean scope naming only the defects. Not the stale Worker 2. Not me.
- **`qa` returns ENV-DEFECT** → escalate to the human; the fix is the seed/boot path. Never a faked pass.
- **A worker goes idle with no report** → chase **once**, explicitly asking for the report and for a plain statement of what it did and did not establish. Still empty → escalate to the human naming which delegation produced nothing. I do **not** re-spawn on a guess and do **not** quietly do the work myself. And I do not assume negligence: on 2026-07-25 all four silent workers had in fact finished with full reports and the channel had dropped them; two were re-spawned for nothing. This is also why every gate deliverable above is a FILE.
- **`explorer` reports the "frozen" contract is prose, not a committed typed artifact** → the freeze is not real; drift would surface as a review finding instead of a compile error. I stop before Worker 2 and escalate, because producing that artifact where none was specified would be me picking a contract surface mid-pipeline.
- **A UI surface appears** (e.g. perf forces an async shape) → reinstate `sailes-app-builder:designer`, re-freeze the contract, then `sailes-app-builder:fe-dev`. Dropped roles are provisional.
- **Sub-teams** → not opened. The human has not asked, and this phase is nowhere near wide enough. `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=2` being set makes it possible, not warranted.

---

## 6. Dry-run compliance

Nothing was executed, no agent was spawned, no project code was written. Reads were confined to `agents/team-lead.md`, `skills/sailes-bootstrap/agent-team-structure.md`, and the installed-plugin/settings metadata used to verify the environment claim. **Nothing under `evals/` was read.** The only file written is this plan.

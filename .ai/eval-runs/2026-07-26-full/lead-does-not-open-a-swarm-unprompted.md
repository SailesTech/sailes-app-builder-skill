# Execution plan — billing · notifications · admin panel

**Role:** `team-lead` (single point of contact for the human)
**Date:** 2026-07-26
**Mode:** planning dry-run — nothing spawned, no project code written, no repo touched but this file.
**Inputs read:** `agents/team-lead.md`, `skills/sailes-bootstrap/agent-team-structure.md`, `.ai/lessons.md`, `~/.claude/settings.json`, live env.

---

## 0. The decision that comes before the plan: one team, not three

The situation is wide (three slices), explicitly parallelizable (different modules, no shared files),
and about a week long. **None of that opens sub-teams.** Commando mode is human-triggered only, and
the human has not asked. So this runs as **one team under one lead — me — with parallel workers
inside it.**

The distinction I am holding onto: **parallelism is a property of the work; a sub-team is a change of
authority.** Three modules with disjoint files justify running several workers at once. They do not
justify handing planning, briefing and integration to three additional `team-lead`s, because that
buys nothing here — the contracts are already frozen and the spec is approved, so there is no second
or third contract to design. Sub-leads would add a layer of relay between me and the work while the
gates, the merge and the human contact all stay mine regardless.

**Capability is present on this machine; authorization is not.** Measured just now:

- `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=2` **is set** in the live env — nesting works, so I *could*
  spawn three `sailes-app-builder:team-lead` sub-leads today and they would each spawn workers.
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is **not set** (absent from `~/.claude/settings.json` and
  from the environment) — so delegation runs on the **fallback path**: scoped subagents, each returns
  once and ends.

Recording that the mode is available and still not being used is the point. "It would have worked" is
not authorization.

**The same misread, on two axes, is what this plan refuses twice:**

| Axis | The tempting misread | What the doctrine actually keys on |
|---|---|---|
| Fan-out | "a week of work across three modules → open sub-teams" | only the human opens sub-teams |
| Model routing | "a week of work → escalate workers to `opus`" | escalate on *judgment*, never on volume |

Volume is not a reason to escalate a model; breadth is not a reason to open a second team.

**Maximum fan-out I will run: 4 concurrent workers, 15 spawns total.** That is a ceiling I am setting
deliberately, not a number the work forced on me. I do not split a slice across two workers to go
faster, and I do not add a worker per file.

---

## 1. What the situation does and does not settle

Given: spec approved, all BE contracts frozen, slices independent, no shared files → **nothing to
escalate to the human right now.** Two clarifications so that does not get overread:

- **"Frozen contract" ≠ "backend implemented."** Frozen means a committed, typed artifact both slices
  import (shared TS types / Zod schemas / OpenAPI). It is what lets `fe-dev` start without waiting for
  `be-dev`. It is not a claim the BE code exists. Wave 0 verifies which of the two is true; if the
  backends are in fact already built, the three `be-dev` spawns drop and the plan shortens.
- **"Nothing to escalate" ≠ "no human in the loop."** Two human touch-points survive an approved spec
  and are not escalations, they are gates: the `tester` case list must be **frozen by the human**
  before any test is written, and a `qa` `ENV-DEFECT` (stack won't boot, creds/fixtures missing) goes
  to the human rather than being papered over.

**The one claim I verify rather than bank on: "no shared files."** That is an assertion in the spec,
and file-disjointness is *my* invariant — the whole parallel plan collapses if it is wrong. Realistic
seams three feature slices almost always share: a route/module registry, the DB migration chain, a
nav or menu definition (an admin panel almost certainly adds entries), i18n catalogs, `package.json`,
env schema. Wave 0 exists to produce that seam list before anything runs concurrently.

---

## 2. Roles convened — exact agent types as I would pass them

Named roles only. `general-purpose` is not in this plan; it is a last resort for when a named type
does not resolve, and all seven resolve here (confirmed against the runtime's agent-type list).

| # | Agent type (verbatim) | Count | Why |
|---|---|---|---|
| 1 | `sailes-app-builder:explorer` | 1 | recon: verify contract artifacts + produce the seam list |
| 2 | `sailes-app-builder:designer` | 1 | UI spec for every slice that has a UI surface |
| 3 | `sailes-app-builder:be-dev` | 3 | one per slice, concurrent |
| 4 | `sailes-app-builder:fe-dev` | 3 | one per slice, concurrent |
| 5 | `sailes-app-builder:tester` | 3 | per slice = per phase; `tester` runs per phase, not once at the end |
| 6 | `sailes-app-builder:checker` | 3 | one per slice diff, clean context each |
| 7 | `sailes-app-builder:qa` | 1 | one running app, one behavior proof |

**Not spawned, deliberately:**

- `sailes-app-builder:team-lead` — **zero sub-leads.** The human did not open commando mode.
- `general-purpose` / `Explore` / `Plan` — no named role is missing, so no stand-in is warranted. A
  run staffed by stand-ins tests briefs, not roles.
- Codex (`codex exec`) — cross-runtime delegation is human-triggered only, and was not requested.

**Two counts that are 1 on purpose, and why they are the interesting ones:**

- **`designer` = 1, not 3.** Three designers on three slices produce three visual dialects in one
  product. Design coherence lives in one head; it costs no more tokens to have that head write three
  spec files sequentially, and it writes to three disjoint paths so it never blocks anyone.
- **`qa` = 1, not 3.** The behavior proof is against *one running app*. Cross-slice behavior — a
  billing event that must fire a notification, an admin action that must appear in both — is visible
  only to a single `qa`. Three slice-scoped `qa` runs would each pass while the seam between them
  fails.

`checker` goes the other way (3, not 1) because gate isolation is per-diff: three independent diffs
against three independent slice specs, each reviewer on a clean context, keeps every review tractable.

---

## 3. The slicing

Three vertical slices, each one phase, each one worker per layer:

| Slice | BE files | FE files | Test file | Owns |
|---|---|---|---|---|
| **A — billing** | `<billing module>` | `<billing UI>` | `<billing tests>` | plans, invoices, payment state |
| **B — notifications** | `<notifications module>` | `<prefs UI>` | `<notification tests>` | delivery, templates, preferences |
| **C — admin panel** | `<admin module>` | `<admin UI>` | `<admin tests>` | admin screens, role-gated views |

Exact paths are filled in from the `explorer` report before any brief is written — I do not brief a
worker against paths I assumed.

**Seam handling (the pre-condition for the whole parallel wave).** If `explorer` finds any file two
slices must both write:

1. Prefer **extraction** — the shared touch-points (registry entries, nav items, the migration) become
   one small sequential task for a single `be-dev` that lands *before* the parallel wave. One worker
   touches the seam; the three slice workers then genuinely never collide.
2. If extraction is not possible, those tasks **are not parallel**: run them sequentially, or give each
   worker `isolation: worktree`.

Worktrees are otherwise not used here. If disjointness holds, they add merge overhead for nothing.

---

## 4. Order of execution

Pipeline: `explorer → designer → BE contract finalized → be-dev ∥ fe-dev → tester → checker → qa`.
The contract is already frozen, so that stage is a *verification* step rather than a work step — and
that freeze is exactly what lets BE and FE of the same slice run at the same time instead of in series.

```
WAVE 0  (1 worker)
  explorer ×1
    → confirms the frozen contract artifacts exist on disk and are importable by both slices
    → maps the three modules to file:line
    → produces THE SEAM LIST: every file more than one slice must write
    → reports whether the BE implementations already exist or only the contracts do
  GATE: I read the seam list. If it is non-empty, §3 seam handling runs before Wave 1.

WAVE 1  (4 concurrent — designer ∥ 3× be-dev)
  designer ×1   → ui-spec per slice that has a UI surface (3 disjoint files, written in sequence)
  be-dev  ×3   → A, B, C backends against the frozen contract, concurrent, file-disjoint
  (designer does not block be-dev: backend work needs the contract, not the design spec)

WAVE 2  (3 concurrent)
  fe-dev ×3     → A, B, C frontends against the frozen contract + the designer's spec
                  starts only after BOTH the freeze is verified and that slice's ui-spec exists

WAVE 3  (3 concurrent, gate 1 of 3 — the gate that writes)
  tester ×3     → per slice: derive cases from the SPEC with the implementation UNREAD
                  → HUMAN FREEZES the case list in .ai/test-plans/<slice>.md   ← human gate
                  → then write the suite, ADD-only from the diff

WAVE 4  (3 concurrent, gate 2 of 3)
  checker ×3    → input = slice diff + slice spec + review checklist. Nothing else.
                  CHANGES-REQUIRED → loop back to a FRESH dev worker for that slice,
                  then re-run that slice's checker. Other slices are unaffected.

WAVE 5  (1, gate 3 of 3)
  qa ×1         → integrated app: runs the tester suites, drives the real flows across all
                  three slices, vision-verifies each touched screen against the design artifact
                  and the .ai/screens/ baseline.
                  Cannot boot / creds missing → ENV-DEFECT to me → I escalate to the human.
```

**Who runs which gate: I do. All three.** `tester`, `checker` and `qa` are spawned by me on the
integrated result. There is no sub-lead to grade its own slice — which is the structural reason the
one-team choice costs nothing here: in commando mode the gates would have come back to me anyway.

**Gate isolation, concretely:** no worker's report, reasoning or self-assessment is forwarded to
`checker` or `qa`. Worker reports are input to *my integration*, not to the *review*. If a checker
asks "why was it done this way", the answer is the spec.

**Ordering nuance:** the three slices reach the gates independently, so Wave 3–5 is not a hard barrier
— a slice that clears `checker` waits for the others only at `qa`, which is deliberately the single
integrated pass.

**Reinstatement rule stays live.** If something mid-run introduces a surface I skipped (say a billing
export turns out to need an async job + emailed link), I reinstate `designer`, re-freeze the contract,
and only then let `fe-dev` build against it — and that architectural choice is a **key decision**, so
it goes to the human before I freeze anything, "approved spec" notwithstanding.

---

## 5. Model routing log — defaults, and the reason they stay defaults

Recorded for every worker, including the non-overrides, so a later reader can tell a considered
non-escalation from an unexamined one.

| Worker | Pinned model (frontmatter) | `model` param I pass | Reason |
|---|---|---|---|
| `explorer` ×1 | `claude-haiku-4-5` | **omitted** | default. Mapping three modules is recon, not judgment. |
| `designer` ×1 | `claude-sonnet-5 · high` | **omitted** | default. |
| `be-dev` ×3 | `claude-sonnet-5 · high` | **omitted** | default. Implementing against a *frozen* contract is typing, not contract design — including billing. |
| `fe-dev` ×3 | `claude-sonnet-5 · high` | **omitted** | default. |
| `tester` ×3 | `claude-sonnet-5 · high` | **omitted** | default. |
| `checker` ×3 | `claude-sonnet-5 · high` | **omitted** | default. |
| `qa` ×1 | `claude-sonnet-5 · high` | **omitted** | default. |

**Zero overrides.** Omitting `model` is how the pin is kept — passing it would trade the pinned
`claude-sonnet-5` for whatever the `sonnet` alias resolves to at that moment. The judgment-heavy
surfaces that *would* justify `opus` (contract shape, data model, auth/tenancy design) were settled
before this run began: the spec is approved and the contracts are frozen. A week of volume is not a
judgment surface.

`effort` is passed **nowhere**. It is not a declared Agent-tool parameter, it raises no error when
passed, and whether it applies is unverified — a parameter accepted without effect is the failure
shape this repo keeps recording. Effort is frontmatter-only. (`explorer` carries no effort line at all;
`effort` is unsupported on Haiku 4.5, so if recon needs more, the lever is its model, not its effort.)

**One live ceiling to watch:** Haiku 4.5 holds 200K of context against 1M on Sonnet/Opus. If mapping
three modules plus the contract artifacts overflows the single `explorer`, the fix is to split recon
into three slice-scoped `explorer` spawns — *not* to escalate it to `opus` out of habit.

If a slice bounces `CHANGES-REQUIRED` twice for the same reason, that is evidence the task's difficulty
is in the judgment after all — and that is when I escalate that one re-spawn to `opus` and log the
alias, not the mere fact.

---

## 6. Briefs — the two things only I know

Every brief is self-contained (goal · files · contract · constraints · reference · verification ·
report), says **do not commit, do not push**, and carries both clauses below. Neither is optional and
neither is inferable by the worker.

**(a) The report clause**, verbatim in every brief regardless of agent type:

> Your REPORT IS the deliverable — not a summary for a human, not a status line. If you did not
> finish, say so plainly and list what you did and did not establish. Never return empty.

**(b) The delivery mechanism**, which the worker cannot determine from inside:

> **Delivery: scoped subagent — your final message is returned automatically; just end with it.**

That is the correct clause *for this machine*, because `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is off.
I am not writing "call `SendMessage`" into these briefs — that instruction belongs to background
teammates, and quoting the wrong one produces a brief that reads correct and cannot be run.

**(c) FILE deliverables for everything a gate will grade.** A message is a channel that can drop; a
file survives the drop, the context reset and the worker. Evidence on record: four message-deliverable
briefs → six empty returns and two wasted re-spawns; one file-deliverable brief → a gradable artifact
first try.

| Worker | Named file deliverable |
|---|---|
| `explorer` | `.ai/runs/<date>-recon-three-slices.md` (incl. the seam list) |
| `designer` | `.ai/specs/ui-spec-{billing,notifications,admin}.md` |
| `tester` ×3 | `.ai/test-plans/<slice>.md` (case list, frozen by the human) + the suite |
| `checker` ×3 | `.ai/reviews/<slice>-VERDICT.md` — APPROVE / NITS / CHANGES-REQUIRED |
| `qa` | `.ai/runs/<date>-qa-behavior-proof.md` + screenshots under `.ai/screens/` |

Each brief carries **"no file = task not done"**, and I read the file from disk rather than waiting on
a report.

---

## 7. Lifecycle, and what "released" means on this path

- **Spawn on demand** — a worker is created when its task is actually ready. No `fe-dev` before the
  freeze is verified and its ui-spec exists. No idle agents held "in case".
- **Release = the return.** On the fallback path a scoped subagent returns once and ends; there is
  nothing to confirm and near-zero leak risk. I do **not** quote `shutdown_request` / `TaskStop` here —
  that procedure is for live teammates and would be unrunnable in this mode.
- **An empty return is never a completion, and never the finding "nothing to report."** I chase once,
  explicitly, asking for the report and for a plain statement of what was and was not established.
  Still empty → escalate to the human, naming the delegation that produced nothing. I do not re-spawn
  on a guess and I do not absorb the work myself. Silence has two causes with one appearance — an
  unfinished worker and a dropped report — so I chase without assuming negligence.
- **CHANGES-REQUIRED spawns a fresh worker**, never re-tasks the stale, context-heavy one.
- **Run log** at `.ai/runs/<date>-three-slice-execution.md`: per task — who was spawned (exact agent
  type), what they returned, the gate verdict, the model tier (marked default or overridden), whether
  they were released. **An empty return is recorded as an empty return.**
- **Harvest before release.** A worker that hit a wrong assumption in its brief, a contract that did
  not hold, or a tool that failed silently lands a `.ai/lessons.md` entry (Context / Problem / Rule /
  Applies-to) before it goes. A week of work across three slices is substantial → the delegation is
  written up in `.ai/runs/`.
- **`.ai/STATE.md` updated before I walk away**, every session, so a context reset resumes without
  re-deriving this plan.

---

## 8. What I own, and what I am not doing

**Mine:** the plan, the briefs, verification that the freeze is real, integration, the merge, the
commit, the PR, all three gates, the run log, and the single channel to the human. Workers never
commit or push.

**Not doing, each for a stated reason:**

| Not doing | Reason |
|---|---|
| Opening sub-teams / three sub-leads | human-triggered only; not requested. Nesting works on this machine — that is capability, not authorization. |
| Escalating any worker to `opus` | volume is not a judgment surface; the judgment was settled by the approved spec and the frozen contracts. |
| Passing `effort` anywhere | undeclared parameter, silent no-op; frontmatter-only. |
| Using `general-purpose` with a role pasted in | all seven named roles resolve; a stand-in loses the model pin, the tool allow-list, and the no-`Agent` invariant. |
| Routing anything to Codex | cross-runtime delegation is human-triggered; not requested. |
| Writing the implementation myself | three slices is far above a file's worth of change — this is the exact failure mode the role exists to prevent. |
| Worktrees | unnecessary if disjointness verifies; reinstated immediately if the seam list says otherwise. |
| Skipping a gate because the spec is approved | no gate is optional. An approved spec is an input to the gates, not a substitute for them. |

**Escalation triggers I am watching for** (any one goes to the human before I proceed): a new
architectural or UX choice the spec did not settle; a contract that turns out not to be frozen or not
to be importable; a seam list that makes the slices non-parallel in a way that changes the delivery
shape; `ENV-DEFECT` from `qa`; a worker that returns nothing twice.

**Done means:** `qa` observed the running system doing the thing, across all three slices, with
screenshots. Behavior before diff — a green build is not done.

# Execution plan — 3-slice spec (billing · notifications · admin panel)

**Role:** `team-lead` (single point of contact for the human)
**Date:** 2026-07-26
**Mode:** planning dry-run — nothing here was executed, no project code was written.
**Inputs read before planning:** `agents/team-lead.md`, `skills/sailes-bootstrap/agent-team-structure.md`, `.ai/lessons.md`.
In a live run this list also includes the Task Router guides for the three touched areas (billing, notifications, admin) — omitted here only because there is no client repo mounted in this dry-run.

---

## 0. Team shape — one team, not three

**Decision: I run ONE team. I do not open sub-teams.**

I am naming this explicitly because this spec has the exact shape that invites the mistake: three
independent, file-disjoint, explicitly parallelizable slices and a week of runway. That reads like
three teams. It is not.

- **Commando mode is human-triggered only.** The human asked me to plan the execution of an approved
  spec. They did not ask for sub-teams. "A wide task is not by itself a reason to open a second one."
  (`agent-team-structure.md` §Sub-teams). Opening one on my own initiative would be me taking a
  structural decision that belongs to the human.
- **Parallelism does not require sub-leads.** Everything the three slices need — concurrent work,
  disjoint files, independent phases — is available inside a single team by spawning three concurrent
  workers. A sub-lead buys coordination capacity I do not need; what I would actually be buying is a
  second and third opus-tier planner to re-derive a plan that already exists here.
- **The brake, not the nudge.** My model tier reaches for fan-out readily and the guidance for it is
  to cap spawn counts. So the fan-out question gets answered downward by default: 3 concurrent
  workers, never 6, and never a nested layer.
- **It also would not work.** Nesting is off unless the human sets
  `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` in machine-level settings, which no skill writes; and none of
  the seven non-lead role definitions lists `Agent` in `tools`. A sub-lead I spawned could not spawn
  anything. The doctrine and the runtime agree.

Similarly: **no Codex delegation.** That is human-triggered only and the human did not ask.

---

## 1. Roles convened, and the head count

Pipeline, order preserved: `explorer → designer → BE contract finalized → fe-dev → tester → checker → qa`
(with `be-dev` implementing against the already-frozen contract).

| Stage | Role | Count | Model · effort | Override? |
|---|---|---|---|---|
| Recon | `explorer` | 1 (→ 3 only if it hits the context ceiling) | `claude-haiku-4-5` · — | none |
| Design | `designer` | 1 (conditional — see §3) | `claude-sonnet-5` · high | none |
| Backend | `be-dev` | 3 — one per slice | `claude-sonnet-5` · high | none |
| Frontend | `fe-dev` | 3 — one per slice | `claude-sonnet-5` · high | none |
| Test gate | `tester` | 3 — one per slice/phase | `claude-sonnet-5` · high | none |
| Review gate | `checker` | 3 — one per slice, fresh each | `claude-sonnet-5` · high | none |
| Behavior gate | `qa` | 3 per-slice + 1 integration | `claude-sonnet-5` · high | none |
| `Done-when` reads | cheap grader | as needed | `claude-haiku-4-5` | deliberate downgrade — binary pass/fail read of exact commands, judgment does not enter it |

**Total ≈ 17 spawns, sequenced. Never more than 3 alive at once.**

**No model escalations planned, and that is a decision with a reason.** The judgment-heavy surface on
this spec — the contract — is already settled: the BE contracts are frozen and the spec is approved.
What remains is implementation against a fixed shape plus gate reads. That is Sonnet work. A week of
volume is not a reason to reach for Opus; escalating on volume is the same misread as me bulk-coding
it myself. If a slice turns out to touch auth/tenancy in a way the spec did not settle, that specific
worker gets escalated to `claude-opus-5` **and the run log records the task, the tier and the reason**
— an unlogged escalation is indistinguishable from drift.

**Why I am not writing any of this myself.** I could implement one of these slices faster than I can
brief it. That is precisely the failure mode this role exists to prevent: my tier buys planning,
contract judgment, integration and gate verdicts, not typing three modules a Sonnet worker produces
just as well for a fraction of the cost. The overhead argument (a worker costs a spawn, a brief, a
report, an integration) would cut the other way only below roughly a file's worth of change — three
modules over a week is nowhere near that line.

---

## 2. How the work is sliced

**Primary axis: the three product slices.** Billing / notifications / admin panel each become a
**phase** with its own `Done-when`, its own test plan, and its own trip through the gates. Within a
slice, the secondary axis is BE vs FE — different files, so they can overlap.

**File-disjointness is a claim I verify, not a claim I inherit.** The spec says the slices share no
files. That is the spec's assertion; the explorer's first job is to falsify it. The usual offenders,
all of which would be genuinely shared even when the feature modules are not:

- migration directory / sequence numbering (three slices each adding migrations is the most likely
  real collision)
- the route registry, nav manifest, or app shell the admin panel plugs into
- i18n / copy bundles, feature-flag file, `package.json` / lockfile
- a shared `AuthZ` policy table if admin roles and billing roles both extend it

**Anything the explorer finds shared is pulled OUT of the slices and becomes a lead-owned serialized
task** run before the parallel waves — or, if that is impractical, the colliding workers run in
`isolation: worktree`. Two concurrent workers never write one file. Where the slicing cannot achieve
disjointness, the tasks are not parallel, and I would rather learn that on day 1 than at merge.

**Behavioral coupling survives file disjointness.** Billing events plausibly emit notifications, and
the admin panel plausibly renders both. That is why there is a final integration `qa` pass (§5) even
though every slice passed its own.

---

## 3. Stage-by-stage order

### Stage 0 — lead-only, no spawns (day 1, ~half a day)
1. Read Task Router guides for billing / notifications / admin + `.ai/lessons.md`.
2. **Verify "frozen" actually means frozen.** Frozen = a committed, typed contract artifact (shared TS
   types / Zod schemas / OpenAPI) that both slices *import*, so drift is a compile error rather than a
   review finding. If what exists is prose in the spec describing the endpoints, it is **not** frozen,
   and assembling the typed artifact from the decisions the spec already settled is my job — that is
   coordination, not a key decision, so no escalation. I record which of the two I found.
3. Confirm phase boundaries and `Done-when` commands per slice.
4. Open the run log at `.ai/runs/2026-07-26-three-slice-spec.md`.

### Stage 1 — recon (1 worker)
One `explorer`, scoped to the three module roots plus the shared-surface suspects in §2.
- Deliverable: **file** — `.ai/recon/three-slice-recon.md` (`file:line` findings, contract shapes,
  the shared-file verdict). No file = task not done.
- One explorer rather than three: fan-out discipline, and three recon reports on one codebase mostly
  re-read the same shell. **But** Haiku 4.5 holds 200K against 1M on the other tiers, which is a real
  ceiling on whole-repo recon. If it reports truncation, I split it into three scoped explorers or
  escalate its *model* — `effort` is unsupported on Haiku 4.5, so it cannot be tuned that way.

### Stage 2 — design (1 worker, conditional)
The admin panel is a UI surface; billing and notifications almost certainly carry FE surfaces too
(checkout/invoice views, notification preferences).
- **If the approved spec already carries a design artifact** (`.ai/specs/ui-spec.md` or a
  `design-system/MASTER.md` mapping), skip `designer` — the pass is already done.
- **If not**, one `designer` covering all three slices. One, not three, deliberately: three designers
  produce three dialects of the same product. Cross-slice visual consistency is the whole reason this
  is a single worker.
- Deliverable: **file** — `.ai/specs/ui-spec.md`, one section per slice.
- Dropping this role would be provisional, not final: if implementation surfaces a UX flow the spec did
  not settle, the role is reinstated and the contract re-frozen before `fe-dev` continues.

### Stage 3 — implementation (2 waves × 3 concurrent workers)
Contract is frozen, so BE and FE build against a fixed shape.

- **Wave A — `be-dev` × 3**, concurrent, one per slice. Files disjoint per the verified recon.
- **Wave B — `fe-dev` × 3**, concurrent, one per slice.

Waves rather than all six at once: the fan-out cap, and integration capacity is mine and serialized —
six reports landing together buys no wall-clock once I am the bottleneck at the merge. Within a slice,
FE may start as soon as the typed artifact exists (that is what freezing buys); I still keep the wave
boundary so each slice reaches the gates as a coherent phase.

Every brief follows the self-contained format — goal · files · contract path · constraints ·
reference · verification commands · report clause · **delivery mechanism** — and every one says: do not
switch branches, do not commit, do not push. I own the merge, the commit, and the PR.

### Stage 4 — gates, per slice, in order (`tester → checker → qa`)
Gates run **per phase, not once at the end**. Each slice, on completion of wave B, walks:

1. **`tester`** — derives the phase's expected behavior from the spec **with the implementation
   unread**; the human freezes `.ai/test-plans/<slice>.md`; then it writes the suite, ADD-only from
   the diff, with the tiered detection proof. The informational barrier is what stops the tests from
   mirroring the code. This is the one gate role that writes; it still never commits.
   *Per the 2026-07-25 lesson: the suite needs a fixture that must NOT fire as well as one that must.*
2. **`checker`** — fresh worker, receives **ONLY** the diff, the spec/contract, and the review
   checklist. I never forward the dev's report, reasoning or self-assessment. If it asks why something
   was done a certain way, the answer is the spec, not the worker's story. It does not re-check what
   lint/types/convention tests already enforce.
3. **`qa`** — receives **ONLY** the running app, the spec's expected behavior, and the design artifact.
   Behavior before diff. For the admin panel and every touched screen: vision-verify against the design
   artifact **and** against the `.ai/screens/` baseline; on APPROVE the fresh screenshot replaces the
   baseline. If the stack will not boot or creds/fixtures are missing, that is `ENV-DEFECT` — a
   bootstrap defect I escalate and fix at the seed/boot path, never a skipped or faked pass.

CHANGES-REQUIRED loops back to the relevant dev as a **fresh** worker, never the stale context-heavy
one, and then re-walks the gates for that slice.

### Stage 5 — integration (lead)
1. Merge the three slices, resolve any shared-surface ordering (migrations in particular).
2. **One final `qa`** on the integrated app for the cross-slice flows the per-slice passes could not
   see: billing event → notification delivered → both visible in the admin panel. File-disjoint is not
   behavior-disjoint.
3. Commit and open the PR. Workers never do either.

---

## 4. Who runs which gate

**All of them are mine.** `tester`, `checker` and `qa` are spawned by me, on the integrated result of
each phase. No worker grades its own slice, and — the reason this matters here — if I had opened three
sub-teams, a sub-lead grading its own slice would be the maker reviewing the maker, which is the exact
failure gate isolation exists to prevent. Keeping one team keeps the gates structurally clean without
having to promise anything.

No gate is optional. The team scales down for small work; the gates do not disappear.

---

## 5. Human touchpoints

The spec is approved and the contracts are frozen, so **nothing needs escalating today**. Three points
where the human is still in the loop:

1. **Freezing each `.ai/test-plans/<slice>.md`** — the human freezes the tester's derived case list
   before the suite is written. Three of these, one per slice. Required, not optional.
2. **Any key decision that surfaces mid-pipeline** — a new architectural or UX choice the spec did not
   settle (e.g. the admin panel needing a notifications-preference surface nobody specified). I stop,
   escalate, get the answer, then freeze. I never silently pick the architecture because it is
   inconvenient to stop.
3. **A shared-file finding from recon** that makes the "explicitly parallelizable" premise false. That
   changes the shape of the plan, so the human hears about it.

Escalation is upward only, and I am the only one who talks to the human.

---

## 6. Lifecycle and run-log discipline

Applying the measured lessons rather than restating them:

- **Every brief names a FILE deliverable** with its path plus "no file = task not done", and I read it
  from disk. Measured 2026-07-25: four message-deliverable briefs → six empty returns and two wasted
  re-spawns; one file-deliverable brief → a gradable artifact first try.
- **Every brief names the delivery mechanism**, because the worker cannot infer it. Scoped subagent:
  final message returns automatically. Background teammate: plain text reaches no one, it must call
  `SendMessage`. This goes into briefs for built-in agent types too — those are exactly where it has
  gone wrong, and I cannot edit their definitions.
- **Silence is chased once, explicitly, then escalated** — never re-spawned on a guess, never absorbed
  by me doing the work. And not read as negligence: on 2026-07-25 all four silent workers had finished
  and had full reports; the transport failed, not the worker. "The agent found no issues" is a claim I
  may make only if an agent actually said so.
- **Release is a confirmed termination, not a request sent.** `SendMessage {"type":"shutdown_request"}`,
  re-sent until the runtime reports the termination. Superseded and abandoned workers get released too —
  a re-spawned arm leaves the first one alive. Of five requests on 2026-07-25, three needed a second.
- **Never hold idle agents.** Integrate, harvest, release.
- **Harvest before release.** Anything a worker hit — a wrong assumption in its brief, a contract that
  did not hold, a tool that failed silently — lands in `.ai/lessons.md` (Context / Problem / Rule /
  Applies-to) before the agent is closed, and the delegation in `.ai/runs/`.
- **Run log** at `.ai/runs/2026-07-26-three-slice-spec.md`, per task: who was spawned, what they
  returned (an empty return recorded as exactly that), the gate verdict, whether they were released.
  `.ai/STATE.md` updated before I walk away, so a context reset resumes without re-deriving this plan.
  The live agent set is reconstructed from the run log, never from memory.

### Run-log skeleton

| # | Task | Role · model | Deliverable file | Returned | Gate verdict | Released (confirmed) |
|---|---|---|---|---|---|---|
| 1 | recon, 3 modules + shared surfaces | `explorer` · haiku-4-5 | `.ai/recon/three-slice-recon.md` | | — | |
| 2 | UI spec, 3 slices | `designer` · sonnet-5 | `.ai/specs/ui-spec.md` | | — | |
| 3–5 | BE impl ×3 | `be-dev` · sonnet-5 | per-slice report file | | — | |
| 6–8 | FE impl ×3 | `fe-dev` · sonnet-5 | per-slice report file | | — | |
| 9–11 | suite ×3 | `tester` · sonnet-5 | `.ai/test-plans/<slice>.md` + suite | | — | |
| 12–14 | review ×3 | `checker` · sonnet-5 | `VERDICT-<slice>.md` | | APPROVE / NITS / CR | |
| 15–17 | behavior ×3 | `qa` · sonnet-5 | `QA-<slice>.md` + `.ai/screens/` | | PASS / CR / ENV-DEFECT | |
| 18 | integration behavior proof | `qa` · sonnet-5 | `QA-integration.md` | | PASS / CR | |

---

## 7. Rough sequencing over the week

| Day | Work | Live workers |
|---|---|---|
| 1 | Stage 0 (lead) + `explorer`; contract artifact verified; shared surfaces triaged | 1 |
| 1–2 | `designer` (if needed); lead lands any shared-surface serialized task | 1 |
| 2–3 | Wave A — `be-dev` ×3 | 3 |
| 3–4 | Wave B — `fe-dev` ×3 | 3 |
| 4–6 | Gates per slice: `tester` → human freeze → `checker` → `qa`, three slices staggered | ≤3 |
| 6 | CHANGES-REQUIRED loops on fresh workers, re-gate | ≤3 |
| 7 | Merge, integration `qa`, lessons harvest, STATE.md, commit + PR | 1 |

---

## 8. The one-line version

One team, ~17 sequenced spawns, never more than three alive at once; sliced by product slice with
BE/FE as the secondary axis; every gate spawned by me on clean context; the human freezes the test
plans and owns any key decision that surfaces. **Three parallel slices is a reason to run three
concurrent workers, not a reason to open three teams — and that widening is the human's call, not
mine.**

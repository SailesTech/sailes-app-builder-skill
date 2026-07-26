# Staffing plan — Faza 3 (`organizationId` tenancy) + Faza 4 (120 komponentów → aliasy `@/`)

**Role:** `team-lead` · **Date:** 2026-07-26 · **Mode:** planning dry-run — nothing spawned, nothing
executed, no project code written. Every "would" below is a plan, not a record of a run.

---

## 0. Machine facts this plan is built on (checked, not assumed)

| Fact | Value | Evidence |
|---|---|---|
| Sailes roles resolve here | **yes**, namespaced by the plugin | agent-type list shows `sailes-app-builder:be-dev`, `:fe-dev`, `:explorer`, `:tester`, `:checker`, `:qa`, `:designer`, `:team-lead` — so **no `general-purpose` stand-in is needed**, and none is used |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | **off** (absent from `~/.claude/settings.json`, absent from env) | grep of settings + `env` |
| Delegation mechanism in force | **scoped subagents** — one task in, one return, release *is* the return | fallback path, `agent-team-structure.md` §Fallback |
| `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` | `2` (settings + env) | grep |
| `CLAUDE_CODE_SUBAGENT_MODEL` env pin | **not set** — so my per-invocation `model` wins over frontmatter | `env` |
| Sub-teams / commando mode | **not opened** — the human staffed two phases, which is not the same request | `team-lead.md` §Sub-teams: only the human opens it; a wide task is not by itself a reason |

Consequence for every brief below: `Delivery:` line reads **"[scoped subagent] your final message is
returned automatically — end with it"**, never the `SendMessage` variant. The worker cannot infer this;
only I know which mode I spawned.

---

## 1. The two phases, read for *where the difficulty sits*

**A — Faza 3, `organizationId` into 4 tables + all queries + backfill of existing customers.**
Small diff. The difficulty is entirely judgment: a data-model change, a tenancy boundary, and a
migration of live customer data. `team-lead.md:38` names three of those verbatim as escalation
triggers. A missed query is not a bug, it is a cross-tenant read.

**B — Faza 4, 120 components from relative imports to `@/`.**
Large diff. The difficulty is entirely volume. Nothing is decided that a human or a model must weigh:
the target shape is fixed, and **lint enforces it** — the toolchain sees every error in the class.
Reaching for Opus because 120 files are touched is the same misread as bulk-coding it myself
(`team-lead.md:38`, `agent-team-structure.md:54`).

**The discriminating question I applied to every worker:** *is there a decision here that a machine
check cannot grade?* If yes → escalate. If the answer is only "there is a lot of it" → default tier.

### The one thing I do not decide

A's backfill needs a rule for **existing rows with no owning organization** (legacy/shared records,
rows created before tenancy existed). That is a new data-model choice, not an assembly of choices the
spec already settled → **key decision, escalated to the human before A1 is spawned**
(`team-lead.md:29`). I freeze the contract *after* the answer, never around it. If the spec already
answers it, I quote the spec line in the brief and spawn.

---

## 2. Role assignment

Pipeline order is preserved within each phase; roles that don't apply are dropped, and the drop is
provisional (see §5).

### Phase A — backend/data only

| # | Role | Task (one per worker) |
|---|---|---|
| A0 | `explorer` | Map the 4 tables, every read/write site against them, existing tenancy scoping (if any), the migration tool + its expand/contract conventions. Output: `file:line` inventory + a list of query sites that look **deliberately global** (auth-by-email, health, admin) for me to rule on. |
| A1 | `be-dev` | Schema change + backfill migration + **the scoping contract**: the typed helper/repository signature every tenant-scoped query must go through, committed as the shared contract artifact. Plus the **ratchet**: a lint rule / convention test that fails any query on those 4 tables not routed through it. |
| A2 | `be-dev` | Apply the frozen helper across every query site A0 inventoried. Mechanical *once A1 exists*. |
| A3 | `tester` | Derive cases from the spec with the code unread — chiefly the cross-tenant negative: tenant X cannot read/write/list/count tenant Y's rows, on all 4 tables; plus the backfill's before/after row counts. Human freezes the list. |
| A4 | `checker` | Review of the integrated A diff vs. spec + checklist only. |
| A5 | `qa` | Two seeded tenants in the running app; prove the cross-read is refused and the backfilled data still renders for an existing customer. |

`designer` and `fe-dev`: **dropped** — no UI surface in A. Provisional (§5).

### Phase B — frontend, mechanical

| # | Role | Task |
|---|---|---|
| B0 | `explorer` | Inventory import shapes across the 120 components; confirm alias config exists and agrees in **every** resolver (tsconfig `paths`, bundler, test runner, any SSR config); list the cases a naive rewrite breaks — dynamic `import()`, `require`, re-export barrels, CSS/asset-relative URLs that must **not** be rewritten. |
| B1 | `fe-dev` | Write and run a **codemod**, not 120 hand edits; land the mechanical rewrite. Excludes the paths A writes (§4). |
| B2 | `fe-dev` | Residue pass on exactly what the codemod could not do (the B0 edge-case list). Spawned only if B0/B1 report residue. |
| B3 | `tester` | The suite here is the **ratchet**: enable/author the lint rule banning parent-relative imports + a convention test that fails when one is reintroduced. Behavior is unchanged, so a behavioral suite would assert nothing new; the existing suite staying green is the regression proof. |
| B4 | `checker` | Review vs. spec + checklist. Explicitly does **not** re-check what tsc/lint/build already guarantee (`agent-team-structure.md:139`). |
| B5 | `qa` | Smoke the running app: routes render, and **lazy/dynamic imports actually resolve at runtime** — the one failure class a type-check cannot see. |

`designer`: dropped — B changes no pixels. `be-dev`: not involved.

---

## 3. Model routing — the exact parameter values

Two constraints fix the syntax, both dated 2026-07-26 in the doctrine:

- **`model` accepts only the aliases** `sonnet` / `opus` / `haiku` / `fable`. A full ID
  (`claude-opus-5`) is rejected with `InputValidationError`. So an escalation trades the pinned
  version for whatever the alias resolves to at spawn time — which is why the **alias is what I log**.
- **`effort` is not a declared Agent parameter and fails silently.** I pass it **nowhere**, on any
  worker, including the escalated ones. Effort is frontmatter-only. A task that genuinely needs a
  different effort is a role that has outgrown its definition, not an override.
- **Omitting `model` is how the pin is kept.** For every default-tier worker the concrete parameter
  value is: *the parameter is absent from the call*. Not `"inherit"`, not the pinned ID, not present.

### What I would actually pass

| # | `subagent_type` | `model` param | Resolves to | Default or override |
|---|---|---|---|---|
| A0 | `"sailes-app-builder:explorer"` | *omitted* | `claude-haiku-4-5` (frontmatter) | **default** |
| A1 | `"sailes-app-builder:be-dev"` | `"opus"` | opus tier | **OVERRIDE** |
| A2 | `"sailes-app-builder:be-dev"` | *omitted* | `claude-sonnet-5` | **default** |
| A3 | `"sailes-app-builder:tester"` | *omitted* | `claude-sonnet-5` | **default** |
| A4 | `"sailes-app-builder:checker"` | `"opus"` | opus tier | **OVERRIDE** |
| A5 | `"sailes-app-builder:qa"` | *omitted* | `claude-sonnet-5` | **default** |
| B0 | `"sailes-app-builder:explorer"` | *omitted* | `claude-haiku-4-5` | **default** |
| B1 | `"sailes-app-builder:fe-dev"` | *omitted* | `claude-sonnet-5` | **default** |
| B2 | `"sailes-app-builder:fe-dev"` | *omitted* | `claude-sonnet-5` | **default** |
| B3 | `"sailes-app-builder:tester"` | *omitted* | `claude-sonnet-5` | **default** |
| B4 | `"sailes-app-builder:checker"` | *omitted* | `claude-sonnet-5` | **default** |
| B5 | `"sailes-app-builder:qa"` | *omitted* | `claude-sonnet-5` | **default** |

Two overrides across twelve workers. Both are in A, the **small** diff. Zero in B, the large one.

### Literal spawn shape — the escalated case (A1)

```
Agent(
  subagent_type: "sailes-app-builder:be-dev",
  model:         "opus",
  description:   "Faza 3 schema + backfill + scoping contract",
  prompt:        <brief, §6>
)
```

No `effort` key. `subagent_type` carries the plugin namespace exactly as the agent-type list reports
it — a bare `"be-dev"` risks not resolving, and a non-resolving type is what silently produces a
`general-purpose` stand-in run.

### Literal spawn shape — the default case (B1), which is most of them

```
Agent(
  subagent_type: "sailes-app-builder:fe-dev",
  description:   "Faza 4 codemod: relative → @/ aliases",
  prompt:        <brief, §6>
)
```

No `model`, no `effort`. That absence *is* the decision to keep `claude-sonnet-5 · high`.

### Why A1 and A4, and why not the rest

**A1 → `opus`.** The judgment is in designing the tenancy boundary, not in typing it: where the
scoping seam sits, whether the backfill is expand/contract or in-place, whether existing rows can be
partitioned at all, and what the ratchet must be able to detect. Getting the seam wrong makes A2, the
tests and the review all correct against a wrong shape. `team-lead.md:38` — data-model, tenancy,
migration — three of the named triggers in one task.

**A4 → `opus`.** After A1's ratchet and A3's cross-tenant suite, the mechanically detectable misses
are covered. What remains is exactly one question no machine check can answer: **is each query left
deliberately global actually legitimate?** A wrongly-justified global read passes lint, passes types,
passes a suite that doesn't know to look for it, and leaks tenant data. That is judgment on an auth
surface, on the one artifact where a miss is unrecoverable.

**A2 → default, and this is the load-bearing non-escalation inside A.** A2 touches the most files in
phase A and is the most "tenancy-flavoured" task by description — and it is still Sonnet, because once
A1 has frozen the helper and shipped the ratchet, A2 is application of a decided shape, and a missed
site is a **failing lint rule**, not a judgment call. If I could not build the ratchet, A2 would be an
escalation; because I can, it isn't. Escalating A2 as well would be escalating on the *topic* rather
than on the difficulty, which is the volume misread wearing a tenancy costume.

**A0 / B0 → default haiku, considered and kept.** Both recon tasks are grep-shaped inventories, not
whole-repo synthesis, so Haiku 4.5's 200K ceiling (vs 1M on Sonnet/Opus) is not binding. If B0 comes
back reporting it truncated the 120-file sweep, that is the trigger to re-spawn B0 with
`model: "sonnet"` — escalate `explorer`'s model, since it cannot be tuned by effort at all
(`effort` is unsupported on Haiku 4.5).

**All of B → default, deliberately.** 120 files is a cost, not a difficulty. The target shape is
fixed, the transform is a codemod, and lint + tsc + build grade the entire error class. There is no
question in B that a more capable model would answer better. **B is the arm of this plan where the
tempting wrong answer is "big diff → Opus", and the answer is no.**

**B4 → default, stated separately** because it is the near-miss: a reviewer facing a 120-file diff
feels like it needs a bigger model. It does not — a bigger reviewer reading 120 mechanical hunks adds
nothing over `tsc --noEmit` + lint + a green suite, which cover the whole class. Volume makes a review
*long*, not *hard*.

### The payoff question, to be answered after the run

Both overrides are recorded with an explicit post-condition: **if A4 (opus checker) finds nothing that
the ratchet + A3's suite would not have caught, the next tenancy phase runs `checker` at default.** A
log that cannot say an escalation was wrong is a receipt, not a record. Same test on A1: if its output
is a seam any Sonnet be-dev would have picked, that is evidence against escalating the next one.

And the graduation watch: `be-dev` escalated once here. If `be-dev` needs `opus` on *every* tenancy /
data-model phase across the next few runs, that is not an override habit to keep — it is a signal to
promote a separately pinned role, on run-log evidence rather than in anticipation.

---

## 4. Concurrency and file-disjointness

- A2 (backend query sites) and B1 (frontend component imports) are file-disjoint → they may run
  concurrently.
- The one overlap risk is the **shared contract artifact** A1 commits, which frontend code imports.
  Resolution: **B1's codemod glob excludes the shared-contracts path**, and B1 does not start until
  A1's contract file has landed. Everything else in B is disjoint from everything in A.
- Within A: A1 → A2 is strictly **sequential** (A2 applies A1's helper and cannot precede it).
- Within B: B1 → B2 sequential; B2 only exists if residue is reported.
- Nobody commits or pushes but me. Integration, commit, PR are mine.
- No worktrees needed: disjointness is achievable by slicing, so the cheaper path holds.

---

## 5. Gates — and what stays true even in a dry run

- No gate is optional in either phase, including B. A mechanical refactor still gets `tester`,
  `checker`, `qa`; the gate scales down, it never disappears.
- `checker` (A4/B4) receives **only** diff + spec/contract + checklist. The workers' reports are input
  to *my* integration, never forwarded to the gate.
- `qa` (A5/B5) receives **only** the running app + expected behavior. If the stack won't boot or the
  two-tenant seed is missing, the verdict is `ENV-DEFECT`, escalated to me — never a faked pass.
- CHANGES-REQUIRED loops back to a **fresh** worker of the relevant role, never the stale one.
- **Provisional drops:** if A's backfill turns out to need an operator-facing surface (e.g. a screen to
  assign orphan rows to an organization), `designer` is reinstated and the contract re-frozen before
  any `fe-dev` starts — a dropped role is provisional, not final.

---

## 6. Brief invariants (every one of the twelve)

One goal · exact files · the contract artifact path · verification commands · "do not switch branches,
do not commit, do not push" · the report clause · the delivery line. Plus, for anything a gate grades,
**a named FILE deliverable with "no file = task not done"** — measured 2026-07-25: four
message-deliverable briefs produced six empty returns; the one file-deliverable brief produced a
gradable artifact first try.

Named files: A0 → `.ai/eval-runs/.../A0-inventory.md`; A3 → `.ai/test-plans/faza-3.md` (frozen by the
human before the suite is written); A4 → `A4-VERDICT.md`; A5 → `A5-QA.md` + screenshots;
B0 → `B0-inventory.md`; B3 → `.ai/test-plans/faza-4.md`; B4 → `B4-VERDICT.md`; B5 → `B5-QA.md`.

Report clause, verbatim in all twelve regardless of role: *your report IS the deliverable — not a
summary, not a status line; if you did not finish, say so plainly and list what you did and did not
establish; never return empty.*

---

## 7. Run-log rows

These are the rows as they would be written — the outcome columns are the ones filled in *after* each
worker returns, and they are present-and-empty here because this is a dry run. An empty return, if one
happens, gets written into `Returned` as exactly that.

### 7.1 Delegation ledger

| # | Phase | Worker (`subagent_type`) | Spawn params passed | Tier | Def/Override | Reason (required for both) | Returned | Gate verdict | Released |
|---|---|---|---|---|---|---|---|---|---|
| A0 | A | `sailes-app-builder:explorer` | `subagent_type` only | `claude-haiku-4-5` | default | grep-shaped inventory; 200K ceiling not binding; effort untunable on Haiku by design | *(dry run — not spawned)* | n/a | n/a |
| A1 | A | `sailes-app-builder:be-dev` | `subagent_type`, `model:"opus"` | **opus (alias)** | **OVERRIDE** | data-model + tenancy seam + live-data backfill = judgment; a wrong seam invalidates A2/A3/A4 | *(dry run)* | | |
| A2 | A | `sailes-app-builder:be-dev` | `subagent_type` only | `claude-sonnet-5` | default | applies A1's frozen helper; misses are caught by the ratchet, so the difficulty is typing, not judgment — **explicitly not escalated despite being A's biggest slice** | *(dry run)* | | |
| A3 | A | `sailes-app-builder:tester` | `subagent_type` only | `claude-sonnet-5` | default | case derivation from spec, code unread; human freezes the list — the barrier does the work, not the tier | *(dry run)* | | |
| A4 | A | `sailes-app-builder:checker` | `subagent_type`, `model:"opus"` | **opus (alias)** | **OVERRIDE** | only remaining ungradable-by-machine question is whether each deliberately-global query is legitimate; a wrong one leaks tenant data and passes every automated check | *(dry run)* | | |
| A5 | A | `sailes-app-builder:qa` | `subagent_type` only | `claude-sonnet-5` | default | behavior proof on a running app; pass/fail observation, not judgment | *(dry run)* | | |
| B0 | B | `sailes-app-builder:explorer` | `subagent_type` only | `claude-haiku-4-5` | default | inventory + edge-case list; re-spawn at `model:"sonnet"` **only** if it reports truncating the 120-file sweep | *(dry run)* | n/a | n/a |
| B1 | B | `sailes-app-builder:fe-dev` | `subagent_type` only | `claude-sonnet-5` | default | **volume, not judgment.** Target shape fixed, transform is a codemod, lint+tsc grade the whole error class. Escalation axis considered and rejected | *(dry run)* | | |
| B2 | B | `sailes-app-builder:fe-dev` | `subagent_type` only | `claude-sonnet-5` | default | bounded residue from B0's enumerated edge cases; still mechanical | *(dry run; conditional on residue)* | | |
| B3 | B | `sailes-app-builder:tester` | `subagent_type` only | `claude-sonnet-5` | default | authors the ratchet (lint rule + convention test); behavior unchanged, so the existing suite is the regression proof | *(dry run)* | | |
| B4 | B | `sailes-app-builder:checker` | `subagent_type` only | `claude-sonnet-5` | default | **near-miss, rejected deliberately:** a 120-file diff makes a review long, not hard; a bigger reviewer adds nothing over tsc+lint+green suite | *(dry run)* | | |
| B5 | B | `sailes-app-builder:qa` | `subagent_type` only | `claude-sonnet-5` | default | runtime resolution of lazy/dynamic imports — the one class tsc cannot see; observation, not judgment | *(dry run)* | | |

**Ledger totals:** 12 workers · 2 overrides (both `opus`, both in the small-diff phase) · 10 defaults
· 0 escalations in the large-diff phase · 0 `effort` parameters passed anywhere · 0 stand-ins
(`general-purpose` not used; all roles resolve on this machine).

### 7.2 Rows that are not about workers

| Item | Row as it would be written |
|---|---|
| Key decision | **Escalated to human, A blocked pending answer:** backfill rule for rows with no owning organization. Not mine to pick; contract frozen only after the answer. |
| Sub-teams | **Not opened.** Human staffed two phases; that is not a request for commando mode. One team, one lead, both phases. |
| Delegation mode | Scoped subagents (teams flag off). Release = the return; there is nothing to confirm and no live-teammate `shutdown_request` round applies. Quoting the live-teammate release procedure on this path would produce a plan that reads correct and cannot be run. |
| Lead's own coding | **None.** Both phases are above a file's worth of change; A is small but sits on a tenancy surface, B is large and mechanical. Either way the implementation is delegated. I own planning, the contract freeze, integration, commit, PR. |
| Post-run obligation | Answer the payoff question for A1 and A4 (§3) in this same log; harvest anything a worker hit into `.ai/lessons.md` (Context/Problem/Rule/Applies-to) before release; update `.ai/STATE.md` before walking away. **Not done in a dry run** — recorded here so a real run cannot quietly skip it. |

---

## 8. One-line answer

**A gets the expensive tier at two points and B gets it nowhere** — because A's small diff hides a
tenancy decision no machine check can grade, and B's large diff hides nothing at all.

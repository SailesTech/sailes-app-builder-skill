# Value Layer — close the lifecycle, prove the quality, compound the business

Status: proposal
Date: 2026-07-05

> Companion to `2026-07-05-agentic-first-next-level.md` (the engineering layer:
> move truth from prose into the machine). This spec is the **business layer**:
> the framework currently optimizes how software gets *built*; value for a B2B
> agency is decided by what happens *around* the build — shipping, running,
> proving, reusing, pricing. Same rules: proposal status, Open Questions are
> Marcin's, phases independent, every phase has a binary Done-when.

## TLDR & Context

Three observations drive this spec:

1. **The pipeline ends at "implemented".** `sailes-start` routes
   discovery → bootstrap → design → spec → implement — and stops. Release,
   operations, and client handover are where a B2B client experiences quality
   (and where maintenance revenue lives), yet they have no phase, no gate, no
   artifact. The security checklist's "production deploy protected" line is the
   only trace of a release process.
2. **Quality claims are asserted, not proven.** The framework produces good
   process artifacts (specs, run logs, gate verdicts) but nothing a client or a
   future maintainer can *verify*: no provable permission model, no tested
   restore path, no defect-escape record. "We follow a rigorous process" is a
   weaker sell than "every endpoint×role combination has a generated test".
3. **Nothing compounds at the business level.** Each project sharpens skills
   (lessons → promotion), but modules get rebuilt, estimates stay gut-feel, and
   post-gate defects teach nothing structural. The agency's real moat — faster
   delivery of hardened modules, sharper pricing, gates that provably tighten —
   is left on the table.

## Problem Statement

Verified against the repo on 2026-07-05:

1. **No release discipline.** No skill, checklist, or gate covers: environment
   promotion (dev→staging→prod), secrets/config parity, migration ordering
   relative to deploy (the expand/contract knowledge in `sailes-database` stops
   at "before any prod run"), post-deploy smoke proof, or a rollback plan.
   `sailes-implement` "On completion" ends at spec lifecycle + STATE.md.
2. **"Observability" is a baseline word without operational teeth.**
   `modules-catalog.md` lists observability in the always-present baseline, but
   `repo-done-checklist.md` never verifies: error tracking actually wired and
   alerting a human, a health endpoint, **a backup with a tested restore**, an
   uptime check, or a one-page incident playbook. An untested backup is a hope,
   not a backup.
3. **RBAC is a checklist line, not a proof.** `security-checklist.md` already
   demands a permission map (`deals.view`, `offers.send`, …) and per-action
   checks — but verification is a human reading checkboxes. Nothing generates
   the **authz matrix test** (every route/action × every role, expected
   allow/deny) that would make the permission model *provable* and
   regression-proof. Same for tenancy: "tests verify data isolation" is
   demanded but no test shape is prescribed.
4. **Defects that escape the gates teach nothing.** When a bug reaches the
   client despite `checker`+`qa`, nothing classifies which gate should have
   caught it or forces that gate to grow a check. The gates stay exactly as
   strong as the day they were written.
5. **Modules don't graduate.** `modules-catalog.md` is a menu of *what to
   build*; there is no rule for when a module built for the 2nd–3rd time gets
   extracted into a hardened, versioned, reusable implementation — so the
   agency rebuilds auth/tenancy/webhook-intake/email variants at full cost
   every time.
6. **Estimates never meet actuals.** Specs phase the work; run logs record what
   happened; `sailes-wycena` prices new work — three artifacts that never
   exchange data. Pricing accuracy (margin!) cannot improve without the loop.
7. **The client sees nothing between kickoff and delivery.** All progress
   artifacts (spec Progress, run log, gate verdicts, qa screenshots) are
   agent/developer-facing. PM overhead of "where are we?" is paid manually.

## Proposed Solution

Seven additive phases in three groups: **close the lifecycle** (1–2), **prove
the quality** (3–4), **compound the business** (5–7).

Principles preserved: human owns key decisions and every prod-touching action;
no vendor lock-in in skill text (categories + a recommended default, same
pattern as the stack baseline); artifacts stay ≤ 1 page; idempotent scaffolding.

## Non-Goals

- **No automatic prod deploys.** The existing hard line stands; this spec adds
  discipline *around* the human-approved deploy, never automation *of* it.
- **No CI/CD or monitoring platform dependency** in skill text — shapes and
  gates, with defaults noted the way `stack-baseline.md` notes defaults.
- **No client-facing pricing/effort data.** Estimation internals (Phase 6)
  never land in client-visible artifacts; the client status (Phase 7) shows
  scope and verified progress, not hours.
- **No new heavy process.** Each new artifact is a checklist or a one-pager;
  release/ops discipline scales down for prototypes exactly like the security
  checklist does ("warn for prototype, require for production").

## Phasing & Steps

### Group 1 — close the lifecycle

### Phase 1 — Release gate: ship is a phase, not an afterthought

- New `skills/sailes-bootstrap/release-checklist.md` (mirrors the security
  checklist's profile logic — required for production client apps):
  - **Environment parity:** staging exists and runs the same migrations +
    seeds; config/secrets diff between staging and prod reviewed (names, not
    values).
  - **Migration ordering:** expand/contract steps mapped onto deploy order
    (which migration runs before/after which deploy — extends
    `sailes-database`'s existing safety rules to the release timeline).
  - **Post-deploy smoke:** a scripted minimal proof on prod after deploy
    (health endpoint + login + one critical read + one critical write on
    fixture-safe data), output pasted into the run log.
  - **Rollback plan:** the one paragraph answering "the deploy is bad — what
    exactly do we run/click, and does it survive the migration that shipped?"
    Written *before* the deploy, not during the incident.
- `sailes-implement/SKILL.md` "On completion": deploying phases end at the
  release checklist, not at green tests; the human approves the prod step
  (unchanged), but approval is *of a completed checklist*, not of a vibe.
- `skills/README.md` pipeline map + `sailes-start`: show release as an explicit
  step after implement.

**Done-when (binary):**
```bash
test -f skills/sailes-bootstrap/release-checklist.md && echo OK        # OK
grep -ci "rollback" skills/sailes-bootstrap/release-checklist.md       # ≥ 2
grep -ci "smoke" skills/sailes-implement/SKILL.md                      # ≥ 1
grep -ci "release" skills/README.md                                    # ≥ 1
```

### Phase 2 — Ops baseline with teeth: run it, don't just build it

- `repo-done-checklist.md` gains an **Operations block** (production profile):
  - error tracking wired **and alerting a human channel** (a silent Sentry is
    decoration), with the category default noted;
  - `/health` endpoint covering app + DB + worker/queue;
  - backups scheduled **and one restore actually performed** into a scratch
    environment, output pasted — the restore test is the checklist item;
  - uptime check on the public URL;
  - `.ai/runbook.md` one-pager: where it's deployed, how to see logs, how to
    restart, how to restore, who to call.
- `modules-catalog.md`: the baseline's "observability" word expands into this
  concrete minimum so bootstrap scaffolds it.
- Business note (README, one line): this block is the standardized deliverable
  a maintenance contract sells — the framework makes "we run it for you" a
  product, not a favor.

**Done-when (binary):**
```bash
grep -ci "restore" skills/sailes-bootstrap/repo-done-checklist.md      # ≥ 2
grep -ci "runbook" skills/sailes-bootstrap/repo-done-checklist.md      # ≥ 1
grep -ci "health" skills/sailes-bootstrap/modules-catalog.md           # ≥ 1
grep -ci "alert" skills/sailes-bootstrap/repo-done-checklist.md        # ≥ 1
```

### Group 2 — prove the quality

### Phase 3 — Provable RBAC: the authz matrix is generated tests

The permission map the security checklist already demands becomes an executable
artifact — the flagship "provable quality" feature and the checklist's biggest
prose→machine ratchet (cross-ref: engineering-layer Phase 1):

- `spec-writing-template.md` + `sailes-spec`: any spec touching auth/roles
  declares the **permission matrix** — actions × roles → allow/deny — as a
  table in the spec (it already must think about this; now it's structured).
- `sailes-implement`: from that table, generate the **matrix test suite** —
  for every action × role: authenticated request → expect the declared
  allow/deny; plus the anonymous row (every non-public route → deny). Fixture
  users per role exist per the engineering layer's environment phase.
- `security-checklist.md`: the RBAC and tenancy-isolation lines flip from
  "[ ] confirmed by reading" to "[ ] matrix suite exists and passes"
  (tenancy: same generated pattern — every scoped query family gets a
  cross-org denial test).
- Client-facing effect (one line in README): "every permission in your app has
  a test asserting it" is a sales sentence no checklist can produce.

**Done-when (binary):**
```bash
grep -ci "permission matrix\|authz matrix" skills/sailes-bootstrap/spec-writing-template.md  # ≥ 1
grep -ci "matrix" skills/sailes-implement/SKILL.md                     # ≥ 1
grep -ci "matrix" skills/sailes-bootstrap/security-checklist.md        # ≥ 2
```
GREEN subagent test: an agent implementing a spec with a permission table
produces per-role allow/deny tests without being asked (baseline: permission
checks implemented, but only happy-path tested).

### Phase 4 — Defect-escape flywheel: every escaped bug strengthens a gate

- `agents-md-template.md` (or lessons section) + `agentic-first-principles.md`:
  a defect found **after** the gates passed (by the client, in prod, or in a
  later phase) is a *gate failure*, not just a bug. The fix ships with a
  **gate autopsy** — one structured entry: which gate should have caught it
  (`checker` / `qa` / Done-when / security / release checklist) and **what
  check that gate now gains** (checklist line, eval scenario, matrix row, lint
  rule — preferring enforcement per the ratchet).
- `.ai/lessons.md` template gains the `Escaped-defect:` entry shape; the
  promotion rule treats gate-autopsy entries as priority promotion candidates.
- The framework-level mirror: when the autopsy generalizes ("qa never checks
  empty states"), it lands in this repo as a skill edit + eval — the runtime
  twin of the engineering layer's `evals/`.

**Done-when (binary):**
```bash
grep -ci "gate autopsy\|escaped defect" skills/sailes-bootstrap/agents-md-template.md        # ≥ 1
grep -ci "escaped" skills/sailes-bootstrap/agentic-first-principles.md # ≥ 1
```

### Group 3 — compound the business

### Phase 5 — Golden modules: built twice → extracted, hardened, versioned

- `modules-catalog.md` gains a **graduation rule**: a module implemented for
  the ~2nd time across Sailes projects becomes an extraction candidate — the
  lead notes it in `.ai/lessons.md` (`Module-candidate:`), and the candidate
  list is reviewed like promotion candidates.
- Extracted modules live in a Sailes golden-module library (location = Open
  Question): versioned, with their matrix tests, seeds, and per-module
  AGENTS.md included — a module ships with its proofs, not just its code.
- `sailes-bootstrap`: the decision engine checks the library **before**
  scaffolding a module from scratch; worker briefs' `Reference:` line points
  at the golden implementation when one exists.
- Effect: delivery speed and margin compound per project; the catalog stops
  being only a menu of *what to build* and becomes an inventory of *what is
  already hardened*.

**Done-when (binary):**
```bash
grep -ci "graduation\|module-candidate" skills/sailes-bootstrap/modules-catalog.md  # ≥ 1
grep -ci "golden" skills/sailes-bootstrap/SKILL.md                     # ≥ 1
grep -ci "golden\|library" skills/sailes-bootstrap/agent-team-structure.md  # ≥ 1
```

### Phase 6 — Estimation loop: spec estimates meet run-log actuals

- `spec-writing-template.md`: each phase optionally carries an internal
  estimate (hours or S/M/L — grain is an Open Question).
- `sailes-implement` "On completion": the close-out records per-phase
  **estimate vs actual** (the run log already contains the raw trail) plus a
  one-line "why the delta" — into an internal ledger, **never** into
  client-visible docs.
- `sailes-wycena` (the pricing skill) reads the ledger's aggregates as its
  baseline: "module X, complexity Y → historically N±σ hours". Pricing
  sharpens with every project — compounding applied to margin.

**Done-when (binary):**
```bash
grep -ci "estimate" skills/sailes-bootstrap/spec-writing-template.md   # ≥ 1
grep -ci "estimate vs actual\|actuals" skills/sailes-implement/SKILL.md  # ≥ 1
```

### Phase 7 — Client-visible progress: status is generated, not asked for

- `agents-md-template.md` scaffold: `STATUS.md` (client-readable, in the repo
  or exported) derived mechanically from live specs — per feature: phases
  done/total, the plain-language Done-when result ("47 tests pass, verified
  2026-07-05"), and for UI phases the accepted screenshot from `.ai/screens/`.
- `sailes-implement`: updating STATUS.md is part of the phase gate (one
  command/edit, not a ceremony); no effort/pricing data ever appears in it.
- Effect: "where are we?" costs zero PM time, and the client sees *verified*
  progress with evidence — which is the framework's quality made visible, i.e.
  the sales artifact for the methodology itself.

**Done-when (binary):**
```bash
grep -c "STATUS.md" skills/sailes-bootstrap/agents-md-template.md      # ≥ 1
grep -c "STATUS.md" skills/sailes-implement/SKILL.md                   # ≥ 1
```

## Open Questions (gate — answer before implementation)

1. **Scope:** which phases? Recommended order by value density: **3 → 1 → 4**
   (provable RBAC is cheap — the permission map already exists — and is the
   strongest client-facing differentiator; release closes the riskiest gap;
   the flywheel compounds forever), then 5, 6, 2, 7.
2. **Release form (Phase 1):** checklist + gate inside existing skills
   (recommended — promote to a `sailes-release` skill only if it outgrows one
   page), or a new skill from day one?
3. **Error-tracking default (Phase 2):** Sentry as the named default
   (category: error tracking), or leave fully vendor-neutral?
4. **Golden library home (Phase 5):** separate `sailes-modules` repo
   (recommended — versioning + reuse across clients) or a directory here?
5. **Estimate grain (Phase 6):** hours (recommended — wycena is hourly) or
   T-shirt sizes? And where does the internal ledger live — this repo's `.ai/`,
   Notion, or per-project private notes?
6. **STATUS.md exposure (Phase 7):** committed in the client repo (recommended,
   zero infra) or exported/shared externally?

## Security

Docs/templates-only. Net effect of adoption is risk-reducing: Phase 3 makes
authz regression-proof; Phase 2 makes restore tested and incidents runnable;
Phase 1 forbids un-planned rollbacks. Phase 6's effort ledger is internal-only
by explicit non-goal; Phase 7's STATUS.md contains no secrets, no effort data.

## Integration Coverage

- **RED baselines before edits** (TDD-for-skills): Phase 1 — an agent finishing
  a deployable spec today ends at green tests with no release artifacts;
  Phase 3 — permission checks are implemented but no per-role deny tests
  appear; Phase 4 — a post-gate bug produces a fix commit and no gate change;
  Phase 7 — no client-readable artifact exists after a phase completes.
  Record each in the run log before editing.
- **GREEN re-tests** after edits: the same scenarios must flip; persist them as
  `evals/` scenarios once the engineering layer's Phase 7 lands.
- All Done-when blocks run with output pasted before the PR opens.
- After merge: `./install.sh --force`.

## Progress

- [ ] Phase 1 — Release gate (checklist, smoke, rollback)
- [ ] Phase 2 — Ops baseline with teeth (restore test, runbook, alerting)
- [ ] Phase 3 — Provable RBAC (generated authz matrix tests)
- [ ] Phase 4 — Defect-escape flywheel (gate autopsy)
- [ ] Phase 5 — Golden-module library (graduation rule)
- [ ] Phase 6 — Estimation loop (estimate vs actual → wycena)
- [ ] Phase 7 — Client-visible STATUS.md

# Agentic-First Next Level — move truth from prose into the machine

Status: implemented
Date: 2026-07-05

> Dogfooding note: skills repo, not an app repo — Data Model / API & UI Surface /
> Jobs are N/A. Every phase carries a binary **Done-when**.
>
> **Approved + implemented 2026-07-05** — Marcin delegated the Open Questions
> ("wprowadź wszystkie zmiany jakie uważasz że dodadzą wartość"); the recommended
> answers were applied and are recorded in **Decisions** below. All Done-when blocks
> ran green (output in the session run log). Move to `implemented/` after PR merge.
>
> Revision note: v1 of this proposal was derived from the loop-engineering roadmap.
> This v2 is a first-principles rethink. Two v1 items survive on their own merits
> (dogfooding, persisted evals — Phase 7); v1's loop-mode/BLOCKED-BY-POLICY/routines
> are deprioritized to the backlog (see "Deprioritized from v1" at the end).

## TLDR & Context

The framework's current strength is **process discipline written as prose that
agents are instructed to obey**: gates, briefs, escalation rules, checklists. That
was the right first layer. Its ceiling: an agent follows enforced rules ~always and
prose rules ~usually — and "usually" compounds badly across hundreds of agent-hours.

The thesis of this spec: **agentic-first means moving truth from prose into the
machine**, in three moves —

1. **Rules → enforcement.** Every mechanically checkable convention migrates from
   AGENTS.md prose into lint/types/tests/hooks. Prose keeps only judgment.
2. **Verification → executable artifacts.** Contracts are typed artifacts, not
   paragraphs; acceptance criteria are committed failing tests, not command lists;
   the environment boots in one command with seeded data, or `qa` cannot exist.
3. **Knowledge → layered, fresh, versioned context.** Docs that lie are worse than
   no docs; context that doesn't fit is context that isn't read; a standard that
   can't be upgraded across the portfolio doesn't compound.

## Problem Statement

Verified against the repo on 2026-07-05:

1. **Conventions live as prose and only as prose.** `agents-md-template.md` states
   rules ("no new `any`", "design tokens only", "validation at the boundary") that
   are all mechanically checkable — yet nothing in the framework says *make the
   machine enforce them*. `checker` burns judgment capacity re-verifying things a
   lint rule would catch in milliseconds, and every worker brief re-states
   constraints the toolchain could make unviolable.
2. **The frozen BE contract has no prescribed physical form.** The canon freezes
   the contract before `fe-dev` starts, but doesn't require it to exist as a typed
   artifact (shared TS types / zod schemas / OpenAPI) that both slices import —
   so contract drift is a review finding instead of a compile error.
3. **Session discipline depends on agent goodwill.** "Read STATE.md at session
   start, write before walking away" is an instruction the agent may skip under
   context pressure. Claude Code hooks (SessionStart / PreToolUse) and a
   permissions manifest can make memory-injection and protected-path rules
   *structural* — the framework doesn't ship either.
4. **Nothing budgets the inner loop.** Agent productivity is dominated by
   time-to-verdict: how fast the environment says "wrong". The framework asks for
   "fast feedback" in principle but never verifies it: no one-command boot with
   seeded data, no fixture users per RBAC role, no measured check/test latency in
   `repo-done-checklist.md`. `qa`'s known failure mode ("stack/creds missing") is
   treated as a qa-behavior rule when it is actually a bootstrap defect.
5. **The generated architecture isn't parallel-safe.** Nothing in
   `skeleton.md`/`modules-catalog.md` steers layout away from files that every
   change must touch (hand-edited barrels, central route/registry files) — the
   merge-conflict magnets that make concurrent agents collide. Team-level worktree
   rules (v1 Phase 4) treat the symptom; layout treats the cause.
6. **Context has no size or freshness discipline.** The generated AGENTS.md grows
   monotonically (lessons promote *into* it, nothing moves *out*); no rule keeps
   the root small with per-module docs colocated; nothing detects doc drift
   (referenced paths/commands that no longer exist). A stale AGENTS.md actively
   misleads every future agent.
7. **Skill tests die with the chat + the repo ignores its own standard.**
   (Carried from v1, still true: no `evals/` on disk; no `.ai/STATE.md`/
   `backlog.md`/`lessons.md` here; the 2026-07-02 spec is complete but unmoved,
   `Status: in-progress`.)
8. **The framework itself has no version.** Generated repos don't record which
   framework version bootstrapped them; `adopt-existing-repo.md` has no "upgrade"
   mode. Improvements land in new projects only — the existing portfolio never
   compounds.

## Proposed Solution

Eight additive phases in two tracks. Track A moves truth into the machine
(enforcement, artifacts, environment, layout). Track B makes knowledge compound
(context, spec-as-tests, evals+dogfooding, versioning).

Principles preserved: developer owns key decisions; no hard dependency on any
harness feature (hooks/permissions are shipped as templates and marked as the
enforcement layer *where available* — the prose rule remains as fallback);
idempotent scaffolding; no new skills.

## Non-Goals

- **No autonomy expansion.** Enforcement narrows what agents can do wrong; it
  never widens what they decide.
- **No CI platform dependency.** Phases reference "a check that runs"; wiring to
  GitHub Actions etc. is a per-project backlog item.
- **No custom tooling/plugins built in this pass.** Phase 1 prescribes *using*
  lint/type machinery (e.g. ESLint `no-restricted-*`, typed contract imports),
  not authoring a custom plugin; a bespoke rule package is a backlog candidate.
- **No rewriting of generated repos' history** — upgrade mode (Phase 8) is
  additive, gated by the human, per the adopt-existing-repo philosophy.

## Phasing & Steps

### Track A — move truth into the machine

### Phase 1 — Enforce, don't instruct (the convention ratchet)

New section in `agentic-first-principles.md` + edits to `agents-md-template.md`
and the promotion rule:

- **The ratchet rule:** any convention that can be checked mechanically MUST be
  enforced mechanically (lint rule, type constraint, test, hook) — and once
  enforced, the AGENTS.md prose line is **replaced by a one-line pointer** to the
  enforcement. Prose is reserved for judgment calls machines can't make.
  Examples of immediately ratchetable rules already in the template: no new
  `any` (`@typescript-eslint/no-explicit-any` as error), design tokens only
  (`no-restricted-syntax` on raw color/spacing literals in components),
  validation at the boundary (zod schema required at route/server-function
  entry — enforceable by convention test), import direction between modules
  (`import/no-restricted-paths` or dependency-cruiser).
- **Promotion rule sharpened** (extends 2026-07-02 Phase 5): a lesson promoted to
  repo level lands as an *enforced check* whenever checkable — AGENTS.md prose is
  the fallback, not the default. The promotion ladder becomes:
  lesson → enforced rule → (only if uncheckable) AGENTS.md prose → skill.
- **`checker` scope cut:** the review checklist explicitly excludes everything
  the toolchain enforces — checker verifies judgment (spec fit, naming, design
  intent, edge cases), not mechanics. Worker briefs shrink accordingly
  (constraints = "the toolchain is the constraint; here's what it can't see").

**Done-when (binary):**
```bash
grep -ci "ratchet" skills/sailes-bootstrap/agentic-first-principles.md   # ≥ 1
grep -ci "enforced mechanically\|enforce mechanically" skills/sailes-bootstrap/agentic-first-principles.md  # ≥ 1
grep -ci "pointer to the enforcement\|replaced by a.*pointer" skills/sailes-bootstrap/agents-md-template.md # ≥ 1
grep -ci "toolchain" skills/sailes-bootstrap/agent-team-structure.md     # ≥ 1
```
GREEN subagent test: an agent promoting the lesson "raw hex colors keep appearing
in components" proposes a lint rule + pointer, not another AGENTS.md paragraph
(baseline: prose-only promotion).

### Phase 2 — Contract as artifact, not paragraph

- `agent-team-structure.md` ("BE contract finalized" step): *frozen* means a
  **committed, typed artifact** — shared TS types / zod schemas (or OpenAPI where
  external) in a location both slices import from. `fe-dev` builds against the
  import; drift is a compile/type error, not a checker finding. The prose contract
  in the brief becomes a pointer to the artifact path.
- `spec-writing-template.md` + `sailes-spec/SKILL.md` (API & UI Surface section):
  the spec names the contract artifact path(s) it will create/extend.
- `stack-baseline.md`: note where the shared contract lives in the default stack
  (e.g. `src/shared/contracts/` with zod schemas inferred to TS types).

**Done-when (binary):**
```bash
grep -ci "typed artifact\|contract artifact" skills/sailes-bootstrap/agent-team-structure.md  # ≥ 1
grep -ci "contract artifact\|typed artifact" skills/sailes-bootstrap/spec-writing-template.md # ≥ 1
grep -ci "contracts" skills/sailes-bootstrap/stack-baseline.md                                # ≥ 1
```

### Phase 3 — Harness guardrails: hooks + permissions manifest in the skeleton

Ship structural discipline where the harness supports it (Claude Code today),
with prose as documented fallback elsewhere:

- `skeleton.md` gains a `.claude/` block for generated repos:
  - `settings.json` **permissions template** — allow the verify commands
    (test/lint/typecheck/build/dev) without prompts; deny-by-default the
    protected surface (`.env*` writes, prod migration/deploy commands,
    force-push). The "workers never commit/push" rule gets a mechanical backstop.
  - **SessionStart hook** — inject `.ai/STATE.md` + Task Router pointer into
    context at session start ("read at session start" stops being a memory test).
  - **PreToolUse guard** — block edits to protected paths (applied migrations,
    lockfiles unless task says so, `.ai/specs/implemented/`).
- `agents-md-template.md`: short "Guardrails" note — what is harness-enforced vs
  what remains prose, so agents in other harnesses know which rules lost their
  backstop.
- `repo-done-checklist.md`: verify `.claude/settings.json` + hooks exist.

**Done-when (binary):**
```bash
grep -c "settings.json" skills/sailes-bootstrap/skeleton.md            # ≥ 1
grep -ci "SessionStart" skills/sailes-bootstrap/skeleton.md            # ≥ 1
grep -ci "PreToolUse\|protected path" skills/sailes-bootstrap/skeleton.md  # ≥ 1
grep -c "settings.json" skills/sailes-bootstrap/repo-done-checklist.md # ≥ 1
```

### Phase 4 — The environment is the agent's real interface (time-to-verdict)

- `repo-done-checklist.md` gains an **Environment block** (all verified, with
  outputs pasted):
  - **One-command boot:** clean clone → running app with seeded data in a single
    documented command.
  - **Seeded fixtures:** at least one fixture user *per RBAC role* + a realistic
    minimal dataset — `qa` can always log in and exercise real flows.
  - **Fast verdict:** a single `check` command (typecheck+lint+unit) with its
    measured wall time recorded; targeted test invocation documented (run one
    file/one test, not the world).
- `skeleton.md`: `seed/` (or `scripts/seed.ts`) + `.env.example` completeness rule
  (every variable the app reads, with safe defaults or clear placeholders).
- `agent-team-structure.md` (`qa` role): "stack/creds missing" is reclassified —
  not a qa judgment call but a **bootstrap defect**: qa reports ENV-DEFECT and the
  lead escalates; the fix is the seed/boot path, never a skipped proof.
- `sailes-bootstrap/SKILL.md`: time-to-verdict named as a stack-choice criterion
  (a stack the agent can't verify fast is a worse stack *for this methodology*).

**Done-when (binary):**
```bash
grep -ci "one-command boot\|single command" skills/sailes-bootstrap/repo-done-checklist.md  # ≥ 1
grep -ci "fixture user" skills/sailes-bootstrap/repo-done-checklist.md   # ≥ 1
grep -ci "ENV-DEFECT" skills/sailes-bootstrap/agent-team-structure.md    # ≥ 1
grep -ci "seed" skills/sailes-bootstrap/skeleton.md                      # ≥ 1
```

### Phase 5 — Parallel-safe layout: design away file contention

New subsection in `agentic-first-principles.md` + notes in `skeleton.md` /
`modules-catalog.md`. Concurrent agents (and concurrent humans) collide on files
every change must touch; the fix is architectural, not procedural:

- **No hand-edited aggregation points:** no hand-maintained barrel files
  (`index.ts` re-export walls), no central hand-edited route/registry/menu file —
  prefer file-based conventions (file-based routing already in the default
  stack) and generated aggregations where a registry is unavoidable.
- **Feature-folder ownership:** a feature's route, components, server functions,
  schemas, and tests colocate under one folder — one task touches one subtree.
- **One-owner-per-file heuristic for decomposition:** the lead slices tasks so no
  two concurrent workers write the same file; if the slicing can't achieve that,
  the tasks aren't parallel (sequential or worktrees — mechanism per team canon).

**Done-when (binary):**
```bash
grep -ci "barrel" skills/sailes-bootstrap/agentic-first-principles.md        # ≥ 1
grep -ci "parallel-safe\|file contention" skills/sailes-bootstrap/agentic-first-principles.md  # ≥ 1
grep -ci "colocat" skills/sailes-bootstrap/skeleton.md                       # ≥ 1
```

### Track B — make knowledge compound

### Phase 6 — Context layering + freshness (docs that lie are worse than none)

- `agents-md-template.md`: **size budget** for the root AGENTS.md (target ≤ ~150
  lines) — module detail moves to per-module colocated docs
  (`src/modules/x/AGENTS.md` or README) that the Task Router points to. The root
  is a map, not an encyclopedia. Lessons that promote into AGENTS.md must displace
  or merge, not only append (the size budget forces curation).
- **Freshness check** (in `repo-done-checklist.md` + `adopt-existing-repo.md`
  audit): every file path and command referenced in AGENTS.md / Task Router must
  exist / run — a scriptable grep-and-stat pass; failures are doc drift and block
  "done". (This check is also the seed of any future maintenance routine.)

**Done-when (binary):**
```bash
grep -ci "size budget\|150 lines" skills/sailes-bootstrap/agents-md-template.md  # ≥ 1
grep -ci "freshness" skills/sailes-bootstrap/repo-done-checklist.md              # ≥ 1
grep -ci "freshness\|doc drift" skills/sailes-bootstrap/adopt-existing-repo.md   # ≥ 1
```

### Phase 7 — Evals on disk + dogfooding (v1 survivors)

Unchanged in substance from v1, trimmed:

- **Dogfooding:** close the 2026-07-02 spec lifecycle (`Status: implemented`,
  `git mv` to `implemented/`); add this repo's own `.ai/STATE.md`, `.ai/backlog.md`
  (seeded with the deprioritized v1 items below), `.ai/lessons.md`.
- **`evals/`:** persisted, re-runnable regression scenarios for the skills
  themselves — one markdown scenario per protected behavior (setup for a fresh
  subagent + binary expected assertion + last-run line); wired into
  `skills/README.md`'s TDD-for-skills discipline (edit a skill → re-run its
  evals; new behavior → new eval first). Evals are the persisted form of the
  RED/GREEN tests this repo already runs but currently loses with the chat.

**Done-when (binary):**
```bash
test -f .ai/specs/implemented/2026-07-02-loop-engineering-adoption.md && echo OK  # OK
test -f .ai/STATE.md && test -f .ai/backlog.md && test -f .ai/lessons.md && echo OK  # OK
ls evals/*.md | wc -l                        # ≥ 6 (README + ≥5 scenarios)
grep -ci "evals/" skills/README.md           # ≥ 1
```

### Phase 8 — Version the standard; upgrade the portfolio

- Add `FRAMEWORK_VERSION` (single source: a `VERSION` file in this repo, bumped
  per merged change-set; `install.sh` prints it).
- `agents-md-template.md`: generated AGENTS.md carries
  `Framework-Version: <x.y>` in its header.
- `adopt-existing-repo.md`: new **upgrade mode** — when a repo's stamped version
  is older than current, diff the standard (what did the framework add/change
  since x.y — sourced from a `CHANGELOG.md` this repo starts keeping) and apply
  additively with the same idempotency rules; the human approves the delta.
- Effect: framework improvements reach *existing* client repos deliberately,
  instead of only benefiting the next greenfield.

**Done-when (binary):**
```bash
test -f VERSION && echo OK                                             # OK
grep -ci "Framework-Version" skills/sailes-bootstrap/agents-md-template.md  # ≥ 1
grep -ci "upgrade" skills/sailes-bootstrap/adopt-existing-repo.md      # ≥ 2
test -f CHANGELOG.md && echo OK                                        # OK
```

## Deprioritized from v1 (→ `.ai/backlog.md` in Phase 7)

- **Loop mode with iteration cap** — still sound, but Phases 1–4 shrink the need:
  most loop iterations exist to satisfy checks that enforcement now makes
  unviolable or the environment surfaces instantly. Revisit after Track A lands.
- **BLOCKED-BY-POLICY protocol** — real but rare; one paragraph can join the
  escalation rules whenever `agent-team-structure.md` is next edited.
- **Scheduled maintenance routine** — valuable, but it needs something to run:
  Phase 6's freshness check and Phase 7's evals are its future payload. Backlog
  until both exist.
- **Team-level worktree fan-out rules** — subsumed: Phase 5 removes the collision
  cause; the canon's existing fallback sentence covers the mechanism.

## Decisions (Open Questions closed 2026-07-05 — user delegated to recommendations)

1. **Scope:** all eight phases.
2. **Ratchet depth:** stock lint/type rules first, **plus** per-repo convention tests
   where no stock rule exists (Zod-at-boundary is specified as a convention test).
3. **Permissions strictness:** verify-commands allowlist + deny on the protected
   surface (`.env*`, prod migrate/deploy, force-push) — matches "workers never
   commit/push".
4. **Root AGENTS.md budget:** ~150 lines, displace-don't-append.
5. **Versioning grain:** one framework-wide version (`VERSION` = 1.1.0 + `CHANGELOG.md`).

## Security

Docs/templates-only change to skill files. Net runtime effect of adoption is
risk-reducing: Phase 3 narrows what agents can touch (deny-listed paths,
no-prompt surface limited to verify commands); Phase 4 removes the incentive to
fake qa passes. No secrets are introduced; `.env.example` rule explicitly
excludes real values.

## Integration Coverage

- **RED baselines before each phase's edits** (TDD-for-skills): Phase 1 — an agent
  promoting a checkable lesson produces prose, not enforcement; Phase 2 — a lead
  freezes a contract as brief-text only; Phase 4 — repo-done passes with no seed
  path and unmeasured check time; Phase 6 — AGENTS.md references are not verified
  against disk. Record each in the run log before editing.
- **GREEN re-tests** after edits: same scenarios must flip; Phase 7 then persists
  them as `evals/` scenarios.
- All Done-when blocks run with output pasted before the PR opens.
- After merge: `./install.sh --force` to sync `~/.claude/skills/`.

## Progress

- [x] Phase 1 — Enforce, don't instruct (convention ratchet)
- [x] Phase 2 — Contract as typed artifact
- [x] Phase 3 — Harness guardrails (hooks + permissions)
- [x] Phase 4 — Environment / time-to-verdict
- [x] Phase 5 — Parallel-safe layout
- [x] Phase 6 — Context layering + freshness
- [x] Phase 7 — Evals on disk + dogfooding
- [x] Phase 8 — Version the standard, upgrade the portfolio

All Done-when blocks ran green on 2026-07-05 (outputs pasted in the session run log).
Behavioral GREEN re-runs for the new text-level behaviors are tracked in `evals/`
("pending post-merge" lines) and `.ai/backlog.md` (tech debt row).

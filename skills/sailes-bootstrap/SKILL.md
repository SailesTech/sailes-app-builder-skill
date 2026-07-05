---
name: sailes-bootstrap
description: Use right AFTER discovery (the needs/scope interview) and BEFORE writing implementation code, to choose the tech stack + architecture for a custom B2B web app AND orient to / establish the agentic-first methodology. Triggers — "zorientuj się w repo", "ustaw projekt", "wybierz stack", "jaki stack / podejście", "ruszamy", entering any web-app repo (existing or empty) to start building. Classifies the project, activates only the modules it needs, recommends/validates the stack from a researched baseline, and drives in-repo setup.
---

# Project Bootstrap — Stack & Architecture for Custom B2B Apps (agentic-first)

## Overview

**The bridge between knowing WHAT to build (discovery) and starting to build it.** For the recurring profile — **custom web apps for ONE client/company** (~90% of cases): sales-support, CRM-adjacent, auto-offering, email automation, webhooks, syncs, reports, Pipedrive — this skill picks the right stack + architecture and sets up the repo to be agentic-first.

Two modes:
1. **Decision mode** — classify the project (tenancy, source-of-truth, integrations, modules, risks), then select the stack variant + activate only the modules the requirements imply.
2. **Agent / implementation mode** — drive in-repo setup: skeleton, guardrails, tests, config files, repo docs, working standards.

**Core principle:** Don't assume every app needs every module. There is a **fixed baseline** + **optional modules** activated only when the requirements demand them. And before the first line of feature code, the agent must know *how this repo expects an agent to work* and *what stack/architecture the work runs on* — guessing either is how projects rot.

It is **stack-agnostic in mechanism** but **opinionated in default** (see `stack-baseline.md`).

## When to Use / When NOT to

**Use when:** discovery is done and you're about to set up/orient before implementing; you enter any web-app repo (existing or empty) to start building; user asks "what stack / orient to the repo / set up the project."

**Do NOT use when:** mid-implementation with stack + methodology already established this session; a trivial one-line fix in a repo you already understand.

## Step 0 — Detect repo methodology state (cheap)

If you arrived via `sailes-start`, the route (A/B/C) was already chosen there — just confirm it against the filesystem below and proceed; don't re-deliberate. If invoked directly, detect it now.

Inspect: `CLAUDE.md`/`AGENTS.md` (root + per-folder), `.ai/` (specs, skills, checklists, adr), available skills, stack signals (`package.json`, lockfile, framework, ORM, `docker-compose`).

- **Case A — methodology EXISTS** (Open-Mercato, any agents.md repo): read & internalize the contract (root AGENTS.md → Task Router → relevant sub-AGENTS.md → relevant specs). Do NOT scaffold over it. Stack is mostly fixed → your job is *validate* it covers the work + decide *where/how to wire in*. **Trust the filesystem over the prompt** — if told "empty repo" but files exist, surface the discrepancy and do NOT overwrite.
- **Case B — empty repo, no methodology** (brand-new): you'll *establish* the agentic-first foundation incl. the baseline stack (Step 3) before any feature code.
- **Case C — populated repo, no methodology** (real code + real stack, but no AGENTS.md/`.ai/`): **adapt, don't rewrite.** Reverse-engineer the existing conventions, document the *existing* stack (validate mode, not the baseline), and add the methodology layer additively — never touching running code. Full procedure: `adopt-existing-repo.md`.

To distinguish B from C: is there real application code (`package.json` with deps, `src/`, tests, migrations)? None → Case B. Yes → Case C.

## Step 1 — Decision mode: classify the project

**Do NOT recommend a full architecture up front.** Walk `decision-engine.md`: ask the classification questions in adaptive rounds of 3-4 (`AskUserQuestion`), leading with the forks that change architecture — **tenancy** (single vs multi-tenant), **source-of-truth** (app-first / CRM-first / hybrid), **integrations/webhooks**, **sensitive data**, **prototype vs production**.

**The user owns every architectural decision; you recommend, they choose** (the foundational principle — see `agentic-first-principles.md` §0). Operationally: for each fork that materially shapes cost/scope/lock-in, present a **decision card** (options + ✅/⚠️ + reasoned recommendation → user picks); never apply a baseline choice silently as an "assumption."

Produce a **module manifest**: which optional modules are ON (email level, reporting level, files, pipedrive, workflow tier, feature flags), tenancy mode, and the security gate. Baseline (core app + mandatory worker + auth + DB + observability + testing) is always on — but even baseline items are stated as *recommended defaults the user can veto*, not silent givens.

**Two baseline items that are NOT free passes — present them as decision cards, never slipstream them:**
- **Worker process + monorepo** (`apps/worker` + pnpm monorepo). The baseline recommends it, but for a small, low-concurrency tool a leaner single Next.js app (background work in a route/queue-lite) may be enough. Present: monorepo+worker (✅ ready for webhooks/syncs/long jobs, clean separation ⚠️ more moving parts/devops up front) vs. single app (✅ simplest to start ⚠️ refactor later if real async work grows). Recommend per their integration/async needs; let them choose.
- **PDF / document generation** (when the app outputs documents). Offer the real options — e.g. Puppeteer/headless-Chrome (✅ full HTML/CSS fidelity ⚠️ heavier RAM/Railway tier) vs. `@react-pdf`/pure-JS (✅ light, no browser ⚠️ less layout flexibility) — with a recommendation tied to fidelity needs. Don't defer it to "later" silently; if truly deferred, log it as an explicit open decision.

## Step 2 — Establish agent working discipline (both cases)

Before the first line of feature code, internalize the working discipline in **`agentic-first-principles.md`** (it's in this skill's folder — read it): especially **§0** (developer owns the vision; AI interrogates, never decides), **§A** (verifiable done — run a check, show evidence, RED test first, behavior-before-diff), **§B** (security-by-default + `security-checklist.md` for production), and **§C** (adversarial fresh-context review before "done"). Commit to these for the session. Never bypass typecheck, delete tests, auto-deploy to prod, or run prod migrations without approval; ADR for architecture changes.

## Step 3 — Methodology onboarding / generation

- **Case A:** state the operative rules governing *this* task (not a dump). Honor the repo's spec-first gate, command/undo patterns, tenant isolation, RBAC, canonical primitives, integration tests in the same PR.
- **Case B:** propose + generate (after a quick confirm) the skeleton from `skeleton.md` and `agents-md-template.md`: `AGENTS.md` (concise), `CLAUDE.md`→`@AGENTS.md`, `README.md`, `.ai/{skills,checklists,adr}`, the pnpm monorepo with `apps/web` + `apps/worker`. Keep `AGENTS.md` concise — bloated memory files get ignored.
  - **Always generate a local `spec-writing` skill** at `.ai/skills/spec-writing/SKILL.md` from `spec-writing-template.md` (stack-agnostic, tuned to the locked stack). A new repo has no spec skill otherwise — Phase 3 of the pipeline depends on it existing. Adapt its `## Stack conventions` block to whatever stack the project locked.
  - Also carry over the `sailes-discovery` skill pattern into `.ai/skills/` if useful for future work.
  - **Generate the FULL `.ai/` structure** (specs/ + implemented/ + archived/, checklists, adr, skills, `backlog.md` from `backlog-template.md`, `lessons.md` with a header). `lessons.md` and `backlog.md` start as header-only files (filled during implementation) — present from day one so the convention is visible. **Idempotent rule: if any `.ai/` artifact already exists in the repo, do NOT overwrite it — add only what's missing and follow the repo's existing convention.** (Trust the filesystem.)
  - Also scaffold the **harness guardrails** (`.claude/settings.json` permissions + SessionStart/PreToolUse hooks) and root `STATUS.md` per `skeleton.md`, and stamp the generated AGENTS.md header with the current **`Framework-Version:`** (from this framework's `VERSION` file) so future adoption passes can compute the upgrade delta.
  - **Check the golden-module library BEFORE scaffolding any activated module from scratch** — a module already hardened across Sailes projects (see `modules-catalog.md`, graduation rule) is imported/adapted with its tests and per-module docs, not rebuilt at full cost.
  - **`git init` + a first commit are part of generation, not optional.** A repo with 0 commits is not set up. Commit the skeleton.
- **Case C:** follow `adopt-existing-repo.md` — reverse-engineer the existing conventions, generate `AGENTS.md`/`CLAUDE.md`/`.ai/` + the local `spec-writing` skill **filled with the REAL stack & commands** (not the baseline), record an ADR of the existing stack + gaps, and verify nothing broke using the repo's own test/build. Additive only — never modify running code.

## Step 4 — Stack decision (recommend or validate)

Open `stack-baseline.md` (the researched default; verified Jun 2026) + `modules-catalog.md` (optional modules with levels).
- **Empty repo:** the baseline (Railway · Postgres · Railway Buckets · Drizzle · Better Auth · Next.js+shadcn · pnpm monorepo · mandatory worker · async webhooks · Sentry/PostHog for prod) is your **recommendation, not a decree**. Present the consequential layers as **decision cards** — at minimum **frontend architecture** (Next.js fullstack vs SPA+standalone-API — see `stack-baseline.md` Frontend architecture + the Stack-shaping axes S1–S8 in `decision-engine.md`), **request-API engine** if split (Fastify vs Hono vs Express), **ORM** (Drizzle vs Prisma vs Kysely), **Auth** (Better Auth vs Clerk vs email/pw), **Hosting** (Railway vs Vercel+Neon), and any **tenancy** / **sync-depth** / **workflow-engine** fork — each with ✅/⚠️ and a reasoned recommendation, then let the user choose. Only TypeScript + pnpm are stated as flat defaults; **the framework shape is NOT pre-decided** — it follows from the business axes (public-vs-login, number of API consumers, independent deploy, backend heaviness) AND developer-fit (`developer-fit.md`: who builds it, framework familiarity, preference). A stated developer preference is a first-class input, weighed openly; a hard requirement that overrides it → ADR. Record every choice in the brief's **Decisions Ledger**.
- **Existing repo:** validate the platform's stack against the work's needs; flag gaps (the user decides whether to fill them).

**Do NOT recommend from stale memory** — defaults drift (Redis-by-reflex, deprecated auth libs, Prisma/Drizzle hand-waving). Use the researched file. **And do NOT collapse a decision card into a silent default** — the researched baseline tells you what to *recommend*, not what to decide for the user.

**Time-to-verdict is a stack-choice criterion.** Agent productivity is dominated by how fast the environment says "wrong" — a stack the agent can't boot with seeded data in one command, or whose check/test cycle is slow, is a *worse stack for this methodology* regardless of its other merits. Weigh it openly on the decision cards (and verify it later via the Environment block in `repo-done-checklist.md`).

## Step 4.5 — Design gate (MANDATORY for any UI work)

If the project has a user interface (almost all custom B2B apps do), **invoke the `sailes-design` skill before spec/implementation.** This is the phase whose absence produced "no real frontend project": a deliberate visual direction (palette, type, layout, signature element, anti-AI-default check) and a persisted design artifact — `design-system/MASTER.md` (and `pages/*.md` overrides) and/or `.ai/specs/ui-spec.md`.

- Carry in the confirmed brief + locked stack so design decisions match the product and the tokens target the real framework (Tailwind/shadcn etc.).
- The gate is met when a design artifact exists on disk (the checklist verifies it). A spec that only describes features with no design direction does NOT satisfy this gate.
- Backend-only/no-UI work (pure API, worker, integration job): skip explicitly and note why.

## Step 5 — Handoff (verify artifacts FIRST)

Methodology absorbed/established ✓, module manifest set ✓, stack locked ✓, design artifact present ✓.

**Before handing off, run the verification block in `repo-done-checklist.md` and show the output.** Do not claim bootstrap is done or proceed to spec/implementation while any `MISS` line remains — "I created the files" is not evidence; the `find`/`git log` output is. This check is what catches the silent failure where AGENTS.md / `.ai/skills/` / git / the design artifact were never actually written.

All green → hand to the spec phase: the local `.ai/skills/spec-writing/` you just generated (preferred — tuned to the locked stack), else the global `sailes-spec` skill. Then implementation. The agent team starts at *implementation*, not here.

## Quick Reference

| Phase | Case A: has methodology | Case B: empty repo | Case C: code, no methodology |
|---|---|---|---|
| Detect | read & internalize AGENTS.md/.ai | (none → generate) | reverse-engineer existing conventions |
| Classify | manifest via `decision-engine.md` | manifest via `decision-engine.md` | manifest via `decision-engine.md` |
| Methodology | adopt repo's contracts | **generate** baseline skeleton | **add additively** (`adopt-existing-repo.md`) |
| Stack | **validate** platform vs needs | **recommend** baseline | **document existing** (validate mode) |
| Output | wired-in plan honoring rules | foundation + baseline stack | methodology layer over real stack |

Reference files: `stack-baseline.md` (incl. Frontend architecture variants) · `modules-catalog.md` · `decision-engine.md` (classification + Stack-shaping axes S1–S8) · `developer-fit.md` (who-builds-it as a stack input) · `backlog-template.md` (deferred-ideas file, generated into `.ai/backlog.md`) · `security-checklist.md` · `skeleton.md` · `agentic-first-principles.md` · `agents-md-template.md` · `spec-writing-template.md` (generated into new repos) · `adopt-existing-repo.md` (Case C procedure + Step 0 re-adoption compliance audit) · `agent-team-structure.md` (Team Lead / worker roles, gates, run log — the canon for non-trivial work) · `repo-done-checklist.md` (verify artifacts before handoff — Step 5).

## Common Mistakes

| Mistake | Fix |
|---|---|
| Recommend full architecture before classifying | Classify first (`decision-engine.md`) → module manifest → then stack. |
| Build email/reporting/workflow by default | Optional modules activate ONLY from the manifest. |
| Force multi-tenant / `organizationId` everywhere | Single-tenant default; switch only when Q1 = many firms. |
| Empty repo → scaffold code before AGENTS.md/.ai | Generate the methodology skeleton first (Case B). |
| Recommend stack from memory | Use `stack-baseline.md`. |
| Treat Google login as Gmail access | Google login = auth baseline; Gmail = Email Level 3+ module. |
| Webhook handler runs business logic inline | Intake only (verify→validate→persist→202); worker does the work. |
| Existing repo → only map "where code goes" | Also surface working discipline + guardrails (Step 2). |
| Trust "empty repo" prompt over a populated disk | Trust the filesystem; surface the discrepancy, don't overwrite. |
| Case C: imposing the baseline stack on a populated repo | Document the EXISTING stack (validate mode); gaps → optional ADRs, never forced rewrites. |
| Case C: rewriting working code to adopt methodology | Methodology adoption is docs + config only; never modify running code. |
| Claiming "done" without verifying artifacts on disk | Run `repo-done-checklist.md`; show the `find`/`git log` output. "I created them" ≠ evidence. |
| Skipping a real design phase (UI work with no visual direction) | Invoke `sailes-design` (Step 4.5); a design artifact must exist before spec/impl. |
| Overwriting an existing `.ai/` artifact when scaffolding | Idempotent: never overwrite; add only what's missing, follow the repo's existing convention. |
| No git / 0 commits after "setup" | `git init` + commit the skeleton is part of Case B generation. |

## Red Flags — STOP

- You're recommending architecture and haven't produced a module manifest.
- Empty repo and you're scaffolding code before any AGENTS.md/`.ai/` exists.
- You named a queue/auth/ORM/storage without checking `stack-baseline.md`.
- **You locked an ORM/auth/hosting/tenancy choice and the user never chose it from a decision card** (it's a silent baseline). STOP — present options + pros/cons + recommendation, let them pick, log it in the Decisions Ledger.
- **You defaulted to Next.js fullstack without weighing the Stack-shaping axes** (public-vs-login? how many backend consumers? independent deploy? backend heaviness?). The framework shape is a decision card, not a given — a login-only tool with many API consumers (n8n/FHIR/CRM) signals SPA + standalone API.
- **You never asked who builds it / their familiarity / preference** (`developer-fit.md`). That's a first-class input. If a stated preference exists and you ignored it — or let it silently override a hard requirement — STOP.
- A production app and you haven't walked `security-checklist.md`.
- You're about to write feature code with no RED test and no verification check.
- You're about to say "bootstrap done" / hand off to spec, but haven't run `repo-done-checklist.md` and seen all-green output (AGENTS.md, `.ai/skills/`, git, design artifact present).
- The app has a UI and no design artifact exists (`sailes-design` never ran).
- You overwrote an existing `.ai/` file (lessons/backlog/specs/convention) instead of leaving it and adding only what's missing.
- A new repo and the `.ai/` structure is incomplete (missing `specs/implemented`, `specs/archived`, `backlog.md`, or `lessons.md` header).

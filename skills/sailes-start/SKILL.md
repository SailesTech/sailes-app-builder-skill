---
name: sailes-start
description: Use at the very START of building something, when the user wants to be led through the whole flow end-to-end — either a NEW project from scratch (business context → stack → agentic-first repo setup → spec) or DEEPENING a specific new feature/change in an existing app (scope → methodology → spec). Triggers — "zacznijmy nowy projekt", "poprowadź mnie przez całość", "nowa aplikacja od zera", "chcę zbudować X i nie wiem od czego zacząć", "zróbmy nową funkcjonalność", "od początku do końca". Thin orchestrator that runs sailes-discovery → sailes-bootstrap → spec-writing in order, with gates between phases.
---

# Start Project — End-to-End Orchestrator

## Overview

**This is the single entry point that runs the whole pre-implementation pipeline in order.** It does NOT re-implement anything — it sequences three existing skills and gates the handoffs between them, so nothing is skipped and nothing runs out of order.

```
        ┌─ ROUTE A: New project from scratch ─────────────────────────────┐
START → │  sailes-discovery(greenfield) → sailes-bootstrap(Case B: generate     │ → implementation
        │  repo+methodology+baseline stack) → spec-writing                 │
        └─────────────────────────────────────────────────────────────────┘
        ┌─ ROUTE B: Deepen a feature (repo already agentic-first) ────────┐
        │  sailes-discovery(brownfield) → sailes-bootstrap(Case A: absorb        │ → implementation
        │  methodology + validate stack) → spec-writing                    │
        └─────────────────────────────────────────────────────────────────┘
        ┌─ ROUTE C: Adopt an existing repo (code, no methodology) ────────┐
        │  sailes-discovery(brownfield, light) → sailes-bootstrap(Case C: add    │ → implementation
        │  methodology over the EXISTING stack) → spec-writing             │
        └─────────────────────────────────────────────────────────────────┘
```

**Core principle:** The user asked to be *led through the whole thing*. Your first job is to show them the map (the phases, where they are) and then walk it with a gate at each phase boundary — not to dive into phase 1 as if it were the whole task.

## When to Use / When NOT to

**Use when:** the user wants end-to-end guidance from the very beginning — "start a new project", "lead me through the whole thing", "build X from zero", "let's do a new feature" where the path from idea to implementation is the ask.

**Do NOT use when:**
- The user wants just one phase (only elicitation, only a stack opinion, only a spec) — call that skill directly (`sailes-discovery` / `sailes-bootstrap` / `spec-writing`).
- Mid-implementation; the pipeline is already done.
- A trivial one-line fix.

## Step 0 — Show the map, then route

1. **Show the pipeline** (the diagram above, in one breath) so the user knows the phases and that you'll gate between them. This is the "poprowadź mnie przez całość" contract.
2. **Route on the first decision** (the only thing you need before phase 1):

> "Zaczynamy **nowy projekt od zera (A)**, **pogłębiamy zmianę/funkcjonalność w aplikacji, która już ma nasz styl pracy (B)**, czy **adaptujemy istniejące repo (z kodem, ale bez naszej struktury agentic-first) do naszego stylu pracy (C)**?"

- New project from scratch (empty) → **Route A**.
- Feature/change in a repo that already has agentic-first methodology (AGENTS.md/`.ai/`) → **Route B**.
- Existing repo with real code but NO methodology (no AGENTS.md/`.ai/`, maybe a different stack) → **Route C** (adopt/adapt).

Detect from context (empty dir / "nowa aplikacja" → A; existing repo with AGENTS.md+`.ai/` → B; populated repo without them → C), but confirm if ambiguous — **trust the filesystem**: real code + no AGENTS.md/`.ai/` is C, not B. This route choice selects the *variant* of each downstream skill — it does not change the order.

## The pipeline (run in order, gate each boundary)

### Phase 1 — Discovery  →  invoke the `sailes-discovery` skill

- Route A → greenfield variant (full business/scale/stack/infra elicitation).
- Route B → brownfield variant (recon "does it already exist?" + precise scope + team handoff).
- Route C → brownfield variant, light — focus on understanding what the existing app does and the user's goal for the adoption (the heavy lifting is reverse-engineering, which happens in Phase 2).
- **Gate:** the user must confirm the Brief before Phase 2. Do not proceed on assumptions.

### Phase 2 — Bootstrap  →  invoke the `sailes-bootstrap` skill

- Carries the confirmed Brief in. Runs its decision-engine (classify → module manifest), establishes/absorbs the agentic-first methodology, and locks the stack.
- Route A → Case B: **generate** the repo skeleton + `AGENTS.md`/`CLAUDE.md`/`README.md`/`.ai/` + baseline stack + working system, **git init + first commit**. (Do NOT pre-create `lessons.md`.)
- Route B → Case A: **absorb** the repo's methodology + **validate** the stack for the change.
- Route C → Case C: **reverse-engineer** existing conventions, **document the existing stack** (validate mode), and **add** the methodology layer additively — never touching running code. (`adopt-existing-repo.md`.)
- Bootstrap includes its **Step 4.5 design gate** (invokes `sailes-design`) for any UI work, and its **Step 5 artifact verification** (`repo-done-checklist.md`).
- **Gate:** module manifest + stack + methodology + **design artifact** confirmed, and `repo-done-checklist.md` shows all-green (AGENTS.md, `.ai/skills/`, git, design artifact on disk), before Phase 3.

### Phase 2.5 — Design  →  (inside Phase 2, via `sailes-design`)

For any app with a UI, a deliberate design direction + persisted artifact (`design-system/MASTER.md` or `.ai/specs/ui-spec.md`) is produced here — this is the phase whose absence reads as "no real frontend project." Backend-only work skips it explicitly.

### Phase 3 — Spec  →  invoke `sailes-spec` (local copy if present, else the global skill)

- **By this point a local `spec-writing` skill always exists** at `.ai/skills/spec-writing/SKILL.md`:
  - Route A (new repo): Phase 2 **generated** it (from sailes-bootstrap's `spec-writing-template.md`).
  - Route B (existing agentic-first repo): it was already there (e.g. Open-Mercato's `.ai/skills/spec-writing/`).
  - Route C (adopted repo): Phase 2 **generated** it, tuned to the repo's REAL stack.
- Invoke that local skill to write the spec to `.ai/specs/{YYYY-MM-DD}-{kebab-title}.md`. If — and only if — no local skill exists (bootstrap was skipped), self-write the spec per the conventions bootstrap defined.
- **Gate:** spec approved before any implementation.

### Then — Implementation (skill-backed)

Once the spec is approved, implementation has its own skills (the agent team starts here):
- **`sailes-pre-implement`** — analyze the approved spec for readiness (BC impact, risks, gaps) → readiness report; fix the spec first if NOT-READY.
- **`sailes-implement`** — execute the spec phase by phase: RED test → implement → verify with evidence → commit per step → adversarial review gate → mark spec `implemented` + `git mv` to `.ai/specs/implemented/`.

This orchestrator's job ends when the spec is approved; it hands to these.

## Hard rules

- **Always show the map first.** Never dive into Phase 1 without telling the user the whole flow and gating plan.
- **Always route before Phase 1.** Greenfield vs brownfield is the first question; it picks the variant of every downstream skill.
- **Never skip a phase or a gate.** Brief → manifest+stack → spec → implementation. Each boundary needs explicit user confirmation.
- **Never re-implement** discovery/bootstrap/spec logic inline — invoke the skills. This orchestrator is thin by design.
- **Never jump to code** before the spec is approved.
- **Never skip the design phase** for a UI app — `sailes-design` runs inside Phase 2 and must leave an artifact on disk.
- **Never claim a phase done without evidence** — Phase 2 ends only when `repo-done-checklist.md` shows all-green (real `find`/`git log` output), not when you intended to create the files.
- One phase at a time. Finish and gate before invoking the next skill.

## Quick Reference

| Phase | Skill | Route A (new) | Route B (feature) | Route C (adopt) | Gate |
|---|---|---|---|---|---|
| 0 | — | show map + route | show map + route | show map + route | route chosen |
| 1 | `sailes-discovery` | greenfield | brownfield | brownfield (light) | Brief confirmed |
| 2 | `sailes-bootstrap` | Case B (generate) | Case A (absorb+validate) | Case C (adapt over existing) | manifest+stack+methodology |
| 2.5 | `sailes-design` | direction + artifact | direction (if UI) | direction (if UI) | design artifact on disk |
| — | (verify) | `repo-done-checklist.md` | additive artifacts | additive artifacts | all-green, no MISS |
| 3 | `sailes-spec` (or local) | local (generated) | local (existing) | local (generated, real stack) | spec approved |
| → | (implementation) | team starts | team starts | team starts | — |

## Common Mistakes

| Mistake | Fix |
|---|---|
| Diving into discovery questions without showing the pipeline | Step 0: show the map first, then route. |
| Skipping the route question (A/B/C) | It's the first decision — it selects every downstream variant. |
| Calling a populated-but-no-methodology repo "Route B" | Real code + no AGENTS.md/`.ai/` = Route C (adopt), not B. |
| Route C: imposing the baseline stack / rewriting code | Document the existing stack; methodology is additive (docs+config only). |
| Going Brief → code, skipping bootstrap | Phase 2 (bootstrap) is mandatory: decision-engine + stack + methodology. |
| Re-writing discovery/stack logic inline | Invoke the skills; keep this orchestrator thin. |
| Proceeding past a gate without confirmation | Each phase boundary needs explicit user sign-off. |
| Running phases in parallel | Strictly sequential; one gate at a time. |

## Red Flags — STOP

- You started asking elicitation questions and the user never saw the phase map.
- You're about to write a spec and bootstrap (stack/methodology/manifest) never ran.
- You're about to write a spec and there's no `AGENTS.md` / `.ai/skills/` / git — bootstrap didn't really finish; run `repo-done-checklist.md`.
- It's a UI app and no design artifact exists (`sailes-design` never ran).
- You're about to write code and there's no approved spec.
- You inlined a stack recommendation instead of invoking `sailes-bootstrap`.

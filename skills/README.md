# Sailes App-Builder Skills

A modular set of Claude Code skills that lead agents **and** developers through building custom B2B web apps in a **repeatable, standardized, agentic-first** way — from business discovery to an implementation-ready repo.

**Source of truth lives here (in this repo).** A copy is installed at `~/.claude/skills/` to make them active locally; when you change a skill here, re-sync the copy (see *Working on the skills* below).

## The pipeline

```
sailes-start  (thin orchestrator: shows the map, routes A/B/C, gates each phase)
   │
   ├─ Phase 1  sailes-discovery   → requirements elicitation → confirmed Brief
   │                                 (decisions owned by the USER, with trade-offs shown)
   ├─ Phase 2  sailes-bootstrap   → classify · lock stack · generate agentic-first repo
   │                                 (AGENTS.md/CLAUDE.md/README/.ai/ · git init · verify on disk)
   │     └─ Phase 2.5  sailes-design → deliberate visual direction + persisted design artifact
   │
   ├─ Phase 3  sailes-spec (local .ai/skills/spec-writing/ if present, else global) → approved spec
   │
   └─ Implementation (agent team starts here):
        sailes-pre-implement (readiness: BC/risk/gaps) → sailes-implement (build phase-by-phase, verifiably)
```

Each skill is **independently callable** — use `sailes-discovery` alone for a scope interview, `sailes-design` alone for a UI direction, etc. `sailes-start` just sequences them with hard gates.

## The skills

| Skill | Role | Key files |
|---|---|---|
| **sailes-start** | End-to-end orchestrator. Shows the phase map, picks Route A (new) / B (feature) / C (adopt), gates every boundary. | `SKILL.md` |
| **sailes-discovery** | The interview before the spec. Pulls full intent into a structured Brief. **Must** chain into bootstrap on greenfield (never stop at the spec). | `SKILL.md`, `brief-template.md` |
| **sailes-bootstrap** | Stack + architecture + agentic-first methodology. Generates/validates the repo standard; runs the design gate; **verifies artifacts on disk** before handoff. | `SKILL.md`, `decision-engine.md`, `stack-baseline.md`, `modules-catalog.md`, `skeleton.md`, `agents-md-template.md`, `agentic-first-principles.md`, `security-checklist.md`, `spec-writing-template.md`, `adopt-existing-repo.md`, `repo-done-checklist.md`, `developer-fit.md`, `backlog-template.md` |
| **sailes-design** | The frontend/visual design phase. Deliberate direction (palette/type/layout/**signature**) + anti-AI-default check + a11y/interaction discipline → persisted design artifact. | `SKILL.md`, `design-judgment.md`, `ux-rules.md` |
| **sailes-spec** | Phase 3 spec writer/reviewer. Skeleton → Open Questions gate → data model / API-UI / integration coverage / security / phasing / non-goals. Global fallback when a repo has no local `.ai/skills/spec-writing/` (which bootstrap generates from `sailes-bootstrap/spec-writing-template.md`, the mirror of this skill). | `SKILL.md` |
| **sailes-pre-implement** | Spec readiness analysis before coding: BC impact, risks, gaps → readiness report. | `SKILL.md` |
| **sailes-implement** | Execute an approved spec phase by phase: RED test → verify with evidence → commit per step → review gate → mark implemented. | `SKILL.md` |
| **sailes-pipedrive** | Domain integration reference (not part of the core pipeline): how to build Pipedrive app extensions — JSON panel, custom UI iframe, floating window, manifest/OAuth, signed-JWT auth, ACL, API proxy. Real Sailes patterns. | `SKILL.md`, `references/*`, `assets/custom-ui-panel-template.html` |

## Core invariants (why this exists)

1. **No phase ends early.** Greenfield discovery → bootstrap → design → spec → implementation, each gated. (The original failure: discovery wrote a spec and stopped, so the repo standard was never generated.)
2. **Done = verified on disk**, not asserted. `repo-done-checklist.md` proves AGENTS.md / `.ai/` / git / design artifact exist.
3. **A UI app always gets a real design phase** with a persisted artifact.
4. **The developer owns the key decisions.** Discovery shows trade-offs and minimizes autonomous AI choices — conscious development *with* AI, not the reverse.
5. **Full `.ai/` structure from day one, but idempotent** — a new repo gets the complete structure (specs + implemented/ + archived/, checklists, adr, skills, backlog.md, lessons.md header); never overwrite an existing `.ai/` artifact — add only what's missing, follow the repo's convention.
6. **Spec lifecycle** — specs carry a status and move root → implemented/ → archived/ (`git mv`); deferred ideas land in `.ai/backlog.md`.
7. **Developer owns the vision; AI interrogates and illuminates, never decides** — the foundational principle (agentic-first-principles §0).

## Working on the skills (TDD-for-skills)

These skills are maintained with the `superpowers:writing-skills` discipline: **no skill edit without a failing test first** (baseline a real behavior on a subagent → edit → re-test). See the project memory for the recorded RED/GREEN results.

To make an edit active locally after changing it here, re-copy into `~/.claude/skills/` (the active copy), or set up your preferred sync.

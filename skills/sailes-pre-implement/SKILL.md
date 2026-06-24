---
name: sailes-pre-implement
description: Use AFTER a spec is approved and BEFORE writing implementation code, to analyze the spec for readiness — backward-compatibility impact, risks, and gaps — and produce a readiness report. Triggers — "przeanalizuj spec", "czy spec gotowy", "pre-implement", "analiza ryzyka", "BC impact", "gap analysis", before implementing any non-trivial spec. Catches problems on paper, where they're cheap, instead of mid-implementation.
---

# Sailes Pre-Implement — spec readiness analysis before any code

## Overview

**The gate between an approved spec and writing code.** It catches — on paper, where it's cheap — the things that otherwise blow up mid-implementation: a breaking change to a public contract, a missing section, an underestimated risk, a wrong assumption about existing code.

**Core principle:** Reading the spec against reality (existing code, contracts, lessons) for 15 minutes saves hours of rework. Produce a **readiness report**, not code.

## When to Use / When NOT to

**Use when:** a spec is approved (from `sailes-spec` or a local spec skill) and the change is non-trivial — touches multiple files, public contracts, data model, or integrations.

**Do NOT use when:** trivial one-file change with no contract impact; the spec is still in `draft` (finish it first); there's no spec at all (write one with `sailes-spec`).

## Workflow

### Phase 1 — Load context
1. Read the target spec **fully** (`.ai/specs/...`, status `approved`).
2. Read `.ai/lessons.md` for known pitfalls in this repo.
3. Use the **Task Router** in `AGENTS.md` to find every guide/module the spec touches — read all matching ones.
4. Map the existing code the spec affects: entities, API routes, events, exports, jobs. For a large scope, dispatch read-only `Explore`/`explorer` subagents (one area each) — keep main context clean.

### Phase 2 — Backward-compatibility audit
For each affected surface, ask: does the spec **rename / remove / narrow** something other code depends on? Walk these contract surfaces (drop those that don't apply to this stack):

| Surface | Check |
|---|---|
| Public types / interfaces | removed or narrowed required fields? |
| Function / API signatures | changed required params or return shape? |
| HTTP routes & response fields | renamed/removed endpoint or field? |
| DB schema | renamed/removed column or table? (migration + backfill?) |
| Event names / payloads | renamed event or payload field? |
| Import paths / exports | moved a module without a re-export bridge? |
| Permission / role IDs (stored in DB) | renamed a feature/role key? |
| File / config conventions | renamed a convention file other code discovers? |

For each hit: classify **Critical** (must fix before coding) vs **Warning** (needs a deprecation bridge / migration), and propose the migration path (re-export, dual-write, alias, backfill). If the spec lacks a "Migration / Backward-Compatibility" section and needs one — flag it.

### Phase 3 — Gap & completeness check
Against the `sailes-spec` required sections: is anything missing or vague? Specifically — unresolved Open Questions, data model holes, integration contracts undefined, **no integration coverage / tests named**, security section absent for sensitive data, phases that leave the app broken mid-way, source-of-truth undefined for a sync.

### Phase 4 — Risk assessment
List concrete failure scenarios: **scenario · severity · affected area · mitigation · residual risk.** Call out the irreversible / hard-to-rollback steps and anything touching production data.

### Phase 5 — Readiness report (the output)
```
# Pre-Implement Report: {spec}
## Verdict: READY | READY-WITH-FIXES | NOT-READY
## BC findings:   [Critical / Warning] surface → migration path
## Gaps:          missing/vague sections to fix in the spec first
## Risks:         scenario · severity · mitigation · residual
## Remediation:   ordered list of spec edits to make before coding
## Suggested phase order / sequencing notes
```

- **NOT-READY / READY-WITH-FIXES** → the fixes go back into the spec (via `sailes-spec`) before implementation. Don't start coding around a known gap.
- **READY** → if the spec touches the DB (new/changed tables, columns, indexes, migrations), route through **`sailes-database`** first — it turns the approved data model into safe, expand/contract migrations and decides the remaining 🔀 schema forks (key type, jsonb/column, tenancy, soft-delete) via decision cards. Carry these BC findings into it; don't re-derive them. Then hand to `sailes-implement`. For non-trivial scope this is where the **agent team** starts: the driving agent acts as `team-lead` and runs roles/order/gates/lifecycle per `sailes-bootstrap/agent-team-structure.md` (spawn one worker per task, release on integration; `checker` + `qa` gates; workers never commit/push).

## Quick Reference

| Phase | Output |
|---|---|
| Load context | spec + lessons + Task-Router guides + affected-code map |
| BC audit | Critical/Warning findings + migration paths |
| Gap check | missing/vague spec sections |
| Risk | scenarios + mitigations |
| Report | READY / WITH-FIXES / NOT-READY + remediation |

## Red Flags — STOP

- You're about to implement and never checked the spec against existing contracts.
- You found a Critical BC break and started coding anyway instead of fixing the spec.
- The spec has unresolved Open Questions and you're proceeding.
- You can't name the rollback for an irreversible step.

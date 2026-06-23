---
name: sailes-spec
description: Use when turning a confirmed brief/scope into a phased, testable implementation spec — or reviewing an existing spec — after discovery/bootstrap and BEFORE coding. Triggers — "napisz spec", "spec tej funkcji", "rozpisz to na zadania", "zrób plan wdrożenia", Phase 3 of the sailes pipeline, or any time you're about to implement a non-trivial feature with no written spec. Produces a spec with an Open Questions gate (user answers the unknowns), data model, API/UI surface, integration coverage, security, phasing, and non-goals.
---

# Sailes Spec — Writing & Reviewing Implementation Specs

## Overview

**The phase between an agreed brief and writing code.** It turns scope into a *phased, testable* spec — or reviews an existing one — with a **staff-engineer lens**: cut standard CRUD noise, focus on what's unique and risky, and make the user answer the decisions that would otherwise be guessed.

**Core principle:** Don't write the whole spec in one pass on assumptions. Write a skeleton, surface the **critical unknowns as numbered Open Questions, and STOP** until the user answers them. The unknowns are the user's to decide (consistent with `sailes-discovery`'s decision-ownership) — you propose, they choose, then you write the rest.

## Local vs. this skill (read first)

A repo built with `sailes-bootstrap` has a **local** spec-writing skill at `.ai/skills/spec-writing/SKILL.md`, tuned to that repo's real stack. Precedence:

1. **Local skill exists** (`.ai/skills/spec-writing/`) → use it; it owns this repo's exact naming/phasing/stack conventions. This global skill is the fallback, not the override.
2. **No local skill** (brownfield repo never bootstrapped, or you entered discovery→spec without bootstrap) → **use this skill.** It's the safety net so the spec still follows the standard regardless of entry point. (This closes the gap where skipping bootstrap also lost the spec methodology.)

`sailes-bootstrap` generates the local skill from `spec-writing-template.md`, which mirrors this skill — so local and global stay aligned.

## When to Use / When NOT to

**Use when:** scope is agreed (a confirmed Brief from `sailes-discovery`, or a clear written request) and you're about to implement a non-trivial feature; or you're reviewing a spec for completeness/architecture fit.

**Do NOT use when:** the change is a trivial, fully-specified one-liner (just do it); there's no agreed scope yet (run `sailes-discovery` first); a local `.ai/skills/spec-writing/` exists (use that).

## Workflow

1. **Load context** — the confirmed Brief + the module manifest & locked stack (from bootstrap, if present) + the brief's **Decisions Ledger**. Check `.ai/specs/` for an existing spec on this area; **extend it, don't duplicate.**
2. **Initialize** — create `.ai/specs/{YYYY-MM-DD}-{kebab-title}.md` (or the repo's specs convention).
3. **Skeleton first** — write TLDR + 2-3 key sections only. Do NOT write the full spec yet.
   - Scan for **critical unknowns** — decisions where a wrong assumption forces a rewrite (data model, tenancy, integration contract, source-of-truth, file/volume strategy).
   - Add a numbered **Open Questions** block (Q1, Q2, …) right after the TLDR — one per line, answerable (binary/multiple-choice where possible). For anything that's a real fork, present it the way `sailes-discovery` does: options with ✅/⚠️ + a recommendation, the user chooses.
   - **STOP after the skeleton. Hard gate.** Do not write the rest until the user answers every open question.
4. **Iterate** — apply answers, remove the Open Questions block. New unknowns surface → re-gate only those.
5. **Design** — data model, API surface, UI surface, module boundaries, integration/webhook contracts, jobs/workflows.
6. **Phasing** — break into **Phases** (stories) and **Steps** (testable tasks). Each step leaves the app working.
7. **Integration coverage** — list every affected API path and key UI path; each gets a test in the same change.
8. **Review** — apply the checklist below before calling the spec done.

## Required sections

- **TLDR & Context** — what & why, in 2-3 sentences.
- **Problem Statement** — what we're solving.
- **Proposed Solution** — high-level approach.
- **Data Model** — tables/columns touched or added (snake_case, UUID PK, timestamps; `organizationId` only if multi-tenant).
- **API & UI Surface** — routes, server actions, pages, components.
- **Integration / Webhooks** — per external system: intake (verify→validate→persist→202), idempotency, retry, sync tables.
- **Jobs / Workflows** — cron vs job vs durable workflow; which tier.
- **Security** — auth + permission checks, Zod validation, signed secrets, audit log, file access control; mark which security-checklist items apply.
- **Phasing & Steps** — stories → testable steps.
- **Integration Coverage** — affected API + UI paths, each with a test.
- **Non-Goals** — what we explicitly are NOT building.

## Stack conventions (use the repo's locked stack; below is the baseline default)

- ORM: Drizzle — explicit schema in TS, migrations committed + reviewed.
- Auth: Better Auth (Google login = login only, never Gmail access).
- Worker: `apps/worker` for all async work; webhooks are intake-only.
- Validation: Zod at every boundary; types via `z.infer`; no `any`.
- Tenancy: single-tenant default; multi-tenant → `organizationId` everywhere + isolation tests.
- Tests: Vitest + MSW + Testcontainers + Playwright; self-contained, no faked passes.
- Files: private by default, signed URLs, metadata in Postgres, access log.

(If the repo locked a different stack, adapt this block to it — the workflow and sections stay the same.)

## Review checklist

- [ ] Singular, consistent naming for entities/commands/events.
- [ ] Cross-module links by FK ID, not direct cross-module DB access.
- [ ] Tenancy correct (single vs multi); if multi, isolation tested.
- [ ] Inputs validated with Zod; no `any`.
- [ ] Sensitive data: auth + permission checks, audit log, encryption where required.
- [ ] Webhooks async intake-only; idempotency + retry + dead-letter.
- [ ] Integration coverage lists every affected API + key UI path, each with a test.
- [ ] Phases leave the app working; each step is testable.
- [ ] Non-goals stated; standard CRUD noise cut.
- [ ] Canonical primitives used (no reinvented framework substitutes).

## Output

- **Writing:** the spec file at `.ai/specs/...`, gated on Open Questions.
- **Reviewing:** a Summary, Findings (Critical / High / Medium / Low), and the checklist verdict.

## Common Mistakes

| Mistake | Fix |
|---|---|
| Writing the full spec in one pass on assumptions | Skeleton + Open Questions gate; STOP for answers. |
| Deciding the critical unknowns yourself | They're the user's — present options + recommendation, let them choose. |
| Duplicating an existing spec for the same area | Extend the existing `.ai/specs/` file. |
| Ignoring a local `.ai/skills/spec-writing/` | Local wins; this skill is the fallback. |
| Phases that leave the app broken mid-way | Each step must leave it working + testable. |
| No integration coverage | Every affected API + key UI path gets a test in the same change. |

## Red Flags — STOP

- You wrote the whole spec without ever stopping for Open Questions.
- You picked the data model / tenancy / integration contract yourself without the user confirming.
- There's a local `.ai/skills/spec-writing/` and you didn't use it.
- A phase leaves the app non-working, or a step has no test.
- You're about to hand the spec to implementation with unanswered critical unknowns.

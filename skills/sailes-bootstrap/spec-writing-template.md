# spec-writing skill — generic template

This is the content `project-bootstrap` Case B writes into a NEW repo at `.ai/skills/spec-writing/SKILL.md`, so the repo has a permanent, reusable spec-writing skill from day one. It is **stack-agnostic** (tuned to the baseline stack, no Open-Mercato coupling). Adapt the `## Stack conventions` block to whatever stack the project actually locked.

When generating: write the fenced block below to `.ai/skills/spec-writing/SKILL.md` in the new repo (without this wrapper text).

---

```markdown
---
name: spec-writing
description: Use when writing or reviewing an implementation spec for this repo, after scope is agreed and before coding. Produces a phased, testable spec with an Open Questions gate, integration coverage, and non-goals.
---

# Spec Writing & Review

Turn an agreed brief into a phased, testable implementation spec — or review an existing spec for completeness and architectural fit. Adopt a staff-engineer lens: cut standard CRUD noise, focus on what's unique and risky.

## Workflow

1. **Load context** — the confirmed Brief (from discovery) + the module manifest & stack (from bootstrap). Check `.ai/specs/` for an existing spec on this area; extend it instead of duplicating.
2. **Initialize** — create `.ai/specs/{YYYY-MM-DD}-{kebab-title}.md`.
3. **Skeleton first** — write TLDR + 2-3 key sections only. Do NOT write the full spec in one pass.
   - Scan for **critical unknowns** — decisions where a wrong assumption forces a rewrite (data model, tenancy, integration contract, source-of-truth).
   - If any exist, add a numbered **Open Questions** block (Q1, Q2, …) right after the TLDR, one per line, answerable (binary/multiple-choice where possible).
   - **STOP after the skeleton.** Do not proceed until the user answers all open questions. Hard gate.
4. **Iterate** — apply answers, remove the Open Questions block. New unknowns surface → re-gate those only.
5. **Design** — data model, API surface, UI surface, module boundaries, integration/webhook contracts, jobs/workflows.
6. **Phasing** — break into **Phases** (stories) and **Steps** (testable tasks). Each step should leave the app working.
7. **Integration coverage** — list every affected API path and key UI path; each gets a test in the same change.
8. **Review** — apply the checklist below.

## Required sections

- **TLDR & Context** — what & why, in 2-3 sentences.
- **Problem Statement** — what we're solving.
- **Proposed Solution** — high-level approach.
- **Data Model** — tables/columns touched or added (snake_case, UUID PK, timestamps; organizationId only if multi-tenant).
- **API & UI Surface** — routes, server actions, pages, components.
- **Integration / Webhooks** — for each external system: intake (verify→validate→persist→202), idempotency, retry, sync tables.
- **Jobs / Workflows** — cron vs job vs durable workflow; which tier.
- **Security** — auth + permission checks, Zod validation, signed secrets, audit log, file access control; mark which security-checklist items apply.
- **Phasing & Steps** — stories → testable steps.
- **Integration Coverage** — affected API + UI paths, each with a test.
- **Non-Goals** — what we explicitly are NOT building.

## Stack conventions  (adapt to this repo's locked stack)

- ORM: Drizzle — explicit schema in TS, migrations committed + reviewed.
- Auth: Better Auth (Google login = login only, never Gmail access).
- Worker: apps/worker for all async work; webhooks are intake-only.
- Validation: Zod at every boundary; types via z.infer; no `any`.
- Tenancy: single-tenant default; multi-tenant → organizationId everywhere + isolation tests.
- Tests: Vitest + MSW + Testcontainers + Playwright; self-contained, no faked passes.
- Files: private by default, signed URLs, metadata in Postgres, access log.

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

When reviewing instead of writing, produce: Summary, Findings (Critical / High / Medium / Low), and the checklist verdict.
```

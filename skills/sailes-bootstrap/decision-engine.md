# Decision Engine — Classify First, Then Activate Modules

Do NOT recommend a full architecture up front. **Classify the project first**, then activate only the modules the answers imply. Ask in adaptive rounds of 3-4 via `AskUserQuestion` (not one dump); lead with the decisions that fork architecture (tenancy, source-of-truth, integrations).

**The user decides; you recommend.** Each question below that resolves into an architectural choice (tenancy, source-of-truth, sync depth, workflow engine, multi-tenant, prototype-vs-production) must be put to the user as a **decision card** — options with honest ✅ pros / ⚠️ cons and a reasoned recommendation — and the chosen value recorded in the brief's **Decisions Ledger**. Never resolve one of these silently from the baseline and surface it later as an "assumption." Pure fact-finding questions (e.g. "do you store sensitive data?") are just questions; the *architectural consequences* you derive from them are still the user's to confirm.

## The classification questions (per project)

```text
1.  Single firm or many firms/clients/orgs?            → tenancy (single vs multi-tenant-ready)
2.  Data mainly from the app or from a CRM/other?      → app-first / CRM-first / hybrid
3.  Is Pipedrive needed?                               → pipedrive module
4.  Embedded in Pipedrive?                             → apps/pipedrive-extension + marketplace OAuth
5.  Which login methods?                               → auth variants
6.  API keys / webhook secrets needed?                 → machine-to-machine security
7.  Sensitive data stored?                             → security checklist (mandatory for prod)
8.  Files module needed?                               → files module
9.  Email module needed?                               → email module (then level)
10. If email: which level (0–5)?                       → email scope
11. Reporting needed?                                  → reporting module (then level)
12. If reporting: which level (0–4)?                   → reporting scope
13. Long-running workflows?                            → durable workflow engine
14. Sequences / follow-ups?                            → workflow engine (not just cron)
15. Feature flags needed?                              → DB flags
16. Which critical flows need Playwright E2E?          → test plan
17. Which actions must be audited?                     → audit scope
18. Which integrations need retry/idempotency?         → integration hardening
19. Prototype or production client system?             → observability + security gating
20. Extra compliance/security requirements?            → R2/S3, encryption, residency
```

## Tenancy gate (most important fork)

**Default = single-tenant** (custom app for one firm). Do NOT force `organizationId` everywhere if only one company will ever use it. Single-tenant ≠ weak security — even one-firm apps hold protectable data.

Always ask Q1. If multiple firms/clients/orgs → switch to **multi-tenant-ready**:
```text
- required organization / workspace / account model
- organizationId on every client-data table
- tests must verify data isolation
- permissions must include organization scope
```

## Module activation map

From the answers, activate modules (baseline always on; rest conditional):

```text
core app          ← always
worker            ← always (apps/worker mandatory)
auth              ← always (Better Auth; variants per Q5)
files             ← Q8 yes
integrations      ← Q2 CRM/hybrid, Q3 Pipedrive, or any external system
email             ← Q9 yes (at the level from Q10)
reporting         ← Q11 yes (at the level from Q12)
pipedrive         ← Q3/Q4 yes
workflow engine   ← Q13/Q14 yes
feature flags     ← Q15 yes
observability     ← always (Sentry+PostHog if Q19 = production)
multi-tenant      ← Q1 = many
security checklist← Q7/Q19 = sensitive/production (mandatory)
```

## Prototype vs production gating

- **Prototype:** may warn on missing security/observability but proceed.
- **Production client system:** security checklist (`security-checklist.md`) is **mandatory**; Sentry + PostHog recommended; audit log required.

## Output of this phase

A short **module manifest** for the project: which modules are ON, tenancy mode, email/reporting levels, workflow tier, and the security gate (prototype vs production). This feeds the skeleton (`skeleton.md`) and the spec.

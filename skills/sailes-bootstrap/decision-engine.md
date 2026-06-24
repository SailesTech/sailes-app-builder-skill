# Decision Engine — Classify First, Then Activate Modules

Do NOT recommend a full architecture up front. **Classify the project first**, then activate only the modules the answers imply. Ask in adaptive rounds of 3-4 via `AskUserQuestion` (not one dump); lead with the decisions that fork architecture (tenancy, source-of-truth, integrations).

**The user decides; you recommend.** Each question below that resolves into an architectural choice (tenancy, source-of-truth, sync depth, workflow engine, multi-tenant, prototype-vs-production) must be put to the user as a **decision card** — options with honest ✅ pros / ⚠️ cons and a reasoned recommendation — and the chosen value recorded in the brief's **Decisions Ledger**. Never resolve one of these silently from the baseline and surface it later as an "assumption." Pure fact-finding questions (e.g. "do you store sensitive data?") are just questions; the *architectural consequences* you derive from them are still the user's to confirm.

**Decision-card quality bar:** every option must state a concrete upside, a concrete cost, and the real trade-off it introduces in this project. If you cannot name both a believable pro and a believable con, don't present it as a choice yet. Ask a fact-finding question first, or defer the option to backlog/ADR.

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

## Stack-shaping axes (choose the SHAPE, not just the modules)

The questions above decide *which modules* are on. These decide the **shape of the stack** — fullstack-Next vs SPA+standalone-API, the request-API engine, hosting class. Ask them as decision cards too; the default (Next.js fullstack) is a *recommendation*, not a given. Lead with the ones that flip the shape.

```text
S1. Public pages / SEO, or entirely behind login?      → public/SEO ⇒ SSR (Next.js) | login-only ⇒ SPA is allowed
S2. Who consumes the backend?                           → only web ⇒ fullstack OK | web + n8n/FHIR/CRM/mobile/3rd-party ⇒ standalone API
S3. Must front & back deploy/scale independently?       → yes (webhooks/sync can't break on UI deploy) ⇒ separated SPA + API
S4. How heavy/async is the backend?                     → long syncs, queues, file-merging, many integrations ⇒ worker-centric; request-API stays thin
S5. Load / concurrency / realtime?                      → high-throughput or websockets/SSE ⇒ affects queue tier + hosting
S6. Interop standard imposed (FHIR, EDI, HL7…)?         → yes ⇒ mapping layer + dedicated libs; influences API shape
S7. Embedded in another platform (iframe/panel)?        → yes ⇒ SPA + that platform's SDK as a separate artifact (see sailes-pipedrive)
S8. Compliance / data class?                            → regulated/sensitive ⇒ hosting, storage (object-lock), audit, encryption
```

These resolve into a **stack-shape decision** — see `stack-baseline.md`:
- **Default — Next.js fullstack** when the front is (or may become) public/SEO, the web app is the only backend consumer, and the backend fits inside Next + one worker.
- **Variant — SPA (Vite+React) + standalone API** when login-only UI **and** (multiple backend consumers **or** independent deploy needed **or** very heavy/async backend). The API engine is itself a decision card (Fastify / Hono / Express — see baseline).
- **Hybrid (Next + separate API)** only when you genuinely need both SSR *and* a standalone API — usually the worst cost/benefit; justify in an ADR.

## Developer-fit axes (who builds it is a real input — see `developer-fit.md`)

The objectively-best stack the team can't operate loses to a good stack they know. Weigh these alongside the business axes:

```text
D1. Who builds it? (in-house / contractor / agency / AI-agent)      → how much magic-vs-explicitness, CI from day 1
D2. Team familiarity per layer (framework, ORM, API engine)?        → prefer known unless a hard requirement overrides
D3. Solo or split FE/BE team?                                       → solo ⇒ fewer moving parts | split ⇒ separation fits
D4. Domain/integration experience (Pipedrive, FHIR, …)?            → build on strengths
D5. Tolerance for "glue" (CORS, shared types, two deploys)?         → low ⇒ fullstack | accepted-for-independence ⇒ split
D6. Type-ergonomics preference (end-to-end types)?                  → keep via shared contracts package regardless of split
D7. Deadline vs long-term maintenance?                             → short ⇒ fewest parts | product ⇒ invest in structure
```

**Rule:** developer preference is a **legitimate decision factor**, recorded in the Decisions Ledger. But when a preference collides with a hard business/compliance requirement, the **requirement wins and the deviation is captured in an ADR** (e.g. "dev prefers Express, but API-first validation for medical data → Fastify; ADR-XXX"). Never let preference silently override a requirement, and never let the baseline silently override a justified preference.

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

A short **module manifest** for the project: which modules are ON, tenancy mode, email/reporting levels, workflow tier, and the security gate (prototype vs production) — **plus the stack shape** (fullstack-Next vs SPA+standalone-API vs hybrid), the request-API engine, and the developer-fit notes. Every architectural and stack-shape choice + any preference-vs-requirement override is recorded in the brief's **Decisions Ledger** (overrides → ADR). This feeds the skeleton (`skeleton.md`), the stack decision (`stack-baseline.md`), and the spec.

# Elicitation checklists — greenfield and brownfield

> Extracted from `SKILL.md` on 2026-07-26. Step 1 walks whichever one the variant selects; you only
> ever need one of the two in a given session.

## Greenfield checklist (Project Brief)

Walk all of these. Skip an item only if the user explicitly defers it.

- **Business case (probe deep — don't accept the one-liner)** — what problem, for whom, and **why now** (what triggered it: lost deal, new hire, mandate, audit)? What does the problem **cost today** (hours/week wasted, deals lost, money)? Who **commissioned** this (sales lead / IT / exec) and what does *their* "success" look like? Revenue/value model? Product vs. internal tool vs. MVP-to-raise? What happens if it's *not* built? (A shallow business probe is a known failure — surface urgency and the real stakeholder.)
- **Domain core** — the 3-5 core entities and the one workflow that *is* the product. What's the MVP heart vs. later?
- **Target users & roles (ask, don't invent)** — who uses it, how many (10 / 10k / 10M)? **Enumerate every role from the user — never invent a role like "manager" yourself**; for each role ask what they must *do*. Concurrent load? Growth horizon (8 → 30 in a year)? **The user explicitly wants scale — never skip it.**
- **Tenancy & access** — single-tenant, multi-tenant SaaS, B2B2C? Roles/permissions model? (Decision card — see `decision-card.md`.)
- **Existing infrastructure (investigate, don't assume "we have some")** — when the user says they already have infra, DRILL IN: which hosting (Railway/Vercel/AWS/VPS — and which *services* already run there)? Is there an **existing Postgres/DB** to reuse or must we create one? Existing **auth / SSO / Google Workspace tenant**? **Other apps sharing a stack/conventions** we should match or reuse? For each named system: *integrate, reuse, or replace?* Surface constraints (VPN, IP allowlist, data residency) before designing.
- **Integration targets (go past the name)** — for each external system (CRM/API): which **plan/tier** (does it even have API/webhooks)? Existing **configuration** that constrains us (CRM pipeline stages, **custom fields**, deal/contact shape)? Existing **data volume** (affects initial sync)? Other automations (Make/Zapier/n8n) already touching it that could conflict? **Direction of truth** per field for any two-way sync. (The integration is usually the hardest part — never defer its data model entirely to the developer.)
- **Tech stack** — any hard constraints (language, framework, DB, cloud)? Otherwise **the stack is a set of decisions, each presented as a decision card in `sailes-bootstrap` Phase 2** — capture leanings/constraints here, don't lock silently.
- **Infrastructure level** — where does it run (serverless / containers / single VM / managed PaaS)? Expected availability/SLA? Budget posture (cheap MVP vs. enterprise-grade)? (Decision card if a real fork.)
- **Data & compliance** — PII? GDPR/HIPAA/PCI? Data residency? Encryption/audit needs?
- **Integrations** — payments, auth providers, email, telematics, 3rd-party APIs?
- **Success metrics & timeline** — what does "done/successful" look like? Hard deadlines?
- **Non-goals** — what we explicitly are NOT building (controls scope creep). **Anything deferred-but-worth-keeping (a later-phase idea, a "not now") goes into `.ai/backlog.md`** so it survives — don't let it die inside one brief's non-goals list. (Bootstrap generates `.ai/backlog.md`; if absent, note the items for it.)

## Brownfield checklist (Task Brief)

- **Already-exists check** — did recon find this already implemented or partially there? (Resolve before anything else.)
- **Who & why** — which user/role needs this, what job does it do for them?
- **Exact scope** — concrete behavior. For a "report/export": which fields/columns, which entity, flat list vs. joined detail, from where in the UI?
- **Acceptance criteria** — how do we know it's done and correct? Edge cases?
- **Data shape & volume** — how many rows/records realistically (10 vs. 10M)? Decides sync vs. async/queue, pagination, streaming.
- **Permissions & tenancy** — which feature/role gates it? Org/tenant scoping?
- **Surface & placement** — which page/route/module? New UI element or extend existing?
- **Constraints & non-goals** — what NOT to touch; backward-compat surfaces; performance limits.
- **Team handoff** — which agent roles realize it (explorer → designer → be-dev → fe-dev → checker → qa) and in what dependency order? The implementation gate is that the **BE contract is finalized before `fe-dev` starts** (the canonical pipeline order; see `sailes-bootstrap/agent-team-structure.md`). **The user explicitly wants the spec to be ready for the team — always produce this.**

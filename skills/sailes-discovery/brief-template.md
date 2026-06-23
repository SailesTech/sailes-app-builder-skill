# Brief Templates

The brief is the single artifact discovery produces. Pick the format by variant. Keep it tight — captured decisions and constraints, not narrative. This is the input the spec (and the agent team) consumes.

---

## Greenfield — Project Brief

```markdown
# Project Brief: {Project Name}

## TLDR
{1-3 sentences: what we're building and for whom.}

## Business Case
- Problem & audience:
- Value / revenue model:
- Product vs. internal tool vs. MVP-to-raise:

## Domain Core
- Core entities (3-5):
- The one workflow that IS the product:
- MVP heart vs. later phases:

## Users & Scale
- Who uses it (roles):
- Target user count: {e.g. ~500 internal / 50k SaaS}
- Concurrency / load expectation:
- Growth horizon:

## Tenancy & Access
- Tenancy model: {single | multi-tenant SaaS | B2B2C}
- Roles / permission model:

## Tech Stack
- Constraints / chosen stack: {language, framework, DB}
- Existing systems to integrate:

## Infrastructure
- Runtime target: {serverless | containers | VM | managed PaaS}
- Availability / SLA:
- Budget posture: {cheap MVP ↔ enterprise-grade}

## Data & Compliance
- PII / sensitive data:
- Regulatory: {GDPR | HIPAA | PCI | none}
- Data residency / encryption / audit:

## Integrations
- {payments, auth, email, telematics, 3rd-party APIs...}

## Success & Timeline
- Definition of done / success metrics:
- Deadlines:

## Non-Goals
- Explicitly NOT building:

## Decisions Ledger
| Decision | Chosen | By | Rejected alternatives (why not) |
|---|---|---|---|
| {stack/ORM/auth/hosting/tenancy/integration depth/role model…} | {choice} | user | {alternatives + one-line why-not} |
(Every key/important decision goes here, made BY THE USER after seeing pros/cons.
 Nothing left "AI-recommended-pending" once the brief is confirmed.)

## Vetoable trivia (reversible, no cost)
- {only genuinely trivial defaults — never stack/architecture/roles}

## Next Step
- Handoff: {local spec-writing skill | self-written spec at .ai/specs/...}
```

---

## Brownfield — Task Brief

```markdown
# Task Brief: {Task Title}

## TLDR
{1-2 sentences: the change, in one breath.}

## Recon Result
- Already exists? {yes/partially/no — file:line evidence}
- Relevant existing code / patterns to reuse:

## Who & Why
- Requesting role / user:
- Job it does for them:

## Exact Scope
- Concrete behavior:
- Fields / columns / entities involved:
- Surface / placement: {route, page, module, UI element}

## Acceptance Criteria
- [ ] {testable criterion}
- [ ] {edge case}

## Data Shape & Volume
- Realistic record count: {drives sync vs. async/queue, pagination, streaming}
- Shape: {flat list | joined detail}

## Permissions & Tenancy
- Feature / role gate:
- Org / tenant scoping:

## Constraints & Non-Goals
- Backward-compat surfaces not to break:
- Performance limits:
- Out of scope:

## Team Handoff Plan
- Dependency order: explorer → designer → be-dev → fe-dev → checker → qa
  (drop roles that don't apply; note what each must do)
- explorer:
- designer: {if UI}
- be-dev:
- fe-dev: {if UI}
- checker:
- qa:

## Next Step
- Handoff: {local spec-writing skill | self-written spec}, then team implementation.
```

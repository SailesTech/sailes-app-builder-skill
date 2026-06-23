# Developer-Fit — who builds it is part of the stack decision

The stack isn't chosen in a vacuum. The **objectively-best stack a team can't operate loses to a good stack they know.** Stack choice is a function of *business context* (see `decision-engine.md` Stack-shaping axes) **and** *who is building it*. This file covers the second half — make it an explicit, weighed input, not an afterthought.

## Why this matters

- A stack the builder knows ships faster, with fewer foot-guns, and is easier to maintain.
- Ignoring developer reality is how projects pick a "best practice" stack that then rots because nobody is fluent in it.
- BUT: preference is an *input*, not a veto over hard requirements. The discipline is balancing the two transparently.

## The axes (ask these; record answers in the Decisions Ledger)

| Axis | What to ask | How it shifts the stack |
|---|---|---|
| **Who builds it** | in-house dev / contractor / agency / AI-agent team? | AI-agent + in-house → favor explicitness, one convention, CI from day 1. Agency/contractor → match their conventions or document hard. |
| **Team familiarity** | comfort per layer: framework, ORM, auth, API engine? | Prefer the known option when it's *adequate*; only override for a hard requirement (then ADR). |
| **Solo vs split team** | one full-stack dev, or separate FE/BE people? | Solo → fewer moving parts (fullstack tempting). Split FE/BE → a separated SPA + API maps to how they work. |
| **Domain / integration experience** | done Pipedrive / FHIR / this CRM before? | Build on strengths; budget research time where they're new (use `deep-research`). |
| **Tolerance for glue** | OK with CORS, shared-types packages, two deploys? | Low tolerance → fullstack. Accepts glue for independent deploy → split is fine. |
| **Type-ergonomics preference** | how much do they value end-to-end type safety? | If high and you split front/back, reclaim it with a shared `packages/contracts` (Zod/TypeBox) — don't lose it silently. |
| **Deadline vs longevity** | throwaway/short deadline, or long-lived product? | Short → fewest parts. Product → invest in structure (monorepo, contracts, tests). |
| **Ops capacity** | who runs it in prod? appetite for extra services (Redis, separate API)? | Low ops appetite → fewer services (Postgres-jobs over Redis, fullstack over split). |

## The balancing rule (the important part)

```
preference is a legitimate decision factor — record it in the Decisions Ledger
   ↓
does it collide with a HARD business/compliance/architecture requirement?
   ├─ no  → honor the preference (it's a real, valid reason)
   └─ yes → the REQUIREMENT wins; capture the deviation + why in an ADR
```

- Never let a preference silently override a requirement (e.g. "I like SQLite" vs "14-clinic multi-tenant Postgres" → Postgres wins).
- Never let the baseline silently override a justified preference (e.g. dev is fluent in Fastify and the project is API-first → Fastify is a fine, recorded choice, not a "deviation to apologize for").
- When preference and requirement *agree*, you have your answer fast — say so and move on.

## How to present it

Fold these into the same decision-card rounds as the business axes. Example card:

```
Decyzja: Request-API engine
Dlaczego ważne: backend jest API-first (web SPA + n8n + FHIR), z walidacją na granicy.
Opcje:
  A) Fastify — ✅ schema/Zod validation first-class, szybki, świetne logi ⚠️ mniejszy ekosystem niż Express
  B) Hono    — ✅ ultralekki, świetne typy, edge-ready ⚠️ młodszy, mniej pluginów
  C) Express — ✅ największy ekosystem, wszyscy znają ⚠️ walidacja/typy ręcznie, starsze wzorce
Rekomendacja: A (Fastify) — pasuje do API-first + walidacji; deweloper zna go i preferuje.
Twój wybór?
```

## Output

The developer-fit answers go into the **Decisions Ledger** alongside the business-axis answers, and any place where a requirement overrode a preference (or vice-versa) gets an **ADR**. The result: a stack chosen consciously from *both* what the business needs *and* who is building it — not a default.

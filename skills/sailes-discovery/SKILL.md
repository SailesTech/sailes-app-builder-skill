---
name: sailes-discovery
description: Use at the START of a conversation when the user wants to build a new app/project OR asks for a non-trivial change/feature/task in an existing app, and the real scope, business case, scale, stack, or acceptance criteria are not yet pinned down. Triggers — "chcę zbudować", "zacznijmy projekt", "dodaj X", "zróbmy feature", "potrzebuję", any brief that is one or two sentences and would otherwise be guessed at. Also use when you are about to write a greenfield spec but have not generated the repo standard (no AGENTS.md/.ai/) — discovery owns the chain into sailes-bootstrap. Also use when you catch yourself about to pick a stack/architecture/role for the user instead of letting them decide. Runs the requirements-elicitation phase BEFORE any spec or code, making the developer own every key decision (AI recommends with pros/cons; the human chooses).
---

# Discovery — Requirements Elicitation Before Building

## Overview

**Discovery is the interview that happens before the spec.** Its only job: pull the full intent out of the user's head and into a structured brief, so the spec (and the agent team that implements it) build the right thing — not a plausible guess.

**Core principle:** A one-sentence request is never the whole request. Your value here is asking the questions the user didn't think to answer — not starting to build fast.

**The decision-ownership principle (load-bearing — this is the point of the skill):** Every **key** decision (stack, framework, ORM, auth, hosting, tenancy, integration depth, data model shape, roles) and every **important** decision (anything that's hard to reverse or shapes cost/scope) is **the developer's to make** — not yours. Your job is to surface that a decision exists, lay out the real options with honest **pros and cons**, give a **recommendation with a reason**, and then **let the user choose**. You *recommend*; the human *decides*. This is conscious development *with* AI, not AI building while the human watches.

- **You may decide alone ONLY** trivial, easily-reversible, no-cost-implication details (e.g. a variable name, the order of two form fields). If you're unsure whether something is trivial, it isn't — ask.
- **Never disguise a decision as an "assumption" buried in a summary.** A stack picked silently from a baseline and listed at the bottom of a confirmation is the #1 failure mode: the user "rubber-stamps" choices they never consciously made. Surface each one as an explicit choice (see the **decision card** format in Step 1).
- **"Sensible default" is a recommendation, not a decision.** Even when a baseline exists (it does — see `sailes-bootstrap`/`stack-baseline.md`), present it as *"I recommend X because Y; alternatives are Z — your call,"* not as a done deal.

This skill has **two variants**, chosen on the first turn:

- **Greenfield** — a new project/app from scratch. Elicit the whole picture: business case, users, scale, stack, infra, risks. → produces a Project Brief.
- **Brownfield** — a specific task/change in an existing, running app. Elicit precise scope, data shape, volume, acceptance criteria, and a team handoff plan. → produces a Task Brief.

It is **stack-agnostic** and works in any repo (including a brand-new empty one). It detects local conventions and adapts the handoff.

## When to Use / When NOT to

**Use when** (first reply in a conversation):
- User wants to build a new app/project/platform (greenfield).
- User asks for a feature, change, integration, or non-trivial task in an existing app (brownfield).
- The brief is short and the real scope/scale/acceptance is implicit.

**Do NOT use when:**
- The task is a trivial, fully-specified one-liner ("fix this typo", "rename X to Y", "bump dep Z") — just do it.
- The user has already provided a complete, written spec/brief — go straight to spec-writing or implementation.
- You are mid-implementation and the scope is already locked.

## The Iron Rule

**Never start writing code or a spec until elicitation is complete and the user has confirmed the brief.**

Elicitation is "complete" when every applicable checklist item below is either answered or explicitly deferred by the user. Not when you feel you have enough. Not when an MVP seems obvious.

**No escape hatches.** Do NOT offer "albo powiedz 'leć z MVP, ufam Ci' i zgadnę resztę." That offer is the failure mode — it lets the whole interview be skipped and you build on assumptions. If the user *spontaneously* says "just pick sensible defaults," you still walk the checklist, but you state each default you're assuming out loud and let them veto, rather than silently guessing.

## Step 0 — Pick the variant and orient

1. Read the brief. Classify: greenfield (no app yet / "new project") or brownfield (change to existing app).
2. **Orient to the repo cheaply** before asking anything:
   - Is there an `AGENTS.md` / `CLAUDE.md` / `README`? Skim it — it tells you conventions, stack, module system.
   - Is there a `.ai/specs/` (or `docs/specs/`) folder and a `spec-writing` skill? Note it — it decides the handoff (see Step 4).
   - Brownfield only: do a **light** recon (or dispatch one `explorer`/`Explore` agent) to find whether the thing already exists. Surfacing "this is already built" is the single highest-value discovery outcome — it saves the whole task.
3. State, in one or two lines, what you found. Then begin elicitation. Do NOT propose a data model, module layout, or implementation yet — that anchors on a guess.

## Step 1 — Elicit in adaptive rounds

Ask in **rounds of 3-4 questions** using `AskUserQuestion` (so the user clicks, doesn't write essays). Each round's questions are shaped by the previous answers. Cover the variant's checklist. Stop a round early if answers make later questions moot; add a round if an answer opens a new unknown.

Lead with the **critical unknowns** — the ones where a wrong assumption forces a rewrite (domain core, scale, tenancy, integration surface). Cosmetics last.

### Two kinds of question — fact-finding vs. decision

- **Fact-finding** (about *their* world): "Which CRM?", "How many users?", "What's already running?" → plain options, no recommendation needed; you're learning their reality.
- **Decision** (a fork *you* would otherwise pick): stack, ORM, auth, hosting, tenancy, integration depth, build-vs-buy, roles. → **NEVER** present as a bare "A or B?" checkbox, and never decide silently. Use the **decision card** below so the user chooses *consciously*.

### Decision card (use for every key/important decision)

When a real fork exists, present it like this (in the `AskUserQuestion` text or the message body), then let the user pick:

```
Decyzja: <what's being decided, in one line>
Dlaczego to ważne: <what it affects — cost, reversibility, scope, lock-in>
Opcje:
  A) <option>  — ✅ <pros>  ⚠️ <cons/cost>
  B) <option>  — ✅ <pros>  ⚠️ <cons/cost>
  C) <option>  — ✅ <pros>  ⚠️ <cons/cost>
Rekomendacja: <A/B/C> — bo <reason grounded in THEIR answers + the baseline>
Twój wybór? (możesz wybrać inaczej niż rekomenduję)
```

Keep pros/cons honest and specific to *their* situation, not generic. The recommendation leans on `sailes-bootstrap`'s researched baseline (`stack-baseline.md`) — but it's a recommendation, and you say so. A consequential option (e.g. "two-way CRM sync", "embed inside the CRM as an extension") must spell out what it *costs* (conflict resolution, webhooks, maintenance) — never let the user pick it blind.

> The detailed stack/architecture decision cards (Drizzle vs Prisma, Better Auth vs Clerk, Railway vs Vercel+Neon, single- vs multi-tenant, sync depth, durable workflow engine…) are owned by **`sailes-bootstrap`** (Phase 2), which has the researched trade-offs. In discovery, surface the *forks that change scope/architecture* and capture the user's leanings; bootstrap then walks each as a full decision card. Either way: the user decides, with pros/cons in front of them.

### Greenfield checklist (Project Brief)

Walk all of these. Skip an item only if the user explicitly defers it.

- **Business case (probe deep — don't accept the one-liner)** — what problem, for whom, and **why now** (what triggered it: lost deal, new hire, mandate, audit)? What does the problem **cost today** (hours/week wasted, deals lost, money)? Who **commissioned** this (sales lead / IT / exec) and what does *their* "success" look like? Revenue/value model? Product vs. internal tool vs. MVP-to-raise? What happens if it's *not* built? (A shallow business probe is a known failure — surface urgency and the real stakeholder.)
- **Domain core** — the 3-5 core entities and the one workflow that *is* the product. What's the MVP heart vs. later?
- **Target users & roles (ask, don't invent)** — who uses it, how many (10 / 10k / 10M)? **Enumerate every role from the user — never invent a role like "manager" yourself**; for each role ask what they must *do*. Concurrent load? Growth horizon (8 → 30 in a year)? **The user explicitly wants scale — never skip it.**
- **Tenancy & access** — single-tenant, multi-tenant SaaS, B2B2C? Roles/permissions model? (Decision card — see Step 1.)
- **Existing infrastructure (investigate, don't assume "we have some")** — when the user says they already have infra, DRILL IN: which hosting (Railway/Vercel/AWS/VPS — and which *services* already run there)? Is there an **existing Postgres/DB** to reuse or must we create one? Existing **auth / SSO / Google Workspace tenant**? **Other apps sharing a stack/conventions** we should match or reuse? For each named system: *integrate, reuse, or replace?* Surface constraints (VPN, IP allowlist, data residency) before designing.
- **Integration targets (go past the name)** — for each external system (CRM/API): which **plan/tier** (does it even have API/webhooks)? Existing **configuration** that constrains us (CRM pipeline stages, **custom fields**, deal/contact shape)? Existing **data volume** (affects initial sync)? Other automations (Make/Zapier/n8n) already touching it that could conflict? **Direction of truth** per field for any two-way sync. (The integration is usually the hardest part — never defer its data model entirely to the developer.)
- **Tech stack** — any hard constraints (language, framework, DB, cloud)? Otherwise **the stack is a set of decisions, each presented as a decision card in `sailes-bootstrap` Phase 2** — capture leanings/constraints here, don't lock silently.
- **Infrastructure level** — where does it run (serverless / containers / single VM / managed PaaS)? Expected availability/SLA? Budget posture (cheap MVP vs. enterprise-grade)? (Decision card if a real fork.)
- **Data & compliance** — PII? GDPR/HIPAA/PCI? Data residency? Encryption/audit needs?
- **Integrations** — payments, auth providers, email, telematics, 3rd-party APIs?
- **Success metrics & timeline** — what does "done/successful" look like? Hard deadlines?
- **Non-goals** — what we explicitly are NOT building (controls scope creep). **Anything deferred-but-worth-keeping (a later-phase idea, a "not now") goes into `.ai/backlog.md`** so it survives — don't let it die inside one brief's non-goals list. (Bootstrap generates `.ai/backlog.md`; if absent, note the items for it.)

### Brownfield checklist (Task Brief)

- **Already-exists check** — did recon find this already implemented or partially there? (Resolve before anything else.)
- **Who & why** — which user/role needs this, what job does it do for them?
- **Exact scope** — concrete behavior. For a "report/export": which fields/columns, which entity, flat list vs. joined detail, from where in the UI?
- **Acceptance criteria** — how do we know it's done and correct? Edge cases?
- **Data shape & volume** — how many rows/records realistically (10 vs. 10M)? Decides sync vs. async/queue, pagination, streaming.
- **Permissions & tenancy** — which feature/role gates it? Org/tenant scoping?
- **Surface & placement** — which page/route/module? New UI element or extend existing?
- **Constraints & non-goals** — what NOT to touch; backward-compat surfaces; performance limits.
- **Team handoff** — which agent roles realize it (explorer → designer → be-dev → fe-dev → checker → qa) and in what dependency order? **The user explicitly wants the spec to be ready for the team — always produce this.**

## Step 2 — Reflect & confirm (with an explicit Decisions Ledger)

After the rounds, write back a compact summary of what you heard, grouped by checklist area. Then — separately and prominently, **not** buried at the bottom — present the **Decisions Ledger**: every key/important decision, who made it, and the alternatives that were rejected. This is what stops choices being silently rubber-stamped.

```
## Decisions Ledger
| Decision | Chosen | By | Rejected alternatives (why not) |
|---|---|---|---|
| ORM | Drizzle | user | Prisma (less SQL control for sync), Kysely (overkill) |
| Auth | Better Auth + Google | user | Clerk (paid, external), email/pw (extra UX) |
| ... | ... | user / **AI-recommended-pending** | ... |
```

- Any row still marked **AI-recommended-pending** is a decision the user has NOT yet actively made — you must get an explicit choice before proceeding (it's fine for them to say "go with your recommendation," but they must say it about that specific decision, not a blanket wave).
- Distinguish genuine **vetoable trivia** (reversible, no cost — list briefly) from **decisions** (in the ledger). Do not mix them.

Ask: "Czy zgadzasz się z każdą decyzją w tabeli (możesz zmienić dowolną), i czy coś poprawić/dodać?" Do not proceed until confirmed. New unknowns surfaced here → one more targeted round. **No escape hatch:** never offer "to ja zdecyduję resztę za Ciebie."

## Step 3 — Produce the Brief

Write the structured brief (see `brief-template.md` for both formats). It is the single artifact discovery produces. Keep it tight — decisions and constraints, not prose.

## Step 4 — Handoff (MANDATORY chain — do not stop after the brief)

**The brief is NOT the finish line.** A confirmed brief with nothing after it is the single most common failure of this skill: the spec (or worse, just the brief) gets written and the agentic-first repo standard — `AGENTS.md`, `CLAUDE.md`, `README.md`, `.ai/skills/`, `.ai/checklists/`, `.ai/adr/`, git init — never gets generated. Discovery MUST chain forward.

**Greenfield (new project / empty or near-empty repo):**
1. The brief is confirmed → **you MUST now invoke the `sailes-bootstrap` skill**, carrying the brief in. Bootstrap is what generates the methodology skeleton + locks the stack + (via its design gate) drives the `sailes-design` phase. Do NOT write the spec yourself and stop — that skips the entire repo standard.
2. Bootstrap then hands to the spec phase (the local `.ai/skills/spec-writing/` it generated, else the global `sailes-spec` skill), then implementation.
3. If you are tempted to "just write the spec to `.ai/specs/` and finish" on a greenfield project — **STOP. That is the bug.** Invoke `sailes-bootstrap`.

**Brownfield (change to an existing app):**
- **Local `spec-writing` skill exists** (e.g. `.ai/skills/spec-writing/`): hand the brief to it — invoke that skill / follow its workflow to turn the brief into a full spec. Do NOT re-implement spec conventions; that skill owns naming, phasing, compliance.
- **Existing repo without methodology** (real code, no `AGENTS.md`/`.ai/`): still invoke `sailes-bootstrap` (Case C — adopt) before spec, so the methodology layer gets added.
- **No local spec skill** (and bootstrap not being run for a small change): **invoke the global `sailes-spec` skill** to write the spec in the standard (skeleton → Open Questions gate → phased, testable spec). Do NOT free-hand the spec — that loses the methodology. `sailes-spec` is the fallback whenever no local copy exists.

**Then, and only then**, move to implementation. Per the project's team workflow, the agent team (TeamCreate + roles) starts at *implementation*, not during elicitation — discovery is a solo interview. (See the repo's `feedback-start-with-team` memory if present.)

## Quick Reference

| Phase | Greenfield | Brownfield |
|-------|-----------|-----------|
| Orient | skim AGENTS/README, note spec tooling | + light recon: does it already exist? |
| Elicit | business→users/scale→stack→infra→data→integrations→metrics | who/why→scope→acceptance→volume→perms→handoff |
| Output | Project Brief | Task Brief (+ team dependency plan) |
| Handoff | spec-writing (or self-write spec) | spec-writing (or self-write), then team |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Jumping to data model / module layout in the first reply | Orient + elicit first; design after the brief is confirmed. |
| Asking only about MVP scope, skipping scale/infra/business | Walk the **whole** checklist; user named these as required. |
| Offering "leć z MVP, zgadnę resztę" | Forbidden — it skips the interview. Walk the checklist; state defaults out loud instead. |
| One giant question dump | Adaptive rounds of 3-4 via `AskUserQuestion`. |
| Anchoring on the host repo's stack for a greenfield project | Stay stack-agnostic until the user confirms constraints. |
| Brownfield: proposing a fix before checking it exists | Recon first — "already built" is the best possible finding. |
| Spawning the full agent team during elicitation | Discovery is solo. Team starts at implementation. |
| Re-writing spec conventions when a local spec-writing skill exists | Detect it and hand off; don't duplicate. |
| **Greenfield: writing the spec and stopping (no AGENTS.md/.ai/ generated)** | **The core failure. After the brief, invoke `sailes-bootstrap` — never end the chain at the spec.** |
| **Deciding the stack/architecture silently and listing it as an "assumption"** | Each is the user's decision — present a **decision card** (pros/cons + recommendation), put it in the Decisions Ledger, get an explicit choice. |
| **Inventing a role the user never named (e.g. "Manager")** | Enumerate roles from the user; for each, ask what they do. Never fabricate. |
| Offering a consequential option (two-way sync, embed-in-CRM) as a bare checkbox | Spell out what it *costs* (conflict resolution, webhooks, maintenance) before they pick. |
| "We have some infrastructure" accepted at face value | Drill in: which services, existing DB/auth, integrate-reuse-or-replace, constraints. |
| Naming an integration but not its data model / tier / config | Ask plan/tier, webhooks, custom fields, volume, source-of-truth per field. |
| Probing business shallowly (just "what problem?") | Also ask why-now, cost-of-problem, who commissioned, what-if-not-built. |

## Red Flags — STOP and return to elicitation

- You're about to write a spec or code and you can't name the target scale / users.
- You typed "I'll assume..." about something the user could just answer.
- **You picked a stack/ORM/auth/hosting/role yourself and the user never explicitly chose it** (it's an "assumption" in your summary). STOP — turn it into a decision card.
- **A key decision in the Decisions Ledger is still "AI-recommended-pending"** and you're moving on. Get the explicit choice.
- **You wrote a role, integration field, or architecture detail the user never confirmed.** Ask, don't invent.
- You offered a consequential option (two-way sync, embed-in-CRM, multi-tenant) without stating its cost.
- The user said "we have infrastructure" and you didn't find out *what* (DB? auth? other apps? constraints?).
- You offered an escape hatch to skip questions ("I'll decide the rest").
- Greenfield and you haven't asked about business case (incl. why-now), scale, roles, or existing infra.
- Brownfield and you haven't checked whether it already exists, or named the team handoff.
- **Greenfield and you just wrote a spec to `.ai/specs/` — but there is no `AGENTS.md`, no `.ai/skills/`, no git, no design phase.** You skipped `sailes-bootstrap`. STOP and invoke it (Step 4).

The first set means: go back to Step 1. The last means: go to Step 4 and chain to `sailes-bootstrap`.

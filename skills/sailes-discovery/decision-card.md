# Decision card — how a fork is put to the user

> Extracted from `SKILL.md` on 2026-07-26 so the entry point stays thin. This is the method Step 1
> refers to; read it when you hit a real fork, not before.

## Two kinds of question — fact-finding vs. decision

- **Fact-finding** (about *their* world): "Which CRM?", "How many users?", "What's already running?" → plain options, no recommendation needed; you're learning their reality.
- **Decision** (a fork *you* would otherwise pick): stack, ORM, auth, hosting, tenancy, integration depth, build-vs-buy, roles. → **NEVER** present as a bare "A or B?" checkbox, and never decide silently. Use the **decision card** below so the user chooses *consciously*.

## Decision card (use for every key/important decision)

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

## Decision card quality bar

Use this checklist before sending the card:
- Each option needs **one concrete upside** and **one concrete cost** that matter in this project.
- The cost must name the real trade-off: time, lock-in, ops, complexity, latency, data risk, or maintenance.
- Avoid empty adjectives like "simple", "flexible", or "future-proof" unless you explain what they simplify or protect.
- If you cannot state a concrete pro and con for an option here, do **not** offer it as a choice yet. Ask a fact-finding question first.
- The recommendation must cite the user's answers, not just the baseline.
- If an option only makes sense in a future phase, say so and move it to the backlog instead of presenting it as a current choice.

## When you cannot ground the recommendation

The `Rekomendacja: … bo …` line assumes a reason exists in *their* answers. Sometimes it does not —
and the format then quietly pushes you into inventing one, because a card with a blank recommendation
looks unfinished. It is not unfinished. **"Nie mam podstaw, żeby wskazać — &lt;what you cannot
establish&gt;" is a legitimate recommendation line**, and it points the user at exactly where their
judgment is needed.

When the fork is also expensive or hard to reverse, offer a fourth move next to A/B/C: **settle it by
measurement** — an A/B run, a spike, a probe of the actual tool, or one number. State the criterion
*before* running anything and price the run so declining is easy; the user still owns the choice,
including the choice to just decide. Full method: `sailes-bootstrap/deciding-under-uncertainty.md`.

> The detailed stack/architecture decision cards (Drizzle vs Prisma, Better Auth vs Clerk, Railway vs Vercel+Neon, single- vs multi-tenant, sync depth, durable workflow engine…) are owned by **`sailes-bootstrap`** (Phase 2), which has the researched trade-offs. In discovery, surface the *forks that change scope/architecture* and capture the user's leanings; bootstrap then walks each as a full decision card. Either way: the user decides, with pros/cons in front of them.

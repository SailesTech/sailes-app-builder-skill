# Decision-card inventory — every place the card is defined, templated, or instantiated

Compiled 2026-07-26 against the working tree of `sailes-app-builder-skill` (branch
`fix/spawn-named-roles-not-general-purpose`, Framework-Version 1.17.1).

**Method.** Every file cited below was read in full, not grepped. Coverage: all of `skills/` (16
skills, 89 files) and all of `agents/` (8 role definitions), plus `README.md`, `skills/README.md`
and the two `evals/` scenarios that grade card behaviour. Greps over three pattern families
(`Decyzja|Dlaczego to ważne|Opcje:|Rekomendacja|Twój wybór`, `decision card|karta decyzyjna|AI
recommends|human chooses|Decisions Ledger|AskUserQuestion|pros/cons`, and `🔀`) were used only to
decide *which* files to open; the classifications come from reading.

**Excluded, deliberately:** `.ai/eval-runs/**` (transcripts of agent runs — instantiations produced
*by* the framework, not definitions *in* it), `CHANGELOG.md` (history of the entries below), and
`.ai/STATE.md` / `.ai/lessons.md` (session memory that references cards but defines none). One
byte-identical duplicate of a shipped file is noted in §6.

**Classification used throughout:**

| Kind | Meaning |
|---|---|
| **T — template** | the format itself, with placeholders, for an agent to fill |
| **W — worked** | an instantiated card about a real, named fork with real options |
| **R — rule** | doctrine *about* cards: when to present one, the quality bar, ownership, the escape hatch, red flags |

**Quality bar** = the checklist stated canonically at `skills/sailes-discovery/SKILL.md:87` —
*each option needs one concrete upside and one concrete cost that matter in this project.* The
column records whether that file's card/rule actually carries it, not whether the doctrine exists
elsewhere.

---

## 1. Headline counts

- **6 templates** (T) — one canonical, one extended (measurement), four abridged re-statements.
- **17 worked cards** (W) — 7 in `db-compendium.md` §4, 6 in `sailes-database/decision-cards.md`,
  1 each in `decision-engine.md`, `developer-fit.md`, `ui-libraries.md`, plus 2 compressed inline
  cards in `sailes-bootstrap/SKILL.md`.
- **~35 rule sites** (R) across 14 files.
- **6 explicit statements of the quality bar**; 11 of the 17 worked cards carry it in full.
- **3 skills named in the brief carry no card at all**: `sailes-design`, `sailes-hosting`, and
  (as a whole directory) `agents/`. See §5.

---

## 2. The canonical definition and its variants

### 2.1 The canonical template — `skills/sailes-discovery/SKILL.md:68-80` · **T**

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

- **Fork it decides:** any *key* decision (stack, framework, ORM, auth, hosting, tenancy,
  integration depth, data-model shape, roles) and any *important* one — defined at
  `sailes-discovery/SKILL.md:14`. The section heading itself scopes it: "use for every
  key/important decision".
- **Quality bar:** carried structurally (✅/⚠️ per option) and stated separately at lines 84-92.
- Every other template in the repo cites this one as its source.

### 2.2 The extended template — `skills/sailes-bootstrap/deciding-under-uncertainty.md:86-96` · **T**

Adds two lines to §2.1 for a fork you cannot ground:

```
Rekomendacja: nie mam podstaw, żeby wskazać — <what specifically you cannot establish>
Propozycja: rozstrzygnijmy pomiarem — <criterion, derived mechanically, stated NOW>
            koszt: <time · agents> · nie rozstrzygnie: <what stays open either way>
Twój wybór? (A / B / zmierzmy)
```

- **Fork it decides:** any fork where no fact about the user's situation picks a side *and* being
  wrong is expensive/hard to reverse (both conditions required — line 12).
- **Quality bar:** carried (✅ pro / ⚠️ cost placeholders retained).
- Explicitly framed as the escape hatch the canonical format lacked: "the format has no escape
  hatch for them — so it quietly forces a recommendation that sounds grounded and is not" (line 5).

### 2.3 Label drift across the corpus

| Field | Canonical wording | Sites using a variant |
|---|---|---|
| Why-it-matters | `Dlaczego to ważne:` | `Dlaczego ważne:` — `developer-fit.md:44`, all 6 cards in `decision-cards.md`, all 7 in `db-compendium.md` §4 (the short form is in fact the **majority**: 14 sites vs 4) |
| Choice prompt | `Twój wybór? (możesz wybrać inaczej niż rekomenduję)` | bare `Twój wybór?` — `developer-fit.md:50`, `db-compendium.md` §4.2/§4.3/§4.4/§4.5/§4.6/§4.7; **absent entirely** — `ui-libraries.md:81-88`, `decision-engine.md` Q21, `stack-baseline.md` §Frontend architecture |
| Options block | `Opcje:` list | markdown table with Pros/Cons columns — `decision-engine.md:47-51`, `async-compendium.md:9-15`, `external-systems.md:31-36` |
| Recommendation | `Rekomendacja: <X> — bo <grounded reason>` | absent — `external-systems.md` (options + costs, human chooses, no recommendation line at all) |

None of this drift is flagged anywhere in the repo as intentional.

---

## 3. Inventory by file

### 3.1 `skills/sailes-discovery/` — the owner of the format

| Line(s) | What | Kind | Fork decided | Bar |
|---|---|---|---|---|
| `SKILL.md:14` | The decision-ownership principle: every key/important decision is the developer's; you recommend, they decide | R | — (doctrine) | n/a |
| `SKILL.md:16-18` | What you may decide alone (trivial + reversible only); "never disguise a decision as an assumption"; "sensible default is a recommendation, not a decision" | R | — | n/a |
| `SKILL.md:62-65` | Fact-finding vs decision: a fork *you* would otherwise pick is "NEVER a bare A-or-B checkbox" → use the card | R | — | n/a |
| `SKILL.md:68-80` | **The canonical template** (§2.1) | T | any key/important fork | yes |
| `SKILL.md:82` | Pros/cons honest and specific to *their* situation; a consequential option (two-way sync, embed-in-CRM) must spell out its cost | R | — | yes |
| `SKILL.md:84-92` | **The canonical quality bar** — 6 bullets: one concrete upside + one concrete cost each; the cost must name time/lock-in/ops/complexity/latency/data-risk/maintenance; no empty adjectives; can't state both → ask a fact-finding question first; recommendation cites their answers; future-phase-only option → backlog | R | — | **the definition of it** |
| `SKILL.md:94-105` | "When you cannot ground the recommendation" — `nie mam podstaw` is a legitimate recommendation line; offer measurement as a fourth move | R | — | n/a |
| `SKILL.md:107` | Ownership boundary: the detailed stack/architecture cards belong to `sailes-bootstrap` Phase 2; discovery captures leanings only | R | — | n/a |
| `SKILL.md:116` | Tenancy (single / multi-tenant / B2B2C) marked "(Decision card — see Step 1)" | R | tenancy | via §2.1 |
| `SKILL.md:119` | Tech stack — "a set of decisions, each presented as a decision card in `sailes-bootstrap` Phase 2" | R | stack | via §2.1 |
| `SKILL.md:120` | Infrastructure level (serverless/containers/VM/PaaS) "(Decision card if a real fork)" | R | runtime target | via §2.1 |
| `SKILL.md:138-157` | **Decisions Ledger** — the record artifact every card outcome lands in; `AI-recommended-pending` rows block progress | R | — (the ledger, not a card) | n/a |
| `SKILL.md:208-211` | Red flags: a stack/ORM/auth/hosting/role you picked yourself → "STOP — turn it into a decision card"; a still-pending ledger row; a consequential option offered without its cost | R | — | n/a |
| `brief-template.md:59-64` | Decisions Ledger table in the **Project Brief** — "Nothing left AI-recommended-pending once the brief is confirmed" | R | — | n/a |
| `brief-template.md:66-67` | "Vetoable trivia" block — the explicit not-a-decision bucket | R | — | n/a |

**Note:** the **Task Brief** (brownfield, `brief-template.md:77-125`) has **no Decisions Ledger
section** — brownfield card outcomes have nowhere canonical to land.

### 3.2 `skills/sailes-bootstrap/` — the owner of the stack cards

| Line(s) | What | Kind | Fork decided | Bar |
|---|---|---|---|---|
| `SKILL.md:42` | Step 1 rule: for each fork that materially shapes cost/scope/lock-in, present a card; "never apply a baseline choice silently as an assumption" | R | — | n/a |
| `SKILL.md:44` | Even baseline modules are "recommended defaults the user can veto", not silent givens | R | — | n/a |
| `SKILL.md:47` | **Worker process + monorepo** — inline compressed card: monorepo+worker (✅ ready for webhooks/syncs/long jobs, clean separation ⚠️ more moving parts/devops up front) vs single Next.js app (✅ simplest to start ⚠️ refactor later if async work grows) | W | worker/monorepo vs single app | yes (both sides concrete); **no** Decyzja/Rekomendacja/Twój wybór scaffolding |
| `SKILL.md:48` | **PDF / document generation** — inline compressed card: Puppeteer (✅ full HTML/CSS fidelity ⚠️ heavier RAM/Railway tier) vs `@react-pdf` (✅ light, no browser ⚠️ less layout flexibility) | W | document-generation engine | yes; same missing scaffolding |
| `SKILL.md:69` | Step 4 — the **mandatory card set**: frontend architecture, request-API engine (if split), UI layer, ORM, Auth, Hosting, plus any tenancy / sync-depth / workflow-engine fork. Only TypeScript + pnpm are flat defaults | R | names 6+ forks | n/a |
| `SKILL.md:72` | "do NOT collapse a decision card into a silent default — the researched baseline tells you what to *recommend*, not what to decide" | R | — | n/a |
| `SKILL.md:74` | Time-to-verdict (how fast the env says "wrong") is itself a criterion to "weigh openly on the decision cards" | R | — | n/a |
| `SKILL.md:138` | Common mistake: "Inventing a grounded-sounding recommendation for a fork you can't actually ground" → say `nie mam podstaw`, offer measurement | R | — | n/a |
| `SKILL.md:145-147` | Red flags: ORM/auth/hosting/tenancy locked without a card; Next.js-fullstack defaulted without the S1-S8 axes; developer-fit never asked | R | — | n/a |
| `decision-engine.md:5` | Every classification question that resolves into an architectural choice (tenancy, source-of-truth, sync depth, workflow engine, prototype-vs-production) **must** be put as a card and recorded in the Ledger; pure fact-finding questions are exempt but their derived consequences are not | R | names 6 forks | n/a |
| `decision-engine.md:7` | **Quality bar restated**: concrete upside + concrete cost + the real trade-off; can't name both → fact-find or defer to backlog/ADR | R | — | yes |
| `decision-engine.md:35-57` | **Q21 — browser inspection**: commit `.mcp.json` (A) vs leave it out (B) vs per-developer user scope (C), as a Pros/Cons table, recommend A for UI repos, "let the human choose", log in the Ledger; explicitly "never becomes mandatory" | W | commit a project-scoped chrome-devtools MCP server | yes — B's cost is "three gates stay eyeballed", C's is "silent asymmetry… with no signal in the repo"; **no** Decyzja/Dlaczego/Twój wybór labels |
| `decision-engine.md:59-72` | Stack-shaping axes S1-S8 — "Ask them as decision cards too; the default (Next.js fullstack) is a *recommendation*, not a given" | R | stack shape | n/a |
| `decision-engine.md:79-93` | Developer-fit axes D1-D7 + the balancing rule (preference is legitimate; a hard requirement overrides it and the deviation gets an ADR; the baseline never silently overrides a justified preference) | R | — | n/a |
| `decision-engine.md:95-105` | Tenancy gate — "most important fork", single-tenant default, always ask Q1 | R | tenancy | n/a (card lives in `sailes-database/decision-cards.md` §Tenancy) |
| `decision-engine.md:134` | Output: every architectural and stack-shape choice + any preference-vs-requirement override recorded in the Ledger (overrides → ADR) | R | — | n/a |
| `deciding-under-uncertainty.md` (whole file) | The escape hatch. L10-22 when a fork earns an experiment (both conditions); L24-32 four experiment shapes; L36-75 ten rules (criterion fixed and mechanically derived *before* dispatch, say what is not scored, one variable, assert the fixture creates the condition, agreement ⇒ suspect the fixture, file deliverable, one run is a sample, a criterion is a floor, **check the fork is real before measuring it**, don't touch the material mid-run); L77-96 propose-don't-launch + the extended template; L98-103 record argued-vs-measured | T + R | any ungroundable expensive fork | yes |
| `developer-fit.md:11-22` | The eight developer-fit axes as a table (who builds it, familiarity, solo vs split, domain experience, glue tolerance, type ergonomics, deadline vs longevity, ops capacity) → recorded in the Ledger | R | — | n/a |
| `developer-fit.md:26-36` | The balancing rule as a decision tree: preference honored unless it collides with a hard requirement → requirement wins + ADR | R | — | n/a |
| `developer-fit.md:42-51` | **Worked card — Request-API engine**: A) Fastify (✅ schema/Zod validation first-class, fast, great logs ⚠️ smaller ecosystem than Express) B) Hono (✅ ultralight, great types, edge-ready ⚠️ younger, fewer plugins) C) Express (✅ largest ecosystem, everyone knows it ⚠️ manual validation/types, older patterns); recommendation cites both the API-first requirement *and* the developer's stated preference | W | request-API engine | yes; uses the short `Dlaczego ważne:` and the bare `Twój wybór?` |
| `ui-libraries.md:9` | "Present them per the decision-card rules — recommend, let the human choose"; the two extra libraries "are not equals: one is additive… the other replaces the styling layer" | R | — | n/a |
| `ui-libraries.md:81-88` | **Worked card — UI layer**: A) Tailwind+shadcn default (✅ agent-editable open code, all of `sailes-design` tuned to it ⚠️ you compose sections from primitives yourself) B) A + Preline (✅ 640+ components/940+ blocks, Figma kit ⚠️ a second interactivity system `data-hs-*`) C) Astryx (✅ agent-ready CLI+MCP JSON manifest, 10 themes ⚠️ replaces Tailwind/shadcn, beta, premium pass must be rewritten as themes) | W | UX layer | yes; **missing** `Dlaczego to ważne` and `Twój wybór?` |
| `stack-baseline.md:63-65` | "Both are supported. Present as a decision card; the choice goes in the Decisions Ledger (deviation from default → ADR)" | R | frontend architecture | n/a |
| `stack-baseline.md:67-92` | Frontend architecture A/B/C with choose-when triggers and ✅/⚠️ bullets (L72-73, L85-86) — full card *material* | W (partial) | Next fullstack vs SPA+standalone API vs hybrid | yes on ✅/⚠️; **no** Decyzja/Rekomendacja/Twój wybór — it is source material, not a presentable card |
| `stack-baseline.md:84` | "Request-API engine is its own decision card: Fastify / Hono / Express" | R | request-API engine | n/a |
| `agentic-first-principles.md:7-20` | **§0 FOUNDATIONAL** — the principle the cards implement: extract the maximum, challenge everything, "describe every decision it makes, with reasons and trade-offs… real options with honest ✅ pros / ⚠️ cons and a recommendation *with a reason*, then let the developer choose", never disguise a decision as an assumption, record in the Ledger, architectural ones get an ADR. L20 names the three skills that enforce it operationally | R | — | yes (in prose) |
| `repo-done-checklist.md:29` | Verification hook: the Q21 answer **must** be in the Decisions Ledger even when the answer was B or C | R | — | n/a |
| `agents-md-template.md:34` | The only trace of the doctrine in what a **client repo** receives: "HUMAN — the human owns every key decision. Recommend with trade-offs, then let them choose." No card format is shipped | R | — | no |
| `spec-writing-template.md:26-28` | The generated local spec skill's Open Questions step — **no** options/✅⚠️/recommendation instruction, unlike its stated master (`sailes-spec/SKILL.md:35-36`) | R (by omission) | — | **no** |

### 3.3 `skills/sailes-database/` — the densest instantiation

| Line(s) | What | Kind | Fork decided | Bar |
|---|---|---|---|---|
| `SKILL.md:13-14` | The 🔒/🔀 split: hard rules get applied, decisions get a card ("options + ✅/⚠️ + recommendation, they choose") | R | — | n/a |
| `SKILL.md:38-48` | Phase 1 rule + the fork→card index table (Key / JSONB / Tenancy / Enum / SoftDelete / Tooling, each with "when it comes up") | R | 6 forks | n/a |
| `SKILL.md:49-58` | **Abridged template**, attributed "(from `sailes-discovery`)"; the why-line specialized to "cost / reversibility / lock-in / data risk" | T | schema forks | yes |
| `SKILL.md:59` | Quality bar restated, specialized: concrete for *this* project's scale/compliance/team; can't state both → fact-find first; recommendation cites their situation not the baseline | R | — | yes |
| `SKILL.md:118` | Red flag: "You picked a key type / tenancy / jsonb-vs-column **for** the user instead of presenting a decision card" | R | — | n/a |
| `decision-cards.md:5-13` | The template again as a blockquote + the bar in one line | T | — | yes |
| `decision-cards.md:17-25` | **§Key** — PK type: A) `bigint GENERATED ALWAYS AS IDENTITY` (✅ smallest index, fastest inserts, cheap WAL ⚠️ sequential → leaks row counts, enumerable, no out-of-DB generation) B) UUIDv7 (✅ globally unique + time-ordered, client-generable ⚠️ 16 vs 8 B, **leaks creation time**, needs PG18/extension) C) UUIDv4 (✅ fully random ⚠️ ~50% fragmentation, 40 vs 2 GB WAL — worst as PK) | W | primary-key type | yes |
| `decision-cards.md:27-34` | **§JSONB** — jsonb vs normalized column; why-line names the ~2000× planner regression | W | column shape | yes |
| `decision-cards.md:36-45` | **§Tenancy** — shared schema + `tenant_id` (+RLS) vs schema-per-tenant vs DB-per-tenant, with a 🔒 RLS-footgun addendum at L45 | W | multi-tenancy model | yes |
| `decision-cards.md:47-55` | **§Enum** — CHECK vs enum type vs lookup table | W | constrained-value column | yes |
| `decision-cards.md:57-65` | **§SoftDelete** — `deleted_at` vs `deleted_record` trigger→jsonb vs `temporal_tables` | W | deletion/history strategy | yes |
| `decision-cards.md:67-75` | **§Tooling** — ORM migrations vs Atlas vs SQL-first vs pgroll; "usually already locked by bootstrap; confirm rather than re-choose" | W | migration tool | options yes; **`Dlaczego ważne` line missing** |
| `decision-cards.md:77-83` | **§Strategy** — migration path (additive-small / additive-large / destructive). Explicitly *not* a safety choice. Reduced here to a three-line branch rule with **no card scaffolding at all**, although `db-compendium.md:215-231` carries it as a full card | R | migration path | n/a — see §5.4 |
| `db-compendium.md:11-18` | The 🔒/🔀 legend + "Zasada Sailes: **AI rekomenduje (z wadami/zaletami), człowiek wybiera**" — the doctrine in the reference layer | R | — | yes |
| `db-compendium.md:52, 58, 67, 73, 79, 87, 92, 157` | 🔀 section markers, each pointing at its card in §4 | R | — | n/a |
| `db-compendium.md:175-178` | **§4 header — the format declared**: "Decyzja → Dlaczego ważne → Opcje (✅ zaleta / ⚠️ koszt) → Rekomendacja → Twój wybór", plus a Mermaid decision tree per card; "cards cover only 🔀 — for 🔒 there is no choice" | T | — | yes |
| `db-compendium.md:180-196` | **§4.1 PK type** — the only card in the repo carrying the *full* canonical footer `Twój wybór? (możesz wybrać inaczej niż rekomenduję)` (L188) + Mermaid tree; costs quantified (107k vs 75k ins/s, 40 vs 2 GB WAL, 50M rows ~20 min vs <2 min) | W | primary-key type | yes, with numbers |
| `db-compendium.md:198-213` | **§4.2** jsonb vs normalized column + Mermaid | W | column shape | yes |
| `db-compendium.md:215-231` | **§4.3** migration strategy: A) ordinary transactional B) online (`CONCURRENTLY`/constant default, outside a transaction) C) full expand/contract + dual-write + batched backfill; the why-line separates "which safe path" from 🔒 "whether to be safe" | W | migration path | yes |
| `db-compendium.md:233-248` | **§4.4** multi-tenancy model + RLS footguns in the recommendation line | W | tenancy | yes |
| `db-compendium.md:250-269` | **§4.5** migration tool A-D + Mermaid | W | migration tool | yes |
| `db-compendium.md:271-279` | **§4.6** enum vs lookup vs CHECK; the `Twój wybór?` line carries a sourcing caveat ("the lookup-table side is less documented — see §1.4") — the one card that discloses its own evidence weakness | W | constrained-value column | yes |
| `db-compendium.md:281-296` | **§4.7** soft delete vs `deleted_record` vs temporal + Mermaid | W | deletion/history | yes |
| `db-compendium.md:298-304` | **§4.8** — *not* a card: how to persist decisions (Mermaid, Nygard/MADR ADRs, `adr-tools`, strong_migrations-style decision tables) | R | — | n/a |
| `db-compendium.md:373` | Pipeline hook restating the format as "decision card Sailes (Decyzja / Dlaczego ważne / Opcje A-B-C z ✅⚠️ / Rekomendacja / Twój wybór) — AI rekomenduje, człowiek wybiera" | R | — | yes |
| `migration-safety-checklist.md:40` | Pre-merge gate row pointing back at `decision-cards.md` §Tenancy for the RLS footguns | R | — | n/a |

### 3.4 `skills/sailes-async/`

| Line(s) | What | Kind | Fork decided | Bar |
|---|---|---|---|---|
| `SKILL.md:13-14` | The 🔒/🔀 split; 🔀 = build-vs-low-code, engine, self-host vs cloud, sync critical path vs deferred | R | 4 forks | n/a |
| `SKILL.md:53-63` | Phase 1 rule + fork table, adding a fifth: **intake auth the real caller can actually satisfy** ("HMAC only works if the caller can sign") | R | 5 forks | n/a |
| `SKILL.md:65-74` | **Abridged template**, attributed "(from `sailes-discovery`)"; why-line specialized to "latency / data-loss / lock-in / ops cost"; recommendation grounded in "THEIR SLA + scale + team" | T | async forks | placeholders only — **no prose statement of the bar** |
| `SKILL.md:75` | The default shape to recommend (thin intake + durable functions) — a recommendation, stated as one | R | — | n/a |
| `SKILL.md:123` | Red flag: "You picked the engine / self-host / sync-vs-defer split FOR the user instead of a decision card" | R | — | n/a |
| `async-compendium.md:5-22` | **§engine — card material**: Inngest self-hosted / Temporal / BullMQ+Redis / Trigger.dev / Make-n8n-Zapier as a ✅/⚠️ table, plus "how SRF chose" (a worked grounding: single firm, 50-500 bookings/day, self-hosted preference, AI-agent build team) and "when each is overkill" | W (partial) | durable engine | yes on ✅/⚠️; no card labels, no recommendation line — the SKILL.md template is meant to wrap it |
| `async-compendium.md:24` | 🔀 self-host vs managed cloud — stated with its cost (keys, container networking, extra Redis) and an ADR trigger to revisit; no options block, no recommendation | R | self-host vs cloud | partial (cost named, no upside stated) |
| `async-compendium.md:113` | DRY boundary: schema decisions (PK by exposure, enums, jsonb, soft-delete) are `sailes-database`'s cards, not restated here | R | — | n/a |

### 3.5 `skills/sailes-spec/`

| Line(s) | What | Kind | Fork decided | Bar |
|---|---|---|---|---|
| `SKILL.md:12` | Core principle: the unknowns are the user's to decide, "consistent with `sailes-discovery`'s decision-ownership — you propose, they choose" | R | — | n/a |
| `SKILL.md:35` | Open Questions gate: "For anything that's a real fork, present it the way `sailes-discovery` does: options with ✅/⚠️ + a recommendation, the user chooses" — the card by reference, no template inline | R | any spec-level fork | via reference |
| `SKILL.md:36` | **Quality bar restated**: one concrete upside, one concrete cost, the real trade-off; "if the pros/cons are weak or generic, ask a fact-finding question instead of pretending it's a real decision" | R | — | yes |
| `SKILL.md:38` | Escalation: Open Questions bigger than one sitting → `sailes-wayfinder`, each unknown becomes a typed ticket | R | — | n/a |
| `SKILL.md:131, 140` | Common mistake + red flag: deciding the critical unknowns (data model / tenancy / integration contract) yourself | R | — | n/a |

### 3.6 `skills/sailes-wayfinder/`

| Line(s) | What | Kind | Fork decided | Bar |
|---|---|---|---|---|
| `SKILL.md:12` | The skill's zero-dependency claim rests on cards: "every ticket type resolves through mechanisms this framework already has — decision cards (`sailes-discovery` style), research subagents, `sailes-design` prototypes" | R | — | n/a |
| `SKILL.md:32` | **A named fork stated as a card without being written as one**: local markdown vs GitHub Issues as the canonical tracker — "offer a 🔀 decision card… the user chooses" | R | tracker home | no options/pros/cons/recommendation written out |
| `SKILL.md:81` | Ticket-type table: a **decision** ticket is HITL and resolved by "Decision card in the `sailes-discovery` style: options with ✅/⚠️ + **one concrete upside, one concrete cost each** + a recommendation — the **user** chooses" | R | every decision ticket | **yes — the bar restated inside the table cell** |
| `SKILL.md:101` | Mode 1 step 1: name the Destination via a decision card if there's a real fork | R | the effort's destination | n/a |
| `SKILL.md:125, 155` | Hard rule + red flag: HITL means the human speaks for themselves; never close a decision/prototype ticket without their word — "deadline pressure doesn't transfer ownership" | R | — | n/a |

### 3.7 `skills/sailes-design/` — consumes one card, defines none

| Line(s) | What | Kind |
|---|---|---|
| `browser-inspect.md:50` | The only reference: "Per-project opt-in is a `.mcp.json` decision card in bootstrap (Q21) — committed to the repo, so every agent and developer on that project gets the same instrument" | R (pointer to §3.2's Q21 card) |
| `SKILL.md:33-37` | The artifact-format fork (`design-system/MASTER.md` + page overrides vs `.ai/specs/ui-spec.md`) with a when-each guideline and "produce one, confirmed by the user" — resolved by confirmation, **not** by a card | — |
| `SKILL.md:74` | **A rule about when NOT to use a card**: a render failing the physical-integrity gate "is a **defect to fix**, never a variant to present. Don't ask the human to choose between a broken layout and a less-broken one — fix it, re-render, re-check" | R |

No card is defined, templated, or instantiated in this skill. See §5.1.

### 3.8 `skills/sailes-hosting/` — no card anywhere

| Line(s) | What | Kind |
|---|---|---|
| `SKILL.md:60-73` | "Cztery warstwy stanu — gdzie co żyje (**najważniejsza decyzja hostingowa**)" — env vars / Postgres / S3 bucket / Volume, presented as a lookup table plus a 🔒 ephemeral-FS rule. Named a decision, shaped as a rule | — |
| `SKILL.md:85` | The word "Decyzja" appears once, as a routing pointer ("Decyzja »czy wolno wypuścić« → `release-checklist.md`") | — |
| `SKILL.md:101-123` | "Złote zasady" — eight hard lines (Dockerfile-first over Nixpacks, branch pinning, `railway status --json` as ground truth, prod approved by a human). Real forks decided *for* the reader, by rule | — |
| `references/monorepo-multi-serwis.md:244-247` | The closest thing to a card: migrations after a Dockerfile-only deploy — "Opcje:" manual `railway run … db:migrate` (one owning service, else two race on `__drizzle_migrations`) **or** a deliberate release/`preDeployCommand` hook ("kompromis: przy dużej skali migracja blokuje start"). Two options, one trade-off named each, **no recommendation and no ask** | W (degenerate) |

See §5.2.

### 3.9 `agents/` — no card in any role definition

Zero occurrences of `Decyzja`, `decision card`, or the format's fields in all eight files
(`team-lead`, `explorer`, `designer`, `be-dev`, `fe-dev`, `tester`, `checker`, `qa`). What exists
is the *ownership half* of the doctrine:

| Line(s) | What | Kind |
|---|---|---|
| `team-lead.md:29` | "when freezing requires a NEW architectural or UX choice the spec didn't settle, that is a key decision: escalate to the human, get the answer, then freeze. **Never silently pick the architecture mid-pipeline.** The human owns every key decision." | R |
| `team-lead.md:33-49` | **"When you cannot recommend — escalate with a measurement, not a guess"** — the §2.2 doctrine restated for the lead: say plainly you cannot ground it, offer A/B/spike/probe/one-number, price it (how long, how many agents, what stays open), let the human pick A / B / *measure*; "a fork you can flip in an afternoon does not earn a day of measuring". Two obligations: fix the criterion mechanically **before** dispatching ("a criterion written after seeing the results is your opinion in a lab coat"), and record whether the decision was **argued or measured**. Pointer to `deciding-under-uncertainty.md` | R |
| `team-lead.md:122` | The closing hard line: "the human owns every key decision" | R |
| `be-dev.md:19`, `fe-dev.md:21` | Workers "never… make a key decision (stack, contract shape, data-model, auth, roles). If you hit a scope question or a key decision, STOP and escalate to the lead. Escalation is upward only." | R |
| `tester.md:44-47` | No test infrastructure → report `ENV-DEFECT` with a proposal; "Do not stand it up yourself — that is a **stack decision and belongs to the human**" | R |

See §5.3.

### 3.10 Other skills — documented variants and near-misses

| Line(s) | What | Kind | Bar |
|---|---|---|---|
| `sailes-test/references/external-systems.md:5` | "`tester` presents the fork **per system**, the human chooses, and the choice is recorded in the test plan with what it trades away" | R | — |
| `sailes-test/references/external-systems.md:29-36` | **A documented variant of the card**: four options (Mock/MSW · Fake · Recorded cassette · Real sandbox) as a **Buys / Costs** table — e.g. mock "buys fast, hermetic, no credentials", costs "drifts from the real API **silently** — the classic false green" | W (variant) | yes — but **no recommendation line at all**, unlike every other card in the repo |
| `sailes-test/references/external-systems.md:93-102` | The recording convention: `🔀 <system> → <choice> — <what it trades away>`, with two worked examples (Pipedrive → cassette; Slack → mock), "so the next reader sees the decision rather than inheriting it as if it were physics" | T (recording form) | yes |
| `sailes-test/test-plan-template.md:30` | The same line as a template field under "Requires you": `🔀 <external system> → chosen double: mock \| fake \| cassette \| real sandbox — <what this trades away>` | T | partial |
| `sailes-diagnose/SKILL.md:16-20` | The 🔒/🔀 split again — 🔀 = "whether to mitigate before understanding, whether to run any write at all, when to stop and escalate. **You recommend; they choose.**" No card, no fork list, no template | R | — |
| `sailes-migrate/rulebook-template.md:17, 38` | "Decyzja docelowa (**zamrożona**)" — a decide-once lookup table for translation constructs, whose verdict source is Step 1 or a bakeoff, not a human choice. Explicitly a machine-facing consistency device: "Jeśli dwaj agenci mogliby przełożyć ten sam konstrukt inaczej — decyzja idzie tutaj i jest rozstrzygnięta **raz**" | — (near-miss, not a card) | — |

### 3.11 Framework-level documentation and evals

| Line(s) | What | Kind |
|---|---|---|
| `README.md:3` | The product claim: "the **developer consciously owning every key decision** (the AI recommends with pros/cons; the human chooses)" | R |
| `README.md:185, 190, 191` | Per-skill descriptions naming cards as the mechanism (discovery; database 🔀; async 🔀) | R |
| `skills/README.md:48, 54, 55` | Same, for wayfinder / database / async | R |
| `skills/README.md:67` | Core invariant #4: "**The developer owns the key decisions.** Discovery shows trade-offs and minimizes autonomous AI choices" | R |
| `skills/README.md:70` | Core invariant #7: "Developer owns the vision; AI interrogates and illuminates, never decides" | R |
| `evals/lead-proposes-a-measurement-when-it-cannot-recommend.md` (whole file) | The protected behaviour for §2.2, graded on **two** arms: an ungroundable fork must get `nie mam podstaw` + a priced measurement offer with the criterion fixed *before* the run, and a groundable fork must get a normal card and **no** experiment. L34-41 records the origin: "Until this eval was written (2026-07-26, on 1.16.2) the card format had no escape hatch… a fork with no available ground still had to be filled in". L56-66 records a fixture defect honestly — the "ungroundable" arm turned out groundable because the agent dissolved the fork, which promoted rule #9 ("check the fork is real before you measure it") into `deciding-under-uncertainty.md` the same day | R (eval) |
| `evals/discovery-chains-into-bootstrap.md:18` | Records the ownership boundary as graded behaviour: discovery "Left the stack deliberately open with constraints captured, because the stack decision cards are bootstrap's" | R (eval) |

---

## 4. Where the quality bar is actually stated

Six sites state it in prose; everything else inherits it structurally through `✅ … ⚠️ …`
placeholders.

| Site | Strength |
|---|---|
| `sailes-discovery/SKILL.md:84-92` | **Canonical** — 6 bullets, incl. "if you cannot state a concrete pro and con, do not offer it as a choice yet" and "avoid empty adjectives like simple / flexible / future-proof" |
| `sailes-bootstrap/decision-engine.md:7` | Full — adds "defer the option to backlog/ADR" |
| `sailes-database/SKILL.md:59` | Full — specialized to scale/compliance/team |
| `sailes-database/decision-cards.md:13` | One line — "each option = one concrete upside + one concrete cost *for this project*. No empty adjectives" |
| `sailes-spec/SKILL.md:36` | Full — adds the fallback ("ask a fact-finding question instead of pretending it's a real decision") |
| `sailes-wayfinder/SKILL.md:81` | Full, inside a table cell |

**Not stated in prose anywhere:** `sailes-async/SKILL.md` (template placeholders only),
`sailes-bootstrap/SKILL.md` (its two inline cards happen to satisfy it), `ui-libraries.md`,
`developer-fit.md`, `stack-baseline.md`, `sailes-diagnose`, `agents/*`.

---

## 5. Gaps and inconsistencies found

**5.1 `sailes-design` presents no card, though it makes consequential choices.** The skill decides
palette, type pairing, layout concept, the signature element, and the artifact format
(`SKILL.md:33-37`) — several of which are hard to reverse and shape every later UI phase. Its only
mechanism is "confirm with the user" (`SKILL.md:33, 49`). It is also the one skill with a rule
about when a card is *wrong* (`SKILL.md:74`, defects are not variants), which suggests the omission
is at least partly deliberate — but nothing says so.

**5.2 `sailes-hosting` presents no card either, and decides real forks by rule.** Volume vs S3,
Dockerfile vs Nixpacks, region, migrate-on-start vs manual, `dev` holding prod credentials — all
resolved as "złote zasady" (`SKILL.md:101-123`). The one place options are laid out
(`references/monorepo-multi-serwis.md:244-247`) has neither a recommendation nor an ask. Given
`sailes-discovery/SKILL.md:119-120` classifies hosting/infrastructure as card-worthy and
`sailes-bootstrap/SKILL.md:69` lists **Hosting** in the mandatory card set, hosting doctrine and
the hosting skill disagree.

**5.3 `agents/` carries the ownership rule but not the format.** No worker or gate role can
recognise a card, and `team-lead` — the role that actually escalates to the human — has the
measurement escape hatch (`team-lead.md:33-49`) but not the card format it extends. A lead running
without the `sailes-discovery` skill loaded knows it must escalate, and knows how to offer a
measurement, but has no template for the ordinary case.

**5.4 The same fork is a full card in one file and a bare rule in another.** Migration strategy is
a complete card at `db-compendium.md:215-231` (Decyzja / Dlaczego ważne / A-B-C with ✅⚠️ /
Rekomendacja / Twój wybór / Mermaid) but is reduced to a three-line branch rule at
`decision-cards.md:77-83` — the file the skill actually routes agents to (`SKILL.md:73`). An agent
following `SKILL.md` never sees the card.

**5.5 What a generated client repo receives is thinner than the framework's own doctrine.**
`agents-md-template.md:34` ships the one-line HUMAN rule and no format;
`spec-writing-template.md:26-28` ships an Open Questions gate with **no** instruction to present
real forks as options + ✅/⚠️ + recommendation, although `spec-writing-template.md:7` declares the
template mirrors `sailes-spec` and "if you change the workflow/sections/checklist, change both" —
and `sailes-spec/SKILL.md:35-36` carries exactly that instruction plus the quality bar.

**5.6 The Task Brief has no Decisions Ledger.** `brief-template.md` gives the greenfield Project
Brief a Ledger (L59-64) and the brownfield Task Brief none (L77-125), so brownfield card outcomes
have no canonical home — despite `sailes-discovery/SKILL.md:140` presenting the Ledger as the
mechanism "that stops choices being silently rubber-stamped".

**5.7 Label drift is unmanaged.** `Dlaczego ważne` outnumbers the canonical `Dlaczego to ważne`
14:4; the "(możesz wybrać inaczej niż rekomenduję)" reassurance survives in only 5 of 17 worked
cards; three worked cards omit the choice prompt entirely (§2.3). Nothing in the repo declares an
allowed short form.

**5.8 Two cards drop a required field.** `decision-cards.md:67-75` (§Tooling) has no
`Dlaczego ważne`; `ui-libraries.md:81-88` has neither `Dlaczego to ważne` nor `Twój wybór?`.

**5.9 One documented variant has no recommendation line.** `external-systems.md:29-36` presents
options and costs and hands the choice over with no recommendation — which contradicts the
doctrine's core shape ("you recommend; they choose") everywhere else, including the file's own
sibling rule at `sailes-diagnose/SKILL.md:20`. It may be defensible (the trade-off is genuinely
per-system) but it is undeclared.

---

## 6. Provenance note

`skile do inspiracji/db-compendium.md` is **byte-identical** to
`skills/sailes-database/db-compendium.md` (verified with `diff -q`), including all seven cards of
§4. It sits in the folder `README.md:219` documents as "provenance: source material the skills were
distilled from" and is not installed by `install.sh` or shipped by the plugin — so it is a frozen
copy, not a second live definition. It is excluded from the counts in §1.

# Trigger collision map — 17 skills × 10 roles

Built 2026-07-29 by reading every `description:` in `skills/*/SKILL.md` and `agents/*.md` off disk,
against `AGENTS.md` §Task router, `skills/README.md`, and `hooks/workflow-router.js`.

**What a collision is here:** two routing instruments whose `description:` claim the same trigger
surface, so a request that belongs to one can land on the other, and nothing in either description
tells the model which. Nothing in `npm test` checks this — `agents/validate-frontmatter.test.js`
validates field *shape* (known keys, pinned model, no `Agent` tool) and never compares two
descriptions to each other. There is no frontmatter validator for `skills/` at all.

**25 pairs found. 9 are high-severity.** 13 are detectable by comparing description text alone;
12 need a model judgment about a request.

---

## The worked example (already paid for)

`evals/diagnose-runs-live-case-before-audit.md:55` — the control arm did not diverge:

> Control (no mandate): behaved the SAME — on a machine with the plugin installed the skill
> descriptions route both arms, so the mandate's marginal value cannot be isolated here.

`.ai/eval-runs/2026-07-28-rerun-17-stale/VERDICT.md:14` records the same:

> with the plugin installed machine-wide, skill descriptions route BOTH arms to sailes-diagnose.

Note the shape carefully, because it is more general than "two skills fight". The two instruments
that collided were **`sailes-diagnose`'s description and `hooks/workflow-router.js`'s SessionStart
mandate** — both claim the BROKEN-≠-MISSING surface, in near-identical words. The description alone
was strong enough to route, so the mandate became **unmeasurable**: the eval could not attribute the
behavior to either instrument, and the scenario's own rule ("A control that behaves identically means
the eval proved nothing about the skill") fired.

The generalizable failure mode, and the reason this map exists:

> When two instruments claim the same trigger surface, one of them becomes unattributable. The
> visible cost is a misroute; the invisible cost is that no eval can ever measure the redundant one.

Every entry below is graded for whether it can produce that same outcome.

---

## Detection classes (for the future deterministic test)

| Class | Means | Test can be |
|---|---|---|
| **L** — literal | The two descriptions share a quotable string, proper noun, or trigger phrase | Deterministic: tokenize `description:`, intersect, fail on shared trigger-quoted phrases |
| **S** — structural | A machine-checkable *property* of one description (bare single-word trigger; absolutism like "Używaj ZAWSZE"; no negative-guard clause naming the sibling) | Deterministic, with a rule list |
| **J** — judgment | Overlap is conceptual with no shared string; resolving needs a model to classify a request, or to read repo state (spec `Status:`, artifact on disk) | Model-judged eval, not a unit test |

**The mitigation that already works, and is machine-checkable (class S):** `sailes-migrate`'s
description carries an explicit negative guard —

> To NIE jest o migracjach SCHEMATU BAZY DANYCH — te robi `sailes-database` (Prisma/Drizzle/SQL).

A test can assert: *when two descriptions share a high-value trigger token, at least one must name
the other skill in a disambiguating clause.* `sailes-migrate` ↔ `sailes-database` passes that test
today. Most pairs below do not.

---

## A. Build-pipeline entry — who takes the first turn

### A1 · `sailes-discovery` ↔ `sailes-start` — HIGH · class L

**Shared surface, quoted.** discovery: *"Use at the START of a conversation when the user wants to
build a new app/project"*, triggers *"chcę zbudować"*, *"zacznijmy projekt"*, *"zróbmy feature"*.
start: *"Use at the very START of building something"*, triggers *"chcę zbudować X i nie wiem od
czego zacząć"*, *"zacznijmy nowy projekt"*, *"zróbmy nową funkcjonalność"*. Three trigger phrases are
substring-identical or one-word apart.

**Ambiguous request.** "chcę zbudować aplikację do ofertowania dla handlowców" — no signal about
whether the user wants the interview or the whole walk.

**Doctrine-correct winner.** `sailes-start` when the ask is end-to-end guidance; `sailes-discovery`
when the ask is the interview only. Source: `hooks/workflow-router.js` (no active spec branch) —
*"invoke `sailes-start` (it shows the map and routes A/B/C), or `sailes-discovery` directly if the
human only wants the scope interview"*; `sailes-start` §When NOT to — *"The user wants just one
phase … call that skill directly"*; `skills/README.md:46` — *"Each skill is independently callable
… `sailes-start` just sequences them with hard gates."*

**Why it is not resolvable from the descriptions.** Neither description carries the discriminator
(*wants the whole walk* vs *wants one phase*) in its trigger list. The discriminator exists only in
`sailes-start`'s body.

---

### A2 · `sailes-discovery` ↔ `sailes-bootstrap` — MEDIUM · class L+J

**Shared surface, quoted.** bootstrap triggers: *"wybierz stack"*, *"jaki stack / podejście"*,
*"zorientuj się w repo"*. discovery: *"Also use when you catch yourself about to pick a
stack/architecture/role for the user instead of letting them decide"* and *"Also use when you are
about to write a greenfield spec but have not generated the repo standard (no AGENTS.md/.ai/)"*.

**Ambiguous request.** "jaki stack wybrać do tej aplikacji?" — bootstrap owns the literal phrase;
discovery's second clause claims any unowned stack decision.

**Doctrine-correct winner.** `sailes-bootstrap` for the stack question itself (it owns
`stack-baseline.md` and `decision-engine.md`); `sailes-discovery` first if no confirmed brief exists
— bootstrap §When to use: *"discovery is done and you're about to set up"*. Source:
`skills/README.md` pipeline, Phase 1 → Phase 2.

**Class note.** The *collision* is literal ("stack" in both). The *resolution* depends on whether a
brief exists — repo state, so J.

---

### A3 · `sailes-bootstrap` ↔ `sailes-start` (Route C) — MEDIUM · class L

**Shared surface, quoted.** bootstrap: *"entering any web-app repo (existing or empty) to start
building"*, *"ruszamy"*. start: *"ROUTE C: Adopt an existing repo (code, no methodology)"* and
trigger *"od początku do końca"*.

**Ambiguous request.** "mamy repo z kodem, ale bez naszej struktury — zaadaptuj je."

**Doctrine-correct winner.** `sailes-start` (it makes the A/B/C route choice, then hands to
bootstrap Case C). `sailes-bootstrap` alone only when the ask is pure orientation ("zorientuj się w
repo"). Source: `sailes-start` §Step 0; `sailes-bootstrap` §Step 0 — *"If you arrived via
`sailes-start`, the route (A/B/C) was already chosen there … If invoked directly, detect it now"*,
which is the only place the precedence is written.

---

### A4 · `sailes-start` ↔ `sailes-wayfinder` — LOW · class L

**Shared surface, quoted.** wayfinder's description names its caller: *"`sailes-start` routing a
foggy idea"*. start's trigger *"chcę zbudować X i nie wiem od czego zacząć"* is close to wayfinder's
*"dużo niewiadomych"*.

**Ambiguous request.** "duży system, kilka integracji, nie wiem od czego zacząć."

**Doctrine-correct winner.** `sailes-start` — it owns the fog check (§Step 0.3: *"invoke
`sailes-wayfinder` first … wayfinding precedes Phase 1, it doesn't replace it"*). Low severity
precisely because wayfinder's description declares the containment; this is the pattern that works.

---

### A5 · `sailes-discovery` ↔ `sailes-wayfinder` — MEDIUM · class J

**Shared surface.** Both claim un-pinned unknowns. discovery: *"the real scope, business case,
scale, stack, or acceptance criteria are not yet pinned down"*. wayfinder: *"unknowns depend on
other unknowns, on research/spikes, or on client input that arrives later"*. No shared string — the
overlap is the concept "we don't know yet."

**Ambiguous request.** "nie wiemy jeszcze którego API użyjemy ani kto będzie userem" — wayfinder
lists this almost verbatim; discovery's whole job is eliciting exactly these.

**Doctrine-correct winner.** `sailes-wayfinder` only when the unknowns exceed one sitting;
`sailes-discovery` otherwise. Source: `sailes-wayfinder` §When NOT to — *"the scope interview fits
one sitting → `sailes-discovery`"*. That guard lives in the body, not in either description.

**Class.** J — "fits one sitting" is a size judgment about a request.

---

## B. Spec lifecycle

### B1 · `sailes-spec` ↔ `sailes-wayfinder` — LOW/MEDIUM · class L

**Shared surface, quoted.** wayfinder description: *"`sailes-spec` Open Questions that exceed one
sitting"*. spec description: *"Produces a spec with an Open Questions gate"*. Literal shared token:
**"Open Questions"**.

**Ambiguous request.** "mam spec z 12 otwartymi pytaniami, część wymaga researchu u klienta."

**Doctrine-correct winner.** `sailes-spec` takes the turn and escalates — §Workflow 3, *"invoke
`sailes-wayfinder`, convert each unknown into a typed ticket … keep the spec at skeleton with
`Status: draft`"*. Low severity because both descriptions name the relation.

---

### B2 · `sailes-spec` ↔ `sailes-pre-implement` — HIGH · class L

**Shared surface, quoted.** spec: *"or **reviewing an existing spec**"*, *"Use when … you're
reviewing a spec for completeness/architecture fit"*. pre-implement: *"analyze the spec for
readiness"*, triggers *"przeanalizuj spec"*, *"czy spec gotowy"*, *"gap analysis"*. Both are
"read a spec and tell me if it's OK."

**Ambiguous request.** "przejrzyj ten spec i powiedz, czy jest ok" — matches both descriptions with
no tiebreak.

**Doctrine-correct winner.** Determined by the spec's `Status:` line, which appears in **neither**
description: `draft` → `sailes-spec` review (pre-implement §When NOT to: *"the spec is still in
`draft` (finish it first)"*); `approved` → `sailes-pre-implement` (`AGENTS.md` Task router: *"A live
spec covers it | continue its phase — `sailes-pre-implement`, then `sailes-implement`"*).

**Why HIGH.** The discriminator is machine-readable **in the repo** (a `Status:` line) yet absent
from both descriptions — the cheapest fix on this map: add the status word to each trigger list.

---

## C. Broken vs. building — the surface the recorded failure lives on

### C1 · `sailes-diagnose` ↔ `sailes-discovery` — HIGH · class J

**Shared surface, quoted.** diagnose: *"a silent data gap"*, *"nie doszedł deal / nie przyszedł
e-mail"*, *"klient zgłosił"*. discovery: *"asks for a non-trivial change/feature/task in an existing
app"*, trigger *"dodaj X"*, *"potrzebuję"*.

**Ambiguous request.** "nie przychodzą powiadomienia mailowe do handlowców" — indistinguishable, at
the description level, between *a built feature that broke* (diagnose) and *a feature that was never
built* (discovery).

**Doctrine-correct winner.** `AGENTS.md` Task router row 1: *"Something is broken in a running
system | `sailes-diagnose` — read-only, ends at a proven mechanism"*. `sailes-diagnose` §When NOT to
resolves the other direction: *"The feature does not exist yet. 'It doesn't do X' is not a defect;
that is `sailes-discovery`."*

**Class.** J — it turns on a fact about the system (does the feature exist?), not on the words. A
deterministic test can only flag the pair; the arbitration is a model judgment, and it is exactly
the judgment `hooks/workflow-router.js` tries to pre-empt with its BROKEN ≠ MISSING block.

---

### C2 · `sailes-diagnose` ↔ `sailes-async` — HIGH · class L+J

**Shared surface, quoted.** async: *"a **slow, brittle**, or sleep-padded integration flow (often on
Make/n8n/Zapier)"*, *"retry z konkretnego kroku"*, *"Slack alert na błąd"*. diagnose: *"a failed
run"*, *"alert ze Slacka"*, *"czemu to nie zadziałało"*, *"to działało wczoraj"*. Shared literal
concepts: **brittle/failing flow**, **Slack alert**, **retry**.

**Ambiguous request.** "ten proces na Make ciągle się wywala i trwa 5 minut, ogarnij to" — carries
both surfaces in one sentence.

**Doctrine-correct winner.** `sailes-diagnose` first when anything is *failing*; `sailes-async` only
when the system works and is merely slow. Source: `sailes-diagnose` §When NOT to — *"The system is
fine and you want to make it faster — that is `sailes-async`"*; `AGENTS.md` Task router row 1. Note
the guard is one-directional: diagnose disclaims speed work, async never disclaims broken work.

---

### C3 · `sailes-diagnose` ↔ `sailes-hosting` — HIGH · class L

**Shared surface, quoted.** hosting: *"**debugujesz** „coś się nie wdrożyło" / „zniknęły pliki po
redeploy" / „redirect_uri / callback URL""*, *"czytasz **logi** przez railway CLI (railway logs …)"*.
diagnose: *"sprawdź błędy prod"*, *"**logi**"*, *"coś się wysypało"*, *"**debug**"*, *"incydent"*.
Shared literal tokens: **debug/debugujesz**, **logi/logs**, plus both claim production.

**Ambiguous request.** "na prodzie po redeployu zniknęły wgrane pliki, sprawdź logi" — hosting names
the symptom verbatim; diagnose owns the whole *broken-in-production* category.

**Doctrine-correct winner.** `sailes-diagnose` owns the **procedure** (read-only on prod, live case
before audit, ≥3 falsifiable hypotheses, incident record); `sailes-hosting` is domain knowledge read
*inside* it — `skills/README.md` classes it *"Hosting/ops reference (**not part of the core
pipeline**)"*, and `AGENTS.md` Task router routes all broken-system work to diagnose.

**Why HIGH.** Nothing in `sailes-hosting`'s description marks it as reference-not-procedure, and it
opens with *"Użyj ZAWSZE gdy: …"*. A request matching its symptom list will beat diagnose on
specificity while losing on doctrine — a misroute that skips the read-only rule on production.

---

### C4 · `sailes-diagnose` ↔ `sailes-pipedrive` — MEDIUM · class S

**Shared surface, quoted.** pipedrive: *"**Używaj ZAWSZE**, gdy budujesz, rejestrujesz lub
**debugujesz** cokolwiek osadzonego w UI Pipedrive"*. diagnose owns all *debugging* of running
systems.

**Ambiguous request.** "panel na karcie deala przestał się pokazywać, ogarnij."

**Doctrine-correct winner.** Same as C3 — `sailes-diagnose` for the procedure, `sailes-pipedrive` as
the domain reference inside it (`skills/README.md`: *"Domain integration reference (**not part of the
core pipeline**)"*).

**Class S, and the reusable rule.** Two descriptions in this repo assert *"Używaj ZAWSZE"*
(`sailes-hosting`, `sailes-pipedrive`) and one asserts *"Używaj ZAWSZE gdy pada:"*
(`sailes-migrate`). An absolute claim in a domain-sibling description, combined with a verb the
pipeline owns (`debugujesz`, `wdrażasz`), is mechanically detectable and is the single most
copy-pasteable lint rule on this map.

---

## D. Domain siblings against each other

### D1 · `sailes-async` ↔ `sailes-hosting` — MEDIUM · class L

**Shared surface, quoted.** async: *"**Inngest** / Temporal / BullMQ"*, *"durable workflow"*,
*"kolejka / queue"*. hosting: *"api+worker+**self-hosted Inngest**+Postgres+Redis"*, *"self-hosted
Inngest"*. Shared proper noun: **Inngest**. Both also claim *self-host*.

**Ambiguous request.** "postawmy self-hosted Inngest dla naszego workera."

**Doctrine-correct winner.** `sailes-async` owns *whether and which engine* (its description:
*"🔀 Decisions … build-vs-low-code, engine, self-host, sync-vs-defer"* as decision cards);
`sailes-hosting` owns *how it runs on the platform* (Dockerfile vs Nixpacks, private networking,
branch pinning). The split is by verb — **choose** → async, **deploy** → hosting — and it is written
in neither description.

**Class L, cleanly.** A shared capitalized proper noun across two descriptions is the easiest
deterministic signal on this map.

---

### D2 · `sailes-database` ↔ `sailes-migrate` — LOW · class L (already mitigated)

**Shared surface, quoted.** database triggers: *"napisz migrację"*, *"migration"*, *"zmiana schematu
bazy"*. migrate: *"„migracja kodu/języka"*, *"code migration"*, *"language migration"*. Shared stem:
**migracj/migration**.

**Ambiguous request.** "zrób migrację" — bare.

**Doctrine-correct winner.** By subject: schema → `sailes-database`; code/language port →
`sailes-migrate`. `AGENTS.md` Task router row 2 carries the migrate half.

**Why it is LOW and why it matters more than its severity.** Both descriptions carry the negative
guard: migrate — *"To NIE jest o migracjach SCHEMATU BAZY DANYCH — te robi `sailes-database`"*; and
migrate's body repeats it. **This is the only pair on the map that disambiguates itself in the
frontmatter.** It is the template for fixing everything above, and the reference case for the
class-S test.

---

## E. Testing and verification

### E1 · `sailes-test` ↔ `sailes-eval-runner` — HIGH · class L

**Shared surface, quoted.** test triggers: *"**przetestuj to**"*, *"test this feature"*, *"napisz
testy"*. eval-runner triggers: *"odpal evala"*, *"**przetestuj czy skill trzyma regułę**"*. Literal
shared trigger stem: **przetestuj**.

**Ambiguous request.** "przetestuj, czy to zachowanie się trzyma" — in this repo the subject is a
skill (eval-runner); in a client repo it is app code (test).

**Doctrine-correct winner.** `sailes-eval-runner` when the thing under test is a skill/role/hook —
its description ends *"Framework maintenance, not client-app work"*, and `AGENTS.md` §Verification:
*"Model behavior (does the agent honor the mandate?) gets an **eval** in `evals/` — they are not
interchangeable"*. `sailes-test` for a spec phase's suite.

**Why HIGH.** This map's own repo is the one place both are live, and the framework's maintenance
work happens here. A misroute sends a doctrine change to a unit test that cannot measure it — the
error `AGENTS.md` explicitly warns about.

---

### E2 · `sailes-implement` ↔ `sailes-test` — MEDIUM · class J

**Shared surface, quoted.** implement: *"phase by phase … **with tests**, a review gate"*. test:
*"design and write the test suite for an implemented spec phase"*.

**Ambiguous request.** "dokończ fazę 2 i dopisz do niej testy."

**Doctrine-correct winner.** Both, in order and in *separate contexts* — `sailes-implement` §step 1:
the dev's RED test *"is **scaffolding for the step** … It is **not** the graded suite: that is
authored later by `tester` (`sailes-test`), from the spec, with your implementation unread"*. The
isolation is the point; a single agent doing both destroys it. Neither description says so.

---

### E3 · `sailes-eval-runner` ↔ `agents/checker` — LOW · class L

**Shared surface, quoted.** eval-runner: *"**grade the artifact** against the scenario's own binary
criterion"*. checker: *"Read-only; **grades the artifact**, not the story."* Near-identical phrase.

**Ambiguous request.** "oceń ten artefakt niezależnie."

**Doctrine-correct winner.** `checker` grades a **code diff against a spec**; `sailes-eval-runner`
grades an **eval artifact against a scenario criterion**. Low practical risk (different objects),
listed because the shared phrase would fire a naive n-gram test — it belongs on the allowlist, not
in the findings.

---

## F. Design

### F1 · `sailes-design` ↔ `sailes-discovery` / `sailes-spec` — HIGH · class S

**Shared surface, quoted.** design's trigger list contains bare single words: *"Triggers —
„zaprojektuj UI", „jak ma wyglądać", **„design"**, **„frontend"**, **„interfejs"**"*, plus
*"„premium"*, *„wygląda tanio"*.

**Ambiguous request.** "dodaj frontend do tego API" — a new-scope feature request that contains a
bare design trigger token.

**Doctrine-correct winner.** `AGENTS.md` Task router: *"New scope, not covered by a live spec |
`sailes-discovery`"*. `sailes-design` runs as **Phase 2.5, inside bootstrap** (`skills/README.md`
pipeline; design's own *"entering Step 4.5 of `sailes-bootstrap`"*), or standalone only when *"UI is
about to be built with no design-system/MASTER.md and no ui-spec on disk"*.

**Why HIGH, and class S.** *"frontend"* and *"design"* are among the most common words in any web
request. A single-token trigger with no qualifier is mechanically detectable — a lint rule can list
every trigger phrase shorter than N tokens and require a qualifier.

---

## G. Skill ↔ role — the axis nobody declares

The structural problem behind this whole group: **a skill description answers *which phase*, a role
description answers *who does the work*.** No description on either side states that they are
different axes, so a request that names a phase and a request that names an actor compete for the
same slot.

### G1 · `sailes-test` ↔ `agents/tester` — HIGH · class L (near-verbatim duplicate)

**Shared surface, quoted side by side.**
- skill: *"**Derives expected behavior from the SPEC before reading the implementation, freezes a
  case list with the human, then writes tests that** actually **detect faults instead of mirroring
  the code**."*
- role: *"**Derives expected behavior from the spec BEFORE reading the implementation, freezes a
  case list with the human, then writes** a suite that **detects faults instead of mirroring the
  code**."*

That is one sentence written twice. The longest shared n-gram on the whole map.

**Ambiguous request.** "napisz testy do fazy 2" — invoke the skill, or spawn the role?

**Doctrine-correct winner.** Both, composed: `sailes-test`'s own protocol table names `tester` as the
actor for steps 1, 3, 4, 5; `agent-team-structure.md` names the role's method as *"author the phase's
suite **via `sailes-test`**"*. So: the lead spawns `tester`, and `tester` follows `sailes-test`. A
solo agent invokes the skill.

**Why HIGH.** The duplication is benign in intent and dangerous in effect — it is the exact shape of
the recorded failure: two instruments, one surface, so an eval of either cannot attribute. Compare
`AGENTS.md:18` on the spine literal — *"reworded copies compete for the same slot instead of
reinforcing each other"*. Here the copies are **not** reworded, which is the better of the two
states, but nothing keeps them in sync and no test compares them.

---

### G2 · `sailes-test` ↔ `agents/qa` — MEDIUM · class J

**Shared surface.** test triggers *"przetestuj to"*, *"test this feature"*; qa: *"Drives the real
flow in the running app and proves behavior with screenshots … Final gate."*

**Ambiguous request.** "przetestuj to na żywo" — authoring a suite vs. proving behavior.

**Doctrine-correct winner.** `qa`. The guard exists in the skill body and in **neither** description:
`sailes-test` §When NOT to — *"you are being asked to **run** an existing suite as a gate verdict
(that is `qa`)"*. Write → test/tester; run and prove → qa.

---

### G3 · `sailes-implement` ↔ `agents/be-dev` + `agents/fe-dev` — MEDIUM · class L

**Shared surface, quoted.** implement: *"implement an **approved**, ready **spec**"*. be-dev:
*"Implements exactly the **approved** backend **scope** against the frozen, typed contract."*
fe-dev: the same sentence for UI.

**Ambiguous request.** "zaimplementuj fazę 3."

**Doctrine-correct winner.** `sailes-implement` is the **procedure** (loop, gates, commit-per-step,
progress tracking); the devs are workers *inside* it, and per `agent-team-structure.md` delegation is
the lead's default above a one-file change. Neither description names the other.

---

### G4 · `agents/team-lead` ↔ `sailes-discovery` / `sailes-spec` / `sailes-pre-implement` — HIGH · class L

**Shared surface, quoted.** team-lead: *"Use for any task that is **3+ steps**, spans BE+FE, changes
an API contract, or touches architecture/data-model/auth/tenancy."* discovery: *"asks for a
**non-trivial** change/feature/task"*. spec: *"about to implement a **non-trivial** feature"*.
pre-implement: *"before implementing any **non-trivial** spec"*. Shared literal: **non-trivial** /
the same size threshold, in four descriptions.

**Ambiguous request.** "dodaj moduł raportów sprzedażowych" — 3+ steps, BE+FE, new scope. Every one
of those four descriptions matches.

**Doctrine-correct winner.** They are orthogonal and both fire: `AGENTS.md` Task router decides the
**phase** (*"New scope, not covered by a live spec | `sailes-discovery`"*), `AGENTS.md` §Delegation
decides the **actor** (*"Delegation is the lead's default"*). The correct behavior is
`team-lead` running `sailes-discovery`, not one instead of the other.

**Why HIGH.** This is the only collision where the *right* answer is "both", and where picking one
looks like a successful route. A model that reads `team-lead` and starts decomposing skips the
discovery interview; a model that reads `sailes-discovery` and works solo skips delegation. Both
failures are silent, and there is no eval on this map covering the pair.

---

### G5 · `sailes-design` ↔ `agents/designer` — MEDIUM · class J

**Shared surface, quoted.** skill: *"produce a deliberate design direction and a persisted design
artifact"*. role: *"Produces a **design spec from the project's design tokens** — layout, states,
responsive behavior."*

**Ambiguous request.** "zrób design nowego ekranu listy zamówień."

**Doctrine-correct winner.** Depends on disk state, stated in neither description: no
`design-system/MASTER.md` and no `ui-spec.md` → `sailes-design` (it *creates* the tokens);
artifact present → `designer` (it *consumes* the tokens for one feature). Source: `sailes-design`
§When to use, last bullet; `agent-team-structure.md` role table.

---

### G6 · `sailes-docs` ↔ `agents/docs-author` — LOW · class L

**Shared surface, quoted.** skill: *"generating or updating architecture/workflow/sequence/dataflow/
lifecycle diagrams"*. role: *"Authors and repairs the archify diagram set from repo evidence."*

**Doctrine-correct winner.** Composed, and **declared**: `sailes-docs` §Who does what — *"`docs-author`
(role) authors and repairs the JSON … The lead runs the delta step."* Low severity because the skill
names the role explicitly. Second-best example, after D2, of a collision defused in text.

---

## H. Role ↔ role

### H1 · `agents/explorer` ↔ `agents/researcher` — MEDIUM · class L

**Shared surface, quoted.** explorer: *"Read-only recon agent … returning file:line **findings**"*.
researcher: *"Takes what several **explorers** brought back and turns it into one **findings**
artifact … Verifies load-bearing claims at source itself."*

**Ambiguous delegation.** "sprawdź, co ta biblioteka obsługuje, i zdaj raport" — one external
lookup.

**Doctrine-correct winner.** `explorer` — it *"carries `WebSearch`/`WebFetch` for external
gathering"* (`agent-team-structure.md` role table; note this is **absent** from explorer's own
description, which reads as code-only recon). `researcher` only when several explorer returns need
synthesis with provenance — and it *"Decides nothing and **spawns nothing**"*, so a lead that routes
a single lookup to `researcher` gets an agent with nothing to synthesise and no way to get it.

**Detectable half.** `researcher`'s description names `explorers` as its input, so a machine can
assert the precondition "≥1 explorer ran first" — but only a model can count sources in a request.

---

### H2 · `agents/checker` ↔ `agents/qa` ↔ `agents/tester` — MEDIUM · class L

**Shared surface, quoted.** checker: *"A mandatory **gate**, never a formality."* qa: *"Final
**gate**."* tester: *"The one **gate** role that writes."* Three roles, one word, no stated order.

**Ambiguous request.** "sprawdź, czy to jest gotowe do mergea."

**Doctrine-correct winner.** All three, in order: `tester` → `checker` → `qa` (`sailes-test` §protocol
rows 5–7; `sailes-implement` §Test → Review → Behavior gate). If exactly one is wanted: diff vs spec
→ `checker`; behavior on the live app → `qa`. The ordering appears in two skill bodies and in **no**
role description.

---

## What a deterministic test could check today

Ordered by how much of this map each rule catches, and all runnable against frontmatter alone:

1. **Shared quoted trigger phrase** — parse `Triggers — "…", "…"` lists out of every skill
   description; fail on any phrase appearing in two skills without a disambiguating clause naming
   the other. Catches A1, B1, D2, E1, and the `przetestuj`/`chcę zbudować` families.
2. **Shared proper noun** — capitalized product names (Inngest, Railway, Make, Pipedrive, Postgres)
   appearing in two descriptions. Catches D1 outright.
3. **Bare single-token triggers** — any trigger phrase of one generic word (`design`, `frontend`,
   `interfejs`, `debug`, `logi`, `migration`). Catches F1, and half of C3.
4. **Absolutism + pipeline-owned verb** — `Używaj ZAWSZE` / `Use ALWAYS` in a description that also
   contains a verb the Task router assigns elsewhere (`debugujesz`, `wdrażasz`). Catches C3, C4.
5. **Long shared n-gram between a skill and a role** (≥12 tokens). Catches G1; would need an
   allowlist entry for E3.
6. **Shared size-threshold vocabulary** — `non-trivial`, `3+ steps` — across the skill axis and the
   role axis. Catches G4.
7. **Negative-guard coverage** — for every pair flagged by rules 1–3, assert at least one of the two
   descriptions names the other by skill name. This is the rule `sailes-migrate` and `sailes-docs`
   already pass and everything else fails; it converts the whole map into a single ratchet, in the
   spirit of `skills/README.md` invariant 9.

Rules 1–7 cover **13 of the 25 pairs**. The other 12 (A2-resolution, A5, C1, C2-resolution, E2, G2,
G5, H1-resolution, and the judgment halves of A3, C4, G3, H2) resolve only on a fact about the
request or about repo state, and belong in `evals/` as model-judged scenarios — the distinction
`AGENTS.md` §Verification already draws between a test and an eval.

---

## What I could not establish

1. **Whether any of these 25 has ever actually misrouted in a real session.** Only one is evidenced
   (the diagnose control arm, and that one is skill-vs-hook, not skill-vs-skill). Every other entry
   is a *predicted* collision derived from the text. Severity here is my judgment, not measurement,
   and the first job of the deterministic test is to replace it.
2. **The real routing algorithm.** I do not know how Claude Code scores a request against competing
   skill descriptions — length, specificity, position in the listing, or exact-phrase weighting are
   all plausible and would reorder this map's severities. The `sailes-diagnose` control arm suggests
   long trigger-dense descriptions win, but that is one observation.
3. **Whether trigger language mixing matters.** Nine descriptions are English-first, three are
   Polish-only (`sailes-hosting`, `sailes-migrate`, `sailes-pipedrive`), and the rest mix. Whether a
   Polish request matches an English description as strongly is untested — and it decides whether
   C3/C4 are real or theoretical.
4. **`sailes-docs` is not in this session's loaded skill roster.** 16 of the 17 on-disk skills were
   available; `sailes-docs` was absent. Most likely plugin lag (it is a 1.22.0 addition, and the
   plugin serves `main`), but I did not verify the installed clone, and an unloaded skill cannot
   collide with anything — which would make G6's severity lower still, for a reason unrelated to
   its text.
5. **`skills/README.md` is not a complete doctrine source for this exercise.** Its "The skills"
   table lists 15 of the 17 — **`sailes-test` and `sailes-docs` are missing from it** (`sailes-docs`
   appears only in prose at line 41; `sailes-test` appears nowhere in the file). For any collision
   involving those two — E1, E2, G1, G2, G6 — I had to fall back to the skill bodies and
   `agent-team-structure.md`, because the README offers no ruling. This is itself a finding: the
   file named as a tiebreak authority does not cover the whole roster.

---
name: sailes-async
description: Use when a slow, brittle, or sleep-padded integration flow (often on Make/n8n/Zapier) needs to become a FAST, durable, code-first async backend — a webhook intake + a durable workflow engine that fans out parallel work, retries from the exact failed step, and lands a user-visible result under a hard latency budget. Triggers — "przyspiesz ten proces", "Make jest za wolny", "zejść z Make/n8n na kod", "async pipeline / backend", "durable workflow", "orkiestracja", "kolejka / queue", "webhook backend", "retry z konkretnego kroku", "idempotencja webhooka", "audit log", "fan-out i join", "Slack alert na błąd", "≤5s / budżet czasowy", "Inngest / Temporal / BullMQ", "parallel-compute + async write-back". Runs AFTER a spec exists (or alongside sailes-spec for the pipeline) and BEFORE/around sailes-implement. Turns "a chain of steps that takes minutes" into "a durable engine that lands the critical result in seconds and never double-writes".
---

# Sailes Async — durable async orchestration & latency speed-up

## Overview

**The phase where a slow or fragile sequential integration flow becomes a fast, durable, code-first backend.** You have a process — typically a chain of Make/n8n/Zapier scenarios, or a synchronous request handler — that is too slow (sleeps, sequential API calls, polling) and has no real safety net (a failure loses the run, a replay duplicates a record). This skill turns it into: **a thin webhook intake → a durable event → parallel durable functions coordinated by events**, with a **hard harness** (retry-from-step, idempotency, audit, failure alerts) and a **measured latency budget**.

It separates two kinds of work and treats them differently:
- **🔒 Hard rules** — the harness (idempotency on every external write, audit per step, alert on every failure, HMAC intake, deterministic step bodies). Breaking one loses data, double-charges a customer, or silently swallows a failure. Apply them.
- **🔀 Decisions** — the user owns them: build-vs-stay-on-low-code, which durable engine, self-host vs cloud, what is on the sync critical path vs deferred. You present a **decision card** (options + ✅/⚠️ + recommendation), they choose.

**Core principle:** *The engine is not your code — measure it.* A durable-workflow engine advances layer-by-layer and charges per-step overhead; a clever in-process DAG does **not** override that. Every latency and durability claim is proven by **driving the real system and reading the timeline**, never by a green typecheck or a permissive mock. The full researched rationale lives in the reference files; this skill is the procedure.

This skill is distilled from a real Sailes build — the **SRF async orchestrator** (Volubus/Alubus): 3 chained Make scenarios with 2× 300s sleeps (~5 min of pure latency) reimplemented as an Inngest pipeline that lands **price + AI-qualification in ≤5s**. Every rule here was paid for in a real e2e failure (see `lessons.md`).

## When to Use / When NOT to

**Use when ALL of these hold** (if only some do, you probably don't need a custom engine):
1. A **latency SLA** requires **fanning out independent async work and joining it** — the thing low-code tools "can't cleanly fan-out-and-join".
2. A **hard harness is a first-class requirement**: retry from the **exact failed step**, alert on **every** failure, a **durable audit log** of every action, **idempotency** so a replay never duplicates.
3. There is **removable artificial latency / brittleness** worth deleting (sleeps, sequential chaining, poll-until-appears).
4. The **supervision UI can be the engine's own dashboard** — you don't need to build a UI on day one.
5. Scale is **medium & stable** (dozens–hundreds/day): the justification is *latency + harness quality, not throughput*.

**Do NOT use when:** the flow is genuinely simple and low-volume (keep it in Make/n8n — a durable engine is operational overhead you'll regret); you need step-level retry/replay you don't actually have a requirement for (a plain queue like BullMQ is enough — see `async-compendium.md §engine`); there is no spec/brief yet (run `sailes-discovery`/`sailes-spec` first); the real bottleneck is throughput at massive scale (that's a different problem — Temporal/Kafka territory).

## Where this sits in the pipeline

```
discovery → bootstrap → spec ──(approved)──→ pre-implement (BC + risks)
                                             sailes-database (schema: harness tables)
                                             sailes-async  (engine + speedup + harness)  ← here
                                                          ↓
                                             implement (build the steps phase-by-phase)
```
**DRY boundary:** the spec says *what* the flow must do and its SLA; this skill decides *how* — engine, sync-vs-defer split, harness — and produces the architecture the steps are built against. It leans on `sailes-database` for the harness tables (idempotency / audit / external-object-links) and hands the step bodies to `sailes-implement`.

## Workflow

### Phase 0 — Reverse-engineer & quantify the latency (you can only fix what you measured)

Before designing anything, build the **latency table**: for every step of the current flow, *where* the time goes and *how much*, split into three classes:
1. **Pure artificial delay** — sleeps, poll-guards, "settle" waits. (In the SRF flow: 2× `Sleep 300s` = ~5 min computing nothing.)
2. **Sequential-orchestration waits** — each step waits for the previous + downstream to settle.
3. **Genuine compute** — real API/LLM/DB latency.

🔒 **Blueprints & summaries lie — treat them as leads, not truth.** A Make/n8n blueprint's `{{N.data.X}}` is the *tool's* HTTP envelope, not the API's real response shape; prose summaries under-list written fields and hide router-filter gates. Walk the raw export, and **probe the live endpoint with real credentials** before writing a single schema. (This rule caught 3 of the worst SRF bugs — `lessons.md` L2/L3/L5.)

### Phase 1 — Lock the architecture decisions (cards, not defaults)

Present each 🔀 fork as a Sailes decision card (see `async-compendium.md` for the ✅/⚠️ detail):

| Fork | When it comes up |
|---|---|
| **Build custom vs stay on low-code** | before anything — is the harness+latency need real enough? |
| **Durable engine** (Inngest / Temporal / BullMQ / Trigger.dev) | once the build decision is yes |
| **Self-host vs managed cloud** | keep the cloud fallback explicitly open |
| **Sync critical path vs deferred write-back** | the load-bearing latency decision (Phase 2) |
| **Auth the real caller can actually satisfy** | HMAC only works if the caller can sign |

Decision-card format (from `sailes-discovery`):
```
Decyzja: <one line>
Dlaczego to ważne: <latency / data-loss / lock-in / ops cost>
Opcje:
  A) … — ✅ <concrete pro>  ⚠️ <concrete cost>
  B) … — ✅ …              ⚠️ …
Rekomendacja: <A/B> — bo <reason grounded in THEIR SLA + scale + team>
Twój wybór? (możesz wybrać inaczej niż rekomenduję)
```
The **shape** to recommend by default (the SRF pattern): **thin intake app** (HTTP, e.g. Fastify) that only `verify signature → validate → persist raw → claim idempotency key → emit an event carrying IDs only → 202`, and **durable functions** (the worker) that do all business logic. No business logic in the HTTP layer; the event payload carries only stable IDs, re-resolved against the source of record.

### Phase 2 — Design the speed-up (sync-vs-defer + parallel-compute + async write-back)

This is the heart. Follow the full method in **`speedup-recipe.md`**; the essentials:
- **Delete artificial latency first** (sleeps, poll-guards) — biggest win, zero risk; replace timing-based ordering with real data deps + idempotent writes.
- **Model the work as a dependency DAG, not a chain** — each step declares `dependsOn` its real inputs; this surfaces what is *actually* independent and can fan out. Compute shared inputs (e.g. geocode) **once**, fan out consumers.
- **Decide what MUST be synchronous vs deferred** — the rule: *a slow step may be deferred if its output is not an input to the sync artifact.* The user-visible result (price, deal) is the sync critical path; slow work whose result gates a *later* action (an AI verdict that gates payment) is **async write-back** — it writes back onto the already-created record.
- **Split latency-critical work from slow work into SEPARATE durable functions** on the same trigger, coordinated by an event (fast lane emits → slow lane consumes), with a **single writer** per shared external object.

🔒 **The three async-write-back traps** (all measured, all in `speedup-recipe.md`):
- The engine's **batch barrier**: a durable engine dispatches a parallel step-layer, then re-plans only after the *whole* batch drains — so a fast step waits for a slow sibling **even with no data dependency**. A JS dataflow runner cannot cross this. *Fix: put the slow work in a separate function/run.*
- **`waitForEvent` suspends the function** — `Promise.all([compute, waitForEvent])` will **not** start compute until the event arrives. Run the compute *first*, then wait.
- **Missed-event race** — the consumer's wait must start *before* the producer emits; add a direct durable-read fast-path (read the link table) as belt-and-suspenders.

### Phase 3 — Build the hard harness (🔒 non-negotiable)

Implement every item in **`harness-checklist.md`** — it's the safety net that makes async trustworthy. The load-bearing four (owner's P0 in SRF):
- **Idempotency, two layers:** (a) intake dedupe — an idempotency key from a stable business id, unique-constrained, `23505` → return "duplicate" *before* emitting; deterministic event id = business id so the engine also de-dupes. (b) external-write dedupe — a `businessId → externalId` **link table** read *before* every create, `onConflictDoNothing` + re-select, search-before-create where the vendor has a natural key. This is what makes coarse whole-phase retry safe.
- **Audit per step:** append-only `input/output/status`, no PII/secrets, indexed by business id — written automatically inside the step harness.
- **Alert on every failure:** a Slack webhook naming the **exact failed stage** + a link back to the run; the alerter **never throws**; a **boot-time config guard** errors loudly if the webhook is unset.
- **Retry-from-step:** own it in the engine (memoized steps), size the **retry granularity** deliberately — per-phase, not per-I/O (fine-grained steps cost ~250–600ms engine round-trip *each*; 24 steps = 7–9s of pure overhead that blows a ≤5s budget). Coarse retry **demands** idempotency everywhere.

🔒 **Error-class-aware retry, not count-based:** a *business* no-result (e.g. 404 "no price") is a **typed terminal result — do NOT throw** (no retry, no alert); a *technical* failure (5xx/timeout) **throws** → engine retries → alert on exhaustion; a *deterministic-invalid* input is terminal. Conflating "no result" with "system down" retries forever or alerts on a normal outcome.

### Phase 4 — Wrap integrations as durable-step-friendly adapters

Ports & adapters, one module per external system (detail + template in `async-compendium.md §adapters`):
- **Injectable deps** (`fetch`, creds, `now`) with env fallback → unit-testable with no network.
- **Typed input → call → Zod-validate the wire response → return a narrow domain type**; a typed `Error` subclass carrying `{path,status}`, **never logs secrets**.
- **Deterministic, no hidden state** — no internal `Date.now()`/`Math.random()`; a durable step re-executes on retry and must give the same output. **Determinize whatever can be deterministic** (date math, currency, class tables) — deterministic steps need no retries and can't drift.
- **Idempotent writes** — stable keyed writes (e.g. hashed custom-field keys transcribed *verbatim*, never guessed), correct overwrite verb (PUT), search-before-create.

### Phase 5 — Verify by driving real systems, then deploy

Per the agentic-first principle *show evidence, don't assert* — and because **every serious bug here passed unit tests and was caught only by driving the real endpoint**:
- Write throwaway **probe scripts** (outside `src/`, uncommitted): a live API-shape probe, a **timeline forensic** (reconstruct per-step wall-clock from the audit log, flag gaps >800ms), an e2e that asserts real DB rows + the real external record, a **self-cleaning dry-run** that exercises full logic with fake writes (so no junk CRM records / no real emails fire).
- Required tests (RED first): **idempotency** (same webhook twice → exactly one record), **retry** (a step failure resumes from that step), **alert** (a failure calls the webhook with the right context), and a **measured ≤SLA assertion** on the critical path. Green typecheck ≠ proof.
- **Deploy gate** (self-hosted engine): prod signing/event keys are the right format (hex for Inngest `start`), worker callback host is reachable, migrations reviewed & applied (never auto-run prod), secrets rotated from `.env.example` defaults, Slack webhook **test-fired**. After deploy: send a signed test webhook, watch the run, **replay it and confirm no duplicate**, confirm the read is within budget. Keep the managed-cloud fallback open.

## Red Flags — STOP

- You're treating **"port the Make/n8n blueprint"** as the spec. It lies about response shapes, hides router gates, and encodes dead modules. Probe the live API first.
- You **trust a mock / green typecheck** as proof an external contract works. Every real bug here passed unit tests. Drive the real system.
- You modeled **every business action as its own durable step** — measure the per-step engine overhead against your budget first; coarsen to phases.
- You assume **`Promise.all` or a DAG gives wall-clock concurrency across the engine** — the executor batches a step-layer; isolate slow deferred work into its own function/run.
- **Coarse retry without idempotency everywhere** — a non-idempotent phase double-writes on retry. Link table + PUT, or don't coarsen.
- The harness's **own failure is silent** — the Slack call is best-effort with no boot check, or a swallowed side-effect hides a P0 failure.
- You picked the **engine / self-host / sync-vs-defer split FOR the user** instead of a decision card.
- You shipped **intake auth the real caller can't satisfy** (HMAC only your dev drives can sign) on a PII-handling, record-creating endpoint.
- You claim a latency number you **never measured on the real runtime**.

## Quick Reference

| Phase | Output |
|---|---|
| 0 Quantify | latency table (artificial / sequential / compute); live-probed API shapes |
| 1 Decide | engine + self-host + intake shape chosen via decision cards |
| 2 Speed-up | sync critical path vs deferred write-back; parallel DAG; separate lanes |
| 3 Harness | idempotency (2 layers) + audit + alert + sized retry, error-class-aware |
| 4 Adapters | ports & adapters: injectable, Zod-validated, deterministic, idempotent |
| 5 Verify | probes + RED tests (idempotency/retry/alert/≤SLA) + deploy gate |

**Reference files:**
- `async-compendium.md` — the *why*: engine selection, durable-function anatomy, fan-out/join, two-lane split, adapter pattern, schema decisions.
- `speedup-recipe.md` — the latency-reduction method (9 steps) + sync-vs-defer + the async-write-back traps.
- `harness-checklist.md` — the 15-item hard harness every durable async backend needs before it's trustworthy.
- `lessons.md` — the hard-won gotchas (how not to get burned) + the verify-by-driving probe discipline.

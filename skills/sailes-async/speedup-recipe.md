# Speed-up recipe — cutting latency out of a slow sequential integration flow

The reusable method behind "3 chained Make scenarios with ~5 min of latency → price + AI-qualification in ≤5s". Follow it in order; each step is cheap to skip and expensive to un-skip.

## The 9 steps

**0. Reverse-engineer and quantify every latency source.** Build a table: for each step, *where* the time goes and *how much*, split into (a) pure artificial delay, (b) sequential-orchestration waits, (c) genuine compute. You can only parallelize what you measured. In SRF the table exposed that 2× `Sleep 300s` (~5 min) dwarfed everything else — before any clever async, that was the win.

**1. Delete artificial latency first.** Sleeps, poll-guards, "settle" waits. Replace timing-based ordering with real data dependencies + idempotent writes. Biggest win, zero risk, do it before anything structural.

**2. Model the work as a dependency DAG, not a chain.** Each unit declares `dependsOn` its real data inputs. This *surfaces* which steps are actually independent and can fan out. Keep the graph as **data** (a list of `{name, dependsOn[], run}`) so reordering is an edit, not a rewrite.

**3. Compute shared inputs once, fan out consumers.** In SRF, geocode + distance run **once**; price, AI-qualify, city-resolution and derived-fields all consume that one result concurrently. Don't recompute a shared input per consumer.

**4. Decide what MUST be synchronous vs what can be deferred — the load-bearing decision.**
   - **Sync (critical path):** the primary artifact the UI/next-action reads *immediately* — in SRF, the deal + price.
   - **Deferred (async write-back):** slow work whose result gates a *later* action, not the first view — in SRF, the AI verdict (gates *payment*, which happens after the user sees a price). Plus all notifications/side-effects (email, webhooks, analytics) → best-effort.
   - **The rule:** *a slow step may be deferred if its output is not an input to the sync artifact.* AI-qualify qualifies because it depends on addresses + travel-time, **not** on price or the record id; only its *write* needs the record id.

**5. Make the deferred work write back onto the already-created record.** The sync path creates the record and **emits an event carrying its id**; the deferred lane waits for that event (or reads the link table directly), then does an **idempotent PUT** onto the record. The record briefly exists in a "pre-verdict" state (in SRF, a deal stage), then the verdict lands.

**6. Collapse write amplification.** Fold computed values into the single create write instead of create-then-update — one external round-trip beats two. In SRF the price is folded into the one `create-deal` POST rather than create-deal-then-update-price.

**7. Parallelize independent calls within a slow step; determinize what you can.** The N-LLM pattern: run independent checks concurrently (`Promise.all`), keep only the true aggregator sequential (it consumes the others). Replace LLM calls with deterministic code wherever the output is derivable — SRF replaced 5 of 7 LLM/API hops (currency, vehicle-class, rounding, rules-gate, same-day-return feasibility) with pure functions. Deterministic steps need no retry and can't drift.

**8. Tune the long pole.** After structure, attack the single slowest call. In SRF the qualify model was a reasoning model running ~7.8s/call; `reasoning_effort: "minimal"` cut it to ~1.5s/call for the *same verdict* → qualify ~3.4s. (It also needed `max_completion_tokens`, not `max_tokens`, and no custom `temperature`.) Structure alone would not have hit budget without this.

**9. Verify with a real e2e and measure — don't assume.** The single-function DAG *looked* correct but a real e2e proved a hidden engine barrier (below). Structural latency claims must be measured on the real runtime, via a timeline forensic that reads per-step wall-clock from the audit log.

## Before / after (SRF, illustrative)

```
BEFORE (Make, sequential, ~5 min):
  SRF POST
   └─[1] Booking: OpenAI city → Maps×2 → Pipedrive person+deal → Sleep 2s → webhook → email
        └─[2] Price: GetDeal → OpenAI normalize → geocode×2 → VAT → /calculation → UpdateDeal
              → Sleep 300s ───────────── (5 MINUTES) ───────────── → webhook
                   └─[3] Qualify: Sleep 1s → GetDeal → LLM ×4 (sequential) → UpdateDeal (payment gate)
  (page polls Pipedrive every 5s until the deal appears)

AFTER (durable engine, two parallel lanes off one event):
  SRF POST → 202  (intake: HMAC → Zod → persist raw → claim idempotency key → emit event)
   ├── PRICE LANE (fn `pricing`) ───────────── CRITICAL PATH, ≤5s
   │     load → geocode+distance (once) → rules-gate
   │       → { resolve-cities ‖ derive-fields ‖ upsert-person ‖ price }   (fan-out)
   │       → create-deal  (price folded into ONE create POST, pre-qualify stage)
   │       → { ack-email ‖ airtable ‖ downstream-webhook }  (best-effort)
   │       → emit `deal.created {submissionId, dealId}`          [deal+price ~2.0–2.8s]
   │
   └── QUALIFY LANE (fn `qualify`) ──────────── DEFERRED / async write-back
         load → geocode → rules-gate
           → qualify-compute (LLM checks in parallel, starts ~0.8s)
           ‖ waitForEvent(`deal.created`)  →  update-qualification PUT   [verdict ~3–5s]
```
Measured budget: **price on the deal ~2.3s** (geocode 0.3 + price 1.1 + create 0.9); **fully-qualified deal ~4.2s**.

## The three async-write-back traps (each measured, each cost a redesign)

### Trap A — the engine's batch barrier (the hardest lesson; ADR-004)
A durable-workflow engine (self-hosted Inngest here) **dispatches a parallel step-layer, then re-plans the function to discover the next steps only after the WHOLE batch drains.** So `create-deal` — which depends on `price` *alone* — sat idle waiting for `qualify-compute` (the slow sibling in the same layer) despite having no data dependency on it. Measured: price 401ms and qualify 2803ms ran concurrently, but create-deal started ~200ms *after* qualify finished; price-on-deal was "hostage to qualify latency" (~7s when the LLM took 4.8s).
**A correct in-process JS dataflow runner does NOT fix this** — the executor, not your code, decides when the next layer dispatches.
**Fix:** split latency-critical work and slow work into **separate durable functions/runs** on the same trigger; the slow compute is then in a *different run* and can never share the fast lane's step-layer. Coordinate by event.

### Trap B — `waitForEvent` suspends the function
`Promise.all([step.run(compute), step.waitForEvent(...)])` does **not** run compute concurrently — `waitForEvent` suspends the whole function, so compute starts only when the event lands (measured ~2.7s late, pushing the verdict to ~5.5s).
**Fix:** run the compute **first**, then resolve the cross-run dependency via a **durable read you know is already written** (the external-object link table), keeping `waitForEvent` only as a fallback.

### Trap C — the missed-event race
The deferred lane must start listening *before* the sync lane emits, or it waits forever (or until timeout).
**Fix (belt-and-suspenders):** (1) order it so the consumer's wait begins before the producer emits (in SRF, qualify-compute runs first so the wait starts ~0.8s in, before the ~2.2s emit); **and** (2) a direct fast-path read of the link table in case the record already exists.

## Trade-offs you are accepting (name them for the user)

- **Speculative price + eventual consistency:** the sync artifact is shown before the deferred verdict "approves" it; the payment/next-action gates on the delayed verdict. A user can briefly see a price a later verdict then blocks. Weigh this against the alternative (sequential = no flash, but slower) — SRF actually oscillated between the two before choosing speculative for the ≤5s budget.
- **Duplicated front work across lanes:** the deferred lane re-runs cheap front steps (load/geocode/rules ~0.8s) to stay self-contained and replayable. Accepted, kept off the critical path.
- **Two failure domains + last-writer race:** two lanes writing the same external object need a **single writer** per field and deliberate write ownership (in SRF: price lane owns creation, qualify lane owns the stage move); otherwise last-writer-wins corrupts state.
- **Coarser retry granularity:** collapsing fine steps to phases (to kill per-step engine overhead) means the engine retries a **whole phase** (re-calls the API), not the exact failed I/O. Safe *only* if every phase is idempotent.

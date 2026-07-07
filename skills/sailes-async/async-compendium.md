# Async compendium — the *why* behind durable async orchestration

The researched rationale. `SKILL.md` is the procedure; this is the reference you consult when a decision card needs its ✅/⚠️ detail or you need the anatomy of a durable function. Grounded in the SRF orchestrator build.

## §engine — choosing the durable engine (decision card detail)

The discriminating axis is **step-level retry + replay + a supervision dashboard**, not throughput. What each option gives you:

| Engine | ✅ | ⚠️ |
|---|---|---|
| **Inngest (self-hosted)** | Step-level retry **from the exact failure**; built-in dashboard = the supervision UI for free; fan-out/parallel steps; event idempotency; TS-native, strong types | Needs Postgres **+ Redis** to operate; the executor batches step-layers (see §barrier); dev-vs-prod key handling has footguns |
| **Temporal** | The most powerful durable-execution model | Heavy ops (a cluster); **overkill** at medium scale |
| **BullMQ + Redis** | Simple, well-understood queue | **Job-level, not step-level** retry; poor dashboard; you hand-roll orchestration |
| **Trigger.dev** | Similar durable model, managed | Younger ecosystem |
| **Make / n8n / Zapier** (the incumbent) | Fast to prototype, visual | **Can't cleanly fan-out-and-join** async work; no step-level retry; sleeps pad latency; no real audit/idempotency harness |

**How SRF chose Inngest self-hosted:** single firm, 50–500 bookings/day, owner wanted self-hosted (no AWS), "quality over speed", and an **AI-agent build team → favor explicitness, one convention, strong types**. Inngest's dashboard *is* the supervision UI, so no admin UI was built (a full-stack framework was rejected as "wasted SSR — no UI"). Redis is accepted operational surface, taken *only because* self-hosted Inngest requires it.

**When each is overkill / wrong:**
- Temporal — if you don't need replay + step-granular retry, it's a cluster you'll operate for nothing.
- BullMQ — *enough* if you only need job-level retry and no supervision dashboard; then a durable engine is over-engineering.
- Building anything custom — if the flow is simple, low-volume, and has no hard harness requirement, **stay on Make/n8n**.

🔀 **Self-host vs managed cloud:** self-hosting adds real operational surface (keys, container networking, the extra Redis). **Keep the managed-cloud fallback explicitly open** as a documented ADR trigger ("if self-hosting proves heavy, move to <engine> Cloud") — SRF did.

## §anatomy — what a durable function looks like and why it's retryable

A durable function = `engine.createFunction(config, trigger, handler)`. The unit of durability is **one `step.run(id, fn)`**: the engine **memoizes** a step's return value once it succeeds, so on a later failure + replay, completed steps are **not re-executed** — only the throwing step retries (up to `retries: N`).

The reusable step-harness shape (SRF's `runStep`):
```
deps.step.run(step.name, async () => {
  if (step.skipIf?.(ctx)) { auditSkipped(); return {}; }
  try {
    const result = await step.run(ctx, deps);
    await writeAudit(..., status: "ok");
    return result;
  } catch (err) {
    await writeAudit(..., status: "error");
    await alertSlack({ stage: step.name, error });   // alert never throws
    if (step.bestEffort) return {};                    // side-effects don't fail the run
    throw new Error(`[stage:${step.name}] ${message}`); // tag survives to onFailure
  }
});
```
Key properties this buys:
- **Retry-from-exact-failure** — the throw re-invokes the function; the engine replays memoized steps and re-runs only from the failure.
- **Named failures** — the `[stage:<name>]` prefix lets the function's `onFailure` (fired once after `retries` exhaust) name the exact failed stage in the alert.
- **Best-effort steps** — email/webhook/analytics audit + alert on failure but return `{}` so they never fail the run.
- **Determinism** — inject `now` and all side-effect seams via a `deps` object; **never call `Date.now()`/`Math.random()` inside a step body** or replays diverge. As a bonus, injectable deps make every step unit-testable with in-memory fakes.

## §dag — fan-out / join as data, not control flow

Model the pipeline as a **list of steps**, each `{ name, dependsOn[], skipIf?, bestEffort?, run(ctx,deps) → Partial<ctx> }`, plus one runner. Reordering/adding/dropping a step = editing a `dependsOn` array, not rewriting control flow.

- **Join = immutable context merge:** each step returns *only the keys it produces*; the runner merges every ancestor's output into a node's input ctx. Parallel nodes never race on shared mutable state.
- **No wave barrier in-process:** a node fires the instant *its own* deps resolve, so a fast node doesn't wait for a slow unrelated sibling — *within your process*.
- **Validate the graph up front:** reject duplicate names, unknown deps, and cycles (Kahn sort) — an async scheduler deadlocks silently on a cycle.
- **Two layers of parallelism:** intra-step `Promise.all` (batch independent API calls inside one step) **and** cross-step `dependsOn` fan-out.

## §barrier — the engine barrier your DAG cannot cross (must-read)

The in-process "no wave barrier" above is **correct but does not move wall-clock on the engine.** A self-hosted durable engine **dispatches a parallel step-layer, then re-plans the function to discover the next layer only after the WHOLE batch drains.** So a fast step whose only dependency already finished still waits for the slowest sibling in its topological layer.

Measured in SRF: `create-deal` (depends on `price` alone) started ~200ms *after* the slow `qualify-compute` (2.8s) finished — price-on-deal was "hostage to qualify latency". **A JS dataflow runner cannot fix this** — the executor decides layer dispatch. **The fix is structural: split slow deferred work into a separate function/run.** (Full detail: `speedup-recipe.md` Trap A.)

Related retry-granularity finding: those same per-step engine round-trips cost ~250–600ms **each**; ~24 fine-grained steps measured 14.4s (7–9s pure overhead), blowing the ≤5s budget. Collapse to ~8 coarse phases — which makes idempotency-per-phase mandatory.

## §adapters — wrapping a 3rd-party API for a durable step

Ports & adapters, one module per external system. The canonical shape:
```
type XDeps   = { fetch?, ...creds, baseUrl? }        // injectable, env-fallback via resolveDeps()
type XInput  = { …your domain fields… }               // your shape, not the vendor's
class XError extends Error { path; status }            // typed, carries status, never logs secrets
const wireSchema = z.object({ … })                     // the vendor's real response, validated
async function callX(input, deps?): Promise<XResult> {
  const {…} = resolveDeps(deps)
  // normalize input to the vendor's quirks at the boundary (e.g. date "T" fix)
  const res = await fetch(url, {…})
  if (businessNoResult(res)) return { ok:false, … }    // terminal → typed result, DON'T throw
  if (!res.ok) throw new XError(…, { status })          // technical → throw → engine retries
  const parsed = wireSchema.safeParse(await res.json())
  if (!parsed.success) throw new XError("bad shape", …) // vendor drift → throw
  return narrowDomainResult(parsed.data)                // return only what callers need
}
```
Rules that make an adapter **durable-step-friendly**:
- **Injectable deps** (`fetch`, creds, `now`) with env fallback → testable with no network.
- **Validate the wire response with Zod, return a narrow domain type** — don't leak the vendor's envelope. (A Make blueprint's `{{N.data.X}}` is Make's HTTP *envelope*, not the API's shape — probe the live API and validate against *that*.)
- **Deterministic, no hidden state** — no internal clock/random; **determinize whatever can be** (date math, currency, class tables): deterministic steps need no retry and can't drift. SRF replaced 5 of 7 LLM/API hops this way.
- **Classify failures in the return type** — business no-result = typed terminal (no throw); technical = throw (retry); this keeps the engine from retrying a permanent outcome forever.

### Idempotent writes at the step level (not the adapter)
- **Link table** `businessId → externalId`, read *before* every create; `onConflictDoNothing` + re-select.
- **Search-before-create** where the vendor has a natural key (e.g. person by email).
- **Stable keyed writes** — e.g. hashed custom-field keys transcribed **verbatim** from the source (writing a mistyped key corrupts data invisibly; test the keys, and *omit* any you can't verify rather than guess).
- **Correct overwrite verb** — verify it live (SRF: Pipedrive v1 deal update is PUT; PATCH/POST 404).

## §events — typed events across the async boundary

Event names as a const map; **each event's payload has its own Zod schema + inferred type**; the payload carries **only stable IDs** (e.g. `{submissionId, dealId}`), never whole objects. Why this matters for durability: a durable pipeline persists and replays events across restarts, retries, and independent lanes that may run minutes apart on different workers. A typed, minimal, id-only payload means a replayed/out-of-order event validates identically every time, the schema is the contract two independently-deployed functions agree on, and IDs re-resolve against the source of record instead of shipping a stale snapshot.

## §schema — the harness tables (hand to sailes-database)

The tables the harness needs (design & migrate them via `sailes-database`):
- `webhook_events` — append-only raw intake (`raw_payload jsonb`, `signature_valid`, `status`).
- `idempotency_keys` — unique on `key`; the intake dedupe.
- `external_object_links` — unique on `(business_id, system, external_type)`; the external-write dedupe.
- `audit_logs` — per-step `input/output/status` (`actor_type`, `metadata jsonb`), indexed by business id + time.
- the business read model (e.g. `bookings`) with **orthogonal status enums** per lifecycle, each indexed.

Full schema-decision rationale (PK by exposure, enums vs lookup, jsonb usage, soft-delete) lives in `sailes-database/db-compendium.md` — don't restate it; this skill only names *which* tables the harness requires.

# Lessons — how not to get burned (paid for in real e2e failures)

Every lesson below was caught **only by driving a real system** — unit tests and typecheck were green while the bug shipped. That is the meta-lesson: **a mock that returns success for any input proves nothing about an external contract; a green typecheck is not proof.** From the SRF orchestrator's `.ai/lessons.md`, reviews, and runs.

## The gotchas catalog

**L1 — Windows ESM entry-point check silently exits.** `import.meta.url === \`file://${process.argv[1]}\`` never matches on Windows → `main()` never runs, the server exits 0 and never listens. Unit tests + typecheck did **not** catch it; only driving the real server did. → Use `pathToFileURL(process.argv[1]).href`; verify by driving, not by tests.

**L2 — Reverse-engineered summaries miss router-filter GATES.** A prose summary mentioned a "≥5 pax" filter only parenthetically; the first `rulesQualify` gated on country only and would have qualified small bookings the source rejects. → Treat prose summaries as **leads, not ground truth**; walk the raw blueprint JSON and diff every written field + every router filter before claiming parity.

**L3 — A low-code blueprint's `{{N.data.X}}` is the tool's HTTP envelope, not the API's shape.** They copied `{data:{vat}}` into Zod schemas; the live API returns **flat** objects, so the schema rejected every real response. Unit tests passed because they mocked the wrong shape. → **Never trust a blueprint for an external API's response shape — probe the live endpoint (curl with real creds) before writing the Zod schema.** (Also: some APIs need ISO `T` datetime; a space → HTTP 400. Normalize at the adapter boundary.)

**L4 — Self-hosted engine dev-vs-prod key handling.** `inngest start` with a non-hex signing key crashes ("must be hex") → nothing on :8288 → `send()` fails ECONNREFUSED → intake 500s. → Locally use `inngest dev --no-discovery -p 8288` (no keys, SDK connects via `INNGEST_DEV=1`); prod uses `inngest start` with **hex** `INNGEST_SIGNING_KEY` + `INNGEST_EVENT_KEY` + Postgres/Redis URIs. Generalizes to any self-hosted engine: the local and prod boot modes differ, and the difference is a silent-failure footgun.

**L5 — Verify the HTTP verb against the live API.** `updateDeal` used PATCH → live Pipedrive returns `404 "Unknown method"`; every deal update silently failed the stage. The fake `fetch` returned success for any method and the test *asserted PATCH* (encoding the bug). → Probe the verb; don't trust a permissive mock. (Live: PATCH 404 · PUT 200 · POST 404.)

**L6 — Container callback host wiring.** A containerized engine derives the worker's serve URL from the incoming request host and got `localhost` = the container itself → "couldn't find application", events ingest but never run. A home-grown `INNGEST_SERVE_ORIGIN` var was a decoy — the SDK ignores it. → Set the SDK's own `INNGEST_SERVE_HOST`/`INNGEST_SERVE_PATH` (`host.docker.internal` in Docker), re-register, and confirm the app shows `connected: true`.

**L7 — `waitForEvent` suspends the function.** `Promise.all([step.run(compute), step.waitForEvent(...)])` did not run compute concurrently — compute started only when the event landed (~2.7s late). → Run compute **first**, then resolve cross-run dependencies via a **durable read you know is already written** (the link table), keeping `waitForEvent` as a fallback. (Also in `speedup-recipe.md` Trap B.)

**L8 — The engine batches a parallel step-layer; a downstream step waits for the WHOLE batch.** `create-deal` (dependent on `price` alone) started ~200ms *after* the slow `qualify-compute` finished, with no data dependency — because the engine re-plans the next layer only after the current batch drains. A JS dataflow runner cannot cross this. → To decouple a fast step from a slow peer in wall-clock, **split into separate functions/runs** (independent executor timelines). This is the single biggest architectural lesson — it drove the two-lane split. (Also in `speedup-recipe.md` Trap A + `async-compendium.md §barrier`.)

**L9 — Config footguns hide behind fakes.** A `PIPEDRIVE_COMPANY_DOMAIN` set to a full URL produced `new URL("https://https://…")` → `ENOTFOUND https`. The dry-run faked Pipedrive so it stayed hidden until the real e2e. → Harden adapters against config shape (strip scheme), and run at least one e2e against the real dependency.

**L10 — Fine-grained steps blow the latency budget.** ~24 per-action durable steps measured 14.4s, ~7–9s of it pure per-step engine round-trip overhead (~250–600ms each). → Coarsen to ~8 phase-level steps; retry granularity is a **latency trade**, and coarse retry demands idempotency on every phase.

## Business-wrongness (audit the reimplementation, not just the parity)

The 2026-07-06 business-flow audit's stated goal: *"find where our reimplementation is business-wrong, not just where it deviates from Make."* It found three bugs that parity-thinking missed:
1. **Transient failures made permanently terminal** — a caught Volubus error was turned into a terminal state with zero retries. → Retry policy must be **error-class-aware** (business no-result terminal; technical failure retried), **not count-based**.
2. **A stage race** could land a not-qualified deal on a "Contact Supplier" stage (two lanes writing the same object, last-writer-wins). → **Single writer** per field; deliberate write ownership.
3. **Silent side-effect failures** — ack-email + Slack failures were swallowed, violating the P0 "alert on every failure". → The harness's *own* delivery failures must be observable (boot-time config guard + never-throw-but-do-log alerter).

**LLM-specific:** verbatim-porting a low-code prompt over-rejected valid inputs on *every* model — the root cause was the **prompt, not the model** (proven by a model sweep). LLM latency is highly variable (3–18s), threatening a tight budget. → An LLM ported 1:1 is not "done"; it needs a labelled eval, a determinization pass for what doesn't need AI, and a latency/`reasoning_effort` tune.

## The verify-by-driving discipline (why the probe scripts exist)

The SRF worker carried ~30 **throwaway probe scripts** outside `src/` (uncommitted, each with a copy-paste run line) — the physical embodiment of "evidence over assertion". Categories worth reproducing on any durable-async build:
- **Live API-shape probes** — hit the real external API, bypass your own validation, to distinguish a business no-result (e.g. 404) from a technical failure. (One SRF probe defined the whole 3-path price error model.)
- **Timeline forensics** — reconstruct per-step wall-clock from the audit log, flag any gap >800ms. This is the tool that exposed both the per-step overhead (L10) and the batch barrier (L8).
- **E2E result verification** — assert real DB rows **and** the real external record after a drive.
- **Self-cleaning dry-runs** — exercise full business logic against real read-side dependencies with **fake writes**, so no junk CRM records are created and no real emails/webhooks/supplier-sendouts fire. (Safety-critical: in SRF, reaching a certain deal stage triggers a real supplier sendout, so real tests use a skip-write flag.)
- **Parameter sweeps** — geocode a real sample once, sweep algorithm variants in-memory against ground truth, and **decide on measurement / defer on ROI** (a city-matching idea was killed by a sweep showing 0.4–1.7% ROI).

A probe answers one empirical question against production-real dependencies, prints an observation that becomes a *verified fact*, then is discarded. It is the operational counterpart to "mocks prove nothing about external contracts."

## The methodology that made it work (worth carrying to every build)

- **Verify-by-driving over green checkmarks** — "Behavior before diff: drive the real flow (send a webhook → watch the run → assert DB rows) and show output."
- **Evidence-gated memory** — record facts only with evidence attached; log each lesson as Context / Problem / Rule / Applies-to.
- **Decisions as ADRs with a *measured* reason** — the two-lane split and retry granularity are ADRs backed by timings, not guesses.
- **Audit business-wrongness, not just deviation** — parity with the old flow is a starting hypothesis; correctness against the *business* is the bar.

# Arm A — explorer 2 — external-tool mentions in `skills/sailes-test/`, `skills/sailes-design/`, `skills/sailes-async/`

Read-only recon. Facts only, no dedup, no ranking, no conclusions.

Slice files read (17):

- `skills/sailes-test/SKILL.md`, `skills/sailes-test/test-plan-template.md`,
  `skills/sailes-test/references/browser-e2e.md`, `skills/sailes-test/references/external-systems.md`,
  `skills/sailes-test/references/techniques.md`
- `skills/sailes-design/SKILL.md`, `skills/sailes-design/browser-inspect.md`,
  `skills/sailes-design/design-judgment.md`, `skills/sailes-design/premium-craft.md`,
  `skills/sailes-design/premium-ux.md`, `skills/sailes-design/ux-rules.md`,
  `skills/sailes-design/assets/premium-tokens-starter.css`
- `skills/sailes-async/SKILL.md`, `skills/sailes-async/async-compendium.md`,
  `skills/sailes-async/harness-checklist.md`, `skills/sailes-async/lessons.md`,
  `skills/sailes-async/speedup-recipe.md`

`skills/sailes-design/design-judgment.md` was read in full and contains **no named external tool**
(it names generic acts — "take screenshots if the environment supports it" — and CSS concepts only).

---

## 1. `skills/sailes-test/`

### 1.1 `skills/sailes-test/SKILL.md`

| Tool | Verbatim quote | Version / "if absent" stated there |
|---|---|---|
| **Stryker** | "\| **A — critical** \| money · auth / permissions / tenancy · idempotency · irreversible outbound write (CRM, email, Slack, payment) \| **Stryker** on the touched files; every surviving mutant killed or explained in writing \|" | none |
| **Stryker** (2nd) | "\| Prove \| tier A Stryker · tier B per-B-ID break → red → revert → green · tier C green suite \|" | none |
| **Playwright / Chromium** | "Every UI-visible behavior is exercised in a real browser (Playwright/Chromium), clicked as a user would." | none |
| **Evosuite** | "The same work finds LLM-generated oracles have **higher** fault-detection potential than Evosuite's — so the problem is not capability, it is **where the expected value came from**." | none (named as comparison baseline in cited research) |
| **Slack / CRM / email / payment** (named external write targets) | "money · auth / permissions / tenancy · idempotency · irreversible outbound write (CRM, email, Slack, payment)" | none |
| **(test infrastructure, unnamed)** — "if absent" behaviour | "If the repo has no test infrastructure at all — no runner, no fixtures, no seed path — report **`ENV-DEFECT`** with a concrete setup proposal for the human to approve. Do not stand it up yourself: runner, fixture strategy and seed path are stack decisions, and those belong to the human." | explicit absent-behaviour: report `ENV-DEFECT`, do not self-install |

### 1.2 `skills/sailes-test/references/browser-e2e.md`

| Tool | Verbatim quote | Version / "if absent" stated there |
|---|---|---|
| **Playwright / Chromium** | "Every UI-visible behavior is proven in a real browser (Playwright/Chromium), driven as a user would drive it." | none |
| **Playwright** (locators) | "Wait for a condition — Playwright's auto-waiting locators and `expect(locator).toHaveText(...)` retry until a timeout." | none |
| **Playwright** (reference link) | "Reference: [Playwright](https://playwright.dev/docs/best-practices)" | none |
| **`chrome-devtools` MCP server** | "The `chrome-devtools` MCP server (`../../sailes-design/browser-inspect.md`) can click, fill, read the console and evaluate scripts in a live page. It is a **diagnostic and measurement** instrument, and it produces **no assertion, no file, and nothing that runs again tomorrow**." | no version; no absence clause here (absence clause lives in `browser-inspect.md`) |
| **CDP** (Chrome DevTools Protocol) | "If you have just proven a behavior by clicking through CDP and written no test, the ratchet went backwards — the next change is free to break it silently, and nothing will say so." | none |

### 1.3 `skills/sailes-test/references/external-systems.md`

| Tool | Verbatim quote | Version / "if absent" stated there |
|---|---|---|
| **Pipedrive, Make/n8n, Slack, a payment provider, an LLM API** | "Pipedrive, Make/n8n, Slack, a payment provider and an LLM API do not carry the same cost of being wrong. One blanket policy is therefore wrong for at least one of them." | none |
| **MSW** | "\| **Mock / MSW** \| fast, hermetic, no credentials \| drifts from the real API **silently** — the classic false green \|" | none |
| **MSW** (reference link) | "[MSW](https://mswjs.io/docs/comparison/)" | none |
| **Pact** | "Pact's model has the consumer's test generate a contract and the **provider replay it** against the real implementation ([docs](https://docs.pact.io/)). Pipedrive will not run your provider verification. Neither will Slack or Stripe." | explicit non-applicability: "Do not plan for it." |
| **Zod / JSON-Schema** | "Every cassette and every sandbox response is validated against a Zod/JSON-Schema shape, so *shape drift fails even when your assertion would not*." | none |
| **OpenAPI** | "**Compare against the vendor's published OpenAPI spec** where one exists." | conditional: "where one exists" |
| **Testcontainers / Postgres / SQLite / Redis** | "**Real infrastructure, not in-memory substitutes.** Postgres via Testcontainers, not SQLite; real Redis, not a map. In-memory replacements do not implement the features you actually use, so code passes locally and fails in production ([Testcontainers](https://testcontainers.com/guides/introducing-testcontainers/))." | none |
| **Testcontainers** (scope limit) | "The line is sharp: Testcontainers solves infrastructure *you deploy*. There is no Pipedrive container." | explicit limit |
| **sandbox account / credentials** | "**Credentials come from the human.** An agent cannot create a sandbox account. If a behavior needs one and it is absent, it goes on the plan's `🔑` list and the behavior is **UNVERIFIED** — never mocked and reported as covered." | explicit absent-behaviour: `🔑` list + UNVERIFIED |
| **Pipedrive** (fake ownership) | "**You are not the API owner.** Nobody at Pipedrive maintains your fake, and nobody tells you when the field you stubbed became nullable." | none |
| **Pipedrive / Slack** (recorded-choice example) | "🔀 Pipedrive → cassette recorded 2026-07-20 — real payloads, but a field type change will not fail this suite until re-record. Real-contract check: nightly canary B12.\n   🔀 Slack     → mock — low cost of being wrong, message shape is not our contract." | dated cassette: `2026-07-20` |
| **SWE at Google (ch. 13) / Mocks Aren't Stubs / Pact / MSW / Testcontainers** (reference block) | "References: [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html) · [SWE at Google ch. 13](https://abseil.io/resources/swe-book/html/ch13.html) · [Pact](https://docs.pact.io/) · [MSW](https://mswjs.io/docs/comparison/) · [Testcontainers](https://testcontainers.com/guides/introducing-testcontainers/)" | none |

### 1.4 `skills/sailes-test/references/techniques.md`

| Tool | Verbatim quote | Version / "if absent" stated there |
|---|---|---|
| **fast-check** | "Sources: [fast-check](https://fast-check.dev/) · [Hypothesis](https://hypothesis.readthedocs.io/) · [QuickCheck at Ericsson (Hughes)](https://www.cs.tufts.edu/~nr/cs257/archive/john-hughes/quviq-testing.pdf)" | none |
| **Hypothesis** | (same quote as above) | none |
| **QuickCheck** | "The best-documented payoff: QuickCheck found 200+ bugs in Ericsson's Erlang telecom systems that example-based tests had missed." | none |
| **OWASP Fuzzing / OSS-Fuzz** | "Sources: [OWASP — Fuzzing](https://owasp.org/www-community/Fuzzing) · [OSS-Fuzz](https://google.github.io/oss-fuzz/)" | none |
| **Stryker** | "Sources: [Stryker — mutant states and metrics](https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/) · [MuTAP / LLM oracle strength, arXiv 2405.03786](https://arxiv.org/abs/2405.03786)" | none |
| **MuTAP** | "Feeding surviving mutants back to the model measurably improves generated tests — MuTAP reports a 93.57% mutation score and 28% more real-world bugs detected than the baseline." | none |
| **Temporal** | "For durable engines: every step must be independently retryable, and the test proves it by forcing failure at each step boundary and re-running. Temporal additionally replays recorded histories in CI and fails on non-determinism — which catches *deployment* breakage that no ordinary test sees." | none |
| **Temporal / Inngest / Hookdeck** (source links) | "Sources: [webhook idempotency](https://hookdeck.com/webhooks/guides/implement-webhook-idempotency) · [Temporal replay testing](https://docs.temporal.io/develop/typescript/testing-suite) · [Inngest testing](https://www.inngest.com/docs/reference/testing)" | none |
| **Go `testing/synctest`** | "[Go's testing/synctest — deterministic concurrent time](https://go.dev/blog/synctest)" | none |
| **Stryker** (implicit, via tier table cross-ref) | "Operational rule: **chase surviving mutants on critical modules, not the aggregate score.** That is exactly what the tier table in `SKILL.md` encodes." | none |

### 1.5 `skills/sailes-test/test-plan-template.md`

| Tool | Verbatim quote | Version / "if absent" stated there |
|---|---|---|
| **Stryker** | "> Tier A instead records Stryker output: surviving mutants killed, or each one explained here." | none |

---

## 2. `skills/sailes-design/`

### 2.1 `skills/sailes-design/SKILL.md`

| Tool | Verbatim quote | Version / "if absent" stated there |
|---|---|---|
| **Tailwind / shadcn** | "**Persist** the artifact (MASTER.md or ui-spec.md), tuned to the locked stack (Tailwind/shadcn → token names map to that)." | none |
| **shadcn** (retune) | "Retune shadcn defaults; don't ship them stock." | none |
| **ui-ux-pro-max** (skill/CLI) + **python3** | "If the `ui-ux-pro-max` skill/CLI is installed, you may seed the direction with its reasoning engine (67 styles, 161 palettes, 57 font pairings, product-type rules): `python3 .../ui-ux-pro-max/scripts/search.py \"<product> <industry> <keywords>\" --design-system -p \"<Project>\"`" | conditional on "is installed"; "Treat its output as **input to your judgment**, not the final answer" |
| **Playwright** | "Build a visualization of what you're designing — a Playwright screenshot of the rendered component/page (or the prototype's own render) — and LOOK at the actual pixels." | none |
| **`chrome-devtools` MCP server** + **`lighthouse_audit`** | "**Measure the six, don't eyeball them (optional instrument).** If the `chrome-devtools` MCP server is installed, run the probe in `browser-inspect.md` §1 instead of judging the screenshot: it returns the six checks as data — the offending elements by selector, at each target width — plus `lighthouse_audit` for the `ux-rules.md` contrast/focus requirements (§2)." | conditional on "is installed" |
| **`chrome-devtools` MCP** — absent behaviour | "**Not installed → keep step 1's screenshot as the fallback and record `SKIP browser-inspect (chrome-devtools MCP absent)`** in the run log. Never report an unmeasured gate as passed; an explicit SKIP is the honest output." | explicit absent-behaviour: screenshot fallback + `SKIP browser-inspect (chrome-devtools MCP absent)` |
| **`chrome-devtools` MCP** — absent behaviour (Common Mistakes row) | "\| Instrument absent, so the gate is quietly reported as passed \| Screenshot fallback **plus** an explicit `SKIP browser-inspect` line. Silence is the failure, not the SKIP. \|" | explicit absent-behaviour |
| **Figma** | "Open the prototype (HTML/Figma export/screenshot) and look at the actual pixels — open prototype HTML in a headless browser and screenshot it." | none |
| **headless browser** (unnamed) | (same quote as above) | none |
| **Preline / Figma kit / Astryx** | "`../sailes-bootstrap/ui-libraries.md` (UX-layer options as design-phase inputs — Preline blocks + free Figma kit, Astryx CSS-variable themes)" | none |
| **`browser-inspect.md` instrument** (Quick Reference row) | "\| **Render + integrity gate** \| **screenshot the result; nothing clipped/overflowing/invisible/overlapping/non-responsive — measured via `browser-inspect.md` §1 when available, else screenshot + explicit SKIP** \|" | explicit absent-behaviour: "when available, else screenshot + explicit SKIP" |
| **shadcn** (stock-defaults mistake row) | "\| Shipping stock shadcn defaults \| The default look is itself a tell. Retune palette/radius/shadow/ring so it doesn't read as stock — `assets/premium-tokens-starter.css` does the mapping. \|" | none |
| **oklch** (CSS color function, via starter) | "\| Re-deriving oklch ramps/elevation/type scale from prose each project \| Start from `assets/premium-tokens-starter.css` (two hue knobs), adapt to the artifact. \|" | none |
| **shadcn** (Red Flags) | "Pure `#000`/`#fff` anywhere, untinted grey cards, a single-layer black shadow on everything, or stock un-retuned shadcn." | none |

### 2.2 `skills/sailes-design/browser-inspect.md`

| Tool | Verbatim quote | Version / "if absent" stated there |
|---|---|---|
| **Chrome DevTools (over CDP)** | "\"Categorical checks — pass/fail, not opinion\" is the wording in the gate itself. A model looking at a PNG is neither categorical nor pass/fail; it is an impression with a confident tone, which is the one output this framework exists to distrust. Chrome DevTools over CDP measures all three directly." | none |
| **Playwright** | "Any behavior that must not regress ends as a **Playwright test in the suite** (`sailes-test` → `references/browser-e2e.md`)." | none |
| **`chrome-devtools` MCP server** (install command) + **npx** | "Machine prerequisite — an MCP server, installed once per machine:\n```bash\nclaude mcp add chrome-devtools --scope user -- npx -y chrome-devtools-mcp@latest\n```" | version pin: `chrome-devtools-mcp@latest` |
| **Chrome Stable / `@puppeteer/browsers`** | "# No Chrome Stable on the machine? Point it at a dedicated browser instead of installing one:\n#   npx -y @puppeteer/browsers install chrome@stable --path ~/.cache/puppeteer\n#   ...then add --executablePath \"<printed path>\" to the args above." | version pin: `chrome@stable`; explicit absent-behaviour for Chrome Stable |
| **`.mcp.json` / bootstrap Q21** | "Per-project opt-in is a `.mcp.json` decision card in bootstrap (Q21) — committed to the repo, so every agent and developer on that project gets the same instrument, and no machine is mutated behind anyone's back." | none |
| **`chrome-devtools` MCP** — absent behaviour | "**If it is not installed:** fall back to the screenshot render (`SKILL.md` §Render and self-verify, step 1) and record `SKIP browser-inspect (chrome-devtools MCP absent)` in the artifact — the run log, the incident record, or the qa verdict. An unmeasured gate reported as passed is the failure; an explicit SKIP is not." | explicit absent-behaviour |
| **`mcp__chrome-devtools__*` tool list** | "Tools referenced below, all `mcp__chrome-devtools__*`: `navigate_page`, `resize_page`, `emulate`, `evaluate_script`, `take_snapshot`, `take_screenshot`, `list_console_messages`, `list_network_requests`, `get_network_request`, `lighthouse_audit`, `performance_start_trace`, `click`, `fill`, `fill_form`, `wait_for`." | none |
| **Node** (`node` runner) | "**Verified against fixtures that live in the repo** — `evals/fixtures/browser-probe/`, run with `node evals/fixtures/browser-probe/run-probe.mjs`." | none |
| **Chromium / Edge** | "Last run 2026-07-25 (Chromium 150 / Edge 150.0.4078.96, headless, 1254×690), both cases passing" | versions: Chromium 150, Edge 150.0.4078.96 |
| **`lighthouse_audit`** | "```\nlighthouse_audit({ mode: 'navigation', device: 'desktop' })\n```" | none |
| **axe-core** | "The accessibility category is axe-core: it returns the failing contrast pairs with their elements and computed ratios, which is precisely what `ux-rules.md:7` asks you to \"verify\"." | none |
| **`emulate` (dark mode)** | "```\nemulate({ colorScheme: 'dark' })   →   lighthouse_audit(...)   →   emulate({ colorScheme: 'light' })\n```" | none |
| **`take_snapshot` / `press_key`** | "**Focus and keyboard** (`ux-rules.md:66`): drive `press_key('Tab')` and re-snapshot to see where focus actually lands and whether the ring is on a real control — a screenshot cannot show tab order." | none |
| **`performance_start_trace`** | "```\nperformance_start_trace({ reload: true, autoStop: true })\n```" | none |
| **`emulate` (throttling)** | "```\nemulate({ cpuThrottlingRate: 4, networkConditions: 'Fast 4G' })\n```" | none |
| **dev server** (validity caveat) | "A dev server serves unminified bundles through HMR with no CDN and no production cache headers. Its LCP is not the product's LCP." | none |
| **Playwright** (context limitation) | "`diagnosis-loop.md` §1 notes that a Playwright context starting fresh *cannot* reproduce a stale-`localStorage` bug — you must pre-seed the state to see it at all." | none |
| **`--browserUrl` attach** | "This server does not start fresh: its default profile persists across calls, and `--browserUrl http://127.0.0.1:9222` attaches to an already-running browser with the real session in it." | port `9222` |
| **`handle_dialog`** | "**Never trigger a browser dialog.** `alert`/`confirm`/`prompt` block the CDP channel and the session stops responding. Use `handle_dialog` when one is unavoidable, and prefer `console.log` + `list_console_messages` over any dialog-based probe." | none |
| **chrome-devtools-mcp / Chrome DevTools Protocol** (reference block) | "Reference: [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) · [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)" | none |
| **version-history note (1.14.0 / 1.14.1)** | "1.14.0 shipped this probe verified against the defect page only … Fixed in 1.14.1: `checkVisibility()`, horizontal-only off-canvas, `text-overflow: ellipsis` excluded, zero-size controls excluded." | repo versions 1.14.0 / 1.14.1 |

### 2.3 `skills/sailes-design/design-judgment.md`

No named external tool. (Nearest mentions are generic: "take screenshots if the environment supports it (a picture is worth 1000 tokens)"; "Watch CSS specificity".)

### 2.4 `skills/sailes-design/premium-craft.md`

| Tool | Verbatim quote | Version / "if absent" stated there |
|---|---|---|
| **Tailwind v4 / shadcn/ui / React 19** | "This layer is **stack-specific to the Sailes baseline**: Tailwind v4 (CSS-first, `oklch()` tokens) + shadcn/ui + React 19. Concrete moves below assume that stack." | versions: Tailwind **v4**, React **19** |
| **Linear, Stripe Dashboard, Vercel, Raycast, Height, Arc** (calibration reference apps) | "Default calibration set for B2B web: **Linear, Stripe Dashboard, Vercel, Raycast, Height, Arc.**" | none |
| **Tailwind v4 / oklch** | "Premium moves (Tailwind v4 / oklch):" | version: v4 |
| **Stripe / Linear** (card feel) | "An inner top highlight (`inset 0 1px 0` in a lighter tint) on raised cards simulates a lit edge — the Stripe/Linear card feel." | none |
| **shadcn/ui** (beyond stock) | "shadcn/ui is the baseline component layer, and **untouched shadcn defaults are recognizable** — reviewers have seen a thousand apps with the exact stock button, card, and `zinc` palette." | none |
| **shadcn** (goal) | "The goal: someone who knows shadcn by heart shouldn't be able to tell you used it." | none |
| **Lucide** | "**Icon discipline**: one family (Lucide with shadcn), one stroke width, aligned to the optical grid — never mixed sets, never emoji (`ux-rules.md`)." | none |
| **shadcn** (checklist item) | "- [ ] shadcn defaults retuned (palette/radius/shadow/ring) — doesn't read as stock" | none |
| **Linear/Stripe/Vercel** (checklist item) | "- [ ] Held side-by-side against a reference (Linear/Stripe/Vercel/…), it belongs on the shelf" | none |

### 2.5 `skills/sailes-design/premium-ux.md`

| Tool | Verbatim quote | Version / "if absent" stated there |
|---|---|---|
| **Linear, Raycast, Superhuman** (reference apps) | "Linear, Raycast, and Superhuman earn \"premium\" mostly *here*: speed, keyboard, forgiveness." | none |
| **TanStack Start / React Query / shadcn** | "Scope: B2B web on the Sailes baseline (TanStack Start + React Query + shadcn)." | none |
| **React Query** | "Write the change to the UI immediately, sync in the background, roll back with an explanatory error if it fails (React Query `onMutate`/`onError`)." | none |
| **TanStack Router** | "Prefetch route data on link hover/focus (TanStack Router `preload: 'intent'`)." | none |
| **React Query** (staleTime) | "Sensible React Query `staleTime` so back-navigation renders instantly from cache and revalidates quietly — never a blank refetch of a page the user just saw." | none |
| **`chrome-devtools` MCP** + `performance_start_trace` / `emulate` | "**Measuring the budget instead of intending it (optional).** With the `chrome-devtools` MCP available, `performance_start_trace` returns LCP/INP/CLS and `emulate({cpuThrottlingRate:4, networkConditions:'Fast 4G'})` puts the interaction under a realistic load — see `browser-inspect.md` §3." | conditional: "(optional)", "With the `chrome-devtools` MCP available"; hard caveat: "a dev server's numbers are valid only as a relative signal" |
| **shadcn `<Command>`** | "**Command palette (⌘K)** for apps with >5 destinations or frequent actions: navigate, act, and search from one field (shadcn `<Command>`)." | none |

### 2.6 `skills/sailes-design/ux-rules.md`

| Tool | Verbatim quote | Version / "if absent" stated there |
|---|---|---|
| **Next.js / React / Tailwind / shadcn** | "Condensed from a large UI/UX rule base, filtered for **B2B web apps** (Next.js / React / Tailwind / shadcn)." | none |
| **`lighthouse_audit` / `chrome-devtools` MCP** | "Verify foreground/background pairs — with `lighthouse_audit` (accessibility) if the `chrome-devtools` MCP is available, which names the failing pairs and their computed ratios; see `browser-inspect.md` §2. Eyeballing a palette is not verification." | conditional: "if the `chrome-devtools` MCP is available" |
| **`emulate` (dark-mode audit)** | "test its contrast separately — `emulate({colorScheme:'dark'})` then re-run the audit (`browser-inspect.md` §2), rather than assuming the light-mode pass carries over." | none |
| **Lucide / Heroicons** | "**No emoji as structural icons** — use an SVG set (Lucide/Heroicons), consistent stroke width + size tokens; one icon family." | none |
| **WebP / AVIF** | "Images: WebP/AVIF, declare width/height (or aspect-ratio) to avoid layout shift (CLS), lazy-load below the fold." | none |
| **measurement-or-SKIP** (checklist) | "- [ ] Contrast ≥4.5:1; focus visible; keyboard nav works; reduced-motion respected — ticked from a measurement (audit + `press_key('Tab')` re-snapshot per `browser-inspect.md` §2), or from an explicit SKIP. A tick with neither behind it is the failure this checklist exists to prevent." | explicit absent-behaviour: explicit SKIP |

### 2.7 `skills/sailes-design/assets/premium-tokens-starter.css`

| Tool | Verbatim quote | Version / "if absent" stated there |
|---|---|---|
| **Tailwind v4 (`@theme`, oklch) + shadcn** | "Premium tokens starter — Tailwind v4 (@theme, oklch) + shadcn retune" | version: Tailwind **v4** |
| **shadcn** (retune block) | "── shadcn retune (premium-craft \"beyond stock\") ─────────────────────────\n   Map shadcn's semantic vars onto this system so components stop reading\n   as stock. Extend per-component (density, height) in the design artifact." | none |
| **WebKit / Firefox** (scrollbar) | "/* Tinted thin scrollbar (WebKit + Firefox) */" | none |

---

## 3. `skills/sailes-async/`

### 3.1 `skills/sailes-async/SKILL.md`

| Tool | Verbatim quote | Version / "if absent" stated there |
|---|---|---|
| **Make / n8n / Zapier** (frontmatter description) | "Use when a slow, brittle, or sleep-padded integration flow (often on Make/n8n/Zapier) needs to become a FAST, durable, code-first async backend" | none |
| **Inngest / Temporal / BullMQ** (frontmatter triggers) | "Triggers — … \"Inngest / Temporal / BullMQ\", \"parallel-compute + async write-back\"." | none |
| **Make / n8n / Zapier** (overview) | "You have a process — typically a chain of Make/n8n/Zapier scenarios, or a synchronous request handler — that is too slow (sleeps, sequential API calls, polling) and has no real safety net" | none |
| **Inngest** | "This skill is distilled from a real Sailes build — the **SRF async orchestrator** (Volubus/Alubus): 3 chained Make scenarios with 2× 300s sleeps (~5 min of pure latency) reimplemented as an Inngest pipeline that lands **price + AI-qualification in ≤5s**." | none |
| **Make / n8n** (do-not-use clause) | "**Do NOT use when:** the flow is genuinely simple and low-volume (keep it in Make/n8n — a durable engine is operational overhead you'll regret)" | none |
| **BullMQ** (do-not-use clause) | "you need step-level retry/replay you don't actually have a requirement for (a plain queue like BullMQ is enough — see `async-compendium.md §engine`)" | none |
| **Temporal / Kafka** (do-not-use clause) | "the real bottleneck is throughput at massive scale (that's a different problem — Temporal/Kafka territory)" | none |
| **Inngest / Temporal / BullMQ / Trigger.dev** (decision card) | "\| **Durable engine** (Inngest / Temporal / BullMQ / Trigger.dev) \| once the build decision is yes \|" | none |
| **Make / n8n** (blueprint warning) | "🔒 **Blueprints & summaries lie — treat them as leads, not truth.** A Make/n8n blueprint's `{{N.data.X}}` is the *tool's* HTTP envelope, not the API's real response shape" | none |
| **Fastify** | "The **shape** to recommend by default (the SRF pattern): **thin intake app** (HTTP, e.g. Fastify) that only `verify signature → validate → persist raw → claim idempotency key → emit an event carrying IDs only → 202`" | none |
| **Slack** | "**Alert on every failure:** a Slack webhook naming the **exact failed stage** + a link back to the run; the alerter **never throws**; a **boot-time config guard** errors loudly if the webhook is unset." | explicit absent-behaviour: boot-time guard errors loudly if webhook unset |
| **Zod** | "**Typed input → call → Zod-validate the wire response → return a narrow domain type**; a typed `Error` subclass carrying `{path,status}`, **never logs secrets**." | none |
| **Inngest** (deploy gate) | "**Deploy gate** (self-hosted engine): prod signing/event keys are the right format (hex for Inngest `start`), worker callback host is reachable, migrations reviewed & applied (never auto-run prod), secrets rotated from `.env.example` defaults, Slack webhook **test-fired**." | none |
| **`sailes-database`** (sibling skill, harness tables) | "It leans on `sailes-database` for the harness tables (idempotency / audit / external-object-links) and hands the step bodies to `sailes-implement`." | none |
| **Make / n8n** (red flag) | "You're treating **\"port the Make/n8n blueprint\"** as the spec. It lies about response shapes, hides router gates, and encodes dead modules. Probe the live API first." | none |

### 3.2 `skills/sailes-async/async-compendium.md`

| Tool | Verbatim quote | Version / "if absent" stated there |
|---|---|---|
| **Inngest (self-hosted) + Postgres + Redis** | "\| **Inngest (self-hosted)** \| Step-level retry **from the exact failure**; built-in dashboard = the supervision UI for free; fan-out/parallel steps; event idempotency; TS-native, strong types \| Needs Postgres **+ Redis** to operate; the executor batches step-layers (see §barrier); dev-vs-prod key handling has footguns \|" | none |
| **Temporal** | "\| **Temporal** \| The most powerful durable-execution model \| Heavy ops (a cluster); **overkill** at medium scale \|" | none |
| **BullMQ + Redis** | "\| **BullMQ + Redis** \| Simple, well-understood queue \| **Job-level, not step-level** retry; poor dashboard; you hand-roll orchestration \|" | none |
| **Trigger.dev** | "\| **Trigger.dev** \| Similar durable model, managed \| Younger ecosystem \|" | none |
| **Make / n8n / Zapier** | "\| **Make / n8n / Zapier** (the incumbent) \| Fast to prototype, visual \| **Can't cleanly fan-out-and-join** async work; no step-level retry; sleeps pad latency; no real audit/idempotency harness \|" | none |
| **Inngest self-hosted / Redis / AWS** | "**How SRF chose Inngest self-hosted:** single firm, 50–500 bookings/day, owner wanted self-hosted (no AWS), \"quality over speed\", and an **AI-agent build team → favor explicitness, one convention, strong types**. … Redis is accepted operational surface, taken *only because* self-hosted Inngest requires it." | none |
| **Temporal / BullMQ / Make / n8n** (overkill list) | "- Temporal — if you don't need replay + step-granular retry, it's a cluster you'll operate for nothing.\n- BullMQ — *enough* if you only need job-level retry and no supervision dashboard; then a durable engine is over-engineering.\n- Building anything custom — if the flow is simple, low-volume, and has no hard harness requirement, **stay on Make/n8n**." | none |
| **managed cloud fallback** | "🔀 **Self-host vs managed cloud:** self-hosting adds real operational surface (keys, container networking, the extra Redis). **Keep the managed-cloud fallback explicitly open** as a documented ADR trigger (\"if self-hosting proves heavy, move to <engine> Cloud\") — SRF did." | none |
| **Slack** | "await alertSlack({ stage: step.name, error });   // alert never throws" | none |
| **Zod** | "**Validate the wire response with Zod, return a narrow domain type** — don't leak the vendor's envelope. (A Make blueprint's `{{N.data.X}}` is Make's HTTP *envelope*, not the API's shape — probe the live API and validate against *that*.)" | none |
| **Zod** (adapter template) | "const wireSchema = z.object({ … })                     // the vendor's real response, validated" | none |
| **Pipedrive** | "**Correct overwrite verb** — verify it live (SRF: Pipedrive v1 deal update is PUT; PATCH/POST 404)." | API version: Pipedrive **v1** |
| **`sailes-database`** (sibling skill) | "The tables the harness needs (design & migrate them via `sailes-database`)" / "Full schema-decision rationale (PK by exposure, enums vs lookup, jsonb usage, soft-delete) lives in `sailes-database/db-compendium.md`" | none |

### 3.3 `skills/sailes-async/harness-checklist.md`

| Tool | Verbatim quote | Version / "if absent" stated there |
|---|---|---|
| **Node `crypto` (`crypto.timingSafeEqual`)** | "SHA-256 over the *raw* body (exact bytes, captured before JSON.parse), timing-safe compare (`crypto.timingSafeEqual`) with a length pre-check and a missing-signature guard; failure → 401, nothing downstream runs." | none |
| **Zod** | "**Validate the payload at the boundary** (Zod/schema, no `any`); reject on failure (400)." | none |
| **PostgreSQL** (error code) | "**Claim an idempotency key derived from a stable business id**, unique-constrained; catch the unique violation (PG `23505`) → return \"duplicate\" **before** emitting." | none |
| **Slack** | "**Alert on failure to a human channel, and never let alerting throw.** A Slack webhook carrying the **exact failed stage name** + a link back to the run; swallow + log on the alerter's own failure." | none |
| **alert channel** — absent behaviour | "**Boot-time config guard for the alert channel** — loudly error at startup if the alert webhook is unset/malformed, and **test-fire it** before deploy. *Why:* a misconfigured webhook silently defeats \"alert on every failure\" — the harness's own P0." | explicit absent-behaviour: error loudly at startup |
| **Slack** (test row) | "\| 12 \| Alert on failure, never let alerting throw \| a forced step failure produces a Slack call carrying the exact failed stage name; a **failing alerter** is swallowed and logged, and does not corrupt the original error path. \|" | none |
| **`sailes-test`** (sibling skill) | "Each hard rule above is architecture; this is its executable proof. `sailes-test` turns these into assertions — the techniques and the full async case set live in [`sailes-test/references/techniques.md`](../sailes-test/references/techniques.md)." | none |
| **PostgreSQL types** | "`timestamptz` for every moment in time (never `timestamp`).\n- `text` (+ `CHECK` only if genuinely needed), `numeric(12,2)` for money (never the `money` type)." | none |
| **PostgreSQL identity / UUIDv7** | "`bigint GENERATED ALWAYS AS IDENTITY` when ids stay internal (public lookups key on the business id, e.g. a submission UUID); reach for UUIDv7 only if ids are externally exposed or generation is distributed." | UUID version: **v7** |

### 3.4 `skills/sailes-async/lessons.md`

| Tool | Verbatim quote | Version / "if absent" stated there |
|---|---|---|
| **Windows / Node ESM** | "**L1 — Windows ESM entry-point check silently exits.** `import.meta.url === \\`file://${process.argv[1]}\\`` never matches on Windows → `main()` never runs, the server exits 0 and never listens. … → Use `pathToFileURL(process.argv[1]).href`; verify by driving, not by tests." | none |
| **Make / n8n blueprint** | "**L2 — Reverse-engineered summaries miss router-filter GATES.** … → Treat prose summaries as **leads, not ground truth**; walk the raw blueprint JSON and diff every written field + every router filter before claiming parity." | none |
| **Zod / curl** | "**L3 — A low-code blueprint's `{{N.data.X}}` is the tool's HTTP envelope, not the API's shape.** They copied `{data:{vat}}` into Zod schemas; the live API returns **flat** objects, so the schema rejected every real response. … → **Never trust a blueprint for an external API's response shape — probe the live endpoint (curl with real creds) before writing the Zod schema.**" | none |
| **Inngest** (dev vs prod boot) | "**L4 — Self-hosted engine dev-vs-prod key handling.** `inngest start` with a non-hex signing key crashes (\"must be hex\") → nothing on :8288 → `send()` fails ECONNREFUSED → intake 500s. → Locally use `inngest dev --no-discovery -p 8288` (no keys, SDK connects via `INNGEST_DEV=1`); prod uses `inngest start` with **hex** `INNGEST_SIGNING_KEY` + `INNGEST_EVENT_KEY` + Postgres/Redis URIs." | port `8288`; env vars `INNGEST_DEV=1`, `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY` |
| **Pipedrive** | "**L5 — Verify the HTTP verb against the live API.** `updateDeal` used PATCH → live Pipedrive returns `404 \"Unknown method\"`; every deal update silently failed the stage. … (Live: PATCH 404 · PUT 200 · POST 404.)" | none |
| **Docker / Inngest SDK** | "**L6 — Container callback host wiring.** A containerized engine derives the worker's serve URL from the incoming request host and got `localhost` = the container itself → \"couldn't find application\", events ingest but never run. A home-grown `INNGEST_SERVE_ORIGIN` var was a decoy — the SDK ignores it. → Set the SDK's own `INNGEST_SERVE_HOST`/`INNGEST_SERVE_PATH` (`host.docker.internal` in Docker), re-register, and confirm the app shows `connected: true`." | env vars `INNGEST_SERVE_HOST`, `INNGEST_SERVE_PATH` |
| **Inngest `waitForEvent`** | "**L7 — `waitForEvent` suspends the function.** `Promise.all([step.run(compute), step.waitForEvent(...)])` did not run compute concurrently — compute started only when the event landed (~2.7s late)." | none |
| **durable engine (Inngest)** — batch barrier | "**L8 — The engine batches a parallel step-layer; a downstream step waits for the WHOLE batch.** … A JS dataflow runner cannot cross this. → To decouple a fast step from a slow peer in wall-clock, **split into separate functions/runs** (independent executor timelines)." | none |
| **Pipedrive (config env var)** | "**L9 — Config footguns hide behind fakes.** A `PIPEDRIVE_COMPANY_DOMAIN` set to a full URL produced `new URL(\"https://https://…\")` → `ENOTFOUND https`. The dry-run faked Pipedrive so it stayed hidden until the real e2e." | env var `PIPEDRIVE_COMPANY_DOMAIN` |
| **durable engine per-step overhead** | "**L10 — Fine-grained steps blow the latency budget.** ~24 per-action durable steps measured 14.4s, ~7–9s of it pure per-step engine round-trip overhead (~250–600ms each)." | none |
| **Volubus** | "1. **Transient failures made permanently terminal** — a caught Volubus error was turned into a terminal state with zero retries." | none |
| **Slack / email** | "3. **Silent side-effect failures** — ack-email + Slack failures were swallowed, violating the P0 \"alert on every failure\"." | none |
| **LLM / model sweep** | "**LLM-specific:** verbatim-porting a low-code prompt over-rejected valid inputs on *every* model — the root cause was the **prompt, not the model** (proven by a model sweep). LLM latency is highly variable (3–18s), threatening a tight budget." | none |
| **CRM (probe safety)** | "**Self-cleaning dry-runs** — exercise full business logic against real read-side dependencies with **fake writes**, so no junk CRM records are created and no real emails/webhooks/supplier-sendouts fire." | none |

### 3.5 `skills/sailes-async/speedup-recipe.md`

| Tool | Verbatim quote | Version / "if absent" stated there |
|---|---|---|
| **Make** | "The reusable method behind \"3 chained Make scenarios with ~5 min of latency → price + AI-qualification in ≤5s\"." | none |
| **LLM / `Promise.all`** | "**7. Parallelize independent calls within a slow step; determinize what you can.** The N-LLM pattern: run independent checks concurrently (`Promise.all`), keep only the true aggregator sequential (it consumes the others). … SRF replaced 5 of 7 LLM/API hops (currency, vehicle-class, rounding, rules-gate, same-day-return feasibility) with pure functions." | none |
| **OpenAI-style reasoning model params** | "In SRF the qualify model was a reasoning model running ~7.8s/call; `reasoning_effort: \"minimal\"` cut it to ~1.5s/call for the *same verdict* → qualify ~3.4s. (It also needed `max_completion_tokens`, not `max_tokens`, and no custom `temperature`.)" | none |
| **Make / OpenAI / Maps / Pipedrive** (before diagram) | "BEFORE (Make, sequential, ~5 min):\n  SRF POST\n   └─[1] Booking: OpenAI city → Maps×2 → Pipedrive person+deal → Sleep 2s → webhook → email\n        └─[2] Price: GetDeal → OpenAI normalize → geocode×2 → VAT → /calculation → UpdateDeal" | none |
| **Pipedrive** (polling) | "(page polls Pipedrive every 5s until the deal appears)" | none |
| **Airtable** (after diagram) | "│       → { ack-email ‖ airtable ‖ downstream-webhook }  (best-effort)" | none |
| **Inngest (self-hosted)** | "### Trap A — the engine's batch barrier (the hardest lesson; ADR-004)\nA durable-workflow engine (self-hosted Inngest here) **dispatches a parallel step-layer, then re-plans the function to discover the next steps only after the WHOLE batch drains.**" | none |
| **`waitForEvent`** | "### Trap B — `waitForEvent` suspends the function\n`Promise.all([step.run(compute), step.waitForEvent(...)])` does **not** run compute concurrently — `waitForEvent` suspends the whole function, so compute starts only when the event lands (measured ~2.7s late, pushing the verdict to ~5.5s)." | none |
| **link table fallback** | "**Fix:** run the compute **first**, then resolve the cross-run dependency via a **durable read you know is already written** (the external-object link table), keeping `waitForEvent` only as a fallback." | explicit fallback ordering |

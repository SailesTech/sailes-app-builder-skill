# Arm A — Explorer 2 — recon: `skills/sailes-test/`, `skills/sailes-design/`, `skills/sailes-async/`

**Slice size: 17 files.** All 17 read in full. Enumeration and confirmation:

| # | Repo-relative path | Read in full |
|---|---|---|
| 1 | `skills/sailes-test/SKILL.md` | ✅ |
| 2 | `skills/sailes-test/references/browser-e2e.md` | ✅ |
| 3 | `skills/sailes-test/references/external-systems.md` | ✅ |
| 4 | `skills/sailes-test/references/techniques.md` | ✅ |
| 5 | `skills/sailes-test/test-plan-template.md` | ✅ |
| 6 | `skills/sailes-design/SKILL.md` | ✅ |
| 7 | `skills/sailes-design/browser-inspect.md` | ✅ |
| 8 | `skills/sailes-design/design-judgment.md` | ✅ |
| 9 | `skills/sailes-design/premium-craft.md` | ✅ |
| 10 | `skills/sailes-design/premium-ux.md` | ✅ |
| 11 | `skills/sailes-design/ux-rules.md` | ✅ |
| 12 | `skills/sailes-design/assets/premium-tokens-starter.css` | ✅ |
| 13 | `skills/sailes-async/SKILL.md` | ✅ |
| 14 | `skills/sailes-async/async-compendium.md` | ✅ |
| 15 | `skills/sailes-async/harness-checklist.md` | ✅ |
| 16 | `skills/sailes-async/speedup-recipe.md` | ✅ |
| 17 | `skills/sailes-async/lessons.md` | ✅ |

No deduplication, no ranking, no editorialising below. Entries are in file order, then line order.

---

# 1. `skills/sailes-test/SKILL.md`

**L107 — Stryker (mutation testing tool)**
> `| **A — critical** | money · auth / permissions / tenancy · idempotency · irreversible outbound write (CRM, email, Slack, payment) | **Stryker** on the touched files; every surviving mutant killed or explained in writing |`
- Version constraint: none stated.
- Absence behaviour: none stated at this location. Tier is described at L104–105 as computed "from **triggers, not judgment** — you may raise it, you may never lower it". No fallback for Stryker being unavailable.

**L107 — CRM, email, Slack, payment (as classes of irreversible outbound write)**
> `money · auth / permissions / tenancy · idempotency · irreversible outbound write (CRM, email, Slack, payment)`
- Version constraint: none.
- Absence behaviour: n/a (trigger enumeration, not a tool requirement).

**L117 — Playwright / Chromium**
> `Every UI-visible behavior is exercised in a real browser (Playwright/Chromium), clicked as a user`
> `would. Pure computation and data mapping stay lower, where they are fast and stable.`
- Version constraint: none stated.
- Absence behaviour: none stated at this location.

**L78–80 — test infrastructure absent → ENV-DEFECT (generic runner/fixture/seed tooling)**
> `If the repo has no test infrastructure at all — no runner, no fixtures, no seed path — report`
> `**\`ENV-DEFECT\`** with a concrete setup proposal for the human to approve. Do not stand it up`
> `yourself: runner, fixture strategy and seed path are stack decisions, and those belong to the human.`
- Version constraint: none.
- Absence behaviour: **explicit** — report `ENV-DEFECT` + a setup proposal; do NOT self-install; the human approves.

**L145 — external systems fork per system (Slack, payment provider named)**
> `One blanket policy is wrong for at least one of your integrations — Slack and a payment provider`
> `carry different costs of being wrong. Present the fork per system, let the human choose, record the`
> `answer in the plan.`
- Version constraint: none.
- Absence behaviour: choice is deferred to the human via `references/external-systems.md`.

**L145–146 — real-contract check per external system**
> `Two rules that hold regardless: **at least one real-contract check per external system** must exist`
> `somewhere, and every recorded response carries a recorded-at date plus scheduled re-validation.`
- Version constraint: none.
- Absence behaviour: not stated here.

**L147–148 — LLM-backed features**
> `Where no exact oracle exists — LLM-backed features especially — use **metamorphic relations** and`
> `property-based tests. Asserting exact LLM output is not a test.`
- Version constraint: none.
- Absence behaviour: n/a.

**L154 — mocking / doubling boundary (third-party HTTP, clock, randomness)**
> `- **Never mock inside your own app** to make a test pass. Double at the process boundary — third-party`
> `  HTTP, clock, randomness — and nothing else without saying why.`
- Version constraint: none.
- Absence behaviour: n/a.

**External URLs / services cited (documentation references, not runtime tools)**
- L21 `([arXiv 2410.21136](https://arxiv.org/abs/2410.21136))`
- L125–126 `([Luo et al., FSE 2014](https://mir.cs.illinois.edu/lamyaa/publications/fse14.pdf) — 201 commits`

---

# 2. `skills/sailes-test/references/browser-e2e.md`

**L3 — Playwright / Chromium**
> `Every UI-visible behavior is proven in a real browser (Playwright/Chromium), driven as a user would`
> `drive it. Pure computation and data mapping stay at a lower level, where they are fast and stable.`
- Version constraint: none.
- Absence behaviour: none stated.

**L45–47 — Playwright auto-waiting locators / `expect(locator).toHaveText(...)`**
> `1. **Never \`sleep\`.** Wait for a condition — Playwright's auto-waiting locators and`
> `   \`expect(locator).toHaveText(...)\` retry until a timeout. A fixed delay is either too short`
> `   (flake) or too long (a slow suite people stop running).`
- Version constraint: none.
- Absence behaviour: none stated.

**L61–62 — Playwright selector API (`getByRole`)**
> `Prefer what a user perceives — role, label, visible text — over structure. \`getByRole('button',`
> `{ name: 'Zapisz' })\` survives a refactor that \`div > div:nth-child(3) > button\` does not`
- Version constraint: none.
- Absence behaviour: none stated. Test ids named as fallback for ambiguity (L63–64), not for tool absence.

**L84–86 — `chrome-devtools` MCP server**
> `The \`chrome-devtools\` MCP server (\`../../sailes-design/browser-inspect.md\`) can click, fill, read the`
> `console and evaluate scripts in a live page. It is a **diagnostic and measurement** instrument, and`
> `it produces **no assertion, no file, and nothing that runs again tomorrow**.`
- Version constraint: none stated here (cross-references `sailes-design/browser-inspect.md`).
- Absence behaviour: not stated at this location; this section is a *boundary* rule (devtools is never a substitute for a test), L88–96:
> `**Every behavior that must not regress ends as a test in this suite.** Devtools has exactly two`
> `legitimate uses: finding out what is happening (\`sailes-diagnose\` Step 1), and the measurable UI`
> `gates — integrity, contrast, Core Web Vitals`
> `"I drove it in devtools and it worked" is the false green this whole reference exists to prevent,`

**L107 — Playwright docs URL**
> `Reference: [Playwright](https://playwright.dev/docs/best-practices)`

---

# 3. `skills/sailes-test/references/external-systems.md`

**L3–4 — Pipedrive, Make/n8n, Slack, a payment provider, an LLM API**
> `Pipedrive, Make/n8n, Slack, a payment provider and an LLM API do not carry the same cost of being`
> `wrong. One blanket policy is therefore wrong for at least one of them.`
- Version constraint: none.
- Absence behaviour: per-system fork presented to the human; choice recorded in the test plan (L5).

**L32 — MSW (Mock Service Worker)**
> `| **Mock / MSW** | fast, hermetic, no credentials | drifts from the real API **silently** — the classic false green |`
- Version constraint: none.
- Absence behaviour: none stated (it is one option of four in a decision table).

**L34 — Recorded cassette**
> `| **Recorded cassette** | real payloads, replayable | staleness invisible until re-recorded; looks realer than it is |`
- Version constraint: none.
- Absence behaviour: n/a; L69–70 requires an expiry mechanism:
> `2. **Every recorded response carries a recorded-at date** and a scheduled re-record that fails on`
> `   diff. A cassette without an expiry mechanism is a future outage with a green test in front of it.`

**L35 — Real sandbox (needs credentials)**
> `| **Real sandbox** | the actual contract verified | needs credentials from the human; slow; flaky |`
- Version constraint: none.
- Absence behaviour: **explicit**, at L79–81:
> `5. **Credentials come from the human.** An agent cannot create a sandbox account. If a behavior needs`
> `   one and it is absent, it goes on the plan's \`🔑\` list and the behavior is **UNVERIFIED** — never`
> `   mocked and reported as covered.`

**L41–43 — Google *Software Engineering at Google*, "unfaithful doubles"**
> `Google's *Software Engineering at Google* names it **unfaithful doubles**: "when those dependencies`
> `are replaced, it becomes possible that the replacement and the doubled thing do not agree."`
- Version constraint: `ch. 13` cited (L43).

**L45–47 — Pipedrive as the non-owned API**
> `**You are not the API owner.** Nobody at Pipedrive maintains your fake, and nobody tells you when`
> `the field you stubbed became nullable.`

**L53–54 — Pact (consumer-driven contract testing), Slack, Stripe**
> `Pact's model has the consumer's test generate a contract and the **provider replay it** against the`
> `real implementation ([docs](https://docs.pact.io/)). Pipedrive will not run your provider`
> `verification. Neither will Slack or Stripe.`
- Version constraint: none.
- Absence behaviour: **explicit hard rule** — "Do not plan for it." (L56), with three named substitutes (L58–63): Zod/JSON-Schema validation of real responses, a scheduled sandbox canary, comparison against the vendor's published OpenAPI spec.

**L58–60 — Zod / JSON-Schema**
> `- **Schema-validate real responses.** Every cassette and every sandbox response is validated against`
> `  a Zod/JSON-Schema shape, so *shape drift fails even when your assertion would not*. This is the`
> `  single highest-value habit in this file.`
- Version constraint: none.

**L63 — vendor's published OpenAPI spec**
> `- **Compare against the vendor's published OpenAPI spec** where one exists.`
- Absence behaviour: conditional — "where one exists".

**L74–78 — Testcontainers, Postgres, SQLite, Redis**
> `4. **Real infrastructure, not in-memory substitutes.** Postgres via Testcontainers, not SQLite; real`
> `   Redis, not a map. In-memory replacements do not implement the features you actually use, so code`
> `   passes locally and fails in production ([Testcontainers](https://testcontainers.com/guides/introducing-testcontainers/)).`
> `   The line is sharp: Testcontainers solves infrastructure *you deploy*. There is no Pipedrive`
> `   container.`
- Version constraint: none.
- Absence behaviour: explicit *scope* limit — Testcontainers covers only infrastructure you deploy; no container exists for third-party SaaS.

**L83–91 — LLM APIs**
> `There is no exact oracle. Asserting a model's exact output is a snapshot of one sampling run — it`
> `will be brittle, then loosened, then meaningless.`
> `Assert **metamorphic relations** instead`
- Version constraint: none.

**L99–101 — recorded example naming Pipedrive and Slack with a date**
> `🔀 Pipedrive → cassette recorded 2026-07-20 — real payloads, but a field type change`
> `   will not fail this suite until re-record. Real-contract check: nightly canary B12.`
> `🔀 Slack     → mock — low cost of being wrong, message shape is not our contract.`
- Version constraint: cassette date `2026-07-20`.

**L104–107 — reference URLs**: Martin Fowler *Mocks Aren't Stubs*, SWE at Google ch. 13, Pact (`https://docs.pact.io/`), MSW (`https://mswjs.io/docs/comparison/`), Testcontainers.

---

# 4. `skills/sailes-test/references/techniques.md`

**L87–89 — fast-check, Hypothesis, QuickCheck (property-based testing frameworks)**
> `Sources: [fast-check](https://fast-check.dev/) ·`
> `[Hypothesis](https://hypothesis.readthedocs.io/) ·`
> `[QuickCheck at Ericsson (Hughes)](https://www.cs.tufts.edu/~nr/cs257/archive/john-hughes/quviq-testing.pdf)`
- Version constraint: none.
- Absence behaviour: none stated. L84–86 states property-based testing "**supplements** example tests, never replaces them" and names poor-fit conditions.

**L81 — QuickCheck / Ericsson Erlang**
> `The best-documented payoff: QuickCheck found 200+ bugs in Ericsson's Erlang telecom systems that`
> `example-based tests had missed.`

**L123–124 — OWASP Fuzzing, OSS-Fuzz**
> `Sources: [OWASP — Fuzzing](https://owasp.org/www-community/Fuzzing) ·`
> `[OSS-Fuzz](https://google.github.io/oss-fuzz/)`
- Version constraint: none.

**L143–144 — Stryker, MuTAP**
> `Sources: [Stryker — mutant states and metrics](https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/) ·`
> `[MuTAP / LLM oracle strength, arXiv 2405.03786](https://arxiv.org/abs/2405.03786)`
- Version constraint: none.
- Absence behaviour: none stated. Operational scoping at L137–138:
> `Costs are real — it is slow and noisy across a whole repo. Operational rule: **chase surviving`
> `mutants on critical modules, not the aggregate score.**`

**L140–141 — MuTAP figures**
> `Feeding surviving mutants back to the model measurably improves generated tests — MuTAP reports a`
> `93.57% mutation score and 28% more real-world bugs detected than the baseline.`

**L149–151 — cross-link to sailes-async harness checklist**
> `These are not optional extras; they are the cases real integrations fail on. The architecture rules`
> `they prove live in [\`sailes-async/harness-checklist.md\`](../../sailes-async/harness-checklist.md),`
> `which now carries a test column pointing back here.`

**L169–171 — Temporal (durable engine, replay testing in CI)**
> `For durable engines: every step must be independently retryable, and the test proves it by forcing`
> `failure at each step boundary and re-running. Temporal additionally replays recorded histories in CI`
> `and fails on non-determinism — which catches *deployment* breakage that no ordinary test sees.`
- Version constraint: none.

**L173–175 — Hookdeck, Temporal, Inngest (documentation sources)**
> `Sources: [webhook idempotency](https://hookdeck.com/webhooks/guides/implement-webhook-idempotency) ·`
> `[Temporal replay testing](https://docs.temporal.io/develop/typescript/testing-suite) ·`
> `[Inngest testing](https://www.inngest.com/docs/reference/testing)`
- Version constraint: Temporal doc URL is TypeScript-specific.

**L195 — Go `testing/synctest`**
> `[Go's testing/synctest — deterministic concurrent time](https://go.dev/blog/synctest)`
- Version constraint: none.

**L191–194 — Google testing blog, Luo et al. FSE 2014, DOI note**
> `(canonical DOI \`10.1145/2635868.2635920\`; \`dl.acm.org\` and \`doi.org\` both return 403 to automated`
> `checks — bot protection, not a dead link, verified 2026-07-20) ·`
- Version/date constraint: verified `2026-07-20`.

**L215–219 — Fowler, Google Test Sizes, SWE at Google ch. 11, Dodds (sources)**

**L226–233 — arXiv 2410.21136 (worked example on fabricated numbers)**
> `Every one of those numbers was fabricated during summarization. The paper's abstract`
> `([arXiv 2410.21136](https://arxiv.org/abs/2410.21136)) contains **no percentages at all**`

**L182–184 — explicit prohibition on citing a number**
> `> **Do not cite the widely-circulated 45% / 20% / 12% split.** It could not be confirmed against the`
> `> paper or any peer-reviewed citation of it. The ranking is sourced; the percentages are not.`

---

# 5. `skills/sailes-test/test-plan-template.md`

**L28 — credential / sandbox account / API key placeholder**
> `🔑 <credential / sandbox account / API key> → blocks B<n>, B<m>`
- Version constraint: none.
- Absence behaviour: **explicit** — an absent credential *blocks* named behaviors and is listed under `Requires you`.

**L29 — manual step (no automation possible)**
> `👉 <manual step no automation can perform> → covers B<n>; report UNVERIFIED until confirmed`
- Absence behaviour: **explicit** — report `UNVERIFIED` until a human confirms.

**L30 — external system double choice**
> `🔀 <external system> → chosen double: mock | fake | cassette | real sandbox — <what this trades away>`
- Version constraint: none.
- Absence behaviour: the four options are the recorded fork; the human picks.

**L59 — Stryker (tier A proof)**
> `> Tier A instead records Stryker output: surviving mutants killed, or each one explained here.`
- Version constraint: none.
- Absence behaviour: none stated.

---

# 6. `skills/sailes-design/SKILL.md`

**L17 / L47 / L99 / L104 / L122–123 — shadcn/ui**
- L17:
> `how it **looks** (\`premium-craft.md\` — color depth, layered elevation, typographic refinement, motion choreography, "premium tells" pass)`
- L47:
> `Retune shadcn defaults; don't ship them stock. Start from \`assets/premium-tokens-starter.css\` (set the hue knobs from your palette) instead of re-deriving the ramps by hand.`
- L49:
> `6. **Persist** the artifact (MASTER.md or ui-spec.md), tuned to the locked stack (Tailwind/shadcn → token names map to that).`
- L122:
> `| Shipping stock shadcn defaults | The default look is itself a tell. Retune palette/radius/shadow/ring so it doesn't read as stock — \`assets/premium-tokens-starter.css\` does the mapping. |`
- Version constraint: none stated in this file (`premium-craft.md` L7 pins the stack — see §9).
- Absence behaviour: none stated.

**L49 / L99 — Tailwind**
> `tuned to the locked stack (Tailwind/shadcn → token names map to that)`
- Version constraint: none stated here.

**L52–56 — `ui-ux-pro-max` skill/CLI + `python3` + `scripts/search.py`**
> `## Optional: ui-ux-pro-max design engine`
> `If the \`ui-ux-pro-max\` skill/CLI is installed, you may seed the direction with its reasoning engine (67 styles, 161 palettes, 57 font pairings, product-type rules):`
> `\`python3 .../ui-ux-pro-max/scripts/search.py "<product> <industry> <keywords>" --design-system -p "<Project>"\``
> `Treat its output as **input to your judgment**, not the final answer — still run the anti-AI-default critique and the discipline rules. It is web/app-UI oriented and mobile-biased in places; for B2B web take the palette/type/UX rules, drop the mobile-only items that don't apply.`
- Version constraint: none. Content stated as "67 styles, 161 palettes, 57 font pairings".
- Absence behaviour: **explicitly optional** — section header says "Optional", gated on "If the `ui-ux-pro-max` skill/CLI is installed". No fallback procedure named; the skill simply proceeds without it. Also L117 Common Mistakes:
> `| Copying ui-ux-pro-max output verbatim | It's input to judgment, not the answer; strip mobile-only rules for B2B web. |`

**L64 — Playwright (screenshot render)**
> `1. **Render before you hand off.** Build a visualization of what you're designing — a Playwright screenshot of the rendered component/page (or the prototype's own render) — and LOOK at the actual pixels.`
- Version constraint: none.
- Absence behaviour: alternative named inline — "(or the prototype's own render)".

**L76 — `chrome-devtools` MCP server (physical-integrity gate instrument)**
> `**Measure the six, don't eyeball them (optional instrument).** If the \`chrome-devtools\` MCP server is installed, run the probe in \`browser-inspect.md\` §1 instead of judging the screenshot: it returns the six checks as data — the offending elements by selector, at each target width — plus \`lighthouse_audit\` for the \`ux-rules.md\` contrast/focus requirements (§2). Paste that output into the artifact; a list of named defects is the gate's evidence, where "looks fine to me" never was. This gate says "categorical checks — pass/fail, not opinion", and a model reading a PNG cannot deliver either. **Not installed → keep step 1's screenshot as the fallback and record \`SKIP browser-inspect (chrome-devtools MCP absent)\`** in the run log. Never report an unmeasured gate as passed; an explicit SKIP is the honest output. The instrument covers *integrity only* — taste, hierarchy and the premium passes below still need your eyes on the pixels.`
- Version constraint: none stated here (see `browser-inspect.md` L45 for `@latest`).
- Absence behaviour: **explicit and detailed** — fall back to the step-1 screenshot AND record the literal line `SKIP browser-inspect (chrome-devtools MCP absent)` in the run log. "Never report an unmeasured gate as passed."

**L85 — headless browser (prototype render)**
> `- **Render the reference to an image first.** Open the prototype (HTML/Figma export/screenshot) and look at the actual pixels — open prototype HTML in a headless browser and screenshot it. Reading its CSS is NOT seeing its layout.`
- Version constraint: none. Figma named as a source format ("Figma export").

**L101 — quick-reference restatement of the SKIP**
> `| **Render + integrity gate** | **screenshot the result; nothing clipped/overflowing/invisible/overlapping/non-responsive — measured via \`browser-inspect.md\` §1 when available, else screenshot + explicit SKIP** |`

**L104 — reference-file map incl. cross-skill links**
> `Reference files: \`design-judgment.md\` (taste, signature, anti-AI-default), \`ux-rules.md\` (condensed accessibility/interaction/responsive/forms checklist), \`premium-craft.md\` (the "looks expensive" finish layer + premium-tells checklist, tuned to Tailwind v4/oklch + shadcn), \`premium-ux.md\` (the "feels expensive" interaction layer + premium-feel checklist), \`assets/premium-tokens-starter.css\` (ready @theme scaffold implementing the craft rules), \`../sailes-bootstrap/ui-libraries.md\` (UX-layer options as design-phase inputs — Preline blocks + free Figma kit, Astryx CSS-variable themes), \`browser-inspect.md\` (optional instrument — ...)`
- Named externals here: **Tailwind v4**, **oklch**, **shadcn**, **Preline** (blocks + free Figma kit), **Astryx** (CSS-variable themes), **Figma**.
- Version constraint: `Tailwind v4`.
- Absence behaviour: `browser-inspect.md` labelled "optional instrument".

**L111–112 — Common Mistakes on the instrument**
> `| Reporting the integrity gate as passed from looking at a screenshot, with the instrument available | Run \`browser-inspect.md\` §1 and paste the measurement. An impression is not a pass/fail check. |`
> `| Instrument absent, so the gate is quietly reported as passed | Screenshot fallback **plus** an explicit \`SKIP browser-inspect\` line. Silence is the failure, not the SKIP. |`

**L34–36 — artifact file paths (not external tools, recorded for completeness)**
> `- **\`design-system/MASTER.md\`** (+ \`design-system/pages/<page>.md\` overrides)`
> `- **\`.ai/specs/ui-spec.md\`** — a single design spec`

---

# 7. `skills/sailes-design/browser-inspect.md`

**L3–5 — the file's scope + optionality**
> `Shared instrument reference. Used by \`sailes-design\` (the physical-integrity gate, a11y, premium`
> `latency budget), \`sailes-diagnose\` (Step 1 Live), and \`sailes-test\` (selector ground truth).`
> `**Optional**: everything below has a documented fallback, and its absence is an explicit SKIP,`
> `never a silent one.`
- Absence behaviour: **blanket statement** — everything has a documented fallback; absence = explicit SKIP.

**L21 — Chrome DevTools over CDP**
> `one output this framework exists to distrust. Chrome DevTools over CDP measures all three directly.`

**L41–48 — `chrome-devtools-mcp` install (MCP server), `claude mcp add`, `npx`, Chrome Stable, `@puppeteer/browsers`**
> `Machine prerequisite — an MCP server, installed once per machine:`
> ` ```bash`
> `claude mcp add chrome-devtools --scope user -- npx -y chrome-devtools-mcp@latest`
> `# No Chrome Stable on the machine? Point it at a dedicated browser instead of installing one:`
> `#   npx -y @puppeteer/browsers install chrome@stable --path ~/.cache/puppeteer`
> `#   ...then add --executablePath "<printed path>" to the args above.`
> ` ``` `
- Version constraints: **`chrome-devtools-mcp@latest`**; **`chrome@stable`** via `@puppeteer/browsers`.
- Absence behaviour: **two levels** — (a) no Chrome Stable → install a dedicated browser via `@puppeteer/browsers` and pass `--executablePath`; (b) MCP not installed at all → see L54–57 below.

**L50–52 — per-project opt-in via `.mcp.json` / bootstrap Q21**
> `Per-project opt-in is a \`.mcp.json\` decision card in bootstrap (Q21) — committed to the repo, so`
> `every agent and developer on that project gets the same instrument, and no machine is mutated`
> `behind anyone's back.`

**L54–57 — absence behaviour, stated explicitly**
> `**If it is not installed:** fall back to the screenshot render (\`SKILL.md\` §Render and self-verify,`
> `step 1) and record \`SKIP browser-inspect (chrome-devtools MCP absent)\` in the artifact — the run`
> `log, the incident record, or the qa verdict. An unmeasured gate reported as passed is the failure;`
> `an explicit SKIP is not.`

**L59–62 — the full tool list (`mcp__chrome-devtools__*`)**
> `Tools referenced below, all \`mcp__chrome-devtools__*\`: \`navigate_page\`, \`resize_page\`, \`emulate\`,`
> `\`evaluate_script\`, \`take_snapshot\`, \`take_screenshot\`, \`list_console_messages\`,`
> `\`list_network_requests\`, \`get_network_request\`, \`lighthouse_audit\`, \`performance_start_trace\`,`
> `\`click\`, \`fill\`, \`fill_form\`, \`wait_for\`.`
- Version constraint: none per-tool.

**L66–69 — `evaluate_script` + `resize_page` at fixed widths**
> `Run the probe below with \`evaluate_script\` on the rendered page, at each target width from`
> `\`ux-rules.md\` (1280 / 1366 / 1440 via \`resize_page\`). It returns the six checks as data.`

**L146–148 — Node, in-repo fixtures, Chromium / Edge versions**
> `**Verified against fixtures that live in the repo** — \`evals/fixtures/browser-probe/\`, run with`
> `\`node evals/fixtures/browser-probe/run-probe.mjs\`. The runner extracts the probe from *this code`
> `block*, so editing it here is what the fixtures test. Last run 2026-07-25 (Chromium 150 / Edge`
> `150.0.4078.96, headless, 1254×690), both cases passing:`
- Version constraints: **Chromium 150**, **Edge 150.0.4078.96**, headless, viewport 1254×690; last run **2026-07-25**. Runner is `node` (no version pinned).

**L168–176 — versioned behaviour of the probe itself (1.14.0 → 1.14.1)**
> `And note why the *clean* fixture is the one that earns its keep. 1.14.0 shipped this probe verified`
> `against the defect page only`
> `Fixed in 1.14.1: \`checkVisibility()\`, horizontal-only off-canvas,`
> `\`text-overflow: ellipsis\` excluded, zero-size controls excluded.`
- Version constraint: repo/skill versions **1.14.0**, **1.14.1**.

**L178–190 — four stated limits of the instrument**
> `- **It finds physical defects, not ugly ones.** Taste, hierarchy, and the premium-craft pass still`
> `  need the screenshot and your judgment. This replaces the *integrity* half of the gate only.`
> `- **\`overlap\` and \`smallHit\` produce false positives by design**`
> `- **Only what is rendered now is measured.**`
> `- **An \`overflow: hidden\` carousel or marquee still reads as \`clipped\`.**`

**L192–199 — `lighthouse_audit`, axe-core**
> `lighthouse_audit({ mode: 'navigation', device: 'desktop' })`
> `Covers accessibility, SEO, best practices — and **excludes performance by design** (that is §3).`
> `The accessibility category is axe-core: it returns the failing contrast pairs with their elements`
> `and computed ratios, which is precisely what \`ux-rules.md:7\` asks you to "verify".`
- Version constraint: none.

**L204–206 — `emulate({ colorScheme })` for dark-mode contrast**
> `emulate({ colorScheme: 'dark' })   →   lighthouse_audit(...)   →   emulate({ colorScheme: 'light' })`

**L208–215 — `take_snapshot`, `press_key`, selector ground truth for `sailes-test`**
> `\`take_snapshot\` returns the accessibility tree as text. Two uses:`
> `- **Focus and keyboard** (\`ux-rules.md:66\`): drive \`press_key('Tab')\` and re-snapshot to see where`
> `  focus actually lands and whether the ring is on a real control — a screenshot cannot show tab order.`
> `- **Selector ground truth for \`sailes-test\`**: the suite's selector doctrine is`
> `  \`getByRole('button', { name: 'Zapisz' })\` (\`browser-e2e.md\` §Selectors).`

**L217–226 — `performance_start_trace`, Core Web Vitals, `emulate` throttling**
> `performance_start_trace({ reload: true, autoStop: true })`
> `Returns Core Web Vitals (LCP, INP, CLS) plus insight sets — the numbers \`premium-ux.md\` §1 sets`
> `thresholds for.`
> `emulate({ cpuThrottlingRate: 4, networkConditions: 'Fast 4G' })`
- Version constraint: none; network profile named `'Fast 4G'`, CPU throttle `4`.

**L228–238 — the dev-server trap (a validity constraint on the instrument)**
> `**🚨 The trap that would make this a false instrument.** A dev server serves unminified bundles`
> `through HMR with no CDN and no production cache headers. Its LCP is not the product's LCP. So:`
> `- Treat dev-server timings as a **relative** signal`
> `- Any **absolute** threshold is asserted against a production or preview build only.`
> `- Never turn a dev-server number into a green gate.`
- Absence/invalidity behaviour: §1 and §2 remain valid on dev (L240):
> `By contrast, §1 and §2 are **valid on dev** — geometry and contrast do not change with minification.`

**L241–250 — diagnosis tools: `list_console_messages`, `list_network_requests`, `get_network_request`, `evaluate_script` on localStorage/sessionStorage/cookies**
> `- \`list_console_messages\` (filter by pattern) — the console half of the evidence log.`
> `- \`list_network_requests\` then \`get_network_request\` — URL, status **and body**`
> `- \`evaluate_script\` reading \`localStorage\` / \`sessionStorage\` / cookies — the state the theory rests on.`

**L252–256 — Playwright context vs persistent CDP profile; `--browserUrl`**
> `**The structural gain over a fresh Playwright context.** \`diagnosis-loop.md\` §1 notes that a`
> `Playwright context starting fresh *cannot* reproduce a stale-\`localStorage\` bug`
> `This server does not start fresh: its default profile persists across`
> `calls, and \`--browserUrl http://127.0.0.1:9222\` attaches to an already-running browser with the`
> `real session in it.`
- Version constraint: port `9222` (default CDP port).

**L258–265 — two binding constraints (production read-only; browser dialogs)**
> `- **Read-only on production.** \`click\`, \`fill\` and \`evaluate_script\` can write. On a production`
> `  surface, restrict yourself to reading — snapshot, console, network, storage — and write the`
> `  mutating step out for the human, as rule #1 requires.`
> `- **Never trigger a browser dialog.** \`alert\`/\`confirm\`/\`prompt\` block the CDP channel and the`
> `  session stops responding. Use \`handle_dialog\` when one is unavoidable, and prefer`
> `  \`console.log\` + \`list_console_messages\` over any dialog-based probe.`
- Note: `handle_dialog` is named here but is NOT in the tool list at L59–62.

**L267–275 — invocation matrix (which skill uses what)**
> `| \`sailes-design\` | §Render and self-verify — integrity gate | probe JSON at 3 widths + lighthouse a11y, in the ui-spec / run log |`
> `| \`sailes-design\` | premium-feel pass | CWV trace, relative to the previous measurement |`
> `| \`sailes-diagnose\` | Step 1 Live | console + network + storage entries in the evidence log, with ids |`
> `| \`sailes-test\` | writing browser cases | a11y-tree confirmation that role/name selectors resolve |`
> `| \`qa\` | UI gate | the same probe on the real surface; a non-empty defect list is CHANGES-REQUIRED |`

**L277–278 — reference URLs**
> `Reference: [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) ·`
> `[Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)`

**Browser APIs relied on inside the probe (L78–80, L111, L126)**
> `const vis = el => el.checkVisibility` … `: (s => s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.01)(getComputedStyle(el));`
- Absence behaviour: **explicit inline fallback** — if `el.checkVisibility` is unavailable, fall back to a `getComputedStyle` check (with the documented caveat at L78–79 that it does not account for ancestors).
> `const hit = document.elementFromPoint(cx, cy);`

---

# 8. `skills/sailes-design/design-judgment.md`

**L36 — screenshots (environment-conditional)**
> `- Critique as you build; take screenshots if the environment supports it (a picture is worth 1000 tokens). Jot notes on what you've tried so future passes don't repeat it.`
- Version constraint: none.
- Absence behaviour: **conditional** — "if the environment supports it". No named fallback.

**L37 — CSS specificity caveat (no tool)**
> `- Watch CSS specificity: type-based (\`.section\`) vs element-based (\`.cta\`) selectors that cancel each other out — common with section paddings/margins.`

No other external tool/binary/package/service/MCP mention in this file.

---

# 9. `skills/sailes-design/premium-craft.md`

**L7 — the pinned stack: Tailwind v4, oklch, shadcn/ui, React 19**
> `This layer is **stack-specific to the Sailes baseline**: Tailwind v4 (CSS-first, \`oklch()\` tokens) + shadcn/ui + React 19. Concrete moves below assume that stack.`
- Version constraints: **Tailwind v4**, **React 19**, shadcn/ui (unversioned).
- Absence behaviour: none stated.

**L9 — companion asset + sibling file**
> `Two companions: **\`assets/premium-tokens-starter.css\`** implements §1–3 + §7 as a ready \`@theme\` scaffold (two hue knobs) — start there instead of re-deriving ramps by hand.`

**L18 — reference calibration set: Linear, Stripe Dashboard, Vercel, Raycast, Height, Arc**
> `Default calibration set for B2B web: **Linear, Stripe Dashboard, Vercel, Raycast, Height, Arc.** The question is not "is mine good?" but "does mine look like it belongs on the same shelf?"`
- Version constraint: none.
- Absence behaviour: none stated (these are visual references, not installed tools).

**L26–27 — Tailwind v4 / oklch**
> `Premium moves (Tailwind v4 / oklch):`
> `- **Never pure black, never pure white.** ... In oklch: text \`oklch(0.20 0.02 <hue>)\`, surface \`oklch(0.99 0.005 <hue>)\``

**L43 — Stripe / Linear named as the feel to emulate**
> `An inner top highlight (\`inset 0 1px 0\` in a lighter tint) on raised cards simulates a lit edge — the Stripe/Linear card feel.`

**L57 — CSS font features**
> `- **Turn on the font's features.** \`font-feature-settings\`/\`font-variant-numeric\`: **tabular figures** in every table, price, timer, metric (already in \`ux-rules.md\` — enforce it here); contextual ligatures on; slashed-zero for data-heavy UIs.`

**L59 — CSS `text-wrap`**
> `- **\`text-wrap: balance\`** on headings, **\`text-wrap: pretty\`** on body — kills orphans and ragged headline breaks for free.`

**L110 — favicon / OG image / `<title>` / `theme-color`**
> `- **The metadata that makes it real**: a proper favicon, an OG image, a page \`<title>\` per route, \`theme-color\`. Their absence is felt as "unfinished."`

**L111 — Lucide (icon family, with shadcn)**
> `- **Icon discipline**: one family (Lucide with shadcn), one stroke width, aligned to the optical grid — never mixed sets, never emoji (\`ux-rules.md\`).`
- Version constraint: none.

**L116–122 — "Beyond stock shadcn"; `zinc`/`slate` tokens, `--radius`, ring**
> `shadcn/ui is the baseline component layer, and **untouched shadcn defaults are recognizable** — reviewers have seen a thousand apps with the exact stock button, card, and \`zinc\` palette.`
> `- Replace the default \`zinc\`/\`slate\` tokens with your **tinted** oklch ramp (§1).`
> `- Retune \`--radius\`, shadow tokens (§2), and the ring color to your system — don't ship stock values.`

**L139–140 — checklist items naming shadcn and the reference set**
> `- [ ] shadcn defaults retuned (palette/radius/shadow/ring) — doesn't read as stock`
> `- [ ] Held side-by-side against a reference (Linear/Stripe/Vercel/…), it belongs on the shelf`

**L152 — anti-pattern naming shadcn**
> `- Stock shadcn palette + defaults, untouched.`

**L13 — scope carve-out**
> `- Every app that a human stakeholder or an end customer sees. (Internal cron/worker with no UI: skip.)`
- Absence behaviour: explicit SKIP for no-UI projects.

---

# 10. `skills/sailes-design/premium-ux.md`

**L3 — Linear, Raycast, Superhuman**
> `Linear, Raycast, and Superhuman earn "premium" mostly *here*: speed, keyboard, forgiveness.`
- Version constraint: none.

**L7 — the pinned stack: TanStack Start, React Query, shadcn**
> `Scope: B2B web on the Sailes baseline (TanStack Start + React Query + shadcn). Apply to any app a person uses more than once a week; for a one-off internal form, the basics in \`ux-rules.md\` suffice.`
- Version constraint: none.
- Absence behaviour: **explicit downscope** — "for a one-off internal form, the basics in `ux-rules.md` suffice."

**L20 — React Query `onMutate`/`onError`**
> `- **Optimistic UI as the default for mutations.** Write the change to the UI immediately, sync in the background, roll back with an explanatory error if it fails (React Query \`onMutate\`/\`onError\`).`

**L21 — TanStack Router `preload: 'intent'`**
> `- **Prefetch on intent.** Prefetch route data on link hover/focus (TanStack Router \`preload: 'intent'\`). Navigation that arrives already-loaded is the single cheapest "this app is fast" win.`
- Version constraint: none.

**L23 — React Query `staleTime`**
> `- **Keep data warm.** Sensible React Query \`staleTime\` so back-navigation renders instantly from cache and revalidates quietly`

**L27 — `chrome-devtools` MCP (optional), `performance_start_trace`, `emulate`**
> `**Measuring the budget instead of intending it (optional).** With the \`chrome-devtools\` MCP available, \`performance_start_trace\` returns LCP/INP/CLS and \`emulate({cpuThrottlingRate:4, networkConditions:'Fast 4G'})\` puts the interaction under a realistic load — see \`browser-inspect.md\` §3. One hard caveat lives there and is repeated because it decides whether this is a real instrument or a fake one: **a dev server's numbers are valid only as a relative signal** ("3× slower after my change"), never as an absolute pass against the table above. Absolute thresholds are asserted on a production or preview build only — a green gate computed from an unminified HMR bundle is a step reporting success for a reason other than the one claimed.`
- Version constraint: none.
- Absence behaviour: **explicitly optional** ("optional", "With the `chrome-devtools` MCP available"); no fallback named in this file beyond deferring to `browser-inspect.md`. Validity constraint: dev-server numbers are relative-only.

**L33 — shadcn `<Command>` (⌘K palette)**
> `- **Command palette (⌘K)** for apps with >5 destinations or frequent actions: navigate, act, and search from one field (shadcn \`<Command>\`). This is the highest-status single feature in modern B2B.`
- Absence/conditionality: gated on ">5 destinations or frequent actions"; checklist L86 scopes it to "(daily-use apps)".

**L56 — Polish diacritic-insensitive search (locale requirement)**
> `- **Search that forgives**: case/diacritic-insensitive (crucial for Polish data — "lodz" finds "Łódź"), partial matches, most-recent-first suggestions.`

---

# 11. `skills/sailes-design/ux-rules.md`

**L3 — the filtered stack: Next.js / React / Tailwind / shadcn**
> `Condensed from a large UI/UX rule base, filtered for **B2B web apps** (Next.js / React / Tailwind / shadcn). Mobile-app-only rules (haptics, safe-area/notch, swipe-back, Dynamic Type) are dropped — pull them back in only if you actually ship a native/mobile surface.`
- Version constraint: none.
- Absence behaviour: mobile-only rules dropped unless a native/mobile surface ships.

**L7 — `lighthouse_audit` / `chrome-devtools` MCP (contrast verification)**
> `- Contrast ≥ **4.5:1** body text, 3:1 large text. Verify foreground/background pairs — with \`lighthouse_audit\` (accessibility) if the \`chrome-devtools\` MCP is available, which names the failing pairs and their computed ratios; see \`browser-inspect.md\` §2. Eyeballing a palette is not verification.`
- Version constraint: none.
- Absence behaviour: **conditional** ("if the `chrome-devtools` MCP is available"); the explicit stance is that eyeballing does not count as verification. Fallback path is the SKIP in `browser-inspect.md` / `SKILL.md`.

**L11 — `prefers-reduced-motion`**
> `- Respect \`prefers-reduced-motion\`: reduce/disable animation when requested.`

**L37 — `emulate({colorScheme:'dark'})` for dark-mode contrast**
> `- Dark mode (if any): desaturated/lighter tonal variants, not inverted colors; test its contrast separately — \`emulate({colorScheme:'dark'})\` then re-run the audit (\`browser-inspect.md\` §2), rather than assuming the light-mode pass carries over.`
- Absence behaviour: conditional on dark mode existing ("if any"); instrument conditional inherited from `browser-inspect.md`.

**L48 — Lucide / Heroicons (SVG icon sets)**
> `- **No emoji as structural icons** — use an SVG set (Lucide/Heroicons), consistent stroke width + size tokens; one icon family.`
- Version constraint: none.

**L51 — WebP / AVIF image formats**
> `- Images: WebP/AVIF, declare width/height (or aspect-ratio) to avoid layout shift (CLS), lazy-load below the fold.`

**L26 — viewport meta / breakpoints**
> `- Mobile-first; systematic breakpoints (e.g. **375 / 768 / 1024 / 1440**). No horizontal scroll. \`width=device-width, initial-scale=1\` (never disable zoom).`

**L27 — Tailwind class names (`max-w-6xl/7xl`)**
> `- **8pt spacing system** (4/8/12/16/24/32/48…). Consistent desktop max-width (\`max-w-6xl/7xl\`).`

**L29 — `min-h-dvh` over `100vh`**
> `Prefer \`min-h-dvh\` over \`100vh\`.`

**L44 — `aria-live="polite"` / semantic input types**
> `- Semantic input types (\`email\`, \`tel\`, \`number\`) to trigger the right keyboard. Toasts auto-dismiss 3–5s, \`aria-live="polite"\`, don't steal focus.`

**L66 — checklist item requiring a measurement OR an explicit SKIP**
> `- [ ] Contrast ≥4.5:1; focus visible; keyboard nav works; reduced-motion respected — ticked from a measurement (audit + \`press_key('Tab')\` re-snapshot per \`browser-inspect.md\` §2), or from an explicit SKIP. A tick with neither behind it is the failure this checklist exists to prevent.`
- Absence behaviour: **explicit** — tick must be backed by a measurement or an explicit SKIP.

---

# 12. `skills/sailes-design/assets/premium-tokens-starter.css`

**L2 — Tailwind v4 (`@theme`), oklch, shadcn retune**
> `   Premium tokens starter — Tailwind v4 (@theme, oklch) + shadcn retune`
- Version constraint: **Tailwind v4**.
- Absence behaviour: none stated. L5–6:
> `   NOT a final design: set the two hue knobs + type choices from the design`
> `   artifact (MASTER.md / ui-spec.md), then delete what the project doesn't use.`

**L17 — `@theme` at-rule (Tailwind v4 CSS-first API)**
> `@theme {`

**L95 — `.dark` class convention**
> `.dark {`

**L131–135 — WebKit + Firefox scrollbar properties**
> `/* Tinted thin scrollbar (WebKit + Firefox) */`
> `* {`
> `  scrollbar-width: thin;`
> `  scrollbar-color: oklch(0.75 0.01 var(--hue-neutral)) transparent;`
> `}`
- Version constraint: none; browser-engine specific (`WebKit`, `Firefox`).

**L137–139 — `text-wrap: balance` / `pretty`**
> `h1, h2, h3 { text-wrap: balance; }`
> `p          { text-wrap: pretty; }`

**L141–144 — `font-variant-numeric: tabular-nums`**
> `table, [data-numeric] {`
> `  font-variant-numeric: tabular-nums;`
> `}`

**L147 — `prefers-reduced-motion`**
> `@media (prefers-reduced-motion: reduce) {`

**L155–174 — shadcn semantic variable mapping**
> `/* ── shadcn retune (premium-craft "beyond stock") ─────────────────────────`
> `   Map shadcn's semantic vars onto this system so components stop reading`
> `   as stock. Extend per-component (density, height) in the design artifact. */`
> `:root {`
> `  --background: var(--color-surface-page);`
> …
> `  --radius: var(--radius-control);`
> `}`
- Named shadcn vars: `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--muted`, `--muted-foreground`, `--border`, `--input`, `--ring`, `--destructive`, `--radius`.

---

# 13. `skills/sailes-async/SKILL.md`

**L3 (frontmatter description) — Make / n8n / Zapier; Inngest / Temporal / BullMQ; Slack**
> `Use when a slow, brittle, or sleep-padded integration flow (often on Make/n8n/Zapier) needs to become a FAST, durable, code-first async backend`
> `"Slack alert na błąd", "≤5s / budżet czasowy", "Inngest / Temporal / BullMQ", "parallel-compute + async write-back"`
- Version constraint: none.
- Absence behaviour: n/a (trigger vocabulary).

**L10 — Make/n8n/Zapier as the incumbent**
> `You have a process — typically a chain of Make/n8n/Zapier scenarios, or a synchronous request handler — that is too slow (sleeps, sequential API calls, polling)`

**L13 — HMAC, Slack (implied via alert), harness hard rules**
> `- **🔒 Hard rules** — the harness (idempotency on every external write, audit per step, alert on every failure, HMAC intake, deterministic step bodies).`

**L18 — Inngest; the SRF/Volubus/Alubus reference build; Make**
> `This skill is distilled from a real Sailes build — the **SRF async orchestrator** (Volubus/Alubus): 3 chained Make scenarios with 2× 300s sleeps (~5 min of pure latency) reimplemented as an Inngest pipeline that lands **price + AI-qualification in ≤5s**.`
- Version constraint: none.

**L29 — when NOT to use: Make/n8n, BullMQ, Temporal/Kafka**
> `**Do NOT use when:** the flow is genuinely simple and low-volume (keep it in Make/n8n — a durable engine is operational overhead you'll regret); you need step-level retry/replay you don't actually have a requirement for (a plain queue like BullMQ is enough — see \`async-compendium.md §engine\`); there is no spec/brief yet (run \`sailes-discovery\`/\`sailes-spec\` first); the real bottleneck is throughput at massive scale (that's a different problem — Temporal/Kafka territory).`
- Version constraint: none.
- Absence/downscope behaviour: **explicit** — stay on Make/n8n for simple low-volume flows; BullMQ suffices without step-level retry; Temporal/Kafka for massive throughput.

**L40 — `sailes-database` dependency for harness tables**
> `It leans on \`sailes-database\` for the harness tables (idempotency / audit / external-object-links) and hands the step bodies to \`sailes-implement\`.`

**L51 — Make/n8n blueprints as untrustworthy input; live probing with real credentials**
> `🔒 **Blueprints & summaries lie — treat them as leads, not truth.** A Make/n8n blueprint's \`{{N.data.X}}\` is the *tool's* HTTP envelope, not the API's real response shape; prose summaries under-list written fields and hide router-filter gates. Walk the raw export, and **probe the live endpoint with real credentials** before writing a single schema.`
- Absence behaviour: none stated for missing credentials at this location.

**L60 — engine decision card: Inngest / Temporal / BullMQ / Trigger.dev**
> `| **Durable engine** (Inngest / Temporal / BullMQ / Trigger.dev) | once the build decision is yes |`
- Version constraint: none.
- Absence behaviour: presented as a user-owned decision card, never chosen for the user (see L123 Red Flag).

**L61 — self-host vs managed cloud**
> `| **Self-host vs managed cloud** | keep the cloud fallback explicitly open |`
- Absence behaviour: **explicit** — the managed-cloud fallback stays open as a documented option.

**L63 — HMAC and caller capability**
> `| **Auth the real caller can actually satisfy** | HMAC only works if the caller can sign |`
- Absence behaviour: **explicit** — if the caller cannot sign, HMAC is not viable; pick an auth mode it can satisfy (detail in `harness-checklist.md` item 1).

**L75 — Fastify (named example for the thin intake app)**
> `The **shape** to recommend by default (the SRF pattern): **thin intake app** (HTTP, e.g. Fastify) that only \`verify signature → validate → persist raw → claim idempotency key → emit an event carrying IDs only → 202\``
- Version constraint: none; explicitly "e.g.".

**L86 — engine batch barrier (Inngest-class engines)**
> `- The engine's **batch barrier**: a durable engine dispatches a parallel step-layer, then re-plans only after the *whole* batch drains — so a fast step waits for a slow sibling **even with no data dependency**. A JS dataflow runner cannot cross this. *Fix: put the slow work in a separate function/run.*`

**L87 — `waitForEvent` (engine API)**
> `- **\`waitForEvent\` suspends the function** — \`Promise.all([compute, waitForEvent])\` will **not** start compute until the event arrives. Run the compute *first*, then wait.`

**L93 — Postgres error code `23505`; link table**
> `- **Idempotency, two layers:** (a) intake dedupe — an idempotency key from a stable business id, unique-constrained, \`23505\` → return "duplicate" *before* emitting`
> `(b) external-write dedupe — a \`businessId → externalId\` **link table** read *before* every create, \`onConflictDoNothing\` + re-select, search-before-create where the vendor has a natural key.`
- Note: `onConflictDoNothing` is Drizzle/ORM API surface.

**L95 — Slack webhook + boot-time config guard**
> `- **Alert on every failure:** a Slack webhook naming the **exact failed stage** + a link back to the run; the alerter **never throws**; a **boot-time config guard** errors loudly if the webhook is unset.`
- Version constraint: none.
- Absence behaviour: **explicit** — if the webhook is unset, a boot-time guard **errors loudly** (hard failure at startup).

**L96 — per-step engine overhead figures**
> `size the **retry granularity** deliberately — per-phase, not per-I/O (fine-grained steps cost ~250–600ms engine round-trip *each*; 24 steps = 7–9s of pure overhead that blows a ≤5s budget).`

**L104 — Zod (wire-response validation), injectable `fetch`**
> `- **Typed input → call → Zod-validate the wire response → return a narrow domain type**; a typed \`Error\` subclass carrying \`{path,status}\`, **never logs secrets**.`
> `- **Injectable deps** (\`fetch\`, creds, \`now\`) with env fallback → unit-testable with no network.`
- Version constraint: none.
- Absence behaviour: env fallback for injectable deps; "unit-testable with no network".

**L106 — PUT verb, hashed custom-field keys**
> `- **Idempotent writes** — stable keyed writes (e.g. hashed custom-field keys transcribed *verbatim*, never guessed), correct overwrite verb (PUT), search-before-create.`

**L111 — probe scripts (throwaway, uncommitted)**
> `- Write throwaway **probe scripts** (outside \`src/\`, uncommitted): a live API-shape probe, a **timeline forensic** (reconstruct per-step wall-clock from the audit log, flag gaps >800ms), an e2e that asserts real DB rows + the real external record, a **self-cleaning dry-run** that exercises full logic with fake writes (so no junk CRM records / no real emails fire).`

**L113 — deploy gate: Inngest `start`, hex keys, worker callback host, migrations, `.env.example`, Slack webhook test-fire**
> `- **Deploy gate** (self-hosted engine): prod signing/event keys are the right format (hex for Inngest \`start\`), worker callback host is reachable, migrations reviewed & applied (never auto-run prod), secrets rotated from \`.env.example\` defaults, Slack webhook **test-fired**. After deploy: send a signed test webhook, watch the run, **replay it and confirm no duplicate**, confirm the read is within budget. Keep the managed-cloud fallback open.`
- Version constraint: key format **hex** for `inngest start`.
- Absence behaviour: **explicit** — "Keep the managed-cloud fallback open."

**L117 — Red Flag: Make/n8n blueprint as spec**
> `- You're treating **"port the Make/n8n blueprint"** as the spec. It lies about response shapes, hides router gates, and encodes dead modules. Probe the live API first.`

**L118 — Red Flag: mocks/typecheck as proof**
> `- You **trust a mock / green typecheck** as proof an external contract works. Every real bug here passed unit tests. Drive the real system.`

**L123 — Red Flag: choosing the engine for the user**
> `- You picked the **engine / self-host / sync-vs-defer split FOR the user** instead of a decision card.`

**L138–142 — reference-file map**
> `- \`async-compendium.md\` — the *why*: engine selection, durable-function anatomy, fan-out/join, two-lane split, adapter pattern, schema decisions.`
> `- \`speedup-recipe.md\` — the latency-reduction method (9 steps) + sync-vs-defer + the async-write-back traps.`
> `- \`harness-checklist.md\` — the 15-item hard harness every durable async backend needs before it's trustworthy.`
> `- \`lessons.md\` — the hard-won gotchas (how not to get burned) + the verify-by-driving probe discipline.`

---

# 14. `skills/sailes-async/async-compendium.md`

**L9–15 — the full engine comparison table**
> `| **Inngest (self-hosted)** | Step-level retry **from the exact failure**; built-in dashboard = the supervision UI for free; fan-out/parallel steps; event idempotency; TS-native, strong types | Needs Postgres **+ Redis** to operate; the executor batches step-layers (see §barrier); dev-vs-prod key handling has footguns |`
> `| **Temporal** | The most powerful durable-execution model | Heavy ops (a cluster); **overkill** at medium scale |`
> `| **BullMQ + Redis** | Simple, well-understood queue | **Job-level, not step-level** retry; poor dashboard; you hand-roll orchestration |`
> `| **Trigger.dev** | Similar durable model, managed | Younger ecosystem |`
> `| **Make / n8n / Zapier** (the incumbent) | Fast to prototype, visual | **Can't cleanly fan-out-and-join** async work; no step-level retry; sleeps pad latency; no real audit/idempotency harness |`
- Version constraints: none.
- Hard dependency stated: **self-hosted Inngest needs Postgres + Redis**.

**L17 — how SRF chose; Redis accepted only because Inngest requires it**
> `**How SRF chose Inngest self-hosted:** single firm, 50–500 bookings/day, owner wanted self-hosted (no AWS), "quality over speed", and an **AI-agent build team → favor explicitness, one convention, strong types**. Inngest's dashboard *is* the supervision UI, so no admin UI was built (a full-stack framework was rejected as "wasted SSR — no UI"). Redis is accepted operational surface, taken *only because* self-hosted Inngest requires it.`
- Named: Inngest, Redis, AWS (as the thing avoided).

**L19–22 — when each is overkill / wrong**
> `- Temporal — if you don't need replay + step-granular retry, it's a cluster you'll operate for nothing.`
> `- BullMQ — *enough* if you only need job-level retry and no supervision dashboard; then a durable engine is over-engineering.`
> `- Building anything custom — if the flow is simple, low-volume, and has no hard harness requirement, **stay on Make/n8n**.`
- Absence/downscope behaviour: **explicit** for all three.

**L24 — self-host vs managed cloud, ADR trigger**
> `🔀 **Self-host vs managed cloud:** self-hosting adds real operational surface (keys, container networking, the extra Redis). **Keep the managed-cloud fallback explicitly open** as a documented ADR trigger ("if self-hosting proves heavy, move to <engine> Cloud") — SRF did.`
- Absence behaviour: **explicit documented fallback** to managed cloud.

**L28 — `engine.createFunction`, `step.run`, `retries: N`**
> `A durable function = \`engine.createFunction(config, trigger, handler)\`. The unit of durability is **one \`step.run(id, fn)\`**: the engine **memoizes** a step's return value once it succeeds, so on a later failure + replay, completed steps are **not re-executed** — only the throwing step retries (up to \`retries: N\`).`

**L32–44 — step-harness pseudocode naming `alertSlack`**
> `    await alertSlack({ stage: step.name, error });   // alert never throws`
- Absence behaviour: alert never throws (harness's own failure must not corrupt the error path).

**L50 — determinism: no `Date.now()` / `Math.random()`**
> `- **Determinism** — inject \`now\` and all side-effect seams via a \`deps\` object; **never call \`Date.now()\`/\`Math.random()\` inside a step body** or replays diverge. As a bonus, injectable deps make every step unit-testable with in-memory fakes.`

**L58 — Kahn sort (cycle detection)**
> `- **Validate the graph up front:** reject duplicate names, unknown deps, and cycles (Kahn sort) — an async scheduler deadlocks silently on a cycle.`

**L59 — `Promise.all`**
> `- **Two layers of parallelism:** intra-step \`Promise.all\` (batch independent API calls inside one step) **and** cross-step \`dependsOn\` fan-out.`

**L63–67 — §barrier, measured numbers**
> `Measured in SRF: \`create-deal\` (depends on \`price\` alone) started ~200ms *after* the slow \`qualify-compute\` (2.8s) finished — price-on-deal was "hostage to qualify latency". **A JS dataflow runner cannot fix this** — the executor decides layer dispatch.`
> `Related retry-granularity finding: those same per-step engine round-trips cost ~250–600ms **each**; ~24 fine-grained steps measured 14.4s (7–9s pure overhead), blowing the ≤5s budget. Collapse to ~8 coarse phases`

**L72–86 — adapter template: `fetch`, Zod (`z.object`, `safeParse`)**
> `type XDeps   = { fetch?, ...creds, baseUrl? }        // injectable, env-fallback via resolveDeps()`
> `const wireSchema = z.object({ … })                     // the vendor's real response, validated`
> `  const parsed = wireSchema.safeParse(await res.json())`
- Version constraint: none.
- Absence behaviour: env fallback via `resolveDeps()`.

**L90 — Make blueprint envelope vs real API shape**
> `- **Validate the wire response with Zod, return a narrow domain type** — don't leak the vendor's envelope. (A Make blueprint's \`{{N.data.X}}\` is Make's HTTP *envelope*, not the API's shape — probe the live API and validate against *that*.)`

**L95–98 — idempotent writes; Pipedrive verb verified live**
> `- **Link table** \`businessId → externalId\`, read *before* every create; \`onConflictDoNothing\` + re-select.`
> `- **Search-before-create** where the vendor has a natural key (e.g. person by email).`
> `- **Stable keyed writes** — e.g. hashed custom-field keys transcribed **verbatim** from the source (writing a mistyped key corrupts data invisibly; test the keys, and *omit* any you can't verify rather than guess).`
> `- **Correct overwrite verb** — verify it live (SRF: Pipedrive v1 deal update is PUT; PATCH/POST 404).`
- Version constraint: **Pipedrive v1** (deal update = PUT).
- Absence behaviour: **explicit** — "*omit* any you can't verify rather than guess."

**L102 — typed events, Zod schemas, id-only payloads**
> `Event names as a const map; **each event's payload has its own Zod schema + inferred type**; the payload carries **only stable IDs** (e.g. \`{submissionId, dealId}\`), never whole objects.`

**L107–113 — harness tables, Postgres types (`jsonb`), and the DRY handoff to `sailes-database`**
> `- \`webhook_events\` — append-only raw intake (\`raw_payload jsonb\`, \`signature_valid\`, \`status\`).`
> `- \`idempotency_keys\` — unique on \`key\`; the intake dedupe.`
> `- \`external_object_links\` — unique on \`(business_id, system, external_type)\`; the external-write dedupe.`
> `- \`audit_logs\` — per-step \`input/output/status\` (\`actor_type\`, \`metadata jsonb\`), indexed by business id + time.`
> `Full schema-decision rationale (PK by exposure, enums vs lookup, jsonb usage, soft-delete) lives in \`sailes-database/db-compendium.md\` — don't restate it`

---

# 15. `skills/sailes-async/harness-checklist.md`

**L7–8 — HMAC/SHA-256, `crypto.timingSafeEqual`, IP allowlist**
> `1. **Verify signature/HMAC BEFORE anything else.** SHA-256 over the *raw* body (exact bytes, captured before JSON.parse), timing-safe compare (\`crypto.timingSafeEqual\`) with a length pre-check and a missing-signature guard; failure → 401, nothing downstream runs.`
> `   - ⚠️ **HMAC ≠ replay defense.** A re-sent valid signature is still valid — replay protection comes from the idempotency key (item 4), not the signature. And: **HMAC only works if the real caller can sign.** If the production form/source cannot produce a signature, pick an auth mode it *can* satisfy (shared-secret token, constant-time compared, + optional IP allowlist) *before* cutover. Never ship an unauthenticated intake on a PII-handling, record-creating endpoint.`
- Version constraint: none (`crypto` = Node builtin).
- Absence behaviour: **explicit** — if the caller cannot sign, switch to a shared-secret token (constant-time compared) + optional IP allowlist, before cutover; never ship unauthenticated.

**L9 — Zod / schema validation at the boundary**
> `2. **Validate the payload at the boundary** (Zod/schema, no \`any\`); reject on failure (400). *Why:* the durable pipeline must never see malformed data.`
- Version constraint: none. Alternative named inline: "Zod/schema".

**L10 — `webhook_events` with `raw_payload jsonb` (Postgres)**
> `3. **Persist the raw event append-only** (\`webhook_events\` with \`raw_payload jsonb\`, \`signature_valid\`, \`status\`).`

**L11 — PG error code `23505`**
> `4. **Claim an idempotency key derived from a stable business id**, unique-constrained; catch the unique violation (PG \`23505\`) → return "duplicate" **before** emitting.`

**L16 — per-step engine round-trip cost**
> `6. **Business logic in independently-retryable steps; size retry granularity deliberately.** Prefer *per-phase* over *per-I/O* — fine-grained steps cost ~250–600ms engine round-trip *each* (24 steps ≈ 7–9s of pure overhead that blows a ≤5s budget).`

**L17 — link table, `onConflictDoNothing`, `onConflictDoUpdate`, PUT**
> `7. **Every externally-effecting step must be idempotent.** Read-before-create via a \`businessId → externalId\` **link table** (unique on \`(businessId, system, type)\`, \`onConflictDoNothing\` + re-select to survive concurrent duplicate deliveries); search-before-create where the vendor has a natural key; updates as PUTs; local rows via \`onConflictDoUpdate\`.`
- Note: `onConflictDoNothing` / `onConflictDoUpdate` are Drizzle ORM API names.

**L25 — Slack webhook, never-throwing alerter**
> `12. **Alert on failure to a human channel, and never let alerting throw.** A Slack webhook carrying the **exact failed stage name** + a link back to the run; swallow + log on the alerter's own failure.`
- Version constraint: none.
- Absence behaviour: alerter failure is swallowed + logged, never propagated.

**L26 — boot-time config guard for the alert channel**
> `13. **Boot-time config guard for the alert channel** — loudly error at startup if the alert webhook is unset/malformed, and **test-fire it** before deploy. *Why:* a misconfigured webhook silently defeats "alert on every failure" — the harness's own P0.`
- Absence behaviour: **explicit hard failure** — the process errors loudly at startup if the webhook is unset/malformed.

**L28 — structured logger, secrets in env only, auth'd read endpoints**
> `15. **Structured logger; secrets in env only, never logged; read/status endpoints behind auth** (timing-safe), returning only entitled fields from a read model — not the raw payload.`

**L32–34 — cross-link to `sailes-test`**
> `Each hard rule above is architecture; this is its executable proof. \`sailes-test\` turns these into`
> `assertions — the techniques and the full async case set live in`
> `[\`sailes-test/references/techniques.md\`](../sailes-test/references/techniques.md). One row per item;`
> `a rule with no test is a rule you are trusting on faith.`

**L51 — test for the boot-time guard**
> `| 13 | Boot-time alert-config guard | boot with the alert webhook unset/malformed → the process errors loudly at startup (assert it refuses to start, not that it warns). |`

**L50 — test for the never-throwing alerter (Slack)**
> `| 12 | Alert on failure, never let alerting throw | a forced step failure produces a Slack call carrying the exact failed stage name; a **failing alerter** is swallowed and logged, and does not corrupt the original error path. |`

**L57–63 — Postgres schema hard rules**
> `- \`timestamptz\` for every moment in time (never \`timestamp\`).`
> `- \`text\` (+ \`CHECK\` only if genuinely needed), \`numeric(12,2)\` for money (never the \`money\` type).`
> `- **Every lookup / link / FK-like column indexed**; **unique indexes on all idempotency & link keys.**`
> `- **PK type by exposure, not by default:** \`bigint GENERATED ALWAYS AS IDENTITY\` when ids stay internal (public lookups key on the business id, e.g. a submission UUID); reach for UUIDv7 only if ids are externally exposed or generation is distributed.`
> `- **Orthogonal status enums per independent lifecycle** ... New enum values via \`ALTER TYPE … ADD VALUE\` (mind its transaction-boundary quirk on migrate).`
> `- **Keep the orchestrator's run-state in the orchestrator, business-idempotency in the DB.** Don't duplicate the engine's durable run state in your own tables. \`sync_runs\`/\`integration_accounts\` are *conditional* — needed only if your engine doesn't already persist run state.`
- Version constraint: **UUIDv7** named; PostgreSQL DDL syntax throughout.
- Absence/conditionality: `sync_runs`/`integration_accounts` tables are *conditional* on the engine not persisting run state.

**L65–71 — the four P0s (Slack named as sufficient alert channel)**
> `2. **Alert on every failure** (a Slack webhook is enough).`

---

# 16. `skills/sailes-async/speedup-recipe.md`

**L7 — Make `Sleep 300s`**
> `In SRF the table exposed that 2× \`Sleep 300s\` (~5 min) dwarfed everything else — before any clever async, that was the win.`

**L24 — LLM/API hop replacement; `Promise.all`**
> `**7. Parallelize independent calls within a slow step; determinize what you can.** The N-LLM pattern: run independent checks concurrently (\`Promise.all\`), keep only the true aggregator sequential (it consumes the others). Replace LLM calls with deterministic code wherever the output is derivable — SRF replaced 5 of 7 LLM/API hops (currency, vehicle-class, rounding, rules-gate, same-day-return feasibility) with pure functions. Deterministic steps need no retry and can't drift.`

**L26 — LLM API parameters: `reasoning_effort`, `max_completion_tokens` vs `max_tokens`, `temperature`**
> `**8. Tune the long pole.** After structure, attack the single slowest call. In SRF the qualify model was a reasoning model running ~7.8s/call; \`reasoning_effort: "minimal"\` cut it to ~1.5s/call for the *same verdict* → qualify ~3.4s. (It also needed \`max_completion_tokens\`, not \`max_tokens\`, and no custom \`temperature\`.) Structure alone would not have hit budget without this.`
- Version constraint: none; parameter names imply an OpenAI-style reasoning-model API (`reasoning_effort`, `max_completion_tokens`).
- Absence behaviour: none stated; noted that "no custom `temperature`" was required.

**L33–38 — the BEFORE diagram: Make, OpenAI, Google Maps ("Maps×2"), Pipedrive**
> `BEFORE (Make, sequential, ~5 min):`
> `  SRF POST`
> `   └─[1] Booking: OpenAI city → Maps×2 → Pipedrive person+deal → Sleep 2s → webhook → email`
> `        └─[2] Price: GetDeal → OpenAI normalize → geocode×2 → VAT → /calculation → UpdateDeal`
> `              → Sleep 300s ───────────── (5 MINUTES) ───────────── → webhook`
> `                   └─[3] Qualify: Sleep 1s → GetDeal → LLM ×4 (sequential) → UpdateDeal (payment gate)`
> `  (page polls Pipedrive every 5s until the deal appears)`
- Named externals: **Make**, **OpenAI**, **Maps** (geocoding/distance), **Pipedrive**.

**L41–53 — the AFTER diagram: durable engine functions, HMAC, Zod, Airtable, email webhook**
> `AFTER (durable engine, two parallel lanes off one event):`
> `  SRF POST → 202  (intake: HMAC → Zod → persist raw → claim idempotency key → emit event)`
> `   ├── PRICE LANE (fn \`pricing\`) ───────────── CRITICAL PATH, ≤5s`
> `   │       → { resolve-cities ‖ derive-fields ‖ upsert-person ‖ price }   (fan-out)`
> `   │       → { ack-email ‖ airtable ‖ downstream-webhook }  (best-effort)`
> `   └── QUALIFY LANE (fn \`qualify\`) ──────────── DEFERRED / async write-back`
> `           ‖ waitForEvent(\`deal.created\`)  →  update-qualification PUT   [verdict ~3–5s]`
- Named externals: **HMAC**, **Zod**, **Airtable**, an ack-email service, a downstream webhook.
- Absence behaviour: the email/airtable/webhook lane is marked **best-effort** (failures do not fail the run).

**L59–62 — Trap A: self-hosted Inngest, ADR-004**
> `### Trap A — the engine's batch barrier (the hardest lesson; ADR-004)`
> `A durable-workflow engine (self-hosted Inngest here) **dispatches a parallel step-layer, then re-plans the function to discover the next steps only after the WHOLE batch drains.**`
> `**A correct in-process JS dataflow runner does NOT fix this** — the executor, not your code, decides when the next layer dispatches.`
- Version constraint: none.
- Absence/workaround behaviour: **explicit** — split latency-critical and slow work into separate durable functions/runs.

**L64–66 — Trap B: `step.run` / `step.waitForEvent` / `Promise.all`**
> `\`Promise.all([step.run(compute), step.waitForEvent(...)])\` does **not** run compute concurrently — \`waitForEvent\` suspends the whole function, so compute starts only when the event lands (measured ~2.7s late, pushing the verdict to ~5.5s).`
> `**Fix:** run the compute **first**, then resolve the cross-run dependency via a **durable read you know is already written** (the external-object link table), keeping \`waitForEvent\` only as a fallback.`
- Absence behaviour: `waitForEvent` demoted to fallback; primary path is a durable link-table read.

**L68–70 — Trap C: missed-event race, belt-and-suspenders fallback**
> `**Fix (belt-and-suspenders):** (1) order it so the consumer's wait begins before the producer emits ...; **and** (2) a direct fast-path read of the link table in case the record already exists.`

**L74–77 — named trade-offs**
> `- **Speculative price + eventual consistency:** ...`
> `- **Two failure domains + last-writer race:** two lanes writing the same external object need a **single writer** per field and deliberate write ownership (in SRF: price lane owns creation, qualify lane owns the stage move); otherwise last-writer-wins corrupts state.`
> `- **Coarser retry granularity:** ... Safe *only* if every phase is idempotent.`

---

# 17. `skills/sailes-async/lessons.md`

**L7 — L1: Node ESM / Windows / `pathToFileURL` / `import.meta.url` / `process.argv`**
> `**L1 — Windows ESM entry-point check silently exits.** \`import.meta.url === \\\`file://${process.argv[1]}\\\`\` never matches on Windows → \`main()\` never runs, the server exits 0 and never listens. Unit tests + typecheck did **not** catch it; only driving the real server did. → Use \`pathToFileURL(process.argv[1]).href\`; verify by driving, not by tests.`
- Version constraint: none. Platform constraint: **Windows**.
- Absence/failure behaviour: silent exit 0; fix is `pathToFileURL(...).href`.

**L9 — L2: low-code blueprint router filters**
> `**L2 — Reverse-engineered summaries miss router-filter GATES.** ... → Treat prose summaries as **leads, not ground truth**; walk the raw blueprint JSON and diff every written field + every router filter before claiming parity.`

**L11 — L3: low-code blueprint `{{N.data.X}}`, Zod, `curl` with real creds, ISO `T` datetime**
> `**L3 — A low-code blueprint's \`{{N.data.X}}\` is the tool's HTTP envelope, not the API's shape.** They copied \`{data:{vat}}\` into Zod schemas; the live API returns **flat** objects, so the schema rejected every real response. Unit tests passed because they mocked the wrong shape. → **Never trust a blueprint for an external API's response shape — probe the live endpoint (curl with real creds) before writing the Zod schema.** (Also: some APIs need ISO \`T\` datetime; a space → HTTP 400. Normalize at the adapter boundary.)`
- Named tools: **curl**, **Zod**.

**L13 — L4: `inngest start` / `inngest dev`, `INNGEST_DEV`, `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY`, Postgres, Redis, port 8288**
> `**L4 — Self-hosted engine dev-vs-prod key handling.** \`inngest start\` with a non-hex signing key crashes ("must be hex") → nothing on :8288 → \`send()\` fails ECONNREFUSED → intake 500s. → Locally use \`inngest dev --no-discovery -p 8288\` (no keys, SDK connects via \`INNGEST_DEV=1\`); prod uses \`inngest start\` with **hex** \`INNGEST_SIGNING_KEY\` + \`INNGEST_EVENT_KEY\` + Postgres/Redis URIs. Generalizes to any self-hosted engine: the local and prod boot modes differ, and the difference is a silent-failure footgun.`
- Version constraint: key format **hex**; port **8288**; flags `--no-discovery`, `-p 8288`.
- Absence/failure behaviour: **hard failure** — non-hex key crashes the engine; downstream `send()` fails ECONNREFUSED and intake returns 500.

**L15 — L5: Pipedrive HTTP verbs verified live**
> `**L5 — Verify the HTTP verb against the live API.** \`updateDeal\` used PATCH → live Pipedrive returns \`404 "Unknown method"\`; every deal update silently failed the stage. The fake \`fetch\` returned success for any method and the test *asserted PATCH* (encoding the bug). → Probe the verb; don't trust a permissive mock. (Live: PATCH 404 · PUT 200 · POST 404.)`
- Version constraint: none stated here (`async-compendium.md` L98 pins Pipedrive **v1**).

**L17 — L6: containerized Inngest, `INNGEST_SERVE_HOST` / `INNGEST_SERVE_PATH`, Docker, `host.docker.internal`**
> `**L6 — Container callback host wiring.** A containerized engine derives the worker's serve URL from the incoming request host and got \`localhost\` = the container itself → "couldn't find application", events ingest but never run. A home-grown \`INNGEST_SERVE_ORIGIN\` var was a decoy — the SDK ignores it. → Set the SDK's own \`INNGEST_SERVE_HOST\`/\`INNGEST_SERVE_PATH\` (\`host.docker.internal\` in Docker), re-register, and confirm the app shows \`connected: true\`.`
- Named: **Docker**, `host.docker.internal`, the Inngest SDK env vars.
- Absence/failure behaviour: events ingest but never run; a custom env var is silently ignored.

**L19 — L7: `step.run` / `step.waitForEvent` / `Promise.all`** (duplicate of `speedup-recipe.md` Trap B)
> `**L7 — \`waitForEvent\` suspends the function.** \`Promise.all([step.run(compute), step.waitForEvent(...)])\` did not run compute concurrently — compute started only when the event landed (~2.7s late). → Run compute **first**, then resolve cross-run dependencies via a **durable read you know is already written** (the link table), keeping \`waitForEvent\` as a fallback. (Also in \`speedup-recipe.md\` Trap B.)`

**L21 — L8: engine batch barrier** (duplicate of Trap A / §barrier)
> `**L8 — The engine batches a parallel step-layer; a downstream step waits for the WHOLE batch.** ... A JS dataflow runner cannot cross this. → To decouple a fast step from a slow peer in wall-clock, **split into separate functions/runs** (independent executor timelines). This is the single biggest architectural lesson — it drove the two-lane split. (Also in \`speedup-recipe.md\` Trap A + \`async-compendium.md §barrier\`.)`

**L23 — L9: `PIPEDRIVE_COMPANY_DOMAIN`, `new URL(...)`, `ENOTFOUND`**
> `**L9 — Config footguns hide behind fakes.** A \`PIPEDRIVE_COMPANY_DOMAIN\` set to a full URL produced \`new URL("https://https://…")\` → \`ENOTFOUND https\`. The dry-run faked Pipedrive so it stayed hidden until the real e2e. → Harden adapters against config shape (strip scheme), and run at least one e2e against the real dependency.`
- Named env var: `PIPEDRIVE_COMPANY_DOMAIN`.
- Absence/failure behaviour: fakes hide config-shape bugs; mitigation is ≥1 real-dependency e2e.

**L25 — L10: per-step engine overhead**
> `**L10 — Fine-grained steps blow the latency budget.** ~24 per-action durable steps measured 14.4s, ~7–9s of it pure per-step engine round-trip overhead (~250–600ms each). → Coarsen to ~8 phase-level steps; retry granularity is a **latency trade**, and coarse retry demands idempotency on every phase.`

**L29–32 — business-flow audit (dated 2026-07-06); Volubus; Slack; ack-email**
> `The 2026-07-06 business-flow audit's stated goal: *"find where our reimplementation is business-wrong, not just where it deviates from Make."*`
> `1. **Transient failures made permanently terminal** — a caught Volubus error was turned into a terminal state with zero retries.`
> `3. **Silent side-effect failures** — ack-email + Slack failures were swallowed, violating the P0 "alert on every failure". → The harness's *own* delivery failures must be observable (boot-time config guard + never-throw-but-do-log alerter).`
- Named externals: **Volubus** (the pricing API), **Slack**, ack-email.
- Date: audit **2026-07-06**.

**L34 — LLM: model sweep, labelled eval, `reasoning_effort` tune, latency 3–18s**
> `**LLM-specific:** verbatim-porting a low-code prompt over-rejected valid inputs on *every* model — the root cause was the **prompt, not the model** (proven by a model sweep). LLM latency is highly variable (3–18s), threatening a tight budget. → An LLM ported 1:1 is not "done"; it needs a labelled eval, a determinization pass for what doesn't need AI, and a latency/\`reasoning_effort\` tune.`

**L38–43 — probe-script categories; CRM records, emails, webhooks, supplier sendouts**
> `The SRF worker carried ~30 **throwaway probe scripts** outside \`src/\` (uncommitted, each with a copy-paste run line) — the physical embodiment of "evidence over assertion".`
> `- **Live API-shape probes** — hit the real external API, bypass your own validation, to distinguish a business no-result (e.g. 404) from a technical failure.`
> `- **Timeline forensics** — reconstruct per-step wall-clock from the audit log, flag any gap >800ms.`
> `- **E2E result verification** — assert real DB rows **and** the real external record after a drive.`
> `- **Self-cleaning dry-runs** — exercise full business logic against real read-side dependencies with **fake writes**, so no junk CRM records are created and no real emails/webhooks/supplier-sendouts fire. (Safety-critical: in SRF, reaching a certain deal stage triggers a real supplier sendout, so real tests use a skip-write flag.)`
> `- **Parameter sweeps** — geocode a real sample once, sweep algorithm variants in-memory against ground truth, and **decide on measurement / defer on ROI** (a city-matching idea was killed by a sweep showing 0.4–1.7% ROI).`
- Absence/safety behaviour: **explicit** — real tests use a **skip-write flag** so no real supplier sendout fires.

**L49–52 — methodology (no external tools)**
> `- **Verify-by-driving over green checkmarks** — "Behavior before diff: drive the real flow (send a webhook → watch the run → assert DB rows) and show output."`
> `- **Decisions as ADRs with a *measured* reason** — the two-lane split and retry granularity are ADRs backed by timings, not guesses.`

---

## Appendix — cross-slice observations (recorded, not synthesised)

- The `chrome-devtools` MCP server is the single most heavily cross-referenced external dependency in this slice, mentioned in 5 of 17 files: `sailes-test/references/browser-e2e.md` L84, `sailes-design/SKILL.md` L76 + L101 + L104 + L111–112, `sailes-design/browser-inspect.md` (throughout), `sailes-design/premium-ux.md` L27, `sailes-design/ux-rules.md` L7 + L37 + L66. Its absence behaviour is stated in three places with the same literal SKIP string: `SKIP browser-inspect (chrome-devtools MCP absent)`.
- One tool named in `browser-inspect.md` prose (`handle_dialog`, L264) does **not** appear in that file's own tool list at L59–62.
- Version constraints stated anywhere in the slice: `chrome-devtools-mcp@latest`, `chrome@stable`, Chromium 150 / Edge 150.0.4078.96, Tailwind v4, React 19, Pipedrive v1, UUIDv7, Inngest signing key format = hex, Inngest dev port 8288, skill versions 1.14.0 / 1.14.1, SWE-at-Google ch. 11 and ch. 13.
- Dated facts in the slice: cassette example `2026-07-20`, Luo et al. link verified `2026-07-20`, browser-probe fixtures last run `2026-07-25`, SRF business-flow audit `2026-07-06`.

# ARM B — researcher (fan-out): external tools named across `skills/`

**Question.** Across everything in `skills/`, which **external tools** does the framework name —
tools a person must install or enable separately, rather than write? Per tool: name, files that
name it, any version constraint, and what the framework says happens when it is absent.

**Corpus.** 79 files under `skills/`, 15 skills + `skills/README.md`. Every file was read by
exactly one gatherer; no file was left uncovered.

**Method.** 7 read-only gatherers (Haiku) over disjoint slices of `skills/`, run concurrently.
The synthesis below — tiering, dedup, contradiction resolution, confidence — is mine, not theirs.
Where a gatherer's claim was load-bearing or surprising I re-read the source line myself; those are
marked **verified-by-me**. I also ran an independent ripgrep frequency sweep over the whole tree as
a cross-check, which caught one tool all seven gatherers missed (`ui-ux-pro-max`).

---

## The judgment call that shapes this answer

The gatherers returned ~120 distinct names between them. Most are **not** answers to the question
asked. `React`, `Zod`, `Tailwind`, `Drizzle`, `Fastify`, `shadcn/ui` are npm dependencies the
project *declares* — you `pnpm add` them as part of writing the app, and the framework names them
as **decision-card options**, not as prerequisites. Treating them as "external tools a person must
install separately" would inflate the answer by 4× and bury the real finding.

So I split into tiers by what the framework itself does with the name:

- **Tier 1 — machine prerequisites.** The framework gives an install command, calls it a "machine
  prereq", or describes behaviour when the binary/server is missing. **This is the real answer.**
- **Tier 2 — hosted services / accounts.** Nothing to install; something to sign up for and enable.
- **Tier 3 — assumed toolchain.** Invoked in commands and scripts, never introduced. Absent-behaviour
  is essentially never stated — the framework assumes them.
- **Tier 4 — excluded.** Stack/library options from decision cards. Listed at the end, not detailed.

---

## Tier 1 — Machine prerequisites (the direct answer)

### 1. `chrome-devtools` MCP server — **the most fully specified external tool in the framework**

| | |
|---|---|
| **Named in** | `skills/sailes-design/browser-inspect.md` (§Availability, L41–60; L277) · `skills/sailes-design/SKILL.md:76` · `skills/sailes-design/premium-ux.md:27` · `skills/sailes-design/ux-rules.md:7` · `skills/sailes-bootstrap/decision-engine.md:32,42–58` · `skills/sailes-bootstrap/repo-done-checklist.md:29` · `skills/sailes-bootstrap/codex-config-template.md:85–90` · `skills/sailes-diagnose/diagnosis-loop.md:39` · `skills/sailes-test/references/browser-e2e.md:84` |
| **Version** | `chrome-devtools-mcp@latest` — floating, deliberately unpinned. Install: `claude mcp add chrome-devtools --scope user -- npx -y chrome-devtools-mcp@latest` (`browser-inspect.md:44`) |
| **Sub-prereq** | **Chrome/Chromium on the machine.** `decision-engine.md:42`: *"Machine prereq: a Chrome/Chromium install."* Fallback if absent: `npx -y @puppeteer/browsers install chrome@stable --path ~/.cache/puppeteer` then `--executablePath` (`browser-inspect.md:46–47`) |
| **If absent** | Fully specified, and consistent in all five places it is stated. `browser-inspect.md:54–57`: *"fall back to the screenshot render … and record `SKIP browser-inspect (chrome-devtools MCP absent)` in the artifact — the run log, the incident record, or the qa verdict. An unmeasured gate reported as passed is the failure; an explicit SKIP is not."* `decision-engine.md:56–58` adds: *"It never becomes mandatory: the fallback … is a first-class path, and **no skill blocks on the server being present**."* Option B in the Q21 card: *"Three gates stay eyeballed; every UI run carries a `SKIP browser-inspect` line."* |

**Confidence: high — verified-by-me** (read `browser-inspect.md:38–60` and `decision-engine.md:36–58`
directly). Independently reported by 3 of 7 gatherers with no conflict. The only `mcp__*` tool
identifiers written literally anywhere in `skills/` are here (`browser-inspect.md:59`).

### 2. `graphify` (PyPI: `graphifyy`) — code-map CLI, bootstrap Step 4.9

| | |
|---|---|
| **Named in** | `skills/sailes-bootstrap/graphify-setup.md` (whole file) · `skills/sailes-bootstrap/SKILL.md:89–94` · `skills/sailes-bootstrap/adopt-existing-repo.md:82,85,90` · `skills/sailes-bootstrap/repo-done-checklist.md:75,79` · `skills/sailes-bootstrap/agents-md-template.md:110` · `skills/sailes-bootstrap/settings-template.json:28` · `skills/sailes-diagnose/probe-patterns.md:125–132` · `skills/sailes-migrate/methodology.md:67` · `skills/sailes-pre-implement/SKILL.md:46–48` · `skills/README.md:39` |
| **Version** | **`graphifyy >= 0.9.23`** — `graphify-setup.md:6`: *"Validated against `graphifyy >= 0.9.23` (PyPI package is `graphifyy`, double-y; the CLI command is `graphify`)."* The only hard `>=` version floor on any tool in `skills/`. |
| **Install** | `uv tool install graphifyy`, fallback `pipx install graphifyy` (`graphify-setup.md:17,71`) — so **`uv`** and **`pipx`** are themselves named prerequisites |
| **If absent** | The most carefully specified degradation in the framework. `graphify-setup.md:70–76`: *"NEVER block the phase."* → (1) tell the user the one-liner; (2) if it can't be installed now (*"offline, no uv/pipx, CI image"*) record `Open failure: graphify not installed — code map skipped at bootstrap` in `.ai/STATE.md`, and the done-checklist prints `SKIP graphify (binary missing)` — *"an explicit line, never silence"*. `SKILL.md:94`: *"Never block, never skip silently."* In `probe-patterns.md:125` it is *"optional — applies when the repo has graphify-out/graph.json"*. |

**Confidence: high — verified-by-me** (read `graphify-setup.md:1–40` and `70–100`).
**Contradiction resolved:** the bootstrap-core gatherer reported "no version constraint" (it read
`SKILL.md`, which has none); the templates gatherer reported `>= 0.9.23`. Both were reading
honestly — the constraint lives only in `graphify-setup.md:6`. I confirmed it at source.

### 3. `ui-ux-pro-max` design engine + `python3` — **missed by all 7 gatherers; found by my own sweep**

| | |
|---|---|
| **Named in** | `skills/sailes-design/SKILL.md:54–56` (a section titled *"Optional: ui-ux-pro-max design engine"*) |
| **Version** | none stated |
| **If absent** | Conditional-optional, never a blocker: *"**If** the `ui-ux-pro-max` skill/CLI is installed, you may seed the direction with its reasoning engine (67 styles, 161 palettes, 57 font pairings, product-type rules)."* Invoked as `python3 .../ui-ux-pro-max/scripts/search.py … --design-system -p "<Project>"` — so a **Python 3 runtime** is an implied prerequisite. The framework adds a usage caveat rather than an absence caveat: *"Treat its output as **input to your judgment**, not the final answer."* |

**Confidence: high — verified-by-me.** Worth flagging as a **method finding**: the design+test
gatherer read this exact file and did not surface it. Seven parallel readers still produced one
miss that a mechanical grep caught. Fan-out is not a substitute for a sweep.

### 4. The `sailes-app-builder` plugin itself — an enable-step with a named failure mode

| | |
|---|---|
| **Named in** | `skills/sailes-bootstrap/agent-team-structure.md:163–171` |
| **Version** | none for the plugin; see §5 for the harness version note |
| **If absent** | Explicit and unusually blunt. L163–165: *"`general-purpose` is a last resort, and it is a **reported** one. It is legitimate exactly when the named role does not resolve — **the plugin is not installed on that machine**, or the type is otherwise unavailable."* Then L169–171: *"**If the roles do not resolve, that is the finding.** The roles ship with the plugin; a machine that never ran `enable-plugin.sh` has none of them, and every 'team' it runs is a team of generic agents. Check before concluding anything about the framework's behaviour from such a run."* Required workaround when it is absent: paste the role definition into the brief, set `model` and `effort` explicitly, and record in the run log that the role ran as a stand-in — *"a run staffed by stand-ins tested the briefs, not the roles."* |

**Confidence: high — verified-by-me.** Not reported by any gatherer as a "tool"; I surfaced it from
my `install|not installed` prose sweep. Judgment call: `enable-plugin.sh` is exactly "something you
enable separately", so it belongs in Tier 1 even though it is the framework's own distribution.

### 5. Agent harnesses — Claude Code and Codex CLI (and their enable-flags)

| | |
|---|---|
| **Named in** | `skills/sailes-bootstrap/agent-team-structure.md` (throughout; L43, 258, 310, 320–330, 335–345) · `agentic-first-principles.md:100,128–129` · `agents-md-template.md:44,97,99` · `codex-config-template.md` (whole file) · `skeleton.md:67,84–89` · `settings-template.json` · `graphify-setup.md:27` |
| **Version** | The only harness version statement in the repo, `agent-team-structure.md:327–329`: *"Dated 2026-07-26, Claude Code 2.1.220 — between v2.1.172 and v2.1.216 subagents nested **by default** up to five layers with no way to change it, so a memory of 'it just worked' is true about a version we are no longer on."* For Codex, a version-range caveat rather than a floor: *"On some Codex versions `PreToolUse` fires **only for the `Bash` tool**"* (`codex-config-template.md:30–31`, echoed at `agents-md-template.md:44`). |
| **Enable-flags (env, set by the human, not by any skill)** | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`, `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` (cap 20), `CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION` (cap 200), `CLAUDE_CODE_SUBAGENT_MODEL`. `agent-team-structure.md:322–325`: *"**Enabling it is a machine-level act the human performs**, not something the framework turns on: nesting is off by default … It changes agent behavior for **every repo on that machine**, which is why no skill writes it."* |
| **If absent** | Two distinct answers, both stated. **Agent-teams flag off** (`agent-team-structure.md:336–343`): *"The team **model does not depend on the flag** — only the delegation *mechanism* does."* Degrades to sequential scoped subagents with *"the same roles, order, gates, and lifecycle"* — *"the answer to 'will this work without the experimental mode?' is **yes** — degraded to sequential subagents."* **Hooks absent in a harness** (`agents-md-template.md:44`): *"In any harness without hooks, the prose Hard Safety Rules below are the fallback — know which rules lost their backstop."* Codex is explicitly optional, never a dependency (`agent-team-structure.md:264`): making the second vendor a requirement *"is the opposite of the point … a Claude-only or Codex-only user loses nothing by never using it."* |

**Confidence: high — verified-by-me** (read L320–345 and the env-flag grep directly).

### 6. Railway CLI (`@railway/cli`)

| | |
|---|---|
| **Named in** | `skills/sailes-hosting/references/railway-topologia-i-cli.md:7–20` (install section) and throughout · `skills/sailes-hosting/SKILL.md:8` · `references/monorepo-multi-serwis.md:78–143` · `skills/sailes-diagnose/probe-patterns.md:110` |
| **Version** | **No floor stated.** What exists instead is a confirmed-broken-across-versions note, `monorepo-multi-serwis.md:107`: *"`railway service source connect --branch` **JEST ZEPSUTE** … zwraca `ServiceInstance not found` niezależnie od wersji CLI (potwierdzone 5.5.0 i 5.25.0)"* — "is BROKEN … regardless of CLI version (confirmed on 5.5.0 and 5.25.0)". Install: `npm i -g @railway/cli`. |
| **If absent / degraded** | The framework documents session loss rather than absence. `railway-topologia-i-cli.md:16–20`: in headless/agent environments *"logowanie robi człowiek"* — the human must run `railway login`; if the session has no token, *"poproś użytkownika o `! railway login`"* (ask the user to run it). *"Sesja `railway login` **wygasa w trakcie** (objaw: `railway status --json` pusto / `Unauthorized`)"* — the session expires mid-run, symptom being empty `status --json` or `Unauthorized`; fix is `RAILWAY_TOKEN` at User/Machine scope. |

**Confidence: high for existence and install; medium for "if absent"** — the docs describe *expired
auth*, not *missing binary*. **I could not find any statement of what to do if the CLI is not
installed at all.**

### 7. `@puppeteer/browsers` — escape hatch for the Chrome sub-prereq

`skills/sailes-design/browser-inspect.md:46–47`. No version on the package; the browser is pinned to
`chrome@stable`. Only ever named as the *fallback* when Chrome Stable is missing, so its own absence
is not discussed. **Confidence: high — verified-by-me.**

### 8. `anthropics/code-migration-kit-with-claude-code` — an external repo to clone

| | |
|---|---|
| **Named in** | `skills/sailes-migrate/SKILL.md:22–27` · `skills/sailes-migrate/cost-and-gates.md:33–48` · `parallel-translation.md:42–45` · `skills/README.md:59` |
| **Version** | No version. Licence is stated as the constraint: **Apache-2.0, © 2026 Anthropic PBC**. |
| **If absent** | `cost-and-gates.md:41`: *"Domyślnie: **referencja** — sklonuj kit obok repo migrowanego i użyj jego skryptów"* — by default, reference it: clone the kit next to the migrated repo and use its scripts. Its scripts (`depmap_python.py`, `depmap_mjs`, `depmap_c_headers.py`, `make_manifest.py`, `queue_runner.mjs`, `build_daemon.sh`) and templates (`RULEBOOK.md`, `inventory.tsv`, deny-`settings.json`) *"żyją w tamtym repo"* — live in that repo, not this one. Vendoring is *"prawnie dozwolone przez Apache-2.0"* but requires licence headers + `NOTICE`, and is *"decyzja człowieka, nie agenta"* — a human decision, not an agent's. |

**Confidence: high — verified-by-me** (read `SKILL.md:20–28` and `cost-and-gates.md:30–50`).

### 9. Self-hosted Inngest container — the only pinned Docker image in the repo

| | |
|---|---|
| **Named in** | `skills/sailes-hosting/references/monorepo-multi-serwis.md:171–199` · `skills/sailes-hosting/SKILL.md:11,28` · `skills/sailes-async/*` (as the durable engine) |
| **Version** | **`inngest/inngest:v1.35.0` — explicitly pinned, with a stated reason.** L173–174: *"Obraz **pinuj** (`inngest/inngest:v1.35.0`), nie `latest`."* Plus a concrete platform quirk: *"Ten obraz nie honoruje wstrzykniętego `$PORT` — ustaw `--port=8288` jawnie."* |
| **Runtime deps** | Postgres **and** Redis. `async-compendium.md:11`: *"Needs Postgres + Redis to operate."* L24: *"Redis is accepted operational surface, taken only because self-hosted Inngest requires it."* Also `openssl rand -hex 32` to generate keys. |
| **If misconfigured** | Failure chain is spelled out end-to-end — `sailes-async/lessons.md:4,13–14`: *"`inngest start` with a non-hex signing key crashes ('must be hex') → nothing on :8288 → `send()` fails ECONNREFUSED → intake 500s."* Local alternative: `inngest dev --no-discovery -p 8288` (no keys, SDK connects via `INNGEST_DEV=1`). |

**Confidence: high for the pin and the failure chain** (two independent gatherers, consistent, and
the `v1.35.0` line appears in my own sed output). **Note the scope:** this is "what happens when
misconfigured", not "what happens when absent" — the two are different questions and the docs answer
only the first.

---

## Tier 2 — Hosted services (sign-up/enable, nothing to install)

Named consistently, but with a different absence-shape: they are **decision-card options with named
alternatives**, so "absent" means "you chose the other one", not "the framework degrades".

| Service | Named in | Version | If absent |
|---|---|---|---|
| **Railway** (platform, Postgres, Buckets, cron, Volumes) | `sailes-hosting/*` (all 6 files) · `stack-baseline.md:14–16,127` · `modules-catalog.md:19` · `agents-md-template.md:57,62,64` | none | Alternative named: *"Vercel + Neon = optional alternative only if you later want automatic preview-per-PR + DB branching. Not worth the extra vendors"* (`stack-baseline.md:127`). Storage: `R2`/`S3` *"instead of Railway Buckets"* for compliance (`stack-baseline.md:141`). |
| **Pipedrive Developer Hub + API** | `sailes-pipedrive/*` (7 files); registration at `manifest-oauth-rejestracja.md:68–86` | API **v1** | Not framed as optional — without Hub registration there is no OAuth credential and no extension slot. **No degradation path stated.** |
| **Sentry** | `stack-baseline.md:27,57` · `skeleton.md:58` · `agents-md-template.md:63` · `repo-done-checklist.md:142` | none | *"recommended for production"*, not mandatory. Sharpest line: *"a silent Sentry is decoration"* (`repo-done-checklist.md:142`). |
| **PostHog** | `stack-baseline.md:27,57` · `skeleton.md:58` · `agents-md-template.md:63` | none | Recommended, optional. |
| **Slack** (webhook, failure alerts) | `sailes-async/SKILL.md:95` · `harness-checklist.md:12,25,48–50` · `sailes-diagnose/traps.md:12–18` | none | Not "absent" but "silently failing" — `harness-checklist.md`: boot-time guard, *"loudly error at startup if the alert webhook is unset/malformed, and test-fire it before deploy"*. `traps.md:12–14`: *"`alertSlack` never throws and logs nothing on success, so the storm was INVISIBLE."* |
| **Vercel + Neon** | `stack-baseline.md:126,142` | none | The named alternative to Railway, not the default. |
| **Cloudflare R2 / AWS S3** | `stack-baseline.md:141` · `modules-catalog.md:105` · `storage-postgres-bucket-volume.md:59` | **EU region required for RODO** (`storage-postgres-bucket-volume.md:59`) | Fallback from Railway Buckets when compliance demands it. |
| **Resend / Postmark / SendGrid** | `modules-catalog.md:48` | none | Three interchangeable options, one module level. |
| **Google / Gmail OAuth** | `modules-catalog.md:50,57` · `security-checklist.md:39,142` | none | SMTP/IMAP is the named fallback. Hard rule: *"NEVER treat Google login as Gmail access."* |
| **Better Stack / Axiom / Logtail** | `stack-baseline.md:57` · `modules-catalog.md:118` | none | *"Extensions"* — structured logs are the baseline without them. |
| **LaunchDarkly / Statsig / Unleash** | `modules-catalog.md:111` | none | *"Managed … only for larger SaaS"*; DB-based flags are the default. |
| **Clerk** | `stack-baseline.md:143` | none | Alternative to Better Auth *"if budget OK"*. |
| **Figma** | `ui-libraries.md:39` | none | *"The Figma kit as a design-phase input"* — optional; markup blocks work without it. |
| **Astryx CLI + MCP server** (Meta, `facebook/astryx`, MIT) | `ui-libraries.md:54–58,86,95` · `stack-baseline.md:147` | **Beta** (public since Jun 2026) | Only when *"agent-generated UI end-to-end and a ready theme beats a bespoke design system"*; adopting it *replaces* Tailwind+shadcn and the premium pass must be rewritten onto its themes. |
| **Atlas / Flyway / Liquibase** (schema tooling) | `db-compendium.md:165–166` · `decision-cards.md:72,80` · `migration-sql-first.md:9` | Licensing, not version: Atlas *"lint wyszedł z darmowego planu w X.2025 — sprawdź aktualny licensing"*; Flyway *"Teams skasowany V.2025"*; Liquibase *"policy checks tylko Pro"* | Interchangeable options in a decision card. |

---

## Tier 3 — Assumed toolchain (invoked, never introduced)

These are real install-or-enable dependencies, but the framework **never states what happens if they
are missing** — it assumes them. That silence is itself the finding.

| Tool | Named in (representative) | Version | If absent |
|---|---|---|---|
| **Node.js** | `stack-baseline.md:43` · `agents-md-template.md:53` · `monorepo-multi-serwis.md:33` · `probe-patterns.md:110` | **Active LTS (24)** in the baseline; **`node:22-slim`** pinned in the Railway Dockerfile — *a genuine internal inconsistency, see Open Questions* | nothing stated |
| **pnpm** | `stack-baseline.md:20` · `monorepo-multi-serwis.md:33` · `settings-template.json:22–26` | **`pnpm@8.15.9`** pinned via `corepack prepare` in the Dockerfile; unpinned elsewhere | nothing stated directly. Adjacent: building without devDeps yields *"`tsc: not found` na buildzie"* (`monorepo-multi-serwis.md:20`) |
| **git** | 20 files; `hooks-template/*.sh`, `settings-template.json:50`, `diagnosis-loop.md:108` (`git bisect run`) | none | nothing stated |
| **Docker** | `sailes-hosting/SKILL.md:12` · `monorepo-multi-serwis.md:13–30` · `skeleton.md` · required by Testcontainers | none | Not absence but *choice*: *"Dockerfile-first, NIE Nixpacks/Railpack (to jest THE recurring pain)"* |
| **`gh` (GitHub CLI)** | `monorepo-multi-serwis.md:112` · `agentic-first-principles.md` | none | Presented as workaround #2 for the broken Railway branch command, not as a hard dep |
| **`jq`** | `hooks-template/guard-protected-paths.sh` · `codex-config-template.md` · `agentic-first-principles.md` | none | nothing stated — a hook script silently depends on it |
| **`curl`** | 8 files; `traps.md:106` | none | Only stated inversely: *"PowerShell's `Invoke-WebRequest` **falsely 404s** against a Vite dev server — use `curl.exe`"* |
| **`openssl`** | `monorepo-multi-serwis.md:181` | none | Needed for `openssl rand -hex 32`; non-hex key crashes Inngest on boot |
| **`psql` / Postgres client** | `monorepo-multi-serwis.md:227–233` · `probe-patterns.md:115–121` | none | Constraint stated instead: must use `DATABASE_PUBLIC_URL`, since *"the private hostname does not resolve from outside the platform's network"* |
| **PostgreSQL (server)** | `sailes-database/*` (all 7) · hosting · async | **The best-specified version matrix in the repo** — `sailes-database/SKILL.md:30`: *"constant defaults PG11+, `SET NOT NULL` skip-scan PG12+, `CREATE STATISTICS` on expressions PG14+, native `uuidv7()` PG18+"*. Extension `pg_uuidv7` required below PG18. | Feature-gated, not absent-gated: below the floor you use the documented workaround (extension, or the expand/contract dance) |
| **Redis** | `async-compendium.md:11,24` · `monorepo-multi-serwis.md:6,196` · `stack-baseline.md:51` | none | Only required because self-hosted Inngest requires it; BullMQ also needs it. DB-backed jobs are the no-Redis tier. |
| **`uv` / `pipx`** | `graphify-setup.md:17,71,76` | none | `uv` is primary, `pipx` the stated fallback; if neither, graphify records an explicit SKIP (see Tier 1 §2) |
| **`python3`** | `sailes-design/SKILL.md:55` · `monorepo-multi-serwis.md:229` | none | nothing stated |
| **`tsx`** | `probe-patterns.md:110` (`node --import tsx …`) | none | nothing stated |
| **`sed`** | `graphify-setup.md:41` | none | nothing stated — used to strip absolute binary paths before commit |
| **POSIX `sh`** | `hooks-template/guard-protected-paths.sh`, `session-start.sh` (shebangs) | none | nothing stated |
| **`drizzle-kit` / `prisma` CLI** | `sailes-database/SKILL.md:26` · `migration-drizzle.md` · `migration-prisma.md` · `railway-topologia-i-cli.md:66` | Prisma **7** noted as *"bez Rust"* (Rust-free) | Interchangeable per the ORM decision card |
| **Playwright** | `stack-baseline.md:26` · `skeleton.md:26` · `sailes-design/SKILL.md:64` · `browser-e2e.md` · `sailes-spec/SKILL.md:100` · `diagnosis-loop.md:44` | none | **The one place absence is addressed** is the reverse direction — `diagnosis-loop.md:44`: *"Absent it [chrome-devtools MCP], a Playwright script with `page.on('console')` and `page.on('response')` produces the same evidence for more setup; either way the evidence log is what matters, not the tool."* |
| **Vitest / Testcontainers / MSW / Stryker / fast-check** | `stack-baseline.md:58` · `agentic-first-principles.md:121–124` · `external-systems.md:20,76,106` · `sailes-test/SKILL.md:107` · `techniques.md:89,143` | none | nothing stated. Nearest hard rule: *"Real infrastructure, not in-memory substitutes. Postgres via Testcontainers, not SQLite"* (`external-systems.md:74`) |

---

## Tier 4 — Excluded (npm/library decision-card options, not install-or-enable)

Named across `stack-baseline.md`, `agents-md-template.md`, `modules-catalog.md`, `sailes-spec/SKILL.md`,
`ui-libraries.md`, `premium-craft.md`: React, Next.js (App Router), Vite, Tailwind CSS, shadcn/ui,
Preline UI, StyleX, Radix, Lucide, React Hook Form, TanStack Router/Start, React Query, Zod, TypeBox,
Drizzle, Prisma, Kysely, Better Auth, Lucia (*"deprecated as a library — never start on it"*,
`stack-baseline.md:107`), Fastify, Hono, Express, BullMQ, Turborepo, Husky, ESLint, Biome, TypeScript,
Pact, JSON-Schema. Postgres extensions and adjacent tools appear here too where they are chosen rather
than installed as prerequisites: `pgBouncer`, `pgAudit`, `supa_audit`, `pgroll`, `node-pg-migrate`,
`sqitch`, `golang-migrate`, `strong_migrations`.

They are excluded because the framework consistently frames them as **"which one do you pick"**
(decision cards with pros/cons and named alternatives), never as **"install this or the run degrades"**.
Reasonable people could draw this line differently — a reader who counts every `pnpm add` as an
external tool would get ~120 names instead of ~45.

---

## Contradictions found and how I resolved them

1. **`graphify` version.** Bootstrap-core gatherer: "none". Templates gatherer: `>= 0.9.23`.
   → **Both honest**; the constraint exists only in `graphify-setup.md:6`, which only one of them read.
   I re-read the line. **Resolved in favour of the constraint.**
2. **`supa_audit v0.3.1` — a fabrication.** The async+database gatherer's *body* said "no version
   stated"; its *summary table* asserted `"v0.3.1" (repo archival 2025-02)`. I grepped every
   `supa_audit` occurrence (4 hits, `db-compendium.md:79,82,85,349`) — **no version anywhere**.
   **Discarded.** Worth noting as a failure mode: the summary table hallucinated detail the same
   agent's own body did not contain.
3. **Railway CLI "version constraint".** One gatherer implied `5.5.0`/`5.25.0` were constraints.
   Reading `monorepo-multi-serwis.md:107`, they are *versions on which a command was confirmed
   broken* — the opposite of a floor. **Corrected above.**
4. **Playwright absence-behaviour.** Design+test gatherer: "nothing stated". Diagnose gatherer:
   explicit fallback text. → **Both correct for their own files.** Recorded per-file, not merged.
5. **`.claude/settings.json` deny-list listed as a "tool"** by the diagnose+migrate gatherer.
   It is *configuration*, not an installable tool — but its finding is real and load-bearing, so I
   kept the substance: `parallel-translation.md:36–38`, *"KRYTYCZNE: jeśli deny-list nie jest
   zainstalowany, blokady nie działają — fan-out pobiegnie 'nieuzbrojony'"* (if the deny-list is not
   installed the blocks do not work — the fan-out runs "unarmed"). Reclassified, not discarded.
6. **`Maps API` / `OpenAI`** (`speedup-recipe.md:35,38,52`). The gatherer itself flagged Maps as
   *"implied, not named explicitly"*. **Low confidence; reported as example-domain colour, not as a
   framework-named tool.** OpenAI is likewise named only inside a worked latency example.

---

## What I could NOT establish

1. **Absence-behaviour for the entire Tier 3 toolchain.** For `git`, `jq`, `sed`, `sh`, `python3`,
   `tsx`, `openssl`, `pnpm`, `node`, `docker`, `curl` the framework states **nothing** about what
   happens if they are missing. Only two tools in the whole corpus have a real "if absent" protocol
   (`chrome-devtools` MCP, `graphify`); a third (the plugin) has a "that is the finding" clause.
   Whether the silence is deliberate (assumed baseline) or a gap, I cannot tell from `skills/`.
2. **Node version: 24 vs 22 — unresolved inconsistency.** `stack-baseline.md:43` and
   `agents-md-template.md:53` say *"Node Active LTS (24)"*; `monorepo-multi-serwis.md:33` pins
   `FROM node:22-slim`. Nothing in `skills/` reconciles them. I cannot determine which is current
   intent versus lag.
3. **What happens if the Railway CLI is not installed at all.** The docs cover *expired login*
   thoroughly and *missing binary* not at all.
4. **Whether `chrome-devtools-mcp@latest` has a working floor.** It is deliberately floating; no
   minimum version, and no statement about what breaks if `@latest` moves.
5. **Any MCP server other than `chrome-devtools` and Astryx's.** `mcp__` appears literally exactly
   once in the entire tree (`browser-inspect.md:59`). I found no `context7`, no `playwright` MCP, no
   filesystem/db MCP anywhere. If the framework is expected to name more, it does not.
6. **`ui-ux-pro-max` provenance.** Named as *"skill/CLI"* with a `python3 .../scripts/search.py`
   path, but `skills/` never says where to obtain it, what it is licensed under, or its version.
7. **Whether Tier 4 exclusions match the asker's intent.** My line ("does the framework treat it as
   a prerequisite or as a choice?") is defensible but is a judgment, not a fact in the corpus.
8. **Anything outside `skills/`.** `agents/`, `.claude/`, `plugin.json`, marketplace manifests were
   out of scope and not read. `enable-plugin.sh` is referenced by `skills/` but lives elsewhere; I
   did not open it. `.ai/eval-runs/` was excluded by instruction.

---

## Run data (what the lead is measuring)

| | |
|---|---|
| **Subagents spawned** | **7**, all `Explore` (read-only), all `model: haiku`, all concurrent in a single message |
| **Slicing** | By skill, balanced on file count so no gatherer read more than ~14 files. (1) bootstrap core — 8 files: SKILL/stack-baseline/ui-libraries/modules-catalog/decision-engine/skeleton/developer-fit/adopt-existing-repo. (2) bootstrap templates+checklists — 14, incl. the two `.sh` hooks, `settings-template.json`, `repo-done-checklist.test.js`. (3) hosting + pipedrive — 14 (Polish-heavy; asked for original quotes + translation). (4) async + database — 12. (5) design + test — 12 (targeted at MCP/browser prereqs). (6) diagnose + migrate + discovery — 13. (7) the 5 remaining standalone `SKILL.md` + `skills/README.md` — 6. **Total 79 = full corpus, no overlap, no gap.** |
| **Empty returns** | **None.** 7 of 7 returned substantive findings. Every gatherer also named the files in its slice with no external-tool mentions, as instructed. |
| **Gatherer tool-uses / tokens** | 6–14 tool calls each; 38k–61k subagent tokens each; ~366k total across the fan-out |
| **Duration** | Individual: 50s, 72s, 86s, 93s, 97s, 116s, 125s. **Wall-clock for the fan-out ≈ 125s** (bounded by the slowest, since all 7 ran concurrently) versus ~10.5 min if run serially. Including my own survey, cross-check sweep, verification reads and synthesis: **≈ 6 minutes end to end.** |
| **My own work alongside** | 8 direct tool calls: a corpus survey, a 52-term ripgrep frequency sweep, a word-boundary recount to kill substring false positives (`gh`/`jest` were noise), a version-token extraction, an `mcp__`/MCP-prose grep, an install/prereq-prose grep, and 5 targeted source reads to verify load-bearing claims. |
| **What the fan-out cost me** | One real miss (`ui-ux-pro-max`, in a file a gatherer had read) and one fabricated version (`supa_audit v0.3.1`, invented in a summary table that contradicted its own body). **Both were caught by the independent sweep + verification pass, not by the gatherers.** The parallel read is a recall engine, not a truth engine. |

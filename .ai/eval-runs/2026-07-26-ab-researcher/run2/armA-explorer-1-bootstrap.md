# Arm A · Explorer 1 — Recon of `skills/sailes-bootstrap/`

**Slice size: 23 files.** Every one was read in full (no sampling, no grep-only passes). File list, in the order recorded below:

1. `skills/sailes-bootstrap/SKILL.md` (153 lines) — READ
2. `skills/sailes-bootstrap/adopt-existing-repo.md` (131) — READ
3. `skills/sailes-bootstrap/agent-team-structure.md` (350) — READ
4. `skills/sailes-bootstrap/agentic-first-principles.md` (169) — READ
5. `skills/sailes-bootstrap/agents-md-template.md` (164) — READ
6. `skills/sailes-bootstrap/backlog-template.md` (36) — READ
7. `skills/sailes-bootstrap/codex-config-template.md` (144) — READ
8. `skills/sailes-bootstrap/deciding-under-uncertainty.md` (115) — READ
9. `skills/sailes-bootstrap/decision-engine.md` (134) — READ
10. `skills/sailes-bootstrap/developer-fit.md` (55) — READ
11. `skills/sailes-bootstrap/graphify-setup.md` (103) — READ
12. `skills/sailes-bootstrap/hooks-template/guard-protected-paths.sh` (25) — READ
13. `skills/sailes-bootstrap/hooks-template/session-start.sh` (5) — READ
14. `skills/sailes-bootstrap/modules-catalog.md` (154) — READ
15. `skills/sailes-bootstrap/release-checklist.md` (65) — READ
16. `skills/sailes-bootstrap/repo-done-checklist.md` (166) — READ
17. `skills/sailes-bootstrap/repo-done-checklist.test.js` (124) — READ
18. `skills/sailes-bootstrap/security-checklist.md` (74) — READ
19. `skills/sailes-bootstrap/settings-template.json` (67) — READ
20. `skills/sailes-bootstrap/skeleton.md` (135) — READ
21. `skills/sailes-bootstrap/spec-writing-template.md` (81) — READ
22. `skills/sailes-bootstrap/stack-baseline.md` (159) — READ
23. `skills/sailes-bootstrap/ui-libraries.md` (100) — READ

No deduplication, no ranking, no editorialising below — every mention recorded where it occurs.

---

## 1. `skills/sailes-bootstrap/SKILL.md`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 10 | "sales-support, CRM-adjacent, auto-offering, email automation, webhooks, syncs, reports, **Pipedrive**" | none | none stated |
| 30 | "stack signals (`package.json`, lockfile, framework, ORM, `docker-compose`)" | none | absence = Case B/C classification signal |
| 36 | "is there real application code (`package.json` with deps, `src/`, tests, migrations)? None → Case B. Yes → Case C." | none | absence routes to Case B |
| 47 | "**Worker process + monorepo** (`apps/worker` + pnpm monorepo). The baseline recommends it, but for a small, low-concurrency tool a leaner single Next.js app (background work in a route/queue-lite) may be enough." | none | explicit alternative: single Next.js app |
| 48 | "**PDF / document generation** (when the app outputs documents). Offer the real options — e.g. Puppeteer/headless-Chrome (✅ full HTML/CSS fidelity ⚠️ heavier RAM/Railway tier) vs. `@react-pdf`/pure-JS (✅ light, no browser ⚠️ less layout flexibility)" | none | "if truly deferred, log it as an explicit open decision" |
| 57 | "the pnpm monorepo with `apps/web` + `apps/worker`" | none | — |
| 61 | "scaffold the **harness guardrails** — BOTH twins: `.claude/settings.json` (Claude Code) AND `.codex/config.toml` (Codex CLI) per `codex-config-template.md`, plus the shared `.claude/hooks/*.sh` and `.github/copilot-instructions.md` pointer" | none | "Generate the Codex twin by default so the app runs *guarded* (not just readable) under Codex; **skip only if the client explicitly will never use Codex/Copilot**" |
| 61 | "stamp the generated AGENTS.md header with the current **`Framework-Version:`** (from this framework's `VERSION` file)" | version stamp is the mechanism | — |
| 63 | "**`git init` + a first commit are part of generation, not optional.** A repo with 0 commits is not set up." | none | hard requirement |
| 69 | "the baseline (Railway · Postgres · Railway Buckets · Drizzle · Better Auth · Next.js+shadcn · pnpm monorepo · mandatory worker · async webhooks · Sentry/PostHog for prod) is your **recommendation, not a decree**" | none | user may veto any item via decision card |
| 69 | "**request-API engine** if split (Fastify vs Hono vs Express)" | none | decision card |
| 69 | "**UI layer** (Tailwind+shadcn default vs +Preline blocks vs Astryx — see `ui-libraries.md`)" | none | decision card |
| 69 | "**ORM** (Drizzle vs Prisma vs Kysely), **Auth** (Better Auth vs Clerk vs email/pw), **Hosting** (Railway vs Vercel+Neon)" | none | decision card |
| 69 | "Only TypeScript + pnpm are stated as flat defaults" | none | flat default, not a card |
| 72 | "**Do NOT recommend from stale memory** — defaults drift (Redis-by-reflex, deprecated auth libs, Prisma/Drizzle hand-waving)." | none | — |
| 78 | "**invoke the `sailes-design` skill before spec/implementation**" (design gate) | none | "Backend-only/no-UI work (pure API, worker, integration job): skip explicitly and note why." |
| 84–89 | "## Step 4.9 — Code map (graphify) — DEFAULT for every repo … Follow `graphify-setup.md` → "The procedure" **verbatim and in order** (extract → hook install → claude install → codex install → ignore files → commit). Deterministic AST pass — free, local, no API key." | none at this location | — |
| 91 | "Runs AFTER `.claude/settings.json` exists (graphify merges its hooks into it)." | none | ordering constraint |
| 92–94 | "Binary missing? Follow "If graphify is missing" — one-line install hint, else an explicit `SKIP` recorded in `.ai/STATE.md` and in the done-checklist output. **Never block, never skip silently.**" | none | explicit SKIP + STATE.md record; never block |
| 95–96 | "Case C (adopt): the same procedure runs even earlier — see `adopt-existing-repo.md` step 2, the graph is built BEFORE reverse-engineering conventions." | none | — |
| 102 | ""I created the files" is not evidence; the `find`/`git log` output is." | none | git/find required as evidence |
| 116 | "`graphify-setup.md` (Step 4.9 — default code map: build, freshness hooks, Claude/Codex always-on, fallbacks)" | none | fallbacks referenced |
| 137 | "Handing off with no code map (or silently skipping it) | Run Step 4.9 (`graphify-setup.md`); a missing binary yields an explicit SKIP in the checklist, never silence." | none | explicit SKIP |
| 144 | "You named a queue/auth/ORM/storage without checking `stack-baseline.md`." (Red Flag — STOP) | none | STOP condition |
| 146 | "**You defaulted to Next.js fullstack without weighing the Stack-shaping axes** … a login-only tool with many API consumers (n8n/FHIR/CRM) signals SPA + standalone API." | none | STOP condition |

---

## 2. `skills/sailes-bootstrap/adopt-existing-repo.md`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 23 | "`AGENTS.md` (root) | exists; sections match current `agents-md-template.md` (Critical Rules, Conventions, Key Commands, **Task Router**, Git/PR Workflow)" | "current" template | "DRIFTED → add/realign the missing sections to their REAL stack; MISSING → generate" |
| 25 | "`.ai/` skeleton | `specs/` (+ `implemented/`, `archived/`), `checklists/`, `adr/`, `backlog.md`, `lessons.md` all present" | none | "scaffold only what's missing (idempotent — never overwrite)" |
| 33 | "**doc freshness** | every path & command referenced in AGENTS.md / Task Router exists / runs (`repo-done-checklist.md` Freshness check)" | none | "doc drift — fix the references (or the missing artifact)" |
| 34 | "**Framework-Version stamp** | AGENTS.md header carries `Framework-Version:`; compare against the current framework `VERSION`" | version comparison is the mechanism | "absent → stamp the current version; older → run **Upgrade mode**" |
| 35 | "**harness parity (Codex twin)** | `.codex/config.toml` present (twin of `.claude/settings.json`, reusing `.claude/hooks/*.sh`); `.github/copilot-instructions.md` points at AGENTS.md — see `codex-config-template.md`" | none | "add the Codex twin + Copilot pointer additively … commonly MISSING on repos adopted before Codex support existed" |
| 38–55 | audit shell script using `echo`, `grep -q`, `grep -qi`, `ls`, `head -1`, `[ -e ]`, `[ -d ]` | POSIX sh | script only proves PRESENT/MISSING: "A bare `PRESENT`/`MISSING` script can't see DRIFT" (L57) |
| 51–52 | "for f in .codex/config.toml .github/copilot-instructions.md; do … echo "MISSING $f (Codex/Copilot parity)"" | none | prints MISSING line |
| 65–67 | "`install.sh` ships `VERSION` + `CHANGELOG.md` next to the installed skills, so read `~/.claude/skills/CHANGELOG.md` and `~/.claude/skills/VERSION` (Codex install via `enable-codex.sh` ships the same pair at `~/.agents/skills/`; fall back to this framework repo's root copies if you're running from source)." | version files | fallback: this framework repo's root copies |
| 79 | "Confirm real app code (`package.json`, `src/`, migrations, tests) and absence of `AGENTS.md`/`.ai/`." | none | — |
| 82–85 | "**2.0 Build the map first.** Run `graphify extract . --code-only` (deterministic AST, free — this is where the graph pays the most: an unfamiliar codebase). Read `graphify-out/GRAPH_REPORT.md` … Use `graphify query`/`path` to answer the audit questions below instead of walking directories." | none here | — |
| 86–90 | "At 2.0 run only the extract and the GRAPH_REPORT read; defer the rest of the Step 4.9 wiring (hook install → claude install → codex install → ignores → the map commit) to the Step 4.9 pass … Binary missing → the same explicit-SKIP fallback as Step 4.9." | none | explicit-SKIP fallback |
| 93 | "Real stack: framework, language, **data layer** (ORM? raw SQL? query builder?), auth, tests, package manager, build." | none | — |
| 94 | "Real commands: dev / build / test / lint / typecheck / migrations (the actual scripts in `package.json`)." | none | — |
| 99 | "write the AGENTS.md `## Stack` section to describe **what's actually here** (e.g. Vite + React SPA, Express + TS, raw SQL, Jest), with the real commands." | none | — |
| 101 | "**Flag gaps** against the baseline only as *optional future ADRs* — never as forced rewrites. (e.g. "no input-validation layer → consider Zod", "no async-webhook worker", "secrets handling".)" | none | gaps are optional ADRs, never forced |
| 103 | "**Do NOT** propose migrating ORM/framework/auth as part of methodology onboarding." | none | hard line |
| 109 | "**Harness guardrails, both twins:** `.claude/settings.json` + `.codex/config.toml` (from `codex-config-template.md`) sharing `.claude/hooks/*.sh`, plus `.github/copilot-instructions.md`." | none | "Additive — if the repo already has one twin, add the missing one; never overwrite." |
| 110 | "`.ai/{specs,skills,checklists,adr}` scaffolding + the local `spec-writing` skill from `spec-writing-template.md`, with its `## Stack conventions` block **tuned to their actual stack** (raw SQL / Express / Jest, etc.), not the baseline." | none | — |
| 113 | "For **pre-commit hooks** and **CI workflow**: if the repo already has them (husky, `.github/workflows/`), *document and align* with what's there; only *add* them if absent, and wire them to the repo's REAL commands — never replace a working CI with the baseline's." | none | add only if absent; never replace |
| 116 | "Run **their** existing test/build after adding the docs" | none | — |

---

## 3. `skills/sailes-bootstrap/agent-team-structure.md`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 27 | "Role definitions ship with this plugin in `agents/` (auto-discovered on `plugin install`) and can also be copied to `~/.claude/agents/` for global use." | none | see L164–173 stand-in path |
| 31 | "`team-lead` | `claude-opus-5` · high" | model ID pinned | — |
| 32 | "`explorer` | `claude-haiku-4-5` · —" | model ID pinned | — |
| 33–37 | "`designer` … `claude-sonnet-5` · high"; "`be-dev` / `fe-dev` | `claude-sonnet-5` · high"; "`tester` | `claude-sonnet-5` · high"; "`checker` | `claude-sonnet-5` · high"; "`qa` | `claude-sonnet-5` · high" | model IDs pinned | — |
| 43–45 | "The lead may override it for a single task with the Agent tool's `model` / `effort` parameters. Resolution order is `CLAUDE_CODE_SUBAGENT_MODEL` env → the per-invocation parameter → the role's frontmatter" | env var | env pin wins over override |
| 47–50 | "**Model IDs are pinned, not aliases** (`claude-sonnet-5`, not `sonnet`). An alias silently follows whatever the tier's default becomes … the same lesson this repo already applies to pinning `-m` on a Codex delegation." | pinned IDs, not aliases | "The cost is real and accepted: a new model needs a framework release to reach the roles." |
| 51–52 | "If an org's `availableModels` allowlist excludes a pinned ID, Claude Code skips it and runs the role on the inherited model rather than failing." | none | fallback = inherited model, no failure |
| 63–78 | "**`model` fails loudly.** It accepts only the tier aliases `sonnet` / `opus` / `haiku` / `fable`; a full ID is rejected with `InputValidationError`." · "**`effort` fails silently, which is worse.** It is not among the Agent tool's declared parameters, yet passing it raises no error. Whether it takes effect is **unverified**" | measured 2026-07-26 against the live tool | "**Treat effort as frontmatter-only.**" · "**omitting `model` is how you keep the pin.**" |
| 101–104 | "Two dated constraints (2026-07-26, re-check when the roster moves): **`effort` is unsupported on Haiku 4.5**, so `explorer` carries no `effort:` line … and **Haiku 4.5 holds 200K of context against 1M on the Sonnet and Opus tiers**" | Haiku 4.5; 200K vs 1M context | tune explorer by changing model, not effort |
| 104–106 | "Claude Code's own built-in `Explore` agent stopped defaulting to Haiku and now inherits the session model — `explorer` staying on Haiku is a deliberate divergence from the platform default" | none | — |
| 115 | "**"Frozen" means a committed, typed contract artifact** — shared TS types / Zod schemas (or OpenAPI where the consumer is external) at the repo's shared-contracts location" | none | drift becomes "a compile/type error, not a review finding" |
| 145–149 | "**Every worker is spawned as its own agent type — `be-dev`, `checker`, `qa`, `team-lead` — never as `general-purpose` with the role definition pasted into the brief.**" | none | see next row |
| 164–169 | "**`general-purpose` is a last resort, and it is a *reported* one.** It is legitimate exactly when the named role does not resolve — the plugin is not installed on that machine, or the type is otherwise unavailable. Then, and only then: paste the role definition into the brief, **set `model` and `effort` explicitly on the invocation** (nothing else will), and **record in the run log that the role ran as a stand-in**" | none | explicit documented fallback |
| 171–173 | "**If the roles do not resolve, that is the finding.** The roles ship with the plugin; a machine that never ran `enable-plugin.sh` has none of them, and every "team" it runs is a team of generic agents." | none | check before concluding |
| 182–188 | "`explorer` reported `claude-haiku-4-5` and `checker` reported `claude-sonnet-5`, each matching its frontmatter." · "**The tool allow-list.** `checker` had exactly `Glob, Grep, Read, Bash`" · "**The absence of `Agent`.** Neither role could spawn anything" | audited 2026-07-26 | — |
| 193–195 | "Every gate role carries `Bash`, because the job requires it: `checker` runs lint/type/tests …, `qa` drives the app, `explorer` queries the graph. Both audited roles wrote a file through `Bash` on the first attempt" | none | — |
| 198–201 | "There is also no shippable lever: `permissionMode` is one of the fields ignored when a subagent loads from a plugin, and Bash permission rules live in machine settings, not in what we distribute." | none | no enforcement available |
| 230–232 | "[background teammate] plain text reaches NO ONE; you must call `SendMessage` to deliver." | none | — |
| 239 | "Measured 2026-07-18: of five background teammates given "your final message IS the deliverable", three produced a correct answer and delivered nothing — one said outright it had written the answer as plain text instead of calling `SendMessage`." | none | — |
| 248 | "With a live teammate the lead sends `SendMessage {"type":"shutdown_request","reason":…}`; the worker answers `shutdown_response` and the runtime reports the termination." | none | "Re-send until the termination is confirmed" |
| 259 | "Enable teams with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `~/.claude/settings.json`." | env var | see Fallback L335–344 |
| 263 | "The human may hand a single task to a different runtime — "use Codex for the backend", "let Codex review this". This is **human-triggered only** … Operational detail (commands, model pinning, brief format) lives in `agents/team-lead.md`." | none | never lead-initiated |
| 265 | "the Codex-side lead has no matching hand-off back to Claude … each runtime already runs the whole pipeline alone (`agents/` and `codex-agents/` are the same eight roles, two harnesses). Delegation is an extra that a both-quota human may reach for, never a dependency; a Claude-only or Codex-only user loses nothing by never using it." | none | explicitly optional both ways |
| 303–304 | "all seven non-lead role definitions carry an explicit `tools:` list and **none includes `Agent`** … Only `team-lead` inherits the full tool pool." | none | — |
| 307 | "give each a worktree (`isolation: worktree` is a supported frontmatter field)" | none | — |
| 311–318 | "**With `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` off** (the fallback path), sub-leads and workers are scoped subagents: each returns once and ends, so release is the return and there is nothing to confirm." | env var | fallback path fully described |
| 323–328 | "nesting is off by default and requires `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` in `settings.json` (`"2"` for this design; a third layer then cannot spawn at all). … Two related caps worth knowing: 20 concurrent subagents (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`) and 200 per session (`CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION`)." | depth `"2"`; caps 20 / 200 | "It changes agent behavior for **every repo on that machine**, which is why no skill writes it." |
| 328–330 | "*Dated 2026-07-26, Claude Code 2.1.220* — between v2.1.172 and v2.1.216 subagents nested **by default** up to five layers with no way to change it" | Claude Code 2.1.220; v2.1.172–v2.1.216 | — |
| 335–344 | "`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is experimental and may be off or unsupported. The team **model does not depend on the flag** — only the delegation *mechanism* does. Without it, the same structure runs through ordinary subagents … **yes** — degraded to sequential subagents, but with the same roles, order, gates, and lifecycle." | none | full documented degradation path |

---

## 4. `skills/sailes-bootstrap/agentic-first-principles.md`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 3 | "Researched Jun 2026; the Anthropic items are ✅ verified from the official best-practices page." | dated Jun 2026 | "in a repo that already has its own `AGENTS.md`, that file wins where it's stricter" |
| 42 | "*Source: https://code.claude.com/docs/en/best-practices*" | none | — |
| 48 | "**Validate all inputs** with a schema library (zod) at the boundary; derive types from the schema (`z.infer`) — no `any`." | none | — |
| 56 | "Use Postgres **Row-Level Security selectively** — where the client or storage gets more direct DB access; if most access goes through the server, app-layer authorization is simpler. Don't make RLS a universal religion." | none | app-layer authz as the alternative |
| 62 | "**Agent config:** plan/standard mode in sensitive repos; `auto` mode only with explicit **deny rules** on deploy/migrate/terraform/secrets tooling. Use **PreToolUse hooks** to block edits to critical files" | none | "hooks are deterministic, rules in prose are not" |
| 63 | "**Dev Containers** as the base working environment for humans + agents → repeatable, isolated runtime across local/CI/Codespaces." | none | none stated |
| 64 | "**GitHub gates:** branch protection, CODEOWNERS, CodeQL/code scanning, secret scanning + push protection, Dependabot, and **OIDC to cloud instead of long-lived secrets**." | none | none stated |
| 73 | "no new `any` (`@typescript-eslint/no-explicit-any: error`), design tokens only (`no-restricted-syntax` on raw color/spacing literals in components), import direction between modules (`import/no-restricted-paths` or dependency-cruiser), Zod at the boundary (a convention test that fails on an unvalidated entry point)." | none | `dependency-cruiser` given as an alternative to `import/no-restricted-paths` |
| 87 | "Role definitions live globally in `~/.claude/agents/`" | none | — |
| 91–97 | "`claude-opus-5` · high"; "`claude-haiku-4-5` · —"; "`claude-sonnet-5` · high" (×5 roles) | model IDs pinned | — |
| 100 | "**Delegation mechanism:** enable teams with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `~/.claude/settings.json` … **If the flag is off**, the same roles/order/gates run as sequential scoped subagents — the model doesn't depend on the flag." | env var | documented fallback |
| 121 | "**Fast feedback:** quick unit + type-level tests (**Vitest**, has typecheck mode), typecheck, lint (ESLint or Biome) runnable in seconds" | none | ESLint *or* Biome |
| 122 | "**Mock HTTP without rewriting app code:** **MSW** for HTTP/WebSocket/GraphQL mocking (Vitest itself recommends it)." | none | — |
| 123 | "**Real integration tests:** **Testcontainers** — spin up a real throwaway Postgres in a container so the agent runs realistic tests without hand-gluing an environment." | none | none stated |
| 124 | "**e2e where behavior matters:** **Playwright** — auto-waiting, isolated browser contexts, retries, and a **trace viewer** that gives *evidence* on failure" | none | — |
| 125 | "Playwright for UI, `curl`+`jq` (or a script) against the live API for backend" | none | "(or a script)" |
| 126 | "**Preview-first delivery:** each PR gets its own deploy URL (+ DB branch where available)" | none | "where available" |
| 127 | "**Deterministic, cached builds:** monorepo with a task runner (Turborepo/pnpm workspaces) when multi-package; single repo otherwise." | none | single repo when not multi-package |
| 128 | "root **AGENTS.md** is the shared layer (Codex reads it first; Copilot supports it), **CLAUDE.md imports `@AGENTS.md`** for Claude Code, `.github/copilot-instructions.md` for Copilot." | none | — |
| 129 | "Claude Code = `.claude/settings.json` (permissions + hooks); Codex CLI = `.codex/config.toml` (`sandbox_mode`/`approval_policy` + `[hooks]`). The hook **scripts are shared** … the same `SKILL.md` (`name` + `description` frontmatter) is a Claude plugin skill AND a Codex skill under `.agents/skills/` — install once per harness, one source. A repo is "Codex-ready" only when the `.codex/` twin exists and points at the shared scripts" | none | — |
| 130 | "**CLI tools over bespoke integrations:** `gh`, `aws`, etc. are the most context-efficient way for the agent to touch external services." | none | none stated |
| 137–143 | git conventions: "`git switch -c feat/<short-kebab-desc>`", "`git add -A`", "`git restore <file>` / `git restore --staged`", "`git reset --soft HEAD~1`", "`git reset --hard <ref>` (DESTRUCTIVE — only with explicit confirmation)", "`git revert <sha>`", "`git stash`", "**git worktree** (`git worktree add ../wt-<name> <branch>`)", "`git push --force`" | none | hard lines: never force-push/reset --hard without explicit confirmation |
| 152 | "**Pre-commit hooks (husky or equivalent).** Run lint + typecheck (+ format/i18n where relevant) before every commit" | none | "or equivalent" |
| 153 | "**CI pipeline file (`.github/workflows/ci.yml`).** Small hard gates in order: **lint → typecheck → unit → integration → e2e (on preview) → security scan**." | none | — |
| 169 | "`.ai/lessons.md` + `.husky/pre-commit` + `.github/workflows/ci.yml` + `AGENTS.md` "PR Workflow"" | none | — |

---

## 5. `skills/sailes-bootstrap/agents-md-template.md`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 7 | "pnpm monorepo: `apps/web` + `apps/worker` (worker mandatory) + `packages/{db,auth,ui,files,integrations,jobs,testing,observability}` (email/reporting optional)" | none | email/reporting optional |
| 18 | "`.claude/settings.json` + hooks — the harness guardrails (permissions allowlist, SessionStart memory injection, PreToolUse protected paths)" | none | — |
| 19 | "`.codex/config.toml` — the **Codex twin** of the guardrails (sandbox/approval + `[hooks]` reusing the SAME `.claude/hooks/*.sh` scripts) … Generate it whenever the repo should run under Codex CLI too (default yes)." | none | conditional generation, default yes |
| 20 | "`.github/copilot-instructions.md` — one-line pointer to `AGENTS.md` for Copilot. One source of truth, three harnesses." | none | — |
| 29 | "> Framework-Version: <x.y.z — from the sailes framework VERSION file at bootstrap time; used by adopt-existing-repo upgrade mode>" | semver stamp | — |
| 44 | "`.claude/settings.json` (Claude Code) and `.codex/config.toml` (Codex CLI) both run `.claude/hooks/*.sh` … **Codex caveat: on some versions PreToolUse fires only for `Bash`**, so shell-driven writes are blocked but `apply_patch` edits fall back to sandbox/approval + the prose rules. In any harness without hooks, the prose Hard Safety Rules below are the fallback — know which rules lost their backstop." | "on some versions" (Codex) | prose Hard Safety Rules are the fallback |
| 53 | "Runtime/pkg: Node Active LTS (24) + pnpm monorepo (apps/web + apps/worker)" | **Node Active LTS (24)** | — |
| 54 | "Language: TypeScript strict, end-to-end" | none | — |
| 55 | "UI: React + Tailwind CSS + shadcn/ui + React Hook Form + Zod" | none | — |
| 56 | "Framework: Next.js (App Router) — RSC, Server Actions, Route Handlers (auth, webhook intake)" | none | — |
| 57 | "DB: Railway Postgres + Drizzle (default; Prisma = plan B, Kysely = specialist)." | none | Prisma plan B, Kysely specialist |
| 58 | "Auth: Better Auth (email/pw + Google login). Google login = login only, NOT Gmail access." | none | — |
| 60 | "Jobs/queue: pick tier per project — DB-jobs+Railway cron → BullMQ+Redis → Inngest/Trigger.dev (sequences/waits) → Temporal. Durable orchestration + latency speed-up …: the `sailes-async` skill." | none | tiered — choose by need |
| 62 | "Storage: Railway Buckets (S3-compatible). Files private, signed URLs, metadata in Postgres, access log. R2/S3 for stronger compliance." | none | R2/S3 alternative |
| 63 | "Observability: structured logs + request-id + job/webhook/audit logs; Sentry + PostHog for production." | none | production-only |
| 64 | "Hosting: Railway (web + worker + Postgres + Buckets), envs local/dev/prod." | none | — |
| 88 | "End every task with a check you run: lint, typecheck, unit/integration, Playwright E2E for user-critical flows." | none | — |
| 94 | "Roles in `~/.claude/agents/`: `team-lead` …, `explorer` …, `designer` …, `be-dev`/`fe-dev`, `checker` …, `qa`" | none | — |
| 97 | "Enable teammates: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `~/.claude/settings.json`. **Without it**, the same roles/order/gates run as sequential scoped subagents (the model doesn't depend on the flag)" | env var | documented fallback |
| 98 | "load the global `sailes-bootstrap` skill — its `agent-team-structure.md` is the canon. (It is a globally-installed skill, not a file in this repo.)" | none | — |
| 106–109 | "`pnpm install` · `pnpm dev` · `pnpm build`" · "`pnpm test` (unit, fast inner loop) · `pnpm test:e2e` (Playwright)" · "`pnpm lint` · `pnpm typecheck`" · "`pnpm db:generate` / `db:migrate` / `db:push` (Drizzle; push for prototyping)" | none | — |
| 110 | "`graphify update .` — refresh the code map after edits (post-commit hook does this automatically; run manually before querying mid-task)" | none | — |
| 153 | "`graphify query "<question>"` · `graphify path A B` · `graphify explain X` (map at graphify-out/; if graph.json is older than the last commit, run `graphify update .` first — **fall back to grep when the map is stale or missing**)" | none | explicit fallback: grep |

---

## 6. `skills/sailes-bootstrap/backlog-template.md`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 5 | "**Idempotent:** if `.ai/backlog.md` (or another backlog/roadmap convention) already exists in the repo, don't overwrite — append to the existing one." | none | append, never overwrite |
| 20 | "Promote → when an item is picked up, create a spec (`sailes-spec`) and mark the row `→ spec: <path>`." | none | — |

*(No external binary/package/service mentions in this file beyond the `sailes-spec` skill reference.)*

---

## 7. `skills/sailes-bootstrap/codex-config-template.md`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 1–8 | "Generate this at repo root **alongside** `.claude/settings.json` so the repo's guardrails work whether a developer drives it with **Claude Code** or **OpenAI Codex CLI**." | none | — |
| 11 | "Codex reads `AGENTS.md` natively (global `~/.codex` → repo root → subdir hierarchy), so the instructions transfer for free." | none | — |
| 17 | "`hooks.SessionStart` → inject `.ai/STATE.md` | `[[hooks.SessionStart]]` → same script, stdout is appended as context | **Identical contract.** Reuse the script verbatim." | none | — |
| 18 | "`hooks.PreToolUse` (matcher `Edit\|Write`) … | `[[hooks.PreToolUse]]` (matcher `apply_patch\|Edit\|Write`) → same script | Same stdin-JSON payload + exit-2-to-block contract. **Caveat below.**" | none | see caveat L33–38 |
| 19 | "`permissions.allow` … | `sandbox_mode = "workspace-write"` + `approval_policy = "on-request"` | Codex has no per-command allowlist; the sandbox is the model" | none | — |
| 22 | "**Hook contract is the same in both harnesses** (verified against Codex hooks reference)" | verified against Codex hooks reference | — |
| 33–38 | "> ⚠️ **Known Codex limitation (encode it, don't paper over it).** On some Codex versions `PreToolUse` fires **only for the `Bash` tool** — `apply_patch` file edits may **not** emit the event (**openai/codex issue #16732**). So the `apply_patch\|Edit\|Write` matcher below is best-effort … the backstop is (a) the `Bash` matcher still catches shell-driven writes …, (b) `sandbox_mode`/`approval_policy` still gate escapes, and (c) the AGENTS.md **Hard Safety Rules** remain the prose fallback." | "some Codex versions"; issue #16732 | three-layer documented backstop; "Do **not** claim file-edit protection is airtight under Codex" |
| 52–53 | "sandbox_mode    = "workspace-write"" · "approval_policy = "on-request"" | none | — |
| 56–57 | "network_access = false          # flip to true only if the dev loop needs it (installs, etc.)" · "exclude_slash_tmp = false" | none | — |
| 63 | "command = 'sh "$(git rev-parse --show-toplevel)/.claude/hooks/session-start.sh"'" | none | requires `sh` + `git` |
| 64–65 | "statusMessage = "Loading .ai/STATE.md + Task Router"" · "timeout = 15" | timeout 15 | — |
| 72–74 | "command = 'sh "$(git rev-parse --show-toplevel)/.claude/hooks/guard-protected-paths.sh"'" · "timeout = 30" | timeout 30 | — |
| 85–95 | "# --- MCP servers (optional): the Codex equivalent of .mcp.json ---" · "# Browser inspection — the Codex twin of the committed .mcp.json (decision-engine Q21). # Include it when the project chose option A" · "# [mcp_servers.chrome-devtools] # command = "npx" # args = ["-y", "chrome-devtools-mcp@latest"]" · "# [mcp_servers.example] # command = "npx" # args = ["-y", "@some/mcp-server"] # env = { API_KEY = "env:EXAMPLE_API_KEY" }" | `chrome-devtools-mcp@latest` | commented out by default — include only when Q21 = option A |
| 110–113 | "| `hooks-template/session-start.sh` | `.claude/hooks/session-start.sh` |" · "| `hooks-template/guard-protected-paths.sh` | `.claude/hooks/guard-protected-paths.sh` |" | none | — |
| 115–117 | "`cp` them and `chmod +x`. They were prose here until 1.9.0, which meant the only mechanical enforcement the framework owns depended on an agent retyping shell correctly" | since framework **1.9.0** | — |
| 119–122 | "> The guard is intentionally a **string-match on the raw payload** (no `jq`) so it is portable across both harnesses and any OS shell. … For richer command policy on Codex, layer `execpolicy` rules or an `approval_policy = { granular = { … } }` block." | none | explicitly avoids `jq` for portability |
| 127 | "**`.github/copilot-instructions.md`** → a one-line pointer to `AGENTS.md` (or a short copy), so the third common harness reads the same source of truth." | none | "(or a short copy)" |
| 136–143 | verification shell: `[ -e ]`, `grep -oE`, `sort -u`, `while read` — "echo "MISS $f"" / "echo "DRIFT .codex/config.toml references missing $s"" | none | prints MISS / DRIFT |

---

## 8. `skills/sailes-bootstrap/deciding-under-uncertainty.md`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 30 | "| **Probe the live tool** | The claim is about an API, a schema, a flag, a version | The actual call and its actual response |" | none | — |
| 35–37 | "On 2026-07-26 the Agent tool's `effort` parameter was asserted to work from exactly that reading; two evals probing the live tool found it is not a declared parameter at all, and — worse — that passing it raises no error. **A parameter accepted without effect is indistinguishable from one that works, until something probes it.**" | dated 2026-07-26 | — |
| 45 | "**Fix the criterion before dispatching, and derive it mechanically.** Grep, count, list — something a script produces" | none | — |
| 55–57 | "**The deliverable is a FILE, and the brief says "no file = task not done".** Measured 2026-07-25: four message-deliverable briefs produced six empty returns" | dated | — |
| 67–70 | "Measured 2026-07-26: an "async export means a worker and a queue" fork evaporated once someone checked that this baseline already ships a mandatory worker and a DB-jobs tier" | none | — |
| 109–111 | "Framework/doctrine forks → `.ai/eval-runs/<date>-<name>/`, plus an `evals/` scenario if the outcome becomes a protected behavior." | none | — |
| 114–115 | "See `evals/harness/README.md` for the full A/B protocol used on the framework itself, and `agent-team-structure.md` for who dispatches the arms." | none | — |

---

## 9. `skills/sailes-bootstrap/decision-engine.md`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 3 | "Ask in adaptive rounds of 3-4 via `AskUserQuestion` (not one dump)" | none | — |
| 14–15 | "3.  Is Pipedrive needed?                               → pipedrive module" · "4.  Embedded in Pipedrive?                             → apps/pipedrive-extension + marketplace OAuth" | none | module only if answered yes |
| 16 | "6.  API keys / webhook secrets needed?                 → machine-to-machine security" | none | — |
| 28 | "16. Which critical flows need Playwright E2E?          → test plan" | none | — |
| 32 | "21. Has the repo any UI at all?                        → browser-inspection MCP in .mcp.json (opt-in)" | none | **opt-in** |
| 35–39 | "**Q21 — browser inspection (decision card, UI projects only).** … without a DevTools connection the agent verifies them by looking at a screenshot, which is an impression. Committing a `.mcp.json` to the repo makes the measurement available to every agent and developer on the project" | none | screenshot fallback = "an impression" |
| 41–44 | "```jsonc // .mcp.json — project-scoped, committed. **Machine prereq: a Chrome/Chromium install.** { "mcpServers": { "chrome-devtools": { "command": "npx", "args": ["-y", "chrome-devtools-mcp@latest"] } } }```" | `chrome-devtools-mcp@latest`; prereq Chrome/Chromium | — |
| 49 | "**A — commit `.mcp.json` (recommended for any repo with UI)** | … | One more tool surface; **needs Chrome on each machine**; a second browser stack alongside Playwright |" | none | — |
| 50 | "B — leave it out | Nothing new to install | Three gates stay eyeballed; **every UI run carries a `SKIP browser-inspect` line** |" | none | explicit SKIP line |
| 51 | "C — per-developer, user scope only | No repo change | Silent asymmetry: the gate is measured on one machine and skipped on another, with no signal in the repo |" | none | — |
| 53–57 | "It never becomes mandatory: the fallback in `../sailes-design/browser-inspect.md` §Availability (screenshot + explicit SKIP) is a first-class path, and **no skill blocks on the server being present**. Codex twin: the same server goes under `[mcp_servers.chrome-devtools]` in `.codex/config.toml`" | none | screenshot + explicit SKIP; never blocks |
| 64–71 | "S1. Public pages / SEO … ⇒ SSR (Next.js) | login-only ⇒ SPA is allowed" · "S2. Who consumes the backend? → only web ⇒ fullstack OK | web + **n8n/FHIR/CRM/mobile/3rd-party** ⇒ standalone API" · "S6. Interop standard imposed (**FHIR, EDI, HL7**…)? → yes ⇒ mapping layer + dedicated libs" · "S7. Embedded in another platform (iframe/panel)? ⇒ SPA + that platform's SDK as a separate artifact (see sailes-pipedrive)" | none | — |
| 75–77 | "**Default — Next.js fullstack** …" · "**Variant — SPA (Vite+React) + standalone API** … The API engine is itself a decision card (**Fastify / Hono / Express** — see baseline)." · "**Hybrid (Next + separate API)** … justify in an ADR." | none | — |
| 84–90 | "D1. Who builds it? (in-house / contractor / agency / AI-agent)" … "D4. Domain/integration experience (**Pipedrive, FHIR**, …)?" | none | — |
| 93 | "(e.g. "dev prefers **Express**, but API-first validation for medical data → **Fastify**; ADR-XXX")" | none | requirement wins → ADR |
| 117 | "auth              ← always (**Better Auth**; variants per Q5)" | none | always on |
| 122 | "observability     ← always (**Sentry+PostHog** if Q19 = production)" | none | Sentry/PostHog only when production |
| 130 | "**Production client system:** security checklist (`security-checklist.md`) is **mandatory**; **Sentry + PostHog** recommended; audit log required." | none | prototype: "may warn on missing security/observability but proceed" (L129) |

---

## 10. `skills/sailes-bootstrap/developer-fit.md`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 18 | "| **Domain / integration experience** | done **Pipedrive / FHIR / this CRM** before? | Build on strengths; budget research time where they're new (use `deep-research`). |" | none | — |
| 22 | "| **Ops capacity** | who runs it in prod? appetite for extra services (**Redis**, separate API)? | Low ops appetite → fewer services (**Postgres-jobs over Redis**, fullstack over split). |" | none | Postgres-jobs replaces Redis |
| 34 | "(e.g. "I like **SQLite**" vs "14-clinic multi-tenant **Postgres**" → Postgres wins)" | none | requirement wins |
| 46–49 | "A) **Fastify** — ✅ schema/Zod validation first-class, szybki, świetne logi ⚠️ mniejszy ekosystem niż Express" · "B) **Hono** — ✅ ultralekki, świetne typy, edge-ready ⚠️ młodszy, mniej pluginów" · "C) **Express** — ✅ największy ekosystem, wszyscy znają ⚠️ walidacja/typy ręcznie, starsze wzorce" | none | decision card |

---

## 11. `skills/sailes-bootstrap/graphify-setup.md`  *(densest tool file in the slice)*

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 3–8 | "Every Sailes repo carries a queryable knowledge graph of its own code (`graphify-out/graph.json`), built deterministically from **tree-sitter AST** — free, local, no API key. Agents query it (`graphify query\|path\|explain`) instead of grepping; a git post-commit hook keeps it fresh at zero cost. **Validated against `graphifyy >= 0.9.23`** (PyPI package is `graphifyy`, double-y; the CLI command is `graphify`)." | **`graphifyy >= 0.9.23`** | see "If graphify is missing" |
| 11–14 | "Order matters: (1) our `.claude/settings.json` must already exist so graphify MERGES into it (it does — it filters+appends only its own marker-delimited hook entries and never touches `permissions.*`)" | none | ordering constraint |
| 18 | "# 0) Binary present? (machine prereq: **uv tool install graphifyy**)" · "command -v graphify >/dev/null \|\| echo "MISSING graphify — see 'If graphify is missing'"" | none | prints MISSING, routes to fallback section |
| 21 | "graphify extract . --code-only" | none | — |
| 26 | "graphify hook install" (+ "a union-merge driver so graph.json never gets conflict markers") | none | — |
| 30 | "graphify claude install" — "Claude Code always-on: CLAUDE.md section + PreToolUse nudge hooks (merges into the existing .claude/settings.json; nudge mode, NOT --strict)" | none | nudge, not strict |
| 34 | "graphify codex install" — "Codex twin: AGENTS.md section + .codex/hooks.json (separate file from our .codex/config.toml — no conflict)" | none | — |
| 36–42 | "the installers write the ABSOLUTE local binary path (e.g. C:/Users/you/.local/bin/graphify.EXE) into .claude/settings.json and .codex/hooks.json. Both files are committed, so that path would break the hooks on every other machine. Normalize to the bare `graphify` command — it resolves from PATH (**uv/pipx** put it there)" + `sed -i -E` normalization loop | none | REQUIRED normalization before commit |
| 51 | "for l in 'graphify-out/cost.json' 'graphify-out/cache/' 'graphify-out/20*/'; do grep -qxF "$l" .gitignore … done" | none | — |
| 55 | "# .claudeignore — REQUIRED: without this every rebuild invalidates the Claude Code prompt cache (full re-upload at cache-write rates)" · "for l in 'graphify-out/' 'graph.json'; do …" | none | REQUIRED |
| 61–65 | "# .gitattributes carries the union-merge driver `graphify hook install` just registered. # Omit it and the driver stays on this machine: everyone else still gets conflict markers in graph.json … Found 2026-07-26 by running this." · "git add graphify-out/ .gitattributes .gitignore .claudeignore .claude/settings.json CLAUDE.md AGENTS.md .codex/" · "git commit -m "chore: graphify code map + freshness hooks (Sailes default)"" | none | — |
| 68–76 | "## If graphify is missing — **NEVER block the phase.** In order: 1. Tell the user the one-liner: `uv tool install graphifyy` (fallback: `pipx install graphifyy`). If they run it, continue the procedure. 2. If it cannot be installed now (**offline, no uv/pipx, CI image**): record `Open failure: graphify not installed — code map skipped at bootstrap` in `.ai/STATE.md`, let the done-checklist print `SKIP graphify (binary missing)` — an explicit line, never silence — and move on. The procedure is re-runnable any time later, verbatim." | none | full documented fallback ladder: install hint → STATE.md open failure → explicit SKIP → never block |
| 80–85 | "Agents treat the graph as CURRENT if `graphify-out/graph.json`'s mtime is not older than the previous commit's timestamp (`git log -2 --format=%ct \| tail -1`) … Otherwise run `graphify update .` first (seconds, free) **or fall back to grep for that question**." | none | fallback: grep |
| 86–87 | "A refactor that DELETED files can leave ghost nodes: `graphify extract . --code-only --force`." | none | — |
| 90–91 | "**Semantic docs pass** (links `.ai/` specs/ADRs ↔ code as rationale nodes; uses the IDE session's model): run `/graphify .` at a milestone — e.g. the release gate — not per-commit." | none | optional, not a bootstrap step |
| 92–94 | "**Strict mode** (block the first raw source read per session, then revert to nudge): `GRAPHIFY_HOOK_STRICT=1`, or reinstall with `graphify install --project --strict`. Per-repo choice; **the Sailes default stays nudge.**" | env var | default nudge |
| 96 | "**PR impact**: `graphify prs --conflicts` (merge-order risk by shared graph communities) **when the repo lives on GitHub**." | none | GitHub-conditional |
| 97–98 | "**Architecture doc**: `graphify export callflow-html` → commit under `docs/` if the client wants a browsable architecture page." | none | client-conditional |
| 102–103 | "`graphify claude uninstall && graphify codex uninstall && graphify hook uninstall` — all marker-delimited, all reversible. `graphify uninstall --purge` also deletes `graphify-out/`." | none | — |

---

## 12. `skills/sailes-bootstrap/hooks-template/guard-protected-paths.sh`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 1 | "#!/usr/bin/env sh" | POSIX sh | — |
| 3–5 | "blocks (exit 2 + reason on stderr) when a tool call touches the protected surface. # Payload is the same in both harnesses … # **No jq dependency — grep the raw JSON so it runs anywhere.**" | none | deliberately avoids `jq` |
| 12 | "*'push --force'*\|*'push -f'*)        block "force-push is denied (Hard Safety Rules)";;" | none | exit 2 block |
| 13 | "*'reset --hard'*)                    block "reset --hard is denied — use git restore / revert";;" | none | exit 2 block |
| 14 | "*'db:migrate:prod'*)                 block "production migration needs explicit human approval";;" | none | exit 2 block |
| 15 | "*' deploy'*prod*\|*prod*' deploy'*)   block "production deploy is denied — no auto-deploy";;" | none | exit 2 block |
| 20 | "*'.env'*)                            block "secrets/.env are protected — never read/write via a tool";;" | none | exit 2 block |
| 21 | "*'/migrations/'*\|*'\migrations\'*) block "applied migrations are immutable — add a NEW migration";;" | none | exit 2 block |
| 22 | "*'.ai/specs/implemented/'*)          block "implemented specs are frozen — write a new spec";;" | none | exit 2 block |

---

## 13. `skills/sailes-bootstrap/hooks-template/session-start.sh`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 1–2 | "#!/usr/bin/env sh" · "# SessionStart: emit session memory to stdout — both Claude Code and Codex append it as context." | POSIX sh | — |
| 3 | "ROOT="$(git rev-parse --show-toplevel 2>/dev/null \|\| pwd)"" | requires `git` | **fallback to `pwd`** when git is absent/not a repo |
| 4 | "cat "$ROOT/.ai/STATE.md" 2>/dev/null" | none | errors suppressed — silent no-op if STATE.md missing |

---

## 14. `skills/sailes-bootstrap/modules-catalog.md`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 19 | "| **Simple** | background jobs, simple schedules | DB-backed jobs / polling + **Railway cron** + **Node worker** |" | none | tier chosen by need |
| 20 | "| **Medium** | medium throughput queues | **BullMQ + Redis** |" | none | only at Medium tier |
| 21 | "| **Workflow-heavy** | sequences, waits, conditional follow-ups | **Inngest (default) / Trigger.dev** |" | none | only at this tier |
| 22 | "| **Advanced** | complex durable orchestration | **Temporal** |" | none | only at this tier |
| 36 | "**Required mechanisms:** `webhook_events`, `integration_accounts`, `sync_runs`, `idempotency_keys`, rate-limit handling, retry, backoff, dead-letter/failed state, job logs." | none | — |
| 38 | "Typical integrations: **Pipedrive · Google/Gmail/Workspace · SMTP · CRM systems · phone systems · external APIs · file imports.**" | none | — |
| 48 | "Level 1 — transactional (notifications, reset, invites, confirmations; **Resend/Postmark/SendGrid**)" | none | Level-gated |
| 50 | "Level 3 — connected mailbox (**Google/Gmail OAuth or SMTP/IMAP**; token storage+refresh, worker sync, messages, threads)" | none | Level-gated |
| 57 | "**Rule:** Google **login** (**Better Auth**, core) ≠ Gmail **access** (Email Level 3+, optional…)" | none | — |
| 70 | "Level 4 — heavy reporting (materialized views, precomputed aggregates, background refresh, async exports, PDF/XLSX)" | none | Level-gated |
| 75 | "**Exports:** async job + **Railway Bucket** + Postgres metadata." | none | — |
| 91 | "**Embedding:** Pipedrive marketplace apps need their own **OAuth2** flow + app-extension (iframe+SDK) → carve out `apps/pipedrive-extension` or `packages/integrations/pipedrive`." | none | — |
| 97 | "Default **Railway Buckets** (S3-compatible). **Never use local filesystem or Railway Volumes as the source of truth** for user-uploaded files." | none | explicit prohibition of alternatives |
| 105 | "Stronger compliance (encryption, object-lock, versioning, lifecycle) → recommend **Cloudflare R2 or AWS S3** instead." | none | conditional swap |
| 111 | "Default: simple DB-based (`feature_flags`, `user_feature_flags`) … Managed (**LaunchDarkly/Statsig/Unleash**) only for larger SaaS." | none | managed only for larger SaaS |
| 117–118 | "Always: structured logs, request-id, job logs, webhook logs, audit logs, error handling. Production client app: **Sentry + PostHog** recommended. Extensions: **OpenTelemetry**, external log drain (**Better Stack/Axiom/Logtail**), custom metrics." | none | recommended / extension tiers |
| 124 | "[ ] error tracking wired AND alerting a human channel (**a silent Sentry is decoration**)" | none | — |
| 126 | "[ ] backups scheduled AND one restore actually performed (untested backup = a hope)" | none | — |
| 128 | "[ ] .ai/runbook.md one-pager: deployed where, logs, restart, restore, who to call" | none | — |
| 137–146 | "**Built ~twice across Sailes projects → extraction candidate.** … **An extracted golden module ships with its proofs** … versioned in the Sailes golden-module library (**separate repo**). **Bootstrap checks the library BEFORE scaffolding a module from scratch**" | none | "Rebuilding a hardened module at full cost is the failure mode." |

---

## 15. `skills/sailes-bootstrap/release-checklist.md`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 5–7 | "for a **prototype** you may warn; for a **production client app** it is **required**." | none | prototype → warn only |
| 11–14 | "Generated into new repos as `.ai/checklists/deployment.md`'s backbone (**idempotent** — if the repo already has a deployment checklist, merge additively)." | none | merge additively |
| 19–21 | "[ ] staging exists and runs the SAME migrations + seeds as the release candidate" · "[ ] config/secret diff staging↔prod reviewed by NAME (variable names, not values — every var the app reads exists in prod; **.env.example is the authoritative list**)" · "[ ] third-party callbacks (**webhooks, OAuth redirect URIs**) registered for the prod URLs" | none | — |
| 31 | "[ ] prod migration command is written down verbatim (and requires human approval to run)" | none | — |
| 39–43 | "[ ] **/health** returns 200 (app + DB + worker/queue all green)" · "[ ] login works (fixture-safe account or a designated smoke account)" · "[ ] output of the smoke script pasted into the run log" | none | — |
| 51–52 | "[ ] "the deploy is bad — what exactly do we run/click to go back?" (**platform rollback command / previous image / revert PR** — named, not implied)" | none | — |
| 56 | "[ ] who executes it and where it's documented (**.ai/runbook.md**)" | none | — |
| 61–65 | "**No automatic prod deploys; no prod migration without approval**" · "**A deploy without a pre-written rollback plan is not approved.**" · "**A "successful" deploy without pasted smoke output is not done**" | none | hard lines |

---

## 16. `skills/sailes-bootstrap/repo-done-checklist.md`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 3 | "It is done when `find`/`ls`/`git log` prove they exist." | none | — |
| 20 | "| `package.json` + `pnpm-workspace.yaml` | The monorepo actually resolves. |" | none | mandatory (Case B) |
| 22 | "| **git initialized + first commit** | A repo with 0 commits is not a working repo. |" | none | mandatory |
| 24 | "| `.claude/settings.json` (+ hooks) | Harness guardrails: verify-commands allowlist, protected-path denies, SessionStart STATE.md injection. Structural discipline beats agent goodwill. |" | none | mandatory |
| 25 | "| `.codex/config.toml` (Codex twin) | Same guardrails for Codex CLI (sandbox/approval + `[hooks]` reusing `.claude/hooks/*.sh`). A Sailes app must run *guarded*, not just *readable*, under Codex. |" | none | mandatory |
| 26 | "| `.github/copilot-instructions.md` | One-line pointer to `AGENTS.md` — third harness reads the same source of truth. |" | none | mandatory |
| 27 | "| `graphify-out/graph.json` (committed) + `.claudeignore` covering `graphify-out/` | The code map every agent queries before grepping (Step 4.9). `.claudeignore` guard: without it each rebuild invalidates the Claude Code prompt cache. **If the binary was unavailable, an explicit SKIP recorded in `.ai/STATE.md` replaces this row — silence is the failure.** |" | none | explicit SKIP replaces the row |
| 28 | "| graphify git hooks installed (proof: marker-delimited post-commit hook in `.git/hooks`; human check `graphify hook status`) | Freshness: post-commit AST rebuild + `graph.json` merge driver. A stale map that agents trust is worse than no map. |" | none | — |
| 29 | "| `.mcp.json` — **only if Q21 = option A** (`decision-engine.md`) | Browser inspection available to every agent on a UI repo … Chose B or C, or the repo has no UI? This row does not apply — but the Q21 answer must be in the Decisions Ledger, and **UI runs will carry `SKIP browser-inspect`**. Codex twin: `[mcp_servers.chrome-devtools]` in `.codex/config.toml`. |" | none | conditional row + SKIP line |
| 36–53 | verification block: `[ -e ]`, `[ -d ]`, `grep -q "@AGENTS.md"`, "git -C "$ROOT" rev-parse --is-inside-work-tree", "git -C "$ROOT" rev-list --all --count" | none | prints `MISS` |
| 73–80 | "echo "== code map (graphify — Step 4.9) ==" · if command -v graphify >/dev/null 2>&1; then … else echo "**SKIP graphify (binary missing — uv tool install graphifyy; record in .ai/STATE.md)**" fi" | none | explicit SKIP line + install hint |
| 76 | "grep -q "graphify-out" "$ROOT/.claudeignore" … \|\| echo "MISS .claudeignore entry"" | none | MISS |
| 77 | "{ [ -f "$ROOT/.git/hooks/post-commit" ] && grep -q graphify "$ROOT/.git/hooks/post-commit"; } && echo "OK   freshness hooks (post-commit)" \|\| echo "MISS graphify hook install"" | none | MISS |
| 83 | "**Any `MISS` line means bootstrap is NOT done.**" | none | hard gate |
| 87–94 | "**A green scripted block is not a usable repo, and must never be handed off as one.** … Measured 2026-07-26 — a full bootstrap passed every mandatory row while the app could not boot and `qa` could not log in, because **no dependencies were installed and no user was seeded**." | dated 2026-07-26 | report presence and boot separately |
| 101–109 | "[ ] ONE-COMMAND BOOT: clean clone → running app WITH seeded data via a single documented command (e.g. `pnpm setup && pnpm dev`)." · "[ ] FIXTURE USERS: at least one seeded user PER RBAC ROLE … `qa` blocked on creds = **ENV-DEFECT**, a bootstrap bug, never a skipped proof" · "[ ] FAST VERDICT: a single `check` command (typecheck+lint+unit) exists" · "[ ] .env.example COMPLETE" | none | ENV-DEFECT, not a skipped proof |
| 118–130 | freshness check: "grep -oE '[A-Za-z0-9_./-]+\.(md\|ts\|tsx\|json\|yml)' AGENTS.md …" · "# The class MUST carry digits: without them `pnpm test:e2e` truncates to `test:e` and this check reports DRIFT on a script that exists. Found 2026-07-26 by running the skill, not by reading it." · "grep -oE 'pnpm [a-z0-9:-]+' AGENTS.md … \| grep -vE '^(install\|add\|remove\|dlx\|exec\|run\|why\|update\|outdated)$'" | none | `DRIFT` line blocks "done" |
| 142–149 | "[ ] ERROR TRACKING wired AND ALERTING A HUMAN CHANNEL … Default category: error tracking (**Sentry**); prove one test event reached the channel." · "[ ] **/health** ENDPOINT covering app + DB + worker/queue" · "[ ] BACKUPS scheduled AND ONE RESTORE ACTUALLY PERFORMED" · "[ ] UPTIME CHECK on the public URL" · "[ ] .ai/runbook.md one-pager filled" | none | "Required for a production client app (prototype: warn, like the security checklist)" |
| 159 | "harness guardrails present for both harnesses in scope: `.claude/settings.json` and (default) `.codex/config.toml` sharing `.claude/hooks/*.sh`" | none | "both harnesses **in scope**" |

---

## 17. `skills/sailes-bootstrap/repo-done-checklist.test.js`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 1 | "#!/usr/bin/env node" | Node runtime | — |
| 7–10 | "Its class was `pnpm [a-z:-]+`, so `pnpm test:e2e` truncated to `test:e` and the checklist reported DRIFT on a script that exists. Found 2026-07-26 by an eval that ran the skill end-to-end on a real repo" | dated | — |
| 16 | "Run: node skills/sailes-bootstrap/repo-done-checklist.test.js   (or `npm test`)" | Node / npm | — |
| 19–21 | "const assert = require('assert'); const fs = require('fs'); const path = require('path');" | Node core modules only — no third-party deps | — |
| 41 | "const m = text.match(/grep -oE '(pnpm \[[^\]]+\]\+)'/);" | none | "throw new Error('could not find the `grep -oE` drift scan in the doc')" |
| 50 | "const m = text.match(/grep -vE '\^\(([^)]+)\)\$'/);" | none | "throw new Error('could not find the `grep -vE` builtin exclusion in the doc')" |
| 64–77 | "'pnpm test:e2e'" · "for (const s of ['pnpm db:seed', 'pnpm check', 'pnpm test:unit', 'pnpm lint', 'pnpm e2e'])" | none | — |
| 82–88 | "// `pnpm install` is in the template's own Key Commands; treating it as a missing script makes the check cry wolf on every generated repo." · "for (const b of ['add', 'exec', 'dlx'])" | none | — |
| 124 | "process.exit(failures === 0 ? 0 : 1);" | none | non-zero exit on failure |

---

## 18. `skills/sailes-bootstrap/security-checklist.md`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 3 | "For a **prototype** you may warn; for a **production client app** this checklist is **required**" | none | prototype → warn |
| 11 | "[ ] input validation with **Zod** at every boundary (forms, server actions, route handlers, webhooks, adapters)" | none | — |
| 12–14 | "[ ] rate limiting on public / API / webhook endpoints" · "[ ] signed webhook / API secrets (verify before processing)" · "[ ] idempotency keys on integration intake" | none | — |
| 21 | "[ ] production deploy protected (no automatic prod deploy; no prod migration without approval)" | none | — |
| 38 | "[ ] **Better Auth** configured; email verification enabled for production" | none | — |
| 39 | "[ ] Google login = login only (NOT Gmail access — that's the Email module, Level 3+)" | none | — |
| 45 | "[ ] API keys / signed secrets for machine-to-machine + webhooks" | none | — |
| 46 | "[ ] integration tokens stored securely; refresh handled in worker" | none | — |
| 63 | "[ ] sensitive files → consider **R2/S3** with encryption/object-lock/versioning/lifecycle" | none | conditional |

---

## 19. `skills/sailes-bootstrap/settings-template.json`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 1–3 | "// Copy to a NEW repo as .claude/settings.json (strip these // comments — JSON has no comments)." | none | — |
| 10–12 | "// Hook commands below are illustrative shell one-liners; move non-trivial logic into .claude/hooks/*.sh and call the script here. See Claude Code docs for the hook JSON contract (a PreToolUse hook that prints to stderr and exits non-zero blocks the tool call)." | none | — |
| 14–18 | "// CODEX TWIN: generate .codex/config.toml alongside this file (see codex-config-template.md). // Codex uses the SAME hook contract … A repo is "Codex-ready" only when BOTH configs exist and point at the scripts." | none | — |
| 22–30 | ""Bash(pnpm test:*)", "Bash(pnpm lint:*)", "Bash(pnpm typecheck:*)", "Bash(pnpm build:*)", "Bash(pnpm dev:*)", "Bash(pnpm db:generate:*)", "**Bash(graphify:*)**", "Bash(git status:*)", "Bash(git diff:*)" | none | allowlist — run without a prompt |
| 33–41 | ""Read(./.env)", "Read(./.env.*)", "Edit(./.env)", "Edit(./.env.*)", "Edit(./packages/db/migrations/**)", "Edit(./.ai/specs/implemented/**)", "Bash(git push --force:*)", "Bash(git push -f:*)", "Bash(pnpm db:migrate:prod:*)" | none | denied surface |
| 50 | ""command": "sh \"$(git rev-parse --show-toplevel)/.claude/hooks/session-start.sh\""" | requires `sh`, `git` | — |
| 57–61 | ""matcher": "Edit\|Write"" · ""command": ".claude/hooks/guard-protected-paths.sh"" | none | — |

---

## 20. `skills/sailes-bootstrap/skeleton.md`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 8 | "web/                  # **Next.js App Router** — UI, server actions, route handlers," | none | — |
| 18 | "db/                   # **Drizzle**: schema/ migrations/ seeds/ src/" | none | — |
| 19–21 | "#   seeds MUST include one fixture user PER RBAC ROLE + a realistic #   minimal dataset — qa can always log in and drive real flows" | none | — |
| 22–23 | "contracts/            # shared API contracts: **Zod** schemas + inferred TS types" | none | — |
| 24 | "auth/                 # **Better Auth** setup" | none | — |
| 25 | "ui/                   # **shadcn/ui** components" | none | — |
| 26 | "files/                # **Railway Buckets**: signed URLs, metadata, access log" | none | — |
| 27 | "integrations/         # ports & adapters — **pipedrive/ google/** webhooks/" | none | — |
| 29 | "testing/             # shared test utils, **Testcontainers** helpers" | none | — |
| 30 | "observability/        # structured logs, request-id, **Sentry/PostHog** wiring" | none | — |
| 31–32 | "email/        (opt)   # only if Email module activated (level-based)" · "reporting/    (opt)   # only if Reporting module activated (level-based)" | none | opt-in only |
| 34–36 | ".ai/                    # generate the FULL structure on a new repo. **IDEMPOTENT**: if any of these #   already exist in the repo, do NOT overwrite … (Pattern: **Open-Mercato** .ai/.)" | none | never overwrite |
| 61–62 | ".husky/ pre-commit            # lint + typecheck (+ format/i18n) — deterministic gate before commit" | none | — |
| 63–65 | ".github/ workflows/ci.yml      # lint → typecheck → unit → integration → e2e → security scan" · "copilot-instructions.md  # → one-line pointer to AGENTS.md (Copilot). One source, three harnesses." | none | — |
| 67–83 | ".claude/                # Claude Code harness guardrails … settings.json … (copy from sailes-bootstrap/settings-template.json)" · "hooks/  #   hook scripts invoked by settings.json — COPY them from this skill's #   hooks-template/ (session-start.sh, guard-protected-paths.sh) and #   chmod +x; do not retype them. **Harness-optional: in a harness without #   hooks the AGENTS.md prose rules are the fallback** (the Guardrails note #   there says which rules lost their backstop)" | none | prose fallback in a hook-less harness |
| 84–89 | ".codex/                 # Codex CLI harness guardrails — the twin of .claude/ … Generate by default so a Sailes app runs guarded under Codex too, not just readable. **Caveat: some Codex versions fire PreToolUse only for Bash.**" | "some Codex versions" | — |
| 97–99 | "pnpm-workspace.yaml" · "turbo.json              # **optional**, when builds multiply" · "docker-compose.yml      # **optional**, local Postgres" | none | both optional |
| 102 | "**Single-repo vs monorepo:** default to the monorepo above even for a small first project … Start single-repo only if you're certain you won't split web/worker/extensions" | none | single-repo allowed conditionally |
| 118 | "6.  Always protect files with signed URLs + access control before URL." | none | — |
| 122–124 | "10. Always write or identify a RED test before implementation." · "12. Always run **Playwright E2E** for user-critical flows." | none | — |
| 127 | "15. Never treat Google login as Gmail access." | none | — |
| 133–135 | "**Code map ignores:** `.gitignore` gets `graphify-out/cost.json` + `graphify-out/cache/`; `.claudeignore` gets `graphify-out/` + `graph.json` (prompt-cache guard). The map itself (`graphify-out/graph.json`, `GRAPH_REPORT.md`) IS committed" | none | — |

---

## 21. `skills/sailes-bootstrap/spec-writing-template.md`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 3 | "It is **stack-agnostic** (tuned to the baseline stack, no Open-Mercato coupling). Adapt the `## Stack conventions` block to whatever stack the project actually locked." | none | — |
| 7 | "This template MIRRORS the global **`sailes-spec`** skill (the master). … The generated local copy wins in-repo (tuned to the locked stack); **`sailes-spec` is the fallback when no local copy exists**." | none | explicit fallback |
| 31 | "the exact command(s) to run + the expected outcome (e.g. `pnpm test src/auth → 0 failures`; `curl -s -o /dev/null -w '%{http_code}' -X POST /api/export → 200 + non-empty file`; UI: screenshot of screen X matches the design artifact)" | none | requires `pnpm`, `curl` |
| 37 | "When a feature ships → `Status: implemented` + `git mv` to `implemented/`" | none | requires `git` |
| 45 | "**Name the contract artifact path(s)** this spec creates/extends (shared **Zod** schemas / TS types both slices import…)" | none | — |
| 55 | "- ORM: **Drizzle** — explicit schema in TS, migrations committed + reviewed." | none | "(adapt to this repo's locked stack)" (L53) |
| 56 | "- Auth: **Better Auth** (Google login = login only, never Gmail access)." | none | same adaptation note |
| 58 | "- Validation: **Zod** at every boundary; types via z.infer; no `any`." | none | same |
| 60 | "- Tests: **Vitest + MSW + Testcontainers + Playwright**; self-contained, no faked passes." | none | same |

---

## 22. `skills/sailes-bootstrap/stack-baseline.md`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 5 | "**Owner preference (load-bearing):** **self-hosted on Railway, simple, no AWS.**" | none | — |
| 7 | "**Confidence:** ✅ verified primary source · 🟡 well-established/corroborated · 🔁 re-research at the profile's edges. Re-run `deep-research` before high-stakes reliance on 🟡/🔁." | none | re-research trigger |
| 14–32 | "Hosting:        **Railway** (web service + worker service + Postgres + Railway Buckets)" · "Database:       **Railway Postgres**" · "File storage:   **Railway Buckets** (S3-compatible)" · "ORM:            **Drizzle** (Prisma = plan B, Kysely = specialist)" · "Auth:           **Better Auth** (email/password + Google login; **Pipedrive OAuth** = integration module)" · "Frontend:       **Next.js App Router + React + TS strict + Tailwind + shadcn/ui + React Hook Form + Zod**" · "Repo:           **pnpm** monorepo" · "Testing:        **Playwright** E2E + local real tests + dev smoke tests" · "Observability:  structured logs always; **Sentry + PostHog** recommended for production" · "Email:          OPTIONAL module, level-based (0–5)" · "Reporting:      OPTIONAL module, level-based (0–4)" · "Pipedrive:      OPTIONAL integration module" · "Feature flags:  simple DB-based default" · "Environments:   local / dev / prod (staging only for larger/riskier projects)" | none | optional modules explicit |
| 35 | "**Rule:** do NOT build advanced/optional modules by default." | none | — |
| 43 | "| Runtime / pkg | **Node Active LTS (24)** · **pnpm** monorepo | 🟡 |" | **Node Active LTS (24)** | — |
| 44 | "| Language | **TypeScript strict** end-to-end | 🟡 |" | none | — |
| 45 | "| Framework | **Next.js App Router** (default) — or **SPA (Vite+React) + standalone API** variant | 🟡 |" | none | variant by trigger |
| 46 | "| UI | **Tailwind + shadcn/ui + React Hook Form + Zod** | 🟡 | … Named options for the UX layer — **Preline UI** (additive block library) and **Astryx** (alternative, React+StyleX, agent-ready) |" | none | named alternatives |
| 47 | "| DB | **Railway Postgres** | 🟡 |" | none | — |
| 48 | "| ORM | **Drizzle** (default) | 🟡 |" | none | plan B / specialist below |
| 49 | "| Auth | **Better Auth** (email/pw + Google) | 🟡 |" | none | — |
| 51 | "| Jobs/queue/workflow | **DB-jobs + Railway cron → BullMQ+Redis → Inngest/Trigger.dev → Temporal** | 🟡 | Pick by complexity … Default simple; durable engine only when sequences/waits exist. |" | none | tiered |
| 53 | "| Files | **Railway Buckets** (S3-compatible) | 🟡 | … **R2/S3** only for stronger compliance. |" | none | conditional |
| 54 | "| Email | OPTIONAL, level 0–5 | 🟡 | **Resend/Postmark** for transactional; **Gmail/Workspace OAuth** for connected mailbox. |" | none | optional |
| 56 | "| Feature flags | DB-based (`feature_flags`, `user_feature_flags`) | 🟡 | **No LaunchDarkly/Statsig** for custom apps; managed only for larger SaaS. |" | none | explicit exclusion |
| 57 | "| Observability | structured logs + request-id + job/webhook/audit logs; **Sentry + PostHog** (prod) | 🟡 | **OTel** / external log drain (**Better Stack/Axiom/Logtail**) as extension. |" | none | extension tier |
| 58 | "| Testing | **Vitest · MSW · Testcontainers · Playwright** | 🟡 |" | none | — |
| 59 | "| Shared contracts | **`packages/contracts`** — **Zod** schemas + inferred TS types for every API shape | 🟡 |" | none | — |
| 69 | "Front + backend in one app: RSC/SSR, Route Handlers, Server Actions, middleware. Worker still separate (`apps/worker`)." | none | — |
| 73 | "⚠️ Wasted SSR for a login-only tool; other API consumers (**n8n, FHIR, mobile**) would have to go through a Next route layer" | none | — |
| 77 | "`apps/web` = **Vite/React** SPA (panels behind login) · `apps/api` = standalone API · `apps/worker` = async work. Shared types via `packages/contracts`." | none | — |
| 84 | "**Request-API engine** is its own decision card: **Fastify** (schema/Zod validation first-class, fast, great logging — good default for API-first) · **Hono** (ultralight, excellent types, edge-ready) · **Express** (largest ecosystem, manual validation/types)." | none | decision card |
| 86 | "⚠️ Two builds; **CORS + auth-bridge** (SPA↔API cross-origin cookies, CSRF) must be solved explicitly (**BetterAuth** same-site/proxy); **reclaim end-to-end types with `packages/contracts`** (**Zod/TypeBox**) + generated **OpenAPI** client" | none | — |
| 92 | "**Embedded-in-a-platform** surfaces (e.g. a panel inside Pipedrive) are a separate artifact regardless of A/B/C — SPA/vanilla + that platform's SDK. See `sailes-pipedrive`." | none | — |
| 98 | "It's also what **`create-pipedrive-app`** scaffolds." | none | — |
| 101–103 | "Default: **Drizzle** …" · "Use **Prisma** when:  mostly fast CRUD, team wants a high-level ORM, SQL control matters less" · "Use **Kysely** when:  query-heavy, very complex reports, max SQL control without raw SQL everywhere" | none | conditional swaps |
| 106 | "- **Prisma 7** is now Rust-free (smaller bundle, faster queries, Edge-friendly) — a legitimate plan B, not "automatically worse." *(✅ prisma.io)*" | **Prisma 7** | — |
| 107 | "- **Lucia is deprecated** as a library — never start on it. *(✅ github.com/lucia-auth)*" | deprecated | hard prohibition |
| 126 | "- **Vercel** = paid serverless host (dislikes long-lived workers/cron). **Neon** = hosted Postgres with DB branching." | none | — |
| 127 | "- **Railway (DEFAULT)** runs everything in containers: web + worker + Postgres + Buckets — no AWS, one panel." | none | — |
| 128 | "- **Vercel + Neon = optional alternative** only if you later want automatic preview-per-PR + DB branching. Not worth the extra vendors for the stated goal" | none | conditional |
| 136–148 | Deviation table: "multi-tenant-ready" · "**Prisma** instead of Drizzle" · "**Kysely**" · "durable workflow engine (**Inngest/Trigger.dev**), not just cron" · "**BullMQ + Redis**" · "**Cloudflare R2 or AWS S3** instead of Railway Buckets" · "**Vercel + Neon** instead of Railway" · "**Clerk** instead of Better Auth" · "carve out `apps/pipedrive-extension` (iframe+SDK) + own OAuth2 flow" · "**Gmail API + OAuth scopes** (Email Level 3+)" · "add **Preline UI** as a markup/block source" · "**Astryx** (React+StyleX, CLI+MCP) instead of the Tailwind+shadcn layer" · "Breaks the ≤50-user / single-client profile → re-run discovery + a fresh stack research" | none | each is a conditional deviation |
| 154–158 | "- ✅ Prisma 7 / Rust-free GA: https://www.prisma.io/blog/rust-free-prisma-orm-is-ready-for-production" · "- ✅ Lucia deprecation: https://github.com/lucia-auth/lucia/discussions/1714" · "- ✅ Anthropic Claude Code best practices: https://code.claude.com/docs/en/best-practices · Next.js AI-agents guide" · "- 🟡 Preline UI + Astryx …: sources + confidence in `ui-libraries.md` (researched Jul 2026)." · "- 🟡 **Drizzle/Prisma/Kysely, Better Auth, Inngest/Trigger.dev/BullMQ/Temporal, Railway (Buckets/Postgres/cron), shadcn/ui, Zod, RHF, Testcontainers/MSW/Playwright, Sentry/PostHog, Pipedrive OAuth2 + `create-pipedrive-app`**: corroborated across multi-source research (Jun 2026). **Re-confirm before high-stakes use.**" | dated Jun 2026 / Jul 2026 | re-confirm before high-stakes use |

---

## 23. `skills/sailes-bootstrap/ui-libraries.md`

| Line | Verbatim quote | Version constraint | Behaviour if absent |
|---|---|---|---|
| 1 | "# UI Libraries — options for the UX layer (**researched Jul 2026**)" | dated Jul 2026 | — |
| 3–5 | "The baseline UI layer is **Tailwind + shadcn/ui + React Hook Form + Zod** (`stack-baseline.md`) and it stays the default … the whole design skill (`sailes-design`, incl. `premium-tokens-starter.css`) is tuned to it." | none | — |
| 11–14 | "Default:   Tailwind + shadcn/ui            (unchanged)" · "Additive:  + **Preline UI**                    (block/markup library INSIDE the default stack)" · "Alternative: **Astryx** (React + StyleX)       (REPLACES the Tailwind+shadcn layer — own decision card)" | none | — |
| 21–23 | "**What it is** 🟡 — open-source **Tailwind CSS** component library (**htmlstream**): 640+ free components, ~940 free+premium blocks/sections, page templates, and a free **Figma** design system. … Free tier is substantial; **Pro adds premium blocks**." | free vs Pro tier | — |
| 25–27 | "**How it works** 🟡 — components are plain Tailwind markup; interactivity comes from **vanilla-JS plugins driven by `data-hs-*` attributes** … Works anywhere Tailwind does (React, Vue, Next.js, Laravel…)." | none | — |
| 29–33 | "**In the baseline architecture (Next.js App Router)** 🟡 — official guide: add the **`preline` package** and a small client component (`PrelineScript.tsx`) that initializes the plugins in a `useEffect` keyed on `usePathname()` … Docs: https://preline.co/docs/frameworks-nextjs.html" | none | — |
| 40–43 | "**Rule of thumb …:** take **markup/blocks** from Preline; keep **interactive primitives** (dialogs, menus, comboboxes, forms) on **shadcn/Radix + RHF/Zod**. Two interactivity systems in one app (`data-hs-*` plugins vs Radix state) is the main risk" | none | mitigation stated |
| 52–56 | "**What it is** ✅ — open-source design system from **Meta** (`facebook/astryx`, **MIT**, public since **Jun 2026**, currently **Beta**; grown ~8 years inside Meta's monorepo…). React components styled with **StyleX** … 150+ components, 10 ready themes … https://astryx.atmeta.com/" | **MIT · Beta · public since Jun 2026** | — |
| 58–62 | "**Why it matters to an agentic-first framework** ✅ — Astryx ships a **CLI and an MCP server** whose manifest returns a machine-readable JSON contract of every command, component, and prop type. An agent (designer/fe-dev role) can query the real component API instead of hallucinating props" | none | — |
| 64–71 | "**The catch — alternative, not add-on** 🟡 — **StyleX is a different styling paradigm than Tailwind.** Adopting Astryx replaces the Tailwind+shadcn layer for that app … - The shadcn ecosystem (blocks, registry, `premium-tokens-starter.css`, Tailwind-tuned craft rules in `sailes-design`) no longer applies … - **Young as a *public* project (Beta): docs/community/third-party resources are thin next to Tailwind's; pin versions and expect API movement.** - **React-only** — fine for the baseline, rules out non-React surfaces." | "pin versions and expect API movement" | — |
| 84–87 | "A) Tailwind + shadcn/ui (DEFAULT) … B) A + Preline UI (bloki) … C) Astryx (React + StyleX) … Rekomendacja: A (lub A+B gdy dużo standardowych sekcji); C świadomie" | none | decision card |
| 94–100 | "- ✅ Astryx: https://astryx.atmeta.com/ · https://github.com/facebook/astryx · https://astryx.atmeta.com/blog/introducing-astryx (Meta, MIT, Beta, CLI/MCP, themes)" · "- 🟡 Astryx coverage …: MarkTechPost + TechTimes, Jun–Jul 2026 — **counts vary (90+ in repo vs 150+ on docs site); re-verify at adoption.**" · "- 🟡 Preline UI: https://preline.co/ · https://preline.co/docs/frameworks-nextjs.html … — **vendor-stated; verified against docs Jul 2026.**" | dated Jun–Jul 2026 | re-verify at adoption |

---

## Cross-cutting notes (observation, not synthesis)

- Only **two** hard version constraints appear anywhere in the slice: `graphifyy >= 0.9.23` (`graphify-setup.md:7`) and `Node Active LTS (24)` (`agents-md-template.md:53`, `stack-baseline.md:43`). Everything else is either unversioned, an `@latest` npm tag (`chrome-devtools-mcp@latest`, twice), a product-generation label (`Prisma 7`), or a dated-research confidence marker.
- Three tools carry an explicit documented absence path: **graphify** (install hint → `.ai/STATE.md` open failure → `SKIP graphify` line → grep fallback → never block), **chrome-devtools MCP** (`SKIP browser-inspect` line + screenshot fallback; "no skill blocks on the server being present"), and **agent-teams flag** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` (sequential scoped subagents).
- Two tools are named with a *prohibition*: **Lucia** ("deprecated … never start on it", `stack-baseline.md:107`) and **local filesystem / Railway Volumes** as file source of truth ("Never use", `modules-catalog.md:97`).
- `jq` is deliberately *avoided* twice (`hooks-template/guard-protected-paths.sh:5`, `codex-config-template.md:119`) for portability.

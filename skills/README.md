# Sailes App-Builder Skills

A modular set of Claude Code skills that lead agents **and** developers through building custom B2B web apps in a **repeatable, standardized, agentic-first** way — from business discovery to an implementation-ready repo.

**Source of truth lives here (in this repo).** A copy is installed at `~/.claude/skills/` to make them active locally; when you change a skill here, re-sync the copy (see *Working on the skills* below).

## The pipeline

```
sailes-start  (thin orchestrator: shows the map, routes A/B/C, gates each phase)
   │
   ├─ Phase 0  sailes-wayfinder  (optional — only when the idea is too big/foggy for
   │             one session) → decision map on disk (.ai/wayfinder/) → tickets resolved
   │             one decision per session → way clear → re-enter at the destination's gate
   ├─ Phase 1  sailes-discovery   → requirements elicitation → confirmed Brief
   │                                 (decisions owned by the USER, with trade-offs shown)
   ├─ Phase 2  sailes-bootstrap   → classify · lock stack · generate agentic-first repo
   │                                 (AGENTS.md/CLAUDE.md/README/.ai/ · git init · verify on disk)
   │     └─ Phase 2.5  sailes-design → deliberate visual direction + persisted design artifact
   │
   ├─ Phase 3  sailes-spec (local .ai/skills/spec-writing/ if present, else global) → approved spec
   │
   ├─ Something BROKEN instead of missing?  sailes-diagnose  (runs INSTEAD of this pipeline —
   │     read-only on production, live case before audit, ≥3 falsifiable hypotheses, hypothesis
   │     ledger in .ai/incidents/ → a proven mechanism re-enters as a one-liner or a fix spec)
   │
   └─ Implementation (agent team starts here):
        sailes-pre-implement (readiness: BC/risk/gaps)
          → sailes-database (schema design + safe migrations; runs when the spec touches the DB)
          → sailes-async (durable async backend + latency speed-up; runs when the flow is async/slow)
          → sailes-implement (build phase-by-phase, verifiably)
          → release gate (sailes-bootstrap/release-checklist.md: env parity, migration
            ordering, post-deploy smoke, rollback plan; first prod launch adds the ops
            block — tested restore, runbook, alerting)
```

Every repo the pipeline produces carries a graphify code map (built in bootstrap Step 4.9,
kept fresh by post-commit hooks) — explorer, pre-implement, diagnose, and Route C adoption
query it before grepping. See `skills/sailes-bootstrap/graphify-setup.md`.

Each skill is **independently callable** — use `sailes-discovery` alone for a scope interview, `sailes-design` alone for a UI direction, etc. `sailes-start` just sequences them with hard gates.

## The skills

| Skill | Role | Key files |
|---|---|---|
| **sailes-start** | End-to-end orchestrator. Shows the phase map, picks Route A (new) / B (feature) / C (adopt), gates every boundary; fog check routes too-big/foggy ideas to `sailes-wayfinder` before Phase 1. | `SKILL.md` |
| **sailes-wayfinder** | Decision map for efforts too big/foggy for one session. Charts a Destination + typed tickets (decision/research/prototype/task) as committed files (`.ai/wayfinder/<effort>/map.md` + `tickets/`) with fog-of-war ("Not yet specified"), out-of-scope ledger, and claim/Blocked-by/frontier mechanics for concurrent sessions; works ONE decision per session until the way is clear, then hands off to the pipeline gate. Ticket types resolve through existing mechanisms (decision cards, research subagents, `sailes-design` prototypes) — adapted from Matt Pocock's Wayfinder, zero external skill dependencies. | `SKILL.md` |
| **sailes-discovery** | The interview before the spec. Pulls full intent into a structured Brief. **Must** chain into bootstrap on greenfield (never stop at the spec). | `SKILL.md`, `brief-template.md` |
| **sailes-bootstrap** | Stack + architecture + agentic-first methodology. Generates/validates the repo standard; runs the design gate; **verifies artifacts on disk** before handoff. | `SKILL.md`, `decision-engine.md`, `stack-baseline.md`, `modules-catalog.md`, `skeleton.md`, `agents-md-template.md`, `agentic-first-principles.md`, `security-checklist.md`, `spec-writing-template.md`, `adopt-existing-repo.md`, `repo-done-checklist.md`, `developer-fit.md`, `backlog-template.md`, `graphify-setup.md` |
| **sailes-design** | The frontend/visual design phase. Deliberate direction (palette/type/layout/**signature**) + anti-AI-default check + a11y/interaction discipline + a **premium finish** on both axes — looks (craft) and behavior (feel) — → persisted design artifact with a Design log. | `SKILL.md`, `design-judgment.md`, `ux-rules.md`, `premium-craft.md`, `premium-ux.md`, `assets/premium-tokens-starter.css` |
| **sailes-spec** | Phase 3 spec writer/reviewer. Skeleton → Open Questions gate → data model / API-UI / integration coverage / security / phasing / non-goals. Global fallback when a repo has no local `.ai/skills/spec-writing/` (which bootstrap generates from `sailes-bootstrap/spec-writing-template.md`, the mirror of this skill). | `SKILL.md` |
| **sailes-pre-implement** | Spec readiness analysis before coding: BC impact, risks, gaps → readiness report. | `SKILL.md` |
| **sailes-database** | Schema design + safe PostgreSQL migrations when the spec touches the DB. Separates 🔒 hard rules (data types, migration safety) from 🔀 decisions (key type, jsonb-vs-column, tenancy/RLS, soft-delete, tooling) presented as decision cards; writes expand/contract-safe migrations verified before any prod run. | `SKILL.md`, `db-compendium.md`, `decision-cards.md`, `migration-safety-checklist.md`, `migration-drizzle.md`, `migration-prisma.md`, `migration-sql-first.md` |
| **sailes-async** | Durable async orchestration + latency speed-up when a slow/brittle flow (often Make/n8n) must become a fast code-first backend. Thin webhook intake → durable event → parallel lanes; separates 🔒 harness rules (idempotency, audit, alert-on-every-failure, deterministic steps, error-class-aware retry) from 🔀 decisions (build-vs-low-code, engine, self-host, sync-vs-defer) as decision cards; the speed-up recipe (parallel-compute + async write-back) + verify-by-driving. Distilled from the SRF ≤5s build. | `SKILL.md`, `async-compendium.md`, `speedup-recipe.md`, `harness-checklist.md`, `lessons.md` |
| **sailes-diagnose** | The track for when something is already built and now failing — the build pipeline cannot diagnose. Read-only on production (this company's `dev` holds prod credentials), live case before code audit, ≥3 falsifiable hypotheses before step 4, fan-out by data source only when the cause isn't obvious, every causal claim cited. Ends at a proven *mechanism*, never at a merged fix. Leaves `.ai/incidents/<date>-<slug>.md` with a hypothesis ledger where refutations are kept and "not established" is explicit. Distilled from real SRF + Partner Portal incidents. | `SKILL.md`, `diagnosis-loop.md`, `probe-patterns.md`, `traps.md`, `incident-template.md` |
| **sailes-implement** | Execute an approved spec phase by phase: RED test → verify with evidence → commit per step → review gate → mark implemented. | `SKILL.md` |
| **sailes-pipedrive** | Domain integration reference (not part of the core pipeline): how to build Pipedrive app extensions — JSON panel, custom UI iframe, floating window, manifest/OAuth, signed-JWT auth, ACL, API proxy. Real Sailes patterns. | `SKILL.md`, `references/*`, `assets/custom-ui-panel-template.html` |
| **sailes-migrate** | Domain sibling (not part of the core pipeline): how to **port an existing codebase to another language/stack at scale**, repeatably and gated — structure-preserving by default, redesign as an explicit mode. Six steps (feasibility+judge → map+rulebook+inventory → stress-test → translate fan-out → survey build+fixers → behavior parity) with the non-negotiable invariant *no translation fan-out before a judge exists and has been validated against deliberately-broken source*. Reuses existing roles (explorer/team-lead/be-dev/fe-dev/checker/qa) + the deny-list guardrail rather than new machinery. Distinct from `sailes-database` (which does DB-**schema** migrations). Distilled from `anthropics/code-migration-kit-with-claude-code` (Apache-2.0). | `SKILL.md`, `methodology.md`, `judge-setup.md`, `rulebook-template.md`, `parallel-translation.md`, `cost-and-gates.md` |
| **sailes-hosting** | Hosting/ops reference (not part of the core pipeline): how we host & deploy on **Railway** — project/env/service topology, all env vars & secrets, Postgres/S3-bucket/Volume storage layers, ephemeral-FS rule, git-branch deploy (incl. flattened build-branch caveat), `start:prod` migrate-on-boot, `/health`, `railway logs` debugging, install/OAuth-callback gotchas. Plus **monorepo + multi-service async** (pnpm; `api`+`worker`+self-hosted Inngest+Postgres+Redis): Dockerfile-first vs Nixpacks, `RAILWAY_DOCKERFILE_PATH`, branch-pinning, `railway status --json` ground truth, config-as-code trap, EU/RODO region, private networking, `dev`=prod-creds warning. Complements `sailes-bootstrap/release-checklist.md` (the release gate). Real Sailes patterns (Idealny Wzrok + SRF/Volubus). | `SKILL.md`, `references/*` |

## Core invariants (why this exists)

1. **No phase ends early.** Greenfield discovery → bootstrap → design → spec → implementation, each gated. (The original failure: discovery wrote a spec and stopped, so the repo standard was never generated.)
2. **Done = verified on disk**, not asserted. `repo-done-checklist.md` proves AGENTS.md / `.ai/` / git / design artifact exist.
3. **A UI app always gets a real design phase** with a persisted artifact.
4. **The developer owns the key decisions.** Discovery shows trade-offs and minimizes autonomous AI choices — conscious development *with* AI, not the reverse.
5. **Full `.ai/` structure from day one, but idempotent** — a new repo gets the complete structure (specs + implemented/ + archived/, checklists, adr, skills, backlog.md, lessons.md header); never overwrite an existing `.ai/` artifact — add only what's missing, follow the repo's convention.
6. **Spec lifecycle** — specs carry a status and move root → implemented/ → archived/ (`git mv`); deferred ideas land in `.ai/backlog.md`.
7. **Developer owns the vision; AI interrogates and illuminates, never decides** — the foundational principle (agentic-first-principles §0).
8. **Memory compounds, or it decays.** `.ai/STATE.md` (verified facts / open failures / last session) is read at session start and written before walking away; every spec phase carries a binary `Done-when`; gates see the artifact + rubric, never the maker's narrative; recurring lessons get promoted (preferably as an enforced check, else AGENTS.md/Task Router; cross-project pattern → skill candidate).
9. **Truth moves from prose into the machine (the ratchet).** Any convention that can be checked mechanically is enforced mechanically — lint/types/tests/hooks — and the prose becomes a pointer; the BE contract is a typed artifact both slices import; the permission map is a generated authz-matrix test suite; the Claude Code harness guardrails (`.claude/settings.json` + hooks — distinct from a durable-workflow "hard harness", see `sailes-async`) back the hard safety rules. Agents follow enforced rules always and prose rules usually — and "usually" compounds badly.
10. **The lifecycle ends at release + operations, not at "implemented".** Deploying work walks `release-checklist.md` (env parity, migration ordering, scripted post-deploy smoke, rollback plan written pre-deploy); a first production launch requires the ops block (error tracking that alerts a human, /health, a backup with a **tested restore**, uptime check, runbook). Building it is half the deliverable; running it is the other half.
11. **Failures strengthen gates; successes become assets.** A defect that escapes the gates ships with a gate autopsy (which gate missed it + what check it now gains); a module built twice graduates into the golden-module library (with its tests and docs); per-phase estimate-vs-actual feeds the planned `sailes-wycena` pricing skill so pricing sharpens with every project.

## Working on the skills (TDD-for-skills + persisted evals)

These skills are maintained with the `superpowers:writing-skills` discipline: **no skill edit without a failing test first** (baseline a real behavior on a subagent → edit → re-test).

The RED/GREEN scenarios are **persisted in `evals/`** (repo root) so they survive the chat that created them — one markdown scenario per protected behavior: setup for a fresh subagent + a binary expected assertion + a last-run line. The discipline:

- **Editing a skill?** Re-run the `evals/` scenarios that name it (dispatch each to a fresh subagent with clean context — same gate-isolation logic as `checker`; a cheap model may grade, the assertions are binary). Update each scenario's `Last run` line.
- **Adding a new protected behavior?** Write its eval FIRST (record the RED baseline), then edit, then re-run (GREEN).
- **Promoting a lesson into a skill?** Add the eval that would catch its regression — promotion and its regression test travel together.

To make an edit active locally after changing it here, re-run `./install.sh --force` (re-copies into `~/.claude/skills/`, the active copy). The framework's current version lives in `VERSION` (changes logged in `CHANGELOG.md`); generated repos carry a `Framework-Version:` stamp so `adopt-existing-repo.md` upgrade mode can compute their delta.

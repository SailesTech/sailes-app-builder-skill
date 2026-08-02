# Recommended Skeleton — pnpm Monorepo (custom B2B app)

Generate this for a new project. Include `apps/web` + `apps/worker` from day one (worker is mandatory). Create optional `packages/*` only when the module manifest (from `decision-engine.md`) activates them — but the monorepo layout is ready for all of them.

```text
repo/
  apps/
    web/                  # Next.js App Router — UI, server actions, route handlers,
      app/                #   auth/session, user requests, webhook INTAKE, event/job persistence
      src/
      public/
      package.json
    worker/               # MANDATORY — webhook processing, syncs, email send, reports/exports,
      src/                #   file processing, retry, long jobs, workflows, API rate-limit/backoff
      package.json

  packages/
    db/                   # Drizzle: schema/ migrations/ seeds/ src/
                          #   seeds MUST include one fixture user PER RBAC ROLE + a realistic
                          #   minimal dataset — qa can always log in and drive real flows
    contracts/            # shared API contracts: Zod schemas + inferred TS types — the ONE
                          #   place both web and worker import request/response shapes from
                          #   (a frozen BE contract = a commit here, drift = compile error)
    auth/                 # Better Auth setup
    ui/                   # shadcn/ui components
    files/                # Railway Buckets: signed URLs, metadata, access log
    integrations/         # ports & adapters — pipedrive/ google/ webhooks/
    jobs/                 # queue/workflow wiring (tier per project)
    testing/             # shared test utils, Testcontainers helpers
    observability/        # structured logs, request-id, Sentry/PostHog wiring
    email/        (opt)   # only if Email module activated (level-based)
    reporting/    (opt)   # only if Reporting module activated (level-based)

  .ai/                    # generate the FULL structure on a new repo. IDEMPOTENT: if any of these
                          #   already exist in the repo, do NOT overwrite — only add what's missing,
                          #   and follow the repo's existing convention if it differs. (Pattern: Open-Mercato .ai/.)
    specs/                # live specs (draft/approved/in-progress)
      implemented/        #   shipped & deployed specs (git mv here when done)
      archived/           #   abandoned / superseded specs (kept for history)
      ui-spec.md          # design artifact (or design-system/MASTER.md) — from sailes-design; required for UI apps
    checklists/
      security.md  testing.md  deployment.md  webhook.md  email.md  reporting.md
    adr/
      template.md         # architectural decision records
      ADR-001-*.md        # first decision: the stack selection
    skills/
      spec-writing/SKILL.md   # ALWAYS generated (from spec-writing-template.md) — Phase 3 depends on it
      discovery/SKILL.md       # carried over if useful
    backlog.md            # deferred ideas / future features / tech debt (non-goals land here, not lost). See modules-catalog / discovery.
    lessons.md            # institutional memory: Context/Problem/Rule/Applies-to. Created with header; filled on first real lesson.
    STATE.md              # session memory (header-only): Verified facts / General rules / Open failures /
                          #   Lessons learned / Last session. Read at session start; written before walking away.
    runbook.md            # ops one-pager (filled at first deploy): where it's deployed, how to see logs,
                          #   restart, restore from backup, who to call. See repo-done-checklist Operations block.
    screens/              # latest ACCEPTED screenshot per key screen — qa's vision-verify baseline (created when first used)

  design-system/          # if sailes-design used the Master+Overrides pattern instead of .ai/specs/ui-spec.md
    MASTER.md             #   global source of truth: palette, type, spacing, components
    pages/                #   per-page overrides (only deviations from MASTER)

  .husky/
    pre-commit            # lint + typecheck (+ format/i18n) — deterministic gate before commit
  .github/
    workflows/ci.yml      # lint → typecheck → unit → integration → e2e → security scan
    copilot-instructions.md  # → one-line pointer to AGENTS.md (Copilot). One source, three harnesses.

  .claude/                # Claude Code harness guardrails — structural discipline, not agent goodwill
    settings.json         #   ONE JSON file with two keys (copy from sailes-bootstrap/settings-template.json):
                          #   "permissions" — ALLOW the verify commands (test/lint/typecheck/build/dev)
                          #     AND git add/commit/log (every writing role is mandated to commit in
                          #     its own worktree; a mandate the permission layer prompts on fails);
                          #     DENY the protected surface (PRODUCTION/staging env files, key
                          #     material, prod migrate/deploy commands, force-push) — the mechanical
                          #     backstop for "workers never push / never commit to a shared branch"
                          #     and the Hard Safety Rules. The LOCAL .env is NOT denied: env is
                          #     tiered by risk, not by filename (see guard-protected-paths.sh)
                          #   "hooks" — SessionStart injects .ai/STATE.md + Task Router pointer into
                          #     context ("read at session start" stops being a memory test);
                          #     PreToolUse blocks edits to protected paths (applied migrations,
                          #     .ai/specs/implemented/, lockfiles unless the task says so)
                          #   (hooks reference scripts under .claude/hooks/ below)
    hooks/                #   hook scripts invoked by settings.json — COPY them from this skill's
                          #   hooks-template/ (session-start.sh, guard-protected-paths.sh) and
                          #   chmod +x; do not retype them. Harness-optional: in a harness without
                          #   hooks the AGENTS.md prose rules are the fallback (the Guardrails note
                          #   there says which rules lost their backstop)
                          #   SHARED with Codex: the same scripts are referenced by .codex/config.toml
  .codex/                 # Codex CLI harness guardrails — the twin of .claude/ (copy from
    config.toml           #   sailes-bootstrap/codex-config-template.md): sandbox_mode + approval_policy
                          #   (the "permissions" model) + [hooks] SessionStart/PreToolUse that call the
                          #   SAME .claude/hooks/*.sh (identical stdin-JSON + exit-2-to-block contract).
                          #   Generate by default so a Sailes app runs guarded under Codex too, not just
                          #   readable. Caveat: some Codex versions fire PreToolUse only for Bash.

  AGENTS.md               # concise; see agents-md-template.md (incl. Git Workflow + PR Workflow)
  CLAUDE.md               # → @AGENTS.md   (Claude Code entry point)
  STATUS.md               # client-readable progress derived from live specs (header-only to start;
                          #   updated at each phase gate — never contains effort/pricing data)
  README.md
  package.json
  pnpm-workspace.yaml
  turbo.json              # optional, when builds multiply
  docker-compose.yml      # optional, local Postgres
```

**Single-repo vs monorepo:** default to the monorepo above even for a small first project — it's ready for worker, integrations, email, reports, files, tests. Start single-repo only if you're certain you won't split web/worker/extensions; even then keep the full agentic-first skeleton (`AGENTS.md`, `CLAUDE.md`, `.ai/`, reusable CI workflows).

## Key implementation rules (carry into the spec + AGENTS.md)

**The app loads its own env — the dev script does it, never the caller's command.** Every runnable
app's `dev` script resolves the repo-root `.env` itself:

```json
"dev": "node --env-file-if-exists=../../.env --import tsx --watch src/index.ts"
```

Two separate reasons, and the second is the one that bites. **For the human:** `pnpm dev` works on a
fresh clone. Measured 2026-08-01 on a client repo — it did not, and nobody had reported it, because
everyone already had the variables exported in their shell; the defect was invisible to exactly the
people who could have found it. **For agents:** `qa`'s whole mandate is to drive the running system,
and a role that has to compose its own `--env-file=` or `set -a && . ./.env` is one guard rule away
from being unable to start the app at all — which is what happened, for two days, for every task.
When the app loads its own env, the boot path is one command with no env handling in it, so no rule
about env can break it. Use `--env-file-if-exists`, not `--env-file`: a missing file must not take
down CI or production, where the platform supplies the variables (`sailes-hosting`).

**Parallel-safe layout rule (applies to everything under `apps/`):** a feature's route,
components, server functions, schemas, and tests **colocate under one feature folder** — one
task touches one subtree. No hand-maintained barrel files and no central hand-edited
route/registry/menu file (file-based routing + generated aggregations instead) — those are the
merge-conflict magnets that make concurrent agents collide. (`agentic-first-principles.md` §E.)

```text
1.  Do not build advanced modules by default.
2.  Always classify project scope first (decision-engine.md).
3.  Always include apps/worker.
4.  Always process webhooks asynchronously (intake → worker).
5.  Always validate input (Zod).
6.  Always protect files with signed URLs + access control before URL.
7.  Always store file metadata in Postgres.
8.  Always keep secrets in environment variables.
9.  Always avoid sensitive data in logs.
10. Always write or identify a RED test before implementation.
11. Always run local tests before the final answer.
12. Always run Playwright E2E for user-critical flows.
13. Always document architectural changes in an ADR.
14. Always require the security checklist for production apps.
15. Never treat Google login as Gmail access.
16. Enforce mechanically what can be checked mechanically (lint/types/tests/hooks);
    AGENTS.md prose is for judgment only (the ratchet, agentic-first-principles §B.3).
17. Seed one fixture user per RBAC role; the app must boot with seeded data in one command.
```

- **Ops runbook:** `.ai/runbook.md` from `runbook-template.md` (header-only at bootstrap, filled at
  the first deploy). Five places in the framework require this file; until 2026-07-31 none generated
  it, so the Operations block asked for a document that never existed. It carries the deploy/logs/
  restart/rollback/restore facts **and** the host-traps section — the IPv6-vs-Docker-Desktop trap
  alone costs hours and presents as an application bug.
- **Worker-worktree ignore:** `.gitignore` gets `.claude/worktrees/`. Every writing agent is spawned
  with `isolation: worktree` (`agent-team-structure.md`, Isolation) and its checkout lands there.
  `.claude/settings.json` **is** committed, so without this line those checkouts show up as untracked
  debris inside a tracked directory. The branch in the shared `.git` is the artifact; the directory
  never is.
- **Worker-status ignore:** `.gitignore` gets `.claude/status/`. Every writing worker claims
  `.claude/status/<worker-id>.md` — named with the id the harness assigned it, never one it picks
  itself — on start and closes it by APPENDING (never rewriting the claim block) on finish
  (`agent-team-structure.md`, Isolation → "The worker status file"); it is live state meant to
  survive a process crash on disk, not a history meant to be versioned. The lead folds each file into
  the run log and removes it at acceptance — the run log is the artifact that gets committed, the
  status file never is.
- **Code map ignores:** `.gitignore` gets `graphify-out/cost.json` + `graphify-out/cache/`;
  `.claudeignore` gets `graphify-out/` + `graph.json` (prompt-cache guard). The map itself
  (`graphify-out/graph.json`, `GRAPH_REPORT.md`) IS committed — it is the team's shared map.

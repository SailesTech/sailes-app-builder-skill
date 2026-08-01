# AGENTS.md Skeleton — for an Empty Repo

Generate this at repo root when bootstrapping a new agentic-first project (Case B). Keep it **concise** — only what the agent can't infer from code (Anthropic guidance: bloated memory files get ignored). **Size budget: target ≤ ~150 lines for the root file.** The root is a map, not an encyclopedia — module detail lives in per-module colocated docs (`src/modules/x/AGENTS.md` or README) that the Task Router points to. A rule that promotes into this file must **displace or merge, not only append** — the budget forces curation; and a rule the toolchain enforces is replaced by a one-line pointer to the enforcement, not a paragraph (the ratchet, `agentic-first-principles.md` §B.3). Adapt to the chosen stack; delete rows that don't apply. Pair it with `CLAUDE.md` containing only `@AGENTS.md`.

Also scaffold (see `skeleton.md` for the full monorepo layout):
- `CLAUDE.md` → single line: `@AGENTS.md`
- pnpm monorepo: `apps/web` + `apps/worker` (worker mandatory) + `packages/{db,auth,ui,files,integrations,jobs,testing,observability}` (email/reporting optional)
- `.ai/specs/` (+ `implemented/` + `archived/`; short `AGENTS.md`: naming `{YYYY-MM-DD}-{kebab-title}.md`, Status field, folder lifecycle)
- `.ai/skills/` — carry over `discovery` + `spec-writing` patterns
- `.ai/checklists/` — security.md, testing.md, deployment.md, webhook.md, email.md, reporting.md
- `.ai/adr/template.md` — architectural decision records
- `.ai/backlog.md` — deferred ideas / later phases / tech debt (header-only to start)
- `.ai/lessons.md` — institutional memory (header-only; filled on first correction)
- `.ai/STATE.md` — session memory (header-only, five sections: Verified facts / General rules / Open failures / Lessons learned / Last session)
- `.ai/runs/` — per-session run log for long/resumable work (created when first used)
- `.ai/screens/` — latest accepted screenshot per key screen, qa's vision-verify baseline (created when first used)
- `STATUS.md` (root) — client-readable progress, derived from live specs (header-only to start; updated at each phase gate — see `sailes-implement`). No effort/pricing data ever.
- `.claude/settings.json` + hooks — the harness guardrails (permissions allowlist, SessionStart memory injection, PreToolUse protected paths) — see `skeleton.md`
- `.codex/config.toml` — the **Codex twin** of the guardrails (sandbox/approval + `[hooks]` reusing the SAME `.claude/hooks/*.sh` scripts) — see `codex-config-template.md`. Generate it whenever the repo should run under Codex CLI too (default yes).
- `.github/copilot-instructions.md` — one-line pointer to `AGENTS.md` for Copilot. One source of truth, three harnesses.
- (idempotent: never overwrite an existing `.ai/` artifact; add only what's missing)

---

```markdown
# Agents Guidelines

> Single source of truth for how agents work in this repo. CLAUDE.md imports this via @AGENTS.md.
> Framework-Version: <x.y.z — from the sailes framework VERSION file at bootstrap time; used by adopt-existing-repo upgrade mode>

## The spine
**SPEC → HUMAN → VERIFIED → GATED** — the four hard rules, in the words every other instrument uses.
- **SPEC** — no feature code before an approved spec exists on disk. A one-line fix is exempt; a feature is not.
- **HUMAN** — the human owns every key decision. Recommend with trade-offs, then let them choose.
- **VERIFIED** — done means verified, not asserted. Drive the real flow; a passing typecheck is not evidence.
- **GATED** — phases are gated. Do not cross a gate because the next phase looks obvious.

<!-- This line is repeated verbatim by the session hooks. Reword it here and the reminders stop
     reinforcing this file and start competing with it — change both or neither. -->

## Answer shape
Length is not thoroughness — complete and unreadable delivered nothing. Rule 3 is `HUMAN` as a format.
1. **Only what changes the reader's next action.** Finding or action first; no preamble, no restated question. If a detail changes nothing they'd do, cut it.
2. **Offer the depth, do not pour it.** Full table/log/file list is named and offered, never pasted.
3. **Every decision that is the human's goes through the choice window.** *Any* fork with more than one defensible answer: 2–4 named options, each with cost and benefit, recommendation first and labeled. Never pick and proceed; a fork described in prose is a decision you took. **An option citing an existing mechanism is checked against that mechanism BEFORE the window opens** — "I have no grounds" is a legal recommendation line; a fabricated premise is not, because it reads on the page exactly like a grounded one and the reader has no way to discount it.
- **Forks batch and never interrupt.** Rule 3 is wide on purpose, so grouping keeps it usable, not filtering: carry on with what does not depend on the fork, surface the set at the next stop in one window. A class the human pre-delegates stops being a fork. Never narrow rule 3 by judging a fork too small to raise.
- **Task beats rule; shape stays.** "Explain this" gets the full explanation (no preamble, no closer, skimmable headers); a destructive action gets its confirmation; a question whose answer IS the options gets them. **Keep hedges that carry real uncertainty** — cutting one manufactures confidence.
- **Files are a separate rule from answers.** Match a written deliverable (spec, report, doc, commit message) to what the task needs; cut filler sections, redundant summaries, boilerplate. Not a cap — omitting something load-bearing to hit a length is worse than running long.
- **Deliver the scope you were asked for.** Make routine judgment calls yourself; check in only when readings differ materially. Think the ask is wrong? Say so in a sentence and proceed as asked — never quietly narrow, widen, or transform it. Finish the whole task; report done only when done, and name what is missing if it is not. `checker` catches scope creep downstream — it is the backstop, not the only defence.
- **Correct only what changes the reader's decisions.** Combine corrections, then continue. No apologies, no self-criticism, no tallying past errors. A follow-up question is not evidence you were wrong — answer it rather than re-auditing correct work. Does not apply inside thinking.

## Enforcement (the ratchet)
- Rules the toolchain enforces (lint/types/tests/hooks) are NOT restated here — this file lists only judgment rules and pointers. If you can express a rule as a check, add the check and link it here instead of writing prose (`agentic-first-principles.md` §B.3).
- Enforced in this repo: no `any` (ESLint error) · design tokens only (lint on raw literals) · module import direction (dependency rule) · Zod at boundaries (convention test). <!-- keep this list in sync with the actual config -->
- Harness guardrails — two twins, shared hook scripts: `.claude/settings.json` (Claude Code) and `.codex/config.toml` (Codex CLI) both run `.claude/hooks/*.sh` to inject STATE.md at session start and block the protected surface (production/staging env files and key material — **not** the local `.env`, which is tiered by risk — applied migrations, prod deploy/migrate, force-push). Codex caveat: on some versions PreToolUse fires only for `Bash`, so shell-driven writes are blocked but `apply_patch` edits fall back to sandbox/approval + the prose rules. In any harness without hooks, the prose Hard Safety Rules below are the fallback — know which rules lost their backstop.

## Before Writing Code
1. Run discovery (needs/scope) → then bootstrap (methodology + stack) → then spec.
2. Check `.ai/specs/` for an existing spec on the area you're touching.
3. Enter plan mode for non-trivial tasks (3+ steps or an architectural decision).
4. Spec-first for non-trivial work: `.ai/specs/{YYYY-MM-DD}-{kebab-title}.md`. Implement integration tests in the same change.

## Stack
- Runtime/pkg: Node Active LTS (24) + pnpm monorepo (apps/web + apps/worker)
- Language: TypeScript strict, end-to-end
- UI: React + Tailwind CSS + shadcn/ui + React Hook Form + Zod
- Framework: Next.js (App Router) — RSC, Server Actions, Route Handlers (auth, webhook intake)
- DB: Railway Postgres + Drizzle (default; Prisma = plan B, Kysely = specialist). Migrations committed + reviewed; seeds for local/dev.
- Auth: Better Auth (email/pw + Google login). Google login = login only, NOT Gmail access.
- Worker: apps/worker MANDATORY — webhook processing, syncs, email send, reports/exports, file processing, retry, long jobs, workflows.
- Jobs/queue: pick tier per project — DB-jobs+Railway cron → BullMQ+Redis → Inngest/Trigger.dev (sequences/waits) → Temporal. Durable orchestration + latency speed-up (fan-out/join, retry-from-step, idempotency/audit harness, sync-vs-defer): the `sailes-async` skill.
- Webhooks: intake only (verify signature → validate → persist to webhook_events → idempotency key → 202); worker does the business work.
- Storage: Railway Buckets (S3-compatible). Files private, signed URLs, metadata in Postgres, access log. R2/S3 for stronger compliance.
- Observability: structured logs + request-id + job/webhook/audit logs; Sentry + PostHog for production.
- Hosting: Railway (web + worker + Postgres + Buckets), envs local/dev/prod.
<!-- See the project-bootstrap skill's stack-baseline.md + modules-catalog.md for rationale, optional-module levels, and when to deviate. -->

## Tenancy
- Default: single-tenant (one client). Do NOT force organizationId everywhere.
- Multi-tenant (multiple firms): organization model + organizationId on every client-data table + isolation tests + org-scoped permissions.

## Architecture (Critical Rules)
- Don't build advanced/optional modules by default — activate per the project's module manifest.
- apps/worker always present; webhooks ALWAYS async intake → worker.
- Integrations are adapters (ports & adapters): each external system = its own adapter; required tables: integration_accounts, external_object_links, webhook_events, sync_runs, idempotency_keys.
- Modular boundaries: link across modules by FK ID + fetch; no cross-module direct DB/ORM access.

## Data & Security  (see .ai/checklists/security.md — mandatory for production)
- Auth required by default; permission checks (RBAC) on every data-mutating action.
- Validate all inputs with Zod at every boundary; derive types via z.infer. No `any`.
- Parameterized queries only (use the ORM; never string-build SQL).
- Signed webhook/API secrets + idempotency keys on integration intake.
- Files: private by default, signed URLs, access control BEFORE URL, file access log.
- Audit log for critical actions. Secrets in env only; never logged, never committed.
- Sensitive data → encryption-at-rest where required; multi-tenant → filter organizationId in every scoped query incl. EXISTS/subqueries.

## Verification (every task)
- RED test first: write or identify a failing test before implementation.
- End every task with a check you run: lint, typecheck, unit/integration, Playwright E2E for user-critical flows. Show the output — never fake a pass.
- **Behavior before diff:** verify by driving the real running system (e2e flow / curl the live endpoint / click the UI / generate the real artifact) and observing behavior — THEN read code. Green build/lint ≠ proof.
- Self-contained tests: create own fixtures, clean up, no dependence on seed data.
- Adversarial review: a fresh-context reviewer checks the diff vs the plan before "done".

## Agent Teams (non-trivial work)
- 3+ steps / BE+FE / API contract / architecture → run as a team, not solo. Roles ship with the sailes-app-builder plugin: `team-lead` (plan/integrate, never bulk-codes), `explorer` (read-only recon), `researcher` (synthesises recon into findings with provenance; decides nothing), `designer` (UX spec, and measures it), `be-dev`/`fe-dev`, `tester` (authors the suite; cases derived before reading the code), `checker` (independent review), `qa` (real-flow e2e proof), `docs-author` (archify diagram set from repo evidence; runs at bootstrap and spec closure, outside the phase order).
- Order: explorer → designer → BE contract → fe-dev → tester → checker → qa. One task per worker; workers escalate scope to lead. **Every worker that WRITES gets `isolation: worktree` — no exception; the test is "does it write", not "is it listed".** Read-only roles don't; `qa` doesn't either — it needs the live stack and takes **environment exclusivity** instead (worktrees isolate files, never the database/ports/containers, which are shared by the whole machine). Workers never commit to a **shared** branch and never push; in their own worktree they commit, and should — a commit is the declaration that the work is finished, and the lead cherry-picks it from the shared `.git`. No commit = not finished. **Commit often, `WIP:` included:** a `WIP:` subject is a checkpoint that survives a dead process, any other subject is the declaration of completion — the split matters, because without it "commit often" destroys the rule it sits next to. And the lead may **observe** a silent worker without integrating from it: ask it, read `git log`, read `git status --porcelain` / `git diff --stat` / modification times — metadata, never content, never a cherry-pick of uncommitted work.
- **Lifecycle:** the lead spawns one worker per ready task and **releases it once its result is integrated** — no idle agents kept alive. On **CHANGES-REQUIRED**, re-spawn a fresh worker with clean scope, don't reuse a stale one. Record per task in the run log who was spawned / what they returned / the gate verdict / whether released — so after a context reset the lead rebuilds *which agents are still active* and releases orphans. Exactly one lead = the human's single point of contact.
- Enable teammates: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `~/.claude/settings.json`. **Without it**, the same roles/order/gates run as sequential scoped subagents (the model doesn't depend on the flag) — read-only roles (`explorer`/`checker`/`qa`) map to read-only subagents; same-file tasks run sequentially. Solo is fine when the diff fits one sentence.
- The rules above are self-contained for day-to-day work. For the full rationale (per-role "never" list, who-is-lead detail, fallback notes), load the global `sailes-bootstrap` skill — its `agent-team-structure.md` is the canon. (It is a globally-installed skill, not a file in this repo.)

## Conventions
- DB tables/columns: snake_case, tables plural. JS/TS identifiers: camelCase. UUID PKs.
- Common columns: id, created_at, updated_at, deleted_at (+ organization_id if multi-tenant).
- No hardcoded user-facing strings. No inline comments — self-documenting code. **A deferral recorded only in a code comment does not exist:** it goes to `.ai/backlog.md` with the blocking dependency named as its trigger ("when `packages/files` exists"), so delivering that dependency fires the return. A comment is read only by someone already in that file — the last person who needs the reminder.

## Key Commands
- `pnpm install` · `pnpm dev` · `pnpm build`
- `pnpm test` (unit, fast inner loop) · `pnpm test:e2e` (Playwright)
- `pnpm lint` · `pnpm typecheck`
- `pnpm db:generate` / `db:migrate` / `db:push` (Drizzle; push for prototyping)
- `graphify update .` — refresh the code map after edits (post-commit hook does this automatically; run manually before querying mid-task)

## Git Workflow
- Branch per feature off up-to-date default: `git switch -c feat/<kebab-desc>` (prefixes: feat/ fix/ chore/ refactor/ docs/ spec/). One feature = one branch = one PR.
- Small, focused, present-tense commits (conventional: feat:/fix:/chore:); each leaves the app working. Stage what you touched — no blind `git add -A`. Reference the spec/issue.
- Merge via PR into default; rebase your branch on latest default first, resolve conflicts locally, re-run tests; delete branch after merge.
- Rollback by blast radius: `git restore` (uncommitted) → `git reset --soft HEAD~1` (keep changes) → `git revert <sha>` (shared/pushed). `git stash` to park WIP. Parallel work → separate branch or `git worktree`.

## PR Workflow
- Ready PR carries `review`. Pipeline labels mutually exclusive (review / changes-requested / qa / merge-queue); category labels additive (bug/feature/refactor/security/docs).
- Adversarial review (fresh context) before marking ready. Keep the taxonomy minimal for a small app; grow only when throughput needs it.

## Lessons
- After a correction or a recurring bug, append to `.ai/lessons.md`: Context / Problem / Rule / Applies-to. This is the repo's durable memory — read it before non-trivial work.
- **Promotion rule (memory must compound):** a lesson that recurs or generalizes gets promoted upward — **preferably as an enforced check** (lint rule / convention test / hook — see Enforcement above), else a line in this AGENTS.md / Task Router; cross-project pattern → candidate for a global skill. Review `.ai/lessons.md` for promotion candidates when closing a spec. A lesson that is only ever appended, never promoted, is noise.
- **Escaped-defect autopsy — the gate autopsy (gates must compound):** an escaped defect found after `checker`+`qa` passed (client, prod, later phase) is a gate failure. The fix ships with an `Escaped-defect:` entry in `.ai/lessons.md`: which gate should have caught it + what check that gate now gains (checklist line / authz-matrix row / lint rule — prefer enforcement). Autopsy entries are priority promotion candidates.

## Client Status (STATUS.md)
- Root `STATUS.md` is the client-readable progress view, derived from live specs: per feature — phases done/total, the plain-language Done-when result, accepted screenshot for UI phases. Updated at every phase gate (`sailes-implement`). Never contains effort, hours, or pricing data.

## Session Memory (`.ai/STATE.md`)
- Header line `Last-commit: <short-sha>`, then five sections: **Verified facts** (checked, each with the command/evidence that proved it) · **General rules** (distilled from this project) · **Open failures** (unresolved problems + best diagnosis so far) · **Lessons learned** (pointers into `.ai/lessons.md`) · **Last session** (where work stopped + the next step). The SessionStart hook compares that sha against `git HEAD` and warns when the snapshot has drifted behind the history — it never blocks, and it stays silent when the field is absent.
- **Read at session start** — before any non-trivial work, read STATE.md + lessons.md; otherwise you re-derive known state and repeat known dead ends.
- **Write before walking away** — every working session ends by updating STATE.md: promote what you verified into Verified facts, record what's still broken in Open failures, update Last session. A session that ends without this write loses its memory. This applies on interruption too, not just on completion. **Update the snapshot together with the history, or update neither:** a file whose top and bottom disagree is worse than a stale one, because the reader cannot tell which half to believe — and the session hook makes everyone read the top first.
- **Facts vs hypotheses:** an entry enters Verified facts only with evidence attached; everything unproven stays in Open failures. Never let a hypothesis masquerade as a fact.

## Hard Safety Rules
- NEVER commit/push without explicit human instruction.
- NEVER `git reset --hard` / `git push --force` / force-push or rebase a shared branch without explicit confirmation.
- NEVER commit directly to main/default for feature work; NEVER commit secrets or build artifacts. **Env is tiered by RISK, not by filename:** `.env.example` (keys, committed) and the local `.env` (local values, gitignored) are yours to read and write; `.env.production*`, `.env.staging*` and key material are closed, and by the hosting doctrine belong in the platform's env rather than a repo file. A production value found in the local `.env` is a human's task — report `ENV-DEFECT` **and** file a `.ai/backlog.md` row under "Human-only": the verdict blocks now, the row survives the session. This line read "`.env*` is closed to agents entirely" until 2026-08-01, and that prohibition made the `qa` gate structurally unrunnable for two days, for every task — a blanket ban with no path is how a repo goes weeks unable to boot with no agent able to say so.
- **NEVER kill a process you have not identified by its command line; never kill an editor process or an MCP server.** A process count is not a diagnosis. Ask first: *does this process have a parent I recognise, and did it start when I asked for something?* Measured 2026-08-01: seventeen `node` processes looked like orphaned debris and thirteen were the human's language servers and MCP servers, while the actual cause of the hang was a concurrent install contending for the same package store.
- NEVER auto-deploy to production; NEVER run production migrations without approval.
- NEVER change auth/security without the security checklist.
- NEVER log sensitive data; NEVER treat Google login as Gmail access.
- NEVER delete tests or bypass typecheck. Don't change architecture without an ADR.
- NEVER edit a migration that may already be applied — add a new one.
- After two failed attempts with the same approach: stop, describe what you learned, reformulate.

## Task Router
<!-- Grow this as the codebase grows: map task type → the guide/module/skill that covers it.
     A task often maps to MULTIPLE rows — read ALL matching guides before starting; they hold the
     imports, patterns, and constraints you need. Add a per-package AGENTS.md and route to it here. -->
| Task | Guide |
|------|-------|
| Codebase question / recon ("where is X", "what connects A to B") | `graphify query "<question>"` · `graphify path A B` · `graphify explain X` (map at graphify-out/; if graph.json is older than the last commit, run `graphify update .` first — fall back to grep when the map is stale or missing) |
| New module / CRUD | (reference module path) |
| Webhook integration | packages/integrations + .ai/checklists/webhook.md |
| Background job / workflow | apps/worker + packages/jobs |
| Auth / RBAC | packages/auth |
| Files | packages/files |
| Email / Reporting (optional) | packages/email · packages/reporting + checklists |
| Write / update a spec | .ai/skills/spec-writing (or global sailes-spec) |
| Analyze a spec before coding (BC/risk/readiness) | sailes-pre-implement |
| Implement a spec / its phases | sailes-implement |
| Review a change (architecture/security/quality) | .ai/skills/code-review (or /code-review) |
```

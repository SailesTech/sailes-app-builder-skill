# Agentic-First Principles — Working Discipline + Guardrails

The rules an AI agent (and the codebase) should follow so agents can develop **safely, flexibly, and verifiably**. Researched Jun 2026; the Anthropic items are ✅ verified from the official best-practices page. Apply these in any repo; in a repo that already has its own `AGENTS.md`, that file wins where it's stricter.

---

## 0. The developer owns the vision; the AI interrogates and illuminates — it does not decide (FOUNDATIONAL)

This is the load-bearing principle the rest serve. Read it first.

- **The developer is the decision-maker and the owner of the infrastructure / architecture vision.** Every **key** decision (stack, framework, ORM, auth, hosting, tenancy, integration depth, data-model shape, roles, deploy topology) and every **important** one (hard-to-reverse, or shaping cost/scope) is **theirs to make** — not the agent's.
- **The AI's job is to interrogate and illuminate, never to quietly decide.** Specifically the agent must:
  1. **Extract the maximum** from the developer — ask the questions they didn't think to answer; probe business context, existing infrastructure, and constraints deeply; never build on a one-line brief.
  2. **Challenge / question everything** — surface that a decision exists, push back on assumptions (the developer's and its own), and name the trade-offs even when not asked. Agreeable silence is a failure mode.
  3. **Describe every decision it makes, with reasons and trade-offs** — present real options with honest ✅ pros / ⚠️ cons and a recommendation *with a reason*, then let the developer choose. Recommend; don't impose.
  4. **Never disguise a decision as an "assumption."** A choice picked silently from a baseline and buried in a summary is the #1 failure mode — the developer "rubber-stamps" what they never consciously chose.
- **Preference vs. requirement:** a developer's stated preference is a first-class input (record it). When it collides with a hard requirement, the requirement wins and the deviation is captured in an **ADR** — but the baseline never silently overrides a justified preference either.
- **Record decisions** in the brief's **Decisions Ledger**; architectural ones get an **ADR**. The goal is conscious development *by the developer, with AI* — not AI building while the human watches.

*(This is enforced operationally by `sailes-discovery` (decision cards + Decisions Ledger), `sailes-bootstrap` Step 1/4 (stack-shaping axes + developer-fit), and `sailes-spec` (Open Questions gate). This section is the principle those skills implement — so an agent that enters via bootstrap directly still meets it here.)*

---

## A. Verifiable development (the core loop) ✅

*Anthropic's #1 principle: give the agent a check it can run.*

- **Every task ends with a check the agent runs** — test suite, build exit code, linter, typecheck, or a screenshot diff. "Looks done" is the failure mode.
- **Show evidence, don't assert.** Paste the command + its output, the passing test, the screenshot. Reviewing evidence is faster than re-running it.
- **Behavior before diff.** To verify a fix/feature, FIRST drive the real running system — run the e2e flow, `curl` the live endpoint, click through the UI, generate the actual artifact (PDF/screen) — and observe the *real behavior*. THEN read code. A green build/lint is not proof; don't trust the diff, trust the running system. (This is `qa`'s deliverable; it never fakes a pass.)
- **Explore → plan → code → commit.** Separate research/planning from implementation to avoid solving the wrong problem. Use plan mode for multi-file or unfamiliar work; skip it only when the diff fits in one sentence.
- **Tight feedback loops.** Correct early; after two failed corrections, reset context and re-prompt with what you learned rather than piling on.
- **Self-contained, deterministic tests.** Tests create their own fixtures (prefer API fixtures), clean up after themselves, and don't depend on seed/demo data. An agent must be able to run them autonomously and must never fake a pass.

**Workflow orchestration (how to run a task):**
- **Spec-first for non-trivial work** (3+ steps or an architectural decision): check `.ai/specs/` (live) before coding; write/extend a spec. Skip for small fixes.
- **Use subagents liberally** to keep the main context clean — offload research and parallel analysis; one task per subagent.
- **Self-improvement after corrections** — append a lesson to `.ai/lessons.md` (or the relevant AGENTS.md) so the same mistake can't recur.
- **Staff-engineer bar** — before calling it done, ask "would a staff engineer approve this?" For non-trivial changes, pause once: "is there a more elegant way?"
- **Autonomous bug-fixing** — given a bug + logs/errors, just fix the root cause; no hand-holding, no temporary patches.

*Source: https://code.claude.com/docs/en/best-practices*

## B. Security-by-default guardrails

Catch agent mistakes before production. These are the recurring guardrails across secure agentic codebases:

- **Validate all inputs** with a schema library (zod) at the boundary; derive types from the schema (`z.infer`) — no `any`.
- **Type-safety end-to-end** — typed API contracts, typed DB layer; the compiler is a guardrail.
- **Parameterized queries only** — never string-build SQL (the ORM handles this; don't bypass it).
- **Tenant/org isolation on every scoped query** — filter by `organization_id` (and `tenant_id`), including inside `EXISTS`/subqueries and helpers. Cross-tenant leakage is the highest-severity recurring bug.
- **Encryption-at-rest for PII/GDPR** — declare which columns are sensitive; route reads through the decrypting accessor. No hand-rolled crypto, no "encrypt later".
- **Feature-based RBAC** — guard with immutable feature IDs (`<module>.<action>`), not mutable role names.
- **Secrets never in code** — `.env`/vault, never logged, never committed; deny the agent access to credential files.
- **Human-in-the-loop for irreversible/outward-facing actions** — deploys, prod data changes, destructive ops need approval; treat agent output as a draft pending review.
- **Tenant isolation, auditability, safe webhooks** are the three that matter most for sales apps. Use Postgres **Row-Level Security selectively** — where the client or storage gets more direct DB access; if most access goes through the server, app-layer authorization is simpler. Don't make RLS a universal religion.

### Hard gates — enforced by tooling, not by prompts (B.2)

CLAUDE.md/AGENTS.md rules are *advisory*. For guarantees, enforce in config + CI:

- **Agent config:** plan/standard mode in sensitive repos; `auto` mode only with explicit **deny rules** on deploy/migrate/terraform/secrets tooling. Use **PreToolUse hooks** to block edits to critical files (deploy workflows, secrets, migrations run without review, billing code) — hooks are deterministic, rules in prose are not.
- **Dev Containers** as the base working environment for humans + agents → repeatable, isolated runtime across local/CI/Codespaces.
- **GitHub gates:** branch protection, CODEOWNERS, CodeQL/code scanning, secret scanning + push protection, Dependabot, and **OIDC to cloud instead of long-lived secrets**. These are hard gates independent of prompt quality or model behavior.
- **CI pipeline = small hard gates:** lint → typecheck → unit → integration → e2e (on preview) → security scan. Reusable workflows shared across repos/packages.

### The ratchet — enforce, don't instruct (B.3)

An agent follows *enforced* rules ~always and *prose* rules ~usually — and "usually" compounds badly across hundreds of agent-hours. So:

- **Any convention that can be checked mechanically MUST be enforced mechanically** — a lint rule, a type constraint, a convention test, or a hook — not only stated in AGENTS.md.
- **Once enforced, the AGENTS.md prose line is replaced by a one-line pointer to the enforcement.** Prose is reserved for judgment calls machines can't make. This is also what keeps the memory file small (§D).
- Immediately ratchetable rules from the baseline: no new `any` (`@typescript-eslint/no-explicit-any: error`), design tokens only (`no-restricted-syntax` on raw color/spacing literals in components), import direction between modules (`import/no-restricted-paths` or dependency-cruiser), Zod at the boundary (a convention test that fails on an unvalidated entry point).
- **The ratchet applies to lessons:** when a lesson promotes to repo level (§H), land it as an enforced check whenever checkable; an AGENTS.md prose rule is the fallback, not the default.
- **Review gates shrink accordingly:** `checker` verifies what the toolchain cannot see — spec fit, naming, design intent, edge cases — and never re-checks what lint/types already guarantee. Worker-brief constraints shrink the same way ("the toolchain is the constraint; here is what it can't see").

## C. Adversarial review before "done" ✅

- A **fresh-context reviewer** (subagent / dedicated checker) sees only the diff + the criteria, not the reasoning that produced it — so it grades on result. Operationally: the **Gate isolation** rules in [`agent-team-structure.md`](./agent-team-structure.md) — the lead never forwards the maker's report/self-assessment to the reviewer.
- Prompt it to **report gaps that affect correctness or stated requirements**, not style preferences (a gap-hunting reviewer always finds *something*; don't over-engineer chasing it).
- The implementing session receives gaps directly and fixes + re-reviews without manual copy-paste.

*Source: Anthropic best-practices "Add an adversarial review step".*

## C2. Agent teams — how non-trivial work is delegated

Non-trivial tasks (3+ steps, BE+FE, an API contract, an architecture change) run as a **team**, not solo. Role definitions live globally in `~/.claude/agents/`:

| Role | Model | Does |
|---|---|---|
| `team-lead` | opus | plan · decompose · integrate · final verdict; never bulk-codes solo |
| `explorer` | haiku | read-only recon, `file:line` findings, no final code |
| `designer` | sonnet | UX/UI spec from design tokens, not feature code |
| `be-dev` / `fe-dev` | sonnet | implement per spec / per design |
| `checker` | sonnet | independent read-only review → APPROVE / NITS / CHANGES-REQUIRED |
| `qa` | sonnet | real-flow e2e proof + screenshots; never fakes a pass |

- **Order:** `explorer → designer → BE contract finalized → fe-dev → checker → qa`. One task per worker; workers escalate scope questions to `team-lead`; **workers never commit or push.**
- **Delegation mechanism:** enable teams with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `~/.claude/settings.json`; the lead hands tasks to teammates (one task each), integrates the results, and **releases each teammate once its task is integrated** (no idle agents). **If the flag is off**, the same roles/order/gates run as sequential scoped subagents — the model doesn't depend on the flag.
- **Scale down:** solo is fine when the diff fits one sentence. Don't convene a team for a typo.

The full canon — how the lead loads context, decomposes, assigns, integrates, and runs the gates; the per-role "never" list; and the exact team-vs-solo boundary — lives in [`agent-team-structure.md`](./agent-team-structure.md). Read it before running any non-trivial task as a team.

## D. Context hygiene ✅

- **Delegate wide reads to subagents** — they explore in a separate context and report a summary, keeping the main conversation clean.
- **Reset context between unrelated tasks**; keep the always-loaded memory file (`CLAUDE.md`/`AGENTS.md`) concise — bloated memory files get ignored, and important rules get lost in the noise.

## E. Flexibility & extensibility (so agents add features without breaking the rest)

- **Modular boundaries** — a modular monolith with enforced logical boundaries (no cross-module direct DB/ORM access). Cross-module links by FK ID + fetch, not ORM relations.
- **Ports & adapters (hexagonal)** — core logic isolated from external concerns; **integrations (webhooks) are adapters** implementing a port. New integration = new adapter, core untouched.
- **Event bus for side effects** — modules emit typed events (`module.entity.action`, past tense); other modules subscribe. Avoids tight coupling; an agent can add a reaction without editing the emitter.
- **Dependency injection** — resolve services via a container, don't `new` across boundaries; keeps modules swappable and testable.
- **Plugin / widget injection** — extend other modules' UI/behavior via declared injection points, not by editing them.
- **Parallel-safe layout — design away file contention.** Concurrent agents (and humans) collide on the files every change must touch; the fix is architectural, not procedural. No hand-maintained barrel files (`index.ts` re-export walls) and no central hand-edited route/registry/menu file — prefer file-based conventions (e.g. file-based routing) and *generated* aggregations where a registry is unavoidable. A feature's route, components, server functions, schemas, and tests **colocate under one folder**, so one task touches one subtree. Decomposition heuristic for the lead: slice tasks so no two concurrent workers write the same file — if the slicing can't achieve that, the tasks aren't parallel (run them sequentially or in worktrees).

## F. Tooling & DX for fast agent iteration

- **Fast feedback:** quick unit + type-level tests (**Vitest**, has typecheck mode), typecheck, lint (ESLint or Biome) runnable in seconds — the agent's inner loop.
- **Mock HTTP without rewriting app code:** **MSW** for HTTP/WebSocket/GraphQL mocking (Vitest itself recommends it).
- **Real integration tests:** **Testcontainers** — spin up a real throwaway Postgres in a container so the agent runs realistic tests without hand-gluing an environment. One of the highest-value agentic-first pieces.
- **e2e where behavior matters:** **Playwright** — auto-waiting, isolated browser contexts, retries, and a **trace viewer** that gives *evidence* on failure (not just a stack trace). Property-based tests for invariant-heavy logic.
- **Real-flow e2e as proof (not unit):** stand up the *running* stack, then exercise the real user/business flow end-to-end — Playwright for UI, `curl`+`jq` (or a script) against the live API for backend — with seeded fixtures, and **assert on the observed behavior/response, not on code**. Self-contained: seed in setup, clean up in teardown; never point at prod or live-tenant data. This is `qa`'s deliverable and the concrete form of "behavior before diff" (§A).
- **Preview-first delivery:** each PR gets its own deploy URL (+ DB branch where available) so e2e runs against a realistic preview, not localhost-only. Strong agent-testability signal.
- **Deterministic, cached builds:** monorepo with a task runner (Turborepo/pnpm workspaces) when multi-package; single repo otherwise. Reproducible installs (committed lockfile).
- **Agentic docs interop:** root **AGENTS.md** is the shared layer (Codex reads it first; Copilot supports it), **CLAUDE.md imports `@AGENTS.md`** for Claude Code, `.github/copilot-instructions.md` for Copilot. One source of truth, multiple tools.
- **CLI tools over bespoke integrations:** `gh`, `aws`, etc. are the most context-efficient way for the agent to touch external services.
- **Hooks for must-happen-every-time actions** (lint-on-edit, block writes to migrations) — deterministic, unlike advisory memory-file rules.

## G. Git, branches, merges, rollback (working-with-the-repo conventions)

The agent must work git predictably and safely. Generate these as the repo's git conventions:

- **Branch per feature.** Never commit feature work to the default branch. Branch from up-to-date default: `git switch -c feat/<short-kebab-desc>`. Prefixes: `feat/`, `fix/`, `chore/`, `refactor/`, `docs/`, `spec/`. One feature = one branch = one PR.
- **Commit discipline.** Small, focused, present-tense commits that each leave the app working. Conventional-commit style (`feat:`, `fix:`, `chore:`…). Commit only when asked; never `git add -A` blindly — stage what the change touched. Reference the spec/issue in the body.
- **Never commit/push without explicit human instruction.** No auto-push. No committing secrets, build artifacts, or `.env`.
- **Merging.** Default to PR-based merge into the default branch (squash for a clean history unless the repo prefers merge commits). Rebase your feature branch on the latest default before merging to keep history linear; resolve conflicts locally and re-run tests. Delete the branch after merge.
- **Rollback / undo (in order of blast radius):** uncommitted → `git restore <file>` / `git restore --staged`; last commit, keep changes → `git reset --soft HEAD~1`; discard local commits → `git reset --hard <ref>` (DESTRUCTIVE — only with explicit confirmation); already-pushed/shared history → `git revert <sha>` (never force-push a shared branch). `git stash` to park work-in-progress when switching context.
- **Isolation for parallel work.** Use a separate branch — or a **git worktree** (`git worktree add ../wt-<name> <branch>`) — when working two things at once or when an agent needs an isolated checkout that won't collide with the main workspace. One worktree/branch per concern.
- **Hard lines:** never `git reset --hard` / `git push --force` / force-push shared branches / rebase published history without explicit confirmation; never edit a migration that may already be applied (add a new one); never commit directly to `main`/default for feature work.

## H. Institutional memory & hard gates (tooling that survives context resets)

- **Lessons file (`.ai/lessons.md`).** After a correction or a recurring bug, append a lesson: **Context / Problem / Rule / Applies-to**. This is the repo's durable memory so the same mistake isn't repeated across sessions. AGENTS.md carries a rule: "after a correction, record a lesson here."
- **State file (`.ai/STATE.md`) — the project's session memory.** Five sections: **Verified facts** (each with the evidence that proved it) / **General rules** (distilled) / **Open failures** (unresolved + best diagnosis) / **Lessons learned** (pointers into lessons.md) / **Last session** (where work stopped + next step). Two iron rules: **read at session start** (before non-trivial work) and **write before walking away** (every session — completed or interrupted — ends with the update). Division of labor: lessons.md holds *portable rules*; STATE.md holds *this project's facts* and the resume pointer.
- **Promotion rule (memory must compound).** Appended-only memory decays into noise; it compounds only if it moves up: a lesson that recurs → **preferably an enforced check** (lint rule / convention test / hook — §B.3), else a rule in AGENTS.md / Task Router; a pattern recurring across projects → a global-skill candidate. Review lessons.md + STATE.md for promotion candidates when closing a spec. The full ladder: lesson → enforced rule → (only if uncheckable) AGENTS.md prose → global skill.
- **Escaped-defect autopsy (gates must compound too).** A defect found **after** the gates passed — by the client, in prod, or in a later phase — is a *gate failure*, not just a bug. The fix ships with a **gate autopsy**: an `Escaped-defect:` entry in `.ai/lessons.md` naming (a) which gate should have caught it (`checker` / `qa` / a phase's Done-when / security checklist / release checklist) and (b) **what check that gate now gains** — a checklist line, an authz-matrix row, an eval scenario, a lint rule (prefer enforcement per §B.3). Without the autopsy the gates stay exactly as strong as the day they were written. Autopsy entries are priority promotion candidates.
- **Run log (`.ai/runs/`).** For long or multi-step work, keep a per-run note (`.ai/runs/{YYYY-MM-DD}-{slug}.md`): goal, steps done, decisions, what's left. Makes work **resumable** across context resets and reviewable after the fact. Create it the first time a task is long enough to need it (don't pre-seed empty).
- **Pre-commit hooks (husky or equivalent).** Run lint + typecheck (+ format/i18n where relevant) before every commit — deterministic gate the agent can't skip. Optionally block writes to migrations or secrets. (Anthropic: hooks > advisory rules for must-happen-every-time actions.)
- **CI pipeline file (`.github/workflows/ci.yml`).** Small hard gates in order: **lint → typecheck → unit → integration → e2e (on preview) → security scan**. Reusable across packages; this is "verifiable done" enforced by the platform, not the agent's judgment.
- **PR workflow (scale to the project).** PR-based review with a lightweight label taxonomy: pipeline labels (e.g. `review`, `changes-requested`, `qa`, `merge-queue`) mutually exclusive; category labels (`bug`/`feature`/`refactor`/`security`/`docs`) additive. A ready PR carries `review`. For a small custom app, keep it minimal (review → merge-queue); only grow the taxonomy when the team/throughput needs it. Adversarial review (Section C) happens before a PR is marked ready.

---

## How this maps to repo files (when generating a skeleton)

| Principle | Where it lives in the repo |
|---|---|
| A. Verifiable dev, build/test commands | `AGENTS.md` (commands) + test setup + CI |
| B. Guardrails (validation, RBAC, encryption, isolation) | `AGENTS.md` "Critical Rules" + validators + acl + lint/hooks |
| C. Adversarial review | `.ai/skills/code-review` (or `/code-review`) + reviewer subagent/checker role |
| D. Context hygiene | agent behavior + concise `CLAUDE.md`→`@AGENTS.md` |
| E. Modularity / ports & adapters / events | `AGENTS.md` "Architecture" + module layout convention |
| F. DX / builds | `AGENTS.md` "Key Commands" + task runner config |
| G. Git / branch / merge / rollback | `AGENTS.md` "Git Workflow" + branch naming + hard safety rules |
| H. Lessons / hooks / CI / PR | `.ai/lessons.md` + `.husky/pre-commit` + `.github/workflows/ci.yml` + `AGENTS.md` "PR Workflow" |

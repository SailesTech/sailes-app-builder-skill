# Changelog — Sailes app-builder framework

The standard delta between versions. `adopt-existing-repo.md` **Upgrade mode** reads this file
to compute what a repo stamped with an older `Framework-Version:` is missing. Keep entries
upgrade-actionable: what a generated/adopted repo would now contain or do differently.

## 1.1.0 — 2026-07-05 · "move truth from prose into the machine" + the value layer

Engineering layer (`.ai/specs/2026-07-05-agentic-first-next-level.md`):
- **The ratchet (§B.3)**: mechanically checkable conventions are enforced (lint/types/tests/hooks);
  AGENTS.md prose becomes pointers; promotion ladder prefers enforcement; `checker` stops
  re-checking what the toolchain guarantees.
- **Contract as typed artifact**: `packages/contracts` in the skeleton/stack; "frozen BE
  contract" = committed Zod/TS artifact both slices import; specs name contract artifact paths.
- **Harness guardrails**: `.claude/settings.json` permissions + SessionStart (STATE.md
  injection) + PreToolUse (protected paths) in the skeleton and repo-done checklist.
- **Environment / time-to-verdict**: one-command boot with seeded data, fixture user per RBAC
  role, measured `check` time, complete `.env.example` (repo-done Environment block);
  `qa` blocked on env = **ENV-DEFECT** (bootstrap bug), never a skipped proof; time-to-verdict
  is a stack-choice criterion.
- **Parallel-safe layout**: feature-folder colocation; no hand-edited barrels/central
  registries; leads slice tasks for file-disjointness.
- **Context layering + freshness**: AGENTS.md root ≤ ~150 lines (map, not encyclopedia;
  displace-don't-append); scriptable Freshness check (referenced paths/commands must exist) in
  repo-done + adoption audit (row 11).
- **Persisted evals**: `evals/` — one scenario per protected skill behavior; TDD-for-skills
  RED/GREEN now survives the chat.
- **Versioning**: `VERSION` + this changelog; generated AGENTS.md carries `Framework-Version:`;
  adoption audit row 12 + **Upgrade mode** apply the standard delta to older repos (additive,
  human-approved).

Value layer (`.ai/specs/2026-07-05-value-layer.md`):
- **Release gate**: `release-checklist.md` — env/secret parity, migration ordering vs deploy,
  scripted post-deploy smoke (output pasted), rollback plan written pre-deploy; wired into
  `sailes-implement` On-completion and the pipeline map.
- **Ops with teeth**: repo-done Operations block — error tracking that alerts a human,
  `/health`, backups with **one restore actually performed**, uptime check, `.ai/runbook.md`.
- **Provable RBAC**: specs declare the permission matrix (actions × roles); implementation
  generates the authz-matrix test suite (all allow/deny + anonymous row); multi-tenant adds
  generated cross-org denial tests (security checklist upgraded from prose to proof).
- **Gate autopsy**: an escaped defect ships with which-gate-missed-it + the check that gate now
  gains (`Escaped-defect:` entries are priority promotion candidates).
- **Golden modules**: graduation rule (built ~twice → extract to the versioned library with
  tests + docs); bootstrap checks the library before scaffolding; briefs reference golden
  implementations.
- **Estimation loop**: spec phases may carry internal estimates; completion closes
  estimate-vs-actual into an internal ledger feeding `sailes-wycena` (never client-visible).
- **Client status**: root `STATUS.md` derived from live specs, updated at phase gates (no
  effort/pricing data).

Reconciliation (2026-07-07, pre-merge — adversarial review of `feat/agentic-first-next`):
- Two RED Done-when gates fixed (prose/pattern drift): `agents-md-template.md` now literally
  carries "replaced by a one-line pointer to the enforcement" and "gate autopsy / escaped defect".
- Versioning loop closed at runtime: `install.sh` now ships `VERSION` + `CHANGELOG.md` into
  `~/.claude/skills/`; `adopt-existing-repo.md` Upgrade mode reads them there.
- `.claude/settings.json` is now a real template (`sailes-bootstrap/settings-template.json`);
  `skeleton.md` fixed the mis-nested `hooks` (a JSON key + `.claude/hooks/` scripts, not a sibling file).
- Terminology: the Claude Code "harness guardrails" disambiguated from a durable-workflow
  "hard harness" (see the `sailes-async` skill); bootstrap Jobs/queue now points to `sailes-async`.
- `package.json` version aligned to `VERSION` (1.1.0); `sailes-wycena` marked as planned where referenced.
- Still parked as debt (`.ai/backlog.md`): behavioral GREEN re-runs + CI wiring for `evals/`.

## 1.0.0 — 2026-07-02 · baseline

Everything up to and including the loop-engineering adoption (PR #1): the phased pipeline
(start/discovery/bootstrap/design/spec/pre-implement/database/implement), agent-team canon with
gate isolation, STATE.md session memory, binary per-phase Done-when, vision-verify, promotion
rule, idempotent `.ai/` scaffolding, decision-ownership principle.

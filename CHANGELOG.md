# Changelog — Sailes app-builder framework

The standard delta between versions. `adopt-existing-repo.md` **Upgrade mode** reads this file
to compute what a repo stamped with an older `Framework-Version:` is missing. Keep entries
upgrade-actionable: what a generated/adopted repo would now contain or do differently.

## 1.6.0 — 2026-07-18 · the workflow routes itself from the repo's state on disk

- **New hook: `hooks/workflow-router.js` (SessionStart).** In any repo carrying `AGENTS.md` or
  `.ai/`, every session now opens with a routing mandate derived from the filesystem, not from the
  model's read of the request: specs at `.ai/specs/` root → continue at
  `sailes-pre-implement`/`sailes-implement`; none in flight → a feature request enters via
  `sailes-start`. `implemented/` and `archived/` are ignored, so a finished spec cannot masquerade
  as work in progress. The mandate carries four hard rules (no feature code before an approved
  spec; the human owns key decisions; done means verified; gates are not skipped).
- **It fires on `resume|clear|compact`, not just `startup`.** A context reset is precisely when the
  methodology used to evaporate — the previous 1.4.0 hook ran only at startup.
- **Enforcement stays soft, deliberately.** A `PreToolUse` gate that blocks `Write`/`Edit` was
  considered and rejected: it would take the wheel away from the human, which is the one thing the
  standard exists to prevent. The mandate constrains the agent, never the human — "skip it, just
  do the fix" still wins.
- **The hook is now covered by real tests.** `npm test` runs `hooks/workflow-router.test.js`
  (11 assertions, no framework, no deps). The behavioral half — does the agent *honor* the mandate
  — lives in `evals/session-start-routes-from-repo-state.md`, whose control arm records the RED
  baseline: without the block, an agent handed "szybka sprawa, bez ceregieli" writes untyped JS
  into a TS/Drizzle repo, invoking zero skills.
- **Upgrade note:** nothing to change in a consuming repo. The hook ships with the plugin and keys
  off `AGENTS.md`/`.ai/`, which an adopted repo already has. Repos without them stay silent.

## 1.5.0 — 2026-07-16 · the Codex team ships, and the lead can hand it a task

- **The Codex agent team is released.** `codex-agents/` (the seven roles as Codex custom-agent
  TOMLs) and `enable-codex-agents.ps1` / `.sh` landed in the tree during 1.4.0 but were never
  versioned or announced — the marketplace still advertised 1.4.0, so no consumer could pull them.
  The installer copies the seven files to `~/.codex/agents/` and owns only its marked block in
  `~/.codex/config.toml`. Same roles, same pipeline order, same gates: a second harness for the one
  source of truth.
- **New: the lead can hand one task to Codex, on request.** `agents/team-lead.md` gains a
  runtime-delegation block. When the human says "use Codex for the backend" / "let Codex review
  this", the lead invokes `codex exec` directly — `-c sandbox_mode="read-only"` for recon and
  diagnosis, `codex exec review --uncommitted` for review, `-c sandbox_mode="workspace-write"` for
  implementation (which the human authorizes), always with an explicit `-m <model>` so the run
  can't silently inherit the user's global `~/.codex/config.toml` default. Codex's stdout is the
  worker's report, `git diff` is the artifact. **Human-triggered only** — the lead never routes
  work to another runtime on its own initiative.
- **The gates do not move.** A Codex worker is an ordinary worker: `checker` still receives diff +
  spec + checklist ONLY, never the maker's report, whichever runtime produced it. Gate isolation
  generalizes across runtimes unchanged — a cross-runtime maker is still a maker.
- **Delegation is one-directional by design.** The Claude-side lead hands tasks to Codex; the
  Codex-side lead has no matching hand-off back to Claude, so `codex-agents/team-lead.toml` is
  deliberately unchanged (the exception is documented in `codex-agents/README.md`). Symmetry would
  make the second vendor a *requirement* rather than an option — each runtime already runs the
  whole pipeline alone. A Claude-only or Codex-only user loses nothing by never delegating.
- **Evals:** `lead-honors-codex-delegation-and-still-gates.md` — the lead must name a concrete
  `codex exec` invocation with pinned model and sandbox mode, and still run `checker` + `qa` with
  `checker` isolated. RED baseline (2026-07-16): the lead answered "undefined in my instructions",
  declined to invent a mechanism, and fell back to `be-dev`.
- **Upgrade action:** repos on ≤1.4.0 gain the Codex agent team and the lead's delegation path; no
  repo file changes required — both are machine-global (an installer and agent-role behavior), not
  generated-repo content. Run `./enable-codex-agents.sh` (or `.ps1`) to install the seven Codex
  roles; update the marketplace plugin for the Claude-side lead.

## 1.4.0 — 2026-07-14 · the agent team ships as installable agents

- **New `agents/` directory — the agent team is now installable, not just described.** The seven
  roles that `sailes-bootstrap/agent-team-structure.md` defined only in prose (`team-lead`,
  `explorer`, `designer`, `be-dev`, `fe-dev`, `checker`, `qa`) now exist as real agent files with
  frontmatter (`name` · `description` · `model` · `tools`), auto-discovered on
  `plugin install sailes-app-builder@sailes`. Models follow the canonical table: `team-lead`=opus,
  `explorer`=haiku, the rest=sonnet.
- **Fix: "marketplace doesn't install agents."** Root cause — the plugin shipped zero agent files,
  and the only folder present was a dot-prefixed `.agents/`, which Claude Code ignores during
  plugin component discovery. Agents must live in `agents/` (no dot). The empty `.agents/` was
  removed; `agents/README.md` documents the trap.
- **`agent-team-structure.md`** now states the roles ship in the plugin's `agents/` (and may be
  copied to `~/.claude/agents/` for global use) instead of assuming they already live globally.
- **Upgrade action:** repos on ≤1.3.0 pulling this version gain the installable agent team; no repo
  file changes required — this is a plugin-packaging fix. After updating the marketplace plugin,
  the seven roles appear in `/agents`.

## 1.3.0 — 2026-07-13 · the wayfinding layer for big, foggy efforts

- **New skill `sailes-wayfinder`** — when an effort is too big/foggy for one session, chart a
  decision map on disk (`.ai/wayfinder/<effort>/map.md` + `tickets/NNN-*.md`): a named
  Destination, typed tickets (decision / research / prototype / task), fog of war
  ("Not yet specified"), an out-of-scope ledger, and claim/`Blocked-by`/frontier mechanics so
  concurrent sessions don't collide. Work mode resolves **one decision per session**
  (research excepted, runs parallel via subagents); when no tickets + no fog remain, hand off
  to the pipeline gate the Destination names. Ticket types resolve through mechanisms the
  framework already has (decision cards, research subagents, `sailes-design` prototypes) —
  methodology adapted from Matt Pocock's Wayfinder with zero external skill dependencies.
  `.ai/STATE.md` points at the active map (path + next frontier ticket).
- **`sailes-start` — Step 0 fog check**: a too-big/foggy idea (unknowns depending on
  unknowns, pending API access, awaited client input) routes to `sailes-wayfinder` before
  Phase 1; A/B/C routing still applies after the map clears.
- **`sailes-spec` — Open Questions escalation**: unknowns that can't be answered in one
  sitting become typed wayfinder tickets; the spec stays at skeleton (`Status: draft` + map
  link) and resumes when the map clears; the Decisions Ledger references ticket resolutions
  (gist + link), never restates them.
- **Evals**: +3 scenarios (`wayfinder-charts-map-not-full-plan`,
  `start-routes-foggy-ideas-to-wayfinder`, `spec-escalates-oversized-open-questions`) —
  RED baselines and GREEN verification recorded 2026-07-13.
- A repo on an older framework gains: the `.ai/wayfinder/` convention + the STATE.md pointer
  to the active map.

## 1.2.0 — 2026-07-12 · Codex CLI parity — second harness, one source of truth

Make the framework run correctly under **OpenAI Codex CLI**, not just Claude Code — skills
*and* the repos they generate. What a generated/adopted repo now contains or does differently:

- **Codex guardrail twin**: `sailes-bootstrap` emits `.codex/config.toml` alongside
  `.claude/settings.json` (new `codex-config-template.md`). It maps `permissions.allow/deny` →
  `sandbox_mode`/`approval_policy` + `[hooks]`, and the **hook scripts are shared** —
  `.claude/hooks/*.sh` is one copy referenced by both configs (identical stdin-JSON payload +
  exit-2-to-block + SessionStart-stdout→context contract). Honestly encodes the Codex
  limitation that some versions fire `PreToolUse` only for `Bash` (apply_patch edits fall back
  to sandbox/approval + prose rules).
- **Copilot pointer**: `.github/copilot-instructions.md` → `AGENTS.md` generated too. One source
  of truth, three harnesses.
- **Skill distribution for Codex**: `enable-codex.sh` / `enable-codex.ps1` copy `sailes-*` into
  `~/.agents/skills/` (Codex USER-scope). The `SKILL.md` frontmatter (`name` + `description`) is
  already Codex-native — no transformation. Ships `VERSION` + `CHANGELOG.md` next to the skills,
  like `install.sh`, so Upgrade mode can read `~/.agents/skills/CHANGELOG.md`.
- **Bootstrap wiring**: skeleton (`.codex/` in the tree, shared-hooks note), `agents-md-template`
  (Enforcement lists both twins), `agentic-first-principles` (harness-parity principle),
  `repo-done-checklist` (verify `.codex/config.toml` + no script drift), `adopt-existing-repo`
  (audit row 13 + additive generation of the Codex twin), `SKILL.md` (Case B/C generate both
  twins by default).
- **Definition of "Codex-ready"**: a repo is Codex-ready only when the `.codex/` twin exists and
  points at the shared scripts — not merely because `AGENTS.md` is readable.

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

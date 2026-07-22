# Run log — sailes-migrate

Spec: `.ai/specs/2026-07-22-sailes-migrate.md` (Status: draft — Open-Questions answered by proxy)
Branch: `feat/sailes-migrate` (rebased onto `main` = 1.11.0 → this skill is 1.12.0; old graphify-based branch kept as `feat/sailes-migrate-graphifybased`)
Started: 2026-07-22 · autonomous session (decision-owner away; every scope call marked NEEDS-VERIFICATION)

## What & why

Evaluated whether the framework covers Anthropic's `code-migration-kit-with-claude-code`. It does
not — our pipeline builds new apps; the kit ports existing codebases at scale. Added it as a new
**domain-sibling skill `sailes-migrate`** (not wired into the linear pipeline), whose six-step
method reuses existing roles + the deny-list guardrail rather than importing the kit wholesale.

## Decisions made by proxy (see spec §2 — all NEEDS-VERIFICATION)

- D1 separate skill (not a pipeline mode) · D2 structure-preserving default + redesign mode ·
  D3 language-agnostic · **D4 reference the kit's scripts, do NOT vendor Anthropic code this
  session (human licensing call)** · D5 reuse existing agents · D6 judge gate non-negotiable ·
  D7 **resolved: rebased onto `main` (1.11.0) → sailes-migrate is 1.12.0**, independent of graphify.
  ⚠️ Number collides with graphify's own 1.12.0 if graphify later merges — coordinate at that merge.

## Delivered (all Done-when green)

- Spec `.ai/specs/2026-07-22-sailes-migrate.md`.
- Evals FIRST (RED): `migrate-judge-gate`, `migrate-structure-preserving-default`,
  `migrate-is-domain-sibling`.
- Skill `skills/sailes-migrate/` — 6 files (SKILL + methodology, judge-setup, rulebook-template,
  parallel-translation, cost-and-gates).
- Registration: `skills/README.md`, `README.md`, `AGENTS.md` task router + Framework-Version, `CHANGELOG.md` 1.12.0.
- Version 1.11.0 → 1.12.0 across all four manifests (VERSION, package.json, plugin.json,
  marketplace.json) + plugin/marketplace description strings.
- `npm test` → all passing.

## Verified — evals run on fresh subagents (all GREEN, 2026-07-22)

Dispatched each eval's Setup to a fresh general-purpose subagent (clean context, unaware of the
eval), given the skill on disk + an adversarial prompt:
- `migrate-judge-gate` — GREEN: under "jedź szybko, tłumacz równolegle" it refused Step-3 fan-out,
  cited the invariant, named judge-validated-against-broken-source as the gate.
- `migrate-structure-preserving-default` — GREEN: unqualified "port from Rails" → structure-
  preserving default, unit = file/module from the dependency map, redesign named as explicit mode.
- `migrate-is-domain-sibling` — GREEN: "not in the linear pipeline at all; a domain sibling like
  pipedrive/hosting", reused existing roles, invented none.
Each eval's `Last run:` line updated to GREEN.

## NOT done (human gate — E1)

- **No push, no merge to `main`** (merge = live deploy to every machine).
- **Uncommitted** on the branch (full change set visible in `git status`/`git diff`) — committing
  was left to you.
- No `./install.sh --force` (that syncs the active copy; do it post-merge).

## For verification (fastest path)

1. Read spec §2 — accept/reject each provisional decision (D1/D2/D4 are the shape-defining ones).
2. Dispatch the 3 evals to fresh subagents → confirm GREEN.
3. If good: bump/renumber if graphify's version state changed, merge `feat/sailes-migrate` → `main`,
   then `./install.sh --force`.

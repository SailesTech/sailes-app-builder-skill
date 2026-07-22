# Spec: `sailes-migrate` — large-scale codebase migration as a Sailes domain skill

Status: draft
Framework-Version target: 1.12.0
Branch: `feat/sailes-migrate` (rebased onto `main` = 1.11.0; independent of graphify. Old graphify-based branch kept as `feat/sailes-migrate-graphifybased`)
Author: session 2026-07-22 (autonomous; human at pool — every decision below is marked NEEDS-VERIFICATION)
Provenance: distilled from `anthropics/code-migration-kit-with-claude-code` (Apache-2.0, © 2026 Anthropic PBC)

> **Read this first.** This spec was written while the decision-owner was away, so the normal
> `sailes-spec` **Open Questions hard gate** could not run (a human answers those). Instead of
> stopping, this session made each critical call itself and recorded it in **§2 Provisional
> Decisions** with option + recommendation + cost + *regret if wrong*. Nothing here is "the
> user's decision" — every row is a proposal awaiting your yes/no. Reject any row and the
> dependent sections change; the regret column tells you how expensive each reversal is.

---

## 1. TLDR & Context

We were asked to evaluate whether our framework already covers what Anthropic's
**code-migration-kit** does, and if not, how to add it. Verdict: **we don't have it.** Our
pipeline *builds new* B2B apps/features; the kit *ports an existing codebase* to another
language/stack at scale (structure-preserving), mechanically, with a judge for behavior parity.
The only "migration" we own today is **DB-schema** migration (`sailes-database`) — a different
meaning of the word.

But the kit is not foreign: it shares our exact spine — **gates, human-owns-decisions,
verify-by-evidence, parallel subagents, deny-list guardrails, "fix the process not the
instance."** So we add it as its own **domain sibling skill `sailes-migrate`** (like
`sailes-pipedrive` / `sailes-hosting` — invocable, but not wired into the linear build pipeline),
whose 6-step sub-pipeline **reuses machinery we already have** rather than importing the kit
wholesale.

**Why now:** it turns "port this legacy app to our stack" — a request Sailes will get — into a
repeatable, gated method instead of an ad-hoc heroic effort.

## 2. Provisional Decisions (NEEDS-VERIFICATION) — the Open-Questions gate, answered by proxy

| # | Decision | Options considered | **Provisional call** | Cost / regret if you flip it |
|---|---|---|---|---|
| D1 | **Separate skill vs. extend the pipeline?** | (A) new standalone skill `sailes-migrate`; (B) add a "migrate" mode inside discovery/spec/implement | **(A) separate domain-sibling skill** | Low regret. Steelman for B: reuses build-phase machinery directly. Rejected: migration's unit of work (file/module from a dependency manifest), its judge-first invariant, and its parallel queue-runner don't map onto feature-building phases — forcing them bloats every core skill with migration-only branches. |
| D2 | **Structure-preserving only, or also redesign?** | (A) SP only; (B) SP default + redesign as an explicit **mode** | **(B) SP is default/primary; redesign is a documented mode** (mirrors the kit's own "redesign vs structure-preserving" section) | Low regret — the skeleton is robust to whichever you want; redesign just swaps rulebook→design-doc, invalidates the bakeoff, and shifts the unit file→module. |
| D3 | **Which languages/stacks at launch?** | (A) pin a few; (B) language-agnostic method, examples anchored to our TS house stack | **(B) language-agnostic**, TS-anchored examples | Low regret, additive. |
| D4 | **Vendor the kit's scripts (depmap/queue_runner/build_daemon/RULEBOOK/inventory/deny-settings) into our repo, or reference them?** | (A) copy verbatim into `skills/sailes-migrate/scripts/` (Apache-2.0 permits it **with attribution + NOTICE**); (B) reference the kit repo + document install; (C) write our own thin originals over time | **(B) reference now; do NOT copy Anthropic code in this session** | **This is genuinely yours, not mine** — bundling another vendor's code into a Sailes-distributed plugin is a licensing/branding call. Regret of B is only convenience (a user clones the kit for the scripts). Flipping to A later is a clean, additive PR once you approve the NOTICE. |
| D5 | **New migration agents, or reuse existing roles?** | (A) new TOML roles; (B) reuse explorer/team-lead/be-dev/fe-dev/checker/tester/qa with migration guidance in-skill | **(B) reuse existing roles** | Low regret; new roles only if a real gap surfaces in a first real run. |
| D6 | **How hard is the judge/parity gate?** | (A) advisory; (B) non-negotiable, exactly as the kit — judge exists before translation; parity gate = all parity tests pass AND original suite on original code has zero inherited failures | **(B) non-negotiable** (matches our VERIFIED rule + `qa` gate) | Low regret; softening it defeats the point of the skill. |
| D7 | **Branch base + version number** | (A) branch off `main` (1.11.0) → 1.12.0; (B) stack on `feat/graphify-default-integration` (1.12.0) → 1.13.0 | **RESOLVED → (A): rebased onto `main`, this skill is 1.12.0** | ⚠️ Verified after the fact that graphify is NOT on `main` (main = 1.11.0), so (A) is correct and decouples the two. Remaining risk: `1.12.0` collides with graphify's own 1.12.0 if graphify later merges — whoever merges second bumps. |

**If you disagree with D1, D2, or D4, stop before merge** — those three shape the skill's surface.
D3/D5/D6/D7 are cheap to adjust.

## 3. Problem Statement

Sailes has no repeatable method for **porting an existing codebase to another language/stack at
scale**. Done ad-hoc, such a port: (a) lets two agents translate the same construct two different
ways (no decide-once rulebook), (b) declares "done" on a green typecheck with no proof of behavior
parity, (c) fixes individual bugs instead of the rule that generated the class of bug, and (d) has
no deterministic ordering, so agents fight over dependency cycles. The kit solves exactly these;
we want that solution as a first-class, gated Sailes skill.

## 4. Proposed Solution — `sailes-migrate`, the 6-step sub-pipeline mapped onto our machinery

The skill drives the kit's six steps but **reuses what we already own** at each one. The judge is
the non-negotiable that must exist before Step 3.

| Kit step | What it produces | **Reused Sailes machinery** |
|---|---|---|
| **0. Feasibility + Judge setup** | case for/against; the parity harness (existing suite, or a portable one if tests import source internals) | `sailes-pre-implement` (readiness lens) + the `qa` gate discipline; the judge is validated against *deliberately broken* code before Step 1 |
| **1. Map + Rulebook + Gap inventory** | dependency order (manifest), decide-once decision table, target-language gap audit | `explorer` + **graphify** code map (we already ship it); Rulebook = a *frozen* decision table (our decision-card culture, but resolved once, not per-choice) |
| **2. Stress-test the rules** | bakeoff (two translators) + pilot run on nasty files; output = rule amendments only, no code committed | new element — nearest kin is `sailes-implement`'s RED baseline; runs under the deny-list guardrail |
| **3. Translate everything (fan-out)** | parallel translation off the manifest, no compiler yet | `team-lead` orchestration → parallel `be-dev`/`fe-dev`; **`.claude/settings.json` deny-list** blocks expensive ops (we already ship guardrail hooks + the `.codex` twin) |
| **4. Survey build + fixers** | one aggregated compile → machine error queue sliced leaves→root → parallel fixers without compiler access | fixer fan-out under `team-lead`; guardrail hooks |
| **5. Run it** | hello-world → smallest end-to-end proof | `qa` behavior-proof discipline (cheap verification before expensive) |
| **6. Match behavior (parity gate)** | all parity tests pass AND original suite clean on original code; then burn down `BUG(port)`/`TODO(port)`/`PERF(port)` | `checker` + `tester` + `qa`; `.ai/backlog.md` for deferred markers |

**Invariant added to our set:** *No translation fan-out (Step 3) begins before a judge exists and
has been validated against intentionally-broken source.* This is the migration analog of our "no
feature code before an approved spec."

## 5. Skill file surface (what this spec creates)

```
skills/sailes-migrate/
  SKILL.md              # frontmatter (name+description, PL triggers like our other skills) + the 6-step method,
                        #   when-to-use / when-NOT, the reuse map (§4), the judge invariant, red flags
  methodology.md        # the six steps in depth (our prose synthesis of the kit)
  judge-setup.md        # the non-negotiable: existing suite vs portable parity harness; validate-against-broken-code
  rulebook-template.md   # our own decide-once decision-table template (NOT a copy of the kit's RULEBOOK.md)
  parallel-translation.md# fan-out playbook mapped to team-lead + be-dev/fe-dev + the deny-list guardrail
  cost-and-gates.md     # units-of-work × per-unit budget model; the gate at each step; provenance + kit-script pointer
```

No new agent TOMLs (D5). No vendored Anthropic scripts (D4) — `cost-and-gates.md` points to the
kit repo for `depmap_*` / `queue_runner` / `build_daemon` and records the Apache-2.0 + attribution
requirement for a future opt-in vendoring PR.

## 6. Registration surface (the "ratchet" — prose the machine and adopters read)

- `skills/README.md` — new row in **The skills** table (Role + Key files), marked *domain sibling,
  not part of the core pipeline* (like pipedrive/hosting).
- `README.md` — new row in **What you get**.
- `AGENTS.md` — one **Task router** row: *"Porting an existing codebase to another language/stack
  at scale → `sailes-migrate`"*.
- `CHANGELOG.md` — a `1.12.0` entry, upgrade-actionable.
- Version bump **1.11.0 → 1.12.0** across all four manifests: `VERSION`, `package.json`,
  `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (the fourth has drifted twice —
  check it). Also update the plugin/marketplace `description` strings that enumerate skills.
- `evals/` — new scenarios (see §8), written **before** the SKILL (eval-first discipline).

## 7. Phasing & Steps (each leaves the repo consistent + has a binary Done-when)

**Phase A — Evals first (RED).**
- A1. Write `evals/migrate-judge-gate.md`, `evals/migrate-structure-preserving-default.md`,
  `evals/migrate-is-domain-sibling.md`. **Done-when:** the three files exist and each has
  `Setup` + `Expected (binary)` + `Failure looks like` sections (`grep -l 'Expected (binary)'
  evals/migrate-*.md` → 3 files).

**Phase B — The skill.**
- B1. Write `skills/sailes-migrate/SKILL.md` + the five reference files (§5). **Done-when:**
  `test -f skills/sailes-migrate/SKILL.md` and the SKILL frontmatter parses (has `name:` +
  `description:`); `ls skills/sailes-migrate/*.md | wc -l` → 6.

**Phase C — Registration + version.**
- C1. Add the rows to `skills/README.md`, `README.md`, `AGENTS.md`; add the `CHANGELOG.md`
  1.12.0 entry; bump all four manifests to 1.12.0. **Done-when:**
  `grep -rl 'sailes-migrate' README.md skills/README.md AGENTS.md CHANGELOG.md` → 4 files, and
  `cat VERSION; grep '"version"' package.json .claude-plugin/plugin.json .claude-plugin/marketplace.json`
  all show `1.12.0`.

**Phase D — Verify.**
- D1. `npm test` (existing hook + TOML validator — must stay green; we touch neither).
  **Done-when:** `npm test` exits 0.
- D2. Update `.ai/STATE.md` + write `.ai/runs/2026-07-22-sailes-migrate.md`. **Done-when:** both
  files reference this spec.

**Phase E — Human gate (NOT done this session).**
- E1. You verify §2, run the three evals on fresh subagents (RED→GREEN), then decide the merge.
  **Merge to `main` = live deploy to every machine** — that is your action, not the agent's.

## 8. Eval coverage (protected behaviors)

1. **`migrate-judge-gate`** — hand a fresh subagent a "port this repo, go fast" prompt; it must
   refuse to start translation before a judge/parity harness exists. *Failure looks like:*
   translating files immediately, no parity harness.
2. **`migrate-structure-preserving-default`** — asked to migrate without qualification, it treats
   structure-preserving as the default and names redesign as a separate mode. *Failure looks like:*
   silently redesigning architecture.
3. **`migrate-is-domain-sibling`** — it does not insert itself into the linear
   discovery→…→implement pipeline. *Failure looks like:* claiming migration is Phase X of the
   build pipeline.

## 9. Non-Goals

- **Not** wiring migration into the linear build pipeline (it's a sibling — D1).
- **Not** copying Anthropic's scripts into this repo this session (D4 — your call).
- **Not** new agent roles (D5).
- **Not** bumping/merging to `main` (that deploys; it's the human gate E1).
- **Not** DB-schema migration — that stays `sailes-database`; the skill's description must
  disambiguate the two senses of "migration" so triggering doesn't collide.

## 10. Provenance & licensing note

Method distilled from `anthropics/code-migration-kit-with-claude-code` (**Apache-2.0, © 2026
Anthropic PBC**). This spec and the SKILL are our own prose synthesis of the *ideas* (not
copyrightable) — no source text reproduced. Any future decision to **vendor their actual files**
(D4→A) must add a `NOTICE`/attribution per Apache-2.0 §4 and is explicitly deferred to the human.
```

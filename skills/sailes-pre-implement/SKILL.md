---
name: sailes-pre-implement
description: Use AFTER a spec is approved and BEFORE writing implementation code, to analyze the spec for readiness — backward-compatibility impact, risks, and gaps — and produce a readiness report. Triggers — "przeanalizuj spec", "czy spec gotowy", "pre-implement", "analiza ryzyka", "BC impact", "gap analysis", before implementing any non-trivial spec. Catches problems on paper, where they're cheap, instead of mid-implementation.
---

# Sailes Pre-Implement — spec readiness analysis before any code

## Overview

**The gate between an approved spec and writing code.** It catches — on paper, where it's cheap — the things that otherwise blow up mid-implementation: a breaking change to a public contract, a missing section, an underestimated risk, a wrong assumption about existing code.

**Core principle:** Reading the spec against reality (existing code, contracts, lessons) for 15 minutes saves hours of rework. Produce a **readiness report**, not code.

## When to Use / When NOT to

**Use when:** a spec is approved (from `sailes-spec` or a local spec skill) and the change is non-trivial — touches multiple files, public contracts, data model, or integrations.

**Do NOT use when:** trivial one-file change with no contract impact; the spec is still in `draft` (finish it first); there's no spec at all (write one with `sailes-spec`).

## Workflow

### Phase 1 — Load context
1. Read the target spec **fully** (`.ai/specs/...`, status `approved`).
2. `grep` `.ai/lessons.md` **and** `.ai/archive/` by the spec's touched areas (module, file, integration name) for known pitfalls — not by `Applies-to`, which most entries lack, and never the whole file.
3. Use the **Task Router** in `AGENTS.md` to find every guide/module the spec touches — read all matching ones.
4. Map the existing code the spec affects: entities, API routes, events, exports, jobs. For a large scope, dispatch read-only `Explore`/`explorer` subagents (one area each) — keep main context clean.

### Phase 1b — Is the spec the right weight, and does it probe the wire?

Two cheap reads before the expensive audit, both from failures measured 2026-08-30.

**Weight.** Judge the spec against the block below and say so in the report in one line. A spec
carrying six sections it does not need is not safer — it is a document whose four load-bearing
lines nobody can find, and every gate downstream reads the same document. Over-weight is a finding;
report it as one. Under-weight — a contract change with no spec at all — is a blocker.

<!-- BEGIN spec-weight -->
**The spec weight scales with what a wrong assumption costs, never with the template you own.**

Three weights. Pick one deliberately; the failure this rule exists for is the full template being
applied because it was there.

- **No spec** — a one-liner, a typo, an isolated refactor with no behavior change. Just do it, with
  a test that pins it. Unchanged.
- **Contract fix** — behavior changes at a surface someone else depends on, but the data model,
  the auth model and the module boundaries stay put. **Five sections, and no more:** TLDR · what
  changes (the surface, before → after) · `Done-when` (carrying `Deployed-probe:` when the change
  is on the wire) · non-goals · phasing only if there is genuinely more than one phase. Every other
  required section is written `n/a` on one line or left out. A data-model section for a change that
  moves no table is filler, and filler costs a spec exactly what it costs an answer: the reader
  cannot find the four load-bearing lines, and every gate downstream reads the same document.
- **Feature** — new surface, a data model that moves, tenancy, auth, money, or an integration
  contract. The full required-sections list, as today.

**Weight goes down, never out.** The opposite failure — skipping the spec because the change "felt
small" — is behind every escaped contract change this framework records, and a contract fix is
precisely the shape that feels small. Halving the document is the saving; skipping it is not.

**A spec is rewritten, not patched.** Measured in the same session: eight numbered correction
sections, accumulated because the spec was being fixed in place instead of re-written. Once the
corrections outnumber the design, the document describes its own history rather than the change,
and reading it costs more than replacing it. The `Status:` line and the Decisions Ledger survive a
rewrite; the correction sections are the thing being deleted.

**Write the weight down.** One line by the `Status:` line — `Weight: contract-fix — no data model
moves, one API path, one FE screen.` A weight nobody wrote is a weight nobody can argue with, and
this rule exists because the default was never a decision at all.
<!-- END spec-weight -->

**Wire.** Run `node "${CLAUDE_PLUGIN_ROOT}/tools/deployed-surface-check.js" <spec>` (or apply its
rule by reading, when the framework repo is not reachable from here). A phase whose behavior
depends on a status code, a header or a `Content-Type` must name where that is observed on the
**deployed** address. Not origin, not localhost, not a mock. This is the cheapest finding in the
whole gate: one command, and it is the only thing that would have caught 2026-08-29 — a feature
that shipped with unit tests, Playwright e2e and a green `qa` gate, and worked for zero customers,
because CloudFront rewrites the origin's `404` into `200 text/html` and nothing ever asked the
deployed host. `tools/` ships with the plugin, not the client repo's working tree —
`${CLAUDE_PLUGIN_ROOT}` is how a hook already reaches it (`hooks/hooks.json`); an unqualified path
into `tools/` only resolves from inside this framework repo itself. **If `CLAUDE_PLUGIN_ROOT` is
unset** (a session running the pre-plugin `install.sh` path, which copies `skills/` only), the
check has no script to reach — report that as a blocker ("deployed-surface-check unavailable —
plugin not active, apply the rule by reading") rather than let `node` die with `MODULE_NOT_FOUND`,
which reads as a broken tool rather than a missing variable.

**Contract.** Before any dispatch, the lead (or `explorer` on the lead's order) calls **every
existing contract the phase stands on** — an API it calls, a webhook payload it receives, a
third-party response it parses — on the **local stack with seed/fixture data**, and pastes the
raw response into the spec's `Contract-probe:` field, redacting tokens/secrets/PII as
`<redacted>`. Documentation is not the source of truth about data shape; a measured response is.
Run `node "${CLAUDE_PLUGIN_ROOT}/tools/contract-probe-check.js" <spec>` to confirm every graded
phase answers. **A missing field is NOT-READY.** If the local stack does not boot, that is an
`ENV-DEFECT` and NOT-READY — a broken environment is never a reason to write `n/a`; `n/a` is only
for a phase that genuinely stands on no existing contract. **If `CLAUDE_PLUGIN_ROOT` is unset**,
report that as a blocker ("contract-probe-check unavailable — plugin not active, verify every
`Contract-probe:` field by hand") rather than let `node` die with `MODULE_NOT_FOUND`.

### Phase 2 — Backward-compatibility audit
For each affected surface, ask: does the spec **rename / remove / narrow** something other code depends on? Walk these contract surfaces (drop those that don't apply to this stack):

| Surface | Check |
|---|---|
| Public types / interfaces | removed or narrowed required fields? |
| Function / API signatures | changed required params or return shape? |
| HTTP routes & response fields | renamed/removed endpoint or field? |
| DB schema | renamed/removed column or table? (migration + backfill?) |
| Event names / payloads | renamed event or payload field? |
| Import paths / exports | moved a module without a re-export bridge? |
| Permission / role IDs (stored in DB) | renamed a feature/role key? |
| File / config conventions | renamed a convention file other code discovers? |

For each hit: classify **Critical** (must fix before coding) vs **Warning** (needs a deprecation bridge / migration), and propose the migration path (re-export, dual-write, alias, backfill). If the spec lacks a "Migration / Backward-Compatibility" section and needs one — flag it.

**Mechanical BC probe (when `graphify-out/graph.json` exists):** for every surface the spec
touches, run `graphify explain "<symbol>"` (its full in/out edge list = the real blast radius)
and `graphify path "<changed thing>" "<suspected dependent>"` for each risky pair. Paste the
edge lists into the readiness report as evidence — cited edges, not prose claims. Freshness
check first (graphify-setup.md); a stale graph is not evidence.

### Phase 3 — Gap & completeness check
Against the `sailes-spec` required sections: is anything missing or vague? Specifically — unresolved Open Questions, data model holes, integration contracts undefined, **no integration coverage / tests named**, security section absent for sensitive data, phases that leave the app broken mid-way, source-of-truth undefined for a sync.

### Phase 4 — Risk assessment
List concrete failure scenarios: **scenario · severity · affected area · mitigation · residual risk.** Call out the irreversible / hard-to-rollback steps and anything touching production data.

### Phase 5 — Readiness report (the output)
```
# Pre-Implement Report: {spec}
## Verdict: READY | READY-WITH-FIXES | NOT-READY
## BC findings:   [Critical / Warning] surface → migration path
## Gaps:          missing/vague sections to fix in the spec first
## Risks:         scenario · severity · mitigation · residual
## Remediation:   ordered list of spec edits to make before coding
## Suggested phase order / sequencing notes
```

- **NOT-READY / READY-WITH-FIXES** → the fixes go back into the spec (via `sailes-spec`) before implementation. Don't start coding around a known gap.
- **READY** → if the spec touches the DB (new/changed tables, columns, indexes, migrations), route through **`sailes-database`** first — it turns the approved data model into safe, expand/contract migrations and decides the remaining 🔀 schema forks (key type, jsonb/column, tenancy, soft-delete) via decision cards. Carry these BC findings into it; don't re-derive them. Then hand to `sailes-implement`. For non-trivial scope this is where the **agent team** starts: the driving agent acts as `team-lead` and runs roles/order/gates/lifecycle per `sailes-bootstrap/agent-team-structure.md` (spawn one worker per task **with `isolation: worktree` for anything that writes**, release on integration; `checker` + `qa` gates; workers never commit to a shared branch and never push — in their own worktree they commit, and the lead cherry-picks it).

## Quick Reference

| Phase | Output |
|---|---|
| Load context | spec + lessons + Task-Router guides + affected-code map |
| BC audit | Critical/Warning findings + migration paths |
| Gap check | missing/vague spec sections |
| Risk | scenarios + mitigations |
| Report | READY / WITH-FIXES / NOT-READY + remediation |

## Red Flags — STOP

- You're about to implement and never checked the spec against existing contracts.
- You found a Critical BC break and started coding anyway instead of fixing the spec.
- The spec has unresolved Open Questions and you're proceeding.
- You can't name the rollback for an irreversible step.

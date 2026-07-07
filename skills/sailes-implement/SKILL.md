---
name: sailes-implement
description: Use to implement an approved, ready spec (or specific phases of it) — phase by phase, each step verifiable, with tests, a review gate, spec progress tracking, and a run log. Triggers — "zaimplementuj spec", "wdroż fazę X", "realizuj spec", "implement spec", after sailes-pre-implement returns READY. Turns a spec into shipped, tested code without losing the thread across context resets.
---

# Sailes Implement — execute a spec, phase by phase, verifiably

## Overview

**Turns an approved spec into shipped, tested code** — using the verifiable-done loop, one testable step at a time, with a review gate and resumable progress. The spec says *what*; this skill governs *how to build it without drift or broken intermediate states*.

**Core principle:** Every step ends with a check you run (test/build/typecheck/E2E/screenshot) and leaves the app working. Show evidence, not assertions. (See `sailes-bootstrap/agentic-first-principles.md` §A.)

## When to Use / When NOT to

**Use when:** a spec is `approved` and `sailes-pre-implement` returned READY (or the change is small enough that readiness is obvious).

**Do NOT use when:** no approved spec (write one — `sailes-spec`); spec is NOT-READY (fix it first); a trivial one-liner (just do it).

## Pre-flight
1. Read the spec fully + its **phases/steps** + the pre-implement readiness report. Read **`.ai/STATE.md` + `.ai/lessons.md`** (project memory) — start from what's already verified and what's known to fail; don't re-derive it.
2. Confirm `Status: approved`; set it to `in-progress`.
3. For long/multi-step work (>~5 commits), open a **run log** `.ai/runs/{YYYY-MM-DD}-{slug}.md`: goal, phase list, decisions, what's left — so the work is resumable across context resets.
4. Branch off; never implement on the default branch.

## Implementation loop — per Phase, then per Step

For each **Phase** (story) in order, and each **Step** (testable task) within it:

1. **Plan the step** — restate what it changes and the check that will prove it. Identify the RED test first (write or name a failing test before the code — `superpowers:test-driven-development`).
2. **Implement** — minimal change that satisfies the step. Logic in services, validation at the boundary (Zod), thin controllers, no `any`. Honor the repo's `AGENTS.md` rules + Task Router guides for the area.
3. **Test** — unit for logic, integration for every affected API path, E2E for user-critical flows (per the spec's integration coverage). Self-contained tests; never fake a pass. **Auth/roles-touching phases: generate the authz-matrix suite from the spec's permission matrix** — every action × role → asserted allow/deny + the anonymous row (and, multi-tenant, the cross-org denial tests). The matrix table in the spec is the source; the tests are its executable form (`security-checklist.md`).
4. **Verify (behavior before diff)** — drive the real running system first (e2e flow / `curl` the live endpoint / click the UI / generate the actual PDF/screen), observe the real behavior, THEN trust it. Paste the evidence (command + output / screenshot). A green build/lint is not proof; "looks done" is the failure mode. **UI-touching steps get vision-verify:** compare the fresh screenshot against the design artifact and the previous accepted screenshot in `.ai/screens/` (canon: `sailes-bootstrap/agent-team-structure.md`, Gate isolation).
5. **Commit** — one focused commit per step (roughly 1:1 step↔commit), message references the spec. The app is working after every step.
6. **Track** — tick the step in the spec's **Progress** section (and the run log if used). New unknown surfaced → stop, resolve via `sailes-spec` (re-gate), don't guess. At each **phase** gate, also update the root `STATUS.md` (client-readable: phases done/total, the plain-language Done-when result, accepted screenshot for UI phases — never effort/pricing data).

**Phase gate (binary stop condition).** A phase is complete only when its **Done-when** condition from the spec passes — run the exact commands, paste the output. "Looks complete" is not a phase gate. If the spec has no binary Done-when for a phase, derive one and add it to the spec **before** starting that phase. A Done-when never overrides decision ownership: hitting a **key decision** mid-loop (contract shape, data model, auth, a new UX surface) means STOP and escalate per `agent-team-structure.md` — never push through it to satisfy the goal.

## Review gate (before "done")
- **Adversarial review in a fresh context** — a reviewer subagent / `checker` reads the diff against the spec + the code-review checklist (correctness, contracts, security, scope creep, tests present). (`sailes-bootstrap/agentic-first-principles.md` §C.)
- Address findings; re-verify. Don't mark done with open Critical findings.

## On completion
- All phases shipped + verified → set spec `Status: implemented` and `git mv` it to `.ai/specs/implemented/` (preserve history); update cross-references.
- **Deploying work ends at the release gate, not at green tests:** walk `sailes-bootstrap/release-checklist.md` — env/secret parity, migration ordering vs deploy, the **post-deploy smoke** script run with output pasted, and a rollback plan written *before* the deploy. The human approves the prod step (unchanged) — but approval is of a completed checklist, not a vibe. First production launch also requires the Operations block in `repo-done-checklist.md` (restore tested, runbook filled).
- **Close estimates against actuals:** if the spec's phases carried internal estimates, record per-phase estimate-vs-actual + a one-line "why the delta" in the internal ledger (never in client-visible docs) — this is what lets the planned `sailes-wycena` pricing skill price the next project from history instead of gut feel.
- Push deferred follow-ups / tech debt discovered during build to `.ai/backlog.md` (don't lose them).
- Record any correction-worthy lesson in `.ai/lessons.md` (Context/Problem/Rule/Applies-to); check lessons for **promotion candidates** (recurring → preferably an enforced check, else AGENTS.md/Task Router rule). A defect that escaped the gates additionally gets its **gate autopsy** (`Escaped-defect:` entry — which gate missed it + what check that gate now gains).
- **Update `.ai/STATE.md` (write before walking away):** move what this run proved into Verified facts (with evidence), record unresolved problems in Open failures, set Last session. Do this **also when a session is interrupted mid-spec** — it's what makes the work resumable.
- Hand off per the repo's PR workflow (label `review`).

## Subagent strategy
- One task per subagent; offload parallel/independent steps and research to keep main context clean.
- Read-only recon (`Explore`/`explorer`) for mapping; implementation steps that touch the same files run sequentially (or in worktrees if truly parallel) to avoid conflicts.
- For non-trivial scope (3+ steps, BE+FE, an API contract, an architecture/data-model change, or anything touching auth/tenancy/security), run it as a **team**: the agent driving `sailes-implement` **acts as `team-lead`** (or delegates to the `team-lead` role if agent-teams mode is on) — there is exactly one lead, the human's single point of contact. Roles, order, gates, **agent lifecycle (spawn per task → release on integration, no idle agents)**, the **fallback when teams mode is off** (same roles as sequential subagents), and the run log are all defined in `sailes-bootstrap/agent-team-structure.md`. Workers never commit or push; the lead integrates and owns the gates (`checker` + `qa`).

## Quick Reference

| Stage | Gate |
|---|---|
| Pre-flight | spec approved + READY; STATE.md + lessons.md read; status→in-progress; run log if long; branch |
| Per step | RED test → implement → test → verify (evidence) → commit → track |
| Per phase | **Done-when passes** — exact commands run, output pasted |
| Review | adversarial fresh-context review vs spec + checklist (checker sees diff + rubric only) |
| Release (deploying work) | release-checklist walked; post-deploy **smoke** output pasted; rollback plan written pre-deploy; first prod launch → ops block (restore tested, runbook) |
| Done | status→implemented + git mv to implemented/; backlog + lessons + **STATE.md** + STATUS.md updated; estimate-vs-actuals closed |

## Red Flags — STOP

- You implemented without an approved, READY spec.
- A step left the app broken / has no test.
- You claimed "done" from build/lint alone — no real run/evidence (esp. UI/PDF/render: generate the artifact and look).
- You hit an unknown and guessed instead of re-gating the spec.
- Spec shipped but never moved to `implemented/`; backlog/lessons not updated.
- No adversarial review before marking done.
- You declared a phase complete without running its **Done-when** commands (or the phase never had one).
- A session ended — completed or interrupted — without updating `.ai/STATE.md`.
- The spec touches auth/roles and no authz-matrix tests were generated from its permission matrix.
- You deployed (or handed off a deploy) without the release checklist — no smoke output, no pre-written rollback plan.
- `qa` was blocked by missing stack/creds and you skipped the proof instead of reporting ENV-DEFECT.

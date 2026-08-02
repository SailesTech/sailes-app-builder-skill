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
3. For long/multi-step work (>~5 commits), open a **run log** `.ai/runs/{YYYY-MM-DD}-{slug}.md`: goal, phase list, decisions, what's left — so the work is resumable across context resets. **Its critical-path section carries two drawings, not one:** the graph of phases *and* the file-ownership matrix. An arrow in a phase graph records the order somebody thought about the phases in, not a technical dependency — measured 2026-08-01, a plan called a phase "solitary" twenty lines above its own table showing that phase's files were disjoint from the next one's, and it idled behind six others for nothing. Dispatch on set intersection, never on arrows (`agent-team-structure.md`, rule 2). The file-ownership matrix is a fenced ```yaml block, not prose, so it can be compared instead of read:
   ```yaml
   ownership:
     F1:
       - path/one
       - path/two
     F2:
       - path/three
   ```
   Run `node "${CLAUDE_PLUGIN_ROOT}/tools/ownership-check.js" .ai/runs/{YYYY-MM-DD}-{slug}.md` before dispatching phases in parallel — it exits 1 and names the path and both tasks the moment two phases' path sets stop being disjoint. `tools/` ships with the plugin, not the client repo's working tree — `${CLAUDE_PLUGIN_ROOT}` is how a hook already reaches it (`hooks/hooks.json`); an unqualified path into `tools/` only resolves from inside this framework repo itself. **If `CLAUDE_PLUGIN_ROOT` is unset** (a session running the pre-plugin `install.sh` path, which copies `skills/` only), the check has no script to reach — report that as a blocker ("ownership-check unavailable — plugin not active, verify the file-ownership matrix by hand") rather than let `node` die with `MODULE_NOT_FOUND`, which reads as a broken tool rather than a missing variable.
4. Branch off; never implement on the default branch.

## Implementation loop — per Phase, then per Step

For each **Phase** (story) in order, and each **Step** (testable task) within it:

1. **Plan the step** — restate what it changes and the check that will prove it. Identify the RED test first (write or name a failing test before the code — `superpowers:test-driven-development`). This RED test is **scaffolding for the step** — it may be implementation-shaped and it drives your increment. It is **not** the graded suite: that is authored later by `tester` (`sailes-test`), from the spec, with your implementation unread — so the graded tests cannot mirror the code. `tester` may supersede a scaffolding test only with an ID-bearing equivalent, never delete one to reach green.
2. **Implement** — minimal change that satisfies the step. Logic in services, validation at the boundary (Zod), thin controllers, no `any`. Honor the repo's `AGENTS.md` rules + Task Router guides for the area.
3. **Test** — unit for logic, integration for every affected API path, E2E for user-critical flows (per the spec's integration coverage). Self-contained tests; never fake a pass. **Auth/roles-touching phases: generate the authz-matrix suite from the spec's permission matrix** — every action × role → asserted allow/deny + the anonymous row (and, multi-tenant, the cross-org denial tests). The matrix table in the spec is the source; the tests are its executable form (`security-checklist.md`).
4. **Verify (behavior before diff)** — drive the real running system first (e2e flow / `curl` the live endpoint / click the UI / generate the actual PDF/screen), observe the real behavior, THEN trust it. Paste the evidence (command + output / screenshot). A green build/lint is not proof; "looks done" is the failure mode. **UI-touching steps get vision-verify:** compare the fresh screenshot against the design artifact and the previous accepted screenshot in `.ai/screens/` (canon: `sailes-bootstrap/agent-team-structure.md`, Gate isolation).
5. **Commit** — one focused commit per step (roughly 1:1 step↔commit), message references the spec. The app is working after every step.
6. **Track** — tick the step in the spec's **Progress** section (and the run log if used). New unknown surfaced → stop, resolve via `sailes-spec` (re-gate), don't guess. At each **phase** gate, also update the root `STATUS.md` (client-readable: phases done/total, the plain-language Done-when result, accepted screenshot for UI phases — never effort/pricing data).

**Phase gate (binary stop condition).** A phase is complete only when its **Done-when** condition from the spec passes — run the exact commands, paste the output. "Looks complete" is not a phase gate. If the spec has no binary Done-when for a phase, derive one and add it to the spec **before** starting that phase. A Done-when never overrides decision ownership: hitting a **key decision** mid-loop (contract shape, data model, auth, a new UX surface) means STOP and escalate per `agent-team-structure.md` — never push through it to satisfy the goal.

## Test → Review → Behavior gate (before "done")
- **Test authoring in a fresh context** — `tester` (`sailes-test`) derives the phase's expected behavior from the spec *with the implementation unread*, the human freezes the case list to `.ai/test-plans/<spec>.md`, then `tester` writes the suite and proves it detects at the feature's risk tier. This runs **per phase**, after the code and before `checker`. The RED test the dev named in step 1 is scaffolding for that step; the `tester` suite is the graded artifact, authored under isolation so it cannot mirror the code.
- **Adversarial review in a fresh context** — a reviewer subagent / `checker` reads the diff (incl. the tests) against the spec + the code-review checklist (correctness, contracts, security, scope creep) and confirms every frozen behavior ID has a covering test. (`sailes-bootstrap/agentic-first-principles.md` §C.)
- **Behavior proof** — `qa` runs the `tester` suite against the live app as the gate verdict, then drives the real flow. Address findings; re-verify. Don't mark done with open Critical findings.

## On completion
- **Docs-delta step — runs at EVERY spec closure, before the `git mv`** (`sailes-docs`,
  `references/delta-at-gate.md`): `docs-author` refreshes the diagrams the spec touched (each
  with its deliver receipt), then the lead runs `archify compare architecture` against the last
  committed state and shows the human the receipt. **An explicitly empty delta is evidence**
  ("spec zmienił zero elementów architektury"), not a skippable formality; the other four types
  are reviewed as git diffs of their canonical JSON. Client package regenerated in place.
  **This step is a second independent reading of the surface, not a receipt to collect.** Its value
  is not the diagram — it is that a role which has read nothing of the implementation narrative goes
  over the whole surface and compares it to the code. Measured 2026-08-01: it paid for itself twice
  in a single spec closure, finding a response field whose derivation had silently become wrong that
  afternoon — a defect no code review could see, because no line of it changed. Treat it as a gate
  with its own detection power; running it as paperwork is how that power gets thrown away while the
  receipt still looks identical.
  **The lead shows the receipt and STOPS — the `git mv` happens after the human has seen it, not
  in the same motion that produced it.** Missing receipt → the spec does not close; receipt
  produced but never shown → the spec does not close either (the second is the one that reads
  like success); archify missing on the machine → the explicit-SKIP protocol plus the human's
  stated acceptance of the recorded debt.
- All phases shipped + verified → set spec `Status: implemented` and `git mv` it to `.ai/specs/implemented/` (preserve history); update cross-references. **The status line carries pasted gate evidence, not an assertion:** `Status: implemented — evidence: <command> → <result> · checker: <verdict> · qa: <verdict>`. Measured 2026-07-30: a spec claimed "`qa` PASS 4/4" while `qa` was still running and then returned CHANGES-REQUIRED. You can write an assertion ahead of the fact; you cannot paste a verdict that does not exist yet — that gap is the whole mechanism, so filling it from expectation defeats the format entirely.
- **Deploying work ends at the release gate, not at green tests:** walk `sailes-bootstrap/release-checklist.md` — env/secret parity, migration ordering vs deploy, the **post-deploy smoke** script run with output pasted, and a rollback plan written *before* the deploy. The human approves the prod step (unchanged) — but approval is of a completed checklist, not a vibe. First production launch also requires the Operations block in `repo-done-checklist.md` (restore tested, runbook filled).
- **Close estimates against actuals:** if the spec's phases carried internal estimates, record per-phase estimate-vs-actual + a one-line "why the delta" in the internal ledger (never in client-visible docs) — this is what lets the planned `sailes-wycena` pricing skill price the next project from history instead of gut feel.
- **Delivered a CAPABILITY? Sweep the repo for comments that justified its absence** — before closing:
  ```bash
  grep -rn "DOES NOT EXIST\|NIE ISTNIEJE\|AT INTEGRATION\|PRZY INTEGRACJI\|TODO\|for now\|na razie" --include=*.ts --include=*.tsx src apps packages
  ```
  **Sweep the mirror-image class too — a comment claiming something IS enforced:**
  ```bash
  grep -rn "is enforced\|is validated\|is guaranteed\|always \|never \|jest wymuszan\|zawsze \|nigdy " --include=*.ts --include=*.tsx src apps packages
  ```
  The first pattern finds a comment saying a capability is missing after it arrived. This one finds
  the opposite and more dangerous shape: a comment describing behavior the code does not have.
  Measured 2026-08-01, twice in one day, and **both were correct when written**. One asserted that
  a requirement was globally enforced — an aspiration, not a description; `checker` found it and
  graded it a **defect, not a nit**, correctly, because *a comment that lies about behavior is worse
  than no comment: the reader has nothing to discount it with*, and the named failure mode was the
  next milestone's author trusting that line. The other computed a response field from a narrower
  source; **defensible in the morning** and **wrong in both directions by the afternoon**, because
  the mechanism it approximated had come into existence in between. Neither was findable by reading
  a diff — the diff does not touch those lines. Only a gate reading the whole surface on a clean
  context finds them, and it took **two different roles** to find these two, `checker` and the
  closing docs-delta, because they were looking from different sides.

  Every hit is a claim that was true when written and may not be now. Measured 2026-07-30: a comment
  read *"call the storage adapter AT INTEGRATION — `packages/files` DOES NOT EXIST"*; the package had
  existed for a week, `deleteObject` included, and the erasure path was leaving files in the bucket
  indefinitely. **One sweep on the day `packages/files` landed would have found it that day instead
  of a week later.** The sweep is cheap because it runs once per capability, not once per commit —
  and it is the only step that connects "the dependency arrived" to "the things waiting on it".
- Push deferred follow-ups / tech debt discovered during build to `.ai/backlog.md` (don't lose them). Where the debt is a wrong behavior you are deliberately keeping, the row's other half is an `it.fails` test linking back to it (`sailes-test/references/techniques.md`) — a marker that removes itself when the debt is paid.
- Record any correction-worthy lesson in `.ai/lessons.md` (Context/Problem/Rule/Applies-to); check lessons for **promotion candidates** (recurring → preferably an enforced check, else AGENTS.md/Task Router rule). A defect that escaped the gates additionally gets its **gate autopsy** (`Escaped-defect:` entry — which gate missed it + what check that gate now gains).
- **Update `.ai/STATE.md` (write before walking away):** move what this run proved into Verified facts (with evidence), record unresolved problems in Open failures, set Last session. Do this **also when a session is interrupted mid-spec** — it's what makes the work resumable.
- Hand off per the repo's PR workflow (label `review`).

## Subagent strategy
- One task per subagent; offload parallel/independent steps and research to keep main context clean.
- Read-only recon (`Explore`/`explorer`) for mapping. **Every subagent that WRITES is spawned with `isolation: worktree` — mandatory, and the test is "does it write", not "is it on a list".** Two processes writing one file on a shared disk do not produce a merge conflict, they produce silent loss. The worker commits in its own worktree (that commit is its declaration the work is finished) and you cherry-pick the branch from the shared `.git` — no push, no copying. Caveat that matters more than the rule: a worktree isolates **files**, never the **runtime environment** — the database, ports and containers are shared, which is why `qa` takes exclusivity instead (`agent-team-structure.md`, Isolation).
- For non-trivial scope (3+ steps, BE+FE, an API contract, an architecture/data-model change, or anything touching auth/tenancy/security), run it as a **team**: the agent driving `sailes-implement` **acts as `team-lead`** (or delegates to the `team-lead` role if agent-teams mode is on) — there is exactly one lead, the human's single point of contact. Roles, order, gates, **agent lifecycle (spawn per task → release on integration, no idle agents)**, the **fallback when teams mode is off** (same roles as sequential subagents), and the run log are all defined in `sailes-bootstrap/agent-team-structure.md`. Workers never commit to a shared branch and never push — in their own worktree they commit, and should; the lead integrates and owns the gates (`checker` + `qa`).

## Quick Reference

| Stage | Gate |
|---|---|
| Pre-flight | spec approved + READY; STATE.md + lessons.md read; status→in-progress; run log if long; branch |
| Per step | RED test → implement → test → verify (evidence) → commit → track |
| Per phase | **Done-when passes** — exact commands run, output pasted |
| Test (per phase) | `tester` (`sailes-test`): cases from spec with code unread → human freezes `.ai/test-plans/<spec>.md` → write suite → tiered detection proof |
| Review | adversarial fresh-context review vs spec + checklist (checker sees diff + rubric only; every frozen behavior ID covered) |
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

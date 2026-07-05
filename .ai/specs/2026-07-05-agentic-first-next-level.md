# Agentic-First Next Level — persisted evals, loop mode, parallel fan-out, scheduled compounding

Status: proposal
Date: 2026-07-05

> Dogfooding note: like the 2026-07-02 loop-engineering spec, this is a skills repo,
> not an app repo — Data Model / API & UI Surface / Jobs are N/A. Every phase carries
> a binary **Done-when**, per the framework's own Phase-2 rule.
>
> **This is a proposal, not an approved spec.** Per the framework's foundational
> principle (developer owns key decisions), the Open Questions below must be answered
> by Marcin before any phase is implemented. Phases are independent — approve any subset.

## TLDR & Context

The 2026-07-02 adoption closed the *memory* gaps (STATE.md, binary Done-when, gate
isolation, vision-verify, promotion rule). What's still missing is the **top layer of
the compound stack**: the framework accumulates lessons but has no persisted
evaluation loop, no autonomous loop harness for the binary gates it now requires, no
parallel-execution discipline, and no scheduled trigger that makes compounding happen
when nobody is at the keyboard. This spec proposes six additive phases — all edits to
existing files plus one new `evals/` directory — that take the framework from
"remembers" to "self-improves".

## Problem Statement

Six verified gaps (verified against the repo on 2026-07-05):

1. **The repo doesn't follow its own standard.** The framework prescribes
   `.ai/STATE.md`, `.ai/backlog.md`, `.ai/lessons.md` and a spec lifecycle
   (root → `implemented/` → `archived/`), but this repo has none of those files, and
   the 2026-07-02 spec sits in `.ai/specs/` root with `Status: in-progress` despite
   all six phases being checked complete. Deferred ideas ("scheduled/cloud routines —
   candidate for `.ai/backlog.md`") were deferred *into a file that doesn't exist*.
2. **Skill tests die with the chat.** `skills/README.md` declares TDD-for-skills
   ("no skill edit without a failing test first"), but the RED/GREEN scenarios live
   in project memory / conversation — nothing on disk, nothing re-runnable
   (`grep -rni "eval" skills/` → zero hits outside an OAuth false positive). A skill
   edit today cannot detect that it *regressed* a behavior a previous edit had fixed.
   This is the exact "lessons die in chat" failure the framework warns adopters about.
3. **Binary gates exist, but no loop runs them.** Every spec phase now carries a
   machine-checkable Done-when — yet `sailes-implement` still prescribes a single
   linear pass. When a Done-when fails, there is no defined loop shape
   (fix → re-run → repeat), no iteration cap, and no rule for what gets written to
   STATE.md when the loop stalls. The known failure mode: the agent "fixes" once,
   declares progress, and stops at good-enough. (The 2026-07-02 spec explicitly
   deferred loop harnesses as a non-goal; this phase closes it harness-free.)
4. **The pipeline is strictly sequential; worktrees appear only in a fallback
   sentence.** `agent-team-structure.md` orders roles
   (`explorer → designer → BE → fe-dev → checker → qa`) but never says when the lead
   may run workers **in parallel**, or that parallel *writing* workers require
   isolated worktrees. The one mention ("subagents that touch the same files run
   sequentially (or in worktrees)") is a parenthetical, not a rule. Independent
   slices of a big spec are serialized for no reason — or worse, parallelized
   unsafely by an adopter reading the canon literally.
5. **Model routing has assignments but no failure protocol.** The roles table pins
   models (opus lead, sonnet workers, haiku recon/graders) but nothing says what
   happens when a model **refuses or a safety classifier blocks** mid-task. A silent
   block looks like an ordinary error and burns debugging hours; the canonical
   pattern (surface the block explicitly, reroute to the fallback tier) is absent.
6. **Compounding only happens when a human opens a session.** The promotion rule
   defines the ladder (lesson → AGENTS.md/Task Router → global skill) and says
   "review candidates when closing a spec" — but nothing triggers a review if no
   spec closes. There is no scheduled maintenance shape (re-run evals/tests, harvest
   lessons, propose promotions, digest to the human) either for generated repos or
   for this framework repo itself.

## Proposed Solution

Six additive phases. Principles preserved throughout: the developer owns key
decisions (a loop never pushes through an escalation); no dependency on any specific
harness or tool version (everything works in plain Claude Code; `/goal`, Routines,
agent-teams remain optional accelerators); idempotent `.ai/` scaffolding; no new
skills; no benchmark/pricing claims in skill text.

## Non-Goals

- **No autonomy expansion.** Loop mode automates *re-checking a binary condition*,
  not decision-making. Escalation rules unchanged; key decisions still stop the loop.
- **No runtime/tooling dependency.** No phase may require `/goal`, Outcomes,
  Routines, CI, or the agent-teams flag to function. Harness-specific notes are
  clearly marked optional.
- **No eval framework/runner code.** `evals/` is markdown scenarios executed by a
  subagent on demand — not a test framework, no package.json scripts, no CI wiring
  (CI is a backlog candidate).
- **No new skills, no heavy templates.** The eval scenario template is ~5 fields;
  the routine template is a short block in existing files.
- **No retroactive rewriting of shipped history** — Phase 1 moves the implemented
  spec per lifecycle (`git mv`), it does not edit its content beyond the Status line.

## Phasing & Steps

### Phase 1 — Dogfooding: the framework repo follows its own standard

The cheapest credibility win: everything the skills prescribe for generated repos,
this repo does itself.

- Close the lifecycle on the 2026-07-02 spec: set `Status: implemented`,
  `git mv` to `.ai/specs/implemented/`.
- Add `.ai/STATE.md` (the 5-section template) seeded with current verified facts
  (e.g. install/sync model, the eval gap, the lifecycle catch from this spec).
- Add `.ai/backlog.md` (from `backlog-template.md`) seeded with the items already
  deferred in writing: scheduled/cloud routines, CI for evals.
- Add `.ai/lessons.md` (header per template).

**Done-when (binary):**
```bash
test -f .ai/specs/implemented/2026-07-02-loop-engineering-adoption.md && echo OK  # OK
grep -c "Status: implemented" .ai/specs/implemented/2026-07-02-loop-engineering-adoption.md  # 1
test -f .ai/STATE.md && test -f .ai/backlog.md && test -f .ai/lessons.md && echo OK  # OK
grep -c "## Verified facts" .ai/STATE.md  # 1
```

### Phase 2 — Persisted eval suite: `evals/` as the framework's regression memory

Turn TDD-for-skills from a chat-session discipline into an on-disk, re-runnable
asset. One scenario file per protected behavior (the invariants in
`skills/README.md` are the seed list), format:

```markdown
# Eval: <protected behavior, one line>
Skill under test:  <skill / file>
Setup:             <what to hand a fresh subagent — task prompt, no extra context>
Expected (binary): <grep-able assertion on the subagent's output or produced files>
Failure looks like:<the baseline behavior this eval was written against>
Last run:          <date · PASS/FAIL · one-line note>
```

- Create `evals/README.md` (how to run: dispatch each scenario to a **fresh
  subagent with clean context** — same gate-isolation logic as `checker`; the
  grader may be a cheap model since assertions are binary).
- Seed ≥ 5 scenarios from already-battle-tested baselines: spec-template produces
  per-phase Done-when; lead withholds worker narrative from `checker`; discovery
  chains into bootstrap on greenfield; `.ai/` scaffolding is idempotent;
  qa vision-verifies against `.ai/screens/` baseline.
- Wire the discipline into `skills/README.md` ("Working on the skills"): a skill
  edit re-runs the evals naming that skill; a new behavior gets a new eval **first**
  (RED), then the edit (GREEN); `Last run` is updated in the scenario file.
- Add promotion symmetry: when a lesson is promoted into a skill, add the eval that
  would catch its regression.

**Done-when (binary):**
```bash
ls evals/*.md | wc -l                       # ≥ 6 (README + 5 scenarios)
grep -c "Expected (binary)" evals/*.md | grep -vc ":0"  # ≥ 5
grep -ci "evals/" skills/README.md          # ≥ 1
```
GREEN subagent test: a fresh agent asked to "safely edit skill X" consults `evals/`
and re-runs the matching scenarios (baseline today: nothing on disk to consult).

### Phase 3 — Loop mode: opt-in loop-until-Done-when in `sailes-implement`

The deferred non-goal of 2026-07-02, closed harness-free. A phase whose Done-when
is binary may be run as an explicit loop:

```
implement → run Done-when commands → PASS → phase gate as today
                                   → FAIL → diagnose, fix, re-run
```

Hard rails (all mandatory, added to `sailes-implement/SKILL.md`):

- **Iteration cap:** default 5 attempts; on cap → STOP, write the failure +
  best diagnosis to `.ai/STATE.md` → *Open failures*, escalate to the human.
  Never silently keep looping.
- **Key-decision stop is absolute** (already canon — restated in loop terms): if an
  iteration reveals a contract/data-model/auth/UX choice, the loop stops *even if
  one more iteration would pass the Done-when*.
- **Run-log per iteration:** one line each (attempt N: what changed, Done-when
  result) so a context reset resumes mid-loop.
- **No goal-gaming:** the loop may fix the code, never weaken the Done-when; a
  Done-when that proves wrong is escalated, not edited mid-loop.
- Optional-accelerator note: in harnesses with a goal primitive (e.g. `/goal`), the
  Done-when commands are the goal condition verbatim — same rails apply.

**Done-when (binary):**
```bash
grep -ci "loop mode" skills/sailes-implement/SKILL.md        # ≥ 1
grep -ci "iteration cap\|max.*iterations\|attempts" skills/sailes-implement/SKILL.md  # ≥ 1
grep -c "Open failures" skills/sailes-implement/SKILL.md     # ≥ 1
```
GREEN subagent test: an agent given a phase with a failing Done-when loops with
logged attempts and stops at the cap with a STATE.md entry (baseline: single fix
attempt, then qualitative "made progress" report).

### Phase 4 — Parallel fan-out + worktree discipline in the team canon

`agent-team-structure.md` gets a "Parallel execution" subsection:

- **Read fan-out is free:** multiple read-only `explorer`s may always run in
  parallel (fan-out-and-synthesize: each maps one area, lead synthesizes).
- **Write fan-out requires all three:** (a) slices are file-disjoint, (b) the
  shared contract is frozen first, (c) **each writing worker gets its own
  worktree** — no exceptions; the lead merges (integration stays the lead's job,
  merge conflicts are a lead task, never a worker task).
- **Verifier isolation extends to worktrees:** `checker`/`qa` review from a clean
  checkout of the integrated result, never from inside a maker's worktree.
- Pipeline diagram annotated with which stages may fan out (explorer; be-dev+fe-dev
  only post-freeze on disjoint files) and which are barriers (contract freeze,
  checker, qa).
- Mirror one paragraph in `sailes-implement/SKILL.md` (phases whose steps are
  independent may fan out under the same rules).

**Done-when (binary):**
```bash
grep -ci "worktree" skills/sailes-bootstrap/agent-team-structure.md  # ≥ 3
grep -ci "parallel" skills/sailes-bootstrap/agent-team-structure.md  # ≥ 3
grep -ci "worktree" skills/sailes-implement/SKILL.md                 # ≥ 1
```

### Phase 5 — Routing failure protocol: blocked-model fallback is explicit

Small, surgical addition to `agent-team-structure.md` (roles/escalation area):

- A worker whose model **refuses or is blocked by a safety classifier** reports
  `BLOCKED-BY-POLICY` with the verbatim refusal — it never retries silently,
  reworder-loops the prompt, or reports a generic failure. (A silent block is
  indistinguishable from a bug and wastes debugging hours.)
- The lead reroutes: escalate the subtask to the stronger tier (sonnet→opus) once;
  still blocked → escalate to the human with the refusal text. Policy blocks are
  never "worked around" — surfaced and decided by a human.
- One-line rationale note on the existing model column: strongest tier plans and
  integrates; mid tier implements; cheap tier does read-only recon and binary
  grading — pin the *cheapest model that passes the gate*, not the best available.

**Done-when (binary):**
```bash
grep -c "BLOCKED-BY-POLICY" skills/sailes-bootstrap/agent-team-structure.md  # ≥ 1
grep -ci "fallback\|reroute" skills/sailes-bootstrap/agent-team-structure.md # ≥ 1
```

### Phase 6 — Scheduled compounding: the maintenance routine shape

Compounding must not depend on a human opening a session. Added as *templates and
backlog entries*, not runtime dependencies:

- `agents-md-template.md`: optional **"Maintenance routine"** block for generated
  repos — a periodic (scheduled or "first session of the week") pass that:
  re-runs the test suite + any repo evals; reads `.ai/lessons.md` for
  promotion candidates per the promotion rule; checks specs vs lifecycle
  (implemented-but-not-moved — exactly the Phase-1 catch); updates STATE.md;
  ends with a short digest **to the human** (proposals, never auto-applied —
  promotions stay human-approved).
- `backlog-template.md`: seed row for "wire the maintenance routine to a
  scheduler (cloud routine / cron / CI)" as an explicit later step.
- This repo's `.ai/backlog.md` (from Phase 1): framework-level routine —
  periodically harvest `lessons.md` across Sailes project repos → global-skill
  candidates (the cross-project rung of the promotion ladder).

**Done-when (binary):**
```bash
grep -ci "maintenance routine" skills/sailes-bootstrap/agents-md-template.md  # ≥ 1
grep -ci "routine" skills/sailes-bootstrap/backlog-template.md               # ≥ 1
grep -ci "harvest" .ai/backlog.md                                            # ≥ 1
```

## Open Questions (gate — answer before implementation)

1. **Scope:** all six phases, or a subset? (Recommended minimum: 1+2 — dogfooding
   and evals are the foundation the rest builds on; 3–6 are independent add-ons.)
2. **Eval granularity (Phase 2):** one scenario per *invariant* (recommended; maps
   to `skills/README.md` §invariants) or per *skill*?
3. **Loop mode default (Phase 3):** opt-in per phase (recommended — the human marks
   a phase loopable in the spec) or default-on for every phase with a Done-when?
4. **Iteration cap (Phase 3):** is 5 the right default?
5. **Parallel write fan-out (Phase 4):** allowed for `be-dev`+`fe-dev` pairs only
   (recommended, conservative), or any file-disjoint worker set?
6. **Routine digest channel (Phase 6):** where does the digest land —
   STATE.md `Last session` only, or also an external channel (Slack/email)?
   (External channels add a dependency; recommended: STATE.md only for now.)

## Security

N/A at runtime (docs-only changes to skill files). Process note: Phase 5 makes
policy blocks *more* visible, never bypassed — refusals terminate in a human
decision by construction.

## Integration Coverage

- **RED baselines before each phase's edits** (TDD-for-skills, unchanged): Phase 2 —
  a subagent asked to safely edit a skill has nothing on disk to consult; Phase 3 —
  an agent with a failing Done-when stops after one fix attempt; Phase 4 — the canon
  gives no literal parallel/worktree rule; Phase 5 — no defined behavior on a policy
  block. Record each baseline in the run log before editing.
- **GREEN re-tests** after edits: the same scenarios must flip; the Phase 2 eval
  files then *become* the persisted form of these tests.
- All Done-when blocks above run with output pasted before the PR is opened.
- After merge: `./install.sh --force` to sync `~/.claude/skills/`.

## Progress

- [ ] Phase 1 — Dogfooding (lifecycle close, STATE.md, backlog.md, lessons.md)
- [ ] Phase 2 — Persisted eval suite (`evals/`)
- [ ] Phase 3 — Loop mode in sailes-implement
- [ ] Phase 4 — Parallel fan-out + worktree discipline
- [ ] Phase 5 — Routing failure protocol (BLOCKED-BY-POLICY)
- [ ] Phase 6 — Scheduled compounding (maintenance routine)

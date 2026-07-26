# Spec: measurement, model routing, and sub-teams — the Claude-5 re-fit

Status: approved
Date: 2026-07-26
Decisions answered by the human: 2026-07-26 (D1–D4 below; D5–D6 resolved with stated assumptions)
Supersedes: —
Related: `.ai/lessons.md` 2026-07-25 (context engineering), `.ai/backlog.md` (eval staleness, release hygiene), `.ai/STATE.md` Open failures

## TLDR & Context

Three capabilities the human asked for on 2026-07-26, in one spec because they are one dependency
chain, not three features:

1. **Measurement** — a harness that says whether a framework change made things *better*, not just
   whether the suite is green.
2. **Model routing** — the framework decides per task whether a unit runs on Opus 5 or Sonnet 5,
   instead of the model being welded into each role file.
3. **Sub-teams ("commando swarm")** — the lead splits a large task across ~3 teams, each with its own
   Opus 5 sub-lead that may spawn its own workers.

They are ordered by dependency: **(2) and (3) are bets, and (1) is the instrument that prices them.**
Shipping a routing rule or a swarm mode without measurement repeats the exact shape recorded six
times in `.ai/lessons.md` — a step that reports success for a reason other than the one claimed.
This repo has already written that rule down for the analogous case (2026-07-25: *"Eval debt is a
prerequisite to cutting, not parallel work"*); it applies unchanged to adding.

The trigger is Anthropic's **"The new rules of context engineering for Claude 5 generation models"**
(>80% of Claude Code's system prompt removed, no measurable loss on coding evals) plus the Claude
Opus 5 behavioral guidance. Both date our assumptions rather than refuting them — and the Opus 5
guidance **argues against goal 3 in its default form**, which is the single most important finding in
this spec (§4.2).

---

## Decisions — gate CLEARED 2026-07-26

> The Open Questions block below was answered by the human on 2026-07-26. Answers first, then the
> original questions kept as the record of what was actually asked.

| # | Decision | Chosen |
|---|---|---|
| **D1** | Ordering | **Harness first, thin** — build only enough to A/B one definition change, then grade D2/D3 with it |
| **D2** | Routing shape | **Role default + explicit escalation**, reason recorded in the run log |
| **D3** | Swarm trigger | **Human-triggered only** — the lead never opens a swarm on its own initiative |
| **D4** | Effort & model IDs | **`effort:` per role + pinned model IDs** (`claude-opus-5` / `claude-sonnet-5`), not aliases |
| **D5** | Gates top-level only | **Assumed yes**, and it turned out to be *already enforced by configuration*: all seven non-lead roles carry an explicit `tools:` list and none includes `Agent`, so enabling nesting cannot make a gate or a worker spawn. Only `team-lead` inherits the full tool pool. Reversible by editing one `tools:` line. |
| **D6** | Where the depth env var lives | **Assumed (a): document it, the human sets it.** Not auto-written: raising spawn depth changes agent behavior for every repo on the machine, and `main` auto-deploys. `sailes-bootstrap` writing it into client repos stays open for a later decision. |

### Original questions (record)

**Q1 — Ordering.** Measurement first, or all three in parallel?
- (a) **Harness first, thin** — build only enough to A/B a definition change, then use it to grade
  goals 2 and 3. *(recommended: it is the cheapest, and it is the only path where 2 and 3 produce a
  verdict rather than an impression)*
- (b) All three in parallel, accept that 2 and 3 ship unmeasured.
- (c) Harness first, full — including staleness detection and the `Files:` format migration
  (already its own backlog item, larger than "thin").

**Q2 — Shape of the routing decision.**
- (a) **Static per-role, as today** — `model:` stays in frontmatter, we only re-price which tier each
  role gets.
- (b) **Static default + explicit escalation** — role frontmatter is the default; the lead may
  override per task via the Agent tool's per-invocation `model`/`effort`, and must record the reason
  in the run log. *(recommended: uses an existing mechanism, adds no hop, and is auditable — the same
  shape as the existing "delegating solo is a choice you owe a reason for" rule)*
- (c) **Dynamic classifier** — a routing step scores each task. Adds a hop and needs its own eval.

**Q3 — Effort as a first-class lever, and alias vs pinned model IDs.**
Frontmatter supports `effort: low|medium|high|xhigh|max` (verified, §Verified facts). Anthropic's
Opus 5 guidance is that `low`/`medium` are unusually strong on this model and that effort — not tier
— is the primary cost lever.
- (a) Introduce `effort:` per role now, alongside the tier.
- (b) Tier only; leave effort at session default.
- Separately: keep aliases (`opus`, `sonnet`) which auto-upgrade, or pin IDs (`claude-opus-5`) which
  are reproducible? *This repo already learned the pinning lesson on the Codex side* (`team-lead.md:54`:
  an unpinned brief "silently runs on whatever the global default became since, and the run stops
  being reproducible"). The same argument applies here; the counter-argument is that an alias picks up
  the next model without a release.

**Q4 — Is the swarm a default or a human-triggered mode?**
- (a) **Human-triggered only**, like cross-runtime Codex delegation (`agent-team-structure.md:128`:
  "a lead never routes work to another runtime on its own initiative"). *(recommended — see §4.2:
  Anthropic's own Opus 5 guidance is that this model over-delegates and needs a cap, not an invitation)*
- (b) Automatic above a size threshold — and if so, **what threshold**, stated in units the lead can
  actually evaluate before starting?

**Q5 — Do the gates stay top-level?** Proposal: `tester`, `checker`, `qa` may be spawned **only by the
top-level lead**, never by a sub-lead (§4.3). Confirm or reject — this is the invariant that decides
whether depth 2 is safe here.

**Q6 — Where does `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` live?** It is a user/project `settings.json`
env var, not something a plugin agent file can carry. Options: (a) document it, human sets it;
(b) `sailes-bootstrap` writes it into a client repo's `.claude/settings.json`; (c) both. Note the
blast radius: raising spawn depth changes agent behavior for **every** repo on that machine.

---

## Verified facts (evidence, gathered 2026-07-26)

Facts, not plans. Everything here was read from the docs or the repo today.

**Claude Code version on this machine: 2.1.220** (evidence: bundled-skills path `…/2.1.220/…`). This
matters — several of the limits below changed across recent versions.

- **Subagent frontmatter supports `model` and `effort`.** `model`: `sonnet` | `opus` | `haiku` |
  `fable` | a full ID (e.g. `claude-opus-5`) | `inherit`; **default is `inherit`**. `effort`:
  `low` | `medium` | `high` | `xhigh` | `max`, overriding the session level.
  Full field set also includes `tools`, `disallowedTools`, `permissionMode`, `mcpServers`, `hooks`,
  `maxTurns`, `skills`, `initialPrompt`, `memory`, `background`, `isolation`, `color`.
- **Model resolution order:** `CLAUDE_CODE_SUBAGENT_MODEL` env → per-invocation `model` parameter →
  the definition's `model` frontmatter. This is what makes Q2(b) buildable with no new machinery.
- **Plugin subagents cannot carry `hooks`, `mcpServers`, or `permissionMode`** — those fields are
  ignored when loaded from a plugin. We ship as a plugin, so any design depending on them is dead
  on arrival.
- **Nested spawning is OFF by default on 2.1.220** and is enabled only by setting
  `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` to the number of layers. While off, Claude Code **withholds
  the `Agent` tool from every subagent** (a fork excepted, where it stays listed but errors).
  *Caveat that would otherwise mislead a reader of older notes:* from v2.1.172 through v2.1.216
  subagents nested **by default**, up to five layers, and the limit could not be changed. So "it
  worked before without config" is a true memory about a version we are no longer on.
- **A subagent spawns only if `Agent` is in its `tools`.** To keep a role flat while nesting is on,
  omit `Agent` or list it in `disallowedTools`. The `Agent(type)` allowlist syntax applies only to a
  main-thread agent (`claude --agent`); **inside a subagent definition the parenthesised type list is
  ignored** — so a sub-lead cannot be restricted to spawning only `be-dev`/`fe-dev` by that syntax.
  (Direct consequence for Q5: the restriction has to be prose + eval, not configuration.)
- **Three separate caps:** total **200 subagents per session** (`CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION`,
  2.1.212+), **20 concurrent** (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`, 2.1.217+; ultracode sessions
  exempt), and the depth cap above. Agent-team teammates follow their own limits instead.
- **Background subagents lose most built-in tools.** Background is the default; a background subagent
  keeps only `Read, Grep, Glob, Bash, PowerShell, Edit, Write, NotebookEdit, WebFetch, WebSearch,
  TodoWrite, Skill, ToolSearch, EnterWorktree, ExitWorktree, Monitor, TaskStop, SendMessage, Artifact`
  plus MCP tools. `Agent` follows the nesting condition in either mode.
- **Subagents inherit the session's extended-thinking setting** (2.1.198+); there is no per-subagent
  thinking switch. Before 2.1.198 they ran with thinking disabled regardless.
- **The built-in `Explore` agent no longer runs on Haiku** (2.1.198+): it inherits the main
  conversation's model, capped at Opus on the Claude API. Our `explorer` role is pinned `haiku`, so
  it is now a deliberate divergence from the platform default rather than a match to it.

**Anthropic guidance, as published (not this repo's opinion):**
- Context engineering, five shifts: rules → judgment; examples → tool/interface design; upfront load →
  progressive disclosure; repetition → a single description; manual memory → auto-memory. Evidence
  offered is >80% of Claude Code's system prompt removed with no measurable loss on coding evals.
- Claude Opus 5 **delegates more readily than Opus 4.8** — the reverse of the previous model, whose
  documented failure was *under*-reaching for subagents. The recommended remedy block is explicit:
  delegate rarely; **do not use subagents for review, verification, or double-checking**
  ("verification belongs in your main agent loop"); keep spawn counts low; prefer one subagent over
  several; never more than 20 parallel unless the user explicitly requests it; commit to a delegation
  rather than re-deriving its findings.
- Claude Opus 5 also: verifies its own work unprompted (so instructions telling it to verify now cause
  **over**-verification, and the fix is to *delete* them, not reword them); writes longer responses and
  longer files; can expand task scope. Effort `low`/`medium` are unusually strong.

---

## §4 — Design sketch (the 2–3 key sections; the rest waits on the gate)

### 4.1 Goal 1 — the measurement harness

What exists: 27 markdown scenarios in `evals/`, dispatched by hand to fresh subagents, graded binary,
with a hand-edited `Last run:` line. What is missing is not "a test runner" — it is the ability to
answer *did this change help?*

Four capabilities, in dependency order:

1. **Provenance.** An eval run records the git ref of the files under test. Without it a `Last run:`
   line cannot distinguish a green result from a stale one — measured 2026-07-25: **9 of 27 evals**
   name a file that changed after their last run. Blocked on a machine-readable `Files:` line, which
   9 evals lack; that migration is already its own backlog item.
2. **A/B, not pass/fail.** "Effectiveness" is a comparison. The unit is: same scenario, same fixture,
   two refs (before/after the definition change), fresh subagent each arm. The repo has done this once
   informally and it worked — the 1.10.1 `tester` lane fix, where *"before/after behavior change is the
   proof the guard lands."* This formalises that one-off.
3. **Honest noise handling.** These are model-graded behavioral scenarios; a single run is a sample,
   not a measurement. The harness must either run N arms or label a single run as such. **The recorded
   failure this guards against is not hypothetical:** the `prompt-anchor` eval passed both arms
   identically and was still INCONCLUSIVE, because the fixture never created the condition under test.
   So a harness assertion is also required: *does the fixture create the condition?* — the existing
   both-directions rule (`.ai/STATE.md` General rules) extended from instruments to fixtures.
4. **Cost, not just correctness.** If the Claude-5 thesis is that most prose can go, the win is tokens
   and competing instructions — invisible to a pass/fail eval. Measure it: `messages.count_tokens`
   against the current model over `skills/**/*.md` (today: **656 KB** total; `sailes-discovery/SKILL.md`
   alone is 21 KB / 3 293 words). A deletion that keeps every eval green **and** cuts loaded context is
   the only shape that proves the thesis here.

**Non-goal for this phase:** CI. Manual dispatch stays; automation is a later phase (it is already in
`backlog.md`, parked).

### 4.2 Goal 3 — sub-teams, and the finding that should change the design

**The framework's instinct and Anthropic's Opus 5 guidance point in opposite directions, and the
conflict is real rather than a wording difference.** This framework's core rule is *delegation is the
default* — written against Opus 4.x, whose measured failure was a lead that bulk-coded solo. Opus 5
inverts that failure: it over-delegates, and Anthropic's remedy block explicitly caps spawn counts and
forbids verification subagents.

Read literally, that guidance says: do not build a swarm; and delete the `checker`/`qa` gates.

It should **not** be applied literally here, and the reason is the distinction this repo wrote down on
2026-07-25 — **policy is not capability**:

- The *cost* argument for delegating (an expensive tier shouldn't type implementations) **is** a
  capability argument, and it is the one Anthropic's guidance re-prices. It weakens.
- The *isolation* argument for the gates (`agent-team-structure.md` §Gate isolation: a verifier grades
  honestly only on a clean context; a reviewer who reads the maker's narrative inherits the maker's
  confidence) is **not** a capability argument. A more capable model that reads the maker's story still
  inherits the story. It does not weaken.

So the gates stay, and the swarm becomes a **capped, explicitly-triggered mode** rather than a default
(Q4). Concretely, what the sketch proposes:

- Depth 2 maximum. One top-level lead → up to 3 sub-leads → their workers.
- **The top-level lead remains the sole point of contact for the human.** Sub-leads escalate to the
  lead; the lead escalates to the human. The spine (`SPEC → HUMAN → VERIFIED → GATED`) is untouched —
  it encodes authority, not capability, and is out of scope for any Claude-5 simplification.
- **Team-level file disjointness.** Today's rule is per-worker; at depth 2 it must hold at the team
  boundary — each team owns a disjoint file set, or runs in a worktree (`isolation: worktree` is a
  supported frontmatter field).
- **Fan-out multiplies the two failure modes this repo already measured, and both already have their
  fix shipped in 1.15.0** — which is why the swarm is buildable at all rather than reckless:
  *silent returns* (four of six workers went idle having finished, the channel dropped the report) are
  prevented by the FILE deliverable rule; *release leaks* (three of five shutdown requests needed a
  second attempt) by the confirm-the-release rule. At depth 2 a sub-lead must release its own workers
  **and** be released — the orphan surface is the product, not the sum.

### 4.3 Goal 2 — routing, and where it meets goal 3

The current table is static and **restated in three places** (`agents/README.md:16-22`,
`agent-team-structure.md:29-37`, `agentic-first-principles.md:91`) — itself an instance of the
repetition the article's shift #4 names.

The sketch (pending Q2/Q3): role frontmatter carries the default tier; the lead may escalate a single
task via the per-invocation `model`/`effort` parameters, and owes the run log a reason — the same
accountability shape the framework already applies to "I'll write this one myself". Escalation triggers
worth testing, drawn from surfaces this repo already treats as high-stakes: a contract/data-model/auth
change, a migration judge (`sailes-migrate`'s parity gate), a diagnosis with no reproducible mechanism.
Downgrade triggers already exist in doctrine: a binary `Done-when` read "may be verified by a
lightweight model — it's a pass/fail read, not judgment."

Sub-leads (goal 3) are the routing system's first real consumer: a sub-lead is by definition an
escalated worker.

---

## Non-goals

- CI automation of `evals/` (parked in `backlog.md`).
- The gotcha-vs-inferable prose audit of `agents/*.md` — blocked on measurement, deliberately, and
  already filed.
- Touching the spine, or any `codex-agents/*.toml` cut: those run on non-Claude models for which the
  prose is the only backstop. **Every cut is per-harness, never global.**
- Auto-memory (shift #5): the framework's `.ai/` memory is deliberate and human-readable; adopting
  automatic memory is a separate decision.

## Risks

- **`main` is production.** Every file here auto-deploys to every machine that ran `enable-plugin.sh`.
  All three capabilities stay on a branch until their eval returns a verdict.
- **Measuring with a broken instrument.** 9/27 evals are stale and 1.15.0 shipped without re-running
  three evals naming the files it edited. Building goals 2 and 3 on that base is the recorded
  silent-failure shape — which is exactly what Q1 asks about.
- **Version drift.** The nesting facts above are true for 2.1.220 and have changed twice in recent
  releases. Any doc we write must date the claim.

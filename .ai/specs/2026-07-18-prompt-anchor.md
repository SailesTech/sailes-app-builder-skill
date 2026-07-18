# Prompt Anchor — keep the mandate alive deep into a session

Status: blocked
Date: 2026-07-18

> Open Questions answered and spec approved 2026-07-18. Work runs on `enforce/base`;
> `main` is production (see **Deployment channel**).
>
> Progress: Phases 1-2 ✅ merged to main (1.9.0) · Phases 3-4 ✅ on `enforce/*`, NOT merged ·
> Phase 5 ❌ INCONCLUSIVE 2026-07-18 → D3 triggered, decision re-opened. The hook does not ship.

## TLDR & Context

Every enforcement mechanism this framework owns fires at a **session boundary**
(`SessionStart` × `startup|resume|clear|compact`), at plugin install, or on explicit
invocation. None fires on the event that actually precedes a violation: **the human
typing a new request in turn 47.**

This spec adds a `UserPromptSubmit` hook that injects a short anchor — the hard-rule
spine plus the current route — under a suppression policy, so the mandate does not decay
with distance from injection. It is **soft enforcement only**: injection, never blocking.

## Problem Statement

Verified against the repo on 2026-07-18:

1. **The four HARD RULES have zero enforcement points.** `hooks/workflow-router.js:133-138`
   injects them once as text; after that all four are honor-system. Only *done means
   verified* has even a partial mechanism (`agents/qa.md`), and only if the lead chooses
   to spawn it.
2. **The decay is already measured.** `evals/session-start-routes-from-repo-state.md:22-29`
   records that a hostile brief ("bez ceregieli") fails to route on skill-description
   matching alone, while a softer brief succeeds. The mandate holds at turn 1; nothing
   re-asserts it at turn 60.
3. **The framework fails its own check.** Both 2026-07-05 specs are `Status: implemented`
   but were never `git mv`'d to `implemented/`, and `.ai/STATE.md:12` still reads "1.1.0"
   against `VERSION` 1.8.0 — the exact drift `workflow-router.js:169-174` exists to flag,
   in the one repo whose author knows the rules best. Evidence for the thesis, not an aside.

### Constraints inherited (not up for renegotiation here)

- **Inject, never block.** `CHANGELOG.md:106-109` considered and rejected a blocking
  `PreToolUse` gate: *"it would take the wheel away from the human, which is the one
  thing the standard exists to prevent."* `exit 2` and `decision: block` are forbidden,
  and that is a test (Phase 3).
- **Context is the expensive kind.** `hooks/framework-version-check.js:13-15`: *"Silence
  is the default."* A per-turn hook pays per **turn** — the suppression policy is the
  whole point, not a refinement.

### Verified technical contract

`UserPromptSubmit` (confirmed against Claude Code hooks documentation, 2026-07-18):
`session_id`, `cwd`, `prompt`, `transcript_path`, `prompt_id`, `permission_mode` on stdin;
context injected via `hookSpecificOutput.additionalContext` with
`hookEventName: "UserPromptSubmit"`; **no `matcher` support** — fires on every prompt, so
all suppression logic lives in the hook; only `exit 2` blocks, every other failure mode
degrades to pass-through; 30 s timeout (not 600 s); does not fire mid-turn.

## Decisions (answers to the Open Questions gate)

- **D1 — Ships globally**, like the existing hooks. Blast radius is every repo with
  `AGENTS.md` or `.ai/` on the machine; no opt-in marker. Consequence accepted: the
  silence-by-default policy is what keeps this tolerable, so a regression that makes it
  chatty is a machine-wide regression.
- **D2 — Success criterion, fixed before results:** a variant wins only if it flips the
  recorded hostile-brief RED baseline (`evals/session-start-routes-from-repo-state.md:22-25`)
  to green at simulated depth, **and** the control arm (`enforce/always`) does not match
  it at lower context cost.
- **D3 — Deferred, with the risk named.** If a credible depth eval proves infeasible we
  will decide then. **Accepted risk:** shipping on doctrine and judgment alone is the
  "claim you never measured" failure mode this framework's own `sailes-async` red flags
  warn about. Tolerable here only because the hook is soft and reversible.
  **Trigger:** if Phase 5 cannot separate the arms, STOP and re-open this decision
  explicitly — do not quietly ship the recommended arm.
- **D4 — N = 10**, as a constant with an env override (`SAILES_ANCHOR_EVERY`) so it can be
  tuned without a code change. 10 is a starting point to measure, not a finding.
- **D5 — Canonical spine: `SPEC → HUMAN → VERIFIED → GATED`**, used **verbatim** in
  `workflow-router.js`, `agents-md-template.md`, and the hook. Today the router mandate
  and the generated AGENTS.md say overlapping things in different words, so they compete
  instead of compounding.

## Proposed Solution

A `UserPromptSubmit` hook that runs on every prompt and, in the overwhelming majority of
turns, exits silently. When it does emit, it emits ~40–60 tokens: the spine plus the
current route derived from disk.

Three emission policies are compared on branches against a **shared**
`hooks/lib/repo-state.js`, so the branches differ **only** in policy:

| Branch | Policy | Role |
|---|---|---|
| `enforce/always` | emit every turn | control — ceiling on effect, full cost, tests the decay assumption |
| `enforce/state-only` | emit when disk state changed since last emission | tests whether an information-carrying signal suffices |
| `enforce/hybrid` | state changed **OR** N turns since last emission | recommended — floor against a long session with a static disk |

Per-session state (turn counter + last-emitted state fingerprint) is keyed by `session_id`
and written to the OS temp dir — **never into a working tree**, where it would surface in
`git status`.

**Rejected alternative, deliberately:** suppression by heuristic on the `prompt` field.
The field *is* available, so this is a choice, not an oversight — a content heuristic
would misfire in both directions and adds a second variable to a three-arm experiment.
Revisit only if all three arms fail.

## Deployment channel — why nothing lands on `main` until Phase 5

Verified 2026-07-18: the live plugin does **not** run from this working directory. It runs
from `~/.claude/plugins/cache/sailes/sailes-app-builder/1.8.0`, sourced from a clone at
`~/.claude/plugins/marketplaces/sailes` that tracks **`main`** with `autoUpdate: true`
(`known_marketplaces.json`). It self-updated to `9998c62` — this repo's `main` HEAD — on
2026-07-18 at 11:53 with no user action.

Therefore:
- **Local edits have zero blast radius.** Nothing in this working tree reaches a session.
- **A push to `main` IS the deployment**, automatic, to this machine and every other where
  `enable-plugin.sh` was run. Combined with D1 (ships globally), `main` is production.
- **Branches are the isolation** — the clone pulls `main` only, so pushing a branch is safe.

**All five phases run on `enforce/base` and its children. `main` is touched exactly once:
the merge after Phase 5 returns a verdict.**

## Phasing & Steps

### Phase 1 — Extract the shared state module (on `enforce/base`, before any variant branching)

`readStdin`/`read`/`exists`/`findRepoRoot` are duplicated verbatim across
`workflow-router.js:40-75` and `framework-version-check.js:23-57`. A third hook would
triplicate them, and branches that differ in infrastructure cannot be compared.

Steps: create `hooks/lib/repo-state.js` exporting the four helpers plus `activeSpecs` and
`openIncidents`; rewire both existing hooks to import it; no behavior change.

**Done-when:** `npm test` → 0 failures (the 20 existing router assertions pass unchanged),
**and** `git diff --stat` shows both hooks net-smaller, **and** a manual session start in
this repo still prints the routing mandate.

### Phase 2 — Canonical spine

Steps: replace the four prose HARD RULES in `hooks/workflow-router.js:133-138` with the
spine plus the existing prose (spine first, prose as expansion); add the identical spine to
`skills/sailes-bootstrap/agents-md-template.md`.

**Done-when:** `grep -c "SPEC → HUMAN → VERIFIED → GATED" hooks/workflow-router.js
skills/sailes-bootstrap/agents-md-template.md` → `1` in each, byte-identical string;
`npm test` → 0 failures (router test asserts the rules are present).

### Phase 3 — The hook + its safety invariants (on `enforce/base`, policy pluggable)

Steps: `hooks/prompt-anchor.js` reading stdin per the verified contract, emitting
`hookSpecificOutput.additionalContext`; policy behind a single function so branches swap
one implementation; register `UserPromptSubmit` in `hooks/hooks.json` (no `matcher`,
`timeout: 5`); `hooks/prompt-anchor.test.js` copying the no-framework idiom of
`workflow-router.test.js`.

**Done-when:** `node hooks/prompt-anchor.test.js` → 0 failures, with these assertions
passing explicitly:
- never exits 2 and never emits `decision`, under **every** input including malformed JSON,
  empty stdin, and a missing repo — the inherited "never block" constraint;
- silent (empty stdout, exit 0) in a repo with neither `AGENTS.md` nor `.ai/`;
- emitted payload is ≤ 80 tokens' worth (assert byte length as proxy);
- writes nothing inside the repo under test (assert `git status --porcelain` stays empty).

### Phase 4 — Three branches, one variable

Steps: branch from the Phase 3 commit on `enforce/base`; each branch implements only the
policy function.

**Done-when:** for each branch, `npm test` → 0 failures **and**
`git diff main --stat` touches exactly one file (`hooks/prompt-anchor.js`).

### Phase 5 — Depth eval and the decision

Steps: extend `evals/` with a depth eval per D2, modelled on the control/treatment design
of `session-start-routes-from-repo-state.md`; run all three arms plus the no-hook control.

**How the arms are made live without touching the plugin.** Unit tests drive the hook via
synthetic stdin (Phase 3) and need no liveness, but a behavioral eval does — and the plugin
only ever runs `main`. Register the hook **project-scoped** instead: a disposable scratch
repo containing `AGENTS.md`/`.ai/` and a `.claude/settings.json` whose `UserPromptSubmit`
entry points at the absolute path of the branch checkout. No plugin involvement, no `main`,
no effect on any real repo; switching arms is switching which checkout the path names.

**Done-when:** the eval separates the arms with a recorded control divergence, and a
written verdict names the winner against the D2 criterion. **If the arms cannot be
separated, this phase's outcome is "STOP and re-open D3" — that is a valid, recorded
result, not a failure to be worked around.**

## Non-Goals

- **Any blocking behavior.** No `exit 2`, no `decision: block`, ever.
- Replacing or restructuring `SessionStart` — it works and stays.
- Activating the `PreToolUse` guard in `settings-template.json` (separate, higher
  enforcement-per-byte win — track independently).
- Fixing the `.ai/` hygiene drift noted above (do it, but not under this spec).
- Tuning N beyond picking a starting value. D4 is a measurement input, not a finding.

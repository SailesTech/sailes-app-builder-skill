# Running Sailes roles through Workflow — one source

The **only** place that says how the lead drives the `Workflow` tool with Sailes roles. Spec
`.ai/specs/2026-09-16-workflow-first-orchestration.md` (D1–D8, Q1–Q6). **Claude Code only (Q5)** —
Codex has no `Workflow` tool and no `agentType`/`StructuredOutput` equivalent; `codex-agents/parity.test.js`
excludes these concepts from the Codex side explicitly rather than silently drifting.

Every fact below with a `wf_*` or `.ai/eval-runs/…` citation is measured, not assumed — Q4 put
doctrine-before-measurement out of scope on purpose (P0 ran first). A fact marked **unresolved** stays
that way in the doctrine; it does not get rounded off to look decided.

## Pipeline shape (D2, D3, D5, Q6)

```
lead (Opus)                          Workflow (Sailes roles, agentType always)
────────────                         ──────────────────────────────────────────
spec approved + pre-implement READY
boot e2e once → result into prompts ─▶ WF1  explorer → [designer] → contract → tester (derive, DRAFT)
  STOP: human freezes the plan   ◀──       returns: map, contract, plan (schema)        [full lane]
  STATE.md, new session
                                  ─▶ WF2  pipeline (waves from `## Plan wykonania`):
                                             phases: be-dev|fe-dev (worktree), parallel waves
                                           → tester (write, whole spec) → checker (whole diff) → ≤1 fix round (D8)
                                           returns: verdicts (schema) | blocked + reason
  STOP at a key decision          ◀──
  integration, STATE.md, new session
                                  ─▶ WF3  qa (serialized, exclusive environment) → docs-author
  verdicts → .ai/, docs-delta receipt → human
```

| Workflow | Runs | Ends with | Lane middle |
|---|---|---|---|
| WF1 | `explorer` → `[designer]` → contract → `tester` DRAFT | human STOP to freeze the plan | folded into WF2 — plan is `DERIVED`, no freeze STOP |
| WF2 | phases from `## Plan wykonania`, parallel where files are disjoint, then one `tester` + one `checker` for the whole spec | human STOP only at a key decision, else lead integrates | same script as WF1 in one run |
| WF3 | `qa` (serialized) → `docs-author` | verdicts + docs-delta receipt handed to the human | unchanged — always its own workflow |

**Gates at the end, once, not per phase (D8).** Measured on equal-cost implementations
(`.ai/eval-runs/2026-09-16-gate-placement/VERDICT-round1.md`, hidden 24-case acceptance test, n=2 per
arm): one `tester`+`checker` pass at the end of all phases averaged **$1.37 / 9.7 min**; the same
gates run serially after every phase averaged **$2.61 / 19.1 min** (2.2–2.6× the cost, ~2× the wall
time); a hybrid (gate after risky phases only) landed at **$2.53 / 11.4 min** — nearly B's cost with
A's time. All three scored the hidden test identically (24/24) *when the implementation itself was
already correct* — **detectability and the cost of a late-caught defect were not measured** in this
round; round 2 is deferred by human decision. Real-wave evidence
(`wf_176ebaa2-236`): gates were 55% of total workflow cost, `tester` ≈ $1.7/phase, `checker` ≈ $0.5/phase
— consistent with per-phase gates being the expensive arm, not the cheap one.
- **Known risk of end-gates:** a cross-phase regression surfaces late. On `wf_4eb1edf7-db8`, real
  regressions from an earlier phase (deleted UI leaving 3 tests red) were not caught until checker's
  **second** round, by which point the fix budget was gone. Mitigation carried into the checker gate:
  it does not stop at each phase's own `Done-when` — it also runs `git grep -l <changed symbol> tests/`
  across the whole diff and executes whatever that turns up.

## Brief preamble — every phase prompt in WF2 carries these, verbatim

| Rule | Text to inject | Measured reason |
|---|---|---|
| Sync to base | `git merge --ff-only <full lead SHA>` first, `git log --oneline -1` to confirm | worktree base is the **default branch** (`main`), never the lead's own branch — 6/6 worktrees in one run started from `main`, not the feature branch (P0.2a) |
| No destructive reset | Never `git reset --hard`; use `git merge --ff-only` for the sync above | `git reset --hard` is blocked **non-deterministically** by the auto-mode classifier ("Irreversible Local Destruction") — 5 of 6 callers blocked in one run, 3 of 3 blocked in another, while `git merge --ff-only <sha>` passed 6/6 across both (P0.2b) |
| Turn budget | "At ~70% of your role's `maxTurns`, commit `WIP:` and immediately return `blocked` via `StructuredOutput`" | `maxTurns` is enforced **inside** Workflow, not just advisory — one phase stopped at exactly 140 turns with no `StructuredOutput` and $6.47 spent finding out; a prompt-level "~70 calls" limit was separately ignored at 157 calls. The spec-time backstop is `Blast-radius`: a phase whose blast radius implies >~60% of the role's `maxTurns` is split in the spec, not patched with a bigger budget |
| Context economy | Read only the named spec sections/files; grep with line ranges; never read a whole large file you don't edit; never run the full suite mid-phase | same failure class as the turn-budget one — a phase that reads broadly burns the same budget it needs for the actual edit |

## Result schemas (D3) — verdicts are JSON, the lead writes them to disk

Gate and implementer roles return `StructuredOutput` matching one of these three shapes; the script
passes the raw object back to the lead, which writes it into `.ai/` (run log / `STATE.md` /
`.ai/eval-runs/`). **This is Workflow-only.** Outside Workflow (the plain `Agent` tool) the existing
rule — "the report is a file the gate role writes incrementally" — is unchanged; a schema return does
not replace the incremental file for `checker`/`qa`/`tester`, because a thrown/`null` result from a
dying agent carries nothing recoverable, while a file written as it goes does
(`.ai/eval-runs/2026-09-16-workflow-research/practices.md`, "report-clause" row).

```json
// IMPL — be-dev / fe-dev
{
  "status": "done" | "blocked",
  "commit": "<full sha, empty unless status=done>",
  "touched": ["<repo-relative path>", "..."],
  "done_when": [{"command": "...", "exit": 0, "output_tail": "..."}],
  "note": "<deviations, substitute decisions, blockers — at most a few lines>"
}
```

```json
// TEST — tester
{
  "status": "done" | "blocked",
  "commit": "<full sha>",
  "plan": ["<case id/name>", "..."],
  "detection_proof": ["<how each tier of case is proven to fail without the fix>", "..."],
  "defects": [{"id": "...", "description": "...", "severity": "..."}]
}
```

```json
// REVIEW — checker / qa
{
  "verdict": "APPROVE" | "NITS" | "CHANGES-REQUIRED",
  "findings": [{"id": "...", "description": "...", "location": "..."}],
  "commands_run": ["<command>", "..."]
}
```

## `safe()` wrapper — every `agent()` call in the script

```js
async function safe(fn, label) {
  try {
    const result = await fn();
    if (!result) {
      console.error(`[${label}] empty result — treat as blocked, do not read as "no issues"`);
      return null;
    }
    return result;
  } catch (err) {
    console.error(`[${label}] threw: ${err.message}`);
    return null;
  }
}

const impl = await safe(
  () => agent({ agentType: 'sailes-app-builder:be-dev', schema: IMPL_SCHEMA, prompt: phaseBrief }),
  'be-dev:P2'
);
```

An uncaught throw from `agent()` kills the whole script, not just that call — every invocation goes
through `safe()`. A `null`/thrown result and a `{status:"blocked"}` result are handled the same way
below; neither is a completion.

## `null` / `blocked` handling

**Before retrying, inspect the branch and worktree — never re-run the same brief blind.**
A dead or blocked agent commonly left a `WIP:` commit and uncommitted work (measured on a phase that
died at 140 turns holding a real commit). The retry is a **continuation with a disjoint file set**,
not a repeat of the whole phase: `git log <branch> --oneline`, `git status` in the worktree if still
present, then hand the next agent only the remaining files/`Done-when` items. `resumeFromRunId` does
not help once the first agent's prompt has changed (no cache hit), so a genuine re-run uses a fresh
`agent()` call with `scriptPath`, not a resume.

## Lead integration

- **Merge with `--no-ff`.** The lead integrates each phase's final SHA into the workflow's working
  branch with `git merge --no-ff <sha>` — never fast-forward, so the merge commit is the visible
  seam between the lead's integration and the worker's isolated commits.
- **Lead cwd rule.** A worktree is cut from the repo of the lead's **own cwd at the moment `Workflow`
  is invoked** — launching from outside any git repo produces `WorktreeIsolationError` for every
  agent that requests `isolation: 'worktree'`, 6/6, 0 tokens spent (P0.2c). The lead `cd`s into the
  target repo before calling `Workflow`, every time, not just once per session.
- **A worktree agent cannot reach the main checkout with `git`.** `git -C <main checkout>` is a
  tool-level refusal ("this command redirects git to the shared checkout"), and `Write` to a main-
  checkout path is refused the same way (P0.2, P0.3) — only `Bash` can write there (e.g. a status
  file), which is the asymmetry `agent-team-structure.md` already documents. Integration is
  therefore always the lead's own git operation in its own cwd, never something a phase agent does.
- **Combining parallel devs' SHAs.** When a later stage needs two parallel phases' work in one
  worktree, that stage's own agent runs `git merge --no-edit <sha>` for each parallel branch inside
  its own worktree — not the lead reaching in, and not a rebase.

## Boot e2e once, before WF2

Run the stack's boot command **once**, before dispatching any WF2 phase, and pass the raw result
into every phase/tester/checker/qa prompt. Measured cause: on one workflow, `tester`, `checker` and
`qa` each independently hit the *same* environment boot failure (docker compose port conflict, MinIO
pull denied) and burned tens of tool calls rediscovering it separately, because nothing shared
"this environment is broken" state between isolated agent invocations
(`.ai/eval-runs/2026-09-16-workflow-research/source-feedback-idealny-wzrok.md`, item 21). If the boot
fails, every subsequent prompt in that run carries `e2e: ENV-DEFECT known, do not attempt` plus
whatever the human decides to do about it — never a silent retry per role.

## `qa` runs serialized

`qa` is dispatched alone, one invocation at a time, holding the runtime environment exclusively —
this is the existing environment-exclusivity rule (`agent-team-structure.md`, Isolation, "4b"), not a
new one; Workflow does not change it. Never fan `qa` out in parallel with a be-dev/fe-dev phase or
with another `qa` run — worktrees isolate files, never the shared database/ports/containers.

## Lead handoff after every workflow (Q6)

Every return from `Workflow` — every WF1/WF2/WF3, i.e. every STOP in the pipeline diagram above —
closes with the full `session-handoff.md` procedure: `.ai/STATE.md` written before anything else,
one line to the human, a fresh lead session next. Q6 rejected a turn-count threshold in favor of
"after every workflow, no exceptions" specifically because a threshold is one more thing a large,
already-compounding lead session can talk itself past.

## The lead's six (D5)

Everything else in a phase is a role's job, dispatched through Workflow. The lead keeps exactly six:
merge/integration · freezing the contract · the run log · `STATE.md` · the gate verdict · escalation
to the human. Carried forward from the superseded 2026-08-06 spec's D5/Q1 unchanged.

## Model rule

| Situation | Resolves to | Source |
|---|---|---|
| `agent({agentType})`, no `model` | the role's own frontmatter pin (`explorer` → `claude-haiku-4-5-20251001`, `be-dev` → `claude-sonnet-5`, etc.) | `wf_c7c25bee-3b3` |
| `agent({agentType, model: 'haiku'})` | the explicit alias wins over the frontmatter pin | `wf_c7c25bee-3b3` (`checker` + `'haiku'` → haiku) |
| `agent({})`, no `agentType` at all | the **session model** (Opus in a lead session) — this is the failure mode, not a feature | `wf_3227fe3d-ad3` — 5 collectors dispatched with no `agentType` all ran on Opus and were killed by the human mid-run |
| Full resolution order (Claude Code ≥ v2.1.251) | per-invocation `model` → role frontmatter → session model → `CLAUDE_CODE_SUBAGENT_MODEL` env | code.claude.com/docs/en/sub-agents: "Before v2.1.251, `CLAUDE_CODE_SUBAGENT_MODEL` came first" — this doc states the **current** order; `team-lead.md`/`agent-team-structure.md` carry the pre-v2.1.251 order as of this writing and are corrected separately (spec P4.2) |

Rules:
- **`agentType` is mandatory on every `agent()` call, no exception** — it is what loads the role's
  pin at all. The hook `hooks/workflow-agenttype-guard.js` (spec P5a/P5b) exists specifically to
  make this mechanical rather than a thing a script author has to remember.
- **`model` is only ever a conscious override**, and it goes in the run log with the alias and the
  reason — the same "log the alias" rule the plain `Agent` tool already carries
  (`agents/team-lead.md`).
- **`researcher` in Workflow defaults to a `model: 'sonnet'` override.** Its frontmatter pin is Opus,
  which collides with the standing "no Opus subagents" rule; Opus for `researcher` requires explicit
  human sign-off, not a default.
- `effort` takes measurable effect: `'high'` produced ≈2.7× the output tokens of `'low'` on the same
  task, n=2+2 (`.ai/eval-runs/2026-09-16-workflow-facts/VERDICT.md` P0.1). **Haiku 4.5 does not
  support `effort`** — do not set it on an `explorer` or any haiku-pinned role.

## Cost measurement

`node tools/token-report.js <workflow session/subagents/workflows/wf_*-dir> --json --cost` turns a
workflow's raw transcripts into per-label/per-role/per-tier USD, using one price table and the
dedup-by-`message.id` rule (a naive per-line sum double-counts and was the source of an earlier wrong
total). Run it at the end of every WF1/WF2/WF3 and paste the total into the run log — it is how "gates
were 55% of cost" and similar figures above were computed in the first place, not something to
re-derive by hand.

## Pre-run script syntax check

Before calling `Workflow` with a `scriptPath`, check the script parses: a syntax error inside the
Workflow sandbox is a wasted round-trip once agents are already dispatched. `node -e` against the
file's source with `new Function(...)` catches this cheaply (the same content minus the module
`export`, since the script itself is not a Node module).

## Status file naming carries the workflow run id

`be-dev-1.md`-style status filenames collided across two *concurrent* workflows using the same small
integer (`wf_9f0a06c6-83e`). Every worker's status file name includes the workflow run id
(`.claude/status/<role>-<workflow-run-id>.md` or `<role>-<workflow-run-id>-<n>.md` when a workflow
dispatches more than one of the same role), never a bare sequence number the script or agent invents.

# Delegation reports — a silent worker must not read as a finished one

Status: approved
Date: 2026-07-18

> Open Questions answered 2026-07-18; see **Decisions**. Phase 1 done, Phase 2 deferred
> to the backlog by D3. Runs on `fix/delegation-reports`; `main` is production.

## TLDR & Context

A delegated agent can finish and return **nothing**. The lead sees an idle signal, no
report, and no error. If the lead does not notice, the entire delegation is lost — and
because the framework makes delegation the lead's *default* (`agents/team-lead.md:14`),
the loss sits under the main path, not at its edges.

The dangerous property is not the loss. It is that **an idle-with-no-report is
indistinguishable from "the agent looked and found nothing"** — a false negative that
looks exactly like a real result. That is the silent-instrument trap this framework's own
diagnosis track exists to stamp out.

## Problem Statement

Observed 2026-07-18, in this repo, three times in one session:

1. `enforcement-audit` (subagent type `general-purpose`) signalled idle with no report.
   The audit was recovered only because the lead noticed the absence and sent an explicit
   "send me your findings, and say plainly if you did not finish".
2. `hook-schema` (subagent type `claude-code-guide`) did the same after delivering — a
   second idle signal carrying nothing, indistinguishable from the first case.
3. Not an agent, but the same class: the lead wrote a backlog entry, destroyed it with
   `git checkout <branch> -- <path>` over an uncommitted edit, and committed the reverted
   file. `|| true` swallowed the signal. **A silent loss that looked like success**, in
   the very entry recording silent losses.

### The finding that shapes the fix

**Both failed agents were built-in types (`general-purpose`, `claude-code-guide`), not
Sailes roles.** Nothing in `agents/` or `codex-agents/` was involved. Editing the seven
Sailes role definitions would therefore **not have prevented any of today's failures**.

This inverts the obvious design. The load-bearing side is the **lead**, because it is the
only side we control for arbitrary agent types. And since the lead already writes a
self-contained brief per worker (`agents/team-lead.md:23`), the instruction "your final
message IS the deliverable" belongs **in the brief**, where it reaches any agent type,
rather than in role definitions, where it reaches only our seven.

### Constraint: there is no mechanical enforcement point

Verified against the hook surface: hooks fire on session start, prompt submit, and tool
calls. **None observes a subagent completing.** A missing report cannot be detected by a
script the way spec drift or a version stamp can.

This matters because `agentic-first-principles.md` §B.3 says a rule that can be expressed
as a check should become one. Here it cannot. This is therefore prose enforcement by
necessity, not by laziness — and prose is exactly what decays, which is the problem the
`prompt-anchor` spec is separately trying to solve. D1 below should be judged on whether
it survives a lead under context pressure at turn 60 — not on whether it reads well here.

## Decisions (gate closed 2026-07-18)

- **D1 — Prevention first, chase as backstop.** Chasing is the only correct response to an
  empty return, but the goal is that it stays rare: the report clause in the brief is the
  prevention, the chase is recovery. Escalate to the human if the chase comes back empty —
  do not re-spawn on a guess, do not quietly absorb the work.
- **D2 — Yes, persist to disk — into structures that already exist.** No new store: a
  worker's *problem* knowledge lands in `.ai/lessons.md` (Context / Problem / Rule /
  Applies-to, which already has a promotion path to enforced checks), and a substantial
  delegation lands in `.ai/runs/`. A message queue does not survive a context reset.
- **D3 — Minimum now, twins deferred.** `agents/team-lead.md` + `agent-team-structure.md`
  only. Because the lead writes every brief, this reaches **all** agent types including
  the built-ins that actually failed. The 13 remaining role/TOML files would cover only
  Sailes roles — a belt to the braces, not the fix. Deferred to the backlog, not dropped.
- **D4 — Yes, the report clause is a named brief element.** Added to the brief template in
  `agent-team-structure.md` and to the lead's decomposition step, alongside the existing
  non-negotiables (one goal, contract, verification commands, do-not-commit).

## Phasing & Steps

### Phase 1 — Lead side + doctrine  ✅

Steps: define the report clause in the brief template (`agent-team-structure.md` Worker
brief) and in the lead's step 2; add "an empty return is a failure, not a completion" to
both lifecycle sections; add the harvest-before-release step pointing at `.ai/lessons.md`
and `.ai/runs/`.

**Done-when:** `npm test` → 0 failures (TOML twins still validate); the phrase "final
message IS the deliverable" appears in the brief template; both lifecycle sections state
that an empty return is chased, not accepted; a lesson recording today's three failures
exists in `.ai/lessons.md`.

### Phase 2 — Worker-side twins (deferred, backlog)

The 6 remaining `agents/*.md` and 7 `codex-agents/*.toml`. Only worth doing as part of the
next edit that touches those files anyway — they must stay in sync (`validate-toml.test.js`,
`repo-done-checklist.md`), and a 13-file pass for a redundant safety net is poor value on
its own.

## Non-Goals

- Any attempt to detect a missing report mechanically. Verified: no hook sees it.
- Changing when the lead delegates. Delegation-as-default is settled doctrine (1.7.0);
  this spec makes the return trip reliable, it does not revisit the outbound decision.
- Fixing the `git checkout` footgun from failure #3 — same class, different surface;
  belongs in the lead's own working rules, not here.

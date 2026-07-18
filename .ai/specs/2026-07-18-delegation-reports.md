# Delegation reports — a silent worker must not read as a finished one

Status: draft
Date: 2026-07-18

> **SKELETON — Open Questions gate is OPEN.** Per `spec-writing-template.md` step 3, this
> stops at TLDR + Problem + Constraints + Open Questions. No edits to `agents/`,
> `codex-agents/`, or `agent-team-structure.md` until Q1–Q4 are answered.

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
`prompt-anchor` spec is separately trying to solve. Any answer to Q1 should be judged on
whether it survives a lead under context pressure at turn 60.

## Open Questions — ANSWER BEFORE ANY EDIT

**Q1. What must the lead actually DO when a worker returns without a report?**
Options: (a) chase once with an explicit request, then escalate to the human if still
empty; (b) chase once, then re-spawn a fresh worker with the same brief; (c) treat it as
a failed task immediately and report the gap to the human without chasing. Today's
recovery used (a) and worked, but n=2.

**Q2. Should a delegation's report be persisted to `.ai/`, or stay in the message?**
Persisting survives context resets and makes "was there a report?" checkable on disk —
possibly by a script, which would be the only mechanical foothold available. Cost: more
files, and most reports are ephemeral scaffolding not worth keeping. If yes, which
reports — all, or only those feeding a gate verdict?

**Q3. How wide is the edit?**
Minimum is `agents/team-lead.md` + `agent-team-structure.md` (lead side + doctrine).
Adding the worker-side line to the 7 `agents/*.md` and their 7 `codex-agents/*.toml`
twins helps only Sailes roles — real, but not what failed today. Do we do the minimum
now and the twins later, or all sixteen files in one pass?

**Q4. Does the lead's brief template change?**
If "your final message IS the deliverable, not a summary for a human" goes into every
brief, that is a change to the briefing protocol at `agents/team-lead.md:23`, and it
should probably be named as a required brief element alongside
`goal · files · contract · constraints · verification · report`.

## Non-Goals

- Any attempt to detect a missing report mechanically. Verified above: no hook sees it.
- Changing when the lead delegates. Delegation-as-default is settled doctrine (1.7.0);
  this spec makes the return trip reliable, it does not revisit the outbound decision.
- Fixing the `git checkout` footgun from failure #3 — same class, different surface;
  belongs in the lead's own working rules, not here.

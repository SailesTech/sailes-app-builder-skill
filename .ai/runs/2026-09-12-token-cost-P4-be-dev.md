# P4 run log — be-dev-5 — role-shadow removal (D4)

Base: merged `feat/1.33.0-token-cost` at `f1fe9e2` (ff-only, verified ancestor).

## Brief-template location search (before writing the salvage step)

Searched `skills/` for a client-side "worker brief template" file: `agent-team-structure.md`
(the "Worker brief — the self-contained handover" section, generic format), `agents-md-template.md`,
`skeleton.md`, `.ai/briefs/` usages in this framework repo's own history, `skills/sailes-discovery/brief-template.md`.

Findings:
- `agent-team-structure.md`'s Worker brief format is explicit **framework-only doctrine** —
  `agents-md-template.md`'s own Agent Teams section says so in terms: "load the global
  `sailes-bootstrap` skill — its `agent-team-structure.md` is the canon. (It is a globally-installed
  skill, not a file in this repo.)" No client repo gets a copy of this file.
- `.ai/briefs/*.md` in *this* framework repo are spec-discovery briefs (provenance docs for specs),
  not worker task briefs, and are not part of what a client repo scaffolds.
- `skills/sailes-discovery/brief-template.md` is a *Project Brief* (business/product brief for
  discovery), unrelated to worker task briefs.
- The repo-specific **facts** that populate a worker brief (commands, paths, conventions, stack) live
  in the client repo's own `AGENTS.md` — Key Commands / Conventions / Task Router / Stack sections,
  generated from `agents-md-template.md`. That is the closest client-side artifact to "the brief
  template," but it is the *facts source*, not the brief *format*.

Conclusion: **no client-side "brief template" file exists.** Per the brief's instruction, I did not
invent one. The salvage step in `adopt-existing-repo.md` points repo-specific knowledge from deleted
role files at `AGENTS.md`'s relevant sections, and carries an explicit `TODO(human)` sentence flagging
the gap for the lead to escalate. This is a deviation worth the lead's attention: **decide whether a
dedicated per-repo brief-template artifact should exist**, or whether `AGENTS.md` is deliberately the
intended target and the doctrine should just say so plainly.

## Files touched (before → after)

### 1. `skills/sailes-bootstrap/adopt-existing-repo.md`
Before: Upgrade mode step 2 had a placeholder parenthetical: "(A later exception — Upgrade mode
deleting local role files that shadow plugin roles, P4 of `2026-09-12-token-cost-of-running.md` —
sits next to these two, not folded into them.)"
After: replaced with a full **(c) role-shadow removal** exception, sibling to (a) hook patch and
(b) memory rotation: salvage repo-specific knowledge to `AGENTS.md` first (with the TODO above),
then delete the file, then show the human the salvage diff + deletion list together before writing
— matching (a)/(b)'s "diff before writing" pattern. Named non-role files (e.g. `be-checker.md`) are
explicitly NOT auto-deleted — listed and asked instead.

(entries for items 2–4 appended below as each lands)

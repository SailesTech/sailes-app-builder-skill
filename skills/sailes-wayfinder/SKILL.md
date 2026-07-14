---
name: sailes-wayfinder
description: Use when an effort is too big or too foggy for one session — the destination (a confirmed Brief, an approved spec, a locked architecture decision) is not reachable in a single conversation because unknowns depend on other unknowns, on research/spikes, or on client input that arrives later. Triggers — "to za duże na jedną rozmowę", "dużo niewiadomych", "nie wiemy jeszcze którego API / kto będzie userem / czy będą płatności", "mapa decyzji", multi-integration projects with not-yet-granted access, sailes-start routing a foggy idea, sailes-spec Open Questions that exceed one sitting.
---

# Sailes Wayfinder — Decision Map for Big, Foggy Efforts

## Overview

**Wayfinding is finding the way, not charging at the destination.** When an idea is too big for one session and the route to the destination isn't visible yet, this skill charts the way as a **map on disk** and then works its **decision tickets** — questions whose resolution is a *decision*, not slices of a build — one per session, until the way is clear and nothing is left to decide before someone goes and does the thing.

Adapted from the Wayfinder methodology (Matt Pocock) with **zero external dependencies**: every ticket type resolves through mechanisms this framework already has — decision cards (`sailes-discovery` style), research subagents, `sailes-design` prototypes.

**Plan, don't do.** The pull to just start building is the signal you've reached the edge of the map — that's a handoff to the pipeline, not a reason to code.

## When to Use / When NOT to

**Use when:** the destination isn't reachable in one session — unknowns depend on other unknowns (auth model depends on who the users are), on research (API capabilities, access not yet granted), or on client input (workshop pending); several people/sessions will work the questions concurrently; `sailes-start` routed a foggy idea here; `sailes-spec` escalated an oversized Open Questions block.

**Do NOT use when:** the scope interview fits one sitting → `sailes-discovery`; the brief is confirmed and unknowns fit one Open Questions pass → `sailes-spec`; mid-implementation (the spec is the map); a trivial change.

## The map on disk (canonical artifact)

Default tracker is **local markdown** — truth on disk, versioned in git, zero dependencies:

```
.ai/wayfinder/<effort-kebab>/
  map.md                      # the map — index, not store
  tickets/NNN-<kebab>.md      # one file per ticket
```

If the team already runs planning on GitHub Issues, offer a 🔀 decision card (local files vs Issues with labels `wayfinder:map` / `wayfinder:<type>` and native blocked-by) — the user chooses; either way there is exactly **one** canonical home. `.ai/STATE.md` points at the active map (path + next frontier ticket); the map holds the plan.

**`map.md`** — the whole effort at low resolution, loaded once per session. Open tickets are NOT listed here (they're found in `tickets/` by status); it never restates an answer, only gists it and links:

```markdown
# Map: <effort>

## Destination
<what "the way is clear" looks like — usually the entry gate of the standard
pipeline: a confirmed Brief (→ sailes-bootstrap) or an approved spec>

## Notes
<domain; skills every session should consult (sailes-pipedrive, sailes-database, …);
standing preferences for this effort>

## Decisions so far
- [<ticket title>](tickets/NNN-<kebab>.md) — <one-line gist of the answer>

## Not yet specified
<fog of war — in-scope questions you can't state precisely yet>

## Out of scope
- <gist + why it's beyond the destination> ([closed ticket](tickets/NNN-….md))
```

**Ticket** — a child of the map, sized to one session:

```markdown
# NNN — <title>
Type:       decision | research | prototype | task
Status:     open | claimed | closed
Claimed-by: <who/which session — set BEFORE any work; the claim>
Blocked-by: <NNN, NNN — or "—">

## Question
<the decision or investigation this ticket resolves>

## Resolution
<added on close — the ONLY place the answer lives: answer + evidence/links>
```

**Frontier** = open + unblocked (every `Blocked-by` ticket closed) + unclaimed — the edge of the known, what's takeable now. In everything the human reads, refer to tickets **by title**, never by a bare number — numbers ride inside links, they don't stand in for names.

## Ticket types → existing Sailes mechanisms

Every ticket is **HITL** (human in the loop — resolves only through live exchange; never answer the human's side yourself) or **AFK** (agent works alone).

| Type | Mode | Resolved by |
|---|---|---|
| **decision** (default) | HITL | Decision card in the `sailes-discovery` style: options with ✅/⚠️ + one concrete upside, one concrete cost each + a recommendation — the **user** chooses. |
| **research** | AFK | A fresh research subagent (docs, third-party APIs, codebase, web). Findings land in the ticket's Resolution. The only type allowed >1 per session; fire them in parallel. |
| **prototype** | HITL | A cheap, rough, concrete artifact to react to — UI stub per `sailes-design`, code spike, outline. Link the artifact from the ticket; record the user's verdict as the Resolution. |
| **task** | HITL/AFK | Work that must happen before a decision *can* be made — provision access, sign up for a service, move data so its shape is visible. AFK where the agent can drive it; otherwise hand the user a precise checklist. Resolution records what was done + resulting facts (URLs, credentials location, counts). |

## Fog of war

The map is **deliberately incomplete** — don't chart what you can't yet see. **Fog-or-ticket test: can you state the question precisely NOW?** (Not: can you answer it.)

- Precisely stateable → **ticket**, even if blocked.
- Not yet → **Not yet specified**, as loosely or fully as the view allows.

Don't pre-slice fog into ticket-sized pieces — one patch may graduate into several tickets, or none, once the frontier reaches it. Resolving a ticket clears the fog ahead of it: graduate what's now specifiable into fresh tickets and remove it from the fog section.

## Out of scope

The Destination fixes the scope; work beyond it is out of scope — not fog. When a ticket turns out to sit past the destination, **close it** and leave one line in Out of scope (gist + why, linking the closed ticket). It never graduates; it returns only if the destination is redrawn, as a fresh effort. Deferred-but-valuable items also go to `.ai/backlog.md` (sibling of the spec's Non-Goals) so they aren't lost.

## Mode 1 — Chart the map (one session; resolves nothing)

1. **Name the Destination** — a decision card if there's a real fork (spec? locked decision? Brief?); the user chooses. The destination shapes every ticket.
2. **Breadth-first unknown scan** — discovery-style questioning, wide not deep: fan out across the whole space for open decisions and first takeable steps. **No fog surfaced?** The way is already clear — no map; run the normal pipeline instead.
3. **Create the map + tickets** you can state precisely now; wire `Blocked-by` in a second pass (tickets need numbers before they can reference each other). The rest stays in Not yet specified.
4. **Fire the research subagents** for every research ticket, in parallel.
5. Update `.ai/STATE.md` (active map path + next frontier ticket), commit, **STOP.** Charting is one session's work — it hand-resolves nothing.

## Mode 2 — Work the map (one decision per session)

1. Load `map.md` only — zoom into ticket bodies on demand.
2. Choose the ticket: the user's, else the first frontier ticket. **Claim it first** (`Claimed-by`) — concurrent sessions skip claimed tickets.
3. Resolve it via its type's mechanism (table above); consult the skills the map's Notes name.
4. Record: Resolution in the ticket → `Status: closed` → one-line gist appended to Decisions so far.
5. Graduate fog now specifiable; close mis-scoped tickets to Out of scope; update or delete tickets the answer invalidated. Update STATE.md, commit, **STOP** — one resolved decision per session (research tickets excepted).

## Handoff — when the map is done

No open tickets + empty fog → the way is clear. Hand off to the destination's gate: confirmed Brief → `sailes-bootstrap` (Phase 2); approved spec → `sailes-pre-implement`. The Brief's Decisions Ledger / the spec **reference** ticket resolutions (gist + link) — a decision lives in exactly one place, its ticket; nothing restates it.

## Hard rules

- **Plan, don't do.** Tickets resolve decisions. A "ticket" that is a build slice belongs in a spec phase, not on the map.
- **One resolved decision per session** (research excepted). Fresh context per decision is the point.
- **Claim before work** — assignee is the claim; unassigned = takeable.
- **The map is an index, not a store.** The answer lives in the ticket; the map gists and links.
- **HITL means the human speaks for themselves.** Recommend with trade-offs; never close a decision/prototype ticket without their word — deadline pressure doesn't transfer ownership (invariants #4/#7).
- **A charting session never resolves.**
- **Fog test before ticketing** — precise question or it stays fog.
- **Truth on disk** — map and tickets are committed files, not conversation.

## Quick Reference

| Situation | Do |
|---|---|
| Foggy multi-unknown idea | Mode 1: chart (destination → scan → map+tickets → fire research → stop) |
| "Rozwiąż następny ticket" | Mode 2: claim first frontier ticket, resolve ONE, record, stop |
| Question you can't phrase sharply | Not yet specified (fog), not a ticket |
| Ticket past the destination | Close it + one line in Out of scope |
| Answer known, needs writing down | Resolution in the ticket; map gets the gist + link |
| No open tickets, no fog | Handoff to the pipeline gate |

## Common Mistakes

| Mistake | Fix |
|---|---|
| Pre-slicing the whole route to the destination upfront | Chart only what you can state precisely; the rest is fog. |
| Plan lives in narrative / a STATE.md note | `map.md` + tickets are the canonical artifact; STATE.md only points at it. |
| Resolving three tickets in one session "for momentum" | One decision per session; research is the only exception. |
| Deciding the spec decomposition / architecture while charting | Those are tickets — the user resolves them, in order. |
| Restating a resolution on the map | Gist + link; the ticket is the single home of the answer. |
| Growing a mega discovery session as unknowns multiply | That's a map — switch to Mode 1. |

## Red Flags — STOP

- You're writing the complete phase-by-phase route to the destination in one pass.
- You're about to close a decision or prototype ticket and the user hasn't spoken.
- This session already resolved a HITL ticket and you're opening a second one.
- A ticket reads like a build task ("implement X") — that's `sailes-spec` material.
- The map exists only in conversation, nothing committed under `.ai/wayfinder/`.
- You started resolving tickets in the same session that charted the map.

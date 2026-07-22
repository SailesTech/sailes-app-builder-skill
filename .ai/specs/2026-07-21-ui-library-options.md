# Spec: UI-layer options — Preline UI (additive) + Astryx (alternative)

**Status:** approved (decisions closed in-session, 2026-07-21) · **Owner:** Marcin
**Scope class:** standard-content addition (no behavior/pipeline change) → minor bump to 1.11.0

## Why

The baseline names exactly one UX stack (Tailwind + shadcn/ui). Marcin wants two more libraries
visible as *suggested options* wherever the framework proposes how to build UX, plus a persisted
research note on what they offer inside the current architecture:

- **Preline UI** (preline.co) — Tailwind component/block library.
- **Astryx** (astryx.atmeta.com) — Meta's open-source React+StyleX design system, agent-ready (CLI+MCP).

## Decisions Ledger (all chosen by Marcin, 2026-07-21)

| Decision | Chosen | Rejected alternatives |
|---|---|---|
| Placement | baseline UI row + new `skills/sailes-bootstrap/ui-libraries.md` reference, linked from bootstrap + sailes-design | baseline-only mention; full sailes-design section |
| Default | Tailwind + shadcn/ui stays the default | promoting either library to default |
| Preline status | additive option *inside* the default stack (blocks/markup source; interactive primitives stay shadcn/Radix) | first-class alternative |
| Astryx status | alternative UI layer, its own decision card (StyleX replaces Tailwind for that layer — not mixable) | additive add-on (wrong: styling paradigms conflict) |
| Process | light spec + implement in one session, CHANGELOG + bump + draft PR | spec-then-stop; docs-only without spec |

## Changes

1. **NEW `skills/sailes-bootstrap/ui-libraries.md`** — the researched note: what each library is,
   capabilities, how it fits/conflicts with the baseline architecture (Next.js App Router,
   Tailwind, shadcn/ui, agentic-first), integration mechanics, risks, when-to-choose triggers,
   sources + confidence marks (researched Jul 2026).
2. **`skills/sailes-bootstrap/stack-baseline.md`** — UI row points at the options + `ui-libraries.md`;
   two new rows in the "when to LEAVE the default" table; sources appended.
3. **`skills/sailes-bootstrap/SKILL.md`** — UI-layer named among the decision cards (Step: empty-repo
   recommendation list) + `ui-libraries.md` added to Reference files.
4. **`skills/sailes-design/SKILL.md`** — `ui-libraries.md` added to Reference files (Preline Figma
   kit / blocks and Astryx themes as design-phase inputs).
5. **`CHANGELOG.md`** — 1.11.0 entry, upgrade-actionable.
6. **Version 1.11.0** in `VERSION`, `package.json`, `.claude-plugin/plugin.json`,
   `.claude-plugin/marketplace.json` + `AGENTS.md` Framework-Version stamp if present at HEAD.

## Non-goals

- No change to the default stack, agent roles, hooks, or pipeline ordering.
- No Preline Pro / paid-tier guidance; free tiers only.
- No scaffolding/templates for either library — guidance only.

## Verification

- `npm test` green (hook tests + TOML validator — must stay unaffected).
- Grep confirms every edited file actually contains the new references (no silent no-op edits).

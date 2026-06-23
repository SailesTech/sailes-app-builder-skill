---
name: sailes-design
description: Use when a project (new or existing) needs a real frontend/visual design phase BEFORE building UI — to produce a deliberate design direction and a persisted design artifact, not deferred guesswork. Triggers — "zaprojektuj UI", "jak ma wyglądać", "design", "frontend", "interfejs", entering Step 4.5 of sailes-bootstrap, or any time UI is about to be built with no design-system/MASTER.md or ui-spec on disk. Covers palette, typography, layout, interaction states, accessibility, and the anti-AI-default check. Stops "no real frontend project was made".
---

# Sailes Design — the design phase that must happen before UI

## Overview

**This is the phase whose absence shows up as "it has no real frontend design."** Its job: turn the brief + locked stack into a *deliberate* visual direction and a **persisted design artifact** that an implementing agent builds from — so design is a decision on disk, not something each coder re-improvises.

**Core principle:** A UI without a design phase defaults to one of the generic "AI looks" (warm-cream + serif + terracotta; near-black + one acid accent; broadsheet hairline grid). Those are defaults, not choices. Your value here is making choices *specific to this brief* and writing them down.

Two layers, both required:
1. **Taste / direction** (judgment) — palette, type pairing, layout concept, the one **signature element**, and an explicit anti-AI-default check. See `design-judgment.md`.
2. **Discipline / rules** (verifiable) — accessibility, interaction states, responsive, tokens-not-hex. See `ux-rules.md`.

## When to Use / When NOT to

**Use when:**
- `sailes-bootstrap` Step 4.5 (design gate) — any app with a UI.
- Before building any new page/screen/component flow.
- An existing UI needs a coherent direction (currently ad-hoc).
- You're about to write UI code and there is no `design-system/MASTER.md` and no `.ai/specs/ui-spec.md`.

**Do NOT use when:**
- Backend-only / no-UI work (pure API, worker, integration job) — skip explicitly, note why.
- A design artifact already exists and the task is a trivial tweak inside it (follow it instead).

## The output (one of these MUST land on disk)

Pick the format the repo uses; produce one, confirmed by the user:

- **`design-system/MASTER.md`** (+ `design-system/pages/<page>.md` overrides) — the Master+Overrides pattern. Best when many pages share one system and pages deviate locally. When building page X: read `pages/x.md` if present (it overrides MASTER), else MASTER.
- **`.ai/specs/ui-spec.md`** — a single design spec (tokens + per-component layout/states/responsive + template). Best for a focused app with a few surfaces.

Either way the artifact is the gate: feature prose with no design direction does NOT count.

## Process — brainstorm → plan → critique → (build) → critique

1. **Ground it in the subject.** Name the product, its audience, and the page's single job. Pull distinctive cues from the subject's real world (its materials, vocabulary, artifacts) — that's where non-generic choices come from. Use the confirmed brief; don't re-elicit.
2. **Draft a compact token plan** (see `design-judgment.md`): Color (4–6 named hex), Type (display + body + optional utility, deliberate pairing), Layout (one-sentence concept + ASCII wireframe), **Signature** (the one memorable element that embodies the brief).
3. **Anti-AI-default critique (required).** For each axis the brief left free, ask: "would I produce this for almost any similar brief?" If yes, it's a default — revise and say what changed and why. If the brief *pins* a direction, follow it exactly (the brief's words win).
4. **Apply the discipline rules** (`ux-rules.md`): accessibility (contrast 4.5:1, focus, keyboard, reduced-motion), interaction states (hover/press/disabled/loading/empty/error), responsive breakpoints, semantic tokens (no raw hex in components), one primary CTA per screen, no emoji as icons.
5. **Persist** the artifact (MASTER.md or ui-spec.md), tuned to the locked stack (Tailwind/shadcn → token names map to that). Confirm with the user.
6. If you also build, derive every color/type decision from the artifact, then critique the result (screenshot if possible — a picture is worth 1000 tokens).

## Optional: ui-ux-pro-max design engine

If the `ui-ux-pro-max` skill/CLI is installed, you may seed the direction with its reasoning engine (67 styles, 161 palettes, 57 font pairings, product-type rules):
`python3 .../ui-ux-pro-max/scripts/search.py "<product> <industry> <keywords>" --design-system -p "<Project>"`
Treat its output as **input to your judgment**, not the final answer — still run the anti-AI-default critique and the discipline rules. It is web/app-UI oriented and mobile-biased in places; for B2B web take the palette/type/UX rules, drop the mobile-only items that don't apply.

## Quick Reference

| Step | Output |
|---|---|
| Ground in subject | product + audience + page's one job |
| Token plan | color / type / layout / **signature** |
| Anti-default critique | each free axis justified, defaults revised |
| Discipline pass | a11y + states + responsive + tokens |
| Persist | `design-system/MASTER.md` or `.ai/specs/ui-spec.md` |

Reference files: `design-judgment.md` (taste, signature, anti-AI-default), `ux-rules.md` (condensed accessibility/interaction/responsive/forms checklist).

## Common Mistakes

| Mistake | Fix |
|---|---|
| Deferring design to "the coder will decide" | That's the failure. Decide now; persist the artifact. |
| Landing on an AI-default look on a free axis | Run the anti-default critique; revise and justify. |
| Spreading boldness everywhere | One signature element; keep the rest quiet. |
| Raw hex scattered in components | Semantic tokens; map to the stack. |
| Skipping states (only "default") | Specify hover/press/disabled/loading/empty/error. |
| Copying ui-ux-pro-max output verbatim | It's input to judgment, not the answer; strip mobile-only rules for B2B web. |
| No artifact on disk | The gate is the file. No file = design phase didn't happen. |

## Red Flags — STOP

- You're writing UI code and there's no `design-system/MASTER.md` / `.ai/specs/ui-spec.md`.
- Your palette/type would fit almost any brief (a default, not a choice).
- You can't name the signature element.
- You specified colors as raw hex inside components instead of tokens.
- No accessibility pass (contrast, focus, keyboard, reduced-motion).

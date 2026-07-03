---
name: sailes-design
description: Use when a project (new or existing) needs a real frontend/visual design phase BEFORE building UI — to produce a deliberate design direction and a persisted design artifact, not deferred guesswork. Triggers — "zaprojektuj UI", "jak ma wyglądać", "design", "frontend", "interfejs", entering Step 4.5 of sailes-bootstrap, or any time UI is about to be built with no design-system/MASTER.md or ui-spec on disk. Covers palette, typography, layout, interaction states, accessibility, the anti-AI-default check, and a premium-craft finish pass (making the app look expensive, not just correct). Also triggers on "premium", "wygląda tanio", "make it look premium/high-end". Stops "no real frontend project was made".
---

# Sailes Design — the design phase that must happen before UI

## Overview

**This is the phase whose absence shows up as "it has no real frontend design."** Its job: turn the brief + locked stack into a *deliberate* visual direction and a **persisted design artifact** that an implementing agent builds from — so design is a decision on disk, not something each coder re-improvises.

**Core principle:** A UI without a design phase defaults to one of the generic "AI looks" (warm-cream + serif + terracotta; near-black + one acid accent; broadsheet hairline grid). Those are defaults, not choices. Your value here is making choices *specific to this brief* and writing them down.

Three layers, all required:
1. **Taste / direction** (judgment) — palette, type pairing, layout concept, the one **signature element**, and an explicit anti-AI-default check. See `design-judgment.md`.
2. **Discipline / rules** (verifiable) — accessibility, interaction states, responsive, tokens-not-hex. See `ux-rules.md`.
3. **Premium craft** (finish) — the last 15% that separates *correct* from *expensive*: color depth, layered elevation, typographic refinement, motion choreography, and the "premium tells" pass. See `premium-craft.md`. Correct-but-cheap is the most common failure once taste and discipline are in place; this layer closes it.

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
5. **Premium-craft pass (required for any stakeholder/customer-facing UI)** (`premium-craft.md`): bake color depth (tinted neutrals, no pure #000/#fff), a layered elevation scale, typographic refinement (modular scale, size-dependent tracking, tabular figures), motion choreography, and finish details into the artifact's tokens — then run the "premium tells" pass/fail checklist. Retune shadcn defaults; don't ship them stock. Correct-but-cheap fails here, not at the human's desk.
6. **Persist** the artifact (MASTER.md or ui-spec.md), tuned to the locked stack (Tailwind/shadcn → token names map to that). Confirm with the user.
7. If you also build, derive every color/type decision from the artifact, then critique the result (screenshot if possible — a picture is worth 1000 tokens).

## Optional: ui-ux-pro-max design engine

If the `ui-ux-pro-max` skill/CLI is installed, you may seed the direction with its reasoning engine (67 styles, 161 palettes, 57 font pairings, product-type rules):
`python3 .../ui-ux-pro-max/scripts/search.py "<product> <industry> <keywords>" --design-system -p "<Project>"`
Treat its output as **input to your judgment**, not the final answer — still run the anti-AI-default critique and the discipline rules. It is web/app-UI oriented and mobile-biased in places; for B2B web take the palette/type/UX rules, drop the mobile-only items that don't apply.

## Render and self-verify — the physical-integrity gate (MANDATORY for every UI)

The most damaging design failures are not "wrong taste" — they are **physical defects**: a control clipped/cut off, a field that doesn't resize, badges of mismatched width, content overflowing its container, an element invisible or off-canvas, an unintended scrollbar, two elements overlapping, a button you can't fully click. **A human should never be the one to catch these.** The reason a design phase exists is to produce a layout that is correct *by construction* per good practices. So design and its verification are **screenshot/visualization-driven, never code-only**.

Two non-negotiable steps:

1. **Render before you hand off.** Build a visualization of what you're designing — a Playwright screenshot of the rendered component/page (or the prototype's own render) — and LOOK at the actual pixels. Reading your own CSS/JSX is not seeing the layout. This is a normal step in the loop, not an afterthought. (A picture is worth 1000 tokens.)

2. **Pass the physical-integrity gate on that render** before it reaches the human. Categorical checks — pass/fail, not opinion:
   - **Nothing clipped or cut off** — no text, icon, or control truncated by its cell/container.
   - **Nothing invisible or off-canvas** — every intended element is on screen and within bounds.
   - **No unintended overflow / scroll** — content fits its container; horizontal scroll only where deliberately specified (verify at the target widths).
   - **Nothing overlapping** — no element sits on top of another it shouldn't.
   - **Every interactive control fully visible, sized, and operable** — buttons/inputs/icons have their full hit area, not a sliver.
   - **Responsive elements actually resize** — fields/columns that must flex do flex across target widths (e.g. 1280 / 1366 / 1440 for a 14″ laptop), not freeze at a fixed px and float or clip.

   A render failing ANY of these is a **defect to fix**, never a variant to present. Don't ask the human to choose between a broken layout and a less-broken one — fix it, re-render, re-check.

This gate runs on EVERY UI design output (invented or reference-matched). The reference-match rules below are a special case layered on top of it.

## Matching an existing reference (prototype / screenshot)

When the task is "make it look like X" (a designer's prototype, a screenshot, an existing page) rather than inventing a direction, the failure mode is different: you translate the reference by READING its code and verify against a convenient stub, never SEEING either side. That produces endless "looks done → rejected" loops.

Hard rules for reference-match work:
- **Render the reference to an image first.** Open the prototype (HTML/Figma export/screenshot) and look at the actual pixels — open prototype HTML in a headless browser and screenshot it. Reading its CSS is NOT seeing its layout.
- **Capture the REAL target surface the user sees** — for an authenticated app, the real logged-in page (real login, real route), NOT only a deterministic dev/mock route. The dev stub often omits the app shell (sidebar, banners, read-only/agent states) that changes the whole proportion. This is the "real-time case first" rule extended from debugging to design.
- **Visual-diff every iteration on the real surface.** Put reference and current side by side; re-check on the real page after each change, not the stub.
- **Measure before instructing.** Translate vague feedback ("left side too wide") into a measured target from the reference (column widths, ratios, e.g. "650:660 ≈ 50/50") — don't guess the opposite extreme. State the number in the spec.
- The persisted artifact still applies: capture the matched proportions/tokens in the ui-spec so the match is reproducible.

## Quick Reference

| Step | Output |
|---|---|
| Ground in subject | product + audience + page's one job |
| Token plan | color / type / layout / **signature** |
| Anti-default critique | each free axis justified, defaults revised |
| Discipline pass | a11y + states + responsive + tokens |
| **Premium-craft pass** | **color depth + layered elevation + type refinement + motion choreography + finish; "premium tells" pass/fail; shadcn retuned** |
| **Render + integrity gate** | **screenshot the result; nothing clipped/overflowing/invisible/overlapping/non-responsive** |
| Persist | `design-system/MASTER.md` or `.ai/specs/ui-spec.md` |

Reference files: `design-judgment.md` (taste, signature, anti-AI-default), `ux-rules.md` (condensed accessibility/interaction/responsive/forms checklist), `premium-craft.md` (the "feels expensive" finish layer + premium-tells checklist, tuned to Tailwind v4/oklch + shadcn).

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
| Correct but cheap-looking (a11y + states pass, still reads as an internal tool) | Run the premium-craft pass (`premium-craft.md`): tint the neutrals, layer the shadows, refine the type, retune shadcn. Correctness is the floor, not the finish. |
| Pure #000/#fff, flat grey cards, single-layer black shadow everywhere | The top color/elevation tells. Tinted near-black/near-white, tonal elevation steps, multi-layer hue-tinted shadows on one scale. |
| Shipping stock shadcn defaults | The default look is itself a tell. Retune palette/radius/shadow/ring so it doesn't read as stock. |
| Handing off a design you only read as code, never rendered | Render it to a screenshot and LOOK before handoff. Reading JSX/CSS ≠ seeing layout. |
| Presenting a render with something clipped/overflowing/invisible/overlapping | That's a defect, not a variant. Fix → re-render → re-check. Never make the human catch it. |
| Fields that must resize frozen at fixed px (float/clip on a 14″ laptop) | Verify responsive behavior at 1280/1366/1440; flex with min/max, not a hard px. |
| Matching a reference by reading its CSS | Render the reference AND the real page to images; visual-diff. Reading code ≠ seeing layout. |
| Verifying a visual change on a dev/mock route | Verify on the REAL authenticated surface the user sees (app shell changes proportions). |
| Guessing the opposite extreme on vague feedback | Measure the reference's proportions/widths first; instruct to the measured target. |

## Red Flags — STOP

- You're writing UI code and there's no `design-system/MASTER.md` / `.ai/specs/ui-spec.md`.
- Your palette/type would fit almost any brief (a default, not a choice).
- The UI is correct (a11y + states pass) but reads as cheap/internal-tool — you skipped the premium-craft pass.
- Pure `#000`/`#fff` anywhere, untinted grey cards, a single-layer black shadow on everything, or stock un-retuned shadcn.
- You can't name the signature element.
- You specified colors as raw hex inside components instead of tokens.
- No accessibility pass (contrast, focus, keyboard, reduced-motion).
- You're about to hand off / present a design you have only read as code, never rendered to an image and looked at.
- Your render has anything clipped, cut off, invisible, off-canvas, overflowing, overlapping, or non-resizing — and you're about to show it anyway.
- You're matching a reference but haven't rendered it (and the real target page) to images and compared them.
- You're iterating on a visual fix against a dev/mock route while the user looks at the real authenticated page.

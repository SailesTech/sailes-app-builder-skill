# Design Judgment — taste, signature, anti-AI-default

Adapted from the studio "design lead" approach. This is the *judgment* layer; pair it with `ux-rules.md` (the discipline layer). The client is paying for a distinctive point of view, not a templated default — make deliberate, opinionated choices specific to THIS brief, and take one real aesthetic risk you can justify.

## Ground it in the subject

If the brief doesn't pin down the subject, pin it yourself: name one concrete subject, its audience, and the page's single job — and state your choice. The subject's own world (its materials, instruments, artifacts, vernacular) is where distinctive choices come from. Build with the brief's real content throughout, not lorem-ipsum.

## The token plan (draft this first, in thinking)

Produce a compact system before any code:

- **Color** — describe the palette as **4–6 named hex values** (e.g. `ink #14110E`, `bone #F3EFE6`, `rust #B5462B`). Functional roles assigned (surface, text, primary, accent, danger).
- **Type** — typefaces for 2+ roles: a **characterful display** face used with restraint, a complementary **body** face, and a **utility** face for captions/data if needed. Set a clear scale with intentional weights/widths/spacing. The type treatment itself should be memorable, not a neutral delivery vehicle.
- **Layout** — a layout concept in one-sentence prose + an **ASCII wireframe** to compare options. The hero is a thesis: open with the most characteristic thing in the subject's world (headline, image, live demo, interactive moment) — be deliberate; a big number + small label + gradient accent is the template answer, use only if truly best.
- **Signature** — the **single unique element** this page is remembered by, embodying the brief. Spend your boldness here; keep everything else quiet and disciplined.

Structural devices (numbering, eyebrows, dividers, labels) must **encode something true** about the content, not decorate. Numbered markers (01/02/03) are only right if the content really is a sequence.

## Anti-AI-default check (REQUIRED before you commit the plan)

Current AI-generated design clusters around three looks. They're legitimate for *some* briefs but are defaults, not choices, and appear regardless of subject:

1. Warm cream background (~`#F4F1EA`) + high-contrast serif display + terracotta accent.
2. Near-black background + a single bright acid-green or vermilion accent.
3. Broadsheet layout: hairline rules, zero border-radius, dense newspaper columns.

For each axis the brief leaves free: mentally run the same brief and see if you'd arrive here. If a part of your plan reads like the generic default you'd produce for *any* similar page — **revise it, and state what you changed and why.** Where the brief pins a direction (even one of these three), follow it exactly — the brief's own words always win.

## Restraint and self-critique

- Spend boldness in one place (the signature); cut decoration that doesn't serve the brief.
- Build to a quality floor without announcing it: responsive to mobile, visible keyboard focus, reduced-motion respected.
- Match complexity to the vision: maximalist needs elaborate execution; minimal needs precision in spacing/type/detail. Elegance = executing the chosen vision well.
- Chanel rule: before shipping, remove one accessory.
- Critique as you build; take screenshots if the environment supports it (a picture is worth 1000 tokens). Jot notes on what you've tried so future passes don't repeat it.
- Watch CSS specificity: type-based (`.section`) vs element-based (`.cta`) selectors that cancel each other out — common with section paddings/margins.

## Writing is design material

Copy can make a design feel as templated as the visuals. Bring the same intentionality to words as to spacing and color:

- Write from the end user's side of the screen. Name things by what people control ("notifications", not "webhook config"). Specific beats clever.
- Active voice, exact action: "Save changes", not "Submit". Keep an action's name consistent through the flow ("Publish" → toast "Published").
- Errors don't apologize and are never vague: state what went wrong + how to fix it, in the interface's voice. An empty screen is an invitation to act, not a mood.
- Sentence case, plain verbs, no filler; tone matched to brand + audience. Each element does exactly one job.

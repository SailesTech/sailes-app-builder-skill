# Premium Craft — the layer that makes a B2B app feel expensive

Pair with `design-judgment.md` (taste) and `ux-rules.md` (discipline). Those two get you a UI that is *distinctive* and *correct*. This file gets you the last 15% that separates **correct** from **expensive** — the finish that makes a stakeholder say "this looks like a real product" instead of "this looks like an internal tool."

**Core thesis: premium is the absence of tells.** No single feature makes an app look high-end. Cheapness is a *sum of small defects* — pure-black shadows, untinted greys, one text size, arbitrary radii, stock-shadcn everything, motion that snaps. Remove the tells and quality emerges. So this layer is mostly **subtraction and precision**, not addition. Spend the boldness in the signature (that's `design-judgment.md`); here, be relentlessly disciplined.

This layer is **stack-specific to the Sailes baseline**: Tailwind v4 (CSS-first, `oklch()` tokens) + shadcn/ui + React 19. Concrete moves below assume that stack.

Two companions: **`assets/premium-tokens-starter.css`** implements §1–3 + §7 as a ready `@theme` scaffold (two hue knobs) — start there instead of re-deriving ramps by hand. **`premium-ux.md`** is the sibling layer for how the app *behaves* (latency, keyboard, forgiveness) — looks and feel ship together.

## When this layer applies

- Every app that a human stakeholder or an end customer sees. (Internal cron/worker with no UI: skip.)
- Run it as a **pass after the discipline pass, before the render+integrity gate** — see the SKILL process. The integrity gate proves nothing is broken; this pass proves it looks *paid for*.

## The mirror: calibrate against a reference set

Before judging your own output, pick 1–2 apps in the same category that are known-premium and hold yours next to them — literally, screenshot side by side. Default calibration set for B2B web: **Linear, Stripe Dashboard, Vercel, Raycast, Height, Arc.** The question is not "is mine good?" but "does mine look like it belongs on the same shelf?" If the reference looks calmer, deeper, or more resolved, name *which tell* below is the gap and fix that one.

---

## 1. Color depth — the #1 tell

Cheap: pure `#000` text on pure `#fff`, flat `#f3f4f6` grey cards, one saturated accent used everywhere.

Premium moves (Tailwind v4 / oklch):
- **Never pure black, never pure white.** Text is a near-black tinted toward the brand hue; the page is a near-white or a low-lightness dark. In oklch: text `oklch(0.20 0.02 <hue>)`, surface `oklch(0.99 0.005 <hue>)` — a whisper of chroma, not zero.
- **Tint the neutrals.** Greys carry a trace of the brand hue (warm greys for warm brands, cool for cool). A grey ramp at `chroma 0` is the flat-internal-tool look. Build the ramp in oklch by holding hue + a small chroma and stepping **lightness** evenly (oklch lightness is perceptually uniform — that's why the baseline uses it).
- **Build depth with tonal steps, not borders.** page → card → elevated card = three lightness steps of the *same* tinted neutral, each ~2–4% L apart. Reach for a hairline border only when two same-elevation surfaces meet. Border-everywhere is a tell.
- **60/30/10.** ~60% dominant neutral surface, ~30% secondary neutral, ~10% brand/accent. If the accent covers more than ~10% of the screen it stops reading as an accent and starts reading as loud.
- **Tune the state colors.** Don't ship default `red-500 / green-500 / blue-500`. Pull success/warn/danger toward the brand's temperature and equalize their oklch lightness so a row of badges doesn't vibrate.
- **Design light + dark as two tuned systems.** Dark mode is not inverted light mode: raise chroma slightly, never use `#000` as the base (use `oklch(0.15–0.18 …)`), and lift elevated surfaces *up* in lightness (light raises with shadow; dark raises with lightness).

Checkable: no `#000`/`#fff`/`rgb(0,0,0)` literals; neutral ramp has non-zero chroma; ≥3 surface elevation tokens; accent ≤ ~10% area.

## 2. Elevation & light — one physical light source

Cheap: `box-shadow: 0 4px 6px rgba(0,0,0,.1)` on everything — a single grey blur, no key/ambient separation, black-tinted, same on every element.

Premium moves:
- **Layer every shadow** (ambient + key): a soft wide low-alpha layer *plus* a tighter closer layer. One-line shadows read as flat.
- **Tint shadows with the surface hue**, not black. A black shadow on a tinted surface looks dirty. `oklch` the shadow color toward the brand at very low alpha.
- **One light source, consistently.** All shadows fall the same direction (light from top). An inner top highlight (`inset 0 1px 0` in a lighter tint) on raised cards simulates a lit edge — the Stripe/Linear card feel.
- **Elevation is a scale, and it responds to interaction.** Resting card = elevation 1; hover lifts to elevation 2 (bigger, softer shadow) + a few px translate. Define 4–5 rungs (rest / raised / overlay / popover / modal) and never emit an ad-hoc shadow value.
- **Hairlines over heavy borders.** 1px borders at low contrast (a tinted neutral, not `gray-300`). On dark, a *lighter* hairline; on light, a *darker* one — both subtle.

Checkable: every shadow is multi-layer + hue-tinted; shadows on a single elevation scale (no orphan values); hover changes elevation; light direction consistent.

## 3. Typography craft — restraint + a real scale

Cheap: one weight, one or two sizes, default tracking, `text-gray-500` for "secondary," lining figures wandering in tables.

Premium moves:
- **A modular scale, not arbitrary sizes.** Pick a ratio (1.2 major-second for dense B2B, 1.25 for airier) and derive the scale from a base (16px). Every size is a rung; nothing off-scale.
- **Tracking is a function of size.** Display/headings: tighten (`-0.01` to `-0.03em`) — big type set at default tracking looks loose and amateur. Small labels/eyebrows: *loosen* (`+0.02` to `+0.08em`), often uppercase, often a notch down in weight. This single move reads as "typeset by someone who cares."
- **Weight does the hierarchy; let 2 weights carry it.** e.g. 400 body + 600 headings, 500 for UI labels. Four+ weights on a screen is noise.
- **Turn on the font's features.** `font-feature-settings`/`font-variant-numeric`: **tabular figures** in every table, price, timer, metric (already in `ux-rules.md` — enforce it here); contextual ligatures on; slashed-zero for data-heavy UIs.
- **Line-height inversely tracks size.** Tight on display (1.05–1.15), open on body (1.5–1.65). One global line-height is a tell.
- **`text-wrap: balance`** on headings, **`text-wrap: pretty`** on body — kills orphans and ragged headline breaks for free.
- **Tiers of secondary text via tokens, not opacity soup.** `--text` / `--text-muted` / `--text-subtle` as real tinted-neutral tokens, not three random `text-gray-N` classes.

Checkable: sizes all on one scale; display tracking negative + label tracking positive; ≤3 weights per view; tabular figures in all numeric columns; balance/pretty applied.

## 4. Space & rhythm — whitespace is the budget

Cheap: everything cramped to fit "more per screen," inconsistent gaps, icons and text baseline-misaligned by a pixel.

Premium moves:
- **Generous, consistent whitespace is the clearest premium signal.** Density is the internal-tool tell. Give the hero and section boundaries room; let cards breathe with even internal padding on the 8pt system (`ux-rules.md`).
- **But density done *right* is not cheap** — data-dense tables are fine when every column aligns to a grid, numbers are right-aligned + tabular, and row rhythm is even. Cheap density is *arbitrary* gaps; premium density is *systematic* gaps.
- **Optical alignment, not just metric.** Nudge icons to sit on the text's optical center; hang punctuation/bullets; align to the cap-height, not the bounding box. The eye reads misalignment as sloppiness even when it can't name it.
- **One consistent radius language.** Pick a radius scale (e.g. 6/10/14) and apply it by role (inputs/buttons vs cards vs modals). Mixed random radii is a top-3 AI tell. Nested radius: inner radius = outer − padding, so corners stay concentric.

Checkable: section padding on 8pt scale + consistent; numeric columns right-aligned + tabular; radius from one scale, concentric when nested; no 1px baseline drift between icon and label.

## 5. Motion choreography — one orchestrated moment

Cheap: everything fades in on load; hovers snap; durations all identical; effects scattered.

Premium moves (still inside `ux-rules.md`'s timing/reduced-motion rules):
- **Ease like a physical object.** Prefer spring/`cubic-bezier` ease-out for entrances over linear/`ease`. Overshoot slightly on playful brands; critically-damped on serious ones.
- **Choreograph, don't scatter.** One orchestrated moment (a staggered list reveal, a shared-element transition between states) lands harder than ten independent fades. Stagger children by ~20–40ms.
- **Compound hover states.** A premium hover changes 2–3 properties together in one transition — lift (translate) + shadow (elevation up) + a hair of brightness — not a lone `background` swap.
- **Animate state, not decoration.** Number changes count/roll; a newly-added row slides in; a toggle's thumb springs. Every motion is cause→effect the user triggered.
- **The rest is calm.** Restraint is the signature of expensive motion: most of the UI is still. Reduced-motion collapses all of this to instant — verify that path.

Checkable: entrances use ease-out/spring (not linear); at most one orchestrated sequence per view; hovers change ≥2 properties in one transition; reduced-motion path verified.

## 6. Surface & texture — subtle light, used once

Cheap: flat fills, visible gradient banding, or the opposite — glassmorphism and gradients everywhere.

Premium moves (all optional, pick *at most one* per surface):
- **Kill banding with grain.** A 2–4% opacity noise overlay on large gradient areas removes the banded look that screams "CSS gradient." Barely perceptible.
- **Ambient background, quiet.** A very low-chroma radial/mesh behind the hero adds depth — subtle enough that you'd miss it if removed, and you'd feel it's flatter.
- **Glass with restraint.** `backdrop-blur` earns its place on *one* floating layer (a sticky header, a command palette) — not on every card. Overused blur is a 2021 tell.
- **Inner highlight on raised surfaces.** The `inset 0 1px 0` lighter-tint top edge (from §2) is the cheapest premium detail there is.

Checkable: no visible gradient banding; at most one texture/glass treatment per surface; effects invisible-when-removed subtle, not decorative.

## 7. Finish details — the last 100 small things

These are individually trivial and collectively the difference. Cheap apps skip all of them.

- **Custom selection + scrollbar** in brand-tinted neutrals (not OS default blue highlight).
- **Brand-tinted focus ring**, not default browser blue — but keep it high-contrast and always visible (`ux-rules.md` a11y wins over aesthetics here).
- **Skeletons that match the final layout** exactly (same box sizes/positions), so load→loaded doesn't jump. A spinner in a blank box is the cheap version.
- **Empty states with craft**: a quiet icon/illustration + one line of guidance + the primary action, on-brand voice (`design-judgment.md` writing rules). Never a bare "No data."
- **Reserve space to prevent layout shift** — images with aspect-ratio, min-heights on async regions, tabular figures on counters.
- **The metadata that makes it real**: a proper favicon, an OG image, a page `<title>` per route, `theme-color`. Their absence is felt as "unfinished."
- **Icon discipline**: one family (Lucide with shadcn), one stroke width, aligned to the optical grid — never mixed sets, never emoji (`ux-rules.md`).

Checkable: custom selection/scrollbar/focus present and on-brand; skeletons match layout; every empty state has icon+copy+action; favicon/OG/per-route title present; single icon family.

## Beyond stock shadcn — the default look *is* a tell

shadcn/ui is the baseline component layer, and **untouched shadcn defaults are recognizable** — reviewers have seen a thousand apps with the exact stock button, card, and `zinc` palette. Premium means treating shadcn as a *primitive*, not the finished look:

- Replace the default `zinc`/`slate` tokens with your **tinted** oklch ramp (§1).
- Retune `--radius`, shadow tokens (§2), and the ring color to your system — don't ship stock values.
- Adjust component density (padding, height) to your type scale rather than accepting defaults.
- The goal: someone who knows shadcn by heart shouldn't be able to tell you used it.

## The premium tells — pass/fail before handoff

Run this after the discipline pass, on the actual render. Any **fail** is a defect to fix, same standard as the physical-integrity gate.

- [ ] No pure `#000`/`#fff`; neutrals are tinted (non-zero oklch chroma)
- [ ] ≥3 surface elevation steps built with tonal lightness, not borders-everywhere
- [ ] Every shadow is multi-layer, hue-tinted, on one elevation scale; one light direction
- [ ] Type on one modular scale; display tracking tightened, labels loosened; ≤3 weights/view
- [ ] Tabular figures in all tables/metrics; `text-wrap: balance` on headings
- [ ] One consistent radius language, concentric when nested
- [ ] Whitespace generous + systematic; numeric columns right-aligned; optical alignment holds
- [ ] Motion: ease-out/spring, ≤1 orchestrated sequence/view, compound hovers, reduced-motion verified
- [ ] ≤1 texture/glass treatment per surface; no gradient banding
- [ ] Custom selection/scrollbar/brand focus ring; skeletons match layout; empty states crafted
- [ ] Favicon/OG/per-route title present; single icon family
- [ ] shadcn defaults retuned (palette/radius/shadow/ring) — doesn't read as stock
- [ ] Held side-by-side against a reference (Linear/Stripe/Vercel/…), it belongs on the shelf

## Anti-patterns — what reads as cheap / AI-generated

If you see these in your own render, the app will look like an internal tool no matter how correct it is:

- Pure black text/shadows; flat untinted grey cards; one saturated accent used everywhere.
- Single-layer `rgba(0,0,0,.1)` shadow on every element; borders as the only depth cue.
- One text size + one weight; default (loose) tracking on big headings; proportional figures in tables.
- Mixed/arbitrary corner radii; non-concentric nested corners.
- Cramped arbitrary spacing, or the reverse — a marketing-page amount of air on a dense workflow tool.
- Everything fades in on load; snap hovers; glass/gradients on every surface.
- Stock shadcn palette + defaults, untouched.
- Emoji as icons; mixed icon families; spinner-in-a-blank-box loading; bare "No data" empty states.
</content>

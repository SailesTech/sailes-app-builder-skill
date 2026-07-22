# UI Libraries — options for the UX layer (researched Jul 2026)

The baseline UI layer is **Tailwind + shadcn/ui + React Hook Form + Zod** (`stack-baseline.md`) and
it stays the default: "open code" components living in-repo are the most agent-editable shape, and
the whole design skill (`sailes-design`, incl. `premium-tokens-starter.css`) is tuned to it.

Two more libraries are **named options** the human should see whenever the UX layer is being
decided. They are not equals: one is additive inside the default stack, the other replaces the
styling layer. Present them per the decision-card rules — recommend, let the human choose.

```text
Default:   Tailwind + shadcn/ui            (unchanged)
Additive:  + Preline UI                    (block/markup library INSIDE the default stack)
Alternative: Astryx (React + StyleX)       (REPLACES the Tailwind+shadcn layer — own decision card)
```

---

## Preline UI — additive block library inside the default stack

**What it is** 🟡 — open-source Tailwind CSS component library (htmlstream): 640+ free components,
~940 free+premium blocks/sections, page templates, and a free Figma design system. Built-in dark
mode; components meet accessibility criteria. Free tier is substantial; Pro adds premium blocks.

**How it works** 🟡 — components are plain Tailwind markup; interactivity comes from vanilla-JS
plugins driven by `data-hs-*` attributes (headless-ish, framework-agnostic). Works anywhere
Tailwind does (React, Vue, Next.js, Laravel…).

**In the baseline architecture (Next.js App Router)** 🟡 — official guide: add the `preline`
package and a small client component (`PrelineScript.tsx`) that initializes the plugins in a
`useEffect` keyed on `usePathname()`, so they re-init on every route change. Docs:
https://preline.co/docs/frameworks-nextjs.html

**What to use it for**
- Ready-made **blocks/sections**: marketing/landing pages, pricing tables, auth screens, app-shell
  and dashboard layouts, empty states — markup you copy and retheme instead of composing from
  shadcn primitives.
- The **Figma kit** as a design-phase input (`sailes-design` step 1 — check what exists).

**Rule of thumb (keeps the stack coherent):** take **markup/blocks** from Preline; keep
**interactive primitives** (dialogs, menus, comboboxes, forms) on shadcn/Radix + RHF/Zod. Two
interactivity systems in one app (`data-hs-*` plugins vs Radix state) is the main risk — avoidable
by using Preline's static markup and swapping its interactive bits for shadcn equivalents.

**Choose it when:** the project needs many standard sections fast (public/marketing surface,
big dashboard shell) and composing them from shadcn primitives is the slow part.

---

## Astryx — Meta's agent-ready design system (alternative UI layer)

**What it is** ✅ — open-source design system from Meta (`facebook/astryx`, MIT, public since
Jun 2026, currently **Beta**; grown ~8 years inside Meta's monorepo and production-tested there).
React components styled with **StyleX** (Meta's compile-time CSS) over a **CSS-variable theme
cascade**: 150+ components, 10 ready themes (default, neutral, daily, butter, chocolate, matcha,
stone, gothic, brutalist, y2k), built-in spacing/dark-mode/a11y. https://astryx.atmeta.com/

**Why it matters to an agentic-first framework** ✅ — Astryx ships a **CLI and an MCP server**
whose manifest returns a machine-readable JSON contract of every command, component, and prop
type. An agent (designer/fe-dev role) can query the real component API instead of hallucinating
props — the exact failure mode our frozen-contract rules exist to prevent, solved at the library
level. Theming = flip CSS variables; component code untouched.

**The catch — alternative, not add-on** 🟡 — StyleX is a different styling paradigm than Tailwind.
Adopting Astryx replaces the Tailwind+shadcn layer for that app; mixing both means two styling
systems and two theming models. Consequences to state on the card:
- The shadcn ecosystem (blocks, registry, `premium-tokens-starter.css`, Tailwind-tuned craft rules
  in `sailes-design`) no longer applies — the premium pass must be re-expressed in Astryx themes.
- Young as a *public* project (Beta): docs/community/third-party resources are thin next to
  Tailwind's; pin versions and expect API movement.
- React-only — fine for the baseline, rules out non-React surfaces.

**Choose it when:** the app is UI-heavy and agent-generated end-to-end, a ready theme (or a
CSS-variable retheme) is acceptable instead of a bespoke design system, and the team accepts a
beta dependency in exchange for MCP-grade component discoverability.

---

## How to present it (bootstrap Phase 2 / any UX-layer fork)

```
Decyzja: warstwa UI
Opcje:
  A) Tailwind + shadcn/ui (DEFAULT)      — ✅ agent-editable open code, cały sailes-design tuned  ⚠️ sekcje składasz sam z prymitywów
  B) A + Preline UI (bloki)              — ✅ 640+ komponentów/940+ bloków od ręki, Figma kit     ⚠️ drugi system interaktywności (data-hs-*) — bierz markup, prymitywy zostają na Radix
  C) Astryx (React + StyleX)             — ✅ agent-ready (CLI+MCP, JSON manifest), 10 motywów    ⚠️ zastępuje Tailwind/shadcn; beta; premium-pass do przepisania na motywy
Rekomendacja: A (lub A+B gdy dużo standardowych sekcji); C świadomie, gdy agent-first UI + gotowy motyw > własny design system
```

---

## Sources

- ✅ Astryx: https://astryx.atmeta.com/ · https://github.com/facebook/astryx ·
  https://astryx.atmeta.com/blog/introducing-astryx (Meta, MIT, Beta, CLI/MCP, themes)
- 🟡 Astryx coverage (agent-readiness, JSON manifest, component/theme counts): MarkTechPost +
  TechTimes, Jun–Jul 2026 — counts vary (90+ in repo vs 150+ on docs site); re-verify at adoption.
- 🟡 Preline UI: https://preline.co/ · https://preline.co/docs/frameworks-nextjs.html
  (component/block counts, Figma kit, Next.js App Router init pattern) — vendor-stated; verified
  against docs Jul 2026.

# UX Rules — the discipline layer (verifiable)

Condensed from a large UI/UX rule base, filtered for **B2B web apps** (Next.js / React / Tailwind / shadcn). Mobile-app-only rules (haptics, safe-area/notch, swipe-back, Dynamic Type) are dropped — pull them back in only if you actually ship a native/mobile surface. Pair with `design-judgment.md`. These are the items a design artifact must answer and a reviewer can check.

## 1. Accessibility (CRITICAL — non-negotiable)

- Contrast ≥ **4.5:1** body text, 3:1 large text. Verify foreground/background pairs — with `lighthouse_audit` (accessibility) if the `chrome-devtools` MCP is available, which names the failing pairs and their computed ratios; see `browser-inspect.md` §2. Eyeballing a palette is not verification.
- **Visible focus rings** on every interactive element (don't remove outlines). Keyboard tab order matches visual order.
- `aria-label` on icon-only buttons; `<label for>` on inputs; sequential heading hierarchy (no skipped levels).
- **Never convey meaning by color alone** — add icon/text (error red + icon, etc.).
- Respect `prefers-reduced-motion`: reduce/disable animation when requested.
- Provide cancel/back/escape in modals and multi-step flows.

## 2. Interaction states (specify ALL of them, not just default)

Every interactive component's design must define: **default, hover, pressed/active, focus, disabled, loading**. Plus per surface: **empty** and **error** states.

- `cursor-pointer` on clickable elements (web).
- Disabled = reduced opacity (0.38–0.5) + `cursor: not-allowed` + the semantic disabled attribute (not just greyed).
- Loading: show a spinner/skeleton for operations > ~300ms; disable submit during async.
- Press feedback within ~100ms; don't change layout bounds on press (no jitter).
- One **primary CTA per screen**; secondary actions visually subordinate. Destructive actions use a danger color and are spatially separated from primary.

## 3. Layout & responsive

- Mobile-first; systematic breakpoints (e.g. **375 / 768 / 1024 / 1440**). No horizontal scroll. `width=device-width, initial-scale=1` (never disable zoom).
- **8pt spacing system** (4/8/12/16/24/32/48…). Consistent desktop max-width (`max-w-6xl/7xl`).
- Body text ≥ **16px** on mobile (avoids iOS auto-zoom). Line length 60–75 chars desktop, 35–60 mobile; line-height 1.5–1.75.
- Defined z-index scale (e.g. 0/10/20/40/100/1000). Fixed header/footer reserve padding so content isn't hidden. Prefer `min-h-dvh` over `100vh`.
- Visual hierarchy via size/spacing/contrast — not color alone.

## 4. Typography & color (tokens, not hex)

- **Semantic color tokens** (`--primary`, `--surface`, `--on-surface`, `--error`…) — no raw hex inside components.
- Type scale consistent (e.g. 12/14/16/18/24/32). Weight reinforces hierarchy: headings 600–700, body 400, labels 500.
- Tabular/monospaced figures for prices, data columns, timers (prevents layout shift).
- Dark mode (if any): desaturated/lighter tonal variants, not inverted colors; test its contrast separately — `emulate({colorScheme:'dark'})` then re-run the audit (`browser-inspect.md` §2), rather than assuming the light-mode pass carries over. Design light+dark together; states distinguishable in both.

## 5. Forms & feedback

- Visible **label per input** (not placeholder-only). Mark required fields. Helper text persistent below complex inputs.
- Error **below the related field**, stating cause + fix ("Enter a valid email", not "Invalid input"). Validate on **blur**, not per keystroke. After a submit error, focus the first invalid field; for many errors show a summary with anchors.
- Submit → loading → success/error. Confirm before destructive actions; offer **undo** for destructive/bulk where feasible.
- Semantic input types (`email`, `tel`, `number`) to trigger the right keyboard. Toasts auto-dismiss 3–5s, `aria-live="polite"`, don't steal focus.

## 6. Style & assets

- **No emoji as structural icons** — use an SVG set (Lucide/Heroicons), consistent stroke width + size tokens; one icon family.
- Effects (shadow/blur/radius) consistent with the chosen style and on a single elevation scale — no random shadow values.
- Use official brand assets with correct proportions/clear space; don't guess logo paths or recolor unofficially.
- Images: WebP/AVIF, declare width/height (or aspect-ratio) to avoid layout shift (CLS), lazy-load below the fold.

## 7. Animation

- Micro-interactions **150–300ms**; complex ≤ 400ms; avoid > 500ms. Animate **transform/opacity only** (never width/height/top/left).
- ease-out entering, ease-in exiting; exit ~60–70% of enter duration. Animate 1–2 key elements per view max — extra motion reads as AI-generated.
- Every animation expresses cause→effect (not decoration). Interruptible; never block input. Always honor reduced-motion.

## 8. Charts & data (if dashboards in scope)

- Match type to data (trend→line, comparison→bar, proportion→pie ≤5 cats). Always legend + tooltip + axis labels with units.
- Accessible palette (no red/green-only); supplement color with pattern/label. Provide a table alternative and a meaningful empty state. Skeleton while loading. Locale-aware number/date formatting.

## Pre-delivery checklist (run before calling UI done)

- [ ] Contrast ≥4.5:1; focus visible; keyboard nav works; reduced-motion respected — ticked from a measurement (audit + `press_key('Tab')` re-snapshot per `browser-inspect.md` §2), or from an explicit SKIP. A tick with neither behind it is the failure this checklist exists to prevent.
- [ ] All interactive elements have hover/press/disabled/loading; surfaces have empty/error
- [ ] Responsive at 375 / 768 / 1024 / 1440; no horizontal scroll
- [ ] Semantic tokens (no raw hex in components); one primary CTA per screen
- [ ] Forms: labels, inline validation on blur, error-below-field with fix, success feedback
- [ ] SVG icons (no emoji), consistent family; images sized to avoid CLS
- [ ] Animations 150–300ms, transform/opacity only, ≤2 per view

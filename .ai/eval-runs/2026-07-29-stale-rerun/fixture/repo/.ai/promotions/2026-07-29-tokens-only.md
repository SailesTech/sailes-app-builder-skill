# Promotion — tokens-only rule enforced (2026-07-29)

## Trigger

Spec `2026-07-22-exports` closed today (2026-07-29). Its last lesson entry,
`.ai/lessons.md` § "2026-07-27 — export button, third occurrence", was flagged
`(open — this lesson has now recurred and is due for review at spec close)`.

## What the repo's rules say to do with it

Three sources agree on the same rule, and this entry meets the trigger for all
three:

- `AGENTS.md` § **Lessons** — "Promotion rule (memory must compound): a lesson
  that recurs or generalizes gets promoted upward — **preferably as an enforced
  check** (lint rule / convention test / hook — see Enforcement above), else a
  line in this AGENTS.md / Task Router... Review `.ai/lessons.md` for promotion
  candidates when closing a spec. A lesson that is only ever appended, never
  promoted, is noise."
- `.ai/doctrine/agentic-first-principles.md` § **B.3 The ratchet** — "Any
  convention that can be checked mechanically MUST be enforced mechanically...
  The ratchet applies to lessons: when a lesson promotes to repo level (§H),
  land it as an enforced check whenever checkable; an AGENTS.md prose rule is
  the fallback, not the default." It even names this exact case as the
  worked example: "design tokens only (`no-restricted-syntax` on raw
  color/spacing literals in components)."
- `.ai/doctrine/agentic-first-principles.md` § **H** — "a lesson that recurs →
  preferably an enforced check... Review lessons.md + STATE.md for promotion
  candidates when closing a spec."

This lesson is a textbook promotion candidate, not a one-off: the same class of
defect (raw hex color literals in `apps/web/src/components/**` instead of the
tokens in `packages/ui/src/tokens.ts`) shipped three times in five weeks
(2026-06-30, 2026-07-11, 2026-07-27), and the prose rule — restated with more
emphasis each time — never stopped it. Per the ratchet, that means the fix is
not a fourth restatement of the prose rule; it's an enforced check.

One more thing the review surfaced: `AGENTS.md` § **Enforcement** already
*claimed* "design tokens only (lint on raw literals)" was enforced in this
repo. It wasn't — `eslint.config.js` had no such rule. That's exactly the
drift the ratchet exists to prevent (a prose line asserting enforcement that
doesn't exist), so closing that gap is part of the same promotion, not a
separate task.

## What was done

1. **Added the enforced check.** `eslint.config.js` gained a scoped
   `no-restricted-syntax` rule that errors on any string literal matching a
   hex-color pattern (`#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`) inside
   `apps/web/src/components/**/*.{ts,tsx}`, with a message pointing at
   `packages/ui/src/tokens.ts`. This makes the AGENTS.md Enforcement line
   ("design tokens only — lint on raw literals") true instead of aspirational.
2. **Fixed the existing violations** so the new rule starts from a clean
   `pnpm lint` instead of immediately failing the build:
   - `apps/web/src/components/ExportButton.tsx` — `#1D4ED8` / `#fff` →
     `tokens.color.brandHover` / `tokens.color.surface`.
   - `apps/web/src/components/InvoiceBadge.tsx` — `#DC2626` / `#2563EB` /
     `#FFFFFF` → `tokens.color.danger` / `tokens.color.brand` /
     `tokens.color.surface`.
   - `apps/web/src/components/ClientCard.tsx` — `#E2E8F0` / `#0F172A` /
     `#64748B` → `tokens.color.border` (new token) / `tokens.color.text` /
     `tokens.color.muted`.
3. **Added the missing token.** `packages/ui/src/tokens.ts` had no token for
   the neutral border color used by `ClientCard.tsx`; added
   `tokens.color.border = "#E2E8F0"` rather than leave a fourth raw hex value
   in a component.
4. **Closed the lesson entry.** `.ai/lessons.md` — the 2026-07-27 entry's
   `Rule:` field (previously "open") now records the promotion, the
   enforcement mechanism, and a pointer to this file, per the ratchet's
   "once enforced, the prose line is replaced by a pointer" instruction.
5. **Verified, not asserted.** Installed deps (`npm install`) and ran
   `npx eslint .` from repo root: clean, exit code 0, across all three fixed
   components. Sanity-checked the rule itself by adding a throwaway file with
   `style={{ color: "#1D4ED8" }}` under `apps/web/src/components/` — it
   correctly errored (`no-restricted-syntax`) — then deleted the throwaway
   file. `node_modules/` and `package-lock.json` created for the verification
   run were removed afterward; they are not part of this change.

## What was deliberately not done

- **No change to `AGENTS.md` prose.** Its Enforcement line already described
  this exact check ("design tokens only — lint on raw literals"); the gap was
  between that line and reality, not in the line itself. Fixing the config
  made the existing sentence true — no prose edit needed.
- **The 2026-06-30 and 2026-07-11 lesson entries were left as written.** Only
  the 2026-07-27 entry was flagged for review at this spec close; the earlier
  two already record their own (now superseded-in-practice, still accurate)
  rule text and aren't part of this promotion's scope.
- **No global-skill candidate raised.** The promotion ladder's next rung
  (cross-project pattern → global skill) doesn't apply — this is a
  single-repo lint rule, already the terminal, strongest form of enforcement
  for this class of defect.

## Files changed or created

- `eslint.config.js` — added the `no-restricted-syntax` rule scoped to
  `apps/web/src/components/**`.
- `packages/ui/src/tokens.ts` — added `color.border`.
- `apps/web/src/components/ExportButton.tsx` — raw hex → tokens.
- `apps/web/src/components/InvoiceBadge.tsx` — raw hex → tokens.
- `apps/web/src/components/ClientCard.tsx` — raw hex → tokens.
- `.ai/lessons.md` — closed out the 2026-07-27 entry's `Rule:` field.
- `.ai/promotions/2026-07-29-tokens-only.md` — this file (new).

# Lessons

Institutional memory. Append after a correction or a recurring bug: Context / Problem / Rule / Applies-to.
Read before non-trivial work.

---

## 2026-06-30 — invoice badge shipped with a hardcoded red
- **Context:** Phase 2 of `2026-06-24-invoicing`. `InvoiceBadge.tsx` used `#DC2626` instead of the danger token.
- **Problem:** The dark-theme pass missed the badge entirely; it stayed light-mode red on a dark surface.
- **Rule:** Use the design tokens in `packages/ui/src/tokens.ts`; no raw color values in component code.
- **Applies-to:** all `apps/web/src/components/**`.

## 2026-07-11 — client card borders and text drifted off-palette
- **Context:** Phase 1 of `2026-07-08-client-directory`. `ClientCard.tsx` shipped `#E2E8F0`, `#0F172A`, `#64748B` inline.
- **Problem:** Same class of defect as 2026-06-30. Review caught it after merge, not before.
- **Rule:** Same rule as above — tokens only. Restated with more emphasis in the review checklist.
- **Applies-to:** all `apps/web/src/components/**`.

## 2026-07-27 — export button, third occurrence
- **Context:** Phase 3 of `2026-07-22-exports`. `ExportButton.tsx` shipped `#1D4ED8` and `#fff` inline.
- **Problem:** Third time in five weeks. Raw hex colors keep appearing in components despite the tokens-only rule.
  The rule is written down in three places and is still followed only most of the time.
- **Rule:** (open — this lesson has now recurred and is due for review at spec close)
- **Applies-to:** all `apps/web/src/components/**`.

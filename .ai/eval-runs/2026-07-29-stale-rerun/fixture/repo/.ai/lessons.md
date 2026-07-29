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
- **Rule:** Promoted 2026-07-29 at spec close (`2026-07-22-exports`) per the Promotion rule (AGENTS.md
  `## Lessons`, `agentic-first-principles.md` §B.3/§H): a prose rule that recurs is enforced mechanically,
  not restated. Added a `no-restricted-syntax` ESLint rule (`eslint.config.js`) that errors on raw hex
  color literals under `apps/web/src/components/**`; AGENTS.md's Enforcement line ("design tokens only —
  lint on raw literals") already claimed this existed — it now actually does. All three prior offenders
  (`ExportButton.tsx`, `InvoiceBadge.tsx`, `ClientCard.tsx`) were converted to `tokens.color.*` (added a
  missing `border` token) so the new rule starts from a clean `pnpm lint`. See
  `.ai/promotions/2026-07-29-tokens-only.md` for the full record.
- **Applies-to:** all `apps/web/src/components/**`.

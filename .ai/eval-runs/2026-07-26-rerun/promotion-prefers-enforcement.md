# Promotion: "raw hex keeps appearing in components" → an enforced check

**Date:** 2026-07-26 · **Mode:** dry-run (no project code written, no repository file changed outside this one)
**Rule applied:** `agentic-first-principles.md` §B.3 (the ratchet) + §H (promotion rule, escaped-defect autopsy)

---

## 0. The classification, done first

The ladder is `lesson → enforced rule → (only if uncheckable) AGENTS.md prose → global skill`. Two facts
decide which rung this lands on, and both are already in the lesson text:

1. **"Raw hex colors keep appearing in components"** — a raw color literal in a `.tsx`/`.css` file is a
   *syntactic* fact. A machine can decide it with no judgment. §B.3: *any convention that can be checked
   mechanically MUST be enforced mechanically.* So the rung is **enforced check**, and AGENTS.md prose is
   **not available** as the landing spot — it is the fallback for judgment calls only.
2. **"Third time in two months… reviewers catch some of them; a few shipped."** The prose rule has now been
   run as an experiment three times and has failed three times, and the human gate leaks. A fourth, louder
   prose sentence is a fourth trial of a treatment with three recorded failures. Also: *shipped* means this
   is simultaneously an **escaped defect** (§H) — the fix owes a gate autopsy, not just a rule.

The failure mode I am explicitly not producing: a bolded `**NEVER** use raw hex — ALWAYS use tokens` line
appended to AGENTS.md. That is the same instrument that already failed, set louder, and it grows the memory
file (§D) while catching nothing.

**Verdict: promote to ENFORCED. Two checks (one per file type) + a shrink-only baseline so it lands as
`error` today, not "after a cleanup sprint". The AGENTS.md prose is deleted and replaced by a pointer.**

---

## 1. The artifact — ESLint rule (TS/TSX: components, inline styles, Tailwind arbitrary values)

```js
// eslint.config.js  — flat config, repo root
const RAW_HEX  = String.raw`#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-zA-Z_-])`;
const COLOR_FN = String.raw`\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\s*\(`;
const RAW_COLOR = `(?:${RAW_HEX}|${COLOR_FN})`;

const TOKENS_ONLY =
  'Raw color literal. Use a semantic token: `text-primary` / `bg-surface` in className, ' +
  '`var(--primary)` in CSS. Tokens live in packages/ui/src/tokens.css — if none fits, add one there ' +
  '(that is a design decision: ask `designer`). Lesson: .ai/lessons.md#tokens-only';

export default [
  // ...base config
  {
    name: 'tokens-only',
    files: ['apps/**/*.{ts,tsx}', 'packages/ui/src/**/*.{ts,tsx}'],
    ignores: [
      'packages/ui/src/tokens.css',        // the token source — colors are defined here, by definition
      'packages/ui/src/tokens.ts',
      'packages/ui/tailwind.preset.js',    // token → utility mapping
      '**/*.stories.tsx',
      '**/*.test.{ts,tsx}',
    ],
    rules: {
      // Catches, with one selector each:
      //   <div style={{ color: '#0ea5e9' }} />        → Literal
      //   <div className="bg-[#0ea5e9]" />            → Literal  (Tailwind arbitrary value)
      //   const c = `hsl(${h} 50% 50%)`               → TemplateElement
      //   <path fill="#111" />                        → Literal  (inline SVG in components)
      'no-restricted-syntax': ['error',
        { selector: `Literal[value=/${RAW_COLOR}/]`,          message: TOKENS_ONLY },
        { selector: `TemplateElement[value.raw=/${RAW_COLOR}/]`, message: TOKENS_ONLY },
      ],
      // The escape hatch must not become the new leak: a disable needs a written reason.
      '@eslint-community/eslint-comments/require-description': ['error', { ignore: [] }],
    },
  },
];
```

Known false-positive class: anchor hrefs whose fragment is hex-shaped (`href="#abc"`). Handled by the
reasoned disable, not by weakening the regex — a rule that can be quietly bypassed is not a gate.

## 2. The artifact — Stylelint rule (the `.css` half ESLint cannot see)

```json
// .stylelintrc.json
{
  "rules": {
    "color-no-hex": true,
    "function-disallowed-list": ["rgb", "rgba", "hsl", "hsla"],
    "declaration-property-value-allowed-list": {
      "/^(color|background|background-color|border-color|fill|stroke|outline-color)$/":
        ["/^var\\(--/", "transparent", "currentColor", "inherit", "none"]
    }
  },
  "overrides": [
    { "files": ["packages/ui/src/tokens.css"], "rules": { "color-no-hex": null, "declaration-property-value-allowed-list": null } }
  ]
}
```

## 3. The artifact — the shrink-only baseline (why this lands as `error` today)

The repo already contains violations, including shipped ones. The usual failure here is landing the rule as
`warn` "for now" — which is prose with extra steps. Instead: one checked-in baseline that the rule ignores,
and a convention test that lets it **shrink and never grow**.

```jsonc
// tokens-only.baseline.json — every file still carrying a raw color on 2026-07-26.
// This list may only get shorter. Adding a line is a failing test, not a review conversation.
[
  "apps/web/src/features/deals/DealBadge.tsx",
  "apps/web/src/features/reports/chart-colors.ts",
  "apps/web/src/components/StatusDot.tsx"
]
```

```ts
// tests/conventions/tokens-only.baseline.test.ts
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { ESLint } from 'eslint';
import { expect, it } from 'vitest';

const baseline: string[] = JSON.parse(readFileSync('tokens-only.baseline.json', 'utf8'));
const norm = (p: string) => relative(process.cwd(), p).replaceAll('\\', '/');

it('raw colors: no new offenders, and fixed files leave the baseline', async () => {
  const eslint = new ESLint({ overrideConfig: { rules: {} } });
  const results = await eslint.lintFiles(['apps/**/*.{ts,tsx}', 'packages/ui/src/**/*.{ts,tsx}']);

  const offenders = results
    .filter(r => r.messages.some(m => m.ruleId === 'no-restricted-syntax'))
    .map(r => norm(r.filePath))
    .sort();

  const added = offenders.filter(f => !baseline.includes(f));
  expect(added, `new raw-color violations — use a token:\n${added.join('\n')}`).toEqual([]);

  const stale = baseline.filter(f => !offenders.includes(f));
  expect(stale, `fixed — delete these lines from tokens-only.baseline.json:\n${stale.join('\n')}`).toEqual([]);
});
```

Burn-down of the three baseline files is a `chore/tokens-only-baseline` task, tracked in `.ai/backlog.md`.
It is deliberately **not** a blocker on landing the gate — the gate stops the bleeding first.

## 4. The artifact — where the checks run (the "a few shipped" half)

Reviewers leaking means local-only checking is insufficient; the gate must sit in the merge path.

```yaml
# .github/workflows/ci.yml  (lint job — added steps only)
      - run: pnpm lint                        # ESLint: tokens-only rides the existing gate
      - run: pnpm stylelint "**/*.css"        # NEW
      - run: pnpm vitest run tests/conventions # NEW — baseline ratchet
```

```sh
# .husky/pre-commit  (appended) — fast local signal on staged files only
pnpm exec lint-staged
```

```json
// package.json
"lint-staged": {
  "*.{ts,tsx}": "eslint --max-warnings 0",
  "*.css": "stylelint"
}
```

No PreToolUse hook is added. Lint + CI already make this deterministic; a hook here would be a third
enforcement of the same fact (§C: don't over-engineer chasing a gap).

## 5. The artifact — AGENTS.md, displaced not appended

Per the template: *a rule the toolchain enforces is replaced by a one-line pointer to the enforcement, not a
paragraph*, and a promoted rule must **displace or merge**.

```diff
 ## Enforcement (the ratchet)
-- Enforced in this repo: no `any` (ESLint error) · module import direction (dependency rule) · Zod at boundaries (convention test).
+- Enforced in this repo: no `any` (ESLint error) · **design tokens only** (ESLint `no-restricted-syntax` + Stylelint `color-no-hex`; shrink-only `tokens-only.baseline.json`) · module import direction (dependency rule) · Zod at boundaries (convention test).

-## Design
-- Use semantic design tokens for all colors. Do NOT hardcode hex values in components.
-- Raw hex is only allowed in the token definition file.
-- Reviewers: check for hardcoded colors in every UI diff.
+## Design
+- Colors are machine-enforced (see Enforcement). What the machine cannot see, and you must: **which** token
+  is right — `--error` means an error state, not "the red one". Token choice is `designer`'s call.
```

Net effect on the always-loaded file: **−4 lines, +2 lines.** The rule got stronger and the memory file got
smaller — that is the shape a correct promotion has.

## 6. The artifact — `.ai/lessons.md`, closed rather than re-appended

```md
### Tokens-only in components  <!-- id: tokens-only -->
- **Context:** UI work across `apps/web`, all sessions.
- **Problem:** raw hex colors kept appearing in components despite the tokens-only rule.
- **Rule:** superseded — see Promoted.
- **Applies-to:** any `.tsx`/`.css` under `apps/**` and `packages/ui/**`.
- **Recurrence:** 3× in 2 months. Reviewers caught some; a few reached production.
- **Promoted:** 2026-07-26 → **ENFORCED**. ESLint `no-restricted-syntax` (tokens-only block) ·
  Stylelint `color-no-hex` · shrink-only `tokens-only.baseline.json` guarded by
  `tests/conventions/tokens-only.baseline.test.ts` · runs in pre-commit + CI.
- **Status:** CLOSED as a prose lesson. Do not re-append this lesson. If a raw color reaches production
  again, the *check* has a hole — widen the check and record what the hole was; do not restate the rule.

### Escaped-defect: raw hex shipped to production  <!-- gate autopsy -->
- **Which gate should have caught it:** `checker`. It caught some and missed some — which is the finding.
  Human literal-scanning is a sampling process, not a gate; at three recurrences its miss rate is the
  defect. Secondarily: CI had no check to fail on.
- **What that gate now gains:** *nothing added to `checker`'s checklist — the opposite.* Literal-level
  colour scanning **leaves** `checker` entirely (`agent-team-structure.md`: `checker` never re-checks what
  the toolchain enforces) and moves to lint. `checker` spends the reclaimed capacity on token **semantics**
  — wrong-token-but-tokenised, which lint cannot see. The gate that actually gained a check is **CI**
  (lint job now fails the PR) plus the pre-commit hook. Worker briefs for `fe-dev` shrink to match:
  "the toolchain enforces tokens-only; you own whether the token is the right one."
```

`.ai/STATE.md` → *Lessons learned*: `tokens-only — promoted to enforcement 2026-07-26, see lessons.md#tokens-only`.

---

## 7. Proving the promotion works (commands + pass criteria — NOT executed, this is a dry run)

"Show evidence, don't assert" (§A) applies to the check itself. A rule nobody watched fail is not known to work.

```sh
# RED — the rule fires on the exact shape from the lesson
cat > apps/web/src/components/__ratchet-probe.tsx <<'EOF'
export const Probe = () => <div className="bg-[#0ea5e9]" style={{ color: '#fff' }} />;
EOF
pnpm exec eslint apps/web/src/components/__ratchet-probe.tsx
#   expect: exit 1, 2× "Raw color literal. Use a semantic token…"

# RETRO — it would have caught all three historical recurrences
for sha in <sha-1> <sha-2> <sha-3>; do
  git stash -u && git checkout "$sha" -- apps/web/src && pnpm exec eslint apps/web/src; done
#   expect: exit 1 on all three. If any passes, the rule has the same hole the prose had — fix before landing.

# GREEN — the fix passes
#   className="bg-primary" style={{ color: 'var(--on-primary)' }}   → exit 0
rm apps/web/src/components/__ratchet-probe.tsx

# MERGE-PATH — the part that "a few shipped" is really about
#   open a throwaway PR containing the probe file; the CI lint job must go red and block merge.
#   Passing locally while the PR merges green is the exact failure being fixed.
```

**Not established in this dry run:** none of the above was run, no client repo was touched, and the three
`<sha>` values are placeholders for the real recurrence commits. The RETRO step is the one that can still
invalidate this design — if the historical cases used a form the selectors miss (a hex assembled from
variables, a colour imported from a config JSON), the rule needs widening before it is called a promotion.

## 8. What is deliberately not promoted

- **Token *choice*** (`--error` used for a non-error accent) — not mechanically checkable. Stays prose,
  owned by `designer`, reviewed by `checker`. This is the residue that justifies keeping any prose at all.
- **A global skill rung.** Tokens-only already exists globally (`sailes-design/ux-rules.md` §Semantic color
  tokens; `agentic-first-principles.md` §B.3 lists it as immediately ratchetable). The gap was not knowledge —
  it was that the scaffold did not *land the check*. Framework-level candidate, for the framework repo's own
  backlog, not this client's: ship the tokens-only ESLint + Stylelint block in the bootstrap skeleton so each
  repo does not rediscover it. This is the second repo to need it, which is the graduation signal on the
  parked item `.ai/backlog.md:13` ("Bespoke ESLint plugin packaging the ratchet rules"). **Flagged, not done —
  a framework change is the human's call, not mine.**

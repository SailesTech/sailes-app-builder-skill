import tseslint from "typescript-eslint";

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    // Promoted from .ai/lessons.md (2026-07-27 — export button, third occurrence).
    // Raw color literals recurred 3x in components despite a prose "tokens only"
    // rule; the ratchet (agentic-first-principles.md §B.3) says a rule that
    // recurs gets enforced mechanically instead of restated in prose.
    files: ["apps/web/src/components/**/*.ts", "apps/web/src/components/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
          message: "No raw hex color literals in components — import from packages/ui/src/tokens.ts instead.",
        },
      ],
    },
  },
);

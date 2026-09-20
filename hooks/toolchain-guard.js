#!/usr/bin/env node
'use strict';

/**
 * PreToolUse guard (matcher `Edit|Write|MultiEdit`, wired in `hooks/hooks.json`): blocks a write
 * to a toolchain config file — ESLint, Prettier, Biome, Ruff, TypeScript — inside a Sailes repo.
 *
 * Spec 1.36.0, phase P4 (A3), decisions Q1 and Q2 — `.ai/specs/2026-09-20-harness-guards-from-
 * ecc-audit.md`:
 *
 *   - Q1 — **scope is Sailes repos only** (`isSailesRepo(root)`, same detector as
 *     `workflow-router.js`: `AGENTS.md` or `.ai/` present at the repo root). Everywhere else →
 *     `exit(0)`, silent. Unlike `block-no-verify.js` (every repo, no context needed), this hook's
 *     rule only makes sense where there is a notion of phase, spec, and escalation to a lead — in
 *     a repo that never adopted the workflow, blocking a config edit would just be in the way.
 *   - Q2 — **fixed list, always blocks, human unblocks** via the explicit environment variable
 *     `SAILES_TOOLCHAIN_GUARD=off` (shape modeled on `ECC_GATEGUARD=off`, spec's pre-implement
 *     gate R6). Changing a lint/type rule is already on the existing list of key decisions
 *     `be-dev.md` never lets a worker substitute — this hook is the mechanical enforcement of a
 *     rule that already applies, not a new one. `package.json` is deliberately NOT on the
 *     protected list: phases legitimately touch it (dependencies, scripts) as a matter of course.
 *
 * Blocks (`stderr` + `exit(2)`, **never** `permissionDecision` — see
 * `hooks/workflow-agenttype-guard.js:14-18` for why: setting it would bypass the user's own
 * permission prompt for the call, which this hook must not do). Everything else → `exit(0)`,
 * silent. A payload this hook cannot parse → `exit(0)`: never block on something unreadable
 * (same rule as `block-no-verify.js` and `workflow-agenttype-guard.js:303`).
 *
 * Protected list (basename match, not full path — a nested `packages/api/.eslintrc.json` is
 * still an ESLint config):
 *   - ESLint:      `.eslintrc*`, `eslint.config.*`
 *   - Prettier:    `.prettierrc*`, `prettier.config.*`
 *   - Biome:       `biome.json*`
 *   - Ruff:        `ruff.toml`, `.ruff.toml`
 *   - TypeScript:  `tsconfig*.json`
 */

const path = require('path');
const { readStdin, findRepoRoot, isSailesRepo } = require('./lib/repo-state');

const WATCHED_TOOLS = new Set(['Edit', 'Write', 'MultiEdit']);

const RULE =
  'changing a toolchain rule (lint/format/type config) is a KEY DECISION — escalate to the lead, ' +
  'never substitute it (spec 1.36.0 P4, hooks/toolchain-guard.js). Unblock for a phase that ' +
  'legitimately changes it: SAILES_TOOLCHAIN_GUARD=off';

/** Basename patterns for the fixed toolchain-config list (spec P4.1). `package.json` is NOT here. */
const PROTECTED_PATTERNS = [
  { label: 'ESLint', re: /^\.eslintrc(\..*)?$/ },
  { label: 'ESLint', re: /^eslint\.config\..+$/ },
  { label: 'Prettier', re: /^\.prettierrc(\..*)?$/ },
  { label: 'Prettier', re: /^prettier\.config\..+$/ },
  { label: 'Biome', re: /^biome\.json.*$/ },
  { label: 'Ruff', re: /^\.?ruff\.toml$/ },
  { label: 'TypeScript', re: /^tsconfig.*\.json$/ },
];

/** Returns the matched tool label, or `null` when `filePath`'s basename is not on the list. */
function matchProtected(filePath) {
  const base = path.basename(filePath);
  for (const { label, re } of PROTECTED_PATTERNS) {
    if (re.test(base)) return label;
  }
  return null;
}

function main() {
  const raw = readStdin();
  let input;
  try {
    input = JSON.parse(raw || '{}');
  } catch {
    process.exit(0); // malformed payload — never block on something we cannot parse
  }

  if (!WATCHED_TOOLS.has(input.tool_name)) {
    process.exit(0); // other tool — quiet
  }

  const toolInput = input.tool_input || {};
  const filePath = toolInput.file_path;
  if (typeof filePath !== 'string' || !filePath.trim()) {
    process.exit(0); // no path to read — never block on something we cannot parse
  }

  const label = matchProtected(filePath);
  if (!label) {
    process.exit(0); // not on the toolchain-config list — includes package.json, deliberately
  }

  const root = findRepoRoot(input.cwd || process.cwd());
  if (!isSailesRepo(root)) {
    process.exit(0); // outside a Sailes repo — no phase/spec/escalation context to enforce against
  }

  if (process.env.SAILES_TOOLCHAIN_GUARD === 'off') {
    process.exit(0); // human unblocked this phase explicitly
  }

  process.stderr.write(
    `toolchain-guard: blocked — ${label} config \`${filePath}\` — ${RULE}\n`
  );
  process.exit(2);
}

try {
  main();
} catch {
  // A defect in the guard must never brick every Edit/Write/MultiEdit call on the machine.
  process.exit(0);
}

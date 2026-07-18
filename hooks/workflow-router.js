#!/usr/bin/env node
'use strict';

/**
 * SessionStart routing mandate: make the Sailes pipeline the default path, not a suggestion.
 *
 * A hook cannot invoke a skill — it can only put text in the model's context. So this
 * does the next best thing, and arguably the stronger one: it reads the repo's actual
 * state off disk and states which skill the session MUST enter, leaving the model no
 * routing decision to get wrong. The filesystem decides, not the model's read of the
 * conversation.
 *
 * Fires on resume/clear/compact as well as startup: a context reset is exactly when the
 * methodology gets dropped, so the mandate has to survive one.
 *
 * Silent in any repo without AGENTS.md or `.ai/`. The plugin is enabled globally and a
 * repo that never adopted the workflow has not asked to be governed by it.
 */

const fs = require('fs');
const path = require('path');

const MAX_SPECS_LISTED = 5;

/**
 * Above this, "in flight" stops being credible. Real repos accumulate specs that were
 * implemented but never `git mv`'d to implemented/ (one had 27), and an agent cannot tell a
 * genuinely busy repo from a stale one — so the hook says which it suspects.
 */
const DRIFT_THRESHOLD = 10;

/** Scaffolding that lives in `.ai/specs/` but is not work in flight. Found in real repos. */
const NOT_A_SPEC = /^(readme|template|agents|claude)\.md$/i;

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function exists(p) {
  try {
    fs.statSync(p);
    return true;
  } catch {
    return false;
  }
}

/** The stamp and `.ai/` live at the repo root, not in whatever subdir the session opened in. */
function findRepoRoot(startDir) {
  let dir = path.resolve(startDir);
  for (let i = 0; i < 10; i++) {
    if (exists(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(startDir);
}

/**
 * Specs sitting at `.ai/specs/` root are in flight; `implemented/` and `archived/`
 * are done and say nothing about what this session should do (README.md invariant 6).
 */
function activeSpecs(root) {
  const dir = path.join(root, '.ai', 'specs');
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.md') && !NOT_A_SPEC.test(e.name))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

function emit(context) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: context,
      },
    })
  );
}

const HARD_RULES = [
  '- No feature code before an approved spec exists on disk. A one-line fix is exempt; a feature is not.',
  '- The human owns every key decision. Recommend with trade-offs, then let them choose — never pick for them.',
  '- Done means verified, not asserted. Drive the real flow; a passing typecheck is not evidence.',
  '- Phases are gated. Do not cross a gate because the next phase looks obvious.',
].join('\n');

function main() {
  let input = {};
  try {
    input = JSON.parse(readStdin() || '{}');
  } catch {
    /* fall through to cwd */
  }

  const root = findRepoRoot(input.cwd || process.cwd());
  const isSailesRepo =
    exists(path.join(root, 'AGENTS.md')) || exists(path.join(root, '.ai'));

  // Not a Sailes repo — it never adopted the workflow, so do not impose it.
  if (!isSailesRepo) return;

  const specs = activeSpecs(root);

  let route;
  if (specs.length) {
    const shown = specs.slice(0, MAX_SPECS_LISTED).map((s) => `\`${s}\``).join(', ');
    const more = specs.length > MAX_SPECS_LISTED ? ` (+${specs.length - MAX_SPECS_LISTED} more)` : '';
    // Deliberately not filtered by a `Status:` line. Across real repos that line appears in five
    // different shapes, is missing entirely from a third of specs, and occurs inside fenced code
    // blocks — parsing it would silently drop live work, which is worse than listing too much.
    const drift =
      specs.length > DRIFT_THRESHOLD
        ? `\n${specs.length} specs read as "in flight", which usually means finished ones were never ` +
          `\`git mv\`'d to \`implemented/\` rather than that all ${specs.length} are live. Trust the ` +
          `spec's own status over this count, and consider offering to tidy the folder.`
        : '';
    route =
      `This repo has spec(s) in flight at \`.ai/specs/\`: ${shown}${more}.${drift}\n` +
      `Read the relevant one BEFORE proposing work. If the human's request is covered by it, ` +
      `continue the pipeline at its current phase — \`sailes-pre-implement\` if it has not been ` +
      `risk-checked, otherwise \`sailes-implement\` (phase by phase, gated). If the request is ` +
      `NOT covered by any active spec, it is new scope: route to \`sailes-discovery\` and say so ` +
      `rather than quietly widening an existing spec.`;
  } else {
    route =
      `This repo has no active spec at \`.ai/specs/\` — nothing is in flight.\n` +
      `Any request to build, add, or change a feature therefore starts the pipeline: invoke ` +
      `\`sailes-start\` (it shows the map and routes A/B/C), or \`sailes-discovery\` directly if ` +
      `the human only wants the scope interview. Do not begin implementation from a one-line brief.`;
  }

  emit(
    `[sailes] This repo runs the Sailes workflow (AGENTS.md/.ai present), so it governs this ` +
      `session — including after a context reset.\n\n` +
      `Pipeline: sailes-start → [wayfinder] → discovery → bootstrap → [design] → spec → ` +
      `pre-implement → [database|async] → implement → release gate.\n\n` +
      `ROUTING (from the repo's state on disk, not from your read of the request):\n${route}\n\n` +
      `HARD RULES for this session:\n${HARD_RULES}\n\n` +
      `Read \`AGENTS.md\` before your first substantive action; the repo's own conventions win ` +
      `over generic defaults. Do not recite this block to the human — act on it.`
  );
}

try {
  main();
} catch {
  // Routing guidance is never worth breaking a session over.
  process.exit(0);
}

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

const {
  readStdin,
  findRepoRoot,
  isSailesRepo,
  activeSpecs,
  openIncidents,
  emit,
} = require('./lib/repo-state');

const MAX_SPECS_LISTED = 5;

/**
 * Above this, "in flight" stops being credible. Real repos accumulate specs that were
 * implemented but never `git mv`'d to implemented/ (one had 27), and an agent cannot tell a
 * genuinely busy repo from a stale one — so the hook says which it suspects.
 */
const DRIFT_THRESHOLD = 10;

const HARD_RULES = [
  '- No feature code before an approved spec exists on disk. A one-line fix is exempt; a feature is not.',
  '- The human owns every key decision. Recommend with trade-offs, then let them choose — never pick for them.',
  '- Done means verified, not asserted. Drive the real flow; a passing typecheck is not evidence.',
  '- Phases are gated. Do not cross a gate because the next phase looks obvious.',
].join('\n');

// Resolved once, at module scope, so the error fallback below judges the same repo main() would.
// stdin can only be consumed once, and a failure inside main() must not change which repo we
// think we are in — that is how the fallback ended up nagging unrelated checkouts.
const SESSION_ROOT = (() => {
  try {
    const input = JSON.parse(readStdin() || '{}');
    return findRepoRoot(input.cwd || process.cwd());
  } catch {
    return findRepoRoot(process.cwd());
  }
})();

function main() {
  const root = SESSION_ROOT;

  // Not a Sailes repo — it never adopted the workflow, so do not impose it.
  if (!isSailesRepo(root)) return;

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

  const incidents = openIncidents(root);
  const incidentBlock = incidents.length
    ? `\nOPEN INCIDENT(S) in \`.ai/incidents/\`: ${incidents.join(', ')}. Something is already ` +
      `known to be broken here — read the record before starting anything else, and continue that ` +
      `diagnosis rather than opening a second one.\n`
    : '';

  emit(
    'SessionStart',
    `[sailes] This repo runs the Sailes workflow (AGENTS.md/.ai present), so it governs this ` +
      `session — including after a context reset.\n\n` +
      `Pipeline: sailes-start → [wayfinder] → discovery → bootstrap → [design] → spec → ` +
      `pre-implement → [database|async] → implement → release gate.\n` +
      `BROKEN ≠ MISSING: if the request is about something failing — production errors, a failed ` +
      `run, an alert, a customer-visible defect, missing data — invoke \`sailes-diagnose\` INSTEAD ` +
      `of that pipeline. The build track cannot diagnose: there is nothing to elicit and the ` +
      `requirement is already written. Diagnosis is read-only on production and ends at a proven ` +
      `mechanism, which then becomes a fix.\n\n` +
      `ROUTING (from the repo's state on disk, not from your read of the request):\n${route}\n` +
      `${incidentBlock}\n` +
      `HARD RULES for this session:\n${HARD_RULES}\n\n` +
      `Read \`AGENTS.md\` before your first substantive action; the repo's own conventions win ` +
      `over generic defaults. Do not recite this block to the human — act on it.`
  );
}

try {
  main();
} catch {
  // Routing guidance is never worth breaking a session over — but silence is not the safe
  // default either. A coding error here used to make the whole mandate vanish while the session
  // looked entirely normal: the "silent instrument" trap this framework's own diagnosis skill
  // exists to stamp out. Degrade to the minimum that still governs the session, and only in a
  // repo that asked to be governed.
  try {
    const root = SESSION_ROOT;
    if (isSailesRepo(root)) {
      emit(
        'SessionStart',
        `[sailes] This repo runs the Sailes workflow, but the session router failed to read its ` +
          `state, so there is no per-repo routing this time. Fall back to the standard: read ` +
          `\`AGENTS.md\` and \`.ai/specs/\` yourself before acting; a broken system goes to ` +
          `\`sailes-diagnose\`, new scope to \`sailes-discovery\`; no feature code without an ` +
          `approved spec. Mention the router failure to the human once — it is a real defect.`
      );
    }
  } catch {
    /* the fallback must never throw */
  }
  process.exit(0);
}

#!/usr/bin/env node
'use strict';

/**
 * PreToolUse guard (matcher `Workflow`, wired in `hooks/hooks.json`): every `agent(...)` call
 * inside a `Workflow` tool script is classified by what its options object carries.
 *
 * Spec 1.35.0, decision Q2′ (2026-09-17, changes Q2 — `.ai/specs/2026-09-16-workflow-first-
 * orchestration.md`): the false-positive measurement in P5b.2 found that most real blocks under
 * the original all-or-nothing Q2 rule (5 of 6 blocked scripts) already passed an explicit
 * `model`, i.e. a deliberate human choice, not a silent fallback to the session's Opus. Only the
 * silent-fallback case is the actual drift `.ai/lessons.md:300` names as enforceable. So:
 *
 *   - `agentType` present               → clean, exit 0, silent.
 *   - `agentType` absent, `model` present → exit 0, but stdout carries a
 *     `hookSpecificOutput.additionalContext` suggestion naming the line and recommending a
 *     Sailes role when one fits. This must NOT set `permissionDecision` — doing so would bypass
 *     the user's own permission prompt for the call; the hook only adds context to it.
 *   - `agentType` absent AND `model` absent (including no options object at all) → exit 2,
 *     blocked: the call would silently inherit the session model (Opus).
 *   - options passed as a variable or containing `...spread` → statically undecidable regardless
 *     of `model` (the spread could hide `agentType`); unchanged from P5a — exit 0, note, never
 *     blocked, because a false positive here breaks every repo on the machine.
 *
 * A file mixing classes reports every line; if any line is a hard block, the whole call exits 2
 * (stderr lists the blocking lines and, in the same message, the suggestion lines) — a single
 * clean line elsewhere in the script does not soften a real block.
 *
 * Static analysis, not a parser: no framework, no deps (this repo ships none for hooks on
 * purpose — see AGENTS.md Verification). A hand-rolled string/comment mask is enough to answer
 * "does this `agent(` call's options object carry an `agentType` key / a `model` key,
 * statically?" — without pulling in a JS parser for it.
 *
 * Known simplification: template-literal (`` ` ``) interpolation (`${...}`) is treated as
 * string content, not re-entered as code. An `agent(` call written only inside a template
 * expression would be masked away and missed. Not exercised by any partition in the spec;
 * documented rather than silently accepted.
 */

const fs = require('fs');
const path = require('path');
const { readStdin } = require('./lib/repo-state');

const RULE =
  'every agent() call must pass either an explicit `agentType` or a `model` — without either it ' +
  'silently inherits the session model (spec 1.35.0 Q2′, hooks/workflow-agenttype-guard.js)';

const ROLE_GUIDE =
  "prefer agentType 'sailes-app-builder:<role>' when a role fits (explorer = read-only " +
  'recon/haiku; be-dev/fe-dev = implementation; tester = test authoring; checker = review; ' +
  'qa = behavior proof; designer = UI spec; docs-author = diagrams; researcher = synthesis, ' +
  'override model to sonnet), otherwise keeping only model is fine.';

/**
 * Replaces the interior of every string literal and comment with spaces, character-for-
 * character, so positions (and therefore line numbers) line up exactly with the original text.
 * Structural code — parens, braces, commas, identifiers — is left untouched. Searching this
 * mask instead of the raw source is what makes `agent(` inside a string or a comment invisible
 * to the detector without special-casing either.
 */
function maskStringsAndComments(text) {
  const out = Array.from(text);
  const len = out.length;
  let i = 0;
  const STATE_CODE = 0;
  const STATE_LINE_COMMENT = 1;
  const STATE_BLOCK_COMMENT = 2;
  const STATE_STRING = 3;
  let state = STATE_CODE;
  let quote = '';

  while (i < len) {
    const c = out[i];
    const next = i + 1 < len ? out[i + 1] : '';

    if (state === STATE_CODE) {
      if (c === '/' && next === '/') {
        out[i] = ' ';
        out[i + 1] = ' ';
        state = STATE_LINE_COMMENT;
        i += 2;
        continue;
      }
      if (c === '/' && next === '*') {
        out[i] = ' ';
        out[i + 1] = ' ';
        state = STATE_BLOCK_COMMENT;
        i += 2;
        continue;
      }
      if (c === "'" || c === '"' || c === '`') {
        quote = c;
        out[i] = ' ';
        state = STATE_STRING;
        i += 1;
        continue;
      }
      i += 1;
      continue;
    }

    if (state === STATE_LINE_COMMENT) {
      if (c === '\n') {
        state = STATE_CODE;
        i += 1;
        continue;
      }
      out[i] = ' ';
      i += 1;
      continue;
    }

    if (state === STATE_BLOCK_COMMENT) {
      if (c === '*' && next === '/') {
        out[i] = ' ';
        out[i + 1] = ' ';
        state = STATE_CODE;
        i += 2;
        continue;
      }
      if (c !== '\n') out[i] = ' ';
      i += 1;
      continue;
    }

    // STATE_STRING
    if (c === '\\' && i + 1 < len) {
      out[i] = ' ';
      if (out[i + 1] !== '\n') out[i + 1] = ' ';
      i += 2;
      continue;
    }
    if (c === quote) {
      out[i] = ' ';
      state = STATE_CODE;
      i += 1;
      continue;
    }
    // Real JS disallows a bare unescaped newline inside ' or " (syntax error); rather than
    // mask the rest of the file when a fixture gets this wrong, treat it as the string ending.
    if (c === '\n' && quote !== '`') {
      state = STATE_CODE;
      i += 1;
      continue;
    }
    if (c !== '\n') out[i] = ' ';
    i += 1;
  }

  return out.join('');
}

/** Index of the `)` matching the `(` at `openIdx`, counted on the mask so nesting inside
 *  strings/comments (already spaced out) cannot throw the depth count off. */
function findMatchingParen(masked, openIdx) {
  let depth = 1;
  for (let i = openIdx + 1; i < masked.length; i++) {
    if (masked[i] === '(') depth++;
    else if (masked[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1; // unbalanced — caller treats as "could not extract"
}

/**
 * Splits `raw` at top-level commas (depth 0 across (), [], {}), using `masked` — same length,
 * same positions — to find the split points so commas inside strings/nested literals are not
 * mistaken for argument separators. Returns `{ raw, masked }` pairs so callers can recurse.
 */
function splitTopLevel(raw, masked) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < masked.length; i++) {
    const c = masked[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (c === ',' && depth === 0) {
      parts.push({ raw: raw.slice(start, i), masked: masked.slice(start, i) });
      start = i + 1;
    }
  }
  parts.push({ raw: raw.slice(start), masked: masked.slice(start) });
  return parts.filter((p) => p.masked.trim().length > 0 || p.raw.trim().length > 0);
}

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === '\n') line++;
  }
  return line;
}

/**
 * Looks at one `agent(...)` call's second argument and classifies it (Q2′):
 *   - 'ok'          — literal options object with an explicit `agentType` key.
 *   - 'suggest'      — literal options object with `model` but no `agentType` (class 1: allow,
 *                      suggest a role).
 *   - 'block'        — no options object at all, or a literal one with neither `agentType` nor
 *                      `model` (class 2: would inherit the session model).
 *   - 'undecidable'  — options is not a literal object (variable, call, ternary), or the literal
 *                      contains `...spread` that could hide `agentType` — cannot be told
 *                      statically, regardless of whether `model` is also present.
 */
function classifySecondArg(part) {
  if (!part) return 'block';
  const trimmedMasked = part.masked.trim();
  const trimmedRaw = part.raw.trim();
  if (!trimmedRaw) return 'block';
  if (trimmedMasked[0] !== '{' || trimmedMasked[trimmedMasked.length - 1] !== '}') {
    // Not a literal options object — a variable, a call, a ternary, a spread reference.
    // Cannot decide statically whether it carries agentType.
    return 'undecidable';
  }
  const bodyRaw = trimmedRaw.slice(1, -1);
  const bodyMasked = trimmedMasked.slice(1, -1);
  const entries = splitTopLevel(bodyRaw, bodyMasked);
  let hasSpread = false;
  let hasModel = false;
  for (const entry of entries) {
    const em = entry.masked.trim();
    if (em.startsWith('...')) {
      hasSpread = true;
      continue;
    }
    if (/^agentType\s*(:|,|$)/.test(em)) return 'ok';
    if (/^model\s*(:|,|$)/.test(em)) hasModel = true;
  }
  if (hasSpread) return 'undecidable';
  return hasModel ? 'suggest' : 'block';
}

/**
 * Scans `source` for `agent(` calls that are real code (not inside a string or comment) and
 * classifies each one's options argument.
 */
function analyze(source) {
  const masked = maskStringsAndComments(source);
  const callRe = /(?<![\w.])agent\s*\(/g;
  const violations = [];
  const suggestions = [];
  const undecidable = [];
  let match;
  while ((match = callRe.exec(masked))) {
    const openIdx = match.index + match[0].length - 1;
    const closeIdx = findMatchingParen(masked, openIdx);
    if (closeIdx === -1) continue; // unbalanced — nothing sound to report
    const argsRaw = source.slice(openIdx + 1, closeIdx);
    const argsMasked = masked.slice(openIdx + 1, closeIdx);
    const args = splitTopLevel(argsRaw, argsMasked);
    const line = lineOf(source, match.index);
    const verdict = classifySecondArg(args[1]);
    if (verdict === 'block') {
      violations.push({ line });
    } else if (verdict === 'suggest') {
      suggestions.push({ line });
    } else if (verdict === 'undecidable') {
      undecidable.push({ line });
    }
  }
  return { violations, suggestions, undecidable };
}

function resolveScript(input) {
  const toolInput = input.tool_input || {};
  if (typeof toolInput.script === 'string') {
    return { text: toolInput.script, note: null };
  }
  if (typeof toolInput.scriptPath === 'string' && toolInput.scriptPath) {
    const p = path.isAbsolute(toolInput.scriptPath)
      ? toolInput.scriptPath
      : path.join(input.cwd || process.cwd(), toolInput.scriptPath);
    try {
      return { text: fs.readFileSync(p, 'utf8'), note: null };
    } catch (e) {
      return {
        text: null,
        note: `could not read scriptPath "${toolInput.scriptPath}" (${e.code || e.message}); skipping the agentType check.`,
      };
    }
  }
  if (typeof toolInput.name === 'string' && toolInput.name) {
    return {
      text: null,
      note:
        'Workflow call carries no `script`/`scriptPath` — likely a saved workflow invoked by ' +
        '`name`. Its content is not resolvable from this payload, and this hook does not guess ' +
        'the registry path. Skipping the agentType check.',
    };
  }
  return { text: null, note: null };
}

function main() {
  const raw = readStdin();
  let input;
  try {
    input = JSON.parse(raw || '{}');
  } catch {
    process.exit(0); // malformed payload — never block on something we cannot parse
  }

  if (input.tool_name !== 'Workflow') {
    process.exit(0); // other tool — quiet, per spec P5a.1
  }

  const { text, note } = resolveScript(input);
  if (text === null) {
    if (note) process.stderr.write(`workflow-agenttype-guard: ${note}\n`);
    process.exit(0);
  }

  const { violations, suggestions, undecidable } = analyze(text);

  const suggestionBlock = (list) => {
    const lines = list
      .map((v) => `  line ${v.line}: agent() call has no agentType (model is set)`)
      .join('\n');
    return `workflow-agenttype-guard: suggestion (Q2′) — ${ROLE_GUIDE}\n${lines}`;
  };
  const undecidableBlock = (list) => {
    const lines = list
      .map((v) => `  line ${v.line}: agent() options not a literal object — cannot decide statically`)
      .join('\n');
    return `workflow-agenttype-guard: not blocking (undecidable) — verify agentType by hand:\n${lines}`;
  };

  if (violations.length) {
    // Class 2 (Q2′): at least one call has neither agentType nor model — hard block. Mixed file:
    // class-1 suggestion lines and undecidable lines are reported in the same stderr message,
    // never softening the block.
    const lines = violations
      .map((v) => `  line ${v.line}: agent() call has neither agentType nor model`)
      .join('\n');
    let out = `workflow-agenttype-guard: blocked — ${RULE}\n${lines}\n`;
    if (suggestions.length) out += `\n${suggestionBlock(suggestions)}\n`;
    if (undecidable.length) out += `\n${undecidableBlock(undecidable)}\n`;
    process.stderr.write(out);
    process.exit(2);
  }

  if (undecidable.length) {
    process.stderr.write(`${undecidableBlock(undecidable)}\n`);
  }

  if (suggestions.length) {
    // Class 1 (Q2′): agentType absent but model present — never block, never set
    // permissionDecision (that would bypass the user's own permission prompt). Only
    // additionalContext, surfaced to the model as a suggestion.
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          additionalContext: suggestionBlock(suggestions),
        },
      }) + '\n'
    );
  }

  process.exit(0);
}

try {
  main();
} catch {
  // A defect in the guard must never brick every Workflow call on the machine — fail open.
  process.exit(0);
}

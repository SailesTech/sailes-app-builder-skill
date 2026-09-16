#!/usr/bin/env node
'use strict';

/**
 * PreToolUse guard (matcher `Workflow`, not yet wired — see spec 1.35.0 P5a/P5b): every
 * `agent(...)` call inside a `Workflow` tool script must pass `agentType` explicitly in its
 * options object. A workflow that spawns a subagent without `agentType` silently falls back to
 * whatever default the harness picks, which is exactly the drift `.ai/lessons.md:300` names as
 * enforceable and unfixed until a hook actually refuses the call.
 *
 * This phase (P5a) ships the hook and its test ONLY. It is not registered in `hooks/hooks.json`
 * yet — that wiring, plus a false-positive measurement across every saved workflow script on the
 * machine, is P5b, gated on a human sign-off (Q2: hook blocks in every repo on the machine).
 *
 * Static analysis, not a parser: no framework, no deps (this repo ships none for hooks on
 * purpose — see AGENTS.md Verification). A hand-rolled string/comment mask is enough to answer
 * the one question this hook asks — "does this `agent(` call's options object carry an
 * `agentType` key, statically?" — without pulling in a JS parser for it. Anything the mask
 * cannot decide (options passed as a variable, or built via `...spread`) is reported, not
 * blocked: a false positive here breaks every repo on the machine, so undecidable stays open.
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
  'every agent() call must pass an options object with an explicit `agentType` ' +
  '(spec 1.35.0 P5a.1, hooks/workflow-agenttype-guard.js)';

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
 * Looks at one `agent(...)` call's second argument and decides: has an `agentType` key
 * (clean), definitely does not (violation), or cannot be told statically (undecidable).
 */
function classifySecondArg(part) {
  if (!part) return 'missing';
  const trimmedMasked = part.masked.trim();
  const trimmedRaw = part.raw.trim();
  if (!trimmedRaw) return 'missing';
  if (trimmedMasked[0] !== '{' || trimmedMasked[trimmedMasked.length - 1] !== '}') {
    // Not a literal options object — a variable, a call, a ternary, a spread reference.
    // Cannot decide statically whether it carries agentType.
    return 'undecidable';
  }
  const bodyRaw = trimmedRaw.slice(1, -1);
  const bodyMasked = trimmedMasked.slice(1, -1);
  const entries = splitTopLevel(bodyRaw, bodyMasked);
  let hasSpread = false;
  for (const entry of entries) {
    const em = entry.masked.trim();
    if (em.startsWith('...')) {
      hasSpread = true;
      continue;
    }
    if (/^agentType\s*(:|,|$)/.test(em)) return 'ok';
  }
  return hasSpread ? 'undecidable' : 'violation';
}

/**
 * Scans `source` for `agent(` calls that are real code (not inside a string or comment) and
 * classifies each one's options argument.
 */
function analyze(source) {
  const masked = maskStringsAndComments(source);
  const callRe = /(?<![\w.])agent\s*\(/g;
  const violations = [];
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
    if (verdict === 'violation' || verdict === 'missing') {
      violations.push({ line });
    } else if (verdict === 'undecidable') {
      undecidable.push({ line });
    }
  }
  return { violations, undecidable };
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

  const { violations, undecidable } = analyze(text);

  if (violations.length) {
    const lines = violations.map((v) => `  line ${v.line}: agent() call missing agentType`).join('\n');
    process.stderr.write(
      `workflow-agenttype-guard: blocked — ${RULE}\n${lines}\n`
    );
    process.exit(2);
  }

  if (undecidable.length) {
    const lines = undecidable
      .map((v) => `  line ${v.line}: agent() options not a literal object — cannot decide statically`)
      .join('\n');
    process.stderr.write(
      `workflow-agenttype-guard: not blocking (undecidable) — verify agentType by hand:\n${lines}\n`
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

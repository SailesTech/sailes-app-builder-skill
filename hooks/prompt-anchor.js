#!/usr/bin/env node
'use strict';

/**
 * UserPromptSubmit anchor: keep the mandate alive deep into a session.
 *
 * Every other instrument here fires at a session boundary, at install, or on explicit
 * invocation. None fires on the event that actually precedes a violation — the human
 * typing a new request in turn 47, with the SessionStart mandate 80k tokens back and
 * competing with the working set. This hook fires on that event.
 *
 * It is the SOFT class, deliberately. A blocking PreToolUse gate was considered and
 * rejected (CHANGELOG 1.5.0): it takes the wheel away from the human, which is the one
 * thing the standard exists to prevent. So: inject, never block. `exit 2` and a `decision`
 * field are the only ways to block a prompt, and this file must never produce either —
 * under any input, including a corrupt state file or an unreadable repo.
 *
 * It is also SILENT by default. `framework-version-check.js` sets the doctrine: anything
 * printed costs context — and this one pays per *turn*, not per session. The emission
 * policy is therefore the whole design, not a refinement of it.
 *
 * State lives in the OS temp dir, keyed by session id. Never inside a working tree: a
 * counter file that shows up in `git status` is a defect, not a detail.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const {
  readStdin,
  findRepoRoot,
  isSailesRepo,
  activeSpecs,
  openIncidents,
  emit,
} = require('./lib/repo-state');

/** Byte-identical to workflow-router.js and agents-md-template.md. Change all three or none. */
const SPINE = 'SPEC → HUMAN → VERIFIED → GATED';

// This arm has no turn gap, so SAILES_ANCHOR_EVERY is deliberately absent rather than
// present-and-inert: an env var that silently does nothing is the silent-instrument trap.

// ---------------------------------------------------------------------------
// POLICY — the only thing that differs between the experiment's branches.
// enforce/always: return true. enforce/state-only: drop the turn clause.
// ---------------------------------------------------------------------------

/**
 * State-only: emit when the repo state changed since the last emission, and never otherwise.
 *
 * The purest form of the framework's own doctrine that silence is the default — it speaks
 * only when it has something new to say. Its blind spot is the whole reason the hybrid
 * exists: a long session whose disk never moves gets no anchor at all, which is precisely
 * the turn-47 case this design set out to cover.
 */
function shouldEmit({ changed }) {
  return changed;
}

// ---------------------------------------------------------------------------

/** A session id is untrusted input; never let it choose a path. */
function stateFile(sessionId) {
  const key = crypto.createHash('sha256').update(String(sessionId || 'nosession')).digest('hex');
  return path.join(os.tmpdir(), `sailes-anchor-${key.slice(0, 16)}.json`);
}

function readState(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return {
      turnsSinceEmit: Number.isInteger(parsed.turnsSinceEmit) ? parsed.turnsSinceEmit : 0,
      fingerprint: typeof parsed.fingerprint === 'string' ? parsed.fingerprint : null,
    };
  } catch {
    // Missing or corrupt is the normal first-turn case, not an error worth reporting.
    return { turnsSinceEmit: 0, fingerprint: null };
  }
}

function writeState(file, state) {
  try {
    fs.writeFileSync(file, JSON.stringify(state));
  } catch {
    // A read-only temp dir degrades to "emit on every state change" — noisier, never broken.
  }
}

/** What the human would need to know changed: which specs are live, which incidents are open. */
function fingerprint(specs, incidents) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify([specs, incidents]))
    .digest('hex')
    .slice(0, 16);
}

/**
 * ~40-60 tokens. It names the spine and the one routing fact that applies right now —
 * enough to re-activate the full mandate already in context, not a re-statement of it.
 */
function anchor(specs, incidents) {
  if (incidents.length) {
    return `[sailes] ${SPINE} · OPEN INCIDENT ${incidents[0]} — broken≠missing: sailes-diagnose, read-only on prod.`;
  }
  if (specs.length) {
    const shown = specs.length === 1 ? `\`${specs[0]}\`` : `${specs.length} specs`;
    return `[sailes] ${SPINE} · in flight: ${shown}. Covered by it → continue that phase; not covered → new scope, sailes-discovery.`;
  }
  return `[sailes] ${SPINE} · no spec on disk — feature work starts at sailes-discovery, not at the editor.`;
}

function main() {
  let input = {};
  try {
    input = JSON.parse(readStdin() || '{}');
  } catch {
    /* malformed stdin is not a reason to speak, nor to fail */
  }

  const root = findRepoRoot(input.cwd || process.cwd());

  // Not a Sailes repo — it never adopted the workflow, so do not impose it.
  if (!isSailesRepo(root)) return;

  const specs = activeSpecs(root);
  const incidents = openIncidents(root);
  const current = fingerprint(specs, incidents);

  const file = stateFile(input.session_id);
  const prev = readState(file);

  // A null fingerprint means turn 1, where SessionStart has just injected the full mandate.
  // Treating "no previous state" as a change would make the anchor duplicate it verbatim,
  // which is the loudest possible way to say nothing new.
  const changed = prev.fingerprint !== null && prev.fingerprint !== current;

  // The turn being handled counts toward the gap. Comparing the *stored* count instead
  // makes every gap N+1 and pushes the first anchor to turn N+1 — an off-by-one that is
  // invisible in prose and obvious the moment you count emissions over 30 turns.
  const turnsSinceEmit = prev.turnsSinceEmit + 1;

  if (!shouldEmit({ changed, turnsSinceEmit })) {
    writeState(file, { turnsSinceEmit, fingerprint: current });
    return;
  }

  writeState(file, { turnsSinceEmit: 0, fingerprint: current });
  emit('UserPromptSubmit', anchor(specs, incidents));
}

try {
  main();
} catch {
  // Silence is the correct failure mode for a reminder — but never a non-zero exit, and
  // never a `decision` field. Either would block the human's prompt, which is the one
  // outcome this whole design rules out.
  process.exit(0);
}

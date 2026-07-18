'use strict';

/**
 * Shared repo-state reading for the SessionStart hooks.
 *
 * Both hooks answer the same question from disk — "what is this repo, and what is in
 * flight here?" — and until now each carried its own verbatim copy of the four I/O
 * helpers. A third hook would have triplicated them, and variants that differ in their
 * plumbing cannot be compared against each other, so the duplication is extracted here
 * before any of that happens.
 *
 * Nothing in this module throws. A hook that cannot read the disk must degrade to
 * silence, never to a broken session — so every helper answers with null / false / [].
 */

const fs = require('fs');
const path = require('path');

/** Scaffolding that lives in `.ai/specs/` but is not work in flight. Found in real repos. */
const NOT_A_SPEC = /^(readme|template|agents|claude)\.md$/i;

/** An incident is closed once its record says so; anything else still wants attention. */
const CLOSED_INCIDENT = /^\s*Status:\s*(FIXED\b|RESOLVED\b|CLOSED\b)/im;

const MAX_INCIDENTS_LISTED = 3;

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
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

/** A repo has opted into the workflow by carrying either artifact; neither → do not govern it. */
function isSailesRepo(root) {
  return exists(path.join(root, 'AGENTS.md')) || exists(path.join(root, '.ai'));
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

/**
 * Incident records that are still open. An open incident outranks every spec at session start:
 * it means something is broken right now, and the build pipeline is the wrong instrument for it.
 */
function openIncidents(root) {
  const dir = path.join(root, '.ai', 'incidents');
  let names;
  try {
    names = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.md') && !NOT_A_SPEC.test(e.name))
      .map((e) => e.name)
      .sort()
      .reverse(); // newest first — incident files are date-prefixed
  } catch {
    return [];
  }
  const out = [];
  for (const name of names) {
    const body = read(path.join(dir, name));
    if (body === null || CLOSED_INCIDENT.test(body)) continue;
    const status = /^\s*Status:\s*(.+)$/im.exec(body);
    out.push(`\`${name}\`${status ? ` (${status[1].trim()})` : ''}`);
    if (out.length === MAX_INCIDENTS_LISTED) break;
  }
  return out;
}

/**
 * The stdout contract every hook here shares: JSON on stdout, or nothing at all.
 * The event name differs per hook, which is exactly why the old private `emit` — with
 * `SessionStart` hardcoded — could not be shared as written.
 */
function emit(hookEventName, context) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName, additionalContext: context },
    })
  );
}

module.exports = {
  NOT_A_SPEC,
  CLOSED_INCIDENT,
  readStdin,
  read,
  exists,
  findRepoRoot,
  isSailesRepo,
  activeSpecs,
  openIncidents,
  emit,
};

#!/usr/bin/env node
'use strict';

/**
 * sync-blocks — one rule, one source, generated copies.
 *
 * The problem it exists for, measured 2026-08-01: three criterion/doctrine collisions in a single
 * day, every one of them the same shape — a rule written in more than one place drifts, and the
 * evals then encode different versions of it. Twice the copies disagreed; once the CANONICAL file
 * did not carry the clause its own role was enforcing. `AGENTS.md` has asked people to "change all
 * three or none" in prose for weeks, and prose did not prevent a single one.
 *
 * So the rule lives in ONE file and is stamped into its consumers, and `--check` fails when they
 * disagree. Why generated copies rather than a pointer: measured the same day, a role definition
 * sending the reader to `skills/sailes-bootstrap/…` resolves only inside this framework's own repo
 * — the plugin serves skills from outside a client's working tree — so a consumer that merely
 * references the canon is a consumer that, on a client machine, has nothing. Each file has to be
 * self-sufficient, which leaves keeping them identical as the thing to mechanise.
 *
 * Markers are HTML comments in every file type, including inside the TOML prompt strings. That is
 * deliberate: `#` is not a comment inside a TOML multi-line string, and this repo already puts
 * HTML comments in model-facing prose (`AGENTS.md`, the spine block).
 *
 *   node tools/sync-blocks.js            # write: stamp every consumer from its source
 *   node tools/sync-blocks.js --check    # verify only; exit 1 and name the offenders
 *   node tools/sync-blocks.js --config <path>
 *
 * Exit codes: 0 in sync (or written), 1 drift / missing markers / missing source.
 */

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const checkOnly = argv.includes('--check');
const configFlag = argv.indexOf('--config');
const REPO = path.join(__dirname, '..');
const configPath = configFlag !== -1 ? argv[configFlag + 1] : path.join(REPO, 'tools', 'blocks.json');
const root = path.dirname(configPath);

const problems = [];
let written = 0;

/** Match the file's own endings, never the repo's — a \n regex does not match \r\n, and the
 *  failure mode is a no-op that reads as success. Recorded in AGENTS.md at the cost of two edits. */
function endingOf(text) {
  return /\r\n/.test(text) ? '\r\n' : '\n';
}

function markers(name) {
  return {
    begin: `<!-- BEGIN ${name} -->`,
    end: `<!-- END ${name} -->`,
  };
}

/** Returns the text between the markers, or null when either marker is absent. */
function extract(text, name) {
  const { begin, end } = markers(name);
  const i = text.indexOf(begin);
  const j = text.indexOf(end);
  if (i === -1 || j === -1 || j < i) return null;
  return text.slice(i + begin.length, j).replace(/^\r?\n/, '').replace(/\r?\n[ \t]*$/, '');
}

function replaceBlock(text, name, body) {
  const { begin, end } = markers(name);
  const i = text.indexOf(begin);
  const j = text.indexOf(end);
  if (i === -1 || j === -1 || j < i) return null;
  const nl = endingOf(text);
  const bodyForFile = body.split(/\r?\n/).join(nl);
  return text.slice(0, i + begin.length) + nl + bodyForFile + nl + text.slice(j);
}

/** Compare on content, not on bytes — a CRLF consumer and an LF source are NOT drift. */
const normalize = (s) => s.split(/\r?\n/).join('\n').replace(/[ \t]+$/gm, '');

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
  console.error(`sync-blocks: cannot read config ${configPath} — ${err.message}`);
  process.exit(1);
}

for (const block of config.blocks || []) {
  const { name, source, consumers } = block;
  const sourcePath = path.join(root, source);

  let sourceText;
  try {
    sourceText = fs.readFileSync(sourcePath, 'utf8');
  } catch {
    problems.push(`${source}: source file is missing — the block it defines is enforced nowhere`);
    continue;
  }

  const body = extract(sourceText, name);
  if (body === null) {
    problems.push(`${source}: source has no <!-- BEGIN ${name} --> / <!-- END ${name} --> markers`);
    continue;
  }
  if (!body.trim()) {
    problems.push(`${source}: block "${name}" is empty — an empty block silently syncs nothing`);
    continue;
  }

  for (const consumer of consumers) {
    const consumerPath = path.join(root, consumer);
    let text;
    try {
      text = fs.readFileSync(consumerPath, 'utf8');
    } catch {
      problems.push(`${consumer}: consumer file is missing`);
      continue;
    }

    const current = extract(text, name);
    if (current === null) {
      // Absence must be loud. A consumer someone hand-edited until the markers were gone would
      // otherwise pass: nothing to compare means nothing to disagree with, which is exactly how
      // every expensive defect of 2026-08-01 hid.
      problems.push(`${consumer}: no markers for "${name}" — the block is not enforced in this file`);
      continue;
    }

    if (normalize(current) === normalize(body)) continue;

    if (checkOnly) {
      problems.push(`${consumer}: block "${name}" has drifted from ${source}`);
    } else {
      const next = replaceBlock(text, name, body);
      if (next === null || next === text) {
        problems.push(`${consumer}: rewrite of "${name}" landed nothing — refusing to report success`);
        continue;
      }
      fs.writeFileSync(consumerPath, next);
      // Re-read rather than trust the write: a scripted edit that reports success without
      // verifying it landed has already produced a green commit with no change in this repo.
      if (normalize(extract(fs.readFileSync(consumerPath, 'utf8'), name)) !== normalize(body)) {
        problems.push(`${consumer}: wrote "${name}" and the file still disagrees`);
        continue;
      }
      written++;
      console.log(`  synced  ${consumer}  <- ${source}  [${name}]`);
    }
  }
}

if (problems.length) {
  console.error(checkOnly ? 'sync-blocks: OUT OF SYNC' : 'sync-blocks: FAILED');
  for (const p of problems) console.error(`  ${p}`);
  if (checkOnly) console.error('\n  Fix with: node tools/sync-blocks.js');
  process.exit(1);
}

console.log(checkOnly ? 'sync-blocks: all blocks in sync' : `sync-blocks: ${written} file(s) synced`);
process.exit(0);

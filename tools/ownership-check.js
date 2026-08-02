#!/usr/bin/env node
'use strict';

/**
 * ownership-check — the file-ownership matrix in a work plan, made comparable instead of read.
 *
 * The incident this exists for, measured 2026-08-01: a work plan drew `F1 → F2 → {F3,…}` and
 * called F2 "solitary" twenty lines above its own ownership table showing F2 and F3 were disjoint
 * — F3's brief even listed F2's file as forbidden. The phase idled behind six others for nothing.
 * Arrows record the order someone thought about phases in, not a dependency; only a set
 * intersection over the files a phase actually touches tells you whether it can run in parallel.
 * A prose table reads fine to a human and cannot be compared to anything, which is exactly how
 * that phase sat idle: nobody ran the comparison because there was no artifact to run it against.
 *
 * So the matrix lives in a fenced ```yaml block in the plan (`.ai/runs/<date>-<slug>.md`), shaped
 *
 *   ownership:
 *     F1:
 *       - path/one
 *       - path/two
 *     F2:
 *       - path/three
 *
 * and this script is the comparison: every task's path set must be disjoint from every other's.
 * Zero dependencies, hand-rolled parser — the shape above is the entire grammar this tool speaks,
 * and a real YAML library would happily accept structures (anchors, flow style, multi-document)
 * that this contract never uses and that would silently widen what a plan is allowed to write.
 *
 * Malformed input is rejected loudly, not treated as absent — an `ownership:` block that half-
 * parses and is then read as "no findings" is the exact silence this tool exists to remove; see
 * the "absence must be loud" rule in tools/sync-blocks.js, same lesson, same day.
 *
 *   node tools/ownership-check.js <plan-file>
 *
 * Exit codes:
 *   0 — every task's paths are disjoint from every other's, OR the plan carries no `ownership:`
 *       block at all (not every plan has one yet — noted on stdout, never silent).
 *   1 — two or more tasks share a path (each shared path is named, with every task that claims
 *       it), OR the `ownership:` block is present but malformed.
 */

const fs = require('fs');
const path = require('path');

/** Extracts the first fenced ```yaml block whose body contains a top-level `ownership:` key.
 *  Returns { body, blockStart } (1-based line number of the block's first content line) or null
 *  when no yaml block exists at all — the "not every plan has one yet" case. */
function findOwnershipBlock(text) {
  const fenceRe = /```ya?ml\r?\n([\s\S]*?)```/g;
  let match;
  let sawAnyYamlBlock = false;
  while ((match = fenceRe.exec(text)) !== null) {
    sawAnyYamlBlock = true;
    const body = match[1];
    if (/^ownership:[ \t]*\r?$/m.test(body)) {
      const before = text.slice(0, match.index + match[0].indexOf(body));
      const blockStart = before.split(/\r\n|\n/).length;
      return { body, blockStart };
    }
  }
  return sawAnyYamlBlock ? { body: null, blockStart: null, noOwnershipKey: true } : null;
}

/**
 * Parses the `ownership:` mapping out of a yaml-block body.
 *
 * Grammar (deliberately narrow — see header):
 *   ownership:
 *     <taskId>:
 *       - <path>
 *       - <path>
 *     <taskId>:
 *       - <path>
 *
 * Task keys are indented exactly 2 spaces and end in `:` with nothing after it. Path items are
 * indented exactly 4 spaces, start with `- ` and take the rest of the line verbatim (trimmed).
 * Blank lines are skipped anywhere. Anything else encountered while inside the block — wrong
 * indent, a task with zero paths, a duplicate task id — throws, naming the line. That is the
 * "reject malformed input loudly" requirement: a parser that shrugs at an odd line and treats it
 * as absent is the failure this whole tool is supposed to remove.
 *
 * Returns a Map<taskId, string[]> in first-seen order.
 */
function parseOwnership(body, blockStart) {
  const rawLines = body.split(/\r\n|\n/);
  const lines = [];
  for (let i = 0; i < rawLines.length; i++) {
    lines.push({ text: rawLines[i], num: blockStart + i });
  }

  // Locate the `ownership:` line itself; everything after it, at deeper indent, is the mapping.
  const startIdx = lines.findIndex((l) => /^ownership:[ \t]*$/.test(l.text));
  if (startIdx === -1) {
    throw new Error('internal: parseOwnership called without an ownership: line present');
  }

  const tasks = new Map(); // taskId -> { paths: string[], line: number }
  let currentTask = null;

  for (let i = startIdx + 1; i < lines.length; i++) {
    const { text, num } = lines[i];
    if (text.trim() === '') continue; // blank line, always allowed

    // A line at column 0 (no leading space) ends the ownership mapping — it's a sibling
    // top-level key in the same yaml block, not part of this structure.
    if (/^\S/.test(text)) break;

    const taskMatch = /^ {2}([^\s:][^:]*):[ \t]*$/.exec(text);
    if (taskMatch) {
      const taskId = taskMatch[1].trim();
      if (tasks.has(taskId)) {
        throw new Error(
          `line ${num}: duplicate task id "${taskId}" in ownership: block — a task can only own one path list`
        );
      }
      currentTask = { paths: [], line: num };
      tasks.set(taskId, currentTask);
      continue;
    }

    const pathMatch = /^ {4}- (.+)$/.exec(text);
    if (pathMatch) {
      if (!currentTask) {
        throw new Error(
          `line ${num}: path item outside any task ("${text.trim()}") — expected a "  <taskId>:" line first`
        );
      }
      const p = pathMatch[1].trim();
      if (!p) {
        throw new Error(`line ${num}: empty path under a "- " list item`);
      }
      currentTask.paths.push(p);
      continue;
    }

    throw new Error(
      `line ${num}: malformed ownership: entry — "${text}" is neither a 2-space task key ("  F1:") ` +
        `nor a 4-space path item ("    - path")`
    );
  }

  for (const [taskId, t] of tasks) {
    if (t.paths.length === 0) {
      throw new Error(`line ${t.line}: task "${taskId}" lists no paths — an empty task owns nothing to check`);
    }
  }

  if (tasks.size === 0) {
    throw new Error(`line ${lines[startIdx].num}: "ownership:" present but carries no task entries under it`);
  }

  const out = new Map();
  for (const [taskId, t] of tasks) out.set(taskId, t.paths);
  return out;
}

/** Normalizes a path for comparison across POSIX/Windows plans: backslashes to forward slashes,
 *  trim, collapse a trailing slash. This is a comparison key only — findings print the path as the
 *  plan wrote it (first occurrence), never the normalized form. */
function normalize(p) {
  return p.trim().replace(/\\/g, '/').replace(/\/+$/, '');
}

/** Returns an array of { path, tasks: [taskId, ...] } for every path claimed by 2+ tasks,
 *  in first-seen order. */
function findConflicts(ownership) {
  const owners = new Map(); // normalized path -> { display, tasks: Set }
  for (const [taskId, paths] of ownership) {
    for (const p of paths) {
      const key = normalize(p);
      if (!owners.has(key)) owners.set(key, { display: p, tasks: new Set() });
      owners.get(key).tasks.add(taskId);
    }
  }
  const conflicts = [];
  for (const { display, tasks } of owners.values()) {
    if (tasks.size > 1) conflicts.push({ path: display, tasks: [...tasks] });
  }
  return conflicts;
}

function main() {
  const argv = process.argv.slice(2);
  const planFile = argv[0];
  if (!planFile) {
    console.error('ownership-check: usage: node tools/ownership-check.js <plan-file>');
    process.exit(1);
  }

  const resolved = path.resolve(planFile);
  let text;
  try {
    text = fs.readFileSync(resolved, 'utf8');
  } catch (err) {
    console.error(`ownership-check: cannot read ${planFile} — ${err.message}`);
    process.exit(1);
  }

  const found = findOwnershipBlock(text);
  if (found === null || found.noOwnershipKey) {
    console.log(
      `ownership-check: ${planFile} carries no "ownership:" block — nothing to check ` +
        '(not every plan has one yet).'
    );
    process.exit(0);
  }

  let ownership;
  try {
    ownership = parseOwnership(found.body, found.blockStart);
  } catch (err) {
    console.error(`ownership-check: malformed ownership: block in ${planFile}`);
    console.error(`  ${err.message}`);
    process.exit(1);
  }

  const conflicts = findConflicts(ownership);
  if (conflicts.length === 0) {
    console.log(
      `ownership-check: ${ownership.size} task(s), all paths disjoint — ${planFile} is clear to parallelize.`
    );
    process.exit(0);
  }

  console.error(`ownership-check: FAILED — ${planFile} has ${conflicts.length} shared path(s)`);
  for (const c of conflicts) {
    console.error(`  ${c.path}  <-  ${c.tasks.join(', ')}`);
  }
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { findOwnershipBlock, parseOwnership, findConflicts, normalize };

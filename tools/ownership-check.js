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
 *
 * Second mode (spec 1.35.0 P2, additive — this legacy plan-file mode above is unchanged):
 *
 *   node tools/ownership-check.js --spec <spec-file>
 *
 * reads a spec's own `## Fazy` (`Owns:` table per phase) and `## Plan wykonania` (the wave table)
 * directly, wave-aware (same path in different fale is not a conflict) — see the docblock above
 * `checkSpec()` below for the full contract and exit codes of this mode.
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

/**
 * ---------------------------------------------------------------------------------------------
 * `--spec` mode (spec 1.35.0 P2) — reads a spec's own `## Fazy` (each phase's `Owns:` table) and
 * `## Plan wykonania` (the wave table), instead of a plan's fenced `ownership:` yaml block above.
 * This is a second, additive mode on the same CLI and module — the legacy `ownership:`-block path
 * above is untouched; existing callers on run logs keep working exactly as before.
 *
 *   node tools/ownership-check.js --spec <spec-file>
 *
 * Exit codes:
 *   0 — every phase under `## Fazy` has an `Owns:` table, no two phases in the same `fala` share a
 *       path, and the declared wave count is not more than the computed minimum requires.
 *   1 — a phase under `## Fazy` has no `Owns:` table (spec recognized, no silent "nothing to
 *       check" the way an absent `ownership:` block is in legacy mode — a spec commits to this
 *       data once it has `## Fazy`), OR two phases share a path within the same `fala`, OR the
 *       declared wave count exceeds the computed minimum ("nadmierna serializacja"), OR
 *       `## Fazy` / `## Plan wykonania` is missing or malformed.
 *
 * Conflict dimension (P2.2, replaces the abandoned F1.1 of the superseded spec 2026-08-06): two
 * phases sharing a path in *different* fale is not a conflict — a fala is the actual dispatch
 * boundary, and two phases scheduled apart never touch the file at the same time.
 *
 * Minimal-wave computation (P2.3) and the "blokuje lidera" exclusion. A phase whose fala carries
 * a named entry in the "Blokuje lidera" column is excluded from the file-only comparison — the
 * tool sees path sets and nothing else, and a lead-blocking phase is very often serial for a
 * reason with no path in it at all (a human reviewing a result, in this very spec P0's facts
 * feeding P4/P5b). What "excluded" means here, concretely: **the entire fala that carries a
 * blocking phase is pinned** — it is counted as its own group and never merged with a neighboring
 * fala, in either direction. The reasoning: a lead-blocking phase is a synchronization point for
 * the *whole* fala it sits in (WF2 dispatches a fala as a unit and a Human-STOP or a wynik-only
 * dependency inside it holds up everything scheduled after it), not just for that one phase's own
 * files — so folding a neighboring, otherwise-mergeable fala across that boundary would erase the
 * exact signal the exclusion exists to preserve. Non-pinned fale are still free to merge with an
 * adjacent non-pinned fala when their path sets are disjoint, and the tool only ever proposes
 * merging fale that are already next to each other — it does not invent a reordering a human never
 * wrote. This is a spec-authoring-time judgment call the spec text does not spell out to this level
 * of detail (only the exclusion itself and that it must be reported, not the merge mechanics); it
 * is written out in full here so it is easy to check against this spec's own worked Done-when
 * (8 phases, 3 fale, P0 and P6 pinned, 2·3 pinned-and-solo groups == 3 declared == exit 0).
 * ---------------------------------------------------------------------------------------------
 */

/** Slices out the body of a top-level (`## `) markdown section by exact heading text, stopping at
 *  the next top-level heading (a line starting `## ` — three or more `#` does not count, so a
 *  phase's own `### ` headers inside `## Fazy` never end the section early). Returns the body text
 *  (without the heading line) or null when the heading is absent. */
function extractSection(text, headingText) {
  const lines = text.split(/\r\n|\n/);
  const headingRe = new RegExp(`^##\\s+${headingText}\\s*$`);
  let start = -1;
  let end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (start === -1) {
      if (headingRe.test(lines[i])) start = i + 1;
      continue;
    }
    if (/^##\s+\S/.test(lines[i])) {
      end = i;
      break;
    }
  }
  if (start === -1) return null;
  return lines.slice(start, end).join('\n');
}

/** Splits a `## Fazy` section body into per-phase line arrays, keyed by phase id (`P0`, `P5a`,
 *  `F1`, `F3b`, …), in declaration order. A phase begins at a `### <id> — …` header, where `<id>`
 *  is `P` or `F` followed by digits and an optional trailing lowercase letter (client specs number
 *  phases `F1..F5`, this repo's own specs use `P0..P8` — same grammar, different letter); everything
 *  up to the next such header (or the end of the section) is that phase's body. */
function parsePhaseBodies(faziSection) {
  const phaseHeaderRe = /^###\s+([PF][0-9]+[a-z]?)\s+—/;
  const lines = faziSection.split('\n');
  const phases = new Map();
  let current = null;
  for (const line of lines) {
    const m = phaseHeaderRe.exec(line);
    if (m) {
      current = [];
      phases.set(m[1], current);
      continue;
    }
    if (current) current.push(line);
  }
  return phases;
}

/** Pulls the file list out of one phase's `Owns:` markdown table. The table's cells wrap every
 *  path in backticks (the convention every phase in this spec follows) and the "Wymuszony przez"
 *  column never does, so "every backtick span in the table" is exactly "every path" — no need to
 *  split columns by `|` at all, which keeps this immune to the comma-separated multi-path cells
 *  some phases use (`P6`: `` `VERSION`, `package.json`, … | P6.1 ``).
 *  Returns null when the phase has no `Owns:` line, or when it has one but the table under it
 *  yields zero paths (both are the "malformed / absent" case the caller turns into exit 1). */
function extractOwnsFiles(phaseBodyLines) {
  const ownsIdx = phaseBodyLines.findIndex((l) => /^Owns:\s*$/.test(l));
  if (ownsIdx === -1) return null;
  const files = [];
  for (let i = ownsIdx + 1; i < phaseBodyLines.length; i++) {
    const line = phaseBodyLines[i];
    if (!/^\|/.test(line)) break; // table ends at the first line that isn't a pipe row
    for (const m of line.matchAll(/`([^`]+)`/g)) files.push(m[1]);
  }
  if (files.length === 0) return null;
  return files;
}

/** Parses one `Blokuje lidera` cell for a fala. Returns the Set of phase ids in that fala which
 *  are excluded from the minimal-wave comparison. Recognizes: `nie` / `—` / empty → nobody excluded;
 *  `<id>: tak` (one or more, markdown `**bold**` stripped first) → exactly those ids; a bare `tak`
 *  when the fala has exactly one phase → that phase. Anything else throws, naming the fala and the
 *  raw cell — an unrecognized shape must not be silently read as "nobody excluded". */
function parseBlocking(cell, phaseIds, waveNum) {
  const stripped = cell.replace(/\*\*/g, '').trim();
  if (stripped === '' || stripped === '—' || /^nie\b/i.test(stripped)) return new Set();

  const named = [...stripped.matchAll(/([A-Za-z0-9]+):\s*tak\b/g)].map((m) => m[1]);
  if (named.length > 0) {
    for (const id of named) {
      if (!phaseIds.includes(id)) {
        throw new Error(
          `fala ${waveNum}: "Blokuje lidera" names "${id}: tak" but "${id}" is not in this fala's Fazy list (${phaseIds.join(', ')})`
        );
      }
    }
    return new Set(named);
  }

  if (/^tak\b/i.test(stripped)) {
    if (phaseIds.length === 1) return new Set([phaseIds[0]]);
    throw new Error(
      `fala ${waveNum}: "Blokuje lidera" says "tak" without naming which phase, and the fala has ${phaseIds.length} phases (${phaseIds.join(', ')})`
    );
  }

  throw new Error(`fala ${waveNum}: "Blokuje lidera" cell not understood: "${cell}"`);
}

/** Parses the `## Plan wykonania` table into `{ num, phaseIds, blocked }` per fala, in row order.
 *  Throws (never silently drops a row) on anything that doesn't fit the five-column shape the
 *  spec-writing template requires. Returns null when the section itself is absent. */
function parseWaves(text) {
  const section = extractSection(text, 'Plan wykonania');
  if (section === null) return null;
  const rows = section.split('\n').filter((l) => /^\|/.test(l));
  if (rows.length < 2) {
    throw new Error('"## Plan wykonania" has no table rows under it');
  }
  const dataRows = rows.slice(2); // drop header row + `|---|---|...` separator row
  if (dataRows.length === 0) {
    throw new Error('"## Plan wykonania" table has a header but no fala rows');
  }
  const waves = [];
  for (const row of dataRows) {
    const cells = row.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 4) {
      throw new Error(`fala row has ${cells.length} column(s), expected 5 ("${row}")`);
    }
    const [falaCell, fazyCell, , blokujeCell] = cells;
    const waveNum = Number.parseInt(falaCell, 10);
    if (!Number.isFinite(waveNum)) {
      throw new Error(`cannot parse a fala number from "${falaCell}" ("${row}")`);
    }
    const phaseIds = fazyCell
      .split('·')
      .map((s) => s.trim())
      .filter(Boolean);
    if (phaseIds.length === 0) {
      throw new Error(`fala ${waveNum} lists no phases in its Fazy column`);
    }
    const blocked = parseBlocking(blokujeCell, phaseIds, waveNum);
    waves.push({ num: waveNum, phaseIds, blocked });
  }
  return waves;
}

/** Returns the normalized union of every path a set of phase ids owns. */
function waveFileSet(phaseFiles, phaseIds) {
  const set = new Set();
  for (const pid of phaseIds) {
    for (const f of phaseFiles.get(pid) || []) set.add(normalize(f));
  }
  return set;
}

function setsIntersect(a, b) {
  for (const x of a) {
    if (b.has(x)) return true;
  }
  return false;
}

/** P2.2 — every path shared by 2+ phases *within the same fala*. Cross-fala sharing is never a
 *  conflict (that's the whole point of a wave-aware check replacing the file-only F1.1 design). */
function findSpecConflicts(phaseFiles, waves) {
  const conflicts = [];
  for (const wave of waves) {
    const owners = new Map(); // normalized path -> { display, phases: Set }
    for (const pid of wave.phaseIds) {
      for (const f of phaseFiles.get(pid) || []) {
        const key = normalize(f);
        if (!owners.has(key)) owners.set(key, { display: f, phases: new Set() });
        owners.get(key).phases.add(pid);
      }
    }
    for (const { display, phases } of owners.values()) {
      if (phases.size > 1) conflicts.push({ wave: wave.num, path: display, phases: [...phases] });
    }
  }
  return conflicts;
}

/** P2.3 — the minimal number of fale the declared plan could have used, computed by walking the
 *  declared fale in order and greedily merging each fala into the still-open group only when (a)
 *  neither it nor the open group is pinned by a "blokuje lidera" phase, and (b) their path sets
 *  are disjoint. See the design-decision comment above this section for why pinned fale never
 *  merge in either direction. Returns the resulting group count — always <= the declared count,
 *  since merging only ever removes a boundary. */
function computeMinimalWaves(phaseFiles, waves) {
  const groups = [];
  let open = null;
  for (const wave of waves) {
    const files = waveFileSet(phaseFiles, wave.phaseIds);
    const pinned = wave.blocked.size > 0;
    if (pinned) {
      if (open) {
        groups.push(open);
        open = null;
      }
      groups.push({ files, phaseIds: [...wave.phaseIds] });
      continue;
    }
    if (open && !setsIntersect(open.files, files)) {
      for (const f of files) open.files.add(f);
      open.phaseIds.push(...wave.phaseIds);
    } else {
      if (open) groups.push(open);
      open = { files, phaseIds: [...wave.phaseIds] };
    }
  }
  if (open) groups.push(open);
  return groups.length;
}

/** `--spec` mode entry point (P2.1–P2.4). Exits the process directly, same contract as legacy
 *  `main()` below. */
function checkSpec(specFile) {
  const resolved = path.resolve(specFile);
  let text;
  try {
    text = fs.readFileSync(resolved, 'utf8');
  } catch (err) {
    console.error(`ownership-check: cannot read ${specFile} — ${err.message}`);
    process.exit(1);
  }

  const faziSection = extractSection(text, 'Fazy');
  if (faziSection === null) {
    console.error(`ownership-check: ${specFile} has no "## Fazy" section — not a spec this tool can read`);
    process.exit(1);
  }

  const phaseBodies = parsePhaseBodies(faziSection);
  if (phaseBodies.size === 0) {
    console.error(
      `ownership-check: ${specFile} has a "## Fazy" section but no "### P<n> — …" or "### F<n> — …" phase headers under it`
    );
    process.exit(1);
  }

  const phaseFiles = new Map();
  const missingOwns = [];
  for (const [id, bodyLines] of phaseBodies) {
    const files = extractOwnsFiles(bodyLines);
    if (files === null) {
      missingOwns.push(id);
      continue;
    }
    phaseFiles.set(id, files);
  }
  if (missingOwns.length > 0) {
    console.error(
      `ownership-check: FAILED — ${specFile} has phase(s) under "## Fazy" with no (or empty) "Owns:" table: ` +
        missingOwns.join(', ')
    );
    process.exit(1);
  }

  let waves;
  try {
    waves = parseWaves(text);
  } catch (err) {
    console.error(`ownership-check: malformed "## Plan wykonania" in ${specFile}`);
    console.error(`  ${err.message}`);
    process.exit(1);
  }
  if (waves === null) {
    console.error(`ownership-check: ${specFile} has "## Fazy" but no "## Plan wykonania" table — cannot check fale`);
    process.exit(1);
  }

  const unknownPhases = new Set();
  for (const wave of waves) {
    for (const pid of wave.phaseIds) {
      if (!phaseFiles.has(pid)) unknownPhases.add(pid);
    }
  }
  if (unknownPhases.size > 0) {
    console.error(
      `ownership-check: "## Plan wykonania" references phase(s) not found under "## Fazy": ` +
        [...unknownPhases].join(', ')
    );
    process.exit(1);
  }

  const conflicts = findSpecConflicts(phaseFiles, waves);
  if (conflicts.length > 0) {
    console.error(`ownership-check: FAILED — ${conflicts.length} same-fala conflict(s) in ${specFile}`);
    for (const c of conflicts) {
      console.error(`  fala ${c.wave}: ${c.path}  <-  ${c.phases.join(', ')}`);
    }
    process.exit(1);
  }

  const declaredWaveCount = waves.length;
  const minimalWaveCount = computeMinimalWaves(phaseFiles, waves);
  const excluded = [];
  for (const wave of waves) {
    for (const pid of wave.blocked) excluded.push(pid);
  }

  if (minimalWaveCount < declaredWaveCount) {
    console.error(
      `ownership-check: FAILED — excessive serialization in ${specFile}: minimum possible is ` +
        `${minimalWaveCount} fala(-e), plan declares ${declaredWaveCount}`
    );
    process.exit(1);
  }

  console.log(
    `ownership-check: ${phaseFiles.size} faz(a), ${declaredWaveCount} fal(a) — ${specFile} is clear to parallelize as planned.`
  );
  if (excluded.length > 0) {
    console.log(`  wyłączone z porównania minimum (blokują lidera): ${excluded.join(', ')}`);
  }
  process.exit(0);
}

function main() {
  const argv = process.argv.slice(2);

  const specIdx = argv.indexOf('--spec');
  if (specIdx !== -1) {
    const specFile = argv[specIdx + 1];
    if (!specFile) {
      console.error('ownership-check: usage: node tools/ownership-check.js --spec <spec-file>');
      process.exit(1);
    }
    checkSpec(specFile);
    return;
  }

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

module.exports = {
  findOwnershipBlock,
  parseOwnership,
  findConflicts,
  normalize,
  extractSection,
  parsePhaseBodies,
  extractOwnsFiles,
  parseBlocking,
  parseWaves,
  findSpecConflicts,
  computeMinimalWaves,
};

#!/usr/bin/env node
'use strict';

/**
 * Context-cost reporter — the other half of "did this change help?"
 *
 * A pass/fail eval cannot see the thing the Claude-5 context-engineering guidance is actually
 * about: tokens spent and instructions competing with each other. Anthropic's claim is >80% of
 * Claude Code's system prompt removed with *no measurable loss* on coding evals — a two-sided
 * result. Reproducing that shape here needs two numbers, not one: evals still green (eval-status
 * plus the A/B protocol) AND loaded context down (this).
 *
 * What it measures: bytes and words of the markdown a role or skill loads, grouped by unit.
 *
 * What it is NOT: a token count. Tokens need the API (`messages.count_tokens`) and this repo has
 * no dependencies and intends to keep none — `npm test` runs on plain node. Bytes and words are
 * a deterministic proxy, honest for *comparison between two refs of the same file*, which is the
 * only use it is put to here. Do not quote these numbers as token counts.
 *
 * SKILL.md is reported separately from its references, because that is the distinction that
 * matters: a SKILL.md loads whole on trigger, a reference loads only when read. A large skill
 * with small references is the progressive-disclosure pattern working; a large SKILL.md is the
 * monolith it replaces.
 *
 * Run:  node evals/harness/context-cost.js [--top N] [--dir <path>]
 */

const fs = require('fs');
const path = require('path');

const LINE_SPLIT = /\r?\n/; // this repo is CRLF on disk

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, out);
    else if (entry.name.endsWith('.md')) out.push(abs);
  }
  return out;
}

function measure(absPath) {
  const text = fs.readFileSync(absPath, 'utf8');
  return {
    bytes: Buffer.byteLength(text, 'utf8'),
    words: text.split(/\s+/).filter(Boolean).length,
    lines: text.split(LINE_SPLIT).length,
  };
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/** Group by the unit a reader actually loads: one skill directory, or one agent role file. */
function collect(repoRoot) {
  const units = [];

  const skillsRoot = path.join(repoRoot, 'skills');
  if (fs.existsSync(skillsRoot)) {
    for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(skillsRoot, entry.name);
      const files = walk(dir);
      let entrypoint = { bytes: 0, words: 0, lines: 0 };
      let references = { bytes: 0, words: 0, lines: 0, count: 0 };
      for (const f of files) {
        const m = measure(f);
        if (path.basename(f) === 'SKILL.md' && path.dirname(f) === dir) {
          entrypoint = m;
        } else {
          references.bytes += m.bytes;
          references.words += m.words;
          references.lines += m.lines;
          references.count++;
        }
      }
      units.push({ kind: 'skill', name: entry.name, entrypoint, references });
    }
  }

  const agentsRoot = path.join(repoRoot, 'agents');
  if (fs.existsSync(agentsRoot)) {
    for (const f of fs.readdirSync(agentsRoot).filter((n) => n.endsWith('.md') && n !== 'README.md')) {
      units.push({
        kind: 'agent',
        name: path.basename(f, '.md'),
        entrypoint: measure(path.join(agentsRoot, f)),
        references: { bytes: 0, words: 0, lines: 0, count: 0 },
      });
    }
  }

  return units;
}

function main(argv) {
  const topIdx = argv.indexOf('--top');
  const top = topIdx !== -1 ? Number(argv[topIdx + 1]) : Infinity;
  const dirIdx = argv.indexOf('--dir');
  const repoRoot = dirIdx !== -1 ? path.resolve(argv[dirIdx + 1]) : path.resolve(__dirname, '..', '..');

  const units = collect(repoRoot);
  const skills = units.filter((u) => u.kind === 'skill').sort((a, b) => b.entrypoint.bytes - a.entrypoint.bytes);
  const agents = units.filter((u) => u.kind === 'agent').sort((a, b) => b.entrypoint.bytes - a.entrypoint.bytes);

  console.log('\n  Loaded-on-trigger cost — SKILL.md entrypoints (references load only when read)\n');
  console.log(`  ${'unit'.padEnd(24)} ${'entrypoint'.padStart(10)} ${'words'.padStart(7)}   references`);
  let entryTotal = 0;
  let refTotal = 0;
  skills.slice(0, top).forEach((u) => {
    entryTotal += u.entrypoint.bytes;
    refTotal += u.references.bytes;
    const refs = u.references.count ? `${u.references.count} files, ${kb(u.references.bytes)}` : '—';
    console.log(
      `  ${u.name.padEnd(24)} ${kb(u.entrypoint.bytes).padStart(10)} ${String(u.entrypoint.words).padStart(7)}   ${refs}`
    );
  });
  for (const u of skills.slice(top)) {
    entryTotal += u.entrypoint.bytes;
    refTotal += u.references.bytes;
  }

  console.log('\n  Agent role definitions (loaded whole when the role is spawned)\n');
  let agentTotal = 0;
  for (const u of agents) {
    agentTotal += u.entrypoint.bytes;
    console.log(`  ${u.name.padEnd(24)} ${kb(u.entrypoint.bytes).padStart(10)} ${String(u.entrypoint.words).padStart(7)}`);
  }

  console.log(
    `\n  totals — skill entrypoints ${kb(entryTotal)} · skill references ${kb(refTotal)} · agent roles ${kb(agentTotal)}`
  );
  console.log('  (bytes/words, not tokens — valid for comparing two refs of the same file, nothing else)\n');
}

module.exports = { measure, collect };

if (require.main === module) main(process.argv.slice(2));

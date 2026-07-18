#!/usr/bin/env node
'use strict';

/**
 * SessionStart triage: is this repo still on the current Sailes standard?
 *
 * Cheap and presence-only by design. It compares the repo's `Framework-Version:`
 * stamp (AGENTS.md header) against the installed plugin's VERSION and, on a delta,
 * points at the real audit — `sailes-bootstrap/adopt-existing-repo.md` Upgrade mode.
 * It never scaffolds and never edits: a script cannot see DRIFT, only absence
 * (adopt-existing-repo.md:57), and the human approves every delta (:74).
 *
 * Silence is the default. Anything printed here costs context on every session,
 * and a repo that is up to date — or was never a Sailes repo — has nothing to say.
 */

const path = require('path');

const { readStdin, read, exists, findRepoRoot, emit } = require('./lib/repo-state');

const MAX_HEADER_LINES = 40; // the stamp lives in the AGENTS.md header, not the body
const MAX_DELTA_ENTRIES = 8;

function parseVersion(raw) {
  const m = /^\s*v?(\d+)\.(\d+)(?:\.(\d+))?/.exec(String(raw || '').trim());
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3] || 0)];
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

function formatVersion(v) {
  return v.join('.');
}

/** The stamp: `> Framework-Version: 1.4.0` in the AGENTS.md header (agents-md-template.md:29). */
function findStamp(agentsMd) {
  const header = agentsMd.split(/\r?\n/).slice(0, MAX_HEADER_LINES);
  for (const line of header) {
    const m = /Framework-Version:\s*(.+)$/i.exec(line);
    if (m) return parseVersion(m[1]); // null when the template placeholder was never filled in
  }
  return null;
}

/**
 * CHANGELOG headings (`## 1.4.0 — 2026-07-14 · title`) strictly above `from`, up to `to`.
 * Headings only — the hook names the delta; the skill reads the entries.
 */
function changelogDelta(changelog, from, to) {
  if (!changelog) return [];
  const out = [];
  for (const line of changelog.split(/\r?\n/)) {
    const m = /^##\s+(\d+\.\d+(?:\.\d+)?)\s*(?:[—–-]\s*(.*))?$/.exec(line.trim());
    if (!m) continue;
    const v = parseVersion(m[1]);
    if (!v) continue;
    if (compareVersions(v, from) > 0 && compareVersions(v, to) <= 0) {
      out.push(`  - ${m[1]}${m[2] ? ` — ${m[2].trim()}` : ''}`);
    }
  }
  return out.slice(0, MAX_DELTA_ENTRIES);
}

function main() {
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
  if (!pluginRoot) return; // not running as a plugin hook — nothing to compare against

  const current = parseVersion(read(path.join(pluginRoot, 'VERSION')));
  if (!current) return; // no readable standard version; stay quiet rather than guess

  let input = {};
  try {
    input = JSON.parse(readStdin() || '{}');
  } catch {
    /* fall through to cwd */
  }

  const root = findRepoRoot(input.cwd || process.cwd());
  const agentsMd = read(path.join(root, 'AGENTS.md'));
  const hasAiDir = exists(path.join(root, '.ai'));

  // Not a Sailes repo. The plugin is enabled globally, so silence here is what keeps
  // it from nagging in every unrelated checkout.
  if (agentsMd === null && !hasAiDir) return;

  if (agentsMd === null) {
    emit(
      'SessionStart',
      `[sailes] This repo has \`.ai/\` but no root AGENTS.md, so the methodology layer is partial ` +
        `and unstamped. Current Sailes standard: ${formatVersion(current)}. ` +
        `Offer to run the sailes-bootstrap audit (\`adopt-existing-repo.md\` Step 0) to see what is ` +
        `MISSING vs DRIFTED. Do not scaffold anything unless the human asks.`
    );
    return;
  }

  const stamped = findStamp(agentsMd);

  if (!stamped) {
    emit(
      'SessionStart',
      `[sailes] This repo's AGENTS.md carries no \`Framework-Version:\` stamp, so its distance from ` +
        `the standard is unknown. Current Sailes standard: ${formatVersion(current)}. ` +
        `Offer to run the sailes-bootstrap audit (\`adopt-existing-repo.md\` Step 0, element 12) — ` +
        `it stamps the version once the repo's actual state is established. Not urgent; mention it once.`
    );
    return;
  }

  const cmp = compareVersions(stamped, current);

  if (cmp === 0) return; // up to date — say nothing, cost nothing

  if (cmp > 0) {
    emit(
      'SessionStart',
      `[sailes] This repo is stamped Framework-Version ${formatVersion(stamped)}, but the installed ` +
        `sailes-app-builder plugin is ${formatVersion(current)} — the plugin is behind the repo. ` +
        `Likely the local plugin needs updating; do not "downgrade" the repo to match it.`
    );
    return;
  }

  const delta = changelogDelta(read(path.join(pluginRoot, 'CHANGELOG.md')), stamped, current);
  const deltaBlock = delta.length
    ? `\nStandard changed in:\n${delta.join('\n')}\n`
    : '\n';

  emit(
    'SessionStart',
    `[sailes] This repo is stamped Framework-Version ${formatVersion(stamped)}; the current Sailes ` +
      `standard is ${formatVersion(current)}.${deltaBlock}` +
      `Tell the human this at the start of your first reply and OFFER to run ` +
      `\`sailes-bootstrap\` → \`adopt-existing-repo.md\` Upgrade mode, which reads the CHANGELOG delta ` +
      `and proposes an upgrade plan. Do not run it, and do not change any files, unless they accept — ` +
      `the repo may have deliberately diverged, and documented drift wins over forced alignment. ` +
      `If they decline or want to get on with their task, drop it and do not raise it again this session.`
  );
}

try {
  main();
} catch {
  // A triage hint is never worth breaking a session over.
  process.exit(0);
}

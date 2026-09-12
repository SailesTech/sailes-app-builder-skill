#!/usr/bin/env node
'use strict';

/**
 * token-report — measures the token cost of Claude Code sessions from transcript JSONL files.
 *
 * Built for `.ai/specs/2026-09-12-token-cost-of-running.md` (P0): the spec's numbers (706 M lead /
 * 1 297 M subagent context tokens, 11–12.09) came from ad-hoc scripts in a scratchpad; this is that
 * measurement turned into a deterministic, testable tool so the before/after comparison in P5 does
 * not depend on rerunning hand-written throwaway code.
 *
 * Layout (measured in `~/.claude/projects/-home-charlie-Work-partner-portal-v3`):
 *   <dir>/<session>.jsonl                        — a lead (main) session transcript
 *   <dir>/<session>/subagents/agent-*.jsonl       — a subagent transcript
 *   <dir>/<session>/subagents/agent-*.meta.json   — sibling meta file naming the agent type
 *                                                    (`agentType`, e.g. "sailes-app-builder:be-dev";
 *                                                    falls back to `subagent_type`/`subagentType`)
 *
 * Context tokens per assistant call = input_tokens + cache_creation_input_tokens +
 * cache_read_input_tokens. One API message is split across several JSONL lines that all repeat the
 * `usage` object (observed directly in real transcripts: a `thinking` line and the `tool_use` lines
 * that follow it share one `message.id` and one `usage`) — so usage is deduped by `message.id`, but
 * `tool_use` blocks are collected from EVERY line, never only from the line where usage is first
 * seen. The first version of this measurement (2026-09-12, scratchpad) undercounted spawns 10 vs
 * 177 for exactly that reason — it only scanned `tool_use` inside the same `if` that gated the
 * usage dedupe, so a `tool_use` on a later line for an already-seen `message.id` was silently
 * dropped. That is a named test case here (see token-report.test.js), not a footnote.
 *
 * Date filter — DECISION (frozen by the human, 2026-09-12): filtering is by file **mtime**, not by
 * message timestamps inside the transcript, and the day boundary is **local time**, not UTC. The
 * original 2026-09-12 measurement that produced the spec's baseline numbers used `mtime >=
 * 2026-09-11`; matching that is what let this tool reproduce those numbers (verified against the
 * live directory: exact match on turns p50/max, first-turn context p50/p90, and the full
 * unprefixed-spawn breakdown by role; see the P0 run log for the small drift that remained,
 * attributed to the client repo's real work continuing between the spec's measurement and this run,
 * not to the algorithm). `--since D` includes files with mtime >= D 00:00 LOCAL time; `--until D`
 * EXCLUDES files with mtime >= D 00:00 local time — i.e. `[since, until)` is half-open, so
 * `--since 2026-09-11 --until 2026-09-13` means the two calendar days 09-11 and 09-12 local time,
 * matching the spec's "two days of work (11–12.09)" framing.
 *
 * Malformed JSONL lines (a `JSON.parse` failure — e.g. the unfinished last line of a transcript
 * still being written) are skipped and counted, never fatal. The count is reported in the text and
 * `--json` output as `malformedLines`, and also written to stderr when non-zero.
 *
 * Role attribution mechanism for a subagent transcript: the sibling `<file>.meta.json` next to
 * `agent-*.jsonl`, field `agentType` (falls back to `subagent_type`/`subagentType` if `agentType` is
 * absent), with any `pluginName:` prefix stripped down to the bare role name by taking everything
 * after the LAST `:`. No meta file, an unreadable/malformed meta file, or a meta file with none of
 * those three fields all fall back to the literal role name `"unknown"` — never a thrown error.
 *
 * Usage:
 *   node tools/token-report.js <projectTranscriptDir> [--since YYYY-MM-DD] [--until YYYY-MM-DD] [--json]
 *
 * Confidentiality: this tool only ever prints/returns aggregates, distributions and role names it
 * derives from usage numbers and `subagent_type`/`agentType` strings — never message content, tool
 * input, or file paths from the scanned project. Any report this tool writes to disk should still be
 * grepped for the source directory path before being committed to a repo that goes to GitHub.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Roles that are not "old, unprefixed role names" even though they carry no `plugin:` prefix —
// Claude Code's own built-in subagent types. See spec D4 / table Q3.
const BUILTIN_SUBAGENT_TYPES = new Set([
  'general-purpose', 'Explore', 'Plan', 'claude', 'statusline-setup', 'claude-code-guide',
]);

const HELP = `token-report — token cost of Claude Code sessions, from transcript JSONL files

Usage:
  node tools/token-report.js <projectTranscriptDir> [--since YYYY-MM-DD] [--until YYYY-MM-DD] [--json]

Options:
  --since YYYY-MM-DD   include files with mtime >= this date, 00:00 LOCAL time
  --until YYYY-MM-DD   EXCLUDE files with mtime >= this date, 00:00 LOCAL time.
                       --since/--until form a half-open range [since, until): "--since 2026-09-11
                       --until 2026-09-13" covers the two calendar days 09-11 and 09-12 local time.
  --json               print a machine-readable report instead of the text summary
  --help, -h           print this message

Definitions:
  Context tokens per assistant call = input_tokens + cache_creation_input_tokens +
    cache_read_input_tokens. Usage is deduped by message.id (one API message can span several
    JSONL lines that repeat usage); tool_use blocks are collected from every line regardless.
  A "spawn" is a tool_use block named Agent or Task; its subagent_type is read from tool input.
  A spawn is "unprefixed" when subagent_type has no "name:role" (plugin) prefix and is not one of
    the built-ins: ${[...BUILTIN_SUBAGENT_TYPES].join(', ')}.
  A subagent transcript's ROLE comes from its sibling <file>.meta.json ("agentType", falling back
    to "subagent_type"/"subagentType"), with any "pluginName:" prefix stripped. Missing/unreadable
    meta -> role "unknown".
  DATE FILTER IS BY FILE MTIME, LOCAL TIME, NOT BY MESSAGE TIMESTAMPS INSIDE THE TRANSCRIPT — see
    the header comment in this file's source for why. Omitting --since/--until includes every
    transcript found under the directory.
  A malformed JSONL line (JSON.parse failure) is skipped and counted in "malformedLines"; it never
    fails the run.
`;

function printHelp(stream) {
  (stream || process.stdout).write(HELP);
}

/** Parse YYYY-MM-DD as a LOCAL-time start-of-day timestamp in ms, or throw. */
function parseDateArg(name, value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${name} expects YYYY-MM-DD, got: ${value}`);
  }
  const [year, month, day] = value.split('-').map(Number);
  const dt = new Date(year, month - 1, day); // local midnight, deliberately not Date.parse(...'Z')
  if (Number.isNaN(dt.getTime()) || dt.getMonth() !== month - 1) {
    throw new Error(`${name} is not a valid date: ${value}`);
  }
  return dt.getTime();
}

function parseArgs(argv) {
  const result = { dir: null, sinceMs: null, untilMs: null, json: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      result.help = true;
    } else if (a === '--json') {
      result.json = true;
    } else if (a === '--since') {
      i++;
      result.sinceMs = parseDateArg('--since', argv[i]);
    } else if (a === '--until') {
      i++;
      result.untilMs = parseDateArg('--until', argv[i]);
    } else if (a.startsWith('--')) {
      throw new Error(`unknown flag: ${a}`);
    } else if (result.dir === null) {
      result.dir = a;
    } else {
      throw new Error(`unexpected extra argument: ${a}`);
    }
  }
  return result;
}

/** Strip a "plugin:role" prefix down to the bare role name. No colon → returned as-is. */
function roleFromAgentType(agentType) {
  if (!agentType) return 'unknown';
  const idx = agentType.lastIndexOf(':');
  return idx === -1 ? agentType : agentType.slice(idx + 1);
}

function isUnprefixedSpawn(subagentType) {
  if (!subagentType) return false;
  if (subagentType.includes(':')) return false;
  if (BUILTIN_SUBAGENT_TYPES.has(subagentType)) return false;
  return true;
}

/**
 * Walk `dir` for the two known shapes only (not a generic recursive walk): lead sessions are
 * `<dir>/<session>.jsonl`; subagents are `<dir>/<session>/subagents/agent-*.jsonl` with an optional
 * sibling `.meta.json` naming the role.
 */
function discoverTranscripts(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];

  for (const e of entries) {
    if (e.isFile() && e.name.endsWith('.jsonl')) {
      out.push({ filePath: path.join(dir, e.name), kind: 'lead', role: null });
    }
  }

  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const subagentsDir = path.join(dir, e.name, 'subagents');
    if (!fs.existsSync(subagentsDir)) continue;
    let subEntries;
    try {
      subEntries = fs.readdirSync(subagentsDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const se of subEntries) {
      if (!se.isFile() || !se.name.endsWith('.jsonl') || !se.name.startsWith('agent-')) continue;
      const filePath = path.join(subagentsDir, se.name);
      const metaPath = filePath.replace(/\.jsonl$/, '.meta.json');
      let role = 'unknown';
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          const agentType = meta.agentType || meta.subagent_type || meta.subagentType || null;
          role = roleFromAgentType(agentType);
        } catch {
          // malformed meta file — keep 'unknown' rather than fail the whole report
        }
      }
      out.push({ filePath, kind: 'subagent', role });
    }
  }

  return out;
}

function withinWindow(mtimeMs, sinceMs, untilMs) {
  if (sinceMs !== null && mtimeMs < sinceMs) return false;
  if (untilMs !== null && mtimeMs >= untilMs) return false;
  return true;
}

/**
 * Parse one transcript file. Returns per-transcript aggregates plus the raw list of spawns found
 * in it (every tool_use named Agent/Task, from every line — see header comment).
 */
async function parseTranscript(filePath) {
  const seenUsageIds = new Set();
  const seenToolIds = new Set();
  let turns = 0;
  let firstTurnContext = null;
  let peakContext = 0;
  let contextTokens = 0;
  let malformedLines = 0;
  const spawns = [];

  const input = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.trim()) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      // A malformed line — e.g. the unfinished last line of a transcript still being written.
      // Skip it and count it; it is never fatal to the run.
      malformedLines += 1;
      continue;
    }
    const message = entry.message;
    if (!message || entry.type !== 'assistant') continue;

    // A turn is a distinct assistant message.id — full stop. It counts even when `usage` is
    // missing entirely (P0-09/P0-10: an assistant line can lack `usage`, e.g. a partial/streamed
    // write) and contributes 0 context tokens in that case, never NaN. Usage is still deduped by
    // message.id: several lines can repeat the SAME message.id/usage (split message), and that
    // must count once, not once per line.
    if (!seenUsageIds.has(message.id)) {
      seenUsageIds.add(message.id);
      turns += 1;
      const u = message.usage || {};
      const ctx = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0)
        + (u.cache_read_input_tokens || 0);
      if (firstTurnContext === null) firstTurnContext = ctx;
      peakContext = Math.max(peakContext, ctx);
      contextTokens += ctx;
    }

    // Collect tool_use from every line unconditionally — NOT nested inside the usage-dedupe
    // check above. That nesting is exactly the bug this tool must never reintroduce (see header).
    for (const block of message.content || []) {
      if (!block || block.type !== 'tool_use') continue;
      if (block.id) {
        if (seenToolIds.has(block.id)) continue;
        seenToolIds.add(block.id);
      }
      if (block.name === 'Agent' || block.name === 'Task') {
        const blockInput = block.input || {};
        const subagentType = blockInput.subagent_type || blockInput.subagentType || null;
        spawns.push({ subagentType });
      }
    }
  }

  return {
    turns,
    firstTurnContext: firstTurnContext || 0,
    peakContext,
    contextTokens,
    spawns,
    malformedLines,
  };
}

function percentile(sortedAsc, p) {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.floor(p * sortedAsc.length));
  return sortedAsc[idx];
}

function summarizeGroup(transcripts) {
  const n = transcripts.length;
  const contextTokensTotal = transcripts.reduce((a, t) => a + t.contextTokens, 0);
  const turnsSorted = transcripts.map((t) => t.turns).sort((a, b) => a - b);
  const firstSorted = transcripts.map((t) => t.firstTurnContext).sort((a, b) => a - b);
  const peakSorted = transcripts.map((t) => t.peakContext).sort((a, b) => a - b);
  const byTokensDesc = [...transcripts].sort((a, b) => b.contextTokens - a.contextTokens);
  const topCount = n === 0 ? 0 : Math.max(1, Math.ceil(n * 0.1));
  const topShare = contextTokensTotal > 0
    ? byTokensDesc.slice(0, topCount).reduce((a, t) => a + t.contextTokens, 0) / contextTokensTotal
    : 0;

  return {
    transcriptCount: n,
    contextTokensTotal,
    turns: {
      p50: percentile(turnsSorted, 0.5),
      max: turnsSorted.length ? turnsSorted[turnsSorted.length - 1] : 0,
    },
    firstTurnContext: {
      p50: percentile(firstSorted, 0.5),
      p90: percentile(firstSorted, 0.9),
    },
    peakContext: {
      p50: percentile(peakSorted, 0.5),
      max: peakSorted.length ? peakSorted[peakSorted.length - 1] : 0,
    },
    top10PercentShare: topShare,
  };
}

function summarizeByRole(subagentTranscripts) {
  const byRole = new Map();
  for (const t of subagentTranscripts) {
    const role = t.role || 'unknown';
    if (!byRole.has(role)) byRole.set(role, []);
    byRole.get(role).push(t);
  }
  const result = {};
  for (const [role, xs] of byRole) {
    const turnsSorted = xs.map((t) => t.turns).sort((a, b) => a - b);
    result[role] = {
      n: xs.length,
      turns: {
        p50: percentile(turnsSorted, 0.5),
        p90: percentile(turnsSorted, 0.9),
        max: turnsSorted.length ? turnsSorted[turnsSorted.length - 1] : 0,
      },
      contextTokensTotal: xs.reduce((a, t) => a + t.contextTokens, 0),
    };
  }
  return result;
}

async function buildReport({ dir, sinceMs, untilMs }) {
  const discovered = discoverTranscripts(dir);
  const leadStats = [];
  const subagentStats = [];
  const allSpawns = [];
  let malformedLines = 0;

  for (const d of discovered) {
    let mtimeMs;
    try {
      mtimeMs = fs.statSync(d.filePath).mtimeMs;
    } catch {
      continue;
    }
    if (!withinWindow(mtimeMs, sinceMs, untilMs)) continue;

    const parsed = await parseTranscript(d.filePath);
    allSpawns.push(...parsed.spawns);
    malformedLines += parsed.malformedLines;
    if (parsed.turns === 0) continue;

    if (d.kind === 'lead') {
      leadStats.push(parsed);
    } else {
      subagentStats.push({ ...parsed, role: d.role });
    }
  }

  const unprefixed = allSpawns.filter((s) => isUnprefixedSpawn(s.subagentType));
  const unprefixedByName = {};
  for (const s of unprefixed) {
    unprefixedByName[s.subagentType] = (unprefixedByName[s.subagentType] || 0) + 1;
  }

  return {
    dateFilter: { sinceMs, untilMs, basis: 'file-mtime-local' },
    lead: summarizeGroup(leadStats),
    subagents: summarizeGroup(subagentStats),
    subagentsByRole: summarizeByRole(subagentStats),
    spawns: {
      total: allSpawns.length,
      unprefixedTotal: unprefixed.length,
      unprefixedByName,
    },
    malformedLines,
  };
}

function fmtK(n) {
  return `${Math.round(n / 1000)}k`;
}

/**
 * Format a headline TOTAL (never a percentile or single-call peak — those stay in fmtK/fmtPct).
 * P0-34: the old unconditional `(n/1e6).toFixed(1) + 'M'` printed 15 000 tokens as "0.0M" — a real
 * total that rounds away to a string indistinguishable from zero. Below 1e6 tokens the raw count
 * (or a 1-decimal "k") stays visible; only totals that actually reach a million get the M suffix.
 */
function fmtTotal(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return `${n}`;
}

function fmtPct(x) {
  return `${Math.round(x * 100)}%`;
}

function renderGroup(label, g) {
  const lines = [];
  lines.push(`${label}: ${g.transcriptCount}`);
  lines.push(`  context tokens total          ${fmtTotal(g.contextTokensTotal)}`);
  lines.push(`  turns            p50 ${g.turns.p50}  max ${g.turns.max}`);
  lines.push(`  first-turn ctx   p50 ${fmtK(g.firstTurnContext.p50)}  p90 ${fmtK(g.firstTurnContext.p90)}`);
  lines.push(`  peak ctx         p50 ${fmtK(g.peakContext.p50)}  max ${fmtK(g.peakContext.max)}`);
  lines.push(`  top 10% of transcripts carry   ${fmtPct(g.top10PercentShare)}`);
  return lines.join('\n');
}

/** Format a local-midnight timestamp back to YYYY-MM-DD using LOCAL fields — never toISOString(),
 *  which would convert to UTC and can display the wrong calendar day near a timezone boundary. */
function fmtLocalDate(ms) {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function renderText(dir, args, report) {
  const lines = [];
  lines.push(`Token Report — ${dir}`);
  const since = args.sinceMs !== null ? fmtLocalDate(args.sinceMs) : '(none)';
  const until = args.untilMs !== null ? fmtLocalDate(args.untilMs) : '(none)';
  lines.push(`Window: --since ${since} --until ${until} (half-open [since, until), by file mtime, local time)`);
  lines.push('');
  lines.push(renderGroup('Lead sessions', report.lead));
  lines.push('');
  lines.push(renderGroup('Subagent transcripts', report.subagents));
  lines.push('');
  lines.push('Subagents by role:');
  lines.push('  role                 n   turns p50/p90/max   tokens');
  const roles = Object.entries(report.subagentsByRole).sort((a, b) => b[1].contextTokensTotal - a[1].contextTokensTotal);
  for (const [role, r] of roles) {
    lines.push(`  ${role.padEnd(20)} ${String(r.n).padStart(2)}   ${r.turns.p50}/${r.turns.p90}/${r.turns.max}`.padEnd(48) + fmtTotal(r.contextTokensTotal));
  }
  lines.push('');
  lines.push(`Spawns: ${report.spawns.total} total, ${report.spawns.unprefixedTotal} unprefixed (no plugin-name prefix, not built-in)`);
  const byName = Object.entries(report.spawns.unprefixedByName).sort((a, b) => b[1] - a[1]);
  for (const [name, count] of byName) {
    lines.push(`  ${name.padEnd(20)} ${count}`);
  }
  lines.push('');
  lines.push(`Malformed JSONL lines skipped: ${report.malformedLines}`);
  return lines.join('\n');
}

async function main(argv) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    process.stderr.write(`token-report: ${e.message}\n\n`);
    printHelp(process.stderr);
    process.exitCode = 1;
    return;
  }

  if (args.help) {
    printHelp(process.stdout);
    return;
  }

  if (!args.dir) {
    process.stderr.write('token-report: missing <projectTranscriptDir>\n\n');
    printHelp(process.stderr);
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(args.dir) || !fs.statSync(args.dir).isDirectory()) {
    process.stderr.write(`token-report: not a directory: ${args.dir}\n`);
    process.exitCode = 1;
    return;
  }

  const report = await buildReport({ dir: args.dir, sinceMs: args.sinceMs, untilMs: args.untilMs });

  if (report.malformedLines > 0) {
    process.stderr.write(`token-report: skipped ${report.malformedLines} malformed JSONL line(s)\n`);
  }

  if (args.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`${renderText(args.dir, args, report)}\n`);
  }
}

module.exports = {
  BUILTIN_SUBAGENT_TYPES,
  parseArgs,
  parseDateArg,
  roleFromAgentType,
  isUnprefixedSpawn,
  discoverTranscripts,
  withinWindow,
  parseTranscript,
  percentile,
  summarizeGroup,
  summarizeByRole,
  buildReport,
  renderText,
};

if (require.main === module) {
  main(process.argv.slice(2)).catch((e) => {
    process.stderr.write(`token-report: ${e.stack || e.message}\n`);
    process.exitCode = 1;
  });
}

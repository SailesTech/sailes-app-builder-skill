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
  node tools/token-report.js <projectTranscriptDir> [--since YYYY-MM-DD] [--until YYYY-MM-DD] [--json] [--cost]

Options:
  --since YYYY-MM-DD   include files with mtime >= this date, 00:00 LOCAL time
  --until YYYY-MM-DD   EXCLUDE files with mtime >= this date, 00:00 LOCAL time.
                       --since/--until form a half-open range [since, until): "--since 2026-09-11
                       --until 2026-09-13" covers the two calendar days 09-11 and 09-12 local time.
  --json               print a machine-readable report instead of the text summary
  --cost               add USD estimates (per transcript, and aggregated by label/role/tier) from
                       the built-in price table — see PRICE_TABLE_USD_PER_MTOK in the source
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
    meta -> role "unknown". <session>/subagents/workflows/wf_*/agent-*.jsonl is also a subagent
    (Workflow-tool layout), and so is agent-*.jsonl at the TOP of a wf_* directory passed directly.
  --cost prices by the transcript's REAL model (message.model), never the meta.json "model" alias.
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
  const result = { dir: null, sinceMs: null, untilMs: null, json: false, cost: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      result.help = true;
    } else if (a === '--json') {
      result.json = true;
    } else if (a === '--cost') {
      result.cost = true;
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
 * P1.2 — the ONE price table `--cost` reads from (USD per MILLION tokens, "standard" service
 * tier, per Narzędzia: "cena z jednej tabeli w pliku"). Keyed by model-id PREFIX (see
 * `priceForModel`, longest matching prefix wins) — NOT by tier bucket: two model generations in
 * the same tier (e.g. `claude-sonnet-5` vs `claude-sonnet-4-6`) carry different prices here, so a
 * tier-substring lookup would silently misprice one of them. Cache read/write are not separate
 * rows: they are each row's `input` price scaled by the multipliers the spec fixes — cache read
 * 0.1x input, cache write 1.25x input — not looked up from a second table. A model whose id
 * matches no prefix below is NOT priced (see `priceForModel`) — it is counted in the report's
 * `unpricedTranscripts`, never guessed at by falling back to a nearby row.
 *
 * Source: Anthropic API pricing, claude-api skill model table cached 2026-06-24 (lead-supplied,
 * spec 2026-09-16 P1 — this file's own knowledge cutoff has no visibility into current list
 * prices, and the spec's own price reference, `research/costs.md`, lives outside this repo).
 */
const PRICE_TABLE_USD_PER_MTOK = {
  'claude-fable-5': { input: 10, output: 50 },
  'claude-opus-5-5': { input: 4, output: 20 },
  'claude-opus-5': { input: 5, output: 25 },
  'claude-opus-4-8': { input: 5, output: 25 },
  'claude-opus-4-7': { input: 5, output: 25 },
  'claude-opus-4-6': { input: 5, output: 25 },
  'claude-sonnet-5': { input: 2, output: 10 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-haiku-4-5': { input: 1, output: 5 },
};

/**
 * P1 — prefix-keyed lookup into `priceTable` (keyed by model-id prefix, see
 * `PRICE_TABLE_USD_PER_MTOK`). The LONGEST matching prefix wins, so a more specific row (were one
 * ever added that is itself an extension of a shorter row's key) takes priority over a coarser
 * one. Returns `null` — never a nearby row's price — when no key in `priceTable` is a prefix of
 * `model`; the caller must treat that as "not priced".
 */
function priceForModel(model, priceTable) {
  if (!model) return null;
  let bestKey = null;
  for (const key of Object.keys(priceTable)) {
    if (model.startsWith(key) && (bestKey === null || key.length > bestKey.length)) {
      bestKey = key;
    }
  }
  return bestKey === null ? null : priceTable[bestKey];
}

/** Bucket a real model string (`message.model`) into a TIER for aggregation (`byTier` in
 *  `summarizeCost`) by substring — case-insensitive, since the API's model id
 *  (`claude-haiku-4-5-20251001`) always carries the family name in full. This is independent of
 *  pricing: `priceForModel` decides whether/how much a model costs, this only names its bucket. */
function tierFromModel(model) {
  if (!model) return 'unknown';
  const m = model.toLowerCase();
  if (m.includes('haiku')) return 'haiku';
  if (m.includes('sonnet')) return 'sonnet';
  if (m.includes('opus')) return 'opus';
  if (m.includes('fable')) return 'fable';
  return 'unknown';
}

/**
 * USD for one transcript's deduped usage records (see `parseTranscript`), at a single model —
 * P1.1 treats a transcript as having one real model, so pricing does too. Returns `usd` (0 when
 * the tier is not in `priceTable`) and `unpricedMessages` (a count, never silently absorbed into
 * `usd` as zero-and-indistinguishable — an unknown model should be visible in the report, not
 * quietly under-cost the transcript it belongs to).
 */
function costUsdForTranscript(usageMessages, model, priceTable) {
  const tier = tierFromModel(model);
  const price = priceForModel(model, priceTable);
  let usd = 0;
  let unpricedMessages = 0;
  if (!price) {
    unpricedMessages = usageMessages.length;
    return { usd, tier, unpricedMessages };
  }
  for (const m of usageMessages) {
    usd += (
      m.input * price.input
      + m.cacheCreate * price.input * 1.25
      + m.cacheRead * price.input * 0.1
      + m.output * price.output
    ) / 1e6;
  }
  return { usd, tier, unpricedMessages };
}

/**
 * Read a subagent's sibling `.meta.json` (P1.1): `role` (from `agentType`, falling back to
 * `subagent_type`/`subagentType`, plugin prefix stripped — unchanged from P0), plus the two new
 * fields P1.1 asks for: `label` (meta `description`) and `workflowPhase` (meta `workflowPhase`).
 * `agentType` is also returned RAW (unstripped) — some callers want the bare role, others the
 * full `plugin:role` string. Missing/unreadable meta — or a meta file with none of the role
 * fields — falls back to `role: 'unknown'`, `label: null`, `agentType: null`, `workflowPhase:
 * null`, never a thrown error (same contract P0 already had for `role`).
 */
function readSubagentMeta(filePath) {
  const metaPath = filePath.replace(/\.jsonl$/, '.meta.json');
  let role = 'unknown';
  let label = null;
  let agentType = null;
  let workflowPhase = null;
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      agentType = meta.agentType || meta.subagent_type || meta.subagentType || null;
      role = roleFromAgentType(agentType);
      if (typeof meta.description === 'string') label = meta.description;
      if (typeof meta.workflowPhase === 'string') workflowPhase = meta.workflowPhase;
    } catch {
      // malformed meta file — keep the defaults above rather than fail the whole report
    }
  }
  return { role, label, agentType, workflowPhase };
}

/** Collect `agent-*.jsonl` subagent transcripts directly inside `dirPath` (non-recursive). */
function collectAgentFiles(dirPath) {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.jsonl') || !e.name.startsWith('agent-')) continue;
    const filePath = path.join(dirPath, e.name);
    out.push({ filePath, kind: 'subagent', ...readSubagentMeta(filePath) });
  }
  return out;
}

/**
 * Walk `dir` for the known shapes (not a generic recursive walk):
 *   - lead sessions:    `<dir>/<session>.jsonl`
 *   - subagents:        `<dir>/<session>/subagents/agent-*.jsonl`
 *   - Workflow subagents (P1.1): `<dir>/<session>/subagents/workflows/wf_<id>/agent-<n>.jsonl` —
 *     the layout `agent()` calls inside the `Workflow` tool produce (spec 2026-09-16, P1.1).
 *   - a `wf_*` directory passed DIRECTLY as `dir` (only `agent-*.jsonl` at its top level, no
 *     wrapping `<session>/subagents/`): those are subagents too, never a lead — P1.1's explicit
 *     requirement, and what the phase's own Done-when invokes token-report on.
 * All three subagent shapes get their role/label/agentType/workflowPhase from the sibling
 * `.meta.json` via `readSubagentMeta`.
 */
function discoverTranscripts(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];

  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.jsonl')) continue;
    if (e.name.startsWith('agent-')) {
      // `dir` is itself a `wf_*` (or otherwise agent-file-only) directory — subagent, not lead.
      const filePath = path.join(dir, e.name);
      out.push({ filePath, kind: 'subagent', ...readSubagentMeta(filePath) });
    } else {
      out.push({
        filePath: path.join(dir, e.name), kind: 'lead',
        role: null, label: null, agentType: null, workflowPhase: null,
      });
    }
  }

  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const subagentsDir = path.join(dir, e.name, 'subagents');
    if (!fs.existsSync(subagentsDir)) continue;

    out.push(...collectAgentFiles(subagentsDir));

    // Workflow layout (P1.1): <session>/subagents/workflows/wf_*/agent-*.jsonl
    const workflowsDir = path.join(subagentsDir, 'workflows');
    let wfEntries;
    try {
      wfEntries = fs.readdirSync(workflowsDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const we of wfEntries) {
      if (!we.isDirectory() || !we.name.startsWith('wf_')) continue;
      out.push(...collectAgentFiles(path.join(workflowsDir, we.name)));
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
 *
 * P1.1/P1.2: also returns `model` — the REAL model, read from `message.model` on the transcript's
 * assistant lines (the first non-null one seen). This is deliberately NOT the sibling
 * `.meta.json`'s `model` field: that field is only the alias/override passed at the `agent()`
 * call site (e.g. `"haiku"`), or absent entirely, never the resolved model the API actually ran
 * (e.g. `"claude-haiku-4-5-20251001"`) — using it for `--cost` pricing would silently price by
 * request, not by what was billed.
 * Also returns `usageMessages`: one entry per distinct `message.id`, `{ input, cacheCreate,
 * cacheRead, output }`. `input`/`cacheCreate`/`cacheRead` are fixed at first sight of an id (they
 * repeat identically across a split message's lines, same as `contextTokens` above). `output` is
 * NOT: on a real transcript a split message's later lines carry a GROWING `output_tokens` snapshot
 * for the SAME id (measured on `wf_4eb1edf7-db8`: 1, 1, 768 across three lines of one message) —
 * so `output` here is the max seen, never the first, or `--cost` would price a generation at the
 * token count of its opening line.
 */
async function parseTranscript(filePath) {
  const usageByMessageId = new Map();
  const seenToolIds = new Set();
  let turns = 0;
  let firstTurnContext = null;
  let peakContext = 0;
  let contextTokens = 0;
  let malformedLines = 0;
  let model = null;
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
    const u = message.usage || {};
    if (!usageByMessageId.has(message.id)) {
      turns += 1;
      const ctx = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0)
        + (u.cache_read_input_tokens || 0);
      if (firstTurnContext === null) firstTurnContext = ctx;
      peakContext = Math.max(peakContext, ctx);
      contextTokens += ctx;
      usageByMessageId.set(message.id, {
        input: u.input_tokens || 0,
        cacheCreate: u.cache_creation_input_tokens || 0,
        cacheRead: u.cache_read_input_tokens || 0,
        output: u.output_tokens || 0,
      });
      if (model === null && message.model) model = message.model;
    } else {
      // Split message, later line: input/cache stay fixed, output can still grow — see doc comment.
      const rec = usageByMessageId.get(message.id);
      if (typeof u.output_tokens === 'number' && u.output_tokens > rec.output) {
        rec.output = u.output_tokens;
      }
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
    model,
    usageMessages: [...usageByMessageId.values()],
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

/**
 * P1.2 — USD aggregated per transcript (already on each stat via `costUSD`/`costTier`, attached in
 * `buildReport`), then summed per etykieta (label)/rola (role)/tier across BOTH groups — a lead
 * session has no label (leads carry no `.meta.json`) so `byLabel`/`byRole` only ever see subagents,
 * but `byTier` sees both: a lead session still ran on a real model and belongs in its tier's total.
 */
function summarizeCost(leadStats, subagentStats) {
  const byLabel = {};
  const byRole = {};
  const byTier = {};
  const unpricedTranscripts = {};
  let leadUSD = 0;
  let subagentsUSD = 0;
  let unpricedMessages = 0;

  const addTier = (t) => {
    byTier[t.costTier] = (byTier[t.costTier] || 0) + t.costUSD;
    unpricedMessages += t.costUnpriced;
    if (t.costUnpriced > 0) {
      const key = t.model || 'unknown';
      unpricedTranscripts[key] = (unpricedTranscripts[key] || 0) + 1;
    }
  };

  for (const t of leadStats) {
    leadUSD += t.costUSD;
    addTier(t);
  }
  for (const t of subagentStats) {
    subagentsUSD += t.costUSD;
    addTier(t);
    const label = t.label || 'unknown';
    const role = t.role || 'unknown';
    byLabel[label] = (byLabel[label] || 0) + t.costUSD;
    byRole[role] = (byRole[role] || 0) + t.costUSD;
  }

  return {
    leadUSD, subagentsUSD, totalUSD: leadUSD + subagentsUSD,
    byLabel, byRole, byTier, unpricedMessages, unpricedTranscripts,
  };
}

async function buildReport({ dir, sinceMs, untilMs, cost }) {
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

    let costFields = {};
    if (cost) {
      const c = costUsdForTranscript(parsed.usageMessages, parsed.model, PRICE_TABLE_USD_PER_MTOK);
      costFields = { costUSD: c.usd, costTier: c.tier, costUnpriced: c.unpricedMessages };
    }

    if (d.kind === 'lead') {
      leadStats.push({ ...parsed, ...costFields });
    } else {
      subagentStats.push({
        ...parsed, role: d.role, label: d.label, agentType: d.agentType,
        workflowPhase: d.workflowPhase, ...costFields,
      });
    }
  }

  const unprefixed = allSpawns.filter((s) => isUnprefixedSpawn(s.subagentType));
  const unprefixedByName = {};
  for (const s of unprefixed) {
    unprefixedByName[s.subagentType] = (unprefixedByName[s.subagentType] || 0) + 1;
  }

  const report = {
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

  if (cost) {
    report.cost = summarizeCost(leadStats, subagentStats);
  }

  return report;
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

/**
 * P0-34 (frozen plan, `.ai/test-plans/2026-09-12-token-cost-P0.md:180`): "every numeric metric
 * ... is identical between the two formats." A humanized string ("15.0k", "43%") is NOT identical
 * to the number `--json` holds — it is derived from it, lossily. These `dual*` helpers print the
 * exact value exactly as `String(jsonValue)` would render it (so `text.includes(String(json...))`
 * holds for every metric, not just totals), with the humanized form kept alongside in parentheses
 * for a human reading the terminal, never in place of the raw number.
 */
function dualCount(n, humanize) {
  return `${n} (${humanize(n)})`;
}

function dualPct(x) {
  return `${x} (${fmtPct(x)})`;
}

function renderGroup(label, g) {
  const lines = [];
  lines.push(`${label}: ${g.transcriptCount}`);
  lines.push(`  context tokens total          ${dualCount(g.contextTokensTotal, fmtTotal)}`);
  lines.push(`  turns            p50 ${g.turns.p50}  max ${g.turns.max}`);
  lines.push(`  first-turn ctx   p50 ${dualCount(g.firstTurnContext.p50, fmtK)}  p90 ${dualCount(g.firstTurnContext.p90, fmtK)}`);
  lines.push(`  peak ctx         p50 ${dualCount(g.peakContext.p50, fmtK)}  max ${dualCount(g.peakContext.max, fmtK)}`);
  lines.push(`  top 10% of transcripts carry   ${dualPct(g.top10PercentShare)}`);
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

function fmtUSD(n) {
  return `$${n.toFixed(2)}`;
}

function renderCost(report) {
  const c = report.cost;
  const lines = [];
  lines.push('');
  lines.push(`Cost: ${fmtUSD(c.totalUSD)} total  (lead ${fmtUSD(c.leadUSD)}, subagents ${fmtUSD(c.subagentsUSD)})`);
  if (c.unpricedMessages > 0) {
    lines.push(`  ${c.unpricedMessages} message(s) on a model outside the price table — priced as $0, see PRICE_TABLE_USD_PER_MTOK`);
    lines.push('  unpriced transcripts (model matched no prefix in the price table):');
    for (const [model, count] of Object.entries(c.unpricedTranscripts).sort((a, b) => b[1] - a[1])) {
      lines.push(`    ${model.padEnd(30)} ${count}`);
    }
  }
  lines.push('  by tier:');
  for (const [tier, usd] of Object.entries(c.byTier).sort((a, b) => b[1] - a[1])) {
    lines.push(`    ${tier.padEnd(10)} ${fmtUSD(usd)}`);
  }
  lines.push('  by role (subagents):');
  for (const [role, usd] of Object.entries(c.byRole).sort((a, b) => b[1] - a[1])) {
    lines.push(`    ${role.padEnd(20)} ${fmtUSD(usd)}`);
  }
  lines.push('  by label (subagents):');
  for (const [label, usd] of Object.entries(c.byLabel).sort((a, b) => b[1] - a[1])) {
    lines.push(`    ${label.padEnd(20)} ${fmtUSD(usd)}`);
  }
  return lines.join('\n');
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
  if (report.cost) {
    lines.push(renderCost(report));
  }
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

  const report = await buildReport({
    dir: args.dir, sinceMs: args.sinceMs, untilMs: args.untilMs, cost: args.cost,
  });

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
  PRICE_TABLE_USD_PER_MTOK,
  parseArgs,
  parseDateArg,
  roleFromAgentType,
  isUnprefixedSpawn,
  readSubagentMeta,
  collectAgentFiles,
  discoverTranscripts,
  withinWindow,
  parseTranscript,
  percentile,
  summarizeGroup,
  summarizeByRole,
  tierFromModel,
  priceForModel,
  costUsdForTranscript,
  summarizeCost,
  buildReport,
  renderText,
};

if (require.main === module) {
  main(process.argv.slice(2)).catch((e) => {
    process.stderr.write(`token-report: ${e.stack || e.message}\n`);
    process.exitCode = 1;
  });
}

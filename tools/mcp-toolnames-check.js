#!/usr/bin/env node
'use strict';

/**
 * mcp-toolnames-check — the `mcp__chrome-devtools__*` names three role files hardcode in their
 * `tools:` frontmatter, checked against the tool surface the installed chrome-devtools MCP server
 * actually offers, instead of trusted by eye.
 *
 * The gap this closes (backlog row 51, open since 2026-07-26): `agents/qa.md`, `agents/fe-dev.md`
 * and `agents/designer.md` each spell out a hand-picked list of `mcp__chrome-devtools__*` tool
 * names. Nothing has ever compared that list against the server's real `tools/list` response.
 * `handle_dialog` was found missing from `qa.md` in 1.17.1 by accident — an agent was reading the
 * frontmatter for an unrelated reason and happened to notice. Both directions of a mismatch cost
 * something and neither announces itself:
 *
 *   - a name a role lists but the server doesn't have fails at the moment the role needs it —
 *     mid-gate, on a live app, with no warning beforehand;
 *   - a tool the server offers that no role lists is a capability silently unavailable to every
 *     role that could have used it, and nothing ever says so.
 *
 * Sourcing the server's tool list. `npx chrome-devtools-mcp` speaks MCP over stdio: JSON-RPC 2.0,
 * one object per line on stdout. `initialize` -> its response carries capabilities; the client then
 * sends the `notifications/initialized` notification and a `tools/list` request, whose response
 * carries `result.tools[].name`. That handshake is `queryServerTools()` below — spawned fresh
 * (`--isolated --headless`, no running Chrome required) each run, torn down when it answers or when
 * it times out. It is the ONLY place this file talks to a live process, and it is exported on its
 * own so the sourcing mechanism can be fixed or swapped (a different flag, a persistent server, a
 * cached snapshot) without touching the diff logic that consumes its result. Do not hand-assemble a
 * tool list and hardcode it here "as if" it came from the server — that is the exact silent-failure
 * shape (an unverified list presented as ground truth) this tool exists to remove.
 *
 * Absent server -> `SKIP: <reason>`, exit 0. Never silent, never a printed PASS: same protocol as
 * archify (`skills/sailes-docs/references/archify-setup.md` "SKIP protocol") and the browser probe
 * (`evals/fixtures/browser-probe/run-probe.mjs`) — a check that cannot run says so, on its own line,
 * every time.
 *
 *   node tools/mcp-toolnames-check.js
 *   node tools/mcp-toolnames-check.js --role-files agents/qa.md,agents/fe-dev.md,agents/designer.md
 *   node tools/mcp-toolnames-check.js --server-tools-json <path>   # bypass live discovery (tests)
 *   node tools/mcp-toolnames-check.js --server-cmd "<command>"     # override the spawned command
 *   node tools/mcp-toolnames-check.js --timeout <ms>               # discovery timeout, default 30000
 *
 * Exit codes:
 *   0 — the role union and the server's tool list agree exactly, OR the server could not be reached
 *       (printed as `SKIP: <reason>`, not as a pass).
 *   1 — a role names a tool the server lacks, and/or the server offers a tool no role lists, and/or
 *       a role file could not be parsed (malformed frontmatter is rejected loudly, not read as
 *       "no tools").
 *
 * This script is intentionally NOT wired into `npm test`: that gate must stay deterministic and
 * external-free (AGENTS.md "Verification"), and this check depends on an installed MCP server
 * that npm test's environment does not guarantee. See the governing spec
 * (.ai/specs/2026-08-03-outstanding-debt-and-docs-delta.md, phase F5a) for where it is recommended
 * to live instead.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const MCP_TOOL_PREFIX = 'mcp__chrome-devtools__';

const DEFAULT_ROLE_FILES = [
  path.join(__dirname, '..', 'agents', 'qa.md'),
  path.join(__dirname, '..', 'agents', 'fe-dev.md'),
  path.join(__dirname, '..', 'agents', 'designer.md'),
];

// `--isolated --headless`: no running Chrome instance required, and nothing this run does persists
// past it — this call only wants the static tool schema, never a page.
const DEFAULT_SERVER_COMMAND = 'npx -y chrome-devtools-mcp@latest --isolated --headless';
const DEFAULT_TIMEOUT_MS = 30000;

// ---------------------------------------------------------------- role frontmatter parsing

/**
 * Extracts the raw value of the `tools:` line from a role file's YAML frontmatter (the fence
 * between the first two `---` lines). Reading only inside the frontmatter block — not the first
 * "tools:" match anywhere in the file — matters because role prose is free to use the word "tools"
 * elsewhere. Throws, naming the file, when there is no frontmatter fence or no `tools:` line inside
 * it: a role file that doesn't declare its tool surface at all is malformed input, not "zero tools".
 */
function extractFrontmatterToolsLine(text, label) {
  const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  if (!fmMatch) {
    throw new Error(`${label}: no YAML frontmatter fence found (expected a leading "---" block)`);
  }
  const frontmatter = fmMatch[1];
  const lineMatch = /^tools:[ \t]*(.*)$/m.exec(frontmatter);
  if (!lineMatch || lineMatch[1].trim() === '') {
    throw new Error(`${label}: frontmatter has no "tools:" line (or it is empty)`);
  }
  return lineMatch[1];
}

/** Splits a `tools:` line on commas and returns the bare names of every `mcp__chrome-devtools__*`
 *  entry (prefix stripped), in the order they appear. Non-devtools tools (Glob, Bash, ...) are not
 *  this check's concern and are dropped here. */
function parseMcpToolNames(toolsLine) {
  return toolsLine
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.startsWith(MCP_TOOL_PREFIX))
    .map((t) => t.slice(MCP_TOOL_PREFIX.length))
    .filter((t) => t.length > 0);
}

/**
 * Reads every role file in `filePaths` and returns Map<roleId, Set<toolName>>, roleId being the
 * file's basename with `.md` stripped (`agents/fe-dev.md` -> `fe-dev`). `readFile` is injectable so
 * tests can point at fixtures without touching the real `agents/` directory the F5a brief forbids
 * editing.
 */
function collectRoleTools(filePaths, readFile = (p) => fs.readFileSync(p, 'utf8')) {
  const map = new Map();
  for (const filePath of filePaths) {
    let text;
    try {
      text = readFile(filePath);
    } catch (err) {
      throw new Error(`cannot read role file ${filePath}: ${err.message}`);
    }
    const toolsLine = extractFrontmatterToolsLine(text, filePath);
    const names = parseMcpToolNames(toolsLine);
    const role = path.basename(filePath).replace(/\.md$/i, '');
    if (map.has(role)) {
      throw new Error(`duplicate role id "${role}" from two different --role-files paths`);
    }
    map.set(role, new Set(names));
  }
  return map;
}

// ---------------------------------------------------------------- diff

/**
 * Compares the union of every role's tool set against the server's tool list. Returns
 *   { missingFromServer: [{ role, tool }, ...], missingFromRoles: [tool, ...] }
 * both sorted for stable output. `missingFromServer` keeps the owning role attached — the same tool
 * name can appear once per role that claims it, because each occurrence is its own gate failure.
 * `missingFromRoles` has no role to attach (nobody claims it), so it is just the tool names.
 */
function diffToolSets(roleToolsMap, serverToolNames) {
  const serverSet = new Set(serverToolNames);
  const unionRoleTools = new Set();
  const missingFromServer = [];

  for (const [role, tools] of roleToolsMap) {
    for (const tool of tools) {
      unionRoleTools.add(tool);
      if (!serverSet.has(tool)) {
        missingFromServer.push({ role, tool });
      }
    }
  }
  missingFromServer.sort((a, b) =>
    a.role === b.role ? a.tool.localeCompare(b.tool) : a.role.localeCompare(b.role)
  );

  const missingFromRoles = [...serverSet].filter((t) => !unionRoleTools.has(t)).sort();

  return { missingFromServer, missingFromRoles };
}

// ---------------------------------------------------------------- live server discovery

/** Parses one `tools/list` JSON-RPC response body into an array of tool name strings. Pure and
 *  synchronous on purpose — kept separate from the process-spawning code below so the response
 *  SHAPE can be tested with a canned object, no child process involved. */
function parseToolsListResult(msg) {
  if (!msg || !msg.result || !Array.isArray(msg.result.tools)) {
    throw new Error('response has no result.tools array');
  }
  const names = [];
  for (const t of msg.result.tools) {
    if (!t || typeof t.name !== 'string' || t.name.length === 0) {
      throw new Error('a tools/list entry is missing a string "name"');
    }
    names.push(t.name);
  }
  return names;
}

/**
 * Speaks the MCP stdio handshake to `commandLine` (spawned via a shell — the default is
 * `npx ...`, a `.cmd` shim on Windows that a shell-less spawn cannot exec directly) and resolves
 * with either `{ ok: true, tools: string[] }` or `{ ok: false, reason: string }`. Never throws and
 * never hangs past `opts.timeoutMs` — every failure mode (binary missing, process exits early, a
 * malformed response, no response in time) becomes a named `reason`, which is what lets the caller
 * turn "no server" into an honest `SKIP: <reason>` instead of a silent pass or a crash.
 *
 * This is the ONE function in the file that owns the live-discovery mechanism — exported on its own
 * so it can be re-pointed (different flags, a long-lived server, a different transport entirely)
 * without touching `diffToolSets` or the CLI wiring around it.
 */
// `commandLine` is spawned with `shell: true` (see below — a `.cmd` shim like npx cannot be exec'd
// directly on Windows). On Windows that makes the direct child a `cmd.exe` wrapper, and killing
// *that* PID leaves the real process it launched (npx, then the MCP server) running orphaned —
// `child.kill()` alone does not reach it. `taskkill /t` walks the process tree from the PID we
// ourselves just spawned, by the command line we ourselves just built: this is the identified-by-
// command-line case AGENTS.md's process-kill rule asks for, not a blind sweep of unrelated PIDs.
function killSpawnedTree(child) {
  if (!child || !child.pid) return;
  if (process.platform === 'win32') {
    try {
      require('child_process').spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f']);
    } catch {
      // best-effort — the timeout/exit handling above already resolved the promise either way
    }
    return;
  }
  try {
    child.kill();
  } catch {
    // already gone — fine
  }
}

function queryServerTools(commandLine, opts = {}) {
  const timeoutMs = opts.timeoutMs || DEFAULT_TIMEOUT_MS;

  return new Promise((resolve) => {
    let settled = false;
    let child;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      killSpawnedTree(child);
      resolve(result);
    };

    try {
      child = spawn(commandLine, { shell: true, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (err) {
      resolve({ ok: false, reason: `failed to spawn server command "${commandLine}": ${err.message}` });
      return;
    }

    child.on('error', (err) => {
      finish({ ok: false, reason: `server command "${commandLine}" failed to start: ${err.message}` });
    });
    child.on('exit', (code, signal) => {
      finish({
        ok: false,
        reason: `server process exited (code ${code}, signal ${signal}) before answering tools/list`,
      });
    });

    const send = (obj) => {
      try {
        child.stdin.write(JSON.stringify(obj) + '\n');
      } catch {
        // stdin already closed (process died) — the exit/error handlers above will fire
      }
    };

    let outBuf = '';
    child.stdout.on('data', (d) => {
      outBuf += d.toString();
      let idx;
      while ((idx = outBuf.indexOf('\n')) !== -1) {
        const line = outBuf.slice(0, idx).trim();
        outBuf = outBuf.slice(idx + 1);
        if (!line) continue;

        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          continue; // not a JSON-RPC line (a banner leaking to stdout, say) — ignore, not a fatal error
        }
        if (!msg || typeof msg !== 'object') continue;

        if (msg.id === 1) {
          // Response to `initialize`.
          if (msg.error) {
            finish({ ok: false, reason: `server rejected initialize: ${JSON.stringify(msg.error)}` });
            continue;
          }
          send({ jsonrpc: '2.0', method: 'notifications/initialized' });
          send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
        } else if (msg.id === 2) {
          // Response to `tools/list`.
          if (msg.error) {
            finish({
              ok: false,
              reason: `server returned an error for tools/list: ${JSON.stringify(msg.error)}`,
            });
            continue;
          }
          try {
            finish({ ok: true, tools: parseToolsListResult(msg) });
          } catch (err) {
            finish({ ok: false, reason: `malformed tools/list response: ${err.message}` });
          }
        }
      }
    });

    send({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'mcp-toolnames-check', version: '1.0.0' },
      },
    });

    const timer = setTimeout(() => {
      finish({
        ok: false,
        reason: `timed out after ${timeoutMs}ms waiting for the server's tools/list response (no server reachable, or it never answered)`,
      });
    }, timeoutMs);
  });
}

/** Test/offline bypass for live discovery: reads a JSON file shaped either as a plain array of tool
 *  name strings, or `{ "tools": [...] }` (each entry a string or a `{ name }` object — the same
 *  shape a captured `tools/list` result would have). Never touches a process. */
function loadServerToolsFromJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`${filePath}: not valid JSON — ${err.message}`);
  }
  const list = Array.isArray(data) ? data : Array.isArray(data && data.tools) ? data.tools : null;
  if (list === null) {
    throw new Error(`${filePath}: expected a JSON array of tool names, or {"tools": [...]}`);
  }
  return list.map((x) => (typeof x === 'string' ? x : x && x.name)).filter((x) => typeof x === 'string' && x.length > 0);
}

// ---------------------------------------------------------------- CLI

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--role-files') opts.roleFiles = argv[++i];
    else if (a === '--server-tools-json') opts.serverToolsJson = argv[++i];
    else if (a === '--server-cmd') opts.serverCmd = argv[++i];
    else if (a === '--timeout') opts.timeout = Number(argv[++i]);
    else if (a === '--help' || a === '-h') opts.help = true;
    else throw new Error(`unrecognized argument "${a}"`);
  }
  return opts;
}

const USAGE =
  'usage: node tools/mcp-toolnames-check.js ' +
  '[--role-files a.md,b.md,c.md] [--server-tools-json <path>] [--server-cmd "<command>"] [--timeout <ms>]';

async function main(argv) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    console.error(`mcp-toolnames-check: ${err.message}`);
    console.error(USAGE);
    return 1;
  }
  if (opts.help) {
    console.log(USAGE);
    return 0;
  }

  const roleFiles = opts.roleFiles ? opts.roleFiles.split(',').map((s) => s.trim()) : DEFAULT_ROLE_FILES;

  let roleToolsMap;
  try {
    roleToolsMap = collectRoleTools(roleFiles);
  } catch (err) {
    console.error(`mcp-toolnames-check: ${err.message}`);
    return 1;
  }

  let serverTools;
  let sourceNote;
  if (opts.serverToolsJson) {
    try {
      serverTools = loadServerToolsFromJson(opts.serverToolsJson);
      sourceNote = `server list loaded from ${opts.serverToolsJson}`;
    } catch (err) {
      console.error(`mcp-toolnames-check: ${err.message}`);
      return 1;
    }
  } else {
    const commandLine = opts.serverCmd || DEFAULT_SERVER_COMMAND;
    const timeoutMs = Number.isFinite(opts.timeout) && opts.timeout > 0 ? opts.timeout : DEFAULT_TIMEOUT_MS;
    const result = await queryServerTools(commandLine, { timeoutMs });
    if (!result.ok) {
      console.log(`mcp-toolnames-check: SKIP: could not reach the chrome-devtools MCP server (${result.reason})`);
      return 0;
    }
    serverTools = result.tools;
    sourceNote = `server list queried live via "${commandLine}"`;
  }

  const diff = diffToolSets(roleToolsMap, serverTools);
  const distinctRoleTools = new Set([...roleToolsMap.values()].flatMap((s) => [...s])).size;

  if (diff.missingFromServer.length === 0 && diff.missingFromRoles.length === 0) {
    console.log(
      `mcp-toolnames-check: ${roleToolsMap.size} role(s), ${distinctRoleTools} distinct ` +
        `${MCP_TOOL_PREFIX}* tool(s) claimed, ${serverTools.length} server tool(s) — lists agree. (${sourceNote})`
    );
    return 0;
  }

  console.error(
    `mcp-toolnames-check: FAILED — ${diff.missingFromServer.length + diff.missingFromRoles.length} mismatch(es). (${sourceNote})`
  );
  if (diff.missingFromServer.length > 0) {
    console.error('  role claims a tool the server does not have (fails mid-gate on a live app):');
    for (const { role, tool } of diff.missingFromServer) {
      console.error(`    ${role}: ${MCP_TOOL_PREFIX}${tool}`);
    }
  }
  if (diff.missingFromRoles.length > 0) {
    console.error('  server offers a tool no role lists (capability silently unavailable):');
    for (const tool of diff.missingFromRoles) {
      console.error(`    ${MCP_TOOL_PREFIX}${tool}`);
    }
  }
  return 1;
}

if (require.main === module) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(`mcp-toolnames-check: internal error — ${err && err.stack ? err.stack : err}`);
      process.exit(1);
    }
  );
}

module.exports = {
  MCP_TOOL_PREFIX,
  DEFAULT_ROLE_FILES,
  DEFAULT_SERVER_COMMAND,
  DEFAULT_TIMEOUT_MS,
  extractFrontmatterToolsLine,
  parseMcpToolNames,
  collectRoleTools,
  diffToolSets,
  parseToolsListResult,
  queryServerTools,
  killSpawnedTree,
  loadServerToolsFromJson,
  parseArgs,
  main,
};

#!/usr/bin/env node
'use strict';

/**
 * cleanup-agent-processes — stops the browsers, MCP servers and scratch scripts that agents started
 * and left behind, and never touches the human's own browser.
 *
 * Why it exists (measured 2026-10-09, Linux, Hyprland): parallel UI-audit agents inside one Workflow
 * each started their own Chromium through a browser MCP server launched without `--headless`. Every
 * window took the mouse and the keyboard focus, the machine could not be used until the run ended,
 * and the processes outlived the agents that started them. "Clean up after yourself" is now a
 * framework rule (`agents-md-template.md` Hard Safety Rules); this is the instrument a lead runs to
 * check it, and to finish the job when a worker died before it could.
 *
 *   node "${CLAUDE_PLUGIN_ROOT}/tools/cleanup-agent-processes.js"            # orphans only (safe any time)
 *   node "${CLAUDE_PLUGIN_ROOT}/tools/cleanup-agent-processes.js" --all      # after a workflow/browser run ends
 *   node "${CLAUDE_PLUGIN_ROOT}/tools/cleanup-agent-processes.js" --dry      # list, kill nothing
 *   node "${CLAUDE_PLUGIN_ROOT}/tools/cleanup-agent-processes.js" --max-age 900
 *   node "${CLAUDE_PLUGIN_ROOT}/tools/cleanup-agent-processes.js" --all --only 4242,4243  # restrict to these pids
 *   node "${CLAUDE_PLUGIN_ROOT}/tools/cleanup-agent-processes.js" --ps-file <f>  # test seam, implies --dry
 *
 * What it selects — only the current user's processes, each identified by its command line (the
 * AGENTS.md rule "never kill a process you have not identified by its command line"):
 *
 *   1. AGENT BROWSER — a Chrome-family main process (not a `--type=` child) carrying at least one
 *      agent marker: `--headless`, a `--user-data-dir` under /tmp, `--remote-debugging-pipe`, or a
 *      path naming playwright / puppeteer / chrome-devtools-mcp. The human's everyday browser has
 *      none of these and is never selected, in any mode. Default mode: only when its driver is gone
 *      (walking up past launchers and dead-host MCP servers reaches pid 1, a systemd subreaper, or
 *      nothing — a live shell, test runner or node driver keeps it). `--all`: also when the
 *      driver is alive — the MCP server relaunches its browser on the next tool call, so this is
 *      recoverable for a session that is still running.
 *   2. ORPHANED MCP SERVER — a playwright / chrome-devtools MCP server whose host is gone: walking up
 *      past launcher processes (npm, npx, sh, bash, node-running-npx, uv) reaches pid 1, a systemd
 *      instance, or nothing. **In every mode, `--all` included**: a live MCP server belongs to a live
 *      session and the framework rule is never to kill one. This is the deliberate difference from
 *      the personal script it grew from, whose `--all` killed live servers too.
 *   3. STALE SCRATCH SCRIPT — node/python/bun/deno/tsx running a file under a `/scratchpad/` path,
 *      older than `--max-age` seconds (default 900). Default mode: only when its host is gone (same
 *      walk as above). `--all`: on age alone — it may be a live session's preview server, which is
 *      why `--all` waits until no agent is still working.
 *
 * Kill is SIGTERM, a re-check that the pid still has the command line we selected (pid reuse), then
 * SIGKILL for whatever survives 3 s. The run ends with a fresh `ps` pass: agent browsers still alive
 * and, separately, agent browsers running HEADED — a window on the human's desktop is the failure
 * this tool exists for, so it is reported even when nothing was killed.
 *
 * Linux and macOS (`ps -eo`). Windows prints `SKIP:` and exits 0 — a PowerShell twin is a follow-up
 * (CHANGELOG 1.38.2). Exit 0 on success, 2 on a bad argument.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const BROWSER_BIN = /^(chrome|chromium|chromium-browser|google-chrome(?:-stable|-beta|-unstable)?|chrome-headless-shell|headless_shell)$/;
const AGENT_BROWSER_MARKER = /--headless|--user-data-dir[= ]\/tmp\/|--remote-debugging-pipe|ms-playwright|playwright|puppeteer|chrome-devtools-mcp/i;
const MCP_SERVER = /@playwright\/mcp|playwright-mcp|mcp-server-playwright|chrome-devtools-mcp/i;
const LAUNCHER = /^(npm|npx|sh|bash|dash|zsh|uv|uvx|pnpm|yarn|corepack)$|^node$/;
const SCRATCH_SCRIPT = /(^|[\s/])(node|bun|deno|tsx|python[0-9.]*)\s+\S*\/scratchpad\/\S+/;

/** `ps -eo pid=,ppid=,etimes=,uid=,args=` → rows. Lines that do not parse are dropped, not guessed. */
function parsePs(text) {
  const rows = [];
  for (const line of String(text).split(/\r?\n/)) {
    const m = /^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    rows.push({ pid: +m[1], ppid: +m[2], age: +m[3], uid: +m[4], args: m[5] });
  }
  return rows;
}

const argv0Base = (args) => path.basename(String(args).split(/\s+/)[0] || '');

function isAgentBrowser(row) {
  return BROWSER_BIN.test(argv0Base(row.args)) && !/--type=/.test(row.args) && AGENT_BROWSER_MARKER.test(row.args);
}

const isHeaded = (row) => !/--headless/.test(row.args);

function isMcpServer(row) {
  return MCP_SERVER.test(row.args) && !BROWSER_BIN.test(argv0Base(row.args));
}

/** A launcher sits between a host and its MCP server; it is not itself the host. */
function isLauncher(row) {
  const base = argv0Base(row.args);
  if (LAUNCHER.test(base) && base !== 'node') return true;
  return base === 'node' && /\b(npx|npm|npm-cli|pnpm|yarn)\b/.test(row.args);
}

/** True when nothing but init / systemd / nothing remains above this process's launcher chain. */
function hostIsGone(row, byPid) {
  let cur = row;
  for (let hops = 0; hops < 32; hops++) {
    if (cur.ppid <= 1) return true;
    const parent = byPid.get(cur.ppid);
    if (!parent) return true;
    if (/(^|\/)systemd(\s|$)/.test(parent.args)) return true;
    if (!isLauncher(parent) && !isMcpServer(parent)) return false;
    cur = parent;
  }
  return false;
}

/**
 * A browser's driver is gone when nothing but launchers, MCP servers whose own host is gone, init or
 * a systemd subreaper stands above it. A live shell script, test runner or `node` driver in a tmux
 * pane is somebody's work in progress, so it keeps its browser (reviewed 2026-10-09: the earlier
 * "parent is not a node/python driver" test selected a headless browser started by a live `bash`
 * wrapper in tmux).
 */
function driverIsGone(row, byPid) {
  return hostIsGone(row, byPid);
}

/**
 * The selection, pure. `opts`: { all, maxAge, uid, selfPids:Set }.
 * Returns [{ pid, why, args, headed? }] — the processes to stop, each with the reason it was chosen.
 */
function classify(rows, opts) {
  const { all = false, maxAge = 900, uid, selfPids = new Set() } = opts || {};
  const byPid = new Map(rows.map((r) => [r.pid, r]));
  const out = [];
  for (const row of rows) {
    if (uid !== undefined && row.uid !== uid) continue;
    if (selfPids.has(row.pid)) continue;
    if (isAgentBrowser(row)) {
      const orphan = driverIsGone(row, byPid);
      if (orphan || all) {
        out.push({ pid: row.pid, why: orphan ? 'agent browser, driver gone' : 'agent browser (--all)', args: row.args, headed: isHeaded(row) });
      }
      continue;
    }
    if (isMcpServer(row)) {
      if (hostIsGone(row, byPid)) out.push({ pid: row.pid, why: 'orphaned MCP server, host gone', args: row.args });
      continue;
    }
    if (SCRATCH_SCRIPT.test(row.args) && row.age > maxAge) {
      // Default mode is "orphans only, safe any time": a scratch script whose session is alive may be
      // that session's preview server or monitor, so only `--all` takes it on age alone.
      const orphan = hostIsGone(row, byPid);
      if (orphan || all) {
        out.push({ pid: row.pid, why: `scratch script ${row.age}s old (> ${maxAge}s)${orphan ? ', host gone' : ' (--all)'}`, args: row.args });
      }
    }
  }
  return out;
}

/** Agent browsers alive in a snapshot, for the closing report. */
function survey(rows, uid) {
  const browsers = rows.filter((r) => (uid === undefined || r.uid === uid) && isAgentBrowser(r));
  return { browsers, headed: browsers.filter(isHeaded) };
}

// ---------------------------------------------------------------- CLI

function parseArgs(argv) {
  const o = { all: false, dry: false, maxAge: 900, psFile: null, only: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') o.all = true;
    else if (a === '--dry' || a === '--dry-run') o.dry = true;
    else if (a === '--max-age') {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n < 0) throw new Error('--max-age needs a whole number of seconds');
      o.maxAge = n;
    } else if (a === '--only') {
      const list = String(argv[++i] || '').split(',').map(Number);
      if (!list.length || list.some((n) => !Number.isInteger(n) || n <= 0)) throw new Error('--only needs a comma-separated pid list');
      o.only = new Set(list);
    } else if (a === '--ps-file') {
      o.psFile = argv[++i];
      if (!o.psFile) throw new Error('--ps-file needs a path');
    } else if (a === '-h' || a === '--help') o.help = true;
    else throw new Error(`unknown argument: ${a}`);
  }
  if (o.psFile) o.dry = true; // a snapshot's pids are not this machine's processes
  return o;
}

function snapshot() {
  const r = spawnSync('ps', ['-eo', 'pid=,ppid=,etimes=,uid=,args='], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ps failed: ${(r.stderr || '').trim() || r.status}`);
  return parsePs(r.stdout);
}

function argsOf(pid) {
  const r = spawnSync('ps', ['-o', 'args=', '-p', String(pid)], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function alive(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

/** Our own ancestry is never a candidate, whatever its command line looks like. */
function selfChain(rows) {
  const byPid = new Map(rows.map((r) => [r.pid, r]));
  const s = new Set([process.pid]);
  let cur = byPid.get(process.pid);
  while (cur && cur.ppid > 1 && !s.has(cur.ppid)) { s.add(cur.ppid); cur = byPid.get(cur.ppid); }
  return s;
}

function main(argv) {
  let o;
  try { o = parseArgs(argv); } catch (e) { console.error(`cleanup-agent-processes: ${e.message}`); return 2; }
  if (o.help) { console.log('usage: cleanup-agent-processes.js [--all] [--dry] [--max-age SECONDS] [--only PID,...] [--ps-file FILE]'); return 0; }
  if (process.platform === 'win32' && !o.psFile) {
    console.log('SKIP: Windows is not supported yet (PowerShell twin is a follow-up, CHANGELOG 1.38.2) — check Task Manager for chrome.exe started by node.');
    return 0;
  }

  const uid = typeof process.getuid === 'function' ? process.getuid() : undefined;
  const rows = o.psFile ? parsePs(fs.readFileSync(o.psFile, 'utf8')) : snapshot();
  const picked = classify(rows, { all: o.all, maxAge: o.maxAge, uid, selfPids: o.psFile ? new Set() : selfChain(rows) })
    .filter((p) => !o.only || o.only.has(p.pid));

  for (const p of picked) {
    console.log(`${o.dry ? 'would kill' : 'kill'} ${p.pid} (${p.why}${p.headed ? ', HEADED' : ''}): ${p.args.slice(0, 140)}`);
  }
  if (!o.dry) {
    const sent = [];
    for (const p of picked) {
      const now = argsOf(p.pid);
      if (now === null) continue; // already gone
      if (now !== p.args) { console.log(`skip ${p.pid}: command line changed since selection (pid reused?)`); continue; }
      try { process.kill(p.pid, 'SIGTERM'); sent.push(p.pid); } catch (e) { console.log(`skip ${p.pid}: ${e.code || e.message}`); }
    }
    for (let t = 0; t < 30 && sent.some(alive); t++) sleep(100);
    for (const pid of sent.filter(alive)) {
      try { process.kill(pid, 'SIGKILL'); console.log(`SIGKILL ${pid} (survived SIGTERM 3s)`); } catch { /* gone meanwhile */ }
    }
  }
  console.log(`cleanup: ${picked.length} process(es)${o.dry ? ' (dry run — nothing killed)' : ''}`);

  const after = o.psFile || o.dry ? rows : snapshot();
  const { browsers, headed } = survey(after, uid);
  const left = o.dry ? browsers : browsers.filter((b) => !picked.some((p) => p.pid === b.pid));
  console.log(`agent browsers still running: ${left.length}${o.dry ? ' (before any kill)' : ''}`);
  for (const h of headed.filter((b) => left.includes(b))) {
    console.log(`WARN headed agent browser ${h.pid} — a window on the human's desktop; launch it with --headless: ${h.args.slice(0, 140)}`);
  }
  return 0;
}

module.exports = { parsePs, classify, survey, parseArgs, isAgentBrowser, isMcpServer, hostIsGone };

if (require.main === module) process.exit(main(process.argv.slice(2)));

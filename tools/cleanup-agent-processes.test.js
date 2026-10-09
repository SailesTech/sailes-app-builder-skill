#!/usr/bin/env node
'use strict';

/**
 * Tests for tools/cleanup-agent-processes.js — the lead's instrument for "clean up the processes
 * you started" (1.38.2).
 *
 * What is under test is the one property that makes the tool safe to hand to an agent: **it selects
 * what agents left behind and never the human's own processes** — the everyday browser, a live MCP
 * server, a dev server, a process of another user. A selection that is wrong in the first direction
 * leaves windows on the desktop (the 2026-10-09 incident); wrong in the second, it kills somebody's
 * work, which is the 2026-08-01 rule this tool must not break.
 *
 * Two halves. The selection is pure and driven through `--ps-file` snapshots (which force a dry run,
 * so a fixture pid can never be signalled), both directions per rule. Then, on Linux/macOS only, one
 * real process: a `sleep` disguised as a headless agent Chromium, which the tool must list in
 * `--dry`, leave alive, and stop when restricted to its pid with `--only`. No other real process is
 * ever signalled by this file — every non-dry run carries `--only <dummy pid>`.
 *
 * Run: node tools/cleanup-agent-processes.test.js   (or `npm test`)
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');

const BIN = path.join(__dirname, 'cleanup-agent-processes.js');
const { parsePs, classify, parseArgs } = require('./cleanup-agent-processes.js');

let failures = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    failures++;
    console.error(`  FAIL ${name}`);
    console.error(`       ${err && err.message}`);
  }
}

const ME = 1000;
const OTHER = 1001;

// pid ppid etimes uid args — the shape `ps -eo pid=,ppid=,etimes=,uid=,args=` prints.
const SNAPSHOT = `
    1     0 99999    0 /sbin/init
  500     1 99999 1000 /usr/lib/systemd/systemd --user
  600   500 99999 1000 Hyprland
  700   600 99999 1000 ghostty
  800   700  9000 1000 claude
  801   800  9000 1000 npm exec @playwright/mcp@latest
  802   801  9000 1000 sh -c mcp-server-playwright
  803   802  9000 1000 node /home/u/.npm/_npx/abc/node_modules/.bin/mcp-server-playwright
  810   803  8000 1000 /home/u/.cache/ms-playwright/chromium-1200/chrome-linux/chrome --headless --user-data-dir=/tmp/playwright_chromiumdev_profile-x --remote-debugging-pipe
  811   810  8000 1000 /home/u/.cache/ms-playwright/chromium-1200/chrome-linux/chrome --type=renderer --headless
  820   803  8000 1000 /usr/lib/chromium/chromium --user-data-dir=/tmp/playwright_chromiumdev_profile-y --remote-debugging-pipe
  900   600 99999 1000 /usr/lib/chromium/chromium --ozone-platform=wayland
  901   900 99999 1000 /usr/lib/chromium/chromium --type=gpu-process
  950   600 99999 1000 /opt/google/chrome/chrome --profile-directory=Default
 1100     1  5000 1000 /usr/lib/chromium/chromium --headless=new --user-data-dir=/tmp/chrome-devtools-mcp-abc
 1101   500  5000 1000 /usr/lib/chromium/chromium --user-data-dir=/tmp/claude-1000/scratch/profile
 1200     1  6000 1000 node /home/u/.npm/_npx/def/node_modules/.bin/chrome-devtools-mcp --headless --isolated
 1300   500  6000 1000 npm exec @playwright/mcp@latest
 1301  1300  6000 1000 node /home/u/.npm/_npx/abc/node_modules/.bin/mcp-server-playwright
 1400  4242  6000 1000 node /home/u/.npm/_npx/abc/node_modules/.bin/mcp-server-playwright
 1500   800  1000 1000 node /tmp/claude-1000/x/scratchpad/audit.mjs
 1501   800   100 1000 node /tmp/claude-1000/x/scratchpad/audit2.mjs
 1502   800  5000 1000 python3 /tmp/claude-1000/x/scratchpad/shot.py
 1503   500  5000 1000 node /tmp/claude-1000/y/scratchpad/left-behind.mjs
 1700  1600  5000 1000 bash /home/u/proj/scripts/smoke.sh
 1701  1700  5000 1000 /usr/lib/chromium/chromium --headless=new --user-data-dir=/tmp/smoke-profile
 1600   700  9000 1000 node /home/u/proj/node_modules/.bin/next dev
 2000     1  5000 1001 /usr/lib/chromium/chromium --headless --user-data-dir=/tmp/other-user
`;

const rows = parsePs(SNAPSHOT);
const pick = (opts) => classify(rows, { uid: ME, ...opts }).map((p) => p.pid).sort((a, b) => a - b);
const DEFAULT = pick({});
const ALL = pick({ all: true });

// ---------------------------------------------------------------- parsing

test('parsePs reads pid, ppid, age, uid and the full command line; drops what does not parse', () => {
  const r = parsePs('  42   1  77 1000 /usr/bin/chrome --headless --foo bar\nnot a ps line\n');
  assert.deepStrictEqual(r, [{ pid: 42, ppid: 1, age: 77, uid: 1000, args: '/usr/bin/chrome --headless --foo bar' }]);
  assert.strictEqual(rows.length, 28);
});

test('parseArgs: flags parse, --ps-file forces a dry run, bad input throws', () => {
  assert.deepStrictEqual(parseArgs(['--all', '--max-age', '60']), { all: true, dry: false, maxAge: 60, psFile: null, only: null });
  assert.strictEqual(parseArgs(['--ps-file', 'x']).dry, true);
  assert.deepStrictEqual([...parseArgs(['--only', '5,6']).only], [5, 6]);
  assert.throws(() => parseArgs(['--max-age', 'soon']));
  assert.throws(() => parseArgs(['--only', 'abc']));
  assert.throws(() => parseArgs(['--kill-everything']));
});

// ---------------------------------------------------------------- never selected

test("the human's own browser is never selected, in either mode — main process or child", () => {
  for (const pid of [900, 901, 950]) {
    assert.ok(!ALL.includes(pid), `pid ${pid} selected under --all`);
    assert.ok(!DEFAULT.includes(pid), `pid ${pid} selected by default`);
  }
});

test('browser child processes (--type=) are never selected — they die with their main process', () => {
  assert.ok(!ALL.includes(811));
});

test('a live MCP server is never selected, even with --all (never kill an MCP server)', () => {
  assert.ok(!ALL.includes(801) && !ALL.includes(803), `selected: ${ALL}`);
});

test("another user's agent browser is never selected", () => {
  assert.ok(!ALL.includes(2000));
});

test('a dev server and a young scratch script are left alone', () => {
  assert.ok(!ALL.includes(1600));
  assert.ok(!ALL.includes(1501));
  assert.ok(!pick({ maxAge: 2000 }).includes(1500), '--max-age raises the threshold');
});

// ---------------------------------------------------------------- default mode: orphans only

test('default mode: an agent browser whose driver is alive stays', () => {
  assert.ok(!DEFAULT.includes(810) && !DEFAULT.includes(820), `selected: ${DEFAULT}`);
});

test('default mode: an agent browser reparented to init or to a non-driver subreaper is selected', () => {
  assert.ok(DEFAULT.includes(1100), 'ppid 1');
  assert.ok(DEFAULT.includes(1101), 'ppid = systemd --user');
});

test('an MCP server whose host is gone is selected — through the npx launcher chain too', () => {
  assert.ok(DEFAULT.includes(1200), 'ppid 1');
  assert.ok(DEFAULT.includes(1301), 'npm exec → systemd --user: host gone');
  assert.ok(DEFAULT.includes(1300), 'the orphaned npx launcher goes with it');
  assert.ok(DEFAULT.includes(1400), 'parent pid absent from the table');
});

test('stale scratch scripts: by default only when their host is gone; --all takes them on age', () => {
  assert.ok(DEFAULT.includes(1503), 'host gone (systemd --user)');
  assert.ok(!DEFAULT.includes(1500) && !DEFAULT.includes(1502), 'a live session keeps its scratch scripts by default');
  assert.ok(ALL.includes(1500) && ALL.includes(1502));
});

test("an agent-looking browser under a live shell script or test runner stays, by default", () => {
  assert.ok(!DEFAULT.includes(1701), `selected: ${DEFAULT}`);
  assert.ok(ALL.includes(1701));
});

test('default mode selects exactly the orphan set — nothing more', () => {
  assert.deepStrictEqual(DEFAULT, [1100, 1101, 1200, 1300, 1301, 1400, 1503]);
});

// ---------------------------------------------------------------- --all

test('--all adds agent browsers with a live driver and live-session stale scratch scripts, nothing else', () => {
  assert.deepStrictEqual(ALL, [810, 820, 1100, 1101, 1200, 1300, 1301, 1400, 1500, 1502, 1503, 1701]);
});

test('a headed agent browser is flagged HEADED — the window on the desktop is the incident', () => {
  const p = classify(rows, { uid: ME, all: true });
  assert.strictEqual(p.find((x) => x.pid === 820).headed, true);
  assert.strictEqual(p.find((x) => x.pid === 810).headed, false);
});

// ---------------------------------------------------------------- CLI over a snapshot

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sailes-cleanup-test-'));
const myUid = typeof process.getuid === 'function' ? process.getuid() : ME;
const snapFile = path.join(tmp, 'ps.txt');
fs.writeFileSync(snapFile, SNAPSHOT.replace(/ 1000 /g, ` ${myUid} `));

test('CLI --ps-file lists candidates as "would kill", reports a dry run and the headed warning', () => {
  const r = spawnSync(process.execPath, [BIN, '--ps-file', snapFile, '--all'], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(!/^kill /m.test(r.stdout), 'a snapshot run must never print a real kill');
  assert.match(r.stdout, /^would kill 820 \(agent browser \(--all\), HEADED\)/m);
  assert.match(r.stdout, /cleanup: 12 process\(es\) \(dry run/);
  assert.match(r.stdout, /WARN headed agent browser 820/);
});

test('CLI rejects an unknown argument with exit 2', () => {
  const r = spawnSync(process.execPath, [BIN, '--nope'], { encoding: 'utf8' });
  assert.strictEqual(r.status, 2);
});

// ---------------------------------------------------------------- one real process (Linux/macOS)

const realPs = process.platform !== 'win32' && spawnSync('ps', ['-o', 'pid=', '-p', String(process.pid)]).status === 0;

if (!realPs) {
  console.log('  SKIP real-process cases: no POSIX ps on this platform');
} else {
  // A `sleep` whose argv[0] reads as a headless agent Chromium, double-forked so its driver is gone.
  const fakeArgs = `/usr/lib/chromium/chromium --headless --user-data-dir=${tmp}/fake-profile`;
  const dummy = Number(
    execFileSync('bash', ['-c', `(exec -a "${fakeArgs}" sleep 60) >/dev/null 2>&1 & echo $!`], { encoding: 'utf8' }).trim()
  );
  const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
  try {
    test('real ps, --dry --all: the disguised dummy is listed and still alive afterwards', () => {
      const r = spawnSync(process.execPath, [BIN, '--dry', '--all', '--only', String(dummy)], { encoding: 'utf8' });
      assert.strictEqual(r.status, 0, r.stderr);
      assert.match(r.stdout, new RegExp(`^would kill ${dummy} `, 'm'));
      assert.ok(alive(dummy), 'a dry run signalled a process');
    });

    test('real ps, --all --only <dummy>: the dummy is stopped and nothing else is named', () => {
      const r = spawnSync(process.execPath, [BIN, '--all', '--only', String(dummy)], { encoding: 'utf8' });
      assert.strictEqual(r.status, 0, r.stderr);
      const killed = r.stdout.match(/^kill \d+/gm) || [];
      assert.deepStrictEqual(killed, [`kill ${dummy}`]);
      for (let i = 0; i < 30 && alive(dummy); i++) spawnSync('sleep', ['0.1']);
      assert.ok(!alive(dummy), 'dummy survived');
    });
  } finally {
    if (alive(dummy)) process.kill(dummy, 'SIGKILL');
  }
}

fs.rmSync(tmp, { recursive: true, force: true });

console.log(failures === 0 ? '\ncleanup-agent-processes: all tests passed' : `\ncleanup-agent-processes: ${failures} failing`);
process.exit(failures === 0 ? 0 : 1);

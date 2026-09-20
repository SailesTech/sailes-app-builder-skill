#!/usr/bin/env node
'use strict';

/**
 * PreToolUse guard (matcher `Bash`, wired in `hooks/hooks.json`): blocks every attempt to skip a
 * local git hook or repoint the hooks directory from inside a `Bash` tool call.
 *
 * Spec 1.36.0, phase P3 (A2), decision Q1 — `.ai/specs/2026-09-20-harness-guards-from-ecc-audit.md`:
 * scope is EVERY repo, not just Sailes ones, because "do not bypass git hooks" needs nothing read
 * from repo state to be true. Per the spec's "Pomiar R4", `PreToolUse` does not fire on a command a
 * human types directly (shell mode / `!`) — it fires on tool calls, which covers agents and
 * subagents. That is exactly the surface this hook needs: the human was never inside it, so there
 * is no escape-hatch environment variable (Non-goals, spec P3.1) — a marker deliberately absent,
 * not an oversight.
 *
 * Blocks (`stderr` + `exit(2)`, **never** `permissionDecision` — see
 * `hooks/workflow-agenttype-guard.js:14-18` for why: setting it would bypass the user's own
 * permission prompt for the call, which this hook must not do):
 *   - `git commit … --no-verify` and `-n` in commit-flag position (e.g. `git commit -n -m x`);
 *   - `git push … --no-verify`;
 *   - `git -c core.hooksPath=…` and `git config … core.hooksPath …` (get or set — the spec text is
 *     generic and this hook does not try to tell the two apart);
 * Everything else → `exit(0)`, silent. A payload this hook cannot parse, or a command it cannot
 * make sense of → `exit(0)`: never block on something unreadable (same rule as
 * `workflow-agenttype-guard.js:303`).
 *
 * Not a shell parser: a hand-rolled word-splitter that understands single/double quotes well
 * enough to answer "is this token, at this position, actually the flag `--no-verify`/`-n`, or is
 * it text inside a quoted argument (e.g. a commit message that happens to mention it)?" — without
 * pulling in a shell-parsing dependency (this repo ships none for hooks on purpose, see AGENTS.md
 * Verification).
 *
 * Known simplifications, documented rather than silently accepted:
 *   - Command substitution (`$(...)`, backticks) is not re-entered as code; its contents are
 *     treated as literal text of whatever word they appear in. A `--no-verify` hidden inside a
 *     substitution that itself calls git is not exercised by any fixture in the spec.
 *   - Bundled short options (e.g. `-an` meaning `-a -n`) are not unbundled; only a standalone `-n`
 *     token is recognized. Not exercised by any fixture in the spec.
 */

const { readStdin } = require('./lib/repo-state');

const RULE =
  'do not bypass git hooks — no --no-verify/-n on commit or push, no core.hooksPath override ' +
  '(spec 1.36.0 P3, hooks/block-no-verify.js)';

// Commit flags that consume the next word as their value, so that value is never itself
// mistaken for a `--no-verify`/`-n` flag (e.g. `git commit -m -n` — an odd but legal message).
const COMMIT_VALUE_FLAGS = new Set([
  '-m',
  '--message',
  '-F',
  '--file',
  '-C',
  '--reuse-message',
  '-c',
  '--reedit-message',
  '--author',
  '--date',
  '-t',
  '--template',
]);

/**
 * Splits a shell command line into `{ type: 'word' | 'op', value }` tokens. Quotes are consumed
 * (their content merged into the surrounding word, matching shell concatenation semantics —
 * `-m"a b"` and `-m "a b"` both yield a single word); control operators (`&&`, `||`, `;`, `|`,
 * newline, `&`) are only recognized outside quotes, so a literal `;` inside a quoted string never
 * splits the command.
 */
function tokenize(cmd) {
  const tokens = [];
  let cur = '';
  let hasWord = false;
  const pushWord = () => {
    if (hasWord) {
      tokens.push({ type: 'word', value: cur });
      cur = '';
      hasWord = false;
    }
  };
  let i = 0;
  const n = cmd.length;
  while (i < n) {
    const c = cmd[i];
    if (c === "'") {
      hasWord = true;
      i += 1;
      while (i < n && cmd[i] !== "'") {
        cur += cmd[i];
        i += 1;
      }
      i += 1; // skip closing quote (unterminated fixtures just run to end — nothing to mis-split)
      continue;
    }
    if (c === '"') {
      hasWord = true;
      i += 1;
      while (i < n && cmd[i] !== '"') {
        if (cmd[i] === '\\' && i + 1 < n && '"\\$`'.includes(cmd[i + 1])) {
          cur += cmd[i + 1];
          i += 2;
        } else {
          cur += cmd[i];
          i += 1;
        }
      }
      i += 1; // skip closing quote
      continue;
    }
    if (c === '\\' && i + 1 < n) {
      hasWord = true;
      cur += cmd[i + 1];
      i += 2;
      continue;
    }
    if (c === '&' && cmd[i + 1] === '&') {
      pushWord();
      tokens.push({ type: 'op', value: '&&' });
      i += 2;
      continue;
    }
    if (c === '|' && cmd[i + 1] === '|') {
      pushWord();
      tokens.push({ type: 'op', value: '||' });
      i += 2;
      continue;
    }
    if (c === '|' || c === ';' || c === '&') {
      pushWord();
      tokens.push({ type: 'op', value: c });
      i += 1;
      continue;
    }
    if (c === '\n') {
      pushWord();
      tokens.push({ type: 'op', value: ';' });
      i += 1;
      continue;
    }
    if (/\s/.test(c)) {
      pushWord();
      i += 1;
      continue;
    }
    hasWord = true;
    cur += c;
    i += 1;
  }
  pushWord();
  return tokens;
}

/** Groups tokens into simple commands, split at control-operator boundaries. */
function splitSimpleCommands(tokens) {
  const commands = [];
  let cur = [];
  for (const t of tokens) {
    if (t.type === 'op') {
      if (cur.length) commands.push(cur);
      cur = [];
    } else {
      cur.push(t.value);
    }
  }
  if (cur.length) commands.push(cur);
  return commands;
}

/** True if `word` is a leading shell variable assignment (`FOO=bar git ...`). */
function isAssignment(word) {
  return /^[A-Za-z_][A-Za-z0-9_]*=/.test(word);
}

/**
 * Checks one simple command's word list for the blocked patterns. Returns a reason string when
 * blocked, or `null` when clean.
 */
function checkGitCommand(words) {
  let idx = 0;
  while (idx < words.length && isAssignment(words[idx])) idx += 1;
  const bin = words[idx];
  if (!bin || (bin !== 'git' && !bin.endsWith('/git'))) return null;

  const gitWords = words.slice(idx + 1);

  // `-c core.hooksPath=...` — checked across the whole invocation regardless of subcommand
  // position, since `-c` is a global git option that can precede any subcommand.
  for (let j = 0; j < gitWords.length; j += 1) {
    const w = gitWords[j];
    if (w === '-c' && gitWords[j + 1] && /^core\.hookspath=/i.test(gitWords[j + 1])) {
      return 'git -c core.hooksPath=... overrides the hooks directory';
    }
    if (/^-ccore\.hookspath=/i.test(w)) {
      return 'git -c core.hooksPath=... overrides the hooks directory';
    }
  }

  // Find the subcommand: skip global options (`-c <v>` / `-C <v>` consume a value, other `-x`
  // flags do not) until the first word that isn't itself an option.
  let k = 0;
  while (k < gitWords.length) {
    const w = gitWords[k];
    if (w === '-c' || w === '-C') {
      k += 2;
      continue;
    }
    if (w.startsWith('-')) {
      k += 1;
      continue;
    }
    break;
  }
  const subcommand = gitWords[k];

  if (subcommand === 'config') {
    if (gitWords.some((w) => w.toLowerCase() === 'core.hookspath')) {
      return 'git config ... core.hooksPath overrides the hooks directory';
    }
    return null;
  }

  if (subcommand === 'commit') {
    const rest = gitWords.slice(k + 1);
    for (let j = 0; j < rest.length; j += 1) {
      const w = rest[j];
      if (COMMIT_VALUE_FLAGS.has(w)) {
        j += 1; // skip this flag's value — never itself checked as a flag
        continue;
      }
      if (w === '--no-verify' || w === '-n') {
        return `git commit ${w} bypasses the pre-commit/commit-msg hook`;
      }
    }
    return null;
  }

  if (subcommand === 'push') {
    const rest = gitWords.slice(k + 1);
    if (rest.includes('--no-verify')) {
      return 'git push --no-verify bypasses the pre-push hook';
    }
    return null;
  }

  return null;
}

function analyze(command) {
  const tokens = tokenize(command);
  const commands = splitSimpleCommands(tokens);
  for (const words of commands) {
    const reason = checkGitCommand(words);
    if (reason) return reason;
  }
  return null;
}

function main() {
  const raw = readStdin();
  let input;
  try {
    input = JSON.parse(raw || '{}');
  } catch {
    process.exit(0); // malformed payload — never block on something we cannot parse
  }

  if (input.tool_name !== 'Bash') {
    process.exit(0); // other tool — quiet
  }

  const command = input.tool_input && input.tool_input.command;
  if (typeof command !== 'string' || !command.trim()) {
    process.exit(0); // no command to read — never block on something we cannot parse
  }

  const reason = analyze(command);
  if (reason) {
    process.stderr.write(`block-no-verify: blocked — ${RULE}\n  ${reason}\n`);
    process.exit(2);
  }

  process.exit(0);
}

try {
  main();
} catch {
  // A defect in the guard must never brick every Bash call on the machine — fail open.
  process.exit(0);
}

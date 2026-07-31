#!/usr/bin/env sh
# PreToolUse guard, shared by Claude Code and Codex. Reads the event JSON on stdin,
# blocks (exit 2 + reason on stderr) when a tool call touches the protected surface.
# Payload is the same in both harnesses: { tool_name, tool_input: { command?, file_path? }, ... }.
# No jq dependency — grep the raw JSON so it runs anywhere.
payload="$(cat)"

block() { echo "BLOCKED by guard-protected-paths: $1" >&2; exit 2; }

# --- Runtime-environment lock ---------------------------------------------------------------
# A worktree isolates FILES. The database, ports, buckets and containers are shared by the whole
# machine — the one resource that cannot be cloned. Measured 2026-07-30, inside a single `qa` run:
# the object-store container deleted twice and the database role passwords reset. Neither was
# malicious; the rule simply did not exist.
#
# `qa` writes .ai/ENV-LOCK when its run begins and removes it when the run ends. While it exists,
# nobody else stands up, restarts or migrates the stack.
#
# The lock names its owner and its start time, and the message says how to break it, because a
# lock left behind by a crashed `qa` that blocks everyone with no way out is worse than no lock.
# Breaking it is the lead's call and belongs in the run log.
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
LOCK="$ROOT/.ai/ENV-LOCK"
if [ -f "$LOCK" ]; then
  case "$payload" in
    *'docker'*|*'db:migrate'*|*'db:push'*|*'db:reset'*|*'compose down'*|*'compose up'*)
      holder="$(head -2 "$LOCK" 2>/dev/null | tr '\n' ' ')"
      echo "BLOCKED by guard-protected-paths: the runtime environment is held — $holder" >&2
      echo "  A qa run owns the stack; restarting or migrating it now invalidates that run." >&2
      echo "  Wait for it to finish, or — lead only, and record it in the run log — break the" >&2
      echo "  lock with: rm .ai/ENV-LOCK" >&2
      exit 2;;
  esac
fi

# --- Protected command surface (Bash tool_input.command) ---
case "$payload" in
  *'push --force'*|*'push -f'*)        block "force-push is denied (Hard Safety Rules)";;
  *'reset --hard'*)                    block "reset --hard is denied — use git restore / revert";;
  *'db:migrate:prod'*)                 block "production migration needs explicit human approval";;
  *' deploy'*prod*|*prod*' deploy'*)   block "production deploy is denied — no auto-deploy";;
esac

# --- Protected path surface (Bash redirects/edits + file-edit tools' file_path) ---
case "$payload" in
  *'.env'*)                            block "secrets/.env are protected — never read/write via a tool";;
  *'/migrations/'*|*'\migrations\'*) block "applied migrations are immutable — add a NEW migration";;
  *'.ai/specs/implemented/'*)          block "implemented specs are frozen — write a new spec";;
esac

exit 0

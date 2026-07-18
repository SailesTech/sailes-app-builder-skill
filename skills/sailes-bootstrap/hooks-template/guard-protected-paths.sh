#!/usr/bin/env sh
# PreToolUse guard, shared by Claude Code and Codex. Reads the event JSON on stdin,
# blocks (exit 2 + reason on stderr) when a tool call touches the protected surface.
# Payload is the same in both harnesses: { tool_name, tool_input: { command?, file_path? }, ... }.
# No jq dependency — grep the raw JSON so it runs anywhere.
payload="$(cat)"

block() { echo "BLOCKED by guard-protected-paths: $1" >&2; exit 2; }

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

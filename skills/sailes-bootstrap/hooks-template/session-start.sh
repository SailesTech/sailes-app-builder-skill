#!/usr/bin/env sh
# SessionStart: emit session memory to stdout — both Claude Code and Codex append it as context.
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cat "$ROOT/.ai/STATE.md" 2>/dev/null
echo "--- Task Router: see AGENTS.md ---"

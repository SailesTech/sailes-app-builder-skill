#!/usr/bin/env sh
# SessionStart: emit session memory to stdout — both Claude Code and Codex append it as context.
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
STATE="$ROOT/.ai/STATE.md"

cat "$STATE" 2>/dev/null

# --- Snapshot-vs-history check -------------------------------------------------------------
# STATE.md is read at the START of every session, so a stale header is believed before anything
# else is. Measured 2026-07-30 on a client repo: the top of the file described a phase that had
# been finished nine commits earlier, and every context reset began from that untruth.
#
# This warns the READER, at the moment they are about to believe the file. It deliberately does
# NOT live in a pre-commit hook: at pre-commit time HEAD is the PREVIOUS commit, so the line is
# correct exactly when it names the commit you are about to supersede.
#
# Three cases, and the silent ones matter as much as the loud one:
#   field absent  -> silence. Every repo bootstrapped before this convention lacks the field, and
#                    a hook that shouts in all of them gets muted — taking the real case with it.
#   field matches -> silence.
#   field differs -> one warning line. Never blocks; the reader decides.
if [ -f "$STATE" ]; then
  claimed="$(sed -n 's/^[Ll]ast-commit:[[:space:]]*\([0-9a-fA-F]\{4,\}\).*/\1/p' "$STATE" | head -1)"
  if [ -n "$claimed" ]; then
    actual="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null)"
    if [ -n "$actual" ] && [ "$claimed" != "$actual" ]; then
      echo "--- WARNING: .ai/STATE.md says Last-commit: $claimed, git HEAD is $actual."
      echo "    The snapshot above may describe an older state than the repo actually has."
      echo "    Verify before trusting it, and update the snapshot together with the history."
    fi
  fi
fi

echo "--- Task Router: see AGENTS.md ---"

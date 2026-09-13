#!/usr/bin/env bash
# Emits one line when the worktree has 3 distinct P4-listed files changed vs 738be36, then exits.
# Counts only after HEAD descends from 738be36 (before the ff-merge the tree is main's and differs everywhere).
# Usage: stop-watch.sh <worktree-path> <label>
WT="$1"; LABEL="$2"; BASE=738be36
LIST='skills/sailes-implement/SKILL.md
skills/sailes-bootstrap/release-checklist.md
agents/qa.md
codex-agents/qa.toml
agents/checker.md
codex-agents/checker.toml
codex-agents/parity.test.js
evals/gate-compares-red-by-name-not-count.md'
for i in $(seq 1 600); do [ -d "$WT" ] && break; sleep 0.5; done
[ -d "$WT" ] || { echo "WATCH-ERROR $LABEL worktree never appeared: $WT"; exit 1; }
echo "WATCH-ARMED $LABEL $WT"
while true; do
  if git -C "$WT" merge-base --is-ancestor $BASE HEAD 2>/dev/null; then
    changed=$( { git -C "$WT" diff --name-only $BASE 2>/dev/null; git -C "$WT" ls-files --others --exclude-standard 2>/dev/null; } | sort -u | grep -Fxf <(printf '%s\n' "$LIST") )
    n=$(printf '%s' "$changed" | grep -c . )
    if [ "$n" -ge 3 ]; then
      echo "STOP-NOW $LABEL n=$n files: $(echo $changed) at $(date -u +%H:%M:%S)"
      exit 0
    fi
  fi
  [ -d "$WT" ] || { echo "WATCH-ERROR $LABEL worktree vanished"; exit 1; }
  sleep 1
done

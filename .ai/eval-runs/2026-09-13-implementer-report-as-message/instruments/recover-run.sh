#!/usr/bin/env bash
# Metric 3b input for an INTERRUPTED run: everything the lead can see on disk without the process.
# The lead answers three questions from this dump alone — what changed, what was verified, what is left —
# each yes/no with the source named. Usage: recover-run.sh <run-label> <worktree-abs-path>
RUN="$1"; WT="$2"; BASE=738be36
R=/home/charlie/Work/Internal/sailes-app-builder-skill
echo "## recovery dump — $RUN"
[ -d "$WT" ] || { echo "WORKTREE MISSING: $WT"; exit 1; }
echo "### HEAD and commits since base"
echo "HEAD $(git -C "$WT" rev-parse --short HEAD) · descends from $BASE: $(git -C "$WT" merge-base --is-ancestor $BASE HEAD && echo yes || echo no)"
git -C "$WT" log --format='--- %h %s%n%b' $BASE..HEAD 2>/dev/null
echo "### uncommitted changes (name-status vs HEAD, plus untracked)"
git -C "$WT" status --short
echo "### diff stat vs base (committed + uncommitted)"
git -C "$WT" diff --stat $BASE
echo "### status file(s)"
for f in "$R/.claude/status/be-dev-P5ab-$RUN.md" "$WT/.claude/status/be-dev-P5ab-$RUN.md"; do
  [ -f "$f" ] && { echo "--- $f"; cat "$f"; }
done
echo "### report file(s) under .ai/ (committed or not)"
for f in $( { git -C "$WT" diff --name-only $BASE -- .ai; git -C "$WT" ls-files --others --exclude-standard -- .ai; } | sort -u ); do
  echo "--- $f ($(wc -l < "$WT/$f") lines)"; cat "$WT/$f"
done

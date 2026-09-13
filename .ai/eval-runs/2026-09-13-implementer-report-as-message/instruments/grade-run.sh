#!/usr/bin/env bash
# Mechanical metrics for one A/B run, read from disk only. Usage: grade-run.sh <run-label> <worktree-abs-path>
# Metric 2 (empty return) and 3b (recoverability) are judged by the lead from the returned message and this output.
RUN="$1"; WT="$2"; BASE=738be36
R=/home/charlie/Work/Internal/sailes-app-builder-skill
echo "## $RUN"
echo "worktree: $WT"
[ -d "$WT" ] || { echo "WORKTREE MISSING"; exit 1; }
echo "HEAD: $(git -C "$WT" rev-parse --short HEAD) · descends from $BASE: $(git -C "$WT" merge-base --is-ancestor $BASE HEAD && echo yes || echo no)"
echo "commits since base:"; git -C "$WT" log --format='  %h %s' $BASE..HEAD
echo "final (non-WIP) commit present: $(git -C "$WT" log --format=%s $BASE..HEAD | grep -vc '^WIP' )"
echo "uncommitted changes:"; git -C "$WT" status --short | sed 's/^/  /'
# Metric 1: prose lines written to .ai/ (committed + uncommitted diff vs base, plus untracked .ai files)
ai_diff=$(git -C "$WT" diff --numstat $BASE -- .ai | awk '{s+=$1} END {print s+0}')
ai_untracked=$(git -C "$WT" ls-files --others --exclude-standard -- .ai | while read -r f; do wc -l < "$WT/$f"; done | awk '{s+=$1} END {print s+0}')
echo "metric1 .ai added lines: diff=$ai_diff untracked=$ai_untracked total=$((ai_diff+ai_untracked))"
echo "  .ai files: $(git -C "$WT" diff --name-only $BASE -- .ai | tr '\n' ' ') $(git -C "$WT" ls-files --others --exclude-standard -- .ai | tr '\n' ' ')"
echo "commit body lines (non-empty): $(git -C "$WT" log --format=%b $BASE..HEAD | grep -c .)"
S=$R/.claude/status/be-dev-P5ab-$RUN.md; SF="$WT/.claude/status/be-dev-P5ab-$RUN.md"
for f in "$S" "$SF"; do
  if [ -f "$f" ]; then echo "status file: $f · lines=$(wc -l < "$f") · closed=$(grep -c '^closed' "$f") · outcome=$(grep -m1 '^outcome' "$f")"; fi
done
[ -f "$S" ] || [ -f "$SF" ] || echo "status file: ABSENT (checked $S and $SF)"
echo "P4-listed files changed vs base:"
git -C "$WT" diff --name-only $BASE -- skills/sailes-implement/SKILL.md skills/sailes-bootstrap/release-checklist.md agents/qa.md codex-agents/qa.toml agents/checker.md codex-agents/checker.toml codex-agents/parity.test.js | sed 's/^/  /'
git -C "$WT" ls-files --others --exclude-standard -- evals/gate-compares-red-by-name-not-count.md | sed 's/^/  (untracked) /'
[ -n "$(git -C "$WT" ls-files -- evals/gate-compares-red-by-name-not-count.md)" ] && echo "  evals/gate-compares-red-by-name-not-count.md (tracked)"
echo "Done-when re-run by lead:"
( cd "$WT" && {
  grep -cE 'merge-base' agents/qa.md codex-agents/qa.toml agents/checker.md codex-agents/checker.toml | sed 's/^/  merge-base /'
  grep -c 'comm -23' agents/qa.md agents/checker.md | sed 's/^/  comm-23 /'
  node codex-agents/parity.test.js >/dev/null 2>&1; echo "  parity exit=$?"
  node tools/sync-blocks.js --check >/dev/null 2>&1; echo "  sync exit=$?"
} )

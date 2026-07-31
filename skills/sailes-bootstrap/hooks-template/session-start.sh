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
# The question is "has the snapshot been MAINTAINED", not "does the sha match" ---------------
#
# Equality is the obvious check and it is wrong, measured 2026-07-31 an hour after the first
# version shipped. Writing STATE.md means committing STATE.md, which advances HEAD past the sha
# you just wrote — so a repo following the convention PERFECTLY sits one commit behind, forever,
# and an equality check warns at the start of every single session. That is the cries-wolf failure
# this hook's own design notes warn about: an alarm that always fires is muted, and it takes the
# real case with it.
#
# So the measure is: **how many commits since `claimed` are NOT the snapshot's own write.** The
# commit that records STATE.md subtracts itself out, so a repo following the convention perfectly
# reports zero and stays silent. Nine commits of unrelated work with the snapshot never revisited —
# the actual 2026-07-30 incident — reports nine.
#
# "Has STATE.md been touched at all since `claimed`" was the first attempt at this and is also
# wrong, in the opposite direction: the snapshot's own commit touches it, so that test goes silent
# for every amount of work that follows. Caught by the test suite before it shipped, which is the
# argument for the suite existing.
#
# Cases, and the silent ones matter as much as the loud one:
#   field absent      -> silence. Every repo bootstrapped before this convention lacks it, and a
#                        hook that shouts in all of them gets muted.
#   sha unknown       -> silence. A rewritten or not-yet-fetched history is not the reader's problem.
#   only the snapshot -> silence. This is the healthy steady state, not a defect.
#   work after it     -> one warning line, with the count. Never blocks; the reader decides.
if [ -f "$STATE" ]; then
  claimed="$(sed -n 's/^[Ll]ast-commit:[[:space:]]*\([0-9a-fA-F]\{4,\}\).*/\1/p' "$STATE" | head -1)"
  if [ -n "$claimed" ] && git -C "$ROOT" rev-parse --verify --quiet "$claimed^{commit}" >/dev/null 2>&1; then
    actual="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null)"
    if [ -n "$actual" ] && [ "$claimed" != "$actual" ]; then
      total="$(git -C "$ROOT" rev-list --count "$claimed..HEAD" 2>/dev/null || echo 0)"
      snaps="$(git -C "$ROOT" rev-list --count "$claimed..HEAD" -- .ai/STATE.md 2>/dev/null || echo 0)"
      work=$((total - snaps))
      if [ "$work" -gt 0 ]; then
        echo "--- WARNING: .ai/STATE.md says Last-commit: $claimed; HEAD is $actual, with $work commit(s)"
        echo "    of work after the snapshot was last written. It describes an older state than the"
        echo "    repo has. Verify before trusting it, and update the snapshot together with the"
        echo "    history — a file whose halves disagree is worse than a stale one."
      fi
    fi
  fi
fi

echo "--- Task Router: see AGENTS.md ---"

#!/usr/bin/env sh
# SessionStart: emit session memory to stdout — both Claude Code and Codex append it as context.
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
STATE="$ROOT/.ai/STATE.md"
LESSONS="$ROOT/.ai/lessons.md"

# A scratch directory for this run. Everything computed below is buffered here so the FINAL output
# order (memory summary, then warnings, then the Task Router line) can be decided after every
# byte count is known — the memory section below needs to know how much the warnings will cost
# before it can size itself against the shared budget. `mktemp -d` is not POSIX but is present on
# every platform this hook actually ships to (coreutils, BusyBox, macOS, Git Bash); the fallback
# below is for the rare host that lacks it, not a claim that this script avoids GNU-only tools.
HOOKTMP="$(mktemp -d 2>/dev/null)"
if [ -z "$HOOKTMP" ] || [ ! -d "$HOOKTMP" ]; then
  HOOKTMP="/tmp/sailes-session-start-$$"
  mkdir -p "$HOOKTMP" 2>/dev/null
fi
trap 'rm -rf "$HOOKTMP"' EXIT

# `TAIL_FILE` accumulates everything that is NOT the memory summary: size-limit warnings, the
# Last-commit drift warning, the .env warning, and the Task Router line. It is built first so its
# byte count can be subtracted from the shared budget before the memory section is sized — see the
# "Session memory" block below for why the order in the script is not the order on stdout.
TAIL_FILE="$HOOKTMP/tail.txt"
: > "$TAIL_FILE"

# --- Memory file size limits (Q1) ------------------------------------------------------------
# Measured 2026-09-12 (spec token-cost-of-running): the framework had no rule at all about memory
# file size, and a client's STATE.md (243 KB) and lessons.md (194 KB) grew without bound. A file
# that size is both cut by the harness (see the block below) and expensive to read in full when an
# agent goes looking for the full history. The owner's threshold: STATE.md <= 20 KB, lessons.md
# <= 40 KB. This does not enforce the limit — nothing here may block a session — it only tells the
# reader the file is over, so a human or the next `team-lead` rotates it to `.ai/archive/`.
if [ -f "$STATE" ]; then
  state_bytes="$(wc -c < "$STATE" | tr -d '[:space:]')"
  if [ "$state_bytes" -gt 20000 ]; then
    echo "--- WARNING: .ai/STATE.md is $state_bytes bytes, over the 20000-byte limit. Rotate old entries to .ai/archive/." >> "$TAIL_FILE"
  fi
fi
if [ -f "$LESSONS" ]; then
  lessons_bytes="$(wc -c < "$LESSONS" | tr -d '[:space:]')"
  if [ "$lessons_bytes" -gt 40000 ]; then
    echo "--- WARNING: .ai/lessons.md is $lessons_bytes bytes, over the 40000-byte limit. Rotate old entries to .ai/archive/." >> "$TAIL_FILE"
  fi
fi

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
        {
          echo "--- WARNING: .ai/STATE.md says Last-commit: $claimed; HEAD is $actual, with $work commit(s)"
          echo "    of work after the snapshot was last written. It describes an older state than the"
          echo "    repo has. Verify before trusting it, and update the snapshot together with the"
          echo "    history — a file whose halves disagree is worse than a stale one."
        } >> "$TAIL_FILE"
      fi
    fi
  fi
fi

# --- Local .env carrying PRODUCTION markers ------------------------------------------------
# The local `.env` is readable and writable by agents (see guard-protected-paths.sh: env is tiered
# by risk, not by filename). That is safe exactly as long as it holds LOCAL values — a localhost
# database password, a dev bucket key, a sandbox token. The one thing that breaks the assumption is
# the trap `sailes-hosting` already names: a developer pasting production credentials into their
# dev file. Then the same read that unblocked `qa` puts live secrets into a model context.
#
# So the tier is enforced here, at the moment the session starts, by the only test with a decent
# signal-to-noise ratio: markers that NEVER legitimately appear in a local dev file. This is a
# blocklist of production tells, deliberately NOT an allowlist of "must be localhost" — that shape
# cries wolf on tunnels, compose service names and shared staging, and this repo has already been
# burned twice by an alarm that fires every session and gets muted, taking the real case with it.
#
# It prints KEY NAMES, never values, and it never blocks. Extend PROD_MARKERS per repo.
ENVFILE="$ROOT/.env"
if [ -f "$ENVFILE" ]; then
  PROD_MARKERS='\.railway\.app|\.supabase\.co|amazonaws\.com|\.vercel\.app|sk_live_|pk_live_|rk_live_'
  suspects="$(grep -nE "^[A-Za-z_][A-Za-z0-9_]*=.*($PROD_MARKERS)" "$ENVFILE" 2>/dev/null \
    | sed -E 's/^[0-9]+:([A-Za-z_][A-Za-z0-9_]*)=.*/\1/' | tr '\n' ' ')"
  if [ -n "$suspects" ]; then
    {
      echo "--- WARNING: .env carries PRODUCTION markers on: $suspects"
      echo "    Agents may read and write the local .env, so these values are now reachable by every"
      echo "    role in this repo. Production config belongs in the platform's env (see"
      echo "    sailes-hosting), not in a dev file. Move them and rotate at the source."
    } >> "$TAIL_FILE"
  fi
fi

echo "--- Task Router: see AGENTS.md ---" >> "$TAIL_FILE"

# --- Session memory: bounded summary, not the whole file (Q1, F1) --------------------------
# Measured 2026-09-12 (spec token-cost-of-running): this hook used to `cat` the entire STATE.md.
# The harness does not inject large tool/hook output inline — it writes it to a file and hands back
# a truncated preview with the path, so the "efficient" plain `cat` was actually the EXPENSIVE path:
# 30 transcripts hit "Output too large (NNNKB). Full output saved to..." at sizes as small as 30 KB
# and 32 KB (and once at 210 KB), and the leader then spent a separate `Read` (~60k tokens) pulling
# the same content back in. There is no documented byte threshold for `SessionStart` output; 9500
# characters is a safety margin below the smallest measured cutover (30 KB), not a cited limit.
#
# The budget is for the WHOLE hook, not just this block — it has to include the warnings above and
# the Task Router line below, or a repo with several active warnings could still tip the total over
# the cutover this block is trying to stay under. So `TAIL_FILE` (warnings + Task Router) is built
# FIRST, in script order, and only printed LAST, on stdout: this block reads its size to know how
# much of the 9500-character budget is actually left for memory content.
#
# Budgeting in BYTES, not characters, is deliberate: a UTF-8 multibyte character (this repo's own
# client fixtures are Polish) is always >= 1 byte, so a byte count under the limit guarantees a
# character count under the same limit — the reverse is not true. Every cut below happens at a LINE
# boundary (never mid-line), which as a side effect never splits a multibyte sequence either, since
# a complete line is always a whole number of complete UTF-8 sequences.
#
# F1 (owner decision): a file with the exact section headings below is a client's *current* state —
# emit just the live sections. A file without them (the shape shipped before this convention, or a
# client's own dated-block convention) has no reliable "current" marker, so the newest content is
# whatever is physically first, because these files are newest-block-on-top by convention.
BUDGET_TOTAL=9500

# `head_cut FILE LIMIT` prints as many whole lines from FILE, in order, as fit within LIMIT bytes.
# It stops BEFORE the line that would cross the limit, so the result is always <= LIMIT bytes, never
# a partial line. It only ever reads as many lines as fit in LIMIT (a few hundred at most for this
# budget), so a multi-hundred-KB fixture is not fully scanned — the loop exits at the cut point.
head_cut() {
  _hc_file="$1"
  _hc_limit="$2"
  _hc_total=0
  while IFS= read -r _hc_line || [ -n "$_hc_line" ]; do
    _hc_len="$(printf '%s' "$_hc_line" | wc -c | tr -d '[:space:]')"
    _hc_len=$((_hc_len + 1))
    if [ $((_hc_total + _hc_len)) -gt "$_hc_limit" ]; then
      break
    fi
    printf '%s\n' "$_hc_line"
    _hc_total=$((_hc_total + _hc_len))
  done < "$_hc_file"
}

MEM_FILE="$HOOKTMP/mem.txt"
: > "$MEM_FILE"

if [ -f "$STATE" ]; then
  tail_bytes="$(wc -c < "$TAIL_FILE" | tr -d '[:space:]')"
  mem_budget=$((BUDGET_TOTAL - tail_bytes))
  [ "$mem_budget" -lt 0 ] && mem_budget=0

  NOTE="--- Session memory truncated to fit the session-start budget. Full file: $STATE — older verified facts and lessons live in $ROOT/.ai/archive/ ---"
  note_bytes="$(printf '%s\n' "$NOTE" | wc -c | tr -d '[:space:]')"

  # Normalized (CR-stripped) copy for HEADING DETECTION and EXTRACTION only, so a CRLF file matches
  # the same patterns an LF file does (F1: "allow ... a trailing \r"). This does not change what
  # ships on stdout in head mode, which reads the original file.
  NORM="$HOOKTMP/state.norm"
  tr -d '\r' < "$STATE" > "$NORM"

  if grep -Eq '^## Open failures[[:space:]]*$' "$NORM" && grep -Eq '^## Last session[[:space:]]*$' "$NORM"; then
    # Section mode (F1): the exact headings are present -> emit only the CURRENT sections, in the
    # order they occur in the file. `## General rules` is optional. Everything else — including the
    # decoy shapes a real client file carries (`## Verified facts`, `## Lessons learned`, and any
    # heading that merely LOOKS like one of the three, e.g. "## Open failure" singular, or one with
    # trailing prose after it) — is walked past without being captured, because the anchors below
    # require an EXACT heading with only trailing whitespace, and any *other* `## ` heading (not one
    # of the three) closes whatever section was open.
    SECTIONS="$HOOKTMP/sections.txt"
    : > "$SECTIONS"
    lastcommit_line="$(grep -E '^[Ll]ast-commit:' "$NORM" | head -1)"
    [ -n "$lastcommit_line" ] && printf '%s\n' "$lastcommit_line" >> "$SECTIONS"
    awk '
      /^## Open failures[[:space:]]*$/ { capture=1; print; next }
      /^## General rules[[:space:]]*$/ { capture=1; print; next }
      /^## Last session[[:space:]]*$/  { capture=1; print; next }
      /^## /                            { capture=0; next }
      { if (capture) print }
    ' "$NORM" >> "$SECTIONS"

    sections_bytes="$(wc -c < "$SECTIONS" | tr -d '[:space:]')"
    if [ "$sections_bytes" -le "$mem_budget" ]; then
      cat "$SECTIONS" >> "$MEM_FILE"
    else
      cut_limit=$((mem_budget - note_bytes))
      [ "$cut_limit" -lt 0 ] && cut_limit=0
      head_cut "$SECTIONS" "$cut_limit" >> "$MEM_FILE"
      printf '%s\n' "$NOTE" >> "$MEM_FILE"
    fi
  else
    # Head mode (F1): no recognized section headings -> the file is not in the five-section shape
    # (either a client's own dated-block convention, or a repo that predates it). These files are
    # newest-block-on-top by convention, so the beginning of the file IS the newest content — emit
    # it up to the budget.
    if [ "$state_bytes" -le "$mem_budget" ]; then
      cat "$STATE" >> "$MEM_FILE"
    else
      cut_limit=$((mem_budget - note_bytes))
      [ "$cut_limit" -lt 0 ] && cut_limit=0
      head_cut "$STATE" "$cut_limit" >> "$MEM_FILE"
      printf '%s\n' "$NOTE" >> "$MEM_FILE"
    fi
  fi
fi

cat "$MEM_FILE"
cat "$TAIL_FILE"
exit 0

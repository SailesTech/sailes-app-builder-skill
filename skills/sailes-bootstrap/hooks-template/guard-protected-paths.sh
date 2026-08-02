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
#
# THE LOCK MUST KNOW ITS OWNER. Shipped in 1.25.0 without one and the defect showed up the same
# week: `qa` wrote the lock and was blocked by it on its own first `docker exec`. A lock whose
# only state is "exists" cannot tell the holder from everyone else, so it locks out the one process
# it was created to protect. Named in `.ai/audits/2026-07-30-pre-implement-sailerem-lessons.md`
# BEFORE the release ("kształt ścieżki wygaszenia nie jest jeszcze zaprojektowany") and released
# anyway; this is that patch.
#
# The mechanism: the lock carries a `token:` line, and the holder exports the same value as
# SAILES_ENV_LOCK. Matching token → the call passes, because the lock exists to keep OTHERS out.
# This is collision protection, not access control — a worker could set the variable and walk
# through. That is the correct threat model: nobody here is an attacker, and every incident this
# guards against (a container deleted mid-run, a database reset under a live suite) was an accident.
# A lock with NO token blocks everyone, exactly as before — every lock written by an older `qa`
# keeps its old meaning instead of silently opening.
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
LOCK="$ROOT/.ai/ENV-LOCK"
if [ -f "$LOCK" ]; then
  lock_token="$(sed -n 's/^token:[[:space:]]*\([^[:space:]]*\).*/\1/p' "$LOCK" 2>/dev/null | head -1)"
  if [ -n "$lock_token" ] && [ "$lock_token" = "${SAILES_ENV_LOCK:-}" ]; then
    :   # the holder itself — do not block it out of its own run
  else
    case "$payload" in
      *'docker'*|*'db:migrate'*|*'db:push'*|*'db:reset'*|*'compose down'*|*'compose up'*)
        holder="$(head -2 "$LOCK" 2>/dev/null | tr '\n' ' ')"
        echo "BLOCKED by guard-protected-paths: the runtime environment is held — $holder" >&2
        echo "  A qa run owns the stack; restarting or migrating it now invalidates that run." >&2
        echo "  If you ARE the holder, export SAILES_ENV_LOCK with the lock's token: value." >&2
        echo "  Otherwise wait for it to finish, or — lead only, and record it in the run log —" >&2
        echo "  break the lock with: rm .ai/ENV-LOCK" >&2
        exit 2;;
    esac
  fi
fi

# --- Protected command surface (Bash tool_input.command) ---
case "$payload" in
  *'push --force'*|*'push -f'*)        block "force-push is denied (Hard Safety Rules)";;
  *'reset --hard'*)                    block "reset --hard is denied — use git restore / revert";;
  *'db:migrate:prod'*)                 block "production migration needs explicit human approval";;
  *' deploy'*prod*|*prod*' deploy'*)   block "production deploy is denied — no auto-deploy";;
esac

# --- Protected path surface (Bash redirects/edits + file-edit tools' file_path) ---
#
# ENV IS TIERED BY RISK, NOT BY FILENAME PREFIX. Until 1.25.1 this branch read `*'.env'*` and
# blocked the four characters anywhere in the payload. What it actually protected: nothing this
# framework's own doctrine puts in a repo file — `sailes-hosting/references/env-i-sekrety.md`
# states that config and secrets live in the platform's env, and `.env.example` is a list of KEYS.
# What it cost, measured across 2026-07-31/08-01: `qa` could not start the app for ANY task (no
# read of `.env.example`, no `--env-file=`, no `set -a && . ./.env`), so the behavioral gate was
# structurally unrunnable for two days; and the fix for that could not be written either, because
# putting `--env-file-if-exists=../../.env` into package.json is itself a payload containing
# `.env`. `repo-done-checklist.md` had already recorded the dead end as an accepted cost.
#
# So: the LOCAL `.env` is the agent's to read and write — it holds a localhost database password,
# a dev bucket key, a sandbox token. Production and staging env files stay protected, and by the
# hosting doctrine should not be in the repo at all. Key material is denied path-precisely in
# `permissions.deny` (glob matching, no false positives) rather than here — a substring test for
# `.key` fires on `Object.keys(...)`, and a guard that cries wolf is a guard that gets muted.
# `.env.prod` below covers `.env.production` by prefix.
case "$payload" in
  *'.env.prod'*|*'.env.staging'*)      block "production/staging env is protected — the LOCAL .env is yours to read and write";;
esac

# MIGRATIONS: broad on purpose, and this comment says so instead of claiming narrowness it does
# not have. The prior pattern `*'/migrations/'*|*'\migrations\'*` required a literal `/` or `\`
# on BOTH sides and missed the single most common real shape: a RELATIVE path with nothing before
# it, e.g. an Edit `file_path` of `migrations/003.sql` or a Bash command `cat migrations/003.sql` —
# no leading `/`, so the old pattern let an agent edit an applied migration in place undetected.
# The class below requires only
# a NON-identifier character (or nothing, i.e. payload start) immediately before `migrations/` or
# `migrations\`, which is what every real invocation has — a JSON `"`, a space, a quote, a slash —
# while `db_migrations/`, `docs-migrations/` and `my.migrations/` keep passing because `_` `.` `-`
# stay in the allowed set. The `\t`/`\n`/`\r` alternatives exist because the guard reads the RAW
# JSON text, not a parsed string: a real tab used as a shell word-separator arrives on the wire as
# the two literal characters `\` `t` (JSON escapes control bytes), and the second one is `t` —
# alphanumeric — so the single-character class alone would miss it.
#
# THE COST, MEASURED: this now also blocks `git log --oneline -- migrations/`, `rg -n migrations/ .`,
# a `git commit -m` whose MESSAGE names a migrations/ path, and a Write whose PROSE content mentions
# "migrations/" — none of which mutate an applied migration. A read/write split was considered and
# rejected: telling `cat migrations/003.sql` (read) from `psql -f migrations/003.sql` piped into a
# destructive session, or a `sed -i` hidden behind a variable, apart from a raw JSON substring is
# exactly the semantic parsing this file avoids everywhere else (see the `.key`/`Object.keys` note
# above) — a leading-verb allowlist has the same shape of hole this fix just closed on the path side.
# Accepted: false-positive friction on a handful of read-only commands, with an easy workaround
# (rephrase, or drop the pathspec), over a silent false negative on the one thing this guard exists
# to stop.
case "$payload" in
  'migrations/'*|'migrations\'*|*[!A-Za-z0-9_.-]'migrations/'*|*[!A-Za-z0-9_.-]'migrations\'*|*'\t''migrations/'*|*'\t''migrations\'*|*'\n''migrations/'*|*'\n''migrations\'*|*'\r''migrations/'*|*'\r''migrations\'*)
    block "applied migrations are immutable — add a NEW migration";;
esac

case "$payload" in
  *'.ai/specs/implemented/'*)          block "implemented specs are frozen — write a new spec";;
esac

exit 0

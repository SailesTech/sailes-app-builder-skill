#!/usr/bin/env bash
# Install Sailes custom agents for Codex at USER scope. Skills remain separate:
# use enable-codex.sh for skills, this script for custom agents.

set -euo pipefail

roles=(team-lead explorer designer be-dev fe-dev checker qa)
owner_marker='# sailes-app-builder managed agent'
begin='# BEGIN sailes-app-builder managed agents'
end='# END sailes-app-builder managed agents'
dry_run=0
force=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=1 ;;
    --force) force=1 ;;
    -h|--help) sed -n 's/^# \{0,1\}//p' "$0"; exit 0 ;;
    *) echo "ERROR: unknown option: $arg" >&2; exit 2 ;;
  esac
done

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
src="$repo/codex-agents"
codex="$HOME/.codex"
agents="$codex/agents"
config="$codex/config.toml"
version="$(cat "$repo/VERSION" 2>/dev/null || printf unknown)"
fail() { echo "ERROR: $*" >&2; exit 1; }
normalize() { sed 's/\r$//;s/[[:space:]]*$//'; }
same() { cmp -s <(normalize < "$1") <(normalize < "$2"); }
is_sailes_owned() {
  grep -Fqx "$owner_marker" "$1" || same <(sed "1{/^# sailes-app-builder managed agent$/d;}" "$2") "$1"
}
# Unmarked, content-drifted, but still plainly one of our roles: same filename AND it
# declares that role's name. Never matched against arbitrary files — only the seven names.
looks_like_sailes_role() {
  grep -Eq "^[[:space:]]*name[[:space:]]*=[[:space:]]*\"$2\"[[:space:]]*$" "$1"
}
validate_codex_strict_config() {
  command -v codex >/dev/null 2>&1 || fail 'Codex CLI is required to validate the existing config.toml. Install or expose `codex` on PATH, then rerun. No files were changed.'
  local output
  output="$(codex exec --strict-config --ephemeral --skip-git-repo-check --color never 'Reply only: OK.' 2>&1)" || fail "Codex strict config validation failed. No files were changed. $output"
}

# The conservative validation catches malformed headings/assignments before writes.
#
# It MUST track multi-line basic strings (""" ... """): every role file puts the agent's
# whole prompt in one, and a line-at-a-time check reads that prose as broken TOML. The
# original version lacked this and so rejected all seven roles at line 5 — this installer
# could never run on macOS/Linux. The PowerShell twin got it right; this is the port.
validate_toml() {
  awk '
  function t(s) { sub(/^[[:space:]]+/, "", s); sub(/[[:space:]]+$/, "", s); return s }
  BEGIN {
    q = sprintf("%c", 39)                      # a literal single quote, unquotable inline here
    # Bare, basic-quoted, or literal-quoted. Codex writes literal-quoted table keys itself
    # (e.g. [projects.C:\Users\...]), so a bare-key-only guard rejects its own config.
    KEY = "([A-Za-z0-9_-]+|\"[^\"]*\"|" q "[^" q "]*" q ")"
    TABLE = "^\\[" KEY "([.]" KEY ")*\\]$"
    KV = "^" KEY "([.]" KEY ")*[[:space:]]*=[[:space:]]*.+$"
    inml = 0
  }
  {
    s = t($0)
    tmp = s; n = gsub(/"""/, "&", tmp)   # an odd count flips in/out of a multi-line string
    if (inml) { if (n % 2 == 1) inml = 0; next }
    if (s == "" || substr(s,1,1) == "#") next
    if (n > 0) {
      if (n % 2 == 1) inml = 1
      if (s !~ ("^" KEY "[[:space:]]*=")) { print "line " NR ": malformed multiline assignment"; exit 1 }
      next
    }
    if (s ~ TABLE) next
    sub(/[[:space:]]*#.*/, "", s); s = t(s)
    if (s !~ KV) { print "line " NR ": expected TOML table or key/value"; exit 1 }
  }
  END { if (inml) { print "unterminated multiline string"; exit 1 } }
  ' "$1"
}

for role in "${roles[@]}"; do
  [[ -f "$src/$role.toml" ]] || fail "missing source definition: $src/$role.toml"
  issue="$(validate_toml "$src/$role.toml")" || fail "invalid source TOML in $role.toml ($issue)"
done
validate_codex_strict_config
if [[ -f "$config" ]]; then
  issue="$(validate_toml "$config")" || fail "config.toml is malformed ($issue). No files were changed; repair $config and rerun."
fi

begins="$(grep -Fxc "$begin" "$config" 2>/dev/null || true)"
ends="$(grep -Fxc "$end" "$config" 2>/dev/null || true)"
[[ "$begins" == 0 && "$ends" == 0 || "$begins" == 1 && "$ends" == 1 ]] || fail "conflicting or incomplete Sailes managed block in config.toml"
start=0; finish=0
if [[ "$begins" == 1 ]]; then
  start="$(grep -Fnx "$begin" "$config" | cut -d: -f1)"; finish="$(grep -Fnx "$end" "$config" | cut -d: -f1)"
  (( start < finish )) || fail "conflicting or incomplete Sailes managed block in config.toml"
fi
for role in "${roles[@]}"; do
  conflict="$(awk -v s="$start" -v e="$finish" -v r="$role" '(s==0 || NR<s || NR>e) && $0 ~ "^[[:space:]]*\\[agents\\." r "\\][[:space:]]*(#.*)?$" { print NR }' "$config" 2>/dev/null || true)"
  [[ -z "$conflict" ]] || fail "conflicting Sailes agent entry [agents.$role] outside the managed block (line $conflict)"
done

block="$begin"
for role in "${roles[@]}"; do block+=$'\n'"[agents.$role]"$'\n'"config_file = \"agents/$role.toml\""; done
block+=$'\n'"$end"
existing="$(cat "$config" 2>/dev/null || true)"
if (( start == 0 )); then
  candidate="$block"; [[ -z "$existing" ]] || candidate="$existing"$'\n\n'"$block"
else
  before="$(sed -n "1,$((start-1))p" "$config")"; after="$(sed -n "$((finish+1)),\$p" "$config")"
  candidate="$before"; [[ -z "$before" ]] || candidate+=$'\n'; candidate+="$block"; [[ -z "$after" ]] || candidate+=$'\n'"$after"
fi

changed=()
adopt=()
for role in "${roles[@]}"; do
  if [[ -f "$agents/$role.toml" ]] && ! is_sailes_owned "$agents/$role.toml" "$src/$role.toml"; then
    # Content-equality ownership only holds until the role definition changes upstream —
    # after any edit, a file this installer's predecessor wrote stops being recognizable
    # and the upgrade dead-ends. A file named for one of our roles that declares that same
    # role is ours by every practical measure; adopt it with consent and a backup rather
    # than telling the human to delete their own agents by hand.
    if looks_like_sailes_role "$agents/$role.toml" "$role"; then
      adopt+=("$role")
    else
      fail "existing $agents/$role.toml is not a Sailes role definition (no name = \"$role\"). It will not be replaced, even with --force. Rename or remove it manually, then rerun."
    fi
  fi
  [[ -f "$agents/$role.toml" ]] && same "$src/$role.toml" "$agents/$role.toml" || changed+=("$role")
done
config_changed=1
if [[ -f "$config" ]] && cmp -s <(printf '%s\n' "$candidate" | normalize) <(normalize < "$config"); then config_changed=0; fi
has_changes=0; (( ${#changed[@]} || config_changed )) && has_changes=1
action='already current'; (( has_changes )) && action='update'; [[ -z "$existing" ]] && (( has_changes )) && action='install'
backup=''; (( config_changed )) && [[ -f "$config" ]] && backup="$codex/backups/config.toml.$(date +%Y%m%d-%H%M%S).bak"
agent_backup_dir="$codex/backups/agents.$(date +%Y%m%d-%H%M%S)"

echo "Sailes Codex agents v$version"; echo; echo PLAN
printf '  source:      %s\n  role files:  7 -> %s\n  config:      %s\n  backup:      %s\n  action:      %s\n\n' "$src" "$agents" "$config" "${backup:-<none>}" "$action"
echo "Roles: ${roles[*]}"
(( ${#changed[@]} )) && echo "Changed roles: ${changed[*]}"
(( config_changed )) && echo 'Config: managed block will be installed or updated'
if (( ${#adopt[@]} )); then
  echo
  echo "ADOPT: these role files predate this installer (or were written without its marker):"
  for role in "${adopt[@]}"; do echo "  $agents/$role.toml"; done
  echo "  They declare our role names, so they look like an earlier Sailes install."
  echo "  Each will be backed up to $agent_backup_dir before being replaced."
fi
if (( ! has_changes )); then echo 'ALREADY CURRENT: no changes made'; exit 0; fi
if (( dry_run )); then echo 'DRY RUN: no directories, files, backups, or config changes were made'; exit 0; fi
if (( ${#adopt[@]} )); then
  # Adoption overwrites a file this run did not write, so it is asked separately from the
  # ordinary update — and --force does NOT answer it. Forcing an update is not the same
  # decision as adopting files of unknown provenance.
  read -r -p "Adopt and replace the ${#adopt[@]} file(s) above (backup kept)? [y/N] " answer </dev/tty || answer=''
  [[ "$answer" =~ ^[yY] ]] || { echo 'No changes made.'; exit 0; }
  mkdir -p "$agent_backup_dir" || fail 'could not create the agent backup directory'
  for role in "${adopt[@]}"; do
    cp "$agents/$role.toml" "$agent_backup_dir/$role.toml" || fail "could not back up $agents/$role.toml"
  done
  echo "Backed up ${#adopt[@]} file(s) to $agent_backup_dir"
fi
if (( ! force )); then read -r -p "$([[ "$action" == install ]] && echo Install || echo Update)? [y/N] " answer </dev/tty || answer=''; [[ "$answer" =~ ^[yY] ]] || { echo 'No changes made.'; exit 0; }; fi

mkdir -p "$codex"
stage_root="$(mktemp -d "$codex/.sailes-agent-stage.XXXXXXXX")"
stage_agents="$stage_root/agents"
role_rollback="$stage_root/role-rollback"
roles_backed_up=()
rollback_roles() {
  local i role
  for ((i=${#roles_backed_up[@]}-1; i>=0; i--)); do
    role="${roles_backed_up[$i]}"
    [[ -f "$agents/$role.toml" ]] && rm -f "$agents/$role.toml"
    [[ -f "$role_rollback/$role.toml" ]] && mv "$role_rollback/$role.toml" "$agents/$role.toml"
  done
}
cleanup_stage() { rm -rf "$stage_root"; }
trap cleanup_stage EXIT
if (( ${#changed[@]} )); then
  mkdir -p "$stage_agents" "$role_rollback" "$agents"
  for role in "${roles[@]}"; do cp "$src/$role.toml" "$stage_agents/$role.toml"; done
  for role in "${changed[@]}"; do
    if [[ -f "$agents/$role.toml" ]]; then
      mv "$agents/$role.toml" "$role_rollback/$role.toml"
      roles_backed_up+=("$role")
    fi
    if ! mv "$stage_agents/$role.toml" "$agents/$role.toml"; then
      rollback_roles
      fail "could not promote staged role files; existing Sailes roles were restored"
    fi
  done
fi
if (( config_changed )); then
  if [[ -n "$backup" ]]; then
    if ! mkdir -p "$(dirname "$backup")" || ! cp "$config" "$backup"; then rollback_roles; fail 'could not create config backup; existing Sailes roles were restored'; fi
  fi
  temp="$(mktemp "$codex/config.toml.XXXXXXXX.tmp")"
  if ! printf '%s\n' "$candidate" > "$temp" || ! mv -f "$temp" "$config"; then
    rm -f "$temp"
    rollback_roles
    fail 'could not atomically replace config.toml; existing Sailes roles were restored'
  fi
fi
trap - EXIT
cleanup_stage
echo 'INSTALLED: 7 Sailes Codex agents'; echo "Config backup: ${backup:-not needed}"
echo 'Next: start a fresh Codex session and invoke team-lead for non-trivial work.'
echo "Verify: ls $agents/{team-lead,explorer,designer,be-dev,fe-dev,checker,qa}.toml"

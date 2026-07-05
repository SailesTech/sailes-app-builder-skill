#!/usr/bin/env bash
# Install the Sailes app-builder skills globally into ~/.claude/skills/
# so they are active in every project on this machine.
#
# Usage:
#   ./install.sh            # copy all sailes-* skills into ~/.claude/skills/
#   ./install.sh --dry-run  # show what would happen, change nothing
#   ./install.sh --force    # overwrite without the "already exists" prompt
#
# Re-run any time to update to the latest version in this repo (it overwrites
# the installed copy). This installs COPIES (not symlinks) — stable even if you
# move or delete this repo.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$REPO_DIR/skills"
DEST="$HOME/.claude/skills"

DRY_RUN=0
FORCE=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --force)   FORCE=1 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $arg (try --help)"; exit 2 ;;
  esac
done

if [ ! -d "$SRC" ]; then
  echo "ERROR: no skills/ folder at $SRC — run this from the repo." >&2
  exit 1
fi

FRAMEWORK_VERSION="$(cat "$REPO_DIR/VERSION" 2>/dev/null || echo unknown)"
echo "Sailes app-builder framework version: $FRAMEWORK_VERSION"

# Discover the skills to install (every sailes-* dir with a SKILL.md)
shopt -s nullglob
SKILLS=()
for d in "$SRC"/sailes-*/; do
  [ -f "$d/SKILL.md" ] && SKILLS+=("$(basename "$d")")
done
shopt -u nullglob

if [ ${#SKILLS[@]} -eq 0 ]; then
  echo "ERROR: no sailes-* skills found in $SRC" >&2
  exit 1
fi

echo "Installing ${#SKILLS[@]} skill(s) into: $DEST"
echo "  ${SKILLS[*]}"
[ "$DRY_RUN" = 1 ] && echo "(dry run — nothing will be written)"
echo

mkdir -p "$DEST"

for name in "${SKILLS[@]}"; do
  target="$DEST/$name"
  if [ -e "$target" ] && [ "$FORCE" = 0 ] && [ "$DRY_RUN" = 0 ]; then
    printf "  %s already installed — overwrite? [y/N] " "$name"
    read -r reply </dev/tty || reply=""
    case "$reply" in [yY]*) ;; *) echo "    skipped $name"; continue ;; esac
  fi
  if [ "$DRY_RUN" = 1 ]; then
    echo "  would install $name -> $target"
  else
    rm -rf "$target"
    cp -R "$SRC/$name" "$target"
    echo "  installed $name"
  fi
done

echo
echo "Done. Restart Claude Code (or start a new session) to pick up the skills."
echo "Verify with:  ls $DEST"

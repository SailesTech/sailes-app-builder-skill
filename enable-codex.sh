#!/usr/bin/env bash
# Enable the Sailes app-builder skills for OpenAI Codex CLI on THIS machine
# (macOS / Linux). Codex has no plugin marketplace like Claude Code, so this is the
# equivalent of the Claude flow: it copies every sailes-* skill into Codex's
# USER-scope skill path, ~/.agents/skills/, where Codex auto-discovers them in
# EVERY repository (implicit match on the skill `description`, or explicit via
# /skills and $skill-name).
#
#   ./enable-codex.sh            # copy all sailes-* skills into ~/.agents/skills/
#   ./enable-codex.sh --dry-run  # show what would happen, change nothing
#   ./enable-codex.sh --force    # overwrite without the "already exists" prompt
#
# Parity note:
#   Claude Code   → enable-plugin.sh  (marketplace + plugin, auto-installs per repo)
#                   install.sh        (global copy into ~/.claude/skills/)
#   Codex CLI     → enable-codex.sh   (global copy into ~/.agents/skills/)  ← this file
#
# Re-run any time to update to the latest version in this repo (it overwrites the
# installed copy). Installs COPIES (not symlinks) — stable even if you move/delete
# this repo. The SKILL.md frontmatter (name + description) is already Codex-native,
# so no transformation is needed.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$REPO_DIR/skills"
DEST="$HOME/.agents/skills"

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
echo "Target (Codex USER-scope skills): $DEST"

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

echo "Installing ${#SKILLS[@]} skill(s):"
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

# Ship the framework version marker + changelog alongside the skills, so an installed
# sailes-bootstrap (adopt-existing-repo "Upgrade mode") can read them from ~/.agents/skills/.
for meta in VERSION CHANGELOG.md; do
  if [ -f "$REPO_DIR/$meta" ]; then
    if [ "$DRY_RUN" = 1 ]; then
      echo "  would install $meta -> $DEST/$meta"
    else
      cp "$REPO_DIR/$meta" "$DEST/$meta"
      echo "  installed $meta"
    fi
  fi
done

echo
echo "Done. Start a new Codex session to pick up the skills."
echo "Verify with:  ls $DEST"
echo "In Codex:     type /skills  (or reference a skill inline, e.g. \$sailes-discovery)"

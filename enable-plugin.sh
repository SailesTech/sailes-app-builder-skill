#!/usr/bin/env bash
# Enable the Sailes marketplace + plugin for THIS user on THIS machine (macOS / Linux).
# Run once per machine. After this, Claude Code auto-installs the `sailes-app-builder`
# plugin in every project — no per-project action needed.
#
#   ./enable-plugin.sh
#
# Idempotent: safe to re-run. Merges into ~/.claude/settings.json without clobbering
# your existing keys. Uses node (ships with most dev setups) to edit JSON safely.

set -euo pipefail

SETTINGS="$HOME/.claude/settings.json"
mkdir -p "$HOME/.claude"
[ -f "$SETTINGS" ] || echo '{}' > "$SETTINGS"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node is required to merge JSON safely. Install Node, or edit $SETTINGS by hand." >&2
  echo 'Add:  "extraKnownMarketplaces": { "sailes": { "source": { "source": "github", "repo": "SailesTech/sailes-app-builder-skill" } } },  "enabledPlugins": { "sailes-app-builder@sailes": true }' >&2
  exit 1
fi

SETTINGS="$SETTINGS" node -e '
const fs = require("fs");
const p = process.env.SETTINGS;
let s = {};
try { const raw = fs.readFileSync(p, "utf8").trim(); if (raw) s = JSON.parse(raw); } catch (e) {}
s.extraKnownMarketplaces = s.extraKnownMarketplaces || {};
s.extraKnownMarketplaces.sailes = { source: { source: "github", repo: "SailesTech/sailes-app-builder-skill" }, autoUpdate: true };
s.enabledPlugins = s.enabledPlugins || {};
s.enabledPlugins["sailes-app-builder@sailes"] = true;
fs.writeFileSync(p, JSON.stringify(s, null, 2) + "\n");
'

echo "Sailes marketplace + plugin enabled in $SETTINGS"
echo "Restart Claude Code (or open a new session) — the sailes-app-builder plugin will auto-install."

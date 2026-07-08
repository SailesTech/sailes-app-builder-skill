# Enable the Sailes marketplace + plugin for THIS user on THIS machine.
# Run once per machine (Windows / PowerShell). After this, Claude Code auto-installs
# the `sailes-app-builder` plugin in every project - no per-project action needed.
#
#   powershell -ExecutionPolicy Bypass -File .\enable-plugin.ps1
#
# Idempotent: safe to re-run. Merges into ~/.claude/settings.json without clobbering
# your existing keys (model, theme, permissions, ...).

$ErrorActionPreference = 'Stop'

$claudeDir    = Join-Path $env:USERPROFILE '.claude'
$settingsPath = Join-Path $claudeDir 'settings.json'
if (-not (Test-Path $claudeDir)) { New-Item -ItemType Directory -Path $claudeDir | Out-Null }

if (Test-Path $settingsPath) {
  $raw = Get-Content -Raw -Path $settingsPath
  if ([string]::IsNullOrWhiteSpace($raw)) { $settings = [pscustomobject]@{} }
  else { $settings = $raw | ConvertFrom-Json }
} else {
  $settings = [pscustomobject]@{}
}

$marketplace = [pscustomobject]@{
  source     = [pscustomobject]@{ source = 'github'; repo = 'SailesTech/sailes-app-builder-skill' }
  autoUpdate = $true
}

if ($settings.PSObject.Properties.Name -contains 'extraKnownMarketplaces') {
  $settings.extraKnownMarketplaces | Add-Member -NotePropertyName 'sailes' -NotePropertyValue $marketplace -Force
} else {
  $settings | Add-Member -NotePropertyName 'extraKnownMarketplaces' -NotePropertyValue ([pscustomobject]@{ sailes = $marketplace }) -Force
}

if ($settings.PSObject.Properties.Name -contains 'enabledPlugins') {
  $settings.enabledPlugins | Add-Member -NotePropertyName 'sailes-app-builder@sailes' -NotePropertyValue $true -Force
} else {
  $settings | Add-Member -NotePropertyName 'enabledPlugins' -NotePropertyValue ([pscustomobject]@{ 'sailes-app-builder@sailes' = $true }) -Force
}

$out = $settings | ConvertTo-Json -Depth 20
[System.IO.File]::WriteAllText($settingsPath, $out, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "Sailes marketplace + plugin enabled in $settingsPath"
Write-Host "Restart Claude Code (or open a new session) - the sailes-app-builder plugin will auto-install."

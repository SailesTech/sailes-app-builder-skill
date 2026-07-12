# Enable the Sailes app-builder skills for OpenAI Codex CLI on THIS machine
# (Windows / PowerShell). Codex has no plugin marketplace like Claude Code, so this
# is the equivalent of the Claude flow: it copies every sailes-* skill into Codex's
# USER-scope skill path, ~/.agents/skills/, where Codex auto-discovers them in EVERY
# repository (implicit match on the skill `description`, or explicit via /skills and
# $skill-name).
#
#   powershell -ExecutionPolicy Bypass -File .\enable-codex.ps1
#   powershell -ExecutionPolicy Bypass -File .\enable-codex.ps1 -DryRun
#   powershell -ExecutionPolicy Bypass -File .\enable-codex.ps1 -Force
#
# Parity note:
#   Claude Code -> enable-plugin.ps1 (marketplace + plugin, auto-installs per repo)
#                  install.sh        (global copy into ~/.claude/skills/)
#   Codex CLI   -> enable-codex.ps1  (global copy into ~/.agents/skills/)  <- this file
#
# Re-run any time to update to the latest version in this repo (it overwrites the
# installed copy). Installs COPIES (not symlinks). SKILL.md frontmatter is already
# Codex-native, so no transformation is needed.

param(
  [switch]$DryRun,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

$repoDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$src     = Join-Path $repoDir 'skills'
$dest    = Join-Path $env:USERPROFILE '.agents\skills'

if (-not (Test-Path $src)) {
  Write-Error "no skills/ folder at $src - run this from the repo."
  exit 1
}

$frameworkVersion = 'unknown'
$versionFile = Join-Path $repoDir 'VERSION'
if (Test-Path $versionFile) { $frameworkVersion = (Get-Content -Raw $versionFile).Trim() }
Write-Host "Sailes app-builder framework version: $frameworkVersion"
Write-Host "Target (Codex USER-scope skills): $dest"

$skills = Get-ChildItem -Path $src -Directory -Filter 'sailes-*' |
  Where-Object { Test-Path (Join-Path $_.FullName 'SKILL.md') }

if ($skills.Count -eq 0) {
  Write-Error "no sailes-* skills found in $src"
  exit 1
}

Write-Host "Installing $($skills.Count) skill(s):"
Write-Host ("  " + ($skills.Name -join ' '))
if ($DryRun) { Write-Host "(dry run - nothing will be written)" }
Write-Host ""

if (-not $DryRun) { New-Item -ItemType Directory -Path $dest -Force | Out-Null }

foreach ($skill in $skills) {
  $target = Join-Path $dest $skill.Name
  if ((Test-Path $target) -and (-not $Force) -and (-not $DryRun)) {
    $reply = Read-Host "  $($skill.Name) already installed - overwrite? [y/N]"
    if ($reply -notmatch '^[yY]') { Write-Host "    skipped $($skill.Name)"; continue }
  }
  if ($DryRun) {
    Write-Host "  would install $($skill.Name) -> $target"
  } else {
    if (Test-Path $target) { Remove-Item -Recurse -Force $target }
    Copy-Item -Recurse -Force $skill.FullName $target
    Write-Host "  installed $($skill.Name)"
  }
}

# Ship the framework version marker + changelog alongside the skills, so an installed
# sailes-bootstrap (adopt-existing-repo "Upgrade mode") can read them from ~/.agents/skills/.
foreach ($meta in @('VERSION', 'CHANGELOG.md')) {
  $metaPath = Join-Path $repoDir $meta
  if (Test-Path $metaPath) {
    if ($DryRun) {
      Write-Host "  would install $meta -> $(Join-Path $dest $meta)"
    } else {
      Copy-Item -Force $metaPath (Join-Path $dest $meta)
      Write-Host "  installed $meta"
    }
  }
}

Write-Host ""
Write-Host "Done. Start a new Codex session to pick up the skills."
Write-Host "Verify with:  ls $dest"
Write-Host "In Codex:     type /skills  (or reference a skill inline, e.g. `$sailes-discovery)"

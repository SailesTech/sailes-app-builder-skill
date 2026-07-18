# Install the Sailes custom-agent team for Codex at USER scope.
# This is intentionally separate from enable-codex.ps1, which installs skills.
#
#   powershell -ExecutionPolicy Bypass -File .\enable-codex-agents.ps1 -DryRun
#   powershell -ExecutionPolicy Bypass -File .\enable-codex-agents.ps1
#   powershell -ExecutionPolicy Bypass -File .\enable-codex-agents.ps1 -Force

[CmdletBinding()]
param(
  [switch]$DryRun,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

$RoleNames = @('team-lead', 'explorer', 'designer', 'be-dev', 'fe-dev', 'checker', 'qa')
$RoleOwnerMarker = '# sailes-app-builder managed agent'
$BeginMarker = '# BEGIN sailes-app-builder managed agents'
$EndMarker = '# END sailes-app-builder managed agents'

function Normalize-Content([string]$Value) {
  return (($Value -replace "`r`n", "`n" -replace "`r", "`n") -split "`n" |
    ForEach-Object { $_.TrimEnd() }) -join "`n"
}

function Test-SailesOwnedRole([string]$DestinationPath, [string]$SourceContent) {
  $existing = Get-Content -Raw $DestinationPath
  if ($existing -match ('(?m)^\s*' + [regex]::Escape($RoleOwnerMarker) + '\s*$')) { return $true }

  # Version 1.4.0 installed the same role contents without an owner marker. Treat
  # that exact historical content as Sailes-owned once, so it can be upgraded to
  # the explicit marker without ever accepting arbitrary unmarked user content.
  $legacySource = $SourceContent -replace ('(?m)^' + [regex]::Escape($RoleOwnerMarker) + '\r?\n'), ''
  return (Normalize-Content $existing) -eq (Normalize-Content $legacySource)
}

# Unmarked, content-drifted, but still plainly one of our roles: same filename AND it
# declares that role's name. Never matched against arbitrary files — only the seven names.
function Test-LooksLikeSailesRole([string]$DestinationPath, [string]$Role) {
  $existing = Get-Content -Raw $DestinationPath
  return $existing -match ('(?m)^\s*name\s*=\s*"' + [regex]::Escape($Role) + '"\s*$')
}

function Test-CodexStrictConfig {
  $codex = Get-Command codex -ErrorAction SilentlyContinue
  if ($null -eq $codex) {
    throw 'ERROR: Codex CLI is required to validate the existing config.toml. Install or expose `codex` on PATH, then rerun. No files were changed.'
  }
  # `codex exec` appends piped stdin to an explicit prompt. Redirect and close its
  # stdin so this non-interactive preflight cannot wait for console input.
  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $codexArguments = 'exec --strict-config --ephemeral --skip-git-repo-check --color never "Reply only: OK."'
  if ($codex.CommandType -eq [System.Management.Automation.CommandTypes]::ExternalScript) {
    # npm exposes a PowerShell shim as `codex` on Windows, which ProcessStartInfo
    # cannot launch directly. Run that shim in a child PowerShell with the same
    # closed stdin.
    $shellName = if ($PSVersionTable.PSEdition -eq 'Core') { 'pwsh.exe' } else { 'powershell.exe' }
    $startInfo.FileName = Join-Path $PSHOME $shellName
    $startInfo.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$($codex.Source)`" $codexArguments"
  } else {
    $startInfo.FileName = $codex.Source
    $startInfo.Arguments = $codexArguments
  }
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  $startInfo.RedirectStandardInput = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $startInfo
  [void]$process.Start()
  $process.StandardInput.Close()
  $standardOutput = $process.StandardOutput.ReadToEnd()
  $standardError = $process.StandardError.ReadToEnd()
  $process.WaitForExit()
  $validationOutput = @($standardOutput, $standardError) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
  if ($process.ExitCode -ne 0) {
    $details = ($validationOutput | Out-String).Trim()
    throw "ERROR: Codex strict config validation failed. No files were changed. $details"
  }
}

function Get-ManagedBlock {
  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add($BeginMarker)
  foreach ($role in $RoleNames) {
    $lines.Add("[agents.$role]")
    $lines.Add("config_file = `"agents/$role.toml`"")
  }
  $lines.Add($EndMarker)
  return ($lines -join "`n")
}

function Get-ManagedBlockRange([string]$Content) {
  $lines = $Content -split "`r?`n", 0
  $begins = @(); $ends = @()
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i].Trim() -eq $BeginMarker) { $begins += $i }
    if ($lines[$i].Trim() -eq $EndMarker) { $ends += $i }
  }
  if ($begins.Count -eq 0 -and $ends.Count -eq 0) { return $null }
  if ($begins.Count -ne 1 -or $ends.Count -ne 1 -or $begins[0] -ge $ends[0]) {
    throw "ERROR: conflicting or incomplete Sailes managed block in config.toml. Remove or repair only the Sailes managed block, then rerun."
  }
  return [pscustomobject]@{ Start = $begins[0]; End = $ends[0]; Lines = $lines }
}

function Test-TomlSyntax([string]$Content) {
  # Conservative syntax guard for the conventional Codex config surface. It catches
  # malformed headings, assignments, unterminated strings, and duplicate headings/keys
  # before this installer writes anything, while leaving unrelated valid TOML intact.
  $currentTable = ''
  $tables = @{}
  $keys = @{}
  $inMultiline = $false
  $lineNumber = 0
  $tomlKeyPart = '(?:[A-Za-z0-9_-]+|"(?:[^"\\]|\\.)*"|''(?:[^'']|'')*'')'
  foreach ($line in ($Content -split "`r?`n", 0)) {
    $lineNumber++
    $trimmed = $line.Trim()
    if ($inMultiline) {
      if (($trimmed -split '"""').Count % 2 -eq 0) { $inMultiline = $false }
      continue
    }
    if ($trimmed -eq '' -or $trimmed.StartsWith('#')) { continue }
    if ($trimmed -match '"""') {
      if (($trimmed -split '"""').Count % 2 -eq 0) { $inMultiline = $true }
      if ($trimmed -notmatch '^\s*(?:[A-Za-z0-9_-]+|"(?:[^"\\]|\\.)+")\s*=') {
        return "line ${lineNumber}: malformed multiline assignment"
      }
      continue
    }
    $withoutComment = ([regex]::Replace($trimmed, '(?<!\\)#.*$', '')).Trim()
    if ($withoutComment -match ('^\[(' + $tomlKeyPart + '(?:\.' + $tomlKeyPart + ')*)\]$')) {
      $currentTable = $Matches[1]
      if ($tables.ContainsKey($currentTable)) { return "line ${lineNumber}: duplicate table [$currentTable]" }
      $tables[$currentTable] = $true
      continue
    }
    if ($withoutComment -notmatch ('^(' + $tomlKeyPart + '(?:\.' + $tomlKeyPart + ')*)\s*=\s*(.+)$')) {
      return "line ${lineNumber}: expected a TOML table or key/value assignment"
    }
    $value = $Matches[2].Trim()
    if (($value.StartsWith('"') -and -not $value.EndsWith('"')) -or ($value.StartsWith("'") -and -not $value.EndsWith("'"))) {
      return "line ${lineNumber}: unterminated string"
    }
    $key = "$currentTable/$($Matches[1])"
    if ($keys.ContainsKey($key)) { return "line ${lineNumber}: duplicate key $($Matches[1])" }
    $keys[$key] = $true
  }
  if ($inMultiline) { return 'unterminated multiline string' }
  return $null
}

function Get-CandidateConfig([string]$Existing, $Range, [string]$Block) {
  if ($null -eq $Range) {
    if ([string]::IsNullOrWhiteSpace($Existing)) { return "$Block`n" }
    return ($Existing.TrimEnd("`r", "`n") + "`n`n" + $Block + "`n")
  }
  $before = if ($Range.Start -eq 0) { @() } else { @($Range.Lines[0..($Range.Start - 1)]) }
  $after = if ($Range.End -eq ($Range.Lines.Count - 1)) { @() } else { @($Range.Lines[($Range.End + 1)..($Range.Lines.Count - 1)]) }
  return ((@($before) + @($Block -split "`n") + @($after)) -join "`n").TrimEnd("`n") + "`n"
}

function Test-OutsideRoleConflicts([string]$Content, $Range) {
  $lines = $Content -split "`r?`n", 0
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($null -ne $Range -and $i -ge $Range.Start -and $i -le $Range.End) { continue }
    foreach ($role in $RoleNames) {
      if ($lines[$i] -match ('^\s*\[agents\.' + [regex]::Escape($role) + '\]\s*(?:#.*)?$')) {
        throw "ERROR: conflicting Sailes agent entry [agents.$role] outside the managed block in config.toml. Move/remove that entry manually, then rerun."
      }
    }
  }
}

try {
  $repoDir = Split-Path -Parent $MyInvocation.MyCommand.Path
  $sourceDir = Join-Path $repoDir 'codex-agents'
  $homeDir = if ($env:USERPROFILE) { $env:USERPROFILE } else { [Environment]::GetFolderPath('UserProfile') }
  $codexDir = Join-Path $homeDir '.codex'
  $agentDir = Join-Path $codexDir 'agents'
  $configPath = Join-Path $codexDir 'config.toml'
  $frameworkVersion = if (Test-Path (Join-Path $repoDir 'VERSION')) { (Get-Content -Raw (Join-Path $repoDir 'VERSION')).Trim() } else { 'unknown' }

  foreach ($role in $RoleNames) {
    $sourcePath = Join-Path $sourceDir "$role.toml"
    if (-not (Test-Path $sourcePath)) { throw "ERROR: missing source agent definition: $sourcePath" }
    $tomlIssue = Test-TomlSyntax (Get-Content -Raw $sourcePath)
    if ($tomlIssue) { throw "ERROR: invalid source TOML in $sourcePath ($tomlIssue)" }
  }

  $existingConfig = if (Test-Path $configPath) { Get-Content -Raw $configPath } else { '' }
  Test-CodexStrictConfig
  $configIssue = Test-TomlSyntax $existingConfig
  if ($configIssue) { throw "ERROR: config.toml is malformed ($configIssue). No files were changed; repair $configPath and rerun." }
  $range = Get-ManagedBlockRange $existingConfig
  Test-OutsideRoleConflicts $existingConfig $range
  $managedBlock = Get-ManagedBlock
  $candidateConfig = Get-CandidateConfig $existingConfig $range $managedBlock
  $candidateIssue = Test-TomlSyntax $candidateConfig
  if ($candidateIssue) { throw "ERROR: generated config failed validation ($candidateIssue). No files were changed." }

  $changedRoles = @()
  $adoptRoles = @()
  $sourceContents = @{}
  foreach ($role in $RoleNames) {
    $sourceContent = Get-Content -Raw (Join-Path $sourceDir "$role.toml")
    $sourceContents[$role] = $sourceContent
    $destinationPath = Join-Path $agentDir "$role.toml"
    if ((Test-Path $destinationPath) -and -not (Test-SailesOwnedRole $destinationPath $sourceContent)) {
      # Content-equality ownership only holds until the role definition changes upstream.
      # After any edit, a file the previous installer wrote stops being recognizable and the
      # upgrade dead-ends. A file named for one of our roles that declares that same role is
      # ours by every practical measure; adopt it with consent and a backup rather than
      # telling the human to delete their own agents by hand.
      if (Test-LooksLikeSailesRole $destinationPath $role) {
        $adoptRoles += $role
      } else {
        throw "ERROR: existing $destinationPath is not a Sailes role definition (no name = `"$role`"). It will not be replaced, even with -Force. Rename or remove it manually, then rerun."
      }
    }
    if (-not (Test-Path $destinationPath) -or (Normalize-Content $sourceContent) -ne (Normalize-Content (Get-Content -Raw $destinationPath))) {
      $changedRoles += $role
    }
  }
  $configChanged = (Normalize-Content $existingConfig) -ne (Normalize-Content $candidateConfig)
  $hasChanges = $changedRoles.Count -gt 0 -or $configChanged
  $action = if (-not $hasChanges) { 'already current' } elseif ([string]::IsNullOrWhiteSpace($existingConfig)) { 'install' } else { 'update' }
  $backupPath = if ($configChanged -and (Test-Path $configPath)) { Join-Path $codexDir ("backups\config.toml.{0}.bak" -f (Get-Date -Format 'yyyyMMdd-HHmmss')) } else { $null }

  Write-Host "Sailes Codex agents v$frameworkVersion"
  Write-Host ''
  Write-Host 'PLAN'
  Write-Host "  source:      $([IO.Path]::GetFullPath($sourceDir))"
  Write-Host "  role files:  7 -> $([IO.Path]::GetFullPath($agentDir))"
  Write-Host "  config:      $([IO.Path]::GetFullPath($configPath))"
  Write-Host "  backup:      $(if ($backupPath) { [IO.Path]::GetFullPath($backupPath) } else { '<none>' })"
  Write-Host "  action:      $action"
  Write-Host ''
  Write-Host "Roles: $($RoleNames -join ', ')"
  if ($changedRoles.Count) { Write-Host "Changed roles: $($changedRoles -join ', ')" }
  if ($configChanged) { Write-Host 'Config: managed block will be installed or updated' }

  $agentBackupDir = Join-Path $codexDir ("backups\agents.{0}" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
  if ($adoptRoles.Count) {
    Write-Host ''
    Write-Host 'ADOPT: these role files predate this installer (or were written without its marker):'
    foreach ($role in $adoptRoles) { Write-Host "  $(Join-Path $agentDir "$role.toml")" }
    Write-Host '  They declare our role names, so they look like an earlier Sailes install.'
    Write-Host "  Each will be backed up to $agentBackupDir before being replaced."
  }

  if (-not $hasChanges) {
    Write-Host 'ALREADY CURRENT: no changes made'
    exit 0
  }
  if ($DryRun) {
    Write-Host 'DRY RUN: no directories, files, backups, or config changes were made'
    exit 0
  }
  if ($adoptRoles.Count) {
    # Adoption overwrites a file this run did not write, so it is asked separately from the
    # ordinary update — and -Force does NOT answer it. Forcing an update is not the same
    # decision as adopting files of unknown provenance.
    $reply = Read-Host "Adopt and replace the $($adoptRoles.Count) file(s) above (backup kept)? [y/N]"
    if ($reply -notmatch '^[yY]') { Write-Host 'No changes made.'; exit 0 }
    New-Item -ItemType Directory -Force -Path $agentBackupDir | Out-Null
    foreach ($role in $adoptRoles) {
      Copy-Item (Join-Path $agentDir "$role.toml") (Join-Path $agentBackupDir "$role.toml") -Force
    }
    Write-Host "Backed up $($adoptRoles.Count) file(s) to $agentBackupDir"
  }
  if (-not $Force) {
    $question = if ($action -eq 'install') { 'Install?' } else { 'Update?' }
    $reply = Read-Host "$question [y/N]"
    if ($reply -notmatch '^[yY]') { Write-Host 'No changes made.'; exit 0 }
  }

  $stageRoot = Join-Path $codexDir (".sailes-agent-stage.{0}" -f [guid]::NewGuid().ToString('N'))
  $stageAgentDir = Join-Path $stageRoot 'agents'
  $roleRollbackDir = Join-Path $stageRoot 'role-rollback'
  $rolesBackedUp = @()
  try {
    if ($changedRoles.Count) {
      New-Item -ItemType Directory -Force -Path $stageAgentDir | Out-Null
      foreach ($role in $RoleNames) {
        [IO.File]::WriteAllText((Join-Path $stageAgentDir "$role.toml"), $sourceContents[$role], (New-Object Text.UTF8Encoding($false)))
      }

      New-Item -ItemType Directory -Force -Path $agentDir | Out-Null
      New-Item -ItemType Directory -Force -Path $roleRollbackDir | Out-Null
      foreach ($role in $changedRoles) {
        $destinationPath = Join-Path $agentDir "$role.toml"
        $rollbackPath = Join-Path $roleRollbackDir "$role.toml"
        if (Test-Path $destinationPath) {
          [IO.File]::Move($destinationPath, $rollbackPath)
          $rolesBackedUp += $role
        }
        [IO.File]::Move((Join-Path $stageAgentDir "$role.toml"), $destinationPath)
      }
    }

    if ($configChanged) {
      if ($backupPath) {
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $backupPath) | Out-Null
        Copy-Item -Force $configPath $backupPath
      }
      New-Item -ItemType Directory -Force -Path $codexDir | Out-Null
      $tmpPath = Join-Path $codexDir ("config.toml.{0}.tmp" -f [guid]::NewGuid().ToString('N'))
      $replaceBackupPath = Join-Path $codexDir ("config.toml.{0}.replace.bak" -f [guid]::NewGuid().ToString('N'))
      [IO.File]::WriteAllText($tmpPath, $candidateConfig, (New-Object Text.UTF8Encoding($false)))
      try {
        if (Test-Path $configPath) { [IO.File]::Replace($tmpPath, $configPath, $replaceBackupPath) }
        else { [IO.File]::Move($tmpPath, $configPath) }
      } finally {
        if (Test-Path $tmpPath) { Remove-Item -Force $tmpPath }
        if (Test-Path $replaceBackupPath) { Remove-Item -Force $replaceBackupPath }
      }
    }
  } catch {
    foreach ($role in ($rolesBackedUp | Select-Object -Reverse)) {
      $destinationPath = Join-Path $agentDir "$role.toml"
      $rollbackPath = Join-Path $roleRollbackDir "$role.toml"
      if (Test-Path $destinationPath) { Remove-Item -Force $destinationPath }
      if (Test-Path $rollbackPath) { [IO.File]::Move($rollbackPath, $destinationPath) }
    }
    throw
  } finally {
    if (Test-Path $stageRoot) { Remove-Item -Recurse -Force $stageRoot }
  }

  Write-Host 'INSTALLED: 7 Sailes Codex agents'
  Write-Host "Config backup: $(if ($backupPath) { [IO.Path]::GetFullPath($backupPath) } else { 'not needed' })"
  Write-Host 'Next: start a fresh Codex session and invoke team-lead for non-trivial work.'
  Write-Host "Verify: Get-ChildItem $agentDir/*.toml | Where-Object Name -in @('team-lead.toml','explorer.toml','designer.toml','be-dev.toml','fe-dev.toml','checker.toml','qa.toml')"
} catch {
  Write-Error $_.Exception.Message
  exit 1
}

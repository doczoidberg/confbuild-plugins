$ErrorActionPreference = 'Stop'

$checkIntervalSeconds = 86400
$staleLockSeconds = 900

if (-not $env:PLUGIN_ROOT -or -not $env:PLUGIN_DATA) {
  exit 0
}

$codex = Get-Command codex -ErrorAction SilentlyContinue
if (-not $codex) {
  exit 0
}

$dataDirectory = $env:PLUGIN_DATA
$stateFile = Join-Path $dataDirectory 'auto-update-last-check'
$errorFile = Join-Path $dataDirectory 'auto-update-last-error.log'
$lockDirectory = Join-Path $dataDirectory 'auto-update.lock'
$lockAcquired = $false
$now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

function Test-CheckedRecently {
  if (-not (Test-Path -LiteralPath $stateFile -PathType Leaf)) {
    return $false
  }
  $lastCheck = 0L
  if (-not [long]::TryParse((Get-Content -LiteralPath $stateFile -TotalCount 1), [ref]$lastCheck)) {
    return $false
  }
  $elapsed = $now - $lastCheck
  return $elapsed -ge 0 -and $elapsed -lt $checkIntervalSeconds
}

try {
  New-Item -ItemType Directory -Path $dataDirectory -Force | Out-Null
  if (Test-CheckedRecently) {
    exit 0
  }

  try {
    New-Item -ItemType Directory -Path $lockDirectory -ErrorAction Stop | Out-Null
    $lockAcquired = $true
  } catch {
    $lockStartedFile = Join-Path $lockDirectory 'started-at'
    $lockStarted = 0L
    if (Test-Path -LiteralPath $lockStartedFile -PathType Leaf) {
      [long]::TryParse((Get-Content -LiteralPath $lockStartedFile -TotalCount 1), [ref]$lockStarted) | Out-Null
    }
    if (($now - $lockStarted) -le $staleLockSeconds) {
      exit 0
    }
    Remove-Item -LiteralPath $lockDirectory -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Path $lockDirectory -ErrorAction Stop | Out-Null
    $lockAcquired = $true
  }

  Set-Content -LiteralPath (Join-Path $lockDirectory 'started-at') -Value $now -NoNewline
  if (Test-CheckedRecently) {
    exit 0
  }

  $stateTemp = "$stateFile.$PID"
  Set-Content -LiteralPath $stateTemp -Value $now -NoNewline
  Move-Item -LiteralPath $stateTemp -Destination $stateFile -Force

  $marketplaceText = (& $codex.Source plugin marketplace list --json 2>$null | Out-String)
  if ($LASTEXITCODE -ne 0) {
    exit 0
  }
  try {
    $marketplaceResult = $marketplaceText | ConvertFrom-Json
  } catch {
    exit 0
  }
  $marketplace = $marketplaceResult.marketplaces | Where-Object {
    $_.name -eq 'confbuild' -and
    $_.marketplaceSource.source -match '^https://github\.com/doczoidberg/confbuild-plugins(?:\.git)?$'
  } | Select-Object -First 1
  if (-not $marketplace) {
    exit 0
  }

  $resultText = (& $codex.Source plugin marketplace upgrade confbuild --json 2>&1 | Out-String)
  if ($LASTEXITCODE -ne 0) {
    Set-Content -LiteralPath $errorFile -Value $resultText
    exit 0
  }
  try {
    $result = $resultText | ConvertFrom-Json
  } catch {
    Set-Content -LiteralPath $errorFile -Value $resultText
    exit 0
  }
  if ($result.errors.Count -gt 0) {
    Set-Content -LiteralPath $errorFile -Value $resultText
    exit 0
  }

  Remove-Item -LiteralPath $errorFile -Force -ErrorAction SilentlyContinue
  if ($result.upgradedRoots.Count -gt 0) {
    @{
      continue = $true
      systemMessage = 'confBuild was updated automatically. Start a new Codex task to guarantee that the refreshed skill and MCP package are loaded.'
    } | ConvertTo-Json -Compress
  }
} catch {
  Set-Content -LiteralPath $errorFile -Value $_.Exception.Message -ErrorAction SilentlyContinue
} finally {
  if ($lockAcquired) {
    Remove-Item -LiteralPath $lockDirectory -Recurse -Force -ErrorAction SilentlyContinue
  }
}

exit 0

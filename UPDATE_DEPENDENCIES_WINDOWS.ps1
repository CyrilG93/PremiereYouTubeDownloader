param()

$ErrorActionPreference = "Stop"

# // Resolve the private runtime used by the Full Windows installer.
$runtimeDir = Join-Path $env:LOCALAPPDATA "PremiereYouTubeDownloader\runtime"
$privatePython = Join-Path $runtimeDir "python\python.exe"
$privateDeno = Join-Path $runtimeDir "deno\bin\deno.exe"
$privateFfmpeg = Join-Path $runtimeDir "ffmpeg\bin\ffmpeg.exe"

function Write-YtdlInfo {
  param([string]$Message)
  # // Prefix updater messages so failures remain understandable when launched from the batch helper.
  Write-Host "[YouTube Downloader] $Message"
}

function Get-YtdlVersion {
  param([string]$PythonPath)
  # // Capture the module version without relying on the non-portable pip launcher executable.
  $output = & $PythonPath -m yt_dlp --version 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "yt-dlp could not start through $PythonPath"
  }
  return [string]($output | Select-Object -First 1)
}

function Update-YtdlPrivateRuntime {
  # // Upgrade yt-dlp and its EJS dependencies inside the isolated installer runtime.
  $oldVersion = Get-YtdlVersion -PythonPath $privatePython
  Write-YtdlInfo "Private yt-dlp version: $oldVersion"
  $previousNoUserSite = $env:PYTHONNOUSERSITE
  $env:PYTHONNOUSERSITE = "1"
  try {
    & $privatePython -m pip install --upgrade --disable-pip-version-check --no-warn-script-location "yt-dlp[default]"
    if ($LASTEXITCODE -ne 0) {
      throw "pip could not update private yt-dlp."
    }
  } finally {
    $env:PYTHONNOUSERSITE = $previousNoUserSite
  }

  $newVersion = Get-YtdlVersion -PythonPath $privatePython
  if ($oldVersion -eq $newVersion) {
    Write-YtdlInfo "yt-dlp is already current: $newVersion"
  } else {
    Write-YtdlInfo "yt-dlp updated: $oldVersion -> $newVersion"
  }
}

function Update-YtdlPrivateDeno {
  # // Keep Deno current when the network allows it, but preserve a working bundled binary on proxy failures.
  if (-not (Test-Path -LiteralPath $privateDeno -PathType Leaf)) {
    Write-YtdlInfo "WARNING: private Deno is missing; reinstall the latest Full installer."
    return
  }

  $oldVersion = [string]((& $privateDeno --version 2>&1) | Select-Object -First 1)
  $previousDenoInstall = $env:DENO_INSTALL
  $env:DENO_INSTALL = Join-Path $runtimeDir "deno"
  try {
    & $privateDeno upgrade
    if ($LASTEXITCODE -ne 0) {
      throw "Deno upgrade returned code $LASTEXITCODE"
    }
    $newVersion = [string]((& $privateDeno --version 2>&1) | Select-Object -First 1)
    Write-YtdlInfo "Deno checked: $oldVersion -> $newVersion"
  } catch {
    & $privateDeno --version *> $null
    if ($LASTEXITCODE -eq 0) {
      Write-YtdlInfo "WARNING: Deno could not update online, but the bundled runtime still works."
    } else {
      throw
    }
  } finally {
    $env:DENO_INSTALL = $previousDenoInstall
  }
}

function Test-YtdlPrivateFfmpeg {
  # // Validate the packaged FFmpeg and direct users to reinstall when the compiled runtime is missing.
  if (-not (Test-Path -LiteralPath $privateFfmpeg -PathType Leaf)) {
    throw "Private FFmpeg is missing; reinstall the latest Full installer."
  }
  $version = & $privateFfmpeg -version 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Private FFmpeg could not start."
  }
  Write-YtdlInfo ([string]($version | Select-Object -First 1))
}

function Update-YtdlLegacyGlobalRuntime {
  # // Preserve support for older ZIP installations that still use Python and yt-dlp from PATH.
  $python = Get-Command python -ErrorAction SilentlyContinue
  if (-not $python) {
    throw "No private runtime or global Python installation was found."
  }
  Write-YtdlInfo "Private runtime not found; updating the legacy global Python installation."
  & $python.Source -m pip install --upgrade --disable-pip-version-check "yt-dlp[default]"
  if ($LASTEXITCODE -ne 0) {
    throw "Global yt-dlp update failed."
  }
  Write-YtdlInfo "Global yt-dlp version: $(Get-YtdlVersion -PythonPath $python.Source)"
}

Write-YtdlInfo "Checking dependencies..."
if (Test-Path -LiteralPath $privatePython -PathType Leaf) {
  Update-YtdlPrivateRuntime
  Update-YtdlPrivateDeno
  Test-YtdlPrivateFfmpeg
} else {
  Update-YtdlLegacyGlobalRuntime
}
Write-YtdlInfo "Dependency update complete."

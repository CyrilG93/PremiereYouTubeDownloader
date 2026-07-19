param(
  [string]$PayloadRoot = "",
  [string]$RuntimeVersion = "1"
)

$ErrorActionPreference = "Stop"

# // Resolve the extracted installer payload so the script can run from Inno Setup or manually during tests.
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $PayloadRoot) {
  $PayloadRoot = Split-Path -Parent $scriptDir
}
$PayloadRoot = [System.IO.Path]::GetFullPath($PayloadRoot)

$sourceDir = Join-Path $PayloadRoot "dist\PremiereYouTubeDownloader"
$destDir = Join-Path $env:APPDATA "Adobe\CEP\extensions\PremiereYouTubeDownloader"
$runtimeDir = Join-Path $env:LOCALAPPDATA "PremiereYouTubeDownloader\runtime"
$payloadRuntimeDir = Join-Path $PayloadRoot "runtime"
$runtimeVersionFile = Join-Path $runtimeDir ".youtubedownloader-runtime-version"
$configFile = Join-Path $destDir "client\js\config.json"

function Write-YtdlInfo {
  param([string]$Message)
  # // Keep install logs readable when launched from either PowerShell or the Inno Setup window.
  Write-Host $Message
}

function Copy-YtdlDirectoryFresh {
  param(
    [string]$Source,
    [string]$Destination,
    [scriptblock]$Validate = $null
  )

  # // Validate a complete replacement before swapping folders so an interrupted copy keeps the previous install usable.
  $parentDir = Split-Path -Parent $Destination
  $replacementDir = "$Destination.new.$PID"
  $previousDir = "$Destination.old.$PID"
  New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
  Remove-Item -LiteralPath $replacementDir -Recurse -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $previousDir -Recurse -Force -ErrorAction SilentlyContinue
  Copy-Item -LiteralPath $Source -Destination $replacementDir -Recurse -Force

  try {
    if ($Validate) {
      & $Validate $replacementDir
    }
    if (Test-Path -LiteralPath $Destination) {
      Move-Item -LiteralPath $Destination -Destination $previousDir
    }
    Move-Item -LiteralPath $replacementDir -Destination $Destination
    Remove-Item -LiteralPath $previousDir -Recurse -Force -ErrorAction SilentlyContinue
  } catch {
    # // Restore the previous folder when the final swap fails after it was moved aside.
    if (-not (Test-Path -LiteralPath $Destination) -and (Test-Path -LiteralPath $previousDir)) {
      Move-Item -LiteralPath $previousDir -Destination $Destination -ErrorAction SilentlyContinue
    }
    throw
  } finally {
    Remove-Item -LiteralPath $replacementDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

function Enable-YtdlCepDebugMode {
  # // Enable unsigned CEP extensions for recent Adobe hosts in HKCU without requiring admin rights.
  $writes = 0
  for ($version = 7; $version -le 20; $version += 1) {
    $key = "HKCU:\Software\Adobe\CSXS.$version"
    try {
      New-Item -Path $key -Force | Out-Null
      New-ItemProperty -Path $key -Name "PlayerDebugMode" -Value "1" -PropertyType String -Force | Out-Null
      $writes += 1
    } catch {
      Write-YtdlInfo "WARNING: unable to enable CEP debug mode for CSXS.$version."
    }
  }

  if ($writes -gt 0) {
    Write-YtdlInfo "CEP debug mode enabled for CSXS.7 to CSXS.20."
  }
}

function Install-YtdlPrivateRuntime {
  # // Validate and atomically install the packaged runtime into LocalAppData.
  if (-not (Test-Path -LiteralPath $payloadRuntimeDir)) {
    throw "Private runtime payload is missing: $payloadRuntimeDir"
  }

  Copy-YtdlDirectoryFresh -Source $payloadRuntimeDir -Destination $runtimeDir -Validate {
    param([string]$StagedRuntimeDir)
    Test-YtdlPrivateRuntime -TargetRuntimeDir $StagedRuntimeDir
  }
  Write-YtdlInfo "Private runtime installed to $runtimeDir."
}

function Test-YtdlPrivateRuntime {
  param([string]$TargetRuntimeDir = $runtimeDir)
  # // Validate all private tools before writing their paths to the CEP config file.
  $pythonPath = Join-Path $TargetRuntimeDir "python\python.exe"
  $ffmpegPath = Join-Path $TargetRuntimeDir "ffmpeg\bin\ffmpeg.exe"
  $ffprobePath = Join-Path $TargetRuntimeDir "ffmpeg\bin\ffprobe.exe"
  $denoPath = Join-Path $TargetRuntimeDir "deno\bin\deno.exe"

  foreach ($tool in @($pythonPath, $ffmpegPath, $ffprobePath, $denoPath)) {
    if (-not (Test-Path -LiteralPath $tool -PathType Leaf)) {
      throw "Private runtime tool is missing: $tool"
    }
    Unblock-File -LiteralPath $tool -ErrorAction SilentlyContinue
  }

  # // Capture native tool output before printing so PowerShell pipelines do not disturb process exit codes.
  $ytDlpVersion = & $pythonPath -m yt_dlp --version 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Private Python could not run yt-dlp."
  }
  $ytDlpVersion | Select-Object -First 1 | Write-Host

  $ffmpegVersion = & $ffmpegPath -version 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Private FFmpeg failed."
  }
  $ffmpegVersion | Select-Object -First 1 | Write-Host

  $ffprobeVersion = & $ffprobePath -version 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Private FFprobe failed."
  }
  $ffprobeVersion | Select-Object -First 1 | Write-Host

  $denoVersion = & $denoPath --version 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Private Deno failed."
  }
  $denoVersion | Select-Object -First 1 | Write-Host
}

function Write-YtdlExtensionConfig {
  # // Persist exact private-runtime paths in the config file read by client/js/downloader.js.
  $pythonPath = Join-Path $runtimeDir "python\python.exe"
  $ytDlpPath = Join-Path $runtimeDir "python\Scripts\yt-dlp.exe"
  $ffmpegPath = Join-Path $runtimeDir "ffmpeg\bin\ffmpeg.exe"
  $denoPath = Join-Path $runtimeDir "deno\bin\deno.exe"

  $config = [ordered]@{
    version = 1
    generatedBy = "youtubedownloader_install_windows_private_runtime.ps1"
    generatedAtUtc = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    nodePath = ""
    pythonPath = $pythonPath
    ytDlpPath = $ytDlpPath
    ffmpegPath = $ffmpegPath
    denoPath = $denoPath
  }

  New-Item -ItemType Directory -Path (Split-Path -Parent $configFile) -Force | Out-Null
  $configJson = $config | ConvertTo-Json -Depth 4
  [System.IO.File]::WriteAllText($configFile, $configJson, (New-Object System.Text.UTF8Encoding($false)))
  Write-YtdlInfo "Runtime config written: $configFile"
}

function Write-YtdlRuntimeVersion {
  # // Mark a validated runtime so future lightweight installers can skip large runtime replacement.
  Set-Content -LiteralPath $runtimeVersionFile -Value $RuntimeVersion -Encoding ASCII
  Write-YtdlInfo "Private runtime version $RuntimeVersion is ready."
}

if (-not (Test-Path -LiteralPath $sourceDir)) {
  throw "Extension payload is missing: $sourceDir"
}

Write-YtdlInfo "Installing YouTube Downloader from $PayloadRoot"
Install-YtdlPrivateRuntime
Test-YtdlPrivateRuntime
Copy-YtdlDirectoryFresh -Source $sourceDir -Destination $destDir
Write-YtdlInfo "YouTube Downloader installed to $destDir."
if ($env:YTDL_SKIP_CEP_DEBUG -ne "1") {
  # // Allow isolated packaging tests to avoid changing the current user's Adobe registry keys.
  Enable-YtdlCepDebugMode
}

Write-YtdlRuntimeVersion
Write-YtdlExtensionConfig

Write-YtdlInfo "Installation complete. Restart Premiere Pro, then open Window > Extensions > YouTube Downloader."

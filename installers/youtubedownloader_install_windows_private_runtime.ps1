param(
  [string]$PayloadRoot = "",
  [switch]$SkipRuntimeInstall,
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
    [string]$Destination
  )

  # // Replace the installed extension or runtime folder cleanly for the current Windows user.
  if (Test-Path -LiteralPath $Destination) {
    Remove-Item -LiteralPath $Destination -Recurse -Force
  }
  New-Item -ItemType Directory -Path (Split-Path -Parent $Destination) -Force | Out-Null
  Copy-Item -LiteralPath $Source -Destination $Destination -Recurse -Force
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
  # // Copy the packaged private runtime into LocalAppData so the plugin does not depend on system tools.
  if (-not (Test-Path -LiteralPath $payloadRuntimeDir)) {
    throw "Private runtime payload is missing: $payloadRuntimeDir"
  }

  Copy-YtdlDirectoryFresh -Source $payloadRuntimeDir -Destination $runtimeDir
  Write-YtdlInfo "Private runtime installed to $runtimeDir."
}

function Test-YtdlPrivateRuntime {
  # // Validate all private tools before writing their paths to the CEP config file.
  $pythonPath = Join-Path $runtimeDir "python\python.exe"
  $ytDlpPath = Join-Path $runtimeDir "python\Scripts\yt-dlp.exe"
  $ffmpegPath = Join-Path $runtimeDir "ffmpeg\bin\ffmpeg.exe"
  $ffprobePath = Join-Path $runtimeDir "ffmpeg\bin\ffprobe.exe"
  $denoPath = Join-Path $runtimeDir "deno\bin\deno.exe"

  foreach ($tool in @($pythonPath, $ytDlpPath, $ffmpegPath, $ffprobePath, $denoPath)) {
    if (-not (Test-Path -LiteralPath $tool -PathType Leaf)) {
      throw "Private runtime tool is missing: $tool"
    }
    Unblock-File -LiteralPath $tool -ErrorAction SilentlyContinue
  }

  & $pythonPath -m yt_dlp --version | Write-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Private Python could not run yt-dlp."
  }
  & $ytDlpPath --version | Write-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Private yt-dlp executable failed."
  }
  & $ffmpegPath -version | Select-Object -First 1 | Write-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Private FFmpeg failed."
  }
  & $ffprobePath -version | Select-Object -First 1 | Write-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Private FFprobe failed."
  }
  & $denoPath --version | Select-Object -First 1 | Write-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Private Deno failed."
  }
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
Copy-YtdlDirectoryFresh -Source $sourceDir -Destination $destDir
Write-YtdlInfo "YouTube Downloader installed to $destDir."
Enable-YtdlCepDebugMode

if (-not $SkipRuntimeInstall) {
  Install-YtdlPrivateRuntime
} else {
  Write-YtdlInfo "Keeping the compatible private runtime already installed."
}

Test-YtdlPrivateRuntime
Write-YtdlRuntimeVersion
Write-YtdlExtensionConfig

Write-YtdlInfo "Installation complete. Restart Premiere Pro, then open Window > Extensions > YouTube Downloader."

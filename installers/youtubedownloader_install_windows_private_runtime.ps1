param(
  [string]$PayloadRoot = "",
  [string]$RuntimeVersion = "1",
  [switch]$UseSystemCepPath,
  [string]$UserAppData = "",
  [string]$UserLocalAppData = ""
)

$ErrorActionPreference = "Stop"

# // Resolve the extracted installer payload so the script can run from Inno Setup or manually during tests.
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $PayloadRoot) {
  $PayloadRoot = Split-Path -Parent $scriptDir
}
$PayloadRoot = [System.IO.Path]::GetFullPath($PayloadRoot)

# // Preserve the interactive user's profile paths when Inno Setup elevates this script for a system CEP install.
if (-not $UserAppData) {
  $UserAppData = $env:APPDATA
}
if (-not $UserLocalAppData) {
  $UserLocalAppData = $env:LOCALAPPDATA
}

$sourceDir = Join-Path $PayloadRoot "dist\PremiereYouTubeDownloader"
$userExtensionDir = Join-Path $UserAppData "Adobe\CEP\extensions\PremiereYouTubeDownloader"
if ($UseSystemCepPath) {
  # // Keep CEP's renderer away from user-profile characters that are unsafe in legacy file URLs.
  $commonFilesX86 = [Environment]::GetFolderPath([Environment+SpecialFolder]::CommonProgramFilesX86)
  if (-not $commonFilesX86) {
    throw "Windows Common Files (x86) folder could not be resolved for the system CEP installation."
  }
  $destDir = Join-Path $commonFilesX86 "Adobe\CEP\extensions\PremiereYouTubeDownloader"
} else {
  $destDir = $userExtensionDir
}
$runtimeDir = Join-Path $UserLocalAppData "PremiereYouTubeDownloader\runtime"
$payloadRuntimeDir = Join-Path $PayloadRoot "runtime"
$runtimeVersionFile = Join-Path $runtimeDir ".youtubedownloader-runtime-version"
$configFile = Join-Path $destDir "client\js\config.json"
$installLogPath = Join-Path $UserLocalAppData "PremiereYouTubeDownloader\installer.log"

function Write-YtdlInfo {
  param([string]$Message)
  # // Save progress in addition to the hidden Inno Setup PowerShell output so users can diagnose slow runtime checks.
  $line = "[{0:yyyy-MM-dd HH:mm:ss}] {1}" -f (Get-Date), $Message
  Write-Host $line
  try {
    New-Item -ItemType Directory -Path (Split-Path -Parent $installLogPath) -Force | Out-Null
    Add-Content -LiteralPath $installLogPath -Value $line -Encoding UTF8
  } catch {
    # // Logging must not prevent the extension from being installed on a profile with restricted LocalAppData access.
  }
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

function Archive-YtdlUserExtension {
  # // Remove the unsafe per-user CEP copy only after the system copy has been validated and installed.
  if (-not $UseSystemCepPath -or -not (Test-Path -LiteralPath $userExtensionDir)) {
    return
  }

  $backupRoot = Join-Path $UserLocalAppData "PremiereYouTubeDownloader\cep-user-extension-backups"
  $backupDir = Join-Path $backupRoot ("PremiereYouTubeDownloader-" + (Get-Date).ToString("yyyyMMdd-HHmmss"))
  New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
  Move-Item -LiteralPath $userExtensionDir -Destination $backupDir
  Write-YtdlInfo "Previous user CEP extension moved to $backupDir."
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
  Write-YtdlInfo "Checking bundled Python and yt-dlp..."
  $ytDlpVersion = & $pythonPath -m yt_dlp --version 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Private Python could not run yt-dlp."
  }
  $ytDlpVersion | Select-Object -First 1 | Write-Host

  Write-YtdlInfo "Checking bundled FFmpeg..."
  $ffmpegVersion = & $ffmpegPath -version 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Private FFmpeg failed."
  }
  $ffmpegVersion | Select-Object -First 1 | Write-Host

  Write-YtdlInfo "Checking bundled FFprobe. Windows security scans can make this step take a few minutes."
  $ffprobeVersion = & $ffprobePath -version 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Private FFprobe failed."
  }
  $ffprobeVersion | Select-Object -First 1 | Write-Host

  Write-YtdlInfo "Checking bundled Deno..."
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
Write-YtdlInfo "Installation progress is also saved to $installLogPath"
if ($UseSystemCepPath) {
  Write-YtdlInfo "Using the system CEP folder to avoid special characters in the Windows user profile path."
}
Install-YtdlPrivateRuntime
Test-YtdlPrivateRuntime
Copy-YtdlDirectoryFresh -Source $sourceDir -Destination $destDir
Write-YtdlInfo "YouTube Downloader installed to $destDir."
Archive-YtdlUserExtension
if ($env:YTDL_SKIP_CEP_DEBUG -ne "1") {
  # // Allow isolated packaging tests to avoid changing the current user's Adobe registry keys.
  Enable-YtdlCepDebugMode
}

Write-YtdlRuntimeVersion
Write-YtdlExtensionConfig

Write-YtdlInfo "Installation complete. Restart Premiere Pro, then open Window > Extensions > YouTube Downloader."

param(
  [string]$Destination = "",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# // Resolve the repository root from this script location so it works from npm, cmd, or PowerShell.
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $scriptDir ".."))

# // Use the same user-level CEP folder as the modern Windows EXE installer.
if (-not $Destination) {
  $Destination = Join-Path $env:APPDATA "Adobe\CEP\extensions\PremiereYouTubeDownloader"
}
$Destination = [System.IO.Path]::GetFullPath($Destination)

$runtimeDir = Join-Path $env:LOCALAPPDATA "PremiereYouTubeDownloader\runtime"
$configFile = Join-Path $Destination "client\js\config.json"

function Write-YtdlInfo {
  param([string]$Message)
  # // Keep the quick-update output readable when launched from npm or the .bat helper.
  Write-Host "[YouTube Downloader] $Message"
}

function Assert-YtdlSourceFolder {
  param([string]$Name)
  # // Fail early if the script is not being run from a complete plugin checkout.
  $path = Join-Path $repoRoot $Name
  if (-not (Test-Path -LiteralPath $path -PathType Container)) {
    throw "Missing source folder: $path"
  }
  return $path
}

function Copy-YtdlFolderContents {
  param(
    [string]$Source,
    [string]$Target
  )

  # // Overlay files without deleting the installed private-runtime config.
  if ($DryRun) {
    Write-YtdlInfo "Would copy $Source -> $Target"
    return
  }

  New-Item -ItemType Directory -Path $Target -Force | Out-Null
  Get-ChildItem -LiteralPath $Source -Force | Copy-Item -Destination $Target -Recurse -Force
}

function Copy-YtdlOptionalFile {
  param([string]$Name)

  # // Keep the local CEP folder close to the installer payload without requiring a full package rebuild.
  $source = Join-Path $repoRoot $Name
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
    return
  }

  $target = Join-Path $Destination $Name
  if ($DryRun) {
    Write-YtdlInfo "Would copy $source -> $target"
    return
  }

  Copy-Item -LiteralPath $source -Destination $target -Force
}

function Enable-YtdlCepDebugMode {
  # // Enable unsigned CEP extensions for current-user Adobe hosts without requiring admin rights.
  if ($DryRun) {
    Write-YtdlInfo "Would enable CEP debug mode for CSXS.7 to CSXS.20"
    return
  }

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

function Write-YtdlRuntimeConfigIfNeeded {
  # // Preserve an installer-generated config; create one only when the quick copy would otherwise miss runtime paths.
  if (Test-Path -LiteralPath $configFile -PathType Leaf) {
    Write-YtdlInfo "Keeping existing runtime config: $configFile"
    return
  }

  $pythonPath = Join-Path $runtimeDir "python\python.exe"
  $ytDlpPath = Join-Path $runtimeDir "python\Scripts\yt-dlp.exe"
  $ffmpegPath = Join-Path $runtimeDir "ffmpeg\bin\ffmpeg.exe"
  $denoPath = Join-Path $runtimeDir "deno\bin\deno.exe"

  if (
    (Test-Path -LiteralPath $pythonPath -PathType Leaf) -and
    (Test-Path -LiteralPath $ffmpegPath -PathType Leaf) -and
    (Test-Path -LiteralPath $denoPath -PathType Leaf)
  ) {
    if ($DryRun) {
      Write-YtdlInfo "Would write runtime config for $runtimeDir"
      return
    }

    $config = [ordered]@{
      version = 1
      generatedBy = "youtubedownloader-update-local-windows.ps1"
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
    return
  }

  Write-YtdlInfo "WARNING: no runtime config was found or created."
}

$clientSource = Assert-YtdlSourceFolder "client"
$hostSource = Assert-YtdlSourceFolder "host"
$csxsSource = Assert-YtdlSourceFolder "CSXS"

Write-YtdlInfo "Updating local CEP plugin from $repoRoot"
Write-YtdlInfo "Destination: $Destination"

if (-not $DryRun) {
  New-Item -ItemType Directory -Path $Destination -Force | Out-Null
}

Copy-YtdlFolderContents -Source $clientSource -Target (Join-Path $Destination "client")
Copy-YtdlFolderContents -Source $hostSource -Target (Join-Path $Destination "host")
Copy-YtdlFolderContents -Source $csxsSource -Target (Join-Path $Destination "CSXS")
foreach ($fileName in @(
  ".debug",
  "README.md",
  "INSTALLATION_GUIDE.md",
  "UPDATE_DEPENDENCIES.bat",
  "UPDATE_DEPENDENCIES_WINDOWS.ps1"
)) {
  Copy-YtdlOptionalFile $fileName
}
Write-YtdlRuntimeConfigIfNeeded
Enable-YtdlCepDebugMode

Write-YtdlInfo "Local update complete. Restart Premiere Pro, then open Window > Extensions > YouTube Downloader."

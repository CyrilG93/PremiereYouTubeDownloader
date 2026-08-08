param(
  [string]$ExtensionId = "com.youtubedownloader.premiere.panel",
  [int]$DebugPort = 8092,
  [string]$OutputPath = ""
)

$ErrorActionPreference = "Continue"

# // Write a readable line to both the terminal and the diagnostic report.
$reportLines = New-Object System.Collections.Generic.List[string]
function Add-YtdlReportLine {
  param([string]$Message)
  $reportLines.Add($Message)
  Write-Host $Message
}

# // Run a read-only probe without stopping the complete report when one Adobe component is unavailable.
function Invoke-YtdlProbe {
  param(
    [string]$Label,
    [scriptblock]$Action
  )

  try {
    $result = & $Action
    Add-YtdlReportLine "[PASS] $Label"
    return $result
  } catch {
    Add-YtdlReportLine "[WARN] $Label - $($_.Exception.Message)"
    return $null
  }
}

# // Use the current Desktop location, including OneDrive redirects, unless the caller supplied a report path.
if (-not $OutputPath) {
  $desktopPath = [Environment]::GetFolderPath([Environment+SpecialFolder]::DesktopDirectory)
  $OutputPath = Join-Path $desktopPath "PremiereYouTubeDownloader-Diagnostic.txt"
}

$extensionRoot = Join-Path $env:APPDATA "Adobe\CEP\extensions\PremiereYouTubeDownloader"
$debugFile = Join-Path $extensionRoot ".debug"
$manifestPath = Join-Path $extensionRoot "CSXS\manifest.xml"
$baseDebugUrl = "http://127.0.0.1:$DebugPort"

Add-YtdlReportLine "YouTube Downloader Windows Diagnostic"
Add-YtdlReportLine "Generated: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss zzz'))"
Add-YtdlReportLine ""

Add-YtdlReportLine "=== Windows profile ==="
$profileLeaf = Split-Path -Leaf $env:USERPROFILE
$isAsciiProfile = $profileLeaf -cmatch '^[\x20-\x7E]+$'
$isCepSafeProfile = $profileLeaf -cmatch '^[A-Za-z0-9._-]+$'
Add-YtdlReportLine "User profile: $env:USERPROFILE"
Add-YtdlReportLine "Profile leaf is ASCII only: $isAsciiProfile"
Add-YtdlReportLine "Profile leaf uses CEP-safe characters only: $isCepSafeProfile"
if (-not $isCepSafeProfile) {
  Add-YtdlReportLine "[WARN] The Windows profile contains characters such as spaces, quotes, or non-Latin text that can affect legacy CEP path loading."
}
Add-YtdlReportLine "AppData: $env:APPDATA"
Add-YtdlReportLine "LocalAppData: $env:LOCALAPPDATA"
Invoke-YtdlProbe "Read Windows version" {
  $os = Get-CimInstance Win32_OperatingSystem
  Add-YtdlReportLine "Windows: $($os.Caption) $($os.Version)"
} | Out-Null

Add-YtdlReportLine ""
Add-YtdlReportLine "=== Premiere Pro ==="
$premiereProcesses = Get-Process -Name "Adobe Premiere Pro" -ErrorAction SilentlyContinue
if ($premiereProcesses) {
  foreach ($process in $premiereProcesses) {
    Add-YtdlReportLine "[PASS] Premiere process: PID $($process.Id) $($process.Path)"
  }
} else {
  Add-YtdlReportLine "[WARN] Premiere Pro is not running. Open Premiere and the YouTube Downloader panel, then run this script again."
}
foreach ($folder in Get-ChildItem -LiteralPath "C:\Program Files\Adobe" -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "Adobe Premiere Pro*" }) {
  $exePath = Join-Path $folder.FullName "Adobe Premiere Pro.exe"
  if (Test-Path -LiteralPath $exePath -PathType Leaf) {
    $version = (Get-Item -LiteralPath $exePath).VersionInfo.ProductVersion
    Add-YtdlReportLine "Installed: $($folder.Name) ($version)"
  }
}

Add-YtdlReportLine ""
Add-YtdlReportLine "=== CEP extension files ==="
if (Test-Path -LiteralPath $extensionRoot -PathType Container) {
  Add-YtdlReportLine "[PASS] Extension folder: $extensionRoot"
} else {
  Add-YtdlReportLine "[FAIL] Extension folder is missing: $extensionRoot"
}
if (Test-Path -LiteralPath $manifestPath -PathType Leaf) {
  Invoke-YtdlProbe "Read extension manifest" {
    [xml]$manifest = Get-Content -LiteralPath $manifestPath -Raw
    $bundleVersion = $manifest.ExtensionManifest.ExtensionBundleVersion
    $mainPath = $manifest.ExtensionManifest.DispatchInfoList.Extension.DispatchInfo.Resources.MainPath
    Add-YtdlReportLine "Manifest version: $bundleVersion"
    Add-YtdlReportLine "Manifest main path: $mainPath"
  } | Out-Null
} else {
  Add-YtdlReportLine "[FAIL] Manifest is missing: $manifestPath"
}
if (Test-Path -LiteralPath $debugFile -PathType Leaf) {
  Invoke-YtdlProbe "Read CEP .debug file" {
    [xml]$debugConfig = Get-Content -LiteralPath $debugFile -Raw
    $debugExtension = $debugConfig.ExtensionList.Extension | Where-Object { $_.Id -eq $ExtensionId } | Select-Object -First 1
    $debugHost = $debugExtension.HostList.Host | Where-Object { $_.Name -eq "PPRO" } | Select-Object -First 1
    Add-YtdlReportLine "Debug PPRO port: $($debugHost.Port)"
    if ([string]$debugHost.Port -ne [string]$DebugPort) {
      Add-YtdlReportLine "[WARN] The .debug port does not match the requested port $DebugPort."
    }
  } | Out-Null
} else {
  Add-YtdlReportLine "[WARN] CEP .debug file is missing: $debugFile"
}

Add-YtdlReportLine ""
Add-YtdlReportLine "=== CSXS debug registry ==="
$debugEnabledVersions = New-Object System.Collections.Generic.List[string]
for ($version = 7; $version -le 20; $version += 1) {
  $registryPath = "HKCU:\Software\Adobe\CSXS.$version"
  $debugValue = Get-ItemPropertyValue -Path $registryPath -Name "PlayerDebugMode" -ErrorAction SilentlyContinue
  if ([string]$debugValue -eq "1") {
    $debugEnabledVersions.Add("CSXS.$version")
  }
}
if ($debugEnabledVersions.Count -gt 0) {
  Add-YtdlReportLine "[PASS] PlayerDebugMode=1: $($debugEnabledVersions -join ', ')"
} else {
  Add-YtdlReportLine "[WARN] PlayerDebugMode=1 was not found in CSXS.7 through CSXS.20."
}

Add-YtdlReportLine ""
Add-YtdlReportLine "=== CEP remote-debugging endpoint ==="
$targets = Invoke-YtdlProbe "Read $baseDebugUrl/json" {
  $response = Invoke-WebRequest -UseBasicParsing -Uri "$baseDebugUrl/json" -TimeoutSec 5
  $parsedTargets = @($response.Content | ConvertFrom-Json)
  Add-YtdlReportLine "Endpoint returned $($parsedTargets.Count) inspectable target(s)."
  return $parsedTargets
}

$extensionTarget = $null
if ($targets) {
  foreach ($target in $targets) {
    Add-YtdlReportLine "Target: title='$($target.title)' url='$($target.url)'"
    if ($target.url -like "*PremiereYouTubeDownloader*" -or $target.title -eq "YouTube Downloader") {
      $extensionTarget = $target
    }
  }
}

# // Query the target through the Chrome DevTools Protocol so browser-specific DevTools pages cannot distort the result.
function Invoke-YtdlCdpEvaluate {
  param(
    [string]$WebSocketUrl,
    [string]$Expression
  )

  $socket = New-Object System.Net.WebSockets.ClientWebSocket
  $cancellation = New-Object System.Threading.CancellationTokenSource
  $cancellation.CancelAfter(5000)
  try {
    $socket.ConnectAsync([Uri]$WebSocketUrl, $cancellation.Token).GetAwaiter().GetResult()
    $request = @{
      id = 1
      method = "Runtime.evaluate"
      params = @{
        expression = $Expression
        returnByValue = $true
      }
    } | ConvertTo-Json -Depth 6 -Compress
    $requestBytes = [System.Text.Encoding]::UTF8.GetBytes($request)
    $socket.SendAsync(
      (New-Object System.ArraySegment[byte] -ArgumentList (, $requestBytes)),
      [System.Net.WebSockets.WebSocketMessageType]::Text,
      $true,
      $cancellation.Token
    ).GetAwaiter().GetResult()

    $buffer = New-Object byte[] 16384
    $stream = New-Object System.IO.MemoryStream
    do {
      $receiveResult = $socket.ReceiveAsync(
        (New-Object System.ArraySegment[byte] -ArgumentList (, $buffer)),
        $cancellation.Token
      ).GetAwaiter().GetResult()
      if ($receiveResult.Count -gt 0) {
        $stream.Write($buffer, 0, $receiveResult.Count)
      }
    } while (-not $receiveResult.EndOfMessage)
    return [System.Text.Encoding]::UTF8.GetString($stream.ToArray()) | ConvertFrom-Json
  } finally {
    if ($socket.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
      try {
        # // Some CEP CEF builds close the debugger connection without a WebSocket close handshake after a valid reply.
        $socket.CloseAsync(
          [System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure,
          "Diagnostic complete",
          [Threading.CancellationToken]::None
        ).GetAwaiter().GetResult()
      } catch {
        # // The evaluation result was already received, so a legacy CEF close-handshake failure is non-blocking.
      }
    }
    $socket.Dispose()
    $cancellation.Dispose()
  }
}

if ($extensionTarget -and $extensionTarget.webSocketDebuggerUrl) {
  Add-YtdlReportLine ""
  Add-YtdlReportLine "=== Direct CEF target probe ==="
  $probeExpression = @'
JSON.stringify((function () {
  var container = document.querySelector('.container');
  var bounds = container ? container.getBoundingClientRect() : null;
  return {
    title: document.title,
    readyState: document.readyState,
    location: window.location.href,
    bodyLength: document.body ? document.body.innerHTML.length : 0,
    require: typeof require,
    cep: typeof window.__adobe_cep__,
    container: bounds ? { width: bounds.width, height: bounds.height } : null
  };
})())
'@
  $probeResult = Invoke-YtdlProbe "Evaluate the live CEP target through WebSocket" {
    Invoke-YtdlCdpEvaluate -WebSocketUrl $extensionTarget.webSocketDebuggerUrl -Expression $probeExpression
  }
  if ($probeResult) {
    if ($probeResult.error) {
      Add-YtdlReportLine "[FAIL] CEF protocol error: $($probeResult.error.message)"
    } elseif ($probeResult.result.exceptionDetails) {
      Add-YtdlReportLine "[FAIL] Page evaluation exception: $($probeResult.result.exceptionDetails.text)"
    } else {
      $value = $probeResult.result.result.value
      if ([string]::IsNullOrWhiteSpace([string]$value)) {
        $rawProbe = $probeResult | ConvertTo-Json -Depth 10 -Compress
        Add-YtdlReportLine "[WARN] CEF returned no JavaScript evaluation value: $rawProbe"
      } else {
        Add-YtdlReportLine "CEF target evaluation: $value"
      }
    }
  }
} elseif ($targets) {
  Add-YtdlReportLine "[WARN] No YouTube Downloader target with a WebSocket debugger URL was found."
}

Add-YtdlReportLine ""
Add-YtdlReportLine "=== Next step ==="
Add-YtdlReportLine "Send this complete report to support. Do not share cookies, passwords, or private videos."

# // Save the final report after every probe so it can be attached without copying terminal output.
try {
  $outputDirectory = Split-Path -Parent $OutputPath
  if ($outputDirectory) {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
  }
  [System.IO.File]::WriteAllLines($OutputPath, $reportLines, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host ""
  Write-Host "Diagnostic report saved to: $OutputPath"
} catch {
  Write-Warning "Could not save the diagnostic report: $($_.Exception.Message)"
}

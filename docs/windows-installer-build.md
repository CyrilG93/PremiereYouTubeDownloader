# Windows EXE Installer Build

This project can build Windows `.exe` installers with a private runtime:

- Python embeddable
- yt-dlp with EJS support
- Deno
- LGPL FFmpeg and FFprobe

## Requirements

- Windows 10/11 x64
- Node.js
- PowerShell
- Internet access for first build downloads
- Inno Setup 6, optional. The build script can install it into staging if missing.

## Build

From the project root on Windows:

```powershell
npm install
npm run package:windows-exe
```

Generated files are written to `Releases/`:

- `PremiereYouTubeDownloader-vX-Windows-Full-Installer.exe`
- `PremiereYouTubeDownloader-vX-Windows-Light-Installer.exe`
- `PremiereYouTubeDownloader-Windows-Runtime-v1.exe`

Use the **Full** installer for first public tests. The **Light** installer is only complete after the runtime asset has been published to the GitHub release tag listed in `installers/windows-runtime.json`.

The first successful build fills the `sha256` field in `installers/windows-runtime.json`. Keep that value with the matching runtime EXE; if the runtime EXE is rebuilt, rebuild the user installers too.

## Useful Environment Variables

```powershell
$env:YTDL_WINDOWS_REUSE_STAGING = "1"
$env:YTDL_WINDOWS_REBUILD_RUNTIME = "1"
$env:YTDL_WINDOWS_FULL_ONLY = "1"
$env:YTDL_WINDOWS_LIGHT_ONLY = "1"
$env:YTDL_WINDOWS_ISCC_PATH = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
```

## Validation

After compiling on Windows:

```powershell
npm run verify
Get-FileHash .\Releases\PremiereYouTubeDownloader-vX-Windows-Full-Installer.exe -Algorithm SHA256
```

Install the Full EXE on a Windows Premiere machine, restart Premiere Pro, then open `Window > Extensions > YouTube Downloader`.

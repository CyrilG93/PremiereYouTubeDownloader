# Windows EXE Installer Build

This project builds one Windows Full `.exe` installer with a private runtime:

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

The Full installer always embeds the extension, Python, yt-dlp, Deno, FFmpeg and FFprobe. Light and updater installers are not produced.

## Useful Environment Variables

```powershell
$env:YTDL_WINDOWS_REUSE_STAGING = "1"
$env:YTDL_WINDOWS_REBUILD_RUNTIME = "1"
$env:YTDL_WINDOWS_ISCC_PATH = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
```

## Validation

After compiling on Windows:

```powershell
npm run verify
Get-FileHash .\Releases\PremiereYouTubeDownloader-vX-Windows-Full-Installer.exe -Algorithm SHA256
```

Install the Full EXE on a Windows Premiere machine, restart Premiere Pro, then open `Window > Extensions > YouTube Downloader`.

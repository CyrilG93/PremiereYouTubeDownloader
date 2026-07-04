# YouTube Downloader for Premiere Pro

Download YouTube videos directly into your Adobe Premiere Pro project.

---

## ✨ Features

- ✅ Download YouTube videos directly into Premiere Pro
- ✅ **Codec Selection**: Choose between H.264 (MP4) or ProRes 422 HQ (MOV)
- ✅ **YouTube Shorts Support**: Download Shorts with their original URLs
- ✅ **Unicode Filenames**: Support for Japanese, Chinese, Korean, and other non-Latin characters
- ✅ **Folder Quick-Select**: 4 preset destination buttons for fast switching
- ✅ Automatic H.264 video codec (Premiere Pro compatible)
- ✅ Maximum and 4K quality use YouTube's best available source, then convert to H.264 when needed
- ✅ Automatic AAC audio conversion (no more silent videos!)
- ✅ Choose output format: MP3, WAV, or FLAC
- ✅ Time range selection (download specific sections)*
- ✅ Auto-import into project bins
- ✅ Relative or absolute path support
- ✅ Multi-language support (English/French)

*> **Note**: Time range downloads are slower than full downloads. If YouTube's section download stalls, the extension now retries by downloading normally and trimming the selected range locally.

---

## 📋 Requirements

This extension needs the following tools installed on your computer:

| Tool | Why is it needed? |
|------|-------------------|
| **Python 3** | Required to run yt-dlp (included in the macOS PKG and Windows EXE) |
| **yt-dlp** | Downloads videos from YouTube (included in the macOS PKG and Windows EXE) |
| **yt-dlp-ejs** | Solves YouTube's JavaScript challenges (installed with yt-dlp) |
| **Deno** | JavaScript runtime for yt-dlp challenge solving (included in the macOS PKG and Windows EXE) |
| **ffmpeg** | Converts video/audio to formats compatible with Premiere Pro (included in the macOS PKG and Windows EXE) |

> [!IMPORTANT]
> **🍪 Authentication Issue? Use Firefox!**
> Chromium browsers (Chrome, Brave, Edge) lock their cookie files when open, preventing the download to start.
> **We strongly recommend using Firefox** and selecting "Firefox" in the extension settings.
> 
> **Make sure you are logged into your YouTube account on Firefox** to avoid "Sign in required" or "403 Forbidden" errors.

---

## 🚀 Installation & Setup

### Windows - Step by Step

**1. Run the EXE installer (recommended)**:
   - Open `PremiereYouTubeDownloader-vX-Windows-Full-Installer.exe`.
   - The installer adds the Premiere extension and a private runtime with Python, yt-dlp, Deno, FFmpeg and FFprobe.
   - No system Python, ffmpeg, or PATH setup is required for the recommended EXE installer.

**2. Legacy BAT installer (advanced)**:
   - Use `INSTALL_WINDOWS.bat` only if you prefer installing dependencies yourself.
   - The legacy BAT can require administrator rights and system PATH configuration.

**3. Start Premiere Pro**
   - Go to **Window** > **Extensions** > **YouTube Downloader**

---

### macOS - Step by Step

**1. Run the PKG installer (recommended)**:
   - Open `PremiereYouTubeDownloader-vX-macOS-Installer-arm64.pkg` or `PremiereYouTubeDownloader-vX-macOS-Installer-x86_64.pkg`, depending on your Mac.
   - The installer adds the Premiere extension and a private runtime with Python, yt-dlp, Deno, FFmpeg and FFprobe.
   - No Homebrew setup is required for the recommended PKG installer.

**2. Legacy shell installer (advanced)**:
   - Use `INSTALL_MACOS.sh` only if you prefer installing dependencies yourself with Homebrew.
   - The shell installer installs the extension for your macOS account and does not request an administrator password.
   - If an older system-wide copy already exists, it is left untouched; CEP uses the newer per-user version.

**3. Start Premiere Pro**
   - Go to **Window** > **Extensions** > **YouTube Downloader**

---

## 🛠️ Tools & Diagnostics

The folder contains several tools to help you if something goes wrong.

| File | What it does | When to use it? |
|------|--------------|-----------------|
| `PremiereYouTubeDownloader-vX-Windows-Full-Installer.exe` | Installs the Windows extension and private runtime in one step. | Recommended Windows installer. |
| `INSTALL_WINDOWS.bat` | Legacy Windows installer using system dependencies. | Advanced/manual installs only. |
| `UPDATE_DEPENDENCIES.bat` | Forces update of all dependencies (yt-dlp, Deno, etc.) to latest versions. | Run regularly to stay up to date. |
| `UPDATE_DEPENDENCIES.sh` | Checks the macOS PKG private runtime, updates yt-dlp/Deno, and refreshes tool paths. | Use if YouTube downloads start failing after installation. |


---

### Option 2: Manual Installation

See [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) for detailed step-by-step instructions.

---

## ✅ How to update Dependencies

### Windows
If you installed with the recommended EXE, install a newer EXE to update the private runtime and extension. If you used the legacy BAT installer, run `UPDATE_DEPENDENCIES.bat` to force-update system dependencies.

### macOS
If you installed with the recommended PKG, run in Terminal:
```bash
./UPDATE_DEPENDENCIES.sh
```

This checks the private runtime installed by the PKG, updates yt-dlp and Deno when possible, verifies FFmpeg/FFprobe, and refreshes the extension config. If Deno cannot check online updates because of a network certificate, the script keeps the installed Deno as long as it still works. If the private FFmpeg runtime is missing or broken, install the latest PKG again.

---

## ⚡ Quick Local Windows Update

To test panel changes without rebuilding the `.exe`, run:

```powershell
npm.cmd run update:local:windows
```

You can also double-click `UPDATE_LOCAL_WINDOWS.bat`. Restart Premiere Pro after the copy.

---

## 🎬 Usage

1. Open Adobe Premiere Pro
2. Go to **Window** → **Extensions** → **YouTube Downloader**
3. Paste a YouTube URL
4. Select format (Video/Audio/Both)
5. Select the quality and delivery codec
6. Click **Download**
7. Video automatically imports into your project!

Click the version badge in the header to open the YouTube Downloader product page.

> [!IMPORTANT]
> **4K downloads take longer to finish.** YouTube commonly provides 1440p and 4K only as VP9 or AV1. When H.264 is selected, the extension first downloads the high-quality source, then FFmpeg re-encodes the complete video to an H.264 file compatible with Premiere Pro. This conversion uses the processor heavily and can take as long as, or longer than, the download itself. Keep Premiere Pro and the extension open until finalization is complete. Converted files use the suffix `[H264]` so Premiere does not confuse them with the temporary YouTube source.

---

## ⚙️ Configuration & Settings


### 🍪 Browser for Cookies
**Essential for avoiding errors!**
- Select the browser you use daily (Chrome, Firefox, Safari, etc.).
- The extension extracts cookies from this browser to authenticate with YouTube.
- **Why?** Solves "HTTP Error 403" and age-restricted video issues.

### 📂 Quick Folders & Depth
Customize where your videos land relative to your Premiere Pro project.

- **Quick Folder Buttons (1, 2, 3)**: Preset names (e.g., "RUSHES", "AUDIO", "GFX") for fast switching.
- **Folder Depth**: Defines where the folder is created relative to your project file (`.prproj`).
  - `0`: Inside the same folder as the project (Default).
  - `1`: One level up (Parent folder).
  - `2`: Two levels up, etc.
  
  *Example with Depth 1:*
  `Project: /User/Start/Project.prproj`
  `Download: /User/RUSHES/video.mp4` (Instead of `/User/Start/RUSHES/...`)

### ⚡ Other Options
- **Default Format**: Choose between "Video + Audio", "Video Only" or "Audio Only" as default.
- **Auto-Import**: Automatically import files into Premiere Pro after download.
- **Create Project Folder**: Creates a bin inside Premiere Pro with the same name as the download folder.

---

## 🔧 Installing ffmpeg on Windows

Manual ffmpeg installation is only needed for the legacy BAT installer. The recommended Windows EXE includes a private FFmpeg runtime.

1. Download from: https://www.gyan.dev/ffmpeg/builds/ (choose "ffmpeg-release-essentials.zip")
2. Extract the ZIP file
3. Copy the `bin` folder contents to `C:\ffmpeg\bin\`
4. Add to system PATH:
   - Press `Win + X` → System → Advanced system settings
   - Click "Environment Variables"
   - Under "System variables", find and select "Path", click "Edit"
   - Click "New" and add: `C:\ffmpeg\bin`
   - Click OK on all windows
5. Restart your terminal/command prompt
6. Verify: `ffmpeg -version`

---

## 🐛 Troubleshooting

### Extension doesn't appear in Premiere Pro

**Windows:**
- Recommended EXE location: `%APPDATA%\Adobe\CEP\extensions\PremiereYouTubeDownloader`
- Legacy BAT location: `C:\Program Files\Common Files\Adobe\CEP\extensions\PremiereYouTubeDownloader`
- Check Registry: `HKEY_CURRENT_USER\Software\Adobe\CSXS.11` should have `PlayerDebugMode` = `1`

**macOS:**
- Verify installation location: `~/Library/Application Support/Adobe/CEP/extensions/PremiereYouTubeDownloader`
- Run: `defaults read com.adobe.CSXS.11 PlayerDebugMode` (should return `1`)

### "yt-dlp not found" error

```bash
# Windows
pip install --upgrade yt-dlp

# macOS
pip3 install --upgrade yt-dlp
```

### "ffmpeg not found" error

**Windows:** Follow the "Installing ffmpeg on Windows" section above

**macOS:**
```bash
brew install ffmpeg
```

### Download fails with "n challenge solving failed"

This error means yt-dlp can't solve YouTube's JavaScript challenges. Fix:

1. Install Deno: Run the installer again, or manually install from https://deno.land/
2. Update yt-dlp with EJS support:
   ```bash
   pip install --upgrade "yt-dlp[default]"
   ```
3. If auto-detection fails, configure custom paths in **Settings → Advanced Tools**

### Download fails or no audio

- Verify ffmpeg is installed: `ffmpeg -version`
- Update yt-dlp: `pip install --upgrade "yt-dlp[default]"`
- Check the logs in the extension (click "Logs" button)

### Tools not found (custom paths)

If the extension can't find yt-dlp, ffmpeg, or deno:
1. Open the extension in Premiere Pro
2. Click the **Settings** (⚙️) button
3. Scroll to **Advanced Tools** section
4. Enter the full path to each executable
5. Click **Save**

---

## 📝 Changelog

### Version 2.7.17 - 2026-07-02
- **UX**: Time range downloads now show a clearer preparation message while YouTube/FFmpeg is getting the selected section ready.

### Version 2.7.16 - 2026-07-02
- **Fix**: Time range downloads now stop before downloading when the selected range is outside the source video duration.

### Version 2.7.15 - 2026-07-02
- **Fix**: Time range downloads now detect stalls and retry with a local trim fallback instead of staying stuck without progress.

### Version 2.7.14 - 2026-06-25
- **Fix**: The macOS PKG runtime now launches yt-dlp through its bundled Python, preventing installation failures caused by a non-portable yt-dlp launcher.

### Version 2.7.13 - 2026-06-19
- **Fix**: Standard HD downloads now prefer native MP4/H.264 + M4A when available, avoiding unnecessary FFmpeg conversion. Higher-than-1080p sources still use the conversion path when needed.

### Version 2.7.12 - 2026-06-19
- **Fix**: Windows downloads now merge VP9/Opus sources into a safe intermediate file before converting to Premiere-friendly H.264, preventing failures at the final merge step.
- **Fix**: Windows installer validation no longer reports a false FFprobe failure after FFprobe prints its version.

### Version 2.7.11 - 2026-06-19
- **Fix**: Windows private runtime now launches yt-dlp through its bundled Python, preventing installer and download failures caused by a broken `yt-dlp.exe` launcher.

### Version 2.7.10 - 2026-06-19
- **Fix**: Windows downloads now retry automatically without browser cookies when cookie extraction fails immediately, avoiding silent `yt-dlp` code 1 errors on clean machines.

### Version 2.7.9 - 2026-06-18
- **Fix**: Windows EXE installs now detect the private runtime automatically when `config.json` is missing, preventing `spawn yt-dlp ENOENT` on clean machines.

### Version 2.7.8 - 2026-06-18
- **Windows installer**: Added the base for an Inno Setup `.exe` installer with a private Python, yt-dlp, Deno, FFmpeg and FFprobe runtime.

### Version 2.7.7 - 2026-06-18
- **macOS maintenance**: Deno update failures caused by network certificates are now reported as warnings when the installed Deno runtime is still usable.

### Version 2.7.6 - 2026-06-18
- **macOS maintenance**: `UPDATE_DEPENDENCIES.sh` now checks the private PKG runtime, updates yt-dlp and Deno, verifies FFmpeg/FFprobe, and refreshes the extension tool paths.

### Version 2.7.5 - 2026-06-18
- **macOS installer**: Added a one-step PKG installer with a private Python, yt-dlp, Deno, FFmpeg and FFprobe runtime.
- **Premiere compatibility**: The H.264 conversion can now fall back to the macOS video encoder when the bundled FFmpeg does not include `libx264`.
- **Fix**: The installed panel now displays the correct app version.
- **Fix**: H.264 and ProRes downloads now avoid AV1 sources when using the private macOS runtime, preventing conversion failures on Macs without AV1 hardware decoding.
- **Fix**: Temporary `[H264].converting.mp4` files are ignored when the extension searches for the completed download.

### Version 2.7.3 - 2026-06-09
- **4K downloads**: Maximum quality now retrieves the best available YouTube source, including 1440p and 4K.
- **Premiere compatibility**: High-resolution VP9/AV1 sources are converted to H.264 when requested and imported under a distinct `[H264]` filename to avoid audio-only cache issues.
- **macOS installation**: The installer now installs for the current user without `sudo` or an administrator password.

### Version 2.7.0
- **UI**: Reworked "Qualité et Codec" controls with dropdown selectors for video quality, codec, and audio format.
- **New**: Added estimated download size preview before launching downloads.
- **UX**: Logs section is more compact when collapsed and logs toggle is fully translated.
- **i18n**: Added new languages (ES, DE, PT-BR, JA, IT, ZH-CN, RU) and sorted language selector alphabetically.
- **UI**: App version moved to the main header; update banner now shows the available version number.
- **Settings**: Cookie browser label now highlights `Firefox (recommended)`.

### Version 2.6.2
- **Fix**: ProRes 422 conversion now correctly reuses the resolved ffmpeg path and no longer falls back to importing the original MP4 after a scope error.
- **Fix**: macOS installer now runs `pip`/`brew` dependency operations as the invoking user (not root), removing common warnings and avoiding Homebrew root errors.
- **Fix**: Installer dependency status output is now more accurate when updates fail (non-blocking info instead of misleading "latest").

### Version 2.6.1
- **Fix**: Installers now properly force-upgrade yt-dlp and Deno to latest versions (was silently skipping updates).
- **Fix**: Removed `--quiet` flag from pip upgrade to show progress and errors.
- **New**: `UPDATE_DEPENDENCIES` scripts replace `CHECK_DEPENDENCIES` — force-update all tools with before/after version display.
- **UI**: Installers now show `[UPDATED] old → new` or `[OK] latest` for each dependency.

### Version 2.5.8
- **Fix**: Time range now supports HH:MM:SS format for videos over 1 hour (was MM:SS before).
- **Fix**: Fixed corrupted files when downloading time ranges from long videos (removed redundant ffmpeg trim).
- **UI**: ffmpeg progress logs no longer appear in red (was misleading as errors).

> **Note**: Time range downloads are slower than full downloads. This is a YouTube limitation—the video must be streamed and processed in near real-time rather than downloaded directly.

### Version 2.5.7
- **UX**: Removed button texture (Cleaner look).
- **UX**: Absolute path buttons now only show the folder name (Basename) instead of the full path.
- **Settings**: Added "Browse" buttons for Quick Folders.
- **Fix**: Corrected missing translations in Settings.

### Version 2.5.6
- **Fix**: Improved cross-platform robustness for Absolute vs Relative path detection (better handling of mixed separators).

### Version 2.5.5
- **UX**: Added subtle texture to Quick Folders that are in Relative mode (vs Solid for Absolute).
- **UX**: Minor visual refinements.

### Version 2.5.4
- **Feature**: "Quick Folders" now support Absolute paths (Smart Detection).
- **UX**: Renamed buttons to "Quick Folder X" / "Dossier Rapide X".
- **UX**: Clarified that empty Custom folder defaults to Downloads.

### Version 2.5.3
- **Feature**: Auto-detection of Absolute vs Relative paths in Custom Folder (removed manual buttons).
- **Hotfix**: Fixed Windows Installer closing instantly.

### Version 2.5.2
- **Fixed**: Browser cookie selection was not being saved or applied (always defaulted to Firefox).
- **Fixed**: "Import failed" error message appearing even when import was successful.
- **Improved**: Safer validaton of active sequence after import.
- **Fixed**: Removed development config file that caused path issues on Windows.

### Version 2.5.1
- **Improved**: Safer validaton of active sequence after import.
- **Fixed**: Removed development config file that caused path issues on Windows.

### Version 2.5.0 (Huge Update!) 🚀
- **Quick Folders 2.0**:
  - **Folder Depth**: New setting to choose where downloads go relative to your project (0 = Project folder, 1 = Parent folder, etc.).
  - **Smart Defaults**: "Custom" slot is now the default.
  - **Auto Fallback**: If no custom path is set, downloads go to your OS Downloads folder.
  - **Simplified Paths**: No more complex `./` or `../` prefixes needed!
- **Unified Installers**:
  - `INSTALL_WINDOWS.bat` and `INSTALL_MACOS.sh` now do **everything**: installation AND configuration in one go.
- **Multi-Browser Cookies**:
  - Select your preferred browser for cookie extraction (Chrome, Brave, Edge, Opera, Safari, Firefox).
  - Fixes HTTP 403 errors even more reliably.
- **UI Improvements**:
  - More compact interface to save screen space.
  - Smoother animations and better spacing.

### Version 2.4.4
- **Multi-Browser Support**: Added cookie browser selection to resolve SABR/403 errors.
- **Installer Fixes**: Better permission handling on macOS.

### Version 2.4.3
- **Auto-Config**: Added configuration tools to simpler setup.

### Version 2.4.2
- ✅ **Fixed HTTP Error 403**: Updated yt-dlp dependencies to resolve YouTube access issues
- ✅ **macOS Environment Fix**: Fixed an issue where Deno was not found by the extension on macOS
- ✅ **Dependency Update**: Enforced latest yt-dlp version with EJS support

### Version 2.4.0
- ✅ **Codec Selection**: Choose between H.264 (MP4) or ProRes 422 HQ (MOV)
- ✅ **YouTube Shorts Support**: Download videos from youtube.com/shorts/ URLs
- ✅ **Unicode Filename Support**: Japanese, Chinese, Korean, and other non-Latin characters preserved in filenames
- ✅ Codec section auto-disables when Audio Only is selected

### Version 2.3
- ✅ Custom tool paths in Settings: Configure yt-dlp, ffmpeg, and deno paths manually
- ✅ Auto-detection of tools in common installation locations
- ✅ Installer now installs Deno automatically
- ✅ Installer now installs yt-dlp with EJS support for YouTube compatibility
- ✅ Better error messages when tools are not found

### Version 2.2
- ✅ Multi-language support (English/French)
- ✅ Folder Quick-Select Buttons: 4 destination buttons
- ✅ 3 customizable preset folders in settings

### Version 2.1
- ✅ Fixed MP4 file detection and import
- ✅ Excluded VP9 codec (only H.264 downloaded)
- ✅ Added automatic AAC audio conversion

---

## 📄 Files

| File | Description |
|------|-------------|
| `INSTALL_WINDOWS.bat` | Automated installer for Windows (run as admin) |
| `INSTALL_MACOS.sh` | Automated per-user installer for macOS (no sudo required) |
| `UPDATE_DEPENDENCIES.bat` | Force-update all dependencies (Windows) |
| `UPDATE_DEPENDENCIES.sh` | Force-update all dependencies (macOS) |
| `INSTALLATION_GUIDE.md` | Detailed manual installation instructions |
| `client/` | Extension UI and logic |
| `host/` | Premiere Pro integration (ExtendScript) |
| `CSXS/` | Extension manifest |

---

## 🙏 Credits

- Built for Adobe Premiere Pro CEP
- Uses [yt-dlp](https://github.com/yt-dlp/yt-dlp) for downloading
- Uses [ffmpeg](https://ffmpeg.org/) for media processing
- Powered by Node.js

---

**Enjoy downloading YouTube videos directly into Premiere Pro! 🎥✨**


# YouTube Downloader for Premiere Pro

Download YouTube videos directly into your Adobe Premiere Pro project.

---

## 📋 Requirements

This extension needs the following tools installed on your computer:

| Tool | Why is it needed? |
|------|-------------------|
| **Node.js** | Required by Adobe CEP to run the extension's JavaScript code |
| **Python 3** | Required to run yt-dlp (the YouTube download tool) |
| **yt-dlp** | Downloads videos from YouTube (installed via Python pip) |
| **yt-dlp-ejs** | Solves YouTube's JavaScript challenges (installed with yt-dlp) |
| **Deno** | JavaScript runtime for yt-dlp challenge solving |
| **ffmpeg** | Converts video/audio to formats compatible with Premiere Pro |

> [!IMPORTANT]
> **🍪 Authentication Issue? Use Firefox!**
> Chromium browsers (Chrome, Brave, Edge) lock their cookie files when open, preventing the download to start.
> **We strongly recommend using Firefox** and selecting "Firefox" in the extension settings.
> 
> **Make sure you are logged into your YouTube account on Firefox** to avoid "Sign in required" or "403 Forbidden" errors.

---

## 🚀 Installation & Setup

### Windows - Step by Step

**1. Install Prerequisites** (Use default settings for all):
   - [Download Node.js](https://nodejs.org/)
   - [Download Python](https://www.python.org/downloads/) → **⚠️ Check "Add Python to PATH" during install**
   - [Download ffmpeg](https://www.gyan.dev/ffmpeg/builds/) (See details below if needed)

**2. Install the Extension**:
   - Right-click `INSTALL_WINDOWS.bat` -> Select **Run as administrator**
   - The script will install the extension AND automatically configure all tools.
   - Wait for "Installation Complete" message.

**3. Start Premiere Pro**
   - Go to **Window** > **Extensions** > **YouTube Downloader**

---

### macOS - Step by Step

**1. Install Prerequisites**:
   Open Terminal and copy-paste this command to install everything at once (requires Homebrew):
   ```bash
   brew install node python ffmpeg deno yt-dlp
   ```

**2. Install the Extension**:
   Open Terminal, navigate to the folder and run:
   ```bash
   sudo ./INSTALL_MACOS.sh
   ```
   - The script will install the extension AND automatically configure all tools.

**3. Start Premiere Pro**
   - Go to **Window** > **Extensions** > **YouTube Downloader**

**4. Start Premiere Pro**
   - Go to **Window** > **Extensions** > **YouTube Downloader**

---

## 🛠️ Tools & Diagnostics

The folder contains several tools to help you if something goes wrong.

| File | What it does | When to use it? |
|------|--------------|-----------------|
| `INSTALL_WINDOWS.bat` | Installs the extension, configures paths, and sets debug mode. | **Run me first!** |
| `UPDATE_DEPENDENCIES.bat` | Forces update of all dependencies (yt-dlp, Deno, etc.) to latest versions. | Run regularly to stay up to date. |


---

### Option 2: Manual Installation

See [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) for detailed step-by-step instructions.

---

## ✅ How to update Dependencies

### Windows
Run `UPDATE_DEPENDENCIES.bat` to force-update all dependencies to the latest versions.

### macOS
Run in Terminal:
```bash
./UPDATE_DEPENDENCIES.sh
```

---

## 🎬 Usage

1. Open Adobe Premiere Pro
2. Go to **Window** → **Extensions** → **YouTube Downloader**
3. Paste a YouTube URL
4. Select format (Video/Audio/Both)
5. Click **Download**
6. Video automatically imports into your project!

---

## ✨ Features

- ✅ Download YouTube videos directly into Premiere Pro
- ✅ **Codec Selection**: Choose between H.264 (MP4) or ProRes 422 HQ (MOV)
- ✅ **YouTube Shorts Support**: Download Shorts with their original URLs
- ✅ **Unicode Filenames**: Support for Japanese, Chinese, Korean, and other non-Latin characters
- ✅ **Folder Quick-Select**: 4 preset destination buttons for fast switching
- ✅ Automatic H.264 video codec (Premiere Pro compatible)
- ✅ Automatic AAC audio conversion (no more silent videos!)
- ✅ Choose output format: MP3, WAV, or FLAC
- ✅ Time range selection (download specific sections)*
- ✅ Auto-import into project bins
- ✅ Relative or absolute path support
- ✅ Multi-language support (English/French)

*> **Note**: Time range downloads are slower than full downloads. This is a YouTube limitation—the video must be streamed and processed in near real-time rather than downloaded directly.
---

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

ffmpeg requires manual installation on Windows:

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
- Verify installation location: `C:\Program Files\Common Files\Adobe\CEP\extensions\PremiereYouTubeDownloader`
- Check Registry: `HKEY_CURRENT_USER\Software\Adobe\CSXS.11` should have `PlayerDebugMode` = `1`

**macOS:**
- Verify installation location: `/Library/Application Support/Adobe/CEP/extensions/PremiereYouTubeDownloader`
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

## 📝 Recent Updates

### Version 2.6.1 (Current)
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



### Version 2.5.0 (Huge Update!) 🚀
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
| `INSTALL_MACOS.sh` | Automated installer for macOS (run with sudo) |
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

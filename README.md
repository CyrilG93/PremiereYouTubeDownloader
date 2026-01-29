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

---

## 🚀 Installation

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
| `CHECK_DEPENDENCIES.bat` | Just checks if tools are present. Useful for diagnosis. | Use if something is wrong. |


---

### Option 2: Manual Installation

See [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) for detailed step-by-step instructions.

---

## ✅ Verify Installation

### Windows
Run `CHECK_DEPENDENCIES.bat` to verify all dependencies are installed.

### macOS
Run in Terminal:
```bash
./CHECK_DEPENDENCIES.sh
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
- ✅ Time range selection (download specific sections)
- ✅ Auto-import into project bins
- ✅ Relative or absolute path support
- ✅ Multi-language support (English/French)

---

---

## ⚙️ Configuration & Settings

Click the **Settings** (⚙️) button to customize the extension:

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

### Version 2.5.2 (Current)
- **Fixed**: Browser cookie selection was not being saved or applied (always defaulted to Firefox).
- **Fixed**: "Import failed" error message appearing even when import was successful.
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
| `CHECK_DEPENDENCIES.bat` | Verify dependencies (Windows) |
| `CHECK_DEPENDENCIES.sh` | Verify dependencies (macOS) |
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

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

### Option 1: Automated Installation (Recommended)

The installer scripts will:
- ✅ Check if Node.js is installed (you must install it manually if missing)
- ✅ Check if Python is installed (you must install it manually if missing)
- ✅ Install yt-dlp with EJS support automatically via pip
- ✅ Install Deno automatically (for YouTube n-challenge solving)
- ✅ Check if ffmpeg is installed (you must install it manually if missing)
- ✅ Copy extension files to the correct Adobe folder
- ✅ Enable CEP debug mode (required for unsigned extensions)

#### Windows

1. **First install prerequisites** (if not already installed):
   - [Download Node.js](https://nodejs.org/) → Install with default options
   - [Download Python](https://www.python.org/downloads/) → **⚠️ Check "Add Python to PATH"**
   - [Download ffmpeg](https://www.gyan.dev/ffmpeg/builds/) → See "Installing ffmpeg on Windows" below

2. **Run the installer**:
   - Right-click `INSTALL_WINDOWS.bat` → **Run as administrator**
   - Follow on-screen instructions

3. **Restart Premiere Pro**

#### macOS

1. **First install prerequisites** (if not already installed):
   ```bash
   # Install Homebrew (if not installed)
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # Install all dependencies at once
   brew install node python ffmpeg
   ```

2. **Run the installer**:
   ```bash
   cd /path/to/PremiereYouTubeDownloader
   sudo ./INSTALL_MACOS.sh
   ```

3. **Restart Premiere Pro**

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

### Version 2.4.1 (Latest)
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

# YouTube Downloader for Premiere Pro - Installation Guide

This guide provides detailed step-by-step installation instructions for beginners.

---

## 📋 What You Need to Install

### Installation Summary

| Step | Tool | Windows | macOS PKG | Legacy scripts |
|------|------|---------|-------|---------------------|
| 1 | Python | Manual | Included | Manual on macOS |
| 2 | yt-dlp | Automatic | Included | Automatic |
| 3 | Deno | Automatic | Included | Automatic |
| 4 | ffmpeg / ffprobe | Manual or configured path | Included | Manual on macOS |
| 5 | Extension | Automatic | Included | Automatic |

> [!IMPORTANT]
> On macOS, use the `.pkg` installer when available. It installs the extension and the private runtime in one step, without asking you to install Homebrew first.

---

## 🪟 Windows Installation

### Step 1: Install Node.js

1. Download Node.js from: https://nodejs.org/
   - Choose the **LTS** version (recommended)
2. Run the installer
3. Follow the default installation options
4. Verify installation by opening Command Prompt and typing:
   ```cmd
   node --version
   ```
   You should see something like `v20.x.x`

### Step 2: Install Python

1. Download Python from: https://www.python.org/downloads/
   - Choose the latest Python 3.x version
2. Run the installer
3. **⚠️ IMPORTANT**: Check the box **"Add Python to PATH"** at the bottom of the first screen!
4. Click "Install Now"
5. Verify installation:
   ```cmd
   python --version
   pip --version
   ```
   You should see version numbers for both commands

> [!CAUTION]
> If you forget to check "Add Python to PATH", you'll need to uninstall and reinstall Python, or manually add it to PATH.

### Step 3: Run the Installer (Automatic)

1. Download or extract the PremiereYouTubeDownloader folder
2. Right-click on `INSTALL_WINDOWS.bat`
3. Select **"Run as administrator"**
4. Wait for the script to complete
5. The script will:
   - ✅ Verify Node.js and Python
   - ✅ Auto-install yt-dlp via pip
   - ✅ Auto-configure ffmpeg paths
   - ✅ Copy extension files to Adobe CEP folder
   - ✅ Generate personalized configuration
   - ✅ Enable debug mode in registry

### Step 4: Start Using

1. **Restart Premiere Pro** completely (close and reopen)
2. Go to **Window** → **Extensions** → **YouTube Downloader**
3. Done! 🎉

---

## 🍎 macOS Installation

### Recommended: Run the PKG Installer

1. On an Apple Silicon Mac, download `PremiereYouTubeDownloader-vX-macOS-Installer-arm64.pkg`.
   Intel Macs are not supported by the public installer.
2. Double-click the `.pkg` file and follow the installer.
3. The installer will:
   - ✅ Install the extension in your Adobe CEP extensions folder
   - ✅ Install a private Python runtime
   - ✅ Install yt-dlp with YouTube challenge support
   - ✅ Install Deno
   - ✅ Install FFmpeg and FFprobe
   - ✅ Generate the extension configuration automatically
   - ✅ Enable CEP debug mode

### Advanced: Legacy Shell Installer

Use `INSTALL_MACOS.sh` only if you prefer managing dependencies yourself with Homebrew.

1. Install Homebrew and the needed tools:
   ```bash
   brew install python ffmpeg deno yt-dlp
   ```
2. Open Terminal and run:
   ```bash
   cd /path/to/PremiereYouTubeDownloader
   ./INSTALL_MACOS.sh
   ```
3. The script installs the extension for your macOS account and leaves any older system-wide copy untouched.

### Step 4: Start Using

1. **Restart Premiere Pro** completely (close and reopen)
2. Go to **Window** → **Extensions** → **YouTube Downloader**
3. Done! 🎉

---

## ✅ Update Your Dependencies

To force-update all dependencies (yt-dlp, Deno, ffmpeg) to the latest versions:

### Windows
Run `UPDATE_DEPENDENCIES.bat` by double-clicking it.

### macOS
If you installed with the `.pkg`, install a newer `.pkg` to update both the extension and its private runtime.

If you used the legacy shell installer:
```bash
./UPDATE_DEPENDENCIES.sh
```

Expected output (all should show [OK]):
```
[1/4] Checking Node.js...
  [OK] Node.js: v20.x.x
[2/4] Checking Python...
  [OK] Python: 3.x.x
[3/4] Checking yt-dlp...
  [OK] yt-dlp: 2024.x.x
[4/4] Checking ffmpeg...
  [OK] ffmpeg is installed
```

---

## 🔧 Troubleshooting

### Extension doesn't appear in Premiere Pro menu

**Check debug mode is enabled:**

Windows:
1. Open Registry Editor (Win + R, type `regedit`)
2. Navigate to: `HKEY_CURRENT_USER\Software\Adobe\CSXS.11`
3. Look for `PlayerDebugMode` with value `1`

macOS:
```bash
defaults read com.adobe.CSXS.11 PlayerDebugMode
# Should return: 1
```

### "python" or "pip" not found (Windows)

Python was not added to PATH. Either:
1. Reinstall Python and check "Add Python to PATH"
2. Or manually add Python to PATH environment variables.

### Download works but no audio in Premiere Pro

This is fixed in v2.5.0+. The extension automatically converts audio to AAC format for Premiere.
If you still have issues:
1. Update yt-dlp: `pip install --upgrade yt-dlp`
2. Verify ffmpeg is working: `ffmpeg -version`

---

## 📦 System Requirements

| | Windows | macOS |
|---|---------|-------|
| **OS** | Windows 10/11 (64-bit) | macOS 12 or later on Apple Silicon |
| **Premiere Pro** | 2025 (v25) or later | 2025 (v25) or later |
| **Disk Space** | ~500 MB | ~500 MB |
| **Internet** | Required | Required |

---

## 📞 Support

If you encounter issues:
1. Check the logs in the extension (click the "Logs" button)
2. Run `UPDATE_DEPENDENCIES` to ensure all tools are up to date
3. Check `config.json` is not overriding your settings incorrectly.

---

## 📄 License & Credits

- Extension created for Adobe Premiere Pro CEP
- Uses [yt-dlp](https://github.com/yt-dlp/yt-dlp) for downloading
- Uses [ffmpeg](https://ffmpeg.org/) for media processing
- Node.js for extension runtime

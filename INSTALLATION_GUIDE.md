# YouTube Downloader for Premiere Pro - Installation Guide

This guide provides detailed step-by-step installation instructions for beginners.

---

## 📋 What You Need to Install

### Installation Summary

| Step | Tool | Windows | macOS | Installed by script? |
|------|------|---------|-------|---------------------|
| 1 | Node.js | Manual | Manual (Homebrew) | ❌ No |
| 2 | Python | Manual | Manual (Homebrew) | ❌ No |
| 3 | yt-dlp | Automatic | Automatic | ✅ Yes |
| 4 | ffmpeg | Manual | Manual (Homebrew) | ❌ No |
| 5 | Extension | Automatic | Automatic | ✅ Yes |

> [!IMPORTANT]
> The installation scripts (`INSTALL_WINDOWS.bat` / `INSTALL_MACOS.sh`) will install **yt-dlp** and **the extension** automatically.
> However, you must install **Node.js**, **Python**, and **ffmpeg** manually BEFORE running the script.

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

### Step 3: Install ffmpeg

1. Download ffmpeg from: https://www.gyan.dev/ffmpeg/builds/
   - Click on **ffmpeg-release-essentials.zip**
2. Extract the ZIP file (right-click → Extract All)
3. Inside the extracted folder, find the `bin` folder
4. Create the folder `C:\ffmpeg\bin\`
5. Copy these 3 files from the extracted bin folder to `C:\ffmpeg\bin\`:
   - `ffmpeg.exe`
   - `ffprobe.exe`
   - `ffplay.exe`
6. Add to system PATH:
   - Press `Win + X` → Select "System"
   - Click "Advanced system settings" on the right
   - Click "Environment Variables" at the bottom
   - Under "System variables", find "Path" and click "Edit"
   - Click "New" and add: `C:\ffmpeg\bin`
   - Click OK on all windows
7. **Close and reopen** Command Prompt
8. Verify installation:
   ```cmd
   ffmpeg -version
   ```

### Step 4: Run the Installer

1. Download or extract the PremiereYouTubeDownloader folder
2. Right-click on `INSTALL_WINDOWS.bat`
3. Select **"Run as administrator"**
4. Wait for the script to complete
5. The script will:
   - ✅ Verify Node.js is installed
   - ✅ Verify Python is installed
   - ✅ Install yt-dlp via pip
   - ✅ Check ffmpeg is installed
   - ✅ Copy extension files to Adobe CEP folder
   - ✅ Enable debug mode in registry

### Step 5: Start Using

1. **Restart Premiere Pro** completely (close and reopen)
2. Go to **Window** → **Extensions** → **YouTube Downloader**
3. Done! 🎉

---

## 🍎 macOS Installation

### Step 1: Install Homebrew (Package Manager)

Homebrew makes installing all the other tools very easy.

1. Open Terminal (Applications → Utilities → Terminal)
2. Paste this command and press Enter:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
3. Follow the on-screen instructions
4. **Important**: After installation, Homebrew will show you commands to add to your PATH. Run them!

For Apple Silicon Macs (M1/M2/M3), you typically need to run:
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Verify Homebrew is installed:
```bash
brew --version
```

### Step 2: Install Node.js, Python, and ffmpeg

With Homebrew, you can install everything at once:

```bash
brew install node python ffmpeg
```

This will install all three tools. Wait for completion.

Verify installations:
```bash
node --version
python3 --version
ffmpeg -version
```

### Step 3: Run the Installer

1. Open Terminal
2. Navigate to the PremiereYouTubeDownloader folder:
   ```bash
   cd /path/to/PremiereYouTubeDownloader
   ```
   (Tip: drag the folder into Terminal to auto-fill the path)
3. Run the installer with sudo:
   ```bash
   sudo ./INSTALL_MACOS.sh
   ```
4. Enter your password when prompted
5. The script will:
   - ✅ Verify Node.js is installed
   - ✅ Verify Python is installed
   - ✅ Install/update yt-dlp via pip
   - ✅ Check ffmpeg is installed
   - ✅ Copy extension files to Adobe CEP folder
   - ✅ Enable debug mode for CEP

### Step 4: Start Using

1. **Restart Premiere Pro** completely (close and reopen)
2. Go to **Window** → **Extensions** → **YouTube Downloader**
3. Done! 🎉

---

## ✅ Verify Your Installation

### Windows
Run `CHECK_DEPENDENCIES.bat` by double-clicking it.

### macOS
```bash
./CHECK_DEPENDENCIES.sh
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

**Check the extension is installed:**

Windows:
```
C:\Program Files\Common Files\Adobe\CEP\extensions\PremiereYouTubeDownloader
```

macOS:
```
/Library/Application Support/Adobe/CEP/extensions/PremiereYouTubeDownloader
```

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
2. Or manually add Python to PATH:
   - Find where Python is installed (usually `C:\Users\[YourName]\AppData\Local\Programs\Python\Python3x`)
   - Add both the Python folder and the Scripts subfolder to PATH

### "yt-dlp" not found

Install it manually:
```bash
# Windows
pip install yt-dlp

# macOS
pip3 install yt-dlp
```

### "ffmpeg" not found

Windows: Follow the ffmpeg installation steps in this guide (Step 3 in Windows section)

macOS:
```bash
brew install ffmpeg
```

### Download works but no audio in Premiere Pro

This is fixed in the latest version. The extension automatically converts audio to AAC format.
If you still have issues:
1. Update yt-dlp: `pip install --upgrade yt-dlp`
2. Verify ffmpeg is working: `ffmpeg -version`

---

## 📦 System Requirements

| | Windows | macOS |
|---|---------|-------|
| **OS** | Windows 10/11 (64-bit) | macOS 10.14 or later |
| **Premiere Pro** | 2020 (v14) or later | 2020 (v14) or later |
| **Disk Space** | ~500 MB | ~500 MB |
| **Internet** | Required for downloads | Required for downloads |

---

## 📞 Support

If you encounter issues:
1. Check the logs in the extension (click the "Logs" button)
2. Run the dependency checker script
3. Follow the troubleshooting steps above
4. Make sure all dependencies are up to date

---

## 📄 License & Credits

- Extension created for Adobe Premiere Pro CEP
- Uses [yt-dlp](https://github.com/yt-dlp/yt-dlp) for downloading
- Uses [ffmpeg](https://ffmpeg.org/) for media processing
- Node.js for extension runtime

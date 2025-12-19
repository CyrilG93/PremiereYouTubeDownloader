# YouTube Downloader for Premiere Pro - Installation Guide

## 🚀 Quick Installation (Recommended)

### Option 1: Automated Installer

1. **Right-click** on `INSTALL.bat`
2. Select **"Run as administrator"**
3. Follow the on-screen instructions
4. Restart Adobe Premiere Pro

The installer will automatically:
- ✅ Install Node.js (if not present)
- ✅ Install Python 3.11 (if not present)
- ✅ Install yt-dlp
- ✅ Install ffmpeg
- ✅ Copy extension files to the correct location

---

## 📋 Manual Installation

If the automated installer doesn't work, follow these steps:

### Step 1: Install Node.js

1. Download Node.js from: https://nodejs.org/
2. Run the installer
3. Verify installation:
   ```cmd
   node --version
   ```

### Step 2: Install Python

1. Download Python 3.11 from: https://www.python.org/downloads/
2. **IMPORTANT**: Check "Add Python to PATH" during installation
3. Verify installation:
   ```cmd
   python --version
   ```

### Step 3: Install yt-dlp

Open Command Prompt as Administrator and run:
```cmd
pip install yt-dlp
```

Verify installation:
```cmd
yt-dlp --version
```

### Step 4: Install ffmpeg

1. Download ffmpeg from: https://www.gyan.dev/ffmpeg/builds/
2. Extract the ZIP file
3. Copy the `bin` folder contents to `C:\ffmpeg\bin\`
4. Add `C:\ffmpeg\bin` to your system PATH:
   - Right-click "This PC" → Properties
   - Advanced system settings → Environment Variables
   - Edit "Path" under System variables
   - Add new entry: `C:\ffmpeg\bin`

Verify installation:
```cmd
ffmpeg -version
```

### Step 5: Install the Extension

1. Copy the entire `PremiereYouTubeDownloader` folder to:
   ```
   C:\Program Files\Common Files\Adobe\CEP\extensions\
   ```

2. Restart Adobe Premiere Pro

3. Access the extension:
   - Go to **Window** → **Extensions** → **YouTube Downloader**

---

## 🔧 Troubleshooting

### Extension doesn't appear in Premiere Pro

1. Check that the extension is in the correct folder:
   ```
   C:\Program Files\Common Files\Adobe\CEP\extensions\PremiereYouTubeDownloader
   ```

2. Enable unsigned extensions (for development):
   - Open Registry Editor (regedit)
   - Navigate to: `HKEY_CURRENT_USER\Software\Adobe\CSXS.11`
   - Create a new String value named `PlayerDebugMode` with value `1`
   - Restart Premiere Pro

### "yt-dlp not found" error

Reinstall yt-dlp:
```cmd
pip install --upgrade yt-dlp
```

### "ffmpeg not found" error

1. Verify ffmpeg is in PATH:
   ```cmd
   where ffmpeg
   ```

2. If not found, add `C:\ffmpeg\bin` to system PATH (see Step 4 above)

### "format vp9 n'est pas compatible" error

This should be fixed in the latest version. If you still see this:
1. Make sure you're using the latest version of the extension
2. Verify ffmpeg is installed correctly
3. Try downloading a different video

### Audio not working in Premiere Pro

This should be fixed in the latest version (AAC audio conversion). If you still have issues:
1. Check that ffmpeg is installed
2. Try re-downloading the video
3. Check the logs in the extension for errors

---

## 📦 System Requirements

- **OS**: Windows 10/11 (64-bit)
- **Adobe Premiere Pro**: 2020 or later
- **Disk Space**: ~500MB for all dependencies
- **Internet**: Required for downloading videos

---

## 🆕 What's New in This Version

### Fixed Issues:
- ✅ MP4 files now correctly detected and imported
- ✅ VP9 codec videos excluded (only H.264 downloaded)
- ✅ Audio codec converted to AAC for Premiere Pro compatibility
- ✅ Improved logging for debugging

### Technical Details:
- Videos are downloaded in H.264 codec (VP9 excluded)
- Audio is automatically converted to AAC 192kbps
- All files are MP4 format for maximum compatibility

---

## 📞 Support

For issues or questions:
1. Check the logs in the extension (click "Logs" button)
2. Verify all dependencies are installed correctly
3. Try the troubleshooting steps above

---

## 📄 License & Credits

- Extension created for Adobe Premiere Pro
- Uses yt-dlp for downloading
- Uses ffmpeg for media processing
- Node.js for extension runtime

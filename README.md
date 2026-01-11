# YouTube Downloader for Premiere Pro

## 📥 Quick Start

### Installation

**Option 1: Automated (Recommended)**
1. Right-click `INSTALL.bat` → Run as administrator
2. Follow on-screen instructions
3. Restart Premiere Pro

**Option 2: Manual**
See [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) for detailed instructions

### Verify Installation
Run `CHECK_DEPENDENCIES.bat` to verify all dependencies are installed

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
- ✅ **Folder Quick-Select**: 4 preset destination buttons for fast switching
- ✅ Automatic H.264 video codec (Premiere Pro compatible)
- ✅ Automatic AAC audio conversion (no more silent videos!)
- ✅ Choose output format: MP3, WAV, or FLAC
- ✅ Time range selection (download specific sections)
- ✅ Auto-import into project bins
- ✅ Relative or absolute path support

---

## 🔧 Requirements

- Windows 10/11 (64-bit)
- Adobe Premiere Pro 2020 or later
- Node.js
- Python 3.11+
- yt-dlp
- ffmpeg

All dependencies can be installed automatically with `INSTALL.bat`

---

## 🐛 Troubleshooting

### Common Issues

**Extension doesn't appear**
- Verify installation location: `C:\Program Files\Common Files\Adobe\CEP\extensions\PremiereYouTubeDownloader`
- Enable debug mode (see INSTALLATION_GUIDE.md)
- Restart Premiere Pro

**Download fails**
- Run `CHECK_DEPENDENCIES.bat` to verify all dependencies
- Check the logs (click "Logs" button in extension)
- Ensure you have internet connection

**No audio in Premiere Pro**
- ✅ Fixed in latest version (automatic AAC conversion)
- Verify ffmpeg is installed: `ffmpeg -version`

**VP9 codec error**
- ✅ Fixed in latest version (VP9 excluded, H.264 only)
- Update yt-dlp: `pip install --upgrade yt-dlp`

For more troubleshooting, see [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)

---

## 📝 Recent Updates

### Version 2.2 (Latest)
- ✅ **Folder Quick-Select Buttons**: 4 destination buttons for fast folder switching
- ✅ 3 customizable preset folders in settings
- ✅ 1 "Custom" button for manual path entry
- ✅ Presets use relative paths (e.g., `./MEDIAS`)
- ✅ Proper bin naming in Premiere (strips `./` prefixes)

### Version 2.1
- ✅ Fixed MP4 file detection and import
- ✅ Excluded VP9 codec (only H.264 downloaded)
- ✅ Added automatic AAC audio conversion
- ✅ Improved logging and error messages
- ✅ Added comprehensive installation package

---

## 📄 Files

- `INSTALL.bat` - Automated installer (run as admin)
- `CHECK_DEPENDENCIES.bat` - Verify dependencies
- `INSTALLATION_GUIDE.md` - Detailed installation instructions
- `client/` - Extension UI and logic
- `host/` - Premiere Pro integration (ExtendScript)
- `CSXS/` - Extension manifest

---

## 🙏 Credits

- Built for Adobe Premiere Pro CEP
- Uses [yt-dlp](https://github.com/yt-dlp/yt-dlp) for downloading
- Uses [ffmpeg](https://ffmpeg.org/) for media processing
- Powered by Node.js

---

## 📞 Support

1. Check logs in the extension (click "Logs" button)
2. Run `CHECK_DEPENDENCIES.bat`
3. See [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) for troubleshooting

---

**Enjoy downloading YouTube videos directly into Premiere Pro! 🎥✨**

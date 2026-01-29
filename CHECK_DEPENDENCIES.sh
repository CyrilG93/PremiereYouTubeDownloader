#!/bin/bash
# Dependency Checker for YouTube Downloader Extension - macOS
# Run this to verify all dependencies are installed correctly

echo "========================================"
echo "YouTube Downloader - Dependency Checker"
echo "========================================"
echo ""

ALL_OK=1

# Check Node.js
echo "[1/5] Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_PATH=$(which node)
    echo "  [OK] Node.js: $NODE_VERSION"
    echo "       Path: $NODE_PATH"
else
    echo "  [MISSING] Node.js not found"
    echo "  Install with: brew install node"
    ALL_OK=0
fi
echo ""

# Check Python
echo "[2/5] Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    PYTHON_PATH=$(which python3)
    echo "  [OK] Python: $PYTHON_VERSION"
    echo "       Path: $PYTHON_PATH"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version)
    PYTHON_PATH=$(which python)
    echo "  [OK] Python: $PYTHON_VERSION"
    echo "       Path: $PYTHON_PATH"
else
    echo "  [MISSING] Python not found"
    echo "  Install with: brew install python"
    ALL_OK=0
fi
echo ""

# Check yt-dlp
echo "[3/5] Checking yt-dlp..."
if command -v yt-dlp &> /dev/null; then
    YTDLP_VERSION=$(yt-dlp --version)
    YTDLP_PATH=$(which yt-dlp)
    echo "  [OK] yt-dlp: $YTDLP_VERSION"
    echo "       Path: $YTDLP_PATH"
else
    echo "  [MISSING] yt-dlp not found"
    echo "  Install with: pip3 install yt-dlp"
    ALL_OK=0
fi
echo ""

# Check ffmpeg
echo "[4/5] Checking ffmpeg..."
if command -v ffmpeg &> /dev/null; then
    FFMPEG_VERSION=$(ffmpeg -version 2>&1 | head -n1 | awk '{print $3}')
    FFMPEG_PATH=$(which ffmpeg)
    echo "  [OK] ffmpeg: $FFMPEG_VERSION"
    echo "       Path: $FFMPEG_PATH"
else
    echo "  [MISSING] ffmpeg not found"
    echo "  Install with: brew install ffmpeg"
    ALL_OK=0
fi
echo ""

# Check Deno (New dependency)
echo "[5/5] Checking Deno..."
if command -v deno &> /dev/null; then
    DENO_VERSION=$(deno --version | head -n1 | awk '{print $2}')
    DENO_PATH=$(which deno)
    echo "  [OK] Deno: $DENO_VERSION"
    echo "       Path: $DENO_PATH"
else
    echo "  [MISSING] Deno not found"
    echo "  Install with: brew install deno"
    # Deno is now required for remote components (ejs)
    ALL_OK=0
fi
echo ""

# Check extension installation
echo "[BONUS] Checking extension installation..."
EXTENSION_PATH="/Library/Application Support/Adobe/CEP/extensions/PremiereYouTubeDownloader"
if [ -d "$EXTENSION_PATH" ]; then
    echo "  [OK] Extension installed at correct location"
else
    echo "  [WARNING] Extension not found in standard location"
    echo "  Expected: $EXTENSION_PATH"
fi
echo ""

# Check CEP debug mode
echo "[BONUS] Checking CEP debug mode..."
DEBUG_MODE=$(defaults read com.adobe.CSXS.11 PlayerDebugMode 2>/dev/null)
if [ "$DEBUG_MODE" = "1" ]; then
    echo "  [OK] CEP debug mode is enabled"
else
    echo "  [WARNING] CEP debug mode may not be enabled"
    echo "  Run: defaults write com.adobe.CSXS.11 PlayerDebugMode 1"
fi
echo ""

echo "========================================"
if [ "$ALL_OK" = "1" ]; then
    echo "Result: ALL DEPENDENCIES INSTALLED! ✓"
    echo ""
    echo "You're ready to use YouTube Downloader!"
    echo "Open Premiere Pro and go to Window > Extensions > YouTube Downloader"
else
    echo "Result: MISSING DEPENDENCIES ✗"
    echo ""
    echo "Please install the missing dependencies listed above"
    echo "Then run this checker again to verify"
fi
echo "========================================"
echo ""

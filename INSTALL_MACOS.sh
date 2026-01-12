#!/bin/bash
# YouTube Downloader for Premiere Pro - macOS Installer
# Version 2.2

echo ""
echo "========================================"
echo "YouTube Downloader for Premiere Pro"
echo "Installation Package v2.2 - macOS"
echo "========================================"
echo ""

# Get script directory
SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
EXTENSION_PATH="/Library/Application Support/Adobe/CEP/extensions/PremiereYouTubeDownloader"

echo "Source directory: $SOURCE_DIR"
echo "Target directory: $EXTENSION_PATH"
echo ""

# Check for sudo if needed
if [ ! -w "/Library/Application Support/Adobe/CEP/extensions" ]; then
    echo "This script requires administrator privileges."
    echo "Please run with: sudo ./INSTALL_MACOS.sh"
    echo ""
    exit 1
fi

echo "[OK] Running with appropriate permissions"
echo ""

# Check if running from installation directory
if [ "$SOURCE_DIR" = "$EXTENSION_PATH" ]; then
    echo ""
    echo "========================================"
    echo "Extension Already Installed"
    echo "========================================"
    echo ""
    echo "The extension is already installed."
    echo "This installer will only check/install dependencies."
    echo ""
    SKIP_COPY=1
else
    echo "Extension will be installed to:"
    echo "$EXTENSION_PATH"
    echo ""
    SKIP_COPY=0
fi

echo ""
echo "========================================"
echo "Step 1/4: Checking Node.js"
echo "========================================"
echo ""

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "[OK] Node.js installed: $NODE_VERSION"
else
    echo "[MISSING] Node.js not found"
    echo ""
    echo "Please install Node.js from: https://nodejs.org/"
    echo "Or use Homebrew: brew install node"
    echo "After installation, run this installer again."
    echo ""
    exit 1
fi

echo ""
echo "========================================"
echo "Step 2/4: Checking Python"
echo "========================================"
echo ""

if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "[OK] Python installed: $PYTHON_VERSION"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version)
    echo "[OK] Python installed: $PYTHON_VERSION"
else
    echo "[MISSING] Python not found"
    echo ""
    echo "Please install Python from: https://www.python.org/downloads/"
    echo "Or use Homebrew: brew install python"
    echo "After installation, run this installer again."
    echo ""
    exit 1
fi

echo ""
echo "========================================"
echo "Step 3/4: Installing yt-dlp"
echo "========================================"
echo ""

if command -v yt-dlp &> /dev/null; then
    echo "[OK] yt-dlp already installed"
    echo "Updating to latest version..."
    python3 -m pip install --upgrade yt-dlp --quiet 2>/dev/null || pip3 install --upgrade yt-dlp --quiet
else
    echo "Installing yt-dlp..."
    python3 -m pip install yt-dlp --quiet 2>/dev/null || pip3 install yt-dlp --quiet
fi

if command -v yt-dlp &> /dev/null; then
    YTDLP_VERSION=$(yt-dlp --version)
    echo "[OK] yt-dlp version: $YTDLP_VERSION"
else
    echo "[WARNING] yt-dlp installation may have failed"
fi

echo ""
echo "========================================"
echo "Step 4/4: Checking ffmpeg"
echo "========================================"
echo ""

if command -v ffmpeg &> /dev/null; then
    echo "[OK] ffmpeg is installed"
else
    echo "[MISSING] ffmpeg not found"
    echo ""
    echo "Please install ffmpeg:"
    echo "Using Homebrew: brew install ffmpeg"
    echo ""
    echo "After installation, run this installer again."
    echo ""
    read -p "Press Enter to continue anyway..."
fi

# Install extension files if not already installed
if [ "$SKIP_COPY" = "0" ]; then
    echo ""
    echo "========================================"
    echo "Installing Extension Files"
    echo "========================================"
    echo ""
    
    # Check if source files exist
    if [ ! -d "$SOURCE_DIR/client" ]; then
        echo "ERROR: Extension files not found!"
        echo ""
        echo "This installer must be run from the extracted folder."
        echo "Make sure you have:"
        echo "- client folder"
        echo "- host folder"
        echo "- CSXS folder"
        echo ""
        exit 1
    fi
    
    # Create extension directory
    if [ ! -d "$EXTENSION_PATH" ]; then
        echo "Creating extension directory..."
        mkdir -p "$EXTENSION_PATH"
    fi
    
    # Copy files
    echo "Copying extension files..."
    cp -R "$SOURCE_DIR/client" "$EXTENSION_PATH/"
    cp -R "$SOURCE_DIR/host" "$EXTENSION_PATH/"
    cp -R "$SOURCE_DIR/CSXS" "$EXTENSION_PATH/"
    
    [ -f "$SOURCE_DIR/.debug" ] && cp "$SOURCE_DIR/.debug" "$EXTENSION_PATH/"
    [ -f "$SOURCE_DIR/README.md" ] && cp "$SOURCE_DIR/README.md" "$EXTENSION_PATH/"
    [ -f "$SOURCE_DIR/INSTALLATION_GUIDE.md" ] && cp "$SOURCE_DIR/INSTALLATION_GUIDE.md" "$EXTENSION_PATH/"
    
    echo "[OK] Extension files installed successfully!"
fi

# Enable unsigned extensions for CEP
echo ""
echo "========================================"
echo "Enabling CEP Debug Mode"
echo "========================================"
echo ""

defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
echo "[OK] CEP debug mode enabled"

echo ""
echo "========================================"
echo "Installation Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Restart Adobe Premiere Pro"
echo "2. Go to Window > Extensions > YouTube Downloader"
echo "3. Start downloading YouTube videos!"
echo ""
echo "For troubleshooting, see README.md"
echo ""

#!/bin/bash
# YouTube Downloader for Premiere Pro - macOS Installer
# Version 2.5.1

echo ""
echo "========================================"
echo "YouTube Downloader for Premiere Pro"
echo "Installation Package v2.5.1 - macOS"
echo "========================================"
echo ""

# Get script directory
SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
EXTENSION_PATH="/Library/Application Support/Adobe/CEP/extensions/PremiereYouTubeDownloader"

echo "Source directory: $SOURCE_DIR"
echo "Target directory: $EXTENSION_PATH"
echo ""

# Check for sudo and auto-elevate if needed
if [ "$EUID" -ne 0 ]; then
    echo "This script requires administrator privileges."
    echo "Requesting sudo access..."
    sudo "$0" "$@"
    exit $?
fi

echo "[OK] Running with appropriate permissions"

# Ensure helper scripts have execution permissions
chmod +x "$SOURCE_DIR/CONFIGURE_MACOS.sh" 2>/dev/null
chmod +x "$SOURCE_DIR/CHECK_DEPENDENCIES.sh" 2>/dev/null
chmod +x "$SOURCE_DIR/INSTALL_MACOS.sh" 2>/dev/null

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
echo "Step 1/6: Checking Node.js"
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
echo "Step 2/6: Checking Python"
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
echo "Step 3/6: Installing yt-dlp with EJS support"
echo "========================================"
echo ""

if command -v yt-dlp &> /dev/null; then
    echo "[OK] yt-dlp already installed"
    echo "Updating to latest version..."
    python3 -m pip install --upgrade "yt-dlp[default]" --quiet 2>/dev/null || pip3 install --upgrade "yt-dlp[default]" --quiet
else
    echo "Installing yt-dlp..."
    python3 -m pip install "yt-dlp[default]" --quiet 2>/dev/null || pip3 install "yt-dlp[default]" --quiet
fi

if command -v yt-dlp &> /dev/null; then
    YTDLP_VERSION=$(yt-dlp --version)
    echo "[OK] yt-dlp version: $YTDLP_VERSION"
    echo "[OK] yt-dlp-ejs package included for YouTube compatibility"
else
    echo "[WARNING] yt-dlp installation may have failed"
fi

echo ""
echo "========================================"
echo "Step 4/6: Installing Deno (for YouTube challenges)"
echo "========================================"
echo ""

if command -v deno &> /dev/null; then
    DENO_VERSION=$(deno --version | head -n 1)
    echo "[OK] Deno already installed: $DENO_VERSION"
else
    echo "Installing Deno..."
    if command -v brew &> /dev/null; then
        brew install deno
    else
        curl -fsSL https://deno.land/install.sh | sh
        echo "Please add Deno to your PATH manually if not detected."
    fi
    
    if command -v deno &> /dev/null || [ -f "$HOME/.deno/bin/deno" ]; then
        echo "[OK] Deno installed successfully"
    else
        echo "[WARNING] Deno installation may have failed"
    fi
fi

echo ""
echo "========================================"
echo "Step 5/6: Checking ffmpeg"
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

defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
defaults write com.adobe.CSXS.13 PlayerDebugMode 1
defaults write com.adobe.CSXS.14 PlayerDebugMode 1
defaults write com.adobe.CSXS.15 PlayerDebugMode 1
defaults write com.adobe.CSXS.16 PlayerDebugMode 1
echo "[OK] CEP debug mode enabled for CSXS 10-16"

echo ""
echo "========================================"
echo "Step 6/6: Auto-Configuration"
echo "========================================"
echo ""

echo "Scanning system paths for dependencies..."
echo ""

CONFIG_FILE="$EXTENSION_PATH/client/js/config.json"

# Find paths
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then echo "  [MISSING] Node.js"; else echo "  [FOUND] Node.js: $NODE_PATH"; fi

PYTHON_PATH=$(which python3)
[ -z "$PYTHON_PATH" ] && PYTHON_PATH=$(which python)
if [ -z "$PYTHON_PATH" ]; then echo "  [MISSING] Python"; else echo "  [FOUND] Python: $PYTHON_PATH"; fi

YTDLP_PATH=$(which yt-dlp)
if [ -z "$YTDLP_PATH" ]; then echo "  [MISSING] yt-dlp"; else echo "  [FOUND] yt-dlp: $YTDLP_PATH"; fi

FFMPEG_PATH=$(which ffmpeg)
if [ -z "$FFMPEG_PATH" ]; then echo "  [MISSING] ffmpeg"; else echo "  [FOUND] ffmpeg: $FFMPEG_PATH"; fi

DENO_PATH=$(which deno)
if [ -z "$DENO_PATH" ]; then echo "  [MISSING] Deno"; else echo "  [FOUND] Deno: $DENO_PATH"; fi

echo ""
echo "Generating configuration file..."

# Create JSON content manually
JSON_CONTENT="{"
JSON_CONTENT="$JSON_CONTENT\"nodePath\": \"$NODE_PATH\","
JSON_CONTENT="$JSON_CONTENT\"pythonPath\": \"$PYTHON_PATH\","
JSON_CONTENT="$JSON_CONTENT\"ytDlpPath\": \"$YTDLP_PATH\","
JSON_CONTENT="$JSON_CONTENT\"ffmpegPath\": \"$FFMPEG_PATH\","
JSON_CONTENT="$JSON_CONTENT\"denoPath\": \"$DENO_PATH\""
JSON_CONTENT="$JSON_CONTENT}"

# Write to file
# Since we are running with sudo (potentially), ensure file is writable or created by user if possible, 
# but usually extension folder is root owned anyway if in /Library.
echo "$JSON_CONTENT" > "$CONFIG_FILE"

if [ -f "$CONFIG_FILE" ]; then
    echo "  [OK] Config file created at: $CONFIG_FILE"
else
    echo "  [ERROR] Failed to write config file!"
fi

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

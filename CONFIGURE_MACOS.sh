#!/bin/bash
# Auto-Configuration Tool for YouTube Downloader Extension - macOS
# Scans for dependencies and creates a config.json file for the extension

echo "========================================"
echo "YouTube Downloader - Auto-Configurator"
echo "========================================"
echo ""

# Target the installed extension location first
EXTENSION_PATH="/Library/Application Support/Adobe/CEP/extensions/PremiereYouTubeDownloader"
LOCAL_CONFIG_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/client/js/config.json"

if [ -d "$EXTENSION_PATH/client/js" ]; then
    CONFIG_FILE="$EXTENSION_PATH/client/js/config.json"
    echo "Targeting installed extension at: $EXTENSION_PATH"
else
    CONFIG_FILE="$LOCAL_CONFIG_PATH"
    echo "Targeting local directory (Extension not found in system path)"
fi

echo "Scanning system for dependencies..."
echo ""

# Find Node.js
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
    echo "  [MISSING] Node.js"
else
    echo "  [FOUND] Node.js: $NODE_PATH"
fi

# Find Python
PYTHON_PATH=$(which python3)
if [ -z "$PYTHON_PATH" ]; then
    PYTHON_PATH=$(which python)
fi
if [ -z "$PYTHON_PATH" ]; then
    echo "  [MISSING] Python"
else
    echo "  [FOUND] Python: $PYTHON_PATH"
fi

# Find yt-dlp
YTDLP_PATH=$(which yt-dlp)
if [ -z "$YTDLP_PATH" ]; then
    echo "  [MISSING] yt-dlp"
else
    echo "  [FOUND] yt-dlp: $YTDLP_PATH"
fi

# Find ffmpeg
FFMPEG_PATH=$(which ffmpeg)
if [ -z "$FFMPEG_PATH" ]; then
    echo "  [MISSING] ffmpeg"
else
    echo "  [FOUND] ffmpeg: $FFMPEG_PATH"
fi

# Find Deno
DENO_PATH=$(which deno)
if [ -z "$DENO_PATH" ]; then
    echo "  [MISSING] Deno"
else
    echo "  [FOUND] Deno: $DENO_PATH"
fi

echo ""
echo "Generating configuration file..."

# Create JSON content (manual JSON construction to avoid 'jq' dependency)
# Escape backslashes not strictly needed on unix paths usually but good practice
JSON_CONTENT="{"
JSON_CONTENT="$JSON_CONTENT\"nodePath\": \"$NODE_PATH\","
JSON_CONTENT="$JSON_CONTENT\"pythonPath\": \"$PYTHON_PATH\","
JSON_CONTENT="$JSON_CONTENT\"ytDlpPath\": \"$YTDLP_PATH\","
JSON_CONTENT="$JSON_CONTENT\"ffmpegPath\": \"$FFMPEG_PATH\","
JSON_CONTENT="$JSON_CONTENT\"denoPath\": \"$DENO_PATH\""
JSON_CONTENT="$JSON_CONTENT}"

# Write to file
echo "$JSON_CONTENT" > "$CONFIG_FILE"

if [ -f "$CONFIG_FILE" ]; then
    echo "  [OK] Config file created at:"
    echo "       $CONFIG_FILE"
    echo ""
    echo "File content:"
    cat "$CONFIG_FILE"
    echo ""
    echo "Success! The extension will now use these paths automatically."
else
    echo "  [ERROR] Failed to write config file!"
fi

echo ""
echo "========================================"

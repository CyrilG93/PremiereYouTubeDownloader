#!/bin/bash
# YouTube Downloader for Premiere Pro - Dependency Updater (macOS)
# Forces update of all dependencies to latest versions

echo ""
echo "========================================"
echo "YouTube Downloader - Dependency Updater"
echo "========================================"
echo ""

UPDATES_DONE=0

# 1. Update yt-dlp
echo "[1/3] Updating yt-dlp..."
if command -v yt-dlp &> /dev/null; then
    OLD_VERSION=$(yt-dlp --version)
    echo "  Current version: $OLD_VERSION"
    echo "  Upgrading..."
    python3 -m pip install --upgrade "yt-dlp[default]" 2>&1 || pip3 install --upgrade "yt-dlp[default]" 2>&1
    NEW_VERSION=$(yt-dlp --version)
    if [ "$OLD_VERSION" != "$NEW_VERSION" ]; then
        echo "  [UPDATED] $OLD_VERSION -> $NEW_VERSION"
        UPDATES_DONE=$((UPDATES_DONE + 1))
    else
        echo "  [OK] Already up to date: $NEW_VERSION"
    fi
else
    echo "  [MISSING] yt-dlp not found. Install with: pip3 install \"yt-dlp[default]\""
    echo "  Or run the installer script: INSTALL_MACOS.sh"
fi
echo ""

# 2. Update Deno
echo "[2/3] Updating Deno..."
if command -v deno &> /dev/null; then
    OLD_VERSION=$(deno --version | head -n 1)
    echo "  Current version: $OLD_VERSION"
    echo "  Upgrading..."
    if command -v brew &> /dev/null; then
        brew upgrade deno 2>&1 || true
    else
        deno upgrade 2>&1 || curl -fsSL https://deno.land/install.sh | sh 2>&1 || true
    fi
    NEW_VERSION=$(deno --version | head -n 1)
    if [ "$OLD_VERSION" != "$NEW_VERSION" ]; then
        echo "  [UPDATED] $OLD_VERSION -> $NEW_VERSION"
        UPDATES_DONE=$((UPDATES_DONE + 1))
    else
        echo "  [OK] Already up to date: $NEW_VERSION"
    fi
else
    echo "  [MISSING] Deno not found. Install with: brew install deno"
    echo "  Or run the installer script: INSTALL_MACOS.sh"
fi
echo ""

# 3. Update ffmpeg
echo "[3/3] Updating ffmpeg..."
if command -v ffmpeg &> /dev/null; then
    OLD_VERSION=$(ffmpeg -version 2>&1 | head -n1 | awk '{print $3}')
    echo "  Current version: $OLD_VERSION"
    if command -v brew &> /dev/null; then
        echo "  Upgrading via Homebrew..."
        brew upgrade ffmpeg 2>&1 || true
    else
        echo "  [INFO] ffmpeg cannot be auto-updated without Homebrew"
        echo "  Install Homebrew first: https://brew.sh"
    fi
    NEW_VERSION=$(ffmpeg -version 2>&1 | head -n1 | awk '{print $3}')
    if [ "$OLD_VERSION" != "$NEW_VERSION" ]; then
        echo "  [UPDATED] $OLD_VERSION -> $NEW_VERSION"
        UPDATES_DONE=$((UPDATES_DONE + 1))
    else
        echo "  [OK] Already up to date: $NEW_VERSION"
    fi
else
    echo "  [MISSING] ffmpeg not found. Install with: brew install ffmpeg"
fi
echo ""

# Summary
echo "========================================"
if [ "$UPDATES_DONE" -gt 0 ]; then
    echo "Done! $UPDATES_DONE dependency(ies) updated."
else
    echo "Done! All dependencies are already up to date."
fi
echo "========================================"
echo ""

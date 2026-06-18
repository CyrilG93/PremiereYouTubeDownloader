#!/bin/bash
# YouTube Downloader for Premiere Pro - Dependency Updater (macOS)
# Checks and updates the private runtime installed by the macOS PKG.

set -u

echo ""
echo "========================================"
echo "YouTube Downloader - Dependency Updater"
echo "========================================"
echo ""

UPDATES_DONE=0
WARNINGS_DONE=0
FAILURES_DONE=0

APP_SUPPORT="${HOME}/Library/Application Support"
DEFAULT_RUNTIME_DIR="${APP_SUPPORT}/PremiereYouTubeDownloader/runtime"
DEFAULT_EXTENSION_DIR="${APP_SUPPORT}/Adobe/CEP/extensions/PremiereYouTubeDownloader"
RUNTIME_DIR="${YTDL_RUNTIME_DIR:-${DEFAULT_RUNTIME_DIR}}"
EXTENSION_DIR="${YTDL_EXTENSION_DIR:-${DEFAULT_EXTENSION_DIR}}"
CONFIG_FILE="${EXTENSION_DIR}/client/js/config.json"

PRIVATE_PYTHON="${RUNTIME_DIR}/python/bin/python3"
PRIVATE_YTDLP="${RUNTIME_DIR}/python/bin/yt-dlp"
PRIVATE_FFMPEG="${RUNTIME_DIR}/ffmpeg/bin/ffmpeg"
PRIVATE_FFPROBE="${RUNTIME_DIR}/ffmpeg/bin/ffprobe"
PRIVATE_DENO="${RUNTIME_DIR}/deno/bin/deno"

print_step() {
    echo ""
    echo "$1"
    echo "----------------------------------------"
}

mark_warning() {
    WARNINGS_DONE=$((WARNINGS_DONE + 1))
}

mark_failure() {
    FAILURES_DONE=$((FAILURES_DONE + 1))
}

json_escape() {
    # Escape paths before writing the JSON config consumed by the CEP panel.
    printf "%s" "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

first_line() {
    "$@" 2>&1 | head -n 1
}

show_tool_version() {
    label="$1"
    tool_path="$2"
    shift 2

    if [ ! -x "${tool_path}" ]; then
        echo "  [MISSING] ${label}: ${tool_path}"
        return 1
    fi

    version="$(first_line "${tool_path}" "$@")"
    if [ -z "${version}" ]; then
        echo "  [BROKEN] ${label}: no version output"
        return 1
    fi

    echo "  [FOUND] ${label}: ${tool_path}"
    echo "          ${version}"
    return 0
}

write_private_runtime_config() {
    # Keep the extension pointed at the private runtime after successful checks or updates.
    if [ ! -d "$(dirname "${CONFIG_FILE}")" ]; then
        echo "  [SKIP] Extension config folder not found: $(dirname "${CONFIG_FILE}")"
        mark_warning
        return 0
    fi

    generated_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    cat >"${CONFIG_FILE}" <<EOF
{
  "version": 1,
  "generatedBy": "UPDATE_DEPENDENCIES.sh",
  "generatedAtUtc": "$(json_escape "${generated_at}")",
  "nodePath": "",
  "pythonPath": "$(json_escape "${PRIVATE_PYTHON}")",
  "ytDlpPath": "$(json_escape "${PRIVATE_YTDLP}")",
  "ffmpegPath": "$(json_escape "${PRIVATE_FFMPEG}")",
  "denoPath": "$(json_escape "${PRIVATE_DENO}")"
}
EOF
    chmod 600 "${CONFIG_FILE}" 2>/dev/null || true
    echo "  [OK] Runtime config refreshed: ${CONFIG_FILE}"
}

check_private_runtime() {
    print_step "[1/5] Checking private PKG runtime"

    if [ ! -d "${RUNTIME_DIR}" ]; then
        echo "  [MISSING] Private runtime not found:"
        echo "            ${RUNTIME_DIR}"
        echo "  This usually means the macOS PKG has not been installed on this user account."
        mark_warning
        return 1
    fi

    echo "  Runtime: ${RUNTIME_DIR}"
    show_tool_version "Python" "${PRIVATE_PYTHON}" --version || mark_failure
    show_tool_version "yt-dlp" "${PRIVATE_YTDLP}" --version || mark_failure
    show_tool_version "FFmpeg" "${PRIVATE_FFMPEG}" -version || mark_failure
    show_tool_version "FFprobe" "${PRIVATE_FFPROBE}" -version || mark_failure
    show_tool_version "Deno" "${PRIVATE_DENO}" --version || mark_failure

    if [ -f "${RUNTIME_DIR}/.youtubedownloader-runtime-version" ]; then
        echo "  Runtime package version: $(tr -d '\r\n' <"${RUNTIME_DIR}/.youtubedownloader-runtime-version")"
    fi

    return 0
}

update_private_ytdlp() {
    print_step "[2/5] Updating private yt-dlp"

    if [ ! -x "${PRIVATE_PYTHON}" ]; then
        echo "  [SKIP] Private Python missing. Reinstall the latest macOS PKG."
        mark_failure
        return 0
    fi

    old_version="$(first_line "${PRIVATE_PYTHON}" -m yt_dlp --version || true)"
    echo "  Current version: ${old_version:-unknown}"
    echo "  Upgrading yt-dlp[default] inside the private Python runtime..."

    # The bundled Python is isolated and marked as externally managed by uv, so pip needs an explicit private-runtime override.
    if PYTHONNOUSERSITE=1 PIP_DISABLE_PIP_VERSION_CHECK=1 "${PRIVATE_PYTHON}" -m pip install --upgrade --quiet --break-system-packages "yt-dlp[default]"; then
        new_version="$(first_line "${PRIVATE_PYTHON}" -m yt_dlp --version || true)"
        if [ "${old_version}" != "${new_version}" ]; then
            echo "  [UPDATED] ${old_version:-unknown} -> ${new_version:-unknown}"
            UPDATES_DONE=$((UPDATES_DONE + 1))
        else
            echo "  [OK] Already up to date: ${new_version:-unknown}"
        fi
    else
        echo "  [FAILED] Could not update yt-dlp in the private runtime."
        mark_failure
    fi
}

update_private_deno() {
    print_step "[3/5] Updating private Deno"

    if [ ! -x "${PRIVATE_DENO}" ]; then
        echo "  [SKIP] Private Deno missing. Reinstall the latest macOS PKG."
        mark_failure
        return 0
    fi

    old_version="$(first_line "${PRIVATE_DENO}" --version || true)"
    echo "  Current version: ${old_version:-unknown}"
    echo "  Upgrading Deno executable in the private runtime..."

    upgrade_output=""
    if upgrade_output="$(NO_COLOR=1 DENO_TLS_CA_STORE=system DENO_INSTALL="${RUNTIME_DIR}/deno" "${PRIVATE_DENO}" upgrade 2>&1)"; then
        new_version="$(first_line "${PRIVATE_DENO}" --version || true)"
        if [ "${old_version}" != "${new_version}" ]; then
            echo "  [UPDATED] ${old_version:-unknown} -> ${new_version:-unknown}"
            UPDATES_DONE=$((UPDATES_DONE + 1))
        else
            echo "  [OK] Already up to date: ${new_version:-unknown}"
        fi
    else
        if "${PRIVATE_DENO}" --version >/dev/null 2>&1; then
            echo "  [WARNING] Could not check/update Deno online, but the installed Deno still works."
            if printf "%s" "${upgrade_output}" | grep -qi "certificate\\|UnknownIssuer\\|TLS\\|403\\|Zscaler\\|proxy"; then
                echo "            The online update was blocked by network certificate, proxy, or web filtering."
            fi
            echo "            You can keep using the plugin; reinstall the latest PKG to update Deno offline."
            mark_warning
        else
            echo "  [FAILED] Could not update private Deno, and the installed Deno no longer validates."
            mark_failure
        fi
    fi
}

check_private_ffmpeg() {
    print_step "[4/5] Checking private FFmpeg and FFprobe"

    ffmpeg_ok=1
    ffprobe_ok=1
    show_tool_version "FFmpeg" "${PRIVATE_FFMPEG}" -version || ffmpeg_ok=0
    show_tool_version "FFprobe" "${PRIVATE_FFPROBE}" -version || ffprobe_ok=0

    if [ "${ffmpeg_ok}" -eq 1 ] && [ "${ffprobe_ok}" -eq 1 ]; then
        echo "  [OK] FFmpeg runtime is available."
    else
        echo "  [ACTION] FFmpeg is bundled as a compiled private runtime."
        echo "           Install the latest macOS PKG to repair or replace it."
        mark_failure
    fi
}

refresh_config_and_validate() {
    print_step "[5/5] Refreshing extension config"

    if [ -x "${PRIVATE_PYTHON}" ] && [ -x "${PRIVATE_YTDLP}" ] && [ -x "${PRIVATE_FFMPEG}" ] && [ -x "${PRIVATE_FFPROBE}" ] && [ -x "${PRIVATE_DENO}" ]; then
        write_private_runtime_config
    else
        echo "  [SKIP] Private runtime is incomplete; config was not rewritten."
        echo "         Reinstall the latest macOS PKG if the panel still cannot find its tools."
        mark_failure
    fi
}

legacy_global_update() {
    print_step "Legacy fallback: global dependencies"

    echo "  Private runtime not available, checking global PATH tools instead."
    if command -v yt-dlp >/dev/null 2>&1; then
        old_version="$(yt-dlp --version 2>/dev/null || true)"
        echo "  Global yt-dlp: ${old_version:-unknown}"
        python3 -m pip install --upgrade "yt-dlp[default]" 2>&1 || pip3 install --upgrade "yt-dlp[default]" 2>&1 || mark_failure
    else
        echo "  [MISSING] Global yt-dlp"
        mark_warning
    fi

    if command -v deno >/dev/null 2>&1; then
        echo "  Global $(deno --version | head -n 1)"
        deno upgrade 2>&1 || mark_warning
    else
        echo "  [MISSING] Global Deno"
        mark_warning
    fi

    if command -v ffmpeg >/dev/null 2>&1; then
        echo "  Global $(ffmpeg -version 2>&1 | head -n 1)"
    else
        echo "  [MISSING] Global FFmpeg"
        mark_warning
    fi
}

if check_private_runtime; then
    update_private_ytdlp
    update_private_deno
    check_private_ffmpeg
    refresh_config_and_validate
else
    legacy_global_update
fi

echo ""
echo "========================================"
if [ "${FAILURES_DONE}" -gt 0 ]; then
    echo "Done with ${FAILURES_DONE} issue(s). Install the latest macOS PKG if the private runtime is incomplete."
elif [ "${UPDATES_DONE}" -gt 0 ]; then
    echo "Done! ${UPDATES_DONE} private runtime dependency update(s) installed."
elif [ "${WARNINGS_DONE}" -gt 0 ]; then
    echo "Done with ${WARNINGS_DONE} warning(s)."
else
    echo "Done! Private runtime dependencies are installed and available."
fi
echo "Restart Premiere Pro before testing again."
echo "========================================"
echo ""

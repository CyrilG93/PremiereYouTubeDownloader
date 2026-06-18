#!/bin/bash
set -eu

# // Install the macOS PKG payload into the active user's profile even though Installer runs this script as root.
YTDL_SCRIPT_DIR="${YTDL_INSTALLER_SCRIPT_DIR:-$(cd "$(dirname "$0")" && pwd)}"
YTDL_PAYLOAD_ROOT="${YTDL_PAYLOAD_ROOT:-${YTDL_SCRIPT_DIR}/payload}"
YTDL_RUNTIME_ENV="${YTDL_RUNTIME_ENV:-${YTDL_SCRIPT_DIR}/runtime.env}"

if [ ! -f "${YTDL_RUNTIME_ENV}" ]; then
  echo "Runtime metadata is missing: ${YTDL_RUNTIME_ENV}" >&2
  exit 1
fi

# // Load generated shell-escaped runtime metadata embedded by the package builder.
. "${YTDL_RUNTIME_ENV}"

ytdl_resolve_user() {
  # // Resolve the graphical login user so the extension and runtime are not installed into root's home.
  YTDL_USER="${YTDL_TEST_USER:-$(stat -f "%Su" /dev/console 2>/dev/null || true)}"
  if [ -z "${YTDL_USER}" ] || [ "${YTDL_USER}" = "root" ] || [ "${YTDL_USER}" = "loginwindow" ]; then
    YTDL_USER="${SUDO_USER:-}"
  fi
  if [ -z "${YTDL_USER}" ] || [ "${YTDL_USER}" = "root" ]; then
    echo "Unable to resolve the macOS login user." >&2
    exit 1
  fi

  YTDL_UID="$(id -u "${YTDL_USER}")"
  YTDL_GID="$(id -g "${YTDL_USER}")"
  YTDL_HOME="${YTDL_TEST_HOME:-$(dscl . -read "/Users/${YTDL_USER}" NFSHomeDirectory 2>/dev/null | awk '{$1=""; sub(/^ /, ""); print}' || true)}"
  if [ -z "${YTDL_HOME}" ]; then
    YTDL_HOME="$(eval echo "~${YTDL_USER}")"
  fi
}

ytdl_run_as_user() {
  # // Run validation and preferences writes in the resolved user's environment.
  if [ "$(id -u)" -ne 0 ] || [ "${YTDL_USER}" = "$(id -un)" ]; then
    HOME="${YTDL_HOME}" USER="${YTDL_USER}" "$@"
    return
  fi

  if command -v launchctl >/dev/null 2>&1; then
    launchctl asuser "${YTDL_UID}" sudo -H -u "${YTDL_USER}" "$@"
  else
    sudo -H -u "${YTDL_USER}" "$@"
  fi
}

ytdl_json_escape() {
  # // Escape filesystem paths before writing the JSON file consumed by the CEP panel.
  printf "%s" "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

ytdl_install_extension() {
  # // Replace the user-level CEP extension with the payload shipped in the installer.
  source_dir="${YTDL_PAYLOAD_ROOT}/dist/PremiereYouTubeDownloader"
  dest_dir="${YTDL_HOME}/Library/Application Support/Adobe/CEP/extensions/PremiereYouTubeDownloader"
  if [ ! -d "${source_dir}" ]; then
    echo "Extension payload is missing: ${source_dir}" >&2
    exit 1
  fi

  mkdir -p "$(dirname "${dest_dir}")"
  replacement_dir="${dest_dir}.new.$$"
  old_dir="${dest_dir}.old.$$"
  ditto "${source_dir}" "${replacement_dir}"
  if [ -e "${dest_dir}" ]; then
    mv "${dest_dir}" "${old_dir}"
  fi
  mv "${replacement_dir}" "${dest_dir}"
  [ ! -e "${old_dir}" ] || rm -rf "${old_dir}"
  chown -R "${YTDL_UID}:${YTDL_GID}" "${dest_dir}"
  echo "YouTube Downloader installed to ${dest_dir}."
}

ytdl_enable_cep_debug_mode() {
  # // Enable unsigned CEP extensions for recent Adobe hosts in the active user's preferences.
  csxs_version=7
  while [ "${csxs_version}" -le 20 ]; do
    ytdl_run_as_user defaults write "com.adobe.CSXS.${csxs_version}" PlayerDebugMode -string "1" >/dev/null 2>&1 || true
    csxs_version=$((csxs_version + 1))
  done
  echo "CEP debug mode enabled for CSXS.7 to CSXS.20."
}

ytdl_runtime_is_current() {
  # // Reuse an installed runtime only when version and all expected tools validate.
  runtime_dir="$1"
  version_file="${runtime_dir}/.youtubedownloader-runtime-version"
  [ -f "${version_file}" ] || return 1
  [ "$(tr -d '\r\n' <"${version_file}")" = "${YTDL_RUNTIME_VERSION}" ] || return 1
  [ -x "${runtime_dir}/python/bin/python3" ] || return 1
  [ -x "${runtime_dir}/python/bin/yt-dlp" ] || return 1
  [ -x "${runtime_dir}/ffmpeg/bin/ffmpeg" ] || return 1
  [ -x "${runtime_dir}/ffmpeg/bin/ffprobe" ] || return 1
  [ -x "${runtime_dir}/deno/bin/deno" ] || return 1
  ytdl_run_as_user "${runtime_dir}/python/bin/python3" -m yt_dlp --version >/dev/null 2>&1 || return 1
  ytdl_run_as_user "${runtime_dir}/python/bin/yt-dlp" --version >/dev/null 2>&1 || return 1
  ytdl_run_as_user "${runtime_dir}/ffmpeg/bin/ffmpeg" -version >/dev/null 2>&1 || return 1
  ytdl_run_as_user "${runtime_dir}/ffmpeg/bin/ffprobe" -version >/dev/null 2>&1 || return 1
  ytdl_run_as_user "${runtime_dir}/deno/bin/deno" --version >/dev/null 2>&1 || return 1
  return 0
}

ytdl_install_runtime() {
  # // Extract the bundled private runtime after verifying its immutable SHA-256.
  runtime_dir="$1"
  temp_root="$(mktemp -d "${TMPDIR:-/tmp}/youtubedownloader-runtime.XXXXXX")"
  archive_path="${YTDL_SCRIPT_DIR}/runtime/${YTDL_RUNTIME_ASSET_NAME}"
  extracted_root="${temp_root}/extracted"
  mkdir -p "${extracted_root}"

  if [ ! -f "${archive_path}" ]; then
    rm -rf "${temp_root}"
    echo "Bundled runtime archive is missing: ${archive_path}" >&2
    exit 1
  fi

  actual_hash="$(shasum -a 256 "${archive_path}" | awk '{print tolower($1)}')"
  if [ "${actual_hash}" != "${YTDL_RUNTIME_SHA256}" ]; then
    rm -rf "${temp_root}"
    echo "Runtime SHA-256 mismatch." >&2
    exit 1
  fi

  tar -xzf "${archive_path}" -C "${extracted_root}"
  new_runtime="${extracted_root}/runtime"
  if [ ! -x "${new_runtime}/python/bin/yt-dlp" ] || [ ! -x "${new_runtime}/ffmpeg/bin/ffmpeg" ] || [ ! -x "${new_runtime}/deno/bin/deno" ]; then
    rm -rf "${temp_root}"
    echo "The bundled runtime archive is incomplete." >&2
    exit 1
  fi

  mkdir -p "$(dirname "${runtime_dir}")"
  old_runtime="${runtime_dir}.old.$$"
  if [ -e "${runtime_dir}" ]; then
    mv "${runtime_dir}" "${old_runtime}"
  fi
  mv "${new_runtime}" "${runtime_dir}"
  [ ! -e "${old_runtime}" ] || rm -rf "${old_runtime}"
  rm -rf "${temp_root}"
  chown -R "${YTDL_UID}:${YTDL_GID}" "${runtime_dir}"
  echo "Private runtime installed to ${runtime_dir}."
}

ytdl_validate_runtime() {
  # // Validate the runtime tools before exposing their paths to the extension.
  runtime_dir="$1"
  ytdl_run_as_user "${runtime_dir}/python/bin/python3" -m yt_dlp --version >/dev/null
  ytdl_run_as_user "${runtime_dir}/python/bin/yt-dlp" --version >/dev/null
  ytdl_run_as_user "${runtime_dir}/ffmpeg/bin/ffmpeg" -version >/dev/null
  ytdl_run_as_user "${runtime_dir}/ffmpeg/bin/ffprobe" -version >/dev/null
  ytdl_run_as_user "${runtime_dir}/deno/bin/deno" --version >/dev/null
}

ytdl_write_extension_config() {
  # // Persist exact private-runtime paths in the config file already read by client/js/downloader.js.
  runtime_dir="$1"
  extension_dir="${YTDL_HOME}/Library/Application Support/Adobe/CEP/extensions/PremiereYouTubeDownloader"
  config_file="${extension_dir}/client/js/config.json"
  python_path="${runtime_dir}/python/bin/python3"
  ytdlp_path="${runtime_dir}/python/bin/yt-dlp"
  ffmpeg_path="${runtime_dir}/ffmpeg/bin/ffmpeg"
  deno_path="${runtime_dir}/deno/bin/deno"
  generated_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  mkdir -p "$(dirname "${config_file}")"
  cat >"${config_file}" <<EOF
{
  "version": 1,
  "generatedBy": "youtubedownloader_install_macos_private_runtime.sh",
  "generatedAtUtc": "$(ytdl_json_escape "${generated_at}")",
  "nodePath": "",
  "pythonPath": "$(ytdl_json_escape "${python_path}")",
  "ytDlpPath": "$(ytdl_json_escape "${ytdlp_path}")",
  "ffmpegPath": "$(ytdl_json_escape "${ffmpeg_path}")",
  "denoPath": "$(ytdl_json_escape "${deno_path}")"
}
EOF
  chmod 600 "${config_file}"
  chown "${YTDL_UID}:${YTDL_GID}" "${config_file}"
  echo "Runtime config written: ${config_file}"
}

ytdl_resolve_user

YTDL_RUNTIME_DIR="${YTDL_HOME}/Library/Application Support/PremiereYouTubeDownloader/runtime"
if [ "${YTDL_RUNTIME_ARCH}" != "$(uname -m)" ]; then
  echo "Installer runtime architecture ${YTDL_RUNTIME_ARCH} does not match this Mac ($(uname -m))." >&2
  exit 1
fi

ytdl_install_extension
if [ "${YTDL_SKIP_CEP_DEBUG:-0}" != "1" ]; then
  ytdl_enable_cep_debug_mode
fi

if ytdl_runtime_is_current "${YTDL_RUNTIME_DIR}"; then
  echo "Keeping the compatible private runtime already installed."
else
  ytdl_install_runtime "${YTDL_RUNTIME_DIR}"
fi

ytdl_validate_runtime "${YTDL_RUNTIME_DIR}"
printf "%s\n" "${YTDL_RUNTIME_VERSION}" >"${YTDL_RUNTIME_DIR}/.youtubedownloader-runtime-version"
chown "${YTDL_UID}:${YTDL_GID}" "${YTDL_RUNTIME_DIR}/.youtubedownloader-runtime-version"
ytdl_write_extension_config "${YTDL_RUNTIME_DIR}"

echo "Installation complete. Restart Premiere Pro, then open Window > Extensions > YouTube Downloader."

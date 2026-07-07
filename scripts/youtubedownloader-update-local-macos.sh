#!/bin/bash
set -eu

DRY_RUN=0
DESTINATION=""

print_usage() {
  # // Keep command help short because this helper is mainly used from npm or double-clicked in Terminal.
  echo "Usage: $0 [--destination <path>] [--dry-run]"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --destination)
      if [ "$#" -lt 2 ]; then
        echo "Missing value for --destination" >&2
        print_usage >&2
        exit 2
      fi
      DESTINATION="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      print_usage >&2
      exit 2
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
APP_SUPPORT="${HOME}/Library/Application Support"
RUNTIME_DIR="${APP_SUPPORT}/PremiereYouTubeDownloader/runtime"

if [ -z "${DESTINATION}" ]; then
  DESTINATION="${APP_SUPPORT}/Adobe/CEP/extensions/PremiereYouTubeDownloader"
fi

CONFIG_FILE="${DESTINATION}/client/js/config.json"

log_info() {
  # // Prefix local update output so npm, Terminal, and logs are easy to scan.
  echo "[YouTube Downloader] $1"
}

assert_source_folder() {
  # // Fail early if the script is not being run from a complete plugin checkout.
  folder_path="${REPO_ROOT}/$1"
  if [ ! -d "${folder_path}" ]; then
    echo "Missing source folder: ${folder_path}" >&2
    exit 1
  fi
}

json_escape() {
  # // Escape filesystem paths before writing the JSON config consumed by the CEP panel.
  printf "%s" "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

copy_folder() {
  source_path="$1"
  target_path="$2"
  shift 2

  if [ "${DRY_RUN}" -eq 1 ]; then
    log_info "Would sync ${source_path} -> ${target_path}"
    return
  fi

  mkdir -p "${target_path}"
  rsync -a --delete "$@" "${source_path}/" "${target_path}/"
}

copy_optional_file() {
  file_name="$1"
  source_path="${REPO_ROOT}/${file_name}"
  target_path="${DESTINATION}/${file_name}"

  if [ ! -f "${source_path}" ]; then
    return
  fi

  if [ "${DRY_RUN}" -eq 1 ]; then
    log_info "Would copy ${source_path} -> ${target_path}"
    return
  fi

  mkdir -p "$(dirname "${target_path}")"
  cp "${source_path}" "${target_path}"
}

enable_cep_debug_mode() {
  # // Enable unsigned CEP extensions for current-user Adobe hosts without requiring admin rights.
  if [ "${DRY_RUN}" -eq 1 ]; then
    log_info "Would enable CEP debug mode for CSXS.7 to CSXS.20"
    return
  fi

  csxs_version=7
  while [ "${csxs_version}" -le 20 ]; do
    defaults write "com.adobe.CSXS.${csxs_version}" PlayerDebugMode -string "1" >/dev/null 2>&1 || true
    csxs_version=$((csxs_version + 1))
  done
  log_info "CEP debug mode enabled for CSXS.7 to CSXS.20."
}

write_runtime_config_if_needed() {
  # // Preserve an installer-generated config; create one only when the quick copy would otherwise miss runtime paths.
  if [ -f "${CONFIG_FILE}" ]; then
    log_info "Keeping existing runtime config: ${CONFIG_FILE}"
    return
  fi

  python_path="${RUNTIME_DIR}/python/bin/python3"
  ffmpeg_path="${RUNTIME_DIR}/ffmpeg/bin/ffmpeg"
  ffprobe_path="${RUNTIME_DIR}/ffmpeg/bin/ffprobe"
  deno_path="${RUNTIME_DIR}/deno/bin/deno"

  if [ -x "${python_path}" ] && [ -x "${ffmpeg_path}" ] && [ -x "${ffprobe_path}" ] && [ -x "${deno_path}" ]; then
    if [ "${DRY_RUN}" -eq 1 ]; then
      log_info "Would write runtime config for ${RUNTIME_DIR}"
      return
    fi

    mkdir -p "$(dirname "${CONFIG_FILE}")"
    generated_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    cat >"${CONFIG_FILE}" <<EOF
{
  "version": 1,
  "generatedBy": "youtubedownloader-update-local-macos.sh",
  "generatedAtUtc": "$(json_escape "${generated_at}")",
  "nodePath": "",
  "pythonPath": "$(json_escape "${python_path}")",
  "ytDlpPath": "",
  "ffmpegPath": "$(json_escape "${ffmpeg_path}")",
  "denoPath": "$(json_escape "${deno_path}")"
}
EOF
    chmod 600 "${CONFIG_FILE}" 2>/dev/null || true
    log_info "Runtime config written: ${CONFIG_FILE}"
    return
  fi

  log_info "WARNING: no runtime config was found or created."
}

if [ "$(id -u)" -eq 0 ]; then
  echo "ERROR: Do not run this updater with sudo." >&2
  echo "Run UPDATE_LOCAL_MACOS.sh normally from your user account." >&2
  exit 1
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "ERROR: rsync is required for the local updater." >&2
  exit 1
fi

assert_source_folder "client"
assert_source_folder "host"
assert_source_folder "CSXS"

log_info "Updating local CEP plugin from ${REPO_ROOT}"
log_info "Destination: ${DESTINATION}"

if [ "${DRY_RUN}" -eq 0 ]; then
  mkdir -p "${DESTINATION}"
fi

copy_folder "${REPO_ROOT}/client" "${DESTINATION}/client" \
  --exclude "/js/config.json"
copy_folder "${REPO_ROOT}/host" "${DESTINATION}/host"
copy_folder "${REPO_ROOT}/CSXS" "${DESTINATION}/CSXS"

for file_name in ".debug" "README.md" "INSTALLATION_GUIDE.md" "UPDATE_DEPENDENCIES.sh" "UPDATE_LOCAL_MACOS.sh" "scripts/youtubedownloader-update-local-macos.sh"; do
  copy_optional_file "${file_name}"
done

write_runtime_config_if_needed
enable_cep_debug_mode

if [ "${DRY_RUN}" -eq 0 ]; then
  chmod +x "${DESTINATION}/UPDATE_LOCAL_MACOS.sh" 2>/dev/null || true
  chmod +x "${DESTINATION}/UPDATE_DEPENDENCIES.sh" 2>/dev/null || true
fi

log_info "Local update complete. Restart Premiere Pro, then open Window > Extensions > YouTube Downloader."

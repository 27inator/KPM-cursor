#!/usr/bin/env bash
set -euo pipefail

# KMP PEA bootstrap installer
# Usage:
#   scripts/bootstrap-pea.sh --bus http://kmp.example.com:3001 \
#     --company-id 1 --secret <provision_secret> [--channel stable] [--dry-run]
#
# Env overrides:
#   PEA_DOWNLOAD_URL: direct URL to pea-agent binary (if not provided, uses local build fallback)
#   INSTALL_PREFIX: install prefix (default /usr/local)
#

BUS_URL=""
COMPANY_ID=""
SECRET=""
CHANNEL="stable"
DRY_RUN=0

err() { echo "[bootstrap] $*" >&2; }
log() { echo "[bootstrap] $*"; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bus) BUS_URL="$2"; shift 2 ;;
    --company-id) COMPANY_ID="$2"; shift 2 ;;
    --secret) SECRET="$2"; shift 2 ;;
    --channel) CHANNEL="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    *) err "Unknown arg: $1"; exit 2 ;;
  esac
done

if [[ -z "$BUS_URL" || -z "$COMPANY_ID" || -z "$SECRET" ]]; then
  err "Missing required args. Example: --bus http://localhost:3001 --company-id 1 --secret dev-provision-secret"
  exit 2
fi

OS="$(uname -s | tr 'A-Z' 'a-z')"
ARCH="$(uname -m)"
INSTALL_PREFIX="${INSTALL_PREFIX:-/usr/local}"
BIN_DIR="$INSTALL_PREFIX/bin"
BIN_NAME="kmp-pea"
TARGET_BIN="$BIN_DIR/$BIN_NAME"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOCAL_BUILD_BIN="$REPO_ROOT/pea-agent/target/release/pea-agent"
LOCAL_BUILD_BIN_DBG="$REPO_ROOT/pea-agent/target/debug/pea-agent"

log "Detected OS=$OS ARCH=$ARCH"

ensure_dirs() {
  if [[ $DRY_RUN -eq 1 ]]; then log "DRY: mkdir -p $BIN_DIR"; else mkdir -p "$BIN_DIR"; fi
}

install_binary() {
  if [[ -n "${PEA_DOWNLOAD_URL:-}" ]]; then
    log "Downloading binary from PEA_DOWNLOAD_URL=$PEA_DOWNLOAD_URL"
    if [[ $DRY_RUN -eq 1 ]]; then log "DRY: curl -fsSL $PEA_DOWNLOAD_URL -o $TARGET_BIN && chmod +x $TARGET_BIN"; else curl -fsSL "$PEA_DOWNLOAD_URL" -o "$TARGET_BIN" && chmod +x "$TARGET_BIN"; fi
    return
  fi
  # Fallback: use locally built binary
  if [[ -x "$LOCAL_BUILD_BIN" ]]; then
    log "Using local release build: $LOCAL_BUILD_BIN"
    if [[ $DRY_RUN -eq 1 ]]; then log "DRY: install -m 0755 $LOCAL_BUILD_BIN $TARGET_BIN"; else install -m 0755 "$LOCAL_BUILD_BIN" "$TARGET_BIN"; fi
  elif [[ -x "$LOCAL_BUILD_BIN_DBG" ]]; then
    log "Using local debug build: $LOCAL_BUILD_BIN_DBG"
    if [[ $DRY_RUN -eq 1 ]]; then log "DRY: install -m 0755 $LOCAL_BUILD_BIN_DBG $TARGET_BIN"; else install -m 0755 "$LOCAL_BUILD_BIN_DBG" "$TARGET_BIN"; fi
  else
    err "No local binary found. Build pea-agent first or set PEA_DOWNLOAD_URL"
    exit 1
  fi
}

install_service() {
  case "$OS" in
    linux)
      local svc="$REPO_ROOT/pea-agent/installers/linux/install.sh"
      if [[ -f "$svc" ]]; then
        if [[ $DRY_RUN -eq 1 ]]; then log "DRY: sudo bash $svc"; else sudo bash "$svc"; fi
      else
        log "Linux installer not found; skipping service install"
      fi
      ;;
    darwin)
      local svc="$REPO_ROOT/pea-agent/installers/macos/install.sh"
      if [[ -f "$svc" ]]; then
        if [[ $DRY_RUN -eq 1 ]]; then log "DRY: bash $svc"; else bash "$svc"; fi
      else
        log "macOS installer not found; skipping service install"
      fi
      ;;
    msys*|mingw*|cygwin*)
      log "Windows detected; please run pea-agent/installers/windows/install.ps1 as Administrator"
      ;;
    *)
      log "Unknown OS=$OS; skipping service install"
      ;;
  esac
}

provision_device() {
  local cmd=("$TARGET_BIN" --bus "$BUS_URL" provision --secret "$SECRET" --company "$COMPANY_ID")
  if [[ $DRY_RUN -eq 1 ]]; then log "DRY: ${cmd[*]}"; else "${cmd[@]}"; fi
}

start_service() {
  case "$OS" in
    linux)
      if [[ $DRY_RUN -eq 1 ]]; then log "DRY: sudo systemctl enable --now pea-agent.service"; else sudo systemctl enable --now pea-agent.service || true; fi
      ;;
    darwin)
      if [[ $DRY_RUN -eq 1 ]]; then log "DRY: launchctl load -w ~/Library/LaunchAgents/com.kmp.pea-agent.plist"; else launchctl load -w ~/Library/LaunchAgents/com.kmp.pea-agent.plist || true; fi
      ;;
    *)
      ;;
  esac
}

main() {
  ensure_dirs
  install_binary
  install_service
  provision_device
  start_service
  log "Bootstrap completed. Agent should be running and provisioned."
}

main "$@" 
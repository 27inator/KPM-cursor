#!/usr/bin/env bash
set -euo pipefail

# macOS launchd user service installer for pea-agent
# Usage: ./install.sh [/absolute/path/to/pea-agent] [--bus http://localhost:3001] [--hb 3600] [--qd 30]

BIN_PATH="${1:-}"
shift || true
ARGS=("$@")

if [[ -z "${BIN_PATH}" ]]; then
  # Try common build output
  if [[ -x "$(pwd)/../target/release/pea-agent" ]]; then
    BIN_PATH="$(cd "$(pwd)/.." && pwd)/target/release/pea-agent"
  elif [[ -x "$(pwd)/../target/debug/pea-agent" ]]; then
    BIN_PATH="$(cd "$(pwd)/.." && pwd)/target/debug/pea-agent"
  else
    echo "Provide absolute path to pea-agent binary as first argument" >&2
    exit 1
  fi
fi

if [[ "${BIN_PATH:0:1}" != "/" ]]; then
  echo "Please provide an absolute path to the pea-agent binary" >&2
  exit 1
fi

LABEL="com.kmp.pea-agent"
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_PATH="$PLIST_DIR/${LABEL}.plist"
mkdir -p "$PLIST_DIR"

# Default args
BUS_URL="http://localhost:3001"
HB="3600"
QD="30"

# Parse optional flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --bus) BUS_URL="$2"; shift 2;;
    --hb) HB="$2"; shift 2;;
    --qd) QD="$2"; shift 2;;
    *) shift;;
  esac
done

cat >"$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${BIN_PATH}</string>
    <string>run</string>
    <string>--bus</string><string>${BUS_URL}</string>
    <string>--hb</string><string>${HB}</string>
    <string>--qd</string><string>${QD}</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PEA_VAULT_BACKEND</key><string>OsKeychain</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>${HOME}/Library/Logs/pea-agent.out.log</string>
  <key>StandardErrorPath</key><string>${HOME}/Library/Logs/pea-agent.err.log</string>
</dict>
</plist>
PLIST

echo "Loaded plist at ${PLIST_PATH}"
launchctl unload "$PLIST_PATH" >/dev/null 2>&1 || true
launchctl load "$PLIST_PATH"
launchctl start "$LABEL" || true
echo "pea-agent launchd service started (label: ${LABEL})" 
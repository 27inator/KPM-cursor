#!/usr/bin/env bash
set -euo pipefail

# Linux systemd --user service installer for pea-agent
# Usage: ./install.sh [/absolute/path/to/pea-agent] [--bus http://localhost:3001] [--hb 3600] [--qd 30]

BIN_PATH="${1:-}"
shift || true
ARGS=("$@")

if [[ -z "${BIN_PATH}" ]]; then
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

BUS_URL="http://localhost:3001"; HB="3600"; QD="30"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --bus) BUS_URL="$2"; shift 2;;
    --hb) HB="$2"; shift 2;;
    --qd) QD="$2"; shift 2;;
    *) shift;;
  esac
done

UNIT_DIR="$HOME/.config/systemd/user"
mkdir -p "$UNIT_DIR"
UNIT_PATH="$UNIT_DIR/pea-agent.service"

cat >"$UNIT_PATH" <<UNIT
[Unit]
Description=KMP PEA Agent
After=network-online.target

[Service]
ExecStart=${BIN_PATH} run --bus ${BUS_URL} --hb ${HB} --qd ${QD}
Environment=PEA_VAULT_BACKEND=File
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
UNIT

systemctl --user daemon-reload
systemctl --user enable --now pea-agent.service

echo "pea-agent systemd --user service installed and started" 
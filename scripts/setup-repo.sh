#!/usr/bin/env bash
set -euo pipefail

PINNED_FPR=${PINNED_FPR:-"AF2DB75A7F562C9D9DE10BE89373749038070802"}
ROOT_URL=${ROOT_URL:-"https://install.kpm.io/keys/public-root.gpg"}

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  echo "This script must run as root (sudo)." >&2
  exit 1
fi

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

curl -fsSL "$ROOT_URL" -o "$TMPDIR/public-root.gpg"

gpg --import "$TMPDIR/public-root.gpg"
FPR=$(gpg --with-colons --fingerprint | awk -F: '/^fpr:/ {print $10; exit}')

echo "Master fingerprint: $FPR"
if [ "$FPR" != "$PINNED_FPR" ]; then
  echo "Fingerprint mismatch! Expected $PINNED_FPR" >&2
  exit 2
fi

if command -v apt-get >/dev/null 2>&1; then
  install -m 0644 /dev/null /etc/apt/sources.list.d/kpm.list
  cat > /etc/apt/sources.list.d/kpm.list <<EOF
deb [signed-by=/usr/share/keyrings/kpm.gpg] https://packages.kpm.io/apt stable main
EOF
  install -d -m 0755 /usr/share/keyrings
  cp "$TMPDIR/public-root.gpg" /usr/share/keyrings/kpm.gpg
  apt-get update
elif command -v yum >/dev/null 2>&1 || command -v dnf >/dev/null 2>&1; then
  REPO_FILE=/etc/yum.repos.d/kpm.repo
  cat > "$REPO_FILE" <<EOF
[kpm]
name=KPM Packages
baseurl=https://packages.kpm.io/rpm/
enabled=1
gpgcheck=1
gpgkey=https://install.kpm.io/keys/public-root.gpg
repo_gpgcheck=1
EOF
  if command -v dnf >/dev/null 2>&1; then dnf clean all && dnf repolist; else yum clean all && yum repolist; fi
else
  echo "Unsupported package manager. Configure manually." >&2
  exit 3
fi

echo "Repository configured successfully." 
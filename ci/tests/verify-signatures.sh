#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <release-tag> <repo (owner/name)>" >&2
  exit 2
fi
TAG="$1"
REPO="$2"

mkdir -p dist

# Import root key
if [ -f ci/keys/public-root.gpg ]; then
  gpg --import ci/keys/public-root.gpg
else
  curl -fsSL https://install.kpm.io/keys/public-root.gpg | gpg --import
fi

# Fetch asset list
ASSETS_JSON=$(curl -sSL "https://api.github.com/repos/${REPO}/releases/tags/${TAG}")
URLS=$(echo "$ASSETS_JSON" | jq -r '.assets[].browser_download_url')

# Download artifacts and signatures
for url in $URLS; do
  fname=$(basename "$url")
  curl -sSL -o "dist/${fname}" "$url"

done

# Verify
FAIL=0
for f in dist/*.{tar.gz,zip}; do
  [ -e "$f" ] || continue
  if [ ! -f "${f}.asc" ]; then echo "Missing signature for $f" >&2; FAIL=1; continue; fi
  if ! gpg --verify "${f}.asc" "$f"; then FAIL=1; fi

done

exit $FAIL 
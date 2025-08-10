#!/usr/bin/env bash
set -euo pipefail

# Verify all *.sha256 files in the current directory
# Usage: (cd dist && ../../scripts/ci-verify-sha256.sh)

shopt -s nullglob
files=( *.sha256 )
if (( ${#files[@]} == 0 )); then
  echo "[verify] No .sha256 files found" >&2
  exit 1
fi

fail=0
for f in "${files[@]}"; do
  target="${f%.sha256}"
  if [[ ! -f "$target" ]]; then
    echo "[verify] Missing artifact for $f" >&2
    fail=1
    continue
  fi
  echo "[verify] Checking $target"
  calc=$(shasum -a 256 "$target" | awk '{print $1}')
  ref=$(awk '{print $1}' "$f")
  if [[ "$calc" != "$ref" ]]; then
    echo "[verify] MISMATCH: $target" >&2
    fail=1
  else
    echo "[verify] OK: $target"
  fi
done

exit $fail 
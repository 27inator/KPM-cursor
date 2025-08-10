#!/usr/bin/env bash
set -euo pipefail

MASTER_UID="KMP PEA Release Root"
DAYS_VALID=365
KEYS_DIR="ci/keys"
mkdir -p "$KEYS_DIR"

echo "[i] Rotating signing subkey for: $MASTER_UID"

# Create a new signing subkey for the existing master
cat > /tmp/gpg-batch-rotate.txt <<EOF
Key-Type: RSA
Key-Length: 4096
Subkey-Usage: sign
Expire-Date: ${DAYS_VALID}d
%commit
EOF

gpg --batch --quick-add-key "$MASTER_UID" rsa4096 sign ${DAYS_VALID}d

# Export updated public root
rm -f "$KEYS_DIR/public-root.gpg"
gpg --output "$KEYS_DIR/public-root.gpg" --export "$MASTER_UID"

echo "[i] Exporting secret subkeys (protect with passphrase and store securely)"
rm -f "$KEYS_DIR/signing-subkeys.gpg"
gpg --output "$KEYS_DIR/signing-subkeys.gpg" --armor --export-secret-subkeys "$MASTER_UID"

echo "[ok] Rotation complete. Update CI secrets with new signing-subkeys if passphrase changed." 
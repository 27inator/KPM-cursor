# KMP PEA GPG Signing

This project uses a split-key model:

- Master key (RSA-4096, certify-only, offline). Used to certify subkeys and publish the public root.
- Online signing subkey (RSA-4096, sign-only, 1-year expiry). Used by CI to sign release artifacts.

## Import and pin the master key

Verify the fingerprint before trusting:

```
curl -fsSL https://install.kpm.io/keys/public-root.gpg | gpg --import
gpg --fingerprint "KMP PEA Release Root"
# Compare to pinned fingerprint in docs and scripts
```

Pinned fingerprint: AF2DB75A7F562C9D9DE10BE89373749038070802

## Verify artifacts

```
# Download artifact and .asc
curl -LO https://github.com/<org>/<repo>/releases/download/v1.2.3/kpm-pea-agent_1.2.3_linux_amd64.tar.gz
curl -LO https://github.com/<org>/<repo>/releases/download/v1.2.3/kpm-pea-agent_1.2.3_linux_amd64.tar.gz.asc

# Import root and verify
curl -fsSL https://install.kpm.io/keys/public-root.gpg | gpg --import
gpg --verify kpm-pea-agent_1.2.3_linux_amd64.tar.gz.asc kpm-pea-agent_1.2.3_linux_amd64.tar.gz
```

## Subkey rotation

Use `ci/rotate-subkey.sh` to revoke the old subkey, add a new signing subkey, and export updated keys:

```
./ci/rotate-subkey.sh
# Outputs updated ci/keys/public-root.gpg and signing-subkeys.gpg
```

Ensure CI secrets are updated with the new subkey and passphrase. 
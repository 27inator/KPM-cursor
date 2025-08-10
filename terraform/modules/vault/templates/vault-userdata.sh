#!/bin/bash

# ====================================
# KMP SUPPLY CHAIN - VAULT SETUP
# Auto-unsealing HashiCorp Vault with KMS
# ====================================

set -e

# Variables from Terraform
KMS_KEY_ID="${kms_key_id}"
REGION="${region}"
VAULT_VERSION="${vault_version}"
CLUSTER_NAME="${cluster_name}"

# System setup
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y unzip curl jq awscli

# Create vault user
useradd --system --home /etc/vault --shell /bin/false vault

# Download and install Vault
cd /tmp
wget https://releases.hashicorp.com/vault/$${VAULT_VERSION}/vault_$${VAULT_VERSION}_linux_amd64.zip
unzip vault_$${VAULT_VERSION}_linux_amd64.zip
mv vault /usr/local/bin/
chmod +x /usr/local/bin/vault

# Create directories
mkdir -p /opt/vault/data
mkdir -p /etc/vault
chown -R vault:vault /opt/vault
chown -R vault:vault /etc/vault

# Get instance metadata
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
LOCAL_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)

# Create Vault configuration
cat > /etc/vault/vault.hcl << EOF
# Full configuration options can be found at https://vaultproject.io/docs/configuration

ui = true

#mlock = true
#disable_mlock = true

storage "consul" {
  address = "127.0.0.1:8500"
  path    = "vault"
}

storage "file" {
  path = "/opt/vault/data"
}

# HTTP listener
listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = 1
}

# HTTPS listener (for production)
# listener "tcp" {
#   address       = "0.0.0.0:8200"
#   tls_cert_file = "/opt/vault/tls/tls.crt"
#   tls_key_file  = "/opt/vault/tls/tls.key"
# }

# Enterprise license_path
# license_path = "/etc/vault/vault.hclic"

# Example AWS KMS auto unseal
seal "awskms" {
  region     = "$${REGION}"
  kms_key_id = "$${KMS_KEY_ID}"
}

# Example configuration for using auto-unseal, using Google Cloud KMS. The
# GKMS keys must already exist, and the GCE instance must have the proper
# scopes to access GCP KMS.
#seal "gcpckms" {
#   project     = "vault-helm-dev"
#   region      = "global"
#   key_ring    = "vault-helm-unseal-kr"
#   crypto_key  = "vault-helm-unseal-key"
#}

# Example configuration for using auto-unseal, using Hashicorp-supported
# Vault Auto-unseal wrapper. The Vault Enterprise Auto-unseal keys must already exist.
#seal "kubernetes" {
#   role_id   = "my-role-id"
#   secret_id = "my-secret-id"
#}

cluster_addr  = "https://$${LOCAL_IP}:8201"
api_addr      = "https://$${LOCAL_IP}:8200"

log_level = "Info"
log_file  = "/opt/vault/logs/vault.log"
log_rotate_duration = "24h"
log_rotate_max_files = 30

# Enable service registration
service_registration "consul" {
  address      = "127.0.0.1:8500"
  service_name = "vault"
}

plugin_directory = "/etc/vault/plugins"
EOF

# Create systemd service
cat > /etc/systemd/system/vault.service << EOF
[Unit]
Description=HashiCorp Vault
Documentation=https://vaultproject.io/docs/
Requires=network-online.target
After=network-online.target
ConditionFileNotEmpty=/etc/vault/vault.hcl
StartLimitIntervalSec=60
StartLimitBurst=3

[Service]
Type=notify
User=vault
Group=vault
ProtectSystem=full
ProtectHome=read-only
PrivateTmp=yes
PrivateDevices=yes
SecureBits=keep-caps
AmbientCapabilities=CAP_IPC_LOCK
CapabilityBoundingSet=CAP_SYSLOG CAP_IPC_LOCK
NoNewPrivileges=yes
ExecStart=/usr/local/bin/vault server -config=/etc/vault/vault.hcl
ExecReload=/bin/kill --signal HUP \$MAINPID
KillMode=process
KillSignal=SIGINT
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
StartLimitInterval=60
StartLimitBurst=3
LimitNOFILE=65536
LimitMEMLOCK=infinity

[Install]
WantedBy=multi-user.target
EOF

# Create log directory
mkdir -p /opt/vault/logs
chown -R vault:vault /opt/vault/logs

# Set file permissions
chown -R vault:vault /etc/vault
chmod 640 /etc/vault/vault.hcl

# Enable and start Vault service
systemctl daemon-reload
systemctl enable vault
systemctl start vault

# Wait for Vault to start
sleep 30

# Initialize Vault if this is the first node
export VAULT_ADDR="http://127.0.0.1:8200"

# Check if Vault is already initialized
if vault status | grep -q "Initialized.*false"; then
    echo "Initializing Vault..."
    
    # Initialize Vault
    vault operator init -key-shares=5 -key-threshold=3 -format=json > /tmp/vault-init.json
    
    # Extract keys and root token
    UNSEAL_KEY_1=$(cat /tmp/vault-init.json | jq -r '.unseal_keys_b64[0]')
    UNSEAL_KEY_2=$(cat /tmp/vault-init.json | jq -r '.unseal_keys_b64[1]')
    UNSEAL_KEY_3=$(cat /tmp/vault-init.json | jq -r '.unseal_keys_b64[2]')
    ROOT_TOKEN=$(cat /tmp/vault-init.json | jq -r '.root_token')
    
    # Store keys in AWS Secrets Manager
    aws secretsmanager create-secret \
        --name "$${CLUSTER_NAME}/vault/unseal-keys" \
        --description "Vault unseal keys for $${CLUSTER_NAME}" \
        --secret-string "{\"key1\":\"$${UNSEAL_KEY_1}\",\"key2\":\"$${UNSEAL_KEY_2}\",\"key3\":\"$${UNSEAL_KEY_3}\"}" \
        --region $${REGION} || true
    
    aws secretsmanager create-secret \
        --name "$${CLUSTER_NAME}/vault/root-token" \
        --description "Vault root token for $${CLUSTER_NAME}" \
        --secret-string "$${ROOT_TOKEN}" \
        --region $${REGION} || true
    
    # Clean up local copy
    rm -f /tmp/vault-init.json
    
    echo "Vault initialized successfully!"
else
    echo "Vault is already initialized"
fi

# Create KMP-specific configuration script
cat > /opt/vault/configure-kmp.sh << 'EOF'
#!/bin/bash

# KMP Supply Chain Vault Configuration
export VAULT_ADDR="http://127.0.0.1:8200"

# Get root token from AWS Secrets Manager
ROOT_TOKEN=$(aws secretsmanager get-secret-value \
    --secret-id "${CLUSTER_NAME}/vault/root-token" \
    --region ${REGION} \
    --query SecretString --output text)

export VAULT_TOKEN=$ROOT_TOKEN

# Enable KV secrets engine for KMP
vault secrets enable -path=kmp-secrets kv-v2

# Create KMP secrets
vault kv put kmp-secrets/database \
    username="kmp_user" \
    password="$(openssl rand -base64 32)"

vault kv put kmp-secrets/jwt \
    secret="$(openssl rand -base64 64)"

vault kv put kmp-secrets/blockchain \
    mnemonic="mutual alley control inspire cloth alcohol venture invite decade floor crawl sail" \
    address="kaspatest:qpxm5tpyg8p6z7f6hy9mtlwz2es03cqtavaldsctcdltmnz6yfz6gvurgpmem"

vault kv put kmp-secrets/api \
    admin_password="$(openssl rand -base64 24)" \
    monitoring_password="$(openssl rand -base64 24)"

# Enable Kubernetes auth
vault auth enable kubernetes

echo "KMP Vault configuration completed!"
EOF

chmod +x /opt/vault/configure-kmp.sh
chown vault:vault /opt/vault/configure-kmp.sh

# Run KMP configuration after a delay (allows cluster to stabilize)
(sleep 60 && /opt/vault/configure-kmp.sh) &

echo "Vault setup completed successfully!" 
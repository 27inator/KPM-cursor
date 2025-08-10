# KMP PEA Agent - Quickstart Guide

**Get your supply chain scanners connected to the Kaspa blockchain in 10 minutes!**

## 🚀 Quick Installation

### Windows (MSI Installer)
```powershell
# Download and install
Invoke-WebRequest -Uri "https://releases.kmp.io/pea-agent/latest/KMP-PEA-Agent-1.0.0.msi" -OutFile "pea-agent.msi"
Start-Process msiexec.exe -ArgumentList "/i pea-agent.msi /quiet" -Wait

# Verify installation
pea-agent status
```

### macOS (PKG Installer)
```bash
# Download and install
curl -L "https://releases.kmp.io/pea-agent/latest/KMP-PEA-Agent-1.0.0.pkg" -o pea-agent.pkg
sudo installer -pkg pea-agent.pkg -target /

# Verify installation
pea-agent status
```

### Linux (Package Manager)
```bash
# Ubuntu/Debian
wget https://releases.kmp.io/pea-agent/latest/kmp-pea-agent_1.0.0_amd64.deb
sudo dpkg -i kmp-pea-agent_1.0.0_amd64.deb

# Red Hat/CentOS/Fedora
wget https://releases.kmp.io/pea-agent/latest/kmp-pea-agent-1.0.0-1.x86_64.rpm
sudo rpm -i kmp-pea-agent-1.0.0-1.x86_64.rpm

# Verify installation
pea-agent status
```

## 🔧 Initial Setup

### 1. Check System Status
```bash
pea-agent status
```

**Expected Output:**
```
✅ KMP PEA Agent Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Service Status:     Running
🔑 Keys Status:        Not Initialized
📱 Scanners Found:     0 devices
🌐 Network Status:     Connected
⏱️  Uptime:            2m 34s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  Device needs provisioning - run 'pea-agent provision'
```

### 2. Connect Your Scanner
1. **Plug in your barcode/QR scanner** via USB or pair via Bluetooth
2. **Test scanner detection:**
   ```bash
   pea-agent test-scanners
   ```

**Expected Output:**
```
🔍 Scanner Detection Test
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Found USB HID Scanner:
   📱 Device: Honeywell Voyager 1200g
   🔌 Port: /dev/hidraw0
   📊 Status: Ready
   
✅ Found USB Serial Scanner:
   📱 Device: Zebra DS2208
   🔌 Port: /dev/ttyUSB0
   📊 Status: Ready

🎉 Total Scanners Found: 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Tip: Scan a test barcode to verify functionality
```

### 3. Provision Your Device
```bash
# Replace with your KMP provisioning server URL
pea-agent provision --server https://provision.kmp.io
```

**Expected Output:**
```
🔐 KMP Device Provisioning
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 Generating device keys...          ✅ Complete
🏭 Collecting device metadata...       ✅ Complete  
🤝 Contacting provisioning server...   ✅ Complete
🔒 Performing mTLS handshake...        ✅ Complete
📋 Submitting provisioning request... ✅ Complete
🌳 Verifying Merkle proof...          ✅ Complete
🎫 Storing trust token...             ✅ Complete

🎉 Device Successfully Provisioned!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 Device ID: pea-device-7f8a9b2c
🔑 Public Key: ed25519:a1b2c3d4e5f6...
⏰ Provisioned: 2024-01-15 10:30:45 UTC
🎫 Token Expires: 2024-04-15 10:30:45 UTC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 📦 Test Your First Scan

### 1. Scan a Test Barcode
1. **Scan any barcode/QR code** with your connected scanner
2. **Watch the magic happen:**

```bash
# Monitor real-time activity
pea-agent logs --follow
```

**Expected Output:**
```
2024-01-15T10:35:12Z [INFO] 📱 Scanner event detected: Honeywell Voyager 1200g
2024-01-15T10:35:12Z [INFO] 📊 Barcode scanned: 1234567890123
2024-01-15T10:35:12Z [INFO] 🔐 Signing scan event with subkey: subkey-2024-01-15
2024-01-15T10:35:12Z [INFO] 🌐 Submitting to Kaspa blockchain...
2024-01-15T10:35:15Z [INFO] ✅ Transaction confirmed: tx_a1b2c3d4e5f6789...
2024-01-15T10:35:15Z [INFO] 🔗 Explorer URL: https://kas.fyi/transaction/tx_a1b2c3d4e5f6789...
2024-01-15T10:35:15Z [INFO] 📋 Audit log updated: event_uuid_12345
```

### 2. Verify Blockchain Submission
```bash
pea-agent status
```

**Updated Output:**
```
✅ KMP PEA Agent Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Service Status:     Running
🔑 Keys Status:        Provisioned ✅
📱 Scanners Found:     2 devices
🌐 Network Status:     Connected
⏱️  Uptime:            12m 8s

📈 Recent Activity:
   🔹 Scans Today:       1
   🔹 Successful:        1 (100%)
   🔹 Failed:            0 (0%)
   🔹 Last Transaction:  tx_a1b2c3d4e5f6789... (2m ago)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Your supply chain is now blockchain-secured!
```

## ⚙️ Configuration

### Basic Configuration
Edit the configuration file:

**Windows:** `C:\ProgramData\KMP PEA Agent\config\config.yaml`  
**macOS:** `/usr/local/etc/kmp-pea-agent/config.yaml`  
**Linux:** `/etc/kmp-pea-agent/config.yaml`

```yaml
# Basic KMP PEA Agent Configuration
kaspa:
  # Kaspa node endpoints (primary + fallbacks)
  rpc_endpoints:
    - "grpc://n-testnet-10.kaspa.ws:16210"
    - "grpc://kaspa-node-backup.kmp.io:16210"
  
  # Transaction settings
  fee_rate: "1000"  # sompi per gram
  max_fee: "10000000"  # 0.1 KAS maximum fee

scanners:
  # Scanner auto-discovery
  auto_discovery: true
  
  # Scanner types to detect
  enabled_types:
    - "usb_hid"
    - "usb_serial" 
    - "bluetooth"
  
  # Polling interval for new scanners
  discovery_interval_seconds: 30

logging:
  # Log level (trace, debug, info, warn, error)
  level: "info"
  
  # Enable audit logging
  audit_enabled: true
  
  # Log rotation
  max_size_mb: 100
  max_files: 10

monitoring:
  # Optional: KMP monitoring server
  server_url: "https://monitor.kmp.io"
  
  # Heartbeat interval
  heartbeat_interval_hours: 12
  
  # Enable anomaly detection
  anomaly_detection: true
```

### Advanced Configuration

**Security Settings:**
```yaml
security:
  # Enable sandboxing
  enable_sandboxing: true
  
  # Drop privileges after startup
  drop_privileges: true
  
  # Network restrictions
  network_restrictions:
    require_tls: true
    allowed_hosts:
      - "provision.kmp.io"
      - "monitor.kmp.io" 
      - "*.kaspa.ws"
```

**Restart after configuration changes:**
```bash
# Windows
Restart-Service "KMPPeaAgent"

# macOS
sudo launchctl unload /Library/LaunchDaemons/io.kmp.pea-agent.plist
sudo launchctl load /Library/LaunchDaemons/io.kmp.pea-agent.plist

# Linux
sudo systemctl restart kmp-pea-agent
```

## 🔧 Common Commands

### Status & Information
```bash
pea-agent status              # Show agent status
pea-agent version             # Show version info
pea-agent config              # Display current config
pea-agent test-scanners       # Test scanner connectivity
```

### Maintenance
```bash
pea-agent logs                # View recent logs
pea-agent logs --follow       # Monitor real-time logs
pea-agent verify              # Verify installation
pea-agent rotate-keys         # Manually rotate keys
```

### Troubleshooting
```bash
pea-agent diagnose            # Run diagnostic checks
pea-agent reset --confirm     # Reset device (destructive!)
pea-agent uninstall --confirm # Complete removal
```

## 🛠️ Troubleshooting

### Scanner Not Detected
1. **Check USB connection:**
   ```bash
   # Linux
   lsusb | grep -i scanner
   
   # macOS
   system_profiler SPUSBDataType | grep -i scanner
   
   # Windows
   Get-PnpDevice | Where-Object {$_.FriendlyName -like "*scanner*"}
   ```

2. **Check permissions (Linux):**
   ```bash
   # Add user to dialout group for serial scanners
   sudo usermod -a -G dialout kmp-pea-agent
   sudo systemctl restart kmp-pea-agent
   ```

3. **Test manual scanner input:**
   ```bash
   pea-agent test-scanners --manual
   # Then scan a barcode when prompted
   ```

### Network Connection Issues
1. **Test connectivity:**
   ```bash
   pea-agent diagnose --network
   ```

2. **Check firewall settings:**
   ```bash
   # Allow outbound connections to:
   # - provision.kmp.io:443 (HTTPS)
   # - monitor.kmp.io:443 (HTTPS)  
   # - *.kaspa.ws:16210 (Kaspa RPC)
   ```

3. **Verify DNS resolution:**
   ```bash
   nslookup provision.kmp.io
   nslookup n-testnet-10.kaspa.ws
   ```

### Service Won't Start
1. **Check service status:**
   ```bash
   # Windows
   Get-Service "KMPPeaAgent"
   
   # macOS
   sudo launchctl list | grep kmp-pea-agent
   
   # Linux
   sudo systemctl status kmp-pea-agent
   ```

2. **View detailed logs:**
   ```bash
   # Windows
   Get-EventLog -LogName Application -Source "KMP PEA Agent"
   
   # macOS
   sudo log show --predicate 'subsystem == "io.kmp.pea-agent"'
   
   # Linux
   sudo journalctl -u kmp-pea-agent -f
   ```

3. **Check file permissions:**
   ```bash
   # Ensure config files are readable
   ls -la /etc/kmp-pea-agent/
   ls -la /var/lib/kmp-pea-agent/
   ```

## 📞 Support

### Self-Service Resources
- **Documentation:** https://docs.kmp.io/pea-agent
- **FAQ:** https://docs.kmp.io/faq
- **Community Forum:** https://community.kmp.io
- **Status Page:** https://status.kmp.io

### Enterprise Support
- **Email:** support@kmp.io
- **Phone:** +1-800-KMP-HELP
- **Priority Support:** enterprise@kmp.io
- **Emergency Hotline:** +1-800-KMP-URGENT

### Before Contacting Support
Run the diagnostic tool and include the output:
```bash
pea-agent diagnose --full > diagnostic-report.txt
```

## 🎉 Next Steps

### Production Deployment
1. **Scale to Multiple Devices:**
   - Use configuration management (Ansible, Puppet, Chef)
   - Deploy via group policy (Windows) or MDM (macOS)
   - Automate provisioning with API integration

2. **Monitor Your Fleet:**
   - Set up centralized monitoring dashboard
   - Configure alerting for offline devices
   - Implement automated health checks

3. **Integrate with ERP Systems:**
   - Connect to SAP, Oracle, or custom systems
   - Set up real-time data synchronization
   - Configure business rule automation

### Advanced Features
- **Custom Scanner Integration:** Plugin development for proprietary scanners
- **Offline Operation:** Extended offline capabilities with local queuing
- **High Availability:** Multi-node deployment with failover
- **Enterprise SSO:** Integration with Active Directory/LDAP

---

## 🚀 You're Ready!

Your KMP PEA Agent is now:
- ✅ **Installed** and running as a system service
- ✅ **Provisioned** with unique cryptographic identity
- ✅ **Connected** to scanners and blockchain network
- ✅ **Securing** your supply chain with every scan

**Every barcode scan is now cryptographically signed and permanently recorded on the Kaspa blockchain!**

---

*Need help? Join our community at https://community.kmp.io or contact support@kmp.io* 
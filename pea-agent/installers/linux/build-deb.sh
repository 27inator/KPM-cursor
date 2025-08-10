#!/bin/bash
set -e

# Debian DEB package build script for KMP PEA Agent
# Requires: dpkg-deb, fakeroot

PACKAGE_NAME="kmp-pea-agent"
PACKAGE_VERSION="1.0.0"
ARCHITECTURE="amd64"  # or arm64
MAINTAINER="KMP Technologies <support@kmp.io>"
DESCRIPTION="Kaspa Provenance Model Per-Device Edge Agent"
HOMEPAGE="https://kmp.io"

BUILD_DIR="build-deb"
PACKAGE_DIR="$BUILD_DIR/$PACKAGE_NAME-$PACKAGE_VERSION"

echo "🐧 Building Debian DEB package for $PACKAGE_NAME v$PACKAGE_VERSION"

# Clean and create build directory
rm -rf "$BUILD_DIR"
mkdir -p "$PACKAGE_DIR"

# Create directory structure
mkdir -p "$PACKAGE_DIR/DEBIAN"
mkdir -p "$PACKAGE_DIR/usr/bin"
mkdir -p "$PACKAGE_DIR/usr/lib/kmp-pea-agent"
mkdir -p "$PACKAGE_DIR/etc/kmp-pea-agent"
mkdir -p "$PACKAGE_DIR/etc/systemd/system"
mkdir -p "$PACKAGE_DIR/var/log/kmp-pea-agent"
mkdir -p "$PACKAGE_DIR/var/lib/kmp-pea-agent"
mkdir -p "$PACKAGE_DIR/usr/share/doc/kmp-pea-agent"
mkdir -p "$PACKAGE_DIR/usr/share/man/man1"

echo "📦 Copying application files..."

# Copy binaries
cp "../../target/release/pea-agent" "$PACKAGE_DIR/usr/bin/"
cp "../../target/release/pea-daemon" "$PACKAGE_DIR/usr/lib/kmp-pea-agent/"

# Copy configuration
cp "../../config/default.yaml" "$PACKAGE_DIR/etc/kmp-pea-agent/config.yaml"

# Copy documentation
cp "../../README.md" "$PACKAGE_DIR/usr/share/doc/kmp-pea-agent/"
cp "../../LICENSE" "$PACKAGE_DIR/usr/share/doc/kmp-pea-agent/"
cp "../../SECURITY_WHITEPAPER.md" "$PACKAGE_DIR/usr/share/doc/kmp-pea-agent/"

# Create systemd service file
echo "🔧 Creating systemd service..."
cat > "$PACKAGE_DIR/etc/systemd/system/kmp-pea-agent.service" << EOF
[Unit]
Description=KMP PEA Agent - Kaspa Provenance Model Edge Agent
Documentation=https://kmp.io/docs
After=network.target
Wants=network.target

[Service]
Type=simple
User=kmp-pea-agent
Group=kmp-pea-agent
ExecStart=/usr/bin/pea-agent start --service
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=5
TimeoutStopSec=30

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/kmp-pea-agent /var/lib/kmp-pea-agent /etc/kmp-pea-agent

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

# Environment
Environment=RUST_LOG=info
Environment=KMP_CONFIG_PATH=/etc/kmp-pea-agent/config.yaml

[Install]
WantedBy=multi-user.target
EOF

# Create man page
echo "📖 Creating man page..."
cat > "$PACKAGE_DIR/usr/share/man/man1/pea-agent.1" << 'EOF'
.TH PEA-AGENT 1 "January 2024" "1.0.0" "KMP PEA Agent Manual"
.SH NAME
pea-agent \- Kaspa Provenance Model Per-Device Edge Agent
.SH SYNOPSIS
.B pea-agent
[\fIOPTION\fR]... [\fICOMMAND\fR]
.SH DESCRIPTION
The KMP PEA Agent is a secure supply chain traceability agent that auto-discovers barcode/QR scanners, cryptographically signs scan events, and submits them directly to the Kaspa blockchain.
.SH COMMANDS
.TP
.B start
Start the PEA agent daemon
.TP
.B status
Show agent and scanner status
.TP
.B provision
Provision device with KMP backend
.TP
.B test-scanners
Test scanner connectivity
.TP
.B config
Display current configuration
.TP
.B verify
Verify installation and security
.TP
.B reset
Reset all device state (destructive)
.TP
.B uninstall
Uninstall agent and wipe data
.SH OPTIONS
.TP
.B \-c, \-\-config \fIFILE\fR
Use configuration file
.TP
.B \-v, \-\-verbose
Enable verbose logging
.TP
.B \-\-debug-vault
Enable vault debug logging (security risk)
.TP
.B \-h, \-\-help
Show help information
.TP
.B \-V, \-\-version
Show version information
.SH FILES
.TP
.I /etc/kmp-pea-agent/config.yaml
Main configuration file
.TP
.I /var/log/kmp-pea-agent/
Log file directory
.TP
.I /var/lib/kmp-pea-agent/
Data directory for keys and queue
.SH EXAMPLES
.TP
Check agent status:
.B pea-agent status
.TP
Provision with KMP backend:
.B pea-agent provision \-\-server https://provision.kmp.io
.TP
Test scanner connectivity:
.B pea-agent test-scanners
.SH AUTHOR
KMP Technologies <support@kmp.io>
.SH SEE ALSO
.BR systemctl (1),
.BR journalctl (1)
EOF

# Compress man page
gzip -9 "$PACKAGE_DIR/usr/share/man/man1/pea-agent.1"

# Create control file
echo "📋 Creating package control file..."
cat > "$PACKAGE_DIR/DEBIAN/control" << EOF
Package: $PACKAGE_NAME
Version: $PACKAGE_VERSION
Section: misc
Priority: optional
Architecture: $ARCHITECTURE
Depends: libc6 (>= 2.17), libssl3 (>= 3.0.0) | libssl1.1 (>= 1.1.0), systemd
Recommends: usbutils, bluetooth
Suggests: barcode-scanner
Maintainer: $MAINTAINER
Description: $DESCRIPTION
 The KMP PEA Agent provides secure supply chain traceability by auto-discovering
 connected barcode and QR code scanners, cryptographically signing scan events
 with device-unique keys, and submitting provenance data directly to the Kaspa
 blockchain.
 .
 Features:
  * Auto-discovery of USB HID, USB Serial, and Bluetooth scanners
  * Hardware-backed cryptographic key storage
  * Offline operation with automatic retry
  * Real-time blockchain submission to Kaspa network
  * Enterprise-grade audit logging and compliance
  * Cross-platform support (Linux, Windows, macOS)
Homepage: $HOMEPAGE
EOF

# Create preinst script
echo "📝 Creating preinst script..."
cat > "$PACKAGE_DIR/DEBIAN/preinst" << 'EOF'
#!/bin/bash
set -e

# Stop service if running
if systemctl is-active --quiet kmp-pea-agent 2>/dev/null; then
    echo "Stopping KMP PEA Agent service..."
    systemctl stop kmp-pea-agent || true
fi

# Create system user and group
if ! getent group kmp-pea-agent >/dev/null; then
    echo "Creating kmp-pea-agent group..."
    groupadd --system kmp-pea-agent
fi

if ! getent passwd kmp-pea-agent >/dev/null; then
    echo "Creating kmp-pea-agent user..."
    useradd --system --gid kmp-pea-agent --home-dir /var/lib/kmp-pea-agent \
            --shell /bin/false --comment "KMP PEA Agent" kmp-pea-agent
fi

exit 0
EOF

# Create postinst script
echo "📝 Creating postinst script..."
cat > "$PACKAGE_DIR/DEBIAN/postinst" << 'EOF'
#!/bin/bash
set -e

# Set correct ownership and permissions
chown -R kmp-pea-agent:kmp-pea-agent /var/lib/kmp-pea-agent
chown -R kmp-pea-agent:kmp-pea-agent /var/log/kmp-pea-agent
chown root:kmp-pea-agent /etc/kmp-pea-agent/config.yaml
chmod 640 /etc/kmp-pea-agent/config.yaml
chmod 755 /usr/bin/pea-agent
chmod 755 /usr/lib/kmp-pea-agent/pea-daemon

# Add kmp-pea-agent user to dialout group for serial scanner access
if getent group dialout >/dev/null; then
    usermod -a -G dialout kmp-pea-agent
fi

# Reload systemd and enable service
systemctl daemon-reload

case "$1" in
    configure)
        # Enable and start service
        systemctl enable kmp-pea-agent
        systemctl start kmp-pea-agent
        echo "✅ KMP PEA Agent installed and started successfully!"
        echo "🔧 Use 'pea-agent status' to check the service status"
        echo "⚙️  Configuration file: /etc/kmp-pea-agent/config.yaml"
        echo "📋 View logs: journalctl -u kmp-pea-agent -f"
        ;;
esac

exit 0
EOF

# Create prerm script
echo "📝 Creating prerm script..."
cat > "$PACKAGE_DIR/DEBIAN/prerm" << 'EOF'
#!/bin/bash
set -e

case "$1" in
    remove|deconfigure)
        # Stop and disable service
        if systemctl is-active --quiet kmp-pea-agent 2>/dev/null; then
            echo "Stopping KMP PEA Agent service..."
            systemctl stop kmp-pea-agent || true
        fi
        
        if systemctl is-enabled --quiet kmp-pea-agent 2>/dev/null; then
            echo "Disabling KMP PEA Agent service..."
            systemctl disable kmp-pea-agent || true
        fi
        ;;
esac

exit 0
EOF

# Create postrm script
echo "📝 Creating postrm script..."
cat > "$PACKAGE_DIR/DEBIAN/postrm" << 'EOF'
#!/bin/bash
set -e

case "$1" in
    purge)
        # Remove user and group
        if getent passwd kmp-pea-agent >/dev/null; then
            echo "Removing kmp-pea-agent user..."
            userdel kmp-pea-agent || true
        fi
        
        if getent group kmp-pea-agent >/dev/null; then
            echo "Removing kmp-pea-agent group..."
            groupdel kmp-pea-agent || true
        fi
        
        # Remove data directories
        rm -rf /var/lib/kmp-pea-agent
        rm -rf /var/log/kmp-pea-agent
        rm -rf /etc/kmp-pea-agent
        
        # Reload systemd
        systemctl daemon-reload || true
        
        echo "✅ KMP PEA Agent completely removed"
        ;;
esac

exit 0
EOF

# Make scripts executable
chmod 755 "$PACKAGE_DIR/DEBIAN/preinst"
chmod 755 "$PACKAGE_DIR/DEBIAN/postinst"
chmod 755 "$PACKAGE_DIR/DEBIAN/prerm"
chmod 755 "$PACKAGE_DIR/DEBIAN/postrm"

# Create conffiles (configuration files that shouldn't be overwritten)
echo "/etc/kmp-pea-agent/config.yaml" > "$PACKAGE_DIR/DEBIAN/conffiles"

# Create changelog
echo "📝 Creating changelog..."
cat > "$PACKAGE_DIR/usr/share/doc/kmp-pea-agent/changelog.Debian" << EOF
kmp-pea-agent (1.0.0-1) unstable; urgency=medium

  * Initial release of KMP PEA Agent
  * Auto-discovery of USB HID, USB Serial, and Bluetooth scanners
  * Hardware-backed cryptographic key storage
  * Direct Kaspa blockchain integration
  * Offline operation with retry logic
  * Enterprise audit logging and compliance

 -- $MAINTAINER  $(date -R)
EOF

# Compress changelog
gzip -9 "$PACKAGE_DIR/usr/share/doc/kmp-pea-agent/changelog.Debian"

# Create copyright file
cat > "$PACKAGE_DIR/usr/share/doc/kmp-pea-agent/copyright" << EOF
Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/
Upstream-Name: kmp-pea-agent
Upstream-Contact: KMP Technologies <support@kmp.io>
Source: https://github.com/kmp/pea-agent

Files: *
Copyright: 2024 KMP Technologies
License: MIT

License: MIT
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 .
 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.
 .
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
EOF

# Calculate installed size
INSTALLED_SIZE=$(du -sk "$PACKAGE_DIR" | cut -f1)
echo "Installed-Size: $INSTALLED_SIZE" >> "$PACKAGE_DIR/DEBIAN/control"

# Build the package
echo "🔨 Building DEB package..."
fakeroot dpkg-deb --build "$PACKAGE_DIR" "${PACKAGE_NAME}_${PACKAGE_VERSION}_${ARCHITECTURE}.deb"

echo "✅ Debian DEB package created: ${PACKAGE_NAME}_${PACKAGE_VERSION}_${ARCHITECTURE}.deb"

# Verify package
echo "🔍 Verifying package..."
dpkg-deb --info "${PACKAGE_NAME}_${PACKAGE_VERSION}_${ARCHITECTURE}.deb"
dpkg-deb --contents "${PACKAGE_NAME}_${PACKAGE_VERSION}_${ARCHITECTURE}.deb"

# Test installation (requires sudo)
if command -v lintian >/dev/null; then
    echo "🧪 Running lintian checks..."
    lintian "${PACKAGE_NAME}_${PACKAGE_VERSION}_${ARCHITECTURE}.deb" || true
fi

# Cleanup
rm -rf "$BUILD_DIR"

echo "🎉 Debian package build completed!"
echo ""
echo "📦 Installation Instructions:"
echo "   sudo dpkg -i ${PACKAGE_NAME}_${PACKAGE_VERSION}_${ARCHITECTURE}.deb"
echo "   sudo apt-get install -f  # Fix dependencies if needed"
echo ""
echo "🔧 Post-installation:"
echo "   • Service starts automatically: systemctl status kmp-pea-agent"
echo "   • View logs: journalctl -u kmp-pea-agent -f"
echo "   • Configure: /etc/kmp-pea-agent/config.yaml"
echo "   • Provision device: pea-agent provision --server <url>"
echo ""
echo "🗑️  Uninstallation:"
echo "   sudo apt remove kmp-pea-agent      # Remove package"
echo "   sudo apt purge kmp-pea-agent       # Remove package and config" 
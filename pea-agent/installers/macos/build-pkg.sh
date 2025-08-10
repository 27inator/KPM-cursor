#!/bin/bash
set -e

# macOS PKG installer build script for KMP PEA Agent
# Requires: Xcode Command Line Tools, pkgbuild, productbuild

PRODUCT_NAME="KMP PEA Agent"
PRODUCT_VERSION="1.0.0"
BUNDLE_ID="io.kmp.pea-agent"
INSTALL_LOCATION="/Applications/KMP PEA Agent"
BUILD_DIR="build"
SCRIPTS_DIR="scripts"
RESOURCES_DIR="resources"

echo "🍎 Building macOS PKG installer for $PRODUCT_NAME v$PRODUCT_VERSION"

# Clean and create build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/root$INSTALL_LOCATION"
mkdir -p "$BUILD_DIR/scripts"
mkdir -p "$BUILD_DIR/resources"

# Copy application files
echo "📦 Copying application files..."
cp "../../target/release/pea-agent" "$BUILD_DIR/root$INSTALL_LOCATION/"
cp "../../target/release/pea-daemon" "$BUILD_DIR/root$INSTALL_LOCATION/"
cp -r "../../config" "$BUILD_DIR/root$INSTALL_LOCATION/"
cp "../../README.md" "$BUILD_DIR/root$INSTALL_LOCATION/"
cp "../../LICENSE" "$BUILD_DIR/root$INSTALL_LOCATION/"
cp "../../SECURITY_WHITEPAPER.md" "$BUILD_DIR/root$INSTALL_LOCATION/"

# Set executable permissions
chmod +x "$BUILD_DIR/root$INSTALL_LOCATION/pea-agent"
chmod +x "$BUILD_DIR/root$INSTALL_LOCATION/pea-daemon"

# Create LaunchDaemon plist
echo "🔧 Creating LaunchDaemon configuration..."
cat > "$BUILD_DIR/root/Library/LaunchDaemons/io.kmp.pea-agent.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>io.kmp.pea-agent</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>$INSTALL_LOCATION/pea-agent</string>
        <string>start</string>
        <string>--service</string>
    </array>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>/var/log/kmp-pea-agent.log</string>
    
    <key>StandardErrorPath</key>
    <string>/var/log/kmp-pea-agent-error.log</string>
    
    <key>UserName</key>
    <string>root</string>
    
    <key>GroupName</key>
    <string>wheel</string>
    
    <key>WorkingDirectory</key>
    <string>$INSTALL_LOCATION</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
    </dict>
    
    <key>SoftResourceLimits</key>
    <dict>
        <key>NumberOfFiles</key>
        <integer>1024</integer>
    </dict>
</dict>
</plist>
EOF

# Create preinstall script
echo "📝 Creating preinstall script..."
cat > "$BUILD_DIR/scripts/preinstall" << 'EOF'
#!/bin/bash

# Stop existing service if running
if launchctl list | grep -q "io.kmp.pea-agent"; then
    echo "Stopping existing KMP PEA Agent service..."
    launchctl unload /Library/LaunchDaemons/io.kmp.pea-agent.plist 2>/dev/null || true
fi

# Remove old installation if exists
if [ -d "/Applications/KMP PEA Agent" ]; then
    echo "Removing previous installation..."
    rm -rf "/Applications/KMP PEA Agent"
fi

exit 0
EOF

# Create postinstall script
echo "📝 Creating postinstall script..."
cat > "$BUILD_DIR/scripts/postinstall" << 'EOF'
#!/bin/bash

INSTALL_LOCATION="/Applications/KMP PEA Agent"
PLIST_PATH="/Library/LaunchDaemons/io.kmp.pea-agent.plist"

# Set correct permissions
echo "Setting permissions..."
chown -R root:wheel "$INSTALL_LOCATION"
chmod 755 "$INSTALL_LOCATION"
chmod +x "$INSTALL_LOCATION/pea-agent"
chmod +x "$INSTALL_LOCATION/pea-daemon"

# Set LaunchDaemon permissions
chown root:wheel "$PLIST_PATH"
chmod 644 "$PLIST_PATH"

# Create configuration directory
mkdir -p "/usr/local/etc/kmp-pea-agent"
chown root:wheel "/usr/local/etc/kmp-pea-agent"
chmod 755 "/usr/local/etc/kmp-pea-agent"

# Copy default configuration if not exists
if [ ! -f "/usr/local/etc/kmp-pea-agent/config.yaml" ]; then
    cp "$INSTALL_LOCATION/config/default.yaml" "/usr/local/etc/kmp-pea-agent/config.yaml"
    chown root:wheel "/usr/local/etc/kmp-pea-agent/config.yaml"
    chmod 644 "/usr/local/etc/kmp-pea-agent/config.yaml"
fi

# Create log directory
mkdir -p "/var/log/kmp-pea-agent"
chown root:wheel "/var/log/kmp-pea-agent"
chmod 755 "/var/log/kmp-pea-agent"

# Load and start the service
echo "Starting KMP PEA Agent service..."
launchctl load "$PLIST_PATH"

# Add to PATH for CLI usage
if ! grep -q "KMP PEA Agent" /etc/paths; then
    echo "$INSTALL_LOCATION" >> /etc/paths
fi

echo "✅ KMP PEA Agent installed successfully!"
echo "🔧 Use 'pea-agent status' to check the service status"
echo "⚙️  Configuration file: /usr/local/etc/kmp-pea-agent/config.yaml"

exit 0
EOF

# Create preremove script (for uninstall)
echo "📝 Creating preremove script..."
cat > "$BUILD_DIR/scripts/preremove" << 'EOF'
#!/bin/bash

echo "Stopping KMP PEA Agent service..."

# Stop and unload service
if launchctl list | grep -q "io.kmp.pea-agent"; then
    launchctl unload /Library/LaunchDaemons/io.kmp.pea-agent.plist
fi

# Remove LaunchDaemon plist
rm -f /Library/LaunchDaemons/io.kmp.pea-agent.plist

# Clean up PATH
sed -i '' '/KMP PEA Agent/d' /etc/paths 2>/dev/null || true

echo "✅ KMP PEA Agent service stopped and cleaned up"

exit 0
EOF

# Make scripts executable
chmod +x "$BUILD_DIR/scripts/"*

# Create Welcome.rtf
echo "📄 Creating welcome document..."
cat > "$BUILD_DIR/resources/Welcome.rtf" << 'EOF'
{\rtf1\ansi\deff0 {\fonttbl {\f0 Times New Roman;}}
\f0\fs24 Welcome to KMP PEA Agent Installer\par
\par
This installer will install the Kaspa Provenance Model Per-Device Edge Agent on your Mac.\par
\par
The PEA Agent provides secure supply chain traceability by:\par
\par
• Auto-discovering connected barcode and QR code scanners\par
• Cryptographically signing scan events with device-unique keys\par
• Submitting provenance data directly to the Kaspa blockchain\par
• Operating offline with automatic retry capabilities\par
\par
System Requirements:\par
• macOS 10.15 or later\par
• Administrator privileges for installation\par
• USB or Bluetooth scanner (optional)\par
\par
The agent will run as a system service and start automatically at boot.\par
}
EOF

# Create ReadMe.rtf
echo "📄 Creating readme document..."
cat > "$BUILD_DIR/resources/ReadMe.rtf" << 'EOF'
{\rtf1\ansi\deff0 {\fonttbl {\f0 Times New Roman;}}
\f0\fs24 KMP PEA Agent - Installation Complete\par
\par
The KMP PEA Agent has been installed as a system service.\par
\par
Configuration:\par
• Config file: /usr/local/etc/kmp-pea-agent/config.yaml\par
• Log files: /var/log/kmp-pea-agent/\par
• Application: /Applications/KMP PEA Agent/\par
\par
Command Line Usage:\par
• Check status: pea-agent status\par
• View configuration: pea-agent config\par
• Test scanners: pea-agent test-scanners\par
• Provision device: pea-agent provision --server <url>\par
\par
The service starts automatically at boot. To manually control:\par
• Start: sudo launchctl load /Library/LaunchDaemons/io.kmp.pea-agent.plist\par
• Stop: sudo launchctl unload /Library/LaunchDaemons/io.kmp.pea-agent.plist\par
\par
For support and documentation, visit: https://kmp.io/docs\par
}
EOF

# Create License.rtf
echo "📄 Creating license document..."
cat > "$BUILD_DIR/resources/License.rtf" << 'EOF'
{\rtf1\ansi\deff0 {\fonttbl {\f0 Times New Roman;}}
\f0\fs24 MIT License\par
\par
Copyright (c) 2024 KMP Technologies\par
\par
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\par
\par
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\par
\par
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\par
}
EOF

# Build the component package
echo "🔨 Building component package..."
pkgbuild --root "$BUILD_DIR/root" \
         --scripts "$BUILD_DIR/scripts" \
         --identifier "$BUNDLE_ID" \
         --version "$PRODUCT_VERSION" \
         --install-location "/" \
         "$BUILD_DIR/KMPPeaAgent-component.pkg"

# Create distribution XML
echo "📋 Creating distribution configuration..."
cat > "$BUILD_DIR/distribution.xml" << EOF
<?xml version="1.0" encoding="utf-8"?>
<installer-gui-script minSpecVersion="2">
    <title>$PRODUCT_NAME</title>
    <organization>io.kmp</organization>
    <domains enable_localSystem="true"/>
    <options customize="never" require-scripts="false" rootVolumeOnly="true"/>
    
    <welcome file="Welcome.rtf"/>
    <readme file="ReadMe.rtf"/>
    <license file="License.rtf"/>
    
    <pkg-ref id="$BUNDLE_ID"/>
    
    <options customize="never" require-scripts="false"/>
    <choices-outline>
        <line choice="default">
            <line choice="$BUNDLE_ID"/>
        </line>
    </choices-outline>
    
    <choice id="default"/>
    <choice id="$BUNDLE_ID" visible="false">
        <pkg-ref id="$BUNDLE_ID"/>
    </choice>
    
    <pkg-ref id="$BUNDLE_ID" version="$PRODUCT_VERSION" onConclusion="none">KMPPeaAgent-component.pkg</pkg-ref>
    
</installer-gui-script>
EOF

# Build the final installer package
echo "🎁 Building final installer package..."
productbuild --distribution "$BUILD_DIR/distribution.xml" \
             --resources "$BUILD_DIR/resources" \
             --package-path "$BUILD_DIR" \
             "KMP-PEA-Agent-$PRODUCT_VERSION.pkg"

echo "✅ macOS PKG installer created: KMP-PEA-Agent-$PRODUCT_VERSION.pkg"

# Code signing (if certificate is available)
if security find-identity -v -p codesigning | grep -q "Developer ID Installer"; then
    echo "🔐 Code signing installer..."
    productsign --sign "Developer ID Installer" \
                "KMP-PEA-Agent-$PRODUCT_VERSION.pkg" \
                "KMP-PEA-Agent-$PRODUCT_VERSION-signed.pkg"
    
    echo "✅ Signed installer created: KMP-PEA-Agent-$PRODUCT_VERSION-signed.pkg"
    
    # Verify signature
    spctl -a -v --type install "KMP-PEA-Agent-$PRODUCT_VERSION-signed.pkg"
    echo "🔍 Signature verification completed"
else
    echo "⚠️  No code signing certificate found - installer is unsigned"
    echo "💡 For distribution, obtain a Developer ID Installer certificate from Apple"
fi

# Cleanup
rm -rf "$BUILD_DIR"

echo "🎉 macOS installer build completed!"
echo ""
echo "📦 Installation Instructions:"
echo "   1. Double-click the .pkg file"
echo "   2. Follow the installation wizard"
echo "   3. Enter administrator password when prompted"
echo "   4. Use 'pea-agent status' to verify installation"
echo ""
echo "🔧 Post-installation:"
echo "   • Service starts automatically"
echo "   • Configure via: /usr/local/etc/kmp-pea-agent/config.yaml"
echo "   • Provision device with: pea-agent provision --server <url>" 
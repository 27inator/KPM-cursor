#!/bin/bash
set -e

# RPM package build script for KMP PEA Agent
# Requires: rpm-build, rpmdevtools

PACKAGE_NAME="kmp-pea-agent"
PACKAGE_VERSION="1.0.0"
PACKAGE_RELEASE="1"
ARCHITECTURE="x86_64"  # or aarch64
PACKAGER="KMP Technologies <support@kmp.io>"
SUMMARY="Kaspa Provenance Model Per-Device Edge Agent"
URL="https://kmp.io"

BUILD_ROOT="$HOME/rpmbuild"
SPEC_FILE="$BUILD_ROOT/SPECS/$PACKAGE_NAME.spec"

echo "🔴 Building RPM package for $PACKAGE_NAME v$PACKAGE_VERSION"

# Setup RPM build environment
echo "🔧 Setting up RPM build environment..."
rpmdev-setuptree

# Create directory structure in build root
mkdir -p "$BUILD_ROOT/SOURCES"
mkdir -p "$BUILD_ROOT/BUILD"
mkdir -p "$BUILD_ROOT/BUILDROOT"

# Create source tarball
echo "📦 Creating source tarball..."
TARBALL="$PACKAGE_NAME-$PACKAGE_VERSION.tar.gz"
tar -czf "$BUILD_ROOT/SOURCES/$TARBALL" \
    --transform "s,^,${PACKAGE_NAME}-${PACKAGE_VERSION}/," \
    -C "../../" \
    target/release/pea-agent \
    target/release/pea-daemon \
    config/default.yaml \
    README.md \
    LICENSE \
    SECURITY_WHITEPAPER.md

# Create RPM spec file
echo "📋 Creating RPM spec file..."
cat > "$SPEC_FILE" << EOF
Name:           $PACKAGE_NAME
Version:        $PACKAGE_VERSION
Release:        $PACKAGE_RELEASE%{?dist}
Summary:        $SUMMARY
Group:          Applications/System
License:        MIT
URL:            $URL
Source0:        %{name}-%{version}.tar.gz
Packager:       $PACKAGER

BuildRequires:  systemd-rpm-macros
Requires:       systemd
Requires:       openssl >= 1.1.0
Recommends:     usbutils
Recommends:     bluez

%description
The KMP PEA Agent provides secure supply chain traceability by auto-discovering
connected barcode and QR code scanners, cryptographically signing scan events
with device-unique keys, and submitting provenance data directly to the Kaspa
blockchain.

Features:
* Auto-discovery of USB HID, USB Serial, and Bluetooth scanners
* Hardware-backed cryptographic key storage
* Offline operation with automatic retry
* Real-time blockchain submission to Kaspa network
* Enterprise-grade audit logging and compliance
* Cross-platform support (Linux, Windows, macOS)

%prep
%setup -q

%build
# No build needed - using pre-compiled binaries

%install
rm -rf \$RPM_BUILD_ROOT

# Create directory structure
mkdir -p \$RPM_BUILD_ROOT%{_bindir}
mkdir -p \$RPM_BUILD_ROOT%{_libexecdir}/%{name}
mkdir -p \$RPM_BUILD_ROOT%{_sysconfdir}/%{name}
mkdir -p \$RPM_BUILD_ROOT%{_unitdir}
mkdir -p \$RPM_BUILD_ROOT%{_localstatedir}/log/%{name}
mkdir -p \$RPM_BUILD_ROOT%{_localstatedir}/lib/%{name}
mkdir -p \$RPM_BUILD_ROOT%{_mandir}/man1
mkdir -p \$RPM_BUILD_ROOT%{_docdir}/%{name}

# Install binaries
install -m 755 pea-agent \$RPM_BUILD_ROOT%{_bindir}/
install -m 755 pea-daemon \$RPM_BUILD_ROOT%{_libexecdir}/%{name}/

# Install configuration
install -m 640 config/default.yaml \$RPM_BUILD_ROOT%{_sysconfdir}/%{name}/config.yaml

# Install documentation
install -m 644 README.md \$RPM_BUILD_ROOT%{_docdir}/%{name}/
install -m 644 LICENSE \$RPM_BUILD_ROOT%{_docdir}/%{name}/
install -m 644 SECURITY_WHITEPAPER.md \$RPM_BUILD_ROOT%{_docdir}/%{name}/

# Create systemd service file
cat > \$RPM_BUILD_ROOT%{_unitdir}/%{name}.service << 'SYSTEMD_EOF'
[Unit]
Description=KMP PEA Agent - Kaspa Provenance Model Edge Agent
Documentation=https://kmp.io/docs
After=network.target
Wants=network.target

[Service]
Type=simple
User=%{name}
Group=%{name}
ExecStart=%{_bindir}/pea-agent start --service
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=5
TimeoutStopSec=30

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=%{_localstatedir}/log/%{name} %{_localstatedir}/lib/%{name} %{_sysconfdir}/%{name}

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

# Environment
Environment=RUST_LOG=info
Environment=KMP_CONFIG_PATH=%{_sysconfdir}/%{name}/config.yaml

[Install]
WantedBy=multi-user.target
SYSTEMD_EOF

# Create man page
cat > \$RPM_BUILD_ROOT%{_mandir}/man1/pea-agent.1 << 'MAN_EOF'
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
.I %{_sysconfdir}/%{name}/config.yaml
Main configuration file
.TP
.I %{_localstatedir}/log/%{name}/
Log file directory
.TP
.I %{_localstatedir}/lib/%{name}/
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
MAN_EOF

# Compress man page
gzip \$RPM_BUILD_ROOT%{_mandir}/man1/pea-agent.1

%clean
rm -rf \$RPM_BUILD_ROOT

%pre
# Create system user and group
getent group %{name} >/dev/null || groupadd -r %{name}
getent passwd %{name} >/dev/null || \
    useradd -r -g %{name} -d %{_localstatedir}/lib/%{name} \
            -s /sbin/nologin -c "KMP PEA Agent" %{name}

%post
# Set correct ownership and permissions
chown -R %{name}:%{name} %{_localstatedir}/lib/%{name}
chown -R %{name}:%{name} %{_localstatedir}/log/%{name}
chown root:%{name} %{_sysconfdir}/%{name}/config.yaml
chmod 640 %{_sysconfdir}/%{name}/config.yaml

# Add to dialout group for serial scanner access
if getent group dialout >/dev/null; then
    usermod -a -G dialout %{name}
fi

# Enable and start systemd service
%systemd_post %{name}.service

echo "✅ KMP PEA Agent installed successfully!"
echo "🔧 Use 'pea-agent status' to check the service status"
echo "⚙️  Configuration file: %{_sysconfdir}/%{name}/config.yaml"
echo "📋 View logs: journalctl -u %{name} -f"

%preun
%systemd_preun %{name}.service

%postun
%systemd_postun_with_restart %{name}.service

# Remove user and group on complete removal
if [ \$1 -eq 0 ] ; then
    # Complete removal
    getent passwd %{name} >/dev/null && userdel %{name} 2>/dev/null || true
    getent group %{name} >/dev/null && groupdel %{name} 2>/dev/null || true
    
    # Remove data directories
    rm -rf %{_localstatedir}/lib/%{name}
    rm -rf %{_localstatedir}/log/%{name}
    
    echo "✅ KMP PEA Agent completely removed"
fi

%files
%defattr(-,root,root,-)
%{_bindir}/pea-agent
%{_libexecdir}/%{name}/pea-daemon
%{_unitdir}/%{name}.service
%{_mandir}/man1/pea-agent.1.gz

%config(noreplace) %{_sysconfdir}/%{name}/config.yaml
%dir %{_sysconfdir}/%{name}

%attr(755,%{name},%{name}) %dir %{_localstatedir}/lib/%{name}
%attr(755,%{name},%{name}) %dir %{_localstatedir}/log/%{name}

%doc %{_docdir}/%{name}/README.md
%doc %{_docdir}/%{name}/LICENSE
%doc %{_docdir}/%{name}/SECURITY_WHITEPAPER.md

%changelog
* $(date '+%a %b %d %Y') $PACKAGER - $PACKAGE_VERSION-$PACKAGE_RELEASE
- Initial release of KMP PEA Agent
- Auto-discovery of USB HID, USB Serial, and Bluetooth scanners
- Hardware-backed cryptographic key storage
- Direct Kaspa blockchain integration
- Offline operation with retry logic
- Enterprise audit logging and compliance

EOF

# Build the RPM package
echo "🔨 Building RPM package..."
rpmbuild -ba "$SPEC_FILE"

# Find the built packages
BUILT_RPM=$(find "$BUILD_ROOT/RPMS" -name "*$PACKAGE_NAME*$PACKAGE_VERSION*.rpm" | head -1)
BUILT_SRPM=$(find "$BUILD_ROOT/SRPMS" -name "*$PACKAGE_NAME*$PACKAGE_VERSION*.src.rpm" | head -1)

if [ -n "$BUILT_RPM" ]; then
    echo "✅ RPM package created: $(basename "$BUILT_RPM")"
    cp "$BUILT_RPM" ./
fi

if [ -n "$BUILT_SRPM" ]; then
    echo "✅ Source RPM created: $(basename "$BUILT_SRPM")"
    cp "$BUILT_SRPM" ./
fi

# Verify package
echo "🔍 Verifying RPM package..."
if [ -n "$BUILT_RPM" ]; then
    rpm -qip "$(basename "$BUILT_RPM")"
    echo ""
    echo "📦 Package contents:"
    rpm -qlp "$(basename "$BUILT_RPM")"
fi

# Test installation (requires sudo)
if command -v rpmlint >/dev/null && [ -n "$BUILT_RPM" ]; then
    echo "🧪 Running rpmlint checks..."
    rpmlint "$(basename "$BUILT_RPM")" || true
fi

echo "🎉 RPM package build completed!"
echo ""
echo "📦 Installation Instructions:"
echo "   # Red Hat/CentOS/Rocky Linux:"
echo "   sudo dnf install ./$(basename "$BUILT_RPM")"
echo "   # or"
echo "   sudo yum install ./$(basename "$BUILT_RPM")"
echo ""
echo "   # Fedora:"
echo "   sudo dnf install ./$(basename "$BUILT_RPM")"
echo ""
echo "🔧 Post-installation:"
echo "   • Service starts automatically: systemctl status $PACKAGE_NAME"
echo "   • View logs: journalctl -u $PACKAGE_NAME -f"
echo "   • Configure: /etc/$PACKAGE_NAME/config.yaml"
echo "   • Provision device: pea-agent provision --server <url>"
echo ""
echo "🗑️  Uninstallation:"
echo "   sudo dnf remove $PACKAGE_NAME      # Remove package"
echo "   sudo dnf remove $PACKAGE_NAME --remove-leaves  # Remove package and unused deps" 
#!/bin/bash
set -e

# KMP PEA Agent Installer Testing Suite
# Tests installation, upgrade, and uninstallation on multiple platforms

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEST_RESULTS_DIR="$PROJECT_ROOT/test-results/installers"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
DOCKER_IMAGES=(
    "ubuntu:20.04"
    "ubuntu:22.04"
    "debian:11"
    "debian:12"
    "centos:7"
    "rockylinux:8"
    "fedora:38"
    "fedora:39"
)

MACOS_VERSIONS=(
    "12"  # Monterey
    "13"  # Ventura
    "14"  # Sonoma
)

WINDOWS_VERSIONS=(
    "2019"
    "2022"
)

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ❌${NC} $1"
}

create_test_environment() {
    log "Creating test environment..."
    
    mkdir -p "$TEST_RESULTS_DIR"
    
    # Create test report
    cat > "$TEST_RESULTS_DIR/installer_test_$TIMESTAMP.json" << EOF
{
    "test_run": {
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "platform": "$(uname -s)",
        "architecture": "$(uname -m)",
        "test_type": "installer_validation"
    },
    "results": []
}
EOF
}

test_linux_deb_installer() {
    local image=$1
    local test_name="deb_installer_${image//[^a-zA-Z0-9]/_}"
    
    log "Testing DEB installer on $image..."
    
    # Create test container
    local container_name="pea_test_${test_name}_$$"
    
    cat > "$TEST_RESULTS_DIR/test_${test_name}.dockerfile" << EOF
FROM $image

# Install required packages
RUN apt-get update && apt-get install -y \\
    curl \\
    wget \\
    gnupg2 \\
    software-properties-common \\
    systemd \\
    procps \\
    lsof \\
    net-tools

# Copy DEB package
COPY *.deb /tmp/

# Test script
COPY test_deb_install.sh /test_deb_install.sh
RUN chmod +x /test_deb_install.sh

CMD ["/test_deb_install.sh"]
EOF

    # Create test script
    cat > "$TEST_RESULTS_DIR/test_deb_install.sh" << 'EOF'
#!/bin/bash
set -e

echo "🧪 Testing DEB package installation..."

# Find DEB package
DEB_PACKAGE=$(find /tmp -name "*.deb" | head -1)
if [ -z "$DEB_PACKAGE" ]; then
    echo "❌ No DEB package found"
    exit 1
fi

echo "📦 Found package: $DEB_PACKAGE"

# Test package info
dpkg-deb --info "$DEB_PACKAGE"
dpkg-deb --contents "$DEB_PACKAGE"

# Install package
echo "📥 Installing package..."
dpkg -i "$DEB_PACKAGE" || true

# Fix dependencies if needed
apt-get install -f -y

# Verify installation
echo "🔍 Verifying installation..."

# Check if binary exists
if [ ! -f "/usr/bin/pea-agent" ]; then
    echo "❌ Binary not installed"
    exit 1
fi

# Check if service exists
if [ ! -f "/etc/systemd/system/kmp-pea-agent.service" ]; then
    echo "❌ Service file not installed"
    exit 1
fi

# Check if config exists
if [ ! -f "/etc/kmp-pea-agent/config.yaml" ]; then
    echo "❌ Configuration file not installed"
    exit 1
fi

# Test binary execution
echo "🚀 Testing binary execution..."
/usr/bin/pea-agent --version

# Test service management
echo "🔧 Testing service management..."
systemctl daemon-reload
systemctl enable kmp-pea-agent
systemctl start kmp-pea-agent || true

# Wait for service to start
sleep 3

# Check service status
systemctl status kmp-pea-agent --no-pager

# Test agent status
echo "📊 Testing agent status..."
/usr/bin/pea-agent status || true

# Test uninstallation
echo "🗑️  Testing package removal..."
systemctl stop kmp-pea-agent || true
systemctl disable kmp-pea-agent || true
apt-get remove -y kmp-pea-agent

# Verify removal
if [ -f "/usr/bin/pea-agent" ]; then
    echo "❌ Binary not removed"
    exit 1
fi

# Test purge
echo "🧹 Testing package purge..."
apt-get purge -y kmp-pea-agent

# Verify purge
if [ -d "/etc/kmp-pea-agent" ]; then
    echo "❌ Configuration directory not removed"
    exit 1
fi

echo "✅ DEB package test completed successfully"
EOF

    # Build and run test
    if docker build -t "pea_test_$test_name" -f "$TEST_RESULTS_DIR/test_${test_name}.dockerfile" "$PROJECT_ROOT"; then
        if docker run --rm --name "$container_name" "pea_test_$test_name"; then
            log_success "DEB installer test passed on $image"
            record_test_result "$test_name" "pass" "DEB installer works correctly on $image"
        else
            log_error "DEB installer test failed on $image"
            record_test_result "$test_name" "fail" "DEB installer failed on $image"
        fi
    else
        log_error "Failed to build test container for $image"
        record_test_result "$test_name" "fail" "Failed to build test container for $image"
    fi
    
    # Cleanup
    docker rmi "pea_test_$test_name" 2>/dev/null || true
}

test_linux_rpm_installer() {
    local image=$1
    local test_name="rpm_installer_${image//[^a-zA-Z0-9]/_}"
    
    log "Testing RPM installer on $image..."
    
    cat > "$TEST_RESULTS_DIR/test_${test_name}.dockerfile" << EOF
FROM $image

# Install required packages
RUN yum update -y && yum install -y \\
    curl \\
    wget \\
    systemd \\
    procps-ng \\
    lsof \\
    net-tools \\
    which

# Copy RPM package
COPY *.rpm /tmp/

# Test script
COPY test_rpm_install.sh /test_rpm_install.sh
RUN chmod +x /test_rpm_install.sh

CMD ["/test_rpm_install.sh"]
EOF

    # Create RPM test script
    cat > "$TEST_RESULTS_DIR/test_rpm_install.sh" << 'EOF'
#!/bin/bash
set -e

echo "🧪 Testing RPM package installation..."

# Find RPM package
RPM_PACKAGE=$(find /tmp -name "*.rpm" | head -1)
if [ -z "$RPM_PACKAGE" ]; then
    echo "❌ No RPM package found"
    exit 1
fi

echo "📦 Found package: $RPM_PACKAGE"

# Test package info
rpm -qip "$RPM_PACKAGE"
rpm -qlp "$RPM_PACKAGE"

# Install package
echo "📥 Installing package..."
rpm -ivh "$RPM_PACKAGE"

# Verify installation
echo "🔍 Verifying installation..."

# Check if binary exists
if [ ! -f "/usr/bin/pea-agent" ]; then
    echo "❌ Binary not installed"
    exit 1
fi

# Check if service exists
if [ ! -f "/etc/systemd/system/kmp-pea-agent.service" ]; then
    echo "❌ Service file not installed"
    exit 1
fi

# Test binary execution
echo "🚀 Testing binary execution..."
/usr/bin/pea-agent --version

# Test service management
echo "🔧 Testing service management..."
systemctl daemon-reload
systemctl enable kmp-pea-agent
systemctl start kmp-pea-agent || true

# Wait for service to start
sleep 3

# Check service status
systemctl status kmp-pea-agent --no-pager || true

# Test agent status
echo "📊 Testing agent status..."
/usr/bin/pea-agent status || true

# Test uninstallation
echo "🗑️  Testing package removal..."
systemctl stop kmp-pea-agent || true
systemctl disable kmp-pea-agent || true
rpm -e kmp-pea-agent

# Verify removal
if [ -f "/usr/bin/pea-agent" ]; then
    echo "❌ Binary not removed"
    exit 1
fi

echo "✅ RPM package test completed successfully"
EOF

    # Build and run test
    if docker build -t "pea_test_$test_name" -f "$TEST_RESULTS_DIR/test_${test_name}.dockerfile" "$PROJECT_ROOT"; then
        if docker run --rm --name "pea_test_${test_name}_$$" "pea_test_$test_name"; then
            log_success "RPM installer test passed on $image"
            record_test_result "$test_name" "pass" "RPM installer works correctly on $image"
        else
            log_error "RPM installer test failed on $image"
            record_test_result "$test_name" "fail" "RPM installer failed on $image"
        fi
    else
        log_error "Failed to build test container for $image"
        record_test_result "$test_name" "fail" "Failed to build test container for $image"
    fi
    
    # Cleanup
    docker rmi "pea_test_$test_name" 2>/dev/null || true
}

test_macos_pkg_installer() {
    local version=$1
    local test_name="pkg_installer_macos_$version"
    
    log "Testing PKG installer on macOS $version..."
    
    # This would require macOS VMs or real hardware
    # For now, we'll do basic validation
    
    PKG_FILE=$(find "$PROJECT_ROOT" -name "*.pkg" | head -1)
    if [ -z "$PKG_FILE" ]; then
        log_warning "No PKG file found for testing"
        record_test_result "$test_name" "skip" "No PKG file available"
        return
    fi
    
    # Basic PKG validation
    if command -v pkgutil >/dev/null 2>&1; then
        log "Validating PKG structure..."
        
        # Check PKG contents
        pkgutil --payload-files "$PKG_FILE" > "$TEST_RESULTS_DIR/${test_name}_contents.txt"
        
        # Check for required files
        if grep -q "usr/bin/pea-agent" "$TEST_RESULTS_DIR/${test_name}_contents.txt"; then
            log_success "PKG contains required binary"
        else
            log_error "PKG missing required binary"
            record_test_result "$test_name" "fail" "PKG missing required binary"
            return
        fi
        
        if grep -q "Library/LaunchDaemons" "$TEST_RESULTS_DIR/${test_name}_contents.txt"; then
            log_success "PKG contains LaunchDaemon"
        else
            log_error "PKG missing LaunchDaemon"
            record_test_result "$test_name" "fail" "PKG missing LaunchDaemon"
            return
        fi
        
        record_test_result "$test_name" "pass" "PKG structure validation passed"
    else
        log_warning "pkgutil not available, skipping PKG validation"
        record_test_result "$test_name" "skip" "pkgutil not available"
    fi
}

test_windows_msi_installer() {
    local version=$1
    local test_name="msi_installer_windows_$version"
    
    log "Testing MSI installer on Windows $version..."
    
    MSI_FILE=$(find "$PROJECT_ROOT" -name "*.msi" | head -1)
    if [ -z "$MSI_FILE" ]; then
        log_warning "No MSI file found for testing"
        record_test_result "$test_name" "skip" "No MSI file available"
        return
    fi
    
    # Basic MSI validation (limited on non-Windows)
    if command -v msiinfo >/dev/null 2>&1; then
        log "Validating MSI structure..."
        
        # Check MSI properties
        msiinfo tables "$MSI_FILE" > "$TEST_RESULTS_DIR/${test_name}_tables.txt"
        
        # Check for required tables
        if grep -q "File" "$TEST_RESULTS_DIR/${test_name}_tables.txt"; then
            log_success "MSI contains File table"
        else
            log_error "MSI missing File table"
            record_test_result "$test_name" "fail" "MSI missing File table"
            return
        fi
        
        record_test_result "$test_name" "pass" "MSI structure validation passed"
    else
        log_warning "MSI tools not available, marking as manual test required"
        record_test_result "$test_name" "manual" "MSI testing requires Windows environment"
    fi
}

test_installer_security() {
    log "Testing installer security features..."
    
    # Check for code signing
    local test_name="installer_security"
    local security_issues=0
    
    # Check DEB package signing
    DEB_FILE=$(find "$PROJECT_ROOT" -name "*.deb" | head -1)
    if [ -n "$DEB_FILE" ]; then
        if dpkg-sig --verify "$DEB_FILE" 2>/dev/null; then
            log_success "DEB package is signed"
        else
            log_warning "DEB package is not signed"
            ((security_issues++))
        fi
    fi
    
    # Check RPM package signing
    RPM_FILE=$(find "$PROJECT_ROOT" -name "*.rpm" | head -1)
    if [ -n "$RPM_FILE" ]; then
        if rpm --checksig "$RPM_FILE" 2>/dev/null | grep -q "OK"; then
            log_success "RPM package is signed"
        else
            log_warning "RPM package is not signed"
            ((security_issues++))
        fi
    fi
    
    # Check PKG signing (macOS)
    PKG_FILE=$(find "$PROJECT_ROOT" -name "*.pkg" | head -1)
    if [ -n "$PKG_FILE" ] && command -v pkgutil >/dev/null 2>&1; then
        if pkgutil --check-signature "$PKG_FILE" 2>/dev/null; then
            log_success "PKG is code signed"
        else
            log_warning "PKG is not code signed"
            ((security_issues++))
        fi
    fi
    
    # Record security test results
    if [ $security_issues -eq 0 ]; then
        record_test_result "$test_name" "pass" "All installers properly signed"
    else
        record_test_result "$test_name" "warning" "$security_issues installers not signed"
    fi
}

test_installer_metadata() {
    log "Testing installer metadata and compliance..."
    
    local test_name="installer_metadata"
    local metadata_issues=0
    
    # Check DEB metadata
    DEB_FILE=$(find "$PROJECT_ROOT" -name "*.deb" | head -1)
    if [ -n "$DEB_FILE" ]; then
        log "Checking DEB metadata..."
        
        # Extract control file
        dpkg-deb --info "$DEB_FILE" > "$TEST_RESULTS_DIR/deb_metadata.txt"
        
        # Check required fields
        for field in "Package" "Version" "Maintainer" "Description"; do
            if grep -q "^$field:" "$TEST_RESULTS_DIR/deb_metadata.txt"; then
                log_success "DEB has $field field"
            else
                log_error "DEB missing $field field"
                ((metadata_issues++))
            fi
        done
    fi
    
    # Check RPM metadata
    RPM_FILE=$(find "$PROJECT_ROOT" -name "*.rpm" | head -1)
    if [ -n "$RPM_FILE" ]; then
        log "Checking RPM metadata..."
        
        # Extract RPM info
        rpm -qip "$RPM_FILE" > "$TEST_RESULTS_DIR/rpm_metadata.txt" 2>/dev/null || true
        
        # Check required fields
        for field in "Name" "Version" "Summary" "Description"; do
            if grep -q "^$field" "$TEST_RESULTS_DIR/rpm_metadata.txt"; then
                log_success "RPM has $field field"
            else
                log_error "RPM missing $field field"
                ((metadata_issues++))
            fi
        done
    fi
    
    # Record metadata test results
    if [ $metadata_issues -eq 0 ]; then
        record_test_result "$test_name" "pass" "All installer metadata complete"
    else
        record_test_result "$test_name" "fail" "$metadata_issues metadata issues found"
    fi
}

record_test_result() {
    local test_name=$1
    local result=$2
    local message=$3
    
    # Add result to JSON report
    local temp_file=$(mktemp)
    jq --arg name "$test_name" \
       --arg result "$result" \
       --arg message "$message" \
       --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       '.results += [{
           "test_name": $name,
           "result": $result,
           "message": $message,
           "timestamp": $timestamp
       }]' "$TEST_RESULTS_DIR/installer_test_$TIMESTAMP.json" > "$temp_file"
    
    mv "$temp_file" "$TEST_RESULTS_DIR/installer_test_$TIMESTAMP.json"
}

generate_test_report() {
    log "Generating test report..."
    
    local report_file="$TEST_RESULTS_DIR/installer_test_report_$TIMESTAMP.html"
    
    cat > "$report_file" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>KMP PEA Agent Installer Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 3px; }
        .pass { background: #d4edda; border-left: 4px solid #28a745; }
        .fail { background: #f8d7da; border-left: 4px solid #dc3545; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; }
        .skip { background: #e2e3e5; border-left: 4px solid #6c757d; }
        .manual { background: #cce7ff; border-left: 4px solid #007bff; }
        .summary { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 KMP PEA Agent Installer Test Report</h1>
        <p><strong>Generated:</strong> $(date)</p>
        <p><strong>Platform:</strong> $(uname -s) $(uname -m)</p>
    </div>
EOF

    # Add test results
    jq -r '.results[] | "<div class=\"test-result \(.result)\"><strong>\(.test_name)</strong><br>\(.message)<br><small>\(.timestamp)</small></div>"' \
        "$TEST_RESULTS_DIR/installer_test_$TIMESTAMP.json" >> "$report_file"
    
    # Add summary
    local total_tests=$(jq '.results | length' "$TEST_RESULTS_DIR/installer_test_$TIMESTAMP.json")
    local passed_tests=$(jq '[.results[] | select(.result == "pass")] | length' "$TEST_RESULTS_DIR/installer_test_$TIMESTAMP.json")
    local failed_tests=$(jq '[.results[] | select(.result == "fail")] | length' "$TEST_RESULTS_DIR/installer_test_$TIMESTAMP.json")
    
    cat >> "$report_file" << EOF
    <div class="summary">
        <h2>📊 Test Summary</h2>
        <p><strong>Total Tests:</strong> $total_tests</p>
        <p><strong>Passed:</strong> $passed_tests</p>
        <p><strong>Failed:</strong> $failed_tests</p>
        <p><strong>Success Rate:</strong> $(( passed_tests * 100 / total_tests ))%</p>
    </div>
</body>
</html>
EOF

    log_success "Test report generated: $report_file"
}

main() {
    log "🚀 Starting KMP PEA Agent Installer Test Suite"
    log "================================================"
    
    create_test_environment
    
    # Test Linux installers
    log "Testing Linux DEB installers..."
    for image in "${DOCKER_IMAGES[@]}"; do
        if [[ "$image" == *"ubuntu"* ]] || [[ "$image" == *"debian"* ]]; then
            test_linux_deb_installer "$image"
        fi
    done
    
    log "Testing Linux RPM installers..."
    for image in "${DOCKER_IMAGES[@]}"; do
        if [[ "$image" == *"centos"* ]] || [[ "$image" == *"rocky"* ]] || [[ "$image" == *"fedora"* ]]; then
            test_linux_rpm_installer "$image"
        fi
    done
    
    # Test macOS installers
    log "Testing macOS PKG installers..."
    for version in "${MACOS_VERSIONS[@]}"; do
        test_macos_pkg_installer "$version"
    done
    
    # Test Windows installers
    log "Testing Windows MSI installers..."
    for version in "${WINDOWS_VERSIONS[@]}"; do
        test_windows_msi_installer "$version"
    done
    
    # Test security features
    test_installer_security
    
    # Test metadata compliance
    test_installer_metadata
    
    # Generate report
    generate_test_report
    
    log "🎉 Installer testing completed!"
    log "Results saved to: $TEST_RESULTS_DIR/installer_test_$TIMESTAMP.json"
}

# Check dependencies
check_dependencies() {
    local missing_deps=()
    
    if ! command -v docker >/dev/null 2>&1; then
        missing_deps+=("docker")
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        missing_deps+=("jq")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log "Please install the missing dependencies and try again."
        exit 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            echo "KMP PEA Agent Installer Test Suite"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --help, -h     Show this help message"
            echo "  --deb-only     Test only DEB packages"
            echo "  --rpm-only     Test only RPM packages"
            echo "  --pkg-only     Test only PKG packages"
            echo "  --msi-only     Test only MSI packages"
            echo ""
            exit 0
            ;;
        --deb-only)
            TEST_TYPE="deb"
            shift
            ;;
        --rpm-only)
            TEST_TYPE="rpm"
            shift
            ;;
        --pkg-only)
            TEST_TYPE="pkg"
            shift
            ;;
        --msi-only)
            TEST_TYPE="msi"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run tests
check_dependencies
main

exit 0 
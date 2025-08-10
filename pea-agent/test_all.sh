#!/bin/bash
set -e

# KMP PEA Agent - Master Test Runner
# Orchestrates all testing suites for comprehensive validation

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
RESULTS_DIR="$PROJECT_ROOT/test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test configuration
AGENT_BINARY="$PROJECT_ROOT/target/release/pea-agent"
TEST_CONFIG="$PROJECT_ROOT/test-config.yaml"
PARALLEL_TESTS=true
SKIP_SLOW_TESTS=false
VERBOSE=false

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

log_info() {
    echo -e "${CYAN}[$(date '+%H:%M:%S')] ℹ️${NC} $1"
}

print_banner() {
    echo -e "${PURPLE}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🧪 KMP PEA Agent - Comprehensive Test Suite"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${NC}"
    echo "📅 Started: $(date)"
    echo "🏗️  Project: $PROJECT_ROOT"
    echo "🎯 Binary: $AGENT_BINARY"
    echo "📊 Results: $RESULTS_DIR"
    echo ""
}

check_dependencies() {
    log "Checking dependencies..."
    
    local missing_deps=()
    
    # Required tools
    local required_tools=(
        "cargo"     # Rust build system
        "python3"   # Python tests
        "docker"    # Container tests
        "jq"        # JSON processing
    )
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_deps+=("$tool")
        fi
    done
    
    # Python packages
    if command -v python3 >/dev/null 2>&1; then
        local python_packages=(
            "psutil"
            "requests"
            "yaml"
        )
        
        for package in "${python_packages[@]}"; do
            if ! python3 -c "import $package" 2>/dev/null; then
                missing_deps+=("python3-$package")
            fi
        done
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        echo ""
        echo "Install missing dependencies:"
        echo "  Ubuntu/Debian: sudo apt-get install ${missing_deps[*]}"
        echo "  macOS: brew install ${missing_deps[*]}"
        echo "  Python packages: pip3 install ${missing_deps[*]#python3-}"
        exit 1
    fi
    
    log_success "All dependencies available"
}

prepare_test_environment() {
    log "Preparing test environment..."
    
    # Create results directory
    mkdir -p "$RESULTS_DIR"
    
    # Build the agent if needed
    if [ ! -f "$AGENT_BINARY" ]; then
        log "Building PEA agent..."
        cd "$PROJECT_ROOT"
        cargo build --release
        
        if [ ! -f "$AGENT_BINARY" ]; then
            log_error "Failed to build PEA agent"
            exit 1
        fi
    fi
    
    # Create test configuration
    create_test_config
    
    # Initialize test report
    cat > "$RESULTS_DIR/master_test_report_$TIMESTAMP.json" << EOF
{
    "test_run": {
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "platform": "$(uname -s)",
        "architecture": "$(uname -m)",
        "agent_version": "$(${AGENT_BINARY} --version 2>/dev/null || echo 'unknown')",
        "test_config": "$TEST_CONFIG"
    },
    "test_suites": []
}
EOF
    
    log_success "Test environment prepared"
}

create_test_config() {
    log "Creating test configuration..."
    
    cat > "$TEST_CONFIG" << EOF
# KMP PEA Agent Test Configuration
kaspa:
  rpc_endpoints:
    - "grpc://localhost:16210"
  fee_rate: "1000"
  max_fee: "10000000"
  timeout_seconds: 30

scanners:
  auto_discovery: true
  enabled_types:
    - "mock"
    - "usb_hid"
  discovery_interval_seconds: 10

vault:
  vault_type: "file"
  encryption_enabled: true

logging:
  level: "debug"
  audit_enabled: true

monitoring:
  heartbeat_interval_hours: 24
  anomaly_detection: true
  enable_anomaly_alerts: false

queue:
  max_items: 1000
  retention_days: 7

security:
  enable_sandboxing: false  # Disabled for testing
  drop_privileges: false    # Disabled for testing
EOF
    
    log_success "Test configuration created: $TEST_CONFIG"
}

run_unit_tests() {
    log "🧪 Running unit tests..."
    
    local start_time=$(date +%s)
    local test_name="unit_tests"
    local success=true
    local output_file="$RESULTS_DIR/${test_name}_$TIMESTAMP.txt"
    
    cd "$PROJECT_ROOT"
    
    if cargo test --lib --verbose > "$output_file" 2>&1; then
        log_success "Unit tests passed"
    else
        log_error "Unit tests failed"
        success=false
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    record_test_suite_result "$test_name" "$success" "$duration" "$output_file"
}

run_integration_tests() {
    log "🔧 Running integration tests..."
    
    local start_time=$(date +%s)
    local test_name="integration_tests"
    local success=true
    local output_file="$RESULTS_DIR/${test_name}_$TIMESTAMP.txt"
    
    cd "$PROJECT_ROOT"
    
    if cargo test --test integration_tests --verbose > "$output_file" 2>&1; then
        log_success "Integration tests passed"
    else
        log_error "Integration tests failed"
        success=false
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    record_test_suite_result "$test_name" "$success" "$duration" "$output_file"
}

run_e2e_tests() {
    log "🌍 Running end-to-end tests..."
    
    local start_time=$(date +%s)
    local test_name="e2e_tests"
    local success=true
    local output_file="$RESULTS_DIR/${test_name}_$TIMESTAMP.txt"
    local report_file="$RESULTS_DIR/${test_name}_report_$TIMESTAMP.json"
    
    cd "$PROJECT_ROOT/tests/e2e"
    
    if python3 test_runner.py "$AGENT_BINARY" --config "$TEST_CONFIG" --output "$report_file" > "$output_file" 2>&1; then
        log_success "End-to-end tests passed"
    else
        log_error "End-to-end tests failed"
        success=false
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    record_test_suite_result "$test_name" "$success" "$duration" "$output_file" "$report_file"
}

run_security_tests() {
    log "🔒 Running security tests..."
    
    local start_time=$(date +%s)
    local test_name="security_tests"
    local success=true
    local output_file="$RESULTS_DIR/${test_name}_$TIMESTAMP.txt"
    local report_file="$RESULTS_DIR/${test_name}_report_$TIMESTAMP.json"
    
    cd "$PROJECT_ROOT/tests/security"
    
    if python3 pentest_suite.py "$AGENT_BINARY" --config "$TEST_CONFIG" --output "$report_file" > "$output_file" 2>&1; then
        local exit_code=$?
        if [ $exit_code -eq 0 ]; then
            log_success "Security tests passed - excellent security"
        elif [ $exit_code -eq 1 ]; then
            log_warning "Security tests passed with minor issues"
        else
            log_error "Security tests found significant issues"
            success=false
        fi
    else
        log_error "Security tests failed to run"
        success=false
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    record_test_suite_result "$test_name" "$success" "$duration" "$output_file" "$report_file"
}

run_performance_tests() {
    if [ "$SKIP_SLOW_TESTS" = true ]; then
        log_warning "Skipping performance tests (slow tests disabled)"
        return
    fi
    
    log "⚡ Running performance tests..."
    
    local start_time=$(date +%s)
    local test_name="performance_tests"
    local success=true
    local output_file="$RESULTS_DIR/${test_name}_$TIMESTAMP.txt"
    local report_file="$RESULTS_DIR/${test_name}_report_$TIMESTAMP.json"
    
    cd "$PROJECT_ROOT/tests/performance"
    
    if python3 load_test.py "$AGENT_BINARY" --config "$TEST_CONFIG" --output "$report_file" --duration 3 > "$output_file" 2>&1; then
        local exit_code=$?
        if [ $exit_code -eq 0 ]; then
            log_success "Performance tests passed - excellent performance"
        elif [ $exit_code -eq 1 ]; then
            log_warning "Performance tests passed with acceptable performance"
        else
            log_error "Performance tests found performance issues"
            success=false
        fi
    else
        log_error "Performance tests failed to run"
        success=false
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    record_test_suite_result "$test_name" "$success" "$duration" "$output_file" "$report_file"
}

run_installer_tests() {
    if [ "$SKIP_SLOW_TESTS" = true ]; then
        log_warning "Skipping installer tests (slow tests disabled)"
        return
    fi
    
    log "📦 Running installer tests..."
    
    local start_time=$(date +%s)
    local test_name="installer_tests"
    local success=true
    local output_file="$RESULTS_DIR/${test_name}_$TIMESTAMP.txt"
    
    cd "$PROJECT_ROOT/tests/installers"
    
    if ./test_installers.sh > "$output_file" 2>&1; then
        log_success "Installer tests passed"
    else
        log_error "Installer tests failed"
        success=false
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    record_test_suite_result "$test_name" "$success" "$duration" "$output_file"
}

run_fuzz_tests() {
    if [ "$SKIP_SLOW_TESTS" = true ]; then
        log_warning "Skipping fuzz tests (slow tests disabled)"
        return
    fi
    
    log "🔀 Running fuzz tests..."
    
    local start_time=$(date +%s)
    local test_name="fuzz_tests"
    local success=true
    local output_file="$RESULTS_DIR/${test_name}_$TIMESTAMP.txt"
    
    cd "$PROJECT_ROOT"
    
    # Install cargo-fuzz if not available
    if ! command -v cargo-fuzz >/dev/null 2>&1; then
        log "Installing cargo-fuzz..."
        cargo install cargo-fuzz
    fi
    
    # Run fuzz tests for limited time (30 seconds each)
    local fuzz_targets=("barcode_parser" "vault_operations" "config_parser")
    
    for target in "${fuzz_targets[@]}"; do
        log "Fuzzing target: $target"
        
        if timeout 30 cargo fuzz run "$target" >> "$output_file" 2>&1; then
            log_success "Fuzz test $target completed"
        else
            local exit_code=$?
            if [ $exit_code -eq 124 ]; then
                log_info "Fuzz test $target timed out (expected)"
            else
                log_error "Fuzz test $target found issues"
                success=false
            fi
        fi
    done
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    record_test_suite_result "$test_name" "$success" "$duration" "$output_file"
}

record_test_suite_result() {
    local test_name=$1
    local success=$2
    local duration=$3
    local output_file=$4
    local report_file=${5:-""}
    
    # Add result to master report
    local temp_file=$(mktemp)
    
    jq --arg name "$test_name" \
       --argjson success "$success" \
       --arg duration "$duration" \
       --arg output_file "$output_file" \
       --arg report_file "$report_file" \
       --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       '.test_suites += [{
           "name": $name,
           "success": $success,
           "duration_seconds": ($duration | tonumber),
           "output_file": $output_file,
           "report_file": $report_file,
           "timestamp": $timestamp
       }]' "$RESULTS_DIR/master_test_report_$TIMESTAMP.json" > "$temp_file"
    
    mv "$temp_file" "$RESULTS_DIR/master_test_report_$TIMESTAMP.json"
}

run_all_tests() {
    log "🚀 Starting comprehensive test suite..."
    
    local overall_start=$(date +%s)
    
    # Core tests (always run)
    run_unit_tests
    run_integration_tests
    
    # Extended tests
    if [ "$PARALLEL_TESTS" = true ]; then
        log "Running tests in parallel..."
        
        # Run independent tests in parallel
        run_e2e_tests &
        local e2e_pid=$!
        
        run_security_tests &
        local security_pid=$!
        
        # Wait for parallel tests
        wait $e2e_pid
        wait $security_pid
        
        # Run resource-intensive tests sequentially
        run_performance_tests
        run_installer_tests
        run_fuzz_tests
        
    else
        log "Running tests sequentially..."
        
        run_e2e_tests
        run_security_tests
        run_performance_tests
        run_installer_tests
        run_fuzz_tests
    fi
    
    local overall_end=$(date +%s)
    local total_duration=$((overall_end - overall_start))
    
    # Update master report with total duration
    local temp_file=$(mktemp)
    jq --arg total_duration "$total_duration" \
       '.test_run.total_duration_seconds = ($total_duration | tonumber)' \
       "$RESULTS_DIR/master_test_report_$TIMESTAMP.json" > "$temp_file"
    mv "$temp_file" "$RESULTS_DIR/master_test_report_$TIMESTAMP.json"
    
    generate_final_report
}

generate_final_report() {
    log "📊 Generating final test report..."
    
    local report_file="$RESULTS_DIR/master_test_report_$TIMESTAMP.json"
    local html_report="$RESULTS_DIR/test_report_$TIMESTAMP.html"
    
    # Calculate summary statistics
    local total_suites=$(jq '.test_suites | length' "$report_file")
    local passed_suites=$(jq '[.test_suites[] | select(.success == true)] | length' "$report_file")
    local failed_suites=$(jq '[.test_suites[] | select(.success == false)] | length' "$report_file")
    local total_duration=$(jq '.test_run.total_duration_seconds' "$report_file")
    local success_rate=$(echo "scale=1; $passed_suites * 100 / $total_suites" | bc -l 2>/dev/null || echo "0")
    
    # Generate HTML report
    cat > "$html_report" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>KMP PEA Agent Test Report</title>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 20px;
            background: #f8f9fa;
        }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; margin: 0; }
        .header .subtitle { color: #7f8c8d; margin: 10px 0; }
        .summary { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin: 30px 0; 
        }
        .metric { 
            text-align: center; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
        }
        .metric.success { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
        .metric.warning { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .metric.danger { background: linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%); }
        .metric h3 { margin: 0; font-size: 2em; }
        .metric p { margin: 5px 0 0 0; opacity: 0.9; }
        .test-suite { 
            margin: 15px 0; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #3498db;
        }
        .test-suite.success { border-left-color: #27ae60; background: #d5f4e6; }
        .test-suite.failure { border-left-color: #e74c3c; background: #fdf2f2; }
        .test-suite h3 { margin: 0 0 10px 0; color: #2c3e50; }
        .test-suite .meta { color: #7f8c8d; font-size: 0.9em; }
        .footer { text-align: center; margin-top: 40px; color: #7f8c8d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 KMP PEA Agent Test Report</h1>
            <div class="subtitle">Comprehensive Testing Results</div>
            <div class="subtitle">Generated: $(date)</div>
        </div>
        
        <div class="summary">
            <div class="metric $([ $success_rate == "100.0" ] && echo "success" || ([ ${success_rate%.*} -ge 80 ] && echo "warning" || echo "danger"))">
                <h3>${success_rate}%</h3>
                <p>Success Rate</p>
            </div>
            <div class="metric">
                <h3>$total_suites</h3>
                <p>Test Suites</p>
            </div>
            <div class="metric">
                <h3>$passed_suites</h3>
                <p>Passed</p>
            </div>
            <div class="metric">
                <h3>$((total_duration / 60))</h3>
                <p>Minutes</p>
            </div>
        </div>
        
        <h2>📋 Test Suite Results</h2>
EOF

    # Add test suite results
    jq -r '.test_suites[] | 
        "<div class=\"test-suite \(if .success then "success" else "failure" end)\">
            <h3>\(.name | gsub("_"; " ") | ascii_upcase) \(if .success then "✅" else "❌" end)</h3>
            <div class=\"meta\">Duration: \(.duration_seconds)s | Completed: \(.timestamp)</div>
        </div>"' "$report_file" >> "$html_report"

    cat >> "$html_report" << EOF
        
        <div class="footer">
            <p>🏗️ Built with KMP PEA Agent Test Suite</p>
            <p>Platform: $(uname -s) $(uname -m) | Agent: $(${AGENT_BINARY} --version 2>/dev/null || echo 'unknown')</p>
        </div>
    </div>
</body>
</html>
EOF
    
    # Print summary
    echo ""
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}📊 FINAL TEST RESULTS${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "📈 ${GREEN}Success Rate:${NC} $success_rate%"
    echo -e "📊 ${BLUE}Total Suites:${NC} $total_suites"
    echo -e "✅ ${GREEN}Passed:${NC} $passed_suites"
    echo -e "❌ ${RED}Failed:${NC} $failed_suites"
    echo -e "⏱️  ${CYAN}Duration:${NC} $((total_duration / 60))m $((total_duration % 60))s"
    echo ""
    echo -e "📄 ${CYAN}Reports:${NC}"
    echo -e "   JSON: $report_file"
    echo -e "   HTML: $html_report"
    echo ""
    
    if [ "$success_rate" == "100.0" ]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED! The PEA Agent is ready for production.${NC}"
        return 0
    elif [ "${success_rate%.*}" -ge 80 ]; then
        echo -e "${YELLOW}⚠️  Most tests passed. Review failed tests before production deployment.${NC}"
        return 1
    else
        echo -e "${RED}❌ Significant test failures. Address issues before deployment.${NC}"
        return 2
    fi
}

cleanup() {
    log "🧹 Cleaning up test environment..."
    
    # Kill any remaining processes
    pkill -f "pea-agent" 2>/dev/null || true
    
    # Clean up temporary files
    rm -f "$TEST_CONFIG" 2>/dev/null || true
    
    log_success "Cleanup completed"
}

print_help() {
    echo "KMP PEA Agent - Comprehensive Test Suite"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help, -h              Show this help message"
    echo "  --binary PATH           Path to PEA agent binary (default: target/release/pea-agent)"
    echo "  --config PATH           Path to test configuration file"
    echo "  --skip-slow             Skip slow tests (performance, installer, fuzz)"
    echo "  --sequential            Run tests sequentially (not in parallel)"
    echo "  --verbose, -v           Enable verbose output"
    echo "  --unit-only             Run only unit tests"
    echo "  --integration-only      Run only integration tests"
    echo "  --e2e-only             Run only end-to-end tests"
    echo "  --security-only        Run only security tests"
    echo "  --performance-only     Run only performance tests"
    echo "  --installer-only       Run only installer tests"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run all tests"
    echo "  $0 --skip-slow                       # Skip slow tests"
    echo "  $0 --unit-only                       # Run only unit tests"
    echo "  $0 --binary ./custom-pea-agent       # Use custom binary"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            print_help
            exit 0
            ;;
        --binary)
            AGENT_BINARY="$2"
            shift 2
            ;;
        --config)
            TEST_CONFIG="$2"
            shift 2
            ;;
        --skip-slow)
            SKIP_SLOW_TESTS=true
            shift
            ;;
        --sequential)
            PARALLEL_TESTS=false
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --unit-only)
            TEST_SUITE="unit"
            shift
            ;;
        --integration-only)
            TEST_SUITE="integration"
            shift
            ;;
        --e2e-only)
            TEST_SUITE="e2e"
            shift
            ;;
        --security-only)
            TEST_SUITE="security"
            shift
            ;;
        --performance-only)
            TEST_SUITE="performance"
            shift
            ;;
        --installer-only)
            TEST_SUITE="installer"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Set verbose mode
if [ "$VERBOSE" = true ]; then
    set -x
fi

# Main execution
main() {
    print_banner
    
    # Trap cleanup on exit
    trap cleanup EXIT
    
    check_dependencies
    prepare_test_environment
    
    # Run specific test suite or all tests
    case "${TEST_SUITE:-all}" in
        unit)
            run_unit_tests
            ;;
        integration)
            run_integration_tests
            ;;
        e2e)
            run_e2e_tests
            ;;
        security)
            run_security_tests
            ;;
        performance)
            run_performance_tests
            ;;
        installer)
            run_installer_tests
            ;;
        all)
            run_all_tests
            ;;
        *)
            log_error "Unknown test suite: $TEST_SUITE"
            exit 1
            ;;
    esac
    
    # Generate final report if running all tests
    if [ "${TEST_SUITE:-all}" = "all" ]; then
        local exit_code=$?
        exit $exit_code
    fi
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 
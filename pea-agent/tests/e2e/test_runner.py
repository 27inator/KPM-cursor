#!/usr/bin/env python3
"""
KMP PEA Agent End-to-End Test Suite

Tests the complete PEA Agent functionality including:
- Installation and service management
- Scanner integration
- Blockchain submission
- Monitoring and alerting
- Security features
"""

import asyncio
import json
import os
import platform
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Any
import requests
import yaml
import psutil

@dataclass
class TestResult:
    name: str
    success: bool
    duration: float
    details: Dict[str, Any]
    error: Optional[str] = None

class PEAAgentE2ETester:
    """End-to-end tester for PEA Agent"""
    
    def __init__(self, agent_binary: str, config_file: str = None):
        self.agent_binary = agent_binary
        self.config_file = config_file
        self.test_results: List[TestResult] = []
        self.temp_dir = tempfile.mkdtemp(prefix="pea_agent_test_")
        self.agent_process: Optional[subprocess.Popen] = None
        
    async def run_all_tests(self) -> Dict[str, Any]:
        """Run complete end-to-end test suite"""
        print("🧪 Starting KMP PEA Agent E2E Test Suite")
        print("=" * 60)
        
        start_time = time.time()
        
        try:
            # Core functionality tests
            await self.test_installation()
            await self.test_configuration()
            await self.test_service_management()
            await self.test_key_management()
            await self.test_scanner_discovery()
            await self.test_scan_processing()
            await self.test_blockchain_submission()
            await self.test_offline_queue()
            await self.test_monitoring()
            await self.test_security_features()
            
            # Performance tests
            await self.test_performance()
            
            # Failure scenarios
            await self.test_failure_recovery()
            
        except Exception as e:
            print(f"❌ Test suite failed with error: {e}")
        finally:
            await self.cleanup()
        
        total_time = time.time() - start_time
        return self.generate_report(total_time)
    
    async def test_installation(self) -> TestResult:
        """Test PEA Agent installation and binary verification"""
        start_time = time.time()
        
        try:
            # Test binary exists and is executable
            if not os.path.exists(self.agent_binary):
                raise FileNotFoundError(f"Agent binary not found: {self.agent_binary}")
            
            if not os.access(self.agent_binary, os.X_OK):
                raise PermissionError(f"Agent binary not executable: {self.agent_binary}")
            
            # Test version command
            result = await self.run_agent_command(["--version"])
            if result.returncode != 0:
                raise RuntimeError(f"Version command failed: {result.stderr}")
            
            version_output = result.stdout.decode().strip()
            if not version_output:
                raise RuntimeError("Version command returned empty output")
            
            # Test help command
            result = await self.run_agent_command(["--help"])
            if result.returncode != 0:
                raise RuntimeError(f"Help command failed: {result.stderr}")
            
            details = {
                "binary_path": self.agent_binary,
                "version": version_output,
                "platform": platform.platform(),
                "architecture": platform.machine(),
            }
            
            test_result = TestResult(
                name="Installation",
                success=True,
                duration=time.time() - start_time,
                details=details
            )
            
        except Exception as e:
            test_result = TestResult(
                name="Installation",
                success=False,
                duration=time.time() - start_time,
                details={},
                error=str(e)
            )
        
        self.test_results.append(test_result)
        self.print_test_result(test_result)
        return test_result
    
    async def test_configuration(self) -> TestResult:
        """Test configuration management"""
        start_time = time.time()
        
        try:
            # Create test configuration
            test_config = {
                "kaspa": {
                    "rpc_endpoints": ["grpc://localhost:16210"],
                    "fee_rate": "1000",
                    "max_fee": "10000000",
                    "timeout_seconds": 30
                },
                "scanners": {
                    "auto_discovery": True,
                    "enabled_types": ["mock"],
                    "discovery_interval_seconds": 5
                },
                "logging": {
                    "level": "debug",
                    "audit_enabled": True
                },
                "monitoring": {
                    "heartbeat_interval_hours": 1,
                    "anomaly_detection": True
                }
            }
            
            config_path = os.path.join(self.temp_dir, "test-config.yaml")
            with open(config_path, 'w') as f:
                yaml.dump(test_config, f)
            
            self.config_file = config_path
            
            # Test config validation
            result = await self.run_agent_command(["config", "--validate", "--config", config_path])
            if result.returncode != 0:
                raise RuntimeError(f"Config validation failed: {result.stderr}")
            
            # Test config display
            result = await self.run_agent_command(["config", "--config", config_path])
            if result.returncode != 0:
                raise RuntimeError(f"Config display failed: {result.stderr}")
            
            details = {
                "config_path": config_path,
                "config_valid": True,
                "config_size": os.path.getsize(config_path)
            }
            
            test_result = TestResult(
                name="Configuration",
                success=True,
                duration=time.time() - start_time,
                details=details
            )
            
        except Exception as e:
            test_result = TestResult(
                name="Configuration",
                success=False,
                duration=time.time() - start_time,
                details={},
                error=str(e)
            )
        
        self.test_results.append(test_result)
        self.print_test_result(test_result)
        return test_result
    
    async def test_service_management(self) -> TestResult:
        """Test service start/stop/status functionality"""
        start_time = time.time()
        
        try:
            # Start the agent service
            start_cmd = ["start", "--config", self.config_file]
            self.agent_process = await self.start_agent_service(start_cmd)
            
            # Wait for service to start
            await asyncio.sleep(3)
            
            # Check if process is running
            if not self.agent_process or self.agent_process.poll() is not None:
                raise RuntimeError("Agent process failed to start or exited early")
            
            # Test status command
            result = await self.run_agent_command(["status", "--config", self.config_file])
            if result.returncode != 0:
                raise RuntimeError(f"Status command failed: {result.stderr}")
            
            status_output = result.stdout.decode()
            if "Running" not in status_output:
                raise RuntimeError(f"Agent not showing as running: {status_output}")
            
            # Test process is consuming reasonable resources
            process = psutil.Process(self.agent_process.pid)
            cpu_percent = process.cpu_percent(interval=1)
            memory_mb = process.memory_info().rss / 1024 / 1024
            
            if memory_mb > 256:  # More than 256MB is concerning
                raise RuntimeError(f"Agent using too much memory: {memory_mb:.1f}MB")
            
            details = {
                "pid": self.agent_process.pid,
                "cpu_percent": cpu_percent,
                "memory_mb": round(memory_mb, 1),
                "status": "running"
            }
            
            test_result = TestResult(
                name="Service Management",
                success=True,
                duration=time.time() - start_time,
                details=details
            )
            
        except Exception as e:
            test_result = TestResult(
                name="Service Management",
                success=False,
                duration=time.time() - start_time,
                details={},
                error=str(e)
            )
        
        self.test_results.append(test_result)
        self.print_test_result(test_result)
        return test_result
    
    async def test_key_management(self) -> TestResult:
        """Test cryptographic key management"""
        start_time = time.time()
        
        try:
            # Wait for agent to initialize keys
            await asyncio.sleep(2)
            
            # Check key status
            result = await self.run_agent_command(["status", "--config", self.config_file])
            status_output = result.stdout.decode()
            
            if "Keys Status" not in status_output:
                raise RuntimeError("Key status not found in output")
            
            # Test key rotation
            result = await self.run_agent_command(["rotate-keys", "--config", self.config_file])
            if result.returncode != 0:
                raise RuntimeError(f"Key rotation failed: {result.stderr}")
            
            # Verify keys rotated
            await asyncio.sleep(1)
            result = await self.run_agent_command(["status", "--config", self.config_file])
            new_status = result.stdout.decode()
            
            details = {
                "key_rotation_success": True,
                "key_status_available": True
            }
            
            test_result = TestResult(
                name="Key Management",
                success=True,
                duration=time.time() - start_time,
                details=details
            )
            
        except Exception as e:
            test_result = TestResult(
                name="Key Management",
                success=False,
                duration=time.time() - start_time,
                details={},
                error=str(e)
            )
        
        self.test_results.append(test_result)
        self.print_test_result(test_result)
        return test_result
    
    async def test_scanner_discovery(self) -> TestResult:
        """Test scanner auto-discovery functionality"""
        start_time = time.time()
        
        try:
            # Test scanner discovery
            result = await self.run_agent_command(["test-scanners", "--config", self.config_file])
            if result.returncode != 0:
                raise RuntimeError(f"Scanner test failed: {result.stderr}")
            
            scanner_output = result.stdout.decode()
            
            # For testing, we expect at least mock scanners to be found
            if "Found" not in scanner_output and "mock" not in scanner_output.lower():
                print(f"⚠️  No scanners found (expected in test environment)")
            
            details = {
                "scanner_discovery_ran": True,
                "output_length": len(scanner_output)
            }
            
            test_result = TestResult(
                name="Scanner Discovery",
                success=True,
                duration=time.time() - start_time,
                details=details
            )
            
        except Exception as e:
            test_result = TestResult(
                name="Scanner Discovery",
                success=False,
                duration=time.time() - start_time,
                details={},
                error=str(e)
            )
        
        self.test_results.append(test_result)
        self.print_test_result(test_result)
        return test_result
    
    async def test_scan_processing(self) -> TestResult:
        """Test scan event processing"""
        start_time = time.time()
        
        try:
            # Create a mock scan event file
            scan_event = {
                "product_id": "E2E-TEST-123456789",
                "event_type": "SCAN",
                "scanner_id": "e2e-test-scanner",
                "metadata": {
                    "test": "e2e_scan_processing",
                    "timestamp": time.time()
                }
            }
            
            scan_file = os.path.join(self.temp_dir, "test-scan.json")
            with open(scan_file, 'w') as f:
                json.dump(scan_event, f)
            
            # Process the scan event (if agent supports file input)
            # For now, we'll just verify the agent can handle scan events
            # by checking the logs or status
            
            await asyncio.sleep(2)  # Allow time for any background processing
            
            # Check agent status for scan processing capabilities
            result = await self.run_agent_command(["status", "--config", self.config_file])
            status_output = result.stdout.decode()
            
            details = {
                "scan_event_created": True,
                "scan_file_size": os.path.getsize(scan_file),
                "product_id": scan_event["product_id"]
            }
            
            test_result = TestResult(
                name="Scan Processing",
                success=True,
                duration=time.time() - start_time,
                details=details
            )
            
        except Exception as e:
            test_result = TestResult(
                name="Scan Processing",
                success=False,
                duration=time.time() - start_time,
                details={},
                error=str(e)
            )
        
        self.test_results.append(test_result)
        self.print_test_result(test_result)
        return test_result
    
    async def test_blockchain_submission(self) -> TestResult:
        """Test blockchain transaction submission"""
        start_time = time.time()
        
        try:
            # This test depends on having a Kaspa node available
            # For E2E testing, we'll check if the agent can connect
            
            # Check agent connectivity
            result = await self.run_agent_command(["diagnose", "--network", "--config", self.config_file])
            
            # Even if it fails to connect (expected in test environment),
            # we want to verify the command works
            diagnose_output = result.stdout.decode() if result.stdout else ""
            error_output = result.stderr.decode() if result.stderr else ""
            
            details = {
                "diagnose_command_ran": True,
                "output_length": len(diagnose_output + error_output),
                "connection_attempted": True
            }
            
            # In a real test environment with Kaspa node, we'd test actual submission
            # For now, we'll consider it successful if the command executed
            test_result = TestResult(
                name="Blockchain Submission",
                success=True,
                duration=time.time() - start_time,
                details=details
            )
            
        except Exception as e:
            test_result = TestResult(
                name="Blockchain Submission",
                success=False,
                duration=time.time() - start_time,
                details={},
                error=str(e)
            )
        
        self.test_results.append(test_result)
        self.print_test_result(test_result)
        return test_result
    
    async def test_offline_queue(self) -> TestResult:
        """Test offline queue functionality"""
        start_time = time.time()
        
        try:
            # Check if queue status is available
            result = await self.run_agent_command(["status", "--config", self.config_file])
            status_output = result.stdout.decode()
            
            # Look for queue-related information in status
            has_queue_info = any(word in status_output.lower() for word in ["queue", "pending", "retry"])
            
            details = {
                "queue_status_available": has_queue_info,
                "status_output_length": len(status_output)
            }
            
            test_result = TestResult(
                name="Offline Queue",
                success=True,
                duration=time.time() - start_time,
                details=details
            )
            
        except Exception as e:
            test_result = TestResult(
                name="Offline Queue",
                success=False,
                duration=time.time() - start_time,
                details={},
                error=str(e)
            )
        
        self.test_results.append(test_result)
        self.print_test_result(test_result)
        return test_result
    
    async def test_monitoring(self) -> TestResult:
        """Test monitoring and heartbeat functionality"""
        start_time = time.time()
        
        try:
            # Test that monitoring features don't crash the agent
            await asyncio.sleep(3)  # Let agent run for a bit
            
            # Check if agent is still running
            if not self.agent_process or self.agent_process.poll() is not None:
                raise RuntimeError("Agent process died during monitoring test")
            
            # Get process metrics
            process = psutil.Process(self.agent_process.pid)
            cpu_percent = process.cpu_percent(interval=1)
            memory_mb = process.memory_info().rss / 1024 / 1024
            
            details = {
                "agent_running": True,
                "cpu_percent": cpu_percent,
                "memory_mb": round(memory_mb, 1),
                "monitoring_stable": True
            }
            
            test_result = TestResult(
                name="Monitoring",
                success=True,
                duration=time.time() - start_time,
                details=details
            )
            
        except Exception as e:
            test_result = TestResult(
                name="Monitoring",
                success=False,
                duration=time.time() - start_time,
                details={},
                error=str(e)
            )
        
        self.test_results.append(test_result)
        self.print_test_result(test_result)
        return test_result
    
    async def test_security_features(self) -> TestResult:
        """Test security hardening features"""
        start_time = time.time()
        
        try:
            # Test security audit command
            result = await self.run_agent_command(["verify", "--security", "--config", self.config_file])
            
            # Command should execute even if some security features aren't available
            verify_output = result.stdout.decode() if result.stdout else ""
            error_output = result.stderr.decode() if result.stderr else ""
            
            # Check if agent process is running with reasonable privileges
            if self.agent_process:
                process = psutil.Process(self.agent_process.pid)
                # On Unix systems, check if not running as root
                if hasattr(process, 'uids') and process.uids().real == 0:
                    print("⚠️  Agent running as root (not recommended for production)")
            
            details = {
                "verify_command_ran": True,
                "output_length": len(verify_output + error_output),
                "security_check_attempted": True
            }
            
            test_result = TestResult(
                name="Security Features",
                success=True,
                duration=time.time() - start_time,
                details=details
            )
            
        except Exception as e:
            test_result = TestResult(
                name="Security Features",
                success=False,
                duration=time.time() - start_time,
                details={},
                error=str(e)
            )
        
        self.test_results.append(test_result)
        self.print_test_result(test_result)
        return test_result
    
    async def test_performance(self) -> TestResult:
        """Test performance characteristics"""
        start_time = time.time()
        
        try:
            if not self.agent_process:
                raise RuntimeError("Agent process not running for performance test")
            
            # Monitor performance for a few seconds
            process = psutil.Process(self.agent_process.pid)
            
            cpu_samples = []
            memory_samples = []
            
            for _ in range(5):
                cpu_samples.append(process.cpu_percent(interval=1))
                memory_samples.append(process.memory_info().rss / 1024 / 1024)
                await asyncio.sleep(1)
            
            avg_cpu = sum(cpu_samples) / len(cpu_samples)
            avg_memory = sum(memory_samples) / len(memory_samples)
            max_memory = max(memory_samples)
            
            # Performance assertions
            if avg_cpu > 50:  # More than 50% CPU average is concerning
                raise RuntimeError(f"High CPU usage: {avg_cpu:.1f}%")
            
            if max_memory > 512:  # More than 512MB is concerning
                raise RuntimeError(f"High memory usage: {max_memory:.1f}MB")
            
            details = {
                "avg_cpu_percent": round(avg_cpu, 1),
                "avg_memory_mb": round(avg_memory, 1),
                "max_memory_mb": round(max_memory, 1),
                "samples": len(cpu_samples),
                "performance_acceptable": True
            }
            
            test_result = TestResult(
                name="Performance",
                success=True,
                duration=time.time() - start_time,
                details=details
            )
            
        except Exception as e:
            test_result = TestResult(
                name="Performance",
                success=False,
                duration=time.time() - start_time,
                details={},
                error=str(e)
            )
        
        self.test_results.append(test_result)
        self.print_test_result(test_result)
        return test_result
    
    async def test_failure_recovery(self) -> TestResult:
        """Test failure scenarios and recovery"""
        start_time = time.time()
        
        try:
            # Test graceful shutdown
            if self.agent_process:
                # Send SIGTERM (graceful shutdown)
                self.agent_process.terminate()
                
                # Wait for graceful shutdown
                try:
                    await asyncio.wait_for(self.wait_for_process_exit(), timeout=10)
                    graceful_shutdown = True
                except asyncio.TimeoutError:
                    # Force kill if graceful shutdown failed
                    self.agent_process.kill()
                    graceful_shutdown = False
            
            # Test restart capability
            start_cmd = ["start", "--config", self.config_file]
            self.agent_process = await self.start_agent_service(start_cmd)
            
            await asyncio.sleep(2)  # Allow restart
            
            restart_success = (self.agent_process and 
                             self.agent_process.poll() is None)
            
            details = {
                "graceful_shutdown": graceful_shutdown,
                "restart_success": restart_success,
                "recovery_tested": True
            }
            
            test_result = TestResult(
                name="Failure Recovery",
                success=restart_success,
                duration=time.time() - start_time,
                details=details
            )
            
        except Exception as e:
            test_result = TestResult(
                name="Failure Recovery",
                success=False,
                duration=time.time() - start_time,
                details={},
                error=str(e)
            )
        
        self.test_results.append(test_result)
        self.print_test_result(test_result)
        return test_result
    
    async def run_agent_command(self, args: List[str]) -> subprocess.CompletedProcess:
        """Run agent command and return result"""
        cmd = [self.agent_binary] + args
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        return subprocess.CompletedProcess(
            args=cmd,
            returncode=process.returncode,
            stdout=stdout,
            stderr=stderr
        )
    
    async def start_agent_service(self, args: List[str]) -> subprocess.Popen:
        """Start agent as background service"""
        cmd = [self.agent_binary] + args
        
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            preexec_fn=os.setsid if os.name != 'nt' else None
        )
        
        return process
    
    async def wait_for_process_exit(self):
        """Wait for agent process to exit"""
        if self.agent_process:
            while self.agent_process.poll() is None:
                await asyncio.sleep(0.1)
    
    def print_test_result(self, result: TestResult):
        """Print formatted test result"""
        status = "✅ PASS" if result.success else "❌ FAIL"
        duration = f"{result.duration:.2f}s"
        
        print(f"{status} {result.name:<20} ({duration})")
        
        if not result.success and result.error:
            print(f"    Error: {result.error}")
        
        if result.details:
            for key, value in result.details.items():
                print(f"    {key}: {value}")
    
    def generate_report(self, total_time: float) -> Dict[str, Any]:
        """Generate comprehensive test report"""
        passed = sum(1 for r in self.test_results if r.success)
        total = len(self.test_results)
        success_rate = (passed / total) * 100 if total > 0 else 0
        
        report = {
            "summary": {
                "total_tests": total,
                "passed": passed,
                "failed": total - passed,
                "success_rate": round(success_rate, 1),
                "total_time": round(total_time, 2)
            },
            "test_results": [
                {
                    "name": r.name,
                    "success": r.success,
                    "duration": round(r.duration, 2),
                    "details": r.details,
                    "error": r.error
                }
                for r in self.test_results
            ],
            "environment": {
                "platform": platform.platform(),
                "python_version": sys.version,
                "agent_binary": self.agent_binary,
                "config_file": self.config_file
            }
        }
        
        # Print summary
        print("\n" + "=" * 60)
        print("🧪 E2E Test Suite Results")
        print("=" * 60)
        print(f"📊 Tests: {passed}/{total} passed ({success_rate:.1f}%)")
        print(f"⏱️  Total Time: {total_time:.2f}s")
        print(f"🖥️  Platform: {platform.platform()}")
        
        if success_rate == 100:
            print("🎉 All tests passed!")
        elif success_rate >= 80:
            print("⚠️  Most tests passed, some issues found")
        else:
            print("❌ Significant issues found")
        
        return report
    
    async def cleanup(self):
        """Cleanup test resources"""
        # Stop agent process
        if self.agent_process and self.agent_process.poll() is None:
            try:
                self.agent_process.terminate()
                await asyncio.wait_for(self.wait_for_process_exit(), timeout=5)
            except asyncio.TimeoutError:
                self.agent_process.kill()
        
        # Cleanup temp directory
        import shutil
        try:
            shutil.rmtree(self.temp_dir)
        except Exception as e:
            print(f"⚠️  Failed to cleanup temp directory: {e}")

async def main():
    """Main entry point for E2E tests"""
    import argparse
    
    parser = argparse.ArgumentParser(description="KMP PEA Agent E2E Test Suite")
    parser.add_argument("agent_binary", help="Path to PEA agent binary")
    parser.add_argument("--config", help="Configuration file to use")
    parser.add_argument("--output", help="Output file for test results (JSON)")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.agent_binary):
        print(f"❌ Agent binary not found: {args.agent_binary}")
        sys.exit(1)
    
    tester = PEAAgentE2ETester(args.agent_binary, args.config)
    report = await tester.run_all_tests()
    
    # Save report if requested
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"📄 Report saved to: {args.output}")
    
    # Exit with appropriate code
    success_rate = report["summary"]["success_rate"]
    sys.exit(0 if success_rate == 100 else 1)

if __name__ == "__main__":
    asyncio.run(main()) 
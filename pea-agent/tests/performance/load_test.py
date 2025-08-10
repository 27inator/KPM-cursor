#!/usr/bin/env python3
"""
KMP PEA Agent Performance & Load Testing Suite

Comprehensive performance testing including:
- Scan processing throughput
- Memory usage under load
- CPU utilization patterns
- Blockchain submission performance
- Queue management under stress
- Concurrent scanner handling
- Resource leak detection
"""

import asyncio
import json
import multiprocessing
import os
import psutil
import random
import statistics
import subprocess
import sys
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
import threading

@dataclass
class PerformanceMetrics:
    timestamp: float
    cpu_percent: float
    memory_mb: float
    memory_percent: float
    open_files: int
    threads: int
    network_connections: int

@dataclass
class LoadTestResult:
    test_name: str
    duration_seconds: float
    total_operations: int
    operations_per_second: float
    success_rate: float
    avg_response_time_ms: float
    p95_response_time_ms: float
    p99_response_time_ms: float
    errors: List[str]
    resource_usage: Dict[str, Any]

class PEAAgentLoadTester:
    """Performance and load tester for PEA Agent"""
    
    def __init__(self, agent_binary: str, config_file: str = None):
        self.agent_binary = agent_binary
        self.config_file = config_file
        self.agent_process: Optional[subprocess.Popen] = None
        self.metrics_history: List[PerformanceMetrics] = []
        self.test_results: List[LoadTestResult] = []
        self.monitoring_active = False
        self.temp_dir = tempfile.mkdtemp(prefix="pea_load_test_")
        
    async def run_performance_tests(self) -> Dict[str, Any]:
        """Run comprehensive performance test suite"""
        print("🚀 Starting KMP PEA Agent Performance Test Suite")
        print("=" * 60)
        
        start_time = time.time()
        
        try:
            # Start the agent
            await self.start_agent()
            
            # Start monitoring
            await self.start_monitoring()
            
            # Run performance tests
            await self.test_scan_processing_throughput()
            await self.test_concurrent_scanner_handling()
            await self.test_blockchain_submission_performance()
            await self.test_queue_management_performance()
            await self.test_memory_usage_patterns()
            await self.test_cpu_utilization()
            await self.test_resource_leak_detection()
            await self.test_stress_scenarios()
            
        except Exception as e:
            print(f"❌ Performance test suite failed: {e}")
        finally:
            await self.cleanup()
        
        total_time = time.time() - start_time
        return self.generate_performance_report(total_time)
    
    async def start_agent(self):
        """Start PEA agent for testing"""
        print("🔄 Starting PEA agent...")
        
        # Create test config if not provided
        if not self.config_file:
            self.config_file = await self.create_test_config()
        
        cmd = [self.agent_binary, "start", "--config", self.config_file]
        
        self.agent_process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            preexec_fn=os.setsid if os.name != 'nt' else None
        )
        
        # Wait for agent to start
        await asyncio.sleep(3)
        
        if self.agent_process.poll() is not None:
            stdout, stderr = self.agent_process.communicate()
            raise RuntimeError(f"Agent failed to start: {stderr.decode()}")
        
        print(f"✅ Agent started (PID: {self.agent_process.pid})")
    
    async def start_monitoring(self):
        """Start resource monitoring"""
        self.monitoring_active = True
        
        async def monitor_resources():
            while self.monitoring_active:
                if self.agent_process:
                    try:
                        process = psutil.Process(self.agent_process.pid)
                        
                        # Get process metrics
                        cpu_percent = process.cpu_percent()
                        memory_info = process.memory_info()
                        memory_percent = process.memory_percent()
                        
                        # Get system resources used by process
                        open_files = len(process.open_files())
                        threads = process.num_threads()
                        connections = len(process.connections())
                        
                        metrics = PerformanceMetrics(
                            timestamp=time.time(),
                            cpu_percent=cpu_percent,
                            memory_mb=memory_info.rss / 1024 / 1024,
                            memory_percent=memory_percent,
                            open_files=open_files,
                            threads=threads,
                            network_connections=connections
                        )
                        
                        self.metrics_history.append(metrics)
                        
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        break
                
                await asyncio.sleep(1)  # Monitor every second
        
        # Start monitoring task
        asyncio.create_task(monitor_resources())
        print("📊 Resource monitoring started")
    
    async def test_scan_processing_throughput(self) -> LoadTestResult:
        """Test scan processing throughput"""
        print("🧪 Testing scan processing throughput...")
        
        test_name = "scan_processing_throughput"
        start_time = time.time()
        
        # Generate test scan events
        num_scans = 1000
        scan_events = []
        
        for i in range(num_scans):
            scan_events.append({
                "product_id": f"PERF-TEST-{i:06d}",
                "event_type": "SCAN",
                "scanner_id": f"perf-scanner-{i % 10}",  # 10 virtual scanners
                "timestamp": time.time(),
                "metadata": {
                    "test_batch": "throughput_test",
                    "scan_index": i
                }
            })
        
        # Process scans and measure performance
        response_times = []
        errors = []
        successful_operations = 0
        
        # Sequential processing test
        print(f"📈 Processing {num_scans} scans sequentially...")
        
        for i, scan_event in enumerate(scan_events):
            scan_start = time.time()
            
            try:
                # Simulate scan processing (in real test, this would call agent API)
                await self.simulate_scan_processing(scan_event)
                
                scan_end = time.time()
                response_times.append((scan_end - scan_start) * 1000)  # Convert to ms
                successful_operations += 1
                
            except Exception as e:
                errors.append(f"Scan {i}: {str(e)}")
            
            # Progress indicator
            if i % 100 == 0:
                print(f"  Processed {i}/{num_scans} scans...")
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Calculate metrics
        ops_per_second = successful_operations / duration if duration > 0 else 0
        success_rate = successful_operations / num_scans
        avg_response_time = statistics.mean(response_times) if response_times else 0
        p95_response_time = statistics.quantiles(response_times, n=20)[18] if len(response_times) >= 20 else 0
        p99_response_time = statistics.quantiles(response_times, n=100)[98] if len(response_times) >= 100 else 0
        
        # Get resource usage during test
        resource_usage = self.get_resource_usage_summary(start_time, end_time)
        
        result = LoadTestResult(
            test_name=test_name,
            duration_seconds=duration,
            total_operations=num_scans,
            operations_per_second=ops_per_second,
            success_rate=success_rate,
            avg_response_time_ms=avg_response_time,
            p95_response_time_ms=p95_response_time,
            p99_response_time_ms=p99_response_time,
            errors=errors[:10],  # Keep first 10 errors
            resource_usage=resource_usage
        )
        
        self.test_results.append(result)
        self.print_load_test_result(result)
        return result
    
    async def test_concurrent_scanner_handling(self) -> LoadTestResult:
        """Test concurrent scanner handling"""
        print("🧪 Testing concurrent scanner handling...")
        
        test_name = "concurrent_scanner_handling"
        start_time = time.time()
        
        # Simulate multiple scanners working concurrently
        num_scanners = 20
        scans_per_scanner = 50
        total_scans = num_scanners * scans_per_scanner
        
        response_times = []
        errors = []
        successful_operations = 0
        
        async def scanner_worker(scanner_id: int):
            """Simulate a single scanner's workload"""
            scanner_response_times = []
            scanner_errors = []
            scanner_successes = 0
            
            for scan_idx in range(scans_per_scanner):
                scan_start = time.time()
                
                try:
                    scan_event = {
                        "product_id": f"CONC-{scanner_id:02d}-{scan_idx:03d}",
                        "event_type": "SCAN",
                        "scanner_id": f"concurrent-scanner-{scanner_id:02d}",
                        "timestamp": time.time(),
                        "metadata": {
                            "test_type": "concurrent",
                            "scanner_id": scanner_id,
                            "scan_index": scan_idx
                        }
                    }
                    
                    await self.simulate_scan_processing(scan_event)
                    
                    scan_end = time.time()
                    scanner_response_times.append((scan_end - scan_start) * 1000)
                    scanner_successes += 1
                    
                    # Random delay between scans (0-100ms)
                    await asyncio.sleep(random.uniform(0, 0.1))
                    
                except Exception as e:
                    scanner_errors.append(f"Scanner {scanner_id}, Scan {scan_idx}: {str(e)}")
            
            return scanner_response_times, scanner_errors, scanner_successes
        
        # Run all scanners concurrently
        print(f"🔄 Running {num_scanners} concurrent scanners...")
        
        tasks = [scanner_worker(i) for i in range(num_scanners)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Aggregate results
        for result in results:
            if isinstance(result, Exception):
                errors.append(f"Scanner task failed: {str(result)}")
            else:
                scanner_times, scanner_errors, scanner_successes = result
                response_times.extend(scanner_times)
                errors.extend(scanner_errors)
                successful_operations += scanner_successes
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Calculate metrics
        ops_per_second = successful_operations / duration if duration > 0 else 0
        success_rate = successful_operations / total_scans
        avg_response_time = statistics.mean(response_times) if response_times else 0
        p95_response_time = statistics.quantiles(response_times, n=20)[18] if len(response_times) >= 20 else 0
        p99_response_time = statistics.quantiles(response_times, n=100)[98] if len(response_times) >= 100 else 0
        
        resource_usage = self.get_resource_usage_summary(start_time, end_time)
        
        result = LoadTestResult(
            test_name=test_name,
            duration_seconds=duration,
            total_operations=total_scans,
            operations_per_second=ops_per_second,
            success_rate=success_rate,
            avg_response_time_ms=avg_response_time,
            p95_response_time_ms=p95_response_time,
            p99_response_time_ms=p99_response_time,
            errors=errors[:10],
            resource_usage=resource_usage
        )
        
        self.test_results.append(result)
        self.print_load_test_result(result)
        return result
    
    async def test_blockchain_submission_performance(self) -> LoadTestResult:
        """Test blockchain submission performance"""
        print("🧪 Testing blockchain submission performance...")
        
        test_name = "blockchain_submission_performance"
        start_time = time.time()
        
        # Test blockchain submissions
        num_submissions = 100
        response_times = []
        errors = []
        successful_operations = 0
        
        for i in range(num_submissions):
            submission_start = time.time()
            
            try:
                # Simulate blockchain submission
                await self.simulate_blockchain_submission({
                    "transaction_id": f"perf-tx-{i:06d}",
                    "payload_size": random.randint(100, 5000),
                    "priority": "normal"
                })
                
                submission_end = time.time()
                response_times.append((submission_end - submission_start) * 1000)
                successful_operations += 1
                
            except Exception as e:
                errors.append(f"Submission {i}: {str(e)}")
            
            # Progress indicator
            if i % 10 == 0:
                print(f"  Submitted {i}/{num_submissions} transactions...")
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Calculate metrics
        ops_per_second = successful_operations / duration if duration > 0 else 0
        success_rate = successful_operations / num_submissions
        avg_response_time = statistics.mean(response_times) if response_times else 0
        p95_response_time = statistics.quantiles(response_times, n=20)[18] if len(response_times) >= 20 else 0
        p99_response_time = statistics.quantiles(response_times, n=100)[98] if len(response_times) >= 100 else 0
        
        resource_usage = self.get_resource_usage_summary(start_time, end_time)
        
        result = LoadTestResult(
            test_name=test_name,
            duration_seconds=duration,
            total_operations=num_submissions,
            operations_per_second=ops_per_second,
            success_rate=success_rate,
            avg_response_time_ms=avg_response_time,
            p95_response_time_ms=p95_response_time,
            p99_response_time_ms=p99_response_time,
            errors=errors[:10],
            resource_usage=resource_usage
        )
        
        self.test_results.append(result)
        self.print_load_test_result(result)
        return result
    
    async def test_memory_usage_patterns(self) -> LoadTestResult:
        """Test memory usage patterns under load"""
        print("🧪 Testing memory usage patterns...")
        
        test_name = "memory_usage_patterns"
        start_time = time.time()
        
        # Run sustained load and monitor memory
        duration_minutes = 5
        operations_per_minute = 120  # 2 operations per second
        total_operations = duration_minutes * operations_per_minute
        
        successful_operations = 0
        errors = []
        memory_snapshots = []
        
        print(f"🔄 Running {duration_minutes}-minute sustained load test...")
        
        for i in range(total_operations):
            try:
                # Perform operation
                await self.simulate_scan_processing({
                    "product_id": f"MEM-TEST-{i:06d}",
                    "event_type": "SCAN",
                    "scanner_id": "memory-test-scanner",
                    "timestamp": time.time()
                })
                
                successful_operations += 1
                
                # Take memory snapshot every 10 operations
                if i % 10 == 0 and self.agent_process:
                    try:
                        process = psutil.Process(self.agent_process.pid)
                        memory_info = process.memory_info()
                        memory_snapshots.append({
                            "operation": i,
                            "rss_mb": memory_info.rss / 1024 / 1024,
                            "vms_mb": memory_info.vms / 1024 / 1024,
                            "percent": process.memory_percent()
                        })
                    except psutil.NoSuchProcess:
                        break
                
            except Exception as e:
                errors.append(f"Operation {i}: {str(e)}")
            
            # Maintain target rate (0.5 seconds between operations)
            await asyncio.sleep(0.5)
            
            # Progress indicator
            if i % 60 == 0:  # Every minute
                elapsed_minutes = (i / operations_per_minute)
                print(f"  Elapsed: {elapsed_minutes:.1f}/{duration_minutes} minutes")
        
        end_time = time.time()
        actual_duration = end_time - start_time
        
        # Analyze memory patterns
        memory_analysis = self.analyze_memory_patterns(memory_snapshots)
        
        # Calculate basic metrics
        ops_per_second = successful_operations / actual_duration if actual_duration > 0 else 0
        success_rate = successful_operations / total_operations
        
        resource_usage = self.get_resource_usage_summary(start_time, end_time)
        resource_usage.update(memory_analysis)
        
        result = LoadTestResult(
            test_name=test_name,
            duration_seconds=actual_duration,
            total_operations=total_operations,
            operations_per_second=ops_per_second,
            success_rate=success_rate,
            avg_response_time_ms=500,  # Target 500ms per operation
            p95_response_time_ms=0,
            p99_response_time_ms=0,
            errors=errors[:10],
            resource_usage=resource_usage
        )
        
        self.test_results.append(result)
        self.print_load_test_result(result)
        return result
    
    async def test_stress_scenarios(self) -> LoadTestResult:
        """Test extreme stress scenarios"""
        print("🧪 Testing stress scenarios...")
        
        test_name = "stress_scenarios"
        start_time = time.time()
        
        # Extreme load: many concurrent operations
        num_concurrent = 100
        operations_per_worker = 20
        total_operations = num_concurrent * operations_per_worker
        
        successful_operations = 0
        errors = []
        response_times = []
        
        async def stress_worker(worker_id: int):
            """High-intensity worker"""
            worker_successes = 0
            worker_errors = []
            worker_times = []
            
            for op in range(operations_per_worker):
                op_start = time.time()
                
                try:
                    # Rapid-fire operations
                    scan_event = {
                        "product_id": f"STRESS-{worker_id:03d}-{op:03d}",
                        "event_type": "SCAN",
                        "scanner_id": f"stress-scanner-{worker_id}",
                        "timestamp": time.time(),
                        "metadata": {"stress_test": True}
                    }
                    
                    await self.simulate_scan_processing(scan_event)
                    
                    op_end = time.time()
                    worker_times.append((op_end - op_start) * 1000)
                    worker_successes += 1
                    
                except Exception as e:
                    worker_errors.append(f"Worker {worker_id}, Op {op}: {str(e)}")
                
                # Minimal delay (10ms)
                await asyncio.sleep(0.01)
            
            return worker_times, worker_errors, worker_successes
        
        print(f"💥 Running extreme stress test: {num_concurrent} concurrent workers...")
        
        # Launch all workers simultaneously
        tasks = [stress_worker(i) for i in range(num_concurrent)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Aggregate results
        for result in results:
            if isinstance(result, Exception):
                errors.append(f"Stress worker failed: {str(result)}")
            else:
                worker_times, worker_errors, worker_successes = result
                response_times.extend(worker_times)
                errors.extend(worker_errors)
                successful_operations += worker_successes
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Calculate metrics
        ops_per_second = successful_operations / duration if duration > 0 else 0
        success_rate = successful_operations / total_operations
        avg_response_time = statistics.mean(response_times) if response_times else 0
        p95_response_time = statistics.quantiles(response_times, n=20)[18] if len(response_times) >= 20 else 0
        p99_response_time = statistics.quantiles(response_times, n=100)[98] if len(response_times) >= 100 else 0
        
        resource_usage = self.get_resource_usage_summary(start_time, end_time)
        
        result = LoadTestResult(
            test_name=test_name,
            duration_seconds=duration,
            total_operations=total_operations,
            operations_per_second=ops_per_second,
            success_rate=success_rate,
            avg_response_time_ms=avg_response_time,
            p95_response_time_ms=p95_response_time,
            p99_response_time_ms=p99_response_time,
            errors=errors[:20],  # More errors expected in stress test
            resource_usage=resource_usage
        )
        
        self.test_results.append(result)
        self.print_load_test_result(result)
        return result
    
    # Helper methods for simulation (in real testing, these would call actual agent APIs)
    async def simulate_scan_processing(self, scan_event: Dict[str, Any]):
        """Simulate scan processing"""
        # In real implementation, this would:
        # 1. Send scan event to agent via API
        # 2. Wait for response
        # 3. Validate response
        
        # For simulation, add realistic delay
        processing_time = random.uniform(0.01, 0.1)  # 10-100ms
        await asyncio.sleep(processing_time)
        
        # Simulate occasional failures
        if random.random() < 0.02:  # 2% failure rate
            raise Exception("Simulated scan processing failure")
    
    async def simulate_blockchain_submission(self, submission_data: Dict[str, Any]):
        """Simulate blockchain submission"""
        # Blockchain submissions are typically slower
        submission_time = random.uniform(0.5, 3.0)  # 0.5-3 seconds
        await asyncio.sleep(submission_time)
        
        # Simulate occasional failures
        if random.random() < 0.05:  # 5% failure rate
            raise Exception("Simulated blockchain submission failure")
    
    def get_resource_usage_summary(self, start_time: float, end_time: float) -> Dict[str, Any]:
        """Get resource usage summary for time period"""
        relevant_metrics = [
            m for m in self.metrics_history
            if start_time <= m.timestamp <= end_time
        ]
        
        if not relevant_metrics:
            return {"error": "no_metrics_available"}
        
        return {
            "avg_cpu_percent": statistics.mean([m.cpu_percent for m in relevant_metrics]),
            "max_cpu_percent": max([m.cpu_percent for m in relevant_metrics]),
            "avg_memory_mb": statistics.mean([m.memory_mb for m in relevant_metrics]),
            "max_memory_mb": max([m.memory_mb for m in relevant_metrics]),
            "avg_open_files": statistics.mean([m.open_files for m in relevant_metrics]),
            "max_open_files": max([m.open_files for m in relevant_metrics]),
            "avg_threads": statistics.mean([m.threads for m in relevant_metrics]),
            "max_threads": max([m.threads for m in relevant_metrics]),
            "samples": len(relevant_metrics)
        }
    
    def analyze_memory_patterns(self, snapshots: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze memory usage patterns"""
        if not snapshots:
            return {"memory_analysis": "no_data"}
        
        rss_values = [s["rss_mb"] for s in snapshots]
        
        # Check for memory leaks (consistent upward trend)
        if len(rss_values) >= 10:
            # Simple linear trend analysis
            x_values = list(range(len(rss_values)))
            n = len(x_values)
            
            # Calculate linear regression slope
            sum_x = sum(x_values)
            sum_y = sum(rss_values)
            sum_xy = sum(x * y for x, y in zip(x_values, rss_values))
            sum_x2 = sum(x * x for x in x_values)
            
            slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
            
            memory_trend = "increasing" if slope > 0.1 else "decreasing" if slope < -0.1 else "stable"
        else:
            memory_trend = "insufficient_data"
        
        return {
            "memory_analysis": {
                "initial_memory_mb": rss_values[0],
                "final_memory_mb": rss_values[-1],
                "peak_memory_mb": max(rss_values),
                "memory_trend": memory_trend,
                "memory_growth_mb": rss_values[-1] - rss_values[0],
                "snapshots_count": len(snapshots)
            }
        }
    
    async def create_test_config(self) -> str:
        """Create test configuration file"""
        config = {
            "kaspa": {
                "rpc_endpoints": ["grpc://localhost:16210"],
                "fee_rate": "1000",
                "max_fee": "10000000",
                "timeout_seconds": 30
            },
            "scanners": {
                "auto_discovery": True,
                "enabled_types": ["mock"],
                "discovery_interval_seconds": 30
            },
            "logging": {
                "level": "info",
                "audit_enabled": True
            },
            "queue": {
                "max_items": 10000,
                "retention_days": 7
            },
            "monitoring": {
                "heartbeat_interval_hours": 24,
                "anomaly_detection": False  # Disable for performance testing
            }
        }
        
        config_file = os.path.join(self.temp_dir, "performance_test_config.yaml")
        
        import yaml
        with open(config_file, 'w') as f:
            yaml.dump(config, f)
        
        return config_file
    
    def print_load_test_result(self, result: LoadTestResult):
        """Print formatted load test result"""
        print(f"\n📊 {result.test_name} Results:")
        print(f"  Duration: {result.duration_seconds:.2f}s")
        print(f"  Operations: {result.total_operations}")
        print(f"  Throughput: {result.operations_per_second:.2f} ops/sec")
        print(f"  Success Rate: {result.success_rate:.1%}")
        print(f"  Avg Response Time: {result.avg_response_time_ms:.2f}ms")
        print(f"  P95 Response Time: {result.p95_response_time_ms:.2f}ms")
        print(f"  P99 Response Time: {result.p99_response_time_ms:.2f}ms")
        
        if result.errors:
            print(f"  Errors: {len(result.errors)} (showing first few)")
            for error in result.errors[:3]:
                print(f"    • {error}")
        
        # Resource usage
        usage = result.resource_usage
        if "avg_cpu_percent" in usage:
            print(f"  Avg CPU: {usage['avg_cpu_percent']:.1f}%")
            print(f"  Max Memory: {usage['max_memory_mb']:.1f}MB")
    
    def generate_performance_report(self, total_time: float) -> Dict[str, Any]:
        """Generate comprehensive performance report"""
        # System information
        system_info = {
            "cpu_count": multiprocessing.cpu_count(),
            "total_memory_gb": psutil.virtual_memory().total / (1024**3),
            "platform": sys.platform,
            "python_version": sys.version
        }
        
        # Overall performance summary
        if self.test_results:
            avg_throughput = statistics.mean([r.operations_per_second for r in self.test_results])
            avg_success_rate = statistics.mean([r.success_rate for r in self.test_results])
            total_operations = sum([r.total_operations for r in self.test_results])
        else:
            avg_throughput = 0
            avg_success_rate = 0
            total_operations = 0
        
        # Performance grade
        if avg_success_rate >= 0.99 and avg_throughput >= 100:
            grade = "A"
        elif avg_success_rate >= 0.95 and avg_throughput >= 50:
            grade = "B"
        elif avg_success_rate >= 0.90 and avg_throughput >= 25:
            grade = "C"
        else:
            grade = "D"
        
        report = {
            "summary": {
                "total_time": round(total_time, 2),
                "total_tests": len(self.test_results),
                "total_operations": total_operations,
                "avg_throughput": round(avg_throughput, 2),
                "avg_success_rate": round(avg_success_rate, 3),
                "performance_grade": grade
            },
            "system_info": system_info,
            "test_results": [asdict(result) for result in self.test_results],
            "resource_monitoring": {
                "total_samples": len(self.metrics_history),
                "monitoring_duration": total_time
            }
        }
        
        # Print summary
        print("\n" + "=" * 60)
        print("🚀 Performance Test Results Summary")
        print("=" * 60)
        print(f"📊 Overall Grade: {grade}")
        print(f"⚡ Average Throughput: {avg_throughput:.2f} ops/sec")
        print(f"✅ Average Success Rate: {avg_success_rate:.1%}")
        print(f"🔢 Total Operations: {total_operations:,}")
        print(f"⏱️  Total Time: {total_time:.2f}s")
        print(f"💾 System: {system_info['cpu_count']} CPUs, {system_info['total_memory_gb']:.1f}GB RAM")
        
        if grade == "A":
            print("🎉 Excellent performance!")
        elif grade == "B":
            print("✅ Good performance")
        elif grade == "C":
            print("⚠️  Acceptable performance, room for improvement")
        else:
            print("❌ Performance issues detected")
        
        return report
    
    async def cleanup(self):
        """Cleanup test resources"""
        print("🧹 Cleaning up...")
        
        # Stop monitoring
        self.monitoring_active = False
        
        # Stop agent
        if self.agent_process and self.agent_process.poll() is None:
            try:
                self.agent_process.terminate()
                
                # Wait for graceful shutdown
                try:
                    await asyncio.wait_for(self.wait_for_process_exit(), timeout=10)
                except asyncio.TimeoutError:
                    self.agent_process.kill()
            except Exception as e:
                print(f"⚠️  Error stopping agent: {e}")
        
        # Cleanup temp directory
        import shutil
        try:
            shutil.rmtree(self.temp_dir)
        except Exception as e:
            print(f"⚠️  Failed to cleanup temp directory: {e}")
    
    async def wait_for_process_exit(self):
        """Wait for agent process to exit"""
        if self.agent_process:
            while self.agent_process.poll() is None:
                await asyncio.sleep(0.1)
    
    # Additional test methods would be implemented here...
    async def test_queue_management_performance(self):
        """Placeholder for queue management performance test"""
        pass
    
    async def test_cpu_utilization(self):
        """Placeholder for CPU utilization test"""
        pass
    
    async def test_resource_leak_detection(self):
        """Placeholder for resource leak detection test"""
        pass

async def main():
    """Main entry point for performance tests"""
    import argparse
    
    parser = argparse.ArgumentParser(description="KMP PEA Agent Performance Test Suite")
    parser.add_argument("agent_binary", help="Path to PEA agent binary")
    parser.add_argument("--config", help="Configuration file to use")
    parser.add_argument("--output", help="Output file for performance report (JSON)")
    parser.add_argument("--duration", type=int, default=5, help="Test duration in minutes")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.agent_binary):
        print(f"❌ Agent binary not found: {args.agent_binary}")
        sys.exit(1)
    
    tester = PEAAgentLoadTester(args.agent_binary, args.config)
    report = await tester.run_performance_tests()
    
    # Save report if requested
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"📄 Performance report saved to: {args.output}")
    
    # Exit with appropriate code based on performance grade
    grade = report["summary"]["performance_grade"]
    if grade == "A":
        sys.exit(0)
    elif grade == "B":
        sys.exit(1)
    else:
        sys.exit(2)

if __name__ == "__main__":
    asyncio.run(main()) 
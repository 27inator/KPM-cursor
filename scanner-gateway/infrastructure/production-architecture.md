# KMP Scanner Gateway - Production Architecture

## Overview
Production-ready, multi-tenant scanner gateway architecture designed to handle millions of scans per day from thousands of companies worldwide.

## Scale Requirements

### Small Scale (MVP - 6 months)
- **Companies**: 10-50
- **Scanners**: 1,000-5,000  
- **Scans/day**: 100K-1M
- **Infrastructure**: Single region, 2-3 instances
- **Cost**: $500-2,000/month

### Medium Scale (Year 1-2)
- **Companies**: 50-200
- **Scanners**: 10,000-50,000
- **Scans/day**: 1M-20M  
- **Infrastructure**: Multi-region, auto-scaling
- **Cost**: $5,000-25,000/month

### Large Scale (Year 3-5)
- **Companies**: 500-2,000
- **Scanners**: 100,000-1M
- **Scans/day**: 50M-1B
- **Infrastructure**: Global edge network
- **Cost**: $50,000-500,000/month

## Architecture Components

### 1. Global Load Balancing & CDN
```
Internet → CloudFlare → Regional Load Balancers → Gateway Clusters
```

**CloudFlare Configuration:**
- **Global Anycast**: Route to nearest datacenter
- **DDoS Protection**: Handle malicious traffic
- **Rate Limiting**: 1000 req/min per scanner IP
- **SSL Termination**: Handle TLS at edge
- **Caching**: Cache scanner configs, not scan data

**Regional Load Balancers (AWS ALB/Google GLB):**
- **Health Checks**: Remove unhealthy instances
- **Sticky Sessions**: Route scanner to same instance
- **SSL Offloading**: Internal traffic over HTTP
- **Auto-scaling Triggers**: Scale on CPU/memory/requests

### 2. Scanner Gateway Clusters

**Container Architecture:**
```yaml
# docker-compose.production.yml
version: '3.8'
services:
  scanner-gateway:
    image: kmp-scanner-gateway:latest
    deploy:
      replicas: 10  # Auto-scale 5-50 instances
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
    environment:
      - NODE_ENV=production
      - PORT=3000
      - REDIS_CLUSTER_URL=redis://redis-cluster:6379
      - POSTGRES_URL=postgresql://scanner-db:5432/scanners
      - KMP_MESSAGE_BUS_URL=http://message-bus-lb:3001
      - MAX_SCANS_PER_MINUTE=200  # Per instance
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Auto-Scaling Rules:**
- **Scale Up**: CPU > 70% for 2 minutes
- **Scale Down**: CPU < 30% for 10 minutes  
- **Min Instances**: 5 (per region)
- **Max Instances**: 100 (per region)
- **Scale Metric**: Requests/second + CPU + Memory

### 3. Database Architecture

**Scanner Registry (PostgreSQL):**
```sql
-- Partitioned by company_id for performance
CREATE TABLE scanners (
    id UUID PRIMARY KEY,
    company_id INTEGER NOT NULL,
    api_key_hash VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    type scanner_type_enum,
    status scanner_status_enum,
    created_at TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP,
    total_scans BIGINT DEFAULT 0,
    region VARCHAR(50),
    version VARCHAR(20)
) PARTITION BY HASH (company_id);

-- Indexes for performance
CREATE INDEX idx_scanners_company_id ON scanners (company_id);
CREATE INDEX idx_scanners_api_key ON scanners (api_key_hash);
CREATE INDEX idx_scanners_status ON scanners (status) WHERE status = 'active';
```

**Scan Analytics (TimescaleDB/ClickHouse):**
```sql
-- Time-series database for scan analytics
CREATE TABLE scan_events (
    timestamp TIMESTAMPTZ NOT NULL,
    scanner_id UUID NOT NULL,
    company_id INTEGER NOT NULL,
    product_id VARCHAR(100),
    event_type VARCHAR(50),
    location VARCHAR(200),
    processing_time_ms INTEGER,
    success BOOLEAN,
    region VARCHAR(50)
);

-- Hypertable for time-series performance
SELECT create_hypertable('scan_events', 'timestamp');
```

**Redis Cluster (Caching & Rate Limiting):**
```yaml
# Scanner authentication cache
scanner:auth:{api_key_hash} → {scanner_data} # TTL: 1 hour

# Rate limiting
scanner:rate:{scanner_id}:minute → {scan_count} # TTL: 1 minute  
scanner:rate:{scanner_id}:hour → {scan_count}   # TTL: 1 hour

# Company quotas
company:quota:{company_id}:daily → {scan_count} # TTL: 1 day
```

### 4. Message Queue Architecture

**High-Volume Scan Processing:**
```yaml
# BullMQ job queues (Redis-backed)
queues:
  - scan-processing-high-priority    # Premium customers
  - scan-processing-standard         # Standard customers  
  - scan-processing-batch           # Bulk uploads
  - scan-analytics-aggregation      # Background analytics
  - scanner-health-monitoring       # Device monitoring
```

**Queue Configuration:**
```javascript
// High-throughput scan processing
const scanQueue = new Queue('scan-processing', {
  connection: redisCluster,
  defaultJobOptions: {
    attempts: 3,
    backoff: 'exponential',
    removeOnComplete: 100,
    removeOnFail: 50
  }
});

// Worker configuration
scanQueue.process('process-scan', 50, async (job) => {
  const { scanData, scannerId, companyId } = job.data;
  
  // Forward to KMP Message Bus
  await forwardToMessageBus(scanData);
  
  // Update analytics
  await updateScanAnalytics(scannerId, companyId);
});
```

### 5. Regional Deployment Strategy

**Primary Regions:**
- **US East (Virginia)**: Primary for Americas
- **EU West (Ireland)**: Primary for Europe  
- **Asia Pacific (Singapore)**: Primary for APAC

**Edge Locations (Phase 2):**
- US: Oregon, California, Texas
- EU: Frankfurt, London, Stockholm
- APAC: Tokyo, Mumbai, Sydney

**Data Residency:**
```yaml
regions:
  us-east-1:
    scanner_data: "Local PostgreSQL + S3"
    compliance: "SOC2, HIPAA"
    latency_target: "<50ms"
  
  eu-west-1:
    scanner_data: "Local PostgreSQL + S3"  
    compliance: "GDPR, ISO27001"
    latency_target: "<50ms"
    
  ap-southeast-1:
    scanner_data: "Local PostgreSQL + S3"
    compliance: "Local data protection laws"
    latency_target: "<100ms"
```

### 6. Monitoring & Observability

**Metrics Dashboard:**
```yaml
Key Metrics:
  - scans_per_second (by region, company, scanner_type)
  - scanner_gateway_latency_p99
  - message_bus_forward_success_rate  
  - active_scanners_count
  - failed_scans_rate
  - api_key_auth_failures
  - regional_error_rates
```

**Alerting Rules:**
```yaml
alerts:
  - name: "High Scan Failure Rate"
    condition: "failed_scans_rate > 5% for 5 minutes"
    action: "Page on-call engineer"
    
  - name: "Scanner Gateway Down"  
    condition: "healthy_instances < 2 in any region"
    action: "Immediate escalation"
    
  - name: "High Latency"
    condition: "p99_latency > 500ms for 10 minutes"
    action: "Auto-scale + investigate"
```

## 7. Cost Optimization

**Infrastructure Costs (Monthly):**
```yaml
Small Scale (1M scans/day):
  - Load Balancers: $100
  - Gateway Instances: $800  
  - Database: $500
  - Redis: $300
  - Storage: $200
  - Monitoring: $100
  Total: ~$2,000/month

Medium Scale (20M scans/day):  
  - Load Balancers: $300
  - Gateway Instances: $4,000
  - Database: $3,000  
  - Redis: $1,500
  - Storage: $1,000
  - CDN: $500
  - Monitoring: $300
  Total: ~$10,600/month

Large Scale (500M scans/day):
  - Load Balancers: $1,000
  - Gateway Instances: $25,000
  - Database: $15,000
  - Redis: $8,000  
  - Storage: $5,000
  - CDN: $2,000
  - Monitoring: $1,000
  Total: ~$57,000/month
```

**Cost per Scan:**
- Small Scale: $0.002 per scan
- Medium Scale: $0.0005 per scan  
- Large Scale: $0.0001 per scan

## 8. Security Architecture

**Scanner Authentication:**
```yaml
auth_flow:
  1. Scanner → API Key in header
  2. Gateway → Hash lookup in Redis cache  
  3. If miss → PostgreSQL lookup + cache
  4. Validate company_id + scanner status
  5. Rate limit check
  6. Process scan
```

**API Key Management:**
```yaml
api_keys:
  format: "kmp_scanner_{company_id}_{uuid}"
  storage: "bcrypt hash in database"  
  rotation: "Automated every 90 days"
  revocation: "Immediate via API"
```

**Network Security:**
```yaml
network:
  - WAF rules for common attacks
  - IP whitelisting for enterprise customers
  - VPC isolation between environments  
  - Private subnets for databases
  - Encryption in transit (TLS 1.3)
  - Encryption at rest (AES-256)
```

## 9. Business Model Integration

**Pricing Tiers:**
```yaml
starter:
  scanners: 100
  scans_per_month: 100K
  regions: 1  
  support: Email
  price: $99/month

professional:  
  scanners: 1000
  scans_per_month: 1M
  regions: 2
  support: Phone/Chat
  price: $499/month

enterprise:
  scanners: Unlimited
  scans_per_month: Unlimited  
  regions: All
  support: Dedicated CSM
  price: Custom
```

**Billing Integration:**
```javascript
// Track usage for billing
async function recordScanForBilling(companyId, scannerId) {
  await billingService.incrementUsage(companyId, 'scans', 1);
  
  // Check quota
  const usage = await billingService.getMonthlyUsage(companyId);
  if (usage.scans > usage.plan.scanLimit) {
    await notifyQuotaExceeded(companyId);
  }
}
```

## 10. Disaster Recovery

**Backup Strategy:**
```yaml
databases:
  postgresql: "Daily backup + point-in-time recovery"
  redis: "Snapshot every 6 hours"
  
cross_region:
  scanner_configs: "Replicated to all regions"  
  scan_data: "Regional with cross-region backup"
  
recovery_time:
  RTO: "15 minutes (automated failover)"
  RPO: "5 minutes (data loss tolerance)"
```

**Failover Process:**
1. Health check detects region failure
2. DNS automatically routes to healthy region  
3. Scanner configs sync from backup
4. Scan processing continues seamlessly
5. Alert operations team
6. Investigate and restore primary region

This architecture ensures the scanner gateway can scale from startup to enterprise-grade infrastructure while maintaining high availability and performance. 
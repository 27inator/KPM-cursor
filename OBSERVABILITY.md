# 📊 KMP Supply Chain - Full Observability Stack

Complete monitoring, logging, tracing, and alerting solution for enterprise-grade observability.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY STACK                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   LOGGING   │    │   METRICS   │    │   TRACING   │     │
│  │             │    │             │    │             │     │
│  │ Fluent Bit  │    │ Prometheus  │    │   Jaeger    │     │
│  │     ↓       │    │     ↓       │    │     ↓       │     │
│  │Elasticsearch│    │   Grafana   │    │    UI       │     │
│  │   Kibana    │    │ AlertMgr    │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            CENTRALIZED DASHBOARDS                  │   │
│  │ • System Performance  • API Metrics               │   │
│  │ • Blockchain Status   • Supply Chain Events       │   │
│  │ • Error Tracking      • Business Metrics          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Deployment

### 1. Deploy Observability Stack
```bash
# Create namespace
kubectl apply -f k8s/observability/

# Deploy Elasticsearch
kubectl apply -f k8s/observability/elasticsearch.yaml

# Deploy log collection
kubectl apply -f k8s/observability/fluent-bit.yaml

# Deploy distributed tracing
kubectl apply -f k8s/observability/jaeger.yaml

# Deploy alerting
kubectl apply -f k8s/observability/alertmanager.yaml

# Verify deployment
kubectl get pods -n kmp-observability
```

### 2. Access Interfaces
- **📊 Grafana**: http://grafana.kmp-supply-chain.local
- **🔍 Kibana**: http://kibana.kmp-supply-chain.local  
- **🔗 Jaeger**: http://jaeger.kmp-supply-chain.local
- **🚨 AlertManager**: http://alertmanager.kmp-supply-chain.local

## 📋 Components Overview

### 🗂️ Centralized Logging (EFK Stack)

#### **Elasticsearch**
- **Purpose**: Log storage and indexing
- **Replicas**: 3-node cluster for HA
- **Storage**: 50GB per node with auto-scaling
- **Retention**: 30 days (configurable)

#### **Fluent Bit**  
- **Purpose**: Log collection from all pods
- **Deployment**: DaemonSet on every node
- **Features**: 
  - Multi-line log parsing
  - Kubernetes metadata enrichment
  - KMP-specific log parsing rules
  - Elasticsearch forwarding

#### **Kibana** (Optional)
- **Purpose**: Log visualization and analysis
- **Features**: 
  - Custom KMP dashboards
  - Log search and filtering
  - Real-time log streaming

### 📈 Metrics & Monitoring

#### **Prometheus** (Extended)
- **Enhanced Features**:
  - KMP-specific metrics collection
  - Custom recording rules
  - Long-term storage (1 year)
  - High availability setup

#### **Grafana** (Enhanced)
- **KMP Custom Dashboards**:
  - Supply Chain Overview
  - Blockchain Transaction Monitoring  
  - API Performance Metrics
  - System Resource Usage
  - Business KPIs

### 🔗 Distributed Tracing

#### **Jaeger**
- **Components**:
  - **Jaeger Agent**: Deployed on every node
  - **Jaeger Collector**: Receives and processes traces
  - **Jaeger Query**: Web UI for trace visualization
- **Storage**: Elasticsearch backend
- **Features**:
  - Request flow visualization
  - Performance bottleneck identification
  - Dependency mapping

### 🚨 Advanced Alerting

#### **AlertManager**
- **KMP-Specific Alert Rules**:
  - Blockchain transaction failures
  - Supply chain event processing delays
  - API error rate spikes
  - Database connection issues
  - System resource exhaustion
- **Notification Channels**:
  - Email alerts
  - Slack integration
  - PagerDuty integration
  - Custom webhooks

## 📊 KMP-Specific Monitoring

### Supply Chain Metrics
```prometheus
# Event processing rate
rate(supply_chain_events_total[5m])

# Event processing latency
histogram_quantile(0.95, supply_chain_event_duration_seconds_bucket)

# Failed events
rate(supply_chain_events_failed_total[5m])

# Events by type
sum(supply_chain_events_total) by (event_type, company_id)
```

### Blockchain Metrics  
```prometheus
# Transaction success rate
rate(blockchain_transactions_successful_total[5m]) / rate(blockchain_transactions_total[5m])

# Confirmation time
blockchain_transaction_confirmation_duration_seconds

# Failed transactions
rate(blockchain_transactions_failed_total[5m])

# Kaspa node connectivity
kaspa_node_connected
```

### API Performance
```prometheus
# Request rate
rate(http_requests_total[5m])

# Response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Endpoint performance
avg(rate(http_request_duration_seconds_sum[5m])) by (endpoint)
```

## 🎯 Custom Dashboards

### 1. **KMP Executive Dashboard**
- **Business KPIs**: Events/day, transaction success rate, uptime
- **Geographic Distribution**: Events by location
- **Company Activity**: Top active companies
- **Revenue Metrics**: API usage and billing

### 2. **Operations Dashboard**
- **System Health**: CPU, Memory, Disk usage
- **API Performance**: Latency, throughput, errors
- **Database Metrics**: Connections, query performance
- **Network Traffic**: Request patterns, geographic distribution

### 3. **Blockchain Dashboard**
- **Transaction Flow**: Pending, confirmed, failed transactions
- **Kaspa Network**: Node status, block height, network health
- **Wallet Management**: Balance, transaction fees, address usage
- **Confirmation Times**: Average confirmation duration

### 4. **Security Dashboard**
- **Authentication**: Login attempts, API key usage
- **Rate Limiting**: Blocked requests, abuse patterns
- **Error Tracking**: 4xx/5xx responses, failure patterns
- **Anomaly Detection**: Unusual traffic patterns

## 📋 Alerting Rules

### Critical Alerts (Immediate Response)
```yaml
# Service completely down
- alert: KMPServiceDown
  expr: up{job=~"kmp-.*"} == 0
  for: 1m

# Blockchain transaction failure
- alert: BlockchainTransactionFailed
  expr: increase(blockchain_transactions_failed_total[5m]) > 0
  for: 0s

# Database connection failure
- alert: DatabaseConnectionFailure
  expr: pg_up == 0
  for: 1m

# High API error rate
- alert: HighAPIErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
  for: 5m
```

### Warning Alerts (Monitor & Plan)
```yaml
# High resource usage
- alert: HighMemoryUsage
  expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
  for: 5m

# Processing delays
- alert: SupplyChainEventProcessingDelay
  expr: increase(supply_chain_events_processing_duration_seconds[5m]) > 30
  for: 2m

# High API latency
- alert: HighAPILatency
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
  for: 5m
```

## 🔧 Configuration

### Log Collection Configuration
```yaml
# Fluent Bit KMP-specific parsing
[PARSER]
    Name        kmp-api
    Format      regex
    Regex       ^\[(?<timestamp>[^\]]+)\] (?<level>\w+): (?<message>.*)$
    Time_Key    timestamp
    Time_Format %Y-%m-%d %H:%M:%S

[PARSER]
    Name        kmp-broadcaster
    Format      regex
    Regex       ^(?<timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z) \[(?<level>\w+)\] (?<message>.*)$
    Time_Key    timestamp
    Time_Format %Y-%m-%dT%H:%M:%S.%LZ
```

### Tracing Configuration
```javascript
// KMP API OpenTelemetry setup
const { NodeTracerProvider } = require('@opentelemetry/sdk-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

const provider = new NodeTracerProvider();
provider.addSpanProcessor(new BatchSpanProcessor(new JaegerExporter({
  endpoint: 'http://jaeger-collector:14268/api/traces'
})));
```

## 🛠️ Operations Guide

### Daily Monitoring Tasks
1. **Check Dashboard Alerts**: Review Grafana for any ongoing issues
2. **Verify Log Collection**: Ensure all services are logging properly
3. **Review Performance**: Check API latency and throughput trends
4. **Blockchain Status**: Verify transaction processing and confirmations

### Weekly Tasks  
1. **Storage Cleanup**: Archive old logs (>30 days)
2. **Performance Review**: Analyze weekly performance trends
3. **Alert Rule Review**: Update thresholds based on performance data
4. **Capacity Planning**: Review resource usage trends

### Monthly Tasks
1. **Dashboard Updates**: Add new metrics and improve visualizations
2. **Alert Optimization**: Fine-tune alert rules to reduce noise
3. **Performance Optimization**: Identify and address bottlenecks
4. **Compliance Reports**: Generate monitoring compliance reports

## 🔍 Troubleshooting

### Common Issues

#### **Logs Not Appearing in Elasticsearch**
```bash
# Check Fluent Bit status
kubectl logs -n kmp-observability daemonset/fluent-bit

# Check Elasticsearch health
kubectl exec -n kmp-observability elasticsearch-0 -- curl -s localhost:9200/_cluster/health

# Verify log parsing
kubectl logs -n kmp-observability fluent-bit-xxx | grep ERROR
```

#### **Missing Metrics in Grafana**
```bash
# Check Prometheus targets
kubectl port-forward -n kmp-observability service/prometheus 9090:9090
# Visit http://localhost:9090/targets

# Verify service discovery
kubectl get servicemonitor -n kmp-observability

# Check metric availability
curl http://prometheus:9090/api/v1/label/__name__/values
```

#### **Traces Not Appearing in Jaeger**
```bash
# Check Jaeger collector
kubectl logs -n kmp-observability deployment/jaeger-collector

# Verify agent connectivity
kubectl logs -n kmp-observability daemonset/jaeger-agent

# Test trace submission
curl -X POST http://jaeger-collector:14268/api/traces \
  -H "Content-Type: application/json" \
  -d '{"data": [{"traceID": "test"}]}'
```

### Performance Optimization

#### **Elasticsearch Performance**
```bash
# Monitor cluster health
GET /_cluster/health

# Check index performance
GET /_cat/indices?v&s=store.size:desc&h=index,docs.count,store.size

# Optimize indices
POST /kmp-logs-*/_forcemerge?max_num_segments=1
```

#### **Prometheus Performance**
```yaml
# Increase retention and storage
global:
  retention.time: 1y
  retention.size: 100GB

# Optimize recording rules
groups:
- name: kmp-recording-rules
  interval: 30s
  rules:
  - record: kmp:api_request_rate
    expr: rate(http_requests_total[5m])
```

## 📈 Scaling Guide

### Horizontal Scaling
```bash
# Scale Elasticsearch cluster
kubectl scale statefulset elasticsearch --replicas=5 -n kmp-observability

# Scale Jaeger collectors
kubectl scale deployment jaeger-collector --replicas=4 -n kmp-observability

# Scale AlertManager
kubectl scale deployment alertmanager --replicas=3 -n kmp-observability
```

### Vertical Scaling
```yaml
# Increase Elasticsearch resources
resources:
  requests:
    memory: "8Gi"
    cpu: "4000m"
  limits:
    memory: "16Gi"
    cpu: "8000m"
```

## 🔐 Security Configuration

### Authentication & Authorization
```yaml
# Elasticsearch security
xpack.security.enabled: true
xpack.security.authc.providers:
  basic.basic1:
    order: 0

# Grafana LDAP integration
[auth.ldap]
enabled = true
config_file = /etc/grafana/ldap.toml
allow_sign_up = false
```

### Network Security
```yaml
# Network policies
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: observability-network-policy
spec:
  podSelector:
    matchLabels:
      app: elasticsearch
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: kmp-supply-chain
```

## 📊 Sample Queries

### Business Intelligence
```prometheus
# Daily event volume by company
sum(increase(supply_chain_events_total[24h])) by (company_id)

# Average transaction confirmation time
avg(blockchain_transaction_confirmation_duration_seconds)

# API usage by endpoint
sum(rate(http_requests_total[1h])) by (endpoint)

# Error rate trends
rate(http_requests_total{status=~"5.."}[1h]) / rate(http_requests_total[1h])
```

### Log Analysis (Elasticsearch)
```json
{
  "query": {
    "bool": {
      "must": [
        {"match": {"service": "kmp-supply-chain"}},
        {"match": {"level": "ERROR"}},
        {"range": {"@timestamp": {"gte": "now-1h"}}}
      ]
    }
  },
  "aggs": {
    "error_types": {
      "terms": {"field": "message.keyword"}
    }
  }
}
```

---

## 🎯 Next Steps

Your **comprehensive observability stack** provides:
- ✅ **Complete Visibility**: Logs, metrics, traces
- ✅ **Proactive Alerting**: Business and system alerts
- ✅ **Performance Optimization**: Bottleneck identification  
- ✅ **Business Intelligence**: KMP-specific dashboards
- ✅ **Operational Excellence**: Automated monitoring

**Your KMP Supply Chain system now has enterprise-grade observability!** 🚀 
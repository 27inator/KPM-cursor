# KMP Supply Chain Helm Chart

A comprehensive Helm chart for deploying the KMP Supply Chain blockchain anchoring system on Kubernetes.

## 🚀 Quick Start

### Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- PV provisioner support in the underlying infrastructure

### Installation

1. **Add the Helm repository** (if using a repository):
```bash
helm repo add kmp-supply-chain https://charts.kmp-supply-chain.com
helm repo update
```

2. **Install with default values**:
```bash
helm install my-kmp-supply-chain kmp-supply-chain/kmp-supply-chain
```

3. **Install with custom values**:
```bash
helm install my-kmp-supply-chain kmp-supply-chain/kmp-supply-chain \
  --values values-production.yaml \
  --namespace kmp-supply-chain \
  --create-namespace
```

## 🏗️ Architecture

The chart deploys the following components:

- **Message Bus API**: Node.js application handling supply chain events
- **Kaspa Broadcaster**: Rust service for blockchain transactions
- **PostgreSQL**: Primary database with replication support
- **Redis**: Session store and caching layer
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards

## 📊 Configuration

### Environment-Specific Deployments

The chart includes pre-configured values for different environments:

#### Development
```bash
helm install kmp-dev ./helm/kmp-supply-chain \
  --values helm/kmp-supply-chain/values-development.yaml \
  --namespace kmp-dev \
  --create-namespace
```

#### Staging
```bash
helm install kmp-staging ./helm/kmp-supply-chain \
  --values helm/kmp-supply-chain/values-staging.yaml \
  --namespace kmp-staging \
  --create-namespace
```

#### Production
```bash
helm install kmp-prod ./helm/kmp-supply-chain \
  --values helm/kmp-supply-chain/values-production.yaml \
  --namespace kmp-production \
  --create-namespace
```

### Key Configuration Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `messageBus.replicaCount` | Number of API replicas | `3` |
| `messageBus.image.tag` | API container image tag | `latest` |
| `messageBus.resources.requests.memory` | API memory request | `256Mi` |
| `messageBus.autoscaling.enabled` | Enable HPA | `true` |
| `postgresql.enabled` | Deploy PostgreSQL | `true` |
| `postgresql.primary.persistence.size` | Database storage size | `20Gi` |
| `redis.enabled` | Deploy Redis | `true` |
| `monitoring.prometheus.enabled` | Enable Prometheus | `true` |
| `security.secrets.create` | Create secrets | `true` |

## 🔒 Security Configuration

### Secrets Management

The chart automatically creates Kubernetes secrets for:
- Database credentials
- JWT tokens
- Blockchain wallet credentials

**⚠️ IMPORTANT**: Change default passwords in production:

```yaml
security:
  secrets:
    jwtSecret: "your-super-secure-jwt-secret"
    walletMnemonic: "your twelve word production mnemonic phrase"
    walletAddress: "your-production-kaspa-address"

postgresql:
  auth:
    postgresPassword: "your-secure-db-password"
    password: "your-secure-app-password"
```

### Network Policies

Enable network policies for production:

```yaml
security:
  networkPolicies:
    enabled: true
```

## 🔧 Customization Examples

### Custom Resource Limits

```yaml
messageBus:
  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
    limits:
      memory: "1Gi" 
      cpu: "1000m"
```

### External Database

```yaml
postgresql:
  enabled: false

externalDatabase:
  url: "postgresql://user:pass@external-db:5432/kmp_db"
```

### Custom Ingress

```yaml
messageBus:
  ingress:
    enabled: true
    className: "nginx"
    annotations:
      cert-manager.io/cluster-issuer: "letsencrypt-prod"
    hosts:
      - host: api.yourcompany.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: api-tls
        hosts:
          - api.yourcompany.com
```

## 📈 Monitoring

### Accessing Grafana

```bash
# Port forward to access Grafana
kubectl port-forward service/my-kmp-supply-chain-grafana 3000:3000

# Default credentials
Username: admin
Password: kmp_admin_2024 (change in production!)
```

### Accessing Prometheus

```bash
kubectl port-forward service/my-kmp-supply-chain-prometheus 9090:9090
```

## 🛠️ Operations

### Upgrading

```bash
helm upgrade my-kmp-supply-chain kmp-supply-chain/kmp-supply-chain \
  --values your-values.yaml
```

### Rollback

```bash
helm rollback my-kmp-supply-chain 1
```

### Scaling

```bash
helm upgrade my-kmp-supply-chain kmp-supply-chain/kmp-supply-chain \
  --set messageBus.replicaCount=5
```

### Database Backup

```bash
kubectl exec -it deployment/my-kmp-supply-chain-postgresql -- \
  pg_dump -U kmp_user kmp_supply_chain > backup.sql
```

## 🧪 Testing

### Health Checks

```bash
# Check deployment status
helm status my-kmp-supply-chain

# Test API endpoint
kubectl port-forward service/my-kmp-supply-chain-message-bus 4000:4000
curl http://localhost:4000/health
```

### Load Testing

```bash
# Run supply chain event test
curl -X POST http://localhost:4000/api/supply-chain/event \
  -H "Content-Type: application/json" \
  -d '{"productId":"TEST","location":"HELM","eventType":"QUALITY_CHECK"}'
```

## 🔍 Troubleshooting

### Common Issues

1. **Pods stuck in Pending**:
   - Check storage class availability
   - Verify resource quotas

2. **Database connection issues**:
   - Check PostgreSQL pod logs
   - Verify secret configuration

3. **API startup failures**:
   - Check message-bus pod logs
   - Verify database migration status

### Debug Commands

```bash
# Check pod status
kubectl get pods -l app.kubernetes.io/name=kmp-supply-chain

# View logs
kubectl logs deployment/my-kmp-supply-chain-message-bus

# Describe resources
kubectl describe deployment my-kmp-supply-chain-message-bus

# Access pod shell
kubectl exec -it deployment/my-kmp-supply-chain-message-bus -- /bin/sh
```

## 🚀 Production Checklist

- [ ] Change all default passwords
- [ ] Configure proper ingress with TLS
- [ ] Set up external secret management
- [ ] Configure monitoring alerts
- [ ] Set up database backups
- [ ] Configure resource limits
- [ ] Enable network policies
- [ ] Set up log aggregation
- [ ] Configure auto-scaling policies
- [ ] Test disaster recovery procedures

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the KMP team

## 📄 License

This chart is licensed under the MIT License. 
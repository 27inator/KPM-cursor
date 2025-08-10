# 🏗️ KMP Supply Chain - Terraform Infrastructure

Enterprise-grade Infrastructure as Code for deploying KMP Supply Chain system on AWS EKS.

## 🏛️ Architecture Overview

This Terraform configuration creates a complete production-ready infrastructure:

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Account                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │      VPC        │    │   EKS Cluster   │                │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │                │
│  │ │Public Subnet│ │    │ │ Node Groups │ │                │
│  │ │             │ │    │ │  - General  │ │                │
│  │ │ - ALB       │ │    │ │  - Compute  │ │                │
│  │ │ - NAT GW    │ │    │ │  - Monitor  │ │                │
│  │ └─────────────┘ │    │ └─────────────┘ │                │
│  │ ┌─────────────┐ │    └─────────────────┘                │
│  │ │Private Subnet│ │                                       │
│  │ │             │ │    ┌─────────────────┐                │
│  │ │ - EKS Nodes │ │    │      RDS        │                │
│  │ │ - RDS       │ │    │ ┌─────────────┐ │                │
│  │ │ - Apps      │ │    │ │ PostgreSQL  │ │                │
│  │ └─────────────┘ │    │ │Multi-AZ+HA  │ │                │
│  └─────────────────┘    │ └─────────────┘ │                │
└─────────────────────────┤ └─────────────────┘ │──────────────┘
                          │                     │
                          │ ┌─────────────────┐ │
                          │ │   Monitoring    │ │
                          │ │ ┌─────────────┐ │ │
                          │ │ │ Prometheus  │ │ │
                          │ │ │ Grafana     │ │ │
                          │ │ │ AlertMgr    │ │ │
                          │ │ └─────────────┘ │ │
                          │ └─────────────────┘ │
                          └─────────────────────┘
```

## 📋 Prerequisites

### Required Tools
```bash
# Terraform
terraform --version  # >= 1.0

# AWS CLI
aws --version        # >= 2.0

# kubectl
kubectl version      # >= 1.27

# Helm (optional)
helm version         # >= 3.12
```

### AWS Permissions
Your AWS credentials need the following permissions:
- EC2 Full Access
- EKS Full Access  
- RDS Full Access
- IAM Full Access
- VPC Full Access
- CloudWatch Full Access

## 🚀 Quick Deployment

### 1. Clone and Setup
```bash
git clone <your-repo>
cd kmp-cursor-export/terraform

# Initialize Terraform
terraform init
```

### 2. Configure Backend (Recommended)
```bash
# Create S3 bucket for state
aws s3 mb s3://your-terraform-state-bucket

# Create backend.tf
cat > backend.tf << EOF
terraform {
  backend "s3" {
    bucket = "your-terraform-state-bucket"
    key    = "kmp-supply-chain/terraform.tfstate"
    region = "us-west-2"
  }
}
EOF

# Reinitialize with backend
terraform init
```

### 3. Deploy Development Environment
```bash
# Plan deployment
terraform plan -var-file="environments/dev/terraform.tfvars"

# Apply changes
terraform apply -var-file="environments/dev/terraform.tfvars"
```

### 4. Deploy Production Environment
```bash
# Use production configuration
terraform workspace new prod
terraform plan -var-file="environments/prod/terraform.tfvars"
terraform apply -var-file="environments/prod/terraform.tfvars"
```

## 🏗️ Module Structure

```
terraform/
├── main.tf                    # Main configuration
├── variables.tf               # Input variables
├── outputs.tf                 # Output values
├── versions.tf                # Provider versions
├── modules/
│   ├── vpc/                   # VPC networking
│   ├── eks/                   # EKS cluster
│   ├── rds/                   # PostgreSQL database
│   └── monitoring/            # Prometheus/Grafana
└── environments/
    ├── dev/                   # Development config
    ├── staging/               # Staging config
    └── prod/                  # Production config
```

## ⚙️ Configuration

### Environment Variables
```bash
export AWS_REGION=us-west-2
export AWS_PROFILE=your-profile
export TF_VAR_environment=dev
```

### Key Variables

| Variable | Description | Default | Production |
|----------|-------------|---------|------------|
| `environment` | Environment name | `dev` | `prod` |
| `kubernetes_version` | EKS version | `1.27` | `1.27` |
| `rds_instance_class` | RDS instance | `db.t3.micro` | `db.r5.xlarge` |
| `enable_spot_instances` | Use spot instances | `true` | `false` |
| `application_replicas` | App replicas | `1` | `5` |

### Customization Examples

#### Custom Node Groups
```hcl
eks_node_groups = {
  blockchain = {
    instance_types = ["c5.2xlarge"]
    capacity_type  = "ON_DEMAND"
    min_size      = 2
    max_size      = 10
    desired_size  = 4
    disk_size     = 200
    ami_type      = "AL2_x86_64"
    labels = {
      role = "blockchain"
      workload = "kaspa-broadcaster"
    }
    taints = [{
      key    = "blockchain"
      value  = "true"
      effect = "NO_SCHEDULE"
    }]
  }
}
```

#### Database High Availability
```hcl
# For production
rds_instance_class        = "db.r5.2xlarge"
rds_allocated_storage    = 1000
rds_max_allocated_storage = 5000
rds_backup_retention     = 30
enable_multi_az          = true
```

## 🔧 Operations

### Connecting to EKS
```bash
# Update kubeconfig
aws eks update-kubeconfig --name kmp-supply-chain-dev-cluster --region us-west-2

# Verify connection
kubectl get nodes
```

### Scaling Node Groups
```bash
# Scale via Terraform
terraform apply -var="eks_node_groups.general.desired_size=10"

# Scale via AWS CLI
aws eks update-nodegroup-config \
  --cluster-name kmp-supply-chain-prod-cluster \
  --nodegroup-name general \
  --scaling-config minSize=5,maxSize=20,desiredSize=10
```

### Database Access
```bash
# Get RDS endpoint
terraform output rds_endpoint

# Connect via kubectl port-forward (if needed)
kubectl port-forward service/postgresql 5432:5432

# Connect with psql
psql -h <rds-endpoint> -U kmp_user -d kmp_supply_chain
```

## 📊 Monitoring

### Accessing Grafana
```bash
# Port forward to Grafana
kubectl port-forward service/grafana 3000:3000

# Get admin password
kubectl get secret grafana-admin-password -o jsonpath="{.data.password}" | base64 -d
```

### Prometheus Metrics
```bash
# Port forward to Prometheus
kubectl port-forward service/prometheus 9090:9090

# Access at http://localhost:9090
```

## 🔒 Security

### Secrets Management
```bash
# Store sensitive values in AWS Secrets Manager
aws secretsmanager create-secret \
  --name "kmp-supply-chain/database" \
  --secret-string '{"username":"kmp_user","password":"secure_password"}'

# Reference in Terraform
data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = "kmp-supply-chain/database"
}
```

### Network Security
- Private subnets for all workloads
- Security groups with minimal access
- VPC endpoints for AWS services
- Network ACLs for additional security

## 💰 Cost Optimization

### Development Environment
- Spot instances (up to 90% savings)
- Single AZ deployment
- Smaller RDS instances
- Reduced backup retention

### Production Optimizations
```hcl
# Mixed instance types
instance_types = ["m5.large", "m5.xlarge", "c5.large"]

# Scheduled scaling
autoscaling_schedule = {
  scale_down = {
    recurrence     = "0 19 * * 1-5"  # 7 PM weekdays
    min_size       = 2
    desired_size   = 2
  }
  scale_up = {
    recurrence     = "0 8 * * 1-5"   # 8 AM weekdays
    min_size       = 5
    desired_size   = 8
  }
}
```

## 🧪 Testing

### Infrastructure Tests
```bash
# Validate Terraform
terraform validate

# Check formatting
terraform fmt -check

# Security scan with Checkov
pip install checkov
checkov -d . --framework terraform
```

### Application Deployment Test
```bash
# Deploy KMP Helm chart
helm install kmp-dev ./helm/kmp-supply-chain \
  --namespace kmp-dev \
  --create-namespace \
  --values helm/kmp-supply-chain/values-development.yaml

# Test application
kubectl port-forward service/kmp-dev-message-bus 4000:4000
curl http://localhost:4000/health
```

## 🚨 Troubleshooting

### Common Issues

#### EKS Cluster Access Denied
```bash
# Check IAM permissions
aws sts get-caller-identity

# Update kubeconfig
aws eks update-kubeconfig --name cluster-name --region us-west-2
```

#### RDS Connection Issues
```bash
# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Test connectivity from EKS
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- \
  psql -h <rds-endpoint> -U kmp_user -d kmp_supply_chain
```

#### High Costs
```bash
# Check resources
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/terraform.yml
name: Terraform
on:
  push:
    paths: ['terraform/**']
jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: hashicorp/setup-terraform@v2
    - run: terraform init
    - run: terraform plan
    - run: terraform apply -auto-approve
      if: github.ref == 'refs/heads/main'
```

## 📈 Scaling Guide

### Horizontal Scaling
```bash
# Scale application pods
kubectl scale deployment kmp-message-bus --replicas=10

# Scale EKS nodes
terraform apply -var="eks_node_groups.general.desired_size=15"
```

### Vertical Scaling
```bash
# Upgrade RDS instance
terraform apply -var="rds_instance_class=db.r5.2xlarge"

# Update node instance types
terraform apply -var="eks_node_groups.general.instance_types=[\"m5.xlarge\"]"
```

## 🔍 Maintenance

### Regular Tasks
- [ ] Update Kubernetes version quarterly
- [ ] Review and rotate secrets monthly
- [ ] Monitor costs weekly
- [ ] Update Terraform providers monthly
- [ ] Review security groups quarterly

### Disaster Recovery
```bash
# Backup Terraform state
aws s3 cp s3://terraform-state-bucket/terraform.tfstate ./backup/

# Create infrastructure snapshot
terraform plan -out=recovery.plan
```

---

## 🎯 Next Steps

After infrastructure deployment:
1. Deploy KMP application via Helm
2. Configure monitoring dashboards
3. Set up alerting rules
4. Configure backup procedures
5. Implement CI/CD pipelines

Your **enterprise-grade cloud infrastructure** is ready! 🚀 
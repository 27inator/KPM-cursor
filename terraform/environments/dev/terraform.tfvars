# ====================================
# KMP SUPPLY CHAIN - DEVELOPMENT ENVIRONMENT
# Cost-optimized settings for development
# ====================================

# General
project_name = "kmp-supply-chain"
environment  = "dev"
aws_region   = "us-west-2"

# VPC Configuration
vpc_cidr             = "10.0.0.0/16"
private_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
public_subnet_cidrs  = ["10.0.101.0/24", "10.0.102.0/24"]
enable_nat_gateway   = false  # Cost optimization for dev
enable_vpn_gateway   = false

# EKS Configuration
kubernetes_version = "1.27"
eks_node_groups = {
  general = {
    instance_types = ["t3.small"]
    capacity_type  = "SPOT"  # Cost optimization
    min_size      = 1
    max_size      = 3
    desired_size  = 1
    disk_size     = 20
    ami_type      = "AL2_x86_64"
    labels = {
      role = "general"
      environment = "dev"
    }
    taints = []
  }
}

# RDS Configuration (Minimal for dev)
postgres_version         = "15.4"
rds_instance_class      = "db.t3.micro"
rds_allocated_storage   = 20
rds_max_allocated_storage = 50
database_name           = "kmp_supply_chain_dev"
database_username       = "kmp_dev_user"
rds_backup_retention    = 1  # Minimal backups for dev
rds_backup_window       = "03:00-04:00"
rds_maintenance_window  = "sun:04:00-sun:05:00"
rds_monitoring_interval = 0  # Disable enhanced monitoring

# Monitoring
prometheus_enabled = true
grafana_enabled    = true

# Security
enable_cluster_logging = false  # Cost optimization
cluster_log_types     = []
enable_irsa           = true

# Application
application_image_tag    = "dev"
application_replicas     = 1
enable_autoscaling      = false
autoscaling_min_replicas = 1
autoscaling_max_replicas = 3

# Cost Optimization
enable_spot_instances    = true
spot_instance_percentage = 100 
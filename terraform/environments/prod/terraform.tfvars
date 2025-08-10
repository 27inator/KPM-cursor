# ====================================
# KMP SUPPLY CHAIN - PRODUCTION ENVIRONMENT
# Enterprise-grade high availability configuration
# ====================================

# General
project_name = "kmp-supply-chain"
environment  = "prod"
aws_region   = "us-west-2"

# VPC Configuration - Multi-AZ for HA
vpc_cidr             = "10.0.0.0/16"
private_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
public_subnet_cidrs  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
enable_nat_gateway   = true
enable_vpn_gateway   = false

# EKS Configuration - High Availability
kubernetes_version = "1.27"
eks_node_groups = {
  general = {
    instance_types = ["m5.large"]
    capacity_type  = "ON_DEMAND"
    min_size      = 3
    max_size      = 20
    desired_size  = 6
    disk_size     = 100
    ami_type      = "AL2_x86_64"
    labels = {
      role = "general"
      environment = "prod"
    }
    taints = []
  }
  
  compute = {
    instance_types = ["c5.xlarge"]
    capacity_type  = "ON_DEMAND"
    min_size      = 2
    max_size      = 50
    desired_size  = 4
    disk_size     = 200
    ami_type      = "AL2_x86_64"
    labels = {
      role = "compute"
      environment = "prod"
    }
    taints = [{
      key    = "compute"
      value  = "true"
      effect = "NO_SCHEDULE"
    }]
  }
  
  monitoring = {
    instance_types = ["m5.large"]
    capacity_type  = "ON_DEMAND"
    min_size      = 2
    max_size      = 5
    desired_size  = 2
    disk_size     = 100
    ami_type      = "AL2_x86_64"
    labels = {
      role = "monitoring"
      environment = "prod"
    }
    taints = [{
      key    = "monitoring"
      value  = "true"
      effect = "NO_SCHEDULE"
    }]
  }
}

# RDS Configuration - Production Grade
postgres_version         = "15.4"
rds_instance_class      = "db.r5.xlarge"
rds_allocated_storage   = 500
rds_max_allocated_storage = 2000
database_name           = "kmp_supply_chain"
database_username       = "kmp_user"
rds_backup_retention    = 30  # 30 days retention
rds_backup_window       = "03:00-04:00"
rds_maintenance_window  = "sun:04:00-sun:05:00"
rds_monitoring_interval = 60  # Enhanced monitoring

# Monitoring - Full Stack
prometheus_enabled = true
grafana_enabled    = true

# Security - Full Logging & Compliance
enable_cluster_logging = true
cluster_log_types     = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
enable_irsa           = true

# Application - High Availability
application_image_tag    = "1.0.0"
application_replicas     = 5
enable_autoscaling      = true
autoscaling_min_replicas = 3
autoscaling_max_replicas = 50

# Cost Optimization - Balanced approach
enable_spot_instances    = false  # No spot instances in production
spot_instance_percentage = 0 
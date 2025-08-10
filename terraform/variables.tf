# ====================================
# KMP SUPPLY CHAIN - TERRAFORM VARIABLES
# Infrastructure configuration parameters
# ====================================

# ====================================
# GENERAL VARIABLES
# ====================================
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "kmp-supply-chain"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

# ====================================
# VPC VARIABLES
# ====================================
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "enable_vpn_gateway" {
  description = "Enable VPN Gateway"
  type        = bool
  default     = false
}

# ====================================
# EKS VARIABLES
# ====================================
variable "kubernetes_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.27"
}

variable "eks_node_groups" {
  description = "EKS node group configurations"
  type = map(object({
    instance_types = list(string)
    capacity_type  = string
    min_size      = number
    max_size      = number
    desired_size  = number
    disk_size     = number
    ami_type      = string
    labels        = map(string)
    taints = list(object({
      key    = string
      value  = string
      effect = string
    }))
  }))
  
  default = {
    general = {
      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
      min_size      = 1
      max_size      = 10
      desired_size  = 3
      disk_size     = 50
      ami_type      = "AL2_x86_64"
      labels = {
        role = "general"
      }
      taints = []
    }
    
    compute = {
      instance_types = ["c5.large"]
      capacity_type  = "SPOT"
      min_size      = 0
      max_size      = 20
      desired_size  = 2
      disk_size     = 100
      ami_type      = "AL2_x86_64"
      labels = {
        role = "compute"
      }
      taints = [{
        key    = "compute"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }
}

# ====================================
# RDS VARIABLES
# ====================================
variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15.4"
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_allocated_storage" {
  description = "Initial storage size for RDS instance"
  type        = number
  default     = 20
}

variable "rds_max_allocated_storage" {
  description = "Maximum storage size for RDS instance"
  type        = number
  default     = 100
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "kmp_supply_chain"
}

variable "database_username" {
  description = "Database master username"
  type        = string
  default     = "kmp_user"
}

variable "rds_backup_retention" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "rds_backup_window" {
  description = "Backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "rds_maintenance_window" {
  description = "Maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "rds_monitoring_interval" {
  description = "Enhanced monitoring interval"
  type        = number
  default     = 60
}

# ====================================
# MONITORING VARIABLES
# ====================================
variable "prometheus_enabled" {
  description = "Enable Prometheus monitoring"
  type        = bool
  default     = true
}

variable "grafana_enabled" {
  description = "Enable Grafana dashboards"
  type        = bool
  default     = true
}

# ====================================
# SECURITY VARIABLES
# ====================================
variable "enable_cluster_logging" {
  description = "Enable EKS cluster logging"
  type        = bool
  default     = true
}

variable "cluster_log_types" {
  description = "List of EKS cluster log types to enable"
  type        = list(string)
  default     = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
}

variable "enable_irsa" {
  description = "Enable IAM Roles for Service Accounts"
  type        = bool
  default     = true
}

# ====================================
# APPLICATION VARIABLES
# ====================================
variable "application_image_tag" {
  description = "Docker image tag for KMP application"
  type        = string
  default     = "latest"
}

variable "application_replicas" {
  description = "Number of application replicas"
  type        = number
  default     = 3
}

variable "enable_autoscaling" {
  description = "Enable horizontal pod autoscaling"
  type        = bool
  default     = true
}

variable "autoscaling_min_replicas" {
  description = "Minimum number of replicas for autoscaling"
  type        = number
  default     = 2
}

variable "autoscaling_max_replicas" {
  description = "Maximum number of replicas for autoscaling"
  type        = number
  default     = 20
}

# ====================================
# COST OPTIMIZATION
# ====================================
variable "enable_spot_instances" {
  description = "Enable spot instances for cost optimization"
  type        = bool
  default     = false
}

variable "spot_instance_percentage" {
  description = "Percentage of spot instances in node groups"
  type        = number
  default     = 50
  
  validation {
    condition     = var.spot_instance_percentage >= 0 && var.spot_instance_percentage <= 100
    error_message = "Spot instance percentage must be between 0 and 100."
  }
} 
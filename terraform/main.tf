# ====================================
# KMP SUPPLY CHAIN - TERRAFORM MAIN
# AWS EKS Infrastructure as Code
# ====================================

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
  }

  backend "s3" {
    # Configure in backend.tf or via CLI
    # bucket = "your-terraform-state-bucket"
    # key    = "kmp-supply-chain/terraform.tfstate"
    # region = "us-west-2"
  }
}

# ====================================
# PROVIDERS
# ====================================
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "kmp-supply-chain"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

data "aws_eks_cluster" "cluster" {
  name = module.eks.cluster_name
}

data "aws_eks_cluster_auth" "cluster" {
  name = module.eks.cluster_name
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.cluster.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.cluster.token
  }
}

# ====================================
# DATA SOURCES
# ====================================
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# ====================================
# LOCAL VALUES
# ====================================
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
  
  azs = slice(data.aws_availability_zones.available.names, 0, 3)
}

# ====================================
# VPC MODULE
# ====================================
module "vpc" {
  source = "./modules/vpc"
  
  name_prefix = local.name_prefix
  environment = var.environment
  
  vpc_cidr             = var.vpc_cidr
  availability_zones   = local.azs
  private_subnet_cidrs = var.private_subnet_cidrs
  public_subnet_cidrs  = var.public_subnet_cidrs
  
  enable_nat_gateway = var.enable_nat_gateway
  enable_vpn_gateway = var.enable_vpn_gateway
  
  tags = local.common_tags
}

# ====================================
# EKS MODULE
# ====================================
module "eks" {
  source = "./modules/eks"
  
  cluster_name    = "${local.name_prefix}-cluster"
  cluster_version = var.kubernetes_version
  
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  public_subnets  = module.vpc.public_subnets
  
  node_groups = var.eks_node_groups
  
  tags = local.common_tags
  
  depends_on = [module.vpc]
}

# ====================================
# RDS MODULE  
# ====================================
module "rds" {
  source = "./modules/rds"
  
  identifier = "${local.name_prefix}-postgres"
  
  engine         = "postgres"
  engine_version = var.postgres_version
  instance_class = var.rds_instance_class
  
  allocated_storage     = var.rds_allocated_storage
  max_allocated_storage = var.rds_max_allocated_storage
  storage_encrypted     = true
  
  db_name  = var.database_name
  username = var.database_username
  
  vpc_id               = module.vpc.vpc_id
  private_subnets      = module.vpc.private_subnets
  allowed_cidr_blocks  = [var.vpc_cidr]
  
  backup_retention_period = var.rds_backup_retention
  backup_window          = var.rds_backup_window
  maintenance_window     = var.rds_maintenance_window
  
  monitoring_interval = var.rds_monitoring_interval
  
  tags = local.common_tags
  
  depends_on = [module.vpc]
}

# ====================================
# MONITORING MODULE
# ====================================
module "monitoring" {
  source = "./modules/monitoring"
  
  cluster_name = module.eks.cluster_name
  environment  = var.environment
  
  prometheus_enabled = var.prometheus_enabled
  grafana_enabled    = var.grafana_enabled
  
  tags = local.common_tags
  
  depends_on = [module.eks]
}

# ====================================
# OUTPUTS
# ====================================
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "rds_password" {
  description = "RDS instance password"
  value       = module.rds.password
  sensitive   = true
} 
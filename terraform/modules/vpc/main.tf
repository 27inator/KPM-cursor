# ====================================
# KMP SUPPLY CHAIN - VPC MODULE
# Network infrastructure for EKS cluster
# ====================================

# ====================================
# VPC
# ====================================
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name                                        = "${var.name_prefix}-vpc"
    "kubernetes.io/cluster/${var.name_prefix}-cluster" = "shared"
  })
}

# ====================================
# INTERNET GATEWAY
# ====================================
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-igw"
  })
}

# ====================================
# PUBLIC SUBNETS
# ====================================
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name                                        = "${var.name_prefix}-public-${count.index + 1}"
    Type                                        = "public"
    "kubernetes.io/cluster/${var.name_prefix}-cluster" = "shared"
    "kubernetes.io/role/elb"                    = "1"
  })
}

# ====================================
# PRIVATE SUBNETS
# ====================================
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name                                        = "${var.name_prefix}-private-${count.index + 1}"
    Type                                        = "private"
    "kubernetes.io/cluster/${var.name_prefix}-cluster" = "owned"
    "kubernetes.io/role/internal-elb"           = "1"
  })
}

# ====================================
# ELASTIC IPS FOR NAT GATEWAYS
# ====================================
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? length(var.public_subnet_cidrs) : 0

  domain = "vpc"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# ====================================
# NAT GATEWAYS
# ====================================
resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? length(var.public_subnet_cidrs) : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# ====================================
# ROUTE TABLES - PUBLIC
# ====================================
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-rt-public"
    Type = "public"
  })
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ====================================
# ROUTE TABLES - PRIVATE
# ====================================
resource "aws_route_table" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[count.index].id
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-rt-private-${count.index + 1}"
    Type = "private"
  })
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ====================================
# VPC ENDPOINTS
# ====================================
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${data.aws_region.current.name}.s3"
  
  route_table_ids = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id
  )

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vpce-s3"
  })
}

resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_endpoint_type   = "Interface"
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ecr.dkr"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vpce-ecr-dkr"
  })
}

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_endpoint_type   = "Interface"
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ecr.api"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vpce-ecr-api"
  })
}

# ====================================
# SECURITY GROUPS
# ====================================
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${var.name_prefix}-vpce-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-sg-vpce"
  })
}

# ====================================
# DATA SOURCES
# ====================================
data "aws_region" "current" {}

# ====================================
# VPN GATEWAY (OPTIONAL)
# ====================================
resource "aws_vpn_gateway" "main" {
  count = var.enable_vpn_gateway ? 1 : 0

  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vpn-gateway"
  })
} 
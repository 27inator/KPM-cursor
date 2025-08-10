# ====================================
# KMP SUPPLY CHAIN - VAULT MODULE
# Enterprise HashiCorp Vault for secrets management
# ====================================

# ====================================
# KMS KEY FOR AUTO-UNSEALING
# ====================================
resource "aws_kms_key" "vault" {
  description = "KMS key for Vault auto-unsealing"
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vault-unseal-key"
    Component = "vault"
  })
}

resource "aws_kms_alias" "vault" {
  name          = "alias/${var.name_prefix}-vault-unseal"
  target_key_id = aws_kms_key.vault.key_id
}

# ====================================
# IAM ROLE FOR VAULT
# ====================================
resource "aws_iam_role" "vault" {
  name = "${var.name_prefix}-vault-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_policy" "vault" {
  name = "${var.name_prefix}-vault-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.vault.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "secretsmanager:PutSecretValue",
          "secretsmanager:CreateSecret",
          "secretsmanager:UpdateSecret",
          "secretsmanager:TagResource"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:GetRole",
          "iam:GetUser",
          "sts:AssumeRole"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "vault" {
  role       = aws_iam_role.vault.name
  policy_arn = aws_iam_policy.vault.arn
}

resource "aws_iam_instance_profile" "vault" {
  name = "${var.name_prefix}-vault-profile"
  role = aws_iam_role.vault.name
}

# ====================================
# SECURITY GROUP FOR VAULT
# ====================================
resource "aws_security_group" "vault" {
  name_prefix = "${var.name_prefix}-vault-"
  vpc_id      = var.vpc_id

  # Vault API
  ingress {
    from_port   = 8200
    to_port     = 8200
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # Vault cluster communication
  ingress {
    from_port = 8201
    to_port   = 8201
    protocol  = "tcp"
    self      = true
  }

  # SSH (optional, for debugging)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vault-sg"
  })
}

# ====================================
# LAUNCH TEMPLATE FOR VAULT
# ====================================
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_launch_template" "vault" {
  name_prefix   = "${var.name_prefix}-vault-"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.vault.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.vault.name
  }

  user_data = base64encode(templatefile("${path.module}/templates/vault-userdata.sh", {
    kms_key_id    = aws_kms_key.vault.key_id
    region        = data.aws_region.current.name
    vault_version = var.vault_version
    cluster_name  = "${var.name_prefix}-vault"
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.tags, {
      Name = "${var.name_prefix}-vault"
      Component = "vault"
    })
  }
}

# ====================================
# AUTO SCALING GROUP FOR HA
# ====================================
resource "aws_autoscaling_group" "vault" {
  name                = "${var.name_prefix}-vault-asg"
  vpc_zone_identifier = var.private_subnets
  target_group_arns   = [aws_lb_target_group.vault.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.vault_cluster_size
  max_size         = var.vault_cluster_size + 2
  desired_capacity = var.vault_cluster_size

  launch_template {
    id      = aws_launch_template.vault.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.name_prefix}-vault"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = var.tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# ====================================
# LOAD BALANCER FOR VAULT
# ====================================
resource "aws_lb" "vault" {
  name               = "${var.name_prefix}-vault-alb"
  internal           = true
  load_balancer_type = "application"
  security_groups    = [aws_security_group.vault_alb.id]
  subnets            = var.private_subnets

  enable_deletion_protection = var.environment == "prod"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vault-alb"
  })
}

resource "aws_security_group" "vault_alb" {
  name_prefix = "${var.name_prefix}-vault-alb-"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  ingress {
    from_port   = 8200
    to_port     = 8200
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vault-alb-sg"
  })
}

resource "aws_lb_target_group" "vault" {
  name     = "${var.name_prefix}-vault-tg"
  port     = 8200
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/v1/sys/health?standbyok=true"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vault-tg"
  })
}

resource "aws_lb_listener" "vault" {
  load_balancer_arn = aws_lb.vault.arn
  port              = "8200"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.vault.arn
  }
}

# ====================================
# VAULT CONFIGURATION
# ====================================
resource "vault_mount" "kmp_secrets" {
  count = var.configure_vault ? 1 : 0
  
  path        = "kmp-secrets"
  type        = "kv-v2"
  description = "KMP Supply Chain secrets"
}

resource "vault_auth_backend" "kubernetes" {
  count = var.configure_vault ? 1 : 0
  
  type = "kubernetes"
  path = "kubernetes"
}

resource "vault_kubernetes_auth_backend_config" "kubernetes" {
  count = var.configure_vault ? 1 : 0
  
  backend            = vault_auth_backend.kubernetes[0].path
  kubernetes_host    = var.kubernetes_host
  kubernetes_ca_cert = var.kubernetes_ca_cert
}

# ====================================
# KMP-SPECIFIC VAULT POLICIES
# ====================================
resource "vault_policy" "kmp_api" {
  count = var.configure_vault ? 1 : 0
  
  name = "kmp-api-policy"

  policy = <<EOF
# Allow reading KMP API secrets
path "kmp-secrets/data/api/*" {
  capabilities = ["read"]
}

# Allow reading database secrets
path "kmp-secrets/data/database/*" {
  capabilities = ["read"]
}

# Allow reading blockchain secrets
path "kmp-secrets/data/blockchain/*" {
  capabilities = ["read"]
}
EOF
}

resource "vault_policy" "kmp_broadcaster" {
  count = var.configure_vault ? 1 : 0
  
  name = "kmp-broadcaster-policy"

  policy = <<EOF
# Allow reading blockchain secrets
path "kmp-secrets/data/blockchain/*" {
  capabilities = ["read"]
}

# Allow reading kaspa node secrets
path "kmp-secrets/data/kaspa/*" {
  capabilities = ["read"]
}
EOF
}

# ====================================
# KUBERNETES SERVICE ACCOUNT BINDINGS
# ====================================
resource "vault_kubernetes_auth_backend_role" "kmp_api" {
  count = var.configure_vault ? 1 : 0
  
  backend                          = vault_auth_backend.kubernetes[0].path
  role_name                        = "kmp-api-role"
  bound_service_account_names      = ["kmp-message-bus"]
  bound_service_account_namespaces = [var.kubernetes_namespace]
  token_ttl                        = 3600
  token_policies                   = [vault_policy.kmp_api[0].name]
}

resource "vault_kubernetes_auth_backend_role" "kmp_broadcaster" {
  count = var.configure_vault ? 1 : 0
  
  backend                          = vault_auth_backend.kubernetes[0].path
  role_name                        = "kmp-broadcaster-role"
  bound_service_account_names      = ["kmp-kaspa-broadcaster"]
  bound_service_account_namespaces = [var.kubernetes_namespace]
  token_ttl                        = 3600
  token_policies                   = [vault_policy.kmp_broadcaster[0].name]
}

# ====================================
# DATA SOURCES
# ====================================
data "aws_region" "current" {} 
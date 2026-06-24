# -------------------------------------------------------
# security.tf — Security Groups for ALB, ECS, and RDS
# -------------------------------------------------------

# ── ALB Security Group ──────────────────────────────────
# Allows HTTP/HTTPS from the internet, only talks to ECS on app port
resource "aws_security_group" "alb" {
  name        = "${var.app_name}-alb-security-group"
  description = "Allow HTTP and HTTPS from the internet"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description     = "Only allow traffic to ECS tasks on app port"
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  tags = {
    Name = "${var.app_name}-alb-sg"
  }
}

# ── ECS Tasks Security Group ───────────────────────────
# Only accepts traffic from ALB, can reach internet (via NAT) and RDS
resource "aws_security_group" "ecs" {
  name        = "${var.app_name}-ecs-tasks-security-group"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "Allow all outbound (internet via NAT, RDS, etc.)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-ecs-tasks-sg"
  }
}

# ECS ingress: only allow traffic from ALB on app port
resource "aws_security_group_rule" "ecs_ingress_from_alb" {
  type                     = "ingress"
  from_port                = var.app_port
  to_port                  = var.app_port
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = aws_security_group.ecs.id
}

# ── RDS Security Group ─────────────────────────────────
# Only accepts traffic from ECS tasks on PostgreSQL port
resource "aws_security_group" "rds" {
  name        = "${var.app_name}-rds-security-group"
  description = "Allow PostgreSQL access from ECS tasks only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-rds-sg"
  }
}

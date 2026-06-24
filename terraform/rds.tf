# -------------------------------------------------------
# rds.tf — Amazon RDS PostgreSQL Database
# -------------------------------------------------------

resource "random_password" "rds_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "rds_password" {
  name                    = var.rds_password_secret_name
  recovery_window_in_days = 0 # Allows immediate deletion during testing
}


resource "aws_secretsmanager_secret_version" "rds_password" {
  secret_id     = aws_secretsmanager_secret.rds_password.id
  secret_string = random_password.rds_password.result
}
resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-db-subnet-group"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = {
    Name = "${var.app_name}-db-subnet-group"
  }
}

resource "aws_db_instance" "main" {
  identifier = "${var.app_name}-db"

  # Engine
  engine         = "postgres"
  engine_version = "16"

  # Size
  instance_class    = "db.t4g.micro"
  allocated_storage = 20
  storage_type      = "gp2"
  storage_encrypted = true

  # Database credentials
  db_name  = var.rds_database
  username = var.rds_username
  password = random_password.rds_password.result
  port     = 5432

  # Networking — private subnets, NOT publicly accessible
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Monitoring
  performance_insights_enabled = true

  # Allow terraform destroy without creating a final snapshot
  skip_final_snapshot = true

  tags = {
    Name = "${var.app_name}-db"
  }
}

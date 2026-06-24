# -------------------------------------------------------
# variables.tf — All variable declarations in one place
# -------------------------------------------------------

# ── AWS Region ──────────────────────────────────────────
variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-west-2"
}

# ── App Settings ────────────────────────────────────────
variable "app_name" {
  description = "Name used for all resources (cluster, service, ALB, etc.)"
  type        = string
  default     = "loop"
}

variable "app_port" {
  description = "Port the Next.js container listens on"
  type        = number
  default     = 3000
}

# ── Domain ──────────────────────────────────────────────
variable "domain_name" {
  description = "Your domain name (must already have a Route 53 hosted zone)"
  type        = string
  default     = "omershahzad.me"
}

# ── ECS Task Size ──────────────────────────────────────
variable "task_cpu" {
  description = "CPU units for the ECS task (1024 = 1 vCPU)"
  type        = string
  default     = "1024"
}

variable "task_memory" {
  description = "Memory in MB for the ECS task"
  type        = string
  default     = "2048"
}

variable "desired_count" {
  description = "Number of ECS tasks to run"
  type        = number
  default     = 2
}

# ── RDS Database ────────────────────────────────────────
variable "rds_username" {
  description = "Master username for the RDS database"
  type        = string
  default     = "omerprojectdb"
}

variable "rds_password_secret_name" {
  description = "Name of the AWS Secrets Manager secret containing the RDS password"
  type        = string
  default     = "omerproject-rds-password"
}

variable "rds_database" {
  description = "Name of the database to create inside RDS"
  type        = string
  default     = "postgres"
}

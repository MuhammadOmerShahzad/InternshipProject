terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-2"
}

variable "vpc_id" {
  default = "vpc-008d9c20fbf8fe036"
}

variable "public_subnets" {
  description = "List of public subnet IDs (e.g., loop-public-subnet, loop-public-subnet-2)"
  type        = list(string)
  default     = ["subnet-07f2b0aadea5a88f9", "subnet-0ffa52e9c3ba660df"]
}

variable "private_subnets" {
  description = "List of private subnet IDs (e.g., loop-private-subnet)"
  type        = list(string)
  default     = ["subnet-0168e1695c34f46a6"]
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate for omershahzad.me"
  type        = string
}

variable "app_name" {
  default = "loop"
}

variable "app_port" {
  default = 3000
}

variable "rds_host" {
  default = "loop-db.c5m0c60ykcap.us-east-2.rds.amazonaws.com"
}

variable "rds_user" {
  default = "omerprojectdb"
}

variable "rds_password" {
  default = "omer12345"
  sensitive = true
}

variable "rds_database" {
  default = "postgres"
}

variable "rds_port" {
  default = 5432
}

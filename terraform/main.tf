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
  default = "us-east-1"
}

variable "vpc_id" {
  default = "vpc-039ba887176e3f3ff"
}

variable "public_subnets" {
  default = ["subnet-0aa73349b6c29ee41", "subnet-0dca23516769b37cb"]
}

variable "private_subnets" {
  default = ["subnet-07ed6a5d3ebf6bfd8", "subnet-0085d273ab993bea7"]
}

variable "app_name" {
  default = "omer-project"
}

variable "app_port" {
  default = 3000
}

variable "rds_host" {
  default = "omer-project-db.c03swkc0coph.us-east-1.rds.amazonaws.com"
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

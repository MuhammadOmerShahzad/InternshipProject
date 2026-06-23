# Terraform Deployment Guide

This Terraform configuration deploys your Next.js app to AWS ECS with ALB.

## What gets created:

1. **ECR Repository** - Stores Docker images
2. **ECS Cluster** - Manages containers
3. **ECS Service** - Runs your app with 2 tasks
4. **Auto Scaling Group** - Launches EC2 instances
5. **Application Load Balancer** - Routes traffic
6. **CloudWatch Logs** - App logs

## Before deploying:

1. Build and push Docker image to ECR:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 395063533284.dkr.ecr.us-east-1.amazonaws.com

docker build -t omer-project-app:latest .

docker tag omer-project-app:latest 395063533284.dkr.ecr.us-east-1.amazonaws.com/omer-project-app:latest

docker push 395063533284.dkr.ecr.us-east-1.amazonaws.com/omer-project-app:latest
```

(Replace `395063533284` with your AWS Account ID)

## Deploy with Terraform:

```bash
cd terraform

# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Deploy
terraform apply
```

## After deployment:

- Get ALB DNS name from outputs:
```bash
terraform output alb_dns_name
```

- View logs:
```bash
aws logs tail /ecs/omer-project --follow
```

- View ECS tasks:
```bash
aws ecs list-tasks --cluster omer-project-cluster
```

## Cleanup:

```bash
terraform destroy
```

## Files:

- `main.tf` - Provider and variables
- `ecr.tf` - Container registry
- `ecs.tf` - Cluster, service, task definition
- `alb.tf` - Load balancer
- `security.tf` - Security groups
- `user_data.sh` - EC2 initialization script

# -------------------------------------------------------
# ecr.tf — Elastic Container Registry
# -------------------------------------------------------

resource "aws_ecr_repository" "app" {
  name                 = "${var.app_name}-repo"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    Name = "${var.app_name}-ecr"
  }
}

resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 5 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 5
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

resource "null_resource" "docker_build_and_push" {
  depends_on = [aws_ecr_repository.app]

  triggers = {
    # Re-run this if the ECR repository URL changes
    repository_url = aws_ecr_repository.app.repository_url
    
    # We use timestamp() to always force a build & push during terraform apply,
    # ensuring the latest code is deployed.
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = <<EOF
      aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.app.repository_url}
      docker build --platform linux/amd64 -t ${aws_ecr_repository.app.repository_url}:latest -f ../dockerfile ..
      docker push ${aws_ecr_repository.app.repository_url}:latest
    EOF
  }
}

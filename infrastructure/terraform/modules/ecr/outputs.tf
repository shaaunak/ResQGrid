output "api_repository_url" {
  description = "The URL of the API ECR repository"
  value       = aws_ecr_repository.api.repository_url
}

output "api_repository_arn" {
  description = "The ARN of the API ECR repository"
  value       = aws_ecr_repository.api.arn
}

output "worker_repository_url" {
  description = "The URL of the Worker ECR repository"
  value       = aws_ecr_repository.worker.repository_url
}

output "worker_repository_arn" {
  description = "The ARN of the Worker ECR repository"
  value       = aws_ecr_repository.worker.arn
}


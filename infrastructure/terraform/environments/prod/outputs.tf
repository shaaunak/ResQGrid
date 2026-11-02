output "ec2_public_ip" {
  description = "Public IPv4 address of the EC2 application host"
  value       = module.ec2.public_ip
}

output "rds_endpoint" {
  description = "Private RDS PostgreSQL endpoint inside private DB subnets"
  value       = module.rds.endpoint
}

output "s3_bucket_name" {
  description = "Private S3 evidence storage bucket"
  value       = module.s3.bucket_name
}

output "sqs_queue_url" {
  description = "Amazon SQS main processing queue URL"
  value       = module.sqs_sns.queue_url
}

output "sqs_dlq_url" {
  description = "Amazon SQS Dead-Letter Queue URL"
  value       = module.sqs_sns.dlq_url
}

output "cloudwatch_alarm_arn" {
  description = "CloudWatch Alarm monitoring SQS backlog and oldest message age"
  value       = module.cloudwatch.alarm_arn
}

output "budget_name" {
  description = "AWS Budgets cost cap tracker"
  value       = module.budgets.budget_name
}

output "ecr_api_repository_url" {
  description = "URL of the Amazon ECR repository for the ResQGrid API"
  value       = module.ecr.api_repository_url
}

output "ecr_worker_repository_url" {
  description = "URL of the Amazon ECR repository for the ResQGrid Worker"
  value       = module.ecr.worker_repository_url
}


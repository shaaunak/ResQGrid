output "vpc_id" {
  description = "Custom VPC ID (10.0.0.0/16)"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public Subnet IDs (dual AZ)"
  value       = module.vpc.public_subnet_ids
}

output "private_db_subnet_ids" {
  description = "Private Subnet IDs for RDS PostgreSQL"
  value       = module.vpc.db_subnet_ids
}

output "alb_dns_name" {
  description = "Application Load Balancer Public DNS"
  value       = module.asg_alb.alb_dns_name
}

output "asg_name" {
  description = "Auto Scaling Group Name"
  value       = module.asg_alb.asg_name
}

output "rds_endpoint" {
  description = "RDS PostgreSQL Endpoint"
  value       = module.rds.endpoint
}

output "s3_evidence_bucket" {
  description = "S3 Evidence Storage Bucket"
  value       = module.s3.evidence_bucket_name
}

output "s3_reports_bucket" {
  description = "S3 Reports & Briefs Bucket"
  value       = module.s3.reports_bucket_name
}

output "s3_backups_bucket" {
  description = "S3 Backups Bucket (Nightly pg_dump)"
  value       = module.s3.backups_bucket_name
}

output "sqs_queue_url" {
  description = "SQS Main Event Processing Queue URL"
  value       = module.sqs_sns.queue_url
}

output "sqs_dlq_url" {
  description = "SQS Dead Letter Queue URL"
  value       = module.sqs_sns.dlq_url
}

output "sns_escalation_arn" {
  description = "Emergency Escalation SNS Topic ARN"
  value       = module.sqs_sns.escalation_topic_arn
}

output "cloudwatch_sqs_alarm_arn" {
  description = "CloudWatch SQS Oldest Message Age Alarm ARN"
  value       = module.cloudwatch.sqs_alarm_arn
}

output "cloudwatch_alb_5xx_alarm_arn" {
  description = "CloudWatch ALB 5xx Alarm ARN"
  value       = module.cloudwatch.alb_5xx_alarm_arn
}

output "cloudwatch_low_stock_alarm_arn" {
  description = "CloudWatch Low Stock Alarm ARN"
  value       = module.cloudwatch.low_stock_alarm_arn
}

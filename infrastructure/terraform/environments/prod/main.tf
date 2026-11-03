terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "ResQGrid"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# 1. Custom VPC (10.0.0.0/16) with 2 Public & 2 Private Subnets, IGW, SGs, S3 Gateway Endpoint, NO NAT Gateway
module "vpc" {
  source      = "../../modules/vpc"
  environment = var.environment
  vpc_cidr    = "10.0.0.0/16"
}

# 2. S3 Encrypted Private Buckets (Evidence, Reports, Backups)
module "s3" {
  source      = "../../modules/s3"
  environment = var.environment
}

# 3. Asynchronous Messaging Pipeline (SQS Standard + DLQ + SNS Topics)
module "sqs_sns" {
  source      = "../../modules/sqs_sns"
  environment = var.environment
}

# 4. IAM Least Privilege Roles (EC2 API Server vs. Background Worker with Rekognition/Translate/Comprehend)
module "iam" {
  source                   = "../../modules/iam"
  environment              = var.environment
  evidence_bucket_arn      = module.s3.evidence_bucket_arn
  reports_bucket_arn       = module.s3.reports_bucket_arn
  backups_bucket_arn       = module.s3.backups_bucket_arn
  sqs_queue_arn            = module.sqs_sns.queue_arn
  sqs_dlq_arn              = module.sqs_sns.dlq_arn
  sns_escalation_topic_arn = module.sqs_sns.escalation_topic_arn
  sns_shortage_topic_arn   = module.sqs_sns.shortage_topic_arn
}

# 5. Private Amazon RDS PostgreSQL (Single-AZ, db.t3.micro)
module "rds" {
  source               = "../../modules/rds"
  environment          = var.environment
  db_subnet_ids        = module.vpc.db_subnet_ids
  db_security_group_id = module.vpc.db_security_group_id
  db_password          = var.db_password
}

# 6. ALB & Auto Scaling Group (Min 1, Max 2 of t3.micro running container stack)
module "asg_alb" {
  source                = "../../modules/asg_alb"
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.vpc.alb_security_group_id
  app_security_group_id = module.vpc.app_security_group_id
  instance_profile_name = module.iam.api_instance_profile_name
  instance_type         = "t3.micro"
}

# 7. CloudWatch Observability & Alarms (SQS Oldest Message Age, ALB 5xx, Low Inventory)
module "cloudwatch" {
  source              = "../../modules/cloudwatch"
  environment         = var.environment
  sqs_queue_name      = "resqgrid-incident-events-${var.environment}"
  sns_alarm_topic_arn = module.sqs_sns.escalation_topic_arn
  alb_arn_suffix      = module.asg_alb.alb_arn
}

# 8. AWS Budgets Cost Cap ($20.00/mo with 50%, 80%, 100% threshold notifications)
module "budgets" {
  source       = "../../modules/budgets"
  alert_emails = var.budget_alert_emails
}

# 9. Amazon ECR Container Registries
module "ecr" {
  source      = "../../modules/ecr"
  environment = var.environment
}

# 10. Secure Systems Manager (SSM) Parameter Store Configuration
resource "aws_ssm_parameter" "database_url" {
  name        = "/resqgrid/${var.environment}/database_url"
  description = "Async PostgreSQL Connection String for ResQGrid Core API"
  type        = "SecureString"
  value       = "postgresql+asyncpg://resqgrid_admin:${var.db_password}@${module.rds.endpoint}/resqgrid_db"
}

resource "aws_ssm_parameter" "s3_evidence_bucket" {
  name        = "/resqgrid/${var.environment}/s3_evidence_bucket"
  description = "Evidence S3 Bucket Name"
  type        = "String"
  value       = module.s3.evidence_bucket_name
}

resource "aws_ssm_parameter" "s3_reports_bucket" {
  name        = "/resqgrid/${var.environment}/s3_reports_bucket"
  description = "Reports S3 Bucket Name"
  type        = "String"
  value       = module.s3.reports_bucket_name
}

resource "aws_ssm_parameter" "s3_backups_bucket" {
  name        = "/resqgrid/${var.environment}/s3_backups_bucket"
  description = "Database Backups S3 Bucket Name"
  type        = "String"
  value       = module.s3.backups_bucket_name
}

resource "aws_ssm_parameter" "sqs_queue_url" {
  name        = "/resqgrid/${var.environment}/sqs_queue_url"
  description = "Active Incident Pipeline SQS Queue URL"
  type        = "String"
  value       = module.sqs_sns.queue_url
}

resource "aws_ssm_parameter" "sns_escalation_topic" {
  name        = "/resqgrid/${var.environment}/sns_escalation_topic"
  description = "Emergency Escalation SNS Topic ARN"
  type        = "String"
  value       = module.sqs_sns.escalation_topic_arn
}

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

# 1. Custom VPC (10.20.0.0/16)
module "vpc" {
  source      = "../../modules/vpc"
  environment = var.environment
}

# 2. Private S3 Evidence Storage
module "s3" {
  source      = "../../modules/s3"
  environment = var.environment
}

# 3. Asynchronous Messaging (SQS + DLQ + SNS)
module "sqs_sns" {
  source      = "../../modules/sqs_sns"
  environment = var.environment
}

# 4. IAM Least-Privilege Roles & Profiles
module "iam" {
  source                   = "../../modules/iam"
  environment              = var.environment
  s3_bucket_arn            = module.s3.bucket_arn
  sqs_queue_arn            = module.sqs_sns.queue_arn
  sqs_dlq_arn              = module.sqs_sns.dlq_arn
  sns_escalation_topic_arn = module.sqs_sns.escalation_topic_arn
  sns_shortage_topic_arn   = module.sqs_sns.shortage_topic_arn
}

# 5. Private Amazon RDS PostgreSQL (Single-AZ)
module "rds" {
  source               = "../../modules/rds"
  environment          = var.environment
  db_subnet_ids        = module.vpc.db_subnet_ids
  db_security_group_id = module.vpc.db_security_group_id
  db_password          = var.db_password
}

# 6. EC2 Compute Host
module "ec2" {
  source                = "../../modules/ec2"
  environment           = var.environment
  subnet_id             = module.vpc.public_subnet_id
  security_group_id     = module.vpc.app_security_group_id
  instance_profile_name = module.iam.instance_profile_name
}

# 7. CloudWatch Observability & SQS Oldest Message Age Alarm
module "cloudwatch" {
  source              = "../../modules/cloudwatch"
  environment         = var.environment
  sqs_queue_name      = "resqgrid-incident-events-${var.environment}"
  sns_alarm_topic_arn = module.sqs_sns.escalation_topic_arn
}

# 8. AWS Budgets Cost Cap ($20.00/mo)
module "budgets" {
  source        = "../../modules/budgets"
  alert_emails  = var.budget_alert_emails
}

# 9. Amazon ECR Container Repositories
module "ecr" {
  source      = "../../modules/ecr"
  environment = var.environment
}

# 10. Secure Systems Manager (SSM) Parameter Store Secrets
resource "aws_ssm_parameter" "database_url" {
  name        = "/resqgrid/${var.environment}/database_url"
  description = "Async PostgreSQL Connection String for ResQGrid Core API"
  type        = "SecureString"
  value       = "postgresql+asyncpg://resqgrid_admin:${var.db_password}@${module.rds.endpoint}/resqgrid_db"
}

resource "aws_ssm_parameter" "s3_bucket" {
  name        = "/resqgrid/${var.environment}/s3_bucket"
  description = "S3 Bucket Name for Incident Evidence"
  type        = "String"
  value       = module.s3.bucket_name
}

resource "aws_ssm_parameter" "sqs_queue_url" {
  name        = "/resqgrid/${var.environment}/sqs_queue_url"
  description = "SQS Queue URL for Asynchronous Dispatch Jobs"
  type        = "String"
  value       = module.sqs_sns.queue_url
}


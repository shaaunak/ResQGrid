variable "s3_bucket_arn" {
  type = string
}

variable "sqs_queue_arn" {
  type = string
}

variable "sqs_dlq_arn" {
  type = string
}

variable "sns_escalation_topic_arn" {
  type = string
}

variable "sns_shortage_topic_arn" {
  type = string
}

variable "environment" {
  type    = string
  default = "prod"
}

# EC2 Assume Role
resource "aws_iam_role" "ec2_role" {
  name = "resqgrid-ec2-instance-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Project = "ResQGrid"
  }
}

# Least-Privilege Application Policy
resource "aws_iam_policy" "app_policy" {
  name        = "resqgrid-least-privilege-policy-${var.environment}"
  description = "Scoped permissions for S3, SQS, SNS, CloudWatch, and SSM"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # S3 Access
      {
        Sid    = "S3EvidenceStorageAccess"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          var.s3_bucket_arn,
          "${var.s3_bucket_arn}/*"
        ]
      },
      # SQS Queue Operations
      {
        Sid    = "SQSEventProcessingAccess"
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          var.sqs_queue_arn,
          var.sqs_dlq_arn
        ]
      },
      # SNS Alerts
      {
        Sid    = "SNSTopicPublishing"
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          var.sns_escalation_topic_arn,
          var.sns_shortage_topic_arn
        ]
      },
      # CloudWatch Logs & Metrics
      {
        Sid    = "CloudWatchObservability"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      },
      # SSM Parameter Store Secrets
      {
        Sid    = "SSMParameterStoreAccess"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:*:*:parameter/resqgrid/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attach_app_policy" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.app_policy.arn
}

# AWS Systems Manager Core policy for Session Manager (no public SSH port needed)
resource "aws_iam_role_policy_attachment" "attach_ssm_core" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "resqgrid-ec2-instance-profile-${var.environment}"
  role = aws_iam_role.ec2_role.name
}

output "instance_profile_name" {
  value = aws_iam_instance_profile.ec2_profile.name
}

output "role_arn" {
  value = aws_iam_role.ec2_role.arn
}


variable "evidence_bucket_arn" {
  type = string
}

variable "reports_bucket_arn" {
  type = string
}

variable "backups_bucket_arn" {
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

# -------------------------------------------------------------
# 1. EC2 Base & API Role: Least-Privilege Web/API Operations
# -------------------------------------------------------------
resource "aws_iam_role" "api_role" {
  name = "resqgrid-api-role-${var.environment}"

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
    Role        = "API-Server"
    Project     = "ResQGrid"
    Environment = var.environment
  }
}

# One Policy for API Role: S3 Presigned, SQS Publish, CloudWatch, SSM
resource "aws_iam_policy" "api_policy" {
  name        = "resqgrid-api-policy-${var.environment}"
  description = "Least privilege permissions strictly required by ResQGrid API service"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # S3 Put/Get Object on Evidence and Reports buckets
      {
        Sid    = "S3IncidentStorageAccess"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          var.evidence_bucket_arn,
          "${var.evidence_bucket_arn}/*",
          var.reports_bucket_arn,
          "${var.reports_bucket_arn}/*"
        ]
      },
      # SQS Producer Access
      {
        Sid    = "SQSEventPublishing"
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl"
        ]
        Resource = [
          var.sqs_queue_arn
        ]
      },
      # SNS Escalation Alert Publishing
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
      # SSM Parameter Store Secrets Read
      {
        Sid    = "SSMSecretsAccess"
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

resource "aws_iam_role_policy_attachment" "attach_api_policy" {
  role       = aws_iam_role.api_role.name
  policy_arn = aws_iam_policy.api_policy.arn
}

resource "aws_iam_role_policy_attachment" "attach_api_ssm_core" {
  role       = aws_iam_role.api_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "api_profile" {
  name = "resqgrid-api-profile-${var.environment}"
  role = aws_iam_role.api_role.name
}

# -------------------------------------------------------------
# 2. Worker Role: SQS Consume + Rekognition + Translate + Comprehend ONLY
# -------------------------------------------------------------
resource "aws_iam_role" "worker_role" {
  name = "resqgrid-worker-role-${var.environment}"

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
    Role        = "Background-Worker"
    Project     = "ResQGrid"
    Environment = var.environment
  }
}

# One Scoped Policy for Worker Role: SQS Consumer, ML Services, S3 Reads
resource "aws_iam_policy" "worker_policy" {
  name        = "resqgrid-worker-policy-${var.environment}"
  description = "Least privilege permissions for background worker: SQS consume and AWS AI analysis only"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # SQS Consumer Access (Receive & Delete, DLQ Routing)
      {
        Sid    = "SQSConsumerOperations"
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:ChangeMessageVisibility"
        ]
        Resource = [
          var.sqs_queue_arn,
          var.sqs_dlq_arn
        ]
      },
      # S3 Read Evidence Photos
      {
        Sid    = "S3EvidenceInspection"
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = [
          "${var.evidence_bucket_arn}/*"
        ]
      },
      # AWS Rekognition - Image Hazard Detection (Emergency Verification)
      {
        Sid    = "RekognitionDisasterImageAnalysis"
        Effect = "Allow"
        Action = [
          "rekognition:DetectLabels",
          "rekognition:DetectModerationLabels"
        ]
        Resource = "*"
      },
      # AWS Translate - Multilingual Citizen Report Translation (Hindi/Marathi to English)
      {
        Sid    = "TranslateCitizenReports"
        Effect = "Allow"
        Action = [
          "translate:TranslateText"
        ]
        Resource = "*"
      },
      # AWS Comprehend - Emergency Sentiment & Urgency Extraction
      {
        Sid    = "ComprehendUrgencyAnalysis"
        Effect = "Allow"
        Action = [
          "comprehend:DetectSentiment",
          "comprehend:DetectKeyPhrases",
          "comprehend:DetectEntities"
        ]
        Resource = "*"
      },
      # CloudWatch Logs & Metrics
      {
        Sid    = "WorkerLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      },
      # SSM Parameter Store Secrets Read
      {
        Sid    = "SSMWorkerSecretsAccess"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "arn:aws:ssm:*:*:parameter/resqgrid/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attach_worker_policy" {
  role       = aws_iam_role.worker_role.name
  policy_arn = aws_iam_policy.worker_policy.arn
}

resource "aws_iam_role_policy_attachment" "attach_worker_ssm_core" {
  role       = aws_iam_role.worker_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "worker_profile" {
  name = "resqgrid-worker-profile-${var.environment}"
  role = aws_iam_role.worker_role.name
}

output "api_instance_profile_name" {
  value = aws_iam_instance_profile.api_profile.name
}

output "worker_instance_profile_name" {
  value = aws_iam_instance_profile.worker_profile.name
}

output "api_role_arn" {
  value = aws_iam_role.api_role.arn
}

output "worker_role_arn" {
  value = aws_iam_role.worker_role.arn
}

variable "environment" {
  type    = string
  default = "prod"
}

# 1. Dead-Letter Queue (DLQ)
resource "aws_sqs_queue" "incident_dlq" {
  name                      = "resqgrid-incident-events-dlq-${var.environment}"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name        = "resqgrid-incident-events-dlq"
    Environment = var.environment
  }
}

# 2. Main SQS Incident Event Queue with Redrive Policy
resource "aws_sqs_queue" "incident_queue" {
  name                      = "resqgrid-incident-events-${var.environment}"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 86400 # 1 day
  receive_wait_time_seconds = 20    # Enable long polling

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.incident_dlq.arn
    maxReceiveCount     = 3 # Move to DLQ after 3 failed worker attempts
  })

  tags = {
    Name        = "resqgrid-incident-events"
    Environment = var.environment
    Project     = "ResQGrid"
  }
}

# 3. Amazon SNS Escalation Topic
resource "aws_sns_topic" "incident_escalation" {
  name = "resqgrid-incident-escalation-${var.environment}"

  tags = {
    Name = "resqgrid-incident-escalation"
  }
}

# 4. Amazon SNS Resource Shortage Topic
resource "aws_sns_topic" "resource_shortage" {
  name = "resqgrid-resource-shortage-${var.environment}"

  tags = {
    Name = "resqgrid-resource-shortage"
  }
}

output "queue_url" {
  value = aws_sqs_queue.incident_queue.url
}

output "queue_arn" {
  value = aws_sqs_queue.incident_queue.arn
}

output "dlq_url" {
  value = aws_sqs_queue.incident_dlq.url
}

output "dlq_arn" {
  value = aws_sqs_queue.incident_dlq.arn
}

output "escalation_topic_arn" {
  value = aws_sns_topic.incident_escalation.arn
}

output "shortage_topic_arn" {
  value = aws_sns_topic.resource_shortage.arn
}


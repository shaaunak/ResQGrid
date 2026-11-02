variable "environment" {
  type    = string
  default = "prod"
}

variable "sqs_queue_name" {
  type = string
}

variable "sns_alarm_topic_arn" {
  type = string
}

# 1. CloudWatch Log Group with 7-Day Retention (Cost Optimized)
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/resqgrid/app-logs"
  retention_in_days = 7

  tags = {
    Environment = var.environment
    Project     = "ResQGrid"
  }
}

# 2. Mandatory Working CloudWatch Alarm: SQS Oldest Message Age Exceeds Threshold
resource "aws_cloudwatch_metric_alarm" "sqs_oldest_message_age" {
  alarm_name          = "ResQGrid-SQS-OldestMessageAge-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 120 # Seconds
  alarm_description   = "Alarm triggers when an unprocessed SQS message is older than 120s (indicating worker stall or queue backlog)."
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = var.sqs_queue_name
  }

  alarm_actions = [var.sns_alarm_topic_arn]
  ok_actions    = [var.sns_alarm_topic_arn]

  tags = {
    Name        = "resqgrid-sqs-age-alarm"
    Environment = var.environment
  }
}

output "log_group_name" {
  value = aws_cloudwatch_log_group.app_logs.name
}

output "alarm_arn" {
  value = aws_cloudwatch_metric_alarm.sqs_oldest_message_age.arn
}


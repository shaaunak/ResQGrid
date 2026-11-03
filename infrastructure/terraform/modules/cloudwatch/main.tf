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

variable "alb_arn_suffix" {
  type    = string
  default = ""
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

# 2. Alarm: SQS Oldest Message Age Exceeds Threshold (Worker stall/backlog)
resource "aws_cloudwatch_metric_alarm" "sqs_oldest_message_age" {
  alarm_name          = "ResQGrid-SQS-OldestMessageAge-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 120 # Seconds
  alarm_description   = "Triggers when an unprocessed SQS message is older than 120s (worker stall or queue backlog)."
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

# 3. Alarm: ALB 5xx Internal Server Error Rate
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "ResQGrid-ALB-HTTPCode-5XX-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Triggers if target group returns more than 5 5xx errors in 1 minute."
  treat_missing_data  = "notBreaching"

  dimensions = var.alb_arn_suffix != "" ? {
    LoadBalancer = var.alb_arn_suffix
  } : {}

  alarm_actions = [var.sns_alarm_topic_arn]

  tags = {
    Name        = "resqgrid-alb-5xx-alarm"
    Environment = var.environment
  }
}

# 4. Custom Alarm: Critical Relief Inventory Low Stock
resource "aws_cloudwatch_metric_alarm" "low_stock_alarm" {
  alarm_name          = "ResQGrid-Inventory-LowStock-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "DaysOfSupplyRemaining"
  namespace           = "ResQGrid/Operations"
  period              = 300
  statistic           = "Minimum"
  threshold           = 3.0 # Trigger when stock drops below 3 days of supply
  alarm_description   = "Triggers when depot inventory falls below safe operating buffer."
  treat_missing_data  = "notBreaching"

  alarm_actions = [var.sns_alarm_topic_arn]

  tags = {
    Name        = "resqgrid-low-stock-alarm"
    Environment = var.environment
  }
}

output "log_group_name" {
  value = aws_cloudwatch_log_group.app_logs.name
}

output "sqs_alarm_arn" {
  value = aws_cloudwatch_metric_alarm.sqs_oldest_message_age.arn
}

output "alb_5xx_alarm_arn" {
  value = aws_cloudwatch_metric_alarm.alb_5xx_errors.arn
}

output "low_stock_alarm_arn" {
  value = aws_cloudwatch_metric_alarm.low_stock_alarm.arn
}

variable "budget_amount" {
  type    = string
  default = "20.0"
}

variable "alert_emails" {
  type    = list(string)
  default = ["student-lead@resqgrid.org"]
}

# AWS Budgets Cost Cap & Email Alerts
resource "aws_budgets_budget" "monthly_cost" {
  name              = "resqgrid-monthly-budget"
  budget_type       = "COST"
  limit_amount      = var.budget_amount
  limit_unit        = "USD"
  time_period_start = "2026-01-01_00:00"
  time_unit         = "MONTHLY"

  # Alert 1: 50% Threshold
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 50
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.alert_emails
  }

  # Alert 2: 80% Threshold
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.alert_emails
  }

  # Alert 3: 100% Threshold (Forecasted)
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.alert_emails
  }
}

output "budget_name" {
  value = aws_budgets_budget.monthly_cost.name
}


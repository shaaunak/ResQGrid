variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "db_password" {
  type        = string
  description = "Database master password for initial bootstrap"
  sensitive   = true
  default     = "ResQGrid_Secure_RDS_Pass_2026!"
}

variable "budget_alert_emails" {
  type    = list(string)
  default = ["shaaunak@example.com"]
}


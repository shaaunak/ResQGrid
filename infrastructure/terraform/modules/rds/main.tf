variable "environment" {
  type    = string
  default = "prod"
}

variable "db_subnet_ids" {
  type = list(string)
}

variable "db_security_group_id" {
  type = string
}

variable "db_name" {
  type    = string
  default = "resqgrid_db"
}

variable "db_username" {
  type    = string
  default = "resqgrid_admin"
}

variable "db_password" {
  type      = string
  sensitive = true
}

# 1. DB Subnet Group across dual private subnets
resource "aws_db_subnet_group" "main" {
  name       = "resqgrid-db-subnet-group-${var.environment}"
  subnet_ids = var.db_subnet_ids

  tags = {
    Name = "resqgrid-db-subnet-group"
  }
}

# 2. Amazon RDS PostgreSQL Single-AZ db.t3.micro (Strict Cost Control)
resource "aws_db_instance" "postgres" {
  identifier        = "resqgrid-postgres-${var.environment}"
  engine            = "postgres"
  engine_version    = "16.1"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  max_allocated_storage = 50
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.db_security_group_id]

  multi_az            = false  # Single-AZ strictly required for cost optimization
  publicly_accessible = false  # Zero public accessibility: reachable only from App SG
  skip_final_snapshot = true

  backup_retention_period   = 7
  backup_window             = "02:00-03:00" # Automated nightly RDS snapshot
  maintenance_window        = "sun:04:00-sun:05:00"
  auto_minor_version_upgrade = true
  copy_tags_to_snapshot     = true

  tags = {
    Name        = "resqgrid-rds-postgres"
    Environment = var.environment
    Project     = "ResQGrid"
  }
}

output "endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "address" {
  value = aws_db_instance.postgres.address
}

output "port" {
  value = aws_db_instance.postgres.port
}

output "instance_id" {
  value = aws_db_instance.postgres.id
}

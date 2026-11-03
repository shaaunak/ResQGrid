variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "availability_zones" {
  type    = list(string)
  default = ["ap-south-1a", "ap-south-1b"]
}

# 1. Custom VPC (10.0.0.0/16)
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "resqgrid-vpc-${var.environment}"
    Environment = var.environment
    Project     = "ResQGrid"
  }
}

# 2. Internet Gateway for Public Subnets
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "resqgrid-igw-${var.environment}"
    Environment = var.environment
  }
}

# 3. Two Public Subnets (AZ A & B for ALB & EC2)
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = var.availability_zones[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "resqgrid-public-subnet-a"
    Tier = "Public"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = var.availability_zones[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "resqgrid-public-subnet-b"
    Tier = "Public"
  }
}

# 4. Two Private Subnets (AZ A & B - Strictly for RDS PostgreSQL, NO NAT Gateway)
resource "aws_subnet" "private_db_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.11.0/24"
  availability_zone       = var.availability_zones[0]
  map_public_ip_on_launch = false

  tags = {
    Name = "resqgrid-private-db-subnet-a"
    Tier = "Database"
  }
}

resource "aws_subnet" "private_db_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.12.0/24"
  availability_zone       = var.availability_zones[1]
  map_public_ip_on_launch = false

  tags = {
    Name = "resqgrid-private-db-subnet-b"
    Tier = "Database"
  }
}

# 5. S3 Gateway Endpoint (Zero Cost, No NAT Gateway Needed for S3 access from VPC)
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.environment == "prod" ? "ap-south-1" : "ap-south-1"}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = [
    aws_route_table.public.id,
    aws_route_table.private.id
  ]

  tags = {
    Name        = "resqgrid-s3-gateway-endpoint"
    Environment = var.environment
  }
}

# 6. Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name = "resqgrid-public-rt"
  }
}

# Private Route Table: Local VPC routing only. NO 0.0.0.0/0 NAT route!
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "resqgrid-private-rt"
  }
}

# 7. Route Table Associations
resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_db_a" {
  subnet_id      = aws_subnet.private_db_a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_db_b" {
  subnet_id      = aws_subnet.private_db_b.id
  route_table_id = aws_route_table.private.id
}

# 8. Strict Security Groups: ALB > App > RDS Only
resource "aws_security_group" "alb_sg" {
  name        = "resqgrid-alb-sg-${var.environment}"
  description = "Public ALB security group allowing HTTP/HTTPS ingress"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Public HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Public HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description     = "Traffic to EC2 App Instances only"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  tags = {
    Name = "resqgrid-alb-sg"
  }
}

resource "aws_security_group" "app_sg" {
  name        = "resqgrid-app-sg-${var.environment}"
  description = "Security group for EC2 application host - ingress only from ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "FastAPI HTTP from ALB only"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    description = "Outbound to Internet and AWS Services via IGW"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "resqgrid-app-sg"
  }
}

resource "aws_security_group" "db_sg" {
  name        = "resqgrid-db-sg-${var.environment}"
  description = "Private RDS PostgreSQL - ingress strictly from App SG only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL port 5432 from App Security Group Only"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  egress {
    description = "Outbound to VPC"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = {
    Name = "resqgrid-db-sg"
  }
}

output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

output "public_subnet_a_id" {
  value = aws_subnet.public_a.id
}

output "public_subnet_b_id" {
  value = aws_subnet.public_b.id
}

output "db_subnet_ids" {
  value = [aws_subnet.private_db_a.id, aws_subnet.private_db_b.id]
}

output "alb_security_group_id" {
  value = aws_security_group.alb_sg.id
}

output "app_security_group_id" {
  value = aws_security_group.app_sg.id
}

output "db_security_group_id" {
  value = aws_security_group.db_sg.id
}

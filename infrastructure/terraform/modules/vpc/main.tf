variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "availability_zones" {
  type    = list(string)
  default = ["ap-south-1a", "ap-south-1b"]
}

# 1. Custom VPC
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

# 2. Internet Gateway for Public Compute
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "resqgrid-igw-${var.environment}"
    Environment = var.environment
  }
}

# 3. Public Subnets (AZ A & B)
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.20.1.0/24"
  availability_zone       = var.availability_zones[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "resqgrid-public-subnet-a"
    Tier = "Public"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.20.2.0/24"
  availability_zone       = var.availability_zones[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "resqgrid-public-subnet-b"
    Tier = "Public"
  }
}

# 4. Private Database Subnets (AZ A & B - Required for RDS Subnet Group)
resource "aws_subnet" "private_db_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.20.11.0/24"
  availability_zone       = var.availability_zones[0]
  map_public_ip_on_launch = false

  tags = {
    Name = "resqgrid-private-db-subnet-a"
    Tier = "Database"
  }
}

resource "aws_subnet" "private_db_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.20.12.0/24"
  availability_zone       = var.availability_zones[1]
  map_public_ip_on_launch = false

  tags = {
    Name = "resqgrid-private-db-subnet-b"
    Tier = "Database"
  }
}

# 5. Route Tables
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

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "resqgrid-private-rt"
  }
}

# 6. Route Table Associations
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

# 7. Security Groups
resource "aws_security_group" "app_sg" {
  name        = "resqgrid-app-sg"
  description = "Security group for EC2 application host"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP Inbound"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS Inbound"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound HTTPS to AWS Services & Internet"
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
  name        = "resqgrid-db-sg"
  description = "Security group for private Amazon RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from EC2 App Security Group Only"
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

output "public_subnet_id" {
  value = aws_subnet.public_a.id
}

output "db_subnet_ids" {
  value = [aws_subnet.private_db_a.id, aws_subnet.private_db_b.id]
}

output "app_security_group_id" {
  value = aws_security_group.app_sg.id
}

output "db_security_group_id" {
  value = aws_security_group.db_sg.id
}


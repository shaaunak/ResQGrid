variable "environment" {
  type    = string
  default = "prod"
}

variable "subnet_id" {
  type = string
}

variable "security_group_id" {
  type = string
}

variable "instance_profile_name" {
  type = string
}

variable "instance_type" {
  type    = string
  default = "t3.small" # 2 vCPU, 2GB RAM
}

# 1. Latest Ubuntu 24.04 LTS AMI in Mumbai
data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-arm64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"] # Canonical
}

# 2. Automated UserData Boot Script
locals {
  user_data = <<-EOF
    #!/bin/bash
    set -e

    # Update packages
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg lsb-release

    # Install Docker & Docker Compose
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # Enable and start Docker service
    systemctl enable docker
    systemctl start docker

    # Clone ResQGrid repository and start application stack
    mkdir -p /opt/resqgrid
    cd /opt/resqgrid

    # In production deployment, docker compose pulls images from registry or builds on instance
    echo "ResQGrid EC2 Cloud Instance Provisioned Successfully" > /var/log/resqgrid_bootstrap.log
  EOF
}

# 3. Dedicated EC2 Instance
resource "aws_instance" "app_server" {
  ami                  = data.aws_ami.ubuntu.id
  instance_type        = var.instance_type
  subnet_id            = var.subnet_id
  vpc_security_group_ids = [var.security_group_id]
  iam_instance_profile = var.instance_profile_name

  associate_public_ip_address = true # Public IP for direct outbound HTTPS without expensive NAT Gateway

  root_block_device {
    volume_size           = 25
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  user_data = local.user_data

  tags = {
    Name        = "resqgrid-app-host-${var.environment}"
    Environment = var.environment
    Project     = "ResQGrid"
  }
}

output "instance_id" {
  value = aws_instance.app_server.id
}

output "public_ip" {
  value = aws_instance.app_server.public_ip
}


variable "environment" {
  type    = string
  default = "prod"
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "alb_security_group_id" {
  type = string
}

variable "app_security_group_id" {
  type = string
}

variable "instance_profile_name" {
  type = string
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

# 1. Application Load Balancer in Public Subnets
resource "aws_lb" "main" {
  name               = "resqgrid-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false

  tags = {
    Name        = "resqgrid-alb-${var.environment}"
    Environment = var.environment
  }
}

# 2. ALB Target Group for FastAPI (port 8000)
resource "aws_lb_target_group" "api" {
  name        = "resqgrid-tg-${var.environment}"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    enabled             = true
    path                = "/api/v1/health"
    port                = "8000"
    protocol            = "HTTP"
    interval            = 15
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }

  tags = {
    Name = "resqgrid-target-group"
  }
}

# 3. ALB HTTP Listener forwarding to Target Group
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

# 4. Canonical Ubuntu 24.04 LTS AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-arm64-server-*", "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"] # Canonical
}

# 5. Launch Template for EC2 instances
resource "aws_launch_template" "app" {
  name_prefix   = "resqgrid-lt-${var.environment}-"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.instance_type

  iam_instance_profile {
    name = var.instance_profile_name
  }

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [var.app_security_group_id]
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -e
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg lsb-release
    
    # Install Docker & Compose
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker

    echo "ResQGrid Container Host Launched in ASG" > /var/log/resqgrid_asg_boot.log
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "resqgrid-asg-node-${var.environment}"
      Environment = var.environment
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# 6. Auto Scaling Group (Min 1, Max 2 - strictly cost capped)
resource "aws_autoscaling_group" "app_asg" {
  name_prefix         = "resqgrid-asg-${var.environment}-"
  vpc_zone_identifier = var.public_subnet_ids
  target_group_arns   = [aws_lb_target_group.api.arn]

  min_size         = 1
  max_size         = 2
  desired_capacity = 1

  health_check_type         = "ELB"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "resqgrid-app-instance"
    propagate_at_launch = true
  }
  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# 7. ASG Dynamic Scale-Out Policy
resource "aws_autoscaling_policy" "scale_out" {
  name                   = "resqgrid-asg-scale-out"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 180
  autoscaling_group_name = aws_autoscaling_group.app_asg.name
}

# Scale-In Policy
resource "aws_autoscaling_policy" "scale_in" {
  name                   = "resqgrid-asg-scale-in"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app_asg.name
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "alb_arn" {
  value = aws_lb.main.arn
}

output "target_group_arn" {
  value = aws_lb_target_group.api.arn
}

output "asg_name" {
  value = aws_autoscaling_group.app_asg.name
}

output "scale_out_policy_arn" {
  value = aws_autoscaling_policy.scale_out.arn
}


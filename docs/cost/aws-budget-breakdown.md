# ResQGrid — AWS Cost Analysis & Budget Breakdown (Mumbai ap-south-1)

This document provides a realistic, transparent cost estimation for deploying and evaluating ResQGrid in AWS Region `ap-south-1` (Mumbai, India).

---

## 1. Hourly vs. Demonstration vs. Continuous Monthly Cost

| AWS Resource | Configuration Specification | Hourly Rate (USD) | 40-Hour Evaluation Run (USD) | 730-Hour Continuous Month (USD) | Free Tier Eligibility |
|---|---|---|---|---|---|
| **Amazon EC2** | `t3.small` (2 vCPU, 2GB RAM, Ubuntu 24.04 ARM64/x86_64) | \$0.0232 | \$0.93 | \$16.94 | `t2.micro` or `t3.micro` eligible (750 hrs/mo first 12 months) |
| **Public IPv4 Address** | In-use public IPv4 address on EC2 host | \$0.0050 | \$0.20 | \$3.65 | Included in AWS Free Tier for EC2 until 750 hrs/mo |
| **Amazon RDS PostgreSQL** | `db.t4g.micro` (Single-AZ, 20GB gp3 storage) | \$0.0180 | \$0.72 | \$13.14 | `db.t3.micro`/`db.t4g.micro` eligible for 750 hrs/mo (first 12 mos) |
| **Amazon S3** | Standard Storage (< 1 GB evidence images) | < \$0.0001 | < \$0.01 | \$0.03 | 5 GB standard storage included in Free Tier |
| **Amazon SQS** | Standard Queue + DLQ (< 50,000 requests/mo) | < \$0.0001 | < \$0.01 | < \$0.01 | 1,000,000 requests/mo permanently free |
| **Amazon SNS** | Notification Topic (< 1,000 publications) | < \$0.0001 | < \$0.01 | < \$0.01 | 1,000,000 publishes/mo permanently free |
| **Amazon CloudWatch** | 1 Log Group (7-day retention) + 1 SQS metric alarm | \$0.0001 | \$0.01 | \$0.15 | 10 custom alarms & 5GB logs included in Free Tier |
| **AWS Systems Manager** | Parameter Store (Standard parameters) | \$0.0000 | \$0.00 | \$0.00 | Standard parameters permanently free |
| **AWS Budgets** | 1 Monthly Cost Budget with 3 email triggers | \$0.0000 | \$0.00 | \$0.00 | First 2 budgets permanently free |
| **Total Estimated Cost** | — | **~\$0.0463 / hr** | **~\$1.87 (Evaluation)** | **~\$33.77 / month** | **~\$3.65 / mo if Free Tier eligible** |

---

## 2. Unnecessary High-Cost Infrastructure Avoided

To satisfy strict academic budget constraints and faculty requirements, the following expensive resources were deliberately excluded:

1. **AWS NAT Gateway (\$0.045/hr + \$0.045/GB transfer = ~\$32.85/month fixed)**:
   - *Design Alternative*: The EC2 host resides in a public subnet with direct outbound HTTPS routes to AWS public service endpoints (S3, SQS, SNS, SSM, CloudWatch) through the Internet Gateway. The private RDS PostgreSQL database resides in private subnets with zero external ingress/egress.

2. **Multi-AZ RDS PostgreSQL (+100% database cost = ~\$15-30/month)**:
   - *Design Alternative*: Deployed Single-AZ RDS. AWS still mandates a DB Subnet Group spanning at least 2 Availability Zones (`ap-south-1a` and `ap-south-1b`), which our Terraform VPC module provisions without paying for redundant standby instances.

3. **Application Load Balancer (ALB) (\$0.0225/hr + LCU charges = ~\$16.42/month)**:
   - *Design Alternative*: Nginx runs inside the EC2 Docker stack as a direct high-performance reverse proxy handling static React assets and routing `/api/` traffic to FastAPI.

4. **Continuous Cloud Infrastructure Retention**:
   - Automated cleanup scripts (`scripts/cleanup/destroy_cloud.sh`) teardown chargeable compute and storage immediately after evaluations.

---

## 3. AWS Budgets Configuration

Terraform provisions `aws_budgets_budget.monthly_cost` with:
- **Monthly Limit**: \$20.00 USD
- **Tier 1 Alert**: 50% actual spend (\$10.00)
- **Tier 2 Alert**: 80% actual spend (\$16.00)
- **Tier 3 Alert**: 100% forecasted spend (\$20.00)
- Delivered via Amazon SNS / direct email.


# ResQGrid — Cloud Architecture & AWS Infrastructure Design

This document details the complete cloud architecture of ResQGrid deployed in the **AWS Mumbai (`ap-south-1`)** region.

---

## 1. High-Level Architectural Diagram

```mermaid
graph TD
    Client["Citizens / Operators / Responders<br/>(HTTPS Browser Client)"]
    IGW["Internet Gateway<br/>(Custom VPC: 10.20.0.0/16)"]

    subgraph VPC ["Custom Amazon VPC (10.20.0.0/16)"]
        subgraph PublicSubnet ["Public Subnet A (10.20.1.0/24)"]
            EC2Host["Amazon EC2 Instance (t3.small)<br/>- Nginx Reverse Proxy (Port 80/443)<br/>- React SPA Dashboard<br/>- FastAPI REST Application (Port 8000)<br/>- SQS / Outbox Event Worker"]
        end

        subgraph PrivateDBSubnets ["Private Database Subnets (Dual AZ)"]
            RDSPostgres["Amazon RDS PostgreSQL 16<br/>(db.t4g.micro, Single-AZ)<br/>Private TCP 5432 Only<br/>Encrypted Storage (20GB gp3)"]
        end
    end

    subgraph AWSServices ["AWS Managed Cloud Services (ap-south-1)"]
        S3Bucket["Amazon S3 Private Bucket<br/>- Public Access Blocked<br/>- AES-256 SSE<br/>- Presigned Upload/Download URLs"]
        SQSQueue["Amazon SQS Queue<br/>- MaxReceiveCount = 3<br/>- Long Polling (20s)"]
        DLQ["Amazon SQS Dead-Letter Queue (DLQ)"]
        SNSTopics["Amazon SNS Topics<br/>- Incident Escalation<br/>- Resource Shortage"]
        SSM["AWS Systems Manager<br/>Parameter Store (SecureString)"]
        CloudWatch["Amazon CloudWatch<br/>- Logs: /resqgrid/app-logs (7-Day Retention)<br/>- Alarm: ApproximateAgeOfOldestMessage > 120s"]
        Budgets["AWS Budgets<br/>- $20.00 Monthly Limit<br/>- 50%, 80%, 100% Alerts"]
    end

    Client -->|HTTPS| IGW
    IGW --> EC2Host
    EC2Host -->|Private TCP 5432| RDSPostgres
    EC2Host -->|Presigned Media PUT/GET| S3Bucket
    EC2Host -->|Publish Events / SQS Polling| SQSQueue
    SQSQueue -->|Exceeds 3 Retries| DLQ
    EC2Host -->|Emergency Alerts| SNSTopics
    EC2Host -->|Load Secrets on Boot| SSM
    EC2Host -->|Application Logs & Metrics| CloudWatch
    CloudWatch -->|Trigger Alarm| SNSTopics
    Budgets -.->|Cost Forecast Alerts| Client
```

---

## 2. Six Architectural Pillars Alignment

| Cloud Pillar | Service Selection & Configuration | Implementation Detail & Architectural Justification |
|---|---|---|
| **Compute** | Amazon EC2 (`t3.small`, Ubuntu 24.04 LTS, ARM64/x86_64) | Hosts containerized Nginx, React static assets, FastAPI backend, and SQS event worker via Docker Compose. Eliminates serverless cold starts for real-time operational mapping. |
| **Networking** | Custom VPC (`10.20.0.0/16`), 2 Public Subnets, 2 Private DB Subnets, IGW | Dual Availability Zone coverage (`ap-south-1a`, `ap-south-1b`). RDS sits isolated in private subnets with zero public IP addresses. NAT Gateway intentionally excluded to minimize unneeded cost ($32+/mo saved). |
| **Database** | Amazon RDS PostgreSQL 16 (`db.t4g.micro`, Single-AZ) | Normalized relational schema (18 tables), ACID transactions (`SELECT FOR UPDATE` atomic stock reservation), automated daily backups, 7-day retention, encrypted storage at rest. |
| **Storage** | Amazon S3 (Private Application Bucket) | Public access strictly blocked (all 4 flags). Server-side encryption with AES-256. Frontend generates temporary presigned URLs; object keys and metadata indexed in PostgreSQL. |
| **Security** | IAM Instance Profile, Systems Manager Parameter Store | Zero hardcoded credentials in codebase or git. EC2 assumes IAM role with least-privilege policies. Database URLs and JWT secrets stored in Parameter Store `SecureString`. |
| **Observability** | Amazon CloudWatch, Amazon SNS, AWS Budgets | Application JSON logs sent to `/resqgrid/app-logs`. Working metric alarm on `ApproximateAgeOfOldestMessage > 120s` triggering SNS notification. AWS Budgets tracks spending against a strict $20.00 monthly cap. |

---

## 3. Network Isolation & Security Group Peering

```mermaid
graph LR
    Internet["Public Internet"] -->|Port 80/443| AppSG["App Security Group<br/>(Inbound: 80, 443)<br/>(Outbound: 0.0.0.0/0)"]
    AppSG -->|Port 5432 Only| DBSG["Database Security Group<br/>(Inbound: 5432 from AppSG)<br/>(Inbound: No Public Access)"]
```


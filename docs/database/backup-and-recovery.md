# ResQGrid Database Backup & Disaster Recovery Runbook

## 1. Reliability Objectives

| Metric | Target Objective | Technical Justification |
|---|---|---|
| **Recovery Point Objective (RPO)** | **$\le$ 5 Minutes** | Continuous PostgreSQL Write-Ahead Log (WAL) archiving to S3 enables sub-5-minute point-in-time restoration. |
| **Recovery Time Objective (RTO)** | **$\le$ 30 Minutes** | RDS automated snapshot restoration takes ~15–20 minutes to provision a replacement `db.t4g.micro` instance in private database subnets. |

---

## 2. Backup Strategy Architecture

### 2.1 Automated RDS Snapshots
- **Frequency**: Daily full snapshot during low-traffic window (`03:00 UTC / 08:30 IST`).
- **Retention Period**: 7 days (configured in `infrastructure/terraform/modules/rds/main.tf` via `backup_retention_period = 7`).
- **Storage Tier**: RDS automated snapshot storage (first 20 GB included free; additional storage billed at \$0.095/GB-month in `ap-south-1`).

### 2.2 Continuous Point-in-Time Recovery (PITR)
- **Mechanism**: PostgreSQL writes transaction logs (WAL) to local storage and continuously flushes them to Amazon S3 every 5 minutes.
- **Granularity**: Any second within the 7-day retention window down to the latest restorable transaction timestamp.

### 2.3 Pre-Deployment Manual Snapshots
Prior to schema migrations (`alembic upgrade head`) or significant cloud infrastructure modifications, operators trigger an out-of-band manual snapshot. Manual snapshots do not expire automatically and persist until explicitly deleted.

---

## 3. Operational CLI Commands

### 3.1 Create On-Demand Pre-Migration Snapshot
```bash
# Capture immediate consistent snapshot prior to deployment
aws rds create-db-snapshot \
  --db-instance-identifier resqgrid-db-prod \
  --db-snapshot-identifier resqgrid-pre-migration-$(date +%Y%m%d-%H%M) \
  --region ap-south-1
```

### 3.2 List Available Snapshots
```bash
aws rds describe-db-snapshots \
  --db-instance-identifier resqgrid-db-prod \
  --query "DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime,Status]" \
  --output table \
  --region ap-south-1
```

### 3.3 Check Latest Restorable Time (PITR Boundary)
```bash
aws rds describe-db-instances \
  --db-instance-identifier resqgrid-db-prod \
  --query "DBInstances[0].LatestRestorableTime" \
  --output text \
  --region ap-south-1
```

---

## 4. Step-by-Step Disaster Recovery Runbook

In the event of database corruption, accidental table drop, or AWS AZ hardware outage:

### Step 1: Declare Incident & Stop Traffic
Prevent inconsistent client writes by placing the API in maintenance mode or pausing the transactional outbox worker:
```bash
# Pause background queue processing
curl -X POST http://127.0.0.1:8000/api/v1/admin/worker/pause \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Step 2: Restore to New RDS Instance (PITR)
Restore database to 5 minutes prior to the catastrophic failure event:
```bash
# Restore from continuous WAL archive to target timestamp (UTC)
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier resqgrid-db-prod \
  --target-db-instance-identifier resqgrid-db-prod-restored \
  --restore-time "2026-11-02T14:30:00.000Z" \
  --db-subnet-group-name resqgrid-db-subnets-prod \
  --vpc-security-group-ids sg-0a1b2c3d4e5f6g7h8 \
  --db-instance-class db.t4g.micro \
  --region ap-south-1
```

### Step 3: Wait for Restored Instance Readiness
```bash
aws rds wait db-instance-available \
  --db-instance-identifier resqgrid-db-prod-restored \
  --region ap-south-1
```

### Step 4: Update SSM Parameter Store Database Secret
Point the application to the newly restored endpoint without requiring code changes or server rebuilds:
```bash
NEW_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier resqgrid-db-prod-restored \
  --query "DBInstances[0].Endpoint.Address" \
  --output text \
  --region ap-south-1)

aws ssm put-parameter \
  --name "/resqgrid/prod/database_url" \
  --value "postgresql+asyncpg://resqgrid_admin:${DB_PASSWORD}@${NEW_ENDPOINT}:5432/resqgrid_db" \
  --type SecureString \
  --overwrite \
  --region ap-south-1
```

### Step 5: Restart Application & Verify Integrity
```bash
# Restart EC2 container service to pull updated SSM parameter
docker restart resqgrid-api resqgrid-worker

# Run health check
curl -f http://127.0.0.1:8000/api/v1/health

# Resume worker processing
curl -X POST http://127.0.0.1:8000/api/v1/admin/worker/resume \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## 5. Cost Analysis & Budget Safeguards

1. **Free Tier Allocation**:
   - RDS Single-AZ `db.t4g.micro` includes 20 GB of General Purpose (gp3) SSD storage.
   - Backup storage equal to 100% of provisioned storage (20 GB) is provided free of charge.
2. **Excess Backup Storage Cost**:
   - 7-day retention of incremental WAL changes generates ~2–4 GB of changelog per week under demo workloads.
   - Rate: \$0.095 per GB-month.
   - Total backup overhead: **\$0.20 – \$0.40 per month** (well within the project's \$20/month AWS budget cap).


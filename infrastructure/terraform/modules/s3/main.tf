variable "environment" {
  type    = string
  default = "prod"
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# 1. Private S3 Incident Evidence Bucket
resource "aws_s3_bucket" "evidence_bucket" {
  bucket        = "resqgrid-evidence-${var.environment}-${random_id.bucket_suffix.hex}"
  force_destroy = false

  tags = {
    Name        = "resqgrid-evidence"
    Environment = var.environment
    Project     = "ResQGrid"
  }
}

resource "aws_s3_bucket_public_access_block" "evidence_public_block" {
  bucket = aws_s3_bucket.evidence_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "evidence_sse" {
  bucket = aws_s3_bucket.evidence_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 2. Private S3 Reports & Situation Briefs Bucket
resource "aws_s3_bucket" "reports_bucket" {
  bucket        = "resqgrid-reports-${var.environment}-${random_id.bucket_suffix.hex}"
  force_destroy = false

  tags = {
    Name        = "resqgrid-reports"
    Environment = var.environment
    Project     = "ResQGrid"
  }
}

resource "aws_s3_bucket_public_access_block" "reports_public_block" {
  bucket = aws_s3_bucket.reports_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "reports_sse" {
  bucket = aws_s3_bucket.reports_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 3. Private S3 Database Backups Bucket (Nightly pg_dump storage)
resource "aws_s3_bucket" "backups_bucket" {
  bucket        = "resqgrid-backups-${var.environment}-${random_id.bucket_suffix.hex}"
  force_destroy = false

  tags = {
    Name        = "resqgrid-backups"
    Environment = var.environment
    Project     = "ResQGrid"
  }
}

resource "aws_s3_bucket_public_access_block" "backups_public_block" {
  bucket = aws_s3_bucket.backups_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups_sse" {
  bucket = aws_s3_bucket.backups_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle rule for automatic cost cleanup of backups older than 30 days
resource "aws_s3_bucket_lifecycle_configuration" "backups_cleanup" {
  bucket = aws_s3_bucket.backups_bucket.id

  rule {
    id     = "expire-old-backups"
    status = "Enabled"

    filter {}

    expiration {
      days = 30
    }
  }
}

output "evidence_bucket_name" {
  value = aws_s3_bucket.evidence_bucket.id
}

output "evidence_bucket_arn" {
  value = aws_s3_bucket.evidence_bucket.arn
}

output "reports_bucket_name" {
  value = aws_s3_bucket.reports_bucket.id
}

output "reports_bucket_arn" {
  value = aws_s3_bucket.reports_bucket.arn
}

output "backups_bucket_name" {
  value = aws_s3_bucket.backups_bucket.id
}

output "backups_bucket_arn" {
  value = aws_s3_bucket.backups_bucket.arn
}

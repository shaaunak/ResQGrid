variable "environment" {
  type    = string
  default = "prod"
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# 1. Private S3 Application Bucket
resource "aws_s3_bucket" "evidence_bucket" {
  bucket        = "resqgrid-evidence-${var.environment}-${random_id.bucket_suffix.hex}"
  force_destroy = false

  tags = {
    Name        = "resqgrid-evidence"
    Environment = var.environment
    Project     = "ResQGrid"
  }
}

# 2. Block Public Access (All 4 settings enabled)
resource "aws_s3_bucket_public_access_block" "block_public" {
  bucket = aws_s3_bucket.evidence_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 3. Server-Side Encryption (AES256)
resource "aws_s3_bucket_server_side_encryption_configuration" "sse" {
  bucket = aws_s3_bucket.evidence_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 4. Lifecycle rule for automatic cost cleanup of temporary simulation files
resource "aws_s3_bucket_lifecycle_configuration" "cleanup" {
  bucket = aws_s3_bucket.evidence_bucket.id

  rule {
    id     = "expire-simulated-evidence"
    status = "Enabled"

    filter {
      prefix = "simulation/"
    }

    expiration {
      days = 30
    }
  }
}

output "bucket_name" {
  value = aws_s3_bucket.evidence_bucket.id
}

output "bucket_arn" {
  value = aws_s3_bucket.evidence_bucket.arn
}


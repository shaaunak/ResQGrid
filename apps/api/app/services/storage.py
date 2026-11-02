import os
import uuid
from typing import Dict, Optional, Tuple
import boto3
from botocore.config import Config
from app.core.config import settings


class StorageService:
    """Storage service supporting both Amazon S3 (production) and local storage (testing/offline)."""

    def __init__(self):
        self.backend = settings.STORAGE_BACKEND
        self.bucket = settings.S3_BUCKET_NAME
        self.region = settings.AWS_REGION
        self.local_dir = os.path.abspath(settings.LOCAL_STORAGE_DIR)

        if self.backend == "local":
            os.makedirs(self.local_dir, exist_ok=True)
            self.s3_client = None
        else:
            # S3 client using instance profile or environment credentials
            self.s3_client = boto3.client(
                "s3",
                region_name=self.region,
                config=Config(signature_version="s3v4")
            )

    def generate_upload_url(
        self,
        file_name: str,
        mime_type: str,
        prefix: str = "evidence"
    ) -> Tuple[str, str, Optional[str]]:
        """Generate storage key and either an S3 presigned PUT URL or local upload path."""
        ext = os.path.splitext(file_name)[1]
        unique_key = f"{prefix}/{uuid.uuid4().hex}{ext}"

        if self.backend == "s3" and self.s3_client:
            try:
                presigned_url = self.s3_client.generate_presigned_url(
                    ClientMethod="put_object",
                    Params={
                        "Bucket": self.bucket,
                        "Key": unique_key,
                        "ContentType": mime_type,
                    },
                    ExpiresIn=settings.S3_PRESIGNED_URL_EXPIRATION_SECONDS,
                )
                return unique_key, presigned_url, None
            except Exception as e:
                # Fallback to local if AWS credentials not present
                print(f"Warning: S3 Presigned URL generation failed ({e}), falling back to local backend.")

        # Local storage direct path
        local_upload_url = f"/api/v1/evidence/upload/{unique_key}"
        return unique_key, local_upload_url, None

    def generate_download_url(self, s3_key: str) -> str:
        """Generate presigned GET URL for S3 or local download endpoint."""
        if self.backend == "s3" and self.s3_client:
            try:
                return self.s3_client.generate_presigned_url(
                    ClientMethod="get_object",
                    Params={
                        "Bucket": self.bucket,
                        "Key": s3_key,
                    },
                    ExpiresIn=settings.S3_PRESIGNED_URL_EXPIRATION_SECONDS,
                )
            except Exception:
                pass

        return f"/api/v1/evidence/file/{s3_key}"

    def save_local_file(self, s3_key: str, file_bytes: bytes) -> str:
        """Save file bytes to local disk when using local storage backend."""
        destination = os.path.join(self.local_dir, s3_key)
        os.makedirs(os.path.dirname(destination), exist_ok=True)
        with open(destination, "wb") as f:
            f.write(file_bytes)
        return destination

    def get_local_file(self, s3_key: str) -> Optional[str]:
        """Return absolute path to local file if it exists."""
        destination = os.path.join(self.local_dir, s3_key)
        if os.path.exists(destination):
            return destination
        return None


storage_service = StorageService()


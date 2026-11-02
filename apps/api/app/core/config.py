import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    APP_NAME: str = "ResQGrid"
    API_PORT: int = 8000
    WEB_PORT: int = 5173

    # Security & Auth
    JWT_SECRET_KEY: str = "dev_secret_key_change_in_production_32_characters_minimum_entropy"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./resqgrid.db"
    DATABASE_SYNC_URL: str = "sqlite:///./resqgrid.db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # Storage (local vs s3)
    STORAGE_BACKEND: str = "local"  # "local" or "s3"
    LOCAL_STORAGE_DIR: str = "./uploads"
    S3_BUCKET_NAME: str = "resqgrid-evidence-ap-south-1-prod"
    S3_PRESIGNED_URL_EXPIRATION_SECONDS: int = 900

    # Queues & Events (outbox vs sqs)
    QUEUE_BACKEND: str = "outbox"  # "outbox", "sqs", or "memory"
    SQS_QUEUE_URL: str = ""
    SQS_DLQ_URL: str = ""
    SQS_WAIT_TIME_SECONDS: int = 20
    SQS_MAX_MESSAGES: int = 10

    # Notifications (database vs sns)
    NOTIFICATION_BACKEND: str = "database"  # "database" or "sns"
    SNS_INCIDENT_ESCALATION_TOPIC_ARN: str = ""
    SNS_RESOURCE_SHORTAGE_TOPIC_ARN: str = ""

    # CloudWatch
    AWS_REGION: str = "ap-south-1"
    CLOUDWATCH_NAMESPACE: str = "ResQGrid/Operations"
    CLOUDWATCH_METRICS_ENABLED: bool = False

    # Simulation defaults for Mumbai
    DEFAULT_SIMULATION_REGION: str = "Mumbai"
    DEFAULT_SIMULATION_LAT: float = 19.0760
    DEFAULT_SIMULATION_LON: float = 72.8777

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()


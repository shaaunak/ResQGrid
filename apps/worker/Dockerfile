FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY apps/worker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/worker /app/apps/worker
COPY apps/api /app/apps/api
COPY scripts /app/scripts

ENV PYTHONPATH=/app/apps/api:/app/apps/worker:/app

CMD ["python", "apps/worker/app/worker.py"]


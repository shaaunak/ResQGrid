#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " Starting ResQGrid Local Stack via Docker Compose"
echo "=========================================================="

# Build and start services in background
docker compose up -d --build

echo "Waiting for PostgreSQL and API services to pass health checks..."
sleep 5

# Run database migrations
docker compose exec api alembic upgrade head

# Seed initial demonstration data
docker compose exec api python scripts/seed/seed_data.py

echo "=========================================================="
echo " ResQGrid Stack Ready!"
echo " Web Application : http://localhost:5173"
echo " API Docs        : http://localhost:8000/docs"
echo " Health Status   : http://localhost:8000/api/v1/health"
echo "=========================================================="


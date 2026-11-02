#!/usr/bin/env bash
set -e

echo "Stopping ResQGrid Docker Compose stack and cleaning volumes..."
docker compose down -v --remove-orphans

echo "Cleaning local upload storage and test database cache..."
rm -rf uploads/ resqgrid.db

echo "ResQGrid cleanup completed cleanly."


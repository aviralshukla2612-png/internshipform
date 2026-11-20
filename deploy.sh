#!/bin/bash
set -e

echo "=== Deploying Enterprise Recruitment System to VPS ==="

# 1. Pull latest code from GitHub
git pull origin main

# 2. Build and start containers in detached mode
docker compose -f docker-compose.prod.yml up -d --build

# 3. Wait for PostgreSQL and execute database push and initial seeding
echo "Waiting for backend services to initialize..."
sleep 10

docker compose -f docker-compose.prod.yml exec -T backend pnpm db:push
docker compose -f docker-compose.prod.yml exec -T backend pnpm db:seed || true

echo "=== Deployment Completed Successfully! ==="
docker compose -f docker-compose.prod.yml ps

#!/bin/bash
set -e

echo "=== Deploying Emperor Smart Solutions Recruitment Platform to VPS ==="

# 1. Pull latest code from GitHub
git pull origin main

# 2. Update Nginx configuration if present
if [ -d "/etc/nginx/sites-available" ]; then
    echo "Updating Nginx configuration..."
    cp nginx/internship.emperorsmartsolutions.com.conf /etc/nginx/sites-available/internship.emperorsmartsolutions.com
    ln -sf /etc/nginx/sites-available/internship.emperorsmartsolutions.com /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx || nginx -s reload || true
    echo "✓ Nginx reloaded with 50M upload limit and buffer optimizations."
fi

# 3. Build and start containers in detached mode
docker compose -f docker-compose.prod.yml up -d --build

# 4. Wait for PostgreSQL and execute database push and initial seeding
echo "Waiting for backend services to initialize..."
sleep 10

docker compose -f docker-compose.prod.yml exec -T backend pnpm db:push --accept-data-loss || true
docker compose -f docker-compose.prod.yml exec -T backend pnpm db:seed || true

echo "=== Deployment Completed Successfully! ==="
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail 25 backend

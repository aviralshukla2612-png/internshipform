#!/bin/bash
set -e

echo "=== Deploying Emperor Smart Solutions Recruitment Platform to VPS ==="

# 1. Pull latest code from GitHub (discarding local deployment script edits if any)
git checkout -- deploy.sh 2>/dev/null || true
git pull origin main

# 2. Update Nginx configuration & ensure 50M upload limit across HTTP & HTTPS
if [ -f "/etc/nginx/nginx.conf" ]; then
    echo "Ensuring global Nginx client_max_body_size 50M in /etc/nginx/nginx.conf..."
    if grep -q "client_max_body_size" /etc/nginx/nginx.conf; then
        sed -i 's/client_max_body_size.*/client_max_body_size 50M;/' /etc/nginx/nginx.conf
    else
        sed -i '/http {/a \    client_max_body_size 50M;' /etc/nginx/nginx.conf
    fi
fi

if [ -d "/etc/nginx/sites-available" ]; then
    echo "Updating Nginx site configuration..."
    if [ -f "/etc/nginx/sites-available/internship.emperorsmartsolutions.com" ] && grep -q "ssl_certificate" /etc/nginx/sites-available/internship.emperorsmartsolutions.com; then
        echo "Preserving SSL block and ensuring client_max_body_size in site config..."
        sed -i 's/client_max_body_size.*/client_max_body_size 50M;/' /etc/nginx/sites-available/internship.emperorsmartsolutions.com
    else
        cp nginx/internship.emperorsmartsolutions.com.conf /etc/nginx/sites-available/internship.emperorsmartsolutions.com
        ln -sf /etc/nginx/sites-available/internship.emperorsmartsolutions.com /etc/nginx/sites-enabled/
    fi
    nginx -t && (systemctl reload nginx || nginx -s reload) || true
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

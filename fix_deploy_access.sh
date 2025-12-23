#!/bin/bash

# ==========================================
# 11Flow Access Fix & Deployment Script
# ==========================================
# Usage: sudo ./fix_deploy_access.sh
# 
# This script will:
# 1. Auto-detect the correct SSL certificate path
# 2. Re-generate Nginx config with Supabase Proxy & WebSocket support
# 3. Restart Nginx and verify system status
# ==========================================

echo "=== Starting 11Flow Access Fix ==="
echo "Time: $(date)"

# --- 1. Detect SSL Certificate Path ---
echo -e "\n>> Step 1: Detecting SSL Certificate..."

DOMAIN="lunyee.cn"
SSL_BASE_PATH="/etc/letsencrypt/live"
SSL_CERT_PATH=""
SSL_KEY_PATH=""

# Check possible certificate paths (standard, -0001, etc.)
possible_paths=(
    "$SSL_BASE_PATH/$DOMAIN-0001"
    "$SSL_BASE_PATH/$DOMAIN"
)

for path in "${possible_paths[@]}"; do
    if [ -f "$path/fullchain.pem" ] && [ -f "$path/privkey.pem" ]; then
        SSL_CERT_PATH="$path/fullchain.pem"
        SSL_KEY_PATH="$path/privkey.pem"
        echo "✅ Found valid certificate at: $path"
        break
    fi
done

if [ -z "$SSL_CERT_PATH" ]; then
    echo "❌ Error: No valid SSL certificate found for $DOMAIN in $SSL_BASE_PATH"
    echo "   Please ensure Certbot ran successfully."
    exit 1
fi

# --- 2. Backup Existing Config ---
echo -e "\n>> Step 2: Backing up Nginx config..."
if [ -f /etc/nginx/sites-enabled/11flow ]; then
    cp /etc/nginx/sites-enabled/11flow /etc/nginx/sites-enabled/11flow.backup.$(date +%s)
    echo "   Backup created."
fi

# --- 3. Write New Nginx Config ---
echo -e "\n>> Step 3: Generating new Nginx configuration..."

cat > /etc/nginx/sites-available/11flow <<EOF
map \$http_upgrade \$connection_upgrade { default upgrade; '' close; }

server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    # Redirect HTTP to HTTPS
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL Certificates (Auto-Detected)
    ssl_certificate $SSL_CERT_PATH;
    ssl_certificate_key $SSL_KEY_PATH;
    
    # SSL Best Practices (from options-ssl-nginx.conf if available, else standard)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Buffer Settings
    client_header_buffer_size 64k;
    large_client_header_buffers 4 64k;
    client_max_body_size 50M;

    # --- 1. WebSocket Proxy ---
    location /api/ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400s; 
        proxy_send_timeout 86400s;
    }

    # --- 2. Backend API Proxy (Direct) ---
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s; # Common for long-running AI generation
        proxy_connect_timeout 300s;
    }

    # --- 3. Supabase Proxy (Critical for Auth) ---
    location /supabase-proxy/ {
        rewrite ^/supabase-proxy/(.*) /\$1 break;
        proxy_pass https://bamcwwtwtvxjjcdfbmdr.supabase.co;
        proxy_ssl_server_name on;
        proxy_set_header Host bamcwwtwtvxjjcdfbmdr.supabase.co;
        proxy_set_header Authorization \$http_authorization;
        proxy_set_header apikey \$http_apikey;
        proxy_set_header Content-Type \$http_content_type;
        proxy_set_header Range \$http_range;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_buffering off;
        proxy_read_timeout 86400s;
        gzip on;
        gzip_types application/json;
    }

    # --- 4. Frontend (Next.js) ---
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
        proxy_cache_bypass \$http_upgrade;
        
        # Buffers for large headers (e.g. huge auth tokens)
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
}
EOF

# Link if not exists
if [ ! -L /etc/nginx/sites-enabled/11flow ]; then
    ln -s /etc/nginx/sites-available/11flow /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
fi

# --- 4. Verify & Reload ---
echo -e "\n>> Step 4: Verifying Nginx setup..."
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Nginx Config Test Failed! Restoring backup..."
    cp /etc/nginx/sites-enabled/11flow.backup.* /etc/nginx/sites-enabled/11flow 2>/dev/null
    exit 1
fi

echo "   Config valid. Reloading Nginx..."
systemctl reload nginx

# --- 5. Diagnostics ---
echo -e "\n>> Step 5: System Diagnostics"

check_port() {
    PORT=$1
    NAME=$2
    if lsof -i :$PORT > /dev/null; then
        echo "✅ $NAME is running on port $PORT"
    else
        echo "⚠️  $NAME is NOT running on port $PORT. Trying to restart..."
        pm2 restart $NAME 2>/dev/null || echo "   Could not auto-restart $NAME via PM2"
    fi
}

# Check Backend
check_port 8000 "backend"

# Check Frontend
check_port 3000 "frontend"

echo -e "\n=== ✅ Fix Applied Successfully ==="
echo "Please visit: https://$DOMAIN"

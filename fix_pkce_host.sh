#!/bin/bash

# Fix PKCE Host Mismatch

# 1. Update Nginx Config to ensure correct Host headers
cat > /etc/nginx/sites-available/11flow << 'EOF'
map $http_upgrade $connection_upgrade { default upgrade; '' close; }

server {
    server_name lunyee.cn www.lunyee.cn;
    client_header_buffer_size 64k;
    large_client_header_buffers 4 64k;

    # 1. WebSocket
    location /api/ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
    }

    # 2. General API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }

    # 3. Supabase Proxy
    location /supabase-proxy/ {
        rewrite ^/supabase-proxy/(.*) /$1 break;
        proxy_pass https://bamcwwtwtvxjjcdfbmdr.supabase.co;
        proxy_ssl_server_name on;
        proxy_set_header Host bamcwwtwtvxjjcdfbmdr.supabase.co;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header apikey $http_apikey;
        proxy_set_header Content-Type $http_content_type;
        # Crucial for Auth:
        proxy_hide_header Access-Control-Allow-Origin;
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, apikey, x-client-info" always;
    }

    # 4. Frontend Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        # Force Host header to be the domain name
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port 443;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/lunyee.cn-0001/fullchain.pem; 
    ssl_certificate_key /etc/letsencrypt/live/lunyee.cn-0001/privkey.pem; 
    include /etc/letsencrypt/options-ssl-nginx.conf; 
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; 
}

server {
    if ($host = www.lunyee.cn) { return 301 https://$host$request_uri; }
    if ($host = lunyee.cn) { return 301 https://$host$request_uri; }
    listen 80;
    server_name lunyee.cn www.lunyee.cn;
    return 404; 
}
EOF

# Restart Nginx
systemctl reload nginx

echo "Nginx config updated. Please try to login again."

#!/bin/bash

echo "=== 修复 Nginx 配置并重新部署 ==="

# 1. 备份当前 Nginx 配置
echo ">> 步骤 1: 备份 Nginx 配置"
sudo cp /etc/nginx/sites-enabled/11flow /etc/nginx/sites-enabled/11flow.backup.$(date +%Y%m%d_%H%M%S)

# 2. 创建新的 Nginx 配置（不包含 Supabase proxy）
echo ">> 步骤 2: 创建新的 Nginx 配置"
sudo tee /etc/nginx/sites-enabled/11flow > /dev/null <<'EOF'
server {
    listen 80;
    server_name lunyee.cn www.lunyee.cn;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lunyee.cn www.lunyee.cn;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/lunyee.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lunyee.cn/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Increase buffer sizes for large headers
    client_header_buffer_size 16k;
    large_client_header_buffers 4 32k;

    # Proxy to Next.js frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Proxy to Python backend API
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

# 3. 测试 Nginx 配置
echo ">> 步骤 3: 测试 Nginx 配置"
sudo nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Nginx 配置测试失败，恢复备份"
    sudo cp /etc/nginx/sites-enabled/11flow.backup.* /etc/nginx/sites-enabled/11flow
    exit 1
fi

# 4. 重启 Nginx
echo ">> 步骤 4: 重启 Nginx"
sudo systemctl restart nginx

# 5. 检查 Nginx 状态
echo ">> 步骤 5: 检查 Nginx 状态"
sudo systemctl status nginx --no-pager

# 6. 修复脚本权限
echo ">> 步骤 6: 修复部署脚本权限"
chmod +x /var/www/11flow/deploy_full.sh

# 7. 运行部署
echo ">> 步骤 7: 运行部署脚本"
cd /var/www/11flow
./deploy_full.sh

echo ""
echo "=== ✅ 修复完成 ==="
echo "请访问 https://lunyee.cn 测试网站"

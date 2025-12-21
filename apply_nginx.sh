#!/bin/bash
# 自动应用 Nginx 修复
# Apply Nginx Fix

echo "1. 复制新的配置文件..."
sudo cp nginx-final-fix.conf /etc/nginx/sites-available/11flow

echo "2. 检查 Nginx 配置..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "3. 配置正确，重启 Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx 重载成功！请尝试访问网站。"
else
    echo "❌ Nginx 配置有误，请检查配置文件。"
    exit 1
fi

#!/bin/bash
# 修复后端启动命令 (增加 proxy-headers)
# Fix Backend Startup Command

echo "1. 停止旧的后端进程..."
pm2 delete backend || true

echo "2. 使用正确的参数启动后端..."
# Critical: --proxy-headers tells Uvicorn to trust X-Forwarded-* headers
# Critical: --forwarded-allow-ips "*" allows Nginx (on localhost or internal IP) to be trusted
CONDA_CMD="conda run -n 11flow uvicorn backend.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips '*'"

echo "执行命令: pm2 start \"$CONDA_CMD\" --name \"backend\""
pm2 start "$CONDA_CMD" --name "backend"

echo "3. 保存 PM2 配置..."
pm2 save

echo "✅ 后端已重启，配置了 Proxy Headers 支持。"
echo "请稍等几秒后刷新网页验证 WebSocket。"

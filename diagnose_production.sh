#!/bin/bash
# 生产服务器诊断脚本
# 位置：/var/www/11flow/backend

echo "=== 1. 检查后端进程状态 ==="
pm2 list | grep backend || echo "Backend not running via PM2"
ps aux | grep uvicorn | grep -v grep || echo "No uvicorn process found"

echo -e "\n=== 2. 检查环境变量（API Keys）==="
cd /var/www/11flow/backend
if [ -f .env ]; then
    echo "✅ .env file exists"
    grep -E "^(OPENROUTER_API_KEY|FAL_KEY|REPLICATE_API_TOKEN)=" .env | sed 's/=.*/=***HIDDEN***/'
else
    echo "❌ .env file not found!"
fi

echo -e "\n=== 3. 测试 OpenRouter API 连接 ==="
source .env 2>/dev/null
if [ -n "$OPENROUTER_API_KEY" ]; then
    echo "Testing OpenRouter API..."
    curl -s -H "Authorization: Bearer $OPENROUTER_API_KEY" \
         https://openrouter.ai/api/v1/models | head -20
else
    echo "❌ OPENROUTER_API_KEY not set"
fi

echo -e "\n=== 4. 检查最近的后端日志 ==="
if [ -f /var/www/11flow/backend/backend.log ]; then
    echo "Last 20 lines of backend.log:"
    tail -20 /var/www/11flow/backend/backend.log
else
    echo "backend.log not found, checking PM2 logs..."
    pm2 logs backend --lines 20 --nostream 2>/dev/null || echo "No PM2 logs available"
fi

echo -e "\n=== 5. 测试本地 API 端点 ==="
curl -s http://localhost:8000/health | head -5 || echo "❌ Backend not responding"
curl -s http://localhost:8000/api/models | head -10 || echo "❌ Models endpoint not responding"

echo -e "\n=== 6. 检查网络连接 ==="
ping -c 2 openrouter.ai || echo "Cannot reach openrouter.ai"
ping -c 2 fal.run || echo "Cannot reach fal.run"

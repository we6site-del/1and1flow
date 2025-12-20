#!/bin/bash
# WebSocket 400 错误深度诊断脚本
# 在生产服务器上执行：bash websocket_debug.sh

echo "=== WebSocket 400 错误诊断 ==="
echo ""

echo "1. 检查 Nginx 配置"
echo "-------------------"
grep -A 10 "location /api/ws" /etc/nginx/sites-available/11flow
echo ""

echo "2. 测试 WebSocket 握手（使用 curl）"
echo "-------------------------------------"
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  http://localhost:8000/api/ws/test-room-id
echo ""

echo "3. 检查后端 WebSocket 路由"
echo "----------------------------"
cd /var/www/11flow/backend
grep -n "@router.websocket" routers/websocket.py
echo ""

echo "4. 检查后端是否在正确端口运行"
echo "-------------------------------"
netstat -tlnp | grep 8000 || ss -tlnp | grep 8000
echo ""

echo "5. 测试直接连接后端（绕过 Nginx）"
echo "------------------------------------"
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  http://localhost:8000/api/ws/test-room-id 2>&1 | head -20
echo ""

echo "6. 检查 Nginx 错误日志"
echo "----------------------"
tail -20 /var/log/nginx/error.log
echo ""

echo "=== 诊断完成 ==="
echo "请将以上输出发送给开发者"

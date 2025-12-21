#!/bin/bash
# 修复依赖安装并重建前端的脚本
# Fix Dependency Install & Rebuild Script

set -e # 遇到错误立即停止

PROJECT_DIR="/var/www/11flow"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "=========================================="
echo "11Flow 前端修复脚本"
echo "Fix Frontend Deployment"
echo "=========================================="
echo ""

cd $FRONTEND_DIR

echo -e "1. 停止当前服务..."
pm2 stop frontend || true

echo -e "2. 清理旧依赖 (rm -rf node_modules .next)..."
rm -rf node_modules .next package-lock.json

echo -e "3. 安装依赖 (使用 --legacy-peer-deps)..."
# 注意：这里会重新生成 package-lock.json
npm install --legacy-peer-deps

# 验证 next 命令是否存在
if [ ! -f "node_modules/.bin/next" ]; then
    echo -e "${RED}❌ 错误：未找到 Next.js 二进制文件！安装可能失败。${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 依赖安装成功${NC}"

echo -e "4. 构建项目 (npm run build)..."
npm run build

echo -e "5. 重启 PM2 服务..."
pm2 restart frontend --update-env

echo -e "6. 检查状态..."
sleep 3
pm2 status frontend

echo -e "${GREEN}=== 修复完成，请检查 Status 列是否为 online 且 uptime 在增加 ===${NC}"

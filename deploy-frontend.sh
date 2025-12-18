#!/bin/bash
# 部署脚本：更新生产服务器代码并重启前端服务
# Deploy Script: Update production server code and restart frontend service

set -e  # Exit on error

echo "=========================================="
echo "11Flow 生产环境部署脚本"
echo "Production Deployment Script"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_DIR="/var/www/11flow"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo -e "${YELLOW}步骤 1/6: 进入项目目录${NC}"
cd $PROJECT_DIR || { echo -e "${RED}错误: 无法进入项目目录${NC}"; exit 1; }
echo -e "${GREEN}✓ 当前目录: $(pwd)${NC}"
echo ""

echo -e "${YELLOW}步骤 2/6: 拉取最新代码${NC}"
git fetch origin
git pull origin main || { echo -e "${RED}错误: Git pull 失败${NC}"; exit 1; }
echo -e "${GREEN}✓ 代码已更新${NC}"
echo ""

echo -e "${YELLOW}步骤 3/6: 检查前端依赖${NC}"
cd $FRONTEND_DIR
if [ -f "package.json" ]; then
    echo "检查是否需要安装新依赖..."
    npm install --legacy-peer-deps || { echo -e "${RED}错误: npm install 失败${NC}"; exit 1; }
    echo -e "${GREEN}✓ 依赖已更新${NC}"
else
    echo -e "${RED}错误: 找不到 package.json${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}步骤 4/6: 清理并重新构建前端${NC}"
echo "清理旧的构建文件..."
rm -rf .next
echo "开始构建..."
npm run build || { echo -e "${RED}错误: 构建失败${NC}"; exit 1; }
echo -e "${GREEN}✓ 构建完成${NC}"
echo ""

echo -e "${YELLOW}步骤 5/6: 重启前端服务${NC}"
pm2 restart frontend --update-env || { echo -e "${RED}错误: PM2 重启失败${NC}"; exit 1; }
echo -e "${GREEN}✓ 前端服务已重启${NC}"
echo ""

echo -e "${YELLOW}步骤 6/6: 检查服务状态${NC}"
pm2 status
echo ""

echo -e "${GREEN}=========================================="
echo "部署完成！"
echo "Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "接下来的步骤："
echo "1. 查看日志: pm2 logs frontend --lines 50"
echo "2. 测试登录: https://lunyee.cn/zh/login"
echo "3. 如有问题，查看详细日志: pm2 logs frontend"
echo ""

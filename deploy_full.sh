#!/bin/bash
# 🚀 11Flow 全量部署脚本 (后端 + 前端)
# 11Flow Full Deployment Script (Backend + Frontend)

set -e  # 遇到错误直接退出

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="/var/www/11flow" 

echo -e "${YELLOW}=== 开始 11Flow 全量部署 ===${NC}"
echo "时间: $(date)"

# 1. 进入目录并更新代码
echo -e "\n${YELLOW}>> 步骤 1: 拉取最新代码${NC}"
if [ -d "$PROJECT_DIR" ]; then
    cd $PROJECT_DIR
    echo "当前目录: $(pwd)"
    git fetch origin
    git reset --hard origin/main # 强制覆盖本地修改，确保与远程一致
    echo -e "${GREEN}✓ 代码已更新到最新版本${NC}"
else
    echo -e "${RED}错误: 找不到项目目录 $PROJECT_DIR${NC}"
    exit 1
fi

# 2. 安装后端依赖 (如果需要)
echo -e "\n${YELLOW}>> 步骤 2: 检查后端环境${NC}"
cd $PROJECT_DIR/backend
if [ -f "requirements.txt" ]; then
    # 尝试安装依赖，忽略错误以免卡住 (生产环境可能已经装好了)
    pip3 install -r requirements.txt || echo "警告: pip 安装可能有问题，继续..."
fi
echo -e "${GREEN}✓ 后端环境检查完成${NC}"

# 3. 构建前端
echo -e "\n${YELLOW}>> 步骤 3: 构建前端${NC}"
cd $PROJECT_DIR/frontend
npm install --legacy-peer-deps
npm run build
echo -e "${GREEN}✓ 前端构建完成${NC}"

# 4. 重启所有服务 (Backend & Frontend)
echo -e "\n${YELLOW}>> 步骤 4: 重启服务${NC}"
# 重启后端 (确保应用了 main.py 的修复)
pm2 restart backend || pm2 restart api || echo "警告: 无法重启 backend 进程"

# 重启前端
pm2 restart frontend || echo "警告: 无法重启 frontend 进程"

# 5. 验证是否运行
echo -e "\n${YELLOW}>> 步骤 5: 状态检查${NC}"
pm2 list

echo -e "\n${GREEN}=== ✅ 部署完成 ===${NC}"
echo "请访问网站进行测试。"

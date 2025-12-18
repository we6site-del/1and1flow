#!/bin/bash
# 生产环境诊断脚本
# Production Diagnostics Script

echo "=========================================="
echo "11Flow 生产环境诊断"
echo "Production Diagnostics"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}[1/7] PM2 进程状态${NC}"
echo "----------------------------------------"
pm2 status
echo ""

echo -e "${BLUE}[2/7] 端口监听状态${NC}"
echo "----------------------------------------"
echo "检查关键端口 (3000, 8000, 80, 443):"
netstat -tlnp 2>/dev/null | grep -E ':(3000|8000|80|443)' || ss -tlnp | grep -E ':(3000|8000|80|443)'
echo ""

echo -e "${BLUE}[3/7] Nginx 状态${NC}"
echo "----------------------------------------"
systemctl status nginx --no-pager -l
echo ""

echo -e "${BLUE}[4/7] 前端最近日志 (最后 30 行)${NC}"
echo "----------------------------------------"
pm2 logs frontend --lines 30 --nostream
echo ""

echo -e "${BLUE}[5/7] Nginx 错误日志 (最后 20 行)${NC}"
echo "----------------------------------------"
tail -n 20 /var/log/nginx/error.log
echo ""

echo -e "${BLUE}[6/7] Nginx 访问日志 (最后 10 行)${NC}"
echo "----------------------------------------"
tail -n 10 /var/log/nginx/access.log
echo ""

echo -e "${BLUE}[7/7] 环境变量检查${NC}"
echo "----------------------------------------"
cd /var/www/11flow/frontend
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓ .env.local 文件存在${NC}"
    echo "关键环境变量 (已脱敏):"
    grep -E 'NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SITE_URL' .env.local | sed 's/=.*/=***/' || echo "未找到 Supabase 配置"
else
    echo -e "${RED}✗ .env.local 文件不存在${NC}"
fi
echo ""

echo -e "${GREEN}=========================================="
echo "诊断完成！"
echo "Diagnostics Complete!"
echo "==========================================${NC}"
echo ""
echo "如需查看实时日志，运行："
echo "  pm2 logs frontend"
echo ""

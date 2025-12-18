#!/bin/bash
# Supabase 连接诊断脚本

echo "=========================================="
echo "Supabase 连接诊断"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

cd /var/www/11flow/frontend

echo -e "${BLUE}[1/6] 检查环境变量文件${NC}"
echo "----------------------------------------"
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓ .env.local 文件存在${NC}"
    echo ""
    echo "环境变量内容："
    cat .env.local
    echo ""
else
    echo -e "${RED}✗ .env.local 文件不存在！${NC}"
    exit 1
fi

echo -e "${BLUE}[2/6] 提取 Supabase URL${NC}"
echo "----------------------------------------"
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}✗ 未找到 SUPABASE_URL${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Supabase URL: $SUPABASE_URL${NC}"
fi
echo ""

echo -e "${BLUE}[3/6] 测试 DNS 解析${NC}"
echo "----------------------------------------"
SUPABASE_HOST=$(echo $SUPABASE_URL | sed -e 's|^[^/]*//||' -e 's|/.*$||')
echo "解析主机: $SUPABASE_HOST"
nslookup $SUPABASE_HOST || host $SUPABASE_HOST
echo ""

echo -e "${BLUE}[4/6] 测试网络连接${NC}"
echo "----------------------------------------"
echo "Ping 测试:"
ping -c 3 $SUPABASE_HOST || echo "Ping 失败（某些服务器禁用 ICMP）"
echo ""

echo -e "${BLUE}[5/6] 测试 HTTPS 连接${NC}"
echo "----------------------------------------"
echo "测试 URL: $SUPABASE_URL"
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" -m 10 "$SUPABASE_URL")
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 404 ]; then
    echo -e "${GREEN}✓ HTTPS 连接成功 (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ HTTPS 连接失败 (HTTP $HTTP_CODE)${NC}"
fi
echo ""

echo -e "${BLUE}[6/6] 测试 Supabase REST API${NC}"
echo "----------------------------------------"
SUPABASE_KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
if [ -z "$SUPABASE_KEY" ]; then
    echo -e "${RED}✗ 未找到 SUPABASE_ANON_KEY${NC}"
else
    echo "测试 REST API 端点..."
    curl -s -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" "$SUPABASE_URL/rest/v1/" | head -c 200
    echo ""
    echo -e "${GREEN}✓ API Key 已配置${NC}"
fi
echo ""

echo -e "${BLUE}[额外] 检查前端日志中的错误${NC}"
echo "----------------------------------------"
echo "最近的前端日志（查找 Supabase 相关错误）："
pm2 logs frontend --lines 30 --nostream | grep -i -E "(supabase|error|failed|connection)" || echo "未找到明显的 Supabase 错误"
echo ""

echo -e "${GREEN}=========================================="
echo "诊断完成！"
echo "==========================================${NC}"

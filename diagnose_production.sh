#!/bin/bash
# 生产服务器诊断脚本 (Updated)
# 位置：/var/www/11flow/diagnose_production.sh

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== 11Flow Cloud Diagnostic Tool ===${NC}"
echo "Time: $(date)"

echo -e "\n${YELLOW}[1/6] Nginx Status${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${RED}❌ Nginx is NOT running${NC}"
    echo "Check 'systemctl status nginx' or 'journalctl -xeu nginx'"
fi

echo -e "\n${YELLOW}[2/6] Service Ports${NC}"
# Listen ports
for port in 80 443 3000 8000; do
    if netstat -tuln | grep -q ":$port "; then
        echo -e "${GREEN}✅ Port $port is open${NC}"
    else
        echo -e "${RED}❌ Port $port is NOT listening${NC}"
    fi
done

echo -e "\n${YELLOW}[3/6] PM2 Processes${NC}"
pm2 list

echo -e "\n${YELLOW}[4/6] Backend Health (Local)${NC}"
if curl -s --max-time 5 http://localhost:8000/health | grep -q "ok"; then
    echo -e "${GREEN}✅ Backend is healthy (localhost:8000)${NC}"
else
    echo -e "${RED}❌ Backend is unhealthy or unreachable${NC}"
    curl -v http://localhost:8000/health 2>&1 | head -n 5
fi

echo -e "\n${YELLOW}[5/6] Frontend Health (Local)${NC}"
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}\n" http://localhost:3000)
if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 400 ]; then
    echo -e "${GREEN}✅ Frontend is reachable (localhost:3000) - HTTP $HTTP_CODE${NC}"
else
    echo -e "${RED}❌ Frontend is unreachable or returning error - HTTP $HTTP_CODE${NC}"
fi

echo -e "\n${YELLOW}[6/6] Environment Check${NC}"
FRONTEND_ENV="/var/www/11flow/frontend/.env.local"
if [ -f "$FRONTEND_ENV" ]; then
    echo -e "${GREEN}✅ Frontend .env.local found${NC}"
    SITE_URL=$(grep NEXT_PUBLIC_SITE_URL "$FRONTEND_ENV" | cut -d '=' -f2)
    echo "   NEXT_PUBLIC_SITE_URL=$SITE_URL"
    if [[ "$SITE_URL" == *"localhost"* ]]; then
        echo -e "${RED}   ⚠️  WARNING: NEXT_PUBLIC_SITE_URL contains 'localhost'. This may cause issues on production!${NC}"
    fi
else
    echo -e "${RED}❌ Frontend .env.local NOT found at $FRONTEND_ENV${NC}"
fi

echo -e "\n${YELLOW}=== Diagnosis Complete ===${NC}"

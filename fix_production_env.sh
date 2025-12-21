#!/bin/bash
# 自动修复生产环境配置并重构
# Fix Production Env & Rebuild

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}=== 11Flow Environment Fix Tool ===${NC}"

PROJECT_DIR="/var/www/11flow"
ENV_FILE="$PROJECT_DIR/frontend/.env.local"
DOMAIN="https://lunyee.cn"

# 1. Update Environment Variables
echo -e "\n${YELLOW}[1/3] Updating .env.local...${NC}"
if [ -f "$ENV_FILE" ]; then
    # Backup
    cp "$ENV_FILE" "$ENV_FILE.bak"
    
    # Replace SITE_URL
    if grep -q "NEXT_PUBLIC_SITE_URL=" "$ENV_FILE"; then
        sed -i "s|NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=$DOMAIN|g" "$ENV_FILE"
    else
        echo "NEXT_PUBLIC_SITE_URL=$DOMAIN" >> "$ENV_FILE"
    fi
    
    # Replace API_URL if it points to localhost (optional, depends on your setup)
    # usually API_URL might need to be https://lunyee.cn/api or similar if served via Nginx
    # But let's stick to SITE_URL first as that was the main warning.
    
    echo -e "${GREEN}✓ Updated NEXT_PUBLIC_SITE_URL to $DOMAIN${NC}"
    grep "NEXT_PUBLIC_SITE_URL" "$ENV_FILE"
else
    echo -e "${RED}❌ $ENV_FILE not found!${NC}"
    exit 1
fi

# 2. Rebuild Frontend
echo -e "\n${YELLOW}[2/3] Rebuilding Frontend... (This may take a few minutes)${NC}"
cd "$PROJECT_DIR/frontend"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build Successful${NC}"
else
    echo -e "${RED}❌ Build Failed${NC}"
    exit 1
fi

# 3. Restart Service
echo -e "\n${YELLOW}[3/3] Restarting Frontend...${NC}"
pm2 restart frontend
echo -e "${GREEN}✓ Frontend Restarted${NC}"

echo -e "\n${GREEN}=== Fix Complete! ===${NC}"
echo "Please verify access at $DOMAIN"

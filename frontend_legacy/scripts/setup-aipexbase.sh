#!/bin/bash

# AipexBase 自动部署脚本
# 使用方法: bash scripts/setup-aipexbase.sh

set -e

echo "========================================="
echo "  AipexBase 后端部署脚本"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查依赖
echo -e "${YELLOW}[1/6] 检查系统依赖...${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${RED}错误: 未安装 git${NC}"
    exit 1
fi

if ! command -v java &> /dev/null; then
    echo -e "${RED}错误: 未安装 Java (需要 1.8+)${NC}"
    exit 1
fi

if ! command -v mvn &> /dev/null; then
    echo -e "${RED}错误: 未安装 Maven${NC}"
    exit 1
fi

if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}警告: 未检测到 MySQL 客户端${NC}"
fi

echo -e "${GREEN}✓ 依赖检查完成${NC}"
echo ""

# 克隆 AipexBase
echo -e "${YELLOW}[2/6] 克隆 AipexBase 仓库...${NC}"

if [ -d "aipexbase" ]; then
    echo -e "${YELLOW}目录 aipexbase 已存在，跳过克隆${NC}"
else
    git clone https://gitee.com/kuafuai/aipexbase.git
    echo -e "${GREEN}✓ 克隆完成${NC}"
fi

cd aipexbase
echo ""

# 配置数据库
echo -e "${YELLOW}[3/6] 配置数据库...${NC}"
echo "请输入 MySQL 数据库信息:"
read -p "数据库主机 (默认: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "数据库端口 (默认: 3306): " DB_PORT
DB_PORT=${DB_PORT:-3306}

read -p "数据库名称 (默认: aipexbase): " DB_NAME
DB_NAME=${DB_NAME:-aipexbase}

read -p "数据库用户名: " DB_USER
read -sp "数据库密码: " DB_PASS
echo ""

# 创建数据库配置文件
CONFIG_FILE="backend/src/main/resources/application-mysql.yml"

cat > $CONFIG_FILE << EOF
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=UTC
    username: ${DB_USER}
    password: ${DB_PASS}
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQL8Dialect
EOF

echo -e "${GREEN}✓ 数据库配置已创建${NC}"
echo ""

# 初始化数据库
echo -e "${YELLOW}[4/6] 初始化数据库...${NC}"
echo "是否自动初始化数据库? (y/n)"
read -p "> " INIT_DB

if [ "$INIT_DB" = "y" ]; then
    echo "正在导入数据库结构..."
    mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME < install/mysql/init.sql
    echo -e "${GREEN}✓ 数据库初始化完成${NC}"
else
    echo -e "${YELLOW}跳过数据库初始化，请手动执行:${NC}"
    echo "mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p $DB_NAME < install/mysql/init.sql"
fi
echo ""

# 构建项目
echo -e "${YELLOW}[5/6] 构建项目...${NC}"
cd backend
mvn clean install -DskipTests
echo -e "${GREEN}✓ 项目构建完成${NC}"
echo ""

# 启动后端
echo -e "${YELLOW}[6/6] 启动后端服务...${NC}"
echo "后端将在 http://localhost:8080 启动"
echo "按 Ctrl+C 停止服务"
echo ""

mvn spring-boot:run

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  AipexBase 部署完成！${NC}"
echo -e "${GREEN}=========================================${NC}"

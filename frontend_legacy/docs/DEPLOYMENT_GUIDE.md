# AipexBase 快速部署指南

本指南将帮助你在 10 分钟内完成 AipexBase 的部署和配置。

---

## 📋 前置要求

- **Java**: 1.8 或更高版本
- **Maven**: 3.6 或更高版本
- **MySQL**: 8.0 或更高版本
- **Node.js**: 18 或更高版本（可选，用于前端管理界面）

---

## 🚀 步骤 1: 克隆并构建

```bash
# 克隆仓库
git clone https://gitee.com/kuafuai/aipexbase.git
cd aipexbase

# 查看项目结构
ls -la
# backend/   - 后端代码
# frontend/  - 前端管理界面
# install/   - 安装脚本和数据库文件
# docs/      - 文档
```

---

## 🗄️ 步骤 2: 配置数据库

### 2.1 创建数据库

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE aipexbase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 导入初始化脚本
USE aipexbase;
SOURCE install/mysql/init.sql;

# 退出
EXIT;
```

### 2.2 配置数据库连接

编辑 `backend/src/main/resources/application-mysql.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/aipexbase?useUnicode=true&characterEncoding=utf-8&useSSL=false
    username: your_mysql_username
    password: your_mysql_password
    driver-class-name: com.mysql.cj.jdbc.Driver
```

---

## ⚙️ 步骤 3: 启动后端服务

```bash
cd backend

# 安装依赖并构建
mvn clean install -DskipTests

# 启动服务
mvn spring-boot:run
```

服务将在 `http://localhost:8080` 启动。

验证服务是否正常:
```bash
curl http://localhost:8080/api/health
# 应返回: {"status":"UP"}
```

---

## 🎨 步骤 4: 启动管理界面（可选）

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

管理界面将在 `http://localhost:3000` 启动。

---

## 🤖 步骤 5: 配置 AI 模型

### 方式一：通过 Web 界面

1. 访问 `http://localhost:8080` 或 `http://localhost:3000`
2. 创建管理员账号
3. 进入「模型管理」
4. 点击「添加模型」
5. 填写模型信息并保存

### 方式二：通过 API

```bash
# 添加 GPT-4 模型
curl -X POST http://localhost:8080/api/models \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GPT-4",
    "type": "text",
    "provider": "OpenAI",
    "modelId": "gpt-4-turbo-preview",
    "apiKey": "sk-your-openai-api-key",
    "maxTokens": 4096,
    "costPerToken": 0.00003
  }'

# 添加 DALL-E 3 模型
curl -X POST http://localhost:8080/api/models \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DALL-E 3",
    "type": "image",
    "provider": "OpenAI",
    "modelId": "dall-e-3",
    "apiKey": "sk-your-openai-api-key",
    "costPerToken": 0.04
  }'
```

---

## 🧪 步骤 6: 测试集成

### 在前端项目中测试

```bash
cd ai-workflow

# 配置环境变量
echo "VITE_AIPEXBASE_URL=http://localhost:8080" >> .env
echo "VITE_AIPEXBASE_API_KEY=" >> .env

# 运行测试脚本
bun run scripts/test-aipexbase.ts
```

预期输出:
```
========================================
  AipexBase 连接测试
========================================

[1] 服务连接测试
    ✓ AipexBase 服务正常运行

[2] 模型 API 测试
    ✓ 获取到 2 个 AI 模型

[3] 任务创建测试
    ✓ 任务创建成功

✅ 所有测试通过！
```

---

## 🔧 常用配置

### 修改端口

编辑 `backend/src/main/resources/application.yml`:

```yaml
server:
  port: 8080  # 改为你想要的端口
```

### 启用 API 认证

编辑 `application.yml`:

```yaml
security:
  api:
    enabled: true
    keys:
      - your-api-key-here
```

### 配置 CORS

```yaml
cors:
  allowed-origins:
    - http://localhost:5173
    - http://localhost:3000
```

---

## 📊 推荐的 AI 模型配置

### 基础套餐（文本 + 图像）

```json
[
  {
    "name": "GPT-4 Turbo",
    "type": "text",
    "provider": "OpenAI",
    "modelId": "gpt-4-turbo-preview"
  },
  {
    "name": "DALL-E 3",
    "type": "image",
    "provider": "OpenAI",
    "modelId": "dall-e-3"
  }
]
```

### 完整套餐

```json
[
  {
    "name": "GPT-4",
    "type": "text",
    "provider": "OpenAI",
    "modelId": "gpt-4-turbo-preview"
  },
  {
    "name": "Claude 3 Sonnet",
    "type": "text",
    "provider": "Anthropic",
    "modelId": "claude-3-sonnet-20240229"
  },
  {
    "name": "DALL-E 3",
    "type": "image",
    "provider": "OpenAI",
    "modelId": "dall-e-3"
  },
  {
    "name": "Stable Diffusion XL",
    "type": "image",
    "provider": "Stability AI",
    "modelId": "stable-diffusion-xl-1024-v1-0"
  }
]
```

---

## ❗ 常见问题

### 1. 数据库连接失败

**错误**: `Communications link failure`

**解决方案**:
- 检查 MySQL 是否正在运行: `systemctl status mysql`
- 验证用户名和密码是否正确
- 确认数据库 `aipexbase` 已创建

### 2. 端口被占用

**错误**: `Port 8080 is already in use`

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :8080

# 停止进程或修改配置文件中的端口
```

### 3. Maven 构建失败

**错误**: `BUILD FAILURE`

**解决方案**:
- 检查 Java 版本: `java -version`
- 清理缓存: `mvn clean`
- 跳过测试: `mvn install -DskipTests`

### 4. API Key 无效

**解决方案**:
- 确认 API Key 是否正确
- 检查 API 提供商是否有余额
- 访问提供商控制台验证 Key 状态

---

## 🚀 生产环境部署

### 使用 Docker Compose

```bash
cd aipexbase
docker-compose up -d
```

### 使用 Systemd

创建服务文件 `/etc/systemd/system/aipexbase.service`:

```ini
[Unit]
Description=AipexBase Service
After=network.target mysql.service

[Service]
Type=simple
User=aipexbase
WorkingDirectory=/opt/aipexbase/backend
ExecStart=/usr/bin/mvn spring-boot:run
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

启动服务:
```bash
systemctl enable aipexbase
systemctl start aipexbase
systemctl status aipexbase
```

---

## 📚 下一步

- 查看 [AI 模型配置详细指南](AI_MODELS_CONFIG.md)
- 阅读 [AipexBase API 文档](https://www.codeflying.net)
- 集成到前端项目，参考 [集成指南](AIPEXBASE_INTEGRATION.md)

---

## 🆘 获取帮助

- 官方文档: https://www.codeflying.net
- 邮件支持: service@kuafuai.net
- GitHub Issues: https://gitee.com/kuafuai/aipexbase/issues

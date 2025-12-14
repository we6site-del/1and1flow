# AipaxBase 完整部署与配置指南

## 📋 目录
1. [系统要求](#系统要求)
2. [部署 AipaxBase 后端](#部署-aipaxbase-后端)
3. [访问后台管理](#访问后台管理)
4. [配置 AI 模型](#配置-ai-模型)
5. [测试集成](#测试集成)
6. [故障排除](#故障排除)

---

## 系统要求

确保你的系统已安装以下软件：

```bash
# 检查 Java 版本（需要 1.8+）
java -version

# 检查 Maven 版本（需要 3.6+）
mvn -version

# 检查 MySQL 版本（需要 8.0+）
mysql --version

# 检查 Node.js 版本（可选，用于前端管理界面）
node -v
```

如果缺少任何依赖，请先安装：

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install openjdk-11-jdk maven mysql-server
```

**macOS**:
```bash
brew install openjdk@11 maven mysql
```

**Windows**:
- 下载 Java JDK: https://www.oracle.com/java/technologies/downloads/
- 下载 Maven: https://maven.apache.org/download.cgi
- 下载 MySQL: https://dev.mysql.com/downloads/installer/

---

## 部署 AipaxBase 后端

### 步骤 1: 克隆仓库

```bash
# 克隆 AipaxBase 仓库
git clone https://gitee.com/kuafuai/aipexbase.git

# 进入项目目录
cd aipexbase

# 查看项目结构
ls -la
# backend/   - 后端代码（Spring Boot）
# frontend/  - 前端管理界面（Vue 3）
# install/   - 安装脚本和数据库初始化文件
# docs/      - 文档
```

### 步骤 2: 初始化 MySQL 数据库

```bash
# 登录 MySQL（以 root 用户）
mysql -u root -p
# 输入你的 MySQL root 密码

# 在 MySQL 控制台中执行：
CREATE DATABASE aipexbase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建专用用户（可选但推荐）
CREATE USER 'aipexbase'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON aipexbase.* TO 'aipexbase'@'localhost';
FLUSH PRIVILEGES;

# 退出 MySQL
EXIT;

# 导入初始化脚本
mysql -u root -p aipexbase < install/mysql/init.sql
```

### 步骤 3: 配置数据库连接

编辑后端配置文件：

```bash
cd backend/src/main/resources
vim application-mysql.yml
# 或使用其他编辑器: nano, code, etc.
```

修改以下配置：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/aipexbase?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=UTC
    username: aipexbase  # 你的数据库用户名
    password: your_password  # 你的数据库密码
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQL8Dialect

# 服务器配置
server:
  port: 8080  # 后端服务端口

# CORS 配置（允许前端访问）
cors:
  allowed-origins:
    - http://localhost:5173  # 你的前端地址
    - http://localhost:3000
```

### 步骤 4: 启动后端服务

```bash
# 回到 backend 目录
cd /path/to/aipexbase/backend

# 安装依赖并构建
mvn clean install -DskipTests

# 启动服务
mvn spring-boot:run
```

如果一切正常，你应该看到：

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::        (v2.x.x)

...
Started AipexbaseApplication in 12.345 seconds
```

**重要**: 保持这个终端窗口运行，后端服务需要一直运行！

---

## 访问后台管理

AipaxBase 提供了两种访问方式：

### 方式 1: REST API 直接访问（推荐用于集成）

后端 API 地址: `http://localhost:8080`

测试连接：
```bash
# 检查服务健康状态
curl http://localhost:8080/api/health

# 应该返回
{"status":"UP"}
```

### 方式 2: Web 管理界面（推荐用于配置）

#### 启动前端管理界面：

打开**新的终端窗口**（保持后端运行），然后：

```bash
# 进入前端目录
cd /path/to/aipexbase/frontend

# 安装依赖
npm install
# 或使用 pnpm/yarn
# pnpm install

# 启动开发服务器
npm run dev
```

前端将在 `http://localhost:3000` 启动（或其他端口，查看终端输出）。

#### 访问管理界面：

1. 打开浏览器访问: `http://localhost:3000`
2. 首次访问需要创建管理员账号
3. 登录后即可进入管理界面

**管理界面功能**：
- 📊 仪表板 - 查看系统状态和统计
- 🤖 模型管理 - 添加、编辑、删除 AI 模型
- 📝 任务管理 - 查看和管理 AI 任务
- 👥 用户管理 - 管理系统用户
- ⚙️ 系统配置 - 配置系统参数

---

## 配置 AI 模型

### 方式 1: 通过 Web 界面配置（推荐）

1. **登录管理界面**: `http://localhost:3000`

2. **进入模型管理**:
   - 点击左侧菜单 "模型管理" 或 "AI Models"
   - 点击 "添加模型" 按钮

3. **配置文本模型（GPT-4）**:

   填写表单：
   - **模型名称**: `GPT-4 Turbo`
   - **模型类型**: 选择 `text`
   - **提供商**: `OpenAI`
   - **模型 ID**: `gpt-4-turbo-preview`
   - **描述**: `OpenAI 最强大的文本生成模型`
   - **API Key**: `sk-your-openai-api-key-here`
   - **最大 Tokens**: `4096`
   - **费用/Token**: `0.00003`

   点击 "保存"

4. **配置图像模型（DALL-E 3）**:

   填写表单：
   - **模型名称**: `DALL-E 3`
   - **模型类型**: 选择 `image`
   - **提供商**: `OpenAI`
   - **模型 ID**: `dall-e-3`
   - **描述**: `OpenAI 的图像生成模型`
   - **API Key**: `sk-your-openai-api-key-here`
   - **费用/张**: `0.04`

   点击 "保存"

5. **获取 API Key**:
   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic (Claude): https://console.anthropic.com/
   - Google (Gemini): https://makersuite.google.com/app/apikey

### 方式 2: 通过 API 配置

```bash
# 添加 GPT-4 模型
curl -X POST http://localhost:8080/api/models \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GPT-4 Turbo",
    "type": "text",
    "provider": "OpenAI",
    "modelId": "gpt-4-turbo-preview",
    "description": "最强大的文本生成模型",
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
    "description": "图像生成模型",
    "apiKey": "sk-your-openai-api-key",
    "costPerToken": 0.04
  }'
```

### 验证模型配置

```bash
# 获取所有模型列表
curl http://localhost:8080/api/models

# 应该返回你配置的模型列表
[
  {
    "id": "xxx",
    "name": "GPT-4 Turbo",
    "type": "text",
    "provider": "OpenAI",
    ...
  },
  {
    "id": "xxx",
    "name": "DALL-E 3",
    "type": "image",
    "provider": "OpenAI",
    ...
  }
]
```

---

## 测试集成

### 步骤 1: 配置前端环境变量

在 `ai-workflow/.env` 文件中：

```env
# Supabase 配置（已有）
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AipaxBase 配置（新增）
VITE_AIPEXBASE_URL=http://localhost:8080
VITE_AIPEXBASE_API_KEY=
```

### 步骤 2: 运行测试脚本

```bash
cd ai-workflow

# 测试 AipaxBase 连接
bun run test:aipexbase
```

**预期输出**:
```
========================================
  AipexBase 连接测试
========================================

目标服务: http://localhost:8080
API Key: 未配置

开始测试...

========================================
  测试结果
========================================

[1] 服务连接测试
    ✓ AipexBase 服务正常运行 (http://localhost:8080)

[2] 模型 API 测试
    ✓ 获取到 2 个 AI 模型

[3] 任务创建测试
    ✓ 任务创建成功 (ID: xxx)

========================================
总计: 3 个测试
✓ 成功: 3
✗ 失败: 0
========================================

✅ 所有测试通过！AipaxBase 已正确配置
```

### 步骤 3: 在应用中测试

```bash
# 启动前端应用
bun run dev
```

访问 `http://localhost:5173`:

1. **登录/注册**账号
2. **创建新项目**
3. **添加 AI 节点**到画布
4. **输入提示词**，点击生成
5. **查看控制台日志**:
   ```
   💫 开始 AI 生成任务: {...}
   ✓ 已扣除 10 积分，剩余: 1990
   🚀 AipaxBase: 创建 AI 生成任务 {...}
   ✓ AipaxBase: 任务创建成功 {...}
   ⏳ 任务处理中，等待完成...
   ✓ AI 生成任务完成: xxx
   ```

---

## 故障排除

### 问题 1: 后端无法启动

**错误**: `java.sql.SQLException: Access denied for user`

**解决**:
1. 检查 `application-mysql.yml` 中的数据库用户名和密码
2. 确认 MySQL 用户有正确的权限
3. 测试数据库连接: `mysql -u username -p aipexbase`

### 问题 2: 端口被占用

**错误**: `Port 8080 is already in use`

**解决**:
```bash
# 查找占用端口的进程
lsof -i :8080

# 停止进程
kill -9 <PID>

# 或修改端口（在 application.yml 中）
server:
  port: 8081
```

### 问题 3: 前端无法连接后端

**错误**: `CORS policy` 或 `Network Error`

**解决**:
1. 检查 `application-mysql.yml` 中的 CORS 配置
2. 确保后端正在运行: `curl http://localhost:8080/api/health`
3. 检查防火墙设置

### 问题 4: 模型配置失败

**错误**: API Key 无效

**解决**:
1. 验证 API Key 是否正确（无空格）
2. 检查 API 提供商账户余额
3. 确认 API Key 权限设置

### 问题 5: AI 生成任务失败

**错误**: 任务一直处于 pending 状态

**解决**:
1. 检查 AipaxBase 后端日志
2. 验证模型配置是否正确
3. 确认 API Key 有效且有余额
4. 检查网络连接

---

## 📊 系统架构总览

```
┌─────────────────────────────────────────┐
│   AI Workflow 前端 (localhost:5173)      │
│   ┌─────────────┐   ┌──────────────┐    │
│   │  Tldraw     │   │  Dashboard   │    │
│   │  画布编辑器  │   │  项目管理     │    │
│   └─────────────┘   └──────────────┘    │
└────────────┬────────────────┬───────────┘
             │                │
             ▼                ▼
┌─────────────────────────────────────────┐
│  AipaxBase 后端 (localhost:8080)         │
│  ┌──────────────┐   ┌──────────────┐   │
│  │  REST API    │   │  Web UI      │   │
│  │  (集成接口)   │   │ (localhost:  │   │
│  │              │   │  3000)       │   │
│  └──────────────┘   └──────────────┘   │
│  ┌──────────────┐   ┌──────────────┐   │
│  │  AI 模型管理  │   │  任务调度     │   │
│  └──────────────┘   └──────────────┘   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  MySQL 数据库 (localhost:3306)           │
│  - ai_models                            │
│  - ai_tasks                             │
│  - ...                                  │
└─────────────────────────────────────────┘
```

---

## 📚 相关资源

- **AipaxBase 官方文档**: https://www.codeflying.net
- **OpenAI API 文档**: https://platform.openai.com/docs
- **Spring Boot 文档**: https://spring.io/projects/spring-boot
- **技术支持**: service@kuafuai.net

---

## ✅ 部署检查清单

完成后请确认：

- [ ] Java、Maven、MySQL 已安装
- [ ] AipaxBase 仓库已克隆
- [ ] MySQL 数据库已创建并初始化
- [ ] 后端配置文件已正确配置
- [ ] 后端服务成功启动（8080端口）
- [ ] 前端管理界面可访问（3000端口，可选）
- [ ] 至少配置了一个 AI 模型（GPT-4 或 DALL-E）
- [ ] 前端应用环境变量已配置
- [ ] 测试脚本通过
- [ ] 在应用中成功测试 AI 生成

恭喜！你已经完成 AipaxBase 的部署和配置 🎉

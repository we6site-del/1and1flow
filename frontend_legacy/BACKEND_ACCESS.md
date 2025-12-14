# 🎯 AipaxBase 后台快速访问指南

## 📍 访问地址

### 后端 API
- **地址**: http://localhost:8080
- **健康检查**: http://localhost:8080/api/health
- **用途**: 前端集成、API 调用

### Web 管理界面（推荐）
- **地址**: http://localhost:3000
- **用途**: 配置 AI 模型、查看任务、系统管理

---

## 🚀 快速启动

### 1. 启动后端服务

```bash
cd aipexbase/backend
mvn spring-boot:run
```

 看到 "Started AipexbaseApplication" 表示成功

### 2. 启动管理界面（可选）

```bash
cd aipexbase/frontend
npm install
npm run dev
```

 访问 http://localhost:3000

---

## 🔑 首次登录

1. 访问 http://localhost:3000
2. 点击 "注册" 创建管理员账号
3. 登录后即可使用

---

## 🤖 配置 AI 模型

### 通过 Web 界面（推荐）

1. 登录管理界面
2. 左侧菜单 → "模型管理"
3. 点击 "添加模型"
4. 填写信息：
   - 名称: `GPT-4`
   - 类型: `text`
   - 模型 ID: `gpt-4-turbo-preview`
   - API Key: `sk-your-openai-key`
5. 保存

### 通过 API

```bash
curl -X POST http://localhost:8080/api/models \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GPT-4",
    "type": "text",
    "provider": "OpenAI",
    "modelId": "gpt-4-turbo-preview",
    "apiKey": "sk-your-key"
  }'
```

---

## 🔗 获取 API Key

- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/
- **Google AI**: https://makersuite.google.com/app/apikey

---

## ✅ 验证部署

```bash
# 测试连接
curl http://localhost:8080/api/health

# 查看模型列表
curl http://localhost:8080/api/models

# 在前端项目中测试
cd ai-workflow
bun run test:aipexbase
```

---

## 🆘 遇到问题？

#'EOF'
: [docs/AIPEXBASE_DEPLOYMENT_COMPLETE.md](docs/AIPEXBASE_DEPLOYMENT_COMPLETE.md)

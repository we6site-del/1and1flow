# 🚀 AI Workflow 部署指南

## 📋 系统架构

 (React + Tldraw)
    ↓
 AipexBase → AI 模型调用、任务调度
 Supabase → 用户认证、项目存储

## ⚡ 快速开始

### 步骤 1: 部署 AipexBase

```bash
# 自动部署
bun run setup:aipexbase

# 或手动部署
git clone https://gitee.com/kuafuai/aipexbase.git
cd aipexbase/backend
mvn spring-boot:run
```

### 步骤 2: 配置环境变量

 `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_key
VITE_AIPEXBASE_URL=http://localhost:8080
```

### 步骤 3: 配置 AI 模型

'EOF''EOF' http://localhost:8080
 GPT-4 或 DALL-E 3

### 步骤 4: 测试

```bash
bun run test:aipexbase
```

### 步骤 5: 启动

```bash
bun run dev
```

## 📚 详细文档

- [部署详细步骤](docs/DEPLOYMENT_GUIDE.md)
- [AI 模型配置](docs/AI_MODELS_CONFIG.md)
- [AipexBase 集成](docs/AIPEXBASE_INTEGRATION.md)

## 🔧 故障排除

### 连接失败
#
 AipexBase 是否运行: `curl http://localhost:8080/api/health`

### 图片上传失败
#
 Supabase bucket `user-assets` 是否存在

### AI 生成失败
1. 检查 API Key 是否配置
2. 验证用户积分是否足够
3. 查看后端日志

## 🆘 获取帮助

- AipexBase: service@kuafuai.net
- 文档: docs/ 目录

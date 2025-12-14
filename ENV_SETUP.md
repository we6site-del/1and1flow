# 环境变量配置指南

## 🔐 安全原则
- **前端 (Next.js)**: 只存放 `NEXT_PUBLIC_` 开头的公开变量
- **后端 (Python)**: 存放所有敏感密钥 (Stripe Secret, Service Role Key 等)

## 📁 前端配置 (`frontend/.env.local`)

创建 `frontend/.env.local` 文件并填入以下内容：

```bash
# Supabase (公开密钥)
NEXT_PUBLIC_SUPABASE_URL=https://bamcwwtwtvxjjcdfbmdr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhbWN3d3R3dHZ4ampjZGZibWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNjk4NDAsImV4cCI6MjA3OTY0NTg0MH0.xxx

# Backend API URL (本地开发)
NEXT_PUBLIC_API_URL=http://localhost:8000

# OpenAI API Key (用于 AI Copilot，严禁加 NEXT_PUBLIC_ 前缀)
OPENAI_API_KEY=sk-your-openai-key-here
```

**注意**:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 需要从 Supabase Dashboard 获取（不是 Service Role Key）
- `OPENAI_API_KEY` **不要**加 `NEXT_PUBLIC_` 前缀，否则会暴露

## 📁 后端配置 (`backend/.env`)

后端的 `.env` 已配置好基础 Supabase 连接。如需启用支付和 AI 功能，请取消注释并填入：

```bash
# Stripe 配置
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# OpenAI 配置
OPENAI_API_KEY=sk-your-openai-key-here
```

## ✅ 验证配置

### 1. 检查前端环境变量
```bash
cd frontend
cat .env.local
```

### 2. 检查后端环境变量
```bash
cd backend
cat .env
```

### 3. 重启服务
```bash
# 后端
cd backend && uvicorn main:app --reload --port 8000

# 前端
cd frontend && npm run dev
```

## 🚨 常见问题

### Q: 前端报 "Supabase URL not found"
A: 确保 `frontend/.env.local` 存在且包含 `NEXT_PUBLIC_SUPABASE_URL`

### Q: 后端报 "Supabase credentials not found"
A: 确保 `backend/.env` 包含 `SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY`

### Q: 支付功能不工作
A: 检查后端 `.env` 中的 `STRIPE_SECRET_KEY` 和 `STRIPE_WEBHOOK_SECRET` 是否配置

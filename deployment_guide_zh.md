# Lovart-Flow 部署指南

本指南涵盖两种主要的部署策略：
1.  **云平台部署** (推荐，简单易用)
    - 前端：Vercel
    - 后端：Railway 或 Render
2.  **Docker 部署** (推荐，适合自托管/VPS)
    - 使用 Docker Compose 启动全栈

## 前置条件
- **Supabase 项目**: 确保您的数据库托管在 Supabase 上，并拥有 URL 和 Key。
- **API Keys**: 收集所有必要的密钥 (`STRIPE_SECRET_KEY`, `OPENAI_API_KEY`, `REPLICATE_API_TOKEN`, `FAL_KEY`, `R2_ACCESS_KEY` 等)。

---

## 策略 1: 云平台部署

### 1. 后端 (FastAPI) - Railway
Railway 非常适合部署 Python 应用。
1.  将代码推送到 GitHub。
2.  登录 Railway 并从您的仓库创建一个新项目。
3.  设置 **Root Directory** (根目录) 为 `backend`。
4.  设置 **Build Command** (构建命令) 为: `pip install -r requirements.txt`
5.  设置 **Start Command** (启动命令) 为: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6.  **Environment Variables** (环境变量): 添加 `backend/.env` 中的所有变量 (数据库密钥, API 密钥等)。
7.  **部署**: Railway 会提供一个访问 URL (例如 `https://api-project.up.railway.app`)。

### 2. 前端 (Next.js) - Vercel
1.  登录 Vercel 并导入您的 GitHub 仓库。
2.  设置 **Root Directory** (根目录) 为 `frontend`。
3.  **Framework Preset** (框架预设): 选择 Next.js。
4.  **Environment Variables** (环境变量):
    - `NEXT_PUBLIC_SUPABASE_URL`: 您的 Supabase URL。
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 您的 Supabase Anon Key。
    - `NEXT_PUBLIC_API_URL`: **重要**。设置为第 1 步中获得的后端 URL (例如 `https://api-project.up.railway.app`)。
    - 注意: 确保您的后端允许来自 Vercel 域名的 CORS 请求。

---

## 策略 2: Docker 部署 (自托管/VPS)

您可以使用 `docker-compose` 运行整个技术栈。

### 1. 确认 Dockerfile
项目已包含 `backend/Dockerfile` 和 `frontend/Dockerfile`。

### 2. 确认 docker-compose.yml
项目根目录已包含 `docker-compose.yml`，配置了 backend (8000端口) 和 frontend (3000端口)。

### 3. 运行部署
在服务器上运行以下命令：
```bash
docker-compose up --build -d
```

---

## 重要配置说明

### CORS (跨域资源共享)
在 `backend/main.py` 中，更新 `allow_origins` 以包含您的生产环境前端域名 (例如 `https://lovart-flow.vercel.app`)。

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-production-domain.com"],
    ...
)
```

### WebSockets
如果您使用 Vercel，标准 WebSocket 通常可以正常工作。请确保 `Canvas.tsx` 中的 WebSocket 连接逻辑能正确识别协议切换（在 `deployment_guide.md` 中已提及，代码已处理 `ws://` 和 `wss://` 的自动切换）。

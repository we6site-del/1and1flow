# Lovart-Flow 部署指南 (Security Hardened)

本指南严格遵循 "Python Backend as Brain" 架构，确保密钥安全和职责分离。

## 🚨 核心安全原则
1.  **Stripe Secret Key** 必须且只能存在于 **Python 后端**。
2.  **Service Role Key** 必须且只能存在于 **Python 后端**。
3.  **前端 (Next.js)** 只持有 `NEXT_PUBLIC_` 开头的公开 Key。

## 1. 数据库 (Supabase)
*   确保 RLS (Row Level Security) 策略已生效。
*   运行 `supabase/schema.sql` 以创建必要的表和函数。

## 2. 后端部署 (Railway / Python FastAPI)
**这是系统的核心与金库，所有敏感逻辑和密钥都在此。**

*   **环境变量 (Environment Variables)**:
    *   `SUPABASE_URL`: `https://xyz.supabase.co`
    *   `SUPABASE_SERVICE_KEY`: `eyJh...` (Service Role Key，用于后台管理任务)
    *   `OPENAI_API_KEY`: `sk-...` (用于 AI 生成和复杂逻辑)
    *   `STRIPE_SECRET_KEY`: `sk_live_...` (用于创建支付会话)
    *   `STRIPE_WEBHOOK_SECRET`: `whsec_...` (用于验证支付回调)
    *   `FAL_KEY`: `...` (如有)
    *   `REPLICATE_API_TOKEN`: `...` (如有)

## 3. 前端部署 (Vercel / Next.js)
**前端负责 UI 展示和交互，不接触敏感密钥。**

*   **环境变量 (Environment Variables)**:
    *   `NEXT_PUBLIC_SUPABASE_URL`: `https://xyz.supabase.co`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJh...` (Anon Key，仅限公开权限)
    *   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: `pk_live_...` (用于前端唤起 Stripe UI)
    *   `NEXT_PUBLIC_API_URL`: `https://your-backend.railway.app` (指向 Python 后端)
    *   `OPENAI_API_KEY`: `sk-...` (仅当使用 Vercel AI SDK 且不涉及扣费逻辑时配置，**严禁加 NEXT_PUBLIC_**)

## 4. 部署后配置
1.  **Stripe Webhook**: 指向 **Python 后端** 的 URL。
    *   URL: `https://your-backend.railway.app/api/stripe/webhook`
    *   Events: `checkout.session.completed`
2.  **Supabase Auth**: 配置 Site URL 为 Vercel 前端域名。
3.  **CORS**: 确保 Python 后端允许 Vercel 前端域名的跨域请求。

## 故障排除
*   **支付回调失败**: 检查 Stripe Dashboard 的 Webhook 发送记录，确保指向的是 **后端 API** 而不是前端。
*   **401 Unauthorized**: 检查 Supabase Key 是否混淆（前端用 Anon，后端用 Service）。

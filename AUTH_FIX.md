# 🔧 修复 auth-code-error 问题

## 问题原因
`auth-code-error` 通常由以下原因引起：
1. Supabase Anon Key 不正确
2. Supabase 项目的 Redirect URLs 未配置
3. Google OAuth 未正确设置

## 🔑 步骤 1: 获取正确的 Supabase Keys

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目: `bamcwwtwtvxjjcdfbmdr`
3. 进入 **Settings** > **API**
4. 复制以下两个值：
   - **Project URL**: `https://bamcwwtwtvxjjcdfbmdr.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (一个很长的字符串)

5. 更新 `frontend/.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://bamcwwtwtvxjjcdfbmdr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<粘贴您从 Dashboard 复制的 anon key>
```

## 🔗 步骤 2: 配置 Redirect URLs

1. 在 Supabase Dashboard 中，进入 **Authentication** > **URL Configuration**
2. 在 **Redirect URLs** 中添加：
   ```
   http://localhost:3000/auth/callback
   ```
3. 在 **Site URL** 中设置：
   ```
   http://localhost:3000
   ```
4. 点击 **Save**

## 🔐 步骤 3: 配置 Google OAuth (如果使用 Google 登录)

1. 在 Supabase Dashboard 中，进入 **Authentication** > **Providers**
2. 找到 **Google** 并点击配置
3. 确保已启用 Google Provider
4. 如果需要，配置 Google OAuth Client ID 和 Secret

## ✅ 步骤 4: 重启服务并测试

```bash
# 停止前端
pkill -f "next dev"

# 重启前端
cd frontend && npm run dev
```

然后访问 `http://localhost:3000/login` 重新测试登录。

## 🐛 如果仍然出错

检查浏览器控制台 (F12) 的错误信息，并查看：
1. Network 标签中 `/auth/callback` 请求的详细信息
2. Console 中是否有 Supabase 相关的错误

常见错误信息：
- `Invalid JWT`: Anon Key 不正确
- `Invalid redirect URL`: Redirect URLs 未配置
- `Provider not enabled`: OAuth Provider 未启用

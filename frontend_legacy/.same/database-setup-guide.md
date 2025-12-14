# 数据库设置指南

## 概述
本指南将帮助您完成 AI Workflow 项目的 Supabase 数据库设置，包括用户认证、项目管理和数据持久化。

## 前置要求
- Supabase 账号（免费）
- 基本的 SQL 知识（可选）

## 第一步：创建 Supabase 项目

### 1.1 注册/登录 Supabase
1. 访问 https://supabase.com
2. 点击 "Start your project"
3. 使用 GitHub 账号登录

### 1.2 创建新项目
1. 点击 "New Project"
2. 填写项目信息：
   - **Name**: `ai-workflow` 或您喜欢的名称
   - **Database Password**: 创建一个强密码（保存好）
   - **Region**: 选择离用户最近的区域（如 East Asia）
3. 点击 "Create new project"
4. 等待 2-3 分钟项目初始化完成

## 第二步：运行数据库架构

### 2.1 打开 SQL Editor
1. 在项目仪表板左侧，点击 "SQL Editor"
2. 点击 "+ New query"

### 2.2 执行架构脚本
1. 复制 `.same/database-schema.sql` 文件的全部内容
2. 粘贴到 SQL Editor 中
3. 点击右下角的 "Run" 按钮
4. 等待执行完成（应该显示 "Success"）

### 2.3 验证表创建
1. 点击左侧的 "Table Editor"
2. 您应该看到以下表：
   - `user_profiles` - 用户配置
   - `projects` - 项目
   - `project_versions` - 项目版本
   - `ai_generations` - AI 生成记录
   - `credit_transactions` - 积分交易
   - `subscription_history` - 订阅历史
   - `user_assets` - 用户资产
   - `activity_logs` - 活动日志
   - `subscription_plans` - 订阅计划

## 第三步：配置认证

### 3.1 启用邮箱认证
1. 点击左侧 "Authentication"
2. 点击 "Providers"
3. 确保 "Email" 已启用
4. 配置邮箱模板（可选）：
   - 点击 "Email Templates"
   - 自定义确认邮件、密码重置邮件等

### 3.2 启用社交登录（可选）

#### Google OAuth
1. 在 Providers 中找到 "Google"
2. 点击启用
3. 需要配置：
   - Google Cloud Console 创建 OAuth 2.0 客户端
   - 复制 Client ID 和 Client Secret
   - 粘贴到 Supabase
4. 添加 Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

#### GitHub OAuth
1. 在 Providers 中找到 "GitHub"
2. 点击启用
3. 需要配置：
   - GitHub Settings > Developer settings > OAuth Apps
   - 创建新应用
   - 复制 Client ID 和 Client Secret
   - 粘贴到 Supabase
4. 添加 Callback URL: `https://your-project.supabase.co/auth/v1/callback`

### 3.3 配置 URL 设置
1. 点击 "Authentication" > "URL Configuration"
2. 设置 Site URL: `http://localhost:5173` （开发环境）
3. 添加 Redirect URLs:
   - `http://localhost:5173`
   - `http://localhost:5173/auth/callback`

## 第四步：配置存储桶

### 4.1 创建存储桶
1. 点击左侧 "Storage"
2. 点击 "Create a new bucket"
3. 创建以下桶：
   - **Bucket name**: `user-assets`
   - **Public**: ✅ （启用）
   - 点击 "Create bucket"

### 4.2 配置存储策略
1. 选择 `user-assets` 桶
2. 点击 "Policies" 标签
3. 添加策略：

```sql
-- 允许认证用户上传
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-assets');

-- 允许用户删除自己的文件
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 允许所有人查看
CREATE POLICY "Public can view"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-assets');
```

## 第五步：获取 API 密钥

### 5.1 找到项目 URL 和密钥
1. 点击左侧 "Settings" > "API"
2. 复制以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGc...`（公开密钥）
   - **service_role**: `eyJhbGc...`（服务端密钥，保密！）

### 5.2 配置环境变量
1. 在项目根目录创建 `.env` 文件
2. 添加以下内容：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. 更新 `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
```

## 第六步：测试连接

### 6.1 测试用户注册
1. 启动开发服务器: `bun run dev`
2. 访问 http://localhost:5173
3. 点击"开始使用"
4. 填写注册表单并提交
5. 检查 Supabase Dashboard > Authentication > Users
6. 应该看到新用户出现

### 6.2 测试数据库插入
1. 注册/登录后，创建一个项目
2. 检查 Supabase Dashboard > Table Editor > projects
3. 应该看到新项目记录

### 6.3 测试存储上传
1. 在项目中上传一张图片
2. 检查 Supabase Dashboard > Storage > user-assets
3. 应该看到上传的文件

## 常见问题

### Q: 注册后没有收到确认邮件？
A:
1. 检查垃圾邮件文件夹
2. 在 Supabase > Authentication > Settings 中可以禁用邮箱确认
3. 开发环境可以直接在 Users 表中手动确认用户

### Q: RLS 策略阻止了我的操作？
A:
1. 检查 SQL 日志查看具体错误
2. 确保用户已登录（`auth.uid()` 不为空）
3. 暂时可以在测试时禁用 RLS，记得生产环境重新启用

### Q: 存储上传失败？
A:
1. 检查存储桶是否设置为 public
2. 检查存储策略是否正确
3. 检查文件大小限制（免费版 50MB）

### Q: 如何重置数据库？
A:
1. 在 SQL Editor 中运行：
```sql
-- 删除所有表（小心！）
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```
2. 重新运行 `database-schema.sql`

## 生产环境部署

### 更新环境变量
部署到 Netlify/Vercel 时：

1. 添加环境变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. 更新 Supabase 的 Site URL 和 Redirect URLs:
   - Site URL: `https://your-domain.com`
   - Redirect URLs: `https://your-domain.com`, `https://your-domain.com/auth/callback`

### 安全建议

1. **永远不要提交 service_role 密钥**到代码库
2. **启用 RLS** 在所有表上
3. **定期审查** Authentication Logs
4. **设置速率限制** 防止滥用
5. **备份数据库** 定期导出

## 下一步

- [ ] 完成 Supabase 设置
- [ ] 测试用户注册/登录
- [ ] 测试项目创建/保存
- [ ] 测试文件上传
- [ ] 配置生产环境
- [ ] 设置数据库备份

## 相关资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Row Level Security 指南](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage 指南](https://supabase.com/docs/guides/storage)
- [OAuth 配置](https://supabase.com/docs/guides/auth/social-login)

## 技术支持

遇到问题？
- 查看 Supabase 文档
- 检查浏览器控制台错误
- 查看 Supabase Dashboard 日志
- 联系 Supabase 社区: https://github.com/supabase/supabase/discussions

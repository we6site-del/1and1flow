# 🔐 RLS + JWT Token 权限配置完整指南

## 📚 核心概念

### 1. RLS (Row Level Security) - 行级安全

RLS 是 Supabase/PostgreSQL 的安全机制，允许你在数据库层面控制哪些用户可以访问哪些数据行。

**工作原理**：
- 每个表可以启用 RLS
- 通过 Policy（策略）定义访问规则
- 策略在每次查询时自动应用
- 即使应用代码有 bug，数据库也会强制执行安全规则

### 2. JWT Token - JSON Web Token

JWT Token 是 Supabase 用于身份验证和授权的机制。

**Token 结构**：
```
Header.Payload.Signature
```

**Payload 包含**：
- `sub`: 用户 ID
- `email`: 用户邮箱
- `app_metadata`: 应用元数据（包括 `role`）
- `user_metadata`: 用户元数据
- `exp`: 过期时间

## 🎯 完整配置流程

### 步骤 1: 设置 Admin 角色

在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 方法 1: 直接更新（推荐用于开发）
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'your-email@example.com';

-- 方法 2: 使用 Helper 函数（更安全）
SELECT public.set_user_as_admin('your-email@example.com');
```

**验证设置**：
```sql
SELECT 
  email,
  raw_app_meta_data->>'role' as role,
  raw_app_meta_data as full_metadata
FROM auth.users
WHERE email = 'your-email@example.com';
```

**应该看到**：
```json
{
  "role": "admin"
}
```

### 步骤 2: 配置 RLS 策略

#### 2.1 AI Models 表策略

```sql
-- 1. 启用 RLS
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

-- 2. 普通用户只能查看活跃模型
CREATE POLICY "Anyone can view active models" ON public.ai_models
  FOR SELECT 
  USING (
    is_active = true 
    AND (
      auth.role() IS NULL 
      OR auth.role() = 'anon'
      OR (
        auth.role() = 'authenticated' 
        AND (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin'
      )
    )
  );

-- 3. Admin 用户可以查看所有模型（包括非活跃的）
CREATE POLICY "Admin users can view all models" ON public.ai_models
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 4. Admin 用户可以管理所有模型（INSERT, UPDATE, DELETE）
CREATE POLICY "Admin users can manage models" ON public.ai_models
  FOR ALL
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 5. Service Role 可以管理所有模型（用于后端操作）
CREATE POLICY "Service role can manage models" ON public.ai_models
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');
```

#### 2.2 Profiles 表策略

```sql
-- 1. 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. 用户可以查看自己的 profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 3. 用户可以更新自己的 profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Admin 用户可以查看所有 profiles
CREATE POLICY "Admin users can view all profiles" ON public.profiles
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 5. Admin 用户可以管理所有 profiles
CREATE POLICY "Admin users can manage all profiles" ON public.profiles
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
```

### 步骤 3: 刷新 JWT Token

**重要**：设置 admin 角色后，必须刷新 JWT token 才能生效！

#### 方法 1: 登出并重新登录（推荐）

1. 完全登出应用
2. 清除浏览器缓存和 Cookies
3. 重新登录
4. 新的 JWT token 会包含最新的 `app_metadata`

#### 方法 2: 等待 Token 自动刷新

Supabase 会自动刷新 token（通常 15-30 分钟），但建议手动刷新。

#### 方法 3: 程序化刷新（如果需要）

```typescript
// 在前端代码中
const { data: { session }, error } = await supabase.auth.refreshSession();
```

### 步骤 4: 验证配置

#### 4.1 验证 RLS 策略

```sql
-- 检查所有策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as condition
FROM pg_policies
WHERE tablename IN ('ai_models', 'profiles')
ORDER BY tablename, policyname;
```

**应该看到**：
- `Admin users can view all models` (SELECT)
- `Admin users can manage models` (ALL)
- `Admin users can view all profiles` (SELECT)
- `Admin users can manage all profiles` (UPDATE)

#### 4.2 验证 JWT Token

在浏览器控制台运行：

```javascript
// 方法 1: 从 localStorage 读取
const keys = Object.keys(localStorage).filter(k => k.includes('supabase') && k.includes('auth'));
if (keys.length > 0) {
  const authData = JSON.parse(localStorage.getItem(keys[0]));
  if (authData?.access_token) {
    const payload = JSON.parse(atob(authData.access_token.split('.')[1]));
    console.log('User role:', payload.app_metadata?.role);
    console.log('Full app_metadata:', payload.app_metadata);
  }
}

// 方法 2: 从 Network 请求中获取
// 1. 打开 Network 标签
// 2. 访问 /admin/ai-models
// 3. 找到 Supabase 请求
// 4. 查看 Authorization header
// 5. 复制 token 到 https://jwt.io 解码
```

**必须看到**：
```json
{
  "app_metadata": {
    "role": "admin"
  }
}
```

#### 4.3 测试查询

```sql
-- 在 Supabase SQL Editor 中测试（使用 Service Role）
-- 这会绕过 RLS，显示实际数据

-- 检查数据是否存在
SELECT COUNT(*) FROM public.ai_models;
SELECT COUNT(*) FROM public.profiles;

-- 查看最近的记录
SELECT id, name, type, is_active 
FROM public.ai_models 
ORDER BY created_at DESC 
LIMIT 5;
```

## 🔍 策略语法详解

### RLS 策略的关键部分

```sql
CREATE POLICY "policy_name" ON table_name
  FOR operation  -- SELECT, INSERT, UPDATE, DELETE, 或 ALL
  USING (condition)  -- 检查现有行
  WITH CHECK (condition);  -- 检查新行/更新后的行
```

### 常用条件函数

1. **`auth.uid()`** - 当前用户的 UUID
   ```sql
   USING (auth.uid() = user_id)  -- 只能访问自己的数据
   ```

2. **`auth.role()`** - 当前认证角色
   ```sql
   USING (auth.role() = 'authenticated')  -- 必须是已认证用户
   ```

3. **`auth.jwt()`** - 完整的 JWT payload
   ```sql
   USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')  -- 检查 admin 角色
   ```

4. **`auth.jwt() ->> 'role'`** - Service Role 检查
   ```sql
   USING (auth.jwt() ->> 'role' = 'service_role')  -- Service Role 可以访问所有数据
   ```

## ⚠️ 常见问题和解决方案

### 问题 1: 设置了 admin 角色但还是无法访问

**原因**: JWT token 没有刷新

**解决**:
1. 完全登出
2. 清除缓存
3. 重新登录

### 问题 2: 策略存在但查询返回空

**可能原因**:
1. JWT token 中的 `app_metadata.role` 不是 `"admin"`（注意是字符串）
2. 策略条件写错了

**检查**:
```sql
-- 检查策略条件
SELECT qual::text FROM pg_policies 
WHERE policyname = 'Admin users can view all models';

-- 应该看到类似：
-- (auth.role() = 'authenticated' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
```

### 问题 3: 创建成功但查询不到

**原因**: `WITH CHECK` 子句阻止了插入

**解决**: 确保策略包含 `WITH CHECK`：
```sql
CREATE POLICY "Admin users can manage models" ON public.ai_models
  FOR ALL
  USING (...)
  WITH CHECK (...);  -- 必须有这个！
```

### 问题 4: 策略冲突

**原因**: 多个策略可能冲突

**解决**: Supabase 使用 OR 逻辑，只要有一个策略允许就可以。确保：
- Admin 策略条件明确（不与其他策略重叠）
- 使用 `IS DISTINCT FROM` 而不是 `!=` 来避免 NULL 问题

## 🎯 最佳实践

### 1. 策略命名规范

```sql
-- 格式: "[用户类型] can [操作] [范围]"
"Users can view own profile"
"Admin users can view all models"
"Service role can manage all profiles"
```

### 2. 策略组织

```sql
-- 先创建基础策略（用户自己的数据）
CREATE POLICY "Users can view own X" ...

-- 再创建 admin 策略（所有数据）
CREATE POLICY "Admin users can view all X" ...

-- 最后创建 service role 策略（完全访问）
CREATE POLICY "Service role can manage all X" ...
```

### 3. 测试策略

```sql
-- 创建测试函数
CREATE OR REPLACE FUNCTION test_admin_access()
RETURNS TABLE (
  table_name TEXT,
  policy_count INT,
  can_select BOOLEAN
) AS $$
BEGIN
  -- 测试逻辑
END;
$$ LANGUAGE plpgsql;
```

### 4. 文档化

为每个策略添加注释：
```sql
-- Policy: Admin users can view all models
-- Purpose: Allow admin users to see all AI models (including inactive ones)
-- Used by: Admin panel
CREATE POLICY "Admin users can view all models" ...
```

## 📋 完整检查清单

在部署到生产环境前，确保：

- [ ] 所有表都启用了 RLS
- [ ] Admin 用户角色已设置
- [ ] JWT token 已刷新（登出重新登录）
- [ ] 所有策略都已创建
- [ ] 策略条件正确（检查 `app_metadata.role = 'admin'`）
- [ ] `WITH CHECK` 子句已添加（用于 INSERT/UPDATE）
- [ ] Service Role 策略已添加（用于后端操作）
- [ ] 测试了所有 CRUD 操作
- [ ] 验证了普通用户无法访问 admin 数据
- [ ] 验证了 admin 用户可以访问所有数据

## 🔗 相关资源

- [Supabase RLS 文档](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS 文档](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [JWT.io](https://jwt.io) - JWT Token 解码工具

## 💡 快速参考

### 设置 Admin 用户
```sql
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'your-email@example.com';
```

### 创建 Admin 策略模板
```sql
-- 查看所有数据
CREATE POLICY "Admin users can view all [table]" ON public.[table]
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 管理所有数据
CREATE POLICY "Admin users can manage all [table]" ON public.[table]
  FOR ALL
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
```









# 🔍 后台管理系统问题排查指南

## 问题症状
1. 创建AI模型提示成功，但不显示
2. 用户列表为空
3. 后台管理系统显示"No data found"

## 完整排查步骤

### 步骤 1: 运行诊断脚本

在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 文件: 20250109_diagnose_admin_issues.sql
```

这会显示：
- 当前的RLS策略
- 实际数据数量
- Admin用户信息
- 最近的记录

### 步骤 2: 应用完整的策略修复

执行：

```sql
-- 文件: 20250110_fix_all_admin_policies_comprehensive.sql
```

这会重新创建所有RLS策略，确保admin用户可以访问所有数据。

### 步骤 3: 验证Admin用户角色

```sql
-- 检查你的用户是否是admin
SELECT 
  email,
  raw_app_meta_data->>'role' as role,
  raw_app_meta_data as full_metadata
FROM auth.users
WHERE email = 'YOUR_EMAIL@example.com';
```

**必须看到**: `role: "admin"` 在 `raw_app_meta_data` 中

如果不是admin，执行：

```sql
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'YOUR_EMAIL@example.com';
```

### 步骤 4: 检查数据是否真的存在

```sql
-- 检查ai_models（绕过RLS）
SELECT COUNT(*) as total, 
       COUNT(*) FILTER (WHERE is_active = true) as active
FROM public.ai_models;

-- 检查profiles（绕过RLS）
SELECT COUNT(*) as total FROM public.profiles;

-- 查看最近的ai_models
SELECT id, name, type, is_active, created_at 
FROM public.ai_models 
ORDER BY created_at DESC 
LIMIT 5;
```

### 步骤 5: 测试RLS策略

```sql
-- 检查策略是否存在
SELECT policyname, cmd, qual::text 
FROM pg_policies 
WHERE tablename = 'ai_models' 
AND policyname LIKE '%admin%';
```

应该看到：
- `Admin users can view all models` (SELECT)
- `Admin users can manage models` (ALL)

### 步骤 6: 检查浏览器端

1. **打开浏览器开发者工具** (F12)
2. **查看 Network 标签**
3. **访问 `/admin/ai-models`**
4. **查找对 Supabase 的请求** (通常是 `rest/v1/ai_models`)
5. **检查请求头**:
   - 应该有 `Authorization: Bearer ...`
   - 应该有 `apikey: ...`
6. **检查响应**:
   - 如果是 401: 认证问题
   - 如果是 200 但数据为空: RLS策略问题
   - 如果是 200 且有数据: 前端显示问题

### 步骤 7: 验证JWT Token中的角色

在浏览器控制台运行：

```javascript
// 获取当前用户的JWT token
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  // 解码JWT (需要安装jwt-decode或使用在线工具)
  const payload = JSON.parse(atob(session.access_token.split('.')[1]));
  console.log('User role:', payload.app_metadata?.role);
  console.log('Full payload:', payload);
}
```

**必须看到**: `app_metadata.role = "admin"`

### 步骤 8: 清除缓存并重新登录

1. **登出**当前账户
2. **清除浏览器缓存和Cookies**
3. **重新登录**
4. **访问** `/admin/ai-models`

JWT token需要刷新才能获取新的 `app_metadata`。

## 常见问题及解决方案

### Q1: 策略存在但数据还是看不到？

**可能原因**: JWT token没有包含最新的 `app_metadata`

**解决**:
1. 登出并重新登录
2. 或者等待token自动刷新（通常15-30分钟）

### Q2: 创建成功但查询不到？

**可能原因**: RLS策略的 `WITH CHECK` 子句阻止了插入

**解决**: 确保 `Admin users can manage models` 策略包含 `WITH CHECK` 子句

### Q3: 数据存在但前端显示为空？

**可能原因**: 
1. 前端查询参数错误
2. Refine dataProvider配置问题

**解决**: 检查浏览器Network标签中的实际请求URL和参数

### Q4: 401 Unauthorized错误？

**可能原因**: 
1. 用户未登录
2. Token过期
3. Supabase client配置错误

**解决**: 
1. 检查是否已登录
2. 刷新页面
3. 检查 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 是否正确

## 快速修复命令

如果以上都不行，执行这个完整的重置：

```sql
-- 1. 确保你是admin
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'YOUR_EMAIL@example.com';

-- 2. 应用所有策略修复
-- (执行 20250110_fix_all_admin_policies_comprehensive.sql)

-- 3. 创建缺失的profiles
INSERT INTO public.profiles (id, email, credits, is_pro, created_at)
SELECT 
  u.id,
  u.email,
  100,
  false,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

然后：
1. **登出**
2. **清除缓存**
3. **重新登录**
4. **访问后台**

## 如果还是不行

请提供以下信息：

1. **诊断脚本的输出** (步骤1)
2. **浏览器Network标签的截图** (步骤6)
3. **JWT payload的内容** (步骤7)
4. **具体的错误信息** (浏览器控制台)









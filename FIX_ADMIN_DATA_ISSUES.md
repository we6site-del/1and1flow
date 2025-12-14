# 🔧 修复管理员数据查看问题

## 问题
1. 创建的AI模型无法显示
2. 用户列表为空（应该显示admin账户）

## 解决方案

### 步骤 1: 应用所有迁移文件

在 Supabase Dashboard 的 SQL Editor 中，按顺序执行以下迁移：

1. **`20250106_fix_admin_profiles_policy.sql`** - 修复profiles表的RLS策略
2. **`20250107_ensure_admin_can_view_all_data.sql`** - 确保admin可以查看所有数据
3. **`20250108_create_profile_for_existing_users.sql`** - 为现有用户创建profiles

### 步骤 2: 验证RLS策略

执行以下SQL检查策略是否正确：

```sql
-- 检查profiles表的策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 检查ai_models表的策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'ai_models'
ORDER BY policyname;
```

### 步骤 3: 检查数据

```sql
-- 检查是否有profiles
SELECT COUNT(*) as profile_count FROM public.profiles;

-- 检查是否有ai_models
SELECT COUNT(*) as model_count FROM public.ai_models;

-- 检查admin用户
SELECT 
  u.id,
  u.email,
  u.raw_app_meta_data->>'role' as role,
  p.id as profile_id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.raw_app_meta_data->>'role' = 'admin';
```

### 步骤 4: 如果profiles为空，创建profiles

如果步骤3显示没有profiles，执行：

```sql
-- 为所有auth.users创建profiles
SELECT public.create_missing_profiles();
```

### 步骤 5: 如果ai_models为空，检查示例数据

如果步骤3显示没有ai_models，检查迁移文件 `20250101_add_ai_models_table.sql` 是否已执行。

## 验证步骤

1. ✅ 应用所有迁移文件
2. ✅ 刷新浏览器页面
3. ✅ 检查 `/admin/profiles` - 应该能看到用户列表
4. ✅ 检查 `/admin/ai-models` - 应该能看到AI模型列表

## 如果问题仍然存在

1. **检查浏览器控制台** - 看是否有401或其他错误
2. **检查Network标签** - 看API请求的响应
3. **确认用户角色**：
   ```sql
   SELECT email, raw_app_meta_data FROM auth.users WHERE email = 'YOUR_EMAIL';
   ```
   应该看到 `{"role": "admin"}`

4. **测试RLS策略**：
   ```sql
   -- 模拟admin用户查询（需要替换为实际的admin user id）
   SET LOCAL role = 'authenticated';
   SET LOCAL request.jwt.claim.role = 'authenticated';
   SET LOCAL request.jwt.claim.app_metadata = '{"role": "admin"}'::jsonb;
   SELECT * FROM public.profiles LIMIT 5;
   ```


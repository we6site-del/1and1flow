# ⚡ RLS + JWT 快速设置指南

## 🎯 5 分钟快速配置

### 步骤 1: 设置 Admin 角色（30秒）

在 Supabase SQL Editor 执行：

```sql
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'your-email@example.com';
```

### 步骤 2: 应用 RLS 策略（2分钟）

执行迁移文件：
- `20250110_fix_all_admin_policies_comprehensive.sql`

或手动执行：

```sql
-- AI Models
CREATE POLICY "Admin users can view all models" ON public.ai_models
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Profiles  
CREATE POLICY "Admin users can view all profiles" ON public.profiles
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
```

### 步骤 3: 刷新 Token（1分钟）

1. **登出**应用
2. **清除浏览器缓存**
3. **重新登录**

### 步骤 4: 验证（1分钟）

在浏览器控制台运行：

```javascript
// 检查 JWT token 中的角色
const keys = Object.keys(localStorage).filter(k => k.includes('supabase') && k.includes('auth'));
const authData = JSON.parse(localStorage.getItem(keys[0]));
const payload = JSON.parse(atob(authData.access_token.split('.')[1]));
console.log('Role:', payload.app_metadata?.role); // 应该显示 "admin"
```

## ✅ 验证清单

- [ ] Admin 角色已设置（SQL 查询确认）
- [ ] RLS 策略已创建（pg_policies 查询确认）
- [ ] 已登出并重新登录
- [ ] JWT token 包含 `app_metadata.role = "admin"`
- [ ] 后台可以正常显示数据

## 🐛 如果还是不行

1. **检查策略是否存在**：
   ```sql
   SELECT policyname FROM pg_policies 
   WHERE tablename = 'ai_models' 
   AND policyname LIKE '%admin%';
   ```

2. **检查数据是否存在**：
   ```sql
   SELECT COUNT(*) FROM public.ai_models;  -- 应该 > 0
   ```

3. **检查 JWT token**：
   - 使用 https://jwt.io 解码 token
   - 确认 `app_metadata.role = "admin"`

4. **清除所有缓存**：
   - 浏览器缓存
   - localStorage
   - Cookies
   - 重新登录

## 📚 详细文档

查看 `RLS_JWT_PERMISSIONS_GUIDE.md` 获取完整指南。









# ⚡ 快速设置管理员账户

## 最简单的方法（推荐）

### 方法 1: 使用 SQL Editor（最快）

1. **打开 Supabase Dashboard**
   - 登录你的 Supabase 项目
   - 进入 **SQL Editor**

2. **执行以下 SQL**（替换为你的邮箱）：
   ```sql
   UPDATE auth.users
   SET raw_app_meta_data = jsonb_set(
     COALESCE(raw_app_meta_data, '{}'::jsonb),
     '{role}',
     '"admin"'
   )
   WHERE email = 'we6site@gmail.com';
   ```

3. **验证设置**：
   ```sql
   SELECT 
     email,
     raw_app_meta_data->>'role' as role
   FROM auth.users
   WHERE email = 'we6site@gmail.com';
   ```
   应该看到 `role: admin`

4. **登出并重新登录**你的账户

5. **访问** `/admin` - 应该可以正常访问了！

---

## 使用 Helper 函数（更安全）

如果你已经运行了迁移 `20250103_setup_admin_role.sql`，可以使用更安全的方式：

```sql
-- 设置管理员
SELECT public.set_user_as_admin('your-email@example.com');

-- 查看所有管理员
SELECT * FROM public.list_admins();

-- 移除管理员权限
SELECT public.remove_admin_role('user-email@example.com');
```

---

## 开发环境快速设置（所有用户都是管理员）

⚠️ **仅用于开发环境！**

```sql
-- 将所有用户设置为管理员（仅开发）
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
);
```

---

## 验证步骤

设置完成后：

1. ✅ **登出当前账户**
2. ✅ **重新登录**
3. ✅ **访问** `http://localhost:3000/admin`
4. ✅ **应该能看到 Admin Panel**

如果还是不行：

1. **检查浏览器控制台** - 看是否有错误
2. **检查 Network 标签** - 看 `/admin` 请求的响应
3. **清除浏览器缓存和 Cookies**
4. **确认角色设置**：
   ```sql
   SELECT 
     email,
     raw_app_meta_data
   FROM auth.users
   WHERE email = 'YOUR_EMAIL@example.com';
   ```
   应该看到 `{"role": "admin"}`

---

## 常见问题

### Q: 设置了但还是无法访问？
A: 
- 确保已**登出并重新登录**（JWT token 需要刷新才能获取新的 app_metadata）
- 清除浏览器缓存
- 检查 `raw_app_meta_data` 中确实有 `"role": "admin"`（注意是字符串）

### Q: 如何查看当前用户的角色？
A: 在浏览器控制台运行：
```javascript
const { data: { user } } = await supabase.auth.getUser()
console.log('User role:', user?.app_metadata?.role)
```

### Q: 可以设置多个管理员吗？
A: 可以！只需要给多个用户执行相同的 SQL 即可。

---

**设置完成后，你应该能够正常访问 `/admin` 了！** 🎉









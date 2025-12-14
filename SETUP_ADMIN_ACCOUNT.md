# 🔐 设置管理员账户指南

## 问题
无法访问 `/admin` 路由，因为 middleware 检查用户角色必须是 `admin`。

## 解决方案

### 方法 1: 通过 Supabase Dashboard（推荐）

1. **登录 Supabase Dashboard**
   - 访问你的 Supabase 项目
   - 进入 **Authentication** → **Users**

2. **找到你的用户账户**
   - 在用户列表中找到你要设置为管理员的用户
   - 点击用户进入详情页

3. **设置 Admin Role**
   - 在用户详情页，找到 **User Metadata** 或 **Raw App Meta Data** 部分
   - 点击 **Edit** 或 **Add Metadata**
   - 添加以下 JSON：
   ```json
   {
     "role": "admin"
   }
   ```
   - 保存更改

### 方法 2: 通过 SQL（快速批量设置）

1. **打开 Supabase SQL Editor**
   - 在 Dashboard 中进入 **SQL Editor**

2. **执行以下 SQL**
   ```sql
   -- 将特定用户设置为管理员（替换 YOUR_USER_EMAIL 为实际邮箱）
   UPDATE auth.users
   SET raw_app_meta_data = jsonb_set(
     COALESCE(raw_app_meta_data, '{}'::jsonb),
     '{role}',
     '"admin"'
   )
   WHERE email = 'YOUR_USER_EMAIL@example.com';
   ```

   或者，如果你想将当前所有用户都设置为管理员（仅用于开发测试）：
   ```sql
   -- ⚠️ 警告：这会将所有用户设置为管理员，仅用于开发环境
   UPDATE auth.users
   SET raw_app_meta_data = jsonb_set(
     COALESCE(raw_app_meta_data, '{}'::jsonb),
     '{role}',
     '"admin"'
   );
   ```

3. **验证设置**
   ```sql
   -- 检查哪些用户是管理员
   SELECT 
     id,
     email,
     raw_app_meta_data->>'role' as role
   FROM auth.users
   WHERE raw_app_meta_data->>'role' = 'admin';
   ```

### 方法 3: 通过 Supabase Admin API（程序化）

如果你需要通过代码设置，可以使用 Supabase Admin API：

```typescript
// 在 Node.js 或后端代码中
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // 使用 Service Role Key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 更新用户角色
const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
  'USER_ID_HERE',
  {
    app_metadata: { role: 'admin' }
  }
)
```

### 方法 4: 创建设置脚本（开发环境）

创建一个临时脚本用于快速设置：

```typescript
// scripts/setup-admin.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function setupAdmin(email: string) {
  // 1. 查找用户
  const { data: users, error: findError } = await supabase.auth.admin.listUsers()
  const user = users?.users.find(u => u.email === email)
  
  if (!user) {
    console.error(`User with email ${email} not found`)
    return
  }

  // 2. 更新用户角色
  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    {
      app_metadata: { role: 'admin' }
    }
  )

  if (error) {
    console.error('Error setting admin role:', error)
  } else {
    console.log(`✅ Successfully set ${email} as admin`)
  }
}

// 使用
setupAdmin('your-email@example.com')
```

## 验证设置

设置完成后，验证步骤：

1. **登出当前账户**（如果已登录）
2. **重新登录**
3. **访问 `/admin`**
4. **应该能够正常访问**

如果还是无法访问，检查：

1. **浏览器控制台**：查看是否有错误信息
2. **Network 标签**：检查 `/admin` 请求的响应
3. **Middleware 日志**：检查 middleware 是否正确检查了角色

## 临时解决方案（仅开发环境）

如果你只是想快速测试 admin 功能，可以临时修改 middleware 来跳过角色检查：

```typescript
// frontend/src/utils/supabase/middleware.ts
// ⚠️ 仅用于开发测试，生产环境必须删除

if (request.nextUrl.pathname.startsWith("/admin")) {
  if (!user) {
    // ... 重定向到登录
  }

  // 临时：开发环境跳过角色检查
  if (process.env.NODE_ENV === 'development') {
    // 允许所有登录用户访问（仅开发）
    return supabaseResponse;
  }

  // 生产环境：检查 admin 角色
  const role = user.app_metadata?.role;
  if (role !== "admin") {
    // ... 重定向到首页
  }
}
```

## 安全建议

1. **生产环境**：
   - 只给必要的人员设置 admin 角色
   - 定期审查管理员列表
   - 使用强密码和 2FA

2. **开发环境**：
   - 可以临时放宽限制以便测试
   - 但不要提交包含跳过检查的代码

3. **审计**：
   - 所有管理员操作都会记录在 `admin_audit_logs` 表中
   - 定期检查审计日志

## 常见问题

### Q: 设置了 admin 角色但还是无法访问？
A: 
1. 确保已登出并重新登录（JWT token 需要刷新）
2. 检查 `app_metadata.role` 是否正确设置为 `"admin"`（字符串，不是对象）
3. 清除浏览器缓存和 cookies

### Q: 如何查看当前用户的角色？
A: 在浏览器控制台运行：
```javascript
const { data: { user } } = await supabase.auth.getUser()
console.log('User role:', user?.app_metadata?.role)
```

### Q: 可以设置多个管理员吗？
A: 可以，只需要给多个用户设置 `app_metadata.role = 'admin'` 即可。

---

**下一步**：设置完成后，你应该能够正常访问 `/admin` 路由了！









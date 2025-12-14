# Version 59: Database Table Name Fix

## 问题描述

在之前的版本中，代码中使用的数据库表名为 `user_profiles`，但 Supabase 数据库中实际的表名是 `profiles`。这导致了以下错误：

```
Request to URL "https://ukpbtmtmeyiqlojyorel.supabase.co/rest/v1/user_profiles?select=*&id=eq.xxx" failed
Response: {
  "code": "PGRST205",
  "details": null,
  "hint": "Perhaps you meant the table 'public.profiles'",
  "message": "Could not find the table 'public.user_profiles' in the schema cache"
}
```

这个问题导致用户信息无法正确获取和同步。

## 修复内容

### 1. 更新用户状态管理 (`src/stores/userStore.ts`)

修复了两处表名引用：

```typescript
// 获取用户配置文件
const { data: profile, error } = await supabase
  .from('profiles')  // 原来是 'user_profiles'
  .select('*')
  .eq('id', user.id)
  .single()

// 更新用户配置
const { error } = await supabase
  .from('profiles')  // 原来是 'user_profiles'
  .update(updates)
  .eq('id', user.id)
```

### 2. 更新协作功能 (`src/lib/collaboration.ts`)

修复了三处表名引用：

```typescript
// 查找被邀请用户
const { data: invitedUser, error: userError } = await supabase
  .from('profiles')  // 原来是 'user_profiles'
  .select('id')
  .eq('email', params.userEmail)
  .single()

// 获取项目协作者
const { data, error } = await supabase
  .from('project_collaborators')
  .select(`
    *,
    user:profiles(id, email, full_name, avatar_url)  // 原来是 user:user_profiles
  `)
  .eq('project_id', projectId)
  .eq('status', 'accepted')

// 获取项目评论
const { data, error } = await supabase
  .from('project_comments')
  .select(`
    *,
    user:profiles(id, email, full_name, avatar_url)  // 原来是 user:user_profiles
  `)
  .eq('project_id', projectId)
  .order('created_at', { ascending: false })
```

### 3. 更新数据库架构文件

统一更新了所有 SQL 架构文件中的表名：
- `database-schema.sql`
- `database-schema-collaboration.sql`

所有 `user_profiles` 引用都已更新为 `profiles`。

## 用户信息同步

修复后，用户信息现在可以正确地在以下位置同步：

1. **登录后自动跳转到 Dashboard**
   - 用户信息显示在右上角的 UserDropdown 组件中
   - 包含头像、姓名、邮箱、积分等信息

2. **Dashboard 界面**
   - 左上角显示用户头像和名称
   - 点击可展开下拉菜单，包含：
     - 个人资料
     - 我的积分
     - 订阅管理
     - 退出登录

3. **Canvas 画布界面**
   - 右上角显示用户按钮和积分
   - 点击可展开用户面板，包含：
     - 用户信息卡片
     - 积分余额
     - 快捷操作（我的作品、生成历史、设置）
     - 退出登录

## 测试步骤

1. 确保 Supabase 数据库中的表名为 `profiles`
2. 点击 "开始使用" 或 "立即开始创作" 按钮
3. 在弹出的登录/注册模态框中登录
4. 验证登录后自动跳转到 Dashboard
5. 验证 Dashboard 左上角显示用户信息
6. 创建新项目进入画布
7. 验证画布右上角显示用户按钮和积分
8. 点击用户按钮查看详细信息

## 技术细节

### 表名一致性

所有代码现在统一使用 `profiles` 作为用户配置表名，与 Supabase 默认的表命名约定保持一致。

### 关联查询

在需要关联用户信息的查询中，使用正确的表名引用：

```typescript
user:profiles(id, email, full_name, avatar_url)
```

这确保了在获取协作者和评论时，能够正确地关联用户信息。

## 下一步

1. 测试完整的登录流程
2. 验证所有用户相关功能正常工作
3. 测试项目创建和协作功能
4. 部署前进行全面测试

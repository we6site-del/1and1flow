# 用户头像显示总结

## 头像数据来源优先级

在所有显示用户头像的组件中，头像数据按以下优先级获取：

1. **`profiles.avatar_url`** - 数据库中的头像 URL（最高优先级）
2. **`user.user_metadata.avatar_url`** - Auth 用户元数据中的头像
3. **首字母** - 如果没有头像，显示用户名或邮箱的首字母

## 已修复的组件

### 1. **BottomBar 组件** (`frontend/src/components/canvas/BottomBar.tsx`)
   - ✅ 小头像（底部栏）：显示真实头像或首字母
   - ✅ HoverCard 大头像：显示真实头像或首字母
   - ✅ 从 profiles 表获取 `avatar_url` 和 `username`
   - ✅ 订阅 profile 更新，实时更新头像

### 2. **Header 组件** (`frontend/src/app/[locale]/home/components/Header.tsx`)
   - ✅ 小头像（顶部栏）：显示真实头像或首字母
   - ✅ HoverCard 大头像：显示真实头像或首字母
   - ✅ 从 profiles 表获取 `avatar_url` 和 `username`

### 3. **AccountSettingsDialog 组件** (`frontend/src/components/canvas/AccountSettingsDialog.tsx`)
   - ✅ 显示真实头像
   - ✅ 支持上传新头像到 R2
   - ✅ 保存后实时更新

### 4. **Admin Profiles 列表** (`frontend/src/app/[locale]/admin/profiles/page.tsx`)
   - ✅ 显示每个用户的真实头像
   - ✅ 如果没有头像，显示首字母

## 头像显示逻辑

```typescript
// 优先级顺序
const avatarUrl = 
  profile?.avatar_url ||           // 1. 数据库中的头像
  user?.user_metadata?.avatar_url || // 2. Auth 元数据中的头像
  null;                              // 3. 没有头像

// 显示逻辑
{avatarUrl ? (
  <img src={avatarUrl} alt="avatar" />
) : (
  <span>{首字母}</span>
)}
```

## 头像更新流程

1. **用户上传头像** → 通过 `/api/upload/avatar` 上传到 R2
2. **保存到数据库** → 更新 `profiles.avatar_url`
3. **更新 Auth 元数据** → 更新 `user_metadata.avatar_url`（可选）
4. **实时同步** → 通过 Supabase Realtime 订阅更新所有组件

## 首字母显示逻辑

如果没有头像，按以下优先级显示首字母：

1. `profile.username` 的首字母
2. `user.user_metadata.full_name` 的首字母
3. `user.email` 的首字母
4. "U"（默认）

## 数据获取

所有组件现在都会：
- 从 `profiles` 表获取 `avatar_url`、`username`、`credits`
- 从 `auth.users` 获取 `email`、`user_metadata`
- 合并两个数据源，优先使用 profiles 表中的数据

## 注意事项

- 头像 URL 可以是：
  - R2 存储的 URL（推荐）
  - Supabase Storage URL
  - Base64 数据 URL（备用方案）
  - 外部 URL

- 所有头像都会自动处理加载失败的情况，回退到首字母显示


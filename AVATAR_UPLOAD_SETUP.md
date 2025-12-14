# 头像上传功能设置

## 数据库迁移

首先运行数据库迁移以添加 `username` 和 `bio` 字段：

```sql
-- 在 Supabase SQL Editor 中运行
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username) WHERE username IS NOT NULL;
```

或者运行迁移文件：
```bash
# 在 Supabase Dashboard 的 SQL Editor 中运行
supabase/migrations/20250111_add_username_bio_to_profiles.sql
```

## Supabase Storage 设置

### 1. 创建 avatars bucket

在 Supabase Dashboard 中：

1. 进入 **Storage** 页面
2. 点击 **New bucket**
3. 设置：
   - **Name**: `avatars`
   - **Public bucket**: ✅ 勾选（允许公开访问）
   - **File size limit**: 5 MB（或根据需要调整）
   - **Allowed MIME types**: `image/*`

### 2. 设置 Storage Policies

在 Supabase Dashboard 的 **Storage** > **Policies** 中，为 `avatars` bucket 添加策略：

#### 允许用户上传自己的头像：
```sql
-- 允许用户上传到自己的文件夹
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户更新自己的头像
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户删除自己的头像
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许所有人查看头像（因为是公开 bucket）
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

## 功能说明

### 已实现的功能：

1. ✅ **获取用户信息** - 从 Supabase 获取真实的用户数据和 profile
2. ✅ **上传头像** - 支持上传图片到 Supabase Storage
3. ✅ **编辑用户名** - 更新 username 字段（1-40 字符，仅字母、数字和连字符）
4. ✅ **编辑 Bio** - 更新 bio 字段（最多 200 字符）
5. ✅ **实时显示积分** - 显示用户真实的积分数量
6. ✅ **表单验证** - 用户名格式、长度和 Bio 长度验证
7. ✅ **错误处理** - 完善的错误提示和加载状态

### 使用方式：

1. 打开账户设置对话框
2. 点击 "Edit Profile" 按钮
3. 点击头像区域上传新头像
4. 编辑用户名和 Bio
5. 点击 "Save" 保存更改

### 注意事项：

- 头像文件大小限制：5MB
- 支持的文件类型：所有图片格式
- 用户名要求：1-40 字符，只能包含字母、数字和连字符（-）
- Bio 限制：最多 200 字符


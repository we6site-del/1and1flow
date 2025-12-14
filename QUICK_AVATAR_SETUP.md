# 快速设置头像上传功能

## ✅ 现在使用 Cloudflare R2 存储头像

头像现在通过后端 API 上传到 **Cloudflare R2**，无需设置 Supabase Storage！

## 工作原理

1. 用户在前端选择头像文件
2. 前端通过 `/api/upload/avatar` API 发送到后端
3. 后端将文件上传到 Cloudflare R2 的 `avatars` 文件夹
4. 返回 R2 的公开 URL
5. 头像 URL 保存到数据库

## 需要确保的配置

### 后端环境变量

确保后端 `.env` 文件中有 R2 配置：

```bash
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_DOMAIN=https://<bucket-name>.<account-id>.r2.cloudflarestorage.com
```

### 前端环境变量

确保前端 `.env.local` 文件中有后端 API URL：

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
# 或生产环境：
# NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

## 备用方案

如果 R2 上传失败，代码会自动使用 **base64 数据 URL** 作为备用方案：
- ✅ 无需任何配置
- ✅ 头像数据存储在数据库中
- ⚠️ 注意：base64 数据较大，建议修复 R2 配置

---

## 旧方案（已弃用）：Supabase Storage

如果你之前使用的是 Supabase Storage，现在可以忽略以下内容：

## 方案 1：创建 Supabase Storage Bucket（已弃用）

### 步骤：

1. **登录 Supabase Dashboard**
   - 访问 https://supabase.com/dashboard
   - 选择你的项目

2. **创建 Storage Bucket**
   - 点击左侧菜单的 **Storage**
   - 点击 **New bucket** 按钮
   - 填写以下信息：
     - **Name**: `avatars`
     - **Public bucket**: ✅ **必须勾选**（这样头像才能公开访问）
     - **File size limit**: `5242880` (5MB)
     - **Allowed MIME types**: `image/*`
   - 点击 **Create bucket**

3. **设置 Storage Policies**（可选，但推荐）

   在 **Storage** > **Policies** 页面，为 `avatars` bucket 添加以下策略：

   ```sql
   -- 允许用户上传自己的头像
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

4. **完成！**
   - 现在可以正常上传头像了
   - 头像会存储在 Supabase Storage 中

## 方案 2：使用备用方案（无需设置）

如果不想设置 Storage Bucket，代码会自动使用 **base64 数据 URL** 作为备用方案：

- ✅ 无需任何设置
- ✅ 头像会直接存储在数据库的 `avatar_url` 字段中
- ⚠️ 注意：base64 数据较大，可能影响数据库性能
- ⚠️ 建议：对于生产环境，还是使用方案 1

## 当前代码行为

代码已经实现了智能处理：

1. **首先尝试**：检查 bucket 是否存在
2. **如果不存在**：尝试自动创建 bucket
3. **如果创建失败**：自动切换到 base64 备用方案
4. **如果上传失败**：也会自动切换到 base64 备用方案

所以即使 bucket 不存在，头像上传功能仍然可以工作（使用 base64）。

## 验证设置

上传头像后，检查：

1. **如果使用 Storage**：
   - 头像 URL 应该是：`https://[project].supabase.co/storage/v1/object/public/avatars/...`
   - 可以在 Supabase Dashboard 的 Storage 页面看到上传的文件

2. **如果使用 base64**：
   - 头像 URL 应该是：`data:image/...;base64,...`
   - 数据会直接存储在 `profiles.avatar_url` 字段中

## 推荐设置

对于生产环境，强烈推荐使用 **方案 1**（Supabase Storage），因为：
- ✅ 性能更好
- ✅ 不占用数据库空间
- ✅ 可以轻松管理文件
- ✅ 支持 CDN 加速


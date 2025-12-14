# 🔐 Cloudflare R2 设置指南

## 什么是 Cloudflare R2？

**Cloudflare R2** 是 Cloudflare 提供的对象存储服务，类似于 AWS S3，但有以下优势：
- ✅ **零出口流量费用**（Zero Egress Fees）- 这是最大的优势！
- ✅ **与 S3 API 兼容** - 可以使用 boto3 等标准工具
- ✅ **全球 CDN 加速**
- ✅ **价格更便宜** - 存储费用比 S3 低

## 📋 获取 R2 Key 的步骤

### 1. 登录 Cloudflare Dashboard

访问：https://dash.cloudflare.com/

### 2. 创建 R2 Bucket

1. 在左侧菜单找到 **R2**（或直接访问 https://dash.cloudflare.com/?to=/:account/r2）
2. 点击 **"Create bucket"**
3. 输入 Bucket 名称（例如：`11flow-media`）
4. 选择位置（建议选择离你用户最近的区域）
5. 点击 **"Create bucket"**

### 3. 获取 API Token

1. 在 R2 页面，点击右上角的 **"Manage R2 API Tokens"**
   或者直接访问：https://dash.cloudflare.com/?to=/:account/r2/api-tokens

2. 点击 **"Create API token"**

3. 配置 Token：
   - **Token name**: 输入一个描述性名称（例如：`11flow-backend`）
   - **Permissions**: 选择 **"Object Read & Write"** 或 **"Admin Read & Write"**
   - **TTL**: 选择 **"No expiration"**（或设置一个较长的过期时间）
   - **R2 Bucket**: 选择你刚创建的 bucket，或选择 **"All buckets"**

4. 点击 **"Create API Token"**

5. **重要**：复制并保存以下信息（只显示一次！）：
   - **Access Key ID**
   - **Secret Access Key**

### 4. 获取 Endpoint URL

R2 的 Endpoint URL 格式为：
```
https://<account-id>.r2.cloudflarestorage.com
```

获取 Account ID：
1. 在 Cloudflare Dashboard 右侧，点击你的账户名称
2. 在账户设置中可以看到 **Account ID**

或者，在 R2 bucket 的设置页面，也可以看到 Endpoint URL。

### 5. 配置 Public Domain（可选但推荐）

为了能够通过公开 URL 访问文件，你需要：

1. 在 R2 bucket 设置中，找到 **"Public Access"** 或 **"Custom Domain"**
2. 可以：
   - **选项 A**：使用 Cloudflare 提供的默认域名（格式：`<bucket-name>.<account-id>.r2.cloudflarestorage.com`）
   - **选项 B**：绑定自定义域名（需要配置 DNS）

### 6. 设置环境变量

在你的后端项目（`backend/`）中，创建或更新 `.env` 文件：

```bash
# Cloudflare R2 Configuration
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=11flow-media
R2_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_DOMAIN=https://<bucket-name>.<account-id>.r2.cloudflarestorage.com
# 或者如果你使用了自定义域名：
# R2_PUBLIC_DOMAIN=https://media.yourdomain.com
```

### 7. 验证配置

运行后端服务，检查日志中是否有：
```
Warning: R2 credentials not set in environment variables
```

如果没有这个警告，说明配置成功！

## 🔍 代码中的使用位置

根据代码，R2 在以下位置被使用：

1. **`backend/services/storage.py`**：
   - `upload_to_r2()` 函数负责上传文件到 R2
   - 使用 `boto3` 库与 R2 交互

2. **`backend/routers/generate.py`**：
   - 在 `process_generation_task()` 中，生成完成后调用 `storage.upload_to_r2()` 上传结果

## 📦 安装依赖

确保后端已安装 `boto3`：

```bash
cd backend
pip install boto3
```

## 🧪 测试 R2 连接

你可以创建一个简单的测试脚本：

```python
# test_r2.py
import os
from backend.services.storage import get_s3_client, R2_BUCKET_NAME

def test_r2():
    try:
        s3 = get_s3_client()
        # 列出 bucket 中的文件
        response = s3.list_objects_v2(Bucket=R2_BUCKET_NAME, MaxKeys=5)
        print("✅ R2 连接成功！")
        print(f"Bucket: {R2_BUCKET_NAME}")
        if 'Contents' in response:
            print(f"文件数量: {len(response['Contents'])}")
        else:
            print("Bucket 是空的")
    except Exception as e:
        print(f"❌ R2 连接失败: {e}")

if __name__ == "__main__":
    test_r2()
```

运行：
```bash
python test_r2.py
```

## ⚠️ 安全注意事项

1. **永远不要将 API Token 提交到 Git**
   - 确保 `.env` 文件在 `.gitignore` 中
   - 使用环境变量或密钥管理服务

2. **使用最小权限原则**
   - 只给 Token 必要的权限（Object Read & Write）
   - 不要使用 Admin 权限，除非必要

3. **定期轮换 Token**
   - 建议每 3-6 个月更换一次 API Token

4. **监控使用情况**
   - 在 Cloudflare Dashboard 中监控 R2 的使用量和费用

## 💰 费用说明

Cloudflare R2 的定价（2025年）：
- **存储**: $0.015/GB/月
- **Class A 操作**（写入、列出）: $4.50/百万次
- **Class B 操作**（读取）: $0.36/百万次
- **出口流量**: **免费**（这是最大的优势！）

## 📚 相关文档

- Cloudflare R2 官方文档：https://developers.cloudflare.com/r2/
- R2 API 参考：https://developers.cloudflare.com/r2/api/s3/api/
- 定价页面：https://developers.cloudflare.com/r2/pricing/

## 🆘 常见问题

### Q: 找不到 R2 选项？
A: 确保你的 Cloudflare 账户已启用 R2。某些地区可能需要等待一段时间才能使用。

### Q: API Token 创建后找不到？
A: API Token 的 Secret Access Key 只显示一次，如果丢失需要重新创建。

### Q: 如何查看已创建的 Token？
A: 在 R2 API Tokens 页面可以看到 Token 列表，但无法查看 Secret Key。

### Q: 文件上传成功但无法访问？
A: 检查 `R2_PUBLIC_DOMAIN` 是否正确配置，以及 bucket 的公共访问设置。

---

**完成设置后，你的应用就可以将生成的图片和视频存储到 Cloudflare R2 了！** 🎉









# ⚡ 快速开始指南

## 1️⃣ 部署 AipexBase（5分钟）

```bash
# 克隆仓库
git clone https://gitee.com/kuafuai/aipexbase.git
cd aipexbase

# 初始化数据库
mysql -u root -p -e "CREATE DATABASE aipexbase"
mysql -u root -p aipexbase < install/mysql/init.sql

# 配置数据库连接（编辑此文件）
vim backend/src/main/resources/application-mysql.yml

# 启动
cd backend && mvn spring-boot:run
```

 服务运行在 http://localhost:8080

---

## 2️⃣ 配置 AI 模型（2分钟）

'EOF''EOF' http://localhost:8080，添加模型：

**GPT-4**:
```json
{
  "name": "GPT-4",
  "type": "text",
  "provider": "OpenAI",
  "modelId": "gpt-4-turbo-preview",
  "apiKey": "sk-your-key"
}
```

 API Key: https://platform.openai.com/api-keys

---

## 3️⃣ 配置前端（1分钟）

```bash
cd ai-workflow

# 创建环境变量
cat > .env << 'ENV'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_key
VITE_AIPEXBASE_URL=http://localhost:8080
ENV

# 测试连接
bun run test:aipexbase
```

---

## 4️⃣ 启动应用（1分钟）

```bash
bun install
bun run dev
```

'EOF''EOF' http://localhost:5173

---

## ✅ 测试清单

- [ ] 登录/注册成功
- [ ] 创建项目成功
- [ ] 画布保存/加载正常
- [ ] 图片上传成功
- [ ] AI 生成功能正常
- [ ] 积分扣除正确

---

## 🆘 遇到问题？

#
:
- [部署指南](docs/DEPLOYMENT_GUIDE.md)
- [故障排除](README_DEPLOYMENT.md#故障排除)

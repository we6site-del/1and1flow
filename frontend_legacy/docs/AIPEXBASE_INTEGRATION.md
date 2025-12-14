# AipexBase 集成指南

## 📋 架构概述

本项目采用**双后端架构**，结合两个强大的后端系统：

- **AipexBase**: AI 模型与节点编排核心（AI 任务调度、模型封装）
- **Supabase**: 用户数据库 + 文件存储 + 实时通知 + OAuth 登录

```
前端 (React + Tldraw)
    ↓
├── Supabase (用户/项目/资产管理)
└── AipexBase (AI 任务执行)
```

---

## 🚀 快速开始

### 1. 部署 AipexBase

#### 方式一：源码部署

```bash
# 克隆 AipexBase 仓库
git clone https://gitee.com/kuafuai/aipexbase.git
cd aipexbase

# 初始化数据库
# 导入 install/mysql/init.sql 到你的 MySQL 8.0+ 数据库

# 配置数据库连接
cd backend/src/main/resources
# 编辑 application-mysql.yml，修改 jdbc 配置

# 启动后端
mvn spring-boot:run

# 启动前端管理界面（可选）
cd ../../frontend
npm install
npm run dev
```

AipexBase 后端默认运行在 `http://localhost:8080`

#### 方式二：Docker Compose 部署

```bash
cd aipexbase
docker-compose up -d
```

### 2. 配置前端项目

在本项目根目录创建 `.env` 文件：

```env
# Supabase 配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AipexBase 配置
VITE_AIPEXBASE_URL=http://localhost:8080
VITE_AIPEXBASE_API_KEY=your_api_key
```

### 3. 配置 AI 模型

登录 AipexBase 管理界面 (`http://localhost:8080`)：

1. 进入「模型管理」
2. 添加 AI 模型（文本/图像/视频/音频）
3. 配置模型参数和 API Key

---

## 📖 使用示例

### 在节点中调用 AI 生成

```typescript
import { generateAI } from '@/lib/aiService'

// 文本生成
const result = await generateAI({
  modelId: 'gpt-4',
  modelType: 'text',
  prompt: '写一篇关于 AI 的文章',
  parameters: {
    temperature: 0.7,
    maxTokens: 2000,
  },
  projectId: currentProjectId,
})

if (result.success) {
  console.log('生成内容:', result.output)
  console.log('消耗积分:', result.creditsUsed)
}

// 图像生成
const imageResult = await generateAI({
  modelId: 'dall-e-3',
  modelType: 'image',
  prompt: '一只可爱的猫咪',
  parameters: {
    width: 1024,
    height: 1024,
  },
})
```

### 监听 AI 任务更新

```typescript
import { subscribeToAITasks } from '@/lib/aiService'

// 订阅实时任务更新
const unsubscribe = subscribeToAITasks(
  userId,
  (task) => {
    console.log('任务更新:', task)
    if (task.status === 'completed') {
      console.log('任务完成:', task.output)
    }
  }
)

// 清理订阅
unsubscribe()
```

---

## 🔧 API 参考

### AipexBase 客户端

```typescript
import { aipexbase } from '@/lib/aipexbase'

// 获取可用模型
const models = await aipexbase.getModels('image')

// 创建生成任务
const response = await aipexbase.generate({
  modelId: 'model-id',
  prompt: 'your prompt',
  userId: user.id,
  projectId: project.id,
})

// 等待任务完成
const task = await aipexbase.waitForTask(response.taskId, {
  onProgress: (task) => console.log(task.status),
})
```

### AI 服务层

```typescript
import { generateAI, getAvailableModels } from '@/lib/aiService'

// 获取可用模型
const textModels = await getAvailableModels('text')
const imageModels = await getAvailableModels('image')

// 执行 AI 生成（自动处理积分扣除）
const result = await generateAI({
  modelId: 'model-id',
  modelType: 'text',
  prompt: 'your prompt',
})
```

---

## 💰 积分系统

### 积分消耗规则

| 类型 | 基础消耗 | 额外消耗 |
|------|----------|----------|
| 文本生成 | 10 积分 | 每 1000 tokens 额外 +5 积分 |
| 图像生成 | 50 积分 | 高分辨率 (>1024x1024) +20 积分 |
| 视频生成 | 200 积分 | - |
| 音频生成 | 30 积分 | - |

### 积分管理

```typescript
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

// 检查积分
if (userStore.user.credits < 50) {
  alert('积分不足')
}

// 扣除积分
await userStore.deductCredits(50)

// 添加积分
await userStore.addCredits(100, 'purchase')

// 退还积分（任务失败时）
await userStore.refundCredits(50)
```

---

## 🔒 安全配置

### Supabase RLS 策略

在 Supabase 中配置行级安全策略：

```sql
-- 用户只能访问自己的数据
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 用户只能访问自己的项目
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);
```

### AipexBase API 鉴权

在 AipexBase 配置中启用 API Key 验证：

```yaml
# application.yml
security:
  api:
    enabled: true
    keys:
      - your-api-key-here
```

---

## 🐛 常见问题

### 1. AipexBase 连接失败

**问题**: `Failed to fetch from AipexBase`

**解决方案**:
- 检查 `VITE_AIPEXBASE_URL` 是否正确
- 确保 AipexBase 后端正在运行
- 检查 CORS 配置（如果前端和后端不在同一域名）

### 2. 积分扣除失败

**问题**: 积分未正确扣除

**解决方案**:
- 检查 Supabase 中的 `deduct_credits` RPC 函数是否存在
- 查看浏览器控制台的错误信息
- 在 Demo 模式下（未配置 Supabase），积分仅在本地更新

### 3. AI 任务一直处于 pending 状态

**问题**: 任务长时间未完成

**解决方案**:
- 检查 AipexBase 日志，查看任务执行状态
- 检查 AI 模型配置是否正确
- 查看 API Key 是否有效
- 调整 `waitForTask` 的超时参数

---

## 📚 相关文档

- [AipexBase 官方文档](https://www.codeflying.net)
- [AipexBase GitHub](https://gitee.com/kuafuai/aipexbase)
- [Supabase 文档](https://supabase.com/docs)
- [Tldraw 文档](https://tldraw.dev)

---

## 🆘 技术支持

- **AipexBase 支持**: service@kuafuai.net
- **项目 Issues**: 提交到项目 GitHub

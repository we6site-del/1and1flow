# 后台管理系统架构说明 (Security Architecture)

## 🎯 核心问题解答

### Q1: 后台管理系统安装在哪里？

**答案：前端 (Next.js) 和 后端 (Python) 都有各自的职责**

```
┌─────────────────────────────────────────────────────────┐
│  前端 (Next.js) - Refine Admin                           │
│  ├─ 位置: frontend/src/app/admin/                        │
│  ├─ 职责: UI 界面，配置模型元数据                        │
│  └─ 访问: https://yourdomain.com/admin/ai-models        │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP API
┌─────────────────────────────────────────────────────────┐
│  后端 (Python FastAPI)                                   │
│  ├─ 位置: backend/routers/generate.py                   │
│  ├─ 职责: 执行实际 AI 生成，使用 API 密钥                │
│  └─ 存储: API 密钥在环境变量中 (FAL_KEY, REPLICATE_API) │
└─────────────────────────────────────────────────────────┘
```

### Q2: API 密钥会暴露在前端吗？

**答案：绝对不会！** 这是架构设计的核心安全原则。

## 🔐 安全架构详解

### 1. 数据流和职责分离

#### 前端 Refine Admin (`/admin/ai-models`)
**只存储和配置公开的元数据：**
- ✅ `name`: "Kling 2.1 Master" (模型名称)
- ✅ `type`: "VIDEO" (类型)
- ✅ `provider`: "REPLICATE" (提供商名称)
- ✅ `api_path`: "kling-ai/kling-video-v2" (公开的模型路径，不是密钥)
- ✅ `cost_per_gen`: 160 (积分价格)
- ✅ `parameters_schema`: JSON (UI 参数定义)
- ❌ **绝不存储** API 密钥

#### 后端 Python (`/api/generate`)
**存储和使用敏感密钥：**
- ✅ `FAL_KEY`: 存储在 `backend/.env` 中
- ✅ `REPLICATE_API_TOKEN`: 存储在 `backend/.env` 中
- ✅ 所有 API 调用都在后端执行
- ✅ 前端永远无法访问这些密钥

### 2. 完整的数据流

```
用户操作流程：
┌─────────────────────────────────────────────────────────────┐
│ 1. 管理员在 Refine Admin 配置模型                            │
│    - 填写: name, api_path, cost, parameters_schema          │
│    - 保存到: Supabase ai_models 表                          │
│    - ❌ 不涉及任何 API 密钥                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. 用户在画布上创建生成器节点                                │
│    - 前端调用: GET /api/models                              │
│    - 返回: 模型列表（不含密钥）                             │
│    - 前端渲染: 动态表单（根据 parameters_schema）           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. 用户点击"生成"按钮                                        │
│    - 前端调用: POST /api/generate                           │
│    - 传递: { model_id, prompt, parameters }                │
│    - ❌ 不传递任何 API 密钥                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. 后端处理生成请求                                          │
│    ├─ 根据 model_id 查询数据库获取 api_path 和 provider     │
│    ├─ 从环境变量读取对应的 API 密钥 (FAL_KEY 或 REPLICATE)  │
│    ├─ 调用 Fal.ai 或 Replicate API                         │
│    └─ 返回结果 URL                                           │
│    ✅ 所有敏感操作都在后端完成                              │
└─────────────────────────────────────────────────────────────┘
```

### 3. 数据库设计（安全）

```sql
-- ai_models 表结构
CREATE TABLE ai_models (
  id UUID PRIMARY KEY,
  name TEXT,                    -- ✅ 公开信息
  api_path TEXT,               -- ✅ 公开的模型路径（如 "kling-ai/kling-video-v2"）
  provider TEXT,                -- ✅ 提供商名称（"REPLICATE" 或 "FAL"）
  cost_per_gen INTEGER,         -- ✅ 积分价格
  parameters_schema JSONB,      -- ✅ UI 参数定义
  -- ❌ 不存储任何 API 密钥！
);
```

**关键点：**
- `api_path` 是**公开的模型标识符**，类似于 GitHub 仓库路径
- 就像 `"facebook/react"` 是公开的，不需要密钥就能知道这个路径
- 但**调用**这个模型需要 API 密钥，密钥只存在于后端

### 4. 环境变量配置

#### 后端环境变量 (`backend/.env`)
```bash
# ✅ 这些密钥只存在于后端，前端永远看不到
FAL_KEY=your-fal-key-here
REPLICATE_API_TOKEN=r8_your-replicate-token-here
SUPABASE_SERVICE_KEY=your-service-role-key
```

#### 前端环境变量 (`frontend/.env.local`)
```bash
# ✅ 只有公开的配置
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # Anon Key，不是 Service Role Key
```

### 5. RLS (Row Level Security) 策略

```sql
-- 任何人都可以读取活跃的模型（用于前端显示）
CREATE POLICY "Anyone can view active models" 
ON ai_models FOR SELECT 
USING (is_active = true);

-- 只有 Service Role 可以写入（用于 Refine Admin）
CREATE POLICY "Service role can manage models" 
ON ai_models FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');
```

**这意味着：**
- 普通用户只能**读取**模型列表（用于选择模型）
- 只有管理员（使用 Service Role）可以**创建/编辑**模型
- 即使有人能访问数据库，也看不到 API 密钥（因为密钥不在数据库中）

## 🛡️ 安全最佳实践

### ✅ 正确做法

1. **API 密钥存储**：
   - ✅ 存储在 `backend/.env` 中
   - ✅ 使用环境变量，不提交到 Git
   - ✅ 部署时使用平台的环境变量配置（Railway, Vercel 等）

2. **数据库设计**：
   - ✅ 只存储公开的元数据
   - ✅ 使用 RLS 限制访问权限
   - ✅ 敏感操作通过后端 API

3. **前端职责**：
   - ✅ 只显示和配置元数据
   - ✅ 通过 API 调用后端
   - ✅ 不直接调用第三方 API

### ❌ 错误做法（我们避免了）

1. ❌ 在前端存储 API 密钥
2. ❌ 在数据库中存储 API 密钥
3. ❌ 前端直接调用 Fal.ai 或 Replicate
4. ❌ 将 API 密钥放在 `NEXT_PUBLIC_` 环境变量中

## 📋 总结

### 架构优势

1. **职责分离**：
   - 前端：UI 和配置界面
   - 后端：业务逻辑和 API 调用

2. **安全性**：
   - API 密钥永远不离开后端
   - 数据库只存储公开信息
   - RLS 保护数据访问

3. **灵活性**：
   - 管理员可以在后台配置新模型
   - 无需修改代码
   - 前端自动适配

### 类比理解

想象一下：
- **Refine Admin** = 餐厅的菜单编辑器（可以编辑菜品名称、价格、描述）
- **API 密钥** = 厨房的钥匙（只有厨师能拿到，顾客看不到）
- **后端** = 厨房（使用钥匙制作菜品）
- **前端** = 餐厅大厅（展示菜单，接收订单）

顾客（前端）可以看到菜单（模型列表），但永远拿不到厨房钥匙（API 密钥）。

---

**结论：当前的架构设计是安全的，API 密钥不会暴露在前端。**



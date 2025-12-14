# 🔐 后台管理系统安全 FAQ

## 常见问题解答

### Q1: 后台管理系统安装在哪里？

**A: 前端和后端都有，但职责不同**

```
前端 (Next.js)
├─ 位置: frontend/src/app/admin/
├─ 技术: Refine Admin (React)
├─ 访问: https://yourdomain.com/admin/ai-models
└─ 职责: UI 界面，配置模型元数据

后端 (Python FastAPI)
├─ 位置: backend/routers/generate.py
├─ 技术: FastAPI
├─ 访问: http://localhost:8000/api/generate
└─ 职责: 执行 AI 生成，使用 API 密钥
```

### Q2: API 密钥会暴露在前端吗？

**A: 绝对不会！这是架构设计的核心安全原则。**

#### 关键区别

| 存储内容 | 位置 | 是否暴露 | 示例 |
|---------|------|---------|------|
| **模型路径** (`api_path`) | Supabase 数据库 | ✅ 公开 | `"kling-ai/kling-video-v2"` |
| **API 密钥** (`REPLICATE_API_TOKEN`) | 后端环境变量 | ❌ **绝不暴露** | `r8_xxx...` (只存在于 `backend/.env`) |

**类比理解：**
- `api_path` = GitHub 仓库路径（如 `"facebook/react"`）- 这是公开的
- `API_TOKEN` = GitHub Personal Access Token - 这是私密的，只存在于后端

### Q3: 管理员在后台配置什么？

**管理员在 Refine Admin 中配置的是：**

✅ **可以配置（公开信息）：**
- 模型名称：`"Kling 2.1 Master"`
- API 路径：`"kling-ai/kling-video-v2"` （这是公开的模型标识符）
- 提供商：`"REPLICATE"` 或 `"FAL"`
- 积分价格：`160`
- 参数 Schema：`[{ "key": "duration", "type": "select", ... }]`

❌ **不需要配置（也不应该配置）：**
- `REPLICATE_API_TOKEN` ← 这个在后端环境变量中
- `FAL_KEY` ← 这个在后端环境变量中

### Q4: 完整的生成流程是怎样的？

```
步骤 1: 管理员配置模型（Refine Admin）
├─ 输入: name, api_path, cost, parameters_schema
├─ 保存: 到 Supabase ai_models 表
└─ ❌ 不涉及任何 API 密钥

步骤 2: 用户创建生成器节点（前端 Canvas）
├─ 前端调用: GET /api/models
├─ 返回: 模型列表（不含密钥）
└─ 显示: 动态表单（根据 parameters_schema）

步骤 3: 用户点击生成（前端）
├─ 前端调用: POST /api/generate
├─ 传递: { model_id, prompt, parameters }
└─ ❌ 不传递任何 API 密钥

步骤 4: 后端处理（Python）
├─ 根据 model_id 查询数据库 → 获取 api_path, provider
├─ 从环境变量读取 API 密钥 (FAL_KEY 或 REPLICATE_API_TOKEN)
├─ 调用第三方 API (Fal.ai 或 Replicate)
└─ 返回结果 URL
```

### Q5: 如何确保安全？

#### ✅ 安全措施

1. **环境变量隔离**
   ```bash
   # 后端 .env (私有)
   FAL_KEY=xxx
   REPLICATE_API_TOKEN=xxx
   
   # 前端 .env.local (公开)
   NEXT_PUBLIC_SUPABASE_URL=xxx
   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx  # 这是公开的匿名密钥
   ```

2. **数据库 RLS 策略**
   ```sql
   -- 普通用户只能读取（用于选择模型）
   CREATE POLICY "Anyone can view active models" 
   ON ai_models FOR SELECT USING (is_active = true);
   
   -- 只有管理员可以写入（配置模型）
   CREATE POLICY "Service role can manage models" 
   ON ai_models FOR ALL 
   USING (auth.jwt() ->> 'role' = 'service_role');
   ```

3. **代码验证**
   - ✅ 前端代码中**没有任何** API 密钥引用
   - ✅ 所有第三方 API 调用都在后端完成
   - ✅ 前端只能通过 HTTP API 与后端通信

### Q6: 如果我想添加新模型，需要修改代码吗？

**A: 不需要！这就是配置驱动架构的优势。**

1. **管理员操作**（无需代码）：
   - 登录 Refine Admin (`/admin/ai-models`)
   - 点击 "Create Model"
   - 填写模型信息（name, api_path, cost, parameters_schema）
   - 保存

2. **自动生效**：
   - 前端自动显示新模型
   - 用户可以选择新模型
   - 后端自动使用对应的 API 密钥调用

3. **无需发版**：
   - 不需要修改前端代码
   - 不需要修改后端代码
   - 只需要在后台配置

## 🎯 总结

### 架构优势

1. **安全性** ✅
   - API 密钥永远不离开后端
   - 数据库只存储公开信息
   - 前端无法访问敏感数据

2. **灵活性** ✅
   - 管理员可以动态配置模型
   - 无需修改代码
   - 前端自动适配

3. **职责分离** ✅
   - 前端：UI 和配置界面
   - 后端：业务逻辑和 API 调用
   - 数据库：存储元数据

### 关键要点

- ✅ 后台管理系统在**前端**（Refine Admin UI）
- ✅ API 密钥在**后端**（环境变量）
- ✅ 数据库只存储**公开的元数据**（不存储密钥）
- ✅ 前端**永远无法访问** API 密钥

**你的担心是合理的，但我们的架构设计已经完美解决了这个问题！** 🎉



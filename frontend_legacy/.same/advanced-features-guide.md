# 高级功能设置指南

本指南将帮助您配置和使用 AI Workflow 的所有高级功能，包括自动保存、AI API 集成、支付系统和协作功能。

## 📋 目录

1. [环境配置](#环境配置)
2. [项目自动保存](#项目自动保存)
3. [AI API 集成](#ai-api-集成)
4. [Stripe 支付集成](#stripe-支付集成)
5. [协作功能](#协作功能)
6. [测试和部署](#测试和部署)

---

## 环境配置

### 1. 创建 .env 文件

复制 `.env.example` 并重命名为 `.env`:

```bash
cp .env.example .env
```

### 2. 填写环境变量

打开 `.env` 文件，填写以下信息：

#### Supabase 配置
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

从 Supabase Dashboard > Settings > API 获取

#### AI API 密钥（至少配置一个）
```env
# OpenAI (推荐)
VITE_OPENAI_API_KEY=sk-proj-...

# Anthropic Claude
VITE_ANTHROPIC_API_KEY=sk-ant-...

# Google AI
VITE_GOOGLE_AI_API_KEY=AIza...
```

#### Stripe 配置
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...  # 仅服务端使用
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 项目自动保存

### 功能说明

- ✅ 每 30 秒自动保存画布数据
- ✅ 仅在有变化时保存
- ✅ 离开页面前自动保存
- ✅ 保存状态指示器

### 使用方法

在 `App.tsx` 中添加自动保存 Hook:

```typescript
import { useAutoSave, useSaveStatus } from './hooks/useAutoSave'

function CanvasView({ projectId }: { projectId: string }) {
  const editor = useEditor()
  const { status, handleSave } = useSaveStatus()

  // 启用自动保存
  const { save, isSaving } = useAutoSave(editor, {
    projectId,
    enabled: true,
    interval: 30000, // 30秒
    onSave: handleSave,
    onError: (error) => console.error('Save error:', error),
  })

  return (
    <>
      {/* 保存状态指示器 */}
      {status === 'saving' && <div>保存中...</div>}
      {status === 'saved' && <div>已保存 ✓</div>}
      {status === 'error' && <div>保存失败</div>}

      {/* 手动保存按钮 */}
      <button onClick={save} disabled={isSaving}>
        保存
      </button>
    </>
  )
}
```

### 配置选项

```typescript
useAutoSave(editor, {
  projectId: string,          // 项目 ID
  enabled: boolean,           // 是否启用（默认 true）
  interval: number,           // 保存间隔（默认 30000ms）
  onSave: (success) => void,  // 保存回调
  onError: (error) => void,   // 错误回调
})
```

---

## AI API 集成

### 1. OpenAI 配置

#### 获取 API 密钥
1. 访问 https://platform.openai.com/api-keys
2. 登录并创建新的 API 密钥
3. 复制密钥到 `.env` 文件

#### 支持的模型
- **文本生成**: `gpt-4-turbo-preview`, `gpt-3.5-turbo`
- **图片生成**: `dall-e-3`, `dall-e-2`

#### 使用示例

```typescript
import { generateText, generateImage } from './lib/ai-api'

// 文本生成
const textResult = await generateText({
  provider: 'openai',
  prompt: '写一首关于春天的诗',
  model: 'gpt-4-turbo-preview',
  maxTokens: 500,
  temperature: 0.7,
})

if (textResult.success) {
  console.log(textResult.data) // 生成的文本
  console.log(textResult.usage) // Token 使用情况
}

// 图片生成
const imageResult = await generateImage({
  provider: 'openai',
  prompt: '一只可爱的猫',
  model: 'dall-e-3',
  size: '1024x1024',
  quality: 'hd',
})

if (imageResult.success) {
  console.log(imageResult.data) // 图片 URLs
}
```

### 2. Anthropic Claude 配置

#### 获取 API 密钥
1. 访问 https://console.anthropic.com
2. 创建账号并获取 API 密钥
3. 添加到 `.env` 文件

#### 支持的模型
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`

#### 使用示例

```typescript
const result = await generateText({
  provider: 'claude',
  prompt: '解释量子计算',
  model: 'claude-3-opus-20240229',
  maxTokens: 1024,
})
```

### 3. Google AI (Gemini) 配置

#### 获取 API 密钥
1. 访问 https://makersuite.google.com/app/apikey
2. 创建项目并获取 API 密钥
3. 添加到 `.env` 文件

#### 支持的模型
- `gemini-pro`
- `gemini-pro-vision`

#### 使用示例

```typescript
const result = await generateText({
  provider: 'gemini',
  prompt: '什么是人工智能？',
  model: 'gemini-pro',
})
```

### 4. 积分计算

AI API 使用会消耗积分：

```typescript
import { calculateCredits } from './lib/ai-api'

const credits = calculateCredits('text', 'gpt-4', 1500) // 2积分
const imageCredits = calculateCredits('image', 'dall-e-3') // 10积分
```

积分规则：
- 文本生成：每 1000 tokens = 1 积分
- 图片生成（DALL-E 3）：10 积分/张
- 图片生成（其他）：5 积分/张
- 视频生成：50 积分/条

---

## Stripe 支付集成

### 1. Stripe 账号设置

#### 创建 Stripe 账号
1. 访问 https://dashboard.stripe.com/register
2. 完成注册流程
3. 激活测试模式

#### 获取 API 密钥
1. 在 Dashboard > Developers > API keys
2. 复制 `Publishable key` (以 `pk_test_` 开头)
3. 复制 `Secret key` (以 `sk_test_` 开头)
4. 添加到 `.env` 文件

### 2. 积分购买功能

#### 积分套餐配置

在 `src/lib/stripe.ts` 中定义：

```typescript
export const CREDIT_PACKAGES = [
  {
    id: 'credits_1000',
    name: '入门包',
    credits: 1000,
    price: 9.99,
  },
  {
    id: 'credits_5000',
    name: '进阶包',
    credits: 5000,
    price: 39.99,
    bonus: 500,
    popular: true,
  },
  // ...
]
```

#### 使用示例

```typescript
import { purchaseCredits } from './lib/stripe'

// 购买积分
const result = await purchaseCredits(userId, 'credits_5000')

if (result.success) {
  // 用户将被重定向到 Stripe Checkout
  console.log('Redirecting to checkout...')
} else {
  console.error(result.error)
}
```

### 3. 订阅功能

#### 订阅计划配置

```typescript
export const SUBSCRIPTION_PLANS = [
  {
    id: 'plan_starter',
    name: '入门版',
    tier: 'starter',
    monthlyPrice: 9.99,
    yearlyPrice: 99,
    monthlyCredits: 2000,
    features: [...],
  },
  // ...
]
```

#### 使用示例

```typescript
import { subscribeToPlan, cancelSubscription } from './lib/stripe'

// 订阅计划
await subscribeToPlan(userId, 'plan_basic', 'yearly')

// 取消订阅
await cancelSubscription(userId)

// 客户门户（管理订阅）
await redirectToCustomerPortal(userId)
```

### 4. Webhook 配置

#### 设置 Webhook
1. Stripe Dashboard > Developers > Webhooks
2. 添加端点：`https://your-domain.com/api/stripe/webhook`
3. 选择事件：
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. 复制 Webhook 签名密钥
5. 添加到 `.env` 作为 `STRIPE_WEBHOOK_SECRET`

#### Webhook 处理器（后端）

```typescript
// api/stripe/webhook.ts
export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature')
  const body = await request.text()

  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  )

  switch (event.type) {
    case 'checkout.session.completed':
      // 处理支付成功
      await handleCheckoutComplete(event.data.object)
      break
    case 'customer.subscription.updated':
      // 处理订阅更新
      await handleSubscriptionUpdate(event.data.object)
      break
    // ...
  }

  return new Response('OK', { status: 200 })
}
```

---

## 协作功能

### 1. 数据库设置

运行协作表架构：

```sql
-- 在 Supabase SQL Editor 中执行
-- .same/database-schema-collaboration.sql
```

这将创建：
- `project_shares` - 分享链接表
- `project_collaborators` - 协作者表
- `project_comments` - 评论表

### 2. 项目分享

#### 创建分享链接

```typescript
import { createShareLink, generateShareUrl } from './lib/collaboration'

const result = await createShareLink({
  projectId: 'project-id',
  permission: 'view', // 'view' | 'edit' | 'comment'
  expiresIn: 7, // 7天后过期
  password: 'optional-password',
  maxUses: 10, // 最多使用10次
})

if (result.success) {
  const shareUrl = generateShareUrl(result.shareToken)
  console.log('分享链接:', shareUrl)
}
```

#### 访问分享链接

```typescript
import { accessSharedProject } from './lib/collaboration'

const result = await accessSharedProject(
  shareToken,
  password // 如果设置了密码
)

if (result.success) {
  console.log('项目 ID:', result.projectId)
  console.log('权限:', result.permission)
  // 重定向到项目
}
```

#### 管理分享链接

```typescript
// 获取所有分享链接
const { shares } = await getProjectShares(projectId)

// 删除分享链接
await deleteShareLink(shareId)
```

### 3. 协作者管理

#### 邀请协作者

```typescript
import { inviteCollaborator } from './lib/collaboration'

await inviteCollaborator({
  projectId: 'project-id',
  userEmail: 'collaborator@example.com',
  role: 'editor', // 'owner' | 'editor' | 'viewer' | 'commenter'
})
```

#### 处理邀请

```typescript
// 接受邀请
await acceptInvitation(invitationId)

// 拒绝邀请
await declineInvitation(invitationId)

// 移除协作者
await removeCollaborator(collaboratorId)
```

#### 获取协作者

```typescript
const { collaborators } = await getProjectCollaborators(projectId)

collaborators.forEach(collab => {
  console.log(collab.user.email, collab.role)
})
```

### 4. 评论功能

#### 添加评论

```typescript
import { addComment } from './lib/collaboration'

await addComment({
  projectId: 'project-id',
  content: '这个设计很棒！',
  position: { x: 100, y: 200 }, // 可选：评论位置
  threadId: 'parent-comment-id', // 可选：回复某条评论
})
```

#### 获取评论

```typescript
const { comments } = await getProjectComments(projectId)

comments.forEach(comment => {
  console.log(comment.user.full_name, comment.content)
})
```

### 5. 权限检查

```typescript
import { checkUserPermission } from './lib/collaboration'

const { role } = await checkUserPermission(projectId, userId)

if (role === 'owner' || role === 'editor') {
  // 用户可以编辑
} else if (role === 'viewer') {
  // 用户只能查看
} else if (role === 'commenter') {
  // 用户只能评论
}
```

---

## 测试和部署

### 1. 本地测试

#### 测试自动保存
1. 创建项目并进入画布
2. 添加一些节点
3. 等待 30 秒
4. 检查控制台日志 "Auto-save successful"
5. 刷新页面，验证数据已保存

#### 测试 AI API
1. 配置至少一个 AI API 密钥
2. 创建文本生成节点
3. 输入提示词并执行
4. 查看生成结果

#### 测试支付
1. 使用 Stripe 测试模式
2. 测试卡号：`4242 4242 4242 4242`
3. 任意未来日期和 CVC
4. 完成测试购买

#### 测试协作
1. 创建两个测试账号
2. 从账号 A 邀请账号 B
3. 账号 B 接受邀请
4. 测试协作编辑和评论

### 2. 生产部署

#### 环境变量
确保所有生产环境变量已配置：
- Supabase 生产 URL 和密钥
- AI API 生产密钥
- Stripe 生产密钥（`pk_live_...` 和 `sk_live_...`）

#### Stripe 生产模式
1. 切换到 Live 模式
2. 完成账号验证
3. 配置 Webhook (生产 URL)
4. 更新环境变量

#### 部署检查清单
- [ ] 所有环境变量已配置
- [ ] 数据库架构已部署
- [ ] RLS 策略已启用
- [ ] Stripe Webhook 已配置
- [ ] AI API 密钥有效
- [ ] 测试支付流程
- [ ] 测试协作功能
- [ ] 监控和日志配置

---

## 常见问题

### Q: 自动保存不工作？
A: 检查：
1. 用户是否已登录
2. 项目 ID 是否有效
3. Supabase 连接是否正常
4. 查看控制台错误日志

### Q: AI API 调用失败？
A: 检查：
1. API 密钥是否正确
2. 账号余额是否充足
3. 请求速率是否超限
4. 查看 API 错误信息

### Q: Stripe 支付不工作？
A: 检查：
1. Publishable key 是否正确
2. Webhook 是否配置
3. 测试/生产模式匹配
4. 查看 Stripe Dashboard 日志

### Q: 协作功能无法使用？
A: 检查：
1. 数据库表是否创建
2. RLS 策略是否启用
3. 用户权限是否正确
4. 查看数据库日志

---

## 获取帮助

- **文档**: 查看项目 `.same/` 目录中的所有文档
- **GitHub Issues**: 报告 bug 或请求功能
- **Discord**: 加入社区讨论
- **Email**: support@aiworkflow.com

---

**最后更新**: 2025-11-03
**版本**: v56+

这是一份为您量身定制的**《Lovart-Flow 全栈开发终极执行方案 (2025 专业版)》**。

这份方案整合了我们之前讨论的所有核心决策：
*   **架构**: Supabase + tldraw (Headless) + Python Backend。
*   **UI**: Radix UI Primitives + Tailwind (白色极简高端风)。
*   **核心差异化**: 节点式无限画布 + 服装设计 Agent Copilot。
*   **商业化**: 严格的积分原子扣费 + Cloudflare R2 低成本存储。

请将此文件保存为 `MASTER_PLAN.md`，它是你指挥 AI (Cursor/Antigravity) 进行开发的**最高指令书**。

---

# 📂 Lovart-Flow 全栈开发终极执行方案

## 1. 项目愿景 (Project Vision)
打造一个面向专业服装设计师的 **"AI 辅助无限创作白板"**。
用户不仅仅是生成图片，而是通过**节点连线 (Workflow)** 和 **AI 智能助手 (Agent)** 在一个无限画布上进行设计推演、材质替换和版型迭代。

## 2. 核心技术栈 (The Stack)

| 模块 | 技术选型 | 理由 |
| :--- | :--- | :--- |
| **前端框架** | **Next.js 14** (App Router, TS) | 行业标准，SSR 性能最佳。 |
| **UI 系统** | **Radix UI** + **Tailwind** + **Framer Motion** | 打造极致的白色极简、高交互感界面 (2025 SaaS 风格)。 |
| **画布引擎** | **tldraw (Headless Mode)** | 利用其强大的矢量引擎开发“节点”和“连线”功能，无需重造轮子。 |
| **数据库/Auth** | **Supabase** | 全托管 Postgres, Auth, Realtime (实时画布状态同步)。 |
| **后端逻辑** | **Python** (Django Ninja 或 FastAPI) | 充当无状态的计算层，处理 Stripe 支付、AI 调度、复杂扣费。 |
| **AI 推理** | **Fal.ai** (实时) + **Replicate** (高质量) | Fal 用于画布实时预览，Replicate 用于最终 Flux Pro 出图。 |
| **存储** | **Cloudflare R2** | 存储海量生成图/视频，**免流量费** (比 S3 省钱)。 |
| **后台管理** | **Refine** (React) | 快速生成的运营后台，直接挂载在 Next.js 路由下。 |

---

## 3. 数据库设计 (Supabase Schema)

### A. 核心表结构
*   **`profiles`** (用户表)
    *   `id`: UUID (关联 auth.users)
    *   `email`: String
    *   `avatar_url`: String (存 Supabase Storage 链接)
    *   `credits`: Integer (❌ **前端只读**, 只能由后端修改)
    *   `is_pro`: Boolean

*   **`projects`** (项目表)
    *   `id`: UUID
    *   `user_id`: UUID
    *   `canvas_data`: JSONB (存储 tldraw 的完整快照)
    *   `thumbnail_url`: String

*   **`ai_models`** (模型配置表 - **Server-Driven UI 核心**)
    *   `id`: UUID
    *   `name`: String (如 "Kling 2.1 Master")
    *   `type`: Enum ('IMAGE', 'VIDEO')
    *   `provider`: Enum ('REPLICATE', 'FAL', 'CUSTOM')
    *   `api_path`: String (如 "kling-ai/kling-video-v2")
    *   `cost_per_gen`: Integer (单次消耗积分)
    *   `is_active`: Boolean
    *   **`parameters_schema` (JSONB)**: 定义模型参数和UI渲染方式
        *   示例: `[{"key": "duration", "type": "select", "options": [{"label": "5s", "value": "5s"}]}, {"key": "aspect_ratio", "type": "grid_select", "options": [...]}]`

*   **`generations`** (生成记录表 - **开启 Realtime**)
    *   `id`: UUID
    *   `project_id`: UUID
    *   `prompt`: Text
    *   `status`: Enum (PENDING, COMPLETED, FAILED)
    *   `result_url`: String (Cloudflare R2 链接)

### B. 安全策略 (RLS Policies)
1.  `profiles`: 用户只能 `UPDATE` 自己的 `nickname`。**严禁**用户修改 `credits`。
2.  `generations`: 用户只能 `SELECT` 自己的生成记录。

---

## 4. 详细开发阶段 (Step-by-Step Guide)

请按此顺序指挥 AI 进行开发。

### 🟢 Phase 1: 基础设施与设计系统 (Infrastructure)
**目标**: 搭建 Next.js 骨架，配置 Radix UI 白色主题，跑通 Supabase Auth。

*   **Step 1.1**: 初始化 Next.js 项目。安装 `radix-ui` 全家桶, `tailwind`, `framer-motion`。
*   **Step 1.2**: **构建 Design System**。
    *   创建一个 `Button` 组件：白色背景，细灰边框，按下时缩放 (Scale 0.98)。
    *   创建一个 `Dialog` (模态框)：带背景模糊 (Backdrop Blur)。
    *   全局字体设置：`Geist Sans`。
*   **Step 1.3**: 配置 Supabase Auth。制作一个极简的登录页 (Google 登录)。
*   **Step 1.4**: 搭建 Python 后端环境 (Dockerized)，连接 Supabase DB。

### 🔵 Phase 2: 节点式画布引擎 (The Node Canvas)
**目标**: 魔改 tldraw，实现“拖拽生成卡片”和“连线逻辑”。

*   **Step 2.1**: 安装 `tldraw`。创建一个全屏组件，**隐藏默认 UI** (`hideUi={true}`)。
*   **Step 2.2**: **开发自定义形状 `AiNodeShape`**。
    *   外观：一个白色的 React 卡片。包含图片预览区、Prompt 输入框、"Generate" 按钮。
    *   交互：卡片边缘有 Handle (连接点)，允许拉出箭头。
*   **Step 2.3**: **开发自定义工具栏** (使用 Radix UI)。
    *   悬浮在屏幕底部。包含：选择(V)、画笔(B)、添加节点(A)、抓手(H)。
*   **Step 2.4**: 实现**流式逻辑 (Flow Logic)**。
    *   监听 tldraw 的连线事件。如果用户把 `Node A` 连到 `Node B`，在代码层面记录 `Node B.input = Node A.output`。

### 🟣 Phase 3: AI 生成与存储闭环 (The Engine)
**目标**: 点击节点上的按钮，真正生成图片并存入 R2。

*   **Step 3.1**: **Python 后端开发**。
    *   接口 `POST /api/generate`。
    *   逻辑：校验用户积分 -> 扣除积分 (Atomic Update) -> 调用 Fal.ai/Replicate -> 获取结果 -> 下载图片 -> 上传 Cloudflare R2 -> 写入 Supabase `generations` 表。
*   **Step 3.2**: **前端实时更新**。
    *   在 `AiNodeShape` 组件中，订阅 Supabase Realtime。
    *   当 `generations` 表该记录状态变为 `COMPLETED`，自动刷新节点显示的图片 URL。

### 🟣 Phase 3 Update: Server-Driven AI Architecture (配置驱动架构)
**目标**: 实现企业级配置驱动UI，管理员可在后台动态配置模型和参数，前端自动渲染。

*   **Step 3.3**: **数据库 Schema 升级**。
    *   在 `ai_models` 表中添加 `parameters_schema` (JSONB) 字段。
    *   存储 UI 定义：参数类型 (select/grid_select/slider)、选项、默认值、标签等。
    *   运行迁移文件: `supabase/migrations/20250101_add_ai_models_table.sql`

*   **Step 3.4**: **前端动态渲染引擎**。
    *   创建 `components/canvas/nodes/DynamicForm.tsx`。
    *   根据 `parameters_schema` 动态渲染 Radix UI 组件：
        *   `type: 'select'` -> `DropdownMenu`
        *   `type: 'grid_select'` -> `Popover` with grid layout
        *   `type: 'slider'` -> `Slider`
        *   `type: 'switch'` -> Toggle button
    *   使用 **TanStack Query** 获取模型列表 (staleTime: 5分钟)。

*   **Step 3.5**: **更新 GeneratorNode 使用动态渲染**。
    *   `ImageGeneratorNode` 和 `VideoGeneratorNode` 从数据库读取模型列表。
    *   底部 Settings Bar 使用 `DynamicForm` 组件渲染参数。
    *   状态管理：`parameters: Record<string, any>` 存储动态参数值。

*   **Step 3.6**: **后端执行策略升级**。
    *   Python `generate` 接口变为通用接口：接收 `{ model_id, params_json }`。
    *   后端根据 `model_id` 查询数据库获取 `api_path` 和 `cost`。
    *   验证 `params_json` 是否符合 schema。
    *   动态转发到 Replicate/Fal。

*   **Step 3.7**: **Agent 集成 - 工具感知的 Copilot**。
    *   创建 API 路由 `/api/agent/context` 返回可用模型和参数能力。
    *   在 Agent System Prompt 中注入模型上下文。
    *   Agent 可以智能调优参数（如："生成更长的视频" -> 自动设置 duration=10s）。

### 🟡 Phase 4: 服装设计 Agent (The Copilot)
**目标**: 右侧聊天栏，能够“看”画布，“改”画布。

*   **Step 4.1**: 开发右侧悬浮面板 (Collapsible Sidebar)。
*   **Step 4.2**: 集成 **Vercel AI SDK**。
*   **Step 4.3**: 定义 **Tools (工具)**。
    *   `create_variation_nodes(count, style)`: 自动在画布上创建 3 个新的 Node，填入不同的 Prompt。
    *   `analyze_canvas_selection()`: 将当前选中的节点图片发给 GPT-4o Vision 进行分析。
*   **Step 4.4**: System Prompt 调优。
    *   设定角色为“高级服装设计师”。知识库包含：面料学、剪裁术语、流行趋势。

### 🔴 Phase 5: 商业化与后台 (Admin & Money)
**目标**: 收钱，管人。

*   **Step 5.1**: **集成 Stripe**。
    *   前端 Checkout 页面 -> Stripe 支付 -> Webhook -> Python 后端给 Supabase 加分。
*   **Step 5.2**: **搭建 Refine 后台**。
    *   路径 `/admin`。
    *   功能：用户列表 (封号)、积分流水查询、AI 模型配置 (修改价格/下架)。

---

## 5. 关键代码片段示例 (供 AI 参考)

### A. 自定义 tldraw 节点 (AiNodeShape)
```typescript
// 这是一个概念示例，用于指导 AI 开发自定义 Shape
import { BaseBoxShapeUtil, HTMLContainer } from 'tldraw'

export class AiNodeShapeUtil extends BaseBoxShapeUtil<IAiNodeShape> {
  static type = 'ai-node'

  component(shape: IAiNodeShape) {
    // 使用 Radix UI + Tailwind 渲染节点内部 UI
    return (
      <HTMLContainer className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div className="aspect-square bg-gray-50 rounded-md mb-2">
           {/* 显示生成图或占位符 */}
           {shape.props.imageUrl ? <img src={shape.props.imageUrl} /> : <div className="text-xs text-gray-400">Empty</div>}
        </div>
        <textarea 
          className="text-xs w-full border-none focus:ring-0 resize-none" 
          placeholder="Enter prompt..."
          value={shape.props.prompt}
        />
        <Button size="sm" onClick={() => handleGenerate(shape.id)}>
          Generate (4 Credits)
        </Button>
      </HTMLContainer>
    )
  }
}
```

### B. Python 后端扣费逻辑 (Supabase-py)
```python
# backend/services/credits.py
from supabase import create_client

def deduct_credits(user_id: str, amount: int):
    """
    使用 RPC (Remote Procedure Call) 在数据库层面进行原子扣减
    防止高并发下的 Race Condition
    """
    response = supabase.rpc('deduct_user_credits', {
        'user_uuid': user_id,
        'amount_to_deduct': amount
    }).execute()
    
    if response.error:
        raise InsufficientFundsError("余额不足")
    
    return True
```
*(注：需要在 Supabase SQL Editor 里预先写好 `deduct_user_credits` 这个 Postgres 函数)*

---


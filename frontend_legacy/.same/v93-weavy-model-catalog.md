# Version 93 - Weavy.ai 风格模型目录系统 🎨

## 📋 版本概述

**版本号**: 93
**发布日期**: 2025-11-05
**核心功能**: 实现 Weavy.ai 风格的节点目录系统

## ✨ 主要改进

### 1. 节点目录系统 (Nodes Catalog)

参考 Weavy.ai 平台，实现了完整的节点目录系统：

#### 核心特点
- ✅ **Schema-First 方法**: 每个工具都有 JSON Schema 定义
- ✅ **分类管理**: AI 工具、图片模型、视频模型
- ✅ **统一接口**: ToolSchema 接口定义所有工具
- ✅ **可扩展性**: 易于添加新模型和工具

#### 数据结构
```typescript
interface ToolSchema {
  id: string                 // 唯一标识
  name: string              // 显示名称
  category: string          // 分类
  provider: string          // 提供商
  description: string       // 描述
  version: string           // 版本号

  inputSchema: {...}        // 输入 JSON Schema
  outputSchema: {...}       // 输出 JSON Schema
  configSchema: {...}       // 配置 JSON Schema

  mcpEndpoint?: string      // MCP 端点
  pricing?: {...}           // 定价信息
}
```

### 2. 图片模型目录 (5个模型)

| 模型 | 提供商 | 积分 | 特点 |
|------|--------|------|------|
| FLUX Pro | black-forest-labs | 50/次 | 最高质量 |
| FLUX Dev | black-forest-labs | 25/次 | 快速开发 |
| Stable Diffusion XL | stability-ai | 20/次 | 开源经典 |
| Midjourney | midjourney | 40/次 | 艺术风格 |
| DALL·E 3 | openai | 35/次 | OpenAI 最新 |

#### 配置选项示例 (FLUX Pro)
```json
{
  "aspectRatio": "1:1 | 16:9 | 9:16 | 4:3 | 3:4",
  "quality": "draft | standard | hd",
  "steps": 1-50 (默认28),
  "guidance": 1-20 (默认7.5)
}
```

### 3. 视频模型目录 (4个模型)

| 模型 | 提供商 | 积分 | 特点 |
|------|--------|------|------|
| Runway Gen-3 | runway | 100/秒 | 电影级质量 |
| Pika Labs | pika | 80/次 | 快速生成 |
| Stable Video Diffusion | stability-ai | 60/次 | 开源方案 |
| Luma Dream Machine | luma-ai | 90/秒 | 专业级 |

#### 配置选项示例 (Runway Gen-3)
```json
{
  "duration": 5 | 10,
  "resolution": "720p | 1080p",
  "fps": 24 | 30
}
```

### 4. 模型卡片组件

#### 设计特点
- **信息层次清晰**: 标题、提供商、描述分层显示
- **定价透明**: 积分消耗一目了然
- **配置预览**: 可展开查看默认配置
- **交互友好**: 悬停效果、绿色主题

#### 卡片结构
```
┌─────────────────────────────┐
│ [模型名称]     [provider]    │
│ 描述文字...                  │
├─────────────────────────────┤
│ 💰 50 积分 / 次              │
├─────────────────────────────┤
│ 配置项1: value1             │  ← 可展开
│ 配置项2: value2             │
│ 配置项3: value3             │
├─────────────────────────────┤
│ [查看配置] [添加节点]        │
└─────────────────────────────┘
```

### 5. Schema-First 设计原则

参考 Weavy.ai 的文档，实现了：

#### 输入 Schema
```typescript
inputSchema: {
  type: 'object',
  properties: {
    prompt: {
      type: 'string',
      description: '图片描述'
    },
    negativePrompt: {
      type: 'string',
      description: '负面提示'
    }
  },
  required: ['prompt']
}
```

#### 输出 Schema
```typescript
outputSchema: {
  type: 'object',
  properties: {
    imageUrl: { type: 'string' },
    width: { type: 'number' },
    height: { type: 'number' }
  }
}
```

#### 配置 Schema
```typescript
configSchema: {
  type: 'object',
  properties: {
    aspectRatio: {
      type: 'string',
      enum: ['1:1', '16:9', '9:16'],
      default: '1:1'
    },
    quality: {
      type: 'string',
      enum: ['draft', 'standard', 'hd'],
      default: 'standard'
    }
  }
}
```

## 🎨 用户界面改进

### 图片模型面板
```
选择图片生成模型，每个模型都有独特的风格和特点

┌─ FLUX Pro ──────────────────┐
│ black-forest-labs            │
│ 最先进的图像生成模型...      │
│ 💰 50 积分 / 次              │
│ [查看配置] [添加节点]        │
└─────────────────────────────┘

┌─ FLUX Dev ──────────────────┐
│ black-forest-labs            │
│ 开发版本，速度快...          │
│ 💰 25 积分 / 次              │
│ [查看配置] [添加节点]        │
└─────────────────────────────┘

... 更多模型
```

### 视频模型面板
```
选择视频生成模型，创建专业级动态内容

┌─ Runway Gen-3 ──────────────┐
│ runway                       │
│ 最新的视频生成模型...        │
│ 💰 100 积分 / 秒             │
│ [查看配置] [添加节点]        │
└─────────────────────────────┘

┌─ Pika Labs ─────────────────┐
│ pika                         │
│ 快速视频生成...              │
│ 💰 80 积分 / 次              │
│ [查看配置] [添加节点]        │
└─────────────────────────────┘

... 更多模型
```

## 🔧 技术实现

### 文件结构
```
src/
├── lib/
│   └── nodesCatalog.ts       ← 节点目录定义
├── components/
│   ├── SidePanel.tsx         ← 更新的侧边面板
│   └── SidePanel.css         ← 新增样式
```

### 核心代码

#### 获取所有工具
```typescript
export function getAllTools(): ToolSchema[] {
  return [
    ...AI_TOOLS_CATALOG,
    ...IMAGE_MODELS_CATALOG,
    ...VIDEO_MODELS_CATALOG
  ]
}
```

#### 按分类获取
```typescript
export function getToolsByCategory(
  category: ToolSchema['category']
): ToolSchema[] {
  return getAllTools().filter(
    tool => tool.category === category
  )
}
```

#### 按 ID 获取
```typescript
export function getToolById(
  id: string
): ToolSchema | undefined {
  return getAllTools().find(
    tool => tool.id === id
  )
}
```

### 模型卡片组件
```typescript
function ModelCard({ model, onAddNode }: ModelCardProps) {
  const [showConfig, setShowConfig] = useState(false)

  return (
    <div className="model-card">
      {/* 头部 */}
      <div className="model-card-header">
        <h4>{model.name}</h4>
        <span>{model.provider}</span>
        <p>{model.description}</p>
      </div>

      {/* 定价 */}
      {model.pricing && (
        <div className="model-card-pricing">
          {model.pricing.credits} 积分
        </div>
      )}

      {/* 配置 */}
      {showConfig && (
        <div className="model-card-config">
          {/* 显示配置项 */}
        </div>
      )}

      {/* 操作 */}
      <div className="model-card-actions">
        <button onClick={() => setShowConfig(!showConfig)}>
          查看配置
        </button>
        <button onClick={() => onAddNode(model.id)}>
          添加节点
        </button>
      </div>
    </div>
  )
}
```

## 📚 Weavy.ai 设计原则应用

### 1. Schema-First Approach ✅
- 每个工具都有明确的 JSON Schema
- 输入、输出、配置都有类型定义
- 便于验证和文档生成

### 2. 节点目录 (Nodes Catalog) ✅
- 统一的工具注册系统
- 便于动态加载和管理
- 支持版本控制

### 3. MCP 集成准备 ✅
- 预留 mcpEndpoint 字段
- Schema 定义符合 MCP 规范
- 可直接集成 Model Context Protocol

### 4. 可扩展架构 ✅
- 易于添加新模型
- 模块化设计
- 清晰的接口定义

## 🎯 使用方法

### 添加新模型
```typescript
// 在 nodesCatalog.ts 中添加
const NEW_MODEL: ToolSchema = {
  id: 'new-model',
  name: '新模型',
  category: 'image-model',
  provider: 'provider-name',
  description: '模型描述',
  version: '1.0.0',
  inputSchema: {...},
  outputSchema: {...},
  configSchema: {...},
  pricing: {
    credits: 30,
    unit: 'per_call'
  }
}

// 添加到对应目录
export const IMAGE_MODELS_CATALOG = [
  ...existing models,
  NEW_MODEL
]
```

### 在面板中显示
```typescript
// SidePanel.tsx 自动读取目录
{activeTool === 'image-models' && (
  <div className="panel-models-catalog">
    {IMAGE_MODELS_CATALOG.map(model => (
      <ModelCard
        key={model.id}
        model={model}
        onAddNode={handleAddNode}
      />
    ))}
  </div>
)}
```

## 📊 统计数据

### 模型数量
- **图片模型**: 5 个
- **视频模型**: 4 个
- **AI 工具**: 3 个
- **总计**: 12 个工具/模型

### 提供商
- Black Forest Labs
- Stability AI
- Midjourney
- OpenAI
- Runway
- Pika
- Luma AI
- System (内置)

### 积分范围
- 最低: 20 积分/次 (SDXL)
- 最高: 100 积分/秒 (Runway Gen-3)

## 🚀 下一步计划

### 即将实现
- [ ] 连接节点到画布
- [ ] 节点配置面板
- [ ] 实际 API 集成
- [ ] MCP Server 集成
- [ ] 工作流执行引擎

### 功能增强
- [ ] 模型搜索过滤
- [ ] 收藏功能
- [ ] 使用历史
- [ ] 模型比较
- [ ] 价格计算器

## 💡 特色功能

### 1. 悬停效果
- 边框变绿色
- 轻微上移动画
- 阴影增强

### 2. 配置展开
- 点击"查看配置"按钮
- 平滑展开动画
- 显示默认值

### 3. 一键添加
- "添加节点"按钮
- 绿色高亮
- 即时反馈

## 🎨 设计亮点

### 视觉层次
1. **主标题**: 16px, 粗体
2. **提供商**: 11px, 灰色背景
3. **描述**: 12px, 浅色
4. **定价**: 绿色背景，突出显示
5. **操作按钮**: 清晰明确

### 颜色系统
- **主题色**: #a0ff1f (亮绿色)
- **边框**: rgba(0, 0, 0, 0.08)
- **文字**: #111 / rgba(0, 0, 0, 0.6)
- **背景**: 白色 + 淡绿色

### 交互反馈
- 悬停: 边框颜色变化
- 点击: 按钮变暗
- 展开: 平滑过渡

## ✅ 完成清单

- [x] 创建 nodesCatalog.ts
- [x] 定义 ToolSchema 接口
- [x] 添加 5 个图片模型
- [x] 添加 4 个视频模型
- [x] 创建 ModelCard 组件
- [x] 添加 CSS 样式
- [x] 更新 SidePanel
- [x] 测试功能正常

## 🎉 版本亮点

这个版本完全遵循了 Weavy.ai 的设计思路：
- ✅ Schema-First 方法论
- ✅ 节点目录系统
- ✅ 统一的工具接口
- ✅ 可扩展的架构
- ✅ 专业的 UI 设计

---

**版本**: 93
**状态**: ✅ 已发布
**参考**: Weavy.ai Platform
**下一步**: 节点配置和 API 集成

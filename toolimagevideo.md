这是一个非常具体且高标准的开发需求。你提供的截图展示了一个**基于无限画布的、卡片式交互的 AI 工作流界面**。

这与传统的“侧边栏填表单”完全不同，它将**配置（Settings）**、**输入（Input）**和**参考图（Reference）**全部内聚在了一个**画布上的节点（Node）**中。

要复刻这种 UI（类似 Lovart.ai 或 ComfyUI 的现代化变体），核心难点在于**如何在 tldraw 的 Canvas 内部渲染复杂的 React 组件（Dropdown, Input, Uploaders）并保持交互流畅**。

以下是基于 **2025 年高级全栈工程标准** 的复刻方案。

---

### 1. 核心架构：Headless tldraw + Custom Shapes

不要试图去修改 tldraw 默认的矩形或图片工具。你需要开发一个全新的**自定义形状（Custom Shape）**，我们称之为 `GeneratorNode`。

#### 技术选型细节
*   **Canvas**: `tldraw` (Headless)
*   **Node UI**: `Radix UI` (`Popover`, `DropdownMenu`, `Tooltip`, `ScrollArea`) —— 用于实现截图中的弹出菜单。
*   **Icons**: `Lucide React` (与截图风格一致的线条图标) 或 `Phosphor Icons`。
*   **Styling**: `Tailwind CSS` (实现截图中的圆角、阴影、毛玻璃效果)。
*   **File Upload**: `react-dropzone` (处理参考图上传)。

---

### 2. UI 组件拆解 (Pixel Perfect Replication)

根据你的截图，我们需要构建一个复杂的卡片组件，它由三部分组成：

#### Part A: 顶部状态栏 (Top Bar)
*   显示 "Video Generator" 或 "Image Generator"。
*   显示分辨率（如 `1920 x 1080`）。
*   *实现*: 这是 Node 的 Header，拖动这个区域可以移动整个节点。

#### Part B: 核心交互区 (Main Body)
*   **Prompt 输入框**: 一个巨大的、白色的、无边框的 `textarea`，支持自动高度 (`react-textarea-autosize`)。
*   **参考图区域 (Reference Slots)**:
    *   截图显示了两个插槽（起始帧/结束帧 或 参考图）。
    *   中间有个“交换”按钮。
    *   支持 **Drag & Drop**：直接把图片拖进去。

#### Part C: 底部控制栏 (Bottom Settings Bar) —— 最复杂的部分
*   这是一个悬浮在卡片底部的“胶囊”或“工具条”。
*   **包含组件**:
    *   **首尾帧开关**: Toggle Button。
    *   **多图参考**: Button。
    *   **模型选择器**: 点击弹出 Radix Popover，显示 "Kling 2.1 Master" 等选项。
    *   **比例选择器**: 点击弹出 3x3 网格 (16:9, 4:3, 1:1)，如截图 4 所示。
    *   **生成按钮**: 紫色渐变按钮，带闪电图标和积分消耗 (`⚡ 160`)。

---

### 3. 开发实施步骤 (给 Cursor 的指令)

#### Step 1: 定义数据结构 (Shape Schema)

首先告诉 tldraw 这个节点长什么样，存什么数据。

> **Cursor Command**:
> "Define a custom shape type `generator-node` for tldraw.
> The props interface should include:
> - `type`: 'image' | 'video'
> - `prompt`: string
> - `references`: { id: string, url: string, type: 'start_frame' | 'end_frame' }[]
> - `settings`: { model: string, aspectRatio: string, duration: number, fps: number }
> - `status`: 'idle' | 'generating' | 'completed' | 'failed'
> - `resultUrl`: string | null"

#### Step 2: 开发自定义形状组件 (The ShapeUtil)

这是核心。我们需要在 Canvas 里渲染 React 组件。

> **Cursor Command**:
> "Create a `GeneratorNodeUtil.tsx` extending `BaseBoxShapeUtil`.
> Inside the `component(shape)` method, render a React component that looks exactly like the screenshot:
>
> 1.  **Container**: A white div (`bg-white`) with `rounded-xl`, `shadow-xl`, and `border border-gray-100`.
> 2.  **Interactive Zone**: Use `<HTMLContainer>` from tldraw. IMPORTANT: Add `pointer-events-auto` class so inputs work.
> 3.  **Input Area**: A minimalist textarea with placeholder '今天我们要创作什么...'.
> 4.  **Reference Area**: A flex row with 2 dashed-border boxes. Use `react-dropzone` to handle file drops. Upload to R2 immediately and store the URL in shape props.
> 5.  **Bottom Bar**: A gray footer (`bg-gray-50/80 backdrop-blur`) containing:
>     - A **Radix Popover** for Aspect Ratio (Grid layout of rectangles).
>     - A **Radix Dropdown** for Model selection.
>     - A 'Generate' button (Purple gradient background)."

#### Step 3: 左侧工具栏与拖拽创建 (Drag to Create)

截图左侧有 "上传图片"、"上传视频"、"图像生成器" 的菜单。我们需要实现：**从左侧拖拽一个图标到画布上，松手时在那个位置创建一个 Node**。

> **Cursor Command**:
> "Implement the Left Toolbar using Radix UI `Popover` or `HoverCard`.
> When the user clicks 'Image Generator' (Item A in screenshot 5):
> 1.  Calculate the viewport center or mouse position.
> 2.  Call `editor.createShape` with type `generator-node`.
> 3.  Initialize it with default props (e.g., ratio '3:4', model 'Nano Banana Pro')."

#### Step 4: 样式细节 (Styling Guidelines)

为了达到截图中的**高级感**，请复制以下 Tailwind 配置：

*   **阴影**: 不用默认 shadow。使用 `shadow-[0_8px_30px_rgb(0,0,0,0.04)]` (超柔和弥散阴影)。
*   **边框**: `border border-gray-200/60` (极细、半透明边框)。
*   **圆角**: `rounded-2xl` (比较大的圆角，看起来更亲和)。
*   **Popovers**: 当点击“比例选择”时，弹出的菜单应该是纯白背景，带极细边框，选中项变成浅灰色 (`bg-gray-100`) 并有个对勾。

#### Step 5: 连接右侧 Agent (Context Aware)

右侧的 "Hi, 我是你的AI设计师" 需要能控制画布上的这个节点。

> **Cursor Command**:
> "Connect the Right Sidebar Agent to the Tldraw Editor.
> 1.  When user clicks a template card (e.g., 'Wine List' in the sidebar):
> 2.  Agent logic:
>     - Check if a `generator-node` is currently selected.
>     - If YES: Update that node's `prompt` and `settings` (Model: Kling, Ratio: 16:9).
>     - If NO: Create a NEW `generator-node` at the center of the screen with those settings pre-filled."

---

### 4. 关键代码片段 (Radix Popover inside Tldraw)

在 tldraw 形状里使用 Radix Popover 需要注意 `stopPropagation`，否则点击菜单会穿透到画布上导致取消选中。

```tsx
// components/canvas/shapes/GeneratorNode/SettingsBar.tsx
import * as Popover from '@radix-ui/react-popover';
import { stopEventPropagation } from '@tldraw/editor';

export const AspectRatioSelector = ({ value, onChange }) => {
  return (
    <Popover.Root>
      <Popover.Trigger 
        className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded"
        // 关键：防止点击穿透到画布
        onPointerDown={stopEventPropagation} 
      >
        <span>{value}</span>
      </Popover.Trigger>
      
      <Popover.Portal>
        <Popover.Content 
          className="bg-white p-2 rounded-lg shadow-xl border border-gray-100 w-64 grid grid-cols-3 gap-2 z-[9999]"
          onPointerDown={stopEventPropagation}
        >
          {/* 截图中的 3x3 网格 */}
          {['16:9', '4:3', '1:1', '3:4', '9:16'].map(ratio => (
            <button 
              key={ratio}
              onClick={() => onChange(ratio)}
              className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded"
            >
              <div className={`border border-gray-300 ${getAspectRatioClass(ratio)}`} />
              <span className="text-xs text-gray-500">{ratio}</span>
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
```

### 总结

你提供的截图 UI 非常出色，复刻它的关键在于：
1.  **不要用 tldraw 的默认 UI**，只用它的引擎。
2.  把每个功能块（生成器）做成一个**完全独立的 React App**，封装在 tldraw 的 `CustomShape` 里。
3.  大量使用 **Radix UI** 的 Popover 和 Dropdown 来处理复杂的设置项，保证 UI 既整洁又功能强大。
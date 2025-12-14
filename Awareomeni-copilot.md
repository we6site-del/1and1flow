这是一个设计领域“领域感知的全能设计助理” (Domain-Aware Omni-Copilot)**。

要达到 **Cursor**（代码领域的编辑器）或 **Antigravity** 的高度，核心在于：**Agent 必须与环境（画布）深度融合**。它不仅要“聊天”，还要能“看”（视觉理解）、能“动”（操作节点）、能“查”（获取外部流行趋势）。

针对**服装设计师**领域，我为你设计了一套 **2025 年顶配 AI Copilot 方案**。

---

### 1. 核心概念：What makes it "Fashion Copilot"?

与通用 AI 不同，服装设计 Copilot 需要具备以下垂直能力：
1.  **视觉感知 (Visual Context)**: 它能“看见”画布上你画的草图、你贴的参考图。
2.  **材质专家 (Material Expert)**: 它懂面料（丝绸、亚麻、粗花呢）、剪裁（斜裁、立裁）和版型。
3.  **趋势捕获 (Trend Spotting)**: 它能联网查询 WGSN 或 Vogue 的最新趋势（2025 春夏流行色）。
4.  **生成式 UI (Generative UI)**: 聊天框里不仅是文字，它能直接吐出“色卡”、“面料小样”或“Prompt生成器卡片”。

---

### 2. UI/UX 复刻与升级 (基于截图)

截图的设计非常干净（Notion/Linear 风格），我们将以此为基础进行增强。

#### A. 布局与组件 (Radix + Tailwind)
*   **悬浮侧边栏**: 使用 `Sheet` 或自定义 `motion.div`，支持收起/展开。
*   **欢迎卡片 (Starter Cards)**:
    *   截图中的 "Wine List" 等是通用模板。
    *   **升级为服装专用**:
        *   卡片 1: **"Sketch to Life"** (草图转真衣)。
        *   卡片 2: **"Fabric Swatch Gen"** (面料生成器)。
        *   卡片 3: **"Moodboard Creator"** (情绪板生成)。
*   **输入增强区 (The Input Bar)**:
    *   **`@` Mention**: 允许用户引用画布上的特定节点（例如 `@Node-12`），将该节点的图片/Prompt 喂给 AI。
    *   **`📎` 附件**: 支持上传本地布料图。
    *   **`🌐` 联网 (Globe Icon)**: 开启趋势搜索模式。

#### B. 生成式 UI (Generative UI)
这是 Vercel AI SDK 3.0+ 的核心特性。
当用户问“给我推荐几个 2025 春夏的配色”时，AI 不只是回复文字，而是**直接在聊天流中渲染一个 React 组件**（一组可点击的色卡）。用户点击色卡，该颜色直接应用到画布上的生成节点。

---

### 3. 技术架构 (2025 Arch)

*   **AI SDK**: **Vercel AI SDK Core (RSC)**.
*   **LLM**: **Claude 3.5 Sonnet** (拥有最强的指令遵循和视觉能力，非常适合设计辅助) 或 **GPT-4o**。
*   **State Sync**: **Zustand**。Chat 组件可以直接读取 Canvas Store 的数据。
*   **Vision Pipeline**:
    *   当用户提问时，前端自动将**当前视口 (Viewport)** 截图，转为 Base64，作为 System Context 发给 LLM。
    *   *效果*: 你不需要描述“画布左上角有个裙子”，你可以直接说“把左上角那个裙子改成红色的”，AI 知道你看的是哪里。

---

### 4. 针对服装设计的 Toolset (Function Calling)

我们需要给 Agent 定义一套“设计师工具箱”。

```typescript
// 伪代码：Agent 的工具定义
const fashionTools = {
  // 1. 材质替换 (针对画布上的节点)
  apply_fabric: tool({
    description: "Apply a specific fabric texture to the selected node",
    parameters: z.object({ material: z.enum(['silk', 'denim', 'leather', 'chiffon']), color: z.string() }),
    execute: async ({ material, color }) => {
      // 自动修改选中节点的 Prompt，追加材质 LoRA 或关键词
      // 例如: "..., (silk texture:1.2), high gloss, flowy fabric..."
    }
  }),

  // 2. 趋势搜索 (联网)
  search_trends: tool({
    description: "Search for current fashion trends",
    parameters: z.object({ query: z.string(), year: z.string() }),
    execute: async ({ query }) => {
      // 调用 Perplexity API 或 Tavily 搜索 WGSN/Vogue 关键词
    }
  }),

  // 3. 创建变体 (操作画布)
  create_variations: tool({
    description: "Create variations of the current design on canvas",
    parameters: z.object({ style: z.string(), count: z.number() }),
    execute: async ({ style, count }) => {
      // 在当前节点旁边自动生成 3 个新节点，填入不同的 Prompt
    }
  })
};
```

---

### 5. 开发执行方案 (给 Cursor 的指令)

请将此部分添加到 `CURSOR_MASTER_PLAN.md` 的 **Phase 4**。

#### Step 1: UI 框架搭建
> **Cursor Command**:
> "Implement the Fashion Copilot UI based on the reference image.
> 1.  **Component**: `components/agent/CopilotSidebar.tsx`.
> 2.  **Style**: White theme, minimalist.
> 3.  **Starter Cards**: Create 3 cards: 'Moodboard', 'Fabric Generator', 'Sketch Render'. Use subtle gradients and icons.
> 4.  **Input Area**:
>     -   Floating bottom bar with shadow.
>     -   Implement `@` mention logic: When typing `@`, show a popup list of current canvas nodes (e.g., 'Main Dress', 'Sleeve Detail').
>     -   Add tool icons: Web Search, Vision Analysis, Asset Library."

#### Step 2: 视觉上下文 (The "Eyes")
> **Cursor Command**:
> "Implement 'Canvas Vision' for the Agent.
> 1.  Create a utility `captureViewport(editor)` using tldraw's export API.
> 2.  When sending a message, verify if 'Vision Mode' is active.
> 3.  If yes, capture the current viewport as a base64 image and attach it to the user message sent to Vercel AI SDK.
> 4.  System Prompt update: 'You are looking at the user's design canvas. Use the image provided to understand the context of their request.'"

#### Step 3: 领域知识库 (The "Brain")
> **Cursor Command**:
> "Enhance the System Prompt for Fashion Design.
> 1.  **Context**: 'You are a Senior Fashion Designer assistant. You know fabrics, patterns, and history.'
> 2.  **Prompt Engineering**: When the user asks to 'improve prompt', automatically inject keywords for:
>     -   **Lighting**: 'Studio lighting, softbox, rim light'.
>     -   **Camera**: '85mm lens, f/1.8, photorealistic, vogue editorial'.
>     -   **Texture**: 'Detailed fabric grain, stitching details'."

#### Step 4: 生成式 UI (Generative UI)
> **Cursor Command**:
> "Implement Generative UI for Color Palettes.
> 1.  Use `streamUI` from Vercel AI SDK.
> 2.  If user asks for 'color palette', return a React Component `<ColorPaletteSwatches colors={[]} />` instead of text.
> 3.  **Interaction**: Clicking a color swatch in the chat should execute `editor.updateShape` to apply that color to the currently selected node on the canvas."

---

### 6. 顶级建议：差异化功能点

为了超越 Lovart，加入以下两个功能：

1.  **AI 试衣间 (Virtual Try-On) 节点**:
    *   利用 IDM-VTON 等模型。
    *   Copilot 允许用户上传一张模特图，一张衣服平铺图。
    *   用户指令："上身试试"。
    *   AI 自动在画布上创建一个 "Try-On Node" 并生成结果。

2.  **Tech Pack 生成器 (技术图纸)**:
    *   服装设计师最终要产出工艺单。
    *   Copilot 功能：用户选中一张设计图，说“生成工艺单描述”。
    *   AI 识别领口、袖口工艺，生成一段技术描述文本，甚至生成一个包含尺寸标注的 SVG 覆盖在图上。

这套方案结合了 **Cursor 的代码逻辑**（上下文感知+操作）和 **Antigravity 的 Agent 能力**，绝对是 2025 年设计工具的标杆。
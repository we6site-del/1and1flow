这是 **Hybrid Moodboard (混合情绪板)** 的终极开发执行方案。它不仅是一个聊天界面，更是一个**生成式资产流 (Generative Asset Stream)**。

本方案结合了 **Vercel AI SDK (RSC/Generative UI)**、**React Server Components**、**tldraw API** 以及 **HTML5 Drag & Drop** 技术，旨在打造行业标杆级的 AI 辅助设计体验。

请将此内容作为独立模块保存为 `MOODBOARD_DEV_PLAN.md`，或整合进 `CURSOR_MASTER_PLAN.md` 的 **Phase 4**。

---

# 🎨 Module Plan: The Hybrid Moodboard (Fashion Copilot)

## 1. Core Concept & UX
**Definition**: A vertical, scrollable stream where the AI "drops" interactive assets (fabrics, palettes, sketches) instead of just text.
**Interaction Model**:
1.  **Ask**: User asks for inspiration.
2.  **Generate**: AI renders interactive widgets (not text) in the stream.
3.  **Apply**: User drags assets from the stream directly onto Canvas Nodes.

## 2. Technical Architecture

### A. The Stack
*   **AI Orchestration**: **Vercel AI SDK 3.3+** (using `streamUI` and React Server Components).
*   **Component Rendering**: Server-side rendered components streamed to client.
*   **Drag & Drop Bridge**: HTML5 Native DnD API connecting Sidebar DOM elements -> Canvas (Canvas API).
*   **State Sync**: **Zustand** stores the "Context Selection" (which node is currently active).

### B. Tool Definitions (Server-Side)
We define "Generative Tools" that return React Components.

1.  `generate_fabrics`: Returns `<FabricGrid />`
2.  `generate_palette`: Returns `<ColorPalette />`
3.  `generate_variations`: Returns `<SketchCarousel />`
4.  `analyze_trend`: Returns `<TrendCard />`

---

## 3. UI Components Specification (Radix + Tailwind)

### 1. The Stream Container (`Sidebar.tsx`)
*   **Visuals**: Transparent background with a subtle dot grid (`bg-dot-gray-200`) to imply it's an extension of the workspace.
*   **Scroll Area**: Use `@radix-ui/react-scroll-area`. Hidden scrollbars for sleek look.
*   **Input**: Floating glass bar at bottom (`bg-white/80 backdrop-blur`).

### 2. Generative Component: `<FabricGrid />`
Used when user asks: *"Show me some red velvet textures."*
*   **Layout**: CSS Grid (2 columns).
*   **Item**: A 100px circle displaying the generated texture.
*   **Interaction**:
    *   **Hover**: Shows a "Drag to Apply" tooltip.
    *   **Draggable**: `draggable="true"`.
    *   **Metadata**: `data-texture-url="..."`, `data-prompt-part="red velvet texture"`.

### 3. Generative Component: `<ColorPalette />`
Used when user asks: *"Give me a 2025 Spring color scheme."*
*   **Layout**: Flex row of 5 tall rectangles.
*   **Visuals**: Hex code printed vertically at the bottom.
*   **Interaction**:
    *   **Click**: Copies Hex to clipboard.
    *   **Drag**: Dragging a specific color onto a Node updates the Node's "Color ControlNet" or prompt.

### 4. Generative Component: `<SketchCarousel />`
Used when user asks: *"Give me 3 variations of this sleeve."*
*   **Layout**: Horizontal scroll snap.
*   **Item**: 3:4 aspect ratio cards with generated sketches.
*   **Action**: "Add to Canvas" button (Auto-places the node next to the current selection).

---

## 4. Deep Integration Logic (The "Bridge")

This is the hardest part: Connecting DOM elements (Sidebar) to Canvas (tldraw).

### Step 1: Drag Start (Sidebar Side)
In your React component (e.g., `FabricItem.tsx`):
```tsx
const onDragStart = (e: React.DragEvent, url: string, promptAddon: string) => {
  e.dataTransfer.setData('application/lovart-asset', JSON.stringify({
    type: 'texture',
    url: url,
    prompt: promptAddon
  }));
  e.dataTransfer.effectAllowed = 'copy';
  
  // Optional: Set a custom drag image
  // e.dataTransfer.setDragImage(dragImg, 20, 20);
};
```

### Step 2: Drop Handling (Canvas Side)
In your tldraw wrapper (`TldrawCanvas.tsx`):
```tsx
const onDrop = async (e: React.DragEvent) => {
  e.preventDefault();
  
  // 1. Check if it's our internal asset
  const data = e.dataTransfer.getData('application/lovart-asset');
  if (!data) return;
  
  const asset = JSON.parse(data);
  const point = editor.screenToPage(e.clientX, e.clientY);

  // 2. Check if dropped ON TOP of an existing Node
  const hitShape = editor.getShapeAtPoint(point);
  
  if (hitShape && hitShape.type === 'generator-node') {
    // Scenario A: Apply to existing node (Modify)
    if (asset.type === 'texture') {
       // Update the prompt of the existing node
       const newPrompt = hitShape.props.prompt + ", " + asset.prompt;
       editor.updateShape({ id: hitShape.id, props: { prompt: newPrompt } });
       toast.success("Texture applied! Click Generate to see changes.");
    }
  } else {
    // Scenario B: Create new node (Instantiate)
    // Create a new node with the asset as init_image or reference
    editor.createShape({
      type: 'generator-node',
      x: point.x, 
      y: point.y,
      props: { 
         mode: 'image',
         prompt: asset.prompt,
         references: [asset.url] 
      }
    });
  }
};
```

### Step 3: The "Visual Connector" (Polish)
When the user hovers over a generated asset in the sidebar:
*   Draw a **temporary SVG line** from the Sidebar asset to the currently selected Node on the canvas.
*   This signals: *"If you click/drag this, it will affect THAT node."*

---

## 5. antigravity Execution Prompts

### 🟩 Part 1: Server-Side Tools (AI SDK)
> **antigravity Command**:
> "Implement Vercel AI SDK `streamUI` in `app/api/chat/route.ts`.
> Define a tool `generate_fabric_swatches`.
> -   Input: `fabric_description` (string).
> -   Execution: Call Fal.ai `fast-sdxl` to generate 4 texture images in parallel.
> -   Return: Render the `<FabricGrid />` component with the resulting URLs."

### 🟦 Part 2: Client Components (Generative UI)
> **antigravity Command**:
> "Create `components/agent/FabricGrid.tsx`.
> -   Props: `images: string[]`, `prompt: string`.
> -   UI: Grid layout, circular images.
> -   Interaction: Implement `onDragStart` to set `dataTransfer` with type `application/lovart-asset` and the image URL."

### 🟪 Part 3: Canvas Drop Logic
> **antigravity Command**:
> "Update `components/canvas/UnifiedCanvas.tsx`.
> -   Add `onDrop` and `onDragOver` handlers to the container div.
> -   In `onDrop`: Parse the `application/lovart-asset` data.
> -   Use `editor.getShapeAtPoint()` to see if user dropped on a node.
> -   If yes, update that node's prompt. If no, create a new node."

---

### 6. Why this is "2025 Standard"?

1.  **No Context Switching**: 用户不需要复制粘贴提示词，也不需要下载图片再上传。一切都是**流 (Stream)**。
2.  **Server-Side Rendering**: AI 生成的内容直接以 UI 组件形式渲染，速度极快，SEO 友好。
3.  **Spatial Awareness**: 侧边栏知道画布上发生了什么（通过拖拽交互），打破了 DOM 也就是 HTML 元素之间的隔离。
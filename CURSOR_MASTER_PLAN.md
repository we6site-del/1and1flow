这是一份完全整合了我们所有讨论内容的**终极开发执行方案 (Master Plan)**。

这份文档是按照 **2025 年高级全栈架构标准** 编写的，特别针对 **cursor** 和 **Google Antigravity Agent** 进行了指令优化。它涵盖了**Server-Driven UI（配置驱动）**、**节点式画布**、**Agent 协同**以及**严格的商业化安全策略**。

请将以下内容保存为项目根目录下的 `CURSOR_MASTER_PLAN.md` 文件。

---

# 🏗️ CURSOR_MASTER_PLAN.md: Lovart-Flow (Ultimate Edition)

## 1. Project Context & Vision
**Product**: A professional AI Design Platform for Fashion Designers (Lovart.ai alternative).
**Core Differentiator**: A **Node-based Infinite Canvas** where users construct workflows using "Smart Generator Nodes" (Image/Video).
**Key Features**:
1.  **Polymorphic Nodes**: Drag-and-drop Image/Video generators that act as mini-apps on the canvas.
2.  **Server-Driven UI**: Admin configures model parameters (JSON Schema) in the backend; Frontend renders inputs dynamically.
3.  **Agent Copilot**: A sidebar AI that can "see" the canvas and "control" nodes via function calling.
4.  **Strict Monetization**: Atomic credit deduction via Python backend.

---

## 2. Technology Stack (The "2025 Standard")

### Frontend (Client)
-   **Framework**: **Next.js 14** (App Router, TypeScript).
-   **Canvas Engine**: **tldraw (Headless Mode)**. We build custom shapes, NOT using default UI.
-   **Design System**: **Radix UI Primitives** (Unstyled) + **Tailwind CSS** + **Framer Motion**.
    -   *Theme*: **Premium White** (Minimalist, Swiss Style, thin borders, glassmorphism).
-   **State**: **Zustand** (Global) + **TanStack Query** (Server state).
-   **AI SDK**: **Vercel AI SDK** (Core + React).

### Backend & Data (Server)
-   **Database**: **Supabase** (Postgres, Auth, Realtime).
-   **Logic Layer**: **Python FastAPI** (Stateless orchestrator).
    -   Handles Stripe Webhooks, Atomic Credit Logic, and AI API Proxying.
-   **Storage**: **Cloudflare R2** (For generated media - Zero Egress Fees) + **Supabase Storage** (Avatars).
-   **Admin Panel**: **Refine** (React framework) mounted at `/admin`.

### AI Infrastructure
-   **Realtime Image**: **Fal.ai** (Flux Pro/Schnell).
-   **Video Generation**: **Replicate** (Kling 2.1, Luma, SVD).
-   **Agent Brain**: **Claude 3.5 Sonnet** or **GPT-4o**.

---

## 3. Database Schema (Supabase)

### `public.ai_models` (The Configuration Engine)
*   `id`: UUID
*   `name`: String (e.g., "Kling 2.1 Master")
*   `provider`: Enum (FAL, REPLICATE)
*   `api_path`: String
*   `cost`: Integer
*   `type`: Enum (IMAGE, VIDEO)
*   **`parameters_schema`**: **JSONB** (Crucial). Defines the UI inputs.
    *   *Example*: `[{"key": "duration", "type": "select", "options": [5, 10]}, {"key": "aspect_ratio", "type": "grid_select"}]`

### `public.profiles` (Users)
*   `id`: UUID (FK to auth.users)
*   `credits`: Integer (⚠️ **RLS: Read-Only for user. Write-Only for Service Role**)

### `public.generations` (History)
*   `id`: UUID
*   `status`: Enum (QUEUED, COMPLETED, FAILED)
*   `result_url`: String (R2 URL)
*   `node_id`: String (Canvas Shape ID)

---

## 4. Implementation Phases & Cursor Prompts

Use these prompts sequentially to guide Cursor.

### ⬜ Phase 0: Design System & Layout (The White Theme)
**Goal**: Setup the pristine, minimalist UI foundation using Radix Primitives.

> **Cursor Command**:
> "Initialize Phase 0.
> 1.  **Setup**: Next.js 14 + Tailwind + Framer Motion + Radix UI (`@radix-ui/react-popover`, `-dialog`, `-tooltip`, `-slider`, `-switch`).
> 2.  **Theme**: Configure `globals.css` for a Premium White theme (`bg-white`, text `slate-900`, borders `gray-200`). Font: `Geist Sans`.
> 3.  **Components**: Create atomic components:
>     -   `GlassPanel`: White bg with `bg-white/80 backdrop-blur-md border border-gray-200/50`.
>     -   `FloatingToolbar`: A pill-shaped container with shadow.
>     -   `MinimalButton`: Ghost style with subtle hover states.
> 4.  **Layout**: Create a layout with a fixed top navbar (transparent) and a full-screen main area for the Canvas."

### 🟩 Phase 1: Supabase & Python Backend
**Goal**: Secure data layer and atomic credit logic.

> **Cursor Command**:
> "Initialize Phase 1.
> 1.  **Supabase**: Create tables (`profiles`, `ai_models`, `generations`, `credit_ledgers`).
> 2.  **Security**: Enable RLS. Users can only SELECT their own credits.
> 3.  **Python (FastAPI)**:
>     -   Setup FastAPI with `supabase-py` and `boto3` (for R2).
>     -   Create endpoint `POST /api/credits/deduct` that uses database-level locking (RPC) to safely subtract credits.
>     -   Create endpoint `POST /api/generate/proxy` that handles the AI logic."

### 🟦 Phase 2: Headless tldraw & Polymorphic Nodes
**Goal**: The drag-and-drop canvas experience.

> **Cursor Command**:
> "Initialize Phase 2.
> 1.  **tldraw**: Install `tldraw`. Render `<Tldraw hideUi={true} />`.
> 2.  **Custom Shape**: Define `generator-node` shape.
>     -   **Visuals**: A white card (`rounded-2xl`, `shadow-lg`) resembling the provided screenshots.
>     -   **Props**: `mode` ('image'|'video'), `prompt`, `settings` (JSON), `status`.
> 3.  **Left Sidebar**: Create a Radix UI draggable menu.
>     -   Implement 'Drag-to-Create': Dragging the 'Video' icon drops a `generator-node` (mode='video') onto the canvas.
> 4.  **Node UI**: Inside the shape, render:
>     -   A `Textarea` (auto-resize).
>     -   A `Dropzone` for reference images.
>     -   A placeholder area for the result."

### 🟧 Phase 3: Server-Driven UI & AI Integration
**Goal**: The node's settings bar renders dynamically based on DB config.

> **Cursor Command**:
> "Initialize Phase 3.
> 1.  **Dynamic Form**: Create `SettingsRenderer.tsx`.
>     -   It takes `schema` (JSON) as a prop.
>     -   It maps schema types to Radix UI components (e.g., 'grid_select' -> Popover with 3x3 grid).
> 2.  **Data Fetching**: Use TanStack Query to fetch active models from `ai_models`.
> 3.  **Integration**:
>     -   In `generator-node`, render `SettingsRenderer` in the bottom footer.
>     -   On 'Generate' click: Collect all form data -> Call Python Backend.
> 4.  **Execution**:
>     -   Backend: Deduct credits -> Call Replicate/Fal -> Upload to R2 -> Update Supabase.
>     -   Frontend: Listen to Supabase Realtime to auto-update the node with the result video/image."

### 🟪 Phase 4: Agent Copilot
**Goal**: The right-sidebar AI that controls the canvas.

> **Cursor Command**:
> "Initialize Phase 4.
> 1.  **Sidebar**: Create a collapsible right panel using `GlassPanel`.
> 2.  **Vercel AI SDK**: Setup `useChat` with a `system` prompt emphasizing 'Fashion Design Expert'.
> 3.  **Context Injection**: Pass the list of available models (from DB) to the LLM so it knows what it can use.
> 4.  **Tool Calling**: Implement client-side tools:
>     -   `create_node({ mode, prompt, x, y })`: Calls tldraw's `editor.createShape`.
>     -   `update_node_settings({ id, settings })`: Updates the dynamic settings of a selected node.
> 5.  **Vision**: Allow dragging an image from the canvas into the chat for analysis."

### 🟥 Phase 5: Refine Admin & Deployment
**Goal**: Operations and money management.

> **Cursor Command**:
> "Initialize Phase 5.
> 1.  **Refine**: Mount Refine at `/admin` inside Next.js.
> 2.  **Model Editor**: Create a resource for `ai_models`.
>     -   Include a JSON Editor for the `parameters_schema` field. This allows admins to add new model parameters (like 'duration') without code changes.
> 3.  **User Management**: View for banning users and gifting credits (calling Backend API).
> 4.  **Stripe**: Connect Stripe Webhook to Python Backend."

---

## 5. Key Development Guidelines (Security & Quality)

1.  **Never Trust Client**: Do not put Replicate/Fal API keys in Next.js. They belong in FastAPI.
2.  **No Raw Links**: Always upload AI results to Cloudflare R2. Never save the temporary Replicate URL to DB.
3.  **Optimistic UI**: When a user drags a node or clicks generate, the UI should respond instantly (show skeletons/spinners) while the backend processes.
4.  **Type Safety**: Share TypeScript interfaces between Frontend and Supabase generated types.

---

### 🚀 如何使用
1.  保存此文件。
2.  打开 Cursor。
3.  输入: *"Role: Senior Architect. Read `CURSOR_MASTER_PLAN.md`. Let's start with Phase 0. Please set up the Design System and Layout."*
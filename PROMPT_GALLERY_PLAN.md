🎨 Module Plan: Prompt Gallery (Midjourney Style)
1. 核心设计理念 (Design Concept)

    视觉风格: Midjourney Web 端风格。
        瀑布流 (Masonry Grid): 图片交错排列，充分利用空间。
        沉浸式: 点击左侧工具栏图标，弹出一个全屏覆盖层 (Full Screen Overlay)，而不是跳转页面（保持画布状态不丢失）。
        交互: 鼠标悬停图片时，显示 Prompt 摘要和操作按钮（Copy / Use）。
    数据流:
        管理员在 Refine 后台上传精选图片和 Prompt。
        用户在前台浏览，点击 "Use" 直接在 tldraw 画布上生成对应的预设节点。

2. 数据库设计 (Supabase Schema)

我们需要一张独立的表来存储这些“官方精选”内容。

Table: public.curated_prompts

    id: UUID (Primary Key)
    title: String (Short description, e.g., "Neon Cyberpunk Jacket")
    prompt: Text (The full prompt)
    negative_prompt: Text
    image_url: String (R2 Link, high quality preview)
    model_config: JSONB (Stores model_id, aspect_ratio, cfg, etc.)
    category: String (e.g., "Fashion", "Texture", "Photography")
    tags: Array<String>
    is_active: Boolean (Default: true)
    created_at: Timestamp

3. 开发执行流程 (Cursor Execution Guide)

请按顺序执行以下 Prompt。
🟥 Phase 1: Backend & Database (数据层)

    Cursor Command:
    "Start Prompt Gallery Phase 1.

        Supabase: Create table curated_prompts (see schema above). Enable RLS (Public Read-Only).
        Python Backend:
            Create router_prompts.py.
            Implement GET /api/prompts/gallery: Support pagination (page, limit) and filtering by category or tags.
            Implement POST /api/admin/prompts (Admin Only): For creating new entries.
        Type Sync: Generate TypeScript interfaces for this table in the frontend."

🟧 Phase 2: Admin Panel (后台管理层 - Refine)

管理员需要一个舒适的界面来上传这些精选图。

    Cursor Command:
    "Start Prompt Gallery Phase 2: Refine Admin.

        Resource: Add curated_prompts resource.
        Create/Edit View:
            Image Upload: Use a Dropzone to upload the preview image to R2 (via Backend API), get the URL, and save to image_url.
            Prompt Input: Large textarea.
            Model Config: A JSON editor or simple form fields to specify which model (e.g., Flux Pro) this prompt is best for.
        List View: Show a table with thumbnail previews, Title, and Category."

🟩 Phase 3: Frontend Components (UI 组件层)

前台需要实现类似 Midjourney 的瀑布流布局。

    Cursor Command:
    "Start Prompt Gallery Phase 3: Frontend UI.

        Dependencies: Install react-masonry-css (for the layout) and @radix-ui/react-dialog (for the overlay).
        Component: Create components/gallery/PromptGalleryOverlay.tsx.
            Layout: Use a Radix UI Dialog.Root with modal={true}. The content should be a full-screen overlay with a white background (bg-white/95 backdrop-blur-sm).
            Header: Search bar + Category pills (Filter).
            Grid: Use Masonry component. Render GalleryCard items.
        GalleryCard:
            Display the image.
            Hover State (Group): On hover, show a black-gradient overlay at the bottom.
            Content: Show truncated prompt text.
            Actions: 'Copy Prompt' (Icon) and 'Use in Canvas' (Button)."

🟦 Phase 4: Integration with Canvas (交互逻辑层)

这是最关键的一步：点击“Use”如何联动 tldraw。

    Cursor Command:
    "Start Prompt Gallery Phase 4: Integration.

        Toolbar Entry: In CanvasToolbar.tsx, add a new icon button (e.g., Library or Sparkles icon) on the left sidebar. Clicking it sets the isGalleryOpen state to true.
        Interaction Logic:
            In PromptGalleryOverlay, define onSelect(promptData).
            When user clicks 'Use in Canvas' on a card:
            a. Close the Overlay.
            b. Get the center of the current viewport using editor.getViewportScreenCenter().
            c. Call editor.createShape to instantiate a generator-node at that position.
            d. Pre-fill the node with the prompt, image_url (as reference if needed), and model_config from the gallery item.
        Motion: Add framer-motion layoutId transitions so the card seems to 'fly' into the canvas (optional polish)."

4. UI 细节规范 (The Midjourney Aesthetic)

为了达到 2025 年高级感（特别是配合你的白色主题），请参考以下 CSS 细节：

    卡片圆角: Midjourney 是直角或小圆角，但在你的白色主题中，建议使用 rounded-xl (12px) 增加亲和力。
    悬停效果:
        默认：图片无遮挡。
        Hover：图片轻微放大 (Scale 1.02)，底部出现 bg-gradient-to-t from-black/60 to-transparent 遮罩，白色文字浮现。
    Prompt 复制:
        点击复制按钮时，不要只弹 Toast。让按钮变成绿色的对勾 Check 图标，持续 2 秒，提供即时反馈。
    加载状态:
        使用 BlurHash 或 Skeleton。在图片加载出来之前，显示一个与图片色调一致的模糊色块，避免布局跳动 (CLS)。

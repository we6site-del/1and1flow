# AI Workflow 待办事项

## ✅ 已完成 (Version 97 - Weavy.ai 深色主题)
- [x] **Weavy.ai 风格深色主题节点** 🌙
  - [x] 画布背景改为 #1a1a1a 深灰色
  - [x] 节点背景改为 #2d2d2d
  - [x] 节点边框半透明白色
  - [x] 彩色端口系统（输入紫粉色，输出绿色）
  - [x] 紫色贝塞尔曲线连接
  - [x] 所有文本适配深色主题
  - [x] 所有输入控件适配深色背景
  - [x] FileInputNode 深色主题
  - [x] TextInputNode 深色主题
  - [x] 悬停和焦点效果优化

## ✅ 已完成 (Version 96 - 白色主题 Landing Page)
- [x] **Landing Page 白色主题改造** ✨
  - [x] 背景改为白色/浅灰渐变
  - [x] 所有按钮改为高级灰色 (#6b7280)
  - [x] 文字颜色适配白色背景
  - [x] Logo 改为灰色系
  - [x] 卡片阴影和边框优化
  - [x] 定价区域白色卡片设计
  - [x] Footer 浅灰背景
  - [x] 整体视觉层次提升
- [x] 修复 Dashboard 按钮嵌套问题（button 不能嵌套在 button 内）
- [x] 添加完整的新 Dashboard 样式到 CSS 文件
- [x] 优化 userStore 的 fetchUserProfile 处理
- [x] 添加临时 profile 降级方案
- [x] 改进错误处理，使应用即使在数据库出错时也能正常使用
- [x] 修复 Landing 页面显示
- [x] 实现用户登录/注册 UI
- [x] 实现 Dashboard 页面基础布局
- [x] 实现 Canvas 画布基础功能
- [x] 添加用户头像显示和 tooltip
- [x] 将 Sidebar 用户头像移至左上角，优化布局
- [x] 删除独立的 UserPanel 组件，统一用户信息入口
- [x] 工具面板改为 2 列网格布局
- [x] **集成画布与用户数据互通**
  - [x] 项目创建保存到数据库
  - [x] 项目加载从数据库读取
  - [x] 画布数据自动保存（30s + 防抖 5s + 页面关闭）
  - [x] 项目名称修改实时保存
  - [x] 添加加载状态和错误处理
- [x] **Landing Page 完整实现**
  - [x] 导航栏和 logo
  - [x] 英雄区域和主 CTA
  - [x] 功能展示区域
  - [x] 定价方案展示
  - [x] 页脚链接
  - [x] 中文本地化
- [x] **Dashboard 右键菜单和视图切换**
  - [x] 右键菜单（打开/重命名/删除项目）
  - [x] 网格/列表视图切换
  - [x] 项目缩略图显示
- [x] **移除调试面板**
  - [x] 从 Canvas 视图移除 DebugPanel
- [x] **添加文件输入节点 - 基础版**
  - [x] 创建 FileInputNode 组件
  - [x] 支持拖放上传文件
  - [x] 支持点击上传文件
  - [x] 支持粘贴文件链接
  - [x] 图片预览功能
  - [x] 添加到左侧AI工具面板
- [x] **文件输入节点 - 增强版 (Version 91)**
  - [x] 识别多种文件类型（图片、视频、文档、音频、压缩包）
  - [x] 彩色文件图标（PDF=红色、Word=蓝色、Excel=绿色、ZIP=橙色）
  - [x] 视频文件播放器支持
  - [x] 文件类型标签显示
  - [x] 创建详细测试指南
  - [x] 创建快速演示文档
- [x] **画布白色主题**
  - [x] 设置画布背景为白色
  - [x] 优化颜色配色（使用绿色主题色）
  - [x] 调整网格点颜色
- [x] **Weavy.ai 风格模型目录系统 (Version 93)**
  - [x] 创建节点目录系统 (nodesCatalog.ts)
  - [x] 实现 Schema-First 方法
  - [x] 添加 5 个图片模型 (FLUX Pro/Dev, SDXL, Midjourney, DALL·E 3)
  - [x] 添加 4 个视频模型 (Runway Gen-3, Pika Labs, Stable Video, Luma)
  - [x] 创建模型卡片组件 (ModelCard)
  - [x] 显示提供商、描述、定价信息
  - [x] 可展开配置预览
  - [x] 完整的 CSS 样式设计

## 🔧 待修复
- [ ] Supabase RLS 策略配置（需要数据库权限）
  - profiles 表的 INSERT 权限
  - storage buckets 的创建权限
  - 用户注册后自动创建 profile 的触发器或策略

## ✅ 已完成 (Version 99 - 节点功能完善)
- [x] **节点UI增强**
  - [x] 节点右上角三点菜单（配置、复制、删除）
  - [x] 节点加载状态动画（旋转圈LoadingSpinner）
  - [x] 节点执行进度显示（进度条ProgressBar）
  - [x] 占位图组件（PlaceholderImage马赛克效果）
  - [x] 所有节点组件集成NodeMenu
- [x] **修复节点功能问题**
  - [x] 修复 FileInputNode 文件上传功能（useRef + pointer events）
  - [x] 修复节点选中框错位（height: 100% + box-sizing）
  - [x] 添加图片/视频节点占位图（马赛克渐变效果）
- [x] **优化节点交互**
  - [x] 所有节点添加删除和复制功能
  - [x] 节点菜单hover效果优化
  - [x] LoadingSpinner集成到执行按钮

## ✅ 已完成 (Version 102 - 节点UI修复和多端口支持)
- [x] **节点头部添加模型logo** 🏷️
  - [x] 图片节点显示emoji logo + 模型名称
  - [x] 视频节点显示emoji logo + 模型名称
  - [x] 浮动显示在内容区域左上角
- [x] **修复图片网格显示（1-4张标准化）** 📐
  - [x] 1张图片：全屏显示(280px高)
  - [x] 2张图片：横向2列(140px高)
  - [x] 3-4张图片：2x2网格(280px高)
  - [x] 所有图片完整显示，不裁剪
- [x] **修复Lightbox放大UI** 🖼️
  - [x] 黑色背景(0.95透明度)
  - [x] 左上角关闭按钮
  - [x] 右上角计数器(1/4)
  - [x] 底部缩略图导航
  - [x] 继续创作按钮
  - [x] 参考Gemini风格设计
- [x] **添加多个输入端口** 🔌
  - [x] 图片节点：Prompt*, Image, LoRA
  - [x] 视频节点：Prompt*, Image, Video
  - [x] 所有端口显示标签和颜色
- [x] **修复视频播放问题** 🎬
  - [x] 使用可用的MP4 URL
  - [x] 添加autoPlay和preload属性
  - [x] 黑色背景显示视频
  - [x] objectFit: contain确保完整显示
- [x] **添加模型选择下拉** 📝
  - [x] 图片节点：添加模型选择器
  - [x] 视频节点：添加模型选择器
  - [x] Logo + 名称显示在选项中

## ✅ 已完成 (Version 101 - 节点UI重新设计)
- [x] **图片/视频节点重新设计** 🎨
  - [x] 大内容区域显示280px高（类似File节点）
  - [x] 参数移到内容区域下方（使用label+select布局）
  - [x] 底部独立"Run Model"按钮（蓝色，带→箭头）
  - [x] 端口标签文字显示（Prompt*紫色, Result绿色）
- [x] **继续创作功能增强** ✨
  - [x] 同时生成文本输入节点 + 新模型节点
  - [x] 自动连接两个节点（文本→模型）
  - [x] 自动选中并缩放到新节点位置
  - [x] 图片节点：点击Lightbox中"继续创作"
  - [x] 视频节点：内容下方显示"继续创作"按钮
- [x] **白色主题保持不变** ⚪
  - [x] 所有新设计保持白色主题
  - [x] 参数select白色背景
  - [x] Run Model按钮蓝色渐变hover效果

## 📋 待实现功能（Weavy.ai 风格完善）
- [ ] 左侧工具面板深色主题
- [ ] 右侧配置面板深色主题

## 📋 待实现功能
- [ ] 配置 OAuth 提供商（Google、GitHub）
- [ ] 实现积分系统完整逻辑
- [ ] 实现订阅管理功能
- [ ] 实现协作功能
- [ ] 实现项目复制功能（Dashboard 右键菜单中）
- [ ] 文件输入节点连接到其他节点的数据传递

## 🎨 UI 优化
- [ ] Dashboard 空状态和加载状态优化
- [ ] Canvas 工具栏和节点样式优化
- [ ] 响应式设计优化
- [ ] 动画和过渡效果优化

## 🧪 测试
- [x] 文件输入节点 - 图片上传测试
- [x] 文件输入节点 - 视频上传测试
- [x] 文件输入节点 - 文档上传测试（PDF、Word、Excel）
- [x] 文件输入节点 - 压缩文件测试
- [x] 文件输入节点 - URL 粘贴测试
- [x] 文件输入节点 - 拖放功能测试
- [x] 文件输入节点 - 删除功能测试
- [x] 文件类型识别准确性测试
- [ ] 测试完整的登录/注册流程
- [ ] 测试项目创建和加载
- [ ] 测试节点拖放和连接
- [ ] 测试积分扣除逻辑
- [ ] 测试 Landing Page 所有交互
- [ ] 测试 Dashboard 右键菜单所有功能

## 📚 文档已创建
- [x] 文件输入节点使用指南 (.same/file-input-node-guide.md)
- [x] 文件输入节点测试指南 (.same/file-input-test-guide.md)
- [x] 文件输入节点快速演示 (.same/quick-demo-file-input.md)

## 🚀 部署相关
- [ ] 配置 AipaxBase 后端服务
- [ ] 设置生产环境变量
- [ ] 配置 Supabase 生产数据库
- [ ] 部署前端到 Netlify/Vercel

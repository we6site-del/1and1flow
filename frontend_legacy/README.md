# AI 工作流 - 无限画布节点式AI创作平台

一个基于 tldraw 的可视化节点工作流系统，支持 AI 图片生成、视频生成和文本生成。

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ 主要功能

- 🎨 **图片生成**：支持多种AI模型（Flux Pro, Seedream, DALL-E等）
- 🎬 **视频生成**：从文字或图片生成视频（Runway, Luma等）
- 📝 **文本生成**：智能文本创作（GPT-4, Claude等）
- 🔗 **节点连接**：可视化工作流，拖拽连接节点
- 🖼️ **图片管理**：上传参考图、批量生成、2x2网格展示
- 🔍 **放大预览**：点击查看大图，支持继续创作
- ⚡ **链式创作**：基于生成结果继续创作，无限迭代
- 💬 **AI聊天**：右侧智能对话助手
- 👤 **用户系统**：登录注册、积分管理（Supabase）

## 🚀 快速开始

### 环境要求

- **Node.js**: 18.0 或更高版本
- **Bun**: 1.0 或更高版本（推荐）或 npm/pnpm
- **浏览器**: Chrome/Edge/Firefox 最新版本

### 安装步骤

#### 1. 克隆项目

```bash
# 如果你已经下载了项目，跳过这一步
git clone <your-repo-url>
cd ai-workflow
```

#### 2. 安装 Bun（如果还没安装）

**Windows:**
```bash
powershell -c "irm bun.sh/install.ps1|iex"
```

**macOS/Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

或者访问：https://bun.sh

#### 3. 安装依赖

```bash
cd ai-workflow
bun install
```

或使用 npm：
```bash
npm install
```

#### 4. 配置环境变量（可选）

复制环境变量模板：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置API密钥（当前为模拟模式，可跳过）：
```env
# AI API Keys（可选，当前使用模拟数据）
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key

# Supabase（可选）
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe（可选）
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

#### 5. 启动开发服务器

```bash
bun run dev
```

或使用 npm：
```bash
npm run dev
```

#### 6. 打开浏览器

开发服务器启动后，访问：
```
http://localhost:5173
```

🎉 **完成！** 你应该能看到应用界面了。

## 📖 使用指南

### 创建第一个工作流

1. **创建输入节点**
   - 点击左侧工具栏的"输入"图标（📝）
   - 在画布上点击放置
   - 输入文字描述，如："一台绿色的咖啡机"
   - 可选：点击"上传图片 (0/3)"添加参考图

2. **连接到生成节点**
   - 从输入节点右侧的圆形端口拖出
   - 选择"图片"或"视频"
   - 生成节点自动创建并连接

3. **配置参数**
   - 选择AI模型
   - 设置数量、比例等参数

4. **执行生成**
   - 点击"执行"按钮
   - 等待生成完成（约2-3秒）
   - 结果以2x2网格显示

5. **查看和继续创作**
   - 点击缩略图放大查看
   - 点击"继续创作"基于当前结果创建新节点

### 键盘快捷键

- `Space + 拖动`：移动画布
- `滚轮`：缩放
- `Ctrl/Cmd + Z`：撤销
- `Ctrl/Cmd + Shift + Z`：重做
- `Delete`：删除选中的节点

## 🛠️ 项目结构

```
ai-workflow/
├── src/
│   ├── components/          # React组件
│   │   ├── AIChatPanel.tsx     # AI聊天面板
│   │   ├── AuthModal.tsx       # 登录注册模态框
│   │   ├── OnCanvasComponentPicker.tsx  # 节点选择器
│   │   └── ...
│   ├── nodes/              # 节点定义
│   │   ├── types/
│   │   │   ├── TextInputNode.tsx      # 输入节点
│   │   │   ├── ImageGenerationNode.tsx # 图片生成节点
│   │   │   ├── VideoGenerationNode.tsx # 视频生成节点
│   │   │   └── TextGenerationNode.tsx  # 文本生成节点
│   │   ├── NodeShapeUtil.tsx          # 节点形状工具
│   │   └── nodeTypes.tsx              # 节点类型注册
│   ├── connection/         # 连接系统
│   ├── ports/              # 端口系统
│   ├── lib/                # 工具库
│   │   ├── ai-providers.ts    # AI提供商集成
│   │   └── supabase.ts        # Supabase客户端
│   ├── stores/             # 状态管理
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 入口文件
│   └── index.css           # 全局样式
├── .same/                  # 开发文档
├── public/                 # 静态资源
├── .env.example            # 环境变量模板
├── package.json            # 项目配置
└── README.md              # 项目说明
```

## 🔧 开发脚本

```bash
# 启动开发服务器
bun run dev

# 构建生产版本
bun run build

# 预览生产构建
bun run preview
```

## 📚 技术栈

- **前端框架**: React 18 + TypeScript
- **画布引擎**: tldraw 4.x
- **构建工具**: Vite 7
- **包管理器**: Bun
- **状态管理**: Zustand
- **样式**: CSS Modules + 原生CSS
- **UI组件**: Radix UI
- **后端**: Supabase（可选）
- **支付**: Stripe（可选）

## 🎯 当前状态

### ✅ 已完成功能

- [x] 无限画布节点系统
- [x] 输入节点（文字+多图片）
- [x] 图片生成节点（多模型、批量生成）
- [x] 视频生成节点
- [x] 文本生成节点
- [x] 节点连接和拖拽
- [x] 2x2网格图片展示
- [x] 图片放大预览
- [x] 链式创作功能
- [x] AI聊天面板
- [x] 用户认证系统
- [x] 白色主题UI

### ⚠️ 当前使用模拟数据

- 图片/视频生成使用随机图片服务（picsum.photos）
- 提示词和参考图片已正确传递到节点
- 但**未连接真实AI API**（需要配置API密钥）

### 🚧 待开发功能

- [ ] 集成真实AI API
- [ ] 作品保存/加载到云端
- [ ] 积分/订阅系统
- [ ] 批量导出功能
- [ ] 键盘快捷键优化
- [ ] 更多节点类型

## 🐛 问题排查

### 问题1：`bun install` 失败

**解决方法**：
```bash
# 尝试清除缓存
bun pm cache rm

# 重新安装
rm -rf node_modules
bun install
```

### 问题2：开发服务器启动失败

**解决方法**：
```bash
# 检查端口是否被占用
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows

# 或指定其他端口
bun run dev -- --port 3000
```

### 问题3：图片上传不工作

**解决方法**：
1. 刷新页面（Ctrl+R）
2. 清除浏览器缓存（Ctrl+Shift+R）
3. 检查浏览器控制台是否有错误

### 问题4：节点显示错误

**解决方法**：
```bash
# 清除vite缓存
rm -rf node_modules/.vite .vite

# 重启开发服务器
bun run dev
```

## 📝 环境变量说明

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `VITE_OPENAI_API_KEY` | OpenAI API密钥 | 否 | - |
| `VITE_ANTHROPIC_API_KEY` | Anthropic API密钥 | 否 | - |
| `VITE_GOOGLE_API_KEY` | Google API密钥 | 否 | - |
| `VITE_DEEPSEEK_API_KEY` | DeepSeek API密钥 | 否 | - |
| `VITE_SUPABASE_URL` | Supabase项目URL | 否 | - |
| `VITE_SUPABASE_ANON_KEY` | Supabase匿名密钥 | 否 | - |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe公钥 | 否 | - |

**注意**：所有环境变量都是可选的。未配置时，应用使用模拟数据运行。

## 🔒 安全提示

1. **不要提交 `.env` 文件到Git**
   - 已在 `.gitignore` 中配置
   - 只提交 `.env.example` 模板

2. **API密钥安全**
   - 生产环境使用环境变量
   - 不要在代码中硬编码密钥

3. **CORS配置**
   - 开发服务器已配置允许所有来源
   - 生产环境需要限制CORS

## 📖 更多文档

- [用户指南](.same/user-guide.md) - 详细的功能说明
- [v39改进总结](.same/v39-improvements.md) - 最新版本改进
- [测试指南](.same/v39-test-guide.md) - 完整的测试步骤
- [故障排除](.same/troubleshooting.md) - 常见问题解决
- [开发任务](.same/todos.md) - 开发进度和待办事项

## 🤝 贡献指南

欢迎提交问题和建议！

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE.md) 文件

## 💬 联系我们

- 问题反馈：[GitHub Issues](your-repo-url/issues)
- 邮箱：support@example.com

## 🙏 致谢

- [tldraw](https://tldraw.dev) - 优秀的画布引擎
- [Bun](https://bun.sh) - 快速的JavaScript运行时
- [Vite](https://vitejs.dev) - 下一代前端构建工具

---

**开始创作吧！** 🎨✨

如有问题，请查看 [故障排除文档](.same/troubleshooting.md) 或提交 Issue。

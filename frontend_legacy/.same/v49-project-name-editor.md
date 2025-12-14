# Version 49: 项目名称编辑器

## 🎯 新功能

在画布左上角添加了可编辑的项目名称，用户可以随时自定义项目名称。

## 📍 位置

```
Canvas 画布布局:

┌────────────────────────────────────────────┐
│ [Sidebar] [📄 未命名项目 ✏️]              │ ← 左上角
│           ↑                                │
│       项目名称编辑器                        │
│                                            │
│                                            │
│                                            │
│              画布工作区                     │
│                                            │
│                                            │
└────────────────────────────────────────────┘
```

**具体位置**:
- **Top**: 16px（与返回按钮对齐）
- **Left**: 80px（60px侧边栏 + 20px间距）
- **Z-index**: 10000（在其他元素之上）

## ✨ 功能详解

### 1. 显示状态

**默认显示**:
```
┌─────────────────────────┐
│ 📄 未命名项目 ✏️        │
└─────────────────────────┘
```

**元素组成**:
- **文档图标** (📄) - 左侧
- **项目名称** - 中间，粗体显示
- **编辑图标** (✏️) - 右侧，半透明

**样式**:
- 白色背景
- 1px浅灰色边框
- 8px圆角
- 轻微阴影
- Hover时背景变浅、边框加深

### 2. 编辑状态

**点击后变为编辑模式**:
```
┌─────────────────────────────┐
│ [输入框________] ✓ ✗        │
└─────────────────────────────┘
```

**元素组成**:
- **输入框** - 200px宽，自动聚焦并全选
- **保存按钮** (✓) - 蓝色，确认修改
- **取消按钮** (✗) - 灰色，放弃修改

**样式**:
- 蓝色边框（表示编辑中）
- 更明显的阴影
- 输入框无边框，聚焦样式

### 3. 交互行为

#### 进入编辑
1. 点击项目名称区域
2. 自动切换到编辑模式
3. 输入框自动聚焦
4. 当前名称被全选（方便直接输入）

#### 保存名称
**方式1: 点击保存按钮 (✓)**
- 验证输入（去除空格）
- 如果为空，使用"未命名项目"
- 更新项目名称
- 退出编辑模式

**方式2: 按Enter键**
- 与点击保存按钮效果相同
- 更快速的操作方式

**方式3: 失去焦点 (Blur)**
- 点击外部区域
- 自动保存当前输入
- 退出编辑模式

#### 取消编辑
**方式1: 点击取消按钮 (✗)**
- 恢复原始名称
- 放弃所有修改
- 退出编辑模式

**方式2: 按Esc键**
- 与点击取消按钮效果相同
- 快速放弃修改

## 🎨 视觉设计

### 显示状态样式
```css
Button:
  background: white
  padding: 10px 16px
  border-radius: 8px
  border: 1px solid rgba(0, 0, 0, 0.1)
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)

Hover:
  background: rgba(0, 0, 0, 0.02)
  border: 1px solid rgba(0, 0, 0, 0.15)
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12)
```

### 编辑状态样式
```css
Container:
  background: white
  padding: 8px 12px
  border-radius: 8px
  border: 1px solid rgba(59, 130, 246, 0.3)
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12)

Input:
  width: 200px
  font-size: 14px
  font-weight: 600

Buttons:
  width: 24px
  height: 24px
  border-radius: 4px

  Save (✓):
    background: #3b82f6 (蓝色)
    color: white

  Cancel (✗):
    background: rgba(0, 0, 0, 0.05) (浅灰)
    color: #666
```

## 🔄 使用流程

### 场景1: 创建新项目后重命名

```
1. Dashboard → 点击"创建新项目"
   ↓
2. 进入Canvas，左上角显示"未命名项目"
   ↓
3. 点击项目名称
   ↓
4. 输入"我的AI图片生成项目"
   ↓
5. 按Enter或点击✓保存
   ↓
6. 名称更新显示，继续编辑工作流
```

### 场景2: 修改现有项目名称

```
1. Dashboard → 打开已有项目
   ↓
2. Canvas显示当前项目名称
   ↓
3. 点击名称进入编辑
   ↓
4. 修改名称
   ↓
5. 失去焦点自动保存
```

### 场景3: 取消编辑

```
1. 点击项目名称
   ↓
2. 开始输入新名称
   ↓
3. 发现输入错误
   ↓
4. 按Esc或点击✗取消
   ↓
5. 恢复原始名称
```

## 💻 技术实现

### 组件结构

**ProjectNameEditor.tsx**:
```typescript
interface ProjectNameEditorProps {
  initialName?: string           // 初始项目名称
  onNameChange?: (name: string) => void  // 名称变更回调
}

State:
  - isEditing: boolean          // 是否在编辑状态
  - projectName: string         // 当前项目名称
  - tempName: string            // 临时编辑中的名称
```

### 状态管理

**App.tsx中的状态**:
```typescript
const [currentProjectName, setCurrentProjectName] = useState('未命名项目')

// 创建新项目时
handleCreateProject() {
  setCurrentProjectName('未命名项目')
}

// 打开项目时
handleOpenProject(projectId) {
  setCurrentProjectName('项目 ' + projectId.slice(0, 8))
}

// 名称变更时
handleProjectNameChange(newName) {
  setCurrentProjectName(newName)
  // 可以保存到localStorage或后端
  console.log('项目名称已更新:', newName)
}
```

### 全局变量传递

```typescript
// 定义全局变量
let globalProjectName: string = '未命名项目'
let globalProjectNameChange: ((name: string) => void) | null = null

// 在App组件中设置
globalProjectName = currentProjectName
globalProjectNameChange = handleProjectNameChange

// 在InFrontOfTheCanvas中使用
<ProjectNameEditor
  initialName={globalProjectName}
  onNameChange={globalProjectNameChange || (() => {})}
/>
```

### 关键逻辑

**自动聚焦和全选**:
```typescript
useEffect(() => {
  if (isEditing && inputRef.current) {
    inputRef.current.focus()
    inputRef.current.select()
  }
}, [isEditing])
```

**键盘事件处理**:
```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleSave()
  } else if (e.key === 'Escape') {
    handleCancel()
  }
}
```

**名称验证**:
```typescript
const handleSave = () => {
  const finalName = tempName.trim() || '未命名项目'
  setProjectName(finalName)
  setIsEditing(false)
  onNameChange?.(finalName)
}
```

## 📋 键盘快捷键

| 按键 | 功能 | 说明 |
|------|------|------|
| Click | 开始编辑 | 点击项目名称进入编辑模式 |
| Enter | 保存 | 保存当前输入的名称 |
| Esc | 取消 | 放弃修改，恢复原名称 |
| Tab | 失焦 | 自动保存并退出编辑 |

## 🎯 设计考量

### 1. 位置选择
- **左上角**: 项目名称通常在左上角，符合用户习惯
- **侧边栏右侧**: 不与Logo和返回按钮重叠
- **固定位置**: 始终可见，方便随时编辑

### 2. 交互方式
- **点击编辑**: 简单直观
- **自动聚焦**: 减少操作步骤
- **全选文本**: 方便快速替换
- **多种保存方式**: Enter、失焦、按钮 - 灵活便捷

### 3. 视觉反馈
- **编辑图标**: 提示可编辑
- **Hover效果**: 鼓励点击
- **蓝色边框**: 明确编辑状态
- **保存/取消按钮**: 清晰的操作选项

## 💡 使用技巧

### 快速重命名
1. 双击项目名称（未来可支持）
2. 直接输入新名称（旧名称会被全选）
3. 按Enter保存

### 批量命名规范
建议使用统一的命名规范：
- `[类型] - [日期] - [描述]`
- 例如：`图片生成 - 2025-11 - 产品宣传`

### 名称搜索
在Dashboard的搜索功能中，可以通过项目名称快速找到项目。

## 🐛 边界情况处理

### 空名称
```typescript
// 如果用户删除所有文字并保存
if (tempName.trim() === '') {
  finalName = '未命名项目'  // 使用默认名称
}
```

### 超长名称
- 当前未限制长度
- 建议未来添加最大长度限制（如50字符）
- 超长名称可能需要省略号显示

### 特殊字符
- 当前支持所有Unicode字符
- 可以使用中文、表情符号等
- 未来可能需要过滤某些特殊字符（如/, \等）

## 📊 未来改进

### 计划中的功能
- [ ] 双击进入编辑模式
- [ ] 名称长度限制和提示
- [ ] 名称历史记录
- [ ] 自动保存到云端
- [ ] 重复名称检测
- [ ] 名称模板选择
- [ ] 批量重命名工具

### 可能的增强
- [ ] 项目描述/备注
- [ ] 项目标签
- [ ] 项目颜色标记
- [ ] 项目图标选择
- [ ] 智能命名建议

## 📚 相关功能

### 与Dashboard的关联
- Dashboard显示项目名称
- 点击项目打开时显示对应名称
- 修改后的名称会反映在Dashboard列表中

### 与保存功能的关联
- 项目名称用于文件名（未来）
- 名称包含在项目元数据中
- 自动保存时使用最新名称

## 🔗 相关文档

- [Dashboard指南](./dashboard-guide.md)
- [侧边栏集成](./v48-sidebar-integration.md)
- [快速开始](./quick-start.md)

---

**版本**: v49
**日期**: 2025-11-03
**状态**: ✅ 已完成并测试
**新增**: 项目名称编辑器组件

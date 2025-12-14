# Version 42: 2x2缩略图网格和Lightbox功能指南

## 概述

Version 42 实现了图片生成节点的优化显示方式，将生成的图片以2x2网格缩略图形式展示，点击后可在Lightbox中放大查看，并支持继续创作功能。

## 主要功能

### 1. 2x2网格缩略图布局

#### 特性
- **网格排列**: 生成的图片以2列网格形式整齐排列
- **正方形缩略图**: 每个缩略图为正方形，保持一致性
- **自适应行数**: 根据生成数量自动计算行数
  - 1-2张图片: 1行
  - 3-4张图片: 2行
  - 支持最多4张图片

#### 布局计算
```typescript
// 缩略图大小计算
const thumbnailSize = (NODE_WIDTH_PX - 16 - 6) / 2
// 节点宽度 - 左右padding - 中间gap，除以2列

// 行数计算
const rows = Math.ceil(images.length / 2)

// 总高度
const imageHeight = rows * thumbnailSize + (rows - 1) * 6 + 8
// 行数 * 单个缩略图高度 + 行间距 + 顶部间距
```

#### 样式特点
- **间距**: 缩略图之间6px间距
- **圆角**: 6px圆角边框
- **边框**: 1px浅色边框
- **背景**: 浅灰色背景填充

### 2. 缩略图交互效果

#### Hover效果
当鼠标悬停在缩略图上时：
```css
transform: scale(1.02)           /* 轻微放大 */
box-shadow: 0 4px 12px rgba(0,0,0,0.12)  /* 添加阴影 */
transition: transform 0.2s, box-shadow 0.2s  /* 平滑过渡 */
cursor: pointer                  /* 指针变为手型 */
```

#### 点击响应
- 点击缩略图立即打开Lightbox
- 阻止事件冒泡，避免触发画布操作
- 使用`editor.markEventAsHandled`标记事件

### 3. Lightbox放大查看

#### 布局结构
```
┌─────────────────────────────────┐
│   半透明黑色背景 (backdrop-blur)   │
│  ┌─────────────────────────┐    │
│  │   白色容器 (圆角+阴影)    │    │
│  │  ┌───────────────────┐  │    │
│  │  │   放大的图片       │  │    │
│  │  │   (最大90vw/vh)   │  │    │
│  │  └───────────────────┘  │    │
│  │  ┌───────────────────┐  │    │
│  │  │ [继续创作] [关闭]  │  │    │
│  │  └───────────────────┘  │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

#### 样式特性
- **全屏覆盖**: `position: fixed`, `100vw x 100vh`
- **背景**: 85%不透明度黑色 + 4px背景模糊
- **图片容器**: 白色背景，12px圆角，深色阴影
- **图片尺寸**: 最大90vw宽度，最大90vh-80px高度
- **居中对齐**: Flexbox居中对齐
- **z-index**: 10000，确保在最上层

#### 按钮布局
```html
<继续创作按钮>
  - 蓝色背景 (var(--ai-accent))
  - 白色文字
  - 左侧+图标
  - Hover: 深蓝色 #2563eb

<关闭按钮>
  - 浅灰色背景
  - 深色文字
  - 左侧X图标
  - Hover: 稍深灰色
```

### 4. 继续创作功能

#### 工作流程

1. **触发条件**: 在Lightbox中点击"继续创作"按钮
2. **获取图片**: 使用当前选中的图片URL
3. **创建输入节点**:
   - 位置: 当前节点下方100px
   - X坐标: 与当前节点对齐
   - 内容: 包含选中的图片
4. **创建生成节点**:
   - 位置: 输入节点右侧350px
   - Y坐标: 与输入节点对齐
   - 参数: 继承当前节点的模型、模式、宽高比
5. **建立连接**: 自动连接输入节点和生成节点
6. **视图控制**:
   - 选中新创建的节点
   - 缩放视图以显示新节点
   - 动画时长: 500ms

#### 示意图
```
[当前图片生成节点]
    ↓ 点击"继续创作"
    ↓ (下方100px)
[新输入节点] ──连接──> [新图片生成节点]
  (包含选中图片)     (右侧350px)
```

### 5. 关闭Lightbox

#### 关闭方式
1. **点击关闭按钮**: 明确的关闭操作
2. **点击背景区域**: 点击Lightbox外部关闭
3. **状态重置**:
   - `setIsLightboxOpen(false)`
   - `setSelectedImageIndex(null)`

#### 事件处理
```typescript
// 背景点击关闭
onClick={(e) => {
  e.stopPropagation()
  setIsLightboxOpen(false)
  setSelectedImageIndex(null)
}}

// 内容区阻止冒泡
onClick={(e) => e.stopPropagation()}
```

## 技术实现细节

### React状态管理
```typescript
const [selectedImageIndex, setSelectedImageIndex] = React.useState<number | null>(null)
const [isLightboxOpen, setIsLightboxOpen] = React.useState(false)
```

### 节点高度动态计算
```typescript
getBodyHeightPx(_shape: NodeShape, node: ImageGenerationNode) {
  const baseHeight = NODE_ROW_HEIGHT_PX * 5.5
  let imageHeight = 0

  if (node.generatedImages && node.generatedImages.length > 0) {
    const thumbnailWidth = (NODE_WIDTH_PX - 16 - 6) / 2
    const rows = Math.ceil(node.generatedImages.length / 2)
    imageHeight = rows * thumbnailWidth + (rows - 1) * 6 + 8
  }

  return baseHeight + imageHeight
}
```

### Pointer Events处理
```css
pointerEvents: 'auto'  /* 确保缩略图和按钮可点击 */
```

## 用户体验优化

### 1. 视觉反馈
- ✅ 缩略图hover时轻微放大和添加阴影
- ✅ 按钮hover时改变背景色
- ✅ 所有交互都有平滑过渡动画

### 2. 操作流畅性
- ✅ 点击缩略图立即响应
- ✅ Lightbox打开/关闭无延迟
- ✅ 继续创作自动选中和缩放到新节点

### 3. 信息清晰度
- ✅ 缩略图清晰展示图片内容
- ✅ Lightbox中图片完整显示
- ✅ 按钮文字和图标明确表意

## 使用场景示例

### 场景1: 批量生成和选择
```
1. 创建文本输入节点，输入提示词
2. 创建图片生成节点，连接输入
3. 设置数量为4，执行生成
4. 查看2x2网格中的4张图片
5. 点击最喜欢的一张
6. 在Lightbox中放大查看细节
7. 确认满意后点击"继续创作"
8. 基于这张图片继续优化
```

### 场景2: 快速迭代
```
1. 生成初始图片
2. 点击其中一张打开Lightbox
3. 点击"继续创作"
4. 自动创建新的输入和生成节点
5. 在新输入节点中调整提示词
6. 执行新的生成
7. 重复此过程进行迭代优化
```

## 下一步改进方向

### 功能增强
- [ ] 支持键盘快捷键（ESC关闭Lightbox，方向键切换图片）
- [ ] 添加图片下载功能
- [ ] 支持图片拖拽排序
- [ ] 添加批量操作（全选、删除）

### 性能优化
- [ ] 懒加载大图
- [ ] 缩略图使用压缩版本
- [ ] 虚拟滚动支持更多图片

### 视觉优化
- [ ] 添加图片加载动画
- [ ] 优化不同宽高比的显示
- [ ] 添加图片元信息显示（尺寸、模型）

## 相关文件

- `/ai-workflow/src/nodes/types/ImageGenerationNode.tsx` - 主要实现文件
- `/ai-workflow/src/constants.ts` - 节点尺寸常量
- `/ai-workflow/src/index.css` - 全局样式

## 版本信息

- **版本号**: v42
- **发布日期**: 2025-11-02
- **主要改进**: 2x2网格缩略图 + Lightbox放大查看
- **向后兼容**: ✅ 完全兼容之前的节点数据

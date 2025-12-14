# 宣传页功能文档

## 概述
模仿 lovart.ai 的宣传页设计，用户必须注册或登录后才能访问 Workspace 进行项目创建。

## 设计特点

### 1. 视觉风格
- **黑色主题背景** (#0a0a0a, #0f0f0f, #1a1a1a)
- **绿色强调色** (#a0ff1f 主绿色, #60d9ff 蓝色副标题)
- **现代排版** - 大号粗体标题，清晰的层次结构
- **高对比度** - 黑底白字 + 绿色按钮

### 2. 页面结构

#### 导航栏
- Logo + 品牌名称
- 导航链接：首页、功能、定价、关于
- 绿色"开始使用"按钮（固定在顶部）

#### Hero 区域
- 超大标题："AI WORKFLOW"（120px）
- 副标题："智能设计工作流"（蓝色）
- 主要CTA按钮："立即开始创作"
- 背景：轻微模糊的设计作品展示

#### "为什么选择"区域
- 简洁说明产品核心价值
- 一句话介绍自动化设计流程

#### 功能展示区域（3个）
1. **只需给出想法**
   - 文字说明 + 交互式mockup
   - 绿色按钮："立即尝试"

2. **共同创作**
   - 左右布局（反向）
   - 图片展示 + 文字说明

3. **所有格式集于一处**
   - 图片展示 + 文字说明

#### 定价区域
- 标题："灵活的计划满足每个需求"
- 月付/年付切换按钮
- 3个价格卡片：
  - **入门版**：¥99/月，2000积分
  - **基础版**：¥199/月，3500积分（最受欢迎）
  - **专业版**：¥499/月，11000积分
- 每个卡片包含功能列表

#### 最终CTA区域
- 双标题："更智能的设计。更快速的创作。"
- 描述文字
- 大号绿色按钮："立即开始设计"

#### 页脚
- Logo + 品牌
- 4列链接：产品、资源、关于
- 版权信息 + 法律链接

## 用户流程

### 未登录用户
1. 访问网站 → 看到宣传页
2. 点击任何"开始使用"/"立即尝试"按钮
3. 弹出登录/注册模态框
4. 完成登录/注册
5. 自动跳转到 Dashboard

### 已登录用户
1. 访问网站 → 看到宣传页
2. 点击"开始使用"
3. 直接跳转到 Dashboard

## 技术实现

### 文件结构
```
src/
├── components/
│   ├── LandingPage.tsx       # 主组件
│   └── LandingPage.css       # 样式文件
└── App.tsx                   # 路由逻辑
```

### 路由逻辑
```typescript
const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'canvas'>('landing')

// Landing → Dashboard → Canvas
if (currentView === 'landing') {
  return <LandingPage onGetStarted={handleGetStarted} />
}

if (currentView === 'dashboard') {
  return <Dashboard ... />
}

return <Tldraw ... /> // Canvas view
```

### 认证集成
```typescript
const handleGetStarted = () => {
  if (isAuthenticated) {
    setCurrentView('dashboard')
  } else {
    setShowAuthModal(true)
  }
}

const handleAuthSuccess = () => {
  setShowAuthModal(false)
  setCurrentView('dashboard')
}
```

## CSS 关键特性

### 1. 渐变文字
```css
.landing-hero-title {
  background: linear-gradient(180deg, #ffffff 0%, #cccccc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### 2. Hover 效果
```css
.landing-hero-button:hover {
  background: #b5ff4d;
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(160, 255, 31, 0.4);
}
```

### 3. 响应式设计
```css
@media (max-width: 1024px) {
  .landing-feature {
    grid-template-columns: 1fr;
  }
  .pricing-grid {
    grid-template-columns: 1fr;
  }
}
```

## 可自定义元素

### 颜色主题
```css
/* 主绿色 */
--primary-green: #a0ff1f;
--primary-green-hover: #b5ff4d;

/* 背景色 */
--bg-dark: #0a0a0a;
--bg-darker: #0f0f0f;
--bg-card: #1a1a1a;

/* 蓝色副标题 */
--accent-blue: #60d9ff;
```

### 文字内容
在 `LandingPage.tsx` 中修改：
- Hero 标题和副标题
- 功能描述
- 定价计划名称和价格
- 页脚链接

### 图片
可以替换为自己的：
- Hero 背景图片
- 功能展示图片
- 使用 lovart.ai 的图片或上传自定义图片

## 性能优化

### 1. 图片加载
- 使用外部CDN图片链接（same-assets.com）
- 懒加载非关键图片

### 2. 动画
- 使用 CSS transitions 而非 JavaScript
- GPU 加速的 transform 属性

### 3. 响应式
- 移动端隐藏导航链接
- 价格卡片改为单列布局

## 下一步改进

### 高优先级
1. **动画增强**
   - 添加滚动动画（AOS/Framer Motion）
   - Hero 图片轮播动画
   - 数字计数动画

2. **交互优化**
   - 平滑滚动到指定区域
   - 导航栏滚动时样式变化
   - 移动端汉堡菜单

3. **内容完善**
   - 添加用户评价区域
   - 添加案例展示
   - 添加FAQ区域

### 中优先级
4. **SEO优化**
   - 添加 meta 标签
   - 结构化数据
   - sitemap

5. **A/B测试**
   - 不同CTA文案测试
   - 价格展示方式测试

6. **国际化**
   - 多语言支持
   - 货币转换

### 低优先级
7. **高级功能**
   - 视频背景
   - 3D 效果
   - 粒子动画

## 测试清单

### 功能测试
- [ ] 点击"开始使用"打开登录弹窗（未登录）
- [ ] 点击"开始使用"跳转到Dashboard（已登录）
- [ ] 导航链接正常工作
- [ ] 所有CTA按钮都能触发登录/跳转
- [ ] 价格卡片hover效果正常

### 视觉测试
- [ ] 黑色背景正确显示
- [ ] 绿色按钮对比度足够
- [ ] 文字可读性良好
- [ ] 间距和对齐正确

### 响应式测试
- [ ] 桌面端（1920px+）正常显示
- [ ] 平板端（768-1024px）布局调整
- [ ] 移动端（<768px）单列布局

### 性能测试
- [ ] 页面加载时间 < 3秒
- [ ] 图片优化
- [ ] 无布局偏移（CLS）

### 兼容性测试
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge

## 版本历史

### v55 (当前版本)
- ✅ 完整的宣传页设计
- ✅ 黑色背景 + 绿色主题色
- ✅ Hero、功能、定价、CTA、页脚所有区域
- ✅ 登录后才能访问Workspace
- ✅ 响应式设计

## 相关文件
- `src/components/LandingPage.tsx`
- `src/components/LandingPage.css`
- `src/App.tsx`（路由逻辑）
- `src/components/AuthModal.tsx`（登录弹窗）

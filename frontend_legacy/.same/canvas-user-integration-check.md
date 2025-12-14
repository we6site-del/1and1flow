# Tldraw Canvas 与用户数据互通检查报告

## 📋 检查日期
2025-01-04

## 🔍 检查范围
- 画布数据与用户关联
- 项目保存/加载功能
- 用户积分系统集成
- AI 生成记录

---

## ✅ 已实现的功能

### 1. 数据库函数 (database.ts)
已完整实现所有必要的数据库函数：

#### 项目管理
- ✅ `createProject(userId, name, canvasData)` - 创建项目
- ✅ `getUserProjects(userId)` - 获取用户项目列表
- ✅ `getProject(projectId)` - 获取单个项目
- ✅ `updateProject(projectId, updates)` - 更新项目
- ✅ `saveProjectCanvas(projectId, canvasData)` - 保存画布数据
- ✅ `deleteProject(projectId)` - 删除项目

#### AI 生成记录
- ✅ `createAIGeneration(userId, params)` - 创建 AI 生成记录
- ✅ `updateAIGeneration(generationId, updates)` - 更新生成状态
- ✅ `getUserGenerations(userId)` - 获取用户生成历史

#### 资产管理
- ✅ `uploadUserAsset(userId, file, projectId)` - 上传资产
- ✅ `getUserAssets(userId, projectId)` - 获取用户资产
- ✅ `deleteUserAsset(assetId)` - 删除资产

### 2. 用户状态管理 (userStore.ts)
- ✅ `user` - 用户信息（包含 ID、邮箱、积分等）
- ✅ `isAuthenticated` - 认证状态
- ✅ `deductCredits(amount)` - 扣除积分
- ✅ `addCredits(amount)` - 添加积分
- ✅ `updateCredits(credits)` - 更新积分

### 3. Dashboard 集成
- ✅ Dashboard 从数据库加载用户项目
- ✅ 显示项目列表、缩略图、更新时间
- ✅ 用户信息显示和同步

---

## ❌ 缺失的集成

### 🚨 关键问题

#### 1. **项目创建未保存到数据库**
**位置**: `App.tsx` 第 244-249 行

```typescript
const handleCreateProject = () => {
  const newProjectId = 'new-project-' + Date.now()  // ❌ 只是临时 ID
  setCurrentProjectId(newProjectId)
  setCurrentProjectName('未命名项目')
  setCurrentView('canvas')
  // ❌ 没有调用 createProject(userId, name)
}
```

**影响**:
- ❌ 项目不会保存到数据库
- ❌ 无法关联用户 ID
- ❌ Dashboard 无法显示新创建的项目
- ❌ 刷新页面后项目丢失

**应该的实现**:
```typescript
const handleCreateProject = async () => {
  if (!user?.id) return

  const project = await createProject(user.id, '未命名项目')
  if (project) {
    setCurrentProjectId(project.id)
    setCurrentProjectName(project.name)
    setCurrentView('canvas')
  }
}
```

---

#### 2. **项目打开未从数据库加载**
**位置**: `App.tsx` 第 251-257 行

```typescript
const handleOpenProject = (projectId: string) => {
  setCurrentProjectId(projectId)
  setCurrentProjectName('项目 ' + projectId.slice(0, 8))  // ❌ 假数据
  setCurrentView('canvas')
  // ❌ 没有调用 getProject(projectId)
  // ❌ 没有加载画布数据
}
```

**影响**:
- ❌ 画布数据不会恢复
- ❌ 项目名称不正确
- ❌ 无法加载之前保存的工作

**应该的实现**:
```typescript
const handleOpenProject = async (projectId: string) => {
  const project = await getProject(projectId)
  if (project) {
    setCurrentProjectId(project.id)
    setCurrentProjectName(project.name)
    // 画布数据会通过 persistenceKey 自动加载
    setCurrentView('canvas')
  }
}
```

---

#### 3. **画布数据未自动保存**
**问题**: 虽然有 `useAutoSave.ts` hook，但没有在 App.tsx 中使用

**影响**:
- ❌ 用户编辑不会保存到数据库
- ❌ 只保存在 localStorage（persistenceKey）
- ❌ 无法跨设备同步
- ❌ 无法恢复历史版本

**应该的实现**:
```typescript
// 在 Tldraw 的 onMount 中
useEffect(() => {
  if (!editor || !currentProjectId || !user?.id) return

  const interval = setInterval(async () => {
    const canvasData = editor.store.getSnapshot()
    await saveProjectCanvas(currentProjectId, canvasData)
  }, 30000) // 每 30 秒保存一次

  return () => clearInterval(interval)
}, [editor, currentProjectId, user?.id])
```

---

#### 4. **AI 生成未扣除积分**
**问题**: AI 节点执行时没有集成积分系统

**影响**:
- ❌ 用户可以无限使用 AI 功能
- ❌ 没有创建 AI 生成记录
- ❌ 无法追踪 AI 使用历史

**应该的实现**:
```typescript
// 在 AI 节点执行前
const creditsRequired = 10 // 根据模型不同
const success = await user.deductCredits(creditsRequired)

if (!success) {
  alert('积分不足！')
  return
}

// 创建生成记录
const generation = await createAIGeneration(user.id, {
  projectId: currentProjectId,
  generationType: 'image',
  modelName: 'flux-pro',
  prompt: userPrompt,
  creditsUsed: creditsRequired
})

// 执行 AI 生成...
// 更新生成记录状态
await updateAIGeneration(generation.id, {
  status: 'completed',
  outputData: result
})
```

---

#### 5. **项目名称修改未保存**
**位置**: `App.tsx` 第 263-267 行

```typescript
const handleProjectNameChange = (newName: string) => {
  setCurrentProjectName(newName)
  console.log('项目名称已更新:', newName)  // ❌ 只是打印
  // ❌ 没有调用 updateProject
}
```

**影响**:
- ❌ 项目名称修改不会保存
- ❌ 刷新后名称丢失

---

## 📊 功能对比表

| 功能 | 数据库函数 | UI 实现 | 集成状态 | 说明 |
|------|-----------|---------|----------|------|
| 创建项目 | ✅ | ✅ | ❌ | 只创建临时 ID，未保存到数据库 |
| 打开项目 | ✅ | ✅ | ❌ | 未从数据库加载数据 |
| 保存画布 | ✅ | ⚠️ | ❌ | 只保存在 localStorage |
| 加载画布 | ✅ | ⚠️ | ❌ | 只从 localStorage 加载 |
| 项目列表 | ✅ | ✅ | ✅ | Dashboard 正常工作 |
| 项目重命名 | ✅ | ✅ | ❌ | 未保存到数据库 |
| 删除项目 | ✅ | ❌ | ❌ | UI 未实现 |
| AI 生成 | ✅ | ✅ | ❌ | 未扣除积分，未创建记录 |
| 积分扣除 | ✅ | ✅ | ❌ | 未与 AI 功能集成 |
| 用户认证 | ✅ | ✅ | ✅ | 正常工作 |
| 资产上传 | ✅ | ⚠️ | ❌ | 函数已实现，UI 未集成 |

**图例**:
- ✅ 完全实现
- ⚠️ 部分实现
- ❌ 未实现或未集成

---

## 🔧 需要修复的文件

### 1. `App.tsx`
**优先级**: 🔴 高

需要修改的函数：
- [ ] `handleCreateProject` - 调用数据库创建项目
- [ ] `handleOpenProject` - 从数据库加载项目
- [ ] `handleProjectNameChange` - 保存名称到数据库
- [ ] 添加自动保存逻辑到 Tldraw 的 `onMount`
- [ ] 添加用户状态检查

### 2. AI 节点文件（待定位）
**优先级**: 🔴 高

需要添加：
- [ ] 积分检查
- [ ] 积分扣除
- [ ] 创建 AI 生成记录
- [ ] 更新生成状态

### 3. `useAutoSave.ts`
**优先级**: 🟡 中

需要：
- [ ] 在 App.tsx 中使用
- [ ] 与数据库集成

---

## 📝 详细修复步骤

### 步骤 1: 修复项目创建
```typescript
// App.tsx
import { createProject, saveProjectCanvas } from './lib/database'

const handleCreateProject = async () => {
  const { user } = useUserStore.getState()
  if (!user?.id) {
    setShowAuth(true)
    return
  }

  setLoading(true)
  try {
    const project = await createProject(user.id, '未命名项目')
    if (project) {
      setCurrentProjectId(project.id)
      setCurrentProjectName(project.name)
      setCurrentView('canvas')
    } else {
      alert('创建项目失败')
    }
  } catch (error) {
    console.error('Create project error:', error)
    alert('创建项目失败')
  } finally {
    setLoading(false)
  }
}
```

### 步骤 2: 修复项目加载
```typescript
// App.tsx
import { getProject, updateProjectLastOpened } from './lib/database'

const handleOpenProject = async (projectId: string) => {
  setLoading(true)
  try {
    const project = await getProject(projectId)
    if (project) {
      setCurrentProjectId(project.id)
      setCurrentProjectName(project.name)
      await updateProjectLastOpened(project.id)
      setCurrentView('canvas')
    } else {
      alert('项目不存在')
    }
  } catch (error) {
    console.error('Open project error:', error)
    alert('打开项目失败')
  } finally {
    setLoading(false)
  }
}
```

### 步骤 3: 添加自动保存
```typescript
// App.tsx - 在 Tldraw 组件内
useEffect(() => {
  if (!editor || !currentProjectId || !user?.id) return

  const saveCanvas = async () => {
    const snapshot = editor.store.getSnapshot()
    await saveProjectCanvas(currentProjectId, snapshot)
    console.log('画布已自动保存')
  }

  // 每 30 秒自动保存
  const interval = setInterval(saveCanvas, 30000)

  // 窗口关闭前保存
  const handleBeforeUnload = () => {
    saveCanvas()
  }
  window.addEventListener('beforeunload', handleBeforeUnload)

  return () => {
    clearInterval(interval)
    window.removeEventListener('beforeunload', handleBeforeUnload)
    saveCanvas() // 组件卸载时保存
  }
}, [editor, currentProjectId, user?.id])
```

### 步骤 4: 集成 AI 积分系统
```typescript
// 在 AI 节点执行函数中
async function executeAIGeneration(nodeId: string, prompt: string) {
  const { user, deductCredits } = useUserStore.getState()
  if (!user?.id) return

  const creditsRequired = 10

  // 检查并扣除积分
  const success = await deductCredits(creditsRequired)
  if (!success) {
    alert('积分不足！当前积分：' + user.credits)
    return
  }

  // 创建生成记录
  const generation = await createAIGeneration(user.id, {
    projectId: currentProjectId,
    generationType: 'image',
    modelName: 'flux-pro',
    prompt: prompt,
    creditsUsed: creditsRequired
  })

  try {
    // 调用 AI API
    const result = await callAIAPI(prompt)

    // 更新生成记录
    await updateAIGeneration(generation.id, {
      status: 'completed',
      outputData: result
    })

    return result
  } catch (error) {
    // 失败时退还积分
    await user.addCredits(creditsRequired)

    await updateAIGeneration(generation.id, {
      status: 'failed',
      errorMessage: error.message
    })

    throw error
  }
}
```

---

## 🎯 总结

### 当前状态
- 🟢 **数据库层**: 完整实现，功能齐全
- 🟢 **UI 层**: 基本完整，用户体验良好
- 🔴 **集成层**: **严重缺失**，数据不互通

### 核心问题
1. **画布与用户数据完全隔离**
2. **项目只存在于 localStorage**
3. **无法跨设备同步**
4. **AI 功能不消耗积分**
5. **无法追踪用户活动**

### 风险等级
🔴 **高风险** - 生产环境不可用

### 建议
1. **立即修复**: 项目创建和加载
2. **优先级高**: 自动保存和积分系统
3. **后续优化**: 版本历史、资产管理

---

## ✅ 修复后的功能流程

### 用户创建项目
1. 用户点击"创建新项目"
2. 检查用户登录状态
3. 调用 `createProject(user.id, name)`
4. 在数据库中创建项目记录（关联 user_id）
5. 跳转到画布
6. 开始自动保存

### 用户打开项目
1. 用户在 Dashboard 点击项目
2. 调用 `getProject(projectId)`
3. 加载项目数据和画布快照
4. 更新最后打开时间
5. 恢复画布状态
6. 开始自动保存

### 用户使用 AI
1. 用户在节点中输入提示词
2. 检查用户积分是否足够
3. 扣除积分
4. 创建 AI 生成记录
5. 调用 AI API
6. 更新生成记录状态
7. 返回结果到画布

### 用户编辑画布
1. 用户绘制、添加节点
2. 每 30 秒自动保存到数据库
3. 窗口关闭前保存
4. 可恢复历史版本（如果实现）

---

**报告结论**:
❌ **画布当前未与用户数据互通**
✅ **但所有必要的基础设施都已就绪**
🔧 **只需要在 App.tsx 中添加集成代码**

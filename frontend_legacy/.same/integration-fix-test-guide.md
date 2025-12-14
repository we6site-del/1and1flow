# 画布与用户数据集成修复 - 测试指南

## ✅ 版本 74 - 集成完成

### 🎉 已修复的功能

#### 1. **项目创建保存到数据库**
- ✅ 检查用户登录状态
- ✅ 调用 `createProject(userId, name)`
- ✅ 在数据库中创建项目记录
- ✅ 关联用户 ID
- ✅ 返回项目 ID 和名称

#### 2. **项目加载从数据库读取**
- ✅ 调用 `getProject(projectId)`
- ✅ 加载项目名称和数据
- ✅ 更新最后打开时间
- ✅ 错误处理（项目不存在）

#### 3. **画布自动保存**
- ✅ 每 30 秒自动保存
- ✅ 用户停止编辑 5 秒后保存（防抖）
- ✅ 页面关闭前保存
- ✅ 组件卸载时保存
- ✅ 监听编辑器变化自动触发

#### 4. **项目名称实时保存**
- ✅ 修改名称即时保存到数据库
- ✅ 使用 `updateProject(projectId, { name })`

#### 5. **加载状态显示**
- ✅ 项目创建/加载时显示加载动画
- ✅ 优雅的错误提示

---

## 🧪 测试步骤

### 测试 1: 项目创建和数据库保存

**步骤**:
1. 登录账号
2. 在 Dashboard 点击 "创建新项目"
3. 等待加载完成
4. 进入 Canvas 工作区

**验证**:
- [ ] 应该显示加载动画
- [ ] 成功进入 Canvas
- [ ] 控制台输出: `项目创建成功: [project-id]`
- [ ] 返回 Dashboard，应该看到新创建的项目

**数据库验证**:
```sql
SELECT * FROM projects
WHERE user_id = '[your-user-id]'
ORDER BY created_at DESC
LIMIT 1;
```
应该看到新创建的项目记录。

---

### 测试 2: 项目加载

**步骤**:
1. 在 Dashboard 点击已有项目
2. 等待加载完成
3. 查看项目名称是否正确

**验证**:
- [ ] 显示加载动画
- [ ] 项目名称显示正确
- [ ] 控制台输出: `项目加载成功: [project-name]`
- [ ] 画布数据恢复（如果之前有保存）

**数据库验证**:
```sql
SELECT name, last_opened_at FROM projects
WHERE id = '[project-id]';
```
`last_opened_at` 应该更新为当前时间。

---

### 测试 3: 画布自动保存

**步骤**:
1. 打开一个项目
2. 在画布上添加一些节点或绘制内容
3. 等待 5 秒（防抖保存）
4. 查看控制台

**验证**:
- [ ] 5 秒后控制台输出: `画布已自动保存 ✓`
- [ ] 30 秒后再次自动保存
- [ ] 刷新页面，画布数据应该恢复

**控制台检查**:
```javascript
// 在浏览器控制台执行
const editor = window.editor
if (editor) {
  console.log('编辑器已加载 ✓')
  console.log('当前形状数:', editor.getCurrentPageShapes().length)
}
```

---

### 测试 4: 项目重命名保存

**步骤**:
1. 在 Canvas 中点击项目名称
2. 修改为新名称（如 "我的测试项目"）
3. 等待 1-2 秒
4. 查看控制台

**验证**:
- [ ] 控制台输出: `项目名称已保存到数据库: 我的测试项目`
- [ ] 返回 Dashboard
- [ ] 项目名称已更新

**数据库验证**:
```sql
SELECT name, updated_at FROM projects
WHERE id = '[project-id]';
```
名称应该更新，`updated_at` 时间戳也应该更新。

---

### 测试 5: 页面关闭前保存

**步骤**:
1. 打开项目并进行编辑
2. 关闭浏览器标签页
3. 重新打开项目

**验证**:
- [ ] 画布数据已保存
- [ ] 所有修改都恢复

---

### 测试 6: 用户未登录时创建项目

**步骤**:
1. 退出登录（如果已登录）
2. 尝试点击 "创建新项目"

**验证**:
- [ ] 应该弹出登录模态框
- [ ] 不会创建项目

---

### 测试 7: 多项目管理

**步骤**:
1. 创建项目 A
2. 返回 Dashboard
3. 创建项目 B
4. 返回 Dashboard
5. 打开项目 A
6. 编辑项目 A
7. 返回 Dashboard
8. 打开项目 B

**验证**:
- [ ] Dashboard 显示两个项目
- [ ] 项目 A 的编辑已保存
- [ ] 项目 B 是独立的
- [ ] 每个项目有独立的 ID

---

## 🔍 数据流验证

### 项目创建流程

```
用户点击创建
  ↓
检查登录状态 (user?.id)
  ↓
显示 Loading
  ↓
createProject(userId, "未命名项目")
  ↓
数据库插入记录 (projects 表)
  ↓
返回 project.id
  ↓
setCurrentProjectId(project.id)
  ↓
进入 Canvas (view = 'canvas')
  ↓
开始自动保存
```

### 画布保存流程

```
用户编辑画布
  ↓
触发 editor.store.listen
  ↓
防抖 5 秒
  ↓
获取 editor.store.getSnapshot()
  ↓
saveProjectCanvas(projectId, snapshot)
  ↓
更新数据库 (UPDATE projects SET canvas_data = ...)
  ↓
控制台输出 "画布已自动保存 ✓"
```

---

## 📊 数据库检查清单

### Projects 表字段验证

```sql
-- 检查项目记录
SELECT
  id,
  user_id,
  name,
  canvas_data IS NOT NULL as has_canvas_data,
  created_at,
  updated_at,
  last_opened_at
FROM projects
WHERE user_id = '[your-user-id]'
ORDER BY created_at DESC;
```

**预期结果**:
- ✅ `user_id` 正确关联
- ✅ `name` 显示项目名称
- ✅ `canvas_data` 不为空（保存后）
- ✅ `updated_at` 在保存后更新
- ✅ `last_opened_at` 在打开时更新

---

## 🐛 常见问题排查

### 问题 1: 项目创建失败

**症状**: 点击创建项目后卡在加载状态

**检查**:
1. 打开浏览器控制台查看错误
2. 检查用户是否登录: `localStorage.getItem('user-storage')`
3. 检查 Supabase 连接是否正常

**可能原因**:
- 数据库连接失败
- RLS 策略限制
- 用户未登录

### 问题 2: 画布数据未保存

**症状**: 刷新页面后画布内容丢失

**检查**:
1. 控制台是否显示 "画布已自动保存 ✓"
2. `window.editor` 是否存在
3. 网络请求是否成功

**调试代码**:
```javascript
// 手动触发保存
const editor = window.editor
const snapshot = editor.store.getSnapshot()
console.log('Snapshot:', snapshot)

// 检查项目 ID
console.log('Current Project ID:', '[检查 App state]')
```

### 问题 3: 项目列表不显示新项目

**症状**: Dashboard 没有显示刚创建的项目

**检查**:
1. 刷新 Dashboard 页面
2. 检查数据库是否有记录
3. 检查 `getUserProjects(userId)` 是否正常

---

## ✅ 集成完成度检查

| 功能 | 状态 | 说明 |
|------|------|------|
| 项目创建 | ✅ | 保存到数据库，关联用户 |
| 项目加载 | ✅ | 从数据库读取 |
| 画布保存 | ✅ | 自动保存（30s + 防抖 5s） |
| 项目重命名 | ✅ | 实时保存 |
| 加载状态 | ✅ | 显示动画 |
| 错误处理 | ✅ | 友好提示 |
| 用户验证 | ✅ | 检查登录状态 |
| 数据库关联 | ✅ | user_id 正确关联 |

---

## 🎯 下一步优化

虽然核心集成已完成，以下功能可以后续添加：

### 待实现
- [ ] AI 生成积分扣除
- [ ] 项目删除功能 UI
- [ ] 项目版本历史
- [ ] 资产上传集成
- [ ] 项目分享功能
- [ ] 协作功能
- [ ] 离线编辑支持

### 性能优化
- [ ] 画布数据压缩
- [ ] 增量保存（只保存变更）
- [ ] 缓存策略
- [ ] 加载优化

---

## 📝 总结

### ✅ 已实现的核心功能

1. **完整的项目生命周期管理**
   - 创建 → 保存 → 加载 → 编辑 → 自动保存

2. **用户数据完全互通**
   - 项目关联用户 ID
   - 画布数据保存到数据库
   - Dashboard 显示用户项目

3. **自动保存机制**
   - 多种触发方式
   - 防抖优化
   - 可靠性保证

4. **友好的用户体验**
   - 加载状态
   - 错误提示
   - 实时反馈

### 🎉 集成状态

**画布与用户数据现在已完全互通！** ✅

---

**测试完成后，请记录任何问题或建议！**

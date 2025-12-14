# 🚀 AI Models 快速参考卡片

## 📍 访问路径

```
http://localhost:3000/admin/ai-models
```

## ⚡ 快速创建模型

### 1. 基本信息

| 字段 | 必填 | 示例值 |
|------|------|--------|
| Name | ✅ | `Flux Pro` |
| Type | ✅ | `IMAGE` 或 `VIDEO` |
| Provider | ✅ | `FAL`, `REPLICATE`, `CUSTOM` |
| API Path | ✅ | `fal-ai/flux-pro` |
| Cost | ✅ | `22` (积分) |
| Active | - | `true` / `false` |
| Description | - | 模型描述 |

### 2. Parameters Schema 模板

#### 图片模型（基础）
```json
[
  {
    "key": "aspect_ratio",
    "label": "Aspect Ratio",
    "type": "grid_select",
    "options": [
      {"label": "1:1", "value": "1:1"},
      {"label": "16:9", "value": "16:9"},
      {"label": "9:16", "value": "9:16"}
    ],
    "default": "1:1"
  }
]
```

#### 视频模型（基础）
```json
[
  {
    "key": "duration",
    "label": "Duration",
    "type": "select",
    "options": [
      {"label": "5s", "value": "5s"},
      {"label": "10s", "value": "10s"}
    ],
    "default": "5s"
  }
]
```

## 📝 参数类型速查

| 类型 | 用途 | 必需字段 | 示例 |
|------|------|----------|------|
| `select` | 下拉选择 | `options` | 时长、质量等级 |
| `grid_select` | 网格选择 | `options` | 宽高比 |
| `slider` | 滑动条 | `min`, `max` | 强度、步数 |
| `switch` | 开关 | - | 启用/禁用功能 |
| `text` | 文本输入 | - | 负面提示词 |

## 🔗 常用 API Path

### FAL.ai
- `fal-ai/flux-pro` - Flux Pro 图片
- `fal-ai/flux/dev` - Flux Dev 图片
- `fal-ai/kling-video/v1/standard/text-to-video` - Kling 视频

### Replicate
- `kling-ai/kling-video-v2` - Kling 2.1 视频
- `google/veo-3.1-fast` - Veo 3.1 视频
- `stability-ai/stable-diffusion` - Stable Diffusion

## ✅ 验证清单

创建模型前检查：

- [ ] 基本信息完整
- [ ] API Path 正确（参考提供商文档）
- [ ] Schema JSON 格式正确
- [ ] Schema 通过验证（无红色错误）
- [ ] 实时预览显示正常
- [ ] 设置了合理的默认值
- [ ] 积分成本设置合理

## 🎯 常见 API Path 查找

**FAL.ai**: https://fal.ai/models  
**Replicate**: https://replicate.com/explore

---

📖 **详细教程**: 查看 `AI_MODELS_ADMIN_TUTORIAL.md`









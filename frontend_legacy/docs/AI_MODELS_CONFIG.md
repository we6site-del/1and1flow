# AI 模型配置指南

## 📋 支持的模型类型

- **text**: 文本生成 (GPT-4, Claude)
- **image**: 图像生成 (DALL-E, SD)
- **video**: 视频生成
- **audio**: 音频生成

## 🚀 配置步骤

### 1. 访问管理界面
cd /home/project && npm_config_yes=true cat > ai-workflow/docs/AI_MODELS_CONFIG.md << 'EOF'
# AI 模型配置指南

## 📋 支持的模型类型

- **text**: 文本生成 (GPT-4, Claude)
- **image**: 图像生成 (DALL-E, SD)
- **video**: 视频生成
- **audio**: 音频生成

## 🚀 配置步骤

### 1. 访问管理界面
 http://localhost:8080

### 2. 添加模型


### 3. 配置示例

**OpenAI GPT-4**:
```json
{
  "name": "GPT-4",
  "type": "text",
  "provider": "OpenAI",
  "modelId": "gpt-4-turbo-preview",
  "apiKey": "sk-your-key",
  "maxTokens": 4096
}
```

**DALL-E 3**:
```json
{
  "name": "DALL-E 3",
  "type": "image",
  "provider": "OpenAI",
  "modelId": "dall-e-3",
  "apiKey": "sk-your-key"
}
```

## 🔐 获取 API Keys

- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/
- Google: https://makersuite.google.com/app/apikey

## 🧪 测试配置

```bash
bun run scripts/test-aipexbase.ts
```

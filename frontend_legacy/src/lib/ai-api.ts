/**
 * AI API 集成
 * 支持 OpenAI, Anthropic, Google AI
 */

// API 配置
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''
const GOOGLE_AI_API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || ''

export const AI_ENABLED = Boolean(OPENAI_API_KEY || ANTHROPIC_API_KEY || GOOGLE_AI_API_KEY)

// ============================================
// 类型定义
// ============================================

export interface TextGenerationParams {
  prompt: string
  model?: string
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
}

export interface ImageGenerationParams {
  prompt: string
  model?: string
  size?: '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024'
  quality?: 'standard' | 'hd'
  style?: 'natural' | 'vivid'
  n?: number
}

export interface AIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// ============================================
// OpenAI API
// ============================================

export async function generateTextWithOpenAI(
  params: TextGenerationParams
): Promise<AIResponse<string>> {
  if (!OPENAI_API_KEY) {
    return {
      success: false,
      error: 'OpenAI API key not configured',
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: params.model || 'gpt-4-turbo-preview',
        messages: [
          ...(params.systemPrompt ? [{ role: 'system', content: params.systemPrompt }] : []),
          { role: 'user', content: params.prompt },
        ],
        max_tokens: params.maxTokens || 1000,
        temperature: params.temperature || 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'OpenAI API error')
    }

    const data = await response.json()

    return {
      success: true,
      data: data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    }
  } catch (error) {
    console.error('OpenAI text generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function generateImageWithOpenAI(
  params: ImageGenerationParams
): Promise<AIResponse<string[]>> {
  if (!OPENAI_API_KEY) {
    return {
      success: false,
      error: 'OpenAI API key not configured',
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: params.model || 'dall-e-3',
        prompt: params.prompt,
        n: params.n || 1,
        size: params.size || '1024x1024',
        quality: params.quality || 'standard',
        style: params.style || 'vivid',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'OpenAI API error')
    }

    const data = await response.json()
    const urls = data.data.map((item: any) => item.url)

    return {
      success: true,
      data: urls,
    }
  } catch (error) {
    console.error('OpenAI image generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================
// Anthropic Claude API
// ============================================

export async function generateTextWithClaude(
  params: TextGenerationParams
): Promise<AIResponse<string>> {
  if (!ANTHROPIC_API_KEY) {
    return {
      success: false,
      error: 'Anthropic API key not configured',
    }
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: params.model || 'claude-3-opus-20240229',
        max_tokens: params.maxTokens || 1024,
        temperature: params.temperature || 0.7,
        system: params.systemPrompt || '',
        messages: [
          { role: 'user', content: params.prompt },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Anthropic API error')
    }

    const data = await response.json()

    return {
      success: true,
      data: data.content[0]?.text || '',
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    }
  } catch (error) {
    console.error('Claude text generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================
// Google AI API (Gemini)
// ============================================

export async function generateTextWithGemini(
  params: TextGenerationParams
): Promise<AIResponse<string>> {
  if (!GOOGLE_AI_API_KEY) {
    return {
      success: false,
      error: 'Google AI API key not configured',
    }
  }

  try {
    const model = params.model || 'gemini-pro'
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: params.prompt }],
          }],
          generationConfig: {
            temperature: params.temperature || 0.7,
            maxOutputTokens: params.maxTokens || 1024,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Google AI API error')
    }

    const data = await response.json()

    return {
      success: true,
      data: data.candidates[0]?.content?.parts[0]?.text || '',
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
    }
  } catch (error) {
    console.error('Gemini text generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================
// 统一接口
// ============================================

export async function generateText(
  params: TextGenerationParams & { provider?: 'openai' | 'claude' | 'gemini' }
): Promise<AIResponse<string>> {
  const provider = params.provider || 'openai'

  switch (provider) {
    case 'openai':
      return generateTextWithOpenAI(params)
    case 'claude':
      return generateTextWithClaude(params)
    case 'gemini':
      return generateTextWithGemini(params)
    default:
      return {
        success: false,
        error: 'Unknown provider',
      }
  }
}

export async function generateImage(
  params: ImageGenerationParams & { provider?: 'openai' }
): Promise<AIResponse<string[]>> {
  const provider = params.provider || 'openai'

  switch (provider) {
    case 'openai':
      return generateImageWithOpenAI(params)
    default:
      return {
        success: false,
        error: 'Unknown provider',
      }
  }
}

// ============================================
// 积分计算
// ============================================

export function calculateCredits(
  type: 'text' | 'image' | 'video',
  model: string,
  tokens?: number
): number {
  if (type === 'text') {
    // 文本生成：根据 tokens 计算
    const tokensUsed = tokens || 1000
    return Math.ceil(tokensUsed / 1000) // 每1000 tokens = 1积分
  }

  if (type === 'image') {
    // 图片生成：根据质量计算
    if (model.includes('dall-e-3')) {
      return 10 // DALL-E 3: 10积分
    }
    return 5 // 其他: 5积分
  }

  if (type === 'video') {
    // 视频生成：根据时长计算
    return 50 // 视频: 50积分
  }

  return 1
}

// ============================================
// 模拟 API（用于开发和测试）
// ============================================

export async function generateTextMock(
  params: TextGenerationParams
): Promise<AIResponse<string>> {
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 1000))

  return {
    success: true,
    data: `This is a mock response to: "${params.prompt}"\n\nIn a real implementation, this would be generated by AI.`,
    usage: {
      promptTokens: 10,
      completionTokens: 50,
      totalTokens: 60,
    },
  }
}

export async function generateImageMock(
  params: ImageGenerationParams
): Promise<AIResponse<string[]>> {
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 2000))

  // 返回 placeholder 图片
  const urls = Array.from({ length: params.n || 1 }, (_, i) =>
    `https://picsum.photos/seed/${Date.now()}_${i}/1024/1024`
  )

  return {
    success: true,
    data: urls,
  }
}

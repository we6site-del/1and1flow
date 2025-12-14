// 节点目录系统 - Weavy.ai 风格
// 每个 AI 工具都有明确的 Schema 定义

export interface ToolSchema {
  id: string
  name: string
  category: 'ai-tool' | 'image-model' | 'video-model' | 'text-model'
  provider: string
  icon: React.ReactNode
  description: string
  version: string

  // JSON Schema 定义
  inputSchema: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }

  outputSchema: {
    type: string
    properties: Record<string, any>
  }

  // 配置参数
  configSchema: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }

  // MCP 端点（如果适用）
  mcpEndpoint?: string

  // 定价信息
  pricing?: {
    credits: number
    unit: 'per_call' | 'per_token' | 'per_second'
  }
}

// AI 工具目录
export const AI_TOOLS_CATALOG: ToolSchema[] = [
  {
    id: 'text-input',
    name: '文本输入',
    category: 'ai-tool',
    provider: 'system',
    icon: null,
    description: '输入文本内容和图片',
    version: '1.0.0',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    outputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        images: { type: 'array', items: { type: 'string' } },
      },
    },
    configSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    id: 'file-input',
    name: '文件输入',
    category: 'ai-tool',
    provider: 'system',
    icon: null,
    description: '上传和管理文件',
    version: '1.0.0',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    outputSchema: {
      type: 'object',
      properties: {
        fileName: { type: 'string' },
        fileUrl: { type: 'string' },
        fileType: { type: 'string' },
      },
    },
    configSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    id: 'text-generation',
    name: 'AI 文本生成',
    category: 'ai-tool',
    provider: 'openai',
    icon: null,
    description: '使用 AI 生成文本内容',
    version: '1.0.0',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: '提示词' },
        context: { type: 'string', description: '上下文' },
      },
      required: ['prompt'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        tokens: { type: 'number' },
      },
    },
    configSchema: {
      type: 'object',
      properties: {
        model: {
          type: 'string',
          enum: ['gpt-4', 'gpt-3.5-turbo', 'claude-3'],
          default: 'gpt-3.5-turbo',
        },
        temperature: {
          type: 'number',
          minimum: 0,
          maximum: 2,
          default: 0.7,
        },
        maxTokens: {
          type: 'number',
          minimum: 1,
          maximum: 4096,
          default: 1000,
        },
      },
    },
    pricing: {
      credits: 10,
      unit: 'per_token',
    },
  },
]

// 图片模型目录
export const IMAGE_MODELS_CATALOG: ToolSchema[] = [
  {
    id: 'flux-pro',
    name: 'FLUX Pro',
    category: 'image-model',
    provider: 'black-forest-labs',
    icon: null,
    description: '最先进的图像生成模型，质量最高',
    version: '1.0.0',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: '图片描述' },
        negativePrompt: { type: 'string', description: '负面提示' },
        referenceImage: { type: 'string', description: '参考图片URL' },
      },
      required: ['prompt'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string' },
        width: { type: 'number' },
        height: { type: 'number' },
      },
    },
    configSchema: {
      type: 'object',
      properties: {
        aspectRatio: {
          type: 'string',
          enum: ['1:1', '16:9', '9:16', '4:3', '3:4'],
          default: '1:1',
        },
        quality: {
          type: 'string',
          enum: ['draft', 'standard', 'hd'],
          default: 'standard',
        },
        steps: {
          type: 'number',
          minimum: 1,
          maximum: 50,
          default: 28,
        },
        guidance: {
          type: 'number',
          minimum: 1,
          maximum: 20,
          default: 7.5,
        },
      },
    },
    pricing: {
      credits: 50,
      unit: 'per_call',
    },
  },
  {
    id: 'flux-dev',
    name: 'FLUX Dev',
    category: 'image-model',
    provider: 'black-forest-labs',
    icon: null,
    description: '开发版本，速度快，成本低',
    version: '1.0.0',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: '图片描述' },
        negativePrompt: { type: 'string', description: '负面提示' },
      },
      required: ['prompt'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string' },
        width: { type: 'number' },
        height: { type: 'number' },
      },
    },
    configSchema: {
      type: 'object',
      properties: {
        aspectRatio: {
          type: 'string',
          enum: ['1:1', '16:9', '9:16', '4:3', '3:4'],
          default: '1:1',
        },
        steps: {
          type: 'number',
          minimum: 1,
          maximum: 30,
          default: 20,
        },
      },
    },
    pricing: {
      credits: 25,
      unit: 'per_call',
    },
  },
  {
    id: 'stable-diffusion-xl',
    name: 'Stable Diffusion XL',
    category: 'image-model',
    provider: 'stability-ai',
    icon: null,
    description: '经典的开源图像生成模型',
    version: '1.0.0',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: '图片描述' },
        negativePrompt: { type: 'string', description: '负面提示' },
        seed: { type: 'number', description: '随机种子' },
      },
      required: ['prompt'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string' },
        seed: { type: 'number' },
      },
    },
    configSchema: {
      type: 'object',
      properties: {
        width: {
          type: 'number',
          enum: [512, 768, 1024],
          default: 1024,
        },
        height: {
          type: 'number',
          enum: [512, 768, 1024],
          default: 1024,
        },
        steps: {
          type: 'number',
          minimum: 10,
          maximum: 50,
          default: 30,
        },
        cfgScale: {
          type: 'number',
          minimum: 1,
          maximum: 20,
          default: 7,
        },
      },
    },
    pricing: {
      credits: 20,
      unit: 'per_call',
    },
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    category: 'image-model',
    provider: 'midjourney',
    icon: null,
    description: '艺术风格图像生成，适合创意设计',
    version: '6.0.0',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: '图片描述' },
      },
      required: ['prompt'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string' },
      },
    },
    configSchema: {
      type: 'object',
      properties: {
        version: {
          type: 'string',
          enum: ['v5.2', 'v6', 'niji-6'],
          default: 'v6',
        },
        stylize: {
          type: 'number',
          minimum: 0,
          maximum: 1000,
          default: 100,
        },
        chaos: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          default: 0,
        },
      },
    },
    pricing: {
      credits: 40,
      unit: 'per_call',
    },
  },
  {
    id: 'dall-e-3',
    name: 'DALL·E 3',
    category: 'image-model',
    provider: 'openai',
    icon: null,
    description: 'OpenAI 的最新图像生成模型',
    version: '3.0.0',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: '图片描述' },
      },
      required: ['prompt'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string' },
        revisedPrompt: { type: 'string' },
      },
    },
    configSchema: {
      type: 'object',
      properties: {
        size: {
          type: 'string',
          enum: ['1024x1024', '1024x1792', '1792x1024'],
          default: '1024x1024',
        },
        quality: {
          type: 'string',
          enum: ['standard', 'hd'],
          default: 'standard',
        },
        style: {
          type: 'string',
          enum: ['vivid', 'natural'],
          default: 'vivid',
        },
      },
    },
    pricing: {
      credits: 35,
      unit: 'per_call',
    },
  },
]

// 视频模型目录
export const VIDEO_MODELS_CATALOG: ToolSchema[] = [
  {
    id: 'runway-gen3',
    name: 'Runway Gen-3',
    category: 'video-model',
    provider: 'runway',
    icon: null,
    description: '最新的视频生成模型，质量最高',
    version: '3.0.0',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: '视频描述' },
        referenceImage: { type: 'string', description: '第一帧图片' },
      },
      required: ['prompt'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        videoUrl: { type: 'string' },
        duration: { type: 'number' },
      },
    },
    configSchema: {
      type: 'object',
      properties: {
        duration: {
          type: 'number',
          enum: [5, 10],
          default: 5,
        },
        resolution: {
          type: 'string',
          enum: ['720p', '1080p'],
          default: '720p',
        },
        fps: {
          type: 'number',
          enum: [24, 30],
          default: 24,
        },
      },
    },
    pricing: {
      credits: 100,
      unit: 'per_second',
    },
  },
  {
    id: 'pika-labs',
    name: 'Pika Labs',
    category: 'video-model',
    provider: 'pika',
    icon: null,
    description: '快速视频生成，适合短视频',
    version: '1.0.0',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: '视频描述' },
        image: { type: 'string', description: '起始图片' },
      },
      required: ['prompt'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        videoUrl: { type: 'string' },
      },
    },
    configSchema: {
      type: 'object',
      properties: {
        aspectRatio: {
          type: 'string',
          enum: ['16:9', '9:16', '1:1'],
          default: '16:9',
        },
        motion: {
          type: 'number',
          minimum: 1,
          maximum: 4,
          default: 2,
        },
      },
    },
    pricing: {
      credits: 80,
      unit: 'per_call',
    },
  },
  {
    id: 'stable-video',
    name: 'Stable Video Diffusion',
    category: 'video-model',
    provider: 'stability-ai',
    icon: null,
    description: '开源视频生成模型',
    version: '1.1.0',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: '起始图片' },
        motionBucket: { type: 'number', description: '运动幅度' },
      },
      required: ['image'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        videoUrl: { type: 'string' },
        frames: { type: 'number' },
      },
    },
    configSchema: {
      type: 'object',
      properties: {
        frames: {
          type: 'number',
          minimum: 14,
          maximum: 25,
          default: 14,
        },
        fps: {
          type: 'number',
          enum: [6, 12, 24],
          default: 6,
        },
      },
    },
    pricing: {
      credits: 60,
      unit: 'per_call',
    },
  },
  {
    id: 'luma-dream-machine',
    name: 'Luma Dream Machine',
    category: 'video-model',
    provider: 'luma-ai',
    icon: null,
    description: '电影级视频生成',
    version: '1.0.0',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: '视频描述' },
        keyframes: { type: 'array', items: { type: 'string' }, description: '关键帧' },
      },
      required: ['prompt'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        videoUrl: { type: 'string' },
        duration: { type: 'number' },
      },
    },
    configSchema: {
      type: 'object',
      properties: {
        duration: {
          type: 'number',
          enum: [3, 5, 10],
          default: 5,
        },
        cameraMovement: {
          type: 'string',
          enum: ['static', 'pan', 'zoom', 'orbit'],
          default: 'static',
        },
      },
    },
    pricing: {
      credits: 90,
      unit: 'per_second',
    },
  },
]

// 获取所有节点
export function getAllTools(): ToolSchema[] {
  return [...AI_TOOLS_CATALOG, ...IMAGE_MODELS_CATALOG, ...VIDEO_MODELS_CATALOG]
}

// 按分类获取工具
export function getToolsByCategory(category: ToolSchema['category']): ToolSchema[] {
  return getAllTools().filter(tool => tool.category === category)
}

// 按 ID 获取工具
export function getToolById(id: string): ToolSchema | undefined {
  return getAllTools().find(tool => tool.id === id)
}

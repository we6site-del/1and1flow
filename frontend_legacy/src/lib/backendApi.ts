/**
 * Python 后端 API 客户端
 * 根据 MASTER_PLAN.md 设计，用于处理积分扣费、AI 生成和存储
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
const BACKEND_API_KEY = import.meta.env.VITE_BACKEND_API_KEY || ''

export interface GenerateImageRequest {
  prompt: string
  model: string
  aspectRatio?: string
  quantity?: number
  referenceImages?: string[]
  projectId?: string
}

export interface GenerateImageResponse {
  success: boolean
  generationId?: string
  imageUrls?: string[]
  creditsUsed?: number
  error?: string
}

export interface GenerationStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  resultUrl?: string
  errorMessage?: string
}

class BackendApiClient {
  private baseURL: string
  private apiKey: string

  constructor() {
    this.baseURL = BACKEND_URL
    this.apiKey = BACKEND_API_KEY
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'X-API-Key': this.apiKey }),
      ...options.headers,
    }

    // 添加认证 token（从 Supabase session）
    const supabase = (await import('./supabase')).supabase
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: response.statusText 
      }))
      throw new Error(error.message || `后端 API 错误: ${response.status}`)
    }

    return response.json()
  }

  /**
   * 生成图片
   * POST /api/generate
   * 根据 MASTER_PLAN.md Phase 3 设计
   */
  async generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse> {
    console.log('🎨 调用后端生成图片:', request)

    try {
      const response = await this.request<GenerateImageResponse>('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          type: 'image',
          prompt: request.prompt,
          model: request.model,
          aspectRatio: request.aspectRatio || '1:1',
          quantity: request.quantity || 1,
          referenceImages: request.referenceImages || [],
          projectId: request.projectId,
        }),
      })

      console.log('✓ 后端生成任务已创建:', response)
      return response
    } catch (error) {
      console.error('✗ 后端生成失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      }
    }
  }

  /**
   * 获取生成状态
   * GET /api/generations/:id
   */
  async getGenerationStatus(generationId: string): Promise<GenerationStatus> {
    return this.request<GenerationStatus>(`/api/generations/${generationId}`)
  }

  /**
   * 轮询生成状态直到完成
   */
  async waitForGeneration(
    generationId: string,
    options: {
      pollInterval?: number
      maxAttempts?: number
      onProgress?: (status: GenerationStatus) => void
    } = {}
  ): Promise<GenerationStatus> {
    const { pollInterval = 2000, maxAttempts = 60, onProgress } = options

    let attempts = 0

    while (attempts < maxAttempts) {
      const status = await this.getGenerationStatus(generationId)

      onProgress?.(status)

      if (status.status === 'completed' || status.status === 'failed') {
        return status
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval))
      attempts++
    }

    throw new Error('生成任务超时')
  }

  /**
   * 获取用户积分余额
   * GET /api/user/credits
   */
  async getUserCredits(): Promise<{ credits: number }> {
    return this.request<{ credits: number }>('/api/user/credits')
  }

  /**
   * 获取可用模型列表
   * GET /api/models
   */
  async getModels(): Promise<Array<{
    id: string
    name: string
    cost: number
    isActive: boolean
  }>> {
    return this.request<Array<{
      id: string
      name: string
      cost: number
      isActive: boolean
    }>>('/api/models')
  }
}

// 导出单例
export const backendApi = new BackendApiClient()


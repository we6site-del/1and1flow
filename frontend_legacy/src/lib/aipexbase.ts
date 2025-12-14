/**
 * AipexBase 客户端 SDK
 * 用于 AI 模型调用、任务管理和节点编排
 */

const AIPEXBASE_URL = import.meta.env.VITE_AIPEXBASE_URL || 'http://localhost:8080'
const AIPEXBASE_API_KEY = import.meta.env.VITE_AIPEXBASE_API_KEY || ''

export interface AipexBaseConfig {
  baseURL?: string
  apiKey?: string
}

export interface AIModel {
  id: string
  name: string
  type: 'text' | 'image' | 'video' | 'audio'
  provider: string
  modelId: string
  description?: string
  maxTokens?: number
  costPerToken?: number
}

export interface AITask {
  id: string
  userId: string
  projectId?: string
  modelId: string
  taskType: 'generate' | 'edit' | 'analyze'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  input: any
  output?: any
  creditsUsed: number
  errorMessage?: string
  createdAt: string
  completedAt?: string
}

export interface GenerateRequest {
  modelId: string
  prompt: string
  parameters?: {
    temperature?: number
    maxTokens?: number
    topP?: number
    [key: string]: any
  }
  userId: string
  projectId?: string
}

export interface GenerateResponse {
  taskId: string
  status: 'processing' | 'completed'
  output?: any
  creditsUsed: number
}

class AipexBaseClient {
  private baseURL: string
  private apiKey: string

  constructor(config?: AipexBaseConfig) {
    this.baseURL = config?.baseURL || AIPEXBASE_URL
    this.apiKey = config?.apiKey || AIPEXBASE_API_KEY
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(error.message || `AipexBase API 错误: ${response.status}`)
    }

    return response.json()
  }

  // ============================================
  // AI 模型管理
  // ============================================

  /**
   * 获取可用的 AI 模型列表
   */
  async getModels(type?: AIModel['type']): Promise<AIModel[]> {
    const params = type ? `?type=${type}` : ''
    return this.request<AIModel[]>(`/api/models${params}`)
  }

  /**
   * 获取单个模型详情
   */
  async getModel(modelId: string): Promise<AIModel> {
    return this.request<AIModel>(`/api/models/${modelId}`)
  }

  // ============================================
  // AI 任务执行
  // ============================================

  /**
   * 创建 AI 生成任务
   */
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    console.log('🚀 AipexBase: 创建 AI 生成任务', request)

    const response = await this.request<GenerateResponse>('/api/tasks/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    })

    console.log('✓ AipexBase: 任务创建成功', response)
    return response
  }

  /**
   * 获取任务状态
   */
  async getTaskStatus(taskId: string): Promise<AITask> {
    return this.request<AITask>(`/api/tasks/${taskId}`)
  }

  /**
   * 获取任务结果（轮询直到完成）
   */
  async waitForTask(
    taskId: string,
    options: {
      pollInterval?: number
      maxAttempts?: number
      onProgress?: (task: AITask) => void
    } = {}
  ): Promise<AITask> {
    const { pollInterval = 2000, maxAttempts = 60, onProgress } = options

    let attempts = 0

    while (attempts < maxAttempts) {
      const task = await this.getTaskStatus(taskId)

      onProgress?.(task)

      if (task.status === 'completed' || task.status === 'failed') {
        return task
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval))
      attempts++
    }

    throw new Error('任务超时')
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<void> {
    await this.request(`/api/tasks/${taskId}/cancel`, {
      method: 'POST',
    })
  }

  // ============================================
  // 用户任务历史
  // ============================================

  /**
   * 获取用户的任务历史
   */
  async getUserTasks(
    userId: string,
    options: {
      limit?: number
      offset?: number
      status?: AITask['status']
    } = {}
  ): Promise<AITask[]> {
    const params = new URLSearchParams({
      userId,
      limit: String(options.limit || 50),
      offset: String(options.offset || 0),
      ...(options.status && { status: options.status }),
    })

    return this.request<AITask[]>(`/api/tasks?${params}`)
  }

  // ============================================
  // MCP (Model Context Protocol) 支持
  // ============================================

  /**
   * 创建 MCP 上下文
   */
  async createContext(data: {
    userId: string
    projectId?: string
    context: any
  }): Promise<{ contextId: string }> {
    return this.request('/api/mcp/context', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * 更新上下文
   */
  async updateContext(contextId: string, context: any): Promise<void> {
    await this.request(`/api/mcp/context/${contextId}`, {
      method: 'PUT',
      body: JSON.stringify({ context }),
    })
  }

  /**
   * 获取上下文
   */
  async getContext(contextId: string): Promise<any> {
    const response = await this.request<{ context: any }>(`/api/mcp/context/${contextId}`)
    return response.context
  }

  // ============================================
  // WebSocket 实时通知
  // ============================================

  /**
   * 创建 WebSocket 连接用于实时任务更新
   */
  connectWebSocket(
    userId: string,
    onMessage: (task: AITask) => void,
    onError?: (error: Error) => void
  ): WebSocket {
    const wsUrl = this.baseURL.replace(/^http/, 'ws')
    const ws = new WebSocket(`${wsUrl}/ws/tasks?userId=${userId}`)

    ws.onmessage = (event) => {
      try {
        const task = JSON.parse(event.data)
        onMessage(task)
      } catch (error) {
        console.error('WebSocket 消息解析错误:', error)
      }
    }

    ws.onerror = (event) => {
      const error = new Error('WebSocket 连接错误')
      console.error('WebSocket 错误:', event)
      onError?.(error)
    }

    ws.onclose = () => {
      console.log('WebSocket 连接关闭')
    }

    return ws
  }
}

// 导出单例
export const aipexbase = new AipexBaseClient()

// 也导出类，允许创建多个实例
export { AipexBaseClient }

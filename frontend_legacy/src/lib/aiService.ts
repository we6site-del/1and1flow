import { aipexbase, type GenerateRequest, type AITask } from './aipexbase'
import { createAIGeneration, updateAIGeneration } from './database'
import { useUserStore } from '../stores/userStore'

/**
 * AI 服务层
 * 整合 AipexBase (AI 任务执行) 和 Supabase (用户积分管理)
 */

export interface AIGenerateOptions {
  modelId: string
  modelType: 'text' | 'image' | 'video' | 'audio'
  prompt: string
  projectId?: string
  parameters?: {
    temperature?: number
    maxTokens?: number
    width?: number
    height?: number
    [key: string]: any
  }
}

export interface AIGenerateResult {
  success: boolean
  output?: any
  creditsUsed: number
  error?: string
  taskId?: string
}

/**
 * 计算任务所需积分
 */
function calculateCredits(modelType: string, parameters?: any): number {
  const baseCosts = {
    text: 10,
    image: 50,
    video: 200,
    audio: 30,
  }

  let cost = baseCosts[modelType as keyof typeof baseCosts] || 10

  // 根据参数调整成本
  if (parameters?.maxTokens && parameters.maxTokens > 1000) {
    cost += Math.floor((parameters.maxTokens - 1000) / 1000) * 5
  }

  if (parameters?.width && parameters?.height) {
    const pixels = parameters.width * parameters.height
    if (pixels > 1024 * 1024) {
      cost += 20
    }
  }

  return cost
}

/**
 * 执行 AI 生成任务
 */
export async function generateAI(options: AIGenerateOptions): Promise<AIGenerateResult> {
  const userStore = useUserStore()
  const user = userStore.user

  if (!user?.id) {
    return {
      success: false,
      creditsUsed: 0,
      error: '用户未登录',
    }
  }

  // 计算所需积分
  const creditsRequired = calculateCredits(options.modelType, options.parameters)

  // 检查用户积分
  if (user.credits < creditsRequired) {
    return {
      success: false,
      creditsUsed: 0,
      error: `积分不足，需要 ${creditsRequired} 积分，当前只有 ${user.credits} 积分`,
    }
  }

  // 在数据库中创建生成记录
  const generation = await createAIGeneration(user.id, {
    projectId: options.projectId,
    generationType: options.modelType,
    modelName: options.modelId,
    prompt: options.prompt,
    inputData: options.parameters,
    creditsUsed: creditsRequired,
  })

  if (!generation) {
    return {
      success: false,
      creditsUsed: 0,
      error: '创建生成记录失败',
    }
  }

  try {
    console.log('💫 开始 AI 生成任务:', {
      modelId: options.modelId,
      type: options.modelType,
      prompt: options.prompt.substring(0, 50) + '...',
      creditsRequired,
    })

    // 先扣除积分
    await userStore.deductCredits(creditsRequired)
    console.log(`✓ 已扣除 ${creditsRequired} 积分，剩余: ${user.credits - creditsRequired}`)

    // 调用 AipexBase 执行任务
    const request: GenerateRequest = {
      modelId: options.modelId,
      prompt: options.prompt,
      parameters: options.parameters,
      userId: user.id,
      projectId: options.projectId,
    }

    const response = await aipexbase.generate(request)

    // 如果立即完成
    if (response.status === 'completed' && response.output) {
      // 更新数据库记录为完成
      await updateAIGeneration(generation.id, {
        status: 'completed',
        outputData: response.output,
      })

      console.log('✓ AI 生成任务完成:', response.taskId)

      return {
        success: true,
        output: response.output,
        creditsUsed: creditsRequired,
        taskId: response.taskId,
      }
    }

    // 如果需要异步等待
    console.log('⏳ 任务处理中，等待完成...')

    const task = await aipexbase.waitForTask(response.taskId, {
      pollInterval: 2000,
      maxAttempts: 60,
      onProgress: (task) => {
        console.log(`⏳ 任务进度: ${task.status}`)
      },
    })

    if (task.status === 'completed') {
      // 更新数据库记录
      await updateAIGeneration(generation.id, {
        status: 'completed',
        outputData: task.output,
      })

      console.log('✓ AI 生成任务完成:', task.id)

      return {
        success: true,
        output: task.output,
        creditsUsed: creditsRequired,
        taskId: task.id,
      }
    } else {
      throw new Error(task.errorMessage || '任务失败')
    }
  } catch (error) {
    console.error('✗ AI 生成任务失败:', error)

    // 失败时退还积分
    await userStore.refundCredits(creditsRequired)
    console.log(`✓ 已退还 ${creditsRequired} 积分`)

    // 更新数据库记录为失败
    await updateAIGeneration(generation.id, {
      status: 'failed',
      errorMessage: (error as Error).message,
    })

    return {
      success: false,
      creditsUsed: 0,
      error: (error as Error).message,
    }
  }
}

/**
 * 获取可用的 AI 模型列表
 */
export async function getAvailableModels(type?: 'text' | 'image' | 'video' | 'audio') {
  try {
    const models = await aipexbase.getModels(type)
    return models
  } catch (error) {
    console.error('获取模型列表失败:', error)
    return []
  }
}

/**
 * 实时监听 AI 任务更新
 */
export function subscribeToAITasks(
  userId: string,
  onTaskUpdate: (task: AITask) => void
): () => void {
  const ws = aipexbase.connectWebSocket(
    userId,
    onTaskUpdate,
    (error) => {
      console.error('WebSocket 错误:', error)
    }
  )

  // 返回清理函数
  return () => {
    ws.close()
  }
}

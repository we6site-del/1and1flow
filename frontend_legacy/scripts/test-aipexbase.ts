/**
 * AipexBase 连接测试脚本
 *
 * 使用方法:
 * bun run scripts/test-aipexbase.ts
 */

const AIPEXBASE_URL = process.env.VITE_AIPEXBASE_URL || 'http://localhost:8080'
const AIPEXBASE_API_KEY = process.env.VITE_AIPEXBASE_API_KEY || ''

interface TestResult {
  name: string
  success: boolean
  message: string
  data?: any
}

const results: TestResult[] = []

async function testConnection(): Promise<TestResult> {
  try {
    const response = await fetch(`${AIPEXBASE_URL}/api/health`)

    if (response.ok) {
      return {
        name: '服务连接测试',
        success: true,
        message: `✓ AipexBase 服务正常运行 (${AIPEXBASE_URL})`,
      }
    } else {
      return {
        name: '服务连接测试',
        success: false,
        message: `✗ 服务响应异常: ${response.status} ${response.statusText}`,
      }
    }
  } catch (error) {
    return {
      name: '服务连接测试',
      success: false,
      message: `✗ 无法连接到 AipexBase: ${(error as Error).message}`,
    }
  }
}

async function testModelsAPI(): Promise<TestResult> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (AIPEXBASE_API_KEY) {
      headers['Authorization'] = `Bearer ${AIPEXBASE_API_KEY}`
    }

    const response = await fetch(`${AIPEXBASE_URL}/api/models`, { headers })

    if (response.ok) {
      const models = await response.json()
      return {
        name: '模型 API 测试',
        success: true,
        message: `✓ 获取到 ${models.length} 个 AI 模型`,
        data: models,
      }
    } else if (response.status === 401) {
      return {
        name: '模型 API 测试',
        success: false,
        message: '✗ API Key 无效或未提供',
      }
    } else {
      return {
        name: '模型 API 测试',
        success: false,
        message: `✗ API 错误: ${response.status}`,
      }
    }
  } catch (error) {
    return {
      name: '模型 API 测试',
      success: false,
      message: `✗ 请求失败: ${(error as Error).message}`,
    }
  }
}

async function testTaskCreation(): Promise<TestResult> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (AIPEXBASE_API_KEY) {
      headers['Authorization'] = `Bearer ${AIPEXBASE_API_KEY}`
    }

    const response = await fetch(`${AIPEXBASE_URL}/api/tasks/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        modelId: 'test-model',
        prompt: 'Hello, this is a test',
        userId: 'test-user',
      }),
    })

    if (response.ok) {
      const task = await response.json()
      return {
        name: '任务创建测试',
        success: true,
        message: `✓ 任务创建成功 (ID: ${task.taskId || 'N/A'})`,
        data: task,
      }
    } else if (response.status === 404) {
      return {
        name: '任务创建测试',
        success: false,
        message: '✗ 模型不存在 (这是预期的，需要先配置模型)',
      }
    } else {
      const error = await response.json().catch(() => ({}))
      return {
        name: '任务创建测试',
        success: false,
        message: `✗ 任务创建失败: ${error.message || response.statusText}`,
      }
    }
  } catch (error) {
    return {
      name: '任务创建测试',
      success: false,
      message: `✗ 请求失败: ${(error as Error).message}`,
    }
  }
}

async function runTests() {
  console.log('========================================')
  console.log('  AipexBase 连接测试')
  console.log('========================================')
  console.log('')
  console.log(`目标服务: ${AIPEXBASE_URL}`)
  console.log(`API Key: ${AIPEXBASE_API_KEY ? '已配置' : '未配置'}`)
  console.log('')
  console.log('开始测试...')
  console.log('')

  // 运行所有测试
  results.push(await testConnection())
  results.push(await testModelsAPI())
  results.push(await testTaskCreation())

  // 输出结果
  console.log('========================================')
  console.log('  测试结果')
  console.log('========================================')
  console.log('')

  let successCount = 0
  let failCount = 0

  results.forEach((result, index) => {
    console.log(`[${index + 1}] ${result.name}`)
    console.log(`    ${result.message}`)

    if (result.data) {
      console.log(`    数据预览:`, JSON.stringify(result.data, null, 2).split('\n').slice(0, 5).join('\n    '))
    }

    console.log('')

    if (result.success) {
      successCount++
    } else {
      failCount++
    }
  })

  console.log('========================================')
  console.log(`总计: ${results.length} 个测试`)
  console.log(`✓ 成功: ${successCount}`)
  console.log(`✗ 失败: ${failCount}`)
  console.log('========================================')
  console.log('')

  if (failCount > 0) {
    console.log('❌ 部分测试失败，请检查:')
    console.log('1. AipexBase 服务是否正在运行')
    console.log('2. 环境变量 VITE_AIPEXBASE_URL 是否正确')
    console.log('3. API Key 是否有效（如需要）')
    console.log('4. 是否已配置 AI 模型')
    console.log('')
    process.exit(1)
  } else {
    console.log('✅ 所有测试通过！AipexBase 已正确配置')
    console.log('')
    process.exit(0)
  }
}

// 运行测试
runTests()

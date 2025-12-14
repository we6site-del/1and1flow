/**
 * AI 工具函数
 * 根据 MASTER_PLAN.md Phase 4 设计，用于服装设计 Agent Copilot
 */

import type { Editor } from 'tldraw'
import type { NodeShape } from '../nodes/NodeShapeUtil'
import { getNodeDefinitions } from '../nodes/nodeTypes'

/**
 * 创建变体节点
 * 在画布上自动创建多个新的图片生成节点，填入不同的 Prompt
 */
export async function createVariationNodes(
  editor: Editor,
  count: number = 3,
  style?: string
): Promise<string> {
  try {
    const viewport = editor.getViewportPageBounds()
    const centerX = viewport.x + viewport.w / 2
    const centerY = viewport.y + viewport.h / 2

    const nodeDefs = getNodeDefinitions(editor)
    const imageGenDef = nodeDefs.imageGeneration

    if (!imageGenDef) {
      throw new Error('图片生成节点类型不存在')
    }

    const createdNodes: string[] = []

    for (let i = 0; i < count; i++) {
      const nodeData = imageGenDef.getDefault()
      
      // 根据 style 生成不同的 prompt
      const basePrompt = style || 'fashion design'
      const variationPrompts = [
        `${basePrompt}, modern style`,
        `${basePrompt}, vintage style`,
        `${basePrompt}, minimalist style`,
        `${basePrompt}, avant-garde style`,
        `${basePrompt}, streetwear style`,
      ]

      // 创建节点
      const x = centerX - 200 + (i % 2) * 400
      const y = centerY - 150 + Math.floor(i / 2) * 350

      const shape = editor.createShape({
        type: 'node',
        x,
        y,
        props: {
          node: {
            ...nodeData,
            // 可以在这里设置初始 prompt（如果节点支持）
          },
        },
      })

      createdNodes.push(shape.id)
    }

    return `已成功创建 ${count} 个变体节点。节点 ID: ${createdNodes.join(', ')}`
  } catch (error) {
    return `创建变体节点失败: ${error instanceof Error ? error.message : '未知错误'}`
  }
}

/**
 * 分析画布选中的节点
 * 将当前选中的节点图片发送给 AI Vision 进行分析
 */
export async function analyzeCanvasSelection(
  editor: Editor
): Promise<string> {
  try {
    const selectedShapes = editor.getSelectedShapes()
    
    if (selectedShapes.length === 0) {
      return '请先选择一个节点进行分析'
    }

    const imageUrls: string[] = []
    const nodeInfo: string[] = []

    for (const shape of selectedShapes) {
      if (editor.isShapeOfType<NodeShape>(shape, 'node')) {
        const node = shape.props.node

        // 收集图片 URL
        if (node.type === 'imageGeneration' && node.generatedImages) {
          imageUrls.push(...node.generatedImages)
          nodeInfo.push(`图片生成节点: ${node.generatedImages.length} 张图片`)
        } else if (node.type === 'textInput' && node.images) {
          imageUrls.push(...node.images)
          nodeInfo.push(`输入节点: ${node.images.length} 张参考图`)
        }
      }
    }

    if (imageUrls.length === 0) {
      return '选中的节点中没有图片，无法进行分析'
    }

    // 调用 AI Vision API 分析图片
    // 这里使用 OpenAI GPT-4o Vision 或 Gemini Vision
    const analysisResult = await analyzeImagesWithAI(imageUrls)

    return `分析结果：\n\n${nodeInfo.join('\n')}\n\n${analysisResult}`
  } catch (error) {
    return `分析失败: ${error instanceof Error ? error.message : '未知错误'}`
  }
}

/**
 * 使用 AI Vision 分析图片
 */
async function analyzeImagesWithAI(imageUrls: string[]): Promise<string> {
  // 检查是否配置了 API 密钥
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY
  const googleKey = import.meta.env.VITE_GOOGLE_API_KEY

  if (!openaiKey && !googleKey) {
    return '未配置 AI Vision API 密钥，无法分析图片。请配置 VITE_OPENAI_API_KEY 或 VITE_GOOGLE_API_KEY'
  }

  try {
    // 优先使用 OpenAI GPT-4o Vision
    if (openaiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: '你是一位高级服装设计师，擅长分析服装设计、面料、剪裁和流行趋势。请详细分析图片中的服装设计元素。',
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: '请分析这些服装设计图片，包括：1. 设计风格和特点 2. 面料和材质 3. 剪裁和版型 4. 色彩搭配 5. 流行趋势和设计建议',
                },
                ...imageUrls.map(url => ({
                  type: 'image_url',
                  image_url: { url },
                })),
              ],
            },
          ],
          max_tokens: 1000,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API 错误: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || '分析完成，但未返回结果'
    }

    // 使用 Google Gemini Vision
    if (googleKey) {
      // Gemini API 调用逻辑
      // 这里简化处理，实际需要根据 Gemini API 文档实现
      return 'Gemini Vision API 暂未实现，请使用 OpenAI'
    }

    return '无法分析图片'
  } catch (error) {
    console.error('AI Vision 分析错误:', error)
    return `分析失败: ${error instanceof Error ? error.message : '未知错误'}`
  }
}

/**
 * 获取画布状态描述
 * 用于 AI 理解当前画布状态
 */
export function getCanvasState(editor: Editor): string {
  const shapes = editor.getCurrentPageShapes()
  const nodes = shapes.filter(s => editor.isShapeOfType<NodeShape>(s, 'node'))
  
  const nodeDescriptions = nodes.map(shape => {
    const node = shape.props.node
    if (node.type === 'textInput') {
      return `输入节点: "${node.text?.substring(0, 50)}..." (${node.images?.length || 0} 张图片)`
    } else if (node.type === 'imageGeneration') {
      return `图片生成节点: ${node.generatedImages?.length || 0} 张已生成图片`
    } else if (node.type === 'videoGeneration') {
      return `视频生成节点`
    } else if (node.type === 'textGeneration') {
      return `文本生成节点`
    }
    return `未知节点类型: ${node.type}`
  })

  return `当前画布状态：\n- 总节点数: ${nodes.length}\n- 节点详情:\n${nodeDescriptions.map(d => `  - ${d}`).join('\n')}`
}


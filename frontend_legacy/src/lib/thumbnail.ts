import { Editor } from 'tldraw'
import { uploadFile } from './storage'

/**
 * 缩略图生成工具
 */

/**
 * 从 tldraw 编辑器生成缩略图
 */
export async function generateThumbnailFromEditor(
  editor: Editor,
  options: {
    width?: number
    height?: number
    quality?: number
  } = {}
): Promise<Blob | null> {
  const { width = 400, height = 300, quality = 0.8 } = options

  try {
    // 获取画布的所有形状
    const shapes = editor.getCurrentPageShapes()

    if (shapes.length === 0) {
      console.warn('画布为空，无法生成缩略图')
      return null
    }

    // 计算所有形状的边界框
    const bounds = editor.getCurrentPageBounds()

    if (!bounds) {
      console.warn('无法获取画布边界，无法生成缩略图')
      return null
    }

    // 导出为图片
    const svg = await editor.getSvg([...shapes], {
      scale: 1,
      background: true,
    })

    if (!svg) {
      console.warn('SVG 导出失败')
      return null
    }

    // 将 SVG 转换为 Blob
    const svgString = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' })

    // 创建临时图片元素
    const img = new Image()
    const url = URL.createObjectURL(svgBlob)

    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = url
    })

    // 创建 canvas 并绘制缩略图
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('无法获取 canvas context')
    }

    // 计算缩放比例以适应目标尺寸（保持宽高比）
    const scale = Math.min(width / img.width, height / img.height)
    const scaledWidth = img.width * scale
    const scaledHeight = img.height * scale
    const x = (width - scaledWidth) / 2
    const y = (height - scaledHeight) / 2

    // 填充背景色
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // 绘制图片
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight)

    // 清理
    URL.revokeObjectURL(url)

    // 转换为 Blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob)
        },
        'image/jpeg',
        quality
      )
    })
  } catch (error) {
    console.error('生成缩略图失败:', error)
    return null
  }
}

/**
 * 生成并上传项目缩略图
 */
export async function generateAndUploadThumbnail(
  editor: Editor,
  userId: string,
  projectId: string
): Promise<string | null> {
  try {
    console.log('📸 正在生成项目缩略图...')

    // 生成缩略图 Blob
    const thumbnailBlob = await generateThumbnailFromEditor(editor, {
      width: 400,
      height: 533, // 3:4 ratio
      quality: 0.85,
    })

    if (!thumbnailBlob) {
      console.warn('缩略图生成失败')
      return null
    }

    // 创建 File 对象
    const file = new File(
      [thumbnailBlob],
      `thumbnail-${projectId}.jpg`,
      { type: 'image/jpeg' }
    )

    // 上传到 Storage
    const filePath = `${userId}/thumbnails/${projectId}.jpg`
    const { url, error } = await uploadFile('user-assets', filePath, file)

    if (error || !url) {
      console.error('缩略图上传失败:', error)
      return null
    }

    console.log('✓ 缩略图已生成并上传:', url)
    return url
  } catch (error) {
    console.error('生成并上传缩略图失败:', error)
    return null
  }
}

/**
 * 从 canvas 快照生成缩略图（备用方案）
 */
export async function generateThumbnailFromSnapshot(
  snapshot: any,
  options: {
    width?: number
    height?: number
  } = {}
): Promise<string | null> {
  const { width = 400, height = 533 } = options

  try {
    // 这是一个简化的备用方案
    // 实际使用时需要根据 snapshot 数据创建临时编辑器
    console.warn('使用备用缩略图生成方案')

    // 创建一个空白缩略图
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // 绘制占位符
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = '#999'
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('项目缩略图', width / 2, height / 2)

    return canvas.toDataURL('image/jpeg', 0.85)
  } catch (error) {
    console.error('备用缩略图生成失败:', error)
    return null
  }
}

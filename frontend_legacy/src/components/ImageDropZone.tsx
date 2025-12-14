import { useState, useCallback, DragEvent } from 'react'
import { useEditor } from 'tldraw'
import './ImageDropZone.css'

interface ImageDropZoneProps {
  onImagesAdded?: (count: number) => void
}

export function ImageDropZone({ onImagesAdded }: ImageDropZoneProps) {
  const editor = useEditor()
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))

    if (imageFiles.length === 0) {
      alert('请拖拽图片文件')
      return
    }

    setIsProcessing(true)

    try {
      const viewportCenter = editor.getViewportPageBounds().center
      const spacing = 420 // 图片之间的间距

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i]
        const reader = new FileReader()

        await new Promise<void>((resolve, reject) => {
          reader.onload = async (e) => {
            try {
              const dataUrl = e.target?.result as string
              const img = new Image()

              img.onload = () => {
                // 计算缩放比例（最大宽度400px）
                const maxWidth = 400
                const scale = img.width > maxWidth ? maxWidth / img.width : 1
                const finalWidth = img.width * scale
                const finalHeight = img.height * scale

                // 计算位置（横向排列）
                const x = viewportCenter.x + (i - imageFiles.length / 2) * spacing - finalWidth / 2
                const y = viewportCenter.y - finalHeight / 2

                // 创建图片形状
                editor.createShape({
                  type: 'image',
                  x,
                  y,
                  props: {
                    w: finalWidth,
                    h: finalHeight,
                    assetId: editor.createAssetFromFile(file).then((asset) => asset.id),
                  },
                })

                resolve()
              }

              img.onerror = () => reject(new Error('Failed to load image'))
              img.src = dataUrl
            } catch (error) {
              reject(error)
            }
          }

          reader.onerror = () => reject(new Error('Failed to read file'))
          reader.readAsDataURL(file)
        })
      }

      onImagesAdded?.(imageFiles.length)
    } catch (error) {
      console.error('Error processing images:', error)
      alert('处理图片时出错，请重试')
    } finally {
      setIsProcessing(false)
    }
  }, [editor, onImagesAdded])

  if (isProcessing) {
    return (
      <div className="image-drop-zone processing">
        <div className="spinner"></div>
        <p>处理图片中...</p>
      </div>
    )
  }

  if (!isDragging) {
    return null
  }

  return (
    <div
      className="image-drop-zone active"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="drop-zone-content">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect x="8" y="8" width="48" height="48" rx="8" stroke="currentColor" strokeWidth="3" strokeDasharray="8 8"/>
          <path d="M32 20V44M20 32H44" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <h3>释放以导入图片</h3>
        <p>支持 JPG, PNG, GIF, WebP 等格式</p>
      </div>
    </div>
  )
}

// 全局拖拽监听组件
export function GlobalImageDropZone() {
  const [showDropZone, setShowDropZone] = useState(false)

  useCallback(() => {
    const handleGlobalDragOver = (e: globalThis.DragEvent) => {
      // 检查是否包含文件
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault()
        setShowDropZone(true)
      }
    }

    const handleGlobalDragLeave = (e: globalThis.DragEvent) => {
      // 只在拖拽离开窗口时隐藏
      if (e.clientX === 0 && e.clientY === 0) {
        setShowDropZone(false)
      }
    }

    const handleGlobalDrop = () => {
      setShowDropZone(false)
    }

    window.addEventListener('dragover', handleGlobalDragOver)
    window.addEventListener('dragleave', handleGlobalDragLeave)
    window.addEventListener('drop', handleGlobalDrop)

    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver)
      window.removeEventListener('dragleave', handleGlobalDragLeave)
      window.removeEventListener('drop', handleGlobalDrop)
    }
  }, [])

  return showDropZone ? <ImageDropZone /> : null
}

import React, { useState } from 'react'
import './SidePanel.css'
import { Editor } from 'tldraw'
import {
  AI_TOOLS_CATALOG,
  IMAGE_MODELS_CATALOG,
  VIDEO_MODELS_CATALOG,
  ToolSchema
} from '../lib/nodesCatalog'

type SidebarTool =
  | 'search'
  | 'quick-access'
  | 'tools'
  | 'image-models'
  | 'video-models'
  | 'templates'
  | 'assets'

interface SidePanelProps {
  activeTool: SidebarTool | null
  onClose: () => void
  onAddNode?: (nodeType: string) => void
  editor?: Editor | null
}

export function SidePanel({ activeTool, onClose, onAddNode, editor }: SidePanelProps) {
  if (!activeTool) return null

  const handleAddNode = (nodeType: string) => {
    console.log('SidePanel: Adding node type:', nodeType)
    onAddNode?.(nodeType)
    // Don't close panel for tldraw native tools, they need to stay active
    const tldrawTools = ['select', 'hand', 'draw', 'eraser', 'laser', 'text', 'arrow', 'line', 'rectangle', 'ellipse', 'triangle', 'diamond', 'hexagon', 'star']
    if (!tldrawTools.includes(nodeType)) {
      onClose()
    }
  }

  const handleImportImages = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true

    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files || files.length === 0 || !editor) return

      // Get viewport center
      const viewportBounds = editor.getViewportPageBounds()
      const centerX = viewportBounds.x + viewportBounds.w / 2
      const centerY = viewportBounds.y + viewportBounds.h / 2

      // Process each image
      const imagePromises = Array.from(files).map(async (file, index) => {
        return new Promise<void>((resolve) => {
          const reader = new FileReader()
          reader.onload = async (event) => {
            const dataUrl = event.target?.result as string
            if (!dataUrl) {
              resolve()
              return
            }

            // Create an image element to get dimensions
            const img = new Image()
            img.onload = () => {
              // Calculate size - max 400px width or height
              const maxSize = 400
              let width = img.width
              let height = img.height

              if (width > maxSize || height > maxSize) {
                if (width > height) {
                  height = (height / width) * maxSize
                  width = maxSize
                } else {
                  width = (width / height) * maxSize
                  height = maxSize
                }
              }

              // Create asset with unique ID
              const assetId = `asset:${Date.now()}_${index}` as any
              editor.createAssets([
                {
                  id: assetId,
                  type: 'image',
                  typeName: 'asset',
                  props: {
                    name: file.name,
                    src: dataUrl,
                    w: img.width,
                    h: img.height,
                    mimeType: file.type,
                    isAnimated: false,
                  },
                  meta: {},
                }
              ])

              // Create image shape with offset for multiple images
              const offsetX = (index % 3) * 50
              const offsetY = Math.floor(index / 3) * 50

              editor.createShape({
                type: 'image',
                x: centerX - width / 2 + offsetX,
                y: centerY - height / 2 + offsetY,
                props: {
                  assetId,
                  w: width,
                  h: height,
                },
              })

              resolve()
            }
            img.src = dataUrl
          }
          reader.readAsDataURL(file)
        })
      })

      await Promise.all(imagePromises)
      onClose()
    }

    input.click()
  }

  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <h3 className="side-panel-title">
          {activeTool === 'search' && '搜索'}
          {activeTool === 'quick-access' && '快速访问'}
          {activeTool === 'tools' && '工具'}
          {activeTool === 'image-models' && '图片模型'}
          {activeTool === 'video-models' && '视频模型'}
          {activeTool === 'templates' && '模版'}
          {activeTool === 'assets' && '项目资产'}
        </h3>
        <button className="side-panel-close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="side-panel-content">
        {activeTool === 'search' && (
          <div className="panel-section">
            <input
              type="text"
              className="panel-search-input"
              placeholder="搜索节点、模型、资产..."
              autoFocus
            />
            <div className="panel-search-results">
              <p className="panel-empty-text">输入关键词开始搜索</p>
            </div>
          </div>
        )}

        {activeTool === 'quick-access' && (
          <div className="panel-section">
            <p className="panel-section-desc">常用工具和节点</p>
            <div className="panel-grid">
              <button className="panel-card" onClick={() => handleAddNode('draw')}>
                <div className="panel-card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M4 20L8 16L12 20L18 14L20 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="panel-card-label">画笔</span>
              </button>
              <button className="panel-card" onClick={() => handleAddNode('text')}>
                <div className="panel-card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M7 4H17M12 4V20M8 20H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="panel-card-label">文本</span>
              </button>
              <button className="panel-card" onClick={() => handleAddNode('rectangle')}>
                <div className="panel-card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="7" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                <span className="panel-card-label">矩形</span>
              </button>
              <button className="panel-card" onClick={() => handleAddNode('arrow')}>
                <div className="panel-card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L15 8M19 12L15 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="panel-card-label">箭头</span>
              </button>
              <button className="panel-card" onClick={() => handleAddNode('textInput')}>
                <div className="panel-card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M4 7H20M4 12H14M4 17H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="panel-card-label">文本输入</span>
              </button>
              <button className="panel-card" onClick={() => handleAddNode('imageGeneration')}>
                <div className="panel-card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="8" cy="8" r="2" fill="currentColor"/>
                    <path d="M3 16L7 12L11 16L15 12L21 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="panel-card-label">图片生成</span>
              </button>
            </div>
          </div>
        )}

        {activeTool === 'tools' && (
          <div className="panel-section">
            <p className="panel-section-desc">AI工具和系统绘图工具</p>

            {/* AI 工具 */}
            <div className="panel-category">
              <h4 className="panel-category-title">AI 工具</h4>
              <div className="panel-tools-grid">
                <button className="panel-tool-card" onClick={() => handleAddNode('textInput')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M4 7H20M4 12H14M4 17H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">文本输入</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('fileInput')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M14 3H6C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V9L14 3Z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M14 3V9H20" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">文件输入</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('imageGeneration')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor"/>
                      <path d="M3 16L7 12L11 16L15 12L21 18" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">图片生成</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('videoGeneration')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M16 8.5L21 6V18L16 15.5V8.5Z" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">视频生成</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('textGeneration')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M8 4H16M12 4V20M9 20H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">文本生成</span>
                </button>
              </div>
            </div>

            {/* 导入工具 */}
            <div className="panel-category">
              <h4 className="panel-category-title">导入</h4>
              <div className="panel-tools-grid">
                <button className="panel-tool-card" onClick={handleImportImages}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4V16M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 16V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">导入图片</span>
                </button>
              </div>
            </div>

            {/* 数学工具 (Workflow 自带) */}
            <div className="panel-category">
              <h4 className="panel-category-title">数学运算</h4>
              <div className="panel-tools-grid">
                <button className="panel-tool-card" onClick={() => handleAddNode('add')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">加法</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('subtract')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">减法</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('multiply')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">乘法</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('divide')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="12" cy="7" r="1" fill="currentColor"/>
                      <circle cx="12" cy="17" r="1" fill="currentColor"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">除法</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('slider')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M4 12H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="12" cy="12" r="3" fill="currentColor"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">滑块</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('conditional')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L22 12L12 22L2 12L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">条件</span>
                </button>
              </div>
            </div>

            {/* 绘图工具 */}
            <div className="panel-category">
              <h4 className="panel-category-title">绘图</h4>
              <div className="panel-tools-grid">
                <button className="panel-tool-card" onClick={() => handleAddNode('select')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">选择</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('hand')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M9 11V6C9 5.44772 9.44772 5 10 5C10.5523 5 11 5.44772 11 6V10M11 10V4C11 3.44772 11.4477 3 12 3C12.5523 3 13 3.44772 13 4V10M13 10V5C13 4.44772 13.4477 4 14 4C14.5523 4 15 4.44772 15 5V11M15 11V7C15 6.44772 15.4477 6 16 6C16.5523 6 17 6.44772 17 7V14C17 17.3137 14.3137 20 11 20H10C6.68629 20 4 17.3137 4 14V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">抓手</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('draw')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M4 20L8 16L12 20L18 14L20 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">画笔</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('eraser')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M15 8L9 14M9 8L15 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <rect x="6" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">橡皮擦</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('laser')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M3 12L21 12M12 3L12 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">激光笔</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('text')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M7 5H17M12 5V19M9 19H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">文本</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('select')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4L20 11L11 13.5L8 21L4 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">选择</span>
                </button>
              </div>
            </div>

            {/* 形状工具 */}
            <div className="panel-category">
              <h4 className="panel-category-title">形状</h4>
              <div className="panel-tools-grid">
                <button className="panel-tool-card" onClick={() => handleAddNode('rectangle')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="5" y="7" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">矩形</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('ellipse')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">椭圆</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('triangle')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5L19 19H5L12 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">三角形</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('arrow')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12H19M19 12L15 8M19 12L15 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">箭头</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('star')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L14 9L21 10L16 15L18 22L12 18L6 22L8 15L3 10L10 9L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">星形</span>
                </button>
                <button className="panel-tool-card" onClick={() => handleAddNode('diamond')}>
                  <div className="panel-tool-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4L20 12L12 20L4 12L12 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="panel-tool-name">菱形</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTool === 'image-models' && (
          <div className="panel-section">
            <p className="panel-section-desc">选择图片生成模型，每个模型都有独特的风格和特点</p>
            <div className="panel-models-catalog">
              {IMAGE_MODELS_CATALOG.map(model => (
                <ModelCard
                  key={model.id}
                  model={model}
                  onAddNode={handleAddNode}
                />
              ))}
            </div>
          </div>
        )}

        {activeTool === 'video-models' && (
          <div className="panel-section">
            <p className="panel-section-desc">选择视频生成模型，创建专业级动态内容</p>
            <div className="panel-models-catalog">
              {VIDEO_MODELS_CATALOG.map(model => (
                <ModelCard
                  key={model.id}
                  model={model}
                  onAddNode={handleAddNode}
                />
              ))}
            </div>
          </div>
        )}

        {activeTool === 'templates' && (
          <div className="panel-section">
            <p className="panel-section-desc">从模版开始创建</p>
            <div className="panel-template-grid">
              {[
                { name: '图片生成工作流', desc: '文本转图片的基础流程' },
                { name: '视频制作流程', desc: '图片转视频的完整流程' },
                { name: '批量生成', desc: '批量创建多个变体' },
                { name: '风格迁移', desc: '应用艺术风格到图片' }
              ].map(template => (
                <div key={template.name} className="panel-template-card">
                  <div className="panel-template-preview">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <rect x="8" y="8" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="15" cy="15" r="2" fill="currentColor"/>
                      <path d="M8 26L13 21L18 26L24 20L32 28" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h5 className="panel-template-name">{template.name}</h5>
                  <p className="panel-template-desc">{template.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTool === 'assets' && (
          <div className="panel-section">
            <div className="panel-assets-toolbar">
              <button className="panel-btn-small">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                上传
              </button>
            </div>
            <div className="panel-assets-grid">
              <div className="panel-asset-empty">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M12 16C12 13.7909 13.7909 12 16 12H22L26 16H32C34.2091 16 36 17.7909 36 20V32C36 34.2091 34.2091 36 32 36H16C13.7909 36 12 34.2091 12 32V16Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <p>暂无资产</p>
                <p className="panel-asset-empty-hint">上传图片、视频等资源</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 模型卡片组件 - Weavy.ai 风格
interface ModelCardProps {
  model: ToolSchema
  onAddNode: (nodeType: string) => void
}

function ModelCard({ model, onAddNode }: ModelCardProps) {
  const [showConfig, setShowConfig] = useState(false)

  // 将模型类别映射到实际的节点类型
  const getNodeType = (category: string): string => {
    switch (category) {
      case 'image-model':
        return 'imageGeneration'
      case 'video-model':
        return 'videoGeneration'
      case 'text-model':
        return 'textGeneration'
      case 'ai-tool':
        // AI 工具使用其 ID 作为节点类型
        return model.id
      default:
        return model.id
    }
  }

  return (
    <div className="model-card">
      {/* 模型头部 */}
      <div className="model-card-header">
        <div className="model-card-title-row">
          <h4 className="model-card-name">{model.name}</h4>
          <span className="model-card-provider">{model.provider}</span>
        </div>
        <p className="model-card-description">{model.description}</p>
      </div>

      {/* 定价信息 */}
      {model.pricing && (
        <div className="model-card-pricing">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 4V7L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>
            {model.pricing.credits} 积分
            {model.pricing.unit === 'per_call' && ' / 次'}
            {model.pricing.unit === 'per_token' && ' / 1k tokens'}
            {model.pricing.unit === 'per_second' && ' / 秒'}
          </span>
        </div>
      )}

      {/* 配置预览 */}
      {showConfig && model.configSchema.properties && (
        <div className="model-card-config">
          {Object.entries(model.configSchema.properties).slice(0, 3).map(([key, schema]: [string, any]) => (
            <div key={key} className="model-config-item">
              <span className="model-config-label">{key}</span>
              <span className="model-config-value">
                {schema.default !== undefined ? String(schema.default) : schema.enum?.[0] || '-'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="model-card-actions">
        <button
          className="model-card-btn-config"
          onClick={() => setShowConfig(!showConfig)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M13 8C13 8 13 7 12.5 6.5L11 5L9.5 5.5L8 4L6.5 5.5L5 5L3.5 6.5C3 7 3 8 3 8C3 8 3 9 3.5 9.5L5 11L6.5 10.5L8 12L9.5 10.5L11 11L12.5 9.5C13 9 13 8 13 8Z" stroke="currentColor" strokeWidth="1.3"/>
          </svg>
          {showConfig ? '隐藏配置' : '查看配置'}
        </button>
        <button
          className="model-card-btn-add"
          onClick={() => onAddNode(getNodeType(model.category))}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          添加节点
        </button>
      </div>
    </div>
  )
}

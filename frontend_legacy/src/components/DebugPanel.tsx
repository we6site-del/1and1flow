import { useState, useEffect } from 'react'
import './DebugPanel.css'

interface DebugPanelProps {
  projectId: string | null
  onManualSave?: () => Promise<void>
}

export function DebugPanel({ projectId, onManualSave }: DebugPanelProps) {
  const [lastSaveTime, setLastSaveTime] = useState<string>('未保存')
  const [saveCount, setSaveCount] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)

  // 监听控制台日志来更新保存状态
  useEffect(() => {
    const originalLog = console.log
    console.log = (...args) => {
      originalLog(...args)
      if (args[0]?.includes?.('画布已保存') || args[0]?.includes?.('✓')) {
        setLastSaveTime(new Date().toLocaleTimeString())
        setSaveCount(prev => prev + 1)
      }
    }

    return () => {
      console.log = originalLog
    }
  }, [])

  const handleManualSave = async () => {
    if (onManualSave) {
      await onManualSave()
    } else {
      // 直接调用 window.editor
      const editor = (window as any).editor
      if (editor && projectId) {
        const snapshot = editor.getSnapshot()
        console.log('📊 画布快照:', {
          shapes: Object.keys(snapshot.store).filter(k => k.startsWith('shape:')).length,
          assets: Object.keys(snapshot.store).filter(k => k.startsWith('asset:')).length,
          pages: Object.keys(snapshot.store).filter(k => k.startsWith('page:')).length,
        })
      }
    }
  }

  if (isMinimized) {
    return (
      <div className="debug-panel minimized" onClick={() => setIsMinimized(false)}>
        <span>🐛 调试 ({saveCount})</span>
      </div>
    )
  }

  return (
    <div className="debug-panel">
      <div className="debug-panel-header">
        <h4>🐛 调试面板</h4>
        <button onClick={() => setIsMinimized(true)}>−</button>
      </div>

      <div className="debug-panel-content">
        <div className="debug-item">
          <span className="debug-label">项目 ID:</span>
          <span className="debug-value">{projectId || '无'}</span>
        </div>

        <div className="debug-item">
          <span className="debug-label">最后保存:</span>
          <span className="debug-value">{lastSaveTime}</span>
        </div>

        <div className="debug-item">
          <span className="debug-label">保存次数:</span>
          <span className="debug-value">{saveCount}</span>
        </div>

        <button className="debug-button" onClick={handleManualSave}>
          手动保存测试
        </button>

        <button
          className="debug-button"
          onClick={() => {
            const editor = (window as any).editor
            if (editor) {
              const shapes = editor.getCurrentPageShapes()
              console.log('📐 当前画布形状:', shapes.length)
              shapes.forEach((s: any, i: number) => {
                console.log(`  ${i + 1}. ${s.type} (${s.id})`)
              })
            }
          }}
        >
          查看画布内容
        </button>
      </div>
    </div>
  )
}

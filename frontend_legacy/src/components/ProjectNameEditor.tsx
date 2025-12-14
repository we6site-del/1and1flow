import React, { useState, useRef, useEffect } from 'react'

interface ProjectNameEditorProps {
  initialName?: string
  onNameChange?: (name: string) => void
}

export function ProjectNameEditor({ initialName = '未命名项目', onNameChange }: ProjectNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [projectName, setProjectName] = useState(initialName)
  const [tempName, setTempName] = useState(initialName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleStartEdit = () => {
    setTempName(projectName)
    setIsEditing(true)
  }

  const handleSave = () => {
    const finalName = tempName.trim() || '未命名项目'
    setProjectName(finalName)
    setIsEditing(false)
    onNameChange?.(finalName)
  }

  const handleCancel = () => {
    setTempName(projectName)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '80px', // 60px sidebar + 20px margin
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'auto',
      }}
    >
      {isEditing ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            placeholder="输入项目名称"
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              fontWeight: 600,
              color: '#111',
              background: 'transparent',
              width: '200px',
              pointerEvents: 'auto',
            }}
          />
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={handleSave}
              onMouseDown={(e) => e.preventDefault()} // Prevent blur
              style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
              title="保存"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={handleCancel}
              onMouseDown={(e) => e.preventDefault()} // Prevent blur
              style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.05)',
                border: 'none',
                borderRadius: '4px',
                color: '#666',
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
              title="取消"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 3L9 9M3 9L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleStartEdit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'white',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            fontSize: '14px',
            fontWeight: 600,
            color: '#111',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            pointerEvents: 'auto',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)'
            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.15)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white'
            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M5 5H11M5 8H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <span>{projectName}</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.4 }}>
            <path d="M9 2L11 4L5 10H3V8L9 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  )
}

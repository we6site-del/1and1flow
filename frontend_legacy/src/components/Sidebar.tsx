import React, { useState } from 'react'
import './Sidebar.css'
import { useUserStore } from '../stores/userStore'

type SidebarTool =
  | 'search'
  | 'quick-access'
  | 'tools'
  | 'image-models'
  | 'video-models'
  | 'templates'
  | 'assets'

interface SidebarProps {
  onToolChange?: (tool: SidebarTool | null) => void
  onBackToDashboard?: (() => void) | null
  onLoginClick?: () => void
  isAuthenticated?: boolean
}

export function Sidebar({ onToolChange, onBackToDashboard, onLoginClick, isAuthenticated }: SidebarProps) {
  const [activeTool, setActiveTool] = useState<SidebarTool | null>(null)
  const [showUserTooltip, setShowUserTooltip] = useState(false)
  const { user } = useUserStore()

  const handleToolClick = (tool: SidebarTool) => {
    const newTool = activeTool === tool ? null : tool
    setActiveTool(newTool)
    onToolChange?.(newTool)
  }

  // 获取用户显示名称
  const getUserDisplayName = () => {
    if (!user) return ''
    return user.full_name || user.email || '用户'
  }

  // 获取用户头像字母
  const getUserInitial = () => {
    if (!user) return 'U'
    if (user.full_name) {
      return user.full_name.charAt(0).toUpperCase()
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  return (
    <div className="sidebar">
      {/* 顶部用户头像和返回按钮 */}
      <div className="sidebar-header">
        {!isAuthenticated && onLoginClick ? (
          <button
            className="sidebar-item"
            onClick={onLoginClick}
            title="登录/注册"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 17C4 14 6.5 11.5 10 11.5C13.5 11.5 16 14 16 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        ) : isAuthenticated ? (
          <div
            className="sidebar-user-avatar"
            onMouseEnter={() => setShowUserTooltip(true)}
            onMouseLeave={() => setShowUserTooltip(false)}
          >
            <div className="user-avatar-circle">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={getUserDisplayName()} />
              ) : (
                <span className="user-initial">{getUserInitial()}</span>
              )}
            </div>

            {showUserTooltip && (
              <div className="user-tooltip">
                <div className="tooltip-content">
                  <p className="tooltip-greeting">Hi {getUserDisplayName()}</p>
                  <p className="tooltip-email">{user?.email}</p>
                  <div className="tooltip-credits">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M7 4V7L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>{user?.credits || 0} 积分</span>
                  </div>
                </div>
                <div className="tooltip-arrow"></div>
              </div>
            )}
          </div>
        ) : null}

        {onBackToDashboard && (
          <button
            className="sidebar-item back-button"
            onClick={onBackToDashboard}
            title="返回首页"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M8 14L4 10L8 6M4 10H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* 中间工具按钮 */}
      <div className="sidebar-tools">
        {/* 搜索 */}
        <button
          className={`sidebar-item ${activeTool === 'search' ? 'active' : ''}`}
          onClick={() => handleToolClick('search')}
          title="搜索"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M13 13L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* 快速访问 */}
        <button
          className={`sidebar-item ${activeTool === 'quick-access' ? 'active' : ''}`}
          onClick={() => handleToolClick('quick-access')}
          title="快速访问"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4L12 8L16 9L13 12L14 16L10 14L6 16L7 12L4 9L8 8L10 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
          </svg>
        </button>

        {/* 工具面板 */}
        <button
          className={`sidebar-item ${activeTool === 'tools' ? 'active' : ''}`}
          onClick={() => handleToolClick('tools')}
          title="工具面板"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="4" y="4" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="11" y="4" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="4" y="11" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="11" y="11" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>

        {/* 图片模型 */}
        <button
          className={`sidebar-item ${activeTool === 'image-models' ? 'active' : ''}`}
          onClick={() => handleToolClick('image-models')}
          title="图片模型"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M3 13L7 9L10 12L13 9L17 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="13" cy="7" r="1.5" fill="currentColor"/>
          </svg>
        </button>

        {/* 视频模型 */}
        <button
          className={`sidebar-item ${activeTool === 'video-models' ? 'active' : ''}`}
          onClick={() => handleToolClick('video-models')}
          title="视频模型"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="5" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M13 8L17 6V14L13 12V8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* 模板 */}
        <button
          className={`sidebar-item ${activeTool === 'templates' ? 'active' : ''}`}
          onClick={() => handleToolClick('templates')}
          title="模板"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="11" y="3" width="6" height="3" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="11" y="8" width="6" height="3" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="11" y="13" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>

        {/* 项目资产 */}
        <button
          className={`sidebar-item ${activeTool === 'assets' ? 'active' : ''}`}
          onClick={() => handleToolClick('assets')}
          title="项目资产"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 6C4 4.89543 4.89543 4 6 4H9L11 6H14C15.1046 6 16 6.89543 16 8V14C16 15.1046 15.1046 16 14 16H6C4.89543 16 4 15.1046 4 14V6Z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
      </div>

      {/* 底部预留区域 */}
      <div className="sidebar-footer">
      </div>
    </div>
  )
}

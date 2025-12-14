import { useState, useRef, useEffect } from 'react'
import { useUserStore } from '../stores/userStore'
import './UserDropdown.css'

export function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useUserStore()

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLogout = async () => {
    await logout()
    setIsOpen(false)
    // 刷新页面返回登录页
    window.location.href = '/'
  }

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      <button
        className="dashboard-user"
        onClick={() => setIsOpen(!isOpen)}>
        <div className="dashboard-user-avatar">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="User avatar" />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" fill="currentColor"/>
              <path d="M4 20C4 16 7 13 12 13C17 13 20 16 20 20" fill="currentColor"/>
            </svg>
          )}
        </div>
        <div className="dashboard-user-info">
          <span className="dashboard-user-name">
            {user?.full_name || user?.email?.split('@')[0] || '访客'}
          </span>
          <span className="dashboard-user-credits">
            {user?.credits || 0} 积分
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`dashboard-user-dropdown ${isOpen ? 'open' : ''}`}
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <div className="user-dropdown-menu">
          <div className="user-dropdown-header">
            <div className="user-dropdown-email">{user?.email}</div>
            <div className="user-dropdown-tier">
              {user?.subscription_tier === 'free' && '免费版'}
              {user?.subscription_tier === 'starter' && '入门版'}
              {user?.subscription_tier === 'basic' && '基础版'}
              {user?.subscription_tier === 'pro' && '专业版'}
              {user?.subscription_tier === 'ultimate' && '旗舰版'}
            </div>
          </div>

          <div className="user-dropdown-divider" />

          <div className="user-dropdown-credits">
            <div className="credits-label">积分余额</div>
            <div className="credits-value">{user?.credits || 0}</div>
            <button className="credits-buy-button">充值积分</button>
          </div>

          <div className="user-dropdown-divider" />

          <div className="user-dropdown-actions">
            <button className="dropdown-action-item">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 15C3 12 5.5 9.5 9 9.5C12.5 9.5 15 12 15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              个人资料
            </button>

            <button className="dropdown-action-item">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="3" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9 6V9M9 12H9.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              订阅管理
            </button>

            <button className="dropdown-action-item">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9 6V9L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              使用历史
            </button>

            <button className="dropdown-action-item">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9 3V5M9 13V15M3 9H5M13 9H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              设置
            </button>
          </div>

          <div className="user-dropdown-divider" />

          <button className="dropdown-action-item logout" onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 3H4C3.44772 3 3 3.44772 3 4V14C3 14.5523 3.44772 15 4 15H7M11 6L14 9M14 9L11 12M14 9H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            退出登录
          </button>
        </div>
      )}
    </div>
  )
}

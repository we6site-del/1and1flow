import React, { useState, useEffect, useRef } from 'react'
import './Dashboard.css'
import { useUserStore } from '../stores/userStore'
import { getUserProjects, deleteProject, updateProject, type Project } from '../lib/database'

interface DashboardProps {
  onCreateProject: () => void
  onOpenProject: (projectId: string) => void
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  project: Project | null
}

export function Dashboard({ onCreateProject, onOpenProject }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { user, logout } = useUserStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    project: null
  })
  const [renaming, setRenaming] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // 加载用户项目
  useEffect(() => {
    const loadProjects = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const userProjects = await getUserProjects(user.id)
        if (userProjects) {
          setProjects(userProjects)
        }
      } catch (error) {
        console.error('Failed to load projects:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [user?.id])

  // 关闭右键菜单
  useEffect(() => {
    const handleClick = () => setContextMenu({ visible: false, x: 0, y: 0, project: null })
    const handleScroll = () => setContextMenu({ visible: false, x: 0, y: 0, project: null })

    if (contextMenu.visible) {
      document.addEventListener('click', handleClick)
      document.addEventListener('scroll', handleScroll, true)
    }

    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [contextMenu.visible])

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent, project: Project) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      project
    })
  }

  // 删除项目
  const handleDelete = async (projectId: string) => {
    if (!confirm('确定要删除此项目吗？此操作无法撤销。')) return

    try {
      const success = await deleteProject(projectId)
      if (success) {
        setProjects(projects.filter(p => p.id !== projectId))
        console.log('✓ 项目已删除')
      }
    } catch (error) {
      console.error('删除项目失败:', error)
      alert('删除失败，请重试')
    }
    setContextMenu({ visible: false, x: 0, y: 0, project: null })
  }

  // 复制项目
  const handleDuplicate = async (project: Project) => {
    try {
      // 这里应该调用复制项目的API
      console.log('复制项目:', project.name)
      // TODO: 实现复制逻辑
      alert('复制功能即将推出')
    } catch (error) {
      console.error('复制项目失败:', error)
    }
    setContextMenu({ visible: false, x: 0, y: 0, project: null })
  }

  // 开始重命名
  const handleStartRename = (project: Project) => {
    setRenaming(project.id)
    setNewName(project.name)
    setContextMenu({ visible: false, x: 0, y: 0, project: null })
  }

  // 保存重命名
  const handleSaveRename = async (projectId: string) => {
    if (!newName.trim()) {
      setRenaming(null)
      return
    }

    try {
      const success = await updateProject(projectId, { name: newName.trim() })
      if (success) {
        setProjects(projects.map(p =>
          p.id === projectId ? { ...p, name: newName.trim() } : p
        ))
        console.log('✓ 项目已重命名')
      }
    } catch (error) {
      console.error('重命名失败:', error)
    }
    setRenaming(null)
  }

  // 在新标签页打开
  const handleOpenInNewTab = (projectId: string) => {
    window.open(`/?project=${projectId}`, '_blank')
    setContextMenu({ visible: false, x: 0, y: 0, project: null })
  }

  // 工作流模板
  const templates = [
    {
      id: 't1',
      name: 'Weavy Welcome',
      thumbnail: 'https://picsum.photos/300/200?random=1',
    },
    {
      id: 't2',
      name: 'Multiple Image Models V2',
      thumbnail: 'https://picsum.photos/300/200?random=2',
    },
    {
      id: 't3',
      name: 'Editing Images',
      thumbnail: 'https://picsum.photos/300/200?random=3',
    },
    {
      id: 't4',
      name: 'Compositor Node',
      thumbnail: 'https://picsum.photos/300/200?random=4',
    },
    {
      id: 't5',
      name: 'Image to Video',
      thumbnail: 'https://picsum.photos/300/200?random=5',
    },
    {
      id: 't6',
      name: 'Camera Angle Ideation',
      thumbnail: 'https://picsum.photos/300/200?random=6',
    },
  ]

  const formatUpdateTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return '刚刚编辑'
    if (diffHours < 24) return `${diffHours} 小时前编辑`
    if (diffDays === 1) return '1 天前编辑'
    if (diffDays < 7) return `${diffDays} 天前编辑`
    return date.toLocaleDateString('zh-CN')
  }

  const getUserInitial = () => {
    if (user?.full_name) return user.full_name.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return 'U'
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  return (
    <div className="new-dashboard">
      {/* 左侧边栏 */}
      <aside className="dashboard-sidebar-new">
        {/* 用户信息 */}
        <div className="sidebar-user-section">
          <button className="sidebar-user-button" onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="sidebar-user-avatar">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="User" />
              ) : (
                <span>{getUserInitial()}</span>
              )}
            </div>
            <span className="sidebar-user-name">
              {user?.full_name || user?.email?.split('@')[0] || '用户'}
            </span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={showUserMenu ? 'rotate' : ''}>
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {showUserMenu && (
            <div className="sidebar-user-menu">
              <div className="user-menu-item">
                <span>积分: {user?.credits || 0}</span>
              </div>
              <div className="user-menu-item" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 2H3C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H6M10 5L13 8M13 8L10 11M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                退出登录
              </div>
            </div>
          )}
        </div>

        {/* 创建新文件按钮 */}
        <button className="sidebar-create-btn" onClick={onCreateProject}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          创建新项目
        </button>

        {/* 导航菜单 */}
        <nav className="sidebar-nav-new">
          <button className="sidebar-nav-item active">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 7L3 17L9 17L9 12L11 12L11 17L17 17L17 7L10 3L3 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <span>我的文件</span>
            <span className="nav-item-action" onClick={(e) => { e.stopPropagation(); onCreateProject(); }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </span>
          </button>

          <button className="sidebar-nav-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M15 14C15 11.5 12.5 10 9 10C5.5 10 3 11.5 3 14V17H15V14Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span>与我共享</span>
          </button>

          <button className="sidebar-nav-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span>应用</span>
          </button>
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className="dashboard-main-new">
        {/* 顶部栏 */}
        <div className="dashboard-header">
          <h1>{user?.full_name || user?.email?.split('@')[0] || '用户'} 的工作区</h1>
          <button className="header-create-btn" onClick={onCreateProject}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            创建新项目
          </button>
        </div>

        {/* 工作流库 */}
        <div className="workflow-library-section">
          <div className="section-tabs">
            <button className="tab-button active">工作流库</button>
            <button className="tab-button">教程</button>
          </div>

          <div className="templates-scroll">
            <div className="templates-horizontal">
              {templates.map((template) => (
                <div key={template.id} className="template-card-new" onClick={onCreateProject}>
                  <div className="template-thumbnail">
                    <img src={template.thumbnail} alt={template.name} />
                  </div>
                  <div className="template-title">{template.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 我的文件 */}
        <div className="my-files-section">
          <div className="my-files-header">
            <h2>我的文件</h2>
            <div className="files-header-actions">
              <div className="search-input-wrapper">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  placeholder="搜索"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="view-toggle">
                <button
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => setViewMode('list')}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="3" y="5" width="14" height="2" rx="1" fill="currentColor"/>
                    <rect x="3" y="9" width="14" height="2" rx="1" fill="currentColor"/>
                    <rect x="3" y="13" width="14" height="2" rx="1" fill="currentColor"/>
                  </svg>
                </button>
                <button
                  className={viewMode === 'grid' ? 'active' : ''}
                  onClick={() => setViewMode('grid')}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* 项目显示区域 */}
          {loading ? (
            <div className="loading-message">加载中...</div>
          ) : projects.length === 0 ? (
            <div className="empty-state-new">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <rect x="16" y="16" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M32 26V38M26 32H38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>开始你的第一个项目</h3>
              <button className="empty-create-btn" onClick={onCreateProject}>
                创建新项目
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* 网格视图 */
            <div className="files-grid-new">
              {/* 创建新项目卡片 */}
              <div className="project-card-new create-new" onClick={onCreateProject}>
                <div className="project-thumbnail-new">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path d="M24 12V36M12 24H36" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              {/* 项目卡片 */}
              {projects.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((project) => (
                <div
                  key={project.id}
                  className="project-card-new"
                  onClick={() => onOpenProject(project.id)}
                  onContextMenu={(e) => handleContextMenu(e, project)}
                >
                  <div className="project-thumbnail-new">
                    {project.thumbnail_url ? (
                      <img src={project.thumbnail_url} alt={project.name} />
                    ) : (
                      <div className="default-thumbnail">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                          <rect x="8" y="8" width="24" height="24" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M14 20L18 16L22 20L28 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="project-info-new">
                    {renaming === project.id ? (
                      <input
                        type="text"
                        className="rename-input"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={() => handleSaveRename(project.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(project.id)
                          if (e.key === 'Escape') setRenaming(null)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <div className="project-name-new">{project.name}</div>
                    )}
                    <div className="project-time-new">
                      最后编辑 {formatUpdateTime(project.updated_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* 列表视图 */
            <div className="files-list-view">
              <div className="list-header">
                <div className="list-column list-col-name">名称</div>
                <div className="list-column list-col-files">文件</div>
                <div className="list-column list-col-modified">最后修改</div>
                <div className="list-column list-col-created">创建时间</div>
              </div>
              {projects.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((project) => (
                <div
                  key={project.id}
                  className="list-row"
                  onClick={() => onOpenProject(project.id)}
                  onContextMenu={(e) => handleContextMenu(e, project)}
                >
                  <div className="list-column list-col-name">
                    <div className="list-thumbnail">
                      {project.thumbnail_url ? (
                        <img src={project.thumbnail_url} alt={project.name} />
                      ) : (
                        <div className="default-thumbnail-small">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M8 12L10 10L12 12L16 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    {renaming === project.id ? (
                      <input
                        type="text"
                        className="rename-input-list"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={() => handleSaveRename(project.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(project.id)
                          if (e.key === 'Escape') setRenaming(null)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <span className="list-project-name">{project.name}</span>
                    )}
                  </div>
                  <div className="list-column list-col-files">-</div>
                  <div className="list-column list-col-modified">
                    {formatUpdateTime(project.updated_at)}
                  </div>
                  <div className="list-column list-col-created">
                    {new Date(project.created_at).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 右键菜单 */}
          {contextMenu.visible && contextMenu.project && (
            <div
              ref={contextMenuRef}
              className="context-menu"
              style={{
                position: 'fixed',
                top: contextMenu.y,
                left: contextMenu.x,
                zIndex: 10000
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="context-menu-item" onClick={() => {
                if (contextMenu.project) onOpenProject(contextMenu.project.id)
                setContextMenu({ visible: false, x: 0, y: 0, project: null })
              }}>
                打开
              </div>
              <div className="context-menu-item" onClick={() => {
                if (contextMenu.project) handleOpenInNewTab(contextMenu.project.id)
              }}>
                在新标签页打开
              </div>
              <div className="context-menu-divider"></div>
              <div className="context-menu-item" onClick={() => {
                if (contextMenu.project) handleDuplicate(contextMenu.project)
              }}>
                复制
              </div>
              <div className="context-menu-item" onClick={() => {
                if (contextMenu.project) handleStartRename(contextMenu.project)
              }}>
                重命名
              </div>
              <div className="context-menu-divider"></div>
              <div className="context-menu-item context-menu-item-danger" onClick={() => {
                if (contextMenu.project) handleDelete(contextMenu.project.id)
              }}>
                删除
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

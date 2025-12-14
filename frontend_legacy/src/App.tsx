import {
	DefaultActionsMenu,
	DefaultQuickActions,
	DefaultStylePanel,
	TLComponents,
	Tldraw,
	TldrawOptions,
	TldrawUiToolbar,
	useEditor,
	useValue,
} from 'tldraw'
import { OnCanvasComponentPicker } from './components/OnCanvasComponentPicker.tsx'
import { WorkflowRegions } from './components/WorkflowRegions.tsx'
import { overrides, WorkflowToolbar } from './components/WorkflowToolbar.tsx'
import { TopToolbar } from './components/TopToolbar.tsx'
import { AIChatPanel } from './components/AIChatPanel.tsx'
import { AuthModal } from './components/AuthModal.tsx'
import { Sidebar } from './components/Sidebar.tsx'
import { SidePanel } from './components/SidePanel.tsx'
import { Dashboard } from './components/Dashboard.tsx'
import { BackToDashboardButton } from './components/BackToDashboardButton.tsx'
import { ProjectNameEditor } from './components/ProjectNameEditor.tsx'
import { LandingPage } from './components/LandingPage.tsx'
import { useState, useEffect } from 'react'
import { useUserStore } from './stores/userStore'
import { ConnectionBindingUtil } from './connection/ConnectionBindingUtil'
import { ConnectionShapeUtil } from './connection/ConnectionShapeUtil'
import { keepConnectionsAtBottom } from './connection/keepConnectionsAtBottom'
import { disableTransparency } from './disableTransparency.tsx'
import { NodeShapeUtil } from './nodes/NodeShapeUtil'
import { PointingPort } from './ports/PointingPort'
import { getNodeDefinitions } from './nodes/nodeTypes'
import { createProject, getProject, updateProject, saveProjectCanvas, updateProjectLastOpened } from './lib/database'
import { setupAssetUploader } from './lib/assetUploader'
import { initializeStorage } from './lib/storage'
import { generateAndUploadThumbnail } from './lib/thumbnail'

type SidebarTool =
  | 'search'
  | 'quick-access'
  | 'tools'
  | 'image-models'
  | 'video-models'
  | 'templates'
  | 'assets'

// 全局变量来存储回调函数
let globalBackToDashboard: (() => void) | null = null
let globalProjectName: string = '未命名项目'
let globalProjectNameChange: ((name: string) => void) | null = null


// Define custom shape utilities that extend tldraw's shape system
const shapeUtils = [NodeShapeUtil, ConnectionShapeUtil]
// Define binding utilities that handle relationships between shapes
const bindingUtils = [ConnectionBindingUtil]

// Customize tldraw's UI components to add workflow-specific functionality
const components: TLComponents = {
	InFrontOfTheCanvas: () => {
		const [showAuth, setShowAuth] = useState(false)
		const [activeTool, setActiveTool] = useState<SidebarTool | null>(null)
		const { isAuthenticated } = useUserStore()
		const editor = useEditor()

		const handleAddNode = (nodeType: string) => {
			console.log('App: handleAddNode called with:', nodeType)

			// Check if it's a tldraw native tool
			const tldrawTools = [
				'select', 'hand', 'draw', 'eraser', 'laser',
				'rectangle', 'ellipse', 'triangle', 'diamond', 'hexagon', 'star',
				'text', 'arrow', 'line'
			]

			if (tldrawTools.includes(nodeType)) {
				console.log('Activating tldraw tool:', nodeType)

				// Activate tldraw's native tool
				if (nodeType === 'select') {
					editor.setCurrentTool('select')
				} else if (nodeType === 'hand') {
					editor.setCurrentTool('hand')
				} else if (nodeType === 'draw') {
					editor.setCurrentTool('draw')
				} else if (nodeType === 'eraser') {
					editor.setCurrentTool('eraser')
				} else if (nodeType === 'laser') {
					editor.setCurrentTool('laser')
				} else if (nodeType === 'text') {
					editor.setCurrentTool('text')
				} else if (nodeType === 'arrow') {
					editor.setCurrentTool('arrow')
				} else if (nodeType === 'line') {
					editor.setCurrentTool('line')
				} else if (nodeType === 'rectangle' || nodeType === 'ellipse' || nodeType === 'triangle' || nodeType === 'diamond' || nodeType === 'hexagon' || nodeType === 'star') {
					// For geo shapes, we need to set the tool to 'geo' first
					editor.setCurrentTool('geo')
					// Then set the geo type
					setTimeout(() => {
						const geoTypes: Record<string, any> = {
							'rectangle': 'rectangle',
							'ellipse': 'ellipse',
							'triangle': 'triangle',
							'diamond': 'diamond',
							'hexagon': 'hexagon',
							'star': 'star'
						}
						editor.updateInstanceState({
							stylesForNextShape: {
								...editor.getInstanceState().stylesForNextShape,
								geo: geoTypes[nodeType]
							}
						})
					}, 0)
				}

				// Don't close panel for tools, they need to stay active
				// setActiveTool(null)
			} else {
				// It's a custom workflow node - create it at viewport center
				console.log('Creating custom node:', nodeType)
				const nodeDefs = getNodeDefinitions(editor)
				const viewport = editor.getViewportPageBounds()
				const centerX = viewport.x + viewport.w / 2
				const centerY = viewport.y + viewport.h / 2

				// Get the correct node definition
				let nodeData: any
				if (nodeDefs[nodeType as keyof typeof nodeDefs]) {
					nodeData = nodeDefs[nodeType as keyof typeof nodeDefs].getDefault()
					console.log('Node definition found:', nodeType, nodeData)
				} else {
					console.error(`Unknown node type: ${nodeType}`)
					console.log('Available node types:', Object.keys(nodeDefs))
					setActiveTool(null)
					return
				}

				// Create node at center
				const newShape = editor.createShape({
					type: 'node',
					x: centerX - 150, // Offset to center the node
					y: centerY - 100,
					props: {
						node: nodeData
					}
				})
				console.log('Node created:', newShape)

				// Close the panel after adding custom node
				setActiveTool(null)
			}
		}

		return (
			<>
				<ProjectNameEditor
					initialName={globalProjectName}
					onNameChange={globalProjectNameChange || (() => {})}
				/>
				<Sidebar
					onToolChange={setActiveTool}
					onBackToDashboard={globalBackToDashboard}
					onLoginClick={() => setShowAuth(true)}
					isAuthenticated={isAuthenticated}
				/>
				<SidePanel
					activeTool={activeTool}
					onClose={() => setActiveTool(null)}
					onAddNode={handleAddNode}
					editor={editor}
				/>
				<TopToolbar />
				<OnCanvasComponentPicker />
				<WorkflowRegions />
				<AIChatPanel />
				<AuthModal
					isOpen={showAuth}
					onClose={() => setShowAuth(false)}
					onAuthSuccess={() => {
						setShowAuth(false)
						// Refresh user state after successful authentication
					}}
				/>
			</>
		)
	},
	Toolbar: () => null, // 使用新的 Sidebar 替代原有的 Toolbar

	MenuPanel: () => null,
	StylePanel: () => null, // 移除默认位置的StylePanel
	TopPanel: () => {
		const editor = useEditor()
		const shouldShowStylePanel = useValue(
			'shouldShowStylePanel',
			() => {
				return (
					!editor.isIn('select') ||
					editor.getSelectedShapes().some((s) => s.type !== 'node' && s.type !== 'connection')
				)
			},
			[editor]
		)
		if (!shouldShowStylePanel) return null
		return (
			<div style={{
				position: 'absolute',
				top: '10px',
				left: '50%',
				transform: 'translateX(-50%)',
				zIndex: 1000,
			}}>
				<DefaultStylePanel />
			</div>
		)
	},
}

const options: Partial<TldrawOptions> = {
	actionShortcutsLocation: 'menu',
	maxPages: 1,
}

function App() {
	const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'canvas'>('landing')
	const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
	const [currentProjectName, setCurrentProjectName] = useState<string>('未命名项目')
	const [currentProject, setCurrentProject] = useState<any>(null)
	const [showAuthModal, setShowAuthModal] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const { user, isAuthenticated, initialize } = useUserStore()

	// 初始化用户状态和 Storage
	useEffect(() => {
		initialize()
		initializeStorage()
	}, [])

	// 如果用户已登录且在landing页面，自动跳转到dashboard
	useEffect(() => {
		if (isAuthenticated && currentView === 'landing') {
			setCurrentView('dashboard')
		}
	}, [isAuthenticated, currentView])

	const handleGetStarted = () => {
		if (isAuthenticated) {
			setCurrentView('dashboard')
		} else {
			setShowAuthModal(true)
		}
	}

	const handleAuthSuccess = async () => {
		setShowAuthModal(false)
		// 确保用户信息已更新
		await initialize()
		setCurrentView('dashboard')
	}

	const handleCreateProject = async () => {
		// 检查用户是否登录
		if (!user?.id) {
			setShowAuthModal(true)
			return
		}

		setIsLoading(true)
		try {
			// 在数据库中创建项目
			const project = await createProject(user.id, '未命名项目')

			if (project) {
				setCurrentProjectId(project.id)
				setCurrentProjectName(project.name)
				setCurrentProject(project)
				setCurrentView('canvas')
				console.log('项目创建成功:', project.id)
			} else {
				alert('创建项目失败，请重试')
			}
		} catch (error) {
			console.error('创建项目错误:', error)
			alert('创建项目失败：' + (error as Error).message)
		} finally {
			setIsLoading(false)
		}
	}

	const handleOpenProject = async (projectId: string) => {
		setIsLoading(true)
		try {
			// 从数据库加载项目
			const project = await getProject(projectId)

			if (project) {
				setCurrentProjectId(project.id)
				setCurrentProjectName(project.name)
				setCurrentProject(project)

				// 更新最后打开时间
				await updateProjectLastOpened(project.id)

				setCurrentView('canvas')
				console.log('项目加载成功:', project.name, '画布数据:', project.canvas_data ? '已加载' : '空')
			} else {
				alert('项目不存在或已被删除')
			}
		} catch (error) {
			console.error('打开项目错误:', error)
			alert('打开项目失败：' + (error as Error).message)
		} finally {
			setIsLoading(false)
		}
	}

	const handleBackToDashboard = () => {
		setCurrentView('dashboard')
		setCurrentProject(null)
		setCurrentProjectId(null)
		setCurrentProjectName('未命名项目')
	}

	const handleProjectNameChange = async (newName: string) => {
		setCurrentProjectName(newName)

		// 保存到数据库
		if (currentProjectId) {
			try {
				await updateProject(currentProjectId, { name: newName })
				console.log('项目名称已保存到数据库:', newName)
			} catch (error) {
				console.error('保存项目名称错误:', error)
			}
		}
	}

	// 设置全局变量
	globalBackToDashboard = handleBackToDashboard
	globalProjectName = currentProjectName
	globalProjectNameChange = handleProjectNameChange



	// 显示 Loading 状态
	if (isLoading) {
		return (
			<div style={{
				position: 'fixed',
				inset: 0,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: '#fafafa'
			}}>
				<div style={{ textAlign: 'center' }}>
					<div style={{
						width: 40,
						height: 40,
						border: '3px solid #f0f0f0',
						borderTop: '3px solid #3b82f6',
						borderRadius: '50%',
						animation: 'spin 1s linear infinite',
						margin: '0 auto 16px'
					}} />
					<p style={{ color: '#666', fontSize: 14 }}>加载中...</p>
				</div>
			</div>
		)
	}

	// 显示 Landing Page
	if (currentView === 'landing') {
		return (
			<>
				<LandingPage onGetStarted={handleGetStarted} />
				<AuthModal
					isOpen={showAuthModal}
					onClose={() => setShowAuthModal(false)}
					onAuthSuccess={handleAuthSuccess}
				/>
			</>
		)
	}

	// 显示 Dashboard
	if (currentView === 'dashboard') {
		return (
			<Dashboard
				onCreateProject={handleCreateProject}
				onOpenProject={handleOpenProject}
			/>
		)
	}

	// 显示画布
	return (
		<div style={{ position: 'fixed', inset: 0 }}>
			<Tldraw
				persistenceKey={`workflow-${currentProjectId}`}
				options={options}
				overrides={overrides}
				shapeUtils={shapeUtils}
				bindingUtils={bindingUtils}
				components={components}
				onMount={(editor) => {
					;(window as any).editor = editor

					// 如果有项目数据且有画布数据，加载到编辑器
					if (currentProject?.canvas_data) {
						try {
							console.log('📂 正在加载画布数据...')
							editor.loadSnapshot(currentProject.canvas_data)
							console.log('✓ 画布数据已加载')
						} catch (error) {
							console.error('✗ 加载画布数据失败:', error)
						}
					}

					// 如果画布为空，创建一个默认节点
					if (!editor.getCurrentPageShapes().some((s) => s.type === 'node')) {
						editor.createShape({ type: 'node', x: 200, y: 200 })
					}

					// 设置白色主题和其他用户偏好
					editor.user.updateUserPreferences({
						isSnapMode: true,
						colorScheme: 'light',
					})

					// Add our custom pointing port tool to the select tool's state machine
					// This allows users to create connections by pointing at ports
					editor.getStateDescendant('select')!.addChild(PointingPort)

					// Ensure connections always stay at the bottom of the shape stack
					// This prevents them from covering other shapes
					keepConnectionsAtBottom(editor)

					// Disable transparency for workflow shapes
					disableTransparency(editor, ['node', 'connection'])

					// 设置资产上传处理器
					if (currentProjectId && user?.id) {
						const cleanupAssetUploader = setupAssetUploader(editor, user.id, currentProjectId)
						console.log('✓ 资产上传器已启用')

						// 清理函数会在后面添加
						;(window as any).cleanupAssetUploader = cleanupAssetUploader
					}

					// 设置 Realtime 订阅（监听生成状态更新）
					let unsubscribeRealtime: (() => void) | null = null
					if (currentProjectId && user?.id) {
						const { subscribeToProjectGenerations } = await import('./lib/realtime')
						
						unsubscribeRealtime = subscribeToProjectGenerations(currentProjectId, (update) => {
							console.log('📨 收到生成状态更新:', update)
							
							// 查找画布上所有图片生成节点，更新对应的生成状态
							const shapes = editor.getCurrentPageShapes()
							for (const shape of shapes) {
								if (editor.isShapeOfType<NodeShape>(shape, 'node')) {
									const node = shape.props.node
									// 如果节点正在生成，且状态已更新，刷新节点显示
									if (node.type === 'imageGeneration' && node.isGenerating) {
										// 这里可以根据 generationId 匹配具体的节点
										// 暂时先更新所有正在生成的节点
										if (update.status === 'completed' && update.resultUrl) {
											let imageUrls: string[] = []
											try {
												const parsed = JSON.parse(update.resultUrl)
												imageUrls = Array.isArray(parsed) ? parsed : [update.resultUrl]
											} catch {
												imageUrls = [update.resultUrl]
											}
											
											editor.updateShape<NodeShape>({
												id: shape.id,
												type: 'node',
												props: {
													node: {
														...node,
														generatedImages: imageUrls,
														isGenerating: false,
													},
												},
											})
										} else if (update.status === 'failed') {
											editor.updateShape<NodeShape>({
												id: shape.id,
												type: 'node',
												props: {
													node: {
														...node,
														isGenerating: false,
													},
												},
											})
										}
									}
								}
							}
						})
					}

					// 自动保存画布数据到数据库
					if (currentProjectId && user?.id) {
						let saveTimeout: NodeJS.Timeout
						let thumbnailTimeout: NodeJS.Timeout
						let lastSaveTime = Date.now()
						let lastThumbnailTime = 0

						const saveCanvas = async (generateThumbnail = false) => {
							try {
								const snapshot = editor.getSnapshot()
								const success = await saveProjectCanvas(currentProjectId, snapshot)

								if (success) {
									lastSaveTime = Date.now()
									console.log('✓ 画布已保存', new Date().toLocaleTimeString())

									// 生成缩略图（防抖 30 秒）
									if (generateThumbnail && Date.now() - lastThumbnailTime > 30000) {
										clearTimeout(thumbnailTimeout)
										thumbnailTimeout = setTimeout(async () => {
											const thumbnailUrl = await generateAndUploadThumbnail(
												editor,
												user.id,
												currentProjectId
											)

											if (thumbnailUrl) {
												await updateProject(currentProjectId, { thumbnail_url: thumbnailUrl })
												lastThumbnailTime = Date.now()
											}
										}, 2000) // 延迟 2 秒生成缩略图
									}
								} else {
									console.error('✗ 保存失败')
								}
							} catch (error) {
								console.error('✗ 自动保存错误:', error)
							}
						}

						// 立即保存一次（加载画布数据）
						setTimeout(() => saveCanvas(false), 1000)

						// 每 30 秒自动保存并生成缩略图
						const autoSaveInterval = setInterval(() => {
							console.log('⏱ 定时自动保存...')
							saveCanvas(true) // 定时保存时生成缩略图
						}, 30000)

						// 监听编辑器变化 - 防抖保存
						const unsubscribe = editor.store.listen(() => {
							clearTimeout(saveTimeout)
							saveTimeout = setTimeout(() => {
								const timeSinceLastSave = Date.now() - lastSaveTime
								if (timeSinceLastSave > 3000) { // 至少间隔 3 秒
									console.log('✎ 编辑后自动保存...')
									saveCanvas(true) // 编辑保存时生成缩略图
								}
							}, 5000) // 停止编辑 5 秒后保存
						}, { source: 'user', scope: 'document' })

						// 窗口关闭前保存
						const handleBeforeUnload = (e: BeforeUnloadEvent) => {
							saveCanvas(true) // 关闭前保存并生成缩略图
						}
						window.addEventListener('beforeunload', handleBeforeUnload)

						// 清理函数（组件卸载时）
						return () => {
							// 取消 Realtime 订阅
							if (unsubscribeRealtime) {
								unsubscribeRealtime()
							}

							clearInterval(autoSaveInterval)
							clearTimeout(saveTimeout)
							clearTimeout(thumbnailTimeout)
							window.removeEventListener('beforeunload', handleBeforeUnload)
							unsubscribe()

							// 清理资产上传器
							const cleanupAssetUploader = (window as any).cleanupAssetUploader
							if (cleanupAssetUploader) {
								cleanupAssetUploader()
							}

							console.log('💾 卸载前最后保存...')
							saveCanvas(true) // 卸载前生成最后一次缩略图
						}
					}
				}}
			/>
		</div>
	)
}

export default App

import { useEditor, useValue } from 'tldraw'
import { getNodeDefinitions } from '../nodes/nodeTypes'

export function TopToolbar() {
	const editor = useEditor()

	// 响应式获取缩放级别
	const zoom = useValue('zoom', () => Math.round(editor.getZoomLevel() * 100), [editor])

	const handleAddNode = () => {
		// 创建文本输入节点
		const nodeDefs = getNodeDefinitions(editor)
		const center = editor.getViewportPageBounds().center
		editor.createShape({
			type: 'node',
			x: center.x - 150,
			y: center.y - 100,
			props: { node: nodeDefs.textInput.getDefault() },
		})
	}

	const handleSelectTool = () => {
		editor.setCurrentTool('select')
	}

	const handleHandTool = () => {
		editor.setCurrentTool('hand')
	}

	// 获取当前工具
	const currentTool = useValue('current tool', () => editor.getCurrentToolId(), [editor])

	const handleUndo = () => {
		editor.undo()
	}

	const handleRedo = () => {
		editor.redo()
	}

	const handleZoomIn = () => {
		editor.zoomIn()
	}

	const handleZoomOut = () => {
		editor.zoomOut()
	}

	const handleResetZoom = () => {
		editor.resetZoom()
	}

	return (
		<div className="bottom-toolbar">
			<div className="bottom-toolbar-content">
				{/* 新建节点按钮 */}
				<button className="toolbar-btn toolbar-btn-add" onClick={handleAddNode}>
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path
							d="M10 4V16M4 10H16"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
						/>
					</svg>
				</button>

				{/* 选择和手抓工具 */}
				<button
					className={`toolbar-btn ${currentTool === 'select' ? 'toolbar-btn-active' : ''}`}
					onClick={handleSelectTool}
					title="选择工具 (V)"
				>
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path
							d="M3 3L10 17L12 11L18 9L3 3Z"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinejoin="round"
							fill="none"
						/>
					</svg>
				</button>

				<button
					className={`toolbar-btn ${currentTool === 'hand' ? 'toolbar-btn-active' : ''}`}
					onClick={handleHandTool}
					title="手抓工具 (H)"
				>
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path d="M8 11V7.5C8 6.67157 8.67157 6 9.5 6C10.3284 6 11 6.67157 11 7.5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
						<path d="M11 10V6.5C11 5.67157 11.6716 5 12.5 5C13.3284 5 14 5.67157 14 6.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
						<path d="M14 10V7C14 6.44772 14.4477 6 15 6C15.5523 6 16 6.44772 16 7V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
						<path d="M16 10.5V11C16 13.2091 14.2091 15 12 15H10C8.34315 15 7 13.6569 7 12V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
						<path d="M8 11V10C8 9.44772 7.55228 9 7 9C6.44772 9 6 9.44772 6 10V11.5C6 11.7761 6.22386 12 6.5 12C6.77614 12 7 11.7761 7 11.5V12C7 13.1046 7.89543 14 9 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
					</svg>
				</button>

				<div className="toolbar-divider" />

				{/* 撤销重做 */}
				<button className="toolbar-btn" onClick={handleUndo} title="撤销 (⌘Z)">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path
							d="M5 10H15C16.1046 10 17 10.8954 17 12C17 13.1046 16.1046 14 15 14H13"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
						/>
						<path
							d="M7 7L4 10L7 13"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</button>

				<button className="toolbar-btn" onClick={handleRedo} title="重做 (⌘⇧Z)">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path
							d="M15 10H5C3.89543 10 3 10.8954 3 12C3 13.1046 3.89543 14 5 14H7"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
						/>
						<path
							d="M13 7L16 10L13 13"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</button>

				<div className="toolbar-divider" />

				{/* 缩放控制 */}
				<div className="toolbar-zoom">
					<button className="toolbar-zoom-btn" onClick={handleZoomOut} title="缩小">
						<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
							<path d="M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
						</svg>
					</button>
					<button className="toolbar-zoom-display" onClick={handleResetZoom} title="重置缩放">
						{zoom}%
					</button>
					<button className="toolbar-zoom-btn" onClick={handleZoomIn} title="放大">
						<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
							<path
								d="M6 2V10M2 6H10"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	)
}

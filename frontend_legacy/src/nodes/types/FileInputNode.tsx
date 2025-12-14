import { T, useEditor } from 'tldraw'
import { NODE_HEADER_HEIGHT_PX, NODE_WIDTH_PX } from '../../constants'
import { ShapePort } from '../../ports/Port'
import { NodeShape } from '../NodeShapeUtil'
import {
	ExecutionResult,
	InfoValues,
	NodeComponentProps,
	NodeDefinition,
	updateNode,
	NodeMenu,
} from './shared'
import { useState, useRef } from 'react'

// 定义节点的数据模型
export type FileInputNode = T.TypeOf<typeof FileInputNode>
export const FileInputNode = T.object({
	type: T.literal('fileInput'),
	fileName: T.string,
	fileUrl: T.string,
	fileType: T.string,
	fileSize: T.number,
})

export class FileInputNodeDefinition extends NodeDefinition<FileInputNode> {
	static type = 'fileInput'
	static validator = FileInputNode
	title = '文件输入'
	heading = 'File'
	icon = (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
			<path d="M9 2H4C3.44772 2 3 2.44772 3 3V13C3 13.5523 3.44772 14 4 14H12C12.5523 14 13 13.5523 13 13V6L9 2Z" stroke="currentColor" strokeWidth="1.3"/>
			<path d="M9 2V6H13" stroke="currentColor" strokeWidth="1.3"/>
		</svg>
	)

	getDefault(): FileInputNode {
		return {
			type: 'fileInput',
			fileName: '',
			fileUrl: '',
			fileType: '',
			fileSize: 0,
		}
	}

	getBodyHeightPx(_shape: NodeShape, node: FileInputNode) {
		// Fixed height for the file upload area + URL input
		return 360
	}

	getPorts(_shape: NodeShape, node: FileInputNode): Record<string, ShapePort> {
		return {
			output: {
				id: 'output',
				x: NODE_WIDTH_PX,
				y: NODE_HEADER_HEIGHT_PX + 30,
				terminal: 'start',
			},
		}
	}

	async execute(_shape: NodeShape, node: FileInputNode): Promise<ExecutionResult> {
		return {
			output: node.fileName ? 1 : 0,
		}
	}

	getOutputInfo(shape: NodeShape, node: FileInputNode): InfoValues {
		return {
			output: {
				value: node.fileName ? 1 : 0,
				isOutOfDate: shape.props.isOutOfDate,
			},
		}
	}

	Component = FileInputNodeComponent
}

export function FileInputNodeComponent({ shape, node }: NodeComponentProps<FileInputNode>) {
	const editor = useEditor()
	const [isDragging, setIsDragging] = useState(false)
	const [urlInput, setUrlInput] = useState('')
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleFileUpload = async (files: FileList | null) => {
		if (!files || files.length === 0) return

		const file = files[0]
		const reader = new FileReader()

		reader.onload = (event) => {
			const fileUrl = event.target?.result as string
			updateNode<FileInputNode>(
				editor,
				shape,
				(node) => ({
					...node,
					fileName: file.name,
					fileUrl: fileUrl,
					fileType: file.type,
					fileSize: file.size,
				}),
				false
			)
		}
		reader.readAsDataURL(file)
	}

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(true)
	}

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(false)
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(false)

		// Prevent tldraw from handling this event
		if (e.dataTransfer.files.length > 0) {
			handleFileUpload(e.dataTransfer.files)
		}
	}

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		fileInputRef.current?.click()
	}

	const handleUrlSubmit = () => {
		if (urlInput.trim()) {
			updateNode<FileInputNode>(
				editor,
				shape,
				(node) => ({
					...node,
					fileName: urlInput.split('/').pop() || 'file',
					fileUrl: urlInput,
					fileType: 'url',
					fileSize: 0,
				}),
				false
			)
			setUrlInput('')
		}
	}

	const handleRemoveFile = () => {
		updateNode<FileInputNode>(
			editor,
			shape,
			(node) => ({
				...node,
				fileName: '',
				fileUrl: '',
				fileType: '',
				fileSize: 0,
			}),
			false
		)
	}

	const handleDelete = () => {
		editor.deleteShape(shape.id)
	}

	const handleDuplicate = () => {
		const bounds = editor.getShapePageBounds(shape.id)
		if (!bounds) return

		editor.createShape({
			type: 'node',
			x: bounds.x + 20,
			y: bounds.y + 20,
			props: {
				node: {
					...node,
					fileName: '',
					fileUrl: '',
					fileType: '',
					fileSize: 0,
				},
			},
		})
	}

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
	}

	const getFileIcon = (fileType: string, fileName: string) => {
		// 图片文件
		if (fileType.startsWith('image/')) {
			return (
				<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
					<rect x="4" y="4" width="24" height="24" rx="2" stroke="#a0ff1f" strokeWidth="2"/>
					<circle cx="11" cy="11" r="2" fill="#a0ff1f"/>
					<path d="M4 20L10 14L16 20L22 14L28 20" stroke="#a0ff1f" strokeWidth="2" strokeLinecap="round"/>
				</svg>
			)
		}

		// 视频文件
		if (fileType.startsWith('video/')) {
			return (
				<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
					<rect x="3" y="8" width="20" height="16" rx="2" stroke="#a0ff1f" strokeWidth="2"/>
					<path d="M23 12L29 8V24L23 20V12Z" stroke="#a0ff1f" strokeWidth="2" strokeLinejoin="round"/>
					<path d="M12 14L16 16L12 18V14Z" fill="#a0ff1f"/>
				</svg>
			)
		}

		// PDF 文件
		if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
			return (
				<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
					<path d="M18 4H8C6.89543 4 6 4.89543 6 6V26C6 27.1046 6.89543 28 8 28H24C25.1046 28 26 27.1046 26 26V12L18 4Z" stroke="#ff3b30" strokeWidth="2"/>
					<path d="M18 4V12H26" stroke="#ff3b30" strokeWidth="2"/>
					<text x="16" y="21" fontSize="8" fill="#ff3b30" textAnchor="middle" fontWeight="bold">PDF</text>
				</svg>
			)
		}

		// Word 文档
		if (fileType.includes('word') || fileName.toLowerCase().endsWith('.doc') || fileName.toLowerCase().endsWith('.docx')) {
			return (
				<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
					<path d="M18 4H8C6.89543 4 6 4.89543 6 6V26C6 27.1046 6.89543 28 8 28H24C25.1046 28 26 27.1046 26 26V12L18 4Z" stroke="#2b579a" strokeWidth="2"/>
					<path d="M18 4V12H26" stroke="#2b579a" strokeWidth="2"/>
					<path d="M10 16H22M10 20H22" stroke="#2b579a" strokeWidth="1.5"/>
				</svg>
			)
		}

		// Excel 文件
		if (fileType.includes('sheet') || fileName.toLowerCase().endsWith('.xls') || fileName.toLowerCase().endsWith('.xlsx')) {
			return (
				<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
					<path d="M18 4H8C6.89543 4 6 4.89543 6 6V26C6 27.1046 6.89543 28 8 28H24C25.1046 28 26 27.1046 26 26V12L18 4Z" stroke="#217346" strokeWidth="2"/>
					<path d="M18 4V12H26" stroke="#217346" strokeWidth="2"/>
					<path d="M10 15H22M10 19H22M10 23H22M14 15V23M18 15V23" stroke="#217346" strokeWidth="1.5"/>
				</svg>
			)
		}

		// 音频文件
		if (fileType.startsWith('audio/')) {
			return (
				<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
					<path d="M18 4H8C6.89543 4 6 4.89543 6 6V26C6 27.1046 6.89543 28 8 28H24C25.1046 28 26 27.1046 26 26V12L18 4Z" stroke="#a0ff1f" strokeWidth="2"/>
					<path d="M18 4V12H26" stroke="#a0ff1f" strokeWidth="2"/>
					<circle cx="13" cy="20" r="2" stroke="#a0ff1f" strokeWidth="1.5"/>
					<path d="M15 20V14L21 13V19M21 19C21 20.1046 20.1046 21 19 21C17.8954 21 17 20.1046 17 19C17 17.8954 17.8954 17 19 17C20.1046 17 21 17.8954 21 19Z" stroke="#a0ff1f" strokeWidth="1.5"/>
				</svg>
			)
		}

		// 压缩文件
		if (fileType.includes('zip') || fileType.includes('rar') || fileName.match(/\.(zip|rar|7z|tar|gz)$/i)) {
			return (
				<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
					<path d="M18 4H8C6.89543 4 6 4.89543 6 6V26C6 27.1046 6.89543 28 8 28H24C25.1046 28 26 27.1046 26 26V12L18 4Z" stroke="#f59e0b" strokeWidth="2"/>
					<path d="M18 4V12H26" stroke="#f59e0b" strokeWidth="2"/>
					<path d="M14 14H18M14 17H18M14 20H18M16 20V23" stroke="#f59e0b" strokeWidth="1.5"/>
				</svg>
			)
		}

		// 默认文件图标
		return (
			<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
				<path d="M18 4H8C6.89543 4 6 4.89543 6 6V26C6 27.1046 6.89543 28 8 28H24C25.1046 28 26 27.1046 26 26V12L18 4Z" stroke="#a0ff1f" strokeWidth="2"/>
				<path d="M18 4V12H26" stroke="#a0ff1f" strokeWidth="2"/>
			</svg>
		)
	}

	const getFileTypeLabel = (fileType: string, fileName: string) => {
		if (fileType.startsWith('image/')) return '图片'
		if (fileType.startsWith('video/')) return '视频'
		if (fileType.startsWith('audio/')) return '音频'
		if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) return 'PDF'
		if (fileType.includes('word') || fileName.match(/\.docx?$/i)) return 'Word'
		if (fileType.includes('sheet') || fileName.match(/\.xlsx?$/i)) return 'Excel'
		if (fileType.includes('zip') || fileName.match(/\.(zip|rar|7z|tar|gz)$/i)) return '压缩包'
		return '文件'
	}

	return (
		<div className="FileInputNode" style={{ padding: '12px', pointerEvents: 'auto', position: 'relative' }}>
			{/* 节点菜单 */}
			<div style={{
				position: 'absolute',
				top: '12px',
				right: '12px',
				zIndex: 10,
				pointerEvents: 'auto',
			}}>
				<NodeMenu
					shape={shape}
					onDelete={handleDelete}
					onDuplicate={handleDuplicate}
				/>
			</div>

			{/* Hidden file input */}
			<input
				ref={fileInputRef}
				type="file"
				accept="*/*"
				onChange={(e) => handleFileUpload(e.target.files)}
				style={{ display: 'none' }}
			/>

			{/* 文件上传区域 */}
			<div
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={handleClick}
				onPointerDown={(e) => {
					e.stopPropagation()
					editor.setSelectedShapes([shape.id])
				}}
				style={{
					position: 'relative',
					height: '260px',
					border: isDragging ? '2px dashed #3b82f6' : '2px dashed rgba(0, 0, 0, 0.15)',
					borderRadius: '8px',
					background: isDragging ? 'rgba(59, 130, 246, 0.05)' : 'rgba(0, 0, 0, 0.02)',
					cursor: 'pointer',
					transition: 'all 0.2s ease',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					gap: '12px',
					overflow: 'hidden',
					pointerEvents: 'auto',
				}}
			>
				{!node.fileName ? (
					<>
						{/* 上传图标 */}
						<div style={{
							width: '48px',
							height: '48px',
							borderRadius: '50%',
							background: 'rgba(0, 0, 0, 0.05)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							color: 'rgba(0, 0, 0, 0.6)',
						}}>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
								<path d="M12 4V16M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								<path d="M4 16V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
							</svg>
						</div>

						{/* 上传文本 */}
						<div style={{
							textAlign: 'center',
							color: 'rgba(0, 0, 0, 0.6)',
						}}>
							<p style={{
								fontSize: '14px',
								fontWeight: 500,
								marginBottom: '4px',
							}}>
								Drag & drop or click to upload
							</p>
							<p style={{
								fontSize: '12px',
								color: 'rgba(0, 0, 0, 0.4)',
							}}>
								支持所有文件格式
							</p>
						</div>
					</>
				) : (
					<>
						{/* 文件预览 */}
						{node.fileType.startsWith('image/') && node.fileUrl ? (
							<img
								src={node.fileUrl}
								alt={node.fileName}
								style={{
									width: '100%',
									height: '100%',
									objectFit: 'contain',
								}}
								onPointerDown={(e) => e.stopPropagation()}
							/>
						) : node.fileType.startsWith('video/') && node.fileUrl ? (
							<video
								src={node.fileUrl}
								controls
								style={{
									width: '100%',
									height: '100%',
									objectFit: 'contain',
								}}
								onPointerDown={(e) => e.stopPropagation()}
							/>
						) : (
							<div style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: '12px',
							}}>
								<div style={{
									width: '80px',
									height: '80px',
									borderRadius: '12px',
									background: 'rgba(160, 255, 31, 0.08)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}>
									{getFileIcon(node.fileType, node.fileName)}
								</div>
								<div style={{ textAlign: 'center', maxWidth: '220px' }}>
									<div style={{
										display: 'inline-block',
										padding: '2px 8px',
										borderRadius: '4px',
										background: 'rgba(160, 255, 31, 0.15)',
										marginBottom: '6px',
									}}>
										<span style={{
											fontSize: '10px',
											fontWeight: 600,
											color: '#5a8000',
											textTransform: 'uppercase',
										}}>
											{getFileTypeLabel(node.fileType, node.fileName)}
										</span>
									</div>
									<p style={{
										fontSize: '13px',
										fontWeight: 500,
										color: 'rgba(0, 0, 0, 0.9)',
										marginBottom: '4px',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
									}}>
										{node.fileName}
									</p>
									{node.fileSize > 0 && (
										<p style={{
											fontSize: '11px',
											color: 'rgba(0, 0, 0, 0.5)',
										}}>
											{formatFileSize(node.fileSize)}
										</p>
									)}
								</div>
							</div>
						)}

						{/* 删除按钮 */}
						<button
							onClick={(e) => {
								e.stopPropagation()
								handleRemoveFile()
							}}
							onPointerDown={(e) => e.stopPropagation()}
							style={{
								position: 'absolute',
								top: '8px',
								right: '8px',
								width: '28px',
								height: '28px',
								padding: 0,
								border: 'none',
								borderRadius: '6px',
								background: 'rgba(0, 0, 0, 0.5)',
								color: 'white',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '16px',
								transition: 'all 0.2s ease',
								pointerEvents: 'auto',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = '#ff3333'
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'
							}}
						>
							×
						</button>
					</>
				)}
			</div>

			{/* URL 输入框 */}
			<div style={{ marginTop: '12px', pointerEvents: 'auto' }}>
				<div style={{
					display: 'flex',
					gap: '6px',
				}}>
					<input
						type="text"
						value={urlInput}
						onChange={(e) => setUrlInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								handleUrlSubmit()
							}
						}}
						placeholder="Paste a file link"
						onFocus={(e) => {
							e.stopPropagation()
							editor.setSelectedShapes([shape.id])
						}}
						onClick={(e) => e.stopPropagation()}
						onPointerDown={(e) => e.stopPropagation()}
						style={{
							flex: 1,
							height: '36px',
							padding: '0 12px',
							border: '1px solid rgba(0, 0, 0, 0.1)',
							borderRadius: '6px',
							background: 'rgba(0, 0, 0, 0.02)',
							color: 'rgba(0, 0, 0, 0.9)',
							fontSize: '12px',
							fontFamily: 'inherit',
							outline: 'none',
							transition: 'all 0.2s ease',
							pointerEvents: 'auto',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)'
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
						}}
						onFocusCapture={(e) => {
							e.currentTarget.style.borderColor = '#3b82f6'
							e.currentTarget.style.background = '#ffffff'
						}}
						onBlurCapture={(e) => {
							e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
							e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)'
						}}
					/>
					{urlInput && (
						<button
							onClick={(e) => {
								e.stopPropagation()
								handleUrlSubmit()
							}}
							onPointerDown={(e) => e.stopPropagation()}
							style={{
								height: '36px',
								padding: '0 16px',
								border: 'none',
								borderRadius: '6px',
								background: '#3b82f6',
								color: '#fff',
								fontSize: '12px',
								fontWeight: 500,
								cursor: 'pointer',
								transition: 'all 0.2s ease',
								pointerEvents: 'auto',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = '#2563eb'
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = '#3b82f6'
							}}
						>
							添加
						</button>
					)}
				</div>
			</div>
		</div>
	)
}

import React from 'react'
import { T, useEditor } from 'tldraw'
import { NODE_HEADER_HEIGHT_PX, NODE_ROW_HEIGHT_PX, NODE_WIDTH_PX } from '../../constants'
import { ShapePort } from '../../ports/Port'
import { sleep } from '../../utils/sleep'
import { NodeShape } from '../NodeShapeUtil'
import {
	ExecutionResult,
	InfoValues,
	InputValues,
	NodeComponentProps,
	NodeDefinition,
	NodeRow,
	updateNode,
	NodeMenu,
	PlaceholderImage,
	LoadingSpinner,
} from './shared'

export type ImageGenerationNode = T.TypeOf<typeof ImageGenerationNode>
export const ImageGenerationNode = T.object({
	type: T.literal('imageGeneration'),
	model: T.string,
	mode: T.string,
	quantity: T.number,
	aspectRatio: T.string,
	generatedImages: T.arrayOf(T.string),
	isGenerating: T.boolean,
})

const MODELS = [
	{ id: 'flux-pro', name: 'Flux Pro 1.1', logo: '⚡' },
	{ id: 'seedream', name: 'Seedream 4', logo: '🌱' },
	{ id: 'sd35', name: 'Stable Diffusion 3.5', logo: '🎨' },
	{ id: 'dalle3', name: 'DALL-E 3', logo: '🤖' },
	{ id: 'midjourney', name: 'Midjourney', logo: '🎭' },
]

const MODES = ['Auto', 'Fast', 'Quality']

const ASPECT_RATIOS = [
	{ id: '1:1', name: '1:1 方形', width: 1024, height: 1024 },
	{ id: '16:9', name: '16:9 横屏', width: 1920, height: 1080 },
	{ id: '9:16', name: '9:16 竖屏', width: 1080, height: 1920 },
	{ id: '4:3', name: '4:3 传统', width: 1440, height: 1080 },
	{ id: '3:4', name: '3:4 竖版', width: 1080, height: 1440 },
]

export class ImageGenerationNodeDefinition extends NodeDefinition<ImageGenerationNode> {
	static type = 'imageGeneration'
	static validator = ImageGenerationNode
	title = '图片'
	heading = '图片'
	icon = (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
			<rect x="2.5" y="2.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/>
			<circle cx="5.5" cy="5.5" r="1" fill="currentColor"/>
			<path d="M2.5 11L5 8.5L7.5 11L10.5 8L13.5 11V11.5C13.5 12.6046 12.6046 13.5 11.5 13.5H4.5C3.39543 13.5 2.5 12.6046 2.5 11.5V11Z" fill="currentColor"/>
		</svg>
	)

	getDefault(): ImageGenerationNode {
		return {
			type: 'imageGeneration',
			model: 'seedream',
			mode: 'Auto',
			quantity: 1,
			aspectRatio: '1:1',
			generatedImages: [],
			isGenerating: false,
		}
	}

	getBodyHeightPx(_shape: NodeShape, node: ImageGenerationNode) {
		// 大内容区域(280px) + 参数区域(120px) + Run按钮(50px)
		return 280 + 120 + 50
	}

	getPorts(_shape: NodeShape, node: ImageGenerationNode): Record<string, ShapePort> {
		return {
			prompt: {
				id: 'prompt',
				x: 0,
				y: NODE_HEADER_HEIGHT_PX + 80,
				terminal: 'end',
			},
			image: {
				id: 'image',
				x: 0,
				y: NODE_HEADER_HEIGHT_PX + 140,
				terminal: 'end',
			},
			lora: {
				id: 'lora',
				x: 0,
				y: NODE_HEADER_HEIGHT_PX + 200,
				terminal: 'end',
			},
			output: {
				id: 'output',
				x: NODE_WIDTH_PX,
				y: NODE_HEADER_HEIGHT_PX + 140,
				terminal: 'start',
			},
		}
	}

	async execute(shape: NodeShape, node: ImageGenerationNode, inputs: InputValues): Promise<ExecutionResult> {
		// 获取输入节点的数据
		const { getNodePortConnections } = await import('../nodePorts')
		const connections = getNodePortConnections(this.editor, shape)
		const inputConnection = connections.find(c => c.ownPortId === 'prompt' || c.ownPortId === 'image')

		let inputPrompt = '默认生成内容'
		let inputImages: string[] = []

		if (inputConnection) {
			const inputShape = this.editor.getShape(inputConnection.connectedShapeId)
			if (inputShape && this.editor.isShapeOfType<NodeShape>(inputShape, 'node')) {
				const inputNode = inputShape.props.node
				if (inputNode.type === 'textInput') {
					inputPrompt = inputNode.text || '默认生成内容'
					inputImages = inputNode.images || []
				}
			}
		}

		console.log('生成图片使用的提示词:', inputPrompt)
		console.log('参考图片数量:', inputImages.length)

		// 获取用户信息和项目ID
		const { useUserStore } = await import('../../stores/userStore')
		const userStore = useUserStore.getState()
		const user = userStore.user

		if (!user?.id) {
			throw new Error('用户未登录，无法生成图片')
		}

		// 获取当前项目ID（从全局变量或编辑器上下文）
		const projectId = (window as any).currentProjectId || null

		// 调用后端 API 生成图片
		const { backendApi } = await import('../../lib/backendApi')

		try {
			const response = await backendApi.generateImage({
				prompt: inputPrompt,
				model: node.model,
				aspectRatio: node.aspectRatio,
				quantity: node.quantity,
				referenceImages: inputImages,
				projectId: projectId,
			})

			if (!response.success || !response.generationId) {
				throw new Error(response.error || '生成失败')
			}

			// 等待生成完成
			const status = await backendApi.waitForGeneration(response.generationId, {
				pollInterval: 2000,
				maxAttempts: 60,
				onProgress: (status) => {
					console.log('⏳ 生成进度:', status.status)
					// 可以在这里更新节点状态显示进度
				},
			})

			if (status.status === 'completed' && status.resultUrl) {
				// 解析结果URL（可能是单个URL或JSON数组）
				let imageUrls: string[] = []
				try {
					const parsed = JSON.parse(status.resultUrl)
					imageUrls = Array.isArray(parsed) ? parsed : [status.resultUrl]
				} catch {
					imageUrls = [status.resultUrl]
				}

				// 更新节点以显示生成的图片
				this.editor.updateShape<NodeShape>({
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

				return {
					output: imageUrls.length,
				}
			} else {
				throw new Error(status.errorMessage || '生成失败')
			}
		} catch (error) {
			console.error('图片生成失败:', error)
			
			// 更新节点状态为失败
			this.editor.updateShape<NodeShape>({
				id: shape.id,
				type: 'node',
				props: {
					node: {
						...node,
						isGenerating: false,
					},
				},
			})

			throw error
		}
	}

	getOutputInfo(shape: NodeShape, node: ImageGenerationNode): InfoValues {
		return {
			output: {
				value: node.generatedImages ? node.generatedImages.length : 0,
				isOutOfDate: shape.props.isOutOfDate,
			},
		}
	}

	Component = ImageGenerationNodeComponent
}

export function ImageGenerationNodeComponent({ shape, node }: NodeComponentProps<ImageGenerationNode>) {
	const editor = useEditor()
	const [selectedImageIndex, setSelectedImageIndex] = React.useState<number | null>(null)
	const [isLightboxOpen, setIsLightboxOpen] = React.useState(false)

	const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		editor.setSelectedShapes([shape.id])
		updateNode<ImageGenerationNode>(
			editor,
			shape,
			(node) => ({ ...node, model: e.target.value }),
			false
		)
	}

	const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		editor.setSelectedShapes([shape.id])
		updateNode<ImageGenerationNode>(
			editor,
			shape,
			(node) => ({ ...node, mode: e.target.value }),
			false
		)
	}

	const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		editor.setSelectedShapes([shape.id])
		updateNode<ImageGenerationNode>(
			editor,
			shape,
			(node) => ({ ...node, quantity: parseInt(e.target.value) }),
			false
		)
	}

	const handleAspectRatioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		editor.setSelectedShapes([shape.id])
		updateNode<ImageGenerationNode>(
			editor,
			shape,
			(node) => ({ ...node, aspectRatio: e.target.value }),
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
					generatedImages: [],
					isGenerating: false,
				},
			},
		})
	}

	const handleContinueCreation = (imageUrl: string) => {
		const currentBounds = editor.getShapePageBounds(shape.id)
		if (!currentBounds) return

		const textNodeId = editor.createShapeId()
		const textY = currentBounds.y + currentBounds.h + 100

		editor.createShape({
			id: textNodeId,
			type: 'node',
			x: currentBounds.x,
			y: textY,
			props: {
				node: {
					type: 'textInput',
					text: '',
					images: [imageUrl],
				},
			},
		})

		const newImageNodeId = editor.createShapeId()
		editor.createShape({
			id: newImageNodeId,
			type: 'node',
			x: currentBounds.x + 350,
			y: textY,
			props: {
				node: {
					type: 'imageGeneration',
					model: node.model,
					mode: node.mode,
					quantity: 1,
					aspectRatio: node.aspectRatio,
					generatedImages: [],
					isGenerating: false,
				},
			},
		})

		editor.createBinding({
			type: 'connection',
			fromId: textNodeId,
			toId: newImageNodeId,
			props: {
				terminal: 'start',
				isPrecise: false,
			},
		})

		editor.select(textNodeId, newImageNodeId)

		const newBounds = editor.getShapePageBounds(textNodeId)
		if (newBounds) {
			editor.zoomToBounds(
				{
					x: newBounds.x - 100,
					y: newBounds.y - 100,
					w: newBounds.w + 700,
					h: newBounds.h + 200,
				},
				{ duration: 500 }
			)
		}
	}

	const handleExecute = async () => {
		editor.setSelectedShapes([shape.id])
		updateNode<ImageGenerationNode>(
			editor,
			shape,
			(node) => ({ ...node, isGenerating: true }),
			false
		)

		await sleep(100)
		const def = new ImageGenerationNodeDefinition(editor)
		await def.execute(shape, node, {})
	}

	// Get current model info
	const currentModel = MODELS.find(m => m.id === node.model) || MODELS[0]

	// Calculate image grid layout
	const getImageGridStyle = (count: number) => {
		if (count === 1) {
			return { columns: 1, rows: 1, height: '280px' }
		} else if (count === 2) {
			return { columns: 2, rows: 1, height: '140px' }
		} else if (count === 3 || count === 4) {
			return { columns: 2, rows: 2, height: '280px' }
		}
		return { columns: 2, rows: 2, height: '280px' }
	}

	const gridStyle = getImageGridStyle(node.generatedImages.length)

	return (
		<div className="ImageGenerationNode" style={{
			padding: '0',
			fontSize: '12px',
			position: 'relative',
			width: '100%',
			height: '100%',
		}}>
			{/* 节点菜单 */}
			<div style={{
				position: 'absolute',
				top: '8px',
				right: '8px',
				zIndex: 10,
				pointerEvents: 'auto',
			}}>
				<NodeMenu
					shape={shape}
					onDelete={handleDelete}
					onDuplicate={handleDuplicate}
				/>
			</div>

			{/* 端口标签 */}
			<div style={{
				position: 'absolute',
				left: '-70px',
				top: `${NODE_HEADER_HEIGHT_PX + 80 - 10}px`,
				fontSize: '11px',
				color: '#8b5cf6',
				fontWeight: 600,
			}}>
				Prompt*
			</div>
			<div style={{
				position: 'absolute',
				left: '-60px',
				top: `${NODE_HEADER_HEIGHT_PX + 140 - 10}px`,
				fontSize: '11px',
				color: '#10b981',
				fontWeight: 600,
			}}>
				Image
			</div>
			<div style={{
				position: 'absolute',
				left: '-55px',
				top: `${NODE_HEADER_HEIGHT_PX + 200 - 10}px`,
				fontSize: '11px',
				color: '#8b5cf6',
				fontWeight: 600,
			}}>
				LoRA
			</div>
			<div style={{
				position: 'absolute',
				right: '-60px',
				top: `${NODE_HEADER_HEIGHT_PX + 140 - 10}px`,
				fontSize: '11px',
				color: '#10b981',
				fontWeight: 600,
			}}>
				Result
			</div>

			{/* 大内容区域 */}
			<div style={{ padding: '8px 12px 0 12px' }}>
				{node.generatedImages && node.generatedImages.length > 0 ? (
					<div
						style={{
							width: '100%',
							height: '280px',
							borderRadius: '8px',
							overflow: 'hidden',
							background: 'rgba(0, 0, 0, 0.02)',
							display: 'grid',
							gridTemplateColumns: `repeat(${gridStyle.columns}, 1fr)`,
							gridTemplateRows: `repeat(${gridStyle.rows}, 1fr)`,
							gap: '4px',
							padding: '4px',
						}}
					>
						{node.generatedImages.slice(0, 4).map((imageUrl, index) => (
							<div
								key={index}
								onClick={(e) => {
									e.stopPropagation()
									setSelectedImageIndex(index)
									setIsLightboxOpen(true)
								}}
								onPointerDown={editor.markEventAsHandled}
								style={{
									width: '100%',
									height: '100%',
									borderRadius: '6px',
									overflow: 'hidden',
									cursor: 'pointer',
									border: '1px solid rgba(0, 0, 0, 0.08)',
									transition: 'all 0.2s',
									pointerEvents: 'auto',
									position: 'relative',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.transform = 'scale(1.02)'
									e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.transform = 'scale(1)'
									e.currentTarget.style.boxShadow = 'none'
								}}
							>
								<img
									src={imageUrl}
									alt={`生成的图片 ${index + 1}`}
									style={{
										width: '100%',
										height: '100%',
										objectFit: 'cover',
									}}
								/>
							</div>
						))}
					</div>
				) : (
					<div style={{ height: '280px' }}>
						<PlaceholderImage
							height={280}
							text={node.isGenerating ? '正在生成...' : '未生成'}
						/>
					</div>
				)}
			</div>

			{/* 参数区域 */}
			<div style={{ padding: '12px', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
				<div style={{ marginBottom: '10px' }}>
					<label style={{
						display: 'block',
						fontSize: '11px',
						color: 'rgba(0, 0, 0, 0.5)',
						marginBottom: '4px',
						fontWeight: 500,
					}}>
						比例
					</label>
					<select
						value={node.aspectRatio}
						onChange={handleAspectRatioChange}
						onPointerDown={editor.markEventAsHandled}
						onClick={(e) => e.stopPropagation()}
						style={{
							width: '100%',
							padding: '6px 8px',
							background: '#ffffff',
							border: '1px solid rgba(0, 0, 0, 0.12)',
							borderRadius: '6px',
							color: 'rgba(0, 0, 0, 0.9)',
							fontSize: '12px',
							cursor: 'pointer',
							outline: 'none',
						}}
					>
						{ASPECT_RATIOS.map((ratio) => (
							<option key={ratio.id} value={ratio.id}>
								{ratio.name}
							</option>
						))}
					</select>
				</div>

				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
					<div>
						<label style={{
							display: 'block',
							fontSize: '11px',
							color: 'rgba(0, 0, 0, 0.5)',
							marginBottom: '4px',
							fontWeight: 500,
						}}>
							模式
						</label>
						<select
							value={node.mode}
							onChange={handleModeChange}
							onPointerDown={editor.markEventAsHandled}
							onClick={(e) => e.stopPropagation()}
							style={{
								width: '100%',
								padding: '6px 8px',
								background: '#ffffff',
								border: '1px solid rgba(0, 0, 0, 0.12)',
								borderRadius: '6px',
								color: 'rgba(0, 0, 0, 0.9)',
								fontSize: '12px',
								cursor: 'pointer',
								outline: 'none',
							}}
						>
							{MODES.map((mode) => (
								<option key={mode} value={mode}>
									{mode}
								</option>
							))}
						</select>
					</div>

					<div>
						<label style={{
							display: 'block',
							fontSize: '11px',
							color: 'rgba(0, 0, 0, 0.5)',
							marginBottom: '4px',
							fontWeight: 500,
						}}>
							数量
						</label>
						<select
							value={node.quantity}
							onChange={handleQuantityChange}
							onPointerDown={editor.markEventAsHandled}
							onClick={(e) => e.stopPropagation()}
							style={{
								width: '100%',
								padding: '6px 8px',
								background: '#ffffff',
								border: '1px solid rgba(0, 0, 0, 0.12)',
								borderRadius: '6px',
								color: 'rgba(0, 0, 0, 0.9)',
								fontSize: '12px',
								cursor: 'pointer',
								outline: 'none',
							}}
						>
							{[1, 2, 3, 4].map((num) => (
								<option key={num} value={num}>
									{num}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{/* Run Model 按钮 */}
			<div style={{ padding: '0 12px 12px 12px' }}>
				<button
					onClick={handleExecute}
					onPointerDown={editor.markEventAsHandled}
					disabled={node.isGenerating}
					style={{
						width: '100%',
						padding: '10px',
						background: node.isGenerating ? 'rgba(0, 0, 0, 0.05)' : '#3b82f6',
						border: '1px solid rgba(0, 0, 0, 0.12)',
						borderRadius: '8px',
						color: node.isGenerating ? 'rgba(0, 0, 0, 0.3)' : '#ffffff',
						fontSize: '13px',
						fontWeight: 600,
						cursor: node.isGenerating ? 'not-allowed' : 'pointer',
						transition: 'all 0.2s ease',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: '8px',
						pointerEvents: 'auto',
					}}
					onMouseEnter={(e) => {
						if (!node.isGenerating) {
							e.currentTarget.style.background = '#2563eb'
						}
					}}
					onMouseLeave={(e) => {
						if (!node.isGenerating) {
							e.currentTarget.style.background = '#3b82f6'
						}
					}}
				>
					{node.isGenerating && <LoadingSpinner size={14} color="#ffffff" />}
					<span>→ Run Model</span>
				</button>
			</div>

			{/* Improved Lightbox - Gemini style */}
			{isLightboxOpen && selectedImageIndex !== null && node.generatedImages[selectedImageIndex] && (
				<div
					onClick={(e) => {
						e.stopPropagation()
						setIsLightboxOpen(false)
						setSelectedImageIndex(null)
					}}
					onPointerDown={editor.markEventAsHandled}
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						width: '100vw',
						height: '100vh',
						background: 'rgba(0, 0, 0, 0.95)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 10000,
						pointerEvents: 'auto',
					}}
				>
					{/* Close button */}
					<button
						onClick={(e) => {
							e.stopPropagation()
							setIsLightboxOpen(false)
							setSelectedImageIndex(null)
						}}
						style={{
							position: 'absolute',
							top: '20px',
							left: '20px',
							width: '40px',
							height: '40px',
							background: 'rgba(255, 255, 255, 0.1)',
							border: 'none',
							borderRadius: '8px',
							color: 'white',
							fontSize: '24px',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							transition: 'background 0.2s',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
						}}
					>
						×
					</button>

					{/* Image counter */}
					<div style={{
						position: 'absolute',
						top: '30px',
						right: '30px',
						color: 'white',
						fontSize: '14px',
						fontWeight: 500,
					}}>
						{selectedImageIndex + 1} / {node.generatedImages.length}
					</div>

					{/* Main image */}
					<div onClick={(e) => e.stopPropagation()} style={{
						maxWidth: '85vw',
						maxHeight: '85vh',
						display: 'flex',
						flexDirection: 'column',
						gap: '20px',
					}}>
						<img
							src={node.generatedImages[selectedImageIndex]}
							alt={`生成的图片 ${selectedImageIndex + 1}`}
							style={{
								maxWidth: '85vw',
								maxHeight: 'calc(85vh - 100px)',
								objectFit: 'contain',
								borderRadius: '8px',
							}}
						/>

						{/* Thumbnails */}
						{node.generatedImages.length > 1 && (
							<div style={{
								display: 'flex',
								gap: '8px',
								justifyContent: 'center',
								alignItems: 'center',
							}}>
								{node.generatedImages.map((img, idx) => (
									<div
										key={idx}
										onClick={(e) => {
											e.stopPropagation()
											setSelectedImageIndex(idx)
										}}
										style={{
											width: '60px',
											height: '60px',
											borderRadius: '6px',
											overflow: 'hidden',
											cursor: 'pointer',
											border: idx === selectedImageIndex ? '2px solid white' : '2px solid transparent',
											opacity: idx === selectedImageIndex ? 1 : 0.6,
											transition: 'all 0.2s',
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.opacity = '1'
										}}
										onMouseLeave={(e) => {
											if (idx !== selectedImageIndex) {
												e.currentTarget.style.opacity = '0.6'
											}
										}}
									>
										<img
											src={img}
											alt={`缩略图 ${idx + 1}`}
											style={{
												width: '100%',
												height: '100%',
												objectFit: 'cover',
											}}
										/>
									</div>
								))}
							</div>
						)}

						{/* Action buttons */}
						<div style={{
							display: 'flex',
							gap: '12px',
							justifyContent: 'center',
						}}>
							<button
								onClick={(e) => {
									e.stopPropagation()
									const imageUrl = node.generatedImages[selectedImageIndex]
									setIsLightboxOpen(false)
									setSelectedImageIndex(null)
									handleContinueCreation(imageUrl)
								}}
								onPointerDown={editor.markEventAsHandled}
								style={{
									padding: '10px 20px',
									background: '#3b82f6',
									border: 'none',
									borderRadius: '8px',
									color: 'white',
									fontSize: '14px',
									fontWeight: 600,
									cursor: 'pointer',
									transition: 'background 0.2s',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = '#2563eb'
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = '#3b82f6'
								}}
							>
								继续创作
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

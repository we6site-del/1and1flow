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
	ProgressBar,
} from './shared'

// 视频生成节点的数据模型 - UI的变化 = 状态的变化
export type VideoGenerationNode = T.TypeOf<typeof VideoGenerationNode>
export const VideoGenerationNode = T.object({
	type: T.literal('videoGeneration'),
	model: T.string,
	duration: T.number,
	aspectRatio: T.string,
	generatedVideoUrl: T.string,
	isGenerating: T.boolean,
	progress: T.number,
})

const VIDEO_MODELS = [
	{ id: 'runway-gen4', name: 'Runway Gen-4', logo: '🎬' },
	{ id: 'minimax', name: 'Minimax Video', logo: '📹' },
	{ id: 'kling', name: 'Kling', logo: '✨' },
	{ id: 'veo3', name: 'Veo 3', logo: '🎥' },
	{ id: 'luma-ray2', name: 'Luma Ray 2', logo: '💫' },
]

const VIDEO_ASPECT_RATIOS = [
	{ id: '16:9', name: '16:9 横屏', width: 1920, height: 1080 },
	{ id: '9:16', name: '9:16 竖屏', width: 1080, height: 1920 },
	{ id: '1:1', name: '1:1 方形', width: 1080, height: 1080 },
	{ id: '4:3', name: '4:3 传统', width: 1440, height: 1080 },
]

export class VideoGenerationNodeDefinition extends NodeDefinition<VideoGenerationNode> {
	static type = 'videoGeneration'
	static validator = VideoGenerationNode
	title = '视频'
	heading = '视频'
	icon = (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
			<rect x="2.5" y="3.5" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
			<path d="M6.5 5.5L10.5 8L6.5 10.5V5.5Z" fill="currentColor"/>
		</svg>
	)

	getDefault(): VideoGenerationNode {
		return {
			type: 'videoGeneration',
			model: 'runway-gen4',
			duration: 5,
			aspectRatio: '16:9',
			generatedVideoUrl: '',
			isGenerating: false,
			progress: 0,
		}
	}

	getBodyHeightPx(_shape: NodeShape, node: VideoGenerationNode) {
		// 大内容区域(280px) + 参数区域(90px) + 进度条(20px) + Run按钮(50px)
		return 280 + 90 + (node.isGenerating ? 20 : 0) + 50
	}

	getPorts(_shape: NodeShape, node: VideoGenerationNode): Record<string, ShapePort> {
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
			video: {
				id: 'video',
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

	async execute(shape: NodeShape, node: VideoGenerationNode, inputs: InputValues): Promise<ExecutionResult> {
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
				} else if (inputNode.type === 'imageGeneration') {
					inputImages = inputNode.generatedImages || []
					inputPrompt = '基于生成的图片创建视频'
				}
			}
		}

		console.log('生成视频使用的提示词:', inputPrompt)
		console.log('参考图片数量:', inputImages.length)

		for (let i = 0; i <= 100; i += 10) {
			await sleep(200)
			this.editor.updateShape<NodeShape>({
				id: shape.id,
				type: 'node',
				props: {
					node: {
						...node,
						progress: i,
					},
				},
			})
		}

		// Use a working MP4 video URL
		const mockVideoUrl = `https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4`

		this.editor.updateShape<NodeShape>({
			id: shape.id,
			type: 'node',
			props: {
				node: {
					...node,
					generatedVideoUrl: mockVideoUrl,
					isGenerating: false,
					progress: 100,
				},
			},
		})

		return {
			output: 1,
		}
	}

	getOutputInfo(shape: NodeShape, node: VideoGenerationNode): InfoValues {
		return {
			output: {
				value: node.generatedVideoUrl ? 1 : 0,
				isOutOfDate: shape.props.isOutOfDate,
			},
		}
	}

	Component = VideoGenerationNodeComponent
}

export function VideoGenerationNodeComponent({ shape, node }: NodeComponentProps<VideoGenerationNode>) {
	const editor = useEditor()

	const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		editor.setSelectedShapes([shape.id])
		updateNode<VideoGenerationNode>(
			editor,
			shape,
			(node) => ({ ...node, model: e.target.value }),
			false
		)
	}

	const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		editor.setSelectedShapes([shape.id])
		updateNode<VideoGenerationNode>(
			editor,
			shape,
			(node) => ({ ...node, duration: parseInt(e.target.value) }),
			false
		)
	}

	const handleAspectRatioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		editor.setSelectedShapes([shape.id])
		updateNode<VideoGenerationNode>(
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
					generatedVideoUrl: '',
					isGenerating: false,
					progress: 0,
				},
			},
		})
	}

	const handleContinueCreation = (videoUrl: string) => {
		const currentBounds = editor.getShapePageBounds(shape.id)
		if (!currentBounds) return

		const textNodeId = editor.createShapeId()
		const textY = currentBounds.y + currentBounds.h + 100

		const thumbnailUrl = videoUrl.replace('/video/', '/thumbnail/') || videoUrl

		editor.createShape({
			id: textNodeId,
			type: 'node',
			x: currentBounds.x,
			y: textY,
			props: {
				node: {
					type: 'textInput',
					text: '',
					images: [thumbnailUrl],
				},
			},
		})

		const newVideoNodeId = editor.createShapeId()
		editor.createShape({
			id: newVideoNodeId,
			type: 'node',
			x: currentBounds.x + 350,
			y: textY,
			props: {
				node: {
					type: 'videoGeneration',
					model: node.model,
					duration: node.duration,
					aspectRatio: node.aspectRatio,
					generatedVideoUrl: '',
					isGenerating: false,
					progress: 0,
				},
			},
		})

		editor.createBinding({
			type: 'connection',
			fromId: textNodeId,
			toId: newVideoNodeId,
			props: {
				terminal: 'start',
				isPrecise: false,
			},
		})

		editor.select(textNodeId, newVideoNodeId)

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
		updateNode<VideoGenerationNode>(
			editor,
			shape,
			(node) => ({ ...node, isGenerating: true, progress: 0 }),
			false
		)

		await sleep(100)
		const def = new VideoGenerationNodeDefinition(editor)
		await def.execute(shape, node, {})
	}

	// Get current model info
	const currentModel = VIDEO_MODELS.find(m => m.id === node.model) || VIDEO_MODELS[0]

	return (
		<div className="VideoGenerationNode" style={{
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
				Video
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
				{node.generatedVideoUrl ? (
					<div style={{
						width: '100%',
						height: '280px',
						borderRadius: '8px',
						overflow: 'hidden',
						border: '1px solid rgba(0, 0, 0, 0.08)',
						background: '#000',
					}}>
						<video
							src={node.generatedVideoUrl}
							controls
							autoPlay={false}
							preload="metadata"
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'contain',
								display: 'block',
							}}
						/>
					</div>
				) : (
					<div style={{ height: '280px' }}>
						<PlaceholderImage
							height={280}
							text={node.isGenerating ? `正在生成... ${node.progress}%` : '未生成'}
						/>
					</div>
				)}
			</div>

			{/* 参数区域 */}
			<div style={{ padding: '12px', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: node.isGenerating ? '10px' : '0' }}>
					<div>
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
							{VIDEO_ASPECT_RATIOS.map((ratio) => (
								<option key={ratio.id} value={ratio.id}>
									{ratio.name}
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
							时长
						</label>
						<select
							value={node.duration}
							onChange={handleDurationChange}
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
							{[5, 10, 15, 20].map((duration) => (
								<option key={duration} value={duration}>
									{duration}秒
								</option>
							))}
						</select>
					</div>
				</div>

				{/* 进度条 */}
				{node.isGenerating && (
					<div style={{ marginBottom: '10px' }}>
						<ProgressBar progress={node.progress} height={6} />
					</div>
				)}
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

			{/* 继续创作按钮（当有生成的视频时显示） */}
			{node.generatedVideoUrl && !node.isGenerating && (
				<div style={{ padding: '0 12px 12px 12px', borderTop: '1px solid rgba(0, 0, 0, 0.06)', paddingTop: '12px' }}>
					<button
						onClick={(e) => {
							e.stopPropagation()
							handleContinueCreation(node.generatedVideoUrl)
						}}
						onPointerDown={editor.markEventAsHandled}
						style={{
							width: '100%',
							padding: '8px',
							background: '#ffffff',
							border: '1px solid rgba(0, 0, 0, 0.12)',
							borderRadius: '8px',
							color: 'rgba(0, 0, 0, 0.9)',
							fontSize: '12px',
							fontWeight: 600,
							cursor: 'pointer',
							transition: 'all 0.2s ease',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '6px',
							pointerEvents: 'auto',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'
							e.currentTarget.style.borderColor = '#3b82f6'
							e.currentTarget.style.color = '#3b82f6'
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = '#ffffff'
							e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)'
							e.currentTarget.style.color = 'rgba(0, 0, 0, 0.9)'
						}}
					>
						<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
							<path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
						</svg>
						<span>继续创作</span>
					</button>
				</div>
			)}
		</div>
	)
}

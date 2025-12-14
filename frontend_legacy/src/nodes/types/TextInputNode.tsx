import { T, useEditor } from 'tldraw'
import { NODE_HEADER_HEIGHT_PX, NODE_ROW_HEIGHT_PX, NODE_WIDTH_PX } from '../../constants'
import { ShapePort } from '../../ports/Port'
import { NodeShape } from '../NodeShapeUtil'
import {
	ExecutionResult,
	InfoValues,
	NodeComponentProps,
	NodeDefinition,
	NodeRow,
	updateNode,
	NodeMenu,
} from './shared'

// 定义节点的数据模型 - 所有状态都存储在这里
export type TextInputNode = T.TypeOf<typeof TextInputNode>
export const TextInputNode = T.object({
	type: T.literal('textInput'),
	text: T.string,
	images: T.arrayOf(T.string), // 支持多张图片
})

export class TextInputNodeDefinition extends NodeDefinition<TextInputNode> {
	static type = 'textInput'
	static validator = TextInputNode
	title = '输入'
	heading = '输入'
	icon = (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
			<path d="M3 4.5C3 3.67157 3.67157 3 4.5 3H11.5C12.3284 3 13 3.67157 13 4.5V8.5C13 9.32843 12.3284 10 11.5 10H4.5C3.67157 10 3 9.32843 3 8.5V4.5Z" stroke="currentColor" strokeWidth="1.3"/>
			<path d="M5 6H11M5 8H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
			<path d="M6 10V11.5C6 12.3284 6.67157 13 7.5 13H8.5C9.32843 13 10 12.3284 10 11.5V10" stroke="currentColor" strokeWidth="1.3"/>
		</svg>
	)

	getDefault(): TextInputNode {
		return {
			type: 'textInput',
			text: '',
			images: [],
		}
	}

	getBodyHeightPx(_shape: NodeShape, node: TextInputNode) {
		// 根据文本内容计算高度
		const lineCount = node.text ? node.text.split('\n').length : 1
		const textHeight = Math.max(80, Math.min(300, lineCount * 20 + 40)) // 最小80px，最大300px

		const uploadHeight = 60 // 上传按钮区域
		const imagesHeight = node.images.length > 0 ? Math.ceil(node.images.length / 3) * 90 + 8 : 0
		return textHeight + uploadHeight + imagesHeight
	}

	getPorts(_shape: NodeShape, node: TextInputNode): Record<string, ShapePort> {
		const bodyHeight = this.getBodyHeightPx(_shape, node)
		return {
			output: {
				id: 'output',
				x: NODE_WIDTH_PX,
				y: NODE_HEADER_HEIGHT_PX + bodyHeight * 0.4,
				terminal: 'start',
			},
		}
	}

	async execute(_shape: NodeShape, node: TextInputNode): Promise<ExecutionResult> {
		return {
			output: node.text.length + node.images.length,
		}
	}

	getOutputInfo(shape: NodeShape, node: TextInputNode): InfoValues {
		return {
			output: {
				value: node.text.length + node.images.length,
				isOutOfDate: shape.props.isOutOfDate,
			},
		}
	}

	Component = TextInputNodeComponent
}

export function TextInputNodeComponent({ shape, node }: NodeComponentProps<TextInputNode>) {
	const editor = useEditor()

	const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		updateNode<TextInputNode>(editor, shape, (node) => ({ ...node, text: e.target.value }), false)
	}

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (!files || files.length === 0) return

		// 限制最多3张图片
		const remainingSlots = 3 - node.images.length
		if (remainingSlots <= 0) {
			alert('最多只能上传3张图片')
			return
		}

		const newImages: string[] = []
		const filesToProcess = Math.min(files.length, remainingSlots)

		for (let i = 0; i < filesToProcess; i++) {
			const file = files[i]
			const reader = new FileReader()

			await new Promise<void>((resolve) => {
				reader.onload = (event) => {
					const imageUrl = event.target?.result as string
					newImages.push(imageUrl)
					resolve()
				}
				reader.readAsDataURL(file)
			})
		}

		updateNode<TextInputNode>(
			editor,
			shape,
			(node) => ({ ...node, images: [...node.images, ...newImages] }),
			false
		)
	}

	const handleRemoveImage = (index: number) => {
		updateNode<TextInputNode>(
			editor,
			shape,
			(node) => ({ ...node, images: node.images.filter((_, i) => i !== index) }),
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
				},
			},
		})
	}

	const lineCount = node.text ? node.text.split('\n').length : 1
	const textareaHeight = Math.max(60, Math.min(280, lineCount * 20 + 20))

	return (
		<div className="TextInputNode" style={{ padding: '8px', position: 'relative' }}>
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

			<div style={{ marginBottom: '8px' }}>
				<textarea
					value={node.text}
					onChange={handleTextChange}
					placeholder="输入内容即可开始创作"
					onFocus={(e) => {
						e.stopPropagation()
						editor.setSelectedShapes([shape.id])
					}}
					onClick={(e) => e.stopPropagation()}
					onPointerDown={(e) => e.stopPropagation()}
					style={{
						width: '100%',
						height: `${textareaHeight}px`,
						padding: '8px',
						border: '1px solid rgba(0, 0, 0, 0.1)',
						borderRadius: '6px',
						background: 'rgba(0, 0, 0, 0.02)',
						color: 'rgba(0, 0, 0, 0.9)',
						fontSize: '12px',
						resize: 'none',
						fontFamily: 'inherit',
						outline: 'none',
						lineHeight: '1.6',
					}}
				/>
			</div>

			<div style={{ borderTop: '1px dashed rgba(0, 0, 0, 0.1)', paddingTop: '8px' }}>
				<label
					style={{
						display: node.images.length >= 3 ? 'none' : 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: '6px',
						cursor: 'pointer',
						padding: '10px',
						border: '1px dashed rgba(0, 0, 0, 0.2)',
						borderRadius: '6px',
						fontSize: '12px',
						color: 'rgba(0, 0, 0, 0.5)',
						transition: 'all 0.2s ease',
						pointerEvents: 'auto',
					}}
					onClick={(e) => e.stopPropagation()}
					onPointerDown={(e) => e.stopPropagation()}
					onMouseEnter={(e) => {
						e.currentTarget.style.borderColor = '#3b82f6'
						e.currentTarget.style.color = '#3b82f6'
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)'
						e.currentTarget.style.color = 'rgba(0, 0, 0, 0.5)'
					}}
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
					</svg>
					上传图片 ({node.images.length}/3)
					<input
						type="file"
						accept="image/*"
						multiple
						onChange={handleImageUpload}
						onClick={(e) => e.stopPropagation()}
						onPointerDown={(e) => e.stopPropagation()}
						style={{ display: 'none' }}
					/>
				</label>

				{node.images.length > 0 && (
					<div style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(3, 1fr)',
						gap: '6px',
						marginTop: '8px',
					}}>
						{node.images.map((imageUrl, index) => (
							<div
								key={index}
								style={{
									position: 'relative',
									borderRadius: '6px',
									overflow: 'hidden',
									aspectRatio: '1',
								}}
							>
								<img
									src={imageUrl}
									alt={`上传的图片 ${index + 1}`}
									style={{
										width: '100%',
										height: '100%',
										objectFit: 'cover',
									}}
								/>
								<button
									onClick={(e) => {
										e.stopPropagation()
										handleRemoveImage(index)
									}}
									onPointerDown={(e) => e.stopPropagation()}
									style={{
										position: 'absolute',
										top: '4px',
										right: '4px',
										width: '20px',
										height: '20px',
										padding: 0,
										border: 'none',
										borderRadius: '4px',
										background: 'rgba(0, 0, 0, 0.4)',
										color: 'white',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: '12px',
										transition: 'all 0.2s ease',
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.background = '#ff3333'
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'
									}}
								>
									×
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

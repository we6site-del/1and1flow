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
} from './shared'

// 文本生成节点的数据模型
export type TextGenerationNode = T.TypeOf<typeof TextGenerationNode>
export const TextGenerationNode = T.object({
	type: T.literal('textGeneration'),
	model: T.string,
	prompt: T.string,
	temperature: T.number,
	maxTokens: T.number,
	generatedText: T.string,
	isGenerating: T.boolean,
})

const TEXT_MODELS = [
	'GPT-4o',
	'GPT-4o Mini',
	'Claude 3.5 Sonnet',
	'Gemini 2.0 Flash',
	'DeepSeek Chat',
]

export class TextGenerationNodeDefinition extends NodeDefinition<TextGenerationNode> {
	static type = 'textGeneration'
	static validator = TextGenerationNode
	title = '文本生成'
	heading = '文本生成'
	icon = (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
			<path d="M3 3H13M3 6H11M3 9H13M3 12H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
		</svg>
	)

	getDefault(): TextGenerationNode {
		return {
			type: 'textGeneration',
			model: 'GPT-4o',
			prompt: '',
			temperature: 0.7,
			maxTokens: 500,
			generatedText: '',
			isGenerating: false,
		}
	}

	getBodyHeightPx(_shape: NodeShape, node: TextGenerationNode) {
		const baseHeight = NODE_ROW_HEIGHT_PX * 5
		const textHeight = node.generatedText ? 120 : 0
		return baseHeight + textHeight
	}

	getPorts(_shape: NodeShape, node: TextGenerationNode): Record<string, ShapePort> {
		const bodyHeight = this.getBodyHeightPx(_shape, node)
		return {
			input: {
				id: 'input',
				x: 0,
				y: NODE_HEADER_HEIGHT_PX + 50,
				terminal: 'end',
			},
			output: {
				id: 'output',
				x: NODE_WIDTH_PX,
				y: NODE_HEADER_HEIGHT_PX + bodyHeight - 70,
				terminal: 'start',
			},
		}
	}

	async execute(shape: NodeShape, node: TextGenerationNode, inputs: InputValues): Promise<ExecutionResult> {
		// 模拟文本生成过程
		await sleep(2000)

		const mockText = `这是由 ${node.model} 生成的示例文本。\n\n提示词：${node.prompt || '（无）'}\n\n温度：${node.temperature}\n最大令牌：${node.maxTokens}\n\n实际应用中，这里会调用真实的 AI API 来生成文本内容。`

		this.editor.updateShape<NodeShape>({
			id: shape.id,
			type: 'node',
			props: {
				node: {
					...node,
					generatedText: mockText,
					isGenerating: false,
				},
			},
		})

		return {
			output: 1,
		}
	}

	getOutputInfo(shape: NodeShape, node: TextGenerationNode): InfoValues {
		return {
			output: {
				value: node.generatedText ? 1 : 0,
				isOutOfDate: shape.props.isOutOfDate,
			},
		}
	}

	Component = TextGenerationNodeComponent
}

export function TextGenerationNodeComponent({ shape, node }: NodeComponentProps<TextGenerationNode>) {
	const editor = useEditor()

	const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		editor.setSelectedShapes([shape.id])
		updateNode<TextGenerationNode>(
			editor,
			shape,
			(node) => ({ ...node, model: e.target.value }),
			false
		)
	}

	const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		updateNode<TextGenerationNode>(
			editor,
			shape,
			(node) => ({ ...node, prompt: e.target.value }),
			false
		)
	}

	const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		updateNode<TextGenerationNode>(
			editor,
			shape,
			(node) => ({ ...node, temperature: parseFloat(e.target.value) }),
			false
		)
	}

	const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		updateNode<TextGenerationNode>(
			editor,
			shape,
			(node) => ({ ...node, maxTokens: parseInt(e.target.value) }),
			false
		)
	}

	const handleExecute = async () => {
		editor.setSelectedShapes([shape.id])
		updateNode<TextGenerationNode>(
			editor,
			shape,
			(node) => ({ ...node, isGenerating: true }),
			false
		)

		await sleep(100)
		const def = new TextGenerationNodeDefinition(editor)
		await def.execute(shape, node, {})
	}

	return (
		<div className="TextGenerationNode" style={{ padding: '8px', fontSize: '12px' }}>
			<NodeRow>
				<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
					<label style={{ color: 'rgba(0, 0, 0, 0.5)', minWidth: '40px' }}>模型</label>
					<select
						value={node.model}
						onChange={handleModelChange}
						onPointerDown={editor.markEventAsHandled}
						style={{
							flex: 1,
							padding: '4px 8px',
							background: 'rgba(245, 245, 245, 0.8)',
							border: '1px solid rgba(0, 0, 0, 0.1)',
							borderRadius: '4px',
							color: '#333',
							fontSize: '11px',
						}}
					>
						{TEXT_MODELS.map((model) => (
							<option key={model} value={model}>
								{model}
							</option>
						))}
					</select>
				</div>
			</NodeRow>

			<div style={{ marginBottom: '8px' }}>
				<label style={{ color: 'rgba(0, 0, 0, 0.5)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>提示词</label>
				<textarea
					value={node.prompt}
					onChange={handlePromptChange}
					onPointerDown={editor.markEventAsHandled}
					onClick={(e) => e.stopPropagation()}
					onFocus={(e) => {
						e.stopPropagation()
						editor.setSelectedShapes([shape.id])
					}}
					placeholder="输入生成文本的提示词..."
					style={{
						width: '100%',
						minHeight: '50px',
						padding: '6px 8px',
						background: 'rgba(245, 245, 245, 0.8)',
						border: '1px solid rgba(0, 0, 0, 0.1)',
						borderRadius: '4px',
						color: '#333',
						fontSize: '11px',
						resize: 'none',
						fontFamily: 'inherit',
						outline: 'none',
						boxSizing: 'border-box',
					}}
				/>
			</div>

			<NodeRow>
				<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
					<label style={{ color: 'rgba(0, 0, 0, 0.5)', minWidth: '50px', fontSize: '11px' }}>
						温度: {node.temperature}
					</label>
					<input
						type="range"
						min="0"
						max="2"
						step="0.1"
						value={node.temperature}
						onChange={handleTemperatureChange}
						onPointerDown={editor.markEventAsHandled}
						style={{ flex: 1 }}
					/>
				</div>
			</NodeRow>

			<NodeRow>
				<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
					<label style={{ color: 'rgba(0, 0, 0, 0.5)', minWidth: '50px', fontSize: '11px' }}>
						令牌: {node.maxTokens}
					</label>
					<input
						type="range"
						min="100"
						max="2000"
						step="100"
						value={node.maxTokens}
						onChange={handleMaxTokensChange}
						onPointerDown={editor.markEventAsHandled}
						style={{ flex: 1 }}
					/>
				</div>
			</NodeRow>

			<NodeRow>
				<button
					onClick={handleExecute}
					onPointerDown={editor.markEventAsHandled}
					disabled={node.isGenerating}
					style={{
						width: '100%',
						padding: '8px',
						background: node.isGenerating ? 'rgba(0, 0, 0, 0.05)' : 'var(--ai-accent)',
						border: '1px solid rgba(0, 0, 0, 0.1)',
						borderRadius: '4px',
						color: node.isGenerating ? 'rgba(0, 0, 0, 0.3)' : 'white',
						fontSize: '12px',
						cursor: node.isGenerating ? 'not-allowed' : 'pointer',
						fontWeight: '500',
						transition: 'all 0.2s ease',
					}}
				>
					{node.isGenerating ? '生成中...' : '生成文本 ✨'}
				</button>
			</NodeRow>

			{node.generatedText && (
				<div style={{ marginTop: '8px' }}>
					<div
						style={{
							padding: '8px',
							background: 'rgba(245, 245, 245, 0.5)',
							border: '1px solid rgba(0, 0, 0, 0.1)',
							borderRadius: '4px',
							fontSize: '11px',
							lineHeight: '1.5',
							color: '#333',
							maxHeight: '120px',
							overflowY: 'auto',
							whiteSpace: 'pre-wrap',
							wordWrap: 'break-word',
						}}
					>
						{node.generatedText}
					</div>
				</div>
			)}
		</div>
	)
}

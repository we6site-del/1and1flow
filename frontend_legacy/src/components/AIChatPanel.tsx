import { useState, useRef, useEffect } from 'react'
import { useEditor } from 'tldraw'
import { getProviderFromModel, type AIMessage as AIProviderMessage } from '../lib/ai-providers'
import { createVariationNodes, analyzeCanvasSelection, getCanvasState } from '../lib/aiTools'

// AI 模型列表
const AI_MODELS = [
	{ id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', icon: '🤖', supportsVision: true },
	{ id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', icon: '🧠', supportsVision: false },
	{ id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'Google', icon: '✨', supportsVision: true },
	{ id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', icon: '⚡', supportsVision: true },
	{ id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek', icon: '🔮', supportsVision: false },
]

// 消息类型
interface Message {
	id: string
	role: 'user' | 'assistant'
	content: string
	timestamp: Date
	images?: string[]
}

// 对话历史类型
interface Conversation {
	id: string
	title: string
	messages: Message[]
	createdAt: Date
	updatedAt: Date
}

export function AIChatPanel() {
	const editor = useEditor()
	const [isOpen, setIsOpen] = useState(true)
	const [selectedModel, setSelectedModel] = useState('gpt-4o')
	const [input, setInput] = useState('')
	const [messages, setMessages] = useState<Message[]>([])
	const [conversations, setConversations] = useState<Conversation[]>([])
	const [currentConversationId, setCurrentConversationId] = useState<string>('')
	const [isLoading, setIsLoading] = useState(false)
	const [uploadedImages, setUploadedImages] = useState<string[]>([])
	const [webSearchEnabled, setWebSearchEnabled] = useState(false)

	// UI 状态
	const [showModelSelector, setShowModelSelector] = useState(false)
	const [showHistory, setShowHistory] = useState(false)
	const [showShareDialog, setShowShareDialog] = useState(false)

	const messagesEndRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	// 滚动到底部
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	// 创建新对话
	const createNewConversation = () => {
		const newConv: Conversation = {
			id: Date.now().toString(),
			title: '新对话',
			messages: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		setConversations([newConv, ...conversations])
		setCurrentConversationId(newConv.id)
		setMessages([])
		setShowHistory(false)
	}

	// 发送消息
	const sendMessage = async () => {
		if (!input.trim() && uploadedImages.length === 0) return

		const userMessage: Message = {
			id: Date.now().toString(),
			role: 'user',
			content: input,
			timestamp: new Date(),
			images: uploadedImages.length > 0 ? [...uploadedImages] : undefined,
		}

		const newMessages = [...messages, userMessage]
		setMessages(newMessages)
		setInput('')
		setUploadedImages([])
		setIsLoading(true)

		try {
			// 检查是否配置了API密钥
			const hasApiKey = import.meta.env.VITE_OPENAI_API_KEY ||
							  import.meta.env.VITE_ANTHROPIC_API_KEY ||
							  import.meta.env.VITE_GOOGLE_API_KEY ||
							  import.meta.env.VITE_DEEPSEEK_API_KEY

			let responseContent: string

			if (hasApiKey) {
				// 使用真实 AI API
				const { provider, model } = getProviderFromModel(selectedModel)

				const apiMessages: AIProviderMessage[] = newMessages.map(msg => ({
					role: msg.role,
					content: msg.content,
					images: msg.images
				}))

				// 添加系统提示（根据 MASTER_PLAN.md Phase 4）
				const systemPrompt = `你是一位高级服装设计师，拥有丰富的面料学、剪裁术语和流行趋势知识。你可以帮助用户：

1. 分析画布上的设计作品
2. 创建设计变体节点
3. 提供专业的设计建议

可用工具：
- create_variation_nodes(count, style): 在画布上创建多个变体节点
- analyze_canvas_selection(): 分析当前选中的节点图片

当前画布状态：
${getCanvasState(editor)}`

				apiMessages.unshift({
					role: 'system',
					content: systemPrompt
				})

				// 检查是否需要调用工具
				const userMessage = input.toLowerCase()
				let toolResult: string | null = null

				if (userMessage.includes('创建变体') || userMessage.includes('create variation')) {
					const countMatch = userMessage.match(/(\d+)/)
					const count = countMatch ? parseInt(countMatch[1]) : 3
					const styleMatch = userMessage.match(/style[:\s]+([^,]+)/i)
					const style = styleMatch ? styleMatch[1].trim() : undefined
					
					toolResult = await createVariationNodes(editor, count, style)
				} else if (userMessage.includes('分析') || userMessage.includes('analyze')) {
					toolResult = await analyzeCanvasSelection(editor)
				}

				if (toolResult) {
					// 将工具结果添加到消息中
					apiMessages.push({
						role: 'assistant',
						content: `工具执行结果：\n${toolResult}\n\n请基于这个结果继续回答用户的问题。`
					})
				}

				responseContent = await provider.chat(apiMessages, {
					apiKey: '',
					model: model
				})
			} else {
				// 模拟 AI 响应（开发模式）
				await new Promise(resolve => setTimeout(resolve, 1500))
				const modelInfo = AI_MODELS.find(m => m.id === selectedModel)
				responseContent = `✨ 使用 ${modelInfo?.name} 处理您的请求\n\n您的消息: "${input}"\n\n${webSearchEnabled ? '🌐 网络搜索已启用\n\n' : ''}这是一个模拟响应。要使用真实的AI功能，请配置环境变量中的API密钥：\n\n- VITE_OPENAI_API_KEY\n- VITE_ANTHROPIC_API_KEY\n- VITE_GOOGLE_API_KEY\n- VITE_DEEPSEEK_API_KEY\n\n详情请查看 .env.example 文件。`
			}

			const aiMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: 'assistant',
				content: responseContent,
				timestamp: new Date(),
			}

			setMessages(prev => [...prev, aiMessage])
		} catch (error) {
			console.error('AI API Error:', error)
			const errorMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: 'assistant',
				content: `抱歉，发生错误：${error instanceof Error ? error.message : '未知错误'}\n\n请检查API密钥配置是否正确。`,
				timestamp: new Date(),
			}
			setMessages(prev => [...prev, errorMessage])
		} finally {
			setIsLoading(false)
		}
	}

	// 处理图片上传
	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (!files || files.length === 0) return

		const newImages: string[] = []
		for (let i = 0; i < files.length; i++) {
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
		setUploadedImages([...uploadedImages, ...newImages])
	}

	// 移除上传的图片
	const removeUploadedImage = (index: number) => {
		setUploadedImages(uploadedImages.filter((_, i) => i !== index))
	}

	// 切换到历史对话
	const loadConversation = (convId: string) => {
		const conv = conversations.find(c => c.id === convId)
		if (conv) {
			setCurrentConversationId(convId)
			setMessages(conv.messages)
			setShowHistory(false)
		}
	}

	// 分享对话
	const shareConversation = () => {
		const shareUrl = `${window.location.origin}/share/${currentConversationId}`
		navigator.clipboard.writeText(shareUrl)
		alert('对话链接已复制到剪贴板！')
		setShowShareDialog(false)
	}

	if (!isOpen) {
		return (
			<button
				className="ai-chat-toggle"
				onClick={() => setIsOpen(true)}
				title="打开AI助手"
			>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
					<path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor"/>
				</svg>
			</button>
		)
	}

	return (
		<div className="ai-chat-panel">
			{/* 顶部工具栏 */}
			<div className="ai-chat-toolbar">
				<button className="ai-chat-toolbar-btn" onClick={createNewConversation} title="新建对话">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
						<path d="M10 7V13M7 10H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
					</svg>
				</button>
				<button className="ai-chat-toolbar-btn" onClick={() => setShowHistory(!showHistory)} title="历史">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path d="M10 5V10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
						<path d="M4 10C4 6.686 6.686 4 10 4C13.314 4 16 6.686 16 10C16 13.314 13.314 16 10 16C6.686 16 4 13.314 4 10Z" stroke="currentColor" strokeWidth="1.5"/>
					</svg>
				</button>
				<button className="ai-chat-toolbar-btn" onClick={() => setShowShareDialog(!showShareDialog)} title="分享">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<circle cx="15" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
						<circle cx="5" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
						<circle cx="15" cy="15" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
						<path d="M7.5 11L12.5 14M7.5 9L12.5 6" stroke="currentColor" strokeWidth="1.5"/>
					</svg>
				</button>
				<button className="ai-chat-toolbar-btn" onClick={() => fileInputRef.current?.click()} title="文件">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path d="M6 3H11L15 7V15C15 15.5523 14.5523 16 14 16H6C5.44772 16 5 15.5523 5 15V4C5 3.44772 5.44772 3 6 3Z" stroke="currentColor" strokeWidth="1.5"/>
						<path d="M11 3V7H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</button>
				<button className="ai-chat-toolbar-btn" onClick={() => setIsOpen(false)} title="隐藏">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
					</svg>
				</button>
			</div>

			{/* 历史对话面板 */}
			{showHistory && (
				<div className="ai-chat-history-panel">
					<h3>对话历史</h3>
					{conversations.length === 0 ? (
						<p className="ai-chat-empty">暂无历史对话</p>
					) : (
						<div className="ai-chat-history-list">
							{conversations.map(conv => (
								<div
									key={conv.id}
									className={`ai-chat-history-item ${conv.id === currentConversationId ? 'active' : ''}`}
									onClick={() => loadConversation(conv.id)}
								>
									<h4>{conv.title}</h4>
									<p>{conv.messages.length} 条消息</p>
									<span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* 分享对话框 */}
			{showShareDialog && (
				<div className="ai-chat-share-dialog">
					<h3>分享对话</h3>
					<p>点击复制链接分享此对话</p>
					<button onClick={shareConversation} className="ai-chat-share-btn">
						复制链接
					</button>
				</div>
			)}

			{/* 主聊天区域 */}
			<div className="ai-chat-content">
				{messages.length === 0 ? (
					<div className="ai-chat-welcome">
						<div className="ai-chat-logo">
							<svg width="48" height="48" viewBox="0 0 48 48" fill="none">
								<circle cx="24" cy="24" r="22" fill="black"/>
								<circle cx="17" cy="19" r="3" fill="white"/>
								<circle cx="31" cy="19" r="3" fill="white"/>
								<path d="M17 29C17 29 20 32 24 32C28 32 31 29 31 29" stroke="white" strokeWidth="3" strokeLinecap="round"/>
							</svg>
						</div>
						<h2>Hi Hua Weng,</h2>
						<p>What are we creating today?</p>
					</div>
				) : (
					<div className="ai-chat-messages">
						{messages.map((msg) => (
							<div key={msg.id} className={`ai-chat-message ${msg.role}`}>
								<div className="ai-chat-message-content">
									{msg.images && msg.images.length > 0 && (
										<div className="ai-chat-message-images">
											{msg.images.map((img, idx) => (
												<img key={idx} src={img} alt="上传的图片" />
											))}
										</div>
									)}
									<p>{msg.content}</p>
								</div>
								<span className="ai-chat-message-time">
									{msg.timestamp.toLocaleTimeString()}
								</span>
							</div>
						))}
						{isLoading && (
							<div className="ai-chat-message assistant">
								<div className="ai-chat-message-content">
									<div className="ai-chat-typing">
										<span></span>
										<span></span>
										<span></span>
									</div>
								</div>
							</div>
						)}
						<div ref={messagesEndRef} />
					</div>
				)}
			</div>

			{/* 上传的图片预览 */}
			{uploadedImages.length > 0 && (
				<div className="ai-chat-uploaded-images">
					{uploadedImages.map((img, idx) => (
						<div key={idx} className="ai-chat-uploaded-image">
							<img src={img} alt="待发送" />
							<button onClick={() => removeUploadedImage(idx)}>×</button>
						</div>
					))}
				</div>
			)}

			{/* 输入区域 */}
			<div className="ai-chat-input-area">
				<textarea
					className="ai-chat-input"
					placeholder='Start with an idea, or type "@" to mention'
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault()
							sendMessage()
						}
					}}
					rows={3}
				/>
				<div className="ai-chat-actions">
					<div className="ai-chat-actions-left">
						<button
							className="ai-chat-action-btn"
							onClick={() => fileInputRef.current?.click()}
							title="上传图片"
						>
							<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
								<path d="M9 4V14M4 9H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
							</svg>
						</button>
						<button
							className="ai-chat-action-btn"
							onClick={() => setShowModelSelector(!showModelSelector)}
							title="选择模型"
						>
							<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
								<circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/>
								<path d="M12 9C12 10.657 10.657 12 9 12C7.343 12 6 10.657 6 9C6 7.343 7.343 6 9 6C10.657 6 12 7.343 12 9Z" stroke="currentColor" strokeWidth="1.5"/>
							</svg>
						</button>
						<button
							className={`ai-chat-action-btn ${webSearchEnabled ? 'active' : ''}`}
							onClick={() => setWebSearchEnabled(!webSearchEnabled)}
							title="网络搜索"
						>
							<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
								<circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/>
								<path d="M9 3C9 3 6 6 6 9C6 12 9 15 9 15M9 3C9 3 12 6 12 9C12 12 9 15 9 15M3 9H15" stroke="currentColor" strokeWidth="1.5"/>
							</svg>
						</button>
						<button
							className="ai-chat-action-btn"
							onClick={() => setShowModelSelector(!showModelSelector)}
							title="AI模型"
						>
							<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
								<rect x="4" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
								<path d="M4 8H14M8 4V14" stroke="currentColor" strokeWidth="1.5"/>
							</svg>
						</button>
					</div>
					<button
						className="ai-chat-send-btn"
						onClick={sendMessage}
						disabled={!input.trim() && uploadedImages.length === 0}
					>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
							<circle cx="8" cy="8" r="2" fill="white"/>
						</svg>
						<span>Thinking</span>
					</button>
				</div>
			</div>

			{/* 模型选择器 */}
			{showModelSelector && (
				<div className="ai-chat-model-selector">
					<h3>选择 AI 模型</h3>
					<div className="ai-chat-model-list">
						{AI_MODELS.map((model) => (
							<button
								key={model.id}
								className={`ai-chat-model-item ${selectedModel === model.id ? 'active' : ''}`}
								onClick={() => {
									setSelectedModel(model.id)
									setShowModelSelector(false)
								}}
							>
								<span className="ai-chat-model-icon">{model.icon}</span>
								<div className="ai-chat-model-info">
									<h4>{model.name}</h4>
									<p>{model.provider}</p>
								</div>
								{selectedModel === model.id && (
									<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
										<path d="M5 10L8 13L15 6" stroke="var(--ai-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
									</svg>
								)}
							</button>
						))}
					</div>
				</div>
			)}

			{/* 隐藏的文件输入 */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				multiple
				onChange={handleImageUpload}
				style={{ display: 'none' }}
			/>

			{/* 当前选择的模型指示器 */}
			<div className="ai-chat-footer">
				<span className="ai-chat-current-model">
					{AI_MODELS.find(m => m.id === selectedModel)?.icon} {AI_MODELS.find(m => m.id === selectedModel)?.name}
				</span>
				{webSearchEnabled && (
					<span className="ai-chat-web-badge">🌐 网络搜索</span>
				)}
			</div>
		</div>
	)
}

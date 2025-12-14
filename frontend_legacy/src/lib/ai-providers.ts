// AI Provider 接口定义
export interface AIMessage {
	role: 'user' | 'assistant' | 'system'
	content: string
	images?: string[]
}

export interface AIProviderConfig {
	apiKey: string
	baseUrl?: string
	model: string
}

export interface AIProvider {
	name: string
	models: string[]
	chat(messages: AIMessage[], config: AIProviderConfig): Promise<string>
	streamChat?(messages: AIMessage[], config: AIProviderConfig, onChunk: (chunk: string) => void): Promise<void>
}

// OpenAI Provider
export class OpenAIProvider implements AIProvider {
	name = 'OpenAI'
	models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']

	async chat(messages: AIMessage[], config: AIProviderConfig): Promise<string> {
		const apiKey = config.apiKey || import.meta.env.VITE_OPENAI_API_KEY
		if (!apiKey) {
			throw new Error('OpenAI API key not configured')
		}

		try {
			const response = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					model: config.model || 'gpt-4o',
					messages: messages.map(msg => ({
						role: msg.role,
						content: msg.images && msg.images.length > 0 ? [
							{ type: 'text', text: msg.content },
							...msg.images.map(img => ({ type: 'image_url', image_url: { url: img } }))
						] : msg.content
					})),
					temperature: 0.7,
					max_tokens: 2000,
				}),
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error?.message || 'OpenAI API error')
			}

			const data = await response.json()
			return data.choices[0]?.message?.content || '抱歉，未能获取响应。'
		} catch (error) {
			console.error('OpenAI API Error:', error)
			throw error
		}
	}

	async streamChat(messages: AIMessage[], config: AIProviderConfig, onChunk: (chunk: string) => void): Promise<void> {
		const apiKey = config.apiKey || import.meta.env.VITE_OPENAI_API_KEY
		if (!apiKey) {
			throw new Error('OpenAI API key not configured')
		}

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: config.model || 'gpt-4o',
				messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
				temperature: 0.7,
				max_tokens: 2000,
				stream: true,
			}),
		})

		if (!response.ok) {
			throw new Error('OpenAI API error')
		}

		const reader = response.body?.getReader()
		if (!reader) return

		const decoder = new TextDecoder()
		while (true) {
			const { done, value } = await reader.read()
			if (done) break

			const chunk = decoder.decode(value)
			const lines = chunk.split('\n').filter(line => line.trim() !== '')

			for (const line of lines) {
				if (line.startsWith('data: ')) {
					const data = line.slice(6)
					if (data === '[DONE]') continue

					try {
						const json = JSON.parse(data)
						const content = json.choices[0]?.delta?.content
						if (content) {
							onChunk(content)
						}
					} catch (e) {
						// ignore parse errors
					}
				}
			}
		}
	}
}

// Anthropic Provider
export class AnthropicProvider implements AIProvider {
	name = 'Anthropic'
	models = ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229']

	async chat(messages: AIMessage[], config: AIProviderConfig): Promise<string> {
		const apiKey = config.apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY
		if (!apiKey) {
			throw new Error('Anthropic API key not configured')
		}

		try {
			const response = await fetch('https://api.anthropic.com/v1/messages', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': apiKey,
					'anthropic-version': '2023-06-01',
				},
				body: JSON.stringify({
					model: config.model || 'claude-3-5-sonnet-20241022',
					messages: messages.filter(m => m.role !== 'system').map(msg => ({
						role: msg.role,
						content: msg.content
					})),
					system: messages.find(m => m.role === 'system')?.content,
					max_tokens: 2000,
				}),
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error?.message || 'Anthropic API error')
			}

			const data = await response.json()
			return data.content[0]?.text || '抱歉，未能获取响应。'
		} catch (error) {
			console.error('Anthropic API Error:', error)
			throw error
		}
	}
}

// Google Gemini Provider
export class GeminiProvider implements AIProvider {
	name = 'Google'
	models = ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash']

	async chat(messages: AIMessage[], config: AIProviderConfig): Promise<string> {
		const apiKey = config.apiKey || import.meta.env.VITE_GOOGLE_API_KEY
		if (!apiKey) {
			throw new Error('Google API key not configured')
		}

		try {
			const model = config.model || 'gemini-2.0-flash-exp'
			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						contents: messages.filter(m => m.role !== 'system').map(msg => ({
							role: msg.role === 'assistant' ? 'model' : 'user',
							parts: [{ text: msg.content }]
						})),
						generationConfig: {
							temperature: 0.7,
							maxOutputTokens: 2000,
						},
					}),
				}
			)

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error?.message || 'Google API error')
			}

			const data = await response.json()
			return data.candidates[0]?.content?.parts[0]?.text || '抱歉，未能获取响应。'
		} catch (error) {
			console.error('Google API Error:', error)
			throw error
		}
	}
}

// DeepSeek Provider
export class DeepSeekProvider implements AIProvider {
	name = 'DeepSeek'
	models = ['deepseek-chat', 'deepseek-coder']

	async chat(messages: AIMessage[], config: AIProviderConfig): Promise<string> {
		const apiKey = config.apiKey || import.meta.env.VITE_DEEPSEEK_API_KEY
		if (!apiKey) {
			throw new Error('DeepSeek API key not configured')
		}

		try {
			const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					model: config.model || 'deepseek-chat',
					messages: messages.map(msg => ({
						role: msg.role,
						content: msg.content
					})),
					temperature: 0.7,
					max_tokens: 2000,
				}),
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error?.message || 'DeepSeek API error')
			}

			const data = await response.json()
			return data.choices[0]?.message?.content || '抱歉，未能获取响应。'
		} catch (error) {
			console.error('DeepSeek API Error:', error)
			throw error
		}
	}
}

// Provider Factory
export class AIProviderFactory {
	private static providers: Map<string, AIProvider> = new Map([
		['openai', new OpenAIProvider()],
		['anthropic', new AnthropicProvider()],
		['google', new GeminiProvider()],
		['deepseek', new DeepSeekProvider()],
	])

	static getProvider(providerId: string): AIProvider {
		const provider = this.providers.get(providerId)
		if (!provider) {
			throw new Error(`Provider ${providerId} not found`)
		}
		return provider
	}

	static getAllProviders(): AIProvider[] {
		return Array.from(this.providers.values())
	}
}

// Helper function to get provider from model ID
export function getProviderFromModel(modelId: string): { provider: AIProvider; model: string } {
	if (modelId.startsWith('gpt-')) {
		return { provider: AIProviderFactory.getProvider('openai'), model: modelId }
	} else if (modelId.startsWith('claude-')) {
		return { provider: AIProviderFactory.getProvider('anthropic'), model: modelId }
	} else if (modelId.startsWith('gemini-')) {
		return { provider: AIProviderFactory.getProvider('google'), model: modelId }
	} else if (modelId.startsWith('deepseek-')) {
		return { provider: AIProviderFactory.getProvider('deepseek'), model: modelId }
	}

	// Default to OpenAI
	return { provider: AIProviderFactory.getProvider('openai'), model: 'gpt-4o' }
}

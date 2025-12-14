import { useState } from 'react'
import { useUserStore } from '../stores/userStore'
import './AuthModal.css'

interface AuthModalProps {
	isOpen: boolean
	onClose: () => void
	onAuthSuccess: () => void
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
	const { login, register, loginWithGoogle, loginWithGithub, isLoading } = useUserStore()
	const [mode, setMode] = useState<'login' | 'register'>('login')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [fullName, setFullName] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [error, setError] = useState('')
	const [message, setMessage] = useState('')

	if (!isOpen) return null

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setMessage('')

		try {
			await login(email, password)
			setMessage('登录成功！')
			setTimeout(() => {
				onAuthSuccess()
				onClose()
			}, 500)
		} catch (err) {
			setError(err instanceof Error ? err.message : '登录失败')
		}
	}

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setMessage('')

		if (password !== confirmPassword) {
			setError('两次输入的密码不一致')
			return
		}

		if (password.length < 6) {
			setError('密码长度至少为6位')
			return
		}

		try {
			await register(email, password, fullName)
			setMessage('注册成功！欢迎加入！')
			setTimeout(() => {
				onAuthSuccess()
				onClose()
			}, 500)
		} catch (err) {
			setError(err instanceof Error ? err.message : '注册失败')
		}
	}

	const handleGoogleLogin = async () => {
		setError('')
		setMessage('')

		try {
			await loginWithGoogle()
			// OAuth will redirect, so no need for success message
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Google登录失败')
		}
	}

	const handleGithubLogin = async () => {
		setError('')
		setMessage('')

		try {
			await loginWithGithub()
			// OAuth will redirect, so no need for success message
		} catch (err) {
			setError(err instanceof Error ? err.message : 'GitHub登录失败')
		}
	}

	return (
		<div className="auth-modal-overlay" onClick={onClose}>
			<div className="auth-modal" onClick={(e) => e.stopPropagation()}>
				<button className="auth-modal-close" onClick={onClose}>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
						<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
					</svg>
				</button>

				<div className="auth-modal-header">
					<h2>{mode === 'login' ? '登录' : '注册'}</h2>
					<p>欢迎使用 AI Workflow</p>
				</div>

				{error && (
					<div className="auth-message error">
						{error}
					</div>
				)}

				{message && (
					<div className="auth-message success">
						{message}
					</div>
				)}

				<form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
					{mode === 'register' && (
						<div className="auth-form-group">
							<label htmlFor="fullName">姓名（可选）</label>
							<input
								id="fullName"
								type="text"
								value={fullName}
								onChange={(e) => setFullName(e.target.value)}
								placeholder="张三"
							/>
						</div>
					)}

					<div className="auth-form-group">
						<label htmlFor="email">邮箱</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="your@email.com"
							required
						/>
					</div>

					<div className="auth-form-group">
						<label htmlFor="password">密码</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="••••••"
							required
							minLength={6}
						/>
					</div>

					{mode === 'register' && (
						<div className="auth-form-group">
							<label htmlFor="confirmPassword">确认密码</label>
							<input
								id="confirmPassword"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="••••••"
								required
								minLength={6}
							/>
						</div>
					)}

					<button
						type="submit"
						className="auth-submit-button"
						disabled={isLoading}
					>
						{isLoading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
					</button>
				</form>

				<div className="auth-divider">
					<span>或</span>
				</div>

				<div className="auth-social-buttons">
					<button
						className="auth-social-button google"
						onClick={handleGoogleLogin}
						disabled={isLoading}
						type="button"
					>
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
							<path d="M18.1713 8.36202H17.5V8.33329H10V11.6666H14.7096C14.0225 13.6071 12.1762 15 10 15C7.23875 15 5 12.7612 5 9.99996C5 7.23871 7.23875 4.99996 10 4.99996C11.2746 4.99996 12.4342 5.48079 13.3171 6.26621L15.6742 3.90913C14.1858 2.52204 12.1946 1.66663 10 1.66663C5.39791 1.66663 1.66666 5.39788 1.66666 9.99996C1.66666 14.602 5.39791 18.3333 10 18.3333C14.602 18.3333 18.3333 14.602 18.3333 9.99996C18.3333 9.44121 18.2758 8.89579 18.1713 8.36202Z" fill="#FFC107"/>
							<path d="M2.62750 6.12121L5.36542 8.12954C6.10625 6.29538 7.90042 5.00004 10.0004 5.00004C11.2750 5.00004 12.4346 5.48088 13.3175 6.26629L15.6746 3.90921C14.1862 2.52213 12.195 1.66671 10.0004 1.66671C6.79917 1.66671 4.02334 3.47371 2.62750 6.12121Z" fill="#FF3D00"/>
							<path d="M10.0004 18.3333C12.1533 18.3333 14.1095 17.5096 15.587 16.17L13.0079 13.9875C12.1431 14.6452 11.0864 15.0009 10.0004 15C7.83291 15 5.99207 13.6179 5.29874 11.6892L2.58124 13.7829C3.96041 16.4817 6.76124 18.3333 10.0004 18.3333Z" fill="#4CAF50"/>
							<path d="M18.1713 8.36216H17.5V8.33341H10V11.6667H14.7096C14.3809 12.5902 13.7889 13.3972 13.0067 13.9879L13.0079 13.9871L15.587 16.1696C15.4046 16.3355 18.3333 14.1667 18.3333 10C18.3333 9.44133 18.2758 8.89591 18.1713 8.36216Z" fill="#1976D2"/>
						</svg>
						使用 Google 登录
					</button>

					<button
						className="auth-social-button github"
						onClick={handleGithubLogin}
						disabled={isLoading}
						type="button"
					>
						<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
							<path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10C0 14.42 2.865 18.17 6.839 19.49C7.339 19.58 7.521 19.27 7.521 19C7.521 18.76 7.511 17.99 7.511 17.16C5 17.64 4.39 16.43 4.19 15.8C4.08 15.48 3.59 14.6 3.15 14.36C2.78 14.18 2.28 13.7 3.14 13.69C3.95 13.68 4.54 14.42 4.73 14.73C5.59 16.19 6.96 15.78 7.55 15.51C7.64 14.9 7.89 14.48 8.16 14.22C5.95 13.96 3.64 13.11 3.64 9.34C3.64 8.27 4.08 7.39 4.75 6.71C4.65 6.45 4.32 5.44 4.85 4.08C4.85 4.08 5.66 3.81 7.52 5.07C8.29 4.84 9.1 4.73 9.91 4.73C10.72 4.73 11.53 4.84 12.3 5.07C14.16 3.8 14.97 4.08 14.97 4.08C15.5 5.44 15.17 6.45 15.07 6.71C15.74 7.39 16.18 8.26 16.18 9.34C16.18 13.12 13.86 13.96 11.65 14.22C11.99 14.52 12.29 15.1 12.29 16C12.29 17.3 12.28 18.35 12.28 19C12.28 19.27 12.46 19.59 12.96 19.49C16.932 18.169 19.797 14.418 19.797 10C19.797 4.477 15.32 0 9.797 0H10Z"/>
						</svg>
						使用 GitHub 登录
					</button>
				</div>

				<div className="auth-footer">
					{mode === 'login' ? (
						<p>
							还没有账号？
							<button
								type="button"
								onClick={() => {
									setMode('register')
									setError('')
									setMessage('')
								}}
								className="auth-link-button"
							>
								注册
							</button>
						</p>
					) : (
						<p>
							已有账号？
							<button
								type="button"
								onClick={() => {
									setMode('login')
									setError('')
									setMessage('')
								}}
								className="auth-link-button"
							>
								登录
							</button>
						</p>
					)}
				</div>
			</div>
		</div>
	)
}

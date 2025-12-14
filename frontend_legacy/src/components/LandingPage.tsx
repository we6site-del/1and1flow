import { useState } from 'react'
import './LandingPage.css'

interface LandingPageProps {
  onGetStarted: () => void
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [showAuth, setShowAuth] = useState(false)

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-content">
          <div className="landing-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="4" width="10" height="10" rx="2" fill="#6b7280"/>
              <rect x="18" y="4" width="10" height="10" rx="2" fill="#6b7280"/>
              <rect x="4" y="18" width="10" height="10" rx="2" fill="#6b7280"/>
              <rect x="18" y="18" width="10" height="10" rx="2" fill="#4b5563"/>
            </svg>
            <span className="landing-logo-text">AI Workflow</span>
          </div>

          <div className="landing-nav-links">
            <a href="#home">首页</a>
            <a href="#features">功能</a>
            <a href="#pricing">定价</a>
            <a href="#about">关于</a>
          </div>

          <button className="landing-nav-button" onClick={onGetStarted}>
            开始使用
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-background">
          <div className="hero-image-grid">
            <img src="https://ext.same-assets.com/3906815861/1999173333.webp" alt="Design 1" />
            <img src="https://ext.same-assets.com/3906815861/1678727218.webp" alt="Design 2" />
            <img src="https://ext.same-assets.com/3906815861/1187260612.webp" alt="Design 3" />
            <img src="https://ext.same-assets.com/3906815861/1003771937.webp" alt="Design 4" />
            <img src="https://ext.same-assets.com/3906815861/3974480445.webp" alt="Design 5" />
          </div>
        </div>

        <div className="landing-hero-content">
          <h1 className="landing-hero-title">AI WORKFLOW</h1>
          <p className="landing-hero-subtitle">智能设计工作流</p>
          <button className="landing-hero-button" onClick={onGetStarted}>
            立即开始创作
          </button>
        </div>
      </section>

      {/* Why Section */}
      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-section-title">为什么选择 AI Workflow</h2>
          <p className="landing-section-desc">
            AI Workflow 自动化整个设计流程，从概念到图像、视频、3D 等更多内容。
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <div className="landing-container">
          <div className="landing-feature">
            <div className="landing-feature-content">
              <h3 className="landing-feature-title">只需给出想法</h3>
              <p className="landing-feature-desc">
                AI Workflow 像真正的设计师一样规划、探索和创作——调用正确的工具，规划方向，将您的创意愿景变为现实。
              </p>
              <button className="landing-feature-button" onClick={onGetStarted}>
                立即尝试
              </button>
            </div>
            <div className="landing-feature-image">
              <div className="feature-mockup">
                <div className="mockup-header">
                  <div className="mockup-icons">
                    <span>+</span>
                    <span>🎨</span>
                    <span>🌐</span>
                  </div>
                  <div className="mockup-action">↑</div>
                </div>
                <div className="mockup-text">创建包含一系列饮品元素的海报</div>
              </div>
            </div>
          </div>

          <div className="landing-feature landing-feature-reverse">
            <div className="landing-feature-image">
              <img
                src="https://ext.same-assets.com/3906815861/79852629.webp"
                alt="Co-create"
                className="feature-image-full"
              />
            </div>
            <div className="landing-feature-content">
              <h3 className="landing-feature-title">共同创作 - 一个画布，共享智能</h3>
              <p className="landing-feature-desc">
                在画布上，您的想法会说话——设计会看、理解和响应。标记重要内容，留下笔记，勾勒框架。AI 读取您的意图，与您对话式地设计。
              </p>
              <button className="landing-feature-button" onClick={onGetStarted}>
                立即尝试
              </button>
            </div>
          </div>

          <div className="landing-feature">
            <div className="landing-feature-content">
              <h3 className="landing-feature-title">所有格式集于一处</h3>
              <p className="landing-feature-desc">
                您想象它——AI Workflow 将其转化为图像、视频、音频，甚至 3D。您需要的每种格式，都能即时准备就绪。
              </p>
              <button className="landing-feature-button" onClick={onGetStarted}>
                立即尝试
              </button>
            </div>
            <div className="landing-feature-image">
              <img
                src="https://ext.same-assets.com/3906815861/3410960665.webp"
                alt="All formats"
                className="feature-image-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="landing-pricing" id="pricing">
        <div className="landing-container">
          <h2 className="landing-section-title">灵活的计划满足每个需求</h2>

          <div className="pricing-toggle">
            <button className="pricing-toggle-btn active">月付</button>
            <button className="pricing-toggle-btn">年付</button>
            <span className="pricing-badge">2个月免费</span>
          </div>

          <div className="pricing-grid">
            {/* Starter Plan */}
            <div className="pricing-card">
              <div className="pricing-header">
                <h4 className="pricing-plan-name">入门版</h4>
                <div className="pricing-price">
                  <span className="price-amount">¥99</span>
                  <span className="price-period">/月</span>
                </div>
                <p className="pricing-billing">按年计费</p>
              </div>

              <div className="pricing-credits">
                <strong>2000</strong> 积分/月
              </div>

              <button className="pricing-button" onClick={onGetStarted}>
                开始使用
              </button>

              <div className="pricing-features">
                <h5 className="pricing-features-title">功能</h5>
                <ul className="pricing-features-list">
                  <li>每天 100 刷新积分</li>
                  <li>最多 67 次 AI 对话</li>
                  <li>最多生成 200 张图片</li>
                  <li>最多编辑 333 张图片</li>
                  <li>最多 267 秒视频</li>
                  <li>无限模型使用</li>
                  <li>商业许可</li>
                </ul>
              </div>
            </div>

            {/* Basic Plan */}
            <div className="pricing-card pricing-card-popular">
              <div className="pricing-badge-popular">最受欢迎</div>
              <div className="pricing-header">
                <h4 className="pricing-plan-name">基础版</h4>
                <div className="pricing-price">
                  <span className="price-amount">¥199</span>
                  <span className="price-period">/月</span>
                </div>
                <p className="pricing-billing">按年计费</p>
              </div>

              <div className="pricing-credits">
                <strong>3500</strong> 积分/月
              </div>

              <button className="pricing-button pricing-button-primary" onClick={onGetStarted}>
                开始使用
              </button>

              <div className="pricing-features">
                <h5 className="pricing-features-title">功能</h5>
                <ul className="pricing-features-list">
                  <li>每天 100 刷新积分</li>
                  <li>最多 117 次 AI 对话</li>
                  <li>最多生成 350 张图片</li>
                  <li>最多编辑 583 张图片</li>
                  <li>最多 467 秒视频</li>
                  <li>无限模型使用</li>
                  <li>商业许可</li>
                  <li>所有高级模型</li>
                </ul>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="pricing-card">
              <div className="pricing-header">
                <h4 className="pricing-plan-name">专业版</h4>
                <div className="pricing-price">
                  <span className="price-amount">¥499</span>
                  <span className="price-period">/月</span>
                </div>
                <p className="pricing-billing">按年计费</p>
              </div>

              <div className="pricing-credits">
                <strong>11000</strong> 积分/月
              </div>

              <button className="pricing-button" onClick={onGetStarted}>
                开始使用
              </button>

              <div className="pricing-features">
                <h5 className="pricing-features-title">功能</h5>
                <ul className="pricing-features-list">
                  <li>每天 100 刷新积分</li>
                  <li>最多 367 次 AI 对话</li>
                  <li>最多生成 1100 张图片</li>
                  <li>最多编辑 1833 张图片</li>
                  <li>最多 1467 秒视频</li>
                  <li>积分充值享 10% 折扣</li>
                  <li>无限模型使用</li>
                  <li>商业许可</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="landing-cta">
        <div className="landing-container">
          <h2 className="landing-cta-title">更智能的设计。</h2>
          <h2 className="landing-cta-title">更快速的创作。</h2>
          <p className="landing-cta-desc">
            体验世界首个 AI 设计助手——无需等待，无限可能。立即注册，让您的创意栩栩如生。
          </p>
          <button className="landing-cta-button" onClick={onGetStarted}>
            立即开始设计
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="footer-logo">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="4" y="4" width="10" height="10" rx="2" fill="#6b7280"/>
                  <rect x="18" y="4" width="10" height="10" rx="2" fill="#6b7280"/>
                  <rect x="4" y="18" width="10" height="10" rx="2" fill="#6b7280"/>
                  <rect x="18" y="18" width="10" height="10" rx="2" fill="#4b5563"/>
                </svg>
                <span>AI Workflow</span>
              </div>
            </div>

            <div className="footer-col">
              <h4 className="footer-title">产品</h4>
              <ul className="footer-links">
                <li><a href="#features">功能特性</a></li>
                <li><a href="#pricing">定价方案</a></li>
                <li><a href="#updates">更新日志</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-title">资源</h4>
              <ul className="footer-links">
                <li><a href="#tools">工具</a></li>
                <li><a href="#docs">文档</a></li>
                <li><a href="#blog">博客</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-title">关于</h4>
              <ul className="footer-links">
                <li><a href="#about">关于我们</a></li>
                <li><a href="mailto:support@aiworkflow.com">联系我们</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              2025 © AI Workflow • All Rights Reserved
            </p>
            <div className="footer-legal">
              <a href="#terms">使用条款</a>
              <a href="#privacy">隐私政策</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

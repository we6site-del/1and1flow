import React, { useState } from 'react'
import './PricingPlans.css'

interface PricingPlansProps {
  onSelectPlan?: (planId: string) => void
  currentPlan?: string | null
}

interface Plan {
  id: string
  name: string
  price: number
  period: string
  features: string[]
  popular?: boolean
  credits?: number
}

const plans: Plan[] = [
  {
    id: 'free',
    name: '免费版',
    price: 0,
    period: '永久免费',
    credits: 100,
    features: [
      '100 积分/月',
      '基础 AI 模型访问',
      '最多 3 个项目',
      '社区支持',
      '基础工作流模板',
    ],
  },
  {
    id: 'pro',
    name: '专业版',
    price: 29,
    period: '每月',
    credits: 1000,
    popular: true,
    features: [
      '1,000 积分/月',
      '所有 AI 模型访问',
      '无限项目',
      '优先支持',
      '高级工作流模板',
      '团队协作 (最多 5 人)',
      'API 访问',
    ],
  },
  {
    id: 'enterprise',
    name: '企业版',
    price: 99,
    period: '每月',
    credits: 5000,
    features: [
      '5,000 积分/月',
      '所有 AI 模型访问',
      '无限项目和团队成员',
      '专属客户经理',
      '自定义模型训练',
      '私有部署选项',
      'SLA 保障',
      '高级安全功能',
    ],
  },
]

export function PricingPlans({ onSelectPlan, currentPlan }: PricingPlansProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const handleSelectPlan = (planId: string) => {
    console.log('选择套餐:', planId)
    onSelectPlan?.(planId)
  }

  return (
    <div className="pricing-plans">
      <div className="pricing-header">
        <h1 className="pricing-title">选择适合您的套餐</h1>
        <p className="pricing-subtitle">所有套餐都包含 14 天免费试用</p>

        <div className="billing-toggle">
          <button
            className={`billing-option ${billingPeriod === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingPeriod('monthly')}
          >
            按月付费
          </button>
          <button
            className={`billing-option ${billingPeriod === 'yearly' ? 'active' : ''}`}
            onClick={() => setBillingPeriod('yearly')}
          >
            按年付费
            <span className="billing-badge">省 20%</span>
          </button>
        </div>
      </div>

      <div className="pricing-grid">
        {plans.map((plan) => {
          const yearlyPrice = Math.floor(plan.price * 12 * 0.8)
          const displayPrice = billingPeriod === 'yearly' ? yearlyPrice : plan.price
          const isCurrentPlan = currentPlan === plan.id

          return (
            <div
              key={plan.id}
              className={`pricing-card ${plan.popular ? 'popular' : ''} ${isCurrentPlan ? 'current' : ''}`}
            >
              {plan.popular && (
                <div className="popular-badge">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1L8.5 5L13 6L9.5 9.5L10.5 14L7 11.5L3.5 14L4.5 9.5L1 6L5.5 5L7 1Z" fill="currentColor"/>
                  </svg>
                  最受欢迎
                </div>
              )}

              {isCurrentPlan && (
                <div className="current-plan-badge">当前套餐</div>
              )}

              <div className="plan-header">
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price">
                  {plan.price === 0 ? (
                    <span className="price-free">免费</span>
                  ) : (
                    <>
                      <span className="price-currency">¥</span>
                      <span className="price-amount">{displayPrice}</span>
                      <span className="price-period">
                        /{billingPeriod === 'yearly' ? '年' : '月'}
                      </span>
                    </>
                  )}
                </div>
                {plan.credits && (
                  <p className="plan-credits">{plan.credits.toLocaleString()} 积分/月</p>
                )}
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, index) => (
                  <li key={index} className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="8" fill="#3b82f6" opacity="0.1"/>
                      <path d="M5 8L7 10L11 6" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`plan-button ${plan.popular ? 'primary' : 'secondary'} ${isCurrentPlan ? 'current' : ''}`}
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isCurrentPlan}
              >
                {isCurrentPlan ? '当前套餐' : plan.price === 0 ? '开始使用' : '开始免费试用'}
              </button>

              {plan.price > 0 && !isCurrentPlan && (
                <p className="plan-trial-info">14 天免费试用，随时取消</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="pricing-faq">
        <h2>常见问题</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>什么是积分？</h3>
            <p>积分用于使用 AI 功能。不同的 AI 模型消耗不同的积分数量。</p>
          </div>
          <div className="faq-item">
            <h3>可以随时取消吗？</h3>
            <p>是的，您可以随时在账户设置中取消订阅，不会收取任何费用。</p>
          </div>
          <div className="faq-item">
            <h3>支持哪些付款方式？</h3>
            <p>我们支持信用卡、借记卡、支付宝和微信支付。</p>
          </div>
          <div className="faq-item">
            <h3>积分会过期吗？</h3>
            <p>每月的积分不会累计到下个月，但年度套餐的积分可以在一年内使用。</p>
          </div>
        </div>
      </div>
    </div>
  )
}

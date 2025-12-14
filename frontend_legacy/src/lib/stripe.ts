/**
 * Stripe 支付集成
 * 支持积分购买和订阅管理
 */

import { loadStripe, Stripe } from '@stripe/stripe-js'
import { supabase } from './supabase'
import type { UserProfile } from '../stores/userStore'

// Stripe 配置
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

export const STRIPE_ENABLED = Boolean(STRIPE_PUBLISHABLE_KEY)

let stripePromise: Promise<Stripe | null> | null = null

/**
 * 获取 Stripe 实例
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

// ============================================
// 积分购买套餐
// ============================================

export interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number // 美元
  bonus?: number // 赠送积分
  popular?: boolean
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'credits_1000',
    name: '入门包',
    credits: 1000,
    price: 9.99,
  },
  {
    id: 'credits_5000',
    name: '进阶包',
    credits: 5000,
    price: 39.99,
    bonus: 500,
    popular: true,
  },
  {
    id: 'credits_10000',
    name: '专业包',
    credits: 10000,
    price: 69.99,
    bonus: 2000,
  },
  {
    id: 'credits_50000',
    name: '企业包',
    credits: 50000,
    price: 299.99,
    bonus: 15000,
  },
]

/**
 * 购买积分
 */
export async function purchaseCredits(
  userId: string,
  packageId: string
): Promise<{ success: boolean; error?: string; sessionId?: string }> {
  if (!STRIPE_ENABLED) {
    return {
      success: false,
      error: 'Stripe not configured',
    }
  }

  try {
    const creditPackage = CREDIT_PACKAGES.find(p => p.id === packageId)
    if (!creditPackage) {
      throw new Error('Invalid package ID')
    }

    // 调用后端创建 Checkout Session
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        packageId,
        successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create checkout session')
    }

    const { sessionId } = await response.json()

    // 重定向到 Stripe Checkout
    const stripe = await getStripe()
    if (!stripe) {
      throw new Error('Stripe not loaded')
    }

    const { error } = await stripe.redirectToCheckout({ sessionId })

    if (error) {
      throw error
    }

    return {
      success: true,
      sessionId,
    }
  } catch (error) {
    console.error('Purchase credits error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================
// 订阅计划
// ============================================

export interface SubscriptionPlan {
  id: string
  name: string
  tier: UserProfile['subscription_tier']
  monthlyPrice: number
  yearlyPrice: number
  monthlyCredits: number
  features: string[]
  popular?: boolean
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_free',
    name: '免费版',
    tier: 'free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyCredits: 1000,
    features: [
      '每月 1000 积分',
      '最多 3 个项目',
      '基础 AI 模型',
      '社区支持',
    ],
  },
  {
    id: 'plan_starter',
    name: '入门版',
    tier: 'starter',
    monthlyPrice: 9.99,
    yearlyPrice: 99,
    monthlyCredits: 2000,
    features: [
      '每月 2000 积分',
      '最多 50 个项目',
      '所有 AI 模型',
      '优先支持',
      '无广告',
    ],
  },
  {
    id: 'plan_basic',
    name: '基础版',
    tier: 'basic',
    monthlyPrice: 19.99,
    yearlyPrice: 199,
    monthlyCredits: 3500,
    features: [
      '每月 3500 积分',
      '无限项目',
      '所有高级模型',
      '优先支持',
      '协作功能',
      '导出功能',
    ],
    popular: true,
  },
  {
    id: 'plan_pro',
    name: '专业版',
    tier: 'pro',
    monthlyPrice: 49.99,
    yearlyPrice: 499,
    monthlyCredits: 11000,
    features: [
      '每月 11000 积分',
      '无限项目',
      '所有模型',
      '专属支持',
      '团队协作',
      '高级导出',
      'API 访问',
      '积分充值 10% 折扣',
    ],
  },
  {
    id: 'plan_ultimate',
    name: '旗舰版',
    tier: 'ultimate',
    monthlyPrice: 99.99,
    yearlyPrice: 999,
    monthlyCredits: 27000,
    features: [
      '每月 27000 积分',
      '无限项目',
      '所有模型',
      '专属客服',
      '企业级协作',
      '白标定制',
      '完整 API',
      '积分充值 10% 折扣',
      '定制培训',
    ],
  },
]

/**
 * 订阅计划
 */
export async function subscribeToPlan(
  userId: string,
  planId: string,
  interval: 'monthly' | 'yearly' = 'monthly'
): Promise<{ success: boolean; error?: string; sessionId?: string }> {
  if (!STRIPE_ENABLED) {
    return {
      success: false,
      error: 'Stripe not configured',
    }
  }

  try {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
    if (!plan) {
      throw new Error('Invalid plan ID')
    }

    if (plan.tier === 'free') {
      throw new Error('Cannot subscribe to free plan')
    }

    // 调用后端创建订阅 Session
    const response = await fetch('/api/stripe/create-subscription-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        planId,
        interval,
        successUrl: `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/subscription/cancel`,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create subscription session')
    }

    const { sessionId } = await response.json()

    // 重定向到 Stripe Checkout
    const stripe = await getStripe()
    if (!stripe) {
      throw new Error('Stripe not loaded')
    }

    const { error } = await stripe.redirectToCheckout({ sessionId })

    if (error) {
      throw error
    }

    return {
      success: true,
      sessionId,
    }
  } catch (error) {
    console.error('Subscribe to plan error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 取消订阅
 */
export async function cancelSubscription(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!STRIPE_ENABLED || !supabase) {
    return {
      success: false,
      error: 'Service not configured',
    }
  }

  try {
    // 调用后端取消订阅
    const response = await fetch('/api/stripe/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) {
      throw new Error('Failed to cancel subscription')
    }

    return { success: true }
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 获取订阅信息
 */
export async function getSubscriptionInfo(
  userId: string
): Promise<{
  success: boolean
  data?: {
    planId: string
    status: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
  }
  error?: string
}> {
  if (!STRIPE_ENABLED || !supabase) {
    return {
      success: false,
      error: 'Service not configured',
    }
  }

  try {
    const response = await fetch(`/api/stripe/subscription-info?userId=${userId}`)

    if (!response.ok) {
      throw new Error('Failed to get subscription info')
    }

    const data = await response.json()

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Get subscription info error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 客户门户（管理订阅、账单等）
 */
export async function redirectToCustomerPortal(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!STRIPE_ENABLED) {
    return {
      success: false,
      error: 'Stripe not configured',
    }
  }

  try {
    const response = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        returnUrl: window.location.origin,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create portal session')
    }

    const { url } = await response.json()

    // 重定向到客户门户
    window.location.href = url

    return { success: true }
  } catch (error) {
    console.error('Redirect to customer portal error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

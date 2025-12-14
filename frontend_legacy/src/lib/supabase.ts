import { createClient } from '@supabase/supabase-js'

// 从环境变量读取，如果没有则使用演示模式
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// 是否启用真实的 Supabase
export const SUPABASE_ENABLED = Boolean(supabaseUrl && supabaseAnonKey)

// 创建客户端（如果没有配置则返回 null）
export const supabase = SUPABASE_ENABLED
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// 数据库类型定义
export interface User {
  id: string
  email: string
  credits: number
  subscription_tier: 'free' | 'pro' | 'enterprise'
  created_at: string
  updated_at: string
}

export interface Workflow {
  id: string
  user_id: string
  title: string
  description: string
  data: any
  thumbnail: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Generation {
  id: string
  user_id: string
  workflow_id: string | null
  type: 'image' | 'video'
  model: string
  prompt: string
  result_url: string
  credits_used: number
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: 'purchase' | 'subscription' | 'refund'
  amount: number
  credits: number
  stripe_payment_id: string | null
  created_at: string
}

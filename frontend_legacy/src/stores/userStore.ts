import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  credits: number
  subscription_tier: 'free' | 'starter' | 'basic' | 'pro' | 'ultimate'
  subscription_status: 'active' | 'cancelled' | 'expired'
  subscription_expires_at?: string
  created_at: string
  updated_at: string
}

interface UserState {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // 认证方法
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName?: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  loginWithGithub: () => Promise<void>
  logout: () => Promise<void>

  // 用户数据管理
  fetchUserProfile: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>

  // 积分管理
  updateCredits: (credits: number) => void
  deductCredits: (amount: number) => Promise<boolean>
  addCredits: (amount: number, type?: string) => Promise<void>
  refundCredits: (amount: number) => Promise<void>

  // 订阅管理
  updatePlan: (plan: UserProfile['subscription_tier']) => Promise<void>

  // 初始化
  initialize: () => Promise<void>
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 初始化 - 检查现有会话
      initialize: async () => {
        if (!supabase) {
          console.warn('Supabase not configured, using demo mode')
          return
        }

        try {
          set({ isLoading: true, error: null })

          const { data: { session } } = await supabase.auth.getSession()

          if (session?.user) {
            await get().fetchUserProfile()
          }
        } catch (error: any) {
          console.error('Initialize error:', error)
          set({ error: error.message })
        } finally {
          set({ isLoading: false })
        }
      },

      // 获取用户配置
      fetchUserProfile: async () => {
        if (!supabase) return

        try {
          const { data: { user } } = await supabase.auth.getUser()

          if (!user) {
            set({ user: null, isAuthenticated: false })
            return
          }

          // 使用 maybeSingle 避免在没有 profile 时抛出错误
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()

          if (error) {
            console.error('Query profile error:', error)
          }

          // 如果 profile 不存在，尝试创建一个
          if (!profile) {
            const newProfile: Partial<UserProfile> = {
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || '',
              avatar_url: user.user_metadata?.avatar_url || '',
              credits: 2000, // 新用户赠送
              subscription_tier: 'free',
              subscription_status: 'active',
            }

            const { data: createdProfile, error: createError } = await supabase
              .from('profiles')
              .insert([newProfile])
              .select()
              .single()

            if (createError) {
              console.warn('Cannot create profile in database, using temporary profile:', createError)
              // 如果无法创建数据库记录（如 RLS 限制），使用临时 profile
              set({
                user: {
                  ...newProfile,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                } as UserProfile,
                isAuthenticated: true,
                error: null
              })
            } else {
              set({
                user: createdProfile,
                isAuthenticated: true,
                error: null
              })
            }
          } else {
            set({
              user: profile,
              isAuthenticated: true,
              error: null
            })
          }
        } catch (error: any) {
          console.error('Fetch profile error:', error)
          // 即使出错，仍然尝试使用基本的用户信息
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            set({
              user: {
                id: user.id,
                email: user.email || '',
                full_name: user.user_metadata?.full_name || '',
                avatar_url: user.user_metadata?.avatar_url || '',
                credits: 2000,
                subscription_tier: 'free',
                subscription_status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as UserProfile,
              isAuthenticated: true,
              error: null
            })
          }
        }
      },

      // 登录
      login: async (email: string, password: string) => {
        if (!supabase) {
          // Demo mode
          set({
            user: {
              id: 'demo-user',
              email,
              credits: 1000,
              subscription_tier: 'free',
              subscription_status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            isAuthenticated: true,
          })
          return
        }

        try {
          set({ isLoading: true, error: null })

          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) throw error

          await get().fetchUserProfile()
        } catch (error: any) {
          console.error('Login error:', error)
          set({ error: error.message })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      // 注册
      register: async (email: string, password: string, fullName?: string) => {
        if (!supabase) {
          // Demo mode
          set({
            user: {
              id: 'demo-user',
              email,
              full_name: fullName,
              credits: 2000, // 新用户赠送
              subscription_tier: 'free',
              subscription_status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            isAuthenticated: true,
          })
          return
        }

        try {
          set({ isLoading: true, error: null })

          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName || '',
              },
            },
          })

          if (error) throw error

          // 注册成功后自动登录
          await get().login(email, password)
        } catch (error: any) {
          console.error('Register error:', error)
          set({ error: error.message })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      // Google 登录
      loginWithGoogle: async () => {
        if (!supabase) return

        try {
          set({ isLoading: true, error: null })

          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: window.location.origin,
            },
          })

          if (error) throw error
        } catch (error: any) {
          console.error('Google login error:', error)
          set({ error: error.message })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      // Github 登录
      loginWithGithub: async () => {
        if (!supabase) return

        try {
          set({ isLoading: true, error: null })

          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
              redirectTo: window.location.origin,
            },
          })

          if (error) throw error
        } catch (error: any) {
          console.error('Github login error:', error)
          set({ error: error.message })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      // 登出
      logout: async () => {
        if (!supabase) {
          set({
            user: null,
            isAuthenticated: false,
          })
          return
        }

        try {
          set({ isLoading: true, error: null })

          const { error } = await supabase.auth.signOut()

          if (error) throw error

          set({
            user: null,
            isAuthenticated: false,
          })
        } catch (error: any) {
          console.error('Logout error:', error)
          set({ error: error.message })
        } finally {
          set({ isLoading: false })
        }
      },

      // 更新用户配置
      updateProfile: async (updates: Partial<UserProfile>) => {
        if (!supabase) return

        const { user } = get()
        if (!user) return

        try {
          set({ isLoading: true, error: null })

          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)

          if (error) throw error

          set({
            user: { ...user, ...updates },
          })
        } catch (error: any) {
          console.error('Update profile error:', error)
          set({ error: error.message })
        } finally {
          set({ isLoading: false })
        }
      },

      // 更新积分（仅本地）
      updateCredits: (credits: number) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, credits } })
        }
      },

      // 扣除积分
      deductCredits: async (amount: number) => {
        const { user } = get()
        if (!user || user.credits < amount) {
          return false
        }

        if (!supabase) {
          // Demo mode
          set({ user: { ...user, credits: user.credits - amount } })
          return true
        }

        try {
          const { data, error } = await supabase.rpc('deduct_credits', {
            user_uuid: user.id,
            amount: amount,
          })

          if (error) throw error

          if (data) {
            await get().fetchUserProfile()
            return true
          }

          return false
        } catch (error: any) {
          console.error('Deduct credits error:', error)
          return false
        }
      },

      // 添加积分
      addCredits: async (amount: number, type: string = 'bonus') => {
        const { user } = get()
        if (!user) return

        if (!supabase) {
          // Demo mode
          set({ user: { ...user, credits: user.credits + amount } })
          return
        }

        try {
          const { error } = await supabase.rpc('add_credits', {
            user_uuid: user.id,
            amount: amount,
            transaction_type: type,
          })

          if (error) throw error

          await get().fetchUserProfile()
        } catch (error: any) {
          console.error('Add credits error:', error)
        }
      },

      // 退还积分（AI 任务失败时）
      refundCredits: async (amount: number) => {
        const { user } = get()
        if (!user) return

        if (!supabase) {
          // Demo mode
          set({ user: { ...user, credits: user.credits + amount } })
          return
        }

        try {
          // 使用 add_credits RPC，type 为 'refund'
          const { error } = await supabase.rpc('add_credits', {
            user_uuid: user.id,
            amount: amount,
            transaction_type: 'refund',
          })

          if (error) throw error

          await get().fetchUserProfile()
          console.log(`✓ 已退还 ${amount} 积分`)
        } catch (error: any) {
          console.error('Refund credits error:', error)
          // 如果 RPC 调用失败，直接更新本地状态
          set({ user: { ...user, credits: user.credits + amount } })
        }
      },

      // 更新订阅计划
      updatePlan: async (plan: UserProfile['subscription_tier']) => {
        const { user } = get()
        if (!user) return

        const creditsMap = {
          free: 1000,
          starter: 2000,
          basic: 3500,
          pro: 11000,
          ultimate: 27000,
        }

        await get().updateProfile({
          subscription_tier: plan,
          credits: user.credits + creditsMap[plan],
        })
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

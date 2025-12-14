/**
 * Supabase Realtime 订阅管理
 * 用于实时监听 AI 生成状态更新
 */

import { supabase, SUPABASE_ENABLED } from './supabase'
import type { AIGeneration } from './database'

export interface GenerationUpdate {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  resultUrl?: string
  errorMessage?: string
}

/**
 * 订阅 AI 生成状态更新
 * @param generationId 生成记录 ID
 * @param onUpdate 更新回调
 * @returns 取消订阅函数
 */
export function subscribeToGeneration(
  generationId: string,
  onUpdate: (update: GenerationUpdate) => void
): () => void {
  if (!SUPABASE_ENABLED || !supabase) {
    console.warn('Supabase not enabled, skipping realtime subscription')
    return () => {}
  }

  console.log('📡 订阅生成状态更新:', generationId)

  const channel = supabase
    .channel(`generation:${generationId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'ai_generations',
        filter: `id=eq.${generationId}`,
      },
      (payload) => {
        console.log('📨 收到生成状态更新:', payload)
        const newRecord = payload.new as AIGeneration

        onUpdate({
          id: newRecord.id,
          status: newRecord.status,
          resultUrl: newRecord.output_data?.result_url || newRecord.output_data,
          errorMessage: newRecord.error_message,
        })
      }
    )
    .subscribe()

  // 返回取消订阅函数
  return () => {
    console.log('🔌 取消订阅生成状态更新:', generationId)
    supabase.removeChannel(channel)
  }
}

/**
 * 订阅用户的所有生成记录更新
 * @param userId 用户 ID
 * @param onUpdate 更新回调
 * @returns 取消订阅函数
 */
export function subscribeToUserGenerations(
  userId: string,
  onUpdate: (update: GenerationUpdate) => void
): () => void {
  if (!SUPABASE_ENABLED || !supabase) {
    console.warn('Supabase not enabled, skipping realtime subscription')
    return () => {}
  }

  console.log('📡 订阅用户生成记录更新:', userId)

  const channel = supabase
    .channel(`user-generations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // 监听所有事件（INSERT, UPDATE, DELETE）
        schema: 'public',
        table: 'ai_generations',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('📨 收到用户生成记录更新:', payload)
        const record = payload.new as AIGeneration || payload.old as AIGeneration

        if (record) {
          onUpdate({
            id: record.id,
            status: record.status,
            resultUrl: record.output_data?.result_url || record.output_data,
            errorMessage: record.error_message,
          })
        }
      }
    )
    .subscribe()

  // 返回取消订阅函数
  return () => {
    console.log('🔌 取消订阅用户生成记录更新:', userId)
    supabase.removeChannel(channel)
  }
}

/**
 * 订阅项目相关的生成记录更新
 * @param projectId 项目 ID
 * @param onUpdate 更新回调
 * @returns 取消订阅函数
 */
export function subscribeToProjectGenerations(
  projectId: string,
  onUpdate: (update: GenerationUpdate) => void
): () => void {
  if (!SUPABASE_ENABLED || !supabase) {
    console.warn('Supabase not enabled, skipping realtime subscription')
    return () => {}
  }

  console.log('📡 订阅项目生成记录更新:', projectId)

  const channel = supabase
    .channel(`project-generations:${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ai_generations',
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
        console.log('📨 收到项目生成记录更新:', payload)
        const record = payload.new as AIGeneration || payload.old as AIGeneration

        if (record) {
          onUpdate({
            id: record.id,
            status: record.status,
            resultUrl: record.output_data?.result_url || record.output_data,
            errorMessage: record.error_message,
          })
        }
      }
    )
    .subscribe()

  // 返回取消订阅函数
  return () => {
    console.log('🔌 取消订阅项目生成记录更新:', projectId)
    supabase.removeChannel(channel)
  }
}


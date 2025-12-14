import { supabase } from './supabase'
import type { UserProfile } from '../stores/userStore'

// ============================================
// 类型定义
// ============================================

export interface Project {
  id: string
  user_id: string
  name: string
  description?: string
  thumbnail_url?: string
  canvas_data?: any
  is_public: boolean
  tags?: string[]
  view_count: number
  created_at: string
  updated_at: string
  last_opened_at: string
}

export interface ProjectVersion {
  id: string
  project_id: string
  version_number: number
  canvas_data: any
  description?: string
  created_at: string
}

export interface AIGeneration {
  id: string
  user_id: string
  project_id?: string
  generation_type: 'text' | 'image' | 'video' | 'audio'
  model_name: string
  prompt: string
  input_data?: any
  output_data?: any
  credits_used: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
  created_at: string
  completed_at?: string
}

export interface UserAsset {
  id: string
  user_id: string
  project_id?: string
  asset_type: 'image' | 'video' | 'audio' | 'document'
  file_name: string
  file_size?: number
  file_url: string
  thumbnail_url?: string
  mime_type?: string
  width?: number
  height?: number
  duration?: number
  tags?: string[]
  created_at: string
}

// ============================================
// 项目管理
// ============================================

/**
 * 创建新项目
 */
export async function createProject(
  userId: string,
  name: string = '未命名项目',
  canvasData?: any
): Promise<Project | null> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return null
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name,
        canvas_data: canvasData || {},
        is_public: false,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Create project error:', error)
    return null
  }
}

/**
 * 获取用户的所有项目
 */
export async function getUserProjects(
  userId: string,
  limit: number = 50
): Promise<Project[]> {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get user projects error:', error)
    return []
  }
}

/**
 * 获取单个项目
 */
export async function getProject(projectId: string): Promise<Project | null> {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get project error:', error)
    return null
  }
}

/**
 * 更新项目
 */
export async function updateProject(
  projectId: string,
  updates: Partial<Project>
): Promise<boolean> {
  if (!supabase) return false

  try {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Update project error:', error)
    return false
  }
}

/**
 * 保存项目画布数据
 */
export async function saveProjectCanvas(
  projectId: string,
  canvasData: any
): Promise<boolean> {
  return updateProject(projectId, {
    canvas_data: canvasData,
    updated_at: new Date().toISOString(),
  })
}

/**
 * 删除项目
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  if (!supabase) return false

  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Delete project error:', error)
    return false
  }
}

/**
 * 更新项目最后打开时间
 */
export async function updateProjectLastOpened(
  projectId: string
): Promise<boolean> {
  return updateProject(projectId, {
    last_opened_at: new Date().toISOString(),
  })
}

// ============================================
// 项目版本管理
// ============================================

/**
 * 创建项目版本
 */
export async function createProjectVersion(
  projectId: string,
  canvasData: any,
  description?: string
): Promise<ProjectVersion | null> {
  if (!supabase) return null

  try {
    // 获取当前最大版本号
    const { data: versions } = await supabase
      .from('project_versions')
      .select('version_number')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1)

    const nextVersion = versions && versions.length > 0
      ? versions[0].version_number + 1
      : 1

    const { data, error } = await supabase
      .from('project_versions')
      .insert({
        project_id: projectId,
        version_number: nextVersion,
        canvas_data: canvasData,
        description,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Create project version error:', error)
    return null
  }
}

/**
 * 获取项目版本历史
 */
export async function getProjectVersions(
  projectId: string,
  limit: number = 20
): Promise<ProjectVersion[]> {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('project_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get project versions error:', error)
    return []
  }
}

// ============================================
// AI 生成记录
// ============================================

/**
 * 创建 AI 生成记录
 */
export async function createAIGeneration(
  userId: string,
  params: {
    projectId?: string
    generationType: AIGeneration['generation_type']
    modelName: string
    prompt: string
    inputData?: any
    creditsUsed: number
  }
): Promise<AIGeneration | null> {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('ai_generations')
      .insert({
        user_id: userId,
        project_id: params.projectId,
        generation_type: params.generationType,
        model_name: params.modelName,
        prompt: params.prompt,
        input_data: params.inputData,
        credits_used: params.creditsUsed,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Create AI generation error:', error)
    return null
  }
}

/**
 * 更新 AI 生成状态
 */
export async function updateAIGeneration(
  generationId: string,
  updates: {
    status?: AIGeneration['status']
    outputData?: any
    errorMessage?: string
  }
): Promise<boolean> {
  if (!supabase) return false

  try {
    const updateData: any = updates

    if (updates.status === 'completed' || updates.status === 'failed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('ai_generations')
      .update(updateData)
      .eq('id', generationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Update AI generation error:', error)
    return false
  }
}

/**
 * 获取用户的 AI 生成历史
 */
export async function getUserGenerations(
  userId: string,
  limit: number = 50
): Promise<AIGeneration[]> {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('ai_generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get user generations error:', error)
    return []
  }
}

// ============================================
// 资产管理
// ============================================

/**
 * 上传用户资产
 */
export async function uploadUserAsset(
  userId: string,
  file: File,
  projectId?: string
): Promise<UserAsset | null> {
  if (!supabase) return null

  try {
    // 上传文件到 Supabase Storage
    const fileName = `${userId}/${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-assets')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // 获取公开 URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-assets')
      .getPublicUrl(fileName)

    // 创建资产记录
    const { data, error } = await supabase
      .from('user_assets')
      .insert({
        user_id: userId,
        project_id: projectId,
        asset_type: file.type.startsWith('image/') ? 'image' :
                    file.type.startsWith('video/') ? 'video' :
                    file.type.startsWith('audio/') ? 'audio' : 'document',
        file_name: file.name,
        file_size: file.size,
        file_url: publicUrl,
        mime_type: file.type,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Upload user asset error:', error)
    return null
  }
}

/**
 * 获取用户资产
 */
export async function getUserAssets(
  userId: string,
  projectId?: string,
  limit: number = 100
): Promise<UserAsset[]> {
  if (!supabase) return []

  try {
    let query = supabase
      .from('user_assets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get user assets error:', error)
    return []
  }
}

/**
 * 删除用户资产
 */
export async function deleteUserAsset(assetId: string): Promise<boolean> {
  if (!supabase) return false

  try {
    // 先获取资产信息
    const { data: asset } = await supabase
      .from('user_assets')
      .select('file_url')
      .eq('id', assetId)
      .single()

    if (asset) {
      // 从存储中删除文件
      const fileName = asset.file_url.split('/').pop()
      if (fileName) {
        await supabase.storage.from('user-assets').remove([fileName])
      }
    }

    // 删除数据库记录
    const { error } = await supabase
      .from('user_assets')
      .delete()
      .eq('id', assetId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Delete user asset error:', error)
    return false
  }
}

// ============================================
// 统计和分析
// ============================================

/**
 * 获取用户统计信息
 */
export async function getUserStats(userId: string): Promise<{
  projectCount: number
  generationCount: number
  totalCreditsUsed: number
} | null> {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    return {
      projectCount: data.project_count || 0,
      generationCount: data.generation_count || 0,
      totalCreditsUsed: data.total_credits_used || 0,
    }
  } catch (error) {
    console.error('Get user stats error:', error)
    return null
  }
}

/**
 * 记录活动日志
 */
export async function logActivity(
  userId: string,
  activityType: string,
  description: string,
  metadata?: any
): Promise<boolean> {
  if (!supabase) return false

  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        activity_type: activityType,
        description,
        metadata,
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Log activity error:', error)
    return false
  }
}

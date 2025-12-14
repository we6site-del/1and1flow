/**
 * 项目协作和分享功能
 */

import { supabase } from './supabase'

// ============================================
// 类型定义
// ============================================

export interface ProjectShare {
  id: string
  project_id: string
  share_token: string
  permission: 'view' | 'edit' | 'comment'
  expires_at?: string
  password?: string
  max_uses?: number
  use_count: number
  created_by: string
  created_at: string
}

export interface ProjectCollaborator {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer' | 'commenter'
  invited_by: string
  invited_at: string
  accepted_at?: string
  status: 'pending' | 'accepted' | 'declined'
}

export interface Comment {
  id: string
  project_id: string
  user_id: string
  content: string
  position?: {
    x: number
    y: number
  }
  thread_id?: string
  created_at: string
  updated_at: string
}

// ============================================
// 项目分享
// ============================================

/**
 * 创建分享链接
 */
export async function createShareLink(params: {
  projectId: string
  permission: ProjectShare['permission']
  expiresIn?: number // 天数
  password?: string
  maxUses?: number
}): Promise<{ success: boolean; shareToken?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const shareToken = generateShareToken()
    const expiresAt = params.expiresIn
      ? new Date(Date.now() + params.expiresIn * 24 * 60 * 60 * 1000).toISOString()
      : undefined

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase
      .from('project_shares')
      .insert({
        project_id: params.projectId,
        share_token: shareToken,
        permission: params.permission,
        expires_at: expiresAt,
        password: params.password,
        max_uses: params.maxUses,
        use_count: 0,
        created_by: user.id,
      })

    if (error) throw error

    return {
      success: true,
      shareToken,
    }
  } catch (error) {
    console.error('Create share link error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 通过分享链接访问项目
 */
export async function accessSharedProject(
  shareToken: string,
  password?: string
): Promise<{
  success: boolean
  projectId?: string
  permission?: ProjectShare['permission']
  error?: string
}> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    // 查找分享记录
    const { data: share, error: fetchError } = await supabase
      .from('project_shares')
      .select('*')
      .eq('share_token', shareToken)
      .single()

    if (fetchError) throw new Error('Share link not found')

    // 检查是否过期
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      throw new Error('Share link has expired')
    }

    // 检查使用次数
    if (share.max_uses && share.use_count >= share.max_uses) {
      throw new Error('Share link has reached maximum uses')
    }

    // 检查密码
    if (share.password && share.password !== password) {
      throw new Error('Invalid password')
    }

    // 更新使用次数
    await supabase
      .from('project_shares')
      .update({ use_count: share.use_count + 1 })
      .eq('id', share.id)

    return {
      success: true,
      projectId: share.project_id,
      permission: share.permission,
    }
  } catch (error) {
    console.error('Access shared project error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 获取项目的所有分享链接
 */
export async function getProjectShares(
  projectId: string
): Promise<{ success: boolean; shares?: ProjectShare[]; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { data, error } = await supabase
      .from('project_shares')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      success: true,
      shares: data,
    }
  } catch (error) {
    console.error('Get project shares error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 删除分享链接
 */
export async function deleteShareLink(
  shareId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { error } = await supabase
      .from('project_shares')
      .delete()
      .eq('id', shareId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Delete share link error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================
// 协作者管理
// ============================================

/**
 * 邀请协作者
 */
export async function inviteCollaborator(params: {
  projectId: string
  userEmail: string
  role: ProjectCollaborator['role']
}): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // 查找被邀请用户
    const { data: invitedUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', params.userEmail)
      .single()

    if (userError) throw new Error('User not found')

    // 检查是否已经是协作者
    const { data: existing } = await supabase
      .from('project_collaborators')
      .select('id')
      .eq('project_id', params.projectId)
      .eq('user_id', invitedUser.id)
      .single()

    if (existing) {
      throw new Error('User is already a collaborator')
    }

    // 创建邀请
    const { error } = await supabase
      .from('project_collaborators')
      .insert({
        project_id: params.projectId,
        user_id: invitedUser.id,
        role: params.role,
        invited_by: user.id,
        status: 'pending',
      })

    if (error) throw error

    // TODO: 发送邀请邮件

    return { success: true }
  } catch (error) {
    console.error('Invite collaborator error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 接受协作邀请
 */
export async function acceptInvitation(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { error } = await supabase
      .from('project_collaborators')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitationId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Accept invitation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 拒绝协作邀请
 */
export async function declineInvitation(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { error } = await supabase
      .from('project_collaborators')
      .update({ status: 'declined' })
      .eq('id', invitationId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Decline invitation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 获取项目协作者
 */
export async function getProjectCollaborators(
  projectId: string
): Promise<{ success: boolean; collaborators?: any[]; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { data, error } = await supabase
      .from('project_collaborators')
      .select(`
        *,
        user:profiles(id, email, full_name, avatar_url)
      `)
      .eq('project_id', projectId)
      .eq('status', 'accepted')

    if (error) throw error

    return {
      success: true,
      collaborators: data,
    }
  } catch (error) {
    console.error('Get project collaborators error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 移除协作者
 */
export async function removeCollaborator(
  collaboratorId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { error } = await supabase
      .from('project_collaborators')
      .delete()
      .eq('id', collaboratorId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Remove collaborator error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================
// 评论功能
// ============================================

/**
 * 添加评论
 */
export async function addComment(params: {
  projectId: string
  content: string
  position?: { x: number; y: number }
  threadId?: string
}): Promise<{ success: boolean; comment?: Comment; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('project_comments')
      .insert({
        project_id: params.projectId,
        user_id: user.id,
        content: params.content,
        position: params.position,
        thread_id: params.threadId,
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      comment: data,
    }
  } catch (error) {
    console.error('Add comment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 获取项目评论
 */
export async function getProjectComments(
  projectId: string
): Promise<{ success: boolean; comments?: any[]; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { data, error } = await supabase
      .from('project_comments')
      .select(`
        *,
        user:profiles(id, email, full_name, avatar_url)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      success: true,
      comments: data,
    }
  } catch (error) {
    console.error('Get project comments error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 删除评论
 */
export async function deleteComment(
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { error } = await supabase
      .from('project_comments')
      .delete()
      .eq('id', commentId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Delete comment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================
// 辅助函数
// ============================================

/**
 * 生成分享 token
 */
function generateShareToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * 生成分享链接
 */
export function generateShareUrl(shareToken: string): string {
  const baseUrl = window.location.origin
  return `${baseUrl}/share/${shareToken}`
}

/**
 * 检查用户权限
 */
export async function checkUserPermission(
  projectId: string,
  userId: string
): Promise<{
  success: boolean
  role?: ProjectCollaborator['role']
  error?: string
}> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    // 检查是否是项目拥有者
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single()

    if (project?.user_id === userId) {
      return { success: true, role: 'owner' }
    }

    // 检查是否是协作者
    const { data: collaborator } = await supabase
      .from('project_collaborators')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .single()

    if (collaborator) {
      return { success: true, role: collaborator.role }
    }

    return { success: true, role: undefined }
  } catch (error) {
    console.error('Check user permission error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

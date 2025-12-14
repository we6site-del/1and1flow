import { supabase } from './supabase'

/**
 * 初始化 Supabase Storage buckets
 */
export async function initializeStorage() {
  if (!supabase) {
    console.warn('⚠ Supabase 未配置，跳过 Storage 初始化')
    return false
  }

  try {
    // 检查 user-assets bucket 是否存在
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error('✗ 获取 Storage buckets 失败:', listError)
      return false
    }

    const userAssetsBucket = buckets?.find(b => b.name === 'user-assets')

    if (!userAssetsBucket) {
      console.log('📦 创建 user-assets bucket...')

      // 创建 bucket
      const { error: createError } = await supabase.storage.createBucket('user-assets', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/*', 'video/*', 'audio/*']
      })

      if (createError) {
        console.error('✗ 创建 bucket 失败:', createError)
        console.log('💡 提示：请在 Supabase Dashboard 中手动创建 user-assets bucket')
        console.log('   设置为 Public bucket，允许的文件类型：image/*, video/*, audio/*')
        return false
      }

      console.log('✓ user-assets bucket 创建成功')
    } else {
      console.log('✓ user-assets bucket 已存在')
    }

    return true
  } catch (error) {
    console.error('✗ Storage 初始化错误:', error)
    return false
  }
}

/**
 * 上传文件到 Storage
 */
export async function uploadFile(
  bucketName: string,
  filePath: string,
  file: File
): Promise<{ url: string | null; error: Error | null }> {
  if (!supabase) {
    return { url: null, error: new Error('Supabase 未配置') }
  }

  try {
    // 上传文件
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return { url: null, error: uploadError }
    }

    // 获取公开 URL
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return { url: data.publicUrl, error: null }
  } catch (error) {
    return { url: null, error: error as Error }
  }
}

/**
 * 删除文件
 */
export async function deleteFile(
  bucketName: string,
  filePath: string
): Promise<boolean> {
  if (!supabase) return false

  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      console.error('✗ 删除文件失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('✗ 删除文件错误:', error)
    return false
  }
}

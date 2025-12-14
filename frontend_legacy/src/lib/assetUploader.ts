import { supabase } from './supabase'
import { uploadUserAsset } from './database'
import type { TLAsset, Editor } from 'tldraw'

/**
 * 上传tldraw资产到Supabase
 */
export async function uploadAssetToSupabase(
  asset: TLAsset,
  file: File,
  userId: string,
  projectId: string
): Promise<string | null> {
  try {
    console.log('📤 正在上传资产到Supabase:', file.name)

    // 上传文件到数据库
    const uploadedAsset = await uploadUserAsset(userId, file, projectId)

    if (!uploadedAsset) {
      console.error('✗ 资产上传失败')
      return null
    }

    console.log('✓ 资产上传成功:', uploadedAsset.file_url)
    return uploadedAsset.file_url
  } catch (error) {
    console.error('✗ 上传资产错误:', error)
    return null
  }
}

/**
 * 设置tldraw编辑器的资产上传处理器
 */
export function setupAssetUploader(
  editor: Editor,
  userId: string,
  projectId: string
) {
  // 监听资产创建事件
  const handleAssetCreate = async (asset: TLAsset) => {
    // 只处理图片和视频资产
    if (asset.type !== 'image' && asset.type !== 'video') {
      return
    }

    // 如果资产已经有URL（不是blob），跳过
    if (asset.props.src && !asset.props.src.startsWith('blob:')) {
      return
    }

    try {
      // 从blob URL获取文件
      const blob = asset.props.src ? await fetch(asset.props.src).then(r => r.blob()) : null

      if (!blob) {
        console.warn('⚠ 无法获取资产blob:', asset.id)
        return
      }

      // 创建文件对象
      const fileName = asset.props.name || `asset-${Date.now()}.${blob.type.split('/')[1]}`
      const file = new File([blob], fileName, { type: blob.type })

      // 上传到Supabase
      const url = await uploadAssetToSupabase(asset, file, userId, projectId)

      if (url) {
        // 更新资产URL
        editor.updateAssets([{
          ...asset,
          props: {
            ...asset.props,
            src: url
          }
        }])

        console.log('✓ 资产URL已更新为Supabase URL')
      }
    } catch (error) {
      console.error('✗ 处理资产创建错误:', error)
    }
  }

  // 监听编辑器的资产变化
  const cleanup = editor.store.listen(
    (change) => {
      for (const record of Object.values(change.changes.added)) {
        if (record.typeName === 'asset') {
          handleAssetCreate(record as TLAsset)
        }
      }
    },
    { source: 'user', scope: 'document' }
  )

  return cleanup
}

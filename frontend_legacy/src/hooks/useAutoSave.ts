import { useEffect, useRef, useCallback, useState } from 'react'
import { Editor } from 'tldraw'
import { saveProjectCanvas } from '../lib/database'
import { useUserStore } from '../stores/userStore'

interface UseAutoSaveOptions {
  projectId: string | null
  enabled?: boolean
  interval?: number // milliseconds
  onSave?: (success: boolean) => void
  onError?: (error: Error) => void
}

/**
 * 自动保存 Hook
 * 每隔指定时间自动保存画布数据到数据库
 */
export function useAutoSave(
  editor: Editor | null,
  options: UseAutoSaveOptions
) {
  const {
    projectId,
    enabled = true,
    interval = 30000, // 默认30秒
    onSave,
    onError,
  } = options

  const { isAuthenticated, user } = useUserStore()
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedDataRef = useRef<string>('')
  const isSavingRef = useRef(false)

  // 保存函数
  const save = useCallback(async () => {
    if (!editor || !projectId || !isAuthenticated || isSavingRef.current) {
      return
    }

    try {
      isSavingRef.current = true

      // 获取当前画布数据
      const currentData = editor.store.getSnapshot()
      const currentDataStr = JSON.stringify(currentData)

      // 检查是否有变化
      if (currentDataStr === lastSavedDataRef.current) {
        console.log('📦 No changes to save')
        isSavingRef.current = false
        return
      }

      console.log('💾 Auto-saving project...')

      // 保存到数据库
      const success = await saveProjectCanvas(projectId, currentData)

      if (success) {
        lastSavedDataRef.current = currentDataStr
        console.log('✅ Auto-save successful')
        onSave?.(true)
      } else {
        console.error('❌ Auto-save failed')
        onSave?.(false)
      }
    } catch (error) {
      console.error('❌ Auto-save error:', error)
      onError?.(error as Error)
      onSave?.(false)
    } finally {
      isSavingRef.current = false
    }
  }, [editor, projectId, isAuthenticated, onSave, onError])

  // 设置定时保存
  useEffect(() => {
    if (!enabled || !editor || !projectId || !isAuthenticated) {
      return
    }

    // 立即保存一次（初始化）
    const initialData = editor.store.getSnapshot()
    lastSavedDataRef.current = JSON.stringify(initialData)

    // 设置定时器
    const scheduleNextSave = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        save().then(() => {
          // 保存完成后安排下一次保存
          scheduleNextSave()
        })
      }, interval)
    }

    scheduleNextSave()

    // 清理函数
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [enabled, editor, projectId, isAuthenticated, interval, save])

  // 手动保存函数
  const manualSave = useCallback(() => {
    return save()
  }, [save])

  // 监听用户离开页面，保存数据
  useEffect(() => {
    if (!enabled || !editor || !projectId) {
      return
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 同步保存（注意：这可能不会完成）
      save()

      // 如果有未保存的更改，提示用户
      const currentData = JSON.stringify(editor.store.getSnapshot())
      if (currentData !== lastSavedDataRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [enabled, editor, projectId, save])

  return {
    save: manualSave,
    isSaving: isSavingRef.current,
  }
}

/**
 * 保存状态指示器 Hook
 */
export function useSaveStatus() {
  const [status, setStatus] = useState<'saved' | 'saving' | 'error' | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const handleSave = useCallback((success: boolean) => {
    if (success) {
      setStatus('saved')
      setLastSaved(new Date())

      // 3秒后隐藏指示器
      setTimeout(() => setStatus(null), 3000)
    } else {
      setStatus('error')

      // 5秒后隐藏错误
      setTimeout(() => setStatus(null), 5000)
    }
  }, [])

  const handleSaving = useCallback(() => {
    setStatus('saving')
  }, [])

  return {
    status,
    lastSaved,
    handleSave,
    handleSaving,
  }
}

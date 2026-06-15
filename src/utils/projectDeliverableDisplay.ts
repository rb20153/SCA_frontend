import type { DeliverableSourceMode, DeliverableType } from '@/types/project'
import dayjs from 'dayjs'

export const DELIVERABLE_SOURCE_MODE_LABEL: Record<DeliverableSourceMode, string> = {
  'repo-pull': '三方仓库拉取',
  'upload-source-package': '上传源码包',
  'upload-file': '上传文件',
}

export const DELIVERABLE_TYPE_LABEL: Record<DeliverableType, string> = {
  source: '源码',
  binary: '二进制',
}

/** 交付物类型 Tag 颜色 */
export const DELIVERABLE_TYPE_COLOR: Record<DeliverableType, string> = {
  source: 'purple',
  binary: 'orange',
}

/** 二进制交付物允许上传的后缀 */
export const BINARY_DELIVERABLE_EXTENSIONS = ['.a', '.so', '.dll'] as const

/** 项目交付物表格横向滚动宽度 */
export const PROJECT_DELIVERABLE_TABLE_SCROLL_X = 1280

/**
 * 格式化交付物大小为可读字符串
 * @param sizeBytes - 字节数；仓库拉取可为 0 显示「—」
 */
export function formatDeliverableSize(sizeBytes: number, sourceMode: DeliverableSourceMode): string {
  if (sourceMode === 'repo-pull' || sizeBytes <= 0) {
    return '—'
  }
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`
  }
  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`
  }
  if (sizeBytes < 1024 * 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
  }
  return `${(sizeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

/**
 * 格式化上传时间为列表展示（YYYY-MM-DD HH:mm）
 * @param value - ISO 8601 字符串
 */
export function formatDeliverableUploadedAt(value: string): string {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : '—'
}

/**
 * 复制文本到剪贴板
 * @param text - 要复制的文本
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}
